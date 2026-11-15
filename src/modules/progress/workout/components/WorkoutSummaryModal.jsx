// src/modules/progress/workout/components/WorkoutSummaryModal.jsx
import { Check, Share2, TrendingUp, Clock, Dumbbell, Zap } from 'lucide-react'

const MUSCLE_GROUP_MAP = [
  { keywords: ['bench', 'chest', 'pec'], group: 'Borst' },
  { keywords: ['squat', 'leg press', 'lunge', 'quad', 'extension'], group: 'Benen' },
  { keywords: ['deadlift', 'rdl', 'hamstring', 'glute', 'hip thrust', 'sumo'], group: 'Billen / Hamstrings' },
  { keywords: ['curl', 'bicep', 'hammer'], group: 'Biceps' },
  { keywords: ['tricep', 'dip', 'pushdown', 'skull', 'extension'], group: 'Triceps' },
  { keywords: ['row', 'pull', 'lat', 'pulldown', 'pull-up', 'chin'], group: 'Rug' },
  { keywords: ['shoulder', 'overhead', 'lateral', 'ohp', 'military', 'front raise', 'facepull'], group: 'Schouders' },
  { keywords: ['calf', 'kuit'], group: 'Kuiten' },
  { keywords: ['plank', 'crunch', 'ab ', 'abs', 'core', 'sit-up', 'situp'], group: 'Core' },
  { keywords: ['press', 'push'], group: 'Borst' },
]

function detectMuscleGroups(exerciseNames) {
  const groups = new Set()
  for (const name of exerciseNames) {
    const n = name.toLowerCase()
    for (const { keywords, group } of MUSCLE_GROUP_MAP) {
      if (keywords.some(kw => n.includes(kw))) {
        groups.add(group)
        break
      }
    }
  }
  return [...groups]
}

