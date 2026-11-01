// 真实页面：总览 → 点进领域 → 选中操作系统看前置链 → 点亮程序设计基础 → 把深度学习设为目标。
// 截图由 scripts/promo/capture-app.mjs 拍（深色、2 倍像素），卡片和按钮的位置也是那时量的（shots.json）。
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Box, C, FONT, G, SHOTS, beat, clamp01, rnd, tw, w } from "../lib/core";
import { AppWindow, CAM0, Cam, Cursor, Glow, Shot, Sfx, Tag, WIN, camAt, project } from "../lib/ui";

const center = (b: Box) => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 });
const T = (name: string, k: string) => SHOTS[name].targets[k] as Box;
const SK = new Map(G.skills.map((s) => [s.id, s]));

/** 窗口内坐标的标注：把视口里的点按当前镜头投到屏幕上 */
const At: React.FC<{ p: { x: number; y: number }; cam: Cam; children: (x: number, y: number) => React.ReactNode }> = ({ p, cam, children }) => {
  const s = project(p, cam);
  return <>{children(s.x + WIN.x, s.y + WIN.y)}</>;
};

export function appTimes() {
  const O = beat("overview").start, M = beat("map").start, CH = beat("chain").start, U = beat("unlock").start, GL = beat("goal").start;
  const hover = w("overview", "线越粗") - 8;
  const clickC = w("map", "点进") + 4;
  const clickOS = w("chain", "操作系统") + 2;
  const tSolid = w("chain", "实线"), tDash = w("chain", "虚线"), tGreen = w("chain", "绿线");
  const tLocked = w("unlock", "锁着"), clickLearn = w("unlock", "点亮之后") + 4, tAuto = w("unlock", "自动解锁");
  const clickGoal = w("goal", "设为目标") + 6, tList = w("goal", "左边");
  return { O, M, CH, U, GL, hover, clickC, clickOS, tSolid, tDash, tGreen, tLocked, clickLearn, tAuto, clickGoal, tList, end: beat("detail").start };
}

