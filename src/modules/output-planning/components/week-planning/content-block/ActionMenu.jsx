// src/modules/output-planning/components/week-planning/content-block/ActionMenu.jsx
// Dropdown menu with actions for content blocks
// UPDATED: Recurring story detection + delete template option

import { useState, useRef, useEffect } from 'react'
import {
  MoreVertical,
  ScrollText,
  ChevronRight,
  ChevronLeft,
  CalendarOff,
  Trash2,
  StopCircle
} from 'lucide-react'
import { hasScript, hasContentPiece } from './constants'

export default function ActionMenu({
  item,
  contentPiece,
  isStory = false,  // NEW: Story flag from parent
  onViewScript,
  onMoveToNextWeek,
  onMoveToPrevWeek,
  onUnschedule,
  onDelete,
  onDeleteRecurringTemplate,  // NEW: Delete recurring story template
  isMobile = false
}) {
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef(null)

  // Detect if this is a recurring story
  // Recurring stories have no content_piece_id and match the story patterns
  const isRecurringStory = isStory && !contentPiece

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

  const handleAction = (action) => (e) => {
    e.stopPropagation()
    e.preventDefault()
    setShowMenu(false)

    switch (action) {
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
        if (confirm('Weet je zeker dat je dit item wilt verwijderen?')) {
          onDelete?.(item)
        }
        break
      case 'deleteRecurring':
        if (confirm(`🗑️ Stop Recurring Story?\n\nDit verwijdert de template en stopt alle toekomstige items van "${item.title}".\n\nWeet je het zeker?`)) {
          onDeleteRecurringTemplate?.(item)
        }
        break
    }
  }

  // Build menu items
  const menuItems = []

  if (hasScript(contentPiece) && onViewScript) {
    menuItems.push({ id: 'script', label: 'Bekijk Script', icon: ScrollText, color: '#FFD700' })
  }
  if (hasContentPiece(item) && onMoveToNextWeek) {
    menuItems.push({ id: 'nextWeek', label: 'Volgende week', icon: ChevronRight, color: '#3b82f6' })
  }
  if (hasContentPiece(item) && onMoveToPrevWeek) {
    menuItems.push({ id: 'prevWeek', label: 'Vorige week', icon: ChevronLeft, color: '#8b5cf6' })
  }
  if (hasContentPiece(item) && onUnschedule) {
    menuItems.push({ id: 'unschedule', label: 'Uitplannen', icon: CalendarOff, color: '#f59e0b' })
  }
  
  // For recurring stories: show both delete options
  if (isRecurringStory && onDeleteRecurringTemplate) {
    menuItems.push({ 
      id: 'delete', 
      label: 'Verwijder Deze', 
      icon: Trash2, 
      color: '#f59e0b',
      warning: true 
    })
    menuItems.push({ 
      id: 'deleteRecurring', 
      label: '🔄 Stop Recurring Story', 
      icon: StopCircle, 
      color: '#ef4444',
      danger: true 
    })
  } else if (onDelete) {
    // Regular delete for non-recurring items
    menuItems.push({ 
      id: 'delete', 
      label: 'Verwijderen', 
      icon: Trash2, 
      color: '#ef4444', 
      danger: true 
    })
  }

  if (menuItems.length === 0) return null

  return (
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
          width: isMobile ? '28px' : '24px',
          height: isMobile ? '28px' : '24px',
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
        <MoreVertical size={isMobile ? 16 : 14} />
      </button>

      {/* Dropdown Menu */}
      {showMenu && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '4px',
            background: 'linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '8px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
            zIndex: 200,
            minWidth: '180px',
            overflow: 'hidden',
            backdropFilter: 'blur(12px)'
          }}
        >
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
                color: menuItem.danger ? '#ef4444' : menuItem.warning ? '#f59e0b' : '#fff',
                fontSize: '0.8rem',
                fontWeight: menuItem.danger ? '700' : '500',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.15s ease',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = menuItem.danger
                  ? 'rgba(239, 68, 68, 0.15)'
                  : menuItem.warning
                    ? 'rgba(245, 158, 11, 0.15)'
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
  )
}
