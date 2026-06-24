@echo off
chcp 65001 >/dev/null
title 死而替生 - ReHeart

echo.
echo   ========================================
echo         死而替生 - ReHeart
echo   ========================================
echo.
echo   正在启动游戏...
echo.

cd /d "%~dp0"

if not exist "dist\index.html" (
    echo   [!] 正在构建游戏，请稍候...
    call npm run build
    echo.
)

echo   [OK] 游戏已就绪！
echo.
echo   访问地址: http://localhost:4173
echo   按 Ctrl+C 停止服务器
echo.

start http://localhost:4173
call npm run preview
