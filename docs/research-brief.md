# 节点检索与出题任务说明（子代理用）

每个子代理负责 `temp/research/batches/batch-XXy.md` 里的约 10 个节点，下面是发给它的完整说明（`{BATCH}` 换成批次名）。
产出：每个节点一个 `temp/research/nodes/<id>.json`，由 `scripts/build_skilltree.py` 合并进 `data/skilltree.json`。

---

你在帮一个「计算机科学 + 数学」学习技能树补内容。项目目录是 `D:/agent/projects/cs-math-skill-tree/`（下文路径都相对于它）。

- 你的节点清单：`temp/research/batches/{BATCH}.md`。每个节点给出 id、名称、深度（D1 核心基础 / D2 工程实践 / D3 专业深入 / D4 高级理论与科研）、入门层、内容简介、原图建议前置。
- 全部节点索引：`temp/research/batches/all-nodes.md`，把课程先修映射成节点 id 时用。

对每个节点做下面四件事，做完一个就立刻写 `temp/research/nodes/<id>.json`（例如 `temp/research/nodes/C.2.1.json`），不要攒到最后一起写。

## 1. 学习资源：按优先级只给一个主资源

1. `website` 学习网站：能直接在浏览器里系统学的，例如公开课程主页（有讲义、视频或作业，如 MIT OCW、Stanford、Berkeley、CMU 的课程页）、交互式教程、免费在线教材网站、官方教程。
2. `material` 资料：没有合适的网站时，用讲义 PDF、课程笔记或综述。
3. `book` 书：前两类都没有时，给经典教材（书名、作者、版次，链接用出版社页或作者主页）。

要求：免费优先；对入门友好；覆盖节点简介里的主要内容，不过度超纲；站点长期稳定（大学、官方或知名作者的站点）。如果有公认的优质中文资源（中国大学MOOC、学堂在线、知名教材中文版、B站上的大学官方课程），放进 `zh_alt`，没有就填 null。

## 2. 真实课程的先修要求

找 1–2 门真实的大学课程（优先官方课程目录或课程主页的 syllabus），抄下官方写明的先修要求（原文，尽量短），并注明是 required（必修先修）、recommended（建议）还是 unspecified（没说明）。把先修映射成节点 id。

然后对「原图建议前置」逐个判断：`supported`（课程明确要求）、`recommended`（课程写作建议或“有帮助”）、`not_mentioned`（没提到）、`contradicted`（课程明说不需要）。课程要求了、但原图没列的前置写进 `extra_prereqs`。

最后给出你的建议 `prereq_suggestion`：
- `required`（必须前置）：至少一门真实课程把它列为必修先修，并且不会它就学不懂本节点入门层的核心内容；
- `recommended`（推荐前置）：课程写作建议、只有部分课程要求，或者只在深入层才需要；
- 每条写一句理由。没有证据就不要放进 required。

## 3. 一道练习题（自己原创，不要抄教材或考试原题）

- 难度对准节点的「入门层」：入门层是 D1 就考概念和基本计算或小程序；D2 考动手实现、配置或给定场景下的设计；D3/D4 考有边界的分析或推导。
- 不超纲：只能用到本节点入门层的内容，以及它的前置节点的知识。不能用到以本节点为前置的后续节点的内容，也不能要求更深层次的技巧。
- 基本覆盖：用 2–4 个小问，合起来覆盖简介里的主要知识点（简介很长时挑核心的）。
- 能独立完成：纸笔或一小段程序，30–60 分钟内能做完；需要的数据直接写进题干。
- 自己验算答案。涉及计算的要算两遍；涉及代码的可以在 `temp/research/scratch/` 里用 Python 实际跑一下。
- 格式：中文；数学用 Unicode 符号（x²、√、∫、Σ、≤、→、∞、∂、∈），不要用 LaTeX；代码放在 ``` 代码块里。

## 工具与硬性规则

- 搜索用 WebSearch。每个写进文件的 URL 都必须亲自打开核实（用 WebFetch，或者 `python -I D:/agent/projects/cs-math-skill-tree/scripts/research_tool.py fetch <url> --grep "prereq|Prerequisite|先修"`），确认页面存在、内容对得上，才写 `verified: true`。打不开或对不上就换一个；实在找不到就填 null，并在 notes 里说明。
- 先修原文必须来自你打开过的页面，不要凭记忆写。
- 不要用 `research_tool.py search`（那个花 Tavily 额度）。
- 只写 `temp/research/nodes/` 下你自己批次的节点文件；临时文件只放 `temp/research/scratch/`；不要写 C 盘，不要改其他文件，不要做任何 git 操作。

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
  "prereq_suggestion": {"required": [{"id": "P.2.2", "why": ""}], "recommended": [{"id": "C.1.2", "why": ""}]},
  "exercise": {"level": "D1", "question": "题干，可分 (1)(2)(3) 小问", "answer": "每个小问的关键步骤和结果",
               "covers": ["知识点"], "uses_prereqs": ["P.2.2"], "time_min": 40},
  "notes": ""
}
```

全部完成后，最终回复不超过 150 字，只写：完成了哪些 id；哪些没找到资源或课程证据；遇到了什么问题。不要在回复里重复 JSON 内容。
