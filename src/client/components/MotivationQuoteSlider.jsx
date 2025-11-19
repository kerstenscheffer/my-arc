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
    }, 6000) // 6 seconds per slide
    return () => clearInterval(interval)
  }, [])
  
  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX)
  }
  
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
      {/* Main container with dark blue accent ring */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          position: 'relative',
          width: '100%',
          height: isMobile ? '200px' : '260px',
          borderRadius: isMobile ? '16px' : '20px',
          overflow: 'hidden',
          touchAction: 'pan-y',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          border: '2px solid rgba(37, 99, 235, 0.3)',
          boxShadow: '0 8px 32px rgba(37, 99, 235, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.03)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          background: '#000'
        }}
      >
        {/* Background image with transition */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `url(${motivationSlides[currentIndex].url})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          transition: 'opacity 0.5s ease',
          zIndex: 1
        }} />
        
        {/* Top vignette for depth */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '40%',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.5), transparent)',
          pointerEvents: 'none',
          zIndex: 2
        }} />
        
        {/* Bottom gradient for content */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '60%',
          background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)',
          pointerEvents: 'none',
          zIndex: 2
        }} />
        
        {/* Content layer */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: isMobile ? '1rem' : '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: isMobile ? '0.75rem' : '1rem',
          zIndex: 3
        }}>
          {/* Quote container - glassmorphic with dark blue accent */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.15) 0%, rgba(37, 99, 235, 0.08) 100%)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(37, 99, 235, 0.3)',
            borderRadius: isMobile ? '12px' : '14px',
            padding: isMobile ? '0.875rem 1rem' : '1rem 1.25rem',
            boxShadow: '0 4px 16px rgba(37, 99, 235, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
            display: 'flex',
            flexDirection: 'column',
            gap: isMobile ? '0.5rem' : '0.625rem'
          }}>
            {/* Sparkles icon with blue glow */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.125rem'
            }}>
              <div style={{
                width: isMobile ? '24px' : '28px',
                height: isMobile ? '24px' : '28px',
                borderRadius: '8px',
                background: 'rgba(37, 99, 235, 0.2)',
                border: '1px solid rgba(37, 99, 235, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 0 12px rgba(37, 99, 235, 0.3)'
              }}>
                <Sparkles 
                  size={isMobile ? 12 : 14} 
                  color="#3b82f6"
                  fill="#3b82f6"
                  style={{ filter: 'drop-shadow(0 0 4px rgba(59, 130, 246, 0.6))' }}
                />
              </div>
              <span style={{
                fontSize: isMobile ? '0.65rem' : '0.7rem',
                fontWeight: '700',
                color: '#60a5fa',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                opacity: 0.9
              }}>
                Daily Motivation
              </span>
            </div>
            
            {/* Quote text */}
            <p style={{
              color: 'white',
              fontSize: isMobile ? '0.875rem' : '1.05rem',
              fontWeight: '600',
              letterSpacing: '-0.01em',
              textShadow: '0 2px 8px rgba(0, 0, 0, 0.6)',
              lineHeight: 1.4,
              margin: 0,
              fontStyle: 'italic'
            }}>
              "{motivationSlides[currentIndex].quote}"
            </p>
            
            {/* Author */}
            <span style={{
              fontSize: isMobile ? '0.7rem' : '0.75rem',
              fontWeight: '700',
              color: '#3b82f6',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              opacity: 0.9,
              textShadow: '0 2px 6px rgba(0, 0, 0, 0.5)'
            }}>
              — {motivationSlides[currentIndex].author}
            </span>
          </div>
          
          {/* STREEPJES BAR - GLASSMORPHIC (HORIZONTAAL) */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.8) 0%, rgba(23, 23, 23, 0.6) 100%)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: isMobile ? '10px' : '12px',
            padding: isMobile ? '0.625rem 0.75rem' : '0.625rem 0.875rem',
            display: 'flex',
            gap: isMobile ? '0.5rem' : '0.625rem',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
            alignSelf: 'center'
          }}>
            {motivationSlides.map((_, index) => (
              <div
                key={index}
                onClick={() => setCurrentIndex(index)}
                style={{
                  width: index === currentIndex ? '32px' : '16px',
                  height: '2px',
                  borderRadius: '1px',
                  background: index === currentIndex 
                    ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' 
                    : 'rgba(255, 255, 255, 0.35)',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  boxShadow: index === currentIndex 
                    ? '0 0 8px rgba(37, 99, 235, 0.6)' 
                    : 'none',
                  transform: 'translateZ(0)',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  if (!isMobile && index !== currentIndex) {
                    e.currentTarget.style.background = 'rgba(59, 130, 246, 0.7)'
                    e.currentTarget.style.width = '20px'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isMobile && index !== currentIndex) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.35)'
                    e.currentTarget.style.width = '16px'
                  }
                }}
              />
            ))}
          </div>
        </div>
        
        {/* Top blue accent glow */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, transparent 0%, #2563eb 50%, transparent 100%)',
          opacity: 0.6,
          pointerEvents: 'none',
          zIndex: 4
        }} />
      </div>
    </div>
  )
}
