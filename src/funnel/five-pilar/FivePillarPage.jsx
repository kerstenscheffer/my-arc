// ========================================
// 📁 src/funnel/five-pilar/FivePillarPage.jsx
// MAIN PAGE - NEW FUNNEL /5pilar
// Fullscreen support + sections added incrementally
// ========================================
import { useState, useEffect } from 'react'
import { Maximize2 } from 'lucide-react'
import HeroSection from './sections/HeroSection'
import ValueFramesSection from './sections/ValueFramesSection'
import PillarSection from './sections/PillarSection'
import PricingSection from './sections/PricingSection'
import ClosingSection from './sections/ClosingSection'

export default function FivePillarPage() {
  const [currentSection, setCurrentSection] = useState(0)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true)
      }).catch(err => console.log('Fullscreen error:', err))
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => {
          setIsFullscreen(false)
        })
      }
    }
  }

  // Keyboard shortcut F for fullscreen
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen()
      }
    }
    window.addEventListener('keypress', handleKeyPress)
    return () => window.removeEventListener('keypress', handleKeyPress)
  }, [])

  // Track fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // All sections - grows as we add them
  const sections = [
    // HeroSection,
    // ValueFramesSection,
    PillarSection,
    PricingSection,
    // ClosingSection
  ]

  // Track scroll for progress
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY
      const documentHeight = document.documentElement.scrollHeight
      const sectionHeight = documentHeight / sections.length
      const newSection = Math.floor(scrollPosition / sectionHeight)
      if (newSection !== currentSection && newSection < sections.length) {
        setCurrentSection(newSection)
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [currentSection, sections.length])

  const scrollToNextSection = () => {
    const nextSection = currentSection + 1
    if (nextSection < sections.length) {
      setCurrentSection(nextSection)
      const el = document.getElementById(`section-${nextSection}`)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const scrollToSection = (index) => {
    setCurrentSection(index)
    const el = document.getElementById(`section-${index}`)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

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

        {/* Fullscreen Toggle */}
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

        {/* Render sections */}
        {sections.map((Section, index) => (
          <div key={index} id={`section-${index}`}>
            <Section
              isMobile={isMobile}
              onScrollNext={scrollToNextSection}
              onNavigate={scrollToSection}
            />
          </div>
        ))}

        {/* Progress dots - only when multiple sections */}
        {sections.length > 1 && (
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
            border: '1px solid rgba(255, 186, 9, 0.2)',
            zIndex: 99,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)'
          }}>
            {sections.map((_, index) => (
              <div
                key={index}
                onClick={() => scrollToSection(index)}
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  cursor: 'pointer',
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
        )}
      </div>

      <style>{`
        ::-webkit-scrollbar { width: 12px; }
        ::-webkit-scrollbar-track { background: #000; border-left: 1px solid rgba(255, 215, 0, 0.1); }
        ::-webkit-scrollbar-thumb { background: linear-gradient(180deg, #FFD700, #D4AF37); border-radius: 6px; border: 2px solid #000; }
        ::-webkit-scrollbar-thumb:hover { background: linear-gradient(180deg, #FFF4B3, #FFD700); }
        * { scrollbar-width: thin; scrollbar-color: #FFD700 #000; }
        html { scroll-behavior: smooth; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        @property --border-angle {
          syntax: '<angle>';
          initial-value: 0deg;
          inherits: false;
        }
        @keyframes spinBorder {
          0% { --border-angle: 0deg; }
          100% { --border-angle: 360deg; }
        }
      `}</style>
    </>
  )
}
