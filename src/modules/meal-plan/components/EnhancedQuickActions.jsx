import React, { useState } from 'react'
import { 
  Heart, 
  RefreshCw, 
  ChefHat, 
  Clock, 
  TrendingUp,
  ShoppingCart,
  Plus
} from 'lucide-react'

export default function EnhancedQuickActions({ 
  onActionClick,
  favorites = [],
  recentMeals = [],
  client 
}) {
  const isMobile = window.innerWidth <= 768
  const [activeFilter, setActiveFilter] = useState('all')
  
  // Enhanced action items met werkende links
  const actions = [
    {
      id: 'recipes',
      label: 'Recepten',
      icon: ChefHat,
      color: '#10b981',
      gradient: 'linear-gradient(135deg, #10b981, #059669)',
      onClick: () => onActionClick('recipes')
    },
    {
      id: 'favorites',
      label: 'Favorieten',
      icon: Heart,
      color: '#ef4444',
      gradient: 'linear-gradient(135deg, #ef4444, #dc2626)',
      badge: favorites.length > 0 ? favorites.length : null,
      onClick: () => onActionClick('favorites')
    },
    {
      id: 'alternatives',
      label: 'Wissel Maaltijd',
      icon: RefreshCw,
      color: '#3b82f6',
      gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)',
      onClick: () => onActionClick('swap')
    },
    {
      id: 'history',
      label: 'Geschiedenis',
      icon: Clock,
      color: '#8b5cf6',
      gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
      onClick: () => onActionClick('history')
    },
    {
      id: 'progress',
      label: 'Voortgang',
      icon: TrendingUp,
      color: '#f59e0b',
      gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
      onClick: () => onActionClick('progress')
    },
    {
      id: 'shopping',
      label: 'Boodschappen',
      icon: ShoppingCart,
      color: '#ec4899',
      gradient: 'linear-gradient(135deg, #ec4899, #db2777)',
      onClick: () => onActionClick('shopping')
    },
    {
      id: 'custom',
      label: 'Eigen Maaltijd',
      icon: Plus,
      color: '#14b8a6',
      gradient: 'linear-gradient(135deg, #14b8a6, #0d9488)',
      onClick: () => onActionClick('custom')
    }
  ]

  // Categorie filters voor makkelijke toegang
  const categoryFilters = [
    { id: 'zuivel', label: '🥛 Zuivel', color: '#3b82f6' },
    { id: 'ei', label: '🥚 Ei', color: '#f59e0b' },
    { id: 'vlees', label: '🥩 Vlees', color: '#ef4444' },
    { id: 'shakes', label: '🥤 Shakes', color: '#8b5cf6' },
    { id: 'salades', label: '🥗 Salades', color: '#22c55e' },
    { id: 'pasta', label: '🍝 Pasta', color: '#ec4899' }
  ]

  return (
    <div style={{
      marginBottom: isMobile ? '1.5rem' : '2rem'
    }}>
      {/* Quick Filter Buttons - Help gebruikers snel vinden wat ze zoeken */}
      {favorites.length > 0 && (
        <div style={{
          marginBottom: isMobile ? '1rem' : '1.5rem',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}>
          <div style={{
            display: 'flex',
            gap: isMobile ? '0.5rem' : '0.75rem',
            paddingBottom: '0.5rem',
            minWidth: 'fit-content'
          }}>
            {categoryFilters.map(filter => (
              <button
                key={filter.id}
                onClick={() => {
                  setActiveFilter(filter.id)
                  onActionClick('category', filter.id)
                }}
                style={{
                  padding: isMobile ? '0.5rem 1rem' : '0.75rem 1.25rem',
                  background: activeFilter === filter.id 
                    ? `linear-gradient(135deg, ${filter.color}22, ${filter.color}11)`
                    : '#111',
                  border: `1px solid ${activeFilter === filter.id ? filter.color : '#333'}`,
                  borderRadius: isMobile ? '20px' : '24px',
                  color: activeFilter === filter.id ? filter.color : '#888',
                  fontSize: isMobile ? '0.875rem' : '0.95rem',
                  fontWeight: '500',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: 'translateZ(0)',
                  minHeight: '44px'
                }}
                onTouchStart={(e) => {
                  if (isMobile) {
                    e.currentTarget.style.transform = 'scale(0.95)'
                  }
                }}
                onTouchEnd={(e) => {
                  if (isMobile) {
                    e.currentTarget.style.transform = 'scale(1)'
                  }
                }}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Action Grid - Compact en mooi zoals call planning widget */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
        gap: isMobile ? '0.75rem' : '1rem'
      }}>
        {actions.map(action => {
          const Icon = action.icon
          return (
            <button
              key={action.id}
              onClick={action.onClick}
              style={{
                position: 'relative',
                padding: isMobile ? '1rem' : '1.25rem',
                background: '#111',
                border: '1px solid #333',
                borderRadius: isMobile ? '12px' : '16px',
                cursor: 'pointer',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: 'translateZ(0)',
                minHeight: isMobile ? '80px' : '100px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                if (!isMobile) {
                  e.currentTarget.style.background = action.gradient
                  e.currentTarget.style.borderColor = action.color
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.querySelector('svg').style.color = '#fff'
                  e.currentTarget.querySelector('span').style.color = '#fff'
                }
              }}
              onMouseLeave={(e) => {
                if (!isMobile) {
                  e.currentTarget.style.background = '#111'
                  e.currentTarget.style.borderColor = '#333'
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.querySelector('svg').style.color = action.color
                  e.currentTarget.querySelector('span').style.color = '#888'
                }
              }}
              onTouchStart={(e) => {
                if (isMobile) {
                  e.currentTarget.style.transform = 'scale(0.95)'
                  e.currentTarget.style.background = action.gradient
                  e.currentTarget.style.borderColor = action.color
                }
              }}
              onTouchEnd={(e) => {
                if (isMobile) {
                  e.currentTarget.style.transform = 'scale(1)'
                  setTimeout(() => {
                    e.currentTarget.style.background = '#111'
                    e.currentTarget.style.borderColor = '#333'
                  }, 150)
                }
              }}
            >
              {/* Badge voor aantal items */}
              {action.badge && (
                <div style={{
                  position: 'absolute',
                  top: '0.5rem',
                  right: '0.5rem',
                  background: action.color,
                  color: '#fff',
                  borderRadius: '10px',
                  padding: '0.125rem 0.5rem',
                  fontSize: isMobile ? '0.7rem' : '0.75rem',
                  fontWeight: 'bold',
                  minWidth: '20px',
                  textAlign: 'center'
                }}>
                  {action.badge}
                </div>
              )}

              <Icon 
                size={isMobile ? 20 : 24} 
                style={{ 
                  color: action.color,
                  transition: 'color 0.3s'
                }} 
              />
              <span style={{
                fontSize: isMobile ? '0.75rem' : '0.875rem',
                fontWeight: '500',
                color: '#888',
                transition: 'color 0.3s'
              }}>
                {action.label}
              </span>
            </button>
          )
        })}
      </div>

      {/* Recent/Favorite Quick Access */}
      {recentMeals.length > 0 && (
        <div style={{
          marginTop: isMobile ? '1.5rem' : '2rem',
          background: '#0a0a0a',
          borderRadius: isMobile ? '12px' : '16px',
          padding: isMobile ? '1rem' : '1.25rem',
          border: '1px solid #1a1a1a'
        }}>
          <h3 style={{
            fontSize: isMobile ? '0.875rem' : '0.95rem',
            color: '#666',
            marginBottom: '0.75rem',
            fontWeight: '500'
          }}>
            Recent Favorieten
          </h3>
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            flexWrap: 'wrap'
          }}>
            {recentMeals.slice(0, 4).map(meal => (
              <button
                key={meal.id}
                onClick={() => onActionClick('select-meal', meal)}
                style={{
                  padding: isMobile ? '0.5rem 0.75rem' : '0.625rem 1rem',
                  background: '#111',
                  border: '1px solid #222',
                  borderRadius: '8px',
                  color: '#10b981',
                  fontSize: isMobile ? '0.75rem' : '0.825rem',
                  cursor: 'pointer',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap'
                }}
                onTouchStart={(e) => {
                  if (isMobile) {
                    e.currentTarget.style.transform = 'scale(0.95)'
                    e.currentTarget.style.background = '#1a1a1a'
                  }
                }}
                onTouchEnd={(e) => {
                  if (isMobile) {
                    e.currentTarget.style.transform = 'scale(1)'
                    e.currentTarget.style.background = '#111'
                  }
                }}
              >
                {meal.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
