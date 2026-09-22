import type { UpgradeId } from "./types";
import { isAllUpgradesMaxed } from "./upgrades";

export type AscendId =
  | "twinPeaks"
  | "velvetEngine"
  | "overdrive"
  | "deepTissue"
  | "echoRub"
  | "oFactory";

export type MythicId =
  | "timeDilation"
  | "singularity"
  | "infiniteStroke"
  | "godFinger"
  | "beanStorm"
  | "voidTouch";

export type ChallengeId =
  | "collector25"
  | "comboKing"
  | "prizeHunter"
  | "heatWave"
  | "longStroke"
  | "ascendSkills"
  | "oCentury"
  | "comboGod"
  | "prizeLord"
  | "climaxStorm"
  | "marathon"
  | "mythicSkills";

export type SkillDef<T extends string> = {
  id: T;
  name: string;
  blurb: string;
  baseCost: number;
  costScale: number;
  maxLevel: number;
  power: number;
};

export type ChallengeDef = {
  id: ChallengeId;
  tier: 2 | 3;
  name: string;
  blurb: string;
  targetLabel: string;
};

export const ASCEND_SKILLS: SkillDef<AscendId>[] = [
  {
    id: "twinPeaks",
    name: "Twin Peaks",
    blurb: "Sweet-spot quality floor. Every stroke hits harder.",
    baseCost: 5_000,
    costScale: 1.48,
    maxLevel: 20,
    power: 0.04,
  },
  {
    id: "velvetEngine",
    name: "Velvet Engine",
    blurb: "Passive rubs keep flowing even while you stroke.",
    baseCost: 8_000,
    costScale: 1.5,
    maxLevel: 25,
    power: 0.55,
  },
  {
    id: "overdrive",
    name: "Overdrive",
    blurb: "Frenzy bar fills faster at max speed.",
    baseCost: 6_500,
    costScale: 1.52,
    maxLevel: 20,
    power: 0.09,
  },
  {
    id: "deepTissue",
    name: "Deep Tissue",
    blurb: "Frenzy prizes pay out much bigger.",
    baseCost: 12_000,
    costScale: 1.55,
    maxLevel: 20,
    power: 0.18,
  },
  {
    id: "echoRub",
    name: "Echo Rub",
    blurb: "Chance to double any stroke's rubs.",
    baseCost: 9_000,
    costScale: 1.5,
    maxLevel: 25,
    power: 0.035,
  },
  {
    id: "oFactory",
    name: "O Factory",
    blurb: "Prizes can drop bonus faces and O-bonus rubs.",
    baseCost: 15_000,
    costScale: 1.55,
    maxLevel: 15,
    power: 0.12,
  },
];

export const MYTHIC_SKILLS: SkillDef<MythicId>[] = [
  {
    id: "timeDilation",
    name: "Time Dilation",
    blurb: "Max-speed threshold drops  -  frenzy is easier to hold.",
    baseCost: 250_000,
    costScale: 1.48,
    maxLevel: 15,
    power: 0.04,
  },
  {
    id: "singularity",
    name: "Singularity",
    blurb: "Amplifies Super Boost itself. Exponential late game.",
    baseCost: 400_000,
    costScale: 1.52,
    maxLevel: 20,
    power: 0.14,
  },
  {
    id: "infiniteStroke",
    name: "Infinite Stroke",
    blurb: "Combo barely decays while your finger is down.",
    baseCost: 300_000,
    costScale: 1.5,
    maxLevel: 15,
    power: 0.2,
  },
  {
    id: "godFinger",
    name: "God Finger",
    blurb: "Quality never drops  -  every stroke is perfect.",
    baseCost: 350_000,
    costScale: 1.5,
    maxLevel: 12,
    power: 0.06,
  },
  {
    id: "beanStorm",
    name: "Bean Storm",
    blurb: "Frenzy prizes rain extra faces into the pile.",
    baseCost: 500_000,
    costScale: 1.55,
    maxLevel: 10,
    power: 1,
  },
  {
    id: "voidTouch",
    name: "Void Touch",
    blurb: "Raw income multiplier. The endgame nuke.",
    baseCost: 750_000,
    costScale: 1.58,
    maxLevel: 25,
    power: 0.22,
  },
];

