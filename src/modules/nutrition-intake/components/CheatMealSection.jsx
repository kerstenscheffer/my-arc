// src/modules/nutrition-intake/components/CheatMealSection.jsx
// Cheat meals / flexibele momenten — kort en bondig
import React, { useState, useEffect } from 'react'
import { intakeTheme as t, r } from '../styles/intake-theme'

const FREQUENCY_OPTIONS = [
  { id: 'nooit', label: 'Liever niet' },
  { id: '1x_week', label: '1x per week' },
  { id: '2x_week', label: '2x per week' },
  { id: 'weekend', label: 'Heel het weekend' },
  { id: 'als_nodig', label: 'Als ik er behoefte aan heb' }
]

const APPROACH_OPTIONS = [
  { id: 'strict_plan', label: 'Ik volg het plan, geen uitzonderingen' },
  { id: 'one_free_meal', label: 'Eén vrije maaltijd per week' },
  { id: 'flexible_weekend', label: 'Doordeweeks strikt, weekend flexibel' },
  { id: 'macro_fit', label: 'Zolang het in mijn macro\'s past, mag alles' }
]

export default function CheatMealSection({ value, onChange, isMobile }) {
  const [data, setData] = useState({
    frequency: null,
    approach: null,
    social_situations: '',
    ...(value || {})
  })

  useEffect(() => {
    if (value) setData(prev => ({ ...prev, ...value }))
  }, [value])

  const update = (field, val) => setData(prev => ({ ...prev, [field]: val }))

  const isComplete = !!data.frequency && !!data.approach

  const handleConfirm = () => {
    if (!isComplete) return
    onChange(data)
  }

  return (
    <div>
      {/* Hoe vaak */}
      <QRow label="Hoe vaak wil je flexibel kunnen eten?" isMobile={isMobile}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: r(isMobile, '0.25rem', '0.3rem') }}>
          {FREQUENCY_OPTIONS.map(opt => {
            const sel = data.frequency === opt.id
            return (
              <button key={opt.id} onClick={() => update('frequency', opt.id)} style={{
                padding: r(isMobile, '0.5rem 0.4rem', '0.55rem 0.5rem'),
                background: sel ? 'rgba(255,215,0,0.06)' : t.colors.inputBg,
                border: `1px solid ${sel ? 'rgba(255,215,0,0.35)' : t.colors.borderVisible}`,
                borderRadius: '8px', color: sel ? '#FFD700' : t.colors.textSecondary,
                fontSize: r(isMobile, '0.65rem', '0.7rem'), fontWeight: sel ? 800 : 600,
                cursor: 'pointer', minHeight: '38px',
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                transition: 'all 0.15s ease', textAlign: 'center', fontFamily: 'inherit',
                gridColumn: opt.id === 'als_nodig' ? 'span 2' : 'auto'
              }}>{opt.label}</button>
            )
          })}
        </div>
      </QRow>

      {/* Aanpak */}
      <QRow label="Welke aanpak past het beste bij je?" isMobile={isMobile}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: r(isMobile, '0.25rem', '0.3rem') }}>
          {APPROACH_OPTIONS.map(opt => {
            const sel = data.approach === opt.id
            return (
              <button key={opt.id} onClick={() => update('approach', opt.id)} style={{
                padding: r(isMobile, '0.5rem 0.6rem', '0.55rem 0.7rem'),
                background: sel ? 'rgba(255,215,0,0.06)' : t.colors.inputBg,
                border: `1px solid ${sel ? 'rgba(255,215,0,0.35)' : t.colors.borderVisible}`,
                borderRadius: '8px', color: sel ? '#FFD700' : t.colors.textSecondary,
                fontSize: r(isMobile, '0.7rem', '0.74rem'), fontWeight: sel ? 800 : 600,
                cursor: 'pointer', minHeight: '40px',
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                transition: 'all 0.15s ease', textAlign: 'left', fontFamily: 'inherit'
              }}>{opt.label}</button>
            )
          })}
        </div>
      </QRow>

      {/* Sociale situaties */}
      <QRow label="Hoe ga je om met sociale gelegenheden? (optioneel)" isMobile={isMobile}>
        <textarea value={data.social_situations} onChange={e => update('social_situations', e.target.value)}
          placeholder="Bijv: elke vrijdag uit eten, weekend BBQ, verjaardagen..."
          rows={2} style={{
            width: '100%', padding: r(isMobile, '0.6rem 0.75rem', '0.65rem 0.85rem'),
            background: t.colors.inputBg, border: `1px solid ${t.colors.borderVisible}`,
            borderRadius: '8px', color: t.colors.white,
            fontSize: r(isMobile, '0.8rem', '0.85rem'), fontFamily: 'inherit',
            outline: 'none', resize: 'vertical', lineHeight: 1.4, boxSizing: 'border-box'
          }}
          onFocus={e => { e.target.style.borderColor = '#FFD700' }}
          onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)' }}
        />
      </QRow>

      {/* Confirm */}
      <div style={{ padding: r(isMobile, '0.6rem 1rem', '0.75rem 1.25rem'), borderTop: `1px solid ${t.colors.border}` }}>
        <button onClick={handleConfirm} disabled={!isComplete} style={{
          width: '100%', padding: r(isMobile, '0.65rem', '0.7rem'),
          background: isComplete ? 'rgba(255,215,0,0.08)' : 'rgba(255,255,255,0.02)',
          border: `1px solid ${isComplete ? 'rgba(255,215,0,0.2)' : 'rgba(255,255,255,0.04)'}`,
          borderRadius: '8px', color: isComplete ? '#FFD700' : t.colors.textMuted,
          fontSize: r(isMobile, '0.72rem', '0.76rem'), fontWeight: 800,
          cursor: isComplete ? 'pointer' : 'default', minHeight: '40px',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          opacity: isComplete ? 1 : 0.4, transition: 'all 0.2s ease'
        }}>OPSLAAN EN DOOR</button>
      </div>
    </div>
  )
}

function QRow({ label, children, isMobile }) {
  return (
    <div style={{ padding: r(isMobile, '0.5rem 1rem', '0.6rem 1.25rem'), borderBottom: `1px solid ${t.colors.border}` }}>
      <div style={{ fontSize: r(isMobile, '0.65rem', '0.7rem'), fontWeight: 800, color: '#fff', marginBottom: r(isMobile, '0.35rem', '0.4rem') }}>{label}</div>
      {children}
    </div>
  )
}
