// src/modules/meal-plan/components/day-schedule/DaySelector.jsx
// 🎯 v2.1 - Green accent selected, green dot for today
import React from 'react'

export default function DaySelector({ days, currentDay, onDayClick, isToday, isMobile }) {
  const todayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1
  
  return (
    <div style={{
      padding: isMobile ? '0.5rem 1rem' : '0.625rem 1.5rem',
      background: '#000'
    }}>
      <div style={{
        display: 'flex',
        gap: isMobile ? '0.25rem' : '0.375rem',
        justifyContent: 'space-between'
      }}>
        {days.map((day) => {
          const isDayToday = day.id === todayIdx
          const isSelected = day.id === currentDay
          
          return (
            <button
              key={day.id}
              onClick={() => onDayClick(day.id)}
              style={{
                flex: 1,
                height: isMobile ? '38px' : '42px',
                borderRadius: '8px',
                background: isSelected ? '#10b981' : 'transparent',
                border: isSelected
                  ? '1px solid rgba(16, 185, 129, 0.5)'
                  : '1px solid rgba(255, 255, 255, 0.06)',
                color: isSelected ? '#fff' : isDayToday ? '#10b981' : 'rgba(255, 255, 255, 0.4)',
                fontSize: isMobile ? '0.7rem' : '0.75rem',
                fontWeight: isSelected || isDayToday ? '800' : '600',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                textTransform: 'uppercase',
                letterSpacing: '-0.02em',
                padding: 0,
                position: 'relative'
              }}
            >
              {day.name}
              {/* Green dot for today */}
              {isDayToday && !isSelected && (
                <div style={{
                  position: 'absolute',
                  bottom: '4px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '4px',
                  height: '4px',
                  borderRadius: '50%',
                  background: '#10b981'
                }} />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
