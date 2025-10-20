import { useState, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

// Import all sections
import HeroPainSection from './sections/HeroPainSection'
import VideoSection from './sections/VideoSection'
import NeusbloederSection from './sections/NeusbloederSection'
import TransformationPath from './sections/TransformationPath'
import TransformationSection from './sections/TransformationSection'
import OfferSection from './sections/OfferSection'
import GuaranteeSection from './sections/GuaranteeSection'
import FinalPushSection from './sections/FinalPushSection'

// Import Calendly Modal
import CalendlyModal from './CalendlyModal'

// Urgency Counter Component
function UrgencyCounter({ isMobile }) {
  const [timeLeft, setTimeLeft] = useState({
    hours: 23,
    minutes: 59,
    seconds: 59
  })

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 }
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 }
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 }
        }
        return prev
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  return (
    <div style={{
      position: 'fixed',
      top: isMobile ? '10px' : '20px',
      right: isMobile ? '10px' : '20px',
      background: 'rgba(0, 0, 0, 0.95)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '8px',
      padding: isMobile ? '8px 12px' : '10px 16px',
      zIndex: 100,
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    }}>
      <div style={{
        width: '6px',
        height: '6px',
        background: '#ef4444',
        borderRadius: '50%',
        animation: 'pulse 2s infinite'
      }} />
      <span style={{
        fontSize: isMobile ? '0.75rem' : '0.85rem',
        color: 'rgba(255, 255, 255, 0.9)',
        fontWeight: '600',
        fontVariantNumeric: 'tabular-nums'
      }}>
        {String(timeLeft.hours).padStart(2, '0')}:
        {String(timeLeft.minutes).padStart(2, '0')}:
        {String(timeLeft.seconds).padStart(2, '0')}
      </span>
    </div>
  )
}

// Floating CTA Bar
function FloatingCTA({ isVisible, onAction, isMobile }) {
  if (!isVisible) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: 'linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.98) 30%, #000 100%)',
      padding: isMobile ? '1rem' : '1.5rem',
      zIndex: 99,
      transform: isVisible ? 'translateY(0)' : 'translateY(100%)',
      transition: 'transform 0.3s ease',
      borderTop: '1px solid rgba(255, 255, 255, 0.05)'
    }}>
      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: 'center',
        gap: isMobile ? '0.75rem' : '1.5rem'
      }}>
        <div style={{ flex: 1 }}>
          <p style={{
            fontSize: isMobile ? '0.85rem' : '0.95rem',
            color: 'rgba(255, 255, 255, 0.9)',
            margin: 0,
            fontWeight: '500'
          }}>
            <span style={{ color: '#ef4444' }}>⚠️</span> Laatste kans voor deze prijs
          </p>
        </div>
        <button
          onClick={onAction}
          style={{
            background: '#fff',
            color: '#000',
            border: 'none',
            borderRadius: '6px',
            padding: isMobile ? '0.75rem 2rem' : '0.875rem 2.5rem',
            fontSize: isMobile ? '0.9rem' : '1rem',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            whiteSpace: 'nowrap',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            minHeight: '44px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)'
            e.currentTarget.style.boxShadow = '0 10px 30px rgba(255, 255, 255, 0.2)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          Start Nu →
        </button>
      </div>
    </div>
  )
}

