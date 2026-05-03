// src/modules/client-journey/components/calls/steps/IntakeStepTraining.jsx
// v2 — Flow met pills + weekkalender context + direct DB save
import React, { useState, useEffect } from 'react'
import { ChevronRight, Check, Dumbbell, Zap, Activity, RefreshCw, Target, Shield, AlertTriangle } from 'lucide-react'
import WeekCalendar from '../../../../public-intake/components/WeekBuilder/WeekCalendar'

const C = {
  gold: '#FFD700', green: '#10b981', blue: '#3b82f6', amber: '#f59e0b', red: '#ef4444',
  text: '#ffffff', text50: 'rgba(255,255,255,0.5)', text25: 'rgba(255,255,255,0.25)',
  border: 'rgba(255,255,255,0.08)', borderSub: 'rgba(255,255,255,0.04)',
}

const DAYS = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo']
const DAY_LABELS = { ma: 'Ma', di: 'Di', wo: 'Wo', do: 'Do', vr: 'Vr', za: 'Za', zo: 'Zo' }

const SCHEMA_OPTIONS = [
  { id: 'full_body',   label: 'Full Body',   sub: '2–3x/week' },
  { id: 'upper_lower', label: 'Upper/Lower', sub: '4x/week'   },
  { id: 'ppl',         label: 'PPL',         sub: '5–6x/week' },
  { id: 'ppl_4',       label: 'PPL 4-daags', sub: '4x/week'   },
  { id: 'bro_split',   label: 'Bro Split',   sub: '5x/week'   },
]

const QUESTIONS = [
  {
    id: 'aanpak',
    question: 'Hoe train je nu, en wat gaan we aanpassen?',
    suggestions: [
      { icon: Dumbbell,      text: 'Ik train al — we passen het schema aan' },
      { icon: Zap,           text: 'Ik begin net — we bouwen iets op' },
      { icon: Activity,      text: 'Ik train maar mis structuur en progressie' },
      { icon: Target,        text: 'Zwaarder tillen, meer volume toevoegen' },
      { icon: RefreshCw,     text: 'Consistenter worden' },
      { icon: Shield,        text: 'Vorige blessure — voorzichtig opbouwen' },
    ],
  },
  {
    id: 'schema',
    question: 'Hoeveel dagen per week en welk schema?',
    type: 'schema',
  },
  {
    id: 'blessures',
    question: 'Blessures of oefeningen die we vermijden?',
    suggestions: [
      { icon: Shield,        text: 'Geen blessures' },
      { icon: AlertTriangle, text: 'Knieklachten — geen deep squat' },
      { icon: AlertTriangle, text: 'Schouderklacht — geen overhead press' },
      { icon: AlertTriangle, text: 'Rugklachten — geen deadlift' },
      { icon: AlertTriangle, text: 'Elleboogklachten — geen zware curls' },
    ],
  },
]

