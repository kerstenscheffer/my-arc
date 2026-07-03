// src/modules/ai-meal-generator/tabs/PlanAnalyzer.jsx
// v4.0 — Sidebar layout: linker icon nav + compacte builder rechts

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { BarChart3, FileText, ChevronLeft, ChevronRight, AlertTriangle, Zap, Grid3X3, Calendar, List, Download, MessageSquare, Play, Check, Loader, Clock, RotateCcw, RotateCw, Copy, X, Plus, Repeat, Bookmark } from 'lucide-react'
import DayTemplatesSectionWrapper from '../../client-meal-base/components/DayTemplatesSectionWrapper'
import DayNavigator, { DAYS } from './plan-analyzer/DayNavigator'
import DayMacroBar from './plan-analyzer/DayMacroBar'
import MealCard from './plan-analyzer/MealCard'
import SwapModal from './plan-analyzer/SwapModal'
import ClientContextPanel from './plan-analyzer/ClientContextPanel'
import AutoBalancer from './plan-analyzer/AutoBalancer'
import WeekBalancer from './plan-analyzer/WeekBalancer'
import WeekOverview from './plan-analyzer/WeekOverview'
import ClientAgendaView from '../../client-agenda/ClientAgendaView'
import MacroHero from '../../meal-plan/components/MacroHero'
import PlanSwitcherModal from './plan-analyzer/PlanSwitcherModal'
import TimingModal from './plan-analyzer/TimingModal'
import BestSwapsModal from './plan-analyzer/BestSwapsModal'
import PlanLibraryModal from './plan-analyzer/PlanLibraryModal'
import ApplyDaysModal from './plan-analyzer/ApplyDaysModal'
import { checkMealConflicts, buildConflictClientData } from './plan-analyzer/ConflictChecker'
import { openMealPlanForPrint, openCoachingGuideForPrint } from '../mealplanhtmlgenerator'

// Slots — de 6 vaste + extra snack-slots zodat er geen harde max van 6
// maaltijden meer is. Alles wordt op tijd gesorteerd bij het tonen; lege
// extra-slots verschijnen pas als je ze vult via "Maaltijd toevoegen".
const SLOTS = ['breakfast', 'snack1', 'lunch', 'snack2', 'dinner', 'snack3', 'snack4', 'snack5', 'snack6', 'snack7', 'snack8']
const SLOT_DEFAULT_TIMES = {
  breakfast: '07:30', snack1: '10:30', lunch: '13:00',
  snack2: '15:30', dinner: '19:00', snack3: '21:30',
  snack4: '22:00', snack5: '22:30', snack6: '23:00', snack7: '23:30', snack8: '23:59'
}
const MAX_HISTORY = 50

