// ============================================
// 📁 FILE: src/modules/coach-command-center/components/insight/WorkoutColumn.jsx
// Training drill-down: Sessions → Exercises → Progress
// Props: { workoutData, exerciseProgress, isMobile, onNavigateWorkout, client, onClose }
// ============================================
import React, { useState, useMemo } from 'react'
import { Dumbbell, TrendingDown, TrendingUp, ChevronRight, ArrowLeft, ExternalLink, BarChart3, MessageSquare, Zap, ThumbsUp, Moon, Thermometer } from 'lucide-react'
import WorkoutOverviewChart from './WorkoutOverviewChart'
import CardioInsightBlock from './CardioInsightBlock'
import StappenInsight from './StappenInsight'
import ExerciseProgressChart from '../../../workout/components/todays-workout/components/ExerciseProgressChart'
import { workoutFoto } from '../../../../client/components/workoutFoto'
import { getFallbackImage, youtubeThumb } from '../../../workout/utils/oefeningFoto'
import { useEffect } from 'react'

const formatDate = (d) => { if (!d) return '-'; const dt = new Date(d); return dt.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: dt.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined }) }
const WEEKDAG_NL = { monday: 'maandag', tuesday: 'dinsdag', wednesday: 'woensdag', thursday: 'donderdag', friday: 'vrijdag', saturday: 'zaterdag', sunday: 'zondag' }

// Mirror of the feelings list in LogModal — client picks one of these +
// optional free-text note. They get stored together in workout_sessions.notes
// as "feeling|note" (separator-delimited).
const FEELINGS_MAP = {
  sterk:   { icon: Zap,           label: 'Sterk',   color: '#10b981' },
  normaal: { icon: ThumbsUp,      label: 'Normaal', color: '#fff' },
  moe:     { icon: Moon,          label: 'Moe',     color: '#f59e0b' },
  zwak:    { icon: TrendingDown,  label: 'Zwak',    color: '#f97316' },
  ziek:    { icon: Thermometer,   label: 'Ziek',    color: '#ef4444' },
}

const parseSessionNote = (raw) => {
  if (!raw || typeof raw !== 'string') return { feeling: null, note: null }
  const idx = raw.indexOf('|')
  if (idx === -1) return { feeling: null, note: raw.trim() || null }
  const feeling = raw.slice(0, idx).trim()
  const note    = raw.slice(idx + 1).trim()
  return {
    feeling: FEELINGS_MAP[feeling] ? feeling : null,
    note: note || null,
  }
}

// Eén set als cijferpaar, zelfde vorm als de macro's op de maaltijdkaart:
// dik getal, klein grijs label.
const SetDisplay = ({ s }) => (
  <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 2, whiteSpace: 'nowrap' }}>
    <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'rgba(255,255,255,0.75)', fontVariantNumeric: 'tabular-nums' }}>
      {s.weight || 0}<span style={{ fontSize: '0.56rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)' }}>kg</span>×{s.reps || 0}
    </span>
    {s.partials ? <span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)' }}>+{s.partials}p</span> : null}
    {s.dropsets?.length > 0 ? s.dropsets.map((ds, di) => <span key={di} style={{ fontSize: '0.6rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)' }}>D{ds.weight}×{ds.reps}</span>) : null}
  </span>
)

