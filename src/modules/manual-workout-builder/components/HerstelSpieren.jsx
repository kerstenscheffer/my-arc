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
import { X, Plus, Minus, ArrowLeftRight } from 'lucide-react'
import { HERSTEL, GEVOEL } from '../../workout/bouwfase/bouwfaseData'
import { spierLabel } from '../spierGroepen'

const KLEUR = { groen: '#10b981', oranje: '#f59e0b', rood: '#ef4444' }
const kort = (d) => new Date(`${String(d).slice(0, 10)}T12:00:00`).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })

export const HerstelStip = ({ stand, maat = 7 }) => (stand
  ? <span title={stand === 'groen' ? 'Goed hersteld' : stand === 'oranje' ? 'Matig hersteld' : 'Niet hersteld of pijntje'}
      style={{ display: 'inline-block', width: maat, height: maat, borderRadius: '50%', background: KLEUR[stand], marginLeft: 5, verticalAlign: 'middle', flexShrink: 0 }} />
  : null)

// Spiergroep in de weektotalen en dagkop: naam, sets, herstelstip en een pijltje
// als er een voorstel is. Klik = menu met de range, de redenen, de antwoorden van
// de klant en de knop die het voorstel uitvoert.
// advies: uit volumeSuggesties.js (of null); onActie(advies) voert advies.wijzigingen uit.
const OORDEEL = {
  omhoog: { teken: '↑', kleur: '#10b981' },
  omlaag: { teken: '↓', kleur: '#ef4444' },
  'let op': { teken: '!', kleur: '#f59e0b' },
}
const TREND = { stijgt: 'Kracht stijgt', stagneert: 'Kracht staat stil', daalt: 'Kracht daalt' }
const getal = (v) => String(v).replace('.', ',')

