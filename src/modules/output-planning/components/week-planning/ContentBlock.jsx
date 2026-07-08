// src/modules/output-planning/components/week-planning/ContentBlock.jsx
// Content Block v2.1 - WITH STORY DETECTION & PINK STYLING (FIXED)
// Uses CONTENT_COLORS.pink from constants for consistency

import { useState, useRef, useEffect } from 'react'
import { 
  FileText, 
  Video, 
  Scissors, 
  Send, 
  Check, 
  GripVertical,
  Trash2,
  MoreVertical,
  ChevronRight,
  ChevronLeft,
  CalendarOff,
  ScrollText,
  Eye,
  Pencil,
  X
} from 'lucide-react'
import { CONTENT_COLORS, PHASES, formatTime } from './constants'

// Phase icon mapping
const PhaseIcons = {
  script: FileText,
  shoot: Video,
  edit: Scissors,
  post: Send
}

// Maak een kleur-object (zoals CONTENT_COLORS) uit een hex, voor batch-items
// die de kleur van hun custom format erven.
function hexToColorObj(hex) {
  return { bg: `${hex}14`, border: `${hex}55`, primary: hex }
}

// Toon één veldwaarde leesbaar (checklist = komma-lijst).
function renderFieldValue(field, value) {
  if (value == null || value === '') return null
  if (field.type === 'checklist' && Array.isArray(value)) return value.length ? value.join(', ') : null
  if (field.type === 'list' && Array.isArray(value)) {
    const clean = value.filter(v => v && String(v).trim())
    return clean.length ? clean.map((v, i) => `${i + 1}. ${v}`).join('   ') : null
  }
  return String(value)
}

// Paneel met de ingevulde format-velden van een batch-item (label: waarde).
function BatchFieldPanel({ fmt, fieldValues, isMobile }) {
  const fields = fmt?.fields || []
  const rows = fields
    .map(f => ({ label: f.label, val: renderFieldValue(f, fieldValues?.[f.key]) }))
    .filter(r => r.val)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, paddingTop: 6, marginTop: 2, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
      {rows.length === 0 ? (
        <span style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.4)' }}>Nog geen velden ingevuld.</span>
      ) : rows.map((r, i) => (
        <div key={i} style={{ fontSize: isMobile ? '0.62rem' : '0.66rem', lineHeight: 1.35 }}>
          <span style={{ color: 'rgba(255,255,255,0.45)', fontWeight: 700 }}>{r.label}: </span>
          <span style={{ color: 'rgba(255,255,255,0.85)' }}>{r.val}</span>
        </div>
      ))}
    </div>
  )
}

