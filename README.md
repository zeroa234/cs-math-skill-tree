# CS × 数学技能树

把 ChatGPT 生成的“知识星图”（`data/source/chatgpt-outputs/`，只读）重做成一棵**能按步骤点亮的技能树**：
每个技能分清“必须前置”和“推荐前置”，必须前置没点亮就不能点亮下一个；每个技能配英文学习资源、一道练习题和一张**知识导览图**（按权威教材或课程的目录整理出这个技能有哪些知识点）；已为 166 个技能补充中文资源，未找到合适中文资料的节点会明确说明。

## 打开

双击 `src/web/index.html`（不需要联网，不需要构建）。进度保存在浏览器的 localStorage 里，可在“进度 ▾”导出 / 导入 JSON。
每个视图都有自己的地址，可以收藏或分享：`#overview` 总览，`#map/<领域>` 某个领域的地图，`#skill/<id>` 某个技能，`#skill/<id>/guide` 某个技能的知识导览图。

## 怎么读这张图

- **领域总览（首页）**：每块是一个领域，块里的小方块是它的技能（按步骤从左到右排列，和地图一致）。连线表示右边领域的技能用到了左边领域的必须前置，线越粗条数越多。领域的列位置由 ELK 按领域间依赖的最长链排出，第 1 列可以直接开始。每块上写着进度、状态、“下一步”（这个领域现在最值得学的技能）或“先学：…”。滚轮缩放、拖动平移，按 0 或“适应屏幕”看全图（和技能地图一样；手机上是可上下滑动的列表）。点一块进入它的技能地图；Esc 或浏览器后退键返回总览。
- **技能地图**：每条横向泳道是一个领域（数学拆成三条）。横轴“第 N 步” = 前面最长有 N−1 层必须前置。第 1 步的技能没有必须前置，是起点。
- 卡片状态：已点亮（暖色 + ✓）、现在能学（蓝框 + ⊕）、未解锁（灰 + 锁）。颜色之外都有图标，色弱也能分辨。
- 平时只画领域内部的必须前置连线；用到其他领域前置的卡片，左上角有彩点（颜色就是那个领域）。选中一个技能时，高亮它的整条必须前置链（实线）、推荐前置（虚线）和它直接解锁的技能（绿线），其余卡片去掉颜色变成灰色（文字仍然清晰）。
- 左栏“现在能学”按“学完能解锁的后续技能数”排序；选一条路线或“设为目标”后，左栏给出按顺序编号的学习清单，地图上也标出序号。
- 详情面板：必须 / 推荐前置及理由、学什么、知识导览、去哪学（英文与中文资源分别展示，附访问条件和学习范围）、练习题（答案折叠）、前置依据（真实课程的官方先修原文）。
- **知识导览图**：详情面板里点“打开导览图”。中心是技能，分支是来源的章（或讲），叶子是节；全部展开、缩放到看全，滚轮或双指缩放、拖动平移，右下角 + − ⤢。标“补·B”的橙色分支来自补充来源，用来补主来源没讲到的知识点。标题可切换中文 / 双语 / 原文。右栏是目录来源（主 / 补，附原始目录页链接）和“查漏补缺”：节点简介里的每个知识点落在哪一章，点一下在图上定位；没有来源单列的知识点标“—”并写明原因。

## 必须 / 推荐前置的判定规则

- **必须前置**：至少一门真实大学课程把它列为先修（或在同一门课里先讲它），并且不会它就学不懂本技能入门层的内容。
- **推荐前置**：课程写成“建议 / 有帮助”、只有部分课程要求、只是数学成熟度门槛，或者只在深入层才用到。只提示，不挡路。
- 每个技能的状态写在 `data/curation/prereqs.txt` 最后一列：`verified` = 已用课程证据核实；`draft` = 找不到可用的课程先修说明，按内容需要起草，页面上显示“前置待核实”。
- 理由和证据摘要在 `data/curation/prereq-notes.json`；原始证据（课程名、官方先修原文、链接）在 `data/research/nodes/<id>.json`。

## 知识导览图的来源规则

- 每个技能 1 个主来源：优先用“去哪学”里那份材料本身（它有成体系的目录时），否则用这门课的标准教材（作者主页、出版社、开放教材官网的目录）或一流大学课程的官方逐讲课表；工程实践类可用标准 / 官方文档的目录。入门层 D1/D2 用本科层次。
- 只用作者或出版社官方公开的整书 PDF；课程网站、网盘、镜像站上的商业教材 PDF 不用。
- 标题照原文抄，配中文译名；`scripts/check_outlines.py` 把每条标题和检索代理实际读到的页面文字（`research_tool.py` 的缓存）逐条比对，对不上的条目不进 `data/outlines/`。
- 查漏补缺：把节点简介拆成知识点，逐个标出落在哪一章 / 节；主来源没有的，从第二个权威来源补一个分支，并写明补的是哪个知识点。

