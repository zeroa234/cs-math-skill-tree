// 成片：各段场景按旁白时间轴叠在一起（每段自己按帧号决定出没出现），加字幕、旁白、音效。BGM 渲染后再混（scripts/promo/render.sh）。
import React from "react";
import { AbsoluteFill, Html5Audio, staticFile } from "remotion";
import { beat } from "./lib/core";
import { Bg, Sfx, Subtitles } from "./lib/ui";
import { Intro } from "./scenes/Intro";
import { Graph } from "./scenes/Graph";
import { App } from "./scenes/App";
import { Detail } from "./scenes/Detail";
import { Guide } from "./scenes/Guide";
import { Outro } from "./scenes/Outro";

export const Promo: React.FC = () => (
  <AbsoluteFill style={{ background: "#06090f" }}>
    <Bg />
    <Graph />
    <Intro />
    <App />
    <Detail />
    <Guide />
    <Outro />
    {/* 屏幕上已经有同样大字的拍不出字幕 */}
    <Subtitles hide={["hook", "title", "numbers"]} />
    <Html5Audio src={staticFile("build/narration.wav")} />
    <Sfx at={0} name="riser" v={0.22} />
    <Sfx at={beat("star").start - 10} name="whoomp" v={0.3} />
    <Sfx at={beat("overview").start - 10} name="whoosh" v={0.25} />
    <Sfx at={beat("detail").start - 12} name="whoosh" v={0.25} />
    <Sfx at={beat("guide").start - 12} name="whoosh" v={0.25} />
    <Sfx at={beat("outro").start - 6} name="whoomp" v={0.3} />
  </AbsoluteFill>
);
