// src/modules/nutrition-intake/components/IntakeHeader.jsx
// Intake header — MY ARC links, INTAKE FORMULIER rechts
// Strak, goud accent, geen rommel

import React from 'react'

export default function IntakeHeader({ clientData, isMobile }) {
  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: '#000',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: isMobile ? '0.75rem 1rem' : '0.85rem 1.5rem',
    }}>
      <div style={{ fontSize: isMobile ? '0.75rem' : '0.8rem', fontWeight: 900, color: '#FFD700', letterSpacing: '0.12em' }}>
        MY ARC
      </div>
      <div style={{ fontSize: isMobile ? '0.52rem' : '0.55rem', fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        Intake Formulier
      </div>
    </div>
  )
}
