// src/modules/nutrition-intake/components/WishesSection.jsx
// v3 — 3 simpele open vragen, geen guidance level modes
import React, { useState, useEffect } from 'react'
import { intakeTheme as t, r } from '../styles/intake-theme'

export default function WishesSection({ value, onChange, onComplete, isMobile, guidanceLevel }) {
  const [data, setData] = useState({
    favoriete_ontbijt_lunch: '',
    favoriete_avondeten: '',
    absoluut_niet: '',
    ...(value || {})
  })

  useEffect(() => {
    if (value) setData(prev => ({ ...prev, ...value }))
  }, [value])

  const update = (field, val) => setData(prev => ({ ...prev, [field]: val }))
  const isComplete = () => !!(data.favoriete_ontbijt_lunch && data.favoriete_avondeten)

  const handleConfirm = () => {
    onChange(data)
    onComplete(true)
  }

  return (
    <div>
      <div style={{
        padding: r(isMobile, '0.5rem 1rem', '0.6rem 1.25rem'),
        borderBottom: `1px solid ${t.colors.border}`
      }}>
        <div style={{
          fontSize: r(isMobile, '0.6rem', '0.65rem'), fontWeight: 600,
          color: t.colors.textSecondary, lineHeight: 1.5
        }}>
          Vertel je coach wat je graag eet. Dit is de basis voor je persoonlijke plan.
        </div>
      </div>

      <TextQuestion
        label="Wat eet je graag als ontbijt of lunch? (noem 3-5 dingen)"
        placeholder="Bijv: eieren, havermout, brood met kaas, yoghurt, wrap..."
        value={data.favoriete_ontbijt_lunch}
        onChange={v => update('favoriete_ontbijt_lunch', v)}
        isMobile={isMobile}
        multiline
        required
      />
      <TextQuestion
        label="Wat eet je graag als avondeten? (noem 3-5 dingen)"
        placeholder="Bijv: pasta, rijst met groenten, Indiaas, soep, aardappelen..."
        value={data.favoriete_avondeten}
        onChange={v => update('favoriete_avondeten', v)}
        isMobile={isMobile}
        multiline
        required
      />
      <TextQuestion
        label="Is er iets dat je absoluut niet wil eten?"
        placeholder="Bijv: zalm, lever, bloemkool, paddenstoelen... (optioneel)"
        value={data.absoluut_niet}
        onChange={v => update('absoluut_niet', v)}
        isMobile={isMobile}
        multiline
      />

      <div style={{ padding: r(isMobile, '0.6rem 1rem', '0.75rem 1.25rem'), borderTop: `1px solid ${t.colors.border}` }}>
        <button onClick={handleConfirm} disabled={!isComplete()} style={{
          width: '100%', padding: r(isMobile, '0.65rem', '0.7rem'),
          background: isComplete() ? 'rgba(255,215,0,0.08)' : 'rgba(255,255,255,0.02)',
          border: `1px solid ${isComplete() ? 'rgba(255,215,0,0.2)' : 'rgba(255,255,255,0.04)'}`,
          borderRadius: '8px', color: isComplete() ? '#FFD700' : t.colors.textMuted,
          fontSize: r(isMobile, '0.72rem', '0.76rem'), fontWeight: 800,
          cursor: isComplete() ? 'pointer' : 'default', minHeight: '40px',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          opacity: isComplete() ? 1 : 0.4, transition: 'all 0.2s ease'
        }}>OPSLAAN EN DOOR</button>
      </div>
    </div>
  )
}

function TextQuestion({ label, placeholder, value, onChange, isMobile, multiline = false, required = false }) {
  const Tag = multiline ? 'textarea' : 'input'
  return (
    <div style={{ padding: r(isMobile, '0.5rem 1rem', '0.6rem 1.25rem'), borderBottom: `1px solid ${t.colors.border}` }}>
      <div style={{ fontSize: r(isMobile, '0.65rem', '0.7rem'), fontWeight: 800, color: '#fff', marginBottom: r(isMobile, '0.3rem', '0.35rem'), display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
        {label}
        {required && <span style={{ fontSize: '0.4rem', fontWeight: 700, color: t.colors.gold, textTransform: 'uppercase' }}>verplicht</span>}
      </div>
      <Tag value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        rows={multiline ? 3 : undefined} type={multiline ? undefined : 'text'}
        style={{
          width: '100%', padding: r(isMobile, '0.6rem 0.75rem', '0.65rem 0.85rem'),
          background: t.colors.inputBg, border: `1px solid ${value ? 'rgba(255,215,0,0.25)' : t.colors.borderVisible}`,
          borderRadius: '8px', color: value ? '#FFD700' : t.colors.white,
          fontSize: r(isMobile, '0.8rem', '0.85rem'), fontWeight: value ? 700 : 600,
          fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
          resize: multiline ? 'vertical' : 'none', lineHeight: multiline ? 1.4 : 'normal',
          transition: 'border-color 0.2s ease'
        }}
        onFocus={e => { e.target.style.borderColor = '#FFD700'; e.target.style.background = 'rgba(255,215,0,0.03)' }}
        onBlur={e => { e.target.style.borderColor = value ? 'rgba(255,215,0,0.25)' : 'rgba(255,255,255,0.08)'; e.target.style.background = '#111' }}
      />
    </div>
  )
}
