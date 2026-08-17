// src/modules/workout/components/WeekSchedule.jsx
import useIsMobile from '../../../hooks/useIsMobile'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { useState, useEffect } from 'react'
import WeekGrid from './week-schedule/WeekGrid'
import ActionButtons from './week-schedule/ActionButtons'

export default function WeekSchedule({
  weekSchedule, schema, swapMode, selectedWorkout,
  completedWorkouts = [], todayIndex, onDayClick,
  clientId, db, workoutService, onScheduleUpdate, onSwitchPlan,
}) {
  const isMobile = useIsMobile()
  const [localSwapMode, setLocalSwapMode] = useState(false)
  const [selectedForSwap, setSelectedForSwap] = useState(null)
  const [tempSchedule, setTempSchedule] = useState(weekSchedule || {})
  const [hasChanges, setHasChanges] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
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

  // Verschuif workout van `day` één positie in `direction` (-1 = vorige dag,
  // +1 = volgende dag). Bezet → swap; leeg → move.
  const handleShift = (day, direction) => {
    const sourceIdx = weekDays.indexOf(day)
    const targetIdx = sourceIdx + direction
    if (sourceIdx < 0 || targetIdx < 0 || targetIdx >= weekDays.length) return
    const sourceWorkout = tempSchedule[day]
    if (!sourceWorkout) return
    const targetDay = weekDays[targetIdx]
    const targetWorkout = tempSchedule[targetDay]
    const next = { ...tempSchedule }
    if (targetWorkout) {
      next[targetDay] = sourceWorkout
      next[day] = targetWorkout
    } else {
      next[targetDay] = sourceWorkout
      delete next[day]
    }
    handleAutoSave(next)
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

      {/* "Planning" header + instruction strip removed — week-tiles speak for
          themselves; opslaan-indicator floats top-right when saving. */}
      {saving && (
        <div style={{
          padding: isMobile ? '0 1rem 0.375rem' : '0 1.25rem 0.5rem',
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
          gap: '0.3rem', fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', fontWeight: '600'
        }}>
          <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'rgba(255,255,255,0.3)', animation: 'pulse 1.5s ease-in-out infinite' }} />
          Opslaan
        </div>
      )}

      {/* Swap mode banner */}
      {localSwapMode && (
        <div style={{ margin: isMobile ? '0 0.75rem 0.625rem' : '0 1rem 0.75rem', padding: '0.5rem 0.875rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', fontSize: isMobile ? '0.72rem' : '0.78rem', color: 'rgba(255,255,255,0.5)', fontWeight: '600' }}>
          {selectedForSwap
            ? `Kies een dag om te wisselen met ${weekDaysDutch[weekDays.indexOf(selectedForSwap.day)]}`
            : 'Selecteer een workout om te verplaatsen'}
        </div>
      )}

      {/* Sectie-titel: actief trainingsplan + wissel-knop */}
      <div style={{
        padding: isMobile ? '0.5rem 1rem 0.875rem' : '0.5rem 1.25rem 1rem',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{ flex: 1, minWidth: 0, fontSize: isMobile ? '1.15rem' : '1.3rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          Jouw trainingsplan: <span style={{ color: '#FFD700' }}>{schema?.name || 'Plan'}</span>
        </div>
        {onSwitchPlan && (
          <button
            onClick={onSwitchPlan}
            aria-label="Wissel van plan"
            style={{
              flexShrink: 0, width: isMobile ? 42 : 48, height: isMobile ? 42 : 48,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #FFD700 0%, #D4AF37 100%)',
              border: 'none',
              boxShadow: '0 6px 16px rgba(255,215,0,0.35), 0 2px 6px rgba(0,0,0,0.4)',
              color: '#0a0a0a',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            }}
          >
            <RefreshCw size={isMobile ? 20 : 24} strokeWidth={2.6} />
          </button>
        )}
      </div>

      {/* WeekGrid */}
      <div style={{ padding: isMobile ? '0 0.75rem' : '0 1rem' }}>
        <WeekGrid
          tempSchedule={tempSchedule} weekDays={weekDays} todayIndex={todayIndex}
          completedWorkouts={completedWorkouts} selectedWorkout={selectedWorkout}
          selectedForSwap={selectedForSwap} swapMode={swapMode} localSwapMode={localSwapMode}
          getWorkoutData={getWorkoutData} onDayClick={onDayClick} onSwapClick={handleSwapClick}
          onShift={handleShift}
          isMobile={isMobile}
        />
      </div>

      {localSwapMode && (
        <div style={{ padding: isMobile ? '0 1rem' : '0 1.25rem' }}>
          <ActionButtons hasChanges={hasChanges} saving={saving} onSave={() => handleAutoSave(tempSchedule)} onCancel={handleCancel} isMobile={isMobile} />
        </div>
      )}

      {/* WeekList ("Schema" expanded card list) removed — duplicates the
          WeekGrid above; tile tap already opens the workout details. */}

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.8; } }
      `}</style>
    </div>
  )
}
