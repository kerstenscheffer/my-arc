import useIsMobile from '../../../hooks/useIsMobile'
// src/modules/meal-plan/components/MealList.jsx
// VERVANG JE HELE BESTAND HIERMEE - ALLES IN 1 FILE
import React, { useEffect } from 'react'
import {
  Utensils, Star, RefreshCw, CheckCircle2,
  Flame, Dumbbell, Zap, Droplets, PlusCircle, UtensilsCrossed
} from 'lucide-react'

export default function MealList({
  meals,
  checkedMeals,
  favorites,
  onToggleMeal,
  onSwapMeal,
  onToggleFavorite,
  onViewDetails,
  onAddCustomMeal
}) {
  const isMobile = useIsMobile()
  
  return (
    <div style={{
      background: 'rgba(0, 0, 0, 0.4)',
      backdropFilter: 'blur(10px)',
      borderRadius: '20px',
      padding: '1rem',
      border: '1px solid rgba(16, 185, 129, 0.15)',
      marginBottom: '1.5rem'
    }}>
      <h3 style={{
        color: '#fff',
        fontSize: '1.1rem',
        fontWeight: 'bold',
        marginBottom: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <Utensils size={20} style={{ color: 'rgba(16, 185, 129, 0.7)' }} />
        Vandaag's Maaltijden
      </h3>
      
      {meals.length > 0 ? (
        meals.map((meal, idx) => (
          <MealCard
            key={`meal-${meal.id || idx}-${idx}`}
            meal={meal}
            isEaten={checkedMeals[idx]}
            isFavorite={favorites.includes(meal.id)}
            onToggle={() => onToggleMeal(idx)}
            onSwap={() => onSwapMeal(meal)}
            onFavorite={() => onToggleFavorite(meal.id)}
            onViewDetails={() => onViewDetails(meal)}
            timeSlot={meal.timeSlot}
          />
        ))
      ) : (
        <div style={{
          textAlign: 'center',
          padding: '2rem',
          color: 'rgba(255, 255, 255, 0.4)'
        }}>
          Geen maaltijden gepland voor vandaag.
          Vraag je coach om een meal plan voor je te maken!
        </div>
      )}
      
      <button
        onClick={onAddCustomMeal}
        style={{
          width: '100%',
          padding: '0.875rem',
          marginTop: '1rem',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          borderRadius: '12px',
          color: 'rgba(16, 185, 129, 0.9)',
          fontWeight: '600',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          transition: 'all 0.2s ease'
        }}
      >
        <PlusCircle size={18} />
        Voeg Eigen Maaltijd Toe
      </button>
    </div>
  )
}

function MealCard({ meal, isEaten, isFavorite, onToggle, onSwap, onFavorite, onViewDetails, timeSlot }) {
  const imageUrl = meal.image_url && meal.image_url.trim() !== '' ? meal.image_url : null
  
  return (
    <div
      style={{
        background: isEaten
          ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(16, 185, 129, 0.03) 100%)'
          : 'rgba(0, 0, 0, 0.3)',
        border: isEaten
          ? '1px solid rgba(16, 185, 129, 0.25)'
          : '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        padding: '0.875rem',
        marginBottom: '0.75rem',
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        position: 'relative'
      }}
      onClick={onToggle}
    >
      <button
        onClick={(e) => {
          e.stopPropagation()
          onFavorite()
        }}
        style={{
          position: 'absolute',
          top: '0.5rem',
          right: '0.5rem',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: '0.25rem',
          zIndex: 10
        }}
      >
        <Star 
          size={18} 
          style={{ 
            color: isFavorite ? '#f59e0b' : 'rgba(255,255,255,0.2)',
            fill: isFavorite ? '#f59e0b' : 'none',
            transition: 'all 0.3s ease'
          }} 
        />
      </button>
      
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem'
      }}>
        <div 
          onClick={(e) => {
            e.stopPropagation()
            onViewDetails()
          }}
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            border: isEaten 
              ? '2px solid rgba(16, 185, 129, 0.5)'
              : '2px solid rgba(255, 255, 255, 0.1)',
            position: 'relative',
            flexShrink: 0,
            overflow: 'hidden',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {/* Meal image */}
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={meal.name}
              style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
          ) : (
            <UtensilsCrossed size={20} style={{ color: '#FFD700', opacity: 0.35 }} />
          )}
          
          {isEaten && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.8) 0%, rgba(5, 150, 105, 0.8) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2
            }}>
              <CheckCircle2 size={24} style={{ color: '#fff' }} />
            </div>
          )}
        </div>
        
        <div style={{ flex: 1 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.25rem'
          }}>
            <span style={{
              color: 'rgba(16, 185, 129, 0.6)',
              fontSize: '0.7rem',
              fontWeight: '600',
              textTransform: 'uppercase'
            }}>
              {timeSlot}
            </span>
            
            <button
              onClick={(e) => {
                e.stopPropagation()
                onSwap()
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'rgba(16, 185, 129, 0.5)',
                cursor: 'pointer',
                padding: '0.25rem',
                transition: 'all 0.2s ease'
              }}
            >
              <RefreshCw size={14} />
            </button>
          </div>
          
          <div 
            onClick={(e) => {
              e.stopPropagation()
              onViewDetails()
            }}
            style={{
              color: '#fff',
              fontSize: '0.95rem',
              fontWeight: '600',
              marginBottom: '0.5rem',
              cursor: 'pointer',
              textDecoration: isEaten ? 'line-through' : 'none',
              opacity: isEaten ? 0.7 : 1
            }}
          >
            {meal.name}
          </div>
          
          <div style={{
            display: 'flex',
            gap: '0.75rem',
            fontSize: '0.75rem',
            color: 'rgba(255,255,255,0.5)'
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              <Flame size={11} style={{ color: 'rgba(16, 185, 129, 0.6)' }} />
              {meal.calories || meal.kcal || 0}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              <Dumbbell size={11} style={{ color: 'rgba(5, 150, 105, 0.6)' }} />
              {meal.protein || 0}g
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              <Zap size={11} style={{ color: 'rgba(4, 120, 87, 0.6)' }} />
              {meal.carbs || 0}g
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              <Droplets size={11} style={{ color: 'rgba(16, 185, 129, 0.5)' }} />
              {meal.fat || 0}g
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
