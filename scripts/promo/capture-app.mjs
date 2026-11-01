// 宣传片用的页面截图：系统 Edge 无头、深色模式、1920×1080 视口、2 倍像素（视频里推近时字也清楚）。
// 每张图同时记下要指的元素（卡片、按钮）在视口里的位置（CSS px），写进 shots.json，视频里的鼠标和推镜头按它走。
// 用法：node scripts/promo/capture-app.mjs [输出目录，默认 src/promo/public/shots]
import { chromium } from "playwright-core";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const out = path.resolve(process.argv[2] || path.join(ROOT, "src/promo/public/shots"));
fs.mkdirSync(out, { recursive: true });
const url = pathToFileURL(path.join(ROOT, "src/web/index.html")).href;
const browser = await chromium.launch({ executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", headless: true });
const VIEW = { width: 1920, height: 1080 };
const meta = {};
const errors = [];

async function open(viewport = VIEW, store = { introSeen: true }) {
  const ctx = await browser.newContext({ viewport, colorScheme: "dark", deviceScaleFactor: 2 });
  // 进度直接写进 localStorage（和页面自己存的格式一样），省掉“知道了”等前置点击
  await ctx.addInitScript((s) => localStorage.setItem("cs-math-skilltree/v1", JSON.stringify(s)), { collapsed: ["X"], learned: [], goal: [], goalLabel: "", ...store });
  const p = await ctx.newPage();
  p.setDefaultTimeout(8000);
  p.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  p.on("pageerror", (e) => errors.push(e.message));
  return { ctx, p };
}
const box = async (p, sel) => {
  const b = await p.locator(sel).first().boundingBox();
  if (!b) throw new Error(`没找到 ${sel}`);
  return { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) };
};
async function shot(p, name, targets = {}, opts = {}) {
  await p.waitForTimeout(opts.wait ?? 700);
  const t = {};
  for (const [k, sel] of Object.entries(targets)) t[k] = await box(p, sel);
  const file = `${name}.png`;
  if (opts.element) await p.locator(opts.element).screenshot({ path: path.join(out, file) });
  else await p.screenshot({ path: path.join(out, file) });
  const vp = p.viewportSize();
  meta[name] = { file, w: opts.elementBox?.w ?? vp.width, h: opts.elementBox?.h ?? vp.height, targets: t };
  console.log(name, JSON.stringify(t));
}

// 1. 总览 + 悬停“计算机系统与网络”
{
  const { ctx, p } = await open();
  await p.goto(url + "#overview");
  await shot(p, "overview", { C: '.region[data-lane="C"]', M2: '.region[data-lane="M2"]', X: '.region[data-lane="X"]' }, { wait: 1200 });
  await p.hover('.region[data-lane="C"]');
  await shot(p, "overview-hover-C", { C: '.region[data-lane="C"]' });
  // 2. 点进这个领域 → 技能地图
  await p.click('.region[data-lane="C"] .rg-main');
  await shot(p, "map-C", { os: '.card[data-id="C.2.1"]' }, { wait: 1200 });
  // 3. 选中操作系统：整条前置链高亮
  await p.locator('.card[data-id="C.2.1"]').dispatchEvent("click");
  await shot(p, "os", { os: '.card[data-id="C.2.1"]', panel: "#panel" });
  await ctx.close();
}
// 4. 点亮程序设计基础（第 1 步，学完直接解锁 27 个）
{
  const { ctx, p } = await open();
  await p.goto(url + "#map/P");
  await p.waitForTimeout(1200);
  await shot(p, "p11-map", { card: '.card[data-id="P.1.1"]' }, { wait: 300 });
  await p.locator('.card[data-id="P.1.1"]').dispatchEvent("click");
  await shot(p, "p11-before", { card: '.card[data-id="P.1.1"]', learn: "#panel >> text=学会了，点亮" });
  await p.click("#panel >> text=学会了，点亮");
  await shot(p, "p11-after", { card: '.card[data-id="P.1.1"]', toast: "#toast" }, { wait: 900 });
  // 5. 接着把深度学习设为目标：左栏排出带编号的学习清单（先等点亮的提示条自己收起）
  await p.locator("#toast").waitFor({ state: "hidden", timeout: 20000 });
  await p.goto(url + "#skill/A.2.3");
  await p.waitForTimeout(1200);
  await shot(p, "goal-before", { card: '.card[data-id="A.2.3"]', btn: "#panel >> text=设为目标，排出学习顺序" }, { wait: 300 });
  await p.click("#panel >> text=设为目标，排出学习顺序");
  await shot(p, "goal-after", { card: '.card[data-id="A.2.3"]', plan: "#plan" }, { wait: 900 });
  await ctx.close();
}
// 6. 详情面板整页（视口拉高，面板不用滚动就全部展开），视频里在框里往下“滚”
{
  const { ctx, p } = await open({ width: 1920, height: 4200 });
  await p.goto(url + "#skill/C.2.1");
  await p.waitForTimeout(1500);
  const pb = await box(p, "#panel-inner");
  const sh = await p.evaluate(() => document.querySelector("#panel-inner").scrollHeight);
  const secs = await p.evaluate(() => [...document.querySelectorAll("#panel-inner h3, #panel-inner h4, #panel-inner .sec-title")]
    .map((h) => ({ text: h.textContent.trim().slice(0, 20), y: Math.round(h.getBoundingClientRect().top) })));
  console.log("panel", pb, "scrollHeight", sh, secs);
  await p.locator("#panel-inner").screenshot({ path: path.join(out, "panel-os.png") });
  meta["panel-os"] = { file: "panel-os.png", w: pb.w, h: Math.min(pb.h, sh), sections: secs.map((s) => ({ ...s, y: s.y - pb.y })), targets: {} };
  await ctx.close();
}
// 7. 知识导览图：操作系统，再加几张做快切
for (const id of ["C.2.1", "M.1.1", "A.2.3", "F.1.5", "C.1.1"]) {
  const { ctx, p } = await open();
  await p.goto(`${url}#skill/${id}/guide`);
  await p.waitForTimeout(2500);
  await shot(p, `guide-${id}`, {}, { wait: 300 });
  await ctx.close();
}
fs.writeFileSync(path.join(out, "shots.json"), JSON.stringify({ view: VIEW, scale: 2, shots: meta }, null, 1));
await browser.close();
if (errors.length) { console.error("页面报错：\n" + errors.join("\n")); process.exit(1); }
console.log("ok →", out);
