// Wisselknop tussen Kerstens coach- en klantaccount. Regels en beveiliging: src/accountWissel.js.
// Rendert niets voor elk ander account.

import { useEffect, useState } from 'react'
import { Repeat, X } from 'lucide-react'
import { createPortal } from '../client/paginaPortal'
import { supabase } from '../lib/supabase'
import { EIGEN_ACCOUNTS, anderAccount, wissel, koppelEnWissel } from '../accountWissel'

export default function AccountWisselKnop({ style }) {
  const [doelId, setDoelId] = useState(null)
  const [bezig, setBezig] = useState(false)
  const [vraag, setVraag] = useState(false)
  const [email, setEmail] = useState('')
  const [wachtwoord, setWachtwoord] = useState('')
  const [fout, setFout] = useState(null)

  useEffect(() => {
    let weg = false
    supabase.auth.getSession().then(({ data }) => { if (!weg) setDoelId(anderAccount(data?.session?.user?.id)) }, () => {})
    return () => { weg = true }
  }, [])

  if (!doelId) return null
  const doel = EIGEN_ACCOUNTS[doelId]
  const label = doel.rol === 'coach' ? 'Wissel naar coach' : 'Wissel naar klant'

  const klik = async () => {
    setBezig(true); setFout(null)
    const uit = await wissel()
    if (uit === 'inloggen') { setEmail(doel.email); setWachtwoord(''); setVraag(true) }
    if (uit !== 'ok') setBezig(false)
  }

  const verstuur = async (e) => {
    e.preventDefault()
    if (!wachtwoord) { setFout('Vul je wachtwoord in'); return }
    setBezig(true); setFout(null)
    const uit = await koppelEnWissel(email, wachtwoord)
    if (uit.fout) { setFout(uit.fout); setBezig(false) }
  }

  return (
    <>
      <button onClick={klik} disabled={bezig} title={label} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
        padding: '0.6rem 0.75rem', minHeight: 44,
        background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)',
        borderRadius: 10, color: '#10b981', fontSize: '0.8rem', fontWeight: 800,
        cursor: bezig ? 'wait' : 'pointer', opacity: bezig ? 0.6 : 1, fontFamily: 'inherit',
        touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
        ...style,
      }}>
        <Repeat size={15} />
        {bezig ? 'Wisselen…' : label}
      </button>

      {vraag && createPortal(
        <div onClick={(e) => { if (e.target === e.currentTarget && !bezig) setVraag(false) }} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 2147483647,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
        }}>
          <form onSubmit={verstuur} style={{
            width: '100%', maxWidth: 380, background: '#0a0a0a', border: '2px solid rgba(255,255,255,0.9)',
            borderRadius: 16, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: '#fff', fontSize: '1rem', fontWeight: 800 }}>Eenmalig koppelen</h3>
              <button type="button" onClick={() => setVraag(false)} disabled={bezig} style={{
                width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8,
                color: 'rgba(255,255,255,0.6)', cursor: 'pointer',
              }}><X size={14} /></button>
            </div>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.55)', fontSize: '0.78rem', lineHeight: 1.45 }}>
              Log één keer in op dit toestel. Daarna wissel je met één tik. Je wachtwoord wordt niet bewaard.
            </p>
            <input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} style={veld} />
            <input type="password" autoComplete="current-password" autoFocus value={wachtwoord}
              onChange={(e) => setWachtwoord(e.target.value)} placeholder="Wachtwoord" style={veld} />
            {fout && <div style={{ color: '#ef4444', fontSize: '0.78rem' }}>{fout}</div>}
            <button type="submit" disabled={bezig} style={{
              padding: '0.75rem', background: '#10b981', border: 'none', borderRadius: 10, color: '#fff',
              fontWeight: 800, fontSize: '0.85rem', cursor: bezig ? 'wait' : 'pointer', opacity: bezig ? 0.6 : 1,
            }}>{bezig ? 'Wisselen…' : 'Inloggen en wisselen'}</button>
          </form>
        </div>,
        document.body,
      )}
    </>
  )
}

const veld = {
  width: '100%', padding: '0.75rem 0.875rem', background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, color: '#fff', fontSize: '16px', outline: 'none',
  boxSizing: 'border-box',
}
