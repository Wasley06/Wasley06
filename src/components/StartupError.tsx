import React from 'react'

interface Props {
  error?: string
  onRetry?: () => void
}

export function StartupError({ error, onRetry }: Props) {
  const handleClearSession = () => {
    try {
      localStorage.clear()
      sessionStorage.clear()
    } catch {}
    window.location.reload()
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, display: 'flex', alignItems: 'center',
        justifyContent: 'center', flexDirection: 'column',
        background: 'linear-gradient(135deg, #050C06 0%, #0A1A0C 50%, #06100A 100%)',
        fontFamily: 'system-ui, -apple-system, sans-serif', color: '#fff',
        padding: '32px', boxSizing: 'border-box', zIndex: 9999,
      }}
    >
      <div style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>
        {/* Logo mark */}
        <div style={{
          width: 64, height: 64, borderRadius: 16, margin: '0 auto 20px',
          background: 'rgba(76, 175, 80, 0.15)', border: '1px solid rgba(76,175,80,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
        }}>
          ⚠
        </div>

        <h1 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 700, color: '#fff' }}>
          Fabegon ERP
        </h1>
        <p style={{ margin: '0 0 32px', fontSize: 16, color: '#ef5350', fontWeight: 600 }}>
          Unable to start the application
        </p>

        {error && (
          <p style={{
            margin: '0 0 32px', fontSize: 12,
            color: 'rgba(255,255,255,0.4)', wordBreak: 'break-word',
            background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '12px 16px',
            textAlign: 'left', lineHeight: 1.6,
          }}>
            {error}
          </p>
        )}

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          {onRetry && (
            <button
              onClick={onRetry}
              style={{
                background: '#2E7D32', color: '#fff', border: 'none',
                padding: '11px 28px', borderRadius: 8, cursor: 'pointer',
                fontSize: 14, fontWeight: 600,
              }}
            >
              Retry
            </button>
          )}
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#1a2e1c', color: '#81C784', border: '1px solid rgba(76,175,80,0.3)',
              padding: '11px 28px', borderRadius: 8, cursor: 'pointer',
              fontSize: 14, fontWeight: 600,
            }}
          >
            Reload Application
          </button>
          <button
            onClick={handleClearSession}
            style={{
              background: '#1565C0', color: '#fff', border: 'none',
              padding: '11px 28px', borderRadius: 8, cursor: 'pointer',
              fontSize: 14, fontWeight: 600,
            }}
          >
            Clear Session &amp; Reload
          </button>
        </div>
      </div>
    </div>
  )
}

// React class-based error boundary
interface BoundaryState { hasError: boolean; message: string }

export class AppErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  BoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props)
    this.state = { hasError: false, message: '' }
  }

  static getDerivedStateFromError(error: unknown): BoundaryState {
    const message = error instanceof Error ? error.message : String(error)
    return { hasError: true, message }
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    console.error('[Fabegon] React error boundary caught:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <StartupError
          error={this.state.message}
          onRetry={() => this.setState({ hasError: false, message: '' })}
        />
      )
    }
    return this.props.children
  }
}
