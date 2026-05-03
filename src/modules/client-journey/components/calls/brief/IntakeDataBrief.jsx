// src/modules/client-journey/components/calls/brief/IntakeDataBrief.jsx
// v2 — Inklapbare secties, compact, data-driven
import React, { useState } from 'react'
import { ChevronDown, ChevronRight, AlertTriangle, Zap } from 'lucide-react'

const C = {
  gold: '#FFD700', green: '#10b981', red: '#ef4444', amber: '#f59e0b', blue: '#3b82f6',
  text: '#ffffff',
  text50: 'rgba(255,255,255,0.5)',
  text25: 'rgba(255,255,255,0.25)',
  text15: 'rgba(255,255,255,0.15)',
  border: 'rgba(255,255,255,0.06)',
  borderSub: 'rgba(255,255,255,0.04)',
}

const GOAL_LABELS = {
  fat_loss: 'Vetverlies', muscle_gain: 'Spieropbouw',
  recomp: 'Body Recomp', general_fitness: 'Fitter worden',
}
const GOAL_COLORS = {
  fat_loss: C.red, muscle_gain: C.blue,
  recomp: C.green, general_fitness: C.amber,
}
const ACTIVITY_LABELS = {
  sedentary: 'Zittend', lightly_active: 'Licht actief',
  moderately_active: 'Matig actief', very_active: 'Zeer actief',
}
const COACHING_LABELS = {
  direct: 'Hard & direct', motivating: 'Motiverend',
  data_driven: 'Data-driven', relaxed: 'Relaxed',
}
const EXPERIENCE_LABELS = {
  beginner: 'Beginner', intermediate: 'Gevorderd', advanced: 'Expert',
}

// Inklapbare sectie
function Section({ label, icon, children, defaultOpen = true, accent, warning }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{ borderBottom: `1px solid ${C.borderSub}` }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: '6px',
        padding: '6px 12px', background: 'transparent', border: 'none',
        cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
      }}>
        <span style={{ fontSize: '9px', fontWeight: 800, color: accent || C.text25, textTransform: 'uppercase', letterSpacing: '0.08em', flex: 1, textAlign: 'left' }}>
          {label}
        </span>
        {warning && <AlertTriangle size={10} color={C.amber} />}
        {open
          ? <ChevronDown size={10} color={C.text25} />
          : <ChevronRight size={10} color={C.text25} />
        }
      </button>
      {open && (
        <div style={{ paddingBottom: '6px' }}>
          {children}
        </div>
      )}
    </div>
  )
}

// Simpele rij
function Row({ label, value, color, sub }) {
  if (!value && value !== 0) return null
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
      padding: '2px 12px', gap: '6px',
    }}>
      <span style={{ fontSize: '10px', color: C.text25, flexShrink: 0 }}>{label}</span>
      <div style={{ textAlign: 'right' }}>
        <span style={{ fontSize: '10px', fontWeight: 700, color: color || C.text50, lineHeight: 1.4 }}>{value}</span>
        {sub && <div style={{ fontSize: '8px', color: C.text15 }}>{sub}</div>}
      </div>
    </div>
  )
}

