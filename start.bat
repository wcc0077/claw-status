@echo off
REM OpenClaw Dashboard Windows 启动脚本

echo.
echo 🦞 OpenClaw Dashboard 启动脚本
echo ==============================

REM 检查 Node.js
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo 错误：未找到 Node.js，请先安装 Node.js 20+
    exit /b 1
)

echo Node.js 版本：
node -v

REM 检查是否已安装依赖
if not exist "node_modules" (
    echo 正在安装后端依赖...
    call npm install
)

if not exist "client\node_modules" (
    echo 正在安装前端依赖...
    cd client
    call npm install
    cd ..
)

echo.
echo 启动 Dashboard 服务器...
echo 访问地址：http://localhost:3000
echo.

call npm run dev
