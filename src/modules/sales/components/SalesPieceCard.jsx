// src/modules/sales/components/SalesPieceCard.jsx
// Complete Sales Piece Card - Expandable met actions
// Gebaseerd op ContentPieceCard pattern

import { useState } from 'react'
import { 
  ChevronDown, 
  ChevronUp, 
  Calendar,
  Edit2,
  Trash2,
  Archive,
  Copy,
  MoreHorizontal,
  Zap,
  Target,
  Type,
  Phone,
  UserCheck,
  Mail,
  Sparkles
} from 'lucide-react'
import { SALES_THEME } from '../SalesSection'

// Sales type config
const SALES_TYPE_CONFIG = {
  announcement: { label: 'Announcement', icon: '📢', color: '#3b82f6' },
  promotion: { label: 'Promotion', icon: '🎁', color: '#f59e0b' },
  testimonial: { label: 'Testimonial', icon: '💬', color: '#10b981' },
  urgency: { label: 'Urgency', icon: '🔥', color: '#ef4444' },
  educational: { label: 'Educational', icon: '📚', color: '#8b5cf6' }
}

// Phase config
const PHASE_CONFIG = {
  prep: { label: 'Prep', icon: Sparkles, color: '#3b82f6' },
  call: { label: 'Call', icon: Phone, color: '#10b981' },
  followup: { label: 'Follow-up', icon: Mail, color: '#f59e0b' },
  aftersale: { label: 'After Sale', icon: UserCheck, color: '#8b5cf6' }
}

