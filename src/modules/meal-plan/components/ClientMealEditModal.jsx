// src/modules/meal-plan/components/ClientMealEditModal.jsx
// Client-kant maaltijd-editor. Hergebruikt de coach MealEditModal (embedded +
// clientMode) voor het bewerken van ingrediënten/porties, en voegt daarna een
// dagkiezer toe: elke week op de gekozen dagen, of één week op die datums.
// "Overal waar dit gerecht staat" blijft als snelkeuze onderaan.
import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Repeat } from 'lucide-react'
import MealEditModal from '../../ai-meal-generator/tabs/plan-analyzer/MealEditModal'
import { werkGelogdeMaaltijdBij, zetMaaltijdOpDagen } from '../dagAanpassingen'
import { lokaleDag } from '../utils/dagVenster'
import DagenKiezer from './DagenKiezer'

export default function ClientMealEditModal({
  db, service, meal, planId, dayName, datum, clientId, onClose, onSaved, isMobile,
}) {
  const slot = meal?.slot
  const [enriched, setEnriched] = useState(null)
  const [loading, setLoading] = useState(true)
  const [phase, setPhase] = useState('edit')   // 'edit' | 'scope'
  const [pending, setPending] = useState(null)  // bewerkte snapshot
  const [saving, setSaving] = useState(null)    // scope-key tijdens opslaan
  const [error, setError] = useState(null)

  // De snapshot uit het plan mist vaak ingredients_list (alleen macro's). De
  // editor heeft die nodig, dus haal 'm bij op uit ai_meals.
  useEffect(() => {
    let alive = true
    const enrich = async () => {
      const mid = meal?.meal_id || meal?.id
      if (meal?.ingredients_list?.length || !mid) {
        if (alive) { setEnriched(meal); setLoading(false) }
        return
      }
      try {
        const { data } = await db.supabase
          .from('ai_meals')
          .select('ingredients_list, preparation_steps, tips, image_url')
          .eq('id', mid)
          .single()
        if (alive) setEnriched({
          ...meal,
          ingredients_list: data?.ingredients_list || [],
          preparation_steps: meal.preparation_steps?.length ? meal.preparation_steps : (data?.preparation_steps || []),
          tips: meal.tips || data?.tips || null,
        })
      } catch {
        if (alive) setEnriched(meal)
      }
      if (alive) setLoading(false)
    }
    enrich()
    return () => { alive = false }
  }, [])

  // Waar staat deze maaltijd nog meer in de week? Nodig om bij elke keuze te
  // kunnen tonen wat hij raakt. Zonder dat is "alle dezelfde maaltijden" een
  // gok: het kan één plek zijn of je hele week.
  const [plekken, setPlekken] = useState(null)
  useEffect(() => {
    if (phase !== 'scope' || !planId || !db?.supabase) return
    let weg = false
    const mealId = meal?.meal_id || meal?.id
    db.supabase
      .from('client_meal_plans')
      .select('week_structure')
      .eq('id', planId)
      .single()
      .then(r => r, () => ({ data: null }))
      .then(({ data }) => {
        if (weg || !data?.week_structure) { if (!weg) setPlekken([]) ; return }
        const uit = []
        Object.entries(data.week_structure).forEach(([dag, slots]) => {
          if (!slots || typeof slots !== 'object') return
          Object.entries(slots).forEach(([slotKey, m]) => {
            if (!m || typeof m !== 'object') return
            if ((m.meal_id || m.id) === mealId) uit.push({ dag, slot: slotKey })
          })
        })
        setPlekken(uit)
      })
    return () => { weg = true }
  }, [phase, planId, db, meal])

  // keuze: 'all' (overal waar dit gerecht staat) of het object uit DagenKiezer.
  const persist = async (keuze) => {
    setSaving(keuze === 'all' ? 'all' : 'kiezer'); setError(null)
    try {
      const snap = pending
      const targetMealId = meal?.meal_id || meal?.id
      // Op welke datums staat de maaltijd al gelogd die nu een andere versie
      // krijgt? Die logs tellen vanaf nu de aangepaste macro's.
      let bijTeWerken = []
      if (keuze === 'all') {
        await db.updateMealEverywhereInWeek(planId, targetMealId, snap)
        bijTeWerken = [datum || new Date()]
      } else if (keuze.modus === 'altijd') {
        await zetMaaltijdOpDagen(db.supabase, planId, keuze.dagen, slot, snap)
        // Een oudere eenmalige versie van vandaag zou de blijvende verbergen.
        const vandaagKey = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][new Date().getDay()]
        if (keuze.dagen.includes(vandaagKey)) await service.wisDagAanpassing(clientId, slot, null)
        if (keuze.dagen.includes(dayName)) bijTeWerken = [datum || new Date()]
      } else {
        for (const d of keuze.datums) await service.overrideMealForDate(clientId, slot, snap, d)
        bijTeWerken = keuze.datums.map(lokaleDag)
      }
      for (const d of bijTeWerken) await werkGelogdeMaaltijdBij(db.supabase, clientId, targetMealId, d, snap)
      onSaved?.()
    } catch (e) {
      console.error('❌ Client meal save failed:', e)
      setError(e?.message || 'Opslaan mislukt')
      setSaving(null)
    }
  }

  const overlay = (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(8px)',
      zIndex: 11000, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
    }}>
      {loading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 32, height: 32, border: '3px solid rgba(255,215,0,0.2)', borderTopColor: '#FFD700', borderRadius: '50%', animation: 'cmeSpin 0.8s linear infinite' }} />
        </div>
      ) : phase === 'edit' ? (
        <MealEditModal
          db={db}
          meal={enriched}
          slot={slot}
          clientMode
          embedded
          isMobile={isMobile}
          onClose={onClose}
          onSave={(updated) => { setPending(updated); setPhase('scope') }}
        />
      ) : (
        <DagenKiezer
          titel={pending?.name || enriched?.name || enriched?.meal_name}
          subtitel={`${Math.round(pending?.calories || 0)} kcal · ${Math.round(pending?.protein || 0)}g E · ${Math.round(pending?.carbs || 0)}g K · ${Math.round(pending?.fat || 0)}g V`}
          datum={datum}
          dagKey={dayName}
          slot={slot}
          bezig={!!saving}
          fout={error}
          isMobile={isMobile}
          onKies={persist}
          onTerug={() => { setPhase('edit'); setError(null) }}
          terugTekst="← Terug naar bewerken"
          onClose={onClose}
          extra={<OveralKnop plekken={plekken} bezig={!!saving} bezigHier={saving === 'all'} onKies={() => persist('all')} />}
        />
      )}
      <style>{`@keyframes cmeSpin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  return createPortal(overlay, document.body)
}

const DAG_KORT = {
  monday: 'ma', tuesday: 'di', wednesday: 'wo', thursday: 'do',
  friday: 'vr', saturday: 'za', sunday: 'zo',
}
const SLOT_KORT = {
  breakfast: 'ontbijt', lunch: 'lunch', dinner: 'diner',
  snack1: 'snack', snack2: 'snack', snack3: 'snack', pre_workout: 'pre-workout',
}

// Snelkeuze: overal in de week waar ditzelfde gerecht staat, ook op andere
// momenten. Alleen zichtbaar als het gerecht op meer dan één plek staat.
function OveralKnop({ plekken, bezig, bezigHier, onKies }) {
  if (!plekken || plekken.length < 2) return null
  const tekst = plekken.map(p => `${DAG_KORT[p.dag] || p.dag} ${SLOT_KORT[p.slot] || p.slot}`).join(' · ')
  return (
    <button onClick={() => !bezig && onKies()} disabled={bezig} style={{
      display: 'flex', alignItems: 'center', gap: '0.6rem', textAlign: 'left',
      padding: '0.65rem 0.8rem', borderRadius: 10, cursor: bezig ? 'default' : 'pointer',
      background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', fontFamily: 'inherit',
      opacity: bezig && !bezigHier ? 0.35 : 1, touchAction: 'manipulation',
    }}>
      <Repeat size={15} color="#fff" strokeWidth={2.4} style={{ flexShrink: 0 }} />
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: '0.78rem', fontWeight: 900, color: '#fff' }}>
          Overal waar dit gerecht staat ({plekken.length}×)
        </span>
        <span style={{ display: 'block', fontSize: '0.64rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>{tekst}</span>
      </span>
    </button>
  )
}
