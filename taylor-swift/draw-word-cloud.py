import pandas as pd
from wordcloud import WordCloud, STOPWORDS
import matplotlib.pyplot as plt
import re
from matplotlib.colors import ListedColormap

# 读取TSV文件
def read_tsv_file(file_path):
    return pd.read_csv(file_path, sep='\t', header=None, names=['code_info', 'lyrics'], encoding='ISO-8859-1')

# 提取专辑Code
def extract_album_code(code_str):
    return code_str.split(':')[0]

# 处理数据，按专辑分组
def process_data(df):
    # 添加专辑Code列
    df['album_code'] = df['code_info'].apply(extract_album_code)
    
    # 按专辑分组并合并歌词
    album_lyrics = df.groupby('album_code')['lyrics'].apply(lambda x: ' '.join(x.astype(str))).to_dict()
    return album_lyrics

# 生成词云图
def generate_wordcloud(album_code, text, output_dir='wordclouds', colormap='viridis'):
    import os
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    # 清洗文本 - 移除非字母字符
    text = re.sub(r'[^\w\s]', '', text)
    
    # 创建词云对象
    wordcloud = WordCloud(
        width=800,
        height=400,
        background_color=None,
        mode='RGBA',
        max_words=200,
        colormap=colormap,
        contour_width=3,
        contour_color='steelblue',
        stopwords=STOPWORDS.union({"oh", "dont", "Im", "youre", "youll", "shouldnt"})
    ).generate(text)
    
    
    # 保存图片
    output_path = f'{output_dir}/{album_code}_wordcloud.png'
    wordcloud.to_file(output_path)
    print(f'Word cloud for {album_code} saved to {output_path}')

# 主函数
def main(tsv_file_path):
    # 读取数据
    df = read_tsv_file(tsv_file_path)
    
    # 处理数据
    album_lyrics = process_data(df)
    album_colors = {
        "TSW": ["#1D4737", "#81A757", "#1BAEC6", "#523d28", "#E7DBCC"],
        "FER": ["#6E4823", "#976F34", "#CBA863", "#ECD59F", "#E1D4C2"],
        "SPN": ["#2A122C", "#4a2454", "#72325F", "#874886", "#96689A"],
        "RED": ["#400303", "#731803", "#967862", "#B38468", "#C7C5B6"],
        "NEN": ["#5D4E5D", "#846578", "#92573C", "#C6B69C", "#D8D8CF"],
        "REP": ["#2C2C2C", "#515151", "#5B5B5B", "#6E6E6E", "#B9B9B9"],
        "LVR": ["#76BAE0", "#8C4F66", "#B8396B", "#EBBED3", "#FFF5CC"],
        "FOL": ["#3E3E3E", "#545454", "#5C5C5C", "#949494", "#EBEBEB"],
        "EVE": ["#160E10", "#421E18", "#D37F55", "#85796D", "#E0D9D7"],
        "MID": ["#121D27", "#5A658B", "#6F86A2", "#85A7BA", "#AA9EB6"],
        "TPD": ["#1C160F", "#3F3824", "#635B3A", "#ADA795", "#F7F4F0"]
    }
    
    # 为每个专辑生成词云
    for album_code, lyrics in album_lyrics.items():
        if album_code != "OTH":
            color = ListedColormap(album_colors[album_code])
            generate_wordcloud(album_code, lyrics, colormap=color)

if __name__ == '__main__':
    # 替换为你的TSV文件路径
    tsv_file_path = 'data/cots-lyric-details.tsv'
    main(tsv_file_path)
