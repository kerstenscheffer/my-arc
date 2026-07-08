// src/ui/tokens.js
// DE bron van waarheid voor styling (JS-kant), zodat inline styles de tokens
// kunnen IMPORTEREN i.p.v. losse hex-codes/pixels in te typen.
// De waardes komen 1-op-1 uit DESIGN-CONTRACT.md — die zijn heilig.

export const colors = {
  bg: '#000000',
  surface: '#141414',
  surfaceHover: '#1e1e1e',
  textPrimary: '#ffffff',
  textSecondary: '#9ca3af',
  textMuted: '#6b7280',
  accent: '#ffd700',
  onAccent: '#000000',
  success: '#22c55e',   // alleen voor succes/behaald/afgerond
  danger: '#ef4444',
  borderSubtle: 'rgba(255,255,255,0.08)',
}

export const radius = { card: 16, btn: 12, pill: 999 }

// Spacing-schaal: alleen 4, 8, 12, 16, 24, 32 px
export const space = { 1: 4, 2: 8, 3: 12, 4: 16, 6: 24, 8: 32 }

export const type = {
  eyebrow: {
    fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
    letterSpacing: '0.08em', color: colors.accent,
  },
  title: { fontSize: 22, fontWeight: 800, color: colors.textPrimary },
  body: { fontSize: 15, lineHeight: 1.5, color: colors.textSecondary },
  statValue: { fontWeight: 800, color: colors.textPrimary },
  statLabel: {
    fontSize: 11, textTransform: 'uppercase',
    letterSpacing: '0.06em', color: colors.textMuted,
  },
}

// Handige, veelgebruikte samenstellingen (optioneel te gebruiken).
export const border = { subtle: `1px solid ${colors.borderSubtle}` }

export default { colors, radius, space, type, border }
