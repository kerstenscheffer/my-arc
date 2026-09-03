// src/modules/public-intake/components/WeekBuilder/WeekBuilder.jsx
// Week Builder v6.0 — volledig herschreven, correcte multi-baan logica

import React, { useState, useCallback } from 'react'
import WeekCalendar from './WeekCalendar'
import { DAYS, DAY_LABELS } from './useWeekBuilder'

// ── Constanten ────────────────────────────────────────────────────────────────

const SLEEP_OPTIONS = ['21:00','22:00','23:00','00:00','01:00','02:00']
const WAKE_OPTIONS  = ['05:00','06:00','07:00','08:00','09:00','10:00']
const START_OPTIONS = ['06:00','07:00','08:00','09:00','10:00','11:00','12:00']
const END_OPTIONS   = ['13:00','14:00','14:45','15:00','16:00','17:00','18:00','19:00','20:00','21:00','22:00','23:00']

const WORK_TYPES = [
  { id: 'kantoor', label: 'Kantoor of thuis',  color: '#3B82F6' },
  { id: 'horeca',  label: 'Horeca',            color: '#F97316' },
  { id: 'fysiek',  label: 'Fysiek werk',       color: '#10B981' },
  { id: 'winkel',  label: 'Winkel',            color: '#EC4899' },
  { id: 'anders',  label: 'Anders',            color: '#6B7280' },
]

// ── UI Primitieven ────────────────────────────────────────────────────────────

function Q({ children, isMobile }) {
  return (
    <div style={{ fontSize: isMobile ? '1.15rem' : '1.25rem', fontWeight: 800, color: '#fff', lineHeight: 1.3, marginBottom: '0.6rem' }}>
      {children}
    </div>
  )
}

function Hint({ children, isMobile }) {
  return (
    <div style={{ fontSize: isMobile ? '0.72rem' : '0.75rem', color: 'rgba(255,255,255,0.3)', fontWeight: 500, lineHeight: 1.5, marginBottom: '0.5rem', marginTop: '-0.3rem' }}>
      {children}
    </div>
  )
}

// Eigen terugkerende blokken: dingen die de knoppenreeks niet vangt, zoals
// "yoga vrijdag 10:00-11:00". Ze gaan als gewone blokken het week_schedule in,
// zodat ze meetellen bij het bepalen wanneer iemand kan trainen.
const DAG_LABELS = { ma: 'Maandag', di: 'Dinsdag', wo: 'Woensdag', do: 'Donderdag', vr: 'Vrijdag', za: 'Zaterdag', zo: 'Zondag' }
const eigenVeld = (isMobile) => ({
  padding: isMobile ? '0.7rem 0.8rem' : '0.75rem 0.9rem',
  background: '#0d0d0d',
  border: '1px solid rgba(255,255,255,0.1)',
  color: '#fff',
  fontSize: isMobile ? '0.85rem' : '0.9rem',
  fontWeight: 600, fontFamily: 'inherit', outline: 'none',
  minHeight: 44, boxSizing: 'border-box',
})

function BackBtn({ onBack }) {
  if (!onBack) return null
  return (
    <button onClick={onBack} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.25)', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', padding: '0.1rem 0', marginBottom: '0.4rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
      ← Terug
    </button>
  )
}

function NextBtn({ onClick, label = 'VOLGENDE →', disabled, isMobile }) {
  return (
    <button
      onClick={disabled ? null : onClick}
      style={{
        width: '100%', padding: isMobile ? '0.85rem' : '0.9rem',
        background: disabled ? 'rgba(255,215,0,0.04)' : 'linear-gradient(90deg, #FFD700, #FFA500)',
        border: disabled ? '1px solid rgba(255,215,0,0.1)' : 'none',
        borderRadius: '8px',
        color: disabled ? 'rgba(255,215,0,0.2)' : '#000',
        fontSize: isMobile ? '0.85rem' : '0.9rem', fontWeight: 800,
        cursor: disabled ? 'default' : 'pointer', fontFamily: 'inherit',
        letterSpacing: '0.02em', marginTop: '0.5rem',
        touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
        transition: 'all 0.2s ease'
      }}
      onTouchStart={e => { if (!disabled) e.currentTarget.style.transform = 'scale(0.98)' }}
      onTouchEnd={e => { e.currentTarget.style.transform = 'scale(1)' }}
    >
      {label}
    </button>
  )
}

