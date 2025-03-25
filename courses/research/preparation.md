# DDPM & NCSN: Theory behind Diffusion Model

`这是我准备的进组面试内容。Wish myself a good luck!`

> 在 DDPM 的 Abstraction 中，作者提到：“Our best results are obtained by training on a **weighted variational bound** designed according to a novel connection between **diffusion probabilistic models** and **denoising score matching** with Langevin dynamics.” diffusion probabilistic models 和 denoising score matching 分别是指什么意思呢？为什么说它们之间存在一个 novel connection 呢？这就是本篇 blog 的主题。我将分别对 Probabilistic view 和 Score-based interpretations 进行介绍。

## Probabilistic Interpretation
在概率的视角下，生成模型可以用如下的方式去解释：给定观测到的数据 $x$，生成模型的目的是去学习 $x$ 的概率分布情况，也就是尝试对 $p(x)$ 进行建模。

![alt text](image-24.png ':size=80%')

一旦我们建模好了 $p(x)$，我们就可以从中进行**采样**操作，这就是生成模型的生成过程。

### Two Categories of Generative Models
大体上，生成模型可以分成两类：一类是 **Implicit Density**，一类是 **Explicit Density**。顾命思义，**Implicit Density** 是不显式建模概率，但会学到一种方式从真实的数据分布中采样。而 **Explicit Density** 则是去估计数据的 PDF (Probability Density Function) 或者 CDF (Cumulative Density Function)。

![alt text](image-25.png ':size=70%')

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

### VAEs (Variational Autoencoders)
显式建模的一个代表就是 **VAE**。这里对 VAE 会做详细一点的分析，因为它和 Diffusion Model 的联系比较密切。

我们之前提到，显式建模的目标是直接建模 pdf 或者 cdf。**VAE** 采取了这样的一种想法：认为图像是由高一层的 latent 隐变量控制生成的。

![alt text](image-28.png ':size=80%')

假设图像用 $x$ 表示，latent variable 用 $z$ 表示。那么有：
![alt text](image-29.png ':size=60%')

然而，直接计算并且最大化 $p(x)$ 并不简单。要么我们需要对所有的 $z$ 进行计算并积分，要么我们需要知道 ground truth 的编码器 $p(z|x)$。因此我们提出了新的办法：**训练它的置信下界 ELBO**。
