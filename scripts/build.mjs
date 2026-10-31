// Build the skill tree used by src/web/.
//
// Inputs
//   data/source/chatgpt-outputs/knowledge-map-data.json  ChatGPT original (read-only): nodes, descriptions, related edges, routes
//   data/curation/prereqs.txt        required / recommended prerequisites per skill (hand-curated)
//   data/curation/prereq-notes.json  why each prerequisite is required / recommended (optional)
//   data/curation/names-en.tsv       English names
//   data/research/nodes/<id>.json    reviewed research: learning resource + real-course prerequisite evidence
//   data/exercises/*.json            one exercise per skill
// Outputs
//   output/skilltree.json            merged data (for reuse)
//   src/web/data.js                  same data plus layout, as window.SKILLTREE
//
// Layout: one horizontal lane per domain, one column per "step". A skill's step is the longest chain of
// required prerequisites leading to it (step 1 = nothing required), so a column can only be unlocked after
// the columns to its left. Recommended prerequisites do not move cards; the page shows them on focus.
// Within each lane ELK's layered algorithm (partitioned by step) orders the cards to keep edges short.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ELK from "elkjs/lib/elk.bundled.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const rel = (...p) => path.join(ROOT, ...p);
const readJson = (p) => JSON.parse(fs.readFileSync(p, "utf8").replace(/^﻿/, ""));

const COURSE_BRANCHES = new Set(["M.1.6", "M.6.2", "M.6.3", "A.2.3"]);
const CARD_W = 176;
const CARD_H = 58;
const COL_W = CARD_W + 56;
const LANE_PAD_Y = 16;

const DOMAIN_COLORS = {
  M: "#2f7fd1", F: "#7a5bd6", P: "#1f9d74", C: "#d1792f", D: "#b8952a", A: "#c2499a",
  S: "#d0463b", H: "#5f7f22", V: "#1c97ad", I: "#7b7f8c", X: "#9a6b4f",
};

// Short names for compact labels (overview roads, "先学" hints).
const SHORT = {
  M1: "数学·分析", M2: "数学·代数离散", M3: "数学·概率优化", F: "理论", P: "程序设计", C: "系统与网络", D: "数据",
  A: "人工智能", S: "安全", H: "硬件与嵌入式", V: "图形与交互", I: "信息系统", X: "交叉前沿",
};

// Lanes = domains, except mathematics (57 skills), which is split by branch so each lane stays readable.
const LANES = [
  { id: "M1", domain: "M", prefixes: ["M.1", "M.2"], name: "数学 · 微积分、分析与微分方程", en: "Math · Calculus, Analysis & DEs" },
  { id: "M2", domain: "M", prefixes: ["M.3", "M.4", "M.5"], name: "数学 · 代数、几何与离散数学", en: "Math · Algebra, Geometry & Discrete Math" },
  { id: "M3", domain: "M", prefixes: ["M.6", "M.7", "M.8"], name: "数学 · 概率统计、优化与数值计算", en: "Math · Probability, Statistics, Optimization & Numerics" },
];
const laneOf = (s) => LANES.find((l) => l.prefixes.some((p) => s.id.startsWith(p + ".")))?.id || s.domain;

function fail(msg) {
  console.error("BUILD ERROR:", msg);
  process.exit(1);
}

// ── load ─────────────────────────────────────────────────────────────
const src = readJson(rel("data/source/chatgpt-outputs/knowledge-map-data.json"));
const nodes = new Map(src.nodes.map((n) => [n.id, n]));
const isSkill = (n) => n.kind === "主题" || COURSE_BRANCHES.has(n.id);
const skills = src.nodes.filter(isSkill);
const skillIds = new Set(skills.map((n) => n.id));

const en = new Map();
for (const line of fs.readFileSync(rel("data/curation/names-en.tsv"), "utf8").split(/\r?\n/)) {
  if (!line.trim() || line.startsWith("#")) continue;
  const [id, name] = line.split("\t");
  en.set(id.trim(), name.trim());
}

