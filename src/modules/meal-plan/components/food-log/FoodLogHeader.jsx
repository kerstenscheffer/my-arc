// src/modules/meal-plan/components/food-log/FoodLogHeader.jsx
//
// Kop van het log-venster: titel in bold wit en daaronder een schuifknop
// tussen zoeken en barcode scannen. De drie tabbladen (Zoeken / Snel /
// Maaltijden) zijn vervallen — waar je zoekt kies je nu met de vier knoppen
// eronder, en scannen was een losse knop die over de lijst zweefde.

import React from 'react'
import { Search, Scan, Zap, Camera } from 'lucide-react'

// Foto-scanner tijdelijk uit (15 okt 2026, Kersten: "nog niet helemaal top").
// Alles staat er nog: FotoTab, de edge function maaltijd-foto-scan en de
// weergave in FoodLogModal. Op true zetten en hij is terug.
const FOTO_SCAN_AAN = false

const STANDEN = [
  { id: 'zoeken', label: 'Zoek', Icon: Search, breedte: 1 },
  { id: 'scannen', label: 'Scan', Icon: Scan, breedte: 1 },
  // Foto van je bord: AI herkent de onderdelen, de macro's komen uit onze
  // eigen database (14 okt 2026).
  ...(FOTO_SCAN_AAN ? [{ id: 'foto', label: 'Foto', Icon: Camera, breedte: 0.8 }] : []),
  // Snel invoeren (alleen kcal/macro's) staat hier sinds 14 okt 2026; zijn
  // plek in de rij eronder is voor Coach maaltijden.
  // Drie even grote vakken (27 okt 2026).
  { id: 'snel', label: 'Snel', Icon: Zap, breedte: 1 },
]
const TOTAAL = STANDEN.reduce((t, s) => t + s.breedte, 0)
const LINKS = STANDEN.map((_, i) => STANDEN.slice(0, i).reduce((t, s) => t + s.breedte, 0) / TOTAAL * 100)

export default function FoodLogHeader({ weergave, onWeergave, isMobile }) {
  const actief = Math.max(0, STANDEN.findIndex(st => st.id === weergave))
  return (
    <div style={{ flexShrink: 0 }}>
      <div style={{
        padding: isMobile ? '0.6rem 3rem 0.45rem' : '0.75rem 4rem 0.5rem',
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
      <div style={{ padding: isMobile ? '0 1rem 0.5rem' : '0 1.25rem 0.6rem' }}>
        <div style={{
          position: 'relative',
          display: 'flex',
          background: 'rgba(255,255,255,0.06)',
          borderRadius: 999,
          padding: 3,
        }}>
          <div style={{
            position: 'absolute', top: 3, bottom: 3,
            // Het blokje volgt de breedte van de gekozen stand (binnen de
            // 3px rand van de schuifknop).
            left: `calc(3px + (100% - 6px) * ${LINKS[actief] / 100})`,
            width: `calc((100% - 6px) * ${STANDEN[actief].breedte / TOTAAL})`,
            background: '#fff', borderRadius: 999,
            transition: 'left 0.2s cubic-bezier(0.4, 0, 0.2, 1), width 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          }} />
          {STANDEN.map(stand => {
            const aan = weergave === stand.id
            return (
              <button
                key={stand.id}
                onClick={() => onWeergave(stand.id)}
                style={{
                  position: 'relative', zIndex: 1,
                  flex: stand.breedte, minWidth: 0, minHeight: 34,
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
