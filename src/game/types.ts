import type { DailyFlick } from "./daily";
import type { AscendId, ChallengeId, MythicId } from "./progression";

export type UpgradeId =
  | "softTouch"
  | "warmFingers"
  | "stamina"
  | "autoGlider"
  | "sensitiveSpot"
  | "afterglow"
  | "rhythm";

export type UpgradeDef = {
  id: UpgradeId;
  name: string;
  blurb: string;
  baseCost: number;
  costScale: number;
  maxLevel: number;
  power: number;
};

export type FloatingNumber = {
  id: number;
  x: number;
  y: number;
  value: number;
  born: number;
  kind: "rub" | "climax" | "passive" | "prize";
};

export type CollectedFace = {
  id: number;
  rot: number;
  x: number;
  y: number;
  scale: number;
};

export type GameSnapshot = {
  version: 1 | 2;
  rubs: number;
  totalRubs: number;
  lifetimeDistance: number;
  bestCombo: number;
  climaxes: number;
  prizes: number;
  upgrades: Record<UpgradeId, number>;
  started: boolean;
  beanMaster?: boolean;
  faces?: CollectedFace[];
  ascend?: Record<AscendId, number>;
  mythic?: Record<MythicId, number>;
  challenges?: Partial<Record<ChallengeId, boolean>>;
  orbital?: boolean;
  voidbean?: boolean;
  /** BEAN GOD title shows as "O" */
  titleAsO?: boolean;
  muted?: boolean;
  daily?: DailyFlick;
};

export const FRENZY_THRESHOLD = 3.5;
export const FRENZY_SPEED = 1000;
export const FAST_SPEED = 700;
export const FACE_PILE_MAX = 48;
