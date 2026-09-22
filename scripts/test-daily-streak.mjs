import assert from "node:assert/strict";
import {
  claimedBonus,
  dailyBonus,
  dailyChip,
  dailyGoalPx,
  emptyDaily,
  ensureDaily,
  nextStreak,
  shiftUtcDay,
  visibleStreak,
} from "../src/game/daily.ts";

const now = new Date("2026-09-30T15:00:00Z");
const today = "2026-09-30";
const yesterday = "2026-09-29";

assert.equal(shiftUtcDay(today, -1), yesterday);
assert.equal(shiftUtcDay("2026-03-01", -1), "2026-02-28");

const fresh = emptyDaily(today);
assert.equal(nextStreak(fresh, today), 1);
assert.equal(visibleStreak(fresh), 0);

const continued = {
  ...emptyDaily(today),
  streak: 3,
  lastClaimDay: yesterday,
};
assert.equal(nextStreak(continued, today), 4);
assert.equal(visibleStreak(continued), 3);

const gap = { ...emptyDaily(today), streak: 5, lastClaimDay: "2026-09-28" };
assert.equal(nextStreak(gap, today), 1);
assert.equal(visibleStreak(gap), 0);

const already = { ...emptyDaily(today), claimed: true, streak: 4, lastClaimDay: today };
assert.equal(nextStreak(already, today), 4);

const base = dailyBonus(10_000);
assert.equal(claimedBonus(10_000, 1), base);
const day8 = claimedBonus(10_000, 8);
const day20 = claimedBonus(10_000, 20);
assert.ok(day8 > base);
assert.equal(day20, day8);
assert.ok(day8 / base < 1.36);

const rolled = ensureDaily(
  {
    day: yesterday,
    goalPx: 9000,
    progressPx: 9000,
    claimed: true,
    streak: 3,
    lastClaimDay: yesterday,
  },
  now,
);
assert.equal(rolled.day, today);
assert.equal(rolled.claimed, false);
assert.equal(rolled.progressPx, 0);
assert.equal(rolled.streak, 3);
assert.equal(rolled.lastClaimDay, yesterday);
assert.equal(rolled.goalPx, dailyGoalPx(today));

const dead = ensureDaily(
  {
    day: "2026-09-20",
    goalPx: 9000,
    progressPx: 0,
    claimed: true,
    streak: 9,
    lastClaimDay: "2026-09-20",
  },
  now,
);
assert.equal(dead.streak, 0);
assert.equal(dead.lastClaimDay, null);

const legacyYesterday = ensureDaily(
  { day: yesterday, goalPx: 9000, progressPx: 9000, claimed: true },
  now,
);
assert.equal(legacyYesterday.streak, 1);
assert.equal(legacyYesterday.lastClaimDay, yesterday);
assert.equal(legacyYesterday.claimed, false);

const legacyToday = ensureDaily(
  { day: today, goalPx: 11111, progressPx: 11111, claimed: true },
  now,
);
assert.equal(legacyToday.claimed, true);
assert.equal(legacyToday.streak, 1);
assert.equal(legacyToday.lastClaimDay, today);
assert.equal(legacyToday.progressPx, 11111);

const mid = ensureDaily(
  {
    day: today,
    goalPx: 11111,
    progressPx: 40,
    claimed: false,
    streak: 2,
    lastClaimDay: yesterday,
  },
  now,
);
assert.equal(mid.progressPx, 40);
assert.equal(mid.goalPx, 11111);
assert.equal(mid.streak, 2);

const junk = ensureDaily(
  { day: today, goalPx: 11111, progressPx: 1, claimed: false, streak: -4, lastClaimDay: "nope" },
  now,
);
assert.equal(junk.streak, 0);
assert.equal(junk.lastClaimDay, null);

const claimChip = dailyChip({ ...continued, progressPx: continued.goalPx });
assert.match(claimChip.text, /Daily claim · 3d/);
assert.match(claimChip.label, /3 day streak/);
assert.match(claimChip.title, /^Claim \d+ rubs$/);

const doneChip = dailyChip(already);
assert.equal(doneChip.text, "Daily done · 4d");

console.log("daily streak ok");
