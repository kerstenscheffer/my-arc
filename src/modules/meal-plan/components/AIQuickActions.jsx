// src/modules/meal-plan/components/AIQuickActions.jsx
// ✅ FIXED v2.0 - Better error handling + responsive grid
import React, { useState } from 'react'
import { 
  Star, PlusCircle, Clock, BookOpen, 
  ShoppingCart, ChefHat, TrendingUp, Sparkles, Calendar
} from 'lucide-react'
import AIFavoritesModal from './AIFavoritesModal'
import ClientMealBuilder from '../../client-meal-builder/ClientMealBuilder'

export default function AIQuickActions({
  onOpenHistory,
  onOpenMealBase,
  onOpenShopping,
  onOpenRecipes,
  onOpenWeekPlanner,
  onOpenWizard,
  db,
  clientId,
  client,
  onMealCreated
}) {
  const isMobile = window.innerWidth <= 768
  const [hoveredAction, setHoveredAction] = useState(null)
  const [showFavoritesModal, setShowFavoritesModal] = useState(false)
  const [showCustomMealBuilder, setShowCustomMealBuilder] = useState(false)
  
  const actions = [
    {
      id: 'wizard',
      label: 'Meal Setup',
      icon: Sparkles,
      color: '#8b5cf6',
      gradient: 'linear-gradient(135deg, rgba(139, 92, 246, 0.25) 0%, rgba(124, 58, 237, 0.15) 100%)',
      hoverGradient: 'linear-gradient(135deg, rgba(139, 92, 246, 0.35) 0%, rgba(124, 58, 237, 0.25) 100%)',
      onClick: () => {
        if (onOpenWizard) {
          onOpenWizard()
        } else {
          console.warn('⚠️ onOpenWizard handler not provided')
          alert('Meal Setup wizard is not available')
        }
      }
    },
    {
      id: 'week-planner',
      label: 'Week Planner',
      icon: Calendar,
      color: '#3b82f6',
      gradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.25) 0%, rgba(37, 99, 235, 0.15) 100%)',
      hoverGradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.35) 0%, rgba(37, 99, 235, 0.25) 100%)',
      onClick: () => {
        if (onOpenWeekPlanner) {
          onOpenWeekPlanner()
        } else {
          console.warn('⚠️ onOpenWeekPlanner handler not provided')
          alert('Week Planner is not available')
        }
      }
    },
    {
      id: 'favorites',
      label: 'Favorieten',
      icon: Star,
      color: '#fbbf24',
      gradient: 'linear-gradient(135deg, rgba(251, 191, 36, 0.25) 0%, rgba(245, 158, 11, 0.15) 100%)',
      hoverGradient: 'linear-gradient(135deg, rgba(251, 191, 36, 0.35) 0%, rgba(245, 158, 11, 0.25) 100%)',
      onClick: () => setShowFavoritesModal(true)
    },
    {
      id: 'custom',
      label: 'Eigen Meal',
      icon: PlusCircle,
      color: '#10b981',
      gradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(5, 150, 105, 0.15) 100%)',
      hoverGradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.35) 0%, rgba(5, 150, 105, 0.25) 100%)',
      onClick: () => setShowCustomMealBuilder(true)
    },
    {
      id: 'history',
      label: 'Historie',
      icon: Clock,
      color: '#3b82f6',
      gradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.25) 0%, rgba(37, 99, 235, 0.15) 100%)',
      hoverGradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.35) 0%, rgba(37, 99, 235, 0.25) 100%)',
      onClick: () => {
        if (onOpenHistory) {
          onOpenHistory()
        } else {
          console.warn('⚠️ onOpenHistory handler not provided')
          alert('History is not available')
        }
      }
    },
    {
      id: 'shopping',
      label: 'Boodschappen',
      icon: ShoppingCart,
      color: '#ef4444',
      gradient: 'linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, rgba(220, 38, 38, 0.15) 100%)',
      hoverGradient: 'linear-gradient(135deg, rgba(239, 68, 68, 0.35) 0%, rgba(220, 38, 38, 0.25) 100%)',
      onClick: () => {
        if (onOpenShopping) {
          onOpenShopping()
        } else {
          console.warn('⚠️ onOpenShopping handler not provided')
          alert('Shopping list is not available')
        }
      }
    }
  ]
  
  const handleFavoriteSelect = (mealId) => {
    console.log('✅ Favorite meal selected:', mealId)
    setShowFavoritesModal(false)
    if (onMealCreated) {
      onMealCreated({ type: 'favorite', mealId })
    }
  }
  
  const handleCustomMealSave = (meal) => {
    console.log('✅ Custom meal saved:', meal)
    setShowCustomMealBuilder(false)
    if (onMealCreated) {
      onMealCreated({ type: 'custom', meal })
    }
  }
  
  return (
    <>
      <div style={{
        padding: isMobile ? '0 1rem 1rem' : '0 1.5rem 1.5rem'
      }}>
        {/* Premium Section Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.625rem',
          marginBottom: isMobile ? '1rem' : '1.25rem',
          paddingLeft: '0.25rem'
        }}>
          <div style={{
            width: isMobile ? '36px' : '40px',
            height: isMobile ? '36px' : '40px',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.1) 100%)',
            backdropFilter: 'blur(12px)',
            borderRadius: isMobile ? '10px' : '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            boxShadow: '0 4px 16px rgba(16, 185, 129, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
            flexShrink: 0
          }}>
            <Sparkles size={isMobile ? 18 : 20} color="#10b981" style={{
              filter: 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.6))'
            }} />
          </div>
          <div>
            <h3 style={{
              fontSize: isMobile ? '1.1rem' : '1.35rem',
              fontWeight: '800',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              margin: 0,
              letterSpacing: '-0.02em',
              lineHeight: 1.2
            }}>
              Quick Actions
            </h3>
            <p style={{
              fontSize: isMobile ? '0.7rem' : '0.75rem',
              color: 'rgba(16, 185, 129, 0.6)',
              margin: '0.125rem 0 0 0',
              fontWeight: '600',
              letterSpacing: '0.02em'
            }}>
              Snel toegang tot je tools
            </p>
          </div>
        </div>
        
        {/* ✅ RESPONSIVE GRID: 2 cols mobile, 3 cols desktop */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
          gap: isMobile ? '0.75rem' : '1rem'
        }}>
          {actions.map(action => (
            <ActionCard
              key={action.id}
              action={action}
              isHovered={hoveredAction === action.id}
              onHover={setHoveredAction}
              isMobile={isMobile}
            />
          ))}
        </div>
        
        {/* Premium Motivational Card */}
        <div style={{
          marginTop: isMobile ? '1.25rem' : '1.5rem',
          padding: isMobile ? '1rem' : '1.25rem',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.08) 100%)',
          backdropFilter: 'blur(20px)',
          borderRadius: isMobile ? '16px' : '18px',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(16, 185, 129, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
        }}>
          {/* Top accent glow */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: 'linear-gradient(90deg, transparent 0%, #10b981 50%, transparent 100%)',
            opacity: 0.6
          }} />
          
          {/* Floating orbs */}
          <div style={{
            position: 'absolute',
            top: '-40px',
            right: '-40px',
            width: '120px',
            height: '120px',
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)',
            borderRadius: '50%',
            animation: 'float 8s ease-in-out infinite',
            pointerEvents: 'none'
          }} />
          <div style={{
            position: 'absolute',
            bottom: '-30px',
            left: '-30px',
            width: '80px',
            height: '80px',
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, transparent 70%)',
            borderRadius: '50%',
            animation: 'float 6s ease-in-out infinite 1s',
            pointerEvents: 'none'
          }} />
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '0.875rem' : '1rem',
            position: 'relative',
            zIndex: 1
          }}>
            <div style={{
              width: isMobile ? '44px' : '48px',
              height: isMobile ? '44px' : '48px',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.3) 0%, rgba(5, 150, 105, 0.2) 100%)',
              backdropFilter: 'blur(10px)',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              border: '1px solid rgba(16, 185, 129, 0.4)',
              boxShadow: '0 8px 24px rgba(16, 185, 129, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
              position: 'relative'
            }}>
              <TrendingUp 
                size={isMobile ? 22 : 24} 
                color="#10b981"
                style={{
                  filter: 'drop-shadow(0 2px 8px rgba(16, 185, 129, 0.6))'
                }}
              />
              {/* Glow effect */}
              <div style={{
                position: 'absolute',
                inset: '-2px',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.4), transparent)',
                borderRadius: '16px',
                opacity: 0.5,
                filter: 'blur(8px)',
                zIndex: -1
              }} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{
                fontSize: isMobile ? '0.95rem' : '1.05rem',
                color: 'white',
                margin: '0 0 0.25rem 0',
                fontWeight: '800',
                letterSpacing: '-0.02em',
                textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
              }}>
                Je bent op de goede weg!
              </p>
              <p style={{
                fontSize: isMobile ? '0.75rem' : '0.825rem',
                color: 'rgba(16, 185, 129, 0.8)',
                margin: 0,
                fontWeight: '600',
                letterSpacing: '0.01em'
              }}>
                Blijf consistent voor de beste resultaten 💪
              </p>
            </div>
          </div>
        </div>
        
        <style>{`
          @keyframes float {
            0%, 100% { 
              transform: translateY(0px) rotate(0deg) scale(1);
              opacity: 1;
            }
            50% { 
              transform: translateY(-15px) rotate(5deg) scale(1.05);
              opacity: 0.8;
            }
          }
          
          @keyframes shimmer {
            0% { 
              background-position: -200% center;
            }
            100% { 
              background-position: 200% center;
            }
          }
          
          @keyframes pulse {
            0%, 100% {
              transform: scale(1);
              opacity: 1;
            }
            50% {
              transform: scale(1.08);
              opacity: 0.9;
            }
          }
          
          @keyframes glow {
            0%, 100% {
              box-shadow: 0 0 15px currentColor;
              opacity: 0.6;
            }
            50% {
              box-shadow: 0 0 25px currentColor;
              opacity: 1;
            }
          }
        `}</style>
      </div>
      
      {/* Favorites Modal */}
      <AIFavoritesModal
        isOpen={showFavoritesModal}
        onClose={() => setShowFavoritesModal(false)}
        onSelectMeal={handleFavoriteSelect}
        currentMeal={null}
        db={db}
        service={null}
        client={client}
      />
      
      {/* Client Meal Builder Modal */}
      {showCustomMealBuilder && (
        <ClientMealBuilder
          client={client}
          db={db}
          onClose={() => setShowCustomMealBuilder(false)}
          onMealCreated={handleCustomMealSave}
        />
      )}
    </>
  )
}

