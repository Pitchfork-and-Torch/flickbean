#!/usr/bin/env node
/**
 * Prove the 18+ checkbox gate: blocked until checked+Enter, then start screen,
 * then persisted across reload. Pass a URL (local or live).
 */
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { chromium } from "playwright";
import { AGE_STORAGE_KEY } from "./lib/age.mjs";

const url = process.argv[2] || "http://127.0.0.1:8080/";
const outPng = process.argv[3] || "screenshots/age-gate.png";
const timeoutMs = Number(process.env.BROWSER_SMOKE_TIMEOUT_MS || 45000);

mkdirSync(dirname(outPng), { recursive: true });

const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

const errors = [];

async function checkboxReady(page) {
  await page.getByRole("checkbox", { name: /i am 18 or older/i }).waitFor({
    state: "visible",
    timeout: 15000,
  });
}

try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.on("pageerror", (err) => errors.push(String(err?.message || err)));

  await page.goto(url, { waitUntil: "load", timeout: timeoutMs });

  const dialog = page.getByRole("dialog", { name: /18\+/i });
  await dialog.waitFor({ state: "visible", timeout: 15000 });
  await checkboxReady(page);

  const startBtn = page.getByRole("button", { name: /rubbing/i });
  const enterBtn = page.getByRole("button", { name: /^enter$/i });
  const checkbox = page.getByRole("checkbox", { name: /i am 18 or older/i });

  const blockedStart = await startBtn.count();
  const enterDisabled = await enterBtn.isDisabled();
  const gateText = await dialog.innerText();
  const visitsOnGate = /visits/i.test(gateText);
  const hitsScriptOnGate = await page
    .locator('script[data-site="flickbean"][src*="hits.jonbailey.xyz"]')
    .count();

  await page.screenshot({ path: outPng, fullPage: false });

  await checkbox.click();
  await page.waitForFunction(
    () =>
      document.querySelector('[role="checkbox"]')?.getAttribute("aria-checked") ===
      "true",
  );
  const boxChecked = await checkbox.isChecked();
  const enterEnabled = await enterBtn.isEnabled();
  await enterBtn.click();
  await dialog.waitFor({ state: "hidden", timeout: 8000 });
  await startBtn.waitFor({ state: "visible", timeout: 8000 });
  await page
    .locator('script[data-site="flickbean"][src*="hits.jonbailey.xyz"]')
    .waitFor({ state: "attached", timeout: 8000 });
  const hitsAfterEnter = await page
    .locator('script[data-site="flickbean"][src*="hits.jonbailey.xyz"]')
    .count();

  const stored = await page.evaluate((key) => localStorage.getItem(key), AGE_STORAGE_KEY);

  await page.reload({ waitUntil: "load", timeout: timeoutMs });
  await startBtn.waitFor({ state: "visible", timeout: 8000 });
  const gateAfterReload = await page.getByRole("dialog", { name: /18\+/i }).count();
  const startAfterReload = await page.getByRole("button", { name: /rubbing/i }).count();

  const result = {
    url,
    blockedStart,
    enterDisabled,
    visitsOnGate,
    hitsScriptOnGate,
    hitsAfterEnter,
    boxChecked,
    enterEnabled,
    stored,
    gateAfterReload,
    startAfterReload,
    errors,
    screenshot: outPng,
  };
  console.log(JSON.stringify(result, null, 2));

  const ok =
    blockedStart === 0 &&
    enterDisabled &&
    !visitsOnGate &&
    hitsScriptOnGate === 0 &&
    hitsAfterEnter > 0 &&
    boxChecked &&
    enterEnabled &&
    stored === "1" &&
    gateAfterReload === 0 &&
    startAfterReload > 0 &&
    errors.length === 0;
  process.exit(ok ? 0 : 1);
} catch (err) {
  console.error(JSON.stringify({ ok: false, url, error: String(err?.message || err), errors }, null, 2));
  process.exit(1);
} finally {
  await browser.close();
}
