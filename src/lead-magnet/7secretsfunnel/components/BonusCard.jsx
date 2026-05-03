// src/lead-magnet/7secretsfunnel/components/BonusCard.jsx
import { GOLD } from './shared'

const pp = "'Poppins', sans-serif"

export default function BonusCard({ isMobile, onOpen, submitted, isBlocking }) {
  if (submitted) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.6rem',
        padding: isMobile ? '0.85rem 0' : '1rem 0',
        borderTop: '1px solid rgba(255,186,9,0.08)',
      }}>
        <div style={{ width: isMobile ? '3rem' : '3.5rem', flexShrink: 0, textAlign: 'center' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <div style={{ fontFamily: pp, fontSize: isMobile ? '0.78rem' : '0.85rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>
          Je doet mee aan de winactie
        </div>
      </div>
    )
  }

  return (
    <button onClick={onOpen} style={{
      width: '100%', position: 'relative', display: 'flex', alignItems: 'center', gap: '0.75rem',
      padding: isMobile ? '0.95rem 1rem' : '1rem 1.1rem',
      border: 'none', borderRadius: '14px',
      background: 'linear-gradient(145deg, #8b6914 0%, #b8860b 30%, #ffba09 50%, #b8860b 70%, #8b6914 100%)',
      cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
      textAlign: 'left', overflow: 'hidden',
      boxShadow: '0 4px 15px rgba(255,186,9,0.2)',
      animation: isBlocking ? 'ssRowShake 2s ease-in-out 0.5s infinite' : 'none',
    }}>
      {/* Metallic highlight streak — animated */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 48%, rgba(255,255,255,0.25) 50%, rgba(255,255,255,0.15) 52%, transparent 60%)',
        backgroundSize: '200% 100%',
        animation: 'ssShimmer 3s ease-in-out infinite',
      }} />

      {/* Gift icon */}
      <div style={{
        width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
        background: 'rgba(255,255,255,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', zIndex: 1,
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>
      </div>

      {/* Text */}
      <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
        <div style={{ fontFamily: pp, fontSize: isMobile ? '0.95rem' : '1rem', fontWeight: 900, color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.2)' }}>
          Gratis Winactie
        </div>
      </div>

      {/* Arrow */}
      <svg style={{ position: 'relative', zIndex: 1, flexShrink: 0 }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
    </button>
  )
}
