// src/modules/client-journey/components/calls/IntakeWorkoutStep1.jsx
// v2 — Added: preferred_training_days (client), training_days (client), work_schedule context
import React from 'react'
import { Dumbbell } from 'lucide-react'
import { C, StatBar, labels } from './IntakeCallHelpers'

const HERO = 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80'

const SPLIT_ADVICE = {
  2: { rec: 'Full Body 2x', why: '2 dagen = full body, elke spiergroep 2x/week' },
  3: { rec: 'Full Body 3x', why: '3 dagen = elke spiergroep 3x/week, ideaal voor beginners' },
  4: { rec: 'Upper/Lower 2x', why: '4 dagen = 2x upper + 2x lower, goed volume' },
  5: { rec: 'PPL + Upper/Lower', why: '5 dagen = Push/Pull/Legs + Upper/Lower' },
  6: { rec: 'Push/Pull/Legs 2x', why: '6 dagen = elke spiergroep 2x/week met PPL' },
  7: { rec: 'PPL 2x + Arms', why: '7 dagen = PPL 2x + extra arm/zwak punt dag' }
}

const EQ_LABELS = { barbell: 'Barbell', dumbbells: 'Dumbbells', cables: 'Cables', machines: 'Machines', pullup_bar: 'Pull-up bar', resistance_bands: 'Bands', kettlebell: 'Kettlebell', bodyweight: 'Bodyweight' }
const CARDIO_LABELS = { walking: 'Wandelen', running: 'Hardlopen', cycling: 'Fietsen', swimming: 'Zwemmen', rowing: 'Roeien', stairmaster: 'Stairmaster', hiit: 'HIIT', sports: 'Sport', jump_rope: 'Touwtje springen', incline_walk: 'Incline walking' }
const DAY_LABELS = { ma: 'MA', di: 'DI', wo: 'WO', do: 'DO', vr: 'VR', za: 'ZA', zo: 'ZO', flexible: 'Flexibel', monday: 'MA', tuesday: 'DI', wednesday: 'WO', thursday: 'DO', friday: 'VR', saturday: 'ZA', sunday: 'ZO' }

