// Screenshot the detail panel of one skill, scrolled through its sections. usage: node tests/screenshot-panel.mjs <id> [out-dir]
import { chromium } from "playwright-core";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const id = process.argv[2] || "C.2.1";
const out = path.resolve(process.argv[3] || path.join(ROOT, "temp/shots"));
const browser = await chromium.launch({ executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", headless: true });
const ctx = await browser.newContext({ viewport: { width: 1600, height: 960 } });
const p = await ctx.newPage();
const errors = [];
p.on("pageerror", (e) => errors.push(e.message));
await p.goto(pathToFileURL(path.join(ROOT, "src/web/index.html")).href);
await p.click("#btn-intro-ok");
await p.evaluate((sid) => document.querySelector(`.card[data-id="${sid}"]`).click(), id);
await p.waitForTimeout(500);
const panel = p.locator("#panel");
for (let i = 0; i < 3; i++) {
  await panel.screenshot({ path: path.join(out, `panel-${id}-${i}.png`) });
  await p.evaluate(() => { const el = document.querySelector("#panel"); el.scrollTop += el.clientHeight - 80; });
  await p.waitForTimeout(150);
}
await p.evaluate(() => document.querySelector(".ex details")?.setAttribute("open", ""));
await p.locator(".ex").screenshot({ path: path.join(out, `panel-${id}-exercise.png`) }).catch(() => {});
await browser.close();
console.log(errors.length ? errors.join("\n") : "no page errors");
