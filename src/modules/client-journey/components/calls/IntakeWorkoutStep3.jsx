// src/modules/client-journey/components/calls/IntakeWorkoutStep3.jsx
// Stap 3: Bevestig — samenvatting, notities, acties
import React from 'react'
import { CheckCircle } from 'lucide-react'
import { C, StatBar, NoteField, labels } from './IntakeCallHelpers'

const HERO = 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&q=80'

const SPLIT_ADVICE = {
  2: 'Full Body 2x', 3: 'Full Body 3x', 4: 'Upper/Lower 2x',
  5: 'PPL + Upper/Lower', 6: 'Push/Pull/Legs 2x', 7: 'PPL 2x + Arms'
}

export default function IntakeWorkoutStep3({ cd, wp, stepNotes, setStepNotes, stepActions, setStepActions, isMobile, onBack }) {
  const days = wp?.default_days_per_week || cd.workout_days_per_week || cd.days_per_week || 4
  const advice = SPLIT_ADVICE[days] || SPLIT_ADVICE[4]
  const injuries = wp?.injuries || cd.injuries
  const hasSchema = !!stepNotes.workout_schema

  return (
    <div>
      {/* Hero */}
      <div style={{ position: 'relative', height: '90px', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${HERO})`, backgroundSize: 'cover', backgroundPosition: 'center 40%' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #0a0a0a 0%, rgba(0,0,0,0.3) 50%, transparent 100%)' }} />
        <div style={{ position: 'absolute', bottom: '0.5rem', left: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <CheckCircle size={16} color={C.blue} />
          <span style={{ fontSize: isMobile ? '0.9rem' : '1rem', fontWeight: 800, color: C.text }}>Training bevestigen</span>
        </div>
      </div>

      {/* ── SAMENVATTING ── */}
      <div style={{ padding: '0.4rem 0.75rem 0.15rem', fontSize: '0.4rem', fontWeight: 700, color: C.text25, textTransform: 'uppercase', letterSpacing: '0.06em' }}>SAMENVATTING</div>
      <StatBar isMobile={isMobile} stats={[
        { label: 'DAGEN', value: days, unit: '/week', color: C.gold },
        { label: 'AANBEVELING', value: advice },
        { label: 'ERVARING', value: labels.experience(wp?.default_experience_level || cd.training_experience) },
        { label: 'TRAINING', value: cd.training_time ? cd.training_time.slice(0, 5) : '—' }
      ]} />

      {/* Ingevulde antwoorden */}
      {stepNotes.workout_schema && (
        <div style={{ padding: '0.25rem 0.75rem', borderBottom: `1px solid ${C.borderSub}` }}>
          <div style={{ fontSize: '0.4rem', fontWeight: 700, color: C.text25, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.05rem' }}>GEKOZEN SCHEMA</div>
          <div style={{ fontSize: isMobile ? '0.75rem' : '0.85rem', fontWeight: 700, color: C.gold }}>{stepNotes.workout_schema}</div>
        </div>
      )}
      {stepNotes.workout_days_detail && (
        <div style={{ padding: '0.25rem 0.75rem', borderBottom: `1px solid ${C.borderSub}` }}>
          <div style={{ fontSize: '0.4rem', fontWeight: 700, color: C.text25, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.05rem' }}>TRAININGSDAGEN</div>
          <div style={{ fontSize: isMobile ? '0.7rem' : '0.75rem', fontWeight: 600, color: C.text50 }}>{stepNotes.workout_days_detail}</div>
        </div>
      )}
      {stepNotes.workout_adjustments && (
        <div style={{ padding: '0.25rem 0.75rem', borderBottom: `1px solid ${C.borderSub}` }}>
          <div style={{ fontSize: '0.4rem', fontWeight: 700, color: C.text25, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.05rem' }}>AANPASSINGEN</div>
          <div style={{ fontSize: isMobile ? '0.7rem' : '0.75rem', fontWeight: 600, color: C.text50 }}>{stepNotes.workout_adjustments}</div>
        </div>
      )}

      {/* Blessure reminder */}
      {injuries && (
        <div style={{ borderLeft: `3px solid ${C.red}` }}>
          <div style={{ padding: '0.3rem 0.75rem 0.15rem', fontSize: '0.4rem', fontWeight: 700, color: C.red, textTransform: 'uppercase', letterSpacing: '0.06em' }}>ONTHOUD BIJ SCHEMA</div>
          <div style={{ padding: '0.15rem 0.75rem 0.3rem', borderBottom: `1px solid ${C.borderSub}`, fontSize: isMobile ? '0.65rem' : '0.7rem', fontWeight: 700, color: C.red }}>
            Blessures: {injuries}
          </div>
        </div>
      )}

      {/* ── NOTITIES & ACTIES ── */}
      <NoteField label="NOTITIES TRAINING" value={stepNotes.workout} onChange={v => setStepNotes(p => ({ ...p, workout: v }))} isMobile={isMobile} />
      <NoteField label="ACTIES" value={stepActions.workout} onChange={v => setStepActions(p => ({ ...p, workout: v }))} color={C.gold} placeholder="Bijv: PPL schema toewijzen, knie-oefeningen aanpassen..." isMobile={isMobile} />

      {/* Navigation */}
      <div style={{ display: 'flex', gap: '0.5rem', padding: isMobile ? '0.75rem' : '1rem' }}>
        <button onClick={onBack} style={{
          padding: '0.625rem 1rem', background: 'transparent', border: `1px solid ${C.border}`,
          borderRadius: 0, color: C.text50, fontSize: isMobile ? '0.7rem' : '0.75rem', fontWeight: 700,
          cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: '44px'
        }}>← TERUG</button>
        <div style={{
          flex: 1, padding: '0.625rem', textAlign: 'center',
          background: hasSchema ? 'rgba(59,130,246,0.06)' : 'rgba(255,255,255,0.02)',
          border: `1px solid ${hasSchema ? 'rgba(59,130,246,0.2)' : C.borderSub}`,
          borderRadius: 0, minHeight: '44px',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <span style={{ fontSize: isMobile ? '0.7rem' : '0.75rem', fontWeight: 800, color: hasSchema ? C.blue : C.text25 }}>
            {hasSchema ? `✓ TRAINING AFGEROND — ${stepNotes.workout_schema}` : 'VUL EERST SCHEMA IN (STAP 2)'}
          </span>
        </div>
      </div>
    </div>
  )
}
