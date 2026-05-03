// src/modules/lead-messages/components/UIComponents.jsx
import React from 'react'
import { ArrowLeft } from 'lucide-react'

// Back Button Component
export function BackButton({ onClick, label = "Terug" }) {
  const isMobile = window.innerWidth <= 768
  
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.75rem 1rem',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '10px',
        color: 'rgba(255,255,255,0.7)',
        fontSize: '0.85rem',
        fontWeight: '600',
        cursor: 'pointer',
        marginBottom: '1.5rem',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        minHeight: '44px',
        transition: 'all 0.2s ease'
      }}
    >
      <ArrowLeft size={16} />
      {label}
    </button>
  )
}

// Section Header Component
export function SectionHeader({ icon: Icon, title, color, subtitle = null }) {
  const isMobile = window.innerWidth <= 768
  
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      marginBottom: '1.5rem',
      paddingBottom: '1rem',
      borderBottom: `2px solid ${color}40`
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        borderRadius: '10px',
        background: `${color}20`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Icon size={20} color={color} />
      </div>
      <div>
        <h2 style={{
          color: '#fff',
          fontSize: isMobile ? '1.25rem' : '1.5rem',
          fontWeight: '700',
          margin: 0
        }}>
          {title}
        </h2>
        {subtitle && (
          <p style={{
            color: 'rgba(255,255,255,0.5)',
            fontSize: '0.8rem',
            margin: '0.25rem 0 0 0'
          }}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  )
}

// SubSection Button Component
export function SubSectionButton({ label, onClick, color = '#10b981', icon = null }) {
  const isMobile = window.innerWidth <= 768
  
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        padding: '1rem',
        background: 'rgba(255,255,255,0.03)',
        border: `1px solid ${color}40`,
        borderRadius: '12px',
        color: '#fff',
        fontWeight: '600',
        fontSize: isMobile ? '0.9rem' : '0.95rem',
        cursor: 'pointer',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        transition: 'all 0.2s ease',
        textAlign: 'left',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        minHeight: '44px'
      }}
      onTouchStart={(e) => {
        if (isMobile) {
          e.currentTarget.style.transform = 'scale(0.98)'
          e.currentTarget.style.background = `${color}15`
        }
      }}
      onTouchEnd={(e) => {
        if (isMobile) {
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
        }
      }}
    >
      {icon && <span>{icon}</span>}
      {label}
    </button>
  )
}

// Divider Component
export function Divider({ text }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      margin: '1.5rem 0'
    }}>
      <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
      <span style={{ 
        color: 'rgba(255,255,255,0.4)', 
        fontSize: '0.75rem', 
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
      }}>
        {text}
      </span>
      <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
    </div>
  )
}

// Info Box Component
export function InfoBox({ children, color = '#10b981', icon = '📝' }) {
  return (
    <div style={{
      background: `${color}15`,
      border: `1px solid ${color}40`,
      borderRadius: '12px',
      padding: '1rem',
      marginBottom: '1.5rem'
    }}>
      <div style={{ 
        color: color, 
        fontSize: '0.85rem', 
        fontWeight: '600',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.5rem'
      }}>
        <span>{icon}</span>
        <span>{children}</span>
      </div>
    </div>
  )
}

// Strategy Box Component
export function StrategyBox({ strategy, color = '#10b981' }) {
  return (
    <div style={{
      background: `${color}10`,
      border: `1px solid ${color}30`,
      borderRadius: '12px',
      padding: '1rem',
      marginBottom: '1.5rem'
    }}>
      <div style={{ 
        color: color, 
        fontSize: '0.85rem', 
        fontWeight: '600' 
      }}>
        🎯 STRATEGIE: {strategy}
      </div>
    </div>
  )
}

// Compliment List Component
export function ComplimentList({ compliments, color = '#8b5cf6' }) {
  return (
    <div style={{
      background: `${color}10`,
      border: `1px solid ${color}30`,
      borderRadius: '12px',
      padding: '1rem'
    }}>
      <div style={{ 
        color: color, 
        fontSize: '0.8rem', 
        fontWeight: '600', 
        marginBottom: '0.75rem' 
      }}>
        💡 Complimenten om te gebruiken:
      </div>
      <div style={{ 
        color: 'rgba(255,255,255,0.8)', 
        fontSize: '0.9rem', 
        lineHeight: 1.8 
      }}>
        {compliments.map((comp, i) => (
          <div key={i}>• {comp}</div>
        ))}
      </div>
    </div>
  )
}

// Toast Component
export function Toast({ visible, message = "Gekopieerd!" }) {
  if (!visible) return null
  
  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      color: '#fff',
      padding: '14px 28px',
      borderRadius: '30px',
      fontWeight: '700',
      fontSize: '0.95rem',
      zIndex: 1000,
      boxShadow: '0 8px 24px rgba(16, 185, 129, 0.5)',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      animation: 'slideUp 0.3s ease'
    }}>
      ✓ {message}
    </div>
  )
}
