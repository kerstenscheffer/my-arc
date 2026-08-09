// src/sales-call/sections/OfferPilarenSection.jsx
// Donkere offer-sectie voor /sales — 3 pilaren (was 5 losse systemen).
// Gedeelde PILLARS uit PillarenSection.jsx laten we met rust (PhotoFan +
// /start funnel + BackInShapePage hangen eraan); deze data is lokaal.

const GOLD = '#ffba09'

const PILAREN = [
  {
    category: 'Voeding',
    title: 'Altijd Weten Wat Te Eten Systeem',
    subtitle: 'Een aanpak die bij jou past — ook op verjaardagen, feestjes en vakanties.',
    bullets: [
      { label: 'Weten wat je eet', text: 'vaste structuur in de app, zonder rekenen' },
      { label: 'Flexibel', text: 'meedoen met etentjes, een biertje, vakantie — inbouwen, niet wegstrepen' },
    ],
    images: ['/sales-screenshots/eten.png', '/sales-screenshots/meedoen.png'],
  },
  {
    category: 'Training',
    title: 'Elke Training Telt Methode',
    subtitle: 'Schema op maat, uitleg per oefening, feedback op jouw uitvoering.',
    bullets: [
      { label: 'Effectief', text: 'workouts onder een uur, thuis of in de gym' },
      { label: 'Begeleiding', text: "uitlegvideo's + persoonlijke bijsturing" },
    ],
    images: ['/sales-screenshots/trainen.png'],
  },
  {
    category: 'Begeleiding',
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
      padding: isMobile ? '4rem 1rem' : '5.5rem 2rem',
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
        <div style={{ textAlign: 'center', marginBottom: isMobile ? '1.25rem' : '1.75rem' }}>
          <span style={{
            fontSize: isMobile ? '0.55rem' : '0.58rem', fontWeight: '800', letterSpacing: '0.15em',
            color: 'rgba(255,255,255,0.5)', display: 'inline-block', marginBottom: '0.65rem'
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
          gap: isMobile ? '3rem' : '4rem',
          maxWidth: 940, margin: '0 auto'
        }}>
          {PILAREN.map((p, i) => (
            <div key={i} style={{
              borderRadius: '16px',
              display: 'flex',
              flexDirection: isMobile ? 'column' : (i % 2 === 0 ? 'row-reverse' : 'row'),
              alignItems: 'center',
            }}>
              {/* Beeld-kolom — max 40% van de breedte; bewust ondergeschikt aan de titel */}
              <div style={{
                flex: isMobile ? 'none' : '0 0 40%',
                maxWidth: isMobile ? '60%' : '40%',
                width: isMobile ? '60%' : undefined,
                margin: isMobile ? '0 auto' : undefined,
                display: 'flex',
                gap: isMobile ? '0.4rem' : '0.55rem',
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
              <div style={{ flex: 1, minWidth: 0, padding: isMobile ? '0.6rem 0.5rem 0' : '0.5rem 1.35rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '0.65rem' : '0.75rem', marginBottom: isMobile ? '0.4rem' : '0.5rem' }}>
                  <div style={{
                    flexShrink: 0, width: isMobile ? 34 : 42, height: isMobile ? 34 : 42, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.1)', border: '1.5px solid rgba(255,255,255,0.55)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: '900', fontSize: isMobile ? '1.05rem' : '1.35rem',
                  }}>{i + 1}</div>
                  <h3 style={{
                    flex: 1, minWidth: 0,
                    fontSize: isMobile ? '1.25rem' : '1.85rem',
                    fontWeight: '900', color: '#fff', margin: 0,
                    lineHeight: 1.15, letterSpacing: '-0.02em',
                  }}>
                    <span style={{ display: 'block', fontSize: isMobile ? '0.7rem' : '0.8rem', fontWeight: '700', color: GOLD, letterSpacing: '0.04em', marginBottom: '0.2rem' }}>
                      PILAAR {i + 1}: {p.category.toUpperCase()}
                    </span>
                    {p.title}
                  </h3>
                </div>

                {/* Subkop — kleiner, ondergeschikt aan de pilaarnaam */}
                <p style={{
                  margin: `0 0 ${isMobile ? '0.5rem' : '0.6rem'}`,
                  fontSize: isMobile ? '0.82rem' : '0.9rem',
                  fontWeight: '600', color: 'rgba(255,255,255,0.65)', lineHeight: 1.4,
                }}>{p.subtitle}</p>

                {/* Bullets (max 3) — bewust klein */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '0.4rem' : '0.5rem' }}>
                  {p.bullets.map((b, j) => (
                    <div key={j} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                      <span style={{ flexShrink: 0, marginTop: isMobile ? 5 : 6, width: 5, height: 5, borderRadius: '50%', background: 'rgba(255,255,255,0.45)' }} />
                      <p style={{ margin: 0, fontSize: isMobile ? '0.76rem' : '0.84rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.4, fontWeight: '500' }}>
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
                    borderLeft: '2px solid rgba(255,255,255,0.25)',
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
