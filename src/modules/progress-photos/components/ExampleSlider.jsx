// src/modules/progress-photos/components/ExampleSlider.jsx
import React, { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Camera, Utensils, Dumbbell, Trophy, Sparkles } from 'lucide-react'

export default function ExampleSlider({ isMobile = false }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  // Example photos with correct types matching your system
  const examples = [
    {
      type: 'progress',
      title: 'Progressie',
      tips: 'Neem full body foto\'s van voren EN opzij. Zelfde plek, zelfde licht, elke vrijdag!',
      icon: Camera,
      color: '#8b5cf6',
      images: [
        'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop',
        'https://images.unsplash.com/photo-1583639687726-84d20f4ac7e2?w=400&h=400&fit=crop',
        'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400&h=400&fit=crop',
        'https://images.unsplash.com/photo-1594381898411-846e7d193883?w=400&h=400&fit=crop'
      ]
    },
    {
      type: 'meal',
      title: 'Maaltijd',
      tips: 'Fotografeer van bovenaf met goede belichting. Hele portie in beeld!',
      icon: Utensils,
      color: '#10b981',
      images: [
        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop',
        'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=400&fit=crop',
        'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=400&fit=crop',
        'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=400&fit=crop'
      ]
    },
    {
      type: 'workout',
      title: 'Workout',
      tips: 'Tijdens of na je training. Laat je inzet zien, gym of thuis!',
      icon: Dumbbell,
      color: '#f97316',
      images: [
        'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=400&fit=crop',
        'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&h=400&fit=crop',
        'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=400&h=400&fit=crop',
        'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=400&h=400&fit=crop'
      ]
    },
    {
      type: 'victory',
      title: 'Victory',
      tips: 'Deel je overwinningen, PR\'s, mijlpalen en trots momenten!',
      icon: Trophy,
      color: '#fbbf24',
      images: [
        'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=400&h=400&fit=crop',
        'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&h=400&fit=crop',
        'https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=400&h=400&fit=crop',
        'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=400&h=400&fit=crop'
      ]
    }
  ]

  // Flatten all images for sliding
  const allSlides = examples.flatMap(category => 
    category.images.map((img, imgIndex) => ({
      ...category,
      image: img,
      slideId: `${category.type}-${imgIndex}`
    }))
  )

  // Auto-slide effect
  useEffect(() => {
    if (!isPaused) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % allSlides.length)
      }, 4000) // Change slide every 4 seconds
      
      return () => clearInterval(interval)
    }
  }, [isPaused, allSlides.length])

  // Manual navigation
  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + allSlides.length) % allSlides.length)
    setIsPaused(true)
    setTimeout(() => setIsPaused(false), 5000)
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % allSlides.length)
    setIsPaused(true)
    setTimeout(() => setIsPaused(false), 5000)
  }

  const currentSlide = allSlides[currentIndex]
  const Icon = currentSlide.icon

  // Handle image error - show colored placeholder
  const handleImageError = (e) => {
    e.target.style.display = 'none'
    e.target.parentElement.style.background = `linear-gradient(135deg, ${currentSlide.color}20, ${currentSlide.color}10)`
  }

  return (
    <div style={{
      marginTop: '0.5rem',
      marginBottom: '0.5rem'
    }}>
      {/* Header - Minimal */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '0.5rem',
        padding: '0 0.25rem'
      }}>
        <div style={{
          fontSize: isMobile ? '0.75rem' : '0.85rem',
          color: 'rgba(139, 92, 246, 0.7)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Sparkles size={14} color="#8b5cf6" opacity={0.7} />
          Voorbeelden
        </div>
        
        {/* Category Dots - Compact */}
        <div style={{
          display: 'flex',
          gap: '0.375rem'
        }}>
          {examples.map((cat) => {
            const isActive = currentSlide.type === cat.type
            const CatIcon = cat.icon
            return (
              <button
                key={cat.type}
                onClick={() => {
                  const firstSlideIndex = allSlides.findIndex(s => s.type === cat.type)
                  setCurrentIndex(firstSlideIndex)
                  setIsPaused(true)
                  setTimeout(() => setIsPaused(false), 5000)
                }}
                style={{
                  width: isMobile ? '24px' : '28px',
                  height: isMobile ? '24px' : '28px',
                  borderRadius: '6px',
                  background: isActive 
                    ? `linear-gradient(135deg, ${cat.color}25 0%, ${cat.color}15 100%)`
                    : 'rgba(255, 255, 255, 0.03)',
                  border: isActive 
                    ? `1px solid ${cat.color}40`
                    : '1px solid rgba(255, 255, 255, 0.08)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: isActive ? 'scale(1.05)' : 'scale(1)',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent'
                }}
              >
                <CatIcon size={12} color={isActive ? cat.color : 'rgba(255, 255, 255, 0.4)'} />
              </button>
            )
          })}
        </div>
      </div>

      {/* Slider Container - Seamless */}
      <div 
        style={{
          position: 'relative',
          borderRadius: '12px',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, rgba(17, 17, 17, 0.3) 0%, rgba(10, 10, 10, 0.3) 100%)',
          border: '1px solid rgba(139, 92, 246, 0.08)',
          marginBottom: '0.5rem'
        }}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setTimeout(() => setIsPaused(false), 3000)}
      >
        {/* Main Image Container */}
        <div style={{
          position: 'relative',
          width: '100%',
          paddingBottom: isMobile ? '50%' : '45%', // Shorter height
          overflow: 'hidden',
          background: `linear-gradient(135deg, ${currentSlide.color}10 0%, ${currentSlide.color}05 100%)`
        }}>
          {/* Fallback icon for when image fails */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity: 0.15
          }}>
            <Icon size={48} color={currentSlide.color} />
          </div>
          
          {/* Image */}
          <img
            key={currentSlide.slideId}
            src={currentSlide.image}
            alt={currentSlide.title}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'opacity 0.5s ease'
            }}
            onError={handleImageError}
          />
          
          {/* Gradient Overlay */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '50%',
            background: 'linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent)',
            pointerEvents: 'none'
          }} />
          
          {/* Category Badge - Smaller */}
          <div style={{
            position: 'absolute',
            top: isMobile ? '0.5rem' : '0.75rem',
            left: isMobile ? '0.5rem' : '0.75rem',
            background: `${currentSlide.color}ee`,
            backdropFilter: 'blur(10px)',
            borderRadius: '8px',
            padding: isMobile ? '0.3rem 0.5rem' : '0.375rem 0.625rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
          }}>
            <Icon size={12} color="white" />
            <span style={{
              fontSize: isMobile ? '0.65rem' : '0.7rem',
              fontWeight: '600',
              color: 'white',
              textTransform: 'uppercase',
              letterSpacing: '0.03em'
            }}>
              {currentSlide.title}
            </span>
          </div>
          
          {/* Navigation Buttons - Smaller */}
          <button
            onClick={goToPrevious}
            style={{
              position: 'absolute',
              left: isMobile ? '0.375rem' : '0.5rem',
              top: '50%',
              transform: 'translateY(-50%)',
              width: isMobile ? '28px' : '32px',
              height: isMobile ? '28px' : '32px',
              borderRadius: '50%',
              background: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              opacity: isMobile || isPaused ? 0.7 : 0,
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '1'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = isMobile || isPaused ? '0.7' : '0'
            }}
          >
            <ChevronLeft size={16} color="white" />
          </button>
          
          <button
            onClick={goToNext}
            style={{
              position: 'absolute',
              right: isMobile ? '0.375rem' : '0.5rem',
              top: '50%',
              transform: 'translateY(-50%)',
              width: isMobile ? '28px' : '32px',
              height: isMobile ? '28px' : '32px',
              borderRadius: '50%',
              background: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              opacity: isMobile || isPaused ? 0.7 : 0,
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '1'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = isMobile || isPaused ? '0.7' : '0'
            }}
          >
            <ChevronRight size={16} color="white" />
          </button>
        </div>
        
        {/* Progress Bar - Thin */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: 'rgba(255, 255, 255, 0.05)'
        }}>
          <div style={{
            height: '100%',
            width: `${((currentIndex + 1) / allSlides.length) * 100}%`,
            background: `linear-gradient(90deg, ${currentSlide.color} 0%, ${currentSlide.color}cc 100%)`,
            transition: 'width 0.3s ease',
            boxShadow: `0 0 6px ${currentSlide.color}40`
          }} />
        </div>
      </div>

      {/* Tips Section - Compact */}
      <div style={{
        padding: isMobile ? '0.5rem' : '0.625rem',
        background: `linear-gradient(135deg, ${currentSlide.color}08 0%, ${currentSlide.color}03 100%)`,
        borderRadius: '10px',
        border: `1px solid ${currentSlide.color}15`
      }}>
        <div style={{
          fontSize: isMobile ? '0.6rem' : '0.65rem',
          color: currentSlide.color,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: '0.2rem',
          fontWeight: '600',
          opacity: 0.8
        }}>
          Tip
        </div>
        <div style={{
          fontSize: isMobile ? '0.75rem' : '0.8rem',
          color: 'rgba(255, 255, 255, 0.6)',
          lineHeight: '1.3'
        }}>
          {currentSlide.tips}
        </div>
      </div>

      {/* Dots Indicator - Minimal */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '0.2rem',
        marginTop: '0.5rem'
      }}>
        {allSlides.map((slide, idx) => (
          <button
            key={idx}
            onClick={() => {
              setCurrentIndex(idx)
              setIsPaused(true)
              setTimeout(() => setIsPaused(false), 5000)
            }}
            style={{
              width: idx === currentIndex ? '12px' : '4px',
              height: '4px',
              borderRadius: '2px',
              background: idx === currentIndex 
                ? currentSlide.color 
                : 'rgba(255, 255, 255, 0.15)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              border: 'none',
              padding: 0,
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          />
        ))}
      </div>
    </div>
  )
}
