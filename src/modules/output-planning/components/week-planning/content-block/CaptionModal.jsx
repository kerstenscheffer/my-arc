// src/modules/output-planning/components/week-planning/content-block/CaptionModal.jsx
// Modal for editing captions - stored on content_pieces table (shared across phases)

import { useState, useEffect } from 'react'
import { X, MessageSquare, Copy, Check } from 'lucide-react'

export default function CaptionModal({
  isOpen,
  onClose,
  contentPiece,
  onSave,
  isMobile = false
}) {
  const [caption, setCaption] = useState('')
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)

  const MAX_CHARS = 2200 // Instagram limit

  useEffect(() => {
    if (isOpen && contentPiece) {
      setCaption(contentPiece.caption || '')
    }
  }, [isOpen, contentPiece])

  const handleSave = async () => {
    if (!contentPiece?.id) return
    
    setSaving(true)
    try {
      await onSave(contentPiece.id, caption)
      onClose()
    } catch (error) {
      console.error('Failed to save caption:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleCopy = async () => {
    if (!caption) return
    
    try {
      await navigator.clipboard.writeText(caption)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  if (!isOpen) return null

  const charCount = caption.length
  const isOverLimit = charCount > MAX_CHARS
  const charColor = isOverLimit ? '#ef4444' : charCount > MAX_CHARS * 0.9 ? '#f59e0b' : 'rgba(255, 255, 255, 0.5)'

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: isMobile ? '1rem' : '2rem'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '500px',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(139, 92, 246, 0.2)',
                border: '1px solid rgba(139, 92, 246, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <MessageSquare size={16} color="#8b5cf6" />
            </div>
            <div>
              <h3
                style={{
                  margin: 0,
                  fontSize: '1rem',
                  fontWeight: '700',
                  color: '#fff'
                }}
              >
                Caption
              </h3>
              <p
                style={{
                  margin: 0,
                  fontSize: '0.7rem',
                  color: 'rgba(255, 255, 255, 0.5)'
                }}
              >
                {contentPiece?.title || 'Content'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '8px',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={18} color="rgba(255, 255, 255, 0.7)" />
          </button>
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            padding: '1rem',
            overflow: 'auto'
          }}
        >
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Schrijf je caption hier...

Tips:
• Begin met een hook
• Gebruik emoji's 🔥
• Eindig met een CTA
• Max 2200 karakters (Instagram)"
            style={{
              width: '100%',
              minHeight: '250px',
              padding: '0.75rem',
              background: 'rgba(0, 0, 0, 0.3)',
              border: isOverLimit 
                ? '1px solid rgba(239, 68, 68, 0.5)' 
                : '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '0.9rem',
              fontFamily: 'inherit',
              lineHeight: '1.5',
              resize: 'vertical',
              outline: 'none'
            }}
          />

          {/* Character count */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '0.5rem'
            }}
          >
            <span
              style={{
                fontSize: '0.75rem',
                color: charColor
              }}
            >
              {charCount} / {MAX_CHARS} karakters
            </span>

            {caption && (
              <button
                onClick={handleCopy}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  padding: '0.25rem 0.5rem',
                  background: copied ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                  border: copied ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '4px',
                  color: copied ? '#10b981' : 'rgba(255, 255, 255, 0.7)',
                  fontSize: '0.7rem',
                  cursor: 'pointer'
                }}
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? 'Gekopieerd!' : 'Kopieer'}
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '0.5rem',
            padding: '1rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '0.5rem 1rem',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '6px',
              color: '#fff',
              fontSize: '0.85rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Annuleer
          </button>

          <button
            onClick={handleSave}
            disabled={saving || isOverLimit}
            style={{
              padding: '0.5rem 1rem',
              background: saving || isOverLimit 
                ? 'rgba(139, 92, 246, 0.3)' 
                : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              border: 'none',
              borderRadius: '6px',
              color: '#fff',
              fontSize: '0.85rem',
              fontWeight: '600',
              cursor: saving || isOverLimit ? 'not-allowed' : 'pointer',
              opacity: saving || isOverLimit ? 0.6 : 1
            }}
          >
            {saving ? 'Opslaan...' : 'Opslaan'}
          </button>
        </div>
      </div>
    </div>
  )
}
