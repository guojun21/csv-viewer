#!/bin/bash

# CSV Viewer 启动脚本

cd "$(dirname "$0")"

# 检查 node_modules 是否存在
if [ ! -d "node_modules" ]; then
    echo "📦 首次运行，正在安装依赖..."
    npm install
fi

echo "🚀 启动 CSV Viewer..."
npm start

