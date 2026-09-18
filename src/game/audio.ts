/** Web Audio synth + frenzy sample + sparse near-prize voice. */

import { FAST_SPEED, FRENZY_SPEED } from "./types";

let ctx: AudioContext | null = null;
let unlocked = false;
let muted = false;
let lastWet = 0;
let lastSloppy = 0;
let lastMoan = 0;
let lastVoice = 0;
let master: GainNode | null = null;
let frenzyBuffer: AudioBuffer | null = null;
let frenzyLoad: Promise<void> | null = null;
let mobileBoost = false;

const VOICE_FRENZY_MIN = 0.72;
const SLOPPY_FRENZY_MIN = 0.52;
const VOICE_COOLDOWN_MS = 3800;
const MOAN_COOLDOWN_MS = 1400;

const FRENZY_RATE_MIN = 0.68;
const FRENZY_RATE_MAX = 1.38;

const FRENZY_SFX_URL = "/sfx/frenzy.wav";

function isMobileDevice(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const coarse =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(pointer: coarse)").matches;
  const touch = navigator.maxTouchPoints > 0;
  return (
    coarse ||
    touch ||
    /Android|iPhone|iPad|iPod|Mobile|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua)
  );
}

function masterGainValue(): number {
  if (muted) return 0;
  return mobileBoost ? 1.55 : 0.95;
}

export function setMuted(v: boolean): void {
  muted = v;
  if (master) master.gain.value = masterGainValue();
  if (v) stopVoice();
}

export function isMuted(): boolean {
  return muted;
}

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    mobileBoost = isMobileDevice();
    master = ctx.createGain();
    master.gain.value = masterGainValue();
    master.connect(ctx.destination);
  }
  return ctx;
}

function out(): AudioNode {
  return master ?? getCtx()!.destination;
}

function sfxBoost(base: number): number {
  return base * (mobileBoost ? 1.35 : 1);
}

function randRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function randomFrenzyRate(): number {
  const roll = Math.random();
  if (roll < 0.4) return randRange(FRENZY_RATE_MIN, 0.92);
  if (roll < 0.65) return randRange(0.95, 1.08);
  return randRange(1.12, FRENZY_RATE_MAX);
}

async function loadFrenzySample(): Promise<void> {
  const c = getCtx();
  if (!c || frenzyBuffer) return;
  try {
    const res = await fetch(FRENZY_SFX_URL);
    if (!res.ok) return;
    const arr = await res.arrayBuffer();
    frenzyBuffer = await c.decodeAudioData(arr.slice(0));
  } catch {
    /* keep synth fallback */
  }
}

export async function unlockAudio(): Promise<void> {
  const c = getCtx();
  if (!c) return;
  mobileBoost = isMobileDevice();
  if (master) master.gain.value = masterGainValue();
  if (c.state === "suspended") {
    try {
      await c.resume();
    } catch {
      /* ignore */
    }
  }
  unlocked = c.state === "running";
  if (!frenzyLoad) frenzyLoad = loadFrenzySample();
  await frenzyLoad;
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    try {
      window.speechSynthesis.getVoices();
    } catch {
      /* ignore */
    }
  }
}

