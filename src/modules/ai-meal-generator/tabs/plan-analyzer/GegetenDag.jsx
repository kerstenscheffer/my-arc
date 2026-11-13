// src/modules/ai-meal-generator/tabs/plan-analyzer/GegetenDag.jsx
//
// "Gegeten" in de Plan Analyzer (13 nov 2026, Kersten): wat de klant op deze
// dag echt gelogd heeft, naast het plan dat je aan het bouwen bent. Leest
// consumed_meals; daar staat elke log van de klant, uit het plan of zelf
// ingevoerd. Alleen lezen: hier verander je niets aan wat de klant at.
//
// Bovenaan de week in één regel (gelogde kcal per dag), daaronder de gekozen
// dag: dezelfde vier ringen als bij het plan, en de logs per eetmoment.

import { useEffect, useMemo, useState } from 'react'
import DagRingen from './DagRingen'

const MOMENTEN = [
  ['breakfast', 'Ontbijt'], ['lunch', 'Lunch'], ['dinner', 'Diner'], ['snack', 'Snack'],
  ['pre_workout', 'Pre-workout'], ['evening', 'Avond'],
]
const DAG_KORT = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo']
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const rond = (n) => Math.round(Number(n) || 0)
// Hoeveelheid zoals de klant hem logde: gram, of een aantal porties (1 portie laten we weg).
const hoeveel = (r) => {
  const n = Number(r.amount) || 0
  if (!n) return ''
  if (r.per_unit === 'gram') return `${Math.round(n)} g`
  if (n === 1) return ''
  return `${String(Math.round(n * 10) / 10).replace('.', ',')} porties`
}
const som = (lijst) => lijst.reduce((t, r) => ({
  calories: t.calories + (Number(r.calories) || 0), protein: t.protein + (Number(r.protein) || 0),
  carbs: t.carbs + (Number(r.carbs) || 0), fat: t.fat + (Number(r.fat) || 0),
}), { calories: 0, protein: 0, carbs: 0, fat: 0 })

