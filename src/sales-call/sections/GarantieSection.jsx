// src/sales-call/sections/GarantieSection.jsx
// Rustig, voluit garantie-scherm — eigen sectie tussen de pilaren en de prijs.
const GOLD = '#ffba09'

export default function GarantieSection({ isMobile }) {
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
      padding: isMobile ? '3rem 1.5rem' : '4rem 2rem',
      position: 'relative'
    }}>
      {/* Subtle radial glow */}
      <div style={{
        position: 'absolute',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '620px', height: '620px',
        background: `radial-gradient(circle, rgba(255,186,9,0.05) 0%, transparent 70%)`,
        pointerEvents: 'none'
      }} />

      <div style={{ maxWidth: '640px', width: '100%', textAlign: 'center', position: 'relative', zIndex: 2 }}>
        <span style={{
          fontSize: isMobile ? '0.55rem' : '0.58rem', fontWeight: '800', letterSpacing: '0.15em',
          color: GOLD, display: 'inline-block', marginBottom: isMobile ? '1.25rem' : '1.75rem'
        }}>GARANTIE</span>

        <p style={{
          margin: 0,
          fontSize: isMobile ? '1.4rem' : '2rem',
          fontWeight: '800',
          color: '#fff',
          lineHeight: 1.4,
          letterSpacing: '-0.01em',
        }}>
          Geen zichtbaar verschil binnen 30 dagen?{' '}
          <span style={{ color: GOLD }}>
            Dan krijg je je investering terug en loop je weg met 30 dagen gratis coaching.
          </span>
        </p>
      </div>
    </section>
  )
}
