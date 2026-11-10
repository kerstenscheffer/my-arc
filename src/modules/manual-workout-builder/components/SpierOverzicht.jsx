// src/modules/manual-workout-builder/components/SpierOverzicht.jsx
//
// Uitklapbaar overzicht onder de weektotalen (10 nov 2026): per lichaamsdeel een
// kolom met elke spiergroep (sets, doel, herstel, advies) en daaronder zijn
// koppen. Strak: één blok, kolommen tegen elkaar met lijnen ertussen, dik wit.

import { useState } from 'react'
import { ChevronDown, Minus, Plus } from 'lucide-react'
import { HerstelStip, SpierChip } from './HerstelSpieren'
import { spierLabel } from '../spierGroepen'
import { HERSTEL, GEVOEL } from '../../workout/bouwfase/bouwfaseData'

const kort = (d) => new Date(`${String(d).slice(0, 10)}T12:00:00`).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric' })
const pctTekst = (v) => `${v > 0 ? '+' : ''}${String(Math.round(v * 10) / 10).replace('.', ',')}%`
const KRACHT_KLEUR = { stijgt: '#10b981', stagneert: 'rgba(255,255,255,0.6)', daalt: '#ef4444' }
const RUIMTE = {
  omhoog: ['Ruimte voor meer', '#10b981'], houden: ['Houden', 'rgba(255,255,255,0.55)'],
  omlaag: ['Minder', '#ef4444'], 'let op': ['Let op', '#f59e0b'],
}

// Eén regel onder de spiergroep: herstel, kracht, cijfer van de klant en het oordeel.
function Signalen({ spier, info, advies, onActie, onWissel }) {
  const h = info?.herstel?.[0]
  const hv = h && HERSTEL.find(x => x.id === h.gevoel)
  const scores = (info?.oefeningen || []).map(r => Number(r.score)).filter(Boolean)
  const cijfer = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null
  const pijn = (info?.oefeningen || []).filter(r => r.gevoel === 'pijn').length
  const r = advies && RUIMTE[advies.oordeel]
  const item = { whiteSpace: 'nowrap', fontSize: '0.66rem', fontWeight: 800 }
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '3px 10px', marginTop: 4 }}>
      <span style={{ ...item, color: hv ? hv.kleur : 'rgba(255,255,255,0.35)' }} title="Laatste herstelantwoord van de klant">
        Herstel {hv ? `${hv.label.toLowerCase()} · ${kort(h.datum)}` : '—'}
      </span>
      {advies?.krachtPct != null && (
        <span style={{ ...item, color: KRACHT_KLEUR[advies.trend] || 'rgba(255,255,255,0.6)' }} title="Beste set, laatste weken">Kracht {pctTekst(advies.krachtPct)}</span>
      )}
      {cijfer != null && <span style={{ ...item, color: '#fff' }} title="Gemiddeld cijfer van de klant, 7 dagen">{String(Math.round(cijfer * 10) / 10).replace('.', ',')}/10</span>}
      {pijn > 0 && <span style={{ ...item, color: '#f59e0b' }}>{pijn}x pijn</span>}
      {r && (
        <span style={{ marginLeft: 'auto' }}>
          {/* Klik = het adviesmenu met de knop (sets toevoegen/weghalen, wisselen). */}
          <SpierChip spier={spier} info={info} advies={advies} onActie={onActie} onWissel={onWissel}
            inhoud={<span title={advies.tekst} style={{ ...item, color: r[1], textDecoration: 'underline', textUnderlineOffset: 2 }}>{r[0]}</span>} />
        </span>
      )}
    </div>
  )
}

const getal = (v) => String(Math.round(v * 10) / 10).replace('.', ',')
const PIJL = { omhoog: ['↑', '#10b981'], omlaag: ['↓', '#ef4444'], 'let op': ['!', '#f59e0b'] }
const LIJN = '1px solid rgba(255,255,255,0.12)'
const DUN = '1px solid rgba(255,255,255,0.06)'
const ORANJE = '#f59e0b'

