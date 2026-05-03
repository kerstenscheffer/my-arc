// src/modules/client-journey/components/calls/IntakeGoalStep2.jsx
import React from 'react'
import { Flame, AlertTriangle } from 'lucide-react'
import { C } from './IntakeCallHelpers'

const HERO = 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800&q=80'

const PRESETS = [
  { id: 'mild',       label: 'Mild',      range: '10-15%', desc: '~0.3 kg/week', sub: 'Makkelijk vol te houden', color: C.green },
  { id: 'moderate',   label: 'Moderate',  range: '15-25%', desc: '~0.5 kg/week', sub: 'Beste balans',            color: C.gold  },
  { id: 'aggressive', label: 'Agressief', range: '25-35%', desc: '~0.8 kg/week', sub: 'Snel maar zwaar',         color: C.red   }
]

const CARDIO_LABELS = {
  walking: 'Wandelen', running: 'Hardlopen', cycling: 'Fietsen', swimming: 'Zwemmen',
  rowing: 'Roeien', stairmaster: 'Stairmaster', hiit: 'HIIT', sports: 'Sport',
  jump_rope: 'Touwtje springen', incline_walk: 'Incline walking'
}

const CHEAT_FREQ_LABELS = {
  nooit: 'Geen cheat meals', '1x_week': '1x per week', '2x_week': '2x per week',
  weekend: 'In het weekend', als_nodig: 'Als het nodig is'
}
const CHEAT_APPROACH_LABELS = {
  strict_plan: 'Geen uitzonderingen', one_free_meal: '1 vrije maaltijd/week',
  flexible_weekend: 'Weekend flexibel', macro_fit: 'Alles als het in macro\'s past'
}

