// Accessibility audit with axe-core (WCAG 2.0/2.1/2.2 A + AA rules and best practices) in the system Edge,
// plus a keyboard-only walkthrough of the main task. usage: node tests/a11y.mjs [report.json]
import { chromium } from "playwright-core";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const browserTemp = path.join(ROOT, "temp/browser-qa");
fs.mkdirSync(browserTemp, { recursive: true });
process.env.TEMP = process.env.TMP = browserTemp;
const url = pathToFileURL(path.join(ROOT, "src/web/index.html")).href;
const AXE = path.join(ROOT, "node_modules/axe-core/axe.min.js");
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];
const browser = await chromium.launch({ executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", headless: true });
const DESK = { width: 1600, height: 960 };
const PHONE = { width: 390, height: 844 };

async function open(viewport, scheme = "light", hash = "") {
  const ctx = await browser.newContext({ viewport, colorScheme: scheme });
  const p = await ctx.newPage();
  p.setDefaultTimeout(5000);
  await p.goto(url + hash);
  await p.waitForTimeout(500);
  return { p, ctx };
}
async function audit(name, viewport, scheme, hash, steps = async () => {}) {
  const { p, ctx } = await open(viewport, scheme, hash);
  await steps(p);
  await p.waitForTimeout(300);
  await p.addScriptTag({ path: AXE });
  const res = await p.evaluate(async (tags) => {
    const r = await window.axe.run(document, { runOnly: { type: "tag", values: tags }, resultTypes: ["violations", "incomplete"] });
    // "incomplete" = axe could not decide (e.g. text over a gradient or a translucent dimmed card); listed for review
    // Resolve those by hand: text colour against every colour of the nearest painted background (base colour and
    // gradient stops), with ancestor opacity composited in. Pseudo-element overlays here are transparent.
    const rgba = (s) => {
      const m = s.match(/[\d.]+/g)?.map(Number) || [0, 0, 0, 0];
      // color-mix() computes to "color(srgb r g b / a)" with channels in 0..1
      return s.startsWith("color(") ? [m[0] * 255, m[1] * 255, m[2] * 255, m[3] ?? 1] : [m[0], m[1], m[2], m[3] ?? 1];
    };
    const lum = ([r, g, b]) => [r, g, b].map((c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; })
      .reduce((a, c, i) => a + c * [0.2126, 0.7152, 0.0722][i], 0);
    const over = (fg, bg) => [0, 1, 2].map((i) => fg[i] * fg[3] + bg[i] * (1 - fg[3]));
    const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
    function bgColors(e) {
      for (let n = e; n; n = n.parentElement) {
        const cs = getComputedStyle(n);
        const stops = (cs.backgroundImage.match(/rgba?\([^)]+\)/g) || []).map(rgba).filter((c) => c[3] > 0.5);
        const base = rgba(cs.backgroundColor);
        if (base[3] > 0.5 || stops.length) return [...(base[3] > 0.5 ? [base] : []), ...stops];
      }
      return [[255, 255, 255, 1]];
    }
    function worst(e) {
      const cs = getComputedStyle(e);
      if (!e.textContent.trim() || !/[\p{L}\p{N}]/u.test(e.textContent)) return null; // icons / arrows: non-text
      let opacity = 1;
      for (let n = e; n; n = n.parentElement) opacity *= Number(getComputedStyle(n).opacity);
      const fg = rgba(cs.color);
      const page = rgba(getComputedStyle(document.body).backgroundColor);
      const large = parseFloat(cs.fontSize) >= 24 || (parseFloat(cs.fontSize) >= 18.66 && Number(cs.fontWeight) >= 700);
      const min = Math.min(...bgColors(e).map((bg) => {
        const b = over(bg, page);
        const f = over([fg[0], fg[1], fg[2], fg[3] * opacity], b);
        return ratio(f, b);
      }));
      return { min, need: large ? 3 : 4.5, dimmed: opacity < 0.99 };
    }
    const review = r.incomplete.filter((v) => v.id === "color-contrast").map((v) => {
      const checked = v.nodes.map((n) => ({ t: n.target.join(" "), w: worst(document.querySelector(n.target.join(" "))) })).filter((x) => x.w);
      return {
        id: v.id, count: v.nodes.length, text: checked.length,
        fail: checked.filter((x) => x.w.min < x.w.need && !x.w.dimmed).map((x) => `${x.t} ${x.w.min.toFixed(2)}`),
        dimmed: checked.filter((x) => x.w.dimmed).length,
        lowest: checked.filter((x) => !x.w.dimmed).reduce((m, x) => Math.min(m, x.w.min), 99),
      };
    });
    const violations = r.violations.map((v) => ({
      id: v.id, impact: v.impact, help: v.help, count: v.nodes.length,
      nodes: v.nodes.slice(0, 4).map((n) => ({ target: n.target.join(" "), summary: n.failureSummary.split("\n").slice(0, 3).join(" | ") })),
    }));
    return { violations, review };
  }, TAGS);
  await ctx.close();
  return { name, ...res };
}

const results = [];
results.push(await audit("overview-light", DESK, "light", ""));
results.push(await audit("overview-dark", DESK, "dark", "", (p) => p.click("#btn-intro-ok")));
results.push(await audit("map-panel-light", DESK, "light", "#skill/C.2.1", (p) => p.evaluate(() => document.querySelector(".ex details")?.setAttribute("open", ""))));
results.push(await audit("map-panel-dark", DESK, "dark", "#skill/A.2.3"));
results.push(await audit("map-plain", DESK, "light", "#map/P"));
results.push(await audit("route-plan", DESK, "light", "", (p) => p.selectOption("#route-select", "1")));
results.push(await audit("search-open", DESK, "light", "", async (p) => { await p.fill("#search-input", "图"); }));
results.push(await audit("help-dialog", DESK, "light", "", (p) => p.click("#btn-help")));
const guideDrawn = (p) => p.waitForSelector("dialog.guide[open] .markmap-node", { timeout: 8000 });
const guideMapping = async (p) => { await guideDrawn(p); await p.click(".g-mapping summary"); };
results.push(await audit("guide-light", DESK, "light", "#skill/M.3.1/guide", guideMapping));
results.push(await audit("guide-dark", DESK, "dark", "#skill/S.1.2/guide", guideDrawn));
results.push(await audit("phone-guide", PHONE, "light", "#skill/P.5.3/guide", guideMapping));
results.push(await audit("phone-overview", PHONE, "light", ""));
results.push(await audit("phone-map-panel", PHONE, "light", "#skill/P.1.1"));
results.push(await audit("reflow-320", { width: 320, height: 640 }, "light", ""));
results.push(await audit("laptop-1366", { width: 1366, height: 768 }, "light", "#map/C"));

// keyboard-only walkthrough: reach a region, enter it, open a skill, light it, go back
const kb = [];
{
  const { p, ctx } = await open(DESK, "light", "");
  const active = () => p.evaluate(() => {
    const a = document.activeElement;
    const cs = getComputedStyle(a);
    const after = getComputedStyle(a, "::after");
    return {
      tag: a.tagName, cls: a.className, text: (a.getAttribute("aria-label") || a.textContent || "").trim().slice(0, 40),
      ring: cs.outlineStyle !== "none" || after.outlineStyle !== "none" || cs.boxShadow !== "none",
    };
  });
  await p.keyboard.press("Tab");
  const skip = await active();
  kb.push(skip.cls === "skip-link" ? "PASS first Tab lands on the skip link" : `FAIL first Tab lands on ${skip.tag}.${skip.cls}`);
  await p.keyboard.press("Enter");
  const afterSkip = await active();
  kb.push(afterSkip.cls === "rg-main" ? "PASS skip link moves focus to the first region tile" : `FAIL skip link moved focus to ${afterSkip.tag}.${afterSkip.cls}`);
  await p.keyboard.press("Shift+Tab");
  let first = null;
  for (let i = 0; i < 40; i++) {
    await p.keyboard.press("Tab");
    const a = await active();
    if (!a.ring) kb.push(`Tab ${i + 1}: focus on ${a.tag}.${a.cls} has no visible focus indicator`);
    if (a.cls === "rg-main") { first = i + 1; break; }
  }
  kb.push(first ? `PASS region tile reachable by Tab (${first} presses from the top of the page)` : "FAIL no region tile reachable by Tab");
  await p.keyboard.press("Enter");
  await p.waitForTimeout(300);
  kb.push((await p.locator("#map-wrap").isVisible()) ? "PASS Enter on a region opens its map" : "FAIL Enter on a region did not open the map");
  let card = null;
  for (let i = 0; i < 60 && !card; i++) {
    await p.keyboard.press("Tab");
    const a = await active();
    if (a.cls.startsWith("card") && a.cls.includes("avail")) card = a.text;
  }
  kb.push(card ? `PASS an available card is reachable by Tab (${card})` : "FAIL no available card reachable by Tab");
  await p.keyboard.press("Enter");
  await p.waitForTimeout(200);
  kb.push((await p.locator("#panel").isVisible()) ? "PASS Enter on a card opens the detail panel" : "FAIL Enter on a card did not open the panel");
  const before = await p.locator("#lit-count").textContent();
  await p.keyboard.press("l");
  await p.waitForTimeout(200);
  const after = await p.locator("#lit-count").textContent();
  kb.push(Number(after) === Number(before) + 1 ? "PASS L lights the selected skill" : `FAIL L did not light the skill (${before} -> ${after})`);
  await p.keyboard.press("Escape");
  await p.waitForTimeout(150);
  await p.keyboard.press("Escape");
  await p.waitForTimeout(300);
  kb.push((await p.locator("#ov-wrap").isVisible()) ? "PASS Esc, Esc closes the panel and returns to the overview" : "FAIL Esc did not return to the overview");
  const scroll = await p.evaluate(() => ["#map-wrap", ".ov-scroll"].flatMap((s) => [document.querySelector(s).scrollTop, document.querySelector(s).scrollLeft]));
  kb.push(scroll.every((v) => v === 0) ? "PASS map and overview boxes never scrolled by focus" : `FAIL boxes scrolled to ${scroll}`);
  await ctx.close();
}
await browser.close();

const report = { date: new Date().toISOString().slice(0, 10), tags: TAGS, axe: results, keyboard: kb };
if (process.argv[2]) fs.writeFileSync(process.argv[2], JSON.stringify(report, null, 1));
for (const r of results) {
  console.log(`${r.name}: ${r.violations.length ? r.violations.map((v) => `${v.id}(${v.impact},${v.count})`).join(" ") : "0 violations"}`
    + r.review.map((x) => ` · axe undecided ${x.count} (text ${x.text}, lowest ${x.lowest.toFixed(2)}:1${x.dimmed ? `, ${x.dimmed} dimmed` : ""})${x.fail.length ? ` FAIL ${x.fail.join(", ")}` : ""}`).join(""));
  for (const v of r.violations) for (const n of v.nodes) console.log(`   ${v.id} ${n.target} :: ${n.summary}`);
}
console.log(kb.join("\n"));
