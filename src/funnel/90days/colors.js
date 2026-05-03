// src/funnel/90days/colors.js
// Gold + Dark theme — matching 7secrets funnel styling

export const GOLD = '#ffba09'
export const GOLD_BRIGHT = '#ffd44d'
export const GOLD_DARK = '#e8a800'
export const CALENDLY = 'https://calendly.com/kerstenscheffer/call-met-kersten'
export const pp = "'Poppins', sans-serif"

// Deadline — UPDATE THIS to your actual deadline
export const DEADLINE = new Date('2026-04-01T23:59:59').getTime()

// Gold glossy text component style
export const goldGloss = {
  background: 'linear-gradient(135deg, #402400 0%, #ffba09 25%, #ffd44d 50%, #ffba09 75%, #402400 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
}

// Shimmer button gradient
export const goldButtonBg = 'linear-gradient(145deg, #8b6914 0%, #b8860b 30%, #ffba09 50%, #b8860b 70%, #8b6914 100%)'

// Shimmer overlay style
export const shimmerOverlay = {
  position: 'absolute', inset: 0, pointerEvents: 'none',
  background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 48%, rgba(255,255,255,0.25) 50%, rgba(255,255,255,0.15) 52%, transparent 60%)',
  backgroundSize: '200% 100%',
  animation: 'ssShimmer 3s ease-in-out infinite',
}

// Global animations — inject once in page.jsx
export const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0 }
  body { background: #000; -webkit-font-smoothing: antialiased }
  ::-webkit-scrollbar { display: none }
  @keyframes ssShimmer {
    0% { background-position: 200% center }
    100% { background-position: -200% center }
  }
  @keyframes ssPulseGlow {
    0%, 100% { box-shadow: 0 4px 20px rgba(255,186,9,0.2) }
    50% { box-shadow: 0 4px 35px rgba(255,186,9,0.45), 0 0 0 6px rgba(255,186,9,0.08) }
  }
  @keyframes ssBonusShake {
    0%, 100% { transform: translateX(0) }
    15% { transform: translateX(-3px) rotate(-0.5deg) }
    30% { transform: translateX(3px) rotate(0.5deg) }
    45% { transform: translateX(-2px) }
    60% { transform: translateX(2px) }
    75% { transform: translateX(0) }
  }
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(16px) }
    to { opacity: 1; transform: none }
  }
  .ss-gold-gloss {
    background: linear-gradient(135deg, #402400 0%, #ffba09 25%, #ffd44d 50%, #ffba09 75%, #402400 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
`
