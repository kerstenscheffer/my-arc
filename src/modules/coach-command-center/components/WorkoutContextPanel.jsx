// src/modules/coach-command-center/components/WorkoutContextPanel.jsx
// v2.0 — Fase 3 data volledig verwerkt

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useModalHost } from '../../../coach/ModalHost'
import { Dumbbell, ChevronDown, ChevronRight, X, Minus, Maximize2, GripVertical, Check } from 'lucide-react'

const DEFAULT_POS  = { x: window.innerWidth - 380, y: 80 }
const DEFAULT_SIZE = { w: 360, h: 600 }
const MIN_SIZE     = { w: 280, h: 200 }

const EXPERIENCE_LABELS = {
  beginner:     'Beginner',
  intermediate: 'Gemiddeld',
  advanced:     'Gevorderd',
  athlete:      'Atleet'
}

const LOCATION_LABELS = {
  gym:  'Sportschool',
  home: 'Thuis',
  both: 'Mix (gym + thuis)',
  outdoor: 'Buiten'
}

const SPLIT_LABELS = {
  full_body:    'Full Body',
  upper_lower:  'Upper / Lower',
  ppl:          'Push Pull Legs',
  bro_split:    'Bro Split',
  no_preference:'Coach bepaalt',
  custom:       'Custom'
}

const FOCUS_LABELS = {
  strength:     'Kracht',
  hypertrophy:  'Spieropbouw',
  conditioning: 'Conditie',
  fat_loss:     'Afvallen',
  mix:          'Balans'
}

const CARDIO_LABELS = {
  yes:   'Ja, regelmatig',
  maybe: 'Soms',
  no:    'Liever niet'
}

const WILLINGNESS_LABELS = {
  starting: 'Wil starten',
  already:  'Traint al',
  no:       'Wil niet trainen'
}

const NO_REASON_LABELS = {
  no_time:       'Geen tijd',
  no_motivation: 'Geen motivatie',
  injury:        'Blessure / pijn',
  dont_know:     'Weet niet waar te beginnen',
  other:         'Andere reden'
}

const WORKOUT_SOP_STEPS = [
  {
    id: 0, title: 'Doel + aanpak helder',
    checks: [
      { id: 'doel_bepaald', label: 'Doel bepaald (kracht / conditie / recomp)' },
      { id: 'freq_bepaald', label: 'Frequentie bepaald (bijv. 3x/week)' },
      { id: 'split_bepaald', label: 'Split type bepaald (Full Body / PPL / etc.)' },
    ]
  },
  {
    id: 1, title: 'Voorkeuren & skill niveau checken',
    checks: [
      { id: 'niveau_gecheckt', label: 'Ervaringsniveau gecheckt' },
      { id: 'blessures_gecheckt', label: 'Blessures / beperkingen doorgenomen' },
      { id: 'locatie_gecheckt', label: 'Locatie + equipment gecheckt' },
      { id: 'voorkeuren_door', label: 'Oefenvoorkeuren doorgenomen' },
    ]
  },
  {
    id: 2, title: 'Plan bepalen',
    checks: [
      { id: 'schema_gekozen', label: 'Schema structuur bepaald' },
      { id: 'aanpak_helder', label: 'Aanpak helder — wat gaan we doen?' },
    ]
  },
  {
    id: 3, title: 'Plan maken',
    checks: [
      { id: 'oefeningen_gekozen', label: 'Oefeningen geselecteerd' },
      { id: 'sets_reps', label: 'Sets & reps bepaald' },
      { id: 'progressie_schema', label: 'Progressie schema ingesteld' },
    ]
  },
  {
    id: 4, title: 'Plan checken & toewijzen',
    checks: [
      { id: 'plan_gecheckt', label: 'Plan doorgelopen en gecheckt' },
      { id: 'plan_toegewezen', label: 'Plan toegewezen aan client' },
    ]
  }
]

