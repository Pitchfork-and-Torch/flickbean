// O Count (facesCollected) must survive a reload, including bonus faces
// beyond the prize count. Requires the dev server on 127.0.0.1:8080.
import { chromium } from "playwright";
import { bypassAgeGate } from "./lib/age.mjs";

const SAVE_KEY = "flickbean-v2";
const browser = await chromium.launch({ args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await bypassAgeGate(page);
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));

const baseSave = {
  version: 2,
  rubs: 500,
  totalRubs: 2000,
  lifetimeDistance: 9000,
  bestCombo: 40,
  climaxes: 3,
  prizes: 10,
  upgrades: {},
  started: true,
  faces: [],
};

async function readOCount() {
  await page.getByRole("button", { name: /rubbing|continue/i }).click();
  await page.getByRole("button", { name: "Stats", exact: true }).click();
  const row = page.getByRole("dialog", { name: /stats/i }).locator("text=O Count").locator("..");
  const text = await row.innerText();
  const m = text.match(/O Count\s*(\d+)/);
  return m ? Number(m[1]) : null;
}

await page.goto("http://127.0.0.1:8080/", { waitUntil: "networkidle" });

// Save with bonus faces: O Count 30 while prizes is 10.
await page.evaluate(({ key, save }) => localStorage.setItem(key, JSON.stringify(save)), {
  key: SAVE_KEY,
  save: { ...baseSave, facesCollected: 30 },
});
await page.reload({ waitUntil: "networkidle" });
const afterLoad = await readOCount();

// Wait for the autosave tick, then confirm the field was written back.
await page.waitForTimeout(3200);
const written = await page.evaluate(
  (key) => JSON.parse(localStorage.getItem(key) ?? "{}").facesCollected,
  SAVE_KEY,
);
await page.reload({ waitUntil: "networkidle" });
const afterSecondLoad = await readOCount();

// Legacy save without the field: O Count falls back to prizes.
await page.evaluate(({ key, save }) => localStorage.setItem(key, JSON.stringify(save)), {
  key: SAVE_KEY,
  save: baseSave,
});
await page.reload({ waitUntil: "networkidle" });
const legacy = await readOCount();

const ok =
  errors.length === 0 &&
  afterLoad === 30 &&
  written === 30 &&
  afterSecondLoad === 30 &&
  legacy === 10;

console.log(JSON.stringify({ ok, errors, afterLoad, written, afterSecondLoad, legacy }, null, 2));
await browser.close();
process.exitCode = ok ? 0 : 1;
