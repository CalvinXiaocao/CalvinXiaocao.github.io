好的！我们用一个更复杂的例子，**扩展特征为 bag-of-words**（不再限制窗口大小），并允许词在句子中重复出现，使得计数（Count）不恒为 1。  
仍以 **"bank"** 为目标词，词义为：  
- \( s_1 \): 金融机构（financial institution）  
- \( s_2 \): 河岸（river bank）  

---

### **1. 训练数据**
假设训练数据如下（标注了 "bank" 的词义）：

| 句子（上下文 \( C \)）                                     | 词义 \( s_k \)   |
|-----------------------------------------------------------|------------------|
| "deposit money bank cash deposit"                         | \( s_1 \)        |
| "river bank water flows river"                             | \( s_2 \)        |
| "bank loan interest bank"                                  | \( s_1 \)        |
| "fish bank river sand"                                     | \( s_2 \)        |

#### **Bag-of-Words 特征提取**
统计每个句子中所有词的频率（忽略大小写和标点）：

| 词义 \( s_k \) | 句子ID | 词频（Bag-of-Words）                          |
|----------------|--------|-----------------------------------------------|
| \( s_1 \)      | 1      | {"deposit":2, "money":1, "bank":1, "cash":1} |
| \( s_1 \)      | 3      | {"bank":2, "loan":1, "interest":1}           |
| \( s_2 \)      | 2      | {"river":2, "bank":1, "water":1, "flows":1}   |
| \( s_2 \)      | 4      | {"fish":1, "bank":1, "river":1, "sand":1}    |

---

### **2. 概率估计**
#### **统计词义和特征的全局出现次数**
- **词义先验概率 \( P(s_k) \)**：
  - \( \text{Count}(s_1) = 2 \)（句子1和3）
  - \( \text{Count}(s_2) = 2 \)（句子2和4）
  - \( P(s_1) = P(s_2) = \frac{2}{4} = 0.5 \)。

- **条件概率 \( P(v_x \| s_k) \)**：
  统计每个词义下所有句子的词频总和（注意：同一个词在不同句子中的频次累加）：

  - **\( s_1 \) 的词频统计**：
    - "deposit":2, "money":1, "bank":3（句子1中1次 + 句子3中2次）, "cash":1, "loan":1, "interest":1  
    - 总词数 \( \text{Count}(s_1) = 2+1+3+1+1+1 = 9 \)

  - **\( s_2 \) 的词频统计**：
    - "river":3（句子2中2次 + 句子4中1次）, "bank":2, "water":1, "flows":1, "fish":1, "sand":1  
    - 总词数 \( \text{Count}(s_2) = 3+2+1+1+1+1 = 9 \)

  - 计算条件概率（使用拉普拉斯平滑，\( \alpha=1 \)，词汇表大小 \( |V|=10 \)）：
    - 例如：  
      \( P(\text{river} \| s_1) = \frac{0 + 1}{9 + 10} = \frac{1}{19} \)（"river" 未在 \( s_1 \) 中出现过）  
      \( P(\text{bank} \| s_1) = \frac{3 + 1}{9 + 10} = \frac{4}{19} \)  
      \( P(\text{river} \| s_2) = \frac{3 + 1}{9 + 10} = \frac{4}{19} \)

---

### **3. 测试阶段**
测试句子：  
**"river bank interest deposit"**  
提取 Bag-of-Words 特征：  
\( C' = \{\text{river}:1, \text{bank}:1, \text{interest}:1, \text{deposit}:1\} \)

#### **计算后验概率**
1. **对于 \( s_1 \)**：
   \[
   P(s_1 \| C') \propto P(s_1) \cdot \prod_{v_x \in C'} P(v_x \| s_1)  
   = 0.5 \cdot P(\text{river} \| s_1) \cdot P(\text{bank} \| s_1) \cdot P(\text{interest} \| s_1) \cdot P(\text{deposit} \| s_1)  
   = 0.5 \cdot \frac{1}{19} \cdot \frac{4}{19} \cdot \frac{2}{19} \cdot \frac{3}{19}  
   \approx 0.5 \cdot 0.00035 \approx 0.000175
   \]

2. **对于 \( s_2 \)**：
   \[
   P(s_2 \| C') \propto P(s_2) \cdot \prod_{v_x \in C'} P(v_x \| s_2)  
   = 0.5 \cdot P(\text{river} \| s_2) \cdot P(\text{bank} \| s_2) \cdot P(\text{interest} \| s_2) \cdot P(\text{deposit} \| s_2)  
   = 0.5 \cdot \frac{4}{19} \cdot \frac{3}{19} \cdot \frac{1}{19} \cdot \frac{1}{19}  
   \approx 0.5 \cdot 0.00017 \approx 0.000085
   \]

#### **选择最优词义**
比较后验概率：
- \( P(s_1 \| C') \approx 0.000175 \)
- \( P(s_2 \| C') \approx 0.000085 \)

因为 \( 0.000175 > 0.000085 \)，预测词义为 \( s_1 \)（金融机构）。  
**分析**：虽然 "river" 更倾向于 \( s_2 \)，但 "interest" 和 "deposit" 对 \( s_1 \) 的贡献更大，最终结果符合金融场景。

---

### **4. 对数概率计算（数值稳定性优化）**
实际中，连乘会导致浮点数下溢，通常取对数：  
\[
s^* = \arg\max_{s_k} \left( \log P(s_k) + \sum_{v_x \in C'} \log P(v_x \| s_k) \right)
\]

- **\( s_1 \)**：
  \[
  \log 0.5 + \log \frac{1}{19} + \log \frac{4}{19} + \log \frac{2}{19} + \log \frac{3}{19} \approx -0.69 - 2.94 - 1.39 - 2.25 - 1.74 \approx -9.01
  \]

- **\( s_2 \)**：
  \[
  \log 0.5 + \log \frac{4}{19} + \log \frac{3}{19} + \log \frac{1}{19} + \log \frac{1}{19} \approx -0.69 - 1.39 - 1.74 - 2.94 - 2.94 \approx -9.70
  \]

仍选择 \( s_1 \)（因为 -9.01 > -9.70）。

---

### **关键点总结**
1. **Bag-of-Words 特征**：考虑所有词的频率，而不仅是相邻词。  
2. **重复词处理**：同一个词在句子中的多次出现会被累加统计。  
3. **平滑技术**：避免零概率问题（如未登录词 "interest" 在 \( s_2 \) 中的概率）。  
4. **对数空间**：将连乘转换为累加，提升数值稳定性。  

通过这个例子，可以看到朴素贝叶斯如何利用词频和全局统计信息进行消歧，尽管独立性假设较强，但在实际中仍有一定效果。