# Chapter 2 一维振动方程
Music And Math, 2025 Spring

## 2.1 One-Dimensional Wave Equation
推导过程好抽象……
### 乐音的分解
一件乐器发出的乐音并不是单一音高的，而是包含了许多不同音高的声音，这些不同频率、不同强度的声音构成了这种乐器独特的音色。

按照震动体分类：气鸣乐器（边棱、唇鸣、簧鸣）、弦鸣乐器（弓弦、弹拨、击打）、膜鸣乐器（鼓、kazoo）、电鸣乐器、体鸣乐器。

下面的推导简要了解即可

### 抽象化
* 一个假设：给定**均匀细弦**
* 三个参数：长度$L$，张力$T$，线密度$\rho$

?> **线密度**：单位长度的质量。

![alt text](image.png ":size=70%")

?> **牛顿第二定律**：$F=ma$

弦受到的张力为$T$ ，其线密度（单位长度的质量）为$\rho$ . 因此 $PQ$ 受到的力 $F=T_Q -T_P \approx T（\tan \beta-\tan \beta）$， 质量 $m= \rho \Delta x$.

![alt text](image-1.png ":size=70%")

### 一维振动方程
![alt text](image-2.png ":size=70%")

同时必须满足边值条件：

$$
u(0, t) = u(L, t) = 0
$$

![alt text](image-3.png)

`即使是一根弦，它的振动也是无限振动的叠加。`

![alt text](image-4.png)

把$\sin$和$\cos$统一到一起做化简，得到：

![](image-5.png)

## 2.2 振动模态与泛音
### 振动模态
弦的振动并非简单的单一频率运动，而是无穷多个正弦振动的叠加。

$$
u_n(x,t) = \sqrt{a_n^2 + b_n^2}  \sin (\omega_n t + \theta_n) \sin \left( \frac{n \pi x}{L} \right) 
$$

称为第n个振动模态。

$$
\omega_n = \frac{n \pi c}{L}
$$

![alt text](image-6.png)

### 梅森定律

![alt text](image-7.png)

$$
f_n = \frac{n}{2L} \sqrt{\frac{T}{\rho}}, n = 1, 2, 3, \cdots
$$

?> Intuition: 频率和长度成反比，和张力的平方根成正比，和线密度的平方根成反比。

!> 考点：梅森定律及利用梅森定律推导比例关系

### 泛音
弦的振动频率组成的序列称为弦的固有频率。$f_1$ 称为基频，对应的音称为基音。$f_2, f_3, \cdots$ 对应的音称为泛音。特别的，$f_2$ 称为第一泛音，$f_3$ 称为第二泛音，以此类推。

!> 第一泛音对应的是$f_2$！

记基频$f_1=f$，则固有频率的序列为：$f, 2f, 3f, \cdots$ 音乐上把其称为泛音列。

### 波节与波腹
![alt text](image-8.png)

### 赫尔姆霍兹的协和音程泛音列重合理论
八度音程：
- 根音：$$f, 2f, 3f, 4f,\cdots$$
- 冠音：$$2f, 4f, 6f, 8f,\cdots$$

纯五度音程：
- 根音：$$f, 2f, 3f, 4f,\cdots$$
- 冠音：$$\frac{3}{2}f, 3f, \frac{9}{2}f, 6f,\cdots$$

可以看到八度音程和纯五度音程有多个重合，因此听起来比较和谐。大二度音程就不和谐了，因为两个的重合度不高。

![alt text](image-9.png)

## 2.3 拨弦与傅立叶级数
之前的方程其实没有解干净，因为我们只考虑了初始条件，没有考虑初始速度和形状。

![alt text](image-10.png)

这样这个方程就能完全确定。

![alt text](image-12.png)

![alt text](image-13.png)

![alt text](image-11.png)

![alt text](image-14.png)

![alt text](image-15.png)

![alt text](image-16.png)

![alt text](image-17.png)

![alt text](image-18.png)

![alt text](image-19.png)

### 拨弦的泛音列
在弦的中点拨弦只有奇频。

![alt text](image-20.png)

## 2.4 管乐器
管乐器的振动主体是管内的空气柱，但空气柱所满足的**边值条件**与弦振动的情形不同.
两端固定的弦满足 $u(0, t)=w(L,t)=0,\forall t \geq 0$. 而振动的空气柱会超出管的端口，故须对其音高（频率）进行 **端口校正** (end correction).

### 开管的振动模态
![alt text](image-21.png)

![alt text](image-22.png)

### 闭管的振动模态
![alt text](image-23.png)

![alt text](image-24.png)
