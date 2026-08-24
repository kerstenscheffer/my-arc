// Wisselen tussen het coach- en het client-portaal.
//
// LET OP — hier heeft een lek gezeten. Deze knop bewaarde de inloggegevens van
// het andere account (inclusief wachtwoord, in platte tekst) in localStorage
// én in Supabase `user_metadata`. Omdat user_metadata leesbaar is voor de
// eigenaar van dat account, kon elke klant op wiens account die creds ooit
// waren weggeschreven het coach-wachtwoord uitlezen én met één tik als de
// coach inloggen. Er wordt daarom NIETS meer opgeslagen: elke wissel vraagt
// opnieuw om inloggegevens. De autoComplete-velden zorgen dat de
// wachtwoordmanager van het device het invulwerk doet.
//
// Deze knop hoort alleen in CoachHub. Zet 'm nooit in de client-UI.

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Repeat, X } from 'lucide-react'

export default function PortalSwitchButton({
  target,        // 'coach' | 'client'
  db,
  style,
  iconOnly = false,
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const label = target === 'coach' ? 'Wissel naar coach' : 'Wissel naar client'

  const performSwitch = async (creds) => {
    setBusy(true); setError(null)
    try {
      try { await db.signOut() } catch { /* ignore — we'll still try signIn */ }
      const result = await db.signIn(creds.email, creds.password)
      if (result?.error || !result?.user) {
        throw new Error(result?.error || 'Inloggen mislukt — controleer je gegevens')
      }
      localStorage.setItem('isClientMode', target === 'client' ? 'true' : 'false')
      window.location.href = '/'
    } catch (err) {
      setError(err.message || 'Wissel mislukt')
      setBusy(false)
    }
  }

  const handleClick = () => {
    setEmail(''); setPassword(''); setError(null); setShowPrompt(true)
  }

  const handleSubmitPrompt = async (e) => {
    e?.preventDefault()
    if (!email.trim() || !password) { setError('Vul email en wachtwoord in'); return }
    setShowPrompt(false)
    await performSwitch({ email: email.trim(), password })
  }

  return (
    <>
      <button
        onClick={handleClick}
        disabled={busy}
        title={label}
        style={{
          display: 'flex', alignItems: 'center', gap: iconOnly ? 0 : '0.4rem',
          padding: iconOnly ? 0 : '0.5rem 0.75rem',
          width: iconOnly ? 36 : 'auto',
          height: iconOnly ? 36 : 'auto',
          justifyContent: 'center',
          background: 'rgba(59,130,246,0.08)',
          border: '1px solid rgba(59,130,246,0.2)',
          borderRadius: '8px',
          color: '#60a5fa',
          fontSize: '0.8rem', fontWeight: 600,
          cursor: busy ? 'wait' : 'pointer',
          opacity: busy ? 0.6 : 1,
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
          ...style,
        }}
      >
        <Repeat size={15} />
        {!iconOnly && (busy ? 'Wisselen…' : label)}
      </button>

      {showPrompt && createPortal(
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setShowPrompt(false) }}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 2147483600, padding: '1rem',
          }}
        >
          <form
            onSubmit={handleSubmitPrompt}
            style={{
              width: '100%', maxWidth: 380,
              background: '#0a0a0a',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12, padding: '1.25rem',
              display: 'flex', flexDirection: 'column', gap: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: '#fff', fontSize: '1rem', fontWeight: 800 }}>
                {target === 'coach' ? 'Inloggen als coach' : 'Inloggen als client'}
              </h3>
              <button type="button" onClick={() => setShowPrompt(false)}
                style={{
                  width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'transparent', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 6, color: 'rgba(255,255,255,0.4)', cursor: 'pointer',
                }}>
                <X size={13} />
              </button>
            </div>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', lineHeight: 1.4 }}>
              Je gegevens worden niet opgeslagen — laat je wachtwoordmanager
              ze invullen.
            </p>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={target === 'coach' ? 'coach@email.com' : 'client@email.com'}
              style={inputStyle}
            />
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Wachtwoord"
              style={inputStyle}
            />
            {error && (
              <div style={{ color: '#ef4444', fontSize: '0.75rem' }}>{error}</div>
            )}
            <button type="submit" disabled={busy}
              style={{
                padding: '0.7rem', background: '#10b981', border: 'none',
                borderRadius: 8, color: '#fff', fontWeight: 700, fontSize: '0.85rem',
                cursor: busy ? 'wait' : 'pointer', opacity: busy ? 0.6 : 1,
              }}>
              {busy ? 'Wisselen…' : 'Wissel'}
            </button>
          </form>
        </div>,
        document.body
      )}
    </>
  )
}

const inputStyle = {
  width: '100%', padding: '0.7rem 0.875rem',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 8, color: '#fff', fontSize: '0.85rem',
  outline: 'none',
}
