// src/modules/workout/components/todays-workout/components/ExerciseLogModal.jsx
import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, Plus, Dumbbell, CheckCircle, MoreVertical, MessageSquare, Edit3, History, Play, Timer, Info } from 'lucide-react'
import ExerciseHistory from './ExerciseHistory'
import AttachmentSelector from './AttachmentSelector'
import MachineSettings from './MachineSettings'
import RustTimer from './RustTimer'
import { rusttijdVoor, timerStaatAan, bewaarTimerAan } from '../rusttijd'
import ExerciseService from '../../../../../services/ExerciseService'

// ========== SCROLL NUMBER PICKER ==========
function NumberPicker({ value, onChange, min = 0, max = 300, step = 1, unit = 'kg', onConfirm, halfStep = null }) {
  const isMobile = window.innerWidth <= 768
  const scrollRef = useRef(null)
  const [localValue, setLocalValue] = useState(value)

  const options = []
  for (let i = min; i <= max; i += step) options.push(Math.round(i * 10) / 10)

  useEffect(() => {
    if (scrollRef.current) {
      const closest = options.reduce((prev, curr) => Math.abs(curr - localValue) < Math.abs(prev - localValue) ? curr : prev, options[0])
      const index = options.indexOf(closest)
      if (index >= 0) {
        const itemHeight = 48
        scrollRef.current.scrollTop = index * itemHeight - (scrollRef.current.clientHeight / 2) + (itemHeight / 2)
      }
    }
  }, [])

  const handleSelect = (val) => {
    const clamped = Math.max(min, Math.min(max, Math.round(val * 10) / 10))
    setLocalValue(clamped)
    onChange(clamped)
    if (navigator.vibrate) navigator.vibrate(10)
  }

  const displayValue = localValue % 1 === 0 ? localValue.toString() : localValue.toFixed(1)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
      <div style={{ fontSize: isMobile ? '2.5rem' : '3rem', fontWeight: '900', color: '#FFD700', letterSpacing: '-0.03em', lineHeight: 1 }}>
        {displayValue}<span style={{ fontSize: '0.4em', color: 'rgba(255,215,0,0.4)', marginLeft: '0.25rem' }}>{unit}</span>
      </div>

      <div ref={scrollRef} style={{ width: '100%', height: isMobile ? '200px' : '240px', overflowY: 'auto', WebkitOverflowScrolling: 'touch', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {options.map((opt) => (
          <div key={opt} onClick={() => handleSelect(opt)} style={{ height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: opt === localValue ? (isMobile ? '1.3rem' : '1.5rem') : (isMobile ? '0.9rem' : '1rem'), fontWeight: opt === localValue ? '800' : '600', color: opt === localValue ? '#FFD700' : 'rgba(255,255,255,0.25)', cursor: 'pointer', transition: 'all 0.15s ease', background: opt === localValue ? 'rgba(255,215,0,0.06)' : 'transparent', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
            {opt} {unit}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
        <AdjustBtn label={`-${step * 5}`} onClick={() => handleSelect(localValue - step * 5)} isMobile={isMobile} />
        <AdjustBtn label={`-${step}`} onClick={() => handleSelect(localValue - step)} isMobile={isMobile} />
        {halfStep && <AdjustBtn label={`-${halfStep}`} onClick={() => handleSelect(localValue - halfStep)} isMobile={isMobile} half />}
        {halfStep && <AdjustBtn label={`+${halfStep}`} onClick={() => handleSelect(localValue + halfStep)} isMobile={isMobile} half positive />}
        <AdjustBtn label={`+${step}`} onClick={() => handleSelect(localValue + step)} isMobile={isMobile} positive />
        <AdjustBtn label={`+${step * 5}`} onClick={() => handleSelect(localValue + step * 5)} isMobile={isMobile} positive />
      </div>

      <button onClick={onConfirm} style={{ width: '100%', padding: isMobile ? '0.875rem' : '1rem', background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.25)', borderRadius: '10px', color: '#FFD700', fontSize: isMobile ? '0.85rem' : '0.9rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', minHeight: '48px', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
        OK
      </button>
    </div>
  )
}

function AdjustBtn({ label, onClick, isMobile, positive, half }) {
  return (
    <button onClick={onClick} style={{ padding: isMobile ? '0.4rem 0.6rem' : '0.45rem 0.7rem', background: half ? 'rgba(255,215,0,0.04)' : 'rgba(255,255,255,0.04)', border: `1px solid ${half ? 'rgba(255,215,0,0.12)' : 'rgba(255,255,255,0.08)'}`, borderRadius: '8px', color: positive ? 'rgba(255,215,0,0.5)' : 'rgba(255,255,255,0.35)', fontSize: isMobile ? '0.65rem' : '0.7rem', fontWeight: '700', cursor: 'pointer', minHeight: '34px', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
      {label}
    </button>
  )
}

// ========== SET INPUT WIZARD ==========
// `snel` = met de rusttimer aan: alleen kilo's en reps, dan klaar. Partials
// en dropsets blijven bestaan, maar niet als vier schermen tussen elke set
// door — dan is de timer zijn doel voorbij. Wie er een dropset bij wil, voegt
// die na afloop toe via het menu op de set.
function SetInputWizard({ onComplete, onCancel, previousWeight = 20, previousReps = 10, isMobile, editMode = false, snel = false }) {
  const [step, setStep] = useState(1)
  const [weight, setWeight] = useState(previousWeight)
  const [reps, setReps] = useState(previousReps)
  const [hasPartials, setHasPartials] = useState(false)
  const [partialReps, setPartialReps] = useState(1)
  const [hasDropset, setHasDropset] = useState(false)
  const [dropWeight, setDropWeight] = useState(Math.max(0, previousWeight - 10))
  const [dropReps, setDropReps] = useState(0)
  const [dropStep, setDropStep] = useState(1)

  const stepTitles = {
    1: editMode ? 'Gewicht aanpassen' : 'Hoeveel kilo?',
    2: editMode ? 'Reps aanpassen' : 'Hoeveel reps?',
    3: 'Partials?',
    4: 'Dropset?',
    5: dropStep === 1 ? 'Dropset — Gewicht?' : `Dropset ${dropWeight}kg — Reps?`
  }

  const totalSteps = snel ? 2 : (hasDropset ? 5 : 4)
  const displayStep = step <= 4 ? Math.min(step, totalSteps) : totalSteps

  const handleFinish = () => {
    onComplete({ weight, reps, partials: hasPartials ? partialReps : 0, dropsets: hasDropset ? [{ weight: dropWeight, reps: dropReps }] : [] })
  }

  function handleFinishWithoutDrop() {
    onComplete({ weight, reps, partials: hasPartials ? partialReps : 0, dropsets: [] })
  }

  const InfoTip = ({ text }) => (
    <div style={{ fontSize: isMobile ? '0.68rem' : '0.73rem', color: 'rgba(255,215,0,0.4)', fontWeight: '500', textAlign: 'center', lineHeight: 1.5, padding: '0.5rem 0.75rem', borderTop: '1px solid rgba(255,215,0,0.06)', marginTop: '0.25rem', fontStyle: 'italic' }}>
      {text}
    </div>
  )

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, background: '#0a0a0a', zIndex: 10001, display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.2s ease' }}>
      {/* Gouden top streep */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, rgba(255,215,0,0.5), transparent)', zIndex: 1 }} />

      <div style={{ padding: isMobile ? '1rem' : '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: isMobile ? '0.62rem' : '0.68rem', color: 'rgba(255,255,255,0.5)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {editMode ? 'SET AANPASSEN' : snel ? `STAP ${Math.min(step, 2)}/2` : `STAP ${displayStep}/${totalSteps}`}
        </div>
        <button onClick={onCancel} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: 'rgba(255,255,255,0.35)', fontSize: isMobile ? '0.7rem' : '0.75rem', fontWeight: '600', cursor: 'pointer', padding: '0.35rem 0.75rem', touchAction: 'manipulation' }}>
          Annuleren
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: isMobile ? '1.5rem 1rem' : '2rem 1.5rem', overflowY: 'auto' }}>
        <h3 style={{ fontSize: isMobile ? '1.5rem' : '1.75rem', fontWeight: '800', color: '#fff', margin: '0 0 1.5rem 0', letterSpacing: '-0.02em', textAlign: 'center' }}>
          {stepTitles[step]}
        </h3>

        {step === 1 && <NumberPicker value={weight} onChange={setWeight} min={0} max={300} step={1} unit="kg" onConfirm={() => setStep(2)} halfStep={0.5} />}
        {step === 2 && <NumberPicker value={reps} onChange={setReps} min={1} max={50} step={1} unit="reps" onConfirm={() => (editMode || snel) ? handleFinishWithoutDrop() : setStep(3)} />}

        {step === 3 && !editMode && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ fontSize: isMobile ? '1.5rem' : '1.8rem', fontWeight: '900', color: '#FFD700', textAlign: 'center', letterSpacing: '-0.02em' }}>{weight}kg × {reps}</div>
            <InfoTip text="Partials zijn onvolledige herhalingen aan het einde van je set, wanneer je de volle beweging niet meer kunt maken maar nog wél een stukje." />
            <div style={{ display: 'flex', gap: '0.75rem', width: '100%' }}>
              <button onClick={() => { setHasPartials(false); setStep(4) }} style={{ flex: 1, padding: isMobile ? '0.875rem' : '1rem', background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.2)', borderRadius: '10px', color: '#FFD700', fontSize: isMobile ? '0.82rem' : '0.88rem', fontWeight: '700', cursor: 'pointer', minHeight: '52px', touchAction: 'manipulation' }}>Nee</button>
              <button onClick={() => setHasPartials(true)} style={{ flex: 1, padding: isMobile ? '0.875rem' : '1rem', background: hasPartials ? 'rgba(255,215,0,0.08)' : 'transparent', border: `1px solid ${hasPartials ? 'rgba(255,215,0,0.2)' : 'rgba(255,255,255,0.08)'}`, borderRadius: '10px', color: hasPartials ? '#FFD700' : 'rgba(255,255,255,0.35)', fontSize: isMobile ? '0.82rem' : '0.88rem', fontWeight: '700', cursor: 'pointer', minHeight: '52px', touchAction: 'manipulation' }}>Ja</button>
            </div>
            {hasPartials && <div style={{ width: '100%' }}><NumberPicker value={partialReps} onChange={setPartialReps} min={1} max={20} step={1} unit="partials" onConfirm={() => setStep(4)} /></div>}
          </div>
        )}

        {step === 4 && !editMode && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ fontSize: isMobile ? '1.3rem' : '1.5rem', fontWeight: '900', color: '#FFD700', textAlign: 'center', letterSpacing: '-0.02em' }}>{weight}kg × {reps}{hasPartials ? ` +${partialReps}p` : ''}</div>
            <InfoTip text="Een dropset is wanneer je direct na je set het gewicht verlaagt en zonder rust nog een set doet." />
            <div style={{ display: 'flex', gap: '0.75rem', width: '100%' }}>
              <button onClick={handleFinishWithoutDrop} style={{ flex: 1, padding: isMobile ? '0.875rem' : '1rem', background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.2)', borderRadius: '10px', color: '#FFD700', fontSize: isMobile ? '0.82rem' : '0.88rem', fontWeight: '700', cursor: 'pointer', minHeight: '52px', touchAction: 'manipulation' }}>Nee</button>
              <button onClick={() => { setHasDropset(true); setStep(5); setDropStep(1) }} style={{ flex: 1, padding: isMobile ? '0.875rem' : '1rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: 'rgba(255,255,255,0.35)', fontSize: isMobile ? '0.82rem' : '0.88rem', fontWeight: '700', cursor: 'pointer', minHeight: '52px', touchAction: 'manipulation' }}>Ja, dropset</button>
            </div>
          </div>
        )}

        {step === 5 && !editMode && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
            {dropStep === 1
              ? <NumberPicker value={dropWeight} onChange={setDropWeight} min={0} max={200} step={1} unit="kg" onConfirm={() => setDropStep(2)} halfStep={0.5} />
              : <NumberPicker value={dropReps} onChange={setDropReps} min={1} max={50} step={1} unit="reps" onConfirm={handleFinish} />}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}

// ========== LOGGED SET ROW ==========
function LoggedSetRow({ set, index, onAddDropset, onEdit, onDelete, isMobile }) {
  const [showMenu, setShowMenu] = useState(false)

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', padding: isMobile ? '0.65rem 1rem' : '0.75rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.05)', gap: '0.5rem' }}>
        <div style={{ width: isMobile ? '24px' : '28px', height: isMobile ? '24px' : '28px', borderRadius: '6px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <CheckCircle size={isMobile ? 11 : 13} color="#10b981" />
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: isMobile ? '0.88rem' : '0.95rem', fontWeight: '800', color: '#fff', fontFamily: 'monospace' }}>
            <span style={{ color: '#FFD700' }}>{set.weight}</span>
            <span style={{ color: 'rgba(255,255,255,0.3)' }}>kg</span>
            <span style={{ color: 'rgba(255,255,255,0.2)', margin: '0 0.25rem' }}>×</span>
            <span style={{ color: '#fff' }}>{set.reps}</span>
            {set.partials > 0 && <span style={{ color: 'rgba(255,215,0,0.4)', fontSize: '0.8em' }}> +{set.partials}p</span>}
          </div>
          {set.dropsets?.length > 0 && (
            <div style={{ fontSize: isMobile ? '0.7rem' : '0.76rem', color: 'rgba(255,255,255,0.5)', fontWeight: 700, marginTop: '0.2rem', fontFamily: 'monospace' }}>
              {set.dropsets.map((ds, i) => (
                <span key={i}><span style={{ color: 'rgba(255,215,0,0.3)' }}>↓</span> {ds.weight}kg × {ds.reps}{i < set.dropsets.length - 1 ? ', ' : ''}</span>
              ))}
            </div>
          )}
        </div>

        <button onClick={() => setShowMenu(!showMenu)} style={{ width: '32px', height: '32px', background: showMenu ? 'rgba(255,255,255,0.06)' : 'transparent', border: showMenu ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent', color: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', borderRadius: '6px', touchAction: 'manipulation', transition: 'all 0.15s ease' }}>
          <MoreVertical size={isMobile ? 14 : 15} />
        </button>
      </div>

      {showMenu && (
        <div style={{ display: 'flex', gap: '0.35rem', padding: isMobile ? '0.4rem 1rem' : '0.5rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.04)', background: 'rgba(255,255,255,0.02)' }}>
          <MenuBtn label="↓ Dropset" onClick={() => { onAddDropset(index); setShowMenu(false) }} isMobile={isMobile} gold />
          <MenuBtn label="✎ Aanpassen" onClick={() => { onEdit(index); setShowMenu(false) }} isMobile={isMobile} />
          <MenuBtn label="✕ Verwijder" onClick={() => { onDelete(index); setShowMenu(false) }} isMobile={isMobile} danger />
        </div>
      )}
    </div>
  )
}

function MenuBtn({ label, onClick, isMobile, danger, gold }) {
  return (
    <button onClick={onClick} style={{ padding: isMobile ? '0.5rem 0.7rem' : '0.55rem 0.85rem', background: gold ? 'rgba(255,215,0,0.1)' : danger ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.04)', border: `1px solid ${danger ? 'rgba(239,68,68,0.3)' : gold ? 'rgba(255,215,0,0.3)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 8, color: danger ? '#ef4444' : gold ? '#FFD700' : 'rgba(255,255,255,0.7)', fontSize: isMobile ? '0.66rem' : '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', cursor: 'pointer', minHeight: 36, touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
      {label}
    </button>
  )
}

// ========== DROPSET INPUT ==========
function DropsetInput({ onSave, onCancel, isMobile }) {
  const [weight, setWeight] = useState(0)
  const [reps, setReps] = useState(0)
  const [step, setStep] = useState(1)

  return (
    <div style={{ padding: isMobile ? '1rem' : '1.25rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ fontSize: isMobile ? '0.65rem' : '0.7rem', color: 'rgba(255,215,0,0.5)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>↓ Dropset — {step === 1 ? 'Gewicht?' : `${weight}kg — Reps?`}</span>
        <button onClick={onCancel} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.25)', fontSize: isMobile ? '0.65rem' : '0.7rem', cursor: 'pointer', touchAction: 'manipulation' }}>Annuleren</button>
      </div>
      {step === 1
        ? <NumberPicker value={weight} onChange={setWeight} min={0} max={200} step={1} unit="kg" onConfirm={() => setStep(2)} halfStep={0.5} />
        : <NumberPicker value={reps} onChange={setReps} min={1} max={50} step={1} unit="reps" onConfirm={() => onSave({ weight, reps })} />}
    </div>
  )
}

// YouTube-link naar een embed-URL. Shorts, watch-links en youtu.be komen
// allemaal voor in `exercises.video_url`; alleen een embed-URL speelt in een
// iframe.
function embedUrl(url) {
  if (!url) return null
  if (url.includes('/embed/')) return url
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([^&\s?/]+)/)
  return m ? `https://www.youtube.com/embed/${m[1]}?autoplay=1&rel=0` : null
}

// ========== MAIN MODAL ==========
export default function ExerciseLogModal({ db, client, exercise, onClose, isMobile = window.innerWidth <= 768 }) {
  const [loggedSets, setLoggedSets] = useState([])
  const [showWizard, setShowWizard] = useState(false)
  const [editingIndex, setEditingIndex] = useState(null) // ✅ Nieuw: track welke set wordt bewerkt
  const [dropsetIndex, setDropsetIndex] = useState(null)
  const [exerciseNote, setExerciseNote] = useState('')
  const [workoutNote, setWorkoutNote] = useState('')
  const [showExerciseNote, setShowExerciseNote] = useState(false)
  const [showWorkoutNote, setShowWorkoutNote] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [previousPerformance, setPreviousPerformance] = useState(null)
  const [attachmentUsed, setAttachmentUsed] = useState(null)
  const [machineSettings, setMachineSettings] = useState({})
  const [previousMachineSettings, setPreviousMachineSettings] = useState(null)

  // Foto en video van de oefening. Staan in de tabel `exercises`; 243 van de
  // 249 oefeningen hebben een foto, video's zijn er maar een handvol — dus de
  // foto is de basis en de play-knop verschijnt alleen als er iets te spelen is.
  const [media, setMedia] = useState(null)
  const [toonVideo, setToonVideo] = useState(false)
  const [toonInfo, setToonInfo] = useState(false)

  // Rusttimer: na een gelogde set loopt je rusttijd, en daarna staat het
  // invoerscherm er weer. Zo hoef je tussen de sets niets aan te raken.
  //
  // De stand wordt onthouden: wie met een timer traint doet dat de hele
  // workout, niet per oefening opnieuw aanzetten.
  const [rustTimerAan, setRustTimerAan] = useState(() => timerStaatAan())
  const [rust, setRust] = useState(false)

  // De rusttijd komt uit het schema van de coach (het veld `rust` bij de
  // oefening), tenzij de klant hem zelf heeft aangepast. Per oefening, dus
  // opnieuw bepalen als je naar een andere oefening gaat.
  const rusttijd = rusttijdVoor(exercise)

  useEffect(() => { loadExistingLogs(); loadPreviousPerformance(); loadExercisePreference() }, [])

  useEffect(() => {
    let weg = false
    ExerciseService.getExerciseDetails(exercise.name)
      .then(d => { if (!weg) setMedia(d || {}) })
      .catch(e => console.error('Oefening-media laden mislukt:', e))
    return () => { weg = true }
  }, [exercise.name])

  const loadPreviousPerformance = async () => {
    if (!client?.id || !db) return
    try {
      const today = new Date().toISOString().split('T')[0]
      const { data: sessions } = await db.supabase
        .from('workout_sessions').select('id, workout_date')
        .eq('client_id', client.id).lt('workout_date', today)
        .order('workout_date', { ascending: false }).limit(10)
      if (!sessions?.length) return
      const { data: progress } = await db.supabase
        .from('workout_progress').select('sets, session_id, created_at, attachment_used, machine_settings')
        .in('session_id', sessions.map(s => s.id))
        .eq('exercise_name', exercise.name)
        .order('created_at', { ascending: false }).limit(1)
      if (!progress?.length || !progress[0].sets?.length) return
      const session = sessions.find(s => s.id === progress[0].session_id)
      setPreviousPerformance({ sets: progress[0].sets, date: session?.workout_date || null })
      if (progress[0].machine_settings) setPreviousMachineSettings(progress[0].machine_settings)
    } catch (e) { console.error('Previous performance load failed:', e) }
  }

  const loadExercisePreference = async () => {
    if (!client?.id || !db) return
    try {
      const { data } = await db.supabase
        .from('clients')
        .select('exercise_preferences')
        .eq('id', client.id)
        .single()
      const prefs = data?.exercise_preferences || {}
      const pref = prefs[exercise.name]
      if (pref?.attachment) setAttachmentUsed(pref.attachment)
      if (pref?.machine_settings) setMachineSettings(pref.machine_settings)
    } catch (e) { console.error('Exercise preference load failed:', e) }
  }

  const saveAttachmentPreference = async (attachmentId) => {
    if (!client?.id || !db) return
    try {
      const { data } = await db.supabase
        .from('clients').select('exercise_preferences').eq('id', client.id).single()
      const prefs = data?.exercise_preferences || {}
      prefs[exercise.name] = { ...prefs[exercise.name], attachment: attachmentId }
      await db.supabase.from('clients')
        .update({ exercise_preferences: prefs })
        .eq('id', client.id)
    } catch (e) { console.error('Save attachment preference failed:', e) }
  }

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = 'auto' }
  }, [])

  useEffect(() => {
    const handleEscape = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [])

  const loadExistingLogs = async () => {
    if (!client?.id || !db) { setLoading(false); return }
    try {
      const today = new Date().toISOString().split('T')[0]
      const { data: sessions } = await db.supabase.from('workout_sessions').select('id, notes').eq('client_id', client.id).eq('workout_date', today)
      if (sessions?.length > 0) {
        if (sessions[0].notes) setWorkoutNote(sessions[0].notes)
        const { data: progress } = await db.supabase.from('workout_progress').select('*').in('session_id', sessions.map(s => s.id)).eq('exercise_name', exercise.name).order('created_at', { ascending: true })
        if (progress?.length > 0) {
          const existingSets = []
          progress.forEach(p => { if (p.sets && Array.isArray(p.sets)) p.sets.forEach(s => existingSets.push({ weight: s.weight || 0, reps: s.reps || 0, partials: s.partials || 0, dropsets: s.dropsets || [] })) })
          setLoggedSets(existingSets)
          const lastNote = progress[progress.length - 1]?.notes
          if (lastNote) setExerciseNote(lastNote)
        }
      }
    } catch (e) { console.error('Error loading logs:', e) }
    finally { setLoading(false) }
  }

  const handleSetComplete = async (setData) => {
    const newSet = { weight: setData.weight, reps: setData.reps, partials: setData.partials || 0, dropsets: setData.dropsets || [] }
    let newSets

    if (editingIndex !== null) {
      // ✅ Bestaande set updaten
      newSets = loggedSets.map((s, i) => i === editingIndex ? newSet : s)
      setEditingIndex(null)
    } else {
      // Nieuwe set toevoegen
      newSets = [...loggedSets, newSet]
    }

    setLoggedSets(newSets)
    setShowWizard(false)
    // Rusttimer starten vóór het opslaan: dat is een netwerkrondje, en die
    // seconden horen bij je rust en niet bij het wachten op de server.
    // Niet na een correctie van een bestaande set — dan rust je niet.
    if (rustTimerAan && editingIndex === null) setRust(true)
    await saveToDatabase(newSets)
    if (navigator.vibrate) navigator.vibrate([30, 50, 30])
  }

  // De lus: timer op nul → invoerscherm voor de volgende set. Stopt vanzelf
  // zodra het geplande aantal sets erin staat; doorgaan kan altijd met de
  // knop, maar de app moet niet blijven duwen.
  const volgendeSet = () => {
    setRust(false)
    const gepland = parseInt(exercise.sets, 10)
    if (Number.isFinite(gepland) && loggedSets.length >= gepland) { setRustTimerAan(false); bewaarTimerAan(false); return }
    setEditingIndex(null)
    setShowWizard(true)
  }

  const wisselRustTimer = () => {
    if (rustTimerAan) { setRustTimerAan(false); bewaarTimerAan(false); setRust(false); return }
    setRustTimerAan(true)
    bewaarTimerAan(true)
    setRust(false)
    setEditingIndex(null)
    setShowWizard(true)   // meteen door naar de gewichten, zoals gevraagd
  }

  // ✅ Nieuwe handler: start edit mode voor bestaande set
  const handleEditSet = (index) => {
    setEditingIndex(index)
    setShowWizard(true)
  }

  const handleDropsetSave = async (dropsetData) => {
    const newSets = [...loggedSets]
    if (!newSets[dropsetIndex].dropsets) newSets[dropsetIndex].dropsets = []
    newSets[dropsetIndex].dropsets.push(dropsetData)
    setLoggedSets(newSets)
    setDropsetIndex(null)
    await saveToDatabase(newSets)
    if (navigator.vibrate) navigator.vibrate([30, 50, 30])
  }

  const handleDeleteSet = async (index) => {
    const newSets = loggedSets.filter((_, i) => i !== index)
    setLoggedSets(newSets)
    await saveToDatabase(newSets)
  }

  const saveToDatabase = async (sets) => {
    if (!client?.id || !db) return
    setSaving(true)
    try {
      const setsData = sets.map(s => ({ weight: s.weight, reps: s.reps, partials: s.partials || 0, dropsets: s.dropsets || [] }))
      const progress = await db.saveQuickWorkoutLog(client.id, exercise.name, setsData, exerciseNote || null)

      console.log('💾 progress id:', progress?.id, '| attachment:', attachmentUsed, '| settings:', machineSettings)

      // Sla attachment en machine settings op via het progress id
      if (progress?.id && (attachmentUsed || Object.values(machineSettings).some(v => v))) {
        const { error } = await db.supabase.from('workout_progress')
          .update({
            attachment_used: attachmentUsed || null,
            machine_settings: Object.values(machineSettings).some(v => v) ? machineSettings : null
          })
          .eq('id', progress.id)
        if (error) console.error('❌ Attachment/settings save failed:', error)
        else console.log('✅ Attachment + settings opgeslagen')
      } else {
        console.log('⚠️ Geen attachment/settings om op te slaan — attachment:', attachmentUsed, '| progress.id:', progress?.id)
      }
    } catch (e) { console.error('❌ Save failed:', e) }
    finally { setSaving(false) }
  }

  const saveMachineSettings = async (settings) => {
    if (!client?.id || !db) return
    try {
      // Sla altijd op in exercise_preferences (persistent, ook zonder workout_progress)
      const { data } = await db.supabase
        .from('clients').select('exercise_preferences').eq('id', client.id).single()
      const prefs = data?.exercise_preferences || {}
      prefs[exercise.name] = { ...prefs[exercise.name], machine_settings: settings }
      await db.supabase.from('clients').update({ exercise_preferences: prefs }).eq('id', client.id)

      // Ook opslaan in workout_progress als die al bestaat vandaag
      const today = new Date().toISOString().split('T')[0]
      const { data: sessions } = await db.supabase
        .from('workout_sessions').select('id').eq('client_id', client.id).eq('workout_date', today)
      if (sessions?.length) {
        await db.supabase.from('workout_progress')
          .update({ machine_settings: Object.values(settings).some(v => v) ? settings : null })
          .in('session_id', sessions.map(s => s.id))
          .eq('exercise_name', exercise.name)
      }
    } catch (e) { console.error('❌ Machine settings save failed:', e) }
  }

  const saveWorkoutDayNote = async () => {
    if (!client?.id || !db) return
    try {
      const today = new Date().toISOString().split('T')[0]
      await db.supabase.from('workout_sessions').update({ notes: workoutNote }).eq('client_id', client.id).eq('workout_date', today)
      if (navigator.vibrate) navigator.vibrate([20, 40, 20])
    } catch (e) { console.error('❌ Note save failed:', e) }
  }

  const lastSet = loggedSets.length > 0 ? loggedSets[loggedSets.length - 1] : null
  const editingSet = editingIndex !== null ? loggedSets[editingIndex] : null

  // Alleen een play-knop bij een video die ook echt speelt. In `exercises`
  // staat bij 241 van de 249 oefeningen alleen een YouTube-zóéklink als
  // fallback ("results?search_query=..."); die is niet embedbaar en levert een
  // scherm met een externe knop op. Een grote play-knop op de foto belooft dan
  // iets wat er niet is. De zoeklink blijft bereikbaar via de info-knop op de
  // oefeningkaart.
  // De coachvideo gaat vóór; anders de fallback. Bij 241 van de 249 oefeningen
  // is die fallback een YouTube-zóéklink en geen filmpje — die kan niet in een
  // iframe, dus daar opent de knop YouTube meteen in een nieuw tabblad.
  const videoBron = media?.video_url || media?.fallback_video_url || null
  const videoEmbed = embedUrl(videoBron)
  const heeftVideo = !!videoBron

  const speelVideo = () => {
    if (videoEmbed) { setToonVideo(true); return }
    // Geen tussenscherm dat uitlegt dat je naar een externe maker gaat: je
    // tikt op play omdat je een filmpje wilt zien, niet om dat te lezen.
    window.open(videoBron, '_blank', 'noopener,noreferrer')
  }
  const wizardActive = showWizard && dropsetIndex === null
  const dropsetActive = dropsetIndex !== null && !showWizard

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, height: '100dvh', background: '#0a0a0a', zIndex: 10000, display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.25s ease' }}>
      {/* Gouden top streep */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent 0%, rgba(255,215,0,0.55) 50%, transparent 100%)', zIndex: 1 }} />

      {/* HEADER — foto van de oefening, titel eronder.
          Een naam als "Cable Rear Delt Flies" zegt niet iedereen iets; een
          foto wel. De sluit-knop en de video liggen op de foto, zodat de
          titelregel alleen tekst is. */}
      <div style={{ flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {media?.image_url && (
          <div style={{
            position: 'relative', width: '100%',
            height: isMobile ? 168 : 210,
            background: '#111',
            marginTop: 'env(safe-area-inset-top, 0px)',
          }}>
            {/* De video speelt in de foto zelf. Voorheen opende dit een apart
                infoscherm bovenop het log-scherm; dat had drie tabbladen
                waarvan er één generieke tips toonde die voor elke oefening
                gelijk waren. Alles wat je hier nodig hebt staat nu in dit
                scherm. */}
            {toonVideo && videoEmbed ? (
              <iframe
                src={videoEmbed}
                title={exercise.name}
                allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ width: '100%', height: '100%', border: 'none', display: 'block', background: '#000' }}
              />
            ) : (
              <img
                src={media.image_url} alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                onError={e => { e.currentTarget.style.display = 'none' }}
              />
            )}
            {/* Verloop naar beneden zodat de titel eronder niet tegen een
                harde rand aan komt te staan. */}
            {!toonVideo && <div style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              background: 'linear-gradient(180deg, rgba(10,10,10,0.35) 0%, rgba(10,10,10,0) 35%, rgba(10,10,10,0.85) 100%)',
            }} />}
            {heeftVideo && !toonVideo && (
              <button
                onClick={speelVideo}
                aria-label="Bekijk de video"
                style={{
                  position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)',
                  width: 58, height: 58, borderRadius: '50%',
                  background: 'rgba(10,10,10,0.6)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
                  border: '1.5px solid rgba(255,215,0,0.55)', color: '#FFD700',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                }}
              >
                <Play size={22} strokeWidth={2.4} fill="#FFD700" style={{ marginLeft: 3 }} />
              </button>
            )}
            <button onClick={() => (toonVideo ? setToonVideo(false) : onClose())}
              aria-label={toonVideo ? 'Video sluiten' : 'Sluit'} style={{
              position: 'absolute', top: 10, right: 10,
              width: 40, height: 40, borderRadius: 12,
              background: 'rgba(10,10,10,0.7)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.15)', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            }}>
              <X size={18} strokeWidth={2.4} />
            </button>
          </div>
        )}

        {/* Titelregel in twee kolommen, 70/30, met een haarlijn ertussen.
            Links wie je bent en waar je staat, rechts waarmee je traint.
            Materiaal en machine-instellingen stonden als twee losse banden
            onder elkaar; die kostten samen meer hoogte dan de titel zelf. */}
        <div style={{
          display: 'grid',
          // 70/30, maar op een telefoon met een bodem onder de rechterkolom:
          // 30% van 390px is ~112px en dan blijft er van "Lat pulldown stang"
          // niets leesbaars over.
          gridTemplateColumns: isMobile ? 'minmax(0, 1fr) 1px 134px' : '70fr 1px 30fr',
          gap: isMobile ? '0.7rem' : '1rem',
          alignItems: 'stretch',
          padding: isMobile ? '0.8rem 1rem' : '0.9rem 1.5rem',
          paddingTop: media?.image_url ? undefined : `calc(env(safe-area-inset-top, 0px) + ${isMobile ? '0.875rem' : '1rem'})`,
        }}>
          <div style={{ minWidth: 0, alignSelf: 'center' }}>
            <h2 style={{ fontSize: isMobile ? '1.15rem' : '1.35rem', fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.025em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{exercise.name}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap', marginTop: '0.2rem', fontSize: isMobile ? '0.74rem' : '0.8rem', fontWeight: 800 }}>
              <span style={{ color: '#fff' }}>
                {loggedSets.length}/{exercise.sets}<span style={{ color: 'rgba(255,255,255,0.35)' }}> sets</span>
                <span style={{ color: 'rgba(255,255,255,0.25)' }}> · </span>
                {exercise.reps}<span style={{ color: 'rgba(255,255,255,0.35)' }}> reps</span>
              </span>
              {saving && <span style={{ color: '#FFD700' }}>· opslaan…</span>}
              {!saving && loggedSets.length > 0 && <span style={{ color: '#10b981' }}>· opgeslagen</span>}
              {editingIndex !== null && <span style={{ color: '#FFD700' }}>· set {editingIndex + 1} aanpassen</span>}
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.09)' }} />

          <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{
              fontSize: '0.6rem', fontWeight: 900, color: '#fff',
              textTransform: 'uppercase', letterSpacing: '0.08em',
            }}>
              Apparatuur
            </div>
            <AttachmentSelector
              compact
              suggested={exercise.suggested_attachment}
              value={attachmentUsed}
              onChange={(id) => { setAttachmentUsed(id); saveAttachmentPreference(id) }}
              isMobile={isMobile}
              exerciseName={exercise.name}
            />
            <MachineSettings
              compact
              value={machineSettings}
              onChange={(s) => { setMachineSettings(s); saveMachineSettings(s) }}
              previousSettings={previousMachineSettings}
              isMobile={isMobile}
              onSave={saveMachineSettings}
            />
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem 0' }}>
            <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,215,0,0.15)', borderTopColor: '#FFD700', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          </div>
        ) : (
          <>
            {/* ── VORIGE PRESTATIES ── */}
            {previousPerformance?.sets?.length > 0 && (
              <div style={{ padding: isMobile ? '0.625rem 1rem' : '0.75rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.015)' }}>
                <div style={{ fontSize: isMobile ? '0.66rem' : '0.72rem', fontWeight: 800, color: '#FFD700', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem', opacity: 0.85 }}>
                  Vorige sessie {previousPerformance.date ? `· ${new Date(previousPerformance.date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}` : ''}
                </div>
                <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                  {previousPerformance.sets.map((s, i) => (
                    <div key={i} style={{ padding: '0.25rem 0.5rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '5px', fontSize: isMobile ? '0.72rem' : '0.78rem', fontWeight: '700', color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                      <span style={{ color: 'rgba(255,215,0,0.6)' }}>{s.weight}</span>
                      <span style={{ color: 'rgba(255,255,255,0.2)' }}>kg</span>
                      <span style={{ color: 'rgba(255,255,255,0.2)', margin: '0 0.2rem' }}>×</span>
                      <span style={{ color: 'rgba(255,255,255,0.6)' }}>{s.reps}</span>
                      {s.partials > 0 && <span style={{ color: 'rgba(255,215,0,0.3)', fontSize: '0.8em' }}> +{s.partials}p</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {loggedSets.map((set, i) => (
              <LoggedSetRow key={i} set={set} index={i}
                onAddDropset={(idx) => { setDropsetIndex(idx); setShowWizard(false) }}
                onEdit={handleEditSet}  // ✅ nu gevuld
                onDelete={handleDeleteSet}
                isMobile={isMobile}
              />
            ))}

            {dropsetActive && <DropsetInput onSave={handleDropsetSave} onCancel={() => setDropsetIndex(null)} isMobile={isMobile} />}

            {wizardActive && (
              <SetInputWizard
                onComplete={handleSetComplete}
                onCancel={() => { setShowWizard(false); setEditingIndex(null) }}
                previousWeight={editingSet?.weight ?? lastSet?.weight ?? previousPerformance?.sets?.[previousPerformance.sets.length - 1]?.weight ?? 20}
                previousReps={editingSet?.reps ?? lastSet?.reps ?? previousPerformance?.sets?.[previousPerformance.sets.length - 1]?.reps ?? (parseInt(exercise.reps) || 10)}
                isMobile={isMobile}
                editMode={editingIndex !== null}
                snel={rustTimerAan && editingIndex === null}
              />
            )}

            {loggedSets.length === 0 && !wizardActive && (
              <div style={{ textAlign: 'center', padding: isMobile ? '3rem 1rem' : '4rem 1.25rem', color: 'rgba(255,255,255,0.2)' }}>
                <Dumbbell size={36} style={{ marginBottom: '0.75rem', opacity: 0.2 }} />
                <p style={{ fontSize: isMobile ? '0.8rem' : '0.85rem', fontWeight: '600', margin: 0 }}>Nog geen sets gelogd</p>
              </div>
            )}

            {/* Wat de coach bij deze oefening heeft voorgeschreven. Stond in het
                aparte infoscherm; die tabbladen zijn opgeheven en dit is het
                enige deel dat per oefening verschilde. */}
            {toonInfo && (
              <div style={{ padding: isMobile ? '0.75rem 1rem' : '0.875rem 1.25rem', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: '0.5rem' }}>
                  {[
                    { label: 'Sets', waarde: exercise.sets },
                    { label: 'Reps', waarde: exercise.reps },
                    { label: 'Rust', waarde: exercise.rust },
                    { label: 'Spiergroep', waarde: exercise.primairSpieren },
                    { label: 'Materiaal', waarde: exercise.equipment },
                    { label: 'RIR', waarde: exercise.rpe },
                  ].filter(r => r.waarde !== null && r.waarde !== undefined && r.waarde !== '').map(r => (
                    <div key={r.label} style={{
                      background: 'rgba(255,255,255,0.03)', borderRadius: 10,
                      padding: '0.5rem 0.6rem',
                    }}>
                      <div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{r.label}</div>
                      <div style={{ fontSize: isMobile ? '0.85rem' : '0.9rem', fontWeight: 800, color: '#fff', marginTop: 2, textTransform: 'capitalize' }}>{r.waarde}</div>
                    </div>
                  ))}
                </div>
                {exercise.notes && (
                  <div style={{ marginTop: '0.6rem', padding: '0.6rem 0.7rem', background: 'rgba(255,215,0,0.06)', border: '1px solid rgba(255,215,0,0.2)', borderRadius: 10 }}>
                    <div style={{ fontSize: '0.6rem', fontWeight: 800, color: '#FFD700', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Van je coach</div>
                    <div style={{ fontSize: isMobile ? '0.8rem' : '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.75)', lineHeight: 1.45, whiteSpace: 'pre-wrap' }}>{exercise.notes}</div>
                  </div>
                )}
              </div>
            )}

            {showExerciseNote && (
              <div style={{ padding: isMobile ? '0.75rem 1rem' : '0.875rem 1.25rem', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ fontSize: isMobile ? '0.66rem' : '0.72rem', color: '#FFD700', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem', opacity: 0.85 }}>Notitie bij oefening</div>
                <textarea value={exerciseNote} onChange={(e) => setExerciseNote(e.target.value)} onBlur={() => saveToDatabase(loggedSets)} placeholder="Bv. Schouder voelde stijf..." style={{ width: '100%', minHeight: '60px', padding: '0.6rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', color: '#fff', fontSize: isMobile ? '0.78rem' : '0.85rem', fontWeight: '500', resize: 'vertical', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
              </div>
            )}

            {showWorkoutNote && (
              <div style={{ padding: isMobile ? '0.75rem 1rem' : '0.875rem 1.25rem', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ fontSize: isMobile ? '0.66rem' : '0.72rem', color: '#FFD700', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem', opacity: 0.85 }}>Notitie bij workout dag</div>
                <textarea value={workoutNote} onChange={(e) => setWorkoutNote(e.target.value)} onBlur={saveWorkoutDayNote} placeholder="Bv. Slecht geslapen, weinig gegeten..." style={{ width: '100%', minHeight: '60px', padding: '0.6rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', color: '#fff', fontSize: isMobile ? '0.78rem' : '0.85rem', fontWeight: '500', resize: 'vertical', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
              </div>
            )}

            {/* ── ALLE SESSIES ── */}
            {showHistory && (
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <ExerciseHistory
                  exerciseName={exercise.name}
                  previousLog={null}
                  loading={false}
                  client={client}
                  db={db}
                  forceLoad={true}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* RUSTTIMER — boven de footer, zodat je je gelogde sets blijft zien */}
      {rust && !wizardActive && !dropsetActive && (
        <RustTimer
          oefeningNaam={exercise.name}
          startSec={rusttijd.sec}
          bron={rusttijd.bron}
          onKlaar={() => { /* de balk kleurt groen; doorgaan doet de klant zelf of via Volgende set */ }}
          onStop={volgendeSet}
          isMobile={isMobile}
        />
      )}

      {/* FOOTER */}
      {!wizardActive && !dropsetActive && (
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.06)',
          padding: isMobile ? '0.85rem 1rem' : '1rem 1.5rem',
          paddingBottom: `calc(env(safe-area-inset-bottom, 0px) + ${isMobile ? '0.85rem' : '1rem'})`,
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {/* Set Toevoegen — primaire CTA, gouden gradient pill conform CTA-token */}
            <button
              onClick={() => { setEditingIndex(null); setShowWizard(true) }}
              style={{
                flex: 1,
                padding: isMobile ? '0.85rem' : '1rem',
                background: 'linear-gradient(135deg, #FFD700 0%, #D4AF37 100%)',
                border: 'none',
                borderRadius: 14,
                color: '#0a0a0a',
                fontSize: isMobile ? '0.88rem' : '0.95rem',
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 8,
                minHeight: 54,
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                boxShadow: '0 10px 24px rgba(255,215,0,0.3), 0 2px 6px rgba(0,0,0,0.5)',
              }}
            >
              <Plus size={isMobile ? 20 : 22} strokeWidth={2.6} />
              Set Toevoegen
            </button>

            {/* Rusttimer — na elke set loopt je rusttijd en staat de volgende
                set daarna klaar. Naast de hoofdknop en niet erin: wie gewoon
                één set wil loggen moet daar geen timer bij krijgen. */}
            <button
              onClick={wisselRustTimer}
              aria-pressed={rustTimerAan}
              title={rustTimerAan ? 'Rusttimer uitzetten' : 'Rusttimer: na elke set loopt je rusttijd, daarna staat de volgende set klaar'}
              style={{
                flexShrink: 0,
                width: isMobile ? 96 : 118,
                background: rustTimerAan ? 'rgba(255,215,0,0.16)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${rustTimerAan ? 'rgba(255,215,0,0.55)' : 'rgba(255,255,255,0.12)'}`,
                borderRadius: 14,
                color: rustTimerAan ? '#FFD700' : 'rgba(255,255,255,0.75)',
                fontSize: isMobile ? '0.7rem' : '0.75rem',
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 3,
                minHeight: 54,
                fontFamily: 'inherit',
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              }}
            >
              <Timer size={isMobile ? 18 : 20} strokeWidth={2.4} />
              <span style={{ lineHeight: 1.15, textAlign: 'center' }}>Rust<br />timer</span>
            </button>
          </div>

          {/* Toggle-rij: 3 secundaire acties — groter font + grotere iconen */}
          <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.6rem' }}>
            <ToggleBtn
              active={toonInfo}
              onClick={() => setToonInfo(!toonInfo)}
              icon={<Info size={isMobile ? 13 : 14} strokeWidth={2.2} />}
              label="Info"
              isMobile={isMobile}
            />
            <ToggleBtn
              active={showExerciseNote}
              onClick={() => setShowExerciseNote(!showExerciseNote)}
              icon={<MessageSquare size={isMobile ? 13 : 14} strokeWidth={2.2} />}
              label="Notitie"
              isMobile={isMobile}
            />
            <ToggleBtn
              active={showWorkoutNote}
              onClick={() => setShowWorkoutNote(!showWorkoutNote)}
              icon={<Edit3 size={isMobile ? 13 : 14} strokeWidth={2.2} />}
              label="Dag-note"
              isMobile={isMobile}
            />
            <ToggleBtn
              active={showHistory}
              onClick={() => setShowHistory(!showHistory)}
              icon={<History size={isMobile ? 13 : 14} strokeWidth={2.2} />}
              label="Historie"
              isMobile={isMobile}
            />
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>,
    document.body
  )
}

// Secundaire toggle-knop in de footer-rij. Gouden tint wanneer actief,
// donker glass wanneer rust. Min-height 44 voor tap-targets.
function ToggleBtn({ active, onClick, icon, label, isMobile }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      style={{
        flex: 1,
        padding: isMobile ? '0.55rem 0.4rem' : '0.65rem 0.5rem',
        background: active ? 'rgba(255,215,0,0.12)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${active ? 'rgba(255,215,0,0.4)' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 10,
        color: active ? '#FFD700' : 'rgba(255,255,255,0.7)',
        fontSize: isMobile ? '0.66rem' : '0.72rem',
        fontWeight: 800,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 5,
        minHeight: 44,
        touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
        transition: 'background 0.15s ease, border-color 0.15s ease, color 0.15s ease',
      }}
    >
      {icon}
      {label}
    </button>
  )
}
