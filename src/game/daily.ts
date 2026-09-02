export type DailyFlick = {
  day: string;
  goalPx: number;
  progressPx: number;
  claimed: boolean;
};

export function utcDay(d = new Date()): string {
  return d.toISOString().slice(0, 10);
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
  };
}

export function ensureDaily(prev: DailyFlick | undefined | null): DailyFlick {
  const day = utcDay();
  if (prev && prev.day === day && prev.goalPx > 0) {
    return {
      day,
      goalPx: prev.goalPx,
      progressPx: Math.max(0, prev.progressPx || 0),
      claimed: Boolean(prev.claimed),
    };
  }
  return emptyDaily(day);
}

export function dailyBonus(goalPx: number): number {
  return Math.floor(400 + goalPx * 0.12);
}
