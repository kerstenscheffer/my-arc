import React, { useState, useEffect } from 'react'
import { Timer, Users, Calendar, ArrowRight, X } from 'lucide-react'
import GoldenCTAButton from '../components/GoldenCTAButton'
import CalendlyModal from '../components/CalendlyModal'

export default function FinalCTASection({ onScrollNext }) {
  const [isVisible, setIsVisible] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const [hoveredChoice, setHoveredChoice] = useState(null)
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

  const urgencyItems = [
    { icon: Timer, text: "Inschrijving Sluit Na 10 Aanmeldingen", color: '#ef4444' },
    { icon: Users, text: "Misschien Geen Nieuwe Rondes - Mis Je Kans Niet", color: '#f97316' },
    { icon: Calendar, text: "Start Jouw Transformatie Maandag al", color: '#eab308' }
  ]

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
        {/* Dramatic golden orbs */}
        <div style={{
          position: 'absolute',
          top: '5%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: isMobile ? '400px' : '600px',
          height: isMobile ? '400px' : '600px',
          background: 'radial-gradient(circle, rgba(255, 215, 0, 0.08) 0%, transparent 60%)',
          filter: 'blur(100px)',
          animation: 'pulse 4s ease-in-out infinite',
          pointerEvents: 'none'
        }} />

        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: isMobile ? '2rem' : '3rem',
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
            Dit Is Het Moment Van Beslissen
          </h2>
          
          <p style={{
            fontSize: isMobile ? '1rem' : '1.25rem',
            color: 'rgba(212, 175, 55, 0.7)',
            fontWeight: '300',
            letterSpacing: '0.02em'
          }}>
            Alleen De Eerste 10 Krijgen Deze Kans
          </p>
        </div>

        {/* Urgency Box */}
        <div style={{
          display: 'flex',
          gap: isMobile ? '0.75rem' : '1.5rem',
          flexDirection: isMobile ? 'column' : 'row',
          marginBottom: isMobile ? '2rem' : '3rem',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'scale(1)' : 'scale(0.95)',
          transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.2s'
        }}>
          {urgencyItems.map((item, index) => {
            const Icon = item.icon
            return (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: isMobile ? '0.875rem 1.25rem' : '1rem 1.5rem',
                  background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.9) 0%, rgba(255, 215, 0, 0.03) 100%)',
                  border: `1px solid ${item.color}30`,
                  borderRadius: '14px',
                  backdropFilter: 'blur(10px)',
                  boxShadow: `0 10px 30px rgba(0, 0, 0, 0.5), 0 0 30px ${item.color}15`,
                  animation: `fadeInUp 0.6s ${index * 0.1}s forwards`,
                  opacity: 0
                }}
              >
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: `linear-gradient(135deg, ${item.color}20 0%, ${item.color}10 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `1px solid ${item.color}40`,
                  flexShrink: 0
                }}>
                  <Icon size={20} color={item.color} />
                </div>
                <span style={{
                  fontSize: isMobile ? '0.875rem' : '1rem',
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontWeight: '600',
                  whiteSpace: 'nowrap'
                }}>
                  {item.text}
                </span>
              </div>
            )
          })}
        </div>

        {/* Kern Boodschap */}
        <div style={{
          maxWidth: '700px',
          textAlign: 'center',
          marginBottom: isMobile ? '3rem' : '4rem',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.4s'
        }}>
          <p style={{
            fontSize: isMobile ? '1rem' : '1.25rem',
            color: 'rgba(255, 255, 255, 0.9)',
            lineHeight: '1.8',
            marginBottom: '1.5rem'
          }}>
            Je hebt nu alles gezien. De garanties. De transformaties. Het systeem dat werkt.
          </p>
          
          <p style={{
            fontSize: isMobile ? '1.125rem' : '1.375rem',
            color: '#FFD700',
            fontWeight: '700',
            lineHeight: '1.6',
            marginBottom: '1.5rem',
            filter: 'drop-shadow(0 0 15px rgba(255, 215, 0, 0.3))'
          }}>
            De vraag is simpel: Ben jij klaar om de beste versie van jezelf te worden?
          </p>
          
          <p style={{
            fontSize: isMobile ? '0.9rem' : '1.125rem',
            color: 'rgba(255, 255, 255, 0.7)',
            fontStyle: 'italic'
          }}>
            Of blijf je wachten op het 'perfecte moment' dat nooit komt?
          </p>
        </div>

        {/* 2 Keuze Boxes */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
          gap: isMobile ? '1.5rem' : '2rem',
          maxWidth: '800px',
          width: '100%',
          marginBottom: isMobile ? '3rem' : '4rem'
        }}>
          {/* JA Box */}
          <div
            onMouseEnter={() => setHoveredChoice('yes')}
            onMouseLeave={() => setHoveredChoice(null)}
            onClick={() => setShowCalendlyModal(true)}
            style={{
              background: hoveredChoice === 'yes'
                ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(212, 175, 55, 0.08) 100%)'
                : 'linear-gradient(135deg, rgba(0, 0, 0, 0.9) 0%, rgba(255, 215, 0, 0.05) 100%)',
              border: `2px solid ${hoveredChoice === 'yes' ? '#FFD700' : 'rgba(255, 215, 0, 0.3)'}`,
              borderRadius: '20px',
              padding: isMobile ? '2rem 1.5rem' : '2.5rem 2rem',
              cursor: 'pointer',
              transform: hoveredChoice === 'yes' ? 'translateY(-8px) scale(1.02)' : 'translateY(0) scale(1)',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              backdropFilter: 'blur(10px)',
              boxShadow: hoveredChoice === 'yes'
                ? '0 25px 50px rgba(255, 215, 0, 0.3), 0 0 80px rgba(255, 215, 0, 0.2)'
                : '0 10px 30px rgba(0, 0, 0, 0.5)',
              position: 'relative',
              overflow: 'hidden',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            {/* Glow effect */}
            {hoveredChoice === 'yes' && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '150%',
                height: '150%',
                background: 'radial-gradient(circle, rgba(255, 215, 0, 0.1) 0%, transparent 60%)',
                filter: 'blur(40px)',
                pointerEvents: 'none'
              }} />
            )}
            
            <h3 style={{
              fontSize: isMobile ? '1.5rem' : '2rem',
              fontWeight: '900',
              background: 'linear-gradient(135deg, #FFD700 0%, #D4AF37 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: '1rem',
              textAlign: 'center',
              position: 'relative',
              zIndex: 1
            }}>
              JA, Ik Ben Klaar
            </h3>
            
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              position: 'relative',
              zIndex: 1
            }}>
              <li style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '0.75rem',
                fontSize: isMobile ? '0.9rem' : '1rem',
                color: 'rgba(255, 255, 255, 0.9)'
              }}>
                <ArrowRight size={16} color="#FFD700" />
                Start mijn 8-weken transformatie
              </li>
              <li style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                fontSize: isMobile ? '0.9rem' : '1rem',
                color: 'rgba(255, 255, 255, 0.9)'
              }}>
                <ArrowRight size={16} color="#FFD700" />
                Ik wil mijn geld terugverdienen
              </li>
            </ul>
          </div>

          {/* NEE Box */}
          <div
            onMouseEnter={() => setHoveredChoice('no')}
            onMouseLeave={() => setHoveredChoice(null)}
            style={{
              background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.9) 0%, rgba(107, 114, 128, 0.05) 100%)',
              border: '2px solid rgba(107, 114, 128, 0.3)',
              borderRadius: '20px',
              padding: isMobile ? '2rem 1.5rem' : '2.5rem 2rem',
              cursor: 'default',
              opacity: hoveredChoice === 'yes' ? 0.5 : 1,
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
              position: 'relative'
            }}
          >
            <h3 style={{
              fontSize: isMobile ? '1.5rem' : '2rem',
              fontWeight: '900',
              color: 'rgba(107, 114, 128, 0.8)',
              marginBottom: '1rem',
              textAlign: 'center'
            }}>
              NEE, Ik Twijfel Nog
            </h3>
            
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0
            }}>
              <li style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '0.75rem',
                fontSize: isMobile ? '0.9rem' : '1rem',
                color: 'rgba(107, 114, 128, 0.7)'
              }}>
                <X size={16} color="rgba(107, 114, 128, 0.5)" />
                Blijf waar ik nu ben
              </li>
              <li style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                fontSize: isMobile ? '0.9rem' : '1rem',
                color: 'rgba(107, 114, 128, 0.7)'
              }}>
                <X size={16} color="rgba(107, 114, 128, 0.5)" />
                Misschien volgend jaar
              </li>
            </ul>
            
            <p style={{
              fontSize: isMobile ? '0.75rem' : '0.875rem',
              color: 'rgba(107, 114, 128, 0.5)',
              fontStyle: 'italic',
              textAlign: 'center',
              marginTop: '1rem'
            }}>
              Respecteer je keuze, succes!
            </p>
          </div>
        </div>

        {/* PS Bottom text */}
        <div style={{
          textAlign: 'center',
          maxWidth: '600px',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'scale(1)' : 'scale(0.95)',
          transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.6s'
        }}>
          <p style={{
            fontSize: isMobile ? '0.9rem' : '1.125rem',
            color: '#D4AF37',
            fontWeight: '600',
            fontStyle: 'italic',
            filter: 'drop-shadow(0 0 15px rgba(212, 175, 55, 0.4))'
          }}>
            P.S. Over 8 weken ben je óf getransformeerd, heb je geld terug en heb je de kennis om levenslang fit te blijven. Wat heb je te verliezen?
          </p>
        </div>

        {/* CSS Animations */}
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 0.08; }
            50% { opacity: 0.12; }
          }
          
          @keyframes fadeInUp {
            from { 
              opacity: 0;
              transform: translateY(30px);
            }
            to { 
              opacity: 1;
              transform: translateY(0);
            }
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