// Vlag voor warnings / opmerkingen
function Flag({ label, value, color }) {
  if (!value) return null
  return (
    <div style={{
      margin: '3px 12px', padding: '4px 8px',
      background: `${color}06`, border: `1px solid ${color}18`,
      borderLeft: `2px solid ${color}`, borderRadius: '0 4px 4px 0',
    }}>
      <span style={{ fontSize: '8px', fontWeight: 800, color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </span>
      <div style={{ fontSize: '10px', color: C.text50, marginTop: '2px', lineHeight: 1.4 }}>
        {value}
      </div>
    </div>
  )
}

// Macro blok — horizontaal
function MacroBar({ kcal, prot, carbs, fat }) {
  if (!kcal) return null
  return (
    <div style={{ margin: '4px 12px 2px', display: 'flex', gap: '4px' }}>
      <div style={{ flex: 2, padding: '4px 6px', background: 'rgba(255,215,0,0.06)', border: '1px solid rgba(255,215,0,0.15)', borderRadius: '4px', textAlign: 'center' }}>
        <div style={{ fontSize: '13px', fontWeight: 800, color: C.gold, lineHeight: 1 }}>{kcal}</div>
        <div style={{ fontSize: '7px', color: C.text25, textTransform: 'uppercase', letterSpacing: '0.05em' }}>kcal</div>
      </div>
      {[['E', prot, C.green], ['K', carbs, C.blue], ['V', fat, C.amber]].map(([l, v, c]) => v ? (
        <div key={l} style={{ flex: 1, padding: '4px 4px', background: `${c}06`, border: `1px solid ${c}15`, borderRadius: '4px', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', fontWeight: 800, color: c, lineHeight: 1 }}>{v}</div>
          <div style={{ fontSize: '7px', color: C.text25, textTransform: 'uppercase' }}>{l}</div>
        </div>
      ) : null)}
    </div>
  )
}

export default function IntakeDataBrief({ cd, np, wp, isMobile }) {
  if (!cd) return null

  const age = cd.date_of_birth
    ? Math.floor((Date.now() - new Date(cd.date_of_birth)) / 31557600000)
    : cd.age

  const bf = cd.current_body_fat && cd.current_body_fat_2
    ? Math.round((cd.current_body_fat + cd.current_body_fat_2) / 2)
    : cd.current_body_fat || null

  const kgDiff = cd.current_weight && cd.target_weight
    ? (Number(cd.target_weight) - Number(cd.current_weight)).toFixed(1)
    : null

  const isCut = Number(kgDiff) < 0
  const goalColor = GOAL_COLORS[cd.primary_goal] || C.gold

  const allergens = [...(np?.allergens?.selected_allergens || []), ...(np?.allergens?.intolerances || [])].filter(Boolean)
  const notLekker = np?.wishes?.niet_lekker || []
  const dietPref = np?.allergens?.diet_preference
  const hasRestrictions = allergens.length > 0 || notLekker.length > 0 || (dietPref && dietPref !== 'geen')

  const injuries = wp?.injuries
  const avoided = wp?.avoided_exercises
  const sleepWarning = cd.sleep_hours && parseFloat(cd.sleep_hours) < 7
  const stressWarning = cd.stress_level && parseInt(cd.stress_level) >= 7
  const hasLifestyleWarning = sleepWarning || stressWarning

  const trainingDays = (() => {
    try {
      const raw = cd.preferred_training_days
      if (!raw) return null
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
      return Array.isArray(parsed) && parsed[0] !== 'flexible' ? parsed.join(', ') : null
    } catch { return null }
  })()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', background: '#0a0a0a', minHeight: '100%' }}>

      {/* Client header */}
      <div style={{ padding: '10px 12px', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        <div style={{ fontSize: '13px', fontWeight: 800, color: C.text, lineHeight: 1.2 }}>
          {cd.first_name} {cd.last_name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
          {cd.primary_goal && (
            <span style={{
              fontSize: '8px', fontWeight: 800, color: goalColor,
              background: `${goalColor}12`, border: `1px solid ${goalColor}25`,
              borderRadius: '3px', padding: '1px 6px', textTransform: 'uppercase', letterSpacing: '0.05em',
            }}>
              {GOAL_LABELS[cd.primary_goal] || cd.primary_goal}
            </span>
          )}
          {cd.goal_urgency && parseInt(cd.goal_urgency) >= 7 && (
            <span style={{ fontSize: '8px', fontWeight: 800, color: C.amber, display: 'flex', alignItems: 'center', gap: '2px' }}>
              <Zap size={9} /> urgentie {cd.goal_urgency}/10
            </span>
          )}
        </div>
      </div>

      {/* Scroll body */}
      <div>

        {/* FYSIEK + DOEL — altijd open, meest kritisch */}
        <Section label="Fysiek & doel" accent={goalColor} defaultOpen={true}>
          {/* Gewicht visueel */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 12px 6px', borderBottom: `1px solid ${C.borderSub}` }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: 800, color: C.text, lineHeight: 1 }}>{cd.current_weight}</div>
              <div style={{ fontSize: '7px', color: C.text25, textTransform: 'uppercase' }}>huidig</div>
            </div>
            <div style={{ flex: 1, height: '1px', background: C.borderSub, position: 'relative' }}>
              {kgDiff && (
                <div style={{
                  position: 'absolute', top: '-8px', left: '50%', transform: 'translateX(-50%)',
                  fontSize: '9px', fontWeight: 800, color: isCut ? C.red : C.green,
                  whiteSpace: 'nowrap',
                }}>
                  {Number(kgDiff) > 0 ? '+' : ''}{kgDiff} kg
                </div>
              )}
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: 800, color: goalColor, lineHeight: 1 }}>{cd.target_weight || '?'}</div>
              <div style={{ fontSize: '7px', color: C.text25, textTransform: 'uppercase' }}>doel</div>
            </div>
          </div>
          <Row label="Lengte" value={cd.height ? `${cd.height} cm` : null} />
          <Row label="Leeftijd" value={age ? `${age} jr` : null} />
          {bf && <Row label="Vet%" value={`${bf}%`} color={bf > 25 ? C.amber : C.text50} />}
          {cd.target_body_fat && <Row label="Vet% doel" value={`${cd.target_body_fat}%`} color={goalColor} />}
          <Row label="Urgentie" value={cd.goal_urgency ? `${cd.goal_urgency}/10` : null}
            color={parseInt(cd.goal_urgency) >= 8 ? C.amber : C.text50} />
          <Row label="Tijdlijn" value={cd.goal_timeline ? {
            '3': '3 mnd', '6': '6 mnd', '12': '12 mnd', no_rush: 'Geen haast'
          }[cd.goal_timeline] || cd.goal_timeline : null} />
          {cd.motivation && (
            <Flag label="Motivatie" value={cd.motivation} color={goalColor} />
          )}
          {cd.biggest_obstacle && (
            <Flag label="Obstakel" value={cd.biggest_obstacle} color={C.red} />
          )}
        </Section>

        {/* MACRO TARGETS */}
        <Section label="Macro targets" accent={C.gold} defaultOpen={true}>
          <MacroBar
            kcal={cd.target_calories}
            prot={cd.target_protein}
            carbs={cd.target_carbs}
            fat={cd.target_fat}
          />
          <Row label="TDEE" value={cd.tdee ? `${cd.tdee} kcal` : null} />
        </Section>

        {/* TRAINING */}
        <Section label="Training" accent={C.blue} defaultOpen={true} warning={!!injuries}>
          <Row label="Sessies/week" value={cd.workout_days_per_week ? `${cd.workout_days_per_week}x` : null} />
          {trainingDays && <Row label="Dagen" value={trainingDays} />}
          <Row label="Trainingstijd" value={wp?.training_time ? wp.training_time.substring(0,5) : null} color={C.gold} />
          <Row label="Niveau" value={EXPERIENCE_LABELS[wp?.default_experience_level] || null} />
          <Row label="Locatie" value={{ gym: 'Sportschool', home: 'Thuis', both: 'Gym + thuis' }[wp?.training_location] || null} />
          <Row label="Sessieduur" value={wp?.default_time_per_session ? `${wp.default_time_per_session} min` : null} />
          <Row label="Cardio" value={
            wp?.cardio_interest === 'yes' ? `Ja${wp.cardio_frequency ? ` · ${wp.cardio_frequency}x/week` : ''}` :
            wp?.cardio_interest === 'maybe' ? 'Misschien' :
            wp?.cardio_interest === 'no' ? 'Nee' : null
          } color={wp?.cardio_interest === 'yes' ? C.green : wp?.cardio_interest === 'no' ? C.text25 : null} />
          {injuries && <Flag label="⚠ Blessure" value={injuries} color={C.red} />}
          {avoided && <Flag label="Vermijden" value={avoided} color={C.amber} />}
        </Section>

        {/* VOEDING */}
        <Section label="Voeding" accent={C.green} defaultOpen={true} warning={hasRestrictions}>
          <Row label="Maaltijden" value={np?.meal_schedule?.num_meals ? `${np.meal_schedule.num_meals}x/dag` : null} />
          <Row label="Kooktijd" value={cd.cooking_time ? `${cd.cooking_time} min` : null} />
          <Row label="Budget" value={np?.life_context?.weekly_budget ? `€${np.life_context.weekly_budget}/week` : null} />
          <Row label="Koken" value={{
            graag: 'Kookt graag', neutraal: 'Maakt niet uit', niet_graag: 'Zo min mogelijk'
          }[np?.life_context?.cooking_preference] || null} />
          <Row label="Cheat" value={{
            nooit: 'Geen', '1x_week': '1x/week', weekend: 'Weekend', als_nodig: 'Als nodig'
          }[np?.cheat_meals?.frequency] || null} />
          <Row label="Supplementen" value={{
            ja_graag: 'Ja', basics: 'Basics', liever_niet: 'Liever niet', nee: 'Nee'
          }[np?.supplement_preferences?.openness] || null} />
          {hasRestrictions && (
            <Flag
              label="⚠ Restricties"
              value={[
                dietPref && dietPref !== 'geen' ? dietPref : null,
                allergens.length ? allergens.join(', ') : null,
                notLekker.length ? `Niet lekker: ${notLekker.slice(0, 3).join(', ')}` : null,
              ].filter(Boolean).join(' · ')}
              color={C.amber}
            />
          )}
        </Section>

        {/* LEEFSTIJL */}
        <Section label="Leefstijl" defaultOpen={hasLifestyleWarning} warning={hasLifestyleWarning}>
          <Row label="Slaap" value={cd.sleep_hours ? `${cd.sleep_hours} uur` : null}
            color={sleepWarning ? C.amber : null} />
          <Row label="Stress" value={cd.stress_level ? `${cd.stress_level}/10` : null}
            color={stressWarning ? C.amber : null} />
          <Row label="Activiteit" value={ACTIVITY_LABELS[cd.activity_level] || null} />
          <Row label="Werk" value={cd.work_situation || null} />
        </Section>

        {/* COACHING */}
        <Section label="Coaching" defaultOpen={false}>
          <Row label="Eerder gecoacht" value={cd.previous_coaching} />
          <Row label="Stijl voorkeur" value={COACHING_LABELS[cd.coaching_style_pref] || cd.coaching_style_pref} />
          {cd.waarom_gestopt && <Flag label="Gestopt omdat" value={cd.waarom_gestopt} color={C.amber} />}
          {cd.coaching_expectations && (
            <Flag label="Verwacht" value={cd.coaching_expectations} color={C.gold} />
          )}
        </Section>

        <div style={{ height: '16px' }} />
      </div>
    </div>
  )
}
