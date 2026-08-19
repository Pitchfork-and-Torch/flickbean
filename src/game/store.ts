import { create } from "zustand";
import type {
  CollectedFace,
  FloatingNumber,
  GameSnapshot,
  UpgradeId,
} from "./types";
import { FACE_PILE_MAX, FAST_SPEED, FRENZY_SPEED, FRENZY_THRESHOLD } from "./types";
import {
  emptyUpgrades,
  getUpgrade,
  isAllUpgradesMaxed,
  superBoostMult,
  upgradeCostBulk,
} from "./upgrades";
import {
  type AscendId,
  type BadgeId,
  type ChallengeId,
  type MythicId,
  emptyAscend,
  emptyChallenges,
  emptyMythic,
  evaluateChallenges,
  getAscend,
  getMythic,
  isAllAscendMaxed,
  isAllMythicMaxed,
  pathBoostMult,
  skillCostBulk,
  tier2Complete,
  tier3Complete,
} from "./progression";
import { playBeanMaster, playBuy, playClimax, playPrize, setMuted } from "./audio";
import {
  type DailyFlick,
  dailyBonus,
  emptyDaily,
  ensureDaily,
} from "./daily";
import { hapticPulse } from "./haptics";
import { prefersReducedMotion } from "./motion";

const SAVE_KEY = "flickbean-v2";
const SAVE_KEY_LEGACY = "clit-grok-me-v1";
const PRIZE_COOLDOWN = 1.2;

let faceId = 1;
let floaterId = 1;

function makeFace(): CollectedFace {
  const id = faceId++;
  return {
    id,
    rot: (Math.random() - 0.5) * 52,
    x: (Math.random() - 0.5) * 1.7,
    y: Math.random(),
    scale: 0.82 + Math.random() * 0.28,
  };
}

function facesFromCount(n: number): CollectedFace[] {
  const count = Math.min(FACE_PILE_MAX, Math.max(0, Math.floor(n)));
  const out: CollectedFace[] = [];
  for (let i = 0; i < count; i++) out.push(makeFace());
  return out;
}

function loadSave(): Partial<GameSnapshot> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw =
      localStorage.getItem(SAVE_KEY) ?? localStorage.getItem(SAVE_KEY_LEGACY);
    if (!raw) return null;
    return JSON.parse(raw) as GameSnapshot;
  } catch {
    return null;
  }
}

function saveSnapshot(state: GameState) {
  if (typeof window === "undefined") return;
  const snap: GameSnapshot = {
    version: 2,
    rubs: state.rubs,
    totalRubs: state.totalRubs,
    lifetimeDistance: state.lifetimeDistance,
    bestCombo: state.bestCombo,
    climaxes: state.climaxes,
    prizes: state.prizes,
    upgrades: state.upgrades,
    started: state.started,
    beanMaster: state.beanMaster,
    faces: state.faces.slice(-FACE_PILE_MAX),
    ascend: state.ascend,
    mythic: state.mythic,
    challenges: state.challenges,
    orbital: state.orbital,
    voidbean: state.voidbean,
    titleAsO: state.titleAsO,
    muted: state.muted,
    daily: state.daily,
  };
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(snap));
  } catch {
    /* ignore */
  }
}

export type ShopTab = "core" | "ascend" | "mythic" | "path";

