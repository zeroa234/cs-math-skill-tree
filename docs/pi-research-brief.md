# pi 子代理检索任务说明（模板）

把 `{BATCH}` 换成批次号（01–10）后作为 prompt 发给 pi（cwd = `D:\agent`，`load_extensions: true` 以启用 `tavily_search` / `tavily_extract`）。

---

你是资料检索员。只做查找和核实：不写代码，除了下面指定的输出文件，不新建或修改任何文件。

- 项目目录：`projects/cs-math-skill-tree/`（下文路径都相对于它）
- 本批任务清单：`temp/research/batches/batch-{BATCH}.md`（每个节点的 id、名称、内容简介、原图建议前置）
- 全部节点索引：`temp/research/batches/all-nodes.md`（把课程先修映射成节点 id 时用）

对清单里每个节点做两件事。

## A. 找一个最合适的学习资源（按优先级，有前一类就不用后一类）

1. `website` 学习网站：能直接在浏览器里系统学的，例如公开课程主页（有讲义、视频或作业，如 MIT OCW、Stanford、Berkeley、CMU 的课程页）、交互式教程、免费在线教材网站、官方教程。
2. `material` 资料：没有合适的网站时，用讲义 PDF、课程笔记或综述文章。
3. `book` 书：前两类都没有时，给经典教材（书名、作者、版次，链接用出版社页或作者主页）。

要求：免费优先；对入门友好；覆盖节点简介里的主要内容，不要过度超纲；站点长期稳定（大学、官方或知名作者的站点）。如果有公认的优质中文资源（中国大学MOOC、学堂在线、知名教材的中文版、B站上的大学官方课程），在 `zh_alt` 里另给一个，没有就填 null。

## B. 核实先修要求

找 1–2 门真实的大学课程（优先官方课程目录或课程主页的 syllabus），抄下官方写明的先修要求（原文，尽量短），并注明它写的是 required（必修先修）、recommended（建议）还是没有说明。然后：

- 把先修映射到 `all-nodes.md` 里的节点 id；
- 对清单里的“原图建议前置”逐个给出判断：`supported`（课程明确要求）、`recommended`（课程写作建议或“有帮助”）、`not_mentioned`（没有提到）、`contradicted`（课程明说不需要）；
- 课程要求了、但原图没列的前置，写进 `extra_prereqs`。

## 硬性规则

- 不许编造。每个 URL 都要用 `python -I scripts/research_tool.py fetch <url>` 打开（可加 `--grep "prereq|先修|Prerequisite"` 只看匹配行），确认页面存在且内容对得上，才能写 `verified: true`。打不开或对不上就换一个；实在找不到就填 null，并在 notes 里说明。
- 先修原文必须来自你打开过的页面，不要凭记忆写。
- 省搜索额度：先用你已知的权威页面（课程主页、课程目录、官方教程）直接 fetch 核实，fetch 不花额度；只有找不到时才用 `python -I scripts/research_tool.py search "<query>"`，每个节点最多 3 次。全组共用的额度用完时脚本会拒绝，那时只能靠 fetch。
- 不要自己另写调用 Tavily 的脚本，也不要读 API key；所有查找都走 `scripts/research_tool.py`（命令都在项目目录下运行）。
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