export default function SalesPieceCard({ 
  piece, 
  onEdit,
  onDelete, 
  onArchive,
  onSchedule,
  onDuplicate,
  isMobile 
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showActions, setShowActions] = useState(false)
  
  const typeConfig = SALES_TYPE_CONFIG[piece.sales_type] || SALES_TYPE_CONFIG.announcement
  
  // Calculate phase completion
  const phases = ['prep', 'call', 'followup', 'aftersale']
  const requiredPhases = phases.filter(p => piece[`needs_${p}`])
  const completedPhases = requiredPhases.filter(p => piece[`${p}_completed`])
  const progress = requiredPhases.length > 0 
    ? Math.round((completedPhases.length / requiredPhases.length) * 100)
    : 0
  
  return (
    <div
      onMouseEnter={() => !isMobile && setShowActions(true)}
      onMouseLeave={() => !isMobile && setShowActions(false)}
      style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: `1px solid ${SALES_THEME.border}`,
        borderLeft: `4px solid ${SALES_THEME.primary}`,
        borderRadius: '12px',
        overflow: 'hidden',
        transition: 'all 0.2s ease',
        position: 'relative'
      }}
    >
      {/* Main Content */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          padding: isMobile ? '1rem' : '1.25rem',
          cursor: 'pointer',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent'
        }}
      >
        {/* Header Row */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '0.75rem',
          marginBottom: '0.75rem'
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Type Badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.25rem 0.625rem',
              background: `${SALES_THEME.primary}20`,
              border: `1px solid ${SALES_THEME.border}`,
              borderRadius: '6px',
              fontSize: '0.7rem',
              fontWeight: '700',
              color: SALES_THEME.primary,
              textTransform: 'uppercase',
              marginBottom: '0.5rem'
            }}>
              <span style={{ fontSize: '0.9rem' }}>{typeConfig.icon}</span>
              {typeConfig.label}
            </div>
            
            {/* Title */}
            <div style={{
              fontSize: isMobile ? '0.95rem' : '1.05rem',
              fontWeight: '700',
              color: '#fff',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              lineHeight: '1.4'
            }}>
              {piece.title || 'Untitled Sales Piece'}
            </div>
          </div>
          
          {/* Expand Icon */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'rgba(255, 255, 255, 0.05)',
            flexShrink: 0
          }}>
            {isExpanded ? (
              <ChevronUp size={16} color="rgba(255, 255, 255, 0.5)" />
            ) : (
              <ChevronDown size={16} color="rgba(255, 255, 255, 0.5)" />
            )}
          </div>
        </div>
        
        {/* Description */}
        {piece.description && (
          <p style={{
            fontSize: '0.85rem',
            color: 'rgba(255, 255, 255, 0.5)',
            lineHeight: '1.5',
            marginBottom: '0.75rem',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: isExpanded ? 999 : 2,
            WebkitBoxOrient: 'vertical'
          }}>
            {piece.description}
          </p>
        )}
        
        {/* Phase Status Row */}
        {requiredPhases.length > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            flexWrap: 'wrap'
          }}>
            {requiredPhases.map(phase => {
              const PhaseIcon = PHASE_CONFIG[phase].icon
              const isCompleted = piece[`${phase}_completed`]
              const phaseColor = PHASE_CONFIG[phase].color
              
              return (
                <div
                  key={phase}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: isCompleted ? `${phaseColor}20` : 'rgba(255, 255, 255, 0.05)',
                    border: isCompleted ? `1px solid ${phaseColor}` : '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                  title={`${PHASE_CONFIG[phase].label}: ${isCompleted ? 'Klaar' : 'Te doen'}`}
                >
                  <PhaseIcon 
                    size={14} 
                    color={isCompleted ? phaseColor : 'rgba(255, 255, 255, 0.3)'} 
                  />
                </div>
              )
            })}
            
            {/* Progress */}
            {progress > 0 && (
              <span style={{
                marginLeft: 'auto',
                fontSize: '0.75rem',
                fontWeight: '700',
                color: progress === 100 ? '#10b981' : SALES_THEME.primary
              }}>
                {progress}%
              </span>
            )}
          </div>
        )}
      </div>
      
      {/* Expanded Content */}
      {isExpanded && (
        <div style={{
          padding: isMobile ? '0 1rem 1rem' : '0 1.25rem 1.25rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          {/* Hook */}
          {piece.hook && (
            <DetailSection
              icon={Zap}
              label="Hook"
              content={piece.hook}
              isMobile={isMobile}
            />
          )}
          
          {/* CTA */}
          {piece.cta && (
            <DetailSection
              icon={Target}
              label="Call To Action"
              content={piece.cta}
              isMobile={isMobile}
            />
          )}
          
          {/* Caption Preview */}
          {piece.caption && (
            <DetailSection
              icon={Type}
              label="Caption"
              content={piece.caption}
              isMobile={isMobile}
              collapsible
            />
          )}
          
          {/* Phase Details */}
          {requiredPhases.length > 0 && (
            <div style={{
              marginTop: '1rem',
              padding: '0.75rem',
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '8px'
            }}>
              <div style={{
                fontSize: '0.7rem',
                fontWeight: '700',
                color: 'rgba(255, 255, 255, 0.4)',
                textTransform: 'uppercase',
                marginBottom: '0.5rem',
                letterSpacing: '0.5px'
              }}>
                Required Phases
              </div>
              
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.375rem'
              }}>
                {requiredPhases.map(phase => {
                  const PhaseIcon = PHASE_CONFIG[phase].icon
                  const isCompleted = piece[`${phase}_completed`]
                  const phaseData = PHASE_CONFIG[phase]
                  
                  return (
                    <div
                      key={phase}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem',
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
                        fontSize: '0.8rem',
                        fontWeight: '500',
                        color: isCompleted ? phaseData.color : 'rgba(255, 255, 255, 0.5)',
                        textDecoration: isCompleted ? 'line-through' : 'none'
                      }}>
                        {phaseData.label}
                      </span>
                      {isCompleted && (
                        <span style={{
                          fontSize: '0.65rem',
                          color: '#10b981',
                          fontWeight: '700'
                        }}>
                          ✓
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          
          {/* Action Buttons */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
            gap: '0.5rem',
            marginTop: '1rem'
          }}>
            {/* Schedule Button */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                onSchedule?.(piece)
              }}
              style={{
                padding: '0.75rem',
                background: `linear-gradient(135deg, ${SALES_THEME.primary} 0%, ${SALES_THEME.secondary} 100%)`,
                border: 'none',
                borderRadius: '8px',
                color: '#000',
                fontWeight: '700',
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                touchAction: 'manipulation',
                boxShadow: `0 2px 10px ${SALES_THEME.glow}`
              }}
            >
              <Calendar size={16} />
              Plan in Week
            </button>
            
            {/* Edit Button */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                onEdit?.(piece)
              }}
              style={{
                padding: '0.75rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: 'rgba(255, 255, 255, 0.7)',
                fontWeight: '600',
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                touchAction: 'manipulation'
              }}
            >
              <Edit2 size={16} />
              Edit
            </button>
            
            {/* Archive Button */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                onArchive?.(piece.id)
              }}
              style={{
                padding: '0.75rem',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: 'rgba(255, 255, 255, 0.5)',
                fontWeight: '600',
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                touchAction: 'manipulation'
              }}
            >
              <Archive size={16} />
              Archive
            </button>
            
            {/* Delete Button */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                if (confirm('Sales piece permanent verwijderen?')) {
                  onDelete?.(piece.id)
                }
              }}
              style={{
                padding: '0.75rem',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                color: '#ef4444',
                fontWeight: '600',
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                touchAction: 'manipulation'
              }}
            >
              <Trash2 size={16} />
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Detail Section Component
function DetailSection({ icon: Icon, label, content, collapsible, isMobile }) {
  const [isCollapsed, setIsCollapsed] = useState(collapsible && content.length > 150)
  const shouldCollapse = collapsible && content.length > 150
  
  return (
    <div style={{
      marginTop: '1rem',
      padding: '0.75rem',
      background: 'rgba(255, 255, 255, 0.02)',
      border: '1px solid rgba(255, 255, 255, 0.05)',
      borderRadius: '8px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginBottom: '0.5rem'
      }}>
        <Icon size={14} color={SALES_THEME.primary} />
        <span style={{
          fontSize: '0.75rem',
          fontWeight: '700',
          color: SALES_THEME.primary,
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          {label}
        </span>
      </div>
      
      <p style={{
        fontSize: '0.85rem',
        color: 'rgba(255, 255, 255, 0.6)',
        lineHeight: '1.5',
        margin: 0,
        whiteSpace: 'pre-wrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        display: '-webkit-box',
        WebkitLineClamp: (shouldCollapse && isCollapsed) ? 3 : 999,
        WebkitBoxOrient: 'vertical'
      }}>
        {content}
      </p>
      
      {shouldCollapse && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            setIsCollapsed(!isCollapsed)
          }}
          style={{
            marginTop: '0.5rem',
            padding: '0.375rem 0.75rem',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '6px',
            color: SALES_THEME.primary,
            fontSize: '0.75rem',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          {isCollapsed ? 'Toon meer' : 'Toon minder'}
        </button>
      )}
    </div>
  )
}
