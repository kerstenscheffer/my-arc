import { useState, useEffect } from 'react'
import { Shield, RefreshCw, Heart } from 'lucide-react'

export default function GuaranteeSection({ isMobile, onScrollNext, isCurrentSection }) {
  const [visibleGuarantee, setVisibleGuarantee] = useState(-1)
  const [showHeader, setShowHeader] = useState(false)
  
  useEffect(() => {
    if (!isCurrentSection) return
    
    setTimeout(() => setShowHeader(true), 300)
    
    const timers = []
    for (let i = 0; i <= 3; i++) {
      timers.push(
        setTimeout(() => setVisibleGuarantee(i), 800 + (i * 400))
      )
    }
    
    return () => timers.forEach(clearTimeout)
  }, [isCurrentSection])

  const guarantees = [
    {
      icon: Shield,
      title: "Week 4 Reality Check",
      description: "Na 4 weken geen verschil? Stop direct, krijg alles terug. Geen gezeur, geen vragen.",
      detail: "Je hoeft alleen te zeggen: 'Dit werkt niet voor mij'"
    },
    {
      icon: RefreshCw,
      title: "8 Weken Volhouden Garantie",
      description: "Heb je het 8 weken gedaan? Dan verdien je het geld. €100 korting op vervolg.",
      detail: "Beloning voor doorzetten, ook als resultaat tegenvalt"
    },
    {
      icon: Heart,
      title: "Onder De Radar Garantie",
      description: "Niemand hoeft het te weten tot jij het vertelt. Alles 100% privé.",
      detail: "Geen social media verplichtingen, geen groepsfoto's"
    }
  ]

  return (
    <section style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: isMobile ? '2rem 1rem' : '3rem 2rem',
      position: 'relative',
      background: '#000'
    }}>
      
      <div style={{
        maxWidth: '800px',
        width: '100%'
      }}>
        
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: isMobile ? '3rem' : '4rem',
          opacity: showHeader ? 1 : 0,
          transform: showHeader ? 'translateY(0)' : 'translateY(30px)',
          transition: 'all 1s ease'
        }}>
          <p style={{
            fontSize: isMobile ? '0.85rem' : '0.95rem',
            color: 'rgba(255, 255, 255, 0.4)',
            marginBottom: '1rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase'
          }}>
            Geen risico
          </p>
          
          <h2 style={{
            fontSize: isMobile ? '2rem' : '3rem',
            fontWeight: '700',
            color: '#fff',
            lineHeight: '1.2',
            marginBottom: '1rem'
          }}>
            Je Bent Beschermd
          </h2>
          
          <p style={{
            fontSize: isMobile ? '1rem' : '1.25rem',
            color: 'rgba(255, 255, 255, 0.5)',
            fontWeight: '300',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            Ik weet dat je al vaak gefaald hebt.<br />
            Daarom neem ik het risico, niet jij.
          </p>
        </div>

        {/* Guarantees */}
        <div style={{
          display: 'grid',
          gap: isMobile ? '1.5rem' : '2rem',
          marginBottom: isMobile ? '3rem' : '4rem'
        }}>
          {guarantees.map((guarantee, index) => (
            <div
              key={index}
              style={{
                opacity: visibleGuarantee >= index ? 1 : 0.1,
                transform: visibleGuarantee >= index ? 'scale(1)' : 'scale(0.95)',
                transition: 'all 0.6s ease',
                padding: isMobile ? '1.5rem' : '2rem',
                background: visibleGuarantee >= index 
                  ? 'rgba(255, 255, 255, 0.02)' 
                  : 'transparent',
                border: '1px solid',
                borderColor: visibleGuarantee >= index
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'rgba(255, 255, 255, 0.03)'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: isMobile ? '1rem' : '1.5rem'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <guarantee.icon 
                    size={24} 
                    color="rgba(255, 255, 255, 0.6)" 
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <h3 style={{
                    fontSize: isMobile ? '1.1rem' : '1.25rem',
                    fontWeight: '600',
                    color: '#fff',
                    marginBottom: '0.5rem'
                  }}>
                    {guarantee.title}
                  </h3>
                  
                  <p style={{
                    fontSize: isMobile ? '0.95rem' : '1.05rem',
                    color: 'rgba(255, 255, 255, 0.7)',
                    lineHeight: '1.5',
                    marginBottom: '0.75rem'
                  }}>
                    {guarantee.description}
                  </p>
                  
                  <p style={{
                    fontSize: isMobile ? '0.85rem' : '0.95rem',
                    color: 'rgba(255, 255, 255, 0.4)',
                    fontStyle: 'italic'
                  }}>
                    {guarantee.detail}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Risk reversal */}
        <div style={{
          padding: isMobile ? '2rem' : '2.5rem',
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, transparent 100%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          textAlign: 'center',
          opacity: visibleGuarantee >= 2 ? 1 : 0,
          transform: visibleGuarantee >= 2 ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.8s ease 0.5s'
        }}>
          <h3 style={{
            fontSize: isMobile ? '1.25rem' : '1.5rem',
            fontWeight: '600',
            color: '#fff',
            marginBottom: '1rem'
          }}>
            De Waarheid
          </h3>
          
          <p style={{
            fontSize: isMobile ? '0.95rem' : '1.1rem',
            color: 'rgba(255, 255, 255, 0.7)',
            lineHeight: '1.6',
            marginBottom: '1.5rem'
          }}>
            Ik wil alleen geld van mensen die blij zijn dat ik hun geld heb.<br />
            Zo simpel is het.
          </p>
          
          <p style={{
            fontSize: isMobile ? '0.9rem' : '1rem',
            color: 'rgba(255, 255, 255, 0.5)'
          }}>
            Ben je niet blij? Dan wil ik je geld niet.
          </p>
        </div>

        {/* FAQ style objections */}
        <div style={{
          marginTop: isMobile ? '3rem' : '4rem',
          opacity: visibleGuarantee >= 3 ? 1 : 0,
          transform: visibleGuarantee >= 3 ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.8s ease 0.8s'
        }}>
          <h3 style={{
            fontSize: isMobile ? '1.25rem' : '1.5rem',
            fontWeight: '600',
            color: '#fff',
            marginBottom: '1.5rem',
            textAlign: 'center'
          }}>
            "Ja maar..."
          </h3>

          <div style={{
            display: 'grid',
            gap: '1rem'
          }}>
            {[
              { q: "Wat als ik het niet vol kan houden?", a: "Dan stop je na 4 weken, geld terug." },
              { q: "Wat als mijn vrienden het raar vinden?", a: "Ze hoeven het niet te weten." },
              { q: "Wat als ik geen tijd heb?", a: "10 minuten per dag. Heb je wel." }
            ].map((item, i) => (
              <div key={i} style={{
                padding: '1rem',
                borderLeft: '2px solid rgba(255, 255, 255, 0.1)'
              }}>
                <p style={{
                  fontSize: isMobile ? '0.9rem' : '1rem',
                  color: 'rgba(255, 255, 255, 0.5)',
                  marginBottom: '0.5rem'
                }}>
                  {item.q}
                </p>
                <p style={{
                  fontSize: isMobile ? '0.95rem' : '1.05rem',
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontWeight: '500'
                }}>
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{
          textAlign: 'center',
          marginTop: isMobile ? '3rem' : '4rem',
          opacity: visibleGuarantee >= 3 ? 1 : 0,
          transition: 'opacity 0.8s ease 1s'
        }}>
          <p style={{
            fontSize: isMobile ? '1rem' : '1.25rem',
            color: 'rgba(255, 255, 255, 0.7)',
            marginBottom: '1.5rem'
          }}>
            Nul risico. Alleen upside.
          </p>
          
          <button
            onClick={onScrollNext}
            style={{
              background: '#fff',
              color: '#000',
              border: 'none',
              borderRadius: '0',
              padding: isMobile ? '1rem 2.5rem' : '1.25rem 3rem',
              fontSize: isMobile ? '0.9rem' : '1rem',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '44px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)'
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(255, 255, 255, 0.2)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            Start vandaag
          </button>
        </div>
      </div>
    </section>
  )
}
