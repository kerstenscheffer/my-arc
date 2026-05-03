// src/modules/dm-conversation/utils/components/VariantPicker.jsx
// Shows all message variants with actual text preview — click to select

import { useState } from 'react'
import { CheckCircle, ChevronDown, ChevronUp } from 'lucide-react'

export default function VariantPicker({ 
  variants, 
  selectedVariantId, 
  onSelect, 
  leadName,
  isMobile,
  phaseColor = '#D4AF37'
}) {
  const [expanded, setExpanded] = useState(false)

  if (!variants || variants.length <= 1) return null

  const replaceName = (text) => (text || '').replace(/\[naam\]/g, leadName || '[naam]')

  return (
    <div style={{
      background: '#0a0a0a',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: isMobile ? '10px' : '12px',
      overflow: 'hidden',
      marginBottom: '0.75rem'
    }}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: isMobile ? '0.4rem 0.625rem' : '0.5rem 0.75rem',
          background: 'transparent',
          border: 'none',
          borderBottom: expanded ? '1px solid rgba(255,255,255,0.04)' : 'none',
          cursor: 'pointer',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent'
        }}
      >
        <span style={{
          fontSize: '0.4rem', fontWeight: '700',
          color: phaseColor,
          textTransform: 'uppercase',
          letterSpacing: '0.06em'
        }}>
          {variants.length} VARIANTEN — KIES BERICHT
        </span>
        {expanded ? <ChevronUp size={12} color="rgba(255,255,255,0.25)" /> : <ChevronDown size={12} color="rgba(255,255,255,0.25)" />}
      </button>

      {/* Variant list */}
      {expanded && (
        <div>
          {variants.map((variant, idx) => {
            const isSelected = selectedVariantId === variant.id || (!selectedVariantId && idx === 0)
            const previewText = replaceName(variant.text || '')
            const truncated = previewText.length > 120 ? previewText.substring(0, 120) + '...' : previewText

            return (
              <button
                key={variant.id}
                onClick={() => onSelect(variant.id)}
                style={{
                  width: '100%',
                  display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
                  padding: isMobile ? '0.5rem 0.625rem' : '0.5rem 0.75rem',
                  background: isSelected ? `${phaseColor}08` : 'transparent',
                  border: 'none',
                  borderBottom: idx < variants.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
                  borderLeft: isSelected ? `3px solid ${phaseColor}` : '3px solid transparent',
                  cursor: 'pointer',
                  textAlign: 'left',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  transition: 'all 0.15s ease'
                }}
              >
                {/* Selection indicator */}
                <div style={{
                  width: '16px', height: '16px', marginTop: '1px',
                  borderRadius: '50%',
                  border: isSelected ? `2px solid ${phaseColor}` : '1.5px solid rgba(255,255,255,0.12)',
                  background: isSelected ? `${phaseColor}20` : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {isSelected && <CheckCircle size={10} color={phaseColor} />}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: isMobile ? '0.65rem' : '0.7rem',
                    fontWeight: '700',
                    color: isSelected ? phaseColor : 'rgba(255,255,255,0.5)',
                    marginBottom: '2px'
                  }}>
                    {variant.tone}
                  </div>
                  <div style={{
                    fontSize: isMobile ? '0.6rem' : '0.65rem',
                    color: isSelected ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.25)',
                    lineHeight: 1.4,
                    whiteSpace: 'pre-wrap',
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical'
                  }}>
                    {truncated}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
