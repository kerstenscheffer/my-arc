import React, { useState, useEffect } from 'react'
import { 
  X, Shuffle, TrendingUp, TrendingDown, 
  Flame, Dumbbell, Wheat, Droplets
} from 'lucide-react'

export default function AlternativesModal({ 
  isOpen, 
  onClose,
  currentMeal,
  db,
  client,
  onSwapMeal
}) {
  const [alternatives, setAlternatives] = useState([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('similar') // similar, calories, protein
  const isMobile = window.innerWidth <= 768

  useEffect(() => {
    if (isOpen && currentMeal) {
      loadAlternatives()
    }
  }, [isOpen, currentMeal, sortBy])

  const loadAlternatives = async () => {
    setLoading(true)
    try {
      // Haal alternatieven op basis van huidige maaltijd
      const suggestions = await db.getSwapSuggestions?.(currentMeal, 20) || []
      
      // Sorteer op basis van selectie
      let sorted = [...suggestions]
      if (sortBy === 'calories') {
        sorted.sort((a, b) => Math.abs(a.calories - currentMeal.calories) - Math.abs(b.calories - currentMeal.calories))
      } else if (sortBy === 'protein') {
        sorted.sort((a, b) => b.protein - a.protein)
      }
      
      setAlternatives(sorted)
    } catch (error) {
      console.error('Error loading alternatives:', error)
    } finally {
      setLoading(false)
    }
  }

  const getComparisonColor = (value, original) => {
    const diff = value - original
    if (Math.abs(diff) < 5) return 'rgba(255, 255, 255, 0.5)'
    return diff > 0 ? '#10b981' : '#ef4444'
  }

  const getComparisonIcon = (value, original) => {
    const diff = value - original
    if (Math.abs(diff) < 5) return null
    return diff > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />
  }

  if (!isOpen || !currentMeal) return null

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.95)',
      zIndex: 10000,
      display: 'flex',
      alignItems: 'flex-end',
      animation: 'fadeIn 0.2s ease'
    }}>
      <div style={{
        background: '#111',
        borderTopLeftRadius: '24px',
        borderTopRightRadius: '24px',
        width: '100%',
        maxWidth: '600px',
        height: '85vh',
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
              transition: 'all 0.3s ease',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            <X size={20} style={{ color: '#fff' }} />
          </button>
          
          <h2 style={{
            color: '#fff',
            fontSize: isMobile ? '1.25rem' : '1.5rem',
            fontWeight: 'bold',
            marginBottom: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Shuffle size={24} style={{ color: '#10b981' }} />
            Alternatieven
          </h2>

          {/* Current Meal Info */}
          <div style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: '12px',
            padding: isMobile ? '0.75rem' : '1rem',
            marginTop: '1rem'
          }}>
            <div style={{
              fontSize: isMobile ? '0.75rem' : '0.8rem',
              color: 'rgba(255, 255, 255, 0.5)',
              marginBottom: '0.25rem'
            }}>
              Huidige maaltijd
            </div>
            <div style={{
              color: '#fff',
              fontSize: isMobile ? '0.95rem' : '1rem',
              fontWeight: '600',
              marginBottom: '0.5rem'
            }}>
              {currentMeal.name}
            </div>
            <div style={{
              display: 'flex',
              gap: '1rem',
              fontSize: isMobile ? '0.75rem' : '0.8rem'
            }}>
              <span style={{ color: '#10b981' }}>
                <Flame size={12} style={{ display: 'inline', marginRight: '4px' }} />
                {currentMeal.calories} kcal
              </span>
              <span style={{ color: '#3b82f6' }}>
                <Dumbbell size={12} style={{ display: 'inline', marginRight: '4px' }} />
                {currentMeal.protein}g eiwit
              </span>
            </div>
          </div>
        </div>

        {/* Sort Options */}
        <div style={{
          padding: isMobile ? '0.75rem 1rem' : '1rem 1.5rem',
          background: 'rgba(0, 0, 0, 0.3)',
          borderBottom: '1px solid #333',
          display: 'flex',
          gap: '0.5rem'
        }}>
          {[
            { id: 'similar', label: 'Vergelijkbaar' },
            { id: 'calories', label: 'Calorieën' },
            { id: 'protein', label: 'Eiwit' }
          ].map(option => (
            <button
              key={option.id}
              onClick={() => setSortBy(option.id)}
              style={{
                padding: isMobile ? '0.5rem 0.75rem' : '0.6rem 1rem',
                background: sortBy === option.id 
                  ? 'rgba(16, 185, 129, 0.2)'
                  : 'rgba(255, 255, 255, 0.05)',
                border: sortBy === option.id
                  ? '1px solid rgba(16, 185, 129, 0.5)'
                  : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: sortBy === option.id ? '#10b981' : 'rgba(255, 255, 255, 0.6)',
                fontSize: isMobile ? '0.75rem' : '0.8rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Alternatives List */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: isMobile ? '1rem' : '1.5rem'
        }}>
          {loading ? (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '200px'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                border: '3px solid rgba(16, 185, 129, 0.2)',
                borderTopColor: '#10b981',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
            </div>
          ) : alternatives.length > 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: isMobile ? '0.75rem' : '1rem'
            }}>
              {alternatives.map((meal, idx) => (
                <button
                  key={meal.id}
                  onClick={() => {
                    onSwapMeal(meal)
                    onClose()
                  }}
                  style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '16px',
                    padding: isMobile ? '1rem' : '1.25rem',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    textAlign: 'left',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(16, 185, 129, 0.05)'
                    e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.3)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(0, 0, 0, 0.3)'
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '0.75rem'
                  }}>
                    <div>
                      <h3 style={{
                        color: '#fff',
                        fontSize: isMobile ? '0.95rem' : '1rem',
                        fontWeight: '600',
                        marginBottom: '0.25rem'
                      }}>
                        {meal.name}
                      </h3>
                      {meal.category && (
                        <span style={{
                          fontSize: isMobile ? '0.7rem' : '0.75rem',
                          color: 'rgba(255, 255, 255, 0.4)',
                          background: 'rgba(255, 255, 255, 0.05)',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '6px',
                          display: 'inline-block'
                        }}>
                          {meal.category}
                        </span>
                      )}
                    </div>
                    
                    <div style={{
                      background: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.2)',
                      borderRadius: '8px',
                      padding: '0.35rem 0.6rem',
                      fontSize: isMobile ? '0.75rem' : '0.8rem',
                      color: '#10b981',
                      fontWeight: '600'
                    }}>
                      Kies deze
                    </div>
                  </div>

                  {/* Macro Comparison */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '0.5rem'
                  }}>
                    <MacroComparison 
                      label="Kcal"
                      value={meal.calories}
                      original={currentMeal.calories}
                      color="#10b981"
                    />
                    <MacroComparison 
                      label="Eiwit"
                      value={meal.protein}
                      original={currentMeal.protein}
                      color="#3b82f6"
                    />
                    <MacroComparison 
                      label="Koolh"
                      value={meal.carbs}
                      original={currentMeal.carbs}
                      color="#f59e0b"
                    />
                    <MacroComparison 
                      label="Vet"
                      value={meal.fat}
                      original={currentMeal.fat}
                      color="#ec4899"
                    />
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              color: 'rgba(255, 255, 255, 0.4)',
              padding: '3rem'
            }}>
              <Shuffle size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
              <p>Geen alternatieven gevonden</p>
            </div>
          )}
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

function MacroComparison({ label, value, original, color }) {
  const diff = value - original
  const showDiff = Math.abs(diff) >= 5
  const isHigher = diff > 0
  const isMobile = window.innerWidth <= 768
  
  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.03)',
      border: '1px solid rgba(255, 255, 255, 0.05)',
      borderRadius: '8px',
      padding: isMobile ? '0.5rem' : '0.6rem',
      textAlign: 'center'
    }}>
      <div style={{
        fontSize: isMobile ? '0.65rem' : '0.7rem',
        color: 'rgba(255, 255, 255, 0.4)',
        marginBottom: '0.25rem'
      }}>
        {label}
      </div>
      <div style={{
        fontSize: isMobile ? '0.85rem' : '0.9rem',
        color: showDiff ? (isHigher ? '#10b981' : '#ef4444') : color,
        fontWeight: '600',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.25rem'
      }}>
        {value}
        {showDiff && (
          <>
            {isHigher ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            <span style={{ fontSize: '0.7rem' }}>
              ({isHigher ? '+' : ''}{diff})
            </span>
          </>
        )}
      </div>
    </div>
  )
}
