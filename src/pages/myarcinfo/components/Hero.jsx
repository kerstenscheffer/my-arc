// src/pages/myarcinfo/components/Hero.jsx
import { GOLD, CALENDLY } from '../constants'

export default function Hero() {
  const isMobile = window.innerWidth <= 768

  return (
    <section style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      textAlign: 'center',
      padding: isMobile ? '7rem 1.5rem 0.5rem' : '8rem 2rem 1rem',
      maxWidth: '720px',
      margin: '0 auto'
    }}>

      {/* Title */}
      <h1 style={{
        fontFamily: '"Anton", sans-serif',
        fontSize: isMobile ? '2.9rem' : '4.5rem',
        lineHeight: 1.05,
        textTransform: 'uppercase',
        marginBottom: '1.75rem',
        letterSpacing: '-0.01em'
      }}>
        JE <i style={{ color: GOLD }}>DROOMFYSIEK<br />
        BEREIKEN</i> ALS<br />
        DRUKKE JONGE MAN.
      </h1>

      {/* Sub */}
      <p style={{
        fontSize: isMobile ? '0.95rem' : '1.05rem',
        color: 'rgba(255,255,255,0.5)',
        fontWeight: '500',
        lineHeight: 1.7,
        maxWidth: '480px',
        marginBottom: '2rem'
      }}>
        Direct richting je doelen zonder tijd te verspillen.<br />
        Resultaat dat je ziet, kennis die je bij je houdt.
      </p>


      {/* YouTube Short */}
      <div style={{
        width: '100%',
        maxWidth: '340px',
        aspectRatio: '9/16',
        marginBottom: '2rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <iframe
          src="https://www.youtube.com/embed/OGEwj7_N3X8"
          title="MY ARC coaching"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            position: 'absolute',
            top: 0, left: 0
          }}
        />
      </div>

      {/* Featured review — wit, compact */}
      <div style={{
        background: '#fff',
        padding: '1rem 1.25rem',
        marginBottom: '2rem',
        textAlign: 'left',
        width: '100%',
        maxWidth: '520px',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '2px' }}>
            {[1,2,3,4,5].map(i => (
              <svg key={i} width="12" height="12" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill={GOLD} stroke="none"/>
              </svg>
            ))}
          </div>
          <span style={{ fontSize: '0.6rem', color: 'rgba(0,0,0,0.35)', fontWeight: '700' }}>Hessel · feb 2026 · Trustpilot</span>
        </div>
        <p style={{
          fontSize: '0.8rem',
          color: '#000',
          lineHeight: 1.55,
          fontWeight: '600',
          margin: 0
        }}>
          "Van 79,8 naar 74,4 kg in 8 weken. Als jij je aan het plan houdt zal Kersten altijd de volle 100% geven!"
        </p>
      </div>

      {/* CTA */}
      <a
        href={CALENDLY}
        target="_blank"
        rel="noreferrer"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: GOLD,
          color: '#000',
          fontFamily: '"Anton", sans-serif',
          fontSize: isMobile ? '1rem' : '1.15rem',
          letterSpacing: '0.05em',
          padding: isMobile ? '0.9rem 2rem' : '1rem 2.75rem',
          textDecoration: 'none',
          minHeight: '52px',
          width: '100%',
          maxWidth: '520px',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent'
        }}
      >
        BOEK EEN GRATIS GESPREK
      </a>

      {/* Trust */}
      <div style={{
        marginTop: '1.25rem',
        fontSize: '0.65rem',
        color: 'rgba(255,255,255,0.25)',
        fontWeight: '600',
        letterSpacing: '0.05em'
      }}>
        ★ 4.8 op Trustpilot · Resultaat of geld terug
      </div>
    </section>
  )
}
