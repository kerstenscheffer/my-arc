// src/modules/lead-management/components/kanban/KanbanColumn.jsx
// VERSION 1.0 - Extracted Column Component with Golden Theme
// Features:
// - Section header with actions
// - Lead card rendering
// - Expand/collapse functionality
// - Drag & drop support
// - Contacted today counter

import { useState } from 'react'
import {
  Plus, Settings, ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  GripVertical, Clock, CheckCircle, ArrowUpDown
} from 'lucide-react'
import KanbanCard from './KanbanCard'

// Sort-opties per sectie. Default ('default') = positie + contacted-today
// onderaan (oude gedrag). Andere opties tonen leads gebaseerd op stats:
// weinig opvolgingen eerst → coach kan snel zien wie nog warming-up nodig
// heeft. Geen reactie eerst → wie zit er stil. Etc.
const SORT_OPTIONS = [
  { id: 'default',    label: 'Standaard' },
  { id: 'followup-asc',  label: 'Weinig opvolgingen ↑' },
  { id: 'followup-desc', label: 'Veel opvolgingen ↓' },
  { id: 'reply-asc',     label: 'Geen reactie eerst' },
  { id: 'created-desc',  label: 'Nieuwste eerst' },
  { id: 'created-asc',   label: 'Oudste eerst' },
]

// Golden Theme
const GOLD = {
  primary: '#D4AF37',
  light: '#FFD700',
  dark: '#B8860B',
  border: 'rgba(212, 175, 55, 0.3)',
  borderActive: 'rgba(212, 175, 55, 0.5)',
  bg: 'rgba(212, 175, 55, 0.08)'
}

const MAX_VISIBLE_LEADS = 5

