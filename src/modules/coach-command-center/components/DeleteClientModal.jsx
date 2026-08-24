// src/modules/coach-command-center/components/DeleteClientModal.jsx
// Definitief verwijderen van een klant-account.
//
// Dit is onomkeerbaar: de clients-rij hangt via ON DELETE CASCADE aan ~90
// tabellen (check-ins, foto's, weeglogs, schema's, betalingen…) en die gaan
// allemaal mee. Daarom eerst tonen wát er verdwijnt, en pas verwijderen als de
// coach de voornaam overtypt — één misklik in een menu mag dit nooit doen.
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, AlertTriangle, Trash2, Loader2 } from 'lucide-react'

const RED = '#ef4444'

export default function DeleteClientModal({ db, client, isMobile, onClose, onDeleted }) {
  const [preview, setPreview] = useState(null)
  const [typed, setTyped] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const naam = (client.first_name || '').trim()

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const { data, error: e } = await db.supabase
          .rpc('client_delete_preview', { p_client_id: client.id })
        if (e) throw e
        if (alive) setPreview(data || {})
      } catch (e) {
        console.error('Preview laden mislukt:', e)
        if (alive) setPreview({})
      }
    })()
    return () => { alive = false }
  }, [db, client.id])

  // Hoofdletterongevoelig, maar de naam moet wel kloppen.
  const mag = typed.trim().toLowerCase() === naam.toLowerCase() && naam.length > 0

  const verwijder = async () => {
    if (!mag || busy) return
    setBusy(true); setError(null)
    try {
      // Gaat via de bestaande RLS-policy "Coaches can delete their clients",
      // dus een coach kan nooit iemand anders zijn klant wissen.
      const { error: e } = await db.supabase.from('clients').delete().eq('id', client.id)
      if (e) throw e
      onDeleted(client.id)
    } catch (e) {
      console.error('Verwijderen mislukt:', e)
      setError(e.message || 'Verwijderen mislukt')
      setBusy(false)
    }
  }

  const regels = preview ? [
    ['Check-ins', preview.checkins],
    ['Weeglogs', preview.weeglogs],
    ["Progressiefoto's", preview.fotos],
    ['Workouts', preview.workouts],
    ["Schema's", preview.schemas],
    ['Betalingen', preview.betalingen],
    ['Calls', preview.calls],
  ].filter(([, n]) => (n || 0) > 0) : []

  return createPortal(
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 13000, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', padding: isMobile ? 0 : '1.5rem' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 440, maxHeight: isMobile ? '90vh' : '85vh', overflowY: 'auto', background: '#0d0d0f', border: `1px solid ${RED}44`, borderRadius: isMobile ? '16px 16px 0 0' : 16, padding: isMobile ? '1.1rem 1rem 1.6rem' : '1.4rem' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1rem' }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(239,68,68,0.12)', border: `1px solid ${RED}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <AlertTriangle size={17} color={RED} />
          </div>
          <div style={{ flex: 1, minWidth: 0, fontSize: '1rem', fontWeight: 800, color: '#fff' }}>Klant verwijderen</div>
          <button onClick={onClose} style={{ flexShrink: 0, width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)', lineHeight: 1.5, marginBottom: '0.9rem' }}>
          Je staat op het punt <strong style={{ color: '#fff' }}>{preview?.naam || naam}</strong> permanent te verwijderen.
          {preview?.email && <span style={{ color: 'rgba(255,255,255,0.45)' }}> ({preview.email})</span>}
        </div>

        {preview === null ? (
          <div style={{ padding: '1rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>Gegevens tellen…</div>
        ) : (
          <div style={{ padding: '0.75rem 0.85rem', borderRadius: 10, background: 'rgba(239,68,68,0.06)', border: `1px solid ${RED}33`, marginBottom: '0.9rem' }}>
            {regels.length === 0 ? (
              <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)' }}>Deze klant heeft nog geen gegevens opgebouwd.</div>
            ) : (
              <>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: RED, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                  Dit gaat mee en komt niet terug
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem 0.9rem' }}>
                  {regels.map(([label, n]) => (
                    <span key={label} style={{ fontSize: '0.76rem', color: 'rgba(255,255,255,0.75)' }}>
                      <strong style={{ color: '#fff' }}>{n}</strong> {label.toLowerCase()}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* De login blijft bestaan — die zit in auth.users en kunnen we hier niet
            weghalen. Zeggen we expliciet, anders lijkt het account "weg". */}
        {preview?.heeft_login && (
          <div style={{ padding: '0.6rem 0.8rem', borderRadius: 9, background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.35)', fontSize: '0.74rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.45, marginBottom: '0.9rem' }}>
            Het inlogaccount zelf blijft bestaan — verwijderen kan alleen in Supabase.
            Deze persoon kan straks dus nog inloggen, maar ziet geen gegevens meer.
          </div>
        )}

        <div style={{ marginBottom: '0.9rem' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.55)', marginBottom: 5 }}>
            Typ <strong style={{ color: '#fff' }}>{naam}</strong> om te bevestigen
          </div>
          <input value={typed} onChange={e => setTyped(e.target.value)} placeholder={naam} autoFocus
            style={{ width: '100%', padding: '0.6rem 0.7rem', borderRadius: 9, background: 'rgba(255,255,255,0.04)', border: `1px solid ${mag ? RED : 'rgba(255,255,255,0.1)'}`, color: '#fff', fontSize: '0.85rem', fontFamily: 'inherit', boxSizing: 'border-box' }} />
        </div>

        {error && (
          <div style={{ padding: '0.6rem 0.8rem', borderRadius: 9, background: 'rgba(239,68,68,0.08)', border: `1px solid ${RED}44`, color: RED, fontSize: '0.75rem', marginBottom: '0.8rem' }}>{error}</div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '0.7rem', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}>
            Annuleren
          </button>
          <button onClick={verwijder} disabled={!mag || busy}
            style={{ flex: 2, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '0.7rem', borderRadius: 10, background: mag ? RED : 'rgba(255,255,255,0.06)', border: 'none', color: mag ? '#fff' : 'rgba(255,255,255,0.3)', fontSize: '0.82rem', fontWeight: 800, cursor: !mag || busy ? 'not-allowed' : 'pointer' }}>
            {busy ? <Loader2 size={14} /> : <Trash2 size={14} />} {busy ? 'Verwijderen…' : 'Definitief verwijderen'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
