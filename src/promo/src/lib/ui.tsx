// 公共部件：背景、字幕、音效、页面截图窗口（带镜头和鼠标）、逐字出现的大字、标注、计数器。
import React from "react";
import { AbsoluteFill, Html5Audio, Img, Sequence, staticFile, useCurrentFrame, interpolate } from "remotion";
import { noise2D } from "@remotion/noise";
import { Box, C, FONT, FPS, H, SHOTS, TL, W, backOut, ease, easeOut, lerp, tw, clamp01 } from "./core";

export const Bg: React.FC = () => {
  const f = useCurrentFrame();
  const gx = noise2D("bgx", f / 700, 0) * 160, gy = noise2D("bgy", 0, f / 700) * 100;
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <AbsoluteFill style={{ background: `radial-gradient(1300px 900px at ${960 + gx}px ${480 + gy}px, ${C.bg1} 0%, ${C.bg} 70%)` }} />
      <AbsoluteFill style={{ backgroundImage: "radial-gradient(rgba(140,160,200,0.13) 1.2px, transparent 1.3px)", backgroundSize: "44px 44px" }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.6) 100%)" }} />
    </AbsoluteFill>
  );
};

/** 字幕：屏幕上已经有同样大字的拍（hide）不出字幕 */
export const Subtitles: React.FC<{ hide: string[] }> = ({ hide }) => {
  const f = useCurrentFrame();
  const hidden = TL.beats.filter((b) => hide.includes(b.id)).map((b) => [b.start, b.end]);
  const i = TL.subs.findIndex((s) => f >= s.start - 2 && f < s.end + 5);
  if (i < 0) return null;
  const s = TL.subs[i];
  if (hidden.some(([a, b]) => s.start >= a && s.start < b)) return null;
  const prev = TL.subs[i - 1], next = TL.subs[i + 1];
  const joinIn = prev && prev.end === s.start, joinOut = next && next.start === s.end;
  const o = Math.min(joinIn ? 1 : interpolate(f, [s.start - 2, s.start + 3], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
                     joinOut ? 1 : interpolate(f, [s.end + 1, s.end + 5], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 46, display: "flex", justifyContent: "center", opacity: o }}>
      <div style={{ fontFamily: FONT, fontSize: 38, fontWeight: 500, color: C.ink, letterSpacing: 1.5, padding: "10px 28px", borderRadius: 14,
                    background: "rgba(6,9,15,0.72)", backdropFilter: "blur(10px)", boxShadow: "0 6px 24px rgba(0,0,0,0.45)" }}>{s.text}</div>
    </div>
  );
};

/** 在 at 帧放一个音效（public/sfx/<name>.wav，来自 os-review-bilingual 的 scripts/sfx.py 合成） */
export const Sfx: React.FC<{ at: number; name: string; v?: number }> = ({ at, name, v = 0.35 }) => (
  <Sequence from={Math.round(at)} durationInFrames={FPS * 5} layout="none">
    <Html5Audio src={staticFile(`sfx/${name}.wav`)} volume={v} />
  </Sequence>
);

// ── 页面截图：窗口 + 镜头 ───────────────────────────────
/** 镜头：(x, y) = 看向截图视口里的哪一点（CSS px，1920×1080），z = 放大倍数（1 = 整个视口放满窗口） */
export type Cam = { x: number; y: number; z: number };
export const CAM0: Cam = { x: 960, y: 540, z: 1 };
/** 关键帧插值；缩放按对数插（推近的速度看起来均匀） */
export function camAt(f: number, keys: [number, Cam][], e = ease): Cam {
  if (f <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [f0, a] = keys[i - 1], [f1, b] = keys[i];
    if (f <= f1) {
      const t = e(clamp01((f - f0) / Math.max(1, f1 - f0)));
      return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), z: Math.exp(lerp(Math.log(a.z), Math.log(b.z), t)) };
    }
  }
  return keys[keys.length - 1][1];
}
export const WIN = { x: 48, y: 27, w: W - 96, h: H - 54 };
/** 截图视口坐标 → 窗口内坐标 */
export function project(p: { x: number; y: number }, cam: Cam, rect = WIN) {
  const k = (rect.w / 1920) * cam.z;
  return { x: rect.w / 2 + (p.x - cam.x) * k, y: rect.h / 2 + (p.y - cam.y) * k, k };
}
export const projBox = (b: Box, cam: Cam, rect = WIN) => {
  const p = project(b, cam, rect);
  return { x: p.x, y: p.y, w: b.w * p.k, h: b.h * p.k };
};

