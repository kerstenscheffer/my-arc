// src/sales-call-16week/sections/OfferPilarenSection.jsx
// Offer-pijler — ÉÉN pijler per volledig scherm (focus per pijler). De page
// rendert 'm 3× via de `index`-prop. Data lokaal; styling gelijk aan het
// origineel, alleen nu gecentreerd en groter voor focus.

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

export const PILAAR_COUNT = PILAREN.length

export default function OfferPilarenSection({ isMobile, index = 0 }) {
  const p = PILAREN[index] || PILAREN[0]
  // Om en om links/rechts op desktop voor ritme tussen de schermen.
  const imgFirst = index % 2 === 0

  return (
    <section style={{
      scrollSnapAlign: 'start',
      minHeight: '100dvh',
      background: '#0a0a0a',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: isMobile ? '4rem 1.25rem' : '5.5rem 2rem',
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

      <div style={{ maxWidth: '960px', width: '100%', position: 'relative', zIndex: 2 }}>
        {/* Kleine methode-eyebrow — continuïteit tussen de 3 pijler-schermen */}
        <div style={{ textAlign: 'center', marginBottom: isMobile ? '1.5rem' : '2.25rem' }}>
          <span style={{
            fontSize: isMobile ? '0.55rem' : '0.58rem', fontWeight: '800', letterSpacing: '0.15em',
            color: 'rgba(255,255,255,0.5)',
          }}>MY ARC-METHODE · {index + 1}/{PILAAR_COUNT}</span>
        </div>

        {/* Pijler — beeld + tekst, gecentreerd en groot */}
        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : (imgFirst ? 'row-reverse' : 'row'),
          alignItems: 'center',
          gap: isMobile ? '1.75rem' : '3rem',
        }}>
          {/* Beeld-kolom */}
          <div style={{
            flex: isMobile ? 'none' : '0 0 42%',
            maxWidth: isMobile ? '72%' : '42%',
            width: isMobile ? '72%' : undefined,
            margin: isMobile ? '0 auto' : undefined,
            display: 'flex',
            gap: isMobile ? '0.5rem' : '0.65rem',
            alignItems: 'center', justifyContent: 'center',
          }}>
            {p.images.map((src) => (
              <div key={src} style={{ flex: 1, minWidth: 0, borderRadius: '14px', overflow: 'hidden', filter: 'drop-shadow(0 12px 26px rgba(0,0,0,0.55))' }}>
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
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '0.75rem' : '0.9rem', marginBottom: isMobile ? '0.6rem' : '0.75rem' }}>
              <div style={{
                flexShrink: 0, width: isMobile ? 42 : 56, height: isMobile ? 42 : 56, borderRadius: '50%',
                background: 'rgba(255,255,255,0.1)', border: '1.5px solid rgba(255,255,255,0.55)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: '900', fontSize: isMobile ? '1.3rem' : '1.7rem',
              }}>{index + 1}</div>
              <h3 style={{
                flex: 1, minWidth: 0,
                fontSize: isMobile ? '1.55rem' : '2.35rem',
                fontWeight: '900', color: '#fff', margin: 0,
                lineHeight: 1.12, letterSpacing: '-0.02em',
              }}>
                <span style={{ display: 'block', fontSize: isMobile ? '0.75rem' : '0.9rem', fontWeight: '700', color: GOLD, letterSpacing: '0.04em', marginBottom: '0.25rem' }}>
                  PIJLER {index + 1}: {p.category.toUpperCase()}
                </span>
                {p.title}
              </h3>
            </div>

            {/* Subkop */}
            <p style={{
              margin: `0 0 ${isMobile ? '0.85rem' : '1.1rem'}`,
              fontSize: isMobile ? '0.95rem' : '1.1rem',
              fontWeight: '600', color: 'rgba(255,255,255,0.7)', lineHeight: 1.45,
            }}>{p.subtitle}</p>

            {/* Bullets */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '0.55rem' : '0.65rem' }}>
              {p.bullets.map((b, j) => (
                <div key={j} style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
                  <span style={{ flexShrink: 0, marginTop: isMobile ? 7 : 8, width: 6, height: 6, borderRadius: '50%', background: GOLD }} />
                  <p style={{ margin: 0, fontSize: isMobile ? '0.9rem' : '1rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.45, fontWeight: '500' }}>
                    <span style={{ color: '#fff', fontWeight: '800' }}>{b.label}:</span> {b.text}
                  </p>
                </div>
              ))}
            </div>

            {/* Optionele quote (pijler 3) */}
            {p.quote && (
              <div style={{
                marginTop: isMobile ? '1.1rem' : '1.4rem',
                paddingLeft: '0.95rem',
                borderLeft: '2px solid rgba(255,255,255,0.25)',
              }}>
                <p style={{ margin: 0, fontSize: isMobile ? '1rem' : '1.15rem', fontStyle: 'italic', color: '#fff', fontWeight: '600', lineHeight: 1.4 }}>
                  "{p.quote.text}"
                </p>
                <p style={{ margin: '0.35rem 0 0', fontSize: isMobile ? '0.78rem' : '0.85rem', color: 'rgba(255,255,255,0.5)', fontWeight: '600' }}>
                  — {p.quote.author}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
