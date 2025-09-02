import React, { useState } from 'react'
import { 
  CheckCircle2, Star, RefreshCw, ChevronRight,
  Flame, Dumbbell, Clock, TrendingUp, Circle
} from 'lucide-react'

export default function MealListToday({ 
  meals, 
  checkedMeals, 
  favorites, 
  onToggleMeal, 
  onSwapMeal, 
  onDetailMeal, 
  onToggleFavorite 
}) {
  const isMobile = window.innerWidth <= 768
  const completedCount = Object.values(checkedMeals).filter(Boolean).length
  const completionPercent = meals.length > 0 ? Math.round((completedCount / meals.length) * 100) : 0
  
  return (
    <div style={{ padding: isMobile ? '0 1rem 1rem' : '0 1.5rem 1.5rem' }}>
      {/* Section Header with Progress */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1rem'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <TrendingUp size={isMobile ? 14 : 16} style={{ color: '#059669' }} />
          <h3 style={{
            fontSize: isMobile ? '0.85rem' : '0.9rem',
            color: 'rgba(255,255,255,0.5)',
            margin: 0,
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Vandaag's Planning
          </h3>
        </div>
        
        {meals.length > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'rgba(4, 120, 87, 0.1)',
            padding: '0.25rem 0.75rem',
            borderRadius: '20px',
            border: '1px solid rgba(4, 120, 87, 0.2)'
          }}>
            <CheckCircle2 size={14} style={{ color: '#059669' }} />
            <span style={{
              fontSize: '0.75rem',
              color: '#059669',
              fontWeight: '600'
            }}>
              {completedCount}/{meals.length}
            </span>
          </div>
        )}
      </div>

      {/* Instructie voor gebruiker */}
      {meals.length > 0 && completedCount < meals.length && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          borderRadius: '12px',
          padding: isMobile ? '0.75rem' : '1rem',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          animation: 'pulseGlow 3s ease-in-out infinite'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'rgba(16, 185, 129, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Circle size={18} style={{ color: '#10b981' }} />
          </div>
          <div>
            <div style={{
              color: '#fff',
              fontSize: isMobile ? '0.85rem' : '0.9rem',
              fontWeight: '600',
              marginBottom: '0.125rem'
            }}>
              Tik op de cirkel om af te vinken
            </div>
            <div style={{
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: isMobile ? '0.7rem' : '0.75rem'
            }}>
              Houd je voortgang makkelijk bij
            </div>
          </div>
        </div>
      )}
      
      {/* Progress Bar */}
      {meals.length > 0 && (
        <div style={{
          background: 'rgba(4, 120, 87, 0.1)',
          borderRadius: '8px',
          height: '4px',
          overflow: 'hidden',
          marginBottom: '1rem'
        }}>
          <div style={{
            background: 'linear-gradient(90deg, #047857 0%, #059669 100%)',
            height: '100%',
            width: `${completionPercent}%`,
            transition: 'width 0.5s ease',
            boxShadow: '0 0 10px rgba(5, 150, 105, 0.5)'
          }} />
        </div>
      )}
      
      {/* Meals List - Compact */}
      {meals.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '0.6rem' : '0.75rem' }}>
          {meals.map((meal, idx) => (
            <CompactMealCard
              key={`${meal.id}-${idx}`}
              meal={meal}
              index={idx}
              isChecked={checkedMeals[idx]}
              isFavorite={favorites.includes(meal.id)}
              onToggle={() => onToggleMeal(idx)}
              onSwap={() => onSwapMeal(meal)}
              onDetail={() => onDetailMeal(meal)}
              onFavorite={() => onToggleFavorite(meal.id)}
            />
          ))}
        </div>
      ) : (
        <EmptyState />
      )}

      <style>{`
        @keyframes pulseGlow {
          0%, 100% { 
            opacity: 1;
            transform: scale(1);
          }
          50% { 
            opacity: 0.9;
            transform: scale(0.99);
          }
        }
      `}</style>
    </div>
  )
}