export type GameState = {
  rubs: number;
  totalRubs: number;
  lifetimeDistance: number;
  bestCombo: number;
  climaxes: number;
  prizes: number;
  upgrades: Record<UpgradeId, number>;
  ascend: Record<AscendId, number>;
  mythic: Record<MythicId, number>;
  challenges: Record<ChallengeId, boolean>;
  started: boolean;
  heat: number;
  combo: number;
  comboTimer: number;
  rubbing: boolean;
  floaters: FloatingNumber[];
  climaxFlash: number;
  shake: number;
  lastSave: number;
  shopOpen: boolean;
  shopTab: ShopTab;
  statsOpen: boolean;
  frenzy: number;
  lastSpeed: number;
  prizeCooldown: number;
  lastPrizeAmount: number;
  beanMaster: boolean;
  orbital: boolean;
  voidbean: boolean;
  titleAsO: boolean;
  muted: boolean;
  daily: DailyFlick;
  badgeToast: BadgeId | null;
  frenzyFaceKey: number;
  faces: CollectedFace[];
  facesCollected: number;

  start: () => void;
  setShopOpen: (v: boolean) => void;
  setShopTab: (t: ShopTab) => void;
  setStatsOpen: (v: boolean) => void;
  dismissBadgeToast: () => void;
  toggleTitleAsO: () => void;
  setRubbing: (v: boolean) => void;
  applyRub: (
    distancePx: number,
    cx: number,
    cy: number,
    quality: number,
    speedPxPerSec: number,
    dtSec: number,
  ) => void;
  tick: (dt: number) => void;
  buyUpgrade: (id: UpgradeId, count?: number) => boolean;
  buyAscend: (id: AscendId, count?: number) => boolean;
  buyMythic: (id: MythicId, count?: number) => boolean;
  resetProgress: () => void;
  hydrate: () => void;
  setMutedPref: (v: boolean) => void;
  claimDaily: () => boolean;
};

function challengeCtx(state: {
  beanMaster: boolean;
  orbital: boolean;
  voidbean: boolean;
  facesCollected: number;
  bestCombo: number;
  prizes: number;
  climaxes: number;
  lifetimeDistance: number;
  ascend: Record<AscendId, number>;
  mythic: Record<MythicId, number>;
  upgrades: Record<UpgradeId, number>;
}) {
  return {
    beanMaster: state.beanMaster,
    orbital: state.orbital,
    voidbean: state.voidbean,
    facesCollected: state.facesCollected,
    bestCombo: state.bestCombo,
    prizes: state.prizes,
    climaxes: state.climaxes,
    lifetimeDistance: state.lifetimeDistance,
    ascend: state.ascend,
    mythic: state.mythic,
    upgrades: state.upgrades,
  };
}

function progressionPatch(
  state: GameState,
  partial: Partial<GameState>,
): Partial<GameState> {
  const merged = { ...state, ...partial };
  const { next } = evaluateChallenges(merged.challenges, challengeCtx(merged));
  let orbital = merged.orbital;
  let voidbean = merged.voidbean;
  let badgeToast = merged.badgeToast;

  if (merged.beanMaster && isAllAscendMaxed(merged.ascend)) {
    next.ascendSkills = true;
  }
  if (merged.orbital && isAllMythicMaxed(merged.mythic)) {
    next.mythicSkills = true;
  }

  const t2 = tier2Complete(next);
  const t3 = tier3Complete(next);

  if (merged.beanMaster && t2 && !orbital) {
    orbital = true;
    badgeToast = "orbital";
  }
  if (orbital && t3 && !voidbean) {
    voidbean = true;
    badgeToast = "voidbean";
  }

  return {
    challenges: next,
    orbital,
    voidbean,
    badgeToast,
  };
}

function incomeBoost(state: {
  upgrades: Record<UpgradeId, number>;
  prizes: number;
  facesCollected: number;
  ascend: Record<AscendId, number>;
  mythic: Record<MythicId, number>;
  orbital: boolean;
  voidbean: boolean;
}): number {
  const base = superBoostMult(state.upgrades, state.prizes, state.facesCollected);
  const path = pathBoostMult(
    state.ascend,
    state.mythic,
    state.orbital,
    state.voidbean,
  );
  const sing = 1 + (state.mythic.singularity ?? 0) * getMythic("singularity").power;
  return base * path * sing;
}

