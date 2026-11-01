import fs from "node:fs";
// Headless check of src/web/index.html in the system Edge (no browser download).
// usage: node tests/screenshot.mjs [out-dir]   — writes PNGs and prints console errors
import { chromium } from "playwright-core";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const browserTemp = path.join(ROOT, "temp/browser-qa");
fs.mkdirSync(browserTemp, { recursive: true });
process.env.TEMP = process.env.TMP = browserTemp;
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
await page("12-deep-link", DESK, async (p) => {
  // regression: Panzoom's deferred start pan used to reset a deep link to the origin now and then
  for (let i = 0; i < 3; i++) {
    await p.goto(`${url}#map/A`);
    await p.waitForTimeout(500);
    const top = await p.evaluate(() => [...document.querySelectorAll(".lane")].find((l) => l.textContent.includes("人工智能")).getBoundingClientRect().top);
    if (top < 40 || top > 200) throw new Error(`#map/A left lane A at y=${Math.round(top)}`);
  }
});
await page("13-overview-zoom", DESK, async (p) => {
  await dismissIntro(p);
  const scale = () => p.evaluate(() => Number(/scale\(([\d.]+)\)/.exec(document.querySelector(".ov-stage").style.transform)?.[1]));
  const s0 = await scale();
  await p.mouse.move(900, 500);
  await p.mouse.wheel(0, -400);
  await p.waitForTimeout(300);
  const s1 = await scale();
  if (!(s1 > s0)) throw new Error(`wheel did not zoom the overview (${s0} -> ${s1})`);
  // a drag that starts on a tile pans and must not open the lane
  const box = await p.locator('.region[data-lane="F"] .rg-mini-wrap').boundingBox();
  await p.mouse.move(box.x + 20, box.y + 10);
  await p.mouse.down();
  await p.mouse.move(box.x + 160, box.y + 90, { steps: 8 });
  await p.mouse.up();
  await p.waitForTimeout(300);
  if (!(await p.locator("#ov-wrap").isVisible())) throw new Error("dragging a tile opened the map");
  await p.keyboard.press("0");
  await p.waitForTimeout(200);
  if (Math.abs((await scale()) - s0) > 0.01) throw new Error("key 0 did not fit the overview again");
  await p.click('.region[data-lane="F"] .rg-mini-wrap', { force: true });
  await p.waitForTimeout(300);
  if (!(await p.locator("#map-wrap").isVisible())) throw new Error("a plain click on a tile did not open the map");
  await p.goBack();
  await p.waitForTimeout(300);
});
await page("15-goal-cancel", DESK, async (p) => {
  await p.goto(`${url}#skill/C.2.1`);
  await p.waitForTimeout(400);
  await p.click("text=设为目标，排出学习顺序");
  if (!(await p.locator("#plan").isVisible())) throw new Error("setting a goal did not show the plan");
  await p.click("#panel >> text=取消目标");
  if (await p.locator("#plan").isVisible()) throw new Error("取消目标 in the panel did not clear the goal");
  await p.click("text=设为目标，排出学习顺序");
  if ((await p.locator("#btn-plan-clear").textContent()) !== "取消目标") throw new Error("plan button is not labelled 取消目标");
  await p.click("#btn-plan-clear");
  if (await p.locator("#plan").isVisible()) throw new Error("the plan button did not clear the goal");
  await p.selectOption("#route-select", "1");
  if ((await p.locator("#btn-plan-clear").textContent()) !== "退出路线") throw new Error("route plan button is not labelled 退出路线");
  await p.click("#btn-plan-clear");
  if ((await p.locator("#route-select").inputValue()) !== "") throw new Error("leaving the route did not reset the route menu");
});
await page("16-cascade-unlearn", DESK, async (p) => {
  const lit = async () => Number(await p.locator("#lit-count").textContent());
  const btn = (name) => p.locator("#panel .status-actions button", { hasText: name });
  await p.goto(`${url}#skill/P.1.1`);
  await p.waitForTimeout(300);
  await btn("学会了，点亮").click();
  await p.goto(`${url}#skill/P.2.2`);
  await p.waitForTimeout(300);
  await btn("学会了，点亮").click();
  await p.goto(`${url}#skill/P.1.1`);
  await p.waitForTimeout(300);
  await btn("取消点亮").click();
  await btn("都不取消").click();
  if ((await lit()) !== 2) throw new Error("都不取消 changed the progress");
  await btn("取消点亮").click();
  await btn("一起取消").click();
  if ((await lit()) !== 0) throw new Error("一起取消 did not cancel the skill and its lit dependents");
  await p.click("#toast-action");
  if ((await lit()) !== 2) throw new Error("撤销 did not restore both skills");
});
await page("14-phone-overview-scroll", PHONE, async (p) => {
  const y = await p.evaluate(() => { const a = document.querySelector(".ov-scroll"); a.scrollTop = 600; return a.scrollTop; });
  if (y < 500) throw new Error(`phone overview list does not scroll (scrollTop ${y})`);
});
await browser.close();
console.log(errors.length ? errors.join("\n") : "no console errors");
