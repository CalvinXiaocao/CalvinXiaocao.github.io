# Paper Reading: Variational Image Compression With A Scale Hyperprior

*图像压缩系列笔记 02*

?> 这是发表在 ICLR 2018 上的一篇论文，给出了端到端图像压缩的基本框架。作者基于 VAE 设计了一个端到端的可训练的图像压缩模型。与现有的模型不同，该模型与底层自动编码器联合训练复杂的先验。最终效果极佳。

## Introduction
有损图像压缩的一个最简单的原则是：对图像 $x$ 进行**量化** (quantize) 。量化减少了存储或传输它所需的信息量，但同时引入了 error。通常，直接量化的不是像素强度，而是先转到 **latent space** 变成 $y$ 再做量化得到 $\hat{y}$。因为 $\hat{y}$ 是离散的，所以可以使用熵编码方法（例如算术编码 Arithmetic Encoding）对其进行无损压缩。

有一点需要注意：潜在表示的实际边际分布 $m(\hat{y})$ 和熵模型对于潜在表示的熵模型分布 $p_{\hat{y}}(\hat{y})$ 是不同的。虽然通常假设熵模型具有参数化形式，并且参数适合数据，但是边缘 $m(\hat{y})$ 是未知的分布，当熵模型估计潜在表示出现值越精准，则其越接近理论熵值。编码器-解码器对可以实现的最小平均代码长度，使用 $p_{\hat{y}}$ 作为它们的共享熵模型，由两个分布之间的香农交叉熵给出。

$$
R=\mathbb{E}_{\hat{y}\sim m}[-\log_2 p_{\hat{y}}(\hat{y})]
$$

如果这两个分布相同的时候，就意味着交叉熵最小。这也表明当潜在表示的实际分布中存在统计依赖性时，使用完全分解的熵模型会导致压缩性能的非最优。

传统方法中，一种提升性能的方式是从编码器传输**额外信息** (side information) 给到解码器。我们希望传输的信息平均上尽可能比上面的式子优化出的 codelength 要小。比方说，**JPEG** 统一切成了 8*8 的像素块。而更近期的一些方法，比如 **HEVC**，把图片切成了不同的大小，把切分的信息也传给解码器，这样解码器先收到 side information，然后再去用正确的熵模型去解码。

传统的 side information 的形式是 hand-designed 人为设计的。相反，本文中介绍的模型本质上是**学习熵模型的潜在表示**，就像基础压缩模型学习图像的表示一样。该模型是端到端的优化模型，通过学习**平衡信息量和预期的熵模型改进**，可以使总的预期代码长度最小。怎么实现呢？使用 VAE 来完成。

在 2017 年的时候，作者就指出，一些基于自动编码器的压缩方法形式上和 VAE 是等价的。其中熵模型对应于潜在表示中的先验模型。而在这里，辅助信息可以被视为模型参数的先验，使它们成为潜在表示的**超先验** （hyperprior）。

这篇工作则是对作者 2017 年提出的模型做了扩展，它具有先验网络，并具有一个超先验的功能，即表示潜在表示的空间相邻元素在其比例尺上倾向于一起变化，并且通过实验表明它具有很好的效果。

## Compression With Variational Models
以往的图像压缩过程如下图所示：

![alt text](image.png ':size=80%')

编码器使用参数分析变换 $g_a(x;\phi _g)$ 把图像 $x$ 转化为潜在空间中的向量 $y$，然后经过量化得到 $\hat{y}$。因为 $\hat{y}$ 是离散的，它可以通过熵编码技术进行无损压缩。另一边，$\hat{y}$ 被送到解码器 $g_s(\hat{y};\theta _g)$ 中，然后通过 ANN 获得重建的图像 $\hat{x}$。我们并不强制 $g_a$ 和 $g_s$ 是线性的，他们可以是非线性的。$\theta _g$ 和 $\phi _g$ 是神经网络中的参数。

误差是从哪里被引入的呢？是在**量化**这一步。这里就引出了“率失真优化”问题 (rate-distortion optimization problem)。

