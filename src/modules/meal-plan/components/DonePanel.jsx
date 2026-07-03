// src/modules/meal-plan/components/DonePanel.jsx
//
// Toont een rustige "je zit op koers vandaag"-staat zodra alle geplande
// maaltijden voor vandaag zijn afgevinkt. Zonder dit voelde een afgewerkte
// dag visueel onafgerond — net of er nog iets moest.

import React from 'react'
import { Check, Trophy } from 'lucide-react'

export default function DonePanel({ kcalRemaining, isMobile: propMobile }) {
  const isMobile = propMobile ?? (typeof window !== 'undefined' && window.innerWidth <= 768)
  const overBudget = (kcalRemaining ?? 0) < 0
  return (
    <div style={{
      margin: isMobile ? '0.75rem 0.9rem' : '1rem 1.5rem',
      padding: isMobile ? '1.1rem 1.1rem' : '1.4rem 1.5rem',
      background: overBudget
        ? 'linear-gradient(135deg, rgba(239,68,68,0.08) 0%, rgba(245,158,11,0.04) 100%)'
        : 'linear-gradient(135deg, rgba(16,185,129,0.10) 0%, rgba(255,215,0,0.04) 100%)',
      border: `1px solid ${overBudget ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.25)'}`,
      borderRadius: 14,
      display: 'flex', alignItems: 'center', gap: isMobile ? 12 : 16,
    }}>
      <div style={{
        width: isMobile ? 44 : 52, height: isMobile ? 44 : 52,
        borderRadius: 12,
        background: overBudget ? 'rgba(239,68,68,0.18)' : 'rgba(16,185,129,0.2)',
        border: `1px solid ${overBudget ? 'rgba(239,68,68,0.4)' : 'rgba(16,185,129,0.4)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        {overBudget
          ? <Check size={isMobile ? 22 : 26} color="#f59e0b" strokeWidth={2.8} />
          : <Trophy size={isMobile ? 22 : 26} color="#10b981" strokeWidth={2.4} />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: isMobile ? '1rem' : '1.1rem',
          fontWeight: 900, color: '#fff',
          letterSpacing: '-0.015em', lineHeight: 1.15,
          marginBottom: 3,
        }}>
          {overBudget ? 'Klaar — net iets over budget' : 'Klaar voor vandaag'}
        </div>
        <div style={{
          fontSize: isMobile ? '0.78rem' : '0.85rem',
          color: 'rgba(255,255,255,0.6)',
          lineHeight: 1.4,
        }}>
          {overBudget
            ? 'Plan is af. Geen ramp — pak morgen weer netjes op.'
            : 'Alle maaltijden van je plan zijn gelogd. Mooi werk.'}
        </div>
      </div>
    </div>
  )
}
