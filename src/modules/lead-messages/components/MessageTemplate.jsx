// src/modules/lead-messages/components/MessageTemplate.jsx
import React from 'react'
import { Copy, Check } from 'lucide-react'

export default function MessageTemplate({ 
  text, 
  id, 
  label, 
  note, 
  copiedId, 
  onCopy,
  color = '#10b981'
}) {
  const isMobile = window.innerWidth <= 768
  const isCopied = copiedId === id

  return (
    <div style={{ marginBottom: '1rem' }}>
      {label && (
        <div style={{
          fontSize: '0.75rem',
          color: color,
          fontWeight: '600',
          marginBottom: '0.5rem',
          textTransform: 'uppercase',
          letterSpacing: '0.03em'
        }}>
          {label}
        </div>
      )}
      <div
        onClick={() => onCopy(text, id)}
        style={{
          background: isCopied 
            ? `linear-gradient(135deg, ${adjustColor(color, -20)} 0%, ${adjustColor(color, -30)} 100%)`
            : `linear-gradient(135deg, ${color} 0%, ${adjustColor(color, -15)} 100%)`,
          color: '#fff',
          padding: isMobile ? '1rem' : '1.25rem',
          borderRadius: '16px',
          fontSize: isMobile ? '0.9rem' : '0.95rem',
          lineHeight: 1.6,
          whiteSpace: 'pre-wrap',
          cursor: 'pointer',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
          boxShadow: `0 4px 16px ${color}40`,
          transition: 'all 0.2s ease',
          transform: isCopied ? 'scale(0.98)' : 'scale(1)',
          position: 'relative',
          minHeight: '44px'
        }}
      >
        {text}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: '0.5rem',
          marginTop: '0.75rem',
          paddingTop: '0.75rem',
          borderTop: '1px solid rgba(255,255,255,0.2)',
          fontSize: '0.75rem',
          opacity: 0.9
        }}>
          {isCopied ? (
            <>
              <Check size={14} />
              Gekopieerd!
            </>
          ) : (
            <>
              <Copy size={14} />
              Tap om te kopiëren
            </>
          )}
        </div>
      </div>
      {note && (
        <div style={{
          marginTop: '0.5rem',
          padding: '0.75rem',
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: '8px',
          fontSize: '0.8rem',
          color: '#f59e0b'
        }}>
          💡 {note}
        </div>
      )}
    </div>
  )
}

// Helper functie om kleur lichter/donkerder te maken
function adjustColor(hex, percent) {
  const num = parseInt(hex.replace('#', ''), 16)
  const amt = Math.round(2.55 * percent)
  const R = (num >> 16) + amt
  const G = (num >> 8 & 0x00FF) + amt
  const B = (num & 0x0000FF) + amt
  
  return '#' + (
    0x1000000 +
    (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
    (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
    (B < 255 ? (B < 1 ? 0 : B) : 255)
  ).toString(16).slice(1)
}