function tone(
  freq: number,
  duration: number,
  type: OscillatorType,
  gain = 0.04,
  when = 0,
) {
  const c = getCtx();
  if (!c || !unlocked || muted) return;
  const t0 = c.currentTime + when;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  const vol = sfxBoost(gain);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(g);
  g.connect(out());
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

function noiseBurst(
  duration: number,
  gain: number,
  filterFreq: number,
  q = 1.2,
  type: BiquadFilterType = "bandpass",
) {
  const c = getCtx();
  if (!c || !unlocked) return;
  const n = Math.max(1, Math.floor(c.sampleRate * duration));
  const buf = c.createBuffer(1, n, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < n; i++) {
    const env = Math.sin((i / n) * Math.PI);
    data[i] = (Math.random() * 2 - 1) * env;
  }
  const src = c.createBufferSource();
  src.buffer = buf;
  const filter = c.createBiquadFilter();
  filter.type = type;
  filter.frequency.value = filterFreq;
  filter.Q.value = q;
  const g = c.createGain();
  const t0 = c.currentTime;
  const vol = sfxBoost(gain);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  src.connect(filter);
  filter.connect(g);
  g.connect(out());
  src.start(t0);
  src.stop(t0 + duration + 0.02);
}

export function playWetPop(intensity = 0.6) {
  const now = performance.now();
  if (now - lastWet < 70) return;
  lastWet = now;
  const i = Math.min(1, Math.max(0.2, intensity));
  noiseBurst(0.05 + i * 0.04, 0.08 + i * 0.09, 280 + i * 420, 0.9, "lowpass");
  noiseBurst(0.03 + i * 0.02, 0.04 + i * 0.05, 900 + i * 800, 2.4, "bandpass");
  tone(120 + i * 80, 0.04, "sine", 0.025 + i * 0.025);
  tone(90 + Math.random() * 40, 0.06, "triangle", 0.02);
}

export function playSloppyNearFrenzy(frenzy: number, speedIntensity: number) {
  if (frenzy < SLOPPY_FRENZY_MIN) return;
  const now = performance.now();
  const t = Math.min(1, (frenzy - SLOPPY_FRENZY_MIN) / (1 - SLOPPY_FRENZY_MIN));
  const gap = 140 - t * 95;
  if (now - lastSloppy < gap) return;
  lastSloppy = now;

  const wet = 0.45 + t * 0.55 + speedIntensity * 0.2;

  noiseBurst(0.07 + t * 0.06, 0.1 + wet * 0.12, 160 + t * 120, 0.7, "lowpass");
  noiseBurst(0.05 + t * 0.04, 0.07 + wet * 0.1, 420 + t * 280, 1.1, "lowpass");
  noiseBurst(
    0.028 + t * 0.02,
    0.05 + wet * 0.06,
    1100 + Math.random() * 700,
    3.2,
    "bandpass",
  );
  tone(70 + Math.random() * 35, 0.07 + t * 0.04, "sine", 0.03 + wet * 0.04);
  tone(110 + Math.random() * 50, 0.05, "triangle", 0.02 + wet * 0.03);

  if (t > 0.65 && Math.random() < 0.55) {
    noiseBurst(0.04, 0.06 + wet * 0.05, 700 + Math.random() * 400, 2.8, "bandpass");
    tone(50 + Math.random() * 20, 0.09, "sine", 0.035);
  }
  if (t > 0.88) {
    noiseBurst(0.035, 0.09, 350 + Math.random() * 200, 1.4, "lowpass");
    tone(95, 0.04, "sine", 0.04);
  }
}

function playFormantMoan(intensity: number, pitchScale = 1, underVoice = false) {
  const c = getCtx();
  if (!c || !unlocked) return;
  const t0 = c.currentTime;
  const base = (280 + intensity * 90 + Math.random() * 30) * pitchScale;
  const g = c.createGain();
  const duck = underVoice ? 0.55 : 1;
  const peak = sfxBoost(0.045 + intensity * 0.04) * duck;
  const stretch = pitchScale < 1 ? 1 / Math.max(0.55, pitchScale) : 1;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(peak, t0 + 0.05 * stretch);
  g.gain.exponentialRampToValueAtTime(peak * 0.4, t0 + 0.22 * stretch);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.48 * stretch);
  g.connect(out());

  for (const [mult, type, vol] of [
    [1, "sine", 1],
    [1.5, "triangle", 0.35],
    [2.1, "sine", 0.2],
  ] as const) {
    const osc = c.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(base * mult, t0);
    osc.frequency.exponentialRampToValueAtTime(base * mult * 1.2, t0 + 0.18 * stretch);
    osc.frequency.exponentialRampToValueAtTime(base * mult * 0.94, t0 + 0.42 * stretch);
    const og = c.createGain();
    og.gain.value = vol * 0.45;
    osc.connect(og);
    og.connect(g);
    osc.start(t0);
    osc.stop(t0 + 0.5 * stretch);
  }
}

