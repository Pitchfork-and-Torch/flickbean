import { chromium } from "playwright";
import { bypassAgeGate } from "./lib/age.mjs";
const browser = await chromium.launch({ args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await bypassAgeGate(page);
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));

await page.goto("http://127.0.0.1:8080/", { waitUntil: "networkidle" });
await page.evaluate(() => {
  localStorage.setItem("clit-grok-me-v1", JSON.stringify({
    version: 1,
    rubs: 1e9,
    totalRubs: 1e9,
    lifetimeDistance: 600000,
    bestCombo: 300,
    climaxes: 80,
    prizes: 45,
    upgrades: {
      softTouch: 50, warmFingers: 30, stamina: 25, autoGlider: 40,
      sensitiveSpot: 20, afterglow: 15, rhythm: 25,
    },
    started: true,
    beanMaster: true,
    facesCollected: 45,
    faces: [],
  }));
});
await page.reload({ waitUntil: "networkidle" });
await page.getByRole("button", { name: /rubbing|continue/i }).click();
await page.waitForTimeout(400);

// Open path
await page.getByRole("button", { name: /^path$/i }).click();
await page.waitForTimeout(300);

// Click Ascend tab
await page.getByRole("button", { name: /^ascend$/i }).click();
await page.waitForTimeout(200);
const ascendVisible = await page.getByText("Twin Peaks").isVisible();

await page.getByRole("button", { name: /^path$/i }).nth(1).click().catch(() => {});
// shop internal path tab
const pathTabs = page.locator('[role="dialog"] button', { hasText: /^Path$/ });
if (await pathTabs.count()) await pathTabs.first().click();
await page.waitForTimeout(200);
const challengeVisible = await page.getByText("Face Hoarder").isVisible().catch(() => false);
const orbitalProgress = await page.getByText(/ORBITAL/i).count();

await page.screenshot({ path: "/workspace/screenshots/path-progress.png" });
console.log(JSON.stringify({ errors, ascendVisible, challengeVisible, orbitalProgress }, null, 2));
await browser.close();
