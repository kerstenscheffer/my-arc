// ========================================
// 📁 src/funnel/sections/HeroTransformation.jsx
// HERO WITH REAL-TIME SPOTS TRACKING
// GOLD-BROWN THEME + LIVE SPOTS BADGE
// ========================================
import React, { useState, useEffect } from 'react'
import { Check, ArrowRight } from 'lucide-react'
import DatabaseService from '../../services/DatabaseService'

export default function HeroTransformation({ isMobile, onScrollNext }) {
  const [hoveredButton, setHoveredButton] = useState(false)
  const [spots, setSpots] = useState(null)
  const db = DatabaseService

  // Load spots and subscribe to real-time updates
  useEffect(() => {
    loadSpots()
    
    // Subscribe to real-time updates
    const spotsService = db.getSpotsService()
    const subscription = spotsService.subscribeToSpots((newData) => {
      setSpots(newData)
    })
    
    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const loadSpots = async () => {
    const spotsService = db.getSpotsService()
    const data = await spotsService.getCurrentSpots()
    setSpots(data)
  }

  const scrollToNext = () => {
    if (onScrollNext) {
      onScrollNext()
    } else {
      const nextSection = document.getElementById('section-2')
      if (nextSection) {
        nextSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
  }

  // Calculate spots left
  const spotsLeft = spots ? spots.max_spots - spots.current_spots : null
  const spotsText = spotsLeft !== null 
    ? spotsLeft <= 0 
      ? "Volledig Volgeboekt"
      : spotsLeft === 1 
        ? "Nog 1 Plek Beschikbaar"
        : `Nog ${spotsLeft} Plekken Beschikbaar`
    : "Plekken Laden..."

  // Determine badge colors based on urgency
  const isUrgent = spotsLeft !== null && spotsLeft <= 3 && spotsLeft > 0
  const isFull = spotsLeft !== null && spotsLeft <= 0

  return (
    <section style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: isMobile ? '2rem 1rem' : '3rem 2rem',
      position: 'relative',
      overflow: 'hidden',
      background: 'linear-gradient(180deg, #000000 0%, #0a0a0a 50%, #000000 100%)'
    }}>
      {/* Subtle golden gradient overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(ellipse at center, rgba(255, 186, 9, 0.02) 0%, transparent 60%)',
        pointerEvents: 'none'
      }} />

      {/* Content container */}
      <div style={{
        maxWidth: isMobile ? '100%' : '700px',
        width: '100%',
        zIndex: 1
      }}>
        {/* Dynamic Spots Badge - REAL-TIME - NO ICON */}
        <div style={{
          textAlign: 'center',
          marginBottom: isMobile ? '2rem' : '2.5rem'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: isUrgent || isFull
              ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.1) 100%)'
              : 'linear-gradient(135deg, rgba(23, 23, 23, 0.8) 0%, rgba(23, 23, 23, 0.6) 100%)',
            backdropFilter: 'blur(12px)',
            border: isUrgent || isFull
              ? '1px solid rgba(239, 68, 68, 0.3)'
              : '1px solid rgba(255, 186, 9, 0.15)',
            borderRadius: '100px',
            padding: isMobile ? '0.5rem 1.25rem' : '0.625rem 1.5rem',
            boxShadow: isUrgent
              ? '0 2px 12px rgba(239, 68, 68, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.03)'
              : '0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.03)',
            animation: isUrgent ? 'pulseBadge 2s ease-in-out infinite' : 'none',
            position: 'relative'
          }}>
            {/* Badge text - SMALLER */}
            <span style={{
              fontSize: isMobile ? '0.7rem' : '0.8rem',
              fontWeight: '700',
              color: isUrgent || isFull ? '#ef4444' : '#ffba09',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem'
            }}>
              {spotsText}
              
              {/* LIVE indicator - only when active and spots available */}
              {spots?.is_active && spotsLeft > 0 && (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  marginLeft: '0.125rem'
                }}>
                  <span style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: isUrgent ? '#ef4444' : '#10b981',
                    animation: 'blink 1.5s infinite',
                    display: 'inline-block'
                  }} />
                  <span style={{
                    fontSize: isMobile ? '0.6rem' : '0.7rem',
                    fontWeight: '600',
                    opacity: 0.7
                  }}>
                    LIVE
                  </span>
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Content - Direct without card wrapper */}
        <div style={{
          position: 'relative',
          zIndex: 2,
          textAlign: 'center'
        }}>
          {/* Headline - GOLD-BROWN GRADIENT - BIGGER */}
          <h1 style={{
            fontSize: isMobile ? '3.5rem' : '5.5rem',
            fontWeight: '900',
            lineHeight: '1',
            marginBottom: isMobile ? '3rem' : '3.5rem',
            letterSpacing: '-0.02em'
          }}>
            <span style={{
              display: 'block',
              background: 'linear-gradient(135deg, #ffba09 0%, #d4a006 35%, #8b6804 65%, #402400 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: 'drop-shadow(0 2px 12px rgba(255, 186, 9, 0.15))',
              marginBottom: '0.5rem'
            }}>
              5-8 KG DROOG
            </span>
            
            {/* Subtitle with strikethrough on "In 1 jaar" */}
            <span style={{
              display: 'block',
              color: '#fff',
              fontSize: isMobile ? '1.75rem' : '2.25rem',
              fontWeight: '700',
              opacity: 0.9
            }}>
              <span style={{
                textDecoration: 'line-through',
                textDecorationColor: '#ef4444',
                textDecorationThickness: '3px'
              }}>
                In 1 jaar
              </span>
              {' | '}
              In 6 maanden
            </span>
          </h1>

          {/* Single Bullet Point - GOLD CHECKMARK */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: isMobile ? '1rem' : '1.25rem',
            maxWidth: '500px',
            margin: '0 auto',
            marginBottom: isMobile ? '2.5rem' : '3rem'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: isMobile ? '0.75rem' : '1rem'
            }}>
              {/* Icon container - Round - GOLD */}
              <div style={{
                width: isMobile ? '24px' : '28px',
                height: isMobile ? '24px' : '28px',
                borderRadius: '50%',
                background: 'rgba(255, 186, 9, 0.1)',
                border: '1px solid rgba(255, 186, 9, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Check 
                  size={isMobile ? 14 : 16} 
                  color="#ffba09"
                  strokeWidth={2.5}
                />
              </div>
              <span style={{
                fontSize: isMobile ? '0.95rem' : '1.05rem',
                color: 'rgba(255, 255, 255, 0.75)',
                fontWeight: '600',
                textAlign: 'left',
                lineHeight: 1.4
              }}>
                Naar je beste shape met een plan & ondersteuning
              </span>
            </div>
          </div>

          {/* CTA Button - GOLD ACCENT */}
          <button
            onClick={scrollToNext}
            onMouseEnter={() => setHoveredButton(true)}
            onMouseLeave={() => setHoveredButton(false)}
            onTouchStart={(e) => {
              if (isMobile) {
                e.currentTarget.style.transform = 'scale(0.98)'
              }
            }}
            onTouchEnd={(e) => {
              if (isMobile) {
                e.currentTarget.style.transform = 'scale(1)'
              }
            }}
            style={{
              background: hoveredButton
                ? 'linear-gradient(135deg, rgba(255, 186, 9, 0.2) 0%, rgba(212, 160, 6, 0.15) 100%)'
                : 'rgba(255, 186, 9, 0.08)',
              border: `1px solid ${hoveredButton ? 'rgba(255, 186, 9, 0.3)' : 'rgba(255, 186, 9, 0.15)'}`,
              borderRadius: isMobile ? '12px' : '14px',
              padding: isMobile ? '1rem 2rem' : '1.25rem 2.5rem',
              fontSize: isMobile ? '1rem' : '1.125rem',
              fontWeight: '700',
              color: hoveredButton ? '#ffba09' : '#d4a006',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.625rem',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: hoveredButton ? 'translateY(-2px)' : 'translateY(0)',
              boxShadow: hoveredButton
                ? '0 4px 12px rgba(255, 186, 9, 0.15)'
                : '0 2px 8px rgba(0, 0, 0, 0.2)',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '44px',
              letterSpacing: '0.01em'
            }}
          >
            <span>Zie Het Programma</span>
            <ArrowRight 
              size={isMobile ? 18 : 20} 
              style={{
                transition: 'transform 0.3s ease',
                transform: hoveredButton ? 'translateX(4px)' : 'translateX(0)'
              }}
            />
          </button>
        </div>

        {/* Small trust line onder card */}
        <div style={{
          textAlign: 'center',
          marginTop: isMobile ? '2rem' : '2.5rem'
        }}>
          <p style={{
            fontSize: isMobile ? '0.8rem' : '0.875rem',
            color: 'rgba(255, 255, 255, 0.4)',
            fontWeight: '500',
            letterSpacing: '0.02em'
          }}>
            Voor mannen die willen garanderen dat ze resultaten halen
          </p>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes pulseBadge {
          0%, 100% { 
            opacity: 0.9;
            transform: scale(1);
          }
          50% { 
            opacity: 1;
            transform: scale(1.02);
          }
        }
        
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </section>
  )
}