const prereqs = new Map();
for (const [i, raw] of fs.readFileSync(rel("data/curation/prereqs.txt"), "utf8").split(/\r?\n/).entries()) {
  const line = raw.replace(/#.*/, "").trim();
  if (!line) continue;
  const [id, req = "", rec = "", status = "draft"] = line.split("|").map((s) => s.trim());
  const ids = (s) => s.split(/\s+/).filter(Boolean);
  if (prereqs.has(id)) fail(`prereqs.txt line ${i + 1}: duplicate ${id}`);
  prereqs.set(id, { required: ids(req), recommended: ids(rec), status });
}

const notesPath = rel("data/curation/prereq-notes.json");
const notes = fs.existsSync(notesPath) ? readJson(notesPath) : {};

const research = new Map();
const researchDir = rel("data/research/nodes");
if (fs.existsSync(researchDir)) {
  for (const f of fs.readdirSync(researchDir).filter((f) => f.endsWith(".json"))) {
    const r = readJson(path.join(researchDir, f));
    research.set(r.id, r);
  }
}

const exercises = new Map();
const exDir = rel("data/exercises");
if (fs.existsSync(exDir)) {
  for (const f of fs.readdirSync(exDir).filter((f) => f.endsWith(".json"))) {
    for (const ex of readJson(path.join(exDir, f))) {
      if (exercises.has(ex.id)) fail(`exercise for ${ex.id} appears twice`);
      exercises.set(ex.id, ex);
    }
  }
}

// ── validate prerequisites ───────────────────────────────────────────
for (const s of skills) if (!prereqs.has(s.id)) fail(`prereqs.txt has no line for skill ${s.id}`);
for (const [id, p] of prereqs) {
  if (!skillIds.has(id)) fail(`prereqs.txt: ${id} is not a skill`);
  for (const q of [...p.required, ...p.recommended]) {
    if (!skillIds.has(q)) fail(`prereqs.txt: ${id} lists unknown skill ${q}`);
    if (q === id) fail(`prereqs.txt: ${id} lists itself`);
  }
  const both = p.required.filter((q) => p.recommended.includes(q));
  if (both.length) fail(`prereqs.txt: ${id} lists ${both} as both required and recommended`);
  if (!["draft", "verified"].includes(p.status)) fail(`prereqs.txt: ${id} has unknown status ${p.status}`);
}
for (const id of exercises.keys()) if (!skillIds.has(id)) fail(`exercise for unknown skill ${id}`);

// Stage = longest prerequisite chain. Throws on a cycle.
function longestPath(edgesOf) {
  const memo = new Map();
  const visiting = new Set();
  const visit = (id, trail) => {
    if (memo.has(id)) return memo.get(id);
    if (visiting.has(id)) fail(`prerequisite cycle: ${[...trail, id].join(" -> ")}`);
    visiting.add(id);
    let best = 1;
    for (const q of edgesOf(id)) best = Math.max(best, visit(q, [...trail, id]) + 1);
    visiting.delete(id);
    memo.set(id, best);
    return best;
  };
  for (const s of skills) visit(s.id, []);
  return memo;
}
const step = longestPath((id) => prereqs.get(id).required);

// Original ChatGPT candidates that were dropped, for the change log.
const originalPrereq = new Map();
for (const e of src.edges) {
  if (e.type !== "prereq") continue;
  if (!originalPrereq.has(e.target)) originalPrereq.set(e.target, []);
  originalPrereq.get(e.target).push(e);
}
const reasonOf = new Map(src.edges.filter((e) => e.type === "prereq").map((e) => [`${e.source}>${e.target}`, e.reason]));

// ── assemble skills ──────────────────────────────────────────────────
function ancestry(n) {
  const out = [];
  for (let p = nodes.get(n.parent); p && p.id !== "ROOT"; p = nodes.get(p.parent)) out.unshift({ id: p.id, name: p.name });
  return out;
}

function prereqEntry(id, q, kind) {
  const note = notes[id]?.[q];
  return { id: q, why: note || reasonOf.get(`${q}>${id}`) || "", kind };
}

function resourceOf(r) {
  if (!r?.resource?.url) return null;
  const { tier, title, url, lang, free, covers } = r.resource;
  return { tier, title, url, lang, free, covers };
}

const unlocks = new Map(skills.map((s) => [s.id, []]));
for (const [id, p] of prereqs) for (const q of p.required) unlocks.get(q).push(id);
// reach = how many skills sit downstream through required edges; used to rank "learn this first".
function downstream(id, seen = new Set()) {
  for (const d of unlocks.get(id)) if (!seen.has(d)) { seen.add(d); downstream(d, seen); }
  return seen;
}

const out = skills.map((n) => {
  const p = prereqs.get(n.id);
  const r = research.get(n.id);
  const dropped = (originalPrereq.get(n.id) || [])
    .map((e) => e.source)
    .filter((q) => !p.required.includes(q) && !p.recommended.includes(q));
  return {
    id: n.id,
    name: n.name,
    en: en.get(n.id) || "",
    domain: n.domain,
    lane: laneOf(n),
    path: ancestry(n),
    levels: n.levels,
    entry: Math.min(...n.levels),
    desc: n.desc,
    milestones: n.milestones || null,
    optional: !!n.optional,
    required: p.required.map((q) => prereqEntry(n.id, q, "required")),
    recommended: p.recommended.map((q) => prereqEntry(n.id, q, "recommended")),
    prereqStatus: p.status,
    prereqSummary: notes[n.id]?._summary || "",
    unlocks: unlocks.get(n.id),
    related: src.edges
      .filter((e) => e.type === "related" && (e.source === n.id || e.target === n.id))
      .map((e) => ({ id: e.source === n.id ? e.target : e.source, why: e.reason }))
      .filter((e) => skillIds.has(e.id)),
    step: step.get(n.id),
    reach: downstream(n.id).size,
    resource: resourceOf(r),
    zhAlt: r?.zh_alt?.url ? { title: r.zh_alt.title, url: r.zh_alt.url } : null,
    courses: (r?.courses || []).map(({ school, course, url, prereq_text, prereq_kind }) => ({ school, course, url, prereq_text, prereq_kind })),
    exercise: exercises.get(n.id) || null,
    droppedOriginal: dropped,
  };
});
const byId = new Map(out.map((s) => [s.id, s]));

// Sanity: an advanced skill with no required prerequisite would show up as a "first step".
const suspicious = out.filter((s) => s.required.length === 0 && s.entry >= 2);
if (suspicious.length) console.warn("WARN entry>=D2 but no required prerequisite:", suspicious.map((s) => s.id).join(" "));

// ── layout ───────────────────────────────────────────────────────────
const laneOrder = src.nodes.filter((n) => n.parent === "ROOT")
  .flatMap((n) => (LANES.some((l) => l.domain === n.id) ? LANES.filter((l) => l.domain === n.id).map((l) => l.id) : [n.id]));
const elk = new ELK();
const lanes = [];
for (const d of laneOrder) {
  const members = out.filter((s) => s.lane === d);
  const memberIds = new Set(members.map((s) => s.id));
  const edges = [];
  for (const s of members) {
    for (const q of s.required) {
      if (memberIds.has(q.id)) edges.push({ id: `${q.id}>${s.id}`, sources: [q.id], targets: [s.id] });
    }
  }
  const graph = {
    id: d,
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": "RIGHT",
      "elk.partitioning.activate": "true",
      // keep disconnected groups in one layered drawing; packed side by side they would collide once x is snapped to steps
      "elk.separateConnectedComponents": "false",
      "elk.spacing.nodeNode": "14",
      "elk.layered.spacing.nodeNodeBetweenLayers": "60",
      "elk.layered.nodePlacement.strategy": "SIMPLE", // most compact of ELK's placers for this data (checked 2026-10-31)
      "elk.layered.considerModelOrder.strategy": "NODES_AND_EDGES",
      "elk.padding": `[top=${LANE_PAD_Y},left=0,bottom=${LANE_PAD_Y},right=0]`,
    },
    children: members.map((s) => ({
      id: s.id,
      width: CARD_W,
      height: CARD_H,
      layoutOptions: { "elk.partitioning.partition": String(s.step) },
    })),
    edges,
  };
  const res = await elk.layout(graph);
  let maxY = 0;
  for (const c of res.children) {
    const s = byId.get(c.id);
    s.x = (s.step - 1) * COL_W; // columns are shared by all lanes
    s.y = Math.round(c.y);
    maxY = Math.max(maxY, s.y + CARD_H);
  }
  for (const a of members) for (const b of members) {
    if (a.id < b.id && a.x === b.x && Math.abs(a.y - b.y) < CARD_H) fail(`cards overlap in lane ${d}: ${a.id} ${b.id}`);
  }
  const custom = LANES.find((l) => l.id === d);
  const dn = nodes.get(custom ? custom.domain : d);
  lanes.push({
    id: d,
    domain: dn.id,
    name: custom ? custom.name : dn.name,
    short: SHORT[d] || dn.name,
    en: custom ? custom.en : en.get(d) || "",
    color: DOMAIN_COLORS[dn.id],
    optional: !!dn.optional,
    height: maxY + LANE_PAD_Y,
    count: members.length,
  });
}

