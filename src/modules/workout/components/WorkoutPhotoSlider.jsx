// src/modules/workout/components/WorkoutPhotoSlider.jsx
import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import useIsMobile from '../../../hooks/useIsMobile'

// Curated workout images - happy people exercising
const workoutImages = [
  {
    url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=450&fit=crop',
    caption: 'Core Training'
  },
  {
    url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&h=450&fit=crop',
    caption: 'Strength Building'
  },
  {
    url: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&h=450&fit=crop',
    caption: 'Power Training'
  },
  {
    url: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&h=450&fit=crop',
    caption: 'Functional Fitness'
  },
  {
    url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=450&fit=crop',
    caption: 'Gym Training'
  }
]

export default function WorkoutPhotoSlider() {
  const isMobile = useIsMobile()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  
  // Auto-slide every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      handleNext()
    }, 5000)
    
    return () => clearInterval(interval)
  }, [currentIndex])
  
  const handlePrevious = () => {
    if (isTransitioning) return
    setIsTransitioning(true)
    setCurrentIndex((prev) => (prev === 0 ? workoutImages.length - 1 : prev - 1))
    setTimeout(() => setIsTransitioning(false), 300)
  }
  
  const handleNext = () => {
    if (isTransitioning) return
    setIsTransitioning(true)
    setCurrentIndex((prev) => (prev === workoutImages.length - 1 ? 0 : prev + 1))
    setTimeout(() => setIsTransitioning(false), 300)
  }
  
  const goToSlide = (index) => {
    if (isTransitioning || index === currentIndex) return
    setIsTransitioning(true)
    setCurrentIndex(index)
    setTimeout(() => setIsTransitioning(false), 300)
  }
  
  return (
    <div style={{
      padding: isMobile ? '1rem' : '1.5rem',
      paddingTop: isMobile ? '0.5rem' : '1rem',
      paddingBottom: isMobile ? '1rem' : '1.5rem'
    }}>
      {/* Section Title */}
      <h3 style={{
        fontSize: isMobile ? '0.85rem' : '0.9rem',
        color: 'rgba(255,255,255,0.5)',
        marginBottom: isMobile ? '0.75rem' : '1rem',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
      }}>
        Workout Inspiration
      </h3>
      
      {/* Slider Container */}
      <div style={{
        position: 'relative',
        borderRadius: isMobile ? '14px' : '16px',
        overflow: 'hidden',
        background: 'rgba(17, 17, 17, 0.5)',
        border: '1px solid rgba(249, 115, 22, 0.08)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
      }}>
        {/* Images Container */}
        <div style={{
          position: 'relative',
          width: '100%',
          height: isMobile ? '200px' : '280px',
          overflow: 'hidden'
        }}>
          {/* Current Image */}
          <div style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backgroundImage: `url(${workoutImages[currentIndex].url})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            transition: isTransitioning ? 'opacity 0.3s ease' : 'none',
            opacity: 1
          }}>
            {/* Gradient Overlay */}
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.4) 100%)'
            }} />
            
            {/* Caption */}
            <div style={{
              position: 'absolute',
              bottom: isMobile ? '1rem' : '1.5rem',
              left: isMobile ? '1rem' : '1.5rem',
              color: 'white',
              fontSize: isMobile ? '1.1rem' : '1.3rem',
              fontWeight: '700',
              textShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
              letterSpacing: '-0.02em'
            }}>
              {workoutImages[currentIndex].caption}
            </div>
          </div>
        </div>
        
        {/* Navigation Buttons */}
        {!isMobile && (
          <>
            {/* Previous Button */}
            <button
              onClick={handlePrevious}
              style={{
                position: 'absolute',
                left: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'rgba(17, 17, 17, 0.8)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(249, 115, 22, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                zIndex: 10
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(249, 115, 22, 0.2)'
                e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(17, 17, 17, 0.8)'
                e.currentTarget.style.transform = 'translateY(-50%) scale(1)'
              }}
            >
              <ChevronLeft size={20} color="white" />
            </button>
            
            {/* Next Button */}
            <button
              onClick={handleNext}
              style={{
                position: 'absolute',
                right: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'rgba(17, 17, 17, 0.8)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(249, 115, 22, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                zIndex: 10
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(249, 115, 22, 0.2)'
                e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(17, 17, 17, 0.8)'
                e.currentTarget.style.transform = 'translateY(-50%) scale(1)'
              }}
            >
              <ChevronRight size={20} color="white" />
            </button>
          </>
        )}
        
        {/* Dot Indicators */}
        <div style={{
          position: 'absolute',
          bottom: isMobile ? '0.5rem' : '0.75rem',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '0.5rem',
          zIndex: 10
        }}>
          {workoutImages.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              style={{
                width: index === currentIndex ? '24px' : '8px',
                height: '8px',
                borderRadius: '4px',
                background: index === currentIndex 
                  ? '#f97316'
                  : 'rgba(255, 255, 255, 0.3)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                padding: 0
              }}
              onMouseEnter={(e) => {
                if (index !== currentIndex) {
                  e.currentTarget.style.background = 'rgba(249, 115, 22, 0.5)'
                }
              }}
              onMouseLeave={(e) => {
                if (index !== currentIndex) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'
                }
              }}
            />
          ))}
        </div>
      </div>
      
      {/* Mobile Swipe Hint */}
      {isMobile && (
        <p style={{
          fontSize: '0.7rem',
          color: 'rgba(255, 255, 255, 0.3)',
          textAlign: 'center',
          marginTop: '0.5rem',
          fontStyle: 'italic'
        }}>
          Swipe of tik op de dots om te navigeren
        </p>
      )}
    </div>
  )
}
