import { useState, useEffect } from 'react'
import { useLang } from '@/i18n'
import { Save, Building2, Bell, Sun, Moon, Monitor, Wifi, WifiOff, RefreshCw, Activity, Info, ArrowUpCircle, CheckCircle2, XCircle, Clock } from 'lucide-react'
import type { ThemeMode } from '../App'
import { useApp } from '../context/AppContext'
import { supabase, SUPABASE_URL } from '../lib/supabase'

/* Build-time constants injected by vite.config.ts define block */
declare const __APP_VERSION__: string
declare const __GIT_COMMIT__: string
declare const __BUILD_DATE__: string

interface Props {
  user: { name: string; email: string; role: string }
  onThemeChange: (mode: ThemeMode) => void
  themeMode: ThemeMode
}

const NOTIF_DEFAULTS = [
  { label: 'Low Stock Alerts',          key: 'lowStock',   on: true },
  { label: 'Order Approvals',           key: 'orders',     on: true },
  { label: 'Payment Received',          key: 'payment',    on: true },
  { label: 'Production Batch Complete', key: 'production', on: false },
  { label: 'System Updates',            key: 'system',     on: false },
]

const REPO = 'Wasley06/ERP-FABEGON'

type ConnStatus = 'checking' | 'ok' | 'error'

