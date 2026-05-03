// src/pages/myarcinfo/components/BookCall.jsx
import { GOLD, CALENDLY } from '../constants'

export default function BookCall() {
  const isMobile = window.innerWidth <= 768

  return (
    <section style={{
      background: GOLD,
      padding: isMobile ? '4rem 1.5rem' : '6rem 2rem',
      textAlign: 'center'
    }}>
      <h2 style={{
        fontFamily: '"Anton", sans-serif',
        fontSize: isMobile ? '2.5rem' : '4rem',
        textTransform: 'uppercase',
        color: '#000',
        lineHeight: 1,
        marginBottom: '0.75rem'
      }}>
        KLAAR OM<br />TE STARTEN?
      </h2>

      <p style={{
        fontSize: isMobile ? '0.88rem' : '1rem',
        color: 'rgba(0,0,0,0.55)',
        fontWeight: '600',
        marginBottom: '2rem'
      }}>
        Boek een gratis gesprek. Geen verplichtingen.
      </p>

      <a
        href={CALENDLY}
        target="_blank"
        rel="noreferrer"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          background: '#000',
          color: GOLD,
          fontFamily: '"Anton", sans-serif',
          fontSize: isMobile ? '1rem' : '1.2rem',
          letterSpacing: '0.05em',
          padding: isMobile ? '0.9rem 2rem' : '1.1rem 3rem',
          textDecoration: 'none',
          minHeight: '52px',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent'
        }}
      >
        BOEK EEN GRATIS GESPREK
      </a>

      <div style={{
        marginTop: '1.5rem',
        fontSize: '0.65rem',
        color: 'rgba(0,0,0,0.4)',
        fontWeight: '700',
        letterSpacing: '0.05em'
      }}>
        RESULTAAT OF GELD TERUG · 4.8 OP TRUSTPILOT
      </div>
    </section>
  )
}
