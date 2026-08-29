// src/modules/coach-command-center/components/insight/GuidedPlanFlow.jsx
// Guided plan configurator — stap-voor-stap flow
// v2.2 — snack3 (voor bed) + snack2 (preworkout) volledig geforceerd in applyPlanConfig

import React, { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Check, Zap, Loader, AlertCircle, Clock } from 'lucide-react'
import MealSelector from './guided-plan/MealSelector'

const STEPS = [
  { id: 'settings',   label: 'Instellingen' },
  { id: 'week',       label: 'Week Inzicht', color: '#6366f1' },
  { id: 'breakfast',  label: 'Ontbijt',      slot: 'breakfast',  color: '#f59e0b' },
  { id: 'lunch',      label: 'Lunch',         slot: 'lunch',      color: '#10b981' },
  { id: 'preworkout', label: 'Pre-workout',   slot: 'preworkout', color: '#f97316' },
  { id: 'dinner',     label: 'Diner',         slot: 'dinner',     color: '#3b82f6' },
  { id: 'snacks',     label: 'Snacks',        slot: 'snacks',     color: '#a855f7' },
  { id: 'review',     label: 'Genereer' },
]

const VARIATION_OPTIONS = [
  { value: 2, label: '2 variaties', sub: 'Wisselt elke paar dagen' },
  { value: 3, label: '3 variaties', sub: 'Gevarieerde week' },
  { value: 4, label: '4 variaties', sub: 'Veel afwisseling' },
  { value: 0, label: 'Engine bepaalt', sub: 'Automatisch op basis van voorkeuren' },
]

const DEFAULT_TIMES = {
  breakfast: '08:00',
  snack1:    '10:30',
  lunch:     '13:00',
  preworkout:'15:00',
  dinner:    '18:30',
  snacks:    '21:00',
}

const SLOT_LABELS = {
  breakfast:  { label: 'Ontbijt',           color: '#f59e0b', icon: '🌅' },
  snack1:     { label: 'Snack 1 (ochtend)', color: '#6b7280', icon: '🥤' },
  lunch:      { label: 'Lunch',             color: '#10b981', icon: '🏋️' },
  preworkout: { label: 'Pre-workout snack', color: '#f97316', icon: '⚡' },
  dinner:     { label: 'Diner',             color: '#3b82f6', icon: '🍽️' },
  snacks:     { label: 'Voor bed',          color: '#a855f7', icon: '🌙' },
}

