// src/modules/client-journey/components/calls/IntakeWorkoutStep2.jsx
import React from 'react'
import { MessageCircle } from 'lucide-react'
import { C, labels } from './IntakeCallHelpers'

const HERO = 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80'

const SPLIT_ADVICE = {
  2: 'Full Body 2x', 3: 'Full Body 3x', 4: 'Upper/Lower 2x',
  5: 'PPL + Upper/Lower', 6: 'Push/Pull/Legs 2x', 7: 'PPL 2x + Arms'
}

const CARDIO_LABELS = {
  walking: 'Wandelen', running: 'Hardlopen', cycling: 'Fietsen', swimming: 'Zwemmen',
  rowing: 'Roeien', stairmaster: 'Stairmaster', hiit: 'HIIT', sports: 'Sport',
  jump_rope: 'Touwtje springen', incline_walk: 'Incline walking'
}

const EQ_LABELS = {
  barbell: 'Barbell', dumbbells: 'Dumbbells', cables: 'Cables', machines: 'Machines',
  pullup_bar: 'Pull-up bar', resistance_bands: 'Bands', kettlebell: 'Kettlebell', bodyweight: 'Bodyweight'
}

const DAY_LABELS = { ma: 'MA', di: 'DI', wo: 'WO', do: 'DO', vr: 'VR', za: 'ZA', zo: 'ZO', flexible: 'Flexibel' }

