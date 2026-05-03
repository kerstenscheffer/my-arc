// src/client/components/MotivationQuoteSlider.jsx
import { useState, useEffect } from 'react'
import { Sparkles } from 'lucide-react'

const motivationSlides = [
  {
    url: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1600&h=500&fit=crop&q=85',
    quote: 'Discipline is de brug tussen doelen en prestaties',
    author: 'Jim Rohn'
  },
  {
    url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1600&h=500&fit=crop&q=85',
    quote: 'Je lichaam kan het aan. Het is je geest die je moet overtuigen',
    author: 'MY ARC'
  },
  {
    url: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=1600&h=500&fit=crop&q=85',
    quote: 'Success is the sum of small efforts repeated day in and day out',
    author: 'Robert Collier'
  },
  {
    url: 'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=1600&h=500&fit=crop&q=85',
    quote: 'Champions worden gemaakt van iets diep van binnen',
    author: 'Muhammad Ali'
  },
  {
    url: 'https://images.unsplash.com/photo-1605296867424-35fc25c9212a?w=1600&h=500&fit=crop&q=85',
    quote: 'Elke dag is een nieuwe kans om je beste versie te worden',
    author: 'MY ARC'
  }
]

export default function MotivationQuoteSlider() {
  const isMobile = window.innerWidth <= 768
  const [currentIndex, setCurrentIndex] = useState(0)
  const [touchStart, setTouchStart] = useState(null)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev === motivationSlides.length - 1 ? 0 : prev + 1))
    }, 6000)
    return () => clearInterval(interval)
  }, [])

  const handleTouchStart = (e) => setTouchStart(e.targetTouches[0].clientX)

  const handleTouchEnd = (e) => {
    if (!touchStart) return
    const diff = touchStart - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) {
      setCurrentIndex(prev =>
        diff > 0
          ? (prev === motivationSlides.length - 1 ? 0 : prev + 1)
          : (prev === 0 ? motivationSlides.length - 1 : prev - 1)
      )
    }
    setTouchStart(null)
  }

  return (
    <div style={{
      padding: isMobile ? '0 1rem 1rem' : '0 1.5rem 1.5rem',
      marginBottom: isMobile ? '0.5rem' : '1rem'
    }}>
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          position: 'relative',
          width: '100%',
          height: isMobile ? '200px' : '260px',
          borderRadius: isMobile ? '10px' : '12px',
          overflow: 'hidden',
          touchAction: 'pan-y',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          border: '1px solid rgba(255, 215, 0, 0.2)',
          borderLeft: '3px solid #FFD700',
          background: '#000'
        }}
      >
        {/* Background image */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${motivationSlides[currentIndex].url})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          transition: 'opacity 0.5s ease',
          filter: 'brightness(0.45)',
          zIndex: 1
        }} />

        {/* Bottom gradient */}
        <div style={{
          position: 'absolute',
          bottom: 0, left: 0, right: 0,
          height: '65%',
          background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%)',
          pointerEvents: 'none',
          zIndex: 2
        }} />

        {/* Gold top accent line */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, #FFD700 0%, transparent 100%)',
          zIndex: 4
        }} />

        {/* Content */}
        <div style={{
          position: 'absolute',
          bottom: 0, left: 0, right: 0,
          padding: isMobile ? '1rem' : '1.25rem',
          zIndex: 3
        }}>
          {/* Label */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            marginBottom: '0.5rem'
          }}>
            <Sparkles size={11} color="#FFD700" />
            <span style={{
              fontSize: '0.6rem', fontWeight: '800',
              color: '#FFD700', textTransform: 'uppercase', letterSpacing: '0.07em'
            }}>
              Daily Motivation
            </span>
          </div>

          {/* Quote */}
          <p style={{
            color: '#fff',
            fontSize: isMobile ? '0.9rem' : '1.05rem',
            fontWeight: '700',
            letterSpacing: '-0.01em',
            lineHeight: 1.4,
            margin: 0,
            marginBottom: '0.5rem',
            fontStyle: 'italic'
          }}>
            "{motivationSlides[currentIndex].quote}"
          </p>

          {/* Author + dots row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{
              fontSize: '0.7rem', fontWeight: '700',
              color: '#FFD700', letterSpacing: '0.04em',
              textTransform: 'uppercase'
            }}>
              — {motivationSlides[currentIndex].author}
            </span>

            {/* Progress dots */}
            <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
              {motivationSlides.map((_, i) => (
                <div
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  style={{
                    width: i === currentIndex ? '20px' : '5px',
                    height: '3px',
                    borderRadius: '2px',
                    background: i === currentIndex ? '#FFD700' : 'rgba(255,255,255,0.25)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent'
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
