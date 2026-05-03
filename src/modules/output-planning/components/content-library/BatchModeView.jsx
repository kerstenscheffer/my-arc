// src/modules/output-planning/components/content-library/BatchModeView.jsx
// Batch Mode View - MOBILE OPTIMIZED - WITH PLAN IN WEEK BUTTON

import { useState } from 'react'
import {
  Zap,
  Plus,
  Check,
  ChevronLeft,
  ChevronRight,
  Film,
  Edit3,
  Trash2,
  Sparkles,
  MoreVertical,
  FileText,
  Calendar,
  CalendarPlus
} from 'lucide-react'

// Gold theme
const GOLD = {
  primary: '#FFD700',
  secondary: '#D4AF37',
  background: 'rgba(255, 215, 0, 0.1)',
  border: 'rgba(255, 215, 0, 0.3)'
}

// Content types
const CONTENT_TYPES = {
  reel: { label: 'Reel', color: '#f97316', icon: Film },
  carousel: { label: 'Carousel', color: '#8b5cf6', icon: FileText },
  story: { label: 'Story', color: '#ec4899', icon: FileText },
  photo_post: { label: 'Foto', color: '#10b981', icon: FileText },
  video_post: { label: 'Video', color: '#3b82f6', icon: Film }
}

const DAYS_FULL = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag']

const formatDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
}

