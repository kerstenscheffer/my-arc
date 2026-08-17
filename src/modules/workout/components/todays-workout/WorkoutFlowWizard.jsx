// src/modules/workout/components/todays-workout/WorkoutFlowWizard.jsx
import { useState, useEffect, useRef } from 'react'
import { X, ChevronRight, ChevronLeft, Check, Timer, Play, Pause, SkipForward, Dumbbell } from 'lucide-react'
import { createPortal } from 'react-dom'
import ExerciseService from '../../../../services/ExerciseService'

const getFallbackImage = (exercise) => {
  const combined = (exercise?.name || '').toLowerCase()
  if (combined.includes('chest') || combined.includes('bench') || combined.includes('borst') || combined.includes('push')) return 'https://images.unsplash.com/photo-1598971457999-ca4ef48a9a71?w=600&h=400&fit=crop&q=80'
  if (combined.includes('back') || combined.includes('rug') || combined.includes('row') || combined.includes('pull')) return 'https://images.unsplash.com/photo-1603287681836-b174ce5074c2?w=600&h=400&fit=crop&q=80'
  if (combined.includes('leg') || combined.includes('squat') || combined.includes('been') || combined.includes('quad')) return 'https://images.unsplash.com/photo-1567598508481-65985588e295?w=600&h=400&fit=crop&q=80'
  if (combined.includes('shoulder') || combined.includes('schouder') || combined.includes('delt')) return 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=600&h=400&fit=crop&q=80'
  if (combined.includes('bicep') || combined.includes('tricep') || combined.includes('arm') || combined.includes('curl')) return 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=600&h=400&fit=crop&q=80'
  if (combined.includes('core') || combined.includes('ab') || combined.includes('plank') || combined.includes('buik')) return 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&h=400&fit=crop&q=80'
  return 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&h=400&fit=crop&q=80'
}

const parseRestSeconds = (rustStr) => {
  if (!rustStr) return 90
  const str = String(rustStr).toLowerCase().trim()
  const minMatch = str.match(/(\d+)\s*min/)
  if (minMatch) return parseInt(minMatch[1]) * 60
  const secMatch = str.match(/(\d+)\s*s/)
  if (secMatch) return parseInt(secMatch[1])
  const numOnly = parseInt(str)
  if (!isNaN(numOnly)) return numOnly > 10 ? numOnly : numOnly * 60
  return 90
}

