// src/modules/client-meal-builder/components/IngredientList.jsx
import { X } from 'lucide-react'

export default function IngredientList({
  ingredients,
  macros,
  isMobile,
  onUpdateAmount,
  onRemoveIngredient
}) {
  if (ingredients.length === 0) return null
  
  return (
    <>
      <h3 style={{
        fontSize: isMobile ? '1.25rem' : '1.5rem',
        fontWeight: '800',
        color: '#fff',
        margin: '0 0 1rem 0'
      }}>
        Ingrediënten
      </h3>
      
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        marginBottom: '1.5rem'
      }}>
        {ingredients.map(item => (
          <div
            key={item.id}
            style={{
              background: 'rgba(0, 0, 0, 0.6)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              borderRadius: '0',
              padding: isMobile ? '1rem' : '1.25rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '1rem'
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{
                color: '#fff',
                fontSize: '1rem',
                fontWeight: '700',
                marginBottom: '0.5rem'
              }}>
                {item.ingredient.name}
              </div>
              <div style={{
                display: 'flex',
                gap: '1rem',
                fontSize: '0.85rem',
                color: 'rgba(255, 255, 255, 0.6)'
              }}>
                <span>{Math.round((item.ingredient.calories_per_100g || 0) * (item.amount_gram / 100))} kcal</span>
                <span>{Math.round((item.ingredient.protein_per_100g || 0) * (item.amount_gram / 100))}g P</span>
              </div>
            </div>
            
            <input
              type="number"
              value={item.amount_gram}
              onChange={(e) => onUpdateAmount(item.id, e.target.value)}
              style={{
                width: '80px',
                height: '44px',
                background: 'rgba(0, 0, 0, 0.8)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '0',
                color: '#fff',
                fontSize: '1rem',
                fontWeight: '600',
                textAlign: 'center',
                outline: 'none'
              }}
            />
            
            <button
              onClick={() => onRemoveIngredient(item.id)}
              style={{
                width: '44px',
                height: '44px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <X size={18} color="#ef4444" />
            </button>
          </div>
        ))}
      </div>
      
      {/* Macro Totals */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.8)',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        borderRadius: '0',
        padding: isMobile ? '1.25rem' : '1.5rem',
        marginBottom: '1.5rem',
        boxShadow: '0 0 40px rgba(16, 185, 129, 0.15)'
      }}>
        <h3 style={{
          fontSize: isMobile ? '1rem' : '1.1rem',
          fontWeight: '800',
          color: '#10b981',
          marginBottom: '1rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          Totalen
        </h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: isMobile ? '0.75rem' : '1rem'
        }}>
          {[
            { label: 'Calorieën', value: macros.calories },
            { label: 'Eiwit', value: macros.protein },
            { label: 'Koolh.', value: macros.carbs },
            { label: 'Vet', value: macros.fat }
          ].map((macro, idx) => (
            <div key={idx} style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: isMobile ? '1.5rem' : '1.75rem',
                fontWeight: '900',
                color: '#fff',
                marginBottom: '0.25rem'
              }}>
                {macro.value}
              </div>
              <div style={{
                fontSize: '0.75rem',
                color: 'rgba(255, 255, 255, 0.5)',
                fontWeight: '300',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                {macro.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
