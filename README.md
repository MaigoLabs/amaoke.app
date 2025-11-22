# KaraDash (IPR)

Practice Japanese Karaoke lyrics reading and typing at the same time with KaraDash!

在这里可以同时练习日语卡拉 OK 歌词阅读速度和打字速度！

## 主要功能

* [x] 导入网易云歌单自动获取歌词
* [x] 自动给歌词标注读音
* [x] 打字模式
  * [x] 切换 furigana 显示模式 (显示/隐藏/仅显示假名/显示罗马音)
  * [x] 统计打字速度和准确率
  * [x] 跟随打字速度自动播放/暂停音乐
  * [ ] 历史成绩和进步曲线
* [x] 唱歌模式
  * [x] 自动分离人声和伴奏
  * [x] 调节人声伴奏比例
  * [x] 跟随音乐滚动歌词
  * [ ] 升降调
  * [ ] 播放/暂停音乐控制
  * [ ] 变速
  * [ ] 音域分析（自动推荐升降调幅度）
* [ ] 电视模式
  * [ ] 和手机配对、用手机点歌

## Technical Tasks

* [ ] 多语言支持
* [ ] 404 page
* [ ] Update an existing playlist
* [ ] Allow users to correct lyric pronunciations through correction feedback
* [ ] Correct lyrics timing inconsistencies (i.e. 网易云的歌词因为是业余用户上传的，时间戳不一定准确。但是 waveform 里面可以分析出每句歌词的具体开始结束时间，也许可以自动修正)


## Development server

### Requirements
- Bun
- Docker

### 1. Environment setup
1. Create your `.env` file by renaming `.env.example` to `.env`
2. Add the following variable:
   OPENROUTER_API_KEY=your_key_here
   (Request the key from the repository owner)

### 2. Start the database
Run in the project root:
docker compose up

### 3. Install dependencies
Install Bun:
https://bun.com/get

Then install project dependencies:
bun install

### 4. Start development server
bun run dev
