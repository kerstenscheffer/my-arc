// ========================================
// 📁 src/funnel/five-pilar/sections/PricingSection.jsx
// 12 WEKEN WINNAARS TRAJECT — €450 (€150/mnd)
// Diagonal ribbon + integrated review slider
// ========================================
import { useState, useEffect, useRef } from 'react'
import {
  UtensilsCrossed,
  Dumbbell,
  Target,
  BarChart3,
  Moon,
  Gift,
  Star
} from 'lucide-react'

const REVIEWS = [
  {
    name: 'Hessel',
    date: 'dec 2025',
    text: 'Kersten begreep het meteen! Na een uitgebreide 0-meting kreeg ik een plan op maat. De kennis en info zorgen ervoor dat ik nu stabiel blijf. Van 79,8 naar 74,4 in 8 weken. Als jij je aan het plan houdt geeft Kersten altijd de volle 100%!'
  },
  {
    name: 'Me',
    date: 'dec 2025',
    text: 'Als je hulp nodig hebt met sporten raad ik Myarc echt aan. Je krijgt een goed schema om je doel te halen en je hebt wekelijkse calls. Ook kan je makkelijk contact opnemen als je ergens tegen aan loopt.'
  },
  {
    name: 'Indi',
    date: 'dec 2025',
    text: 'Myarc is super! Kersten helpt me iedere week met mijn maaltijden en zorgt ervoor dat ik precies krijg wat ik nodig heb. Professioneel, persoonlijk, betrouwbaar. Ik kan Myarc aan iedereen aanraden!'
  },
  {
    name: 'Toon',
    date: 'nov 2025',
    text: 'Super Coach, leuke gesprekken en altijd enthousiast. Heeft me goed geholpen in mijn traject. Zeker een aanrader!'
  },
  {
    name: 'Sassus',
    date: 'nov 2025',
    text: 'Na 100 mislukte pogingen is het mij met Kersten gelukt een routine te creëren die ik kan continueren. Niet alleen fysiek maar ook mentaal. Hij laat je jezelf verbazen over wat je kan bereiken.'
  },
  {
    name: 'Consumer',
    date: 'nov 2025',
    text: 'Zeer professionele aanpak! Alles duidelijk en gestructureerd in een overzichtelijke app. Hij volgt je progressie actief op en biedt feedback en motivatie op de juiste momenten. Absolute aanrader!'
  }
]