## 当前完成度（2026-11-01）

- 201 个技能：前置已核实 191，英文学习资源 201，中文资源 166，练习题 201，知识导览图 201。
- 知识导览图：201 个，共 1889 个分支、8642 个知识点（每个技能中位数 41 个）。10562 条标题逐字命中来源原文，11 条因 PDF 抽取差异（如 σ 被抽成 s）判为近似，0 条缺失。第二轮给 62 个只有讲次一层的节点补了讲内小节或换成章 → 节两层的教材，并换掉了 7 个不合格来源（课程站上的商业教材整书 PDF、镜像）。
- 仍以讲次为主、没能补到小节的 3 个：A.2.3.2、C.3.3、S.2.1（讲义只有幻灯片或放在网盘 / 需登录，原因写在各自 `data/outlines/<id>.json` 的 `notes`）。简介里有 16 个知识点在所有来源里都没有专门章节，导览图右栏标“—”并写明原因（多数是“与某领域交叉”这类说明性短语，或树外的专业前置）。
- “去哪学”已按可访问性、内容匹配和学习入口复核；修正了章节错配、停在大纲页、旧地址及付费标注。逐节点结论和中文缺口见 `docs/learning-resources-review.md`，检查快照见 `docs/learning-resources-link-check.json`。中文导读只覆盖部分主题时会明确注明。
- 前置待核实（draft，10 个）：F.2.4、P.5.4、C.4.4、D.1.5、S.2.4、S.5.2、H.4.4、I.2.3、X.2.4、X.2.5。原因是没找到能用的课程先修说明，或者课程要求的是树外的专业课（如 GIS、医学）。
- 入门层 D2 以上却没有必须前置的技能：H.2.3、H.4.3、V.2.3。这是有证据的：对应课程写明不需要先修，构建时的警告可以忽略。

## 数据流

```
data/source/chatgpt-outputs/knowledge-map-data.json   ChatGPT 原图（只读）：节点、简介、相关关系、路线
data/curation/prereqs.txt                              必须 / 推荐前置（主代理维护）
data/curation/prereq-notes.json                        每条前置的理由 + 证据摘要
data/curation/names-en.tsv                             英文名
data/curation/learning-resources.json                  学习资源审核、英文修正、中文来源目录与逐技能映射
data/research/nodes/<id>.json                          审核过的检索结果：资源 + 课程先修证据
data/exercises/*.json                                  每个技能一道练习题（答案已验算）
data/outlines/<id>.json                                知识导览图：来源、目录（章→节）、查漏补缺、核对记录
        │  node scripts/build.mjs   （检查环、算步骤、ELK 分层布局）
        ▼
output/skilltree.json   合并后的数据（可复用）
src/web/data.js         同上 + 布局坐标，页面直接加载
output/outlines.json    全部知识导览图（可复用）
src/web/outlines.js     同上，页面第一次打开导览图时才加载
```

## 脚本

| 脚本 | 用途 |
|---|---|
| `npm install` 后 `node scripts/build.mjs` | 重新生成 `src/web/data.js`、`src/web/outlines.js` 与 `output/`；前置有环、ID 写错、卡片重叠、导览图来源对不上都会直接报错 |
| `scripts/make_research_batches.py` | 把技能切成先修检索批次 `temp/research/batches/batch-XXy.md` |
| `python -X utf8 scripts/make_outline_batches.py` | 把技能切成导览图检索批次 `temp/outlines/batches/outline-XX.md`；`--deepen [--fix ID=原因]` 生成第二轮（加深只有讲次一层的导览图、换掉不合格来源） |
| `python -X utf8 -I scripts/check_outlines.py [id…]` | 逐条核对导览图标题与来源原文；`--summary` 一行一节点看规模和扁平程度；`--archive` 把核对过的导览图写进 `data/outlines/` |
| `python -X utf8 scripts/audit_resources.py` | 对构建后的中英文学习资源做 HTTP 检查，临时结果写入 `temp/resource-audit/final-links.json`；HTTP 200 不等于内容合适，需结合人工审核 |
| `node tests/resources.mjs` | 遍历 201 个详情面板核对真实链接，验证桌面/手机展示、费用标签、中文缺口和回退行为 |
| `node tests/guide.mjs [id…]` | 用深链打开每张知识导览图，核对画出的节点数、查漏补缺列表、Esc 关闭和地址，桌面和手机各截图一组 |
| `scripts/research_tool.py fetch <url>` | 打开网页并缓存（免费，PDF 用 pypdf 抽文字）；`extract` 走 Tavily（花额度）读 JS 渲染页面，同样缓存 |
| `scripts/research_digest.py <id前缀>` | 把 pi 的检索结果压成几行摘要，供主代理判定前置 |
| `scripts/set_prereqs.py <decisions.json>` | 把一批判定写回 `prereqs.txt` 和 `prereq-notes.json` |
| `scripts/archive_research.py` | 把审核过的检索结果从 `temp/research/nodes/` 归档到 `data/research/nodes/` |
| `node tests/screenshot.mjs`、`node tests/screenshot-panel.mjs <id>` | 用系统自带的 Edge 无头截图检查页面（playwright-core，不下载浏览器），含深链回归检查 |
| `python -X utf8 scripts/package_web.py` | 把网页打成 `output/cs-math-skill-tree-<日期>.zip` 分享给别人（解压后双击 index.html；含 README.txt 和第三方许可证）。先跑 build |
| `node tests/a11y.mjs [report.json]` | axe-core 按 WCAG 2.2 AA 审计 15 个界面状态（含知识导览图），并跑一遍纯键盘的主流程；结论见 `docs/hci-ux-review.md` |

