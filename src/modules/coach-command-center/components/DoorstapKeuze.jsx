// src/modules/coach-command-center/components/DoorstapKeuze.jsx
//
// Doorstap na de week-5 evaluatie: zegt de klant ja (mondeling), denkt hij
// na, nee, of is er betaald. Een mondeling ja werd nergens bewaard; de
// verlenging zelf komt pas als sale binnen via TrajectModal (30 okt 2026).
//
// Tabel client_doorstap: elke wijziging is een nieuwe rij, de laatste telt.
// 'Leeg' is ook een rij (status null), zodat de historie klopt.
// Bestaat de tabel nog niet, dan toont dit component niets.
//
// 'Betaald' boekt zelf niets: de verlenging gaat via de bestaande
// TrajectModal (onBetaald), anders telt de omzet dubbel.

import { useEffect, useRef, useState } from 'react'
import { createPortal } from '../../../client/paginaPortal'
import { useModalHost } from '../../../coach/ModalHost'
import { Flag, Check } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { DOORSTAP_OPTIES, optieVan, tabelOntbreekt, laadDoorstap } from './doorstap'

// waarde: laatste rij (of null = geen status). undefined + zelfLaden = haal zelf op.
export default function DoorstapKeuze({ client, coachId, waarde, zelfLaden = false, onGewijzigd, onBetaald, groot = false }) {
  const host = useModalHost()
  const knopRef = useRef(null)
  const [eigen, setEigen] = useState(undefined)
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState(null)
  const [keuze, setKeuze] = useState(null)
  const [notitie, setNotitie] = useState('')
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState(null)

  useEffect(() => {
    if (!zelfLaden || !client?.id) return
    let weg = false
    laadDoorstap([client.id]).then(m => { if (!weg) setEigen(m ? (m[client.id] || null) : undefined) })
    return () => { weg = true }
  }, [zelfLaden, client?.id])

  const huidig = zelfLaden ? eigen : waarde
  if (huidig === undefined || !client?.id) return null
  const opt = optieVan(huidig?.status)

  const openen = (e) => {
    e.stopPropagation()
    const r = knopRef.current?.getBoundingClientRect()
    if (!r) return
    // Zelfde omrekening als het ⋯-menu op de kaart: in split screen rekent
    // position:fixed tegen de helft, niet tegen het scherm.
    const h = (host && host !== document.body) ? host.getBoundingClientRect() : null
    const breedte = h ? h.width : window.innerWidth
    const hoogte = h ? h.height : window.innerHeight
    const dx = h ? h.left : 0
    const dy = h ? h.top : 0
    const onder = (r.bottom - dy) + 6
    setPos(onder + 300 > hoogte
      ? { bottom: hoogte - (r.top - dy) + 6, right: Math.max(8, breedte - (r.right - dx)) }
      : { top: onder, right: Math.max(8, breedte - (r.right - dx)) })
    setKeuze(huidig?.status || null)
    setNotitie(huidig?.notitie || '')
    setFout(null)
    setOpen(true)
  }

  const opslaan = async () => {
    setBezig(true); setFout(null)
    const rij = {
      client_id: client.id,
      coach_id: client.coach_id || coachId,
      status: keuze,
      notitie: notitie.trim() || null,
      gezet_door: coachId || null,
    }
    const { data, error } = await supabase.from('client_doorstap').insert(rij)
      .select('id, client_id, status, pakket, notitie, gezet_at').single()
      .then(r => r, e => ({ data: null, error: e }))
    setBezig(false)
    if (error) { setFout(tabelOntbreekt(error) ? 'Tabel client_doorstap bestaat nog niet' : (error.message || 'Opslaan mislukt')); return }
    if (zelfLaden) setEigen(data)
    onGewijzigd?.(data)
    setOpen(false)
  }

  const gezet = !!huidig?.status
  const titel = gezet
    ? `Doorstap: ${opt.label}${huidig.notitie ? ` — ${huidig.notitie}` : ''}`
    : 'Doorstap na de evaluatie vastleggen'

  return (
    <>
      <button ref={knopRef} onClick={openen} title={titel} aria-label="Doorstap"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0,
          height: groot ? 32 : 26, padding: gezet ? '0 0.5rem' : '0 0.25rem',
          background: gezet ? `${opt.kleur}1f` : 'none',
          border: gezet ? `1px solid ${opt.kleur}55` : 'none', borderRadius: 999,
          color: gezet ? opt.kleur : 'rgba(255,255,255,0.35)',
          fontSize: groot ? '0.72rem' : '0.66rem', fontWeight: 900, whiteSpace: 'nowrap',
          cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
        }}>
        {gezet ? opt.kort : <Flag size={groot ? 17 : 15} />}
      </button>

      {open && pos && createPortal(
        <>
          <div onClick={(e) => { e.stopPropagation(); setOpen(false) }}
            style={{ position: 'fixed', inset: 0, zIndex: 2147483600 }} />
          <div onClick={(e) => e.stopPropagation()} style={{
            position: 'fixed', ...pos, zIndex: 2147483601, width: 240,
            background: '#111', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12,
            boxShadow: '0 16px 40px rgba(0,0,0,0.6)', padding: '0.5rem',
          }}>
            <div style={{ padding: '0.2rem 0.4rem 0.4rem', fontSize: '0.8rem', fontWeight: 900, color: '#fff' }}>
              Doorstap
            </div>
            {DOORSTAP_OPTIES.map(o => {
              const actief = keuze === o.id
              return (
                <button key={o.id || 'leeg'} onClick={() => setKeuze(o.id)} style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                  padding: '0.5rem 0.45rem', background: actief ? 'rgba(255,255,255,0.06)' : 'transparent',
                  border: 'none', borderRadius: 8, cursor: 'pointer', textAlign: 'left',
                  color: '#fff', fontSize: '0.82rem', fontWeight: 800,
                  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: o.id ? o.kleur : 'transparent', border: o.id ? 'none' : '1px dashed rgba(255,255,255,0.4)', flexShrink: 0 }} />
                  <span style={{ flex: 1 }}>{o.label}</span>
                  {actief && <Check size={14} color="#10b981" strokeWidth={3} />}
                </button>
              )
            })}

            {keuze === 'betaald' && onBetaald && (
              <div style={{ margin: '0.35rem 0.2rem 0', fontSize: '0.7rem', fontWeight: 600, color: 'rgba(255,255,255,0.55)', lineHeight: 1.4 }}>
                De betaling zelf boek je als verlenging, niet hier.{' '}
                <button onClick={() => { setOpen(false); onBetaald() }} style={{
                  background: 'none', border: 'none', padding: 0, color: '#10b981',
                  fontSize: '0.7rem', fontWeight: 900, cursor: 'pointer',
                }}>Verlenging boeken →</button>
              </div>
            )}

            <textarea value={notitie} onChange={(e) => setNotitie(e.target.value)}
              placeholder="Notitie (optioneel)" rows={2}
              style={{
                width: '100%', boxSizing: 'border-box', marginTop: '0.45rem', resize: 'none',
                background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8,
                color: '#fff', fontSize: '0.78rem', fontWeight: 600, padding: '0.45rem 0.5rem',
                fontFamily: 'inherit', outline: 'none',
              }} />
            {fout && <div style={{ marginTop: 4, fontSize: '0.68rem', fontWeight: 700, color: '#ef4444' }}>{fout}</div>}
            <button onClick={opslaan} disabled={bezig} style={{
              width: '100%', marginTop: '0.45rem', padding: '0.55rem', borderRadius: 8,
              background: '#fff', border: 'none', color: '#000', fontSize: '0.8rem', fontWeight: 900,
              cursor: bezig ? 'wait' : 'pointer', opacity: bezig ? 0.6 : 1,
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            }}>{bezig ? 'Opslaan…' : 'Opslaan'}</button>
          </div>
        </>,
        host || document.body
      )}
    </>
  )
}
