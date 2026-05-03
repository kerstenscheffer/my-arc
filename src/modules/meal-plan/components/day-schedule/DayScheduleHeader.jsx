// src/modules/meal-plan/components/day-schedule/DayScheduleHeader.jsx
// 🎯 v2.1 - Green accent on key elements, like tracking uses gold
import React from 'react'
import { Calendar, Copy } from 'lucide-react'

export default function DayScheduleHeader({ dayTemplates, onOpenTemplate, isMobile }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: isMobile ? '0.625rem 1rem' : '0.75rem 1.5rem',
      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
      background: '#000'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <Calendar size={isMobile ? 14 : 16} color="#10b981" strokeWidth={2} />
        <div style={{ minWidth: 0, overflow: 'hidden' }}>
          <div style={{
            fontSize: isMobile ? '0.5rem' : '0.55rem',
            fontWeight: '700',
            color: 'rgba(16, 185, 129, 0.5)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            lineHeight: 1,
            marginBottom: '0.1rem'
          }}>
            Dagschema
          </div>
          <div style={{
            fontSize: isMobile ? '0.85rem' : '0.95rem',
            fontWeight: '800',
            color: '#fff',
            letterSpacing: '-0.01em',
            lineHeight: 1.2
          }}>
            {new Date().toLocaleDateString('nl-NL', { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'long' 
            })}
          </div>
        </div>
      </div>

      {dayTemplates.length > 0 && (
        <button
          onClick={onOpenTemplate}
          style={{
            padding: isMobile ? '0.4rem 0.625rem' : '0.5rem 0.75rem',
            background: 'transparent',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '8px',
            color: 'rgba(255, 255, 255, 0.4)',
            fontSize: isMobile ? '0.65rem' : '0.7rem',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '0.3rem',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            minHeight: '36px'
          }}
        >
          <Copy size={isMobile ? 11 : 12} />
          Template
        </button>
      )}
    </div>
  )
}
