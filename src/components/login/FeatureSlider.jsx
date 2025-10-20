// src/components/login/FeatureSlider.jsx
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
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#764ba2'
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
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    color: '#f5576c'
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
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    color: '#00f2fe'
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
    gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    color: '#38f9d7'
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
    gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    color: '#fee140'
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
      top: isMobile ? '70%' : '65%', // VERDER OMLAAG: Meer ruimte boven
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: isMobile ? '90%' : '420px',
      maxWidth: '90vw',
      maxHeight: '26vh', // NOG COMPACTER: Minder verticale ruimte
      zIndex: 25
    }}>
      <div style={{
        background: 'rgba(17, 17, 17, 0.95)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: '16px',
        padding: isMobile ? '0.875rem' : '1.125rem', // AANGEPAST: Iets minder padding
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Close button */}
        {onClose && (
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '0.625rem', // AANGEPAST: Kleinere top spacing
              right: '0.625rem',
              width: '26px', // AANGEPAST: Iets kleiner
              height: '26px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'rgba(255, 255, 255, 0.5)',
              transition: 'all 0.3s',
              zIndex: 10,
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'
              e.currentTarget.style.color = '#fff'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)'
            }}
          >
            <X size={13} />
          </button>
        )}
        
        {/* Background gradient effect */}
        <div style={{
          position: 'absolute',
          top: '-30%',
          right: '-20%',
          width: '100px', // AANGEPAST: Kleiner
          height: '100px',
          background: currentFeature.gradient,
          borderRadius: '50%',
          filter: 'blur(60px)',
          opacity: 0.15
        }} />
        
        {/* Header - Extra compact */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? '0.625rem' : '0.875rem', // AANGEPAST: Kleinere gap
          marginBottom: isMobile ? '0.625rem' : '0.875rem'
        }}>
          {/* Icon */}
          <div style={{
            width: isMobile ? '40px' : '44px', // AANGEPAST: Kleiner
            height: isMobile ? '40px' : '44px',
            borderRadius: '11px',
            background: currentFeature.gradient,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 6px 16px ${currentFeature.color}25`,
            flexShrink: 0
          }}>
            <Icon size={isMobile ? 18 : 20} color="#fff" />
          </div>
          
          {/* Title with gradient text */}
          <div style={{ flex: 1 }}>
            <h3 style={{
              fontSize: isMobile ? '1.05rem' : '1.2rem', // AANGEPAST: Kleiner
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
              lineHeight: 1.1
            }}>
              {currentFeature.title}
            </h3>
            <p style={{
              fontSize: isMobile ? '0.7rem' : '0.75rem', // AANGEPAST: Kleiner
              color: 'rgba(255, 255, 255, 0.5)',
              margin: 0,
              marginTop: '0.125rem',
              lineHeight: 1.2
            }}>
              {currentFeature.subtitle}
            </p>
          </div>
        </div>
        
        {/* Highlights - Extra compact */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: isMobile ? '0.3rem' : '0.35rem', // AANGEPAST: Kleinere gap
          marginBottom: isMobile ? '0.75rem' : '0.875rem'
        }}>
          {currentFeature.highlights.map((highlight, index) => (
            <div 
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem', // AANGEPAST: Kleinere gap
                opacity: 0,
                animation: `fadeInLeft 0.5s ease ${index * 0.1}s forwards`
              }}
            >
              <CheckCircle 
                size={isMobile ? 11 : 12} // AANGEPAST: Kleiner
                color="#10b981" 
                style={{ flexShrink: 0 }}
              />
              <span style={{
                color: 'rgba(255,255,255,0.7)',
                fontSize: isMobile ? '0.7rem' : '0.75rem', // AANGEPAST: Kleiner
                lineHeight: 1.2
              }}>
                {highlight}
              </span>
            </div>
          ))}
        </div>
        
        {/* Navigation - Extra compact */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {/* Dots */}
          <div style={{
            display: 'flex',
            gap: '0.3rem' // AANGEPAST: Kleinere gap
          }}>
            {FEATURES.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentIndex(index)
                  setIsAutoPlaying(false)
                }}
                style={{
                  width: index === currentIndex ? '16px' : '4px', // AANGEPAST: Kleiner
                  height: '4px',
                  borderRadius: '2px',
                  background: index === currentIndex 
                    ? currentFeature.color 
                    : 'rgba(255,255,255,0.15)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  padding: 0,
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent'
                }}
              />
            ))}
          </div>
          
          {/* Arrows */}
          <div style={{ display: 'flex', gap: '0.35rem' }}>
            <button
              onClick={handlePrev}
              style={{
                width: '26px', // AANGEPAST: Kleiner
                height: '26px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'rgba(255,255,255,0.6)',
                transition: 'all 0.3s',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.15)'
                e.currentTarget.style.color = '#fff'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
                e.currentTarget.style.color = 'rgba(255,255,255,0.6)'
              }}
              onTouchStart={(e) => {
                if (isMobile) {
                  e.currentTarget.style.transform = 'scale(0.95)'
                }
              }}
              onTouchEnd={(e) => {
                if (isMobile) {
                  e.currentTarget.style.transform = 'scale(1)'
                }
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
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'rgba(255,255,255,0.6)',
                transition: 'all 0.3s',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.15)'
                e.currentTarget.style.color = '#fff'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
                e.currentTarget.style.color = 'rgba(255,255,255,0.6)'
              }}
              onTouchStart={(e) => {
                if (isMobile) {
                  e.currentTarget.style.transform = 'scale(0.95)'
                }
              }}
              onTouchEnd={(e) => {
                if (isMobile) {
                  e.currentTarget.style.transform = 'scale(1)'
                }
              }}
            >
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
        
        {/* Progress bar */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          height: '2px',
          background: 'rgba(255,255,255,0.05)'
        }}>
          <div 
            key={currentIndex}
            style={{
              height: '100%',
              background: currentFeature.gradient,
              width: isAutoPlaying ? '100%' : '0%',
              transition: isAutoPlaying ? 'width 5s linear' : 'none'
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
