import { useState, useEffect } from 'react'
import HeroTransformation from './components/HeroTransformation'
import VideoSection from './components/VideoSection'
import YourArcTransformation from './components/YourArcTransformation'
import ValueStackComplete from './components/ValueStackComplete'
import GuaranteesSection from './components/GuaranteesSection'
import PriceAnchorSection from './components/PriceAnchorSection'
// import BonusOffersSection from './components/BonusOffersSection'
// import WhyThisOffer from './components/WhyThisOffer'
import FinalCTASection from './components/FinalCTASection'
import YourArcFloatingBar from './components/YourArcFloatingBar'
import DatabaseService from '../../../services/DatabaseService'

// Main Offer Spots Display Component
function MainOfferSpotsDisplay({ isMobile }) {
  const [spots, setSpots] = useState(null)
  const [isVisible, setIsVisible] = useState(false)
  const db = DatabaseService
  
  useEffect(() => {
    const visibilityTimer = setTimeout(() => setIsVisible(true), 500)
    
    const loadSpots = async () => {
      try {
        const spotsService = db.getSpotsService()
        const data = await spotsService.getMainOfferSpots()
        if (data) setSpots(data)
        
        const sub = spotsService.subscribeToMainOfferSpots((newData) => {
          setSpots(newData)
        })
        return () => sub?.unsubscribe()
      } catch (error) {
        console.log('Using fallback spots')
        setSpots({ max_spots: 10, current_spots: 3 })
      }
    }
    
    loadSpots()
    
    return () => clearTimeout(visibilityTimer)
  }, [])
  
  const left = spots ? spots.max_spots - spots.current_spots : 7
  const isUrgent = left <= 3
  
  return (
    <div style={{
      position: 'fixed',
      top: isMobile ? '16px' : '24px',
      right: isMobile ? '16px' : '24px',
      background: isUrgent
        ? 'linear-gradient(135deg, rgba(220, 38, 38, 0.95) 0%, rgba(239, 68, 68, 0.95) 100%)'
        : 'linear-gradient(135deg, rgba(16, 185, 129, 0.95) 0%, rgba(5, 150, 105, 0.95) 100%)',
      padding: isMobile ? '10px 16px' : '12px 20px',
      borderRadius: '100px',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      backdropFilter: 'blur(10px)',
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      boxShadow: isUrgent
        ? '0 10px 30px rgba(220, 38, 38, 0.4)'
        : '0 10px 30px rgba(16, 185, 129, 0.3)',
      animation: isUrgent ? 'urgentPulse 2s ease-in-out infinite' : 'normalPulse 3s ease-in-out infinite',
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? 'translateY(0)' : 'translateY(-20px)',
      transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
      cursor: 'default',
      touchAction: 'manipulation',
      WebkitTapHighlightColor: 'transparent'
    }}>
      <div style={{
        width: '8px',
        height: '8px',
        background: '#fff',
        borderRadius: '50%',
        animation: 'blink 1.5s ease-in-out infinite',
        boxShadow: '0 0 10px rgba(255, 255, 255, 0.5)'
      }} />
      <span style={{
        fontSize: isMobile ? '0.75rem' : '0.85rem',
        fontWeight: '700',
        color: '#fff',
        letterSpacing: '0.02em',
        textTransform: 'uppercase'
      }}>
        {left <= 0 
          ? 'Volgeboekt'
          : left === 1
            ? 'Laatste plek!'
            : `Nog ${left}/20 plekken`
        }
      </span>
      
      {isUrgent && left > 0 && (
        <span style={{
          fontSize: isMobile ? '0.6rem' : '0.65rem',
          fontWeight: '600',
          padding: '2px 6px',
          background: 'rgba(255, 255, 255, 0.2)',
          borderRadius: '4px',
          color: '#fff',
          textTransform: 'uppercase'
        }}>
          Live
        </span>
      )}
    </div>
  )
}

// Progress Dots Component
function ProgressDots({ sections, currentSection, isMobile }) {
  const [isVisible, setIsVisible] = useState(false)
  
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 1000)
    return () => clearTimeout(timer)
  }, [])
  
  return (
    <div style={{
      position: 'fixed',
      bottom: isMobile ? '70px' : '40px',
      right: isMobile ? '16px' : '24px',
      display: 'flex',
      gap: '6px',
      padding: isMobile ? '10px 12px' : '12px 16px',
      background: 'rgba(0, 0, 0, 0.95)',
      backdropFilter: 'blur(20px)',
      borderRadius: '100px',
      border: '1px solid rgba(16, 185, 129, 0.15)',
      zIndex: 99,
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
      transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)'
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
            width: index === currentSection ? '24px' : '8px',
            height: '8px',
            borderRadius: '100px',
            background: index === currentSection
              ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
              : index < currentSection
                ? 'rgba(16, 185, 129, 0.4)'
                : 'rgba(16, 185, 129, 0.15)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: index === currentSection
              ? '0 0 12px rgba(16, 185, 129, 0.6)'
              : 'none',
            cursor: 'pointer',
            border: 'none',
            padding: 0,
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent'
          }}
          aria-label={`Go to section ${index + 1}`}
        />
      ))}
    </div>
  )
}

