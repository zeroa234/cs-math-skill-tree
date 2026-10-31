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
const DESK = { width: 1600, height: 960 };
const PHONE = { width: 390, height: 844 };
async function page(name, viewport, steps = async () => {}, scheme = "light") {
  const ctx = await browser.newContext({ viewport, colorScheme: scheme, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  p.setDefaultTimeout(5000);
  p.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") errors.push(`[${name}] ${m.type()}: ${m.text()}`); });
  p.on("pageerror", (e) => errors.push(`[${name}] pageerror: ${e.message}`));
  await p.goto(url);
  await p.waitForTimeout(400);
  try { await steps(p); } catch (e) { errors.push(`[${name}] step failed: ${e.message.split("\n")[0]}`); }
  await p.waitForTimeout(450);
  await p.screenshot({ path: path.join(out, `${name}.png`) });
  await ctx.close();
}
const dismissIntro = (p) => p.click("#btn-intro-ok");

await page("01-overview", DESK);
await page("02-overview-hover", DESK, async (p) => {
  await dismissIntro(p);
  await p.hover('.region[data-lane="C"]');
});
await page("03-enter-lane", DESK, async (p) => {
  await dismissIntro(p);
  await p.click('.region[data-lane="C"] .rg-main');
});
await page("04-select-os", DESK, async (p) => {
  await dismissIntro(p);
  await p.fill("#search-input", "操作系统");
  await p.keyboard.press("Enter");
});
await page("05-learn-flow", DESK, async (p) => {
  await dismissIntro(p);
  await p.click('.region[data-lane="P"] .rg-next-btn');
  await p.click("text=学会了，点亮");
  await p.locator('.card[data-id="P.2.2"]').dispatchEvent("click");
});
await page("06-route-overview", DESK, async (p) => {
  await dismissIntro(p);
  await p.selectOption("#route-select", "2");
});
await page("07-dark-overview", DESK, async (p) => { await dismissIntro(p); }, "dark");
await page("08-dark-map-locked", DESK, async (p) => {
  await dismissIntro(p);
  await p.fill("#search-input", "Operating Systems");
  await p.keyboard.press("Enter");
}, "dark");
await page("09-phone-overview", PHONE);
await page("10-phone-map", PHONE, async (p) => {
  await p.click('.region[data-lane="P"] .rg-next-btn');
});
await page("11-back-to-overview", DESK, async (p) => {
  await dismissIntro(p);
  await p.click('.region[data-lane="P"] .rg-main');
  await p.waitForTimeout(200);
  await p.keyboard.press("Escape");
  await p.waitForTimeout(200);
  if (!(await p.locator("#ov-wrap").isVisible())) throw new Error("Esc did not return to the overview");
  await p.goBack();
  await p.waitForTimeout(200);
  if (!(await p.locator("#map-wrap").isVisible())) throw new Error("Back did not return to the map");
  await p.goBack();
});
await browser.close();
console.log(errors.length ? errors.join("\n") : "no console errors");