export default function WorkoutSummaryModal({ summaryData, onClose }) {
  const { duration, exercises = [], prs = [], workoutName } = summaryData

  const totalSets = exercises.reduce((sum, ex) => sum + (ex.sets?.length || 0), 0)
  const totalVolume = exercises.reduce(
    (sum, ex) => sum + (ex.sets || []).reduce((s, set) => s + (set.weight || 0) * (set.reps || 0), 0),
    0
  )
  const muscleGroups = detectMuscleGroups(exercises.map(ex => ex.name))

  const handleShare = async () => {
    const lines = [
      `💪 ${workoutName || 'Workout'} voltooid!`,
      `⏱ ${duration} min · 🏋️ ${Math.round(totalVolume).toLocaleString('nl')} kg · ✅ ${totalSets} sets`,
    ]
    if (prs.length > 0) lines.push(`🏆 PR: ${prs.map(p => `${p.name} ${p.weight}kg`).join(', ')}`)
    lines.push('\nGelogd via MY ARC')
    if (navigator.share) {
      try { await navigator.share({ text: lines.join('\n') }) } catch (_) {}
    }
  }

  const isMobile = window.innerWidth <= 768

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.95)',
      zIndex: 4000,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '1rem',
      overflowY: 'auto'
    }}>
      <div style={{
        width: '100%', maxWidth: '420px',
        background: 'linear-gradient(160deg, #071a0e 0%, #0a2015 100%)',
        border: '1px solid rgba(16,185,129,0.25)',
        borderRadius: '24px',
        overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(16,185,129,0.12), 0 0 0 1px rgba(16,185,129,0.1)',
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          padding: '2rem 1.5rem',
          textAlign: 'center'
        }}>
          <div style={{
            width: '64px', height: '64px',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem',
            boxShadow: '0 0 0 8px rgba(255,255,255,0.1)'
          }}>
            <Check size={32} color="#fff" strokeWidth={3} />
          </div>
          <h2 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: '800', margin: 0, letterSpacing: '-0.02em' }}>
            Workout Voltooid!
          </h2>
          {workoutName && (
            <p style={{ color: 'rgba(255,255,255,0.75)', margin: '0.3rem 0 0', fontSize: '0.9rem' }}>
              {workoutName}
            </p>
          )}
        </div>

        {/* Stats Row */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          borderBottom: '1px solid rgba(16,185,129,0.12)'
        }}>
          {[
            { icon: Clock, label: 'Duur', value: `${duration} min` },
            { icon: TrendingUp, label: 'Volume', value: `${Math.round(totalVolume).toLocaleString('nl')} kg` },
            { icon: Dumbbell, label: 'Sets', value: String(totalSets) }
          ].map(({ icon: Icon, label, value }, i) => (
            <div key={label} style={{
              padding: '1.1rem 0.5rem', textAlign: 'center',
              borderRight: i < 2 ? '1px solid rgba(16,185,129,0.1)' : 'none',
              background: 'rgba(16,185,129,0.04)'
            }}>
              <Icon size={16} color="#10b981" style={{ margin: '0 auto 0.3rem', display: 'block' }} />
              <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#fff', letterSpacing: '-0.02em' }}>{value}</div>
              <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '600', marginTop: '0.1rem' }}>{label}</div>
            </div>
          ))}
        </div>

        <div style={{ padding: '1.25rem' }}>
          {/* PRs */}
          {prs.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                <Zap size={14} color="#10b981" />
                <span style={{ color: '#10b981', fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Nieuw Persoonlijk Record</span>
              </div>
              {prs.map((pr, i) => (
                <div key={i} style={{
                  background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
                  borderRadius: '10px', padding: '0.6rem 0.75rem', marginBottom: '0.4rem',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <span style={{ color: '#fff', fontSize: '0.85rem', fontWeight: '600' }}>🏆 {pr.name}</span>
                  <span style={{ color: '#10b981', fontSize: '0.9rem', fontWeight: '800' }}>{pr.weight}kg × {pr.reps}</span>
                </div>
              ))}
            </div>
          )}

          {/* Muscle groups */}
          {muscleGroups.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.6rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Spiergroepen</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.4rem' }}>
                {muscleGroups.map(g => (
                  <span key={g} style={{
                    background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
                    borderRadius: '20px', padding: '0.2rem 0.65rem',
                    color: '#10b981', fontSize: '0.75rem', fontWeight: '600'
                  }}>{g}</span>
                ))}
              </div>
            </div>
          )}

          {/* Exercise list */}
          {exercises.filter(ex => ex.sets?.length > 0).length > 0 && (
            <div style={{ marginBottom: '1.25rem' }}>
              <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.6rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Oefeningen</span>
              <div style={{ marginTop: '0.5rem' }}>
                {exercises.filter(ex => ex.sets?.length > 0).map((ex, i, arr) => {
                  const vol = (ex.sets || []).reduce((s, set) => s + (set.weight || 0) * (set.reps || 0), 0)
                  const maxWeight = Math.max(...(ex.sets || []).map(s => s.weight || 0))
                  const isPR = prs.some(p => p.name === ex.name)
                  return (
                    <div key={i} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '0.6rem 0',
                      borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none'
                    }}>
                      <div>
                        <div style={{ color: '#fff', fontSize: '0.85rem', fontWeight: '600' }}>
                          {ex.name}
                          {isPR && <span style={{ color: '#10b981', fontSize: '0.65rem', fontWeight: '700', marginLeft: '0.4rem' }}>PR</span>}
                        </div>
                        <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.7rem', marginTop: '0.1rem' }}>
                          {ex.sets.length} {ex.sets.length === 1 ? 'set' : 'sets'} · max {maxWeight}kg
                        </div>
                      </div>
                      <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>{Math.round(vol)} kg</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {typeof navigator !== 'undefined' && navigator.share && (
              <button
                onClick={handleShare}
                style={{
                  flex: 1, padding: '0.875rem',
                  background: 'rgba(16,185,129,0.12)',
                  border: '1px solid rgba(16,185,129,0.25)',
                  borderRadius: '12px', color: '#10b981',
                  fontSize: '0.875rem', fontWeight: '700', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
                }}
              >
                <Share2 size={16} /> Delen
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                flex: 1, padding: '0.875rem',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                border: 'none', borderRadius: '12px', color: '#fff',
                fontSize: '0.875rem', fontWeight: '700', cursor: 'pointer',
                boxShadow: '0 8px 20px rgba(16,185,129,0.25)',
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                minHeight: '44px'
              }}
            >
              Sluiten
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
