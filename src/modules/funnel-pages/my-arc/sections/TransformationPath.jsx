import { useState, useEffect } from 'react'
import { Check, ArrowRight, User, Users, Award, Target } from 'lucide-react'

export default function TransformationPath({ isMobile, onScrollNext, isCurrentSection }) {
  const [visibleWeek, setVisibleWeek] = useState(-1)
  const [showHeader, setShowHeader] = useState(false)
  
  useEffect(() => {
    if (!isCurrentSection) return
    
    setTimeout(() => setShowHeader(true), 300)
    
    const timers = []
    for (let i = 0; i <= 4; i++) {
      timers.push(
        setTimeout(() => setVisibleWeek(i), 1000 + (i * 500))
      )
    }
    
    return () => timers.forEach(clearTimeout)
  }, [isCurrentSection])

  const weeks = [
    {
      week: "Week 1-2",
      title: "Structuur & Basis",
      icon: User,
      changes: [
        "We bouwen structuur en discipline in stilte",
        "Je voelt fysiek al sterker, meer energie",
        "Die stem in je hoofd die zegt 'je kan dit niet' wordt zachter"
      ],
      result: "Je voelt voor het eerst in tijden: vooruitgang",
    },
    {
      week: "Week 3-4", 
      title: "Innerlijke Zekerheid",
      icon: Target,
      changes: [
        "Je houdt oogcontact langer vast in gesprekken",
        "Vrienden merken op: 'Je lijkt rustiger'", 
        "Die constante behoefte om jezelf te bewijzen verdwijnt"
      ],
      result: "Je draagt jezelf zekerder rondom anderen",
    },
    {
      week: "Week 5-6",
      title: "Sociale Kracht", 
      icon: Users,
      changes: [
        "Je neemt ruimte in gesprekken, stelt grenzen",
        "Collega's behandelen je anders - met meer respect",
        "Die innerlijke kritische stem? Bijna stil"
      ],
      result: "Je voelt je comfortabel in je eigen vel",
    },
    {
      week: "Week 7-8",
      title: "Nieuwe Standaard",
      icon: Award,
      changes: [
        "Vrienden vragen: 'Wat is er veranderd aan je?'",
        "Je straalt rust en controle uit zonder moeite", 
        "Die persoon die altijd twijfelde? Die is er niet meer"
      ],
      result: "Van iemand die zich verstopt naar iemand die ruimte inneemt",
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
        maxWidth: '1000px',
        width: '100%'
      }}>
        
        {/* Bridge from Neusbloeder */}
        <div style={{
          textAlign: 'center',
          marginBottom: isMobile ? '3rem' : '4rem',
          opacity: showHeader ? 1 : 0,
          transform: showHeader ? 'translateY(0)' : 'translateY(30px)',
          transition: 'all 1s ease'
        }}>
          <p style={{
            fontSize: isMobile ? '1.1rem' : '1.3rem',
            color: 'rgba(255, 255, 255, 0.6)',
            marginBottom: '1.5rem',
            fontWeight: '300'
          }}>
            Je kunt blijven neusbloeden...<br />
            <span style={{ color: '#fff', fontWeight: '500' }}>Of je kunt dit pad kiezen.</span>
          </p>
          
          <h2 style={{
            fontSize: isMobile ? '2rem' : '3rem',
            fontWeight: '800',
            color: '#fff',
            lineHeight: '1.2',
            marginBottom: '0.5rem',
            letterSpacing: '-0.02em'
          }}>
            8 Weken Van Binnen Naar Buiten
          </h2>
          
          <p style={{
            fontSize: isMobile ? '1rem' : '1.25rem',
            color: 'rgba(255, 255, 255, 0.5)',
            fontWeight: '300'
          }}>
            Hoe je jezelf draagt, bepaalt hoe anderen je zien.
          </p>
        </div>

        {/* Week progression with smaller visuals */}
        <div style={{
          display: 'grid',
          gap: isMobile ? '2rem' : '2.5rem'
        }}>
          {weeks.map((week, index) => (
            <div
              key={index}
              style={{
                opacity: visibleWeek >= index ? 1 : 0.2,
                transform: visibleWeek >= index ? 'translateY(0)' : 'translateY(30px)',
                transition: 'all 0.8s ease',
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                gap: isMobile ? '1rem' : '2rem',
                alignItems: isMobile ? 'center' : 'flex-start',
                padding: isMobile ? '1.5rem' : '2rem',
                background: visibleWeek >= index 
                  ? 'rgba(255, 255, 255, 0.02)' 
                  : 'transparent',
                borderLeft: '2px solid',
                borderColor: visibleWeek >= index 
                  ? 'rgba(255, 255, 255, 0.2)' 
                  : 'rgba(255, 255, 255, 0.05)'
              }}
            >
              
              {/* Smaller Visual Side */}
              <div style={{
                flex: '0 0 auto',
                width: isMobile ? '80px' : '100px',
                order: 1
              }}>
                <div style={{
                  position: 'relative',
                  aspectRatio: '1/1',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  
                  {/* Icon */}
                  <week.icon 
                    size={isMobile ? 24 : 28} 
                    color={`rgba(255, 255, 255, ${0.4 + (index * 0.1)})`}
                  />

                  {/* Progress Ring - Smaller */}
                  {visibleWeek >= index && (
                    <svg style={{
                      position: 'absolute',
                      inset: 0,
                      transform: 'rotate(-90deg)'
                    }} width="100%" height="100%">
                      <circle
                        cx="50%"
                        cy="50%"
                        r="45%"
                        fill="none"
                        stroke="rgba(255, 255, 255, 0.1)"
                        strokeWidth="1"
                      />
                      <circle
                        cx="50%"
                        cy="50%"
                        r="45%"
                        fill="none"
                        stroke="rgba(255, 255, 255, 0.4)"
                        strokeWidth="1"
                        strokeDasharray="220"
                        strokeDashoffset="0"
                        style={{
                          animation: `drawCircle 1.5s ease-out forwards`,
                          animationDelay: `${index * 0.5}s`
                        }}
                      />
                    </svg>
                  )}

                  {/* Week Number - Smaller */}
                  <div style={{
                    position: 'absolute',
                    bottom: '-8px',
                    right: '-8px',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: '#fff',
                    color: '#000',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.7rem',
                    fontWeight: '800',
                    opacity: visibleWeek >= index ? 1 : 0,
                    transition: 'opacity 0.5s ease'
                  }}>
                    {index + 1}
                  </div>
                </div>
              </div>

              {/* Content Side - More Prominent */}
              <div style={{
                flex: 1,
                textAlign: isMobile ? 'center' : 'left',
                order: 2
              }}>
                
                <div style={{
                  marginBottom: '1rem'
                }}>
                  <span style={{
                    fontSize: isMobile ? '0.75rem' : '0.85rem',
                    color: 'rgba(255, 255, 255, 0.4)',
                    fontWeight: '500',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase'
                  }}>
                    {week.week}
                  </span>
                  <h3 style={{
                    fontSize: isMobile ? '1.4rem' : '1.6rem',
                    fontWeight: '700',
                    color: visibleWeek >= index ? '#fff' : 'rgba(255, 255, 255, 0.5)',
                    marginTop: '0.25rem',
                    marginBottom: '1rem'
                  }}>
                    {week.title}
                  </h3>
                </div>

                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  marginBottom: '1.5rem'
                }}>
                  {week.changes.map((change, i) => (
                    <div 
                      key={i}
                      style={{
                        fontSize: isMobile ? '0.95rem' : '1.05rem',
                        color: 'rgba(255, 255, 255, 0.7)',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.75rem',
                        opacity: visibleWeek >= index ? 1 : 0.5,
                        transform: visibleWeek >= index ? 'translateX(0)' : 'translateX(-10px)',
                        transition: `all 0.6s ease ${(i * 0.1)}s`
                      }}
                    >
                      <ArrowRight size={14} color="rgba(255, 255, 255, 0.4)" style={{
                        flexShrink: 0,
                        marginTop: '4px'
                      }} />
                      <span>{change}</span>
                    </div>
                  ))}
                </div>

                <div style={{
                  padding: '1rem 0',
                  borderTop: '1px solid rgba(255, 255, 255, 0.05)'
                }}>
                  <p style={{
                    fontSize: isMobile ? '1.05rem' : '1.15rem',
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontWeight: '500',
                    fontStyle: 'italic'
                  }}>
                    {week.result}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Final result */}
        <div style={{
          marginTop: isMobile ? '4rem' : '5rem',
          padding: isMobile ? '3rem 2rem' : '4rem 3rem',
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          textAlign: 'center',
          opacity: visibleWeek >= 3 ? 1 : 0,
          transform: visibleWeek >= 3 ? 'translateY(0)' : 'translateY(30px)',
          transition: 'all 1s ease 0.5s'
        }}>
          
          <div style={{
            width: isMobile ? '60px' : '70px',
            height: isMobile ? '60px' : '70px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
            border: '2px solid rgba(255, 255, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 2rem auto'
          }}>
            <Award size={isMobile ? 28 : 32} color="rgba(255, 255, 255, 0.6)" />
          </div>
          
          <h3 style={{
            fontSize: isMobile ? '1.75rem' : '2.25rem',
            fontWeight: '800',
            color: '#fff',
            marginBottom: '1rem',
            letterSpacing: '-0.01em'
          }}>
            Week 8: De Nieuwe Jij
          </h3>
          
          <p style={{
            fontSize: isMobile ? '1.1rem' : '1.25rem',
            color: 'rgba(255, 255, 255, 0.8)',
            marginBottom: '2rem',
            lineHeight: '1.5',
            maxWidth: '600px',
            margin: '0 auto 2rem auto'
          }}>
            Die stem die altijd zei "je bent niet goed genoeg" is weg.<br />
            <span style={{ color: '#fff', fontWeight: '500' }}>Je neemt ruimte in. Mensen voelen het verschil.</span>
          </p>
          
          <div style={{
            width: '60px',
            height: '1px',
            background: 'rgba(255, 255, 255, 0.2)',
            margin: '2rem auto'
          }} />

          <p style={{
            fontSize: isMobile ? '0.9rem' : '1rem',
            color: 'rgba(255, 255, 255, 0.5)',
            fontStyle: 'italic',
            maxWidth: '500px',
            margin: '0 auto'
          }}>
            Van iemand die neusbloedde naar iemand die handelt.<br />
            Van onzeker naar iemand die weet wat hij waard is.
          </p>
        </div>

        {/* CTA */}
        <div style={{
          textAlign: 'center',
          marginTop: isMobile ? '3rem' : '4rem',
          opacity: visibleWeek >= 3 ? 1 : 0,
          transition: 'opacity 0.8s ease 1s'
        }}>
          <button
            onClick={onScrollNext}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              padding: isMobile ? '1rem 2.5rem' : '1.25rem 3rem',
              fontSize: isMobile ? '0.9rem' : '1rem',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.9)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '44px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.6)'
              e.currentTarget.style.color = '#fff'
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)'
              e.currentTarget.style.background = 'transparent'
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
            Zie het echte bewijs
          </button>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes drawCircle {
          from {
            stroke-dashoffset: 220;
          }
          to {
            stroke-dashoffset: 55;
          }
        }
      `}</style>
    </section>
  )
}
