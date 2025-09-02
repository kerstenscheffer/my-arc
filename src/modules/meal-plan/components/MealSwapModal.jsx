// ===== 2. MealSwapModal.jsx =====
// src/modules/meal-plan/components/MealSwapModal.jsx

import React, { useState } from 'react'
import { X, RefreshCw, Search, Star, Plus, ChefHat } from 'lucide-react'

export default function MealSwapModal({ 
  isOpen, 
  onClose, 
  currentMeal, 
  onSelectMeal, 
  allMeals = [], 
  favorites = [], 
  customMeals = [], 
  onCreateCustom 
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false)
  
  if (!isOpen) return null
  
  const combinedMeals = [
    ...customMeals.map(m => ({ ...m, isCustom: true })),
    ...allMeals
  ]
  
  const sortedMeals = combinedMeals.sort((a, b) => {
    const aIsFav = favorites.includes(a.id)
    const bIsFav = favorites.includes(b.id)
    if (aIsFav && !bIsFav) return -1
    if (!aIsFav && bIsFav) return 1
    if (a.isCustom && !b.isCustom) return -1
    if (!a.isCustom && b.isCustom) return 1
    return 0
  })
  
  const filteredMeals = sortedMeals.filter(meal => {
    if (showOnlyFavorites && !favorites.includes(meal.id) && !meal.isCustom) return false
    
    const matchesSearch = meal.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || 
      (meal.category && meal.category.toLowerCase() === selectedCategory) ||
      (meal.meal_type && meal.meal_type.toLowerCase() === selectedCategory) ||
      (meal.tags && meal.tags.some(tag => tag.toLowerCase() === selectedCategory))
    return matchesSearch && matchesCategory
  })
  
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
    }}>
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
      }}>
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid rgba(16, 185, 129, 0.1)',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(16, 185, 129, 0.02) 100%)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem'
          }}>
            <h2 style={{
              color: '#fff',
              fontSize: '1.25rem',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <RefreshCw size={20} style={{ color: 'rgba(16, 185, 129, 0.8)' }} />
              Vervang Maaltijd
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
          
          {currentMeal && (
            <div style={{
              padding: '0.75rem',
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '10px',
              marginBottom: '1rem'
            }}>
              <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                Huidige maaltijd:
              </div>
              <div style={{ color: '#fff', fontWeight: '600' }}>
                {currentMeal.name}
              </div>
            </div>
          )}
          
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={16} style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'rgba(255, 255, 255, 0.4)'
              }} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Zoek maaltijd..."
                style={{
                  width: '100%',
                  padding: '0.625rem 0.75rem 0.625rem 2.5rem',
                  background: 'rgba(0, 0, 0, 0.5)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
            </div>
            
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                padding: '0.625rem 0.75rem',
                background: 'rgba(0, 0, 0, 0.5)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.9rem',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="all">Alle</option>
              <option value="breakfast">Ontbijt</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Diner</option>
              <option value="snack">Snack</option>
            </select>
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
              style={{
                padding: '0.5rem 0.75rem',
                background: showOnlyFavorites
                  ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(245, 158, 11, 0.1) 100%)'
                  : 'rgba(0, 0, 0, 0.3)',
                border: showOnlyFavorites
                  ? '1px solid rgba(245, 158, 11, 0.3)'
                  : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: showOnlyFavorites
                  ? '#f59e0b'
                  : 'rgba(255, 255, 255, 0.5)',
                fontSize: '0.8rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}
            >
              <Star size={14} fill={showOnlyFavorites ? '#f59e0b' : 'none'} />
              Favorieten
            </button>
            
            <button
              onClick={onCreateCustom}
              style={{
                padding: '0.5rem 0.75rem',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.08) 100%)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '8px',
                color: 'rgba(16, 185, 129, 0.9)',
                fontSize: '0.8rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}
            >
              <Plus size={14} />
              Eigen Maaltijd
            </button>
          </div>
        </div>
        
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1rem'
        }}>
          {filteredMeals.map((meal, index) => {
            const isFavorite = favorites.includes(meal.id)
            const isCustom = meal.isCustom
            
            return (
              <button
                key={`${meal.id}-${index}`}
                onClick={() => onSelectMeal(meal)}
                style={{
                  width: '100%',
                  padding: '0.875rem',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(16, 185, 129, 0.1)',
                  borderRadius: '12px',
                  marginBottom: '0.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  textAlign: 'left',
                  position: 'relative'
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: '0.5rem',
                  right: '0.5rem',
                  display: 'flex',
                  gap: '0.25rem'
                }}>
                  {isFavorite && (
                    <Star size={14} style={{ color: '#f59e0b', fill: '#f59e0b' }} />
                  )}
                  {isCustom && (
                    <ChefHat size={14} style={{ color: 'rgba(16, 185, 129, 0.7)' }} />
                  )}
                </div>
                
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  {meal.image_url && (
                    <div style={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '8px',
                      background: `url(${meal.image_url}) center/cover`,
                      flexShrink: 0
                    }} />
                  )}
                  
                  <div style={{ flex: 1 }}>
                    <div style={{
                      color: '#fff',
                      fontWeight: '600',
                      marginBottom: '0.25rem'
                    }}>
                      {meal.name}
                    </div>
                    <div style={{
                      display: 'flex',
                      gap: '0.75rem',
                      fontSize: '0.75rem',
                      color: 'rgba(255, 255, 255, 0.5)'
                    }}>
                      <span>{meal.kcal} kcal</span>
                      <span>{meal.protein}g eiwit</span>
                      <span>{meal.carbs}g koolh</span>
                      <span>{meal.fat}g vet</span>
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
