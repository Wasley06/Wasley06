import { app, BrowserWindow, shell, ipcMain, Menu, protocol, net } from 'electron'
import path from 'node:path'
import fs from 'node:fs'
import { pathToFileURL } from 'node:url'

// ─── Register app:// scheme BEFORE app is ready ───────────────────────────────
// Serving via a privileged custom scheme gives the renderer a real HTTP-like
// origin, which means ES-module chunks load without ANY file:// restrictions.
// This is the standard pattern used by electron-vite and all production
// Electron+Vite apps. It works because:
//   1. asar:false → files are real files on disk
//   2. net.fetch(file://...) reads real files and returns a proper Response
//   3. Chromium treats app:// as a secure standard origin → no CORS blocks
protocol.registerSchemesAsPrivileged([{
  scheme: 'app',
  privileges: {
    secure: true,
    standard: true,
    supportFetchAPI: true,
    corsEnabled: false,
    stream: true,
  },
}])

// MIME types for assets Vite emits
const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript',
  '.mjs':  'application/javascript',
  '.css':  'text/css',
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

function getMime(p: string): string {
  return MIME[path.extname(p).toLowerCase()] ?? 'application/octet-stream'
}

let mainWindow: BrowserWindow | null = null

function createWindow() {
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
      webSecurity: false,
    },
  })

  if (!app.isPackaged) {
    // Dev: use Vite's dev server
    mainWindow.loadURL('http://localhost:5173')
  } else {
    // Production: serve via app:// — gives renderer a proper origin
    mainWindow.loadURL('app://dist/index.html')
  }

  mainWindow.webContents.on('did-fail-load', (_e, code, desc, url) => {
    if (!app.isPackaged) return
    // Show a visible error instead of blank screen so we can diagnose
    mainWindow?.loadURL(
      `data:text/html,<body style="font-family:monospace;padding:32px;color:#c00;background:#fff">` +
      `<h2>Fabegon ERP — failed to load</h2>` +
      `<p>URL: ${url}</p><p>Code: ${code} — ${desc}</p>` +
      `<p>App path: ${app.getAppPath()}</p></body>`
    )
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) shell.openExternal(url)
    return { action: 'deny' }
  })

  mainWindow.on('closed', () => { mainWindow = null })
}

app.whenReady().then(() => {
  // ─── Register protocol handler ────────────────────────────────────────────
  // app.getAppPath() is the unpacked app root (resources/app/ with asar:false).
  // Map every app://dist/... request to the real file on disk.
  const appRoot = app.getAppPath()

  protocol.handle('app', (request) => {
    try {
      const url = new URL(request.url)
      // pathname looks like "/dist/assets/index-abc.js" or "/dist/index.html"
      const relPath = url.pathname.replace(/^\//, '') // strip leading slash
      const filePath = path.join(appRoot, relPath)

      // SPA fallback: any unknown path → index.html
      const target = fs.existsSync(filePath) ? filePath : path.join(appRoot, 'dist', 'index.html')

      // Use net.fetch with file:// URL — works because asar:false means real files
      return net.fetch(pathToFileURL(target).toString())
    } catch {
      return new Response('Not found', { status: 404 })
    }
  })

  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (mainWindow === null) createWindow()
})

ipcMain.handle('app-version', () => app.getVersion())
ipcMain.on('window-minimize', () => mainWindow?.minimize())
ipcMain.on('window-maximize', () => {
  if (mainWindow?.isMaximized()) mainWindow.unmaximize()
  else mainWindow?.maximize()
})
ipcMain.on('window-close', () => mainWindow?.close())
ipcMain.handle('window-is-maximized', () => mainWindow?.isMaximized() ?? false)
