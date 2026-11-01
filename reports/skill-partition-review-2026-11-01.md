# 技能划分检查与处理（201 → 196 → 192）

2026-11-01，v1.3.0。当前以 `data/curation/partition.json`、`granularity.json` 与构建结果为准，原始星图只读。

## 当前结果

原先留下的两项工作已经落实：全部技能都做了粒度桌审；先修表中没有 draft 项。**192 个学习单元，260 条必须前置、400 条推荐前置，121 个主干、71 个选修。**

“核实”不代表各学校都要求同样的先修，也不代表存在一套唯一正确的知识划分。每条必须连线还要说明为什么入门内容需要它；推荐背景、课程注册条件和概念上的必需应当分开。

## 本轮怎么处理

| 原项 | 处理与理由 |
|---|---|
| D.3.3 评估与可复现分析 | 并入 D.3.1 数据科学导论，作为数据生命周期里的入门方法；不是把一门研究方法课完整拼进去 |
| F.1.3 图与字符串算法 | 并入 F.1.2 算法分析与设计，作为设计范式的应用；高级索引理论不是入门门槛 |
| D.2.1 管线、C.4.4 消息与流处理 | 并入 D.2.2 数据工程与大数据处理，用端到端数据流程统一，协议级分布式理论另属 C.4.1 |
| P.5.4 软件供应链 | 并入 P.5.3 的发布流程，只取依赖锁定、制品、溯源、SBOM 入门 |
| M.6.4 时间序列与排队论 | 拆为时间序列分析与新增 M.6.6 排队论与性能建模，各有独立课程；统计预测与到达/服务过程不是一个目标 |
| M.1.9 | 收窄为傅里叶分析，移除一般调和分析和独立小波课程的必备要求 |
| M.4.4 | 收窄为计算几何；曲面处理转作图形学进阶材料 |
| M.4.5 | 收窄为拓扑数据分析，不混同几何深度学习 |
| M.7.6 | 收窄为博弈论，效用与序贯选择只在策略互动语境下学习 |
| A.2.5 | 收窄为联邦学习；普通迁移/多任务/元学习作为网络表示学习的延伸，深度学习不再是联邦入门硬门槛 |
| S.2.3 | 收窄为移动应用与设备安全，无线链路安全归 S.2.2 |
| H.2.2 | 收窄为硬件设计验证，综合与布局布线归 H.2.4 |
| I.2.2 | 收窄为技术沟通与写作，研究设计归 I.2.3 |
| X.2.2 | 收窄为计算金融，移出支付/账本系统工程 |
| D.2.3、P.5.2、C.3.4 | 分别改名搜索与信息检索系统、移动应用开发、SDN与可编程网络，名称与实际学习范围对齐 |
| H.1.3 | 收窄为信号与系统；完整 DSP 算法设计与定点实现改为选读 |
| H.3.4 | 收窄为实时系统；危害分析与行业认证改为安全关键应用选读 |
| V.1.3 | 收窄为物理与可微渲染；CMU 确有一讲物理仿真，但不等同完整物理动画课 |

相邻技能在页面“划分依据”里说明边界，例如 GPU 硬件与 GPU 编程、数据库使用与内核、语言语义与函数式实践、深度学习基础与架构专题。

## 如何处理之前的 9 个待核实项

- F.2.4、D.1.5、S.2.4、S.5.2、H.4.4、I.2.3、X.2.4：补官方课程及准确先修说明。没有统一技术门槛的治理/研究规范课程不强造必须前置。
- C.4.4、P.5.4：不再作为独立技能，而是宿主课程中的入门内容；不是凭空给它们找一门同名课。
- 对 26 条缺少直接 required 映射的连线另做逐条复核，保留同课顺序/先修链的完整来源；删除错误链条。硬件安全的 HDL 背景、推荐系统的多元微积分降为推荐；SciML 改用官方明确要求的求导基础，积分仅推荐。记录在 `data/curation/prereq-audit.json`。
- `check_prereqs.py` 不再接受 recommended、candidate_check 或随手写的 extra_prereqs 作为必修证明。3 个反例回归测试防止再次误报清零。脚本只校验记录完整性与分类，原文是否真的支持判断仍需人工阅读。

## 粒度规则与例外

以共同学习目标组织成课程规模的单元；允许能独立学习和考核、供后续反复使用的基础模块，以及建立在基础课之上的进阶模块。**不声称所有卡片等学分、等课时或等难度。**目录写得细、知识点多，不自动代表课程更大。

当前是 **175 个课程单元、9 个基础模块、5 个进阶模块、3 个教材单元**，类型和依据都可在页面查看。此前“约半门课”仅是筛查线索，不是跨学校统一的学时硬阈值；基础门槛模块明确标出，不冒充完整课程。

没有机械采纳检索结果。例如：

- 网络架构与表征约占 CMU 深度学习课一半主题，保留为进阶模块；“没有同名独立课程”本身不能否定半课程模块。
- Waterloo CS466/666 直接把随机化、近似、在线算法组织成一门高阶算法课，因此 F.1.4 保留比较这些算法保证的入门范围。
- Waterloo CS742 的课纲支持分布式数据库；Warwick PH345-15 有 10 周可计算性课程，不能因为它们在综合课里只占几讲就合并掉。
- Ensign IT324 支持 SOC 运营的课程规模，RIT CSCI531 支持安全测量的独立教学建制。历史课程仅用于范围/规模证据，不作为当前实践的唯一教材。

## 学习资源与实际限制

改动技能的中英文入口按免费正文、官方/作者公开视频、付费备选重新检查。保留的资源重写学习范围，而非为了“重找”更换同样的链接。

- 傅里叶分析改用 Stanford EE261 的完整讲义和逐讲文本；TDA 改用 ETH 2026 完整讲义；技术沟通改用 BCcampus 开放教材。
- UMBC 硬件验证课虽公开课表，讲义实为 PageCrypt 密码页；已纠正“全部免费”误标，改用 Accellera UVM 官方 PDF 和 YosysHQ SBY 教程。
- 主资源没覆盖的内容在“补充材料”里提供可点击链接：实验记录、字符串与图算法、流处理语义、供应链、形式验证等。
- 中文移动安全与芯片验证的免费视频只覆盖部分内容，另列出版社可核的正版付费教材；未购买。技术写作的补充课程讲解和字幕语言未核对，不标成已确认的中文授课。
- 中文讲授、中文字幕、自动字幕和英文 transcript 分开记录；没核实的字幕写“未核对”。MOOC 当前旁听和视频访问条件未登录核验，不能保证每个入口在每个地区都免费可看。
- 新课程的未来课表不当作已发布录像：Aalto 2027 录像待发布，学习入口使用已公开教材、slides 与 2025 录像。

## 验收与历史

本轮重组了练习和导览，实际运行修正后的 ETL 答案，验证重跑不会重复追加其他日期；验算 FedAvg、非 IID 二次目标、计数器复位/饱和、排队模型、KMP 和统计量。构建、范围和严格先修检查均通过。

最终页面验证：192 张导览图与 192 个资源面板通过；旧进度导入/导出、目标映射及旧链接兼容通过。最后三项范围收窄后复查 4 张受影响导览与全部资源面板，并重跑无障碍检查：15 个状态 0 违规，键盘流程通过。离线包逐字节与网页源文件比对，实际解压后在 Edge 验证导览、两本付费备选及旧链接跳转，页面脚本错误 0。

全树目录核对：1,833 个分支、8,411 个叶子、10,280 条精确匹配与 11 条 PDF 抽字近似，0 缺失。12 个覆盖项没有专门章节（含定位/验收说明），仍按“—”显示，未伪造来源。标题命中不等于整本教材都适合所有学习者。

早一轮 201→196 的变更：合并多元微分的小碎块、合并多元积分/向量分析、合并嵌入式/边缘 AI 和 Java/OOP，收窄 MARL、地理空间、参数化/细粒度复杂度，移除代数几何/表示论拼接，新增游戏开发。当前 196→192 是五次合并减 5、一次拆分加 1。

宣传片与封面仍是最初 201/278 的历史版本。旧学习进度采用保守迁移，无法辨认部分历史版本的未标记记录会要求重新确认，原记录随导出保存；旧技能链接自动转到合并后的页面。

## 逐技能判定

以下是全部 192 个技能，完整证据、边界和最终判断在 `data/curation/granularity.json`。这是全量桌审并对疑点定向深查，复用已有已归档来源；不宣称重新逐页阅读了所有课程的全部教材。

