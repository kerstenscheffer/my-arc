// src/components/vetpercentage/VetpercentageFoto.jsx
// Foto voor de vetpercentage-kiezers. Laadvolgorde: lokaal → extern → neutraal
// vlak met het label, zodat de keuze altijd te maken blijft.
import { useState } from 'react'
import { BF_FOTOS } from './fotos'

export default function VetpercentageFoto({ value, label, eerste = false, style }) {
  const foto = BF_FOTOS[value]
  const [poging, setPoging] = useState(0)
  const src = poging === 0 ? foto?.src : poging === 1 ? foto?.extern : null

  if (!src) {
    return (
      <div role="img" aria-label={label} style={{
        ...style, width: '100%', aspectRatio: '2/3', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)',
        fontWeight: 800, fontSize: '0.8rem',
      }}>
        {label}
      </div>
    )
  }

  return (
    <img
      src={src} alt={label}
      width={400} height={600}
      loading={eerste ? 'eager' : 'lazy'}
      decoding="async"
      onError={() => setPoging(p => p + 1)}
      style={{
        width: '100%', height: 'auto', aspectRatio: '2/3',
        objectFit: 'cover', objectPosition: 'top', display: 'block',
        ...style,
      }}
    />
  )
}
