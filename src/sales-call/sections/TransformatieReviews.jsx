// src/sales-call/sections/TransformatieReviews.jsx
// Witte sectie — echte before/after transformaties (Maand 1 → Maand 3).
// De foto's zijn complete MA-kaarten (labels + logo zitten er al in).

const GOLD = '#ffba09'

const TRANSFORMATIES = [
  { src: '/review-transformatie-1.png', alt: 'Transformatie — maand 1 naar maand 3' },
  { src: '/review-transformatie-2.png', alt: 'Transformatie — maand 1 naar maand 3' },
]

export default function TransformatieReviews({ isMobile }) {
  return (
    <section style={{
      scrollSnapAlign: 'start',
      minHeight: '100vh',
      background: '#fff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: isMobile ? '2.5rem 1.25rem' : '3rem 2rem',
      gap: isMobile ? '1.5rem' : '2rem',
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', maxWidth: 640 }}>
        <span style={{
          fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.15em',
          color: '#e8a800', display: 'inline-block', marginBottom: '0.5rem',
        }}>ECHTE TRANSFORMATIES</span>
        <h2 style={{
          fontSize: isMobile ? '1.6rem' : '2.2rem', fontWeight: 900,
          color: '#1a1a1a', letterSpacing: '-0.02em', lineHeight: 1.1, margin: 0,
        }}>
          Van maand 1 naar <span style={{ borderBottom: `3px solid ${GOLD}` }}>maand 3</span>
        </h2>
      </div>

      {/* Before/after foto's */}
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? '1.25rem' : '2rem',
        width: '100%', maxWidth: 920, justifyContent: 'center',
      }}>
        {TRANSFORMATIES.map((t, i) => (
          <div key={i} style={{
            flex: 1, maxWidth: isMobile ? '100%' : 430,
            borderRadius: 20, overflow: 'hidden', aspectRatio: '4 / 5',
            background: '#f5f5f5', boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
          }}>
            <img src={t.src} alt={t.alt}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </div>
        ))}
      </div>

      {/* Sterren + trust-regel */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {[1, 2, 3, 4, 5].map(s => (
          <svg key={s} width={16} height={16} viewBox="0 0 24 24" fill="#FFD700">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        ))}
        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(0,0,0,0.4)', marginLeft: 6, letterSpacing: '0.02em' }}>
          Echte klanten · echte resultaten
        </span>
      </div>
    </section>
  )
}
