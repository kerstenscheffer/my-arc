// src/sales-call/sections/GarantiePrijsSection.jsx
// Closing section — 5 pillars with photos + pricing card + guarantees
// €100/mnd × 3 maanden, presentation mode (no buttons)

import {
  UtensilsCrossed,
  Dumbbell,
  Target,
  BarChart3,
  Moon
} from 'lucide-react'

const GOLD = '#ffba09'
const GOLD_DARK = '#e8a800'

const PILLARS = [
  {
    icon: UtensilsCrossed,
    image: 'https://i.ibb.co/fVBpKfsJ/7.png',
    title: 'Flexibel Leren Eten',
    bullet: 'Open de app → weet wat je kan eten, hoe je het maakt, ook als je uit eten gaat'
  },
  {
    icon: Dumbbell,
    image: 'https://i.ibb.co/6Rmd50GW/5.png',
    title: 'Fitter Op Jouw Tempo',
    bullet: 'Training die past bij jouw level, om blessures heen, we bouwen op'
  },
  {
    icon: Target,
    image: 'https://i.ibb.co/3y8zGSYt/9.png',
    title: 'Altijd Iemand Die Meekijkt',
    bullet: 'Ik kijk mee, stuur bij en grijp in — via app, call of bericht, 24/7'
  },
  {
    icon: BarChart3,
    image: 'https://i.ibb.co/dd3bKQX/4.png',
    title: 'Zien Dat Het Werkt',
    bullet: 'Altijd inzicht in je vooruitgang — gaat het niet goed? Lossen we op'
  },
  {
    icon: Moon,
    image: 'https://i.ibb.co/SwTcyFP4/8.png',
    title: 'Meer Energie, Minder Moeite',
    bullet: 'Beter slapen, meer energie, simpel ritme dat past bij jouw leven'
  }
]

