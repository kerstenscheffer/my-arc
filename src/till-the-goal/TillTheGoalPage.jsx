import { useState, useEffect } from 'react'
import HeroTransformation from './sections/HeroTransformation'
import VideoSection from './sections/VideoSection'
import ValueStackComplete from './sections/ValueStackComplete'
import ProcessShowcase from './sections/ProcessShowcase'
import GuaranteesSection from './sections/GuaranteesSection'
import FAQSection from './sections/FAQSection'
import FinalCTASection from './sections/FinalCTASection'
import RedCTAButton from './components/RedCTAButton'
import CalendlyModal from './components/CalendlyModal'
import FloatingBottomBar from './components/FloatingBottomBar'
import { Calendar } from 'lucide-react'

// Complete Till The Goal Funnel Page
export default function TillTheGoalPage() {
  const [currentSection, setCurrentSection] = useState(0)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const [showCalendlyModal, setShowCalendlyModal] = useState(false)

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
    HeroTransformation,
    VideoSection,
    ValueStackComplete,
    ProcessShowcase,
    GuaranteesSection,
    FAQSection,
    FinalCTASection
  ]

  return (
    <>
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #000000 0%, #0a0a0a 100%)',
        color: '#fff',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        overflowX: 'hidden',
        position: 'relative',
        paddingBottom: '80px' // Space for floating bottom bar
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

        {/* Final CTA Button */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          padding: isMobile ? '2rem 1rem 4rem' : '3rem 2rem 5rem',
          background: 'linear-gradient(180deg, #000000 0%, #0a0a0a 100%)'
        }}>
          <RedCTAButton 
            onClick={() => setShowCalendlyModal(true)}
            text="Laatste Kans - Start Till The Goal"
            icon={Calendar}
            isMobile={isMobile}
          />
        </div>

        {/* Progress indicator */}
        <div style={{
          position: 'fixed',
          bottom: isMobile ? '100px' : '100px', // Above floating bottom bar
          right: isMobile ? '20px' : '30px',
          display: 'flex',
          gap: '8px',
          padding: '12px 16px',
          background: 'rgba(0, 0, 0, 0.9)',
          backdropFilter: 'blur(10px)',
          borderRadius: '100px',
          border: '1px solid rgba(220, 38, 38, 0.2)',
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
                  ? 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)'
                  : 'rgba(220, 38, 38, 0.2)',
                transition: 'all 0.3s ease',
                boxShadow: currentSection >= index 
                  ? '0 0 10px rgba(220, 38, 38, 0.5)'
                  : 'none'
              }}
            />
          ))}
        </div>
      </div>

      {/* Calendly Modal */}
      <CalendlyModal 
        isOpen={showCalendlyModal}
        onClose={() => setShowCalendlyModal(false)}
        isMobile={isMobile}
      />

      {/* Floating Bottom Bar */}
      <FloatingBottomBar />
    </>
  )
}
