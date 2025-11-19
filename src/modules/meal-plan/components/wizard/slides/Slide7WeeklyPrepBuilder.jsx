// src/modules/meal-plan/components/wizard/slides/Slide7WeeklyPrepBuilder.jsx
// ULTRA NEW - Step-by-step meal prep builder with modal selection flow

import { useState } from 'react'
import { Plus, ChefHat, Info, X, Check } from 'lucide-react'
import CoachBubble from '../shared/CoachBubble'

export default function Slide7WeeklyPrepBuilder({
  wizardData,
  onUpdate,
  allMeals = [],
  weekPlanMeals = [],
  isMobile,
  db
}) {
  const [showMealModal, setShowMealModal] = useState(false)
  const [editingSlot, setEditingSlot] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showInfoModal, setShowInfoModal] = useState(null)
  const videoId = 'WEEKLY_PREP_VIDEO_ID'
  
  // Use weeklyPrep from wizardData (matches wizard validation)
  const weeklyPrep = wizardData.weeklyPrep || {
    cookDay: null,
    portions: 7,
    selectedMeals: []
  }
  
  const weeklyPreps = wizardData.weeklyPreps || []
  
  // Sync with old format for wizard validation
  const syncWithWizard = () => {
    const mealIds = weeklyPreps.map(prep => prep.mealId)
    onUpdate('weeklyPrep', {
      cookDay: 'sunday', // Default value to satisfy validation
      portions: weeklyPreps[0]?.portions || 7,
      selectedMeals: mealIds
    })
  }
  
  const days = [
    { id: 'sunday', label: 'Zo', full: 'Zondag' },
    { id: 'monday', label: 'Ma', full: 'Maandag' },
    { id: 'tuesday', label: 'Di', full: 'Dinsdag' },
    { id: 'wednesday', label: 'Wo', full: 'Woensdag' },
    { id: 'thursday', label: 'Do', full: 'Donderdag' },
    { id: 'friday', label: 'Fr', full: 'Vrijdag' },
    { id: 'saturday', label: 'Za', full: 'Zaterdag' }
  ]
  
  const handleCookDayChange = (dayId) => {
    onUpdate('weeklyPrep', {
      ...weeklyPrep,
      cookDay: dayId
    })
  }
  
  const handleAddPrep = () => {
    const newSlot = weeklyPreps.length
    setEditingSlot(newSlot)
    setShowMealModal(true)
  }
  
  const handleSelectMeal = (meal) => {
    const newPrep = {
      mealId: meal.id,
      mealName: meal.name,
      mealImage: meal.image_url || meal.thumbnail_url,
      portions: 7,
      calories: meal.calories_per_serving || 0,
      protein: meal.protein_per_serving || 0,
      carbs: meal.carbs_per_serving || 0,
      fat: meal.fat_per_serving || 0
    }
    
    const newPreps = [...weeklyPreps]
    if (editingSlot !== null && editingSlot < newPreps.length) {
      newPreps[editingSlot] = newPrep
    } else {
      newPreps.push(newPrep)
    }
    
    onUpdate('weeklyPreps', newPreps)
    
    // Sync with wizard format
    const mealIds = newPreps.map(p => p.mealId)
    onUpdate('weeklyPrep', {
      cookDay: 'sunday',
      portions: newPreps[0]?.portions || 7,
      selectedMeals: mealIds
    })
    
    setShowMealModal(false)
    setEditingSlot(null)
    setSearchTerm('')
  }
  
  const handlePortionChange = (index, delta) => {
    const newPreps = [...weeklyPreps]
    const newPortions = Math.max(1, Math.min(21, newPreps[index].portions + delta))
    newPreps[index].portions = newPortions
    onUpdate('weeklyPreps', newPreps)
  }
  
  const handleRemovePrep = (index) => {
    const newPreps = weeklyPreps.filter((_, i) => i !== index)
    onUpdate('weeklyPreps', newPreps)
    
    // Sync with wizard format
    const mealIds = newPreps.map(p => p.mealId)
    onUpdate('weeklyPrep', {
      cookDay: newPreps.length > 0 ? 'sunday' : null,
      portions: newPreps[0]?.portions || 7,
      selectedMeals: mealIds
    })
  }
  
  const totalPortions = weeklyPreps.reduce((sum, prep) => sum + prep.portions, 0)
  
  // Validation for wizard navigation
  const isValid = weeklyPreps.length >= 1
  
  const filteredMeals = allMeals.filter(meal => 
    meal.name.toLowerCase().includes(searchTerm.toLowerCase())
  )
  
  return (
    <div style={{
      width: '100%',
      padding: '0'
    }}>
      {/* Header - COMPACT */}
      <div style={{
        textAlign: 'center',
        marginBottom: isMobile ? '1rem' : '1.25rem',
        padding: isMobile ? '0 0.75rem' : '0 1rem'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: isMobile ? '48px' : '56px',
          height: isMobile ? '48px' : '56px',
          borderRadius: '12px',
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          marginBottom: '0.75rem',
          boxShadow: '0 0 16px rgba(16, 185, 129, 0.3)'
        }}>
          <ChefHat 
            size={isMobile ? 24 : 28} 
            color="#10b981"
            strokeWidth={2.5}
            style={{ filter: 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.6))' }}
          />
        </div>
        
        <h1 style={{
          fontSize: isMobile ? '1.375rem' : '1.75rem',
          fontWeight: '900',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          margin: '0 0 0.5rem 0',
          lineHeight: '1.2',
          letterSpacing: '-0.02em'
        }}>
          Jouw Weekly Meal Prep
        </h1>
        
        <p style={{
          fontSize: isMobile ? '0.85rem' : '0.95rem',
          color: 'rgba(255, 255, 255, 0.7)',
          margin: 0,
          fontWeight: '500'
        }}>
          Kook 1x, eet de hele week
        </p>
      </div>

      {/* Video Container - Green Glassmorphic */}
      <div style={{
        position: 'relative',
        marginBottom: isMobile ? '1.25rem' : '1.5rem',
        padding: isMobile ? '0 0.5rem' : '0'
      }}>
        <div style={{
          position: 'relative',
          width: '100%',
          paddingBottom: '56.25%',
          borderRadius: isMobile ? '12px' : '14px',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.8) 0%, rgba(23, 23, 23, 0.6) 100%)',
          backdropFilter: 'blur(12px)',
          border: '2px solid rgba(16, 185, 129, 0.3)',
          boxShadow: '0 6px 24px rgba(16, 185, 129, 0.2)'
        }}>
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
          
          {!isPlaying ? (
            <>
              <img
                src="https://cdn.shopify.com/s/files/1/0862/1237/8954/files/Black_White_Red_Simple_Modern_Elegant_Video_How_To_YouTube_Thumbnail_6.png?v=1760211909"
                alt="Weekly Prep Tutorial"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
              
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.3)'
              }} />
              
              <button
                onClick={() => setIsPlaying(true)}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: isMobile ? '64px' : '80px',
                  height: isMobile ? '64px' : '80px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: '3px solid rgba(255, 255, 255, 0.2)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 32px rgba(16, 185, 129, 0.6)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  zIndex: 3
                }}
                onMouseEnter={(e) => {
                  if (!isMobile) {
                    e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.1)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isMobile) {
                    e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)'
                  }
                }}
              >
                <div style={{
                  width: 0,
                  height: 0,
                  borderLeft: isMobile ? '20px solid #000' : '26px solid #000',
                  borderTop: isMobile ? '12px solid transparent' : '16px solid transparent',
                  borderBottom: isMobile ? '12px solid transparent' : '16px solid transparent',
                  marginLeft: isMobile ? '5px' : '6px'
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
              title="Weekly Prep Tutorial"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          )}
        </div>
        
        <div style={{
          position: 'relative',
          marginTop: isMobile ? '-1.25rem' : '-1.5rem',
          paddingTop: '0.5rem',
          zIndex: 4
        }}>
          <CoachBubble 
            message="Kies welke maaltijden je wilt preppen en hoeveel porties je nodig hebt!"
            variant="default"
          />
        </div>
      </div>

      {/* Selected Preps - COMPACT CARDS */}
      <div style={{
        padding: isMobile ? '0 0.5rem' : '0',
        marginBottom: isMobile ? '1rem' : '1.25rem'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
          gap: isMobile ? '0.75rem' : '0.875rem'
        }}>
          {weeklyPreps.map((prep, index) => (
            <div
              key={index}
              style={{
                position: 'relative',
                background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.8) 0%, rgba(23, 23, 23, 0.6) 100%)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: isMobile ? '10px' : '12px',
                overflow: 'hidden',
                boxShadow: '0 4px 16px rgba(16, 185, 129, 0.15)'
              }}
            >
              {/* Meal Image */}
              {prep.mealImage && (
                <div style={{
                  width: '100%',
                  height: isMobile ? '120px' : '140px',
                  background: `url(${prep.mealImage}) center/cover`,
                  position: 'relative'
                }}>
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.7) 100%)'
                  }} />
                </div>
              )}
              
              {/* Remove Button */}
              <button
                onClick={() => handleRemovePrep(index)}
                style={{
                  position: 'absolute',
                  top: '0.5rem',
                  right: '0.5rem',
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'rgba(239, 68, 68, 0.9)',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  zIndex: 2
                }}
                onMouseEnter={(e) => {
                  if (!isMobile) e.currentTarget.style.background = '#ef4444'
                }}
                onMouseLeave={(e) => {
                  if (!isMobile) e.currentTarget.style.background = 'rgba(239, 68, 68, 0.9)'
                }}
              >
                <X size={16} color="white" strokeWidth={2.5} />
              </button>
              
              {/* Content */}
              <div style={{
                padding: isMobile ? '0.75rem' : '0.875rem'
              }}>
                <h3 style={{
                  fontSize: isMobile ? '0.9rem' : '1rem',
                  fontWeight: '700',
                  color: '#10b981',
                  margin: '0 0 0.625rem 0',
                  lineHeight: '1.3'
                }}>
                  {prep.mealName}
                </h3>
                
                {/* Portion Control */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.625rem',
                  padding: '0.5rem',
                  background: 'rgba(16, 185, 129, 0.1)',
                  borderRadius: '8px',
                  border: '1px solid rgba(16, 185, 129, 0.2)'
                }}>
                  <button
                    onClick={() => handlePortionChange(index, -1)}
                    disabled={prep.portions <= 1}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '6px',
                      background: prep.portions > 1 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      color: prep.portions > 1 ? '#10b981' : 'rgba(255,255,255,0.3)',
                      cursor: prep.portions > 1 ? 'pointer' : 'not-allowed',
                      fontSize: '1.125rem',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent'
                    }}
                  >
                    -
                  </button>
                  
                  <div style={{
                    fontSize: isMobile ? '0.85rem' : '0.9rem',
                    color: '#fff',
                    fontWeight: '600',
                    textAlign: 'center'
                  }}>
                    <span style={{ color: '#10b981', fontSize: isMobile ? '1.125rem' : '1.25rem' }}>{prep.portions}</span> porties
                  </div>
                  
                  <button
                    onClick={() => handlePortionChange(index, 1)}
                    disabled={prep.portions >= 21}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '6px',
                      background: prep.portions < 21 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      color: prep.portions < 21 ? '#10b981' : 'rgba(255,255,255,0.3)',
                      cursor: prep.portions < 21 ? 'pointer' : 'not-allowed',
                      fontSize: '1.125rem',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent'
                    }}
                  >
                    +
                  </button>
                </div>
                
                {/* Quick Info Button */}
                <button
                  onClick={() => setShowInfoModal(prep)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    borderRadius: '6px',
                    color: '#10b981',
                    fontSize: isMobile ? '0.75rem' : '0.8rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.375rem',
                    transition: 'all 0.2s ease',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent'
                  }}
                  onMouseEnter={(e) => {
                    if (!isMobile) {
                      e.currentTarget.style.background = 'rgba(16, 185, 129, 0.15)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isMobile) {
                      e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'
                    }
                  }}
                >
                  <Info size={14} />
                  Info & Macro's
                </button>
              </div>
            </div>
          ))}
          
          {/* Add Prep Button */}
          {weeklyPreps.length < 5 && (
            <button
              onClick={handleAddPrep}
              style={{
                minHeight: isMobile ? '200px' : '240px',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
                border: '2px dashed rgba(16, 185, 129, 0.3)',
                borderRadius: isMobile ? '10px' : '12px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                transition: 'all 0.3s ease',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                if (!isMobile) {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.08) 100%)'
                  e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.5)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isMobile) {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)'
                  e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.3)'
                }
              }}
            >
              <div style={{
                width: isMobile ? '48px' : '56px',
                height: isMobile ? '48px' : '56px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Plus size={isMobile ? 24 : 28} color="#10b981" strokeWidth={2.5} />
              </div>
              <div style={{
                fontSize: isMobile ? '0.95rem' : '1.05rem',
                fontWeight: '700',
                color: '#10b981'
              }}>
                Voeg Prep Toe
              </div>
            </button>
          )}
        </div>
      </div>

      {/* Summary - COMPACT */}
      {weeklyPreps.length > 0 && (
        <div style={{
          padding: isMobile ? '0.875rem 1rem' : '1rem 1.25rem',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.08) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: isMobile ? '10px' : '12px',
          margin: isMobile ? '0 0.5rem' : '0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          boxShadow: '0 4px 16px rgba(16, 185, 129, 0.15)'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: isMobile ? '1.5rem' : '1.75rem',
              fontWeight: '900',
              color: '#10b981',
              marginBottom: '0.25rem'
            }}>
              {totalPortions}
            </div>
            <div style={{
              fontSize: isMobile ? '0.75rem' : '0.8rem',
              color: 'rgba(255, 255, 255, 0.6)',
              fontWeight: '500'
            }}>
              Totaal porties
            </div>
          </div>
          
          <div style={{
            width: '1px',
            height: '40px',
            background: 'rgba(16, 185, 129, 0.2)'
          }} />
          
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: isMobile ? '1.5rem' : '1.75rem',
              fontWeight: '900',
              color: '#10b981',
              marginBottom: '0.25rem'
            }}>
              {weeklyPreps.length}
            </div>
            <div style={{
              fontSize: isMobile ? '0.75rem' : '0.8rem',
              color: 'rgba(255, 255, 255, 0.6)',
              fontWeight: '500'
            }}>
              Maaltijden
            </div>
          </div>
        </div>
      )}

      {/* MEAL SELECTION MODAL */}
      {showMealModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.9)',
          backdropFilter: 'blur(8px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: isMobile ? '1rem' : '2rem',
          animation: 'fadeIn 0.2s ease'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '900px',
            maxHeight: '90vh',
            background: 'linear-gradient(135deg, #0a0a0a 0%, #171717 100%)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: isMobile ? '16px' : '20px',
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: isMobile ? '1.25rem 1rem' : '1.5rem 1.5rem',
              borderBottom: '1px solid rgba(16, 185, 129, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <h2 style={{
                fontSize: isMobile ? '1.25rem' : '1.5rem',
                fontWeight: '800',
                color: '#10b981',
                margin: 0
              }}>
                Selecteer Maaltijd
              </h2>
              
              <button
                onClick={() => {
                  setShowMealModal(false)
                  setEditingSlot(null)
                  setSearchTerm('')
                }}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent'
                }}
              >
                <X size={20} color="#ef4444" strokeWidth={2.5} />
              </button>
            </div>
            
            {/* Search Bar */}
            <div style={{
              padding: isMobile ? '1rem' : '1.25rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <input
                type="text"
                placeholder="🔍 Zoek maaltijd..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: isMobile ? '0.75rem 1rem' : '0.875rem 1.125rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: isMobile ? '0.875rem' : '0.95rem',
                  fontWeight: '500',
                  outline: 'none'
                }}
              />
            </div>
            
            {/* Meal Grid */}
            <div style={{
              flex: 1,
              overflow: 'auto',
              padding: isMobile ? '1rem' : '1.25rem'
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
                gap: isMobile ? '0.75rem' : '0.875rem'
              }}>
                {filteredMeals.map(meal => (
                  <button
                    key={meal.id}
                    onClick={() => handleSelectMeal(meal)}
                    style={{
                      background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.8) 0%, rgba(23, 23, 23, 0.6) 100%)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: isMobile ? '10px' : '12px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent',
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => {
                      if (!isMobile) {
                        e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.5)'
                        e.currentTarget.style.transform = 'translateY(-2px)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isMobile) {
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                        e.currentTarget.style.transform = 'translateY(0)'
                      }
                    }}
                  >
                    {meal.image_url && (
                      <div style={{
                        width: '100%',
                        height: isMobile ? '100px' : '120px',
                        background: `url(${meal.image_url}) center/cover`,
                        position: 'relative'
                      }}>
                        <div style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.7) 100%)'
                        }} />
                      </div>
                    )}
                    
                    <div style={{
                      padding: isMobile ? '0.75rem' : '0.875rem'
                    }}>
                      <div style={{
                        fontSize: isMobile ? '0.875rem' : '0.95rem',
                        fontWeight: '700',
                        color: '#fff',
                        marginBottom: '0.375rem',
                        lineHeight: '1.3'
                      }}>
                        {meal.name}
                      </div>
                      
                      <div style={{
                        fontSize: isMobile ? '0.7rem' : '0.75rem',
                        color: 'rgba(255, 255, 255, 0.6)',
                        display: 'flex',
                        gap: '0.5rem'
                      }}>
                        <span>{meal.calories_per_serving || 0} kcal</span>
                        <span>•</span>
                        <span>{meal.protein_per_serving || 0}g P</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              
              {filteredMeals.length === 0 && (
                <div style={{
                  textAlign: 'center',
                  padding: '3rem 1rem',
                  color: 'rgba(255, 255, 255, 0.5)'
                }}>
                  Geen maaltijden gevonden
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* INFO MODAL */}
      {showInfoModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.9)',
          backdropFilter: 'blur(8px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: isMobile ? '1rem' : '2rem'
        }}
        onClick={() => setShowInfoModal(null)}
        >
          <div style={{
            width: '100%',
            maxWidth: '500px',
            background: 'linear-gradient(135deg, #0a0a0a 0%, #171717 100%)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: isMobile ? '16px' : '20px',
            padding: isMobile ? '1.5rem' : '2rem',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{
              fontSize: isMobile ? '1.125rem' : '1.25rem',
              fontWeight: '800',
              color: '#10b981',
              marginBottom: '1rem'
            }}>
              {showInfoModal.mealName}
            </h3>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '0.75rem',
              marginBottom: '1rem'
            }}>
              <div style={{
                padding: '0.75rem',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#10b981' }}>
                  {showInfoModal.calories}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>
                  kcal
                </div>
              </div>
              
              <div style={{
                padding: '0.75rem',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#ef4444' }}>
                  {showInfoModal.protein}g
                </div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>
                  Eiwit
                </div>
              </div>
              
              <div style={{
                padding: '0.75rem',
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.2)',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#f59e0b' }}>
                  {showInfoModal.carbs}g
                </div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>
                  Koolhydraten
                </div>
              </div>
              
              <div style={{
                padding: '0.75rem',
                background: 'rgba(168, 85, 247, 0.1)',
                border: '1px solid rgba(168, 85, 247, 0.2)',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#a855f7' }}>
                  {showInfoModal.fat}g
                </div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>
                  Vetten
                </div>
              </div>
            </div>
            
            <button
              onClick={() => setShowInfoModal(null)}
              style={{
                width: '100%',
                padding: '0.875rem',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                border: 'none',
                borderRadius: '10px',
                color: 'white',
                fontSize: '0.95rem',
                fontWeight: '700',
                cursor: 'pointer',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              Sluiten
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  )
}
