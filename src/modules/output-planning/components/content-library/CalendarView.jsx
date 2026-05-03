// src/modules/output-planning/components/content-library/CalendarView.jsx
// Calendar View - MOBILE OPTIMIZED

import {
  ChevronLeft,
  ChevronRight,
  Check,
  FileText
} from 'lucide-react'
import { GOLD, CONTENT_TYPES, DAYS, DAYS_FULL, formatDate } from './constants'

export default function CalendarView({ 
  weekContent, 
  currentWeekMonday, 
  getContentForDay, 
  onStatusChange, 
  onDelete, 
  goToPreviousWeek, 
  goToNextWeek, 
  isMobile 
}) {
  const weekEnd = new Date(currentWeekMonday)
  weekEnd.setDate(weekEnd.getDate() + 6)
  const weekRange = `${formatDate(currentWeekMonday)} - ${formatDate(weekEnd)}`
  
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(currentWeekMonday)
    date.setDate(date.getDate() + i)
    return date
  })
  
  const isToday = (date) => date.toDateString() === new Date().toDateString()

  return (
    <div>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        marginBottom: isMobile ? '1rem' : '1.5rem' 
      }}>
        <button 
          onClick={goToPreviousWeek} 
          style={{
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            width: '44px', 
            height: '44px',
            background: 'rgba(255, 255, 255, 0.05)', 
            border: `1px solid ${GOLD.border}`,
            borderRadius: '10px', 
            color: GOLD.primary, 
            cursor: 'pointer',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent'
          }}
        >
          <ChevronLeft size={20} />
        </button>
        <div style={{ 
          fontSize: isMobile ? '0.9rem' : '1.125rem', 
          fontWeight: '700', 
          color: '#fff' 
        }}>
          {weekRange}
        </div>
        <button 
          onClick={goToNextWeek} 
          style={{
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            width: '44px', 
            height: '44px',
            background: 'rgba(255, 255, 255, 0.05)', 
            border: `1px solid ${GOLD.border}`,
            borderRadius: '10px', 
            color: GOLD.primary, 
            cursor: 'pointer',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent'
          }}
        >
          <ChevronRight size={20} />
        </button>
      </div>
      
      {/* Calendar Grid - 1 column on mobile, 7 on desktop */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(7, 1fr)',
        gap: isMobile ? '0.5rem' : '0.75rem'
      }}>
        {days.map((date, dayIndex) => {
          const dayContent = getContentForDay(dayIndex)
          const today = isToday(date)
          
          return (
            <div 
              key={dayIndex} 
              style={{
                padding: isMobile ? '0.75rem' : '1rem',
                background: today 
                  ? `linear-gradient(135deg, ${GOLD.background} 0%, rgba(0,0,0,0.4) 100%)` 
                  : 'rgba(255, 255, 255, 0.03)',
                borderRadius: '12px',
                border: today ? `2px solid ${GOLD.primary}` : '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              {/* Day Header */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: '0.5rem' 
              }}>
                <span style={{ 
                  fontSize: isMobile ? '0.85rem' : '0.85rem', 
                  fontWeight: '700', 
                  color: today ? GOLD.primary : 'rgba(255, 255, 255, 0.7)' 
                }}>
                  {isMobile ? DAYS_FULL[date.getDay()] : DAYS[date.getDay()]}
                </span>
                <span style={{ 
                  fontSize: isMobile ? '0.8rem' : '0.8rem', 
                  color: 'rgba(255, 255, 255, 0.4)' 
                }}>
                  {date.getDate()}
                </span>
              </div>
              
              {/* Day Content */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                {dayContent.length === 0 ? (
                  <div style={{ 
                    fontSize: '0.75rem', 
                    color: 'rgba(255, 255, 255, 0.3)', 
                    fontStyle: 'italic' 
                  }}>
                    Geen content
                  </div>
                ) : (
                  dayContent.map(item => {
                    const TypeIcon = CONTENT_TYPES[item.type]?.icon || FileText
                    const typeColor = CONTENT_TYPES[item.type]?.color || '#fff'
                    const isCompleted = item.status === 'created' || item.status === 'posted'
                    
                    return (
                      <div 
                        key={item.id} 
                        style={{
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '0.375rem',
                          padding: isMobile ? '0.5rem' : '0.375rem 0.5rem',
                          background: isCompleted ? 'rgba(16, 185, 129, 0.15)' : `${typeColor}15`,
                          borderRadius: '6px',
                          border: `1px solid ${isCompleted ? 'rgba(16, 185, 129, 0.3)' : typeColor + '30'}`
                        }}
                      >
                        <TypeIcon size={isMobile ? 14 : 12} color={isCompleted ? '#10b981' : typeColor} />
                        <span style={{
                          fontSize: isMobile ? '0.75rem' : '0.7rem', 
                          color: isCompleted ? '#10b981' : '#fff',
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis', 
                          whiteSpace: 'nowrap', 
                          flex: 1
                        }}>
                          {isMobile ? item.title : CONTENT_TYPES[item.type]?.label}
                        </span>
                        {isCompleted && <Check size={isMobile ? 12 : 10} color="#10b981" />}
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
