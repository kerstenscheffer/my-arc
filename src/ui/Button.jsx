// src/ui/Button.jsx
// Eén knop-component voor het hele project.
//  variant="primary"   → goud vlak, zwarte bold tekst (max één per scherm)
//  variant="secondary" → transparant, gouden tekst + gouden outline
// Ingebouwde disabled- en loading-staat (spinner). Touch target ≥48px.
import { colors, radius, space, shadow } from './tokens'

export default function Button({
  variant = 'primary',
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  style,
  children,
  ...rest
}) {
  const isPrimary = variant === 'primary'
  const off = disabled || loading

  return (
    <button
      type={type}
      onClick={off ? undefined : onClick}
      disabled={off}
      style={{
        minHeight: 48,
        padding: `0 ${space[4]}px`,
        borderRadius: radius.btn,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: space[2],
        fontSize: 15,
        fontWeight: 800,
        cursor: off ? 'not-allowed' : 'pointer',
        opacity: off ? 0.55 : 1,
        transition: 'opacity .15s ease',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        background: isPrimary ? colors.accent : 'transparent',
        color: isPrimary ? colors.onAccent : colors.accent,
        border: isPrimary ? '1px solid transparent' : `1px solid ${colors.accent}`,
        // Gouden gloed op de primaire knop (uit de workout-pagina).
        boxShadow: isPrimary && !off ? shadow.glow : 'none',
        ...style,
      }}
      {...rest}
    >
      {loading && (
        <span
          aria-hidden="true"
          style={{
            width: 16, height: 16, flexShrink: 0, borderRadius: '50%',
            border: `2px solid ${isPrimary ? 'rgba(0,0,0,0.35)' : 'rgba(255,215,0,0.35)'}`,
            borderTopColor: isPrimary ? colors.onAccent : colors.accent,
            animation: 'ui-spin .8s linear infinite',
          }}
        />
      )}
      {children}
    </button>
  )
}