截图和 pip 安装时把 `TEMP`/`TMP` 指到项目的 `temp/`，避免写 C 盘。验算练习题用的 sympy / numpy / scipy 和抽 PDF 文字用的 pypdf 装在 `temp/pylib`（`pip install --target temp/pylib`；`research_tool.py` 会自己把它加进路径）。

## 学习资源维护

`data/research/nodes/` 保留原始课程和先修证据；新增或修正学习资源写入 `data/curation/learning-resources.json`，构建时只覆盖学习资源字段。`chineseCatalog` 存真实来源，`chinese` 为每个技能指定来源和阅读范围，`chineseGaps` 记录尚未核实到合适中文资源的节点。不要直接编辑生成的 `src/web/data.js`。

优先选可以直接学习的中文课程、在线教材和官方教程；中文界面不代表正文或录像为中文。MOOC、书籍或云平台要区分公开介绍、注册后学习、收费证书/全文和实际服务费用。只提供导读或部分分支时，在 `covers` 中说明边界。早期检索说明中“中文默认 null”的要求只描述当时任务，当前中文覆盖以此文件为准。

## 检索流程（给接手的代理）

- 资料检索交给 pi 子代理（走 Ollama，不占 Claude 额度）。先修与学习资源的说明书是 `docs/pi-research-brief.md`，知识导览图的说明书是 `docs/pi-outline-brief.md`（含第二轮“加深或换源”）。
  **cwd 必须是 `D:\agent`**，否则 pi 发现不了 `D:\agent\.pi\extensions\` 下的 Tavily 插件；同时最多跑 2 个。导览图一批 4–8 个节点，pi 大约 5–10 分钟。
- pi 只负责找资源、抄课程先修原文和目录；必须 / 推荐的最终判定、练习题、导览图的核对归档由主代理完成。
- 不要用 Claude 子代理批量并行（2026-10-31 一次开了 20 个 Opus 子代理，一分钟烧完额度）。
- `docs/research-brief.md` 是那次 Claude 子代理用的旧说明，已停用；其中“练习题要求”一节仍是出题标准。

## 用到的现成组件

- 布局：[elkjs](https://github.com/kieler/elkjs) 0.12.1（ELK layered，按步骤分区；构建时运行，EPL-2.0）
- 平移缩放：[@panzoom/panzoom](https://github.com/timmywil/panzoom) 4.6.2（MIT，`src/web/vendor/`）。注意它的构造函数会用 `setTimeout` 延迟平移到起点，所以页面的首次路由也放在 `setTimeout` 里，否则深链偶尔会被拉回原点
- 总览布局：同一个 elkjs，在 13 个领域组成的依赖图上做 layered 布局（`LONGEST_PATH_SOURCE` 分层），见 `scripts/build.mjs`
- 知识导览图：[markmap-view](https://github.com/markmap/markmap) 0.18.12（MIT）+ [d3](https://d3js.org) 7.9.0（ISC），浏览器版放在 `src/web/vendor/`，第一次打开导览图时才加载。直接把树结构交给 markmap，不经过 Markdown 解析
- PDF 抽文字：[pypdf](https://github.com/py-pdf/pypdf)（BSD，装在 `temp/pylib`）
- 无障碍审计：[axe-core](https://github.com/dequelabs/axe-core) 4.11.4（MPL-2.0，devDependency）
- 自己写的部分：构建脚本里的数据合并与校验、页面的渲染与交互（`src/web/app.js`、`src/web/overview.js`、`src/web/guide.js`）、总览连线的端口分配和曲线、审计脚本里对 axe 判断不了的对比度项的手算、导览图标题与来源原文的比对（`scripts/check_outlines.py`）。
