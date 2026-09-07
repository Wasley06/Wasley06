import { useState, useEffect, useRef } from 'react'
import LoadingScreen from './components/LoadingScreen'
import Login from './components/Login'
import Sidebar, { type ModuleKey } from './components/Sidebar'
import Dashboard from './components/Dashboard'
import Inventory from './components/Inventory'
import Sales from './components/Sales'
import Finance from './components/Finance'
import CRM from './components/CRM'
import Production from './components/Production'
import Procurement from './components/Procurement'
import Reports from './components/Reports'
import HR from './components/HR'
import Admin from './components/Admin'
import CalendarView from './components/CalendarView'
import NotificationPanel from './components/NotificationPanel'
import SettingsView from './components/SettingsView'
import { Bell, Search, Menu, Sun, Moon, Monitor, Globe, X, Wifi, WifiOff, LogIn } from 'lucide-react'
import { supabase, SUPABASE_URL, SUPABASE_ANON } from './lib/supabase'
import fabegonLogo from '@/imports/ChatGPT_Image_Jun_27__2026__02_20_03_AM.png'
import { AppProvider, useApp } from './context/AppContext'
import { NotifProvider, useNotif } from './context/NotificationContext'
import { LangProvider, useLang, dispatchLang, type Lang } from './i18n'

export type ThemeMode = 'dark' | 'light' | 'system'

type SearchResult = { label: string; sub: string; module: ModuleKey }

