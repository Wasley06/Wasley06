import { useState, useEffect, useRef } from 'react'
import { Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react'
import fabegonLogo from '@/imports/ChatGPT_Image_Jun_27__2026__02_20_03_AM.png'
import { useLang } from '@/i18n'
import { supabase, toAuthEmail } from '../lib/supabase'

interface LoginProps {
  onLogin: (user: { name: string; role: string; email: string }) => void
}

/* Role display name → sidebar slug (all 17 system roles) */
const ROLE_SLUG: Record<string, string> = {
  'Super Admin':         'super_admin',
  'Admin':               'admin',
  'Finance Manager':     'finance_manager',
  'Accountant':          'accountant',
  'HR Manager':          'hr_manager',
  'Procurement Officer': 'procurement_officer',
  'Warehouse Officer':   'warehouse_officer',
  'Production Manager':  'production_manager',
  'Sales Manager':       'sales_manager',
  'Sales Rep':           'sales_rep',
  'Storekeeper':         'storekeeper',
  'Cashier':             'cashier',
  'Auditor':             'auditor',
  'Quality Control':     'quality_control',
  'Customer Support':    'customer_support',
  'Branch Manager':      'branch_manager',
  'Employee':            'employee',
}

/* Rotating taglines shown on the hero panel */
const TAGLINES = [
  'Connecting farms to markets, seamlessly.',
  'From grain to shelf — fully tracked.',
  'Real-time visibility across your supply chain.',
  'Precision farming meets enterprise management.',
  'Every harvest. Every order. Fully accounted.',
]

export default function Login({ onLogin }: LoginProps) {
  const { t } = useLang()
  const [identifier, setIdentifier] = useState(() => localStorage.getItem('fabegon:remember-id') ?? '')
  const [password, setPassword]     = useState('')
  const [rememberMe, setRememberMe] = useState(() => !!localStorage.getItem('fabegon:remember-id'))
  const [showPw, setShowPw]         = useState(false)
  const [error, setError]           = useState('')
  const [loading, setLoading]       = useState(false)
  const [taglineIdx, setTaglineIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    const id = setInterval(() => setTaglineIdx(i => (i + 1) % TAGLINES.length), 4000)
    return () => clearInterval(id)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    /* Short artificial delay for UX feel — can reduce to 0 */
    await new Promise(r => setTimeout(r, 400))

    const username = identifier.trim()

    /* 1. Try Supabase Auth (cloud-first) */
    const email = toAuthEmail(username)
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (!authError && authData.user) {
      /* Check suspension status in profiles table */
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, status, username, deleted_at')
        .eq('id', authData.user.id)
        .single()

      if (profile?.deleted_at) {
        await supabase.auth.signOut()
        setError('Your account has been disabled. Please contact your administrator.')
        setLoading(false)
        return
      }

      if (profile?.status === 'Suspended') {
        await supabase.auth.signOut()
        setError('Your account has been suspended. Contact your administrator.')
        setLoading(false)
        return
      }

      const role = profile?.role ?? (authData.user.user_metadata?.role as string) ?? 'Cashier'
      const roleSlug = ROLE_SLUG[role] ?? role.toLowerCase().replace(/\s+/g, '_')
      const displayName = profile?.username ?? username

      /* Update last_login only if profile exists; insert with correct role if missing */
      if (profile) {
        supabase.from('profiles').update({ last_login: new Date().toISOString() }).eq('id', authData.user.id).then(() => {})
      } else {
        supabase.from('profiles').upsert({
          id: authData.user.id,
          username: displayName,
          role,
          phone: authData.user.user_metadata?.phone ?? '',
          status: 'Active',
          last_login: new Date().toISOString(),
        }, { onConflict: 'id' }).then(() => {})
      }

      if (rememberMe) localStorage.setItem('fabegon:remember-id', username)
      else localStorage.removeItem('fabegon:remember-id')

      onLogin({ name: displayName, role: roleSlug, email: authData.user.email ?? '' })
      setLoading(false)
      return
    }

    /* 2. Offline fallback: only allow pre-cached active accounts (no hardcoded credentials) */
    try {
      const raw = localStorage.getItem('fabegon:system-users')
      if (raw) {
        const localUsers: Array<{ username: string; password: string; role: string; status: string }> = JSON.parse(raw)
        const match = localUsers.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password)
        if (match) {
          if (match.status === 'Suspended') {
            setError('Your account has been suspended. Contact your administrator.')
            setLoading(false)
            return
          }
          const roleSlug = ROLE_SLUG[match.role] ?? match.role.toLowerCase().replace(/\s+/g, '_')
          if (rememberMe) localStorage.setItem('fabegon:remember-id', username)
          else localStorage.removeItem('fabegon:remember-id')
          onLogin({ name: match.username, role: roleSlug, email: '' })
          setLoading(false)
          return
        }
      }
    } catch {}

    setError(t('login.error'))
    setLoading(false)
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#080E0A', overflow: 'hidden' }}>

      {/* ─── Left: Hero Panel ─── */}
      <div
        className="lg-left-panel"
        style={{ flex: '1', position: 'relative', overflow: 'hidden', display: 'none' }}
      >
        <style>{`@media (min-width: 900px) { .lg-left-panel { display: block !important; } }`}</style>

        {/* Rich layered gradient — instant, no network needed */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(145deg, #071A09 0%, #0F3314 30%, #1B5E20 60%, #0A3D11 100%)',
        }} />
        {/* Radial accent — warm gold glow bottom-left */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse 70% 55% at 20% 85%, rgba(249,196,42,0.14) 0%, transparent 70%)',
        }} />
        {/* Subtle dot texture overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }} />
        {/* Edge vignette */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.15) 0%, transparent 40%, rgba(0,0,0,0.55) 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.75) 100%)' }} />

        {/* Top badge */}
        <div style={{ position: 'absolute', top: '32px', left: '32px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', overflow: 'hidden', border: '1.5px solid rgba(255,255,255,0.25)', boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }}>
            <img src={fabegonLogo} alt="Fabegon" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <span style={{ color: 'white', fontWeight: 700, fontSize: '15px', textShadow: '0 1px 6px rgba(0,0,0,0.6)', letterSpacing: '0.3px' }}>Fabegon ERP</span>
        </div>

        {/* Shockwave rings + centre logo */}
        <style>{`
          @keyframes shockwave {
            0%   { transform: translate(-50%,-50%) scale(0.6); opacity: 0.55; }
            100% { transform: translate(-50%,-50%) scale(2.4); opacity: 0; }
          }
          .sw-ring { position:absolute; top:50%; left:50%; border-radius:50%; border:1.5px solid rgba(249,196,42,0.45); animation: shockwave 3s ease-out infinite; }
          .sw-ring:nth-child(2) { animation-delay: 1s; }
          .sw-ring:nth-child(3) { animation-delay: 2s; }
        `}</style>
        <div className="sw-ring" style={{ width: '120px', height: '120px' }} />
        <div className="sw-ring" style={{ width: '120px', height: '120px' }} />
        <div className="sw-ring" style={{ width: '120px', height: '120px' }} />
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '260px', height: '260px', borderRadius: '50%',
          border: '1px solid rgba(249,196,42,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            width: '180px', height: '180px', borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ width: '88px', height: '88px', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 8px 40px rgba(0,0,0,0.5)', border: '2px solid rgba(255,255,255,0.18)', zIndex: 2 }}>
              <img src={fabegonLogo} alt="Fabegon" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          </div>
        </div>

        {/* Bottom tagline */}
        <div style={{ position: 'absolute', bottom: '40px', left: '40px', right: '40px' }}>
          <div style={{
            display: 'inline-block', background: 'rgba(249,196,42,0.12)',
            border: '1px solid rgba(249,196,42,0.28)', borderRadius: '6px',
            padding: '4px 10px', fontSize: '10px', letterSpacing: '1.5px',
            textTransform: 'uppercase', color: '#F9C42A', fontWeight: 600, marginBottom: '12px',
          }}>
            Fabegon Industries · ERP
          </div>
          <p key={taglineIdx} style={{
            color: 'rgba(255,255,255,0.88)', fontSize: '20px', fontWeight: 600,
            lineHeight: 1.4, margin: 0, textShadow: '0 2px 12px rgba(0,0,0,0.6)',
            animation: 'fadeInUp 0.5s ease',
          }}>
            "{TAGLINES[taglineIdx]}"
          </p>
          <style>{`@keyframes fadeInUp { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }`}</style>
        </div>
      </div>

      {/* ─── Right: Sign-in Panel ─── */}
      <div style={{
        width: '100%', maxWidth: '460px', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '40px 32px', background: 'var(--background)',
        boxShadow: '-20px 0 60px rgba(0,0,0,0.5)',
        position: 'relative',
      }}>

        <div style={{ width: '100%', maxWidth: '340px' }}>

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '44px' }}>
            <div style={{ width: '50px', height: '50px', borderRadius: '14px', overflow: 'hidden', border: '2px solid var(--border-strong)', boxShadow: '0 4px 20px rgba(46,125,50,0.3)' }}>
              <img src={fabegonLogo} alt="Fabegon" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '17px', color: 'var(--foreground)', lineHeight: 1 }}>Fabegon ERP</div>
              <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', marginTop: '3px', letterSpacing: '0.5px' }}>Enterprise Resource Planning</div>
            </div>
          </div>

          <h1 style={{ margin: '0 0 4px', fontSize: '26px', fontWeight: 700, color: 'var(--foreground)' }}>
            {t('login.welcome')}
          </h1>
          <p style={{ margin: '0 0 32px', fontSize: '13px', color: 'var(--muted-foreground)' }}>
            {t('login.subtitle')}
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--secondary-foreground)', marginBottom: '7px', letterSpacing: '0.2px' }}>
                {t('login.username')}
              </label>
              <input
                ref={inputRef}
                type="text"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                placeholder="e.g. Jane Doe"
                required
                autoComplete="username"
                className="input-base"
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '7px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--secondary-foreground)', letterSpacing: '0.2px' }}>
                  {t('login.password')}
                </label>
                <button type="button" style={{ fontSize: '12px', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  {t('login.forgot')}
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="input-base"
                  style={{ paddingRight: '42px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)', padding: 0, display: 'flex', alignItems: 'center' }}
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}>
              <div
                onClick={() => setRememberMe(v => !v)}
                style={{
                  width: '16px', height: '16px', borderRadius: '4px', flexShrink: 0,
                  border: rememberMe ? 'none' : '2px solid var(--border)',
                  background: rememberMe ? 'var(--primary)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s', cursor: 'pointer',
                }}
              >
                {rememberMe && <span style={{ color: 'white', fontSize: '11px', fontWeight: 700 }}>✓</span>}
              </div>
              <span style={{ fontSize: '12px', color: 'var(--secondary-foreground)' }}>Remember me</span>
            </label>

            {error && (
              <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(239,83,80,0.1)', border: '1px solid rgba(239,83,80,0.25)', color: 'var(--danger)', fontSize: '13px', lineHeight: 1.5 }}>
                {error}
              </div>
            )}

            {/* ── Yellow sign-in button ── */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px',
                fontSize: '14px',
                fontWeight: 700,
                borderRadius: '10px',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                opacity: loading ? 0.8 : 1,
                /* Yellow / accent highlight */
                background: loading
                  ? 'var(--accent)'
                  : 'linear-gradient(135deg, #F9C42A 0%, #e6b020 100%)',
                color: '#1A2B1C',
                boxShadow: loading ? 'none' : '0 4px 20px rgba(249,196,42,0.35)',
                transition: 'all 0.15s',
                letterSpacing: '0.3px',
              }}
              onMouseEnter={e => { if (!loading) { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 24px rgba(249,196,42,0.45)' } }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'none'; (e.currentTarget as HTMLButtonElement).style.boxShadow = loading ? 'none' : '0 4px 20px rgba(249,196,42,0.35)' }}
            >
              {loading ? (
                <><Loader2 size={16} style={{ animation: 'spin-slow 1s linear infinite' }} /> {t('login.signing')}</>
              ) : (
                <>{t('action.signIn')} <ArrowRight size={15} /></>
              )}
            </button>
          </form>

          <p style={{ marginTop: '40px', fontSize: '11px', color: 'var(--muted-foreground)', textAlign: 'center' }}>
            {t('login.copyright')}
          </p>
        </div>
      </div>
    </div>
  )
}
