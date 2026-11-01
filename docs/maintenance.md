# 维护说明

给要改数据、重新构建或继续补内容的人（包括接手的 AI 代理）。面向使用者的说明在 [README](../README.md)。

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
| `python -X utf8 scripts/audit_resources.py --scope all --output temp/resource-audit/all-source-links.json --evidence-dir temp/resource-audit/current-pages` | 同时检查全部导览来源、目录与先修证据链接；正文只留临时目录，`--only-url URL` 可复查指定清单网址 |
| `python -X utf8 scripts/build_source_review.py` | 合并 `data/curation/source-review.tsv` 的人工判定、已归档 HTTP 快照与目录核对，生成 `reports/source-review-2026-11-01.md` 和 JSON；需要原有目录缓存及通过的界面检查日志 |
| `node tests/resources.mjs` | 遍历 201 个详情面板核对真实链接，验证桌面/手机展示、费用标签、中文缺口和回退行为 |
| `node tests/guide.mjs [id…]` | 用深链打开每张知识导览图，核对画出的节点数、查漏补缺列表、Esc 关闭和地址，桌面和手机各截图一组 |
| `scripts/research_tool.py fetch <url>` | 打开网页并缓存（免费，PDF 用 pypdf 抽文字）；`extract` 走 Tavily（花额度）读 JS 渲染页面，同样缓存 |
| `scripts/research_digest.py <id前缀>` | 把 pi 的检索结果压成几行摘要，供主代理判定前置 |
| `scripts/set_prereqs.py <decisions.json>` | 把一批判定写回 `prereqs.txt` 和 `prereq-notes.json` |
| `scripts/archive_research.py` | 把审核过的检索结果从 `temp/research/nodes/` 归档到 `data/research/nodes/` |
| `node tests/screenshot.mjs`、`node tests/screenshot-panel.mjs <id>` | 用系统自带的 Edge 无头截图检查页面（playwright-core，不下载浏览器），含深链回归检查 |
| `python -X utf8 scripts/package_web.py` | 把网页打成 `output/cs-math-skill-tree-<日期>.zip` 分享给别人（解压后双击 index.html；含 README.txt 和第三方许可证）。先跑 build |
| `node tests/a11y.mjs [report.json]` | axe-core 按 WCAG 2.2 AA 审计 15 个界面状态（含知识导览图），并跑一遍纯键盘的主流程；结论见 `docs/hci-ux-review.md` |
| `scripts/promo/`（`capture-app.mjs`、`build-graph.mjs`、`word-times.mjs`、`blender-tree.py`、`render-blender.sh`、`render.sh`） | 宣传片：页面截图、动画数据、Blender 3D 技能树、成片。画面代码在 `src/promo/`（Remotion），文稿 `data/promo/script.json`，步骤和坑见 `docs/promo-video.md` |

截图和 pip 安装时把 `TEMP`/`TMP` 指到项目的 `temp/`，避免写 C 盘。验算练习题用的 sympy / numpy / scipy 和抽 PDF 文字用的 pypdf 装在 `temp/pylib`（`pip install --target temp/pylib`；`research_tool.py` 会自己把它加进路径）。

## 学习资源维护

`data/research/nodes/` 保留原始课程和先修证据；新增或修正学习资源写入 `data/curation/learning-resources.json`，构建时只覆盖学习资源字段。`chineseCatalog` 存真实来源，`chinese` 为每个技能指定来源和阅读范围，`chineseGaps` 记录尚未核实到合适中文资源的节点。不要直接编辑生成的 `src/web/data.js`。

中英文都按“免费正文/讲义/官方教程 → 免费权威视频 → 付费课程或书籍”选用；费用未知保留`null`。视频中文优先哔哩哔哩、英文优先YouTube，优先大学/教师本人、官方机构及原作者公开发布；找不到可靠B站版本时采用大学课程原站。英文自动驾驶入口保留大学整理的YouTube全集页。平台、播放量与名校标题均不能单独证明权威性，社区资料需标明身份。中文界面不代表正文或录像为中文，中文授课也不自动代表有中文字幕。MOOC、书籍或云平台要区分公开介绍、注册后学习、收费证书/全文和实际服务费用。只提供导读或部分分支时，在 `covers` 中说明边界。早期检索说明中“中文默认 null”的要求只描述当时任务，当前中文覆盖以此文件为准。

## 检索流程（给接手的代理）

以下是作者本地的做法：pi 子代理和 Tavily 插件装在作者机器上的工作区根目录（`D:gent`），别的机器上需要换成自己的检索工具，判定规则和核对脚本不变。

- 资料检索交给 pi 子代理（走 Ollama，不占 Claude 额度）。先修与学习资源的说明书是 `docs/pi-research-brief.md`，知识导览图的说明书是 `docs/pi-outline-brief.md`（含第二轮“加深或换源”）。
  **cwd 必须是 `D:\agent`**，否则 pi 发现不了 `D:\agent\.pi\extensions\` 下的 Tavily 插件；同时最多跑 2 个。导览图一批 4–8 个节点，pi 大约 5–10 分钟。
- pi 只负责找资源、抄课程先修原文和目录；必须 / 推荐的最终判定、练习题、导览图的核对归档由主代理完成。
- 不要用 Claude 子代理批量并行（2026-10-31 一次开了 20 个 Opus 子代理，一分钟烧完额度）。
- `docs/research-brief.md` 是那次 Claude 子代理用的旧说明，已停用；其中“练习题要求”一节仍是出题标准。
