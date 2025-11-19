// src/modules/meal-logging-wizard/components/SelectRouteModal.jsx
import React from 'react'
import { Book, Plus, Zap } from 'lucide-react'

/**
 * MY ARC - MEAL LOGGING ROUTE SELECTION
 * User chooses between 3 flows:
 * - Route X: Existing Meals (from ai_custom_meals)
 * - Route Y: New Meal (3 assembly options)
 * - Route Z: Quick Add (scan/search → log) ← NEW
 */
export default function SelectRouteModal({ onSelectRoute, onClose }) {
  const isMobile = window.innerWidth <= 768

  const routes = [
    {
      id: 'existing-meals',
      title: 'Mijn Gerechten',
      description: 'Kies uit je opgeslagen maaltijden',
      icon: Book,
      color: '#8b5cf6',
      gradient: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(124, 58, 237, 0.08) 100%)'
    },
    {
      id: 'new-meal',
      title: 'Nieuwe Maaltijd',
      description: 'Stel een complete maaltijd samen',
      icon: Plus,
      color: '#3b82f6',
      gradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.08) 100%)'
    },
    {
      id: 'quick-add',
      title: 'Snel Toevoegen',
      description: 'Scan of zoek → Log direct',
      icon: Zap,
      color: '#10b981',
      gradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.08) 100%)',
      badge: 'NIEUW'
    }
  ]

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: isMobile ? 'flex-end' : 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: isMobile ? '0' : '2rem',
        animation: 'fadeIn 0.3s ease'
      }}
    >
      <div
        style={{
          background: '#000',
          border: '1px solid #333',
          borderRadius: isMobile ? '24px 24px 0 0' : '24px',
          width: '100%',
          maxWidth: '600px',
          animation: 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '0 -4px 24px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{
          padding: isMobile ? '1.5rem 1rem' : '1.5rem 2rem',
          borderBottom: '1px solid rgba(16, 185, 129, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <h2 style={{
              fontSize: isMobile ? '1.2rem' : '1.5rem',
              fontWeight: '700',
              color: '#10b981',
              margin: 0
            }}>
              Maaltijd Loggen
            </h2>
            <p style={{
              fontSize: isMobile ? '0.8rem' : '0.9rem',
              color: 'rgba(255, 255, 255, 0.5)',
              margin: '0.25rem 0 0'
            }}>
              Kies hoe je wilt loggen
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#666',
              cursor: 'pointer',
              padding: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '44px',
              minWidth: '44px',
              transition: 'color 0.2s ease',
              fontSize: isMobile ? '1.5rem' : '1.75rem'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#666'}
          >
            ×
          </button>
        </div>

        {/* Routes */}
        <div style={{
          padding: isMobile ? '1rem' : '2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: isMobile ? '0.75rem' : '1rem'
        }}>
          {routes.map((route) => {
            const Icon = route.icon
            return (
              <button
                key={route.id}
                onClick={() => onSelectRoute(route.id)}
                style={{
                  background: route.gradient,
                  borderRadius: isMobile ? '14px' : '16px',
                  padding: isMobile ? '1.25rem' : '1.5rem',
                  border: `1px solid ${route.color}40`,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: isMobile ? '1rem' : '1.25rem',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  minHeight: '44px',
                  backdropFilter: 'blur(20px)',
                  boxShadow: `0 8px 24px ${route.color}15`,
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.background = route.gradient.replace('0.15', '0.2').replace('0.08', '0.12')
                  e.currentTarget.style.boxShadow = `0 12px 32px ${route.color}25`
                  e.currentTarget.style.borderColor = `${route.color}60`
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.background = route.gradient
                  e.currentTarget.style.boxShadow = `0 8px 24px ${route.color}15`
                  e.currentTarget.style.borderColor = `${route.color}40`
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
                {/* Gradient glow effect */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '50%',
                  background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.06) 0%, transparent 100%)',
                  pointerEvents: 'none'
                }} />

                {/* Icon container */}
                <div style={{
                  width: isMobile ? '52px' : '60px',
                  height: isMobile ? '52px' : '60px',
                  borderRadius: isMobile ? '12px' : '14px',
                  background: `${route.color}20`,
                  border: `1px solid ${route.color}30`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backdropFilter: 'blur(10px)',
                  boxShadow: `0 4px 12px ${route.color}20`,
                  flexShrink: 0,
                  position: 'relative'
                }}>
                  <Icon 
                    size={isMobile ? 24 : 28} 
                    color={route.color}
                    style={{
                      filter: `drop-shadow(0 0 8px ${route.color}60)`
                    }}
                  />
                  
                  {/* NEW Badge */}
                  {route.badge && (
                    <div style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-4px',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: '#000',
                      fontSize: '0.6rem',
                      fontWeight: '800',
                      padding: '0.15rem 0.35rem',
                      borderRadius: '4px',
                      letterSpacing: '0.05em',
                      boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)',
                      animation: 'pulse 2s ease-in-out infinite'
                    }}>
                      {route.badge}
                    </div>
                  )}
                </div>

                {/* Text content */}
                <div style={{
                  flex: 1,
                  textAlign: 'left'
                }}>
                  <div style={{
                    fontSize: isMobile ? '1.05rem' : '1.2rem',
                    fontWeight: '700',
                    color: route.color,
                    marginBottom: '0.2rem',
                    letterSpacing: '-0.01em'
                  }}>
                    {route.title}
                  </div>
                  <div style={{
                    fontSize: isMobile ? '0.8rem' : '0.85rem',
                    color: 'rgba(255, 255, 255, 0.5)',
                    fontWeight: '500',
                    lineHeight: 1.4
                  }}>
                    {route.description}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

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

        @keyframes pulse {
          0%, 100% { 
            opacity: 1;
            transform: scale(1);
          }
          50% { 
            opacity: 0.8;
            transform: scale(1.05);
          }
        }
      `}</style>
    </div>
  )
}
