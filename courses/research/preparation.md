# DDPM & NCSN: Theory behind Diffusion Model

`这是我准备的进组面试内容。Wish myself a good luck!`

> 在 DDPM 的 Abstraction 中，作者提到：“Our best results are obtained by training on a **weighted variational bound** designed according to a novel connection between **diffusion probabilistic models** and **denoising score matching** with Langevin dynamics.” diffusion probabilistic models 和 denoising score matching 分别是指什么意思呢？为什么说它们之间存在一个 novel connection 呢？这就是本篇 blog 的主题。我将分别对 Probabilistic view 和 Score-based interpretations 进行介绍。

---

## Probabilistic Interpretation
在概率的视角下，生成模型可以用如下的方式去解释：给定观测到的数据 $x$，生成模型的目的是去学习 $x$ 的概率分布情况，也就是尝试对 $p(x)$ 进行建模。

![alt text](image-24.png ':size=80%')

一旦我们建模好了 $p(x)$，我们就可以从中进行**采样**操作，这就是生成模型的生成过程。

---

### Two Categories of Generative Models
大体上，生成模型可以分成两类：一类是 **Implicit Density**，一类是 **Explicit Density**。顾命思义，**Implicit Density** 是不显式建模概率，但会学到一种方式从真实的数据分布中采样。而 **Explicit Density** 则是去估计数据的 PDF (Probability Density Function) 或者 CDF (Cumulative Density Function)。

![alt text](image-25.png ':size=70%')

---

### GANs (Generative Adversarial Networks)
GANs 是隐式建模概率。在 GAN 中我们定义了两个网络：生成器和判别器。判别器负责辨别哪些样本是生成器生成的假样本，哪些是从真实训练集中抽出来的真样本。生成器负责利用随机噪声 $z$ 生成样本，它的职责是生成尽可能真的样本以骗过判别器。

![alt text](image-26.png ':size=70%')

对 GANs 的训练则属于生成器和判别器进行的一场博弈。交替训练生成器和判别器，在生成器上做梯度下降，在判别器上做梯度上升。这里我们不对 GANs 的训练细节做过多介绍。

![alt text](image-27.png ':size=70%')

这样的建模有问题吗？问题确实是存在的。下面列出了几点：
* **梯度消失**（Vanishing gradients）：判别器能力太强导致梯度消失。
* **不收敛**（Non-Convergence）：生成器和判别器都在震荡，不能达到均衡。
* **模式崩溃**（Mode Collapse）：GAN 训练的后期阶段，生成器生成图像样式单一。生成器投机取巧，只生成个别几张逼真的样本去骗过判别器，这导致生成的图像真实但单一，不符合实际的图像分布。
* **模式塌缩**（Mode Dropping）：GAN 能很好地生成训练集中的数据，但难以生成非训练集的数据，“缺乏想象力”。它并不能很好覆盖数据的真实分布。

---

### VAEs (Variational Autoencoders)
显式建模的一个代表就是 **VAE**。这里对 VAE 会做详细一点的分析，因为它和 Diffusion Model 的联系比较密切。

我们之前提到，显式建模的目标是直接建模 pdf 或者 cdf。**VAE** 采取了这样的一种想法：认为图像是由高一层的 latent 隐变量控制生成的。

![alt text](image-28.png ':size=80%')

假设图像用 $x$ 表示，latent variable 用 $z$ 表示。那么有：
![alt text](image-29.png ':size=60%')

然而，直接计算并且最大化 $p(x)$ 并不简单。要么我们需要对所有的 $z$ 进行计算并积分，要么我们需要知道 ground truth 的编码器 $p(z|x)$。因此我们提出了新的办法：**训练它的置信下界 ELBO**。

---

### ELBO in VAE
我们对 $\log p(x)$ 进行一番推导，引入一个新的 $q_\phi(z|x)$，$\phi$ 是我们的学习目标。可以看出，$\log p(x)$ 被拆解成了两部分：一部分是 **KL 散度**，另一部分是就是 ELBO。

![alt text](image-30.png ':size=70%')

KL 散度一定是大于等于 $0$ 的，因此 ELBO 这一项一定是它的下界。至于为什么要优化这一项也变得很直观：相对于 $\phi$ 而言，$\log p(x)$ 是个常量。我们希望学习到的编码器 $q_\phi(z|x)$ 尽量和 Ground Truth 的 $p(z|x)$ 相同，也就是最小化 KL 散度，自然需要**尽量让 ELBO 最大**。

在 VAE 中，我们想训练一个**编码器**，也就是上面提到的 $q_\phi(z|x)$。同时我们也学习一个**确定性的函数** $p(x|z)$，它可以直观地被理解为**解码器**。

我们接着推导 ELBO：

![alt text](1742915890165.png ':size=70%') 

可以看到，ELBO 被拆成了两项：一项是**重构项** Reconstruction Term：给定潜在表示时，重构数据和原始数据之间的对数似然。希望我们的解码器能在给定潜在向量 (z) 时，更好地重构原来的输入 (x)。另一项是**先验匹配项** Prior Matching Term：希望编码器得到的分布和先验分布尽可能相近。

VAE 中将 z 建模为标准正态分布，并把 q 也建模成高斯分布，其期望和方程可以学习。训练细节在这里不做过多介绍。

---

### Hierarchical VAE
VAE 的一个缺点是样本比较模糊，质量较低。我们是否能扩展 VAE 的架构？可以发现 VAE 只有一层，如果把 VAE 累加到多层呢？于是就有了新的概念：**HVAE**，也就是多层的 VAE。

HVAE 将多层级的 VAE 叠加起来，假定生成 image 的 latent 是由高阶的latent生成的，而其又是由更高阶的 latent 生成的……为了简化，我们考虑 Markov HVAE，在 HVAE 中加入马尔科夫性，假定是 $𝑧_𝑡$ 只与 $𝑧_{𝑡−1}$ 相关，latent 之间不会跨层影响。

![alt text](image-31.png ':size=70%') 

> 诶，这不就和 Diffusion Model 很像了吗！没错，diffusion model 就可以理解成一个垒起来的 VAE。下面就会详细介绍。

---

### Diffusion Models as MHVAE
Diffusion Model 可以理解成一个特殊的 MHVAE，外加对其的三条特殊限制：

1. 数据的维度和隐变量的维度相同。
2. 