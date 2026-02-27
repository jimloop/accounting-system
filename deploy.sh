#!/bin/bash

# 简单记账系统 - 快速部署脚本 (MySQL 版)

echo "================================"
echo "  简单记账系统 - 部署脚本"
echo "================================"

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "错误：未检测到 Node.js，请先安装 Node.js v14+"
    exit 1
fi

echo "✓ Node.js 版本：$(node -v)"

# 检查 MySQL
if ! command -v mysql &> /dev/null; then
    echo "警告：未检测到 MySQL 客户端"
fi

# 检查 .env 文件
if [ ! -f ".env" ]; then
    echo ""
    echo "未找到 .env 配置文件"
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "✓ 已创建 .env 文件"
        echo "⚠ 请编辑 .env 文件配置数据库连接信息"
        echo ""
        echo "配置完成后运行：npm start"
        exit 0
    fi
fi

# 安装依赖
echo ""
echo "正在安装依赖..."
npm install --production

if [ $? -ne 0 ]; then
    echo "错误：依赖安装失败"
    exit 1
fi

echo "✓ 依赖安装完成"

echo ""
echo "================================"
echo "  部署完成！"
echo "================================"
echo ""
echo "启动服务："
echo "  npm start"
echo ""
echo "或使用 PM2（推荐）："
echo "  pm2 start ecosystem.config.js"
echo ""
