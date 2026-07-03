// src/sales-call/sections/PillarenSection.jsx
// Dark section — 5 pillars with photos, compact effort-killer text

const GOLD = '#ffba09'

// screenshot: app-screenshot per onderdeel. Vervang de /sales-screenshots/-paden
// door je eigen beelden (in /public/sales-screenshots/). Tot dan: nette placeholder.
// Geëxporteerd zodat de prijs-sectie dezelfde 5 onderdelen kan tonen (in sync).
export const PILLARS = [
  {
    image: 'https://i.ibb.co/fVBpKfsJ/7.png',
    screenshot: '/sales-screenshots/eten.png',
    title: 'Altijd Weten Wat Te Eten',
    bullets: [
      { label: 'Structuur', text: 'vaste maaltijden in de app, jij weet elke dag wat je eet' },
      { label: 'Flexibiliteit', text: 'samen blijven eten met je gezin of vriendin. Altijd een passende maaltijd klaar, van snel tot uitgebreid' },
      { label: 'Makkelijk', text: 'vet verliezen zonder honger, futloosheid of terugvallen' },
    ],
  },
  {
    image: 'https://i.ibb.co/3y8zGSYt/9.png',
    screenshot: '/sales-screenshots/meedoen.png',
    title: 'Gewoon Mee Blijven Doen',
    bullets: [
      { label: 'Verjaardagen & feestjes', text: 'leer hoe je meedoet zonder je vetverlies te slopen' },
      { label: 'Uit eten, weekenden en vakanties', text: 'een aanpak die blijft werken naast je sociale leven' },
      { label: 'Inbouwen, niet wegstrepen', text: 'leer hoe je je favoriete dingen blijft doen: een bakje chips voor de tv, een biertje tijdens het voetbal kijken' },
    ],
  },
  {
    image: 'https://i.ibb.co/6Rmd50GW/5.png',
    screenshot: '/sales-screenshots/trainen.png',
    title: 'In Shape In 3x Per Week',
    bullets: [
      { label: 'Tijd', text: 'effectieve workouts van minder dan een uur' },
      { label: 'Plek', text: 'thuis of in de gym, past in jouw week' },
      { label: 'Begeleiding', text: 'uitlegvideo\'s en persoonlijke bijsturing op je oefeningen' },
    ],
  },
  {
    image: 'https://i.ibb.co/dd3bKQX/4.png',
    screenshot: '/sales-screenshots/tracking.png',
    title: 'Zie Dat Het Werkt',
    bullets: [
      { label: 'Bewijs', text: 'duidelijk inzicht in je vooruitgang: kracht, gewicht en foto-tracking' },
      { label: '0% Risico', text: 'zichtbaar verschil binnen 30 dagen of je investering terug' },
    ],
  },
  {
    image: 'https://i.ibb.co/SwTcyFP4/8.png',
    screenshot: '/sales-screenshots/coach.png',
    title: 'Coach Naast Je',
    bullets: [
      { label: 'Wekelijks contact', text: 'elke 2 weken een videocall om je voortgang door te nemen' },
      { label: 'Dagelijks bereikbaar', text: 'vragen of twijfel? Via de app krijg je snel antwoord' },
      { label: 'Ik kijk mee', text: 'ik volg je progressie dagelijks en haak direct in als het nodig is' },
    ],
  },
]

