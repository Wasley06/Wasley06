import { app, BrowserWindow, shell, ipcMain, dialog, Menu } from 'electron'
import { autoUpdater } from 'electron-updater'
import path from 'node:path'
import fs from 'node:fs'

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
      sandbox: true,
      webSecurity: false, // allow file:// assets to load without origin restriction
    },
    backgroundColor: '#0f172a',
    show: false,
  })

  const isDev = !app.isPackaged

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
  } else {
    // The build step (ELECTRON=true) strips crossorigin from index.html so
    // file:// loading works without CORS errors. webSecurity:false is the
    // belt-and-suspenders fallback for any remaining origin checks.
    const indexPath = path.join(__dirname, '..', 'dist', 'index.html')
    mainWindow.loadFile(indexPath)
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
    if (!isDev) checkForUpdates()
  })

  // Force-show after 10s in case ready-to-show never fires
  setTimeout(() => {
    if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.isVisible()) {
      mainWindow.show()
    }
  }, 10000)

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
    if (!isDev && mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.loadURL(
        `data:text/html,<body style="background:%230f172a;color:%23ef4444;font-family:sans-serif;padding:40px">` +
        `<h2>Fabegon ERP could not load</h2>` +
        `<p>Error ${errorCode}: ${errorDescription}</p>` +
        `<p>Please reinstall the application.</p>` +
        `</body>`
      )
      mainWindow.show()
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

app.whenReady().then(createWindow)

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