export default function KanbanColumn({
  section,
  isMobile,
  isFullscreen = false,
  // Drag state
  isBeingDragged = false,
  isSectionDropTarget = false,
  isLeadDropTarget = false,
  // Movement
  canMoveLeft = false,
  canMoveRight = false,
  // Handlers
  onMoveSection,
  onGripDragStart,
  onGripDragEnd,
  onColumnDragOver,
  onColumnDragLeave,
  onColumnDrop,
  onLeadDragStart,
  onLeadEdit,
  onLeadDelete,
  onLeadClick,
  onSnoozeLead,
  onOpenSettings,
  onAddLead,
  // Snooze detection
  isSnoozeSection = false,
  snoozeSection = null
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [sortMode, setSortMode] = useState('default')
  const [showSortMenu, setShowSortMenu] = useState(false)

  const isUnassigned = section.id === 'unassigned'
  const totalLeads = section.leads?.length || 0
  const columnWidth = isFullscreen 
    ? (isMobile ? '300px' : '350px') 
    : (isMobile ? '280px' : '320px')

  // Sort leads. Default-mode duwt vandaag-gecontacteerde leads naar onderen
  // en sorteert anders op positie. De andere modes laten de coach snel een
  // subset bovenaan krijgen (bv. leads die nog weinig opvolg-berichten
  // hebben gehad, of die nog niet gereageerd hebben).
  const getSortedLeads = () => {
    const leads = section.leads || []
    const today = new Date().toISOString().split('T')[0]
    const num = (v) => Number(v) || 0
    const t = (v) => v ? new Date(v).getTime() : 0

    if (sortMode === 'followup-asc') {
      return [...leads].sort((a, b) => num(a.followup_count) - num(b.followup_count))
    }
    if (sortMode === 'followup-desc') {
      return [...leads].sort((a, b) => num(b.followup_count) - num(a.followup_count))
    }
    if (sortMode === 'reply-asc') {
      return [...leads].sort((a, b) => num(a.reply_count) - num(b.reply_count))
    }
    if (sortMode === 'created-desc') {
      return [...leads].sort((a, b) => t(b.created_at) - t(a.created_at))
    }
    if (sortMode === 'created-asc') {
      return [...leads].sort((a, b) => t(a.created_at) - t(b.created_at))
    }
    // default
    return [...leads].sort((a, b) => {
      const aContactedToday = a.contacted_today_date?.split('T')[0] === today
      const bContactedToday = b.contacted_today_date?.split('T')[0] === today
      if (aContactedToday && !bContactedToday) return 1
      if (!aContactedToday && bContactedToday) return -1
      return (a.position || 0) - (b.position || 0)
    })
  }

  // Count contacted today
  const getContactedTodayCount = () => {
    const leads = section.leads || []
    const today = new Date().toISOString().split('T')[0]
    return leads.filter(lead => lead.contacted_today_date?.split('T')[0] === today).length
  }

  const sortedLeads = getSortedLeads()
  const contactedTodayCount = getContactedTodayCount()
  const hasMoreLeads = totalLeads > MAX_VISIBLE_LEADS
  const visibleLeads = (isExpanded || totalLeads <= MAX_VISIBLE_LEADS) 
    ? sortedLeads 
    : sortedLeads.slice(0, MAX_VISIBLE_LEADS)

  return (
    <div 
      onDragOver={(e) => onColumnDragOver?.(e, section)}
      onDragLeave={onColumnDragLeave}
      onDrop={(e) => onColumnDrop?.(e, section)}
      style={{ 
        minWidth: columnWidth, 
        maxWidth: columnWidth, 
        background: isSectionDropTarget 
          ? `linear-gradient(135deg, ${section.color}30 0%, ${section.color}15 100%)`
          : isLeadDropTarget 
            ? `linear-gradient(135deg, ${section.color}20 0%, ${section.color}10 100%)`
            : 'linear-gradient(135deg, rgba(26, 26, 26, 0.9) 0%, rgba(15, 15, 15, 0.9) 100%)', 
        border: isSectionDropTarget 
          ? `2px dashed ${section.color}` 
          : isLeadDropTarget 
            ? `2px solid ${section.color}` 
            : `1px solid ${GOLD.border}`, 
        borderRadius: '14px', 
        display: 'flex', 
        flexDirection: 'column', 
        flexShrink: 0, 
        transition: 'all 0.25s ease', 
        backdropFilter: 'blur(10px)', 
        opacity: isBeingDragged ? 0.5 : 1,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
      }}
    >
      {/* ============ SECTION HEADER ============ */}
      <div style={{ 
        padding: '0.75rem 1rem', 
        background: `linear-gradient(135deg, ${section.color}18 0%, ${section.color}08 100%)`,
        borderBottom: `2px solid ${section.color}`, 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '0.5rem', 
        borderTopLeftRadius: '14px', 
        borderTopRightRadius: '14px' 
      }}>
        {/* Top Row: Title + Actions */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          gap: '0.5rem' 
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            flex: 1, 
            minWidth: 0 
          }}>
            {/* Drag Handle */}
            {!isUnassigned && (
              <div 
                draggable 
                onDragStart={(e) => onGripDragStart?.(e, section)} 
                onDragEnd={onGripDragEnd}
                style={{ 
                  color: section.color, 
                  opacity: 0.6, 
                  cursor: 'grab', 
                  display: 'flex', 
                  alignItems: 'center', 
                  padding: '0.25rem', 
                  borderRadius: '4px' 
                }} 
                title="Sleep om sectie te verplaatsen"
              >
                <GripVertical size={16} />
              </div>
            )}

            {/* Color Dot */}
            <div style={{ 
              width: '10px', 
              height: '10px', 
              borderRadius: '50%', 
              background: section.color, 
              boxShadow: `0 0 12px ${section.color}`, 
              flexShrink: 0 
            }} />

            {/* Title */}
            <h3 style={{ 
              fontSize: isMobile ? '0.85rem' : '0.95rem', 
              fontWeight: '600', 
              color: section.color, 
              margin: 0, 
              overflow: 'hidden', 
              textOverflow: 'ellipsis', 
              whiteSpace: 'nowrap', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.4rem' 
            }}>
              {section.title}
              {isSnoozeSection && <Clock size={14} style={{ opacity: 0.7 }} />}
            </h3>

            {/* Lead Count Badge */}
            <span style={{ 
              padding: '0.2rem 0.5rem', 
              background: `${section.color}25`, 
              border: `1px solid ${section.color}50`, 
              borderRadius: '6px', 
              fontSize: '0.7rem', 
              fontWeight: '700', 
              color: section.color, 
              flexShrink: 0 
            }}>
              {totalLeads}
            </span>

            {/* Contacted Today Count */}
            {contactedTodayCount > 0 && (
              <span style={{ 
                padding: '0.2rem 0.5rem', 
                background: 'rgba(107, 114, 128, 0.2)', 
                border: '1px solid rgba(107, 114, 128, 0.4)', 
                borderRadius: '6px', 
                fontSize: '0.65rem', 
                fontWeight: '700', 
                color: '#9ca3af', 
                flexShrink: 0, 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.25rem' 
              }} title={`${contactedTodayCount} leads vandaag al gehad`}>
                <CheckCircle size={10} />
                {contactedTodayCount}
              </span>
            )}
          </div>

          {/* Header Buttons */}
          <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0, position: 'relative' }}>
            <button
              onClick={() => setShowSortMenu(v => !v)}
              title="Sorteer leads in deze sectie"
              style={{
                padding: '0.4rem',
                background: sortMode !== 'default' ? `${section.color}25` : `${section.color}15`,
                border: `1px solid ${section.color}30`,
                borderRadius: '6px',
                color: section.color,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
              }}
            >
              <ArrowUpDown size={14} />
            </button>
            {showSortMenu && (
              <>
                <div onClick={() => setShowSortMenu(false)}
                  style={{ position: 'fixed', inset: 0, zIndex: 99 }} />
                <div style={{
                  position: 'absolute', top: 'calc(100% + 0.3rem)', right: 0,
                  zIndex: 100, minWidth: 180,
                  background: '#111',
                  border: `1px solid ${section.color}40`,
                  borderRadius: 8, overflow: 'hidden',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                }}>
                  {SORT_OPTIONS.map(opt => {
                    const active = opt.id === sortMode
                    return (
                      <button
                        key={opt.id}
                        onClick={() => { setSortMode(opt.id); setShowSortMenu(false) }}
                        style={{
                          display: 'block', width: '100%',
                          padding: '0.6rem 0.75rem',
                          background: active ? `${section.color}15` : 'transparent',
                          border: 'none',
                          color: active ? section.color : 'rgba(255,255,255,0.7)',
                          fontSize: '0.75rem',
                          fontWeight: active ? 700 : 500,
                          textAlign: 'left', cursor: 'pointer',
                          minHeight: 36,
                          borderBottom: '1px solid rgba(255,255,255,0.04)',
                        }}
                      >
                        {opt.label}
                      </button>
                    )
                  })}
                </div>
              </>
            )}
            {!isUnassigned && (
              <button
                onClick={() => onOpenSettings?.(section)}
                style={{
                  padding: '0.4rem',
                  background: `${section.color}15`,
                  border: `1px solid ${section.color}30`,
                  borderRadius: '6px',
                  color: section.color,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease'
                }}
              >
                <Settings size={14} />
              </button>
            )}
            <button 
              onClick={() => onAddLead?.(section.id)} 
              style={{ 
                padding: '0.4rem', 
                background: `${section.color}20`, 
                border: `1px solid ${section.color}40`, 
                borderRadius: '6px', 
                color: section.color, 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                transition: 'all 0.2s ease'
              }}
            >
              <Plus size={14} />
            </button>
          </div>
        </div>

        {/* Move Buttons (not in fullscreen) */}
        {!isUnassigned && !isFullscreen && (
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
            <button 
              onClick={() => onMoveSection?.(section.id, 'left')} 
              disabled={!canMoveLeft}
              style={{ 
                padding: '0.3rem 0.6rem', 
                background: canMoveLeft ? `${section.color}20` : 'rgba(255,255,255,0.05)', 
                border: `1px solid ${canMoveLeft ? section.color + '40' : 'rgba(255,255,255,0.1)'}`, 
                borderRadius: '6px', 
                color: canMoveLeft ? section.color : 'rgba(255,255,255,0.3)', 
                cursor: canMoveLeft ? 'pointer' : 'not-allowed', 
                fontSize: '0.7rem', 
                fontWeight: '600', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.2rem', 
                minHeight: '28px',
                transition: 'all 0.2s ease'
              }}
            >
              <ChevronLeft size={12} /> Links
            </button>
            <button 
              onClick={() => onMoveSection?.(section.id, 'right')} 
              disabled={!canMoveRight}
              style={{ 
                padding: '0.3rem 0.6rem', 
                background: canMoveRight ? `${section.color}20` : 'rgba(255,255,255,0.05)', 
                border: `1px solid ${canMoveRight ? section.color + '40' : 'rgba(255,255,255,0.1)'}`, 
                borderRadius: '6px', 
                color: canMoveRight ? section.color : 'rgba(255,255,255,0.3)', 
                cursor: canMoveRight ? 'pointer' : 'not-allowed', 
                fontSize: '0.7rem', 
                fontWeight: '600', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.2rem', 
                minHeight: '28px',
                transition: 'all 0.2s ease'
              }}
            >
              Rechts <ChevronRight size={12} />
            </button>
          </div>
        )}
      </div>

      {/* ============ LEADS CONTAINER ============ */}
      <div style={{ 
        padding: '0.75rem', 
        flex: 1, 
        overflowY: 'auto', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '0.75rem', 
        minHeight: isFullscreen ? '300px' : '200px', 
        maxHeight: isExpanded ? 'none' : (isFullscreen ? '500px' : '600px') 
      }}>
        {totalLeads === 0 ? (
          <div style={{ 
            padding: '2rem 1rem', 
            textAlign: 'center', 
            color: 'rgba(255, 255, 255, 0.3)', 
            fontSize: '0.875rem' 
          }}>
            Geen leads
          </div>
        ) : (
          <>
            {visibleLeads.map(lead => (
              <KanbanCard
                key={lead.id}
                lead={lead}
                sectionColor={section.color}
                isMobile={isMobile}
                onDragStart={(e) => onLeadDragStart?.(e, lead, section.id)}
                onEdit={(updates) => onLeadEdit?.(lead, section, updates)}
                onDelete={() => onLeadDelete?.(lead)}
                onClick={onLeadClick}
                onSnooze={snoozeSection && !isSnoozeSection ? onSnoozeLead : null}
              />
            ))}

            {/* Show More Button */}
            {hasMoreLeads && (
              <button 
                onClick={() => setIsExpanded(!isExpanded)} 
                style={{ 
                  padding: '0.75rem', 
                  background: `${section.color}10`, 
                  border: `1px solid ${section.color}30`, 
                  borderRadius: '8px', 
                  color: section.color, 
                  cursor: 'pointer', 
                  fontSize: '0.85rem', 
                  fontWeight: '600', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '0.5rem',
                  transition: 'all 0.2s ease'
                }}
              >
                {isExpanded ? (
                  <><ChevronUp size={16} /> Toon minder</>
                ) : (
                  <><ChevronDown size={16} /> Toon meer ({totalLeads - MAX_VISIBLE_LEADS})</>
                )}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