const steps = Math.max(...out.map((s) => s.step));

// ── overview: one tile per lane, laid out by ELK on the lane-level dependency graph ──
// A road A → B counts the required edges from a skill in lane A to a skill in lane B. Between two lanes only
// the dominant direction drives the layout (ties and single edges are too weak to order whole regions);
// every directed pair is still kept so the page can show it on focus.
const OV_TILE_W = 232;
const OV_PAD_X = 14;
const OV_HEAD_H = 62;
const OV_FOOT_H = 66;
const mapW = (steps - 1) * COL_W + CARD_W;
// The tile's mini map keeps the real step columns (x) but squeezes heights, so tall lanes do not dominate.
const miniScale = (OV_TILE_W - 2 * OV_PAD_X) / mapW;
const miniScaleY = 0.085;
const laneOfSkill = new Map(out.map((s) => [s.id, s.lane]));
const roadCount = new Map();
for (const s of out) {
  for (const q of s.required) {
    const a = laneOfSkill.get(q.id);
    if (a !== s.lane) roadCount.set(`${a}>${s.lane}`, (roadCount.get(`${a}>${s.lane}`) || 0) + 1);
  }
}
const roads = [...roadCount].map(([k, count]) => {
  const [from, to] = k.split(">");
  return { from, to, count, dominant: count >= 2 && count > (roadCount.get(`${to}>${from}`) || 0) };
});
const tileH = (lane) => OV_HEAD_H + Math.round(lane.height * miniScaleY) + 12 + OV_FOOT_H;
const ov = await elk.layout({
  id: "overview",
  layoutOptions: {
    "elk.algorithm": "layered",
    "elk.direction": "RIGHT",
    // sources (regions with no prerequisite region) and the isolated one all start in column 1
    "elk.layered.layering.strategy": "LONGEST_PATH_SOURCE",
    "elk.separateConnectedComponents": "false",
    "elk.edgeRouting": "POLYLINE", // the page draws its own roads; orthogonal routing would widen the gaps
    "elk.spacing.nodeNode": "24",
    "elk.layered.spacing.nodeNodeBetweenLayers": "40",
    "elk.layered.nodePlacement.strategy": "NETWORK_SIMPLEX",
    "elk.layered.considerModelOrder.strategy": "NODES_AND_EDGES",
    "elk.padding": "[top=8,left=8,bottom=8,right=8]",
  },
  children: lanes.map((l) => ({ id: l.id, width: OV_TILE_W, height: tileH(l) })),
  edges: roads.filter((r) => r.dominant).map((r) => ({ id: `${r.from}>${r.to}`, sources: [r.from], targets: [r.to] })),
});
const layerXs = [...new Set(ov.children.map((c) => Math.round(c.x)))].sort((a, b) => a - b);
const overview = {
  width: Math.round(ov.width),
  height: Math.round(ov.height),
  tile: { w: OV_TILE_W, padX: OV_PAD_X, headH: OV_HEAD_H, footH: OV_FOOT_H, miniScale, miniScaleY },
  regions: ov.children.map((c) => ({
    lane: c.id, x: Math.round(c.x), y: Math.round(c.y), w: OV_TILE_W, h: Math.round(c.height),
    layer: layerXs.indexOf(Math.round(c.x)) + 1,
  })),
  roads,
};
console.log(`overview ${overview.width}x${overview.height} columns:`,
  layerXs.map((x, i) => `${i + 1}[${overview.regions.filter((r) => r.layer === i + 1).map((r) => r.lane).join(" ")}]`).join(" "));

