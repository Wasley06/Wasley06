import { app, BrowserWindow, shell, ipcMain, dialog, Menu, protocol, net } from 'electron'
import { autoUpdater } from 'electron-updater'
import path from 'node:path'
import fs from 'node:fs'
import { pathToFileURL } from 'node:url'

// Register the custom `app://` scheme BEFORE app is ready.
// This lets the renderer load assets without CORS/file:// origin restrictions
// that block ES-module `crossorigin` scripts in packaged Electron apps.
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
      sandbox: false, // must be false to allow preload script when using custom protocol
    },
    backgroundColor: '#0f172a',
    show: false,
  })

  const isDev = !app.isPackaged

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
  } else {
    // Use our custom protocol — avoids all file:// CORS issues with ES module crossorigin tags
    mainWindow.loadURL('app:///index.html')
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
    if (!isDev) checkForUpdates()
  })

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
    // If the app:// protocol fails for any reason, fall back to direct file loading
    if (!isDev && mainWindow && !mainWindow.isDestroyed()) {
      const fallback = path.join(__dirname, '..', 'dist', 'index.html')
      if (fs.existsSync(fallback)) {
        mainWindow.loadFile(fallback)
      } else {
        mainWindow.loadURL(
          `data:text/html,<body style="background:#0f172a;color:#ef4444;font-family:sans-serif;padding:40px">
            <h2>Fabegon ERP failed to load</h2>
            <p>Error ${errorCode}: ${errorDescription}</p>
            <p>Please reinstall the application.</p>
          </body>`
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

function registerAppProtocol() {
  const distPath = path.join(__dirname, '..', 'dist')

  protocol.handle('app', (request) => {
    const url = new URL(request.url)
    // Strip leading slash; default to index.html for SPA routing
    let relPath = url.pathname.replace(/^\/+/, '') || 'index.html'
    const filePath = path.join(distPath, relPath)

    // For SPA: serve index.html for any path that doesn't map to a real file
    const target = fs.existsSync(filePath) ? filePath : path.join(distPath, 'index.html')
    return net.fetch(pathToFileURL(target).toString())
  })
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
  } catch (_) {
    // Auto-updater failures are non-critical
  }
}

app.whenReady().then(() => {
  registerAppProtocol()
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
