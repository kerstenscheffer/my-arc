// SalesPage.jsx - MY ARC CLEAN GOLD/GRIJS EDITION
// Light background, white cards, gold accents, normale scroll
import { useState, useEffect } from 'react'
import { 
  Trophy, Target, AlertCircle, Settings, MessageCircle, 
  Dumbbell, Utensils, Shield, CheckCircle,
  Users, Moon, Pill
} from 'lucide-react'

export default function SalesPage() {
  const [showContent, setShowContent] = useState(false)
  const isMobile = window.innerWidth <= 768

  useEffect(() => {
    setTimeout(() => setShowContent(true), 100)
  }, [])

  const colors = {
    bgLight: '#f8fafc',
    bgGrey: '#e5e7eb',
    white: '#ffffff',
    gold: '#D4AF37',
    goldLight: '#FFD700',
    textDark: '#1f2937',
    textGrey: '#64748b',
    red: '#ef4444'
  }

  const dreamBenefits = [
    'Zelverzekerder bij je vrienden, familie en onbekenden',
    'Prestaties op werk/school gaan vooruit',
    'Meer energie om dingen te doen',
    'Je neemt je eigen leven in handen'
  ]

  const painPoints = [
    '\'s Avonds wakker, doom scrollen',
    'Niet tevreden over fysiek',
    'Dingen geprobeerd, Niet vol kunnen houden',
    'Lage energie, onderpresteren'
  ]

  const systemPillars = [
    { icon: MessageCircle, title: '24/7 Coach via WhatsApp' },
    { icon: Dumbbell, title: 'Persoonlijk Workout Systeem' },
    { icon: Utensils, title: 'Persoonlijk Meal Systeem' },
    { icon: Users, title: 'Wekelijkse Check-ins + Community' },
    { icon: Pill, title: 'Supplement Protocol' },
    { icon: Moon, title: 'Slaap Optimalisatie' }
  ]

  const testimonials = [
    { name: 'Jan', quote: '10kg erbij, voel me Superman' },
    { name: 'Mark', quote: 'Eindelijk consistent, zie resultaat elke week' },
    { name: 'Tom', quote: 'Beste investering ooit, relaties beter, werk beter' }
  ]

  const guarantees = [
    { title: '14 dagen geld terug garantie', description: 'Niet tevreden? Volledige terugbetaling.' },
    { title: 'We werken door tot 10kg bereikt is', description: 'Doel niet gehaald? We gaan door.' }
  ]

  const scenarios = [
    { num: '1', title: 'Niks doen', sub: 'Over 6 maanden nog steeds hetzelfde' },
    { num: '2', title: 'Zelf proberen (weer)', sub: 'Je weet hoe dat eindigt' },
    { num: '3', title: 'Dit programma starten', sub: '10kg spier - Gegarandeerd', highlight: true }
  ]

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(180deg, ${colors.bgLight} 0%, ${colors.bgGrey} 100%)`,
      opacity: showContent ? 1 : 0,
      transition: 'opacity 0.5s ease'
    }}>
      {/* Top accent */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '4px',
        background: `linear-gradient(90deg, ${colors.gold} 0%, ${colors.goldLight} 50%, ${colors.gold} 100%)`,
        zIndex: 100
      }} />

      <div style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: isMobile ? '2.5rem 1.25rem' : '3.5rem 2rem'
      }}>
        
        {/* SECTION 1: HERO */}
        <div style={{
          textAlign: 'center',
          marginBottom: isMobile ? '3rem' : '4rem'
        }}>
          <Trophy 
            size={isMobile ? 48 : 56} 
            color={colors.gold}
            strokeWidth={2}
            style={{ marginBottom: '1.5rem' }}
          />

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            marginBottom: '1.5rem'
          }}>
            <span style={{
              background: `linear-gradient(135deg, ${colors.white} 0%, rgba(212, 175, 55, 0.05) 100%)`,
              border: `1px solid rgba(212, 175, 55, 0.3)`,
              borderRadius: '100px',
              padding: isMobile ? '0.5rem 1.25rem' : '0.625rem 1.5rem',
              fontSize: isMobile ? '0.8rem' : '0.9rem',
              fontWeight: '700',
              color: colors.gold,
              letterSpacing: '0.05em',
              textTransform: 'uppercase'
            }}>
              Wat ik lever
            </span>
          </div>

          <h1 style={{
            fontSize: isMobile ? '3.5rem' : '5.5rem',
            fontWeight: '900',
            lineHeight: 0.95,
            marginBottom: '1rem',
            letterSpacing: '-0.03em'
          }}>
            <span style={{
              display: 'block',
              background: `linear-gradient(135deg, ${colors.goldLight} 0%, ${colors.gold} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              10KG SPIER
            </span>
          </h1>

          <h2 style={{
            fontSize: isMobile ? '2.25rem' : '3rem',
            fontWeight: '800',
            color: colors.textDark,
            marginBottom: '0.5rem',
            letterSpacing: '-0.02em'
          }}>
            6 MAANDEN
          </h2>

          <p style={{
            fontSize: isMobile ? '1.125rem' : '1.25rem',
            color: colors.gold,
            fontWeight: '600',
            letterSpacing: '0.05em',
            textTransform: 'uppercase'
          }}>
          </p>
        </div>

        {/* SECTION 2: DREAM STATE */}
        <div style={{
          marginBottom: isMobile ? '3rem' : '4rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            marginBottom: isMobile ? '1.5rem' : '2rem'
          }}>
            <Target 
              size={isMobile ? 28 : 32} 
              color={colors.gold}
              strokeWidth={2}
            />
            <h2 style={{
              fontSize: isMobile ? '1.5rem' : '1.75rem',
              fontWeight: '800',
              color: colors.textDark,
              margin: 0
            }}>
              Wat je zult bereiken
            </h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
            gap: isMobile ? '0.875rem' : '1rem'
          }}>
            {dreamBenefits.map((benefit, index) => (
              <div
                key={index}
                style={{
                  padding: isMobile ? '1.25rem' : '1.5rem',
                  background: colors.white,
                  border: `1px solid rgba(212, 175, 55, 0.2)`,
                  borderRadius: '14px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem'
                }}
              >
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: colors.gold,
                  flexShrink: 0
                }} />
                <p style={{
                  fontSize: isMobile ? '0.95rem' : '1.05rem',
                  color: colors.textDark,
                  fontWeight: '600',
                  margin: 0,
                  textAlign: 'left'
                }}>
                  {benefit}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 3: PAIN */}
        <div style={{
          marginBottom: isMobile ? '3rem' : '4rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            marginBottom: isMobile ? '1.5rem' : '2rem'
          }}>
            <AlertCircle 
              size={isMobile ? 28 : 32} 
              color={colors.red}
              strokeWidth={2}
            />
            <h2 style={{
              fontSize: isMobile ? '1.5rem' : '1.75rem',
              fontWeight: '800',
              color: colors.textDark,
              margin: 0
            }}>
              WAAR JE NU ZIT
            </h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
            gap: isMobile ? '0.875rem' : '1rem'
          }}>
            {painPoints.map((pain, index) => (
              <div
                key={index}
                style={{
                  padding: isMobile ? '1.25rem' : '1.5rem',
                  background: colors.white,
                  border: `1px solid rgba(239, 68, 68, 0.2)`,
                  borderRadius: '14px',
                  boxShadow: '0 2px 8px rgba(239, 68, 68, 0.04)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem'
                }}
              >
                <div style={{
                  minWidth: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <span style={{ color: colors.red, fontSize: '1.125rem', fontWeight: '700' }}>✕</span>
                </div>
                <p style={{
                  fontSize: isMobile ? '0.9rem' : '1rem',
                  color: colors.textGrey,
                  fontWeight: '600',
                  margin: 0,
                  textAlign: 'left'
                }}>
                  {pain}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 4: REAL PROBLEM */}
        <div style={{
          marginBottom: isMobile ? '3rem' : '4rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            marginBottom: isMobile ? '1.5rem' : '2rem'
          }}>
            <Settings 
              size={isMobile ? 28 : 32} 
              color={colors.gold}
              strokeWidth={2}
            />
            <h2 style={{
              fontSize: isMobile ? '1.5rem' : '1.75rem',
              fontWeight: '800',
              color: colors.textDark,
              margin: 0
            }}>
              HET ECHTE PROBLEEM
            </h2>
          </div>

          <div style={{
            padding: isMobile ? '2rem 1.5rem' : '2.5rem',
            background: colors.white,
            border: `2px solid rgba(212, 175, 55, 0.3)`,
            borderRadius: '18px',
            textAlign: 'center'
          }}>
            <p style={{
              fontSize: isMobile ? '1.25rem' : '1.5rem',
              color: colors.textGrey,
              fontWeight: '600',
              marginBottom: '1.5rem',
              lineHeight: 1.4
            }}>
              Je mist geen discipline.
            </p>
            
            <p style={{
              fontSize: isMobile ? '2rem' : '2.75rem',
              fontWeight: '900',
              background: `linear-gradient(135deg, ${colors.goldLight} 0%, ${colors.gold} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textTransform: 'uppercase',
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
              margin: 0
            }}>
              Je mist richting en structuur.
            </p>
          </div>
        </div>

        {/* SECTION 5: SYSTEM */}
        <div style={{
          marginBottom: isMobile ? '3rem' : '4rem'
        }}>
          <h2 style={{
            fontSize: isMobile ? '1.5rem' : '1.75rem',
            fontWeight: '800',
            color: colors.textDark,
            textAlign: 'center',
            marginBottom: isMobile ? '1.5rem' : '2rem'
          }}>
            DIT IS WAT JE KRIJGT
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
            gap: isMobile ? '0.875rem' : '1rem'
          }}>
            {systemPillars.map((pillar, index) => {
              const Icon = pillar.icon
              return (
                <div
                  key={index}
                  style={{
                    padding: isMobile ? '1.125rem' : '1.25rem',
                    background: colors.white,
                    border: `1px solid rgba(212, 175, 55, 0.2)`,
                    borderRadius: '14px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '1rem'
                  }}
                >
                  <div style={{
                    minWidth: '44px',
                    height: '44px',
                    borderRadius: '10px',
                    background: `linear-gradient(135deg, ${colors.goldLight} 0%, ${colors.gold} 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Icon size={20} color={colors.white} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 style={{
                      fontSize: isMobile ? '0.95rem' : '1rem',
                      fontWeight: '700',
                      color: colors.textDark,
                      margin: 0
                    }}>
                      {pillar.title}
                    </h3>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* SECTION 6: PROOF */}
        <div style={{
          marginBottom: isMobile ? '3rem' : '4rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            marginBottom: isMobile ? '1.5rem' : '2rem'
          }}>
            <CheckCircle 
              size={isMobile ? 28 : 32} 
              color={colors.gold}
              strokeWidth={2}
            />
            <h2 style={{
              fontSize: isMobile ? '1.5rem' : '1.75rem',
              fontWeight: '800',
              color: colors.textDark,
              margin: 0
            }}>
              HET WERKT
            </h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: isMobile ? '0.875rem' : '1rem'
          }}>
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                style={{
                  padding: isMobile ? '1.5rem' : '1.75rem',
                  background: colors.white,
                  border: `1px solid rgba(212, 175, 55, 0.2)`,
                  borderRadius: '14px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
                }}
              >
                <div style={{
                  width: '4px',
                  height: '30px',
                  background: `linear-gradient(180deg, ${colors.goldLight}, ${colors.gold})`,
                  borderRadius: '2px',
                  marginBottom: '1rem'
                }} />
                <p style={{
                  fontSize: isMobile ? '1.125rem' : '1.25rem',
                  fontWeight: '600',
                  color: colors.textDark,
                  marginBottom: '0.75rem',
                  fontStyle: 'italic',
                  lineHeight: 1.5,
                  margin: '0 0 0.75rem 0'
                }}>
                  "{testimonial.quote}"
                </p>
                <p style={{
                  fontSize: '0.9rem',
                  fontWeight: '700',
                  color: colors.gold,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  margin: 0
                }}>
                  — {testimonial.name}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 7: GUARANTEES */}
        <div style={{
          marginBottom: isMobile ? '3rem' : '4rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            marginBottom: isMobile ? '1.5rem' : '2rem'
          }}>
            <Shield 
              size={isMobile ? 28 : 32} 
              color={colors.gold}
              strokeWidth={2}
            />
            <h2 style={{
              fontSize: isMobile ? '1.5rem' : '1.75rem',
              fontWeight: '800',
              color: colors.textDark,
              margin: 0
            }}>
              JE KUNT NIET VERLIEZEN
            </h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
            gap: isMobile ? '0.875rem' : '1rem'
          }}>
            {guarantees.map((guarantee, index) => (
              <div
                key={index}
                style={{
                  padding: isMobile ? '1.5rem' : '1.75rem',
                  background: colors.white,
                  border: `1px solid rgba(212, 175, 55, 0.2)`,
                  borderRadius: '14px',
                  textAlign: 'center'
                }}
              >
                <div style={{
                  width: '48px',
                  height: '48px',
                  margin: '0 auto 1rem',
                  borderRadius: '12px',
                  background: 'rgba(212, 175, 55, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Shield size={24} color={colors.gold} strokeWidth={2.5} />
                </div>
                <h3 style={{
                  fontSize: isMobile ? '1rem' : '1.05rem',
                  fontWeight: '700',
                  color: colors.textDark,
                  marginBottom: '0.5rem'
                }}>
                  {guarantee.title}
                </h3>
                <p style={{
                  fontSize: isMobile ? '0.85rem' : '0.9rem',
                  color: colors.textGrey,
                  lineHeight: '1.5',
                  margin: 0
                }}>
                  {guarantee.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 8: CLOSE */}
        <div>
          <h2 style={{
            fontSize: isMobile ? '1.5rem' : '1.75rem',
            fontWeight: '800',
            color: colors.textDark,
            textAlign: 'center',
            marginBottom: isMobile ? '1.5rem' : '2rem'
          }}>
            JE HEBT 3 OPTIES
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: isMobile ? '0.875rem' : '1rem',
            marginBottom: isMobile ? '2rem' : '2.5rem'
          }}>
            {scenarios.map((scenario, index) => (
              <div
                key={index}
                style={{
                  padding: isMobile ? '1.25rem' : '1.5rem',
                  background: colors.white,
                  border: scenario.highlight 
                    ? `2px solid ${colors.gold}` 
                    : `1px solid rgba(100, 116, 139, 0.2)`,
                  borderRadius: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  boxShadow: scenario.highlight 
                    ? '0 4px 12px rgba(212, 175, 55, 0.15)'
                    : '0 2px 8px rgba(0, 0, 0, 0.04)'
                }}
              >
                <span style={{
                  fontSize: isMobile ? '2rem' : '2.25rem',
                  fontWeight: '900',
                  color: scenario.highlight ? colors.gold : colors.textGrey,
                  width: '50px',
                  flexShrink: 0
                }}>
                  {scenario.num}
                </span>
                <div>
                  <p style={{
                    fontSize: isMobile ? '1rem' : '1.125rem',
                    fontWeight: '700',
                    color: scenario.highlight ? colors.textDark : colors.textGrey,
                    marginBottom: '0.25rem',
                    margin: '0 0 0.25rem 0'
                  }}>
                    {scenario.title}
                  </p>
                  <p style={{
                    fontSize: isMobile ? '0.85rem' : '0.9rem',
                    color: colors.textGrey,
                    fontWeight: '500',
                    margin: 0
                  }}>
                    {scenario.sub}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Price */}
          <div style={{
            padding: isMobile ? '2rem 1.5rem' : '2.5rem',
            background: colors.white,
            border: `2px solid rgba(212, 175, 55, 0.3)`,
            borderRadius: '18px',
            textAlign: 'center',
            marginBottom: isMobile ? '2rem' : '2.5rem'
          }}>
            <div style={{
              fontSize: isMobile ? '3.5rem' : '4.5rem',
              fontWeight: '900',
              background: `linear-gradient(135deg, ${colors.goldLight} 0%, ${colors.gold} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              lineHeight: '1'
            }}>
              €750
            </div>
            <p style={{
              fontSize: isMobile ? '1rem' : '1.125rem',
              color: colors.textGrey,
              fontWeight: '600',
              marginTop: '0.75rem',
              margin: '0.75rem 0 0 0'
            }}>
              Eenmalig • 6 Maanden
            </p>
          </div>

          {/* Final Question */}
          <div style={{
            padding: isMobile ? '2rem 1.5rem' : '2.5rem',
            background: colors.white,
            border: `1px solid rgba(212, 175, 55, 0.2)`,
            borderRadius: '18px',
            textAlign: 'center'
          }}>
            <h3 style={{
              fontSize: isMobile ? '1.75rem' : '2.25rem',
              fontWeight: '900',
              background: `linear-gradient(135deg, ${colors.goldLight} 0%, ${colors.gold} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-0.02em',
              margin: 0
            }}>
              WAT WORDT HET?
            </h3>
          </div>
        </div>

      </div>
    </div>
  )
}
