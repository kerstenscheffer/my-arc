// src/modules/ai-meal-generator/tabs/plan-analyzer/GegetenDag.jsx
//
// "Gegeten" in de Plan Analyzer (13 nov 2026, Kersten): wat de klant op deze
// dag echt gelogd heeft, naast het plan dat je aan het bouwen bent. Leest
// consumed_meals; daar staat elke log van de klant, uit het plan of zelf
// ingevoerd. Alleen lezen: hier verander je niets aan wat de klant at.
//
// De week zelf (kcal per dag) staat in de dagstrook bovenaan de Analyzer; hier
// de gekozen dag: dezelfde vier ringen als bij het plan, en de logs per eetmoment.

import { useMemo } from 'react'
import { iso, som } from './gegetenWeek'
import DagRingen from './DagRingen'
import { foodImageFallback } from '../../../meal-plan/foodImageFallback'

// [soort in de database, label, slot voor de foto-terugval]
const MOMENTEN = [
  ['breakfast', 'Ontbijt', 'breakfast'], ['lunch', 'Lunch', 'lunch'], ['dinner', 'Diner', 'dinner'], ['snack', 'Snack', 'snack1'],
  ['pre_workout', 'Pre-workout', 'snack2'], ['evening', 'Avond', 'snack3'],
]

// Zelfde cijferregel als op de maaltijdkaart van het plan.
function Macro({ val, label, m }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 2 }}>
      <span style={{ fontSize: m ? '0.72rem' : '0.78rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)' }}>{Math.round(val || 0)}</span>
      <span style={{ fontSize: m ? '0.52rem' : '0.58rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>{label}</span>
    </span>
  )
}
const DAG_KORT = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo']
// Hoeveelheid zoals de klant hem logde: gram, of een aantal porties (1 portie laten we weg).
const hoeveel = (r) => {
  const n = Number(r.amount) || 0
  if (!n) return ''
  if (r.per_unit === 'gram') return `${Math.round(n)} g`
  if (n === 1) return ''
  return `${String(Math.round(n * 10) / 10).replace('.', ',')} porties`
}
// `week` komt uit useGegetenWeek in de Plan Analyzer.
export default function GegetenDag({ week, dagIndex, targets, isMobile }) {
  const { dagen, perDag, laden, fout } = week
  const vandaag = useMemo(() => perDag[dagIndex] || [], [perDag, dagIndex])
  const totaal = som(vandaag)
  const vandaagIso = iso(new Date())
  const zij = isMobile ? '0.75rem' : '1rem'

  // Per eetmoment, in vaste volgorde; onbekende soorten achteraan onder hun eigen naam.
  const groepen = useMemo(() => {
    const bekend = MOMENTEN.map(([sleutel, label, slot]) => ({ label, slot, items: vandaag.filter(r => r.meal_type === sleutel) }))
    const rest = vandaag.filter(r => !MOMENTEN.some(([s]) => s === r.meal_type))
    if (rest.length) bekend.push({ label: 'Overig', slot: 'snack1', items: rest })
    return bekend.filter(g => g.items.length)
  }, [vandaag])

  return (
    <div>
      <div style={{ margin: `0 ${zij} 0.5rem` }}>
        <DagRingen totalen={totaal} targets={targets || {}} isMobile={isMobile} strak />
      </div>

      {fout && <div style={{ margin: `0 ${zij}`, fontSize: '0.8rem', fontWeight: 700, color: '#f87171' }}>Kon de logs niet laden: {fout}</div>}
      {!laden && !fout && vandaag.length === 0 && (
        <div style={{ margin: `1.2rem ${zij}`, fontSize: '0.86rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>
          {iso(dagen[dagIndex]) > vandaagIso ? 'Deze dag moet nog komen.' : 'Niets gelogd op deze dag.'}
        </div>
      )}

      {/* Eén kaart per eetmoment, in de vorm van de maaltijdkaart van het plan:
          foto met moment en tijd, naam, cijfers. Meer dan één log = de losse
          regels eronder. */}
      {groepen.map(g => {
        const t = som(g.items)
        const eerste = g.items[0]
        const foto = g.items.find(r => r.image_url)?.image_url || foodImageFallback(eerste.meal_name, g.slot, 200)
        const maat = isMobile ? 64 : 76
        return (
          <div key={g.label} style={{
            margin: isMobile ? '0 0.5rem 0.45rem' : '0 0.75rem 0.55rem', background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, overflow: 'hidden',
          }}>
            <div style={{ display: 'flex', alignItems: 'stretch', minWidth: 0 }}>
              <div style={{ width: maat, minHeight: maat, flexShrink: 0, position: 'relative', background: `url(${foto}) center/cover` }}>
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0) 35%, rgba(0,0,0,0.85) 100%)' }} />
                <div style={{ position: 'absolute', left: 5, right: 4, bottom: 4, lineHeight: 1.1 }}>
                  <div style={{ fontSize: '0.5rem', fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>{g.label}</div>
                  <div style={{ fontSize: '0.52rem', fontWeight: 800, color: 'rgba(255,255,255,0.75)', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
                    {new Date(eerste.consumed_at).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: isMobile ? '0.35rem 0.65rem' : '0.4rem 0.85rem' }}>
                <div style={{ fontSize: isMobile ? '0.9rem' : '0.98rem', fontWeight: 800, color: '#fff', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {g.items.length === 1 ? (eerste.meal_name || 'Zonder naam') : g.items.map(r => r.meal_name).filter(Boolean).join(', ')}
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: isMobile ? '0.55rem' : '0.7rem', overflow: 'hidden' }}>
                  <Macro val={t.calories} label="kcal" m={isMobile} />
                  <Macro val={t.protein} label="E" m={isMobile} />
                  <Macro val={t.carbs} label="K" m={isMobile} />
                  <Macro val={t.fat} label="V" m={isMobile} />
                  {g.items.length === 1 && hoeveel(eerste) && <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>{hoeveel(eerste)}</span>}
                </div>
              </div>
            </div>
            {g.items.length > 1 && (
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: isMobile ? '0.15rem 0.65rem 0.3rem' : '0.15rem 0.85rem 0.35rem' }}>
                {g.items.map(r => (
                  <div key={r.id} style={{ display: 'flex', alignItems: 'baseline', gap: 8, minHeight: 26, fontSize: '0.8rem' }}>
                    <span style={{ flex: 1, minWidth: 0, fontWeight: 700, color: 'rgba(255,255,255,0.85)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {r.meal_name || 'Zonder naam'}
                      {hoeveel(r) && <span style={{ fontWeight: 600, color: 'rgba(255,255,255,0.4)' }}> · {hoeveel(r)}</span>}
                    </span>
                    <span style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'baseline', gap: isMobile ? '0.45rem' : '0.6rem', fontVariantNumeric: 'tabular-nums' }}>
                      <Macro val={r.calories} label="kcal" m={isMobile} />
                      <Macro val={r.protein} label="E" m={isMobile} />
                      <Macro val={r.carbs} label="K" m={isMobile} />
                      <Macro val={r.fat} label="V" m={isMobile} />
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
