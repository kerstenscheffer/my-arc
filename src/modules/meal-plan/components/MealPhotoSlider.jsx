// src/modules/meal/components/MealPhotoSlider.jsx
import { useState, useEffect } from 'react'
import { Apple } from 'lucide-react'

const mealImages = [
  {
    url: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1600&h=500&fit=crop&q=85',
    caption: 'Meal Preps'
  },
  {
    url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1600&h=500&fit=crop&q=85',
    caption: 'Boodschappen'
  },
  {
    url: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=1600&h=500&fit=crop&q=85',
    caption: 'Tracking'
  },
  {
    url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1600&h=500&fit=crop&q=85',
    caption: 'Eigen meals'
  },
  {
    url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1600&h=500&fit=crop&q=85',
    caption: 'Recepten'
  }
]

export default function MealPhotoSlider() {
  const isMobile = window.innerWidth <= 768
  const [currentIndex, setCurrentIndex] = useState(0)
  const [touchStart, setTouchStart] = useState(null)
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev === mealImages.length - 1 ? 0 : prev + 1))
    }, 5000)
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
          ? (prev === mealImages.length - 1 ? 0 : prev + 1)
          : (prev === 0 ? mealImages.length - 1 : prev - 1)
      )
    }
    setTouchStart(null)
  }
  
  return (
    <div style={{
      padding: isMobile ? '0.5rem' : '0.625rem',
      marginBottom: isMobile ? '1rem' : '1.5rem'
    }}>
      {/* Main container with green accent ring */}
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
          border: '2px solid rgba(16, 185, 129, 0.3)',
          boxShadow: '0 8px 32px rgba(16, 185, 129, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.03)',
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
          backgroundImage: `url(${mealImages[currentIndex].url})`,
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
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          zIndex: 3
        }}>
          {/* Caption container - glassmorphic */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.08) 100%)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: isMobile ? '12px' : '14px',
            padding: isMobile ? '0.75rem 1rem' : '0.875rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '0.5rem' : '0.625rem',
            boxShadow: '0 4px 16px rgba(16, 185, 129, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
            maxWidth: isMobile ? '65%' : '50%'
          }}>
            {/* Green apple icon */}
            <div style={{
              width: isMobile ? '28px' : '32px',
              height: isMobile ? '28px' : '32px',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.2)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 0 12px rgba(16, 185, 129, 0.3)'
            }}>
              <Apple 
                size={isMobile ? 14 : 16} 
                color="#10b981"
                fill="#10b981"
                style={{ filter: 'drop-shadow(0 0 4px rgba(16, 185, 129, 0.6))' }}
              />
            </div>
            
            {/* Caption text */}
            <span style={{
              color: 'white',
              fontSize: isMobile ? '0.95rem' : '1.15rem',
              fontWeight: '800',
              letterSpacing: '-0.02em',
              textTransform: 'uppercase',
              textShadow: '0 2px 8px rgba(0, 0, 0, 0.6)',
              lineHeight: 1.2
            }}>
              {mealImages[currentIndex].caption}
            </span>
          </div>
          
          {/* STREEPJES BAR - GLASSMORPHIC */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.8) 0%, rgba(23, 23, 23, 0.6) 100%)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: isMobile ? '10px' : '12px',
            padding: isMobile ? '0.625rem 0.75rem' : '0.625rem 0.875rem',
            display: 'flex',
            gap: isMobile ? '0.5rem' : '0.625rem',
            alignItems: 'center',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
          }}>
            {mealImages.map((_, index) => (
              <div
                key={index}
                onClick={() => setCurrentIndex(index)}
                style={{
                  width: index === currentIndex ? '32px' : '16px',
                  height: '2px',
                  borderRadius: '1px',
                  background: index === currentIndex 
                    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
                    : 'rgba(255, 255, 255, 0.35)',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  boxShadow: index === currentIndex 
                    ? '0 0 8px rgba(16, 185, 129, 0.6)' 
                    : 'none',
                  transform: 'translateZ(0)',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  if (!isMobile && index !== currentIndex) {
                    e.currentTarget.style.background = 'rgba(16, 185, 129, 0.7)'
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
        
        {/* Top green accent glow */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, transparent 0%, #10b981 50%, transparent 100%)',
          opacity: 0.6,
          pointerEvents: 'none',
          zIndex: 4
        }} />
      </div>
    </div>
  )
}
