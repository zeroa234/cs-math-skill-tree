// 知识导览图：先在“极限与连续”的导览图上指出来源、章、节，再把几张导览图摊开，配上总数。
import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { Box, C, FONT, G, SHOTS, beat, easeOut, lerp, say, tw, w } from "../lib/core";
import { AppWindow, CAM0, Glow, Shot, Tag, camAt, project } from "../lib/ui";

const FAN = ["C.2.1", "A.2.3", "M.1.1", "F.1.5", "C.1.1"];

/** 截图里 stage（导览图画布）那一块裁出来当卡片 */
const Crop: React.FC<{ name: string; box: Box; width: number }> = ({ name, box, width }) => {
  const k = width / box.w;
  return (
    <div style={{ position: "relative", width, height: box.h * k, overflow: "hidden", borderRadius: 14, background: "#0f1218" }}>
      <Img src={staticFile(`shots/${SHOTS[name].file}`)} style={{ position: "absolute", left: -box.x * k, top: -box.y * k, width: 1920 * k }} />
    </div>
  );
};

export const Guide: React.FC = () => {
  const f = useCurrentFrame();
  const G0 = beat("guide").start, end = beat("outro").start;
  if (f < G0 - 16 || f > end + 12) return null;
  const tSrc = w("guide", "权威教材"), tCh = w("guide", "章"), tSec = w("guide", "节");
  const S1 = say("guide", 1), t201 = w("guide", "两百零一张"), tPts = w("guide", "八千六百"), tChk = w("guide", "每条标题");
  const tg = SHOTS["guide-M.1.1"].targets;
  const ch = tg.chapter as Box, sec = tg.section as Box, src = tg.sources as Box;
  const cam = camAt(f, [[G0, CAM0], [tSrc + 30, CAM0], [tCh - 10, { x: 790, y: 440, z: 1.85 }], [S1 - 6, { x: 800, y: 430, z: 2.0 }], [S1 + 14, { x: 800, y: 430, z: 2.6 }]]);
  const enter = tw(f, G0 - 16, 0.7), winExit = tw(f, S1 - 4, 0.6);
  const fanIn = (i: number) => tw(f, S1 + 2 + i * 4, 0.8, 0, 1, easeOut);
  const fanOut = tw(f, end - 10, 0.5);
  const s = G.stats.guide;
  return (
    <AbsoluteFill>
      {winExit < 1 && (
        <AppWindow enter={enter} exit={winExit}>
          <Shot name="guide-M.1.1" cam={cam} />
          <Glow box={src} cam={cam} color={C.lit} o={tw(f, tSrc - 4, 0.3) * (1 - tw(f, tCh - 14, 0.3))} pad={4} r={10} />
          {(() => { const p = project({ x: src.x, y: src.y + src.h + 30 }, cam);
            return <Tag x={p.x} y={p.y} at={tSrc} color={C.lit} text="目录照教材原文抄" line="none" size={28} out={tCh - 14} />; })()}
          <Glow box={ch} cam={cam} color={C.accent} o={tw(f, tCh - 3, 0.25)} pad={5} r={8} />
          <Glow box={sec} cam={cam} color={C.out} o={tw(f, tSec - 3, 0.25)} pad={5} r={8} />
          {(() => { const p = project({ x: ch.x + ch.w / 2, y: ch.y + ch.h + 34 }, cam);
            return <Tag x={p.x} y={p.y} at={tCh} color={C.accent} text="章" line="none" size={32} anchor="center" />; })()}
          {(() => { const p = project({ x: sec.x + sec.w + 16, y: sec.y + sec.h / 2 }, cam);
            return <Tag x={p.x} y={p.y} at={tSec} color={C.out} text="节" line="none" size={32} />; })()}
        </AppWindow>
      )}
      {/* 摊开几张导览图 */}
      {f >= S1 - 2 && (
        <AbsoluteFill style={{ perspective: 2200, opacity: 1 - fanOut }}>
          {FAN.map((id, i) => {
            const t = fanIn(i), mid = (FAN.length - 1) / 2, d = i - mid;
            const x = 960 + d * 372 * lerp(0.4, 1, t), y = 560 + Math.abs(d) * 30;
            const drift = (f - S1) * 0.06 * d;
            return <div key={id} style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) translateZ(${-Math.abs(d) * 120}px) rotateY(${-d * 16 + drift * 0.2}deg) scale(${lerp(0.6, 1, t)})`,
              opacity: t, zIndex: 10 - Math.abs(d), boxShadow: `0 30px 80px rgba(0,0,0,0.7), 0 0 0 1.5px ${d === 0 ? "rgba(245,196,106,0.6)" : "rgba(160,180,220,0.25)"}`, borderRadius: 14 }}>
              <Crop name={`guide-${id}`} box={SHOTS[`guide-${id}`].targets.stage as Box} width={d === 0 ? 600 : 520} />
            </div>;
          })}
          {/* 总数 */}
          <div style={{ position: "absolute", left: 0, right: 0, top: 110, display: "flex", justifyContent: "center", gap: 90, fontFamily: FONT }}>
            {([[s.guides, "张导览图", t201, C.ink], [s.branches, "个分支", t201 + 10, C.accent], [s.points, "个知识点", tPts, C.lit]] as const).map(([n, label, a, col]) => {
              const t = tw(f, a - 3, 0.45, 0, 1, easeOut);
              return <div key={label} style={{ opacity: t, transform: `translateY(${(1 - t) * 24}px)`, display: "flex", alignItems: "baseline", gap: 12 }}>
                <span style={{ fontSize: 92, fontWeight: 900, color: col, textShadow: `0 0 40px ${col}77`, fontVariantNumeric: "tabular-nums" }}>
                  {Math.round(n * tw(f, a - 3, 0.8, 0, 1, easeOut)).toLocaleString("en-US")}</span>
                <span style={{ fontSize: 34, fontWeight: 600, color: C.ink2 }}>{label}</span>
              </div>;
            })}
          </div>
          <Tag x={960} y={884} at={tChk} color={C.out} text={`✓ ${s.titles.toLocaleString("en-US")} 条目录标题，逐条对照来源原文`} line="none" size={32} anchor="center" />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
