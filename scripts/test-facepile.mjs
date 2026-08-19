import { chromium } from "playwright";
const browser = await chromium.launch({ args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));

await page.goto("http://127.0.0.1:8080/", { waitUntil: "networkidle" });

// Seed 8 faces
const faces = Array.from({ length: 8 }, (_, i) => ({
  id: i + 1,
  rot: (i - 4) * 7 + (i % 2) * 5,
  x: (i / 7 - 0.5) * 1.4,
  y: Math.random(),
  scale: 0.85 + (i % 3) * 0.08,
}));
await page.evaluate((faces) => {
  localStorage.setItem("clit-grok-me-v1", JSON.stringify({
    version: 1,
    rubs: 500,
    totalRubs: 2000,
    lifetimeDistance: 9000,
    bestCombo: 40,
    climaxes: 3,
    prizes: 8,
    upgrades: {},
    started: true,
    faces,
  }));
}, faces);

await page.reload({ waitUntil: "networkidle" });
await page.getByRole("button", { name: /rubbing|continue/i }).click();
await page.waitForTimeout(500);

const count = await page.locator('img[src="/img/frenzy-face.png"]').count();
await page.screenshot({ path: "/workspace/screenshots/face-pile.png" });
console.log(JSON.stringify({ errors, faceImgs: count }));
await browser.close();
