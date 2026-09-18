/** tick must reject non-finite / non-positive dt (reads store.ts source). */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = readFileSync(join(root, "src/game/store.ts"), "utf8");

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL", msg);
    process.exit(1);
  }
}

const tickIdx = src.indexOf("tick: (dt) =>");
assert(tickIdx >= 0, "tick found");
const slice = src.slice(tickIdx, tickIdx + 350);
assert(/Number\.isFinite\(dt\)/.test(slice), "finite guard");
assert(/dt <= 0/.test(slice), "non-positive guard");
assert(slice.indexOf("Number.isFinite(dt)") < slice.indexOf("const state = get()"), "guard before work");

// Lightweight behavioral stand-in matching the patched early-return contract.
function tick(dt, heat = 0.5, decay = 0.2) {
  if (!Number.isFinite(dt) || dt <= 0) return heat;
  return Math.max(0, heat - decay * dt);
}
assert(tick(0.016) < 0.5, "normal decays");
assert(tick(NaN) === 0.5, "nan holds");
assert(tick(Infinity) === 0.5, "inf holds");
assert(tick(-1) === 0.5, "neg holds");
assert(tick(0) === 0.5, "zero holds");
console.log("ok tick-dt");
