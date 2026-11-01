// 旁白里每个字落在成片的第几帧：画面上的数字、标注要在“说到那个词”的时候出来，不按比例估。
// 输入：src/promo/public/build/timeline.json（timeline.py）+ output/promo/narration/manifest.json（align-narration.py 的逐字时间）
// 输出：src/promo/public/build/words.json = { 拍: [ { text, start, end, words: [[句内字符起点, 长度, 起帧, 止帧], ...] } ] }
// 换算和 os-review-bilingual/scripts/timeline.py 一致：帧 = 本拍语音起点 t + round((秒 - onset) * fps)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const tl = JSON.parse(fs.readFileSync(path.join(ROOT, "src/promo/public/build/timeline.json"), "utf8"));
const man = JSON.parse(fs.readFileSync(path.join(ROOT, "output/promo/narration/manifest.json"), "utf8"));
const out = {};
for (const b of tl.beats) {
  if (!b.speech.length) continue;
  const m = man[`${b.id}.${tl.lang}`];
  const q = (sec) => Math.round(sec * tl.fps);
  const t = b.speech[0].start - q(m.sents[0][0] - m.onset);
  out[b.id] = b.speech.map((s, i) => ({ text: s.text, start: s.start, end: s.end,
    words: m.words[i].map(([c, n, t0, t1]) => [c, n, t + q(t0 - m.onset), t + q(t1 - m.onset)]) }));
  // 自检：首字不能早于时间轴给的句子起点、末字不能晚于句子终点（句界取在两句之间停顿的中点，所以第二句起首字会晚几帧，正常）
  out[b.id].forEach((s, i) => {
    if (s.words[0][2] < s.start - 2 || s.words.at(-1)[3] > s.end + 2) console.warn(`${b.id} 第 ${i} 句：字 ${s.words[0][2]}–${s.words.at(-1)[3]} 帧，句子 ${s.start}–${s.end} 帧`);
  });
}
fs.writeFileSync(path.join(ROOT, "src/promo/public/build/words.json"), JSON.stringify(out));
console.log(`words.json：${Object.keys(out).length} 拍`);
