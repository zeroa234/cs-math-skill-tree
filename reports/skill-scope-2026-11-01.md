# 技能范围判定：主干与选修（对照 CS2023）

2026-11-01。回答“这些技能里哪些属于计算机专业、哪些不是”。上一份[技能划分检查](skill-partition-review-2026-11-01.md)把这个问题留给了作者，作者的要求是按严谨的标准判，结论用“标成选修”的方式落地，不删技能。

## 结论

196 个技能中，**主干 126 个，选修 70 个**：
- 地图上选修技能画虚线框；
- 详情面板写明判定理由；
- 不删任何技能，前置关系不变。

| 领域 | 主干 | 选修 |
|---|---|---|
| 数学·分析 | 7 | 8 |
| 数学·代数离散 | 9 | 6 |
| 数学·概率优化 | 7 | 16 |
| 理论 | 10 | 4 |
| 程序设计 | 20 | 0 |
| 系统与网络 | 16 | 3 |
| 数据 | 10 | 3 |
| 人工智能 | 8 | 10 |
| 安全 | 15 | 2 |
| 硬件与嵌入式 | 9 | 7 |
| 图形与交互 | 8 | 1 |
| 信息系统 | 5 | 2 |
| 交叉前沿 | 2 | 8 |

**上一份报告点名的三类：**

- **研究生层次的纯数学**全部是选修：实分析、测度论、泛函分析、复分析、偏微分方程、动力系统、变分法、微分几何、拓扑、拓扑数据分析、矩阵分析、张量代数、抽象代数。
- **电子硬件**分成两半：
  - 主干：数字逻辑、FPGA、单片机、嵌入式与 RTOS、实时系统、传感器与接口、机器人，以及信号与系统。前七个在 CS2023 的体系结构和“专门平台开发”两个领域里；信号与系统的采样、卷积、频域在图像处理单元里。
  - 主干，但只因为是前置：电路与模拟电子。它是传感器与接口的必须前置。
  - 选修：PCB、VLSI、半导体器件、EDA、控制理论、物联网、边缘计算。
- **信息系统**：
  - 主干：IT 项目管理。CS2023 软件工程的团队协作单元覆盖了进度、估算、风险和利益相关者。
  - 主干，但只因为是前置：信息系统基础。它是 IT 项目管理的必须前置。
  - 选修：信息系统战略、业务流程管理。

**和直觉不同、值得注意的几处：**

- **人工智能有 10 个是选修**。CS2023 只把机器学习基础和深度学习的直观理解列为核心，以下都在 Non-core：
  - 强化学习的 MDP、时序差分、策略梯度（核心里只有“概览”）；
  - 自然语言处理、计算机视觉、语音、推荐系统、学习理论。
- **数学里的选修**：多元积分与向量分析、凸优化、随机过程、马尔可夫链、信息论、博弈论、贝叶斯统计、蒙特卡洛。CS2023 的数学要求只到多元微分、梯度下降和 ODE 欧拉法。
- **系统里的选修**：云计算、GPU 计算、流处理系统。
- **交叉前沿里的主干**：量子计算是体系结构（AR-Quantum）的 KA Core，区块链是密码学（SEC-Crypto）的 KA Core。这两个技能因此不是选修，这一列也不再整体标“选修”。
- **编译原理算主干**，但理由比较窄：CS Core 里有“翻译流水线”的概览，覆盖了词法/语法分析、代码生成与优化。语法分析、语义分析、代码生成这几个单元本身都是 Non-core。

## 依据：CS2023 怎么分核心与选修

CS2023 是 ACM、IEEE-CS 和 AAAI 联合发布的计算机科学课程标准。它的知识体系把每个主题分为三层（见终版报告 1.3 节“Introduction to the Knowledge Model”）：

- **CS Core**：原文是 "topics that every computer science graduate must know"。每个计算机专业都应当覆盖。
- **KA Core**：建议深入学习的主题，各专业可以选择重点。数学（MSF）的主题都定为 KA Core，理由是其他领域的 KA Core 要用到它们。
- **Non-core**：选修（以前的版本叫 elective）。

CS2023 自己把前两层合称“核心主题”，第三层称选修。本项目沿用这个划分：

- 内容落在 CS Core 或 KA Core 的技能，算主干；
- 只落在 Non-core 或 CS2023 没有涉及的，算选修。

## 判定规则

一个技能满足下面任意一条就算主干，否则是选修：

1. **简介里至少一半的知识点**，能在 CS2023 某个知识单元的 CS Core 或 KA Core 主题里找到原文对应。
2. 它是树里**讲授某个 CS Core 主题的技能**。只有组合数学和数理逻辑用到这一条，例如组合数学的“计数、鸽巢原理”。
3. 它是满足 1 或 2 的技能的**必须前置**，沿必须前置链往上推。没学它就学不了主干技能，所以它也属于主干。

