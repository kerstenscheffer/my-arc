import React, { useState, useEffect } from 'react'
import { 
  X, Star, Beef, Egg, Milk, Coffee, 
  Apple, Fish, Salad, Wheat, Heart, Plus
} from 'lucide-react'

export default function FavoritesModal({ 
  isOpen, 
  onClose, 
  db, 
  client,
  onSelectMeal,
  onSwapMeal 
}) {
  const [favorites, setFavorites] = useState([])
  const [allMeals, setAllMeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('favorites')
  const [hoveredMeal, setHoveredMeal] = useState(null)
  const isMobile = window.innerWidth <= 768

  // Categorie definities met grote makkelijke knoppen
  const categories = [
    { id: 'favorites', label: 'Favorieten', icon: Star, color: '#f59e0b' },
    { id: 'vlees', label: 'Vlees', icon: Beef, color: '#dc2626' },
    { id: 'ei', label: 'Ei', icon: Egg, color: '#fbbf24' },
    { id: 'zuivel', label: 'Zuivel', icon: Milk, color: '#3b82f6' },
    { id: 'shakes', label: 'Shakes', icon: Coffee, color: '#8b5cf6' },
    { id: 'vis', label: 'Vis', icon: Fish, color: '#06b6d4' },
    { id: 'groente', label: 'Groente', icon: Salad, color: '#10b981' },
    { id: 'granen', label: 'Granen', icon: Wheat, color: '#a16207' }
  ]

  useEffect(() => {
    if (isOpen && client?.id) {
      loadMeals()
    }
  }, [isOpen, client])

  const loadMeals = async () => {
    setLoading(true)
    try {
      // Laad favorieten
      const favs = await db.getFavoriteMeals?.(client.id) || []
      setFavorites(favs)
      
      // Laad alle meals per categorie
      const meals = await db.getMealsByCategory?.() || {}
      setAllMeals(meals)
    } catch (error) {
      console.error('Error loading meals:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleFavorite = async (mealId) => {
    try {
      const newFavorites = await db.toggleFavorite(client.id, mealId)
      setFavorites(prev => {
        const isFav = prev.some(m => m.id === mealId)
        if (isFav) {
          return prev.filter(m => m.id !== mealId)
        } else {
          const meal = Object.values(allMeals).flat().find(m => m.id === mealId)
          return meal ? [...prev, meal] : prev
        }
      })
    } catch (error) {
      console.error('Error toggling favorite:', error)
    }
  }

  const getMealsForCategory = () => {
    if (selectedCategory === 'favorites') {
      return favorites
    }
    
    // Filter meals op categorie
    const categoryMeals = []
    Object.entries(allMeals).forEach(([category, meals]) => {
      if (category.toLowerCase().includes(selectedCategory)) {
        categoryMeals.push(...meals)
      }
    })
    return categoryMeals
  }

  const displayMeals = getMealsForCategory()

  if (!isOpen) return null

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
        maxWidth: '700px',
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
          position: 'relative',
          background: 'linear-gradient(180deg, #111 0%, rgba(17,17,17,0.95) 100%)'
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
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
          >
            <X size={20} style={{ color: '#fff' }} />
          </button>
          
          <h2 style={{
            color: '#fff',
            fontSize: isMobile ? '1.25rem' : '1.5rem',
            fontWeight: 'bold',
            marginBottom: '0.5rem'
          }}>
            Kies je Maaltijd
          </h2>
          
          <p style={{
            color: 'rgba(255, 255, 255, 0.5)',
            fontSize: isMobile ? '0.8rem' : '0.85rem'
          }}>
            Selecteer een categorie om snel je favoriete gerecht te vinden
          </p>
        </div>

        {/* Category Buttons - Grote makkelijke knoppen */}
        <div style={{
          padding: isMobile ? '1rem' : '1.5rem',
          background: 'rgba(0, 0, 0, 0.3)',
          borderBottom: '1px solid #333'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'repeat(4, 1fr)' : 'repeat(8, 1fr)',
            gap: isMobile ? '0.75rem' : '1rem'
          }}>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  background: selectedCategory === cat.id 
                    ? `linear-gradient(135deg, ${cat.color}30 0%, ${cat.color}20 100%)`
                    : 'rgba(255, 255, 255, 0.05)',
                  border: selectedCategory === cat.id
                    ? `2px solid ${cat.color}`
                    : '2px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '16px',
                  padding: isMobile ? '0.75rem' : '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.5rem',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  minHeight: isMobile ? '80px' : '90px'
                }}
                onTouchStart={(e) => {
                  if (isMobile) {
                    e.currentTarget.style.transform = 'scale(0.95)'
                  }
                }}
                onTouchEnd={(e) => {
                  if (isMobile) {
                    e.currentTarget.style.transform = 'scale(1)'
                  }
                }}
              >
                <cat.icon 
                  size={isMobile ? 22 : 26} 
                  style={{ 
                    color: selectedCategory === cat.id ? cat.color : 'rgba(255, 255, 255, 0.6)',
                    transition: 'color 0.3s ease'
                  }} 
                />
                <span style={{
                  fontSize: isMobile ? '0.7rem' : '0.75rem',
                  color: selectedCategory === cat.id ? cat.color : 'rgba(255, 255, 255, 0.7)',
                  fontWeight: selectedCategory === cat.id ? '600' : '500'
                }}>
                  {cat.label}
                </span>
                {cat.id === 'favorites' && favorites.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    background: cat.color,
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.65rem',
                    color: '#fff',
                    fontWeight: 'bold'
                  }}>
                    {favorites.length}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Meals List */}
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
          ) : displayMeals.length > 0 ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
              gap: isMobile ? '0.75rem' : '1rem'
            }}>
              {displayMeals.map(meal => {
                const isFavorite = favorites.some(f => f.id === meal.id)
                const isHovered = hoveredMeal === meal.id
                
                return (
                  <div
                    key={meal.id}
                    onMouseEnter={() => setHoveredMeal(meal.id)}
                    onMouseLeave={() => setHoveredMeal(null)}
                    style={{
                      background: isHovered 
                        ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)'
                        : 'rgba(0, 0, 0, 0.3)',
                      border: isHovered 
                        ? '1px solid rgba(16, 185, 129, 0.3)'
                        : '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '16px',
                      padding: isMobile ? '1rem' : '1.25rem',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      position: 'relative',
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent'
                    }}
                    onClick={() => {
                      if (onSwapMeal) {
                        onSwapMeal(meal)
                        onClose()
                      } else if (onSelectMeal) {
                        onSelectMeal(meal)
                        onClose()
                      }
                    }}
                  >
                    {/* Favorite button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleToggleFavorite(meal.id)
                      }}
                      style={{
                        position: 'absolute',
                        top: '0.75rem',
                        right: '0.75rem',
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '0.5rem',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        touchAction: 'manipulation'
                      }}
                    >
                      <Star 
                        size={16} 
                        style={{ 
                          color: isFavorite ? '#f59e0b' : 'rgba(255, 255, 255, 0.4)',
                          fill: isFavorite ? '#f59e0b' : 'none'
                        }} 
                      />
                    </button>

                    <h3 style={{
                      color: '#fff',
                      fontSize: isMobile ? '0.95rem' : '1rem',
                      fontWeight: '600',
                      marginBottom: '0.5rem',
                      paddingRight: '3rem'
                    }}>
                      {meal.name}
                    </h3>

                    {/* Macros */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, 1fr)',
                      gap: '0.5rem',
                      marginTop: '0.75rem'
                    }}>
                      <MacroChip label="Kcal" value={meal.calories} color="#10b981" />
                      <MacroChip label="P" value={meal.protein} color="#3b82f6" />
                      <MacroChip label="K" value={meal.carbs} color="#f59e0b" />
                      <MacroChip label="V" value={meal.fat} color="#ec4899" />
                    </div>

                    {meal.description && (
                      <p style={{
                        color: 'rgba(255, 255, 255, 0.5)',
                        fontSize: isMobile ? '0.75rem' : '0.8rem',
                        marginTop: '0.5rem',
                        lineHeight: '1.4'
                      }}>
                        {meal.description}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              color: 'rgba(255, 255, 255, 0.4)',
              padding: '3rem'
            }}>
              <Heart size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
              <p>Geen maaltijden gevonden in deze categorie</p>
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

function MacroChip({ label, value, color }) {
  return (
    <div style={{
      background: `${color}15`,
      border: `1px solid ${color}30`,
      borderRadius: '8px',
      padding: '0.35rem',
      textAlign: 'center'
    }}>
      <div style={{
        fontSize: '0.65rem',
        color: 'rgba(255, 255, 255, 0.5)',
        marginBottom: '0.125rem'
      }}>
        {label}
      </div>
      <div style={{
        fontSize: '0.8rem',
        color: color,
        fontWeight: '600'
      }}>
        {value || 0}
      </div>
    </div>
  )
}
