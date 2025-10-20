import React, { useState, useEffect } from 'react'
import { ChevronDown, MessageCircle } from 'lucide-react'
import CalendlyModal from '../components/CalendlyModal'

export default function FAQSection({ onScrollNext }) {
  const [headerVisible, setHeaderVisible] = useState(false)
  const [faqVisible, setFaqVisible] = useState(-1)
  const [ctaVisible, setCtaVisible] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const [openIndex, setOpenIndex] = useState(null)
  const [showCalendlyModal, setShowCalendlyModal] = useState(false)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    
    // Progressive reveal choreography
    setTimeout(() => setHeaderVisible(true), 400)
    
    // Stagger FAQs (100ms apart)
    faqs.forEach((_, i) => {
      setTimeout(() => setFaqVisible(i), 800 + (i * 100))
    })
    
    setTimeout(() => setCtaVisible(true), 800 + (faqs.length * 100) + 400)
    
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  const faqs = [
    {
      question: "Wat is het verschil met de 8-weken challenge?",
      answer: "8 weken was momentum opbouwen. Till The Goal is lifetime transformatie. We stoppen pas als jouw doel gehaald is - 6, 8, of 10 maanden."
    },
    {
      question: "Hoeveel kost het programma?",
      answer: "€550-€600 totaal (€300 challenge + €250-€300 extra). Win tot €300 terug bij succes. Effectief: €250-€600."
    },
    {
      question: "Wat zijn de voorwaarden voor win-back?",
      answer: "72 workouts (3x/week), 135 dagen voeding (80%), 24 metingen, 12 calls, je doel gehaald. Focus op consistentie, niet perfectie."
    },
    {
      question: "Wanneer moet ik beslissen?",
      answer: "Week 6-8 van je challenge. Perfect timing - momentum is maximaal. Daarna: full price €1800."
    },
    {
      question: "Wat gebeurt er na 6 maanden?",
      answer: "Doel gehaald? Top! Nog niet? We gaan door tot JIJ wint. Geen tijdslimiet, tot het doel staat."
    },
    {
      question: "Hoeveel contact heb ik met je?",
      answer: "Minimaal 2x per maand coaching calls + 24/7 WhatsApp + wekelijkse check-ins via app."
    },
    {
      question: "Kan ik mijn geld terugkrijgen?",
      answer: "3 garanties: Till The Goal, Niet Geleverd refund, Win Your Money Back. Je kunt niet verliezen."
    },
    {
      question: "Wat krijg ik precies?",
      answer: "6+ maanden begeleiding, 12+ calls, volledige MY ARC toegang, persoonlijk plan dat blijft werken."
    },
    {
      question: "Waarom zou ik dit doen na de challenge?",
      answer: "90% valt terug zonder systeem. Till The Goal elimineert terugval en garandeert je dream outcome."
    },
    {
      question: "Hoe weet ik of dit voor mij is?",
      answer: "Heb je 8 weken bewezen dat je het kunt? Dan is dit jouw lifetime transformation. Momentum → Resultaat."
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
          padding: isMobile ? '4rem 1rem' : '6rem 2rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          overflow: 'hidden'
        }}
      >
        {/* Subtle red orbs */}
        <div style={{
          position: 'absolute',
          top: '20%',
          right: '-10%',
          width: isMobile ? '300px' : '450px',
          height: isMobile ? '300px' : '450px',
          background: 'radial-gradient(circle, rgba(220, 38, 38, 0.04) 0%, transparent 70%)',
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
          background: 'radial-gradient(circle, rgba(153, 27, 27, 0.03) 0%, transparent 70%)',
          filter: 'blur(90px)',
          animation: 'float 35s ease-in-out infinite reverse',
          pointerEvents: 'none'
        }} />

        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: isMobile ? '4.5rem' : '6rem',
          maxWidth: '800px',
          opacity: headerVisible ? 1 : 0,
          transform: headerVisible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          <h2 style={{
            fontSize: isMobile ? '2rem' : '3.5rem',
            fontWeight: '900',
            background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 50%, #dc2626 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '1.5rem',
            letterSpacing: '-0.02em',
            textShadow: '0 0 40px rgba(220, 38, 38, 0.3)'
          }}>
            Veelgestelde Vragen
          </h2>
          
          <p style={{
            fontSize: isMobile ? '1rem' : '1.25rem',
            color: 'rgba(239, 68, 68, 0.7)',
            fontWeight: '300',
            letterSpacing: '0.02em'
          }}>
            Over Till The Goal Programma
          </p>
        </div>

        {/* FAQ Items */}
        <div style={{
          maxWidth: '800px',
          width: '100%',
          marginBottom: isMobile ? '4.5rem' : '6rem'
        }}>
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index
            const isVisible = faqVisible >= index
            
            return (
              <div
                key={index}
                style={{
                  marginBottom: '1.5rem',
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'translateX(0)' : 'translateX(-20px)',
                  transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  style={{
                    width: '100%',
                    padding: isMobile ? '1.25rem' : '1.5rem',
                    background: isOpen
                      ? 'rgba(0, 0, 0, 0.9)'
                      : 'rgba(0, 0, 0, 0.8)',
                    border: `1px solid ${isOpen ? 'rgba(220, 38, 38, 0.4)' : 'rgba(220, 38, 38, 0.2)'}`,
                    borderRadius: '0',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    backdropFilter: 'blur(10px)',
                    boxShadow: isOpen
                      ? '0 10px 30px rgba(220, 38, 38, 0.15)'
                      : '0 5px 20px rgba(0, 0, 0, 0.5)',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent'
                  }}
                  onMouseEnter={(e) => {
                    if (!isOpen) {
                      e.currentTarget.style.border = '1px solid rgba(220, 38, 38, 0.3)'
                      e.currentTarget.style.transform = 'translateX(4px)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isOpen) {
                      e.currentTarget.style.border = '1px solid rgba(220, 38, 38, 0.2)'
                      e.currentTarget.style.transform = 'translateX(0)'
                    }
                  }}
                >
                  <span style={{
                    fontSize: isMobile ? '0.95rem' : '1.125rem',
                    fontWeight: '700',
                    color: isOpen ? '#ef4444' : 'rgba(255, 255, 255, 0.85)',
                    textAlign: 'left',
                    flex: 1,
                    paddingRight: '1rem'
                  }}>
                    {faq.question}
                  </span>
                  
                  <ChevronDown
                    size={isMobile ? 20 : 24}
                    style={{
                      color: isOpen ? '#ef4444' : 'rgba(239, 68, 68, 0.6)',
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
                  background: 'rgba(0, 0, 0, 0.9)',
                  border: isOpen ? '1px solid rgba(220, 38, 38, 0.2)' : 'none',
                  borderTop: 'none',
                  opacity: isOpen ? 1 : 0
                }}>
                  <div style={{
                    padding: isMobile ? '1.25rem' : '1.5rem',
                    paddingTop: isMobile ? '1rem' : '1.25rem'
                  }}>
                    <p style={{
                      fontSize: isMobile ? '0.9rem' : '1rem',
                      color: 'rgba(255, 255, 255, 0.75)',
                      lineHeight: '1.7',
                      margin: 0,
                      fontWeight: '300'
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
          opacity: ctaVisible ? 1 : 0,
          transform: ctaVisible ? 'scale(1)' : 'scale(0.95)',
          transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          <p style={{
            fontSize: isMobile ? '1rem' : '1.25rem',
            color: 'rgba(239, 68, 68, 0.7)',
            marginBottom: '2.25rem',
            fontStyle: 'italic',
            fontWeight: '300'
          }}>
            Klaar om verder te gaan?
          </p>
          
          <button
            onClick={() => setShowCalendlyModal(true)}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)'
              e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)'
              e.currentTarget.style.boxShadow = '0 25px 50px rgba(220, 38, 38, 0.4), 0 0 100px rgba(220, 38, 38, 0.3)'
              e.currentTarget.style.color = '#fff'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.8)'
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.7), 0 0 40px rgba(220, 38, 38, 0.15)'
              e.currentTarget.style.color = '#ef4444'
            }}
            onTouchStart={(e) => {
              if (isMobile) {
                e.currentTarget.style.transform = 'scale(0.98)'
              }
            }}
            onTouchEnd={(e) => {
              if (isMobile) {
                e.currentTarget.style.transform = 'scale(1)'
              }
            }}
            style={{
              background: 'rgba(0, 0, 0, 0.8)',
              border: '2px solid rgba(220, 38, 38, 0.4)',
              borderRadius: '0',
              padding: isMobile ? '1.25rem 2.5rem' : '1.5rem 3.5rem',
              fontSize: isMobile ? '1.125rem' : '1.25rem',
              fontWeight: '800',
              color: '#ef4444',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.75rem',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.7), 0 0 40px rgba(220, 38, 38, 0.15)',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '44px',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div style={{
              position: 'absolute',
              top: '-50%',
              left: '-30%',
              width: '50%',
              height: '200%',
              background: 'linear-gradient(90deg, transparent, rgba(220, 38, 38, 0.2), transparent)',
              transform: 'rotate(35deg)',
              animation: 'glide 4s ease-in-out infinite',
              pointerEvents: 'none'
            }} />
            
            <MessageCircle size={isMobile ? 20 : 24} style={{ 
              position: 'relative',
              zIndex: 1,
              filter: 'drop-shadow(0 0 8px rgba(220, 38, 38, 0.4))'
            }} />
            <span style={{ position: 'relative', zIndex: 1 }}>
              Bespreek Jouw Vervolgtraject
            </span>
          </button>
        </div>

        {/* CSS Animations */}
        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0) scale(1); }
            50% { transform: translateY(-30px) scale(1.05); }
          }
          
          @keyframes glide {
            0% { left: -30%; }
            100% { left: 130%; }
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
