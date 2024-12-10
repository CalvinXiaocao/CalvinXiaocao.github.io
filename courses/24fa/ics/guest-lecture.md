# Guest Lecture
ICS, Lecture 19, Fall 2024

## Evolution of Large-scale Models
Increasing Model Scales with new turning points: 100B $\to$ 1T $\to$ 10T, **Dense** $\to$ **Sparse**

* 扩展模型的参数量从而扩展能力（模型的数据量发展速度特别快。对计算资源需求增加，算力约束很难逾越）
* 稠密模型到稀疏模型。稀疏：**MOE**
  * MOE：组合多个“专家模型”，统一完成特定任务，而不是统一交给一个大模型，从而降低每个“专家”的参数量
* 探索除了文本领域之外的其他领域应用，发展出**多模态**模型
  * 多模态：多种模式的输入数据，解决更复杂的问题 (eg: gpt-4o)
* 模型能力向长序列扩进
  * 上下文窗口，捕获全局信息，降低幻觉发生 (eg: gpt-4 turbo)

### 大模型的发展三定律
* The first law: Scaling Law 缩放定律
  * Training Scaling Law 模型参数越多，训练数据集越多，性能越好
  * RL Scaling Law 自我对弈强化学习，轮次越多，越能提高性能
  * Inference Scaling Law 更多轮次思考，答案更加准确
* The second law: Chinchilla Law
  * 模型规模和训练token要同步增长
* The third law: Emergent Abilities
  * 智力的增长
### Scaling Law Continues and drives Q* to more parameters
突破数据墙的壁垒：应用Q*强化学习，从数据驱动转向计算能力驱动

### 影响模型能力的多个因素
* 数据集的质量
* 参数的数目
* 序列的长度
* 多模态
* MOE（决定大模型处理复杂任务的能力）

算力是支撑这些因素的关键

Computing Power scale $\approx$ Amount of parameters * Amount of data / Training Time


## Challenges and Trends for AI computing systems
### Supercomputer Data Center: Stargete
Microsoft & Openai

"The entrance to future, the path to discovery"

### Challenge?
* Performance 性能
  * Chip Design 希望高性能的NPU & GPU，提高性价比（带宽每美金），
  * Computing Performance 对算法高效的实现（大模型一直在演变，需要一些灵活的算子库）
  * 模型的表现（host端运行时长大于device端，导致表现性能下降）
  * 系统优化 MFU & MBU 并行、高性能通讯库
* Useability 可用性
  * Stable Long Task 长时间稳定运行
  * Development & Maintenance 部署和维护，考虑并发、debug的问题
  * **Convergence** 数值精度，超参数的设计，输入顺序，硬件错误等等
* DevOps/Infrastructure
  * Energy and Infrastructure 数据中心的设计，散热
  * Fault Identification 故障识别和诊断，网络错误等问题
  * Safety Storage and others

### 大模型开发流程
* 准备AI集群，租用云或自己构建
  * platform system design, system debug
  * 数据处理
* 模型设计
  * 选择模型的规模，稀疏or稠密？MOE or Lamma？超参数怎么选择？怎么设计预训练、微调模式？
  * 模型微调，debug
* 模型的部署和推理
  * 考虑集成到业务中的能力
  * 发布什么样的API
  * 怎么推理、压缩、高效计算
  * 降低它的成本

需求：
* 高质量的数据，**标注**
* 高效且稳定的计算平台
* 高效的训练框架（自动并行优化）

两种商业模式：
* 提供API
* 利用大模型做推荐部署

### High demand for AI cluster systems

End to end training time: $\frac{8TP}{nX}$

* 内存墙
* 性能墙
* 效率墙
* 优化墙

### Model Accuracy and computational/arithmetic precision

### Design Challenge
错误修复、预测机制

### 华为升腾的愿景（在推理方面）
“负担得起”

模型结构的创新

提升系统的利用率

## Huawei Ascend Training and Inference Solution

训练的解决方案、推理的解决方案
### 训练：对接生态
对接Pytorch, Tensorflow等

加速库的支持

大模型社区（开源共享工作）

### 推理
推理引擎 MindIE

