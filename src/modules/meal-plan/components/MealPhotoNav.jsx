// src/modules/meal-plan/components/MealPhotoNav.jsx
import { Calendar, ShoppingCart, Plus, History, Repeat, BarChart3 } from 'lucide-react'

const mealActions = [
  {
    id: 'schedule',
    title: 'Week Schema',
    subtitle: 'Plan bekijken',
    icon: Calendar,
    imageUrl: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&h=600&fit=crop&q=85',
    gradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.08) 100%)'
  },
  {
    id: 'shopping',
    title: 'Boodschappen',
    subtitle: 'Shopping list',
    icon: ShoppingCart,
    imageUrl: 'https://images.unsplash.com/photo-1543168256-418811576931?w=800&h=600&fit=crop&q=85',
    gradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.08) 100%)'
  },
  {
    id: 'custom',
    title: 'Custom Meal',
    subtitle: 'Eigen recept',
    icon: Plus,
    imageUrl: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&h=600&fit=crop&q=85',
    gradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.08) 100%)'
  },
  {
    id: 'history',
    title: 'Geschiedenis',
    subtitle: 'Je progress',
    icon: History,
    imageUrl: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800&h=600&fit=crop&q=85',
    gradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.08) 100%)'
  },
  {
    id: 'swap',
    title: 'Meal Swaps',
    subtitle: 'Wissel meals',
    icon: Repeat,
    imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&h=600&fit=crop&q=85',
    gradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.08) 100%)'
  },
  {
    id: 'stats',
    title: 'Statistieken',
    subtitle: 'Week analyse',
    icon: BarChart3,
    imageUrl: 'https://images.unsplash.com/photo-1490818387583-1baba5e638af?w=800&h=600&fit=crop&q=85',
    gradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.08) 100%)'
  }
]

export default function MealPhotoNav({ onActionClick }) {
  const isMobile = window.innerWidth <= 768

  const handleClick = (actionId) => {
    if (onActionClick) {
      onActionClick(actionId)
    }
  }

  return (
    <div style={{
      padding: isMobile ? '0.5rem' : '0.75rem',
      marginBottom: isMobile ? '1.5rem' : '2rem'
    }}>
      {/* Grid container */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
        gap: isMobile ? '0.75rem' : '1rem',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {mealActions.map((action) => {
          const Icon = action.icon

          return (
            <div
              key={action.id}
              onClick={() => handleClick(action.id)}
              style={{
                position: 'relative',
                height: isMobile ? '180px' : '220px',
                borderRadius: isMobile ? '16px' : '20px',
                overflow: 'hidden',
                cursor: 'pointer',
                border: '2px solid rgba(16, 185, 129, 0.3)',
                boxShadow: '0 8px 32px rgba(16, 185, 129, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.03)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                transform: 'translateZ(0)',
                background: '#000'
              }}
              onMouseEnter={(e) => {
                if (!isMobile) {
                  e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)'
                  e.currentTarget.style.boxShadow = '0 16px 48px rgba(16, 185, 129, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.06)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isMobile) {
                  e.currentTarget.style.transform = 'translateZ(0)'
                  e.currentTarget.style.boxShadow = '0 8px 32px rgba(16, 185, 129, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.03)'
                }
              }}
              onTouchStart={(e) => {
                if (isMobile) {
                  e.currentTarget.style.transform = 'scale(0.98)'
                }
              }}
              onTouchEnd={(e) => {
                if (isMobile) {
                  e.currentTarget.style.transform = 'translateZ(0)'
                }
              }}
            >
              {/* Background image */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage: `url(${action.imageUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                zIndex: 1
              }} />

              {/* Top vignette */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '30%',
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.5), transparent)',
                pointerEvents: 'none',
                zIndex: 2
              }} />

              {/* Bottom gradient - stronger for text readability */}
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '65%',
                background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.5) 50%, transparent 100%)',
                pointerEvents: 'none',
                zIndex: 2
              }} />

              {/* Content layer */}
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                padding: isMobile ? '1rem' : '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: isMobile ? '0.625rem' : '0.75rem',
                zIndex: 3
              }}>
                {/* Icon container */}
                <div style={{
                  width: isMobile ? '36px' : '42px',
                  height: isMobile ? '36px' : '42px',
                  borderRadius: isMobile ? '10px' : '12px',
                  background: action.gradient,
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 16px rgba(16, 185, 129, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
                  flexShrink: 0
                }}>
                  <Icon 
                    size={isMobile ? 18 : 20} 
                    color="#10b981"
                    strokeWidth={2.5}
                    style={{ filter: 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.6))' }}
                  />
                </div>

                {/* Text container */}
                <div>
                  <h3 style={{
                    color: 'white',
                    fontSize: isMobile ? '1rem' : '1.15rem',
                    fontWeight: '800',
                    letterSpacing: '-0.02em',
                    marginBottom: '0.125rem',
                    textShadow: '0 2px 8px rgba(0, 0, 0, 0.7)',
                    lineHeight: 1.2
                  }}>
                    {action.title}
                  </h3>
                  <p style={{
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontSize: isMobile ? '0.8rem' : '0.875rem',
                    fontWeight: '500',
                    letterSpacing: '0.01em',
                    textShadow: '0 1px 4px rgba(0, 0, 0, 0.6)',
                    lineHeight: 1.3
                  }}>
                    {action.subtitle}
                  </p>
                </div>
              </div>

              {/* Top green accent glow */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '2px',
                background: 'linear-gradient(90deg, transparent 0%, #10b981 50%, transparent 100%)',
                opacity: 0.7,
                pointerEvents: 'none',
                zIndex: 4
              }} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