// Foto per oefening, dezelfde keten als de oefeningkaart van de klant:
// thumbnail van de coach, YouTube-thumb, foto uit de oefeningentabel, en
// anders de stockfoto op naam. Eén query voor alle oefeningen van een sessie.
function useOefeningFotos(db, namen) {
  const sleutel = namen.join('|')
  const [fotos, setFotos] = useState({})
  useEffect(() => {
    if (!db?.supabase || namen.length === 0) return
    let weg = false
    ;(async () => {
      try {
        const { data } = await db.supabase
          .from('exercises')
          .select('name, thumbnail_url, video_url, image_url')
          .in('name', namen)
        if (weg) return
        const uit = {}
        ;(data || []).forEach(ex => {
          uit[ex.name] = ex.thumbnail_url || youtubeThumb(ex.video_url) || ex.image_url || null
        })
        setFotos(uit)
      } catch (e) { console.warn('oefeningfoto\'s laden mislukt', e?.message) }
    })()
    return () => { weg = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, sleutel])
  return (naam) => fotos[naam] || getFallbackImage({ name: naam })
}

// Kaartstijl van de workout-pagina van de klant.
const KAART = {
  margin: '0 0.9rem 0.45rem',
  background: 'rgba(255,255,255,0.025)',
  border: '1px solid rgba(255,255,255,0.05)',
  borderRadius: 12, overflow: 'hidden', position: 'relative',
}
const SECTIEKOP = { padding: '0.3rem 0.9rem 0.45rem', fontSize: '0.86rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.015em' }

export default function WorkoutColumn({ db, workoutData, exerciseProgress = {}, isMobile, onNavigateWorkout, client, onClose }) {
  const [view, setView] = useState('sessions')
  const [selectedSession, setSelectedSession] = useState(null)
  const [selectedExercise, setSelectedExercise] = useState(null)
  const workouts = workoutData?.workouts || []

  // Per-session count of exercise-level notes (from workout_progress.notes).
  // Lets us show a "💬 3" indicator on session rows without drilling in.
  const exerciseNotesBySession = useMemo(() => {
    const counts = {}
    Object.values(exerciseProgress).forEach(entries => {
      entries.forEach(e => {
        if (e.notes && e.sessionId) {
          counts[e.sessionId] = (counts[e.sessionId] || 0) + 1
        }
      })
    })
    return counts
  }, [exerciseProgress])

  // Naam van de training (Push, Full body) voor een sessie. De sessie zelf
  // bewaart alleen de weekdag; exercises_completed is vaak leeg omdat de
  // oefeningen als losse voortgangslogs binnenkomen (exerciseProgress).
  // Daarom hier, en niet in de service. Drie aanwijzingen, in volgorde:
  //   1. overlap tussen de gelogde oefeningen en de dagen van het schema;
  //   2. heeft het schema overal dezelfde naam (2× "Full body"), dan die;
  //   3. het weekrooster van de klant (Monday → dag1).
  const schemaDagen = useMemo(() => {
    const ws = workoutData?.schema?.week_structure
    if (!ws || typeof ws !== 'object') return []
    return Object.entries(ws)
      .filter(([, d]) => d && typeof d === 'object')
      .map(([key, d]) => ({
        key, naam: String(d.name || d.focus || '').trim(),
        oefeningen: new Set((Array.isArray(d.exercises) ? d.exercises : []).map(e => String(e?.name || '').trim().toLowerCase()).filter(Boolean)),
      }))
  }, [workoutData?.schema])
  const naamVoorSessie = (w) => {
    if ((w.workout_naam || '').trim()) return w.workout_naam.trim()
    if (schemaDagen.length === 0) return null
    const gelogd = new Set([
      ...Object.entries(exerciseProgress).filter(([, entries]) => entries.some(e => e.sessionId === w.id)).map(([n]) => n),
      ...(Array.isArray(w.exercises_completed) ? w.exercises_completed.map(e => e?.name) : []),
    ].map(n => String(n || '').trim().toLowerCase()).filter(Boolean))
    let beste = null, besteScore = 0
    schemaDagen.forEach(d => {
      let gedeeld = 0
      gelogd.forEach(n => { if (d.oefeningen.has(n)) gedeeld++ })
      if (gedeeld > besteScore) { besteScore = gedeeld; beste = d }
    })
    if (beste?.naam && (besteScore >= 2 || besteScore / Math.max(1, gelogd.size) >= 0.5)) return beste.naam
    const namen = [...new Set(schemaDagen.map(d => d.naam).filter(Boolean))]
    if (namen.length === 1) return namen[0]
    const schedule = workoutData?.schedule
    if (schedule && w.day_name) {
      const sleutel = Object.keys(schedule).find(k => k.toLowerCase() === String(w.day_name).toLowerCase())
      const dag = sleutel ? schemaDagen.find(d => d.key === schedule[sleutel]) : null
      if (dag?.naam) return dag.naam
    }
    return beste?.naam || null
  }

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

  // ── OVERVIEW (multi-exercise chart) ──
  if (view === 'overview') {
    return (
      <WorkoutOverviewChart
        db={db}
        client={client}
        exerciseProgress={exerciseProgress}
        isMobile={isMobile}
        onBack={() => setView('sessions')}
      />
    )
  }

  // ── SESSIONS ──
  if (view === 'sessions') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        <div style={{ padding: isMobile ? '0.625rem 0.75rem' : '0.75rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Dumbbell size={15} color="#fff" /><span style={{ fontSize: '0.95rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.015em' }}>Training</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {workoutData?.totalWorkouts > 0 && <span style={{ fontSize: '0.72rem', fontWeight: '700', color: 'rgba(255,255,255,0.6)' }}>{workoutData.completedWorkouts}/{workoutData.totalWorkouts}</span>}
            <button
              onClick={() => setView('overview')}
              title="Krachtoverzicht"
              style={{
                display: 'flex', alignItems: 'center', gap: '0.2rem',
                padding: '0.25rem 0.4rem',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '5px', color: '#fff',
                fontSize: '0.72rem', fontWeight: '700',
                cursor: 'pointer', touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent', minHeight: '24px'
              }}
            >
              <BarChart3 size={12} /> Overzicht
            </button>
          </div>
        </div>
        {/* ── BEKIJK PLAN KNOP — identiek aan MealsColumn ── */}
        {onNavigateWorkout && (
          <div style={{ padding: isMobile ? '0.5rem 0.75rem' : '0.625rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              {workoutData?.schema ? (
                <>
                  <div style={{ fontSize: '0.72rem', fontWeight: '600', color: '#fff' }}>{workoutData.schema.name || 'Workout Plan'}</div>
                  <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)' }}>{workoutData.schema.days_per_week || '-'}d/week · {workoutData.schema.experience_level || '-'}</div>
                </>
              ) : (
                <div style={{ fontSize: '0.72rem', fontWeight: '600', color: 'rgba(255,255,255,0.5)' }}>Geen schema</div>
              )}
            </div>
            <button onClick={() => { onNavigateWorkout(client?.id, workoutData?.schema?.id || null); if (onClose) onClose() }} style={{
              padding: isMobile ? '0.3rem 0.5rem' : '0.35rem 0.625rem',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '6px', color: '#fff',
              fontSize: '0.72rem', fontWeight: '700',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem',
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: '28px'
            }}>
              <ExternalLink size={10} /> {workoutData?.schema ? 'Bekijk Plan' : 'Nieuw Plan'}
            </button>
          </div>
        )}

        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {/* Stappen: het dagdoel dat de coach zet plus de week van de klant */}
          <StappenInsight db={db} client={client} isMobile={isMobile} />
          {/* Cardio die de client zelf logt (cardio_logs) — read-only voor coach */}
          <CardioInsightBlock db={db} client={client} isMobile={isMobile} />
          {workouts.length > 0 && <div style={{ ...SECTIEKOP, paddingTop: '0.6rem' }}>Sessies</div>}
          {workouts.length > 0 ? workouts.slice(0, 20).map((w, idx) => {
            const parsed = parseSessionNote(w.notes)
            const feelingCfg = parsed.feeling ? FEELINGS_MAP[parsed.feeling] : null
            const FeelingIcon = feelingCfg?.icon
            const exerciseNotesCount = exerciseNotesBySession[w.id] || 0
            const aantalOef = Object.values(exerciseProgress).filter(entries => entries.some(e => e.sessionId === w.id)).length
              || (Array.isArray(w.exercises_completed) ? w.exercises_completed.length : 0)
            // Naam van de training uit het schema (Push, Legs); zonder match
            // de weekdag in het Nederlands.
            const weekdag = WEEKDAG_NL[String(w.day_name || '').toLowerCase()] || w.day_name || ''
            const trainingNaam = naamVoorSessie(w)
            const naam = trainingNaam || weekdag || 'Training'
            const hoogte = isMobile ? 74 : 82
            return (
              <button
                key={`${w.workout_date}-${idx}`}
                onClick={() => { setSelectedSession({ ...w, workout_naam: trainingNaam || w.workout_naam || null }); setView('exercises') }}
                style={{
                  ...KAART, display: 'block', width: 'calc(100% - 1.8rem)', height: hoogte,
                  padding: 0, textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
                  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                }}
              >
                {/* Foto als achtergrond met donker verloop, zoals de trainingskaart van de klant. */}
                <div style={{
                  position: 'absolute', inset: 0,
                  backgroundImage: `url(${workoutFoto(naam)})`,
                  backgroundSize: 'cover', backgroundPosition: 'center',
                  opacity: w.is_completed ? 0.85 : 1,
                }} />
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.6) 55%, rgba(0,0,0,0.85) 100%)',
                }} />
                <div style={{
                  position: 'relative', height: '100%',
                  display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                  padding: isMobile ? '6px 10px' : '8px 12px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{
                      flex: 1, minWidth: 0,
                      fontSize: isMobile ? '0.95rem' : '1.02rem', fontWeight: 900, color: '#fff',
                      letterSpacing: '-0.02em', lineHeight: 1.15,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      textShadow: '0 2px 10px rgba(0,0,0,0.8)',
                    }}>
                      {naam}
                    </span>
                    {feelingCfg && (
                      <span title={`Voelde zich ${feelingCfg.label.toLowerCase()}`} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 3, flexShrink: 0,
                        fontSize: '0.62rem', fontWeight: 900, color: feelingCfg.color,
                        textTransform: 'uppercase', letterSpacing: '0.06em',
                        textShadow: '0 1px 6px rgba(0,0,0,0.9)',
                      }}>
                        <FeelingIcon size={11} strokeWidth={2.6} />{feelingCfg.label}
                      </span>
                    )}
                    {(parsed.note || exerciseNotesCount > 0) && (
                      <span title={`${exerciseNotesCount + (parsed.note ? 1 : 0)} notitie(s)`} style={{ display: 'inline-flex', alignItems: 'center', gap: 2, flexShrink: 0, fontSize: '0.62rem', fontWeight: 900, color: '#fff', textShadow: '0 1px 6px rgba(0,0,0,0.9)' }}>
                        <MessageSquare size={11} strokeWidth={2.6} />{exerciseNotesCount + (parsed.note ? 1 : 0)}
                      </span>
                    )}
                    <span style={{ flexShrink: 0, fontSize: '0.62rem', fontWeight: 800, color: 'rgba(255,255,255,0.65)', fontVariantNumeric: 'tabular-nums', textShadow: '0 1px 6px rgba(0,0,0,0.9)' }}>
                      {formatDate(w.workout_date)}
                    </span>
                  </div>
                  <span style={{
                    fontSize: '0.58rem', fontWeight: 800,
                    color: w.is_completed ? '#22c55e' : 'rgba(255,255,255,0.6)',
                    textTransform: 'uppercase', letterSpacing: '0.09em', marginTop: 2,
                    textShadow: '0 1px 6px rgba(0,0,0,0.9)',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {w.is_completed ? 'Voltooid' : 'Training'}{trainingNaam && weekdag ? ` · ${weekdag}` : ''}{aantalOef > 0 ? ` · ${aantalOef} oefeningen` : ''}
                  </span>
                </div>
              </button>
            )
          }) : <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'rgba(255,255,255,0.45)', fontSize: '0.82rem', fontWeight: 700 }}>Nog geen trainingen gelogd</div>}
        </div>
      </div>
    )
  }

  // ── EXERCISES ──
  if (view === 'exercises' && selectedSession) {
    return (
      <SessieOefeningen
        db={db} isMobile={isMobile} selectedSession={selectedSession}
        exs={getSessionExercises()}
        onBack={() => { setView('sessions'); setSelectedSession(null) }}
        onKies={(naam) => { setSelectedExercise(naam); setView('progress') }}
      />
    )
  }

  // ── PROGRESS ──
  if (view === 'progress' && selectedExercise) {
    return <ProgressView db={db} client={client} isMobile={isMobile} selectedExercise={selectedExercise} entries={getExerciseHistory()} onBack={() => setView('exercises')} />
  }
  return null
}

