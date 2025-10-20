import { useState, useEffect } from 'react'
import { ArrowRight, Frown, Lightbulb, Target } from 'lucide-react'

export default function CaseStudySection({ isMobile }) {
  const [visibleElements, setVisibleElements] = useState(0)

  // Slow reveal elements
  useEffect(() => {
    const timers = []
    for (let i = 0; i <= 4; i++) {
      timers.push(
        setTimeout(() => {
          setVisibleElements(i)
        }, i * 800)
      )
    }

    return () => timers.forEach(clearTimeout)
  }, [])

  const timeline = [
    {
      icon: Frown,
      title: "FRUSTRATIE",
      subtitle: "Elke crash dieet faalt",
      description: "Zelfvertrouwen naar nul",
      color: "#ef4444"
    },
    {
      icon: Lightbulb,
      title: "DOORBRAAK", 
      subtitle: "Personaliseerde begeleiding",
      description: "Houdbare gewoontes",
      color: "#f59e0b"
    },
    {
      icon: Target,
      title: "RESULTAAT",
      subtitle: "5.1kg kwijt in 4 weken",
      description: "Energie en vertrouwen terug",
      color: "#10b981"
    }
  ]

  return (
    <section style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: isMobile ? '4rem 1rem' : '5rem 2rem',
      background: '#111',
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
        maxWidth: '1000px',
        width: '100%',
        textAlign: 'center'
      }}>
        
        {/* Section Header */}
        <div style={{
          marginBottom: isMobile ? '2.5rem' : '3rem',
          opacity: visibleElements >= 0 ? 1 : 0,
          transform: visibleElements >= 0 ? 'translateY(0)' : 'translateY(30px)',
          transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          <h2 style={{
            fontSize: isMobile ? '1.8rem' : '2.75rem',
            fontWeight: '700',
            color: '#fff',
            lineHeight: '1.2',
            marginBottom: isMobile ? '2rem' : '2.5rem',
            letterSpacing: '-0.02em'
          }}>
            Eindelijk succes! Na veel mislukte pogingen 5.1 kg kwijt in 4 weken
          </h2>

          {/* Zoom Call Photo - Breder */}
          <div style={{
            maxWidth: isMobile ? '340px' : '500px',
            margin: '0 auto',
            borderRadius: '20px',
            overflow: 'hidden',
            border: '2px solid rgba(16, 185, 129, 0.2)',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4)'
          }}>
            <img
              src="https://cdn.shopify.com/s/files/1/0862/1237/8954/files/Jouw_alineatekst.png?v=1758815193"
              alt="Zoom call met Kersten en cliënt"
              style={{
                width: '100%',
                height: 'auto',
                display: 'block'
              }}
            />
          </div>
          
          <p style={{
            fontSize: isMobile ? '0.9rem' : '1rem',
            color: 'rgba(255, 255, 255, 0.6)',
            lineHeight: '1.5',
            marginTop: '1.25rem'
          }}>
            Echte begeleiding, echte resultaten
          </p>
        </div>

        {/* Main Testimonial Quote */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(59, 130, 246, 0.03) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.15)',
          borderRadius: '20px',
          padding: isMobile ? '1.75rem' : '2.75rem',
          position: 'relative',
          marginBottom: isMobile ? '3rem' : '4rem',
          opacity: visibleElements >= 1 ? 1 : 0,
          transform: visibleElements >= 1 ? 'translateY(0)' : 'translateY(30px)',
          transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1)',
          transitionDelay: '0.2s'
        }}>
          {/* Quote marks */}
          <div style={{
            fontSize: isMobile ? '2.75rem' : '4rem',
            color: 'rgba(16, 185, 129, 0.2)',
            position: 'absolute',
            top: isMobile ? '0.25rem' : '0.5rem',
            left: isMobile ? '0.75rem' : '1rem',
            lineHeight: 1,
            fontFamily: 'Georgia, serif'
          }}>
            "
          </div>

          <blockquote style={{
            fontSize: isMobile ? '1rem' : '1.2rem',
            color: 'rgba(255, 255, 255, 0.9)',
            lineHeight: '1.6',
            fontStyle: 'italic',
            margin: '0 0 1.5rem 0',
            paddingLeft: isMobile ? '1.75rem' : '3rem',
            paddingRight: isMobile ? '0.75rem' : '1.75rem'
          }}>
            Met Kersten's energie en enthousiasme is het mij gelukt een routine te creëren. 
            Iedere week zie ik progressie in de My Arc app. Niet alleen fysiek, 
            ook mentaal heeft Kersten mij goed geholpen.
          </blockquote>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.8) 0%, rgba(59, 130, 246, 0.8) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.1rem',
              fontWeight: '700',
              color: '#fff'
            }}>
              M
            </div>
            <div style={{ textAlign: 'left' }}>
              <p style={{
                fontSize: isMobile ? '0.9rem' : '1rem',
                fontWeight: '600',
                color: '#fff',
                margin: 0
              }}>
                MY ARC Cliënt
              </p>
              <p style={{
                fontSize: isMobile ? '0.8rem' : '0.85rem',
                color: 'rgba(255, 255, 255, 0.6)',
                margin: 0
              }}>
                Geverifieerde review
              </p>
            </div>
          </div>
        </div>

        {/* Emotional Journey Timeline */}
        {isMobile ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            marginBottom: '3rem',
            opacity: visibleElements >= 2 ? 1 : 0,
            transform: visibleElements >= 2 ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1)',
            transitionDelay: '0.4s'
          }}>
            {timeline.map((step, index) => {
              const Icon = step.icon
              return (
                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.6rem',
                    minWidth: '80px'
                  }}>
                    {/* Icon */}
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, ${step.color}20, ${step.color}10)`,
                      border: `2px solid ${step.color}50`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: `0 4px 12px ${step.color}25`
                    }}>
                      <Icon size={22} color={step.color} />
                    </div>
                    
                    {/* Text */}
                    <div style={{ textAlign: 'center' }}>
                      <p style={{
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        color: step.color,
                        marginBottom: '0.25rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>
                        {step.title}
                      </p>
                      <p style={{
                        fontSize: '0.7rem',
                        color: '#fff',
                        lineHeight: '1.2',
                        marginBottom: '0.15rem',
                        fontWeight: '600'
                      }}>
                        {step.subtitle}
                      </p>
                      <p style={{
                        fontSize: '0.65rem',
                        color: 'rgba(255, 255, 255, 0.6)',
                        lineHeight: '1.2'
                      }}>
                        {step.description}
                      </p>
                    </div>
                  </div>

                  {/* Arrow */}
                  {index < timeline.length - 1 && (
                    <ArrowRight size={14} color="rgba(255, 255, 255, 0.3)" />
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          /* Desktop: Enhanced Card Timeline */
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '2.5rem',
            marginBottom: '4rem'
          }}>
            {timeline.map((step, index) => {
              const Icon = step.icon
              return (
                <div
                  key={index}
                  style={{
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '20px',
                    padding: '2rem 1.5rem',
                    position: 'relative',
                    opacity: visibleElements >= index + 2 ? 1 : 0,
                    transform: visibleElements >= index + 2 ? 'translateY(0)' : 'translateY(30px)',
                    transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1)',
                    transitionDelay: `${(index + 2) * 0.2}s`,
                    textAlign: 'center',
                    backdropFilter: 'blur(5px)'
                  }}
                >
                  {/* Icon */}
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${step.color}20, ${step.color}10)`,
                    border: `2px solid ${step.color}50`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1.25rem',
                    boxShadow: `0 6px 20px ${step.color}25`
                  }}>
                    <Icon size={28} color={step.color} />
                  </div>

                  {/* Content */}
                  <h3 style={{
                    fontSize: '1rem',
                    fontWeight: '700',
                    color: step.color,
                    marginBottom: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    {step.title}
                  </h3>

                  <p style={{
                    fontSize: '1.1rem',
                    color: '#fff',
                    lineHeight: '1.4',
                    marginBottom: '0.5rem',
                    fontWeight: '600'
                  }}>
                    {step.subtitle}
                  </p>

                  <p style={{
                    fontSize: '0.9rem',
                    color: 'rgba(255, 255, 255, 0.7)',
                    lineHeight: '1.4'
                  }}>
                    {step.description}
                  </p>

                  {/* Arrow for desktop */}
                  {index < timeline.length - 1 && (
                    <div style={{
                      position: 'absolute',
                      right: '-1.25rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      opacity: 0.5
                    }}>
                      <ArrowRight size={24} color="rgba(16, 185, 129, 0.6)" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Bottom CTA */}
        <div style={{
          opacity: visibleElements >= 4 ? 1 : 0,
          transform: visibleElements >= 4 ? 'translateY(0)' : 'translateY(30px)',
          transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1)',
          transitionDelay: '0.8s'
        }}>
          <p style={{
            fontSize: isMobile ? '1rem' : '1.1rem',
            color: 'rgba(255, 255, 255, 0.8)',
            textAlign: 'center',
            lineHeight: '1.5',
            fontWeight: '500'
          }}>
            Klaar om jouw eigen succesverhaal te schrijven?
          </p>
        </div>
      </div>
    </section>
  )
}
