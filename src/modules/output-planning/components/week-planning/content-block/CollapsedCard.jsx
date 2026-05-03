// src/modules/output-planning/components/week-planning/content-block/CollapsedCard.jsx
// Collapsed view - 24px height, title + icon + time
// UPDATED: Batch item support + format icons

import { Check, ChevronDown, ScrollText } from 'lucide-react'
import { PHASE_ICONS, formatTime, getTitle, hasScript } from './constants'

// Truncate title to max length
const truncateTitle = (title, maxLength = 20) => {
  if (!title) return ''
  if (title.length <= maxLength) return title
  return title.substring(0, maxLength) + '...'
}

export default function CollapsedCard({
  item,
  contentPiece,
  isBatchItem = false,
  multiSelectMode = false,
  isSelected = false,
  onToggleSelect,
  color,
  phase,
  isCompleted,
  isStory,
  formatIcon = null,
  onExpand,
  isMobile = false
}) {
  const PhaseIcon = PHASE_ICONS[item?.phase || 'post']
  
  // Get title - batch items use item.title directly
  const fullTitle = isBatchItem ? item.title : getTitle(item, contentPiece)
  const title = truncateTitle(fullTitle, 20)
  
  // Script indicator - only for regular items with content piece
  const showScriptIcon = !isBatchItem && hasScript(contentPiece)
  
  // Format Icon - for batch items, use the format icon
  const FormatIcon = formatIcon

  console.log('🎨 CollapsedCard render - multiSelectMode:', multiSelectMode, 'isSelected:', isSelected, 'onToggleSelect:', typeof onToggleSelect, 'item:', item.id?.substring(0, 8))

  return (
    <div
      onClick={(e) => {
        e.stopPropagation()
        e.preventDefault()
        console.log('CollapsedCard clicked, multiSelectMode:', multiSelectMode, 'onToggleSelect:', typeof onToggleSelect)
        if (multiSelectMode) {
          // In multi-select: clicking anywhere on card toggles selection
          if (onToggleSelect) {
            console.log('Calling onToggleSelect')
            onToggleSelect()
          } else {
            console.error('onToggleSelect is undefined!')
          }
        } else {
          // Normal mode: clicking expands card
          onExpand()
        }
      }}
      style={{
        height: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '0.25rem',
        padding: '0 0.375rem',
        background: isSelected 
          ? 'rgba(139, 92, 246, 0.2)'
          : isCompleted
            ? 'rgba(16, 185, 129, 0.15)'
            : color.bg,
        border: isSelected
          ? '1px solid rgba(139, 92, 246, 0.6)'
          : isCompleted
            ? '1px solid rgba(16, 185, 129, 0.4)'
            : `1px solid ${color.border}`,
        borderLeft: `3px solid ${isSelected ? '#8b5cf6' : isCompleted ? '#10b981' : color.primary}`,
        borderRadius: '4px',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        overflow: 'hidden',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent'
      }}
    >
      {/* Multi-select checkbox */}
      {multiSelectMode && (
        <div
          onClick={(e) => {
            e.stopPropagation()
            e.preventDefault()
            onToggleSelect?.()
          }}
          style={{
            width: '14px',
            height: '14px',
            borderRadius: '3px',
            background: isSelected ? '#8b5cf6' : 'rgba(255, 255, 255, 0.1)',
            border: `2px solid ${isSelected ? '#8b5cf6' : 'rgba(255, 255, 255, 0.3)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            cursor: 'pointer'
          }}
        >
          {isSelected && (
            <Check size={10} color="#fff" strokeWidth={3} />
          )}
        </div>
      )}
      
      {/* Completed indicator */}
      {!multiSelectMode && isCompleted && (
        <Check
          size={10}
          color="#10b981"
          style={{ flexShrink: 0 }}
        />
      )}

      {/* Format Icon (for batch items) OR Phase Icon (for regular items) */}
      {isBatchItem && FormatIcon ? (
        <FormatIcon
          size={10}
          color={isCompleted ? '#10b981' : color.primary}
          style={{ flexShrink: 0 }}
        />
      ) : (
        <PhaseIcon
          size={10}
          color={isCompleted ? '#10b981' : phase.color}
          style={{ flexShrink: 0 }}
        />
      )}

      {/* 📱 Story Icon */}
      {isStory && (
        <span style={{ 
          fontSize: '0.7rem', 
          flexShrink: 0,
          filter: isCompleted ? 'grayscale(100%) opacity(0.5)' : 'none'
        }}>
          📱
        </span>
      )}

      {/* Title - truncated to 20 chars */}
      <span
        style={{
          flex: 1,
          fontSize: '0.6rem',
          fontWeight: '600',
          color: isCompleted ? 'rgba(255, 255, 255, 0.5)' : '#fff',
          textDecoration: isCompleted ? 'line-through' : 'none',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          minWidth: 0
        }}
      >
        {title}
      </span>

      {/* Script indicator (only for regular content items) */}
      {showScriptIcon && (
        <ScrollText
          size={9}
          color="rgba(255, 215, 0, 0.6)"
          style={{ flexShrink: 0 }}
        />
      )}

      {/* Time */}
      {item?.scheduled_time && (
        <span
          style={{
            fontSize: '0.55rem',
            color: 'rgba(255, 255, 255, 0.4)',
            flexShrink: 0
          }}
        >
          {formatTime(item.scheduled_time)}
        </span>
      )}

      {/* Expand chevron */}
      <ChevronDown
        size={10}
        color="rgba(255, 255, 255, 0.4)"
        style={{ flexShrink: 0 }}
      />
    </div>
  )
}
