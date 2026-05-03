// src/modules/nutrition-intake/components/TrainingSection.jsx
// v3 — alleen meal-timing relevante vragen
// Trainingsdagen + duur komen al uit Phase 1/3
// Hier: alleen tijdstip (voor pre/post workout maaltijden)
import React, { useState, useEffect } from 'react'
import { intakeTheme as t, r } from '../styles/intake-theme'

const DAYS = [
  { id: 'ma', label: 'Ma' }, { id: 'di', label: 'Di' }, { id: 'wo', label: 'Wo' },
  { id: 'do', label: 'Do' }, { id: 'vr', label: 'Vr' }, { id: 'za', label: 'Za' }, { id: 'zo', label: 'Zo' }
]

const TIME_PRESETS = [
  { id: 'vroege_ochtend', label: 'Vroege ochtend', sub: 'Voor 8:00' },
  { id: 'late_ochtend', label: 'Late ochtend', sub: '8:00 — 12:00' },
  { id: 'vroege_middag', label: 'Vroege middag', sub: '12:00 — 15:00' },
  { id: 'late_middag', label: 'Late middag', sub: '15:00 — 17:00' },
  { id: 'vroege_avond', label: 'Vroege avond', sub: '17:00 — 19:00' },
  { id: 'late_avond', label: 'Late avond', sub: 'Na 19:00' }
]