const verifiedPrereqs = out.filter((s) => s.prereqStatus === "verified").length;
const data = {
  meta: {
    built: new Date().toISOString().slice(0, 10),
    skills: out.length,
    steps,
    requiredEdges: out.reduce((a, s) => a + s.required.length, 0),
    recommendedEdges: out.reduce((a, s) => a + s.recommended.length, 0),
    verifiedPrereqs,
    withResource: out.filter((s) => s.resource).length,
    withExercise: out.filter((s) => s.exercise).length,
    card: { w: CARD_W, h: CARD_H, colW: COL_W },
  },
  depths: src.depths,
  routes: src.routes.map((r) => ({
    name: r.name,
    note: r.note,
    // Routes in the original may name a branch; expand it to the skills inside.
    ids: [...new Set(r.ids.flatMap((id) => (skillIds.has(id) ? [id] : out.filter((s) => s.id.startsWith(id + ".")).map((s) => s.id))))],
  })),
  lanes,
  overview,
  skills: out,
};

fs.mkdirSync(rel("output"), { recursive: true });
fs.writeFileSync(rel("output/skilltree.json"), JSON.stringify(data, null, 1));
fs.mkdirSync(rel("src/web"), { recursive: true });
fs.writeFileSync(rel("src/web/data.js"), `// Generated by scripts/build.mjs — do not edit.\nwindow.SKILLTREE = ${JSON.stringify(data)};\n`);

const m = data.meta;
console.log(`skills ${m.skills} · steps ${m.steps} · required ${m.requiredEdges} · recommended ${m.recommendedEdges}`);
console.log(`prereqs verified ${m.verifiedPrereqs}/${m.skills} · resources ${m.withResource} · exercises ${m.withExercise}`);
console.log("first-step skills (no required):", out.filter((s) => !s.required.length).map((s) => `${s.id} ${s.name}`).join("、"));
for (const l of lanes) console.log(`lane ${l.id} ${l.name}: ${l.count} skills, height ${l.height}`);
