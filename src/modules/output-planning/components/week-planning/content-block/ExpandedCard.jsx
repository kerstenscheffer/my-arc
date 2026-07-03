// src/modules/output-planning/components/week-planning/content-block/ExpandedCard.jsx
// Expanded view - full details with actions, z-index 100
// UPDATED: Batch item support with location, caption, notes display

import { Check, ChevronUp, ScrollText, MessageSquare, MapPin, StickyNote } from 'lucide-react'
import { PHASE_ICONS, formatTime, getTitle, hasScript } from './constants'
import ActionMenu from './ActionMenu'

// Truncate title to max length
const truncateTitle = (title, maxLength = 30) => {
  if (!title) return ''
  if (title.length <= maxLength) return title
  return title.substring(0, maxLength) + '...'
}

export default function ExpandedCard({
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
  onCollapse,
  onToggleComplete,
  onViewScript,
  onMoveToNextWeek,
  onMoveToPrevWeek,
  onUnschedule,
  onDelete,
  onDeleteRecurringTemplate,
  onOpenCaption,
  isMobile = false
}) {
  const PhaseIcon = PHASE_ICONS[item?.phase || 'post']
  
  // Get title - batch items use item.title directly
  const fullTitle = isBatchItem ? item.title : getTitle(item, contentPiece)
  const title = truncateTitle(fullTitle, 30)
  
  // Script indicator - only for regular items
  const showScriptIcon = !isBatchItem && hasScript(contentPiece)
  
  // Caption - for batch items, caption is on item itself
  const hasCaption = isBatchItem ? !!item.caption : !!contentPiece?.caption
  const canHaveCaption = isBatchItem || !!item?.content_piece_id
  
  // Batch-specific fields
  const hasLocation = isBatchItem && !!item.location
  const hasNotes = isBatchItem && !!item.notes
  
  // Format Icon
  const FormatIcon = formatIcon

  const handleToggleComplete = (e) => {
    e.stopPropagation()
    e.preventDefault()
    onToggleComplete?.(item, !isCompleted)
  }

  const handleOpenCaption = (e) => {
    e.stopPropagation()
    e.preventDefault()
    onOpenCaption?.(item, isBatchItem ? item : contentPiece)
  }

  return (
    <div
      style={{
        background: isSelected
          ? 'rgba(139, 92, 246, 0.2)'
          : isCompleted
            ? 'rgba(16, 185, 129, 0.15)'
            : `linear-gradient(135deg, ${color.bg} 0%, rgba(0,0,0,0.4) 100%)`,
        border: isSelected
          ? '1px solid rgba(139, 92, 246, 0.6)'
          : isCompleted
            ? '1px solid rgba(16, 185, 129, 0.4)'
            : `1px solid ${color.border}`,
        borderLeft: `3px solid ${isSelected ? '#8b5cf6' : isCompleted ? '#10b981' : color.primary}`,
        borderRadius: '6px',
        padding: '0.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.375rem',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(8px)',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent'
      }}
    >
      {/* Header Row - Title + Collapse */}
      <div
        onClick={(e) => {
          e.stopPropagation()
          e.preventDefault()
          if (multiSelectMode) {
            // In multi-select: clicking header toggles selection
            onToggleSelect?.()
          } else {
            // Normal mode: clicking header collapses card
            onCollapse()
          }
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.375rem',
          cursor: 'pointer'
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
              width: '18px',
              height: '18px',
              borderRadius: '4px',
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
              <Check size={12} color="#fff" strokeWidth={3} />
            )}
          </div>
        )}
        
        {/* Completed indicator */}
        {!multiSelectMode && isCompleted && (
          <Check
            size={14}
            color="#10b981"
            style={{ flexShrink: 0 }}
          />
        )}

        {/* Format Icon (batch items) */}
        {isBatchItem && FormatIcon && (
          <FormatIcon
            size={14}
            color={isCompleted ? '#10b981' : color.primary}
            style={{ flexShrink: 0 }}
          />
        )}

        {/* 📱 Story Icon */}
        {isStory && (
          <span style={{ 
            fontSize: '0.85rem', 
            flexShrink: 0,
            filter: isCompleted ? 'grayscale(100%) opacity(0.5)' : 'none'
          }}>
            📱
          </span>
        )}

        {/* Title - full width */}
        <span
          style={{
            flex: 1,
            fontSize: isMobile ? '0.65rem' : '0.7rem',
            fontWeight: '700',
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

        {/* Script indicator */}
        {showScriptIcon && (
          <ScrollText
            size={12}
            color="rgba(255, 215, 0, 0.6)"
            style={{ flexShrink: 0 }}
          />
        )}

        {/* Collapse chevron */}
        <ChevronUp
          size={14}
          color="rgba(255, 255, 255, 0.5)"
          style={{ flexShrink: 0 }}
        />
      </div>

      {/* Location Row - Only for batch items */}
      {hasLocation && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
            padding: '0.25rem 0.375rem',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '4px'
          }}
        >
          <MapPin size={12} color="rgba(255, 255, 255, 0.5)" />
          <span
            style={{
              fontSize: '0.65rem',
              color: 'rgba(255, 255, 255, 0.7)'
            }}
          >
            {item.location}
          </span>
        </div>
      )}

      {/* Info Row - Phase + Time + Duration */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          flexWrap: 'wrap'
        }}
      >
        {/* Phase badge - only for regular items */}
        {!isBatchItem && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              padding: '0.2rem 0.4rem',
              background: `${phase.color}20`,
              border: `1px solid ${phase.color}40`,
              borderRadius: '4px'
            }}
          >
            <PhaseIcon size={12} color={phase.color} />
            <span
              style={{
                fontSize: '0.6rem',
                fontWeight: '700',
                color: phase.color,
                textTransform: 'uppercase'
              }}
            >
              {phase.shortLabel}
            </span>
          </div>
        )}

        {/* Time */}
        {(item?.scheduled_time || item?.planned_time) && (
          <span
            style={{
              fontSize: '0.65rem',
              color: 'rgba(255, 255, 255, 0.5)'
            }}
          >
            {formatTime(item.scheduled_time || item.planned_time)}
          </span>
        )}

        {/* Duration */}
        {item?.duration_minutes && (
          <span
            style={{
              fontSize: '0.65rem',
              color: 'rgba(255, 255, 255, 0.4)'
            }}
          >
            {item.duration_minutes} min
          </span>
        )}

        {/* Caption indicator */}
        {hasCaption && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.2rem',
              padding: '0.15rem 0.3rem',
              background: 'rgba(139, 92, 246, 0.2)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: '4px'
            }}
          >
            <MessageSquare size={10} color="#8b5cf6" />
            <span
              style={{
                fontSize: '0.55rem',
                fontWeight: '600',
                color: '#8b5cf6'
              }}
            >
              Caption
            </span>
          </div>
        )}

        {/* Notes indicator */}
        {hasNotes && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.2rem',
              padding: '0.15rem 0.3rem',
              background: 'rgba(251, 191, 36, 0.2)',
              border: '1px solid rgba(251, 191, 36, 0.3)',
              borderRadius: '4px'
            }}
          >
            <StickyNote size={10} color="#fbbf24" />
            <span
              style={{
                fontSize: '0.55rem',
                fontWeight: '600',
                color: '#fbbf24'
              }}
            >
              Notes
            </span>
          </div>
        )}
      </div>

      {/* Notes Preview - Only if has notes */}
      {hasNotes && (
        <div
          style={{
            padding: '0.375rem',
            background: 'rgba(251, 191, 36, 0.1)',
            border: '1px solid rgba(251, 191, 36, 0.2)',
            borderRadius: '4px'
          }}
        >
          <div
            style={{
              fontSize: '0.65rem',
              color: 'rgba(255, 255, 255, 0.7)',
              lineHeight: '1.4',
              maxHeight: '3em',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {item.notes}
          </div>
        </div>
      )}

      {/* Actions Row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: '0.375rem',
          marginTop: '0.25rem',
          flexWrap: 'wrap'
        }}
      >
        {/* Script Button — direct zichtbaar op de card (geen menu nodig). */}
        {!isBatchItem && onViewScript && (hasScript(contentPiece) || item?.source_content_id || (item?.item_type === 'content' && (item?.description || item?.script))) && (
          <button
            onClick={(e) => { e.stopPropagation(); onViewScript(item, contentPiece) }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.25rem',
              padding: '0.3rem 0.5rem',
              borderRadius: '4px',
              background: 'rgba(255, 215, 0, 0.18)',
              border: '1px solid rgba(255, 215, 0, 0.45)',
              color: '#FFD700',
              fontSize: '0.65rem',
              fontWeight: '700',
              cursor: 'pointer',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            <ScrollText size={12} strokeWidth={2.5} />
            Script
          </button>
        )}

        {/* Caption Button */}
        {canHaveCaption && (
          <button
            onClick={handleOpenCaption}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.25rem',
              padding: '0.3rem 0.5rem',
              borderRadius: '4px',
              background: hasCaption ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.1)',
              border: hasCaption ? '1px solid rgba(139, 92, 246, 0.4)' : '1px solid rgba(139, 92, 246, 0.3)',
              color: '#8b5cf6',
              fontSize: '0.65rem',
              fontWeight: '600',
              cursor: 'pointer',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            <MessageSquare size={12} strokeWidth={2.5} />
            Caption
          </button>
        )}

        {/* Complete Toggle Button */}
        <button
          onClick={handleToggleComplete}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.25rem',
            padding: '0.3rem 0.5rem',
            borderRadius: '4px',
            background: isCompleted ? '#10b981' : 'rgba(16, 185, 129, 0.2)',
            border: isCompleted ? 'none' : '1px solid rgba(16, 185, 129, 0.4)',
            color: isCompleted ? '#fff' : '#10b981',
            fontSize: '0.65rem',
            fontWeight: '600',
            cursor: 'pointer',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent'
          }}
        >
          <Check size={12} strokeWidth={2.5} />
          {isCompleted ? 'Klaar' : 'Markeer klaar'}
        </button>

        {/* Action Menu - only for regular items with content pieces */}
        {!isBatchItem && (
          <ActionMenu
            item={item}
            contentPiece={contentPiece}
            isStory={isStory}
            onViewScript={onViewScript}
            onMoveToNextWeek={onMoveToNextWeek}
            onMoveToPrevWeek={onMoveToPrevWeek}
            onUnschedule={onUnschedule}
            onDelete={onDelete}
            onDeleteRecurringTemplate={onDeleteRecurringTemplate}
            isMobile={isMobile}
          />
        )}

        {/* Simple Delete for batch items */}
        {isBatchItem && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (confirm('Weet je zeker dat je dit item wilt verwijderen?')) {
                onDelete?.(item)
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.3rem 0.5rem',
              borderRadius: '4px',
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#ef4444',
              fontSize: '0.65rem',
              fontWeight: '600',
              cursor: 'pointer',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            Verwijder
          </button>
        )}
      </div>
    </div>
  )
}
