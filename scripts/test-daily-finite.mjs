/** ensureDaily / dailyBonus must reject non-finite goal/progress (reads src). */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = readFileSync(join(root, "src/game/daily.ts"), "utf8");

const js = src
  .replace(/^export type[\s\S]*?\n\n/m, "\n")
  .replace(/export /g, "")
  .replace(/: DailyFlick\b/g, "")
  .replace(/: string\b/g, "")
  .replace(/: number\b/g, "")
  .replace(/ \| undefined \| null/g, "");

const { utcDay, ensureDaily, dailyBonus } = new Function(
  `${js}\nreturn { utcDay, dailyGoalPx, emptyDaily, ensureDaily, dailyBonus };`,
)();

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL", msg);
    process.exit(1);
  }
}

const day = utcDay();
assert(ensureDaily({ day, goalPx: 10000, progressPx: 100, claimed: false }).progressPx === 100, "finite ok");
const infP = ensureDaily({ day, goalPx: 10000, progressPx: Infinity, claimed: false });
assert(infP.progressPx === 0 && Number.isFinite(infP.goalPx), "inf progress resets");
assert(ensureDaily({ day, goalPx: 10000, progressPx: NaN, claimed: false }).progressPx === 0, "nan progress");
assert(Number.isFinite(ensureDaily({ day, goalPx: Infinity, progressPx: 0, claimed: false }).goalPx), "inf goal");
assert(dailyBonus(Infinity) === 0 && dailyBonus(NaN) === 0, "bonus nonfinite");
assert(dailyBonus(10000) === Math.floor(400 + 10000 * 0.12), "bonus normal");
console.log("ok daily-finite");
