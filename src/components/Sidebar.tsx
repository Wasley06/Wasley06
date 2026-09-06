import { useState } from 'react'
import {
  LayoutDashboard, Package, TrendingUp, Users, BarChart2,
  Settings, Calendar, Factory, Truck, CreditCard, UserCheck,
  Building2, LogOut, Search, Wifi, WifiOff,
} from 'lucide-react'
import fabegonLogo from '@/imports/ChatGPT_Image_Jun_27__2026__02_20_03_AM.png'
import { getAllowedKeys } from '@/lib/permissions'

export type ModuleKey =
  | 'dashboard' | 'inventory' | 'sales' | 'finance' | 'crm'
  | 'production' | 'procurement' | 'reports' | 'hr' | 'calendar'
  | 'admin' | 'settings'

interface NavItem {
  key: ModuleKey
  label: string
  icon: React.ElementType
}

const ALL_NAV: NavItem[] = [
  { key: 'dashboard',   label: 'Dashboard',       icon: LayoutDashboard },
  { key: 'inventory',   label: 'Inventory',        icon: Package },
  { key: 'production',  label: 'Production',       icon: Factory },
  { key: 'procurement', label: 'Procurement',      icon: Truck },
  { key: 'sales',       label: 'Sales',            icon: TrendingUp },
  { key: 'crm',         label: 'CRM',              icon: UserCheck },
  { key: 'finance',     label: 'Finance',          icon: CreditCard },
  { key: 'hr',          label: 'Human Resources',  icon: Users },
  { key: 'reports',     label: 'Reports',          icon: BarChart2 },
  { key: 'calendar',    label: 'Operational Scheduler', icon: Calendar },
  { key: 'admin',       label: 'Administration',   icon: Building2 },
  { key: 'settings',    label: 'Settings',         icon: Settings },
]


const ROLE_LABELS: Record<string, string> = {
  super_admin:     'Super Admin',
  admin:           'Admin',
  finance_manager: 'Finance Manager',
  storekeeper:     'Storekeeper',
  cashier:         'Cashier',
  sales_rep:       'Sales Rep',
  hr_manager:      'HR Manager',
}

interface SidebarProps {
  user: { name: string; role: string; email: string }
  active: ModuleKey
  onNavigate: (key: ModuleKey) => void
  onLogout: () => void
  collapsed: boolean
  onToggleCollapse: () => void
  lang?: string
  t?: (k: string) => string
}