export default function GarantiePrijsSection({ isMobile }) {
  return (
    <section style={{
      scrollSnapAlign: 'start',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      background: 'linear-gradient(180deg, #fff 0%, #f0f0f0 6%, #d5d5d5 14%, #888 28%, #333 46%, #111 68%, #000 100%)',
      padding: '0 1.25rem'
    }}>
      <div style={{
        maxWidth: '520px',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        {/* ═══ Label ═══ */}
        <span style={{
          fontSize: '0.6rem',
          fontWeight: '800',
          letterSpacing: '0.15em',
          color: GOLD,
          textTransform: 'uppercase',
          marginBottom: '0.4rem'
        }}>MIJN BELOFTE AAN JOU</span>

        {/* ═══ Title ═══ */}
        <h2 style={{
          fontWeight: '900',
          lineHeight: 1.05,
          margin: 0,
          letterSpacing: '-0.02em',
          textAlign: 'center'
        }}>
          <span style={{
            display: 'block',
            fontSize: isMobile ? 'clamp(1.4rem, 7vw, 1.9rem)' : 'clamp(1.8rem, 3vw, 2.4rem)',
            color: '#fff'
          }}>Voel Je Goed, Verlies Vet</span>
          <span style={{
            display: 'block',
            fontSize: isMobile ? 'clamp(1.2rem, 6vw, 1.6rem)' : 'clamp(1.5rem, 2.5vw, 2rem)',
            marginTop: '0.1em'
          }}>
            <span style={{ color: '#fff' }}>& Leer Hoe Het </span>
            <span className="shimmer-gold" style={{ fontStyle: 'italic' }}>Wegblijft</span>
          </span>
        </h2>

        {/* ═══ Pillars — photo + bullet ═══ */}
        <div style={{
          marginTop: isMobile ? '1rem' : '1.4rem',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: isMobile ? '0.35rem' : '0.4rem'
        }}>
          {PILLARS.map((p, i) => {
            const Icon = p.icon
            return (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                gap: isMobile ? '0.6rem' : '0.75rem',
                padding: isMobile ? '0.35rem 0.5rem' : '0.4rem 0.6rem',
                borderRadius: '10px',
                background: 'rgba(0,0,0,0.35)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.06)'
              }}>
                {/* Photo thumbnail */}
                <div style={{
                  width: isMobile ? '38px' : '44px',
                  height: isMobile ? '38px' : '44px',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  flexShrink: 0,
                  position: 'relative'
                }}>
                  <img
                    src={p.image}
                    alt={p.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                  {/* Icon overlay */}
                  <div style={{
                    position: 'absolute',
                    bottom: '2px',
                    right: '2px',
                    width: '16px',
                    height: '16px',
                    borderRadius: '4px',
                    background: 'rgba(0,0,0,0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Icon size={9} color={GOLD} strokeWidth={2.5} />
                  </div>
                </div>

                {/* Text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: isMobile ? '0.7rem' : '0.75rem',
                    fontWeight: '800',
                    color: '#fff',
                    lineHeight: 1.2,
                    marginBottom: '0.1rem'
                  }}>{p.title}</div>
                  <div style={{
                    fontSize: isMobile ? '0.58rem' : '0.63rem',
                    fontWeight: '500',
                    color: 'rgba(255,255,255,0.35)',
                    lineHeight: 1.35
                  }}>{p.bullet}</div>
                </div>
              </div>
            )
          })}
        </div>

        {/* ═══ Pricing Card ═══ */}
        <div style={{
          marginTop: isMobile ? '0.85rem' : '1.1rem',
          width: '100%',
          borderRadius: isMobile ? '14px' : '18px',
          border: '1px solid rgba(255,186,9,0.25)',
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(20px)',
          overflow: 'hidden',
          position: 'relative'
        }}>
          {/* Gold top accent */}
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0,
            height: '3px',
            background: `linear-gradient(90deg, ${GOLD}, ${GOLD_DARK}, ${GOLD})`
          }} />

          {/* Price display */}
          <div style={{
            padding: isMobile ? '1.1rem 1rem 0.7rem' : '1.25rem 1.25rem 0.85rem',
            textAlign: 'center'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'center',
              gap: '0.15rem'
            }}>
              <span style={{
                fontSize: isMobile ? '2.4rem' : '3rem',
                fontWeight: '900',
                color: '#fff',
                lineHeight: 1,
                letterSpacing: '-0.02em'
              }}>€100</span>
              <span style={{
                fontSize: isMobile ? '0.85rem' : '0.95rem',
                color: 'rgba(255,255,255,0.3)',
                fontWeight: '600'
              }}>/mnd</span>
            </div>
            <div style={{
              fontSize: isMobile ? '0.7rem' : '0.75rem',
              color: GOLD,
              fontWeight: '700',
              marginTop: '0.25rem'
            }}>
              3 maanden persoonlijke coaching & begeleiding
            </div>
          </div>

          {/* Divider */}
          <div style={{
            height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(255,186,9,0.15), transparent)',
            margin: '0 1rem'
          }} />

          {/* Guarantee badges */}
          <div style={{
            padding: isMobile ? '0.7rem 0.75rem 0.85rem' : '0.85rem 1rem 1rem',
            display: 'flex',
            gap: isMobile ? '0.5rem' : '0.65rem'
          }}>
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: isMobile ? '0.5rem' : '0.55rem 0.65rem',
              borderRadius: '9px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)'
            }}>
              <span style={{ flexShrink: 0 }}>
                <svg xmlns="http://www.w3.org/2000/svg" width={isMobile ? 15 : 17} height={isMobile ? 15 : 17} viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>
                  <path d="m9 12 2 2 4-4"/>
                </svg>
              </span>
              <div>
                <div style={{ fontSize: isMobile ? '0.6rem' : '0.65rem', fontWeight: '800', color: 'rgba(255,255,255,0.6)' }}>Gratis Door</div>
                <div style={{ fontSize: isMobile ? '0.48rem' : '0.52rem', color: 'rgba(255,255,255,0.25)', fontWeight: '500', lineHeight: 1.3 }}>Doel niet bereikt? Ik coach gratis verder.</div>
              </div>
            </div>

            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: isMobile ? '0.5rem' : '0.55rem 0.65rem',
              borderRadius: '9px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)'
            }}>
              <span style={{ flexShrink: 0 }}>
                <svg xmlns="http://www.w3.org/2000/svg" width={isMobile ? 15 : 17} height={isMobile ? 15 : 17} viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              </span>
              <div>
                <div style={{ fontSize: isMobile ? '0.6rem' : '0.65rem', fontWeight: '800', color: 'rgba(255,255,255,0.6)' }}>Geen Deadline</div>
                <div style={{ fontSize: isMobile ? '0.48rem' : '0.52rem', color: 'rgba(255,255,255,0.25)', fontWeight: '500', lineHeight: 1.3 }}>We stoppen als jij je doel bereikt.</div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ Trust line ═══ */}
        <div style={{
          marginTop: isMobile ? '0.7rem' : '0.9rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.4rem'
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#00B67A"/>
          </svg>
          <span style={{ fontSize: '0.55rem', fontWeight: '600', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.03em' }}>4.8 op Trustpilot</span>
          <span style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.12)' }}>·</span>
          <span style={{ fontSize: '0.55rem', fontWeight: '600', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.03em' }}>100% garantie</span>
        </div>
      </div>
    </section>
  )
}