export const App: React.FC = () => {
  const f = useCurrentFrame();
  const t = appTimes();
  if (f < t.O - 12 || f > t.end + 16) return null;
  const C1 = center(T("overview", "C"));
  const os = SHOTS.os.cards["C.2.1"];
  const zoomIn = t.clickC + 4;                       // 点进领域：总览推近、地图从小放大接上
  // ── 镜头 ──
  const cam = camAt(f, [
    [t.O, CAM0], [t.hover, { x: 1010, y: 640, z: 1.16 }], [zoomIn, { x: 1010, y: 640, z: 1.16 }], [zoomIn + 16, { x: C1.x, y: C1.y, z: 3.4 }],
  ]);
  const mapCam = camAt(f, [
    [zoomIn + 8, { x: 960, y: 540, z: 0.62 }], [zoomIn + 26, CAM0], [t.clickOS + 4, CAM0], [t.clickOS + 26, { x: 870, y: 310, z: 1.45 }],
    [t.U - 10, { x: 870, y: 310, z: 1.45 }], [t.U + 6, CAM0], [t.clickLearn, { x: 1080, y: 470, z: 1.12 }],
    [t.tAuto + 4, { x: 1080, y: 470, z: 1.12 }], [t.tAuto + 30, { x: 990, y: 560, z: 1.3 }],
    [t.GL - 8, { x: 990, y: 560, z: 1.3 }], [t.GL + 8, CAM0], [t.clickGoal + 6, CAM0], [t.tList + 2, { x: 686, y: 500, z: 1.4 }],
  ]);
  // ── 哪张截图、透明度 ──
  const xf = (a: number, d = 0.3) => tw(f, a, d);
  const ovO = 1 - tw(f, zoomIn + 6, 0.35);
  const hoverO = xf(t.hover + 4, 0.25);
  const mapO = xf(zoomIn + 6, 0.3);
  const osO = xf(t.clickOS + 1, 0.2);
  const p11O = xf(t.U - 6, 0.3), afterO = xf(t.clickLearn + 2, 0.2);
  const goalO = xf(t.GL - 6, 0.3), goalAfterO = xf(t.clickGoal + 2, 0.2);
  const layers: [string, number][] = [
    ["map-C", mapO * (1 - osO)], ["os", osO * (1 - p11O)], ["p11-before", p11O * (1 - afterO)], ["p11-after", afterO * (1 - goalO)],
    ["goal-before", goalO * (1 - goalAfterO)], ["goal-after", goalAfterO],
  ];
  // ── 鼠标 ──
  const learn = center(T("p11-before", "learn")), goalBtn = center(T("goal-before", "btn"));
  const osC = center(os);
  const cursorOv = (
    <Cursor cam={cam} show={[t.O + 24, zoomIn + 2]} clicks={[t.clickC]}
      path={[[t.O + 24, { x: 1420, y: 700 }], [t.hover, C1], [zoomIn, C1]]} />
  );
  const cursorMap = (
    <Cursor cam={mapCam} show={[zoomIn + 30, t.end - 20]} clicks={[t.clickOS, t.clickLearn, t.clickGoal]}
      path={[[zoomIn + 30, { x: 1250, y: 620 }], [t.clickOS - 4, osC], [t.clickOS + 30, { x: osC.x + 60, y: osC.y + 120 }],
        [t.U + 10, { x: 1200, y: 640 }], [t.clickLearn - 6, learn], [t.clickLearn + 24, { x: 1010, y: 790 }],
        [t.GL + 10, { x: 1350, y: 520 }], [t.clickGoal - 6, goalBtn], [t.clickGoal + 30, { x: goalBtn.x - 120, y: goalBtn.y + 160 }]]} />
  );
  // 点亮之后能直接解锁的卡（只取这张截图里看得见的）
  const unl = (SK.get("P.1.1")?.unlocks ?? []).map((id) => SHOTS["p11-after"].cards[id]).filter(Boolean).sort((a, b) => a.y - b.y);
  const locked = (SK.get("P.1.1")?.unlocks ?? []).map((id) => SHOTS["p11-before"].cards[id]).filter(Boolean).sort((a, b) => a.y - b.y);
  const items = (SHOTS["goal-after"].targets.items as unknown as Box[]) ?? [];
  const enter = tw(f, t.O - 12, 0.75);
  const exit = tw(f, t.end - 6, 0.6);
  return (
    <AbsoluteFill>
      <AppWindow enter={enter} exit={exit}>
        {/* 总览 */}
        {ovO > 0.01 && <>
          <Shot name="overview" cam={cam} opacity={ovO * (1 - hoverO)} />
          <Shot name="overview-hover-C" cam={cam} opacity={ovO * hoverO} />
        </>}
        {layers.map(([n, o]) => <Shot key={n} name={n} cam={mapCam} opacity={o} />)}
        {/* 总览：线越粗 */}
        <At p={{ x: 640, y: 790 }} cam={cam}>{(x, y) => <Tag x={x - WIN.x} y={y - WIN.y} at={w("overview", "线越粗")} color={C.out} text="线越粗 = 用到的必须前置越多" line="none" size={28} out={t.clickC} />}</At>
        {/* 地图：泳道、第 N 步 */}
        {(() => {
          const o = tw(f, w("map", "泳道") - 4, 0.3) * (1 - tw(f, t.clickOS - 6, 0.3));
          return <Glow box={T("map-C", "lane")} cam={mapCam} color="#e8954f" o={o} pad={2} r={14} />;
        })()}
        <At p={{ x: 1130, y: 97 }} cam={mapCam}>{(x, y) => <Tag x={x - WIN.x} y={y - WIN.y} at={w("map", "泳道")} color="#e8954f" text="一条泳道 = 一个领域" line="none" size={28} out={t.clickOS - 6} />}</At>
        {(SHOTS["map-C"].targets.cols as unknown as Box[]).map((b, i) => {
          const s = project({ x: b.x, y: 800 }, mapCam);
          const a = w("map", "横轴") + i * 3;
          const o = tw(f, a, 0.3) * (1 - tw(f, t.clickOS - 6, 0.3));
          return o > 0.01 && <div key={i} style={{ position: "absolute", left: s.x, top: s.y, transform: `translate(-50%,-50%) scale(${0.8 + 0.2 * tw(f, a, 0.3)})`, opacity: o,
            fontFamily: FONT, fontSize: 26, fontWeight: 800, color: i === 0 ? C.lit : C.ink, padding: "6px 16px", borderRadius: 10, whiteSpace: "nowrap",
            background: "rgba(10,14,22,0.9)", border: `2px solid ${i === 0 ? C.lit : C.accent}` }}>第 {i + 1} 步</div>;
        })}
        {/* 前置链：实线 / 虚线 / 绿线 */}
        <Glow box={SHOTS.os.cards["C.1.1"]} cam={mapCam} color={C.req} o={tw(f, t.tSolid - 3, 0.25) * (1 - tw(f, t.U - 12, 0.3))} />
        <Glow box={SHOTS.os.cards["C.1.2"]} cam={mapCam} color={C.rec} o={tw(f, t.tDash - 3, 0.25) * (1 - tw(f, t.U - 12, 0.3))} />
        {["C.2.3", "C.2.4", "C.4.3"].map((id, i) => <Glow key={id} box={SHOTS.os.cards[id]} cam={mapCam} color={C.out} o={tw(f, t.tGreen - 3 + i * 3, 0.25) * (1 - tw(f, t.U - 12, 0.3))} />)}
        <At p={{ x: 548, y: 478 }} cam={mapCam}>{(x, y) => <Tag x={x - WIN.x} y={y - WIN.y} at={t.tSolid} color={C.req} text="实线：必须学" line="solid" out={t.U - 12} />}</At>
        <At p={{ x: 768, y: 161 }} cam={mapCam}>{(x, y) => <Tag x={x - WIN.x} y={y - WIN.y} at={t.tDash} color={C.rec} text="虚线：建议学" line="dashed" anchor="right" out={t.U - 12} />}</At>
        <At p={{ x: 1192, y: 300 }} cam={mapCam}>{(x, y) => <Tag x={x - WIN.x} y={y - WIN.y} at={t.tGreen} color={C.out} text="绿线：学完能直接解锁" line="solid" out={t.U - 12} />}</At>
        {/* 点亮：先看锁着的卡，点亮后它们变成能学 */}
        {locked.map((b, i) => <Glow key={"l" + i} box={b} cam={mapCam} color="#8a93a6" o={tw(f, t.tLocked + i * 1.5, 0.2) * (1 - tw(f, t.clickLearn, 0.2)) * 0.8} pad={3} r={10} />)}
        <At p={{ x: SHOTS["p11-before"].cards["P.1.1"].x - 10, y: 700 }} cam={mapCam}>{(x, y) => <Tag x={x - WIN.x} y={y - WIN.y} at={t.tLocked} color="#9aa2b2" text="锁着：必须前置还没点亮" line="none" size={26} out={t.clickLearn} />}</At>
        {unl.map((b, i) => <Glow key={"u" + i} box={b} cam={mapCam} color={C.accent} o={tw(f, t.clickLearn + 6 + i * 2, 0.2) * (1 - tw(f, t.GL - 10, 0.3))} pad={3} r={10} />)}
        <Burst box={SHOTS["p11-after"].cards["P.1.1"]} cam={mapCam} at={t.clickLearn} />
        <At p={{ x: SHOTS["p11-before"].cards["P.1.1"].x - 10, y: 700 }} cam={mapCam}>{(x, y) => <Tag x={x - WIN.x} y={y - WIN.y} at={t.tAuto} color={C.accent} text="后面的技能自动解锁" line="none" size={26} out={t.GL - 10} />}</At>
        {/* 目标：左栏编号清单 */}
        {items.map((b, i) => <Glow key={"g" + i} box={b} cam={mapCam} color={C.accent} o={tw(f, t.tList + 4 + i * 2.5, 0.2) * (1 - tw(f, t.end - 10, 0.3)) * 0.85} pad={0} r={8} />)}
        <At p={{ x: 300, y: 130 }} cam={mapCam}>{(x, y) => <Tag x={x - WIN.x} y={y - WIN.y} at={t.tList + 6} color={C.accent} text="按顺序编号的学习清单" line="none" size={26} />}</At>
        {cursorOv}
        {cursorMap}
      </AppWindow>
      <Sfx at={t.clickC} name="pop" v={0.4} />
      <Sfx at={zoomIn + 2} name="whoosh" v={0.3} />
      <Sfx at={t.clickOS} name="pop" v={0.4} />
      <Sfx at={t.clickLearn} name="pop" v={0.4} />
      <Sfx at={t.clickLearn + 3} name="chime" v={0.28} />
      <Sfx at={t.clickGoal} name="pop" v={0.4} />
    </AbsoluteFill>
  );
};

