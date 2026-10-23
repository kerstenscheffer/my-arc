// src/pages/leadmagnet/stijl.js
// Kleuren, lettertype en kleine hulpjes van de lead magnets (/mijn-split,
// /mijn-menu), los van de componenten in Bouwstenen.jsx.
export const BG = '#000'
export const HERO_BG = '#161616'
export const CTA_GROEN = '#15803d'
export const WIT = '#fff'
export const ZWAK = 'rgba(255,255,255,0.55)'
export const FONT = "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"

export const emailOk = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e || '').trim())


export const knopWit = (m, uit = false) => ({
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10,
  minHeight: m ? 58 : 64, padding: m ? '0 1.4rem' : '0 2rem', width: '100%', borderRadius: 14, border: 'none',
  background: uit ? 'rgba(255,255,255,0.12)' : WIT, color: uit ? ZWAK : '#000',
  fontSize: m ? '1.05rem' : '1.15rem', fontWeight: 900, letterSpacing: '-0.01em', whiteSpace: 'nowrap',
  cursor: uit ? 'default' : 'pointer', fontFamily: 'inherit', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
})
export const invoer = (m) => ({
  width: '100%', boxSizing: 'border-box', padding: m ? '0.72rem 0.95rem' : '0.8rem 1.05rem',
  background: '#050505', border: '1.5px solid rgba(255,255,255,0.14)', borderRadius: 12,
  color: WIT, fontSize: m ? '1.05rem' : '1.1rem', fontWeight: 800, fontFamily: 'inherit', outline: 'none',
})