const VOICE_LINES = [
  // Core
  "uwu",
  "don't stop",
  "oh my god",
  "you're going to make me",
  "I'm about to bust",
  "I'm bussing",
  "right there",
  "please",
  "keep going",
  "I can't",
  "that's so good",
  "wait wait wait",
  "I'm so close",
  "yes yes yes",
  "oh no",
  "bro stop I'm gonna",
  "this is crazy",
  "I live here now",
  "skill issue if you stop",
  "mmph",
  "ahh",
  // Awkward / funny one-liners
  "I swear I never don't normally do this",
  "omg we just met",
  "can you drive me to work?",
  "I have a meeting in five minutes",
  "my roommate is home",
  "this is not a date",
  "do you want my Spotify?",
  "I don't usually finish this fast",
  "wait is this free to play?",
  "are you even real?",
  "I was just gonna check stats",
  "one more prize then I sleep",
  "my hand is getting tired",
  "okay that one counted",
  "I think I pulled something",
  "don't tell my group chat",
  "this better not show up on my screen time",
  "I came here for the upgrades",
  "is BEAN GOD a real job?",
  "why is this so effective",
  "I'm late for everything now",
  "can we put a ring on it",
  "I need water after this",
  "that was unprofessional of me",
  "I'm not like other players",
  "please don't stop the audio",
  "I thought this was a productivity app",
  "my boss just messaged me",
  "okay but seriously don't stop",
  "I can explain this scientifically",
];

function pickVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  const prefer = voices.find(
    (v) =>
      /female|samantha|karen|zira|google uk english female|google us english|victoria|fiona|moira|tessa/i.test(
        v.name,
      ) || /en(-|_)?(us|gb|au)/i.test(v.lang),
  );
  return prefer ?? voices.find((v) => v.lang.startsWith("en")) ?? voices[0] ?? null;
}

function isSpeechActive(): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  try {
    return window.speechSynthesis.speaking || window.speechSynthesis.pending;
  } catch {
    return false;
  }
}

export function stopVoice() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    /* ignore */
  }
}

function tryPlayMoan(intensity: number) {
  const now = performance.now();
  if (now - lastMoan < MOAN_COOLDOWN_MS) return;
  lastMoan = now;
  playFormantMoan(intensity, 1, isSpeechActive());
}

function tryPlaySpeechLine(intensity: number) {
  const now = performance.now();
  if (now - lastVoice < VOICE_COOLDOWN_MS) return;
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  if (isSpeechActive()) return;

  lastVoice = now;
  try {
    const line =
      VOICE_LINES[Math.floor(Math.random() * VOICE_LINES.length)] ?? "don't stop";
    const u = new SpeechSynthesisUtterance(line);
    u.pitch = 1.45 + Math.random() * 0.4;
    u.rate = 0.92 + Math.random() * 0.18;
    u.volume = mobileBoost
      ? Math.min(1, 0.85 + intensity * 0.15)
      : Math.min(0.9, 0.55 + intensity * 0.35);
    const voice = pickVoice();
    if (voice) u.voice = voice;
    window.speechSynthesis.speak(u);
  } catch {
    /* ignore */
  }
}

function playNearPrizeVoice(intensity: number) {
  tryPlayMoan(intensity);
  tryPlaySpeechLine(intensity);
}

