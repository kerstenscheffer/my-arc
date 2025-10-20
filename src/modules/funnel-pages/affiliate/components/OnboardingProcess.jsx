import { useState } from 'react'
import { Phone, Code, BookOpen, Rocket, CheckCircle, ArrowRight } from 'lucide-react'

export default function OnboardingProcess({ isMobile, onOpenCalendly }) {
  const [activeStep, setActiveStep] = useState(0)

  const steps = [
    {
      icon: Phone,
      title: 'Partner Call',
      time: '15 minuten',
      description: 'Kennismaking, uitleg systeem, en al je vragen beantwoord',
      details: [
        'Persoonlijke onboarding',
        'Uitleg commissiestructuur',
        'Marketing tips delen',
        'Vragen beantwoorden'
      ]
    },
    {
      icon: Code,
      title: 'Jouw Code',
      time: 'Direct na call',
      description: 'Je krijgt je persoonlijke 20% kortingscode',
      details: [
        'Unieke trackingcode',
        'Dashboard toegang',
        'Marketing templates',
        'WhatsApp groep invite'
      ]
    },
    {
      icon: BookOpen,
      title: 'Start Verwijzen',
      time: 'Dag 1',
      description: 'Begin met het delen van MY ARC met je netwerk',
      details: [
        'Social media posts',
        'Persoonlijke gesprekken',
        'Email templates gebruiken',
        'Success stories delen'
      ]
    },
    {
      icon: Rocket,
      title: 'Eerste Commissie',
      time: 'Binnen 30 dagen',
      description: 'Gemiddeld eerste €100 binnen een maand',
      details: [
        'Real-time tracking',
        'Automatische uitbetaling',
        'Support bij vragen',
        'Celebrate success!'
      ]
    }
  ]

  const ActiveIcon = steps[activeStep].icon

  return (
    <section style={{
      minHeight: isMobile ? '100vh' : '90vh',
      padding: isMobile ? '3rem 1rem' : '5rem 2rem',
      position: 'relative',
      overflow: 'hidden',
      background: 'linear-gradient(180deg, #000000 0%, #0a0a0a 50%, #000000 100%)'
    }}>
      {/* Gouden mist effect */}
      <div style={{
        position: 'absolute',
        top: '30%',
        left: '-10%',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(255, 215, 0, 0.05) 0%, transparent 70%)',
        filter: 'blur(80px)',
        animation: 'float 25s ease-in-out infinite',
        pointerEvents: 'none'
      }} />

      {/* Content container */}
      <div style={{
        maxWidth: '1100px',
        margin: '0 auto',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Section label */}
        <div style={{
          textAlign: 'center',
          marginBottom: isMobile ? '1rem' : '1.5rem'
        }}>
          <span style={{
            fontSize: isMobile ? '0.8rem' : '0.9rem',
            color: 'rgba(212, 175, 55, 0.7)',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            fontWeight: '600',
            textShadow: '0 0 20px rgba(255, 215, 0, 0.3)'
          }}>
            Simpel & Snel
          </span>
        </div>

        {/* Title */}
        <h2 style={{
          fontSize: isMobile ? '2rem' : '3rem',
          fontWeight: '800',
          textAlign: 'center',
          marginBottom: isMobile ? '1rem' : '1.5rem',
          lineHeight: '1.1'
        }}>
          <span style={{
            background: 'linear-gradient(135deg, #FFD700 0%, #D4AF37 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: 'drop-shadow(0 0 30px rgba(255, 215, 0, 0.3))'
          }}>
            Van Aanmelding Tot Commissie
          </span>
          <br />
          <span style={{
            fontSize: isMobile ? '1.5rem' : '2rem',
            color: 'rgba(255, 255, 255, 0.9)',
            fontWeight: '600'
          }}>
            In 4 Simpele Stappen
          </span>
        </h2>

        {/* Steps Timeline */}
        <div style={{
          position: 'relative',
          marginBottom: '3rem'
        }}>
          {/* Connection line */}
          {!isMobile && (
            <div style={{
              position: 'absolute',
              top: '40px',
              left: '10%',
              right: '10%',
              height: '2px',
              background: 'linear-gradient(90deg, #FFD700 0%, #D4AF37 100%)',
              opacity: 0.3,
              zIndex: 0
            }} />
          )}

          {/* Steps */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
            gap: isMobile ? '1.5rem' : '1rem',
            position: 'relative',
            zIndex: 1
          }}>
            {steps.map((step, index) => {
              const StepIcon = step.icon
              return (
                <div
                  key={index}
                  style={{
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    transform: activeStep === index ? 'scale(1.02)' : 'scale(1)',
                    touchAction: 'manipulation'
                  }}
                  onClick={() => setActiveStep(index)}
                >
                  {/* Step number & icon */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    marginBottom: '1rem'
                  }}>
                    <div style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      background: activeStep === index
                        ? 'linear-gradient(135deg, #FFD700 0%, #D4AF37 100%)'
                        : 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(255, 215, 0, 0.05) 100%)',
                      border: activeStep === index
                        ? '2px solid #FFD700'
                        : '2px solid rgba(255, 215, 0, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '1rem',
                      boxShadow: activeStep === index
                        ? '0 0 30px rgba(255, 215, 0, 0.3)'
                        : '0 4px 20px rgba(0, 0, 0, 0.5)',
                      position: 'relative'
                    }}>
                      <StepIcon 
                        size={32} 
                        color={activeStep === index ? '#000' : '#D4AF37'}
                      />
                      
                      {/* Step number badge */}
                      <div style={{
                        position: 'absolute',
                        top: '-5px',
                        right: '-5px',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: activeStep === index ? '#fff' : '#FFD700',
                        color: '#000',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: '800',
                        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)'
                      }}>
                        {index + 1}
                      </div>
                    </div>

                    {/* Title & time */}
                    <h3 style={{
                      fontSize: isMobile ? '1.1rem' : '1.2rem',
                      fontWeight: '700',
                      color: activeStep === index ? '#FFD700' : '#fff',
                      marginBottom: '0.25rem',
                      textAlign: 'center'
                    }}>
                      {step.title}
                    </h3>
                    <span style={{
                      fontSize: isMobile ? '0.75rem' : '0.85rem',
                      color: 'rgba(255, 215, 0, 0.6)',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      {step.time}
                    </span>
                  </div>

                  {/* Description */}
                  <p style={{
                    fontSize: isMobile ? '0.85rem' : '0.9rem',
                    color: 'rgba(255, 255, 255, 0.6)',
                    textAlign: 'center',
                    lineHeight: '1.4',
                    minHeight: isMobile ? 'auto' : '60px'
                  }}>
                    {step.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Active step details */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(255, 215, 0, 0.02) 100%)',
          border: '1px solid rgba(255, 215, 0, 0.2)',
          borderRadius: '20px',
          padding: isMobile ? '2rem 1.5rem' : '2.5rem',
          marginBottom: '3rem',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), 0 0 80px rgba(255, 215, 0, 0.08)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(212, 175, 55, 0.05) 100%)',
              border: '1px solid rgba(255, 215, 0, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ActiveIcon size={24} color="#FFD700" />
            </div>
            <div>
              <h3 style={{
                fontSize: isMobile ? '1.25rem' : '1.5rem',
                fontWeight: '700',
                color: '#FFD700',
                marginBottom: '0.25rem'
              }}>
                Stap {activeStep + 1}: {steps[activeStep].title}
              </h3>
              <span style={{
                fontSize: isMobile ? '0.85rem' : '0.95rem',
                color: 'rgba(255, 255, 255, 0.5)'
              }}>
                {steps[activeStep].time}
              </span>
            </div>
          </div>

          {/* Details list */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
            gap: '1rem'
          }}>
            {steps[activeStep].details.map((detail, index) => (
              <div key={index} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <CheckCircle size={16} color="#10b981" />
                <span style={{
                  fontSize: isMobile ? '0.9rem' : '1rem',
                  color: 'rgba(255, 255, 255, 0.7)'
                }}>
                  {detail}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick facts */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
          gap: '1rem',
          marginBottom: '3rem'
        }}>
          {[
            { value: '15 min', label: 'Onboarding call' },
            { value: '24u', label: 'Support response' },
            { value: '30 dagen', label: 'Eerste commissie' }
          ].map((fact, index) => (
            <div key={index} style={{
              padding: '1rem',
              background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.9) 0%, rgba(255, 215, 0, 0.02) 100%)',
              border: '1px solid rgba(255, 215, 0, 0.1)',
              borderRadius: '12px',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: isMobile ? '1.5rem' : '1.75rem',
                fontWeight: '800',
                color: '#FFD700',
                marginBottom: '0.25rem'
              }}>
                {fact.value}
              </div>
              <div style={{
                fontSize: isMobile ? '0.75rem' : '0.85rem',
                color: 'rgba(255, 255, 255, 0.5)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                {fact.label}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={onOpenCalendly}
            style={{
              background: 'linear-gradient(135deg, #FFD700 0%, #D4AF37 100%)',
              border: 'none',
              borderRadius: '16px',
              padding: isMobile ? '1.25rem 2.5rem' : '1.5rem 3.5rem',
              fontSize: isMobile ? '1.125rem' : '1.25rem',
              fontWeight: '700',
              color: '#000',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 8px 30px rgba(255, 215, 0, 0.3)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 12px 40px rgba(255, 215, 0, 0.4)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 8px 30px rgba(255, 215, 0, 0.3)'
            }}
          >
            Start Nu Met Stap 1
            <ArrowRight size={20} />
          </button>
        </div>
      </div>

      {/* CSS Animation */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-30px); }
        }
      `}</style>
    </section>
  )
}
