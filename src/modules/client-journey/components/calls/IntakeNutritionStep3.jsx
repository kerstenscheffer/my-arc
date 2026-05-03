// src/modules/client-journey/components/calls/IntakeNutritionStep3.jsx
// v2 — Fixed: life_context als primaire bron voor cooking/budget/prep, fallback naar cd
import React from 'react'
import { Sparkles } from 'lucide-react'
import { C, QuestionBlock, StatBar } from './IntakeCallHelpers'


const HERO = 'https://images.unsplash.com/photo-1547592180-85f173990554?w=800&q=80'

export default function IntakeNutritionStep3({ cd, np, prac, stepNotes, setStepNotes, isMobile, onNext, onBack }) {
  const mealsPerDay = cd.meals_per_day || np?.meal_schedule?.num_meals || 5
  const mealLabels = ['Ontbijt', 'Lunch', 'Diner', 'Snack 1', 'Snack 2', 'Snack 3'].slice(0, mealsPerDay)

  const lc = np?.life_context || {}
  const cookLabels = { graag: 'Kookt graag', neutraal: 'Neutraal', niet_graag: 'Simpel & snel' }
  const prepLabels = { preppen: 'Prept vooruit', mix: 'Mix prep/vers', dagelijks: 'Elke dag bereiden', ja: 'Prept vooruit', nee: 'Elke dag vers' }

  // life_context als primaire bron, fallback naar cd/prac
  const cookingPref = cookLabels[lc.cooking_preference] || cookLabels[prac?.cooking_preference] || cd.cooking_skill || '—'
  const cookTime = lc.available_cook_time ? `${lc.available_cook_time} min` : (cd.cooking_time ? `${cd.cooking_time} min` : '—')
  const budget = lc.weekly_budget ? `€${lc.weekly_budget}` : (cd.budget_per_week ? `€${cd.budget_per_week}` : '—')
  const mealPrep = prepLabels[lc.meal_prep_preference] || '—'

  const addDay = () => {
    const current = stepNotes.dream_days || []
    setStepNotes(p => ({
      ...p,
      dream_days: [...current, { name: '', meals: mealLabels.map(l => ({ label: l, value: '' })) }]
    }))
  }

  const updateDayName = (idx, name) => {
    const updated = [...(stepNotes.dream_days || [])]
    updated[idx] = { ...updated[idx], name }
    setStepNotes(p => ({ ...p, dream_days: updated }))
  }

  const updateMeal = (dayIdx, mealIdx, value) => {
    const updated = [...(stepNotes.dream_days || [])]
    const meals = [...updated[dayIdx].meals]
    meals[mealIdx] = { ...meals[mealIdx], value }
    updated[dayIdx] = { ...updated[dayIdx], meals }
    setStepNotes(p => ({ ...p, dream_days: updated }))
  }

  const removeDay = (idx) => {
    setStepNotes(p => ({ ...p, dream_days: (p.dream_days || []).filter((_, i) => i !== idx) }))
  }

  const days = stepNotes.dream_days || []

  return (
    <div>
      {/* Hero */}
      <div style={{ position: 'relative', height: '100px', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${HERO})`, backgroundSize: 'cover', backgroundPosition: 'center 40%' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #0a0a0a 0%, rgba(0,0,0,0.3) 50%, transparent 100%)' }} />
        <div style={{ position: 'absolute', bottom: '0.5rem', left: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Sparkles size={16} color={C.gold} />
          <span style={{ fontSize: isMobile ? '0.9rem' : '1rem', fontWeight: 800, color: C.text }}>Jouw droomplan</span>
        </div>
      </div>

      {/* Context reminder */}
      <div style={{ borderLeft: `3px solid ${C.gold}`, borderBottom: `1px solid ${C.borderSub}` }}>
        <div style={{ padding: '0.4rem 0.75rem 0.15rem', fontSize: '0.4rem', fontWeight: 700, color: C.gold, textTransform: 'uppercase', letterSpacing: '0.06em' }}>DROOMPLAN</div>
        <div style={{ padding: '0.2rem 0.75rem 0.4rem', fontSize: isMobile ? '0.7rem' : '0.75rem', fontWeight: 600, color: C.text50, lineHeight: 1.5 }}>
          Vraag: <span style={{ color: C.text, fontWeight: 700 }}>"Als jij het perfecte mealplan zou hebben dat je lekker vindt én bij je doelen past — hoe ziet een dag eruit?"</span>
        </div>
      </div>

      {/* Quick reference: practical constraints — nu uit life_context */}
      <StatBar isMobile={isMobile} stats={[
        { label: 'KOKEN', value: cookingPref },
        { label: 'KOOKTIJD', value: cookTime },
        { label: 'MAALTIJDEN', value: mealsPerDay, unit: '/dag', color: C.green },
        { label: 'BUDGET', value: budget, unit: '/wk' }
      ]} />
      {mealPrep !== '—' && (
        <StatBar isMobile={isMobile} stats={[
          { label: 'MEAL PREP', value: mealPrep },
          lc.lunch_situation ? { label: 'LUNCH SITUATIE', value: { echte_pauze: 'Echte pauze', aan_bureau: 'Aan bureau', geen_pauze: 'Geen pauze' }[lc.lunch_situation] || lc.lunch_situation } : null,
          lc.snacking_possible ? { label: 'SNACKEN', value: { makkelijk: 'Ja', soms: 'Soms', nee: 'Nee' }[lc.snacking_possible] || lc.snacking_possible } : null
        ].filter(Boolean)} />
      )}

      {/* Dream Day Logger */}
      {days.map((day, dayIdx) => (
        <div key={dayIdx} style={{ borderBottom: `1px solid ${C.borderSub}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.35rem 0.75rem', borderBottom: `1px solid ${C.borderFaint}`, background: `${C.gold}06` }}>
            <div style={{
              width: '16px', height: '16px', borderRadius: '50%',
              background: `${C.gold}15`, border: `1px solid ${C.gold}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.35rem', fontWeight: 800, color: C.gold, flexShrink: 0
            }}>{dayIdx + 1}</div>
            <input
              value={day.name} onChange={e => updateDayName(dayIdx, e.target.value)}
              placeholder="Dag naam (bijv. Ideale doordeweekse dag...)"
              style={{
                flex: 1, padding: '0.15rem 0', background: 'transparent',
                border: 'none', borderBottom: `1px solid ${day.name ? C.gold : C.borderSub}`,
                color: day.name ? C.gold : C.text25,
                fontSize: isMobile ? '0.75rem' : '0.85rem', fontWeight: 700,
                outline: 'none', fontFamily: 'inherit', borderRadius: 0
              }}
            />
            <button onClick={() => removeDay(dayIdx)} style={{
              background: 'transparent', border: 'none', color: C.text15,
              fontSize: '0.6rem', cursor: 'pointer', padding: '0.1rem 0.2rem',
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
            }}>✕</button>
          </div>

          {day.meals.map((meal, mealIdx) => (
            <div key={mealIdx} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.25rem 0.75rem', borderBottom: `1px solid ${C.borderFaint}` }}>
              <span style={{
                fontSize: '0.4rem', fontWeight: 700, color: C.text25,
                textTransform: 'uppercase', letterSpacing: '0.05em',
                minWidth: '45px', flexShrink: 0
              }}>{meal.label}</span>
              <input
                value={meal.value} onChange={e => updateMeal(dayIdx, mealIdx, e.target.value)}
                placeholder={`Ideale ${meal.label.toLowerCase()}?`}
                style={{
                  flex: 1, padding: '0.2rem 0', background: 'transparent',
                  border: 'none', borderBottom: `1px solid ${meal.value ? C.borderSub : C.borderFaint}`,
                  color: C.text, fontSize: isMobile ? '0.65rem' : '0.7rem', fontWeight: 600,
                  outline: 'none', fontFamily: 'inherit', borderRadius: 0
                }}
              />
            </div>
          ))}
        </div>
      ))}

      <button onClick={addDay} style={{
        width: '100%', padding: '0.4rem 0.75rem',
        background: 'transparent', border: 'none',
        borderBottom: `1px solid ${C.borderSub}`,
        color: C.gold, fontSize: isMobile ? '0.65rem' : '0.7rem', fontWeight: 700,
        cursor: 'pointer', textAlign: 'left',
        touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
        display: 'flex', alignItems: 'center', gap: '0.3rem', minHeight: '36px'
      }}>
        <span style={{ fontSize: '0.8rem' }}>+</span> Droomdag toevoegen
      </button>

      <div style={{ height: '2px', background: `linear-gradient(90deg, ${C.green}40, transparent)` }} />

      <QuestionBlock q="Zijn er voedingsmiddelen die niet in het formulier staan maar belangrijk zijn?" value={stepNotes.nutrition_extra} onChange={v => setStepNotes(p => ({ ...p, nutrition_extra: v }))} isMobile={isMobile} />
      <QuestionBlock q="Meal prep: hoe wil je dit aanpakken? (zelf koken, prep Sunday, simpele recepten?)" value={stepNotes.meal_prep_approach} onChange={v => setStepNotes(p => ({ ...p, meal_prep_approach: v }))} isMobile={isMobile} />

      <div style={{ display: 'flex', gap: '0.5rem', padding: isMobile ? '0.75rem' : '1rem' }}>
        <button onClick={onBack} style={{
          padding: '0.625rem 1rem', background: 'transparent', border: `1px solid ${C.border}`,
          borderRadius: 0, color: C.text50, fontSize: isMobile ? '0.7rem' : '0.75rem', fontWeight: 700,
          cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: '44px'
        }}>← TERUG</button>
        <button onClick={onNext} style={{
          flex: 1, padding: '0.625rem',
          background: `linear-gradient(90deg, ${C.green}, #059669)`,
          border: 'none', borderRadius: 0, color: '#000',
          fontSize: isMobile ? '0.75rem' : '0.85rem', fontWeight: 800,
          cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: '44px'
        }}>DROOMPLAN BESPROKEN → BEVESTIGEN</button>
      </div>
    </div>
  )
}
