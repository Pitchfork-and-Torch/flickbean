import { chromium } from "playwright";
const browser = await chromium.launch({ args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));

await page.goto("http://127.0.0.1:8080/", { waitUntil: "networkidle" });
await page.getByRole("button", { name: /rubbing/i }).click();
await page.waitForTimeout(300);

// Trigger prize via synthetic fast input
const box = await page.locator("canvas").boundingBox();
const cx = box.x + box.width / 2, cy = box.y + box.height * 0.48;
await page.evaluate(async ({ cx, cy }) => {
  const canvas = document.querySelector("canvas");
  const fire = (type, x, y) => canvas.dispatchEvent(new PointerEvent(type, {
    bubbles: true, cancelable: true, clientX: x, clientY: y,
    pointerId: 7, pointerType: "mouse", buttons: type === "pointerup" ? 0 : 1, pressure: 0.5,
  }));
  fire("pointerdown", cx, cy);
  for (let i = 0; i < 400; i++) {
    const a = i * 0.35;
    fire("pointermove", cx + Math.cos(a) * 80, cy + Math.sin(a) * 80);
    await new Promise((r) => setTimeout(r, 6));
  }
  fire("pointerup", cx, cy);
}, { cx, cy });
await page.waitForTimeout(400);

// No prize modal
const prizeDialog = await page.getByRole("dialog", { name: /frenzy prize/i }).count();
const body = await page.locator("body").innerText();

// Open stats and share
await page.getByRole("button", { name: /stats/i }).click();
await page.waitForTimeout(200);
const [popup] = await Promise.all([
  page.waitForEvent("popup", { timeout: 4000 }).catch(() => null),
  page.getByRole("button", { name: /share stats on x/i }).click(),
]);
const shareUrl = popup ? popup.url() : null;
if (popup) await popup.close();
await page.screenshot({ path: "/workspace/screenshots/stats-share.png" });

console.log(JSON.stringify({ errors, prizeDialog, shareUrl, hasPrizeInBody: /frenzy prizes/i.test(body) || /PRIZE/i.test(body), bodySnippet: body.slice(0, 250) }, null, 2));
await browser.close();
