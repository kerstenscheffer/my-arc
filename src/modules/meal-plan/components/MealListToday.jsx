import React, { useState } from 'react'
import { 
  CheckCircle2, Star, RefreshCw, Circle,
  Flame, Dumbbell, Zap, Droplets, Clock,
  TrendingUp, ChevronRight
} from 'lucide-react'

export default function MealListToday({ 
  meals, 
  checkedMeals, 
  favorites = [], 
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

      {/* Tik instructie - alleen als er unchecked meals zijn */}
      {meals.length > 0 && completedCount < meals.length && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(16, 185, 129, 0.04) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.15)',
          borderRadius: '10px',
          padding: isMobile ? '0.6rem 0.8rem' : '0.75rem 1rem',
          marginBottom: '0.75rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: isMobile ? '0.75rem' : '0.8rem',
          color: 'rgba(255, 255, 255, 0.6)'
        }}>
          <Circle size={14} style={{ color: '#10b981' }} />
          <span>Tik op de maaltijd om af te vinken</span>
        </div>
      )}
      
      {/* Progress Bar */}
      {meals.length > 0 && (
        <div style={{
          background: 'rgba(4, 120, 87, 0.1)',
          borderRadius: '6px',
          height: '3px',
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
  const [isHovered, setIsHovered] = useState(false)
  const isMobile = window.innerWidth <= 768
  
  const getMealImage = (name) => {
    if (!name) return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=150&h=150&fit=crop'
    
    const images = {
      'smoothie': 'https://images.unsplash.com/photo-1502767089025-6572583495f9?w=150&h=150&fit=crop',
      'bowl': 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=150&h=150&fit=crop',
      'chicken': 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=150&h=150&fit=crop',
      'kip': 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=150&h=150&fit=crop',
      'zalm': 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=150&h=150&fit=crop',
      'salmon': 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=150&h=150&fit=crop',
      'yoghurt': 'https://images.unsplash.com/photo-1488477304112-4944851de03d?w=150&h=150&fit=crop',
      'oats': 'https://images.unsplash.com/photo-1517673400267-0251440c45dc?w=150&h=150&fit=crop',
      'pasta': 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=150&h=150&fit=crop',
      'salade': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=150&h=150&fit=crop'
    }
    
    const key = Object.keys(images).find(k => name.toLowerCase().includes(k))
    return images[key] || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=150&h=150&fit=crop'
  }
  
  // Time status
  const getTimeStatus = () => {
    if (!meal.plannedTime) return null
    const now = new Date().getHours() + new Date().getMinutes() / 60
    const timeUntil = meal.plannedTime - now
    
    if (Math.abs(timeUntil) < 0.5) return { text: 'Nu', color: '#059669' }
    if (timeUntil > 0 && timeUntil < 2) return { text: `${Math.round(timeUntil * 60)} min`, color: '#f59e0b' }
    if (timeUntil < 0) return { text: 'Gemist', color: '#ef4444' }
    return null
  }
  
  const timeStatus = getTimeStatus()
  
  return (
    <div 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: isChecked
          ? 'linear-gradient(135deg, rgba(4, 120, 87, 0.15) 0%, rgba(5, 150, 105, 0.08) 100%)'
          : isHovered
            ? 'linear-gradient(135deg, rgba(23, 23, 23, 0.8) 0%, rgba(30, 30, 30, 0.6) 100%)'
            : 'linear-gradient(135deg, rgba(23, 23, 23, 0.6) 0%, rgba(20, 20, 20, 0.4) 100%)',
        border: isChecked
          ? '1px solid rgba(4, 120, 87, 0.3)'
          : '1px solid rgba(255, 255, 255, 0.05)',
        borderRadius: '12px',
        padding: isMobile ? '0.6rem' : '0.75rem',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'pointer',
        animation: `slideInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.05}s both`,
        position: 'relative',
        overflow: 'hidden',
        transform: isHovered ? 'translateY(-1px)' : 'translateY(0)',
        boxShadow: isHovered 
          ? '0 8px 20px rgba(0, 0, 0, 0.25)'
          : '0 2px 10px rgba(0, 0, 0, 0.15)'
      }}
      onClick={onToggle}
    >
      <div style={{ display: 'flex', gap: isMobile ? '0.6rem' : '0.75rem', alignItems: 'center' }}>
        {/* Image - kleiner */}
        <div 
          onClick={(e) => {
            e.stopPropagation()
            onDetail()
          }}
          style={{
            width: isMobile ? '45px' : '50px',
            height: isMobile ? '45px' : '50px',
            borderRadius: '10px',
            overflow: 'hidden',
            flexShrink: 0,
            position: 'relative',
            background: 'rgba(0,0,0,0.4)',
            cursor: 'pointer',
            border: isChecked ? '2px solid rgba(4, 120, 87, 0.5)' : '2px solid transparent',
            transition: 'all 0.3s ease'
          }}
        >
          <img
            src={meal.image_url || getMealImage(meal.name)}
            alt={meal.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: isChecked ? 'brightness(0.7)' : 'brightness(1)'
            }}
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=150&h=150&fit=crop'
            }}
          />
          
          {isChecked && (
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(135deg, rgba(4, 120, 87, 0.9) 0%, rgba(5, 150, 105, 0.8) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'fadeIn 0.3s ease'
            }}>
              <CheckCircle2 size={20} style={{ color: '#fff' }} />
            </div>
          )}
          
          {timeStatus && !isChecked && (
            <div style={{
              position: 'absolute',
              top: '2px',
              right: '2px',
              background: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(10px)',
              borderRadius: '6px',
              padding: '1px 4px',
              border: `1px solid ${timeStatus.color}40`
            }}>
              <span style={{
                fontSize: '0.6rem',
                color: timeStatus.color,
                fontWeight: '600'
              }}>
                {timeStatus.text}
              </span>
            </div>
          )}
        </div>
        
        {/* Content - compacter */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Time slot */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            marginBottom: '0.25rem'
          }}>
            <Clock size={10} style={{ color: 'rgba(5, 150, 105, 0.6)' }} />
            <p style={{
              color: 'rgba(5, 150, 105, 0.8)',
              fontSize: '0.65rem',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              margin: 0
            }}>
              {meal.timeSlot}
            </p>
          </div>
          
          {/* Meal name */}
          <p 
            onClick={(e) => {
              e.stopPropagation()
              onDetail()
            }}
            style={{
              color: '#fff',
              fontSize: isMobile ? '0.85rem' : '0.9rem',
              fontWeight: '600',
              textDecoration: isChecked ? 'line-through' : 'none',
              opacity: isChecked ? 0.6 : 1,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              marginBottom: '0.35rem',
              margin: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {meal.name}
          </p>
          
          {/* Macros - super compact */}
          <div style={{
            display: 'flex',
            gap: isMobile ? '0.4rem' : '0.5rem',
            marginTop: '0.35rem'
          }}>
            <MacroItem icon={Flame} value={meal.calories || meal.kcal || 0} unit="" color="#f59e0b" isChecked={isChecked} />
            <MacroItem icon={Dumbbell} value={meal.protein || 0} unit="g" color="#3b82f6" isChecked={isChecked} />
            {!isMobile && (
              <>
                <MacroItem icon={Zap} value={meal.carbs || 0} unit="g" color="#ef4444" isChecked={isChecked} />
                <MacroItem icon={Droplets} value={meal.fat || 0} unit="g" color="#8b5cf6" isChecked={isChecked} />
              </>
            )}
          </div>
        </div>
        
        {/* Action Buttons - kleiner */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          gap: '0.25rem'
        }}>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onFavorite()
            }}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: isMobile ? '0.35rem' : '0.4rem',
              borderRadius: '8px',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(245, 158, 11, 0.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
            }}
          >
            <Star 
              size={isMobile ? 14 : 16} 
              style={{ 
                color: isFavorite ? '#f59e0b' : 'rgba(255,255,255,0.2)',
                fill: isFavorite ? '#f59e0b' : 'none',
                transition: 'all 0.2s ease'
              }} 
            />
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation()
              onSwap()
            }}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: isMobile ? '0.35rem' : '0.4rem',
              borderRadius: '8px',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(5, 150, 105, 0.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
            }}
          >
            <RefreshCw 
              size={isMobile ? 14 : 16} 
              style={{ 
                color: 'rgba(5, 150, 105, 0.6)',
                transition: 'all 0.3s ease'
              }} 
            />
          </button>
        </div>
      </div>
      
      <style>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  )
}

