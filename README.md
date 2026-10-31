# CS × 数学技能树

把 ChatGPT 生成的“知识星图”（`data/source/chatgpt-outputs/`，只读）重做成一棵**能按步骤点亮的技能树**：
每个技能分清“必须前置”和“推荐前置”，必须前置没点亮就不能点亮下一个；每个技能配一个学习资源和一道练习题。

## 打开

双击 `src/web/index.html`（不需要联网，不需要构建）。进度保存在浏览器的 localStorage 里，可在“进度 ▾”导出 / 导入 JSON。

## 怎么读这张图

- 每条横向泳道是一个领域（数学拆成三条）。横轴“第 N 步” = 前面最长有 N−1 层必须前置。第 1 步的技能没有必须前置，是起点。
- 卡片状态：已点亮（暖色 + ✓）、现在能学（蓝框 + ⊕）、未解锁（灰 + 锁）。颜色之外都有图标，色弱也能分辨。
- 平时只淡淡画出必须前置连线；选中一个技能时，高亮它的整条必须前置链（实线）、推荐前置（虚线）和它直接解锁的技能（绿线），其余变暗。
- 左栏“现在能学”按“学完能解锁的后续技能数”排序；选一条路线或“设为目标”后，左栏给出按顺序编号的学习清单，地图上也标出序号。
- 详情面板：必须 / 推荐前置及理由、学什么、去哪学（网站 > 讲义资料 > 书）、练习题（答案折叠）、前置依据（真实课程的官方先修原文）。

## 必须 / 推荐前置的判定规则

- **必须前置**：至少一门真实大学课程把它列为先修（或在同一门课里先讲它），并且不会它就学不懂本技能入门层的内容。
- **推荐前置**：课程写成“建议 / 有帮助”、只有部分课程要求、只是数学成熟度门槛，或者只在深入层才用到。只提示，不挡路。
- 每个技能的状态写在 `data/curation/prereqs.txt` 最后一列：`verified` = 已用课程证据核实；`draft` = 找不到可用的课程先修说明，按内容需要起草，页面上显示“前置待核实”。
- 理由和证据摘要在 `data/curation/prereq-notes.json`；原始证据（课程名、官方先修原文、链接）在 `data/research/nodes/<id>.json`。

## 当前完成度（2026-10-31）

- 201 个技能：前置已核实 191，学习资源 201，练习题 193。
- 前置待核实（draft，10 个）：F.2.4、P.5.4、C.4.4、D.1.5、S.2.4、S.5.2、H.4.4、I.2.3、X.2.4、X.2.5。原因是没找到能用的课程先修说明，或者课程要求的是树外的专业课（如 GIS、医学）。
- 没有练习题（8 个）：S.3.2–S.5.2（攻防与取证方向的安全技能）。出题时被安全审查拦下，只保留前置和学习资源，不要再重试。
- 入门层 D2 以上却没有必须前置的技能：H.2.3、H.4.3、V.2.3。这是有证据的：对应课程写明不需要先修，构建时的警告可以忽略。

## 数据流

```
data/source/chatgpt-outputs/knowledge-map-data.json   ChatGPT 原图（只读）：节点、简介、相关关系、路线
data/curation/prereqs.txt                              必须 / 推荐前置（主代理维护）
data/curation/prereq-notes.json                        每条前置的理由 + 证据摘要
data/curation/names-en.tsv                             英文名
data/research/nodes/<id>.json                          审核过的检索结果：资源 + 课程先修证据
data/exercises/*.json                                  每个技能一道练习题（答案已验算）
        │  node scripts/build.mjs   （检查环、算步骤、ELK 分层布局）
        ▼
output/skilltree.json   合并后的数据（可复用）
src/web/data.js         同上 + 布局坐标，页面直接加载
```

## 脚本

| 脚本 | 用途 |
|---|---|
| `npm install` 后 `node scripts/build.mjs` | 重新生成 `src/web/data.js` 与 `output/skilltree.json`；前置有环、ID 写错、卡片重叠都会直接报错 |
| `scripts/make_research_batches.py` | 把技能切成检索批次 `temp/research/batches/batch-XXy.md` |
| `scripts/research_tool.py fetch <url>` | 打开网页并缓存（免费）；pi 检索时用它核实每个链接 |
| `scripts/research_digest.py <id前缀>` | 把 pi 的检索结果压成几行摘要，供主代理判定前置 |
| `scripts/set_prereqs.py <decisions.json>` | 把一批判定写回 `prereqs.txt` 和 `prereq-notes.json` |
| `scripts/archive_research.py` | 把审核过的检索结果从 `temp/research/nodes/` 归档到 `data/research/nodes/` |
| `node tests/screenshot.mjs`、`node tests/screenshot-panel.mjs <id>` | 用系统自带的 Edge 无头截图检查页面（playwright-core，不下载浏览器） |

截图和 pip 安装时把 `TEMP`/`TMP` 指到项目的 `temp/`，避免写 C 盘。验算练习题用的 sympy / numpy / scipy 装在 `temp/pylib`（`PYTHONPATH=temp/pylib`）。

## 检索流程（给接手的代理）

- 资料检索交给 pi 子代理（走 Ollama，不占 Claude 额度），说明书是 `docs/pi-research-brief.md`。
  **cwd 必须是 `D:\agent`**，否则 pi 发现不了 `D:\agent\.pi\extensions\` 下的 Tavily 插件；同时最多跑 2 个。
- pi 只负责找资源、抄课程先修原文；必须 / 推荐的最终判定、练习题由主代理完成。
- 不要用 Claude 子代理批量并行（2026-10-31 一次开了 20 个 Opus 子代理，一分钟烧完额度）。
- `docs/research-brief.md` 是那次 Claude 子代理用的旧说明，已停用；其中“练习题要求”一节仍是出题标准。

## 用到的现成组件

- 布局：[elkjs](https://github.com/kieler/elkjs) 0.12.1（ELK layered，按步骤分区；构建时运行，EPL-2.0）
- 平移缩放：[@panzoom/panzoom](https://github.com/timmywil/panzoom) 4.6.2（MIT，`src/web/vendor/`）
- 自己写的部分：构建脚本里的数据合并与校验、页面的渲染与交互（`src/web/app.js`）。
