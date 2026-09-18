/** applyRub must reject non-finite pointer coords (reads store.ts). */
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

const idx = src.indexOf("applyRub: (distancePx, cx, cy, quality, speedPxPerSec, dtSec)");
assert(idx >= 0, "applyRub impl found");
const slice = src.slice(idx, idx + 900);
assert(/Number\.isFinite\(cx\)/.test(slice), "cx finite guard");
assert(/Number\.isFinite\(cy\)/.test(slice), "cy finite guard");
assert(
  slice.indexOf("Number.isFinite(cx)") > slice.indexOf("Number.isFinite(dtSec)"),
  "coords guard after metric guards",
);

function applyRub(distancePx, cx, cy, quality, speedPxPerSec, dtSec, started = true) {
  if (!started || !Number.isFinite(distancePx) || distancePx <= 0) return false;
  if (
    !Number.isFinite(quality) ||
    !Number.isFinite(speedPxPerSec) ||
    !Number.isFinite(dtSec)
  ) {
    return false;
  }
  if (!Number.isFinite(cx) || !Number.isFinite(cy)) return false;
  return true;
}

assert(applyRub(10, 100, 200, 1, 50, 0.016) === true, "happy path");
assert(applyRub(10, NaN, 200, 1, 50, 0.016) === false, "nan cx");
assert(applyRub(10, 100, Infinity, 1, 50, 0.016) === false, "inf cy");
assert(applyRub(10, 100, 200, NaN, 50, 0.016) === false, "nan quality still rejected");
console.log("ok apply-rub-coords");
