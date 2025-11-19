// src/modules/meal-logging-wizard/components/MealDetailAdjuster.jsx
import React, { useState, useEffect } from 'react'
import { X, Check, Flame, Dumbbell, Wheat, Droplets, MinusCircle, PlusCircle } from 'lucide-react'

export default function MealDetailAdjuster({
  isOpen,
  onClose,
  meal,
  client,
  mealLoggingService,
  onMealLogged
}) {
  const isMobile = window.innerWidth <= 768
  
  const [adjustedIngredients, setAdjustedIngredients] = useState([])
  const [totals, setTotals] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 })
  const [logging, setLogging] = useState(false)
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (meal?.ingredients) {
      // Initialize with original ingredient weights
      const initialized = meal.ingredients.map(ing => ({
        ...ing,
        adjustedWeight: ing.weight || ing.amount || 100,
        originalWeight: ing.weight || ing.amount || 100
      }))
      setAdjustedIngredients(initialized)
    } else {
      // No ingredients - use meal totals directly
      setAdjustedIngredients([])
      setTotals({
        calories: meal.kcal || meal.calories || 0,
        protein: meal.protein || 0,
        carbs: meal.carbs || 0,
        fat: meal.fat || 0
      })
    }
  }, [meal])

  useEffect(() => {
    // Recalculate totals when ingredients change
    if (adjustedIngredients.length > 0) {
      calculateTotals()
    }
  }, [adjustedIngredients])

  const calculateTotals = () => {
    const newTotals = adjustedIngredients.reduce((acc, ing) => {
      const ratio = ing.adjustedWeight / (ing.originalWeight || 100)
      
      return {
        calories: acc.calories + ((ing.calories || ing.kcal || 0) * ratio),
        protein: acc.protein + ((ing.protein || 0) * ratio),
        carbs: acc.carbs + ((ing.carbs || 0) * ratio),
        fat: acc.fat + ((ing.fat || 0) * ratio)
      }
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 })

    setTotals(newTotals)
  }

  const handleWeightChange = (index, newWeight) => {
    const updated = [...adjustedIngredients]
    updated[index].adjustedWeight = Math.max(0, parseFloat(newWeight) || 0)
    setAdjustedIngredients(updated)
  }

  const handleQuickAdjust = (index, delta) => {
    const updated = [...adjustedIngredients]
    const current = updated[index].adjustedWeight
    updated[index].adjustedWeight = Math.max(0, current + delta)
    setAdjustedIngredients(updated)
  }

  const handleLogMeal = async () => {
    setLogging(true)
    try {
      const mealData = {
        name: meal.name,
        id: meal.id,
        ingredients: adjustedIngredients.map(ing => ({
          name: ing.name,
          weight: ing.adjustedWeight,
          calories: (ing.calories || ing.kcal || 0) * (ing.adjustedWeight / ing.originalWeight),
          protein: (ing.protein || 0) * (ing.adjustedWeight / ing.originalWeight),
          carbs: (ing.carbs || 0) * (ing.adjustedWeight / ing.originalWeight),
          fat: (ing.fat || 0) * (ing.adjustedWeight / ing.originalWeight)
        })),
        calories: Math.round(totals.calories),
        protein: Math.round(totals.protein * 10) / 10,
        carbs: Math.round(totals.carbs * 10) / 10,
        fat: Math.round(totals.fat * 10) / 10,
        source: 'custom_meal',
        notes: notes.trim() || null
      }

      const loggedData = await mealLoggingService.logConsumedMeal(
        client.id,
        mealData,
        new Date()
      )

      console.log('✅ Meal logged successfully:', loggedData)
      onMealLogged?.(loggedData)
      
    } catch (error) {
      console.error('❌ Failed to log meal:', error)
      alert('Kon maaltijd niet loggen: ' + error.message)
    } finally {
      setLogging(false)
    }
  }

  if (!isOpen || !meal) return null

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.95)',
        zIndex: 10001,
        display: 'flex',
        alignItems: 'flex-end',
        animation: 'fadeIn 0.2s ease'
      }}
    >
      <div style={{
        background: '#111',
        borderTopLeftRadius: '24px',
        borderTopRightRadius: '24px',
        width: '100%',
        maxWidth: '600px',
        height: '90vh',
        margin: '0 auto',
        overflow: 'hidden',
        border: '1px solid #333',
        animation: 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        
        {/* Header */}
        <div style={{
          padding: isMobile ? '1.25rem' : '1.5rem',
          borderBottom: '1px solid #333',
          position: 'relative'
        }}>
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: isMobile ? '1.25rem' : '1.5rem',
              right: isMobile ? '1.25rem' : '1.5rem',
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            <X size={20} style={{ color: '#fff' }} />
          </button>
          
          <h2 style={{
            color: '#fff',
            fontSize: isMobile ? '1.1rem' : '1.25rem',
            fontWeight: '800',
            marginBottom: '0.5rem',
            paddingRight: '3rem',
            lineHeight: 1.3
          }}>
            {meal.name || 'Unnamed Meal'}
          </h2>

          {/* Current Totals */}
          <div style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: '12px',
            padding: isMobile ? '0.75rem' : '1rem',
            marginTop: '1rem'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: isMobile ? '0.5rem' : '0.75rem'
            }}>
              <MacroDisplay 
                icon={<Flame size={14} />}
                label="Kcal"
                value={Math.round(totals.calories)}
                color="#10b981"
                isMobile={isMobile}
              />
              <MacroDisplay 
                icon={<Dumbbell size={14} />}
                label="Eiwit"
                value={`${Math.round(totals.protein * 10) / 10}g`}
                color="#3b82f6"
                isMobile={isMobile}
              />
              <MacroDisplay 
                icon={<Wheat size={14} />}
                label="Carbs"
                value={`${Math.round(totals.carbs * 10) / 10}g`}
                color="#f59e0b"
                isMobile={isMobile}
              />
              <MacroDisplay 
                icon={<Droplets size={14} />}
                label="Vet"
                value={`${Math.round(totals.fat * 10) / 10}g`}
                color="#ef4444"
                isMobile={isMobile}
              />
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: isMobile ? '1rem' : '1.5rem',
          WebkitOverflowScrolling: 'touch'
        }}>
          {adjustedIngredients.length > 0 ? (
            <>
              <h3 style={{
                fontSize: isMobile ? '0.95rem' : '1.05rem',
                fontWeight: '700',
                color: '#fff',
                marginBottom: isMobile ? '0.75rem' : '1rem'
              }}>
                📝 Pas gewichten aan
              </h3>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: isMobile ? '0.75rem' : '1rem'
              }}>
                {adjustedIngredients.map((ingredient, index) => (
                  <IngredientAdjuster
                    key={index}
                    ingredient={ingredient}
                    onWeightChange={(newWeight) => handleWeightChange(index, newWeight)}
                    onQuickAdjust={(delta) => handleQuickAdjust(index, delta)}
                    isMobile={isMobile}
                  />
                ))}
              </div>
            </>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: isMobile ? '2rem 1rem' : '3rem 2rem',
              color: 'rgba(255, 255, 255, 0.6)'
            }}>
              <p style={{ fontSize: isMobile ? '0.875rem' : '0.95rem' }}>
                Geen ingrediënten beschikbaar. De maaltijd wordt gelogd met de standaard waarden.
              </p>
            </div>
          )}

          {/* Optional Notes */}
          <div style={{ marginTop: isMobile ? '1.5rem' : '2rem' }}>
            <label style={{
              display: 'block',
              fontSize: isMobile ? '0.875rem' : '0.95rem',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.8)',
              marginBottom: '0.5rem'
            }}>
              💬 Notitie (optioneel)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Bijv: Extra lekker vandaag..."
              style={{
                width: '100%',
                padding: isMobile ? '0.75rem' : '1rem',
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                color: '#fff',
                fontSize: isMobile ? '0.875rem' : '0.95rem',
                fontFamily: 'inherit',
                resize: 'vertical',
                minHeight: '80px',
                outline: 'none'
              }}
            />
          </div>
        </div>

        {/* Footer - Log Button */}
        <div style={{
          padding: isMobile ? '1rem' : '1.5rem',
          borderTop: '1px solid #333',
          background: 'rgba(0, 0, 0, 0.3)'
        }}>
          <button
            onClick={handleLogMeal}
            disabled={logging}
            style={{
              width: '100%',
              padding: isMobile ? '1rem' : '1.25rem',
              background: logging 
                ? 'rgba(16, 185, 129, 0.2)'
                : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: 'none',
              borderRadius: '16px',
              color: '#fff',
              fontSize: isMobile ? '1rem' : '1.1rem',
              fontWeight: '800',
              cursor: logging ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              boxShadow: logging 
                ? 'none'
                : '0 4px 12px rgba(16, 185, 129, 0.4)',
              transition: 'all 0.3s ease',
              opacity: logging ? 0.6 : 1
            }}
          >
            {logging ? (
              <>
                <div style={{
                  width: '20px',
                  height: '20px',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  borderTopColor: '#fff',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite'
                }} />
                Loggen...
              </>
            ) : (
              <>
                <Check size={20} strokeWidth={3} />
                Log deze maaltijd
              </>
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

// Macro Display Component
function MacroDisplay({ icon, label, value, color, isMobile }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '0.25rem'
    }}>
      <div style={{ color, display: 'flex', alignItems: 'center' }}>
        {icon}
      </div>
      <div style={{
        fontSize: isMobile ? '0.7rem' : '0.75rem',
        color: 'rgba(255, 255, 255, 0.5)',
        fontWeight: '600'
      }}>
        {label}
      </div>
      <div style={{
        fontSize: isMobile ? '0.875rem' : '0.95rem',
        color: '#fff',
        fontWeight: '700'
      }}>
        {value}
      </div>
    </div>
  )
}

