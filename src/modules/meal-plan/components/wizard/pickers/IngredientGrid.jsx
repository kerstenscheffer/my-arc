// src/modules/meal-plan/components/wizard/pickers/IngredientGrid.jsx
// Grid met max 3 selecties + search

import { useState, useMemo } from 'react'
import { Search, X } from 'lucide-react'
import IngredientCard from './IngredientCard'

export default function IngredientGrid({ 
  ingredients = [],
  selected = [],
  onSelect,
  maxSelect = 3,
  coachPicks = [],
  category = 'protein' // 'protein' of 'carbs'
}) {
  const isMobile = window.innerWidth <= 768
  const [searchTerm, setSearchTerm] = useState('')
  
  // Filter ingrediënten op search term
  const filteredIngredients = useMemo(() => {
    if (!searchTerm) return ingredients
    
    const search = searchTerm.toLowerCase()
    return ingredients.filter(ing => 
      ing.name?.toLowerCase().includes(search) ||
      ing.name_en?.toLowerCase().includes(search)
    )
  }, [ingredients, searchTerm])
  
  // Sorteer: Coach picks eerst, dan alfabetisch
  const sortedIngredients = useMemo(() => {
    return [...filteredIngredients].sort((a, b) => {
      const aIsCoachPick = coachPicks.some(cp => cp.id === a.id)
      const bIsCoachPick = coachPicks.some(cp => cp.id === b.id)
      
      if (aIsCoachPick && !bIsCoachPick) return -1
      if (!aIsCoachPick && bIsCoachPick) return 1
      
      return (a.name || '').localeCompare(b.name || '')
    })
  }, [filteredIngredients, coachPicks])
  
  // Handle selection
  const handleSelect = (ingredientId) => {
    const isSelected = selected.includes(ingredientId)
    
    if (isSelected) {
      // Deselect
      onSelect(selected.filter(id => id !== ingredientId))
    } else {
      // Select (max 3)
      if (selected.length < maxSelect) {
        onSelect([...selected, ingredientId])
      }
    }
  }
  
  // Check if ingredient is coach pick
  const isCoachPick = (ingredientId) => {
    return coachPicks.some(cp => cp.id === ingredientId)
  }
  
  return (
    <div style={{
      width: '100%'
    }}>
      {/* Search Bar */}
      <div style={{
        position: 'relative',
        marginBottom: isMobile ? '1.25rem' : '1.5rem'
      }}>
        <div style={{
          position: 'absolute',
          left: isMobile ? '1rem' : '1.25rem',
          top: '50%',
          transform: 'translateY(-50%)',
          color: 'rgba(255, 255, 255, 0.4)',
          pointerEvents: 'none',
          zIndex: 1
        }}>
          <Search size={isMobile ? 18 : 20} />
        </div>
        
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={`Zoek ${category === 'protein' ? 'eiwitbron' : 'koolhydraat'}...`}
          style={{
            width: '100%',
            padding: isMobile ? '0.875rem 3rem 0.875rem 3rem' : '1rem 3.5rem 1rem 3.5rem',
            background: 'rgba(17, 17, 17, 0.6)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: isMobile ? '12px' : '14px',
            color: '#fff',
            fontSize: isMobile ? '0.9rem' : '1rem',
            fontWeight: '500',
            transition: 'all 0.3s ease',
            outline: 'none',
            
            // Touch optimization
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent'
          }}
          onFocus={(e) => {
            e.currentTarget.style.border = '1px solid #10b981'
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)'
          }}
          onBlur={(e) => {
            e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.1)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        />
        
        {/* Clear button */}
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            style={{
              position: 'absolute',
              right: isMobile ? '1rem' : '1.25rem',
              top: '50%',
              transform: 'translateY(-50%)',
              width: isMobile ? '24px' : '28px',
              height: isMobile ? '24px' : '28px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'rgba(255, 255, 255, 0.6)',
              transition: 'all 0.3s ease',
              
              // Touch optimization
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
            onMouseEnter={(e) => {
              if (!isMobile) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
                e.currentTarget.style.color = '#fff'
              }
            }}
            onMouseLeave={(e) => {
              if (!isMobile) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)'
              }
            }}
          >
            <X size={isMobile ? 14 : 16} />
          </button>
        )}
      </div>
      
      {/* Selection Counter */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: isMobile ? '1rem' : '1.25rem',
        padding: isMobile ? '0.75rem 1rem' : '1rem 1.25rem',
        background: selected.length === maxSelect
          ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%)'
          : 'rgba(17, 17, 17, 0.4)',
        border: selected.length === maxSelect
          ? '1px solid rgba(16, 185, 129, 0.3)'
          : '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: isMobile ? '10px' : '12px'
      }}>
        <span style={{
          fontSize: isMobile ? '0.85rem' : '0.9rem',
          color: 'rgba(255, 255, 255, 0.7)',
          fontWeight: '600'
        }}>
          Geselecteerd
        </span>
        <span style={{
          fontSize: isMobile ? '0.95rem' : '1.05rem',
          fontWeight: '700',
          color: selected.length === maxSelect ? '#10b981' : '#fff'
        }}>
          {selected.length} / {maxSelect}
        </span>
      </div>
      
      {/* Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
        gap: isMobile ? '0.875rem' : '1rem'
      }}>
        {sortedIngredients.map(ingredient => (
          <IngredientCard
            key={ingredient.id}
            ingredient={ingredient}
            isSelected={selected.includes(ingredient.id)}
            isCoachPick={isCoachPick(ingredient.id)}
            onClick={() => handleSelect(ingredient.id)}
            disabled={!selected.includes(ingredient.id) && selected.length >= maxSelect}
          />
        ))}
      </div>
      
      {/* Empty state */}
      {sortedIngredients.length === 0 && (
        <div style={{
          padding: isMobile ? '2rem 1rem' : '3rem 2rem',
          textAlign: 'center',
          background: 'rgba(17, 17, 17, 0.4)',
          borderRadius: isMobile ? '14px' : '16px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{
            fontSize: isMobile ? '2.5rem' : '3rem',
            marginBottom: '1rem'
          }}>
            🔍
          </div>
          <h3 style={{
            fontSize: isMobile ? '1rem' : '1.1rem',
            fontWeight: '700',
            color: '#fff',
            margin: '0 0 0.5rem 0'
          }}>
            Geen resultaten
          </h3>
          <p style={{
            fontSize: isMobile ? '0.85rem' : '0.9rem',
            color: 'rgba(255, 255, 255, 0.6)',
            margin: 0
          }}>
            Probeer een andere zoekterm
          </p>
        </div>
      )}
      
      {/* Helper text */}
      {selected.length === 0 && sortedIngredients.length > 0 && (
        <div style={{
          marginTop: isMobile ? '1rem' : '1.25rem',
          padding: isMobile ? '0.75rem 1rem' : '1rem 1.25rem',
          background: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          borderRadius: isMobile ? '10px' : '12px',
          fontSize: isMobile ? '0.8rem' : '0.85rem',
          color: 'rgba(255, 255, 255, 0.7)',
          lineHeight: '1.5',
          textAlign: 'center'
        }}>
          💡 <strong>Tip:</strong> Selecteer {maxSelect} ingrediënten die je dagelijks wilt eten. 
          Items met <span style={{ color: '#10b981', fontWeight: '700' }}>⭐ Coach</span> badge zijn mijn persoonlijke aanbevelingen!
        </div>
      )}
    </div>
  )
}
