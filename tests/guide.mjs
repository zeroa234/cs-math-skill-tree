// Knowledge-map dialog: open every skill's map from its deep link, check it draws, and screenshot a few states.
// usage: node tests/guide.mjs [id ...] [--shots dir]   (no ids = every skill that has a map; shots for the first)
import { chromium } from "playwright-core";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const shotsAt = args.indexOf("--shots");
const out = path.resolve(shotsAt >= 0 ? args[shotsAt + 1] : path.join(ROOT, "temp/shots"));
const wanted = args.filter((a, i) => !a.startsWith("--") && (shotsAt < 0 || i !== shotsAt + 1));
fs.mkdirSync(out, { recursive: true });

const data = JSON.parse(fs.readFileSync(path.join(ROOT, "output/skilltree.json"), "utf8"));
const ids = wanted.length ? wanted : data.skills.filter((s) => s.guide).map((s) => s.id);
const url = pathToFileURL(path.join(ROOT, "src/web/index.html")).href;
const browser = await chromium.launch({ executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", headless: true });
const failures = [];

async function check(page, id, shots) {
  const errors = [];
  page.removeAllListeners("pageerror");
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(`${url}#skill/${id}/guide`);
  await page.waitForSelector("dialog.guide[open] .g-svg .markmap-node", { timeout: 8000 });
  await page.waitForTimeout(700);
  const s = data.skills.find((x) => x.id === id);
  const leaves = (items) => items.reduce((n, it) => n + 1 + leaves(it.items || []), 0);
  const r = await page.evaluate(() => {
    const d = document.querySelector("dialog.guide");
    return {
      title: d.querySelector("h2").textContent,
      nodes: d.querySelectorAll(".markmap-node").length,
      coverage: d.querySelectorAll(".g-coverage li").length,
      hash: location.hash,
      overflowX: document.documentElement.scrollWidth > window.innerWidth,
    };
  });
  const outline = JSON.parse(fs.readFileSync(path.join(ROOT, "output/outlines.json"), "utf8"))[id].outline;
  if (!r.title.includes(s.name)) failures.push(`${id}: wrong title ${r.title}`);
  if (r.nodes !== leaves(outline) + 1) failures.push(`${id}: drew ${r.nodes} nodes, outline has ${leaves(outline) + 1}`);
  if (!r.coverage) failures.push(`${id}: no coverage list`);
  if (r.hash !== `#skill/${id}/guide`) failures.push(`${id}: hash ${r.hash}`);
  if (shots) {
    await page.screenshot({ path: path.join(out, `guide-${id}-${shots}-map.png`) });
    await page.click('[aria-label="放大"] >> nth=-1');
    await page.click('[aria-label="放大"] >> nth=-1');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(out, `guide-${id}-${shots}-zoom.png`) });
    await page.click(".g-coverage .g-ref >> nth=-1").catch(() => failures.push(`${id}: no coverage ref to click`));
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(out, `guide-${id}-${shots}-reveal.png`) });
    await page.click('[data-lang="both"]');
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(out, `guide-${id}-${shots}-both.png`) });
    await page.click('[data-lang="zh"]');
    await page.waitForTimeout(300);
  }
  await page.keyboard.press("Escape");
  await page.waitForTimeout(150);
  const after = await page.evaluate(() => ({ open: !!document.querySelector("dialog.guide[open]"), hash: location.hash }));
  if (after.open || after.hash !== `#skill/${id}`) failures.push(`${id}: Esc left ${JSON.stringify(after)}`);
  if (errors.length) failures.push(`${id}: page errors ${errors.join(" | ")}`);
  return r;
}

const desktop = await (await browser.newContext({ viewport: { width: 1600, height: 960 } })).newPage();
for (const [i, id] of ids.entries()) {
  const r = await check(desktop, id, i === 0 || wanted.length ? "desktop" : "");
  console.log(`${id} nodes ${r.nodes} coverage ${r.coverage}`);
}
const phone = await (await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })).newPage();
const r = await check(phone, ids[0], "phone");
if (r.overflowX) failures.push(`${ids[0]}: horizontal scroll on phone`);
await browser.close();
console.log(failures.length ? `FAIL\n${failures.join("\n")}` : `ok: ${ids.length} knowledge maps`);
process.exit(failures.length ? 1 : 0);
