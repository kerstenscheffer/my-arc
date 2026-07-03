// src/modules/meal-plan/components/MealLogFAB.jsx
//
// Eén ronde gele knop met + om een maaltijd te loggen. Floating rechtsonder,
// boven de client-nav balk. Vervangt de wijde "+ Maaltijd loggen"-knop uit
// AIDaySchedule zodat er één duidelijke log-actie per pagina overblijft.

import React from 'react'
import { Plus } from 'lucide-react'

export default function MealLogFAB({ onClick, isMobile: propMobile }) {
  const isMobile = propMobile ?? (typeof window !== 'undefined' && window.innerWidth <= 768)
  const size = isMobile ? 76 : 84
  // De floating nav-bar zit op bottom:30 + ~62px hoog → we plaatsen de FAB
  // erboven met wat ademruimte zodat ze niet aan elkaar plakken.
  const bottom = isMobile ? 110 : 110

  return (
    <button
      onClick={onClick}
      aria-label="Maaltijd loggen"
      style={{
        position: 'fixed',
        left: isMobile ? 18 : 28,
        bottom,
        zIndex: 90,
        width: size, height: size,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #FFD700 0%, #D4AF37 100%)',
        border: 'none',
        color: '#0a0a0a',
        cursor: 'pointer',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        boxShadow: '0 14px 36px rgba(255,215,0,0.32), 0 4px 12px rgba(0,0,0,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column',
        gap: 0,
        transition: 'transform 0.18s ease, box-shadow 0.18s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.05)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)'
      }}
    >
      <Plus size={isMobile ? 34 : 38} strokeWidth={3} />
      <span style={{
        fontSize: '0.62rem', fontWeight: 900,
        letterSpacing: '0.08em', textTransform: 'uppercase',
        marginTop: -3,
        lineHeight: 1,
      }}>
        Log
      </span>
    </button>
  )
}
