// src/funnel/90days/components/SpotsTracker.jsx

import React from 'react'

const GOLD = '#ffba09'
const GOLD_BRIGHT = '#ffd44d'

export default function SpotsTracker({ spotsLeft = 5 }) {
  const isMobile = window.innerWidth <= 768
  const maxSpots = 5
  const filledSpots = maxSpots - spotsLeft

  const urgencyLevel = spotsLeft <= 1 ? 'critical' : spotsLeft <= 2 ? 'high' : 'medium'
  const urgencyColor = urgencyLevel === 'critical' ? '#ef4444' : GOLD

  return (
    <section
      style={{
        padding: isMobile ? '1.5rem 1rem' : '2rem',
        background: 'rgba(255, 186, 9, 0.04)',
        border: `2px solid rgba(255, 186, 9, 0.15)`,
        borderRadius: isMobile ? '12px' : '16px',
        marginBottom: isMobile ? '2rem' : '3rem',
        textAlign: 'center',
        backdropFilter: 'blur(10px)',
      }}
    >
      <p
        style={{
          fontSize: isMobile ? '0.7rem' : '0.8rem',
          color: urgencyColor,
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '1px',
          margin: '0 0 0.75rem 0',
          animation: urgencyLevel === 'critical' ? 'pulse 2s infinite' : 'none',
          fontFamily: "'Poppins', sans-serif",
        }}
      >
        {spotsLeft <= 1 ? '🔥 ONLY 1 SPOT LEFT' : `${spotsLeft} SPOTS AVAILABLE`}
      </p>

      <h3
        style={{
          fontSize: isMobile ? '1.75rem' : '2.25rem',
          fontWeight: 900,
          margin: '0 0 1rem 0',
          color: '#fff',
          fontFamily: "'Poppins', sans-serif",
        }}
      >
        <span
          style={{
            background: 'linear-gradient(135deg, #ffba09 0%, #ffd44d 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          {spotsLeft}
        </span>{' '}
        / {maxSpots}
      </h3>

      {/* VISUAL SPOTS */}
      <div
        style={{
          display: 'flex',
          gap: isMobile ? '0.5rem' : '0.75rem',
          justifyContent: 'center',
          marginBottom: isMobile ? '1rem' : '1.5rem',
          flexWrap: 'wrap',
        }}
      >
        {Array.from({ length: maxSpots }).map((_, index) => (
          <div
            key={index}
            style={{
              width: isMobile ? '40px' : '48px',
              height: isMobile ? '40px' : '48px',
              borderRadius: '50%',
              background: index < spotsLeft ? 'rgba(255, 186, 9, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              border: `2px solid ${index < spotsLeft ? GOLD : '#ef4444'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: isMobile ? '0.75rem' : '0.875rem',
              fontWeight: 900,
              color: index < spotsLeft ? GOLD : '#ef4444',
              transition: 'all 0.3s ease',
              fontFamily: "'Poppins', sans-serif",
              animation: index < spotsLeft && spotsLeft <= 1 ? 'pulse 1.5s infinite' : 'none',
            }}
          >
            {index < spotsLeft ? '✓' : '✕'}
          </div>
        ))}
      </div>

      <p
        style={{
          fontSize: isMobile ? '0.75rem' : '0.85rem',
          color: 'rgba(255, 255, 255, 0.5)',
          margin: 0,
          fontFamily: "'Poppins', sans-serif",
        }}
      >
        Next cycle opens in 2 weeks
      </p>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </section>
  )
}
