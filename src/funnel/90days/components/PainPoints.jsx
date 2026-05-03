// src/funnel/90days/components/PainPoints.jsx

import { GOLD, CALENDLY, pp, goldGloss, goldButtonBg, shimmerOverlay } from '../colors'

const G = ({ children }) => (
  <span style={{ ...goldGloss, fontWeight: 800 }}>{children}</span>
)

const H = ({ children }) => (
  <span style={{ background: 'rgba(255,186,9,0.2)', padding: '0 3px', borderRadius: '3px', color: '#fff', fontWeight: 700 }}>{children}</span>
)

const PAINS = [
  <span>Je wil fitter worden maar verliest steeds je <H>motivatie</H></span>,
  <span>Je wil vet verliezen maar weet niet <H>waar je moet beginnen</H></span>,
  <span>Je probeert van alles maar ziet <H>geen resultaten</H> in de spiegel</span>,
  <span>Je wil gezonder eten maar <H>weet niet wat</H></span>,
]

const PHASES = [
  {
    weeks: 'Week 1-4',
    title: 'Foundation',
    points: [
      { text: 'Flexibel leren eten', bold: ' — naar jouw doelen, zonder strikt dieet' },
      { text: 'Workouts', bold: ' die passen bij jouw leven en jouw doelen' },
      { text: 'Balans vinden', bold: ' — zodat je dit ook volhoudt na week 4' },
    ],
  },
  {
    weeks: 'Week 5-8',
    title: 'Momentum',
    points: [
      { text: 'Slaap en herstel', bold: ' optimaliseren — hier gebeurt de echte groei' },
      { text: 'Maaltijd timing', bold: ' voor meer energie en betere prestaties' },
      { text: 'Aanpassingen', bold: ' op basis van jouw data en voortgang' },
    ],
  },
  {
    weeks: 'Week 9-12',
    title: 'Resultaat',
    points: [
      { text: '5-15 kilo verloren', bold: ' — zichtbaar en voelbaar' },
      { text: 'Je voelt je fitter', bold: ' dan je je in jaren hebt gevoeld' },
      { text: 'Je weet hoe je het er blijvend afhoudt', bold: '' },
    ],
  },
]

