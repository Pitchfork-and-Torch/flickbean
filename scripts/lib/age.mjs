/** Shared age-gate helpers for Playwright scripts. */
export const AGE_STORAGE_KEY = "flickbean-age-18";

/** Skip the 18+ dialog so feature tests can reach play. Call before goto. */
export async function bypassAgeGate(page) {
  await page.addInitScript((key) => {
    try {
      localStorage.setItem(key, "1");
    } catch {
      /* ignore */
    }
  }, AGE_STORAGE_KEY);
}

export async function confirmAgeGate(page) {
  const box = page.getByRole("checkbox", { name: /i am 18 or older/i });
  await box.check();
  await page.getByRole("button", { name: /^enter$/i }).click();
}
