// src/modules/client-journey/components/calls/IntakeGoalStep1.jsx
import React from 'react'
import { Target } from 'lucide-react'
import { C } from './IntakeCallHelpers'

const HERO = 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80'

const GOAL_LABELS = { fat_loss: 'Afvallen', muscle_gain: 'Spieropbouw', recomp: 'Body Recomp', general_fitness: 'Fitter worden' }
const ACTIVITY_LABELS = { sedentary: 'Zittend', lightly_active: 'Licht actief', moderately_active: 'Matig actief', very_active: 'Zeer actief' }
const COACHING_LABELS = { direct: 'Hard & direct', motivating: 'Motiverend', data_driven: 'Data-driven', relaxed: 'Relaxed' }
const TIMELINE_LABELS = { '3': '3 maanden', '6': '6 maanden', '12': '12 maanden', no_rush: 'Geen haast' }
const WORK_TYPE_LABELS = { kantoor: 'Kantoor', thuis: 'Thuis', horeca: 'Horeca', fysiek: 'Fysiek', student: 'Student', wisselend: 'Wisselend', anders: 'Anders' }

export default function IntakeGoalStep1({ cd, qNotes, updateQ, isMobile, onNext }) {
  const age = cd.date_of_birth
    ? Math.floor((Date.now() - new Date(cd.date_of_birth)) / 31557600000)
    : cd.age

  const isCut = ['fat_loss', 'recomp', 'general_fitness'].includes(cd.primary_goal)
  const kgDiff = cd.current_weight && (cd.target_weight || cd.goal_weight)
    ? Math.abs(Number(cd.current_weight) - Number(cd.target_weight || cd.goal_weight)).toFixed(1)
    : null

  const bodyFat = cd.current_body_fat || cd.current_body_fat_2
  const targetBf = cd.target_body_fat

  const deadlineStr = (() => {
    const d = cd.goal_deadline
    const tl = cd.goal_timeline ? TIMELINE_LABELS[cd.goal_timeline] || cd.goal_timeline : null
    if (!d && !tl) return null
    if (tl && !d) return tl
    if (d && tl) return `${d} · ${tl}`
    if (d) {
      const diff = Math.round((new Date(d) - new Date()) / (30.44 * 24 * 60 * 60 * 1000))
      return diff > 0 ? `${d} (~${diff} mnd)` : d
    }
    return null
  })()

  const workScheduleSummary = (() => {
    try {
      const raw = cd.work_schedule
      if (!raw) return null
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
      if (!Array.isArray(parsed) || parsed.length === 0) return null
      return parsed.map(b => {
        const days = (b.days || []).map(d => d.toUpperCase()).join(' ')
        const type = WORK_TYPE_LABELS[b.work_type] || b.work_type || ''
        const time = b.start_time && b.end_time ? `${b.start_time.slice(0,5)}–${b.end_time.slice(0,5)}` : ''
        return [days, time, type].filter(Boolean).join(' ')
      }).join(' | ')
    } catch { return null }
  })()

  const prefDays = (() => {
    try {
      const raw = cd.preferred_training_days
      if (!raw) return null
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
      if (!Array.isArray(parsed)) return null
      if (parsed[0] === 'flexible') return 'Flexibel'
      return parsed.map(d => d.toUpperCase()).join(', ')
    } catch { return null }
  })()

  return (
    <div>
      {/* Hero */}
      <div style={{ position: 'relative', height: '100px', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${HERO})`, backgroundSize: 'cover', backgroundPosition: 'center 30%' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #0a0a0a 0%, rgba(0,0,0,0.3) 50%, transparent 100%)' }} />
        <div style={{ position: 'absolute', bottom: '0.5rem', left: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Target size={16} color={C.gold} />
          <span style={{ fontSize: isMobile ? '0.9rem' : '1rem', fontWeight: 800, color: C.text }}>Wat is het doel?</span>
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ background: 'rgba(255,215,0,0.02)', borderBottom: `1px solid rgba(255,215,0,0.15)` }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
          <Stat label="HUIDIG GEWICHT" value={cd.current_weight ? `${cd.current_weight} kg` : '—'} isMobile={isMobile} />
          <Stat label="DOEL GEWICHT" value={(cd.target_weight || cd.goal_weight) ? `${cd.target_weight || cd.goal_weight} kg` : '—'} color={C.gold} isMobile={isMobile} border />
          <Stat label={isCut ? 'TE VERLIEZEN' : 'AAN TE KOMEN'} value={kgDiff ? `${kgDiff} kg` : '—'} color={C.gold} isMobile={isMobile} top />
          <Stat label="DOEL TYPE" value={GOAL_LABELS[cd.primary_goal] || cd.primary_goal || '—'} color={C.gold} isMobile={isMobile} border top />
        </div>

        {(bodyFat || targetBf) && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderTop: `1px solid rgba(255,255,255,0.04)` }}>
            <Stat label="HUIDIG VET %" value={bodyFat ? `${bodyFat}%` : '—'} color={bodyFat > 25 ? C.amber : undefined} isMobile={isMobile} />
            <Stat label="DOEL VET %" value={targetBf ? `${targetBf}%` : '—'} color={C.gold} isMobile={isMobile} border />
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderTop: `1px solid rgba(255,255,255,0.04)` }}>
          <Stat label="LEEFTIJD" value={age ? `${age} jr` : '—'} isMobile={isMobile} />
          <Stat label="GESLACHT" value={cd.gender === 'male' ? 'Man' : cd.gender === 'female' ? 'Vrouw' : '—'} isMobile={isMobile} border />
          <Stat label="LENGTE" value={cd.height ? `${cd.height} cm` : '—'} isMobile={isMobile} border />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderTop: `1px solid rgba(255,255,255,0.04)` }}>
          <Stat label="URGENTIE" value={cd.goal_urgency ? `${cd.goal_urgency}/10` : '—'} color={parseInt(cd.goal_urgency) >= 8 ? C.gold : undefined} isMobile={isMobile} />
          <Stat label="TIJDLIJN" value={deadlineStr || '—'} isMobile={isMobile} border />
          <Stat label="ACTIVITEIT" value={ACTIVITY_LABELS[cd.activity_level] || '—'} isMobile={isMobile} border />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderTop: `1px solid rgba(255,255,255,0.04)` }}>
          <Stat label="TDEE" value={cd.tdee || '—'} unit={cd.tdee ? 'kcal' : ''} isMobile={isMobile} />
          <Stat label="TARGET" value={cd.target_calories || cd.calorie_target || '—'} unit={(cd.target_calories || cd.calorie_target) ? 'kcal' : ''} color={C.gold} isMobile={isMobile} border />
          <Stat label="SLAAP / STRESS" value={(cd.sleep_hours || cd.stress_level) ? `${cd.sleep_hours || '?'}u · ${cd.stress_level || '?'}/10` : '—'} color={(parseFloat(cd.sleep_hours) < 7 || parseInt(cd.stress_level) >= 7) ? C.amber : undefined} isMobile={isMobile} border />
        </div>
      </div>

      {/* Intake tekstvelden */}
      {[
        { label: 'MOTIVATIE', value: cd.motivation, accent: C.gold },
        { label: 'GROOTSTE OBSTAKEL', value: cd.biggest_obstacle, accent: C.red, borderLeft: true },
        { label: 'VERWACHT VAN COACHING', value: cd.coaching_expectations, accent: C.gold },
        { label: 'NAAST FYSIEK DOEL', value: cd.coaching_goals_extra, accent: C.gold },
        { label: 'EERDERE COACHING', value: cd.previous_coaching, accent: C.text25 },
        { label: 'COACHING STIJL', value: COACHING_LABELS[cd.coaching_style_pref] || cd.coaching_style_pref, accent: C.gold, bold: true },
        { label: 'MEDISCH', value: cd.medical_conditions, accent: C.red, borderLeft: true },
      ].filter(r => r.value).map(row => (
        <div key={row.label} style={{
          padding: isMobile ? '0.5rem 0.75rem' : '0.625rem 1rem',
          borderBottom: `1px solid rgba(255,255,255,0.04)`,
          borderLeft: row.borderLeft ? `3px solid ${row.accent}` : undefined
        }}>
          <div style={{ fontSize: '0.4rem', fontWeight: 700, color: row.accent, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.15rem' }}>{row.label}</div>
          <div style={{ fontSize: isMobile ? '0.75rem' : '0.85rem', fontWeight: row.bold ? 700 : 600, color: row.bold ? row.accent : 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
            {row.bold ? row.value : `"${row.value}"`}
          </div>
        </div>
      ))}

      {/* Gespreksvragen met volledige DATA prefill */}
      <PrefQ
        q="Klopt dit doel? Wat wil je echt bereiken?"
        prefill={[
          cd.primary_goal && `Doel: ${GOAL_LABELS[cd.primary_goal] || cd.primary_goal}`,
          (cd.target_weight || cd.goal_weight) && `Naar: ${cd.target_weight || cd.goal_weight} kg`,
          kgDiff && `${isCut ? 'Te verliezen' : 'Aan te komen'}: ${kgDiff} kg`,
          bodyFat && `Huidig vet%: ${bodyFat}%`,
          targetBf && `Doel vet%: ${targetBf}%`,
          deadlineStr && `Tijdlijn: ${deadlineStr}`,
          cd.goal_urgency && `Urgentie: ${cd.goal_urgency}/10`,
        ].filter(Boolean)}
        value={qNotes?.goal_check}
        onChange={v => updateQ('goal_check', v)}
        isMobile={isMobile}
      />

      <PrefQ
        q="Waarom nu? Wat is er veranderd?"
        prefill={[
          cd.goal_urgency && `Urgentie: ${cd.goal_urgency}/10`,
          cd.motivation && `Motivatie: "${cd.motivation.slice(0, 100)}${cd.motivation.length > 100 ? '...' : ''}"`,
          cd.previous_coaching && `Eerder geprobeerd: "${cd.previous_coaching.slice(0, 80)}${cd.previous_coaching.length > 80 ? '...' : ''}"`,
        ].filter(Boolean)}
        value={qNotes?.goal_why_now}
        onChange={v => updateQ('goal_why_now', v)}
        isMobile={isMobile}
      />

      <PrefQ
        q="Waar sta je over een jaar als dit lukt?"
        prefill={[
          cd.coaching_goals_extra && `Naast fysiek: "${cd.coaching_goals_extra.slice(0, 100)}${cd.coaching_goals_extra.length > 100 ? '...' : ''}"`,
          cd.coaching_expectations && `Verwachting: "${cd.coaching_expectations.slice(0, 80)}${cd.coaching_expectations.length > 80 ? '...' : ''}"`,
        ].filter(Boolean)}
        value={qNotes?.goal_longterm}
        onChange={v => updateQ('goal_longterm', v)}
        isMobile={isMobile}
      />

      <PrefQ
        q="Wat is je grootste angst / blokkade?"
        prefill={[
          cd.biggest_obstacle && `Obstakel: "${cd.biggest_obstacle.slice(0, 100)}${cd.biggest_obstacle.length > 100 ? '...' : ''}"`,
          cd.previous_coaching && `Eerder geprobeerd: "${cd.previous_coaching.slice(0, 60)}${cd.previous_coaching.length > 60 ? '...' : ''}"`,
        ].filter(Boolean)}
        value={qNotes?.goal_obstacle}
        onChange={v => updateQ('goal_obstacle', v)}
        isMobile={isMobile}
      />

      <PrefQ
        q="Hoe ziet je dagelijkse routine eruit?"
        prefill={[
          ACTIVITY_LABELS[cd.activity_level] && `Activiteit: ${ACTIVITY_LABELS[cd.activity_level]}`,
          workScheduleSummary && `Werkschema: ${workScheduleSummary}`,
          cd.sleep_hours && `Slaap: ${cd.sleep_hours} uur`,
          cd.stress_level && `Stress: ${cd.stress_level}/10`,
          prefDays && `Wil trainen op: ${prefDays}`,
        ].filter(Boolean)}
        value={qNotes?.goal_routine}
        onChange={v => updateQ('goal_routine', v)}
        isMobile={isMobile}
      />

      <PrefQ
        q="Hoe wil je begeleid worden?"
        prefill={[
          cd.coaching_style_pref && `Voorkeur stijl: ${COACHING_LABELS[cd.coaching_style_pref] || cd.coaching_style_pref}`,
          cd.coaching_expectations && `Verwacht: "${cd.coaching_expectations.slice(0, 80)}${cd.coaching_expectations.length > 80 ? '...' : ''}"`,
        ].filter(Boolean)}
        value={qNotes?.goal_coaching_style}
        onChange={v => updateQ('goal_coaching_style', v)}
        isMobile={isMobile}
      />

      <div style={{ padding: isMobile ? '0.75rem' : '1rem' }}>
        <button onClick={onNext} style={{
          width: '100%', padding: '0.625rem',
          background: `linear-gradient(90deg, ${C.gold}, #D4AF37)`,
          border: 'none', borderRadius: 0, color: '#000',
          fontSize: isMobile ? '0.75rem' : '0.85rem', fontWeight: 800,
          cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          minHeight: '44px'
        }}>DOEL BESPROKEN → PLAN KIEZEN</button>
      </div>
    </div>
  )
}

