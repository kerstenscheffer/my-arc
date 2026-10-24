// src/modules/ai-meal-generator/tabs/plan-analyzer/ReceptBlad.jsx
//
// Het recept van een maaltijd in de Plan Analyzer: foto, macro's,
// ingrediënten met hoeveelheden (zoals ze in dít plan staan, dus na
// schalen) en de bereiding + tips uit ai_meals.
//
// Bereiding en tips komen altijd uit ai_meals (het recept zelf); de kopie in
// het plan alleen als er geen rij is (eigen maaltijd). Bewerken schrijft naar
// ai_meals: elk plan en elke klant met deze maaltijd ziet het nieuwe recept.

import { useEffect, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import BladModal from '../../../workout/components/todays-workout/components/BladModal'
import { foodImageFallback } from '../../../meal-plan/foodImageFallback'

const stappenVan = (v) => {
  if (!v) return []
  if (Array.isArray(v)) return v.map(s => (typeof s === 'string' ? s : s?.instruction || s?.step || s?.text || '')).filter(Boolean)
  if (typeof v === 'string') return v.split(/\n+/).map(s => s.replace(/^\s*\d+[.)]\s*/, '').trim()).filter(Boolean)
  return []
}

export default function ReceptBlad({ open, onClose, db, meal, ingredienten, naamVan }) {
  // recept: null = laden, false = geen rij in ai_meals, anders de rij.
  const [recept, setRecept] = useState(null)
  const [bewerk, setBewerk] = useState(null) // { stappen: [], tips: '' } tijdens bewerken
  const [opslaan, setOpslaan] = useState(false)
  const [fout, setFout] = useState(null)

  const mealId = meal?.meal_id || meal?.id || null
  useEffect(() => {
    if (!open) { setBewerk(null); setFout(null); return }
    if (!mealId || !db?.supabase) { setRecept(false); return }
    let weg = false
    setRecept(null)
    db.supabase.from('ai_meals').select('id, preparation_steps, tips').eq('id', mealId).maybeSingle()
      .then(({ data }) => { if (!weg) setRecept(data || false) }, () => { if (!weg) setRecept(false) })
    return () => { weg = true }
  }, [open, mealId, db])

  if (!open || !meal) return null
  const uitDb = recept && stappenVan(recept.preparation_steps).length > 0
  const stappen = uitDb ? stappenVan(recept.preparation_steps) : stappenVan(meal.preparation_steps)
  const tips = (recept && recept.tips) || meal.tips || null
  const laden = recept === null
  const kanBewerken = !!recept

  const begin = () => setBewerk({ stappen: stappen.length ? [...stappen] : [''], tips: tips || '' })
  const bewaar = async () => {
    const nieuweStappen = bewerk.stappen.map(x => x.trim()).filter(Boolean)
    const nieuweTips = bewerk.tips.trim() || null
    setOpslaan(true); setFout(null)
    const { data, error } = await db.supabase.from('ai_meals')
      .update({ preparation_steps: nieuweStappen, tips: nieuweTips, updated_at: new Date().toISOString() })
      .eq('id', recept.id).select('id, preparation_steps, tips')
    setOpslaan(false)
    if (error || !data?.length) { console.error('Recept opslaan mislukt:', error || 'geen rij'); setFout('Opslaan lukte niet. Probeer het opnieuw.'); return }
    setRecept(data[0]); setBewerk(null)
  }
  const veld = {
    width: '100%', boxSizing: 'border-box', padding: '0.55rem 0.7rem', borderRadius: 9,
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.16)',
    color: '#fff', fontSize: '0.86rem', fontWeight: 600, fontFamily: 'inherit', lineHeight: 1.45,
    resize: 'vertical', outline: 'none',
  }
  const knop = (vol) => ({
    height: 38, padding: '0 0.9rem', borderRadius: 10, display: 'inline-flex', alignItems: 'center', gap: 6,
    background: vol ? '#fff' : 'rgba(255,255,255,0.06)', border: `1px solid ${vol ? '#fff' : 'rgba(255,255,255,0.16)'}`,
    color: vol ? '#0a0a0a' : '#fff', fontSize: '0.84rem', fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer',
  })
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

        {bewerk ? (
          <>
            <div style={kop}>Bereiding</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {bewerk.stappen.map((st, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <span style={{ flexShrink: 0, width: 24, height: 24, marginTop: 6, borderRadius: 999, background: '#fff', color: '#0a0a0a', fontSize: '0.74rem', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</span>
                  <textarea value={st} rows={2} style={veld} placeholder="Wat doe je in deze stap?"
                    onChange={e => setBewerk(b => ({ ...b, stappen: b.stappen.map((x, j) => (j === i ? e.target.value : x)) }))} />
                  <button onClick={() => setBewerk(b => ({ ...b, stappen: b.stappen.filter((_, j) => j !== i) }))} aria-label="Stap weghalen"
                    style={{ flexShrink: 0, width: 34, height: 34, marginTop: 2, borderRadius: 9, background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <button onClick={() => setBewerk(b => ({ ...b, stappen: [...b.stappen, ''] }))} style={{ ...knop(false), alignSelf: 'flex-start' }}>
                <Plus size={15} /> Stap toevoegen
              </button>
            </div>
            <div style={kop}>Tips</div>
            <textarea value={bewerk.tips} rows={4} style={veld} placeholder="Tips voor de klant (optioneel)"
              onChange={e => setBewerk(b => ({ ...b, tips: e.target.value }))} />
            <div style={{ marginTop: 10, fontSize: '0.76rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', lineHeight: 1.45 }}>
              Dit past het recept van de maaltijd aan: iedere klant met deze maaltijd ziet de nieuwe bereiding.
            </div>
            {fout && <div style={{ marginTop: 8, fontSize: '0.8rem', fontWeight: 800, color: '#ef4444' }}>{fout}</div>}
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button onClick={bewaar} disabled={opslaan} style={{ ...knop(true), flex: 1, justifyContent: 'center', opacity: opslaan ? 0.6 : 1 }}>
                {opslaan ? 'Opslaan…' : 'Opslaan'}
              </button>
              <button onClick={() => { setBewerk(null); setFout(null) }} disabled={opslaan} style={knop(false)}>Annuleren</button>
            </div>
          </>
        ) : (
          <>
            <div style={{ ...kop, display: 'flex', alignItems: 'center' }}>
              <span style={{ flex: 1 }}>Bereiding</span>
              {kanBewerken && (
                <button onClick={begin} style={{ ...knop(false), height: 30, padding: '0 0.65rem', fontSize: '0.76rem', textTransform: 'none', letterSpacing: 0 }}>
                  <Pencil size={13} /> Bewerk recept
                </button>
              )}
            </div>
            {laden ? (
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)' }}>Laden…</div>
            ) : stappen.length === 0 ? (
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)' }}>Voor deze maaltijd staat nog geen bereiding.</div>
            ) : (
              <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {stappen.map((st, i) => (
                  <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span style={{ flexShrink: 0, width: 24, height: 24, borderRadius: 999, background: '#fff', color: '#0a0a0a', fontSize: '0.74rem', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</span>
                    <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'rgba(255,255,255,0.88)', lineHeight: 1.5, paddingTop: 2 }}>{st}</span>
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
          </>
        )}
      </div>
    </BladModal>
  )
}
