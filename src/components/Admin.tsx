import { useState, useEffect } from 'react'
import { useLang } from '@/i18n'
import { supabase, toAuthEmail } from '../lib/supabase'
import { Shield, Plus, CheckSquare, Square, Database, RefreshCw, Clock, CheckCircle2, AlertTriangle, HardDrive, LogIn, MessageCircle, KeyRound, Eye, EyeOff, Pencil, Trash2, FileText, Users, Flame } from 'lucide-react'
import FloatingModal, { FormSelect } from './FloatingModal'
import { ALL_ROLES, ROLE_PERMS, MODULES, ACTIONS } from '../lib/permissions'
import { useApp } from '../context/AppContext'
import { logAudit, loadLocalAudit } from '../lib/audit'

interface SystemUser {
  id: string; username: string; fullName: string; phone: string; role: string
  department: string; branch: string; status: 'Active' | 'Suspended'
  lastLogin: string; createdAt: string; deleted_at?: string | null
}

/* Role category groupings for count dashboard */
const ROLE_CATEGORIES: { label: string; roles: string[]; color: string }[] = [
  { label: 'Admins',    roles: ['Super Admin', 'Admin'],                                   color: '#6366F1' },
  { label: 'Managers',  roles: ['Finance Manager', 'HR Manager', 'Sales Manager'],         color: '#3D7FFF' },
  { label: 'Finance',   roles: ['Cashier'],                                                color: '#22C55E' },
  { label: 'Warehouse', roles: ['Storekeeper', 'Procurement Officer'],                     color: '#FBBF24' },
  { label: 'Sales',     roles: ['Sales Rep'],                                              color: '#F43F5E' },
  { label: 'Other',     roles: ['Employee'],                                               color: '#94A3B8' },
]

function dbToUser(p: any): SystemUser {
  return {
    id:         p.id,
    username:   p.username ?? p.id.slice(0,8),
    fullName:   p.full_name ?? p.username ?? '',
    phone:      p.phone ?? '',
    role:       p.role ?? '',
    department: p.department ?? '',
    branch:     p.branch ?? '',
    status:     (p.status as 'Active' | 'Suspended') ?? 'Active',
    lastLogin:  p.last_login ? new Date(p.last_login).toLocaleString() : '—',
    createdAt:  p.created_at ? new Date(p.created_at).toLocaleDateString() : '—',
    deleted_at: p.deleted_at ?? null,
  }
}

/* Use ALL_ROLES from permissions.ts as single source of truth */
const ROLE_NAMES = ALL_ROLES.map(r => r.name)
const DEFAULT_PERMS = ROLE_PERMS

const PERMS_KEY = 'fabegon:perms'
function loadPerms(): Record<string, Record<string, boolean[]>> {
  try { const r = localStorage.getItem(PERMS_KEY); if (r) return JSON.parse(r) } catch {}
  return DEFAULT_PERMS
}

const BACKUPS: { id: string; date: string; size: string; type: string; status: string }[] = []
const SYNC_LOGS: { time: string; module: string; status: string; records: number; duration: string }[] = []

interface Props {
  user: { name: string; email: string; role: string }
  onImpersonate?: (userId: string, userName: string) => void
}

