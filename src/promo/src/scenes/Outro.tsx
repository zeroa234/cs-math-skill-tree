// 片尾：Blender 里整棵树从第 1 步起一层层变成“已点亮”的金色；左边先说怎么打开，再落到标题。
import React from "react";
import { AbsoluteFill, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import { C, FONT, G, TL, beat, easeOut, lerp, say, tw, w } from "../lib/core";
import { CharsIn } from "../lib/ui";

export const Outro: React.FC = () => {
  const f = useCurrentFrame();
  const O = beat("outro").start;
  if (f < O - 2) return null;
  const tNet = w("outro", "不用联网"), tInst = w("outro", "不用安装"), tDbl = w("outro", "双击"), S1 = say("outro", 1);
  const vid = tw(f, O, 0.5);
  const black = tw(f, TL.frames - 20, 0.66);
  const info = tw(f, O + 4, 0.4) * (1 - tw(f, S1 - 6, 0.4));
  const chip = (at: number, text: string) => {
    const t = tw(f, at - 2, 0.4, 0, 1, easeOut);
    return <div style={{ opacity: t, transform: `translateY(${(1 - t) * 18}px)`, padding: "12px 26px", borderRadius: 40, fontSize: 34, fontWeight: 700,
      color: C.ink, background: "rgba(14,20,32,0.85)", border: `2px solid ${C.out}`, boxShadow: `0 0 26px ${C.out}55` }}>✓ {text}</div>;
  };
  const dbl = [tDbl, tDbl + 7].map((c) => (f - c) / 16);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ opacity: vid }}>
        <Sequence from={O} layout="none">
          <OffthreadVideo src={staticFile("blender/outro.mp4")} muted style={{ width: "100%", height: "100%" }} />
        </Sequence>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "linear-gradient(90deg, rgba(6,9,15,0.8) 0%, rgba(6,9,15,0.4) 40%, transparent 62%)", opacity: vid }} />
      {/* 怎么打开 */}
      <div style={{ position: "absolute", left: 130, top: 300, opacity: info, fontFamily: FONT }}>
        <div style={{ display: "flex", gap: 22 }}>{chip(tNet, "不用联网")}{chip(tInst, "不用安装")}</div>
        <div style={{ marginTop: 60, display: "flex", alignItems: "center", gap: 34, opacity: tw(f, tDbl - 14, 0.4) }}>
          <div style={{ position: "relative", width: 132, height: 160 }}>
            <svg width={132} height={160} viewBox="0 0 132 160">
              <path d="M10 6 H88 L124 42 V152 a4 4 0 0 1 -4 4 H10 a4 4 0 0 1 -4 -4 V10 a4 4 0 0 1 4 -4 Z" fill="#1d2636" stroke={C.accent} strokeWidth={4} />
              <path d="M88 6 V42 H124" fill="none" stroke={C.accent} strokeWidth={4} />
              <text x={64} y={112} textAnchor="middle" fontFamily={FONT} fontSize={28} fontWeight={800} fill={C.accent}>HTML</text>
            </svg>
            {dbl.map((t, i) => t >= 0 && t <= 1 && <div key={i} style={{ position: "absolute", left: 66 - 70 * t, top: 80 - 70 * t, width: 140 * t, height: 140 * t,
              borderRadius: "50%", border: `4px solid rgba(255,255,255,${0.9 * (1 - t)})` }} />)}
          </div>
          <div>
            <div style={{ fontSize: 52, fontWeight: 800, color: C.ink, fontFamily: '"Cascadia Mono", monospace' }}>index.html</div>
            <div style={{ fontSize: 32, fontWeight: 500, color: C.ink2, marginTop: 8 }}>双击就能打开</div>
          </div>
        </div>
      </div>
      {/* 落版 */}
      <div style={{ position: "absolute", left: 130, top: 330, fontFamily: FONT, opacity: tw(f, S1, 0.5) }}>
        <div style={{ fontSize: 30, fontWeight: 600, letterSpacing: 8, color: C.ink3, marginBottom: 24 }}>CS × 数学技能树</div>
        <div><CharsIn text="我把计算机专业" at={S1 + 4} step={1.3} style={{ fontSize: 92, fontWeight: 900, color: C.ink, lineHeight: 1.18 }} /></div>
        <div><CharsIn text="做成了一棵技能树" at={S1 + 14} step={1.3} style={{ fontSize: 92, fontWeight: 900, color: C.lit, lineHeight: 1.18, textShadow: "0 0 40px rgba(245,196,106,0.55)" }} /></div>
        <div style={{ marginTop: 36, fontSize: 32, color: C.ink2, fontWeight: 500, opacity: tw(f, w("outro", "点亮"), 0.5),
          transform: `translateY(${lerp(14, 0, tw(f, w("outro", "点亮"), 0.5))}px)` }}>
          {G.stats.skills} 个技能 · 从第 1 步开始点亮
        </div>
      </div>
      <AbsoluteFill style={{ background: "#000", opacity: black }} />
    </AbsoluteFill>
  );
};
