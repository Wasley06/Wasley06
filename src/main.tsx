import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { AppErrorBoundary, StartupError } from './components/StartupError'

function mount() {
  const rootEl = document.getElementById('root')
  if (!rootEl) {
    document.body.innerHTML = '<div style="color:red;padding:20px">Fatal: #root element not found</div>'
    return
  }

  try {
    ReactDOM.createRoot(rootEl).render(
      <React.StrictMode>
        <AppErrorBoundary>
          <App />
        </AppErrorBoundary>
      </React.StrictMode>,
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[Fabegon] Fatal startup error:', err)

    // Inject plain HTML recovery UI — avoids calling createRoot twice on same element
    rootEl.innerHTML = ''
    rootEl.style.cssText = 'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;' +
      'background:linear-gradient(135deg,#050C06,#0A1A0C);font-family:system-ui,sans-serif;color:#fff;padding:32px;box-sizing:border-box'
    rootEl.innerHTML = `
      <div style="max-width:480px;width:100%;text-align:center">
        <div style="font-size:36px;margin-bottom:12px">⚠</div>
        <h2 style="margin:0 0 8px;font-size:20px;font-weight:700">Fabegon ERP</h2>
        <p style="margin:0 0 24px;font-size:16px;color:#ef5350;font-weight:600">Unable to start the application</p>
        <p style="margin:0 0 28px;font-size:12px;color:rgba(255,255,255,0.4);word-break:break-word;background:rgba(255,255,255,0.04);padding:12px;border-radius:8px;text-align:left">${message.replace(/</g, '&lt;')}</p>
        <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
          <button onclick="location.reload()" style="background:#2E7D32;color:#fff;border:none;padding:10px 24px;border-radius:8px;cursor:pointer;font-size:14px;font-weight:600">Reload</button>
          <button onclick="localStorage.clear();sessionStorage.clear();location.reload()" style="background:#1565C0;color:#fff;border:none;padding:10px 24px;border-radius:8px;cursor:pointer;font-size:14px;font-weight:600">Clear Session &amp; Reload</button>
        </div>
      </div>
    `
  }
}

mount()
