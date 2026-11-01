// 宣传片里“星图 → 分层”那段动画的数据：两套布局都由真实数据算出，画面不手摆。
//   星图：data/source/chatgpt-outputs 的 259 个节点 + 565 条关系（317 条 edges + 248 条从属），
//         用 d3-force 排（固定随机种子，结果可复现），同领域聚成一团，样子接近 ChatGPT 原图。
//   分层：output/skilltree.json 的 201 个技能，横坐标 = 第几步，纵坐标 = 技能地图里的泳道和行（按页面同样的方式叠泳道）。
// 用法：node scripts/promo/build-graph.mjs   → src/promo/public/build/graph.json（Remotion 读）
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { forceSimulation, forceLink, forceManyBody, forceCollide, forceX, forceY } from "d3-force";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const src = JSON.parse(fs.readFileSync(path.join(ROOT, "data/source/chatgpt-outputs/knowledge-map-data.json"), "utf8"));
const tree = JSON.parse(fs.readFileSync(path.join(ROOT, "output/skilltree.json"), "utf8"));
const W = 1920, H = 1080;

// ── 星图 ─────────────────────────────────────────────
let seed = 20261101;
const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
const domains = src.nodes.filter((n) => n.kind === "领域").map((n) => n.id);
const nodes = src.nodes.map((n) => {
  const a = (domains.indexOf(n.domain) / domains.length) * Math.PI * 2;      // 领域先按圆周摆开，再让力学收拢
  return { id: n.id, kind: n.kind, domain: n.domain, name: n.name, x: Math.cos(a) * 300 + rand() * 40, y: Math.sin(a) * 300 + rand() * 40 };
});
const byId = new Map(nodes.map((n) => [n.id, n]));
const parentLinks = src.nodes.filter((n) => n.parent && n.parent !== "ROOT" && byId.has(n.parent)).map((n) => ({ source: n.parent, target: n.id, type: "parent" }));
const edgeLinks = src.edges.filter((e) => byId.has(e.source) && byId.has(e.target)).map((e) => ({ source: e.source, target: e.target, type: e.type }));
const links = [...parentLinks, ...edgeLinks];
const sim = forceSimulation(nodes).randomSource(rand)
  .force("link", forceLink(links).id((d) => d.id)
    .distance((l) => (l.type === "parent" ? (l.source.kind === "领域" ? 70 : 34) : 120))
    .strength((l) => (l.type === "parent" ? 0.9 : 0.015)))
  .force("charge", forceManyBody().strength((d) => (d.kind === "领域" ? -900 : d.kind === "分支" ? -120 : -40)))
  .force("collide", forceCollide((d) => (d.kind === "领域" ? 26 : d.kind === "分支" ? 9 : 5)))
  .force("x", forceX(0).strength(0.03)).force("y", forceY(0).strength(0.045))
  .stop();
for (let i = 0; i < 900; i++) sim.tick();
// 缩放到画面：留出四边，长宽比按 16:9
const xs = nodes.map((n) => n.x), ys = nodes.map((n) => n.y);
const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
const k = Math.min((W - 360) / (x1 - x0), (H - 220) / (y1 - y0));
const star = nodes.map((n) => ({ id: n.id, kind: n.kind, domain: n.domain, name: n.name,
  x: +(W / 2 + (n.x - (x0 + x1) / 2) * k).toFixed(1), y: +(H / 2 + (n.y - (y0 + y1) / 2) * k).toFixed(1) }));
const starEdges = links.map((l) => [l.source.id, l.target.id, l.type]);

