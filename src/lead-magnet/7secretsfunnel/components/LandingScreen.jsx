// src/lead-magnet/components/LandingScreen.jsx
import { GOLD, ShimmerGold } from './shared'

export default function LandingScreen({ isMobile, onStart }) {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: '2rem',
      textAlign: 'center', animation: 'fadeIn 0.8s ease',
    }}>
      {/* Badge */}
      <div style={{
        background: `${GOLD}12`, border: `1px solid ${GOLD}25`,
        borderRadius: '8px', padding: '0.4rem 0.8rem', marginBottom: '2rem',
      }}>
        <span style={{
          fontSize: '0.65rem', fontWeight: '800', color: GOLD, letterSpacing: '0.12em',
        }}>MY ARC — SUMMER 2026</span>
      </div>

      <h1 style={{ margin: '0 0 0.5rem', lineHeight: 1.1 }}>
        <span style={{
          display: 'block', fontSize: isMobile ? '2.2rem' : '3.2rem',
          fontWeight: '900', color: '#fff', letterSpacing: '-0.03em',
        }}>7 SUMMER SHAPE</span>
        <ShimmerGold style={{ fontSize: isMobile ? '2.6rem' : '3.8rem', display: 'block' }}>
          SECRETS
        </ShimmerGold>
      </h1>

      <p style={{
        fontSize: isMobile ? '0.9rem' : '1rem', color: 'rgba(255,255,255,0.45)',
        lineHeight: 1.6, maxWidth: '380px', margin: '1.5rem 0 2.5rem',
      }}>
        De geheimen die mannen met een summer body gebruiken — en die jij waarschijnlijk nog niet kent.
      </p>

      <button onClick={onStart} style={{
        padding: isMobile ? '1rem 2.5rem' : '1.1rem 3rem', borderRadius: '14px',
        border: `2px solid ${GOLD}`,
        background: `linear-gradient(135deg, ${GOLD} 0%, #e8a800 100%)`,
        color: '#000', fontSize: '1rem', fontWeight: '800', cursor: 'pointer',
        letterSpacing: '0.03em',
        boxShadow: `0 4px 20px rgba(255,186,9,0.3), inset 0 1px 0 rgba(255,255,255,0.3)`,
        transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
      }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translateY(-3px) scale(1.03)'
          e.currentTarget.style.boxShadow = '0 8px 30px rgba(255,186,9,0.45), inset 0 1px 0 rgba(255,255,255,0.3)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'none'
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(255,186,9,0.3), inset 0 1px 0 rgba(255,255,255,0.3)'
        }}
      >ONTDEK DE SECRETS →</button>

      <div style={{ marginTop: '3rem', animation: 'pulse 2s infinite' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2" opacity="0.4">
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </div>
    </div>
  )
}
