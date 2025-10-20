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
      padding: isMobile ? '1rem' : '1.5rem',
      background: 'rgba(17, 17, 17, 0.5)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid rgba(16, 185, 129, 0.1)',
      marginBottom: isMobile ? '1rem' : '1.5rem'
    }}>
      {/* Title */}
      <h1 style={{
        fontSize: isMobile ? '1.5rem' : '2rem',
        fontWeight: '800',
        color: '#fff',
        marginBottom: '0.5rem',
        letterSpacing: '-0.02em'
      }}>
        🍽️ Mijn Meals
      </h1>
      
      {/* Stats */}
      <div style={{
        display: 'flex',
        gap: isMobile ? '1rem' : '1.5rem',
        marginBottom: '1rem',
        flexWrap: 'wrap'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#10b981'
          }} />
          <span style={{
            fontSize: isMobile ? '0.875rem' : '0.95rem',
            color: 'rgba(255, 255, 255, 0.7)'
          }}>
            {customMealsCount} Custom Meals
          </span>
        </div>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#f59e0b'
          }} />
          <span style={{
            fontSize: isMobile ? '0.875rem' : '0.95rem',
            color: 'rgba(255, 255, 255, 0.7)'
          }}>
            {standardFoodsCount}/9 Standaard Foods
          </span>
        </div>
      </div>
      
      {/* Search Bar */}
      <div style={{
        position: 'relative',
        maxWidth: isMobile ? '100%' : '400px'
      }}>
        <Search
          size={isMobile ? 18 : 20}
          style={{
            position: 'absolute',
            left: '1rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'rgba(255, 255, 255, 0.4)',
            pointerEvents: 'none'
          }}
        />
        <input
          type="text"
          placeholder="Zoek custom meals..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{
            width: '100%',
            padding: isMobile ? '0.75rem 1rem 0.75rem 3rem' : '0.875rem 1rem 0.875rem 3.5rem',
            background: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            color: '#fff',
            fontSize: isMobile ? '0.875rem' : '0.95rem',
            outline: 'none',
            transition: 'all 0.3s ease',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent'
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.3)'
            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.5)'
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.3)'
          }}
        />
      </div>
    </div>
  )
}
