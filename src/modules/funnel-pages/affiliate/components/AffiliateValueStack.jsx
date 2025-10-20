import { useState } from 'react'
import { Check, Code, BarChart3, MessageCircle, GraduationCap, Zap, Users, Gift } from 'lucide-react'

export default function AffiliateValueStack({ isMobile, onOpenCalendly }) {
  const [hoveredValue, setHoveredValue] = useState(null)

  const valueItems = [
    {
      icon: Code,
      title: 'Persoonlijke Kortingscode',
      value: '20% Korting',
      description: 'Jouw unieke code voor je netwerk',
      color: '#FFD700'
    },
    {
      icon: BarChart3,
      title: 'Real-Time Dashboard',
      value: 'Live Tracking',
      description: 'Zie direct je commissies groeien',
      color: '#D4AF37'
    },
    {
      icon: MessageCircle,
      title: 'WhatsApp Support',
      value: '24/7 Hulp',
      description: 'Directe lijn met het team',
      color: '#FFD700'
    },
    {
      icon: GraduationCap,
      title: 'Partner Training',
      value: '1-op-1 Call',
      description: 'Persoonlijke onboarding',
      color: '#D4AF37'
    },
    {
      icon: Gift,
      title: 'Marketing Materialen',
      value: 'Alles Klaar',
      description: 'Posts, videos, templates',
      color: '#FFD700'
    },
    {
      icon: Zap,
      title: 'Snelle Uitbetaling',
      value: 'Direct',
      description: 'Na milestone meteen betaald',
      color: '#D4AF37'
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
      {/* Gouden mist effect - links */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '-15%',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(255, 215, 0, 0.06) 0%, transparent 70%)',
        filter: 'blur(80px)',
        animation: 'float 25s ease-in-out infinite',
        pointerEvents: 'none'
      }} />

      {/* Gouden mist effect - rechts */}
      <div style={{
        position: 'absolute',
        bottom: '20%',
        right: '-15%',
        width: '350px',
        height: '350px',
        background: 'radial-gradient(circle, rgba(212, 175, 55, 0.05) 0%, transparent 70%)',
        filter: 'blur(70px)',
        animation: 'float 20s ease-in-out infinite reverse',
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
            Wat Krijg Je Als Partner
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
            Alles Wat Je Nodig Hebt
          </span>
          <br />
          <span style={{
            fontSize: isMobile ? '1.5rem' : '2rem',
            color: 'rgba(255, 255, 255, 0.9)',
            fontWeight: '600'
          }}>
            Om Succesvol Te Zijn
          </span>
        </h2>

        {/* Value Stack Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
          gap: isMobile ? '1rem' : '1.5rem',
          marginBottom: '3rem'
        }}>
          {valueItems.map((item, index) => (
            <div
              key={index}
              style={{
                background: hoveredValue === index
                  ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.08) 0%, rgba(0, 0, 0, 0.95) 100%)'
                  : 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(255, 215, 0, 0.02) 100%)',
                border: hoveredValue === index
                  ? '1px solid rgba(255, 215, 0, 0.3)'
                  : '1px solid rgba(255, 215, 0, 0.12)',
                borderRadius: '16px',
                padding: isMobile ? '1.5rem' : '2rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                transform: hoveredValue === index ? 'translateY(-4px)' : 'translateY(0)',
                boxShadow: hoveredValue === index
                  ? '0 20px 40px rgba(0, 0, 0, 0.6), 0 0 40px rgba(255, 215, 0, 0.1)'
                  : '0 4px 20px rgba(0, 0, 0, 0.5)',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
              onMouseEnter={() => setHoveredValue(index)}
              onMouseLeave={() => setHoveredValue(null)}
            >
              {/* Icon */}
              <div style={{
                width: '60px',
                height: '60px',
                marginBottom: '1rem',
                borderRadius: '14px',
                background: `linear-gradient(135deg, ${item.color}15 0%, rgba(0, 0, 0, 0.5) 100%)`,
                border: `1px solid ${item.color}30`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `inset 0 0 20px ${item.color}10`
              }}>
                <item.icon size={28} color={item.color} />
              </div>

              {/* Content */}
              <div>
                <h3 style={{
                  fontSize: isMobile ? '1.1rem' : '1.25rem',
                  fontWeight: '700',
                  color: '#fff',
                  marginBottom: '0.5rem'
                }}>
                  {item.title}
                </h3>
                
                <div style={{
                  fontSize: isMobile ? '1.5rem' : '1.75rem',
                  fontWeight: '800',
                  background: `linear-gradient(135deg, ${item.color} 0%, ${item.color}88 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  marginBottom: '0.5rem'
                }}>
                  {item.value}
                </div>
                
                <p style={{
                  fontSize: isMobile ? '0.85rem' : '0.95rem',
                  color: 'rgba(255, 255, 255, 0.6)',
                  lineHeight: '1.4'
                }}>
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Total Value Box */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.03) 0%, rgba(0, 0, 0, 0.95) 100%)',
          border: '2px solid rgba(255, 215, 0, 0.2)',
          borderRadius: '20px',
          padding: isMobile ? '2rem' : '3rem',
          marginBottom: '3rem',
          textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), 0 0 80px rgba(255, 215, 0, 0.08)',
          backdropFilter: 'blur(20px)'
        }}>
          <div style={{
            fontSize: isMobile ? '1.1rem' : '1.3rem',
            color: 'rgba(255, 255, 255, 0.7)',
            marginBottom: '1rem'
          }}>
            Totale waarde partner pakket
          </div>
          
          <div style={{
            fontSize: isMobile ? '3rem' : '4rem',
            fontWeight: '900',
            background: 'linear-gradient(135deg, #FFD700 0%, #D4AF37 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: 'drop-shadow(0 2px 20px rgba(255, 215, 0, 0.3))',
            marginBottom: '0.5rem'
          }}>
            €2.500+
          </div>
          
          <div style={{
            fontSize: isMobile ? '1.25rem' : '1.5rem',
            fontWeight: '700',
            color: '#10b981',
            textDecoration: 'line-through',
            opacity: 0.7
          }}>
            GRATIS
          </div>
          
          <p style={{
            fontSize: isMobile ? '0.85rem' : '0.95rem',
            color: 'rgba(255, 255, 255, 0.5)',
            marginTop: '1rem',
            maxWidth: '500px',
            margin: '1rem auto 0'
          }}>
            Je krijgt alles wat je nodig hebt zonder enige investering. 
            Wij investeren in jou omdat we geloven in win-win.
          </p>
        </div>

        {/* Bullet points */}
        <div style={{
          maxWidth: '700px',
          margin: '0 auto 3rem',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
          gap: '1rem'
        }}>
          {[
            'Geen startkosten of verborgen fees',
            'Uitbetaling direct na milestones',
            'Onbeperkt aantal klanten',
            'Levenslang partner blijven'
          ].map((point, index) => (
            <div key={index} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(212, 175, 55, 0.08) 100%)',
                border: '1px solid rgba(255, 215, 0, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Check size={14} color="#FFD700" />
              </div>
              <span style={{
                fontSize: isMobile ? '0.9rem' : '1rem',
                color: 'rgba(255, 255, 255, 0.7)'
              }}>
                {point}
              </span>
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
            Claim Je Partner Pakket
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
