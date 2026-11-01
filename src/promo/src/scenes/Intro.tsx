// 开场：Blender 3D 技能树一层层长出来（scripts/promo/blender-tree.py），左边是提问和大标题。
import React from "react";
import { AbsoluteFill, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import { C, FONT, G, beat, tw, w } from "../lib/core";
import { CharsIn } from "../lib/ui";

export const Intro: React.FC = () => {
  const f = useCurrentFrame();
  const end = beat("title").end;
  if (f > end + 2) return null;
  const tStart = beat("title").start;
  const fade = 1 - tw(f, end - 16, 0.55);
  const shade = Math.max(tw(f, w("hook", "计算机") - 10, 0.8), 0) * 0.85;
  const big: React.CSSProperties = { fontFamily: FONT, fontWeight: 900, color: C.ink, letterSpacing: 2 };
  const s = G.stats;
  return (
    <AbsoluteFill style={{ opacity: fade }}>
      <Sequence from={0} durationInFrames={end + 2} layout="none">
        <OffthreadVideo src={staticFile("blender/intro.mp4")} muted style={{ width: "100%", height: "100%" }} />
      </Sequence>
      {/* 左侧压暗一点，字更清楚 */}
      <AbsoluteFill style={{ opacity: shade, background: "linear-gradient(90deg, rgba(6,9,15,0.82) 0%, rgba(6,9,15,0.45) 38%, transparent 62%)" }} />
      {/* hook：两句提问 */}
      <div style={{ position: "absolute", left: 130, top: 380 }}>
        <div><CharsIn text="计算机专业到底要学什么？" at={w("hook", "计算机")} step={1.4} out={tStart - 8} style={{ ...big, fontSize: 68 }} /></div>
        <div style={{ marginTop: 26 }}>
          <CharsIn text="先学哪门，再学哪门？" at={w("hook", "先学")} step={1.6} out={tStart - 8}
            style={{ ...big, fontSize: 68, color: C.accent, textShadow: "0 0 30px rgba(122,167,247,0.5)" }} />
        </div>
      </div>
      {/* title：大标题 */}
      <div style={{ position: "absolute", left: 130, top: 300 }}>
        <div style={{ opacity: tw(f, tStart, 0.4), fontFamily: FONT, fontSize: 30, fontWeight: 600, letterSpacing: 8, color: C.ink3, marginBottom: 26 }}>
          CS × 数学技能树
        </div>
        <div><CharsIn text="我把计算机专业" at={tStart + 2} step={1.8} style={{ ...big, fontSize: 108, lineHeight: 1.15 }} /></div>
        <div><CharsIn text="做成了一棵技能树" at={w("title", "做成")} step={1.8}
          style={{ ...big, fontSize: 108, lineHeight: 1.15, color: C.lit, textShadow: "0 0 40px rgba(245,196,106,0.55)" }} /></div>
        <div style={{ marginTop: 40, opacity: tw(f, w("title", "技能树"), 0.5), transform: `translateY(${(1 - tw(f, w("title", "技能树"), 0.5)) * 14}px)`,
          fontFamily: FONT, fontSize: 34, fontWeight: 500, color: C.ink2, letterSpacing: 2 }}>
          {s.skills} 个技能 · {s.lanes} 个领域 · {s.steps} 步 · {s.requiredEdges} 条必须前置
        </div>
      </div>
    </AbsoluteFill>
  );
};
