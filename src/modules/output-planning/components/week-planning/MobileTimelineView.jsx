// src/modules/output-planning/components/week-planning/MobileTimelineView.jsx
// Mobile single-day timeline view with horizontal day selector
// UPDATED v2.3: Added batch items support

import { useState, useRef, useEffect } from 'react'
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus,
  Calendar
} from 'lucide-react'
import { 
  GOLD, 
  DAYS_FULL, 
  DAYS,
  TIMELINE, 
  getTimePosition,
  formatTime
} from './constants'
import ContentBlock, { ContentBlockCompact } from './ContentBlock'

export default function MobileTimelineView({
  weekDays,
  items,
  contentPieces,
  salesPieces,
  batchItems = [],
  getPieceForItem,
  multiSelectMode = false,
  selectedItemIds = new Set(),
  onToggleItemSelect,
  selectedDayIndex,
  onDaySelect,
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
  onOpenCaption,
  onViewBatchItem,
  onEditBatchItem,
  onAddClick
}) {
  const timelineRef = useRef(null)
  const [currentTimePosition, setCurrentTimePosition] = useState(0)
  
  const selectedDay = weekDays[selectedDayIndex]
  
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
  
  // Scroll to current time on mount/day change
  useEffect(() => {
    if (timelineRef.current) {
      const isToday = selectedDay && 
        new Date().toDateString() === new Date(selectedDay.date).toDateString()
      
      if (isToday && currentTimePosition > 0) {
        const scrollTarget = Math.max(0, currentTimePosition - 100)
        timelineRef.current.scrollTop = scrollTarget
      } else {
        // Scroll to 9:00 by default
        timelineRef.current.scrollTop = 3 * TIMELINE.hourHeight
      }
    }
  }, [selectedDayIndex, selectedDay])
  
  // ============================================
  // UPDATED: Combine regular items + batch items
  // ============================================
  
  // Get ALL scheduled items for selected day (regular + batch)
  const getScheduledItems = () => {
    if (!selectedDay) return []
    
    // Regular items
    const regularItems = items
      .filter(item => item.day_of_week === selectedDay.dayOfWeek && item.scheduled_time)
      .map(item => ({ ...item, isBatchItem: false }))
    
    // Batch items for this day
    const batchItemsForDay = batchItems
      .filter(item => {
        if (!item.planned_date) return false
        
        const date = new Date(item.planned_date + 'T00:00:00')
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
        const itemDayOfWeek = dayNames[date.getDay()]
        
        return itemDayOfWeek === selectedDay.dayOfWeek
      })
      .map(item => ({ 
        ...item, 
        isBatchItem: true,
        scheduled_time: item.planned_time || '12:00'
      }))
    
    // Combine and sort
    return [...regularItems, ...batchItemsForDay]
      .sort((a, b) => (a.scheduled_time || '12:00').localeCompare(b.scheduled_time || '12:00'))
  }
  
  const getUnscheduledItems = () => {
    if (!selectedDay) return []
    // Only regular items can be unscheduled (batch items are always scheduled)
    return items.filter(item => item.day_of_week === selectedDay.dayOfWeek && !item.scheduled_time)
  }
  
  // UPDATED: Handle batch items - they don't have pieces
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
  
  const scheduledItems = getScheduledItems()
  const unscheduledItems = getUnscheduledItems()
  const isToday = selectedDay && 
    new Date().toDateString() === new Date(selectedDay.date).toDateString()
  
  // Handle drop on timeline - USES dayOfWeek string
  const handleDrop = (e, hour) => {
    e.preventDefault()
    const itemId = e.dataTransfer.getData('itemId')
    if (itemId && selectedDay) {
      const time = `${hour.toString().padStart(2, '0')}:00`
      onItemDrop(itemId, selectedDay.dayOfWeek, time)
    }
  }
  
  // Swipe handling for day navigation
  const [touchStart, setTouchStart] = useState(null)
  
  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientX)
  }
  
  const handleTouchEnd = (e) => {
    if (!touchStart) return
    
    const touchEnd = e.changedTouches[0].clientX
    const diff = touchStart - touchEnd
    
    if (Math.abs(diff) > 50) {
      if (diff > 0 && selectedDayIndex < 6) {
        onDaySelect(selectedDayIndex + 1)
      } else if (diff < 0 && selectedDayIndex > 0) {
        onDaySelect(selectedDayIndex - 1)
      }
    }
    
    setTouchStart(null)
  }
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden'
    }}>
      {/* Day Selector */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.75rem',
        background: 'rgba(0, 0, 0, 0.3)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        {/* Prev Button */}
        <button
          onClick={() => selectedDayIndex > 0 && onDaySelect(selectedDayIndex - 1)}
          disabled={selectedDayIndex === 0}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            color: selectedDayIndex === 0 ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.6)',
            cursor: selectedDayIndex === 0 ? 'not-allowed' : 'pointer',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent'
          }}
        >
          <ChevronLeft size={18} />
        </button>
        
        {/* Day Pills */}
        <div style={{
          flex: 1,
          display: 'flex',
          gap: '0.375rem',
          justifyContent: 'center',
          overflow: 'hidden'
        }}>
          {weekDays.map((day, idx) => {
            const isSelected = idx === selectedDayIndex
            const dayIsToday = new Date().toDateString() === new Date(day.date).toDateString()
            
            // Check if day has items (regular OR batch)
            const hasRegularItems = items.some(item => item.day_of_week === day.dayOfWeek)
            const hasBatchItems = batchItems.some(item => {
              if (!item.planned_date) return false
              const date = new Date(item.planned_date + 'T00:00:00')
              const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
              const itemDayOfWeek = dayNames[date.getDay()]
              return itemDayOfWeek === day.dayOfWeek
            })
            const hasItems = hasRegularItems || hasBatchItems
            
            return (
              <button
                key={day.dayOfWeek || idx}
                onClick={() => onDaySelect(idx)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '0.375rem 0.5rem',
                  background: isSelected 
                    ? `linear-gradient(135deg, ${GOLD.background} 0%, rgba(0,0,0,0.3) 100%)`
                    : 'transparent',
                  border: isSelected 
                    ? `1px solid ${GOLD.border}`
                    : '1px solid transparent',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  minWidth: '36px'
                }}
              >
                <span style={{
                  fontSize: '0.6rem',
                  fontWeight: '600',
                  color: dayIsToday 
                    ? GOLD.primary 
                    : isSelected 
                      ? 'rgba(255, 255, 255, 0.8)' 
                      : 'rgba(255, 255, 255, 0.4)',
                  textTransform: 'uppercase'
                }}>
                  {DAYS[idx]}
                </span>
                <span style={{
                  fontSize: '0.9rem',
                  fontWeight: '700',
                  color: dayIsToday 
                    ? GOLD.primary 
                    : isSelected 
                      ? '#fff' 
                      : 'rgba(255, 255, 255, 0.6)'
                }}>
                  {new Date(day.date).getDate()}
                </span>
                {hasItems && (
                  <div style={{
                    width: '4px',
                    height: '4px',
                    borderRadius: '50%',
                    background: isSelected ? GOLD.primary : 'rgba(255, 255, 255, 0.3)',
                    marginTop: '2px'
                  }} />
                )}
              </button>
            )
          })}
        </div>
        
        {/* Next Button */}
        <button
          onClick={() => selectedDayIndex < 6 && onDaySelect(selectedDayIndex + 1)}
          disabled={selectedDayIndex === 6}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            color: selectedDayIndex === 6 ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.6)',
            cursor: selectedDayIndex === 6 ? 'not-allowed' : 'pointer',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent'
          }}
        >
          <ChevronRight size={18} />
        </button>
      </div>
      
      {/* Day Header */}
      {selectedDay && (
        <div style={{
          padding: '0.75rem 1rem',
          background: isToday ? GOLD.background : 'rgba(0, 0, 0, 0.2)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{
              fontSize: '1rem',
              fontWeight: '700',
              color: isToday ? GOLD.primary : '#fff'
            }}>
              {DAYS_FULL[selectedDayIndex]}
            </div>
            <div style={{
              fontSize: '0.75rem',
              color: 'rgba(255, 255, 255, 0.5)'
            }}>
              {new Date(selectedDay.date).toLocaleDateString('nl-NL', { 
                day: 'numeric', 
                month: 'long' 
              })}
            </div>
          </div>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            {scheduledItems.length > 0 && (
              <span style={{
                padding: '0.25rem 0.5rem',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '6px',
                fontSize: '0.7rem',
                fontWeight: '600',
                color: 'rgba(255, 255, 255, 0.6)'
              }}>
                {scheduledItems.length} gepland
              </span>
            )}
          </div>
        </div>
      )}
      
      {/* Unscheduled Items Section */}
      {unscheduledItems.length > 0 && (
        <div style={{
          padding: '0.75rem 1rem',
          background: 'rgba(0, 0, 0, 0.2)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{
            fontSize: '0.7rem',
            fontWeight: '600',
            color: 'rgba(255, 255, 255, 0.4)',
            marginBottom: '0.5rem',
            textTransform: 'uppercase'
          }}>
            Ongepland ({unscheduledItems.length})
          </div>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}>
            {unscheduledItems.map(item => {
              const piece = getPiece(item)
              
              return (
                <ContentBlockCompact
                  key={item.id}
                  item={item}
                  contentPiece={piece}
                  isBatchItem={false}
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
                  onViewBatchItem={onViewBatchItem}
                  onEditBatchItem={onEditBatchItem}
                  isMobile={true}
                />
              )
            })}
          </div>
        </div>
      )}
      
      {/* Timeline */}
      <div
        ref={timelineRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          flex: 1,
          overflow: 'auto',
          position: 'relative',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        <div style={{
          display: 'grid',
          gridTemplateColumns: '50px 1fr',
          minHeight: `${timelineHeight}px`,
          position: 'relative'
        }}>
          {/* Time Labels */}
          <div style={{
            borderRight: '1px solid rgba(255, 255, 255, 0.05)'
          }}>
            {timeLabels.map((label, idx) => (
              <div
                key={label}
                style={{
                  height: `${TIMELINE.hourHeight}px`,
                  padding: '0.25rem',
                  fontSize: '0.65rem',
                  fontWeight: '600',
                  color: 'rgba(255, 255, 255, 0.3)',
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
          
          {/* Timeline Content */}
          <div style={{ position: 'relative' }}>
            {/* Hour slots */}
            {timeLabels.map((_, hourIdx) => {
              const hour = TIMELINE.startHour + hourIdx
              
              return (
                <div
                  key={hourIdx}
                  data-plan-day={selectedDay?.dayOfWeek}
                  data-plan-hour={hour}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDrop(e, hour)}
                  onClick={() => selectedDay && onTimeSlotClick(selectedDay.dayOfWeek, `${hour.toString().padStart(2, '0')}:00`)}
                  style={{
                    height: `${TIMELINE.hourHeight}px`,
                    borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
                    cursor: 'pointer'
                  }}
                />
              )
            })}
            
            {/* Positioned Items - UPDATED: Handle batch items */}
            {scheduledItems.map(item => {
              const position = getTimePosition(item.scheduled_time)
              if (position === null) return null
              
              const piece = getPiece(item)
              const isBatchItem = item.isBatchItem || false
              
              return (
                <div
                  key={item.id}
                  style={{
                    position: 'absolute',
                    top: `${position}px`,
                    left: '4px',
                    right: '4px',
                    zIndex: 5
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
                    onEdit={onItemEdit}
                    onDelete={onItemDelete}
                    onDeleteRecurringTemplate={onDeleteRecurringTemplate}
                    onViewScript={onViewScript}
                    onMoveToNextWeek={onMoveToNextWeek}
                    onMoveToPrevWeek={onMoveToPrevWeek}
                    onUnschedule={onUnschedule}
                    onOpenCaption={onOpenCaption}
                  onViewBatchItem={onViewBatchItem}
                  onEditBatchItem={onEditBatchItem}
                    showTime={true}
                    isMobile={true}
                  />
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
        </div>
      </div>
      
      {/* Floating Add Button */}
      <button
        onClick={onAddClick}
        style={{
          position: 'fixed',
          bottom: '80px',
          right: '1rem',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${GOLD.primary} 0%, ${GOLD.secondary} 100%)`,
          border: 'none',
          boxShadow: `0 4px 20px ${GOLD.glow}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 50,
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent'
        }}
      >
        <Plus size={24} color="#000" />
      </button>
    </div>
  )
}