/** 一张截图按镜头摆进窗口 */
export const Shot: React.FC<{ name: string; cam: Cam; opacity?: number; rect?: typeof WIN }> = ({ name, cam, opacity = 1, rect = WIN }) => {
  if (opacity <= 0.001) return null;
  const k = (rect.w / 1920) * cam.z;
  const m = SHOTS[name];
  return (
    <Img src={staticFile(`shots/${m.file}`)} style={{ position: "absolute", left: 0, top: 0, width: m.w, height: m.h, opacity,
      transformOrigin: "0 0", transform: `translate(${rect.w / 2 - cam.x * k}px, ${rect.h / 2 - cam.y * k}px) scale(${k})` }} />
  );
};

/** 应用窗口外框：圆角、描边、阴影；enter 0→1 时从倾斜、缩小飞入 */
export const AppWindow: React.FC<{ enter?: number; exit?: number; children: React.ReactNode }> = ({ enter = 1, exit = 0, children }) => {
  const t = easeOut(clamp01(enter)), x = ease(clamp01(exit));
  const tilt = (1 - t) * 16, sc = lerp(0.86, 1, t) * lerp(1, 0.92, x);
  return (
    <AbsoluteFill style={{ perspective: 1800, opacity: Math.min(t * 1.4, 1 - x) }}>
      <div style={{ position: "absolute", left: WIN.x, top: WIN.y, width: WIN.w, height: WIN.h, borderRadius: 18, overflow: "hidden",
        transform: `translateY(${(1 - t) * 60}px) rotateX(${tilt}deg) scale(${sc})`, transformOrigin: "50% 60%",
        boxShadow: "0 0 0 1px rgba(160,180,220,0.16), 0 30px 90px rgba(0,0,0,0.7), 0 0 120px rgba(90,130,220,0.12)", background: "#0f1218" }}>
        {children}
      </div>
    </AbsoluteFill>
  );
};

/** 鼠标：path = [[帧, 视口坐标], ...]；clicks = 点击帧（按下缩一下 + 扩散圈）。放在 AppWindow 里面，坐标相对窗口 */
export const Cursor: React.FC<{ path: [number, { x: number; y: number }][]; cam: Cam; clicks?: number[]; show: [number, number] }> = ({ path, cam, clicks = [], show }) => {
  const f = useCurrentFrame();
  if (f < show[0] - 8 || f > show[1] + 8) return null;
  const o = Math.min(tw(f, show[0] - 8, 0.27), 1 - tw(f, show[1], 0.27));
  let p = path[0][1];
  for (let i = 1; i < path.length; i++) {
    const [f0, a] = path[i - 1], [f1, b] = path[i];
    if (f >= f0) {
      const t = ease(clamp01((f - f0) / Math.max(1, f1 - f0)));
      p = { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) };
    }
  }
  const s = project(p, cam);
  const press = clicks.some((c) => f >= c - 2 && f < c + 4) ? 0.82 : 1;
  return (
    <>
      {clicks.filter((c) => f >= c && f < c + 18).map((c) => {
        const t = (f - c) / 18;
        return <div key={c} style={{ position: "absolute", left: s.x - 40 * t, top: s.y - 40 * t, width: 80 * t, height: 80 * t,
          borderRadius: "50%", border: `3px solid rgba(255,255,255,${0.8 * (1 - t)})`, boxShadow: `0 0 24px rgba(122,167,247,${0.6 * (1 - t)})` }} />;
      })}
      <svg width={40} height={48} viewBox="0 0 20 24" style={{ position: "absolute", left: s.x - 3, top: s.y - 2, opacity: o,
        transform: `scale(${press})`, transformOrigin: "3px 2px", filter: "drop-shadow(0 3px 6px rgba(0,0,0,0.6))" }}>
        <path d="M2 1 L2 19 L6.6 14.8 L9.6 21.6 L12.6 20.3 L9.7 13.6 L16 13.4 Z" fill="#fff" stroke="#111" strokeWidth={1.2} strokeLinejoin="round" />
      </svg>
    </>
  );
};

