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
2. 编码器不是学习到的，而是预先定义成了 linear Gaussian。这一条件和1联系起来，可以形象地理解成：向图片中添加噪声。
3. 最后一个隐变量的分布服从标准高斯分布。

![alt text](image-32.png ':size=70%')

条件 2 需要再进行细化。我们定义加噪的方式如下。为什么要这么定义呢？是因为我们想保证每一步 latent 的方差都在一个相同的尺度上。

![alt text](image-33.png ':size=70%')

$x_t = k_t x_{t-1} + \beta_t \epsilon_t$

$= k_t (k_{t-1} x_{t-2} + \beta_{t-1} \epsilon_{t-1}) + \beta_t \epsilon_t$

$= \bar{k_t} x_0 + (k_t k_{t-1} \dots k_2 \beta_1 \epsilon_1) + (k_t k_{t-1} \dots k_3 \beta_2 \epsilon_2) + \beta_t \epsilon_t$

假如我们让 $k_t^2 + \beta_t^2 = 1$, 上式可以简化成:

$\mathbf{x_t} = \bar{k_t} \mathbf{x_0} + \sqrt{1 - \bar{k_t}^2} \epsilon$

其中 $\bar{k_t} = \Pi_{i=1}^{t}k_i$

这里有两个 Intuition：一是多步加噪的过程可以简化成一步到位；二是因为 $k_i < 1$，因此当 $t\to+\infty$的时候，$x_t$ 近似服从标准正态分布，这也正是我们想要的！

---

### Training Diffusion Models
我们来看损失函数。它的形式和 VLE 几乎是一模一样的，我们也想要最大化 ELBO。不过现在 ELBO 可以被拆解为三项：重构项，先验匹配项，还有去噪匹配项。
![alt text](image-35.png ':size=80%')

DDPM 论文的第三部分对这三项分别进行了阐述。下面我们也分别来讲一下这三部分。

---
**Term 1 (prior matching term)**

第一项，$D_{KL}(q(\boldsymbol{x}_T | \boldsymbol{x}_0) \parallel p(\boldsymbol{x}_T))$。在 DDPM 中，$\sqrt{\beta_t}$是预定义好的，不对其做训练，因此它是个常数。

---

**Term 2 (denoising matching term)**

$$
\sum_{t=2}^T \mathbb{E}_{q(\boldsymbol{x}_t | \boldsymbol{x}_0)} \left[ D_{KL} \big( q(\boldsymbol{x}_{t-1} | \boldsymbol{x}_t, \boldsymbol{x}_0) \parallel p_\theta (\boldsymbol{x}_{t-1} | \boldsymbol{x}_t) \big) \right]
$$

通过一系列的推算，我们可以推出：前向过程的后验分布服从高斯分布：

$$
q(\boldsymbol{x}_{t-1} | \boldsymbol{x}_t, \boldsymbol{x}_0) \sim \mathcal{N} \left( \boldsymbol{x}_{t-1}; \tilde{\mu}_t(\boldsymbol{x}_t, \boldsymbol{x}_0), \tilde{\beta}_t \boldsymbol{I} \right)
$$

其中参数定义为：

$$
\tilde{\mu}_t(\boldsymbol{x}_t, \boldsymbol{x}_0) = \frac{\sqrt{\bar{\alpha}_{t-1}} \beta_t}{1 - \bar{\alpha}_t} \boldsymbol{x}_0 + \frac{\sqrt{\alpha_t} (1 - \bar{\alpha}_{t-1})}{1 - \bar{\alpha}_t} \boldsymbol{x}_t
$$

$$
\tilde{\beta}_t = \frac{1 - \bar{\alpha}_{t-1}}{1 - \bar{\alpha}_t} \beta_t
$$

我们希望让 KL 散度项最小，那自然想要把  $p_\theta$ 定义成高斯分布了。在 DDPM 的定义中，我们把这个高斯分布的方差作为一个固定项，而去学习这个高斯分布的均值。

$$
p_\theta (\boldsymbol{x}_{t-1} | \boldsymbol{x}_t) = \mathcal{N} \left( \boldsymbol{x}_{t-1}; \mu_\theta (\boldsymbol{x}_t, t), \sigma_t^2 \boldsymbol{I} \right)
$$

实际应用中两种方差选择效果相似：
- $\sigma_t^2 = \beta_t$ （原始方差）
- $\sigma_t^2 = \tilde{\beta}_t$ （修正方差）

$t-1$时刻的损失项可简化为：

$$
L_{t-1} = \mathbb{E}_q \left[ \frac{1}{2\sigma_t^2} \| \tilde{\mu}_t(\boldsymbol{x}_t, \boldsymbol{x}_0) - \mu_\theta (\boldsymbol{x}_t, t) \|^2 \right] + C \quad (1)
$$

其中$C$为与$\theta$无关的常数。

