export function incomeLabel(boost: number): string {
  // Corrupted save / bad upgrade math can pass NaN/Inf/negatives; toFixed then
  // paints "NaN×" / "Infinity×" / "-5.00×" into the shop boost chip. Distinct
  // from formatDistance / formatRubs (already finite-guarded).
  if (!Number.isFinite(boost) || boost < 0) return "0.00×";
  if (boost >= 100) return `${boost.toFixed(0)}×`;
  if (boost >= 10) return `${boost.toFixed(1)}×`;
  return `${boost.toFixed(2)}×`;
}
