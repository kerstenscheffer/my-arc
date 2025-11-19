// src/modules/meal-plan/components/wizard/slides/Slide3MealStructure.jsx
// UPGRADED: All emojis removed, Lucide icons with glow, consistent styling

import { useState, useEffect } from 'react'
import { Utensils, Coffee, ChefHat, Check } from 'lucide-react'
import CoachBubble from '../shared/CoachBubble'
import { MEAL_STRUCTURE_OPTIONS } from '../utils/wizardData'

export default function Slide3MealStructure({ 
  wizardData,
  onUpdate,
  isMobile
}) {
  const [isPlaying, setIsPlaying] = useState(false)
  const selectedStructure = wizardData.mealStructure
  const targetCalories = wizardData.targetCalories || 2500
  const videoId = '0tEFK-2KzpA'
  
  // Icon mapping per structure type
  const iconMap = {
    'cut': Utensils,
    'maintain': Coffee,
    'bulk': ChefHat
  }
  
  const getSuggestedStructure = () => {
    if (targetCalories < 2000) return 'cut'
    if (targetCalories < 2500) return 'maintain'
    return 'bulk'
  }
  
  const suggestedId = getSuggestedStructure()
  
  useEffect(() => {
    if (!selectedStructure) {
      const suggested = MEAL_STRUCTURE_OPTIONS.find(opt => opt.id === suggestedId)
      if (suggested) {
        onUpdate('mealStructure', suggested)
      }
    }
  }, [])
  
  const handleStructureSelect = (structure) => {
    onUpdate('mealStructure', structure)
  }
  
  return (
    <div style={{
      width: '100%',
      padding: '0'
    }}>
      {/* Header - NO EMOJI */}
      <div style={{
        textAlign: 'center',
        marginBottom: isMobile ? '1.25rem' : '1.5rem',
        padding: isMobile ? '0 0.75rem' : '0 1rem'
      }}>
        <h1 style={{
          fontSize: isMobile ? '1.5rem' : '2rem',
          fontWeight: '900',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          margin: '0 0 0.5rem 0',
          lineHeight: '1.2',
          letterSpacing: '-0.02em'
        }}>
          Jouw Eetstructuur
        </h1>
        
        <p style={{
          fontSize: isMobile ? '0.875rem' : '0.95rem',
          color: 'rgba(255, 255, 255, 0.7)',
          margin: 0,
          fontWeight: '500',
          lineHeight: '1.4'
        }}>
          Hoeveel momenten per dag? Kies wat bij jouw ritme past.
        </p>
      </div>
      
      {/* Video Container - Glassmorphic */}
      <div style={{
        position: 'relative',
        marginBottom: isMobile ? '1.5rem' : '2rem',
        padding: isMobile ? '0 0.5rem' : '0'
      }}>
        <div style={{
          position: 'relative',
          width: '100%',
          paddingBottom: '56.25%',
          borderRadius: isMobile ? '12px' : '16px',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.8) 0%, rgba(23, 23, 23, 0.6) 100%)',
          backdropFilter: 'blur(12px)',
          border: '2px solid rgba(16, 185, 129, 0.3)',
          boxShadow: '0 8px 32px rgba(16, 185, 129, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
        }}>
          {/* Top accent line */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
            opacity: 0.6,
            zIndex: 2
          }} />
          
          {/* Shine overlay */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '40%',
            background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.06) 0%, transparent 100%)',
            pointerEvents: 'none',
            zIndex: 1
          }} />
          
          {!isPlaying ? (
            // Thumbnail + Play Button
            <>
              <img
                src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
                alt="Meal Structure Tutorial"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
                onError={(e) => {
                  e.target.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
                }}
              />
              
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.3)',
                transition: 'background 0.3s ease'
              }} />
              
              <button
                onClick={() => setIsPlaying(true)}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: isMobile ? '70px' : '90px',
                  height: isMobile ? '70px' : '90px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: '3px solid rgba(255, 255, 255, 0.2)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 10px 40px rgba(16, 185, 129, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  zIndex: 3
                }}
                onMouseEnter={(e) => {
                  if (!isMobile) {
                    e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.15)'
                    e.currentTarget.style.boxShadow = '0 15px 50px rgba(16, 185, 129, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isMobile) {
                    e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)'
                    e.currentTarget.style.boxShadow = '0 10px 40px rgba(16, 185, 129, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                  }
                }}
                onTouchStart={(e) => {
                  if (isMobile) {
                    e.currentTarget.style.transform = 'translate(-50%, -50%) scale(0.95)'
                  }
                }}
                onTouchEnd={(e) => {
                  if (isMobile) {
                    e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)'
                  }
                }}
              >
                <div style={{
                  width: 0,
                  height: 0,
                  borderLeft: isMobile ? '24px solid #000' : '30px solid #000',
                  borderTop: isMobile ? '14px solid transparent' : '18px solid transparent',
                  borderBottom: isMobile ? '14px solid transparent' : '18px solid transparent',
                  marginLeft: isMobile ? '6px' : '8px',
                  filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))'
                }} />
              </button>
            </>
          ) : (
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                border: 'none'
              }}
              title="Meal Structure Tutorial"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          )}
        </div>
        
        {/* Coach Bubble - NO EMOJI */}
        <div style={{
          position: 'relative',
          marginTop: isMobile ? '-1.5rem' : '-2rem',
          paddingTop: '0.5rem',
          zIndex: 4
        }}>
          <CoachBubble 
            message={`Bij ${targetCalories} kcal raad ik ${MEAL_STRUCTURE_OPTIONS.find(o => o.id === suggestedId)?.label.toLowerCase()} aan. Kies wat werkt voor jouw dagschema.`}
            variant="default"
          />
        </div>
      </div>
      
      {/* Structure Options - Premium Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: isMobile ? '0.75rem' : '1rem',
        padding: isMobile ? '0 0.5rem' : '0'
      }}>
        {MEAL_STRUCTURE_OPTIONS.map((option) => {
          const isSelected = selectedStructure?.id === option.id
          const isSuggested = option.id === suggestedId
          const OptionIcon = iconMap[option.id]
          
          return (
            <button
              key={option.id}
              onClick={() => handleStructureSelect(option)}
              style={{
                position: 'relative',
                width: '100%',
                padding: isMobile ? '1rem 1.125rem' : '1.25rem 1.5rem',
                background: isSelected
                  ? `linear-gradient(135deg, rgba(${option.id === 'cut' ? '59, 130, 246' : option.id === 'maintain' ? '16, 185, 129' : '249, 115, 22'}, 0.15) 0%, rgba(${option.id === 'cut' ? '59, 130, 246' : option.id === 'maintain' ? '16, 185, 129' : '249, 115, 22'}, 0.08) 100%)`
                  : 'linear-gradient(135deg, rgba(23, 23, 23, 0.8) 0%, rgba(23, 23, 23, 0.6) 100%)',
                backdropFilter: 'blur(12px)',
                border: isSelected
                  ? `2px solid ${option.color}`
                  : '1px solid rgba(16, 185, 129, 0.2)',
                borderRadius: isMobile ? '12px' : '14px',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                textAlign: 'left',
                boxShadow: isSelected
                  ? `0 12px 32px ${option.color}30, inset 0 1px 0 rgba(255, 255, 255, 0.05)`
                  : '0 4px 12px rgba(16, 185, 129, 0.1)',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                minHeight: '44px',
                transform: isSelected ? 'translateY(-4px)' : 'translateZ(0)',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                if (!isMobile && !isSelected) {
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(16, 185, 129, 0.2)'
                  e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.3)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isMobile && !isSelected) {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.1)'
                  e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.2)'
                }
              }}
              onTouchStart={(e) => {
                if (isMobile) {
                  e.currentTarget.style.transform = 'scale(0.98)'
                }
              }}
              onTouchEnd={(e) => {
                if (isMobile) {
                  e.currentTarget.style.transform = isSelected ? 'translateY(-4px)' : 'scale(1)'
                }
              }}
            >
              {/* Top accent line */}
              {isSelected && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '2px',
                  background: `linear-gradient(90deg, ${option.color} 0%, ${option.color}80 100%)`,
                  opacity: 0.8
                }} />
              )}
              
              {/* Shine overlay */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '40%',
                background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.06) 0%, transparent 100%)',
                pointerEvents: 'none'
              }} />
              
              {/* Suggested Badge - NO EMOJI */}
              {isSuggested && (
                <div style={{
                  position: 'absolute',
                  top: isMobile ? '12px' : '14px',
                  right: isMobile ? '12px' : '14px',
                  padding: '0.4rem 0.75rem',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  borderRadius: '8px',
                  fontSize: isMobile ? '0.65rem' : '0.7rem',
                  fontWeight: '800',
                  color: '#fff',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
                  zIndex: 2
                }}>
                  AANBEVOLEN
                </div>
              )}
              
              {/* Selected Checkmark */}
              {isSelected && (
                <div style={{
                  position: 'absolute',
                  top: isMobile ? '12px' : '14px',
                  left: isMobile ? '12px' : '14px',
                  width: isMobile ? '32px' : '36px',
                  height: isMobile ? '32px' : '36px',
                  borderRadius: '50%',
                  background: option.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 4px 16px ${option.color}60`,
                  animation: 'check-bounce 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                  zIndex: 2
                }}>
                  <Check size={isMobile ? 18 : 20} color="#fff" strokeWidth={3} />
                </div>
              )}
              
              {/* Content */}
              <div style={{
                marginTop: (isSuggested || isSelected) ? (isMobile ? '2rem' : '2.5rem') : 0,
                position: 'relative',
                zIndex: 1
              }}>
                {/* Icon + Label */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: isMobile ? '0.75rem' : '1rem',
                  marginBottom: isMobile ? '0.75rem' : '1rem'
                }}>
                  {/* Icon container with glow */}
                  <div style={{
                    width: isMobile ? '44px' : '50px',
                    height: isMobile ? '44px' : '50px',
                    borderRadius: '10px',
                    background: `${option.color}20`,
                    border: `1px solid ${option.color}40`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 0 16px ${option.color}40`,
                    flexShrink: 0
                  }}>
                    <OptionIcon 
                      size={isMobile ? 22 : 26} 
                      color={option.color}
                      strokeWidth={2.5}
                      style={{ filter: `drop-shadow(0 0 6px ${option.color}80)` }}
                    />
                  </div>
                  
                  <div>
                    <h3 style={{
                      fontSize: isMobile ? '1.125rem' : '1.25rem',
                      fontWeight: '800',
                      color: isSelected ? option.color : '#fff',
                      margin: '0 0 0.25rem 0',
                      transition: 'color 0.3s ease',
                      letterSpacing: '-0.01em'
                    }}>
                      {option.label}
                    </h3>
                    <p style={{
                      fontSize: isMobile ? '0.8rem' : '0.875rem',
                      color: 'rgba(255, 255, 255, 0.7)',
                      margin: 0,
                      fontWeight: '500'
                    }}>
                      {option.subtitle}
                    </p>
                  </div>
                </div>
                
                {/* Stats Grid - Glassmorphic */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: isMobile ? '0.625rem' : '0.75rem',
                  padding: isMobile ? '0.875rem' : '1rem',
                  background: 'rgba(0, 0, 0, 0.4)',
                  backdropFilter: 'blur(8px)',
                  borderRadius: isMobile ? '10px' : '12px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {/* Inner shine */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '50%',
                    background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.04) 0%, transparent 100%)',
                    pointerEvents: 'none'
                  }} />
                  
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{
                      fontSize: isMobile ? '0.65rem' : '0.7rem',
                      color: 'rgba(255, 255, 255, 0.5)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: '0.375rem',
                      fontWeight: '700'
                    }}>
                      Maaltijden
                    </div>
                    <div style={{
                      fontSize: isMobile ? '1.375rem' : '1.5rem',
                      fontWeight: '800',
                      color: option.color,
                      letterSpacing: '-0.02em'
                    }}>
                      {option.meals}
                    </div>
                  </div>
                  
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{
                      fontSize: isMobile ? '0.65rem' : '0.7rem',
                      color: 'rgba(255, 255, 255, 0.5)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: '0.375rem',
                      fontWeight: '700'
                    }}>
                      Snacks
                    </div>
                    <div style={{
                      fontSize: isMobile ? '1.375rem' : '1.5rem',
                      fontWeight: '800',
                      color: '#fff',
                      letterSpacing: '-0.02em'
                    }}>
                      {option.snacks}
                    </div>
                  </div>
                  
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{
                      fontSize: isMobile ? '0.65rem' : '0.7rem',
                      color: 'rgba(255, 255, 255, 0.5)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: '0.375rem',
                      fontWeight: '700'
                    }}>
                      Cal. Range
                    </div>
                    <div style={{
                      fontSize: isMobile ? '0.75rem' : '0.8rem',
                      fontWeight: '700',
                      color: 'rgba(255, 255, 255, 0.9)'
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
      
      <style>{`
        @keyframes check-bounce {
          0% {
            transform: scale(0) rotate(-45deg);
            opacity: 0;
          }
          50% {
            transform: scale(1.2) rotate(10deg);
          }
          100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}