function GlobalSearch({ onClose, onNavigate }: { onClose: () => void; onNavigate: (m: ModuleKey) => void }) {
  const { items, clients, salesOrders, purchaseOrders, creditors, employees, leads } = useApp()
  const [q, setQ] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const results: SearchResult[] = q.trim().length < 2 ? [] : (() => {
    const lq = q.toLowerCase()
    const out: SearchResult[] = []
    items.filter(i => i.name.toLowerCase().includes(lq) || i.sku?.toLowerCase().includes(lq)).slice(0, 4)
      .forEach(i => out.push({ label: i.name, sub: `Inventory · SKU: ${i.sku ?? '—'} · Qty: ${i.qty}`, module: 'inventory' }))
    clients.filter(c => c.name.toLowerCase().includes(lq) || c.email?.toLowerCase().includes(lq) || c.phone?.toLowerCase().includes(lq)).slice(0, 4)
      .forEach(c => out.push({ label: c.name, sub: `CRM · Customer · ${c.email ?? c.phone ?? ''}`, module: 'crm' }))
    salesOrders.filter(o => o.id.toLowerCase().includes(lq) || o.customer?.toLowerCase().includes(lq)).slice(0, 4)
      .forEach(o => out.push({ label: `Order ${o.id}`, sub: `Sales · ${o.customer ?? ''} · TZS ${o.total?.toLocaleString()}`, module: 'sales' }))
    purchaseOrders.filter(o => o.id.toLowerCase().includes(lq) || o.supplier?.toLowerCase().includes(lq)).slice(0, 4)
      .forEach(o => out.push({ label: `PO ${o.id}`, sub: `Procurement · ${o.supplier ?? ''}`, module: 'procurement' }))
    creditors.filter(c => c.name.toLowerCase().includes(lq)).slice(0, 3)
      .forEach(c => out.push({ label: c.name, sub: `Finance · Creditor · TZS ${c.amount?.toLocaleString()}`, module: 'finance' }))
    employees.filter(e => e.name.toLowerCase().includes(lq) || e.dept?.toLowerCase().includes(lq) || e.role?.toLowerCase().includes(lq)).slice(0, 3)
      .forEach(e => out.push({ label: e.name, sub: `HR · ${e.role ?? ''} · ${e.dept ?? ''}`, module: 'hr' }))
    leads.filter(l => l.name.toLowerCase().includes(lq) || l.contact?.toLowerCase().includes(lq)).slice(0, 3)
      .forEach(l => out.push({ label: l.name, sub: `CRM · Lead · ${l.contact ?? ''}`, module: 'crm' }))
    return out.slice(0, 12)
  })()

  const MODULE_ICON: Record<string, string> = { inventory: '📦', crm: '👤', sales: '💵', procurement: '🛒', finance: '💳', hr: '👥' }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '80px' }}
      onClick={onClose}>
      <div style={{ width: '560px', maxWidth: '95vw', background: 'var(--card)', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: '0 24px 64px rgba(0,0,0,0.4)', overflow: 'hidden' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
          <Search size={16} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />
          <input ref={inputRef} value={q} onChange={e => setQ(e.target.value)}
            placeholder="Search customers, orders, items, employees…"
            style={{ flex: 1, border: 'none', background: 'transparent', fontSize: '14px', color: 'var(--foreground)', outline: 'none', fontFamily: 'inherit' }}
            onKeyDown={e => { if (e.key === 'Escape') onClose() }} />
          {q && <button onClick={() => setQ('')} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--muted-foreground)', padding: '2px' }}><X size={14} /></button>}
        </div>
        {q.trim().length > 0 && q.trim().length < 2 && (
          <div style={{ padding: '20px', textAlign: 'center', fontSize: '13px', color: 'var(--muted-foreground)' }}>Type at least 2 characters…</div>
        )}
        {results.length === 0 && q.trim().length >= 2 && (
          <div style={{ padding: '20px', textAlign: 'center', fontSize: '13px', color: 'var(--muted-foreground)' }}>No results for "{q}"</div>
        )}
        {results.length > 0 && (
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {results.map((r, i) => (
              <button key={i} onClick={() => { onNavigate(r.module); onClose() }}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '10px 16px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', borderBottom: i < results.length - 1 ? '1px solid var(--border)' : 'none' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--secondary)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <span style={{ fontSize: '18px', flexShrink: 0 }}>{MODULE_ICON[r.module] ?? '🔍'}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.label}</div>
                  <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.sub}</div>
                </div>
              </button>
            ))}
          </div>
        )}
        {q.trim().length === 0 && (
          <div style={{ padding: '16px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {(['inventory', 'crm', 'sales', 'procurement', 'finance', 'hr'] as ModuleKey[]).map(m => (
              <button key={m} onClick={() => { onNavigate(m); onClose() }}
                style={{ padding: '5px 12px', borderRadius: '20px', border: '1px solid var(--border)', background: 'var(--secondary)', color: 'var(--secondary-foreground)', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>
                {MODULE_ICON[m]} {m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
interface User { name: string; role: string; email: string }

const MODULE_NAV_KEYS: Record<ModuleKey, string> = {
  dashboard: 'nav.dashboard', inventory: 'nav.inventory', sales: 'nav.sales',
  finance: 'nav.finance', crm: 'nav.crm', production: 'nav.production',
  procurement: 'nav.procurement', reports: 'nav.reports', hr: 'nav.hr',
  admin: 'nav.admin', calendar: 'nav.calendar', settings: 'nav.settings',
}

function resolveTheme(mode: ThemeMode): 'dark' | 'light' {
  if (mode === 'system') return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  return mode
}

function AppShell() {
  const { t, lang } = useLang()
  const [appState, setAppState] = useState<'loading' | 'login' | 'app'>('loading')
  const [user, setUser] = useState<User | null>(null)
  const [active, setActive] = useState<ModuleKey>('dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [themeMode, setThemeMode] = useState<ThemeMode>(
    () => (localStorage.getItem('fabegon-theme') as ThemeMode) ?? 'dark'
  )
  const [showThemeMenu, setShowThemeMenu] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [showNotifPanel, setShowNotifPanel] = useState(false)
  const [showLangMenu, setShowLangMenu] = useState(false)
  const [syncPulse, setSyncPulse] = useState(false)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [impersonating, setImpersonating] = useState<{ id: string; name: string } | null>(null)
  const { unread } = useNotif()

  useEffect(() => {
    const apply = () => document.documentElement.setAttribute('data-theme', resolveTheme(themeMode))
    apply()
    localStorage.setItem('fabegon-theme', themeMode)
    if (themeMode === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      mq.addEventListener('change', apply)
      return () => mq.removeEventListener('change', apply)
    }
  }, [themeMode])

  useEffect(() => {
    const handler = () => { setSyncPulse(true); setTimeout(() => setSyncPulse(false), 1500) }
    window.addEventListener('fabegon:sync', handler)
    return () => window.removeEventListener('fabegon:sync', handler)
  }, [])

  useEffect(() => {
    /* Reliable connectivity check — navigator.onLine is unreliable in Electron/Android */
    const checkNet = async () => {
      if (!navigator.onLine) { setIsOnline(false); return }
      try {
        const ctrl = new AbortController()
        const id = setTimeout(() => ctrl.abort(), 5000)
        const res = await fetch(`${SUPABASE_URL}/rest/v1/`, {
          method: 'HEAD', signal: ctrl.signal,
          headers: { apikey: SUPABASE_ANON },
        })
        clearTimeout(id)
        setIsOnline(res.ok || res.status === 401)
      } catch { setIsOnline(false) }
    }
    checkNet()
    const interval = setInterval(checkNet, 30000)
    const on  = () => checkNet()
    const off = () => setIsOnline(false)
    window.addEventListener('online',  on)
    window.addEventListener('offline', off)
    return () => { clearInterval(interval); window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  useEffect(() => {
    if (!showThemeMenu && !showLangMenu) return
    const fn = () => { setShowThemeMenu(false); setShowLangMenu(false) }
    setTimeout(() => document.addEventListener('click', fn), 0)
    return () => document.removeEventListener('click', fn)
  }, [showThemeMenu, showLangMenu])

  useEffect(() => {
    if (!showNotifPanel) return
    const fn = (e: MouseEvent) => {
      const panel = document.getElementById('notif-panel')
      const bell  = document.getElementById('notif-bell')
      if (panel && !panel.contains(e.target as Node) && bell && !bell.contains(e.target as Node)) setShowNotifPanel(false)
    }
    setTimeout(() => document.addEventListener('click', fn), 0)
    return () => document.removeEventListener('click', fn)
  }, [showNotifPanel])

  const handleLogin = (u: User) => { setUser(u); setAppState('app') }
  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null); setAppState('login')
  }
  const ThemeIcon = themeMode === 'dark' ? Moon : themeMode === 'light' ? Sun : Monitor

  const renderModule = () => {
    if (!user) return null
    const logoUrl = fabegonLogo
    switch (active) {
      case 'dashboard':   return <Dashboard user={user} />
      case 'inventory':   return <Inventory />
      case 'sales':       return <Sales user={user} logoUrl={logoUrl} />
      case 'finance':     return <Finance logoUrl={logoUrl} />
      case 'crm':         return <CRM />
      case 'production':  return <Production />
      case 'procurement': return <Procurement logoUrl={logoUrl} />
      case 'reports':     return <Reports />
      case 'hr':          return <HR />
      case 'admin':       return <Admin user={user} onImpersonate={(id, name) => setImpersonating({ id, name })} />
      case 'calendar':    return <CalendarView />
      case 'settings':    return <SettingsView user={user} onThemeChange={setThemeMode} themeMode={themeMode} />
      default:            return <Dashboard user={user} />
    }
  }

  if (appState === 'loading') return <LoadingScreen onDone={async () => {
    /* Clear legacy keys that are no longer used */
    const legacyKeys = ['fabegon:system-users', 'fabegon:perms', 'fabegon:seed-v1']
    legacyKeys.forEach(k => localStorage.removeItem(k))
    try {
      /* 6-second timeout: if Supabase is unreachable (offline install, firewall,
         paused project), we must NOT hang here — always reach the login page. */
      const timeout = new Promise<{ data: { session: null } }>(r =>
        setTimeout(() => r({ data: { session: null } }), 6000)
      )
      const { data } = await Promise.race([supabase.auth.getSession(), timeout])
      if (data.session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, status, username, deleted_at')
          .eq('id', data.session.user.id)
          .single()
        if (!profile?.deleted_at && profile?.status !== 'Suspended') {
          const displayName = profile?.username ?? data.session.user.email?.split('@')[0] ?? 'User'
          const role = profile?.role ?? (data.session.user.user_metadata?.role as string) ?? 'Cashier'
          setUser({ name: displayName, role, email: data.session.user.email ?? '' })
          setAppState('app')
          return
        }
        /* Disabled/suspended account — sign out and go to login */
        await supabase.auth.signOut().catch(() => {})
      }
    } catch {
      /* Any error (network, Supabase down, etc.) → fall through to login */
    }
    setAppState('login')
  }} />
  if (appState === 'login' || !user) return <Login onLogin={handleLogin} />

  const initials = user.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
  /* Detect Electron — the preload exposes window.electronAPI */
  const isElectron = typeof window !== 'undefined' && !!(window as unknown as Record<string, unknown>).electronAPI
  const eAPI = isElectron ? (window as unknown as { electronAPI: { minimize: () => void; maximize: () => void; close: () => void } }).electronAPI : null

  return (
    <AppProvider user={user}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: 'var(--background)' }}>

        {/* ── Electron custom title bar (only in packaged/frameless mode) ── */}
        {isElectron && (
          <div style={Object.assign({ height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--sidebar)', borderBottom: '1px solid var(--border)', flexShrink: 0, userSelect: 'none', zIndex: 9999 }, { WebkitAppRegion: 'drag' }) as React.CSSProperties}>
            {/* Drag zone + title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingLeft: '14px' }}>
              <div style={{ width: '20px', height: '20px', borderRadius: '5px', overflow: 'hidden', flexShrink: 0 }}>
                <img src={fabegonLogo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted-foreground)', letterSpacing: '0.2px' }}>Fabegon ERP</span>
            </div>
            {/* Window controls — no drag so clicks register */}
            <div style={Object.assign({ display: 'flex', flexShrink: 0 }, { WebkitAppRegion: 'no-drag' }) as React.CSSProperties}>
              <button
                onClick={() => eAPI?.minimize()}
                title="Minimize"
                style={{ width: '46px', height: '38px', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted-foreground)', fontSize: '16px', lineHeight: 1 }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >─</button>
              <button
                onClick={() => eAPI?.maximize()}
                title="Maximize / Restore"
                style={{ width: '46px', height: '38px', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted-foreground)', fontSize: '11px', lineHeight: 1 }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >▭</button>
              <button
                onClick={() => eAPI?.close()}
                title="Close"
                style={{ width: '46px', height: '38px', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted-foreground)', fontSize: '15px', lineHeight: 1, borderRadius: '0 0 0 0' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#E81123'; e.currentTarget.style.color = 'white' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--muted-foreground)' }}
              >✕</button>
            </div>
          </div>
        )}

        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minWidth: 0 }}>
        <Sidebar user={user} active={active} onNavigate={key => setActive(key)} onLogout={handleLogout} collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(c => !c)} lang={lang} t={t} />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

          {/* Topbar */}
          <header style={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', background: 'var(--topbar)', borderBottom: '1px solid var(--border)', flexShrink: 0, gap: '12px', position: 'relative', zIndex: 100 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
              <button onClick={() => setSidebarCollapsed(c => !c)} className="btn-ghost" style={{ padding: '6px', flexShrink: 0 }}><Menu size={16} /></button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
                  <img src={fabegonLogo} alt="Fabegon" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t(MODULE_NAV_KEYS[active])}</div>
                  <div style={{ fontSize: '10px', color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>{t('company')}</div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
              <button onClick={() => setSearchOpen(true)} className="btn-ghost" style={{ padding: '6px' }} title="Search (Ctrl+K)"><Search size={15} /></button>
              {searchOpen && <GlobalSearch onClose={() => setSearchOpen(false)} onNavigate={key => setActive(key)} />}

              {/* Theme */}
              <div style={{ position: 'relative' }}>
                <button onClick={e => { e.stopPropagation(); setShowThemeMenu(v => !v) }} className="btn-ghost" style={{ padding: '6px' }}><ThemeIcon size={15} /></button>
                {showThemeMenu && (
                  <div onClick={e => e.stopPropagation()} style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '10px', boxShadow: 'var(--shadow)', padding: '6px', minWidth: '140px', zIndex: 300, animation: 'slide-down 0.15s ease' }}>
                    {([{ mode: 'light' as ThemeMode, Icon: Sun, label: 'Light' }, { mode: 'dark' as ThemeMode, Icon: Moon, label: 'Dark' }, { mode: 'system' as ThemeMode, Icon: Monitor, label: 'System' }]).map(({ mode, Icon: Ic, label }) => (
                      <button key={mode} onClick={() => { setThemeMode(mode); setShowThemeMenu(false) }} style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '7px 10px', borderRadius: '7px', border: 'none', background: themeMode === mode ? 'rgba(46,125,50,0.12)' : 'transparent', color: themeMode === mode ? 'var(--primary)' : 'var(--foreground)', cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit', fontWeight: themeMode === mode ? 600 : 400 }}>
                        <Ic size={14} />{label}{themeMode === mode && <span style={{ marginLeft: 'auto', fontSize: '10px', color: 'var(--primary)' }}>✓</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Bell */}
              <button id="notif-bell" onClick={() => setShowNotifPanel(v => !v)} className="btn-ghost" style={{ padding: '6px', position: 'relative', background: showNotifPanel ? 'rgba(46,125,50,0.12)' : undefined }}>
                <Bell size={15} style={{ color: showNotifPanel ? 'var(--primary)' : undefined }} />
                {unread > 0 && <span style={{ position: 'absolute', top: '2px', right: '2px', width: '14px', height: '14px', borderRadius: '50%', background: 'var(--accent)', color: '#1A2B1C', fontSize: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{unread > 9 ? '9+' : unread}</span>}
              </button>

              {/* Language */}
              <div style={{ position: 'relative' }}>
                <button onClick={e => { e.stopPropagation(); setShowLangMenu(v => !v) }} className="btn-ghost" style={{ padding: '5px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Globe size={14} />
                  <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.5px' }}>{lang.toUpperCase()}</span>
                </button>
                {showLangMenu && (
                  <div onClick={e => e.stopPropagation()} style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '10px', boxShadow: 'var(--shadow)', padding: '6px', minWidth: '130px', zIndex: 300, animation: 'slide-down 0.15s ease' }}>
                    {([{ code: 'en' as Lang, label: 'English', flag: '🇬🇧' }, { code: 'sw' as Lang, label: 'Kiswahili', flag: '🇹🇿' }]).map(({ code, label, flag }) => (
                      <button key={code} onClick={() => { dispatchLang(code); setShowLangMenu(false) }} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '7px 10px', borderRadius: '7px', border: 'none', background: lang === code ? 'rgba(46,125,50,0.12)' : 'transparent', color: lang === code ? 'var(--primary)' : 'var(--foreground)', cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit', fontWeight: lang === code ? 600 : 400 }}>
                        <span>{flag}</span>{label}{lang === code && <span style={{ marginLeft: 'auto', fontSize: '10px', color: 'var(--primary)' }}>✓</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Online/offline + sync indicator */}
              <div title={isOnline ? t('sync.synced') : t('sync.offline')} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 6px', borderRadius: '6px', background: isOnline ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)' }}>
                {isOnline
                  ? <Wifi size={12} style={{ color: syncPulse ? 'var(--accent)' : 'var(--success)', transition: 'color 0.4s' }} />
                  : <WifiOff size={12} style={{ color: 'var(--danger)' }} />
                }
                <span style={{ fontSize: '10px', fontWeight: 600, color: isOnline ? (syncPulse ? 'var(--accent)' : 'var(--success)') : 'var(--danger)', transition: 'color 0.4s', letterSpacing: '0.2px' }}>
                  {isOnline ? (syncPulse ? 'Syncing…' : 'Online') : 'Offline'}
                </span>
              </div>

              {/* Avatar */}
              <button onClick={() => setActive('settings')} style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', color: 'white', border: active === 'settings' ? '2px solid var(--accent)' : '2px solid transparent', cursor: 'pointer', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'border-color 0.15s', flexShrink: 0 }}>
                {initials}
              </button>
            </div>
          </header>

          {/* Impersonation banner */}
          {impersonating && (
            <div style={{ background: 'rgba(99,102,241,0.15)', borderBottom: '1px solid rgba(99,102,241,0.3)', padding: '6px 20px', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
              <LogIn size={13} style={{ color: '#6366F1' }} />
              <span style={{ fontSize: '12px', color: '#6366F1', fontWeight: 600 }}>
                Viewing as <strong>{impersonating.name}</strong> — backdoor active
              </span>
              <button
                onClick={() => setImpersonating(null)}
                style={{ marginLeft: 'auto', fontSize: '11px', padding: '2px 10px', borderRadius: '6px', background: 'rgba(99,102,241,0.2)', color: '#6366F1', border: '1px solid rgba(99,102,241,0.4)', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}
              >
                Exit
              </button>
            </div>
          )}

          <main style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>{renderModule()}</main>
        </div>

        {showNotifPanel && (
          <div id="notif-panel" className="notif-panel">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--foreground)' }}>{t('notif.title')}</div>
                <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', marginTop: '1px' }}>{t('notif.subtitle')}</div>
              </div>
              <button onClick={() => setShowNotifPanel(false)} className="btn-ghost" style={{ padding: '4px' }}><X size={15} /></button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}><NotificationPanel /></div>
          </div>
        )}
        </div>{/* end flex row: sidebar + main */}
      </div>
    </AppProvider>
  )
}

export default function App() {
  return (
    <LangProvider>
      <NotifProvider>
        <AppShell />
      </NotifProvider>
    </LangProvider>
  )
}
