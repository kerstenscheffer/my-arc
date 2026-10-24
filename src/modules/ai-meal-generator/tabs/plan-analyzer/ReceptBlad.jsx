// src/modules/ai-meal-generator/tabs/plan-analyzer/ReceptBlad.jsx
//
// Het recept van een maaltijd in de Plan Analyzer: foto, macro's,
// ingrediënten met hoeveelheden (zoals ze in dít plan staan, dus na
// schalen) en de bereiding + tips uit ai_meals. Staan stappen of tips niet
// op de maaltijd in het plan, dan halen we ze op via meal_id.

import { useEffect, useState } from 'react'
import BladModal from '../../../workout/components/todays-workout/components/BladModal'
import { foodImageFallback } from '../../../meal-plan/foodImageFallback'

const stappenVan = (v) => {
  if (!v) return []
  if (Array.isArray(v)) return v.map(s => (typeof s === 'string' ? s : s?.instruction || s?.step || s?.text || '')).filter(Boolean)
  if (typeof v === 'string') return v.split(/\n+/).map(s => s.replace(/^\s*\d+[.)]\s*/, '').trim()).filter(Boolean)
  return []
}

export default function ReceptBlad({ open, onClose, db, meal, ingredienten, naamVan }) {
  const [extra, setExtra] = useState(null) // { preparation_steps, tips } uit ai_meals

  const mealId = meal?.meal_id || meal?.id || null
  const heeftStappen = stappenVan(meal?.preparation_steps).length > 0
  useEffect(() => {
    if (!open || heeftStappen || !mealId || !db?.supabase) return
    let weg = false
    db.supabase.from('ai_meals').select('preparation_steps, tips').eq('id', mealId).maybeSingle()
      .then(({ data }) => { if (!weg) setExtra(data || {}) }, () => { if (!weg) setExtra({}) })
    return () => { weg = true }
  }, [open, mealId, heeftStappen, db])

  if (!open || !meal) return null
  const stappen = heeftStappen ? stappenVan(meal.preparation_steps) : stappenVan(extra?.preparation_steps)
  const tips = meal.tips || extra?.tips || null
  const laden = !heeftStappen && mealId && extra === null
  const foto = meal.image_url || foodImageFallback(meal.name || meal.title, null, 800) || null
  const kop = { fontSize: '0.72rem', fontWeight: 900, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.06em', textTransform: 'uppercase', margin: '1.1rem 0 0.5rem' }
  const macro = (waarde, label) => (
    <div style={{ flex: 1, textAlign: 'center', padding: '0.5rem 0', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10 }}>
      <div style={{ fontSize: '1rem', fontWeight: 900, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>{Math.round(Number(waarde) || 0)}</div>
      <div style={{ fontSize: '0.66rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)' }}>{label}</div>
    </div>
  )

  return (
    <BladModal open titel={meal.name || 'Recept'} onClose={onClose} zIndex={12000}>
      <div style={{ paddingBottom: '1rem' }}>
        {foto && (
          <img src={foto} alt="" style={{ width: '100%', maxHeight: 220, objectFit: 'cover', borderRadius: 12, display: 'block' }} />
        )}
        <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
          {macro(meal.calories, 'kcal')}
          {macro(meal.protein, 'eiwit')}
          {macro(meal.carbs, 'koolh')}
          {macro(meal.fat, 'vet')}
        </div>

        {ingredienten.length > 0 && (
          <>
            <div style={kop}>Ingrediënten</div>
            <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, overflow: 'hidden' }}>
              {ingredienten.map((ing, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.55rem 0.8rem', borderTop: i ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                  <span style={{ flex: 1, minWidth: 0, fontSize: '0.88rem', fontWeight: 800, color: '#fff' }}>{naamVan(ing)}</span>
                  {ing.amount > 0 && (
                    <span style={{ flexShrink: 0, fontSize: '0.84rem', fontWeight: 900, color: 'rgba(255,255,255,0.7)', fontVariantNumeric: 'tabular-nums' }}>{ing.amount}{ing.unit || 'g'}</span>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        <div style={kop}>Bereiding</div>
        {laden ? (
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)' }}>Laden…</div>
        ) : stappen.length === 0 ? (
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)' }}>Voor deze maaltijd staat nog geen bereiding.</div>
        ) : (
          <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {stappen.map((s, i) => (
              <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ flexShrink: 0, width: 24, height: 24, borderRadius: 999, background: '#fff', color: '#0a0a0a', fontSize: '0.74rem', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</span>
                <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'rgba(255,255,255,0.88)', lineHeight: 1.5, paddingTop: 2 }}>{s}</span>
              </li>
            ))}
          </ol>
        )}

        {tips && (
          <>
            <div style={kop}>Tips</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.75)', lineHeight: 1.55, whiteSpace: 'pre-line' }}>{tips}</div>
          </>
        )}
      </div>
    </BladModal>
  )
}