| 技能 | 单元 | 依据与边界 |
|---|---|---|
| M.1.1 极限与连续 | 基础模块 | [OpenStax Calculus Volume 1, Ch.2 Limits and Continuity（配 MIT 18.01SC 作为课程侧对照）](https://openstax.org/books/calculus-volume-1/pages/2-introduction)；不是整门课：27/80≈34%，工程微积分里只有 16/80=20%；肇庆那份大纲刚过一半。保留依据是它属于规则允许的『可独立学、独立考的必修先修模块』（M.1.2 的硬门槛），而不是把目录标题当课时。旧深查留的不确定处仍在：没有取到美国课程周次表（MIT 18.01SC 的 calendar 页 301 重定向），所以『一学期制微积分里占比更小』这句只能用三江学院这类工程微积分（16/80）间接支持，不是直接证据。 |
| M.1.2 一元微分学 | 基础模块 | [MIT OpenCourseWare 18.01SC Single Variable Calculus](https://ocw.mit.edu/courses/18-01sc-single-variable-calculus-fall-2010/)；半门课规模，按规则保留。它和 M.1.3 合起来才是一门完整的 18.01/高等数学上册——这正是『允许半课程』要表达的形态，不建议再合并（会得到一门 8 学分的大课，导览与考核都做不细）。 |
| M.1.3 一元积分学 | 基础模块 | [OpenStax Calculus Volume 2, Ch.1 与 Ch.3（配 MIT 18.01 积分单元）](https://openstax.org/books/calculus-volume-2/pages/1-introduction)；半门课，保留。它在树上被 10 个技能当作必修或推荐先修（M.1.4.4/M.1.6/M.1.9/M.2.1/M.6.1/M.8.2 及 C.3.1/H.1.1/H.1.3/X.3.3），是连通性最强的地基之一，单独成节点有实用理由。 |
| M.1.4.1 多元微分学 | 基础模块 | [OpenStax Calculus Volume 3, Chapter 4 Differentiation of Functions of Several Variables](https://openstax.org/books/calculus-volume-3/pages/4-introduction)；半门课（18.02 的前半），保留。16 个分支/24 项是资源目录的细度，不是课时；不要按这个数字判它比 M.1.3 大。缺口：隐函数定理与逆函数定理 OpenStax 与 18.02 都不讲，属 D3/D4（节点已有补充来源），不影响粒度。 |
| M.1.4.4 多元积分与向量分析 | 基础模块 | [MIT OpenCourseWare 18.02SC Multivariable Calculus, Unit 3–4](https://ocw.mit.edu/courses/18-02sc-multivariable-calculus-fall-2010/)；与 M.1.4.1 合起来才是完整一门 18.02，本节点是后半（约一半），且标为选修——符合『半课程』。52 项同样是目录细度。建议树里对 M.1.4.1/M.1.4.4 使用同一句说明（『18.02 的前半/后半』），避免读者以为两者规模不同。 |
| M.1.5 无穷级数 | 基础模块 | [OpenStax Calculus Volume 2, Ch.5–6 Sequences and Series / Power Series](https://openstax.org/books/calculus-volume-2/pages/5-introduction)；约 1/4–1/3 门课，是 M 域『半门课』线以下的一档，但它是可独立学、独立考的完整模块（判敛→幂级数→Taylor 是一条闭环），且 M.1.8 复分析的必需前置。按规则保留；若以后把标准收紧成『必须整门课』，它和 M.1.1 会是最先要合并的两项（并入 M.1.3/M.1.2 那一门微积分）。 |
| M.1.6 实分析 | 课程单元 | [MIT OpenCourseWare 18.100A Real Analysis（Fall 2020）](https://ocw.mit.edu/courses/18-100a-real-analysis-fall-2020/)；整门课（本科）。它不含 Lebesgue 测度/积分——那是一门独立的研究生课（M.1.6.1，MIT 18.125），所以两层不是同课的两半，不需要合并。简介里『积分理论』指的是 Riemann 积分，建议写清楚，免得读者以为这里是测度论。 |
| M.1.6.1 测度论与Lebesgue积分 | 课程单元 | [MIT OpenCourseWare 18.125 Measure and Integration（Fall 2003）](https://ocw.mit.edu/courses/18-125-measure-and-integration-fall-2003/)；整门课（研究生层，D3/D4 定位相符）。原图给的前置只有实分析 M.1.6，两门课都只写实分析，没写集合论——所以 M.5.1 不是这条的必要前置，别因为『σ 代数要用集合』就加边。 |
| M.1.7 泛函分析 | 课程单元 | [MIT OpenCourseWare 18.102 Introduction to Functional Analysis（Spring 2021）](https://ocw.mit.edu/courses/18-102-introduction-to-functional-analysis-spring-2021/)；整门课。18.102 同时把线性代数（18.06/18.700/18.701）与实分析（18.100）写成必修先修，正好对上树里 M.3.1+M.1.6 两条边。 |
| M.1.8 复分析 | 课程单元 | [MIT OpenCourseWare 18.04 Complex Variables with Applications（Spring 2018）](https://ocw.mit.edu/courses/18-04-complex-variables-with-applications-spring-2018/)；整门课（应用型入门；18.112 是更严格的同主题课，先修 18.100B，可作 D4）。78 项导览是资源目录细，不是课时。 |
| M.1.9 傅里叶分析 | 课程单元 | [Stanford SEE EE261: The Fourier Transform and its Applications](https://see.stanford.edu/Course/EE261)；从原名删去一般调和分析，小波与局部紧群研究不再是本单元必备。 |
| M.2.1 常微分方程 | 课程单元 | [MIT OpenCourseWare 18.03SC Differential Equations（Fall 2011）](https://ocw.mit.edu/courses/18-03sc-differential-equations-fall-2011/)；整门课。18.03 官方把 18.01 写成必修先修，所以 M.1.3 这条边是课程原文支持，不是按内容推测。简介里的『稳定性与数值求解』在课内有对应小节，不构成超范围。 |
| M.2.2 偏微分方程 | 课程单元 | [MIT OpenCourseWare 18.303 Linear Partial Differential Equations: Analysis and Numerics（Fall 2014）](https://ocw.mit.edu/courses/18-303-linear-partial-differential-equations-analysis-and-numerics-fall-2014/)；保留偏微分方程课程。入门以三类线性方程、边值问题和解析/数值方法为主；弱解与适定性是进阶层，导览已有 Olver 与 Ivrii 补充来源，不把研究生理论整体算作入门要求。 |
| M.2.3 动力系统与混沌 | 课程单元 | [MIT OpenCourseWare 18.353J Nonlinear Dynamics I: Chaos（Fall 2012）](https://ocw.mit.edu/courses/18-353j-nonlinear-dynamics-i-chaos-fall-2012/)；整门课，保留。证据质地偏弱（没有公开讲义，导览只能靠 Strogatz 章目），所以它是 M2 里『课程存在但不能免费读完』的一项；不影响粒度判断。 |
| M.2.4 变分法与最优控制数学 | 课程单元 | [MIT OpenCourseWare 16.323 Principles of Optimal Control（Spring 2008）](https://ocw.mit.edu/courses/16-323-principles-of-optimal-control-spring-2008/)；整门课（研究生层，节点 D3 入门可接受）。工程控制语境而非纯数学——树里没有别的『最优控制』节点，保留不重复。更纯数学的变分法材料只找到无法核先修原文的讲义 PDF，已按规则不采用。 |
| M.3.1 线性代数 | 课程单元 | [MIT OpenCourseWare 18.06 Linear Algebra（Spring 2010）](https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/)；整门课。两校口径不同（MIT 18.06 要 18.02，多伦多只要高中微积分），所以 M.1.4.1 这条 required 是『更稳妥』的课程口径，不是普遍要求——节点 notes 已这么写，保留。 |
| M.3.2 矩阵理论与矩阵分析 | 课程单元 | [MIT OpenCourseWare 18.065 Matrix Methods in Data Analysis, Signal Processing, and Machine Learning（Spring 2018）](https://ocw.mit.edu/courses/18-065-matrix-methods-in-data-analysis-signal-processing-and-machine-learning-spring-2018/)；保留线性代数之后的矩阵分析课程。入门以范数、SVD、正定性和低秩方法为主；矩阵函数与完整扰动理论是延伸，当前主资源不完整覆盖，矩阵函数仍在导览如实标缺。 |
| M.3.3 张量代数与多重线性代数 | 进阶模块 | [Euclidean Tensor Analysis — Tensor Algebra 章（Amuthan A. Ramabathiran, IIT Bombay）](https://amuthan.github.io/tensors-intro/tensor_algebra/)；两条证据要打折，是 M 域里证据最薄的一项：(1) 节点原来引的 Rutgers 01:640:495『Multilinear Algebra and Tensor Networks』分节，本次打开课程目录页只写 'Topics and prerequisites vary'，Spring 2027 两个分节是『拓扑量子计算』与『欧氏距离几何』——同名分节已不可核对，不能再作为课程证据；(2) 简介里的『张量分解（CP/Tucker）』在这份教材与 Ivo Terek 小课里都没有。结论：按『独立先修模块+教材』保留（目标明确、可独立学与考，且已标选修），basis 记 module 而不是 course；建议把『张量分解』从简介移到 D4 并引 Kolda–Bader 综述（本批未核）。若要求必须有现行课程证据，这是唯一一项应回退成 uncertain 的。 |
| M.3.4 代数结构与抽象代数 | 课程单元 | [MIT OpenCourseWare 18.703 Modern Algebra（Spring 2013）](https://ocw.mit.edu/courses/18-703-modern-algebra-spring-2013/)；整门课。名称里『代数结构与抽象代数』是同一门课的两个叫法，不是两门课。表示论只在简介里作 D4 指路，没有课程证据也不该有——保留。 |
| M.3.5 数论 | 课程单元 | [MIT OpenCourseWare 18.781 Theory of Numbers（Spring 2012）](https://ocw.mit.edu/courses/18-781-theory-of-numbers-spring-2012/)；整门课。简介尾部『代数数论与解析数论专题』超出该课（属 D4）；另外两校前置口径差别很大（MIT 无正式前置，多伦多要线代+多元微积分+证明课），树里 required=M.5.3 取的是后者，注释已说明。 |
| M.4.1 向量代数与解析几何 | 课程单元 | [肇庆学院《解析几何》教学大纲（课程代码 03405303，56 学时/3 学分）](https://maths.zqu.edu.cn/__local/0/D6/46/153ADC63B683E11BFD2990A6EA6_E8E77986_3AEB3.pdf)；保留向量代数与解析几何课程：中国高校有独立必修课，其他学校也可能合在微积分中。与线性代数共享向量工具，但目标是几何对象、坐标与曲面；只需初等数学，不强加微积分门槛。 |
| M.4.2 微分几何 | 课程单元 | [MIT OpenCourseWare 18.950 Differential Geometry（Fall 2008, Paul Seidel）](https://ocw.mit.edu/courses/18-950-differential-geometry-fall-2008/)；保留微分几何课程，以曲线曲面及其曲率为入门。一般流形、度量与联络是纵向进阶内容；导览采用 Ghomi 的课程讲义，不能仅据 MIT 曲面课断言所有进阶主题均已免费覆盖，也不把微分几何等同拓扑学。 |
| M.4.3 拓扑学 | 课程单元 | [MIT OpenCourseWare 18.901 Introduction to Topology（Fall 2004, James Munkres）](https://ocw.mit.edu/courses/18-901-introduction-to-topology-fall-2004/)；保留拓扑学课程。点集拓扑是入门主线，基本群与同调只作后续方向，不把代数拓扑整门课拼成同一个点亮要求。 |
| M.4.4 计算几何 | 课程单元 | [UMD CMSC754: Computational Geometry](https://www.cs.umd.edu/class/fall2023/cmsc754/)；曲面光顺/参数化/重网格化转作图形学进阶材料，不拼成同一个目标。 |
| M.4.5 拓扑数据分析 | 课程单元 | [ETH Zürich Introduction to TDA, FS2026](https://ti.inf.ethz.ch/ew/courses/TDA26/Script.pdf)；收窄为 TDA，几何深度学习不再以同一技能点亮。 |
| M.5.1 集合论 | 课程单元 | [UCLA Math 114S Introduction to Set Theory 课程笔记（Winter 2022，托管在作者 Berkeley 目录）](https://math.berkeley.edu/~pglutz/114snotes.html)；整门课，保留。它是 M.5.3 的下游（required=M.5.3），别反过来把集合论当证明课的前置——两门课程目录都没这么写。资源是手写扫描 PDF，可读性一般，属资源问题不属粒度。 |
| M.5.2 数理逻辑 | 课程单元 | [forall x: Calgary — A Free and Open Introduction to Formal Logic（Open Logic Project / Richard Zach 等），配 UCSD MATH 160A 与 MIT 24.241 Logic I](https://forallx.openlogicproject.org/)；保留数理逻辑课程。模型与证明论在此限于解释、语义、自然演绎与可靠性基础；不宣称主教材提供完整模型论、证明论或不完备性课程。 |
| M.5.3 证明方法与离散结构 | 课程单元 | [MIT OpenCourseWare 6.042J Mathematics for Computer Science（Fall 2010）](https://ocw.mit.edu/courses/6-042j-mathematics-for-computer-science-fall-2010/)；整门课。与 M.5.4/M.5.5 有内容重叠（图论基础、计数），那是入门课的正常覆盖，不构成重复技能；不要把 6.042J 拆成『证明』和『离散结构』两个技能。 |
| M.5.4 组合数学 | 课程单元 | [Applied Combinatorics（Mitchel T. Keller & William T. Trotter，免费开放教材），配 CU Boulder MATH 3170 Combinatorics 1 与 UCSD MATH 184 Enumerative Combinatorics](https://appliedcombinatorics.org/appcomb/)；保留组合数学课程，计数与递推为主线。组合设计由导览里的 Stinson 出版社目录单独补充，完整正文可能付费；概率方法只作入门延伸，不把 Pólya 计数误称组合设计。 |
| M.5.5 图论 | 课程单元 | [Combinatorics and Graph Theory（David Guichard, Whitman College，免费在线教材）](https://www.whitman.edu/mathematics/cgt_online/book/)；保留图论课程。Guichard 负责基础图论，导览的 Diestel 补网络流、Spielman 免费讲义补谱图；主资源不覆盖的内容已分来源说明，不能把 Hall 匹配当作完整网络流。 |
| M.6.1 概率论 | 课程单元 | [Introduction to Probability, Statistics, and Random Processes（Hossein Pishro-Nik, probabilitycourse.com）](https://www.probabilitycourse.com/)；整门课（开放教材+课程）。测度化表述属 D4，本资源不含；这也是树里 M.1.6.1 与 M.6.1 只做 related 不做先修的原因之一，保持现状。 |
| M.6.2 数理统计 | 课程单元 | [STAT 415: Introduction to Mathematical Statistics（Penn State, OER）](https://online.stat.psu.edu/stat415/)；保留数理统计课程；此处决策限于估计损失、检验的势与错误权衡，不等同完整统计决策理论课程。 |
| M.6.2.1 贝叶斯统计 | 课程单元 | [An Introduction to Bayesian Thinking（Merlise Clyde 等, Duke, StatsWithR 免费在线书）](https://statswithr.github.io/book/)；保留贝叶斯统计课程。主材料覆盖先验、后验、计算和比较；一般层级/多层模型属于进阶范围，当前主材料不完整覆盖，不作为入门点亮门槛。 |
| M.6.2.2 回归与统计建模 | 课程单元 | [An Introduction to Statistical Learning（ISLR/ISLP 2nd ed., James/Witten/Hastie/Tibshirani）](https://www.statlearning.com/)；整门课。残差诊断与不确定性的处理散在各章推断段与 lab 里，不如专门回归诊断教材系统；这是资源深度问题，不影响粒度。 |
| M.6.2.3 实验设计与因果推断 | 教材单元 | [Causal Inference: The Mixtape / The Remix（Scott Cunningham, Baylor）](https://mixtape.scunning.com/)；保留，但要把『实验设计』理解窄一点：这本书只到『潜在结果+随机化』这一层，因子设计/区组/功效分析这类经典 DOE 理论没有专门章节（真正讲 DOE 的是另一门课 MATH 181F）。所以本技能的共同目标是『识别因果效应：随机化设计 + 观测数据的识别与估计』，作为一门课规模的单元成立（作者本人的课就用这本书），但简介应写明 DOE 只到随机化设计。可选节点、30 项导览，规模与相邻统计技能一致。 |
| M.6.2.4 高维统计与统计学习理论 | 课程单元 | [36-708 Statistical Methods for Machine Learning（Larry Wasserman, CMU）](https://www.stat.cmu.edu/~larry/=sml/)；一门课同时覆盖『高维统计』（稀疏性/高维估计）与『统计学习理论』（风险界/minimax 下界），所以名称里的『与』有依据，不是拼课。集中不等式没有单独章节（散在复习与 minimax 讲义里），属资源深度。 |
| M.6.3 随机过程 | 课程单元 | [STAT 150: Stochastic Processes（David Aldous, UC Berkeley）](https://www.stat.berkeley.edu/~aldous/150/)；保留随机过程课程。平稳性是随机过程的基本性质；长篇时间序列建模另属 M.6.4，鞅与 Brown 运动的深入理论不全部作为入门门槛。 |
| M.6.3.1 马尔可夫链 | 课程单元 | [UCSD MATH 180C Introduction to Stochastic Processes II（4 units）](https://catalog.ucsd.edu/courses/MATH.html)；两种建制并存：UCSD 180C 名为『随机过程 II』，内容实际就是马尔可夫链（旧深查判为整门课），中国高校里它只是随机过程课的一章。保留成立，但『整门课』这个判断要打折：180C 其余内容写着 'If time permits'，而且它没有混合时间/mixing（D4）。这是本节点残余的不确定处，已在 evidence 里留原文。 |
| M.6.3.2 随机微积分与随机微分方程 | 课程单元 | [Stochastic Calculus 讲义（Russell Lyons, Indiana University，依 Le Gall 组织），课程侧为 UCSD MATH 286 / UW STAT 493](https://rdlyons.pages.iu.edu/pdf/StochCalc.pdf)；整门课（研究生/D4 定位）。资源是讲义 PDF 而非课程主页，这是资源档次问题；先修侧 M.1.6.1 与 M.6.3 两条边都有课程原文支持，保留。 |
| M.6.4 时间序列分析 | 课程单元 | [Forecasting: Principles and Practice, 3rd ed.（Hyndman & Athanasopoulos, OTexts）](https://otexts.com/fpp3/)；时间序列的统计建模与预测；到达/服务过程性能模型归 M.6.6。 |
| M.6.5 信息论与编码理论 | 教材单元 | [Information Theory, Inference, and Learning Algorithms（David J. C. MacKay, CUP 2003）](https://www.inference.org.uk/itila/)；一本书同时讲信息论与纠错码（推荐语明确到 LDPC），所以名称里的『与』有教材级依据；『信息论与编码』本身也是常见的单门课名。两点如实标注：(1) 我没能拿到该书目录逐章核对编码部分（book.html 只有下载链接，booktext.txt 404），所以编码那一半是按推荐语与项目内已核 covers 判断的，不是逐章核过；(2) 美式课程常把它分成两门（信息论 / 纠错码），若要求『单一课程』证据，这条只能算教材级；(3) 率失真不是该书主线，简介里这一项偏弱。可选节点。 |
| M.7.1 优化建模与运筹基础 | 课程单元 | [Applied Mathematical Programming（Bradley/Hax/Magnanti，MIT 15.053 官方在线参考书）](https://web.mit.edu/15.053/www/AMP.htm)；整门课（本科）。名称里的『运筹基础』看上去很广，但简介的六项（目标与约束、线性规划、对偶、灵敏度、网络优化、资源配置）都能收敛到这一门课，属于『名称广、入门课可收敛』的合格情况，不需要拆分。书是 1977 年版，例子偏老，但覆盖与节点简介逐条对应，作为免费课程资源可用。 |
| M.7.2 凸优化 | 课程单元 | [EE364a: Convex Optimization I（Stephen Boyd, Stanford）](https://web.stanford.edu/class/ee364a/)；整门课。近端方法只部分涉及（EE364b 更全），属 D4 缺口；不影响粒度。 |
| M.7.3 非凸优化 | 课程单元 | [MIT OpenCourseWare 6.252J Nonlinear Programming（Spring 2003, Bertsekas）](https://ocw.mit.edu/courses/6-252j-nonlinear-programming-spring-2003/)；保留非凸优化课程，以一般非线性规划和最优性条件为主。鞍点逃逸与复杂性是后续专题，不能把课程简介未单列这些词当成已经提供完整专题材料。 |
| M.7.4 随机优化 | 课程单元 | [ELE522: Large-Scale Optimization for Data Science（Yuxin Chen, Princeton）](https://yuxinchen2020.github.io/ele522_optimization/)；课程规模（研究生课，讲义全公开）。缺口：随机规划（scene/SAA）与 Robbins–Monro 经典处理不在讲义列表里，简介里『随机规划』偏弱；该课页没有 Prerequisites 段，先修只能靠 173B 的目录——这是节点 notes 里已记的诚实缺口，不是粒度问题。 |
| M.7.5 离散与组合优化 | 课程单元 | [MIT OpenCourseWare 15.083J Integer Programming and Combinatorial Optimization（Fall 2009, Bertsimas & Schulz）](https://ocw.mit.edu/courses/15-083j-integer-programming-and-combinatorial-optimization-fall-2009/pages/syllabus/)；这一条把旧深查（temp/research/granularity/M.7.5.json）留下的不确定处解决了：当时只找到综合优化课（M.7.5 在 MIT 15.053 里只占 L10–L17 共 8/23 讲≈35%，北工大《运筹学Ⅴ》里不到 1/10），所以写明『不能断言存在以组合优化为名的独立课』。15.083J 就是这样的整门课（25 讲、独立考核、讲义公开），故保留成立，且不再是『半门课』。注意它是研究生层：D4 有支撑，D2 入门偏难，可选节点，与 M.7.1（运筹建模）分工清楚。 |
| M.7.6 博弈论 | 课程单元 | [Yale ECON159: Game Theory](https://oyc.yale.edu/economics/econ-159)；效用和序贯选择限定于博弈，不要求另一门一般决策理论。 |
| M.8.1 误差、稳定性与数值线性代数 | 课程单元 | [MIT OpenCourseWare 18.335J Introduction to Numerical Methods（Spring 2019）](https://ocw.mit.edu/courses/18-335j-introduction-to-numerical-methods-spring-2019/)；整门课。名称里的三项（误差、稳定性、数值线性代数）都是同一门课的内容，不是三个技能拼起来；不要因为它有顿号就拆。 |
| M.8.2 插值、逼近与数值积分 | 进阶模块 | [MIT OpenCourseWare 18.330 Introduction to Numerical Analysis（Spring 2012）](https://ocw.mit.edu/courses/18-330-introduction-to-numerical-analysis-spring-2012/)；『约半门课』，按允许半课程的规则保留；它是 M8 里最依赖这条线的一项。若以后把标准收紧成『必须整门课』，最自然的是它与 M.8.3 合并成『数值分析』一门（两课内容在 18.330/18.086 里本就交叉），而不是各自再找课。 |
| M.8.3 微分方程数值解与科学计算 | 课程单元 | [MIT OpenCourseWare 18.086 Mathematical Methods for Engineers II（Spring 2006, Strang）](https://ocw.mit.edu/courses/18-086-mathematical-methods-for-engineers-ii-spring-2006/)；保留微分方程数值解课程。时间步进、差分/有限元及稳定收敛为主体；有限体积与多物理耦合只作延伸，不把广义科学计算的全部分支都纳入点亮要求。 |
| M.8.4 蒙特卡洛方法 | 课程单元 | [21-387 / 15-327 Monte Carlo Methods and Applications（Keenan Crane & Gautam Iyer, CMU）](https://gi1242.codeberg.page/cmu-math-cs-mcm/)；整门课（本科向），是 M8 里资源最贴的一项。与贝叶斯统计的交叉只到『用 MCMC 从后验采样』的应用层，符合两个技能的边界。 |
| M.8.5 自动微分与计算图 | 进阶模块 | [MIT OpenCourseWare 18.S096 Matrix Calculus for Machine Learning and Beyond（January IAP 2023）](https://ocw.mit.edu/courses/18-s096-matrix-calculus-for-machine-learning-and-beyond-january-iap-2023/)；保留进阶模块：计算图、前/反向模式与 VJP 组成可独立考核的共同目标，18.S096 是短学期课程证据。与深度学习的交叉是反向传播实例，模块还涵盖一般可微程序；不冒充标准一学期课程。 |
| M.8.6 符号计算与计算代数 | 课程单元 | [MACM 401 Introduction to Computer Algebra（Michael Monagan, Simon Fraser University）](https://www.cecm.sfu.ca/~mmonagan/teaching/MACM401/)；保留符号计算与计算代数课程。MACM401 是主体，Gröbner 基与消元已由 Cox–Little–O’Shea 第2–3章补目录、Sage 中文教程补实践；商业教材目录公开不表示正文免费。 |
| F.1.1 数据结构 | 课程单元 | [Berkeley CS 61B Data Structures (Spring 2021)](https://sp21.datastructur.es/)；61B 也讲排序、图算法与并查集，和 F.1.2 重叠；分界写实现与不变量 vs 设计与分析即可。保留。 |
| F.1.2 算法分析与设计 | 课程单元 | [Berkeley CS 170 + MIT 6.046J（字符串部分见 Princeton COS 226）](https://ocw.mit.edu/courses/6-046j-design-and-analysis-of-algorithms-spring-2015/)；图与字符串作为算法设计的应用，不把高级文本索引理论当作入门门槛。 |
| F.1.4 随机、近似与在线算法 | 课程单元 | [University of Waterloo CS466/666: Design and Analysis of Algorithms](https://student.cs.uwaterloo.ca/~cs466/Old_courses/F15/)；保留三类算法保证的入门比较，不要求学完三门研究生专课。也有 StFX CSCI435 的同类课程可交叉核对。 |
| F.1.5 并行、外存与流算法 | 课程单元 | [NUS CS 5234 Algorithms at Scale (Fall 2019)](https://www.comp.nus.edu.sg/~gilbert/CS5234/)；这是每个子领域各讲 3 次的综述型课，所以本节点是一整门课但每块都只到导论深度；性质测试含在 Part 1。与 F.1.4 的随机化、F.1.6 的下界有少量交叉，但主体不重复。保留。 |
| F.1.6 参数化与细粒度复杂度 | 课程单元 | [UCSD CS 294-114 Fine-Grained Complexity and Algorithms (Impagliazzo) + MIT 6.890](https://cseweb.ucsd.edu/~russell/FGCA)；参数化侧：FPT 与核化（kernelization）、W 层谱在 FGCA 里只覆盖参数化问题的指数结构，不是完整参数化算法课（核化未核到）；若简介强调核化，需要补 Parameterized Algorithms 课程/教材。保留。 |
| F.2.1 形式语言与自动机 | 课程单元 | [北京工业大学《形式语言》教学大纲（40 学时 2.5 学分）+ UT Dallas CS 4384 Automata Theory](https://undergrad.bjut.edu.cn/__local/6/09/F3/7A04BD8371710EA42113A3B74DC_B7CA983D_E3011.pdf)；深查的可核对点：北工大的分章学时表在 PDF 里被压成数字串，只能确认总学时 40；UTD 是 3 学分 catalog 条目。MIT 18.404J/CS 172 是自动机加可计算性加复杂性三合一，不能用来证明本节点小。保留。 |
| F.2.2 可计算性理论 | 课程单元 | [University of Warwick PH345-15: Computability Theory](https://courses.warwick.ac.uk/modules/2023/PH345-15)；因此不因 MIT 综合理论课里只有 5 讲就把整个可计算性学科并掉。 |
| F.2.3 计算复杂性理论 | 课程单元 | [CMU 15-455 Undergraduate Complexity Theory (Spring 2017)](https://www.cs.cmu.edu/~odonnell/15455-s17/)；线路复杂度下界在 15-455 描述里只写到 circuits 模型，具体下界（如 parity 的 AC0 下界）可能在 18.405J/6.890 更深，未核到讲次。保留。 |
| F.2.4 计算逻辑与自动定理证明 | 课程单元 | [University of Iowa CS:4980 Introduction to Automated Reasoning](https://homepage.cs.uiowa.edu/~tinelli/classes/4980/Spring24/syllabus.shtml)；SAT/SMT 与自动推理算法；程序规约与验证应用归 F.3.3。 |
| F.3.1 计算范式与λ演算 | 课程单元 | [University of Michigan EECS 390 Programming Paradigms (4 credits) + course notes](https://bulletin.engin.umich.edu/courses/eecs/)；计算模型、λ 演算与语言语义；函数式软件实践归 P.1.3。 |
| F.3.2 类型系统与程序语义 | 课程单元 | [CMU 15-814 Types and Programming Languages (Fall 2021)](https://www.cs.cmu.edu/~fp/courses/15814-f21/)；子类型与依赖类型未逐一核到讲次标题；denotational semantics 在 15-814 有讲义但深度有限。保留。 |
| F.3.3 程序验证与模型检查 | 课程单元 | [CMU 15-414 Bug Catching: Automated Program Verification and Testing (Fall 2026)](https://www.cs.cmu.edu/~15414/)；程序规约与正确性分析；求解器推理基础归 F.2.4。 |
| F.3.4 证明助手与形式化数学 | 课程单元 | [CMU 21-321 Interactive Theorem Proving（Jeremy Avigad 教学页）](https://www.andrew.cmu.edu/user/avigad/teaching.html)；保留证明助手与形式化数学课程。MIT/CMU 构造逻辑支持机器检查证明，CMU 21-321 和免费 Mathematics in Lean 支持形式化数学；F.3.3 侧重程序规约与验证算法，本项侧重交互证明及证明内核。 |
| P.1.1 程序设计基础 | 课程单元 | [Harvard CS50x: CS50 Introduction to Computer Science](https://cs50.harvard.edu/x/)；零前置的根节点，粒度无争议。保留。 |
| P.1.2 面向对象程序设计 | 课程单元 | [Cornell CS 2110 Object-Oriented Programming and Data Structures](https://www.cs.cornell.edu/courses/cs2110/2023fa/)；CS 2110 后半是数据结构（与 F.1.1 重叠），但 OOP 主线完整；简介里的并发基础与构建工具只有一部分。保留。 |
| P.1.3 函数式、逻辑式与声明式编程 | 课程单元 | [CMU 15-150 Principles of Functional Programming + UW CSE 341](https://www.cs.cmu.edu/~15150/)；函数式程序的构造与测试；计算模型与语义证明归 F.3.1。 |
| P.1.4 高级程序设计 | 课程单元 | [MIT 6.102 Software Construction (Spring 2025)](https://web.mit.edu/6.102/www/sp25/)；RAII/析构与泛型元编程不是本课主线（Rust 书可补）；性能剖析只有 Reading 13 一讲，深度有限。保留。 |
| P.2.2 C/C++与底层编程 | 课程单元 | [Stanford CS107 Computer Organization & Systems](https://web.stanford.edu/class/cs107/)；C++（模板/RAII/异常）与链接在 CS107 里弱（链接由 CMU 15-213 补）；节点名里的 C/C++ 应理解为 C 为主、C++ 只到 void*/泛型。保留。 |
| P.2.3 Python与科学计算工具 | 课程单元 | [UW CSE 163 Intermediate Data Programming + Scipy Lecture Notes](https://www.washington.edu/students/crscat/cse.html)；环境管理与自动化两部分这两份材料都没有系统讲（Missing Semester 的 Command-line Environment/Packaging 可补），科学计算（SciPy）只在教程里。若要求严格，本节点更像 Python 数据编程一门课加工具箱教程；保留但建议简介弱化环境管理。 |
| P.2.4 版本控制、调试与构建工具 | 课程单元 | [MIT The Missing Semester of Your CS Education + CMU 15-131](https://missing.csail.mit.edu/)；两门都是短学期/迷你课（MIT IAP 与 CMU 工具课，学分数未核实），不是整学期正课，按独立先修模块这一档保留；如果要求整门课，本节点是证据最弱的一个（没有找到整学期讲工具链的课）。 |
| P.3.1 编译原理 | 课程单元 | [Cornell CS 4120/5120 Introduction to Compilers (Spring 2026)](https://www.cs.cornell.edu/courses/cs4120/2026sp/)；编译课通常只讲前端加优化入门，后端（JIT/GC）在 P.3.2，分界清楚。保留。 |
| P.3.2 运行时、虚拟机与内存管理 | 课程单元 | [CMU 17-470 Virtual Machines and Managed Runtimes (12 units)](https://coursecatalog.web.cmu.edu/schools-colleges/schoolofcomputerscience/courses/)；FFI 与 native 互操作不在 17-470 描述与 Crafting Interpreters 里；JIT 的深度（HotSpot/template JIT）只有 Cornell CS 6120 讨论课级别。保留。 |
| P.4.1 软件工程基础与开发方法 | 课程单元 | [CMU 17-313 Foundations of Software Engineering](https://cmu-313.github.io/syllabus/)；P.4.1 与 P.4.2–P.4.6 是总课加五个子领域专课的关系，六门课各有真实课程（RE=Chalmers DAT232、设计=CMU 17-214、架构=UQ CSSE6400、测试=GMU SWE 637、维护=UZH SME），因此不算重复；但 P.4.1 简介不要把这些子领域写成自己的主体。保留。 |
| P.4.2 需求工程与领域建模 | 课程单元 | [Chalmers DAT232 Advanced requirements engineering (7.5 credits)](https://www.chalmers.se/en/education/your-studies/find-course-and-programme-syllabi/course-syllabus/DAT232/)；领域建模在本课只是 Beyond a brief introduction into concrete notations of requirements（UML 建模在 Cornell CS 5150 L4 更全）；课程是第二周期（硕士）课，D2 入门层偏难。保留。 |
| P.4.3 软件设计与面向对象分析设计 | 课程单元 | [CMU 17-214/514 Principles of Software Construction: Objects, Design, and Concurrency](https://cmu-17-214.github.io/f2026/)；本轮没有逐讲核对 17-214 的 f2026 schedule（缓存页为空）；UML 全图型与 GRASP 在 17-214 里只到类图级别（refactoring.guru 也只讲类图）。证据强度中等：课程名与简介吻合，讲次级证据来自旧页面。保留。 |
| P.4.4 软件架构 | 课程单元 | [The University of Queensland CSSE6400 Software Architecture](https://csse6400.uqcloud.net/)；系统演化在课程里只在 ADR/演进处提及。保留。 |
| P.4.5 软件测试、质量与可靠性 | 课程单元 | [George Mason University SWE 637 Software Testing (3 credits)](https://catalog.gmu.edu/courses/swe/)；保留软件测试课程，测试设计、覆盖和自动化是主体。性质测试由 CMU17-313 的相关教学材料补充；故障注入作为可靠性测试入门，不把独立混沌工程体系并入必学范围。 |
| P.4.6 软件维护、演化与技术债 | 课程单元 | [University of Zurich Software Maintenance and Evolution (HS21)](https://www.ifi.uzh.ch/en/seal/teaching/courses/archive/HS21/sme.html)；UZH 的幻灯片在 OLAT 不公开，讲次级证据只能靠课程页与 UCLouvain 描述；经验研究方法在教材（SE at Google）里没有，需要 UZH 的读物清单。保留。 |
| P.5.1 互联网与Web开发 | 课程单元 | [UW CSE 154 Web Programming](https://courses.cs.washington.edu/courses/cse154/)；互联网层面的 DNS/TCP/HTTP 细节在本课只到够用（C.3.2 才是网络课）；可访问性只有部分。保留。 |
| P.5.2 移动应用开发 | 课程单元 | [Stanford CS 193A Android App Development + NTNU INFT2508 Cross-platform Applications Development for Mobile Devices](https://web.stanford.edu/class/cs193a/)；名称按当前简介和学习来源收窄，避免承诺另一个完整平台/行业方向。 |
| P.5.3 DevOps、持续交付与SRE | 课程单元 | [UChicago MPCS 56550 Introduction to DevOps](https://mpcs-courses.cs.uchicago.edu/2025-26/summer/courses/mpcs-56550-1)；供应链只取发布流程中的制品、依赖锁定、溯源和 SBOM 入门，不把整套供应链安全专业课拼入。 |
| C.1.1 计算机组成原理 | 课程单元 | [MIT 6.004 Computation Structures (Spring 2017, MIT OpenCourseWare)](https://ocw.mit.edu/courses/6-004-computation-structures-spring-2017/)；机器组成与数据通路；门级组合/时序电路归 H.1.2。 |
| C.1.2 计算机体系结构 | 课程单元 | [ETH Zürich Digital Design and Computer Architecture (Spring 2024)](https://safari.ethz.ch/digitaltechnik/spring2024/doku.php)；与 C.1.1 的分界是「单周期数据通路 vs 流水线/cache/ILP」，两种课都存在（6.004 vs CS152/18-447/DDCA）。简介里的「分支预测」在 DDCA 日程上没有单独讲次（可能在 L18/L19 讲义内部），未核到讲次级。保留。 |
| C.1.3 ARM与其他指令集体系 | 课程单元 | [绍兴文理学院《汇编语言》教学大纲（48 学时 2.5 学分）+ Stanford CS107e](https://jdxy.usx.edu.cn/__local/0/FB/58/AE5DE6609BFBDE9879029E1A66E_9758BBAF_2C1DD4.pdf)；深查指出的不确定点：ARM 特有的异常级 EL0–EL3 没有任何课程讲（只有 Arm 架构手册）；ARM 在这里是 ISA 实例而非独立技能，若要更准确可改名为「指令集、汇编与 ABI」。按「指令集+汇编」口径保留。 |
| C.1.4 GPU、加速器与异构系统 | 进阶模块 | [Stanford CS149 Parallel Computing (Fall 2025) + Georgia Tech CS 7295 GPU Hardware and Software](https://gfxcourses.stanford.edu/cs149/fall25)；加速器硬件与体系结构；GPU 编程与优化归 C.5.2。 |
| C.2.1 操作系统 | 课程单元 | [Berkeley CS 162 Operating Systems and System Programming + OSTEP](https://www2.eecs.berkeley.edu/Courses/CS162/)；与 C.2.4（存储/文件系统）、C.2.2（系统编程与并发）内容相邻：文件系统深入部分归 C.2.4，本节点保留概述、虚拟内存、调度与接口。保留。 |
| C.2.2 系统编程与并发同步 | 课程单元 | [University of Washington CSE 333 Systems Programming](https://courses.cs.washington.edu/courses/cse333/25au/)；内存模型细节、原子操作、竞态检测工具比 CSE 333 更深（CSAPP 第 12 章加专题课），本节点因此略偏大；但主体（系统编程加并发入门）确实是一门课，保留。 |
| C.2.3 虚拟化、容器与资源管理 | 课程单元 | [University of Maryland ENPM818R Virtualization and Container Technologies (Fall 2025, 3 credits)](https://mage.umd.edu/sites/oaee.umd.edu/files/syllabi/ENPM818R%202508%20Syllabus%20%281%29.pdf)；深查指出的不确定点：cgroup/namespace 级隔离机制与调度算法这门课没有专讲（要靠内核文档），资源管理落在 Kubernetes 编排上。按整门课保留。 |
| C.2.4 存储系统与文件系统 | 课程单元 | [CMU 18-746 Storage Systems (Fall 2025)](http://www.ece.cmu.edu/~ece746/)；此前只有 MIT 6.033（存储相关 2–3 讲），本轮补到专门课，证据从 module 升级为 course。与 C.2.1 的分界：OS 课讲文件系统接口与页缓存，本节点讲设备/RAID/日志结构与分布式存储。 |
| C.3.1 数据通信与信号基础 | 课程单元 | [MIT 6.02 Introduction to EECS II: Digital Communication Systems (Fall 2012, MIT OCW)](https://ocw.mit.edu/courses/6-02-introduction-to-eecs-ii-digital-communication-systems-fall-2012/)；信号、编码和传输链路；分组网络分层归 C.3.2。 |
| C.3.2 网络协议、路由与传输 | 课程单元 | [Stanford CS144 Introduction to Computer Networking + Princeton COS 461](https://cs144.github.io/)；分组协议、路由与网络分层；通信链路数学归 C.3.1。 |
| C.3.3 无线、移动与物联网网络 | 课程单元 | [CMU 18-452/18-750 Wireless Networks and Applications (Spring 2024)](https://www.cs.cmu.edu/~prs/wirelessS24/)；物联网在本课以传感网/RFID/低功耗无线呈现，设备端协议栈（MQTT/CoAP 等）与云端 IoT 平台没有专讲，与 H.4.3 的分界需写清。保留。 |
| C.3.4 SDN与可编程网络 | 课程单元 | [University of Waterloo CS 856 Programmable Networks (Winter 2024)](https://mina.arashloo.net/courses/programmable_networks/w24.html)；名称按当前简介和学习来源收窄，避免承诺另一个完整平台/行业方向。 |
| C.4.1 分布式系统 | 课程单元 | [MIT 6.5840 (6.824) Distributed Systems](https://pdos.csail.mit.edu/6.824/)；与 C.4.3 的分界：C.4.1 是系统实现课（论文加 lab），C.4.3 是形式化算法理论课（模型加证明）。保留。 |
| C.4.2 云计算 | 课程单元 | [Cornell CS5412 Topics in Cloud Computing (Fall 2022)](https://www.cs.cornell.edu/courses/cs5412/2022fa/)；多租户只在按租户隔离与计价处提及；成本模型是这门课的特色。选修节点，保留。 |
| C.4.3 分布式算法与一致性理论 | 课程单元 | [MIT 6.852J / 18.437J Distributed Algorithms (Fall 2009, MIT OCW, Nancy Lynch)](https://ocw.mit.edu/courses/6-852j-distributed-algorithms-fall-2009/)；线性化（linearizability）在这门 2009 课程里可能以 atomic/sequential consistency 的形式出现，逐讲标题未逐一核实；其余主题已在讲义清单里。保留。 |
| C.5.1 共享/分布式内存并行编程 | 课程单元 | [CMU 15-418/618 Parallel Computer Architecture and Programming](https://www.cs.cmu.edu/~418/)；与 C.1.4/C.5.2 共用课程（并行架构加编程），与 C.5.3 的分界是「通用并行编程 vs 数值/HPC 工作负载」。保留。 |
| C.5.2 GPU计算与性能优化 | 课程单元 | [UIUC ECE 408 Applied Parallel Programming (Fall 2026) + UCSD ECE 277 GPU Programming](https://ece.illinois.edu/academics/courses/ece408)；并行内核与 GPU 程序优化；硬件设计归 C.1.4。 |
| C.5.3 高性能科学计算 | 课程单元 | [UW AMath 483/583 High Performance Scientific Computing (LeVeque) + Berkeley CS 267](https://faculty.washington.edu/rjl/classes/am583s2014/)；能耗只在讲义中部分涉及；通信优化/可扩展性在并行章节里，未单独成章。保留。 |
| D.1.1 数据建模、关系模型与SQL | 课程单元 | [CUNY (City Tech) CST 3504 Database Design (3 credits)](https://www.citytech.cuny.edu/computer-systems/docs/courses/CST3504.pdf)；数据建模、关系模型与 SQL 的使用；存储和执行器归 D.1.2。 |
| D.1.2 数据库内核与查询优化 | 课程单元 | [CMU 15-445/645 Intro to Database Systems (Fall 2026)](https://15445.courses.cs.cmu.edu/fall2026/)；存储、索引、执行与优化；分片和跨节点一致性归 D.1.3。 |
| D.1.3 分布式数据库与NoSQL | 课程单元 | [University of Waterloo CS742: Parallel and Distributed Database Systems](https://cs.uwaterloo.ca/grad/courses/calendar/cs742)；以分布式数据管理为主线；NoSQL 的模型与一致性取舍是应用实例，不能声称该关系型课程覆盖所有现代 NoSQL 产品。 |
| D.1.4 数据库管理与安全 | 课程单元 | [CUNY (City Tech) CST 4714 Database Administration (3 credits: 2 class + 2 lab)](https://www.citytech.cuny.edu/computer-systems/docs/courses/CST4714.pdf)；审计只到日志与监控（PostgreSQL 文档同样没有专门审计章，pgaudit 属扩展），安全理论见 S.3.3。保留。 |
| D.1.5 数据治理、元数据与质量 | 课程单元 | [UT Dallas ITSS 4356 Data Governance (undergraduate catalog)](https://catalog.utdallas.edu/2024/undergraduate/courses/itss)；血缘/目录/模式演化在课程里落到元数据与质量规则，工具级（catalog/lineage）细节要看 OpenMetadata 文档；DAMA-DMBOK 是教材不是课程，未按课程计。保留。 |
| D.2.2 数据工程与大数据处理 | 课程单元 | [TU Delft CSE2520 Big Data Processing (5 ECTS, 12×2h)](https://burcuku.github.io/cse2520-bigdata/)；以端到端数据工程流程为统一目标；管线、批/流处理各取入门实践，深层分布式协议归 C.4.1。 |
| D.2.3 搜索与信息检索系统 | 课程单元 | [Stanford CS 276 / LING 286 Information Retrieval and Web Search](https://web.stanford.edu/class/cs276/)；名称按当前简介和学习来源收窄，避免承诺另一个完整平台/行业方向。 |
| D.3.1 数据科学导论与工具箱 | 课程单元 | [Berkeley Data 100 Principles and Techniques of Data Science (Fall 2025)](https://ds100.org/fa25)；评估、泄漏与实验记录作为数据科学生命周期中的入门方法，不要求掌握完整学习理论。 |
| D.3.2 知识发现与数据挖掘 | 课程单元 | [Stanford CS 246 Mining Massive Datasets + MMDS 免费教材](http://web.stanford.edu/class/cs246/)；异常检测不在 MMDS 章节里（Tan 等的教材有，但只放样章）；本节点与 A.2.1 的聚类/异常有重叠。保留。 |
| D.4.1 知识表示、知识图谱与本体 | 课程单元 | [openHPI Knowledge Graphs (HPI/FIZ-KIT, 6-week MOOC, Sack & Alam)](https://open.hpi.de/courses/knowledgegraphs2020)；图谱数据模型、本体与表示；语义推理算法归 D.4.2。 |
| D.4.2 知识推理与语义计算 | 课程单元 | [UT Dallas CS 6373 Intelligent Systems / CS 6374 Computational Logic](https://catalog.utdallas.edu/2025/graduate/courses/cs)；图谱上的演绎、规则与语义查询；数据表示基础归 D.4.1。 |
| A.1.1 搜索、规划与约束求解 | 基础模块 | [CS188 Introduction to Artificial Intelligence（UC Berkeley 课程目录；另用 Stanford CS221 课表与 Poole & Mackworth 教材核对范围）](https://www2.eecs.berkeley.edu/Courses/CS188/)；按整门 AI 课计约三分之一，故 basis=module，不是整门课。缺口：CS188 的 planning 指 MDP 规划，STRIPS/PDDL 式规划表示只在教材第6章；若严格要求，可把“规划表示”降为延伸。 |
| A.1.2 概率图模型与不确定推理 | 课程单元 | [Stanford CS228 Probabilistic Graphical Models（公开讲义站，Representation / Inference / Learning 三部分）](https://ermongroup.github.io/cs228-notes/)；整门课即本技能。研究生难度，D1–D2 层需去掉部分推导；简介里“结构建模”有对应章节，不算超纲。 |
| A.2.1 监督、无监督与半监督学习 | 课程单元 | [An Introduction to Statistical Learning（James/Witten/Hastie/Tibshirani 2e，作者站免费 PDF）+ Stanford CS229](https://www.statlearning.com/)；整门课规模。缺口：半监督学习与特征工程在 ISL 里只零散出现，两门课都不成章；这两项应降为推荐延伸，否则简介超出证据。 |
| A.2.2 学习理论与泛化 | 课程单元 | [Learning From Data（Caltech CS 156 公开课，18 讲视频+作业）+ CMU 36-708](https://work.caltech.edu/telecourse)；整门课。缺口：稳定性和分布外泛化不在 CS156 目录，只在研究生专题/论文层面；简介保留这两项即超出课程证据。 |
| A.2.3 深度学习 | 课程单元 | [Neural Networks and Deep Learning（Michael Nielsen 免费在线教材）+ 多伦多 CSC413H1 Neural Networks and Deep Learning](https://artsci.calendar.utoronto.ca/course/csc413h1)；保留基础深度学习课程，目标是神经网络、反向传播和训练机制；架构比较及自监督保留为下游进阶模块 A.2.3.1。两者有基础概念交叉，但点亮目标不同，不采纳机械合并建议。 |
| A.2.3.1 网络架构与表示学习 | 进阶模块 | [CMU 11-785: architecture and representation units](https://deeplearning.cs.cmu.edu/F24/index.html)；架构族与表示目标；不重复父节点的优化基础或训练系统工程。 |
| A.2.3.2 深度模型训练与推理系统 | 课程单元 | [CMU 10-414/714 Deep Learning Systems: Algorithms and Implementation（dlsyscourse.org 公开讲义、notebook 与视频）](https://dlsyscourse.org/)；整门课，且与 A.2.3 的“模型/训练原理”是两个不同建制（系统实现 vs 算法）。量化/蒸馏在 23 讲只算部署话题的一部分，简介不要写成“压缩专题”。 |
| A.2.4 强化学习 | 课程单元 | [UCL Course on Reinforcement Learning（David Silver，10 讲 slides+视频+Easy21 作业）+ Stanford CS234](https://davidstarsilver.wordpress.com/teaching/)；整门课，MDP/价值-策略/时序差分/策略梯度/探索全覆盖。缺口：离线 RL 与运筹交叉只在研究生课/论文层面，简介里若要保留需降为延伸。 |
| A.2.5 联邦学习 | 课程单元 | [Aalto CS-E4740: Federated Learning](https://federatedlearningaalto.github.io/)；2027 课表尚属计划，当前使用已公开的教材、slides 和 2025 录像；迁移/多任务课程另作网络架构与表示学习的延伸。 |
| A.3.1 自然语言处理 | 课程单元 | [Speech and Language Processing 3e draft（Jurafsky & Martin 免费在线）+ Stanford CS224N](https://web.stanford.edu/~jurafsky/slp3/)；整门课，文本表示/语言建模/结构预测/信息抽取/检索都有章。评测指标分散在各章，没有独立一章，简介里“语言评测”不要单列成知识点。 |
| A.3.2 图像处理与计算机视觉 | 课程单元 | [First Principles of Computer Vision（Shree Nayar, Columbia）+ 多伦多 CSC420H1 Introduction to Image Understanding](https://fpcv.cs.columbia.edu/)；整门课；传统 CV 与图像处理两块都有课程证据。深度学习式检测/分割在 CS231n（A.2.3.1/A.3.2 交界），本节点按“经典 CV”写即可。 |
| A.3.3 语音与音频智能 | 课程单元 | [Hugging Face Audio Course（官方 8 单元）+ Stanford CS224S Spoken Language Processing](https://huggingface.co/learn/audio-course/chapter0/introduction)；整门课；HF 偏应用，声学建模的理论在 CS224S。简介里的“语音交互”只在 U7 项目里，别当独立课时。 |
| A.3.4 推荐系统 | 课程单元 | [Recommender Systems Specialization（Univ. of Minnesota / Coursera，5 门课系列）+ UCSD CSE158/258 对照](https://www.coursera.org/specializations/recommender-systems)；整门（系列）课规模，但只相当于一门 3 学分课的量；单独用 CSE258 不够（1/3 门）。缺口：反馈偏差、多目标、在线实验没有课程层证据，建议降为延伸。 |
| A.3.5 生成式AI | 课程单元 | [Stanford CS236 Deep Generative Models（syllabus + slides）](https://deepgenerativemodels.github.io/syllabus.html)；整门课，四类生成模型与评估都有专讲。缺口：多模态生成（文生图/音频）与对齐（RLHF）只在项目/扩展阅读，简介里这两项证据弱。 |
| A.4.1 机器学习工程与MLOps | 课程单元 | [Made With ML — MLOps Course（Goku Mohandas）+ CMU 17-445/645/745 Machine Learning in Production](https://madewithml.com/courses/mlops/)；整门课（工程阶段全覆盖）。版本管理与特征服务的原理讲得浅、以工具为主；简介按 D2 工程技能写即可。 |
| A.4.2 可信AI、可解释性与公平性 | 课程单元 | [Stanford CS335 Fair, Accountable, and Transparent (FAT) Deep Learning（schedule）+ UPenn CIS 4270/5270 Trustworthy ML](http://web.stanford.edu/class/cs335/schedule.html)；两门课合起来才覆盖简介：现资源 CIS 4270 的 2026 春课表没有公平性与隐私两讲，只有鲁棒/校准/解释/对齐；简介里的“公平、隐私、社会影响”必须以 CS335 为证据，否则超范围。与 A.4.3 的边界应写成“性质度量与解释/公平 vs 攻击与投毒”。 |
| A.4.3 AI安全与模型系统安全 | 课程单元 | [CS 4727/5727 Adversarial Machine Learning（Alex Vakanski, Boise State，讲稿全公开）](https://www.idahofallshighered.org/vakanski/Courses/Adversarial_Machine_Learning.html)；保留 AI 系统安全课程，模型攻击、投毒和防护为技术主线；滥用评估只作系统威胁建模中的入门场景，社会伦理治理另属 A.4.2/I.2.1，不冒充完整 AI 滥用研究课程。 |
| A.4.4 多智能体强化学习 | 课程单元 | [Multi-Agent Reinforcement Learning: Foundations and Modern Approaches（MIT Press 2024，免费 PDF+slides+代码）+ MIT 6.7980 Topics in Multiagent Learning](https://marl-book.com/)；整门课（教材规模超过一学期 3 学分课，作为 D3 专题可接受）。简介里的“纳什均衡等解概念”有 Ch4 对应，不需要拆。 |
| S.1.1 安全原理、威胁建模与风险 | 基础模块 | [Computer Security（UC Berkeley CS161 在线教材，第1部分 Security Principles）+ CS161/CS155 课程](https://textbook.cs161.org/)；不足整门课（约 1/5），是入门安全课的第一段，故 basis=module。作为 D1 入门技能成立：能独立学、能独立出概念题；但不要写成“整门安全课”。若要保持整门课粒度，应合并为“计算机安全导论”（CS161/CS155 整门）。 |
| S.1.2 密码学 | 课程单元 | [CS255 Introduction to Cryptography（Stanford，Dan Boneh；overview + 逐讲 slides）](https://crypto.stanford.edu/~dabo/cs255/overview.html)；整门课；对称/公钥/哈希/MAC/签名/密钥管理/协议全覆盖。与 S.1.3 的分界是“入门定义与构造 vs 可证明安全/协议级专题”，两门课本身就是先后关系。 |
| S.1.3 现代密码与隐私计算专题 | 课程单元 | [CS 355 Topics in Cryptography（Stanford）+ UC Berkeley CS 276 Graduate Cryptography](https://cs355.stanford.edu/)；整门研究生课，与“现代密码与隐私计算专题”这个名字对得上（就是专题课）。不要把它写进入门层；S.1.2 已是入门。 |
| S.2.1 计算机系统安全 | 课程单元 | [6.858 Computer Systems Security（MIT OCW，全套 lecture notes/视频/labs）](https://ocw.mit.edu/courses/6-858-computer-systems-security-fall-2014/)；整门课。与 S.3.1（Web）在 Web 安全模型一讲重叠、与 S.2.2 在网络协议部分重叠，但课程重心（OS/内存/隔离/侧信道）不同，边界清楚，不必合并。 |
| S.2.2 网络安全 | 课程单元 | [CSE 571S Network Security（WUSTL，28 讲课表）+ Stanford CS155 Part 3](https://www.cse.wustl.edu/~jain/cse571-14/index.html)；整门课（同名课程）。注意 CSE571 前半约 15/28 讲是密码学，真正的“网络安全”约一半；简介按协议攻击面/防火墙/IDS/传输保护写是对的，别把密码学算进来。 |
| S.2.3 移动应用与设备安全 | 课程单元 | [APUS ISSC412: Mobile Application Security](https://www.apu.apus.edu/docs/shared/course-syllabus/ISSC412.pdf)；历史课程只作规模证据，当前内容按 OWASP MAS；无线链路移到网络安全。 |
| S.2.4 云安全与容器安全 | 课程单元 | [Kubernetes 官方文档 Concepts→Security（主资源）+ BU MET CS 690 Network and Cloud Security、Berkeley CYBER 212 Cloud Security](https://kubernetes.io/docs/concepts/security/)；工程标准文档+课程双证据，整门课规模成立。云审计/合规只有 checklist，没有课程单元，简介里“云审计”应写浅。 |
| S.2.5 硬件、嵌入式与物联网安全 | 课程单元 | [ECE 4040/5040 Introduction to Hardware Security（University of Idaho，大纲与作业公开）](https://hsc-research.org/hwsec.html)；保留硬件安全课程，以设备信任边界、侧信道、故障攻击和供应链为主。安全启动/固件仅到安全机制与攻击面的入门，嵌入式开发实践由 H.3.2 承担。 |
| S.3.1 应用、Web与API安全 | 课程单元 | [Web Security Academy（PortSwigger，All topics + labs）+ Stanford CS253 Web Security](https://portswigger.net/web-security)；整门课；输入输出边界/认证会话/访问控制/服务端客户端/API 全覆盖。PortSwigger 是交互式教材+labs（有完成状态可核对），但没有学期考核，课程层证据用 CS253。 |
| S.3.2 安全软件开发与程序分析 | 课程单元 | [Introduction to Software Security（UW-Madison，Barton Miller & Elisa Heymann，模块化开放教材）+ Manchester COMP63342](https://research.cs.wisc.edu/mist/SoftwareSecurityCourse/)；整门课；安全需求/代码审查/静态动态分析/模糊测试都有模块。形式化验证（时序逻辑）由 COMP63342 补，属 D3。 |
| S.3.3 数据安全、隐私工程与访问控制 | 课程单元 | [CS 59000-DSP / CS 55600 Data Security and Privacy（Purdue，每周 slides 与作业公开）](https://www.cs.purdue.edu/homes/ninghui/courses/Spring22/lectures.html)；整门课；数据分类/授权/加密/脱敏/差分隐私/审计都有。审计只有 Clark-Wilson 的账本完整性一段，简介里“审计”别写太重。 |
| S.4.1 渗透测试、道德黑客与反制 | 课程单元 | [CSEC 4324 Penetration Testing（TAMUSA 课程目录）+ OWASP WSTG v4.2](https://catalog.tamusa.edu/undergraduate/courses-az/csec)；整门课（同名课程）。报告/修复/复测在 WSTG 2.11 与课程作业里，但没有专门教材章节；简介里“复测”证据较弱。 |
| S.4.2 计算机取证与事件响应 | 课程单元 | [A Course on Digital Forensics（Texas Tech，讲义+实验全公开）+ CMU 14-822 Host Based Forensics](https://github.com/asiamina/A-Course-on-Digital-Forensics)；保留取证与事件响应课程。现场/磁盘/内存/网络取证是主线，导览已有 NIST800-86 与 CISA playbooks 补响应、恢复和复盘，不再把讲义未覆盖的组织流程写成无来源。 |
| S.4.3 逆向工程与恶意软件分析 | 课程单元 | [Malware Analysis — CSCI 4976（RPI，RPISEC；12 讲讲义+实验）](https://github.com/RPISEC/Malware)；整门课（二进制结构/反汇编/动态观测/行为）。检测特征（YARA 规则编写）在课程后段，深度以实验为主，简介里“检测特征”别写成理论课。 |
| S.4.4 安全运营、检测与攻防评估 | 课程单元 | [Ensign College IT324: SOC Operations](https://catalog.ensign.edu/courses/0042631/overview-aoYks)；持续检测与运营；事后事件响应和证据取证归 S.4.2。 |
| S.5.1 协议验证与信息流安全 | 课程单元 | [263-4600-00L Formal Methods for Information Security（ETH Zurich，5 ECTS，课程描述公开）+ CMU 15-316（公开讲义）](https://infsec.ethz.ch/education/ss2025/fmsec.html)；有整门课（5 ECTS，口试+项目 25%），简介的五项逐条对得上，故 retain，不做收窄。注意：ETH 讲义在 Moodle，站上只有描述与书目，所以学习资源仍用公开的 CMU 15-316 + 协议部分用 Tamarin/ProVerif 手册（nodes/S.5.1.json 已有同样记录）。 |
| S.5.2 系统安全研究与安全测量 | 课程单元 | [RIT CSCI531: Introduction to Security Measurement](https://www.cs.rit.edu/~lr/courses/531/CSCI-531-IntroSecurityMeasure-syll.html)；RIT 页面是历史课程规模证据，不作为现代系统实践的唯一教材；网络测量和经济学作为研究案例，不能宣称学完所有研究分支。 |
| H.1.1 电路与模拟电子基础 | 课程单元 | [Circuits and Electronics（MIT 6.002 / 6.2000，MIT OCW，讲义/实验/视频全公开）](https://ocw.mit.edu/courses/6-002-circuits-and-electronics-spring-2007/)；保留电路与模拟电子基础课程，电路模型、动态和放大为主体；噪声和 ADC/DAC 只作接口与误差入门，不等同模拟集成电路设计课程。 |
| H.1.2 数字电路与数字逻辑 | 课程单元 | [Introduction to Digital Design（UCSD ECE 25）+ Computation Structures（MIT 6.004 模块 1–8）](https://catalog.ucsd.edu/courses/ECE.html)；门级逻辑与时序电路；整机组成归 C.1.1。 |
| H.1.3 信号与系统 | 课程单元 | [Signals and Systems（MIT 6.003，MIT OCW）](https://ocw.mit.edu/courses/6-003-signals-and-systems-fall-2011/)；收窄为信号与系统一门课。数字滤波器设计、FFT 优化与定点 DSP 工程是可选延伸；导览中的 DSP 补充分支不作为点亮门槛。 |
| H.2.1 FPGA与Verilog/HDL | 课程单元 | [Introductory Digital Systems Laboratory（MIT 6.111 / 6.2050，MIT OCW）](https://ocw.mit.edu/courses/6-111-introductory-digital-systems-laboratory-spring-2006/)；整门课；RTL/仿真/综合/部署都有实验。缺口：约束文件与时序收敛（STA、跨时钟域）在课程里只按实验讲到够用，简介不要写成“时序收敛专家级”。 |
| H.2.2 硬件设计验证 | 课程单元 | [UMBC CMPE691: Hardware Design Verification](https://eclipse.umbc.edu/robucci/cmpeHDV/)；讲义有密码；免费主学改成 Accellera UVM 指南与 SBY。综合/布局布线归 VLSI。 |
| H.2.3 PCB设计与板级工程 | 课程单元 | [The Art and Science of PCB Design（MIT IAP 6.S092 / EC.S03，课程站+lab 全公开）](https://pcb.mit.edu/syllabus/)；整门课（IAP 密集课）。缺口：供电完整性、信号完整性与 EMC 只在高级仿真/客座讲座，UCSC Extension 有专门课；简介里这三项写浅，不要当主线。 |
| H.2.4 VLSI与芯片设计 | 课程单元 | [Analysis and Design of Digital Integrated Circuits（MIT 6.374，MIT OCW）+ UCSD ECE 165](https://ocw.mit.edu/courses/6-374-analysis-and-design-of-digital-integrated-circuits-fall-2003/)；整门课；CMOS 数字设计/时序/功耗/面积/版图/测试都有。标准单元库与 EDA 工具流程（综合/P&R）不在其中，属 H.2.2 的产业流程；两节点按“电路设计 vs 工具流程”分界。 |
| H.2.5 半导体器件与微电子基础 | 课程单元 | [Microelectronic Devices and Circuits（MIT 6.012，MIT OCW）](https://ocw.mit.edu/courses/6-012-microelectronic-devices-and-circuits-spring-2009/)；整门课；器件物理+电路模型+实现约束。缺口：工艺集成（光刻/刻蚀流程、良率）只在常识层，简介里“工艺”一项写浅。 |
| H.3.1 单片机与微控制器 | 课程单元 | [Embedded Systems - Shape The World（Valvano & Yerraballi，UT Austin，免费在线教材+视频，配 EE319K）](https://users.ece.utexas.edu/~valvano/Volume1/E-Book/)；整门课（裸机 C + 外设 + 调试）。缺口：DMA、低功耗模式、Bootloader/OTA 不在主线，简介里“资源限制”可以讲，但不要写成低功耗设计课。 |
| H.3.2 嵌入式系统、驱动与RTOS | 课程单元 | [ECE 445M Embedded and Real-Time Operating Systems（UT Austin，syllabus 公开）+ Bootlin 嵌入式 Linux 资料](https://users.ece.utexas.edu/~valvano/EE445M/syllabus.html)；整门课（RTOS/驱动/启动/调试）。Bootlin 是培训资料不是学分课，故课程层证据用 ECE445M；微控制器 RTOS（FreeRTOS）与嵌入式 Linux 两条线合并写时要说清。 |
| H.3.3 传感器与接口 | 课程单元 | [Sensors and Instrumentation（University of Edinburgh ELEE11109，SCQF 11，10 credits）](https://www.drps.ed.ac.uk/26-27/dpt/cxelee11109.htm)；整门课（传感器+测量+接口）。缺口：数字总线（I2C/SPI/CAN）与 ADC 采集流程在 6.071J/UCSD ECE 118 里，不在 ELEE11109；简介里“总线”一项需以那两门课补，否则超出单一课程。 |
| H.3.4 实时系统 | 课程单元 | [EDA223 Real time systems（Chalmers，7.5 credits，course syllabus 公开）](https://www.chalmers.se/en/education/your-studies/find-course-and-programme-syllabi/course-syllabus/EDA223)；收窄为实时系统。失效安全、危害分析和行业认证属于可选应用延伸；调度正确不能替代系统安全论证，MIT System Safety 不作为第二门必学课程。 |
| H.4.1 控制理论与状态估计 | 课程单元 | [6.3100 Dynamical System Modeling and Control Design（MIT 目录条目）+ 6.302 Feedback Systems（MIT OCW）](http://catalog.mit.edu/subjects/6/)；整门课（经典+状态空间+状态估计/LQR）。缺口：Kalman 滤波属 state estimation 一段、深度有限；MPC 不在 6.3100/6.302，需 16.323 一类最优控制课。简介里“MPC”目前无课程层证据，建议降为延伸。 |
| H.4.2 机器人建模、规划与控制 | 课程单元 | [Introduction to Robotics（Stanford CS223A，SEE 公开 16 讲视频+讲义+作业）](https://see.stanford.edu/Course/CS223A)；整门课（运动学/动力学/轨迹规划/控制）。缺口：定位建图（SLAM）与多传感器感知融合不在 CS223A；简介里这两项需由 A.3.2 或专门 SLAM 课补，不能算进本节点的课程证据。 |
| H.4.3 物联网 | 课程单元 | [IoT for Beginners（Microsoft 官方 12 周 24 课）+ FITech Introduction to the Internet of Things MOOC / Tartu 6 ECTS 动手课](https://microsoft.github.io/IoT-For-Beginners/)；整门课规模（12 周 24 课 ≈ 一门课）。缺口：功耗管理没有独立模块，只在设备选型/电池供电提示里；与 H.4.4 的分界要写成“是否以计算放置位置与资源权衡为主线”（H.4.4 深查已指出）。 |
| H.4.4 边缘计算 | 课程单元 | [ICT203A Edge Computing（ICMS，3 credit points，200 级核心课）+ Northwestern CE-395 IoT & Edge Computing](https://www.icms.edu.au/courses/undergraduate/edge-computing/)；计算卸载、连接约束与边缘资源权衡；AI 模型压缩部署归 X.1.1。 |
| V.1.1 计算机图形学 | 课程单元 | [CS184/284A Computer Graphics and Imaging（UC Berkeley，讲义/录像/项目公开）](https://cs184.eecs.berkeley.edu/sp24)；整门课；几何/变换/光栅化/光照/渲染/动画都有。物理仿真只在动画/成像部分一带而过，简介里“物理仿真”应删或改指 V.1.3/X.3.3。 |
| V.1.2 多媒体技术 | 课程单元 | [Multimedia Technologies & Applications — Lecture Notes（法政大学 Jianhua Ma，14 讲）+ CMU 18-796 Multimedia Communications](https://jianhua.cis.k.hosei.ac.jp/course/mm/Lecture_Note.html)；整门（14 讲）课规模，但 CMU 18-796 的公开 syllabus 是 1999 年春版本，时效旧；容器格式（MP4/TS）没有单独一节，简介里“容器”证据弱。 |
| V.1.3 物理与可微渲染 | 课程单元 | [15-468/668/868 Physics-based rendering（CMU，课程页+作业+final project）](https://imaging.cs.cmu.edu/15-468)；收窄为物理与可微渲染。CMU15-468 的确有一讲 Physics simulation，原检索备注称其完全没有仿真不准确；一讲导论不等于布料/流体/刚体仿真课程，不独立要求掌握这些领域。 |
| V.2.1 交互基础与认知、人因 | 基础模块 | [ASEN 4128 Human Factors in Engineering and Design（CU Boulder，syllabus 公开）](https://www.colorado.edu/aerospace/sites/default/files/attached-files/asen_4128-001_human_factors_course_syllabus_0.pdf)；半门课（模块级），不是整门课：GMU PSYC 530 Cognitive Engineering 只覆盖认知工程一支（不足一半）。与 V.2.2 的分界：V.2.1 用原理指导设计，V.2.2 做研究与评估；不要合成一个“HCI”大节点，因为两门课建制不同。 |
| V.2.2 用户研究、交互设计与UX评估 | 课程单元 | [CSE 440 Introduction to HCI: User Interface Design, Prototyping, and Evaluation（UW，课程主页+往季存档）](https://courses.cs.washington.edu/courses/cse440/)；整门课；访谈/原型/交互流程/可用性实验/评估/迭代都有项目里程碑对应。缺口：可用性实验的统计推断较薄（M.6.2 补）。 |
| V.2.3 可访问性与包容性设计 | 课程单元 | [05-332/632 Introduction to Accessibility and Assistive Technology（CMU HCII）+ W3C WAI Tutorials](https://hcii.cmu.edu/course/introduction-accessibility-and-assistive-technology)；整门课。W3C 教程偏 Web；桌面/移动原生与硬件辅助设备在 05-332 里。简介若只写 Web 会低估课程，写全又超出 W3C 教程，注意分层。 |
| V.2.4 XR、空间交互与协作系统 | 课程单元 | [CSE 168 Introduction to Augmented Reality and Virtual Reality（UC Santa Cruz）+ Virtual Reality（LaValle, CUP 2023，免费全文+MOOC）](https://catalog.ucsc.edu/en/current/general-catalog/courses/cse-computer-science-and-engineering)；整门课；显示/光学/追踪/空间界面/人因都有。缺口：多用户协作式 XR 不是 LaValle 书主线，CSE 168 也未以协作为核心；简介里“协作系统”证据弱。 |
| V.3.1 数据可视化与交互设计 | 课程单元 | [CSE 412 Introduction to Data Visualization（UW）+ Fundamentals of Data Visualization（Wilke，免费全文）](https://courses.cs.washington.edu/courses/cse412/)；整门课；数据类型/视觉编码/图表选择/布局/读图误差都有。缺口：交互式图表与交互技术 Wilke 只点到，由 CSE 412 补；简介里“交互”别写成主线。 |
| V.3.2 科学可视化与可视分析 | 课程单元 | [CSE 332 / ISE 332 Intro to Scientific Visualization（Stony Brook，逐讲讲义 PDF 公开）](https://www3.cs.stonybrook.edu/~mueller/teaching/cse332/)；整门课（科学可视化+可视分析）。评估方法（用户研究/任务分析）只在后段几讲；简介里“人在回路分析与评估”有对应但不深。 |
| I.1.1 信息系统基础 | 课程单元 | [15.561 Information Technology Essentials（MIT OCW，Sloan，syllabus+讲义）+ Saylor BUS206 Management Information Systems](https://ocw.mit.edu/courses/15-561-information-technology-essentials-spring-2005/pages/syllabus/)；整门课（信息系统导论）。技术深度按商科导论，刚好对应 D1；简介里“企业应用（ERP/CRM）”在两门课里只算一节，不要写重。 |
| I.1.2 信息系统战略与管理 | 课程单元 | [15.571 Generating Business Value from Information Technology（MIT OCW，Sloan，含讲义/讨论题/项目）](https://ocw.mit.edu/courses/15-571-generating-business-value-from-information-technology-spring-2009/)；整门课（IT 战略与业务对齐）。缺口：IT 采购、ITIL 服务管理与组织变革只在案例里，没有独立单元；简介里这三项写浅。 |
| I.1.3 业务流程管理 | 课程单元 | [Fundamentals of Business Process Management（Dumas/La Rosa/Mendling/Reijers，配套站提供 slides 与视频讲座）+ Penn State MIS 420 / IU BUS-K 315](https://fundamentals-of-bpm.org/)；整门课；发现/建模/分析/重设计/执行都有章。缺口：流程挖掘工具实操（Celonis/PM4Py）需另配实验，书本只讲方法。 |
| I.1.4 信息技术项目管理 | 课程单元 | [1.040 Project Management（MIT OCW）+ Penn State MIS 425 Managing Information Systems Projects](https://ocw.mit.edu/courses/1-040-project-management-spring-2004/pages/syllabus/)；整门课（项目管理）。缺口：1.040 案例面向建筑/工程（A/E/C），IT 情境靠 MIS 425 补；两门课合起来才完整，但仍是同一学习目标，不必拆。 |
| I.2.1 计算伦理、社会影响与专业责任 | 课程单元 | [6.805/STS.085 Ethics and the Law on the Electronic Frontier（MIT OCW）+ CSE 302 Professional Ethics for Computer Science（Stony Brook）](https://ocw.mit.edu/courses/6-805-ethics-and-the-law-on-the-electronic-frontier-fall-2005/pages/syllabus/)；保留计算伦理课程，以责任与社会影响判断为共同目标。导览已分别用 Fairness and Machine Learning、Green Software Practitioner 补公平与可持续性；不要求在本项掌握公平机器学习全部技术。 |
| I.2.2 技术沟通与写作 | 教材单元 | [Technical Writing Essentials (BCcampus)](https://pressbooks.bccampus.ca/technicalwriting/)；为读者写清楚技术内容；实验设计、复现与效度归 I.2.3。 |
| I.2.3 研究设计、可复现性与学术规范 | 课程单元 | [17-803 Empirical Methods（CMU）+ CMSC634 Empirical Research Methods for CS（UMD）+ The Turing Way](https://bvasiles.github.io/empirical-methods/)；整门课（研究方法）。缺口：学术诚信/规范在课程里通常按机构政策讲，教材层是 Turing Way 的 Ethical Research 指南；简介里“学术规范”要写成“由机构政策+指南补”，不要写成有专门课时。 |
| X.1.1 嵌入式与边缘AI | 课程单元 | [6.5940 TinyML and Efficient Deep Learning Computing（MIT，Song Han；每讲 slides/视频 + 5 个 lab）](https://hanlab.mit.edu/courses/2023-fall-65940)；受限设备上的 AI 模型与部署；一般边缘资源调度归 H.4.4。 |
| X.1.3 自动驾驶与自主系统 | 课程单元 | [Self-Driving Cars Specialization（University of Toronto / Coursera，4 门课）+ Techniques for Self-Driving Cars（University of Bonn，10 段录像）](https://www.coursera.org/specializations/self-driving-cars)；整门（系列）课；感知/定位/预测/规划/控制都有。缺口：“实时与安全评估”只在 Coursera 的技能标签里出现，没有独立教学单元；简介里这两项写浅，不要当课时。 |
| X.2.1 生物信息与计算生物学 | 课程单元 | [6.047 Computational Biology（MIT OCW，Kellis；讲义+开放教材+5 次作业+期末项目）](https://ocw.mit.edu/courses/6-047-computational-biology-fall-2015/)；整门课；序列/组学/统计推断/生物数据都有。分子生物学先修是课程外前置（简介已注明“外部前置”），不是技能树节点。 |
| X.2.2 计算金融 | 课程单元 | [MIT 18.S096: Mathematics with Applications in Finance](https://ocw.mit.edu/courses/18-s096-topics-in-mathematics-with-applications-in-finance-fall-2013/)；金融经济知识为背景，支付/账本工程移出该技能；不把金融科技行业全部算成一门课。 |
| X.2.3 教育科技与学习科学计算 | 课程单元 | [05-499/05-899 Learning Analytics and Educational Data Science + 05-823 E-Learning Design Principles and Methods（CMU HCII）](https://hcii.cmu.edu/course/special-topics-learning-analytics-and-educational-data-science)；整门课（两门互补课合起来）。缺口：智能辅导系统（ITS）与测量理论（IRT）在两门课里不是主线；简介里“智能辅导、测量”证据弱。05-499/899 当前季未开，依赖它的学期可能落空。 |
| X.2.4 医疗健康信息学 | 课程单元 | [BHIS 501 Methods in Biomedical and Health Informatics I（UIC）+ CHIP 708 Foundations of Clinical Data Science（UNC）+ Health Information Systems 3e（Springer 开放获取）](https://catalog.uic.edu/gcat/colleges-schools/applied-health-sciences/him/)；整门课；临床数据/医疗信息系统/集成/评价都有。缺口：临床决策支持（CDSS）的算法与评价只在 MIT HST.951J 那类课里，本节点现有课程覆盖较浅。 |
| X.2.5 地理空间数据科学 | 课程单元 | [空间数据分析（武汉大学，中国大学 MOOC）+ GEOG 485 GIS Programming（Penn State，在线公开课）+ Geographic Data Science with Python](https://www.icourse163.org/course/WHU-1463179165)；整门课（空间数据分析/GIS 编程）。缺口：地图投影、数据立方体与时空地统计（克里金）不在 GDS book，需 Spatial Data Science（Pebesma & Bivand）补；简介里“时空地统计”一项目前无课程证据，建议降为延伸。 |
| X.3.1 量子计算与量子信息 | 课程单元 | [Ph219/CS219 Quantum Computation（Caltech，Preskill；全套讲义+录播）+ UMD CMSC/PHYS 457](https://www.preskill.caltech.edu/ph219/)；整门课；量子态/门与测量/算法/纠错都有章。缺口：量子信息实验与硬件实现只在后段/专题，简介里“量子信息”若指实验则超范围。 |
| X.3.2 区块链与分布式账本 | 课程单元 | [CS 251: Blockchain Technologies（Stanford，syllabus 与每讲 slides 公开）](https://cs251.stanford.edu/info.html)；整门课；共识/账本/智能合约/密码学原语都有讲。缺口：机制设计（代币经济学）与 DeFi 协议只在个别讲次，简介里“经济机制”证据弱。 |
| X.3.3 科学机器学习与可微仿真 | 课程单元 | [18.337J/6.338J Parallel Computing and Scientific Machine Learning（MIT SciML 在线教材+课程）+ Northwestern ELEC_ENG/COMP_ENG 395/495](https://book.sciml.ai/course/)；整门课；物理约束学习/反问题/可微求解都有。缺口：“科学验证”（可复现的科学实验、与实验数据对比）依赖具体领域，课程只给方法；简介里这个词写浅。 |
| P.5.5 游戏开发与游戏引擎 | 课程单元 | [CMU 15-466/666 Computer Game Programming (Fall 2025)](https://graphics.cs.cmu.edu/courses/15-466-f25/)；刚体动力学/物理引擎、输入与相机、Unity/Unreal 工具链不在课内；GT CS 6457 Video Game Design 与 Kent State CS 38101 可补设计侧。保留。 |
| M.6.6 排队论与性能建模 | 课程单元 | [15-857 Analytical Performance Modeling & Design of Computer Systems（Carnegie Mellon University, Fall 2025, Mor Harchol-Balter）](https://www.csd.cmu.edu/course/15857/f25)；用排队过程解释时延与容量；观测序列预测归 M.6.4。 |