// Calendly Modal Component
function CalendlyModal({ isOpen, onClose, isMobile }) {
  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.9)',
      zIndex: 10000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: isMobile ? '1rem' : '2rem',
      animation: 'fadeIn 0.3s ease'
    }}>
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: '900px',
        height: isMobile ? '90vh' : '80vh',
        background: '#111',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)'
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            zIndex: 10001,
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            color: '#fff',
            fontSize: '1.5rem'
          }}
        >
          ×
        </button>
        
        <iframe
          src="https://calendly.com/my-arc/intro-call"
          width="100%"
          height="100%"
          frameBorder="0"
          style={{ border: 'none' }}
        />
      </div>
    </div>
  )
}

// Main YOUR ARC Funnel Component
export default function YourArcFunnel() {
  const [currentSection, setCurrentSection] = useState(0)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const [showCalendlyModal, setShowCalendlyModal] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768)
      const vh = window.innerHeight * 0.01
      document.documentElement.style.setProperty('--vh', `${vh}px`)
    }
    
    handleResize()
    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleResize)
    
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleResize)
    }
  }, [])

  // All 9 sections for YOUR ARC (added YourArcTransformation)
  const sections = [
    HeroTransformation,
    VideoSection,
    YourArcTransformation,  // NEW - Added transformation section
    ValueStackComplete,
    GuaranteesSection,
    PriceAnchorSection,
  //  BonusOffersSection,
  //  WhyThisOffer,
    FinalCTASection
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

  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
      const currentScroll = window.scrollY
      const progress = (currentScroll / scrollHeight) * 100
      setScrollProgress(progress)
      
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
  }, [sections.length])

  const handleOpenCalendly = () => {
    setShowCalendlyModal(true)
    if (window.gtag) {
      window.gtag('event', 'calendly_opened', {
        event_category: 'conversion',
        event_label: 'your_arc_funnel'
      })
    }
  }

  return (
    <>
      {/* Progress bar at top */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        background: 'rgba(16, 185, 129, 0.1)',
        zIndex: 101
      }}>
        <div style={{
          width: `${scrollProgress}%`,
          height: '100%',
          background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
          transition: 'width 0.1s ease-out',
          boxShadow: '0 0 10px rgba(16, 185, 129, 0.5)'
        }} />
      </div>

      {/* Main content */}
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #000000 0%, #0a0a0a 100%)',
        color: '#fff',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
        overflowX: 'hidden',
        position: 'relative',
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale'
      }}>
        
        {/* Render all sections */}
        {sections.map((Section, index) => (
          <div 
            key={index} 
            id={`section-${index}`}
            style={{
              minHeight: isMobile ? 'calc(var(--vh, 1vh) * 100)' : '100vh',
              position: 'relative'
            }}
          >
            <Section 
              isMobile={isMobile} 
              onScrollNext={scrollToNextSection}
              onOpenCalendly={handleOpenCalendly}
              isCurrentSection={currentSection === index}
            />
          </div>
        ))}

        {/* Progress dots */}
        <ProgressDots 
          sections={sections} 
          currentSection={currentSection} 
          isMobile={isMobile}
        />

        {/* Live spots counter */}
        <MainOfferSpotsDisplay isMobile={isMobile} />
      </div>

      {/* Floating bottom bar */}
      <YourArcFloatingBar />

      {/* Calendly modal */}
      <CalendlyModal 
        isOpen={showCalendlyModal}
        onClose={() => setShowCalendlyModal(false)}
        isMobile={isMobile}
      />

      {/* Global animations */}
      <style>{`
        @keyframes urgentPulse {
          0%, 100% { 
            transform: scale(1);
            boxShadow: 0 10px 30px rgba(220, 38, 38, 0.4);
          }
          50% { 
            transform: scale(1.05);
            boxShadow: 0 15px 40px rgba(220, 38, 38, 0.5);
          }
        }
        
        @keyframes normalPulse {
          0%, 100% { 
            transform: scale(1);
          }
          50% { 
            transform: scale(1.02);
          }
        }
        
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        html {
          scroll-behavior: smooth;
        }
        
        @media (max-width: 768px) {
          ::-webkit-scrollbar {
            width: 0px;
            background: transparent;
          }
        }
      `}</style>
    </>
  )
}
