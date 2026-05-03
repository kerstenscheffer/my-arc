// src/modules/weight-tracker/components/FridayAlert.jsx
// v3.0 AINextMeal DNA — flush alert bar, no border-radius, compact
// Props IDENTIEK: { isFriday, todayEntry, isMobile }

import React from 'react'
import { Scale } from 'lucide-react'

export default function FridayAlert({ isFriday = false, todayEntry = null, isMobile = false }) {
  if (!isFriday || todayEntry) return null
  
  return (
    <div style={{
      position: 'relative',
      background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, rgba(139, 92, 246, 0.04) 100%)',
      borderBottom: '1px solid rgba(139, 92, 246, 0.15)',
      display: 'flex',
      alignItems: 'center',
      gap: isMobile ? '0.5rem' : '0.625rem',
      padding: isMobile ? '0.5rem 1rem' : '0.625rem 1.5rem',
      overflow: 'hidden'
    }}>
      {/* Top accent line */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: '1px',
        background: 'linear-gradient(90deg, transparent 0%, #8b5cf6 50%, transparent 100%)',
        opacity: 0.4
      }} />

      <Scale 
        size={isMobile ? 14 : 16} 
        color="#8b5cf6"
        style={{ flexShrink: 0, opacity: 0.7 }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: isMobile ? '0.7rem' : '0.75rem',
          fontWeight: '800',
          color: '#8b5cf6',
          textTransform: 'uppercase',
          letterSpacing: '0.03em',
          lineHeight: 1.2
        }}>
          Vrijdag Weegmoment Vereist
        </div>
        <div style={{
          fontSize: isMobile ? '0.55rem' : '0.6rem',
          color: 'rgba(139, 92, 246, 0.6)',
          fontWeight: '500',
          marginTop: '0.1rem'
        }}>
          Wekelijkse weging voor de 8-weken challenge
        </div>
      </div>
    </div>
  )
}
