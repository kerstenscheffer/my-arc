// src/pages/myarcinfo/components/Nav.jsx
import { GOLD, CALENDLY } from '../constants'

export default function Nav() {
  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.92)',
      backdropFilter: 'blur(8px)',
      borderBottom: '1px solid rgba(255,255,255,0.08)',
      height: '52px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 1.5rem'
    }}>
      <div style={{
        fontFamily: '"Anton", sans-serif',
        fontSize: '1.1rem',
        letterSpacing: '0.05em',
        color: '#fff'
      }}>
        MY <span style={{ color: GOLD }}>ARC</span>
      </div>
      <a
        href={CALENDLY}
        target="_blank"
        rel="noreferrer"
        style={{
          background: GOLD,
          color: '#000',
          fontFamily: '"Anton", sans-serif',
          fontSize: '0.75rem',
          letterSpacing: '0.05em',
          padding: '0.45rem 1rem',
          border: 'none',
          cursor: 'pointer',
          textDecoration: 'none',
          display: 'block',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent'
        }}
      >
        BOEK GESPREK
      </a>
    </nav>
  )
}
