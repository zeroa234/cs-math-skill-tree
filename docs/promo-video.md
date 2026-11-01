# 宣传片：我把计算机专业做成了一棵技能树

约 2 分 04 秒（124.1 s），1920×1080 / 30 fps，H.264 + AAC，响度 -16 LUFS。鲸鱼娘旁白 + 中文字幕 + CC0 背景音乐。成片 `output/promo/cs-math-promo.mp4`，封面 `output/promo/cover-{16x9,4x3,3x4,9x16}.png` 和 `cover.jpg`（大标题 + 鲸鱼娘笑脸半身 + 3D 技能树，README 顶图 `docs/images/cover.webp` 也是它），混音前的画面 `cs-math-promo.raw.mp4`（只换 BGM 时从它重混，不用重渲）。都不入库，可按下面的步骤重新生成。

## 段落

| 拍 | 画面 | 素材 |
|---|---|---|
| cold / hook / title | 黑暗里第 1 步的技能亮起，枝条一层层往上长；左边提问大字，再出标题 | Blender（`scripts/promo/blender-tree.py --shot intro`） |
| star | ChatGPT 原来的知识星图：259 个节点、565 条关系 | `data/source/chatgpt-outputs/knowledge-map-data.json`，d3-force 排版 |
| layers / numbers | 星图散掉，201 个技能飞到技能地图的坐标上排成 7 步；必须 / 推荐前置；13 / 201 / 278 | `output/skilltree.json` |
| overview → goal | 真实页面：总览、点进领域、选中操作系统看前置链、点亮程序设计基础、把深度学习设为目标 | 无头 Edge 截图（深色、2 倍像素） |
| detail | 操作系统的详情面板在框里滚动；三门课官网先修原文 | 截图 + `skilltree.json` 的 `courses` |
| guide | 极限与连续的导览图上指出来源、章、节；五张导览图摊开；201 / 1,890 / 8,643 / 10,574 | 截图 + `output/outlines.json` |
| outro | 整棵树从第 1 步起变成“已点亮”的金色，落版 | Blender（`--shot outro`） |

画面上的数字、课程名和原文、树的形状都从数据算出来，不手写：Blender 的节点 = 201 个技能（高度 = 第几步，绕中轴按泳道分扇区，球的大小按 reach 开方），连线 = 278 条必须前置；分层动画的坐标 = 技能地图里卡片的坐标；导览图的分支 / 知识点 / 标题数按 `outlines.json` 递归数（叶子 = 知识点）。

## 生成步骤（项目根目录，Git Bash）

```bash
# 1. 旁白：复用 os-review-bilingual 的 Breeze 管线（鲸鱼娘参考音频 + 讲解语气，配置在那边的 config/tts-breeze.json）
wsl -e bash -lc "bash /mnt/d/agent/projects/os-review-bilingual/scripts/start-breeze.sh"     # 起服务，等 ~/vd/breeze-api.log 出现 Uvicorn running
python -X utf8 ../os-review-bilingual/scripts/narrate.py data/promo/script.json --lang zh --out output/promo/narration
N=/mnt/d/agent/projects/cs-math-skill-tree/output/promo/narration
wsl -e bash -lc "cd /mnt/d/agent/projects/os-review-bilingual && ~/vd/venv-qfa/bin/python scripts/align-narration.py $N && ~/vd/venv-asr/bin/python scripts/qc-narration.py $N"
wsl -e bash -lc "systemctl --user stop vd-breeze-api"                                           # 合成完释放显存
python -X utf8 ../os-review-bilingual/scripts/timeline.py data/promo/script.json --lang zh --nar output/promo/narration --out src/promo/public/build
# 2. 页面截图、动画数据、逐字时间
node scripts/promo/capture-app.mjs          # → src/promo/public/shots/*.png + shots.json（每张图里卡片、按钮的位置）
node scripts/promo/build-graph.mjs          # → src/promo/public/build/graph.json
node scripts/promo/word-times.mjs           # → src/promo/public/build/words.json
# 3. Blender 两段（读 timeline.json，旁白改了要重渲）
bash scripts/promo/render-blender.sh        # → src/promo/public/blender/intro.mp4、outro.mp4
# 4. 字体、音效副本（只第一次）：public/fonts/ 从 os-review-bilingual/video/public/fonts 复制 NotoSansSC-VF.ttf、CascadiaMono-Regular.ttf；
#    public/sfx/ 从 os-review-bilingual/video/public/sfx 复制（那边 scripts/sfx.py 用代码合成，无版权问题）
(cd src/promo && npm install)
# 5. 先抽帧看版面，再出成片
(cd src/promo && TEMP=D:/agent/projects/cs-math-skill-tree/temp/promo/tmp node stills.mjs --every 2.5)   # → temp/promo/stills/
bash scripts/promo/render.sh                # Remotion 渲染 + 混 BGM + -16 LUFS → output/promo/cs-math-promo.mp4
# 6. 封面：开场镜头标题那一刻（第 318 帧，10.6 s）的干净画面 + 鲸鱼娘半身 + 大字，四种尺寸
D:/steam/steamapps/common/Blender/blender.exe -b --factory-startup -P scripts/promo/blender-tree.py -- --shot intro --out temp/promo/cover --frames 318 --samples 128
D:/ComfyUI-aki-v3.2/python/python.exe scripts/promo/cover.py   # → output/promo/cover-*.png、cover.jpg、docs/images/cover.webp
rm -rf temp/promo/blender                   # Blender 的 PNG 帧（约 1.4 GB），编成 mp4 后可删（temp/promo/cover/ 的封面背景帧留着，改字时重跑 cover.py 就行）
```

