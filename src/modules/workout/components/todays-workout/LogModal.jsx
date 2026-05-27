// src/modules/workout/components/todays-workout/LogModal.jsx
import { X, CheckCircle, Dumbbell, Check, Play, MessageSquare, ChevronDown, Zap, ThumbsUp, Moon, TrendingDown, Thermometer, Plus, Camera } from 'lucide-react'
import { useState, useEffect } from 'react'
import ExerciseList from './components/ExerciseList'
import WorkoutFlowWizard from './WorkoutFlowWizard'
import CustomExerciseModal from './components/CustomExerciseModal'
import PumpShareModal from './PumpShareModal'

export default function LogModal({ workout, todaysLogs, onClose, onLogsUpdate, client, schema, db }) {
  const isMobile = window.innerWidth <= 768
  const [visible, setVisible] = useState(false)
  const [completedCount, setCompletedCount] = useState(0)
  const [isFinishing, setIsFinishing] = useState(false)
  const [isWorkoutCompleted, setIsWorkoutCompleted] = useState(false)
  const [showWorkoutFlow, setShowWorkoutFlow] = useState(false)
  const [showCustomModal, setShowCustomModal] = useState(false)
  const [showPumpModal, setShowPumpModal] = useState(false)
  // Stamp the moment the modal opened so we can show a duration on the
  // pump-card. Persists across remounts within the same session via state.
  const [sessionStartAt] = useState(() => Date.now())

  // ✅ Live exercises state — synct met workout prop na swap + reload
  const [liveExercises, setLiveExercises] = useState(workout.exercises || [])

  const handleCustomExerciseSave = (newExercise) => {
    setLiveExercises(prev => [...prev, {
      name: newExercise.name,
      sets: newExercise.sets,
      reps: newExercise.reps,
      rust: newExercise.rust,
      primairSpieren: newExercise.primairSpieren,
      equipment: newExercise.equipment,
      image_url: newExercise.image_url,
      type: 'custom'
    }])
    setShowCustomModal(false)
  }

  const [dayFeeling, setDayFeeling] = useState(null)
  const [dayNote, setDayNote] = useState('')
  const [showDayNote, setShowDayNote] = useState(false)
  const [dayNoteSaved, setDayNoteSaved] = useState(false)

  // Sync als workout.exercises verandert (na swap reload)
  useEffect(() => {
    console.log('📋 LogModal exercises update:', workout.exercises?.map(e => e.name))
    setLiveExercises(workout.exercises || [])
  }, [workout.exercises])

  useEffect(() => {
    setTimeout(() => setVisible(true), 50)
    checkWorkoutCompletion()
    loadDayNote()
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = 'auto' }
  }, [])

  useEffect(() => {
    const handleEscape = (e) => { if (e.key === 'Escape') handleClose() }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [])

  useEffect(() => {
    if (todaysLogs && liveExercises) {
      const logged = new Set(todaysLogs.map(l => l.exercise_name))
      setCompletedCount(liveExercises.filter(ex => logged.has(ex.name)).length)
    }
  }, [todaysLogs, liveExercises])

  const loadDayNote = async () => {
    if (!client?.id || !db) return
    try {
      const today = new Date().toISOString().split('T')[0]
      const { data } = await db.supabase.from('workout_sessions').select('notes').eq('client_id', client.id).eq('workout_date', today).single()
      if (data?.notes) {
        const parts = data.notes.split('|')
        if (parts.length >= 2) { setDayFeeling(parts[0]); setDayNote(parts.slice(1).join('|')) }
        else setDayNote(data.notes)
        setShowDayNote(true); setDayNoteSaved(true)
      }
    } catch {}
  }

  const saveDayNote = async (feeling, note) => {
    if (!client?.id || !db) return
    try {
      const today = new Date().toISOString().split('T')[0]
      const combined = feeling ? `${feeling}|${note}` : note
      let { data: session } = await db.supabase.from('workout_sessions').select('id').eq('client_id', client.id).eq('workout_date', today).single()
      if (!session) {
        const { data: ns } = await db.supabase.from('workout_sessions').insert({ client_id: client.id, user_id: client.id, workout_date: today, day_name: new Date().toLocaleDateString('en-US', { weekday: 'long' }), day_display_name: workout?.name || 'Workout', exercises_completed: [], is_completed: false, created_at: new Date().toISOString() }).select().single()
        session = ns
      }
      await db.supabase.from('workout_sessions').update({ notes: combined }).eq('client_id', client.id).eq('workout_date', today)
      setDayNoteSaved(true)
      if (navigator.vibrate) navigator.vibrate([20, 40, 20])
    } catch (e) { console.error('❌ Day note save failed:', e) }
  }

  const handleFeelingSelect = (feeling) => { setDayFeeling(feeling); setShowDayNote(true); saveDayNote(feeling, dayNote) }
  const handleNoteBlur = () => { if (dayNote || dayFeeling) saveDayNote(dayFeeling, dayNote) }

  const checkWorkoutCompletion = async () => {
    if (!client?.id || !db) return
    try {
      const today = new Date().toISOString().split('T')[0]
      const { data } = await db.supabase.from('workout_completions').select('completed').eq('client_id', client.id).eq('workout_date', today).single()
      setIsWorkoutCompleted(data?.completed || false)
    } catch { setIsWorkoutCompleted(false) }
  }

  const handleClose = () => { setVisible(false); setTimeout(() => onClose(), 300) }

  const handleFinishWorkout = async ({ autoClose = true } = {}) => {
    if (!client?.id || !db) return
    setIsFinishing(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      const { error } = await db.supabase.from('workout_completions').upsert({ client_id: client.id, workout_date: today, completed: true }, { onConflict: 'client_id,workout_date' })
      if (error) throw error
      if (navigator.vibrate) navigator.vibrate([50, 100, 50, 100, 50])
      setIsWorkoutCompleted(true)
      // Skip the auto-close when the caller wants to keep the modal open
      // (e.g. the pump-share flow needs LogModal to stay mounted so the
      // PumpShareModal it renders doesn't disappear).
      if (autoClose) setTimeout(() => handleClose(), 1200)
      else setIsFinishing(false)
    } catch (e) {
      console.error('❌ Finish workout failed:', e)
      alert('Er ging iets mis. Probeer opnieuw.')
      setIsFinishing(false)
    }
  }

  const handleWorkoutFlowComplete = () => { setShowWorkoutFlow(false); if (onLogsUpdate) onLogsUpdate(); handleFinishWorkout() }

  // "Voltooien + Pump" — first marks the workout completed (same as the
  // green Voltooien button), then opens the pump-share modal. We pass
  // autoClose=false so LogModal stays mounted while the pump modal is open.
  // LogModal closes when the pump modal itself closes.
  const handleFinishAndPump = async () => {
    await handleFinishWorkout({ autoClose: false })
    setShowPumpModal(true)
  }

  const handlePumpClose = () => {
    setShowPumpModal(false)
    // Now collapse LogModal too — the workout was already marked completed.
    handleClose()
  }

  const buildPumpStats = () => {
    const logs = Array.isArray(todaysLogs) ? todaysLogs : []
    let setsCount = 0
    let volume = 0
    logs.forEach(log => {
      // workout_progress.sets is jsonb — array of { reps, weight, completed }
      const sets = Array.isArray(log?.sets) ? log.sets : []
      sets.forEach(s => {
        if (s?.completed === false) return
        setsCount += 1
        const reps = Number(s?.reps) || 0
        const weight = Number(s?.weight) || 0
        volume += reps * weight
      })
    })
    const durationMin = Math.max(1, Math.round((Date.now() - sessionStartAt) / 60000))
    return {
      workoutName: workout?.name || workout?.day_display_name || 'Workout',
      exercisesCount: completedCount || (Array.isArray(liveExercises) ? liveExercises.length : 0),
      setsCount: setsCount > 0 ? setsCount : null,
      volume: volume > 0 ? volume : null,
      duration: durationMin,
    }
  }

  if (showWorkoutFlow) {
    return (
      <WorkoutFlowWizard
        exercises={liveExercises}
        client={client}
        db={db}
        onComplete={handleWorkoutFlowComplete}
        onClose={() => setShowWorkoutFlow(false)}
      />
    )
  }

  const totalExercises = liveExercises.length || 0
  const progressPct = totalExercises > 0 ? (completedCount / totalExercises) * 100 : 0

  const feelings = [
    { key: 'sterk', icon: Zap, label: 'Sterk', color: '#10b981' },
    { key: 'normaal', icon: ThumbsUp, label: 'Normaal', color: '#FFD700' },
    { key: 'moe', icon: Moon, label: 'Moe', color: '#f59e0b' },
    { key: 'zwak', icon: TrendingDown, label: 'Zwak', color: '#f97316' },
    { key: 'ziek', icon: Thermometer, label: 'Ziek', color: '#ef4444' }
  ]

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.97)', zIndex: 1000, display: 'flex', flexDirection: 'column', opacity: visible ? 1 : 0, transition: 'opacity 0.3s ease-out' }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}>

      {/* ── HEADER ── */}
      <div style={{ background: '#0a0a0a', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: isMobile ? '0.875rem 1rem' : '1rem 1.5rem', position: 'sticky', top: 0, zIndex: 10, flexShrink: 0 }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent 0%, rgba(255,215,0,0.5) 50%, transparent 100%)' }} />

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.3rem' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: isWorkoutCompleted ? '#10b981' : '#FFD700', flexShrink: 0 }} />
              <span style={{ fontSize: isMobile ? '0.6rem' : '0.65rem', fontWeight: '700', color: isWorkoutCompleted ? 'rgba(16,185,129,0.7)' : 'rgba(255,215,0,0.7)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {isWorkoutCompleted ? 'Voltooid' : 'Log Workout'}
              </span>
            </div>

            <h2 style={{ fontSize: isMobile ? '1.1rem' : '1.25rem', fontWeight: '800', color: '#fff', margin: '0 0 0.5rem', letterSpacing: '-0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {workout.name}
            </h2>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progressPct}%`, background: progressPct >= 90 ? '#10b981' : 'rgba(255,215,0,0.7)', transition: 'width 0.5s ease', borderRadius: '2px' }} />
              </div>
              <span style={{ fontSize: isMobile ? '0.68rem' : '0.72rem', fontWeight: '700', color: progressPct >= 90 ? '#10b981' : 'rgba(255,215,0,0.7)', flexShrink: 0 }}>
                {completedCount}/{totalExercises}
              </span>
            </div>
          </div>

          <button onClick={handleClose} style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
            onTouchStart={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
            onTouchEnd={(e) => e.currentTarget.style.transform = 'scale(1)'}>
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div style={{ flex: 1, overflow: 'auto', WebkitOverflowScrolling: 'touch' }}>

        {/* Feeling sectie */}
        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <div onClick={() => setShowDayNote(p => !p)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: isMobile ? '0.625rem 1rem' : '0.75rem 1.5rem', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <MessageSquare size={isMobile ? 13 : 14} color="rgba(255,215,0,0.5)" strokeWidth={2} />
              <span style={{ fontSize: isMobile ? '0.7rem' : '0.75rem', fontWeight: '700', color: 'rgba(255,215,0,0.6)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Hoe voel je je vandaag?</span>
              {dayFeeling && (() => { const f = feelings.find(f => f.key === dayFeeling); if (!f) return null; const Icon = f.icon; return <Icon size={13} color={f.color} /> })()}
              {dayNoteSaved && !showDayNote && <span style={{ fontSize: '0.55rem', color: 'rgba(16,185,129,0.5)', fontWeight: '700' }}>✓</span>}
            </div>
            <ChevronDown size={14} color="rgba(255,255,255,0.2)" style={{ transition: 'transform 0.2s ease', transform: showDayNote ? 'rotate(180deg)' : 'rotate(0deg)' }} />
          </div>

          <div style={{ maxHeight: showDayNote ? '260px' : '0px', overflow: 'hidden', transition: 'max-height 0.35s cubic-bezier(0.4,0,0.2,1)' }}>
            <div style={{ padding: isMobile ? '0 1rem 0.875rem' : '0 1.5rem 1rem' }}>
              <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '0.625rem' }}>
                {feelings.map(f => {
                  const Icon = f.icon
                  const active = dayFeeling === f.key
                  return (
                    <button key={f.key} onClick={() => handleFeelingSelect(f.key)} style={{ flex: 1, padding: isMobile ? '0.5rem 0.2rem' : '0.55rem 0.25rem', background: active ? `${f.color}12` : 'transparent', border: `1px solid ${active ? `${f.color}35` : 'rgba(255,255,255,0.07)'}`, borderRadius: '6px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', transition: 'all 0.15s ease' }}>
                      <Icon size={isMobile ? 15 : 16} color={active ? f.color : 'rgba(255,255,255,0.2)'} strokeWidth={active ? 2.5 : 2} />
                      <span style={{ fontSize: isMobile ? '0.5rem' : '0.55rem', fontWeight: '700', color: active ? f.color : 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{f.label}</span>
                    </button>
                  )
                })}
              </div>
              <textarea value={dayNote} onChange={(e) => setDayNote(e.target.value)} onBlur={handleNoteBlur} placeholder="Extra info... (bv. slecht geslapen, weinig gegeten)" style={{ width: '100%', minHeight: '44px', padding: '0.5rem 0.625rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '6px', color: '#fff', fontSize: isMobile ? '0.75rem' : '0.8rem', fontWeight: '500', resize: 'none', outline: 'none', fontFamily: 'inherit', lineHeight: 1.4, boxSizing: 'border-box' }} />
              {dayNoteSaved && <div style={{ fontSize: '0.57rem', color: 'rgba(16,185,129,0.45)', fontWeight: '600', marginTop: '0.2rem', textAlign: 'right' }}>Opgeslagen ✓</div>}
            </div>
          </div>
        </div>

        {/* ✅ Oefeningen — gebruikt liveExercises ipv workout.exercises */}
        <ExerciseList
          exercises={liveExercises}
          todaysLogs={todaysLogs}
          onLogsUpdate={onLogsUpdate}
          client={client}
          schema={schema}
          db={db}
          workoutDayKey={workout.dayKey}
        />

        {/* Subtle "+ Eigen oefening" link — replaces the prominent button
            previously shown above today's workout card. */}
        {!isWorkoutCompleted && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: isMobile ? '0.5rem 1rem 1rem' : '0.625rem 1.5rem 1.25rem' }}>
            <button
              onClick={() => setShowCustomModal(true)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.5rem 0.875rem',
                background: 'transparent',
                border: '1px dashed rgba(255,215,0,0.2)',
                borderRadius: '8px',
                color: 'rgba(255,215,0,0.55)',
                fontSize: isMobile ? '0.72rem' : '0.78rem',
                fontWeight: '600',
                cursor: 'pointer',
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                minHeight: '36px'
              }}
            >
              <Plus size={13} strokeWidth={2.2} />
              Eigen oefening toevoegen
            </button>
          </div>
        )}
      </div>

      {/* ── FOOTER ── */}
      {!isWorkoutCompleted && (
        <div style={{ background: '#0a0a0a', borderTop: '1px solid rgba(255,255,255,0.06)', padding: isMobile ? '0.75rem 1rem' : '0.875rem 1.5rem', flexShrink: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr 1fr' : '1fr 1.3fr 1.3fr', gap: isMobile ? '0.45rem' : '0.625rem', marginBottom: isMobile ? '0.4rem' : '0.5rem' }}>
            <button onClick={() => setShowWorkoutFlow(true)} style={{ padding: isMobile ? '0.75rem 0.35rem' : '0.875rem 1rem', background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.2)', borderRadius: '8px', color: '#FFD700', fontSize: isMobile ? '0.72rem' : '0.85rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', minHeight: isMobile ? '46px' : '50px', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', transition: 'all 0.15s ease' }}
              onTouchStart={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
              onTouchEnd={(e) => e.currentTarget.style.transform = 'scale(1)'}>
              <Play size={isMobile ? 13 : 16} strokeWidth={2.5} />Flow
            </button>

            <button onClick={handleFinishWorkout} disabled={isFinishing} style={{ padding: isMobile ? '0.75rem 0.35rem' : '0.875rem 1rem', background: 'rgba(16,185,129,0.15)', border: `1px solid ${isFinishing ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.35)'}`, borderRadius: '8px', color: isFinishing ? 'rgba(16,185,129,0.4)' : '#10b981', fontSize: isMobile ? '0.72rem' : '0.85rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em', cursor: isFinishing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', minHeight: isMobile ? '46px' : '50px', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', transition: 'all 0.15s ease' }}
              onTouchStart={(e) => { if (!isFinishing) e.currentTarget.style.transform = 'scale(0.98)' }}
              onTouchEnd={(e) => e.currentTarget.style.transform = 'scale(1)'}>
              {isFinishing
                ? <><div style={{ width: '14px', height: '14px', border: '2px solid rgba(16,185,129,0.2)', borderTopColor: '#10b981', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />Even...</>
                : <><Check size={isMobile ? 14 : 17} strokeWidth={2.5} />Voltooi</>}
            </button>

            <button onClick={handleFinishAndPump} disabled={isFinishing} style={{ padding: isMobile ? '0.75rem 0.35rem' : '0.875rem 1rem', background: 'linear-gradient(135deg, rgba(255,215,0,0.18) 0%, rgba(255,215,0,0.08) 100%)', border: `1px solid rgba(255,215,0,0.45)`, borderRadius: '8px', color: '#FFD700', fontSize: isMobile ? '0.72rem' : '0.85rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em', cursor: isFinishing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', minHeight: isMobile ? '46px' : '50px', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', transition: 'all 0.15s ease', opacity: isFinishing ? 0.5 : 1 }}
              onTouchStart={(e) => { if (!isFinishing) e.currentTarget.style.transform = 'scale(0.98)' }}
              onTouchEnd={(e) => e.currentTarget.style.transform = 'scale(1)'}>
              <Camera size={isMobile ? 14 : 17} strokeWidth={2.5} />Pump
            </button>
          </div>
          <div style={{ textAlign: 'center', fontSize: isMobile ? '0.55rem' : '0.62rem', color: 'rgba(255,255,255,0.2)', fontWeight: '600' }}>
            <span style={{ color: 'rgba(255,215,0,0.4)' }}>Flow</span> &nbsp;·&nbsp; <span style={{ color: 'rgba(16,185,129,0.4)' }}>Voltooi</span> direct afronden &nbsp;·&nbsp; <span style={{ color: 'rgba(255,215,0,0.5)' }}>Pump</span> voltooi + foto delen
          </div>
        </div>
      )}

      {isWorkoutCompleted && (
        <div style={{ background: 'rgba(16,185,129,0.06)', borderTop: '1px solid rgba(16,185,129,0.2)', padding: isMobile ? '1rem' : '1.25rem 1.5rem', textAlign: 'center', flexShrink: 0, position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent 0%, #10b981 50%, transparent 100%)', opacity: 0.5 }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <CheckCircle size={isMobile ? 18 : 20} color="#10b981" strokeWidth={2.5} />
            <span style={{ fontSize: isMobile ? '0.95rem' : '1.05rem', fontWeight: '800', color: '#10b981', letterSpacing: '-0.01em' }}>Workout Voltooid</span>
          </div>
          <div style={{ fontSize: isMobile ? '0.72rem' : '0.78rem', color: 'rgba(255,255,255,0.4)', fontWeight: '500' }}>
            {completedCount === totalExercises && totalExercises > 0 ? `Alle ${totalExercises} oefeningen gelogd.` : 'Goed werk vandaag.'}
          </div>
        </div>
      )}

      {showCustomModal && (
        <CustomExerciseModal
          onClose={() => setShowCustomModal(false)}
          onSave={handleCustomExerciseSave}
          client={client}
          db={db}
          schema={schema}
        />
      )}

      <PumpShareModal
        isOpen={showPumpModal}
        onClose={handlePumpClose}
        client={client}
        db={db}
        stats={buildPumpStats()}
      />

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