// Ingredient Adjuster Component
function IngredientAdjuster({ ingredient, onWeightChange, onQuickAdjust, isMobile }) {
  return (
    <div style={{
      background: 'rgba(0, 0, 0, 0.4)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '12px',
      padding: isMobile ? '0.875rem' : '1rem'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '0.75rem'
      }}>
        <span style={{
          fontSize: isMobile ? '0.875rem' : '0.95rem',
          fontWeight: '700',
          color: '#fff'
        }}>
          {ingredient.name || 'Unknown'}
        </span>
        <span style={{
          fontSize: isMobile ? '0.75rem' : '0.8rem',
          color: 'rgba(255, 255, 255, 0.5)',
          fontWeight: '600'
        }}>
          {Math.round((ingredient.calories || ingredient.kcal || 0) * (ingredient.adjustedWeight / ingredient.originalWeight))} kcal
        </span>
      </div>

      {/* Weight Controls */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem'
      }}>
        <button
          onClick={() => onQuickAdjust(-10)}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            width: isMobile ? '36px' : '40px',
            height: isMobile ? '36px' : '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent'
          }}
        >
          <MinusCircle size={isMobile ? 18 : 20} color="rgba(255, 255, 255, 0.6)" />
        </button>

        <input
          type="number"
          value={ingredient.adjustedWeight}
          onChange={(e) => onWeightChange(e.target.value)}
          style={{
            flex: 1,
            padding: isMobile ? '0.5rem' : '0.625rem',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '8px',
            color: '#10b981',
            fontSize: isMobile ? '0.95rem' : '1.05rem',
            fontWeight: '700',
            textAlign: 'center',
            outline: 'none'
          }}
        />

        <span style={{
          fontSize: isMobile ? '0.875rem' : '0.95rem',
          color: 'rgba(255, 255, 255, 0.6)',
          fontWeight: '600',
          minWidth: '20px'
        }}>
          g
        </span>

        <button
          onClick={() => onQuickAdjust(10)}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            width: isMobile ? '36px' : '40px',
            height: isMobile ? '36px' : '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent'
          }}
        >
          <PlusCircle size={isMobile ? 18 : 20} color="rgba(255, 255, 255, 0.6)" />
        </button>
      </div>
    </div>
  )
}
