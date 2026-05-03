import { useState } from 'react'
import { Instagram, Zap, ArrowRight, Trash2, Edit3, Check, X, CheckSquare, Square } from 'lucide-react'

export default function WarmUpCard({
  lead,
  phaseColor,
  isMobile,
  onInteraction,
  onConvert,
  onDelete,
  onEdit,
  showConvertButton = false,
  isSelected = false,
  onToggleSelect
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editHandle, setEditHandle] = useState(lead.instagram_handle)
  const [showActions, setShowActions] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleSaveEdit = () => {
    if (editHandle.trim() && editHandle !== lead.instagram_handle) {
      onEdit(lead.id, { instagram_handle: editHandle.trim() })
    }
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setEditHandle(lead.instagram_handle)
    setIsEditing(false)
  }

  const handleCopyHandle = async () => {
    try {
      await navigator.clipboard.writeText(lead.instagram_handle)
      setCopied(true)
      setTimeout(() => setCopied(false), 1000)
    } catch (err) {
      console.error('Copy failed:', err)
    }
  }

  const daysInPhase = lead.daysInPhase || 0

  // DONE CARDS - Minimal green styling
  if (lead.interactedToday) {
    return (
      <div
        style={{
          background: '#0d1f17',
          border: '2px solid #10b981',
          borderRadius: '10px',
          padding: '0.5rem 0.75rem',
          position: 'relative',
          opacity: 0.6
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-1px',
            left: '-1px',
            right: '-1px',
            padding: '0.35rem',
            background: '#10b981',
            borderTopLeftRadius: '8px',
            borderTopRightRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem'
          }}
        >
          <Check size={12} color="#000" strokeWidth={3} />
          <span
            style={{
              fontSize: '0.7rem',
              color: '#000',
              fontWeight: '800',
              letterSpacing: '0.05em'
            }}
          >
            DONE
          </span>
        </div>
        <div style={{ marginTop: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Instagram size={12} color="#10b981" />
            <span
              onClick={handleCopyHandle}
              style={{
                color: '#10b981',
                fontSize: '0.8rem',
                fontWeight: '600',
                cursor: 'pointer',
                textDecoration: copied ? 'none' : 'underline',
                textDecorationStyle: 'dotted'
              }}
            >
              {copied ? '✓ Gekopieerd!' : '@' + lead.instagram_handle}
            </span>
          </div>
        </div>
      </div>
    )
  }

  // ACTIVE CARDS - Full functionality
  return (
    <div
      style={{
        background: isSelected
          ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(139, 92, 246, 0.1) 100%)'
          : 'rgba(0, 0, 0, 0.4)',
        border: isSelected ? '2px solid #8b5cf6' : '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '10px',
        padding: '0.75rem',
        transition: 'all 0.2s ease',
        position: 'relative'
      }}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {onToggleSelect && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggleSelect()
          }}
          style={{
            position: 'absolute',
            top: '0.5rem',
            right: '0.5rem',
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            background: isSelected ? 'rgba(139, 92, 246, 0.3)' : 'rgba(255, 255, 255, 0.1)',
            border: isSelected ? '1px solid rgba(139, 92, 246, 0.5)' : '1px solid rgba(255, 255, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            zIndex: 2
          }}
        >
          {isSelected ? (
            <CheckSquare size={16} color="#8b5cf6" />
          ) : (
            <Square size={16} color="rgba(255, 255, 255, 0.5)" />
          )}
        </button>
      )}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '0.5rem',
          paddingRight: '2rem'
        }}
      >
        <Instagram size={14} color="#E1306C" />

        {isEditing ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flex: 1 }}>
            <input
              type="text"
              value={editHandle}
              onChange={(e) => setEditHandle(e.target.value)}
              style={{
                flex: 1,
                padding: '0.25rem 0.5rem',
                background: 'rgba(0, 0, 0, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '4px',
                color: '#fff',
                fontSize: '0.85rem'
              }}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveEdit()
                if (e.key === 'Escape') handleCancelEdit()
              }}
            />
            <button
              onClick={handleSaveEdit}
              style={{
                padding: '0.25rem',
                background: 'rgba(16, 185, 129, 0.2)',
                border: 'none',
                borderRadius: '4px',
                color: '#10b981',
                cursor: 'pointer'
              }}
            >
              <Check size={14} />
            </button>
            <button
              onClick={handleCancelEdit}
              style={{
                padding: '0.25rem',
                background: 'rgba(239, 68, 68, 0.2)',
                border: 'none',
                borderRadius: '4px',
                color: '#ef4444',
                cursor: 'pointer'
              }}
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <span
            onClick={handleCopyHandle}
            style={{
              color: copied ? '#10b981' : '#fff',
              fontSize: '0.9rem',
              fontWeight: '600',
              cursor: 'pointer',
              flex: 1,
              padding: '0.15rem 0.3rem',
              borderRadius: '4px',
              transition: 'all 0.2s ease',
              background: copied ? 'rgba(16, 185, 129, 0.2)' : 'transparent'
            }}
            title="Klik om te kopiëren"
          >
            {copied ? '✓ Gekopieerd!' : '@' + lead.instagram_handle}
          </span>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '0.5rem',
          flexWrap: 'wrap'
        }}
      >
        {lead.source && (
          <span
            style={{
              padding: '0.15rem 0.4rem',
              background: 'rgba(225, 48, 108, 0.15)',
              border: '1px solid rgba(225, 48, 108, 0.3)',
              borderRadius: '4px',
              fontSize: '0.65rem',
              color: '#E1306C'
            }}
          >
            {lead.source}
          </span>
        )}

        {daysInPhase > 0 && (
          <span
            style={{
              padding: '0.15rem 0.4rem',
              background: daysInPhase > 2 ? 'rgba(251, 191, 36, 0.15)' : 'rgba(255, 255, 255, 0.1)',
              border: daysInPhase > 2 ? '1px solid rgba(251, 191, 36, 0.3)' : '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '4px',
              fontSize: '0.65rem',
              color: daysInPhase > 2 ? '#fbbf24' : 'rgba(255, 255, 255, 0.6)'
            }}
          >
            {daysInPhase}d
          </span>
        )}
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
        {!showConvertButton && (
          <button
            onClick={() => onInteraction(lead.id)}
            style={{
              flex: 1,
              padding: '0.5rem',
              background: `linear-gradient(135deg, ${phaseColor}30 0%, ${phaseColor}15 100%)`,
              border: `1px solid ${phaseColor}50`,
              borderRadius: '6px',
              color: phaseColor,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
              fontSize: '0.75rem',
              fontWeight: '600',
              transition: 'all 0.2s ease',
              touchAction: 'manipulation',
              minHeight: '36px'
            }}
          >
            <Zap size={14} />
            Interactie
          </button>
        )}

        {showConvertButton && (
          <button
            onClick={() => onConvert(lead.id)}
            style={{
              flex: 1,
              padding: '0.5rem',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: 'none',
              borderRadius: '6px',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
              fontSize: '0.75rem',
              fontWeight: '600',
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
              touchAction: 'manipulation',
              minHeight: '36px'
            }}
          >
            <ArrowRight size={14} />
            Kanban
          </button>
        )}

        {(showActions || isMobile) && (
          <button
            onClick={() => setIsEditing(true)}
            style={{
              padding: '0.5rem',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '6px',
              color: 'rgba(255, 255, 255, 0.7)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '36px',
              minHeight: '36px',
              touchAction: 'manipulation'
            }}
          >
            <Edit3 size={14} />
          </button>
        )}

        {(showActions || isMobile) && (
          <button
            onClick={() => {
              if (confirm('@' + lead.instagram_handle + ' verwijderen?')) {
                onDelete(lead.id)
              }
            }}
            style={{
              padding: '0.5rem',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '6px',
              color: '#ef4444',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '36px',
              minHeight: '36px',
              touchAction: 'manipulation'
            }}
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  )
}
