// src/lead-magnet/components/SecretsCarousel.jsx
import { useState, useEffect, useRef, useCallback } from 'react'
import { GOLD, GOLD_DARK, GoldText, SECRETS } from './shared'
import SecretCard from './SecretCard'

function ProgressDots({ current, total, onDotClick }) {
  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center' }}>
      {Array.from({ length: total }).map((_, i) => (
        <button key={i} onClick={() => onDotClick(i)} style={{
          width: current === i ? '28px' : '8px', height: '8px', borderRadius: '4px',
          border: 'none',
          background: current === i ? `linear-gradient(90deg, ${GOLD}, ${GOLD_DARK})` : 'rgba(255,255,255,0.15)',
          cursor: 'pointer',
          transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          boxShadow: current === i ? `0 0 12px ${GOLD}40` : 'none',
          padding: 0,
        }} />
      ))}
    </div>
  )
}

export default function SecretsCarousel({ isMobile, onComplete }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const touchStartX = useRef(0)

  const navigate = useCallback((dir) => {
    setCurrentIndex(prev => {
      const next = prev + dir
      if (next < 0) return 0
      if (next >= SECRETS.length) {
        onComplete()
        return prev
      }
      return next
    })
  }, [onComplete])

  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX }
  const handleTouchEnd = (e) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) navigate(diff > 0 ? 1 : -1)
  }

  useEffect(() => {
    const h = (e) => {
      if (e.key === 'ArrowRight') navigate(1)
      if (e.key === 'ArrowLeft') navigate(-1)
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [navigate])

  return (
    <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: '1.5rem 0',
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: isMobile ? '1.5rem' : '2rem', padding: '0 1rem' }}>
        <GoldText as="h1" style={{
          fontSize: isMobile ? '1.1rem' : '1.3rem', fontWeight: '800',
          display: 'block', letterSpacing: '0.05em',
        }}>7 SUMMER SHAPE SECRETS</GoldText>
      </div>

      {/* 3D Carousel */}
      <div style={{
        position: 'relative', width: '100%', height: isMobile ? '540px' : '560px',
        perspective: '1200px', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          position: 'relative', transformStyle: 'preserve-3d',
          width: 'min(340px, 85vw)', height: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {SECRETS.map((secret, i) => {
            let offset = i - currentIndex
            if (offset > SECRETS.length / 2) offset -= SECRETS.length
            if (offset < -SECRETS.length / 2) offset += SECRETS.length
            return (
              <SecretCard key={i} secret={secret} isActive={i === currentIndex}
                offset={offset} total={SECRETS.length}
                onClick={() => { if (i !== currentIndex) setCurrentIndex(i) }}
              />
            )
          })}
        </div>
      </div>

      {/* Navigation */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: '1.25rem', marginTop: isMobile ? '1rem' : '1.5rem',
      }}>
        <ProgressDots current={currentIndex} total={SECRETS.length} onDotClick={setCurrentIndex} />

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {currentIndex > 0 && (
            <button onClick={() => navigate(-1)} style={{
              padding: '0.65rem 1.25rem', borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)',
              color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', fontWeight: '700',
              cursor: 'pointer', transition: 'all 0.3s ease', touchAction: 'manipulation',
            }}>← VORIGE</button>
          )}
          <button onClick={() => navigate(1)} style={{
            padding: '0.65rem 1.5rem', borderRadius: '10px',
            border: `1.5px solid ${GOLD}50`,
            background: currentIndex === SECRETS.length - 1
              ? `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_DARK} 100%)`
              : `${GOLD}12`,
            color: currentIndex === SECRETS.length - 1 ? '#000' : GOLD,
            fontSize: '0.8rem', fontWeight: '800', cursor: 'pointer',
            transition: 'all 0.3s ease', touchAction: 'manipulation',
            boxShadow: currentIndex === SECRETS.length - 1 ? `0 4px 16px rgba(255,186,9,0.3)` : 'none',
          }}>
            {currentIndex === SECRETS.length - 1 ? 'KLAAR → GIVEAWAY' : 'VOLGENDE →'}
          </button>
        </div>

        {!isMobile && (
          <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.2)' }}>
            ← → toetsen of klik om te navigeren
          </span>
        )}
      </div>
    </div>
  )
}
