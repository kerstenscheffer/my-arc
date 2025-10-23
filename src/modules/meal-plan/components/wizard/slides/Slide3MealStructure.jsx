// src/modules/meal-plan/components/wizard/slides/Slide3MealStructure.jsx
// Slide 3: Dagelijkse Maaltijd Structuur Kiezer

import { useState, useEffect } from 'react'
import CoachBubble from '../shared/CoachBubble'
import { MEAL_STRUCTURE_OPTIONS } from '../utils/wizardData'
import { Check } from 'lucide-react'

export default function Slide3MealStructure({ 
  client, 
  selectedStructure, 
  onStructureSelect 
}) {
  const isMobile = window.innerWidth <= 768
  
  // Extract client data
  const targetCalories = client?.target_calories || 2200
  
  // Determine suggested structure based on calories
  const getSuggestedStructure = () => {
    if (targetCalories < 2000) return 'cut'
    if (targetCalories < 2500) return 'maintain'
    return 'bulk'
  }
  
  const suggestedId = getSuggestedStructure()
  
  // Auto-select suggested on mount if nothing selected
  useEffect(() => {
    if (!selectedStructure) {
      const suggested = MEAL_STRUCTURE_OPTIONS.find(opt => opt.id === suggestedId)
      if (suggested) {
        onStructureSelect(suggested)
      }
    }
  }, [])
  
  return (
    <div style={{
      width: '100%',
      padding: isMobile ? '1rem 0' : '1.5rem 0'
    }}>
      {/* Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: isMobile ? '1.5rem' : '2rem'
      }}>
        <div style={{
          fontSize: isMobile ? '2.5rem' : '3rem',
          marginBottom: isMobile ? '0.75rem' : '1rem'
        }}>
          📅
        </div>
        
        <h1 style={{
          fontSize: isMobile ? '1.5rem' : '2rem',
          fontWeight: '900',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          margin: '0 0 0.5rem 0',
          letterSpacing: '-0.02em'
        }}>
          Dagelijkse Structuur
        </h1>
        
        <p style={{
          fontSize: isMobile ? '0.9rem' : '1rem',
          color: 'rgba(255, 255, 255, 0.7)',
          margin: 0,
          fontWeight: '500'
        }}>
          Hoeveel eet-momenten wil je per dag?
        </p>
      </div>
      
      {/* Coach Message */}
      <CoachBubble 
        message={`Bij ${targetCalories} calorieën raad ik aan om ${MEAL_STRUCTURE_OPTIONS.find(o => o.id === suggestedId)?.label.toLowerCase()} te hebben. Dit zorgt voor een goede verdeling over de dag en voorkomt dat je te hongerig wordt tussen maaltijden. Natuurlijk kun je ook een andere structuur kiezen die beter bij jouw dagschema past!`}
        variant="default"
      />
      
      {/* Structure Options */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: isMobile ? '1rem' : '1.25rem',
        marginBottom: isMobile ? '1.5rem' : '2rem'
      }}>
        {MEAL_STRUCTURE_OPTIONS.map((option) => {
          const isSelected = selectedStructure?.id === option.id
          const isSuggested = option.id === suggestedId
          
          return (
            <button
              key={option.id}
              onClick={() => onStructureSelect(option)}
              style={{
                position: 'relative',
                width: '100%',
                padding: isMobile ? '1.5rem' : '2rem',
                background: isSelected
                  ? `linear-gradient(135deg, ${option.color}20 0%, ${option.color}10 100%)`
                  : 'rgba(17, 17, 17, 0.6)',
                backdropFilter: 'blur(20px)',
                border: isSelected
                  ? `2px solid ${option.color}`
                  : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: isMobile ? '16px' : '20px',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                textAlign: 'left',
                boxShadow: isSelected
                  ? `0 12px 30px ${option.color}30`
                  : '0 4px 12px rgba(0, 0, 0, 0.3)',
                
                // Touch optimization
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                minHeight: '44px',
                
                // Hardware acceleration
                transform: isSelected ? 'translateY(-4px) scale(1.02)' : 'translateZ(0)'
              }}
              onMouseEnter={(e) => {
                if (!isMobile && !isSelected) {
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.4)'
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isMobile && !isSelected) {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)'
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                }
              }}
              onTouchStart={(e) => {
                if (isMobile) {
                  e.currentTarget.style.transform = 'scale(0.98)'
                }
              }}
              onTouchEnd={(e) => {
                if (isMobile) {
                  e.currentTarget.style.transform = isSelected 
                    ? 'translateY(-4px) scale(1.02)' 
                    : 'scale(1)'
                }
              }}
            >
              {/* Suggested Badge */}
              {isSuggested && (
                <div style={{
                  position: 'absolute',
                  top: isMobile ? '12px' : '16px',
                  right: isMobile ? '12px' : '16px',
                  padding: '0.375rem 0.75rem',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  borderRadius: '8px',
                  fontSize: isMobile ? '0.7rem' : '0.75rem',
                  fontWeight: '700',
                  color: '#fff',
                  textTransform: 'uppercase',
                  letterSpacing: '0.03em',
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)'
                }}>
                  ⭐ Aanbevolen
                </div>
              )}
              
              {/* Selected Checkmark */}
              {isSelected && (
                <div style={{
                  position: 'absolute',
                  top: isMobile ? '12px' : '16px',
                  left: isMobile ? '12px' : '16px',
                  width: isMobile ? '32px' : '36px',
                  height: isMobile ? '32px' : '36px',
                  borderRadius: '50%',
                  background: option.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 4px 12px ${option.color}60`,
                  animation: 'check-bounce 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)'
                }}>
                  <Check size={isMobile ? 18 : 20} color="#fff" strokeWidth={3} />
                </div>
              )}
              
              {/* Content */}
              <div style={{
                marginTop: (isSuggested || isSelected) ? (isMobile ? '2.5rem' : '3rem') : 0
              }}>
                {/* Icon + Label */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: isMobile ? '0.75rem' : '1rem',
                  marginBottom: isMobile ? '0.75rem' : '1rem'
                }}>
                  <div style={{
                    fontSize: isMobile ? '2rem' : '2.5rem'
                  }}>
                    {option.icon}
                  </div>
                  <div>
                    <h3 style={{
                      fontSize: isMobile ? '1.1rem' : '1.3rem',
                      fontWeight: '800',
                      color: isSelected ? option.color : '#fff',
                      margin: '0 0 0.25rem 0',
                      transition: 'color 0.3s ease'
                    }}>
                      {option.label}
                    </h3>
                    <p style={{
                      fontSize: isMobile ? '0.8rem' : '0.85rem',
                      color: 'rgba(255, 255, 255, 0.6)',
                      margin: 0,
                      fontWeight: '500'
                    }}>
                      {option.subtitle}
                    </p>
                  </div>
                </div>
                
                {/* Stats Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: isMobile ? '0.75rem' : '1rem',
                  padding: isMobile ? '1rem' : '1.25rem',
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: isMobile ? '10px' : '12px',
                  border: '1px solid rgba(255, 255, 255, 0.05)'
                }}>
                  <div>
                    <div style={{
                      fontSize: isMobile ? '0.65rem' : '0.7rem',
                      color: 'rgba(255, 255, 255, 0.4)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.03em',
                      marginBottom: '0.25rem',
                      fontWeight: '600'
                    }}>
                      Maaltijden
                    </div>
                    <div style={{
                      fontSize: isMobile ? '1.25rem' : '1.5rem',
                      fontWeight: '800',
                      color: option.color
                    }}>
                      {option.meals}
                    </div>
                  </div>
                  
                  <div>
                    <div style={{
                      fontSize: isMobile ? '0.65rem' : '0.7rem',
                      color: 'rgba(255, 255, 255, 0.4)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.03em',
                      marginBottom: '0.25rem',
                      fontWeight: '600'
                    }}>
                      Snacks
                    </div>
                    <div style={{
                      fontSize: isMobile ? '1.25rem' : '1.5rem',
                      fontWeight: '800',
                      color: '#fff'
                    }}>
                      {option.snacks}
                    </div>
                  </div>
                  
                  <div>
                    <div style={{
                      fontSize: isMobile ? '0.65rem' : '0.7rem',
                      color: 'rgba(255, 255, 255, 0.4)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.03em',
                      marginBottom: '0.25rem',
                      fontWeight: '600'
                    }}>
                      Calorie Range
                    </div>
                    <div style={{
                      fontSize: isMobile ? '0.75rem' : '0.85rem',
                      fontWeight: '700',
                      color: 'rgba(255, 255, 255, 0.8)'
                    }}>
                      {option.calorieRange}
                    </div>
                  </div>
                </div>
              </div>
            </button>
          )
        })}
      </div>
      
      {/* Info Box */}
      <div style={{
        padding: isMobile ? '1rem' : '1.25rem',
        background: 'rgba(59, 130, 246, 0.1)',
        border: '1px solid rgba(59, 130, 246, 0.2)',
        borderRadius: isMobile ? '12px' : '14px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: isMobile ? '0.75rem' : '1rem'
      }}>
        <div style={{
          fontSize: isMobile ? '1.25rem' : '1.5rem',
          flexShrink: 0
        }}>
          💡
        </div>
        <p style={{
          fontSize: isMobile ? '0.8rem' : '0.85rem',
          color: 'rgba(255, 255, 255, 0.7)',
          margin: 0,
          lineHeight: '1.5'
        }}>
          <strong style={{ color: '#3b82f6' }}>Let op:</strong> Meer maaltijden betekent niet automatisch betere resultaten. 
          Kies wat bij jouw dagschema en eetpatroon past!
        </p>
      </div>
      
      <style>{`
        @keyframes check-bounce {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}
