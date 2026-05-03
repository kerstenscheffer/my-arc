// src/modules/lead-magnet/components/MessageTemplate.jsx
import React from 'react'
import { Copy, Check } from 'lucide-react'

export default function MessageTemplate({ 
  text, 
  id, 
  label, 
  note, 
  copiedId, 
  onCopy,
  isMobile,
  tags = []
}) {
  const copyMessage = () => {
    navigator.clipboard.writeText(text).then(() => {
      onCopy(id)
    }).catch(() => {
      alert('Kon niet kopiëren')
    })
  }

  return (
    <div style={{ marginBottom: '1rem' }} data-tags={tags.join(',')}>
      {label && (
        <div style={{
          fontSize: '0.75rem',
          color: '#10b981',
          fontWeight: '600',
          marginBottom: '0.5rem',
          textTransform: 'uppercase',
          letterSpacing: '0.03em',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          flexWrap: 'wrap'
        }}>
          {label}
          {tags.length > 0 && (
            <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
              {tags.map((tag, i) => (
                <span key={i} style={{
                  background: 'rgba(139, 92, 246, 0.2)',
                  color: '#a78bfa',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '6px',
                  fontSize: '0.65rem',
                  textTransform: 'lowercase'
                }}>
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
      <div
        onClick={copyMessage}
        style={{
          background: copiedId === id 
            ? 'linear-gradient(135deg, #059669 0%, #047857 100%)'
            : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: '#fff',
          padding: isMobile ? '1rem' : '1.25rem',
          borderRadius: '16px',
          fontSize: isMobile ? '0.9rem' : '0.95rem',
          lineHeight: 1.6,
          whiteSpace: 'pre-wrap',
          cursor: 'pointer',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
          boxShadow: '0 4px 16px rgba(16, 185, 129, 0.3)',
          transition: 'all 0.2s ease',
          transform: copiedId === id ? 'scale(0.98)' : 'scale(1)',
          position: 'relative'
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
          {copiedId === id ? (
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