function SessieOefeningen({ db, isMobile, selectedSession, exs, onBack, onKies }) {
  const fotoVan = useOefeningFotos(db, exs.map(e => e.name).filter(Boolean))
  const photoSize = isMobile ? 62 : 72
  {
    const parsed = parseSessionNote(selectedSession.notes)
    const feelingCfg = parsed.feeling ? FEELINGS_MAP[parsed.feeling] : null
    const FeelingIcon = feelingCfg?.icon
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        <div style={{ padding: isMobile ? '0.625rem 0.75rem' : '0.75rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <button onClick={onBack} aria-label="Terug" style={{ display: 'flex', alignItems: 'center', background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: 0, minWidth: 28, minHeight: 28, touchAction: 'manipulation' }}><ArrowLeft size={16} /></button>
          <span style={{ fontSize: '0.95rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.015em' }}>{(selectedSession.workout_naam || '').trim() || WEEKDAG_NL[String(selectedSession.day_name || '').toLowerCase()] || selectedSession.day_name || 'Training'}</span>
          <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>{formatDate(selectedSession.workout_date)}</span>
        </div>

        {/* Client-notitie blok — toon feeling-pill + note tekst zoals de client
            ze invulde in LogModal. Geeft de coach context bij deze sessie. */}
        {(parsed.note || feelingCfg) && (
          <div style={{
            padding: isMobile ? '0.5rem 0.75rem' : '0.625rem 1rem',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
            background: feelingCfg ? `${feelingCfg.color}08` : 'rgba(255,255,255,0.02)',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              marginBottom: parsed.note ? '0.35rem' : 0,
            }}>
              <MessageSquare size={11} color="rgba(255,255,255,0.35)" strokeWidth={2.2} />
              <span style={{
                fontSize: '0.72rem', fontWeight: '700',
                color: 'rgba(255,255,255,0.5)',
                letterSpacing: '-0.01em',
              }}>
                Notitie van client
              </span>
              {feelingCfg && (
                <span style={{
                  marginLeft: 'auto',
                  display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                  padding: '0.15rem 0.4rem',
                  background: `${feelingCfg.color}1a`,
                  border: `1px solid ${feelingCfg.color}55`,
                  borderRadius: '4px',
                  color: feelingCfg.color,
                  fontSize: '0.72rem', fontWeight: '800',
                  letterSpacing: '-0.01em',
                }}>
                  <FeelingIcon size={10} strokeWidth={2.5} />
                  {feelingCfg.label}
                </span>
              )}
            </div>
            {parsed.note && (
              <div style={{
                fontSize: isMobile ? '0.72rem' : '0.78rem',
                color: 'rgba(255,255,255,0.75)',
                fontWeight: '500',
                lineHeight: 1.45,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}>
                {parsed.note}
              </div>
            )}
          </div>
        )}

        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', paddingTop: '0.5rem' }}>
          {exs.length > 0 ? exs.map((ex, idx) => (
            <div key={idx} style={{ ...KAART, display: 'flex', alignItems: 'stretch' }}>
              {/* Foto links met het nummer linksboven, zoals de oefeningkaart van de klant. */}
              <div style={{ width: photoSize, alignSelf: 'stretch', flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${fotoVan(ex.name)})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.6 }} />
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)' }} />
                <div style={{
                  position: 'absolute', top: 4, left: 4, width: 18, height: 18, borderRadius: 3,
                  background: 'rgba(0,0,0,0.75)', border: '1px solid rgba(255,255,255,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2,
                }}>
                  <span style={{ fontSize: '0.56rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)', lineHeight: 1 }}>{idx + 1}</span>
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: isMobile ? '0.4rem 0.65rem' : '0.45rem 0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                  <span style={{ flex: 1, minWidth: 0, fontSize: isMobile ? '0.88rem' : '0.95rem', fontWeight: 800, color: '#fff', lineHeight: 1.15, letterSpacing: '-0.015em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {ex.name}
                  </span>
                  {ex.attachment_used && (
                    <span style={{ flexShrink: 0, fontSize: '0.6rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {String(ex.attachment_used).replace(/_/g, ' ')}
                    </span>
                  )}
                </div>
                {ex.sets?.length > 0 ? (
                  <div style={{ display: 'flex', gap: isMobile ? '0.5rem' : '0.65rem', marginTop: 3, flexWrap: 'wrap' }}>
                    {ex.sets.map((st, si) => <SetDisplay key={si} s={st} />)}
                  </div>
                ) : ex.totalSets > 0 ? (
                  <div style={{ marginTop: 3, fontSize: '0.74rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)' }}>{ex.totalSets} sets</div>
                ) : null}
                {ex.notes && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 5, marginTop: 5, paddingLeft: 7, borderLeft: '2px solid rgba(255,255,255,0.4)' }}>
                    <MessageSquare size={10} color="rgba(255,255,255,0.6)" strokeWidth={2.2} style={{ flexShrink: 0, marginTop: 2 }} />
                    <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)', lineHeight: 1.4, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{ex.notes}</span>
                  </div>
                )}
              </div>
              {/* Rechts: beste gewicht als vaste waarde, en de knop naar de progressie. */}
              <button
                onClick={() => onKies(ex.name)}
                title="Progressie van deze oefening" aria-label="Progressie van deze oefening"
                style={{
                  flexShrink: 0, alignSelf: 'stretch', minWidth: 56,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
                  padding: '0 0.6rem', background: 'transparent', border: 'none',
                  borderLeft: '1px solid rgba(255,255,255,0.06)', color: '#fff', cursor: 'pointer',
                  fontFamily: 'inherit', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                }}
              >
                {ex.bestWeight > 0 && (
                  <span style={{ fontSize: '0.9rem', fontWeight: 900, letterSpacing: '-0.015em', fontVariantNumeric: 'tabular-nums' }}>
                    {ex.bestWeight}<span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>kg</span>
                  </span>
                )}
                <TrendingUp size={14} color="rgba(255,255,255,0.55)" strokeWidth={2.4} />
              </button>
            </div>
          )) : <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'rgba(255,255,255,0.45)', fontSize: '0.82rem', fontWeight: 700 }}>Geen oefeningen gelogd in deze sessie</div>}
        </div>
      </div>
    )
  }
}

