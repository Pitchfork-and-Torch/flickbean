import { chromium } from "playwright";
import { mkdir } from "fs/promises";

const url = process.argv[2] || "http://127.0.0.1:8080/";
await mkdir("/workspace/screenshots", { recursive: true });

const browser = await chromium.launch({
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});

await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
await page.waitForTimeout(500);

// Start
const startBtn = page.getByRole("button", { name: /start rubbing|continue rubbing/i });
await startBtn.click();
await page.waitForTimeout(400);
await page.screenshot({ path: "/workspace/screenshots/playing.png" });

// Rub across the center
const box = await page.locator("canvas").boundingBox();
if (!box) throw new Error("no canvas");
const cx = box.x + box.width / 2;
const cy = box.y + box.height * 0.48;

await page.mouse.move(cx - 40, cy);
await page.mouse.down();
// Circular rub
for (let i = 0; i <= 40; i++) {
  const a = (i / 40) * Math.PI * 4;
  const r = 30 + (i % 10);
  await page.mouse.move(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
  await page.waitForTimeout(16);
}
await page.mouse.up();
await page.waitForTimeout(300);
await page.screenshot({ path: "/workspace/screenshots/after-rub.png" });

// Open shop
await page.getByRole("button", { name: /upgrades/i }).click();
await page.waitForTimeout(300);
await page.screenshot({ path: "/workspace/screenshots/shop.png" });

// Read score text
const body = await page.locator("body").innerText();

console.log(JSON.stringify({ errors, bodySnippet: body.slice(0, 500) }, null, 2));
await browser.close();
