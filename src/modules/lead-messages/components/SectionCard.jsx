// src/modules/lead-messages/components/SectionCard.jsx
import React from 'react'
import { ChevronRight } from 'lucide-react'

export default function SectionCard({ 
  icon: Icon, 
  title, 
  description, 
  color, 
  onClick,
  badge = null
}) {
  const isMobile = window.innerWidth <= 768

  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        padding: isMobile ? '1.25rem' : '1.5rem',
        background: `linear-gradient(135deg, ${color}15 0%, ${color}08 100%)`,
        border: `2px solid ${color}40`,
        borderRadius: '16px',
        cursor: 'pointer',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        transition: 'all 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        textAlign: 'left',
        minHeight: '44px'
      }}
      onTouchStart={(e) => {
        if (isMobile) {
          e.currentTarget.style.transform = 'scale(0.98)'
        }
      }}
      onTouchEnd={(e) => {
        if (isMobile) {
          e.currentTarget.style.transform = 'scale(1)'
        }
      }}
    >
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '12px',
        background: `${color}20`,
        border: `1px solid ${color}40`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        position: 'relative'
      }}>
        <Icon size={24} color={color} />
        {badge && (
          <div style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            background: '#ef4444',
            color: '#fff',
            fontSize: '0.65rem',
            fontWeight: '700',
            padding: '2px 6px',
            borderRadius: '10px',
            minWidth: '18px',
            textAlign: 'center'
          }}>
            {badge}
          </div>
        )}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{
          color: '#fff',
          fontWeight: '700',
          fontSize: isMobile ? '1rem' : '1.1rem',
          marginBottom: '0.25rem'
        }}>
          {title}
        </div>
        <div style={{
          color: 'rgba(255,255,255,0.6)',
          fontSize: isMobile ? '0.8rem' : '0.85rem'
        }}>
          {description}
        </div>
      </div>
      <ChevronRight size={20} color="rgba(255,255,255,0.4)" />
    </button>
  )
}
