// src/ui/Card.jsx
// Standaard-kaart: één surface-niveau, radius 16, padding 16, subtiele border.
// prop `highlight` → highlight-variant met dikke gouden linker-accent-rand.
// (Max één highlight-kaart per scherm — dat is een contract-regel, niet
//  afdwingbaar in code; houd je eraan.)
import { colors, radius, space } from './tokens'

export default function Card({ highlight = false, style, children, ...rest }) {
  return (
    <div
      style={{
        background: colors.surface,
        borderRadius: radius.card,
        padding: space[4],
        border: `1px solid ${highlight ? colors.accent : colors.borderSubtle}`,
        borderLeft: highlight ? `4px solid ${colors.accent}` : `1px solid ${colors.borderSubtle}`,
        boxSizing: 'border-box',
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  )
}
