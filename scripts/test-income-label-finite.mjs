/** incomeLabel must not leak NaN/Inf/negatives into the shop boost chip. */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = readFileSync(join(root, "src/game/format.ts"), "utf8");

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL", msg);
    process.exit(1);
  }
}

assert(/Number\.isFinite\(boost\)/.test(src), "finite guard present");
assert(/boost < 0/.test(src), "negative rejected");

function incomeLabel(boost) {
  if (!Number.isFinite(boost) || boost < 0) return "0.00×";
  if (boost >= 100) return `${boost.toFixed(0)}×`;
  if (boost >= 10) return `${boost.toFixed(1)}×`;
  return `${boost.toFixed(2)}×`;
}

assert(incomeLabel(1.5) === "1.50×", "1.50×");
assert(incomeLabel(12.34) === "12.3×", "12.3×");
assert(incomeLabel(150) === "150×", "150×");
assert(incomeLabel(NaN) === "0.00×", "nan");
assert(incomeLabel(Infinity) === "0.00×", "inf");
assert(incomeLabel(-5) === "0.00×", "neg");
console.log("ok income-label-finite");
