import { app, BrowserWindow, shell, ipcMain, dialog, Menu, protocol, net } from 'electron'
import { autoUpdater } from 'electron-updater'
import path from 'node:path'
import fs from 'node:fs'
import { pathToFileURL } from 'node:url'

// Register the custom `app://` scheme BEFORE app is ready.
// Gives the renderer a real origin so crossorigin ES-module scripts load correctly.
// Must happen before app.whenReady() — this call is synchronous.
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'app',
    privileges: {
      secure: true,
      standard: true,
      supportFetchAPI: true,
      corsEnabled: false,
      stream: true,
    },
  },
])

let mainWindow: BrowserWindow | null = null

const MIME: Record<string, string> = {
  '.html': 'text/html',
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
}

function getMime(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase()
  return MIME[ext] ?? 'application/octet-stream'
}

function registerAppProtocol(distPath: string) {
  protocol.handle('app', (request) => {
    try {
      const url = new URL(request.url)
      const relPath = url.pathname.replace(/^\/+/, '') || 'index.html'
      const candidate = path.join(distPath, relPath)

      // SPA fallback: serve index.html for any path that doesn't exist as a file
      const target = fs.existsSync(candidate) ? candidate : path.join(distPath, 'index.html')

      // Try net.fetch first (works when files are unpacked / asar:false)
      return net.fetch(pathToFileURL(target).toString())
    } catch (_) {
      // Fallback: read with fs (asar-aware in Electron) and return a Response
      try {
        const url = new URL(request.url)
        const relPath = url.pathname.replace(/^\/+/, '') || 'index.html'
        const candidate = path.join(distPath, relPath)
        const target = fs.existsSync(candidate) ? candidate : path.join(distPath, 'index.html')
        const data = fs.readFileSync(target)
        return new Response(data, {
          headers: { 'Content-Type': getMime(target) },
        })
      } catch (err) {
        return new Response('Not found', { status: 404 })
      }
    }
  })
}

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
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
    backgroundColor: '#0f172a',
    show: false,
  })

  const isDev = !app.isPackaged

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
  } else {
    mainWindow.loadURL('app:///index.html')
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
    if (!isDev) checkForUpdates()
  })

  // Force-show after 8 seconds in case ready-to-show never fires
  setTimeout(() => {
    if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.isVisible()) {
      mainWindow.show()
    }
  }, 8000)

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
    if (!isDev && mainWindow && !mainWindow.isDestroyed()) {
      // Hard fallback: loadFile bypasses the protocol but at least shows something
      const fallback = path.join(__dirname, '..', 'dist', 'index.html')
      if (fs.existsSync(fallback)) {
        mainWindow.loadFile(fallback)
      } else {
        mainWindow.loadURL(
          `data:text/html,<body style="background:%230f172a;color:%23ef4444;font-family:sans-serif;padding:40px">` +
          `<h2>Fabegon ERP failed to load</h2>` +
          `<p>Error ${errorCode}: ${errorDescription}</p>` +
          `<p>Please reinstall the application.</p>` +
          `</body>`
        )
        mainWindow.show()
      }
    }
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) shell.openExternal(url)
    return { action: 'deny' }
  })

  mainWindow.on('closed', () => { mainWindow = null })
}

function checkForUpdates() {
  try {
    autoUpdater.checkForUpdatesAndNotify()
    autoUpdater.on('update-downloaded', () => {
      dialog.showMessageBox(mainWindow!, {
        type: 'info',
        title: 'Update Ready',
        message: 'A new version is ready. Restart Fabegon ERP to apply it.',
        buttons: ['Restart Now', 'Later'],
      }).then(result => {
        if (result.response === 0) autoUpdater.quitAndInstall()
      })
    })
  } catch (_) {}
}

app.whenReady().then(() => {
  // distPath: in packaged app, __dirname = <install>/resources/app/electron-dist
  // (asar:false means files sit unpacked in resources/app/)
  const distPath = path.join(__dirname, '..', 'dist')
  registerAppProtocol(distPath)
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