function BigOption({ label, sub, onClick, selected, isMobile }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', padding: isMobile ? '0.85rem 1rem' : '0.95rem 1rem',
      background: selected ? 'rgba(255,215,0,0.07)' : '#0d0d0d',
      border: `1px solid ${selected ? 'rgba(255,215,0,0.35)' : 'rgba(255,255,255,0.07)'}`,
      borderLeft: selected ? '3px solid #FFD700' : '1px solid rgba(255,255,255,0.07)',
      borderRadius: selected ? '0 8px 8px 0' : '8px',
      cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
      display: 'flex', alignItems: 'center', gap: '0.75rem',
      touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
      transition: 'all 0.15s ease'
    }}>
      <div style={{ width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0, border: `2px solid ${selected ? '#FFD700' : 'rgba(255,255,255,0.15)'}`, background: selected ? '#FFD700' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {selected && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#000' }} />}
      </div>
      <div>
        <div style={{ fontSize: isMobile ? '0.85rem' : '0.9rem', fontWeight: 700, color: selected ? '#FFD700' : 'rgba(255,255,255,0.85)', lineHeight: 1.25 }}>{label}</div>
        {sub && <div style={{ fontSize: isMobile ? '0.65rem' : '0.68rem', color: 'rgba(255,255,255,0.3)', fontWeight: 500, marginTop: '0.2rem' }}>{sub}</div>}
      </div>
    </button>
  )
}

function DayPicker({ selected, onToggle, disabledDays = [], isMobile }) {
  return (
    <div style={{ display: 'flex', gap: '0.2rem' }}>
      {DAYS.map(day => {
        const isSelected = selected.includes(day)
        const isDisabled = disabledDays.includes(day)
        return (
          <button key={day} onClick={() => { if (!isDisabled) onToggle(day) }} style={{
            flex: 1, padding: isMobile ? '0.55rem 0' : '0.6rem 0',
            background: isSelected ? 'rgba(255,215,0,0.1)' : '#0d0d0d',
            border: `${isSelected ? '2px' : '1px'} solid ${isSelected ? 'rgba(255,215,0,0.5)' : 'rgba(255,255,255,0.07)'}`,
            borderRadius: '8px',
            color: isSelected ? '#FFD700' : isDisabled ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.35)',
            fontSize: isMobile ? '0.75rem' : '0.8rem', fontWeight: isSelected ? 800 : 600,
            cursor: isDisabled ? 'default' : 'pointer', fontFamily: 'inherit',
            position: 'relative', overflow: 'hidden',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            transition: 'all 0.15s ease', minHeight: '44px'
          }}>
            {DAY_LABELS[day]}
            {isDisabled && (
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'repeating-linear-gradient(135deg, transparent, transparent 4px, rgba(255,255,255,0.05) 4px, rgba(255,255,255,0.05) 5px)' }} />
            )}
          </button>
        )
      })}
    </div>
  )
}

function WorkTypePicker({ value, onChange, isMobile }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
      {WORK_TYPES.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)} style={{
          padding: isMobile ? '0.7rem 1rem' : '0.75rem 1rem',
          background: value === t.id ? 'rgba(255,215,0,0.07)' : '#0d0d0d',
          border: `1px solid ${value === t.id ? 'rgba(255,215,0,0.35)' : 'rgba(255,255,255,0.07)'}`,
          borderLeft: value === t.id ? `3px solid ${t.color}` : '1px solid rgba(255,255,255,0.07)',
          borderRadius: value === t.id ? '0 8px 8px 0' : '8px',
          cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          transition: 'all 0.15s ease'
        }}>
          <span style={{ fontSize: isMobile ? '0.85rem' : '0.9rem', fontWeight: value === t.id ? 800 : 600, color: value === t.id ? '#FFD700' : 'rgba(255,255,255,0.75)' }}>
            {value === t.id && '✓ '}{t.label}
          </span>
        </button>
      ))}
    </div>
  )
}

// Tijdgrid met dubbel-select
function TimeGrid({ options, value, value2, onChange, onChange2, isMobile }) {
  const [showCustom, setShowCustom] = useState(false)
  const isCustom = value && !options.includes(value)

  const handleClick = (t) => {
    if (!value) { onChange(t); onChange2(null); return }
    if (value === t && !value2) { onChange(null); onChange2(null); return }
    if (value2 && value2 === t) { onChange2(null); return }
    if (value2 && value === t) { onChange(value2); onChange2(null); return }
    if (!value2) { onChange2(t); return }
    onChange(t); onChange2(null)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      {value && !value2 && (
        <div style={{ fontSize: isMobile ? '0.7rem' : '0.72rem', color: 'rgba(255,215,0,0.5)', fontWeight: 600 }}>
          Weet je het niet precies? Klik er nog één aan.
        </div>
      )}
      {value && value2 && (
        <div style={{ fontSize: isMobile ? '0.72rem' : '0.76rem', color: '#10b981', fontWeight: 800 }}>
          ✓ {value} – {value2}
        </div>
      )}
      <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
        {options.map(t => {
          const sel = value === t || value2 === t
          return (
            <button key={t} onClick={() => handleClick(t)} style={{
              padding: isMobile ? '0.55rem 0.6rem' : '0.6rem 0.7rem',
              background: sel ? 'rgba(255,215,0,0.1)' : '#0d0d0d',
              border: `${sel ? '2px' : '1px'} solid ${sel ? 'rgba(255,215,0,0.5)' : 'rgba(255,255,255,0.07)'}`,
              borderRadius: '8px', color: sel ? '#FFD700' : 'rgba(255,255,255,0.45)',
              fontSize: isMobile ? '0.9rem' : '0.95rem', fontWeight: sel ? 800 : 600,
              cursor: 'pointer', fontFamily: 'inherit',
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              transition: 'all 0.15s ease', minHeight: '48px', minWidth: isMobile ? '60px' : '68px'
            }}>{t}</button>
          )
        })}
        <button onClick={() => setShowCustom(v => !v)} style={{
          padding: isMobile ? '0.55rem 0.6rem' : '0.6rem 0.7rem',
          background: (showCustom || isCustom) ? 'rgba(255,215,0,0.08)' : '#0d0d0d',
          border: `1px solid ${(showCustom || isCustom) ? 'rgba(255,215,0,0.35)' : 'rgba(255,255,255,0.07)'}`,
          borderRadius: '8px', color: (showCustom || isCustom) ? '#FFD700' : 'rgba(255,255,255,0.3)',
          fontSize: isMobile ? '0.8rem' : '0.85rem', fontWeight: 600,
          cursor: 'pointer', fontFamily: 'inherit',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: '48px'
        }}>
          {isCustom ? value : 'Anders'}
        </button>
      </div>
      {(showCustom || isCustom) && (
        <input type="time" value={isCustom ? value : ''} onChange={e => { onChange(e.target.value); onChange2(null) }} style={{ background: '#0d0d0d', border: '1px solid rgba(255,215,0,0.25)', borderRadius: '8px', color: '#FFD700', fontSize: isMobile ? '1rem' : '1.1rem', fontWeight: 800, padding: '0.6rem 0.75rem', fontFamily: 'inherit', outline: 'none', width: '100%', boxSizing: 'border-box', minHeight: '48px' }} autoFocus />
      )}
    </div>
  )
}

