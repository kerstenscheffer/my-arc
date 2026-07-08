// src/ui/ImageCard.jsx
// Kaart met een foto als achtergrond + donkere gradient zodat tekst altijd
// leesbaar blijft. Gebaseerd op de hero- en dag-kaartjes van de workout-pagina
// (bron van waarheid). Opties: progressiebalk onderaan, badge rechtsboven
// (bijv. percentage), eyebrow + titel onderin. `compact` = kleine tegel.
import { colors, radius, space, type, shadow, gradientImage, gradientAccent } from './tokens'

export default function ImageCard({
  image,
  title,
  eyebrow,
  badge,            // korte tekst rechtsboven, bv. "85%"
  progress = null,  // 0–100 → gouden balk onderaan
  active = false,   // gouden rand + gloed (zoals "vandaag"-dagkaart)
  compact = false,
  onClick,
  height,
  style,
  children,
}) {
  const h = height ?? (compact ? 112 : 180)

  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative',
        height: h,
        borderRadius: compact ? 14 : radius.card,
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        border: active ? `1px solid ${colors.accent}` : `1px solid ${colors.borderSubtle}`,
        boxShadow: active ? shadow.glow : 'none',
        backgroundColor: colors.surface,
        backgroundImage: image ? `url(${image})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        ...style,
      }}
    >
      {/* Leesbaarheids-gradient over de foto */}
      <div style={{ position: 'absolute', inset: 0, background: gradientImage, pointerEvents: 'none' }} />

      {/* Badge rechtsboven (bv. percentage) */}
      {badge != null && (
        <div style={{
          position: 'absolute', top: space[2], right: space[2],
          background: colors.accent, color: colors.onAccent,
          fontSize: 11, fontWeight: 900, letterSpacing: '0.04em',
          padding: '3px 8px', borderRadius: radius.pill,
        }}>
          {badge}
        </div>
      )}

      {/* Tekst onderin */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        padding: compact ? space[2] : space[3],
        display: 'flex', flexDirection: 'column', gap: 2,
        textAlign: compact ? 'center' : 'left',
      }}>
        {eyebrow && !compact && (
          <span style={{ ...type.eyebrow, textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}>{eyebrow}</span>
        )}
        {title && (
          <span style={{
            fontSize: compact ? 12 : 18, fontWeight: 800, color: colors.textPrimary,
            letterSpacing: '-0.02em', lineHeight: 1.2,
            textShadow: '0 1px 3px rgba(0,0,0,0.7)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {title}
          </span>
        )}
        {children}
      </div>

      {/* Progressiebalk onderaan (gouden gradient) */}
      {progress != null && (
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 5, background: 'rgba(0,0,0,0.4)' }}>
          <div style={{
            width: `${Math.max(0, Math.min(100, progress))}%`, height: '100%',
            background: gradientAccent, transition: 'width 0.3s ease',
          }} />
        </div>
      )}
    </div>
  )
}
