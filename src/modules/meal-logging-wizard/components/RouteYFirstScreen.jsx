import React from 'react'

/**
 * ROUTE Y FIRST SCREEN
 * =====================
 * First choice menu for "Nieuwe maaltijd maken" flow
 * Shows 3 gradient button options
 * 
 * Reference: SelectRouteModal.jsx for button styling
 */

export default function RouteYFirstScreen({ onSelectOption, onClose }) {
  const isMobile = window.innerWidth <= 768

  const options = [
    {
      id: 'existing-meals',
      emoji: '🍽️',
      title: 'Bestaande gerechten',
      description: 'Kies uit AI meals of jouw custom gerechten',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    {
      id: 'recent-ingredients',
      emoji: '⏱️',
      title: 'Recente ingrediënten',
      description: 'Snel toevoegen wat je recent gebruikte',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
    },
    {
      id: 'search-ingredients',
      emoji: '🔍',
      title: 'Zoek ingrediënten',
      description: 'Zoek en scan nieuwe ingrediënten',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
    }
  ]

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        zIndex: 10000,
        padding: isMobile ? '0' : '2rem'
      }}
    >
      {/* Modal Card */}
      <div
        style={{
          background: '#000',
          border: '1px solid #333',
          borderRadius: isMobile ? '24px 24px 0 0' : '24px',
          padding: isMobile ? '2rem 1.5rem' : '2.5rem',
          maxWidth: '600px',
          width: '100%',
          maxHeight: isMobile ? '90vh' : '85vh',
          overflowY: 'auto',
          animation: 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '0 -4px 24px rgba(0, 0, 0, 0.5)'
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: isMobile ? '1.5rem' : '2rem' }}>
          <div
            style={{
              fontSize: isMobile ? '1.5rem' : '1.75rem',
              fontWeight: '700',
              color: '#fff',
              marginBottom: '0.5rem',
              textAlign: 'center'
            }}
          >
            Nieuwe maaltijd maken
          </div>
          <div
            style={{
              fontSize: isMobile ? '0.9rem' : '1rem',
              color: 'rgba(255, 255, 255, 0.6)',
              textAlign: 'center',
              fontWeight: '500'
            }}
          >
            Kies hoe je je maaltijd wilt samenstellen
          </div>
        </div>

        {/* Options Grid */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: isMobile ? '1rem' : '1.25rem'
          }}
        >
          {options.map((option) => (
            <button
              key={option.id}
              onClick={() => {
                console.log('🎯 [RouteYFirstScreen] Selected:', option.id)
                onSelectOption(option.id)
              }}
              style={{
                background: option.gradient,
                border: 'none',
                borderRadius: '16px',
                padding: isMobile ? '1.5rem' : '1.75rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '1.25rem',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                minHeight: '44px'
              }}
              onMouseEnter={(e) => {
                if (!isMobile) {
                  e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)'
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.4)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isMobile) {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)'
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
              {/* Icon */}
              <div
                style={{
                  width: isMobile ? '56px' : '64px',
                  height: isMobile ? '56px' : '64px',
                  background: 'rgba(255, 255, 255, 0.15)',
                  borderRadius: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: isMobile ? '2rem' : '2.5rem',
                  flexShrink: 0,
                  backdropFilter: 'blur(10px)'
                }}
              >
                {option.emoji}
              </div>

              {/* Content */}
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div
                  style={{
                    fontSize: isMobile ? '1.05rem' : '1.15rem',
                    fontWeight: '700',
                    color: '#fff',
                    marginBottom: '0.25rem'
                  }}
                >
                  {option.title}
                </div>
                <div
                  style={{
                    fontSize: isMobile ? '0.8rem' : '0.875rem',
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontWeight: '500'
                  }}
                >
                  {option.description}
                </div>
              </div>

              {/* Arrow */}
              <div
                style={{
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: '1.5rem',
                  flexShrink: 0
                }}
              >
                →
              </div>
            </button>
          ))}
        </div>

        {/* Cancel Button */}
        <button
          onClick={onClose}
          style={{
            marginTop: isMobile ? '1.5rem' : '2rem',
            width: '100%',
            padding: isMobile ? '1rem' : '1.25rem',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            color: 'rgba(255, 255, 255, 0.6)',
            fontSize: isMobile ? '0.95rem' : '1.05rem',
            fontWeight: '600',
            cursor: 'pointer',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            transition: 'all 0.2s ease',
            minHeight: '44px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
          }}
        >
          Annuleren
        </button>
      </div>

      {/* Animation */}
      <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}
