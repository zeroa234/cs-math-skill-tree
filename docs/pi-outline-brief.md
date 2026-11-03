# pi 子代理任务说明：技能节点的知识导览图（目录检索）

派活方式（主代理用）：`pi_agent`，`cwd = D:\agent`（Tavily 插件在 `D:\agent\.pi\extensions\`，cwd 设成项目目录就没有搜索工具），`load_extensions: true`，`run_in_background: true`，
prompt 只写一句：“读 `projects/cs-math-skill-tree/docs/pi-outline-brief.md`，按说明完成批次 `outline-XX`。”同时最多跑 2 个。
批次由 `python -X utf8 scripts/make_outline_batches.py` 生成。pi 只负责找来源、照抄目录、翻译标题、标出覆盖关系；主代理用 `scripts/check_outlines.py` 核对后再归档。

---

你是资料检索员。任务：给每个技能节点找一本权威教材或一门权威课程，把它的**目录（章 → 节，必要时到小节）照原样抄下来**，再对照节点简介查漏补缺，做成这个节点的“知识导览图”。
只做查找、抄录和翻译：不写代码，除了下面指定的输出文件，不新建或修改任何文件，不做任何 git 操作。

- 当前目录是 `D:\agent`，项目目录是 `projects/cs-math-skill-tree/`。下文路径都相对于项目目录；运行命令和写文件时要带上项目目录前缀，例如 `python -X utf8 -I projects/cs-math-skill-tree/scripts/research_tool.py fetch <url>`、写 `projects/cs-math-skill-tree/temp/outlines/nodes/M.3.1.json`。
- 本批任务清单：`temp/outlines/batches/<批次名>.md`。每个节点给出 id、名称、入门层、简介（要覆盖的知识点）、各层验收标准、现有学习资源和先修证据里的课程。
- 如果 `temp/outlines/nodes/<节点id>.json` 已经存在，跳过这个节点。

## 1. 选主来源（每个节点 1 个）

按优先级，有前一类就不用后一类：

1. 节点“现有英文学习资源”本身有成体系的目录（教材的章节、在线教材的目录、课程的逐讲 lecture 列表），而且内容和节点对得上 → 就用它，这样导览图和“去哪学”是同一份材料。
2. 否则找这门课的标准教材（作者主页、出版社或开放教材官网上的目录页，或作者公开的整书 / 目录 PDF），或一流大学这门课的官方课程表（每讲有具体主题，不是只写 Week 1、Week 2）。
3. 工程实践类节点（如 DevOps、供应链、云）没有公认教材时，可以用权威官方文档或规范的目录（如 SLSA 规范、Kubernetes 官方文档的概念目录、OWASP 指南）。

要求：
- 来源必须权威：大学、作者本人、出版社、开放教材官网（OpenStax、LibreTexts 等）、标准组织或项目官方站。**不要用**书店（Amazon、京东）、读书笔记、博客、网课广告页、内容农场。
- 整书 PDF 只能用作者或出版社官方公开的（开放获取、作者主页）。挂在课程网站、网盘、镜像站上的商业教材整书 PDF 多半没有授权，**不要用**，哪怕里面有目录；这种书只能用出版社或作者页面上的目录，没有就换一本书或一门课。
- 入门层是 D1/D2 的节点用本科教材或本科课程，不要用研究生专著；入门层 D3/D4 的节点可以用研究生教材或课程。
- 节点很窄（例如“海森矩阵”只是多元微积分里的一部分）时，只取相关的章，往下抄到节甚至小节；如果主来源在这个主题上只有一两个小节，换一份结构更细的来源（课程讲义的分节标题、开放教材的小节）。
- 同一批里相邻节点常用同一本书：目录抓一次，按节点分章即可，不用重复检索。

## 2. 抄目录

- 目录必须来自你**亲自打开过**的页面：用 `python -X utf8 -I scripts/research_tool.py fetch <url>` 读（免费，有缓存；整书 PDF 也能读出正文，目录一般在前几页；长目录用 `--start N` 往后翻，或 `--grep "Chapter|^\d+\.\d+"` 只看匹配行）。
- fetch 打不开或读不到正文（JS 渲染页面、被拦截）时，用 `python -X utf8 -I scripts/research_tool.py extract <url>`（花 1 个 Tavily 额度，结果同样缓存）。**不要用 `tavily_extract` 工具**：它的结果不进缓存，主代理没法核对。
- 不知道目录页地址时可以用 `tavily_search` 找（每个节点最多 2 次）。不要用 `research_tool.py search`，不要自己写调用 Tavily 的脚本，不要读 API key。
- `title` 一字不改地抄原文（大小写、标点照抄，去掉页码和前导点）。`ref` 抄原文里的编号（如 `3`、`3.2`、`Lecture 7`、`Part II`），原文没有编号就留空字符串。
- PDF 提取常把词拆开或留下连字（`V olumes`、`Deﬁnite`、`Lin- ear`）：写正确拼写（`Volumes`、`Definite`、`Linear`）。核对脚本会忽略大小写、空格、标点和连字，正确拼写照样能对上。
- 只收和节点相关的章；习题、参考文献、附录、索引、前言不收。主来源里与节点无关而没收的章，在 `omitted` 里用一句话说明。
- 规模：一般 4–15 个分支（章）、15–80 个叶子（节）。目录本身更大时，保留和节点简介相关的部分。

### 已知的坑（2026-11-01 两轮检索总结）

- MIT OCW：`/resources/...pdf` 和带尾斜杠的部分页面会 301 循环；先 `curl -s -A "Mozilla/5.0" <页面> | grep -o 'href="[^"]*"'` 找到真实地址，再用 research_tool 打开。Calendar 页有的是前端渲染（只有表头），改读 Lecture Notes / Readings 页。
- 出版社目录：Springer 书页只有章，前置页 PDF（`link.springer.com/content/pdf/bfm:<ISBN>/1`）有完整章节目录；Pearson 产品页会截断，官方目录或样章 PDF（`ptgmedia.pearsoncmg.com`、`pearson.de`）更全；出版社页打不开时，美国国会图书馆编目页 `catdir.loc.gov`（注明“目录数据由出版社提供”）可用。
- 整书 PDF 超过 60 MB（如 Sutton & Barto 2nd ed. 约 73 MB）读不了；research_tool 只抽前 400 页。
- 讲义是白板扫描、幻灯片没有议程页、放在网盘或需要登录的，都抄不出节标题，不要硬凑。

## 3. 翻译

每个英文标题配一个中文译名 `zh`：用国内教材的标准术语，简洁，不加解释（例：`Eigenvalues and Eigenvectors` → `特征值与特征向量`，`Rank-Nullity Theorem` → `秩-零化度定理`）。原文就是中文时不写 `zh`。专有名词（算法名、协议名、人名定理）可以保留英文，如 `TCP Congestion Control` → `TCP 拥塞控制`。

## 4. 查漏补缺

- 把节点简介按顿号/逗号拆成知识点，逐个写进 `coverage`：它出现在导览图的哪些章或节（用 `来源key:ref` 表示，例如 `A:5`、`A:5.2`；ref 为空的条目用 `来源key:#序号`，序号从 1 数起，指该来源在 `outline` 里的第几个分支）。
- 同一来源在不同章重复使用节号时，引用完整的原章/节路径，如 `B:10/2.1`，避免与第 14 章的 2.1 混淆。教材真实的 `#10` 等编号优先于备用的分支序号。技能自身的 `number` 与覆盖的 `sections` 由构建生成，不能拿它们改写教材 `ref`。
- 主来源没覆盖的知识点：找第二个权威来源（同样要求，同样亲自打开过），把对应的章节作为**补充分支**加进 `outline`，`src` 写这个来源的 key（B、C…），并写 `fill`：补的是哪个知识点。补充分支同样照原文抄。
- 两个来源都没有专门章节的知识点，`refs` 留空，在 `note` 里写清楚（不要硬凑）。

