import { useState, useEffect } from 'react'

// Import clean section components
import BookCallSection from '../homepage-sections/BookCallSection'
import ClientHeroSection from '../homepage-sections/ClientHeroSection'
import CaseStudySection from '../homepage-sections/CaseStudySection'
import EmailCaptureSection from '../homepage-sections/EmailCaptureSection'
import OfferSection from '../homepage-sections/OfferSection'
import FaqSection from '../homepage-sections/FaqSection'
import AboutSection from '../homepage-sections/AboutSection'
import FooterSection from '../homepage-sections/FooterSection'

// Import components
import AnnouncementBar from '../components/AnnouncementBar'
import SignupModal from '../homepage-sections/SignupModal'
import WhatsAppPopup from '../components/WhatsAppPopup'

// Main Homepage Router Component
export default function Homepage() {
  const [currentSection, setCurrentSection] = useState(0)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const [showSignupModal, setShowSignupModal] = useState(false)

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

  // Section configuration - NIEUWE VOLGORDE met BookCallSection bovenaan
  const sections = [
    { id: 'bookcall', component: BookCallSection },
    { id: 'hero', component: ClientHeroSection },
    { id: 'casestudy', component: CaseStudySection },
    { id: 'offer', component: OfferSection },
    { id: 'faq', component: FaqSection },
    { id: 'email', component: EmailCaptureSection },
    { id: 'about', component: AboutSection }
  ]

  const handleNavigate = (path) => {
    window.location.href = path
  }

  // Scroll to next section
  const handleScrollNext = () => {
    const nextSectionIndex = currentSection + 1
    if (nextSectionIndex < sections.length) {
      const nextSection = sections[nextSectionIndex]
      const element = document.getElementById(`section-${nextSection.id}`)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }

  // Open signup modal
  const handleOpenModal = () => {
    setShowSignupModal(true)
  }

  // Scroll tracking
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + window.innerHeight * 0.4
      
      sections.forEach((section, index) => {
        const element = document.getElementById(`section-${section.id}`)
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
  }, [sections])

  return (
    <>
      {/* Announcement Bar - Fixed at top */}
      <AnnouncementBar 
        isMobile={isMobile}
        onOpenModal={handleOpenModal}
      />

      {/* Add top padding to account for fixed announcement bar */}
      <div style={{ paddingTop: isMobile ? '3rem' : '3.5rem' }}>
        
        {/* Render each section */}
        {sections.map((section, index) => {
          const Section = section.component
          return (
            <div key={section.id} id={`section-${section.id}`}>
              <Section 
                isMobile={isMobile}
                isCurrentSection={currentSection === index}
                onNavigate={handleNavigate}
                onScrollNext={handleScrollNext}
                onOpenModal={handleOpenModal}
              />
            </div>
          )
        })}

      </div>

      {/* Signup Modal */}
      <SignupModal 
        isOpen={showSignupModal}
        onClose={() => setShowSignupModal(false)}
        isMobile={isMobile}
      />

      {/* WhatsApp Popup */}
      <WhatsAppPopup isMobile={isMobile} />

      {/* Footer - Outside main sections */}
      <FooterSection isMobile={isMobile} />

      {/* Global styles */}
      <style>{`
        html {
          scroll-behavior: smooth;
        }
        
        body {
          background: #000;
          overflow-x: hidden;
          margin: 0;
          padding: 0;
        }
        
        * {
          box-sizing: border-box;
        }
        
        @media (max-width: 768px) {
          body {
            overflow-x: hidden;
          }
          
          input, select, textarea {
            font-size: 16px !important;
          }
        }

        /* Ensure proper z-index stacking */
        .announcement-bar {
          z-index: 999;
        }
        
        .signup-modal {
          z-index: 1000;
        }
        
        .whatsapp-popup {
          z-index: 1001;
        }
      `}</style>
    </>
  )
}