export const CHALLENGES: ChallengeDef[] = [
  {
    id: "collector25",
    tier: 2,
    name: "Face Hoarder",
    blurb: "Build a real pile.",
    targetLabel: "O Count 25",
  },
  {
    id: "comboKing",
    tier: 2,
    name: "Combo King",
    blurb: "Don't lift. Ever.",
    targetLabel: "Best combo 250",
  },
  {
    id: "prizeHunter",
    tier: 2,
    name: "Prize Hunter",
    blurb: "Live in the frenzy zone.",
    targetLabel: "40 frenzy prizes",
  },
  {
    id: "heatWave",
    tier: 2,
    name: "Heat Wave",
    blurb: "Peak after peak.",
    targetLabel: "75 climaxes",
  },
  {
    id: "longStroke",
    tier: 2,
    name: "Long Stroke",
    blurb: "Mileage matters.",
    targetLabel: "500K px rubbed",
  },
  {
    id: "ascendSkills",
    tier: 2,
    name: "Full Ascension",
    blurb: "Max every Ascension skill.",
    targetLabel: "All Ascension skills MAX",
  },
  {
    id: "oCentury",
    tier: 3,
    name: "O Century",
    blurb: "A hundred faces. No notes.",
    targetLabel: "O Count 100",
  },
  {
    id: "comboGod",
    tier: 3,
    name: "Combo God",
    blurb: "The finger never rests.",
    targetLabel: "Best combo 600",
  },
  {
    id: "prizeLord",
    tier: 3,
    name: "Prize Lord",
    blurb: "Frenzy is a lifestyle.",
    targetLabel: "120 frenzy prizes",
  },
  {
    id: "climaxStorm",
    tier: 3,
    name: "Climax Storm",
    blurb: "Heat management mastery.",
    targetLabel: "200 climaxes",
  },
  {
    id: "marathon",
    tier: 3,
    name: "Marathon",
    blurb: "Cross the continent.",
    targetLabel: "2M px rubbed",
  },
  {
    id: "mythicSkills",
    tier: 3,
    name: "Mythic Apex",
    blurb: "Max every Mythic skill.",
    targetLabel: "All Mythic skills MAX",
  },
];

export function emptyAscend(): Record<AscendId, number> {
  return {
    twinPeaks: 0,
    velvetEngine: 0,
    overdrive: 0,
    deepTissue: 0,
    echoRub: 0,
    oFactory: 0,
  };
}

export function emptyMythic(): Record<MythicId, number> {
  return {
    timeDilation: 0,
    singularity: 0,
    infiniteStroke: 0,
    godFinger: 0,
    beanStorm: 0,
    voidTouch: 0,
  };
}

export function emptyChallenges(): Record<ChallengeId, boolean> {
  const out = {} as Record<ChallengeId, boolean>;
  for (const c of CHALLENGES) out[c.id] = false;
  return out;
}

export function getAscend(id: AscendId): SkillDef<AscendId> {
  const f = ASCEND_SKILLS.find((s) => s.id === id);
  if (!f) throw new Error(id);
  return f;
}

export function getMythic(id: MythicId): SkillDef<MythicId> {
  const f = MYTHIC_SKILLS.find((s) => s.id === id);
  if (!f) throw new Error(id);
  return f;
}

export function skillCost(def: SkillDef<string>, level: number): number {
  if (level <= 0) return Math.floor(def.baseCost);
  if (level <= 8) return Math.floor(def.baseCost * Math.pow(def.costScale, level));
  const mid = def.baseCost * Math.pow(def.costScale, 8);
  const soft = 1.12 + (def.costScale - 1) * 0.2;
  return Math.max(1, Math.floor(mid * Math.pow(soft, level - 8)));
}

export function skillCostBulk(
  def: SkillDef<string>,
  level: number,
  count: number,
): number {
  let t = 0;
  for (let i = 0; i < count; i++) {
    if (level + i >= def.maxLevel) break;
    t += skillCost(def, level + i);
  }
  return t;
}

export function maxAffordableSkill(
  def: SkillDef<string>,
  level: number,
  rubs: number,
  cap = 50,
): number {
  let bought = 0;
  let spent = 0;
  let lv = level;
  while (bought < cap && lv < def.maxLevel) {
    const c = skillCost(def, lv);
    if (spent + c > rubs) break;
    spent += c;
    lv += 1;
    bought += 1;
  }
  return bought;
}

export function isAllAscendMaxed(a: Record<AscendId, number>): boolean {
  return ASCEND_SKILLS.every((s) => (a[s.id] ?? 0) >= s.maxLevel);
}

export function isAllMythicMaxed(m: Record<MythicId, number>): boolean {
  return MYTHIC_SKILLS.every((s) => (m[s.id] ?? 0) >= s.maxLevel);
}

export type ChallengeCtx = {
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
};