export default function IntakeWorkoutStep2({ cd, wp, stepNotes, setStepNotes, isMobile, onNext, onBack }) {
  const days = wp?.default_days_per_week || cd.workout_days_per_week || cd.days_per_week || 4
  const advice = SPLIT_ADVICE[days] || SPLIT_ADVICE[4]
  const injuries = wp?.injuries || cd.injuries
  const cardioTypes = wp?.cardio_types || []
  const equipment = wp?.default_equipment || []

  const prefDays = (() => {
    try {
      const raw = cd.preferred_training_days || cd.training_days
      if (!raw) return []
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
      return Array.isArray(parsed) ? parsed : []
    } catch { return [] }
  })()

  const points = [
    `Client wil ${labels.split(wp?.split_preferences?.preferred)} — past bij ${days} dagen?`,
    `Aanbeveling: ${advice} — akkoord?`,
    injuries ? `Blessures: ${injuries} — welke oefeningen aanpassen?` : null,
    'Progressie systeem uitleggen (progressive overload)',
    'Specifieke doelen? (PRs, spiergroepen extra trainen)',
    wp?.cardio_interest === 'yes' ? `Cardio inplannen: ${wp.cardio_frequency}x ${wp.cardio_duration}min` : wp?.cardio_interest === 'maybe' ? 'Cardio bespreken — misschien interessant?' : 'Cardio: client wil liever niet',
    'Deload weken inplannen? (elke 4-6 weken)',
    `Training tijd: ${cd.training_time ? cd.training_time.slice(0, 5) : '?'} — past bij schema?`
  ].filter(Boolean)

  return (
    <div>
      {/* Hero */}
      <div style={{ position: 'relative', height: '90px', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${HERO})`, backgroundSize: 'cover', backgroundPosition: 'center 30%' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #0a0a0a 0%, rgba(0,0,0,0.3) 50%, transparent 100%)' }} />
        <div style={{ position: 'absolute', bottom: '0.5rem', left: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <MessageCircle size={16} color={C.gold} />
          <span style={{ fontSize: isMobile ? '0.9rem' : '1rem', fontWeight: 800, color: C.text }}>Training bespreken</span>
        </div>
      </div>

      {/* Bespreekpunten */}
      <div style={{ padding: '0.4rem 0.75rem 0.15rem', fontSize: '0.4rem', fontWeight: 700, color: C.text25, textTransform: 'uppercase', letterSpacing: '0.06em' }}>BESPREEKPUNTEN</div>
      <div style={{ padding: '0.2rem 0.75rem 0.3rem', borderBottom: `1px solid ${C.borderSub}` }}>
        {points.map((item, i) => (
          <div key={i} style={{ fontSize: isMobile ? '0.7rem' : '0.75rem', fontWeight: 600, color: C.text50, padding: '0.15rem 0', borderBottom: i < points.length - 1 ? `1px solid ${C.borderFaint}` : 'none' }}>
            <span style={{ color: C.gold, marginRight: '0.25rem' }}>•</span>{item}
          </div>
        ))}
      </div>

      {/* Vragen MET prefill */}
      <PrefQ
        q="Welk schema ga je toewijzen?"
        prefill={[
          `Aanbeveling: ${advice} voor ${days} dagen/week`,
          wp?.split_preferences?.preferred && wp.split_preferences.preferred !== 'no_preference' && wp.split_preferences.preferred !== 'dont_know'
            ? `Client voorkeur: ${labels.split(wp.split_preferences.preferred)}`
            : null,
          wp?.split_preferences?.focus && wp.split_preferences.focus !== 'no_preference'
            ? `Focus: ${labels.focus(wp.split_preferences.focus)}`
            : null,
          wp?.prioritize_compounds ? 'Compounds prioriteit gewenst' : null,
          wp?.emphasize_stretch ? 'Stretching gewenst' : null,
        ].filter(Boolean)}
        value={stepNotes.workout_schema}
        onChange={v => setStepNotes(p => ({ ...p, workout_schema: v }))}
        isMobile={isMobile}
      />
      <PrefQ
        q="Welke dagen gaat de client trainen?"
        prefill={[
          prefDays.length > 0 && prefDays[0] !== 'flexible'
            ? `Voorkeur: ${prefDays.map(d => DAY_LABELS[d] || d.toUpperCase()).join(', ')}`
            : prefDays[0] === 'flexible' ? 'Voorkeur: Flexibel' : null,
          cd.training_time ? `Trainingstijd: ${cd.training_time.slice(0, 5)}` : null,
          wp?.default_time_per_session ? `Sessieduur: ${wp.default_time_per_session} min` : null,
          wp?.gym_name ? `Gym: ${wp.gym_name}` : null,
        ].filter(Boolean)}
        value={stepNotes.workout_days_detail}
        onChange={v => setStepNotes(p => ({ ...p, workout_days_detail: v }))}
        isMobile={isMobile}
      />
      <PrefQ
        q="Moeten er oefeningen aangepast worden ivm blessures?"
        prefill={[
          injuries ? `Blessures: ${injuries}` : null,
          wp?.avoided_exercises ? `Vermijdt: ${wp.avoided_exercises}` : null,
          wp?.other_limitations ? `Beperkingen: ${wp.other_limitations}` : null,
        ].filter(Boolean)}
        value={stepNotes.workout_adjustments}
        onChange={v => setStepNotes(p => ({ ...p, workout_adjustments: v }))}
        isMobile={isMobile}
      />
      <PrefQ
        q="Cardio — wat gaan we doen?"
        prefill={[
          wp?.cardio_interest === 'yes' ? 'Wil cardio ✓' : wp?.cardio_interest === 'maybe' ? 'Staat open voor cardio' : wp?.cardio_interest === 'no' ? 'Liever geen cardio' : null,
          wp?.cardio_frequency ? `${wp.cardio_frequency}x per week` : null,
          wp?.cardio_duration ? `${wp.cardio_duration} min per sessie` : null,
          cardioTypes.length > 0 ? `Voorkeur: ${cardioTypes.map(t => CARDIO_LABELS[t] || t).join(', ')}` : null,
        ].filter(Boolean)}
        value={stepNotes.workout_cardio}
        onChange={v => setStepNotes(p => ({ ...p, workout_cardio: v }))}
        isMobile={isMobile}
      />
      <PrefQ
        q="Beschikbare uitrusting — klopt dit?"
        prefill={[
          equipment.length > 0 ? `Opgegeven: ${equipment.map(e => EQ_LABELS[e] || e).join(', ')}` : 'Geen uitrusting opgegeven',
          wp?.training_location ? `Locatie: ${{ gym: 'Gym', home: 'Thuis', both: 'Mix' }[wp.training_location] || wp.training_location}` : null,
        ].filter(Boolean)}
        value={stepNotes.workout_equipment}
        onChange={v => setStepNotes(p => ({ ...p, workout_equipment: v }))}
        isMobile={isMobile}
      />
      <PrefQ
        q="Specifieke doelen voor de training? (PRs, spiergroepen)"
        prefill={[
          wp?.split_preferences?.focus && wp.split_preferences.focus !== 'no_preference'
            ? `Focus: ${labels.focus(wp.split_preferences.focus)}`
            : null,
          `Ervaring: ${labels.experience(wp?.default_experience_level || cd.training_experience)}`,
        ].filter(Boolean)}
        value={stepNotes.workout_goals}
        onChange={v => setStepNotes(p => ({ ...p, workout_goals: v }))}
        isMobile={isMobile}
      />

      {/* Navigation */}
      <div style={{ display: 'flex', gap: '0.5rem', padding: isMobile ? '0.75rem' : '1rem' }}>
        <button onClick={onBack} style={{ padding: '0.625rem 1rem', background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 0, color: C.text50, fontSize: isMobile ? '0.7rem' : '0.75rem', fontWeight: 700, cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: '44px' }}>← TERUG</button>
        <button onClick={onNext} style={{ flex: 1, padding: '0.625rem', background: `linear-gradient(90deg, ${C.blue}, #2563eb)`, border: 'none', borderRadius: 0, color: '#fff', fontSize: isMobile ? '0.75rem' : '0.85rem', fontWeight: 800, cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: '44px' }}>TRAINING BESPROKEN → BEVESTIGEN</button>
      </div>
    </div>
  )
}

function PrefQ({ q, prefill = [], value, onChange, isMobile }) {
  return (
    <div style={{ padding: isMobile ? '0.5rem 0.75rem' : '0.625rem 1rem', borderBottom: `1px solid ${C.borderSub}` }}>
      <div style={{ fontSize: isMobile ? '0.85rem' : '0.95rem', fontWeight: 700, color: C.text, lineHeight: 1.35, marginBottom: prefill.length ? '0.2rem' : '0.3rem' }}>{q}</div>
      {prefill.length > 0 && (
        <div style={{ marginBottom: '0.25rem', display: 'flex', flexDirection: 'column', gap: '0.08rem' }}>
          {prefill.map((p, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.25rem' }}>
              <span style={{ fontSize: '0.35rem', fontWeight: 700, color: C.blue, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.1rem', flexShrink: 0 }}>DATA</span>
              <span style={{ fontSize: isMobile ? '0.65rem' : '0.7rem', fontWeight: 600, color: C.blue, lineHeight: 1.4 }}>{p}</span>
            </div>
          ))}
        </div>
      )}
      <textarea value={value || ''} onChange={e => onChange(e.target.value)} placeholder="Notitie / aanvulling..." rows={2}
        style={{ width: '100%', padding: '0.2rem 0', background: 'transparent', border: 'none', borderBottom: `1px solid ${value ? C.borderSub : C.borderFaint}`, color: C.text, fontSize: isMobile ? '0.7rem' : '0.75rem', fontWeight: 600, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', resize: 'none', lineHeight: 1.5, borderRadius: 0 }} />
    </div>
  )
}