export function SpierChip({ spier, sets, info, advies, onActie, onWissel, klein = false }) {
  const [open, setOpen] = useState(false)
  const [plek, setPlek] = useState(null)
  const knop = useRef(null)
  const paneel = useRef(null)
  const stand = info?.stand || null
  const onbekend = spier === 'onbekend'
  const o = advies && OORDEEL[advies.oordeel]
  const klikbaar = !!(info || advies)

  useEffect(() => {
    if (!open) return undefined
    const dicht = (e) => { if (!knop.current?.contains(e.target) && !paneel.current?.contains(e.target)) setOpen(false) }
    const esc = (e) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('pointerdown', dicht)
    window.addEventListener('keydown', esc)
    return () => { window.removeEventListener('pointerdown', dicht); window.removeEventListener('keydown', esc) }
  }, [open])

  const klik = () => {
    if (!klikbaar) return
    const r = knop.current.getBoundingClientRect()
    setPlek({ top: r.bottom + 8, left: Math.max(12, Math.min(r.left - 20, window.innerWidth - 352)) })
    setOpen(v => !v)
  }

  const titel = { fontSize: '0.62rem', fontWeight: 900, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', padding: '0.5rem 0.8rem 0.2rem' }

  return (
    <>
      <button ref={knop} onClick={klik} disabled={!klikbaar} title={advies?.tekst || undefined} style={{
        display: 'inline-flex', alignItems: 'center', gap: 4, padding: 0, background: 'none', border: 'none',
        fontFamily: 'inherit', cursor: klikbaar ? 'pointer' : 'default', whiteSpace: 'nowrap',
        fontSize: klein ? '0.7rem' : '0.8rem', fontWeight: 800, color: onbekend ? '#f59e0b' : 'rgba(255,255,255,0.65)',
      }}>
        {spierLabel(spier)} <b style={{ fontWeight: 900, color: onbekend ? '#f59e0b' : '#fff', fontVariantNumeric: 'tabular-nums' }}>{sets}</b>
        <HerstelStip stand={stand} maat={klein ? 6 : 7} />
        {o && <span style={{ fontSize: klein ? '0.68rem' : '0.76rem', fontWeight: 900, color: o.kleur, marginLeft: 1 }}>{o.teken}</span>}
      </button>
      {open && plek && createPortal(
        <div ref={paneel} style={{
          position: 'fixed', top: plek.top, left: plek.left, zIndex: 2147483000, width: 340, maxHeight: 480,
          display: 'flex', flexDirection: 'column', background: '#111', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 12, boxShadow: '0 12px 40px rgba(0,0,0,0.7)', overflow: 'hidden',
        }}>
          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'flex-start', gap: 8, padding: '0.65rem 0.8rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.92rem', fontWeight: 900, color: '#fff' }}>{spierLabel(spier)}</div>
              {advies && (
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.55)', marginTop: 2, lineHeight: 1.45 }}>
                  {getal(advies.frac)} sets/week{advies.frac !== advies.direct ? ` (${advies.direct} direct)` : ''}
                  {advies.range ? ` · doel ${getal(advies.range[0])}–${getal(advies.range[1])}` : ''} · {advies.freq}x/week · {advies.context}
                </div>
              )}
            </div>
            <button onClick={() => setOpen(false)} aria-label="Sluit" style={{ width: 26, height: 26, padding: 0, borderRadius: 7, border: 'none', background: 'transparent', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><X size={15} /></button>
          </div>
          <div style={{ overflowY: 'auto', paddingBottom: '0.4rem' }}>
            {advies && (
              <div style={{ padding: '0.6rem 0.8rem 0.3rem' }}>
                <div style={{ display: 'flex', gap: 8, fontSize: '0.82rem', fontWeight: 800, color: '#fff', lineHeight: 1.4 }}>
                  {o && <span style={{ color: o.kleur, fontWeight: 900, flexShrink: 0 }}>{o.teken}</span>}
                  <span>{advies.tekst}</span>
                </div>
                {advies.redenen.length > 0 && (
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.55)', marginTop: 4 }}>{advies.redenen.join(' · ')}</div>
                )}
                {advies.wijzigingen?.length > 0 && (
                  <div style={{ marginTop: 6 }}>
                    {advies.wijzigingen.map(w => (
                      <div key={`${w.dayId}|${w.exId}`} style={{ fontSize: '0.74rem', fontWeight: 700, color: 'rgba(255,255,255,0.75)' }}>
                        {w.delta > 0 ? '+' : ''}{w.delta} set{Math.abs(w.delta) === 1 ? '' : 's'} · {w.naam}{w.dagNaam ? ` (${w.dagNaam})` : ''}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {info && (<>
              <div style={titel}>Klant, laatste 7 dagen</div>
              {info.herstel.map(r => {
                const h = HERSTEL.find(x => x.id === r.gevoel)
                return (
                  <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '0.3rem 0.8rem', fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>
                    <span>Herstel · {kort(r.datum)}</span>
                    <b style={{ color: h?.kleur || '#fff', fontWeight: 900 }}>{h?.label || r.gevoel}</b>
                  </div>
                )
              })}
              {info.oefeningen.map(r => (
                <div key={r.id} style={{ padding: '0.3rem 0.8rem' }}>
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
            </>)}
            {!info && advies && (
              <div style={{ padding: '0.3rem 0.8rem', fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)' }}>
                Nog geen herstelantwoord deze week.{advies.trend ? ` ${TREND[advies.trend]}.` : ''}
              </div>
            )}
          </div>
          {advies?.actie?.soort === 'wissel' && advies.wissel?.length > 0 && (
            <div style={{ flexShrink: 0, borderTop: '1px solid rgba(255,255,255,0.08)', padding: '0.6rem 0.8rem', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {advies.wissel.map(w => (
                <button key={`${w.dayId}|${w.exId}`} onClick={() => { onWissel?.(w); setOpen(false) }} style={{
                  width: '100%', height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  background: '#fff', color: '#000', border: 'none', borderRadius: 9, fontSize: '0.8rem', fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer',
                }}>
                  <ArrowLeftRight size={14} strokeWidth={2.8} /> {w.naam} wisselen{w.dagNaam ? ` · ${w.dagNaam}` : ''}
                </button>
              ))}
            </div>
          )}
          {advies?.actie && advies.actie.soort !== 'wissel' && advies.wijzigingen?.length > 0 && (
            <div style={{ flexShrink: 0, borderTop: '1px solid rgba(255,255,255,0.08)', padding: '0.6rem 0.8rem' }}>
              <button onClick={() => { onActie?.(advies); setOpen(false) }} style={{
                width: '100%', height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                background: '#fff', color: '#000', border: 'none', borderRadius: 9, fontSize: '0.82rem', fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer',
              }}>
                {advies.actie.soort === 'plus' ? <Plus size={15} strokeWidth={3} /> : <Minus size={15} strokeWidth={3} />}
                {advies.actie.soort === 'plus' ? 'Sets toevoegen' : 'Sets weghalen'}
              </button>
            </div>
          )}
        </div>,
        document.body,
      )}
    </>
  )
}
