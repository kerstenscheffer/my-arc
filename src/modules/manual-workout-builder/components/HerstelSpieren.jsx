// src/modules/manual-workout-builder/components/HerstelSpieren.jsx
//
// Herstel per spiergroep in de builder (10 nov 2026). De klant geeft tijdens de
// bouwfase aan of hij een spiergroep nog voelt van vorige keer (training_feedback,
// soort 'herstel') en hoe elke oefening ging (soort 'oefening'). Hier wordt dat
// een stip achter de spiergroep:
//   groen  = hersteld → +1 set mogelijk, als er tijd is in die training
//   oranje = matig    → gelijk houden
//   rood   = niet hersteld of een pijntje → kijk dieper
// Niets gaat vanzelf: de +1 is een knop die de coach zelf indrukt.

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Plus } from 'lucide-react'
import { HERSTEL, GEVOEL } from '../../workout/bouwfase/bouwfaseData'
import { spierLabel } from '../spierGroepen'

const KLEUR = { groen: '#10b981', oranje: '#f59e0b', rood: '#ef4444' }
const kort = (d) => new Date(`${String(d).slice(0, 10)}T12:00:00`).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })

export const HerstelStip = ({ stand, maat = 7 }) => (stand
  ? <span title={stand === 'groen' ? 'Goed hersteld' : stand === 'oranje' ? 'Matig hersteld' : 'Niet hersteld of pijntje'}
      style={{ display: 'inline-block', width: maat, height: maat, borderRadius: '50%', background: KLEUR[stand], marginLeft: 5, verticalAlign: 'middle', flexShrink: 0 }} />
  : null)

// Spiergroep in de weektotalen: naam, sets, stip en eventueel +1. Klik = details.
// doel = { dagNaam, oefening } waar de extra set zou landen, of null (geen tijd/oefening).
export function SpierChip({ spier, sets, info, doel, onPlusSet, klein = false }) {
  const [open, setOpen] = useState(false)
  const [plek, setPlek] = useState(null)
  const knop = useRef(null)
  const paneel = useRef(null)
  const stand = info?.stand || null
  const onbekend = spier === 'onbekend'

  useEffect(() => {
    if (!open) return undefined
    const dicht = (e) => { if (!knop.current?.contains(e.target) && !paneel.current?.contains(e.target)) setOpen(false) }
    const esc = (e) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('pointerdown', dicht)
    window.addEventListener('keydown', esc)
    return () => { window.removeEventListener('pointerdown', dicht); window.removeEventListener('keydown', esc) }
  }, [open])

  const klik = () => {
    if (!info) return
    const r = knop.current.getBoundingClientRect()
    setPlek({ top: r.bottom + 8, left: Math.max(12, Math.min(r.left - 20, window.innerWidth - 332)) })
    setOpen(v => !v)
  }

  return (
    <>
      <button ref={knop} onClick={klik} disabled={!info} style={{
        display: 'inline-flex', alignItems: 'center', gap: 4, padding: 0, background: 'none', border: 'none',
        fontFamily: 'inherit', cursor: info ? 'pointer' : 'default', whiteSpace: 'nowrap',
        fontSize: klein ? '0.7rem' : '0.8rem', fontWeight: 800, color: onbekend ? '#f59e0b' : 'rgba(255,255,255,0.65)',
      }}>
        {spierLabel(spier)} <b style={{ fontWeight: 900, color: onbekend ? '#f59e0b' : '#fff', fontVariantNumeric: 'tabular-nums' }}>{sets}</b>
        <HerstelStip stand={stand} maat={klein ? 6 : 7} />
        {!klein && stand === 'groen' && doel && <span style={{ fontSize: '0.66rem', fontWeight: 900, color: KLEUR.groen }}>+1</span>}
      </button>
      {open && plek && createPortal(
        <div ref={paneel} style={{
          position: 'fixed', top: plek.top, left: plek.left, zIndex: 2147483000, width: 320, maxHeight: 420,
          display: 'flex', flexDirection: 'column', background: '#111', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 12, boxShadow: '0 12px 40px rgba(0,0,0,0.7)', overflow: 'hidden',
        }}>
          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8, padding: '0.65rem 0.8rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ flex: 1, fontSize: '0.9rem', fontWeight: 900, color: '#fff' }}>{spierLabel(spier)} <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 800 }}>· {sets} sets</span></div>
            <button onClick={() => setOpen(false)} aria-label="Sluit" style={{ width: 26, height: 26, padding: 0, borderRadius: 7, border: 'none', background: 'transparent', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={15} /></button>
          </div>
          <div style={{ overflowY: 'auto', padding: '0.4rem 0' }}>
            {info.herstel.map(r => {
              const h = HERSTEL.find(x => x.id === r.gevoel)
              return (
                <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '0.35rem 0.8rem', fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>
                  <span>Herstel · {kort(r.datum)}</span>
                  <b style={{ color: h?.kleur || '#fff', fontWeight: 900 }}>{h?.label || r.gevoel}</b>
                </div>
              )
            })}
            {info.oefeningen.map(r => (
              <div key={r.id} style={{ padding: '0.35rem 0.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: '0.78rem', fontWeight: 800, color: '#fff' }}>
                  <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.oefening}</span>
                  <span style={{ flexShrink: 0, color: r.gevoel === 'pijn' ? KLEUR.rood : r.gevoel === 'techniek' ? KLEUR.oranje : 'rgba(255,255,255,0.6)' }}>
                    {[r.score ? `${r.score}/10` : null, GEVOEL.find(g => g.id === r.gevoel)?.label].filter(Boolean).join(' · ')}
                  </span>
                </div>
                {r.opmerking && <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>{r.opmerking}</div>}
                <div style={{ fontSize: '0.64rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>{kort(r.datum)}</div>
              </div>
            ))}
          </div>
          <div style={{ flexShrink: 0, borderTop: '1px solid rgba(255,255,255,0.08)', padding: '0.6rem 0.8rem' }}>
            {stand === 'groen' && doel ? (
              <button onClick={() => { onPlusSet(); setOpen(false) }} style={{
                width: '100%', height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                background: '#fff', color: '#000', border: 'none', borderRadius: 9, fontSize: '0.82rem', fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer',
              }}>
                <Plus size={15} strokeWidth={3} /> 1 set op {doel.oefening} · {doel.dagNaam}
              </button>
            ) : (
              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: stand ? KLEUR[stand] : 'rgba(255,255,255,0.5)' }}>
                {stand === 'groen' ? 'Hersteld, maar geen training met tijd over voor een extra set.'
                  : stand === 'oranje' ? 'Gelijk houden.'
                    : stand === 'rood' ? 'Kijk dieper: niet hersteld of een pijntje.'
                      : 'Nog geen herstelantwoord deze week.'}
              </div>
            )}
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}
