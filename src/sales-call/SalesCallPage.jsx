// src/sales-call/SalesCallPage.jsx
// Main wrapper — snap scroll + Enter key navigation
import { useEffect, useRef, useState } from 'react'
import HeroSection from './sections/HeroSection'
import PillarenSection from './sections/PillarenSection'
import GarantiePrijsSection from './sections/GarantiePrijsSection'

const GOLD = '#ffba09'
const SECTION_COUNT = 3

export default function SalesCallPage() {
  const containerRef = useRef(null)
  const pageRef = useRef(null)
  const [current, setCurrent] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      pageRef.current?.requestFullscreen?.()
    } else {
      document.exitFullscreen?.()
    }
  }

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onFsChange)
    return () => document.removeEventListener('fullscreenchange', onFsChange)
  }, [])

  // Enter key → next section
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        const next = Math.min(current + 1, SECTION_COUNT - 1)
        setCurrent(next)
        containerRef.current?.children[next]?.scrollIntoView({ behavior: 'smooth' })
      }
      if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [current])

  // Track current section on scroll
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Array.from(container.children).indexOf(entry.target)
            if (idx >= 0) setCurrent(idx)
          }
        })
      },
      { threshold: 0.55 }
    )
    Array.from(container.children).forEach((child) => observer.observe(child))
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={pageRef} style={{ background: '#000' }}>
      <div
        ref={containerRef}
        style={{
          height: '100vh',
          overflowY: 'auto',
          scrollSnapType: 'y mandatory',
          scrollBehavior: 'smooth'
        }}
      >
        <HeroSection isMobile={isMobile} />
        <PillarenSection isMobile={isMobile} />
        <GarantiePrijsSection isMobile={isMobile} />
      </div>

      {/* Navigation dots */}
      <div style={{
        position: 'fixed',
        right: isMobile ? '10px' : '22px',
        top: '50%',
        transform: 'translateY(-50%)',
        display: 'flex',
        flexDirection: 'column',
        gap: '9px',
        zIndex: 100
      }}>
        {Array.from({ length: SECTION_COUNT }).map((_, i) => (
          <button
            key={i}
            onClick={() => {
              setCurrent(i)
              containerRef.current?.children[i]?.scrollIntoView({ behavior: 'smooth' })
            }}
            style={{
              width: current === i ? '9px' : '5px',
              height: current === i ? '9px' : '5px',
              borderRadius: '50%',
              background: current === i
                ? GOLD
                : ([0, 2, 4].includes(i) ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.15)'),
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              padding: 0,
              boxShadow: current === i ? '0 0 8px rgba(255,186,9,0.5)' : 'none'
            }}
            aria-label={`Ga naar sectie ${i + 1}`}
          />
        ))}
      </div>

      {/* Fullscreen button */}
      <button
        onClick={toggleFullscreen}
        style={{
          position: 'fixed',
          top: '16px',
          left: '16px',
          zIndex: 100,
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          background: 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.1)',
          color: 'rgba(255,255,255,0.5)',
          fontSize: '0.7rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(0,0,0,0.6)'
          e.currentTarget.style.color = '#fff'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(0,0,0,0.4)'
          e.currentTarget.style.color = 'rgba(255,255,255,0.5)'
        }}
        title="Fullscreen (F)"
      >
        {isFullscreen ? '✕' : '⛶'}
      </button>

      {/* Enter hint */}
      {current < SECTION_COUNT - 1 && (
        <div style={{
          position: 'fixed',
          bottom: '18px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(10px)',
          padding: '5px 12px',
          borderRadius: '18px',
          border: '1px solid rgba(255,186,9,0.15)',
          animation: 'pulseHint 2s ease-in-out infinite'
        }}>
          <span style={{
            fontSize: '0.55rem',
            fontWeight: '700',
            color: 'rgba(255,255,255,0.45)',
            letterSpacing: '0.08em'
          }}>ENTER</span>
          <span style={{ fontSize: '0.55rem', color: 'rgba(255,186,9,0.6)' }}>↓</span>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,900;1,400;1,600;1,700&family=DM+Sans:wght@400;500;600;700;800;900&display=swap');

        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'DM Sans', sans-serif; overflow: hidden; }
        ::-webkit-scrollbar { display: none; }

        .shimmer-gold {
          background: linear-gradient(110deg, #ffba09 0%, #ffba09 40%, #fff5d4 48%, #ffffff 50%, #fff5d4 52%, #ffba09 60%, #ffba09 100%);
          background-size: 300% 100%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmerGold 4s ease-in-out infinite;
          filter: drop-shadow(0 0 20px rgba(255,186,9,0.2));
        }

        @keyframes shimmerGold {
          0% { background-position: 100% center; }
          100% { background-position: -100% center; }
        }

        @keyframes pulseHint {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  )
}
