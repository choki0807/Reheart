@echo off
chcp 65001 >nul
title 死而替生 - ReHeart
color 0F

echo.
echo   ╔═══════════════════════════════════════════════╗
echo   ║                                               ║
echo   ║          死 而 替 生  -  ReHeart              ║
echo   ║                                               ║
echo   ║    她们拿走了你的命，我把它还给你。          ║
echo   ║    但代价是，你要成为我。                     ║
echo   ║                                               ║
echo   ╚═══════════════════════════════════════════════╝
echo.

cd /d "%~dp0"

:: 检查 Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo   [错误] 未检测到 Node.js
    echo.
    echo   请先安装 Node.js: https://nodejs.org
    echo.
    pause
    exit /b
)

:: 检查是否已构建
if not exist "dist\index.html" (
    echo   [1/2] 正在构建游戏...
    call npm run build >nul 2>nul
    echo   [√] 构建完成
) else (
    echo   [√] 游戏已就绪
)

echo.
echo   ═══════════════════════════════════════════════
echo.
echo   游戏正在启动，请稍候...
echo.
echo   浏览器将自动打开，如果没有请访问:
echo   http://localhost:4173
echo.
echo   关闭此窗口即可停止游戏
echo.
echo   ═══════════════════════════════════════════════
echo.

:: 延迟2秒后打开浏览器
ping -n 3 127.0.0.1 >nul
start http://localhost:4173

:: 启动服务器
node server.js