/** 点亮时卡片上炸开一圈暖金色的光点 */
const Burst: React.FC<{ box: Box; cam: Cam; at: number }> = ({ box, cam, at }) => {
  const f = useCurrentFrame();
  const t = (f - at) / 26;
  if (t < 0 || t > 1) return null;
  const c = project({ x: box.x + box.w / 2, y: box.y + box.h / 2 }, cam);
  return <>
    <div style={{ position: "absolute", left: c.x - 120 * t * c.k, top: c.y - 120 * t * c.k, width: 240 * t * c.k, height: 240 * t * c.k, borderRadius: "50%",
      border: `4px solid rgba(245,196,106,${1 - t})`, boxShadow: `0 0 40px rgba(245,196,106,${0.8 * (1 - t)})` }} />
    {Array.from({ length: 14 }, (_, i) => {
      const a = (i / 14) * Math.PI * 2 + rnd("b" + i) * 0.4, r = (40 + 110 * clamp01(t * 1.3)) * c.k;
      return <div key={i} style={{ position: "absolute", left: c.x + Math.cos(a) * r - 4, top: c.y + Math.sin(a) * r - 4, width: 8, height: 8, borderRadius: 4,
        background: C.lit, opacity: 1 - t, boxShadow: `0 0 12px ${C.lit}` }} />;
    })}
  </>;
};
