// src/funnel/FunnelPage.jsx
// Complete Funnel Page - SALES PRESENTATION MODE + SECRET COACH PANEL
import { useState, useEffect } from 'react'
import { Maximize2, Eye } from 'lucide-react'

// CORRECT IMPORTS - From original structure
import HeroTransformation from './sections/HeroTransformation'
import ValueStackComplete from './sections/ValueStackComplete'
import CommitmentCheckSection from './sections/CommitmentCheckSection'
import GuaranteesSection from './sections/GuaranteesSection'
import FinalCTASection from './sections/FinalCTASection'
import CallClosingSection from './components/CallClosingSection'
import ClientWelcomeSection from './components/ClientWelcomeSection'
import ClientObjectieView from './components/ClientObjectieView'
import ObjectieHandlingSection from './components/ObjectieHandlingSection' // COACH SCRIPTS
import CalendlyModal from './components/CalendlyModal'

export default function FunnelPage() {
  const [currentSection, setCurrentSection] = useState(0)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const [showCalendlyModal, setShowCalendlyModal] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showCoachPanel, setShowCoachPanel] = useState(false) // NEW: Secret panel

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true)
      }).catch(err => {
        console.log('Fullscreen error:', err)
      })
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => {
          setIsFullscreen(false)
        })
      }
    }
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen()
      }
      if (e.key === 'Escape') {
        setShowCoachPanel(false)
      }
    }

    window.addEventListener('keypress', handleKeyPress)
    window.addEventListener('keydown', handleKeyPress)
    return () => {
      window.removeEventListener('keypress', handleKeyPress)
      window.removeEventListener('keydown', handleKeyPress)
    }
  }, [])

  // Track fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // Track scroll position for progress indicator
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight
      
      const sectionHeight = documentHeight / sections.length
      const newSection = Math.floor(scrollPosition / sectionHeight)
      
      if (newSection !== currentSection && newSection < sections.length) {
        setCurrentSection(newSection)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [currentSection])

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

  // Scroll to specific section
  const scrollToSection = (index) => {
    console.log('🟢 scrollToSection called with index:', index)
    console.log('🟢 sections.length:', sections.length)
    console.log('🟢 Is coach section?', index >= sections.length)
    
    // If it's a coach section (index >= 4), make it visible first
    if (index >= sections.length) {
      // Find the COACH section specifically (not duplicate IDs)
      const coachSection = document.querySelector(`.coach-section[id="section-${index}"]`)
      console.log('🟢 Looking for coach section:', `section-${index}`)
      console.log('🟢 Found element?', !!coachSection)
      if (coachSection) {
        console.log('🟢 Making coach section visible')
        coachSection.style.display = 'block' // Make visible
        console.log('🟢 Display after set:', coachSection.style.display)
      } else {
        console.log('🔴 Coach section NOT FOUND!')
      }
    }
    
    setCurrentSection(index)
    
    // For scrolling, also use querySelector for coach sections
    let element
    if (index >= sections.length) {
      element = document.querySelector(`.coach-section[id="section-${index}"]`)
    } else {
      element = document.getElementById(`section-${index}`)
    }
    
    console.log('🟢 Scrolling to element:', `section-${index}`)
    console.log('🟢 Element exists?', !!element)
    if (element) {
      console.log('🟢 Calling scrollIntoView')
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else {
      console.log('🔴 Element NOT FOUND for scrolling!')
    }
  }

  // SECTIONS ARRAY - ONLY VISIBLE FLOW (No coach sections on main page)
  const sections = [
    HeroTransformation,      // 0
    ValueStackComplete,      // 1 → "Bekijk In Het Programma"
    CommitmentCheckSection,  // 2 → "Bekijk Garanties" (NEW!)
    GuaranteesSection,       // 3 → "Bekijk Prijs"
    FinalCTASection          // 4 → "Ja, Ik Wil Beginnen" / "Ik Twijfel Nog"
  ]

  // HIDDEN COACH SECTIONS - Only accessible via secret panel
  const coachSections = [
    CallClosingSection,       // 5 → Coach closing scripts (was 4)
    ClientWelcomeSection,     // 6 → JA destination (was 5)
    ClientObjectieView,       // 7 → TWIJFEL destination (was 6)
    ObjectieHandlingSection   // 8 → Coach objectie scripts (was 7)
  ]

  return (
    <>
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #000000 0%, #0a0a0a 100%)',
        color: '#fff',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        overflowX: 'hidden',
        position: 'relative'
      }}>
        
        {/* SECRET COACH BUTTON - Top Left Corner */}
        <button
          onClick={() => setShowCoachPanel(!showCoachPanel)}
          style={{
            position: 'fixed',
            top: '20px',
            left: '20px',
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            background: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            opacity: 0.1, // Almost invisible
            transition: 'all 0.3s ease',
            zIndex: 9999,
            backdropFilter: 'blur(10px)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '0.8'
            e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '0.1'
            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.3)'
          }}
          title="Coach Control Panel (Secret)"
        >
          <Eye size={18} color="rgba(255, 255, 255, 0.6)" />
        </button>

        {/* Fullscreen Toggle Button - Hidden in fullscreen mode */}
        {!isFullscreen && (
          <button
            onClick={toggleFullscreen}
            style={{
              position: 'fixed',
              top: isMobile ? '20px' : '30px',
              right: isMobile ? '20px' : '30px',
              width: isMobile ? '44px' : '48px',
              height: isMobile ? '44px' : '48px',
              borderRadius: '12px',
              background: 'rgba(0, 0, 0, 0.9)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 215, 0, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 100,
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 215, 0, 0.1)'
              e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.5)'
              e.currentTarget.style.transform = 'scale(1.05)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.9)'
              e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.3)'
              e.currentTarget.style.transform = 'scale(1)'
            }}
            onTouchStart={(e) => {
              if (isMobile) e.currentTarget.style.transform = 'scale(0.95)'
            }}
            onTouchEnd={(e) => {
              if (isMobile) e.currentTarget.style.transform = 'scale(1)'
            }}
            title="Fullscreen (F)"
          >
            <Maximize2 size={isMobile ? 20 : 22} color="#FFD700" />
          </button>
        )}

        {/* COACH CONTROL PANEL - Floating Modal */}
        {showCoachPanel && (
          <>
            {/* Backdrop */}
            <div
              onClick={() => setShowCoachPanel(false)}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.8)',
                backdropFilter: 'blur(8px)',
                zIndex: 10000,
                animation: 'fadeIn 0.2s ease'
              }}
            />

            {/* Panel */}
            <div
              style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: isMobile ? '90%' : '400px',
                maxWidth: '400px',
                background: 'linear-gradient(135deg, rgba(17, 17, 17, 0.98) 0%, rgba(10, 10, 10, 0.98) 100%)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 186, 9, 0.3)',
                borderRadius: '16px',
                padding: isMobile ? '1.5rem' : '2rem',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(255, 186, 9, 0.2)',
                zIndex: 10001,
                animation: 'scaleIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              {/* Header */}
              <div style={{
                textAlign: 'center',
                marginBottom: '1.5rem',
                paddingBottom: '1rem',
                borderBottom: '1px solid rgba(255, 186, 9, 0.2)'
              }}>
                <h3 style={{
                  fontSize: isMobile ? '1.25rem' : '1.5rem',
                  fontWeight: '800',
                  background: 'linear-gradient(135deg, #ffba09 0%, #d4a006 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  margin: 0,
                  marginBottom: '0.25rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.02em'
                }}>
                  🎯 Coach Control
                </h3>
                <p style={{
                  fontSize: '0.875rem',
                  color: 'rgba(255, 186, 9, 0.6)',
                  margin: 0
                }}>
                  Kies je script
                </p>
              </div>

              {/* Buttons */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}>
                {/* Button 1: Objectie Scripts */}
                <button
                  onClick={() => {
                    scrollToSection(8) // ObjectieHandlingSection (was 7)
                    setShowCoachPanel(false)
                  }}
                  style={{
                    width: '100%',
                    padding: isMobile ? '1.25rem' : '1.5rem',
                    background: 'linear-gradient(135deg, rgba(255, 186, 9, 0.2) 0%, rgba(212, 160, 6, 0.1) 100%)',
                    border: '1px solid rgba(255, 186, 9, 0.4)',
                    borderRadius: '12px',
                    color: '#ffba09',
                    fontSize: isMobile ? '1rem' : '1.125rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.75rem',
                    textAlign: 'left',
                    boxShadow: '0 4px 12px rgba(255, 186, 9, 0.2)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 186, 9, 0.3) 0%, rgba(212, 160, 6, 0.15) 100%)'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(255, 186, 9, 0.3)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 186, 9, 0.2) 0%, rgba(212, 160, 6, 0.1) 100%)'
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 186, 9, 0.2)'
                  }}
                >
                  <span style={{ fontSize: '1.5rem' }}>📋</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: isMobile ? '1.05rem' : '1.125rem', fontWeight: '800' }}>Objectie Scripts</div>
                    <div style={{ fontSize: '0.8rem', color: 'rgba(255, 186, 9, 0.7)', fontWeight: '500' }}>
                      5 categorieën handling
                    </div>
                  </div>
                </button>

                {/* Button 2: Closing Script */}
                <button
                  onClick={() => {
                    scrollToSection(5) // CallClosingSection (was 4)
                    setShowCoachPanel(false)
                  }}
                  style={{
                    width: '100%',
                    padding: isMobile ? '1.25rem' : '1.5rem',
                    background: 'linear-gradient(135deg, rgba(255, 186, 9, 0.2) 0%, rgba(212, 160, 6, 0.1) 100%)',
                    border: '1px solid rgba(255, 186, 9, 0.4)',
                    borderRadius: '12px',
                    color: '#ffba09',
                    fontSize: isMobile ? '1rem' : '1.125rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.75rem',
                    textAlign: 'left',
                    boxShadow: '0 4px 12px rgba(255, 186, 9, 0.2)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 186, 9, 0.3) 0%, rgba(212, 160, 6, 0.15) 100%)'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(255, 186, 9, 0.3)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 186, 9, 0.2) 0%, rgba(212, 160, 6, 0.1) 100%)'
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 186, 9, 0.2)'
                  }}
                >
                  <span style={{ fontSize: '1.5rem' }}>🎯</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: isMobile ? '1.05rem' : '1.125rem', fontWeight: '800' }}>Closing Script</div>
                    <div style={{ fontSize: '0.8rem', color: 'rgba(255, 186, 9, 0.7)', fontWeight: '500' }}>
                      Begin de close
                    </div>
                  </div>
                </button>

                {/* Close Button */}
                <button
                  onClick={() => setShowCoachPanel(false)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(255, 186, 9, 0.05)',
                    border: '1px solid rgba(255, 186, 9, 0.15)',
                    borderRadius: '10px',
                    color: 'rgba(255, 186, 9, 0.6)',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    marginTop: '0.5rem'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 186, 9, 0.08)'
                    e.currentTarget.style.color = 'rgba(255, 186, 9, 0.8)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 186, 9, 0.05)'
                    e.currentTarget.style.color = 'rgba(255, 186, 9, 0.6)'
                  }}
                >
                  ❌ Sluit Panel (ESC)
                </button>
              </div>
            </div>
          </>
        )}

        {/* Render MAIN sections (visible flow) */}
        {sections.map((Section, index) => (
          <div key={index} id={`section-${index}`}>
            <Section 
              isMobile={isMobile} 
              onScrollNext={scrollToNextSection}
              onNavigate={scrollToSection}
              onOpenCalendly={() => setShowCalendlyModal(true)}
              setCalendlyOpen={setShowCalendlyModal}
            />
          </div>
        ))}

        {/* Render COACH sections (HIDDEN by default - only visible when scrolled to) */}
        {coachSections.map((Section, index) => (
          <div 
            key={`coach-${index}`} 
            id={`section-${index + sections.length}`}
            style={{
              display: 'none', // HIDDEN by default
              minHeight: '100vh'
            }}
            className="coach-section"
          >
            <Section 
              isMobile={isMobile} 
              onScrollNext={scrollToNextSection}
              onOpenCalendly={() => setShowCalendlyModal(true)}
              setCalendlyOpen={setShowCalendlyModal}
            />
          </div>
        ))}

        {/* Progress indicator - Only for MAIN sections */}
        <div style={{
          position: 'fixed',
          bottom: isMobile ? '30px' : '40px',
          right: isMobile ? '20px' : '30px',
          display: 'flex',
          gap: '8px',
          padding: '12px 16px',
          background: 'rgba(0, 0, 0, 0.9)',
          backdropFilter: 'blur(10px)',
          borderRadius: '100px',
          border: '1px solid rgba(255, 215, 0, 0.2)',
          zIndex: 99,
          transition: 'all 0.3s ease',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)'
        }}>
          {[...Array(sections.length)].map((_, index) => (
            <div
              key={index}
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: currentSection >= index 
                  ? 'linear-gradient(135deg, #FFD700 0%, #D4AF37 100%)'
                  : 'rgba(255, 215, 0, 0.2)',
                transition: 'all 0.3s ease',
                boxShadow: currentSection >= index 
                  ? '0 0 10px rgba(255, 215, 0, 0.5)'
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

      {/* Custom Scrollbar Styling + Animations */}
      <style>{`
        /* Webkit browsers (Chrome, Safari, Edge) */
        ::-webkit-scrollbar {
          width: 12px;
        }

        ::-webkit-scrollbar-track {
          background: #000000;
          border-left: 1px solid rgba(255, 215, 0, 0.1);
        }

        ::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #FFD700 0%, #D4AF37 100%);
          border-radius: 6px;
          border: 2px solid #000000;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #FFF4B3 0%, #FFD700 100%);
          box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
        }

        /* Firefox */
        * {
          scrollbar-width: thin;
          scrollbar-color: #FFD700 #000000;
        }

        /* Smooth scrolling */
        html {
          scroll-behavior: smooth;
        }

        /* Animations */
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes scaleIn {
          from { 
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.9);
          }
          to { 
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }
      `}</style>
    </>
  )
}
