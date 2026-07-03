// Quick switch between coach- and client-portal. Stores credentials of the
// OTHER account in BOTH localStorage (snel, offline) en Supabase
// user_metadata (cross-device sync). Eerste klik op desktop slaat 'em op
// → mobiel pakt 'm automatisch op na inloggen op hetzelfde account.

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Repeat, X } from 'lucide-react'

const STORAGE_KEY = 'portalSwitchCreds'

const readLocal = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') }
  catch { return {} }
}
const writeLocal = (next) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
}

// Cross-device sync via Supabase user_metadata. Alleen leesbaar / schrijfbaar
// voor de eigenaar van het account (auth.user). Inhoud van het ANDERE
// account z'n credentials staat opgeslagen op het HUIDIGE account z'n
// metadata — dus alleen toegankelijk als je als die user inlogt.
const readRemote = async (db) => {
  try {
    const { data, error } = await db.supabase.auth.getUser()
    if (error || !data?.user) return null
    return data.user.user_metadata?.portal_switch_creds || null
  } catch { return null }
}
const writeRemote = async (db, store) => {
  try {
    await db.supabase.auth.updateUser({ data: { portal_switch_creds: store } })
  } catch (e) {
    console.warn('writeRemote portalSwitch failed:', e)
  }
}

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

  // Bij mount: tweerichtings-sync tussen localStorage en user_metadata.
  // - Remote heeft creds, local niet → kopieer naar local (mobiel pickt
  //   ze op zonder re-entry).
  // - Local heeft creds, remote niet → push naar remote (eenmalige
  //   backfill voor accounts die de switch eerder al opgezet hadden vóór
  //   deze cross-device-sync er was).
  // Bij conflict: lokale waarde wint, want die is per definitie recenter
  // ingevoerd door de gebruiker.
  useEffect(() => {
    let cancelled = false
    const hydrate = async () => {
      const remote = await readRemote(db)
      if (cancelled) return
      const local = readLocal()
      const merged = { ...(remote || {}), ...local } // local wint bij conflict
      const localStr = JSON.stringify(local)
      const mergedStr = JSON.stringify(merged)
      const remoteStr = JSON.stringify(remote || {})
      // Local outdated → update.
      if (mergedStr !== localStr) writeLocal(merged)
      // Remote outdated of leeg → push (eenmalige backfill mogelijk).
      if (mergedStr !== remoteStr && Object.keys(merged).length > 0) {
        writeRemote(db, merged).catch(() => {})
      }
    }
    hydrate()
    return () => { cancelled = true }
  }, [db])

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

  const handleClick = async () => {
    let store = readLocal()
    let saved = store[target]
    // Als lokaal niets staat, vraag remote nog één keer expliciet (race-vrij
    // ten opzichte van de hydrate-useEffect).
    if (!saved?.email || !saved?.password) {
      const remote = await readRemote(db)
      if (remote?.[target]?.email && remote[target]?.password) {
        store = { ...remote, ...store }
        writeLocal(store)
        saved = store[target]
      }
    }
    if (saved?.email && saved?.password) {
      performSwitch(saved)
    } else {
      setEmail(''); setPassword(''); setError(null); setShowPrompt(true)
    }
  }

  const handleSavePrompt = async (e) => {
    e?.preventDefault()
    if (!email.trim() || !password) { setError('Vul email en wachtwoord in'); return }
    const creds = { email: email.trim(), password }
    const store = readLocal()
    const nextStore = { ...store, [target]: creds }
    writeLocal(nextStore)
    // Schrijf óók naar user_metadata zodat andere devices van dezelfde user
    // de creds direct hebben na inloggen.
    writeRemote(db, nextStore).catch(() => {})
    setShowPrompt(false)
    await performSwitch(creds)
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
            onSubmit={handleSavePrompt}
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
                {target === 'coach' ? 'Coach-login opslaan' : 'Client-login opslaan'}
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
              Eenmalig opslaan op dit apparaat. Daarna één klik om te wisselen.
              Slaat op in localStorage — alleen op jouw device.
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
              {busy ? 'Wisselen…' : 'Opslaan & wissel'}
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
