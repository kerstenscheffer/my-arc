// src/modules/meal-plan/components/consumed-meals/DaySelector.jsx
// ✅ PREMIUM v1.0 - Week Day Selector
// 🎯 Navigate between days with visual indicators
import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function DaySelector({ 
  currentDay, 
  todayIndex,
  daysOfWeek, 
  onPreviousDay, 
  onNextDay, 
  onDaySelect,
  isMobile 
}) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.8) 0%, rgba(23, 23, 23, 0.6) 100%)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(16, 185, 129, 0.2)',
      borderRadius: '14px',
      padding: isMobile ? '0.75rem' : '0.875rem',
      marginBottom: isMobile ? '1rem' : '1.25rem',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.03)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: isMobile ? '0.375rem' : '0.5rem'
      }}>
        {/* Previous Day Button */}
        <button
          onClick={onPreviousDay}
          style={{
            width: isMobile ? '32px' : '36px',
            height: isMobile ? '32px' : '36px',
            borderRadius: '8px',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            flexShrink: 0,
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            backdropFilter: 'blur(8px)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(16, 185, 129, 0.25)'
            e.currentTarget.style.transform = 'scale(1.05)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(16, 185, 129, 0.15)'
            e.currentTarget.style.transform = 'scale(1)'
          }}
        >
          <ChevronLeft size={isMobile ? 16 : 18} />
        </button>

        {/* Day Pills */}
        <div style={{
          display: 'flex',
          gap: isMobile ? '0.375rem' : '0.5rem',
          flex: 1,
          justifyContent: 'space-evenly'
        }}>
          {daysOfWeek.map((day) => {
            const isSelected = currentDay === day.id
            const isToday = todayIndex === day.id
            
            return (
              <button
                key={day.id}
                onClick={() => onDaySelect(day.id)}
                style={{
                  flex: 1,
                  minWidth: 0,
                  padding: isMobile ? '0.5rem 0.25rem' : '0.625rem 0.375rem',
                  borderRadius: '8px',
                  background: isSelected 
                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(5, 150, 105, 0.15) 100%)'
                    : 'rgba(255, 255, 255, 0.03)',
                  border: isSelected 
                    ? '1px solid rgba(16, 185, 129, 0.4)'
                    : '1px solid rgba(255, 255, 255, 0.08)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  backdropFilter: 'blur(8px)'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'
                    e.currentTarget.style.transform = 'translateY(-1px)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }
                }}
              >
                {isToday && (
                  <div style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#10b981',
                    boxShadow: '0 0 8px rgba(16, 185, 129, 0.6)'
                  }} />
                )}
                
                <div style={{
                  fontSize: isMobile ? '0.7rem' : '0.75rem',
                  fontWeight: '700',
                  color: isSelected ? '#10b981' : 'rgba(255, 255, 255, 0.6)',
                  textAlign: 'center'
                }}>
                  {day.name}
                </div>
              </button>
            )
          })}
        </div>

        {/* Next Day Button */}
        <button
          onClick={onNextDay}
          style={{
            width: isMobile ? '32px' : '36px',
            height: isMobile ? '32px' : '36px',
            borderRadius: '8px',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            flexShrink: 0,
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            backdropFilter: 'blur(8px)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(16, 185, 129, 0.25)'
            e.currentTarget.style.transform = 'scale(1.05)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(16, 185, 129, 0.15)'
            e.currentTarget.style.transform = 'scale(1)'
          }}
        >
          <ChevronRight size={isMobile ? 16 : 18} />
        </button>
      </div>
    </div>
  )
}
