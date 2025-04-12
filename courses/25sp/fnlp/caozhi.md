### TF-IDF 计算示例

假设我们有以下三个文档组成的语料库：

- **文档1**: "The cat sat on the mat"
- **文档2**: "The dog sat on the log"
- **文档3**: "The cat and the dog are friends"

#### 第一步：计算词频（TF）

词频（Term Frequency, TF）表示一个词在文档中出现的频率。这里我们使用对数化的公式：

$$
TF_{t, d} = \begin{cases}1 + \log_{10} count(t, d) &\text{if } count(t, d) > 0 \\ 0 & \text{otherwise}\end{cases}
$$

以文档1 "The cat sat on the mat" 为例：

- 分词结果：["the", "cat", "sat", "on", "the", "mat"]
- 词频统计：
  - the: 2
  - cat: 1
  - sat: 1
  - on: 1
  - mat: 1

计算 TF：

- the: \(1 + \log_{10}(2) \approx 1 + 0.301 = 1.301\)
- cat: \(1 + \log_{10}(1) = 1 + 0 = 1\)
- sat: 1
- on: 1
- mat: 1

#### 第二步：计算逆文档频率（IDF）

逆文档频率（Inverse Document Frequency, IDF）衡量一个词的普遍重要性。公式为：

$$
IDF_t = \log_{10} \left( \frac{N}{DF_t} \right)
$$

其中：
- \(N\) 是文档总数（这里是3）
- \(DF_t\) 是包含词 \(t\) 的文档数量

首先统计每个词的 DF：

- the: 出现在所有3个文档 → DF=3
- cat: 出现在文档1和文档3 → DF=2
- sat: 出现在文档1和文档2 → DF=2
- on: 出现在文档1和文档2 → DF=2
- mat: 只在文档1出现 → DF=1
- dog: 出现在文档2和文档3 → DF=2
- log: 只在文档2出现 → DF=1
- and: 只在文档3出现 → DF=1
- are: 只在文档3出现 → DF=1
- friends: 只在文档3出现 → DF=1

计算 IDF：

- the: \(\log_{10}(3/3) = \log_{10}(1) = 0\)
- cat: \(\log_{10}(3/2) \approx \log_{10}(1.5) \approx 0.176\)
- sat: \(\log_{10}(3/2) \approx 0.176\)
- on: \(\log_{10}(3/2) \approx 0.176\)
- mat: \(\log_{10}(3/1) \approx \log_{10}(3) \approx 0.477\)
- dog: \(\log_{10}(3/2) \approx 0.176\)
- log: \(\log_{10}(3/1) \approx 0.477\)
- and: \(\log_{10}(3/1) \approx 0.477\)
- are: \(\log_{10}(3/1) \approx 0.477\)
- friends: \(\log_{10}(3/1) \approx 0.477\)

#### 第三步：计算 TF-IDF

TF-IDF 是 TF 和 IDF 的乘积：

$$
\text{TF-IDF}_{t,d} = TF_{t,d} \times IDF_t
$$

以文档1中的 "cat" 为例：

- TF("cat", 文档1) = 1
- IDF("cat") ≈ 0.176
- TF-IDF = \(1 \times 0.176 = 0.176\)

再以文档1中的 "mat" 为例：

- TF("mat", 文档1) = 1
- IDF("mat") ≈ 0.477
- TF-IDF = \(1 \times 0.477 = 0.477\)

#### 完整示例：文档1的 TF-IDF 向量

文档1 "The cat sat on the mat" 的词和 TF-IDF 值：

- the: \(1.301 \times 0 = 0\) （"the" 在所有文档中出现，IDF=0，因此 TF-IDF=0）
- cat: \(1 \times 0.176 = 0.176\)
- sat: \(1 \times 0.176 = 0.176\)
- on: \(1 \times 0.176 = 0.176\)
- mat: \(1 \times 0.477 = 0.477\)

其他词的 TF-IDF 为 0（因为未出现在文档1中）。

#### 文档2的 TF-IDF 示例

文档2 "The dog sat on the log"：

- the: \(1.301 \times 0 = 0\)
- dog: \(1 \times 0.176 = 0.176\)
- sat: \(1 \times 0.176 = 0.176\)
- on: \(1 \times 0.176 = 0.176\)
- log: \(1 \times 0.477 = 0.477\)

#### 文档3的 TF-IDF 示例

文档3 "The cat and the dog are friends"：

- the: \(1.301 \times 0 = 0\)
- cat: \(1 \times 0.176 = 0.176\)
- dog: \(1 \times 0.176 = 0.176\)
- and: \(1 \times 0.477 = 0.477\)
- are: \(1 \times 0.477 = 0.477\)
- friends: \(1 \times 0.477 = 0.477\)

### 总结

- **TF**：衡量词在文档中的频率（对数化后）。
- **IDF**：衡量词在整个语料库中的稀有程度。
- **TF-IDF**：高值表示词在当前文档中重要且在其他文档中不常见。

例如：
- "mat" 在文档1中的 TF-IDF 较高（0.477），因为它是文档1独有的。
- "the" 的 TF-IDF 为 0，因为它出现在所有文档中，没有区分能力。
