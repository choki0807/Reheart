# 死而替生 - ReHeart
# 双击运行或右键选择"使用 PowerShell 运行"

$Host.UI.RawUI.WindowTitle = "死而替生 - ReHeart"
$Host.UI.RawUI.ForegroundColor = "White"

Write-Host ""
Write-Host "  =============================================" -ForegroundColor Cyan
Write-Host "" -ForegroundColor Cyan
Write-Host "          死 而 替 生  -  ReHeart" -ForegroundColor Yellow
Write-Host "" -ForegroundColor Cyan
Write-Host "    她们拿走了你的命，我把它还给你。" -ForegroundColor Gray
Write-Host "    但代价是，你要成为我。" -ForegroundColor Gray
Write-Host "" -ForegroundColor Cyan
Write-Host "  =============================================" -ForegroundColor Cyan
Write-Host ""

Set-Location $PSScriptRoot

# 检查 Node.js
try {
    $nodeVersion = node --version
    Write-Host "  [√] Node.js $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "  [错误] 未检测到 Node.js" -ForegroundColor Red
    Write-Host "  请先安装 Node.js: https://nodejs.org" -ForegroundColor Yellow
    Read-Host "  按回车键退出"
    exit
}

# 检查是否已构建
if (-not (Test-Path "dist\index.html")) {
    Write-Host "  [1/2] 正在构建游戏..." -ForegroundColor Yellow
    npm run build 2>$null | Out-Null
    Write-Host "  [√] 构建完成" -ForegroundColor Green
} else {
    Write-Host "  [√] 游戏已就绪" -ForegroundColor Green
}

Write-Host ""
Write-Host "  =============================================" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  游戏正在启动，请稍候..." -ForegroundColor White
Write-Host ""
Write-Host "  浏览器将自动打开，如果没有请访问:" -ForegroundColor Gray
Write-Host "  http://localhost:4173" -ForegroundColor Cyan
Write-Host ""
Write-Host "  按 Ctrl+C 或关闭此窗口停止游戏" -ForegroundColor Gray
Write-Host ""
Write-Host "  =============================================" -ForegroundColor DarkGray
Write-Host ""

# 延迟后打开浏览器
Start-Sleep -Seconds 2
Start-Process "http://localhost:4173"

# 启动服务器
node server.js