export function playRubFeedback(
  speedPxPerSec: number,
  heat: number,
  frenzy: number,
  rubbing: boolean,
): boolean {
  if (muted) return speedPxPerSec > FRENZY_SPEED;
  const fast = speedPxPerSec > FAST_SPEED;
  const reallyFast = speedPxPerSec > FRENZY_SPEED;
  const intensity = Math.min(1, speedPxPerSec / 2000);

  if (speedPxPerSec > 200) {
    playRubTick(Math.min(1, intensity * 0.7 + heat * 0.3));
  }

  if (fast) {
    playWetPop(0.35 + intensity * 0.55);
  }

  if (rubbing && speedPxPerSec > FAST_SPEED * 0.75 && frenzy >= SLOPPY_FRENZY_MIN) {
    playSloppyNearFrenzy(frenzy, intensity);
  }

  const nearPrize = frenzy >= VOICE_FRENZY_MIN;
  if (rubbing && reallyFast && nearPrize) {
    playNearPrizeVoice(0.55 + frenzy * 0.35 + intensity * 0.15);
  }

  return reallyFast;
}

export function playRubTick(intensity: number) {
  const f = 180 + intensity * 420;
  tone(f, 0.045, "sine", 0.016 + intensity * 0.025);
}

export function playBuy() {
  tone(440, 0.08, "triangle", 0.04);
  tone(660, 0.1, "sine", 0.03, 0.05);
}

export function playClimax() {
  tone(220, 0.25, "sine", 0.055);
  tone(330, 0.3, "triangle", 0.045, 0.05);
  tone(440, 0.35, "sine", 0.035, 0.12);
  tone(550, 0.4, "sine", 0.03, 0.2);
  playWetPop(0.95);
}

export function playStart() {
  tone(260, 0.12, "sine", 0.045);
  tone(390, 0.16, "triangle", 0.035, 0.08);
  if (!frenzyLoad) frenzyLoad = loadFrenzySample();
}

function playFrenzySample(gain = 0.95, rate = 1): boolean {
  const c = getCtx();
  if (!c || !unlocked || muted) return false;
  if (!frenzyBuffer) {
    if (!frenzyLoad) frenzyLoad = loadFrenzySample();
    return false;
  }
  const src = c.createBufferSource();
  src.buffer = frenzyBuffer;
  const r = Math.min(FRENZY_RATE_MAX, Math.max(FRENZY_RATE_MIN * 0.9, rate));
  src.playbackRate.value = r;
  const g = c.createGain();
  const rateGain = r < 0.9 ? 1.08 : r > 1.2 ? 0.96 : 1;
  g.gain.value = sfxBoost(gain) * (mobileBoost ? 1.1 : 1) * rateGain;
  src.connect(g);
  g.connect(out());
  src.start(c.currentTime);
  return true;
}

function playPrizeSynth(rate: number) {
  const p = rate;
  const d = 1 / Math.min(1.25, Math.max(0.7, p));
  tone(523 * p, 0.12 * d, "sine", 0.055);
  tone(659 * p, 0.14 * d, "triangle", 0.045, 0.08 * d);
  tone(784 * p, 0.2 * d, "sine", 0.05, 0.16 * d);
  tone(1046 * p, 0.28 * d, "sine", 0.035, 0.28 * d);
  playFormantMoan(0.9, p, isSpeechActive());
}

export function playPrize() {
  playSloppyNearFrenzy(1, 1);
  const rate = randomFrenzyRate();
  const played = playFrenzySample(1.05, rate);
  if (!played) {
    playPrizeSynth(rate);
  } else if (!isSpeechActive()) {
    playFormantMoan(0.75, rate, false);
  } else {
    playFormantMoan(0.55, rate, true);
  }
}

export function playBeanMaster() {
  stopVoice();
  tone(392, 0.12, "sine", 0.055);
  tone(523, 0.14, "triangle", 0.05, 0.1);
  tone(659, 0.16, "sine", 0.055, 0.2);
  tone(784, 0.22, "triangle", 0.05, 0.32);
  tone(1046, 0.35, "sine", 0.045, 0.48);
  tone(1319, 0.4, "sine", 0.035, 0.62);
}
