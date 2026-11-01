// README preview screenshots (docs/images/{overview,skill-map,goal,guide}.webp) from the current build.
// usage: node scripts/readme-images.mjs   — needs Python with Pillow for the WebP step (run build first)
import { chromium } from "playwright-core";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const shots = path.join(ROOT, "temp/readme-shots");
fs.mkdirSync(shots, { recursive: true });
process.env.TEMP = process.env.TMP = shots;  // keep the browser profile off the system disk
const url = pathToFileURL(path.join(ROOT, "src/web/index.html")).href;
const browser = await chromium.launch({ executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", headless: true });
const errors = [];

async function shot(name, steps) {
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, colorScheme: "dark", deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  p.on("pageerror", (e) => errors.push(`[${name}] ${e.message}`));
  await p.goto(url);
  await p.click("#btn-intro-ok");
  await steps(p);
  await p.waitForTimeout(800);
  await p.screenshot({ path: path.join(shots, `${name}.png`) });
  await ctx.close();
}

await shot("overview", async () => {});
await shot("skill-map", async (p) => {
  await p.fill("#search-input", "操作系统");
  await p.keyboard.press("Enter");
});
await shot("goal", async (p) => {
  await p.evaluate(() => { location.hash = "skill/P.1.1"; });
  await p.click("text=学会了，点亮");
  await p.waitForSelector("#toast", { state: "hidden", timeout: 8000 });  // the "已点亮…撤销" toast hides after 6 s
  await p.evaluate(() => { location.hash = "skill/A.2.3"; });
  await p.click("text=设为目标，排出学习顺序");
});
await shot("guide", async (p) => {
  await p.evaluate(() => { location.hash = "skill/M.1.1/guide"; });
  await p.waitForSelector(".markmap, svg.markmap", { timeout: 10000 }).catch(() => {});
  await p.waitForTimeout(1200);
});
await browser.close();
if (errors.length) throw new Error(errors.join("\n"));

const py = `
import sys
from PIL import Image
src, dst = sys.argv[1], sys.argv[2]
for n in ["overview", "skill-map", "goal", "guide"]:
    Image.open(f"{src}/{n}.png").convert("RGB").save(f"{dst}/{n}.webp", quality=82, method=6)
`;
execFileSync("python", ["-c", py, shots, path.join(ROOT, "docs/images")], { stdio: "inherit" });
console.log("docs/images/{overview,skill-map,goal,guide}.webp");
