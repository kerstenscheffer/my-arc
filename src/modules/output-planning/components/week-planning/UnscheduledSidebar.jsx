// src/modules/output-planning/components/week-planning/UnscheduledSidebar.jsx
// REFACTORED v2.0: Shows CONTENT PIECES (onderwerpen) instead of loose items
// Displays phase status (script/shoot/edit/post) for each piece
// Allows scheduling pieces into the current week

import { useState } from 'react'
import { 
  Layers,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  FileText,
  Video,
  Scissors,
  Send,
  Plus,
  ChevronDown,
  ChevronUp,
  GripVertical,
  MoreHorizontal,
  Play,
  Trash2,
  ArrowRight
} from 'lucide-react'
import { GOLD, CONTENT_COLORS, PHASES } from './constants'

// Phase icon mapping
const PhaseIcons = {
  script: FileText,
  shoot: Video,
  edit: Scissors,
  post: Send
}

export default function UnscheduledSidebar({
  unscheduledPieces = [],
  isCollapsed,
  onToggle,
  onSchedulePiece,
  onDeletePiece,
  onViewPiece,
  isMobile = false
}) {
  const [expandedPieceId, setExpandedPieceId] = useState(null)
  
  const totalUnscheduled = unscheduledPieces.length
  
  // Toggle piece expansion
  const toggleExpand = (pieceId) => {
    setExpandedPieceId(expandedPieceId === pieceId ? null : pieceId)
  }
  
  return (
    <div style={{
      width: isCollapsed ? '48px' : (isMobile ? '100%' : '300px'),
      height: isMobile ? 'auto' : '100%',
      maxHeight: isMobile ? '300px' : '100%',
      background: 'linear-gradient(180deg, #1a1a1a 0%, #0f0f0f 100%)',
      borderRight: isMobile ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
      borderBottom: isMobile ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
      transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: isCollapsed ? '0.75rem 0' : '0.75rem 1rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: isCollapsed ? 'center' : 'space-between',
        gap: '0.5rem',
        background: `linear-gradient(135deg, ${GOLD.background} 0%, rgba(0,0,0,0.3) 100%)`
      }}>
        {!isCollapsed && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              background: GOLD.background,
              border: `1px solid ${GOLD.border}`
            }}>
              <Layers size={14} color={GOLD.primary} />
            </div>
            <span style={{
              fontSize: '0.85rem',
              fontWeight: '700',
              color: '#fff'
            }}>
              Ideeën
            </span>
            {totalUnscheduled > 0 && (
              <span style={{
                padding: '0.125rem 0.5rem',
                background: GOLD.background,
                border: `1px solid ${GOLD.border}`,
                borderRadius: '10px',
                fontSize: '0.7rem',
                fontWeight: '700',
                color: GOLD.primary
              }}>
                {totalUnscheduled}
              </span>
            )}
          </div>
        )}
        
        {!isMobile && (
          <button
            onClick={onToggle}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '6px',
              color: 'rgba(255, 255, 255, 0.6)',
              cursor: 'pointer',
              flexShrink: 0,
              touchAction: 'manipulation'
            }}
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        )}
      </div>
      
      {/* Collapsed View */}
      {isCollapsed ? (
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '0.75rem 0',
          gap: '0.5rem'
        }}>
          <Layers size={18} color="rgba(255, 255, 255, 0.3)" />
          {totalUnscheduled > 0 && (
            <span style={{
              fontSize: '0.8rem',
              fontWeight: '700',
              color: GOLD.primary
            }}>
              {totalUnscheduled}
            </span>
          )}
        </div>
      ) : (
        /* Expanded View */
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '0.75rem'
        }}>
          {totalUnscheduled === 0 ? (
            <EmptyState />
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}>
              {unscheduledPieces.map(piece => (
                <ContentPieceCard
                  key={piece.id}
                  piece={piece}
                  isExpanded={expandedPieceId === piece.id}
                  onToggleExpand={() => toggleExpand(piece.id)}
                  onSchedule={() => onSchedulePiece?.(piece)}
                  onDelete={() => onDeletePiece?.(piece.id)}
                  onView={() => onViewPiece?.(piece)}
                  isMobile={isMobile}
                />
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Footer hint */}
      {!isCollapsed && totalUnscheduled > 0 && (
        <div style={{
          padding: '0.75rem 1rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          background: 'rgba(0, 0, 0, 0.2)'
        }}>
          <div style={{
            fontSize: '0.65rem',
            color: 'rgba(255, 255, 255, 0.4)',
            textAlign: 'center',
            lineHeight: '1.4'
          }}>
            💡 Klik op een onderwerp om in te plannen
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================
// CONTENT PIECE CARD
// ============================================
function ContentPieceCard({
  piece,
  isExpanded,
  onToggleExpand,
  onSchedule,
  onDelete,
  onView,
  isMobile
}) {
  const [showActions, setShowActions] = useState(false)
  
  const color = CONTENT_COLORS[piece.color || 'blue']
  
  // Calculate phase status
  const phases = ['script', 'shoot', 'edit', 'post']
  const requiredPhases = phases.filter(p => piece[`needs_${p}`])
  const completedPhases = phases.filter(p => piece[`${p}_completed`])
  const progress = requiredPhases.length > 0 
    ? Math.round((completedPhases.length / requiredPhases.length) * 100)
    : 0
  
  return (
    <div
      style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: `1px solid ${color.border}`,
        borderLeft: `3px solid ${color.primary}`,
        borderRadius: '10px',
        overflow: 'hidden',
        transition: 'all 0.2s ease'
      }}
    >
      {/* Main Card */}
      <div
        onClick={onToggleExpand}
        onMouseEnter={() => !isMobile && setShowActions(true)}
        onMouseLeave={() => !isMobile && setShowActions(false)}
        style={{
          padding: '0.75rem',
          cursor: 'pointer',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent'
        }}
      >
        {/* Top Row: Title + Actions */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '0.5rem',
          marginBottom: '0.5rem'
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Content Type Badge */}
            <div style={{
              display: 'inline-block',
              padding: '0.125rem 0.375rem',
              background: `${color.primary}20`,
              borderRadius: '4px',
              fontSize: '0.6rem',
              fontWeight: '700',
              color: color.primary,
              textTransform: 'uppercase',
              marginBottom: '0.25rem'
            }}>
              {piece.content_type || 'Reel'}
            </div>
            
            {/* Title */}
            <div style={{
              fontSize: isMobile ? '0.85rem' : '0.9rem',
              fontWeight: '600',
              color: '#fff',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {piece.title}
            </div>
          </div>
          
          {/* Expand/Collapse Icon */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '24px',
            height: '24px',
            borderRadius: '6px',
            background: 'rgba(255, 255, 255, 0.05)',
            flexShrink: 0
          }}>
            {isExpanded ? (
              <ChevronUp size={14} color="rgba(255, 255, 255, 0.5)" />
            ) : (
              <ChevronDown size={14} color="rgba(255, 255, 255, 0.5)" />
            )}
          </div>
        </div>
        
        {/* Phase Status Row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.375rem'
        }}>
          {phases.map(phase => {
            const PhaseIcon = PhaseIcons[phase]
            const isNeeded = piece[`needs_${phase}`]
            const isCompleted = piece[`${phase}_completed`]
            const phaseColor = PHASES[phase].color
            
            if (!isNeeded) return null
            
            return (
              <div
                key={phase}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '26px',
                  height: '26px',
                  borderRadius: '6px',
                  background: isCompleted ? `${phaseColor}30` : 'rgba(255, 255, 255, 0.05)',
                  border: isCompleted ? `1px solid ${phaseColor}` : '1px solid rgba(255, 255, 255, 0.1)'
                }}
                title={`${PHASES[phase].label}: ${isCompleted ? 'Klaar' : 'Nog te doen'}`}
              >
                <PhaseIcon 
                  size={12} 
                  color={isCompleted ? phaseColor : 'rgba(255, 255, 255, 0.3)'} 
                />
              </div>
            )
          })}
          
          {/* Progress indicator */}
          {progress > 0 && (
            <span style={{
              marginLeft: 'auto',
              fontSize: '0.65rem',
              fontWeight: '600',
              color: progress === 100 ? '#10b981' : 'rgba(255, 255, 255, 0.4)'
            }}>
              {progress}%
            </span>
          )}
        </div>
      </div>
      
      {/* Expanded Content */}
      {isExpanded && (
        <div style={{
          padding: '0 0.75rem 0.75rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          {/* Description */}
          {piece.description && (
            <div style={{
              padding: '0.5rem 0',
              fontSize: '0.75rem',
              color: 'rgba(255, 255, 255, 0.5)',
              lineHeight: '1.4'
            }}>
              {piece.description}
            </div>
          )}
          
          {/* Hook Preview */}
          {piece.hook && (
            <div style={{
              padding: '0.5rem',
              marginTop: '0.5rem',
              background: 'rgba(255, 215, 0, 0.05)',
              border: `1px solid ${GOLD.border}`,
              borderRadius: '6px',
              fontSize: '0.7rem',
              color: 'rgba(255, 255, 255, 0.6)',
              fontStyle: 'italic'
            }}>
              <span style={{ color: GOLD.primary, fontWeight: '600' }}>Hook:</span> {piece.hook.substring(0, 80)}{piece.hook.length > 80 ? '...' : ''}
            </div>
          )}
          
          {/* Phase Details */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.375rem',
            marginTop: '0.75rem'
          }}>
            {phases.map(phase => {
              const PhaseIcon = PhaseIcons[phase]
              const isNeeded = piece[`needs_${phase}`]
              const isCompleted = piece[`${phase}_completed`]
              const phaseData = PHASES[phase]
              
              if (!isNeeded) return null
              
              return (
                <div
                  key={phase}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.375rem 0.5rem',
                    background: isCompleted ? `${phaseData.color}10` : 'transparent',
                    borderRadius: '6px'
                  }}
                >
                  <PhaseIcon 
                    size={14} 
                    color={isCompleted ? phaseData.color : 'rgba(255, 255, 255, 0.3)'} 
                  />
                  <span style={{
                    flex: 1,
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    color: isCompleted ? phaseData.color : 'rgba(255, 255, 255, 0.5)',
                    textDecoration: isCompleted ? 'line-through' : 'none'
                  }}>
                    {phaseData.label}
                  </span>
                  {isCompleted && (
                    <span style={{
                      fontSize: '0.6rem',
                      color: '#10b981',
                      fontWeight: '600'
                    }}>
                      ✓
                    </span>
                  )}
                </div>
              )
            })}
          </div>
          
          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            marginTop: '0.75rem'
          }}>
            {/* Schedule Button */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                onSchedule?.()
              }}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.375rem',
                padding: '0.625rem',
                background: `linear-gradient(135deg, ${GOLD.primary} 0%, ${GOLD.secondary} 100%)`,
                border: 'none',
                borderRadius: '8px',
                color: '#000',
                fontWeight: '700',
                fontSize: '0.75rem',
                cursor: 'pointer',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              <Calendar size={14} />
              Inplannen
            </button>
            
            {/* View Button */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                onView?.()
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '40px',
                height: '40px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: 'rgba(255, 255, 255, 0.6)',
                cursor: 'pointer',
                touchAction: 'manipulation'
              }}
              title="Bekijken"
            >
              <ArrowRight size={16} />
            </button>
            
            {/* Delete Button */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                if (confirm('Dit onderwerp verwijderen?')) {
                  onDelete?.()
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '40px',
                height: '40px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                color: '#ef4444',
                cursor: 'pointer',
                touchAction: 'manipulation'
              }}
              title="Verwijderen"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================
// EMPTY STATE
// ============================================
function EmptyState() {
  return (
    <div style={{
      padding: '2rem 1rem',
      textAlign: 'center'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '56px',
        height: '56px',
        borderRadius: '12px',
        background: GOLD.background,
        border: `1px solid ${GOLD.border}`,
        margin: '0 auto 1rem'
      }}>
        <Layers size={24} color={GOLD.primary} style={{ opacity: 0.5 }} />
      </div>
      
      <div style={{
        fontSize: '0.9rem',
        fontWeight: '600',
        color: 'rgba(255, 255, 255, 0.6)',
        marginBottom: '0.375rem'
      }}>
        Geen ideeën
      </div>
      
      <div style={{
        fontSize: '0.75rem',
        color: 'rgba(255, 255, 255, 0.4)',
        lineHeight: '1.4'
      }}>
        Maak nieuwe content via de<br />Content tab of Batch modal
      </div>
    </div>
  )
}
