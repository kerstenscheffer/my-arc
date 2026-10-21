// src/components/ResetPassword.jsx
import { useState, useEffect } from 'react'
import PasswordResetService from '../services/PasswordResetService'

const passwordReset = PasswordResetService

export default function ResetPassword() {

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
    // Een gebruikte of verlopen link komt terug als #error_code=otp_expired.
    // Vaak heeft de mailapp de link al eens geopend (voorvertoning), dus zeg
    // gewoon wat er moet gebeuren.
    const hash = new URLSearchParams(window.location.hash.slice(1))
    if (hash.get('error_code') || hash.get('error')) {
      setMessage({ ok: false, text: 'Deze link is al gebruikt of verlopen. Vraag in de app een nieuwe resetmail aan en open alleen de nieuwste link.' })
      setIsValidToken(false)
      setCheckingToken(false)
      return
    }
    // Nieuwe mailtemplate: de link wijst naar ons eigen domein met
    // ?token_hash=…&type=recovery en de pagina wisselt die hier zelf in.
    // Een link naar *.supabase.co in een 'reset je wachtwoord'-mail lijkt op
    // phishing; Gmail/Outlook namen zulke mails aan maar toonden ze nergens.
    const query = new URLSearchParams(window.location.search)
    const tokenHash = query.get('token_hash')
    if (tokenHash) {
      const { error } = await passwordReset.supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'recovery' })
      // Token uit de adresbalk, zodat verversen niet opnieuw probeert.
      window.history.replaceState(null, '', window.location.pathname)
      if (error) {
        setMessage({ ok: false, text: 'Deze link is al gebruikt of verlopen. Vraag in de app een nieuwe resetmail aan en open alleen de nieuwste link.' })
        setIsValidToken(false)
        setCheckingToken(false)
        return
      }
    }
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
    } else {
      setMessage({ ok: false, text: result.error || 'Kon wachtwoord niet bijwerken' })
    }
    setLoading(false)
  }

  // Strak: zwart met wit, echt MA-logo, drie tekstmaten (24 / 16 / 13).
  const sterkte = !newPassword ? 0 : newPassword.length < 6 ? 1 : newPassword.length < 9 ? 2 : newPassword.length < 12 ? 3 : 4
  const sterkteLabel = ['', 'Te kort', 'Zwak', 'Redelijk', 'Sterk'][sterkte]
  const verschilt = confirmPassword && confirmPassword !== newPassword
  const kanOpslaan = !loading && newPassword && confirmPassword

  const pagina = {
    minHeight: '100vh', background: '#000', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 'calc(env(safe-area-inset-top) + 24px) 16px calc(env(safe-area-inset-bottom) + 24px)',
    boxSizing: 'border-box', fontFamily: 'inherit',
  }
  const kolom = { width: '100%', maxWidth: 380 }
  const titel = { margin: '0 0 8px', fontSize: 24, fontWeight: 900, letterSpacing: '-0.02em', color: '#fff' }
  const tekst = { margin: 0, fontSize: 16, fontWeight: 600, lineHeight: 1.5, color: 'rgba(255,255,255,0.75)' }
  const klein = { fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }
  const knop = {
    width: '100%', minHeight: 52, borderRadius: 12, border: 'none',
    background: '#fff', color: '#000', fontSize: 16, fontWeight: 900,
    fontFamily: 'inherit', cursor: 'pointer',
    touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
  }
  const linkKnop = {
    background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 700,
    fontFamily: 'inherit', cursor: 'pointer', minHeight: 44, padding: '0 12px',
    touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
  }
  const veld = (fout) => ({
    width: '100%', minHeight: 52, padding: '0 64px 0 16px', boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.06)', border: `1.5px solid ${fout ? '#ef4444' : 'rgba(255,255,255,0.15)'}`,
    borderRadius: 12, color: '#fff', fontSize: 16, fontFamily: 'inherit', outline: 'none', WebkitAppearance: 'none',
  })
  const toonKnop = {
    position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)',
    ...linkKnop, minWidth: 56,
  }

  const Logo = () => (
    <img src="/email-logo.png" alt="MY ARC" width={160} height={80}
      style={{ display: 'block', margin: '0 auto 32px', width: 160, height: 80 }} />
  )

  // ── Laden ────────────────────────────────────────────────────────────────────
  if (checkingToken) return (
    <div style={pagina}>
      <div style={{ ...kolom, textAlign: 'center' }}>
        <Logo />
        <div style={{ ...klein, animation: 'resetAdem 1.4s ease-in-out infinite' }}>Link controleren…</div>
      </div>
      <style>{'@keyframes resetAdem { 0%,100% { opacity: .4 } 50% { opacity: 1 } }'}</style>
    </div>
  )

  // ── Gelukt ───────────────────────────────────────────────────────────────────
  if (done) return (
    <div style={pagina}>
      <div style={{ ...kolom, textAlign: 'center' }}>
        <Logo />
        <h1 style={titel}>Wachtwoord opgeslagen</h1>
        <p style={tekst}>Log nu in de MY ARC-app in met je nieuwe wachtwoord.</p>
      </div>
    </div>
  )

  return (
    <div style={pagina}>
      <div style={kolom}>
        <Logo />
        <h1 style={titel}>Nieuw wachtwoord</h1>

        {message && (
          <p style={{ ...tekst, margin: '0 0 20px', color: message.ok ? '#10b981' : '#ef4444', fontWeight: 700 }}>
            {message.text}
          </p>
        )}

        {!isValidToken && (
          <button type="button" style={{ ...knop, marginTop: 8 }} onClick={() => window.location.href = '/'}>
            Terug naar login
          </button>
        )}

        {isValidToken && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: message ? 0 : 20 }}>
            <div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'} placeholder="Nieuw wachtwoord (min. 6 tekens)"
                  value={newPassword} onChange={e => setNewPassword(e.target.value)}
                  style={veld(false)} autoFocus disabled={loading} autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowPw(!showPw)} style={toonKnop}>
                  {showPw ? 'Verberg' : 'Toon'}
                </button>
              </div>
              {newPassword.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
                    {[1, 2, 3, 4].map(l => (
                      <div key={l} style={{ flex: 1, height: 3, borderRadius: 2, background: sterkte >= l ? '#fff' : 'rgba(255,255,255,0.12)' }} />
                    ))}
                  </div>
                  <div style={klein}>{sterkteLabel}</div>
                </div>
              )}
            </div>

            <div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirm ? 'text' : 'password'} placeholder="Herhaal wachtwoord"
                  value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  style={veld(verschilt)} disabled={loading} autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={toonKnop}>
                  {showConfirm ? 'Verberg' : 'Toon'}
                </button>
              </div>
              {verschilt && <div style={{ ...klein, color: '#ef4444', marginTop: 6 }}>Wachtwoorden komen niet overeen</div>}
            </div>

            <button type="submit" disabled={!kanOpslaan} style={{ ...knop, marginTop: 6, opacity: kanOpslaan ? 1 : 0.4, cursor: kanOpslaan ? 'pointer' : 'not-allowed' }}>
              {loading ? 'Opslaan…' : 'Wachtwoord opslaan'}
            </button>
          </form>
        )}

        {isValidToken && (
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <button type="button" style={linkKnop} onClick={() => window.location.href = '/'}>Terug naar login</button>
          </div>
        )}
      </div>
    </div>
  )
}
