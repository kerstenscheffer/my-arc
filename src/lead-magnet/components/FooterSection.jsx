// ========================================
// 📁 src/lead-magnet/components/FooterSection.jsx
// Eigen kopie — onafhankelijk aanpasbaar
// ========================================

const G = '#C9A84C'

export default function FooterSection({ isMobile }) {
  return (
    <footer style={{
      padding: isMobile ? '2rem 1.25rem' : '2.5rem 2rem',
      background: '#1a1a1a',
      textAlign: 'center'
    }}>
      <div style={{
        fontSize: '0.85rem',
        fontWeight: '800',
        color: G,
        letterSpacing: '0.1em',
        marginBottom: '0.5rem'
      }}>MY ARC</div>
      <p style={{
        fontSize: '0.7rem',
        color: 'rgba(255,255,255,0.3)',
        fontWeight: '500',
        marginBottom: '0.75rem'
      }}>Transform Your Life</p>
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '1.5rem'
      }}>
        <a href="https://www.instagram.com/myarc.nl" target="_blank" rel="noopener noreferrer" style={{
          fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textDecoration: 'none', fontWeight: '500'
        }}>Instagram</a>
        <a href="https://wa.me/31631388756" target="_blank" rel="noopener noreferrer" style={{
          fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textDecoration: 'none', fontWeight: '500'
        }}>WhatsApp</a>
        <a href="/intake" style={{
          fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textDecoration: 'none', fontWeight: '500'
        }}>Intake</a>
      </div>
      <p style={{
        fontSize: '0.6rem',
        color: 'rgba(255,255,255,0.15)',
        marginTop: '1.25rem'
      }}>© 2025 MY ARC. Alle rechten voorbehouden.</p>
    </footer>
  )
}
