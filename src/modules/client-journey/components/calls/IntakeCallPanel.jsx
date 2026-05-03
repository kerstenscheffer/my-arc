// src/modules/client-journey/components/calls/IntakeCallPanel.jsx
// v7 — Volledig herbouwd: data brief + lineaire 6-staps flow
import React, { useCallback, useEffect, useState } from 'react'
import { Target, Dumbbell, Utensils, FileText, CheckSquare } from 'lucide-react'
import { createPortal } from 'react-dom'

import IntakeDataBrief from './brief/IntakeDataBrief'
import IntakeStepDoel from './steps/IntakeStepDoel'
import IntakeStepPlan from './steps/IntakeStepPlan'
import IntakeStepTraining from './steps/IntakeStepTraining'
import IntakeStepVoeding from './steps/IntakeStepVoeding'
import IntakeStepAfspraken from './steps/IntakeStepAfspraken'
import IntakeStepOutput from './steps/IntakeStepOutput'

import { useIntakeState } from './hooks/useIntakeState'
import { useIntakeCalc } from './hooks/useIntakeCalc'
import { useIntakeAutoSave } from './hooks/useIntakeAutoSave'

const C = {
  gold: '#FFD700', green: '#10b981', blue: '#3b82f6',
  text: '#ffffff', text50: 'rgba(255,255,255,0.5)',
  text25: 'rgba(255,255,255,0.25)',
  border: 'rgba(255,255,255,0.06)', borderSub: 'rgba(255,255,255,0.04)',
  bg: '#0a0a0a',
}

const STEPS = [
  { id: 'doel',      label: 'Doel',      icon: Target },
  { id: 'training',  label: 'Training',  icon: Dumbbell },
  { id: 'voeding',   label: 'Voeding',   icon: Utensils },
  { id: 'plan',      label: 'Plan',      icon: Target },
  { id: 'afspraken', label: 'Afspraken', icon: FileText },
  { id: 'output',    label: 'Output',    icon: CheckSquare },
]

const BRIEF_WIDTH = 220

// ── DEV: preset data voor sneltesten ─────────────────────────────────────────
const DEV_PRESET = {
  planState: {
    deficitPreset: 'moderate',
    manualCal: '',
    cardioSessions: 2,
    cheatDays: 1,
    cheatDayCal: 500,
  },
  notes: {
    doel: {
      doel: 'Lean bulk — zo weinig mogelijk vet erbij · Meer volume in schouders/borst/benen',
      aanpak: 'Lean bulk — massa met zo weinig mogelijk vet',
      blokkades: 'Geen structuur in mijn training · Nu is het anders want...',
    },
    plan: {
      delivery: 'Trainingsschema op maat (hypertrofie)\nVoedingsschema op maat (bulk)\nSurplus + macro\'s instellen',
    },
    training: {
      aanpak: 'Ik train al — wil dit combineren',
      schema: 'ppl',
      blessures: 'Test blessure knie',
    },
    voeding: {
      aanpak: 'Meer eiwitten · Maaltijden plannen en preppen',
      notitie: 'Eet graag kip en rijst',
    },
    afspraken: {
      startdatum: 'Maandag 14 april',
      call_freq: 'Elke 2 weken op dinsdag 19:00',
      whatsapp: 'Reactie binnen 24 uur op werkdagen',
      notitie: '',
    },
  },
  coachingLevel: 'A',
}

