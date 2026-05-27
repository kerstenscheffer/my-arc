// src/modules/meal-plan/components/RemainingPill.jsx
// Today's calorie budget header — bold "Je mag nog eten: X calorieën" line
// with a full-width progress bar underneath. Inline at the top of the meal
// page (Food-app style), not floating.

import React from 'react'

const G = {
  primary: '#FFD700',
  secondary: '#D4AF37',
  warn:    '#f59e0b',
  bad:     '#ef4444',
  textDim: 'rgba(255, 255, 255, 0.5)',
  textFaint: 'rgba(255, 255, 255, 0.35)',
  trackBg: 'rgba(255, 255, 255, 0.06)',
}

const fmt = (n) => Math.round(n || 0).toLocaleString('nl-NL')

export default function RemainingPill({ remaining, consumed, target, isMobile: propMobile }) {
  const isMobile = propMobile ?? window.innerWidth <= 768
  if (!remaining || !target) return null

  const kcalLeft = remaining.kcal
  const consumedKcal = consumed?.calories || 0
  const targetKcal = target.calories || 0
  const isOver = kcalLeft < 0
  const ratio = targetKcal > 0 ? Math.min(1, consumedKcal / targetKcal) : 0
  const overshoot = targetKcal > 0 && consumedKcal > targetKcal

  return (
    <div style={{
      padding: isMobile ? '0.75rem 1rem 0.875rem' : '0.875rem 2rem 1rem',
      borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
    }}>
      {/* Big "Je mag nog eten: X calorieën" line */}
      <div style={{
        fontSize: isMobile ? '0.95rem' : '1.05rem',
        fontWeight: 600,
        color: 'rgba(255, 255, 255, 0.85)',
        lineHeight: 1.3,
        marginBottom: '0.5rem',
      }}>
        {isOver ? (
          <>
            <span style={{ color: G.textDim }}>Je zit over je doel: </span>
            <strong style={{ color: G.warn, fontWeight: 800, fontSize: isMobile ? '1.05rem' : '1.15rem' }}>
              {fmt(Math.abs(kcalLeft))} kcal
            </strong>
          </>
        ) : (
          <>
            <span style={{ color: G.textDim }}>Je mag nog eten: </span>
            <strong style={{ color: '#fff', fontWeight: 800, fontSize: isMobile ? '1.05rem' : '1.15rem' }}>
              {fmt(kcalLeft)} kcal
            </strong>
          </>
        )}
      </div>

      {/* Progress bar */}
      <div style={{
        position: 'relative',
        height: '6px',
        background: G.trackBg,
        borderRadius: '999px',
        overflow: 'hidden',
        marginBottom: '0.4rem',
      }}>
        <div style={{
          width: `${ratio * 100}%`,
          height: '100%',
          background: overshoot
            ? 'linear-gradient(90deg, #FFD700 0%, #f59e0b 100%)'
            : 'linear-gradient(90deg, #FFD700 0%, #D4AF37 100%)',
          borderRadius: '999px',
          transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        }} />
      </div>

      {/* Subtitle: consumed left, target right */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: isMobile ? '0.7rem' : '0.75rem',
        fontWeight: 600,
        color: G.textFaint,
      }}>
        <span style={{ color: overshoot ? G.warn : G.primary }}>
          {fmt(consumedKcal)} kcal gegeten
        </span>
        <span>
          Doel: <strong style={{ color: 'rgba(255, 255, 255, 0.65)', fontWeight: 700 }}>{fmt(targetKcal)}</strong>
        </span>
      </div>

      {/* Optional protein line below — only when there's a protein goal */}
      {remaining.protein !== null && target.protein > 0 && (
        <div style={{
          marginTop: '0.4rem',
          fontSize: isMobile ? '0.68rem' : '0.72rem',
          color: G.textFaint,
        }}>
          Eiwit nog{' '}
          <strong style={{ color: '#fff', fontWeight: 700 }}>
            {remaining.protein > 0 ? fmt(remaining.protein) : 0}g
          </strong>
          <span style={{ color: G.textFaint }}> · doel {fmt(target.protein)}g</span>
        </div>
      )}
    </div>
  )
}
