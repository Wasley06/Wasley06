import { app, BrowserWindow, shell, ipcMain, Menu } from 'electron'
import http from 'node:http'
import path from 'node:path'
import fs from 'node:fs'

// ─── Local HTTP server ────────────────────────────────────────────────────────
// Serve the Vite-built dist/ over a random localhost port.
// This is identical to how Figma preview works and bypasses every
// file:// / CORS / ES-module restriction in every Chromium version.
let staticServer: http.Server | null = null

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.mjs':  'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.ttf':  'font/ttf',
  '.json': 'application/json',
  '.webp': 'image/webp',
  '.gif':  'image/gif',
}

function startServer(distPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    staticServer = http.createServer((req, res) => {
      // Strip query string, decode URI, default to index.html
      const rawPath = (req.url ?? '/').split('?')[0]
      let urlPath: string
      try { urlPath = decodeURIComponent(rawPath) } catch { urlPath = rawPath }

      const candidate = path.join(distPath, urlPath === '/' ? 'index.html' : urlPath)

      // SPA fallback: any unknown path → index.html
      const filePath = fs.existsSync(candidate) && fs.statSync(candidate).isFile()
        ? candidate
        : path.join(distPath, 'index.html')

      const ext = path.extname(filePath).toLowerCase()
      res.setHeader('Content-Type', MIME[ext] ?? 'application/octet-stream')
      res.setHeader('Cache-Control', 'no-cache')

      const stream = fs.createReadStream(filePath)
      stream.on('error', () => { res.writeHead(404); res.end('Not found') })
      stream.pipe(res)
    })

    // Port 0 → OS picks a free port
    staticServer.listen(0, '127.0.0.1', () => {
      const addr = staticServer!.address() as { port: number }
      resolve(addr.port)
    })

    staticServer.on('error', reject)
  })
}

// ─── Window ───────────────────────────────────────────────────────────────────
let mainWindow: BrowserWindow | null = null

function createWindow(port: number) {
  Menu.setApplicationMenu(null)

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    title: 'Fabegon ERP',
    frame: false,
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: 16, y: 16 },
    show: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
  })

  mainWindow.loadURL(`http://127.0.0.1:${port}`)

  mainWindow.webContents.on('did-fail-load', (_e, code, desc) => {
    // Show diagnostic error instead of blank screen
    mainWindow?.loadURL(
      `data:text/html,<body style="font-family:monospace;padding:32px;color:#c00;background:#fff">` +
      `<h2>Fabegon ERP — load failed</h2>` +
      `<p>HTTP server port: ${port}</p>` +
      `<p>Error ${code}: ${desc}</p>` +
      `<p>App path: ${app.getAppPath()}</p></body>`
    )
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) shell.openExternal(url)
    return { action: 'deny' }
  })

  mainWindow.on('closed', () => { mainWindow = null })
}

// ─── App lifecycle ────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  if (!app.isPackaged) {
    // Dev: use Vite dev server directly
    createWindow(5173)
    if (mainWindow) mainWindow.loadURL('http://localhost:5173')
    return
  }

  const distPath = path.join(app.getAppPath(), 'dist')

  if (!fs.existsSync(distPath)) {
    // dist missing — show error
    const errWin = new BrowserWindow({ width: 800, height: 400, show: true })
    errWin.loadURL(
      `data:text/html,<body style="font-family:monospace;padding:32px;color:#c00;background:#fff">` +
      `<h2>Fabegon ERP — dist not found</h2>` +
      `<p>Expected: ${distPath}</p><p>Please reinstall.</p></body>`
    )
    return
  }

  try {
    const port = await startServer(distPath)
    createWindow(port)
  } catch (err) {
    const errWin = new BrowserWindow({ width: 800, height: 400, show: true })
    errWin.loadURL(
      `data:text/html,<body style="font-family:monospace;padding:32px;color:#c00;background:#fff">` +
      `<h2>Fabegon ERP — server error</h2><p>${String(err)}</p></body>`
    )
  }
})

app.on('window-all-closed', () => {
  staticServer?.close()
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  // On macOS re-create window if dock icon clicked
  if (mainWindow === null && staticServer) {
    const addr = staticServer.address() as { port: number } | null
    if (addr) createWindow(addr.port)
  }
})

ipcMain.handle('app-version', () => app.getVersion())
ipcMain.on('window-minimize', () => mainWindow?.minimize())
ipcMain.on('window-maximize', () => {
  if (mainWindow?.isMaximized()) mainWindow.unmaximize()
  else mainWindow?.maximize()
})
ipcMain.on('window-close', () => mainWindow?.close())
ipcMain.handle('window-is-maximized', () => mainWindow?.isMaximized() ?? false)
