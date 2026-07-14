// src/sales-call/sections/HeroSection.jsx
// Hero — review cards matching screenshot style exactly
import { PILLARS } from './PillarenSection'

// Korte pilaar-labels voor het compacte strookje in de hero (zelfde volgorde
// als PILLARS). De uitgebreide titels staan in de pilaren-sectie zelf.
const PILLAR_SHORT = ['Voeding', 'Sociaal leven', 'Trainen', 'Tracking', 'Coach']

const GOLD_DARK = '#e8a800'
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
    headline: 'Fijn en succesvol traject',
    quote: 'Van 79,8 naar 74,4 in 8 weken. Vooral de kennis en info spreekt me aan, waardoor ik nu zonder teveel na te denken stabiel blijf in gewicht.'
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

  // Mobile-tuned constants — pulled out so they're easy to tweak together.
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
      background: '#0a0a0a'
    }}>
      {/* ═══ Titel + boog — gelijk aan de slotsectie ═══ */}
      <div style={{
        textAlign: 'center',
        padding: `0 ${SECTION_PAD_X}`,
        maxWidth: '900px',
        marginBottom: isMobile ? '1.5rem' : '2rem'
      }}>
        <h1 style={{
          fontWeight: '900',
          lineHeight: 1.1,
          margin: 0,
          letterSpacing: '-0.02em',
          color: '#fff',
          fontSize: isMobile ? 'clamp(2rem, 8.5vw, 2.6rem)' : 'clamp(2.8rem, 4.8vw, 3.8rem)',
        }}>
          Van zachte buik naar droog en gespierd <span style={{ borderBottom: '4px solid #ffba09', paddingBottom: '2px', whiteSpace: 'nowrap' }}>in 16 weken</span>
        </h1>
      </div>

      {/* Onder de titel: testimonial-transformatie + compacte 5 pilaren */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: isMobile ? '1.1rem' : '1.4rem',
        padding: `0 ${SECTION_PAD_X}`, width: '100%', maxWidth: 760,
        marginBottom: isMobile ? '1.75rem' : '2.25rem',
      }}>
        {/* Testimonial before/after (Maand 1 → Maand 3) */}
        <div style={{
          width: '100%', maxWidth: isMobile ? 215 : 250,
          borderRadius: 16, overflow: 'hidden', aspectRatio: '4 / 5',
          boxShadow: '0 14px 34px rgba(0,0,0,0.55)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}>
          <img
            src="/review-transformatie-3.png"
            alt="Transformatie — maand 1 naar maand 3"
            onError={(e) => { e.currentTarget.style.opacity = 0 }}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        </div>

        {/* Compacte 5 pilaren — screenshot-thumb + korte titel */}
        <div style={{
          display: 'flex', gap: isMobile ? '0.5rem' : '0.85rem',
          width: '100%', justifyContent: 'center',
          overflowX: isMobile ? 'auto' : 'visible', paddingBottom: isMobile ? 4 : 0,
        }}>
          {PILLARS.map((p, i) => (
            <div key={i} style={{
              flexShrink: 0, width: isMobile ? 88 : 118,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
            }}>
              <div style={{
                width: '100%', aspectRatio: '3 / 4', borderRadius: 10, overflow: 'hidden',
                background: '#111', border: '1px solid rgba(255,255,255,0.08)',
                position: 'relative',
              }}>
                <span style={{
                  position: 'absolute', top: 5, left: 5, zIndex: 2,
                  width: 16, height: 16, borderRadius: '50%',
                  background: 'rgba(255,186,9,0.9)', color: '#000',
                  fontSize: '0.55rem', fontWeight: 900,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{i + 1}</span>
                <img
                  src={p.screenshot}
                  alt={p.title}
                  onError={(e) => { e.currentTarget.style.opacity = 0 }}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              </div>
              <span style={{
                fontSize: isMobile ? '0.6rem' : '0.68rem', fontWeight: 800, color: '#fff',
                textAlign: 'center', lineHeight: 1.15, letterSpacing: '-0.01em',
              }}>{PILLAR_SHORT[i]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ Subtekst onder de boog — kleiner, ondergeschikt aan de titel ═══ */}
      <div style={{ textAlign: 'center', padding: `0 ${SECTION_PAD_X}`, maxWidth: '640px' }}>
        <p style={{
          fontWeight: '600',
          lineHeight: 1.4,
          margin: 0,
          color: 'rgba(255,255,255,0.78)',
          fontSize: isMobile ? '0.95rem' : '1.15rem',
        }}>
          In 5 uur per week naar een strakker en sterker lichaam zonder je sociale leven in te leveren.
        </p>
      </div>

      {/* ═══ Trustpilot badge ═══ */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginTop: isMobile ? '1.75rem' : '2.25rem',
        marginBottom: isMobile ? '1.25rem' : '1.5rem'
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill={TP_GREEN}/>
        </svg>
        <span style={{ fontSize: '0.65rem', fontWeight: '700', color: 'rgba(255,255,255,0.55)', letterSpacing: '0.04em' }}>TRUSTPILOT</span>
        <span style={{ fontSize: '0.65rem', fontWeight: '800', color: '#fff' }}>4.8</span>
        <div style={{ display: 'flex', gap: '2px' }}>
          {[1,2,3,4,5].map(s => (
            <svg key={s} width={11} height={11} viewBox="0 0 24 24" fill={TP_GREEN}>
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          ))}
        </div>
      </div>

      {/* ═══ Auto-sliding reviews — bewust subtiel (minder opvallend) ═══ */}
      <div style={{ width: '100%', position: 'relative', overflow: 'hidden', opacity: 0.6 }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '150px', height: '100%', background: 'linear-gradient(90deg, #0a0a0a 0%, transparent 100%)', zIndex: 3, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 0, right: 0, width: '150px', height: '100%', background: 'linear-gradient(270deg, #0a0a0a 0%, transparent 100%)', zIndex: 3, pointerEvents: 'none' }} />
        <div style={{ display: 'flex', gap: '0.6rem', animation: 'slideReviews 45s linear infinite', width: 'max-content' }}>
          {doubled.map((r, i) => (
            <div key={i} style={{ width: '165px', flexShrink: 0, background: '#fff', borderRadius: '12px', padding: '0.6rem 0.65rem 0.5rem', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 6px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
                    {r.photo ? (
                      <img src={r.photo} alt={r.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.style.background = '#ddd'; e.target.parentElement.innerHTML = `<span style="color:#888;font-size:0.55rem;font-weight:700;display:flex;align-items:center;justify-content:center;width:100%;height:100%">${r.name.charAt(0)}</span>` }}
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', background: '#ddd', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ color: '#888', fontSize: '0.55rem', fontWeight: '700' }}>{r.name.charAt(0)}</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <span style={{ fontSize: '0.68rem', fontWeight: '800', color: '#1a1a1a', display: 'block', lineHeight: 1.2 }}>{r.name}</span>
                    <span style={{ fontSize: '0.5rem', fontWeight: '700', color: GOLD_DARK, display: 'block' }}>{r.date}</span>
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
              <p style={{ fontSize: '0.68rem', fontWeight: '800', color: '#1a1a1a', margin: '0 0 0.3rem', lineHeight: 1.25 }}>"{r.headline}"</p>
              <p style={{ fontSize: '0.52rem', color: 'rgba(0,0,0,0.3)', fontWeight: '400', lineHeight: 1.35, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{r.quote}</p>
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