## 硬性规则

- 不许编造。每个 `toc_urls` 里的网址都必须用 research_tool 打开过，每个 `title` 都必须能在那个页面的文字里找到（主代理会用脚本逐条比对，对不上的条目会被删掉）。
- 临时文件只能放 `temp/research/scratch/`，不要用 /tmp，也不要写 C 盘。
- 每完成一个节点，立刻写一个文件 `temp/outlines/nodes/<节点id>.json`。不要攒到最后一次性写，也不要一次生成特别长的输出；目录很长时先写前半，再用编辑工具补后半。
- 写完立刻自查：`python -X utf8 -I projects/cs-math-skill-tree/scripts/check_outlines.py <节点id>`。它报 `missing` 的标题、`!` 开头的问题都要改掉（重新打开原页面核对，找不到就删掉那条），直到 missing 为 0、没有 `!` 行。

## JSON 格式（UTF-8）

```json
{
  "id": "M.3.1",
  "sources": [
    {"key": "A", "kind": "book|course|notes|docs", "title": "Introduction to Linear Algebra, 6th ed.", "by": "Gilbert Strang",
     "year": 2023, "url": "给读者打开的主页或课程页", "toc_urls": ["实际抄目录的页面，可以有多个"],
     "why": "一句话：为什么选它（权威性、与节点的匹配）"},
    {"key": "B", "kind": "course", "title": "", "by": "", "year": 2024, "url": "", "toc_urls": [""], "why": "补哪个知识点"}
  ],
  "outline": [
    {"src": "A", "ref": "1", "title": "Introduction to Vectors", "zh": "向量导论",
     "items": [{"ref": "1.1", "title": "Vectors and Linear Combinations", "zh": "向量与线性组合"}]},
    {"src": "B", "ref": "Lecture 21", "title": "", "zh": "", "fill": "补的是哪个知识点", "items": []}
  ],
  "coverage": [
    {"topic": "向量空间", "refs": ["A:3", "A:3.1"]},
    {"topic": "某知识点", "refs": [], "note": "为什么没有"}
  ],
  "omitted": "主来源里没收的章及原因",
  "notes": "其他需要主代理知道的情况"
}
```

