import { ArrowRight, Clock, Users, Shield } from 'lucide-react'

export default function CTASection({ isMobile, onNavigate }) {
  const urgencyFactors = [
    {
      icon: Clock,
      title: "Beperkte Tijd",
      description: "Deze prijs stijgt binnenkort"
    },
    {
      icon: Users,
      title: "Exclusieve Plekken",
      description: "Maar 10 nieuwe klanten per maand"
    },
    {
      icon: Shield,
      title: "Zero Risk",
      description: "30 dagen geld-terug-garantie"
    }
  ]

  return (
    <section id="section-cta" style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: isMobile ? '3rem 1rem' : '4rem 2rem',
      background: '#111',
      position: 'relative'
    }}>
      <div style={{
        maxWidth: '800px',
        width: '100%',
        textAlign: 'center'
      }}>
        {/* Main headline */}
        <h2 style={{
          fontSize: isMobile ? '2.5rem' : '3.5rem',
          fontWeight: '800',
          color: '#fff',
          lineHeight: '1.1',
          marginBottom: '1.5rem',
          letterSpacing: '-0.02em'
        }}>
          Klaar Om Te Beginnen?
        </h2>
        
        <p style={{
          fontSize: isMobile ? '1.125rem' : '1.5rem',
          color: 'rgba(255, 255, 255, 0.8)',
          lineHeight: '1.6',
          marginBottom: isMobile ? '2rem' : '3rem'
        }}>
          8 weken van nu ben je compleet getransformeerd.
          <br />Of je bent waar je nu bent.
        </p>

        {/* Urgency factors */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
          gap: isMobile ? '1rem' : '1.5rem',
          marginBottom: isMobile ? '3rem' : '4rem'
        }}>
          {urgencyFactors.map((factor, index) => (
            <div key={index} style={{
              background: 'rgba(17, 17, 17, 0.5)',
              backdropFilter: 'blur(10px)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              padding: isMobile ? '1rem' : '1.25rem',
              display: 'flex',
              flexDirection: isMobile ? 'row' : 'column',
              alignItems: 'center',
              gap: isMobile ? '1rem' : '0.75rem',
              textAlign: isMobile ? 'left' : 'center',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.border = '1px solid rgba(16, 185, 129, 0.3)'
              e.currentTarget.style.background = 'rgba(16, 185, 129, 0.05)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.1)'
              e.currentTarget.style.background = 'rgba(17, 17, 17, 0.5)'
            }}
            >
              <factor.icon size={isMobile ? 24 : 32} color="#10b981" />
              <div style={{ flex: 1 }}>
                <h4 style={{
                  fontSize: isMobile ? '0.95rem' : '1rem',
                  fontWeight: '600',
                  color: '#fff',
                  marginBottom: '0.25rem'
                }}>
                  {factor.title}
                </h4>
                <p style={{
                  fontSize: isMobile ? '0.85rem' : '0.9rem',
                  color: 'rgba(255, 255, 255, 0.6)',
                  margin: 0
                }}>
                  {factor.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Pricing */}
        <div style={{
          marginBottom: isMobile ? '3rem' : '4rem'
        }}>
          <div style={{
            display: 'inline-block',
            padding: isMobile ? '1.5rem 2rem' : '2rem 3rem',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
            borderRadius: '20px',
            border: '2px solid rgba(16, 185, 129, 0.3)',
            marginBottom: '1.5rem'
          }}>
            <p style={{
              fontSize: isMobile ? '0.9rem' : '1rem',
              color: 'rgba(255, 255, 255, 0.6)',
              marginBottom: '0.5rem',
              textTransform: 'uppercase',
              letterSpacing: '0.1em'
            }}>
              Jouw Investering
            </p>
            
            <div style={{
              fontSize: isMobile ? '3rem' : '4rem',
              fontWeight: '800',
              background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              color: '#10b981',
              marginBottom: '0.5rem'
            }}>
              €297
            </div>
            
            <p style={{
              fontSize: isMobile ? '0.85rem' : '0.95rem',
              color: 'rgba(255, 255, 255, 0.5)',
              margin: 0
            }}>
              Eenmalig. Alles inclusief. 8 weken.
            </p>
          </div>
          
          <p style={{
            fontSize: isMobile ? '0.8rem' : '0.9rem',
            color: 'rgba(255, 255, 255, 0.4)',
            fontStyle: 'italic',
            marginBottom: 0
          }}>
            (Dat is €37 per week. Minder dan je weekend uitgaven.)
          </p>
        </div>

        {/* Two choices */}
        <div style={{
          marginBottom: isMobile ? '3rem' : '4rem',
          padding: isMobile ? '1.5rem' : '2rem',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: '16px'
        }}>
          <h3 style={{
            fontSize: isMobile ? '1.25rem' : '1.5rem',
            fontWeight: '600',
            color: '#fff',
            marginBottom: '1.5rem'
          }}>
            Je hebt 2 opties
          </h3>
          
          <div style={{
            display: 'grid',
            gap: '1rem',
            textAlign: 'left'
          }}>
            <div style={{
              display: 'flex',
              gap: '0.75rem',
              alignItems: 'flex-start'
            }}>
              <span style={{
                color: 'rgba(255, 255, 255, 0.3)',
                fontWeight: '600',
                fontSize: isMobile ? '1.1rem' : '1.2rem'
              }}>1.</span>
              <p style={{
                fontSize: isMobile ? '0.95rem' : '1.05rem',
                color: 'rgba(255, 255, 255, 0.6)',
                lineHeight: '1.5',
                margin: 0
              }}>
                Blijf doen wat je deed. Blijf krijgen wat je kreeg.
              </p>
            </div>
            
            <div style={{
              display: 'flex',
              gap: '0.75rem',
              alignItems: 'flex-start'
            }}>
              <span style={{
                color: '#10b981',
                fontWeight: '600',
                fontSize: isMobile ? '1.1rem' : '1.2rem'
              }}>2.</span>
              <p style={{
                fontSize: isMobile ? '0.95rem' : '1.05rem',
                color: 'rgba(255, 255, 255, 0.9)',
                lineHeight: '1.5',
                fontWeight: '500',
                margin: 0
              }}>
                Neem verantwoordelijkheid. Start vandaag. Verander je leven.
              </p>
            </div>
          </div>
        </div>

        {/* Main CTA */}
        <div style={{ marginBottom: isMobile ? '3rem' : '4rem' }}>
          <button
            onClick={() => onNavigate('/my-arc')}
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: isMobile ? '16px' : '20px',
              padding: isMobile ? '1.25rem 3rem' : '1.5rem 4rem',
              fontSize: isMobile ? '1.125rem' : '1.375rem',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '1rem',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '56px',
              boxShadow: '0 15px 35px rgba(16, 185, 129, 0.3)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px) scale(1.05)'
              e.currentTarget.style.boxShadow = '0 20px 45px rgba(16, 185, 129, 0.4)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)'
              e.currentTarget.style.boxShadow = '0 15px 35px rgba(16, 185, 129, 0.3)'
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
          >
            <span>Start Jouw Transformatie</span>
            <ArrowRight size={24} />
          </button>
          
          <p style={{
            fontSize: isMobile ? '0.75rem' : '0.85rem',
            color: 'rgba(255, 255, 255, 0.4)',
            marginTop: '1rem',
            margin: '1rem 0 0 0'
          }}>
            Directe toegang na aanmelding • 30 dagen geld terug garantie
          </p>
        </div>

        {/* Final reminder */}
        <div style={{
          paddingTop: isMobile ? '2rem' : '3rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          <p style={{
            fontSize: isMobile ? '0.9rem' : '1rem',
            color: 'rgba(255, 255, 255, 0.5)',
            fontStyle: 'italic',
            lineHeight: '1.6',
            margin: 0
          }}>
            "De beste tijd om te beginnen was gisteren.
            <br />
            De tweede beste tijd is nu."
          </p>
        </div>
      </div>
    </section>
  )
}
