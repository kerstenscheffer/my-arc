import { useState } from 'react'
import { Shield, Target, Heart, Award, Clock, Zap } from 'lucide-react'

export default function WhyPartnerSection({ isMobile, onOpenCalendly }) {
  const [hoveredReason, setHoveredReason] = useState(null)

  const reasons = [
    {
      icon: Heart,
      title: 'Echte Transformaties',
      description: 'Je helpt mensen écht fitter worden. Geen quick fixes maar duurzame verandering waar je trots op kunt zijn.'
    },
    {
      icon: Shield,
      title: '100% Betrouwbaar',
      description: 'Gegarandeerde uitbetaling, transparante voorwaarden, geen verborgen kosten. Wat je ziet is wat je krijgt.'
    },
    {
      icon: Award,
      title: 'Bewezen Systeem',
      description: '93% slagingspercentage. Jouw verwijzingen worden succesverhalen, wat weer nieuwe klanten aantrekt.'
    },
    {
      icon: Target,
      title: 'Perfecte Match',
      description: 'Jouw netwerk zoekt fitness oplossingen. Wij leveren het systeem. Samen maken we impact.'
    },
    {
      icon: Clock,
      title: 'Geen Tijdsinvestering',
      description: 'Na één onboarding call draait alles automatisch. Jij focust op verwijzen, wij doen de rest.'
    },
    {
      icon: Zap,
      title: 'Schaalbaar Inkomen',
      description: 'Geen limiet op aantal klanten. Of je nu 5 of 50 mensen verwijst, het systeem groeit met je mee.'
    }
  ]

  return (
    <section style={{
      minHeight: isMobile ? '100vh' : '90vh',
      padding: isMobile ? '3rem 1rem' : '5rem 2rem',
      position: 'relative',
      overflow: 'hidden',
      background: 'linear-gradient(180deg, #000000 0%, #0a0a0a 50%, #000000 100%)'
    }}>
      {/* Gouden mist effect - center */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '700px',
        height: '700px',
        background: 'radial-gradient(circle, rgba(255, 215, 0, 0.04) 0%, transparent 70%)',
        filter: 'blur(100px)',
        animation: 'pulse 20s ease-in-out infinite',
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
            De Waarheid
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
            Waarom MY ARC Anders Is
          </span>
          <br />
          <span style={{
            fontSize: isMobile ? '1.5rem' : '2rem',
            color: 'rgba(255, 255, 255, 0.9)',
            fontWeight: '600'
          }}>
            Dan Andere Partner Programma's
          </span>
        </h2>

        {/* Main comparison box */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(255, 215, 0, 0.02) 100%)',
          border: '1px solid rgba(255, 215, 0, 0.2)',
          borderRadius: '20px',
          padding: isMobile ? '2rem 1.5rem' : '3rem',
          marginBottom: '3rem',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), 0 0 80px rgba(255, 215, 0, 0.1)'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
            gap: '2rem'
          }}>
            {/* Other programs */}
            <div style={{
              opacity: 0.6
            }}>
              <h3 style={{
                fontSize: isMobile ? '1.1rem' : '1.3rem',
                fontWeight: '700',
                color: '#ef4444',
                marginBottom: '1rem',
                textAlign: 'center'
              }}>
                Andere Programma's ❌
              </h3>
              <ul style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}>
                {[
                  'Lage commissies (5-10%)',
                  'Maandenlang wachten op betaling',
                  'Verborgen voorwaarden',
                  'Geen support na aanmelding',
                  'Product dat niet werkt',
                  'Hoge refund rates'
                ].map((item, index) => (
                  <li key={index} style={{
                    fontSize: isMobile ? '0.85rem' : '0.95rem',
                    color: 'rgba(255, 255, 255, 0.5)',
                    textDecoration: 'line-through'
                  }}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* MY ARC */}
            <div>
              <h3 style={{
                fontSize: isMobile ? '1.1rem' : '1.3rem',
                fontWeight: '700',
                color: '#10b981',
                marginBottom: '1rem',
                textAlign: 'center'
              }}>
                MY ARC Partners ✓
              </h3>
              <ul style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}>
                {[
                  '€200 per klant (vast bedrag)',
                  'Uitbetaling binnen 30 dagen',
                  '100% transparant systeem',
                  'WhatsApp support groep',
                  '93% slagingspercentage',
                  'Tevreden klanten = meer verwijzingen'
                ].map((item, index) => (
                  <li key={index} style={{
                    fontSize: isMobile ? '0.85rem' : '0.95rem',
                    color: 'rgba(255, 255, 255, 0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.1) 100%)',
                      border: '1px solid rgba(16, 185, 129, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <div style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: '#10b981'
                      }} />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Reasons grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
          gap: isMobile ? '1rem' : '1.5rem',
          marginBottom: '3rem'
        }}>
          {reasons.map((reason, index) => (
            <div
              key={index}
              style={{
                padding: isMobile ? '1.25rem' : '1.5rem',
                background: hoveredReason === index
                  ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.06) 0%, rgba(0, 0, 0, 0.95) 100%)'
                  : 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(255, 215, 0, 0.02) 100%)',
                border: '1px solid rgba(255, 215, 0, 0.12)',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                transform: hoveredReason === index ? 'translateY(-4px)' : 'translateY(0)',
                touchAction: 'manipulation'
              }}
              onMouseEnter={() => setHoveredReason(index)}
              onMouseLeave={() => setHoveredReason(null)}
            >
              <reason.icon
                size={24}
                color="#D4AF37"
                style={{ marginBottom: '1rem' }}
              />
              <h4 style={{
                fontSize: isMobile ? '1rem' : '1.1rem',
                fontWeight: '700',
                color: '#FFD700',
                marginBottom: '0.5rem'
              }}>
                {reason.title}
              </h4>
              <p style={{
                fontSize: isMobile ? '0.85rem' : '0.9rem',
                color: 'rgba(255, 255, 255, 0.6)',
                lineHeight: '1.4'
              }}>
                {reason.description}
              </p>
            </div>
          ))}
        </div>

        {/* Trust statement */}
        <div style={{
          textAlign: 'center',
          marginBottom: '3rem',
          padding: isMobile ? '1.5rem' : '2rem',
          background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.03) 0%, transparent 100%)',
          borderRadius: '16px'
        }}>
          <p style={{
            fontSize: isMobile ? '1.1rem' : '1.3rem',
            color: 'rgba(255, 255, 255, 0.8)',
            lineHeight: '1.6',
            maxWidth: '700px',
            margin: '0 auto'
          }}>
            "We geloven in <span style={{ color: '#FFD700', fontWeight: '700' }}>langetermijn relaties</span>. 
            Jouw succes is ons succes. Daarom investeren we in jou zonder dat het je iets kost."
          </p>
          <p style={{
            marginTop: '1rem',
            fontSize: isMobile ? '0.9rem' : '1rem',
            color: 'rgba(255, 255, 255, 0.5)'
          }}>
            - Kersten, Founder MY ARC
          </p>
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
            Ja, Ik Wil Dit
          </button>
        </div>
      </div>

      {/* CSS Animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </section>
  )
}
