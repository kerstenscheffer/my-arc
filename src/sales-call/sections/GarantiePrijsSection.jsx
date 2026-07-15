// src/sales-call/sections/GarantiePrijsSection.jsx
// Prijs-scherm (slotsectie) — 3 transformaties compact → prijs → case study →
// Trustpilot. Geen knoppen, geen urgentie. De €297 is het grootste element.
const GOLD = '#ffba09'
const TP_GREEN = '#00B67A'

// Dezelfde 3 transformaties als in de hero, maar compact (rij van drie).
const TRANSFORMS = [
  { src: '/review-transformatie-3.png', caption: 'Van 85 naar 78,5 kg' },
  { src: '/review-transformatie-1.png', caption: 'Zachte buik → sixpack' },
  { src: '/review-transformatie-2.png', caption: 'Spier op, vet omlaag' },
]

export default function GarantiePrijsSection({ isMobile }) {
  return (
    <section style={{
      scrollSnapAlign: 'start',
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0a0a0a',
      overflow: 'hidden',
      padding: isMobile ? '3rem 1.25rem' : '4rem 2rem'
    }}>
      <div style={{ maxWidth: '620px', width: '100%' }}>

        {/* ═══ Transformaties — bewust compact (de prijs domineert) ═══ */}
        <div style={{ display: 'flex', gap: isMobile ? '0.45rem' : '0.6rem', maxWidth: isMobile ? '78%' : '75%', margin: `0 auto ${isMobile ? '2.5rem' : '3.25rem'}` }}>
          {TRANSFORMS.map((t) => (
            <div key={t.src} style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <div style={{ borderRadius: '8px', overflow: 'hidden', filter: 'drop-shadow(0 6px 14px rgba(0,0,0,0.5))' }}>
                <img src={t.src} alt={t.caption} style={{ width: '100%', height: 'auto', display: 'block' }} />
              </div>
              <p style={{ margin: 0, fontSize: isMobile ? '0.52rem' : '0.64rem', fontWeight: '700', color: 'rgba(255,255,255,0.65)', lineHeight: 1.2, textAlign: 'center' }}>
                {t.caption}
              </p>
            </div>
          ))}
        </div>

        {/* ═══ Prijs — veruit het grootste element van dit scherm ═══ */}
        <div style={{ textAlign: 'center', marginBottom: isMobile ? '2rem' : '2.5rem' }}>
          <div style={{ fontSize: isMobile ? '4.2rem' : '6.2rem', fontWeight: '900', color: GOLD, lineHeight: 1, letterSpacing: '-0.03em' }}>
            €297
          </div>
          <div style={{ marginTop: isMobile ? '0.7rem' : '0.95rem', fontSize: isMobile ? '0.95rem' : '1.15rem', fontWeight: '700', color: '#fff', lineHeight: 1.3 }}>
            3 maanden, het volledige traject
          </div>
        </div>

        {/* ═══ Case study-regel ═══ */}
        <div style={{ textAlign: 'center', marginBottom: isMobile ? '1.5rem' : '1.85rem' }}>
          <p style={{ margin: 0, fontSize: isMobile ? '0.85rem' : '0.95rem', fontStyle: 'italic', color: 'rgba(255,255,255,0.6)', fontWeight: '500', lineHeight: 1.4 }}>
            Hessel: van 79,8 naar 74,4 kg in 8 weken.
          </p>
        </div>

        {/* ═══ Trustpilot — kleine social proof ═══ */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill={TP_GREEN}/>
          </svg>
          <span style={{ fontSize: '0.7rem', fontWeight: '700', color: 'rgba(255,255,255,0.55)', letterSpacing: '0.04em' }}>TRUSTPILOT</span>
          <span style={{ fontSize: '0.7rem', fontWeight: '800', color: '#fff' }}>4.8</span>
          <div style={{ display: 'flex', gap: '2px' }}>
            {[1, 2, 3, 4, 5].map(s => (
              <svg key={s} width={12} height={12} viewBox="0 0 24 24" fill={TP_GREEN}>
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            ))}
          </div>
        </div>

      </div>
    </section>
  )
}
