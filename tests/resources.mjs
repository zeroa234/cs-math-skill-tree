// Verify actual rendered resource links and labels, including fallback/cost behavior.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright-core";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const data = JSON.parse(fs.readFileSync(path.join(ROOT, "output/skilltree.json"), "utf8"));
const review = JSON.parse(fs.readFileSync(path.join(ROOT, "data/curation/learning-resources.json"), "utf8"));
const byId = new Map(data.skills.map(s => [s.id, s]));
assert.equal(Object.keys(review.english).length, data.skills.length, "Every skill must have an audit decision");
assert.equal(data.meta.withChineseResource, data.skills.filter(s => s.zhAlt).length);
assert.equal(Object.keys(review.chinese).length + Object.keys(review.chineseGaps).length, data.skills.length);
for (const [id, entry] of Object.entries(review.chinese)) {
  assert(byId.has(id), `Unknown Chinese skill ${id}`);
  assert(review.chineseCatalog[entry.source], `Missing source ${id}`);
  assert(!review.chineseGaps[id], `Contradictory gap ${id}`);
}
for (const s of data.skills) for (const r of [s.resource, s.zhAlt, ...(s.extraResources || [])].filter(Boolean)) {
  assert(["http:", "https:"].includes(new URL(r.url).protocol));
  assert(r.title && r.covers, `Missing learning guidance for ${s.id}`);
  assert([true, false, null].includes(r.free), `Missing access classification for ${s.id}`);
}

const browserTemp = path.join(ROOT, "temp/resource-audit/browser");
fs.mkdirSync(browserTemp, { recursive: true });
process.env.TEMP = browserTemp;
process.env.TMP = browserTemp;

const browser = await chromium.launch({ executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", headless: true });
const errors = [];
const output = path.join(ROOT, "temp/resource-audit/screenshots");
fs.mkdirSync(output, { recursive: true });
try {
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 960 } });
  const page = await ctx.newPage();
  page.on("pageerror", e => errors.push(e.message));
  const url = pathToFileURL(path.join(ROOT, "src/web/index.html")).href;
  await page.goto(`${url}#skill/M.1.1`);
  await page.waitForSelector(".learning-resources");
  for (const s of data.skills) {
    await page.evaluate(id => { location.hash = `skill/${id}`; }, s.id);
    await page.waitForFunction(name => document.querySelector(".p-title")?.textContent === name, s.name);
    const links = await page.locator(".learning-resources .res a").evaluateAll(els => els.map(a => ({ href: a.href, target: a.target, rel: a.rel })));
    assert.deepEqual(links.map(l => l.href), [s.resource, s.zhAlt, ...(s.extraResources || [])].filter(Boolean).map(r => new URL(r.url).href), `Wrong links for ${s.id}`);
    assert(links.every(l => l.target === "_blank" && l.rel.includes("noopener") && l.rel.includes("noreferrer")));
    assert.equal(await page.locator(".res-heading", { hasText: "中文资源" }).count(), s.zhAlt ? 1 : 0, s.id);
    if (!s.zhAlt) assert.match(await page.locator(".learning-resources .pending").innerText(), /暂未找到/);
  }
  await page.evaluate(() => { location.hash = "skill/P.5.3"; });
  await page.waitForFunction(() => document.querySelector(".extra-resources"));
  await page.locator(".extra-resources > summary").click();
  await page.setViewportSize({ width: 390, height: 844 });
  assert(await page.locator(".extra-resources").getAttribute("open") !== null);
  assert(!(await page.locator(".learning-resources").evaluate(e => e.scrollWidth > e.clientWidth + 1)));
  // Pick examples from the data so the checks follow resource changes instead of hard-coded skills.
  const cards = s => [s.resource, s.zhAlt].filter(Boolean);
  const conditional = data.skills.filter(s => cards(s).some(r => r.free === null)).map(s => s.id);
  const zhVideo = data.skills.find(s => s.zhAlt?.tier === "video" && s.zhAlt.free === true)?.id;
  const enVideo = data.skills.find(s => s.resource?.tier === "video" && s.resource.free === true)?.id;
  assert(conditional.length >= 2 && zhVideo && enVideo, "resource examples for the layout checks are missing");
  for (const [id, width, height, file] of [["M.1.1",1600,960,"desktop"],[conditional[0],390,844,"mobile-registration"],[conditional[1],390,844,"mobile-course"],[zhVideo,390,844,"mobile-bilibili"],[enVideo,390,844,"mobile-youtube"]]) {
    await page.setViewportSize({ width, height });
    await page.evaluate(id => { location.hash = `skill/${id}`; }, id);
    await page.waitForFunction(name => document.querySelector(".p-title")?.textContent === name, byId.get(id).name);
    const section = page.locator(".learning-resources");
    await section.scrollIntoViewIfNeeded();
    const overflow = await section.evaluate(e => e.scrollWidth > e.clientWidth + 1);
    assert(!overflow, `Resource content overflows at ${width}px: ${id}`);
    await section.screenshot({ path: path.join(output, file + ".png") });
    if (file.startsWith("mobile-registration") || file === "mobile-course") assert.match(await section.innerText(), /访问条件见说明/);
    if (["mobile-bilibili", "mobile-youtube"].includes(file)) assert.match(await section.innerText(), /视频课程 · 免费/);
    if (id === "M.1.1") {
      // The primary card's own details; supplementary cards sit inside a collapsed <details>.
      const primaryDetails = section.locator(".res-list").first().locator(".res-details").first();
      await primaryDetails.locator("summary").click();
      assert(await primaryDetails.getAttribute("open") !== null);
    }
  }
  // Keep paid and missing-Chinese behavior covered even when all current cards have free alternatives.
  await page.evaluate(() => {
    const s = window.SKILLTREE.skills.find(s => s.id === "S.5.1");
    s.zhAlt = null;
    s.resource.free = false;
    location.hash = "skill/S.5.1";
  });
  await page.waitForFunction(() => document.querySelector(".p-title")?.textContent === "协议验证与信息流安全");
  assert.match(await page.locator(".learning-resources .pending").innerText(), /暂未找到/);
  assert.match(await page.locator(".learning-resources").innerText(), /付费/);
  // A Chinese resource must still render if the English entry is absent.
  await page.evaluate(() => {
    window.SKILLTREE.skills.find(s => s.id === "M.1.1").resource = null;
    location.hash = "skill/M.1.1";
  });
  await page.waitForFunction(() => document.querySelector(".p-title")?.textContent === "极限与连续");
  assert.equal(await page.locator(".learning-resources > .res-list > .res").count(), 1, "only the Chinese main card remains");
  assert.match(await page.locator(".learning-resources").innerText(), /中文资源/);
  assert.equal(errors.length, 0, errors.join("\n"));
  await ctx.close();
  console.log(`PASS: ${data.skills.length} skill panels; ${data.meta.withChineseResource} Chinese resources; desktop/mobile, cost labels, gap and Chinese-only fallback`);
} finally {
  await browser.close();
}
