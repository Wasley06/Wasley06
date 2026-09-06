import { Bell, CheckCheck, AlertTriangle, CheckCircle2, Info, XCircle, Clock } from 'lucide-react'
import { useNotif } from '../context/NotificationContext'

const TYPE_STYLE: Record<string, { bg: string; color: string }> = {
  success: { bg: 'rgba(34,197,94,0.08)',  color: 'var(--success)' },
  warning: { bg: 'rgba(245,158,11,0.08)', color: 'var(--warning)' },
  info:    { bg: 'rgba(61,127,255,0.08)', color: 'var(--primary)' },
  error:   { bg: 'rgba(239,68,68,0.08)',  color: 'var(--danger)' },
}

const TYPE_ICON: Record<string, React.ElementType> = {
  success: CheckCircle2,
  warning: AlertTriangle,
  info:    Info,
  error:   XCircle,
}

function timeAgo(ms: number): string {
  const diff = Date.now() - ms
  if (diff < 60_000)   return 'just now'
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86400_000) return `${Math.floor(diff / 3600_000)}h ago`
  return `${Math.floor(diff / 86400_000)}d ago`
}

export default function NotificationPanel() {
  const { notifications, markAll, markRead, clear } = useNotif()

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid var(--border)' }}>
        <span style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>
          {notifications.filter(n => !n.read).length} unread
        </span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={markAll} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', color: 'var(--primary)', fontFamily: 'inherit' }}>
            <CheckCheck size={12} /> Mark all read
          </button>
          <button onClick={clear} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', color: 'var(--muted-foreground)', fontFamily: 'inherit' }}>
            Clear all
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', overflowY: 'auto', maxHeight: 'calc(100% - 44px)' }}>
        {notifications.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--muted-foreground)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <Bell size={28} style={{ opacity: 0.25 }} />
            <span style={{ fontSize: '13px' }}>All caught up!</span>
            <span style={{ fontSize: '11px', opacity: 0.7 }}>Notifications appear here as you use the system</span>
          </div>
        )}
        {notifications.map(n => {
          const s = TYPE_STYLE[n.type] ?? TYPE_STYLE.info
          const Icon = TYPE_ICON[n.type] ?? Info
          return (
            <div
              key={n.id}
              onClick={() => markRead(n.id)}
              style={{
                padding: '12px 16px',
                background: n.read ? 'transparent' : s.bg,
                borderLeft: `3px solid ${n.read ? 'transparent' : s.color}`,
                cursor: 'pointer',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--secondary)')}
              onMouseLeave={e => (e.currentTarget.style.background = n.read ? 'transparent' : s.bg)}
            >
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <div style={{ width: '26px', height: '26px', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: s.bg, marginTop: '1px' }}>
                  <Icon size={12} style={{ color: s.color }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--foreground)' }}>{n.title}</span>
                    {!n.read && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)', flexShrink: 0 }} />}
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--secondary-foreground)', margin: 0, lineHeight: 1.5 }}>{n.body}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontSize: '10px', color: 'var(--muted-foreground)' }}>
                    <Clock size={9} />
                    {timeAgo(n.time)}
                    <span style={{ marginLeft: '2px', padding: '1px 5px', borderRadius: '4px', background: 'var(--secondary)', fontSize: '10px' }}>{n.module}</span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