// ── 分层（技能地图的坐标）──────────────────────────────
const LANE_GAP = 18, LANE_HEAD = 46;   // 与 src/web/app.js 一致（LANE_HEAD 只影响整体平移，取页面的量级即可）
const laneTop = new Map();
let y = 0;
for (const l of tree.lanes) { laneTop.set(l.id, y); y += l.height + LANE_GAP; }
const card = tree.meta.card;
const raw = tree.skills.map((s) => ({ id: s.id, x: s.x + card.w / 2, y: laneTop.get(s.lane) + LANE_HEAD + s.y + card.h / 2 }));
const rx = raw.map((r) => r.x), ry = raw.map((r) => r.y);
const L = { left: 250, right: W - 150, top: 150, bottom: H - 120 };
const sx = (L.right - L.left) / (Math.max(...rx) - Math.min(...rx)), sy = (L.bottom - L.top) / (Math.max(...ry) - Math.min(...ry));
const pos = new Map(raw.map((r) => [r.id, { x: +(L.left + (r.x - Math.min(...rx)) * sx).toFixed(1), y: +(L.top + (r.y - Math.min(...ry)) * sy).toFixed(1) }]));
const skills = tree.skills.map((s) => ({ id: s.id, name: s.name, lane: s.lane, domain: s.domain, step: s.step, reach: s.reach, unlocks: s.unlocks, ...pos.get(s.id) }));
const req = tree.skills.flatMap((s) => s.required.map((r) => [r.id ?? r, s.id]));
const rec = tree.skills.flatMap((s) => s.recommended.map((r) => [r.id ?? r, s.id]));
const lanes = tree.lanes.map((l) => {
  const ys = skills.filter((s) => s.lane === l.id).map((s) => s.y);
  return { id: l.id, short: l.short, name: l.name, color: l.color, y0: Math.min(...ys) - 6, y1: Math.max(...ys) + 6 };
});
const steps = [...new Set(skills.map((s) => s.step))].sort((a, b) => a - b)
  .map((st) => ({ step: st, x: skills.find((s) => s.step === st).x }));

// ── 详情、导览两段要上屏的数字和原文（都从数据里取）────────────
const outlines = JSON.parse(fs.readFileSync(path.join(ROOT, "output/outlines.json"), "utf8"));
const guide = { guides: 0, branches: 0, points: 0, titles: 0 };
const walk = (n) => { guide.titles++; const c = n.items || []; if (!c.length) guide.points++; c.forEach(walk); };
for (const g of Object.values(outlines)) { guide.guides++; guide.branches += g.outline.length; g.outline.forEach(walk); }
// 前置依据：几门课官网上的先修原文（逐字；超过 120 字符的在词边界截断，加省略号）
const clip = (t) => {
  if (t.length <= 120) return t;
  const e = t.indexOf(" ...");                 // 原文自带省略号的，就截在那里
  return (e > 0 && e < 120 ? t.slice(0, e) : t.slice(0, t.lastIndexOf(" ", 110)).replace(/[,;:]$/, "")) + " …";
};
const quotes = [["C.2.1", "CS 162"], ["M.1.1", "18.01SC"], ["A.2.3", "CS 231n"], ["C.1.1", "CS 61C"]].map(([id, key]) => {
  const sk = tree.skills.find((x) => x.id === id);
  const c = sk.courses.find((x) => x.course.includes(key));
  return { skill: sk.name, school: c.school.replace(/ \(MIT OpenCourseWare\)/, ""), course: c.course, text: clip(c.prereq_text) };
});
const stats = { ...tree.meta, guide, lanes: tree.lanes.length };

const out = path.join(ROOT, "src/promo/public/build/graph.json");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify({ meta: tree.meta, domainColor: Object.fromEntries(tree.lanes.map((l) => [l.domain, l.color])),
  star, starEdges, skills, req, rec, lanes, steps, stats, quotes }));
console.log("导览图", JSON.stringify(guide));
for (const q of quotes) console.log(`  ${q.course}: ${q.text}`);
console.log(`星图 ${star.length} 节点 / ${starEdges.length} 条关系；分层 ${skills.length} 技能、${req.length} 条必须、${rec.length} 条推荐、${steps.length} 步 → ${path.relative(ROOT, out)}`);
