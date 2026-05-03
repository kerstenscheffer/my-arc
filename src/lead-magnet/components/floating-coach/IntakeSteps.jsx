// ========================================
// 📁 src/lead-magnet/components/floating-coach/IntakeSteps.jsx
// Intake flow steps: goal, motivation, obstacle, budget, contact
// ========================================
import { useState, useEffect } from 'react'
import {
  GOLD, GOLD_DARK,
  GOAL_OPTIONS, MOTIVATION_OPTIONS, BUDGET_OPTIONS, INTAKE_STEPS,
  ArrowIcon, CheckIcon, GiftIcon, TrendingDownIcon, CalendarIcon, ClockIcon, UsersIcon, ShieldIcon,
  optionButtonStyle, iconBoxStyle, inputStyle, goldButtonStyle
} from './constants'

export default function IntakeSteps({ isMobile, intakeStep, answers, setAnswers, setIntakeStep, form, setForm, onSubmit, sending }) {
  const s = INTAKE_STEPS[intakeStep]

  const pickOption = (opt) => {
    setAnswers(prev => ({ ...prev, [s.key]: opt }))
    setTimeout(() => {
      if (intakeStep < INTAKE_STEPS.length - 1) setIntakeStep(intakeStep + 1)
    }, 250)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
      {/* Progress bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.15rem' }}>
        {INTAKE_STEPS.map((_, i) => (
          <div key={i} style={{
            flex: 1, height: '3px', borderRadius: '2px',
            background: i <= intakeStep
              ? `linear-gradient(90deg, ${GOLD}, ${GOLD_DARK})`
              : 'rgba(255,255,255,0.06)',
            transition: 'background 0.3s ease'
          }} />
        ))}
      </div>

      {/* Question */}
      <p style={{
        fontSize: isMobile ? '0.88rem' : '0.92rem',
        color: '#fff', fontWeight: '700',
        margin: '0.15rem 0 0.35rem', lineHeight: 1.4
      }}>{s.question}</p>

      {/* ══════ GOAL OPTIONS ══════ */}
      {s.type === 'goal' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {GOAL_OPTIONS.map(opt => {
            const Icon = opt.icon
            const selected = answers[s.key] === opt.text
            return (
              <button key={opt.text} onClick={() => pickOption(opt.text)} style={optionButtonStyle(selected, isMobile)}>
                <div style={iconBoxStyle(selected)}>
                  <Icon size={15} />
                </div>
                <span>{opt.text}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* ══════ MOTIVATION OPTIONS ══════ */}
      {s.type === 'motivation' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {MOTIVATION_OPTIONS.map(opt => {
            const selected = answers[s.key] === opt.text
            return (
              <button key={opt.text} onClick={() => pickOption(opt.text)} style={optionButtonStyle(selected, isMobile)}>
                <div style={iconBoxStyle(selected)}>
                  {[...Array(3)].map((_, i) => (
                    <div key={i} style={{
                      width: '4px',
                      height: i < opt.level ? `${8 + i * 4}px` : '6px',
                      borderRadius: '1px',
                      background: i < opt.level ? GOLD : 'rgba(255,255,255,0.15)',
                      transition: 'all 0.15s ease'
                    }} />
                  ))}
                </div>
                <span>{opt.text}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* ══════ BUDGET OPTIONS (now with icons) ══════ */}
      {s.type === 'budget' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {BUDGET_OPTIONS.map(opt => {
            const Icon = opt.icon
            const selected = answers[s.key] === opt.text
            return (
              <button key={opt.text} onClick={() => pickOption(opt.text)} style={optionButtonStyle(selected, isMobile)}>
                <div style={iconBoxStyle(selected)}>
                  <Icon size={15} />
                </div>
                <span>{opt.text}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* ══════ TEXTAREA ══════ */}
      {s.type === 'textarea' && (
        <>
          <textarea
            value={answers[s.key] || ''}
            onChange={e => setAnswers({ ...answers, [s.key]: e.target.value })}
            placeholder={s.placeholder}
            rows={3}
            style={{
              ...inputStyle(isMobile),
              resize: 'vertical',
              lineHeight: 1.5
            }}
            onFocus={e => e.target.style.borderColor = GOLD}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
          />
          <button
            onClick={() => { if (answers[s.key]?.trim()) setIntakeStep(intakeStep + 1) }}
            disabled={!answers[s.key]?.trim()}
            style={goldButtonStyle(!!answers[s.key]?.trim(), isMobile)}
          >
            Volgende <ArrowIcon size={12} />
          </button>
        </>
      )}

      {/* ══════ CONTACT STEP (NEW FRAMING) ══════ */}
      {s.type === 'contact' && (
        <ContactStep
          isMobile={isMobile}
          form={form}
          setForm={setForm}
          onSubmit={onSubmit}
          sending={sending}
        />
      )}

      {/* Back button */}
      {intakeStep > 0 && (
        <button onClick={() => setIntakeStep(intakeStep - 1)} style={{
          padding: '0.4rem', background: 'none', border: 'none',
          color: 'rgba(255,255,255,0.25)', fontSize: '0.7rem', fontWeight: '600',
          cursor: 'pointer', textAlign: 'left'
        }}>← Terug</button>
      )}
    </div>
  )
}

// ══════ WEEK TIMER SUB-COMPONENT ══════
function WeekTimer({ isMobile }) {
  const [timeLeft, setTimeLeft] = useState(getTimeUntilSunday())

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeUntilSunday())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.3rem',
      marginTop: '0.5rem'
    }}>
      <div style={{
        width: '5px', height: '5px', borderRadius: '50%',
        background: '#ef4444',
        animation: 'timerPulse 2s ease-in-out infinite',
        flexShrink: 0
      }} />
      <span style={{
        fontSize: isMobile ? '0.65rem' : '0.68rem',
        color: 'rgba(255,255,255,0.3)',
        fontWeight: '600',
        fontVariantNumeric: 'tabular-nums'
      }}>
        Verloopt over <span style={{ color: '#ef4444' }}>{timeLeft.days}d {timeLeft.hours}u {timeLeft.minutes}m</span>
      </span>
    </div>
  )
}

function getTimeUntilSunday() {
  const now = new Date()
  const day = now.getDay()
  const daysUntilSunday = day === 0 ? 0 : 7 - day
  const sunday = new Date(now)
  sunday.setDate(now.getDate() + daysUntilSunday)
  sunday.setHours(23, 59, 59, 999)
  const diff = Math.max(0, sunday - now)
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  }
}
function ContactStep({ isMobile, form, setForm, onSubmit, sending }) {
  const canSubmit = form.name.trim() && form.phone.trim() && !sending

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>

      {/* First coach bubble */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
        <div style={{
          width: '26px', height: '26px', borderRadius: '50%',
          overflow: 'hidden', flexShrink: 0, marginTop: '2px'
        }}>
          <img src="/coach-modal.png" alt="K" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }} />
        </div>
        <div style={{
          background: 'rgba(255,255,255,0.06)',
          borderRadius: '14px 14px 14px 4px',
          padding: '0.7rem 0.85rem',
          maxWidth: '85%'
        }}>
          <p style={{
            fontSize: isMobile ? '0.78rem' : '0.82rem',
            color: '#fff', fontWeight: '500',
            lineHeight: 1.5, margin: 0
          }}>
            Plan een gratis gesprek, waarin ik uitleg hoe ik je naar je doelen help. Geen druk, gewoon kijken of het bij je past.
          </p>
        </div>
      </div>

      {/* PS bubble with timer */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
        <div style={{
          width: '26px', height: '26px', borderRadius: '50%',
          overflow: 'hidden', flexShrink: 0, marginTop: '2px'
        }}>
          <img src="/coach-modal.png" alt="K" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }} />
        </div>
        <div style={{
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '14px 14px 14px 4px',
          padding: '0.7rem 0.85rem',
          maxWidth: '85%'
        }}>
          <p style={{
            fontSize: isMobile ? '0.78rem' : '0.82rem',
            color: '#fff', fontWeight: '500',
            lineHeight: 1.5, margin: 0
          }}>
            Ik geef deze week het <span style={{ color: GOLD, fontWeight: '800', fontStyle: 'italic', backgroundImage: 'linear-gradient(90deg, #ffba09, #ffe082, #ffba09)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundSize: '200% 100%', animation: 'goldShimmer 3s ease-in-out infinite' }}>Eat Better, Spend Less</span> systeem erbij, waar leden gemiddeld <span style={{ color: GOLD, fontWeight: '800', fontStyle: 'italic', backgroundImage: 'linear-gradient(90deg, #ffba09, #ffe082, #ffba09)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundSize: '200% 100%', animation: 'goldShimmer 3s ease-in-out infinite' }}>€150/mnd</span> mee besparen.
          </p>
          <WeekTimer isMobile={isMobile} />
          <p style={{
            fontSize: isMobile ? '0.7rem' : '0.74rem',
            color: 'rgba(255,255,255,0.4)', fontWeight: '600',
            lineHeight: 1.4, margin: '0.5rem 0 0'
          }}>
            Plan je call om te <span style={{ color: GOLD, fontWeight: '800', fontStyle: 'italic', backgroundImage: 'linear-gradient(90deg, #ffba09, #ffe082, #ffba09)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundSize: '200% 100%', animation: 'goldShimmer 3s ease-in-out infinite' }}>claimen</span> <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffba09" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', verticalAlign: 'middle', marginLeft: '2px' }}><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>
          </p>
        </div>
      </div>

      {/* Form fields */}
      <input
        type="text" placeholder="Je voornaam *" value={form.name}
        onChange={e => setForm({ ...form, name: e.target.value })}
        style={inputStyle(isMobile)}
        onFocus={e => e.target.style.borderColor = GOLD}
        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
      />
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.4rem',
        padding: '0.8rem',
        background: 'rgba(255,255,255,0.04)',
        border: '1.5px solid rgba(255,255,255,0.08)',
        borderRadius: '10px'
      }}>
        <span style={{ fontSize: '0.8rem' }}>🇳🇱</span>
        <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)', fontWeight: '500' }}>+31</span>
        <input
          type="tel" placeholder="6 12345678 *" value={form.phone}
          onChange={e => setForm({ ...form, phone: e.target.value })}
          style={{
            flex: 1, border: 'none', background: 'transparent',
            color: '#fff', fontSize: isMobile ? '0.82rem' : '0.88rem',
            fontFamily: 'inherit', outline: 'none'
          }}
        />
      </div>

      {/* Submit button */}
      <button
        onClick={onSubmit}
        disabled={!canSubmit}
        style={goldButtonStyle(canSubmit, isMobile)}
      >
        {sending ? 'Verzenden...' : 'Plan mijn gratis call'} {!sending && <ArrowIcon size={14} />}
      </button>

      {/* Scarcity - subtle */}
      <p style={{
        fontSize: isMobile ? '0.65rem' : '0.68rem',
        color: 'rgba(255,255,255,0.3)', fontWeight: '600',
        textAlign: 'center', margin: 0
      }}>
        Nog <span style={{ color: '#ef4444' }}>5 plekken</span> deze 2 weken
      </p>
    </div>
  )
}
