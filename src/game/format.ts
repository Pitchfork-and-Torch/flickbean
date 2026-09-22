export function incomeLabel(boost: number): string {
  if (boost >= 100) return `${boost.toFixed(0)}×`;
  if (boost >= 10) return `${boost.toFixed(1)}×`;
  return `${boost.toFixed(2)}×`;
}
