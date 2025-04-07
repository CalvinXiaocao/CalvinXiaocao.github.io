# Learned Image Compression

*图像压缩系列笔记 01*

?> 这是 2018 年 Picture Coding Symposium 上 Johannes Ballé 做的一篇报告，对 **Learned Image Compression** 做的一个 overview talk。他是论文 **Variational Image Compression With a Scale Hyperprior** 的一作，下篇笔记将去详细分析这篇论文，它建立起端到端图像压缩的基本框架。我们从这次 talk 开始学起，进入图像压缩的世界。

在本次 talk 中，Johannes Ballé 介绍了 **端到端** 的图像压缩方法。我们先来看一下效果：

![alt text](image.png ':size=70%')

这是原图。如果我们使用传统的压缩方式，限制在0.1 bit/pixel，就很容易看到 artifacts，比如模糊的船、模糊的树枝，后面山坡的纹理也很模糊。

![alt text](image-1.png ':size=70%')

如果我们使用一种端到端的 Learned Image Compression，这种 artifacts 并不一定会发生。

![alt text](image-2.png ':size=70%')

再比如对马的照片进行对比。

![alt text](image-3.png ':size=70%')

如果我们用 learned method，结果是这样，看上去清晰了一些。

![alt text](image-5.png ':size=70%')

再比如：

![alt text](image-4.png ':size=70%')

如果用 learned model，花的纹理就更清晰了。

![alt text](image-6.png ':size=70%')

下面，我们将介绍一下这个方法。

## Transform Coding: From Linear to Nonlinear

### Traditional: JPEG

最传统的压缩方式当属 jpeg 了。原图 $x$ 经过 DCT 变换，然后通过量化表进行量化，用熵编码进行编码。具体细节这里省略。

![alt text](image-7.png ':size=70%')

所以，为什么我们要用 **DCT** 呢？这得追溯到 1974 年提出它的论文。实验表明他的效果和 Karhunen-Loève Transform 相近，而且计算过程更快。

在提出 DCT 的时候，事实上作者作出了两个假设：第一，它只是在 Gaussian (AR-1) 信号上效果较好。第二，他们希望找到的是 **linear transform**。KLT 是最佳的 **linear transform**。然而现在，我们的信号很可能不是 Gaussian，而且最优的变换可能不是线性变换。

### ANN (Artificial Neural Network)
这时候，ANN 加入了。

![alt text](image-8.png ':size=70%')

ANN 是一个从输入向量到输出向量的映射，可训练的参数 $\theta$ 存在于线性的部分。我们可以用它来近似我们的最优的变换。我们可以使用 ANN 来取代上面的 DCT 部分。

![alt text](image-9.png ':size=70%')

问题呢？这个系统的参数太多了。我们需要通过机器学习来学这些参数。

训练时，我们定义 loss function 为下式：

$$
L(\theta, \phi, \psi) = \mathbb{E}_x \underbrace{\left[-\log_2 p_{\hat{y}}(\hat{y})\right]}_{R} + \lambda \mathbb{E}_x \underbrace{\left[\|\mathbf{x} - \hat{\mathbf{x}}\|_2^2\right]}_{D}
$$

其中 $\lambda$ 是平衡系数。但是，如果展开来写，形式会很可怕。

$$
L(\theta, \phi, \psi) = \mathbb{E}_x \underbrace{\left[-\log_2 p_y(Q(g_a(\mathbf{x}; \phi)) | \psi) \right]}_{R} + \lambda \mathbb{E}_x \underbrace{\left[\|\mathbf{x} - g_s(Q(g_a(\mathbf{x}; \phi)); \theta)\|_2^2 \right]}_{D}
$$

我们用随机梯度下降对它进行优化，并自动微分。然而，我们忽略了一点：quantizer 是一个 step function，是不可微的。一种解决的办法是：认为训练时没有 quantizer，而是向其中加入 uniform noise。在实际使用时仍然用 quantizer。

![alt text](image-10.png ':size=60%')

如果这样做的话，$y_i$ 的概率分布会发生改变。可以看到，加入 uniform noise 实际上进行了一步平滑。

![alt text](image-11.png ':size=60%')

### Compress a Laplacian Source

在压缩图像之前，我们首先尝试去对 Laplacian Source Distribution 进行压缩。我们使用神经网络，它学到了两个特性：指出了中间区域的 dead zone，而且把数据的表示放到了 conditional mean 的附近（如图）。

![alt text](image-12.png ':size=60%')

我们现在把它拓展到二维，让机器来学习 “banana” source。如果只用线性的变换，那么效果如下。可以看出它尝试去拟合，但效果一般。

![alt text](image-13.png ':size=60%')

如果用非线性的模型，那么压缩的效果更好，cost有显著的降低。

![alt text](image-14.png ':size=60%')

如果用 rate-constrained vector quantization，分数并没有比 nonlinear transform coding 显著下降。
![alt text](image-15.png ':size=60%')

下面我们来到图像。我们加入了卷积，而不仅是线性的模型。

![alt text](image-16.png ':size=60%')

### Visualization Result

下面我们来看一组效果的对比。

![alt text](image-18.png ':size=60%')

![alt text](image-19.png ':size=60%')

![alt text](image-17.png ':size=60%')

![alt text](image-20.png ':size=60%')

![alt text](image-21.png ':size=80%')

## From Transform Coding to Representation Learning
下面我们尝试对 nonlinear transform 做进一步的拓展。

![alt text](image-22.png ':size=60%')

### AutoEncoders

![alt text](image-25.png ':size=70%')

### Variational AutoEncoders

![alt text](image-26.png ':size=70%')

![alt text](image-27.png ':size=70%')

### New Interpretation of NTC as Bayesian Model

$$
L = \mathbb{E} \left[ -\log p_{\hat{y}} (\hat{\mathbf{y}}) - \log p_{\mathbf{x} | \hat{y}} (\mathbf{x} \mid \hat{\mathbf{y}}) \right]
$$

这个损失函数和之前讲的 rate distortion 形式上就很像了。第一项是 rate，第二项是 distortion。

当然，还有其他种表达。比如 PixelCNN，GAN 等等。

## Learned Image Compression Mini-FAQ

### How good is it? Numbers?
有很多人会问：Learned Image Compression 有多好？Presenter 展示了他们的研究成果，是他们先前发表在 ICLR 上的 **Variational Image Compression With a Scale Hyperprior**，当时的 State-of-the-art。他们的架构大致如下：扩展了原先的 Variational AutoEncoder，加入了 hyperprior，扩展成了一个多层的 Bayesian Model。

![alt text](image-28.png ':size=70%')

评估效果是当时的 State-of-the-art。

从效果图来看，optimized for MSE 和 optimized for MS-SSIM 中，后者的效果更好，会分配更多 bits 给纹理多的区域。但是，MS-SSIM 有的时候效果不如前者。比如一个印有文字的飞机，MS-SSIM 会给草地分更多 bits，从而文字变模糊。但是我们想看的是文字部分。

### Is it computationally expensive?
如果用 CPU，确实。很多当时的研究在想如何加速计算。同时 GPU 的使用也可以使过程加速。


