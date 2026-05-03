// ============================================
// 📁 FILE: src/modules/coach-command-center/components/insight/WorkoutColumn.jsx
// Training drill-down: Sessions → Exercises → Progress
// Props: { workoutData, exerciseProgress, isMobile, onNavigateWorkout, client, onClose }
// ============================================
import React, { useState } from 'react'
import { Dumbbell, TrendingDown, TrendingUp, ChevronRight, ArrowLeft, ExternalLink } from 'lucide-react'

const formatDate = (d) => { if (!d) return '-'; const dt = new Date(d); return dt.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: dt.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined }) }
const formatDaysAgo = (d) => { if (d === null || d === undefined) return 'Nooit'; if (d === 0) return 'Vandaag'; if (d === 1) return 'Gisteren'; return `${d}d geleden` }

const SetDisplay = ({ s }) => (
  <span style={{ fontSize: '0.5rem', padding: '0.1rem 0.25rem', background: 'rgba(249,115,22,0.08)', borderRadius: '3px', color: 'rgba(249,115,22,0.6)' }}>
    {s.weight || 0}kg×{s.reps || 0}
    {s.partials ? <span style={{ color: 'rgba(168,85,247,0.6)' }}>+{s.partials}p</span> : null}
    {s.dropsets?.length > 0 ? s.dropsets.map((ds, di) => <span key={di} style={{ color: 'rgba(255,215,0,0.6)' }}> D{ds.weight}×{ds.reps}</span>) : null}
  </span>
)