// Premium Action Card Component
function ActionCard({ action, isHovered, onHover, isMobile }) {
  const Icon = action.icon
  
  return (
    <button
      onMouseEnter={() => onHover(action.id)}
      onMouseLeave={() => onHover(null)}
      onClick={action.onClick}
      style={{
        background: isHovered ? action.hoverGradient : action.gradient,
        backdropFilter: 'blur(12px)',
        borderRadius: isMobile ? '14px' : '16px',
        padding: isMobile ? '1rem 0.75rem' : '1.125rem 0.875rem',
        border: `1px solid ${action.color}${isHovered ? '40' : '30'}`,
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isHovered 
          ? 'translateY(-4px) scale(1.03)' 
          : 'translateY(0) scale(1)',
        boxShadow: isHovered
          ? `0 12px 32px ${action.color}35, 0 0 20px ${action.color}20, inset 0 1px 0 rgba(255,255,255,0.1)`
          : `0 4px 16px ${action.color}15, inset 0 1px 0 rgba(255,255,255,0.03)`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: isMobile ? '0.625rem' : '0.75rem',
        position: 'relative',
        overflow: 'hidden',
        minHeight: isMobile ? '100px' : '115px',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        aspectRatio: '1 / 1.1'
      }}
      onTouchStart={(e) => {
        if (isMobile) {
          e.currentTarget.style.transform = 'scale(0.97)'
          e.currentTarget.style.background = action.hoverGradient
        }
      }}
      onTouchEnd={(e) => {
        if (isMobile) {
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.background = action.gradient
        }
      }}
    >
      {/* Shimmer effect on hover */}
      {isHovered && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: '-100%',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
          animation: 'shimmer 0.8s ease'
        }} />
      )}
      
      {/* Top gradient overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: isHovered 
          ? 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 50%)'
          : 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 50%)',
        borderRadius: 'inherit',
        pointerEvents: 'none',
        transition: 'all 0.3s ease'
      }} />
      
      {/* Icon container */}
      <div style={{
        width: isMobile ? '40px' : '44px',
        height: isMobile ? '40px' : '44px',
        background: isHovered 
          ? `linear-gradient(135deg, ${action.color}30, ${action.color}20)`
          : 'rgba(17, 17, 17, 0.4)',
        backdropFilter: 'blur(10px)',
        borderRadius: isMobile ? '11px' : '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: `1px solid ${isHovered ? action.color + '40' : 'rgba(255, 255, 255, 0.08)'}`,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: isHovered 
          ? `0 8px 24px ${action.color}40, inset 0 1px 0 rgba(255,255,255,0.15)`
          : 'inset 0 1px 0 rgba(255,255,255,0.03)',
        position: 'relative',
        zIndex: 1,
        animation: isHovered ? 'pulse 2s infinite' : 'none'
      }}>
        <Icon 
          size={isMobile ? 20 : 22} 
          color={isHovered ? 'white' : action.color}
          style={{
            filter: isHovered 
              ? `drop-shadow(0 0 8px ${action.color})` 
              : `drop-shadow(0 0 4px ${action.color}60)`,
            transition: 'all 0.3s ease'
          }}
        />
        
        {/* Icon glow ring */}
        {isHovered && (
          <div style={{
            position: 'absolute',
            inset: '-3px',
            borderRadius: 'inherit',
            background: `linear-gradient(135deg, ${action.color}40, transparent)`,
            filter: 'blur(6px)',
            opacity: 0.6,
            animation: 'glow 2s infinite',
            zIndex: -1
          }} />
        )}
      </div>
      
      {/* Label */}
      <span style={{
        fontSize: isMobile ? '0.8rem' : '0.875rem',
        fontWeight: '800',
        color: isHovered ? 'white' : 'rgba(255, 255, 255, 0.8)',
        letterSpacing: '-0.01em',
        position: 'relative',
        zIndex: 1,
        textShadow: isHovered ? '0 2px 12px rgba(0,0,0,0.4)' : '0 1px 4px rgba(0,0,0,0.2)',
        transition: 'all 0.3s ease',
        textAlign: 'center',
        lineHeight: 1.2
      }}>
        {action.label}
      </span>
      
      {/* Bottom accent line */}
      {isHovered && (
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '50%',
          height: '3px',
          background: `linear-gradient(90deg, transparent, ${action.color}, transparent)`,
          borderRadius: '2px 2px 0 0',
          boxShadow: `0 -2px 12px ${action.color}80`,
          opacity: 0.8
        }} />
      )}
    </button>
  )
}