export default function PricingSection({ isMobile, onScrollNext, onNavigate }) {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef(null)
  const scrollRef = useRef(null)

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setIsVisible(true) },
      { threshold: 0.1 }
    )
    if (sectionRef.current) obs.observe(sectionRef.current)
    return () => obs.disconnect()
  }, [])

  // Auto-scroll reviews
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    let animId
    let pos = 0
    const speed = 0.4 // px per frame — nice and slow

    const scroll = () => {
      pos += speed
      // Reset when first set is fully scrolled
      if (pos >= el.scrollWidth / 2) pos = 0
      el.scrollLeft = pos
      animId = requestAnimationFrame(scroll)
    }

    // Pause on hover/touch
    const pause = () => cancelAnimationFrame(animId)
    const resume = () => { animId = requestAnimationFrame(scroll) }

    animId = requestAnimationFrame(scroll)
    el.addEventListener('mouseenter', pause)
    el.addEventListener('mouseleave', resume)
    el.addEventListener('touchstart', pause, { passive: true })
    el.addEventListener('touchend', resume)

    return () => {
      cancelAnimationFrame(animId)
      el.removeEventListener('mouseenter', pause)
      el.removeEventListener('mouseleave', resume)
      el.removeEventListener('touchstart', pause)
      el.removeEventListener('touchend', resume)
    }
  }, [])

  const pillarsRecap = [
    { icon: UtensilsCrossed, text: 'Fuel Your Gains Meal System' },
    { icon: Dumbbell, text: 'Built To Grow Training System' },
    { icon: Target, text: 'Coach In Your Corner' },
    { icon: BarChart3, text: 'Trust The Process Tracker' },
    { icon: Moon, text: 'Recovery King Protocol' },
  ]

  // Double the reviews for seamless infinite scroll
  const doubledReviews = [...REVIEWS, ...REVIEWS]

  return (
    <section
      ref={sectionRef}
      style={{
        background: '#000',
        position: 'relative',
        padding: isMobile ? '2rem 0' : '2rem 0',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden'
      }}
    >
      {/* ══════ HEADER ══════ */}
      <div style={{
        textAlign: 'center',
        marginBottom: isMobile ? '2rem' : '2.5rem',
        maxWidth: '600px',
        padding: '0 1.25rem',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.8s ease'
      }}>
        <h2 style={{
          fontSize: isMobile ? '1.75rem' : '2.75rem',
          fontWeight: '900',
          lineHeight: 1.1,
          letterSpacing: '-0.02em',
          marginBottom: '0.5rem'
        }}>
          <span style={{ color: '#fff' }}>12 Weken </span>
          <span className="shimmer-gold-pr">Winnaars Traject</span>
        </h2>
        <p style={{
          fontSize: isMobile ? '0.85rem' : '0.95rem',
          color: 'rgba(255,255,255,0.4)',
          fontWeight: '500'
        }}>
          Binnen 12 weken zitten we jou op de route naar je doel.
        </p>
      </div>

      {/* ══════ THE CARD ══════ */}
      <div style={{
        maxWidth: isMobile ? 'calc(100% - 2.5rem)' : '500px',
        width: '100%',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(25px)',
        transition: 'all 0.8s cubic-bezier(0.4,0,0.2,1) 0.2s',
        position: 'relative'
      }}>
        <div style={{
          borderRadius: isMobile ? '18px' : '22px',
          border: '1px solid rgba(255,186,9,0.3)',
          background: 'rgba(255,255,255,0.02)',
          overflow: 'hidden',
          position: 'relative'
        }}>
          {/* Gold top accent */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0,
            height: '3px',
            background: 'linear-gradient(90deg, #ffba09, #d4a006, #ffba09)'
          }} />

          {/* ── DIAGONAL RIBBON ── */}
          <div style={{
            position: 'absolute',
            top: isMobile ? '22px' : '28px',
            right: isMobile ? '-32px' : '-35px',
            width: isMobile ? '180px' : '210px',
            padding: isMobile ? '6px 0' : '8px 0',
            background: 'linear-gradient(135deg, #ffba09, #e8a800)',
            transform: 'rotate(35deg)',
            textAlign: 'center',
            zIndex: 10,
            boxShadow: '0 3px 15px rgba(255,186,9,0.4)'
          }}>
            <div style={{
              fontSize: isMobile ? '0.55rem' : '0.6rem',
              fontWeight: '900',
              color: '#000',
              letterSpacing: '0.08em',
              lineHeight: 1.3
            }}>
              BETAAL DIRECT
            </div>
            <div style={{
              fontSize: isMobile ? '0.6rem' : '0.65rem',
              fontWeight: '900',
              color: '#000',
              letterSpacing: '0.05em'
            }}>
              4 WEKEN GRATIS
            </div>
          </div>

          {/* Subtle shine */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0,
            height: '40%',
            background: 'linear-gradient(180deg, rgba(255,186,9,0.04) 0%, transparent 100%)',
            pointerEvents: 'none'
          }} />

          {/* ── WHAT YOU GET ── */}
          <div style={{
            padding: isMobile ? '1.75rem 1.5rem 1.25rem' : '2rem 2rem 1.5rem'
          }}>
            <span style={{
              fontSize: isMobile ? '0.6rem' : '0.65rem',
              fontWeight: '800',
              color: 'rgba(255,186,9,0.5)',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              display: 'block',
              marginBottom: isMobile ? '0.85rem' : '1rem'
            }}>
              WAT JE KRIJGT
            </span>

            <div style={{
              display: 'flex', flexDirection: 'column',
              gap: isMobile ? '0.55rem' : '0.65rem'
            }}>
              {pillarsRecap.map((item, idx) => {
                const Icon = item.icon
                return (
                  <div key={idx} style={{
                    display: 'flex', alignItems: 'center', gap: '0.6rem',
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible ? 'translateX(0)' : 'translateX(-10px)',
                    transition: `all 0.4s ease ${0.3 + idx * 0.08}s`
                  }}>
                    <div style={{
                      width: isMobile ? '26px' : '30px',
                      height: isMobile ? '26px' : '30px',
                      borderRadius: '50%',
                      background: 'rgba(255,186,9,0.08)',
                      border: '1px solid rgba(255,186,9,0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Icon size={isMobile ? 12 : 14} color="#ffba09" strokeWidth={2} />
                    </div>
                    <span style={{
                      fontSize: isMobile ? '0.82rem' : '0.88rem',
                      color: 'rgba(255,255,255,0.65)',
                      fontWeight: '500'
                    }}>{item.text}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── DIVIDER ── */}
          <div style={{
            height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(255,186,9,0.15), transparent)',
            margin: '0 1.5rem'
          }} />

          {/* ── GUARANTEES ── */}
          <div style={{
            padding: isMobile ? '1rem 1.5rem 0' : '1.15rem 2rem 0',
            display: 'flex',
            gap: isMobile ? '0.75rem' : '1rem'
          }}>
            <div style={{
              flex: 1,
              display: 'flex', alignItems: 'center', gap: '0.45rem',
              padding: isMobile ? '0.55rem 0.65rem' : '0.6rem 0.75rem',
              borderRadius: '10px',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)'
            }}>
              <span style={{ flexShrink: 0 }}><svg xmlns="http://www.w3.org/2000/svg" width={isMobile ? 16 : 18} height={isMobile ? 16 : 18} viewBox="0 0 24 24" fill="none" stroke="#ffba09" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg></span>
              <div>
                <div style={{
                  fontSize: isMobile ? '0.65rem' : '0.7rem',
                  fontWeight: '800', color: 'rgba(255,255,255,0.6)'
                }}>28 Dagen Proberen</div>
                <div style={{
                  fontSize: isMobile ? '0.55rem' : '0.58rem',
                  color: 'rgba(255,255,255,0.25)', fontWeight: '500'
                }}>Niet tevreden? Geld terug.</div>
              </div>
            </div>
            <div style={{
              flex: 1,
              display: 'flex', alignItems: 'center', gap: '0.45rem',
              padding: isMobile ? '0.55rem 0.65rem' : '0.6rem 0.75rem',
              borderRadius: '10px',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)'
            }}>
              <span style={{ flexShrink: 0 }}><svg xmlns="http://www.w3.org/2000/svg" width={isMobile ? 16 : 18} height={isMobile ? 16 : 18} viewBox="0 0 24 24" fill="none" stroke="#ffba09" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></span>
              <div>
                <div style={{
                  fontSize: isMobile ? '0.65rem' : '0.7rem',
                  fontWeight: '800', color: 'rgba(255,255,255,0.6)'
                }}>Geen Deadline</div>
                <div style={{
                  fontSize: isMobile ? '0.55rem' : '0.58rem',
                  color: 'rgba(255,255,255,0.25)', fontWeight: '500'
                }}>We stoppen als jij je doel bereikt.</div>
              </div>
            </div>
          </div>

          {/* ── PRICE BLOCK ── */}
          <div style={{
            padding: isMobile ? '1.5rem 1.5rem 1.75rem' : '1.75rem 2rem 2rem',
            textAlign: 'center'
          }}>
            <div style={{
              display: 'flex', alignItems: 'baseline',
              justifyContent: 'center', gap: '0.35rem'
            }}>
              <span style={{
                fontSize: isMobile ? '2.75rem' : '3.5rem',
                fontWeight: '900',
                color: '#fff',
                letterSpacing: '-0.03em',
                lineHeight: 1
              }}>€450</span>
              <span style={{
                fontSize: isMobile ? '0.85rem' : '0.95rem',
                color: 'rgba(255,255,255,0.3)',
                fontWeight: '600'
              }}>
                / €150 per maand
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ══════ REVIEW SLIDER ══════ */}
      <div style={{
        width: '100%',
        marginTop: isMobile ? '2.5rem' : '3rem',
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 1s ease 1s'
      }}>
        {/* Trustpilot-style header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          marginBottom: isMobile ? '1rem' : '1.25rem'
        }}>
          <div style={{
            display: 'flex', gap: '2px'
          }}>
            {[1,2,3,4,5].map(i => (
              <Star key={i} size={isMobile ? 14 : 16} fill="#ffba09" color="#ffba09" strokeWidth={0} />
            ))}
          </div>
          <span style={{
            fontSize: isMobile ? '0.7rem' : '0.75rem',
            color: 'rgba(255,255,255,0.35)',
            fontWeight: '600'
          }}>
            Beoordeeld op Trustpilot
          </span>
        </div>

        {/* Scrolling container */}
        <div
          ref={scrollRef}
          style={{
            display: 'flex',
            gap: isMobile ? '0.75rem' : '1rem',
            overflow: 'hidden',
            paddingLeft: isMobile ? '1.25rem' : '2rem',
            paddingRight: isMobile ? '1.25rem' : '2rem',
            cursor: 'grab'
          }}
        >
          {doubledReviews.map((review, idx) => (
            <div key={idx} style={{
              minWidth: isMobile ? '260px' : '300px',
              maxWidth: isMobile ? '260px' : '300px',
              padding: isMobile ? '1rem 1.1rem' : '1.15rem 1.25rem',
              borderRadius: '14px',
              border: '1px solid rgba(255,255,255,0.06)',
              background: 'rgba(255,255,255,0.02)',
              flexShrink: 0
            }}>
              {/* Stars */}
              <div style={{
                display: 'flex', gap: '2px',
                marginBottom: '0.6rem'
              }}>
                {[1,2,3,4,5].map(s => (
                  <Star key={s} size={12} fill="#ffba09" color="#ffba09" strokeWidth={0} />
                ))}
              </div>

              {/* Review text */}
              <p style={{
                fontSize: isMobile ? '0.72rem' : '0.78rem',
                color: 'rgba(255,255,255,0.5)',
                fontWeight: '500',
                lineHeight: 1.5,
                marginBottom: '0.75rem',
                display: '-webkit-box',
                WebkitLineClamp: 4,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}>
                {review.text}
              </p>

              {/* Author */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem'
                }}>
                  <div style={{
                    width: '28px', height: '28px',
                    borderRadius: '50%',
                    background: 'rgba(255,186,9,0.1)',
                    border: '1px solid rgba(255,186,9,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.65rem',
                    fontWeight: '800',
                    color: '#ffba09'
                  }}>
                    {review.name.charAt(0)}
                  </div>
                  <span style={{
                    fontSize: isMobile ? '0.7rem' : '0.75rem',
                    fontWeight: '700',
                    color: 'rgba(255,255,255,0.6)'
                  }}>{review.name}</span>
                </div>
                <span style={{
                  fontSize: '0.6rem',
                  color: 'rgba(255,255,255,0.2)',
                  fontWeight: '500'
                }}>{review.date}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Fade edges */}
        <div style={{
          position: 'absolute',
          left: 0, top: 0, bottom: 0,
          width: '40px',
          background: 'linear-gradient(90deg, #000, transparent)',
          pointerEvents: 'none',
          zIndex: 5
        }} />
        <div style={{
          position: 'absolute',
          right: 0, top: 0, bottom: 0,
          width: '40px',
          background: 'linear-gradient(270deg, #000, transparent)',
          pointerEvents: 'none',
          zIndex: 5
        }} />
      </div>

      {/* ══════ STYLES ══════ */}
      <style>{`
        .shimmer-gold-pr {
          background: linear-gradient(110deg, #ffba09 0%, #ffba09 40%, #fff5d4 48%, #ffffff 50%, #fff5d4 52%, #ffba09 60%, #ffba09 100%);
          background-size: 300% 100%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmerPR 4s ease-in-out infinite;
          filter: drop-shadow(0 0 20px rgba(255,186,9,0.2));
        }
        @keyframes shimmerPR {
          0% { background-position: 100% center; }
          100% { background-position: -100% center; }
        }
      `}</style>
    </section>
  )
}
