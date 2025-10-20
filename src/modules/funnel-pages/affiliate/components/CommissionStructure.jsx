import { useState } from 'react'
import { Euro, CheckCircle, TrendingUp, Calendar, Shield, AlertCircle } from 'lucide-react'

export default function CommissionStructure({ isMobile, onOpenCalendly }) {
  const [hoveredStep, setHoveredStep] = useState(null)

  return (
    <section style={{
      minHeight: isMobile ? '100vh' : '90vh',
      padding: isMobile ? '3rem 1rem' : '5rem 2rem',
      position: 'relative',
      overflow: 'hidden',
      background: 'linear-gradient(180deg, #000000 0%, #0a0a0a 50%, #000000 100%)'
    }}>
      {/* Gouden mist effect - top */}
      <div style={{
        position: 'absolute',
        top: '-20%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '120%',
        height: '400px',
        background: 'radial-gradient(ellipse at center, rgba(255, 215, 0, 0.06) 0%, transparent 70%)',
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
            Transparant & Eerlijk
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
            Zo Verdien Je €200
          </span>
          <br />
          <span style={{
            fontSize: isMobile ? '1.5rem' : '2rem',
            color: 'rgba(255, 255, 255, 0.9)',
            fontWeight: '600'
          }}>
            Per Succesvolle Klant
          </span>
        </h2>

        {/* Visual Timeline */}
        <div style={{
          position: 'relative',
          maxWidth: '800px',
          margin: '0 auto',
          marginBottom: isMobile ? '3rem' : '4rem',
          padding: isMobile ? '2rem 0' : '3rem 0'
        }}>
          {/* Connection line */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: isMobile ? '50%' : '10%',
            right: isMobile ? '50%' : '10%',
            height: isMobile ? '100%' : '2px',
            width: isMobile ? '2px' : 'calc(80% - 0px)',
            background: 'linear-gradient(90deg, rgba(255, 215, 0, 0.3) 0%, rgba(212, 175, 55, 0.3) 100%)',
            transform: isMobile ? 'translateX(-50%)' : 'translateY(-50%)'
          }} />

          {/* Timeline steps */}
          <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between',
            alignItems: isMobile ? 'center' : 'flex-start',
            gap: isMobile ? '3rem' : '2rem',
            position: 'relative'
          }}>
            {[
              {
                day: 'Dag 0',
                title: 'Start',
                description: 'Klant meldt zich aan met jouw code',
                amount: null,
                icon: CheckCircle,
                color: '#10b981'
              },
              {
                day: 'Dag 28',
                title: '€100',
                description: 'Eerste betaling na proefperiode',
                amount: '€100',
                icon: Euro,
                color: '#FFD700'
              },
              {
                day: 'Maand 2',
                title: '+€100',
                description: 'Bonus na tweede maand',
                amount: '€100',
                icon: TrendingUp,
                color: '#FFD700'
              }
            ].map((step, index) => (
              <div
                key={index}
                style={{
                  flex: 1,
                  textAlign: 'center',
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={() => setHoveredStep(index)}
                onMouseLeave={() => setHoveredStep(null)}
              >
                {/* Step circle */}
                <div style={{
                  width: isMobile ? '80px' : '100px',
                  height: isMobile ? '80px' : '100px',
                  margin: '0 auto',
                  marginBottom: '1rem',
                  borderRadius: '50%',
                  background: hoveredStep === index
                    ? `linear-gradient(135deg, ${step.color} 0%, ${step.color}88 100%)`
                    : 'linear-gradient(135deg, rgba(0, 0, 0, 0.9) 0%, rgba(255, 215, 0, 0.05) 100%)',
                  border: `2px solid ${hoveredStep === index ? step.color : 'rgba(255, 215, 0, 0.2)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: hoveredStep === index
                    ? `0 0 40px ${step.color}55, inset 0 0 20px ${step.color}22`
                    : '0 4px 20px rgba(0, 0, 0, 0.5), inset 0 0 20px rgba(255, 215, 0, 0.05)',
                  transform: hoveredStep === index ? 'scale(1.1)' : 'scale(1)',
                  transition: 'all 0.3s ease'
                }}>
                  <step.icon 
                    size={isMobile ? 32 : 40} 
                    color={hoveredStep === index ? '#000' : step.color}
                  />
                </div>

                {/* Step content */}
                <div style={{
                  padding: '0 0.5rem'
                }}>
                  <div style={{
                    fontSize: isMobile ? '0.75rem' : '0.85rem',
                    color: 'rgba(212, 175, 55, 0.6)',
                    marginBottom: '0.25rem',
                    fontWeight: '600',
                    letterSpacing: '0.1em'
                  }}>
                    {step.day}
                  </div>
                  
                  <div style={{
                    fontSize: isMobile ? '1.5rem' : '2rem',
                    fontWeight: '800',
                    color: step.amount ? '#FFD700' : '#fff',
                    marginBottom: '0.5rem',
                    filter: step.amount ? 'drop-shadow(0 0 20px rgba(255, 215, 0, 0.3))' : 'none'
                  }}>
                    {step.title}
                  </div>
                  
                  <div style={{
                    fontSize: isMobile ? '0.8rem' : '0.9rem',
                    color: 'rgba(255, 255, 255, 0.6)',
                    lineHeight: '1.4',
                    maxWidth: '200px',
                    margin: '0 auto'
                  }}>
                    {step.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Important conditions */}
        <div style={{
          maxWidth: '900px',
          margin: '0 auto',
          marginBottom: isMobile ? '3rem' : '4rem',
          padding: isMobile ? '1.5rem' : '2rem',
          background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.03) 0%, rgba(0, 0, 0, 0.9) 100%)',
          border: '1px solid rgba(255, 215, 0, 0.15)',
          borderRadius: '16px',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '1rem'
          }}>
            <Shield size={24} color="#FFD700" />
            <h3 style={{
              fontSize: isMobile ? '1.1rem' : '1.3rem',
              fontWeight: '700',
              color: '#FFD700'
            }}>
              100% Transparant Systeem
            </h3>
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
            gap: '1rem'
          }}>
            {[
              '✓ Jouw unieke kortingscode (20% voor klanten)',
              '✓ Real-time tracking in dashboard',
              '✓ Automatische uitbetaling na milestones',
              '✓ WhatsApp support voor vragen',
              '⚠️ Geen commissie bij refund binnen 28 dagen',
              '⚠️ Klant moet actief blijven voor uitbetaling'
            ].map((item, index) => (
              <div key={index} style={{
                fontSize: isMobile ? '0.85rem' : '0.95rem',
                color: item.includes('⚠️') ? 'rgba(255, 184, 0, 0.8)' : 'rgba(255, 255, 255, 0.7)',
                display: 'flex',
                alignItems: 'flex-start',
                lineHeight: '1.5'
              }}>
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Example calculation */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
          gap: isMobile ? '1rem' : '1.5rem',
          maxWidth: '900px',
          margin: '0 auto',
          marginBottom: isMobile ? '2.5rem' : '3.5rem'
        }}>
          {[
            { clients: 5, monthly: '€500', yearly: '€6.000' },
            { clients: 10, monthly: '€1.000', yearly: '€12.000' },
            { clients: 20, monthly: '€2.000', yearly: '€24.000' }
          ].map((calc, index) => (
            <div key={index} style={{
              padding: isMobile ? '1.25rem' : '1.5rem',
              background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.9) 0%, rgba(255, 215, 0, 0.02) 100%)',
              border: '1px solid rgba(255, 215, 0, 0.12)',
              borderRadius: '12px',
              textAlign: 'center',
              transition: 'all 0.3s ease',
              cursor: 'default',
              touchAction: 'manipulation'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.border = '1px solid rgba(255, 215, 0, 0.25)'
              e.currentTarget.style.transform = 'translateY(-4px)'
              e.currentTarget.style.boxShadow = '0 12px 30px rgba(0, 0, 0, 0.6), 0 0 40px rgba(255, 215, 0, 0.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.border = '1px solid rgba(255, 215, 0, 0.12)'
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
            }}
            >
              <div style={{
                fontSize: isMobile ? '2rem' : '2.5rem',
                fontWeight: '800',
                background: 'linear-gradient(135deg, #FFD700 0%, #D4AF37 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                marginBottom: '0.5rem'
              }}>
                {calc.clients}
              </div>
              <div style={{
                fontSize: isMobile ? '0.75rem' : '0.85rem',
                color: 'rgba(255, 255, 255, 0.5)',
                marginBottom: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.1em'
              }}>
                Klanten
              </div>
              <div style={{
                fontSize: isMobile ? '1.1rem' : '1.25rem',
                fontWeight: '700',
                color: '#FFD700',
                marginBottom: '0.25rem'
              }}>
                {calc.monthly}/maand
              </div>
              <div style={{
                fontSize: isMobile ? '0.8rem' : '0.9rem',
                color: 'rgba(255, 255, 255, 0.4)'
              }}>
                {calc.yearly}/jaar
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
            Start Als Partner
          </button>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(-50%); }
          50% { transform: translateY(-30px) translateX(-50%); }
        }
      `}</style>
    </section>
  )
}
