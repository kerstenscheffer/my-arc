// src/components/ResetPassword.jsx
import { useState, useEffect } from 'react'
import PasswordResetService from '../services/PasswordResetService'

const passwordReset = PasswordResetService

export default function ResetPassword() {
  const isMobile = window.innerWidth <= 768

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [isValidToken, setIsValidToken] = useState(false)
  const [checkingToken, setCheckingToken] = useState(true)
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => { checkResetToken() }, [])

  const checkResetToken = async () => {
    try {
      const result = await passwordReset.verifyResetToken()
      setIsValidToken(result.valid)
      if (!result.valid) {
        setMessage({ ok: false, text: result.error || 'Ongeldige of verlopen resetlink. Vraag een nieuwe aan.' })
      }
    } catch {
      setMessage({ ok: false, text: 'Kan resetlink niet verifiëren.' })
      setIsValidToken(false)
    }
    setCheckingToken(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage(null)
    if (newPassword !== confirmPassword) { setMessage({ ok: false, text: 'Wachtwoorden komen niet overeen' }); return }
    if (newPassword.length < 6) { setMessage({ ok: false, text: 'Wachtwoord moet minimaal 6 tekens bevatten' }); return }
    setLoading(true)
    const result = await passwordReset.updatePassword(newPassword)
    if (result.success) {
      setDone(true)
      setTimeout(() => window.location.href = '/', 2500)
    } else {
      setMessage({ ok: false, text: result.error || 'Kon wachtwoord niet bijwerken' })
    }
    setLoading(false)
  }

  // Wachtwoord sterkte
  const strength = !newPassword ? 0 : newPassword.length < 6 ? 1 : newPassword.length < 9 ? 2 : newPassword.length < 12 ? 3 : 4
  const strengthColor = ['transparent', '#ef4444', '#f59e0b', '#FFD700', '#10b981'][strength]
  const strengthLabel = ['', 'Te kort', 'Zwak', 'Redelijk', 'Sterk'][strength]

  const inp = {
    width: '100%',
    padding: '0.875rem 1rem',
    background: 'rgba(255,255,255,0.04)',
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

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (checkingToken) return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: '36px', height: '36px', margin: '0 auto 1rem',
          border: '2px solid rgba(255,215,0,0.15)',
          borderTopColor: '#FFD700',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Verifiëren...
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  // ── Success ──────────────────────────────────────────────────────────────────
  if (done) return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ textAlign: 'center', maxWidth: '320px' }}>
        <div style={{
          width: '52px', height: '52px', margin: '0 auto 1.25rem',
          background: '#FFD700', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: '1.4rem', color: '#000', fontWeight: '900', lineHeight: 1 }}>✓</span>
        </div>
        <div style={{ fontSize: '0.5rem', fontWeight: '700', color: 'rgba(255,215,0,0.5)', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
          Gelukt
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#fff', margin: '0 0 0.5rem', letterSpacing: '-0.02em' }}>
          Wachtwoord bijgewerkt
        </h2>
        <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.3)', margin: 0 }}>
          Je wordt doorgestuurd naar de login...
        </p>
      </div>
    </div>
  )

  return (
    <div style={{
      minHeight: '100vh',
      background: '#000',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: isMobile ? '1.5rem' : '2rem',
      paddingTop: 'env(safe-area-inset-top)',
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      <div style={{ width: '100%', maxWidth: '360px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem', marginBottom: '0.3rem' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
            <span style={{ fontSize: '1.6rem', fontWeight: '900', color: '#FFD700', letterSpacing: '-0.01em', lineHeight: 1 }}>
              MY ARC
            </span>
          </div>
          <div style={{ fontSize: '0.5rem', fontWeight: '700', color: 'rgba(255,215,0,0.35)', letterSpacing: '0.28em', textTransform: 'uppercase' }}>
            JOUW TRAINING PLATFORM
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '12px',
          padding: isMobile ? '1.75rem' : '2rem',
        }}>
          <div style={{ marginBottom: '1.75rem' }}>
            <div style={{ fontSize: '0.5rem', fontWeight: '700', color: 'rgba(255,215,0,0.5)', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
              Beveiliging
            </div>
            <h1 style={{ fontSize: isMobile ? '1.5rem' : '1.6rem', fontWeight: '900', color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>
              Nieuw wachtwoord
            </h1>
          </div>

          {/* Message */}
          {message && (
            <div style={{
              padding: '0.75rem 1rem', marginBottom: '1.25rem', borderRadius: '8px',
              background: message.ok ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
              border: `1px solid ${message.ok ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
              color: message.ok ? '#10b981' : '#ef4444',
              fontSize: '0.8rem', fontWeight: '600',
            }}>
              {message.text}
            </div>
          )}

          {/* Invalid token state */}
          {!isValidToken && (
            <button
              onClick={() => window.location.href = '/'}
              style={{
                width: '100%', padding: '0.9rem', minHeight: '48px',
                background: '#FFD700', border: 'none', borderRadius: '10px',
                color: '#000', fontSize: '0.95rem', fontWeight: '800',
                cursor: 'pointer', touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              Terug naar login
            </button>
          )}

          {/* Valid token — show form */}
          {isValidToken && (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

              {/* Nieuw wachtwoord */}
              <div>
                <div style={{ fontSize: '0.6rem', fontWeight: '700', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                  Nieuw wachtwoord
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPw ? 'text' : 'password'}
                    placeholder="Minimaal 6 tekens"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    style={{ ...inp, paddingRight: '3.5rem' }}
                    autoFocus disabled={loading}
                    onFocus={e => e.target.style.borderColor = '#FFD700'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                  />
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

                {/* Strength bar */}
                {newPassword.length > 0 && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <div style={{ display: 'flex', gap: '3px', marginBottom: '0.25rem' }}>
                      {[1,2,3,4].map(l => (
                        <div key={l} style={{
                          flex: 1, height: '3px', borderRadius: '2px',
                          background: strength >= l ? strengthColor : 'rgba(255,255,255,0.08)',
                          transition: 'background 0.3s',
                        }} />
                      ))}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: strengthColor, fontWeight: '700' }}>
                      {strengthLabel}
                    </div>
                  </div>
                )}
              </div>

              {/* Bevestig wachtwoord */}
              <div>
                <div style={{ fontSize: '0.6rem', fontWeight: '700', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                  Bevestig wachtwoord
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Herhaal wachtwoord"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    style={{
                      ...inp,
                      paddingRight: '3.5rem',
                      borderColor: confirmPassword && confirmPassword !== newPassword
                        ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.08)',
                    }}
                    disabled={loading}
                    onFocus={e => e.target.style.borderColor = '#FFD700'}
                    onBlur={e => e.target.style.borderColor = confirmPassword && confirmPassword !== newPassword
                      ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.08)'}
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={{
                    position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: 'rgba(255,255,255,0.25)',
                    fontSize: '0.6rem', fontWeight: '700', letterSpacing: '0.06em',
                    cursor: 'pointer', padding: 0,
                    touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                  }}>
                    {showConfirm ? 'HIDE' : 'SHOW'}
                  </button>
                </div>
                {confirmPassword && confirmPassword !== newPassword && (
                  <div style={{ fontSize: '0.65rem', color: '#ef4444', fontWeight: '700', marginTop: '0.3rem' }}>
                    Wachtwoorden komen niet overeen
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !newPassword || !confirmPassword}
                style={{
                  width: '100%', padding: '0.9rem', minHeight: '48px', marginTop: '0.25rem',
                  background: loading || !newPassword || !confirmPassword ? 'rgba(255,215,0,0.4)' : '#FFD700',
                  border: 'none', borderRadius: '10px',
                  color: '#000', fontSize: '0.95rem', fontWeight: '800',
                  cursor: loading || !newPassword || !confirmPassword ? 'not-allowed' : 'pointer',
                  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                  transition: 'opacity 0.15s', letterSpacing: '0.02em',
                }}
              >
                {loading ? 'Bijwerken...' : 'Wachtwoord opslaan'}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <button
            onClick={() => window.location.href = '/'}
            style={{
              background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)',
              fontSize: '0.72rem', cursor: 'pointer', padding: '0.5rem',
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            }}
          >
            Terug naar login
          </button>
        </div>

      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
