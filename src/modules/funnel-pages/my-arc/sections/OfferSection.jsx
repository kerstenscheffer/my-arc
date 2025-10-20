import { useState, useEffect } from 'react'
import { Check, Phone,  User, Calendar, MessageCircle, Target, Video, FileText, Users } from 'lucide-react'

export default function OfferSection({ isMobile, onScrollNext, isCurrentSection }) {
  const [visibleItem, setVisibleItem] = useState(-1)
  const [showHeader, setShowHeader] = useState(false)
  
  useEffect(() => {
    if (!isCurrentSection) return
    
    setTimeout(() => setShowHeader(true), 300)
    
    const timers = []
    for (let i = 0; i <= 7; i++) {
      timers.push(
        setTimeout(() => setVisibleItem(i), 800 + (i * 200))
      )
    }
    
    return () => timers.forEach(clearTimeout)
  }, [isCurrentSection])

  const offers = [
    {
      icon: User,
      title: "1-op-1 Begeleiding",
      description: "Geen groepsgedoe. Jij en ik.",
      value: "€497",
      highlight: true
    },
    {
      icon: Calendar,
      title: "8 Weken Persoonlijk Plan",
      description: "Aangepast op jouw leven, niet andersom",
      value: "€297"
    },
    {
      icon: MessageCircle,
      title: "24/7 Persoonlijke Support",
      description: "Zoom of Whatsapp. Wat voor jou werkt.",
      value: "€197"
    },
    {
      icon: Target,
      title: "Workout Schema",
      description: "Thuis of Gym. Wat voor jou werkt",
      value: "€97"
    },
    {
      icon: FileText,
      title: "Voedings Plan",
      description: "Schema of Richlijnen. Wat voor jou werkt",
      value: "€97"
    },
    {
      icon: Phone,
      title: "MY ARC APP",
      description: "Persoonlijke progressie dashboard en tracking tools",
      value: "€97"
    },
    {
      icon: Users,
      title: "MY ARC LID",
      description: "Toegang tot evenementen, video's, groepsapp en meer",
      value: "€147"
    }
  ]

  const totalValue = offers.reduce((sum, offer) => {
    const value = parseInt(offer.value.replace('€', ''))
    return sum + value
  }, 0)

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
        maxWidth: '900px',
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
            Het systeem
          </p>
          
          <h2 style={{
            fontSize: isMobile ? '2rem' : '3rem',
            fontWeight: '700',
            color: '#fff',
            lineHeight: '1.2',
            marginBottom: '0.5rem'
          }}>
            Wat Je Krijgt
          </h2>
          
          <p style={{
            fontSize: isMobile ? '1rem' : '1.25rem',
            color: 'rgba(255, 255, 255, 0.5)',
            fontWeight: '300'
          }}>
            Alles wat je nodig hebt. Zonder bullshit.
          </p>
        </div>

        {/* Offer items */}
        <div style={{
          display: 'grid',
          gap: isMobile ? '1rem' : '1.25rem',
          marginBottom: isMobile ? '3rem' : '4rem'
        }}>
          {offers.map((offer, index) => (
            <div
              key={index}
              style={{
                opacity: visibleItem >= index ? 1 : 0.1,
                transform: visibleItem >= index ? 'translateX(0)' : 'translateX(-20px)',
                transition: 'all 0.5s ease',
                padding: isMobile ? '1.25rem' : '1.5rem',
                background: offer.highlight && visibleItem >= index
                  ? 'rgba(255, 255, 255, 0.03)'
                  : 'transparent',
                border: '1px solid',
                borderColor: visibleItem >= index
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'rgba(255, 255, 255, 0.03)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: isMobile ? '1rem' : '1.5rem'
              }}
            >
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <offer.icon 
                  size={20} 
                  color="rgba(255, 255, 255, 0.5)" 
                />
              </div>

              <div style={{ flex: 1 }}>
                <h3 style={{
                  fontSize: isMobile ? '1rem' : '1.125rem',
                  fontWeight: '600',
                  color: visibleItem >= index ? '#fff' : 'rgba(255, 255, 255, 0.5)',
                  marginBottom: '0.25rem'
                }}>
                  {offer.title}
                </h3>
                <p style={{
                  fontSize: isMobile ? '0.85rem' : '0.95rem',
                  color: 'rgba(255, 255, 255, 0.5)',
                  lineHeight: '1.4'
                }}>
                  {offer.description}
                </p>
              </div>

              <div style={{
                fontSize: isMobile ? '0.9rem' : '1rem',
                fontWeight: '600',
                color: 'rgba(255, 255, 255, 0.3)',
                textDecoration: visibleItem >= index ? 'line-through' : 'none'
              }}>
                {offer.value}
              </div>
            </div>
          ))}
        </div>

        {/* Total value */}
        <div style={{
          padding: isMobile ? '2rem' : '2.5rem',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          textAlign: 'center',
          opacity: visibleItem >= 6 ? 1 : 0,
          transform: visibleItem >= 6 ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.8s ease'
        }}>
          <p style={{
            fontSize: isMobile ? '0.9rem' : '1rem',
            color: 'rgba(255, 255, 255, 0.5)',
            marginBottom: '0.5rem'
          }}>
            Totale waarde
          </p>
          
          <div style={{
            fontSize: isMobile ? '2.5rem' : '3.5rem',
            fontWeight: '800',
            color: 'rgba(255, 255, 255, 0.3)',
            textDecoration: 'line-through',
            marginBottom: '1rem'
          }}>
            €{totalValue}
          </div>

          <p style={{
            fontSize: isMobile ? '1rem' : '1.25rem',
            color: 'rgba(255, 255, 255, 0.7)',
            marginBottom: '1.5rem'
          }}>
            Maar niet voor jou...
          </p>

          {/* Actual price tease */}
          <div style={{
            paddingTop: '1.5rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.05)'
          }}>
            <p style={{
              fontSize: isMobile ? '1.25rem' : '1.5rem',
              fontWeight: '600',
              color: '#fff'
            }}>
              Jouw investering?
            </p>
            
            <p style={{
              fontSize: isMobile ? '0.9rem' : '1rem',
              color: 'rgba(255, 255, 255, 0.4)',
              marginTop: '0.5rem'
            }}>
              Minder dan je denkt...
            </p>
          </div>
        </div>

        {/* Unique selling points */}
        <div style={{
          marginTop: isMobile ? '3rem' : '4rem',
          marginBottom: isMobile ? '3rem' : '4rem',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
          gap: isMobile ? '1.5rem' : '2rem',
          opacity: visibleItem >= 7 ? 1 : 0,
          transform: visibleItem >= 7 ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.8s ease 0.5s'
        }}>
          {[
            "Geen excusses meer",
            "Precies weten wat je moet doen", 
            "100% onder de radar"
          ].map((point, i) => (
            <div key={i} style={{
              textAlign: 'center',
              padding: isMobile ? '1rem' : '1.25rem',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              <Check 
                size={24} 
                color="rgba(255, 255, 255, 0.4)"
                style={{ marginBottom: '0.5rem' }}
              />
              <p style={{
                fontSize: isMobile ? '0.9rem' : '1rem',
                color: 'rgba(255, 255, 255, 0.7)',
                fontWeight: '500'
              }}>
                {point}
              </p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{
          textAlign: 'center',
          opacity: visibleItem >= 7 ? 1 : 0,
          transition: 'opacity 0.8s ease 0.8s'
        }}>
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
            Bekijk de garanties
          </button>
        </div>
      </div>
    </section>
  )
}
