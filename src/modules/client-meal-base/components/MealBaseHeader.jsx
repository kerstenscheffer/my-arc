// src/modules/client-meal-base/components/MealBaseHeader.jsx
import { Search } from 'lucide-react'

export default function MealBaseHeader({ 
  customMealsCount, 
  standardFoodsCount, 
  searchQuery, 
  onSearchChange,
  isMobile 
}) {
  return (
    <div style={{
      padding: isMobile ? '1.25rem 1rem' : '1.75rem 1.5rem',
      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.04) 100%)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(16, 185, 129, 0.15)',
      marginBottom: isMobile ? '1rem' : '1.5rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Top gradient overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '50%',
        background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.04) 0%, transparent 100%)',
        pointerEvents: 'none'
      }} />
      
      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Title */}
        <h1 style={{
          fontSize: isMobile ? '1.5rem' : '2rem',
          fontWeight: '800',
          color: '#fff',
          marginBottom: isMobile ? '0.875rem' : '1rem',
          letterSpacing: '-0.02em',
          textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
        }}>
          🍽️ Mijn Meals
        </h1>
        
        {/* Stats Badges */}
        <div style={{
          display: 'flex',
          gap: isMobile ? '0.75rem' : '1rem',
          marginBottom: isMobile ? '1rem' : '1.25rem',
          flexWrap: 'wrap'
        }}>
          {/* Custom Meals Badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.625rem',
            padding: isMobile ? '0.5rem 0.875rem' : '0.625rem 1rem',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.08) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: '10px',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 2px 8px rgba(16, 185, 129, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            minHeight: '36px'
          }}>
            <div style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              boxShadow: '0 0 12px rgba(16, 185, 129, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.3)',
              flexShrink: 0
            }} />
            <span style={{
              fontSize: isMobile ? '0.8rem' : '0.875rem',
              fontWeight: '600',
              color: '#10b981',
              letterSpacing: '0.01em'
            }}>
              {customMealsCount} Custom Meals
            </span>
          </div>
          
          {/* Standard Foods Badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.625rem',
            padding: isMobile ? '0.5rem 0.875rem' : '0.625rem 1rem',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.08) 100%)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            borderRadius: '10px',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 2px 8px rgba(245, 158, 11, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            minHeight: '36px'
          }}>
            <div style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              boxShadow: '0 0 12px rgba(245, 158, 11, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.3)',
              flexShrink: 0
            }} />
            <span style={{
              fontSize: isMobile ? '0.8rem' : '0.875rem',
              fontWeight: '600',
              color: '#f59e0b',
              letterSpacing: '0.01em'
            }}>
              {standardFoodsCount}/9 Standaard Foods
            </span>
          </div>
        </div>
        
        {/* Premium Search Bar */}
        <div style={{
          position: 'relative',
          maxWidth: isMobile ? '100%' : '450px'
        }}>
          {/* Search Icon with glow */}
          <Search
            size={isMobile ? 18 : 20}
            style={{
              position: 'absolute',
              left: isMobile ? '0.875rem' : '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'rgba(16, 185, 129, 0.6)',
              pointerEvents: 'none',
              filter: 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.4))',
              zIndex: 2
            }}
          />
          
          <input
            type="text"
            placeholder="Zoek custom meals..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{
              width: '100%',
              padding: isMobile ? '0.875rem 1rem 0.875rem 3rem' : '1rem 1.25rem 1rem 3.5rem',
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(16, 185, 129, 0.15)',
              borderRadius: isMobile ? '12px' : '14px',
              color: '#fff',
              fontSize: isMobile ? '0.875rem' : '0.95rem',
              fontWeight: '500',
              outline: 'none',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '44px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1), inset 0 1px 2px rgba(0, 0, 0, 0.1)'
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.4)'
              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.6)'
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1), 0 4px 12px rgba(16, 185, 129, 0.15), inset 0 1px 2px rgba(0, 0, 0, 0.1)'
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.15)'
              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.4)'
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1), inset 0 1px 2px rgba(0, 0, 0, 0.1)'
            }}
          />
          
          {/* Clear button when search is active */}
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              style={{
                position: 'absolute',
                right: isMobile ? '0.75rem' : '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                width: isMobile ? '24px' : '28px',
                height: isMobile ? '24px' : '28px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                color: '#10b981',
                fontSize: isMobile ? '0.875rem' : '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                zIndex: 2
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(16, 185, 129, 0.25)'
                e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(16, 185, 129, 0.15)'
                e.currentTarget.style.transform = 'translateY(-50%) scale(1)'
              }}
              onTouchStart={(e) => {
                if (isMobile) {
                  e.currentTarget.style.transform = 'translateY(-50%) scale(0.95)'
                }
              }}
              onTouchEnd={(e) => {
                if (isMobile) {
                  e.currentTarget.style.transform = 'translateY(-50%) scale(1)'
                }
              }}
            >
              ×
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
