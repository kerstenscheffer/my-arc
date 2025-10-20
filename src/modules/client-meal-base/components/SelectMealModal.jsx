// src/modules/client-meal-base/components/SelectMealModal.jsx
import { X, Search } from 'lucide-react'
import { useState } from 'react'

export default function SelectMealModal({ 
  isOpen, 
  onClose, 
  meals, 
  onSelectMeal, 
  category,
  slotNumber,
  isMobile 
}) {
  const [searchQuery, setSearchQuery] = useState('')
  
  if (!isOpen) return null
  
  const filteredMeals = meals.filter(meal =>
    meal.name.toLowerCase().includes(searchQuery.toLowerCase())
  )
  
  const categoryLabels = {
    protein: 'Protein',
    carbs: 'Carbs',
    meal_prep: 'Meal Prep'
  }
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(10px)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: isMobile ? '1rem' : '2rem',
      animation: 'fadeIn 0.3s ease'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '600px',
        maxHeight: '80vh',
        background: 'linear-gradient(180deg, #1a1a1a 0%, #0f0f0f 100%)',
        borderRadius: '20px',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
      }}>
        {/* Header */}
        <div style={{
          padding: isMobile ? '1.25rem' : '1.5rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <h2 style={{
              fontSize: isMobile ? '1.125rem' : '1.25rem',
              fontWeight: '700',
              color: '#fff',
              marginBottom: '0.25rem'
            }}>
              Selecteer Meal
            </h2>
            <p style={{
              fontSize: isMobile ? '0.8rem' : '0.875rem',
              color: 'rgba(255, 255, 255, 0.6)'
            }}>
              {categoryLabels[category]} Slot {slotNumber}
            </p>
          </div>
          
          <button
            onClick={onClose}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'
              e.currentTarget.style.borderColor = '#ef4444'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
            }}
          >
            <X size={20} color="#fff" />
          </button>
        </div>
        
        {/* Search */}
        <div style={{
          padding: isMobile ? '1rem' : '1.25rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{ position: 'relative' }}>
            <Search
              size={18}
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
              placeholder="Zoek meals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem 0.75rem 3rem',
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                color: '#fff',
                fontSize: isMobile ? '0.875rem' : '0.95rem',
                outline: 'none',
                transition: 'all 0.3s ease'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.3)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
              }}
            />
          </div>
        </div>
        
        {/* Meals List */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: isMobile ? '1rem' : '1.25rem'
        }}>
          {filteredMeals.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '2rem',
              color: 'rgba(255, 255, 255, 0.5)'
            }}>
              Geen meals gevonden
            </div>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}>
              {filteredMeals.map(meal => (
                <button
                  key={meal.id}
                  onClick={() => onSelectMeal(meal.id)}
                  style={{
                    padding: isMobile ? '1rem' : '1.25rem',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    textAlign: 'left',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'
                    e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.3)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <div style={{
                    fontSize: isMobile ? '0.95rem' : '1rem',
                    fontWeight: '600',
                    color: '#fff',
                    marginBottom: '0.5rem'
                  }}>
                    {meal.name}
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    gap: '1rem',
                    fontSize: isMobile ? '0.8rem' : '0.875rem'
                  }}>
                    <span style={{ color: '#10b981', fontWeight: '600' }}>
                      {meal.calories} kcal
                    </span>
                    <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      {Math.round(meal.protein)}g P
                    </span>
                    <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                      {Math.round(meal.carbs)}g C
                    </span>
                    <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                      {Math.round(meal.fat)}g F
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  )
}