export default function GegetenDag({ db, clientId, weekStart, dagIndex, targets, isMobile, onKiesDag }) {
  const [rijen, setRijen] = useState(null) // null = laden
  const [fout, setFout] = useState(null)

  const dagen = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date(`${weekStart}T00:00:00`); d.setDate(d.getDate() + i); return d
  }), [weekStart])

  useEffect(() => {
    if (!db?.supabase || !clientId) return undefined
    let weg = false
    setRijen(null); setFout(null)
    const tot = new Date(dagen[6]); tot.setDate(tot.getDate() + 1)
    db.supabase.from('consumed_meals')
      .select('id, consumed_at, calories, protein, carbs, fat, meal_type, meal_name, amount, per_unit')
      .eq('client_id', clientId)
      .gte('consumed_at', dagen[0].toISOString()).lt('consumed_at', tot.toISOString())
      .order('consumed_at', { ascending: true })
      .then(({ data, error }) => {
        if (weg) return
        if (error) { setFout(error.message); setRijen([]); return }
        setRijen(data || [])
      }, (e) => { if (!weg) { setFout(e?.message || 'Laden mislukt'); setRijen([]) } })
    return () => { weg = true }
  }, [db, clientId, dagen])

  const perDag = useMemo(() => {
    const uit = dagen.map(() => [])
    for (const r of rijen || []) {
      const i = dagen.findIndex(d => iso(d) === iso(new Date(r.consumed_at)))
      if (i >= 0) uit[i].push(r)
    }
    return uit
  }, [rijen, dagen])

  const vandaag = useMemo(() => perDag[dagIndex] || [], [perDag, dagIndex])
  const totaal = som(vandaag)
  const doelKcal = Number(targets?.calories) || 0
  const vandaagIso = iso(new Date())
  const zij = isMobile ? '0.75rem' : '1rem'

  // Per eetmoment, in vaste volgorde; onbekende soorten achteraan onder hun eigen naam.
  const groepen = useMemo(() => {
    const bekend = MOMENTEN.map(([sleutel, label]) => ({ label, items: vandaag.filter(r => r.meal_type === sleutel) }))
    const rest = vandaag.filter(r => !MOMENTEN.some(([s]) => s === r.meal_type))
    if (rest.length) bekend.push({ label: 'Overig', items: rest })
    return bekend.filter(g => g.items.length)
  }, [vandaag])

  return (
    <div>
      {/* De week: gelogde kcal per dag. Groen binnen 10% van het doel. */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, margin: `0 ${zij} 0.7rem`, borderRadius: 10, overflow: 'hidden' }}>
        {dagen.map((d, i) => {
          const kcal = rond(som(perDag[i]).calories)
          const toekomst = iso(d) > vandaagIso
          const afwijking = doelKcal && kcal ? Math.abs(kcal - doelKcal) / doelKcal : null
          const kleur = !kcal ? 'rgba(255,255,255,0.3)' : afwijking == null ? '#fff' : afwijking <= 0.1 ? '#10b981' : kcal < doelKcal ? '#ef4444' : '#f59e0b'
          return (
            <button key={i} type="button" onClick={() => onKiesDag?.(i)} style={{
              padding: '0.45rem 0.2rem', background: i === dagIndex ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)', border: 'none',
              cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center',
            }}>
              <div style={{ fontSize: '0.62rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{DAG_KORT[i]} {d.getDate()}</div>
              <div style={{ fontSize: '0.82rem', fontWeight: 900, color: kleur, fontVariantNumeric: 'tabular-nums' }}>
                {rijen === null ? '…' : kcal ? new Intl.NumberFormat('nl-NL').format(kcal) : toekomst ? '·' : '0'}
              </div>
            </button>
          )
        })}
      </div>

      <div style={{ margin: `0 ${zij} 0.5rem` }}>
        <DagRingen totalen={totaal} targets={targets || {}} isMobile={isMobile} strak />
      </div>

      {fout && <div style={{ margin: `0 ${zij}`, fontSize: '0.8rem', fontWeight: 700, color: '#f87171' }}>Kon de logs niet laden: {fout}</div>}
      {rijen !== null && !fout && vandaag.length === 0 && (
        <div style={{ margin: `1.2rem ${zij}`, fontSize: '0.86rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>
          {iso(dagen[dagIndex]) > vandaagIso ? 'Deze dag moet nog komen.' : 'Niets gelogd op deze dag.'}
        </div>
      )}

      {groepen.map(g => {
        const t = som(g.items)
        return (
          <div key={g.label} style={{ margin: `0.9rem ${zij} 0` }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 2 }}>
              <span style={{ flex: 1, fontSize: '0.95rem', fontWeight: 900, color: '#fff' }}>{g.label}</span>
              <span style={{ fontSize: '0.76rem', fontWeight: 800, color: 'rgba(255,255,255,0.6)', fontVariantNumeric: 'tabular-nums' }}>
                {rond(t.calories)} kcal · {rond(t.protein)} E · {rond(t.carbs)} K · {rond(t.fat)} V
              </span>
            </div>
            {g.items.map(r => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'baseline', gap: 8, padding: '0.34rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.84rem' }}>
                <span style={{ flexShrink: 0, width: 38, fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', fontVariantNumeric: 'tabular-nums' }}>
                  {new Date(r.consumed_at).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span style={{ flex: 1, minWidth: 0, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {r.meal_name || 'Zonder naam'}
                  {hoeveel(r) && <span style={{ fontWeight: 600, color: 'rgba(255,255,255,0.45)' }}> · {hoeveel(r)}</span>}
                </span>
                <span style={{ flexShrink: 0, fontWeight: 700, color: 'rgba(255,255,255,0.6)', fontVariantNumeric: 'tabular-nums' }}>
                  {rond(r.calories)} kcal · {rond(r.protein)} E
                </span>
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}