function Pill({ icon: Icon, text, active, onToggle }) {
  return (
    <button onClick={onToggle} style={{
      display: 'flex', alignItems: 'center', gap: '10px',
      width: '100%', padding: '8px 12px', minHeight: '40px',
      background: active ? 'rgba(59,130,246,0.08)' : 'transparent',
      border: `1px solid ${active ? 'rgba(59,130,246,0.30)' : C.border}`,
      borderRadius: '8px', cursor: 'pointer', textAlign: 'left',
      touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
      transition: 'all 0.12s',
    }}>
      <div style={{
        width: '26px', height: '26px', borderRadius: '6px', flexShrink: 0,
        background: active ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${active ? 'rgba(59,130,246,0.30)' : C.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {active
          ? <Check size={13} color={C.blue} strokeWidth={2.5} />
          : <Icon size={13} color="rgba(255,255,255,0.2)" strokeWidth={1.5} />
        }
      </div>
      <span style={{ fontSize: '13px', fontWeight: active ? 700 : 500, color: active ? C.blue : C.text50 }}>
        {text}
      </span>
    </button>
  )
}

function Badge({ label, value, color }) {
  if (!value) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
      <span style={{ fontSize: '8px', fontWeight: 700, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      <span style={{ fontSize: '11px', fontWeight: 700, color: color || C.text50 }}>{value}</span>
    </div>
  )
}

export default function IntakeStepTraining({ cd, wp, db, weekSchedule, notes, updateNotes, onComplete, onBack, isMobile }) {
  const [qIndex, setQIndex] = useState(0)
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')

  const n = notes.training || {}
  const update = (key, val) => updateNotes('training', { [key]: val })

  const currentQ = QUESTIONS[qIndex]
  const isLast = qIndex === QUESTIONS.length - 1

  // Trainingsdagen
  const trainingDays = n.training_days || (() => {
    try {
      const raw = cd?.preferred_training_days
      if (!raw) return []
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
      return Array.isArray(parsed) && parsed[0] !== 'flexible' ? parsed : []
    } catch { return [] }
  })()

  // Week schedule komt als prop van IntakeCallPanel (al correct gebouwd)

  // Prefill bij mount
  useEffect(() => {
    const updates = {}
    if (!n.training_days && cd?.preferred_training_days) {
      try {
        const raw = cd.preferred_training_days
        const days = typeof raw === 'string' ? JSON.parse(raw) : raw
        if (Array.isArray(days) && days[0] !== 'flexible') updates.training_days = days
      } catch {}
    }
    if (!n.sessieduur && wp?.default_time_per_session) updates.sessieduur = wp.default_time_per_session
    if (!n.schema && wp?.split_preferences?.preferred_split) updates.schema = wp.split_preferences.preferred_split
    if (Object.keys(updates).length > 0) updateNotes('training', updates)
  }, [])

  // Save naar clients tabel
  const saveClients = async (fields) => {
    if (!db?.supabase || !cd?.id) return
    setSaving(true)
    const { error } = await db.supabase.from('clients').update(fields).eq('id', cd.id)
    if (error) console.error('❌ Training clients save:', error.message)
    else { setSavedMsg('Opgeslagen'); setTimeout(() => setSavedMsg(''), 2000) }
    setSaving(false)
  }

  // Save naar user_workout_preferences
  const saveWp = async (fields) => {
    if (!db?.supabase || !cd?.auth_user_id) return
    setSaving(true)
    const { error } = await db.supabase.from('user_workout_preferences').update(fields).eq('user_id', cd.auth_user_id)
    if (error) console.error('❌ Training wp save:', error.message)
    else { setSavedMsg('Opgeslagen'); setTimeout(() => setSavedMsg(''), 2000) }
    setSaving(false)
  }

  const toggleDay = (day) => {
    const next = trainingDays.includes(day)
      ? trainingDays.filter(d => d !== day)
      : [...trainingDays, day]
    update('training_days', next)
    saveClients({
      preferred_training_days: JSON.stringify(next),
      workout_days_per_week: next.length,
    })
  }

  const setSchema = (schema) => {
    update('schema', schema)
    saveWp({ split_preferences: { ...(wp?.split_preferences || {}), preferred_split: schema } })
  }

  const setSessieduur = (val) => {
    update('sessieduur', val)
    saveWp({ default_time_per_session: val })
  }

  const getSelected = (id) => {
    const q = QUESTIONS.find(q => q.id === id)
    if (!q) return []
    const texts = (q.suggestions || []).map(s => s.text)
    return (n[id] || '').split(' · ').filter(t => texts.includes(t))
  }

  const togglePill = (id, text) => {
    const cur = getSelected(id)
    const next = cur.includes(text) ? cur.filter(p => p !== text) : [...cur, text]
    update(id, next.join(' · '))
  }

  const renderQuestion = () => {
    if (currentQ.type === 'schema') {
      return (
        <div style={{ padding: '0 16px' }}>

          {/* Trainingsdagen */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: C.text25, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
              Trainingsdagen — {trainingDays.length > 0 ? `${trainingDays.length}x/week` : 'Geen geselecteerd'}
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {DAYS.map(day => {
                const active = trainingDays.includes(day)
                return (
                  <button key={day} onClick={() => toggleDay(day)} style={{
                    flex: 1, height: '38px', borderRadius: '8px',
                    background: active ? 'rgba(255,215,0,0.10)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${active ? 'rgba(255,215,0,0.40)' : C.border}`,
                    color: active ? C.gold : C.text25,
                    fontSize: '11px', fontWeight: active ? 800 : 600,
                    cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                    transition: 'all 0.12s',
                  }}>
                    {DAY_LABELS[day]}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Schema type */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: C.text25, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
              Schema type
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {SCHEMA_OPTIONS.map(opt => {
                const active = n.schema === opt.id
                return (
                  <button key={opt.id} onClick={() => setSchema(opt.id)} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '9px 12px', borderRadius: '8px',
                    background: active ? 'rgba(59,130,246,0.08)' : 'transparent',
                    border: `1px solid ${active ? 'rgba(59,130,246,0.35)' : C.border}`,
                    cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                    transition: 'all 0.12s',
                  }}>
                    <span style={{ fontSize: '13px', fontWeight: active ? 700 : 500, color: active ? C.blue : C.text50 }}>
                      {opt.label}
                    </span>
                    <span style={{ fontSize: '10px', color: C.text25 }}>{opt.sub}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Sessieduur */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: C.text25, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
              Sessieduur
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {[30, 45, 60, 90].map(min => {
                const active = n.sessieduur === min
                return (
                  <button key={min} onClick={() => setSessieduur(min)} style={{
                    flex: 1, height: '38px', borderRadius: '8px',
                    background: active ? 'rgba(59,130,246,0.08)' : 'transparent',
                    border: `1px solid ${active ? 'rgba(59,130,246,0.35)' : C.border}`,
                    color: active ? C.blue : C.text25,
                    fontSize: '12px', fontWeight: active ? 800 : 600,
                    cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                  }}>
                    {min}min
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )
    }

    const suggestions = currentQ.suggestions || []
    const selected = getSelected(currentQ.id)

    return (
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {suggestions.map((s, i) => (
          <Pill
            key={i}
            icon={s.icon}
            text={s.text}
            active={selected.includes(s.text)}
            onToggle={() => togglePill(currentQ.id, s.text)}
          />
        ))}
        <div style={{ marginTop: '4px', borderTop: `1px solid ${C.borderSub}`, paddingTop: '4px' }}>
          <input
            type="text"
            value={n[`${currentQ.id}_extra`] || ''}
            onChange={e => update(`${currentQ.id}_extra`, e.target.value)}
            placeholder="Of typ zelf..."
            style={{
              width: '100%', padding: '8px 12px', borderRadius: '8px',
              background: 'transparent', border: `1px solid ${C.border}`,
              color: C.text, fontSize: '13px', outline: 'none',
              fontFamily: 'inherit', boxSizing: 'border-box',
            }}
          />
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Header */}
      <div style={{ padding: '8px 16px', borderBottom: `1px solid ${C.borderSub}`, display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <span style={{ fontSize: '9px', fontWeight: 700, color: C.text25, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Stap 2 · Training</span>
        <div style={{ flex: 1, height: '2px', background: 'rgba(255,255,255,0.06)', borderRadius: '1px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${((qIndex + 1) / QUESTIONS.length) * 100}%`, background: C.blue, transition: 'width 0.3s' }} />
        </div>
        {saving && <span style={{ fontSize: '9px', color: C.text25 }}>Opslaan...</span>}
        {savedMsg && <span style={{ fontSize: '9px', color: C.green, fontWeight: 700 }}>✓ {savedMsg}</span>}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div style={{ maxWidth: '560px', margin: '0 auto' }}>

          {/* Weekkalender */}
          {weekSchedule && (
            <div style={{ padding: '12px 16px 8px', borderBottom: `1px solid ${C.borderSub}` }}>
              <div style={{ fontSize: '9px', fontWeight: 700, color: C.text25, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                Week van {cd?.first_name}
              </div>
              <WeekCalendar schedule={weekSchedule} isMobile={isMobile} highlightDays={trainingDays} />
            </div>
          )}

          {/* Intake prefill */}
          <div style={{ display: 'flex', gap: '16px', padding: '10px 16px', borderBottom: `1px solid ${C.borderSub}`, flexWrap: 'wrap' }}>
            <Badge label="Niveau" value={{ beginner: 'Beginner', intermediate: 'Gevorderd', advanced: 'Expert' }[wp?.default_experience_level]} />
            <Badge label="Locatie" value={{ gym: 'Sportschool', home: 'Thuis', both: 'Gym + thuis' }[wp?.training_location]} />
            <Badge label="Trainingstijd" value={wp?.training_time} color={C.gold} />
            <Badge label="Cardio" value={{ yes: 'Wil cardio', maybe: 'Misschien', no: 'Geen cardio' }[wp?.cardio_interest]}
              color={wp?.cardio_interest === 'yes' ? C.green : wp?.cardio_interest === 'no' ? C.text25 : null} />
            {wp?.injuries && <Badge label="Blessure (intake)" value={wp.injuries} color={C.red} />}
          </div>

          {/* Dots */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '5px', padding: '16px 0 12px' }}>
            {QUESTIONS.map((_, i) => (
              <div key={i} style={{
                width: i === qIndex ? '22px' : '6px', height: '3px', borderRadius: '2px',
                background: i <= qIndex ? C.blue : 'rgba(255,255,255,0.12)',
                transition: 'all 0.25s',
              }} />
            ))}
          </div>

          {/* Vraag */}
          <div style={{ textAlign: 'center', padding: '0 16px 16px' }}>
            <div style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 800, color: C.text, lineHeight: 1.25, letterSpacing: '-0.02em' }}>
              {currentQ.question}
            </div>
          </div>

          {renderQuestion()}

          {/* Nav — direct onder content */}
          <div style={{ padding: '10px 16px 20px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={qIndex > 0 ? () => setQIndex(qIndex - 1) : onBack} style={{
                width: '44px', height: '44px', background: 'transparent',
                border: `1px solid ${C.border}`, borderRadius: '8px',
                color: C.text25, cursor: 'pointer', fontSize: '16px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', flexShrink: 0,
              }}>←</button>
              <button onClick={isLast ? onComplete : () => setQIndex(qIndex + 1)} style={{
                flex: 1, height: '44px',
                background: isLast ? 'rgba(16,185,129,0.08)' : 'rgba(59,130,246,0.06)',
                border: `1px solid ${isLast ? 'rgba(16,185,129,0.3)' : 'rgba(59,130,246,0.25)'}`,
                borderRadius: '8px', color: isLast ? C.green : C.blue,
                fontSize: '12px', fontWeight: 800,
                cursor: 'pointer', letterSpacing: '0.06em', textTransform: 'uppercase',
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              }}>
                {isLast ? 'Naar voeding' : 'Volgende'} <ChevronRight size={13} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
