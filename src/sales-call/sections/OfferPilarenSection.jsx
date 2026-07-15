// src/sales-call/sections/OfferPilarenSection.jsx
// Donkere offer-sectie voor /sales — 3 pilaren (was 5 losse systemen).
// Gedeelde PILLARS uit PillarenSection.jsx laten we met rust (PhotoFan +
// /start funnel + BackInShapePage hangen eraan); deze data is lokaal.

const GOLD = '#ffba09'

const PILAREN = [
  {
    title: 'Altijd Weten Wat Te Eten Systeem',
    subtitle: 'Een aanpak die bij jou past — ook op verjaardagen, feestjes en vakanties.',
    bullets: [
      { label: 'Weten wat je eet', text: 'vaste structuur in de app, zonder rekenen' },
      { label: 'Flexibel', text: 'meedoen met etentjes, een biertje, vakantie — inbouwen, niet wegstrepen' },
    ],
    images: ['/sales-screenshots/eten.png', '/sales-screenshots/meedoen.png'],
  },
  {
    title: 'Elke Training Telt Methode',
    subtitle: 'Schema op maat, uitleg per oefening, feedback op jouw uitvoering.',
    bullets: [
      { label: 'Effectief', text: 'workouts onder een uur, thuis of in de gym' },
      { label: 'Begeleiding', text: "uitlegvideo's + persoonlijke bijsturing" },
    ],
    images: ['/sales-screenshots/trainen.png'],
  },
  {
    title: 'Coach In Jouw Corner',
    subtitle: 'Ik kijk meerdere keren per week met je mee — we zien allebei dat het werkt.',
    bullets: [
      { label: 'Wekelijkse check-in call', text: 'toegang tot mijn agenda' },
      { label: 'Snel bereikbaar', text: 'via de app' },
      { label: 'Ik kijk mee', text: "gewicht, kracht en foto's — progressie zwart-op-wit" },
    ],
    images: ['/sales-screenshots/coach.png', '/sales-screenshots/tracking.png'],
    quote: { text: 'Dit was voor mij het sterkste onderdeel.', author: 'klant, 3 maanden afgerond' },
  },
]

export default function OfferPilarenSection({ isMobile }) {
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

      <div style={{ maxWidth: '1000px', width: '100%', position: 'relative', zIndex: 2 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: isMobile ? '1.75rem' : '2.75rem' }}>
          <span style={{
            fontSize: isMobile ? '0.55rem' : '0.58rem', fontWeight: '800', letterSpacing: '0.15em',
            color: GOLD, display: 'inline-block', marginBottom: '0.65rem'
          }}>HET SYSTEEM</span>
          <h2 style={{
            fontSize: isMobile ? 'clamp(1.6rem, 7.5vw, 2.1rem)' : '2.9rem',
            fontWeight: '900', color: '#fff', margin: 0, lineHeight: 1.15,
            padding: isMobile ? '0 0.25rem' : 0,
          }}>
            Het In Shape Komen &amp; Blijven Systeem
          </h2>
        </div>

        {/* Pilaar-cards — verticale lijst, om en om links/rechts op desktop */}
        <div style={{
          display: 'flex', flexDirection: 'column',
          gap: isMobile ? '1.4rem' : '1.6rem',
          maxWidth: 940, margin: '0 auto'
        }}>
          {PILAREN.map((p, i) => (
            <div key={i} style={{
              borderRadius: '16px',
              display: 'flex',
              flexDirection: isMobile ? 'column' : (i % 2 === 0 ? 'row-reverse' : 'row'),
              alignItems: 'center',
            }}>
              {/* Beeld-kolom — 1 of 2 screenshots naast elkaar */}
              <div style={{
                flex: isMobile ? 'none' : '0 0 44%',
                width: isMobile ? '100%' : undefined,
                display: 'flex',
                gap: isMobile ? '0.5rem' : '0.65rem',
                alignItems: 'center', justifyContent: 'center',
              }}>
                {p.images.map((src) => (
                  <div key={src} style={{ flex: 1, minWidth: 0, borderRadius: '12px', overflow: 'hidden', filter: 'drop-shadow(0 10px 22px rgba(0,0,0,0.55))' }}>
                    <img
                      src={src}
                      alt={p.title}
                      onError={(e) => { e.currentTarget.style.opacity = 0 }}
                      style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'cover' }}
                    />
                  </div>
                ))}
              </div>

              {/* Tekst-kolom */}
              <div style={{ flex: 1, minWidth: 0, padding: isMobile ? '1rem 0.5rem 0' : '1.25rem 1.35rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: isMobile ? '0.5rem' : '0.6rem' }}>
                  <div style={{
                    flexShrink: 0, width: isMobile ? 28 : 32, height: isMobile ? 28 : 32, borderRadius: '50%',
                    background: 'rgba(255,186,9,0.14)', border: `1.5px solid ${GOLD}66`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: GOLD, fontWeight: '900', fontSize: isMobile ? '0.85rem' : '1rem',
                  }}>{i + 1}</div>
                  <h3 style={{
                    flex: 1, minWidth: 0,
                    fontSize: isMobile ? '1.15rem' : '1.45rem',
                    fontWeight: '900', color: '#fff', margin: 0,
                    lineHeight: 1.15, letterSpacing: '-0.01em',
                  }}>{p.title}</h3>
                </div>

                {/* Subkop */}
                <p style={{
                  margin: `0 0 ${isMobile ? '0.75rem' : '0.9rem'}`,
                  fontSize: isMobile ? '0.9rem' : '1rem',
                  fontWeight: '600', color: 'rgba(255,255,255,0.7)', lineHeight: 1.4,
                }}>{p.subtitle}</p>

                {/* Bullets (max 3) */}
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

                {/* Optionele quote (pilaar 3) */}
                {p.quote && (
                  <div style={{
                    marginTop: isMobile ? '0.9rem' : '1.1rem',
                    paddingLeft: '0.85rem',
                    borderLeft: `2px solid ${GOLD}`,
                  }}>
                    <p style={{ margin: 0, fontSize: isMobile ? '0.9rem' : '1rem', fontStyle: 'italic', color: '#fff', fontWeight: '600', lineHeight: 1.4 }}>
                      "{p.quote.text}"
                    </p>
                    <p style={{ margin: '0.3rem 0 0', fontSize: isMobile ? '0.72rem' : '0.78rem', color: 'rgba(255,255,255,0.5)', fontWeight: '600' }}>
                      — {p.quote.author}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
