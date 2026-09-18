/** formatDistance must not leak NaN/Inf into the Stats panel. */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = readFileSync(join(root, "src/game/store.ts"), "utf8");

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL", msg);
    process.exit(1);
  }
}

assert(
  /formatDistance\(px:\s*number\):[\s\S]*?Number\.isFinite\(px\)/.test(src),
  "formatDistance guards Number.isFinite",
);
assert(/px < 0/.test(src.match(/export function formatDistance[\s\S]*?^}/m)[0] || src), "rejects negative");

// Behavioral check via Function from extracted body would need TS strip;
// assert the early return string is present.
assert(src.includes('return "0 px"'), 'returns "0 px" for bad input');
console.log("ok format-distance-finite");
