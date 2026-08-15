// src/sales-call/sections/GarantiePrijsSection.jsx
// Prijs-scherm (slotsectie) — 3 transformaties compact → prijs → case study →
// Trustpilot. Geen knoppen, geen urgentie. De €297 is het grootste element.
const GOLD = '#ffba09'
const TP_GREEN = '#00B67A'

// Dezelfde 3 transformaties als in de hero, maar compact (rij van drie).
const TRANSFORMS = [
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
      padding: isMobile ? '4.5rem 1.25rem' : '6rem 2rem'
    }}>
      <div style={{ maxWidth: '620px', width: '100%' }}>

        {/* ═══ Transformaties — bewust compact (de prijs domineert) ═══ */}
        <div style={{ display: 'flex', gap: isMobile ? '0.45rem' : '0.6rem', maxWidth: isMobile ? '78%' : '75%', margin: `0 auto ${isMobile ? '1.75rem' : '2rem'}` }}>
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

        {/* ═══ De investering — 3 trajecten, simpel onder elkaar (geen vakjes) ═══ */}
        <div style={{ textAlign: 'center', marginBottom: isMobile ? '0.9rem' : '1.1rem' }}>
          <span style={{ fontSize: isMobile ? '0.6rem' : '0.65rem', fontWeight: '800', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.5)' }}>DE INVESTERING</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '0.3rem' : '0.4rem', marginBottom: isMobile ? '1.25rem' : '1.5rem' }}>
          {[
            { m: '16 weken', p: '€1000' },
          ].map((tier) => (
            <div key={tier.m} style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: isMobile ? '0.6rem' : '0.85rem' }}>
              <span style={{ fontSize: isMobile ? '1rem' : '1.2rem', fontWeight: '700', color: 'rgba(255,255,255,0.85)' }}>
                {tier.m}
              </span>
              <span style={{ fontSize: isMobile ? '2rem' : '2.6rem', fontWeight: '900', color: '#fff', lineHeight: 1, letterSpacing: '-0.02em' }}>
                {tier.p}
              </span>
            </div>
          ))}
        </div>

        {/* ═══ Garantie — verplaatst vanuit de losse garantie-sectie ═══ */}
        <p style={{
          margin: `0 auto ${isMobile ? '1.5rem' : '1.75rem'}`,
          maxWidth: '480px', textAlign: 'center',
          fontSize: isMobile ? '0.9rem' : '1.05rem',
          fontWeight: '700', color: '#fff', lineHeight: 1.4, letterSpacing: '-0.01em',
        }}>
          Geen succesvolle transformatie?{' '}
          <span style={{ color: GOLD }}>Krijg je investering terug.</span>
        </p>

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
