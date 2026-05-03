// src/modules/weight-tracker/components/WeightHeader.jsx
// v3.0 AINextMeal DNA — flush, borderBottom, compact, neutral base + gold key elements
// Props IDENTIEK: { fridayData, isMobile }

import React from 'react'
import { Calendar, Trophy } from 'lucide-react'

export default function WeightHeader({ fridayData = {}, isMobile = false }) {
  const today = new Date()
  const isFriday = today.getDay() === 5
  
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: isMobile ? '0.5rem' : '0.625rem',
      padding: isMobile ? '0.625rem 1rem' : '0.75rem 1.5rem',
      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
      overflow: 'hidden',
      maxWidth: '100%',
      boxSizing: 'border-box'
    }}>
      {/* Icon — neutral */}
      <div style={{
        width: isMobile ? '24px' : '28px',
        height: isMobile ? '24px' : '28px',
        borderRadius: '7px',
        background: 'rgba(255, 255, 255, 0.06)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        <Trophy 
          size={isMobile ? 12 : 14} 
          color="rgba(255, 255, 255, 0.4)"
        />
      </div>
      
      {/* Label + Title */}
      <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
        <div style={{
          fontSize: isMobile ? '0.5rem' : '0.55rem',
          fontWeight: '700',
          color: 'rgba(255, 255, 255, 0.3)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          lineHeight: 1,
          marginBottom: '0.15rem',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          8-Week Challenge — {today.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
        <div style={{
          fontSize: isMobile ? '0.85rem' : '0.95rem',
          fontWeight: '800',
          color: '#fff',
          letterSpacing: '-0.01em',
          lineHeight: 1.2,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          Gewicht Tracking
        </div>
      </div>

      {/* Friday count badge — gold accent */}
      <div style={{
        padding: isMobile ? '0.25rem 0.5rem' : '0.3rem 0.625rem',
        background: 'rgba(255, 215, 0, 0.06)',
        border: '1px solid rgba(255, 215, 0, 0.12)',
        borderRadius: '6px',
        flexShrink: 0
      }}>
        <div style={{
          fontSize: isMobile ? '0.75rem' : '0.85rem',
          fontWeight: '900',
          color: '#FFD700',
          lineHeight: 1,
          letterSpacing: '-0.02em'
        }}>
          {fridayData?.friday_count || 0}/8
        </div>
        <div style={{
          fontSize: isMobile ? '0.45rem' : '0.5rem',
          fontWeight: '700',
          color: 'rgba(255, 215, 0, 0.4)',
          textTransform: 'uppercase',
          letterSpacing: '0.03em',
          lineHeight: 1,
          marginTop: '0.1rem'
        }}>
          FRIDAYS
        </div>
      </div>

      {/* Friday live badge */}
      {isFriday && (
        <div style={{
          padding: '0.15rem 0.4rem',
          background: 'rgba(139, 92, 246, 0.15)',
          border: '1px solid rgba(139, 92, 246, 0.25)',
          borderRadius: '4px',
          fontSize: isMobile ? '0.45rem' : '0.5rem',
          fontWeight: '800',
          color: '#8b5cf6',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          flexShrink: 0,
          animation: 'pulse 2s infinite'
        }}>
          LIVE
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}