`items` 里的条目也可以再带 `items`（第三层小节），只在节点很窄、需要细到小节时用。

全部节点完成后，最终回复只写三点：完成了哪些 id；哪些节点没找到合适的目录或有知识点没覆盖；遇到了什么问题。不要在最终回复里重复 JSON。

---

## 第二轮：加深或换源（批次名 `deepen-N`）

第一轮有些导览图只有一层（课程只列了讲次，没有讲内小节），或者用了不该用的来源。第二轮的批次清单 `temp/outlines/batches/deepen-N.md` 在每个节点后写了“本轮要做的”。这一轮**要修改已有文件** `temp/outlines/nodes/<节点id>.json`（不要跳过已存在的文件），其余规则与第一轮相同。

对“目录太平”的节点，按顺序尝试，做到一种就停：

1. 同一门课的官方讲义 / 幻灯片 / 讲义 PDF 在课程站上能打开：把每讲里的节标题作为该分支的 `items`（用 research_tool 打开每份讲义，PDF 也能读）。
2. 讲义打不开或没有节标题：换一本这门课的标准教材（作者主页、出版社、开放教材官网上的目录，必须是章 → 节两层），作为新的主来源 A；原来的讲次列表如果还能补主来源没有的知识点，保留为补充分支（改成 B、C…，写 `fill`），否则删掉。
3. 都做不到：保持原样，在 `notes` 里写清楚试过哪些来源、为什么不行。

改完后同样更新 `coverage`，并跑 `check_outlines.py <节点id>` 直到 missing 为 0、没有 `!` 行。
最终回复写：每个节点用了上面哪种做法（1/2/3）、加深后有多少分支和叶子；没能加深的原因。
