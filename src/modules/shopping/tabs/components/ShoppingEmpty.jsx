// src/modules/shopping/tabs/components/ShoppingEmpty.jsx
import React from 'react'
import { Loader2 } from 'lucide-react'

export default function ShoppingEmpty({ 
  icon: Icon, 
  title, 
  message, 
  subMessage,
  action, 
  loading, 
  isMobile 
}) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '400px',
      padding: isMobile ? '2rem 1rem' : '3rem 1.5rem'
    }}>
      <div style={{
        maxWidth: '500px',
        width: '100%',
        textAlign: 'center'
      }}>
        {/* Icon or Loader - Glassmorphic bubble */}
        <div style={{
          width: isMobile ? '80px' : '100px',
          height: isMobile ? '80px' : '100px',
          margin: '0 auto',
          marginBottom: isMobile ? '1.5rem' : '2rem',
          borderRadius: isMobile ? '20px' : '24px',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.08) 100%)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 32px rgba(16, 185, 129, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
          animation: loading ? 'pulse 2s ease-in-out infinite' : 'none'
        }}>
          {loading ? (
            <Loader2 
              size={isMobile ? 32 : 40} 
              color="#10b981"
              style={{ 
                animation: 'spin 1s linear infinite',
                filter: 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.6))'
              }}
            />
          ) : Icon ? (
            <Icon 
              size={isMobile ? 32 : 40} 
              color="#10b981"
              strokeWidth={2}
              style={{ 
                filter: 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.6))'
              }}
            />
          ) : null}
        </div>

        {/* Title */}
        {title && (
          <h3 style={{
            color: 'white',
            fontSize: isMobile ? '1.25rem' : '1.5rem',
            fontWeight: '800',
            letterSpacing: '-0.02em',
            marginBottom: '0.75rem',
            textShadow: '0 2px 8px rgba(0, 0, 0, 0.6)'
          }}>
            {title}
          </h3>
        )}

        {/* Message */}
        {message && (
          <p style={{
            color: 'rgba(255, 255, 255, 0.6)',
            fontSize: isMobile ? '0.95rem' : '1.05rem',
            fontWeight: '600',
            lineHeight: 1.5,
            marginBottom: subMessage ? '0.5rem' : (action ? '1.5rem' : 0)
          }}>
            {message}
          </p>
        )}

        {/* Sub message */}
        {subMessage && (
          <p style={{
            color: 'rgba(255, 255, 255, 0.4)',
            fontSize: isMobile ? '0.8125rem' : '0.875rem',
            fontWeight: '600',
            lineHeight: 1.4,
            marginBottom: action ? '1.5rem' : 0
          }}>
            {subMessage}
          </p>
        )}

        {/* Action button */}
        {action && !loading && (
          <button
            onClick={action.onClick}
            style={{
              marginTop: isMobile ? '1.5rem' : '2rem',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.08) 100%)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: isMobile ? '12px' : '14px',
              padding: isMobile ? '0.875rem 1.5rem' : '1rem 2rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.625rem',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(16, 185, 129, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '44px',
              transform: 'translateZ(0)',
              outline: 'none'
            }}
            onMouseEnter={(e) => {
              if (!isMobile) {
                e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(16, 185, 129, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
              }
            }}
            onMouseLeave={(e) => {
              if (!isMobile) {
                e.currentTarget.style.transform = 'translateZ(0)'
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(16, 185, 129, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
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
            {action.icon && (
              <action.icon 
                size={isMobile ? 16 : 18} 
                color="#10b981"
                strokeWidth={2.5}
                style={{ filter: 'drop-shadow(0 0 4px rgba(16, 185, 129, 0.6))' }}
              />
            )}
            <span style={{
              color: '#10b981',
              fontSize: isMobile ? '0.875rem' : '0.95rem',
              fontWeight: '800',
              textTransform: 'uppercase',
              letterSpacing: '-0.01em',
              textShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
            }}>
              {action.label}
            </span>
          </button>
        )}
      </div>

      {/* Animations */}
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          
          @keyframes pulse {
            0%, 100% { 
              opacity: 1;
              transform: scale(1);
            }
            50% { 
              opacity: 0.8;
              transform: scale(1.02);
            }
          }
        `}
      </style>
    </div>
  )
}
