# Berkeley CS 61A

*written by 草鱼, Feb 7, 2024, revise: Oct 11, 2024*

### Course Website
<https://cs61a.org>

## 课程介绍

Berkeley的**两千人**计算概论大课，涉及函数、递归、数据封装、面向对象等知识。

详细介绍见csdiy：<https://csdiy.wiki/编程入门/Python/CS61A/>

**编程语言：** Python，后半部分会介绍Scheme和SQL

**教材：** <https://www.composingprograms.com>

## 我的上课资料

[>> All discussions for cs61a (2023 fall)](https://calvinxiaocao.github.io/online_courses/cs61a/disc/discussions.pdf)

[>> Discussion solutions (2023 fall)](online_courses/cs61a/disc/answer)

All my labs and homework solutions are on **Github**. *Click [here](https://github.com/CalvinXiaocao/CalvinXiaocao.github.io/tree/main/online_courses/cs61a)*

## Getting Started on CS 61A!
### Step 1: Watch Lecture 1
在B站或Youtube上搜索CS 61A的课程视频。我使用的是[**2020 Fall**](https://www.bilibili.com/video/BV1s3411G7yM/?share_source=copy_web&vd_source=02db114bfc7838eaeb46e4681bbc18a1)版，内容最全。观看视频，了解课程的架构，进入61A的世界吧～

*（建议使用英文字幕，有些中文字幕的自动翻译并不准确，而且这正是训练英语的好时机——Denero老师讲课的语速还是很慢的）*

### Step 2: Finish Lab 0
`B站上lab 0的视频是根据当年的lab录制的，可供参考`

进入cs61a.org网站，进入lab 0，Windows电脑按照提示安装**Terminal**（终端） (最好安装git bash，因为git bash在后续更深入的计算机学习中一定会用到)，Mac或Linux系统则使用自带**Terminal**（终端）。

随后检查python版本，课程需要python>=3.9，如果没有安装或者版本较低需要安装python。

然后学习基本Terminal操作，了解`cd` / `ls` / `mkdir` 等命令的含义。（这个计算概论课上可能不会提到，但是一定要了解，学会用命令行指令访问文件夹。这是将来学习git等命令行工具的基础）

紧接着就进入Your First Assignment啦～先做**WWPD**（What Would Python Do），在命令行输入下面一行代码。

⚠️注意：**一定要在后面加--local**！否则会强制你登入Berkeley账号……**以后所有用到ok评测器的地方都要加--local！！**

```bash
python3 ok -q python-basics -u --local
```

如果 `python3` 无反应，试试把 `python3` 改成 `python` 或 `py` 

然后就进入小学算数题了（bushi）在这个过程中体验一下python的交互式～这是python全新的打开方式！和平常编写 `foo.py` 之类的程序文件不一样，用命令行和python去做对话，这种随时就能打开用的计算器谁不爱呢～

最后就开始完成代码填空题，用你最创意的方式输出2024吧！

在cs61a中，大多数lab和homework中都是代码补全题，全程基本不需要用到input之类的函数，如果需要debug可以在代码中加入下面一行：

```python
print("DEBUG:", var1, var2, 其他的变量之类的)
```

我的2024:
```python
return 1 * (2 ** 3) + 4 * ((5 // 6) + 7 * 8 * 9)
```

`注：python中乘方是两个乘号，而c++本身没有乘方，想要在c++中使用乘方表示$a^b$要这样做：

```c++
#include <cmath>
//... other code
int a = pow(a, b);
```

最后的 `gradescope` 不用管！这是Berkeley同学才能用的，本地的ok评测器已经够用了～（如果后期继续学习cs61b则会用到 `gradescope` 

`注意` Discussion部分相当于“小班课”，Worksheet里面会有一些题目，还是推荐去做的，如果有时间可以做一下～如果因为网络原因无法打开文档，可以在本页面前面找到2023年版的discussion，其中2023版Discussion 1推荐在lecture 3之后完成

### Step 3: Watch Lecture 2- Functions
了解Expression，Call，Function的方式，学会自定义Function，学会Environment Diagrams，了解Environment和Frame的概念和关系

### Step 4: (Optional) Read the textbook
如果有时间可以读教材，按照课程网站上的标注阅读对应章节就可以了

### Continue:
听课程视频$\to$阅读课程教材$\to$完成对应的lab，homework和discussions$\to$完成四个project大作业（*大作业是课程的一大亮点，而且超级超级有意思，有时间一定要尝试！！*）$\to$如果对自己要求更高，可以完成Midterm 1, Midterm 2 & Final 考试

[Python Tutor](https://pythontutor.com/python-compiler.html#mode=edit)


[返回](/online_course)
