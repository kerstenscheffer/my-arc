// src/modules/shopping/tabs/components/ShoppingExportMenu.jsx
import React from 'react'
import { Share2, Copy, X } from 'lucide-react'

export default function ShoppingExportMenu({ onShare, onCopy, onClose, isMobile }) {
  const menuItems = [
    {
      icon: Share2,
      label: 'Delen via WhatsApp',
      onClick: onShare,
      color: '#25D366'
    },
    {
      icon: Copy,
      label: 'Kopiëren naar klembord',
      onClick: onCopy,
      color: '#10b981'
    }
  ]

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 998,
          animation: 'fadeIn 0.2s ease-out'
        }}
      />

      {/* Menu container */}
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 999,
        width: isMobile ? 'calc(100% - 2rem)' : '400px',
        maxWidth: '400px',
        animation: 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        {/* Glassmorphic card */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.95) 0%, rgba(23, 23, 23, 0.9) 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: isMobile ? '16px' : '20px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
          overflow: 'hidden'
        }}>
          {/* Top accent glow */}
          <div style={{
            height: '2px',
            background: 'linear-gradient(90deg, transparent 0%, #10b981 50%, transparent 100%)',
            opacity: 0.6
          }} />

          {/* Header */}
          <div style={{
            padding: isMobile ? '1.25rem 1rem 1rem 1rem' : '1.5rem 1.25rem 1.25rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
          }}>
            <h3 style={{
              color: 'white',
              fontSize: isMobile ? '1.125rem' : '1.25rem',
              fontWeight: '800',
              letterSpacing: '-0.02em',
              textShadow: '0 2px 8px rgba(0, 0, 0, 0.6)'
            }}>
              Exporteren
            </h3>
            <button
              onClick={onClose}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                outline: 'none'
              }}
              onMouseEnter={(e) => {
                if (!isMobile) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                  e.currentTarget.style.transform = 'scale(1.1)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isMobile) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                  e.currentTarget.style.transform = 'scale(1)'
                }
              }}
            >
              <X size={16} color="rgba(255, 255, 255, 0.5)" strokeWidth={2.5} />
            </button>
          </div>

          {/* Menu items */}
          <div style={{
            padding: isMobile ? '0.75rem' : '1rem'
          }}>
            {menuItems.map((item, index) => {
              const Icon = item.icon
              return (
                <button
                  key={item.label}
                  onClick={item.onClick}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: isMobile ? '0.875rem 1rem' : '1rem 1.25rem',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: isMobile ? '10px' : '12px',
                    cursor: 'pointer',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent',
                    minHeight: '44px',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    marginBottom: index < menuItems.length - 1 ? '0.5rem' : 0,
                    outline: 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (!isMobile) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                      e.currentTarget.style.transform = 'translateX(4px)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isMobile) {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.transform = 'translateX(0)'
                    }
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
                  {/* Icon bubble */}
                  <div style={{
                    width: isMobile ? '40px' : '44px',
                    height: isMobile ? '40px' : '44px',
                    borderRadius: '10px',
                    background: `${item.color}26`,
                    border: `1px solid ${item.color}4D`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: `0 4px 12px ${item.color}33`
                  }}>
                    <Icon 
                      size={isMobile ? 18 : 20} 
                      color={item.color}
                      strokeWidth={2.5}
                      style={{ filter: `drop-shadow(0 0 4px ${item.color}66)` }}
                    />
                  </div>

                  {/* Label */}
                  <span style={{
                    color: 'white',
                    fontSize: isMobile ? '0.95rem' : '1rem',
                    fontWeight: '700',
                    letterSpacing: '-0.01em',
                    textAlign: 'left',
                    flex: 1
                  }}>
                    {item.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Animations */}
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          
          @keyframes slideUp {
            from { 
              opacity: 0;
              transform: translate(-50%, -45%);
            }
            to { 
              opacity: 1;
              transform: translate(-50%, -50%);
            }
          }
        `}
      </style>
    </>
  )
}
