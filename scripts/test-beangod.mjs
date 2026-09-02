import { chromium } from "playwright";
import { bypassAgeGate } from "./lib/age.mjs";
const browser = await chromium.launch({ args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await bypassAgeGate(page);
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));

await page.goto("http://127.0.0.1:8080/", { waitUntil: "networkidle" });
const allChallenges = {
  collector25:true,comboKing:true,prizeHunter:true,heatWave:true,longStroke:true,ascendSkills:true,
  oCentury:true,comboGod:true,prizeLord:true,climaxStorm:true,marathon:true,mythicSkills:true,
};
await page.evaluate((challenges) => {
  localStorage.setItem("clit-grok-me-v1", JSON.stringify({
    version: 1, rubs: 1e12, totalRubs: 1e12, lifetimeDistance: 3e6, bestCombo: 700,
    climaxes: 250, prizes: 150, beanMaster: true, orbital: true, voidbean: true,
    upgrades: { softTouch:50,warmFingers:30,stamina:25,autoGlider:40,sensitiveSpot:20,afterglow:15,rhythm:25 },
    faces: [], challenges, started: true,
  }));
}, allChallenges);
await page.reload({ waitUntil: "networkidle" });
await page.getByRole("button", { name: /rubbing|continue/i }).click();
await page.waitForTimeout(400);

const rankBtn = page.getByRole("button", { name: /BEAN GOD/i });
const hasBeanGod = await rankBtn.isVisible();
await rankBtn.click();
await page.waitForTimeout(200);
const hasO = await page.getByRole("button", { name: /Title O|become O|^O$/i }).first().isVisible().catch(()=>false);
// after toggle, HUD should show O
const oChip = await page.locator("button").filter({ hasText: /^O$/ }).count();

await page.getByRole("button", { name: /^path$/i }).click();
await page.waitForTimeout(300);
await page.screenshot({ path: "/workspace/screenshots/bean-god-menu.png" });
console.log(JSON.stringify({ errors, hasBeanGod, oChip, body: (await page.locator("body").innerText()).slice(0,300) }, null, 2));
await browser.close();
