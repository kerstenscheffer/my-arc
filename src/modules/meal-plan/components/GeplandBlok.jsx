// src/modules/meal-plan/components/GeplandBlok.jsx
//
// Vrij loggen, maar toch vooruit plannen (13 nov 2026, Kersten): per dag de
// maaltijden die de klant alvast klaarzette, per eetmoment, met wat dat
// optelt tegen zijn doelen. Gepland is nog niet gegeten: het staat in
// geplande_maaltijden en telt nergens mee tot hij op "Gegeten" tikt. Dan gaat
// de rij naar consumed_meals, precies zoals bij gewoon loggen.

import { useCallback, useEffect, useState } from 'react'
import { Plus, Check, X } from 'lucide-react'
import { foodImageFallback } from '../foodImageFallback'

const MOMENTEN = [
  ['breakfast', 'Ontbijt', 'breakfast'], ['lunch', 'Lunch', 'lunch'], ['dinner', 'Diner', 'dinner'], ['snack', 'Snack', 'snack1'],
]
const som = (lijst) => lijst.reduce((t, r) => ({
  calories: t.calories + (Number(r.calories) || 0), protein: t.protein + (Number(r.protein) || 0),
  carbs: t.carbs + (Number(r.carbs) || 0), fat: t.fat + (Number(r.fat) || 0),
}), { calories: 0, protein: 0, carbs: 0, fat: 0 })
const rond = (n) => Math.round(Number(n) || 0)
const momentVan = (r) => (MOMENTEN.some(([m]) => m === r.meal_type) ? r.meal_type : 'snack')

