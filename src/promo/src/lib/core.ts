// 公共：尺寸配色、数据、按旁白取时刻、缓动。
// 画面代码只按“拍”和“旁白里的词”取帧号（timeline.json / words.json 由 scripts/promo/ 生成），不写死秒数：
// 旁白重合成、拍长变了，画面跟着走。
import { Easing, interpolate } from "remotion";
import tlJson from "../../public/build/timeline.json";
import wordsJson from "../../public/build/words.json";
import graphJson from "../../public/build/graph.json";
import shotsJson from "../../public/shots/shots.json";

export const W = 1920, H = 1080, FPS = 30;
export const C = {
  bg: "#06090f", bg1: "#0c1322", ink: "#eef1f6", ink2: "#bcc4d2", ink3: "#8792a6", line: "#2e3542",
  accent: "#7aa7f7", lit: "#f5c46a", litDeep: "#c98a22", req: "#7aa7f7", rec: "#b597f2", out: "#4fcb9e",
};
export const FONT = '"Noto Sans SC", "Microsoft YaHei", sans-serif';
export const MONO = '"Cascadia Mono", Consolas, monospace';

// ── 数据 ──────────────────────────────────────────────
export type Speech = { start: number; end: number; text: string };
export type Beat = { id: string; start: number; end: number; speech: Speech[] };
export type Sub = { start: number; end: number; text: string };
export const TL = tlJson as unknown as { fps: number; frames: number; beats: Beat[]; subs: Sub[]; title: { zh: string } };
type WordSent = { text: string; start: number; end: number; words: [number, number, number, number][] };
const WORDS = wordsJson as unknown as Record<string, WordSent[]>;
export type Box = { x: number; y: number; w: number; h: number };
export type ShotMeta = { file: string; w: number; h: number; targets: Record<string, Box & Box[]>; cards: Record<string, Box>; sections?: { text: string; y: number }[] };
export const SHOTS = (shotsJson as unknown as { shots: Record<string, ShotMeta> }).shots;
export type GNode = { id: string; kind: string; domain: string; name: string; x: number; y: number };
export type GSkill = { id: string; name: string; lane: string; domain: string; step: number; reach: number; unlocks: string[]; x: number; y: number };
export const G = graphJson as unknown as {
  star: GNode[]; starEdges: [string, string, string][]; skills: GSkill[]; req: [string, string][]; rec: [string, string][];
  lanes: { id: string; short: string; name: string; color: string; y0: number; y1: number }[]; steps: { step: number; x: number }[];
  domainColor: Record<string, string>;
  stats: { skills: number; steps: number; requiredEdges: number; recommendedEdges: number; verifiedPrereqs: number; lanes: number;
    withResource: number; withChineseResource: number; withExercise: number;
    guide: { guides: number; branches: number; points: number; titles: number } };
  quotes: { skill: string; school: string; course: string; text: string }[];
};

// ── 时刻 ──────────────────────────────────────────────
const BEATS = new Map(TL.beats.map((b) => [b.id, b]));
export const beat = (id: string) => {
  const b = BEATS.get(id);
  if (!b) throw new Error("没有这一拍：" + id);
  return b;
};
/** 拍开始后 sec 秒 */
export const at = (id: string, sec = 0) => beat(id).start + Math.round(sec * FPS);
/** 第 i 句开始（-1 = 最后一句） */
export const say = (id: string, i = 0) => { const s = beat(id).speech; return s[(i + s.length) % s.length].start; };
export const sayEnd = (id: string, i = -1) => { const s = beat(id).speech; return s[(i + s.length) % s.length].end; };
/** 旁白说到某个词的那一帧（end = true 取这个词说完）。找不到就报错，免得静默对错位置 */
export function w(id: string, word: string, end = false): number {
  for (const s of WORDS[id] ?? []) {
    const i = s.text.indexOf(word);
    if (i < 0) continue;
    const j = end ? i + word.length - 1 : i;
    const hit = s.words.find(([c, n]) => c <= j && j < c + n) ?? s.words.reduce((a, b) => (Math.abs(b[0] - j) < Math.abs(a[0] - j) ? b : a));
    return end ? hit[3] : hit[2];
  }
  throw new Error(`旁白里没有“${word}”（拍 ${id}）`);
}

// ── 缓动 ──────────────────────────────────────────────
export const ease = Easing.bezier(0.45, 0, 0.2, 1);
export const easeOut = Easing.bezier(0.16, 0.8, 0.3, 1);
export const easeIn = Easing.bezier(0.6, 0, 0.9, 0.4);
export const backOut = Easing.bezier(0.3, 1.5, 0.5, 1);
/** f 帧时，从 start 帧起 dur 秒内由 a 走到 b */
export function tw(f: number, start: number, dur: number, a = 0, b = 1, e = ease) {
  return interpolate(f, [start, start + Math.max(1, dur * FPS)], [a, b], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: e });
}
/** 淡入淡出窗口：[a, b] 之间为 1，前后各 fin / fout 秒过渡 */
export function win(f: number, a: number, b: number, fin = 0.4, fout = 0.4) {
  return Math.min(tw(f, a, fin), 1 - tw(f, b - fout * FPS, fout));
}
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** 分段关键帧：[[帧, 值], ...]，段间缓动 */
export function keysOf(f: number, k: [number, number][], e = ease) {
  if (f <= k[0][0]) return k[0][1];
  for (let i = 1; i < k.length; i++) if (f <= k[i][0]) return interpolate(f, [k[i - 1][0], Math.max(k[i][0], k[i - 1][0] + 1)], [k[i - 1][1], k[i][1]], { easing: e });
  return k[k.length - 1][1];
}
/** 课程的简称：学校 + 课号（“UC Berkeley · CS 162”） */
export function courseLabel(q: { school: string; course: string }) {
  const school = /Massachusetts/.test(q.school) ? "MIT" : q.school.replace("University of California, Berkeley", "UC Berkeley").replace(/ University$/, "");
  const code = (q.course.match(/^([A-Z]{2,4} ?\d+[A-Za-z]*|\d+\.\d+\w*|\d+-\d+\w*)/) ?? [q.course])[0];
  return { school, code };
}
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
/** 按 id 定的稳定伪随机 [0,1) */
export function rnd(s: string, salt = 0) {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return ((h >>> 0) % 100000) / 100000;
}
/** sRGB 往白色混 t */
export function lighten(hex: string, t: number) {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return "#" + c.map((v) => Math.round(v + (255 - v) * t).toString(16).padStart(2, "0")).join("");
}
export const LANE_COLOR = Object.fromEntries(G.lanes.map((l) => [l.id, lighten(l.color, 0.18)]));
export const DOMAIN_COLOR = Object.fromEntries(Object.entries(G.domainColor).map(([k, v]) => [k, lighten(v, 0.18)]));
