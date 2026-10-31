// Headless check of src/web/index.html in the system Edge (no browser download).
// usage: node tests/screenshot.mjs [out-dir]   — writes PNGs and prints console errors
import { chromium } from "playwright-core";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.resolve(process.argv[2] || path.join(ROOT, "temp/shots"));
const url = pathToFileURL(path.join(ROOT, "src/web/index.html")).href;
const browser = await chromium.launch({ executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", headless: true });
const errors = [];
async function page(name, viewport, steps = async () => {}, scheme = "light") {
  const ctx = await browser.newContext({ viewport, colorScheme: scheme, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  p.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") errors.push(`[${name}] ${m.type()}: ${m.text()}`); });
  p.on("pageerror", (e) => errors.push(`[${name}] pageerror: ${e.message}`));
  await p.goto(url);
  await p.waitForTimeout(400);
  await steps(p);
  await p.waitForTimeout(350);
  await p.screenshot({ path: path.join(out, `${name}.png`) });
  await ctx.close();
}
await page("01-first-visit", { width: 1600, height: 960 });
await page("02-select-os", { width: 1600, height: 960 }, async (p) => {
  await p.click("#btn-intro-ok");
  await p.fill("#search-input", "操作系统");
  await p.keyboard.press("Enter");
});
await page("03-learn-flow", { width: 1600, height: 960 }, async (p) => {
  await p.click("#btn-intro-ok");
  await p.click('.card[data-id="P.1.1"]');
  await p.click("text=学会了，点亮");
  await p.click('.card[data-id="P.2.2"]');
});
await page("04-route", { width: 1600, height: 960 }, async (p) => {
  await p.click("#btn-intro-ok");
  await p.selectOption("#route-select", "2");
});
await page("05-dark-locked", { width: 1600, height: 960 }, async (p) => {
  await p.click("#btn-intro-ok");
  await p.fill("#search-input", "Operating Systems");
  await p.keyboard.press("Enter");
}, "dark");
await page("06-phone", { width: 390, height: 844 }, async (p) => {
  await p.click('.card[data-id="P.1.1"]');
});
await browser.close();
console.log(errors.length ? errors.join("\n") : "no console errors");
