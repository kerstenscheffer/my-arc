// src/modules/ai-meal-generator/tabs/plan-analyzer/gegetenWeek.js
//
// Wat de klant in één week echt gelogd heeft (consumed_meals), per dag. Gedeeld
// door de dagstrook bovenaan de Plan Analyzer en de dagweergave "Gegeten", zodat
// die twee dezelfde cijfers tonen (13 nov 2026).

import { useEffect, useMemo, useState } from 'react'

export const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
export const som = (lijst) => lijst.reduce((t, r) => ({
  calories: t.calories + (Number(r.calories) || 0), protein: t.protein + (Number(r.protein) || 0),
  carbs: t.carbs + (Number(r.carbs) || 0), fat: t.fat + (Number(r.fat) || 0),
}), { calories: 0, protein: 0, carbs: 0, fat: 0 })

// De logs van één week, per dag (0 = maandag). Los van het scherm, zodat de
// dagstrook bovenaan en de dag zelf dezelfde cijfers tonen.
export function useGegetenWeek(db, clientId, weekStart, aan = true) {
  const [rijen, setRijen] = useState(null) // null = laden
  const [fout, setFout] = useState(null)
  const dagen = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date(`${weekStart}T00:00:00`); d.setDate(d.getDate() + i); return d
  }), [weekStart])

  useEffect(() => {
    if (!aan || !db?.supabase || !clientId) return undefined
    let weg = false
    setRijen(null); setFout(null)
    const tot = new Date(dagen[6]); tot.setDate(tot.getDate() + 1)
    db.supabase.from('consumed_meals')
      .select('id, consumed_at, calories, protein, carbs, fat, meal_type, meal_name, amount, per_unit, image_url')
      .eq('client_id', clientId)
      .gte('consumed_at', dagen[0].toISOString()).lt('consumed_at', tot.toISOString())
      .order('consumed_at', { ascending: true })
      .then(({ data, error }) => {
        if (weg) return
        if (error) { setFout(error.message); setRijen([]); return }
        setRijen(data || [])
      }, (e) => { if (!weg) { setFout(e?.message || 'Laden mislukt'); setRijen([]) } })
    return () => { weg = true }
  }, [aan, db, clientId, dagen])

  const perDag = useMemo(() => {
    const uit = dagen.map(() => [])
    for (const r of rijen || []) {
      const i = dagen.findIndex(d => iso(d) === iso(new Date(r.consumed_at)))
      if (i >= 0) uit[i].push(r)
    }
    return uit
  }, [rijen, dagen])
  const totalen = useMemo(() => perDag.map(som), [perDag])

  return { dagen, perDag, totalen, laden: rijen === null, fout }
}
