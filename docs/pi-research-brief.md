# pi 子代理检索任务说明

派活方式（主代理用）：`pi_agent`，`cwd = D:\agent`（Tavily 插件在 `D:\agent\.pi\extensions\`，pi 只从工作目录发现插件，cwd 设成项目目录就没有搜索工具），`load_extensions: true`（启用 `tavily_search` / `tavily_extract`），`run_in_background: true`，
prompt 只写一句：“读 `docs/pi-research-brief.md`，按说明完成批次 `batch-XXy`。”同时最多跑 2–4 个，避免把 Tavily 额度和模型并发打满。
练习题和必须/推荐前置的最终判定由主代理做，pi 只负责找资料、核实证据。

---

你是资料检索员。只做查找和核实：不写代码，除了下面指定的输出文件，不新建或修改任何文件，不做任何 git 操作。

- 当前目录是 `D:\agent`，项目目录是 `projects/cs-math-skill-tree/`。下文路径都相对于项目目录；运行命令和写文件时要带上项目目录前缀，例如 `python -I projects/cs-math-skill-tree/scripts/research_tool.py fetch <url>`、写 `projects/cs-math-skill-tree/temp/research/nodes/C.2.1.json`。
- 本批任务清单：`temp/research/batches/<批次名>.md`。每个节点给出 id、名称、深度、入门层、内容简介、原图建议前置。
- 全部节点索引：`temp/research/batches/all-nodes.md`（把课程先修映射成节点 id 时用）。
- 如果 `temp/research/nodes/<节点id>.json` 已经存在，跳过这个节点。

对清单里每个节点做两件事。

## A. 找一个最合适的学习资源（按优先级，有前一类就不用后一类）

1. `website` 学习网站：能直接在浏览器里系统学的，例如公开课程主页（有讲义、视频或作业，如 MIT OCW、Stanford、Berkeley、CMU 的课程页）、交互式教程、免费在线教材网站、官方教程。
2. `material` 资料：没有合适的网站时，用讲义 PDF、课程笔记或综述文章。
3. `book` 书：前两类都没有时，给经典教材（书名、作者、版次，链接用出版社页或作者主页）。

要求：用户在国外读大学，英文资源完全可以，优先给英文的；免费优先；对入门友好；覆盖节点简介里的主要内容，不过度超纲（入门层是 D1 的节点不要给研究生课程）；站点长期稳定（大学、官方或知名作者的站点）。
不用专门去找中文资源：`zh_alt` 默认填 null，只有顺手碰到公认优质的中文资源时才填。

## B. 核实先修要求

找 1–2 门真实的大学课程（优先英美等英文大学的官方课程目录或课程主页的 syllabus）。课程必须是**教这个节点内容的课**（例如“梯度与雅可比矩阵”找多元微积分/向量微积分课，不要找只是用到它的机器学习课）。抄下官方写明的先修要求（原文，尽量短），并注明它写的是 required（必修先修）、recommended（建议）还是 unspecified（没有说明）。然后：

- 把先修课映射到 `all-nodes.md` 里的节点 id。注意按课程实际内容映射，例如要求“会 C 语言编程”映射到 P.2.2，要求 Berkeley CS 61C / CMU 15-213 这类机器结构课映射到 C.1.1 和 P.2.2，要求数据结构课映射到 F.1.1。
- 对清单里的“原图建议前置”逐个给出判断：`supported`（课程明确要求）、`recommended`（课程写作建议或“有帮助”）、`not_mentioned`（没有提到）、`contradicted`（课程明说不需要）。
- 课程要求了、但原图没列的前置，写进 `extra_prereqs`。

## 工具与额度

- 打开网页优先用 `python -I scripts/research_tool.py fetch <url>`（免费，有缓存；可加 `--grep "prereq|Prerequisite|先修|预备知识"` 只看匹配行，加 `--chars 6000` 看更多正文）。
- `tavily_search` 每次花 1 个额度：先用你已知的权威页面直接 fetch，找不到再搜，每个节点最多搜 2 次。
- `tavily_extract` 只在 fetch 打不开或拿不到正文（JS 渲染页面）时用，每个节点最多 1 次。
- 不要用 `research_tool.py search`，不要自己写调用 Tavily 的脚本，不要读 API key。

## 硬性规则

- 不许编造。每个写进文件的 URL 都必须亲自打开过，确认页面存在且内容对得上，才能写 `verified: true`。打不开或对不上就换一个；实在找不到就填 null，并在 notes 里说明。
- 先修原文必须来自你打开过的页面，不要凭记忆写。
- 临时文件只能放 `temp/research/scratch/`，不要用 /tmp，也不要写 C 盘。
- 每完成一个节点，立刻写一个文件 `temp/research/nodes/<节点id>.json`（例如 `temp/research/nodes/C.2.1.json`）。不要攒到最后一次性写，也不要一次生成特别长的输出。

## JSON 格式（UTF-8）

```json
{
  "id": "C.2.1",
  "resource": {"tier": "website|material|book", "title": "", "url": "", "lang": "en|zh", "free": true,
               "covers": "一句话：覆盖了节点的哪些内容", "verified": true},
  "zh_alt": {"title": "", "url": "", "verified": true},
  "courses": [{"school": "", "course": "", "url": "", "prereq_text": "官方原文",
               "prereq_kind": "required|recommended|unspecified", "mapped_ids": ["P.2.2", "C.1.1"]}],
  "candidate_check": {"P.1.1": "supported|recommended|not_mentioned|contradicted"},
  "extra_prereqs": [{"id": "F.1.1", "kind": "required|recommended", "evidence": "哪门课写的"}],
  "notes": ""
}
```

全部节点完成后，最终回复只写三点：完成了哪些 id；哪些没找到资源或课程证据；遇到了什么问题。不要在最终回复里重复 JSON。

---

## 第三轮：重新划分后的学习资源与先修证据（批次 `repart-N`，2026-11-01）

技能划分调整后（合并、收窄、新增，原因见 `reports/skill-partition-review-2026-11-01.md`），改动过的技能要重新找学习资源，个别技能要重新找先修证据。本轮规则与上文不同的地方：

- 任务清单：`temp/research/batches/repart-N.md`。每个节点给出新的名称、简介、深度，现有的中英文资源，以及本轮要做的事。
- 输出：`temp/research/repartition/<节点id>.json`（新目录；已存在就跳过）。每完成一个节点立刻写文件。
- 划分变化（映射先修时用新 id）：M.1.4.2、M.1.4.3 并入 M.1.4.1；M.1.4.5 并入 M.1.4.4；X.1.2 并入 X.1.1；P.2.1 并入 P.1.2；M.3.6 已删除；新增 P.5.5 游戏开发与游戏引擎。其余 id 见 `temp/research/batches/all-nodes.md`。

### 学习资源：英文一条、中文一条，按优先级选

1. **免费正文**：开放教材、官方教程、大学公开讲义或课程站（有成体系的正文或讲义）。
2. **免费权威视频**：英文优先 YouTube，中文优先哔哩哔哩；发布者要是大学、教师本人、官方机构或原作者。找不到可靠的 B 站版本时，用大学课程原站的录像。
3. **付费**：前两类都没有时，给付费课程或书籍，写清价格或访问条件（如“教材需购买”“注册后免费学、证书收费”）。

要求：
- **现有资源先评估**：仍然覆盖新简介的主要内容、链接能打开、访问条件写得对，就保留，并在 `keep_reason` 里说明；不合适才换，并在 `notes` 里写换掉的原因。
- `covers` 写清这份资源覆盖简介里的哪些内容、哪些没覆盖（边界）。只覆盖一部分时必须写明。
- **视频**要写 `publisher`（发布者是谁、凭什么认定是官方或本人，例如“学校官方账号”“课程主页直接链接此合集”）和 `subtitles`（`中字` / `英字` / `中英` / `无` / `未核对`，没逐集看过就写 `未核对`）。
- 中文界面不等于正文或录像是中文，中文授课也不等于有中文字幕，要分开写。平台、播放量、名校标题都不能单独证明权威。
- `free` 写 `true` / `false`；分不清（如 MOOC 免费学、证书收费）时写 `true` 并在 `access` 里说明，确实不知道写 `null`。
- 实在找不到合适的中文资源，`zh` 写 null，在 `zh_gap` 里写清楚找过哪些、为什么不合适。

### 先修证据（只对清单里标了“要找先修证据”的节点）

同上文 B 节：找 1–2 门真实大学课程（教这个节点内容的课），抄官方先修原文，映射到新 id，对清单里的候选前置逐个给 `supported` / `recommended` / `not_mentioned` / `contradicted`。

### JSON 格式

```json
{
  "id": "P.5.5",
  "en": {"tier": "website|material|book|video", "title": "", "url": "", "lang": "en", "free": true,
         "access": "访问条件", "covers": "覆盖哪些、哪些没覆盖", "publisher": "（视频）发布者与依据",
         "subtitles": "（视频）英字|中字|中英|无|未核对", "verified": true, "keep_reason": "（保留现有资源时）"},
  "zh": {"tier": "", "title": "", "url": "", "lang": "zh", "free": true, "access": "", "covers": "",
         "publisher": "", "subtitles": "", "verified": true, "keep_reason": ""},
  "zh_gap": "",
  "courses": [{"school": "", "course": "", "url": "", "prereq_text": "官方原文", "prereq_kind": "required|recommended|unspecified", "mapped_ids": []}],
  "candidate_check": {"P.1.2": "supported|recommended|not_mentioned|contradicted"},
  "extra_prereqs": [{"id": "", "kind": "required|recommended", "evidence": ""}],
  "notes": ""
}
```

不需要找先修证据的节点，`courses` / `candidate_check` / `extra_prereqs` 留空。硬性规则（不许编造、亲自打开、临时文件位置、工具额度）同上文。
最终回复写：完成了哪些 id；每个节点的中英文资源是保留还是新换（一句话原因）；哪些没找到；遇到的问题。
