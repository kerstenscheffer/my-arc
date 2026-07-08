// src/ui/EmptyState.jsx
// Lege staat = een uitnodiging, nooit een leeg vlak of alleen "Geen data".
// Gedempte tekst die zegt wat je kunt doen + (optioneel) de actieknop eronder.
import { colors, space } from './tokens'
import Button from './Button'

export default function EmptyState({ icon, title, message, actionLabel, onAction, style }) {
  return (
    <div
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
        gap: space[3], padding: `${space[8]}px ${space[4]}px`,
        ...style,
      }}
    >
      {icon && <div style={{ color: colors.textMuted, opacity: 0.8 }}>{icon}</div>}
      {title && <div style={{ fontSize: 15, fontWeight: 800, color: colors.textSecondary }}>{title}</div>}
      {message && <div style={{ fontSize: 15, lineHeight: 1.5, color: colors.textMuted, maxWidth: 360 }}>{message}</div>}
      {actionLabel && onAction && (
        <div style={{ marginTop: space[1] }}>
          <Button variant="primary" onClick={onAction}>{actionLabel}</Button>
        </div>
      )}
    </div>
  )
}
