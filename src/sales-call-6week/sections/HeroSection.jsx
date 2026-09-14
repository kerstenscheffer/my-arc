// src/sales-call-6week/sections/HeroSection.jsx
// Hero van de 6-weken challenge — zelfde opbouw als de 16-weken hero (logo,
// titel, twee transformaties, Trustpilot), met een ondertitel eronder omdat
// het aanbod hier meer uitleg nodig heeft.

const TP_GREEN = '#00B67A'

// Dezelfde twee transformaties als de 16-weken pagina.
const TRANSFORMS = [
  { src: '/review-transformatie-1.png', caption: 'Kersten: van zachte buik naar sixpack.' },
  { src: '/review-transformatie-2-16week.png', caption: 'Nitish bouwde spier terwijl zijn vet % daalde.' },
]

export default function HeroSection({ isMobile }) {
  const SECTION_PAD_X = isMobile ? '1rem' : '2rem'

  return (
    <section style={{
      scrollSnapAlign: 'start',
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      padding: isMobile ? '3rem 0' : '4.5rem 0',
      background: '#0a0a0a',
      position: 'relative'
    }}>
      <img
        src="/ma-logo-header.png"
        alt="MY ARC"
        style={{
          width: isMobile ? '104px' : '132px',
          height: 'auto',
          marginBottom: isMobile ? '1rem' : '1.25rem',
          flexShrink: 0
        }}
      />

      <div style={{
        textAlign: 'center',
        padding: `0 ${SECTION_PAD_X}`,
        maxWidth: '900px',
        marginBottom: isMobile ? '1.5rem' : '1.75rem'
      }}>
        <h1 style={{
          fontWeight: '900',
          lineHeight: 1.1,
          margin: 0,
          letterSpacing: '-0.02em',
          color: '#fff',
          fontSize: isMobile ? 'clamp(2rem, 7.8vw, 2.6rem)' : 'clamp(2.6rem, 4.4vw, 3.6rem)',
        }}>
          Gratis 6 Weken 80/20<br />In Shape Challenge
        </h1>
        <p style={{
          margin: `${isMobile ? '0.85rem' : '1.1rem'} auto 0`,
          maxWidth: '640px',
          fontSize: isMobile ? '0.95rem' : '1.1rem',
          fontWeight: '600',
          color: 'rgba(255,255,255,0.7)',
          lineHeight: 1.45,
        }}>
          In 6 weken zichtbaar strakker, sterker, fitter en energieker. Met 3 trainingen
          per week en lekker blijven eten, ook met je gezin. Voor de drukke man die al
          traint, maar z'n vet er eindelijk af wil.
        </p>
      </div>

      <div style={{ width: isMobile ? '70%' : '100%', maxWidth: isMobile ? '100%' : '532px', margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: isMobile ? '0.4rem' : '0.65rem' }}>
          {TRANSFORMS.map((t) => (
            <div key={t.src} style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <div style={{ borderRadius: '9px', overflow: 'hidden', filter: 'drop-shadow(0 8px 18px rgba(0,0,0,0.5))' }}>
                <img src={t.src} alt={t.caption} style={{ width: '100%', height: 'auto', display: 'block' }} />
              </div>
              <p style={{ margin: 0, fontSize: isMobile ? '0.5rem' : '0.62rem', fontWeight: '700', color: 'rgba(255,255,255,0.85)', lineHeight: 1.25, textAlign: 'center' }}>
                {t.caption}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginTop: isMobile ? '1.25rem' : '1.5rem',
        marginBottom: 0
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill={TP_GREEN}/>
        </svg>
        <span style={{ fontSize: '0.65rem', fontWeight: '700', color: 'rgba(255,255,255,0.55)', letterSpacing: '0.04em' }}>TRUSTPILOT</span>
        <span style={{ fontSize: '0.65rem', fontWeight: '800', color: '#fff' }}>4.8</span>
        <div style={{ display: 'flex', gap: '2px' }}>
          {[1,2,3,4,5].map(s => (
            <svg key={s} width={11} height={11} viewBox="0 0 24 24" fill={TP_GREEN}>
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          ))}
        </div>
      </div>
    </section>
  )
}