export default function IntakeWorkoutStep1({ cd, wp, isMobile, onNext }) {
  const days = wp?.default_days_per_week || cd.workout_days_per_week || cd.days_per_week || 4
  const advice = SPLIT_ADVICE[days] || SPLIT_ADVICE[4]
  const equipment = wp?.default_equipment || []
  const cardioTypes = wp?.cardio_types || []
  const injuries = wp?.injuries || cd.injuries

  // Preferred training days — from client table (JSONB) or wp
  const prefDays = (() => {
    try {
      const raw = cd.preferred_training_days || cd.training_days
      if (!raw) return []
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
      if (Array.isArray(parsed)) return parsed
      return []
    } catch { return [] }
  })()

  // Work schedule — show conflict warnings
  const workSchedule = (() => {
    try {
      const raw = cd.work_schedule
      if (!raw) return []
      return typeof raw === 'string' ? JSON.parse(raw) : raw
    } catch { return [] }
  })()

  return (
    <div>
      {/* Hero */}
      <div style={{ position: 'relative', height: '90px', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${HERO})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #0a0a0a 0%, rgba(0,0,0,0.3) 50%, transparent 100%)' }} />
        <div style={{ position: 'absolute', bottom: '0.5rem', left: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Dumbbell size={16} color={C.blue} />
          <span style={{ fontSize: isMobile ? '0.9rem' : '1rem', fontWeight: 800, color: C.text }}>Training overzicht</span>
        </div>
      </div>

      {/* ── BASIS ── */}
      <Label text="BASIS" />
      <StatBar isMobile={isMobile} stats={[
        { label: 'ERVARING', value: labels.experience(wp?.default_experience_level || cd.training_experience) },
        { label: 'DAGEN', value: days, unit: '/week', color: C.gold },
        { label: 'DUUR', value: wp?.default_time_per_session || cd.minutes_per_session || '—', unit: 'min' },
        { label: 'TRAINING', value: cd.training_time ? cd.training_time.slice(0, 5) : '—' }
      ]} />
      <StatBar isMobile={isMobile} stats={[
        { label: 'VOORKEUR', value: labels.split(wp?.split_preferences?.preferred), color: C.gold },
        { label: 'FOCUS', value: labels.focus(wp?.split_preferences?.focus) },
        { label: 'GYM', value: wp?.gym_name || cd.gym_name || '—' },
        { label: 'LOCATIE', value: wp?.training_location || '—' }
      ]} />

      {/* ── VOORKEUR DAGEN ── */}
      {prefDays.length > 0 && (
        <>
          <Label text="VOORKEUR TRAININGSDAGEN" color={C.gold} />
          <div style={{ padding: '0.25rem 0.75rem 0.35rem', borderBottom: `1px solid ${C.borderSub}`, display: 'flex', flexWrap: 'wrap', gap: '0.2rem' }}>
            {prefDays[0] === 'flexible'
              ? <span style={{ fontSize: isMobile ? '0.7rem' : '0.75rem', fontWeight: 700, color: C.gold }}>Flexibel</span>
              : prefDays.map(d => (
                <span key={d} style={{
                  fontSize: isMobile ? '0.6rem' : '0.65rem', fontWeight: 800,
                  padding: '0.1rem 0.35rem',
                  background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.2)',
                  color: C.gold
                }}>{DAY_LABELS[d] || d.toUpperCase()}</span>
              ))
            }
          </div>
        </>
      )}

      {/* ── WERKSCHEMA CONFLICT CHECK ── */}
      {workSchedule.length > 0 && prefDays.length > 0 && prefDays[0] !== 'flexible' && (
        <WorkConflictCheck workSchedule={workSchedule} prefDays={prefDays} isMobile={isMobile} />
      )}

      {/* ── SPLIT AANBEVELING ── */}
      <Label text={`AANBEVELING VOOR ${days} DAGEN`} />
      <div style={{ padding: '0.3rem 0.75rem 0.4rem', borderBottom: `1px solid ${C.borderSub}` }}>
        <div style={{ fontSize: isMobile ? '1rem' : '1.1rem', fontWeight: 800, color: C.gold, marginBottom: '0.05rem' }}>{advice.rec}</div>
        <div style={{ fontSize: isMobile ? '0.6rem' : '0.65rem', color: C.text25 }}>{advice.why}</div>
        {wp?.split_preferences?.preferred && wp.split_preferences.preferred !== 'no_preference' && wp.split_preferences.preferred !== 'dont_know' && (
          <div style={{ fontSize: isMobile ? '0.6rem' : '0.65rem', color: C.text50, marginTop: '0.1rem' }}>
            Client voorkeur: <span style={{ color: C.gold, fontWeight: 800 }}>{labels.split(wp.split_preferences.preferred)}</span>
          </div>
        )}
      </div>

      {/* ── EQUIPMENT ── */}
      {equipment.length > 0 && (
        <>
          <Label text="BESCHIKBARE UITRUSTING" />
          <div style={{ padding: '0.25rem 0.75rem 0.35rem', borderBottom: `1px solid ${C.borderSub}`, display: 'flex', flexWrap: 'wrap', gap: '0.15rem' }}>
            {equipment.map(eq => (
              <span key={eq} style={{
                fontSize: isMobile ? '0.55rem' : '0.6rem', fontWeight: 700,
                padding: '0.08rem 0.25rem',
                background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)',
                color: C.blue
              }}>{EQ_LABELS[eq] || eq}</span>
            ))}
          </div>
        </>
      )}

      {/* ── CARDIO ── */}
      <Label text="CARDIO" />
      {wp?.cardio_interest && wp.cardio_interest !== 'no' ? (
        <div>
          <StatBar isMobile={isMobile} stats={[
            { label: 'INTERESSE', value: wp.cardio_interest === 'yes' ? 'Ja' : 'Misschien' },
            { label: 'FREQUENTIE', value: wp.cardio_frequency ? `${wp.cardio_frequency}x` : '—', unit: '/week' },
            { label: 'DUUR', value: wp.cardio_duration || '—', unit: 'min' }
          ]} />
          {cardioTypes.length > 0 && (
            <div style={{ padding: '0.25rem 0.75rem 0.35rem', borderBottom: `1px solid ${C.borderSub}`, display: 'flex', flexWrap: 'wrap', gap: '0.15rem' }}>
              {cardioTypes.map(ct => (
                <span key={ct} style={{
                  fontSize: isMobile ? '0.55rem' : '0.6rem', fontWeight: 700,
                  padding: '0.08rem 0.25rem',
                  background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)',
                  color: C.green
                }}>{CARDIO_LABELS[ct] || ct}</span>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div style={{ padding: '0.25rem 0.75rem 0.35rem', borderBottom: `1px solid ${C.borderSub}`, fontSize: isMobile ? '0.65rem' : '0.7rem', color: C.text25 }}>
          {wp?.cardio_interest === 'no' ? 'Geen cardio gewenst' : 'Niet ingevuld'}
        </div>
      )}

      {/* ── BLESSURES ── */}
      {injuries && (
        <div style={{ borderLeft: `3px solid ${C.red}` }}>
          <Label text="BLESSURES & BEPERKINGEN" color={C.red} />
          <Row label="BLESSURES" value={injuries} color={C.red} isMobile={isMobile} />
          {wp?.avoided_exercises && <Row label="VERMIJDE OEFENINGEN" value={wp.avoided_exercises} color={C.red} isMobile={isMobile} />}
          {wp?.other_limitations && <Row label="ANDERE BEPERKINGEN" value={wp.other_limitations} color={C.amber} isMobile={isMobile} />}
        </div>
      )}

      {(wp?.emphasize_stretch || wp?.prioritize_compounds) && (
        <div style={{ padding: '0.25rem 0.75rem', borderBottom: `1px solid ${C.borderSub}` }}>
          {wp?.emphasize_stretch && <Row label="STRETCHING" value="Ja, gewenst" color={C.green} isMobile={isMobile} />}
          {wp?.prioritize_compounds && <Row label="COMPOUNDS" value="Focus op compounds" color={C.green} isMobile={isMobile} />}
        </div>
      )}

      <div style={{ padding: isMobile ? '0.75rem' : '1rem' }}>
        <button onClick={onNext} style={{
          width: '100%', padding: '0.625rem',
          background: `linear-gradient(90deg, ${C.blue}, #2563eb)`,
          border: 'none', borderRadius: 0, color: '#fff',
          fontSize: isMobile ? '0.75rem' : '0.85rem', fontWeight: 800,
          cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          minHeight: '44px'
        }}>DATA BEKEKEN → TRAINING BESPREKEN</button>
      </div>
    </div>
  )
}

// Conflict check: werkdagen vs trainingsdagen
function WorkConflictCheck({ workSchedule, prefDays, isMobile }) {
  const DAY_MAP = { ma: 'monday', di: 'tuesday', wo: 'wednesday', do: 'thursday', vr: 'friday', za: 'saturday', zo: 'sunday' }
  const workDays = workSchedule.flatMap(ws => ws.days || [])
  const conflicts = prefDays.filter(d => workDays.includes(d) || workDays.includes(DAY_MAP[d]))
  if (!conflicts.length) return null
  return (
    <div style={{ padding: '0.3rem 0.75rem', borderBottom: `1px solid ${C.borderSub}`, borderLeft: `3px solid ${C.amber}`, background: 'rgba(245,158,11,0.02)' }}>
      <div style={{ fontSize: '0.4rem', fontWeight: 700, color: C.amber, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.05rem' }}>SCHEMACONFLICT</div>
      <div style={{ fontSize: isMobile ? '0.65rem' : '0.7rem', fontWeight: 600, color: C.amber }}>
        Werkt ook op: {conflicts.map(d => ({ ma: 'MA', di: 'DI', wo: 'WO', do: 'DO', vr: 'VR', za: 'ZA', zo: 'ZO' }[d] || d.toUpperCase())).join(', ')} — bespreken of dat past
      </div>
    </div>
  )
}

function Label({ text, color }) {
  return <div style={{ padding: '0.4rem 0.75rem 0.15rem', fontSize: '0.4rem', fontWeight: 700, color: color || C.text25, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{text}</div>
}

function Row({ label, value, color, isMobile }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '0.2rem 0.75rem', borderBottom: `1px solid ${C.borderFaint}` }}>
      <span style={{ fontSize: '0.4rem', fontWeight: 700, color: C.text25, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      <span style={{ fontSize: isMobile ? '0.7rem' : '0.75rem', fontWeight: 700, color: color || C.text50, textAlign: 'right', maxWidth: '65%' }}>{value}</span>
    </div>
  )
}
