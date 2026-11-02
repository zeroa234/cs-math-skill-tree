# 维护说明

给要改数据、重新构建或继续补内容的人（包括接手的 AI 代理）。面向使用者的说明在 [README](../README.md)。

## 数据流

```
data/source/chatgpt-outputs/knowledge-map-data.json   ChatGPT 原图（只读）：节点、简介、相关关系、路线
data/curation/partition.json                           在原图上合并、删除、新增技能，改名称和简介
data/curation/granularity.json                         逐技能的单元规模、范围依据与相邻技能边界
data/curation/scope.json                               对照 CS2023 的主干 / 选修判定依据（知识点 → 知识单元、层级、原文片段）
data/curation/prereqs.txt                              必须 / 推荐前置（主代理维护）
data/curation/prereq-notes.json                        每条前置的理由 + 证据摘要
data/curation/names-en.tsv                             英文名
data/curation/learning-resources.json                  学习资源审核、英文修正、中文来源目录与逐技能映射、supplementary 补充/付费备选
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
| `node tests/resources.mjs` | 遍历全部详情面板核对真实链接，验证桌面/手机展示、费用标签、中文缺口和回退行为 |
| `node tests/guide.mjs [id…]` | 用深链打开每张知识导览图，核对画出的节点数、查漏补缺列表、Esc 关闭和地址，桌面和手机各截图一组 |
| `scripts/research_tool.py fetch <url>` | 打开网页并缓存（免费，PDF 用 pypdf 抽文字）；`extract` 走 Tavily（花额度）读 JS 渲染页面，同样缓存 |
| `scripts/research_digest.py <id前缀>` | 把 pi 的检索结果压成几行摘要，供主代理判定前置 |
| `python -X utf8 -I scripts/check_scope.py [--markdown]` | 核对 `scope.json`：每段原文片段都在 CS2023 所引单元的所引层级里，每个被引的知识点都在技能简介里；`--markdown` 输出判定报告里的逐技能表（先 build） |
| `scripts/set_prereqs.py <decisions.json>` | 把一批判定写回 `prereqs.txt` 和 `prereq-notes.json` |
| `python -X utf8 scripts/merge_skills.py merge/drop/move-source/drop-source …` | 改技能划分时搬数据：前置、理由、课程证据、练习题、导览图来源、学习资源、英文名一起改，见下面“改技能划分” |
| `scripts/archive_research.py` | 把审核过的检索结果从 `temp/research/nodes/` 归档到 `data/research/nodes/` |
| `node tests/screenshot.mjs`、`node tests/screenshot-panel.mjs <id>` | 用系统自带的 Edge 无头截图检查页面（playwright-core，不下载浏览器），含深链回归检查 |
| `node scripts/readme-images.mjs` | 按当前构建重截 README 的五张预览图 `docs/images/{overview,skill-map,goal,guide,bilingual-path}.webp`（1920×1080 深色，转 WebP 要 Python + Pillow）；数据变了就重跑。封面 `cover.webp` 另由 `scripts/promo/cover.py` 生成 |
| `python -X utf8 scripts/package_web.py [标签]` | 把网页打成 `output/cs-math-skill-tree-<标签>.zip` 分享给别人（标签默认是当天日期，发 Release 时用版本号；解压后双击 index.html；含 README.txt 和第三方许可证，README.txt 里“前置待核实”的个数从数据里数）。先跑 build |
| `node tests/a11y.mjs [report.json]` | axe-core 按 WCAG 2.2 AA 审计 15 个界面状态（含知识导览图），并跑一遍纯键盘的主流程；结论见 `docs/hci-ux-review.md` |
| `scripts/promo/`（`capture-app.mjs`、`build-graph.mjs`、`word-times.mjs`、`blender-tree.py`、`render-blender.sh`、`render.sh`） | 宣传片：页面截图、动画数据、Blender 3D 技能树、成片。画面代码在 `src/promo/`（Remotion），文稿 `data/promo/script.json`，步骤和坑见 `docs/promo-video.md` |

截图和 pip 安装时把 `TEMP`/`TMP` 指到项目的 `temp/`，避免写 C 盘。验算练习题用的 sympy / numpy / scipy 和抽 PDF 文字用的 pypdf 装在 `temp/pylib`（`pip install --target temp/pylib`；`research_tool.py` 会自己把它加进路径）。

## 学习资源维护

`data/research/nodes/` 保留原始课程和先修证据；新增或修正学习资源写入 `data/curation/learning-resources.json`，构建时只覆盖学习资源字段。`chineseCatalog` 存真实来源，`chinese` 为每个技能指定来源和阅读范围，`chineseGaps` 记录尚未核实到合适中文资源的节点。不要直接编辑生成的 `src/web/data.js`。

中英文都按“免费正文/讲义/官方教程 → 免费权威视频 → 付费课程或书籍”选用；费用未知保留`null`。视频中文优先哔哩哔哩、英文优先YouTube，优先大学/教师本人、官方机构及原作者公开发布；找不到可靠B站版本时采用大学课程原站。英文自动驾驶入口保留大学整理的YouTube全集页。平台、播放量与名校标题均不能单独证明权威性，社区资料需标明身份。中文界面不代表正文或录像为中文，中文授课也不自动代表有中文字幕。MOOC、书籍或云平台要区分公开介绍、注册后学习、收费证书/全文和实际服务费用。只提供导读或部分分支时，在 `covers` 中说明边界。早期检索说明中“中文默认 null”的要求只描述当时任务，当前中文覆盖以此文件为准。

### 中英文独立学习路线

“有中英文链接”与“两个语言各自能学完”分开统计。`data/curation/learning-paths/<id>.json` 存每个技能的双语路线：

- `sources` 给出实际教学材料、语言、主课/补充/参考角色、费用和内容证据；官方文档或目录页不能仅因标题对口就算完整入门课。
- `topics` 逐项对应当前简介，中文和英文分别给到具体章节或讲次；`extension` 只能用已明确的选读边界，并写理由，不能为凑覆盖率缩减必学范围。
- `routes.zh/en` 按学习顺序组织该语言的材料。先免费正文，再免费作者/学校视频，最后正版付费。视频语言与字幕要核实，付费目录可支持范围判断，但不能冒充免费正文。
- 某语言仍缺内容时，先保留缺口。实际查过文字、视频、付费三个渠道，仍未找到合适教学，才能列 `cross_language_fallbacks`，附检索记录和原因；“本轮未找到”不等于“不存在”。

`scripts/learning-paths.mjs` 按必学知识点计算覆盖，拒绝跨语言混算、遗漏知识点、仅参考文档却宣称全覆盖、过期简介和没有查找记录的跨语言回退。它检查记录是否自洽，课程内容是否真的对应仍需阅读来源。新增/修改后运行：

```bash
node --test tests/learning-paths.mjs
node scripts/build.mjs
node scripts/check-learning-paths.mjs --require-all
node tests/resources.mjs
```

构建也要求全树都有路线、每个必学缺口都有已研究的跨语言补充；发布前 `--require-all` 必须通过：覆盖全树，每个语言的必学缺口要么补齐，要么有查过三类渠道的跨语言回退。页面顶部显示实际覆盖数，不用“有中文入口的技能数”代替完整路线数。

#### 规则补充（2026-11-02 第七轮）

- **必学知识点 = 简介条目 − 说明条目**。简介按 `、，,；;。` 拆分；`scope.json` 的 `meta` 列出不是知识点的条目（树外前置、范围边界、与其他领域的关系），构建把它们写进输出的 `descNotes`，校验器不要求为它们找材料。简介的括号里不能出现上述分隔符，否则一个知识点会被拆成两半，构建会报错（写成“SETH/3SUM/APSP”）。
- **官方版优先**（用户定的规则）：同一门课有学校、作者或 MOOC 平台的免费官方版，就链官方版；查不到才用第三方转载，此时来源写 `reupload: true`、`official_search`（查了哪些官方渠道、结果），`access` 开头带“第三方转载，授权未核”。校验器会拦下文字里像转载却没分类的来源。B 站视频页的“自制/转载”标记可作上传者身份的佐证。
- **跨语言补充要经带搜索的一轮确认**：每条 `cross_language_fallbacks` 要有 `confirmed_by`（是哪个补充文件确认的）。没有网页搜索时得出的“没有”一律不算。B 站搜索页不带 cookie 时常返回无关推荐，只能用来“找到”，要证明“没有”必须用 `site:bilibili.com` / `site:icourse163.org` 的站内搜索。
- **判定“没有”之前读正文**：目录里没有专节不等于没讲（例：廖雪峰 Java 教程“继承”一页有“区分继承和组合”）。

#### 研究结果怎么并进来

研究代理不直接改记录，只写补充文件 `temp/research/bilingual-coverage/review/<来源>-additions/<id>.json`（`pi-additions` 是 pi 写的，`main-additions` 是主代理复核时写的）。字段：`sources`（新来源）、`source_updates`（改已有来源的 official_search/reupload/role/access 等）、`remove_sources`（删失效来源）、`topic_updates`（某语言某知识点对到哪份材料的哪一章）、`route_steps`、`searches`、`fallback_confirm`、`unresolved`。然后：

```bash
python -X utf8 scripts/learning_path_merge.py --all --report temp/research/bilingual-coverage/review/merge-report.json
node scripts/archive-learning-paths.mjs --reviewed <ids>            # 只校验
node scripts/archive-learning-paths.mjs --archive --reviewed <ids>  # 写入 data/curation/learning-paths 与 learning-resources.json
```

`learning_path_merge.py`（需要 Windows，用系统的 `LCMapStringEx` 把中文转成简体）从已归档记录（没有就用原始研究记录）出发，先叠加研究批次，再叠加 final-additions，之后是 publication/verified-additions，最后 main-additions；同组按文件名顺序叠加补充文件，按章节引用重新计算每种语言的覆盖和缺口，删掉已不是缺口的跨语言补充，每种语言只留覆盖知识点最多的一个主资源。任一合并失败时命令返回非零，禁止把上次残留的候选当作新结果归档。已并入归档记录的补充文件按内容哈希记录，文件之后再被改写会报错，不会悄悄漏掉；所以复核修正要另写新文件，不要改已并入的文件。

统计报告用 `python -X utf8 scripts/report_learning_paths.py` 从已归档记录生成。覆盖数按实际教学引用与学习步骤计算，查阅参考不计入；付费目录支持范围判断，完整正文未读时必须写明。当前发布记录：192 个技能、891 个必学知识项，中文 189 条完整路线、英文 192 条，3 项中文需英文补读。

视频字幕写进 `access`，核不了就写“未核对”和原因，不要猜：

- YouTube：`yt-dlp --list-subs --skip-download <视频地址>`。输出里有 “Available subtitles” 的是人工字幕；只有 “Available automatic captions” 的是自动生成字幕。
- MIT OCW：讲次页面里有 `…_<YouTube ID>.vtt` 链接和 “Download transcript” 就是有英文字幕；逐讲抓页面数一下，写“N 讲中 M 讲有”。
- 哔哩哔哩：字幕要登录后才显示（yt-dlp 也会提示 “Subtitles are only available when logged in”），中国大学MOOC 同理；臺大 OCW 有人机验证，脚本读不到。

## 主干与选修

地图上的虚线框（`optional`）和详情里的理由（`scope`）由 `scripts/build.mjs` 按 `data/curation/scope.json` 计算，规则和依据见 `reports/skill-scope-2026-11-01.md`：

- 简介里至少一半的知识点有 CS2023 CS Core / KA Core 原文对应，算主干；
- `hosts` 标明的技能讲授某个 CS Core 主题，算主干；
- 主干技能的必须前置也算主干。
- 其余为选修。领域块只有在全部技能都是选修时才标“选修”。

维护时注意：

- 改了技能简介，`scope.json` 里引用的知识点对不上，构建会直接报错。按新简介重新比对后，跑 `check_scope.py`。
- 新增技能要加一条判定；没有原文对应的，写 `note` 说明 CS2023 里没有或只在 Non-core。
- 改了必须前置，主干集合会跟着变，build 输出的 `scope (CS2023)` 一行可以看到数量。
- CS2023 原文 PDF 通过 `research_tool` 的缓存读取，第一次运行会自动抓取。

## 改技能划分

原图只读，技能的合并、删除、新增和改名都记在 `data/curation/partition.json`，构建时套用：

- `merged`：`{"被并入的 id": "保留的 id"}`。原图里指向被并入技能的前置、相关关系和路线都改指保留的技能。
- `dropped`：`{"id": "理由"}`。指向它的关系和路线一并去掉。
- `nodes`：`{"id": {...}}`。对原图节点是覆盖（常用 `name`、`desc`）；新增节点要写全 `parent`、`domain`、`name`、`desc`、`levels`。

步骤：

1. 先写好 `partition.json`。
2. 用 `scripts/merge_skills.py` 搬数据：`merge A B` 把 A 并进 B，`drop ID 理由` 删掉，`move-source` / `drop-source` 在两张导览图之间挪来源。
3. 脚本只机械合并，下面几项要人来做：
   - 前置：按课程证据重新判定必须 / 推荐，改 `prereq-notes.json` 的理由和摘要；
   - 练习题：重新组合，新写的小题要验算；
   - 学习资源：按新简介重新找、重新写 `covers`；
   - 导览图：改过的图在 `temp/outlines/nodes/<id>.json`，跑 `check_outlines.py --archive <id>` 逐条核对后归档，补充分支要写 `fill`；
   - 英文名：改 `names-en.tsv`。
4. 在 `scope.json` 里补上或改掉相应的判定，跑 `check_scope.py`。
5. 跑 build 和测试，更新 README 里的数字。

2026-11-01 的改动和理由见 `reports/skill-partition-review-2026-11-01.md`。宣传片里的数字是改动前的，改不了，README 里已注明。

## 检索流程（给接手的代理）

以下是作者本地的做法：pi 子代理和 Tavily 插件装在作者机器上的工作区根目录（`D:\agent`），别的机器上需要换成自己的检索工具，判定规则和核对脚本不变。

- 资料检索交给 pi 子代理（走 Ollama，不占 Claude 额度）。先修与学习资源的说明书是 `docs/pi-research-brief.md`，知识导览图的说明书是 `docs/pi-outline-brief.md`（含第二轮“加深或换源”）。
  **cwd 必须是 `D:\agent`**，否则 pi 发现不了 `D:\agent\.pi\extensions\` 下的 Tavily 插件；并发上限以工具当前配置为准。导览图一批 4–8 个节点，pi 大约 5–10 分钟。
- pi 只负责找资源、抄课程先修原文和目录；必须 / 推荐的最终判定、练习题、导览图的核对归档由主代理完成。
- 不要用 Claude 子代理批量并行（2026-10-31 一次开了 20 个 Opus 子代理，一分钟烧完额度）。
- `docs/research-brief.md` 是那次 Claude 子代理用的旧说明，已停用；其中“练习题要求”一节仍是出题标准。

## 发布到 GitHub

- 仓库 <https://github.com/zeroa234/cs-math-skill-tree>。本项目平时在作者工作区的大仓库里提交，`bash scripts/publish-github.sh` 用 `git subtree split` 拆出本目录的历史、去掉提交说明里的 AI 署名行，并把本地 git 身份（ZCode Agent）换成作者的 GitHub 身份（zeroa234 的 noreply 邮箱），再推到 `main`。2026-11-01 加身份替换时强推过一次，此后重建结果是确定的，每次都是快进推送；先加 `--dry-run` 只生成本地分支 `publish/cs-math-skill-tree` 看一眼。
- 在线版：GitHub Pages。`.github/workflows/pages.yml` 在 `src/web/` 有改动时把它原样部署到 <https://zeroa234.github.io/cs-math-skill-tree/>，不在 CI 里重新构建，所以推送前先本地跑 `node scripts/build.mjs`。
- 离线包：先 build，再 `python -X utf8 scripts/package_web.py vX.Y.Z`，把 `output/cs-math-skill-tree-vX.Y.Z.zip` 传到新的 Release：`gh release create vX.Y.Z <zip> --notes-file <说明.md>`。
- Windows 上 gh 的中文命令行参数会变成乱码：Release 标题、仓库简介这类中文字段用 UTF-8 的 JSON 走 `gh api ... --input -`，改完读回核对。


## 全树复核与证据

- `granularity.json` 覆盖所有当前技能；名称或简介改动后必须同步重判，build 会拒绝缺失/过期条目。课程单元、基础模块、进阶模块、教材单元不表示相同学时。
- `prereq-audit.json` 归档间接边的最终裁决。研究节点的 `required_evidence` 每项含 id、basis、sources（url+quote）、reason 和 limits；basis 为 course、same_course 或 chain。链条要保留每一环来源，不能拿推荐课或旁系课程顺序充数。
- `python -X utf8 scripts/check_prereqs.py` 检查必须边有明确 required 映射或结构完整的证据、每条有入门理由、没有 draft。`python -X utf8 tests/prereqs.py` 用反例防误判。两者都不能代替原文阅读。
- `learning-resources.json` 的 supplementary 列表会显示为折叠的“补充材料”；free 可为 true/false/null，不能把主页可访问等同于正文免费。视频的发布者、授课语言和字幕状态写入 access；未知就明确未知。
- `resource-fallback-audit.json` 保存中文视频/付费候选的检索记录，最终采用字段以 learning-resources.json 为准。出版社目录公开不等于全文免费。
- `tests/progress.mjs` 验证旧进度的保守合并、备份随导出保留、新版本不重复迁移、旧技能深链跳转。旧版未标数据版本时无法完全识别学过的范围，因此可能需要重新确认部分合并卡片。
- 当前验收：build、check_prereqs、check_scope、check_outlines；再跑 resources.mjs、progress.mjs、guide.mjs、a11y.mjs。浏览器临时文件均放项目 temp。
- `source-review.tsv`、source-review-notes.json、build_source_review.py 和最初 source-review 报告属于 201 技能的历史基线；当前变化以逐技能 granularity、learning-resources 与划分报告为准，不能直接拿旧 201 行审计表覆盖新数据。
