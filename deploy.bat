@echo off
chcp 65001 >nul
echo ================================
echo   简单记账系统 - 部署脚本
echo ================================

REM 检查 Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo 错误：未检测到 Node.js，请先安装 Node.js v14+
    echo 访问 https://nodejs.org/ 下载安装
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo ✓ Node.js 版本：%NODE_VERSION%

REM 安装依赖
echo.
echo 正在安装依赖...
call npm install --production

if %errorlevel% neq 0 (
    echo 错误：依赖安装失败
    pause
    exit /b 1
)

echo ✓ 依赖安装完成

REM 创建数据文件
if not exist "data.json" (
    echo [] > data.json
    echo ✓ 创建数据文件
)

echo.
echo ================================
echo   部署完成！
echo ================================
echo.
echo 启动服务：
echo   npm start
echo.
echo 或使用 PM2（推荐）：
echo   npm install -g pm2
echo   pm2 start ecosystem.config.js
echo.
pause
