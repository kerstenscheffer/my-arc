// src/sales-call/sections/HeroSection.jsx
// Hero — review cards matching screenshot style exactly
const GOLD = '#ffba09'
const GOLD_DARK = '#e8a800'
const COACH_PHOTO = '/coach-kersten.png'
const PHOTO_BG = '#b0b0b0'
const TP_GREEN = '#00B67A'

const REVIEWS = [
  {
    name: 'Sassus',
    photo: '/review-sassus.png',
    date: 'NOV 2025',
    headline: '-5,1kg en eindelijk gelukt!',
    quote: 'Na 100 mislukte pogingen wilde ik mijzelf nog 1 kans geven. Met de energie van Kersten is het mij gelukt om een routine te creëren.'
  },
  {
    name: 'Consumer',
    photo: '/review-consumer.png',
    date: 'NOV 2025',
    headline: 'Echt resultaat door persoonlijke aanpak',
    quote: 'Zeer professionele aanpak, waardevolle feedback en motivatie op de juiste momenten.'
  },
  {
    name: 'Hessel',
    photo: null,
    date: 'FEB 2026',
    headline: '-5,4kg in 8 weken, stabiel gebleven',
    quote: 'De kennis zorgt ervoor dat ik nu zonder na te denken stabiel blijf in gewicht.'
  },
  {
    name: 'Indi',
    photo: null,
    date: 'DEC 2025',
    headline: 'Professioneel, persoonlijk en betrouwbaar',
    quote: 'Helpt me iedere week en motiveert me heel erg bij het sporten.'
  },
  {
    name: 'Toon',
    photo: null,
    date: 'NOV 2025',
    headline: 'Super Coach, zeker een aanrader',
    quote: 'Leuke gesprekken, altijd enthousiast, goed geholpen in mijn traject.'
  },
  {
    name: 'Me',
    photo: null,
    date: 'DEC 2025',
    headline: 'Goed schema, wekelijkse begeleiding',
    quote: 'Je krijgt een goed schema en wekelijkse calls om je voortgang te checken.'
  }
]

