// src/modules/ai-meal-generator/tabs/PlanAnalyzer.jsx
// v4.0 — Sidebar layout: linker icon nav + compacte builder rechts

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { BarChart3, FileText, ChevronRight, AlertTriangle, Zap, Grid3X3, Calendar, List, Download, MessageSquare, Play, Check, Loader, Clock, RotateCcw, RotateCw } from 'lucide-react'
import DayNavigator, { DAYS } from './plan-analyzer/DayNavigator'
import DayMacroBar from './plan-analyzer/DayMacroBar'
import MealCard from './plan-analyzer/MealCard'
import SwapModal from './plan-analyzer/SwapModal'
import ClientContextPanel from './plan-analyzer/ClientContextPanel'
import AutoBalancer from './plan-analyzer/AutoBalancer'
import WeekBalancer from './plan-analyzer/WeekBalancer'
import WeekOverview from './plan-analyzer/WeekOverview'
import PlanSwitcherModal from './plan-analyzer/PlanSwitcherModal'
import TimingModal from './plan-analyzer/TimingModal'
import { checkMealConflicts, buildConflictClientData } from './plan-analyzer/ConflictChecker'
import { openMealPlanForPrint, openCoachingGuideForPrint } from '../mealplanhtmlgenerator'

const SLOTS = ['breakfast', 'snack1', 'lunch', 'snack2', 'dinner', 'snack3']
const SLOT_DEFAULT_TIMES = {
  breakfast: '07:30', snack1: '10:30', lunch: '13:00',
  snack2: '15:30', dinner: '19:00', snack3: '21:30'
}
const MAX_HISTORY = 50

