import { useEffect, useState } from 'react'
import fabegonLogo from '@/imports/ChatGPT_Image_Jun_27__2026__02_20_03_AM.png'

interface Props {
  onDone: () => void
}

export default function LoadingScreen({ onDone }: Props) {
  const [phase, setPhase] = useState<'logo' | 'text' | 'bar' | 'done'>('logo')
  const [progress, setProgress] = useState(0)
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('text'), 600)
    const t2 = setTimeout(() => setPhase('bar'), 1100)

    let raf: number
    let start: number | null = null
    const duration = 1800

    const tick = (ts: number) => {
      if (!start) start = ts
      const elapsed = ts - start
      const pct = Math.min((elapsed / duration) * 100, 100)
      setProgress(pct)
      if (pct < 100) {
        raf = requestAnimationFrame(tick)
      } else {
        setTimeout(() => {
          setExiting(true)
          setTimeout(onDone, 600)
        }, 200)
      }
    }

    const t3 = setTimeout(() => {
      raf = requestAnimationFrame(tick)
    }, 1100)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      cancelAnimationFrame(raf)
    }
  }, [onDone])

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'linear-gradient(135deg, #050C06 0%, #0A1A0C 50%, #06100A 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        opacity: exiting ? 0 : 1,
        transition: 'opacity 0.6s ease',
      }}
    >
      {/* Ambient glow */}
      <div style={{
        position: 'absolute',
        width: '600px',
        height: '600px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(46,125,50,0.12) 0%, transparent 70%)',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
      }} />

      {/* Outer ring animation */}
      <div style={{
        position: 'absolute',
        width: '220px',
        height: '220px',
        borderRadius: '50%',
        border: '1px solid rgba(46,125,50,0.2)',
        animation: 'pulse-ring 3s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute',
        width: '260px',
        height: '260px',
        borderRadius: '50%',
        border: '1px solid rgba(249,196,42,0.1)',
        animation: 'pulse-ring 3s ease-in-out infinite 0.5s',
      }} />

      {/* Logo */}
      <div style={{ animation: 'scaleIn 0.6s cubic-bezier(0.34,1.56,0.64,1) both', position: 'relative', zIndex: 1 }}>
        <div style={{
          width: '140px',
          height: '140px',
          borderRadius: '36px',
          overflow: 'hidden',
          boxShadow: '0 0 60px rgba(46,125,50,0.4), 0 0 120px rgba(46,125,50,0.15)',
          border: '2px solid rgba(46,125,50,0.3)',
        }}>
          <img
            src={fabegonLogo}
            alt="Fabegon Logo"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        </div>
      </div>

      {/* Brand text */}
      <div
        style={{
          marginTop: '28px',
          textAlign: 'center',
          position: 'relative',
          zIndex: 1,
          opacity: phase === 'logo' ? 0 : 1,
          transform: phase === 'logo' ? 'translateY(8px)' : 'translateY(0)',
          transition: 'opacity 0.5s ease, transform 0.5s ease',
        }}
      >
        <div style={{
          fontSize: '28px',
          fontWeight: '700',
          color: '#FFFFFF',
          letterSpacing: '-0.5px',
          lineHeight: 1,
        }}>
          Fabegon <span style={{ color: '#4CAF50' }}>ERP</span>
        </div>
        <div style={{
          fontSize: '13px',
          color: 'rgba(255,255,255,0.45)',
          marginTop: '6px',
          letterSpacing: '2px',
          textTransform: 'uppercase',
          fontWeight: '400',
        }}>
          Enterprise Resource Planning
        </div>
      </div>

      {/* Progress bar */}
      <div
        style={{
          marginTop: '48px',
          width: '200px',
          position: 'relative',
          zIndex: 1,
          opacity: phase === 'logo' || phase === 'text' ? 0 : 1,
          transition: 'opacity 0.4s ease',
        }}
      >
        <div style={{
          height: '2px',
          borderRadius: '2px',
          background: 'rgba(255,255,255,0.08)',
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            borderRadius: '2px',
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #2E7D32, #4CAF50, #F9C42A)',
            transition: 'width 0.05s linear',
            boxShadow: '0 0 8px rgba(76,175,80,0.6)',
          }} />
        </div>
        <div style={{
          textAlign: 'center',
          marginTop: '12px',
          fontSize: '11px',
          color: 'rgba(255,255,255,0.3)',
          letterSpacing: '1px',
          fontFamily: 'JetBrains Mono, monospace',
        }}>
          {Math.round(progress)}%
        </div>
      </div>

      {/* Tagline */}
      <div style={{
        position: 'absolute',
        bottom: '40px',
        fontSize: '11px',
        color: 'rgba(255,255,255,0.2)',
        letterSpacing: '1.5px',
        textTransform: 'uppercase',
        fontWeight: 400,
      }}>
        Powering African Agribusiness
      </div>
    </div>
  )
}
