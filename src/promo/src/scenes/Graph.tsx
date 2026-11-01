// 星图 → 分层 → 数字：259 个原节点（ChatGPT 星图）里的 201 个技能，飞到技能地图的坐标上（横轴 = 第几步）。
// 两套坐标都由 scripts/promo/build-graph.mjs 从真实数据算出。
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, DOMAIN_COLOR, FONT, G, LANE_COLOR, beat, clamp01, courseLabel, ease, easeOut, lerp, rnd, say, tw, w } from "../lib/core";
import { Counter, Tag } from "../lib/ui";

const SK = new Map(G.skills.map((s) => [s.id, s]));
const STAR = new Map(G.star.map((n) => [n.id, n]));
const CX = 960, CY = 540;
const COURSE = (q: (typeof G.quotes)[number]) => { const c = courseLabel(q); return `${c.school} · ${c.code}`; };

export const Graph: React.FC = () => {
  const f = useCurrentFrame();
  const s0 = beat("star").start, end = beat("overview").start + 20;
  if (f < s0 - 16 || f > end) return null;
  // ── 时刻 ──
  const tCount1 = w("star", "两百五十九"), tCount2 = w("star", "五百多条"), tQ = w("star", "先学什么");
  const tCourse = w("layers", "大学课程"), tRedo = w("layers", "重新理");
  const tReq = w("layers", "必须前置"), tRec = w("layers", "推荐前置"), tMorph = w("layers", "最长的前置链");
  const tStep1 = w("layers", "第一步"), tRight = w("layers", "越往右");
  const N0 = beat("numbers").start, nEnd = beat("numbers").end;
  const enter = tw(f, s0 - 16, 0.6);
  const exit = tw(f, beat("overview").start - 4, 0.75);
  // 星图镜头：慢慢转、慢慢推
  const rot = lerp(-0.07, 0.05, clamp01((f - s0) / (tMorph - s0)));
  const zs = lerp(0.94, 1.04, clamp01((f - s0) / (tMorph - s0)));
  const starXY = (n: { x: number; y: number }) => {
    const dx = (n.x - CX) * zs, dy = (n.y - CY) * zs;
    return { x: CX + dx * Math.cos(rot) - dy * Math.sin(rot), y: CY + dx * Math.sin(rot) + dy * Math.cos(rot) };
  };
  // 每个节点当前位置：技能按步骤错开飞向分层坐标，其余节点淡出
  const morphT = (id: string) => {
    const s = SK.get(id);
    return s ? ease(clamp01((f - tMorph - (s.step - 1) * 5 - rnd(id) * 8) / 42)) : 0;
  };
  const pos = new Map<string, { x: number; y: number; t: number }>();
  for (const n of G.star) {
    const a = starXY(n), s = SK.get(n.id), t = morphT(n.id);
    pos.set(n.id, s ? { x: lerp(a.x, s.x, t), y: lerp(a.y, s.y, t), t } : { ...a, t: 0 });
  }
  const appear = (id: string) => tw(f, s0 - 6 + rnd(id, 3) * 40, 0.5, 0, 1, easeOut);
  const otherFade = 1 - tw(f, tMorph - 6, 0.6);           // 领域、分支这些不是技能的节点
  const starEdgeO = 1 - tw(f, tRedo, 0.8);                 // 星图原来的连线：说“重新理了一遍”时散掉
  const reqO = tw(f, tReq - 4, 0.5);
  const recO = tw(f, tRec - 4, 0.4) * (1 - tw(f, tMorph + 10, 0.8));
  const dim = 1 - 0.68 * tw(f, N0 + 4, 0.6);               // 数字那拍图压暗
  const layered = tw(f, tMorph + 40, 0.6);
  const curve = (a: { x: number; y: number }, b: { x: number; y: number }, t: number) => {
    const dx = (b.x - a.x) * 0.5 * t;                        // 分层后连线弯成横向的 S 形；星图里是直线
    return `M${a.x},${a.y} C${a.x + dx},${a.y} ${b.x - dx},${b.y} ${b.x},${b.y}`;
  };
  const qO = tw(f, tQ - 6, 0.5) * (1 - tw(f, beat("layers").start, 0.6));
  return (
    <AbsoluteFill style={{ opacity: enter * (1 - exit), transform: `scale(${lerp(1, 1.12, exit)})` }}>
      {/* “先学什么？”：星图后面一个很淡的大问号 */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 120, textAlign: "center", fontFamily: FONT, fontWeight: 900, fontSize: 620,
        color: `rgba(122,167,247,${0.13 * qO})`, transform: `scale(${lerp(0.85, 1, qO)})` }}>?</div>
      <svg width={1920} height={1080} style={{ position: "absolute", opacity: dim }}>
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        {/* 星图的 565 条关系 */}
        {starEdgeO > 0.01 && G.starEdges.map(([a, b, type], i) => {
          const p = pos.get(a)!, q = pos.get(b)!;
          const o = Math.min(appear(a), appear(b)) * starEdgeO * (type === "parent" ? 0.42 : type === "prereq" ? 0.3 : 0.22);
          const col = DOMAIN_COLOR[STAR.get(type === "parent" ? b : a)!.domain] ?? C.ink3;
          return <line key={i} x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke={col} strokeWidth={type === "parent" ? 1.4 : 1} opacity={o}
            strokeDasharray={type === "related" ? "2 5" : type === "prereq" ? "6 5" : undefined} />;
        })}
        {/* 推荐前置 388 条：虚线，只闪一下 */}
        {recO > 0.01 && G.rec.map(([a, b], i) => {
          const p = pos.get(a)!, q = pos.get(b)!;
          return <path key={"r" + i} d={curve(p, q, layered)} fill="none" stroke={C.rec} strokeWidth={1.3} strokeDasharray="6 6" opacity={0.5 * recO} />;
        })}
        {/* 必须前置 278 条 */}
        {reqO > 0.01 && G.req.map(([a, b], i) => {
          const p = pos.get(a)!, q = pos.get(b)!;
          const grow = clamp01((f - tReq - rnd(a + b) * 14) / 18);
          const qq = { x: lerp(p.x, q.x, grow), y: lerp(p.y, q.y, grow) };
          return <path key={"q" + i} d={curve(p, qq, layered)} fill="none" stroke={LANE_COLOR[SK.get(a)!.lane]} strokeWidth={1.6} opacity={0.62 * reqO} />;
        })}
        {/* 节点 */}
        <g filter="url(#glow)">
          {G.star.map((n) => {
            const p = pos.get(n.id)!, s = SK.get(n.id);
            const a = appear(n.id);
            if (!s && otherFade <= 0.01) return null;
            const r0 = n.kind === "领域" ? 9 : n.kind === "分支" ? 5.2 : 3.4;
            const r = s ? lerp(r0, 3.2 + Math.sqrt(s.reach) * 0.42, p.t) : r0 * otherFade;
            const col = s ? LANE_COLOR[s.lane] : DOMAIN_COLOR[n.domain];
            const tw1 = 0.75 + 0.25 * Math.sin(f / 9 + rnd(n.id, 9) * 6.3) * (1 - layered);   // 星星闪
            return <circle key={n.id} cx={p.x} cy={p.y} r={r * lerp(0.2, 1, a)} fill={col} opacity={a * tw1 * (s ? 1 : otherFade)} />;
          })}
        </g>
        {/* 领域名（只在星图阶段） */}
        {G.star.filter((n) => n.kind === "领域").map((n) => {
          const p = pos.get(n.id)!;
          return <text key={"t" + n.id} x={p.x + 14} y={p.y + 7} fontFamily={FONT} fontSize={21} fontWeight={700} fill={DOMAIN_COLOR[n.domain]}
            opacity={tw(f, s0 + 10, 0.6) * otherFade * 0.95} style={{ paintOrder: "stroke", stroke: "#06090f", strokeWidth: 5 }}>{n.name}</text>;
        })}
      </svg>
      {/* 星图标题与计数 */}
      <div style={{ position: "absolute", left: 80, top: 64, opacity: tw(f, s0, 0.5) * (1 - tw(f, tCourse - 10, 0.5)), fontFamily: FONT }}>
        <div style={{ fontSize: 26, color: C.ink3, letterSpacing: 4, fontWeight: 600 }}>起点</div>
        <div style={{ fontSize: 46, color: C.ink, fontWeight: 800, marginTop: 6 }}>ChatGPT 生成的知识星图</div>
        <div style={{ display: "flex", gap: 40, marginTop: 18, fontSize: 30, color: C.ink2, fontWeight: 500 }}>
          <span style={{ opacity: tw(f, tCount1, 0.3) }}><Counter n={G.star.length} at={tCount1} style={{ fontSize: 48, fontWeight: 900, color: C.accent }} /> 个节点</span>
          <span style={{ opacity: tw(f, tCount2, 0.3) }}><Counter n={G.starEdges.length} at={tCount2} style={{ fontSize: 48, fontWeight: 900, color: C.accent }} /> 条关系</span>
        </div>
      </div>
      {/* 对照的真实课程 */}
      {G.quotes.map((q, i) => {
        const t0 = tCourse + i * 5;
        const o = tw(f, t0, 0.35) * (1 - tw(f, tReq - 6, 0.5));
        if (o <= 0.01) return null;
        const spots = [[300, 210], [1380, 250], [260, 860], [1420, 830]];
        const [x, y] = spots[i % 4];
        const t = tw(f, t0, 0.6, 0, 1, easeOut);
        return <div key={i} style={{ position: "absolute", left: x, top: y + (1 - t) * 30, opacity: o, fontFamily: FONT, fontSize: 30, fontWeight: 700, color: C.ink,
          padding: "12px 24px", borderRadius: 14, background: "rgba(12,18,30,0.9)", border: "1.5px solid rgba(122,167,247,0.55)", boxShadow: "0 0 30px rgba(122,167,247,0.25)" }}>
          {COURSE(q)}</div>;
      })}
      {/* 图例：必须 / 推荐 */}
      <Tag x={80} y={58} at={tReq} color={C.accent} text={`必须前置 ${G.req.length} 条`} line="solid" out={N0} />
      <Tag x={470} y={58} at={tRec} color={C.rec} text={`推荐前置 ${G.rec.length} 条`} line="dashed" out={N0} />
      {/* 分层后：列头“第 N 步”、左侧泳道名 */}
      {G.steps.map((st) => (
        <div key={st.step} style={{ position: "absolute", left: st.x, top: 128, transform: "translateX(-50%)", fontFamily: FONT, fontSize: 25, fontWeight: 800,
          color: st.step === 1 ? C.lit : C.ink2, opacity: tw(f, tMorph + 30 + st.step * 3, 0.4) * dim, whiteSpace: "nowrap" }}>第 {st.step} 步</div>
      ))}
      {G.lanes.map((l, i) => (
        <div key={l.id} style={{ position: "absolute", left: 40, top: (l.y0 + l.y1) / 2, transform: "translateY(-50%)", display: "flex", alignItems: "center", gap: 10,
          opacity: tw(f, tMorph + 36 + i * 2, 0.4) * dim, fontFamily: FONT, fontSize: 17, fontWeight: 600, color: C.ink2 }}>
          <span style={{ width: 5, height: Math.max(14, l.y1 - l.y0 - 8), borderRadius: 3, background: LANE_COLOR[l.id] }} />{l.short}
        </div>
      ))}
      {/* 第一步：没有门槛 */}
      {(() => {
        const o = tw(f, tStep1 - 4, 0.4) * (1 - tw(f, N0, 0.4));
        const x = G.steps[0].x;
        return o > 0.01 && <>
          <div style={{ position: "absolute", left: x - 34, top: 160, width: 68, height: 820, borderRadius: 34, opacity: o,
            border: `2px solid ${C.lit}`, boxShadow: `0 0 40px rgba(245,196,106,0.45), inset 0 0 30px rgba(245,196,106,0.18)` }} />
          <Tag x={x + 52} y={190} at={tStep1} color={C.lit} text="没有必须前置，从这里开始" line="none" size={26} out={N0} />
        </>;
      })()}
      {/* 越往右，要先学的越多 */}
      {(() => {
        const t = tw(f, tRight, 0.9);
        const o = t > 0 ? 1 - tw(f, N0, 0.4) : 0;
        const x0 = G.steps[0].x, x1 = G.steps[G.steps.length - 1].x;
        return o > 0.01 && <svg width={1920} height={1080} style={{ position: "absolute", opacity: o }}>
          <defs><marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10z" fill={C.accent} /></marker></defs>
          <line x1={x0} y1={102} x2={lerp(x0, x1, t)} y2={102} stroke={C.accent} strokeWidth={4} strokeLinecap="round" markerEnd="url(#arr)" />
          <text x={x1} y={84} textAnchor="end" fontFamily={FONT} fontSize={26} fontWeight={700} fill={C.accent} opacity={tw(f, tRight + 14, 0.4)}>越往右，要先学的越多</text>
        </svg>;
      })()}
      {/* 数字那拍 */}
      {f >= N0 - 4 && f <= nEnd + 20 && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 360, display: "flex", justifyContent: "center", gap: 150, fontFamily: FONT }}>
          {([[G.stats.lanes, "个领域", "十三", C.accent], [G.stats.skills, "个技能", "两百零一", C.ink], [G.stats.requiredEdges, "条必须前置", "两百七十八", C.lit]] as const).map(([n, label, word, col]) => {
            const t0 = w("numbers", word) - 3;
            const t = tw(f, t0, 0.5, 0, 1, easeOut);
            return <div key={label} style={{ textAlign: "center", opacity: t, transform: `translateY(${(1 - t) * 40}px) scale(${lerp(0.8, 1, t)})` }}>
              <Counter n={n} at={t0} dur={0.8} style={{ fontSize: 190, fontWeight: 900, color: col, lineHeight: 1, textShadow: `0 0 50px ${col}88` }} />
              <div style={{ fontSize: 40, fontWeight: 600, color: C.ink2, marginTop: 14 }}>{label}</div>
            </div>;
          })}
        </div>
      )}
    </AbsoluteFill>
  );
};
export const graphSpan = () => [say("star") - 16, beat("overview").start + 20];