export function challengeProgress(
  id: ChallengeId,
  ctx: ChallengeCtx,
): { current: number; target: number; done: boolean } {
  switch (id) {
    case "collector25":
      return { current: ctx.facesCollected, target: 25, done: ctx.facesCollected >= 25 };
    case "comboKing":
      return { current: ctx.bestCombo, target: 250, done: ctx.bestCombo >= 250 };
    case "prizeHunter":
      return { current: ctx.prizes, target: 40, done: ctx.prizes >= 40 };
    case "heatWave":
      return { current: ctx.climaxes, target: 75, done: ctx.climaxes >= 75 };
    case "longStroke":
      return {
        current: Math.floor(ctx.lifetimeDistance),
        target: 500_000,
        done: ctx.lifetimeDistance >= 500_000,
      };
    case "ascendSkills":
      return {
        current: ASCEND_SKILLS.filter((s) => (ctx.ascend[s.id] ?? 0) >= s.maxLevel).length,
        target: ASCEND_SKILLS.length,
        done: isAllAscendMaxed(ctx.ascend),
      };
    case "oCentury":
      return { current: ctx.facesCollected, target: 100, done: ctx.facesCollected >= 100 };
    case "comboGod":
      return { current: ctx.bestCombo, target: 600, done: ctx.bestCombo >= 600 };
    case "prizeLord":
      return { current: ctx.prizes, target: 120, done: ctx.prizes >= 120 };
    case "climaxStorm":
      return { current: ctx.climaxes, target: 200, done: ctx.climaxes >= 200 };
    case "marathon":
      return {
        current: Math.floor(ctx.lifetimeDistance),
        target: 2_000_000,
        done: ctx.lifetimeDistance >= 2_000_000,
      };
    case "mythicSkills":
      return {
        current: MYTHIC_SKILLS.filter((s) => (ctx.mythic[s.id] ?? 0) >= s.maxLevel).length,
        target: MYTHIC_SKILLS.length,
        done: isAllMythicMaxed(ctx.mythic),
      };
  }
}

export function tier2Complete(challenges: Record<ChallengeId, boolean>): boolean {
  return CHALLENGES.filter((c) => c.tier === 2).every((c) => challenges[c.id]);
}

export function tier3Complete(challenges: Record<ChallengeId, boolean>): boolean {
  return CHALLENGES.filter((c) => c.tier === 3).every((c) => challenges[c.id]);
}

export function evaluateChallenges(
  prev: Record<ChallengeId, boolean>,
  ctx: ChallengeCtx,
): { next: Record<ChallengeId, boolean>; newly: ChallengeId[] } {
  const next = { ...prev };
  const newly: ChallengeId[] = [];
  for (const c of CHALLENGES) {
    if (next[c.id]) continue;
    if (c.tier === 2 && !ctx.beanMaster) continue;
    if (c.tier === 3 && !ctx.orbital) continue;
    const { done } = challengeProgress(c.id, ctx);
    if (done) {
      next[c.id] = true;
      newly.push(c.id);
    }
  }
  return { next, newly };
}

/** Final apex badge id kept as voidbean for save compat  -  display name is BEAN GOD */
export type BadgeId = "beanMaster" | "orbital" | "voidbean";

export const BADGE_META: Record<
  BadgeId,
  { name: string; short: string; blurb: string; shareLine: string }
> = {
  beanMaster: {
    name: "BEANMASTER",
    short: "I",
    blurb: "Every core upgrade maxed. Ascension begins.",
    shareLine: "BEANMASTER badge unlocked",
  },
  orbital: {
    name: "ORBITAL",
    short: "II",
    blurb: "All Ascension challenges complete. Mythic path open.",
    shareLine: "ORBITAL rank unlocked",
  },
  voidbean: {
    name: "BEAN GOD",
    short: "III",
    blurb: "Every challenge beaten. Absolute deity of friction.",
    shareLine: "BEAN GOD apex unlocked",
  },
};

/** Display label for highest rank; honor titleAsO for BEAN GOD → O */
export function rankDisplayName(
  voidbean: boolean,
  orbital: boolean,
  beanMaster: boolean,
  titleAsO: boolean,
): string | null {
  if (voidbean) return titleAsO ? "O" : "BEAN GOD";
  if (orbital) return "ORBITAL";
  if (beanMaster) return "BEANMASTER";
  return null;
}

export function pathBoostMult(
  ascend: Record<AscendId, number>,
  mythic: Record<MythicId, number>,
  orbital: boolean,
  voidbean: boolean,
): number {
  const voidLv = mythic.voidTouch ?? 0;
  const singLv = mythic.singularity ?? 0;
  const deep = ascend.deepTissue ?? 0;
  let m = 1;
  m *= 1 + voidLv * getMythic("voidTouch").power;
  m *= 1 + singLv * getMythic("singularity").power * 0.5;
  m *= 1 + deep * 0.03;
  if (orbital) m *= 1.35;
  if (voidbean) m *= 2.1;
  return m;
}

export function isBaseReady(upgrades: Record<UpgradeId, number>): boolean {
  return isAllUpgradesMaxed(upgrades);
}