export default function BatchModeView({ 
  items, 
  currentWeekMonday, 
  onStatusChange, 
  onShowScript, 
  onDelete, 
  onSeedWeek, 
  onEdit, 
  onPlanInWeek,  // NEW: Handler for planning content in week
  isMobile, 
  goToPreviousWeek, 
  goToNextWeek 
}) {
  const [expandedItem, setExpandedItem] = useState(null)
  
  const completedCount = items.filter(i => i.status === 'created' || i.status === 'posted').length
  const progress = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0
  
  const weekEnd = new Date(currentWeekMonday)
  weekEnd.setDate(weekEnd.getDate() + 6)
  const weekRange = `${formatDate(currentWeekMonday)} - ${formatDate(weekEnd)}`

  return (
    <div>
      {/* Header */}
      <div style={{
        marginBottom: isMobile ? '1rem' : '1.5rem',
        padding: isMobile ? '0.875rem' : '1.25rem',
        background: `linear-gradient(135deg, ${GOLD.background} 0%, rgba(0,0,0,0.4) 100%)`,
        borderRadius: '12px',
        border: `1px solid ${GOLD.border}`
      }}>
        {/* Week Navigation Row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: isMobile ? '0.75rem' : 0
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
              borderRadius: '8px', 
              color: GOLD.primary, 
              cursor: 'pointer',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            <ChevronLeft size={18} />
          </button>
          
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: '0.5rem' 
            }}>
              <Zap size={isMobile ? 16 : 20} color={GOLD.primary} />
              <span style={{ 
                fontSize: isMobile ? '0.9rem' : '1.125rem', 
                fontWeight: '700', 
                color: '#fff' 
              }}>
                Batch Mode
              </span>
            </div>
            <div style={{ 
              fontSize: isMobile ? '0.75rem' : '0.85rem', 
              color: 'rgba(255, 255, 255, 0.5)', 
              marginTop: '0.125rem' 
            }}>
              {weekRange}
            </div>
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
              borderRadius: '8px', 
              color: GOLD.primary, 
              cursor: 'pointer',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            <ChevronRight size={18} />
          </button>
        </div>
        
        {/* Progress Bar */}
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.375rem'
          }}>
            <span style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.5)' }}>
              {completedCount}/{items.length} klaar
            </span>
            <span style={{
              fontSize: '0.9rem',
              fontWeight: '800',
              color: progress === 100 ? '#10b981' : GOLD.primary
            }}>
              {progress}%
            </span>
          </div>
          <div style={{
            height: '6px',
            background: 'rgba(0, 0, 0, 0.4)',
            borderRadius: '3px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${progress}%`,
              height: '100%',
              background: progress === 100 
                ? 'linear-gradient(90deg, #10b981 0%, #34d399 100%)'
                : `linear-gradient(90deg, ${GOLD.primary} 0%, ${GOLD.secondary} 100%)`,
              borderRadius: '3px',
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>
      </div>
      
      {/* Empty State */}
      {items.length === 0 ? (
        <div style={{
          padding: isMobile ? '2rem 1rem' : '3rem',
          textAlign: 'center',
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <Sparkles size={isMobile ? 36 : 48} color={GOLD.primary} style={{ marginBottom: '1rem', opacity: 0.5 }} />
          <h3 style={{ 
            fontSize: isMobile ? '0.95rem' : '1.125rem', 
            fontWeight: '700', 
            color: '#fff', 
            marginBottom: '0.5rem' 
          }}>
            Geen content gepland
          </h3>
          <p style={{ 
            fontSize: isMobile ? '0.8rem' : '0.9rem', 
            color: 'rgba(255, 255, 255, 0.5)', 
            marginBottom: '1.25rem' 
          }}>
            Vul de week met het standaard schema
          </p>
          <button 
            onClick={onSeedWeek} 
            style={{
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              padding: isMobile ? '0.625rem 1.25rem' : '0.75rem 1.5rem',
              background: `linear-gradient(135deg, ${GOLD.primary} 0%, ${GOLD.secondary} 100%)`,
              border: 'none', 
              borderRadius: '10px',
              color: '#000', 
              fontWeight: '700', 
              fontSize: isMobile ? '0.85rem' : '0.95rem', 
              cursor: 'pointer',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '44px'
            }}
          >
            <Plus size={18} />
            Week vullen
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '0.5rem' : '0.75rem' }}>
          {items.map(item => {
            const TypeIcon = CONTENT_TYPES[item.type]?.icon || FileText
            const typeColor = CONTENT_TYPES[item.type]?.color || '#fff'
            const isCompleted = item.status === 'created' || item.status === 'posted'
            const isExpanded = expandedItem === item.id
            
            // Check if item has blueprint (script done)
            const hasBlueprint = item.blueprint_steps?.length > 0 || item.hook
            
            return (
              <div 
                key={item.id} 
                style={{
                  background: isCompleted ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '12px',
                  border: isCompleted ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
                  overflow: 'hidden'
                }}
              >
                {/* Main Row */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: isMobile ? '0.625rem' : '1rem',
                  padding: isMobile ? '0.75rem' : '1.25rem'
                }}>
                  {/* Checkbox */}
                  <button 
                    onClick={() => onStatusChange(item.id, isCompleted ? 'planned' : 'created')} 
                    style={{
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      width: '44px', 
                      height: '44px', 
                      borderRadius: '8px',
                      background: isCompleted ? '#10b981' : 'transparent',
                      border: isCompleted ? 'none' : '2px solid rgba(255, 255, 255, 0.3)',
                      color: isCompleted ? '#fff' : 'transparent', 
                      cursor: 'pointer', 
                      flexShrink: 0,
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent'
                    }}
                  >
                    {isCompleted && <Check size={20} strokeWidth={3} />}
                  </button>
                  
                  {/* Type Icon */}
                  <div style={{
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    width: isMobile ? '36px' : '40px', 
                    height: isMobile ? '36px' : '40px', 
                    borderRadius: '10px',
                    background: `${typeColor}20`, 
                    border: `1px solid ${typeColor}40`, 
                    flexShrink: 0
                  }}>
                    <TypeIcon size={isMobile ? 18 : 20} color={typeColor} />
                  </div>
                  
                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: isMobile ? '0.875rem' : '1rem', 
                      fontWeight: '600',
                      color: isCompleted ? 'rgba(255, 255, 255, 0.5)' : '#fff',
                      textDecoration: isCompleted ? 'line-through' : 'none',
                      marginBottom: '0.125rem',
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis', 
                      whiteSpace: 'nowrap'
                    }}>
                      {item.title}
                    </div>
                    <div style={{
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.375rem',
                      fontSize: isMobile ? '0.7rem' : '0.8rem', 
                      color: 'rgba(255, 255, 255, 0.4)',
                      flexWrap: 'wrap'
                    }}>
                      <span style={{ color: typeColor }}>{CONTENT_TYPES[item.type]?.label}</span>
                      {item.planned_date && (
                        <>
                          <span>•</span>
                          <span>{DAYS_FULL[new Date(item.planned_date).getDay()]}</span>
                        </>
                      )}
                      {hasBlueprint && (
                        <>
                          <span>•</span>
                          <span style={{ 
                            color: '#10b981',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}>
                            <FileText size={10} />
                            Script
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* Mobile: Expand button / Desktop: Action buttons */}
                  {isMobile ? (
                    <button
                      onClick={() => setExpandedItem(isExpanded ? null : item.id)}
                      style={{
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        width: '44px', 
                        height: '44px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        color: 'rgba(255, 255, 255, 0.6)',
                        cursor: 'pointer',
                        touchAction: 'manipulation',
                        WebkitTapHighlightColor: 'transparent'
                      }}
                    >
                      <MoreVertical size={18} />
                    </button>
                  ) : (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {/* Plan in Week Button - NEW */}
                      <button 
                        onClick={() => onPlanInWeek?.(item)} 
                        style={{
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          width: '36px', 
                          height: '36px',
                          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(59, 130, 246, 0.1) 100%)',
                          border: '1px solid rgba(59, 130, 246, 0.3)',
                          borderRadius: '8px', 
                          color: '#3b82f6', 
                          cursor: 'pointer'
                        }} 
                        title="Plan in weekplanning"
                      >
                        <CalendarPlus size={16} />
                      </button>
                      <button 
                        onClick={() => onShowScript(item)} 
                        style={{
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          width: '36px', 
                          height: '36px',
                          background: `linear-gradient(135deg, ${GOLD.background} 0%, rgba(0,0,0,0.3) 100%)`,
                          border: `1px solid ${GOLD.border}`,
                          borderRadius: '8px', 
                          color: GOLD.primary, 
                          cursor: 'pointer'
                        }} 
                        title="Blueprint"
                      >
                        <Film size={16} />
                      </button>
                      <button 
                        onClick={() => onEdit(item)} 
                        style={{
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          width: '36px', 
                          height: '36px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '8px', 
                          color: 'rgba(255, 255, 255, 0.6)', 
                          cursor: 'pointer'
                        }} 
                        title="Bewerken"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button 
                        onClick={() => onDelete(item.id)} 
                        style={{
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          width: '36px', 
                          height: '36px',
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.2)',
                          borderRadius: '8px', 
                          color: '#ef4444', 
                          cursor: 'pointer'
                        }} 
                        title="Verwijderen"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
                
                {/* Mobile Expanded Actions */}
                {isMobile && isExpanded && (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '0.5rem',
                    padding: '0.75rem',
                    paddingTop: 0,
                    borderTop: '1px solid rgba(255, 255, 255, 0.05)'
                  }}>
                    {/* Plan in Week Button - NEW */}
                    <button
                      onClick={() => {
                        onPlanInWeek?.(item)
                        setExpandedItem(null)
                      }}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0.625rem',
                        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(59, 130, 246, 0.1) 100%)',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        borderRadius: '8px',
                        color: '#3b82f6',
                        cursor: 'pointer',
                        minHeight: '56px',
                        touchAction: 'manipulation',
                        WebkitTapHighlightColor: 'transparent'
                      }}
                    >
                      <CalendarPlus size={18} />
                      <span style={{ fontSize: '0.65rem', fontWeight: '600' }}>Plannen</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        onShowScript(item)
                        setExpandedItem(null)
                      }}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0.625rem',
                        background: `linear-gradient(135deg, ${GOLD.background} 0%, rgba(0,0,0,0.3) 100%)`,
                        border: `1px solid ${GOLD.border}`,
                        borderRadius: '8px',
                        color: GOLD.primary,
                        cursor: 'pointer',
                        minHeight: '56px',
                        touchAction: 'manipulation',
                        WebkitTapHighlightColor: 'transparent'
                      }}
                    >
                      <Film size={18} />
                      <span style={{ fontSize: '0.65rem', fontWeight: '600' }}>Blueprint</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        onEdit(item)
                        setExpandedItem(null)
                      }}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0.625rem',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        color: 'rgba(255, 255, 255, 0.7)',
                        cursor: 'pointer',
                        minHeight: '56px',
                        touchAction: 'manipulation',
                        WebkitTapHighlightColor: 'transparent'
                      }}
                    >
                      <Edit3 size={18} />
                      <span style={{ fontSize: '0.65rem', fontWeight: '600' }}>Bewerk</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        onDelete(item.id)
                        setExpandedItem(null)
                      }}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0.625rem',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        borderRadius: '8px',
                        color: '#ef4444',
                        cursor: 'pointer',
                        minHeight: '56px',
                        touchAction: 'manipulation',
                        WebkitTapHighlightColor: 'transparent'
                      }}
                    >
                      <Trash2 size={18} />
                      <span style={{ fontSize: '0.65rem', fontWeight: '600' }}>Verwijder</span>
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
