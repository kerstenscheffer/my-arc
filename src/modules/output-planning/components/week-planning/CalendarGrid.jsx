// src/modules/output-planning/components/week-planning/CalendarGrid.jsx
// Desktop 7-column calendar grid with timeline
// UPDATED v2.5: Added batch items support with color detection

import { useState, useRef, useEffect } from 'react'
import { 
  GOLD, 
  DAYS_FULL, 
  TIMELINE, 
  getTimePosition,
  formatTime
} from './constants'
import ContentBlock from './content-block/ContentBlock'
import { getItemColor } from '../../../content-batches/constants'

export default function CalendarGrid({
  weekDays,
  items,
  contentPieces,
  salesPieces,
  batchItems = [],
  getPieceForItem,
  multiSelectMode = false,
  selectedItemIds = new Set(),
  onToggleItemSelect,
  onItemDrop,
  onTimeSlotClick,
  onItemToggleComplete,
  onItemEdit,
  onItemDelete,
  onDeleteRecurringTemplate,
  onViewScript,
  onMoveToNextWeek,
  onMoveToPrevWeek,
  onUnschedule,
  onOpenCaption
}) {
  console.log('📊 CalendarGrid render - multiSelectMode:', multiSelectMode, 'selectedItemIds size:', selectedItemIds?.size)
  
  const timelineRef = useRef(null)
  const [currentTimePosition, setCurrentTimePosition] = useState(0)
  const [hoveredSlot, setHoveredSlot] = useState(null)
  
  // Calculate total timeline height
  const totalHours = TIMELINE.endHour - TIMELINE.startHour
  const timelineHeight = totalHours * TIMELINE.hourHeight
  
  // Time labels array
  const timeLabels = []
  for (let h = TIMELINE.startHour; h <= TIMELINE.endHour; h++) {
    timeLabels.push(`${h.toString().padStart(2, '0')}:00`)
  }
  
  // Update current time indicator
  useEffect(() => {
    const updateCurrentTime = () => {
      const now = new Date()
      const hours = now.getHours()
      const minutes = now.getMinutes()
      
      if (hours >= TIMELINE.startHour && hours < TIMELINE.endHour) {
        const position = (hours - TIMELINE.startHour) * TIMELINE.hourHeight + 
                        (minutes / 60) * TIMELINE.hourHeight
        setCurrentTimePosition(position)
      } else {
        setCurrentTimePosition(-1)
      }
    }
    
    updateCurrentTime()
    const interval = setInterval(updateCurrentTime, 60000)
    return () => clearInterval(interval)
  }, [])
  
  // Scroll to current time on mount
  useEffect(() => {
    if (timelineRef.current && currentTimePosition > 0) {
      const scrollTarget = Math.max(0, currentTimePosition - 100)
      timelineRef.current.scrollTop = scrollTarget
    }
  }, [])
  
  // ============================================
  // UPDATED: Combine regular items + batch items
  // ============================================
  
  // Get ALL items for a specific day (regular + batch), sorted by time
  const getItemsForDay = (dayOfWeek) => {
    // Get regular items
    const regularItems = items
      .filter(item => item.day_of_week === dayOfWeek && item.scheduled_time)
      .map(item => ({ ...item, isBatchItem: false }))
    
    // Get batch items for this day
    const batchItemsForDay = batchItems
      .filter(item => {
        // Batch items use day_of_week from their planned_date
        // Need to convert planned_date to day name
        if (!item.planned_date) return false
        
        const date = new Date(item.planned_date + 'T00:00:00')
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
        const itemDayOfWeek = dayNames[date.getDay()]
        
        return itemDayOfWeek === dayOfWeek
      })
      .map(item => ({ 
        ...item, 
        isBatchItem: true,
        // Batch items might have planned_time, default to 12:00 if not
        scheduled_time: item.planned_time || '12:00'
      }))
    
    // Combine and sort by time
    return [...regularItems, ...batchItemsForDay]
      .sort((a, b) => (a.scheduled_time || '12:00').localeCompare(b.scheduled_time || '12:00'))
  }
  
  // Get unscheduled items for a day
  const getUnscheduledForDay = (dayOfWeek) => {
    return items.filter(item => item.day_of_week === dayOfWeek && !item.scheduled_time)
  }
  
  // Get piece for an item (content OR sales) - batch items don't have pieces
  const getPiece = getPieceForItem || ((item) => {
    if (item.isBatchItem) return null  // Batch items don't have separate pieces
    
    if (item.content_piece_id) {
      return contentPieces.find(cp => cp.id === item.content_piece_id)
    }
    if (item.sales_piece_id) {
      return salesPieces?.find(sp => sp.id === item.sales_piece_id)
    }
    return null
  })
  
  // Group items by hour for stacking
  const getItemsGroupedByHour = (dayOfWeek) => {
    const dayItems = getItemsForDay(dayOfWeek)
    const grouped = {}
    
    dayItems.forEach(item => {
      const time = item.scheduled_time || '12:00'
      const hour = parseInt(time.split(':')[0])
      if (!grouped[hour]) {
        grouped[hour] = []
      }
      grouped[hour].push(item)
    })
    
    return grouped
  }
  
  // Handle drag over
  const handleDragOver = (e, dayOfWeek, hour) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setHoveredSlot({ dayOfWeek, hour })
  }
  
  // Handle drop
  const handleDrop = (e, dayOfWeek, hour) => {
    e.preventDefault()
    setHoveredSlot(null)
    
    const itemId = e.dataTransfer.getData('itemId')
    if (itemId && dayOfWeek) {
      const time = `${hour.toString().padStart(2, '0')}:00`
      onItemDrop(itemId, dayOfWeek, time)
    }
  }
  
  // Handle drag leave
  const handleDragLeave = () => {
    setHoveredSlot(null)
  }
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden',
      background: 'rgba(0, 0, 0, 0.3)',
      borderRadius: '12px',
      border: '1px solid rgba(255, 255, 255, 0.1)'
    }}>
      {/* Day Headers */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '60px repeat(7, 1fr)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'linear-gradient(180deg, #1a1a1a 0%, #141414 100%)'
      }}>
        {/* Empty corner */}
        <div style={{
          padding: '0.75rem 0.5rem',
          borderRight: '1px solid rgba(255, 255, 255, 0.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <span style={{ fontSize: '0.65rem', color: 'rgba(255, 255, 255, 0.3)' }}>
            TIJD
          </span>
        </div>
        
        {/* Day headers */}
        {weekDays.map((day, idx) => {
          const isToday = new Date().toDateString() === new Date(day.date).toDateString()
          const unscheduledCount = getUnscheduledForDay(day.dayOfWeek).length
          
          return (
            <div
              key={day.dayOfWeek || idx}
              style={{
                padding: '0.75rem 0.5rem',
                borderRight: idx < 6 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none',
                textAlign: 'center',
                background: isToday ? GOLD.background : 'transparent'
              }}
            >
              <div style={{
                fontSize: '0.7rem',
                fontWeight: '600',
                color: isToday ? GOLD.primary : 'rgba(255, 255, 255, 0.4)',
                textTransform: 'uppercase',
                marginBottom: '0.25rem'
              }}>
                {DAYS_FULL[idx]?.substring(0, 3)}
              </div>
              <div style={{
                fontSize: '1.125rem',
                fontWeight: '700',
                color: isToday ? GOLD.primary : '#fff'
              }}>
                {new Date(day.date).getDate()}
              </div>
              {unscheduledCount > 0 && (
                <div style={{
                  marginTop: '0.25rem',
                  padding: '0.125rem 0.375rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '4px',
                  fontSize: '0.6rem',
                  color: 'rgba(255, 255, 255, 0.5)',
                  display: 'inline-block'
                }}>
                  +{unscheduledCount}
                </div>
              )}
            </div>
          )
        })}
      </div>
      
      {/* Timeline Grid */}
      <div
        ref={timelineRef}
        style={{
          flex: 1,
          overflow: 'auto',
          position: 'relative'
        }}
      >
        <div style={{
          display: 'grid',
          gridTemplateColumns: '60px repeat(7, 1fr)',
          minHeight: `${timelineHeight}px`,
          position: 'relative'
        }}>
          {/* Time Labels Column */}
          <div style={{
            borderRight: '1px solid rgba(255, 255, 255, 0.05)',
            position: 'relative'
          }}>
            {timeLabels.map((label, idx) => (
              <div
                key={label}
                style={{
                  height: `${TIMELINE.hourHeight}px`,
                  padding: '0.25rem 0.5rem',
                  fontSize: '0.65rem',
                  fontWeight: '600',
                  color: 'rgba(255, 255, 255, 0.4)',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'flex-end'
                }}
              >
                {label}
              </div>
            ))}
          </div>
          
          {/* Day Columns */}
          {weekDays.map((day, dayIdx) => {
            const groupedItems = getItemsGroupedByHour(day.dayOfWeek)
            const isToday = new Date().toDateString() === new Date(day.date).toDateString()
            
            return (
              <div
                key={day.dayOfWeek || dayIdx}
                style={{
                  borderRight: dayIdx < 6 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none',
                  position: 'relative',
                  background: isToday ? 'rgba(255, 215, 0, 0.02)' : 'transparent'
                }}
              >
                {/* Hour slots */}
                {timeLabels.map((_, hourIdx) => {
                  const hour = TIMELINE.startHour + hourIdx
                  const isHovered = hoveredSlot?.dayOfWeek === day.dayOfWeek && hoveredSlot?.hour === hour
                  const hourItems = groupedItems[hour] || []
                  
                  return (
                    <div
                      key={hourIdx}
                      onDragOver={(e) => handleDragOver(e, day.dayOfWeek, hour)}
                      onDrop={(e) => handleDrop(e, day.dayOfWeek, hour)}
                      onDragLeave={handleDragLeave}
                      onClick={() => onTimeSlotClick(day.dayOfWeek, `${hour.toString().padStart(2, '0')}:00`)}
                      style={{
                        height: `${TIMELINE.hourHeight}px`,
                        borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
                        cursor: 'pointer',
                        transition: 'background 0.15s ease',
                        background: isHovered 
                          ? 'rgba(255, 215, 0, 0.1)' 
                          : 'transparent',
                        position: 'relative',
                        padding: '2px'
                      }}
                    >
                      {/* Stack items within this hour slot - UPDATED: Handle batch items */}
                      {hourItems.map((item, itemIdx) => {
                        const piece = getPiece(item)
                        
                        // BATCH ITEM DETECTION
                        const isBatchItem = item.isBatchItem || false
                        
                        return (
                          <div
                            key={item.id}
                            style={{
                              marginBottom: '2px'
                            }}
                          >
                            <ContentBlock
                              item={item}
                              contentPiece={piece}
                              isBatchItem={isBatchItem}
                              multiSelectMode={multiSelectMode}
                              isSelected={selectedItemIds.has(item.id)}
                              onToggleSelect={() => onToggleItemSelect?.(item.id)}
                              onToggleComplete={onItemToggleComplete}
                              onDelete={onItemDelete}
                              onDeleteRecurringTemplate={onDeleteRecurringTemplate}
                              onViewScript={onViewScript}
                              onMoveToNextWeek={onMoveToNextWeek}
                              onMoveToPrevWeek={onMoveToPrevWeek}
                              onUnschedule={onUnschedule}
                              onOpenCaption={onOpenCaption}
                              isMobile={false}
                            />
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
                
                {/* Current time indicator */}
                {isToday && currentTimePosition > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: `${currentTimePosition}px`,
                      left: 0,
                      right: 0,
                      height: '2px',
                      background: '#ef4444',
                      zIndex: 20,
                      pointerEvents: 'none'
                    }}
                  >
                    <div style={{
                      position: 'absolute',
                      left: '-4px',
                      top: '-4px',
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: '#ef4444'
                    }} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
