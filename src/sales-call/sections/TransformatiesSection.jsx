// src/sales-call/sections/TransformatiesSection.jsx
// Donkere sectie met 3 echte transformaties (foto + kort tekstje), in de stijl
// van de rest van de /sales-pagina.
const GOLD = '#ffba09'

const TRANSFORMS = [
  { src: '/review-transformatie-3.png', caption: 'Saskia verloor 5 kilo in 3 maanden — een blijvende gezonde levensstijl.' },
  { src: '/review-transformatie-1.png', caption: 'Kersten ging van zachte buik naar sixpack in 3 maanden.' },
  { src: '/review-transformatie-2.png', caption: 'Nitish bouwde spieren op terwijl zijn vetpercentage alleen maar daalde.' },
]

export default function TransformatiesSection({ isMobile }) {
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
      <div style={{ maxWidth: '1000px', width: '100%' }}>
        {/* Kop */}
        <div style={{ textAlign: 'center', marginBottom: isMobile ? '2rem' : '3rem' }}>
          <div style={{ fontSize: isMobile ? '0.7rem' : '0.8rem', fontWeight: '800', letterSpacing: '0.12em', textTransform: 'uppercase', color: GOLD, marginBottom: '0.6rem' }}>
            Echte resultaten
          </div>
          <h2 style={{ margin: 0, fontSize: isMobile ? '1.6rem' : '2.4rem', fontWeight: '900', color: '#fff', lineHeight: 1.15, letterSpacing: '-0.01em' }}>
            Transformaties in 3 maanden
          </h2>
        </div>

        {/* 3 foto's + tekstjes */}
        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? '1.75rem' : '1.5rem',
          alignItems: 'stretch'
        }}>
          {TRANSFORMS.map((t) => (
            <div key={t.src} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: isMobile ? '0.75rem' : '0.9rem' }}>
              <div style={{ borderRadius: '14px', overflow: 'hidden', filter: 'drop-shadow(0 10px 24px rgba(0,0,0,0.5))' }}>
                <img
                  src={t.src}
                  alt={t.caption}
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                />
              </div>
              <p style={{
                margin: 0,
                fontSize: isMobile ? '0.9rem' : '0.98rem',
                fontWeight: '800',
                color: '#fff',
                lineHeight: 1.4,
                textAlign: 'center'
              }}>
                {t.caption}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
