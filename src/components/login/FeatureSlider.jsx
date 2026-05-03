// src/components/login/FeatureSlider.jsx - ELEGANT GOLDEN VERSION
import { useState, useEffect } from 'react'
import { 
  ChevronLeft, ChevronRight, Activity, Utensils, 
  Dumbbell, TrendingUp, Trophy, CheckCircle, X
} from 'lucide-react'

const FEATURES = [
  {
    icon: Activity,
    title: "Persoonlijk Dashboard",
    subtitle: "Jouw complete fitness hub",
    highlights: [
      "Live statistieken",
      "Dagelijkse check-ins",
      "Motivatie widgets"
    ],
    gradient: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
    color: '#FFD700'
  },
  {
    icon: Utensils,
    title: "AI Meal Plans",
    subtitle: "1000+ maaltijden op maat",
    highlights: [
      "Smart matching",
      "Boodschappenlijst",
      "Macro tracking"
    ],
    gradient: 'linear-gradient(135deg, #FFA500 0%, #FF8C00 100%)',
    color: '#FFA500'
  },
  {
    icon: Dumbbell,
    title: "Workout Schema's",
    subtitle: "Elke dag weten wat te doen",
    highlights: [
      "Gepersonaliseerd",
      "Video uitleg",
      "Progress tracking"
    ],
    gradient: 'linear-gradient(135deg, #D4AF37 0%, #C4A12A 100%)',
    color: '#D4AF37'
  },
  {
    icon: TrendingUp,
    title: "Progress Tracking",
    subtitle: "Zie je transformatie",
    highlights: [
      "Voor/na foto's",
      "Body measurements",
      "Strength gains"
    ],
    gradient: 'linear-gradient(135deg, #FFD700 0%, #D4AF37 100%)',
    color: '#FFD700'
  },
  {
    icon: Trophy,
    title: "Challenges & Coaching",
    subtitle: "Direct contact met je coach",
    highlights: [
      "1-op-1 coaching",
      "30-day challenges",
      "Community support"
    ],
    gradient: 'linear-gradient(135deg, #FFA500 0%, #FFD700 100%)',
    color: '#FFA500'
  }
]