/** 截图上某个框的发光描边（窗口内坐标） */
export const Glow: React.FC<{ box: Box; cam: Cam; color: string; o: number; pad?: number; r?: number }> = ({ box, cam, color, o, pad = 6, r = 12 }) => {
  if (o <= 0.001) return null;
  const b = projBox(box, cam);
  return <div style={{ position: "absolute", left: b.x - pad, top: b.y - pad, width: b.w + pad * 2, height: b.h + pad * 2, borderRadius: r, opacity: o,
    border: `3px solid ${color}`, boxShadow: `0 0 26px ${color}, inset 0 0 18px ${color}55` }} />;
};

// ── 文字 ─────────────────────────────────────────────
/** 逐字出现：每个字从下方、模糊、透明到位 */
export const CharsIn: React.FC<{ text: string; at: number; step?: number; style?: React.CSSProperties; out?: number }> = ({ text, at, step = 1.6, style, out }) => {
  const f = useCurrentFrame();
  const oOut = out === undefined ? 1 : 1 - tw(f, out, 0.35);
  return (
    <span style={{ ...style, display: "inline-block", opacity: oOut }}>
      {[...text].map((ch, i) => {
        const t = tw(f, at + i * step, 0.5, 0, 1, easeOut);
        return <span key={i} style={{ display: "inline-block", opacity: t, transform: `translateY(${(1 - t) * 26}px)`, filter: `blur(${(1 - t) * 8}px)`, whiteSpace: "pre" }}>{ch}</span>;
      })}
    </span>
  );
};

/** 标注胶囊：左边一小段线样（实线 / 虚线 / 点）表示它说的是哪种线 */
export const Tag: React.FC<{ x: number; y: number; at: number; color: string; text: string; line?: "solid" | "dashed" | "dot" | "none"; size?: number; out?: number; anchor?: "left" | "right" | "center" }> =
  ({ x, y, at, color, text, line = "solid", size = 30, out, anchor = "left" }) => {
    const f = useCurrentFrame();
    const t = tw(f, at, 0.45, 0, 1, backOut);
    const o = Math.min(tw(f, at, 0.25), out === undefined ? 1 : 1 - tw(f, out, 0.3));
    if (o <= 0.001) return null;
    const tx = anchor === "right" ? "-100%" : anchor === "center" ? "-50%" : "0";
    return (
      <div style={{ position: "absolute", left: x, top: y, opacity: o, transform: `translate(${tx}, -50%) scale(${lerp(0.7, 1, t)})`, transformOrigin: "left center",
        display: "flex", alignItems: "center", gap: 14, padding: `${size * 0.32}px ${size * 0.62}px`, borderRadius: size, whiteSpace: "nowrap",
        background: "rgba(10,14,22,0.88)", border: `2px solid ${color}`, boxShadow: `0 0 28px ${color}66, 0 10px 30px rgba(0,0,0,0.5)`,
        fontFamily: FONT, fontSize: size, fontWeight: 700, color: C.ink }}>
        {line !== "none" && (
          <svg width={size * 1.6} height={10}>
            {line === "dot" ? <circle cx={size * 0.8} cy={5} r={5} fill={color} /> :
              <line x1={2} y1={5} x2={size * 1.6 - 2} y2={5} stroke={color} strokeWidth={4} strokeLinecap="round" strokeDasharray={line === "dashed" ? "8 7" : undefined} />}
          </svg>
        )}
        <span>{text}</span>
      </div>
    );
  };

/** 大数字：从 0 数到 n */
export const Counter: React.FC<{ n: number; at: number; dur?: number; style?: React.CSSProperties; sep?: boolean }> = ({ n, at, dur = 0.9, style, sep = false }) => {
  const f = useCurrentFrame();
  const v = Math.round(n * tw(f, at, dur, 0, 1, easeOut));
  return <span style={{ fontVariantNumeric: "tabular-nums", ...style }}>{sep ? v.toLocaleString("en-US") : v}</span>;
};