export default function ContentBlock({
  item,
  contentPiece,
  onToggleComplete,
  onDelete,
  onViewScript,
  onMoveToNextWeek,
  onMoveToPrevWeek,
  onUnschedule,
  onViewBatchItem,
  onEditBatchItem,
  isDragging = false,
  isCompact = false,
  showTime = true,
  isMobile = false
}) {
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef(null)
  
  // 📱 STORY DETECTION - Stories get pink styling
  const isStory = !contentPiece && (
    item?.title?.toLowerCase().includes('workout') ||
    item?.title?.toLowerCase().includes('meal') ||
    item?.title?.toLowerCase().includes('story') ||
    item?.title?.toLowerCase().includes('interactie') ||
    item?.description?.includes('story') ||
    item?.description?.includes('foto_muziek') ||
    item?.description?.includes('canva') ||
    item?.description?.includes('workout_video') ||
    item?.description?.includes('praat_video')
  )
  
  // Batch-item met custom format → erf de format-kleur; anders story/piece kleur.
  const batchFmt = item?.isBatchItem ? item?.batch?.format : null
  const [showFields, setShowFields] = useState(false)
  const color = batchFmt?.color
    ? hexToColorObj(batchFmt.color)
    : isStory
      ? CONTENT_COLORS.pink  // Use existing pink from constants
      : CONTENT_COLORS[contentPiece?.color || item?.color || 'blue']

  const phase = PHASES[item?.phase || 'post']
  const PhaseIcon = PhaseIcons[item?.phase || 'post'] || Send
  const isCompleted = item?.completed

  const title = contentPiece?.title || item?.title || item?.label || 'Untitled'
  const height = item?.duration_minutes ? Math.max(30, item.duration_minutes) : 30
  
  // Check if this item is linked to a content piece (vs standalone task)
  const hasContentPiece = !!item?.content_piece_id
  const hasScript = !!(contentPiece?.source_content_id)
  
  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false)
      }
    }
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [showMenu])
  
  const handleToggleComplete = (e) => {
    e.stopPropagation()
    e.preventDefault()
    if (onToggleComplete) {
      onToggleComplete(item, !isCompleted)
    }
  }
  
  const handleMenuToggle = (e) => {
    e.stopPropagation()
    e.preventDefault()
    setShowMenu(!showMenu)
  }
  
  const handleAction = (action) => (e) => {
    e.stopPropagation()
    e.preventDefault()
    setShowMenu(false)
    
    switch(action) {
      case 'script':
        onViewScript?.(item, contentPiece)
        break
      case 'nextWeek':
        onMoveToNextWeek?.(item, contentPiece)
        break
      case 'prevWeek':
        onMoveToPrevWeek?.(item, contentPiece)
        break
      case 'unschedule':
        onUnschedule?.(item, contentPiece)
        break
      case 'delete':
        onDelete?.(item)
        break
      case 'viewBatch':
        onViewBatchItem?.(item)
        break
      case 'editBatch':
        onEditBatchItem?.(item)
        break
    }
  }
  
  // Menu items based on what's available
  const menuItems = []

  if (item?.isBatchItem && onViewBatchItem) menuItems.push({ id: 'viewBatch', label: 'Inzien', icon: Eye, color: '#fff' })
  if (item?.isBatchItem && onEditBatchItem) menuItems.push({ id: 'editBatch', label: 'Bewerken', icon: Pencil, color: '#3b82f6' })

  if (hasScript && onViewScript) {
    menuItems.push({
      id: 'script',
      label: 'Bekijk Script',
      icon: ScrollText,
      color: '#FFD700'
    })
  }
  
  if (hasContentPiece && onMoveToNextWeek) {
    menuItems.push({
      id: 'nextWeek',
      label: 'Volgende week',
      icon: ChevronRight,
      color: '#3b82f6'
    })
  }
  
  if (hasContentPiece && onMoveToPrevWeek) {
    menuItems.push({
      id: 'prevWeek',
      label: 'Vorige week',
      icon: ChevronLeft,
      color: '#8b5cf6'
    })
  }
  
  if (hasContentPiece && onUnschedule) {
    menuItems.push({
      id: 'unschedule',
      label: 'Uitplannen',
      icon: CalendarOff,
      color: '#f59e0b'
    })
  }
  
  if (onDelete) {
    menuItems.push({
      id: 'delete',
      label: 'Verwijderen',
      icon: Trash2,
      color: '#ef4444',
      danger: true
    })
  }
  
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('itemId', item.id)
        e.dataTransfer.setData('phase', item.phase || 'post')
        if (item.content_piece_id) {
          e.dataTransfer.setData('contentPieceId', item.content_piece_id)
        }
        e.dataTransfer.effectAllowed = 'move'
      }}
      style={{
        height: isCompact ? 'auto' : `${height}px`,
        minHeight: isCompact ? '44px' : `${Math.max(30, height)}px`,
        background: isCompleted 
          ? 'rgba(16, 185, 129, 0.15)'
          : color.bg,
        border: isCompleted
          ? '1px solid rgba(16, 185, 129, 0.4)'
          : `1px solid ${color.border}`,
        borderLeft: `3px solid ${isCompleted ? '#10b981' : color.primary}`,
        borderRadius: '6px',
        padding: isCompact ? '0.5rem' : '0.375rem 0.5rem',
        cursor: isDragging ? 'grabbing' : 'grab',
        opacity: isDragging ? 0.5 : 1,
        transition: 'all 0.15s ease',
        overflow: 'visible',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.25rem',
        position: 'relative',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent'
      }}
    >
      {/* Top Row: Phase Icon + Title + Actions */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.375rem',
        minWidth: 0
      }}>
        {/* Phase Icon with background */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '20px',
          height: '20px',
          borderRadius: '4px',
          background: `${phase.color}30`,
          flexShrink: 0
        }}>
          <PhaseIcon 
            size={12} 
            color={isCompleted ? '#10b981' : phase.color} 
          />
        </div>
        
        {/* 📱 Story Icon (if story) */}
        {isStory && (
          <span style={{ 
            fontSize: '0.9rem',
            flexShrink: 0,
            filter: isCompleted ? 'grayscale(100%) opacity(0.5)' : 'none'
          }}>
            📱
          </span>
        )}
        
        {/* Title — bij batch-items klikbaar om de veld-info te tonen */}
        <span
          onClick={batchFmt ? (e) => { e.stopPropagation(); e.preventDefault(); setShowFields(v => !v) } : undefined}
          style={{
            fontSize: isMobile ? '0.7rem' : '0.75rem',
            fontWeight: '600',
            color: isCompleted ? 'rgba(255, 255, 255, 0.5)' : '#fff',
            textDecoration: isCompleted ? 'line-through' : 'none',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1,
            minWidth: 0,
            cursor: batchFmt ? 'pointer' : 'inherit'
          }}>
          {title}
        </span>

        {/* Format-badge (batch-item) */}
        {batchFmt && (
          <span style={{
            flexShrink: 0, padding: '0.1rem 0.35rem', borderRadius: 4,
            background: `${batchFmt.color}22`, border: `1px solid ${batchFmt.color}55`,
            color: batchFmt.color, fontSize: '0.5rem', fontWeight: 800,
            textTransform: 'uppercase', letterSpacing: '0.03em',
            maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
          }}>
            {batchFmt.name}
          </span>
        )}

        {/* Quick indicators */}
        {hasScript && !showMenu && (
          <ScrollText 
            size={12} 
            color="rgba(255, 215, 0, 0.6)" 
            style={{ flexShrink: 0 }}
          />
        )}
        
        {isCompleted && !showMenu && (
          <Check 
            size={14} 
            color="#10b981" 
            style={{ flexShrink: 0 }}
          />
        )}
        
        {/* Complete Toggle Button */}
        <button
          onClick={handleToggleComplete}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '22px',
            height: '22px',
            borderRadius: '4px',
            background: isCompleted ? '#10b981' : 'rgba(16, 185, 129, 0.2)',
            border: isCompleted ? 'none' : '1px solid rgba(16, 185, 129, 0.4)',
            color: isCompleted ? '#fff' : '#10b981',
            cursor: 'pointer',
            flexShrink: 0,
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent'
          }}
        >
          <Check size={12} strokeWidth={2.5} />
        </button>
        
        {/* Menu Toggle Button */}
        {menuItems.length > 0 && (
          <div ref={menuRef} style={{ position: 'relative' }}>
            <button
              onClick={handleMenuToggle}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '22px',
                height: '22px',
                borderRadius: '4px',
                background: showMenu ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.7)',
                cursor: 'pointer',
                flexShrink: 0,
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              <MoreVertical size={14} />
            </button>
            
            {/* Dropdown Menu */}
            {showMenu && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '4px',
                background: 'linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '8px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
                zIndex: 100,
                minWidth: '160px',
                overflow: 'hidden',
                backdropFilter: 'blur(12px)'
              }}>
                {menuItems.map((menuItem, idx) => (
                  <button
                    key={menuItem.id}
                    onClick={handleAction(menuItem.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.625rem',
                      width: '100%',
                      padding: '0.625rem 0.75rem',
                      background: 'transparent',
                      border: 'none',
                      borderBottom: idx < menuItems.length - 1 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none',
                      color: menuItem.danger ? '#ef4444' : '#fff',
                      fontSize: '0.8rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.15s ease',
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = menuItem.danger 
                        ? 'rgba(239, 68, 68, 0.15)' 
                        : 'rgba(255, 255, 255, 0.08)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    <menuItem.icon size={16} color={menuItem.color} />
                    {menuItem.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Second Row: Time + Phase Label (only if enough height) */}
      {(height > 40 || isCompact) && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.375rem',
          fontSize: isMobile ? '0.6rem' : '0.65rem',
          color: 'rgba(255, 255, 255, 0.5)'
        }}>
          {showTime && item?.scheduled_time && (
            <span>{formatTime(item.scheduled_time)}</span>
          )}
          <span style={{ 
            padding: '0.125rem 0.25rem',
            background: `${phase.color}20`,
            borderRadius: '3px',
            color: phase.color,
            fontWeight: '600',
            textTransform: 'uppercase',
            fontSize: '0.55rem'
          }}>
            {phase.shortLabel}
          </span>
          {item?.duration_minutes && (
            <span>{item.duration_minutes}min</span>
          )}
        </div>
      )}

      {/* Batch-item veld-info — klik op de titel om te tonen/verbergen */}
      {batchFmt && showFields && (
        <BatchFieldPanel fmt={batchFmt} fieldValues={item?.field_values} isMobile={isMobile} />
      )}
    </div>
  )
}