export default function WorkoutFlowWizard({ exercises, client, db, onComplete, onClose }) {
  const isMobile = window.innerWidth <= 768
  const [exerciseIndex, setExerciseIndex] = useState(0)
  const [currentSet, setCurrentSet] = useState(1)
  const [phase, setPhase] = useState('exercise') // 'exercise' | 'rest' | 'done'
  const [restSeconds, setRestSeconds] = useState(0)
  const [restTotal, setRestTotal] = useState(90)
  const [timerRunning, setTimerRunning] = useState(false)
  const [imageUrl, setImageUrl] = useState(null)
  const [visible, setVisible] = useState(false)
  const intervalRef = useRef(null)

  const exercise = exercises[exerciseIndex]
  const totalSets = parseInt(exercise?.sets) || 3
  const isLastExercise = exerciseIndex === exercises.length - 1
  const isLastSet = currentSet === totalSets

  useEffect(() => {
    setTimeout(() => setVisible(true), 50)
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = 'auto' }
  }, [])

  useEffect(() => {
    loadImage()
  }, [exerciseIndex])

  const loadImage = async () => {
    if (!exercise) return
    setImageUrl(null)
    try {
      if (exercise.image_url) { setImageUrl(exercise.image_url); return }
      const url = await ExerciseService.getExerciseImage(exercise.name)
      setImageUrl(url || getFallbackImage(exercise))
    } catch { setImageUrl(getFallbackImage(exercise)) }
  }

  // Rest timer tick
  useEffect(() => {
    if (phase !== 'rest') { clearInterval(intervalRef.current); return }
    if (timerRunning) {
      intervalRef.current = setInterval(() => {
        setRestSeconds(prev => {
          if (prev <= 1) { clearInterval(intervalRef.current); handleRestDone(); return 0 }
          if (navigator.vibrate && prev <= 3) navigator.vibrate(50)
          return prev - 1
        })
      }, 1000)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [phase, timerRunning])

  const startRest = () => {
    const secs = parseRestSeconds(exercise?.rust)
    setRestTotal(secs)
    setRestSeconds(secs)
    setPhase('rest')
    setTimerRunning(true)
    if (navigator.vibrate) navigator.vibrate([30, 50, 30])
  }

  const handleRestDone = () => {
    setTimerRunning(false)
    setPhase('exercise')
    if (isLastSet && isLastExercise) {
      setPhase('done')
    } else if (isLastSet) {
      setExerciseIndex(p => p + 1)
      setCurrentSet(1)
    } else {
      setCurrentSet(p => p + 1)
    }
    if (navigator.vibrate) navigator.vibrate([50, 100, 50])
  }

  const handleSetDone = () => {
    // Log de set
    logSet()
    if (isLastSet && isLastExercise) {
      setPhase('done')
    } else {
      startRest()
    }
  }

  const logSet = async () => {
    if (!client?.id || !db || !exercise) return
    try {
      const today = new Date().toISOString().split('T')[0]
      let { data: session } = await db.supabase.from('workout_sessions').select('id').eq('client_id', client.id).eq('workout_date', today).single()
      if (!session) {
        const { data: ns } = await db.supabase.from('workout_sessions').insert({ client_id: client.id, user_id: client.id, workout_date: today, day_name: new Date().toLocaleDateString('en-US', { weekday: 'long' }), exercises_completed: [], is_completed: false, created_at: new Date().toISOString() }).select().single()
        session = ns
      }
      if (session?.id) {
        await db.supabase.from('workout_progress').insert({ session_id: session.id, client_id: client.id, exercise_name: exercise.name, sets_completed: currentSet, reps_completed: exercise.reps || 0, weight_used: 0, notes: '', created_at: new Date().toISOString() })
      }
    } catch (e) { console.error('❌ Log set failed:', e) }
  }

  const skipRest = () => {
    clearInterval(intervalRef.current)
    handleRestDone()
  }

  const handleClose = () => { setVisible(false); setTimeout(() => onClose(), 300) }
  const handleComplete = () => { setVisible(false); setTimeout(() => onComplete(), 300) }

  const restPct = restTotal > 0 ? ((restTotal - restSeconds) / restTotal) * 100 : 0

  if (phase === 'done') {
    return createPortal(
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.97)', zIndex: 2000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: visible ? 1 : 0, transition: 'opacity 0.3s ease', padding: '2rem' }}>
        <div style={{ textAlign: 'center', maxWidth: '320px' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <Check size={32} color="#10b981" strokeWidth={2.5} />
          </div>
          <h2 style={{ fontSize: isMobile ? '1.5rem' : '1.75rem', fontWeight: '800', color: '#fff', margin: '0 0 0.5rem', letterSpacing: '-0.02em' }}>Workout klaar!</h2>
          <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', margin: '0 0 2rem', fontWeight: '500' }}>
            {exercises.length} oefeningen doorlopen
          </p>
          <button onClick={handleComplete} style={{ width: '100%', padding: '0.875rem', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '10px', color: '#10b981', fontSize: '0.875rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', minHeight: '48px', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
            <Check size={16} strokeWidth={2.5} />Voltooien
          </button>
        </div>
      </div>,
      document.body
    )
  }

  if (phase === 'rest') {
    return createPortal(
      <div style={{ position: 'fixed', inset: 0, background: '#0a0a0a', zIndex: 2000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: visible ? 1 : 0, transition: 'opacity 0.3s ease', padding: '2rem' }}>
        <button onClick={handleClose} style={{ position: 'absolute', top: isMobile ? '1rem' : '1.5rem', right: isMobile ? '1rem' : '1.5rem', width: '40px', height: '40px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', touchAction: 'manipulation' }}>
          <X size={18} strokeWidth={2.5} />
        </button>

        <div style={{ textAlign: 'center', maxWidth: '280px' }}>
          {/* Label */}
          <div style={{ fontSize: '0.65rem', fontWeight: '700', color: 'rgba(255,215,0,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>Rust</div>

          {/* Circulaire timer */}
          <div style={{ position: 'relative', width: isMobile ? '180px' : '220px', height: isMobile ? '180px' : '220px', margin: '0 auto 1.5rem' }}>
            <svg width="100%" height="100%" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
              <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,215,0,0.6)" strokeWidth="4"
                strokeDasharray={`${2 * Math.PI * 44}`}
                strokeDashoffset={`${2 * Math.PI * 44 * (1 - restPct / 100)}`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: isMobile ? '2.5rem' : '3rem', fontWeight: '800', color: '#fff', lineHeight: 1, letterSpacing: '-0.04em' }}>{restSeconds}</div>
              <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.3)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em' }}>seconden</div>
            </div>
          </div>

          {/* Volgende oefening preview */}
          <div style={{ marginBottom: '1.5rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.35)', fontWeight: '500' }}>
            {isLastSet && !isLastExercise
              ? <span>Volgende: <span style={{ color: 'rgba(255,255,255,0.6)', fontWeight: '700' }}>{exercises[exerciseIndex + 1]?.name}</span></span>
              : <span style={{ color: 'rgba(255,255,255,0.4)' }}>Set {currentSet + 1} van {totalSets}</span>}
          </div>

          {/* Knoppen */}
          <div style={{ display: 'flex', gap: '0.625rem' }}>
            <button onClick={() => setTimerRunning(p => !p)} style={{ flex: 1, padding: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', minHeight: '44px', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
              {timerRunning ? <Pause size={14} strokeWidth={2.5} /> : <Play size={14} strokeWidth={2.5} />}
              {timerRunning ? 'Pauze' : 'Hervatten'}
            </button>
            <button onClick={skipRest} style={{ flex: 1, padding: '0.75rem', background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.2)', borderRadius: '8px', color: '#FFD700', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', minHeight: '44px', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
              <SkipForward size={14} strokeWidth={2.5} />Overslaan
            </button>
          </div>
        </div>
      </div>,
      document.body
    )
  }

  // Exercise phase
  return createPortal(
    <div style={{ position: 'fixed', inset: 0, background: '#0a0a0a', zIndex: 2000, display: 'flex', flexDirection: 'column', opacity: visible ? 1 : 0, transition: 'opacity 0.3s ease' }}>

      {/* HEADER */}
      <div style={{ padding: isMobile ? '1rem' : '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <button onClick={exerciseIndex > 0 ? () => { setExerciseIndex(p => p - 1); setCurrentSet(1) } : handleClose} style={{ width: '36px', height: '36px', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '7px', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
            <ChevronLeft size={18} strokeWidth={2.5} />
          </button>
          <div>
            <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.25)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Oefening {exerciseIndex + 1} / {exercises.length}
            </div>
            <div style={{ fontSize: isMobile ? '0.78rem' : '0.85rem', color: '#fff', fontWeight: '700', letterSpacing: '-0.01em' }}>Flow</div>
          </div>
        </div>
        <button onClick={handleClose} style={{ width: '36px', height: '36px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '7px', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
          <X size={17} strokeWidth={2.5} />
        </button>
      </div>

      {/* Progress dots */}
      <div style={{ display: 'flex', gap: '4px', padding: isMobile ? '0.5rem 1rem 0' : '0.625rem 1.25rem 0' }}>
        {exercises.map((_, i) => (
          <div key={i} style={{ flex: 1, height: '3px', borderRadius: '2px', background: i < exerciseIndex ? '#10b981' : i === exerciseIndex ? 'rgba(255,215,0,0.7)' : 'rgba(255,255,255,0.08)', transition: 'background 0.3s ease' }} />
        ))}
      </div>

      {/* FOTO */}
      <div style={{ flex: '0 0 auto', height: isMobile ? '220px' : '280px', position: 'relative', overflow: 'hidden' }}>
        {imageUrl && (
          <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.6 }} />
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(10,10,10,0.1) 0%, rgba(10,10,10,0.7) 80%, #0a0a0a 100%)' }} />

        {/* Sets indicator over foto */}
        <div style={{ position: 'absolute', bottom: isMobile ? '1rem' : '1.25rem', left: isMobile ? '1rem' : '1.25rem', right: isMobile ? '1rem' : '1.25rem', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: isMobile ? '0.6rem' : '0.65rem', fontWeight: '700', color: 'rgba(255,215,0,0.6)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>
              Set {currentSet} van {totalSets}
            </div>
            <div style={{ fontSize: isMobile ? '1.4rem' : '1.7rem', fontWeight: '800', color: '#fff', letterSpacing: '-0.03em', lineHeight: 1 }}>
              {exercise?.name}
            </div>
            {exercise?.equipment && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: '0.4rem', fontSize: isMobile ? '0.68rem' : '0.72rem', fontWeight: 700, color: 'rgba(255,215,0,0.85)' }}>
                <Dumbbell size={12} /> {exercise.equipment}
              </div>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: isMobile ? '0.6rem' : '0.65rem', color: 'rgba(255,255,255,0.3)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.2rem' }}>Reps</div>
            <div style={{ fontSize: isMobile ? '1.75rem' : '2rem', fontWeight: '800', color: 'rgba(255,215,0,0.9)', letterSpacing: '-0.03em', lineHeight: 1 }}>
              {exercise?.reps || '—'}
            </div>
          </div>
        </div>
      </div>

      {/* INFO STRIP */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        {[
          { label: 'Sets', value: `${currentSet}/${totalSets}` },
          { label: 'Reps', value: exercise?.reps || '—' },
          { label: 'Rust', value: exercise?.rust || '—' },
          { label: 'RIR', value: exercise?.rpe || exercise?.rir || '—' },
        ].map(({ label, value }, i, arr) => (
          <div key={label} style={{ flex: 1, padding: isMobile ? '0.75rem 0.5rem' : '0.875rem 0.75rem', textAlign: 'center', borderRight: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
            <div style={{ fontSize: isMobile ? '0.95rem' : '1.1rem', fontWeight: '800', color: '#fff', letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: isMobile ? '0.5rem' : '0.55rem', color: 'rgba(255,255,255,0.25)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.2rem' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* SET KNOPPEN */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '1rem' : '1.5rem' }}>
        <div style={{ display: 'flex', gap: isMobile ? '0.375rem' : '0.5rem', width: '100%', maxWidth: '400px' }}>
          {Array.from({ length: totalSets }, (_, i) => {
            const setNum = i + 1
            const done = setNum < currentSet
            const active = setNum === currentSet
            return (
              <div key={i} style={{ flex: 1, height: isMobile ? '6px' : '7px', borderRadius: '3px', background: done ? '#10b981' : active ? 'rgba(255,215,0,0.6)' : 'rgba(255,255,255,0.08)', transition: 'background 0.3s ease' }} />
            )
          })}
        </div>
      </div>

      {/* FOOTER */}
      <div style={{ padding: isMobile ? '0.875rem 1rem' : '1rem 1.25rem', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <button onClick={handleSetDone} style={{ width: '100%', padding: isMobile ? '1rem' : '1.125rem', background: isLastSet && isLastExercise ? 'rgba(16,185,129,0.12)' : 'rgba(255,215,0,0.1)', border: `1px solid ${isLastSet && isLastExercise ? 'rgba(16,185,129,0.3)' : 'rgba(255,215,0,0.25)'}`, borderRadius: '10px', color: isLastSet && isLastExercise ? '#10b981' : '#FFD700', fontSize: isMobile ? '0.875rem' : '0.95rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', minHeight: isMobile ? '52px' : '56px', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', transition: 'all 0.15s ease' }}
          onTouchStart={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
          onTouchEnd={(e) => e.currentTarget.style.transform = 'scale(1)'}>
          {isLastSet && isLastExercise
            ? <><Check size={isMobile ? 16 : 18} strokeWidth={2.5} />Laatste set klaar</>
            : <><Check size={isMobile ? 16 : 18} strokeWidth={2.5} />Set {currentSet} klaar</>}
        </button>

        {/* Skip oefening */}
        {!isLastExercise && (
          <button onClick={() => { setExerciseIndex(p => p + 1); setCurrentSet(1) }} style={{ width: '100%', marginTop: '0.5rem', padding: '0.5rem', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.2)', fontSize: isMobile ? '0.65rem' : '0.7rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
            <SkipForward size={12} strokeWidth={2} />Sla over
          </button>
        )}
      </div>
    </div>,
    document.body
  )
}