export default function WorkoutColumn({ workoutData, exerciseProgress = {}, isMobile, onNavigateWorkout, client, onClose }) {
  const [view, setView] = useState('sessions')
  const [selectedSession, setSelectedSession] = useState(null)
  const [selectedExercise, setSelectedExercise] = useState(null)
  const workouts = workoutData?.workouts || []

  const getSessionExercises = () => {
    if (!selectedSession) return []
    const exercises = []
    Object.entries(exerciseProgress).forEach(([name, entries]) => {
      const match = entries.find(e => e.sessionId === selectedSession.id)
      if (match) exercises.push({ name, ...match })
    })
    if (exercises.length === 0 && selectedSession.exercises_completed) {
      return selectedSession.exercises_completed.map(e => ({ name: e.name, sets: [], bestWeight: 0, bestReps: 0, totalSets: e.sets || 0 }))
    }
    return exercises
  }

  const getExerciseHistory = () => {
    if (!selectedExercise) return []
    return (exerciseProgress[selectedExercise] || []).sort((a, b) => new Date(b.date) - new Date(a.date))
  }

  // ── SESSIONS ──
  if (view === 'sessions') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        <div style={{ padding: isMobile ? '0.625rem 0.75rem' : '0.75rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Dumbbell size={14} color="#f97316" /><span style={{ fontSize: '0.7rem', fontWeight: '700', color: '#f97316', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sessies</span></div>
          {workoutData?.totalWorkouts > 0 && <span style={{ fontSize: '0.65rem', fontWeight: '700', color: 'rgba(249,115,22,0.6)' }}>{workoutData.completedWorkouts}/{workoutData.totalWorkouts}</span>}
        </div>
        {workoutData?.totalWorkouts > 0 && (
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            {[{ label: 'VOLTOOID', val: workoutData.completedWorkouts, color: '#10b981' }, { label: 'TOTAAL', val: workoutData.totalWorkouts, color: '#fff' }, { label: 'LAATSTE', val: formatDaysAgo(workoutData.daysSinceWorkout), color: workoutData.daysSinceWorkout <= 3 ? '#10b981' : workoutData.daysSinceWorkout <= 7 ? '#f59e0b' : '#ef4444' }].map((s, i) => (
              <div key={i} style={{ flex: 1, textAlign: 'center', padding: isMobile ? '0.4rem 0.125rem' : '0.5rem 0.25rem', borderRight: i < 2 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                <div style={{ fontSize: '0.4rem', fontWeight: '700', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.1rem' }}>{s.label}</div>
                <div style={{ fontSize: isMobile ? '0.8rem' : '0.9rem', fontWeight: '800', color: s.color, lineHeight: 1 }}>{s.val}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── BEKIJK PLAN KNOP — identiek aan MealsColumn ── */}
        {onNavigateWorkout && (
          <div style={{ padding: isMobile ? '0.5rem 0.75rem' : '0.625rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              {workoutData?.schema ? (
                <>
                  <div style={{ fontSize: '0.6rem', fontWeight: '600', color: '#f97316' }}>{workoutData.schema.name || 'Workout Plan'}</div>
                  <div style={{ fontSize: '0.45rem', color: 'rgba(255,255,255,0.2)' }}>{workoutData.schema.days_per_week || '-'}d/week · {workoutData.schema.experience_level || '-'}</div>
                </>
              ) : (
                <div style={{ fontSize: '0.6rem', fontWeight: '600', color: 'rgba(255,255,255,0.3)' }}>Geen schema</div>
              )}
            </div>
            <button onClick={() => { onNavigateWorkout(client?.id, workoutData?.schema?.id || null); if (onClose) onClose() }} style={{
              padding: isMobile ? '0.3rem 0.5rem' : '0.35rem 0.625rem',
              background: 'rgba(249,115,22,0.08)',
              border: '1px solid rgba(249,115,22,0.2)',
              borderRadius: '6px', color: '#f97316',
              fontSize: '0.6rem', fontWeight: '700',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem',
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: '28px'
            }}>
              <ExternalLink size={10} /> {workoutData?.schema ? 'Bekijk Plan' : 'Nieuw Plan'}
            </button>
          </div>
        )}

        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {workouts.length > 0 ? workouts.slice(0, 20).map((w, idx) => (
            <button key={`${w.workout_date}-${idx}`} onClick={() => { setSelectedSession(w); setView('exercises') }} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: isMobile ? '0.5rem 0.75rem' : '0.625rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.03)', background: 'transparent', border: 'none', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span style={{ fontSize: '0.5rem', padding: '0.1rem 0.25rem', borderRadius: '3px', fontWeight: '700', background: w.is_completed ? 'rgba(16,185,129,0.12)' : 'rgba(249,115,22,0.12)', color: w.is_completed ? '#10b981' : '#f97316' }}>{w.is_completed ? '✓' : '—'}</span>
                <span style={{ fontSize: isMobile ? '0.7rem' : '0.75rem', fontWeight: '600', color: '#fff' }}>{w.day_name}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.25)' }}>{formatDate(w.workout_date)}</span>
                <ChevronRight size={12} color="rgba(255,255,255,0.15)" />
              </div>
            </button>
          )) : <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '0.75rem' }}>Geen workouts</div>}
        </div>
      </div>
    )
  }

  // ── EXERCISES ──
  if (view === 'exercises' && selectedSession) {
    const exs = getSessionExercises()
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        <div style={{ padding: isMobile ? '0.625rem 0.75rem' : '0.75rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <button onClick={() => { setView('sessions'); setSelectedSession(null) }} style={{ display: 'flex', alignItems: 'center', background: 'transparent', border: 'none', color: '#f97316', cursor: 'pointer', padding: 0, touchAction: 'manipulation' }}><ArrowLeft size={14} /></button>
          <span style={{ fontSize: '0.7rem', fontWeight: '700', color: '#f97316' }}>{selectedSession.day_name}</span>
          <span style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.25)' }}>{formatDate(selectedSession.workout_date)}</span>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {exs.length > 0 ? exs.map((ex, idx) => (
            <button key={idx} onClick={() => { setSelectedExercise(ex.name); setView('progress') }} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: isMobile ? '0.5rem 0.75rem' : '0.625rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.03)', background: 'transparent', border: 'none', cursor: 'pointer', touchAction: 'manipulation', textAlign: 'left' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: isMobile ? '0.7rem' : '0.75rem', fontWeight: '600', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ex.name}</div>
                {ex.sets?.length > 0 && <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.15rem', flexWrap: 'wrap' }}>{ex.sets.map((s, si) => <SetDisplay key={si} s={s} />)}</div>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', flexShrink: 0 }}>
                {ex.bestWeight > 0 && <span style={{ fontSize: '0.7rem', fontWeight: '800', color: '#f97316' }}>{ex.bestWeight}kg</span>}
                <ChevronRight size={12} color="rgba(255,255,255,0.15)" />
              </div>
            </button>
          )) : <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '0.75rem' }}>Geen data</div>}
        </div>
      </div>
    )
  }

  // ── PROGRESS ──
  if (view === 'progress' && selectedExercise) {
    const entries = getExerciseHistory()
    const first = entries.length > 0 ? entries[entries.length - 1] : null
    const latest = entries[0] || null
    const wDiff = (first && latest && entries.length >= 2) ? latest.bestWeight - first.bestWeight : null
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        <div style={{ padding: isMobile ? '0.625rem 0.75rem' : '0.75rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <button onClick={() => setView('exercises')} style={{ display: 'flex', alignItems: 'center', background: 'transparent', border: 'none', color: '#f97316', cursor: 'pointer', padding: 0, touchAction: 'manipulation' }}><ArrowLeft size={14} /></button>
          <span style={{ fontSize: '0.7rem', fontWeight: '700', color: '#f97316', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selectedExercise}</span>
        </div>
        {latest && (
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            {[{ label: 'BESTE', val: `${latest.bestWeight}kg`, color: '#f97316' }, { label: 'REPS', val: `×${latest.bestReps}`, color: '#fff' }, { label: 'SESSIES', val: entries.length, color: '#fff' }, ...(wDiff !== null && wDiff !== 0 ? [{ label: 'TREND', val: `${wDiff > 0 ? '+' : ''}${wDiff}kg`, color: wDiff > 0 ? '#10b981' : '#ef4444' }] : [])].map((s, i) => (
              <div key={i} style={{ flex: 1, textAlign: 'center', padding: isMobile ? '0.4rem 0.125rem' : '0.5rem 0.25rem', borderRight: i < 3 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                <div style={{ fontSize: '0.4rem', fontWeight: '700', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.1rem' }}>{s.label}</div>
                <div style={{ fontSize: isMobile ? '0.75rem' : '0.85rem', fontWeight: '800', color: s.color, lineHeight: 1 }}>{s.val}</div>
              </div>
            ))}
          </div>
        )}
        {entries.length > 1 && (
          <div style={{ padding: isMobile ? '0.5rem 0.75rem' : '0.625rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', gap: '0.2rem', alignItems: 'flex-end', justifyContent: 'center' }}>
            {[...entries].reverse().slice(-12).map((e, ei, arr) => {
              const mx = Math.max(...arr.map(x => x.bestWeight)), mn = Math.min(...arr.map(x => x.bestWeight)), rng = mx - mn || 1
              return <div key={ei} title={`${formatDate(e.date)}: ${e.bestWeight}kg`} style={{ width: '10px', height: `${8 + ((e.bestWeight - mn) / rng) * 24}px`, borderRadius: '2px', background: ei === arr.length - 1 ? '#f97316' : 'rgba(249,115,22,0.25)', flexShrink: 0 }} />
            })}
          </div>
        )}
        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {entries.map((e, idx) => (
            <div key={idx} style={{ padding: isMobile ? '0.5rem 0.75rem' : '0.625rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                <span style={{ fontSize: '0.6rem', color: idx === 0 ? '#f97316' : 'rgba(255,255,255,0.35)' }}>{formatDate(e.date)}</span>
                <span style={{ fontSize: '0.7rem', fontWeight: '800', color: idx === 0 ? '#f97316' : '#fff' }}>{e.bestWeight}kg <span style={{ fontWeight: '500', fontSize: '0.5rem', opacity: 0.5 }}>×{e.bestReps}</span></span>
              </div>
              {e.sets?.length > 0 && <div style={{ display: 'flex', gap: '0.2rem', flexWrap: 'wrap' }}>{e.sets.map((s, si) => <SetDisplay key={si} s={s} />)}</div>}
            </div>
          ))}
          {entries.length === 0 && <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '0.75rem' }}>Geen progressie</div>}
        </div>
      </div>
    )
  }
  return null
}