export default function IntakeCallPanel({ db, client, journey, weekNumber, totalWeeks, isMobile }) {
  const [cd, setCd] = useState(null)
  const [np, setNp] = useState(null)
  const [wp, setWp] = useState(null)
  const [weekSchedule, setWeekSchedule] = useState(null)
  const [loading, setLoading] = useState(true)

  // Centrale state
  const {
    activeStep, completedSteps, goToStep, completeStep,
    planState, updatePlan, setPlanState,
    notes, updateNotes,
    coachingLevel, setCoachingLevel,
    setCompletedSteps,
  } = useIntakeState()

  // Macro berekening — notes meegeven zodat goal step leidend is
  const result = useIntakeCalc(cd, wp, planState, notes)

  // Auto-save: alle notes + planState → client_journeys.coaching_plan bij elke wijziging
  useIntakeAutoSave({ db, journey, notes, planState, coachingLevel, result })

  // Data laden
  const load = useCallback(async () => {
    if (!db?.supabase || !client?.id) { setLoading(false); return }
    setLoading(true)
    try {
      const { data: c } = await db.supabase
        .from('clients').select('*').eq('id', client.id).single()
      setCd(c)
      console.log('📋 IntakeCallPanel | client geladen:', {
        naam: `${c?.first_name} ${c?.last_name}`,
        doel: c?.primary_goal,
        gewicht: c?.current_weight,
        doel_gewicht: c?.target_weight,
        tdee: c?.tdee,
        target_cal: c?.target_calories,
        coaching_level: c?.coaching_style_pref,
      })

      const { data: n } = await db.supabase
        .from('nutrition_preferences').select('*')
        .eq('client_id', client.id).order('created_at', { ascending: false }).limit(1)
      if (n?.[0]) {
        setNp(n[0])
        console.log('🥗 IntakeCallPanel | voeding geladen:', {
          dieet: n[0]?.allergens?.diet_preference,
          allergenen: n[0]?.allergens?.selected_allergens,
          maaltijden: n[0]?.meal_schedule?.num_meals,
          budget: n[0]?.life_context?.weekly_budget,
          cheat: n[0]?.cheat_meals?.frequency,
        })
      }

      if (c?.auth_user_id) {
        const { data: w } = await db.supabase
          .from('user_workout_preferences').select('*')
          .eq('user_id', c.auth_user_id).limit(1)
        if (w?.[0]) {
          setWp(w[0])
          console.log('💪 IntakeCallPanel | training geladen:', {
            niveau: w[0]?.default_experience_level,
            locatie: w[0]?.training_location,
            sessieduur: w[0]?.default_time_per_session,
            cardio: w[0]?.cardio_interest,
            blessures: w[0]?.injuries,
          })

          // Bouw weekSchedule: work_schedule + training blokken
          buildWeekSchedule(c, n?.[0], w[0])
        }
      }
    } catch (e) { console.error('❌ IntakeCallPanel load:', e) }
    setLoading(false)
  }, [db, client?.id])

  // Bouw het volledige weekschema voor de kalender
  const buildWeekSchedule = useCallback((c, npData, wpData) => {
    try {
      // 1. Start met workout_schedule (slaap + werk blokken — WeekBuilder output)
      let schedule = {}
      const rawSchedule = c?.workout_schedule || c?.work_schedule
      if (rawSchedule) {
        const parsed = typeof rawSchedule === 'string' ? JSON.parse(rawSchedule) : rawSchedule
        schedule = parsed || {}
      }

      // 2. Trainingsdagen — preferred_training_days uit clients (text[])
      let trainingDays = []
      if (c?.preferred_training_days) {
        const raw = c.preferred_training_days
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0] !== 'flexible') {
          trainingDays = parsed
        }
      }
      // Fallback: nutrition_preferences.training.training_days
      if (!trainingDays.length && npData?.training?.training_days?.length) {
        trainingDays = npData.training.training_days
      }

      // 3. Trainingstijd uit wp.training_time (HH:MM:SS → HH:MM)
      if (trainingDays.length > 0 && wpData?.training_time) {
        const tRaw = wpData.training_time.substring(0, 5)
        const [h, min] = tRaw.split(':').map(Number)
        const endMin = h * 60 + min + 75
        const endH = Math.floor(endMin / 60) % 24
        const endM = endMin % 60
        const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`

        trainingDays.forEach(day => {
          schedule[day] = [
            ...(schedule[day] || []).filter(b => b.type !== 'training'),
            { type: 'training', start: tRaw, end: endTime },
          ]
        })
      }

      if (Object.keys(schedule).length > 0) {
        setWeekSchedule(schedule)
        console.log('📅 weekSchedule gebouwd:', {
          bronVeld: c?.workout_schedule ? 'workout_schedule' : c?.work_schedule ? 'work_schedule' : 'leeg',
          trainingDays,
          trainingstijd: wpData?.training_time,
        })
      } else {
        console.warn('⚠️ weekSchedule leeg — geen workout_schedule of work_schedule gevonden')
      }
    } catch (e) {
      console.error('❌ buildWeekSchedule:', e)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // DEV: log journey prop bij mount
  useEffect(() => {
    console.log('🗺️ IntakeCallPanel | journey prop:', {
      id: journey?.id,
      client_id: journey?.client_id,
      is_active: journey?.is_active,
      coaching_plan: journey?.coaching_plan,
      start_date: journey?.start_date,
    })
  }, [journey])

  // DEV: laad preset data voor sneltesten
  const loadPreset = useCallback(() => {
    setPlanState(DEV_PRESET.planState)
    Object.entries(DEV_PRESET.notes).forEach(([step, val]) => updateNotes(step, val))
    setCoachingLevel(DEV_PRESET.coachingLevel)
    setCompletedSteps([0, 1, 2, 3, 4])
    goToStep(5)
    console.log('⚡ IntakeCallPanel | DEV preset geladen:', DEV_PRESET)
  }, [])

  // Save call naar DB — volledig
  const handleSave = useCallback(async ({ actions, waText }) => {
    if (!db?.supabase || !client?.id) return
    console.log('💾 IntakeCallPanel | START SAVE')
    console.log('📊 Plan result:', {
      targetCal: result?.targetCal,
      prot: result?.prot,
      carbs: result?.carbs,
      fat: result?.fat,
      weeklyLoss: result?.weeklyLoss,
      weeksNeeded: result?.weeksNeeded,
      goalWeight: result?.goalWeight,
      startWeight: result?.startWeight,
      kgToLose: result?.kgToLose,
      mode: result?.mode,
      isCut: result?.isCut,
      isBulk: result?.isBulk,
      isRecomp: result?.isRecomp,
      tdee: result?.tdee,
      activePreset: result?.activePreset,
    })
    console.log('📝 Notes:', notes)
    console.log('🏋️ Plan state:', planState)
    console.log('🎯 Coaching level:', coachingLevel)
    console.log('✅ Acties:', actions)
    console.log('📱 WA bericht:', waText)
    try {
      // 1. Macro targets + coaching level → clients tabel
      if (result?.targetCal && cd?.id) {
        const deadline = new Date()
        deadline.setDate(deadline.getDate() + (result.weeksNeeded * 7))
        const { error: clientErr } = await db.supabase.from('clients').update({
          target_calories: result.targetCal,
          target_protein: result.prot,
          target_carbs: result.carbs,
          target_fat: result.fat,
          manual_macro_targets: true,
          target_weight: result.goalWeight,
          goal_weight: result.goalWeight,
          tdee: result.tdee,
          surplus: result.isCut ? -result.actualDeficit : result.actualDeficit,
          weekly_weight_goal: result.weeklyLoss,
          goal_deadline: deadline.toISOString().split('T')[0],
          coaching_style_pref: coachingLevel || cd.coaching_style_pref,
        }).eq('id', cd.id)
        if (clientErr) console.error('❌ clients update:', clientErr)
        else console.log('✅ clients → macro targets opgeslagen:', result.targetCal, 'kcal | level:', coachingLevel)
      } else {
        console.warn('⚠️ clients update overgeslagen — geen targetCal of cd.id', { targetCal: result?.targetCal, cdId: cd?.id })
      }

      // 2. Trainingsschema → split_preferences in user_workout_preferences (jsonb)
      const schema = notes.training?.schema
      if (schema && cd?.auth_user_id) {
        const { error: wpErr } = await db.supabase.from('user_workout_preferences').update({
          split_preferences: { ...(wp?.split_preferences || {}), preferred_split: schema },
        }).eq('user_id', cd.auth_user_id)
        if (wpErr) console.error('❌ user_workout_preferences update:', wpErr.message, wpErr)
        else console.log('✅ user_workout_preferences → split_preferences.preferred_split opgeslagen:', schema)
      } else {
        console.warn('⚠️ schema update overgeslagen:', { schema, authUserId: cd?.auth_user_id })
      }

      // 3 + 4. Afspraken + call notities → client_journeys.coaching_plan (één update)
      if (journey?.id) {
        const existingPlan = journey?.coaching_plan || {}
        const callRecord = {
          notes,
          wa_message: waText,
          actions,
          coaching_level: coachingLevel,
          plan_result: result ? {
            target_cal: result.targetCal,
            protein: result.prot,
            carbs: result.carbs,
            fat: result.fat,
            weekly_loss: result.weeklyLoss,
            weeks_needed: result.weeksNeeded,
            goal_weight: result.goalWeight,
            active_preset: result.activePreset,
            cardio_sessions: planState.cardioSessions,
            cheat_days: planState.cheatDays,
          } : null,
          completed_at: new Date().toISOString(),
        }

        const { error: journeyErr } = await db.supabase.from('client_journeys').update({
          coaching_plan: {
            ...existingPlan,
            coaching_level: coachingLevel,
            startdatum_tekst: notes.afspraken?.startdatum || null,
            call_freq: notes.afspraken?.call_freq || null,
            whatsapp_afspraken: notes.afspraken?.whatsapp || null,
            intake_call_completed_at: new Date().toISOString(),
            intake_call_notes: callRecord,
          },
        }).eq('id', journey.id)
        if (journeyErr) console.error('❌ client_journeys coaching_plan update:', journeyErr.message, journeyErr)
        else console.log('✅ client_journeys → coaching_plan volledig opgeslagen (afspraken + call notes)')
      } else {
        console.warn('⚠️ journey update overgeslagen — geen journey.id:', journey?.id)
      }

      console.log('🎉 IntakeCallPanel | SAVE COMPLEET')
    } catch (e) {
      console.error('❌ IntakeCallPanel save error:', e)
    }
  }, [db, client?.id, cd, result, notes, coachingLevel, journey, weekNumber, planState])

  // Loading state
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px', color: C.text25, fontSize: '12px' }}>
        Laden...
      </div>
    )
  }

  if (!cd) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px', color: C.text25, fontSize: '12px' }}>
        Geen client data gevonden
      </div>
    )
  }

  // Shared step props
  const stepProps = { db, cd, np, wp, weekSchedule, result, notes, updateNotes, coachingLevel, setCoachingLevel, isMobile }

  const renderStep = () => {
    switch (activeStep) {
      case 0: return (
        <IntakeStepDoel
          {...stepProps}
          onComplete={() => completeStep(0)}
        />
      )
      case 1: return (
        <IntakeStepTraining
          {...stepProps}
          onComplete={() => completeStep(1)}
          onBack={() => goToStep(0)}
        />
      )
      case 2: return (
        <IntakeStepVoeding
          {...stepProps}
          onComplete={() => completeStep(2)}
          onBack={() => goToStep(1)}
        />
      )
      case 3: return (
        <IntakeStepPlan
          {...stepProps}
          db={db}
          planState={planState}
          updatePlan={updatePlan}
          onComplete={() => completeStep(3)}
          onBack={() => goToStep(2)}
        />
      )
      case 4: return (
        <IntakeStepAfspraken
          {...stepProps}
          onComplete={() => completeStep(4)}
          onBack={() => goToStep(3)}
        />
      )
      case 5: return (
        <IntakeStepOutput
          {...stepProps}
          onBack={() => goToStep(4)}
          onSave={handleSave}
        />
      )
      default: return null
    }
  }

  // Mobile: fullscreen, geen split
  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: C.bg }}>
        {/* Progress tabs */}
        <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, background: C.bg, flexShrink: 0, overflowX: 'auto' }}>
          {STEPS.map((step, i) => {
            const active = activeStep === i
            const done = completedSteps.includes(i)
            return (
              <button key={step.id} onClick={() => goToStep(i)} style={{
                flex: '0 0 auto', padding: '8px 12px',
                background: 'transparent', border: 'none',
                borderBottom: active ? `2px solid ${C.gold}` : done ? `2px solid rgba(16,185,129,0.4)` : '2px solid transparent',
                color: active ? C.gold : done ? C.green : C.text25,
                fontSize: '10px', fontWeight: active ? 800 : 600,
                cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                textTransform: 'uppercase', letterSpacing: '0.04em', minHeight: '36px',
                whiteSpace: 'nowrap',
              }}>
                {done ? '✓ ' : ''}{step.label}
              </button>
            )
          })}
        </div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          {renderStep()}
        </div>
      </div>
    )
  }

  // Desktop: split layout
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `${BRIEF_WIDTH}px 1fr`,
      height: '100%',
      background: C.bg,
      overflow: 'hidden',
    }}>
      {/* Linker kolom: data brief — scrollbaar */}
      <div style={{ borderRight: `1px solid ${C.border}`, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <IntakeDataBrief cd={cd} np={np} wp={wp} isMobile={false} />
      </div>

      {/* Rechter kolom: stappen */}
      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Progress bar */}
        <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          {STEPS.map((step, i) => {
            const active = activeStep === i
            const done = completedSteps.includes(i)
            return (
              <button key={step.id} onClick={() => goToStep(i)} style={{
                flex: 1, padding: '7px 4px', background: 'transparent', border: 'none',
                borderBottom: active ? `2px solid ${C.gold}` : done ? `2px solid rgba(16,185,129,0.4)` : '2px solid transparent',
                color: active ? C.gold : done ? C.green : C.text25,
                fontSize: '9px', fontWeight: active ? 800 : 600,
                cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'center', minHeight: '32px',
              }}>
                {done ? '✓ ' : ''}{step.label}
              </button>
            )
          })}
          {/* DEV: preset knop */}
          <button onClick={loadPreset} style={{
            padding: '4px 10px', background: 'transparent', border: 'none',
            borderLeft: `1px solid ${C.border}`,
            color: 'rgba(255,255,255,0.15)', fontSize: '8px', fontWeight: 700,
            cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            textTransform: 'uppercase', letterSpacing: '0.04em', flexShrink: 0,
            whiteSpace: 'nowrap',
          }} title="DEV: laad testdata">⚡ test</button>
        </div>

        {/* Actieve stap */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          {renderStep()}
        </div>
      </div>
    </div>
  )
}
