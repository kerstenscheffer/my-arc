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

export default function HeroSection({ isMobile }) {
  const doubled = [...REVIEWS, ...REVIEWS]

  return (
    <section style={{
      scrollSnapAlign: 'start',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      background: `linear-gradient(180deg, #000 0%, #000 22%, #333 36%, ${PHOTO_BG} 52%, #d5d5d5 68%, #f0f0f0 82%, #fff 92%)`
    }}>
      {/* ═══ Title ═══ */}
      <div style={{
        textAlign: 'center',
        padding: '0 2rem',
        maxWidth: '800px',
        marginBottom: '0.75rem'
      }}>
        <h1 style={{
          fontWeight: '900',
          lineHeight: 1.05,
          margin: 0,
          letterSpacing: '-0.02em'
        }}>
          <span style={{
            display: 'block',
            fontSize: 'clamp(2.4rem, 4.2vw, 3.5rem)',
            color: '#fff'
          }}>Voel Je Goed, Verlies Vet</span>
          <span style={{
            display: 'block',
            fontSize: 'clamp(2.1rem, 3.8vw, 3.2rem)',
            marginTop: '0.15em'
          }}>
            <span style={{ color: '#fff' }}>& Leer Hoe Het </span>
            <span className="shimmer-gold" style={{ fontStyle: 'italic' }}>Wegblijft</span>
          </span>
        </h1>
      </div>

      {/* ═══ Photo wrapper ═══ */}
      <div style={{ position: 'relative', width: '340px' }}>
        <img
          src={COACH_PHOTO}
          alt="Coach Kersten"
          style={{ width: '100%', height: 'auto', display: 'block' }}
        />

        <div style={{
          position: 'absolute', top: '15px', right: '-105px', zIndex: 5
        }}>
          <div style={{
            background: `linear-gradient(135deg, ${GOLD} 0%, #D4B85A 30%, ${GOLD_DARK} 70%, ${GOLD} 100%)`,
            padding: '0.6rem 0.9rem',
            borderRadius: '10px',
            boxShadow: `0 4px 20px rgba(255,186,9,0.4), inset 0 1px 0 rgba(255,255,255,0.3)`,
            border: '2px solid #D4B85A'
          }}>
            <span style={{
              fontSize: '0.75rem', fontWeight: '900', color: '#000',
              textAlign: 'center', lineHeight: 1.2, display: 'block'
            }}>VERLIES</span>
            <span style={{
              fontSize: '1.3rem', fontWeight: '900', color: '#000',
              textAlign: 'center', lineHeight: 1, display: 'block', letterSpacing: '-0.02em'
            }}>8-20 KG</span>
          </div>
        </div>

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

        <div style={{
          position: 'absolute', bottom: '-28px', left: '50%',
          transform: 'translateX(-50%)', width: '155%', zIndex: 5
        }}>
          <div style={{
            background: 'rgba(0,0,0,0.92)',
            backdropFilter: 'blur(16px)',
            border: `1.5px solid ${GOLD}50`,
            borderRadius: '12px',
            padding: '0.7rem 1.35rem',
            textAlign: 'center',
            boxShadow: `0 6px 24px rgba(0,0,0,0.25), 0 0 16px rgba(255,186,9,0.08)`
          }}>
            <p style={{
              fontSize: '0.88rem', fontWeight: '700', color: '#fff',
              margin: 0, lineHeight: 1.45
            }}>
              Mijn Belofte: Ik werk door tot jouw{' '}
              <span style={{ color: GOLD, fontWeight: '800' }}>succesverhaal</span>{' '}
              hierbij komt
            </p>
          </div>
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
