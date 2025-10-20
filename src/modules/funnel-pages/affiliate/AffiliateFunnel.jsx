import { useState, useEffect } from 'react'
import AffiliateHero from './components/AffiliateHero'
import AffiliateVideoSection from './components/AffiliateVideoSection'
import CommissionStructure from './components/CommissionStructure'
import EarningsCalculator from './components/EarningsCalculator'
import AffiliateValueStack from './components/AffiliateValueStack'
// import SuccessStories from './components/SuccessStories'
import WhyPartnerSection from './components/WhyPartnerSection'
import OnboardingProcess from './components/OnboardingProcess'
import AffiliateCallCTA from './components/AffiliateCallCTA'
import AffiliateFloatingBar from './components/AffiliateFloatingBar'
import AffiliateCalendlyModal from './components/AffiliateCalendlyModal'
import DatabaseService from '../../../services/DatabaseService'

// Progress Dots Component - GOUDEN VERSIE
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
      border: '1px solid rgba(255, 215, 0, 0.15)',
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
              ? 'linear-gradient(135deg, #FFD700 0%, #D4AF37 100%)'
              : index < currentSection
                ? 'rgba(255, 215, 0, 0.4)'
                : 'rgba(255, 215, 0, 0.15)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: index === currentSection
              ? '0 0 12px rgba(255, 215, 0, 0.6)'
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

// Live Affiliate Spots Display - DATABASE CONNECTED
function AffiliateSpots({ isMobile }) {
  const [spots, setSpots] = useState(null)
  const [isVisible, setIsVisible] = useState(false)
  const db = DatabaseService
  
  useEffect(() => {
    // Load initial spots data
    const loadSpots = async () => {
      try {
        const spotsService = await db.getSpotsService()
        const affiliateSpots = await spotsService.getAffiliateSpots()
        setSpots(affiliateSpots)
      } catch (error) {
        console.log('Using default spots:', error)
        // Fallback als database niet werkt
        setSpots({ max_spots: 15, current_spots: 11 })
      }
    }
    
    loadSpots()
    
    // Subscribe to real-time updates
    const setupSubscription = async () => {
      try {
        const spotsService = await db.getSpotsService()
        const subscription = spotsService.subscribeToAffiliateSpots((newSpots) => {
          setSpots(newSpots)
        })
        
        return () => {
          if (subscription && subscription.unsubscribe) {
            subscription.unsubscribe()
          }
        }
      } catch (error) {
        console.log('Subscription setup failed:', error)
      }
    }
    
    const cleanupPromise = setupSubscription()
    
    // Visibility animation
    const visibilityTimer = setTimeout(() => setIsVisible(true), 500)
    
    return () => {
      clearTimeout(visibilityTimer)
      cleanupPromise.then(cleanup => cleanup && cleanup())
    }
  }, [])
  
  // Loading state
  if (!spots) {
    return null
  }
  
  const left = spots.max_spots - spots.current_spots
  const isUrgent = left <= 3
  
  return (
    <div style={{
      position: 'fixed',
      top: isMobile ? '16px' : '24px',
      right: isMobile ? '16px' : '24px',
      background: isUrgent
        ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.95) 0%, rgba(220, 38, 38, 0.95) 100%)'
        : 'linear-gradient(135deg, rgba(255, 215, 0, 0.95) 0%, rgba(212, 175, 55, 0.95) 100%)',
      padding: isMobile ? '10px 16px' : '12px 20px',
      borderRadius: '100px',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      backdropFilter: 'blur(10px)',
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      boxShadow: isUrgent
        ? '0 10px 30px rgba(239, 68, 68, 0.4)'
        : '0 10px 30px rgba(255, 215, 0, 0.3)',
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
        background: isUrgent ? '#fff' : '#000',
        borderRadius: '50%',
        animation: 'blink 1.5s ease-in-out infinite',
        boxShadow: '0 0 10px rgba(255, 255, 255, 0.5)'
      }} />
      <span style={{
        fontSize: isMobile ? '0.75rem' : '0.85rem',
        fontWeight: '700',
        color: isUrgent ? '#fff' : '#000',
        letterSpacing: '0.02em',
        textTransform: 'uppercase'
      }}>
        {left <= 0 
          ? 'Partners Vol'
          : left === 1
            ? 'Laatste Partner Plek!'
            : `Nog ${left} Partner Plekken`
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

// Main Affiliate Funnel Component - GOUDEN VERSIE
export default function AffiliateFunnel() {
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

  // All sections for Affiliate Funnel
  const sections = [
    AffiliateHero,
    AffiliateVideoSection,
    CommissionStructure,
    EarningsCalculator,
    AffiliateValueStack,
  //  SuccessStories,
    WhyPartnerSection,
    OnboardingProcess,
    AffiliateCallCTA
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
      window.gtag('event', 'affiliate_calendly_opened', {
        event_category: 'conversion',
        event_label: 'affiliate_funnel'
      })
    }
  }

  return (
    <>
      {/* Progress bar at top - GOUDEN VERSIE */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        background: 'rgba(255, 215, 0, 0.1)',
        zIndex: 101
      }}>
        <div style={{
          width: `${scrollProgress}%`,
          height: '100%',
          background: 'linear-gradient(90deg, #FFD700 0%, #D4AF37 100%)',
          transition: 'width 0.1s ease-out',
          boxShadow: '0 0 10px rgba(255, 215, 0, 0.5)'
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

        {/* Live affiliate spots counter */}
        <AffiliateSpots isMobile={isMobile} />
      </div>

      {/* Floating bottom bar */}
      <AffiliateFloatingBar 
        onOpenCalendly={handleOpenCalendly}
        isMobile={isMobile}
      />

      {/* NIEUWE Calendly modal component */}
      <AffiliateCalendlyModal 
        isOpen={showCalendlyModal}
        onClose={() => setShowCalendlyModal(false)}
        isMobile={isMobile}
      />

      {/* Global animations - GOUDEN VERSIE */}
      <style>{`
        @keyframes urgentPulse {
          0%, 100% { 
            transform: scale(1);
            boxShadow: 0 10px 30px rgba(239, 68, 68, 0.4);
          }
          50% { 
            transform: scale(1.05);
            boxShadow: 0 15px 40px rgba(239, 68, 68, 0.5);
          }
        }
        
        @keyframes normalPulse {
          0%, 100% { 
            transform: scale(1);
            boxShadow: 0 10px 30px rgba(255, 215, 0, 0.3);
          }
          50% { 
            transform: scale(1.02);
            boxShadow: 0 15px 40px rgba(255, 215, 0, 0.4);
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