// blokken: [[titel, [spier...]]], sets: { spier: { frac } }, advies/herstel per spier.
// onSets(dayId, exId, sets): sets van één oefening in het plan aanpassen.
// open/onOpen: lichaam uitgeklapt; klik op de titelregel klapt in en uit.
export default function SpierOverzicht({ blokken, sets, advies = {}, herstel = {}, onSets, onActie, onWissel, open: lichaamOpen, onOpen }) {
  const getallen = { fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }
  // Spiergroepen die uitgeklapt zijn: daar staan de oefeningen met -/+ per set.
  const [open, setOpen] = useState(() => new Set())
  const wissel = (k) => setOpen(prev => { const n = new Set(prev); if (n.has(k)) n.delete(k); else n.add(k); return n })
  const stap = { width: 22, height: 22, padding: 0, borderRadius: 6, border: '1px solid rgba(255,255,255,0.18)', background: 'transparent', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }
  return (
    <div style={{ display: 'flex', border: LIJN, borderRadius: 10, overflow: 'hidden' }}>
    <div style={{ flex: 1, minWidth: 0, display: 'grid', gridTemplateColumns: `repeat(${blokken.length}, minmax(0, 1fr))` }}>
      {blokken.map(([titel, spieren], i) => {
        // Kopregel per blok: totaal sets, doel (som van de spieren met een doel) en het zwaarste advies.
        const totaal = spieren.reduce((n, k) => n + (sets[k]?.frac || 0), 0)
        const metDoel = spieren.map(k => advies[k]?.range).filter(Boolean)
        const doel = metDoel.length ? [metDoel.reduce((n, r) => n + r[0], 0), metDoel.reduce((n, r) => n + r[1], 0)] : null
        const zwaarste = ['omlaag', 'let op', 'omhoog'].find(o => spieren.some(k => advies[k]?.oordeel === o))
        const zp = zwaarste && PIJL[zwaarste]
        return (
        <div key={titel} style={{ borderLeft: i ? LIJN : 'none', minWidth: 0 }}>
          <button onClick={() => onOpen?.(!lichaamOpen)} aria-expanded={!!lichaamOpen} title={lichaamOpen ? 'Inklappen' : 'Spiergroepen en koppen tonen'} style={{ width: '100%', display: 'flex', alignItems: 'baseline', gap: 6, padding: '0.6rem 0.75rem', background: '#e6e6e6', border: 'none', fontFamily: 'inherit', cursor: 'pointer', textAlign: 'left', color: '#000' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 900, letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{titel}</span>
            {/* Wit vlak: donkerder groen/rood/oranje voor contrast. */}
            {zp && <span style={{ fontSize: '0.8rem', fontWeight: 900, color: { '↑': '#047857', '↓': '#b91c1c', '!': '#b45309' }[zp[0]] }}>{zp[0]}</span>}
            <span style={{ marginLeft: 'auto', ...getallen, fontSize: '0.92rem', fontWeight: 900 }}>{getal(totaal)}</span>
            {doel && <span style={{ ...getallen, fontSize: '0.7rem', fontWeight: 800, color: 'rgba(0,0,0,0.5)' }}>/ {getal(doel[0])}–{getal(doel[1])}</span>}
          </button>
          {lichaamOpen && <div style={{ borderTop: LIJN }}>
          {spieren.map((k, j) => {
            const a = advies[k]
            const p = a && PIJL[a.oordeel]
            return (
              <div key={k} style={{ borderTop: j ? DUN : 'none', padding: '0.45rem 0.75rem 0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <button onClick={() => wissel(k)} aria-expanded={open.has(k)} title="Oefeningen tonen" style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 3, padding: 0, background: 'none', border: 'none', fontFamily: 'inherit', cursor: 'pointer', textAlign: 'left', fontSize: '0.84rem', fontWeight: 900, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                    <ChevronDown size={13} strokeWidth={3} style={{ flexShrink: 0, color: 'rgba(255,255,255,0.5)', transform: open.has(k) ? 'none' : 'rotate(-90deg)', transition: 'transform 0.15s' }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{spierLabel(k)}</span><HerstelStip stand={herstel[k]?.stand} maat={6} />
                    {p && <span title={a.tekst} style={{ marginLeft: 4, color: p[1] }}>{p[0]}</span>}
                  </button>
                  <span style={{ ...getallen, fontSize: '0.88rem', fontWeight: 900, color: '#fff' }}>{getal(sets[k]?.frac || 0)}</span>
                  {a?.range && <span style={{ ...getallen, fontSize: '0.7rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)' }}>/ {getal(a.range[0])}–{getal(a.range[1])}</span>}
                </div>
                <Signalen spier={k} info={herstel[k]} advies={a} onActie={onActie} onWissel={onWissel} />
                {open.has(k) && (a?.bronnen || []).flatMap(b => b.items.map(it => (
                  <div key={`${it.dayId}|${it.exId}`} style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5 }}>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, color: b.gewicht < 1 ? 'rgba(255,255,255,0.6)' : '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.naam}</span>
                      <span style={{ display: 'block', fontSize: '0.64rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {[it.dagNaam, b.kop, b.gewicht < 1 ? 'telt half' : null].filter(Boolean).join(' · ')}
                      </span>
                      {(b.kracht || b.feedback) && (
                        <span title={b.feedback?.opmerking || undefined} style={{ display: 'block', fontSize: '0.64rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {b.kracht && <span style={{ color: KRACHT_KLEUR[b.kracht.soort] || 'rgba(255,255,255,0.6)' }}>Kracht {pctTekst(b.kracht.pct)}</span>}
                          {b.kracht && b.feedback && <span style={{ color: 'rgba(255,255,255,0.3)' }}> · </span>}
                          {b.feedback && (
                            <span style={{ color: b.feedback.gevoel === 'pijn' ? '#ef4444' : b.feedback.gevoel === 'techniek' ? '#f59e0b' : '#fff' }}>
                              {[b.feedback.score ? `${b.feedback.score}/10` : null, GEVOEL.find(g => g.id === b.feedback.gevoel)?.label, b.feedback.opmerking ? `"${b.feedback.opmerking}"` : null].filter(Boolean).join(' · ')}
                            </span>
                          )}
                        </span>
                      )}
                    </span>
                    <button onClick={() => onSets?.(it.dayId, it.exId, Math.max(1, it.sets - 1))} disabled={it.sets <= 1} aria-label="Set eraf" style={{ ...stap, opacity: it.sets <= 1 ? 0.3 : 1 }}><Minus size={12} strokeWidth={3} /></button>
                    <span style={{ ...getallen, width: 16, textAlign: 'center', fontSize: '0.8rem', fontWeight: 900, color: '#fff' }}>{it.sets}</span>
                    <button onClick={() => onSets?.(it.dayId, it.exId, it.sets + 1)} aria-label="Set erbij" style={stap}><Plus size={12} strokeWidth={3} /></button>
                  </div>
                )))}
                {(a?.koppen || []).map(kp => (
                  <div key={kp.label} style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 3, paddingLeft: 10, borderLeft: '2px solid rgba(255,255,255,0.12)' }}>
                    <span style={{ flex: 1, minWidth: 0, fontSize: '0.74rem', fontWeight: 800, color: kp.sets === 0 ? ORANJE : '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{kp.label}</span>
                    <span style={{ ...getallen, fontSize: '0.76rem', fontWeight: 900, color: kp.sets === 0 ? ORANJE : '#fff' }}>{kp.sets}</span>
                  </div>
                ))}
              </div>
            )
          })}
          </div>}
        </div>
        )
      })}
    </div>
    </div>
  )
}