function CompactMealCard({ 
  meal, 
  index,
  isChecked, 
  isFavorite, 
  onToggle, 
  onSwap, 
  onDetail, 
  onFavorite 
}) {
  const [isPressed, setIsPressed] = useState(false)
  const isMobile = window.innerWidth <= 768
  
  // Time until meal
  const getTimeDisplay = () => {
    if (!meal.plannedTime) return null
    
    const now = new Date()
    const currentHours = now.getHours() + now.getMinutes() / 60
    const hoursUntil = meal.plannedTime - currentHours
    
    if (hoursUntil < -1) return { text: 'Gemist', color: '#ef4444' }
    if (hoursUntil < 0) return { text: 'Nu', color: '#fbbf24' }
    if (hoursUntil < 1) return { text: 'Binnenkort', color: '#10b981' }
    if (hoursUntil < 3) return { text: `${Math.round(hoursUntil)}u`, color: '#3b82f6' }
    return { text: `${Math.round(hoursUntil)}u`, color: 'rgba(255, 255, 255, 0.5)' }
  }
  
  const timeStatus = getTimeDisplay()
  
  return (
    <div style={{
      background: isChecked 
        ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)'
        : 'rgba(0, 0, 0, 0.3)',
      border: isChecked 
        ? '1px solid rgba(16, 185, 129, 0.3)' 
        : '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: isMobile ? '12px' : '16px',
      padding: isMobile ? '0.75rem' : '1rem',
      display: 'flex',
      alignItems: 'center',
      gap: isMobile ? '0.75rem' : '1rem',
      transition: 'all 0.3s ease',
      position: 'relative',
      opacity: isChecked ? 0.8 : 1
    }}>
      {/* Check Button - GROOT EN DUIDELIJK */}
      <button
        onClick={onToggle}
        onTouchStart={() => setIsPressed(true)}
        onTouchEnd={() => setIsPressed(false)}
        style={{
          width: isMobile ? '44px' : '48px',
          height: isMobile ? '44px' : '48px',
          minWidth: isMobile ? '44px' : '48px',
          borderRadius: '50%',
          border: isChecked 
            ? '2px solid #10b981' 
            : '2px solid rgba(255, 255, 255, 0.3)',
          background: isChecked 
            ? '#10b981' 
            : isPressed 
            ? 'rgba(16, 185, 129, 0.2)'
            : 'rgba(255, 255, 255, 0.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
          transform: isPressed ? 'scale(0.95)' : 'scale(1)',
          boxShadow: isChecked 
            ? '0 0 20px rgba(16, 185, 129, 0.4)' 
            : 'none'
        }}
      >
        {isChecked ? (
          <CheckCircle2 size={24} style={{ color: '#fff' }} />
        ) : (
          <Circle size={24} style={{ color: 'rgba(255, 255, 255, 0.5)' }} />
        )}
      </button>
      
      {/* Meal Info - Compact */}
      <div 
        onClick={onDetail}
        style={{ 
          flex: 1,
          cursor: 'pointer',
          minWidth: 0
        }}
      >
        {/* Time Badge */}
        {timeStatus && (
          <div style={{
            display: 'inline-block',
            fontSize: isMobile ? '0.65rem' : '0.7rem',
            color: timeStatus.color,
            background: `${timeStatus.color}15`,
            padding: '0.125rem 0.5rem',
            borderRadius: '12px',
            marginBottom: '0.25rem',
            fontWeight: '600'
          }}>
            <Clock size={10} style={{ display: 'inline', marginRight: '0.25rem' }} />
            {timeStatus.text}
          </div>
        )}
        
        {/* Meal Name */}
        <h4 style={{
          color: isChecked ? 'rgba(255, 255, 255, 0.6)' : '#fff',
          fontSize: isMobile ? '0.9rem' : '0.95rem',
          fontWeight: '600',
          margin: '0 0 0.25rem 0',
          textDecoration: isChecked ? 'line-through' : 'none'
        }}>
          {meal.name}
        </h4>
        
        {/* Macros - Super Compact */}
        <div style={{
          display: 'flex',
          gap: isMobile ? '0.75rem' : '1rem',
          fontSize: isMobile ? '0.7rem' : '0.75rem'
        }}>
          <span style={{ color: '#10b981' }}>
            <Flame size={10} style={{ display: 'inline', marginRight: '2px' }} />
            {meal.calories || 0}
          </span>
          <span style={{ color: '#3b82f6' }}>
            <Dumbbell size={10} style={{ display: 'inline', marginRight: '2px' }} />
            {meal.protein || 0}g
          </span>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div style={{
        display: 'flex',
        gap: '0.5rem'
      }}>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onFavorite()
          }}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: 'none',
            borderRadius: '8px',
            padding: isMobile ? '0.5rem' : '0.6rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent'
          }}
        >
          <Star 
            size={isMobile ? 14 : 16} 
            style={{ 
              color: isFavorite ? '#f59e0b' : 'rgba(255, 255, 255, 0.4)',
              fill: isFavorite ? '#f59e0b' : 'none'
            }} 
          />
        </button>
        
        <button
          onClick={(e) => {
            e.stopPropagation()
            onSwap()
          }}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: 'none',
            borderRadius: '8px',
            padding: isMobile ? '0.5rem' : '0.6rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent'
          }}
        >
          <RefreshCw size={isMobile ? 14 : 16} style={{ color: 'rgba(255, 255, 255, 0.4)' }} />
        </button>
      </div>
    </div>
  )
}

function EmptyState() {
  const isMobile = window.innerWidth <= 768
  
  return (
    <div style={{
      textAlign: 'center',
      padding: isMobile ? '2rem' : '3rem',
      color: 'rgba(255, 255, 255, 0.5)'
    }}>
      <TrendingUp size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
      <p style={{ fontSize: isMobile ? '0.9rem' : '1rem' }}>
        Geen maaltijden gepland voor vandaag
      </p>
    </div>
  )
}