**知识点的拆法**：把技能简介按顿号、逗号、分号拆开，和构建脚本的拆法一致。说明性的半句不计入分母，例如“合并两门高度重叠课程名称”“外部前置为分子生物学”。

## 方法

1. **拆原文**：从 CS2023 终版的 Body of Knowledge PDF 里拆出 160 个知识单元，每个主题标明 CS Core、KA Core 或 Non-core。
2. **逐个比对**：对每个技能的每个知识点，在原文里找对应的主题。记下知识单元、层级和一段原文片段，写进 `data/curation/scope.json`。
3. **脚本核对**：`scripts/check_scope.py` 逐条核对两件事：
   - 每段片段确实出现在所引单元的所引层级里；
   - 每个被引的知识点确实在技能简介里。
   我还故意喂了几条错引文做反例测试，比如把 Non-core 的 MDP 写成 KA Core、编造微积分里的 Green 定理，都能被拦下。
4. **构建计算**：`scripts/build.mjs` 按上面三条规则算出主干和选修，写入每个技能的 `optional` 和 `scope` 字段。简介改了而判定没跟着改，构建会直接报错。

**CS Core 覆盖检查**：CS2023 里有 CS Core 主题的知识单元共 85 个。
- 65 个被主干技能直接引用。
- 另外 20 个没被引用，原因是每个知识点只引了一处原文，不是没人讲。这 20 个都由主干技能讲：
  - AI 入门：搜索、规划与约束求解；
  - 数据建模：数据建模、关系模型与 SQL；
  - 事件驱动编程：Web 开发、移动与跨平台开发；
  - HCI 伦理与问责：用户研究、可访问性、计算伦理；
  - 并行算法：共享/分布式内存并行编程；
  - 基础数据结构：数据结构、程序设计基础；
  - 软件验证：软件测试；
  - 安全工程：安全原理；
  - SEP 系列：计算伦理；
  - 系统基础（SF）系列：计算机组成原理、计算机体系结构、操作系统。

## 敏感性与局限

- **阈值敏感**：有 25 个技能正好一半命中。如果规则改成“超过一半”，主干从 126 降到 106，有 20 个会翻成选修，例如：
  - 概率图模型、AI 安全、分布式数据库与 NoSQL、ETL 数据管线；
  - 无穷级数、傅里叶分析、计算几何、离散与组合优化；
  - 区块链、逆向工程、移动与跨平台开发。
  逐个技能表里“简介知识点”一列可以看出哪些在临界线上。
- **只看主题名，不看深度**：CS2023 的不少 KA Core 只要求概览或直观理解。例如深度学习写明“intuition only, no mathematics”，Transformer 只出现在“其他架构”一句里。所以“主干”的意思是“这个方向的入门内容属于 CS 核心”，不代表整个技能的深度都是必修。
- **知识点粒度不均**：简介写得越细，分母越大，越难过半。这一点无法完全消除，所以规则 2 和规则 3 用来兜底。
- **适用范围**：CS2023 是美国主导的国际标准，各国、各校的培养方案会不同。例如国内很多学校把编译原理、计算机网络、信号与系统列为必修。这里只按 CS2023 判，不代表某所学校的要求。

## 逐个技能判定

由 `python -X utf8 -I scripts/check_scope.py --markdown` 生成。“简介知识点”一列是命中数 / 计入的知识点数，“CS2023 依据”一列是引用的知识单元和层级（CS = CS Core，KA = KA Core）。原文片段见 `data/curation/scope.json`。

