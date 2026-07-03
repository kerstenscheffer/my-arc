// src/modules/meal-plan/components/consumed-meals/ConsumedMealsList.jsx
// 🎯 CONSUMED MEALS LIST - Grid display of consumed meals
// Props: meals, loading, onDeleteMeal, isMobile

import React from 'react'
import { Loader, Coffee } from 'lucide-react'
import ConsumedMealCard from './ConsumedMealCard'
import { foodImageFallback } from '../../foodImageFallback'

// Foto: eigen image_url, anders een titel-gebaseerde fallback (kwark -> zuivel).
const getMealImage = (meal) => {
  if (meal?.image_url) return meal.image_url
  return foodImageFallback(meal?.name || meal?.title || meal?.product_name, meal?.meal_type, 100)
}

export default function ConsumedMealsList({
  meals,
  loading,
  onDeleteMeal,
  isMobile
}) {
  
  // Loading State
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 1rem',
        gap: '1rem'
      }}>
        <Loader 
          size={isMobile ? 32 : 40} 
          color="#f59e0b"
          style={{
            animation: 'spin 1s linear infinite'
          }}
        />
        <div style={{
          fontSize: isMobile ? '0.85rem' : '0.9rem',
          color: 'rgba(245, 158, 11, 0.6)',
          fontWeight: '600'
        }}>
          Maaltijden laden...
        </div>
        
        <style>
          {`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    )
  }
  
  // Empty State
  if (!meals || meals.length === 0) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobile ? '2rem 1rem' : '3rem 1rem',
        gap: '1rem',
        background: 'rgba(245, 158, 11, 0.04)',
        border: '1px solid rgba(245, 158, 11, 0.1)',
        borderRadius: '12px',
        minHeight: isMobile ? '200px' : '250px'
      }}>
        <Coffee 
          size={isMobile ? 48 : 64} 
          color="rgba(245, 158, 11, 0.2)"
          strokeWidth={1.5}
        />
        <div style={{
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: isMobile ? '1rem' : '1.125rem',
            fontWeight: '700',
            color: 'rgba(245, 158, 11, 0.5)',
            marginBottom: '0.375rem'
          }}>
            Nog geen maaltijden gelogd
          </div>
          <div style={{
            fontSize: isMobile ? '0.8rem' : '0.85rem',
            color: 'rgba(255, 255, 255, 0.3)',
            fontWeight: '500'
          }}>
            Log je eerste maaltijd om te beginnen met tracken
          </div>
        </div>
      </div>
    )
  }
  
  // Meals Grid
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr',
      gap: isMobile ? '0.75rem' : '0.875rem'
    }}>
      {meals.map((meal) => (
        <ConsumedMealCard
          key={meal.id}
          meal={meal}
          onDelete={() => onDeleteMeal(meal.id)}
          isMobile={isMobile}
          getMealImage={getMealImage}
        />
      ))}
    </div>
  )
}
