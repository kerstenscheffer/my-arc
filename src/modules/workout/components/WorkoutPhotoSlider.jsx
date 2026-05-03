// src/modules/workout/components/WorkoutPhotoSlider.jsx
// 🏆 FULL WIDTH - No containers, edge-to-edge photo slider
import { useState, useEffect } from 'react'

const workoutImages = [
  { url: 'https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?w=1600&h=500&fit=crop&q=85', caption: 'Push Day' },
  { url: 'https://images.unsplash.com/photo-1605296867424-35fc25c9212a?w=1600&h=500&fit=crop&q=85', caption: 'Pull Day' },
  { url: 'https://images.unsplash.com/photo-1567598508481-65985588e295?w=1600&h=500&fit=crop&q=85', caption: 'Leg Day' },
  { url: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1600&h=500&fit=crop&q=85', caption: 'Je Progressie' },
  { url: 'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=1600&h=500&fit=crop&q=85', caption: 'Discipline Wins' }
]

export default function WorkoutPhotoSlider() {
  const isMobile = window.innerWidth <= 768
  const [currentIndex, setCurrentIndex] = useState(0)
  const [touchStart, setTouchStart] = useState(null)
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev === workoutImages.length - 1 ? 0 : prev + 1))
    }, 5000)
    return () => clearInterval(interval)
  }, [])
  
  const handleTouchStart = (e) => setTouchStart(e.targetTouches[0].clientX)
  const handleTouchEnd = (e) => {
    if (!touchStart) return
    const diff = touchStart - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) {
      setCurrentIndex(prev => 
        diff > 0 
          ? (prev === workoutImages.length - 1 ? 0 : prev + 1)
          : (prev === 0 ? workoutImages.length - 1 : prev - 1)
      )
    }
    setTouchStart(null)
  }
  
  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{
        position: 'relative',
        width: '100%',
        height: isMobile ? '160px' : '220px',
        overflow: 'hidden',
        touchAction: 'pan-y',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        borderTop: '1px solid rgba(255, 215, 0, 0.06)',
        borderBottom: '1px solid rgba(255, 215, 0, 0.06)',
        background: '#000'
      }}
    >
      {/* Background image */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `url(${workoutImages[currentIndex].url})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        transition: 'opacity 0.5s ease',
        zIndex: 1
      }} />
      
      {/* Top vignette */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: '40%',
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.4), transparent)',
        pointerEvents: 'none',
        zIndex: 2
      }} />
      
      {/* Bottom gradient */}
      <div style={{
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        height: '60%',
        background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.3) 60%, transparent 100%)',
        pointerEvents: 'none',
        zIndex: 2
      }} />
      
      {/* Content layer — bottom, only dots */}
      <div style={{
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        padding: isMobile ? '0.75rem 1rem' : '1rem 1.5rem',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-end',
        zIndex: 3
      }}>
        {/* Dot indicators */}
        <div style={{
          display: 'flex',
          gap: '0.35rem',
          alignItems: 'center'
        }}>
          {workoutImages.map((_, index) => (
            <div
              key={index}
              onClick={() => setCurrentIndex(index)}
              style={{
                width: index === currentIndex ? '18px' : '6px',
                height: '3px',
                borderRadius: '1.5px',
                background: index === currentIndex 
                  ? '#FFD700'
                  : 'rgba(255, 255, 255, 0.35)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                touchAction: 'manipulation',
                boxShadow: index === currentIndex 
                  ? '0 0 6px rgba(255, 215, 0, 0.5)'
                  : 'none'
              }}
            />
          ))}
        </div>
      </div>
      
      {/* Gold accent line top */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: '1px',
        background: 'linear-gradient(90deg, transparent 0%, rgba(255, 215, 0, 0.3) 50%, transparent 100%)',
        pointerEvents: 'none',
        zIndex: 4
      }} />
    </div>
  )
}
