import React, { useState, useEffect } from 'react'
import { ChevronDown, MessageCircle } from 'lucide-react'
import GoldenCTAButton from '../components/GoldenCTAButton'
import CalendlyModal from '../components/CalendlyModal'

export default function FAQSection({ onScrollNext }) {
  const [isVisible, setIsVisible] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const [openIndex, setOpenIndex] = useState(null)
  const [showCalendlyModal, setShowCalendlyModal] = useState(false)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    
    const timer = setTimeout(() => setIsVisible(true), 100)
    
    return () => {
      window.removeEventListener('resize', handleResize)
      clearTimeout(timer)
    }
  }, [])

  const faqs = [
    {
      question: "Hoeveel tijd kost het programma per week?",
      answer: "Minimaal 3 workouts van 45 min + 10 min per dag voor voeding tracking. Ik leer je efficienter maaltijden plannen en bereiden dus daar win je tijd. Afhankelijk van je doel schat gemiddeld: 4-8 uur per week."
    },
    {
      question: "Wat als ik geen ervaring heb met fitness?",
      answer: "Perfect! 70% van mijn cliënten start als beginner. Alles wordt stap-voor-stap uitgelegd."
    },
    {
      question: "Kan ik mijn geld echt terugkrijgen?",
      answer: "100% gegarandeerd. Haal je doel OF voldoe aan de voorwaarden = geld terug. Geen kleine lettertjes."
    },
    {
      question: "Wanneer zie ik eerste resultaten?",
      answer: "Week 2: Meer energie. Week 4: Zichtbaar verschil. Week 8: Complete transformatie."
    },
    {
      question: "Moet ik naar een sportschool?",
      answer: "Niet verplicht. Thuis trainen kan ook. Ik pas het plan aan op jouw situatie."
    },
    {
      question: "Wat als ik een week mis door vakantie/werk?",
      answer: "Geen probleem. We pauzeren en pakken op waar je gebleven was. Flexibiliteit is key."
    },
    {
      question: "Zijn er extra kosten na aanmelding?",
      answer: "Nee. Alles zit inbegrepen. Supplementen zijn optioneel met korting."
    },
    {
      question: "Hoeveel begeleiding krijg ik precies?",
      answer: "Wekelijkse calls, dagelijkse app check-ins, 24/7 WhatsApp support bij vragen."
    },
    {
      question: "Wat gebeurt er na de 8 weken?",
      answer: "Je kiest: Stoppen met resultaat, doorgaan met korting, of nieuwe challenge starten."
    },
    {
      question: "Waarom maar 10 plekken?",
      answer: "Kwaliteit boven kwantiteit. Ik geef 110% aan elke cliënt. Dat kan alleen met kleine groepen."
    }
  ]

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <>
      <section 
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(180deg, #000000 0%, #0a0a0a 50%, #000000 100%)',
          position: 'relative',
          padding: isMobile ? '3rem 1rem' : '5rem 2rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          overflow: 'hidden'
        }}
      >
        {/* Subtle golden orbs */}
        <div style={{
          position: 'absolute',
          top: '20%',
          right: '-10%',
          width: isMobile ? '300px' : '450px',
          height: isMobile ? '300px' : '450px',
          background: 'radial-gradient(circle, rgba(255, 215, 0, 0.04) 0%, transparent 70%)',
          filter: 'blur(80px)',
          animation: 'float 30s ease-in-out infinite',
          pointerEvents: 'none'
        }} />
        
        <div style={{
          position: 'absolute',
          bottom: '20%',
          left: '-10%',
          width: isMobile ? '350px' : '500px',
          height: isMobile ? '350px' : '500px',
          background: 'radial-gradient(circle, rgba(212, 175, 55, 0.03) 0%, transparent 70%)',
          filter: 'blur(90px)',
          animation: 'float 35s ease-in-out infinite reverse',
          pointerEvents: 'none'
        }} />

        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: isMobile ? '3rem' : '4rem',
          maxWidth: '800px',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          <h2 style={{
            fontSize: isMobile ? '2rem' : '3.5rem',
            fontWeight: '900',
            background: 'linear-gradient(135deg, #FFD700 0%, #D4AF37 50%, #FFD700 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '1rem',
            letterSpacing: '-0.02em',
            filter: 'drop-shadow(0 2px 20px rgba(255, 215, 0, 0.3))'
          }}>
            Alle Antwoorden Die Je Nodig Hebt
          </h2>
          
          <p style={{
            fontSize: isMobile ? '1rem' : '1.25rem',
            color: 'rgba(212, 175, 55, 0.7)',
            fontWeight: '300',
            letterSpacing: '0.02em'
          }}>
            De 10 meest gestelde vragen beantwoord
          </p>
        </div>

        {/* FAQ Items */}
        <div style={{
          maxWidth: '800px',
          width: '100%',
          marginBottom: isMobile ? '3rem' : '4rem'
        }}>
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index
            
            return (
              <div
                key={index}
                style={{
                  marginBottom: '1rem',
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'translateX(0)' : 'translateX(-20px)',
                  transition: `all 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.05}s`
                }}
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  style={{
                    width: '100%',
                    padding: isMobile ? '1.25rem' : '1.5rem',
                    background: isOpen
                      ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.08) 0%, rgba(212, 175, 55, 0.04) 100%)'
                      : 'linear-gradient(135deg, rgba(0, 0, 0, 0.9) 0%, rgba(255, 215, 0, 0.02) 100%)',
                    border: `1px solid ${isOpen ? 'rgba(255, 215, 0, 0.3)' : 'rgba(255, 215, 0, 0.15)'}`,
                    borderRadius: isOpen ? '20px 20px 0 0' : '20px',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    backdropFilter: 'blur(10px)',
                    boxShadow: isOpen
                      ? '0 10px 30px rgba(255, 215, 0, 0.1)'
                      : '0 5px 20px rgba(0, 0, 0, 0.5)',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent'
                  }}
                  onMouseEnter={(e) => {
                    if (!isOpen) {
                      e.currentTarget.style.border = '1px solid rgba(255, 215, 0, 0.25)'
                      e.currentTarget.style.transform = 'translateX(4px)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isOpen) {
                      e.currentTarget.style.border = '1px solid rgba(255, 215, 0, 0.15)'
                      e.currentTarget.style.transform = 'translateX(0)'
                    }
                  }}
                >
                  <span style={{
                    fontSize: isMobile ? '0.95rem' : '1.125rem',
                    fontWeight: '600',
                    color: isOpen ? '#FFD700' : 'rgba(255, 255, 255, 0.9)',
                    textAlign: 'left',
                    flex: 1,
                    paddingRight: '1rem'
                  }}>
                    {faq.question}
                  </span>
                  
                  <ChevronDown
                    size={isMobile ? 20 : 24}
                    style={{
                      color: isOpen ? '#FFD700' : 'rgba(212, 175, 55, 0.6)',
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.3s ease',
                      flexShrink: 0
                    }}
                  />
                </button>
                
                {/* Answer */}
                <div style={{
                  maxHeight: isOpen ? '200px' : '0',
                  overflow: 'hidden',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(255, 215, 0, 0.02) 100%)',
                  borderLeft: '1px solid rgba(255, 215, 0, 0.3)',
                  borderRight: '1px solid rgba(255, 215, 0, 0.3)',
                  borderBottom: isOpen ? '1px solid rgba(255, 215, 0, 0.3)' : 'none',
                  borderRadius: '0 0 20px 20px',
                  opacity: isOpen ? 1 : 0
                }}>
                  <div style={{
                    padding: isMobile ? '1.25rem' : '1.5rem',
                    paddingTop: isMobile ? '1rem' : '1.25rem'
                  }}>
                    <p style={{
                      fontSize: isMobile ? '0.9rem' : '1rem',
                      color: 'rgba(255, 255, 255, 0.8)',
                      lineHeight: '1.6',
                      margin: 0
                    }}>
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* CTA Button */}
        <div style={{
          textAlign: 'center',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'scale(1)' : 'scale(0.95)',
          transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.8s'
        }}>
          <p style={{
            fontSize: isMobile ? '1rem' : '1.25rem',
            color: 'rgba(212, 175, 55, 0.7)',
            marginBottom: '2rem',
            fontStyle: 'italic'
          }}>
            Nog vragen? Ik sta voor je klaar.
          </p>
          
          <GoldenCTAButton 
            onClick={() => setShowCalendlyModal(true)}
            text="Plan Een Vrijblijvend Gesprek"
            icon={MessageCircle}
            isMobile={isMobile}
          />
        </div>

        {/* CSS Animations */}
        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0) scale(1); }
            50% { transform: translateY(-30px) scale(1.05); }
          }
        `}</style>
      </section>

      {/* Calendly Modal */}
      <CalendlyModal 
        isOpen={showCalendlyModal}
        onClose={() => setShowCalendlyModal(false)}
        isMobile={isMobile}
      />
    </>
  )
}