export default function Admin({ user, onImpersonate }: Props) {
  const { t } = useLang()
  const isSuperAdmin = user.role === 'super_admin'
  const isAdmin = isSuperAdmin || user.role === 'admin'

  const { clearJournal, journalEntries } = useApp()
  const [tab, setTab] = useState<'users' | 'roles' | 'perms' | 'audit' | 'backup' | 'sync' | 'data'>('users')
  // Data management — clear journal confirmation
  const [clearConfirmStep, setClearConfirmStep] = useState<0 | 1 | 2>(0)
  const [clearConfirmText, setClearConfirmText] = useState('')
  const [clearing, setClearing] = useState(false)
  const [clearResult, setClearResult] = useState<{ count: number; error: string | null } | null>(null)
  const [selectedRole, setSelectedRole] = useState('Finance Manager')
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>([])
  const [usersLoading, setUsersLoading] = useState(true)
  const [roleFilter, setRoleFilter] = useState<string | null>(null)
  const [permsState, setPermsState] = useState<Record<string, Record<string, boolean[]>>>(loadPerms)

  /* Fetch profiles from Supabase as primary source */
  const loadProfiles = async () => {
    setUsersLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('id, username, full_name, role, phone, department, branch, status, last_login, created_at, deleted_at')
      .order('created_at', { ascending: true })
    if (data) setSystemUsers(data.map(dbToUser))
    setUsersLoading(false)
  }

  useEffect(() => {
    loadProfiles()
    /* Realtime: keep users list live */
    const ch = supabase
      .channel('admin-profiles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => loadProfiles())
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  /* Audit log entries (Supabase + localStorage fallback) */
  const [auditEntries, setAuditEntries] = useState<ReturnType<typeof loadLocalAudit>>([])
  const [auditLoading, setAuditLoading] = useState(false)
  const loadAuditLog = () => {
    setAuditLoading(true)
    supabase.from('erp_audit_log')
      .select('id, actor_name, actor_role, action, entity, entity_id, note, created_at')
      .order('created_at', { ascending: false })
      .limit(200)
      .then(({ data }) => {
        if (data && data.length > 0) setAuditEntries(data as ReturnType<typeof loadLocalAudit>)
        else setAuditEntries(loadLocalAudit())
        setAuditLoading(false)
      })
  }

  const savePerms = (next: Record<string, Record<string, boolean[]>>) => {
    setPermsState(next)
    try { localStorage.setItem(PERMS_KEY, JSON.stringify(next)) } catch {}
  }

  const togglePerm = (role: string, mod: string, ai: number) => {
    const next = JSON.parse(JSON.stringify(permsState)) as Record<string, Record<string, boolean[]>>
    if (!next[role]) next[role] = Object.fromEntries(MODULES.map(m => [m, ACTIONS.map(() => false)]))
    if (!next[role][mod]) next[role][mod] = ACTIONS.map(() => false)
    next[role][mod][ai] = !next[role][mod][ai]
    savePerms(next)
  }

  const mutateUsers = (fn: (prev: SystemUser[]) => SystemUser[]) => {
    setSystemUsers(prev => fn(prev))
  }

  /* Add User modal */
  const [showAddModal, setShowAddModal] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [newFullName, setNewFullName] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newRole, setNewRole] = useState(ROLE_NAMES[1])
  const [newDept, setNewDept] = useState('')
  const [showNewPw, setShowNewPw] = useState(false)

  /* Reset Password modal */
  const [resetTarget, setResetTarget] = useState<SystemUser | null>(null)
  const [resetPw, setResetPw] = useState('')
  const [showResetPw, setShowResetPw] = useState(false)

  /* Edit User modal */
  const [editTarget, setEditTarget] = useState<SystemUser | null>(null)
  const [editUsername, setEditUsername] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editRole, setEditRole] = useState('')
  const [editStatus, setEditStatus] = useState<'Active' | 'Suspended'>('Active')

  const [backupSchedule, setBackupSchedule] = useState('Daily at 03:00')
  const [syncInterval, setSyncInterval] = useState('Every 30 minutes')
  const [syncing, setSyncing] = useState(false)
  const [backingUp, setBackingUp] = useState(false)

  const [addError, setAddError] = useState('')
  const [addLoading, setAddLoading] = useState(false)

  const handleAddUser = async () => {
    if (!newUsername.trim() || !newPassword.trim()) return
    setAddError(''); setAddLoading(true)

    /* CRITICAL: Save the admin's current session before signUp replaces it */
    const { data: { session: adminSession } } = await supabase.auth.getSession()

    /* Create in Supabase Auth (cloud-first) */
    const email = toAuthEmail(newUsername.trim())
    const { data: authData, error: authErr } = await supabase.auth.signUp({
      email,
      password: newPassword,
      options: { data: { username: newUsername.trim(), full_name: newFullName.trim() || newUsername.trim(), role: newRole, phone: newPhone.trim(), department: newDept.trim() } },
    })

    /* CRITICAL: Restore admin session immediately — signUp signs in as new user */
    if (adminSession?.access_token) {
      await supabase.auth.setSession({
        access_token: adminSession.access_token,
        refresh_token: adminSession.refresh_token,
      })
    }

    if (authErr) {
      setAddError(`Failed to create auth account: ${authErr.message}`)
      setAddLoading(false)
      return
    }

    if (!authData?.user) {
      setAddError('User creation failed. Check Supabase email confirmation settings.')
      setAddLoading(false)
      return
    }

    /* Upsert profile row so role is accessible — now running as admin again */
    const year = new Date().getFullYear()
    const empId = `EMP-${year}-${String(Math.floor(Math.random() * 9000) + 1000)}`
    const { error: profileErr } = await supabase.from('profiles').upsert({
      id: authData.user.id,
      username: newUsername.trim(),
      full_name: newFullName.trim() || newUsername.trim(),
      role: newRole,
      phone: newPhone.trim(),
      department: newDept.trim(),
      employee_id: empId,
      status: 'Active',
    })
    if (profileErr) {
      console.error('Profile upsert error:', profileErr.message)
    }

    logAudit({ name: user.name, role: user.role }, { action: 'user_created', entity: 'user', entity_id: authData.user.id, note: `Created ${newUsername.trim()} · ${newRole}` })
    setAddLoading(false)
    setNewUsername(''); setNewFullName(''); setNewPassword(''); setNewPhone(''); setNewRole(ROLE_NAMES[1]); setNewDept('')
    setShowAddModal(false)
    /* Reload profiles so new user appears immediately */
    loadProfiles()
  }

  const handleResetPassword = async () => {
    if (!resetTarget || !resetPw.trim()) return
    /* Update password in Supabase (requires user to be signed in — works for admin reset via email if configured) */
    /* Also update local store */
    mutateUsers(p => p.map(u => u.id === resetTarget.id ? { ...u, password: resetPw.trim() } : u))
    setResetTarget(null); setResetPw('')
  }

  const handleWhatsApp = (u: SystemUser) => {
    const msg = `Hello ${u.fullName || u.username}! Your Fabegon ERP login:\nUsername: ${u.username}\nRole: ${u.role}\nContact your admin if you need your password reset.`
    const phone = u.phone.replace(/\D/g, '')
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  const toggleStatus = async (id: string) => {
    const u = systemUsers.find(x => x.id === id)
    if (!u) return
    const next = u.status === 'Active' ? 'Suspended' : 'Active'
    mutateUsers(p => p.map(x => x.id === id ? { ...x, status: next } : x))
    await supabase.from('profiles').update({ status: next }).eq('id', id)
    logAudit({ name: user.name, role: user.role }, { action: next === 'Suspended' ? 'user_suspended' : 'user_activated', entity: 'user', entity_id: id, note: `${u.username} → ${next}` })
  }

  const openEdit = (u: SystemUser) => {
    setEditTarget(u); setEditUsername(u.username); setEditPhone(u.phone || ''); setEditRole(u.role); setEditStatus(u.status)
  }

  const handleSaveEdit = async () => {
    if (!editTarget) return
    const updated: SystemUser = { ...editTarget, username: editUsername.trim(), phone: editPhone.trim(), role: editRole, status: editStatus }
    mutateUsers(p => p.map(u => u.id === editTarget.id ? updated : u))
    await supabase.from('profiles').update({ username: editUsername.trim(), phone: editPhone.trim(), role: editRole, status: editStatus }).eq('id', editTarget.id)
    logAudit(
      { name: user.name, role: user.role },
      { action: editTarget.role !== editRole ? 'role_changed' : 'user_edited', entity: 'user', entity_id: editTarget.id, old_value: { username: editTarget.username, role: editTarget.role, status: editTarget.status }, new_value: { username: editUsername.trim(), role: editRole, status: editStatus } }
    )
    setEditTarget(null)
  }

  const handleDeleteUser = async (u: SystemUser) => {
    if (!window.confirm(`Disable user "${u.username}"? They will be immediately locked out. Historical records are preserved.`)) return
    const now = new Date().toISOString()
    mutateUsers(p => p.map(x => x.id === u.id ? { ...x, deleted_at: now } : x))
    await supabase.from('profiles').update({ deleted_at: now, deleted_by: (await supabase.auth.getUser()).data.user?.id }).eq('id', u.id)
    logAudit({ name: user.name, role: user.role }, { action: 'user_deleted', entity: 'user', entity_id: u.id, note: `Soft-deleted ${u.username}` })
  }

  const perms = permsState[selectedRole] ?? DEFAULT_PERMS['Finance Manager']

  const triggerSync = () => {
    setSyncing(true)
    setTimeout(() => setSyncing(false), 2500)
  }
  const triggerBackup = () => {
    setBackingUp(true)
    setTimeout(() => setBackingUp(false), 3000)
  }

  return (
    <div className="p-6 space-y-5 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>{t("adm.title")}</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>Users · Roles · Permissions · Backup · Sync</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium"
            style={{ background: 'var(--primary)', color: 'white' }}
          >
            <Plus size={14} /> Add User
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid var(--border)' }}>
        {([
          { key: 'users',  label: 'Users' },
          { key: 'roles',  label: 'Roles' },
          { key: 'perms',  label: 'Permissions Matrix' },
          { key: 'audit',  label: 'Audit Log' },
          { key: 'backup', label: 'Auto Backup' },
          { key: 'sync',   label: 'System Sync' },
          { key: 'data',   label: 'Data Management' },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: '8px 14px',
            fontSize: '13px',
            fontWeight: 500,
            fontFamily: 'inherit',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            color: tab === t.key ? 'var(--primary)' : 'var(--muted-foreground)',
            borderBottom: tab === t.key ? '2px solid var(--primary)' : '2px solid transparent',
            marginBottom: '-1px',
            whiteSpace: 'nowrap',
          }}>{t.label}</button>
        ))}
      </div>

      {tab === 'users' && (() => {
        /* Visibility: Super Admin sees all; others never see Super Admin accounts */
        const allVisible = isSuperAdmin
          ? systemUsers
          : systemUsers.filter(u => u.role !== 'Super Admin')

        /* Role category filter */
        const filtered = roleFilter
          ? allVisible.filter(u => {
              const cat = ROLE_CATEGORIES.find(c => c.label === roleFilter)
              return cat ? cat.roles.includes(u.role) : true
            })
          : allVisible

        const active    = allVisible.filter(u => u.status === 'Active' && !u.deleted_at).length
        const suspended = allVisible.filter(u => u.status === 'Suspended').length
        const deleted   = allVisible.filter(u => !!u.deleted_at).length

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Count dashboard */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px' }}>
              {[
                { label: 'Total Users', value: allVisible.length, color: 'var(--primary)', filter: null },
                { label: 'Active',      value: active,            color: 'var(--success)', filter: null },
                { label: 'Suspended',   value: suspended,         color: 'var(--warning)', filter: null },
                { label: 'Disabled',    value: deleted,           color: 'var(--danger)',  filter: null },
                ...ROLE_CATEGORIES.map(c => ({
                  label: c.label,
                  value: allVisible.filter(u => c.roles.includes(u.role) && !u.deleted_at).length,
                  color: c.color,
                  filter: c.label,
                }))
              ].map(s => (
                <div key={s.label}
                  onClick={() => setRoleFilter(prev => prev === s.filter ? null : s.filter)}
                  style={{ padding: '12px 14px', borderRadius: '10px', background: roleFilter === s.filter && s.filter ? s.color + '20' : 'var(--card)', border: `1px solid ${roleFilter === s.filter && s.filter ? s.color : 'var(--border)'}`, cursor: s.filter ? 'pointer' : 'default', transition: 'all 0.15s' }}
                >
                  <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: '10px', color: 'var(--muted-foreground)', marginTop: '2px' }}>{s.label}</div>
                </div>
              ))}
            </div>
            {roleFilter && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={12} style={{ color: 'var(--primary)' }} />
                <span style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>Showing: <strong style={{ color: 'var(--foreground)' }}>{roleFilter}</strong></span>
                <button onClick={() => setRoleFilter(null)} style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '6px', background: 'var(--secondary)', color: 'var(--muted-foreground)', border: '1px solid var(--border)', cursor: 'pointer', fontFamily: 'inherit' }}>Clear filter</button>
              </div>
            )}
            <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--card)' }}>
              {usersLoading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted-foreground)', fontSize: '13px' }}>
                  <RefreshCw size={16} style={{ animation: 'spin-slow 1s linear infinite', display: 'inline', marginRight: '8px' }} />
                  Loading users from Supabase…
                </div>
              ) : filtered.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted-foreground)', fontSize: '13px' }}>
                  {roleFilter ? `No users in category "${roleFilter}".` : 'No users yet. Add team members to get started.'}
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      {['Full Name', 'Username', 'Department', 'Role', 'Status', 'Last Login', 'Created', 'Actions'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: '11px', fontWeight: 600, color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((u, i) => (
                      <tr key={u.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--secondary)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <td style={{ padding: '10px 16px' }}>
                          <div style={{ fontSize: '12px', fontWeight: 600, color: u.deleted_at ? 'var(--muted-foreground)' : 'var(--foreground)' }}>
                            {u.deleted_at ? 'Former User' : (u.fullName || u.username)}
                            {u.deleted_at && <span style={{ fontSize: '10px', marginLeft: '6px', color: 'var(--danger)' }}>✕ Disabled</span>}
                          </div>
                        </td>
                        <td style={{ padding: '10px 16px', fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', color: 'var(--primary)' }}>{u.username}</td>
                        <td style={{ padding: '10px 16px', fontSize: '11px', color: 'var(--muted-foreground)' }}>{u.department || '—'}</td>
                        <td style={{ padding: '10px 16px', fontSize: '12px', color: 'var(--secondary-foreground)' }}>{u.role}</td>
                        <td style={{ padding: '10px 16px' }}>
                          <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: u.deleted_at ? 'rgba(239,68,68,0.08)' : u.status === 'Active' ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)', color: u.deleted_at ? 'var(--danger)' : u.status === 'Active' ? 'var(--success)' : 'var(--warning)' }}>
                            {u.deleted_at ? 'Disabled' : u.status}
                          </span>
                        </td>
                        <td style={{ padding: '10px 16px', fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>{u.lastLogin}</td>
                        <td style={{ padding: '10px 16px', fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>{u.createdAt}</td>
                        <td style={{ padding: '10px 16px' }}>
                          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                            {isAdmin && u.deleted_at && (
                              <button onClick={async () => { mutateUsers(p => p.map(x => x.id === u.id ? { ...x, deleted_at: null } : x)); await supabase.from('profiles').update({ deleted_at: null, deleted_by: null }).eq('id', u.id); logAudit({ name: user.name, role: user.role }, { action: 'user_restored', entity: 'user', entity_id: u.id, note: `Restored ${u.username}` }) }} style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', background: 'rgba(34,197,94,0.1)', color: 'var(--success)', border: '1px solid rgba(34,197,94,0.25)', cursor: 'pointer', fontFamily: 'inherit' }}>Restore</button>
                            )}
                            {isAdmin && !u.deleted_at && (
                              <button onClick={() => toggleStatus(u.id)} style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', background: 'var(--secondary)', color: u.status === 'Active' ? 'var(--warning)' : 'var(--success)', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                                {u.status === 'Active' ? 'Suspend' : 'Activate'}
                              </button>
                            )}
                            {isAdmin && !u.deleted_at && u.role !== 'Super Admin' && (
                              <button onClick={() => { setResetTarget(u); setResetPw('') }} style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', background: 'rgba(245,158,11,0.1)', color: 'var(--warning)', border: '1px solid rgba(245,158,11,0.25)', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                <KeyRound size={10} /> Reset PW
                              </button>
                            )}
                            {isAdmin && !u.deleted_at && u.role !== 'Super Admin' && (
                              <button onClick={() => handleWhatsApp(u)} style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', background: 'rgba(37,211,102,0.1)', color: '#25D366', border: '1px solid rgba(37,211,102,0.3)', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                <MessageCircle size={10} /> WhatsApp
                              </button>
                            )}
                            {isAdmin && !u.deleted_at && u.role !== 'Super Admin' && (
                              <button onClick={() => openEdit(u)} style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', background: 'rgba(61,127,255,0.1)', color: 'var(--primary)', border: '1px solid rgba(61,127,255,0.25)', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                <Pencil size={10} /> Edit
                              </button>
                            )}
                            {isAdmin && !u.deleted_at && u.role !== 'Super Admin' && (
                              <button onClick={() => handleDeleteUser(u)} style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', background: 'rgba(239,68,68,0.08)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                <Trash2 size={10} /> Delete
                              </button>
                            )}
                            {isSuperAdmin && !u.deleted_at && u.role !== 'Super Admin' && (
                              <button onClick={() => onImpersonate?.(u.id, u.username)} style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', background: 'rgba(99,102,241,0.12)', color: '#6366F1', border: '1px solid rgba(99,102,241,0.3)', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                <LogIn size={10} /> Enter as
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )
      })()}

      {tab === 'roles' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
          {ALL_ROLES.filter(r => isSuperAdmin ? true : r.name !== 'Super Admin').map(r => { const count = systemUsers.filter(u => u.role === r.name && !u.deleted_at).length; return (
            <div
              key={r.name}
              onClick={() => { setSelectedRole(r.name); setTab('perms') }}
              style={{ borderRadius: '12px', padding: '16px', cursor: 'pointer', background: 'var(--card)', border: '1px solid var(--border)', transition: 'border-color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = r.color + '55')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: r.color + '20' }}>
                  <Shield size={14} style={{ color: r.color }} />
                </div>
                <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: 'rgba(255,255,255,0.06)', color: 'var(--muted-foreground)' }}>
                  {count} {count === 1 ? 'user' : 'users'}
                </span>
              </div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)' }}>{r.name}</div>
              <div style={{ fontSize: '11px', marginTop: '4px', color: 'var(--muted-foreground)' }}>Click to view permissions →</div>
            </div>
          )})}
        </div>
      )}

      {tab === 'perms' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '13px', color: 'var(--muted-foreground)' }}>{isAdmin ? 'Edit permissions for:' : 'Viewing permissions for:'}</span>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {ALL_ROLES.filter(r => isSuperAdmin ? true : r.name !== 'Super Admin').map(r => (
                  <button key={r.name} onClick={() => setSelectedRole(r.name)} style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '8px', border: '1px solid var(--border)', background: selectedRole === r.name ? 'var(--primary)' : 'var(--secondary)', color: selectedRole === r.name ? 'white' : 'var(--secondary-foreground)', cursor: 'pointer', fontFamily: 'inherit', fontWeight: selectedRole === r.name ? 600 : 400 }}>
                    {r.name}
                  </button>
                ))}
              </div>
            </div>
            {isAdmin && (
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={() => { const next = { ...permsState }; next[selectedRole] = JSON.parse(JSON.stringify(DEFAULT_PERMS[selectedRole] ?? DEFAULT_PERMS['Finance Manager'])); savePerms(next) }}
                  style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--secondary)', color: 'var(--muted-foreground)', cursor: 'pointer', fontFamily: 'inherit' }}
                >Reset to Default</button>
                <button
                  onClick={() => { const all = Object.fromEntries(MODULES.map(m => [m, ACTIONS.map(() => false)])); const next = { ...permsState }; next[selectedRole] = all; savePerms(next) }}
                  style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: 'var(--danger)', cursor: 'pointer', fontFamily: 'inherit' }}
                >Clear All</button>
              </div>
            )}
          </div>
          {isAdmin && <p style={{ fontSize: '11px', color: 'var(--muted-foreground)', margin: 0 }}>Click any checkbox to toggle permission for this role. Changes are saved automatically.</p>}
          <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--card)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ textAlign: 'left', padding: '10px 16px', fontSize: '11px', fontWeight: 600, color: 'var(--muted-foreground)' }}>Module</th>
                  {ACTIONS.map(a => (
                    <th key={a} style={{ textAlign: 'center', padding: '10px 12px', fontSize: '11px', fontWeight: 600, color: 'var(--muted-foreground)' }}>{a}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MODULES.map((mod, i) => {
                  const row = perms[mod] ?? ACTIONS.map(() => false)
                  return (
                    <tr key={mod} style={{ borderBottom: i < MODULES.length - 1 ? '1px solid var(--border)' : 'none' }}
                      onMouseEnter={e => { if (isAdmin) e.currentTarget.style.background = 'var(--secondary)' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                    >
                      <td style={{ padding: '8px 16px', fontSize: '12px', fontWeight: 500, color: 'var(--foreground)' }}>{mod}</td>
                      {ACTIONS.map((_, ai) => (
                        <td key={ai} style={{ padding: '8px 12px', textAlign: 'center' }}
                          onClick={() => isAdmin && togglePerm(selectedRole, mod, ai)}
                          title={isAdmin ? `Toggle ${ACTIONS[ai]} for ${mod}` : undefined}
                        >
                          {row[ai] ? (
                            <CheckSquare size={14} style={{ color: 'var(--success)', margin: 'auto', cursor: isAdmin ? 'pointer' : 'default' }} />
                          ) : (
                            <Square size={14} style={{ color: 'var(--muted-foreground)', margin: 'auto', opacity: 0.4, cursor: isAdmin ? 'pointer' : 'default' }} />
                          )}
                        </td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'audit' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={14} style={{ color: 'var(--primary)' }} />
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)' }}>Enterprise Audit Log</span>
            </div>
            <button
              onClick={loadAuditLog}
              disabled={auditLoading}
              style={{ fontSize: '12px', padding: '6px 14px', borderRadius: '8px', background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '5px', opacity: auditLoading ? 0.7 : 1 }}
            >
              <RefreshCw size={12} style={auditLoading ? { animation: 'spin-slow 0.8s linear infinite' } : undefined} />
              {auditLoading ? 'Loading…' : 'Refresh'}
            </button>
          </div>
          {auditEntries.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted-foreground)', fontSize: '13px', background: 'var(--card)', borderRadius: '12px', border: '1px solid var(--border)' }}>
              No audit entries yet. Actions like login, create, edit, and delete will appear here.
              <div style={{ marginTop: '10px' }}>
                <button onClick={loadAuditLog} style={{ fontSize: '12px', padding: '6px 14px', borderRadius: '8px', background: 'var(--secondary)', color: 'var(--secondary-foreground)', border: '1px solid var(--border)', cursor: 'pointer', fontFamily: 'inherit' }}>Load Audit Log</button>
              </div>
            </div>
          ) : (
            <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--card)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Time', 'Actor', 'Role', 'Action', 'Entity', 'Note'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: '11px', fontWeight: 600, color: 'var(--muted-foreground)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {auditEntries.map((e, i) => (
                    <tr key={e.id} style={{ borderBottom: i < auditEntries.length - 1 ? '1px solid var(--border)' : 'none' }}
                      onMouseEnter={ev => (ev.currentTarget.style.background = 'var(--secondary)')}
                      onMouseLeave={ev => (ev.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '8px 14px', fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>
                        {new Date(e.created_at).toLocaleString()}
                      </td>
                      <td style={{ padding: '8px 14px', fontWeight: 500, color: 'var(--foreground)' }}>{e.actor_name}</td>
                      <td style={{ padding: '8px 14px', color: 'var(--muted-foreground)' }}>{e.actor_role}</td>
                      <td style={{ padding: '8px 14px' }}>
                        <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: e.action.includes('deleted') ? 'rgba(239,68,68,0.1)' : e.action.includes('created') ? 'rgba(34,197,94,0.1)' : 'rgba(61,127,255,0.1)', color: e.action.includes('deleted') ? 'var(--danger)' : e.action.includes('created') ? 'var(--success)' : 'var(--primary)' }}>
                          {e.action}
                        </span>
                      </td>
                      <td style={{ padding: '8px 14px', color: 'var(--muted-foreground)', fontSize: '11px' }}>
                        {[e.entity, e.entity_id].filter(Boolean).join(' · ')}
                      </td>
                      <td style={{ padding: '8px 14px', color: 'var(--muted-foreground)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {e.note ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'backup' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Config card */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Database size={14} style={{ color: 'var(--primary)' }} />
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)' }}>Backup Configuration</span>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 500, color: 'var(--muted-foreground)', marginBottom: '6px' }}>Schedule</label>
                <select className="input-base" value={backupSchedule} onChange={e => setBackupSchedule(e.target.value)} style={{ cursor: 'pointer' }}>
                  {['Daily at 03:00', 'Every 12 hours', 'Every 6 hours', 'Weekly on Sunday', 'Monthly'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 500, color: 'var(--muted-foreground)', marginBottom: '6px' }}>Retention Period</label>
                <select className="input-base" style={{ cursor: 'pointer' }}>
                  {['7 days', '14 days', '30 days', '60 days', '90 days'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 500, color: 'var(--muted-foreground)', marginBottom: '6px' }}>Storage Location</label>
                <select className="input-base" style={{ cursor: 'pointer' }}>
                  {['Local Server', 'AWS S3', 'Google Cloud Storage', 'Azure Blob'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={triggerBackup} style={{ flex: 1, padding: '9px 14px', borderRadius: '8px', background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 500, fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  {backingUp ? <><RefreshCw size={13} style={{ animation: 'spin-slow 1s linear infinite' }} /> Backing up…</> : <><HardDrive size={13} /> Backup Now</>}
                </button>
                <button style={{ padding: '9px 14px', borderRadius: '8px', background: 'var(--secondary)', color: 'var(--secondary-foreground)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit' }}>Save Config</button>
              </div>
            </div>

            <div className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <HardDrive size={14} style={{ color: 'var(--success)' }} />
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)' }}>Storage Status</span>
              </div>
              {[
                { label: 'Total Storage', value: '500 GB', note: 'Allocated' },
                { label: 'Used',          value: '48.2 GB', note: '9.6% used' },
                { label: 'Available',     value: '451.8 GB', note: '' },
                { label: 'Total Backups', value: `${BACKUPS.length} files`, note: '' },
              ].map(s => (
                <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '12px', color: 'var(--foreground)' }}>{s.label}</span>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, fontFamily: 'JetBrains Mono', color: 'var(--foreground)' }}>{s.value}</div>
                    {s.note && <div style={{ fontSize: '10px', color: 'var(--muted-foreground)' }}>{s.note}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Backup log */}
          <div className="card rounded-xl overflow-hidden">
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: '14px', color: 'var(--foreground)' }}>Backup History</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Backup ID', 'Date & Time', 'Size', 'Type', 'Status', 'Actions'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: '11px', fontWeight: 600, color: 'var(--muted-foreground)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {BACKUPS.map((b, i) => (
                  <tr key={b.id} style={{ borderBottom: i < BACKUPS.length - 1 ? '1px solid var(--border)' : 'none' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--secondary)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '10px 16px', fontSize: '12px', fontFamily: 'JetBrains Mono', color: 'var(--primary)' }}>{b.id}</td>
                    <td style={{ padding: '10px 16px', fontSize: '11px', fontFamily: 'JetBrains Mono', color: 'var(--muted-foreground)' }}>{b.date}</td>
                    <td style={{ padding: '10px 16px', fontSize: '12px', fontFamily: 'JetBrains Mono', color: 'var(--foreground)' }}>{b.size}</td>
                    <td style={{ padding: '10px 16px', fontSize: '11px', color: 'var(--secondary-foreground)' }}>{b.type}</td>
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: b.status === 'Success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', color: b.status === 'Success' ? 'var(--success)' : 'var(--danger)' }}>
                        {b.status === 'Success' ? '✓ ' : '✗ '}{b.status}
                      </span>
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <button style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', background: 'var(--secondary)', color: 'var(--primary)', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Restore</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'sync' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <RefreshCw size={14} style={{ color: 'var(--primary)' }} />
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)' }}>Sync Configuration</span>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 500, color: 'var(--muted-foreground)', marginBottom: '6px' }}>Sync Interval</label>
                <select className="input-base" value={syncInterval} onChange={e => setSyncInterval(e.target.value)} style={{ cursor: 'pointer' }}>
                  {['Every 5 minutes', 'Every 15 minutes', 'Every 30 minutes', 'Every hour', 'Real-time'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 500, color: 'var(--muted-foreground)', marginBottom: '6px' }}>Modules to Sync</label>
                {['Inventory', 'Sales', 'Finance', 'Production', 'HR'].map(m => (
                  <div key={m} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0' }}>
                    <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <CheckSquare size={12} style={{ color: 'white' }} />
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--foreground)' }}>{m}</span>
                  </div>
                ))}
              </div>
              <button onClick={triggerSync} style={{ width: '100%', padding: '9px 14px', borderRadius: '8px', background: syncing ? 'var(--secondary)' : 'var(--primary)', color: syncing ? 'var(--foreground)' : 'white', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 500, fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                {syncing ? <><RefreshCw size={13} style={{ animation: 'spin-slow 0.8s linear infinite' }} /> Syncing…</> : <><RefreshCw size={13} /> Force Sync All</>}
              </button>
            </div>

            <div className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <CheckCircle2 size={14} style={{ color: 'var(--success)' }} />
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)' }}>Sync Status</span>
              </div>
              {[
                { module: 'Inventory', lastSync: '10:00 AM', ok: true },
                { module: 'Sales',     lastSync: '09:30 AM', ok: true },
                { module: 'Finance',   lastSync: '09:00 AM', ok: true },
                { module: 'HR',        lastSync: '08:30 AM', ok: false },
                { module: 'CRM',       lastSync: '08:00 AM', ok: true },
              ].map(s => (
                <div key={s.module} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--foreground)' }}>{s.module}</div>
                    <div style={{ fontSize: '10px', color: 'var(--muted-foreground)', display: 'flex', alignItems: 'center', gap: '3px' }}><Clock size={9} />{s.lastSync}</div>
                  </div>
                  {s.ok
                    ? <CheckCircle2 size={14} style={{ color: 'var(--success)' }} />
                    : <AlertTriangle size={14} style={{ color: 'var(--danger)' }} />
                  }
                </div>
              ))}
            </div>
          </div>

          {/* Sync log */}
          <div className="card rounded-xl overflow-hidden">
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: '14px', color: 'var(--foreground)' }}>Sync Activity Log</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Time', 'Module', 'Records', 'Duration', 'Status'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: '11px', fontWeight: 600, color: 'var(--muted-foreground)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SYNC_LOGS.map((l, i) => (
                  <tr key={i} style={{ borderBottom: i < SYNC_LOGS.length - 1 ? '1px solid var(--border)' : 'none' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--secondary)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '10px 16px', fontSize: '11px', fontFamily: 'JetBrains Mono', color: 'var(--muted-foreground)' }}>{l.time}</td>
                    <td style={{ padding: '10px 16px', fontSize: '12px', color: 'var(--foreground)' }}>{l.module}</td>
                    <td style={{ padding: '10px 16px', fontSize: '12px', fontFamily: 'JetBrains Mono', color: 'var(--foreground)' }}>{l.records}</td>
                    <td style={{ padding: '10px 16px', fontSize: '11px', fontFamily: 'JetBrains Mono', color: 'var(--muted-foreground)' }}>{l.duration}</td>
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: l.status === 'Synced' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', color: l.status === 'Synced' ? 'var(--success)' : 'var(--danger)' }}>
                        {l.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Data Management Tab ─────────────────────────────────── */}
      {tab === 'data' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '640px' }}>
          {/* Header warning */}
          <div style={{ padding: '14px 16px', borderRadius: '10px', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.25)', display: 'flex', gap: '10px' }}>
            <AlertTriangle size={16} style={{ color: 'var(--danger)', flexShrink: 0, marginTop: '1px' }} />
            <div style={{ fontSize: '12px', color: 'var(--secondary-foreground)', lineHeight: 1.6 }}>
              <strong style={{ color: 'var(--danger)' }}>Destructive operations.</strong> These actions permanently delete data from Supabase and cannot be undone. Use only to reset demo or test data before going live.
            </div>
          </div>

          {/* Clear Journal / Balance Sheet / P&L card */}
          <div style={{ borderRadius: '12px', border: '1px solid rgba(239,68,68,0.25)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', background: 'rgba(239,68,68,0.05)', borderBottom: '1px solid rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Flame size={15} style={{ color: 'var(--danger)' }} />
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--foreground)' }}>Clear Journal Entries, Balance Sheet &amp; P&amp;L</div>
                <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', marginTop: '2px' }}>Deletes all rows from <code style={{ fontFamily: 'JetBrains Mono, monospace', background: 'var(--secondary)', padding: '1px 4px', borderRadius: '3px' }}>erp_journal</code> in Supabase and clears local state. Balance Sheet and Profit &amp; Loss are derived from the journal, so they reset automatically.</div>
              </div>
            </div>
            <div style={{ padding: '20px' }}>
              {/* Current count */}
              <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'var(--secondary)', border: '1px solid var(--border)', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>Journal entries currently in system</span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '16px', fontWeight: 700, color: journalEntries.length > 0 ? 'var(--warning)' : 'var(--success)' }}>{journalEntries.length}</span>
              </div>

              {clearResult ? (
                clearResult.error ? (
                  <div style={{ padding: '12px 14px', borderRadius: '8px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', fontSize: '13px', color: 'var(--danger)' }}>
                    ✗ Error: {clearResult.error}
                    <button onClick={() => { setClearResult(null); setClearConfirmStep(0); setClearConfirmText('') }} style={{ marginLeft: '12px', fontSize: '11px', padding: '2px 8px', borderRadius: '6px', background: 'transparent', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--secondary-foreground)', fontFamily: 'inherit' }}>Try Again</button>
                  </div>
                ) : (
                  <div style={{ padding: '12px 14px', borderRadius: '8px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', fontSize: '13px', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={15} />
                    Successfully cleared {clearResult.count} journal entries. Journal, Balance Sheet, and P&amp;L are now empty.
                  </div>
                )
              ) : clearConfirmStep === 0 ? (
                <button
                  onClick={() => setClearConfirmStep(1)}
                  disabled={journalEntries.length === 0}
                  style={{ padding: '9px 18px', borderRadius: '8px', background: journalEntries.length === 0 ? 'var(--secondary)' : 'rgba(239,68,68,0.1)', color: journalEntries.length === 0 ? 'var(--muted-foreground)' : 'var(--danger)', border: `1px solid ${journalEntries.length === 0 ? 'var(--border)' : 'rgba(239,68,68,0.3)'}`, cursor: journalEntries.length === 0 ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 600, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Trash2 size={13} /> Clear Journal Data
                </button>
              ) : clearConfirmStep === 1 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--danger)' }}>⚠️ Are you sure? This will permanently delete {journalEntries.length} journal entries from Supabase.</div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => setClearConfirmStep(0)} style={{ padding: '8px 16px', borderRadius: '8px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--secondary-foreground)', cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit' }}>Cancel</button>
                    <button onClick={() => setClearConfirmStep(2)} style={{ padding: '8px 16px', borderRadius: '8px', background: 'var(--danger)', color: 'white', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, fontFamily: 'inherit' }}>Yes, I understand</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--secondary-foreground)' }}>Type <strong style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--danger)' }}>CLEAR</strong> to confirm:</div>
                  <input
                    className="input-base"
                    placeholder="Type CLEAR"
                    value={clearConfirmText}
                    onChange={e => setClearConfirmText(e.target.value)}
                    style={{ fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.1em' }}
                  />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => { setClearConfirmStep(0); setClearConfirmText('') }} style={{ padding: '8px 16px', borderRadius: '8px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--secondary-foreground)', cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit' }}>Cancel</button>
                    <button
                      disabled={clearConfirmText !== 'CLEAR' || clearing}
                      onClick={async () => {
                        setClearing(true)
                        const result = await clearJournal()
                        setClearing(false)
                        setClearResult(result)
                        setClearConfirmStep(0)
                        setClearConfirmText('')
                      }}
                      style={{ padding: '8px 16px', borderRadius: '8px', background: clearConfirmText === 'CLEAR' ? 'var(--danger)' : 'var(--secondary)', color: clearConfirmText === 'CLEAR' ? 'white' : 'var(--muted-foreground)', border: 'none', cursor: clearConfirmText === 'CLEAR' ? 'pointer' : 'not-allowed', fontSize: '13px', fontWeight: 600, fontFamily: 'inherit', opacity: clearing ? 0.7 : 1 }}
                    >
                      {clearing ? 'Clearing…' : 'Confirm — Delete All Journal Data'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SQL alternative */}
          <div style={{ padding: '14px 16px', borderRadius: '10px', background: 'var(--secondary)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: '8px' }}>Alternative: run directly in Supabase SQL Editor</div>
            <pre style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: 'var(--foreground)', margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{`-- Clear journal (Balance Sheet + P&L reset automatically)\nTRUNCATE TABLE public.erp_journal;`}</pre>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <FloatingModal
          title="Add User"
          subtitle="Create a new system login account"
          onClose={() => setShowAddModal(false)}
          footer={
            <>
              {addError && <span style={{ fontSize: '11px', color: 'var(--danger)', marginRight: 'auto' }}>{addError}</span>}
              <button onClick={() => setShowAddModal(false)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleAddUser} disabled={addLoading} className="btn btn-primary" style={{ opacity: addLoading ? 0.7 : 1 }}>
                {addLoading ? 'Creating…' : 'Add User'}
              </button>
            </>
          }
        >
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px', color: 'var(--secondary-foreground)' }}>Full Name</label>
            <input className="input-base" placeholder="e.g. Jane Doe" value={newFullName} onChange={e => setNewFullName(e.target.value)} autoComplete="off" />
          </div>
          <div style={{ marginBottom: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px', color: 'var(--secondary-foreground)' }}>Username</label>
              <input className="input-base" placeholder="e.g. jane.doe" value={newUsername} onChange={e => setNewUsername(e.target.value)} autoComplete="off" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px', color: 'var(--secondary-foreground)' }}>Department</label>
              <input className="input-base" placeholder="e.g. Finance" value={newDept} onChange={e => setNewDept(e.target.value)} />
            </div>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px', color: 'var(--secondary-foreground)' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                className="input-base"
                type={showNewPw ? 'text' : 'password'}
                placeholder="Set a strong password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                autoComplete="new-password"
                style={{ paddingRight: '40px' }}
              />
              <button
                type="button"
                onClick={() => setShowNewPw(v => !v)}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)', display: 'flex' }}
              >
                {showNewPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px', color: 'var(--secondary-foreground)' }}>Phone (for WhatsApp)</label>
            <input className="input-base" placeholder="+255 700 000 000" value={newPhone} onChange={e => setNewPhone(e.target.value)} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px', color: 'var(--secondary-foreground)' }}>Role</label>
            <FormSelect options={ROLE_NAMES.filter(r => r !== 'Super Admin')} value={newRole} onChange={setNewRole} />
          </div>
        </FloatingModal>
      )}

      {/* Reset Password Modal */}
      {resetTarget && (
        <FloatingModal
          title="Reset Password"
          subtitle={`Set a new password for ${resetTarget.username}`}
          onClose={() => setResetTarget(null)}
          footer={
            <>
              <button onClick={() => setResetTarget(null)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleResetPassword} className="btn btn-primary">Save Password</button>
            </>
          }
        >
          <div style={{ marginBottom: '12px', padding: '10px 14px', borderRadius: '8px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', fontSize: '12px', color: 'var(--warning)' }}>
            Resetting password for <strong style={{ fontFamily: 'JetBrains Mono, monospace' }}>{resetTarget.username}</strong> · {resetTarget.role}
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px', color: 'var(--secondary-foreground)' }}>New Password</label>
            <div style={{ position: 'relative' }}>
              <input
                className="input-base"
                type={showResetPw ? 'text' : 'password'}
                placeholder="Enter new password"
                value={resetPw}
                onChange={e => setResetPw(e.target.value)}
                autoComplete="new-password"
                style={{ paddingRight: '40px' }}
              />
              <button
                type="button"
                onClick={() => setShowResetPw(v => !v)}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)', display: 'flex' }}
              >
                {showResetPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--muted-foreground)' }}>
              After resetting, use the WhatsApp button on the user row to send them their new credentials.
            </div>
          </div>
        </FloatingModal>
      )}

      {/* Edit User Modal */}
      {editTarget && (
        <FloatingModal
          title="Edit User"
          subtitle={`Editing account for ${editTarget.username}`}
          onClose={() => setEditTarget(null)}
          footer={
            <>
              <button onClick={() => setEditTarget(null)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleSaveEdit} className="btn btn-primary">Save Changes</button>
            </>
          }
        >
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px', color: 'var(--secondary-foreground)' }}>Username</label>
            <input className="input-base" value={editUsername} onChange={e => setEditUsername(e.target.value)} autoComplete="off" />
          </div>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px', color: 'var(--secondary-foreground)' }}>Phone (WhatsApp)</label>
            <input className="input-base" placeholder="+255 700 000 000" value={editPhone} onChange={e => setEditPhone(e.target.value)} />
          </div>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px', color: 'var(--secondary-foreground)' }}>Role</label>
            <FormSelect options={ROLE_NAMES.filter(r => r !== 'Super Admin')} value={editRole} onChange={setEditRole} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px', color: 'var(--secondary-foreground)' }}>Status</label>
            <FormSelect options={['Active', 'Suspended']} value={editStatus} onChange={v => setEditStatus(v as 'Active' | 'Suspended')} />
          </div>
        </FloatingModal>
      )}
    </div>
  )
}
