// src/sales-call/sections/GarantiePrijsSection.jsx
// Closing section — recap van de 5 onderdelen (foto + beknopte tekst, geen cards)
// + 3 prijs-tiers + garantie. Presentation mode (no buttons).
import PhotoFan from './PhotoFan'

const GOLD = '#ffba09'
const TP_GREEN = '#00B67A'

// Eén prijs: 3 maanden voor €297.
const PRICES = [
  { duration: '3 maanden', amount: '€297' },
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
      <div style={{ maxWidth: '560px', width: '100%' }}>

        {/* ═══ Pakket — 5 foto's overlappend als één fan ═══ */}
        <div style={{ textAlign: 'center', fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: '900', color: '#fff', lineHeight: 1.15, letterSpacing: '-0.01em', marginBottom: isMobile ? '1.25rem' : '1.5rem' }}>5 uur per week in shape programma</div>
        <div style={{ marginBottom: isMobile ? '3rem' : '4rem' }}>
          <PhotoFan isMobile={isMobile} />
        </div>

        {/* ═══ Prijs — platte tekst, geen cards ═══ */}
        <div style={{ textAlign: 'center', marginBottom: isMobile ? '5.5rem' : '7rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '1.1rem' : '1.4rem' }}>
            {PRICES.map((pr) => (
              <div key={pr.duration} style={{ fontSize: isMobile ? '1.5rem' : '1.9rem', fontWeight: '900', color: '#fff', lineHeight: 1.2, letterSpacing: '-0.01em' }}>
                {pr.duration}{' '}
                {pr.was && (
                  <span style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'line-through', textDecorationThickness: '2px', marginRight: '0.4rem', fontWeight: '700' }}>{pr.was}</span>
                )}
                <span style={{ color: GOLD }}>{pr.amount}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ Garantie — geen kop, alleen de belofte ═══ */}
        <div style={{ textAlign: 'center', fontSize: isMobile ? '1.25rem' : '1.5rem', color: '#fff', fontWeight: '700', lineHeight: 1.45, maxWidth: '540px', marginLeft: 'auto', marginRight: 'auto' }}>
          Geen zichtbaar verschil binnen 30 dagen?{' '}
          <span style={{ color: GOLD }}>Dan krijg je je investering terug en loop je weg met 30 dagen gratis coaching.</span>
        </div>

        {/* ═══ Trustpilot — kleine social proof onder de garantie ═══ */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: isMobile ? '1.5rem' : '1.85rem' }}>
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
