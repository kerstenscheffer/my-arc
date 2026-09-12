// src/modules/meal-plan/components/food-log/FoodLogHeader.jsx
//
// Kop van het log-venster: titel in bold wit en daaronder een schuifknop
// tussen zoeken en barcode scannen. De drie tabbladen (Zoeken / Snel /
// Maaltijden) zijn vervallen — waar je zoekt kies je nu met de vier knoppen
// eronder, en scannen was een losse knop die over de lijst zweefde.

import React from 'react'
import { Search, Scan } from 'lucide-react'

const STANDEN = [
  { id: 'zoeken', label: 'Zoeken', Icon: Search },
  { id: 'scannen', label: 'Scannen', Icon: Scan },
]

export default function FoodLogHeader({ weergave, onWeergave, isMobile }) {
  return (
    <div style={{ flexShrink: 0 }}>
      <div style={{
        padding: isMobile ? '0.7rem 3rem 0.5rem' : '0.85rem 4rem 0.6rem',
        textAlign: 'center',
      }}>
        <div style={{
          fontSize: isMobile ? '1.15rem' : '1.3rem',
          fontWeight: 900, color: '#fff', letterSpacing: '-0.025em'
        }}>
          Voeding loggen
        </div>
      </div>

      {/* Schuifknop: het witte blokje schuift naar de gekozen stand. */}
      <div style={{ padding: isMobile ? '0 1rem 0.6rem' : '0 1.25rem 0.75rem' }}>
        <div style={{
          position: 'relative',
          display: 'flex',
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 999,
          padding: 3,
        }}>
          <div style={{
            position: 'absolute', top: 3, bottom: 3,
            left: weergave === 'scannen' ? 'calc(50% + 1.5px)' : 3,
            width: 'calc(50% - 4.5px)',
            background: '#fff', borderRadius: 999,
            transition: 'left 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          }} />
          {STANDEN.map(stand => {
            const aan = weergave === stand.id
            return (
              <button
                key={stand.id}
                onClick={() => onWeergave(stand.id)}
                style={{
                  position: 'relative', zIndex: 1,
                  flex: 1, minHeight: 36,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  background: 'transparent', border: 'none', borderRadius: 999,
                  color: aan ? '#0a0a0a' : 'rgba(255,255,255,0.6)',
                  fontSize: isMobile ? '0.8rem' : '0.85rem',
                  fontWeight: aan ? 900 : 800,
                  fontFamily: 'inherit', cursor: 'pointer',
                  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                  transition: 'color 0.15s ease',
                }}
              >
                <stand.Icon size={15} strokeWidth={2.6} />
                {stand.label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