export default function PlanAnalyzer({
  db, generatedPlan, planModifications, setPlanModifications,
  dailyTargets, isMobile, conceptPlanId, clientId, onPlanActivated,
  onConceptLoaded, coachId
}) {
  const [activeDay, setActiveDay] = useState(0)
  // Agenda opent nu in het dock-vak (dockedSection === 'agenda').
  // Bump counter dat de embedded ClientAgendaView dwingt opnieuw te
  // laden — elke meal-swap / move / delete in plan-analyzer schrijft
  // door naar de DB, dus de agenda moet refreshen om de nieuwe state
  // te zien.
  const [agendaRefreshKey, setAgendaRefreshKey] = useState(0)
  const [weekData, setWeekData] = useState(null)
  const [targets, setTargets] = useState(dailyTargets || null)
  const [planMeta, setPlanMeta] = useState(null)
  const [conceptPlans, setConceptPlans] = useState([])
  const [loadingConcepts, setLoadingConcepts] = useState(false)
  const [selectedConceptId, setSelectedConceptId] = useState(conceptPlanId || null)
  const [swapState, setSwapState] = useState(null)
  const [applyDaysState, setApplyDaysState] = useState(null)
  const [clientIntake, setClientIntake] = useState(null)
  const [clientRecord, setClientRecord] = useState(null)
  const [validSchemaDagKeys, setValidSchemaDagKeys] = useState(null)
  const [viewMode, setViewMode] = useState('day')
  const [showPlanSwitcher, setShowPlanSwitcher] = useState(false)
  const [showTimingModal, setShowTimingModal] = useState(false)
  const [showBalancer, setShowBalancer] = useState(false)
  const [showWeekBalancer, setShowWeekBalancer] = useState(false)
  const [showFloatingClient, setShowFloatingClient] = useState(false)
  const [showDayTemplates, setShowDayTemplates] = useState(false)
  const [showBestSwaps, setShowBestSwaps] = useState(false)
  // Welke sectie staat gedokt in het middenpaneel (naast de knoppenbalk).
  // null = dicht → dag+maaltijden krijgt de volle breedte.
  const [dockedSection, setDockedSection] = useState(null)
  // Breedte van het dock-paneel (px, desktop) — sleepbaar via het handvat.
  const [dockWidth, setDockWidth] = useState(() => {
    try { const s = Number(localStorage.getItem('planAnalyzerDockWidth')); return s >= 240 ? s : 420 } catch { return 420 }
  })
  const startDockResize = (e) => {
    e.preventDefault()
    const startX = e.clientX
    const startW = dockWidth
    let latest = startW
    const onMove = (ev) => {
      const max = Math.max(320, (typeof window !== 'undefined' ? window.innerWidth : 1200) - 92 - 360) // bouwer houdt min ~360px
      latest = Math.min(Math.max(240, startW + (ev.clientX - startX)), max)
      setDockWidth(latest)
    }
    const onUp = () => {
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerup', onUp)
      try { localStorage.setItem('planAnalyzerDockWidth', String(Math.round(latest))) } catch {}
    }
    document.addEventListener('pointermove', onMove)
    document.addEventListener('pointerup', onUp)
  }
  const [allClientPlans, setAllClientPlans] = useState([])
  const [resolvedClientId, setResolvedClientId] = useState(clientId || null)

  // Activate/PDF state
  const [activating, setActivating] = useState(false)
  const [activated, setActivated] = useState(false)
  const [loadingPdf, setLoadingPdf] = useState(false)

  const m = isMobile

  // History
  const [history, setHistory] = useState([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [lastAction, setLastAction] = useState('')
  const isUndoRedo = useRef(false)
  const canUndo = historyIndex > 0
  const canRedo = historyIndex < history.length - 1

  useEffect(() => { if (clientId) setResolvedClientId(clientId) }, [clientId])

  const pushHistory = useCallback((newWeekData, actionDescription) => {
    if (isUndoRedo.current) { isUndoRedo.current = false; return }
    setHistory(prev => {
      const trimmed = prev.slice(0, historyIndex + 1)
      const next = [...trimmed, JSON.parse(JSON.stringify(newWeekData))]
      if (next.length > MAX_HISTORY) next.shift()
      return next
    })
    setHistoryIndex(prev => Math.min(prev + 1, MAX_HISTORY - 1))
    setLastAction(actionDescription)
  }, [historyIndex])

  const handleUndo = useCallback(() => {
    if (!canUndo) return
    isUndoRedo.current = true
    const prevData = history[historyIndex - 1]
    setWeekData(JSON.parse(JSON.stringify(prevData)))
    setHistoryIndex(prev => prev - 1)
    setLastAction('Ongedaan gemaakt')
    persistWeekData(prevData)
  }, [canUndo, history, historyIndex])

  const handleRedo = useCallback(() => {
    if (!canRedo) return
    isUndoRedo.current = true
    const nextData = history[historyIndex + 1]
    setWeekData(JSON.parse(JSON.stringify(nextData)))
    setHistoryIndex(prev => prev + 1)
    setLastAction('Opnieuw uitgevoerd')
    persistWeekData(nextData)
  }, [canRedo, history, historyIndex])

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); handleUndo() }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) { e.preventDefault(); handleRedo() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleUndo, handleRedo])

  const conflictClientData = clientRecord && clientIntake
    ? buildConflictClientData(clientRecord, clientIntake)
    : null

  // ════════════ DATA LOADING ════════════

  useEffect(() => {
    if (generatedPlan?.weekPlan) loadFromGeneratedPlan(generatedPlan)
    else if (selectedConceptId) loadConceptPlan(selectedConceptId)
    else if (resolvedClientId) loadConceptPlansForClient(resolvedClientId)
  }, [generatedPlan, selectedConceptId, resolvedClientId])

  useEffect(() => {
    if (resolvedClientId && db?.supabase) {
      loadIntakeData(resolvedClientId)
      loadClientRecord(resolvedClientId)
      loadAllPlanCount(resolvedClientId)
    }
  }, [resolvedClientId])

  useEffect(() => {
    if (clientRecord?.target_calories) {
      setTargets({ calories: clientRecord.target_calories, protein: clientRecord.target_protein || 150, carbs: clientRecord.target_carbs || 300, fat: clientRecord.target_fat || 80 })
    }
  }, [clientRecord])

  const loadAllPlanCount = async (cId) => {
    try { const { data } = await db.supabase.from('client_meal_plans').select('id, is_active').eq('client_id', cId); setAllClientPlans(data || []) } catch {}
  }

  const loadIntakeData = async (cId) => {
    try { const { data } = await db.supabase.from('nutrition_preferences').select('*').eq('client_id', cId).order('updated_at', { ascending: false }).limit(1); if (data?.[0]) setClientIntake(data[0]) } catch {}
  }

  const loadClientRecord = async (cId) => {
    try { const { data } = await db.supabase.from('clients').select('*').eq('id', cId).single(); if (data) setClientRecord(data) } catch {}
  }

  useEffect(() => {
    const schemaId = clientRecord?.assigned_schema_id
    if (!schemaId) { setValidSchemaDagKeys(null); return }
    let cancelled = false
    ;(async () => {
      try {
        const { data } = await db.supabase.from('workout_schemas').select('week_structure').eq('id', schemaId).single()
        if (cancelled) return
        const ws = data?.week_structure
        if (ws && typeof ws === 'object') setValidSchemaDagKeys(new Set(Object.keys(ws)))
        else setValidSchemaDagKeys(null)
      } catch { if (!cancelled) setValidSchemaDagKeys(null) }
    })()
    return () => { cancelled = true }
  }, [clientRecord?.assigned_schema_id])

  const loadFromGeneratedPlan = (plan) => {
    const days = plan.weekPlan.map((day, i) => {
      const meals = {}
      if (day.breakfast) meals.breakfast = day.breakfast
      if (day.lunch) meals.lunch = day.lunch
      if (day.dinner) meals.dinner = day.dinner
      if (day.snacks) day.snacks.forEach((s, si) => { if (s) meals[`snack${si + 1}`] = s })
      SLOTS.filter(s => s.startsWith('snack')).forEach(s => { if (day[s]) meals[s] = day[s] })
      return { dayId: DAYS[i].id, meals, totals: day.totals || calculateTotals(meals), is_training_day: day.is_training_day || false }
    })
    setWeekData(days); setTargets(dailyTargets); setPlanMeta(null)
    setHistory([JSON.parse(JSON.stringify(days))]); setHistoryIndex(0)
  }

  // Reconstrueer een weekData-array (7 dagen, gehydrateerd met ai_meals-data)
  // uit een opgeslagen week_structure. Ondersteunt zowel per-dag keys als de
  // setA/setB-rotatie. Gedeeld door loadConceptPlan én het laden van een
  // opgeslagen full_week-plan uit de bibliotheek, zodat beide identiek zijn.
  const hydrateWeekStructure = async (rawWs) => {
    if (!rawWs) return null
    let ws = rawWs
    if ((ws.setA || ws.setB) && Array.isArray(ws.training_days)) {
      const trainingSet = new Set(ws.training_days.map(n => parseInt(n, 10)))
      const expanded = {}
      DAYS.forEach((d, idx) => {
        const isTraining = trainingSet.has(idx)
        const tpl = isTraining ? (ws.setA || ws.setB) : (ws.setB || ws.setA)
        if (!tpl) return
        expanded[d.id] = { ...tpl, is_training_day: isTraining }
      })
      ws = expanded
    }
    const mealIds = new Set()
    Object.values(ws).forEach(dd => {
      if (!dd) return
      SLOTS.forEach(s => { if (dd[s]?.meal_id) mealIds.add(dd[s].meal_id); if (dd[s]?.id) mealIds.add(dd[s].id) })
    })
    const mealDataMap = {}
    if (mealIds.size > 0) {
      const { data: mealRows, error: mealError } = await db.supabase
        .from('ai_meals')
        .select('id, name, internal_name, calories, protein, carbs, fat, image_url, ingredients_list, preparation_steps, tips, allergens, scalable, difficulty, labels, timing')
        .in('id', [...mealIds])
      if (mealError) console.error('❌ ai_meals query error:', mealError)
      mealRows?.forEach(m => { mealDataMap[m.id] = m })
    }
    return DAYS.map(day => {
      const dd = ws[day.id]
      if (!dd) return { dayId: day.id, meals: {}, totals: {}, is_training_day: false }
      const meals = {}
      SLOTS.forEach(s => {
        if (!dd[s]) return
        const slot = dd[s]
        const fullMeal = mealDataMap[slot.meal_id] || mealDataMap[slot.id] || null
        meals[s] = {
          ...slot,
          ...(fullMeal ? { name: fullMeal.name, internal_name: fullMeal.internal_name, image_url: fullMeal.image_url, ingredients_list: slot.ingredients_list || fullMeal.ingredients_list, preparation_steps: fullMeal.preparation_steps, tips: fullMeal.tips, allergens: fullMeal.allergens, scalable: fullMeal.scalable, difficulty: fullMeal.difficulty, labels: fullMeal.labels } : {}),
          name: fullMeal?.name || slot.name || slot.meal_name || slot.title || undefined,
          meal_id: slot.meal_id || slot.id || null,
          original_calories: slot.original_calories || slot.calories,
          original_protein: slot.original_protein || slot.protein,
          original_carbs: slot.original_carbs || slot.carbs,
          original_fat: slot.original_fat || slot.fat,
        }
      })
      return { dayId: day.id, meals, totals: dd.totals || calculateTotals(meals), is_training_day: dd.is_training_day || false }
    })
  }

  const loadConceptPlan = async (planId) => {
    try {
      const { data, error } = await db.supabase.from('client_meal_plans').select('*').eq('id', planId).single()
      if (error || !data?.week_structure) return
      if (data.client_id) { setResolvedClientId(data.client_id); if (onConceptLoaded) onConceptLoaded(data.client_id) }
      const days = await hydrateWeekStructure(data.week_structure)
      if (!days) return
      setWeekData(days)
      // BEWUST GEEN setTargets hier: de macro-targets bovenaan moeten ALTIJD de
      // door de coach berekende + toegewezen targets zijn (clientRecord.target_*),
      // niet de macro's die in dit (opgeslagen) plan staan. De clientRecord-effect
      // hierboven is de enige bron van targets — anders kreeg je soms de plan-macro's
      // (race condition tussen plan-load en clientRecord-load).
      setPlanMeta({ id: data.id, name: data.template_name, isActive: data.is_active, clientId: data.client_id, createdAt: data.created_at, stats: data.stats, aiGenerated: data.ai_generated })
      setActivated(data.is_active || false)
      setHistory([JSON.parse(JSON.stringify(days))]); setHistoryIndex(0)
    } catch (err) { console.error('Concept load error:', err) }
  }

  const loadConceptPlansForClient = async (cId) => {
    setLoadingConcepts(true)
    try { const { data } = await db.supabase.from('client_meal_plans').select('id, template_name, daily_calories, daily_protein, is_active, ai_generated, created_at, stats').eq('client_id', cId).eq('is_active', false).order('created_at', { ascending: false }).limit(10); setConceptPlans(data || []) } catch {}
    setLoadingConcepts(false)
  }

  // ════════════ HELPERS ════════════

  const calculateTotals = (meals) => {
    const t = { kcal: 0, protein: 0, carbs: 0, fat: 0 }
    Object.values(meals).forEach(meal => { if (!meal) return; t.kcal += meal.calories || 0; t.protein += meal.protein || 0; t.carbs += meal.carbs || 0; t.fat += meal.fat || 0 })
    return t
  }

  const getSortedSlots = (meals) => {
    return [...SLOTS].sort((a, b) => {
      const rawA = meals[a]?.timing; const rawB = meals[b]?.timing
      const timeA = (typeof rawA === 'string' && rawA.length > 0) ? rawA : (SLOT_DEFAULT_TIMES[a] || '12:00')
      const timeB = (typeof rawB === 'string' && rawB.length > 0) ? rawB : (SLOT_DEFAULT_TIMES[b] || '12:00')
      return timeA.localeCompare(timeB)
    })
  }

  const EN_TO_NL = { Monday: 'ma', Tuesday: 'di', Wednesday: 'wo', Thursday: 'do', Friday: 'vr', Saturday: 'za', Sunday: 'zo' }
  const workoutSchedule = clientRecord?.workout_schedule || null
  const trainingDaysFromSchedule = workoutSchedule
    ? Object.entries(workoutSchedule)
        .filter(([, dagKey]) => !validSchemaDagKeys || validSchemaDagKeys.has(dagKey))
        .map(([day]) => EN_TO_NL[day])
        .filter(Boolean)
    : null
  const trainingDays = trainingDaysFromSchedule?.length ? trainingDaysFromSchedule : (clientIntake?.training?.training_days?.length > 0 ? clientIntake.training.training_days : ['ma', 'di', 'wo', 'vr', 'za'])
  const mealSchedule = clientIntake?.meal_schedule || null
  const trainingTime = clientIntake?.training?.default_time || null

  const getPreWorkoutSlot = (dayIndex) => {
    const dayMap = { 0: 'ma', 1: 'di', 2: 'wo', 3: 'do', 4: 'vr', 5: 'za', 6: 'zo' }
    if (!trainingDays.includes(dayMap[dayIndex]) || !trainingTime) return null
    const timeMap = { vroege_ochtend: 'breakfast', late_ochtend: 'snack1', vroege_middag: 'lunch', late_middag: 'snack2', vroege_avond: 'dinner', late_avond: 'snack3', ochtend: 'breakfast', middag: 'lunch', einde_werkdag: 'snack2', avond: 'dinner' }
    const slotOrder = ['breakfast', 'snack1', 'lunch', 'snack2', 'dinner', 'snack3']
    const trainingSlot = timeMap[trainingTime] || 'dinner'
    const idx = slotOrder.indexOf(trainingSlot)
    return idx > 0 ? slotOrder[idx - 1] : null
  }

  const getMealConflicts = (meal) => {
    if (!meal || !conflictClientData) return []
    return checkMealConflicts(meal, conflictClientData)
  }

  // ════════════ PERSIST ════════════

  const persistWeekData = async (updated) => {
    if (planMeta?.id) {
      const ws = {}
      updated.forEach(d => { ws[d.dayId] = { ...d.meals, totals: d.totals, is_training_day: d.is_training_day } })
      await db.supabase.from('client_meal_plans').update({ week_structure: ws }).eq('id', planMeta.id)
    }
    if (setPlanModifications) { const mods = {}; updated.forEach((d, i) => { mods[i] = d }); setPlanModifications(mods) }
  }

  const applyWeekUpdate = async (updated, actionDesc) => {
    setWeekData(updated); pushHistory(updated, actionDesc); await persistWeekData(updated)
    // Trigger embedded agenda om de nieuwe meal-data op te halen.
    setAgendaRefreshKey(k => k + 1)
  }

  // ════════════ MEAL EDITING ════════════

  // Zorg dat een geplaatste meal een geldige KLOK-tijd op .timing heeft. Meals
  // uit ai_meals dragen .timing als array van maaltijd-types (bv. ['lunch']) —
  // geen klok-tijd — waardoor de agenda ze overslaat. Behoud een geldige vorige
  // slot-tijd, anders de slot-default. (HH:MM string).
  const isClockTime = (t) => typeof t === 'string' && /^\d{1,2}:\d{2}/.test(t)
  const withSlotTiming = (meal, slot, prevMeal) => {
    if (!meal) return meal
    const timing = isClockTime(meal.timing) ? meal.timing
      : isClockTime(prevMeal?.timing) ? prevMeal.timing
      : (SLOT_DEFAULT_TIMES[slot] || '12:00')
    return { ...meal, timing }
  }

  const handleSwap = (dayIndex, slot, meal) => setSwapState({ dayIndex, slot, meal })
  const handleSwapSelect = async (newMeal) => {
    if (!swapState || !weekData) return
    const updated = [...weekData]
    const placed = withSlotTiming(newMeal, swapState.slot, updated[swapState.dayIndex].meals[swapState.slot])
    updated[swapState.dayIndex] = { ...updated[swapState.dayIndex], meals: { ...updated[swapState.dayIndex].meals, [swapState.slot]: placed } }
    updated[swapState.dayIndex].totals = calculateTotals(updated[swapState.dayIndex].meals)
    await applyWeekUpdate(updated, `Swap ${DAYS[swapState.dayIndex].full}: ${swapState.meal?.name || 'leeg'} → ${newMeal.name || '?'}`)
    setSwapState(null)
  }
  const handleMultiDaySelect = async (newMeal, slot, dayIndices) => {
    if (!weekData) return
    const updated = [...weekData]
    dayIndices.forEach(di => { updated[di] = { ...updated[di], meals: { ...updated[di].meals, [slot]: withSlotTiming(newMeal, slot, updated[di].meals[slot]) } }; updated[di].totals = calculateTotals(updated[di].meals) })
    await applyWeekUpdate(updated, `Swap ${slot} op ${dayIndices.length} dagen → ${newMeal.name}`)
    setSwapState(null)
  }
  // "Dagen"-knop op een meal-card: open de dag-picker in het dock-vak.
  const handleApplyToDays = (dayIndex, slot, meal) => { if (meal) setApplyDaysState({ dayIndex, slot, meal }) }
  // Pas de gekozen meal (met huidige aanpassingen) toe op de geselecteerde dagen.
  const handleApplyDaysConfirm = async (dayIndices) => {
    if (!applyDaysState || !weekData) return
    const { meal, slot } = applyDaysState
    const updated = [...weekData]
    dayIndices.forEach(di => {
      updated[di] = { ...updated[di], meals: { ...updated[di].meals, [slot]: withSlotTiming(meal, slot, updated[di].meals[slot]) } }
      updated[di].totals = calculateTotals(updated[di].meals)
    })
    await applyWeekUpdate(updated, `${meal.name || 'Maaltijd'} toegepast op ${dayIndices.length} dag${dayIndices.length !== 1 ? 'en' : ''}`)
  }
  const handleDelete = async (dayIndex, slot) => {
    if (!weekData) return
    const mealName = weekData[dayIndex].meals[slot]?.name || 'maaltijd'
    const updated = [...weekData]; const meals = { ...updated[dayIndex].meals }; delete meals[slot]
    updated[dayIndex] = { ...updated[dayIndex], meals }; updated[dayIndex].totals = calculateTotals(meals)
    await applyWeekUpdate(updated, `Verwijderd: ${mealName} (${DAYS[dayIndex].full})`)
  }
  const handleAdd = (dayIndex, slot) => setSwapState({ dayIndex, slot, meal: null })
  // Laad een opgeslagen full_week-plan uit de bibliotheek en pas het toe op het
  // huidige (client-)plan. Reconstrueert via dezelfde hydrate-helper als een
  // normale plan-load, en persisteert naar het actieve planMeta.id.
  const handleLoadSavedPlan = async (ws, name) => {
    if (!ws) return
    const days = await hydrateWeekStructure(ws)
    if (!days) return
    await applyWeekUpdate(days, `Plan geladen: ${name || 'opgeslagen plan'}`)
    setDockedSection(null)
  }
  const handleUpdateMeal = async (dayIndex, slot, updatedMeal) => {
    if (!weekData) return
    const updated = [...weekData]
    const matchingMealId = updatedMeal.meal_id || updatedMeal.id

    // Update alle slots in de hele week die dezelfde meal_id hebben
    updated.forEach((day, di) => {
      Object.entries(day.meals).forEach(([s, m]) => {
        if (!m) return
        const slotMealId = m.meal_id || m.id
        if (slotMealId && slotMealId === matchingMealId) {
          updated[di] = {
            ...updated[di],
            meals: { ...updated[di].meals, [s]: { ...m, ...updatedMeal } }
          }
          updated[di].totals = calculateTotals(updated[di].meals)
        }
      })
    })

    await applyWeekUpdate(updated, `Aangepast: ${updatedMeal.name} (alle dagen)`)
  }
  const handleAutoBalance = async (dayIndex, updatedMeals) => {
    if (!weekData) return
    const updated = [...weekData]; updated[dayIndex] = { ...updated[dayIndex], meals: updatedMeals }; updated[dayIndex].totals = calculateTotals(updatedMeals)
    await applyWeekUpdate(updated, `Auto-balance: ${DAYS[dayIndex].full}`); setShowBalancer(false)
  }
  const handleWeekBalance = async (updatedWeekData, shouldClose = true) => {
    await applyWeekUpdate(updatedWeekData, 'Week gebalanceerd'); if (shouldClose) setShowWeekBalancer(false)
  }
  const handleMoveMeal = async (fromDay, fromSlot, toDay, toSlot) => {
    if (!weekData) return
    const updated = [...weekData]
    const sourceMeal = updated[fromDay].meals[fromSlot]; const targetMeal = updated[toDay].meals[toSlot]
    if (!sourceMeal) return
    const newSourceMeals = { ...updated[fromDay].meals }; const newTargetMeals = fromDay === toDay ? newSourceMeals : { ...updated[toDay].meals }
    newTargetMeals[toSlot] = sourceMeal; newSourceMeals[fromSlot] = targetMeal || null
    if (!newSourceMeals[fromSlot]) delete newSourceMeals[fromSlot]
    updated[fromDay] = { ...updated[fromDay], meals: newSourceMeals }; updated[fromDay].totals = calculateTotals(newSourceMeals)
    if (fromDay !== toDay) { updated[toDay] = { ...updated[toDay], meals: newTargetMeals }; updated[toDay].totals = calculateTotals(newTargetMeals) }
    await applyWeekUpdate(updated, `Verplaatst: ${sourceMeal.name}`)
  }

  // ════════════ ACTIONS ════════════

  const handleActivate = async () => {
    if (!planMeta?.id) return
    setActivating(true)
    try {
      await db.supabase.from('client_meal_plans').update({ is_active: false }).eq('client_id', planMeta.clientId).eq('is_active', true)
      const { error } = await db.supabase.from('client_meal_plans').update({ is_active: true }).eq('id', planMeta.id)
      if (error) throw error
      setActivated(true); setPlanMeta(p => ({ ...p, isActive: true }))
      if (onPlanActivated) onPlanActivated(planMeta.id)

      // ✅ Coaching guide automatisch toewijzen als document
      const clientName = clientRecord?.first_name || 'Client'
      const guideUrl = `${window.location.origin}/coaching-guide?name=${encodeURIComponent(clientName)}`
      // Controleer of er al een coaching guide staat
      const { data: existing } = await db.supabase
        .from('client_documents')
        .select('id')
        .eq('client_id', planMeta.clientId)
        .eq('file_type', 'coaching_guide')
        .limit(1)
      if (!existing?.length) {
        await db.supabase.from('client_documents').insert({
          client_id: planMeta.clientId,
          coach_id: coachId,
          name: 'Coaching Guide — Timing & Supplementen',
          file_url: guideUrl,
          file_type: 'coaching_guide'
        })
      }
    } catch (err) { alert('Activeren mislukt: ' + err.message) }
    setActivating(false)
  }

  const handlePDF = async () => {
    if (!planMeta?.id) return
    setLoadingPdf(true)
    try {
      const { data, error } = await db.supabase.from('client_meal_plans').select('*').eq('id', planMeta.id).single()
      if (error || !data) throw new Error('Plan laden mislukt')
      const clientName = clientRecord?.first_name || 'Client'
      const today = new Date(); const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
      const weekRange = `${today.toLocaleDateString('nl-NL')} - ${nextWeek.toLocaleDateString('nl-NL')}`
      await openMealPlanForPrint(data, clientName, weekRange)
    } catch (err) { alert('PDF maken mislukt. Probeer opnieuw.') }
    setLoadingPdf(false)
  }

  const handleWhatsApp = () => {
    const name = clientRecord?.first_name || 'je'; const phone = clientRecord?.phone || ''; const planName = planMeta?.name || 'je nieuwe weekplan'
    const message = `Hey ${name}! Je nieuwe voedingsplan staat klaar in de MY ARC app: "${planName}". Open de app om het te bekijken. Vragen? Stuur me een berichtje! 💪`
    window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank')
  }

  // ════════════ RENDER: NO DATA ════════════

  if (!weekData && !generatedPlan?.weekPlan) {
    return (
      <div style={{ padding: m ? '1rem' : '1.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <BarChart3 size={28} style={{ color: 'rgba(255,255,255,0.1)', marginBottom: '0.5rem' }} />
          <div style={{ fontSize: '1rem', fontWeight: 800, color: '#fff' }}>Plan Analyzer</div>
          <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', marginTop: '0.15rem' }}>
            {conceptPlans.length > 0 ? 'Selecteer een concept plan' : 'Genereer eerst een plan of selecteer een client'}
          </div>
        </div>
        {resolvedClientId && allClientPlans.length > 0 && (
          <button onClick={() => setShowPlanSwitcher(true)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.625rem 1rem', marginBottom: '1rem', background: 'rgba(255,215,0,0.05)', border: '1px solid rgba(255,215,0,0.15)', borderRadius: '6px', cursor: 'pointer', color: '#FFD700', fontSize: '0.65rem', fontWeight: 700, touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
            <List size={14} /> Alle plannen bekijken ({allClientPlans.length})
          </button>
        )}
        {loadingConcepts && <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.2)', fontSize: '0.65rem' }}>Laden...</div>}
        {conceptPlans.map(plan => (
          <button key={plan.id} onClick={() => setSelectedConceptId(plan.id)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.6rem', padding: m ? '0.625rem 0.75rem' : '0.75rem 1rem', background: 'rgba(255,255,255,0.02)', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer', textAlign: 'left', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
            <FileText size={16} color={plan.ai_generated ? '#FFD700' : '#10b981'} style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{plan.template_name}</div>
              <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.25)' }}>{plan.daily_calories} kcal · {plan.daily_protein}g eiwit · {new Date(plan.created_at).toLocaleDateString('nl-NL')}</div>
            </div>
            <ChevronRight size={14} color="rgba(255,255,255,0.1)" />
          </button>
        ))}
        {showPlanSwitcher && resolvedClientId && (
          <PlanSwitcherModal db={db} clientId={resolvedClientId} coachId={coachId} activePlanId={planMeta?.id}
            onSelect={(planId) => { setSelectedConceptId(planId); setShowPlanSwitcher(false); loadAllPlanCount(resolvedClientId) }}
            onClose={() => setShowPlanSwitcher(false)} isMobile={m} />
        )}
      </div>
    )
  }

  // ════════════ RENDER: MAIN ════════════

  const currentDay = weekData?.[activeDay]
  const DAY_CODE_BY_INDEX = { 0: 'ma', 1: 'di', 2: 'wo', 3: 'do', 4: 'vr', 5: 'za', 6: 'zo' }
  // Trainingsdag-indices (0=ma..6=zo) voor de "Trainingsdagen"-pill in de dag-picker.
  const CODE_TO_INDEX = { ma: 0, di: 1, wo: 2, do: 3, vr: 4, za: 5, zo: 6 }
  const trainingDayIndices = (trainingDays || []).map(c => CODE_TO_INDEX[c]).filter(i => i != null).sort((a, b) => a - b)
  const currentDayIsTraining = trainingDays?.length > 0
    ? trainingDays.includes(DAY_CODE_BY_INDEX[activeDay])
    : !!currentDay?.is_training_day
  const preWorkoutSlot = getPreWorkoutSlot(activeDay)
  const sortedSlots = currentDay ? getSortedSlots(currentDay.meals) : SLOTS
  const warningCount = weekData?.reduce((count, day) => {
    if (!targets?.calories) return count
    const cal = day.totals?.kcal || day.totals?.calories || 0
    const pct = targets.calories ? cal / targets.calories : 1
    return count + (pct < 0.85 || pct > 1.15 ? 1 : 0)
  }, 0) || 0
  const activePlanCount = allClientPlans.filter(p => p.is_active).length

  // ── Sidebar knoppen definitie ──
  const sidebarTop = [
    {
      id: 'activate',
      render: () => (
        <button onClick={handleActivate} disabled={activating || activated || planMeta?.isActive} style={{
          width: '44px', padding: '6px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
          background: (activated || planMeta?.isActive) ? 'rgba(16,185,129,0.12)' : 'rgba(16,185,129,0.08)',
          border: `1px solid ${(activated || planMeta?.isActive) ? 'rgba(16,185,129,0.4)' : 'rgba(16,185,129,0.2)'}`,
          borderRadius: '7px', cursor: (activated || planMeta?.isActive) ? 'default' : 'pointer',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
        }}>
          {activating ? <Loader size={13} color="#10b981" style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={13} color="#10b981" />}
          <span style={{ fontSize: '0.38rem', fontWeight: 700, color: '#10b981' }}>{(activated || planMeta?.isActive) ? 'Actief' : 'Activeer'}</span>
        </button>
      )
    },
  ]

  // Toggle een sectie in het dock-paneel (klik zelfde knop = sluiten).
  const toggleDock = (id) => setDockedSection(d => d === id ? null : id)
  const sidebarNav = [
    { id: 'plans',  icon: <List size={18} />,      label: 'Plannen', active: dockedSection === 'plans',  onClick: () => toggleDock('plans'),  badge: allClientPlans.length > 0 ? allClientPlans.length : null },
    { id: 'client', icon: '👤',                    label: 'Client',  active: dockedSection === 'client', onClick: () => toggleDock('client') },
    { id: 'timing', icon: <Clock size={18} />,     label: 'Tijden',  active: dockedSection === 'timing', onClick: () => toggleDock('timing') },
    { id: 'dag',    icon: <Zap size={18} />,       label: 'Dag',     active: dockedSection === 'dag',    onClick: () => toggleDock('dag') },
    { id: 'week',   icon: <Grid3X3 size={18} />,   label: 'Week',    active: viewMode === 'week',        onClick: () => setViewMode(v => v === 'week' ? 'day' : 'week') },
    { id: 'agenda', icon: <Calendar size={18} />,  label: 'Agenda',  active: dockedSection === 'agenda', onClick: () => toggleDock('agenda') },
    { id: 'swaps',  icon: <Repeat size={18} />,    label: 'Swaps',   active: dockedSection === 'swaps',  onClick: () => toggleDock('swaps') },
    { id: 'library', icon: <Bookmark size={18} />, label: 'Opslaan', active: dockedSection === 'library', onClick: () => toggleDock('library') },
  ]

  const sidebarBottom = [
    { id: 'pdf',     icon: loadingPdf ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={16} />, label: 'PDF',    onClick: handlePDF,                                                     color: '#FFD700' },
    { id: 'guide',   icon: <FileText size={16} />,    label: 'Guide',  onClick: () => openCoachingGuideForPrint(clientRecord?.first_name || 'Client'), color: '#6366f1' },
    { id: 'wa',      icon: <MessageSquare size={16} />, label: 'WA',   onClick: handleWhatsApp,  color: '#10b981' },
    { id: 'undo',    icon: <RotateCcw size={16} />,   label: 'Undo',   onClick: handleUndo,      color: canUndo ? '#fff' : 'rgba(255,255,255,0.2)', disabled: !canUndo },
    { id: 'redo',    icon: <RotateCw size={16} />,    label: 'Redo',   onClick: handleRedo,      color: canRedo ? '#fff' : 'rgba(255,255,255,0.2)', disabled: !canRedo },
  ]

  return (
    <div style={{ display: 'flex', height: '100%', minHeight: '400px', background: '#0a0a0a', position: 'relative' }}>

      {/* ════════════ SIDEBAR ════════════
          Bredere kolom (72/92 ipv 56/80), iconen 18px (was 14), labels
          0.58rem (was 0.42 ≈ 5px). Inactieve knoppen krijgen een subtiele
          achtergrond + border zodat ze duidelijk als tap-target ogen. */}
      <div style={{
        width: m ? 72 : 92, flexShrink: 0,
        background: '#080808',
        borderRight: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '10px 0', gap: 6,
        overflowY: 'auto', WebkitOverflowScrolling: 'touch',
      }}>
        {/* Activeer knop */}
        {planMeta && (() => {
          const isActiveAlready = activated || planMeta?.isActive
          return (
            <button
              onClick={handleActivate}
              disabled={activating || isActiveAlready}
              style={{
                width: m ? 58 : 78, padding: '8px 4px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                background: 'rgba(16,185,129,0.08)',
                border: '1px solid rgba(16,185,129,0.3)',
                borderRadius: 8,
                cursor: isActiveAlready ? 'default' : 'pointer',
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              }}
            >
              {activating
                ? <Loader size={18} color="#10b981" style={{ animation: 'spin 1s linear infinite' }} />
                : <Check size={18} color="#10b981" />}
              <span style={{ fontSize: '0.58rem', fontWeight: 800, color: '#10b981' }}>
                {isActiveAlready ? 'Actief' : 'Activeer'}
              </span>
            </button>
          )
        })()}

        <div style={{ width: 36, height: 1, background: 'rgba(255,255,255,0.08)', margin: '4px 0' }} />

        {/* Nav knoppen — altijd zichtbare achtergrond + border zodat ze
            als knoppen herkenbaar zijn. Active state krijgt gold accent. */}
        {sidebarNav.map(btn => (
          <button key={btn.id} onClick={btn.onClick} title={btn.label} style={{
            width: m ? 58 : 78, padding: '8px 4px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            background: btn.active ? 'rgba(255,215,0,0.14)' : 'rgba(255,255,255,0.025)',
            border: `1px solid ${btn.active ? 'rgba(255,215,0,0.45)' : 'rgba(255,255,255,0.07)'}`,
            borderRadius: 8, cursor: 'pointer',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            position: 'relative', transition: 'background 0.15s ease, border-color 0.15s ease',
          }}>
            <span style={{
              color: btn.active ? '#FFD700' : 'rgba(255,255,255,0.65)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: typeof btn.icon === 'string' ? '18px' : undefined,
            }}>
              {btn.icon}
            </span>
            <span style={{
              fontSize: '0.58rem', fontWeight: 800,
              color: btn.active ? '#FFD700' : 'rgba(255,255,255,0.6)',
              letterSpacing: '0.01em',
            }}>{btn.label}</span>
            {btn.badge && (
              <span style={{
                position: 'absolute', top: 3, right: 3,
                fontSize: '0.45rem', fontWeight: 800,
                background: '#FFD700', color: '#000',
                borderRadius: 8, padding: '0 4px',
                lineHeight: 1.5, minWidth: 14, textAlign: 'center',
              }}>{btn.badge}</span>
            )}
          </button>
        ))}

        {/* Waarschuwing indicator */}
        {warningCount > 0 && (
          <div style={{
            width: m ? 58 : 78, padding: '6px 4px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 8,
          }}>
            <AlertTriangle size={16} color="#ef4444" />
            <span style={{ fontSize: '0.55rem', fontWeight: 800, color: '#ef4444' }}>{warningCount}d</span>
          </div>
        )}

        <div style={{ flex: 1 }} />

        <div style={{ width: 36, height: 1, background: 'rgba(255,255,255,0.08)', margin: '4px 0' }} />

        {/* Bottom acties — zelfde stijl als nav */}
        {sidebarBottom.map(btn => (
          <button key={btn.id} onClick={btn.onClick} disabled={btn.disabled} title={btn.label} style={{
            width: m ? 58 : 78, padding: '8px 4px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 8,
            cursor: btn.disabled ? 'not-allowed' : 'pointer',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            opacity: btn.disabled ? 0.4 : 1,
          }}>
            <span style={{
              color: btn.color || 'rgba(255,255,255,0.7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>{btn.icon}</span>
            <span style={{
              fontSize: '0.58rem', fontWeight: 800,
              color: btn.disabled ? 'rgba(255,255,255,0.25)' : (btn.color || 'rgba(255,255,255,0.6)'),
            }}>{btn.label}</span>
          </button>
        ))}
      </div>

      {/* ════════════ DOCK-PANEEL ════════════
          De gekozen sectie opent hier, naast de knoppenbalk. Samen vullen ze
          ~40% van de breedte; de bouwer (dag+maaltijden) neemt de rest. Op
          mobiel ligt het paneel als overlay over de bouwer. De transform maakt
          de fixed-modals binnen dit paneel relatief hieraan i.p.v. het scherm. */}
      {(dockedSection || swapState || applyDaysState) && (
        <div style={{
          flexShrink: 0, minWidth: 0, background: '#0a0a0a',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          transform: 'translateZ(0)', overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          ...(m
            ? { position: 'absolute', left: 72, right: 0, top: 0, bottom: 0, zIndex: 40 }
            : { position: 'relative', flexBasis: dockWidth, width: dockWidth }),
        }}>
          {/* Swap + "toepassen op dagen" openen met voorrang in het modal vak
              (getriggerd door de knoppen op een meal card). */}
          {swapState ? (
            <SwapModal embedded db={db} slot={swapState.slot} currentMeal={swapState.meal}
              dayIndex={swapState.dayIndex} dayTotals={currentDay?.totals} targets={targets}
              trainingDays={trainingDayIndices}
              onSelect={handleSwapSelect} onMultiDaySelect={handleMultiDaySelect}
              onClose={() => setSwapState(null)} isMobile={m} />
          ) : applyDaysState ? (
            <ApplyDaysModal embedded meal={applyDaysState.meal} slot={applyDaysState.slot}
              dayIndex={applyDaysState.dayIndex} trainingDays={trainingDayIndices}
              onApply={handleApplyDaysConfirm}
              onClose={() => setApplyDaysState(null)} isMobile={m} />
          ) : (<>
          {dockedSection === 'client' && resolvedClientId && (
            <ClientContextPanel db={db} clientId={resolvedClientId} isMobile={m} isFloating={false} onClose={() => setDockedSection(null)} />
          )}
          {dockedSection === 'timing' && weekData && (
            <TimingModal embedded weekData={weekData}
              onApply={async (updated) => { await applyWeekUpdate(updated, 'Tijden bijgewerkt'); setDockedSection(null) }}
              onClose={() => setDockedSection(null)} isMobile={m} />
          )}
          {dockedSection === 'dag' && currentDay && (
            <AutoBalancer embedded dayData={currentDay} targets={targets} dayIndex={activeDay}
              onApply={handleAutoBalance} onClose={() => setDockedSection(null)} isMobile={m} />
          )}
          {dockedSection === 'swaps' && resolvedClientId && (
            <BestSwapsModal embedded db={db} clientId={resolvedClientId} isMobile={m} onClose={() => setDockedSection(null)} />
          )}
          {dockedSection === 'plans' && resolvedClientId && (
            <PlanSwitcherModal embedded db={db} clientId={resolvedClientId} coachId={coachId} activePlanId={planMeta?.id}
              onSelect={(planId) => { setSelectedConceptId(planId); setDockedSection(null); loadAllPlanCount(resolvedClientId) }}
              onClose={() => setDockedSection(null)} isMobile={m} />
          )}
          {dockedSection === 'library' && (
            <PlanLibraryModal embedded db={db} coachId={coachId} isMobile={m}
              weekData={weekData} planMeta={planMeta}
              clientName={clientRecord?.first_name || ''}
              onLoad={handleLoadSavedPlan}
              onClose={() => setDockedSection(null)} />
          )}
          {dockedSection === 'agenda' && (clientRecord || resolvedClientId) && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0a0a0a' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0.8rem', borderBottom: '1px solid rgba(255,215,0,0.2)', flexShrink: 0 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#FFD700', fontWeight: 800, fontSize: m ? '0.85rem' : '0.9rem' }}>
                  <Calendar size={15} /> Agenda · {DAYS[activeDay]?.full || DAYS[activeDay]?.label || ''}
                </span>
                <button onClick={() => setDockedSection(null)} style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}><X size={15} /></button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', background: 'rgba(0,0,0,0.2)' }}>
                <ClientAgendaView
                  client={clientRecord || { id: resolvedClientId }}
                  db={db}
                  isMobile={m}
                  viewerRole="coach"
                  singleDay={DAYS[activeDay]?.id}
                  refreshKey={agendaRefreshKey}
                  mealPlanId={selectedConceptId || planMeta?.id || null}
                  onMealTimingChange={({ day, slot, newTiming }) => {
                    const idx = DAYS.findIndex(d => d.id === day)
                    if (idx < 0 || !slot || !newTiming) return
                    setWeekData(prev => {
                      if (!prev) return prev
                      const next = [...prev]
                      if (!next[idx]?.meals?.[slot]) return prev
                      next[idx] = { ...next[idx], meals: { ...next[idx].meals, [slot]: { ...next[idx].meals[slot], timing: newTiming } } }
                      return next
                    })
                  }}
                  onMealUpdate={() => {
                    const reloadId = selectedConceptId || planMeta?.id
                    if (reloadId) loadConceptPlan(reloadId)
                  }}
                />
              </div>
            </div>
          )}
          </>)}
        </div>
      )}

      {/* Sleep-handvat om het dock-paneel breder/smaller te maken (desktop). */}
      {(dockedSection || swapState || applyDaysState) && !m && (
        <div
          onPointerDown={startDockResize}
          title="Sleep om het paneel groter/kleiner te maken"
          style={{
            flexShrink: 0, width: 7, cursor: 'col-resize', alignSelf: 'stretch',
            background: 'rgba(255,255,255,0.05)',
            borderRight: '1px solid rgba(255,255,255,0.08)',
            zIndex: 45, touchAction: 'none',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,215,0,0.3)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
        />
      )}

      {/* ════════════ MAIN BUILDER ════════════ */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header — compact: pijl + dagnaam + pijl, daaronder MacroHero
            (zelfde stijl als client meal pagina). De oude plan-name banner,
            DayMacroBar, DayNavigator-knoppen en training-badge zijn weg. */}
        <div style={{ flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            // Bredere zij-padding → pijlen liggen meer naar binnen, niet
            // aan de rand van het paneel. Mobiel iets minder agressief
            // dan desktop om tap-targets behouden te houden.
            padding: m ? '0.6rem 2.5rem' : '0.75rem 5rem',
            gap: 10,
          }}>
            <button
              onClick={() => setActiveDay(d => Math.max(0, d - 1))}
              disabled={activeDay === 0}
              aria-label="Vorige dag"
              style={{
                width: m ? 32 : 36, height: m ? 32 : 36,
                background: 'transparent', border: 'none',
                color: activeDay === 0 ? 'rgba(255,255,255,0.18)' : '#FFD700',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 0, cursor: activeDay === 0 ? 'not-allowed' : 'pointer',
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                flexShrink: 0,
              }}
            >
              <ChevronLeft size={m ? 22 : 24} strokeWidth={2.4} />
            </button>

            <div style={{
              flex: 1, textAlign: 'center', minWidth: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            }}>
              <div style={{
                fontSize: m ? '1.15rem' : '1.3rem',
                fontWeight: 900,
                color: '#FFD700',
                letterSpacing: '-0.02em', lineHeight: 1.1,
                whiteSpace: 'nowrap',
              }}>
                {DAYS[activeDay]?.full || '—'}
              </div>
              {currentDayIsTraining && (
                <div style={{
                  fontSize: '0.55rem', fontWeight: 800,
                  color: 'rgba(0,0,0,0.85)',
                  background: '#FFD700',
                  padding: '2px 7px', borderRadius: 4,
                  letterSpacing: '0.05em', textTransform: 'uppercase',
                }}>
                  Trainingsdag
                </div>
              )}
            </div>

            <button
              onClick={() => setActiveDay(d => Math.min(6, d + 1))}
              disabled={activeDay === 6}
              aria-label="Volgende dag"
              style={{
                width: m ? 32 : 36, height: m ? 32 : 36,
                background: 'transparent', border: 'none',
                color: activeDay === 6 ? 'rgba(255,255,255,0.18)' : '#FFD700',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 0, cursor: activeDay === 6 ? 'not-allowed' : 'pointer',
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                flexShrink: 0,
              }}
            >
              <ChevronRight size={m ? 22 : 24} strokeWidth={2.4} />
            </button>
          </div>

          {/* MacroHero — in week-view direct hier (geen splitsing). In
              day-view verhuist 'ie naar boven de meal-cards kolom. */}
          {viewMode === 'week' && (
            <MacroHero
              consumed={{
                calories: currentDay?.totals?.kcal || currentDay?.totals?.calories || 0,
                protein:  currentDay?.totals?.protein || 0,
                carbs:    currentDay?.totals?.carbs || 0,
                fat:      currentDay?.totals?.fat || 0,
              }}
              targets={targets || {}}
              db={db}
              clientId={resolvedClientId}
              isMobile={m}
              selectedIsToday={true}
            />
          )}
        </div>

        {/* ── WEEK VIEW: rendered agenda ── */}
        {/* De client-agenda heeft de hele week timeline al met meals,
            workouts, sleep en werk-blokken. Coach kan vanuit hier drag/
            click-edits doen die direct doorslaan naar week_structure +
            client_agenda_blocks. Plan-analyzer's lokale state blijft
            stale tot reload, maar de DB is bron-van-waarheid. */}
        {viewMode === 'week' && (
          <div style={{ flex: 1, overflow: 'auto' }}>
            {(clientRecord || resolvedClientId) ? (
              <ClientAgendaView
                client={clientRecord || { id: resolvedClientId }}
                db={db}
                isMobile={m}
                viewerRole="coach"
                refreshKey={agendaRefreshKey}
                mealPlanId={selectedConceptId || planMeta?.id || null}
                onMealTimingChange={({ day, slot, newTiming }) => {
                  // Synchroon: update weekData lokaal zodat MealCard direct
                  // de nieuwe tijd toont. Agenda's async DB-save runt apart.
                  const idx = DAYS.findIndex(d => d.id === day)
                  if (idx < 0 || !slot || !newTiming) return
                  setWeekData(prev => {
                    if (!prev) return prev
                    const next = [...prev]
                    if (!next[idx]?.meals?.[slot]) return prev
                    next[idx] = {
                      ...next[idx],
                      meals: {
                        ...next[idx].meals,
                        [slot]: { ...next[idx].meals[slot], timing: newTiming },
                      },
                    }
                    return next
                  })
                }}
                onMealUpdate={() => {
                  const reloadId = selectedConceptId || planMeta?.id
                  if (reloadId) loadConceptPlan(reloadId)
                }}
              />
            ) : (
              <div style={{ padding: '2rem', color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>
                Selecteer een client om de agenda te laden.
              </div>
            )}
          </div>
        )}

        {/* ── DAG VIEW ──
            Twee onafhankelijk scrollende stroken:
              LINKS  = agenda dag-strook (volle hoogte van content-area)
              RECHTS = MacroHero + meal cards (boven elkaar, samen scrollend) */}
        {viewMode === 'day' && (
          <div style={{
            flex: 1, overflow: 'hidden',
            display: 'flex',
            flexDirection: m ? 'column' : 'row',
            WebkitOverflowScrolling: 'touch',
          }}>
            {/* Meal-cards strook — MacroHero erboven, beide samen scrollend */}
            <div style={{
              flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch',
              minWidth: 0,
            }}>
              <MacroHero
                consumed={{
                  calories: currentDay?.totals?.kcal || currentDay?.totals?.calories || 0,
                  protein:  currentDay?.totals?.protein || 0,
                  carbs:    currentDay?.totals?.carbs || 0,
                  fat:      currentDay?.totals?.fat || 0,
                }}
                targets={targets || {}}
                db={db}
                clientId={resolvedClientId}
                isMobile={m}
                selectedIsToday={true}
              />
              {currentDay && sortedSlots.map(slot => {
                const meal = currentDay.meals[slot]
                const isPreWorkout = slot === preWorkoutSlot
                const expectedSlots = mealSchedule?.num_meals
                  ? SLOTS.slice(0, Math.min(mealSchedule.num_meals, SLOTS.length))
                  : SLOTS.slice(0, 4)
                if (!meal && !expectedSlots.includes(slot)) return null
                const conflicts = getMealConflicts(meal)
                return (
                  <MealCard key={slot} db={db} meal={meal} slot={slot} dayIndex={activeDay}
                    mealSchedule={mealSchedule} isPreWorkout={isPreWorkout}
                    isEmpty={!meal} onSwap={handleSwap} onDelete={handleDelete}
                    onAdd={handleAdd} onUpdateMeal={handleUpdateMeal} onApplyToDays={handleApplyToDays}
                    conflicts={conflicts} isMobile={m} />
                )
              })}

              {/* Nieuwe maaltijd toevoegen — pakt de eerstvolgende vrije slot
                  en opent de kies-modal. */}
              {currentDay && (() => {
                const freeSlot = SLOTS.find(s => !currentDay.meals?.[s])
                return (
                  <button
                    onClick={() => freeSlot && handleAdd(activeDay, freeSlot)}
                    disabled={!freeSlot}
                    style={{
                      width: '100%', marginTop: '0.6rem',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                      padding: m ? '0.7rem' : '0.8rem',
                      background: freeSlot ? 'rgba(255,215,0,0.08)' : 'rgba(255,255,255,0.03)',
                      border: `1px dashed ${freeSlot ? 'rgba(255,215,0,0.4)' : 'rgba(255,255,255,0.1)'}`,
                      borderRadius: 12,
                      color: freeSlot ? '#FFD700' : 'rgba(255,255,255,0.25)',
                      fontSize: m ? '0.78rem' : '0.85rem', fontWeight: 800,
                      cursor: freeSlot ? 'pointer' : 'not-allowed',
                      touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', fontFamily: 'inherit',
                    }}
                  >
                    <Plus size={16} /> {freeSlot ? 'Maaltijd toevoegen' : 'Alle maaltijd-slots gevuld'}
                  </button>
                )
              })()}
            </div>
          </div>
        )}
      </div>

      {/* ════════════ MODALS ════════════ */}
      {/* SwapModal opent nu in het modal vak (zie boven), niet meer full-screen. */}

      {showBalancer && currentDay && (
        <AutoBalancer dayData={currentDay} targets={targets} dayIndex={activeDay}
          onApply={handleAutoBalance} onClose={() => setShowBalancer(false)} isMobile={m} />
      )}

      {showWeekBalancer && weekData && (
        <WeekBalancer weekData={weekData} targets={targets}
          onApply={handleWeekBalance} onClose={() => setShowWeekBalancer(false)} isMobile={m} />
      )}

      {showTimingModal && weekData && (
        <TimingModal weekData={weekData}
          onApply={async (updated) => { await applyWeekUpdate(updated, 'Tijden bijgewerkt'); setShowTimingModal(false) }}
          onClose={() => setShowTimingModal(false)} isMobile={m} />
      )}

      {showFloatingClient && resolvedClientId && (
        <ClientContextPanel db={db} clientId={resolvedClientId} isMobile={m} isFloating={true} />
      )}

      {showBestSwaps && resolvedClientId && (
        <BestSwapsModal db={db} clientId={resolvedClientId} isMobile={m} onClose={() => setShowBestSwaps(false)} />
      )}

      {showPlanSwitcher && resolvedClientId && (
        <PlanSwitcherModal db={db} clientId={resolvedClientId} coachId={coachId} activePlanId={planMeta?.id}
          onSelect={(planId) => { setSelectedConceptId(planId); setShowPlanSwitcher(false); loadAllPlanCount(resolvedClientId) }}
          onClose={() => setShowPlanSwitcher(false)} isMobile={m} />
      )}

      {/* Day-templates overlay verwijderd (2026-07-03) — op verzoek uitgezet. */}
      {false && showDayTemplates && resolvedClientId && createPortal(
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setShowDayTemplates(false) }}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.88)',
            zIndex: 2147483600,
            display: 'flex', flexDirection: 'column',
          }}
        >
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0.7rem 1rem',
            background: '#0a0a0a',
            borderBottom: '1px solid rgba(255,215,0,0.2)',
            flexShrink: 0,
          }}>
            <span style={{ color: '#FFD700', fontWeight: 800, fontSize: '0.9rem', letterSpacing: '-0.01em' }}>
              Dag-templates {clientRecord?.first_name ? `· ${clientRecord.first_name}` : ''}
            </span>
            <button
              onClick={() => setShowDayTemplates(false)}
              style={{
                width: 36, height: 36,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8, color: 'rgba(255,255,255,0.6)',
                cursor: 'pointer', touchAction: 'manipulation',
              }}
            >
              <X size={16} />
            </button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', background: '#0a0a0a' }}
               onClick={(e) => e.stopPropagation()}>
            <DayTemplatesSectionWrapper
              db={db}
              clientId={resolvedClientId}
              activePlan={planMeta ? { id: planMeta.id } : null}
              onPlanUpdate={() => { /* reload via parent if needed */ }}
              onNavigateToDay={(dayKey) => {
                const idx = DAYS.findIndex(d => d.key === dayKey)
                if (idx >= 0) { setActiveDay(idx); setViewMode('day') }
                setShowDayTemplates(false)
              }}
            />
          </div>
        </div>,
        document.body
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
