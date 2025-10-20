// src/modules/meal-plan/components/AIQuickActions.jsx
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
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
      lightGradient: 'linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, rgba(124, 58, 237, 0.04) 100%)',
      onClick: () => onOpenWizard?.()
    },
    {
      id: 'week-planner',
      label: 'Week Planner',
      icon: Calendar,
      color: '#3b82f6',
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      lightGradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(59, 130, 246, 0.04) 100%)',
      onClick: () => onOpenWeekPlanner?.()
    },
    {
      id: 'favorites',
      label: 'Favorieten',
      icon: Star,
      color: '#fbbf24',
      gradient: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
      lightGradient: 'linear-gradient(135deg, rgba(251, 191, 36, 0.12) 0%, rgba(251, 191, 36, 0.04) 100%)',
      onClick: () => setShowFavoritesModal(true)
    },
    {
      id: 'custom',
      label: 'Eigen Meal',
      icon: PlusCircle,
      color: '#10b981',
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      lightGradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(16, 185, 129, 0.04) 100%)',
      onClick: () => setShowCustomMealBuilder(true)
    },
    {
      id: 'history',
      label: 'Historie',
      icon: Clock,
      color: '#3b82f6',
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      lightGradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(59, 130, 246, 0.04) 100%)',
      onClick: onOpenHistory
    },
    {
      id: 'mealbase',
      label: 'Meal Base',
      icon: BookOpen,
      color: '#8b5cf6',
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
      lightGradient: 'linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, rgba(139, 92, 246, 0.04) 100%)',
      onClick: onOpenMealBase
    },
    {
      id: 'shopping',
      label: 'Boodschappen',
      icon: ShoppingCart,
      color: '#ef4444',
      gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      lightGradient: 'linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(239, 68, 68, 0.04) 100%)',
      onClick: onOpenShopping
    },
    {
      id: 'recipes',
      label: 'Recepten',
      icon: ChefHat,
      color: '#ec4899',
      gradient: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
      lightGradient: 'linear-gradient(135deg, rgba(236, 72, 153, 0.12) 0%, rgba(236, 72, 153, 0.04) 100%)',
      onClick: onOpenRecipes
    }
  ]
  
  const handleFavoriteSelect = (mealId) => {
    console.log('Favorite meal selected:', mealId)
    setShowFavoritesModal(false)
    if (onMealCreated) {
      onMealCreated({ type: 'favorite', mealId })
    }
  }
  
  const handleCustomMealSave = (meal) => {
    console.log('Custom meal saved:', meal)
    setShowCustomMealBuilder(false)
    if (onMealCreated) {
      onMealCreated({ type: 'custom', meal })
    }
  }
  
  return (
    <>
      <div style={{
        padding: isMobile ? '0 0.75rem 1rem' : '0 1.5rem 1.5rem'
      }}>
        {/* Premium Section Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '1.125rem',
          paddingLeft: '0.125rem'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(251, 191, 36, 0.08) 100%)',
            backdropFilter: 'blur(10px)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(251, 191, 36, 0.2)'
          }}>
            <Sparkles size={18} color="#fbbf24" />
          </div>
          <h3 style={{
            fontSize: isMobile ? '1rem' : '1.25rem',
            fontWeight: '700',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            margin: 0,
            letterSpacing: '-0.02em'
          }}>
            Quick Actions
          </h3>
        </div>
        
        {/* Premium Actions Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: isMobile ? '0.625rem' : '0.875rem'
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
          marginTop: '1.5rem',
          padding: isMobile ? '1rem' : '1.25rem',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(16, 185, 129, 0.02) 100%)',
          backdropFilter: 'blur(20px)',
          borderRadius: isMobile ? '14px' : '16px',
          border: '1px solid rgba(16, 185, 129, 0.08)',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(16, 185, 129, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.03)'
        }}>
          <div style={{
            position: 'absolute',
            top: '-40px',
            right: '-40px',
            width: '120px',
            height: '120px',
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, transparent 70%)',
            borderRadius: '50%',
            animation: 'float 8s ease-in-out infinite'
          }} />
          <div style={{
            position: 'absolute',
            bottom: '-30px',
            left: '-30px',
            width: '80px',
            height: '80px',
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.06) 0%, transparent 70%)',
            borderRadius: '50%',
            animation: 'float 6s ease-in-out infinite 1s'
          }} />
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.875rem',
            position: 'relative',
            zIndex: 1
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 6px 20px rgba(16, 185, 129, 0.3)'
            }}>
              <TrendingUp size={20} color="white" />
            </div>
            <div>
              <p style={{
                fontSize: isMobile ? '0.875rem' : '0.95rem',
                color: 'rgba(255, 255, 255, 0.9)',
                margin: '0 0 0.125rem 0',
                fontWeight: '600',
                letterSpacing: '-0.01em'
              }}>
                Je bent op de goede weg!
              </p>
              <p style={{
                fontSize: isMobile ? '0.75rem' : '0.825rem',
                color: 'rgba(16, 185, 129, 0.7)',
                margin: 0,
                fontWeight: '500'
              }}>
                Blijf consistent voor de beste resultaten
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
              transform: scale(1.05);
              opacity: 0.9;
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
        clientId={clientId}
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
        background: isHovered
          ? action.gradient
          : action.lightGradient,
        backdropFilter: 'blur(10px)',
        borderRadius: isMobile ? '12px' : '14px',
        padding: isMobile ? '0.875rem' : '1rem',
        border: `1px solid ${isHovered ? action.color + '25' : 'rgba(16, 185, 129, 0.08)'}`,
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isHovered ? 'translateY(-4px) scale(1.03)' : 'translateY(0) scale(1)',
        boxShadow: isHovered
          ? `0 20px 40px ${action.color}20, 0 0 30px ${action.color}10, inset 0 1px 0 rgba(255,255,255,0.1)`
          : '0 4px 16px rgba(16, 185, 129, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: isMobile ? '0.5rem' : '0.625rem',
        position: 'relative',
        overflow: 'hidden',
        minHeight: isMobile ? '90px' : '110px',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        aspectRatio: '1 / 1.1'
      }}
      onTouchStart={(e) => {
        if (isMobile) {
          e.currentTarget.style.transform = 'scale(0.97)'
          e.currentTarget.style.background = action.gradient
        }
      }}
      onTouchEnd={(e) => {
        if (isMobile) {
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.background = action.lightGradient
        }
      }}
    >
      {isHovered && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: '-100%',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
          animation: 'shimmer 0.6s ease'
        }} />
      )}
      
      <div style={{
        position: 'absolute',
        inset: 0,
        background: isHovered 
          ? 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%)'
          : 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 50%)',
        borderRadius: 'inherit',
        pointerEvents: 'none'
      }} />
      
      <div style={{
        width: isMobile ? '36px' : '42px',
        height: isMobile ? '36px' : '42px',
        background: isHovered 
          ? 'rgba(255, 255, 255, 0.15)'
          : 'rgba(17, 17, 17, 0.3)',
        backdropFilter: 'blur(10px)',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: `1px solid ${isHovered ? 'rgba(255, 255, 255, 0.2)' : 'rgba(16, 185, 129, 0.1)'}`,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: isHovered 
          ? `0 8px 20px ${action.color}30, inset 0 1px 0 rgba(255,255,255,0.2)`
          : 'inset 0 1px 0 rgba(255,255,255,0.03)',
        position: 'relative',
        zIndex: 1,
        animation: isHovered ? 'pulse 2s infinite' : 'none'
      }}>
        <Icon 
          size={isMobile ? 18 : 22} 
          color={isHovered ? 'white' : action.color}
          style={{
            filter: isHovered ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' : 'none',
            transition: 'all 0.3s ease'
          }}
        />
      </div>
      
      <span style={{
        fontSize: isMobile ? '0.75rem' : '0.85rem',
        fontWeight: '700',
        color: isHovered ? 'white' : 'rgba(255, 255, 255, 0.7)',
        letterSpacing: '-0.01em',
        position: 'relative',
        zIndex: 1,
        textShadow: isHovered ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
        transition: 'all 0.3s ease'
      }}>
        {action.label}
      </span>
      
      {isHovered && (
        <div style={{
          position: 'absolute',
          bottom: '-2px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '40%',
          height: '4px',
          background: action.color,
          borderRadius: '2px',
          boxShadow: `0 0 12px ${action.color}`,
          opacity: 0.8
        }} />
      )}
    </button>
  )
}