export default function PainPoints({ isMobile }) {
  return (
    <>
      {/* ═══════════════════════════════════
          PIJNPUNTEN
          ═══════════════════════════════════ */}
      <section style={{
        maxWidth: '720px', margin: '0 auto',
        padding: isMobile ? '2rem 1rem' : '2.5rem 2rem',
        borderTop: '1px solid rgba(255,186,9,0.08)',
        textAlign: 'center',
      }}>
        <h2 style={{
          fontFamily: pp,
          fontSize: isMobile ? '1.2rem' : '1.5rem',
          fontWeight: 900, color: '#fff', lineHeight: 1.25,
          marginBottom: isMobile ? '1.25rem' : '1.5rem',
        }}>
          Herken jij jezelf hierin?
        </h2>

        <div style={{
          display: 'flex', flexDirection: 'column',
          gap: isMobile ? '0.75rem' : '0.85rem',
          maxWidth: '480px', margin: '0 auto',
        }}>
          {PAINS.map((pain, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: '0.6rem',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
              <span style={{
                fontFamily: pp, fontSize: isMobile ? '0.85rem' : '0.92rem',
                fontWeight: 500, color: 'rgba(255,255,255,0.7)', lineHeight: 1.4,
                textAlign: 'left',
              }}>{pain}</span>
            </div>
          ))}
        </div>

        {/* Bridge */}
        <p style={{
          fontFamily: pp, fontSize: isMobile ? '0.82rem' : '0.9rem',
          fontWeight: 400, lineHeight: 1.7, color: 'rgba(255,255,255,0.4)',
          marginTop: isMobile ? '1.75rem' : '2rem',
          maxWidth: '460px', marginLeft: 'auto', marginRight: 'auto',
        }}>
          Het probleem is niet dat je niet gemotiveerd genoeg bent.
          Het probleem is dat je <span style={{ background: 'rgba(255,186,9,0.2)', padding: '0 4px', borderRadius: '3px', color: '#fff', fontWeight: 700 }}>geen plan van aanpak</span> hebt waardoor het niet lukt.
        </p>
      </section>

      {/* ═══════════════════════════════════
          HOE WIJ DIT AANPAKKEN
          ═══════════════════════════════════ */}
      <section style={{
        maxWidth: '720px', margin: '0 auto',
        padding: isMobile ? '1.5rem 1rem 2rem' : '2rem 2rem 2.5rem',
        borderTop: '1px solid rgba(255,186,9,0.08)',
        textAlign: 'center',
      }}>
        {/* Intro text */}
        <p style={{
          fontFamily: pp, fontSize: isMobile ? '0.75rem' : '0.82rem',
          fontWeight: 400, color: 'rgba(255,255,255,0.35)',
          marginBottom: isMobile ? '0.4rem' : '0.5rem',
        }}>
          Ook voor jou zijn de oplossingen mogelijk
        </p>

        <h2 style={{
          fontFamily: pp,
          fontSize: isMobile ? '1.2rem' : '1.5rem',
          fontWeight: 900, color: '#fff', lineHeight: 1.25,
          marginBottom: isMobile ? '1.5rem' : '1.75rem',
        }}>
          Hier is hoe wij je kunnen <G>helpen</G>
        </h2>

        {/* Phases */}
        <div style={{
          display: 'flex', flexDirection: 'column',
          gap: isMobile ? '1.5rem' : '1.75rem',
          textAlign: 'left',
        }}>
          {PHASES.map((phase, i) => (
            <div key={i}>
              {/* Phase header */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                marginBottom: isMobile ? '0.5rem' : '0.6rem',
              }}>
                <div className="ss-gold-gloss" style={{
                  fontFamily: pp, fontSize: isMobile ? '1.3rem' : '1.5rem',
                  fontWeight: 900, lineHeight: 1,
                }}>{i + 1}</div>
                <div>
                  <div style={{
                    fontFamily: pp, fontSize: isMobile ? '0.5rem' : '0.55rem',
                    fontWeight: 700, color: GOLD, textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}>{phase.weeks}</div>
                  <div style={{
                    fontFamily: pp, fontSize: isMobile ? '0.95rem' : '1.05rem',
                    fontWeight: 800, color: '#fff',
                  }}>{phase.title}</div>
                </div>
              </div>

              {/* Points */}
              <div style={{
                display: 'flex', flexDirection: 'column', gap: '0.35rem',
                paddingLeft: isMobile ? '2rem' : '2.3rem',
              }}>
                {phase.points.map((point, pi) => (
                  <div key={pi} style={{
                    display: 'flex', alignItems: 'flex-start', gap: '0.4rem',
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '2px' }}>
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    <span style={{
                      fontFamily: pp, fontSize: isMobile ? '0.75rem' : '0.82rem',
                      fontWeight: 400, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5,
                    }}>
                      <span style={{ color: '#fff', fontWeight: 600 }}>{point.text}</span>{point.bold}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div style={{
          marginTop: isMobile ? '2rem' : '2.5rem',
          textAlign: 'center',
        }}>
          <div style={{
            fontFamily: pp,
            fontSize: isMobile ? '1rem' : '1.15rem',
            fontWeight: 800, color: '#fff', lineHeight: 1.3,
            marginBottom: isMobile ? '0.25rem' : '0.3rem',
          }}>
            Klaar om <G>5-15 kilo</G> op een blijvende manier af te vallen?
          </div>
          <div style={{
            fontFamily: pp,
            fontSize: isMobile ? '0.65rem' : '0.72rem',
            fontWeight: 400, color: 'rgba(255,255,255,0.35)',
            marginBottom: isMobile ? '0.6rem' : '0.75rem',
          }}>
            Laat je gegevens achter en ontvang vrijblijvend meer informatie
          </div>

          <a href={CALENDLY} target="_blank" rel="noopener noreferrer" style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            gap: '0.5rem', textDecoration: 'none',
            fontFamily: pp, fontSize: isMobile ? '0.85rem' : '0.95rem',
            fontWeight: 900, color: '#000',
            background: 'linear-gradient(145deg, #d4a017 0%, #ffba09 30%, #ffd44d 50%, #ffba09 70%, #d4a017 100%)',
            borderRadius: '14px',
            padding: isMobile ? '1rem 2rem' : '1.1rem 2.5rem',
            position: 'relative', overflow: 'hidden',
            boxShadow: '0 4px 15px rgba(255,186,9,0.2)',
            animation: 'ssPulseGlow 2.5s ease-in-out infinite',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            border: 'none', cursor: 'pointer',
          }}>
            <div style={shimmerOverlay} />
            <span style={{ position: 'relative', zIndex: 1 }}>Ja, Ik Wil Meer Info!</span>
            <svg style={{ position: 'relative', zIndex: 1, flexShrink: 0 }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </a>

          <div style={{
            marginTop: isMobile ? '0.5rem' : '0.6rem',
            fontFamily: pp, fontSize: isMobile ? '0.5rem' : '0.55rem',
            fontWeight: 500, color: 'rgba(255,255,255,0.15)',
          }}>
            Vrijblijvend — we nemen binnen 24 uur contact op
          </div>

          {/* Hessel review — big testimonial */}
          <div style={{
            marginTop: isMobile ? '2rem' : '2.5rem',
            textAlign: 'left',
            padding: isMobile ? '1.25rem' : '1.5rem',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.06)',
          }}>
            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              marginBottom: isMobile ? '0.6rem' : '0.75rem',
            }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: '#e74c3c',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: pp, fontSize: '0.6rem', fontWeight: 800, color: '#fff',
                flexShrink: 0,
              }}>H</div>
              <div>
                <div style={{
                  fontFamily: pp, fontSize: '0.8rem', fontWeight: 700, color: '#fff',
                }}>Hessel</div>
                <div style={{ display: 'flex', gap: '0.5px' }}>
                  {[1,2,3,4,5].map(i => (
                    <svg key={i} width={10} height={10} viewBox="0 0 24 24" fill={GOLD} stroke="none">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                  ))}
                </div>
              </div>
            </div>

            {/* Quote */}
            <p style={{
              fontFamily: pp, fontSize: isMobile ? '0.82rem' : '0.9rem',
              fontWeight: 400, lineHeight: 1.7, color: 'rgba(255,255,255,0.5)',
              margin: 0,
            }}>
              "Ik was al lang van plan om wat af te vallen en fitter te worden. Kersten begreep het meteen.
              Ik kreeg een uitgebreid plan — <span style={{ background: 'rgba(255,186,9,0.2)', padding: '0 3px', borderRadius: '3px', color: '#fff', fontWeight: 700 }}>geen vaste gerechten die je moet eten</span>,
              alleen een duw in de goede richting. Als jij je aan het plan houdt geeft Kersten altijd de volle 100%.
              Ik ben van <span style={{ color: '#fff', fontWeight: 700 }}>79,8 naar 74,4 kg</span> gegaan in 8 weken."
            </p>
          </div>
        </div>
      </section>
    </>
  )
}