function MacroItem({ icon: Icon, value, unit, color, isChecked }) {
  const isMobile = window.innerWidth <= 768
  
  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '2px',
      opacity: isChecked ? 0.5 : 1
    }}>
      <Icon size={isMobile ? 10 : 11} style={{ color: color }} />
      <span style={{ 
        fontSize: isMobile ? '0.65rem' : '0.7rem',
        color: 'rgba(255,255,255,0.6)',
        fontWeight: '500'
      }}>
        {value}{unit}
      </span>
    </div>
  )
}

function EmptyState() {
  const isMobile = window.innerWidth <= 768
  
  return (
    <div style={{
      textAlign: 'center',
      padding: isMobile ? '2rem 1.5rem' : '3rem 2rem',
      background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.6) 0%, rgba(20, 20, 20, 0.4) 100%)',
      borderRadius: '14px',
      border: '1px solid rgba(255, 255, 255, 0.05)'
    }}>
      <ChevronRight size={32} style={{ color: '#059669', marginBottom: '1rem', opacity: 0.5 }} />
      <p style={{
        color: '#fff',
        fontSize: isMobile ? '0.95rem' : '1.1rem',
        fontWeight: '600',
        marginBottom: '0.5rem'
      }}>
        Geen maaltijden gepland
      </p>
      <p style={{
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: isMobile ? '0.8rem' : '0.9rem'
      }}>
        Vraag je coach om een meal plan voor je te maken!
      </p>
    </div>
  )
}