export const useGame = create<GameState>((set, get) => ({
  rubs: 0,
  totalRubs: 0,
  lifetimeDistance: 0,
  bestCombo: 0,
  climaxes: 0,
  prizes: 0,
  upgrades: emptyUpgrades(),
  ascend: emptyAscend(),
  mythic: emptyMythic(),
  challenges: emptyChallenges(),
  started: false,
  heat: 0,
  combo: 0,
  comboTimer: 0,
  rubbing: false,
  floaters: [],
  climaxFlash: 0,
  shake: 0,
  lastSave: 0,
  shopOpen: false,
  shopTab: "core",
  statsOpen: false,
  frenzy: 0,
  lastSpeed: 0,
  prizeCooldown: 0,
  lastPrizeAmount: 0,
  beanMaster: false,
  orbital: false,
  voidbean: false,
  titleAsO: false,
  muted: false,
  daily: emptyDaily(),
  badgeToast: null,
  frenzyFaceKey: 0,
  faces: [],
  facesCollected: 0,

  hydrate: () => {
    const s = loadSave();
    if (!s) return;
    const upgrades = { ...emptyUpgrades(), ...s.upgrades };
    const beanMaster = Boolean(s.beanMaster) || isAllUpgradesMaxed(upgrades);
    const prizes = s.prizes ?? 0;
    let faces = Array.isArray(s.faces) ? s.faces.slice(-FACE_PILE_MAX) : [];
    if (faces.length === 0 && prizes > 0) faces = facesFromCount(prizes);
    for (const f of faces) {
      if (f.id >= faceId) faceId = f.id + 1;
    }
    const ascend = { ...emptyAscend(), ...s.ascend };
    const mythic = { ...emptyMythic(), ...s.mythic };
    const challenges = { ...emptyChallenges(), ...s.challenges };
    let orbital = Boolean(s.orbital);
    let voidbean = Boolean(s.voidbean);
    if (beanMaster && tier2Complete(challenges)) orbital = true;
    if (orbital && tier3Complete(challenges)) voidbean = true;

    const patch = {
      rubs: s.rubs ?? 0,
      totalRubs: s.totalRubs ?? 0,
      lifetimeDistance: s.lifetimeDistance ?? 0,
      bestCombo: s.bestCombo ?? 0,
      climaxes: s.climaxes ?? 0,
      prizes,
      upgrades,
      beanMaster,
      faces,
      facesCollected: Math.max(prizes, faces.length),
      ascend,
      mythic,
      challenges,
      orbital,
      voidbean,
      titleAsO: Boolean(s.titleAsO) && voidbean,
      muted: Boolean(s.muted),
      daily: ensureDaily(s.daily),
      started: false as const,
    };
    setMuted(Boolean(s.muted));
    const prog = progressionPatch({ ...get(), ...patch }, patch);
    set({ ...patch, ...prog });
  },

  start: () => {
    const daily = ensureDaily(get().daily);
    set({ started: true, daily });
    saveSnapshot(get());
  },

  setMutedPref: (v) => {
    setMuted(v);
    set({ muted: v });
    saveSnapshot(get());
  },

  claimDaily: () => {
    const state = get();
    const daily = ensureDaily(state.daily);
    if (daily.claimed || daily.progressPx < daily.goalPx) {
      set({ daily });
      return false;
    }
    const bonus = dailyBonus(daily.goalPx);
    set({
      daily: { ...daily, claimed: true },
      rubs: state.rubs + bonus,
      totalRubs: state.totalRubs + bonus,
      climaxFlash: 1,
    });
    saveSnapshot(get());
    return true;
  },

  setShopOpen: (v) => {
    const state = get();
    set({ shopOpen: v, statsOpen: v ? false : state.statsOpen });
  },
  setShopTab: (t) => set({ shopTab: t }),
  setStatsOpen: (v) => set({ statsOpen: v, shopOpen: v ? false : get().shopOpen }),
  dismissBadgeToast: () => set({ badgeToast: null }),
  toggleTitleAsO: () => {
    const state = get();
    if (!state.voidbean) return;
    set({ titleAsO: !state.titleAsO });
    saveSnapshot(get());
  },

  setRubbing: (v) => {
    if (!v) set({ lastSpeed: 0 });
    set({ rubbing: v });
  },

  applyRub: (distancePx, cx, cy, quality, speedPxPerSec, dtSec) => {
    const state = get();
    if (!state.started || distancePx <= 0) return;

    const u = state.upgrades;
    const a = state.ascend;
    const m = state.mythic;

    const soft = 1 + u.softTouch * getUpgrade("softTouch").power;
    const heatBuild = 1 + u.warmFingers * getUpgrade("warmFingers").power;
    const spot = 1 + u.sensitiveSpot * getUpgrade("sensitiveSpot").power;
    let rhythm = 0.45 + u.rhythm * getUpgrade("rhythm").power;
    rhythm += (m.infiniteStroke ?? 0) * getMythic("infiniteStroke").power;

    const qFloor =
      (m.godFinger ?? 0) * getMythic("godFinger").power +
      (a.twinPeaks ?? 0) * getAscend("twinPeaks").power;
    const q = Math.min(1, Math.max(quality, qFloor));

    const base = (distancePx / 40) * soft * (0.55 + q * 0.9) * spot;
    const heatMult = 1 + state.heat * 1.8 * (1 + (a.twinPeaks ?? 0) * 0.02);
    const comboMult =
      1 + Math.min(state.combo, 80 + (m.infiniteStroke ?? 0) * 4) * 0.04;
    const speedMult = 1 + Math.min(1.2, speedPxPerSec / 2500);
    const boost = incomeBoost(state);
    let gain = base * heatMult * comboMult * speedMult * boost;

    const echoChance = Math.min(0.55, (a.echoRub ?? 0) * getAscend("echoRub").power);
    if (echoChance > 0 && Math.random() < echoChance) gain *= 2;

    const heatGain = Math.min(
      0.045,
      (distancePx / 280) * heatBuild * (0.5 + q) * (1 + (a.twinPeaks ?? 0) * 0.03),
    );
    let heat = Math.min(1, state.heat + heatGain);

    const combo = state.combo + 1;
    const bestCombo = Math.max(state.bestCombo, combo);

    let rubs = state.rubs + gain;
    let totalRubs = state.totalRubs + gain;
    let climaxes = state.climaxes;
    let prizes = state.prizes;
    let climaxFlash = state.climaxFlash;
    let shake = state.shake;
    let lastPrizeAmount = state.lastPrizeAmount;
    let prizeCooldown = state.prizeCooldown;
    let frenzyFaceKey = state.frenzyFaceKey;
    let faces = state.faces;
    let facesCollected = state.facesCollected;
    const floaters = state.floaters.slice(-24);

    floaters.push({
      id: floaterId++,
      x: cx,
      y: cy,
      value: gain,
      born: performance.now(),
      kind: "rub",
    });

    const dilate =
      1 - Math.min(0.35, (m.timeDilation ?? 0) * getMythic("timeDilation").power);
    const frenzySpeed = FRENZY_SPEED * dilate;
    const fastSpeed = FAST_SPEED * dilate;
    const fillRate = 1 + (a.overdrive ?? 0) * getAscend("overdrive").power;
    const threshold = FRENZY_THRESHOLD / fillRate;

    let frenzy = state.frenzy;
    const canCharge = prizeCooldown <= 0;
    if (canCharge && dtSec > 0 && dtSec < 0.25) {
      if (speedPxPerSec >= frenzySpeed) {
        frenzy = Math.min(1, frenzy + dtSec / threshold);
      } else if (speedPxPerSec >= fastSpeed) {
        frenzy = Math.min(1, frenzy + (dtSec / threshold) * 0.45);
      } else if (speedPxPerSec < fastSpeed * 0.55) {
        frenzy = Math.max(0, frenzy - dtSec * 0.4);
      }
    }

    if (frenzy >= 1 && canCharge) {
      const boostP = incomeBoost({ ...state, prizes, facesCollected });
      const deep = 1 + (a.deepTissue ?? 0) * getAscend("deepTissue").power;
      const prize =
        (80 + soft * 40 + state.combo * 1.5 + state.totalRubs * 0.015 + prizes * 35) *
        boostP *
        deep;
      rubs += prize;
      totalRubs += prize;
      prizes += 1;
      frenzy = 0;
      prizeCooldown = PRIZE_COOLDOWN;
      lastPrizeAmount = prize;
      climaxFlash = 1;
      shake = 1;
      frenzyFaceKey = state.frenzyFaceKey + 1;

      let faceDrops = 1 + Math.floor((m.beanStorm ?? 0) * getMythic("beanStorm").power);
      const ofact = (a.oFactory ?? 0) * getAscend("oFactory").power;
      if (Math.random() < Math.min(0.85, ofact)) faceDrops += 1;
      if (Math.random() < Math.min(0.5, ofact * 0.6)) faceDrops += 1;

      for (let i = 0; i < faceDrops; i++) {
        facesCollected += 1;
        faces = [...faces, makeFace()].slice(-FACE_PILE_MAX);
      }
      if (ofact > 0) {
        const bonus = prize * ofact * 0.25;
        rubs += bonus;
        totalRubs += bonus;
      }

      floaters.push({
        id: floaterId++,
        x: cx,
        y: cy - 40,
        value: prize,
        born: performance.now(),
        kind: "prize",
      });
      playPrize();
      hapticPulse("prize");
      if (prefersReducedMotion()) shake = 0;
    }

    if (heat >= 0.995 && q > 0.35) {
      const after = 1 + u.afterglow * getUpgrade("afterglow").power;
      const boostC = incomeBoost(state);
      const burst = (12 + state.combo * 0.8) * soft * after * (1 + q) * boostC;
      rubs += burst;
      totalRubs += burst;
      climaxes += 1;
      heat = 0.15;
      climaxFlash = Math.max(climaxFlash, 1);
      shake = Math.min(1, shake + 0.85);
      floaters.push({
        id: floaterId++,
        x: cx,
        y: cy - 24,
        value: burst,
        born: performance.now(),
        kind: "climax",
      });
      playClimax();
      hapticPulse("climax");
      if (prefersReducedMotion()) shake = 0;
    }

    const daily = { ...ensureDaily(state.daily) };
    if (!daily.claimed) {
      daily.progressPx = Math.min(daily.goalPx, daily.progressPx + distancePx);
    }

    const partial: Partial<GameState> = {
      rubs,
      totalRubs,
      lifetimeDistance: state.lifetimeDistance + distancePx,
      daily,
      heat,
      combo,
      comboTimer: rhythm,
      bestCombo,
      climaxes,
      prizes,
      climaxFlash,
      shake,
      floaters,
      frenzy,
      lastSpeed: speedPxPerSec,
      prizeCooldown,
      lastPrizeAmount,
      frenzyFaceKey,
      faces,
      facesCollected,
    };
    const prog = progressionPatch(state, partial);
    set({ ...partial, ...prog });
  },

  tick: (dt) => {
    const state = get();
    const u = state.upgrades;
    const a = state.ascend;
    const m = state.mythic;
    const stamina = u.stamina * getUpgrade("stamina").power;
    const decay = Math.max(0.08, 0.55 - stamina);

    let heat = state.heat;
    if (!state.rubbing) {
      heat = Math.max(0, heat - decay * dt);
    } else {
      heat = Math.max(0, heat - decay * 0.15 * dt);
    }

    let combo = state.combo;
    let comboTimer = state.comboTimer;
    if (combo > 0) {
      const decayMul =
        state.rubbing && (m.infiniteStroke ?? 0) > 0
          ? Math.max(0.08, 1 - (m.infiniteStroke ?? 0) * 0.06)
          : 1;
      comboTimer -= dt * decayMul;
      if (comboTimer <= 0) {
        combo = 0;
        comboTimer = 0;
      }
    }

    const prizeCooldown = Math.max(0, state.prizeCooldown - dt);

    let frenzy = state.frenzy;
    if (prizeCooldown <= 0 && (!state.rubbing || state.lastSpeed < FAST_SPEED * 0.5)) {
      frenzy = Math.max(0, frenzy - dt * 0.32);
    }

    const autoLv = u.autoGlider;
    const velvet = a.velvetEngine ?? 0;
    let rubs = state.rubs;
    let totalRubs = state.totalRubs;
    const floaters = state.floaters.filter((f) => performance.now() - f.born < 900);

    if (state.started && (autoLv > 0 || velvet > 0)) {
      const boostA = incomeBoost(state);
      let p = 0;
      if (autoLv > 0)
        p += autoLv * getUpgrade("autoGlider").power * (state.rubbing ? 0.35 : 1);
      if (velvet > 0) p += velvet * getAscend("velvetEngine").power;
      p *= (1 + state.heat * 0.5) * (1 + u.softTouch * 0.08) * boostA * dt;
      if (p > 0) {
        rubs += p;
        totalRubs += p;
      }
    }

    const climaxFlash = Math.max(0, state.climaxFlash - dt * 1.4);
    const shake = Math.max(0, state.shake - dt * 2.2);

    let lastSave = state.lastSave + dt;
    const next = {
      heat,
      combo,
      comboTimer,
      rubs,
      totalRubs,
      floaters,
      climaxFlash,
      shake,
      lastSave,
      frenzy,
      prizeCooldown,
    };
    set(next);

    if (lastSave >= 2.5) {
      set({ lastSave: 0 });
      const prog = progressionPatch(get(), {});
      if (
        prog.challenges !== get().challenges ||
        prog.orbital ||
        prog.voidbean
      ) {
        set(prog);
      }
      saveSnapshot({ ...get(), lastSave: 0 });
    }
  },

  buyUpgrade: (id, count = 1) => {
    const state = get();
    const def = getUpgrade(id);
    const level = state.upgrades[id];
    if (level >= def.maxLevel) return false;
    const n = Math.max(1, Math.min(count, def.maxLevel - level));
    const cost = upgradeCostBulk(def, level, n);
    if (state.rubs < cost || cost <= 0) return false;
    const upgrades = { ...state.upgrades, [id]: level + n };
    const wasMaster = state.beanMaster;
    const beanMaster = wasMaster || isAllUpgradesMaxed(upgrades);
    const justUnlocked = beanMaster && !wasMaster;

    const partial: Partial<GameState> = {
      rubs: state.rubs - cost,
      upgrades,
      beanMaster,
      badgeToast: justUnlocked ? "beanMaster" : state.badgeToast,
      shake: justUnlocked ? 1 : state.shake,
      climaxFlash: justUnlocked ? 1 : state.climaxFlash,
      shopTab: justUnlocked ? "path" : state.shopTab,
    };
    const prog = progressionPatch(state, partial);
    set({ ...partial, ...prog });
    playBuy();
    if (justUnlocked) playBeanMaster();
    saveSnapshot(get());
    return true;
  },

  buyAscend: (id, count = 1) => {
    const state = get();
    if (!state.beanMaster) return false;
    const def = getAscend(id);
    const level = state.ascend[id];
    if (level >= def.maxLevel) return false;
    const n = Math.max(1, Math.min(count, def.maxLevel - level));
    const cost = skillCostBulk(def, level, n);
    if (state.rubs < cost || cost <= 0) return false;
    const ascend = { ...state.ascend, [id]: level + n };
    const partial: Partial<GameState> = { rubs: state.rubs - cost, ascend };
    const prog = progressionPatch(state, partial);
    set({ ...partial, ...prog });
    playBuy();
    if (prog.badgeToast === "orbital") playBeanMaster();
    saveSnapshot(get());
    return true;
  },

  buyMythic: (id, count = 1) => {
    const state = get();
    if (!state.orbital) return false;
    const def = getMythic(id);
    const level = state.mythic[id];
    if (level >= def.maxLevel) return false;
    const n = Math.max(1, Math.min(count, def.maxLevel - level));
    const cost = skillCostBulk(def, level, n);
    if (state.rubs < cost || cost <= 0) return false;
    const mythic = { ...state.mythic, [id]: level + n };
    const partial: Partial<GameState> = { rubs: state.rubs - cost, mythic };
    const prog = progressionPatch(state, partial);
    set({ ...partial, ...prog });
    playBuy();
    if (prog.badgeToast === "voidbean") playBeanMaster();
    saveSnapshot(get());
    return true;
  },

  resetProgress: () => {
    set({
      rubs: 0,
      totalRubs: 0,
      lifetimeDistance: 0,
      bestCombo: 0,
      climaxes: 0,
      prizes: 0,
      upgrades: emptyUpgrades(),
      ascend: emptyAscend(),
      mythic: emptyMythic(),
      challenges: emptyChallenges(),
      heat: 0,
      combo: 0,
      comboTimer: 0,
      floaters: [],
      climaxFlash: 0,
      shake: 0,
      frenzy: 0,
      started: true,
      prizeCooldown: 0,
      lastPrizeAmount: 0,
      beanMaster: false,
      orbital: false,
      voidbean: false,
      titleAsO: false,
      badgeToast: null,
      faces: [],
      facesCollected: 0,
      shopTab: "core",
      daily: emptyDaily(),
    });
    saveSnapshot(get());
  },
}));

