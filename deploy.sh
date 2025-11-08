#!/bin/bash

echo "🚀 开始部署文本转语音项目..."
echo ""

# 检查是否安装了 vercel
if ! command -v vercel &> /dev/null
then
    echo "❌ Vercel CLI 未安装"
    echo "📦 正在安装 Vercel CLI..."
    npm install -g vercel
fi

echo "✅ Vercel CLI 已就绪"
echo ""

# 部署后端到 Vercel
echo "📤 部署后端到 Vercel..."
vercel --prod

echo ""
echo "✅ 后端部署完成！"
echo ""
echo "⚠️  请记录上面的 Vercel 地址，然后："
echo "   1. 修改 index.html 中的 API_BASE_URL（第 357 行）"
echo "   2. 将代码推送到 GitHub"
echo "   3. 在 GitHub 仓库设置中启用 GitHub Pages"
echo ""
echo "📖 详细步骤请查看 DEPLOYMENT.md"