export default function WorkoutContextPanel({ db, clientId, isMobile, isFloating = false, onClose }) {
  const modalHost = useModalHost()
  const [cd, setCd]         = useState(null)
  const [wp, setWp]         = useState(null)
  const [journey, setJourney] = useState(null)
  const [loading, setLoading] = useState(true)

  const [activeTab, setActiveTab] = useState('gegevens')
  const [sopChecks, setSopChecks] = useState({})
  const [sopStep, setSopStep]     = useState(0)

  const [expanded, setExpanded] = useState({
    bereidheid: true, basis: true, schema: true,
    cardio: true, equipment: true, blessures: true, intake: false
  })

  const [pos, setPos]             = useState(DEFAULT_POS)
  const [size, setSize]           = useState(DEFAULT_SIZE)
  const [minimized, setMinimized] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const dragOffset  = useRef({ x: 0, y: 0 })
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0 })
  const m = isMobile

  useEffect(() => {
    if (clientId && db?.supabase) loadData()
  }, [clientId])

  useEffect(() => { setSopChecks({}); setSopStep(0) }, [clientId])

  const loadData = async () => {
    setLoading(true)
    try {
      // Haal eerst client op om auth_user_id te krijgen
      const { data: client } = await db.supabase
        .from('clients').select('*').eq('id', clientId).single()

      if (client) {
        setCd(client)

        // user_workout_preferences gebruikt user_id = auth_user_id
        const userId = client.auth_user_id || client.id
        const { data: wpData } = await db.supabase
          .from('user_workout_preferences').select('*')
          .eq('user_id', userId).limit(1)
        if (wpData?.[0]) setWp(wpData[0])

        // Journey voor intake call notes
        const { data: journeyData } = await db.supabase
          .from('client_journeys').select('coaching_plan')
          .eq('client_id', clientId).eq('is_active', true).single()
        if (journeyData) setJourney(journeyData)
      }
    } catch (e) { console.warn('WorkoutContextPanel load failed:', e) }
    setLoading(false)
  }

  const toggle = (key) => setExpanded(p => ({ ...p, [key]: !p[key] }))
  const toggleSopCheck = (id) => setSopChecks(p => ({ ...p, [id]: !p[id] }))

  const sopStepComplete = (step) => step.checks.every(c => sopChecks[c.id])
  const totalChecks = WORKOUT_SOP_STEPS.reduce((a, s) => a + s.checks.length, 0)
  const doneChecks  = Object.values(sopChecks).filter(Boolean).length
  const sopProgress = totalChecks > 0 ? Math.round((doneChecks / totalChecks) * 100) : 0

  // ── Drag ──
  const onDragStart = useCallback((e) => {
    e.preventDefault()
    const cx = e.clientX ?? e.touches?.[0]?.clientX ?? 0
    const cy = e.clientY ?? e.touches?.[0]?.clientY ?? 0
    dragOffset.current = { x: cx - pos.x, y: cy - pos.y }
    setIsDragging(true)
  }, [pos])

  const onDragMove = useCallback((e) => {
    if (!isDragging) return
    const cx = e.clientX ?? e.touches?.[0]?.clientX ?? 0
    const cy = e.clientY ?? e.touches?.[0]?.clientY ?? 0
    setPos({ x: Math.max(0, Math.min(window.innerWidth - size.w, cx - dragOffset.current.x)), y: Math.max(0, Math.min(window.innerHeight - 60, cy - dragOffset.current.y)) })
  }, [isDragging, size])

  const onDragEnd = useCallback(() => setIsDragging(false), [])

  const onResizeStart = useCallback((e) => {
    e.preventDefault(); e.stopPropagation()
    const cx = e.clientX ?? e.touches?.[0]?.clientX ?? 0
    const cy = e.clientY ?? e.touches?.[0]?.clientY ?? 0
    resizeStart.current = { x: cx, y: cy, w: size.w, h: size.h }
    setIsResizing(true)
  }, [size])

  const onResizeMove = useCallback((e) => {
    if (!isResizing) return
    const cx = e.clientX ?? e.touches?.[0]?.clientX ?? 0
    const cy = e.clientY ?? e.touches?.[0]?.clientY ?? 0
    setSize({ w: Math.max(MIN_SIZE.w, resizeStart.current.w + cx - resizeStart.current.x), h: Math.max(MIN_SIZE.h, resizeStart.current.h + cy - resizeStart.current.y) })
  }, [isResizing])

  const onResizeEnd = useCallback(() => setIsResizing(false), [])

  useEffect(() => {
    if (!isDragging && !isResizing) return
    const move = isDragging ? onDragMove : onResizeMove
    const end  = isDragging ? onDragEnd  : onResizeEnd
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', end)
    window.addEventListener('touchmove', move, { passive: false })
    window.addEventListener('touchend', end)
    return () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', end)
      window.removeEventListener('touchmove', move)
      window.removeEventListener('touchend', end)
    }
  }, [isDragging, isResizing, onDragMove, onResizeMove, onDragEnd, onResizeEnd])

  // ── Data extractie uit wp ──
  const split        = wp?.split_preferences || {}
  const focusArr     = Array.isArray(split.focus) ? split.focus : split.focus ? [split.focus] : []
  const equipment    = wp?.default_equipment || []
  const cardioTypes  = Array.isArray(wp?.cardio_types) ? wp.cardio_types : []
  const injuries     = wp?.injuries || cd?.injuries || ''
  const avoided      = wp?.avoided_exercises || ''
  const willingness  = wp?.training_willingness || null
  const noReason     = wp?.no_training_reason || null
  const doesCardio   = wp?.does_cardio || null
  const doesNotTrain = willingness === 'no'

  // Intake call notes
  const plan         = journey?.coaching_plan || {}
  const callNotes    = plan.intake_call_notes?.notes || {}
  const callTraining = callNotes.training || {}
  const hasCallData  = !!(callTraining.doel || callTraining.aanpak || callTraining.blessures)

  if (loading) return isFloating ? null : <div style={{ padding: '0.75rem', fontSize: '0.6rem', color: 'rgba(255,255,255,0.2)' }}>Laden...</div>
  if (!cd) return null

  const panelContent = (
    <div style={{
      display: 'flex', flexDirection: 'column',
      background: '#0a0a0a',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '10px', overflow: 'hidden',
      transform: 'translateZ(0)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
      ...(isFloating ? {
        position: 'fixed', left: pos.x, top: pos.y,
        width: size.w, height: minimized ? 'auto' : size.h,
        zIndex: 10200, cursor: isDragging ? 'grabbing' : 'default',
      } : { height: '100%' })
    }}>

      <div style={{ height: '2px', background: 'linear-gradient(90deg,#f97316,#ea580c,#f97316)', opacity: 0.7, flexShrink: 0 }} />

      {/* ── Header ── */}
      <div
        onMouseDown={isFloating ? onDragStart : undefined}
        onTouchStart={isFloating ? onDragStart : undefined}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.35rem',
          padding: m ? '0.4rem 0.6rem' : '0.5rem 0.75rem',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
          cursor: isFloating ? 'grab' : 'default',
          flexShrink: 0, userSelect: 'none'
        }}
      >
        {isFloating && <GripVertical size={12} color="rgba(255,255,255,0.2)" style={{ flexShrink: 0 }} />}
        <Dumbbell size={12} color="#f97316" style={{ flexShrink: 0 }} />
        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#fff', flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {cd.first_name} {cd.last_name}
        </span>
        {wp?.default_experience_level && (
          <span style={{ fontSize: '0.35rem', fontWeight: 800, color: '#f97316', background: 'rgba(249,115,22,0.1)', padding: '0.05rem 0.25rem', borderRadius: '2px', textTransform: 'uppercase', flexShrink: 0 }}>
            {EXPERIENCE_LABELS[wp.default_experience_level] || wp.default_experience_level}
          </span>
        )}
        {doesNotTrain && (
          <span style={{ fontSize: '0.35rem', fontWeight: 800, color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '0.05rem 0.25rem', borderRadius: '2px', textTransform: 'uppercase', flexShrink: 0 }}>
            Traint niet
          </span>
        )}
        {isFloating && (
          <div style={{ display: 'flex', gap: '0.2rem', flexShrink: 0, marginLeft: '0.25rem' }}>
            <button onClick={() => setMinimized(p => !p)} style={iconBtnStyle}><Minus size={10} /></button>
            <button onClick={() => { setPos(DEFAULT_POS); setSize(DEFAULT_SIZE) }} style={iconBtnStyle}><Maximize2 size={10} /></button>
            {onClose && <button onClick={onClose} style={{ ...iconBtnStyle, color: 'rgba(255,255,255,0.5)' }}><X size={10} /></button>}
          </div>
        )}
      </div>

      {minimized ? null : (
        <>
          {/* ── Tab strip ── */}
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.04)', flexShrink: 0, background: '#050505' }}>
            {[
              { id: 'gegevens', label: 'GEGEVENS' },
              { id: 'sop', label: `WORKOUT SOP${sopProgress > 0 ? ` · ${sopProgress}%` : ''}` }
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                flex: 1, padding: '0.4rem 0.5rem',
                background: 'transparent', border: 'none',
                borderBottom: `2px solid ${activeTab === tab.id ? '#f97316' : 'transparent'}`,
                color: activeTab === tab.id ? '#f97316' : 'rgba(255,255,255,0.25)',
                fontSize: '0.4rem', fontWeight: 800, letterSpacing: '0.07em',
                cursor: 'pointer', touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent', transition: 'color 0.15s ease'
              }}>
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>

            {/* ════ TAB: GEGEVENS ════ */}
            {activeTab === 'gegevens' && (
              <>

                {/* ── TRAININGSBEREIDHEID ── */}
                {willingness && (
                  <Section title="🎯 TRAININGSBEREIDHEID" expanded={expanded.bereidheid} onToggle={() => toggle('bereidheid')} m={m} color={doesNotTrain ? '#ef4444' : '#10b981'}>
                    <DataRow label="STATUS" value={WILLINGNESS_LABELS[willingness] || willingness} color={doesNotTrain ? '#ef4444' : '#10b981'} m={m} />
                    {doesNotTrain && noReason && (
                      <DataRow label="REDEN" value={NO_REASON_LABELS[noReason] || noReason} color="#ef4444" m={m} />
                    )}
                  </Section>
                )}

                {/* ── BASIS ── */}
                {!doesNotTrain && (
                  <Section title="💪 BASIS" expanded={expanded.basis} onToggle={() => toggle('basis')} m={m} color="#f97316">
                    <FlushRow items={[
                      { l: 'NIVEAU',  v: EXPERIENCE_LABELS[wp?.default_experience_level] || cd.training_experience || '—', color: '#f97316' },
                      { l: 'DUUR',    v: wp?.default_time_per_session ? `${wp.default_time_per_session}m` : '—', color: '#fff' },
                      { l: 'DAGEN',   v: wp?.default_days_per_week || cd.preferred_training_days?.length || '—', color: '#FFD700' },
                    ]} m={m} />
                    {(wp?.training_location || cd.training_location) && (
                      <DataRow label="LOCATIE" value={LOCATION_LABELS[wp?.training_location || cd.training_location] || wp?.training_location || '—'} m={m} />
                    )}
                    {wp?.gym_name && <DataRow label="GYM" value={wp.gym_name} m={m} />}
                    {wp?.training_time && <DataRow label="TRAININGSTIJD" value={wp.training_time} m={m} />}
                    {cd.preferred_training_days?.length > 0 && (
                      <DataRow label="VOORKEURSDAGEN" value={cd.preferred_training_days.map(d => d.charAt(0).toUpperCase() + d.slice(1, 2)).join(' · ')} m={m} />
                    )}
                  </Section>
                )}

                {/* ── SCHEMA ── */}
                {!doesNotTrain && (split.preferred || focusArr.length > 0 || wp?.emphasize_stretch !== undefined) && (
                  <Section title="📋 SCHEMA" expanded={expanded.schema} onToggle={() => toggle('schema')} m={m} color="#FFD700">
                    {split.preferred && (
                      <DataRow label="SPLIT" value={SPLIT_LABELS[split.preferred] || split.preferred} color="#FFD700" m={m} />
                    )}
                    {focusArr.length > 0 && (
                      <DataRow label="FOCUS" value={focusArr.map(f => FOCUS_LABELS[f] || f).join(' · ')} color="#FFD700" m={m} />
                    )}
                    {wp?.emphasize_stretch !== undefined && (
                      <DataRow label="STRETCHING" value={wp.emphasize_stretch ? 'Ja' : 'Nee'} color={wp.emphasize_stretch ? '#10b981' : 'rgba(255,255,255,0.3)'} m={m} />
                    )}
                    {cd.primary_goal && (
                      <DataRow label="DOEL" value={cd.primary_goal} color="#f97316" m={m} />
                    )}
                  </Section>
                )}

                {/* ── CARDIO ── */}
                {!doesNotTrain && (wp?.cardio_interest || doesCardio) && (
                  <Section title="🏃 CARDIO" expanded={expanded.cardio} onToggle={() => toggle('cardio')} m={m} color="#3b82f6">
                    {doesCardio && (
                      <DataRow label="DOET AL" value={doesCardio === 'yes' ? 'Ja, regelmatig' : doesCardio === 'sometimes' ? 'Soms' : 'Nee'} m={m} />
                    )}
                    {wp?.cardio_interest && (
                      <DataRow label="WIL IN SCHEMA" value={CARDIO_LABELS[wp.cardio_interest] || wp.cardio_interest} color={wp.cardio_interest === 'yes' ? '#10b981' : wp.cardio_interest === 'maybe' ? '#FFD700' : 'rgba(255,255,255,0.3)'} m={m} />
                    )}
                    {cardioTypes.length > 0 && (
                      <DataRow label="TYPES" value={cardioTypes.join(', ')} m={m} />
                    )}
                    {wp?.cardio_frequency && (
                      <DataRow label="FREQ" value={`${wp.cardio_frequency}x per week`} m={m} />
                    )}
                    {wp?.cardio_duration && (
                      <DataRow label="DUUR" value={`${wp.cardio_duration} min`} m={m} />
                    )}
                  </Section>
                )}

                {/* ── EQUIPMENT ── */}
                {!doesNotTrain && equipment.length > 0 && (
                  <Section title="🏋️ EQUIPMENT" expanded={expanded.equipment} onToggle={() => toggle('equipment')} m={m}>
                    <div style={{ padding: m ? '0.3rem 0.75rem 0.5rem' : '0.35rem 0.75rem 0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                      {equipment.map(e => (
                        <span key={e} style={{ fontSize: '0.5rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '3px', padding: '0.1rem 0.3rem' }}>
                          {e}
                        </span>
                      ))}
                    </div>
                  </Section>
                )}

                {/* ── BLESSURES & BEPERKINGEN ── */}
                {(injuries || avoided || wp?.other_limitations) && (
                  <Section title="⚠️ BLESSURES & BEPERKINGEN" expanded={expanded.blessures} onToggle={() => toggle('blessures')} m={m} color="#ef4444">
                    {injuries && <DataRow label="BLESSURES" value={injuries} color="#ef4444" m={m} />}
                    {avoided && <DataRow label="VERMIJDEN" value={avoided} color="#f59e0b" m={m} />}
                    {wp?.other_limitations && <DataRow label="OVERIG" value={wp.other_limitations} color="#f59e0b" m={m} />}
                  </Section>
                )}

                {/* ── GEEN DATA ── */}
                {!wp && !loading && (
                  <div style={{ padding: '1rem 0.75rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.2)', fontWeight: 600 }}>Fase 3 nog niet ingevuld</div>
                  </div>
                )}

                {/* ── INTAKE CALL ── */}
                {hasCallData && (
                  <Section title="📞 INTAKE CALL" expanded={expanded.intake} onToggle={() => toggle('intake')} m={m} color="#6366f1">
                    {callTraining.doel     && <DataRow label="DOEL"      value={callTraining.doel}      color="#fff" m={m} />}
                    {callTraining.aanpak   && <DataRow label="AANPAK"    value={callTraining.aanpak}    m={m} />}
                    {callTraining.blessures && <DataRow label="BLESSURES" value={callTraining.blessures} color="#ef4444" m={m} />}
                    {callTraining.niveau   && <DataRow label="NIVEAU"    value={callTraining.niveau}    m={m} />}
                  </Section>
                )}
              </>
            )}

            {/* ════ TAB: WORKOUT SOP ════ */}
            {activeTab === 'sop' && (
              <div style={{ padding: '0.5rem 0.5rem 1rem' }}>
                <div style={{ padding: '0.4rem 0.25rem 0.6rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.38rem', color: 'rgba(255,255,255,0.2)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>VOORTGANG</span>
                    <span style={{ fontSize: '0.38rem', color: '#f97316', fontWeight: 800 }}>{sopProgress}%</span>
                  </div>
                  <div style={{ height: '2px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${sopProgress}%`, background: 'linear-gradient(90deg,#f97316,#ea580c)', borderRadius: '2px', transition: 'width 0.3s ease' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {WORKOUT_SOP_STEPS.map((step) => {
                    const done     = sopStepComplete(step)
                    const isActive = sopStep === step.id
                    return (
                      <div key={step.id} style={{
                        borderLeft: `3px solid ${done ? '#10b981' : isActive ? '#f97316' : 'rgba(255,255,255,0.1)'}`,
                        background: isActive ? '#111' : 'transparent',
                        borderRadius: '0 5px 5px 0', overflow: 'hidden'
                      }}>
                        <button onClick={() => setSopStep(isActive ? -1 : step.id)} style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: '0.4rem',
                          padding: '0.4rem 0.5rem', background: 'transparent', border: 'none',
                          cursor: 'pointer', touchAction: 'manipulation',
                          WebkitTapHighlightColor: 'transparent', textAlign: 'left', minHeight: '32px'
                        }}>
                          <div style={{
                            width: '16px', height: '16px', borderRadius: '50%', flexShrink: 0,
                            background: done ? '#10b981' : isActive ? 'rgba(249,115,22,0.15)' : 'transparent',
                            border: `1.5px solid ${done ? '#10b981' : isActive ? '#f97316' : 'rgba(255,255,255,0.12)'}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}>
                            {done
                              ? <Check size={8} color="#000" strokeWidth={3.5} />
                              : isActive
                                ? <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#f97316' }} />
                                : <span style={{ fontSize: '0.35rem', color: 'rgba(255,255,255,0.2)', fontWeight: 800 }}>{step.id + 1}</span>
                            }
                          </div>
                          <span style={{
                            flex: 1, fontSize: '0.7rem', fontWeight: isActive ? 800 : 600,
                            color: done ? 'rgba(255,255,255,0.3)' : isActive ? '#fff' : 'rgba(255,255,255,0.45)',
                            textDecoration: done ? 'line-through' : 'none'
                          }}>
                            {step.title}
                          </span>
                          {isActive ? <ChevronDown size={10} color="rgba(255,255,255,0.2)" /> : <ChevronRight size={10} color="rgba(255,255,255,0.1)" />}
                        </button>

                        {isActive && (
                          <div style={{ padding: '0 0.5rem 0.4rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            {step.checks.map(c => (
                              <button key={c.id} onClick={() => toggleSopCheck(c.id)} style={{
                                display: 'flex', alignItems: 'center', gap: '0.4rem',
                                padding: '0.3rem 0.4rem', borderRadius: '4px',
                                background: sopChecks[c.id] ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.02)',
                                border: `1px solid ${sopChecks[c.id] ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)'}`,
                                cursor: 'pointer', touchAction: 'manipulation',
                                WebkitTapHighlightColor: 'transparent', textAlign: 'left', minHeight: '30px'
                              }}>
                                <div style={{
                                  width: '13px', height: '13px', borderRadius: '3px', flexShrink: 0,
                                  background: sopChecks[c.id] ? '#10b981' : 'transparent',
                                  border: `1.5px solid ${sopChecks[c.id] ? '#10b981' : 'rgba(255,255,255,0.18)'}`,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                  {sopChecks[c.id] && <Check size={7} color="#000" strokeWidth={3.5} />}
                                </div>
                                <span style={{
                                  fontSize: '0.65rem', fontWeight: 600,
                                  color: sopChecks[c.id] ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.7)',
                                  textDecoration: sopChecks[c.id] ? 'line-through' : 'none'
                                }}>
                                  {c.label}
                                </span>
                              </button>
                            ))}
                            {sopStep < WORKOUT_SOP_STEPS.length - 1 && (
                              <button onClick={() => setSopStep(sopStep + 1)} style={{
                                marginTop: '0.2rem', padding: '0.3rem 0.5rem',
                                background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)',
                                borderRadius: '4px', color: '#f97316',
                                fontSize: '0.55rem', fontWeight: 800,
                                cursor: 'pointer', touchAction: 'manipulation',
                                WebkitTapHighlightColor: 'transparent', minHeight: '28px'
                              }}>
                                Volgende stap →
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {doneChecks > 0 && (
                  <button onClick={() => { setSopChecks({}); setSopStep(0) }} style={{
                    marginTop: '0.75rem', width: '100%', padding: '0.3rem',
                    background: 'transparent', border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '4px', color: 'rgba(255,255,255,0.2)',
                    fontSize: '0.45rem', fontWeight: 700,
                    cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
                  }}>
                    SOP resetten
                  </button>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {isFloating && !minimized && (
        <div onMouseDown={onResizeStart} onTouchStart={onResizeStart} style={{ position: 'absolute', bottom: 0, right: 0, width: '16px', height: '16px', cursor: 'se-resize', display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', padding: '3px' }}>
          <div style={{ width: '8px', height: '8px', borderRight: '2px solid rgba(255,255,255,0.15)', borderBottom: '2px solid rgba(255,255,255,0.15)', borderRadius: '0 0 2px 0' }} />
        </div>
      )}
    </div>
  )

  if (isFloating) return createPortal(panelContent, modalHost)
  return panelContent
}

const iconBtnStyle = { width: '20px', height: '20px', borderRadius: '3px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', padding: 0 }

function Section({ title, expanded, onToggle, children, m, color }) {
  return (
    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
      <button onClick={onToggle} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: m ? '0.3rem 0.75rem' : '0.35rem 0.75rem', background: 'transparent', border: 'none', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
        <span style={{ fontSize: '0.42rem', fontWeight: 700, color: color || 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{title}</span>
        {expanded ? <ChevronDown size={10} color="rgba(255,255,255,0.15)" /> : <ChevronRight size={10} color="rgba(255,255,255,0.15)" />}
      </button>
      {expanded && children}
    </div>
  )
}

function FlushRow({ items, m }) {
  return (
    <div style={{ display: 'flex', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
      {items.map((item, i) => (
        <div key={i} style={{ flex: 1, textAlign: 'center', padding: m ? '0.3rem 0.1rem' : '0.35rem 0.15rem', borderRight: i < items.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
          <div style={{ fontSize: '0.35rem', fontWeight: 700, color: 'rgba(255,255,255,0.15)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.05rem' }}>{item.l}</div>
          <div style={{ fontSize: m ? '0.65rem' : '0.7rem', fontWeight: 800, color: item.color || '#fff', lineHeight: 1 }}>{item.v}</div>
        </div>
      ))}
    </div>
  )
}

function DataRow({ label, value, color, m }) {
  if (!value) return null
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: m ? '0.2rem 0.75rem' : '0.25rem 0.75rem', gap: '0.5rem' }}>
      <span style={{ fontSize: '0.35rem', fontWeight: 700, color: 'rgba(255,255,255,0.15)', textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0, paddingTop: '0.1rem' }}>{label}</span>
      <span style={{ fontSize: m ? '0.58rem' : '0.62rem', fontWeight: 600, color: color || 'rgba(255,255,255,0.45)', textAlign: 'right', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{value}</span>
    </div>
  )
}
