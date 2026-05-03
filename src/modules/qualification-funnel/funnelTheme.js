// src/modules/qualification-funnel/funnelTheme.js
// Premium Gold/Black Theme - Instagram Level Design

export const funnelTheme = {
  // Primary Colors
  gold: '#D4AF37',
  goldLight: '#F4E4BC',
  goldDark: '#B8962E',
  
  // Gradients
  goldGradient: 'linear-gradient(135deg, #D4AF37 0%, #F4E4BC 50%, #D4AF37 100%)',
  goldGradientText: 'linear-gradient(135deg, #D4AF37 0%, #F4E4BC 100%)',
  goldGradientButton: 'linear-gradient(135deg, #D4AF37 0%, #B8962E 100%)',
  goldGradientBorder: 'linear-gradient(135deg, rgba(212, 175, 55, 0.5) 0%, rgba(244, 228, 188, 0.3) 100%)',
  
  // Backgrounds
  black: '#000000',
  blackLight: '#0a0a0a',
  blackCard: '#111111',
  
  // Text
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  textMuted: 'rgba(255, 255, 255, 0.5)',
  textGold: '#D4AF37',
  
  // Borders
  borderSubtle: 'rgba(255, 255, 255, 0.08)',
  borderGold: 'rgba(212, 175, 55, 0.3)',
  borderGoldStrong: 'rgba(212, 175, 55, 0.5)',
  
  // Shadows
  shadowGold: '0 0 40px rgba(212, 175, 55, 0.15)',
  shadowGoldStrong: '0 0 60px rgba(212, 175, 55, 0.25)',
  shadowDark: '0 20px 60px rgba(0, 0, 0, 0.8)',
  
  // Glows
  glowGold: '0 0 20px rgba(212, 175, 55, 0.4)',
  glowGoldText: '0 0 30px rgba(212, 175, 55, 0.3)',
}

// Responsive helpers
export const getResponsiveValue = (isMobile, mobileVal, desktopVal) => {
  return isMobile ? mobileVal : desktopVal
}

// Common styles
export const commonStyles = {
  // Container base
  container: (isMobile) => ({
    minHeight: '100vh',
    background: funnelTheme.black,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: isMobile ? '1.5rem 1rem' : '2rem',
    position: 'relative',
    overflow: 'hidden'
  }),
  
  // Gold text gradient
  goldText: {
    background: funnelTheme.goldGradientText,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  
  // Premium button
  goldButton: (isMobile) => ({
    background: funnelTheme.goldGradientButton,
    border: 'none',
    borderRadius: '0',
    padding: isMobile ? '1rem 2rem' : '1.25rem 3rem',
    fontSize: isMobile ? '1rem' : '1.1rem',
    fontWeight: '700',
    color: '#000',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    boxShadow: funnelTheme.shadowGold,
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
    minHeight: '54px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem'
  }),
  
  // Option card
  optionCard: (isMobile, isSelected = false) => ({
    background: isSelected 
      ? 'rgba(212, 175, 55, 0.1)' 
      : 'rgba(255, 255, 255, 0.02)',
    border: `1px solid ${isSelected ? funnelTheme.borderGoldStrong : funnelTheme.borderSubtle}`,
    borderRadius: '0',
    padding: isMobile ? '1.25rem' : '1.5rem',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
    minHeight: '60px',
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    textAlign: 'left'
  }),
  
  // Subtle line decoration
  goldLine: {
    width: '60px',
    height: '2px',
    background: funnelTheme.goldGradient,
    margin: '0 auto'
  }
}

export default funnelTheme
