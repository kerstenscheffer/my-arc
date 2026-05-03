// src/modules/client-journey/components/calls/IntakeNutritionStep2.jsx
import React from 'react'
import { Clock, AlertTriangle } from 'lucide-react'
import { C, QuestionBlock } from './IntakeCallHelpers'

const HERO = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80'

const COOK_LABELS = { graag: 'Kookt graag', neutraal: 'Neutraal', niet_graag: 'Simpel & snel' }
const PREP_LABELS = { preppen: 'Prept vooruit', mix: 'Mix prep/vers', dagelijks: 'Elke dag', ja: 'Prept vooruit', nee: 'Elke dag vers' }
const CHEAT_FREQ_LABELS = { nooit: 'Geen', '1x_week': '1x/week', '2x_week': '2x/week', weekend: 'Weekend', als_nodig: 'Als nodig' }
const SOCIAL_TYPE_LABELS = { uit_eten: 'Uit eten', verjaardagen: 'Verjaardagen', stappen: 'Stappen', bbq: 'BBQ', zakelijk: 'Zakelijk', sport: 'Sport', thuisbezoek: 'Bezoek thuis' }

export default function IntakeNutritionStep2({ cd, np, getRemovals, stepNotes, setStepNotes, isMobile, onNext, onBack }) {
  const mealsPerDay = cd.meals_per_day || np?.meal_schedule?.num_meals || 5
  const hasProteinRemovals = getRemovals('protein_preferences').length > 0
  const hasCarbRemovals = getRemovals('carb_preferences').length > 0

  const lc = np?.life_context || {}
  const cm = np?.cheat_meals || {}
  const wi = np?.wishes || {}
  const al = np?.allergens || {}

  // Prefill waarden
  const cookPref = COOK_LABELS[lc.cooking_preference] || null
  const prepPref = PREP_LABELS[lc.meal_prep_preference] || null
  const budget = lc.weekly_budget ? `€${lc.weekly_budget}/week` : null
  const cookTime = lc.available_cook_time ? `${lc.available_cook_time} min` : cd.cooking_time ? `${cd.cooking_time} min` : null
  const lunchSit = { echte_pauze: 'Echte pauze', aan_bureau: 'Aan bureau', geen_pauze: 'Geen pauze' }[lc.lunch_situation] || null
  const snackPossible = { makkelijk: 'Ja, makkelijk', soms: 'Soms', nee: 'Nee' }[lc.snacking_possible] || null
  const workSit = { thuis: 'Thuiswerker', kantoor: 'Kantoor', fysiek: 'Fysiek werk', student: 'Student', wisselend: 'Wisselend' }[lc.work_situation] || null

  const discussionPoints = [
    `Maaltijden rond training (${cd.training_time ? cd.training_time.slice(0, 5) : '?'}) — pre/post workout`,
    hasProteinRemovals ? `Uitgesloten eiwitten: ${getRemovals('protein_preferences').join(', ')} — waarom?` : null,
    hasCarbRemovals ? `Uitgesloten carbs: ${getRemovals('carb_preferences').join(', ')} — waarom?` : null,
    'Weekend eetpatroon: anders dan doordeweeks?',
    cm.frequency && cm.frequency !== 'nooit' ? `Cheat meals: ${CHEAT_FREQ_LABELS[cm.frequency]} — hoe gaan we dat inbouwen?` : null,
    cm.social_types?.length > 0 ? `Sociale situaties: ${cm.social_types.map(t => SOCIAL_TYPE_LABELS[t] || t).join(', ')}` : null,
    al.diet_preference && al.diet_preference !== 'geen' ? `Dieet: ${al.diet_preference} — check of alles klopt` : null,
    'Boodschappen: wie doet het, hoe vaak?'
  ].filter(Boolean)

  return (
    <div>
      {/* Hero */}
      <div style={{ position: 'relative', height: '100px', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${HERO})`, backgroundSize: 'cover', backgroundPosition: 'center 40%' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #0a0a0a 0%, rgba(0,0,0,0.3) 50%, transparent 100%)' }} />
        <div style={{ position: 'absolute', bottom: '0.5rem', left: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Clock size={16} color={C.red} />
          <span style={{ fontSize: isMobile ? '0.9rem' : '1rem', fontWeight: 800, color: C.text }}>Wat eet je nu?</span>
        </div>
      </div>

      {/* Instructie */}
      <div style={{ borderLeft: `3px solid ${C.red}`, borderBottom: `1px solid ${C.borderSub}` }}>
        <div style={{ padding: '0.4rem 0.75rem 0.15rem', fontSize: '0.4rem', fontWeight: 700, color: C.red, textTransform: 'uppercase', letterSpacing: '0.06em' }}>HUIDIG EETPATROON</div>
        <div style={{ padding: '0.2rem 0.75rem 0.4rem', fontSize: isMobile ? '0.7rem' : '0.75rem', fontWeight: 600, color: C.text50, lineHeight: 1.5 }}>
          Vraag: <span style={{ color: C.text, fontWeight: 700 }}>"Beschrijf een typische eetdag."</span>
        </div>
      </div>

      {/* Meal Day Logger */}
      <MealDayLogger
        days={stepNotes.current_days || []}
        onChange={v => setStepNotes(p => ({ ...p, current_days: v }))}
        mealsPerDay={mealsPerDay}
        isMobile={isMobile}
        accentColor={C.red}
      />

      <div style={{ height: '2px', background: `linear-gradient(90deg, ${C.gold}40, transparent)` }} />

      {/* Bespreekpunten */}
      <div style={{ borderLeft: `3px solid ${C.gold}` }}>
        <div style={{ padding: '0.4rem 0.75rem 0.15rem', fontSize: '0.4rem', fontWeight: 700, color: C.gold, textTransform: 'uppercase', letterSpacing: '0.06em' }}>BESPREEK TIJDENS DE CALL</div>
        <div style={{ padding: '0.3rem 0.75rem', borderBottom: `1px solid ${C.borderSub}` }}>
          {discussionPoints.map((item, i) => (
            <div key={i} style={{ fontSize: isMobile ? '0.75rem' : '0.85rem', fontWeight: 600, color: C.text50, padding: '0.2rem 0', borderBottom: i < discussionPoints.length - 1 ? `1px solid ${C.borderFaint}` : 'none' }}>
              <span style={{ color: C.gold, marginRight: '0.3rem' }}>•</span>{item}
            </div>
          ))}
        </div>
      </div>

      <div style={{ height: '2px', background: `linear-gradient(90deg, ${C.green}40, transparent)` }} />

      {/* Vragen MET prefill */}
      <PrefQ
        q="Hoe vaak eet je buiten de deur of bestel je?"
        prefill={[
          cm.social_frequency && `Sociaal: ${cm.social_frequency}`,
          cm.social_types?.length > 0 && `Situaties: ${cm.social_types.map(t => SOCIAL_TYPE_LABELS[t] || t).join(', ')}`,
          lc.work_situation && `Werk: ${workSit}`,
        ].filter(Boolean)}
        value={stepNotes.eating_out}
        onChange={v => setStepNotes(p => ({ ...p, eating_out: v }))}
        isMobile={isMobile}
      />
      <PrefQ
        q="Sla je regelmatig maaltijden over? Welke?"
        prefill={[
          lunchSit && `Lunch situatie: ${lunchSit}`,
          snackPossible && `Tussendoor: ${snackPossible}`,
        ].filter(Boolean)}
        value={stepNotes.skipping_meals}
        onChange={v => setStepNotes(p => ({ ...p, skipping_meals: v }))}
        isMobile={isMobile}
      />
      <PrefQ
        q="Hoe ga je om met koken en meal prep?"
        prefill={[
          cookPref && `Koken: ${cookPref}`,
          cookTime && `Kooktijd: ${cookTime}`,
          prepPref && `Prep stijl: ${prepPref}`,
          budget && `Budget: ${budget}`,
        ].filter(Boolean)}
        value={stepNotes.cooking_approach}
        onChange={v => setStepNotes(p => ({ ...p, cooking_approach: v }))}
        isMobile={isMobile}
      />
      <PrefQ
        q="Hoe ga je om met cheat meals en sociale situaties?"
        prefill={[
          cm.frequency && `Frequentie: ${CHEAT_FREQ_LABELS[cm.frequency]}`,
          cm.approach && `Aanpak: ${{ strict_plan: 'Geen uitzonderingen', one_free_meal: '1 vrije maaltijd', flexible_weekend: 'Weekend flexibel', macro_fit: 'Macro-fit' }[cm.approach] || cm.approach}`,
          cm.social_types?.length > 0 && `Sociaal: ${cm.social_types.map(t => SOCIAL_TYPE_LABELS[t] || t).join(', ')}`,
        ].filter(Boolean)}
        value={stepNotes.cheat_approach}
        onChange={v => setStepNotes(p => ({ ...p, cheat_approach: v }))}
        isMobile={isMobile}
      />
      <PrefQ
        q="Grootste voedings-uitdaging op dit moment?"
        prefill={[
          wi.absolute_no && `Absoluut niet: ${wi.absolute_no}`,
          hasProteinRemovals && `Uitgesloten: ${getRemovals('protein_preferences').slice(0, 3).join(', ')}`,
        ].filter(Boolean)}
        value={stepNotes.biggest_challenge}
        onChange={v => setStepNotes(p => ({ ...p, biggest_challenge: v }))}
        isMobile={isMobile}
      />
      {/* Wishes context */}
      {(wi.current_eating || wi.favorite_meals || wi.general_notes) && (
        <div style={{ borderLeft: `3px solid ${C.gold}` }}>
          <div style={{ padding: '0.4rem 0.75rem 0.15rem', fontSize: '0.4rem', fontWeight: 700, color: C.gold, textTransform: 'uppercase', letterSpacing: '0.06em' }}>WENSEN UIT FORMULIER</div>
          {wi.current_eating && <InfoRow label="HUIDIG EETPATROON" value={wi.current_eating} isMobile={isMobile} />}
          {wi.favorite_meals && <InfoRow label="FAVORIETE MAALTIJDEN" value={wi.favorite_meals} color={C.green} isMobile={isMobile} />}
          {wi.desired_ingredients && <InfoRow label="WIL GRAAG" value={wi.desired_ingredients} color={C.green} isMobile={isMobile} />}
          {wi.absolute_no && <InfoRow label="ABSOLUUT NIET" value={wi.absolute_no} color={C.red} isMobile={isMobile} />}
          {wi.general_notes && <InfoRow label="OPMERKING" value={wi.general_notes} isMobile={isMobile} />}
        </div>
      )}

      {/* Navigation */}
      <div style={{ display: 'flex', gap: '0.5rem', padding: isMobile ? '0.75rem' : '1rem' }}>
        <button onClick={onBack} style={{ padding: '0.625rem 1rem', background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 0, color: C.text50, fontSize: isMobile ? '0.7rem' : '0.75rem', fontWeight: 700, cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: '44px' }}>← TERUG</button>
        <button onClick={onNext} style={{ flex: 1, padding: '0.625rem', background: `linear-gradient(90deg, ${C.green}, #059669)`, border: 'none', borderRadius: 0, color: '#000', fontSize: isMobile ? '0.75rem' : '0.85rem', fontWeight: 800, cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: '44px' }}>EETPATROON BESPROKEN → DROOMPLAN</button>
      </div>
    </div>
  )
}

// ── PREFILL QUESTION ──
function PrefQ({ q, prefill = [], value, onChange, isMobile }) {
  return (
    <div style={{ padding: isMobile ? '0.5rem 0.75rem' : '0.625rem 1rem', borderBottom: `1px solid ${C.borderSub}` }}>
      <div style={{ fontSize: isMobile ? '0.85rem' : '0.95rem', fontWeight: 700, color: C.text, lineHeight: 1.35, marginBottom: prefill.length ? '0.2rem' : '0.3rem' }}>{q}</div>
      {prefill.length > 0 && (
        <div style={{ marginBottom: '0.25rem', display: 'flex', flexDirection: 'column', gap: '0.08rem' }}>
          {prefill.map((p, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.25rem' }}>
              <span style={{ fontSize: '0.35rem', fontWeight: 700, color: C.green, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.1rem', flexShrink: 0 }}>DATA</span>
              <span style={{ fontSize: isMobile ? '0.65rem' : '0.7rem', fontWeight: 600, color: C.green, lineHeight: 1.4 }}>{p}</span>
            </div>
          ))}
        </div>
      )}
      <textarea value={value || ''} onChange={e => onChange(e.target.value)} placeholder="Notitie / aanvulling..." rows={2}
        style={{ width: '100%', padding: '0.2rem 0', background: 'transparent', border: 'none', borderBottom: `1px solid ${value ? C.borderSub : C.borderFaint}`, color: C.text, fontSize: isMobile ? '0.7rem' : '0.75rem', fontWeight: 600, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', resize: 'none', lineHeight: 1.5, borderRadius: 0 }} />
    </div>
  )
}

function InfoRow({ label, value, color, isMobile }) {
  if (!value) return null
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '0.2rem 0.75rem', borderBottom: `1px solid ${C.borderFaint}`, gap: '0.5rem' }}>
      <span style={{ fontSize: '0.4rem', fontWeight: 700, color: C.text25, textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: isMobile ? '0.7rem' : '0.75rem', fontWeight: 700, color: color || C.text50, textAlign: 'right', maxWidth: '70%', lineHeight: 1.3 }}>{value}</span>
    </div>
  )
}

function MealDayLogger({ days, onChange, mealsPerDay, isMobile, accentColor }) {
  const mealLabels = ['Ontbijt', 'Lunch', 'Diner', 'Snack 1', 'Snack 2', 'Snack 3'].slice(0, mealsPerDay)
  const addDay = () => onChange([...days, { name: '', meals: mealLabels.map(l => ({ label: l, value: '' })) }])
  const updateDayName = (idx, name) => { const u = [...days]; u[idx] = { ...u[idx], name }; onChange(u) }
  const updateMeal = (di, mi, value) => { const u = [...days]; const m = [...u[di].meals]; m[mi] = { ...m[mi], value }; u[di] = { ...u[di], meals: m }; onChange(u) }
  const removeDay = (idx) => onChange(days.filter((_, i) => i !== idx))
  return (
    <div>
      {days.map((day, di) => (
        <div key={di} style={{ borderBottom: `1px solid ${C.borderSub}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.35rem 0.75rem', borderBottom: `1px solid ${C.borderFaint}`, background: `${accentColor}06` }}>
            <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: `${accentColor}15`, border: `1px solid ${accentColor}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.35rem', fontWeight: 800, color: accentColor, flexShrink: 0 }}>{di + 1}</div>
            <input value={day.name} onChange={e => updateDayName(di, e.target.value)} placeholder="Dag naam (bijv. Doordeweeks, Zaterdag...)"
              style={{ flex: 1, padding: '0.15rem 0', background: 'transparent', border: 'none', borderBottom: `1px solid ${day.name ? accentColor : C.borderSub}`, color: day.name ? accentColor : C.text25, fontSize: isMobile ? '0.75rem' : '0.85rem', fontWeight: 700, outline: 'none', fontFamily: 'inherit', borderRadius: 0 }} />
            <button onClick={() => removeDay(di)} style={{ background: 'transparent', border: 'none', color: C.text15, fontSize: '0.6rem', cursor: 'pointer', padding: '0.1rem 0.2rem', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>✕</button>
          </div>
          {day.meals.map((meal, mi) => (
            <div key={mi} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.25rem 0.75rem', borderBottom: `1px solid ${C.borderFaint}` }}>
              <span style={{ fontSize: '0.4rem', fontWeight: 700, color: C.text25, textTransform: 'uppercase', letterSpacing: '0.05em', minWidth: '45px', flexShrink: 0 }}>{meal.label}</span>
              <input value={meal.value} onChange={e => updateMeal(di, mi, e.target.value)} placeholder={`Wat eet je als ${meal.label.toLowerCase()}?`}
                style={{ flex: 1, padding: '0.2rem 0', background: 'transparent', border: 'none', borderBottom: `1px solid ${meal.value ? C.borderSub : C.borderFaint}`, color: C.text, fontSize: isMobile ? '0.65rem' : '0.7rem', fontWeight: 600, outline: 'none', fontFamily: 'inherit', borderRadius: 0 }} />
            </div>
          ))}
        </div>
      ))}
      <button onClick={addDay} style={{ width: '100%', padding: '0.4rem 0.75rem', background: 'transparent', border: 'none', borderBottom: `1px solid ${C.borderSub}`, color: accentColor, fontSize: isMobile ? '0.65rem' : '0.7rem', fontWeight: 700, cursor: 'pointer', textAlign: 'left', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', display: 'flex', alignItems: 'center', gap: '0.3rem', minHeight: '36px' }}>
        <span style={{ fontSize: '0.8rem' }}>+</span> Dag toevoegen
      </button>
    </div>
  )
}