function PrefQ({ q, prefill = [], value, onChange, isMobile }) {
  return (
    <div style={{ padding: isMobile ? '0.5rem 0.75rem' : '0.625rem 1rem', borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
      <div style={{ fontSize: isMobile ? '0.85rem' : '0.95rem', fontWeight: 700, color: '#fff', lineHeight: 1.35, marginBottom: prefill.length ? '0.25rem' : '0.3rem' }}>
        {q}
      </div>
      {prefill.length > 0 && (
        <div style={{ marginBottom: '0.3rem', display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
          {prefill.map((p, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.25rem' }}>
              <span style={{ fontSize: '0.35rem', fontWeight: 700, color: C.gold, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.12rem', flexShrink: 0 }}>DATA</span>
              <span style={{ fontSize: isMobile ? '0.68rem' : '0.72rem', fontWeight: 600, color: C.gold, lineHeight: 1.4 }}>{p}</span>
            </div>
          ))}
        </div>
      )}
      <textarea
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder="Notitie / aanvulling..."
        rows={2}
        style={{
          width: '100%', padding: '0.2rem 0', background: 'transparent',
          border: 'none', borderBottom: `1px solid ${value ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)'}`,
          color: '#fff', fontSize: isMobile ? '0.7rem' : '0.75rem', fontWeight: 600,
          outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
          resize: 'none', lineHeight: 1.5, borderRadius: 0
        }}
      />
    </div>
  )
}

function Stat({ label, value, unit, color, isMobile, border, top }) {
  return (
    <div style={{
      padding: isMobile ? '0.375rem 0.5rem' : '0.5rem 0.625rem',
      borderRight: border ? `1px solid rgba(255,255,255,0.04)` : 'none',
      borderTop: top ? `1px solid rgba(255,255,255,0.04)` : 'none'
    }}>
      <div style={{ fontSize: '0.38rem', fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.08rem' }}>{label}</div>
      <div style={{ fontSize: isMobile ? '0.72rem' : '0.82rem', fontWeight: 800, color: color || '#fff', lineHeight: 1 }}>
        {value ?? '—'}
        {unit && <span style={{ fontSize: '0.38rem', fontWeight: 500, opacity: 0.4, marginLeft: '0.08rem' }}>{unit}</span>}
      </div>
    </div>
  )
}
