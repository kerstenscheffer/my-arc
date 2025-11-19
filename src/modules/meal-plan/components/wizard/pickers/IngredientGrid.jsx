// src/modules/meal-plan/components/wizard/pickers/IngredientGrid.jsx
// PREMIUM STYLED - Grid layout optimized for ingredient photos (2-3 columns)

import React from 'react'
import IngredientCard from './IngredientCard'

export default function IngredientGrid({
  ingredients,
  selectedIngredients,
  onSelect,           // Primary prop name
  onToggle,           // Alternative prop name
  onIngredientSelect, // Alternative prop name
  maxSelection = 3,
  searchTerm = '',
  isMobile
}) {
  // Use whichever callback is provided
  const handleSelection = onSelect || onToggle || onIngredientSelect
  
  if (!handleSelection) {
    console.error('❌ IngredientGrid: No selection callback provided!')
    console.error('   Expected one of: onSelect, onToggle, onIngredientSelect')
    return (
      <div style={{
        padding: isMobile ? '1.5rem 1rem' : '2rem',
        background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.08) 100%)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        borderRadius: isMobile ? '12px' : '14px',
        boxShadow: '0 4px 16px rgba(239, 68, 68, 0.2)',
        color: '#fff',
        textAlign: 'center'
      }}>
        <div style={{ 
          fontSize: isMobile ? '2.5rem' : '3rem', 
          marginBottom: '0.75rem',
          filter: 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.6))'
        }}>
          ❌
        </div>
        <div style={{ 
          fontSize: isMobile ? '1rem' : '1.125rem',
          fontWeight: '700',
          color: '#ef4444',
          marginBottom: '0.5rem'
        }}>
          Missing Selection Callback
        </div>
        <div style={{ 
          fontSize: isMobile ? '0.8rem' : '0.875rem',
          color: 'rgba(255, 255, 255, 0.7)'
        }}>
          Expected: onSelect, onToggle, or onIngredientSelect
        </div>
      </div>
    )
  }

  // Filter ingredients based on search term
  const filteredIngredients = ingredients.filter(ing => {
    if (!searchTerm) return true
    const searchLower = searchTerm.toLowerCase()
    return (
      ing.name?.toLowerCase().includes(searchLower) ||
      ing.name_en?.toLowerCase().includes(searchLower) ||
      ing.category?.toLowerCase().includes(searchLower) ||
      ing.label?.toLowerCase().includes(searchLower)
    )
  })

  const handleSelect = (ingredient) => {
    const isSelected = selectedIngredients.some(
      selected => (selected.id || selected) === (ingredient.id || ingredient)
    )
    
    // If already selected, always allow deselection
    if (isSelected) {
      handleSelection(ingredient)
      return
    }
    
    // If not selected, check max selection limit
    if (selectedIngredients.length >= maxSelection) {
      console.log(`⚠️ Max ${maxSelection} ingredients allowed`)
      return
    }
    
    handleSelection(ingredient)
  }

  const isIngredientSelected = (ingredient) => {
    return selectedIngredients.some(
      selected => (selected.id || selected) === (ingredient.id || ingredient)
    )
  }

  // Empty state
  if (filteredIngredients.length === 0) {
    return (
      <div style={{
        padding: isMobile ? '3rem 1rem' : '4rem 2rem',
        textAlign: 'center',
        background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.8) 0%, rgba(23, 23, 23, 0.6) 100%)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(16, 185, 129, 0.15)',
        borderRadius: isMobile ? '14px' : '16px',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
        color: 'rgba(255, 255, 255, 0.6)'
      }}>
        <div style={{ 
          fontSize: isMobile ? '3rem' : '4rem', 
          marginBottom: '1.5rem',
          filter: 'grayscale(100%) opacity(0.3)'
        }}>
          🔍
        </div>
        <div style={{ 
          fontSize: isMobile ? '1.125rem' : '1.25rem',
          fontWeight: '700',
          color: 'rgba(255, 255, 255, 0.8)',
          marginBottom: '0.5rem'
        }}>
          Geen ingrediënten gevonden
        </div>
        {searchTerm && (
          <div style={{ 
            fontSize: isMobile ? '0.875rem' : '0.95rem',
            marginTop: '0.75rem',
            padding: '0.5rem 1rem',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: '8px',
            display: 'inline-block'
          }}>
            Zoekterm: <strong style={{ color: '#10b981' }}>"{searchTerm}"</strong>
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: isMobile 
        ? 'repeat(2, 1fr)'  // 2 columns mobile (compact with photos)
        : 'repeat(3, 1fr)', // 3 columns desktop
      gap: isMobile ? '0.875rem' : '1.125rem',
      padding: isMobile ? '0.5rem 0' : '0.75rem 0'
    }}>
      {filteredIngredients.map((ingredient, index) => (
        <IngredientCard
          key={ingredient.id || index}
          ingredient={ingredient}
          isSelected={isIngredientSelected(ingredient)}
          isPopular={ingredient.isPopular} // Pass through popular flag
          onClick={() => handleSelect(ingredient)}
          isMobile={isMobile}
        />
      ))}
    </div>
  )
}
