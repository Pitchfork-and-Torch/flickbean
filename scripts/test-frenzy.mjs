import { chromium } from "playwright";
const browser = await chromium.launch({ args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });

await page.goto("http://127.0.0.1:8080/", { waitUntil: "networkidle" });
await page.getByRole("button", { name: /rubbing/i }).click();
await page.waitForTimeout(400);

const box = await page.locator("canvas").boundingBox();
const cx = box.x + box.width / 2;
const cy = box.y + box.height * 0.48;

await page.evaluate(async ({ cx, cy }) => {
  const canvas = document.querySelector("canvas");
  const fire = (type, x, y) => {
    canvas.dispatchEvent(new PointerEvent(type, {
      bubbles: true, cancelable: true, clientX: x, clientY: y,
      pointerId: 7, pointerType: "mouse",
      buttons: type === "pointerup" ? 0 : 1,
      pressure: type === "pointerup" ? 0 : 0.5,
    }));
  };
  fire("pointerdown", cx, cy);
  for (let i = 0; i < 500; i++) {
    const a = i * 0.35;
    fire("pointermove", cx + Math.cos(a) * 80, cy + Math.sin(a) * 80);
    await new Promise((r) => setTimeout(r, 6));
  }
  fire("pointerup", cx, cy);
}, { cx, cy });

await page.waitForTimeout(400);
const prize = page.getByRole("dialog", { name: /frenzy prize/i });
const prizeVisible = await prize.isVisible();
await page.screenshot({ path: "/workspace/screenshots/prize-modal.png" });

// Share on X
const [sharePopup] = await Promise.all([
  page.waitForEvent("popup", { timeout: 4000 }).catch(() => null),
  page.getByRole("button", { name: /share on x/i }).click(),
]);
const shareUrl = sharePopup ? sharePopup.url() : null;
if (sharePopup) await sharePopup.close();

await page.getByRole("button", { name: /keep rubbing/i }).click();
await page.waitForTimeout(200);

// Credit follow from start would need restart - test in-game credit
const [followPopup] = await Promise.all([
  page.waitForEvent("popup", { timeout: 4000 }).catch(() => null),
  page.getByRole("button", { name: /SuddenlyJon/i }).first().click(),
]);
const followUrl = followPopup ? followPopup.url() : null;
if (followPopup) await followPopup.close();

await page.screenshot({ path: "/workspace/screenshots/after-prize.png" });
console.log(JSON.stringify({ errors, prizeVisible, shareUrl, followUrl }, null, 2));
await browser.close();
