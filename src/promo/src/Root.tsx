import React from "react";
import { Composition, continueRender, delayRender } from "remotion";
import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";
import { FPS, H, TL, W } from "./lib/core";
import { Promo } from "./Promo";

// 本地字体（public/fonts/，从 os-review-bilingual/video/public/fonts 复制：Noto Sans SC 来自 C:/Windows/Fonts，Cascadia Mono）
const wait = delayRender("fonts");
Promise.all([
  loadFont({ family: "Noto Sans SC", url: staticFile("fonts/NotoSansSC-VF.ttf"), weight: "100 900" }),
  loadFont({ family: "Cascadia Mono", url: staticFile("fonts/CascadiaMono-Regular.ttf"), weight: "400" }),
]).then(() => continueRender(wait));

export const Root: React.FC = () => (
  <Composition id="Promo" component={Promo} durationInFrames={TL.frames} fps={FPS} width={W} height={H} />
);
