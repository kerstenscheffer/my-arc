// ========================================
// 📁 src/funnel/five-pilar/sections/HeroSection.jsx
// HERO - MY ARC — Begeleiding Naar Jouw Beste Shape
// Shimmer gold on "Beste Shape", rest white
// Bold value frames, spots under CTA
// ========================================
import { useState, useEffect, useCallback } from 'react'
import DatabaseService from '../../../services/DatabaseService'

export default function HeroSection({ isMobile, onScrollNext }) {
  const [spots, setSpots] = useState(null)
  const [isVisible, setIsVisible] = useState(false)
  const db = DatabaseService

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    loadSpots()
    const spotsService = db.getSpotsService()
    const subscription = spotsService.subscribeToSpots((newData) => {
      setSpots(newData)
    })
    return () => subscription.unsubscribe()
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
      const nextSection = document.getElementById('section-1')
      if (nextSection) nextSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const spotsLeft = spots ? spots.max_spots - spots.current_spots : null
  const spotsText = spotsLeft !== null
    ? spotsLeft <= 0
      ? "Volledig Volgeboekt"
      : spotsLeft === 1
        ? "Nog 1 plek beschikbaar"
        : `Nog ${spotsLeft} plekken beschikbaar`
    : null
  const isUrgent = spotsLeft !== null && spotsLeft <= 3 && spotsLeft > 0
  const isFull = spotsLeft !== null && spotsLeft <= 0

  // Keyboard: Space/Enter → next section
  const handleKey = useCallback((e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      const rect = document.getElementById('section-0')?.getBoundingClientRect()
      if (!rect || rect.bottom < 100 || rect.top > window.innerHeight) return
      e.preventDefault()
      scrollToNext()
    }
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleKey])

  return (
    <section style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: isMobile ? '2rem 1rem' : '3rem 2rem',
      position: 'relative',
      overflow: 'hidden',
      background: '#000000'
    }}>
      {/* Subtle golden radial glow */}
      <div style={{
        maxWidth: isMobile ? '100%' : '750px',
        width: '100%',
        zIndex: 1
      }}>

        <div style={{
          position: 'relative',
          zIndex: 2,
          textAlign: 'center'
        }}>

          {/* ══════ MY ARC BRANDING — TOP ══════ */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            marginBottom: isMobile ? '3rem' : '3.5rem',
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(-10px)',
            transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
          }}>
            <div style={{
              width: '40px', height: '1px',
              background: 'linear-gradient(90deg, transparent, rgba(255, 186, 9, 0.4))'
            }} />
            <span style={{
              fontSize: isMobile ? '0.7rem' : '0.8rem',
              fontWeight: '800',
              letterSpacing: '0.2em',
              color: 'rgba(255, 186, 9, 0.6)',
              textTransform: 'uppercase'
            }}>
              MY ARC
            </span>
            <div style={{
              width: '40px', height: '1px',
              background: 'linear-gradient(90deg, rgba(255, 186, 9, 0.4), transparent)'
            }} />
          </div>

          {/* ══════ HEADLINE ══════ */}
          <h1 style={{
            fontWeight: '900',
            lineHeight: 1.05,
            marginBottom: isMobile ? '3.5rem' : '4.5rem',
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.1s'
          }}>
            {/* Line 1: BEGELEIDING NAAR JOUW */}
            <span style={{
              display: 'block',
              fontSize: isMobile ? '1.5rem' : '2.25rem',
              color: '#ffffff',
              fontWeight: '900',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              marginBottom: isMobile ? '0.5rem' : '0.65rem'
            }}>
              Begeleiding Naar Jouw
            </span>

            {/* Line 2: BESTE SHAPE — shimmer gold, BIGGEST */}
            <span className="shimmer-gold" style={{
              display: 'block',
              fontSize: isMobile ? '4rem' : '7rem',
              lineHeight: 0.95,
              letterSpacing: '-0.03em'
            }}>
              Beste Shape
            </span>

            {/* Line 3: VOOR HET LEVEN — white, bold */}
            <span style={{
              display: 'block',
              fontSize: isMobile ? '2.35rem' : '3.75rem',
              color: '#ffffff',
              fontWeight: '900',
              letterSpacing: '-0.01em',
              lineHeight: 1.1,
              marginTop: isMobile ? '0.35rem' : '0.5rem'
            }}>
              Voor Het Leven
            </span>
          </h1>

          {/* ══════ SPOTS — LIVE + shimmer red number ══════ */}
          {spotsText && spotsLeft > 0 && (
            <div style={{
              opacity: isVisible ? 1 : 0,
              transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.25s',
              marginTop: isMobile ? '2.5rem' : '3rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}>
              {/* Live dot */}
              <span style={{
                width: '8px', height: '8px',
                borderRadius: '50%',
                background: '#10b981',
                display: 'inline-block',
                animation: 'blink 1.5s infinite',
                boxShadow: '0 0 8px rgba(16, 185, 129, 0.6)'
              }} />
              <span style={{
                fontSize: isMobile ? '0.8rem' : '0.9rem',
                fontWeight: '700',
                color: 'rgba(255, 255, 255, 0.5)',
                letterSpacing: '0.02em',
                textTransform: 'uppercase'
              }}>
                LIVE
              </span>
              <span style={{
                width: '1px', height: '14px',
                background: 'rgba(255, 255, 255, 0.15)',
                display: 'inline-block'
              }} />
              <span style={{
                fontSize: isMobile ? '0.9rem' : '1rem',
                fontWeight: '700',
                color: 'rgba(255, 255, 255, 0.6)',
                letterSpacing: '0.01em'
              }}>
                Nog{' '}
                <span className="shimmer-red" style={{
                  fontWeight: '900'
                }}>
                  {spotsLeft}
                </span>
                {' '}plekken beschikbaar
              </span>
            </div>
          )}

        </div>
      </div>

      {/* ══════ ENTER HINT — bottom of section ══════ */}
      <div style={{
        position: 'absolute',
        bottom: isMobile ? '1.5rem' : '2.5rem',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.4rem',
        opacity: isVisible ? 0.4 : 0,
        transition: 'opacity 0.8s ease 0.5s',
        animation: 'bounceHint 2s ease-in-out infinite',
        zIndex: 5
      }}>
        {!isMobile && (
          <div style={{
            padding: '0.25rem 0.75rem',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '6px',
            background: 'rgba(255, 255, 255, 0.03)',
            fontSize: '0.6rem',
            fontWeight: '700',
            color: 'rgba(255, 255, 255, 0.3)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase'
          }}>
            ENTER ↵
          </div>
        )}
        <svg width="16" height="10" viewBox="0 0 16 10" fill="none" style={{ opacity: 0.5 }}>
          <path d="M1 1L8 8L15 1" stroke="rgba(255,186,9,0.4)" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes bounceHint {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(6px); }
        }
        .shimmer-red {
          background: linear-gradient(
            110deg,
            #ef4444 0%,
            #ef4444 40%,
            #fca5a5 48%,
            #ffffff 50%,
            #fca5a5 52%,
            #ef4444 60%,
            #ef4444 100%
          );
          background-size: 300% 100%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmerRed 3s ease-in-out infinite;
          filter: drop-shadow(0 0 8px rgba(239, 68, 68, 0.3));
        }
        @keyframes shimmerRed {
          0% { background-position: 100% center; }
          100% { background-position: -100% center; }
        }
        .shimmer-gold {
          background: linear-gradient(
            110deg,
            #ffba09 0%,
            #ffba09 40%,
            #fff5d4 48%,
            #ffffff 50%,
            #fff5d4 52%,
            #ffba09 60%,
            #ffba09 100%
          );
          background-size: 300% 100%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmerSlide 4s ease-in-out infinite;
          filter: drop-shadow(0 0 25px rgba(255, 186, 9, 0.2));
        }
        @keyframes shimmerSlide {
          0% { background-position: 100% center; }
          100% { background-position: -100% center; }
        }
      `}</style>
    </section>
  )
}
