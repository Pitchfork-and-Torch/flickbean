import { chromium } from "playwright";
import { bypassAgeGate } from "./lib/age.mjs";
const browser = await chromium.launch({ args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await bypassAgeGate(page);
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));

await page.goto("http://127.0.0.1:8080/", { waitUntil: "networkidle" });
await page.getByRole("button", { name: /rubbing/i }).click();
await page.waitForTimeout(400);

// Force all upgrades maxed via zustand store if exposed - inject via localStorage + reload
// Or patch through buyUpgrade by setting state via evaluate of module - harder.
// Use localStorage save format and reload.
const maxUpgrades = {
  softTouch: 50, warmFingers: 30, stamina: 25, autoGlider: 40,
  sensitiveSpot: 20, afterglow: 15, rhythm: 25,
};
await page.evaluate((upgrades) => {
  const snap = {
    version: 1,
    rubs: 999999,
    totalRubs: 1e6,
    lifetimeDistance: 50000,
    bestCombo: 999,
    climaxes: 42,
    prizes: 10,
    upgrades,
    started: true,
    beanMaster: true,
  };
  localStorage.setItem("clit-grok-me-v1", JSON.stringify(snap));
}, maxUpgrades);

await page.reload({ waitUntil: "networkidle" });
await page.getByRole("button", { name: /rubbing|continue/i }).click();
await page.waitForTimeout(400);

// Badge on HUD
const badge = page.getByRole("button", { name: /BEANMASTER badge/i });
const hudBadge = await badge.isVisible().catch(() => false);

// Stats panel badge share
await page.getByRole("button", { name: /^stats$/i }).click();
await page.waitForTimeout(300);
const shareBtn = page.getByRole("button", { name: /share beanmaster on x/i });
const shareVisible = await shareBtn.isVisible();
const [popup] = await Promise.all([
  page.waitForEvent("popup", { timeout: 4000 }).catch(() => null),
  shareBtn.click(),
]);
const shareUrl = popup ? decodeURIComponent(popup.url()) : null;
if (popup) await popup.close();
await page.screenshot({ path: "/workspace/screenshots/beanmaster.png" });

console.log(JSON.stringify({ errors, hudBadge, shareVisible, shareUrl }, null, 2));
await browser.close();