export default function PlanAnalyzer({
  db, generatedPlan, planModifications, setPlanModifications,
  dailyTargets, isMobile, conceptPlanId, clientId, onPlanActivated,
  onConceptLoaded, coachId
}) {
  const [activeDay, setActiveDay] = useState(0)
  const [weekData, setWeekData] = useState(null)
  const [targets, setTargets] = useState(dailyTargets || null)
  const [planMeta, setPlanMeta] = useState(null)
  const [conceptPlans, setConceptPlans] = useState([])
  const [loadingConcepts, setLoadingConcepts] = useState(false)
  const [selectedConceptId, setSelectedConceptId] = useState(conceptPlanId || null)
  const [swapState, setSwapState] = useState(null)
  const [clientIntake, setClientIntake] = useState(null)
  const [clientRecord, setClientRecord] = useState(null)
  const [viewMode, setViewMode] = useState('day')
  const [showPlanSwitcher, setShowPlanSwitcher] = useState(false)
  const [showTimingModal, setShowTimingModal] = useState(false)
  const [showBalancer, setShowBalancer] = useState(false)
  const [showWeekBalancer, setShowWeekBalancer] = useState(false)
  const [showFloatingClient, setShowFloatingClient] = useState(false)
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

  const loadConceptPlan = async (planId) => {
    try {
      const { data, error } = await db.supabase.from('client_meal_plans').select('*').eq('id', planId).single()
      if (error || !data?.week_structure) return
      if (data.client_id) { setResolvedClientId(data.client_id); if (onConceptLoaded) onConceptLoaded(data.client_id) }
      const ws = data.week_structure
      const mealIds = new Set()
      Object.values(ws).forEach(dd => {
        if (!dd) return
        SLOTS.forEach(s => { if (dd[s]?.meal_id) mealIds.add(dd[s].meal_id); if (dd[s]?.id) mealIds.add(dd[s].id) })
      })
      const mealDataMap = {}
      if (mealIds.size > 0) {
        const { data: mealRows, error: mealError } = await db.supabase
          .from('ai_meals')
          .select('id, name, internal_name, calories, protein, carbs, fat, image_url, ingredients_list, preparation_steps, tips, allergens, scalable, difficulty, labels, timing, icon')
          .in('id', [...mealIds])
        if (mealError) console.error('❌ ai_meals query error:', mealError)
        mealRows?.forEach(m => { mealDataMap[m.id] = m })
      }
      const days = DAYS.map(day => {
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
      setWeekData(days)
      setTargets({ calories: data.daily_calories || 2500, protein: data.daily_protein || 150, carbs: data.daily_carbs || 300, fat: data.daily_fat || 80 })
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
  const trainingDaysFromSchedule = workoutSchedule ? Object.keys(workoutSchedule).map(k => EN_TO_NL[k]).filter(Boolean) : null
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
  }

  // ════════════ MEAL EDITING ════════════

  const handleSwap = (dayIndex, slot, meal) => setSwapState({ dayIndex, slot, meal })
  const handleSwapSelect = async (newMeal) => {
    if (!swapState || !weekData) return
    const updated = [...weekData]
    updated[swapState.dayIndex] = { ...updated[swapState.dayIndex], meals: { ...updated[swapState.dayIndex].meals, [swapState.slot]: newMeal } }
    updated[swapState.dayIndex].totals = calculateTotals(updated[swapState.dayIndex].meals)
    await applyWeekUpdate(updated, `Swap ${DAYS[swapState.dayIndex].full}: ${swapState.meal?.name || 'leeg'} → ${newMeal.name || '?'}`)
    setSwapState(null)
  }
  const handleMultiDaySelect = async (newMeal, slot, dayIndices) => {
    if (!weekData) return
    const updated = [...weekData]
    dayIndices.forEach(di => { updated[di] = { ...updated[di], meals: { ...updated[di].meals, [slot]: newMeal } }; updated[di].totals = calculateTotals(updated[di].meals) })
    await applyWeekUpdate(updated, `Swap ${slot} op ${dayIndices.length} dagen → ${newMeal.name}`)
    setSwapState(null)
  }
  const handleDelete = async (dayIndex, slot) => {
    if (!weekData) return
    const mealName = weekData[dayIndex].meals[slot]?.name || 'maaltijd'
    const updated = [...weekData]; const meals = { ...updated[dayIndex].meals }; delete meals[slot]
    updated[dayIndex] = { ...updated[dayIndex], meals }; updated[dayIndex].totals = calculateTotals(meals)
    await applyWeekUpdate(updated, `Verwijderd: ${mealName} (${DAYS[dayIndex].full})`)
  }
  const handleAdd = (dayIndex, slot) => setSwapState({ dayIndex, slot, meal: null })
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

  const sidebarNav = [
    { id: 'plans',  icon: <List size={14} />,      label: 'Plannen', active: showPlanSwitcher,     onClick: () => setShowPlanSwitcher(true),        badge: allClientPlans.length > 0 ? allClientPlans.length : null },
    { id: 'client', icon: '👤',                    label: 'Client',  active: showFloatingClient,   onClick: () => setShowFloatingClient(p => !p) },
    { id: 'timing', icon: <Clock size={14} />,     label: 'Tijden',  active: showTimingModal,      onClick: () => setShowTimingModal(true) },
    { id: 'dag',    icon: <Zap size={14} />,       label: 'Dag',     active: showBalancer,         onClick: () => setShowBalancer(true) },
    { id: 'week',   icon: <Grid3X3 size={14} />,   label: 'Week',    active: viewMode === 'week',  onClick: () => setViewMode(v => v === 'week' ? 'day' : 'week') },
  ]

  const sidebarBottom = [
    { id: 'pdf',     icon: loadingPdf ? <Loader size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={13} />, label: 'PDF',    onClick: handlePDF,                                                     color: '#FFD700' },
    { id: 'guide',   icon: <FileText size={13} />,    label: 'Guide',  onClick: () => openCoachingGuideForPrint(clientRecord?.first_name || 'Client'), color: '#6366f1' },
    { id: 'wa',      icon: <MessageSquare size={13} />, label: 'WA',   onClick: handleWhatsApp,  color: '#10b981' },
    { id: 'undo',    icon: <RotateCcw size={13} />,   label: 'Undo',   onClick: handleUndo,      color: canUndo ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.1)', disabled: !canUndo },
    { id: 'redo',    icon: <RotateCw size={13} />,    label: 'Redo',   onClick: handleRedo,      color: canRedo ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.1)', disabled: !canRedo },
  ]

  return (
    <div style={{ display: 'flex', height: '100%', minHeight: '400px', background: '#0a0a0a' }}>

      {/* ════════════ SIDEBAR ════════════ */}
      <div style={{
        width: m ? '56px' : '80px', flexShrink: 0,
        background: '#080808',
        borderRight: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '8px 0', gap: '4px',
        overflowY: 'auto', WebkitOverflowScrolling: 'touch'
      }}>
        {/* Activeer knop */}
        {planMeta && (
          <button onClick={handleActivate} disabled={activating || activated || planMeta?.isActive} style={{
            width: m ? '44px' : '68px', padding: '6px 0',
          }}>
            {activating ? <Loader size={14} color="#10b981" style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={14} color="#10b981" />}
            <span style={{ fontSize: '0.42rem', fontWeight: 700, color: '#10b981' }}>{(activated || planMeta?.isActive) ? 'Actief' : 'Activeer'}</span>
          </button>
        )}

        <div style={{ width: '32px', height: '1px', background: 'rgba(255,255,255,0.06)', margin: '2px 0' }} />

        {/* Nav knoppen */}
        {sidebarNav.map(btn => (
          <button key={btn.id} onClick={btn.onClick} title={btn.label} style={{
            width: m ? '44px' : '68px', padding: '6px 0',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
            background: btn.active ? 'rgba(255,215,0,0.08)' : 'transparent',
            border: `1px solid ${btn.active ? 'rgba(255,215,0,0.2)' : 'transparent'}`,
            borderRadius: '7px', cursor: 'pointer',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            position: 'relative', transition: 'all 0.15s ease'
          }}>
            <span style={{ color: btn.active ? '#FFD700' : 'rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: typeof btn.icon === 'string' ? '13px' : undefined }}>
              {btn.icon}
            </span>
            <span style={{ fontSize: '0.42rem', fontWeight: 700, color: btn.active ? '#FFD700' : 'rgba(255,255,255,0.25)' }}>{btn.label}</span>
            {btn.badge && (
              <span style={{ position: 'absolute', top: '2px', right: '2px', fontSize: '0.32rem', fontWeight: 800, background: 'rgba(255,215,0,0.15)', color: '#FFD700', borderRadius: '3px', padding: '0 2px', lineHeight: '1.4' }}>{btn.badge}</span>
            )}
          </button>
        ))}

        {/* Waarschuwing indicator */}
        {warningCount > 0 && (
          <div style={{ width: m ? '36px' : '40px', padding: '3px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
            <AlertTriangle size={12} color="#ef4444" />
            <span style={{ fontSize: '0.35rem', fontWeight: 700, color: '#ef4444' }}>{warningCount}d</span>
          </div>
        )}

        <div style={{ flex: 1 }} />

        <div style={{ width: '32px', height: '1px', background: 'rgba(255,255,255,0.06)', margin: '2px 0' }} />

        {/* Bottom acties */}
        {sidebarBottom.map(btn => (
          <button key={btn.id} onClick={btn.onClick} disabled={btn.disabled} title={btn.label} style={{
            width: m ? '44px' : '68px', padding: '6px 0',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
            background: 'transparent', border: '1px solid transparent',
            borderRadius: '7px', cursor: btn.disabled ? 'not-allowed' : 'pointer',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            opacity: btn.disabled ? 0.35 : 1
          }}>
            <span style={{ color: btn.color || 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{btn.icon}</span>
            <span style={{ fontSize: '0.42rem', fontWeight: 700, color: btn.disabled ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.3)' }}>{btn.label}</span>
          </button>
        ))}
      </div>

      {/* ════════════ MAIN BUILDER ════════════ */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Plan naam + dag header */}
        <div style={{ flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          {/* Plan naam */}
          {planMeta && (
            <div style={{ padding: '0.25rem 0.75rem', background: (activated || planMeta?.isActive) ? 'rgba(16,185,129,0.03)' : 'rgba(255,215,0,0.02)', borderBottom: '1px solid rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.38rem', fontWeight: 700, color: (activated || planMeta?.isActive) ? '#10b981' : '#FFD700', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {(activated || planMeta?.isActive) ? '✓ ACTIEF' : '⏳ CONCEPT'}
              </span>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#fff', flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{planMeta.name}</span>
              {planMeta.stats?.smartScaling && (
                <span style={{ fontSize: '0.38rem', color: 'rgba(255,255,255,0.2)', flexShrink: 0 }}>{planMeta.stats.smartScaling.replacements} vervangingen</span>
              )}
            </div>
          )}

          {/* Macro bar */}
          <DayMacroBar dayTotals={currentDay?.totals} targets={targets} isMobile={m} />

          {/* Dag navigator */}
          <div style={{ padding: m ? '0.25rem 0.5rem' : '0.3rem 0.75rem' }}>
            <DayNavigator activeDay={activeDay} setActiveDay={setActiveDay} weekData={weekData} targets={targets} trainingDays={trainingDays} isMobile={m} />
          </div>

          {/* Dag naam + training badge */}
          <div style={{ padding: '0.2rem 0.75rem 0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: m ? '0.85rem' : '0.95rem', fontWeight: 800, color: '#fff' }}>{DAYS[activeDay]?.full || ''}</span>
            {currentDay?.is_training_day && (
              <span style={{ fontSize: '0.38rem', fontWeight: 700, color: '#f97316', background: 'rgba(249,115,22,0.1)', padding: '0.08rem 0.3rem', borderRadius: '3px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>TRAININGSDAG</span>
            )}
            {lastAction && (
              <span style={{ fontSize: '0.38rem', color: 'rgba(255,255,255,0.15)', marginLeft: 'auto' }}>{lastAction}</span>
            )}
          </div>
        </div>

        {/* ── WEEK VIEW ── */}
        {viewMode === 'week' && (
          <div style={{ flex: 1, overflow: 'auto' }}>
            <WeekOverview weekData={weekData} targets={targets} trainingDays={trainingDays} activeDay={activeDay}
              onSelectDay={(i) => { setActiveDay(i); setViewMode('day') }}
              onMoveMeal={handleMoveMeal} onAddMeal={handleAdd} isMobile={m} />
          </div>
        )}

        {/* ── DAG VIEW ── */}
        {viewMode === 'day' && (
          <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
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
                  onAdd={handleAdd} onUpdateMeal={handleUpdateMeal}
                  conflicts={conflicts} isMobile={m} />
              )
            })}
          </div>
        )}
      </div>

      {/* ════════════ MODALS ════════════ */}
      {swapState && (
        <SwapModal db={db} slot={swapState.slot} currentMeal={swapState.meal}
          dayIndex={swapState.dayIndex} dayTotals={currentDay?.totals}
          targets={targets} onSelect={handleSwapSelect}
          onMultiDaySelect={handleMultiDaySelect}
          onClose={() => setSwapState(null)} isMobile={m} />
      )}

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

      {showPlanSwitcher && resolvedClientId && (
        <PlanSwitcherModal db={db} clientId={resolvedClientId} coachId={coachId} activePlanId={planMeta?.id}
          onSelect={(planId) => { setSelectedConceptId(planId); setShowPlanSwitcher(false); loadAllPlanCount(resolvedClientId) }}
          onClose={() => setShowPlanSwitcher(false)} isMobile={m} />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