### Rate-Distortion Optimization
率 Rate，我们把它定义成图像压缩表达的代码长度的期望值。我们还是用交叉熵去表示它：

$$
R=\mathbb{E}_{x\sim p_x}[-\log_2 p_{\hat{y}}(Q(g_a(x; \phi_g)))]
$$

其中 $Q$ 代表用来量化的函数。

失真 Distortion，我们把它定义为重建图像 $\hat{x}$ 和真实图像 $x$ 之间的期望差异，可以用感知损失，或者范数等衡量标准。

我们希望这两者都尽可能小。于是可以将两者加权相加，引入一个权重 $\lambda$。

$$
L = R + \lambda D
$$

### Approximation of Quantizer
我们想要去用梯度下降来训练参数；但不幸的是，由于离散的 quantizer，大多数地方的梯度都为0。解决方式要么替代 quantizer 的梯度，要么替代 quantizer 本身，改为加入uniform noise。（具体细节可以见上一篇笔记）

### VAE Representation

![alt text](image-1.png ':size=70%')

上面的例子中，可以用一个 VAE 来进行定义。VAE 的变分推断要求让 $p_{\bm{\tilde y} \mid \bm x}$ （真实的先验，显然是几乎不可求的）和 $q$ 之间的 KL 散度最小。

$$
\mathbb{E}_{\bm x \sim
 p_{\bm x}} D_{\mathrm{KL}}[q \;\|\; p_{\bm{\tilde y} \mid \bm x}] = \mathbb{E}_{\bm x \sim p_{\bm x}} \mathbb{E}_{\bm{\tilde y} \sim q} \Bigl[{\log q(\bm{\tilde y} \mid \bm x)} \underbrace{- \log p_{\bm x \mid \bm{\tilde y}}(\bm x \mid \bm{\tilde y})}_{\text{weighted distortion}} \underbrace{- \log p_{\bm{\tilde y}}(\bm{\tilde y})}_{\text{rate}}\Bigr] + C
$$

通过上面我们可以看到，让 KL 散度最小，和训练一个 rate-distortion 是等价的。

我们来拆开看这三项。

第一项，是0。因为我们把量化改成了训练时添加 uniform noise，因此：

$$
q(\bm{\tilde y} \mid \bm x, \bm \phi_g) = \prod_i \mathcal U\bigl(\tilde y_i \mid y_i - \tfrac 1 2, y_i + \tfrac 1 2\bigr)
$$

其中 $\bm y = g_a(\bm x; \phi_g)$ 代表量化之前的图像。是一个均匀分布，宽度固定为1，因此计算 KL 散度时结果就是0。

第二项，在讨论之前我们先做如下的假设：在给定 $\bm{\tilde y}$ 的情况下，$x$ 服从高斯分布。

$$
p_{\bm x \mid \bm{\tilde y}}(\bm x \mid \bm{\tilde y}, \bm \theta_g) = \mathcal N\bigl(\bm x \mid \bm{\tilde x}, (2\lambda)^{-1} \bm 1\bigr)
$$

这样推出来的形式就和 distortion 的形式一样了，使用的 mean squared error。如果用其他的衡量标准的话，可能前面的分布不是高斯分布了，或者能否对应一个分布也不好说。

第三项，也就刚好对应于 $m(\hat{y}) = \mathbb{E}_{x\sim p_x}q(\tilde y\mid x)$ 和 $p_{\tilde{y}}(\tilde{y})$ 之间的交叉熵。当然这和上面的交叉熵还是有差别的，这个可微分，但二者之间值的差距并不大。我们使用非参数、完全分解的密度模型对先验模型进行建模。

$$
p_{\bm{\tilde y} \mid \bm \psi}(\bm{\tilde y} \mid \bm \psi) = \prod_i \Bigl( p_{y_i\mid\bm \psi^{(i)}}\bigl(\bm \psi^{(i)}\bigr) \ast \mathcal U\bigl(-\tfrac 1 2, \tfrac 1 2\bigr) \Bigr)(\tilde y_i)
$$

