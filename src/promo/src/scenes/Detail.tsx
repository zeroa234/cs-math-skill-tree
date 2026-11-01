// 详情面板：右边是“操作系统”的真实详情面板（整页截图，在框里往下滚），左边按旁白出要点和几门课的先修原文。
import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { C, FONT, G, MONO, SHOTS, beat, courseLabel, easeOut, keysOf, tw, w } from "../lib/core";
import { Counter } from "../lib/ui";

const PANEL = { x: 1010, y: 64, w: 820, h: 930 };

export const Detail: React.FC = () => {
  const f = useCurrentFrame();
  const D = beat("detail").start, end = beat("guide").start;
  if (f < D - 16 || f > end + 16) return null;
  const m = SHOTS["panel-os"];
  const sec = (name: string) => (m.sections ?? []).find((s) => s.text.startsWith(name))?.y ?? 0;
  const k = PANEL.w / m.w;
  const tRes = w("detail", "中英文"), tEx = w("detail", "练习题"), tWhy = w("detail", "前置也不是"), tN = w("detail", "一百九十一"), tSrc = w("detail", "先修原文");
  // 面板滚动：开头 → 去哪学 → 练习题 → 回到必须前置（那里写着课程原文）
  const scroll = keysOf(f, [[D, 0], [tRes - 8, 0], [tRes + 14, sec("去哪学") - 30], [tEx - 2, sec("去哪学") - 30], [tEx + 18, sec("练习题") - 60],
    [tWhy - 4, sec("练习题") - 60], [tWhy + 22, sec("必须前置") - 24]]);
  const enter = tw(f, D - 16, 0.7, 0, 1, easeOut), exit = tw(f, end - 8, 0.6);
  const o = Math.min(enter, 1 - exit);
  const row = (at: number, title: string, sub: React.ReactNode, color: string) => {
    const t = tw(f, at, 0.5, 0, 1, easeOut);
    return <div style={{ display: "flex", alignItems: "center", gap: 22, opacity: t, transform: `translateX(${(1 - t) * -40}px)`, marginBottom: 20 }}>
      <div style={{ width: 14, height: 62, borderRadius: 7, background: color, boxShadow: `0 0 24px ${color}` }} />
      <div>
        <div style={{ fontSize: 40, fontWeight: 800, color: C.ink }}>{title}</div>
        <div style={{ fontSize: 26, fontWeight: 500, color: C.ink3, marginTop: 4 }}>{sub}</div>
      </div>
    </div>;
  };
  const s = G.stats;
  return (
    <AbsoluteFill style={{ opacity: o }}>
      {/* 右：面板 */}
      <div style={{ position: "absolute", left: PANEL.x, top: PANEL.y + (1 - enter) * 80, width: PANEL.w, height: PANEL.h, borderRadius: 18, overflow: "hidden",
        background: "#181d26", boxShadow: "0 0 0 1px rgba(160,180,220,0.18), 0 30px 90px rgba(0,0,0,0.7)" }}>
        <Img src={staticFile(`shots/${m.file}`)} style={{ position: "absolute", left: 0, top: -scroll * k, width: PANEL.w }} />
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 90, background: "linear-gradient(transparent, #181d26)" }} />
      </div>
      {/* 左：要点 */}
      <div style={{ position: "absolute", left: 110, top: 70, width: 820, fontFamily: FONT }}>
        <div style={{ fontSize: 26, letterSpacing: 6, color: C.ink3, fontWeight: 600, opacity: tw(f, D, 0.4) }}>每个技能的详情</div>
        <div style={{ height: 22 }} />
        {row(tRes, "中英文学习资源", <><Counter n={s.withResource} at={tRes} /> / {s.skills} 个技能有英文资源 · <Counter n={s.withChineseResource} at={tRes} /> / {s.skills} 有中文</>, C.accent)}
        {row(tEx, "一道练习题，答案验算过", <><Counter n={s.withExercise} at={tEx} /> / {s.skills} 个技能</>, C.out)}
        {row(tWhy, "前置有课程依据", <><Counter n={s.verifiedPrereqs} at={tN} style={{ color: C.lit, fontWeight: 800 }} /> / {s.skills} 个技能的前置已用真实课程核实</>, C.lit)}
      </div>
      {/* 左下：先修原文 */}
      <div style={{ position: "absolute", left: 110, top: 540, width: 830 }}>
        {G.quotes.slice(0, 3).map((q, i) => {
          const a = tSrc - 10 + i * 9;
          const t = tw(f, a, 0.55, 0, 1, easeOut);
          return <div key={i} style={{ opacity: t, transform: `translateY(${(1 - t) * 30}px)`, marginBottom: 14, padding: "13px 22px", borderRadius: 14,
            background: "rgba(14,20,32,0.92)", borderLeft: `5px solid ${C.lit}`, boxShadow: "0 10px 30px rgba(0,0,0,0.45)" }}>
            <div style={{ fontFamily: FONT, fontSize: 22, fontWeight: 700, color: C.lit }}>{q.skill} · {courseLabel(q).school} {courseLabel(q).code}</div>
            <div style={{ fontFamily: MONO, fontSize: 20, color: C.ink2, marginTop: 5, lineHeight: 1.38 }}>“{q.text}”</div>
          </div>;
        })}
      </div>
    </AbsoluteFill>
  );
};