export default function MyArcFunnel() {
  const [currentSection, setCurrentSection] = useState(0)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [showFloatingCTA, setShowFloatingCTA] = useState(false)
  const [hasScrolledPast30, setHasScrolledPast30] = useState(false)
  const [showCalendly, setShowCalendly] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768)
      const vh = window.innerHeight * 0.01
      document.documentElement.style.setProperty('--vh', `${vh}px`)
    }
    
    handleResize()
    window.addEventListener('resize', handleResize)
    
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Sections - Emotie naar conversie flow
  const sections = [
    HeroPainSection,       // Direct in de pijn
    VideoSection,          // Video bewijs
    NeusbloederSection,    // Dieper in emotie
    TransformationPath,    // 8 weken pad (abstract)
    TransformationSection, // Concrete transformatie bewijs
    OfferSection,         // Wat krijg je
    GuaranteeSection,     // Zekerheid geven
    FinalPushSection      // Laatste push
  ]

  const scrollToNextSection = () => {
    const nextSection = Math.min(currentSection + 1, sections.length - 1)
    if (nextSection !== currentSection) {
      setCurrentSection(nextSection)
      const element = document.getElementById(`section-${nextSection}`)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
  }

  const scrollToCTA = () => {
    const ctaSection = document.getElementById(`section-${sections.length - 1}`)
    if (ctaSection) {
      ctaSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const openCalendly = () => {
    setShowCalendly(true)
  }

  // Track scroll progress & show floating CTA
  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
      const currentScroll = window.scrollY
      const progress = (currentScroll / scrollHeight) * 100
      setScrollProgress(progress)
      
      // Show floating CTA na 30% scroll
      if (progress > 30 && !hasScrolledPast30) {
        setHasScrolledPast30(true)
        setTimeout(() => setShowFloatingCTA(true), 2000)
      }
      
      // Hide floating CTA bij laatste sectie
      if (progress > 85) {
        setShowFloatingCTA(false)
      }
      
      // Track current section
      const scrollPosition = currentScroll + window.innerHeight * 0.4
      
      sections.forEach((_, index) => {
        const element = document.getElementById(`section-${index}`)
        if (element) {
          const { offsetTop, offsetHeight } = element
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setCurrentSection(index)
          }
        }
      })
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [sections.length, hasScrolledPast30])

  return (
    <>
      {/* Subtle progress bar */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '2px',
        background: 'rgba(255, 255, 255, 0.05)',
        zIndex: 101
      }}>
        <div style={{
          width: `${scrollProgress}%`,
          height: '100%',
          background: 'linear-gradient(90deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.4) 100%)',
          transition: 'width 0.1s ease-out',
          boxShadow: '0 0 10px rgba(255, 255, 255, 0.2)'
        }} />
      </div>

      {/* Urgency counter */}
      <UrgencyCounter isMobile={isMobile} />

      {/* Main content */}
      <div style={{
        minHeight: '100vh',
        background: '#000',
        color: '#fff',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        overflowX: 'hidden',
        position: 'relative',
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale'
      }}>
        
        {/* Render sections */}
        {sections.map((Section, index) => (
          <div 
            key={index} 
            id={`section-${index}`}
            style={{
              minHeight: isMobile ? 'calc(var(--vh, 1vh) * 100)' : '100vh',
              position: 'relative',
              opacity: currentSection === index ? 1 : 0.3,
              transition: 'opacity 0.5s ease'
            }}
          >
            <Section 
              isMobile={isMobile} 
              onScrollNext={scrollToNextSection}
              isCurrentSection={currentSection === index}
              scrollToCTA={scrollToCTA}
              openCalendly={openCalendly}
            />
          </div>
        ))}

        {/* Subtle scroll hint */}
        {currentSection === 0 && (
          <div style={{
            position: 'fixed',
            bottom: isMobile ? '20px' : '40px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            animation: 'fadeInOut 3s ease-in-out infinite'
          }}>
            <span style={{
              fontSize: isMobile ? '0.7rem' : '0.8rem',
              color: 'rgba(255, 255, 255, 0.3)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              fontWeight: '500'
            }}>
              Scroll
            </span>
            <ChevronDown 
              size={16} 
              color="rgba(255, 255, 255, 0.3)"
              style={{
                animation: 'bounce 2s ease-in-out infinite'
              }}
            />
          </div>
        )}

        {/* Section indicators */}
        <div style={{
          position: 'fixed',
          right: isMobile ? '12px' : '20px',
          top: '50%',
          transform: 'translateY(-50%)',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          zIndex: 50
        }}>
          {sections.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                const element = document.getElementById(`section-${index}`)
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }
              }}
              style={{
                width: '2px',
                height: currentSection === index ? '32px' : '16px',
                background: currentSection === index 
                  ? 'rgba(255, 255, 255, 0.6)' 
                  : 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                borderRadius: '1px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                padding: 0,
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
              aria-label={`Section ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Floating CTA */}
      <FloatingCTA 
        isVisible={showFloatingCTA}
        onAction={openCalendly}
        isMobile={isMobile}
      />

      {/* Calendly Modal */}
      <CalendlyModal 
        isOpen={showCalendly}
        onClose={() => setShowCalendly(false)}
        isMobile={isMobile}
      />

      {/* Animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(4px); }
        }
        
        @keyframes fadeInOut {
          0%, 100% { opacity: 0; }
          50% { opacity: 1; }
        }
        
        html {
          scroll-behavior: smooth;
        }
        
        body {
          background: #000;
          overflow-x: hidden;
        }
        
        ::-webkit-scrollbar {
          width: 6px;
        }
        
        ::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
        }
        
        ::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
        
        /* Focus states */
        button:focus-visible {
          outline: 1px solid rgba(255, 255, 255, 0.5);
          outline-offset: 2px;
        }
      `}</style>
    </>
  )
}