// ============================================
// COMPACT VERSION - For mobile timeline
// ============================================

export function ContentBlockCompact({
  item,
  contentPiece,
  onToggleComplete,
  onDelete,
  onViewScript,
  onMoveToNextWeek,
  onMoveToPrevWeek,
  onUnschedule,
  onViewBatchItem,
  onEditBatchItem,
  isMobile = false
}) {
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef(null)
  
  // 📱 STORY DETECTION - Stories get pink styling
  const isStory = !contentPiece && (
    item?.title?.toLowerCase().includes('workout') ||
    item?.title?.toLowerCase().includes('meal') ||
    item?.title?.toLowerCase().includes('story') ||
    item?.title?.toLowerCase().includes('interactie') ||
    item?.description?.includes('story') ||
    item?.description?.includes('foto_muziek') ||
    item?.description?.includes('canva') ||
    item?.description?.includes('workout_video') ||
    item?.description?.includes('praat_video')
  )
  
  const batchFmt = item?.isBatchItem ? item?.batch?.format : null
  const color = batchFmt?.color
    ? hexToColorObj(batchFmt.color)
    : isStory
      ? CONTENT_COLORS.pink  // Use existing pink from constants
      : CONTENT_COLORS[contentPiece?.color || item?.color || 'blue']

  const phase = PHASES[item?.phase || 'post']
  const PhaseIcon = PhaseIcons[item?.phase || 'post'] || Send
  const isCompleted = item?.completed

  const title = contentPiece?.title || item?.title || item?.label || 'Untitled'

  const hasContentPiece = !!item?.content_piece_id
  const hasScript = !!(contentPiece?.source_content_id)
  
  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false)
      }
    }
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [showMenu])
  
  const handleToggleComplete = (e) => {
    e.stopPropagation()
    e.preventDefault()
    onToggleComplete?.(item, !isCompleted)
  }
  
  const handleAction = (action) => (e) => {
    e.stopPropagation()
    e.preventDefault()
    setShowMenu(false)
    
    switch(action) {
      case 'script':
        onViewScript?.(item, contentPiece)
        break
      case 'nextWeek':
        onMoveToNextWeek?.(item, contentPiece)
        break
      case 'prevWeek':
        onMoveToPrevWeek?.(item, contentPiece)
        break
      case 'unschedule':
        onUnschedule?.(item, contentPiece)
        break
      case 'delete':
        onDelete?.(item)
        break
      case 'viewBatch':
        onViewBatchItem?.(item)
        break
      case 'editBatch':
        onEditBatchItem?.(item)
        break
    }
  }
  
  // Build menu items
  const menuItems = []

  if (item?.isBatchItem && onViewBatchItem) menuItems.push({ id: 'viewBatch', label: 'Inzien', icon: Eye, color: '#fff' })
  if (item?.isBatchItem && onEditBatchItem) menuItems.push({ id: 'editBatch', label: 'Bewerken', icon: Pencil, color: '#3b82f6' })

  if (hasScript && onViewScript) {
    menuItems.push({ id: 'script', label: 'Bekijk Script', icon: ScrollText, color: '#FFD700' })
  }
  if (hasContentPiece && onMoveToNextWeek) {
    menuItems.push({ id: 'nextWeek', label: 'Volgende week', icon: ChevronRight, color: '#3b82f6' })
  }
  if (hasContentPiece && onMoveToPrevWeek) {
    menuItems.push({ id: 'prevWeek', label: 'Vorige week', icon: ChevronLeft, color: '#8b5cf6' })
  }
  if (hasContentPiece && onUnschedule) {
    menuItems.push({ id: 'unschedule', label: 'Uitplannen', icon: CalendarOff, color: '#f59e0b' })
  }
  if (onDelete) {
    menuItems.push({ id: 'delete', label: 'Verwijderen', icon: Trash2, color: '#ef4444', danger: true })
  }
  
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('itemId', item.id)
        e.dataTransfer.setData('phase', item.phase || 'post')
        if (item.content_piece_id) {
          e.dataTransfer.setData('contentPieceId', item.content_piece_id)
        }
        e.dataTransfer.effectAllowed = 'move'
      }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.625rem',
        background: isCompleted 
          ? 'rgba(16, 185, 129, 0.1)'
          : color.bg,
        border: isCompleted
          ? '1px solid rgba(16, 185, 129, 0.3)'
          : `1px solid ${color.border}`,
        borderLeft: `3px solid ${isCompleted ? '#10b981' : color.primary}`,
        borderRadius: '8px',
        cursor: 'grab',
        transition: 'all 0.15s ease',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        minHeight: '44px',
        position: 'relative'
      }}
    >
      {/* Drag Handle */}
      <GripVertical 
        size={14} 
        color="rgba(255, 255, 255, 0.3)" 
        style={{ flexShrink: 0 }}
      />
      
      {/* Phase Icon */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '28px',
        height: '28px',
        borderRadius: '6px',
        background: `${phase.color}20`,
        border: `1px solid ${phase.color}40`,
        flexShrink: 0
      }}>
        <PhaseIcon size={14} color={phase.color} />
      </div>
      
      {/* Title + Meta */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: isMobile ? '0.8rem' : '0.85rem',
          fontWeight: '600',
          color: isCompleted ? 'rgba(255, 255, 255, 0.5)' : '#fff',
          textDecoration: isCompleted ? 'line-through' : 'none',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          display: 'flex',
          alignItems: 'center',
          gap: '0.375rem'
        }}>
          {/* 📱 Story Icon */}
          {isStory && <span style={{ fontSize: '0.9rem' }}>📱</span>}
          {title}
          {hasScript && <ScrollText size={12} color="rgba(255, 215, 0, 0.6)" />}
        </div>
        <div style={{
          fontSize: '0.65rem',
          color: 'rgba(255, 255, 255, 0.4)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.375rem'
        }}>
          <span style={{ color: batchFmt ? batchFmt.color : phase.color, fontWeight: '600' }}>
            {batchFmt ? batchFmt.name : phase.label}
          </span>
          {item?.scheduled_time && (
            <>
              <span>•</span>
              <span>{formatTime(item.scheduled_time)}</span>
            </>
          )}
          {item?.duration_minutes && (
            <>
              <span>•</span>
              <span>{item.duration_minutes} min</span>
            </>
          )}
        </div>
      </div>
      
      {/* Complete Button */}
      <button
        onClick={handleToggleComplete}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '32px',
          height: '32px',
          borderRadius: '6px',
          background: isCompleted ? '#10b981' : 'transparent',
          border: isCompleted ? 'none' : '2px solid rgba(16, 185, 129, 0.4)',
          color: isCompleted ? '#fff' : '#10b981',
          cursor: 'pointer',
          flexShrink: 0,
          touchAction: 'manipulation'
        }}
      >
        <Check size={16} strokeWidth={3} />
      </button>
      
      {/* Menu Button */}
      {menuItems.length > 0 && (
        <div ref={menuRef} style={{ position: 'relative' }}>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowMenu(!showMenu)
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              background: showMenu ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.6)',
              cursor: 'pointer',
              flexShrink: 0,
              touchAction: 'manipulation'
            }}
          >
            <MoreVertical size={18} />
          </button>
          
          {/* Dropdown Menu */}
          {showMenu && (
            <div style={{
              position: 'absolute',
              bottom: '100%',
              right: 0,
              marginBottom: '4px',
              background: 'linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '10px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
              zIndex: 100,
              minWidth: '180px',
              overflow: 'hidden',
              backdropFilter: 'blur(12px)'
            }}>
              {menuItems.map((menuItem, idx) => (
                <button
                  key={menuItem.id}
                  onClick={handleAction(menuItem.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    width: '100%',
                    padding: '0.75rem 1rem',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: idx < menuItems.length - 1 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none',
                    color: menuItem.danger ? '#ef4444' : '#fff',
                    fontSize: '0.85rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.15s ease',
                    touchAction: 'manipulation'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = menuItem.danger 
                      ? 'rgba(239, 68, 68, 0.15)' 
                      : 'rgba(255, 255, 255, 0.08)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <menuItem.icon size={18} color={menuItem.color} />
                  {menuItem.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
