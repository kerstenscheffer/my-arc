import React from 'react'
import { Calendar, Trophy } from 'lucide-react'

const THEME = {
  primary: '#dc2626',
  friday: '#8b5cf6'
}

export default function WeightHeader({ 
  fridayData = {},
  isMobile = false 
}) {
  const today = new Date()
  const isFriday = today.getDay() === 5
  
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '1.5rem',
      flexWrap: 'wrap',
      gap: '0.75rem'
    }}>
      <div>
        <h2 style={{
          fontSize: isMobile ? '1.25rem' : '1.5rem',
          fontWeight: 'bold',
          color: '#fff',
          marginBottom: '0.25rem'
        }}>
          8-Week Challenge Weight
        </h2>
        <div style={{
          fontSize: isMobile ? '0.75rem' : '0.85rem',
          color: 'rgba(255,255,255,0.6)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Calendar size={14} />
          {today.toLocaleDateString('nl-NL', { 
            weekday: 'long', 
            day: 'numeric', 
            month: 'long' 
          })}
          {isFriday && (
            <span style={{
              padding: '0.125rem 0.5rem',
              background: WEIGHT_THEME.friday,
              borderRadius: '8px',
              fontSize: '0.7rem',
              fontWeight: '600',
              animation: 'pulse 2s infinite',
              color: '#fff'
            }}>
              FRIDAY
            </span>
          )}
        </div>
      </div>
      
      {/* Friday Badge */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.375rem',
        padding: isMobile ? '0.5rem 0.75rem' : '0.625rem 1rem',
        background: `linear-gradient(135deg, ${THEME.friday}22 0%, ${THEME.friday}11 100%)`,
        borderRadius: '20px',
        border: `1px solid ${THEME.friday}33`
      }}>
        <Trophy size={isMobile ? 14 : 16} color={THEME.friday} />
        <span style={{
          fontSize: isMobile ? '0.75rem' : '0.85rem',
          color: THEME.friday,
          fontWeight: '600'
        }}>
          {fridayData?.friday_count || 0}/8 Fridays
        </span>
      </div>
      
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  )
}
