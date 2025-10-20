// src/modules/progress/components/FridayAlert.jsx
import React from 'react'
import { Star } from 'lucide-react'

const THEME = {
  friday: '#8b5cf6'
}

export default function FridayAlert({ 
  isFriday = false,
  todayEntry = null,
  isMobile = false 
}) {
  
  // Only show if it's Friday and no entry yet
  if (!isFriday || todayEntry) return null
  
  return (
    <div style={{
      background: `linear-gradient(135deg, ${THEME.friday}33 0%, ${THEME.friday}11 100%)`,
      border: `1px solid ${THEME.friday}`,
      borderRadius: '12px',
      padding: isMobile ? '0.75rem' : '1rem',
      marginBottom: '1.5rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      animation: 'pulse 2s infinite'
    }}>
      <Star 
        size={isMobile ? 18 : 20} 
        color={THEME.friday}
        style={{ flexShrink: 0 }}
      />
      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: isMobile ? '0.875rem' : '1rem',
          fontWeight: '600',
          color: THEME.friday,
          marginBottom: '0.125rem'
        }}>
          Vrijdag Weegmoment Vereist!
        </div>
        <div style={{
          fontSize: isMobile ? '0.7rem' : '0.75rem',
          color: THEME.friday,
          opacity: 0.8
        }}>
          Voltooi je wekelijkse weging voor de 8-weken challenge
        </div>
      </div>
      
      <style>{`
        @keyframes pulse {
          0%, 100% { 
            opacity: 1;
            transform: scale(1);
          }
          50% { 
            opacity: 0.9;
            transform: scale(0.98);
          }
        }
      `}</style>
    </div>
  )
}
