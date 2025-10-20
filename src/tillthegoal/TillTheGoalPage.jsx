import { useState, useEffect } from 'react'
import HeroSection from './sections/HeroSection'
import ProblemSection from './sections/ProblemSection'
import SolutionSection from './sections/SolutionSection'
import PricingSection from './sections/PricingSection'
import GuaranteesSection from './sections/GuaranteesSection'
import FinalCTASection from './sections/FinalCTASection'

// Till The Goal - Main Funnel Page
export default function TillTheGoalPage() {
  const [currentSection, setCurrentSection] = useState(0)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Scroll to next section handler
  const scrollToNextSection = () => {
    const nextSection = currentSection + 1
    if (nextSection < sections.length) {
      setCurrentSection(nextSection)
      const element = document.getElementById(`section-${nextSection}`)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
  }

  // All section components
  const sections = [
    HeroSection,
    ProblemSection,
    SolutionSection,
    PricingSection,
    GuaranteesSection,
    FinalCTASection
  ]

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #000000 0%, #0a0a0a 100%)',
      color: '#fff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      overflowX: 'hidden',
      position: 'relative',
      paddingBottom: '80px'
    }}>
      
      {/* Render all sections */}
      {sections.map((Section, index) => (
        <div key={index} id={`section-${index}`}>
          <Section 
            isMobile={isMobile} 
            onScrollNext={scrollToNextSection}
          />
        </div>
      ))}

      {/* Progress indicator */}
      <div style={{
        position: 'fixed',
        bottom: isMobile ? '30px' : '30px',
        right: isMobile ? '20px' : '30px',
        display: 'flex',
        gap: '8px',
        padding: '12px 16px',
        background: 'rgba(0, 0, 0, 0.9)',
        backdropFilter: 'blur(10px)',
        borderRadius: '100px',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        zIndex: 99
      }}>
        {[...Array(sections.length)].map((_, index) => (
          <div
            key={index}
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: currentSection >= index 
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                : 'rgba(16, 185, 129, 0.2)',
              transition: 'all 0.3s ease',
              boxShadow: currentSection >= index 
                ? '0 0 10px rgba(16, 185, 129, 0.5)'
                : 'none'
            }}
          />
        ))}
      </div>
    </div>
  )
}
