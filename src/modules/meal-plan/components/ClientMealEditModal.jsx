// src/modules/meal-plan/components/ClientMealEditModal.jsx
// Client-kant maaltijd-editor. Hergebruikt de coach MealEditModal (embedded +
// clientMode) voor het bewerken van ingrediënten/porties, en voegt daarna een
// scope-keuze toe: alle dezelfde meals / alleen deze dag / eenmalig vandaag.
import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Repeat, CalendarDays, Zap } from 'lucide-react'
import MealEditModal from '../../ai-meal-generator/tabs/plan-analyzer/MealEditModal'

export default function ClientMealEditModal({
  db, service, meal, planId, dayName, isToday, clientId, onClose, onSaved, isMobile,
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

  const persist = async (scopeKey) => {
    setSaving(scopeKey); setError(null)
    try {
      const snap = pending
      const targetMealId = meal?.meal_id || meal?.id
      if (scopeKey === 'all') {
        await db.updateMealEverywhereInWeek(planId, targetMealId, snap)
      } else if (scopeKey === 'day') {
        await db.updateMealInWeek(planId, dayName, slot, snap)
      } else if (scopeKey === 'today') {
        await service.overrideMealForToday(clientId, slot, snap)
      }
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
        <ScopeChooser
          meal={enriched}
          pending={pending}
          isToday={isToday}
          plekken={plekken}
          dayName={dayName}
          slot={slot}
          saving={saving}
          error={error}
          isMobile={isMobile}
          onBack={() => { setPhase('edit'); setError(null) }}
          onClose={onClose}
          onChoose={persist}
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
const DAG_VOLUIT = {
  monday: 'maandag', tuesday: 'dinsdag', wednesday: 'woensdag', thursday: 'donderdag',
  friday: 'vrijdag', saturday: 'zaterdag', sunday: 'zondag',
}
const SLOT_KORT = {
  breakfast: 'ontbijt', lunch: 'lunch', dinner: 'diner',
  snack1: 'snack', snack2: 'snack', snack3: 'snack', pre_workout: 'pre-workout',
}

function ScopeChooser({ meal, pending, isToday, plekken, dayName, slot, saving, error, isMobile, onBack, onClose, onChoose }) {
  const busy = !!saving
  const diff = {
    kcal: Math.round((pending?.calories || 0) - (meal?.calories || 0)),
  }

  // Wat elke keuze concreet raakt. Dit is het hele punt van dit scherm: de
  // titels ("alle dezelfde maaltijden") zeggen niet of dat er één is of zeven.
  const aantal = plekken?.length ?? null
  const plekkenTekst = plekken === null
    ? 'even kijken waar deze maaltijd staat…'
    : aantal === 0
      ? 'staat verder nergens in je week'
      : plekken
          .map(p => `${DAG_KORT[p.dag] || p.dag} ${SLOT_KORT[p.slot] || p.slot}`)
          .join(' · ')

  const vandaag = new Date().toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
  const dagVoluit = DAG_VOLUIT[dayName] || dayName || 'deze dag'

  const options = [
    {
      key: 'all', Icon: Repeat,
      title: aantal && aantal > 1 ? `Overal (${aantal}×)` : 'Overal in je week',
      sub: 'blijvend, elke week',
      effect: plekkenTekst,
      uit: aantal === 0,
    },
    {
      key: 'day', Icon: CalendarDays,
      title: `Alleen ${dagVoluit}`,
      sub: 'blijvend, elke week op deze dag',
      effect: `past ${dagVoluit} ${SLOT_KORT[slot] || slot} aan, de andere dagen blijven zoals ze zijn`,
    },
    ...(isToday ? [{
      key: 'today', Icon: Zap,
      title: 'Alleen vandaag',
      sub: `eenmalig, ${vandaag}`,
      effect: 'je weekplan verandert niet; morgen staat het oude er weer',
    }] : []),
  ]

  return (
    <div style={{
      background: '#0a0a0a', borderTop: '1px solid rgba(255,255,255,0.12)',
      borderTopLeftRadius: isMobile ? 16 : 12, borderTopRightRadius: isMobile ? 16 : 12,
      maxWidth: isMobile ? '100%' : 620, width: '100%', margin: '0 auto',
      display: 'flex', flexDirection: 'column', maxHeight: '80vh', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.85rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {pending?.name || meal?.name || meal?.meal_name}
          </div>
          <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
            {Math.round(pending?.calories || 0)} kcal
            {diff.kcal !== 0 && (
              <span style={{ color: diff.kcal > 0 ? '#10b981' : '#ef4444', fontWeight: 700, marginLeft: 4 }}>
                {diff.kcal > 0 ? '+' : ''}{diff.kcal}
              </span>
            )} · {Math.round(pending?.protein || 0)}g E · {Math.round(pending?.carbs || 0)}g K · {Math.round(pending?.fat || 0)}g V
          </div>
        </div>
        <button onClick={onClose} disabled={busy} style={iconBtn}><X size={16} /></button>
      </div>

      {/* Prompt */}
      <div style={{ padding: '0.85rem 1rem 0.4rem' }}>
        <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>
          Waar geldt deze wijziging?
        </div>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
          Je kunt dit later altijd weer aanpassen.
        </div>
      </div>

      {/* Options */}
      <div style={{ padding: '0.5rem 1rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto' }}>
        {options.map(opt => {
          const Icon = opt.Icon
          const isSaving = saving === opt.key
          return (
            <button
              key={opt.key}
              onClick={() => !busy && !opt.uit && onChoose(opt.key)}
              disabled={busy || opt.uit}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: '0.75rem', textAlign: 'left',
                padding: '0.85rem 0.9rem', borderRadius: 12,
                cursor: (busy || opt.uit) ? 'default' : 'pointer',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.12)',
                opacity: (busy && !isSaving) || opt.uit ? 0.35 : 1,
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                fontFamily: 'inherit',
              }}
            >
              <div style={{
                width: 34, height: 34, borderRadius: 10, flexShrink: 0, marginTop: 1,
                background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {isSaving
                  ? <div style={{ width: 15, height: 15, border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#fff', borderRadius: '50%', animation: 'cmeSpin 0.8s linear infinite' }} />
                  : <Icon size={17} color="#fff" strokeWidth={2.4} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 7, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.015em' }}>{opt.title}</span>
                  <span style={{ fontSize: '0.66rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>{opt.sub}</span>
                </div>
                {/* Wat er daadwerkelijk verandert. Dit is de regel waarop je
                    kiest; de titel alleen zegt niet of het één plek is of zeven. */}
                <div style={{
                  fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.55)',
                  marginTop: 4, lineHeight: 1.35,
                }}>
                  {opt.effect}
                </div>
              </div>
            </button>
          )
        })}

        {error && (
          <div style={{ fontSize: '0.7rem', color: '#ef4444', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, padding: '0.5rem 0.6rem' }}>{error}</div>
        )}

        <button onClick={onBack} disabled={busy} style={{
          marginTop: '0.25rem', padding: '0.6rem', background: 'transparent',
          border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8,
          color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', fontWeight: 600,
          cursor: busy ? 'default' : 'pointer', touchAction: 'manipulation',
        }}>← Terug naar bewerken</button>
      </div>
    </div>
  )
}

const iconBtn = {
  width: 32, height: 32, borderRadius: 6, flexShrink: 0, background: 'transparent',
  border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
}