export default function Sidebar({ user, active, onNavigate, onLogout, collapsed, t }: SidebarProps) {
  const [search, setSearch] = useState('')
  const [isOnline] = useState(true)

  const allowed  = getAllowedKeys(user.role) as ModuleKey[]
  const visible  = ALL_NAV.filter(n => allowed.includes(n.key))
  const filtered = search ? visible.filter(n => n.label.toLowerCase().includes(search.toLowerCase())) : visible
  const initials = user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  return (
    <aside
      style={{
        width: collapsed ? '60px' : '232px',
        background: 'var(--sidebar)',
        borderRight: '1px solid var(--sidebar-border)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        flexShrink: 0,
        transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)',
        overflow: 'hidden',
      }}
    >
      {/* Logo */}
      <div style={{
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: collapsed ? '0 14px' : '0 16px',
        borderBottom: '1px solid var(--sidebar-border)',
        flexShrink: 0,
      }}>
        <button
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '9px',
            overflow: 'hidden',
            flexShrink: 0,
            cursor: 'pointer',
            border: '1.5px solid rgba(255,255,255,0.2)',
          }}
          onClick={() => {}}
          title="Fabegon ERP"
        >
          <img src={fabegonLogo} alt="Fabegon" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </button>
        {!collapsed && (
          <div style={{ overflow: 'hidden', lineHeight: 1 }}>
            <div className="sidebar-user-text" style={{ fontWeight: 700, fontSize: '14px', color: 'white', whiteSpace: 'nowrap' }}>Fabegon</div>
            <div className="sidebar-muted" style={{ fontSize: '10px', color: 'rgba(255,255,255,0.45)', whiteSpace: 'nowrap', marginTop: '1px', letterSpacing: '0.5px' }}>ERP Enterprise</div>
          </div>
        )}
      </div>

      {/* Search */}
      {!collapsed && (
        <div style={{ padding: '10px 10px 6px', flexShrink: 0 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '7px 10px',
            borderRadius: '8px',
            background: 'rgba(255,255,255,0.07)',
          }}>
            <Search size={12} style={{ color: 'rgba(255,255,255,0.35)', flexShrink: 0 }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search modules…"
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                fontSize: '12px',
                color: 'rgba(255,255,255,0.8)',
                fontFamily: 'inherit',
              }}
            />
          </div>
        </div>
      )}

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '4px 8px' }}>
        {filtered.map(item => {
          const Icon = item.icon
          const isActive = active === item.key
          return (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              title={collapsed ? item.label : undefined}
              className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: collapsed ? '9px 0' : '9px 10px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                borderRadius: '9px',
                marginBottom: '2px',
                background: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
                color: isActive ? 'white' : 'rgba(255,255,255,0.6)',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: '13px',
                fontWeight: isActive ? 600 : 400,
                position: 'relative',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.09)' }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
            >
              {isActive && (
                <div style={{
                  position: 'absolute',
                  left: 0,
                  top: '20%',
                  height: '60%',
                  width: '3px',
                  borderRadius: '0 3px 3px 0',
                  background: 'var(--accent)',
                }} />
              )}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <Icon size={16} />
              </div>
              {!collapsed && (
                <span style={{ flex: 1, textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {t ? t(`nav.${item.key}`) : item.label}
                </span>
              )}

              {collapsed && (
                <span style={{
                  position: 'absolute',
                  left: 'calc(100% + 8px)',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  color: 'var(--foreground)',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                  opacity: 0,
                  zIndex: 50,
                  boxShadow: 'var(--shadow-sm)',
                }} className="sidebar-tooltip">{t ? t(`nav.${item.key}`) : item.label}</span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Sync status */}
      {!collapsed && (
        <div style={{
          margin: '0 8px 8px',
          padding: '8px 10px',
          borderRadius: '8px',
          background: 'rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexShrink: 0,
        }}>
          {isOnline ? <Wifi size={11} style={{ color: '#4CAF50' }} /> : <WifiOff size={11} style={{ color: 'var(--warning)' }} />}
          <span style={{ fontSize: '11px', color: isOnline ? '#4CAF50' : 'var(--warning)', flex: 1 }}>
            {isOnline ? 'Synced · just now' : 'Offline'}
          </span>
          <div className="pulse-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: isOnline ? '#4CAF50' : 'var(--warning)', flexShrink: 0 }} />
        </div>
      )}

      {/* User */}
      <div style={{
        padding: '10px 8px',
        borderTop: '1px solid var(--sidebar-border)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        flexShrink: 0,
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #2E7D32, #1565C0)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '11px',
          fontWeight: 700,
          flexShrink: 0,
          border: '1.5px solid rgba(255,255,255,0.15)',
        }}>{initials}</div>
        {!collapsed && (
          <>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="sidebar-user-text" style={{ fontSize: '12px', fontWeight: 600, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.name}
              </div>
              <div className="sidebar-muted" style={{ fontSize: '10px', color: 'rgba(255,255,255,0.45)', whiteSpace: 'nowrap' }}>
                {ROLE_LABELS[user.role] ?? user.role}
              </div>
            </div>
            <button
              onClick={onLogout}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: '4px', display: 'flex', flexShrink: 0 }}
              title="Sign out"
            >
              <LogOut size={14} />
            </button>
          </>
        )}
      </div>
    </aside>
  )
}
