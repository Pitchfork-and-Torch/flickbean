import type { UpgradeDef, UpgradeId } from "./types";

export const UPGRADES: UpgradeDef[] = [
  {
    id: "softTouch",
    name: "Soft Touch",
    blurb: "More rubs per pixel of friction.",
    baseCost: 15,
    costScale: 1.55,
    maxLevel: 50,
    power: 0.35,
  },
  {
    id: "warmFingers",
    name: "Warm Fingers",
    blurb: "Heat builds faster while rubbing.",
    baseCost: 40,
    costScale: 1.6,
    maxLevel: 30,
    power: 0.18,
  },
  {
    id: "stamina",
    name: "Stamina",
    blurb: "Heat cools down more slowly.",
    baseCost: 60,
    costScale: 1.65,
    maxLevel: 25,
    power: 0.08,
  },
  {
    id: "autoGlider",
    name: "Auto-Glider",
    blurb: "Passive rubs while you rest.",
    baseCost: 120,
    costScale: 1.7,
    maxLevel: 40,
    power: 0.45,
  },
  {
    id: "sensitiveSpot",
    name: "Sensitive Spot",
    blurb: "Bigger sweet zone, stronger center.",
    baseCost: 90,
    costScale: 1.62,
    maxLevel: 20,
    power: 0.12,
  },
  {
    id: "afterglow",
    name: "Afterglow",
    blurb: "Bigger climax bursts when heat peaks.",
    baseCost: 200,
    costScale: 1.75,
    maxLevel: 15,
    power: 0.4,
  },
  {
    id: "rhythm",
    name: "Rhythm",
    blurb: "Combo lasts longer between strokes.",
    baseCost: 75,
    costScale: 1.58,
    maxLevel: 25,
    power: 0.1,
  },
];

/** Levels before cost growth soft-caps (late game stays reachable) */
const COST_SOFT_START = 12;

/**
 * Cost for next level (0-indexed: level 0 → first buy).
 * Early levels use full exponential; after soft start, growth damps hard.
 */
export function upgradeCost(def: UpgradeDef, level: number): number {
  if (level <= 0) return Math.floor(def.baseCost);
  if (level <= COST_SOFT_START) {
    return Math.floor(def.baseCost * Math.pow(def.costScale, level));
  }
  const mid = def.baseCost * Math.pow(def.costScale, COST_SOFT_START);
  const excess = level - COST_SOFT_START;
  // Late scale ~1.12 - 1.22 instead of 1.55 - 1.75
  const softScale = 1.1 + (def.costScale - 1) * 0.22;
  return Math.max(1, Math.floor(mid * Math.pow(softScale, excess)));
}

/** Sum of levels across all upgrades (0 - 205) */
export function totalUpgradeLevels(
  upgrades: Record<UpgradeId, number>,
): number {
  let n = 0;
  for (const u of UPGRADES) n += upgrades[u.id] ?? 0;
  return n;
}

/**
 * Late-game Super Boost  -  income multi that snowballs with levels + prizes + O Count.
 * ~1× early, multiplies hard mid/late so remaining levels don't drag.
 */
export function superBoostMult(
  upgrades: Record<UpgradeId, number>,
  prizes: number,
  facesCollected: number,
): number {
  const levels = totalUpgradeLevels(upgrades);
  // Base linear + accelerating tail after ~20 levels
  const levelLinear = levels * 0.04;
  const levelTail = Math.pow(Math.max(0, levels - 18), 1.48) * 0.018;
  const prizePart = prizes * 0.14;
  const oPart = facesCollected * 0.07;
  // Beanmaster progress bonus (maxed upgrade count)
  const maxed = maxedUpgradeCount(upgrades);
  const masteryPart = maxed * 0.35;

  return 1 + levelLinear + levelTail + prizePart + oPart + masteryPart;
}

export function emptyUpgrades(): Record<UpgradeId, number> {
  return {
    softTouch: 0,
    warmFingers: 0,
    stamina: 0,
    autoGlider: 0,
    sensitiveSpot: 0,
    afterglow: 0,
    rhythm: 0,
  };
}

export function getUpgrade(id: UpgradeId): UpgradeDef {
  const found = UPGRADES.find((u) => u.id === id);
  if (!found) throw new Error(`Unknown upgrade ${id}`);
  return found;
}

export function maxedUpgradeCount(upgrades: Record<UpgradeId, number>): number {
  return UPGRADES.filter((u) => (upgrades[u.id] ?? 0) >= u.maxLevel).length;
}

export function isAllUpgradesMaxed(upgrades: Record<UpgradeId, number>): boolean {
  return UPGRADES.every((u) => (upgrades[u.id] ?? 0) >= u.maxLevel);
}

/** How many levels can be bought with current rubs (capped) */
export function maxAffordableLevels(
  def: UpgradeDef,
  level: number,
  rubs: number,
  cap = 50,
): number {
  let bought = 0;
  let spent = 0;
  let lv = level;
  while (bought < cap && lv < def.maxLevel) {
    const c = upgradeCost(def, lv);
    if (spent + c > rubs) break;
    spent += c;
    lv += 1;
    bought += 1;
  }
  return bought;
}

/** Total cost to buy `count` levels starting from `level` */
export function upgradeCostBulk(
  def: UpgradeDef,
  level: number,
  count: number,
): number {
  let total = 0;
  for (let i = 0; i < count; i++) {
    if (level + i >= def.maxLevel) break;
    total += upgradeCost(def, level + i);
  }
  return total;
}
