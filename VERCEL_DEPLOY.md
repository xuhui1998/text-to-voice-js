# Vercel 部署指南

本指南将帮助您将 text-to-speech 项目部署到 Vercel。

## 📋 前置要求

1. **GitHub 账户** - 用于代码托管
2. **Vercel 账户** - 免费注册 [vercel.com](https://vercel.com)
3. **Node.js 项目** - 确保项目已配置好

## 🚀 部署步骤

### 方法一：通过 Vercel CLI（推荐）

#### 1. 安装 Vercel CLI

```bash
npm i -g vercel
```

#### 2. 登录 Vercel

```bash
vercel login
```

#### 3. 在项目目录中部署

```bash
cd /Users/xuhui/Desktop/my-demo/text-to-speech
vercel
```

按照提示操作：
- 是否设置并部署？选择 `Y`
- 项目名称：使用默认或自定义
- 目录：使用默认 `.`
- 覆盖设置：选择 `N`（首次部署）

#### 4. 生产环境部署

```bash
vercel --prod
```

### 方法二：通过 Vercel 网站（更简单）

#### 1. 将代码推送到 GitHub

```bash
# 如果还没有初始化 git
git init
git add .
git commit -m "Initial commit"

# 在 GitHub 创建新仓库，然后推送
git remote add origin https://github.com/你的用户名/你的仓库名.git
git push -u origin main
```

#### 2. 在 Vercel 导入项目

1. 访问 [vercel.com](https://vercel.com) 并登录
2. 点击 **"Add New..."** → **"Project"**
3. 从 GitHub 导入你的仓库
4. 配置项目：
   - **Framework Preset**: 选择 "Other" 或 "Express"
   - **Root Directory**: 使用默认 `.`
   - **Build Command**: 留空（或 `npm install`）
   - **Output Directory**: 留空
   - **Install Command**: `npm install`
5. 点击 **"Deploy"**

## ⚙️ 配置说明

### vercel.json 配置

项目已包含 `vercel.json` 配置文件，主要设置：

```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "server.js"
    },
    {
      "src": "/audio/(.*)",
      "dest": "server.js"
    },
    {
      "src": "/(.*)",
      "dest": "server.js"
    }
  ],
  "functions": {
    "server.js": {
      "maxDuration": 60
    }
  }
}
```

**配置说明：**
- `@vercel/node`: 将 Node.js 应用转换为 serverless 函数
- `maxDuration: 60`: 设置函数最大执行时间为 60 秒（TTS 生成可能需要较长时间）
- 路由配置：所有请求都路由到 `server.js`

### 环境变量（可选）

如果需要配置环境变量，可以在 Vercel 项目设置中添加：

1. 进入 Vercel 项目设置
2. 选择 **"Environment Variables"**
3. 添加需要的变量（本项目目前不需要额外环境变量）

## 🔧 重要注意事项

### 1. 文件存储限制

⚠️ **重要**：Vercel 的无服务器函数使用只读文件系统（除了 `/tmp` 目录）

- ✅ 项目已自动适配：在 Vercel 环境中使用 `/tmp` 目录存储音频文件
- ✅ 本地开发不受影响：仍使用项目目录
- ⚠️ `/tmp` 目录的文件是临时的，函数执行结束后可能被清理

### 2. 函数执行时间

- 免费版：最大 10 秒（Hobby 计划）
- Pro 版：最大 60 秒（已配置）
- 如果 TTS 生成时间较长，建议升级到 Pro 计划

### 3. 静态文件服务

- `index.html` 和静态资源通过 Express 静态文件中间件提供
- 生成的音频文件存储在 `/tmp` 目录，通过 `/audio` 路由访问

## 📝 部署后测试

部署成功后，访问你的 Vercel URL（例如：`https://your-project.vercel.app`），测试以下功能：

1. ✅ 访问首页
2. ✅ 获取语音列表：`GET /api/voices`
3. ✅ 文本转语音：`POST /api/tts`
4. ✅ 上传文件转语音：`POST /api/upload-and-tts`

## 🔍 故障排查

### 问题 1: 部署失败

**可能原因：**
- 依赖安装失败
- Node.js 版本不兼容

**解决方案：**
- 检查 `package.json` 中的依赖
- 在 Vercel 项目设置中指定 Node.js 版本（如 18.x）

### 问题 2: 函数超时

**可能原因：**
- TTS 生成时间超过函数执行时间限制

**解决方案：**
- 升级到 Vercel Pro 计划（60 秒限制）
- 或优化代码，减少处理时间

### 问题 3: 音频文件无法访问

**可能原因：**
- `/tmp` 目录文件被清理
- 路由配置问题

**解决方案：**
- 检查 `vercel.json` 中的路由配置
- 确保音频文件在请求期间仍然存在

### 问题 4: CORS 错误

**解决方案：**
- 项目已配置 CORS，允许所有来源
- 如需限制，修改 `server.js` 中的 CORS 配置

## 📚 相关资源

- [Vercel 文档](https://vercel.com/docs)
- [Vercel Node.js 运行时](https://vercel.com/docs/concepts/functions/serverless-functions/runtimes/node-js)
- [Express on Vercel](https://vercel.com/guides/using-express-with-vercel)

## 🎉 完成！

部署成功后，你将获得：
- 🌐 一个可公开访问的 URL
- 🔄 自动 HTTPS
- 🚀 全球 CDN 加速
- 📊 部署日志和监控

祝你部署顺利！