export default function SettingsView({ user, onThemeChange, themeMode }: Props) {
  const { t } = useLang()
  const { isOnline, pendingSync, userId } = useApp()

  const [companyName, setCompanyName] = useState('Fabegon Industries Ltd')
  const [currency, setCurrency]       = useState('TZS')
  const [timezone, setTimezone]       = useState('Africa/Dar_es_Salaam')
  const [language, setLanguage]       = useState('English')
  const [saved, setSaved]             = useState(false)
  const [notifs, setNotifs] = useState<Record<string, boolean>>(
    Object.fromEntries(NOTIF_DEFAULTS.map(n => [n.key, n.on]))
  )

  /* ── Diagnostics state ──────────────────────────────────── */
  const [dbStatus,   setDbStatus]   = useState<ConnStatus>('checking')
  const [rtStatus,   setRtStatus]   = useState<ConnStatus>('checking')
  const [lastSync,   setLastSync]   = useState('—')
  const [checking,   setChecking]   = useState(false)
  const [latestVer,  setLatestVer]  = useState<string | null>(null)
  const [updateNote, setUpdateNote] = useState<'newer' | 'current' | null>(null)

  const appVersion  = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.9'
  const gitCommit   = typeof __GIT_COMMIT__  !== 'undefined' ? __GIT_COMMIT__  : 'dev'
  const buildDate   = typeof __BUILD_DATE__  !== 'undefined' ? __BUILD_DATE__  : new Date().toISOString().slice(0, 10)

  const runDiagnostics = async () => {
    setChecking(true)
    setDbStatus('checking'); setRtStatus('checking')

    /* Database ping */
    try {
      const { error } = await supabase.from('profiles').select('id').limit(1)
      setDbStatus(error ? 'error' : 'ok')
    } catch { setDbStatus('error') }

    /* Realtime channel check — subscribe + check SUBSCRIBED state */
    try {
      const ch = supabase.channel('diag-check')
      await new Promise<void>((resolve) => {
        const id = setTimeout(() => { setRtStatus('error'); resolve() }, 5000)
        ch.subscribe((status) => {
          if (status === 'SUBSCRIBED') { clearTimeout(id); setRtStatus('ok'); resolve() }
          else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') { clearTimeout(id); setRtStatus('error'); resolve() }
        })
      })
      supabase.removeChannel(ch)
    } catch { setRtStatus('error') }

    /* Latest GitHub release for update check */
    try {
      const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`)
      if (res.ok) {
        const data: { tag_name?: string } = await res.json()
        const latest = data.tag_name?.replace(/^v/, '') ?? null
        setLatestVer(latest)
        if (latest && latest !== appVersion) setUpdateNote('newer')
        else setUpdateNote('current')
      }
    } catch { /* network unavailable */ }

    setChecking(false)
  }

  useEffect(() => {
    /* Track last sync time */
    const handler = () => setLastSync(new Date().toLocaleTimeString('en-TZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    window.addEventListener('fabegon:sync', handler)

    /* Run diagnostics once on mount */
    runDiagnostics()

    return () => window.removeEventListener('fabegon:sync', handler)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggleNotif = (key: string) => setNotifs(prev => ({ ...prev, [key]: !prev[key] }))
  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000) }

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div style={{ marginBottom: '14px' }}>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px', color: 'var(--secondary-foreground)' }}>{label}</label>
      {children}
    </div>
  )

  const StatusBadge = ({ status }: { status: ConnStatus }) => {
    const map = {
      checking: { color: 'var(--warning)', bg: 'rgba(245,158,11,0.1)', label: 'Checking…', Icon: Clock },
      ok:       { color: 'var(--success)', bg: 'rgba(34,197,94,0.1)',  label: 'Connected', Icon: CheckCircle2 },
      error:    { color: 'var(--danger)',  bg: 'rgba(239,68,68,0.1)',  label: 'Error',     Icon: XCircle },
    }
    const { color, bg, label, Icon } = map[status]
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: bg, color, fontWeight: 500 }}>
        <Icon size={10} />{label}
      </span>
    )
  }

  return (
    <div className="p-6 animate-in" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: 'var(--foreground)' }}>{t('set.title')}</h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--muted-foreground)' }}>Company · Profile · Appearance · System</p>
        </div>
        <button onClick={handleSave} className="btn btn-primary" style={{ background: saved ? 'var(--success)' : 'var(--primary)', color: 'white' }}>
          <Save size={14} />{saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>

        {/* Company */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Building2 size={14} style={{ color: 'var(--primary)' }} />
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)' }}>Company Information</span>
          </div>
          <Field label="Company Name"><input value={companyName} onChange={e => setCompanyName(e.target.value)} className="input-base" /></Field>
          <Field label="Currency">
            <select value={currency} onChange={e => setCurrency(e.target.value)} className="input-base" style={{ cursor: 'pointer' }}>
              {['TZS', 'KES', 'USD', 'EUR', 'GBP', 'UGX'].map(c => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Timezone">
            <select value={timezone} onChange={e => setTimezone(e.target.value)} className="input-base" style={{ cursor: 'pointer' }}>
              {['Africa/Dar_es_Salaam', 'Africa/Nairobi', 'Africa/Kampala', 'UTC'].map(tz => <option key={tz}>{tz}</option>)}
            </select>
          </Field>
          <Field label="Language">
            <select value={language} onChange={e => setLanguage(e.target.value)} className="input-base" style={{ cursor: 'pointer' }}>
              {['English', 'Swahili'].map(l => <option key={l}>{l}</option>)}
            </select>
          </Field>
        </div>

        {/* Profile */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)' }}>Your Profile</span>
          </div>
          <Field label="Full Name"><input value={user.name} disabled className="input-base" style={{ opacity: 0.5 }} /></Field>
          <Field label="Email"><input value={user.email} disabled className="input-base" style={{ opacity: 0.5 }} /></Field>
          <Field label="Role"><input value={user.role.replace(/_/g, ' ')} disabled className="input-base" style={{ opacity: 0.5, textTransform: 'capitalize' }} /></Field>
          <Field label="New Password"><input type="password" placeholder="••••••••" className="input-base" /></Field>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '4px' }}>Update Password</button>
        </div>

        {/* Appearance */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Sun size={14} style={{ color: 'var(--accent)' }} />
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)' }}>Appearance</span>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', marginBottom: '16px', marginTop: 0 }}>Choose how Fabegon ERP looks on your device.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {([
              { mode: 'light'  as ThemeMode, Icon: Sun,     label: 'Light Mode',   desc: 'Bright, clean interface' },
              { mode: 'dark'   as ThemeMode, Icon: Moon,    label: 'Dark Mode',    desc: 'Easy on the eyes at night' },
              { mode: 'system' as ThemeMode, Icon: Monitor, label: 'System',       desc: 'Follow OS preference' },
            ]).map(({ mode, Icon, label, desc }) => (
              <button key={mode} onClick={() => onThemeChange(mode)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderRadius: '10px', border: themeMode === mode ? '2px solid var(--primary)' : '2px solid var(--border)', background: themeMode === mode ? 'rgba(46,125,50,0.08)' : 'transparent', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', fontFamily: 'inherit' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: themeMode === mode ? 'rgba(46,125,50,0.15)' : 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={15} style={{ color: themeMode === mode ? 'var(--primary)' : 'var(--muted-foreground)' }} />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)' }}>{label}</div>
                  <div style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>{desc}</div>
                </div>
                {themeMode === mode && (
                  <div style={{ marginLeft: 'auto', width: '18px', height: '18px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: 'white', fontSize: '10px' }}>✓</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Notifications */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Bell size={14} style={{ color: 'var(--warning)' }} />
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)' }}>Notifications</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {NOTIF_DEFAULTS.map(n => {
              const on = notifs[n.key]
              return (
                <div key={n.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', color: 'var(--foreground)' }}>{n.label}</span>
                  <button onClick={() => toggleNotif(n.key)} style={{ width: '38px', height: '22px', borderRadius: '11px', background: on ? 'var(--primary)' : 'var(--muted)', position: 'relative', cursor: 'pointer', flexShrink: 0, transition: 'background 0.2s', border: 'none', padding: 0 }} aria-label={`Toggle ${n.label}`}>
                    <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'white', position: 'absolute', top: '3px', left: on ? '19px' : '3px', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── About & Version ─────────────────────────────────── */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Info size={14} style={{ color: 'var(--primary)' }} />
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)' }}>About</span>
          </div>

          {/* Update banner */}
          {updateNote === 'newer' && latestVer && (
            <div style={{ marginBottom: '14px', padding: '10px 12px', borderRadius: '8px', background: 'rgba(249,196,42,0.1)', border: '1px solid rgba(249,196,42,0.3)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ArrowUpCircle size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent)' }}>Update Available — v{latestVer}</div>
                <div style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>Download from GitHub Releases to get the latest version.</div>
              </div>
            </div>
          )}
          {updateNote === 'current' && (
            <div style={{ marginBottom: '14px', padding: '8px 12px', borderRadius: '8px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={13} style={{ color: 'var(--success)' }} />
              <span style={{ fontSize: '12px', color: 'var(--success)', fontWeight: 500 }}>You are running the latest version</span>
            </div>
          )}

          {[
            { label: 'Application',  value: 'Fabegon ERP' },
            { label: 'Version',      value: `v${appVersion}` },
            { label: 'Commit',       value: gitCommit },
            { label: 'Built',        value: buildDate },
            { label: 'GitHub',       value: REPO },
          ].map(r => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>{r.label}</span>
              <span style={{ fontSize: '12px', color: 'var(--foreground)', fontFamily: 'JetBrains Mono, monospace', fontWeight: 500 }}>{r.value}</span>
            </div>
          ))}

          <div style={{ marginTop: '14px', display: 'flex', gap: '8px' }}>
            <button
              onClick={runDiagnostics}
              disabled={checking}
              className="btn btn-ghost"
              style={{ fontSize: '12px', flex: 1, justifyContent: 'center', opacity: checking ? 0.7 : 1 }}
            >
              <RefreshCw size={12} style={{ animation: checking ? 'spin-slow 1s linear infinite' : 'none' }} />
              {checking ? 'Checking…' : 'Check for Updates'}
            </button>
            <a
              href={`https://github.com/${REPO}/releases`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-ghost"
              style={{ fontSize: '12px', flex: 1, textAlign: 'center', textDecoration: 'none' }}
            >
              View Releases
            </a>
          </div>
        </div>

        {/* ── System Diagnostics ──────────────────────────────── */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={14} style={{ color: 'var(--success)' }} />
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)' }}>System Diagnostics</span>
            </div>
            <button onClick={runDiagnostics} disabled={checking} className="btn btn-ghost" style={{ fontSize: '11px', padding: '4px 8px' }} title="Refresh diagnostics">
              <RefreshCw size={11} style={{ animation: checking ? 'spin-slow 1s linear infinite' : 'none' }} />
            </button>
          </div>

          {/* Connection */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--foreground)' }}>Network</div>
              <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', fontFamily: 'JetBrains Mono, monospace' }}>{isOnline ? 'Connected' : 'Offline'}</div>
            </div>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: isOnline ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', color: isOnline ? 'var(--success)' : 'var(--danger)', fontWeight: 500 }}>
              {isOnline ? <Wifi size={10} /> : <WifiOff size={10} />}
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>

          {/* Database */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--foreground)' }}>Supabase Database</div>
              <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', fontFamily: 'JetBrains Mono, monospace' }}>{SUPABASE_URL.replace('https://', '').split('.')[0]}.supabase.co</div>
            </div>
            <StatusBadge status={dbStatus} />
          </div>

          {/* Realtime */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--foreground)' }}>Supabase Realtime</div>
              <div style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>Live sync across all clients</div>
            </div>
            <StatusBadge status={rtStatus} />
          </div>

          {/* Sync Queue */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--foreground)' }}>Offline Queue</div>
              <div style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>Pending writes to sync</div>
            </div>
            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: pendingSync > 0 ? 'rgba(245,158,11,0.1)' : 'rgba(34,197,94,0.1)', color: pendingSync > 0 ? 'var(--warning)' : 'var(--success)', fontWeight: 600, fontFamily: 'JetBrains Mono, monospace' }}>
              {pendingSync} pending
            </span>
          </div>

          {/* Last Sync */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--foreground)' }}>Last Sync</div>
              <div style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>Most recent Supabase write</div>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--muted-foreground)', fontFamily: 'JetBrains Mono, monospace' }}>{lastSync}</span>
          </div>

          {/* Current User */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--foreground)' }}>Logged-in As</div>
              <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', fontFamily: 'JetBrains Mono, monospace' }}>{user.role.replace(/_/g, ' ')}</div>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--foreground)', fontWeight: 500 }}>{user.name}</span>
          </div>

          {/* User UUID */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--foreground)' }}>Auth UUID</div>
              <div style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>Supabase user identifier</div>
            </div>
            <span style={{ fontSize: '10px', color: 'var(--muted-foreground)', fontFamily: 'JetBrains Mono, monospace', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={userId ?? 'Not authenticated'}>
              {userId ? `${userId.slice(0, 8)}…` : '—'}
            </span>
          </div>

          <div style={{ marginTop: '12px', padding: '8px 10px', borderRadius: '8px', background: 'rgba(61,127,255,0.06)', border: '1px solid rgba(61,127,255,0.12)', fontSize: '11px', color: 'var(--muted-foreground)', lineHeight: 1.5 }}>
            All installations running <strong style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--foreground)' }}>v{appVersion}</strong> ({gitCommit}) connect to the same Supabase project and see the same data in real time.
          </div>
        </div>

      </div>
    </div>
  )
}