// Goal-badge — gold gradient pill with a label, big number and a small
// "in X maanden" subline. Used twice in the hero (verlies / spierbouw).
function Badge({ isMobile, title, big }) {
  return (
    <div style={{
      background: `linear-gradient(135deg, ${GOLD} 0%, #D4B85A 30%, ${GOLD_DARK} 70%, ${GOLD} 100%)`,
      padding: isMobile ? '0.4rem 0.55rem' : '0.55rem 0.9rem',
      borderRadius: '10px',
      boxShadow: `0 4px 20px rgba(255,186,9,0.4), inset 0 1px 0 rgba(255,255,255,0.3)`,
      border: '2px solid #D4B85A',
      textAlign: 'center',
      minWidth: isMobile ? 92 : 120,
    }}>
      <span style={{
        fontSize: isMobile ? '0.58rem' : '0.7rem', fontWeight: '900', color: '#000',
        lineHeight: 1.15, display: 'block', letterSpacing: '0.02em',
      }}>{title}</span>
      <span style={{
        fontSize: isMobile ? '0.95rem' : '1.25rem', fontWeight: '900', color: '#000',
        lineHeight: 1, display: 'block', letterSpacing: '-0.02em',
        whiteSpace: 'nowrap',
      }}>{big}</span>
      <span style={{
        fontSize: isMobile ? '0.48rem' : '0.55rem', fontWeight: '700', color: 'rgba(0,0,0,0.7)',
        lineHeight: 1.15, display: 'block', marginTop: '0.15rem',
        letterSpacing: '0.04em', textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}>in 3-6 maanden</span>
    </div>
  )
}

export default function HeroSection({ isMobile }) {
  const doubled = [...REVIEWS, ...REVIEWS]

  // Mobile-tuned constants — pulled out so they're easy to tweak together.
  const PHOTO_W = isMobile ? '200px' : '340px'
  const SECTION_PAD_X = isMobile ? '1rem' : '2rem'

  return (
    <section style={{
      scrollSnapAlign: 'start',
      // 100dvh respects the iOS Safari URL-bar so the section doesn't get
      // clipped under the chrome on mobile.
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      padding: isMobile ? '1.2rem 0' : 0,
      background: `linear-gradient(180deg, #000 0%, #000 22%, #333 36%, ${PHOTO_BG} 52%, #d5d5d5 68%, #f0f0f0 82%, #fff 92%)`
    }}>
      {/* ═══ Title ═══ */}
      <div style={{
        textAlign: 'center',
        padding: `0 ${SECTION_PAD_X}`,
        maxWidth: '800px',
        marginBottom: isMobile ? '0.55rem' : '0.75rem'
      }}>
        {/* Brand-mark above title — all caps, spaced */}
        <div style={{
          fontSize: isMobile ? '0.62rem' : 'clamp(0.7rem, 1.1vw, 0.85rem)',
          fontWeight: '900',
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          marginBottom: isMobile ? '0.55rem' : '0.85rem',
          color: GOLD,
        }}>
          MY ARC COACHING
        </div>

        <h1 style={{
          fontWeight: '900',
          lineHeight: 1.05,
          margin: 0,
          letterSpacing: '-0.02em'
        }}>
          <span style={{
            display: 'block',
            fontSize: isMobile ? 'clamp(1.6rem, 7.5vw, 2.1rem)' : 'clamp(2.4rem, 4.2vw, 3.5rem)',
            color: '#fff'
          }}>Je Droom Fysiek Bereiken</span>
          <span style={{
            display: 'block',
            fontSize: isMobile ? 'clamp(1.05rem, 4.8vw, 1.35rem)' : 'clamp(1.6rem, 3vw, 2.4rem)',
            color: '#fff',
            marginTop: '0.25em',
            fontWeight: '700',
          }}>
            naast je <span style={{ fontStyle: 'italic', color: GOLD }}>werk en sociale leven</span>
          </span>
        </h1>

        {/* Sub-line under the title */}
        <p style={{
          margin: isMobile ? '0.7rem auto 0' : '1rem auto 0',
          fontSize: isMobile ? '0.78rem' : 'clamp(0.85rem, 1.4vw, 1rem)',
          fontWeight: '500',
          color: 'rgba(255,255,255,0.78)',
          lineHeight: 1.45,
          maxWidth: '520px',
        }}>
          Leer hoe je je fysieke doelen behaalt naast je werk en sociale leven.
        </p>
      </div>

      {/* ═══ Photo + badges row ═══ */}
      {/* On desktop: photo centered, badges float right + side-text floats left.
          On mobile: photo + badges share a flex row so badges sit alongside
          without bleeding off the screen. */}
      <div style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        gap: isMobile ? '0.55rem' : 0,
        marginTop: isMobile ? '0.4rem' : 0,
        width: isMobile ? '100%' : 'auto',
        padding: isMobile ? `0 ${SECTION_PAD_X}` : 0,
      }}>
        <div style={{ position: 'relative', width: PHOTO_W, flexShrink: 0 }}>
          <img
            src={COACH_PHOTO}
            alt="Coach Kersten"
            style={{ width: '100%', height: 'auto', display: 'block' }}
          />

          {/* Desktop-only: side-tekst links van foto */}
          {!isMobile && (
            <div style={{
              position: 'absolute', bottom: '28%', left: '-140px', zIndex: 5
            }}>
              <p style={{
                fontSize: '1rem', color: 'rgba(255,255,255,0.92)', fontWeight: '600',
                lineHeight: 1.4,
                textShadow: '0 2px 12px rgba(0,0,0,0.9), 0 4px 30px rgba(0,0,0,0.5)',
                margin: 0, maxWidth: '200px'
              }}>
                Leer hoe je gezond eet en leeft, zonder restrictie.
              </p>
            </div>
          )}

          {/* Belofte-blok onder de foto. Op mobile passend in de viewport. */}
          <div style={{
            position: 'absolute',
            bottom: isMobile ? '-22px' : '-28px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: isMobile ? '115%' : '155%',
            maxWidth: '92vw',
            zIndex: 5,
          }}>
            <div style={{
              background: 'rgba(0,0,0,0.92)',
              backdropFilter: 'blur(16px)',
              border: `1.5px solid ${GOLD}50`,
              borderRadius: '12px',
              padding: isMobile ? '0.5rem 0.75rem' : '0.7rem 1.35rem',
              textAlign: 'center',
              boxShadow: `0 6px 24px rgba(0,0,0,0.25), 0 0 16px rgba(255,186,9,0.08)`
            }}>
              <p style={{
                fontSize: isMobile ? '0.68rem' : '0.88rem',
                fontWeight: '700', color: '#fff',
                margin: 0, lineHeight: 1.4
              }}>
                Mijn Belofte: Ik werk door tot jouw{' '}
                <span style={{ color: GOLD, fontWeight: '800' }}>succesverhaal</span>{' '}
                hierbij komt
              </p>
            </div>
          </div>
        </div>

        {/* Goal-badges — on desktop absolutely positioned to the right of
            the photo (overflowing the container is fine there). On mobile
            they're inline next to the photo in the same flex row. */}
        <div style={isMobile ? {
          display: 'flex', flexDirection: 'column', gap: '0.45rem',
          alignSelf: 'center',
          flexShrink: 1, minWidth: 0,
        } : {
          position: 'absolute', top: '15px', right: '-125px', zIndex: 5,
          display: 'flex', flexDirection: 'column', gap: '0.55rem',
        }}>
          <Badge isMobile={isMobile} title="VERLIES" big="8-20 KG" />
          <Badge isMobile={isMobile} title="BOUW" big="3-8 KG SPIER" />
        </div>
      </div>

      {/* ═══ Trustpilot badge ═══ */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginTop: '2.5rem',
        marginBottom: '0.6rem'
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill={TP_GREEN}/>
        </svg>
        <span style={{
          fontSize: '0.65rem', fontWeight: '700',
          color: 'rgba(0,0,0,0.4)', letterSpacing: '0.04em'
        }}>TRUSTPILOT</span>
        <span style={{
          fontSize: '0.65rem', fontWeight: '800', color: '#1a1a1a'
        }}>4.8</span>
        <div style={{ display: 'flex', gap: '2px' }}>
          {[1,2,3,4,5].map(s => (
            <svg key={s} width={11} height={11} viewBox="0 0 24 24" fill={TP_GREEN}>
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          ))}
        </div>
      </div>

      {/* ═══ Auto-sliding reviews ═══ */}
      <div style={{
        width: '100%',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0,
          width: '150px', height: '100%',
          background: 'linear-gradient(90deg, #fff 0%, transparent 100%)',
          zIndex: 3, pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute', top: 0, right: 0,
          width: '150px', height: '100%',
          background: 'linear-gradient(270deg, #fff 0%, transparent 100%)',
          zIndex: 3, pointerEvents: 'none'
        }} />

        <div style={{
          display: 'flex',
          gap: '0.6rem',
          animation: 'slideReviews 45s linear infinite',
          width: 'max-content'
        }}>
          {doubled.map((r, i) => (
            <div key={i} style={{
              width: '195px',
              flexShrink: 0,
              background: '#fff',
              borderRadius: '12px',
              padding: '0.7rem 0.75rem 0.6rem',
              border: '1px solid rgba(0,0,0,0.06)',
              boxShadow: '0 1px 6px rgba(0,0,0,0.03)'
            }}>
              {/* Row 1: photo + name/date + stars */}
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                marginBottom: '0.5rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <div style={{
                    width: '28px', height: '28px',
                    borderRadius: '50%', overflow: 'hidden', flexShrink: 0
                  }}>
                    {r.photo ? (
                      <img
                        src={r.photo} alt={r.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                          e.target.style.display = 'none'
                          e.target.parentElement.style.background = '#ddd'
                          e.target.parentElement.innerHTML = `<span style="color:#888;font-size:0.55rem;font-weight:700;display:flex;align-items:center;justify-content:center;width:100%;height:100%">${r.name.charAt(0)}</span>`
                        }}
                      />
                    ) : (
                      <div style={{
                        width: '100%', height: '100%', background: '#ddd',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <span style={{ color: '#888', fontSize: '0.55rem', fontWeight: '700' }}>{r.name.charAt(0)}</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <span style={{
                      fontSize: '0.68rem', fontWeight: '800', color: '#1a1a1a', display: 'block', lineHeight: 1.2
                    }}>{r.name}</span>
                    <span style={{
                      fontSize: '0.5rem', fontWeight: '700', color: GOLD_DARK, display: 'block'
                    }}>{r.date}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '1px', marginTop: '2px' }}>
                  {[1,2,3,4,5].map(s => (
                    <svg key={s} width={11} height={11} viewBox="0 0 24 24" fill="#FFD700">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  ))}
                </div>
              </div>

              {/* Headline */}
              <p style={{
                fontSize: '0.68rem',
                fontWeight: '800',
                color: '#1a1a1a',
                margin: '0 0 0.3rem',
                lineHeight: 1.25
              }}>"{r.headline}"</p>

              {/* Quote */}
              <p style={{
                fontSize: '0.52rem',
                color: 'rgba(0,0,0,0.3)',
                fontWeight: '400',
                lineHeight: 1.35,
                margin: 0,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}>{r.quote}</p>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes slideReviews {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  )
}
