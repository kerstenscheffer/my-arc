// src/modules/dm-conversation/utils/components/MessageCard.jsx
// Renders the current DM message with copy + edit (local & permanent save)

import { useState, useRef, useEffect } from 'react'
import { Copy, CheckCircle, Edit2, Save, RotateCcw, X, Database } from 'lucide-react'

export default function MessageCard({ 
  message, 
  leadName, 
  isMobile, 
  onSavePermanent,  // (variantId, newText) => Promise
  phaseColor = '#D4AF37'
}) {
  const [copyFeedback, setCopyFeedback] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState('')
  const [savingPermanent, setSavingPermanent] = useState(false)
  const [savedFeedback, setSavedFeedback] = useState(null) // 'local' | 'permanent' | null
  const textareaRef = useRef(null)

  if (!message) return null

  const replaceName = (text) => (text || '').replace(/\[naam\]/g, leadName || '[naam]')
  const displayText = replaceName(message.text)

  // Auto-resize textarea
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [isEditing, editText])

  const handleCopy = async () => {
    const textToCopy = isEditing ? replaceName(editText) : displayText
    try {
      await navigator.clipboard.writeText(textToCopy)
      setCopyFeedback(true)
      setTimeout(() => setCopyFeedback(false), 2000)
    } catch (e) { console.error('Copy failed:', e) }
  }

  const handleStartEdit = () => {
    setEditText(message.text) // raw text with [naam] placeholder
    setIsEditing(true)
    setSavedFeedback(null)
  }

  const handleSaveLocal = () => {
    // Local edit only — just close editor, text stays in editText for copy
    setIsEditing(false)
    setSavedFeedback('local')
    setTimeout(() => setSavedFeedback(null), 2000)
  }

  const handleSavePermanent = async () => {
    if (!onSavePermanent || !message.id) return
    setSavingPermanent(true)
    try {
      await onSavePermanent(message.id, editText)
      setIsEditing(false)
      setSavedFeedback('permanent')
      setTimeout(() => setSavedFeedback(null), 3000)
    } catch (e) {
      console.error('Permanent save failed:', e)
    } finally {
      setSavingPermanent(false)
    }
  }

  const handleCancel = () => {
    setEditText('')
    setIsEditing(false)
  }

  const currentDisplayText = isEditing ? replaceName(editText) : 
    (editText && !isEditing && savedFeedback === 'local') ? replaceName(editText) : displayText

  return (
    <div style={{
      background: '#0a0a0a',
      border: '1px solid rgba(255,255,255,0.06)',
      borderLeft: `3px solid ${phaseColor}`,
      borderRadius: isMobile ? '10px' : '12px',
      overflow: 'hidden',
      marginBottom: '0.75rem'
    }}>
      {/* Header: tone label + actions */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: isMobile ? '0.4rem 0.625rem' : '0.5rem 0.75rem',
        borderBottom: '1px solid rgba(255,255,255,0.04)'
      }}>
        <span style={{
          fontSize: '0.4rem', fontWeight: '700',
          color: phaseColor, textTransform: 'uppercase',
          letterSpacing: '0.06em'
        }}>
          {message.tone || 'BERICHT'}
        </span>

        <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
          {savedFeedback && (
            <span style={{
              fontSize: '0.5rem', fontWeight: '600',
              color: savedFeedback === 'permanent' ? '#10b981' : '#fbbf24',
              display: 'flex', alignItems: 'center', gap: '2px'
            }}>
              <CheckCircle size={8} />
              {savedFeedback === 'permanent' ? 'DB opgeslagen' : 'Lokaal'}
            </span>
          )}

          {!isEditing && (
            <button onClick={handleStartEdit}
              style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '4px', color: 'rgba(255,255,255,0.25)', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
              <Edit2 size={10} />
            </button>
          )}

          <button onClick={handleCopy}
            style={{
              padding: '0.2rem 0.4rem',
              background: copyFeedback ? 'rgba(16,185,129,0.12)' : `${phaseColor}12`,
              border: `1px solid ${copyFeedback ? 'rgba(16,185,129,0.25)' : phaseColor + '25'}`,
              borderRadius: '4px',
              color: copyFeedback ? '#10b981' : phaseColor,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '3px',
              fontSize: '0.5rem', fontWeight: '700',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '24px'
            }}>
            {copyFeedback ? <CheckCircle size={9} /> : <Copy size={9} />}
            {copyFeedback ? 'Gekopieerd' : 'Kopieer'}
          </button>
        </div>
      </div>

      {/* Message body */}
      <div style={{ padding: isMobile ? '0.5rem 0.625rem' : '0.625rem 0.75rem' }}>
        {isEditing ? (
          <>
            <textarea
              ref={textareaRef}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                background: 'rgba(255,255,255,0.03)',
                border: `1px solid ${phaseColor}25`,
                borderRadius: '6px',
                color: '#fff',
                fontSize: isMobile ? '0.8rem' : '0.85rem',
                fontFamily: 'inherit',
                lineHeight: 1.6,
                resize: 'none',
                outline: 'none',
                minHeight: '80px'
              }}
            />
            {/* Edit actions */}
            <div style={{
              display: 'flex', gap: '0.25rem', marginTop: '0.375rem',
              flexWrap: 'wrap'
            }}>
              <button onClick={handleSaveLocal}
                style={{ padding: '0.25rem 0.4rem', background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: '4px', color: '#fbbf24', fontSize: '0.5rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', minHeight: '24px', touchAction: 'manipulation' }}>
                <Save size={9} /> Eenmalig
              </button>
              {onSavePermanent && (
                <button onClick={handleSavePermanent} disabled={savingPermanent}
                  style={{ padding: '0.25rem 0.4rem', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '4px', color: '#10b981', fontSize: '0.5rem', fontWeight: '700', cursor: savingPermanent ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: '3px', minHeight: '24px', opacity: savingPermanent ? 0.5 : 1, touchAction: 'manipulation' }}>
                  <Database size={9} /> {savingPermanent ? '...' : 'Permanent'}
                </button>
              )}
              <button onClick={handleCancel}
                style={{ padding: '0.25rem 0.4rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '4px', color: 'rgba(255,255,255,0.3)', fontSize: '0.5rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', minHeight: '24px', touchAction: 'manipulation' }}>
                <X size={9} /> Annuleer
              </button>
            </div>
          </>
        ) : (
          <div style={{
            fontSize: isMobile ? '0.8rem' : '0.85rem',
            lineHeight: 1.6,
            color: 'rgba(255,255,255,0.85)',
            whiteSpace: 'pre-wrap'
          }}>
            {currentDisplayText}
          </div>
        )}
      </div>
    </div>
  )
}
