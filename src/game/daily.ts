export type DailyFlick = {
  day: string;
  goalPx: number;
  progressPx: number;
  claimed: boolean;
  /** Consecutive UTC days claimed. Includes today once claimed. */
  streak: number;
  /** UTC day of the last successful claim. */
  lastClaimDay: string | null;
};

/** Extra days after the first that still raise the bonus. Day 8 and beyond stay flat. */
const STREAK_BONUS_CAP = 8;
const STREAK_BONUS_STEP = 0.05;

export function utcDay(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

export function shiftUtcDay(day: string, deltaDays: number): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day);
  if (!match) return day;
  const dt = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  dt.setUTCDate(dt.getUTCDate() + deltaDays);
  return dt.toISOString().slice(0, 10);
}

export function dailyGoalPx(day: string): number {
  let h = 2166136261;
  for (let i = 0; i < day.length; i++) {
    h ^= day.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return 8_000 + (h >>> 0) % 20_001;
}

export function emptyDaily(day = utcDay()): DailyFlick {
  return {
    day,
    goalPx: dailyGoalPx(day),
    progressPx: 0,
    claimed: false,
    streak: 0,
    lastClaimDay: null,
  };
}

function readStreak(raw: unknown): { streak: number; lastClaimDay: string | null } {
  const prev = raw as Partial<DailyFlick> | null | undefined;
  const streak = Number.isFinite(prev?.streak) ? Math.max(0, Math.floor(prev!.streak!)) : 0;
  const last =
    typeof prev?.lastClaimDay === "string" && /^\d{4}-\d{2}-\d{2}$/.test(prev.lastClaimDay)
      ? prev.lastClaimDay
      : null;
  return { streak: last ? streak : 0, lastClaimDay: last };
}

function streakStillLive(lastClaimDay: string | null, today: string): boolean {
  if (!lastClaimDay) return false;
  return lastClaimDay === today || lastClaimDay === shiftUtcDay(today, -1);
}

/** Keep a live chain across the UTC midnight reset. A gap clears it. */
function carryStreak(
  prev: DailyFlick | undefined | null,
  today: string,
): { streak: number; lastClaimDay: string | null } {
  let { streak, lastClaimDay } = readStreak(prev);
  // Saves from before streaks only remember `claimed` on that day's record.
  if (!lastClaimDay && prev?.claimed && typeof prev.day === "string") {
    if (prev.day === today || prev.day === shiftUtcDay(today, -1)) {
      streak = Math.max(1, streak);
      lastClaimDay = prev.day;
    }
  }
  if (!streakStillLive(lastClaimDay, today)) return { streak: 0, lastClaimDay: null };
  return { streak, lastClaimDay };
}

export function ensureDaily(prev: DailyFlick | undefined | null, now = new Date()): DailyFlick {
  const day = utcDay(now);
  const carried = carryStreak(prev, day);
  if (prev && prev.day === day && prev.goalPx > 0) {
    return {
      day,
      goalPx: prev.goalPx,
      progressPx: Math.max(0, prev.progressPx || 0),
      claimed: Boolean(prev.claimed),
      streak: carried.streak,
      lastClaimDay: carried.lastClaimDay,
    };
  }
  return {
    ...emptyDaily(day),
    streak: carried.streak,
    lastClaimDay: carried.lastClaimDay,
  };
}

export function visibleStreak(daily: DailyFlick, today = daily.day): number {
  if (!streakStillLive(daily.lastClaimDay, today)) return 0;
  return Math.max(0, Math.floor(daily.streak));
}

/** Streak length after a successful claim on `today`. */
export function nextStreak(daily: DailyFlick, today: string): number {
  if (daily.lastClaimDay === today) return Math.max(1, Math.floor(daily.streak));
  if (daily.lastClaimDay === shiftUtcDay(today, -1)) return Math.max(0, Math.floor(daily.streak)) + 1;
  return 1;
}

export function dailyBonus(goalPx: number): number {
  return Math.floor(400 + goalPx * 0.12);
}

export function streakMultiplier(streak: number): number {
  const extra = Math.max(0, Math.min(Math.floor(streak), STREAK_BONUS_CAP) - 1);
  return 1 + extra * STREAK_BONUS_STEP;
}

export function claimedBonus(goalPx: number, streak: number): number {
  return Math.floor(dailyBonus(goalPx) * streakMultiplier(streak));
}

export function dailyChip(daily: DailyFlick): { text: string; label: string; title: string } {
  const streak = visibleStreak(daily);
  const mark = streak > 0 ? ` · ${streak}d` : "";
  const streakWords = streak === 1 ? "1 day streak" : streak > 1 ? `${streak} day streak` : "";
  if (daily.claimed) {
    return {
      text: `Daily done${mark}`,
      label: streakWords ? `Daily flick done, ${streakWords}` : "Daily flick done",
      title: streakWords || "Daily flick done",
    };
  }
  if (daily.progressPx >= daily.goalPx) {
    const upcoming = nextStreak(daily, daily.day);
    const bonus = claimedBonus(daily.goalPx, upcoming);
    return {
      text: `Daily claim${mark}`,
      label: `Claim daily flick, ${bonus} rubs${streakWords ? `, ${streakWords}` : ""}`,
      title: `Claim ${bonus} rubs`,
    };
  }
  const pct = Math.min(99, Math.floor((daily.progressPx / Math.max(1, daily.goalPx)) * 100));
  return {
    text: `Daily ${pct}%${mark}`,
    label: streakWords ? `Daily flick ${pct} percent, ${streakWords}` : `Daily flick ${pct} percent`,
    title: streakWords || "Daily distance goal",
  };
}
