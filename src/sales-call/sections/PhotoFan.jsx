// src/sales-call/sections/PhotoFan.jsx
// Overlappende fan van de 5 onderdeel-screenshots — gedeeld door de hero en de
// prijs/garantie-sectie zodat de "boog" overal identiek is.
import { PILLARS } from './PillarenSection'

export default function PhotoFan({ isMobile }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end' }}>
      {PILLARS.map((p, i) => {
        const angles = [-13, -6.5, 0, 6.5, 13]
        const yOff = [22, 6, 0, 6, 22]
        const W = isMobile ? 168 : 252
        return (
          <img
            key={i}
            src={p.screenshot}
            alt={p.title}
            onError={(e) => { e.currentTarget.style.opacity = 0 }}
            style={{
              width: W, height: 'auto', objectFit: 'contain', display: 'block',
              marginLeft: i === 0 ? 0 : -(W * 0.5),
              transform: `rotate(${angles[i]}deg) translateY(${yOff[i]}px)`,
              transformOrigin: 'bottom center',
              zIndex: 10 - Math.abs(i - 2),
              filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.55))',
            }}
          />
        )
      })}
    </div>
  )
}