// `datum` = 'jjjj-mm-dd' van de dag in beeld. `magLoggen` = vandaag of eerder
// (een dag in de toekomst kun je nog niet gegeten hebben).
// `versie` telt op als er elders iets gepland is; `onGelogd` laat het
// dagschema de gelogde maaltijden opnieuw ophalen.
// `onMomenten` meldt voor welke eetmomenten er iets gepland staat: het
// dagschema laat het lege vak van dat moment dan weg.
export default function GeplandBlok({ db, client, datum, magLoggen, versie = 0, onPlan, onGelogd, onMomenten = null, isMobile }) {
  const [rijen, setRijen] = useState([])
  const [bezig, setBezig] = useState(null)
  const [fout, setFout] = useState(null)

  const laad = useCallback(async () => {
    if (!db?.supabase || !client?.id || !datum) return
    const { data, error } = await db.supabase.from('geplande_maaltijden')
      .select('id, meal_type, meal_name, calories, protein, carbs, fat, amount, per_unit, image_url, payload')
      .eq('client_id', client.id).eq('datum', datum).is('gelogd_id', null).order('created_at')
      .then(r => r, () => ({ data: [], error: null }))
    if (!error) setRijen(data || [])
  }, [db, client?.id, datum])
  useEffect(() => { laad() }, [laad, versie])
  useEffect(() => { onMomenten?.([...new Set(rijen.map(momentVan))]) }, [rijen]) // eslint-disable-line react-hooks/exhaustive-deps

  const weg = async (r) => {
    setBezig(r.id)
    await db.supabase.from('geplande_maaltijden').delete().eq('id', r.id)
    setBezig(null); laad()
  }

  // Gegeten: de rij gaat naar consumed_meals. Vandaag met de tijd van nu, een
  // eerdere dag op twaalf uur van die dag (zelfde regel als naloggen).
  const gegetenTik = async (r) => {
    setBezig(r.id); setFout(null)
    try {
      const nu = new Date()
      const vandaag = `${nu.getFullYear()}-${String(nu.getMonth() + 1).padStart(2, '0')}-${String(nu.getDate()).padStart(2, '0')}`
      const consumed_at = datum === vandaag ? nu.toISOString() : new Date(`${datum}T12:00:00`).toISOString()
      const { data, error } = await db.supabase.from('consumed_meals')
        .insert({ ...r.payload, client_id: client.id, consumed_at, created_at: nu.toISOString() }).select('id').single()
      if (error) throw error
      await db.supabase.from('geplande_maaltijden').update({ gelogd_id: data.id, updated_at: nu.toISOString() }).eq('id', r.id)
      if (navigator.vibrate) navigator.vibrate([20, 40, 20])
      await laad()
      onGelogd?.()
    } catch (e) {
      console.error('Geplande maaltijd loggen mislukt:', e)
      setFout('Loggen lukte niet. Probeer het nog eens.')
    }
    setBezig(null)
  }

  // Niets gepland: geen blok. Inplannen doe je op de lege vakken in het dagschema.
  if (rijen.length === 0) return null
  const zij = isMobile ? '0.9rem' : '1.25rem'
  const gepland = som(rijen)

  return (
    <div style={{ margin: `0 0 ${isMobile ? '0.6rem' : '0.8rem'}` }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, margin: `0 ${zij} 4px` }}>
        <span style={{ fontSize: isMobile ? '1rem' : '1.1rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>Gepland</span>
        {rijen.length > 0 && (
          <span style={{ flex: 1, minWidth: 0, fontSize: '0.74rem', fontWeight: 800, color: 'rgba(255,255,255,0.6)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {rond(gepland.calories)} kcal · {rond(gepland.protein)} E · {rond(gepland.carbs)} K · {rond(gepland.fat)} V
          </span>
        )}
      </div>

      {MOMENTEN.map(([moment, label, slot]) => {
        const items = rijen.filter(r => momentVan(r) === moment)
        if (!items.length) return null
        return (
          <div key={moment} style={{ margin: `0 ${isMobile ? '0.5rem' : '0.75rem'} 0.4rem`, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 40, padding: '0 0.4rem 0 0.75rem' }}>
              <span style={{ fontSize: '0.84rem', fontWeight: 900, color: '#fff' }}>{label}</span>
              <span style={{ flex: 1, minWidth: 0, fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)', fontVariantNumeric: 'tabular-nums' }}>
                {items.length ? `${rond(som(items).calories)} kcal` : 'nog niets gepland'}
              </span>
              {onPlan && (
                <button onClick={() => onPlan(moment)} aria-label={`${label} plannen`} style={{ width: 36, height: 36, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', touchAction: 'manipulation' }}>
                  <Plus size={18} strokeWidth={2.8} />
                </button>
              )}
            </div>
            {items.map(r => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.35rem 0.4rem 0.35rem 0.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', opacity: bezig === r.id ? 0.5 : 1 }}>
                <div style={{ width: 40, height: 40, flexShrink: 0, borderRadius: 8, background: `url(${r.image_url || foodImageFallback(r.meal_name, slot, 120)}) center/cover` }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.meal_name}</div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', fontVariantNumeric: 'tabular-nums' }}>
                    {rond(r.calories)} kcal · {rond(r.protein)} E · {rond(r.carbs)} K · {rond(r.fat)} V
                  </div>
                </div>
                {magLoggen && (
                  <button onClick={() => gegetenTik(r)} disabled={bezig === r.id} style={{ flexShrink: 0, height: 32, padding: '0 0.7rem', display: 'flex', alignItems: 'center', gap: 5, borderRadius: 9, background: '#fff', border: 'none', color: '#0a0a0a', fontFamily: 'inherit', fontSize: '0.74rem', fontWeight: 900, cursor: 'pointer', touchAction: 'manipulation' }}>
                    <Check size={13} strokeWidth={3} /> Gegeten
                  </button>
                )}
                <button onClick={() => weg(r)} disabled={bezig === r.id} aria-label="Weghalen" style={{ width: 32, height: 32, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )
      })}
      {fout && <div style={{ margin: `4px ${zij} 0`, fontSize: '0.74rem', fontWeight: 800, color: '#ef4444' }}>{fout}</div>}
    </div>
  )
}
