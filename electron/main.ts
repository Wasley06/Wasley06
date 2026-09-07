import { app, BrowserWindow, shell, ipcMain, Menu } from 'electron'
import path from 'node:path'
import fs from 'node:fs'

// Disable CORS enforcement for file:// origins at the Chromium level.
// This is the belt-and-suspenders fix alongside stripping crossorigin from HTML.
app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors')
app.commandLine.appendSwitch('disable-web-security')

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
    mainWindow.loadURL('http://localhost:5173')
  } else {
    const indexPath = path.join(__dirname, '..', 'dist', 'index.html')
    if (fs.existsSync(indexPath)) {
      mainWindow.loadFile(indexPath)
    } else {
      // Fallback: show error so the user knows what happened
      mainWindow.loadURL(
        `data:text/html,<body style="font-family:sans-serif;padding:40px;color:#333">` +
        `<h2>Fabegon ERP - Load Error</h2>` +
        `<p>Could not find: ${indexPath}</p>` +
        `<p>Please reinstall the application.</p>` +
        `</body>`
      )
    }
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) shell.openExternal(url)
    return { action: 'deny' }
  })

  mainWindow.on('closed', () => { mainWindow = null })
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