export function formatRubs(n: number): string {
  if (!Number.isFinite(n)) return "0";
  if (n < 1000) return n < 10 ? n.toFixed(1) : Math.floor(n).toString();
  const units = ["", "K", "M", "B", "T", "Qa", "Qi"];
  let v = n;
  let i = 0;
  while (v >= 1000 && i < units.length - 1) {
    v /= 1000;
    i++;
  }
  return `${v.toFixed(v >= 100 ? 0 : v >= 10 ? 1 : 2)}${units[i]}`;
}

export function formatDistance(px: number): string {
  if (px < 1000) return `${Math.floor(px)} px`;
  if (px < 1_000_000) return `${(px / 1000).toFixed(1)}K px`;
  return `${(px / 1_000_000).toFixed(2)}M px`;
}

export const SITE_NAME = "flickbean.grok.me";
export const X_HANDLE = "SuddenlyJon";
export const X_FOLLOW_URL = `https://x.com/intent/follow?screen_name=${X_HANDLE}`;
export const X_PROFILE_URL = `https://x.com/${X_HANDLE}`;

export function shareStatsUrl(stats: {
  totalRubs: number;
  lifetimeDistance: number;
  bestCombo: number;
  climaxes: number;
  prizes: number;
  facesCollected?: number;
  beanMaster?: boolean;
  orbital?: boolean;
  voidbean?: boolean;
}): string {
  const lines = [
    `My ${SITE_NAME} stats:`,
    `· ${formatRubs(stats.totalRubs)} lifetime rubs`,
    `· ${formatDistance(stats.lifetimeDistance)} distance`,
    `· ${stats.bestCombo} best combo`,
    `· ${stats.climaxes} climaxes · ${stats.prizes} frenzy prizes`,
  ];
  if (stats.facesCollected && stats.facesCollected > 0) {
    lines.push(`· ${stats.facesCollected} O Count`);
  }
  if (stats.voidbean) lines.push(`· BEAN GOD apex unlocked`);
  else if (stats.orbital) lines.push(`· ORBITAL rank unlocked`);
  else if (stats.beanMaster) lines.push(`· BEANMASTER badge unlocked`);
  lines.push(
    ``,
    `Stop tapping. Start rubbing.`,
    `https://${SITE_NAME}`,
    `Made by @${X_HANDLE}`,
  );
  return `https://x.com/intent/tweet?text=${encodeURIComponent(lines.join("\n"))}`;
}

export function shareBadgeUrl(
  badge: BadgeId,
  stats: {
    totalRubs: number;
    bestCombo: number;
    prizes: number;
    facesCollected: number;
  },
): string {
  const names = {
    beanMaster: "BEANMASTER",
    orbital: "ORBITAL",
    voidbean: "BEAN GOD",
  } as const;
  const text = [
    `I unlocked ${names[badge]} on ${SITE_NAME}`,
    ``,
    `· ${formatRubs(stats.totalRubs)} lifetime rubs`,
    `· ${stats.bestCombo} best combo`,
    `· ${stats.prizes} frenzy prizes · ${stats.facesCollected} O Count`,
    ``,
    `https://${SITE_NAME}`,
    `Made by @${X_HANDLE}`,
  ].join("\n");
  return `https://x.com/intent/tweet?text=${encodeURIComponent(text)}`;
}

export function shareBeanMasterUrl(stats: {
  totalRubs: number;
  bestCombo: number;
  prizes: number;
}): string {
  return shareBadgeUrl("beanMaster", { ...stats, facesCollected: 0 });
}