### Idea of Optimization
下面这张图选自原论文。左边是原图，中间靠左是这张图的 latent representation。可以看到这个 latent representation 中间会有依赖，比如边和纹理复杂的地方。这是目前的 VAE 所无法刻画的。我们希望模型能够捕获其中的依赖关系，因此引入超先验成为了一个新的思路。

![alt text](image-2.png ':size=80%')

## Introduction of a Scale Hyperprior
我们把原先的架构再叠加一层，引入新的信息。

![alt text](image-3.png ':size=80%')

其中 $z$ 就可以用来学习这些像素之间的依赖关系。

### Model Structure

我们采用下面的建模方法：把 $\tilde y$ 的分布定义成均值为 0，方差为 $\tilde \sigma ^2$ 的正态分布和从 $-\frac{1}{2}$ 到 $\frac{1}{2}$ 的均匀分布的卷积（加噪）。其中，方差 $\tilde \sigma = h_s(\tilde z; \theta_h)$ 是通过将 $\tilde z$ 送到一个神经网络中获得的。

$$
p_{\bm{\tilde y} \mid \bm{\tilde z}}(\bm{\tilde y} \mid \bm{\tilde z}, \bm \theta_h) = \prod_i \Bigl( \mathcal N\bigl(0, \tilde \sigma_i^2\bigr) \ast \mathcal U\bigl(-\tfrac 1 2, \tfrac 1 2\bigr) \Bigr)(\tilde y_i)
$$

那么前向的过程可以扩展成两步：分别预测，分别加噪。如下。

$$
q(\bm{\tilde y}, \bm{\tilde z} \mid \bm x, \bm \phi_g, \bm \phi_h) = \prod_i \mathcal U\bigl(\tilde y_i \mid y_i - \tfrac 1 2, y_i + \tfrac 1 2\bigr) \cdot \prod_j \mathcal U\bigl(\tilde z_j \mid z_j - \tfrac 1 2, z_j + \tfrac 1 2\bigr)
$$

其中 $\bm y = g_a(\bm x; \bm \phi_g), \bm z = h_a(\bm y; \bm \phi_h)$

因为我们对超先验没有了先验的信念，我们可以用曾经建模 $\tilde y$ 的方式来建模 $\tilde z$。

$$
p_{\bm{\tilde z} \mid \bm \psi}(\bm{\tilde z} \mid \bm \psi) = \prod_i \Bigl( p_{z_i\mid\bm \psi^{(i)}}\bigl(\bm \psi^{(i)}\bigr) \ast \mathcal U\bigl(-\tfrac 1 2, \tfrac 1 2\bigr) \Bigr)(\tilde z_i)
$$

### Loss Function

新的损失函数将会变为：

$$
\mathbb{E}_{\bm x \sim p_{\bm x}} D_{\mathrm{KL}}[q \;\|\; p_{\bm{\tilde y}, \bm{\tilde z} \mid \bm x}] = \mathbb{E}_{\bm x \sim p_{\bm x}} \mathbb{E}_{\bm{\tilde y}, \bm{\tilde z} \sim q} \Bigl[\log q(\bm{\tilde y}, \bm{\tilde z} \mid \bm x) - \log p_{\bm x \mid \bm{\tilde y}}(\bm x \mid \bm{\tilde y}) - \log p_{\bm{\tilde y} \mid \bm{\tilde z}}(\bm{\tilde y} \mid \bm{\tilde z}) - \log p_{\bm{\tilde z}}(\bm{\tilde z})\Bigr] + C
$$

第一项是0，第二项代表 distortion，第三项和第四项分别代表 $\tilde y$ 和 $\tilde z$ 的交叉熵。

![alt text](image-4.png ':size=80%')

## Experiments
性能上相较于BPG（HEVC帧内编码）差了一点，但是相比于原始的2017年的论文的优化上，在R-D性能上，同码率下提高了一点几个db,可以说奠定了大部分图像压缩研究的基础。
