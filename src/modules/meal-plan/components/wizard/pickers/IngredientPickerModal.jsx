// src/modules/meal-plan/components/wizard/pickers/IngredientPickerModal.jsx
import React, { useState, useEffect } from 'react'
import { X, Search, Check } from 'lucide-react'

export default function IngredientPickerModal({
  isOpen,
  onClose,
  onSelect,
  category,
  suggestions = [],
  db,
  isMobile
}) {
  const [ingredients, setIngredients] = useState([])
  const [filteredIngredients, setFilteredIngredients] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedIngredient, setSelectedIngredient] = useState(null)

  useEffect(() => {
    if (isOpen) {
      loadIngredients()
    }
  }, [isOpen, category])

  useEffect(() => {
    filterIngredients()
  }, [searchTerm, ingredients])

  const loadIngredients = async () => {
    try {
      setLoading(true)
      const data = await db.getIngredientsByCategory(category)
      setIngredients(data)
      setFilteredIngredients(data)
    } catch (error) {
      console.error('Failed to load ingredients:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterIngredients = () => {
    if (!searchTerm.trim()) {
      setFilteredIngredients(ingredients)
      return
    }

    const term = searchTerm.toLowerCase()
    const filtered = ingredients.filter(ing =>
      ing.name.toLowerCase().includes(term)
    )
    setFilteredIngredients(filtered)
  }

  const handleSelect = (ingredient) => {
    setSelectedIngredient(ingredient)
  }

  const handleConfirm = () => {
    if (selectedIngredient) {
      onSelect(selectedIngredient)
      onClose()
      setSelectedIngredient(null)
      setSearchTerm('')
    }
  }

  if (!isOpen) return null

  const categoryColors = {
    protein: {
      primary: '#ef4444',
      gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      light: 'rgba(239, 68, 68, 0.1)',
      border: 'rgba(239, 68, 68, 0.3)'
    },
    carbs: {
      primary: '#f59e0b',
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      light: 'rgba(245, 158, 11, 0.1)',
      border: 'rgba(245, 158, 11, 0.3)'
    }
  }

  const colors = categoryColors[category] || categoryColors.protein

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 10000
        }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: isMobile ? '90%' : '600px',
        maxHeight: isMobile ? '90vh' : '80vh',
        background: 'linear-gradient(135deg, rgba(17, 17, 17, 0.98) 0%, rgba(10, 10, 10, 0.98) 100%)',
        backdropFilter: 'blur(20px)',
        borderRadius: isMobile ? '20px' : '24px',
        border: `1px solid ${colors.border}`,
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)',
        zIndex: 10001,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: isMobile ? '1.25rem' : '1.5rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h3 style={{
              fontSize: isMobile ? '1.25rem' : '1.5rem',
              fontWeight: '700',
              color: '#fff',
              margin: 0
            }}>
              Kies {category === 'protein' ? 'Eiwitbron' : 'Koolhydraat'}
            </h3>
          </div>

          <button
            onClick={onClose}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#fff'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div style={{
            padding: isMobile ? '1rem' : '1.5rem',
            paddingBottom: '1rem',
            background: colors.light,
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
          }}>
            <div style={{
              fontSize: '0.875rem',
              fontWeight: '600',
              color: colors.primary,
              marginBottom: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              💡 Kersten's Suggesties
            </div>
            <div style={{
              display: 'flex',
              gap: '0.5rem',
              flexWrap: 'wrap'
            }}>
              {suggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    const ingredient = ingredients.find(
                      ing => ing.name.toLowerCase() === suggestion.toLowerCase()
                    )
                    if (ingredient) {
                      handleSelect(ingredient)
                    }
                  }}
                  style={{
                    padding: '0.5rem 1rem',
                    background: colors.gradient,
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'transform 0.2s ease',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search */}
        <div style={{
          padding: isMobile ? '1rem' : '1.5rem',
          paddingBottom: '1rem'
        }}>
          <div style={{
            position: 'relative'
          }}>
            <Search
              size={18}
              style={{
                position: 'absolute',
                left: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'rgba(255, 255, 255, 0.4)'
              }}
            />
            <input
              type="text"
              placeholder="Zoek ingredient..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
              style={{
                width: '100%',
                padding: '0.875rem 1rem 0.875rem 2.75rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                color: '#fff',
                fontSize: '0.95rem',
                outline: 'none',
                transition: 'all 0.2s ease'
              }}
            />
          </div>
        </div>

        {/* Ingredients List */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: isMobile ? '0 1rem 1rem' : '0 1.5rem 1.5rem'
        }}>
          {loading ? (
            <div style={{
              textAlign: 'center',
              padding: '2rem',
              color: 'rgba(255, 255, 255, 0.5)'
            }}>
              Loading...
            </div>
          ) : filteredIngredients.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '2rem',
              color: 'rgba(255, 255, 255, 0.5)'
            }}>
              Geen ingrediënten gevonden
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gap: '0.5rem'
            }}>
              {filteredIngredients.map(ingredient => (
                <button
                  key={ingredient.id}
                  onClick={() => handleSelect(ingredient)}
                  style={{
                    padding: '1rem',
                    background: selectedIngredient?.id === ingredient.id
                      ? colors.light
                      : 'rgba(255, 255, 255, 0.03)',
                    border: selectedIngredient?.id === ingredient.id
                      ? `2px solid ${colors.primary}`
                      : '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: '#fff',
                      marginBottom: '0.25rem'
                    }}>
                      {ingredient.name}
                    </div>
                    <div style={{
                      fontSize: '0.8rem',
                      color: 'rgba(255, 255, 255, 0.5)'
                    }}>
                      {ingredient.calories_per_100g}kcal •
                      {ingredient.protein_per_100g}g P •
                      {ingredient.carbs_per_100g}g C •
                      {ingredient.fat_per_100g}g F
                    </div>
                  </div>

                  {selectedIngredient?.id === ingredient.id && (
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: colors.gradient,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Check size={16} color="#fff" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: isMobile ? '1rem' : '1.5rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          gap: '1rem'
        }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '0.875rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              color: '#fff',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Annuleer
          </button>

          <button
            onClick={handleConfirm}
            disabled={!selectedIngredient}
            style={{
              flex: 2,
              padding: '0.875rem',
              background: selectedIngredient
                ? colors.gradient
                : 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '12px',
              color: '#fff',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: selectedIngredient ? 'pointer' : 'not-allowed',
              opacity: selectedIngredient ? 1 : 0.5
            }}
          >
            Selecteer
          </button>
        </div>
      </div>
    </>
  )
}
