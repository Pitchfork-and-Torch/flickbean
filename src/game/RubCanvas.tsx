import { useEffect, useRef } from "react";
import { playRubFeedback, stopVoice } from "./audio";
import { prefersReducedMotion } from "./motion";
import { useGame } from "./store";
import { FRENZY_SPEED } from "./types";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  hue: number;
};

type Trail = { x: number; y: number; life: number };

/** Water droplet burst on frenzy prize */
type Droplet = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  /** stretch along velocity for motion blur feel */
  stretch: number;
  /** 0 clear water → 1 pink-tinted */
  tint: number;
};

export function RubCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const applyRub = useGame((s) => s.applyRub);
  const setRubbing = useGame((s) => s.setRubbing);
  const tick = useGame((s) => s.tick);
  const started = useGame((s) => s.started);

  const simRef = useRef({
    lastX: 0,
    lastY: 0,
    lastMoveT: 0,
    hasLast: false,
    pointerDown: false,
    particles: [] as Particle[],
    trails: [] as Trail[],
    droplets: [] as Droplet[],
    lastFrenzyKey: 0,
    lastTickAudio: 0,
    pulse: 0,
    orbScale: 1,
    time: 0,
    pointerId: -1,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let last = performance.now();
    let w = 0;
    let h = 0;
    let dpr = 1;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = container.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    const toLocal = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const emit = (x: number, y: number, speed: number, heat: number) => {
      const sim = simRef.current;
      const n = prefersReducedMotion() ? 0 : Math.min(8, 1 + Math.floor(speed / 6));
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = 20 + speed * 0.6 + Math.random() * 40;
        sim.particles.push({
          x,
          y,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp - 20,
          life: 0,
          max: 0.35 + Math.random() * 0.45,
          size: 2 + Math.random() * 3 + heat * 2,
          hue: 350 + heat * 20 + Math.random() * 15,
        });
      }
      if (sim.particles.length > 200) {
        sim.particles.splice(0, sim.particles.length - 200);
      }
      sim.trails.push({ x, y, life: 1 });
      if (sim.trails.length > 48) sim.trails.shift();
    };

    /** Burst of water droplets from orb on frenzy prize */
    const emitWaterBurst = (cx: number, cy: number, power = 1) => {
      const sim = simRef.current;
      const count = Math.floor(36 + power * 22);
      for (let i = 0; i < count; i++) {
        // Prefer upper hemisphere + wide spray
        const a = -Math.PI * 0.15 - Math.random() * Math.PI * 0.7 + (Math.random() - 0.5) * 0.9;
        const sp = 180 + Math.random() * 420 * power;
        const size = 2.2 + Math.random() * 5.5;
        sim.droplets.push({
          x: cx + (Math.random() - 0.5) * 24,
          y: cy + (Math.random() - 0.5) * 18,
          vx: Math.cos(a) * sp * (0.7 + Math.random() * 0.6),
          vy: Math.sin(a) * sp - 80 - Math.random() * 120,
          life: 0,
          max: 0.55 + Math.random() * 0.75,
          size,
          stretch: 1.4 + Math.random() * 1.8,
          tint: Math.random() * 0.45,
        });
      }
      // A few big slow blobs
      for (let i = 0; i < 6; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = 60 + Math.random() * 140;
        sim.droplets.push({
          x: cx,
          y: cy,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp - 40,
          life: 0,
          max: 0.9 + Math.random() * 0.5,
          size: 6 + Math.random() * 8,
          stretch: 1.1,
          tint: 0.15 + Math.random() * 0.25,
        });
      }
      if (sim.droplets.length > 180) {
        sim.droplets.splice(0, sim.droplets.length - 180);
      }
    };

    const onDown = (e: PointerEvent) => {
      if (!useGame.getState().started) return;
      e.preventDefault();
      const sim = simRef.current;
      sim.pointerDown = true;
      sim.pointerId = e.pointerId;
      sim.hasLast = false;
      sim.lastMoveT = performance.now();
      setRubbing(true);
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      const p = toLocal(e.clientX, e.clientY);
      sim.lastX = p.x;
      sim.lastY = p.y;
      sim.hasLast = true;
    };

    const onMove = (e: PointerEvent) => {
      const sim = simRef.current;
      if (!sim.pointerDown || e.pointerId !== sim.pointerId) return;
      e.preventDefault();
      const p = toLocal(e.clientX, e.clientY);
      const now = performance.now();
      if (!sim.hasLast) {
        sim.lastX = p.x;
        sim.lastY = p.y;
        sim.lastMoveT = now;
        sim.hasLast = true;
        return;
      }
      const dx = p.x - sim.lastX;
      const dy = p.y - sim.lastY;
      const dist = Math.hypot(dx, dy);
      if (dist < 0.5) return;

      const dtMs = Math.max(1, now - sim.lastMoveT);
      const dtSec = dtMs / 1000;
      const speed = (dist / dtMs) * 1000;

      const cx = w * 0.5;
      const cy = h * 0.48;
      const sensitive = useGame.getState().upgrades.sensitiveSpot;
      const baseR = Math.min(w, h) * (0.16 + sensitive * 0.01);
      const dCenter = Math.hypot(p.x - cx, p.y - cy);
      const quality = Math.max(
        0.15,
        1 - Math.max(0, dCenter - baseR * 0.35) / (baseR * 1.8),
      );

      applyRub(dist, p.x, p.y, quality, speed, dtSec);

      const state = useGame.getState();
      emit(p.x, p.y, dist, state.heat);
      sim.orbScale = Math.min(
        1.22,
        sim.orbScale + dist * 0.0012 + (speed > FRENZY_SPEED ? 0.01 : 0),
      );
      sim.pulse = Math.min(1, sim.pulse + dist * 0.008);

      if (now - sim.lastTickAudio > 40) {
        playRubFeedback(speed, state.heat, state.frenzy, true);
        sim.lastTickAudio = now;
      }

      if (dist > 12 && "vibrate" in navigator) {
        try {
          navigator.vibrate(speed > FRENZY_SPEED ? 2 : 1);
        } catch {
          /* ignore */
        }
      }

      sim.lastX = p.x;
      sim.lastY = p.y;
      sim.lastMoveT = now;
    };

    const onUp = (e: PointerEvent) => {
      const sim = simRef.current;
      if (e.pointerId !== sim.pointerId && sim.pointerId !== -1) return;
      sim.pointerDown = false;
      sim.hasLast = false;
      sim.pointerId = -1;
      setRubbing(false);
      stopVoice();
    };

    canvas.addEventListener("pointerdown", onDown, { passive: false });
    canvas.addEventListener("pointermove", onMove, { passive: false });
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);
    canvas.addEventListener("pointerleave", onUp);

    const loop = (now: number) => {
      const rawDt = (now - last) / 1000;
      const dt = Math.min(0.1, rawDt);
      last = now;
      const sim = simRef.current;
      sim.time += dt;

      if (useGame.getState().started) {
        tick(dt);
      }

      const state = useGame.getState();
      const heat = state.heat;
      const shake = prefersReducedMotion() ? 0 : state.shake;
      const climax = state.climaxFlash;
      const frenzy = state.frenzy;
      const fast = state.lastSpeed >= FRENZY_SPEED;

      // Frenzy prize → water splash
      if (state.frenzyFaceKey > sim.lastFrenzyKey) {
        const cx = w * 0.5;
        const cy = h * 0.48;
        emitWaterBurst(cx, cy, 1 + Math.min(1, state.prizes * 0.02));
        sim.lastFrenzyKey = state.frenzyFaceKey;
        sim.orbScale = Math.min(1.35, sim.orbScale + 0.18);
        sim.pulse = 1;
      }

      sim.orbScale += (1 - sim.orbScale) * (1 - Math.exp(-6 * dt));
      sim.pulse = Math.max(0, sim.pulse - dt * 1.8);

      for (const p of sim.particles) {
        p.life += dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= Math.pow(0.02, dt);
        p.vy *= Math.pow(0.02, dt);
        p.vy -= 30 * dt;
      }
      sim.particles = sim.particles.filter((p) => p.life < p.max);
      for (const t of sim.trails) t.life -= dt * 2.2;
      sim.trails = sim.trails.filter((t) => t.life > 0);

      // Droplet physics  -  gravity + drag
      for (const d of sim.droplets) {
        d.life += dt;
        d.vy += 980 * dt;
        d.vx *= Math.pow(0.35, dt);
        d.x += d.vx * dt;
        d.y += d.vy * dt;
      }
      sim.droplets = sim.droplets.filter((d) => d.life < d.max && d.y < h + 40);

      ctx.clearRect(0, 0, w, h);

      const gBg = ctx.createRadialGradient(
        w * 0.5,
        h * 0.45,
        0,
        w * 0.5,
        h * 0.5,
        Math.max(w, h) * 0.7,
      );
      gBg.addColorStop(
        0,
        `rgba(232, 164, 168, ${0.04 + heat * 0.08 + climax * 0.12 + frenzy * 0.1})`,
      );
      gBg.addColorStop(0.55, "rgba(20, 14, 16, 0.2)");
      gBg.addColorStop(1, "rgba(12, 10, 11, 0)");
      ctx.fillStyle = gBg;
      ctx.fillRect(0, 0, w, h);

      const sx = shake > 0 ? (Math.random() - 0.5) * 14 * shake * shake : 0;
      const sy = shake > 0 ? (Math.random() - 0.5) * 14 * shake * shake : 0;
      ctx.save();
      ctx.translate(sx, sy);

      const cx = w * 0.5;
      const cy = h * 0.48;
      const sensitive = state.upgrades.sensitiveSpot;
      const baseR = Math.min(w, h) * (0.16 + sensitive * 0.01);
      const r =
        baseR *
        sim.orbScale *
        (1 + heat * 0.08 + frenzy * 0.06 + Math.sin(sim.time * 2.2) * 0.02);

      for (let i = 3; i >= 1; i--) {
        const rr = r * (1.15 + i * 0.22 + heat * 0.08 + sim.pulse * 0.06 + frenzy * 0.05);
        ctx.beginPath();
        ctx.arc(cx, cy, rr, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(232, 164, 168, ${0.04 + heat * 0.06 + frenzy * 0.08 + (1 - i / 3) * 0.05})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      const glow = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * 2.2);
      glow.addColorStop(
        0,
        `rgba(240, 184, 168, ${0.25 + heat * 0.45 + climax * 0.35 + frenzy * 0.2})`,
      );
      glow.addColorStop(0.4, `rgba(232, 164, 168, ${0.12 + heat * 0.2})`);
      glow.addColorStop(1, "rgba(232, 164, 168, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 2.2, 0, Math.PI * 2);
      ctx.fill();

      const core = ctx.createRadialGradient(
        cx - r * 0.25,
        cy - r * 0.3,
        r * 0.05,
        cx,
        cy,
        r,
      );
      const warm = 0.55 + heat * 0.35;
      core.addColorStop(0, `rgba(255, 240, 238, ${0.95})`);
      core.addColorStop(0.35, `rgba(248, 200, 196, ${0.9})`);
      core.addColorStop(0.75, `rgba(220, 140, 148, ${warm})`);
      core.addColorStop(1, `rgba(140, 80, 90, ${0.85 + heat * 0.1})`);
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = core;
      ctx.fill();

      ctx.beginPath();
      ctx.ellipse(
        cx - r * 0.28,
        cy - r * 0.32,
        r * 0.22,
        r * 0.14,
        -0.5,
        0,
        Math.PI * 2,
      );
      ctx.fillStyle = `rgba(255, 255, 255, ${0.35 + heat * 0.15})`;
      ctx.fill();

      const ir =
        r * (0.22 + heat * 0.08 + frenzy * 0.05 + Math.sin(sim.time * 3) * 0.015);
      const inner = ctx.createRadialGradient(cx, cy, 0, cx, cy, ir);
      inner.addColorStop(0, `rgba(255, 250, 248, ${0.9})`);
      inner.addColorStop(0.6, `rgba(232, 164, 168, ${0.5 + heat * 0.3})`);
      inner.addColorStop(1, "rgba(100, 50, 58, 0.2)");
      ctx.beginPath();
      ctx.arc(cx, cy, ir, 0, Math.PI * 2);
      ctx.fillStyle = inner;
      ctx.fill();

      if (frenzy > 0.02) {
        ctx.beginPath();
        ctx.arc(cx, cy, r * 1.42, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frenzy);
        ctx.strokeStyle = `rgba(243, 236, 238, ${0.35 + frenzy * 0.45})`;
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.stroke();
      }

      for (const t of sim.trails) {
        ctx.beginPath();
        ctx.arc(t.x, t.y, 3 + t.life * 4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(243, 236, 238, ${t.life * 0.35})`;
        ctx.fill();
      }

      for (const p of sim.particles) {
        const a = 1 - p.life / p.max;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * a, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 55%, ${70 + heat * 10}%, ${a * 0.85})`;
        ctx.fill();
      }

      // Water droplets (teardrop-ish ellipses along velocity)
      for (const d of sim.droplets) {
        const a = 1 - d.life / d.max;
        if (a <= 0.02) continue;
        const speed = Math.hypot(d.vx, d.vy);
        const ang = Math.atan2(d.vy, d.vx);
        const stretch = d.stretch * (1 + Math.min(1.8, speed / 500));
        const rw = d.size * a;
        const rh = rw * stretch;
        ctx.save();
        ctx.translate(d.x, d.y);
        ctx.rotate(ang + Math.PI / 2);
        // Soft body
        const grd = ctx.createRadialGradient(0, -rh * 0.2, 0, 0, 0, rh);
        const pink = d.tint;
        const rC = Math.round(200 + pink * 40);
        const gC = Math.round(230 - pink * 50);
        const bC = Math.round(245 - pink * 30);
        grd.addColorStop(0, `rgba(255, 255, 255, ${0.75 * a})`);
        grd.addColorStop(0.35, `rgba(${rC}, ${gC}, ${bC}, ${0.55 * a})`);
        grd.addColorStop(1, `rgba(${rC - 40}, ${gC - 30}, ${bC - 20}, 0)`);
        ctx.beginPath();
        ctx.ellipse(0, 0, rw * 0.55, rh, 0, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();
        // Specular glint
        ctx.beginPath();
        ctx.ellipse(-rw * 0.12, -rh * 0.28, rw * 0.18, rh * 0.12, -0.4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${0.45 * a})`;
        ctx.fill();
        ctx.restore();
      }

      const nowMs = performance.now();
      for (const f of state.floaters) {
        const age = (nowMs - f.born) / 900;
        if (age < 0 || age > 1) continue;
        const alpha = 1 - age;
        const rise = age * 48;
        const scale =
          f.kind === "climax" || f.kind === "prize" ? 1.25 : f.kind === "passive" ? 0.85 : 1;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.font = `600 ${13 * scale}px ${getComputedStyle(document.body).fontFamily}`;
        ctx.textAlign = "center";
        ctx.fillStyle =
          f.kind === "prize"
            ? "#f3ecee"
            : f.kind === "climax"
              ? "#f3ecee"
              : f.kind === "passive"
                ? "#a89a9e"
                : "#e8a4a8";
        const label =
          f.kind === "prize"
            ? `+${formatShort(f.value)} PRIZE`
            : f.kind === "climax"
              ? `+${formatShort(f.value)} climax`
              : `+${formatShort(f.value)}`;
        ctx.fillText(label, f.x, f.y - rise);
        ctx.restore();
      }

      if (started && !state.rubbing && heat < 0.05 && frenzy < 0.05) {
        const breath = 0.5 + Math.sin(sim.time * 1.6) * 0.5;
        ctx.beginPath();
        ctx.arc(cx, cy, r * (1.55 + breath * 0.08), 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(232, 164, 168, ${0.12 + breath * 0.1})`;
        ctx.lineWidth = 1;
        ctx.setLineDash([6, 10]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      ctx.restore();

      if (climax > 0.01) {
        ctx.fillStyle = `rgba(243, 236, 238, ${climax * 0.18})`;
        ctx.fillRect(0, 0, w, h);
      }

      if (fast && state.rubbing) {
        ctx.fillStyle = `rgba(232, 164, 168, ${0.03 + Math.sin(sim.time * 12) * 0.015})`;
        ctx.fillRect(0, 0, w, h);
      }

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      stopVoice();
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      canvas.removeEventListener("pointerleave", onUp);
    };
  }, [applyRub, setRubbing, tick, started]);

  return (
    <div ref={containerRef} className="absolute inset-0">
      <canvas
        ref={canvasRef}
        className="block h-full w-full touch-none"
        aria-label="Rub surface"
      />
    </div>
  );
}

function formatShort(n: number): string {
  if (n < 10) return n.toFixed(1);
  if (n < 1000) return Math.floor(n).toString();
  if (n < 1_000_000) return `${(n / 1000).toFixed(1)}K`;
  return `${(n / 1_000_000).toFixed(2)}M`;
}
