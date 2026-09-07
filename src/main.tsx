import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { AppErrorBoundary, StartupError } from './components/StartupError'

function mount() {
  try {
    const rootEl = document.getElementById('root')
    if (!rootEl) throw new Error('Root element #root not found in document')

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

    // Fallback: render error screen directly without React if createRoot itself fails
    const rootEl = document.getElementById('root')
    if (rootEl) {
      try {
        ReactDOM.createRoot(rootEl).render(
          <StartupError
            error={message}
            onRetry={() => window.location.reload()}
          />
        )
      } catch {
        // React itself is broken — show plain HTML fallback
        rootEl.innerHTML = `
          <div style="position:fixed;inset:0;display:flex;align-items:center;justify-content:center;
            background:#050C06;font-family:system-ui,sans-serif;color:#fff;padding:32px;text-align:center">
            <div>
              <p style="font-size:18px;color:#ef5350;font-weight:700;margin:0 0 16px">Unable to start Fabegon ERP</p>
              <p style="font-size:12px;color:rgba(255,255,255,0.4);margin:0 0 24px">${message}</p>
              <button onclick="location.reload()" style="background:#2E7D32;color:#fff;border:none;
                padding:10px 24px;border-radius:8px;cursor:pointer;font-size:14px">Reload</button>
            </div>
          </div>
        `
      }
    }
  }
}

mount()
