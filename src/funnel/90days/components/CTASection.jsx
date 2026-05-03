// src/funnel/90days/components/CTASection.jsx

import React from 'react'

export default function CTASection({ spotsLeft = 5, isOpen = true, onBook = () => {} }) {
  const isMobile = window.innerWidth <= 768

  const handleBookClick = () => {
    onBook()
  }

  const handleTouchStart = (e) => {
    if (isMobile) {
      e.currentTarget.style.transform = 'scale(0.95)'
      e.currentTarget.style.boxShadow = '0 0 30px rgba(16, 185, 129, 0.5)'
    }
  }

  const handleTouchEnd = (e) => {
    if (isMobile) {
      e.currentTarget.style.transform = 'scale(1)'
      e.currentTarget.style.boxShadow = '0 0 20px rgba(16, 185, 129, 0.3)'
    }
  }

  const handleMouseEnter = (e) => {
    if (!isMobile) {
      e.currentTarget.style.transform = 'translateY(-4px)'
      e.currentTarget.style.boxShadow = '0 10px 40px rgba(16, 185, 129, 0.4)'
    }
  }

  const handleMouseLeave = (e) => {
    if (!isMobile) {
      e.currentTarget.style.transform = 'translateY(0)'
      e.currentTarget.style.boxShadow = '0 0px 20px rgba(16, 185, 129, 0.3)'
    }
  }

  return (
    <section
      style={{
        padding: isMobile ? '2rem 1rem' : '3rem 2rem',
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%)',
        borderRadius: isMobile ? '12px' : '16px',
        border: '2px solid rgba(16, 185, 129, 0.3)',
        textAlign: 'center',
        backdropFilter: 'blur(10px)',
        marginBottom: isMobile ? '2rem' : '3rem',
      }}
    >
      {/* MAIN CTA */}
      <h2
        style={{
          fontSize: isMobile ? '1.75rem' : '2.5rem',
          fontWeight: 'bold',
          marginBottom: isMobile ? '0.75rem' : '1rem',
          color: '#fff',
          lineHeight: '1.2',
        }}
      >
        Ready To Transform?
      </h2>

      <p
        style={{
          fontSize: isMobile ? '0.9rem' : '1.1rem',
          color: 'rgba(255, 255, 255, 0.8)',
          marginBottom: isMobile ? '1.5rem' : '2rem',
          maxWidth: '600px',
          margin: '0 auto',
          marginTop: '0.5rem',
        }}
      >
        {spotsLeft > 0 ? (
          <>
            Join our next cohort and start your 90-day transformation.
            <br />
            <span style={{ color: '#FFD700', fontWeight: 'bold' }}>
              {spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} remaining this cycle.
            </span>
          </>
        ) : (
          <>
            This cycle is full. Join the waitlist for next week.
            <br />
            <span style={{ color: '#FFD700', fontWeight: 'bold' }}>
              Next cohort starts in 2 weeks.
            </span>
          </>
        )}
      </p>

      {/* BUTTONS */}
      <div
        style={{
          display: 'flex',
          gap: isMobile ? '1rem' : '1.5rem',
          justifyContent: 'center',
          flexWrap: isMobile ? 'wrap' : 'nowrap',
          marginBottom: isMobile ? '1.5rem' : '2rem',
        }}
      >
        {/* PRIMARY BUTTON */}
        <button
          onClick={handleBookClick}
          disabled={!isOpen || spotsLeft === 0}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          style={{
            padding: isMobile ? '1rem 1.5rem' : '1.25rem 2.5rem',
            background:
              isOpen && spotsLeft > 0
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                : 'rgba(16, 185, 129, 0.3)',
            color: isOpen && spotsLeft > 0 ? '#000' : 'rgba(255, 255, 255, 0.5)',
            border: 'none',
            borderRadius: isMobile ? '12px' : '14px',
            fontSize: isMobile ? '0.95rem' : '1.05rem',
            fontWeight: 'bold',
            cursor: isOpen && spotsLeft > 0 ? 'pointer' : 'not-allowed',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            boxShadow: isOpen && spotsLeft > 0 ? '0 0px 20px rgba(16, 185, 129, 0.3)' : 'none',
            minHeight: '44px',
            minWidth: isMobile ? '100%' : 'auto',
          }}
        >
          {spotsLeft > 0 ? 'Book Free Intake Call' : 'Join Waitlist'}
        </button>

        {/* SECONDARY BUTTON */}
        <button
          onClick={() => {
            // Will link to lead magnet / free training
            window.open('#free-training', '_blank')
          }}
          onMouseEnter={(e) => {
            if (!isMobile) {
              e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.6)'
              e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'
            }
          }}
          onMouseLeave={(e) => {
            if (!isMobile) {
              e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.3)'
              e.currentTarget.style.background = 'transparent'
            }
          }}
          onTouchStart={(e) => {
            if (isMobile) {
              e.currentTarget.style.background = 'rgba(16, 185, 129, 0.15)'
            }
          }}
          onTouchEnd={(e) => {
            if (isMobile) {
              e.currentTarget.style.background = 'transparent'
            }
          }}
          style={{
            padding: isMobile ? '1rem 1.5rem' : '1.25rem 2.5rem',
            background: 'transparent',
            color: '#10b981',
            border: '2px solid rgba(16, 185, 129, 0.3)',
            borderRadius: isMobile ? '12px' : '14px',
            fontSize: isMobile ? '0.95rem' : '1.05rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            minHeight: '44px',
            minWidth: isMobile ? '100%' : 'auto',
          }}
        >
          Watch Free Training
        </button>
      </div>

      {/* GUARANTEE BADGE */}
      <div
        style={{
          padding: isMobile ? '1rem' : '1.25rem',
          background: 'rgba(255, 215, 0, 0.1)',
          border: '1px solid rgba(255, 215, 0, 0.3)',
          borderRadius: isMobile ? '10px' : '12px',
          textAlign: 'center',
        }}
      >
        <p
          style={{
            fontSize: isMobile ? '0.85rem' : '0.95rem',
            color: 'rgba(255, 255, 255, 0.9)',
            margin: 0,
            fontWeight: '500',
          }}
        >
          <span style={{ color: '#FFD700', fontWeight: 'bold' }}>🤝 Results Guarantee:</span>
          <br />
          5-15kg fat loss in 90 days OR get your €597 back
          <br />
          <span style={{ fontSize: isMobile ? '0.75rem' : '0.85rem', color: 'rgba(255, 255, 255, 0.7)' }}>
            (80%+ compliance required)
          </span>
        </p>
      </div>

      {/* DETAILS */}
      <div
        style={{
          marginTop: isMobile ? '1.5rem' : '2rem',
          padding: isMobile ? '1rem' : '1.25rem',
          background: 'rgba(16, 185, 129, 0.05)',
          borderRadius: isMobile ? '10px' : '12px',
          textAlign: 'left',
        }}
      >
        <h3
          style={{
            fontSize: isMobile ? '0.95rem' : '1.05rem',
            fontWeight: 'bold',
            color: '#10b981',
            marginBottom: '0.75rem',
          }}
        >
          What's Included:
        </h3>
        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            fontSize: isMobile ? '0.85rem' : '0.95rem',
            color: 'rgba(255, 255, 255, 0.8)',
          }}
        >
          {[
            'Custom meal plans (tailored to your preferences)',
            'Complete workout program with progressions',
            'Weekly check-in calls & voice note support',
            'Photo & weight tracking (Friday updates)',
            '100% privacy & confidentiality',
          ].map((item, i) => (
            <li
              key={i}
              style={{
                marginBottom: isMobile ? '0.5rem' : '0.625rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.5rem',
              }}
            >
              <span style={{ color: '#10b981', fontWeight: 'bold', marginRight: '0.5rem' }}>✓</span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
