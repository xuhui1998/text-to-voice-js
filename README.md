# 文本转语音 (TTS) 服务器

基于 Node.js 和 Edge TTS 的文本转语音工具，支持多种语音包和参数调整。

🌐 **在线演示**: https://text-to-voice-38frwhohj-mizaos-projects.vercel.app

## 功能特性

- 🎤 多种中文语音包选择
- 📝 直接输入文本转换
- 📄 上传 TXT 文件转换
- 🎚️ 可调节语速、音量、音调
- 📊 实时进度显示
- ▶️ 在线播放生成的音频
- 💾 一键下载音频文件

## 安装

```bash
# 安装依赖
npm install
```

## 运行

```bash
# 启动服务器
node server.js
```

服务器将在 http://localhost:3000 启动

## API 接口

### 1. 获取语音列表
```
GET /api/voices?lang=zh
```

### 2. 文本转语音
```
POST /api/tts
Content-Type: application/json

{
  "text": "你好世界",
  "filename": "output.mp3",
  "voice": "zh-CN-XiaoxiaoNeural",
  "rate": 10,
  "volume": 10,
  "pitch": 10
}
```

### 3. 上传文件转语音
```
POST /api/upload-and-tts
Content-Type: multipart/form-data

file: <txt文件>
voice: "zh-CN-XiaoxiaoNeural"
rate: 10
volume: 10
pitch: 10
```

## 使用说明

1. 访问 http://localhost:3000
2. 选择"文本转语音"或"文件转语音"标签
3. 选择语音包
4. 输入文本或上传文件
5. 调整语音参数（可选）
6. 点击"生成语音"按钮
7. 等待生成完成
8. 播放或下载音频

## 技术栈

- Express.js - Web 框架
- edge-tts-universal - TTS 库
- Multer - 文件上传
- 纯 JavaScript 实现，无需 Python

## 目录结构

```
text-to-speech/
├── server.js          # 服务器主文件
├── index.html         # 前端页面
├── wav/               # 生成的音频文件目录
├── uploads/           # 临时上传文件目录
├── package.json       # 依赖配置
├── vercel.json        # Vercel 部署配置
├── DEPLOYMENT.md      # 详细部署指南
└── QUICK_START.md     # 快速部署指南
```

