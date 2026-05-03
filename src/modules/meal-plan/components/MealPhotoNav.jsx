// src/modules/meal-plan/components/MealPhotoNav.jsx
// 🎯 v2.0 - Compact horizontal scroll strip
// Props IDENTIEK: { onActionClick }
import { Calendar, ShoppingCart, Plus, History, Repeat, BarChart3 } from 'lucide-react'

const mealActions = [
  {
    id: 'schedule',
    title: 'Week Schema',
    icon: Calendar,
    imageUrl: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&h=300&fit=crop&q=80'
  },
  {
    id: 'shopping',
    title: 'Boodschappen',
    icon: ShoppingCart,
    imageUrl: 'https://images.unsplash.com/photo-1543168256-418811576931?w=400&h=300&fit=crop&q=80'
  },
  {
    id: 'custom',
    title: 'Custom Meal',
    icon: Plus,
    imageUrl: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=300&fit=crop&q=80'
  },
  {
    id: 'history',
    title: 'Geschiedenis',
    icon: History,
    imageUrl: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=400&h=300&fit=crop&q=80'
  },
  {
    id: 'swap',
    title: 'Swaps',
    icon: Repeat,
    imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop&q=80'
  },
  {
    id: 'stats',
    title: 'Statistieken',
    icon: BarChart3,
    imageUrl: 'https://images.unsplash.com/photo-1490818387583-1baba5e638af?w=400&h=300&fit=crop&q=80'
  }
]

export default function MealPhotoNav({ onActionClick }) {
  const isMobile = window.innerWidth <= 768

  return (
    <div style={{
      borderTop: '1px solid rgba(255, 255, 255, 0.06)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
      padding: isMobile ? '0.75rem 0' : '1rem 0',
      overflow: 'hidden',
      maxWidth: '100vw',
      boxSizing: 'border-box'
    }}>
      {/* Label */}
      <div style={{
        padding: isMobile ? '0 1rem 0.5rem' : '0 1.5rem 0.625rem',
        fontSize: isMobile ? '0.5rem' : '0.55rem',
        fontWeight: '700',
        color: 'rgba(255, 255, 255, 0.2)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
      }}>
        Snelle acties
      </div>

      {/* Horizontal scroll */}
      <div style={{
        display: 'flex',
        gap: isMobile ? '0.5rem' : '0.625rem',
        overflowX: 'auto',
        overflowY: 'hidden',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        paddingLeft: isMobile ? '1rem' : '1.5rem',
        paddingRight: isMobile ? '1rem' : '1.5rem',
        maxWidth: '100%',
        boxSizing: 'border-box'
      }}>
        {mealActions.map((action) => {
          const Icon = action.icon

          return (
            <div
              key={action.id}
              onClick={() => onActionClick && onActionClick(action.id)}
              style={{
                position: 'relative',
                width: isMobile ? '120px' : '140px',
                height: isMobile ? '90px' : '105px',
                borderRadius: '10px',
                overflow: 'hidden',
                cursor: 'pointer',
                flexShrink: 0,
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                background: '#111'
              }}
            >
              {/* Background image */}
              <div style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `url(${action.imageUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                opacity: 0.6
              }} />

              {/* Dark overlay */}
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 100%)'
              }} />

              {/* Content */}
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                padding: isMobile ? '0.5rem' : '0.625rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem'
              }}>
                <Icon
                  size={isMobile ? 14 : 16}
                  color="rgba(255, 255, 255, 0.6)"
                  strokeWidth={2}
                  style={{ flexShrink: 0 }}
                />
                <span style={{
                  fontSize: isMobile ? '0.68rem' : '0.75rem',
                  fontWeight: '700',
                  color: '#fff',
                  letterSpacing: '-0.01em',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {action.title}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      <style>{`
        div::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  )
}
