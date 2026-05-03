// src/modules/workout/components/WeekSchedule.jsx
import useIsMobile from '../../../hooks/useIsMobile'
import { AlertCircle, MoveHorizontal } from 'lucide-react'
import { useState, useEffect } from 'react'
import PlanningModal from './planning/PlanningModal'
import PlanningButtons from './week-schedule/PlanningButtons'
import WeekGrid from './week-schedule/WeekGrid'
import WeekList from './week-schedule/WeekList'
import ActionButtons from './week-schedule/ActionButtons'

export default function WeekSchedule({
  weekSchedule, schema, swapMode, selectedWorkout,
  completedWorkouts = [], todayIndex, onDayClick,
  clientId, db, workoutService, onScheduleUpdate, onOpenWizard
}) {
  const isMobile = useIsMobile()
  const [localSwapMode, setLocalSwapMode] = useState(false)
  const [selectedForSwap, setSelectedForSwap] = useState(null)
  const [tempSchedule, setTempSchedule] = useState(weekSchedule || {})
  const [hasChanges, setHasChanges] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showPlanningModal, setShowPlanningModal] = useState(false)
  const [customWorkouts, setCustomWorkouts] = useState({})

  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const weekDaysDutch = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo']
  const hasValidSchema = schema && schema.week_structure && typeof schema.week_structure === 'object'

  useEffect(() => { loadSavedSchedule() }, [clientId])

  useEffect(() => {
    if (!loading && weekSchedule) {
      setTempSchedule(weekSchedule)
      loadCustomWorkoutsForSchedule(weekSchedule)
    }
  }, [weekSchedule, loading])

  const loadCustomWorkoutsForSchedule = async (schedule) => {
    if (!workoutService || !schedule) return
    const ids = Object.values(schedule).filter(v => v?.startsWith('custom_')).map(v => v.replace('custom_', ''))
    if (ids.length === 0) return
    try {
      const all = await workoutService.getCustomWorkouts(clientId)
      const map = {}
      all.forEach(w => { map[w.id] = w })
      setCustomWorkouts(map)
    } catch {}
  }

  const loadSavedSchedule = async () => {
    if (!clientId || !db) return
    setLoading(true)
    try {
      const saved = await db.getClientWorkoutSchedule(clientId)
      if (saved && Object.keys(saved).length > 0) {
        setTempSchedule(saved)
        await loadCustomWorkoutsForSchedule(saved)
        if (onScheduleUpdate) onScheduleUpdate(saved)
      }
    } catch (e) { console.error('❌ Load schedule failed:', e) }
    finally { setLoading(false) }
  }

  const handleAutoSave = async (newSchedule) => {
    if (!clientId || !db) return
    setSaving(true)
    try {
      await db.updateClientWorkoutSchedule(clientId, newSchedule)
      if (onScheduleUpdate) onScheduleUpdate(newSchedule)
      setTempSchedule(newSchedule)
      setHasChanges(false)
      if (navigator.vibrate) navigator.vibrate([30, 50, 30])
    } catch {
      if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 100])
      alert('⚠️ Opslaan mislukt.')
    } finally { setSaving(false) }
  }

  const handleSwapClick = (day, workoutKey) => {
    if (!hasValidSchema) return
    if (!localSwapMode) {
      setLocalSwapMode(true); setSelectedForSwap({ day, workoutKey })
    } else {
      if (selectedForSwap) {
        const s = { ...tempSchedule }
        if (selectedForSwap.workoutKey && workoutKey) { s[day] = selectedForSwap.workoutKey; s[selectedForSwap.day] = workoutKey }
        else if (selectedForSwap.workoutKey && !workoutKey) { s[day] = selectedForSwap.workoutKey; delete s[selectedForSwap.day] }
        else if (!selectedForSwap.workoutKey && workoutKey) { s[selectedForSwap.day] = workoutKey; delete s[day] }
        handleAutoSave(s)
      }
      setLocalSwapMode(false); setSelectedForSwap(null)
    }
  }

  const handleCancel = () => {
    setTempSchedule(weekSchedule || {}); setHasChanges(false)
    setLocalSwapMode(false); setSelectedForSwap(null)
  }

  const handlePlanningModalSave = async (newSchedule) => {
    setTempSchedule(newSchedule)
    await loadCustomWorkoutsForSchedule(newSchedule)
    await handleAutoSave(newSchedule)
  }

  const getWorkoutData = (workoutKey) => {
    if (!workoutKey) return null
    if (workoutKey.startsWith('custom_')) return customWorkouts[workoutKey.replace('custom_', '')] || null
    const activities = {
      swimming: { name: 'Zwemmen', focus: 'Cardio', geschatteTijd: '60 min', isActivity: true },
      cardio: { name: 'Cardio', focus: 'Cardio', geschatteTijd: '45 min', isActivity: true },
      hiking: { name: 'Wandelen', focus: 'Cardio', geschatteTijd: '90 min', isActivity: true },
      cycling: { name: 'Fietsen', focus: 'Cardio', geschatteTijd: '60 min', isActivity: true },
      running: { name: 'Hardlopen', focus: 'Cardio', geschatteTijd: '45 min', isActivity: true }
    }
    if (activities[workoutKey]) return activities[workoutKey]
    if (schema?.week_structure?.[workoutKey]) return schema.week_structure[workoutKey]
    return null
  }

  if (!hasValidSchema) {
    return (
      <div style={{ padding: isMobile ? '1.5rem 1rem' : '2rem 1.25rem', textAlign: 'center' }}>
        <AlertCircle size={28} color="rgba(255,255,255,0.2)" style={{ marginBottom: '0.5rem' }} />
        <p style={{ color: 'rgba(255,255,255,0.35)', margin: 0, fontSize: '0.85rem' }}>Geen workout schema beschikbaar</p>
      </div>
    )
  }

  return (
    <div style={{ padding: 0, marginBottom: '1rem' }}>

      {/* HEADER */}
      <div style={{ padding: isMobile ? '0 1rem 0.5rem' : '0 1.25rem 0.625rem', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: isMobile ? '0.625rem' : '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ fontSize: isMobile ? '0.95rem' : '1.05rem', fontWeight: '800', color: '#fff', margin: 0, letterSpacing: '-0.01em' }}>
          Planning
        </h3>
        {saving && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', fontWeight: '600' }}>
            <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'rgba(255,255,255,0.3)', animation: 'pulse 1.5s ease-in-out infinite' }} />
            Opslaan
          </div>
        )}
      </div>

      {/* ✅ INSTRUCTIE STRIP — duidelijk, groep 3 taal */}
      <div style={{ padding: isMobile ? '0 0.75rem 0.5rem' : '0 1rem 0.625rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: isMobile ? '0.5rem 0.75rem' : '0.5rem 0.875rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px' }}>
          <MoveHorizontal size={isMobile ? 13 : 14} color="rgba(255,255,255,0.3)" strokeWidth={2} />
          <span style={{ fontSize: isMobile ? '0.7rem' : '0.75rem', color: 'rgba(255,255,255,0.35)', fontWeight: '600' }}>
            {isMobile ? 'Houd een dag vast en sleep hem naar een andere dag om te wisselen.' : 'Sleep een dag naar een andere dag om je planning te wijzigen.'}
          </span>
        </div>
      </div>

      {/* Swap mode banner */}
      {localSwapMode && (
        <div style={{ margin: isMobile ? '0 0.75rem 0.625rem' : '0 1rem 0.75rem', padding: '0.5rem 0.875rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', fontSize: isMobile ? '0.72rem' : '0.78rem', color: 'rgba(255,255,255,0.5)', fontWeight: '600' }}>
          {selectedForSwap
            ? `Kies een dag om te wisselen met ${weekDaysDutch[weekDays.indexOf(selectedForSwap.day)]}`
            : 'Selecteer een workout om te verplaatsen'}
        </div>
      )}

      {/* WeekGrid */}
      <div style={{ padding: isMobile ? '0 0.75rem' : '0 1rem' }}>
        <WeekGrid
          tempSchedule={tempSchedule} weekDays={weekDays} todayIndex={todayIndex}
          completedWorkouts={completedWorkouts} selectedWorkout={selectedWorkout}
          selectedForSwap={selectedForSwap} swapMode={swapMode} localSwapMode={localSwapMode}
          getWorkoutData={getWorkoutData} onDayClick={onDayClick} onSwapClick={handleSwapClick}
          onScheduleUpdate={handleAutoSave} isMobile={isMobile}
        />
      </div>

      {/* Planning knoppen */}
      <div style={{ marginTop: '0.625rem', padding: isMobile ? '0 0.75rem' : '0 1rem' }}>
        <PlanningButtons onOpenWizard={onOpenWizard} onOpenCustom={() => setShowPlanningModal(true)} isMobile={isMobile} />
      </div>

      {localSwapMode && (
        <div style={{ padding: isMobile ? '0 1rem' : '0 1.25rem' }}>
          <ActionButtons hasChanges={hasChanges} saving={saving} onSave={() => handleAutoSave(tempSchedule)} onCancel={handleCancel} isMobile={isMobile} />
        </div>
      )}

      {!swapMode && (
        <WeekList
          tempSchedule={tempSchedule} weekDays={weekDays} todayIndex={todayIndex}
          completedWorkouts={completedWorkouts} selectedWorkout={selectedWorkout}
          selectedForSwap={selectedForSwap} localSwapMode={localSwapMode}
          getWorkoutData={getWorkoutData} onDayClick={onDayClick} onSwapClick={handleSwapClick}
          onScheduleUpdate={handleAutoSave} isMobile={isMobile}
        />
      )}

      {showPlanningModal && (
        <PlanningModal
          schema={schema} currentSchedule={tempSchedule} clientId={clientId}
          db={db} workoutService={workoutService}
          onClose={() => setShowPlanningModal(false)} onSave={handlePlanningModalSave}
        />
      )}

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.8; } }
      `}</style>
    </div>
  )
}