文稿 `data/promo/script.json` 只有中文，数字写汉字（送 TTS 的就是原文）。改了文稿：重跑第 1 步（只重合成改过的拍）、`word-times.mjs`、Blender 两段和成片。只改画面代码：直接第 5 步。

各步用时（RTX 3080，16 线程）：成片渲染 + 混音约 12 分钟（并发 6）；Breeze 13 拍 74 s；对齐 + ASR 质检约 1 分钟；截图约 1 分钟；Blender 开场 341 帧、片尾 333 帧各约 2 分钟（Eevee 48 采样，约 0.3 s / 帧）；抽帧 48 张约 50 s；封面的 Blender 单帧（128 采样）约 5 s。

## 依赖本仓库以外的东西

宣传片是在作者本地的工作区里做的，下面这些放在同一工作区的其他项目里（路径按 `projects/<项目>/` 并排），不在本仓库：

- `os-review-bilingual`：旁白管线（Breeze TTS 2 服务、对齐、质检、`timeline.py`、`mix-bgm.py`）、字体和合成音效、封面的 `hero()` / `glow_text()`（`scripts/cover.py`）。
- `kurumi-fx-rogue/assets/bgm/`：BGM 文件（CC0，出处见下）。
- `game-aesthetic-asset/output/deepseek-chan/src/E4_happy.png`：封面上鲸鱼娘（deepseek 娘）的笑脸立绘，透明底。

所以在别的机器上，第 1 步（旁白）、第 4 步（字体、音效）和封面要换成自己的素材；截图、动画数据、Blender 场景和 Remotion 画面只依赖本仓库。

## 画面代码

`src/promo/`（Remotion 4.0.533，和 os-review-bilingual 同版本）：

- `src/lib/core.ts`：配色、数据、取时刻。画面只按“拍”和“旁白说到哪个词”取帧号：`w("numbers", "两百零一")` 返回说到这个词的那一帧（`words.json` 里对齐器给的逐字时间），找不到这个词直接报错。
- `src/lib/ui.tsx`：字幕、音效、截图窗口 `AppWindow` + 镜头 `Shot` / `camAt`（看向截图视口里的哪一点、放大几倍）、鼠标 `Cursor`、发光框 `Glow`、标注 `Tag`。窗口里的东西坐标都相对窗口；截图上的位置用 `project()` 按当前镜头换算。
- `src/scenes/`：`Intro`、`Graph`（星图 → 分层 → 数字）、`App`（总览到设目标）、`Detail`、`Guide`、`Outro`。每段自己按帧号决定出现与否，`Promo.tsx` 叠在一起。
- 字幕在屏幕上已有同样大字的拍（hook、title、numbers）不出。

## 用到的现成组件

- Remotion（画面合成，渲染时逐帧截图）、Blender 5.2 Eevee + 合成器 Bloom（3D 树）、d3-force（星图排版，固定随机种子）、playwright-core + 系统 Edge（页面截图）。
- os-review-bilingual 的旁白管线（Breeze TTS 2、Qwen3 对齐器、SenseVoice 质检、`timeline.py`、`mix-bgm.py` / `loudnorm.py`）和合成音效。为了复用，给那边的 `narrate.py` 加了 `--out`、`timeline.py` 加了 `--nar` / `--out` 和只有一种语言的文稿（默认行为不变，u01 重出逐字节相同）。
- BGM：Dizzy Crow《Piano & Drums, positive melancholy》，CC0（opengameart.org/node/87531），本地文件在 `kurumi-fx-rogue/assets/bgm/`（那边 `tracks.json` 已核对授权）。
- 封面：沿用 os-review-bilingual 的封面做法（立绘裁到腰 + 蓝色外发光、带光晕的大字），`scripts/promo/cover.py` 直接导入那边的函数，四种尺寸和竖版只用中间 3:4 的规矩也相同。
- 自己写的：`scripts/promo/` 的截图、布局、逐字时间、Blender 场景、封面排版，和 `src/promo/` 的画面。

## 坑

- **Blender 5.x 的合成器**是节点组：`bpy.data.node_groups.new(..., "CompositorNodeTree")`，要先 `interface.new_socket("Image", in_out="OUTPUT")`，用 `NodeGroupOutput` 输出，再挂到 `scene.compositing_node_group`；没有 `scene.node_tree` 了。Glare 的类型是输入口 `inputs["Type"] = "Bloom"`。
- AgX 把亮的发光色洗成粉白，领域颜色分不清，改用 Standard（芯白、光晕带色）。
- 几百个物体共用一个发光材质，颜色和亮度从 Object Info 的 Color / Alpha 取，每个物体给 `ob.color` 打关键帧。
- Python 内置 `hash()` 每个进程不同，用它做错开会让每次渲染结果不一样；改成按 id 字符求和。
- 页面截图：点亮后的提示条（toast）会挡住后面的画面，要等它自己收起（`#toast` hidden）再拍下一张；markmap 的章标题是 `<span>2.3</span>极限运算法则`，按文字找元素时要允许前面的编号；JS 模板字符串里写 `\d` 会变成 `d`，正则里改用 `[0-9]`。
- 这台机器的 ffmpeg 没有 fontconfig 配置，`drawtext` 直接崩，联系表不标帧号（按文件名顺序）。
- Remotion 会往系统 TEMP 写打包副本和 Chrome 配置：渲染、抽帧前把 `TEMP` / `TMP` 指到 `temp/promo/tmp`，完了删掉（`render.sh`、`stills.mjs` 已处理）。