function ProgressView({ db, client, isMobile, selectedExercise, entries, onBack }) {
  {
    const first = entries.length > 0 ? entries[entries.length - 1] : null
    const latest = entries[0] || null
    const wDiff = (first && latest && entries.length >= 2) ? latest.bestWeight - first.bestWeight : null
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        <div style={{ padding: isMobile ? '0.625rem 0.75rem' : '0.75rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <button onClick={onBack} aria-label="Terug" style={{ display: 'flex', alignItems: 'center', background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: 0, minWidth: 28, minHeight: 28, touchAction: 'manipulation' }}><ArrowLeft size={16} /></button>
          <span style={{ fontSize: '0.95rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.015em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selectedExercise}</span>
        </div>
        {latest && (
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            {[{ label: 'BESTE', val: `${latest.bestWeight}kg`, color: '#fff' }, { label: 'REPS', val: `×${latest.bestReps}`, color: '#fff' }, { label: 'SESSIES', val: entries.length, color: '#fff' }, ...(wDiff !== null && wDiff !== 0 ? [{ label: 'TREND', val: `${wDiff > 0 ? '+' : ''}${wDiff}kg`, color: wDiff > 0 ? '#10b981' : '#ef4444' }] : [])].map((s, i) => (
              <div key={i} style={{ flex: 1, textAlign: 'center', padding: isMobile ? '0.4rem 0.125rem' : '0.5rem 0.25rem', borderRight: i < 3 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: '700', color: 'rgba(255,255,255,0.55)', letterSpacing: '-0.01em', marginBottom: '0.1rem' }}>{s.label}</div>
                <div style={{ fontSize: isMobile ? '0.75rem' : '0.85rem', fontWeight: '800', color: s.color, lineHeight: 1 }}>{s.val}</div>
              </div>
            ))}
          </div>
        )}
        {/* Dezelfde krachtgrafiek als de klant in zijn log-modal ziet: 8RM-schatting,
            doellijn per fase (cut/build) en de band van wat goed is. De oude
            balkjes lieten alleen het beste gewicht zien, zonder reps of fase —
            en de coach kijkt juist naar of iemand op tempo zit. */}
        {entries.length > 1 && (
          <div style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '0.5rem' }}>
            <ExerciseProgressChart db={db} client={client} exerciseName={selectedExercise} isMobile={isMobile} />
          </div>
        )}
        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {entries.map((e, idx) => (
            <div key={idx} style={{ padding: isMobile ? '0.55rem 0.9rem' : '0.6rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 3 }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: idx === 0 ? '#fff' : 'rgba(255,255,255,0.55)' }}>{formatDate(e.date)}</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 900, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>{e.bestWeight}<span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>kg</span> <span style={{ fontWeight: 700, fontSize: '0.74rem', color: 'rgba(255,255,255,0.5)' }}>×{e.bestReps}</span></span>
              </div>
              {e.sets?.length > 0 && <div style={{ display: 'flex', gap: isMobile ? '0.5rem' : '0.65rem', flexWrap: 'wrap' }}>{e.sets.map((st, si) => <SetDisplay key={si} s={st} />)}</div>}
            </div>
          ))}
          {entries.length === 0 && <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'rgba(255,255,255,0.45)', fontSize: '0.82rem', fontWeight: 700 }}>Nog geen progressie voor deze oefening</div>}
        </div>
      </div>
    )
  }
}
