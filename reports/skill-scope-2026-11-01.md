# 技能范围判定：主干与选修（对照 CS2023）

2026-11-01，v1.3.0。当前 192 个学习单元，**主干 121、选修 71**。这是项目对 CS2023 的主题映射与学习路线设计，不是 CS2023 对这些自定义技能的官方认证，也不是各学校共同的必修课表。

## 依据与规则

依据 [CS2023 最终报告](https://csed.acm.org/final-report/) 的 Body of Knowledge，使用 CS Core 和 KA Core 两层主题。简称“主干”只表示本树选择的基础路线，不表示技能里每个高级主题都属于共同必修。

1. 技能简介按顿号、逗号、分号和句号拆为知识项，剔除明确的定位说明；至少一半能对应 CS Core/KA Core 原文则为主干。
2. 明确承载 CS Core 主题的基础模块也算主干。
3. 这些单元的必须前置沿链补入主干。其余列选修，不删除。

逐条原文与知识单元编号存在 `data/curation/scope.json`。`check_scope.py` 校验引用属于正确单元/层级、知识项来自当前简介。脚本命中只证明引用存在，不自动证明语义映射完整或学习深度相同。

## 当前各领域

| 领域 | 主干 | 选修 |
|---|---:|---:|
| 数学 · 微积分、分析与微分方程 | 7 | 8 |
| 数学 · 代数、几何与离散数学 | 8 | 7 |
| 数学 · 概率统计、优化与数值计算 | 7 | 17 |
| 理论计算机科学 | 9 | 4 |
| 程序设计与软件工程 | 19 | 0 |
| 计算机系统与网络 | 16 | 2 |
| 数据管理与数据科学 | 8 | 3 |
| 人工智能与机器学习 | 8 | 10 |
| 网络空间安全 | 15 | 2 |
| 电子硬件、嵌入式与控制 | 9 | 7 |
| 图形、多媒体与人机交互 | 8 | 1 |
| 信息系统、组织与专业实践 | 5 | 2 |
| 交叉应用与前沿专题 | 2 | 8 |

## 敏感性与限制

若把“至少一半”改为“超过一半”，主干会从 121 变为 104；这说明边界受阈值与简介拆项影响。KA Core 中不少主题只要求概览，不能据此声称整个高级技能都要学完。条目写得更细也会改变分母；基础模块和依赖闭包是项目自己的补充规则。

本轮收窄后的计算几何与硬件验证不再因为曲面处理或综合工具的旧映射而被泛化。详细改动见[技能划分检查](skill-partition-review-2026-11-01.md)。旧版 126/70 的统计仅属于 v1.2.0。

## 逐技能判定

CS = CS Core，KA = KA Core；分数为匹配项数/计入项数。原文片段见源数据。


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
| M.1.9 傅里叶分析 | 主干 | 2/4 | GIT-Image KA<br>CS2023 图像处理列 Fourier transforms；严格收敛理论与一般正交展开不属于其核心深度。 |
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
| M.4.4 计算几何 | 选修 | 0/5 | —<br>本技能聚焦离散计算几何算法；CS2023 核心中的图形曲面表示不能代替凸包、范围搜索与空间分解课程，故列选修。 |
| M.4.5 拓扑数据分析 | 选修 | 0/4 | —<br>CS2023 没有拓扑数据分析的核心主题。 |
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
| M.6.4 时间序列分析 | 选修 | 0/5 | —<br>CS2023 没有时间序列分析。 |
| M.6.5 信息论与编码理论 | 选修 | 1/5 | AR-Memory CS<br>熵、互信息、信道容量不在 CS2023 里。 |
| M.7.1 优化建模与运筹基础 | 主干 | 3/5 | AL-Strategies KA、MSF-Calculus KA |
| M.7.2 凸优化 | 选修 | 1/4 | MSF-Calculus KA<br>对偶、KKT、近端与内点法不在 CS2023 里。 |
| M.7.3 非凸优化 | 选修 | 1/4 | MSF-Calculus KA |
| M.7.4 随机优化 | 选修 | 0/4 | —<br>CS2023 有梯度下降，没有随机优化理论。 |
| M.7.5 离散与组合优化 | 主干 | 2/4 | AL-Strategies CS、AL-Strategies KA |
| M.7.6 博弈论 | 选修 | 0/4 | —<br>CS2023 博弈论与机制设计不是核心主题；不把强化学习中的决策概览当作整门博弈论。 |
| M.8.1 误差、稳定性与数值线性代数 | 主干 | 2/4 | AR-Representation CS、PDC-Algorithms KA |
| M.8.2 插值、逼近与数值积分 | 选修 | 0/3 | —<br>CS2023 没有插值与数值积分。 |
| M.8.3 微分方程数值解与科学计算 | 主干 | 2/3 | PDC-Algorithms KA |
| M.8.4 蒙特卡洛方法 | 选修 | 1/4 | MSF-Calculus KA<br>MCMC 在 CS2023 里是 Non-core。 |
| M.8.5 自动微分与计算图 | 选修 | 0/3 | —<br>CS2023 没有自动微分。 |
| M.8.6 符号计算与计算代数 | 选修 | 0/5 | —<br>CS2023 没有符号计算。 |
| F.1.1 数据结构 | 主干 | 7/7 | AL-Foundational CS |
| F.1.2 算法分析与设计 | 主干 | 9/9 | AL-Complexity CS、AL-Complexity KA、AL-Foundational CS、AL-Foundational KA、AL-Strategies CS、AL-Strategies KA、SDF-Algorithms CS |
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
| P.5.2 移动应用开发 | 主干 | 2/4 | SPD-Mobile KA |
| P.5.3 DevOps、持续交付与SRE | 主干 | 6/8 | SE-Construction KA、SE-Reliability KA、SE-Tools CS、SE-Tools KA、SEC-Engineering KA |
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
| C.3.4 SDN与可编程网络 | 主干 | 2/3 | NC-Emerging KA<br>网络管理限定为 SDN 的配置和自动化。 |
| C.4.1 分布式系统 | 主干 | 6/6 | DM-Internals KA、FPL-Parallel CS、PDC-Communication KA、PDC-Coordination CS、PDC-Coordination KA、PDC-Programs CS |
| C.4.2 云计算 | 选修 | 2/5 | PDC-Programs KA、SPD-Web KA<br>多租户、编排、无服务器不在 CS2023 的核心主题里（无服务器在 SPD-Web 的 Non-core）。 |
| C.4.3 分布式算法与一致性理论 | 主干 | 2/4 | PDC-Communication KA、PDC-Programs CS |
| C.5.1 共享/分布式内存并行编程 | 主干 | 4/4 | FPL-Parallel CS、PDC-Communication CS、PDC-Evaluation CS、PDC-Programs KA |
| C.5.2 GPU计算与性能优化 | 选修 | 2/5 | PDC-Communication CS、PDC-Coordination CS<br>核函数编写、算子融合与性能剖析不在 CS2023 的核心主题里。 |
| C.5.3 高性能科学计算 | 主干 | 3/4 | PDC-Algorithms KA、PDC-Evaluation CS |
| D.1.1 数据建模、关系模型与SQL | 主干 | 5/5 | DM-Core CS、DM-Modeling KA、DM-Querying CS、DM-Querying KA、DM-Relational CS |
| D.1.2 数据库内核与查询优化 | 主干 | 5/5 | DM-Internals KA、DM-Processing KA |
| D.1.3 分布式数据库与NoSQL | 主干 | 2/4 | DM-Internals KA、DM-NoSQL KA<br>分片与复制在 CS2023 里是 DM 的 Non-core。 |
| D.1.4 数据库管理与安全 | 主干 | 4/5 | DM-Internals KA、DM-Security CS、DM-Security KA |
| D.1.5 数据治理、元数据与质量 | 主干 | 4/5 | DM-Data CS、DM-SEP CS、DM-SEP KA |
| D.2.2 数据工程与大数据处理 | 主干 | 7/10 | AI-ML CS、DM-Analytics KA、DM-Core CS、DM-Core KA、DM-Processing KA、PDC-Coordination CS<br>数据湖/仓、调度与数据验证、背压等工程内容不在 CS2023 的核心主题里。 |
| D.2.3 搜索与信息检索系统 | 选修 | 0/4 | —<br>信息检索在 CS2023 里是 AI-NLP 和 DM 的 Non-core。 |
| D.3.1 数据科学导论与工具箱 | 主干 | 7/11 | AI-ML CS、AI-ML KA、DM-Analytics KA、MSF-Statistics KA |
| D.3.2 知识发现与数据挖掘 | 主干 | 3/5 | DM-Analytics KA |
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
| A.2.5 联邦学习 | 选修 | 0/3 | —<br>CS2023 没有联邦学习的核心主题。 |
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
| S.2.2 网络安全 | 主干 | 4/6 | NC-Security KA |
| S.2.3 移动应用与设备安全 | 主干 | 2/4 | SEC-Foundations KA、SPD-Mobile KA<br>移动平台安全属于核心；这里的设备身份和应用测试按移动上下文学习，不延伸到无线协议安全课程。 |
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
| H.1.3 信号与系统 | 主干 | 4/6 | GIT-Fundamentals CS、GIT-Image KA |
| H.2.1 FPGA与Verilog/HDL | 主干 | 4/5 | AR-Logic KA |
| H.2.2 硬件设计验证 | 选修 | 0/5 | —<br>硬件验证的专门仿真、UVM 与形式方法超出 CS2023 硬件描述与设计工具的概览，列选修。 |
| H.2.3 PCB设计与板级工程 | 选修 | 0/5 | —<br>CS2023 没有 PCB 设计。 |
| H.2.4 VLSI与芯片设计 | 选修 | 1/5 | AR-Logic KA<br>CMOS 标准单元与芯片物理设计的深入课程超出 CS2023 核心硬件概览。 |
| H.2.5 半导体器件与微电子基础 | 选修 | 0/3 | —<br>CS2023 没有半导体器件。 |
| H.3.1 单片机与微控制器 | 主干 | 5/6 | AR-IO CS、OS-Scheduling KA、SPD-Common CS、SPD-Embedded KA |
| H.3.2 嵌入式系统、驱动与RTOS | 主干 | 4/6 | OS-Devices KA、OS-Real-time KA、SPD-Embedded KA |
| H.3.3 传感器与接口 | 主干 | 3/6 | AR-IO CS、GIT-Physical KA、SPD-Embedded KA |
| H.3.4 实时系统 | 主干 | 2/4 | OS-Real-time KA、SPD-Embedded KA |
| H.4.1 控制理论与状态估计 | 选修 | 0/5 | —<br>CS2023 没有控制理论与状态估计。 |
| H.4.2 机器人建模、规划与控制 | 主干 | 3/4 | SPD-Robot KA<br>定位建图在 CS2023 里是 AI-Robotics 的 Non-core。 |
| H.4.3 物联网 | 选修 | 2/6 | GIT-Physical KA、NC-Mobility KA<br>物联网平台、设备管理与功耗不在 CS2023 的核心主题里。 |
| H.4.4 边缘计算 | 选修 | 1/5 | NC-Applications CS<br>CS2023 只在网络应用范式里提到边缘计算。 |
| V.1.1 计算机图形学 | 主干 | 6/6 | GIT-Animation KA、GIT-Rendering KA、GIT-Simulation KA、MSF-Linear KA |
| V.1.2 多媒体技术 | 选修 | 2/5 | GIT-Fundamentals CS、GIT-Image KA<br>容器、同步与媒体传输不在 CS2023 里；图像格式与数字化的 CS Core 主题由图形学技能讲。 |
| V.1.3 物理与可微渲染 | 主干 | 2/3 | GIT-Shading KA |
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
| I.2.2 技术沟通与写作 | 主干 | 3/5 | SEP-Communication CS |
| I.2.3 研究设计、可复现性与学术规范 | 主干 | 4/6 | HCI-Evaluation KA、SDF-SEP CS、SE-Validation KA |
| X.1.1 嵌入式与边缘AI | 选修 | 2/6 | AR-Heterogeneity KA、NC-Applications CS |
| X.1.3 自动驾驶与自主系统 | 选修 | 2/6 | OS-Real-time KA、SPD-Robot KA<br>感知与定位在 CS2023 里是 AI-Vision、AI-Robotics 的 Non-core。 |
| X.2.1 生物信息与计算生物学 | 选修 | 0/3 | —<br>CS2023 没有生物信息学。 |
| X.2.2 计算金融 | 选修 | 0/3 | —<br>CS2023 没有计算金融的核心主题。 |
| X.2.3 教育科技与学习科学计算 | 选修 | 0/4 | —<br>CS2023 没有教育科技。 |
| X.2.4 医疗健康信息学 | 选修 | 0/3 | —<br>CS2023 只在 AI 应用里举医疗为例，没有医疗信息学。 |
| X.2.5 地理空间数据科学 | 选修 | 0/5 | —<br>地理空间数据在 CS2023 里是 DM-Modeling 的 Non-core。 |
| X.3.1 量子计算与量子信息 | 主干 | 4/4 | AR-Quantum KA<br>CS2023 把量子体系结构列为 AR 的 KA Core。 |
| X.3.2 区块链与分布式账本 | 主干 | 2/4 | SEC-Crypto KA<br>CS2023 把区块链列为密码学的 KA Core；共识算法本身是 Non-core。 |
| X.3.3 科学机器学习与可微仿真 | 选修 | 0/4 | —<br>CS2023 没有科学机器学习。 |
| P.5.5 游戏开发与游戏引擎 | 主干 | 5/7 | GIT-Animation KA、GIT-Simulation KA、SPD-Game KA |
| M.6.6 排队论与性能建模 | 选修 | 2/6 | NC-Fundamentals CS、PDC-Communication KA<br>CS2023 只要求排队的基本概念，以及在并行与分布式计算里用排队论预测性能；Kendall 记号、排队网络、均值分析不在其中。 |
