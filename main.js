const { app, BrowserWindow } = require('electron')
const path = require('path')
const http = require('http')
const fs = require('fs')

const PORT = 4174
const DIST_DIR = path.join(__dirname, 'dist')

// MIME types
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
}

// 启动本地 HTTP 服务器
function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const urlObj = new URL(req.url, 'http://localhost')
      const pathname = decodeURIComponent(urlObj.pathname)
      let filePath = path.join(DIST_DIR, pathname === '/' ? 'index.html' : pathname)

      if (!filePath.startsWith(DIST_DIR)) {
        res.writeHead(403)
        res.end('Forbidden')
        return
      }

      const ext = path.extname(filePath).toLowerCase()
      const contentType = MIME_TYPES[ext] || 'application/octet-stream'

      fs.readFile(filePath, (err, data) => {
        if (err) {
          if (err.code === 'ENOENT') {
            fs.readFile(path.join(DIST_DIR, 'index.html'), (err2, data2) => {
              if (err2) {
                res.writeHead(404)
                res.end('Not Found')
              } else {
                res.writeHead(200, { 'Content-Type': 'text/html' })
                res.end(data2)
              }
            })
          } else {
            res.writeHead(500)
            res.end('Server Error')
          }
        } else {
          res.writeHead(200, { 'Content-Type': contentType })
          res.end(data)
        }
      })
    })

    server.listen(PORT, () => {
      console.log(`本地服务器已启动: http://localhost:${PORT}`)
      resolve(server)
    })
  })
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    title: '死而替生 - ReHeart',
    icon: path.join(__dirname, 'dist/favicon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    autoHideMenuBar: true,
    resizable: true,
    backgroundColor: '#000000',
  })

  // 通过 HTTP 加载，确保绝对路径正确解析
  win.loadURL(`http://localhost:${PORT}`)
}

app.whenReady().then(async () => {
  await startServer()
  createWindow()
})

app.on('window-all-closed', () => {
  app.quit()
})
