// src/modules/workout/components/todays-workout/components/ExerciseLogModal.jsx
import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, Plus, Dumbbell, CheckCircle, MoreVertical, MessageSquare, History, Play, Timer } from 'lucide-react'
import ExerciseHistory from './ExerciseHistory'
import AttachmentSelector from './AttachmentSelector'
import MachineSettings from './MachineSettings'
import BladModal from './BladModal'
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
  const [showExerciseNote, setShowExerciseNote] = useState(false)
  const [nieuweNotitie, setNieuweNotitie] = useState('')
  const [eerdereNotities, setEerdereNotities] = useState([])
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

  useEffect(() => { loadExistingLogs(); loadPreviousPerformance(); loadExercisePreference(); laadEerdereNotities() }, [])

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

  // Wat je bij deze oefening eerder opschreef. Handig precies op het moment
  // dat je een nieuwe notitie typt: "volgende keer smallere grip" heeft geen
  // zin als je 'm pas leest nadat je klaar bent.
  const laadEerdereNotities = async () => {
    if (!client?.id || !db) return
    try {
      const today = new Date().toISOString().split('T')[0]
      const { data: sessions } = await db.supabase
        .from('workout_sessions').select('id, workout_date')
        .eq('client_id', client.id).lt('workout_date', today)
        .order('workout_date', { ascending: false }).limit(20)
      if (!sessions?.length) return

      const { data: progress } = await db.supabase
        .from('workout_progress').select('session_id, notes')
        .in('session_id', sessions.map(s => s.id))
        .eq('exercise_name', exercise.name)
        .not('notes', 'is', null)
      if (!progress?.length) return

      const datumVan = new Map(sessions.map(s => [s.id, s.workout_date]))
      // Elke sessie kan meerdere notitieregels bevatten (één per regel, zoals
      // hierboven opgeslagen). Uitsplitsen, zodat de lijst per notitie leest
      // en niet per sessie.
      const uit = []
      progress.forEach(r => {
        const datum = datumVan.get(r.session_id)
        String(r.notes).split('\n').map(t => t.trim()).filter(Boolean).forEach(tekst => {
          uit.push({ datum, tekst })
        })
      })
      uit.sort((a, b) => (b.datum || '').localeCompare(a.datum || ''))
      setEerdereNotities(uit.slice(0, 12))
    } catch (e) { console.error('Eerdere notities laden mislukt:', e) }
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
      const { data: sessions } = await db.supabase.from('workout_sessions').select('id').eq('client_id', client.id).eq('workout_date', today)
      if (sessions?.length > 0) {
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

  // Puur een aan/uit-schakelaar. Aanzetten opende eerst meteen het
  // invoerscherm; dan kun je hem niet vooraf aanzetten zonder ook direct te
  // moeten loggen. Nu bepaalt de stand alleen of de klok na een set gaat
  // lopen — loggen doe je met de knop ernaast.
  const wisselRustTimer = () => {
    const nieuw = !rustTimerAan
    setRustTimerAan(nieuw)
    bewaarTimerAan(nieuw)
    if (!nieuw) setRust(false)   // uitzetten stopt ook een lopende rust
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

  // `notitie` expliciet meegeven waar het om de notitie gaat: setState is
  // asynchroon, dus vlak na een setExerciseNote staat de oude tekst nog in de
  // state en zou die worden opgeslagen.
  const saveToDatabase = async (sets, notitie = exerciseNote) => {
    if (!client?.id || !db) return
    setSaving(true)
    try {
      const setsData = sets.map(s => ({ weight: s.weight, reps: s.reps, partials: s.partials || 0, dropsets: s.dropsets || [] }))
      const progress = await db.saveQuickWorkoutLog(client.id, exercise.name, setsData, notitie || null)

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

  // Notities stapelen in plaats van overschrijven. Ze staan in één tekstveld
  // (workout_progress.notes), één per regel met de datum ervoor. Geen JSON:
  // dan leest de coach er straks accolades in plaats van zinnen.
  const bewaarNotitie = async () => {
    const tekst = nieuweNotitie.trim()
    if (!tekst || saving) return
    const datum = new Date().toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
    const regel = `${datum} · ${tekst}`
    const nieuw = exerciseNote ? `${exerciseNote}\n${regel}` : regel
    setExerciseNote(nieuw)
    setNieuweNotitie('')
    await saveToDatabase(loggedSets, nieuw)
  }

  // Elke regel is een notitie. Oude notities van vóór deze wijziging staan er
  // zonder datum in; die tonen we gewoon zoals ze zijn.
  const notities = (exerciseNote || '')
    .split('\n')
    .map(r => r.trim())
    .filter(Boolean)
    .reverse()

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
          // 60/40, maar op een telefoon met een bodem onder de rechterkolom:
          // een percentage van 390px valt daar te smal uit voor een naam als
          // "Lat pulldown stang".
          gridTemplateColumns: isMobile ? 'minmax(0, 1fr) 1px 150px' : '60fr 1px 40fr',
          gap: isMobile ? '0.7rem' : '1rem',
          alignItems: 'stretch',
          padding: isMobile ? '0.8rem 1rem' : '0.9rem 1.5rem',
          paddingTop: media?.image_url ? undefined : `calc(env(safe-area-inset-top, 0px) + ${isMobile ? '0.875rem' : '1rem'})`,
        }}>
          {/* Boven uitgelijnd, niet gecentreerd: de rechterkolom is twee knoppen
              hoog en dan zakt de titel weg naar het midden. */}
          <div style={{ minWidth: 0, alignSelf: 'flex-start' }}>
            {/* Titel mag over twee regels. Stond op één regel met puntjes,
                en dan las "Chest Supported Rear Delt Fly" als "Chest
                Supported Rear…" — precies het stuk dat zegt wélke fly. */}
            <h2 style={{
              fontSize: isMobile ? '1.1rem' : '1.3rem', fontWeight: 900, color: '#fff', margin: 0,
              letterSpacing: '-0.025em', lineHeight: 1.15,
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
              overflow: 'hidden', wordBreak: 'break-word',
            }}>{exercise.name}</h2>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.35rem', fontSize: isMobile ? '0.95rem' : '1.05rem', fontWeight: 900 }}>
              <span style={{ color: '#fff' }}>
                {loggedSets.length}/{exercise.sets}<span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.78em', fontWeight: 800 }}> sets</span>
                <span style={{ color: 'rgba(255,255,255,0.25)' }}> · </span>
                {exercise.reps}<span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.78em', fontWeight: 800 }}> reps</span>
                <span style={{ color: 'rgba(255,255,255,0.25)' }}> · </span>
                {/* De rusttijd die de timer ook gebruikt — uit het schema of
                    wat de klant er zelf van maakte. Hoort bij sets en reps:
                    het is het derde getal dat je voorschrijft. */}
                {Math.floor(rusttijd.sec / 60)}:{String(rusttijd.sec % 60).padStart(2, '0')}
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.78em', fontWeight: 800 }}> rust</span>
              </span>
              {saving && <span style={{ color: '#FFD700', fontSize: '0.72em' }}>opslaan…</span>}
              {!saving && loggedSets.length > 0 && <span style={{ color: '#10b981', fontSize: '0.72em' }}>opgeslagen</span>}
              {editingIndex !== null && <span style={{ color: '#FFD700', fontSize: '0.72em' }}>set {editingIndex + 1} aanpassen</span>}
            </div>

            {/* Historie hoort bij de cijfers: het is dezelfde oefening, alleen
                van vorige keren. Stond tussen de notitie-knoppen onderaan. */}
            <div style={{ display: 'flex', gap: 6, marginTop: '0.45rem', flexWrap: 'wrap' }}>
              {/* Stipje als er al een notitie staat: anders moet je 'm openen
                  om te weten dat je iets hebt opgeschreven. */}
              <Pil actief={showExerciseNote} onClick={() => setShowExerciseNote(!showExerciseNote)} icoon={<MessageSquare size={12} strokeWidth={2.4} />} label="Notitie" stip={!!exerciseNote} />
              <Pil actief={showHistory} onClick={() => setShowHistory(!showHistory)} icoon={<History size={12} strokeWidth={2.4} />} label="Historie" />
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.09)' }} />

          <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
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
            {/* Vorige sessie zonder vakjes: de getallen zijn de inhoud, en zeven
                omkaderde blokjes naast elkaar lezen als een rij knoppen terwijl
                je er niets mee doet. Dik wit voor wat je moet verslaan. */}
            {previousPerformance?.sets?.length > 0 && (
              <div style={{ padding: isMobile ? '0.7rem 1rem 0' : '0.8rem 1.25rem 0' }}>
                <div style={{
                  fontSize: '0.66rem', fontWeight: 900, color: '#fff',
                  textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.35rem',
                }}>
                  Vorige sessie
                  {previousPerformance.date && (
                    <span style={{ color: 'rgba(255,255,255,0.35)' }}>
                      {' · '}{new Date(previousPerformance.date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
                    </span>
                  )}
                </div>
                {/* Onder elkaar, met het setnummer ervoor: zo zie je in één
                    kolom of je zwaarder ging én of je de reps hield. Naast
                    elkaar moest je tellen welke set je voor je had. */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {previousPerformance.sets.map((s, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'baseline', gap: '0.5rem',
                      fontSize: isMobile ? '0.95rem' : '1.05rem', fontWeight: 900,
                      color: '#fff', fontVariantNumeric: 'tabular-nums',
                    }}>
                      <span style={{
                        fontSize: '0.68em', fontWeight: 800, color: 'rgba(255,255,255,0.4)',
                        minWidth: '3.1em',
                      }}>
                        Set {i + 1}
                      </span>
                      <span style={{ whiteSpace: 'nowrap' }}>
                        {s.weight}<span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.72em', fontWeight: 800 }}>kg</span>
                        <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.8em', margin: '0 0.18em' }}>×</span>
                        {s.reps}
                        {s.partials > 0 && <span style={{ color: 'rgba(255,215,0,0.7)', fontSize: '0.72em', fontWeight: 800 }}> +{s.partials}p</span>}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Zwevende actieknoppen, direct onder de vorige sessie. Stonden
                onderaan het scherm; met een paar sets erin scrolde je heen en
                weer tussen wat je net logde en de knop om verder te gaan. */}
            {/* Tijdens de rust staat de timer op de plek van de knoppen, dus
                direct onder de vorige sessie en direct bóven je gelogde sets.
                Stond onderaan het scherm; dan kijk je naar de klok terwijl de
                set die je net logde ergens erboven verschijnt. */}
            {rust && (
              <div style={{ padding: isMobile ? '0.8rem 1rem 0.2rem' : '0.9rem 1.25rem 0.3rem' }}>
                <RustTimer
                  oefeningNaam={exercise.name}
                  startSec={rusttijd.sec}
                  bron={rusttijd.bron}
                  onKlaar={() => {}}
                  onStop={volgendeSet}
                  isMobile={isMobile}
                />
              </div>
            )}

            {!rust && (
              <div style={{
                display: 'flex', gap: '0.5rem',
                padding: isMobile ? '0.8rem 1rem' : '0.9rem 1.25rem',
              }}>
                <button
                  onClick={() => { setEditingIndex(null); setShowWizard(true) }}
                  style={{
                    flex: 1, minHeight: 52, padding: '0 1rem',
                    background: '#fff', border: '1px solid #fff', borderRadius: 14,
                    color: '#0a0a0a', fontSize: isMobile ? '0.88rem' : '0.95rem',
                    fontWeight: 900, letterSpacing: '-0.01em',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    cursor: 'pointer', fontFamily: 'inherit',
                    boxShadow: '0 10px 24px rgba(0,0,0,0.45)',
                    touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  <Plus size={isMobile ? 19 : 21} strokeWidth={2.8} />
                  Set toevoegen
                </button>

                {/* Rusttimer als schuifknop: je ziet de stand zonder erop te
                    drukken. Was een knop die alleen omkeerde als hij aanstond,
                    en dan is het raden of dat "aan" of "uit" betekent. */}
                <button
                  onClick={wisselRustTimer}
                  role="switch"
                  aria-checked={rustTimerAan}
                  title={rustTimerAan ? 'Rusttimer staat aan' : 'Rusttimer staat uit'}
                  style={{
                    flexShrink: 0, width: isMobile ? 96 : 118, minHeight: 52,
                    background: 'transparent',
                    border: `1px solid ${rustTimerAan ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.15)'}`,
                    borderRadius: 14,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
                    cursor: 'pointer', fontFamily: 'inherit',
                    touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  <span style={{
                    fontSize: '0.6rem', fontWeight: 900, letterSpacing: '0.05em',
                    textTransform: 'uppercase', whiteSpace: 'nowrap',
                    color: rustTimerAan ? '#fff' : 'rgba(255,255,255,0.5)',
                  }}>
                    Rust timer
                  </span>
                  <span style={{
                    position: 'relative', display: 'block',
                    width: 40, height: 22, borderRadius: 999, flexShrink: 0,
                    background: rustTimerAan ? '#fff' : 'rgba(255,255,255,0.12)',
                    border: `1px solid ${rustTimerAan ? '#fff' : 'rgba(255,255,255,0.2)'}`,
                    transition: 'background 0.18s ease',
                  }}>
                    <span style={{
                      position: 'absolute', top: 2, left: rustTimerAan ? 20 : 2,
                      width: 16, height: 16, borderRadius: '50%',
                      background: rustTimerAan ? '#0a0a0a' : 'rgba(255,255,255,0.6)',
                      transition: 'left 0.18s cubic-bezier(0.4,0,0.2,1), background 0.18s ease',
                    }} />
                  </span>
                </button>
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

          </>
        )}
      </div>

      {/* Notitie en historie als blad, net als de machine-instellingen. Ze
          stonden als paneel tussen de gelogde sets; dan duwt het openklappen
          precies weg waar je naar kijkt. */}
      <BladModal open={showExerciseNote} titel="Notities bij deze oefening" onClose={() => setShowExerciseNote(false)}>
        {/* Typen, rechts opslaan, en de notitie zakt naar de lijst eronder.
            Het veld is dan weer leeg voor de volgende. Eén tekstveld dat je
            elke keer overschrijft wist wat je vorige week opschreef. */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
          <textarea
            value={nieuweNotitie}
            onChange={(e) => setNieuweNotitie(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) bewaarNotitie() }}
            placeholder="Bv. schouder voelde stijf, volgende keer smallere grip…"
            autoFocus
            rows={3}
            style={{
              flex: 1, minWidth: 0, padding: '0.7rem',
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 10, color: '#fff', fontSize: '0.9rem', fontWeight: 600,
              resize: 'vertical', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
              lineHeight: 1.5,
            }}
          />
          <button
            onClick={bewaarNotitie}
            disabled={!nieuweNotitie.trim() || saving}
            style={{
              flexShrink: 0, width: 88,
              background: nieuweNotitie.trim() ? '#fff' : 'rgba(255,255,255,0.06)',
              border: `1px solid ${nieuweNotitie.trim() ? '#fff' : 'rgba(255,255,255,0.12)'}`,
              borderRadius: 10,
              color: nieuweNotitie.trim() ? '#0a0a0a' : 'rgba(255,255,255,0.3)',
              fontSize: '0.82rem', fontWeight: 900, fontFamily: 'inherit',
              cursor: nieuweNotitie.trim() && !saving ? 'pointer' : 'not-allowed',
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            }}
          >
            {saving ? '…' : 'Opslaan'}
          </button>
        </div>

        {notities.length > 0 && (
          <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column' }}>
            {notities.map((n, i) => (
              <div key={i} style={{
                padding: '0.6rem 0',
                borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.07)',
                fontSize: '0.88rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)',
                lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              }}>
                {n}
              </div>
            ))}
          </div>
        )}

        {eerdereNotities.length > 0 && (
          <div style={{ marginTop: '1.1rem', paddingTop: '0.9rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{
              fontSize: '0.66rem', fontWeight: 900, color: '#fff',
              textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem',
            }}>
              Eerdere trainingen
            </div>
            {eerdereNotities.map((n, i) => (
              <div key={i} style={{ padding: '0.5rem 0', borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: '0.66rem', fontWeight: 800, color: 'rgba(255,255,255,0.35)' }}>
                  {n.datum ? new Date(`${n.datum}T00:00:00`).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }) : ''}
                </div>
                <div style={{
                  fontSize: '0.86rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)',
                  lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word', marginTop: 1,
                }}>
                  {n.tekst}
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: '0.8rem', fontSize: '0.7rem', fontWeight: 600, color: 'rgba(255,255,255,0.4)' }}>
          Je coach ziet deze notities bij deze oefening.
        </div>
      </BladModal>

      <BladModal open={showHistory} titel={`Historie · ${exercise.name}`} onClose={() => setShowHistory(false)}>
        <ExerciseHistory
          exerciseName={exercise.name}
          previousLog={null}
          loading={false}
          client={client}
          db={db}
          forceLoad={true}
        />
      </BladModal>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>,
    document.body
  )
}

// Klein pilletje onder de cijfers. Vervangt de knoppenrij onderaan het
// scherm: die nam een hele band in beslag voor twee dingen die je af en toe
// opentikt.
function Pil({ actief, onClick, icoon, label, stip = false }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={actief}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '0.3rem 0.6rem 0.3rem 0.5rem',
        background: actief ? 'rgba(255,255,255,0.1)' : 'transparent',
        border: `1px solid ${actief ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.15)'}`,
        borderRadius: 999, color: '#fff',
        fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.02em',
        cursor: 'pointer', fontFamily: 'inherit',
        touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
      }}
    >
      {icoon}
      {label}
      {stip && <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#FFD700', flexShrink: 0 }} />}
    </button>
  )
}
