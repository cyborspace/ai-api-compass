#!/bin/bash

# AIGC Backend 快速启动脚本

set -e

echo "🚀 AIGC Backend 快速启动"
echo "=========================="

# 1. 检查环境变量
if [ -z "$DATABASE_URL" ]; then
    echo "⚠️  警告: DATABASE_URL 未设置"
    echo "   请设置: export DATABASE_URL=\"postgresql://user:password@localhost:5432/aigc_db\""
    echo ""
fi

# 2. 安装依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install
fi

# 3. 生成 Prisma Client
echo "🔧 生成 Prisma Client..."
npx prisma generate

# 4. 同步数据库
echo "📊 同步数据库..."
npx prisma db push

# 5. 运行 Seed 数据
echo "🌱 运行 Seed 数据..."
npx tsx run-seed.ts

# 6. 启动开发服务器
echo "🚀 启动开发服务器..."
npm run dev
