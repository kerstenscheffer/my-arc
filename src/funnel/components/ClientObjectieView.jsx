// src/funnel/components/ClientObjectieView.jsx
// Client-facing view tijdens objectie handling
// EXACT COPY van ClientWelcomeSection + 2-Opties Diagnose (ZONDER "Wat Nu")
import { useState, useEffect } from 'react'
import { 
  CheckCircle,
  Smartphone,
  Utensils,
  Dumbbell,
  TrendingUp,
  Phone,
  Zap,
  AlertCircle,
  Target,
  X
} from 'lucide-react'

export default function ClientObjectieView({ isMobile: propIsMobile }) {
  const [isMobile, setIsMobile] = useState(propIsMobile || window.innerWidth <= 768)
  const [selectedCard, setSelectedCard] = useState(null)
  const [hoveredCard, setHoveredCard] = useState(null)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Mini value stack (exact copy from ClientWelcome)
  const features = [
    {
      icon: Smartphone,
      title: 'Persoonlijke App',
      description: 'Complete programma in app',
      image: 'https://i.ibb.co/8Lxh2G3J/13.png'
    },
    {
      icon: Utensils,
      title: 'Dagelijkse Maaltijden',
      description: 'Weet precies wat te eten',
      image: 'https://i.ibb.co/fVBpKfsJ/7.png'
    },
    {
      icon: Dumbbell,
      title: 'Custom Workouts',
      description: 'Training op maat',
      image: 'https://i.ibb.co/6Rmd50GW/5.png'
    },
    {
      icon: TrendingUp,
      title: 'Progress Tracking',
      description: 'Groei in real-time',
      image: 'https://i.ibb.co/dd3bKQX/4.png'
    },
    {
      icon: Phone,
      title: 'Wekelijkse Calls',
      description: 'Persoonlijke begeleiding',
      image: 'https://i.ibb.co/3y8zGSYt/9.png'
    },
    {
      icon: Zap,
      title: '24/7 Support',
      description: 'Altijd bereikbaar',
      image: 'https://i.ibb.co/Rp4fGwVq/10.png'
    }
  ]

  return (
    <section 
      id="client-objectie-view"
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #000 0%, #0a0a0a 100%)',
        padding: isMobile ? '2.5rem 1rem' : '3.5rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Background glow */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(255, 186, 9, 0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      <div style={{
        maxWidth: '1200px',
        width: '100%',
        position: 'relative',
        zIndex: 1
      }}>
        {/* HEADER - Decision focused */}
        <div style={{
          textAlign: 'center',
          marginBottom: isMobile ? '2.5rem' : '3rem',
          maxWidth: '800px',
          margin: '0 auto'
        }}>
          {/* Quote badge */}
          <div style={{
            display: 'inline-block',
            padding: isMobile ? '0.5rem 1rem' : '0.625rem 1.25rem',
            background: 'linear-gradient(135deg, rgba(255, 186, 9, 0.12) 0%, rgba(212, 160, 6, 0.06) 100%)',
            border: '1px solid rgba(255, 186, 9, 0.3)',
            borderRadius: '100px',
            marginBottom: '1.5rem'
          }}>
            <p style={{
              fontSize: isMobile ? '0.8rem' : '0.875rem',
              color: 'rgba(255, 255, 255, 0.6)',
              margin: 0,
              fontStyle: 'italic',
              fontWeight: '500'
            }}>
              Beslissingen kosten geen tijd, maar informatie
            </p>
          </div>

          <h2 style={{
            fontSize: isMobile ? '1.75rem' : '2.5rem',
            fontWeight: '900',
            background: 'linear-gradient(135deg, #ffba09 0%, #d4a006 35%, #8b6804 65%, #402400 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '1rem',
            lineHeight: 1.2,
            letterSpacing: '-0.02em'
          }}>
            Tot Een Beslissing Komen
          </h2>

          <p style={{
            fontSize: isMobile ? '1rem' : '1.15rem',
            color: 'rgba(255, 255, 255, 0.7)',
            lineHeight: 1.6,
            fontWeight: '500',
            marginBottom: 0
          }}>
            Het gaat niet om ja of nee - het gaat erom dat je <strong style={{ color: '#ffba09' }}>verder kunt</strong> na deze call
          </p>
        </div>

        {/* 1. 2-OPTIES DIAGNOSE EERST (MOVED UP) */}
        <div style={{
          marginBottom: isMobile ? '2.5rem' : '3rem',
          marginTop: isMobile ? '2rem' : '2.5rem' // EXTRA SPACING FROM HEADER
        }}>
          {/* 2 Options Card */}
          <div style={{
            maxWidth: '700px',
            margin: '0 auto'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.8) 0%, rgba(23, 23, 23, 0.6) 100%)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 186, 9, 0.3)',
              borderRadius: isMobile ? '14px' : '16px',
              padding: isMobile ? '1.5rem 1.25rem' : '1.75rem 1.5rem',
              boxShadow: '0 4px 16px rgba(255, 186, 9, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.03)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Top accent line */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '2px',
                background: 'linear-gradient(90deg, #ffba09 0%, #d4a006 100%)',
                opacity: 0.6,
                zIndex: 2
              }} />

              {/* Shine overlay */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '40%',
                background: 'linear-gradient(180deg, rgba(255, 186, 9, 0.04) 0%, transparent 100%)',
                pointerEvents: 'none',
                zIndex: 1
              }} />

              <div style={{ position: 'relative', zIndex: 2 }}>
                {/* Title - LEFT ALIGNED */}
                <h4 style={{
                  fontSize: isMobile ? '1.05rem' : '1.2rem',
                  fontWeight: '700',
                  textAlign: 'left',
                  color: 'rgba(255, 255, 255, 0.8)',
                  marginBottom: isMobile ? '1rem' : '1.25rem',
                  lineHeight: 1.4
                }}>
                  Als je twijfelt, ligt het meestal aan één van deze twee dingen:
                </h4>

                {/* 2 Options - CLEAN GOLD, NO COLORS */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  marginBottom: 0
                }}>
                  {/* Optie 1 - CLEAN GOLD */}
                  <div 
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: isMobile ? '0.75rem' : '0.875rem 1rem',
                      background: 'linear-gradient(135deg, rgba(255, 186, 9, 0.12) 0%, rgba(255, 186, 9, 0.06) 100%)',
                      border: '1px solid rgba(255, 186, 9, 0.3)',
                      borderRadius: '10px',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255, 186, 9, 0.5)'
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 186, 9, 0.18) 0%, rgba(255, 186, 9, 0.08) 100%)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255, 186, 9, 0.3)'
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 186, 9, 0.12) 0%, rgba(255, 186, 9, 0.06) 100%)'
                    }}
                  >
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: 'rgba(255, 186, 9, 0.18)',
                      border: '1px solid rgba(255, 186, 9, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <AlertCircle size={16} color="#ffba09" strokeWidth={2.5} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: isMobile ? '0.9rem' : '1rem',
                        fontWeight: '700',
                        color: '#ffba09',
                        marginBottom: '0.125rem'
                      }}>
                        1. Product Twijfel
                      </div>
                      <div style={{
                        fontSize: isMobile ? '0.75rem' : '0.8rem',
                        color: 'rgba(255, 255, 255, 0.6)',
                        lineHeight: 1.4
                      }}>
                        Je denkt dat het niet voor jou zou werken (om een of andere reden)
                      </div>
                    </div>
                  </div>

                  {/* Optie 2 - CLEAN GOLD */}
                  <div 
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: isMobile ? '0.75rem' : '0.875rem 1rem',
                      background: 'linear-gradient(135deg, rgba(255, 186, 9, 0.12) 0%, rgba(255, 186, 9, 0.06) 100%)',
                      border: '1px solid rgba(255, 186, 9, 0.3)',
                      borderRadius: '10px',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255, 186, 9, 0.5)'
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 186, 9, 0.18) 0%, rgba(255, 186, 9, 0.08) 100%)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255, 186, 9, 0.3)'
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 186, 9, 0.12) 0%, rgba(255, 186, 9, 0.06) 100%)'
                    }}
                  >
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: 'rgba(255, 186, 9, 0.18)',
                      border: '1px solid rgba(255, 186, 9, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Target size={16} color="#ffba09" strokeWidth={2.5} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: isMobile ? '0.9rem' : '1rem',
                        fontWeight: '700',
                        color: '#ffba09',
                        marginBottom: '0.125rem'
                      }}>
                        2. Prijs Bezwaar
                      </div>
                      <div style={{
                        fontSize: isMobile ? '0.75rem' : '0.8rem',
                        color: 'rgba(255, 255, 255, 0.6)',
                        lineHeight: 1.4
                      }}>
                        Er is iets aan de prijs waar je het niet mee eens bent
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. FUTURE VISION - TONED DOWN (achtergrond) */}
        <div style={{
          textAlign: 'center',
          marginBottom: isMobile ? '2rem' : '2.5rem',
          opacity: 0.5 // Ghosted effect
        }}>
          <h3 style={{
            fontSize: isMobile ? '1.25rem' : '1.5rem', // Smaller
            fontWeight: '600', // Less bold
            color: 'rgba(255, 255, 255, 0.4)', // Subtle gray
            marginBottom: isMobile ? '1.25rem' : '1.5rem',
            letterSpacing: '-0.01em'
          }}>
            Als Je Start, Over 6 Maanden...
          </h3>

          {/* Bullet points - 2 COLUMN GRID - GRAY */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
            gap: isMobile ? '1rem' : '1.25rem',
            maxWidth: '900px',
            margin: '0 auto'
          }}>
            {[
              'Heb Jij 5-8 Kilo Spier Droog Opgebouwd',
              'Ben Jij Zichtbaar Getransformeerd',
              'Heb Jij De Kennis Om Verder Te Bouwen',
              'Ben Jij Sterker En Fitter Dan Ooit',
              'Heb Jij Meer Zelfvertrouwen & Discipline',
              'Ben Jij Enorm Blij Met Deze Keuze'
            ].map((point, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: isMobile ? '0.75rem' : '1rem',
                  textAlign: 'left'
                }}
              >
                <CheckCircle 
                  size={isMobile ? 22 : 24} // Slightly smaller
                  color="rgba(255, 255, 255, 0.3)" // Gray instead of gold
                  strokeWidth={2}
                  style={{
                    flexShrink: 0,
                    filter: 'none' // No glow
                  }}
                />
                <span style={{
                  fontSize: isMobile ? '0.95rem' : '1.1rem', // Smaller
                  fontWeight: '600', // Less bold
                  color: 'rgba(255, 255, 255, 0.4)', // Gray text
                  lineHeight: 1.3,
                  letterSpacing: '-0.01em'
                }}>
                  {point}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 3. MINI VALUE STACK - TONED DOWN (achtergrond) */}
        <div style={{
          marginBottom: isMobile ? '2rem' : '2.5rem',
          opacity: 0.5 // Ghosted effect
        }}>
          <h3 style={{
            fontSize: isMobile ? '1.25rem' : '1.5rem', // Smaller
            fontWeight: '600', // Less bold
            textAlign: 'center',
            color: 'rgba(255, 255, 255, 0.4)', // Subtle gray
            marginBottom: isMobile ? '1.25rem' : '1.5rem',
            letterSpacing: '-0.01em'
          }}>
            In Jouw Programma
          </h3>

          {/* Features grid - SUPER COMPACT */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: isMobile ? '0.75rem' : '1rem'
          }}>
            {features.map((feature, index) => {
              const Icon = feature.icon
              const isHovered = hoveredCard === index
              
              return (
                <div
                  key={index}
                  onMouseEnter={() => setHoveredCard(index)}
                  onMouseLeave={() => setHoveredCard(null)}
                  onClick={() => setSelectedCard(feature)}
                  style={{
                    background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.8) 0%, rgba(23, 23, 23, 0.6) 100%)',
                    backdropFilter: 'blur(12px)',
                    border: `1px solid ${isHovered ? 'rgba(255, 186, 9, 0.3)' : 'rgba(255, 186, 9, 0.15)'}`,
                    borderRadius: isMobile ? '10px' : '12px',
                    position: 'relative',
                    cursor: 'pointer',
                    transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: isHovered 
                      ? '0 8px 24px rgba(255, 186, 9, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)' 
                      : '0 4px 16px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.03)',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent',
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'stretch',
                    overflow: 'hidden',
                    minHeight: isMobile ? 'auto' : '80px'
                  }}
                >
                  {/* Top accent line */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '2px',
                    background: 'linear-gradient(90deg, #ffba09 0%, #d4a006 100%)',
                    opacity: 0.6,
                    zIndex: 3
                  }} />

                  {/* Shine overlay */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '40%',
                    background: 'linear-gradient(180deg, rgba(255, 186, 9, 0.04) 0%, transparent 100%)',
                    pointerEvents: 'none',
                    zIndex: 1
                  }} />

                  {/* Image - COMPACT */}
                  <div style={{
                    width: isMobile ? '60px' : '70px',
                    flexShrink: 0,
                    overflow: 'hidden',
                    position: 'relative',
                    zIndex: 2,
                    borderRadius: isMobile ? '10px 0 0 10px' : '12px 0 0 12px'
                  }}>
                    <img 
                      src={feature.image}
                      alt={feature.title}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                        filter: isHovered ? 'brightness(1.1)' : 'brightness(1)',
                        transition: 'filter 0.3s ease'
                      }}
                    />
                  </div>

                  {/* Content - SUPER COMPACT */}
                  <div style={{
                    flex: 1,
                    padding: isMobile ? '0.75rem' : '0.875rem 1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    gap: '0.25rem',
                    position: 'relative',
                    zIndex: 2
                  }}>
                    {/* Icon + Title - HORIZONTAL */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}>
                      <Icon 
                        size={isMobile ? 14 : 16} 
                        color="#ffba09"
                        strokeWidth={2.5}
                        style={{
                          filter: 'drop-shadow(0 0 4px rgba(255, 186, 9, 0.4))',
                          flexShrink: 0
                        }}
                      />
                      <h4 style={{
                        fontSize: isMobile ? '0.8rem' : '0.875rem',
                        fontWeight: '700',
                        color: '#fff',
                        margin: 0,
                        lineHeight: 1.2
                      }}>
                        {feature.title}
                      </h4>
                    </div>

                    <p style={{
                      fontSize: isMobile ? '0.7rem' : '0.75rem',
                      color: 'rgba(255, 255, 255, 0.5)',
                      lineHeight: 1.3,
                      margin: 0
                    }}>
                      {feature.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

      </div>

      {/* Modal (EXACT COPY) */}
      {selectedCard && (
        <div
          onClick={() => setSelectedCard(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.9)',
            backdropFilter: 'blur(20px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: isMobile ? '1rem' : '2rem',
            animation: 'fadeIn 0.3s ease'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '600px',
              width: '100%',
              background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.95) 0%, rgba(23, 23, 23, 0.9) 100%)',
              backdropFilter: 'blur(30px)',
              border: '2px solid rgba(255, 186, 9, 0.4)',
              borderRadius: '20px',
              padding: isMobile ? '2rem 1.5rem' : '2.5rem 2rem',
              position: 'relative',
              boxShadow: '0 30px 80px rgba(0, 0, 0, 0.9), 0 0 100px rgba(255, 186, 9, 0.2)',
              overflow: 'hidden'
            }}
          >
            {/* Top accent */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '3px',
              background: 'linear-gradient(90deg, #ffba09 0%, #d4a006 100%)',
              opacity: 0.8
            }} />

            {/* Close button */}
            <button
              onClick={() => setSelectedCard(null)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(255, 186, 9, 0.15)',
                border: '1px solid rgba(255, 186, 9, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#ffba09',
                touchAction: 'manipulation'
              }}
            >
              <X size={20} strokeWidth={2.5} />
            </button>

            <h3 style={{
              fontSize: isMobile ? '1.3rem' : '1.5rem',
              fontWeight: '800',
              background: 'linear-gradient(135deg, #ffba09 0%, #d4a006 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '1rem',
              paddingRight: '3rem'
            }}>
              {selectedCard.title}
            </h3>

            <p style={{
              fontSize: isMobile ? '0.95rem' : '1.05rem',
              color: 'rgba(255, 255, 255, 0.8)',
              lineHeight: '1.7',
              margin: 0
            }}>
              {selectedCard.description}
            </p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </section>
  )
}
