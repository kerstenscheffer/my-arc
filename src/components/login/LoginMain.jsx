// src/components/login/LoginMain.jsx
import { useState, useEffect, useRef } from 'react'
import { Capacitor } from '@capacitor/core'
import DatabaseService from '../../services/DatabaseService'
import PasswordResetService from '../../services/PasswordResetService'
import AppleSignInButton from './AppleSignInButton'

const db = DatabaseService
const passwordReset = PasswordResetService
const COACH_ACCESS_PASSWORD = 'MYARC2025'

const SLIDES = [
  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80',
  'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80',
  'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800&q=80',
  'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=800&q=80',
]

export default function LoginMain() {
  const isMobile = window.innerWidth <= 768

  // slideshow
  const [slide, setSlide] = useState(0)
  const timer = useRef(null)
  useEffect(() => {
    timer.current = setInterval(() => setSlide(s => (s + 1) % SLIDES.length), 5000)
    return () => clearInterval(timer.current)
  }, [])

  // mode: 'client' (default) | 'coach-verify' | 'coach'
  const [mode, setMode] = useState('client')

  // form
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // coach verify
  const [coachPw, setCoachPw] = useState('')

  // reset
  const [showReset, setShowReset] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [resetMsg, setResetMsg] = useState(null)

  useEffect(() => {
    const stored = localStorage.getItem('rememberEmail')
    if (stored) { setEmail(stored); setRememberMe(true) }
    checkSession()
    if (window.location.hostname === 'localhost') passwordReset.logSetupInstructions?.()
  }, [])

  const checkSession = async () => {
    const user = await db.getCurrentUser()
    if (user) window.location.href = '/'
  }

  // ── login ──────────────────────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e?.preventDefault()
    if (!email || !password) { setError('Vul je gegevens in'); return }
    setLoading(true); setError(null)
    try {
      const result = await db.signIn(email, password)
      if (result?.user) {
        localStorage.setItem('isClientMode', (mode === 'client').toString())
        if (rememberMe) localStorage.setItem('rememberEmail', email)
        else localStorage.removeItem('rememberEmail')
        window.location.href = '/'
      } else {
        setError('Onjuist email of wachtwoord')
      }
    } catch (err) {
      setError(err.message || 'Er ging iets mis')
    }
    setLoading(false)
  }

  // ── coach verify ──────────────────────────────────────────────────────────
  const handleCoachVerify = (e) => {
    e?.preventDefault()
    if (coachPw === COACH_ACCESS_PASSWORD) {
      setCoachPw(''); setError(null); setMode('coach')
    } else {
      setError('Onjuiste toegangscode')
    }
  }

  // ── reset ─────────────────────────────────────────────────────────────────
  const handleReset = async (e) => {
    e?.preventDefault()
    if (!resetEmail) { setResetMsg({ ok: false, text: 'Vul je email in' }); return }
    setResetLoading(true); setResetMsg(null)
    const result = await passwordReset.sendResetEmail(resetEmail)
    setResetMsg({ ok: result.success, text: result.success ? result.message : result.error })
    if (result.success) setTimeout(() => { setShowReset(false); setResetEmail(''); setResetMsg(null) }, 3000)
    setResetLoading(false)
  }

  // ── shared input style ────────────────────────────────────────────────────
  const inp = {
    width: '100%',
    padding: '0.875rem 1rem',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '10px',
    color: '#fff',
    fontSize: '1rem',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    WebkitAppearance: 'none',
    transition: 'border-color 0.2s',
  }

  // ── COACH VERIFY SCREEN ───────────────────────────────────────────────────
  if (mode === 'coach-verify') return (
    <Wrapper slide={slide}>
      <div style={{ width: '100%', maxWidth: '340px' }}>
        <button onClick={() => { setMode('client'); setError(null); setCoachPw('') }}
          style={backBtn}>← Terug</button>

        <div style={labelStyle}>COACH TOEGANG</div>
        <h1 style={headingStyle}>Verificatie</h1>

        {error && <ErrorBox>{error}</ErrorBox>}

        <form onSubmit={handleCoachVerify} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <input type="password" placeholder="Toegangscode" value={coachPw}
            onChange={e => setCoachPw(e.target.value)} style={inp} autoFocus
            onFocus={e => e.target.style.borderColor = '#ffffff'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'} />
          <GoldButton type="submit">Verifieer</GoldButton>
        </form>
      </div>
    </Wrapper>
  )

  // ── MAIN LOGIN (client + coach after verify) ──────────────────────────────
  return (
    <Wrapper slide={slide}>
      <div style={{ width: '100%', maxWidth: '340px' }}>

        {/* Logo — nieuwe MY ARC coaching-logo */}
        <div style={{ textAlign: 'center', marginBottom: '2.25rem' }}>
          <img
            src="/ma-coaching-logo.png"
            alt="MY ARC Coaching"
            style={{ maxWidth: '230px', width: '100%', height: 'auto', margin: '0 auto', display: 'block' }}
          />
        </div>

        {/* Mode label */}
        <div style={labelStyle}>
          {mode === 'coach' ? 'COACH PORTAL' : 'INLOGGEN'}
        </div>
        <h1 style={{ ...headingStyle, marginBottom: '1.75rem' }}>Welkom terug</h1>

        {error && <ErrorBox>{error}</ErrorBox>}

        {/* Form */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
            style={inp} autoComplete="email" autoCapitalize="none"
            onFocus={e => e.target.style.borderColor = '#ffffff'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'} />

          <div style={{ position: 'relative' }}>
            <input type={showPw ? 'text' : 'password'} placeholder="Wachtwoord" value={password}
              onChange={e => setPassword(e.target.value)} style={{ ...inp, paddingRight: '3.5rem' }}
              autoComplete="current-password"
              onFocus={e => e.target.style.borderColor = '#ffffff'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'} />
            <button type="button" onClick={() => setShowPw(!showPw)} style={{
              position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', color: 'rgba(255,255,255,0.25)',
              fontSize: '0.6rem', fontWeight: '700', letterSpacing: '0.06em',
              cursor: 'pointer', padding: 0,
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            }}>
              {showPw ? 'HIDE' : 'SHOW'}
            </button>
          </div>

          {/* Remember + Forgot */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <div onClick={() => setRememberMe(!rememberMe)} style={{
                width: '17px', height: '17px', flexShrink: 0, borderRadius: '4px',
                background: rememberMe ? '#ffffff' : 'transparent',
                border: `1px solid ${rememberMe ? '#ffffff' : 'rgba(255,255,255,0.18)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', transition: 'all 0.2s',
              }}>
                {rememberMe && <span style={{ fontSize: '10px', color: '#000', fontWeight: '900', lineHeight: 1 }}>✓</span>}
              </div>
              <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', userSelect: 'none' }}>Onthoud mij</span>
            </label>
            <button type="button" onClick={() => { setShowReset(true); setResetEmail(email); setResetMsg(null) }}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.28)', fontSize: '0.72rem', cursor: 'pointer', padding: 0, touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
              Wachtwoord vergeten?
            </button>
          </div>

          <GoldButton type="submit" disabled={loading} style={{ marginTop: '0.25rem' }}>
            {loading ? 'Inloggen...' : 'Inloggen'}
          </GoldButton>
        </form>

        {/* Apple Sign-In (only renders on iOS native) */}
        {Capacitor.isNativePlatform() && (
          <div style={{ marginTop: '1.25rem' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.625rem',
              marginBottom: '0.875rem',
            }}>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
              <span style={{
                fontSize: '0.6rem', fontWeight: '700',
                color: 'rgba(255,255,255,0.25)',
                letterSpacing: '0.12em', textTransform: 'uppercase',
              }}>
                of
              </span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
            </div>
            <AppleSignInButton
              isClientMode={mode === 'client'}
              onError={(msg) => setError(msg)}
            />
          </div>
        )}

        {/* Coach link — alleen zichtbaar op client mode, klein onderaan */}
        {mode === 'client' && (
          <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
            <button onClick={() => { setMode('coach-verify'); setError(null) }} style={{
              background: 'none', border: 'none',
              color: 'rgba(255,255,255,0.18)',
              fontSize: '0.68rem', fontWeight: '600',
              letterSpacing: '0.08em', textTransform: 'uppercase',
              cursor: 'pointer', padding: '0.5rem 1rem', minHeight: '44px',
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            }}>
              Coach toegang
            </button>
          </div>
        )}

        {mode === 'coach' && (
          <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <button onClick={() => { setMode('client'); setError(null) }} style={{
              background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)',
              fontSize: '0.72rem', cursor: 'pointer', padding: '0.5rem',
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            }}>
              ← Terug naar client login
            </button>
          </div>
        )}
      </div>

      {/* Password Reset Modal */}
      {showReset && (
        <div onClick={() => setShowReset(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 200, padding: '1.5rem',
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px', padding: '1.75rem',
            width: '100%', maxWidth: '340px',
          }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#fff', margin: '0 0 0.3rem' }}>Wachtwoord resetten</h3>
            <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', margin: '0 0 1.25rem' }}>
              Je ontvangt een email met een resetlink.
            </p>
            {resetMsg && (
              <div style={{
                padding: '0.75rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '600', marginBottom: '1rem',
                background: resetMsg.ok ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                border: `1px solid ${resetMsg.ok ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
                color: resetMsg.ok ? '#10b981' : '#ef4444',
              }}>
                {resetMsg.text}
              </div>
            )}
            <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <input type="email" placeholder="Email adres" value={resetEmail}
                onChange={e => setResetEmail(e.target.value)} style={inp} autoFocus
                onFocus={e => e.target.style.borderColor = '#ffffff'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'} />
              <GoldButton type="submit" disabled={resetLoading}>
                {resetLoading ? 'Versturen...' : 'Reset sturen'}
              </GoldButton>
              <button type="button" onClick={() => setShowReset(false)} style={{
                background: 'none', border: 'none', color: 'rgba(255,255,255,0.25)',
                fontSize: '0.78rem', cursor: 'pointer', padding: '0.25rem',
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              }}>
                Annuleren
              </button>
            </form>
          </div>
        </div>
      )}
    </Wrapper>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Wrapper({ children, slide }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#000',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)',
      paddingLeft: 'env(safe-area-inset-left)', paddingRight: 'env(safe-area-inset-right)',
      overflow: 'hidden',
    }}>
      {/* Slideshow */}
      {[
        'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80',
        'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80',
        'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800&q=80',
        'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=800&q=80',
      ].map((src, i) => (
        <div key={i} style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${src})`, backgroundSize: 'cover', backgroundPosition: 'center',
          opacity: i === slide ? 0.1 : 0, transition: 'opacity 1.8s ease', zIndex: 0,
        }} />
      ))}
      {/* Dark gradient */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.75) 50%, rgba(0,0,0,0.97) 100%)',
      }} />
      {/* Content */}
      <div style={{ position: 'relative', zIndex: 10, width: '100%', padding: '2rem 1.5rem', display: 'flex', justifyContent: 'center' }}>
        {children}
      </div>
    </div>
  )
}

function GoldButton({ children, disabled, style, ...props }) {
  return (
    <button disabled={disabled} style={{
      width: '100%', padding: '0.9rem', minHeight: '48px',
      background: disabled ? 'rgba(255,215,0,0.45)' : '#FFD700',
      border: 'none', borderRadius: '10px',
      color: '#000', fontSize: '0.95rem', fontWeight: '800',
      cursor: disabled ? 'not-allowed' : 'pointer',
      letterSpacing: '0.02em',
      touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
      transition: 'opacity 0.15s',
      ...style,
    }} {...props}>
      {children}
    </button>
  )
}

function ErrorBox({ children }) {
  return (
    <div style={{
      padding: '0.75rem 1rem', marginBottom: '1rem',
      background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
      borderRadius: '8px', color: '#ef4444', fontSize: '0.8rem', fontWeight: '600',
    }}>
      {children}
    </div>
  )
}

const labelStyle = {
  fontSize: '0.5rem', fontWeight: '700', color: 'rgba(255,255,255,0.5)',
  letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: '0.35rem',
}

const headingStyle = {
  fontSize: '1.75rem', fontWeight: '900', color: '#fff',
  margin: 0, letterSpacing: '-0.02em', lineHeight: 1.1,
}

const backBtn = {
  background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)',
  fontSize: '0.78rem', cursor: 'pointer', padding: '0 0 1.75rem',
  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
  display: 'flex', alignItems: 'center', gap: '0.3rem',
}
