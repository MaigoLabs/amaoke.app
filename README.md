# アマオケ / amaoke.app

Practice Japanese Karaoke lyrics reading and typing at the same time with amaoke.app!

是一个日语卡拉 OK 阅读打字唱歌练习软件！

<img width="30%" alt="image" src="https://github.com/user-attachments/assets/4f47bc67-56c9-4c4f-98e6-aff4d1886672" />


## 使用教程

用手机打开 [amaoke.app](https://amaoke.app) 就可以了！

（电脑上也可以用，虽然没有做视图适配所以可能有点怪）

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
    * [ ] 分段处理以加快初始加载速度
    * [x] 自动预处理下一首歌
  * [x] 调节人声伴奏比例
  * [x] 跟随音乐滚动歌词
  * [x] 播放/暂停音乐控制
  * [x] 实时变调变速（速度越快音调就越高）
    * [ ] 单独控制变调和变速（非实时）
  * [ ] 音域分析（自动推荐升降调幅度）
* [ ] 电视模式
  * [ ] 和手机配对、用手机点歌
  * [ ] 从网易云搜索歌曲

## Technical Tasks

* [x] i18n
* [x] 404 page
* [x] Previous song / next song buttons
* [x] Update an existing playlist
* [ ] Allow users to correct lyric pronunciations through correction feedback
* [ ] Correct lyrics timing inconsistencies (i.e. 网易云的歌词因为是业余用户上传的，时间戳不一定准确。但是 waveform 里面可以分析出每段人声的具体开始结束时间，也许可以自动修正)
* [x] Processing lyrics and audio should be parallel
* [x] Add admin password to admin pages
* [x] About page
* [ ] Intro popup
* [ ] Re-encode songs using opus
* [x] Meta tags
* [ ] Allow deleting incorrect characters

## 自搭服务器文档 / Self-hosting Guide

**运行服务器需要的东西：**

1. 一个 openrouter.ai 的 API key
2. 一个网易云账号
3. docker
4. 一张 >2GB 显存的显卡（推荐 Nvidia，其他显卡需要改 Dockerfile）
5. 小猫

**自搭教程**

1. 克隆仓库

```sh
git clone https://github.com/MaigoLabs/amaoke.app
cd amaoke.app/deploy
```

2. 创建一个叫 `.env` 的文件，把下面这些写进去

```.env
OPENROUTER_API_KEY="你的 openrouter.ai API key"
ADMIN_PASSWORD=一个随机管理密码
```

3. 运行

```sh
docker compose up -d
```

4. 去登录网易云账号

```
http://127.0.0.1:3000/admin/netease-login?pwd=你的管理密码
```

5. 让小猫喵喵
6. 完成了！

## 开发者文档 / Developer Guide

欢迎给这个项目贡献代码！想要贡献代码的话请参考 [README_DEVELOPER.md](README_DEVELOPER.md)


## 更新日志 / Changelog

### v1.0.4

* 修复了 12 キー无法打出 ぱ 行的问题

### v1.0.3

* 修复了手机浏览器展开输入法会挡住视图和自动居中偏移的问题
* 修复了手机浏览器收缩地址栏之前最下面的按钮会看不到的问题
* 修复了 12 キー输入法输入平假名濁音会被判错的问题
* 修复了 12 キー输入法输入濁音时，如果输入完对应的清音之后并没有转换而是继续输入，不会被判错的问题

### v1.0.2

* 修复了 12 キー（日语九宫格）输入法输入某些正确的濁音（e.g. が）会被判错的问题
* 修复了 12 キー（日语九宫格）输入法输入不正确的濁音不会被判错的问题

### v1.0.1

* 修复了英文单词之间显示没有空格的问题
