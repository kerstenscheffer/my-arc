// src/modules/qualification-funnel/QualificationFunnel.jsx
// MY ARC - Premium Qualification Funnel
// Gold/Black Theme - Instagram Level Design

import { useState, useEffect, useRef } from 'react'
import { resetAnalytics, initFunnelAnalytics } from './FunnelAnalytics'

// Import all steps
import LandingStep from './components/LandingStep'
import FilterStep from './components/FilterStep'
import CommitmentStep from './components/CommitmentStep'
import SocialProofSlider from './components/SocialProofSlider'
import CalendlyStep from './components/CalendlyStep'
import ConfirmationStep from './components/ConfirmationStep'

// Funnel steps
const STEPS = {
  LANDING: 'landing',
  FILTER: 'filter',
  COMMITMENT: 'commitment',
  SOCIAL_PROOF: 'social_proof',
  CALENDLY: 'calendly',
  CONFIRMATION: 'confirmation'
}

export default function QualificationFunnel({ onComplete, db }) {
  const [currentStep, setCurrentStep] = useState(STEPS.LANDING)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const [funnelData, setFunnelData] = useState({
    experienceLevel: null,
    committed: null,
    booked: false
  })
  
  // Analytics - initialize with Supabase if available
  const analytics = useRef(null)
  
  useEffect(() => {
    // Initialize analytics with Supabase connection
    if (db?.supabase) {
      analytics.current = initFunnelAnalytics(db.supabase)
    } else {
      analytics.current = resetAnalytics()
    }
  }, [db])

  // Handle responsive
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768)
      
      // Fix viewport height for mobile browsers
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

  // Track initial step view
  useEffect(() => {
    analytics.current.trackStepView(currentStep)
  }, [currentStep])

  // Track drop-off on page leave/close
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (currentStep !== STEPS.CONFIRMATION) {
        analytics.current.trackDropOff(currentStep, 'page_close')
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && currentStep !== STEPS.CONFIRMATION) {
        analytics.current.trackDropOff(currentStep, 'tab_switch')
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [currentStep])

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    document.body.style.background = '#000'
    
    return () => {
      document.body.style.overflow = ''
      document.body.style.background = ''
    }
  }, [])

  // Navigation handlers
  const goToStep = (step) => {
    setCurrentStep(step)
    // Scroll to top on step change
    window.scrollTo(0, 0)
  }

  const handleLandingNext = () => {
    analytics.current.trackStepComplete(STEPS.LANDING)
    goToStep(STEPS.FILTER)
  }

  const handleFilterNext = (data) => {
    analytics.current.trackStepComplete(STEPS.FILTER)
    analytics.current.trackChoice(STEPS.FILTER, 'experience_level', data.experienceLevel)
    setFunnelData(prev => ({ ...prev, ...data }))
    goToStep(STEPS.COMMITMENT)
  }

  const handleCommitmentNext = (data) => {
    analytics.current.trackStepComplete(STEPS.COMMITMENT)
    analytics.current.trackChoice(STEPS.COMMITMENT, 'committed', data.committed)
    setFunnelData(prev => ({ ...prev, ...data }))
    goToStep(STEPS.SOCIAL_PROOF)
  }

  const handleCommitmentExit = () => {
    analytics.current.trackDropOff(STEPS.COMMITMENT, 'not_committed')
  }

  const handleSocialProofNext = () => {
    analytics.current.trackStepComplete(STEPS.SOCIAL_PROOF)
    goToStep(STEPS.CALENDLY)
  }

  const handleCalendlyNext = (data) => {
    analytics.current.trackStepComplete(STEPS.CALENDLY)
    analytics.current.trackChoice(STEPS.CALENDLY, 'booked', true)
    setFunnelData(prev => ({ ...prev, ...data }))
    goToStep(STEPS.CONFIRMATION)
    
    // Track funnel completion
    analytics.current.trackComplete({
      experience_level: funnelData.experienceLevel,
      committed: funnelData.committed,
      booked: true
    })
    
    // Trigger complete callback if provided
    if (onComplete) {
      onComplete(funnelData)
    }
  }

  const handleCalendlyBack = () => {
    analytics.current.trackEvent('step_back', { 
      from: STEPS.CALENDLY, 
      to: STEPS.SOCIAL_PROOF 
    })
    goToStep(STEPS.SOCIAL_PROOF)
  }

  // Render current step
  const renderStep = () => {
    switch (currentStep) {
      case STEPS.LANDING:
        return (
          <LandingStep 
            onNext={handleLandingNext}
            isMobile={isMobile}
          />
        )
      
      case STEPS.FILTER:
        return (
          <FilterStep 
            onNext={handleFilterNext}
            isMobile={isMobile}
          />
        )
      
      case STEPS.COMMITMENT:
        return (
          <CommitmentStep 
            onNext={handleCommitmentNext}
            onExit={handleCommitmentExit}
            isMobile={isMobile}
          />
        )
      
      case STEPS.SOCIAL_PROOF:
        return (
          <SocialProofSlider 
            onNext={handleSocialProofNext}
            isMobile={isMobile}
          />
        )
      
      case STEPS.CALENDLY:
        return (
          <CalendlyStep 
            onNext={handleCalendlyNext}
            onBack={handleCalendlyBack}
            isMobile={isMobile}
          />
        )
      
      case STEPS.CONFIRMATION:
        return (
          <ConfirmationStep 
            isMobile={isMobile}
          />
        )
      
      default:
        return null
    }
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: '#000',
      zIndex: 9999,
      overflowY: 'auto',
      overflowX: 'hidden',
      WebkitOverflowScrolling: 'touch'
    }}>
      {renderStep()}
      
      {/* Global styles */}
      <style>{`
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        
        html, body {
          background: #000;
          color: #fff;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        
        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 6px;
        }
        
        ::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
        }
        
        ::-webkit-scrollbar-thumb {
          background: rgba(212, 175, 55, 0.3);
          border-radius: 3px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(212, 175, 55, 0.5);
        }
        
        /* Calendly dark theme override */
        .calendly-inline-widget {
          background: #000 !important;
        }
        
        .calendly-inline-widget iframe {
          background: #000 !important;
        }
      `}</style>
    </div>
  )
}