export default function GuidedPlanFlow({ client, db, coachId, onClose, onSuccess, isMobile }) {
  const [step, setStep] = useState(0)
  const [mealsPerDay, setMealsPerDay] = useState(client?.meals_per_day || 4)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState(null)
  const [done, setDone] = useState(false)
  const [planId, setPlanId] = useState(null)
  const [log, setLog] = useState([])

  const [config, setConfig] = useState({
    breakfast:  { mode: null, meals: [], variation: 0 },
    lunch:      { mode: null, meals: [], variation: 0 },
    preworkout: { mode: null, meals: [], variation: 0 },
    dinner:     { mode: null, meals: [], variation: 0 },
    snacks:     { mode: null, meals: [], variation: 0 },
  })

  const [timingOverride, setTimingOverride] = useState({ ...DEFAULT_TIMES })
  const [weekSchedule, setWeekSchedule] = useState(null)
  const [WeekCalendarComp, setWeekCalendarComp] = useState(null)
  const [trainingDays, setTrainingDays] = useState([])
  const [intake, setIntake] = useState(null)

  const m = isMobile

  useEffect(() => {
    const load = async () => {
      if (!db?.supabase || !client?.id) return

      const { data: prefs } = await db.supabase
        .from('nutrition_preferences')
        .select('wishes, training, allergens, life_context, meal_schedule, guidance_level, protein_preferences, carb_preferences, fat_preferences, vegetable_preferences, supplement_preferences, cheat_meals')
        .eq('client_id', client.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single()
      if (prefs) setIntake(prefs)

      const { data: clientData } = await db.supabase
        .from('clients')
        .select('work_schedule, preferred_training_days, workout_schedule, auth_user_id')
        .eq('id', client.id)
        .single()

      if (clientData?.work_schedule) {
        const raw = clientData.work_schedule
        const deduped = {}
        Object.entries(raw).forEach(([day, blocks]) => {
          const seen = new Set()
          deduped[day] = (blocks || []).filter(b => {
            const key = `${b.type}-${b.start}-${b.end}`
            if (seen.has(key)) return false
            seen.add(key)
            return true
          })
        })
        setWeekSchedule(deduped)
      }

      const { data: intakePrefs } = await db.supabase
        .from('nutrition_preferences')
        .select('training')
        .eq('client_id', client.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single()

      const EN_TO_NL = { Monday: 'ma', Tuesday: 'di', Wednesday: 'wo', Thursday: 'do', Friday: 'vr', Saturday: 'za', Sunday: 'zo' }
      const trainingFromWorkout = clientData?.workout_schedule
        ? Object.keys(clientData.workout_schedule).map(k => EN_TO_NL[k]).filter(Boolean)
        : []
      const trainingFromIntake = intakePrefs?.training?.training_days || []
      const trainingFromClient = clientData?.preferred_training_days || []
      const DEFAULT_TRAINING_DAYS = ['ma', 'di', 'wo', 'vr', 'za']
      const resolvedTrainingDays = trainingFromWorkout.length > 0
        ? trainingFromWorkout
        : trainingFromIntake.length > 0
          ? trainingFromIntake
          : trainingFromClient.length > 0
            ? trainingFromClient
            : DEFAULT_TRAINING_DAYS
      setTrainingDays(resolvedTrainingDays)

      let resolvedTrainingTime = null
      if (client.auth_user_id || clientData?.auth_user_id) {
        const userId = client.auth_user_id || clientData?.auth_user_id
        const { data: workoutPrefs } = await db.supabase
          .from('user_workout_preferences')
          .select('training_time')
          .eq('user_id', userId)
          .single()
        resolvedTrainingTime = workoutPrefs?.training_time || intakePrefs?.training?.default_time || null
      }

      if (resolvedTrainingDays.length > 0 && resolvedTrainingTime) {
        const tRaw = resolvedTrainingTime.substring(0, 5)
        const [h, min] = tRaw.split(':').map(Number)
        const endMin = h * 60 + min + 75
        const endH = Math.floor(endMin / 60) % 24
        const endM = endMin % 60
        const endTime = `${String(endH).padStart(2,'0')}:${String(endM).padStart(2,'0')}`

        setWeekSchedule(prev => {
          const updated = { ...(prev || {}) }
          const allDays = ['ma','di','wo','do','vr','za','zo']
          allDays.forEach(day => {
            if (!updated[day]) updated[day] = []
            const filtered = updated[day].filter(b => b.type !== 'training')
            if (resolvedTrainingDays.includes(day)) {
              filtered.push({ type: 'training', start: tRaw, end: endTime })
            }
            updated[day] = filtered
          })
          return updated
        })

        const preMin = h * 60 + min - 30
        const preH = Math.floor(preMin / 60)
        const preM = preMin % 60
        const preTime = `${String(preH).padStart(2,'0')}:${String(preM).padStart(2,'0')}`
        setTimingOverride(prev => ({ ...prev, preworkout: preTime }))
      }

      try {
        const mod = await import('../../../public-intake/components/WeekBuilder/WeekCalendar')
        setWeekCalendarComp(() => mod.default)
      } catch (e) {
        console.warn('WeekCalendar import failed:', e)
      }
    }
    load()
  }, [client?.id])

  const updateConfig = (slot, patch) => {
    setConfig(prev => ({ ...prev, [slot]: { ...prev[slot], ...patch } }))
  }

  const toggleMeal = (slot, meal, maxSelect) => {
    const current = config[slot].meals
    const exists = current.some(m => m.id === meal.id)
    if (exists) {
      updateConfig(slot, { meals: current.filter(m => m.id !== meal.id) })
    } else {
      if (maxSelect === 1) {
        updateConfig(slot, { meals: [meal] })
      } else if (maxSelect === 0 || current.length < maxSelect) {
        updateConfig(slot, { meals: [...current, meal] })
      }
    }
  }

  const addLog = (msg) => setLog(prev => [...prev, msg])

  const currentStep = STEPS[step]
  const isReview = step === STEPS.length - 1
  const isSettings = step === 0
  const isWeek = step === 1

  const canNext = () => {
    if (isSettings || isReview || isWeek) return true
    const slot = currentStep.slot
    const c = config[slot]
    if (!c.mode) return false
    if (c.mode === 'fixed' && c.meals.length === 0) return false
    if (c.mode === 'varied' && c.variation > 0 && c.meals.length === 0) return false
    return true
  }

  const handleGenerate = async () => {
    setGenerating(true)
    setError(null)
    setLog([])

    try {
      addLog('📋 Intake data ophalen...')
      if (!intake) throw new Error('Geen intake data gevonden voor deze client')
      addLog('✅ Intake data gevonden')

      const intakeData = {
        meal_schedule: { num_meals: mealsPerDay },
        wishes:        intake.wishes || {},
        allergens:     intake.allergens || {},
        life_context:  intake.life_context || {},
        guidance_level: intake.guidance_level || {},
        training:      intake.training || {},
        protein_preferences: intake.protein_preferences || {},
        carb_preferences:    intake.carb_preferences || {},
        fat_preferences:     intake.fat_preferences || {},
        vegetable_preferences: intake.vegetable_preferences || {},
        supplement_preferences: intake.supplement_preferences || {},
        cheat_meals:   intake.cheat_meals || {},
        planConfig:    config,
        timingOverride,
      }

      addLog('🚀 Plan generatie starten...')

      const { default: IntakeFlowService } = await import('../../../nutrition-intake/services/IntakeFlowService')
      const service = new IntakeFlowService(db.supabase)
      const result = await service.processIntake(client.id, intakeData)

      if (!result.success || !result.planId) {
        throw new Error(result.errors?.join(', ') || 'Plan generatie mislukt')
      }

      addLog(`✅ Plan gegenereerd`)
      addLog('⚙️ Configuratie + timing toepassen...')
      await applyPlanConfig(result.planId, config, timingOverride, mealsPerDay)
      addLog('✅ Klaar')

      setPlanId(result.planId)
      setDone(true)
      if (onSuccess) onSuccess(result.planId)

    } catch (err) {
      console.error('❌ GuidedPlanFlow:', err)
      setError(err.message)
    } finally {
      setGenerating(false)
    }
  }

  // ════════════════════════════════════════════════════════
  // applyPlanConfig v2.2
  // Draait ALTIJD na de engine — heeft het laatste woord.
  // Dekt: breakfast, lunch, dinner, snack2 (preworkout),
  // snack3 (voor bed) en alle timing overrides.
  // ════════════════════════════════════════════════════════
  const applyPlanConfig = async (planId, config, timingOverride, mealsPerDay) => {
    const { data: plan } = await db.supabase
      .from('client_meal_plans')
      .select('week_structure')
      .eq('id', planId)
      .single()

    if (!plan?.week_structure) return

    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    const ws = { ...plan.week_structure }

    // Helper: bouw volledig meal slot object inclusief alle data
    const buildSlot = (meal, timingKey, existingSlot = {}, overrides = {}) => ({
      meal_id:           meal.id,
      meal_name:         meal.name,
      name:              meal.name,
      calories:          meal.calories,
      protein:           meal.protein,
      carbs:             meal.carbs,
      fat:               meal.fat,
      scale_factor:      1,
      image_url:         meal.image_url         || null,
      ingredients_list:  meal.ingredients_list  || null,
      preparation_steps: meal.preparation_steps || null,
      allergens:         meal.allergens          || null,
      labels:            meal.labels             || null,
      timing:            timingOverride[timingKey] || existingSlot.timing || null,
      ...overrides,
    })

    // ── 1. Hoofd maaltijden: breakfast / lunch / dinner ──
    const mainSlotMap = { breakfast: 'breakfast', lunch: 'lunch', dinner: 'dinner' }

    for (const [configKey, dbKey] of Object.entries(mainSlotMap)) {
      const c = config[configKey]
      if (!c.mode || c.mode === 'auto' || c.meals.length === 0) continue
      days.forEach((day, idx) => {
        if (!ws[day]) return
        const meal = c.mode === 'fixed' ? c.meals[0] : c.meals[idx % c.meals.length]
        ws[day][dbKey] = buildSlot(meal, configKey, ws[day][dbKey] || {})
      })
    }

    // ── 2. Pre-workout → snack2 op trainingsdagen ──
    const pwc = config.preworkout
    if (pwc?.mode && pwc.mode !== 'auto' && pwc.meals.length > 0) {
      days.forEach((day, idx) => {
        if (!ws[day]?.is_training_day) return
        const meal = pwc.mode === 'fixed' ? pwc.meals[0] : pwc.meals[idx % pwc.meals.length]
        ws[day].snack2 = buildSlot(meal, 'preworkout', {}, {
          function: 'PRE-WORKOUT SNACK',
          icon:     '⚡',
        })
      })
    }

    // ── 3. Snacks → schrijf naar juiste slot op basis van mealsPerDay ──
    // 5 maaltijden: snack1 (geen voor-bed slot in plan)
    // 6 maaltijden: snack3 (voor bed)
    const sc = config.snacks
    if (sc?.mode && sc.mode !== 'auto' && sc.meals.length > 0) {
      const snackSlot = mealsPerDay >= 6 ? 'snack3' : 'snack1'
      days.forEach((day, idx) => {
        if (!ws[day]) return
        const meal = sc.mode === 'fixed' ? sc.meals[0] : sc.meals[idx % sc.meals.length]
        ws[day][snackSlot] = buildSlot(meal, 'snacks', ws[day][snackSlot] || {})
      })
    }

    // ── 4. Timing overrides op alle slots — altijd, ook zonder maaltijdkeuze ──
    const timingSlotMap = {
      breakfast: 'breakfast',
      snack1:    'snack1',
      lunch:     'lunch',
      dinner:    'dinner',
      snacks:    mealsPerDay >= 6 ? 'snack3' : 'snack1',
    }

    days.forEach(day => {
      if (!ws[day]) return
      // Hoofd slots
      Object.entries(timingSlotMap).forEach(([timingKey, dbSlot]) => {
        const time = timingOverride[timingKey]
        if (ws[day][dbSlot] && time) ws[day][dbSlot].timing = time
      })
      // snack2 (preworkout) timing apart
      if (ws[day].snack2 && timingOverride.preworkout) {
        ws[day].snack2.timing = timingOverride.preworkout
      }
    })

    await db.supabase
      .from('client_meal_plans')
      .update({ week_structure: ws })
      .eq('id', planId)
  }

  // ─── STEP CONTENT ─────────────────────────────────────────────

  const renderStep = () => {

    if (isSettings) return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <StepHeader title="Instellingen" sub="Basis configuratie voor het plan" color="#fff" />
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {[
            { label: 'KCAL', val: client?.target_calories || '?', color: '#fff' },
            { label: 'EIWIT', val: `${client?.target_protein || '?'}g`, color: '#10b981' },
            { label: 'DOEL', val: client?.primary_goal || '-', color: 'rgba(255,255,255,0.55)' },
          ].map((s, i) => (
            <div key={i} style={{ flex: 1, padding: '0.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.55)', letterSpacing: '-0.01em', marginBottom: '0.2rem' }}>{s.label}</div>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: s.color }}>{s.val}</div>
            </div>
          ))}
        </div>
        <div>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '-0.01em', marginBottom: '0.35rem' }}>Maaltijden per dag</div>
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            {[3, 4, 5, 6].map(n => (
              <button key={n} onClick={() => setMealsPerDay(n)} style={{
                flex: 1, padding: '0.5rem 0',
                background: mealsPerDay === n ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${mealsPerDay === n ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.06)'}`,
                borderRadius: '4px', color: mealsPerDay === n ? '#fff' : 'rgba(255,255,255,0.3)',
                fontSize: '0.8rem', fontWeight: 800,
                cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: '40px',
                fontFamily: 'inherit'
              }}>{n}</button>
            ))}
          </div>
        </div>
        {intake && (
          <div style={{ padding: '0.5rem 0.625rem', background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.12)', borderRadius: '6px' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#10b981', letterSpacing: '-0.01em', marginBottom: '0.2rem' }}>Intake-data gevonden</div>
            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)' }}>
              Voorkeuren, allergieën en trainingstijden worden meegenomen.
            </div>
          </div>
        )}
      </div>
    )

    if (isWeek) return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <StepHeader title="Week Inzicht" color="#6366f1"
          sub={`Schema van ${client.first_name} — slaap, werk en training`}
        />
        {weekSchedule && (() => {
          const firstDay = Object.values(weekSchedule).find(blocks => blocks?.length > 0) || []
          const sleepBlock = firstDay.find(b => b.type === 'slaap')
          if (!sleepBlock) return null
          return (
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.35rem 0.5rem', background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: '4px' }}>
                <span style={{ fontSize: '0.75rem' }}>🌙</span>
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.55)', letterSpacing: '-0.01em' }}>Slapen</div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#6366f1' }}>{sleepBlock.start}</div>
                </div>
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.35rem 0.5rem', background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.15)', borderRadius: '4px' }}>
                <span style={{ fontSize: '0.75rem' }}>☀️</span>
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.55)', letterSpacing: '-0.01em' }}>Wakker</div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#fbbf24' }}>{sleepBlock.end}</div>
                </div>
              </div>
              {trainingDays.length > 0 && (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.35rem 0.5rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '4px' }}>
                  <span style={{ fontSize: '0.75rem' }}>💪</span>
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.55)', letterSpacing: '-0.01em' }}>Training</div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#fff' }}>{timingOverride.preworkout ? `${timingOverride.preworkout}+` : trainingDays.length + 'x/week'}</div>
                  </div>
                </div>
              )}
            </div>
          )
        })()}
        {weekSchedule && WeekCalendarComp ? (
          <WeekCalendarComp schedule={weekSchedule} isMobile={m} highlightDays={trainingDays} />
        ) : (
          <div style={{ padding: '1rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px' }}>
            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)' }}>
              {weekSchedule === null ? 'Weekschema laden...' : 'Geen weekschema beschikbaar — client heeft de weekbuilder nog niet ingevuld'}
            </div>
          </div>
        )}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.5rem' }}>
            <Clock size={12} color="#6366f1" />
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '-0.01em' }}>
              MAALTIJDTIJDEN INSTELLEN
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            {Object.entries(SLOT_LABELS).filter(([slot]) => {
              if (slot === 'snack1' && mealsPerDay < 5) return false
              if (slot === 'preworkout' && mealsPerDay < 4) return false
              if (slot === 'snacks' && mealsPerDay < 6) return false
              return true
            }).map(([slot, info]) => (
              <div key={slot} style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.35rem 0.5rem',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.05)',
                borderLeft: `2px solid ${info.color}`,
                borderRadius: '0 4px 4px 0'
              }}>
                <span style={{ fontSize: '0.75rem', lineHeight: 1 }}>{info.icon}</span>
                <span style={{ flex: 1, fontSize: m ? '0.6rem' : '0.65rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>{info.label}</span>
                <input
                  type="time"
                  value={timingOverride[slot] || DEFAULT_TIMES[slot] || '12:00'}
                  onChange={e => setTimingOverride(prev => ({ ...prev, [slot]: e.target.value }))}
                  style={{
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '4px', color: info.color,
                    fontSize: m ? '0.65rem' : '0.7rem', fontWeight: 800,
                    padding: '0.2rem 0.35rem', fontFamily: 'inherit',
                    outline: 'none', width: '100px', cursor: 'pointer'
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    )

    if (!isReview) {
      const slot = currentStep.slot
      const c = config[slot]
      const color = currentStep.color
      const isPreWorkout = slot === 'preworkout'
      const isSnacks = slot === 'snacks'
      const wishesKey = (isSnacks || isPreWorkout) ? null : `${slot === 'breakfast' ? 'ontbijt' : slot === 'lunch' ? 'lunch' : 'diner'}_subs`
      const wishes = wishesKey ? (intake?.wishes?.[wishesKey] || []) : []
      const maxSelect = c.mode === 'fixed' ? 1 : (c.variation || 4)

      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <StepHeader title={currentStep.label} color={color}
            sub={isPreWorkout
              ? `Snack vlak voor de training — snelle koolhydraten, weinig vet`
              : isSnacks
                ? `Vaste voor-bed snack — wordt elke dag als snack3 gezet`
                : wishes.length > 0
                  ? `${client.first_name} eet normaal: ${wishes.slice(0, 3).join(', ')}...`
                  : `Configureer ${currentStep.label.toLowerCase()}`}
          />

          {isPreWorkout && (
            <div style={{ padding: '0.5rem 0.625rem', background: 'rgba(249,115,22,0.05)', border: '1px solid rgba(249,115,22,0.15)', borderRadius: '6px' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#f97316', letterSpacing: '-0.01em', marginBottom: '0.2rem' }}>PRE-WORKOUT RICHTLIJNEN</div>
              <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>
                Snelle koolhydraten — rijstwafels, honing, banaan, dadels. Weinig vet (&lt;5g). Ideaal 30-60 min voor training.
              </div>
            </div>
          )}

          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '-0.01em', marginBottom: '0.35rem' }}>ELKE DAG HETZELFDE?</div>
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              {[
                { val: 'fixed', label: 'Ja, vast', sub: 'Elke dag dezelfde maaltijd' },
                { val: 'varied', label: 'Nee, variatie', sub: 'Meerdere opties wisselen' },
                { val: 'auto', label: 'Automatisch', sub: 'Engine bepaalt op basis van voorkeuren' },
              ].map(opt => (
                <button key={opt.val} onClick={() => updateConfig(slot, { mode: opt.val, meals: [] })} style={{
                  flex: 1, padding: '0.5rem 0.25rem', textAlign: 'center',
                  background: c.mode === opt.val ? `${color}10` : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${c.mode === opt.val ? color + '40' : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: '6px', cursor: 'pointer',
                  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', fontFamily: 'inherit'
                }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: c.mode === opt.val ? color : 'rgba(255,255,255,0.4)', marginBottom: '0.1rem' }}>{opt.label}</div>
                  <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.3 }}>{opt.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {c.mode === 'varied' && (
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '-0.01em', marginBottom: '0.35rem' }}>HOEVEEL VARIATIES?</div>
              <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                {VARIATION_OPTIONS.map(opt => (
                  <button key={opt.value} onClick={() => updateConfig(slot, { variation: opt.value, meals: [] })} style={{
                    flex: '1 1 calc(50% - 0.125rem)', padding: '0.4rem 0.5rem',
                    background: c.variation === opt.value ? `${color}10` : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${c.variation === opt.value ? color + '40' : 'rgba(255,255,255,0.06)'}`,
                    borderRadius: '6px', cursor: 'pointer', textAlign: 'left',
                    touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', fontFamily: 'inherit'
                  }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: c.variation === opt.value ? color : 'rgba(255,255,255,0.4)' }}>{opt.label}</div>
                    <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)' }}>{opt.sub}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {(c.mode === 'fixed' || (c.mode === 'varied' && c.variation > 0)) && (
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '-0.01em', marginBottom: '0.35rem' }}>
                {c.mode === 'fixed' ? 'KIES MAALTIJD' : `KIES ${c.variation} MAALTIJDEN (${c.meals.length}/${c.variation})`}
              </div>
              <MealSelector
                db={db}
                slotType={isSnacks || isPreWorkout ? 'snack' : slot}
                selectedMeals={c.meals}
                onToggle={(meal) => toggleMeal(slot, meal, c.mode === 'fixed' ? 1 : c.variation)}
                maxSelect={c.mode === 'fixed' ? 1 : c.variation}
                isMobile={m}
              />
            </div>
          )}
        </div>
      )
    }

    if (isReview) {
      if (generating) return (
        <div style={{ padding: '1rem 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Loader size={16} color="#fff" style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fff' }}>Plan wordt gegenereerd...</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
            {log.map((line, i) => (
              <div key={i} style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)', fontFamily: 'monospace' }}>{line}</div>
            ))}
          </div>
        </div>
      )

      if (done) return (
        <div style={{ padding: '0.5rem 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <Check size={18} color="#10b981" />
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#10b981' }}>Plan gegenereerd!</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
            Het concept plan staat klaar in de Analyzer.
          </div>
        </div>
      )

      if (error) return (
        <div style={{ padding: '0.5rem 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
            <AlertCircle size={14} color="#ef4444" />
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#ef4444' }}>Fout bij genereren</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'rgba(239,68,68,0.7)', marginBottom: '0.75rem' }}>{error}</div>
          <button onClick={handleGenerate} style={{ padding: '0.5rem 0.75rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '6px', color: '#ef4444', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', fontFamily: 'inherit' }}>
            Opnieuw proberen
          </button>
        </div>
      )

      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <StepHeader title="Klaar om te genereren" color="#fff"
            sub={`Plan voor ${client.first_name} — ${mealsPerDay} maaltijden/dag`}
          />
          <div style={{ display: 'flex', gap: '0.2rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
            {Object.entries(SLOT_LABELS).map(([slot, info]) => (
              <div key={slot} style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', padding: '0.2rem 0.4rem', background: `${info.color}08`, border: `1px solid ${info.color}25`, borderRadius: '4px' }}>
                <span style={{ fontSize: '0.72rem' }}>{info.icon}</span>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: info.color }}>{timingOverride[slot] || DEFAULT_TIMES[slot]}</span>
              </div>
            ))}
          </div>
          {[
            { label: 'Ontbijt',     slot: 'breakfast',  color: '#f59e0b' },
            { label: 'Lunch',       slot: 'lunch',      color: '#10b981' },
            { label: 'Pre-workout', slot: 'preworkout', color: '#f97316' },
            { label: 'Diner',       slot: 'dinner',     color: '#3b82f6' },
            { label: 'Voor bed',    slot: 'snacks',     color: '#a855f7' },
          ].map(({ label, slot, color }) => {
            const c = config[slot]
            const modeLabel = c.mode === 'fixed' ? 'Vast' : c.mode === 'varied' ? `${c.variation} variaties` : c.mode === 'auto' ? 'Automatisch' : 'Niet ingesteld'
            return (
              <div key={slot} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.625rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '6px' }}>
                <div style={{ width: '3px', height: '24px', borderRadius: '2px', background: color, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#fff' }}>{label}</div>
                  <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)' }}>
                    {modeLabel}{c.meals.length > 0 && ` — ${c.meals.map(m => m.name).join(', ')}`}
                  </div>
                </div>
                {c.mode && <Check size={10} color={color} />}
              </div>
            )
          })}
        </div>
      )
    }
  }

  const progressPct = (step / (STEPS.length - 1)) * 100

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ height: '2px', background: 'rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <div style={{ height: '100%', width: `${progressPct}%`, background: '#fff', transition: 'width 0.3s ease' }} />
      </div>
      <div style={{ display: 'flex', padding: m ? '0.4rem 0.75rem' : '0.5rem 1rem', gap: '0.15rem', flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        {STEPS.map((s, i) => (
          <div key={s.id} style={{ flex: 1, height: '3px', borderRadius: '2px', background: i <= step ? (s.color || '#fff') : 'rgba(255,255,255,0.08)', transition: 'background 0.2s ease' }} />
        ))}
      </div>
      <div style={{ padding: m ? '0.3rem 0.75rem' : '0.35rem 1rem', flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: currentStep.color || 'rgba(255,255,255,0.2)', letterSpacing: '0.08em' }}>
          Stap {step + 1}/{STEPS.length} — {currentStep.label}
        </span>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: m ? '0.75rem' : '1rem' }}>
        {renderStep()}
      </div>
      <div style={{ padding: m ? '0.625rem 0.75rem' : '0.75rem 1rem', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
        {step > 0 && !generating && !done && (
          <button onClick={() => setStep(s => s - 1)} style={{
            padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px',
            color: 'rgba(255,255,255,0.55)', fontSize: '0.72rem', fontWeight: 700,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: '40px', fontFamily: 'inherit'
          }}>
            <ChevronLeft size={13} /> Terug
          </button>
        )}
        {!done && !generating && (
          <button
            onClick={() => { if (isReview) handleGenerate(); else setStep(s => s + 1) }}
            disabled={!canNext()}
            style={{
              flex: 1, padding: '0.5rem',
              background: canNext() ? (isReview ? '#fff' : 'rgba(255,255,255,0.08)') : 'rgba(255,255,255,0.03)',
              border: `1px solid ${canNext() ? (isReview ? 'transparent' : 'rgba(255,255,255,0.25)') : 'rgba(255,255,255,0.06)'}`,
              borderRadius: '6px',
              color: canNext() ? (isReview ? '#000' : '#fff') : 'rgba(255,255,255,0.2)',
              fontSize: '0.75rem', fontWeight: 800,
              cursor: canNext() ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem',
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: '40px',
              transition: 'all 0.15s ease', fontFamily: 'inherit'
            }}
          >
            {isReview ? <><Zap size={14} /> Plan Genereren</> : <>{STEPS[step + 1]?.label} <ChevronRight size={13} /></>}
          </button>
        )}
        {done && (
          <div style={{ display: 'flex', gap: '0.5rem', flex: 1 }}>
            <button onClick={onClose} style={{ flex: 1, padding: '0.5rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: 'rgba(255,255,255,0.55)', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: '40px', fontFamily: 'inherit' }}>
              Sluiten
            </button>
            <button onClick={() => { onClose(); if (onSuccess) onSuccess(planId) }} style={{ flex: 2, padding: '0.5rem', background: '#10b981', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: '40px', fontFamily: 'inherit' }}>
              <Zap size={13} /> Bekijk in Analyzer
            </button>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function StepHeader({ title, sub, color }) {
  return (
    <div style={{ marginBottom: '0.25rem' }}>
      <div style={{ fontSize: '0.9rem', fontWeight: 800, color: color || '#fff', marginBottom: '0.15rem' }}>{title}</div>
      {sub && <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.4 }}>{sub}</div>}
    </div>
  )
}