// ── Hoofd Component ───────────────────────────────────────────────────────────

export default function WeekBuilder({ data, onChange, onComplete, onBack, isMobile }) {

  // ── Navigatie ──
  const [step,    setStep]    = useState('sleep_time')
  const [history, setHistory] = useState([])
  const [saved,   setSaved]   = useState(false)
  const [eigenBlokken, setEigenBlokken] = useState(data.eigen_blokken || [])
  const [nieuwBlok, setNieuwBlok] = useState({ naam: '', dag: 'ma', start: '', eind: '' })
  const [toelichting, setToelichting] = useState(data.agenda_toelichting || '')

  const go = (next) => { setHistory(h => [...h, step]); setStep(next) }
  const goBack = () => {
    if (!history.length) return
    setStep(history[history.length - 1])
    setHistory(h => h.slice(0, -1))
  }

  // ── Slaap ──
  const [sleepTime,   setSleepTime]   = useState(null)
  const [sleepTime2,  setSleepTime2]  = useState(null)
  const [wakeTime,    setWakeTime]    = useState(null)
  const [wakeTime2,   setWakeTime2]   = useState(null)
  const [weekendDiff, setWeekendDiff] = useState(null)
  const [sleepWknd,   setSleepWknd]   = useState(null)
  const [sleepWknd2,  setSleepWknd2]  = useState(null)
  const [wakeWknd,    setWakeWknd]    = useState(null)
  const [wakeWknd2,   setWakeWknd2]   = useState(null)

  // ── Banen ──
  const [numJobs,  setNumJobs]  = useState(null) // 0 | 1 | 'meer'
  const [jobTypes, setJobTypes] = useState([])   // [{ id, label, color }]

  // ── Werk per baan ──
  // savedJobs: array van afgeronde banen [{ type, days, groups:[{days,start,end}] }]
  const [savedJobs,    setSavedJobs]    = useState([])
  const [currentJobIdx, setCurrentJobIdx] = useState(0)

  // State voor de baan die nu ingevuld wordt
  const [workDays,    setWorkDays]    = useState([])
  const [allSameDays, setAllSameDays] = useState(null)
  // Groepen binnen de huidige baan: [{ days, type, start, start2, end, end2 }]
  const [jobGroups,   setJobGroups]   = useState([])
  // Groep die nu ingevuld wordt
  const [grpDays,     setGrpDays]     = useState([])
  const [grpStart,    setGrpStart]    = useState(null)
  const [grpStart2,   setGrpStart2]   = useState(null)
  const [grpEnd,      setGrpEnd]      = useState(null)
  const [grpEnd2,     setGrpEnd2]     = useState(null)
  // Voor more_groups: selectie van volgende groep dagen
  const [moreGrpSel,  setMoreGrpSel]  = useState([])

  // ── Training ──
  const [trainingDays, setTrainingDays] = useState(data?.preferred_training_days || [])
  const [trainingTime, setTrainingTime] = useState(data?.training_time || null)

  // ── Helpers ──
  const toggleWorkDay   = d => setWorkDays(p => p.includes(d) ? p.filter(x => x !== d) : [...p, d])
  const toggleGrpDay    = d => setGrpDays(p => p.includes(d) ? p.filter(x => x !== d) : [...p, d])
  const toggleMoreSel   = d => setMoreGrpSel(p => p.includes(d) ? p.filter(x => x !== d) : [...p, d])
  const toggleTraining  = d => setTrainingDays(p => p.includes(d) ? p.filter(x => x !== d) : [...p, d])

  const currentJob = jobTypes[currentJobIdx] || null

  // Alle al ingedeelde dagen binnen de huidige baan
  const assignedInCurrentJob = jobGroups.flatMap(g => g.days)
  const unassignedInCurrentJob = workDays.filter(d => !assignedInCurrentJob.includes(d))

  // Sla huidige groep op en return nieuwe groepen
  const saveCurrentGroup = () => {
    const grp = {
      days: grpDays,
      type: currentJob?.id || 'kantoor',
      start: grpStart, start2: grpStart2,
      end: grpEnd,     end2: grpEnd2
    }
    const newGroups = [...jobGroups, grp]
    setJobGroups(newGroups)
    setGrpDays([])
    setGrpStart(null); setGrpStart2(null)
    setGrpEnd(null);   setGrpEnd2(null)
    return newGroups
  }

  // Sla huidige baan op en reset voor volgende baan
  const saveCurrentJobAndNext = (finalGroups) => {
    const job = { type: currentJob?.id, days: workDays, groups: finalGroups }
    const newSaved = [...savedJobs, job]
    setSavedJobs(newSaved)

    const nextIdx = currentJobIdx + 1
    const hasNextJob = numJobs === 'meer' && nextIdx < jobTypes.length

    if (hasNextJob) {
      // Reset werk-state voor volgende baan
      setCurrentJobIdx(nextIdx)
      setWorkDays([])
      setAllSameDays(null)
      setJobGroups([])
      setGrpDays([])
      setGrpStart(null); setGrpStart2(null)
      setGrpEnd(null);   setGrpEnd2(null)
      setMoreGrpSel([])
      go('work_days')
    } else {
      go('training_days')
    }
    return newSaved
  }

  // ── Schedule builder (live preview) ──
  const buildSchedule = useCallback(() => {
    const result = {}
    DAYS.forEach(day => {
      const blocks = []
      const isWeekend = day === 'za' || day === 'zo'

      // Slaap
      const sStart = isWeekend && weekendDiff === 'yes' && sleepWknd ? sleepWknd : sleepTime
      const sEnd   = isWeekend && weekendDiff === 'yes' && wakeWknd  ? wakeWknd  : wakeTime
      if (sStart && sEnd) blocks.push({ type: 'slaap', start: sStart, end: sEnd })

      // Werk — alle afgeronde banen + huidige baan in progress
      const allGroups = [
        ...savedJobs.flatMap(j => j.groups),
        ...jobGroups
      ]
      allGroups.filter(g => g.days.includes(day)).forEach(grp => {
        if (grp.start && grp.end) {
          blocks.push({ type: grp.type || 'kantoor', start: grp.start, end: grp.end })
        }
      })

      // Training
      if (trainingDays.includes(day) && trainingTime) {
        const [h, m] = trainingTime.split(':').map(Number)
        const endMin = (h * 60 + m + 75) % 1440
        const endTime = `${String(Math.floor(endMin / 60)).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`
        blocks.push({ type: 'training', start: trainingTime, end: endTime })
      }

      blocks.sort((a, b) => !a.start ? 1 : !b.start ? -1 : a.start.localeCompare(b.start))
      result[day] = blocks
    })
    return result
  }, [sleepTime, wakeTime, weekendDiff, sleepWknd, wakeWknd, savedJobs, jobGroups, trainingDays, trainingTime])

  const handleFinish = () => {
    const week_schedule = buildSchedule()
    const st = sleepTime || '23:00'
    const wt = wakeTime  || '07:00'
    const [sh, sm] = st.split(':').map(Number)
    const [wh, wm] = wt.split(':').map(Number)
    const diff = (wh * 60 + wm) > (sh * 60 + sm)
      ? (wh * 60 + wm) - (sh * 60 + sm)
      : 1440 - (sh * 60 + sm) + (wh * 60 + wm)
    // Het antwoord op "Wat voor werk doe je?" ging alleen het week_schedule in
    // als `type` op de werkblokken, en werd nergens als los antwoord bewaard.
    // Daardoor bleef clients.job_type leeg en stond de vraag in de coach-intake
    // altijd op "niet ingevuld". Bij meerdere banen alle labels, gescheiden
    // door een komma.
    const baanLabels = (savedJobs.length ? savedJobs.map(j => j.type) : jobTypes.map(j => j?.id))
      .filter(Boolean)
      .map(id => WORK_TYPES.find(w => w.id === id)?.label || id)
    const uniekeBanen = [...new Set(baanLabels)]

    // Eigen blokken als gewone blokken in het weekschema. Daardoor tellen ze
    // mee bij het bepalen wanneer iemand kan trainen — anders zijn het losse
    // notities die niemand meeneemt. type 'anders' zodat bestaande lezers
    // (agenda, intake-modal) er niet over struikelen.
    const week_schedule_met_eigen = { ...week_schedule }
    ;(eigenBlokken || []).forEach(b => {
      if (!b?.dag || !b.start || !b.eind) return
      const dag = week_schedule_met_eigen[b.dag] ? [...week_schedule_met_eigen[b.dag]] : []
      dag.push({ type: 'anders', label: b.naam, start: b.start, end: b.eind })
      week_schedule_met_eigen[b.dag] = dag
    })

    const result = {
      week_schedule: week_schedule_met_eigen,
      eigen_blokken: eigenBlokken || [],
      agenda_toelichting: toelichting || null,
      job_type: uniekeBanen.length ? uniekeBanen.join(', ') : null,
      preferred_training_days: trainingDays,
      training_time: trainingTime || null,
      sleep_time: st, wake_time: wt,
      sleep_hours: Math.round(diff / 60 * 10) / 10
    }
    onChange(result)
    onComplete(result)
    setSaved(true)
  }

  // ── Progress sectie bepalen ──
  const getSection = () => {
    const slaapSteps = ['sleep_time','wake_time','weekend_diff','weekend_sleep','weekend_wake']
    const werkSteps  = ['num_jobs','job_type_1','job_type_2','job_type_more','job_type_3','work_days','all_same','grp_days','grp_start','grp_end','more_groups','training_days']
    if (slaapSteps.includes(step)) return 0
    if (werkSteps.includes(step))  return 1
    return 2
  }

  const schedule = buildSchedule()
  const SECTION_LABELS = ['Slaap', 'Werk', 'Training']
  const section = getSection()

  // ── Stap renderer ──────────────────────────────────────────────────────────

  const renderStep = () => {

    // ── SLAAP ────────────────────────────────────────────────────────────────

    if (step === 'sleep_time') return (
      <>
        {/* Eerste stap van de weekagenda: terug betekent hier de vórige vraag
            uit het leefstijl-blok, niet een stap binnen de agenda. */}
        <BackBtn onBack={onBack} />
        <Q isMobile={isMobile}>Hoe laat ga je slapen?</Q>
        <TimeGrid options={SLEEP_OPTIONS} value={sleepTime} value2={sleepTime2} onChange={setSleepTime} onChange2={setSleepTime2} isMobile={isMobile} />
        <NextBtn onClick={() => go('wake_time')} disabled={!sleepTime} isMobile={isMobile} />
      </>
    )

    if (step === 'wake_time') return (
      <>
        <BackBtn onBack={goBack} />
        <Q isMobile={isMobile}>Hoe laat sta je op?</Q>
        <TimeGrid options={WAKE_OPTIONS} value={wakeTime} value2={wakeTime2} onChange={setWakeTime} onChange2={setWakeTime2} isMobile={isMobile} />
        <NextBtn onClick={() => go('weekend_diff')} disabled={!wakeTime} isMobile={isMobile} />
      </>
    )

    if (step === 'weekend_diff') return (
      <>
        <BackBtn onBack={goBack} />
        <Q isMobile={isMobile}>Slaap je in het weekend anders?</Q>
        <BigOption label="Nee, altijd hetzelfde" onClick={() => { setWeekendDiff('no'); go('num_jobs') }} selected={weekendDiff === 'no'} isMobile={isMobile} />
        <BigOption label="Ja, in het weekend slaap ik later" onClick={() => { setWeekendDiff('yes'); go('weekend_sleep') }} selected={weekendDiff === 'yes'} isMobile={isMobile} />
      </>
    )

    if (step === 'weekend_sleep') return (
      <>
        <BackBtn onBack={goBack} />
        <Q isMobile={isMobile}>Hoe laat ga je in het weekend slapen?</Q>
        <TimeGrid options={SLEEP_OPTIONS} value={sleepWknd} value2={sleepWknd2} onChange={setSleepWknd} onChange2={setSleepWknd2} isMobile={isMobile} />
        <NextBtn onClick={() => go('weekend_wake')} disabled={!sleepWknd} isMobile={isMobile} />
      </>
    )

    if (step === 'weekend_wake') return (
      <>
        <BackBtn onBack={goBack} />
        <Q isMobile={isMobile}>Hoe laat sta je in het weekend op?</Q>
        <TimeGrid options={WAKE_OPTIONS} value={wakeWknd} value2={wakeWknd2} onChange={setWakeWknd} onChange2={setWakeWknd2} isMobile={isMobile} />
        <NextBtn onClick={() => go('num_jobs')} disabled={!wakeWknd} isMobile={isMobile} />
      </>
    )

    // ── BANEN ─────────────────────────────────────────────────────────────────

    if (step === 'num_jobs') return (
      <>
        <BackBtn onBack={goBack} />
        <Q isMobile={isMobile}>Hoeveel banen heb je?</Q>
        <BigOption label="Ik heb één baan" onClick={() => { setNumJobs(1); go('job_type_1') }} selected={numJobs === 1} isMobile={isMobile} />
        <BigOption label="Ik heb meerdere banen" sub="Bijv. een dagbaan én een bijbaan" onClick={() => { setNumJobs('meer'); go('job_type_1') }} selected={numJobs === 'meer'} isMobile={isMobile} />
        <BigOption label="Ik heb geen baan" sub="Student, gepensioneerd of anders" onClick={() => { setNumJobs(0); go('training_days') }} selected={numJobs === 0} isMobile={isMobile} />
      </>
    )

    if (step === 'job_type_1') return (
      <>
        <BackBtn onBack={goBack} />
        <Q isMobile={isMobile}>{numJobs === 'meer' ? 'Baan 1 — wat voor werk is dat?' : 'Wat voor werk doe je?'}</Q>
        <WorkTypePicker value={jobTypes[0]?.id || null} onChange={v => {
          const t = WORK_TYPES.find(x => x.id === v)
          const updated = [t]
          setJobTypes(updated)
          setCurrentJobIdx(0)
          numJobs === 'meer' ? go('job_type_2') : go('work_days')
        }} isMobile={isMobile} />
      </>
    )

    if (step === 'job_type_2') return (
      <>
        <BackBtn onBack={goBack} />
        <Q isMobile={isMobile}>Baan 2 — wat voor werk is dat?</Q>
        <WorkTypePicker value={jobTypes[1]?.id || null} onChange={v => {
          const t = WORK_TYPES.find(x => x.id === v)
          const updated = [...jobTypes.slice(0, 1), t]
          setJobTypes(updated)
          go('job_type_more')
        }} isMobile={isMobile} />
      </>
    )

    if (step === 'job_type_more') return (
      <>
        <BackBtn onBack={goBack} />
        <Q isMobile={isMobile}>Nog een derde baan?</Q>
        <BigOption
          label={`Nee — ${jobTypes.filter(Boolean).map(j => j.label).join(' + ')}`}
          sub="Dit zijn alle banen"
          onClick={() => go('work_days')}
          selected={false} isMobile={isMobile}
        />
        <BigOption label="Ja, ik heb ook nog een derde baan" onClick={() => go('job_type_3')} selected={false} isMobile={isMobile} />
      </>
    )

    if (step === 'job_type_3') return (
      <>
        <BackBtn onBack={goBack} />
        <Q isMobile={isMobile}>Baan 3 — wat voor werk is dat?</Q>
        <WorkTypePicker value={jobTypes[2]?.id || null} onChange={v => {
          const t = WORK_TYPES.find(x => x.id === v)
          const updated = [...jobTypes.slice(0, 2), t]
          setJobTypes(updated)
          go('work_days')
        }} isMobile={isMobile} />
      </>
    )

    // ── WERKDAGEN ─────────────────────────────────────────────────────────────

    if (step === 'work_days') {
      const jLabel = currentJob?.label || null
      const bLabel = numJobs === 'meer' ? `Baan ${currentJobIdx + 1}` : null
      const question = bLabel && jLabel
        ? `${bLabel} (${jLabel.toLowerCase()}) — op welke dagen werk je dit?`
        : jLabel ? `Op welke dagen werk je bij ${jLabel.toLowerCase()}?`
        : 'Op welke dagen werk je?'

      return (
        <>
          <BackBtn onBack={goBack} />
          <Q isMobile={isMobile}>{question}</Q>
          <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
            {[{ l: 'Ma–Vr', d: ['ma','di','wo','do','vr'] }, { l: 'Ma–Za', d: ['ma','di','wo','do','vr','za'] }, { l: 'Weekend', d: ['za','zo'] }].map(p => {
              const active = JSON.stringify([...workDays].sort()) === JSON.stringify([...p.d].sort())
              return (
                <button key={p.l} onClick={() => setWorkDays(p.d)} style={{ padding: '0.35rem 0.75rem', background: active ? 'rgba(255,215,0,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${active ? 'rgba(255,215,0,0.25)' : 'rgba(255,255,255,0.07)'}`, borderRadius: '20px', color: active ? '#FFD700' : 'rgba(255,255,255,0.3)', fontSize: isMobile ? '0.72rem' : '0.75rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>{p.l}</button>
              )
            })}
          </div>
          <DayPicker selected={workDays} onToggle={toggleWorkDay} isMobile={isMobile} />
          {savedJobs.length > 0 && (
            <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.2)', marginTop: '0.25rem', fontWeight: 500 }}>
              Baan {currentJobIdx} werkte op: {savedJobs[currentJobIdx - 1]?.days.map(d => DAY_LABELS[d]).join(', ')}
            </div>
          )}
          <NextBtn onClick={() => { setJobGroups([]); go('all_same') }} disabled={workDays.length === 0} isMobile={isMobile} />
          <button onClick={() => go('training_days')} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.2)', fontSize: '0.68rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', marginTop: '0.4rem', padding: '0.2rem 0', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>Ik werk niet →</button>
        </>
      )
    }

    // ── TIJDEN GROEPEREN ──────────────────────────────────────────────────────

    if (step === 'all_same') return (
      <>
        <BackBtn onBack={goBack} />
        <Q isMobile={isMobile}>Werk je op al die dagen op dezelfde tijden?</Q>
        <BigOption label="Ja, elke dag hetzelfde" onClick={() => { setAllSameDays('yes'); setGrpDays([...workDays]); go('grp_start') }} selected={allSameDays === 'yes'} isMobile={isMobile} />
        <BigOption label="Nee, sommige dagen zijn anders" sub="Bijv. ma–wo anders dan do–vr" onClick={() => { setAllSameDays('no'); setGrpDays([]); go('grp_days') }} selected={allSameDays === 'no'} isMobile={isMobile} />
      </>
    )

    if (step === 'grp_days') {
      const isFirst = jobGroups.length === 0
      return (
        <>
          <BackBtn onBack={goBack} />
          <Q isMobile={isMobile}>{isFirst ? 'Welke dagen werk je op dezelfde tijden?' : `Welke van deze dagen werk je op dezelfde tijden?`}</Q>
          {!isFirst && (
            <div style={{ fontSize: isMobile ? '0.72rem' : '0.75rem', color: 'rgba(255,255,255,0.3)', marginBottom: '0.4rem', fontWeight: 500 }}>
              Nog in te delen: {unassignedInCurrentJob.map(d => DAY_LABELS[d]).join(', ')}
            </div>
          )}
          <DayPicker
            selected={grpDays}
            onToggle={d => { if (workDays.includes(d) && !assignedInCurrentJob.includes(d)) toggleGrpDay(d) }}
            disabledDays={assignedInCurrentJob}
            isMobile={isMobile}
          />
          <NextBtn onClick={() => go('grp_start')} disabled={grpDays.length === 0} isMobile={isMobile} />
        </>
      )
    }

    if (step === 'grp_start') {
      const jLabel  = currentJob?.label || null
      const bNum    = numJobs === 'meer' ? ` baan ${currentJobIdx + 1}` : ''
      const dayStr  = grpDays.map(d => DAY_LABELS[d]).join(', ')
      return (
        <>
          <BackBtn onBack={goBack} />
          <Q isMobile={isMobile}>Hoe laat begin je op {dayStr}{jLabel ? ` bij ${jLabel.toLowerCase()}${bNum}` : ''}?</Q>
          <TimeGrid options={START_OPTIONS} value={grpStart} value2={grpStart2} onChange={setGrpStart} onChange2={setGrpStart2} isMobile={isMobile} />
          <NextBtn onClick={() => go('grp_end')} disabled={!grpStart} isMobile={isMobile} />
        </>
      )
    }

    if (step === 'grp_end') {
      const jLabel  = currentJob?.label || null
      const bNum    = numJobs === 'meer' ? ` baan ${currentJobIdx + 1}` : ''
      const dayStr  = grpDays.map(d => DAY_LABELS[d]).join(', ')
      return (
        <>
          <BackBtn onBack={goBack} />
          <Q isMobile={isMobile}>Hoe laat ben je klaar op {dayStr}{jLabel ? ` bij ${jLabel.toLowerCase()}${bNum}` : ''}?</Q>
          <TimeGrid options={END_OPTIONS} value={grpEnd} value2={grpEnd2} onChange={setGrpEnd} onChange2={setGrpEnd2} isMobile={isMobile} />
          <NextBtn
            onClick={() => {
              const newGroups = saveCurrentGroup()
              const newAssigned = newGroups.flatMap(g => g.days)
              const stillLeft = workDays.filter(d => !newAssigned.includes(d))
              if (allSameDays === 'yes' || stillLeft.length === 0) {
                saveCurrentJobAndNext(newGroups)
              } else {
                setMoreGrpSel([])
                go('more_groups')
              }
            }}
            disabled={!grpEnd}
            isMobile={isMobile}
          />
        </>
      )
    }

    if (step === 'more_groups') {
      const assigned  = jobGroups.flatMap(g => g.days)
      const remaining = workDays.filter(d => !assigned.includes(d))
      return (
        <>
          <BackBtn onBack={goBack} />
          <Q isMobile={isMobile}>Welke van deze dagen werk je op dezelfde tijden?</Q>
          <div style={{ fontSize: isMobile ? '0.72rem' : '0.75rem', color: 'rgba(255,255,255,0.3)', marginBottom: '0.4rem', fontWeight: 500 }}>
            Nog in te delen: {remaining.map(d => DAY_LABELS[d]).join(', ')}
          </div>
          <div style={{ display: 'flex', gap: '0.2rem' }}>
            {DAYS.map(day => {
              const inRemaining = remaining.includes(day)
              const isSelected  = moreGrpSel.includes(day)
              return (
                <button key={day} onClick={() => { if (inRemaining) toggleMoreSel(day) }} style={{
                  flex: 1, padding: isMobile ? '0.55rem 0' : '0.6rem 0',
                  background: isSelected ? 'rgba(255,215,0,0.1)' : '#0d0d0d',
                  border: `${isSelected ? '2px' : '1px'} solid ${isSelected ? 'rgba(255,215,0,0.5)' : 'rgba(255,255,255,0.07)'}`,
                  borderRadius: '8px',
                  color: isSelected ? '#FFD700' : inRemaining ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.12)',
                  fontSize: isMobile ? '0.75rem' : '0.8rem', fontWeight: isSelected ? 800 : 600,
                  cursor: inRemaining ? 'pointer' : 'default', fontFamily: 'inherit',
                  position: 'relative', overflow: 'hidden',
                  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                  transition: 'all 0.15s ease', minHeight: '44px'
                }}>
                  {DAY_LABELS[day]}
                  {!inRemaining && (
                    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'repeating-linear-gradient(135deg, transparent, transparent 4px, rgba(255,255,255,0.05) 4px, rgba(255,255,255,0.05) 5px)' }} />
                  )}
                </button>
              )
            })}
          </div>
          <NextBtn
            onClick={() => {
              setGrpDays(moreGrpSel)
              setMoreGrpSel([])
              go('grp_start')
            }}
            disabled={moreGrpSel.length === 0}
            isMobile={isMobile}
          />
        </>
      )
    }

    // ── TRAINING ──────────────────────────────────────────────────────────────

    if (step === 'training_days') return (
      <>
        <BackBtn onBack={goBack} />
        <Q isMobile={isMobile}>Op welke dagen wil of kan je trainen?</Q>
        <DayPicker selected={trainingDays} onToggle={toggleTraining} isMobile={isMobile} />
        <BigOption
          label="Maakt me niet uit — coach bepaalt"
          sub="Je coach plant trainingsdagen in op basis van je schema"
          onClick={() => { setTrainingDays([]); go('training_time') }}
          selected={false} isMobile={isMobile}
        />
        <NextBtn
          onClick={() => go('training_time')}
          label="VOLGENDE →"
          isMobile={isMobile}
        />
      </>
    )

    if (step === 'training_time') return (
      <>
        <BackBtn onBack={goBack} />
        <Q isMobile={isMobile}>Hoe laat train je meestal?</Q>
        {[
          { label: 'Vroege ochtend', sub: 'voor 08:00',  time: '06:30' },
          { label: 'Ochtend',        sub: '08:00–12:00', time: '09:00' },
          { label: 'Middag',         sub: '12:00–17:00', time: '13:00' },
          { label: 'Vroege avond',   sub: '17:00–19:00', time: '17:30' },
          { label: 'Avond',          sub: '19:00–21:00', time: '19:00' },
          { label: 'Late avond',     sub: 'na 21:00',    time: '21:30' },
          { label: 'Weet ik nog niet', sub: 'Coach bepaalt op basis van mijn schema', time: 'onbekend' },
        ].map(opt => (
          <BigOption key={opt.time} label={opt.label} sub={opt.sub} onClick={() => setTrainingTime(opt.time)} selected={trainingTime === opt.time} isMobile={isMobile} />
        ))}
        <NextBtn onClick={() => go('extra')} disabled={!trainingTime} isMobile={isMobile} />
      </>
    )

    // Vangnet voor wat de knoppen niet vangen: eigen terugkerende blokken en
    // een vrij tekstvak. De blokken tellen mee in de beschikbaarheid.
    if (step === 'extra') return (
      <>
        <BackBtn onBack={goBack} />
        <Q isMobile={isMobile}>Heb je nog vaste dingen in je week?</Q>
        <Hint isMobile={isMobile}>
          Denk aan yoga, fysio, kinderen ophalen. We houden er rekening mee bij het inplannen van je trainingen.
        </Hint>

        {eigenBlokken.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: '0.7rem' }}>
            {eigenBlokken.map((b, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.6rem 0.75rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <span style={{ flex: 1, minWidth: 0, fontSize: '0.85rem', fontWeight: 800, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.naam}</span>
                <span style={{ flexShrink: 0, fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>{DAG_LABELS[b.dag] || b.dag} {b.start}–{b.eind}</span>
                <button type="button" onClick={() => setEigenBlokken(v => v.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', fontSize: '1.2rem', cursor: 'pointer', padding: '0 2px', lineHeight: 1, minHeight: 32 }}>×</button>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: '1rem' }}>
          <input value={nieuwBlok.naam} onChange={e => setNieuwBlok(b => ({ ...b, naam: e.target.value }))} placeholder="Wat is het? Bijv. yoga" style={eigenVeld(isMobile)} />
          <div style={{ display: 'flex', gap: 6 }}>
            <select value={nieuwBlok.dag} onChange={e => setNieuwBlok(b => ({ ...b, dag: e.target.value }))} style={{ ...eigenVeld(isMobile), flex: 1.2 }}>
              {Object.entries(DAG_LABELS).map(([k, v]) => <option key={k} value={k} style={{ background: '#111' }}>{v}</option>)}
            </select>
            <input type="time" value={nieuwBlok.start} onChange={e => setNieuwBlok(b => ({ ...b, start: e.target.value }))} style={{ ...eigenVeld(isMobile), flex: 1 }} />
            <input type="time" value={nieuwBlok.eind} onChange={e => setNieuwBlok(b => ({ ...b, eind: e.target.value }))} style={{ ...eigenVeld(isMobile), flex: 1 }} />
          </div>
          <button type="button"
            disabled={!nieuwBlok.naam.trim() || !nieuwBlok.start || !nieuwBlok.eind}
            onClick={() => { setEigenBlokken(v => [...v, { ...nieuwBlok, naam: nieuwBlok.naam.trim() }]); setNieuwBlok({ naam: '', dag: nieuwBlok.dag, start: '', eind: '' }) }}
            style={{
              padding: '0.7rem', minHeight: 44,
              background: (!nieuwBlok.naam.trim() || !nieuwBlok.start || !nieuwBlok.eind) ? 'rgba(255,255,255,0.05)' : '#fff',
              border: '1px solid rgba(255,255,255,0.15)',
              color: (!nieuwBlok.naam.trim() || !nieuwBlok.start || !nieuwBlok.eind) ? 'rgba(255,255,255,0.25)' : '#0a0a0a',
              fontSize: '0.8rem', fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer',
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            }}>+ Toevoegen</button>
        </div>

        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: '0.4rem', lineHeight: 1.5 }}>
          Lukt het niet om via de knoppen je week aan te geven? Typ hier zoveel mogelijk aan mij — maar probeer eerst de knoppen.
        </div>
        <textarea value={toelichting} onChange={e => setToelichting(e.target.value)}
          placeholder="Bijv: ik werk onregelmatig, om de week nachtdienst…" rows={4}
          style={{ ...eigenVeld(isMobile), width: '100%', resize: 'none', lineHeight: 1.5 }} />

        <NextBtn onClick={handleFinish} label="WEEK OPSLAAN →" isMobile={isMobile} />
      </>
    )

    return null
  }

  // ── Saved state ───────────────────────────────────────────────────────────

  if (saved) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: '0.65rem', color: '#10b981' }}>✓</span>
          </div>
          <div>
            <div style={{ fontSize: isMobile ? '0.82rem' : '0.85rem', fontWeight: 800, color: '#10b981' }}>Week opgeslagen</div>
            <div style={{ fontSize: isMobile ? '0.6rem' : '0.62rem', color: 'rgba(255,255,255,0.25)', fontWeight: 500 }}>Je schema staat vast.</div>
          </div>
          <button onClick={() => setSaved(false)} style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.2)', fontSize: '0.6rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
            Aanpassen →
          </button>
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '0.6rem' }}>
          <WeekCalendar schedule={schedule} isMobile={isMobile} highlightDays={trainingDays} />
        </div>
      </div>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

      {/* Progress dots */}
      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
        {SECTION_LABELS.map((label, i) => {
          const isDone    = i < section
          const isCurrent = i === section
          return (
            <React.Fragment key={label}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: isDone ? '#10b981' : isCurrent ? '#FFD700' : 'rgba(255,255,255,0.12)', transition: 'background 0.2s ease' }} />
                <span style={{ fontSize: '0.52rem', fontWeight: isCurrent ? 800 : 500, color: isDone ? '#10b981' : isCurrent ? '#FFD700' : 'rgba(255,255,255,0.2)', whiteSpace: 'nowrap' }}>
                  {isDone ? `✓ ${label}` : label}
                </span>
              </div>
              {i < SECTION_LABELS.length - 1 && (
                <div style={{ flex: 1, height: '1px', background: isDone ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.04)' }} />
              )}
            </React.Fragment>
          )
        })}
      </div>

      {/* Actieve stap */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {renderStep()}
      </div>

      {/* Kalender — altijd zichtbaar */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '0.75rem' }}>
        <WeekCalendar schedule={schedule} isMobile={isMobile} highlightDays={trainingDays} />
      </div>

    </div>
  )
}