export default function FeatureSlider({ onClose }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const isMobile = window.innerWidth <= 768
  
  useEffect(() => {
    if (!isAutoPlaying) return
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % FEATURES.length)
    }, 5000)
    
    return () => clearInterval(interval)
  }, [isAutoPlaying])
  
  const handleNext = () => {
    setIsAutoPlaying(false)
    setCurrentIndex((prev) => (prev + 1) % FEATURES.length)
    setTimeout(() => setIsAutoPlaying(true), 10000)
  }
  
  const handlePrev = () => {
    setIsAutoPlaying(false)
    setCurrentIndex((prev) => (prev - 1 + FEATURES.length) % FEATURES.length)
    setTimeout(() => setIsAutoPlaying(true), 10000)
  }
  
  const currentFeature = FEATURES[currentIndex]
  const Icon = currentFeature.icon
  
  return (
    <div style={{
      position: 'fixed',
      top: isMobile ? '70%' : '65%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: isMobile ? '90%' : '420px',
      maxWidth: '90vw',
      maxHeight: '26vh',
      zIndex: 25
    }}>
      <div style={{
        background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.92) 0%, rgba(17, 17, 17, 0.95) 100%)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 215, 0, 0.2)',
        borderRadius: '16px',
        padding: isMobile ? '0.875rem' : '1.125rem',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(255, 215, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.03)'
      }}>
        {/* Top accent line */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: currentFeature.gradient,
          opacity: 0.5,
          zIndex: 2
        }} />
        
        {/* Shine overlay */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '40%',
          background: 'linear-gradient(180deg, rgba(255, 215, 0, 0.04) 0%, transparent 100%)',
          pointerEvents: 'none',
          zIndex: 1
        }} />
        
        {/* Close button */}
        {onClose && (
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '0.625rem',
              right: '0.625rem',
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              background: 'rgba(255, 215, 0, 0.08)',
              border: '1px solid rgba(255, 215, 0, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'rgba(255, 215, 0, 0.5)',
              transition: 'all 0.3s',
              zIndex: 10,
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 215, 0, 0.15)'
              e.currentTarget.style.color = '#FFD700'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 215, 0, 0.08)'
              e.currentTarget.style.color = 'rgba(255, 215, 0, 0.5)'
            }}
          >
            <X size={13} />
          </button>
        )}
        
        {/* Background golden glow - subtiel */}
        <div style={{
          position: 'absolute',
          top: '-30%',
          right: '-20%',
          width: '100px',
          height: '100px',
          background: currentFeature.gradient,
          borderRadius: '50%',
          filter: 'blur(60px)',
          opacity: 0.12,
          zIndex: 0
        }} />
        
        {/* Header - Compact */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? '0.625rem' : '0.875rem',
          marginBottom: isMobile ? '0.625rem' : '0.875rem',
          position: 'relative',
          zIndex: 2
        }}>
          {/* Icon container */}
          <div style={{
            width: isMobile ? '40px' : '44px',
            height: isMobile ? '40px' : '44px',
            borderRadius: '11px',
            background: currentFeature.gradient,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 4px 12px ${currentFeature.color}20, inset 0 1px 0 rgba(255, 255, 255, 0.15)`,
            flexShrink: 0,
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Icon gloss */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '40%',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, transparent 100%)',
              borderRadius: '11px 11px 0 0',
              pointerEvents: 'none'
            }} />
            <Icon size={isMobile ? 18 : 20} color="#000" strokeWidth={2.5} />
          </div>
          
          {/* Title with gradient text */}
          <div style={{ flex: 1 }}>
            <h3 style={{
              fontSize: isMobile ? '1.05rem' : '1.2rem',
              fontWeight: '800',
              backgroundImage: currentFeature.gradient,
              backgroundSize: '200% 100%',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              color: currentFeature.color,
              margin: 0,
              display: 'inline-block',
              animation: 'gradientShift 8s ease-in-out infinite',
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
              textShadow: `0 0 20px ${currentFeature.color}20`
            }}>
              {currentFeature.title}
            </h3>
            <p style={{
              fontSize: isMobile ? '0.7rem' : '0.75rem',
              color: 'rgba(255, 255, 255, 0.45)',
              margin: 0,
              marginTop: '0.125rem',
              lineHeight: 1.2
            }}>
              {currentFeature.subtitle}
            </p>
          </div>
        </div>
        
        {/* Highlights - Compact */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: isMobile ? '0.3rem' : '0.35rem',
          marginBottom: isMobile ? '0.75rem' : '0.875rem',
          position: 'relative',
          zIndex: 2
        }}>
          {currentFeature.highlights.map((highlight, index) => (
            <div 
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                opacity: 0,
                animation: `fadeInLeft 0.5s ease ${index * 0.1}s forwards`
              }}
            >
              <CheckCircle 
                size={isMobile ? 11 : 12}
                color={currentFeature.color}
                style={{ 
                  flexShrink: 0,
                  filter: `drop-shadow(0 0 3px ${currentFeature.color}40)`
                }}
              />
              <span style={{
                color: 'rgba(255,255,255,0.65)',
                fontSize: isMobile ? '0.7rem' : '0.75rem',
                lineHeight: 1.2,
                fontWeight: '500'
              }}>
                {highlight}
              </span>
            </div>
          ))}
        </div>
        
        {/* Navigation - Compact */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative',
          zIndex: 2
        }}>
          {/* Dots - Golden */}
          <div style={{
            display: 'flex',
            gap: '0.3rem'
          }}>
            {FEATURES.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentIndex(index)
                  setIsAutoPlaying(false)
                }}
                style={{
                  width: index === currentIndex ? '16px' : '4px',
                  height: '4px',
                  borderRadius: '2px',
                  background: index === currentIndex 
                    ? currentFeature.color 
                    : 'rgba(255, 215, 0, 0.15)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  padding: 0,
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  boxShadow: index === currentIndex ? `0 0 6px ${currentFeature.color}40` : 'none'
                }}
              />
            ))}
          </div>
          
          {/* Arrows - Golden */}
          <div style={{ display: 'flex', gap: '0.35rem' }}>
            <button
              onClick={handlePrev}
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                background: 'rgba(255, 215, 0, 0.08)',
                border: '1px solid rgba(255, 215, 0, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'rgba(255, 215, 0, 0.5)',
                transition: 'all 0.3s',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 215, 0, 0.15)'
                e.currentTarget.style.color = '#FFD700'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 215, 0, 0.08)'
                e.currentTarget.style.color = 'rgba(255, 215, 0, 0.5)'
              }}
              onTouchStart={(e) => {
                if (isMobile) e.currentTarget.style.transform = 'scale(0.95)'
              }}
              onTouchEnd={(e) => {
                if (isMobile) e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              <ChevronLeft size={13} />
            </button>
            
            <button
              onClick={handleNext}
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                background: 'rgba(255, 215, 0, 0.08)',
                border: '1px solid rgba(255, 215, 0, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'rgba(255, 215, 0, 0.5)',
                transition: 'all 0.3s',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 215, 0, 0.15)'
                e.currentTarget.style.color = '#FFD700'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 215, 0, 0.08)'
                e.currentTarget.style.color = 'rgba(255, 215, 0, 0.5)'
              }}
              onTouchStart={(e) => {
                if (isMobile) e.currentTarget.style.transform = 'scale(0.95)'
              }}
              onTouchEnd={(e) => {
                if (isMobile) e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
        
        {/* Progress bar - Golden */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          height: '2px',
          background: 'rgba(255, 215, 0, 0.08)',
          zIndex: 1
        }}>
          <div 
            key={currentIndex}
            style={{
              height: '100%',
              background: currentFeature.gradient,
              width: isAutoPlaying ? '100%' : '0%',
              transition: isAutoPlaying ? 'width 5s linear' : 'none',
              boxShadow: `0 0 8px ${currentFeature.color}40`
            }} 
          />
        </div>
      </div>
      
      <style>{`
        @keyframes fadeInLeft {
          from {
            opacity: 0;
            transform: translateX(-8px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  )
}