export default function TrainingSection({ value, onChange, onComplete, isMobile, clientData }) {
  const existingTime = clientData?.training_time || null

  const [data, setData] = useState({
    training_days: [],
    default_time: existingTime ? getPresetFromTime(existingTime) : null,
    varies_per_day: false,
    per_day_times: {},
    ...(value || {})
  })

  useEffect(() => {
    if (value) setData(prev => ({ ...prev, ...value }))
  }, [value])

  const update = (field, val) => setData(prev => ({ ...prev, [field]: val }))

  const toggleDay = (dayId) => {
    const current = data.training_days || []
    update('training_days', current.includes(dayId) ? current.filter(d => d !== dayId) : [...current, dayId])
  }

  const setPerDayTime = (dayId, timeId) => {
    update('per_day_times', { ...(data.per_day_times || {}), [dayId]: timeId })
  }

  const hasDays = (data.training_days || []).length > 0
  const hasTime = data.varies_per_day
    ? (data.training_days || []).every(d => data.per_day_times?.[d])
    : !!data.default_time
  const isComplete = hasDays && hasTime

  const handleConfirm = () => {
    if (!isComplete) return
    onChange(data)
  }

  return (
    <div>
      {/* Context note */}
      <div style={{
        padding: r(isMobile, '0.5rem 1rem', '0.6rem 1.25rem'),
        borderBottom: `1px solid ${t.colors.border}`,
        fontSize: r(isMobile, '0.58rem', '0.62rem'),
        color: t.colors.textMuted, lineHeight: 1.5
      }}>
        Dit gebruiken we voor de timing van je maaltijden — pre- en post-workout voeding.
      </div>

      {/* Trainingsdagen */}
      <QRow label="Op welke dagen train je?" isMobile={isMobile}>
        <div style={{ display: 'flex', gap: r(isMobile, '0.25rem', '0.3rem') }}>
          {DAYS.map(day => {
            const sel = (data.training_days || []).includes(day.id)
            return (
              <button key={day.id} onClick={() => toggleDay(day.id)} style={{
                flex: 1, padding: r(isMobile, '0.5rem 0', '0.55rem 0'),
                background: sel ? 'rgba(255,215,0,0.08)' : t.colors.inputBg,
                border: `1px solid ${sel ? 'rgba(255,215,0,0.35)' : t.colors.borderVisible}`,
                borderRadius: '6px', color: sel ? '#FFD700' : t.colors.textMuted,
                fontSize: r(isMobile, '0.6rem', '0.65rem'), fontWeight: sel ? 800 : 600,
                cursor: 'pointer', minHeight: '36px',
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                transition: 'all 0.15s ease', fontFamily: 'inherit'
              }}>{day.label}</button>
            )
          })}
        </div>
        {hasDays && (
          <div style={{ marginTop: '0.25rem', fontSize: r(isMobile, '0.5rem', '0.52rem'), fontWeight: 700, color: t.colors.gold }}>
            {(data.training_days || []).length}x per week
          </div>
        )}
      </QRow>

      {/* Trainingstijd */}
      {hasDays && (
        <QRow label="Hoe laat train je meestal?" isMobile={isMobile}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: r(isMobile, '0.3rem', '0.35rem') }}>
            {TIME_PRESETS.map(preset => {
              const sel = !data.varies_per_day && data.default_time === preset.id
              return (
                <button key={preset.id} onClick={() => { update('default_time', preset.id); update('varies_per_day', false) }} style={{
                  padding: r(isMobile, '0.45rem 0.5rem', '0.5rem 0.6rem'),
                  background: sel ? 'rgba(255,215,0,0.06)' : t.colors.inputBg,
                  border: `1px solid ${sel ? 'rgba(255,215,0,0.35)' : t.colors.borderVisible}`,
                  borderRadius: '8px', cursor: 'pointer', minHeight: '40px',
                  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                  transition: 'all 0.15s ease', textAlign: 'left', fontFamily: 'inherit'
                }}>
                  <div style={{ fontSize: r(isMobile, '0.7rem', '0.74rem'), fontWeight: sel ? 800 : 600, color: sel ? '#FFD700' : t.colors.textSecondary }}>{preset.label}</div>
                  <div style={{ fontSize: r(isMobile, '0.48rem', '0.5rem'), fontWeight: 500, color: t.colors.textMuted, marginTop: '0.05rem' }}>{preset.sub}</div>
                </button>
              )
            })}
          </div>
          <button onClick={() => update('varies_per_day', !data.varies_per_day)} style={{
            width: '100%', marginTop: r(isMobile, '0.3rem', '0.35rem'),
            padding: r(isMobile, '0.45rem 0.5rem', '0.5rem 0.6rem'),
            background: data.varies_per_day ? 'rgba(255,215,0,0.06)' : 'transparent',
            border: `1px solid ${data.varies_per_day ? 'rgba(255,215,0,0.35)' : t.colors.borderVisible}`,
            borderRadius: '8px', color: data.varies_per_day ? '#FFD700' : t.colors.textMuted,
            fontSize: r(isMobile, '0.65rem', '0.7rem'), fontWeight: data.varies_per_day ? 800 : 600,
            cursor: 'pointer', textAlign: 'center', fontFamily: 'inherit',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: '38px'
          }}>Verschilt per dag</button>
        </QRow>
      )}

      {/* Per-dag tijden */}
      {hasDays && data.varies_per_day && (
        <QRow label="Selecteer per trainingsdag" isMobile={isMobile}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: r(isMobile, '0.25rem', '0.3rem') }}>
            {(data.training_days || []).map(dayId => {
              const day = DAYS.find(d => d.id === dayId)
              const selTime = data.per_day_times?.[dayId]
              return (
                <div key={dayId} style={{ display: 'flex', alignItems: 'center', gap: r(isMobile, '0.3rem', '0.4rem'), padding: r(isMobile, '0.3rem 0', '0.35rem 0'), borderBottom: `1px solid ${t.colors.border}` }}>
                  <span style={{ fontSize: r(isMobile, '0.65rem', '0.7rem'), fontWeight: 800, color: '#FFD700', minWidth: '24px' }}>{day?.label}</span>
                  <div style={{ flex: 1, display: 'flex', gap: '0.15rem', flexWrap: 'wrap' }}>
                    {TIME_PRESETS.map(preset => {
                      const active = selTime === preset.id
                      return (
                        <button key={preset.id} onClick={() => setPerDayTime(dayId, preset.id)} style={{
                          padding: r(isMobile, '0.25rem 0.35rem', '0.3rem 0.4rem'),
                          background: active ? 'rgba(255,215,0,0.06)' : 'transparent',
                          border: `1px solid ${active ? 'rgba(255,215,0,0.3)' : t.colors.borderVisible}`,
                          borderRadius: '4px', color: active ? '#FFD700' : t.colors.textMuted,
                          fontSize: r(isMobile, '0.45rem', '0.48rem'), fontWeight: active ? 800 : 600,
                          cursor: 'pointer', fontFamily: 'inherit',
                          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: '24px'
                        }}>{preset.label}</button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </QRow>
      )}

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
        }}>{isComplete ? 'OPSLAAN EN DOOR' : 'VUL ALLE VELDEN IN'}</button>
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

function getPresetFromTime(timeStr) {
  if (!timeStr) return null
  const hour = parseInt(timeStr.split(':')[0])
  if (hour < 8) return 'vroege_ochtend'
  if (hour < 12) return 'late_ochtend'
  if (hour < 15) return 'vroege_middag'
  if (hour < 17) return 'late_middag'
  if (hour < 19) return 'vroege_avond'
  return 'late_avond'
}
