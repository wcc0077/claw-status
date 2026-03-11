#!/bin/bash

# OpenClaw Dashboard 快速启动脚本

echo "🦞 OpenClaw Dashboard 启动脚本"
echo "=============================="

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "错误：未找到 Node.js，请先安装 Node.js 20+"
    exit 1
fi

echo "Node.js 版本：$(node -v)"

# 检查是否已安装依赖
if [ ! -d "node_modules" ]; then
    echo "正在安装后端依赖..."
    npm install
fi

if [ ! -d "client/node_modules" ]; then
    echo "正在安装前端依赖..."
    cd client && npm install && cd ..
fi

# 启动
echo ""
echo "启动 Dashboard 服务器..."
echo "访问地址：http://localhost:3000"
echo ""

npm run dev
