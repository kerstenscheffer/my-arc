// src/ui/Eyebrow.jsx
// Het gouden caps-label boven een sectie ("OP DE GOEDE WEG", "GESCHIEDENIS").
import { type } from './tokens'

export default function Eyebrow({ children, style, ...rest }) {
  return (
    <span style={{ display: 'inline-block', ...type.eyebrow, ...style }} {...rest}>
      {children}
    </span>
  )
}
