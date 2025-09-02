// ===== 1. MealDetailModal.jsx =====
// src/modules/meal-plan/components/MealDetailModal.jsx

import React, { useState, useEffect } from 'react'
import { X, BookOpen } from 'lucide-react'

export default function MealDetailModal({ isOpen, onClose, meal, db }) {
  const [details, setDetails] = useState(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    if (isOpen && meal) {
      loadMealDetails()
    }
  }, [isOpen, meal])
  
  const loadMealDetails = async () => {
    setLoading(true)
    try {
      if (db && meal.id) {
        const fullMeal = await db.getMealDetails(meal.id)
        setDetails(fullMeal || meal)
      } else {
        setDetails(meal)
      }
    } catch (error) {
      console.error('Error loading meal details:', error)
      setDetails(meal)
    } finally {
      setLoading(false)
    }
  }
  
  if (!isOpen || !meal) return null
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.95)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '1rem',
      backdropFilter: 'blur(10px)'
    }} onClick={onClose}>
      <div style={{
        background: 'linear-gradient(180deg, #1a1a1a 0%, #0f0f0f 100%)',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '500px',
        maxHeight: '80vh',
        overflow: 'hidden',
        border: '1px solid rgba(16, 185, 129, 0.2)',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
        display: 'flex',
        flexDirection: 'column'
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid rgba(16, 185, 129, 0.1)',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(16, 185, 129, 0.02) 100%)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <h2 style={{
              color: '#fff',
              fontSize: '1.25rem',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <BookOpen size={20} style={{ color: 'rgba(16, 185, 129, 0.8)' }} />
              {meal.name}
            </h2>
            
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                borderRadius: '10px',
                padding: '0.5rem',
                cursor: 'pointer',
                color: 'rgba(255, 255, 255, 0.6)'
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>
        
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1.5rem'
        }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div style={{
                width: '40px',
                height: '40px',
                border: '3px solid rgba(16, 185, 129, 0.2)',
                borderTopColor: 'rgba(16, 185, 129, 0.8)',
                borderRadius: '50%',
                margin: '0 auto',
                animation: 'spin 1s linear infinite'
              }} />
            </div>
          ) : (
            <>
              {(details?.image_url || meal.image_url) && (
                <div style={{
                  width: '100%',
                  height: '200px',
                  borderRadius: '12px',
                  background: `url(${details?.image_url || meal.image_url}) center/cover`,
                  marginBottom: '1.5rem'
                }} />
              )}
              
              <MacroGrid meal={meal} />
              
              {(details?.ingredients || meal.ingredients) && (
                <IngredientsSection ingredients={details?.ingredients || meal.ingredients} />
              )}
              
              {(details?.preparation || meal.preparation) && (
                <PreparationSection preparation={details?.preparation || meal.preparation} />
              )}
            </>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function MacroGrid({ meal }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '0.75rem',
      marginBottom: '1.5rem'
    }}>
      {[
        { icon: '🔥', value: meal.kcal, label: 'kcal', color: 'rgba(16, 185, 129, 0.9)' },
        { icon: '💪', value: `${meal.protein}g`, label: 'Eiwit', color: 'rgba(5, 150, 105, 0.9)' },
        { icon: '⚡', value: `${meal.carbs}g`, label: 'Koolh', color: 'rgba(4, 120, 87, 0.9)' },
        { icon: '💧', value: `${meal.fat}g`, label: 'Vet', color: 'rgba(16, 185, 129, 0.7)' }
      ].map(({ icon, value, label, color }) => (
        <div key={label} style={{
          textAlign: 'center',
          padding: '0.75rem',
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '10px',
          border: `1px solid ${color}33`
        }}>
          <div style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>{icon}</div>
          <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '0.95rem' }}>
            {value}
          </div>
          <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.7rem' }}>
            {label}
          </div>
        </div>
      ))}
    </div>
  )
}

function IngredientsSection({ ingredients }) {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <h3 style={{
        color: 'rgba(16, 185, 129, 0.9)',
        fontSize: '0.9rem',
        fontWeight: '600',
        marginBottom: '0.75rem',
        textTransform: 'uppercase'
      }}>
        Ingrediënten
      </h3>
      <div style={{
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '10px',
        padding: '1rem'
      }}>
        {Array.isArray(ingredients) ? (
          <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
            {ingredients.map((ingredient, idx) => (
              <li key={idx} style={{
                color: 'rgba(255, 255, 255, 0.8)',
                marginBottom: '0.5rem',
                fontSize: '0.9rem'
              }}>
                {ingredient}
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ color: 'rgba(255, 255, 255, 0.8)', margin: 0 }}>
            {ingredients}
          </p>
        )}
      </div>
    </div>
  )
}

function PreparationSection({ preparation }) {
  return (
    <div>
      <h3 style={{
        color: 'rgba(16, 185, 129, 0.9)',
        fontSize: '0.9rem',
        fontWeight: '600',
        marginBottom: '0.75rem',
        textTransform: 'uppercase'
      }}>
        Bereiding
      </h3>
      <div style={{
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '10px',
        padding: '1rem',
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: '0.9rem',
        lineHeight: '1.6'
      }}>
        {preparation || 'Bereidingswijze wordt binnenkort toegevoegd.'}
      </div>
    </div>
  )
}
