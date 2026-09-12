// src/modules/workout/components/WeekSchedule.jsx
import useIsMobile from '../../../hooks/useIsMobile'
import { AlertCircle, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState, useEffect } from 'react'
import WeekGrid from './week-schedule/WeekGrid'
import WorkoutServiceNew from '../services/WorkoutServiceNew'
import ActionButtons from './week-schedule/ActionButtons'

// Bereken de maandag van de huidige week (lokale tijd).
function getThisMonday() {
  const d = new Date()
  const day = d.getDay() // 0=zo, 1=ma, ...
  const diff = (day === 0 ? -6 : 1 - day)
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

export default function WeekSchedule({
  weekSchedule, schema, swapMode, selectedWorkout,
  completedWorkouts = [], todayIndex, onDayClick,
  clientId, db, workoutService, onScheduleUpdate, onSwitchPlan,
  weekOffset = 0, onWeekOffsetChange,
  // Blok dat tussen de zeven dagen en de weekbalk komt (de cardio-sectie).
  // Als slot doorgegeven zodat WeekSchedule zelf niets van cardio hoeft te
  // weten en de volgorde op één plek staat.
  tussenBlok = null,
}) {
  const isMobile = useIsMobile()
  const [localSwapMode, setLocalSwapMode] = useState(false)
  const [selectedForSwap, setSelectedForSwap] = useState(null)
  const [tempSchedule, setTempSchedule] = useState(weekSchedule || {})
  const [hasChanges, setHasChanges] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const [customWorkouts, setCustomWorkouts] = useState({})

  // Maandag van de getoonde week — nodig om de planning van die week te
  // laden en te bewaren, dus hier en niet pas in de render.
  const getoondeMaandag = (() => {
    const d = getThisMonday(); d.setDate(d.getDate() + weekOffset * 7); return d
  })()
  const weekSleutel = WorkoutServiceNew.datumSleutel(getoondeMaandag)
  const isHuidigeWeek = weekOffset === 0
  const isToekomst = weekOffset > 0
  const kanPlannen = isHuidigeWeek || isToekomst

  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const weekDaysDutch = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo']
  const hasValidSchema = schema && schema.week_structure && typeof schema.week_structure === 'object'

  useEffect(() => { loadSavedSchedule() }, [clientId, weekSleutel])

  useEffect(() => {
    // Alleen de huidige week volgt de planning van de pagina; een vooruit
    // geplande week heeft zijn eigen indeling en mag daar niet door
    // overschreven worden.
    if (!loading && weekSchedule && isHuidigeWeek) {
      setTempSchedule(weekSchedule)
      loadCustomWorkoutsForSchedule(weekSchedule)
    }
  }, [weekSchedule, loading, isHuidigeWeek])

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
      // Is de vooruit geplande week inmiddels begonnen? Dan wordt die de
      // nieuwe vaste indeling, zodat alles wat clients.workout_schedule leest
      // (de workout van vandaag, de challenge-telling) meteen klopt.
      if (isHuidigeWeek) {
        const gepland = await WorkoutServiceNew.promoveerWeekPlanning(clientId, weekSleutel, db)
        if (gepland && Object.keys(gepland).length > 0) {
          await db.updateClientWorkoutSchedule(clientId, gepland)
          setTempSchedule(gepland)
          await loadCustomWorkoutsForSchedule(gepland)
          if (onScheduleUpdate) onScheduleUpdate(gepland)
          return
        }
      }

      const vast = await db.getClientWorkoutSchedule(clientId)
      // Een komende week begint bij de vaste indeling en wijkt daarvan af
      // zodra de klant hem verschuift.
      const eigen = isHuidigeWeek ? null : await WorkoutServiceNew.getWeekPlanning(clientId, weekSleutel, db)
      const saved = eigen || vast
      if (saved && Object.keys(saved).length > 0) {
        setTempSchedule(saved)
        await loadCustomWorkoutsForSchedule(saved)
        if (isHuidigeWeek && onScheduleUpdate) onScheduleUpdate(saved)
      } else {
        setTempSchedule({})
      }
    } catch (e) { console.error('❌ Load schedule failed:', e) }
    finally { setLoading(false) }
  }

  const handleAutoSave = async (newSchedule) => {
    if (!clientId || !db) return
    setSaving(true)
    try {
      if (isToekomst) {
        // Een komende week apart bewaren: deze week blijft zoals hij was.
        const gelukt = await WorkoutServiceNew.saveWeekPlanning(clientId, weekSleutel, newSchedule, db)
        if (!gelukt) throw new Error('niet opgeslagen')
      } else {
        await db.updateClientWorkoutSchedule(clientId, newSchedule)
        if (onScheduleUpdate) onScheduleUpdate(newSchedule)
      }
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
        {/* Klein grijs label, daaronder de plannaam in dik wit. Stond eerder
            op één regel met de naam in goud; dat vocht met het goud op de
            dag-cards en de weekbalk. */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: isMobile ? '0.6rem' : '0.65rem', fontWeight: 800,
            color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase',
            letterSpacing: '0.1em', lineHeight: 1, marginBottom: 5,
          }}>
            Jouw trainingsplan
          </div>
          <div style={{
            fontSize: isMobile ? '1.25rem' : '1.45rem', fontWeight: 900, color: '#fff',
            letterSpacing: '-0.025em', lineHeight: 1.1,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {schema?.name || 'Plan'}
          </div>
        </div>
        {onSwitchPlan && (
          <button
            onClick={onSwitchPlan}
            aria-label="Wissel van plan"
            style={{
              flexShrink: 0, width: isMobile ? 40 : 46, height: isMobile ? 40 : 46,
              borderRadius: '50%',
              background: '#fff',
              border: 'none',
              boxShadow: '0 4px 12px rgba(0,0,0,0.45)',
              color: '#0a0a0a',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            }}
          >
            <RefreshCw size={isMobile ? 18 : 21} strokeWidth={2.8} />
          </button>
        )}
      </div>

      {/* Weeknavigatie — vorige/volgende week */}
      {(() => {
        const monday = getoondeMaandag
        const sunday = new Date(monday)
        sunday.setDate(sunday.getDate() + 6)
        const fmt = (d) => d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
        const isCurrentWeek = isHuidigeWeek
        const dayDates = Array.from({ length: 7 }, (_, i) => {
          const d = new Date(monday); d.setDate(d.getDate() + i); return d
        })
        return (
          <>
            {/* WeekGrid */}
            <div style={{ padding: isMobile ? '0 0.75rem' : '0 1rem' }}>
              <WeekGrid
                tempSchedule={tempSchedule} weekDays={weekDays} todayIndex={todayIndex}
                completedWorkouts={completedWorkouts} selectedWorkout={selectedWorkout}
                selectedForSwap={selectedForSwap} swapMode={swapMode} localSwapMode={localSwapMode}
                getWorkoutData={getWorkoutData} onDayClick={onDayClick} onSwapClick={handleSwapClick}
                onShift={handleShift}
                isMobile={isMobile}
                dayDates={dayDates}
                kanPlannen={kanPlannen}
                kanOpenen={isCurrentWeek}
                gedimd={weekOffset < 0}
              />
            </div>
            {tussenBlok}

            <div style={{
              padding: isMobile ? '0.15rem 0.75rem 0.25rem' : '0.25rem 1rem 0.375rem',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <button
                onClick={() => onWeekOffsetChange && onWeekOffsetChange(weekOffset - 1)}
                aria-label="Vorige week"
                style={{
                  background: 'transparent', border: '1.5px solid rgba(255,255,255,0.28)',
                  borderRadius: 9, padding: isMobile ? '5px 10px' : '6px 12px',
                  color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center',
                  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                }}
              >
                <ChevronLeft size={isMobile ? 15 : 17} strokeWidth={3} />
              </button>
              <div style={{
                flex: 1, textAlign: 'center',
                fontSize: isMobile ? '0.9rem' : '1rem',
                fontWeight: 900,
                color: isCurrentWeek ? '#fff' : 'rgba(255,255,255,0.5)',
                letterSpacing: '-0.01em',
              }}>
                {isCurrentWeek ? 'Deze week'
                  : weekOffset === 1 ? 'Volgende week'
                  : weekOffset === -1 ? 'Vorige week'
                  : `${fmt(monday)} – ${fmt(sunday)}`}
              </div>
              <button
                onClick={() => onWeekOffsetChange && onWeekOffsetChange(weekOffset + 1)}
                aria-label="Volgende week"
                style={{
                  background: 'transparent', border: '1.5px solid rgba(255,255,255,0.28)',
                  borderRadius: 9, padding: isMobile ? '5px 10px' : '6px 12px',
                  color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center',
                  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                }}
              >
                <ChevronRight size={isMobile ? 15 : 17} strokeWidth={3} />
              </button>
            </div>

          </>
        )
      })()}

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
