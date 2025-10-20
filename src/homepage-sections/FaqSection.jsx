import { useState, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

export default function FaqSection({ isMobile }) {
  const [visibleQuestions, setVisibleQuestions] = useState(0)
  const [openQuestion, setOpenQuestion] = useState(null)

  // Slow reveal questions
  useEffect(() => {
    const timers = []
    for (let i = 0; i <= 4; i++) {
      timers.push(
        setTimeout(() => {
          setVisibleQuestions(i)
        }, i * 800)
      )
    }

    return () => timers.forEach(clearTimeout)
  }, [])

  const faqData = [
    {
      question: "Wat is My Arc Personal Training?",
      answer: "1-op-1 begeleiding om jou zo efficiënt mogelijk naar je doel te helpen. Kersten heeft voor alle problemen die mensen ervaren oplossingen en handige tips, samen met een resultaat garantie systeem is My Arc perfect voor mensen die snel & zeker fitter willen worden."
    },
    {
      question: "Hoe zou het mij helpen?",
      answer: "Iedereen heeft probleempunten. Discipline? Kennis? Motivatie? Kersten heeft veel problemen langs zien komen en voor alles slimme manieren om het op te lossen bedacht."
    },
    {
      question: "Hoeveel tijd kost het per week?",
      answer: "Dat is afhankelijk van jouw doel. Kersten maakt een plan op basis van jouw leven. Voor de ene kan dit programma juist tijd besparen (door meal prep en workout hacks), en voor de ander zou het 3 uurtjes kosten. Maar kost het echt iets, als jij je er de hele dag beter door voelt?"
    },
    {
      question: "Wat kan ik verwachten?",
      answer: "Afhankelijk van jouw plan kun je veel direct contact met Kersten verwachten, hij gaat je helpen bij het opzetten van een gezonder leven binnen je huidige leven. Kersten heeft allerlei hulpmiddelen klaarstaan om je hierbij te ondersteunen, zodat jouw plan een gegarandeerd succes wordt!"
    }
  ]

  const toggleQuestion = (index) => {
    setOpenQuestion(openQuestion === index ? null : index)
  }

  return (
    <section style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: isMobile ? '4rem 1rem' : '5rem 2rem',
      background: '#0a0a0a',
      position: 'relative'
    }}>
      
      {/* Subtle background accent */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at center, rgba(16, 185, 129, 0.02) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      <div style={{
        maxWidth: '800px',
        width: '100%',
        textAlign: 'center'
      }}>
        
        {/* Section Header */}
        <div style={{
          marginBottom: isMobile ? '3rem' : '4rem',
          opacity: visibleQuestions >= 0 ? 1 : 0,
          transform: visibleQuestions >= 0 ? 'translateY(0)' : 'translateY(30px)',
          transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          <h2 style={{
            fontSize: isMobile ? '1.75rem' : '2.5rem',
            fontWeight: '700',
            color: '#fff',
            lineHeight: '1.2',
            marginBottom: isMobile ? '1rem' : '1.5rem',
            letterSpacing: '-0.02em'
          }}>
            Veelgestelde Vragen
          </h2>
          
          <p style={{
            fontSize: isMobile ? '1rem' : '1.2rem',
            color: 'rgba(255, 255, 255, 0.6)',
            lineHeight: '1.5',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            Alles wat je wilt weten over My Arc Personal Training
          </p>
        </div>

        {/* FAQ Items */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: isMobile ? '1rem' : '1.5rem',
          textAlign: 'left'
        }}>
          {faqData.map((item, index) => (
            <div
              key={index}
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: '16px',
                overflow: 'hidden',
                opacity: visibleQuestions >= index + 1 ? 1 : 0,
                transform: visibleQuestions >= index + 1 ? 'translateY(0)' : 'translateY(30px)',
                transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1)',
                transitionDelay: `${(index + 1) * 0.2}s`
              }}
            >
              {/* Question */}
              <button
                onClick={() => toggleQuestion(index)}
                style={{
                  width: '100%',
                  padding: isMobile ? '1.25rem 1.5rem' : '1.5rem 2rem',
                  background: 'transparent',
                  border: 'none',
                  color: '#fff',
                  fontSize: isMobile ? '1rem' : '1.125rem',
                  fontWeight: '600',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.3s ease',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  lineHeight: '1.4'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                }}
                onTouchStart={(e) => {
                  if (isMobile) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
                  }
                }}
                onTouchEnd={(e) => {
                  if (isMobile) {
                    e.currentTarget.style.background = 'transparent'
                  }
                }}
              >
                <span style={{
                  flex: 1,
                  marginRight: '1rem'
                }}>
                  {item.question}
                </span>
                
                <ChevronDown 
                  size={isMobile ? 20 : 22} 
                  color="rgba(16, 185, 129, 0.8)"
                  style={{
                    transform: openQuestion === index ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s ease',
                    flexShrink: 0
                  }}
                />
              </button>

              {/* Answer */}
              <div style={{
                maxHeight: openQuestion === index ? '500px' : '0px',
                opacity: openQuestion === index ? 1 : 0,
                overflow: 'hidden',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
              }}>
                <div style={{
                  padding: isMobile ? '0 1.5rem 1.5rem 1.5rem' : '0 2rem 2rem 2rem',
                  borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                  marginTop: '0.5rem',
                  paddingTop: '1.25rem'
                }}>
                  <p style={{
                    fontSize: isMobile ? '0.95rem' : '1.05rem',
                    color: 'rgba(255, 255, 255, 0.7)',
                    lineHeight: '1.6',
                    margin: 0
                  }}>
                    {item.answer}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA hint */}
        <div style={{
          marginTop: isMobile ? '3rem' : '4rem',
          opacity: visibleQuestions >= 4 ? 1 : 0,
          transform: visibleQuestions >= 4 ? 'translateY(0)' : 'translateY(30px)',
          transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1)',
          transitionDelay: '1s'
        }}>
          <p style={{
            fontSize: isMobile ? '0.85rem' : '0.95rem',
            color: 'rgba(255, 255, 255, 0.4)',
            textAlign: 'center',
            letterSpacing: '0.02em'
          }}>
            Nog andere vragen? Die bespreken we graag persoonlijk.
          </p>
        </div>
      </div>
    </section>
  )
}
