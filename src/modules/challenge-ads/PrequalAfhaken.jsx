// src/modules/challenge-ads/PrequalAfhaken.jsx
//
// Afhaken per vraag van de prekwalificatie (/challenge/start), en wie zijn
// nummer gaf maar niet afmaakte (17 okt 2026).
//
// Per vraag: gezien (form_vraag), beantwoord (form_stap), afgewezen
// (form_klaar B/C op die vraag). Afgehaakt = gezien − beantwoord − afgewezen.
// "Gezien" wordt pas sinds 17 okt gemeten; daarvoor staat er niets.

import { useEffect, useState } from 'react'
import { MessageCircle, UserX } from 'lucide-react'
import db from '../../services/DatabaseService'
import { VRAGEN } from '../../pages/challengeVragen'

const ROOD = '#ef4444'
const ORANJE = '#f59e0b'
const kort = (t) => (t.length > 46 ? `${t.slice(0, 44)}…` : t)
const label = (id) => {
  const q = VRAGEN.find(v => v.id === id)
  return q ? (q.id === 'contact' ? 'Telefoonnummer' : kort(q.vraag)) : id
}
const waLink = (tel) => {
  let n = String(tel || '').replace(/[^0-9+]/g, '')
  if (n.startsWith('06')) n = `31${n.slice(1)}`
  return `https://wa.me/${n.replace(/^\+/, '')}`
}

export default function PrequalAfhaken({ venster, m }) {
  const [rijen, setRijen] = useState(null)
  const [open, setOpen] = useState([])

  useEffect(() => {
    if (!venster) return
    let weg = false
    const p = { p_van: venster.van, p_tot: venster.tot }
    Promise.all([
      db.supabase.rpc('get_prequal_afhaken', p).then(r => r, () => ({ data: [] })),
      db.supabase.rpc('get_prequal_onafgemaakt', p).then(r => r, () => ({ data: [] })),
    ]).then(([a, o]) => {
      if (weg) return
      setRijen(a.data || [])
      setOpen(o.data || [])
    })
    return () => { weg = true }
  }, [venster])

  if (!rijen) return null
  const per = Object.fromEntries(rijen.map(r => [r.vraag, r]))
  const lijst = VRAGEN.map(q => {
    const r = per[q.id] || {}
    const gezien = Number(r.gezien) || 0
    const beantwoord = Number(r.beantwoord) || 0
    const afgewezen = Number(r.afgewezen) || 0
    const af = Math.max(0, gezien - beantwoord - afgewezen)
    return { id: q.id, gezien, beantwoord, afgewezen, af, deel: gezien ? af / gezien : 0 }
  })
  const begin = lijst[0]?.gezien || 0
  const ergste = lijst.reduce((x, r) => (r.gezien >= 5 && r.af > (x?.af || 0) ? r : x), null)

  return (
    <div style={{ display: 'grid', gridTemplateColumns: m ? '1fr' : '1.4fr 1fr', gap: m ? 28 : 40, marginBottom: m ? 32 : 44 }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'rgba(255,255,255,0.55)', marginBottom: 4 }}>Afhaken per vraag</div>
        {begin === 0 ? (
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)', marginTop: 8 }}>
            Wordt gemeten vanaf 17 oktober. Zodra er mensen door het formulier gaan, zie je hier per vraag wie afhaakt.
          </div>
        ) : (
          <>
            {ergste && (
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fff', margin: '4px 0 12px' }}>
                Grootste afhaker: <span style={{ color: ROOD }}>{label(ergste.id)}</span> · {ergste.af} van {ergste.gezien} ({Math.round(ergste.deel * 100)}%)
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {lijst.map((r, i) => {
                const kleur = r.gezien >= 5 && r.deel >= 0.2 ? ROOD : r.gezien >= 5 && r.deel >= 0.1 ? ORANJE : '#fff'
                return (
                  <div key={r.id}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', width: 18, flexShrink: 0 }}>{i + 1}</span>
                      <span style={{ flex: 1, minWidth: 0, fontSize: '0.82rem', fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label(r.id)}</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: kleur, whiteSpace: 'nowrap' }}>
                        {r.af > 0 ? `−${r.af}` : ''}{r.afgewezen > 0 ? ` · ${r.afgewezen} afgewezen` : ''}
                      </span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 900, minWidth: 30, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{r.gezien}</span>
                    </div>
                    <div style={{ height: 8, borderRadius: 5, background: 'rgba(255,255,255,0.05)', marginTop: 4, marginLeft: 26, overflow: 'hidden' }}>
                      <div style={{ width: `${begin ? Math.max(2, (r.gezien / begin) * 100) : 0}%`, height: '100%', borderRadius: 5, background: kleur, opacity: 0.85, transition: 'width 0.5s ease' }} />
                    </div>
                  </div>
                )
              })}
            </div>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginTop: 10 }}>
              Getal rechts = mensen die de vraag zagen. Rood = 20%+ haakt hier af, oranje = 10%+.
            </div>
          </>
        )}
      </div>

      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'rgba(255,255,255,0.55)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          <UserX size={14} strokeWidth={2.6} /> Haakte af na het nummer ({open.length})
        </div>
        {open.length === 0 ? (
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)' }}>Niemand in deze periode.</div>
        ) : open.slice(0, 25).map(o => (
          <div key={o.session_id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 900 }}>{o.voornaam || 'Onbekend'}</div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)', marginTop: 1 }}>
                stopte na: {label(o.laatste_vraag)} · {new Date(o.updated_at).toLocaleString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            <a href={waLink(o.telefoon)} target="_blank" rel="noopener noreferrer" style={{
              display: 'flex', alignItems: 'center', gap: 6, minHeight: 34, padding: '0 12px', borderRadius: 10,
              background: '#25D366', color: '#000', fontSize: '0.78rem', fontWeight: 900, textDecoration: 'none', whiteSpace: 'nowrap',
            }}>
              <MessageCircle size={14} strokeWidth={2.8} /> {o.telefoon}
            </a>
          </div>
        ))}
      </div>
    </div>
  )
}
