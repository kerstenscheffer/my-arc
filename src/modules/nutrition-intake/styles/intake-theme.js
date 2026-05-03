// src/modules/nutrition-intake/styles/intake-theme.js
// INTAKE THEME v3.0 - Aligned with MY ARC Styling Guide 13/03/2026
// #FFD700 gold, zero emojis, compact data-driven

export const intakeTheme = {
  colors: {
    gold: '#FFD700',
    darkGold: '#D4AF37',
    black: '#000',
    card: '#111',
    border: 'rgba(255, 255, 255, 0.04)',
    borderVisible: 'rgba(255, 255, 255, 0.08)',
    borderGold: 'rgba(255, 215, 0, 0.2)',
    borderGoldActive: 'rgba(255, 215, 0, 0.4)',
    white: '#fff',
    textPrimary: '#fff',
    textSecondary: 'rgba(255, 255, 255, 0.5)',
    textMuted: 'rgba(255, 255, 255, 0.25)',
    textGold: '#FFD700',
    green: '#10b981',
    red: '#ef4444',
    amber: '#f59e0b',
    greenBg: 'rgba(16, 185, 129, 0.06)',
    redBg: 'rgba(239, 68, 68, 0.06)',
    goldBg: 'rgba(255, 215, 0, 0.04)',
    goldBgStrong: 'rgba(255, 215, 0, 0.08)',
    inputBg: '#111',
  }
}

export const r = (isMobile, mob, desk) => isMobile ? mob : desk

export default intakeTheme