export default function IntakeGoalStep2({
  cd, np, wp, result, isMobile,
  deficitPreset, setDeficitPreset,
  manualCal, setManualCal,
  cardioSessions, setCardioSessions,
  cheatDays, setCheatDays,
  cheatDayCal, setCheatDayCal,
  onNext, onBack
}) {
  const isBeginner = (cd.training_experience || wp?.default_experience_level) === 'beginner'
  const isCut = result.isCut

  // Intake prefill data
  const wpCardioInterest = wp?.cardio_interest
  const wpCardioFreq = wp?.cardio_frequency
  const wpCardioDur = wp?.cardio_duration
  const wpCardioTypes = wp?.cardio_types || []
  const npCheat = np?.cheat_meals || {}
  const hasCardioFromIntake = wpCardioInterest === 'yes' || wpCardioInterest === 'maybe'

  return (
    <div>
      {/* Hero */}
      <div style={{ position: 'relative', height: '100px', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${HERO})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #0a0a0a 0%, rgba(0,0,0,0.3) 50%, transparent 100%)' }} />
        <div style={{ position: 'absolute', bottom: '0.5rem', left: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Flame size={16} color={C.gold} />
          <span style={{ fontSize: isMobile ? '0.9rem' : '1rem', fontWeight: 800, color: C.text }}>Kies het plan</span>
        </div>
      </div>

      {/* Aanbeveling */}
      <div style={{ padding: isMobile ? '0.5rem 0.75rem' : '0.625rem 1rem', borderLeft: `3px solid ${C.gold}`, borderBottom: `1px solid ${C.borderSub}`, background: C.goldBg }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '0.4rem', fontWeight: 700, color: C.gold, textTransform: 'uppercase', letterSpacing: '0.06em' }}>AANBEVELING</div>
            <div style={{ fontSize: isMobile ? '0.75rem' : '0.85rem', fontWeight: 800, color: C.gold, marginTop: '0.05rem' }}>
              {PRESETS.find(p => p.id === result.recPreset)?.label}
            </div>
          </div>
          <div style={{ fontSize: '0.5rem', color: C.text25, textAlign: 'right', maxWidth: '60%' }}>{result.recReason}</div>
        </div>
      </div>

      {/* Beginner warning */}
      {isBeginner && result.activePreset === 'aggressive' && (
        <div style={{ padding: '0.35rem 0.75rem', borderBottom: `1px solid ${C.borderSub}`, borderLeft: `3px solid ${C.red}`, background: 'rgba(239,68,68,0.03)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <AlertTriangle size={12} color={C.red} />
          <span style={{ fontSize: '0.5rem', fontWeight: 700, color: C.red }}>Beginner + agressief = hoog dropout risico</span>
        </div>
      )}

      {/* Deficit keuze */}
      <div style={{ padding: isMobile ? '0.625rem 0.75rem' : '0.75rem 1rem', borderBottom: `1px solid ${C.borderSub}` }}>
        <div style={{ fontSize: '0.4rem', fontWeight: 700, color: C.text25, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>
          {isCut ? 'HOE AGRESSIEF WILLEN WE CUTTEN?' : 'HOE SNEL WILLEN WE OPBOUWEN?'}
        </div>
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          {PRESETS.map(p => {
            const active = result.activePreset === p.id && !result.useManual
            const isRec = result.recPreset === p.id
            return (
              <button key={p.id} onClick={() => { setDeficitPreset(p.id); setManualCal('') }} style={{
                flex: 1, padding: isMobile ? '0.625rem 0.25rem' : '0.75rem 0.375rem',
                background: active ? `${p.color}10` : '#111',
                border: active ? `2px solid ${p.color}` : `1px solid ${C.border}`,
                borderRadius: 0, cursor: 'pointer', textAlign: 'center', position: 'relative',
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', transition: 'all 0.2s ease'
              }}>
                {isRec && !active && (
                  <div style={{ position: 'absolute', top: '-0.1rem', right: '-0.1rem', fontSize: '0.35rem', fontWeight: 800, color: C.gold, background: '#0a0a0a', padding: '0.05rem 0.15rem' }}>REC</div>
                )}
                <div style={{ fontSize: isMobile ? '0.85rem' : '0.95rem', fontWeight: 800, color: active ? p.color : C.text50 }}>{p.label}</div>
                <div style={{ fontSize: '0.4rem', fontWeight: 700, color: active ? p.color : C.text25, marginTop: '0.1rem' }}>{p.range}</div>
                <div style={{ fontSize: '0.5rem', fontWeight: 800, color: active ? C.text : C.text25, marginTop: '0.15rem' }}>{p.desc}</div>
                <div style={{ fontSize: '0.4rem', color: C.text15, marginTop: '0.05rem' }}>{p.sub}</div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Handmatig */}
      <div style={{ padding: isMobile ? '0.375rem 0.75rem' : '0.5rem 1rem', borderBottom: `1px solid ${C.borderSub}`, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ fontSize: '0.4rem', fontWeight: 700, color: C.text15, textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0 }}>OF HANDMATIG</span>
        <input type="number" value={manualCal} onChange={e => setManualCal(e.target.value)} placeholder={`${result.targetCal}`}
          style={{ width: '80px', padding: '0.2rem 0', background: 'transparent', border: 'none', borderBottom: `1px solid ${result.useManual ? C.gold : C.borderSub}`, color: result.useManual ? C.gold : C.text25, fontSize: isMobile ? '0.75rem' : '0.85rem', fontWeight: 800, outline: 'none', fontFamily: 'inherit', textAlign: 'right', borderRadius: 0 }} />
        <span style={{ fontSize: '0.4rem', color: C.text15 }}>kcal</span>
        {result.useManual && (
          <button onClick={() => setManualCal('')} style={{ background: 'transparent', border: `1px solid ${C.borderSub}`, borderRadius: 0, color: C.text25, fontSize: '0.4rem', fontWeight: 700, padding: '0.1rem 0.25rem', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>×</button>
        )}
      </div>

      <div style={{ height: '2px', background: `linear-gradient(90deg, ${C.gold}40, transparent)` }} />

      {/* Cardio — met prefill uit wp */}
      <div style={{ padding: isMobile ? '0.5rem 0.75rem' : '0.625rem 1rem', borderBottom: `1px solid ${C.borderSub}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.15rem' }}>
          <span style={{ fontSize: isMobile ? '0.75rem' : '0.85rem', fontWeight: 700, color: C.text }}>Extra cardio per week</span>
          {cardioSessions > 0 && <span style={{ fontSize: '0.5rem', fontWeight: 800, color: C.green }}>+{result.cardioDaily} kcal/dag</span>}
        </div>

        {/* Prefill uit intake */}
        {hasCardioFromIntake && (
          <div style={{ marginBottom: '0.25rem', padding: '0.25rem 0.4rem', background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.1)', display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.35rem', fontWeight: 700, color: C.text25, textTransform: 'uppercase', letterSpacing: '0.05em' }}>FORMULIER</span>
            {wpCardioInterest && (
              <span style={{ fontSize: '0.6rem', fontWeight: 700, color: C.green }}>
                {wpCardioInterest === 'yes' ? 'Wil cardio' : 'Misschien cardio'}
              </span>
            )}
            {wpCardioFreq && <span style={{ fontSize: '0.6rem', fontWeight: 600, color: C.text50 }}>{wpCardioFreq}x/week</span>}
            {wpCardioDur && <span style={{ fontSize: '0.6rem', fontWeight: 600, color: C.text50 }}>{wpCardioDur} min/sessie</span>}
            {wpCardioTypes.length > 0 && (
              <span style={{ fontSize: '0.6rem', fontWeight: 600, color: C.text50 }}>
                {wpCardioTypes.map(t => CARDIO_LABELS[t] || t).join(', ')}
              </span>
            )}
          </div>
        )}
        {wp?.cardio_interest === 'no' && (
          <div style={{ marginBottom: '0.2rem', fontSize: '0.55rem', fontWeight: 700, color: C.amber }}>
            ⚠ Client gaf aan geen cardio te willen
          </div>
        )}

        <div style={{ fontSize: '0.4rem', color: C.text15, marginBottom: '0.2rem' }}>30 min LISS · ~200 kcal per sessie</div>
        <div style={{ display: 'flex', gap: '0.2rem' }}>
          {[0, 1, 2, 3, 4, 5].map(v => (
            <button key={v} onClick={() => setCardioSessions(v)} style={{
              flex: 1, padding: '0.3rem 0',
              background: cardioSessions === v ? 'rgba(16,185,129,0.08)' : 'transparent',
              border: `1px solid ${cardioSessions === v ? C.green : C.borderSub}`,
              borderRadius: 0, color: cardioSessions === v ? C.green : C.text25,
              fontSize: isMobile ? '0.65rem' : '0.7rem', fontWeight: cardioSessions === v ? 800 : 600,
              cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
            }}>{v === 0 ? '—' : `${v}x`}</button>
          ))}
        </div>
      </div>

      {/* Cheat days — met prefill uit np */}
      <div style={{ padding: isMobile ? '0.5rem 0.75rem' : '0.625rem 1rem', borderBottom: `1px solid ${C.borderSub}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.15rem' }}>
          <span style={{ fontSize: isMobile ? '0.75rem' : '0.85rem', fontWeight: 700, color: C.text }}>Cheat days per week</span>
          {cheatDays > 0 && (
            <span style={{ fontSize: '0.5rem', fontWeight: 800, color: C.amber }}>
              +{result.weeksNeeded - result.weeksWithoutCheat} weken extra
            </span>
          )}
        </div>

        {/* Prefill uit np.cheat_meals */}
        {npCheat.frequency && (
          <div style={{ marginBottom: '0.25rem', padding: '0.25rem 0.4rem', background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.1)', display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.35rem', fontWeight: 700, color: C.text25, textTransform: 'uppercase', letterSpacing: '0.05em' }}>FORMULIER</span>
            <span style={{ fontSize: '0.6rem', fontWeight: 700, color: C.amber }}>{CHEAT_FREQ_LABELS[npCheat.frequency] || npCheat.frequency}</span>
            {npCheat.approach && <span style={{ fontSize: '0.6rem', fontWeight: 600, color: C.text50 }}>{CHEAT_APPROACH_LABELS[npCheat.approach] || npCheat.approach}</span>}
            {npCheat.social_frequency && <span style={{ fontSize: '0.6rem', fontWeight: 600, color: C.text50 }}>Sociaal: {npCheat.social_frequency}</span>}
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.2rem', marginBottom: cheatDays > 0 ? '0.25rem' : 0 }}>
          {[0, 1, 2].map(v => (
            <button key={v} onClick={() => setCheatDays(v)} style={{
              flex: 1, padding: '0.3rem 0',
              background: cheatDays === v && v > 0 ? 'rgba(245,158,11,0.08)' : 'transparent',
              border: `1px solid ${cheatDays === v && v > 0 ? C.amber : C.borderSub}`,
              borderRadius: 0, color: cheatDays === v ? (v > 0 ? C.amber : C.text50) : C.text25,
              fontSize: isMobile ? '0.65rem' : '0.7rem', fontWeight: cheatDays === v ? 800 : 600,
              cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
            }}>{v === 0 ? 'Geen' : `${v}x`}</button>
          ))}
        </div>
        {cheatDays > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.4rem', fontWeight: 700, color: C.text25, textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0 }}>EXTRA PER CHEATDAY</span>
            <input type="number" value={cheatDayCal || 500} onChange={e => setCheatDayCal(parseInt(e.target.value) || 500)}
              style={{ width: '60px', padding: '0.15rem 0', background: 'transparent', border: 'none', borderBottom: `1px solid ${C.amber}`, color: C.amber, fontSize: isMobile ? '0.65rem' : '0.7rem', fontWeight: 800, outline: 'none', fontFamily: 'inherit', textAlign: 'right', borderRadius: 0 }} />
            <span style={{ fontSize: '0.4rem', color: C.text25 }}>kcal boven target</span>
          </div>
        )}
      </div>

      {/* Live preview */}
      <div style={{ padding: isMobile ? '0.5rem 0.75rem' : '0.625rem 1rem', borderBottom: `1px solid ${C.goldBorder}`, borderLeft: `3px solid ${C.gold}`, background: C.goldBg }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: isMobile ? '1.5rem' : '1.75rem', fontWeight: 800, color: C.gold, lineHeight: 1 }}>{result.targetCal}</span>
            <span style={{ fontSize: '0.4rem', fontWeight: 500, opacity: 0.4, marginLeft: '0.05rem' }}>kcal/dag</span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: isMobile ? '0.75rem' : '0.85rem', fontWeight: 800, color: C.text }}>{result.weeklyLoss} kg/week</div>
            <div style={{ fontSize: '0.5rem', color: C.text25 }}>{result.goalWeight} kg in {result.weeksNeeded} weken</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <div style={{ padding: isMobile ? '0.75rem' : '1rem', display: 'flex', gap: '0.5rem' }}>
        <button onClick={onBack} style={{ padding: '0.5rem 1rem', background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 0, color: C.text25, fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: '36px' }}>← TERUG</button>
        <button onClick={onNext} style={{ flex: 1, padding: '0.625rem', background: `linear-gradient(90deg, ${C.gold}, ${C.darkGold})`, border: 'none', borderRadius: 0, color: '#000', fontSize: isMobile ? '0.75rem' : '0.85rem', fontWeight: 800, cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: '44px' }}>PLAN GEKOZEN → RESULTAAT</button>
      </div>
    </div>
  )
}
