// src/modules/meal-plan/components/GelogdOverlay.jsx
//
// Hetzelfde gelogd-moment als in het log-venster, maar dan los over de
// pagina: voor "Afronden" op een maaltijd uit het plan (15 okt 2026).
// Verdwijnt na 1,4 s vanzelf; tikken sluit hem meteen.

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import GelogdAnimatie from './food-log/GelogdAnimatie'

export default function GelogdOverlay({ naam, kcal, label = 'Gelogd!', isMobile, onKlaar }) {
  useEffect(() => {
    const t = setTimeout(() => onKlaar?.(), 1400)
    return () => clearTimeout(t)
  }, [onKlaar])

  return createPortal(
    <div
      onClick={() => onKlaar?.()}
      style={{
        position: 'fixed', inset: 0, zIndex: 10050, background: 'rgba(0,0,0,0.92)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '0 16px', animation: 'goIn 0.2s ease',
      }}
    >
      <style>{'@keyframes goIn { from { opacity: 0; } to { opacity: 1; } }'}</style>
      <div style={{ marginBottom: '1.25rem' }}>
        <GelogdAnimatie grootte={isMobile ? 104 : 120} />
      </div>
      <div style={{ fontSize: isMobile ? '1.5rem' : '1.7rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', marginBottom: '0.3rem', animation: 'goIn 0.3s ease 0.35s both' }}>
        {label}
      </div>
      {naam && (
        <div style={{ fontSize: isMobile ? '0.85rem' : '0.9rem', fontWeight: 700, color: 'rgba(255,255,255,0.55)', textAlign: 'center', maxWidth: 260, animation: 'goIn 0.3s ease 0.45s both' }}>
          {naam}
        </div>
      )}
      {kcal > 0 && (
        <div style={{ fontSize: isMobile ? '0.85rem' : '0.9rem', color: '#fff', fontWeight: 900, marginTop: '0.5rem', animation: 'goIn 0.3s ease 0.55s both' }}>
          +{Math.round(kcal)} kcal
        </div>
      )}
    </div>,
    document.body
  )
}
