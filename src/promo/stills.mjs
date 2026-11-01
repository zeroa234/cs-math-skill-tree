// 抽帧检查：打包一次，按帧出静图，再拼成联系表（先看版面再整片渲染）。
// 用法（src/promo 目录）：node stills.mjs [--every 秒] [帧号 ...]   输出 ../../temp/promo/stills/
// 打包副本放在项目 temp/ 下，退出时删掉（Remotion 默认写系统盘 TEMP，且每次打包都复制整个 public/）。
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(HERE, "../../temp/promo/stills");
fs.mkdirSync(OUT, { recursive: true });
const args = process.argv.slice(2);
const every = args.includes("--every") ? Number(args[args.indexOf("--every") + 1]) : 0;
const listed = args.filter((a, i) => /^\d+$/.test(a) && args[i - 1] !== "--every").map(Number);
const bundleDir = path.resolve(HERE, "../../temp/promo/bundle");
const serveUrl = await bundle({ entryPoint: path.join(HERE, "src/index.ts"), outDir: bundleDir });
try {
  const comp = await selectComposition({ serveUrl, id: "Promo" });
  const frames = listed.length ? listed : Array.from({ length: Math.floor(comp.durationInFrames / (every * 30 || 75)) }, (_, i) => i * (every * 30 || 75) + 15);
  for (const frame of frames) {
    const out = path.join(OUT, `f${String(frame).padStart(4, "0")}.jpg`);
    await renderStill({ composition: comp, serveUrl, frame, output: out, imageFormat: "jpeg", jpegQuality: 88 });
    process.stdout.write(`${frame} `);
  }
  console.log();
  if (!listed.length) {
    const files = frames.map((fr) => path.join(OUT, `f${String(fr).padStart(4, "0")}.jpg`));
    const cols = 6;
    execFileSync("ffmpeg", ["-nostdin", "-y", "-loglevel", "error", ...files.flatMap((f) => ["-i", f]), "-filter_complex",
      // 不用 drawtext：这台机器的 ffmpeg 没有 fontconfig 配置，drawtext 会崩；帧号按文件名顺序（从左到右、从上到下）
      files.map((_, i) => `[${i}]scale=480:-1[v${i}]`).join(";") + ";" +
      files.map((_, i) => `[v${i}]`).join("") + `xstack=inputs=${files.length}:layout=${files.map((_, i) => `${(i % cols) * 480}_${Math.floor(i / cols) * 270}`).join("|")}:fill=black`,
      path.join(OUT, "sheet.jpg")]);
    console.log("联系表 →", path.join(OUT, "sheet.jpg"));
  }
} finally {
  fs.rmSync(bundleDir, { recursive: true, force: true });
}
