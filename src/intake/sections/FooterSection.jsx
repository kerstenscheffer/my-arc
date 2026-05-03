// src/intake/sections/FooterSection.jsx — DARK
const G = '#C9A84C'

export default function FooterSection({ isMobile }) {
  return (
    <footer style={{ background: '#1a1a1a', padding: isMobile ? '2rem 1rem' : '3rem 2rem', textAlign: 'center' }}>
      <h3 style={{ fontSize: isMobile ? '1.1rem' : '1.3rem', fontWeight: '900', color: G, margin: '0 0 0.5rem', letterSpacing: '0.05em' }}>KERSTEN SCHEFFER</h3>
      <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', margin: '0 0 1.5rem' }}>Online Coaching | Transformatie Programma</p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {['Privacy Policy', 'Algemene Voorwaarden', 'Contact'].map(l => (
          <a key={l} href="#" style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', textDecoration: 'none', fontWeight: '500', transition: 'color 0.2s ease' }}
            onMouseEnter={e => e.currentTarget.style.color = G} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}>{l}</a>
        ))}
      </div>
      <p style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.15)', margin: 0 }}>© {new Date().getFullYear()} Kersten Scheffer. Alle rechten voorbehouden.</p>
    </footer>
  )
}