| 技能 | 判定 | 简介知识点 | CS2023 依据 |
|---|---|---|---|
| M.1.1 极限与连续 | 主干（前置） | 1/4 | MSF-Calculus KA<br>「一元微分学」的必须前置。CS2023 只写到数列、级数与极限，没有连续性和闭区间性质。 |
| M.1.2 一元微分学 | 主干 | 3/4 | MSF-Calculus KA |
| M.1.3 一元积分学 | 主干 | 3/3 | MSF-Calculus KA |
| M.1.4.1 多元微分学 | 主干 | 5/9 | MSF-Calculus KA |
| M.1.4.4 多元积分与向量分析 | 选修 | 0/7 | —<br>CS2023 的微积分只到多元微分，没有重积分、曲线曲面积分和 Green/Gauss/Stokes 定理。 |
| M.1.5 无穷级数 | 主干 | 2/4 | MSF-Calculus KA<br>函数项级数与一致收敛不在 CS2023 里。 |
| M.1.6 实分析 | 选修 | 0/3 | —<br>CS2023 没有实分析。 |
| M.1.6.1 测度论与Lebesgue积分 | 选修 | 0/5 | —<br>CS2023 没有测度论。 |
| M.1.7 泛函分析 | 选修 | 0/4 | —<br>CS2023 没有泛函分析。 |
| M.1.8 复分析 | 选修 | 0/3 | —<br>CS2023 没有复分析。 |
| M.1.9 傅里叶分析与调和分析 | 主干 | 2/4 | GIT-Image KA<br>CS2023 把傅里叶变换和小波作为图像编码工具列在图像处理单元。 |
| M.2.1 常微分方程 | 主干 | 2/4 | MSF-Calculus KA<br>CS2023 只要求 ODE 的定义和欧拉法，不含存在唯一性与线性方程组理论。 |
| M.2.2 偏微分方程 | 选修 | 0/3 | —<br>CS2023 没有偏微分方程理论。 |
| M.2.3 动力系统与混沌 | 选修 | 0/4 | —<br>CS2023 没有动力系统与混沌。 |
| M.2.4 变分法与最优控制数学 | 选修 | 0/3 | —<br>CS2023 没有变分法与最优控制。 |
| M.3.1 线性代数 | 主干 | 6/6 | MSF-Linear CS、MSF-Linear KA |
| M.3.2 矩阵理论与矩阵分析 | 选修 | 1/5 | MSF-Linear KA<br>矩阵范数、扰动和矩阵不等式不在 CS2023 里。 |
| M.3.3 张量代数与多重线性代数 | 选修 | 1/3 | AR-Quantum KA |
| M.3.4 代数结构与抽象代数 | 选修 | 2/5 | SEC-Crypto CS<br>CS2023 只在密码学的数学预备里提到有限域，由密码学技能讲授；群、环、同态不在其中。 |
| M.3.5 数论 | 主干 | 3/4 | MSF-Discrete CS、SEC-Crypto CS、SEC-Crypto KA |
| M.4.1 向量代数与解析几何 | 主干 | 2/4 | GIT-Fundamentals CS、MSF-Linear CS |
| M.4.2 微分几何 | 选修 | 0/5 | —<br>CS2023 没有微分几何。 |
| M.4.3 拓扑学 | 选修 | 0/5 | —<br>CS2023 没有拓扑学。 |
| M.4.4 计算几何与几何处理 | 主干 | 2/4 | GIT-Modeling KA |
| M.4.5 拓扑数据分析与几何学习数学 | 选修 | 0/3 | —<br>CS2023 没有拓扑数据分析。 |
| M.5.1 集合论 | 主干 | 4/5 | MSF-Discrete CS |
| M.5.2 数理逻辑 | 主干 | 2/4 | MSF-Discrete CS；承载 CS Core：MSF-Discrete |
| M.5.3 证明方法与离散结构 | 主干 | 4/6 | AL-Models CS、MSF-Discrete CS |
| M.5.4 组合数学 | 主干 | 2/5 | MSF-Discrete CS；承载 CS Core：MSF-Discrete<br>生成函数、组合设计不在 CS2023 里，但计数与鸽巢原理是 CS Core，树里由这个技能讲。 |
| M.5.5 图论 | 主干 | 4/6 | AL-Foundational CS、AL-Strategies KA、MSF-Discrete CS |
| M.6.1 概率论 | 主干 | 5/5 | MSF-Probability CS |
| M.6.2 数理统计 | 主干 | 5/6 | MSF-Statistics CS、MSF-Statistics KA |
| M.6.2.1 贝叶斯统计 | 选修 | 1/3 | AI-KRR CS<br>层级模型与后验计算不在 CS2023 里。 |
| M.6.2.2 回归与统计建模 | 主干 | 2/3 | AI-ML KA、MSF-Statistics KA |
| M.6.2.3 实验设计与因果推断 | 选修 | 0/5 | —<br>CS2023 的统计单元有假设检验，但没有因果推断。 |
| M.6.2.4 高维统计与统计学习理论 | 选修 | 0/4 | —<br>CS2023 把学习理论列为 AI-ML 的 Non-core。 |
| M.6.3 随机过程 | 选修 | 0/4 | —<br>CS2023 没有随机过程。 |
| M.6.3.1 马尔可夫链 | 选修 | 1/4 | AI-KRR KA<br>平稳分布、混合与遍历性不在 CS2023 里。 |
| M.6.3.2 随机微积分与随机微分方程 | 选修 | 0/3 | —<br>CS2023 没有随机微积分。 |
| M.6.4 时间序列与排队论 | 选修 | 1/4 | NC-Fundamentals CS<br>排队基本概念由网络技能讲；时间序列不在 CS2023 里。 |
| M.6.5 信息论与编码理论 | 选修 | 1/5 | AR-Memory CS<br>熵、互信息、信道容量不在 CS2023 里。 |
| M.7.1 优化建模与运筹基础 | 主干 | 3/5 | AL-Strategies KA、MSF-Calculus KA |
| M.7.2 凸优化 | 选修 | 1/4 | MSF-Calculus KA<br>对偶、KKT、近端与内点法不在 CS2023 里。 |
| M.7.3 非凸优化 | 选修 | 1/4 | MSF-Calculus KA |
| M.7.4 随机优化 | 选修 | 0/4 | —<br>CS2023 有梯度下降，没有随机优化理论。 |
| M.7.5 离散与组合优化 | 主干 | 2/4 | AL-Strategies CS、AL-Strategies KA |
| M.7.6 博弈论与决策理论 | 选修 | 1/4 | AI-KRR KA<br>博弈论在 CS2023 里是 AI 的 Non-core。 |
| M.8.1 误差、稳定性与数值线性代数 | 主干 | 2/4 | AR-Representation CS、PDC-Algorithms KA |
| M.8.2 插值、逼近与数值积分 | 选修 | 0/3 | —<br>CS2023 没有插值与数值积分。 |
| M.8.3 微分方程数值解与科学计算 | 主干 | 2/3 | PDC-Algorithms KA |
| M.8.4 蒙特卡洛方法 | 选修 | 1/4 | MSF-Calculus KA<br>MCMC 在 CS2023 里是 Non-core。 |
| M.8.5 自动微分与计算图 | 选修 | 0/3 | —<br>CS2023 没有自动微分。 |
| M.8.6 符号计算与计算代数 | 选修 | 0/5 | —<br>CS2023 没有符号计算。 |
| F.1.1 数据结构 | 主干 | 7/7 | AL-Foundational CS |
| F.1.2 算法分析与设计 | 主干 | 5/5 | AL-Complexity CS、AL-Complexity KA、AL-Strategies CS |
| F.1.3 图算法与字符串算法 | 主干 | 5/6 | AL-Foundational CS、AL-Foundational KA、AL-Models CS、AL-Strategies KA、SDF-Algorithms CS |
| F.1.4 随机、近似与在线算法 | 主干 | 2/3 | AL-Strategies KA |
| F.1.5 并行、外存与流算法 | 选修 | 1/4 | PDC-Evaluation KA<br>I/O 复杂度、草图与流算法、性质测试不在 CS2023 里。 |
| F.1.6 参数化与细粒度复杂度 | 选修 | 0/5 | —<br>CS2023 没有参数化复杂度和细粒度复杂度。 |
| F.2.1 形式语言与自动机 | 主干 | 3/3 | AL-Models CS |
| F.2.2 可计算性理论 | 主干 | 3/3 | AL-Models CS、AL-Models KA |
| F.2.3 计算复杂性理论 | 主干 | 3/4 | AL-Complexity CS、AL-Models KA |
| F.2.4 计算逻辑与自动定理证明 | 主干 | 2/4 | AL-Complexity CS、PDC-Algorithms KA |
| F.3.1 计算范式与λ演算 | 主干 | 3/3 | AL-Models KA、FPL-Functional CS、FPL-Logic KA |
| F.3.2 类型系统与程序语义 | 主干 | 2/3 | FPL-OOP CS、FPL-Types CS |
| F.3.3 程序验证与模型检查 | 选修 | 2/5 | AL-Models CS、PDC-Evaluation CS<br>Hoare 逻辑、抽象解释、形式语义在 CS2023 里是 FPL 的 Non-core；时序逻辑的安全性/活性由并行与分布式技能讲。 |
| F.3.4 证明助手与形式化数学 | 选修 | 0/3 | —<br>CS2023 没有证明助手。 |
| P.1.1 程序设计基础 | 主干 | 6/6 | SDF-Fundamentals CS |
| P.1.2 面向对象程序设计 | 主干 | 10/11 | FPL-OOP CS、FPL-OOP KA、FPL-Parallel CS、FPL-Types CS、SDF-Fundamentals CS |
| P.1.3 函数式、逻辑式与声明式编程 | 主干 | 4/4 | FPL-Functional CS、FPL-Logic KA |
| P.1.4 高级程序设计 | 主干 | 3/4 | FPL-OOP KA、FPL-Parallel CS、FPL-Systems CS |
| P.2.2 C/C++与底层编程 | 主干 | 4/4 | AR-Assembly KA、FPL-Systems CS、OS-Process KA |
| P.2.3 Python与科学计算工具 | 主干 | 2/4 | FPL-Scripting CS |
| P.2.4 版本控制、调试与构建工具 | 主干 | 5/5 | SDF-Practices CS、SE-Tools CS、SE-Tools KA |
| P.3.1 编译原理 | 主干 | 3/4 | FPL-Translation CS<br>CS2023 的 CS Core 只有翻译流水线概览，语法分析、语义分析、代码生成各单元是 Non-core。 |
| P.3.2 运行时、虚拟机与内存管理 | 主干 | 4/5 | FPL-Systems CS、FPL-Translation CS |
| P.4.1 软件工程基础与开发方法 | 主干 | 2/4 | SE-Design CS、SE-Teamwork CS<br>CS2023 没有单列开发过程模型（敏捷、迭代）。 |
| P.4.2 需求工程与领域建模 | 主干 | 3/5 | SE-Design KA、SE-Requirements KA |
| P.4.3 软件设计与面向对象分析设计 | 主干 | 4/5 | DM-Modeling KA、SE-Design CS、SE-Design KA、SE-Refactoring KA |
| P.4.4 软件架构 | 主干 | 3/4 | SE-Design CS、SE-Design KA |
| P.4.5 软件测试、质量与可靠性 | 主干 | 3/4 | SE-Construction CS、SE-Construction KA、SE-Reliability KA、SE-Validation KA |
| P.4.6 软件维护、演化与技术债 | 主干 | 3/5 | SE-Construction KA、SE-Design CS、SE-Refactoring KA |
| P.5.1 互联网与Web开发 | 主干 | 6/6 | NC-Applications CS、SPD-Web KA |
| P.5.2 移动、桌面与跨平台开发 | 主干 | 2/4 | SPD-Mobile KA |
| P.5.3 DevOps、持续交付与SRE | 主干 | 4/6 | SE-Construction KA、SE-Reliability KA、SE-Tools CS、SE-Tools KA |
| P.5.4 软件供应链与可复现构建 | 主干 | 2/4 | SE-Tools KA、SEC-Coding KA、SEC-Engineering KA |
| C.1.1 计算机组成原理 | 主干 | 4/5 | AR-Assembly CS、AR-IO CS、AR-Memory CS、AR-Organization KA、AR-Representation CS |
| C.1.2 计算机体系结构 | 主干 | 5/5 | AR-Assembly KA、AR-Memory CS、AR-Organization KA、AR-Performance-Energy KA |
| C.1.3 ARM与其他指令集体系 | 主干 | 4/4 | AR-Assembly KA |
| C.1.4 GPU、加速器与异构系统 | 主干 | 3/4 | AR-Heterogeneity KA |
| C.2.1 操作系统 | 主干 | 6/6 | OS-Concurrency CS、OS-Devices KA、OS-Files KA、OS-Memory KA、OS-Scheduling KA |
| C.2.2 系统编程与并发同步 | 主干 | 5/5 | FPL-Parallel KA、OS-Concurrency KA、OS-Principles CS、OS-Process KA、PDC-Coordination CS |
| C.2.3 虚拟化、容器与资源管理 | 主干 | 3/4 | OS-Virtualization KA、SF-Resource CS |
| C.2.4 存储系统与文件系统 | 主干 | 4/5 | OS-Advanced-Files KA、OS-Devices KA、OS-Faults KA |
| C.3.1 数据通信与信号基础 | 主干 | 5/5 | GIT-Fundamentals CS、NC-Reliability KA、NC-SingleHop KA |
| C.3.2 网络协议、路由与传输 | 主干 | 4/4 | NC-Applications CS、NC-Fundamentals CS、NC-Reliability KA、NC-Routing KA |
| C.3.3 无线、移动与物联网网络 | 主干 | 3/3 | NC-Mobility KA |
| C.3.4 网络管理、SDN与可编程网络 | 主干 | 2/4 | NC-Emerging KA |
| C.4.1 分布式系统 | 主干 | 6/6 | DM-Internals KA、FPL-Parallel CS、PDC-Communication KA、PDC-Coordination CS、PDC-Coordination KA、PDC-Programs CS |
| C.4.2 云计算 | 选修 | 2/5 | PDC-Programs KA、SPD-Web KA<br>多租户、编排、无服务器不在 CS2023 的核心主题里（无服务器在 SPD-Web 的 Non-core）。 |
| C.4.3 分布式算法与一致性理论 | 主干 | 2/4 | PDC-Communication KA、PDC-Programs CS |
| C.4.4 消息、事件与流处理系统 | 选修 | 1/5 | PDC-Communication CS<br>事件时间、重放、背压等流处理内容不在 CS2023 里。 |
| C.5.1 共享/分布式内存并行编程 | 主干 | 4/4 | FPL-Parallel CS、PDC-Communication CS、PDC-Evaluation CS、PDC-Programs KA |
| C.5.2 GPU计算与性能优化 | 选修 | 2/5 | PDC-Communication CS、PDC-Coordination CS<br>核函数编写、算子融合与性能剖析不在 CS2023 的核心主题里。 |
| C.5.3 高性能科学计算 | 主干 | 3/4 | PDC-Algorithms KA、PDC-Evaluation CS |
| D.1.1 数据建模、关系模型与SQL | 主干 | 5/5 | DM-Core CS、DM-Modeling KA、DM-Querying CS、DM-Querying KA、DM-Relational CS |
| D.1.2 数据库内核与查询优化 | 主干 | 5/5 | DM-Internals KA、DM-Processing KA |
| D.1.3 分布式数据库与NoSQL | 主干 | 2/4 | DM-Internals KA、DM-NoSQL KA<br>分片与复制在 CS2023 里是 DM 的 Non-core。 |
| D.1.4 数据库管理与安全 | 主干 | 4/5 | DM-Internals KA、DM-Security CS、DM-Security KA |
| D.1.5 数据治理、元数据与质量 | 主干 | 4/5 | DM-Data CS、DM-SEP CS、DM-SEP KA |
| D.2.1 ETL/ELT与数据管线 | 主干 | 3/6 | AI-ML CS、DM-Analytics KA |
| D.2.2 大数据管理与处理 | 主干 | 3/4 | DM-Core CS、DM-Core KA、DM-Processing KA |
| D.2.3 搜索、信息检索与推荐基础设施 | 选修 | 0/4 | —<br>信息检索在 CS2023 里是 AI-NLP 和 DM 的 Non-core。 |
| D.3.1 数据科学导论与工具箱 | 主干 | 4/6 | AI-ML CS、DM-Analytics KA |
| D.3.2 知识发现与数据挖掘 | 主干 | 3/5 | DM-Analytics KA |
| D.3.3 评估、实验与可复现分析 | 主干 | 3/5 | AI-ML CS、AI-ML KA、MSF-Statistics KA |
| D.4.1 知识表示、知识图谱与本体 | 选修 | 0/5 | —<br>本体在 CS2023 里是 AI-LRR 的 Non-core。 |
| D.4.2 知识推理与语义计算 | 选修 | 0/3 | —<br>描述逻辑与规则推理在 CS2023 里是 AI-LRR 的 Non-core。 |
| A.1.1 搜索、规划与约束求解 | 主干 | 3/4 | AI-Search CS、AI-Search KA |
| A.1.2 概率图模型与不确定推理 | 主干 | 2/4 | AI-KRR CS<br>Markov 网络、结构学习在 CS2023 里是 Non-core。 |
| A.2.1 监督、无监督与半监督学习 | 主干 | 5/5 | AI-ML CS、MSF-Statistics KA |
| A.2.2 学习理论与泛化 | 选修 | 1/4 | AI-ML CS<br>PAC/VC 与泛化界在 CS2023 里是 AI-ML 的 Non-core。 |
| A.2.3 深度学习 | 主干 | 3/4 | AI-ML CS、AI-ML KA |
| A.2.3.1 网络架构与表示学习 | 主干 | 4/6 | AI-ML KA<br>CS2023 的核心只要求直观理解，带数学的深度学习是 Non-core。 |
| A.2.3.2 深度模型训练与推理系统 | 选修 | 0/6 | —<br>ML 硬件与训练系统在 CS2023 里是 AI-ML 的 Non-core。 |
| A.2.4 强化学习 | 选修 | 1/5 | AI-ML KA<br>MDP、时序差分、策略梯度在 CS2023 里是 AI-ML 的 Non-core，核心只有概览。 |
| A.2.5 迁移、多任务与联邦学习 | 选修 | 0/4 | —<br>CS2023 没有迁移学习与联邦学习。 |
| A.3.1 自然语言处理 | 选修 | 1/5 | AI-ML CS<br>自然语言处理整个单元在 CS2023 里是 Non-core。 |
| A.3.2 图像处理与计算机视觉 | 选修 | 3/7 | GIT-Image KA<br>识别、检测、分割属于计算机视觉单元，在 CS2023 里是 Non-core。 |
| A.3.3 语音与音频智能 | 选修 | 0/4 | —<br>语音识别在 CS2023 里是 AI-Vision 的 Non-core。 |
| A.3.4 推荐系统 | 选修 | 0/5 | —<br>推荐系统在 CS2023 里是 AI-ML 的 Non-core。 |
| A.3.5 生成式AI | 主干 | 4/5 | AI-SEP CS、AI-SEP KA |
| A.4.1 机器学习工程与MLOps | 选修 | 0/5 | —<br>CS2023 没有 MLOps。 |
| A.4.2 可信AI、可解释性与公平性 | 主干 | 3/5 | AI-SEP CS |
| A.4.3 AI安全与模型系统安全 | 主干 | 2/4 | SEC-Foundations KA、SEC-SEP CS |
| A.4.4 多智能体强化学习 | 选修 | 0/4 | —<br>多智能体与博弈在 CS2023 里是 AI-Agents 的 Non-core。 |
| S.1.1 安全原理、威胁建模与风险 | 主干 | 4/4 | SEC-Foundations CS |
| S.1.2 密码学 | 主干 | 4/6 | SEC-Crypto CS、SEC-Crypto KA |
| S.1.3 现代密码与隐私计算专题 | 主干 | 3/4 | SEC-Crypto KA |
| S.2.1 计算机系统安全 | 主干 | 6/6 | OS-Protection CS、OS-Protection KA、OS-Purpose CS、OS-Virtualization KA、SEC-Coding CS、SEC-Engineering KA |
| S.2.2 网络安全 | 主干 | 4/5 | NC-Security KA |
| S.2.3 无线与移动安全 | 主干 | 2/4 | SEC-Foundations KA、SPD-Mobile KA |
| S.2.4 云安全与容器安全 | 选修 | 1/6 | SEC-Foundations KA<br>多租户、控制平面、镜像与编排安全不在 CS2023 里（容器逃逸在 OS 的 Non-core）。 |
| S.2.5 硬件、嵌入式与物联网安全 | 主干 | 3/5 | OS-Purpose CS、SEC-Crypto KA、SEC-Engineering KA |
| S.3.1 应用、Web与API安全 | 主干 | 4/4 | SEC-Coding CS、SEC-Foundations CS、SEC-Foundations KA |
| S.3.2 安全软件开发与程序分析 | 主干 | 4/4 | SE-Validation KA、SEC-Coding KA、SEC-Engineering KA |
| S.3.3 数据安全、隐私工程与访问控制 | 主干 | 5/6 | AL-SEP CS、DM-SEP CS、DM-Security KA、SEC-Foundations CS、SEC-SEP CS |
| S.4.1 渗透测试、道德黑客与反制 | 主干 | 3/5 | SEC-Coding KA、SEC-Governance KA |
| S.4.2 计算机取证与事件响应 | 主干 | 3/5 | SEC-Forensics KA |
| S.4.3 逆向工程与恶意软件分析 | 主干 | 2/4 | SEC-Coding KA |
| S.4.4 安全运营、检测与攻防评估 | 选修 | 2/5 | NC-Security KA、SEC-Governance KA<br>日志关联、威胁情报、攻防演练不在 CS2023 里。 |
| S.5.1 协议验证与信息流安全 | 主干 | 2/4 | SEC-Coding KA、SEC-Crypto KA |
| S.5.2 系统安全研究与安全测量 | 主干 | 2/4 | OS-Protection CS、SEC-Coding CS |
| H.1.1 电路与模拟电子基础 | 主干（前置） | 0/6 | —<br>「传感器与接口」的必须前置。CS2023 没有电路与模拟电子（只在物理计算单元的学习成果里让学生接一个简单电路）。 |
| H.1.2 数字电路与数字逻辑 | 主干 | 5/5 | AR-Logic KA、SF-Foundations CS |
| H.1.3 信号与系统、数字信号处理 | 主干 | 4/5 | GIT-Fundamentals CS、GIT-Image KA |
| H.2.1 FPGA与Verilog/HDL | 主干 | 4/5 | AR-Logic KA |
| H.2.2 EDA与硬件验证 | 选修 | 2/5 | AR-Logic KA<br>形式验证、布局布线不在 CS2023 里。 |
| H.2.3 PCB设计与板级工程 | 选修 | 0/5 | —<br>CS2023 没有 PCB 设计。 |
| H.2.4 VLSI与芯片设计 | 选修 | 1/4 | AR-Logic KA<br>CMOS 与物理设计不在 CS2023 里。 |
| H.2.5 半导体器件与微电子基础 | 选修 | 0/3 | —<br>CS2023 没有半导体器件。 |
| H.3.1 单片机与微控制器 | 主干 | 5/6 | AR-IO CS、OS-Scheduling KA、SPD-Common CS、SPD-Embedded KA |
| H.3.2 嵌入式系统、驱动与RTOS | 主干 | 4/6 | OS-Devices KA、OS-Real-time KA、SPD-Embedded KA |
| H.3.3 传感器与接口 | 主干 | 3/6 | AR-IO CS、GIT-Physical KA、SPD-Embedded KA |
| H.3.4 实时系统与安全关键系统 | 主干 | 3/4 | OS-Real-time KA、SPD-Embedded KA |
| H.4.1 控制理论与状态估计 | 选修 | 0/5 | —<br>CS2023 没有控制理论与状态估计。 |
| H.4.2 机器人建模、规划与控制 | 主干 | 3/4 | SPD-Robot KA<br>定位建图在 CS2023 里是 AI-Robotics 的 Non-core。 |
| H.4.3 物联网 | 选修 | 2/6 | GIT-Physical KA、NC-Mobility KA<br>物联网平台、设备管理与功耗不在 CS2023 的核心主题里。 |
| H.4.4 边缘计算 | 选修 | 1/5 | NC-Applications CS<br>CS2023 只在网络应用范式里提到边缘计算。 |
| V.1.1 计算机图形学 | 主干 | 6/6 | GIT-Animation KA、GIT-Rendering KA、GIT-Simulation KA、MSF-Linear KA |
| V.1.2 多媒体技术 | 选修 | 2/5 | GIT-Fundamentals CS、GIT-Image KA<br>容器、同步与媒体传输不在 CS2023 里；图像格式与数字化的 CS Core 主题由图形学技能讲。 |
| V.1.3 渲染、仿真与可微图形专题 | 主干 | 3/4 | GIT-Shading KA、GIT-Simulation KA |
| V.2.1 交互基础与认知、人因 | 主干 | 3/5 | HCI-User KA |
| V.2.2 用户研究、交互设计与UX评估 | 主干 | 5/5 | HCI-Design CS、HCI-Design KA、HCI-Evaluation CS、HCI-User CS |
| V.2.3 可访问性与包容性设计 | 主干 | 3/3 | HCI-Accessibility CS、HCI-Accessibility KA |
| V.2.4 XR、空间交互与协作系统 | 主干 | 5/5 | GIT-Immersion KA |
| V.3.1 数据可视化与交互设计 | 主干 | 5/5 | GIT-Visualization KA、HCI-Design KA |
| V.3.2 科学可视化与可视分析 | 主干 | 3/4 | GIT-Visualization KA |
| I.1.1 信息系统基础 | 主干（前置） | 0/3 | —<br>「信息技术项目管理」的必须前置。CS2023 没有信息系统（它属于 IS 学科的课程标准）。 |
| I.1.2 信息系统战略与管理 | 选修 | 0/5 | —<br>CS2023 没有 IT 战略与治理。 |
| I.1.3 业务流程管理 | 选修 | 0/5 | —<br>CS2023 没有业务流程管理。 |
| I.1.4 信息技术项目管理 | 主干 | 5/7 | SE-Requirements KA、SE-Teamwork CS、SE-Teamwork KA、SEP-Professional-Ethics KA<br>CS2023 在软件工程的团队协作单元里覆盖了进度、估算、风险和利益相关者。 |
| I.2.1 计算伦理、社会影响与专业责任 | 主干 | 5/5 | AL-SEP CS、SEP-IP CS、SEP-Privacy CS、SEP-Professional-Ethics CS、SEP-Sustainability CS |
| I.2.2 技术写作、协作与文献阅读 | 主干 | 3/5 | SE-Teamwork CS、SEP-Communication CS |
| I.2.3 研究设计、可复现性与学术规范 | 主干 | 4/6 | HCI-Evaluation KA、SDF-SEP CS、SE-Validation KA |
| X.1.1 嵌入式与边缘AI | 选修 | 2/6 | AR-Heterogeneity KA、NC-Applications CS |
| X.1.3 自动驾驶与自主系统 | 选修 | 2/6 | OS-Real-time KA、SPD-Robot KA<br>感知与定位在 CS2023 里是 AI-Vision、AI-Robotics 的 Non-core。 |
| X.2.1 生物信息与计算生物学 | 选修 | 0/3 | —<br>CS2023 没有生物信息学。 |
| X.2.2 金融科技与计算金融 | 选修 | 0/4 | —<br>CS2023 没有金融科技。 |
| X.2.3 教育科技与学习科学计算 | 选修 | 0/4 | —<br>CS2023 没有教育科技。 |
| X.2.4 医疗健康信息学 | 选修 | 0/3 | —<br>CS2023 只在 AI 应用里举医疗为例，没有医疗信息学。 |
| X.2.5 地理空间数据科学 | 选修 | 0/5 | —<br>地理空间数据在 CS2023 里是 DM-Modeling 的 Non-core。 |
| X.3.1 量子计算与量子信息 | 主干 | 4/4 | AR-Quantum KA<br>CS2023 把量子体系结构列为 AR 的 KA Core。 |
| X.3.2 区块链与分布式账本 | 主干 | 2/4 | SEC-Crypto KA<br>CS2023 把区块链列为密码学的 KA Core；共识算法本身是 Non-core。 |
| X.3.3 科学机器学习与可微仿真 | 选修 | 0/4 | —<br>CS2023 没有科学机器学习。 |
| P.5.5 游戏开发与游戏引擎 | 主干 | 5/7 | GIT-Animation KA、GIT-Simulation KA、SPD-Game KA |