数学推理到这里就可以结束了，这就已经可以用来学习了。不过还有一种等价的方式：预测噪声。

**完整形式**：
$$
L_{t-1}^{noise} = \mathbb{E}_{x_0, \epsilon} \left[ \frac{\beta_t^2}{2\sigma_t^2 \alpha_t (1-\bar{\alpha_t})} \| \epsilon - \epsilon_\theta(x_t, t) \|^2 \right] + C \quad (2)
$$

**简化形式（DDPM采用）**：
$$
L_{simplified} = \mathbb{E}_{t,x_0,\epsilon} \left[ \| \epsilon - \epsilon_\theta(x_t, t) \|^2 \right] + C \quad (3)
$$

这一项简化看似直接砍掉了前面的系数，但实际上是有道理的。前面的这一项随着 t 的增加而减小，我们把这一项抹去，相当于放大了 t 较大时刻的 loss，使得模型关注于 t 较大时更难的训练目标。

DDPM 在实验部分对几种方法的 IS 和 FID 都进行了比较，发现训练简化损失函数（3）的 IS 最高，FID 最低。

---

**Term 3 (reconstruction term)**
还有一项落了单：去噪匹配项只考虑了 $t>1$ 时候的结果，而当 $t=1$ 的时候，还有这一特殊的项需要考虑：

$$
\mathbb{E}_{q(\boldsymbol{x}_1 | \boldsymbol{x}_0)} \left[ \log p_\theta (\boldsymbol{x}_0 | \boldsymbol{x}_1) \right]
$$

DDPM 中是这样实现的：
1. **输入预处理**  
   图像像素值线性缩放至 $[-1, 1]$ 区间。
2. **离散化解码器**  
   逆向过程的最后一步使用独立离散解码器：  
   $$
   p_\theta(\boldsymbol{x}_0 | \boldsymbol{x}_1) = \prod_{i=1}^D \int_{\delta_-(\boldsymbol{x}_0^i)}^{\delta_+(\boldsymbol{x}_0^i)} \mathcal{N}(x; \mu_\theta^i(\boldsymbol{x}_1, 1), \sigma_1^2) dx
   $$  
   其中：
   - $D$ 为图像维度
   - $\delta_+/\delta_-$ 为像素值分箱边界
3. **实际训练**
   实际训练时，我们使用近似，将连续的积分离散化。
   $$
    \log p_\theta (\boldsymbol{x}_0 | \boldsymbol{x}_1) = -\frac{1}{2\sigma_t^2} \| \boldsymbol{x}_0 - \boldsymbol{\mu}_\theta(\boldsymbol{x}_1, 1) \|^2 + C
    $$
    它和2有着相同的形式，因此直接融为一体训练即可。

---

以上就是从概率的角度对 Diffusion Model 的理解。下面我们来讲基于得分 Score 的理解。

---

## Score-based Interpretation
我们之前提到，生成模型是对概率进行建模。我们换一种表示 $p_\theta(x)$ 的方式：

$$
p_\theta(x)=\frac{1}{Z_\theta}e^{-f_\theta(x)}
$$

可如果这么建模的话，问题就来了：如果要是算归一化系数太难了！那么如何避免概率的归一化呢？取对数，之后去计算它的导数，就可以了。

$$
s_\theta(\boldsymbol{x}) = \nabla_{\boldsymbol{x}} \log p_\theta(\boldsymbol{x}) = -\nabla_{\boldsymbol{x}} f_\theta(\boldsymbol{x})
$$

我们把概率取对数后计算得到的梯度叫做“分数”。如果我们学好了 $s_\theta(x)$，那就可以采样后沿着梯度的方向按一定步长去走，最终就可以拟合原先的概率分布了。

---

### Langevin Dynamics
现在把“走”的过程再细化一些：假设我们已经学好了我们的 score-based model，我们该如何采样呢？我们采取一种迭代的策略，称为“朗之万动力学”：

1. **初始化**：
   $$
   \boldsymbol{x}_0 \sim \pi(\boldsymbol{x}) \quad \text{（通常为简单分布，如均匀分布或高斯分布）}
   $$

2. **迭代更新**（$i=0,1,...,T-1$）：
   $$
   \boldsymbol{x}_{i+1} = \boldsymbol{x}_i + \epsilon \nabla_{\boldsymbol{x}} \log p_\theta(\boldsymbol{x}_i) + \sqrt{2\epsilon} \boldsymbol{z}_i
   $$
   其中：
   - $\epsilon > 0$：步长（step size）
   - $\boldsymbol{z}_i \sim \mathcal{N}(0, \boldsymbol{I})$：随机噪声
   - $T$：总迭代次数

3. **收敛性**：
   当满足以下条件时：
   - $\epsilon \to 0$
   - $T \to \infty$
   
   最终样本 $\boldsymbol{x}_T$ 将收敛于真实分布 $p(\boldsymbol{x})$ 的采样结果。