// eyebrow / title / subtitle zijn optioneel: zonder props valt de kop terug op
// de sales-versie. De link-funnel (/start) geeft eigen "oplossing"-copy mee.
export default function PillarenSection({ isMobile, eyebrow, title, subtitle }) {
  return (
    <section style={{
      scrollSnapAlign: 'start',
      minHeight: '100dvh',
      background: '#0a0a0a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: isMobile ? '3rem 1rem' : '4rem 2rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Subtle radial glow */}
      <div style={{
        position: 'absolute',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '600px', height: '600px',
        background: `radial-gradient(circle, rgba(255,186,9,0.04) 0%, transparent 70%)`,
        pointerEvents: 'none'
      }} />

      {/* Top accent line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: '1px',
        background: `linear-gradient(90deg, transparent, ${GOLD}30, transparent)`
      }} />

      <div style={{
        maxWidth: '1000px', width: '100%',
        position: 'relative', zIndex: 2
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: isMobile ? '1.5rem' : '2.5rem' }}>
          <span style={{
            fontSize: isMobile ? '0.55rem' : '0.58rem', fontWeight: '800', letterSpacing: '0.15em',
            color: GOLD, display: 'inline-block', marginBottom: '0.65rem'
          }}>{eyebrow || 'HET SYSTEEM'}</span>
          <h2 style={{
            fontSize: isMobile ? 'clamp(1.6rem, 7.5vw, 2.1rem)' : '2.9rem',
            fontWeight: '900', color: '#fff', margin: 0, lineHeight: 1.15,
            padding: isMobile ? '0 0.25rem' : 0,
          }}>
            {title || (
              <>
                Het{' '}
                <span style={{ color: '#fff' }}>
                  5 Uur Per Week
                </span>
                <br/>Back In Shape Systeem
              </>
            )}
          </h2>
          {subtitle && (
            <p style={{
              margin: isMobile ? '0.9rem auto 0' : '1.1rem auto 0', maxWidth: 620,
              fontSize: isMobile ? '0.98rem' : '1.2rem', fontWeight: 600, lineHeight: 1.45,
              color: 'rgba(255,255,255,0.78)',
            }}>{subtitle}</p>
          )}
        </div>

        {/* Onderdeel-cards — verticale lijst, elk met genummerde titel +
            duidelijke sub-bullets (label: tekst). */}
        <div style={{
          display: 'flex', flexDirection: 'column',
          gap: isMobile ? '0.9rem' : '1.1rem',
          maxWidth: 940, margin: '0 auto'
        }}>
          {PILLARS.map((p, i) => (
            <div key={i} style={{
              borderRadius: '16px',
              overflow: 'hidden',
              background: 'transparent',
              border: 'none',
              display: 'flex',
              // Mobiel: screenshot boven de tekst. Desktop: om en om links/rechts.
              flexDirection: isMobile ? 'column' : (i % 2 === 0 ? 'row-reverse' : 'row'),
            }}>
              {/* Screenshot-kolom — beeld vult de kolom tot de card-randen,
                  geen rand (lijkt los op de card te staan). */}
              <div style={{
                flex: isMobile ? 'none' : '0 0 44%',
                position: 'relative',
                background: 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                minHeight: isMobile ? 160 : 0,
                overflow: 'hidden',
              }}>
                {/* Placeholder — standaard verborgen; verschijnt alleen als de
                    screenshot niet laadt (dus geen rand om een geladen foto). */}
                <div style={{
                  position: 'absolute', inset: 10,
                  borderRadius: 10, border: `1px dashed ${GOLD}44`,
                  display: 'none', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  gap: 6, color: 'rgba(255,255,255,0.35)', textAlign: 'center', padding: '0.5rem',
                }}>
                  <span style={{ fontSize: '1.6rem' }}>📱</span>
                  <span style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.04em' }}>App-screenshot</span>
                </div>
                <img
                  src={p.screenshot}
                  alt={p.title}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                    const ph = e.currentTarget.previousElementSibling
                    if (ph) ph.style.display = 'flex'
                  }}
                  style={{
                    position: 'relative', zIndex: 1, display: 'block',
                    width: '100%', height: isMobile ? 'auto' : '100%',
                    objectFit: 'cover',
                  }}
                />
              </div>

              {/* Tekst-kolom: genummerde titel + sub-bullets */}
              <div style={{ flex: 1, minWidth: 0, padding: isMobile ? '0.9rem 0.95rem 1rem' : '1.25rem 1.35rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: isMobile ? '0.65rem' : '0.85rem' }}>
                  <div style={{
                    flexShrink: 0, width: isMobile ? 28 : 32, height: isMobile ? 28 : 32, borderRadius: '50%',
                    background: 'rgba(255,186,9,0.14)', border: `1.5px solid ${GOLD}66`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: GOLD, fontWeight: '900', fontSize: isMobile ? '0.85rem' : '1rem',
                  }}>{i + 1}</div>
                  <h3 style={{
                    flex: 1, minWidth: 0,
                    fontSize: isMobile ? '1.2rem' : '1.5rem',
                    fontWeight: '900', color: '#fff', margin: 0,
                    lineHeight: 1.15, letterSpacing: '-0.01em',
                  }}>{p.title}</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '0.5rem' : '0.6rem' }}>
                  {p.bullets.map((b, j) => (
                    <div key={j} style={{ display: 'flex', gap: '0.55rem', alignItems: 'flex-start' }}>
                      <span style={{ flexShrink: 0, marginTop: isMobile ? 6 : 7, width: 6, height: 6, borderRadius: '50%', background: GOLD }} />
                      <p style={{ margin: 0, fontSize: isMobile ? '0.85rem' : '0.95rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.45, fontWeight: '500' }}>
                        <span style={{ color: '#fff', fontWeight: '800' }}>{b.label}:</span> {b.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
