// src/modules/client-meal-base/components/DayTemplateBuilder.jsx
import { useState, useEffect } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'

export default function DayTemplateBuilder({ 
  isOpen, 
  onClose, 
  onSave,
  customMeals,
  editingTemplate,
  isMobile 
}) {
  const [name, setName] = useState('')
  const [selectedMeals, setSelectedMeals] = useState({
    breakfast: null,
    lunch: null,
    dinner: null,
    snacks: []
  })
  
  useEffect(() => {
    if (editingTemplate) {
      setName(editingTemplate.name)
      setSelectedMeals(editingTemplate.meals)
    } else {
      setName('')
      setSelectedMeals({
        breakfast: null,
        lunch: null,
        dinner: null,
        snacks: []
      })
    }
  }, [editingTemplate, isOpen])
  
  if (!isOpen) return null
  
  const handleSelectMeal = (slot, meal) => {
    if (slot === 'snacks') {
      setSelectedMeals(prev => ({
        ...prev,
        snacks: [...prev.snacks, meal]
      }))
    } else {
      setSelectedMeals(prev => ({
        ...prev,
        [slot]: meal
      }))
    }
  }
  
  const handleRemoveMeal = (slot, index = null) => {
    if (slot === 'snacks' && index !== null) {
      setSelectedMeals(prev => ({
        ...prev,
        snacks: prev.snacks.filter((_, i) => i !== index)
      }))
    } else {
      setSelectedMeals(prev => ({
        ...prev,
        [slot]: null
      }))
    }
  }
  
  const handleSave = () => {
    if (!name.trim()) {
      alert('Geef je template een naam')
      return
    }
    
    if (!selectedMeals.breakfast && !selectedMeals.lunch && !selectedMeals.dinner) {
      alert('Voeg minimaal 1 hoofdmaaltijd toe')
      return
    }
    
    onSave({
      name: name.trim(),
      meals: selectedMeals
    })
  }
  
  const MealSlot = ({ label, emoji, slot, meal }) => (
    <div style={{
      marginBottom: '1rem'
    }}>
      <div style={{
        fontSize: isMobile ? '0.875rem' : '0.95rem',
        fontWeight: '600',
        color: 'rgba(255, 255, 255, 0.8)',
        marginBottom: '0.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <span>{emoji}</span>
        {label}
      </div>
      
      {meal ? (
        <div style={{
          padding: isMobile ? '0.75rem' : '1rem',
          background: 'rgba(139, 92, 246, 0.1)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          borderRadius: '10px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{
              fontSize: isMobile ? '0.9rem' : '1rem',
              fontWeight: '600',
              color: '#fff',
              marginBottom: '0.25rem'
            }}>
              {meal.name}
            </div>
            <div style={{
              fontSize: isMobile ? '0.75rem' : '0.8rem',
              color: 'rgba(255, 255, 255, 0.6)'
            }}>
              {meal.calories} kcal • {Math.round(meal.protein)}g P
            </div>
          </div>
          
          <button
            onClick={() => handleRemoveMeal(slot)}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            <X size={16} color="#ef4444" />
          </button>
        </div>
      ) : (
        <select
          onChange={(e) => {
            const meal = customMeals.find(m => m.id === e.target.value)
            if (meal) handleSelectMeal(slot, meal)
          }}
          style={{
            width: '100%',
            padding: isMobile ? '0.75rem' : '0.875rem',
            background: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '10px',
            color: '#fff',
            fontSize: isMobile ? '0.875rem' : '0.95rem',
            cursor: 'pointer'
          }}
        >
          <option value="">Selecteer meal...</option>
          {customMeals.map(meal => (
            <option key={meal.id} value={meal.id}>
              {meal.name} ({meal.calories} kcal)
            </option>
          ))}
        </select>
      )}
    </div>
  )
  
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
      overflowY: 'auto'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '600px',
        maxHeight: '90vh',
        background: 'linear-gradient(180deg, #1a1a1a 0%, #0f0f0f 100%)',
        borderRadius: '20px',
        border: '1px solid rgba(139, 92, 246, 0.3)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: isMobile ? '1.25rem' : '1.5rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <h2 style={{
            fontSize: isMobile ? '1.125rem' : '1.25rem',
            fontWeight: '700',
            color: '#fff',
            margin: 0
          }}>
            {editingTemplate ? 'Template Bewerken' : 'Nieuwe Day Template'}
          </h2>
          
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
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            <X size={20} color="#fff" />
          </button>
        </div>
        
        {/* Content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: isMobile ? '1.25rem' : '1.5rem'
        }}>
          {/* Name input */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontSize: isMobile ? '0.875rem' : '0.95rem',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.8)',
              marginBottom: '0.5rem'
            }}>
              Template Naam
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="bijv. Zaterdag, Werkdag, Cheatday"
              style={{
                width: '100%',
                padding: isMobile ? '0.75rem' : '0.875rem',
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                color: '#fff',
                fontSize: isMobile ? '0.875rem' : '0.95rem',
                outline: 'none'
              }}
            />
          </div>
          
          {/* Meal slots */}
          <MealSlot 
            label="Ontbijt" 
            emoji="🍳" 
            slot="breakfast" 
            meal={selectedMeals.breakfast} 
          />
          
          <MealSlot 
            label="Lunch" 
            emoji="🥗" 
            slot="lunch" 
            meal={selectedMeals.lunch} 
          />
          
          <MealSlot 
            label="Diner" 
            emoji="🍽️" 
            slot="dinner" 
            meal={selectedMeals.dinner} 
          />
          
          {/* Snacks */}
          <div style={{ marginBottom: '1rem' }}>
            <div style={{
              fontSize: isMobile ? '0.875rem' : '0.95rem',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.8)',
              marginBottom: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span>🍪</span>
              Snacks ({selectedMeals.snacks.length})
            </div>
            
            {selectedMeals.snacks.map((snack, idx) => (
              <div
                key={idx}
                style={{
                  padding: isMobile ? '0.75rem' : '1rem',
                  background: 'rgba(139, 92, 246, 0.1)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  borderRadius: '10px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.5rem'
                }}
              >
                <div>
                  <div style={{
                    fontSize: isMobile ? '0.9rem' : '1rem',
                    fontWeight: '600',
                    color: '#fff',
                    marginBottom: '0.25rem'
                  }}>
                    {snack.name}
                  </div>
                  <div style={{
                    fontSize: isMobile ? '0.75rem' : '0.8rem',
                    color: 'rgba(255, 255, 255, 0.6)'
                  }}>
                    {snack.calories} kcal • {Math.round(snack.protein)}g P
                  </div>
                </div>
                
                <button
                  onClick={() => handleRemoveMeal('snacks', idx)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'rgba(239, 68, 68, 0.2)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent'
                  }}
                >
                  <Trash2 size={14} color="#ef4444" />
                </button>
              </div>
            ))}
            
            <select
              onChange={(e) => {
                const meal = customMeals.find(m => m.id === e.target.value)
                if (meal) {
                  handleSelectMeal('snacks', meal)
                  e.target.value = ''
                }
              }}
              style={{
                width: '100%',
                padding: isMobile ? '0.75rem' : '0.875rem',
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                color: '#fff',
                fontSize: isMobile ? '0.875rem' : '0.95rem',
                cursor: 'pointer'
              }}
            >
              <option value="">+ Voeg snack toe...</option>
              {customMeals.map(meal => (
                <option key={meal.id} value={meal.id}>
                  {meal.name} ({meal.calories} kcal)
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Footer */}
        <div style={{
          padding: isMobile ? '1.25rem' : '1.5rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          gap: '1rem'
        }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: isMobile ? '0.75rem' : '0.875rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              color: '#fff',
              fontSize: isMobile ? '0.875rem' : '0.95rem',
              fontWeight: '600',
              cursor: 'pointer',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            Annuleer
          </button>
          
          <button
            onClick={handleSave}
            style={{
              flex: 1,
              padding: isMobile ? '0.75rem' : '0.875rem',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              border: 'none',
              borderRadius: '10px',
              color: '#fff',
              fontSize: isMobile ? '0.875rem' : '0.95rem',
              fontWeight: '600',
              cursor: 'pointer',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            {editingTemplate ? 'Update' : 'Opslaan'}
          </button>
        </div>
      </div>
    </div>
  )
}
