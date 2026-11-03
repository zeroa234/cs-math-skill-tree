# 数据中心与高性能网络增补

2026-11-03。用户要求只参考相邻 `cs-math-skill-game` 新增的技能，不回退当前 tree 的结构。

## 对比与范围

逐 ID 比对 game 的 183 个技能与 tree 的 192 个技能：game 独有的技能只有 **C.3.5 数据中心与高性能网络**。其余差异为 tree 原有的 10 个 X 领域技能；本轮保留。新增后为 193 个技能。

沿用现有 `partition.json` 的新增节点机制和课程、先修、范围、练习、双语路线、知识导览的数据格式。通过现有构建生成网页与导出数据，不引入另一套游戏版数据模型。

## 课程依据与边界

- [KTH FIK3221 Networked Systems for Machine Learning](https://www.kth.se/student/kurser/kurs/FIK3221?l=en)：官方课纲明确列 RDMA、DPDK、内核旁路、SmartNIC 和 GPU 网络；先修为高级互联网技术 IK2215 与程序设计。博士课程的研究与论文要求不等于本节点入门层的学习目标。
- [UW CSE 561](https://courses.cs.washington.edu/courses/cse561/) 明确要求 CSE 451（操作系统）或等价基础；[2026 秋课表](https://courses.cs.washington.edu/courses/cse561/26au/) 含数据中心拓扑、集合通信、ML 网络与端主机栈。
- RDMA 的三种承载方式、无损网络与拥塞控制、DPDK/零拷贝、SmartNIC 卸载、GPU 互连各用对应资料核对。NVLink 属 GPU 互连，不归入 InfiniBand/RoCE/iWARP 的 RDMA 承载分类；零拷贝、内核旁路和硬件卸载分开解释。
- KTH 未要求操作系统课，不能说所有学校统一如此；本节点 OS 必须边采用 UW 的直接证据，并说明内存注册、内核网络栈和用户态驱动的入门需要。

## 资料与验证

三项联网 pi 子任务分别检索课程/范围、双语教学和原文目录；主代理核对、整合与运行检查。详细结果实施后补充。
