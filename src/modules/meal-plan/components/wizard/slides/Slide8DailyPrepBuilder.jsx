// src/modules/meal-plan/components/wizard/slides/Slide8DailyPrepBuilder.jsx
// Daily meal prep builder - optional, can be skipped
// ULTRA COMPACT VERSION + VIDEO + OVERLAPPING COACH BUBBLE

import { useState } from 'react'
import CoachBubble from '../shared/CoachBubble'
import MealPickerGrid from '../pickers/MealPickerGrid'

export default function Slide8DailyPrepBuilder({
  wizardData,
  onUpdate,
  allMeals = [],
  weekPlanMeals = [],
  isMobile
}) {
  const [activeTab, setActiveTab] = useState('week') // 'week' or 'all'
  const [isPlaying, setIsPlaying] = useState(false)
  
  const dailyPrep = wizardData.dailyPrep || {
    portions: 2,
    selectedMeals: []
  }

  const portionOptions = [
    { value: 1, label: '1 dag', subtitle: 'Dagelijks vers' },
    { value: 2, label: '2 dagen', subtitle: 'Om de dag' },
    { value: 3, label: '3 dagen', subtitle: 'Extra voorraad' }
  ]

  const handlePortionChange = (value) => {
    onUpdate('dailyPrep', {
      ...dailyPrep,
      portions: value
    })
  }

  const handleMealSelect = (mealId) => {
    const newSelectedMeals = [...dailyPrep.selectedMeals, mealId]
    onUpdate('dailyPrep', {
      ...dailyPrep,
      selectedMeals: newSelectedMeals
    })
  }

  const handleMealRemove = (mealId) => {
    const newSelectedMeals = dailyPrep.selectedMeals.filter(id => id !== mealId)
    onUpdate('dailyPrep', {
      ...dailyPrep,
      selectedMeals: newSelectedMeals
    })
  }

  // Calculate stats
  const totalPortions = dailyPrep.selectedMeals.length * dailyPrep.portions
  const estimatedTime = dailyPrep.selectedMeals.length > 0 
    ? Math.round(dailyPrep.selectedMeals.length * 15) + ' min'
    : '-'

  // Get meals for current tab - filter for quick/fresh meals
  const displayMeals = (activeTab === 'week' ? weekPlanMeals : allMeals)
    .filter(meal => {
      // Prefer quick and fresh meals for daily prep
      const labels = meal.labels || []
      const timing = meal.timing || []
      
      return (
        labels.includes('quick') ||
        labels.includes('breakfast') ||
        labels.includes('snack') ||
        timing.includes('breakfast') ||
        timing.includes('snack') ||
        (meal.prep_time_min && meal.prep_time_min <= 20)
      )
    })

  return (
    <div style={{
      padding: '0',
      width: '100%'
    }}>
      {/* Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: isMobile ? '1rem' : '1.25rem'
      }}>
        <div style={{
          fontSize: isMobile ? '2rem' : '2.5rem',
          marginBottom: '0.5rem'
        }}>
          🍳
        </div>
        
        <h1 style={{
          fontSize: isMobile ? '1.5rem' : '2rem',
          fontWeight: '900',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          margin: '0 0 0.5rem 0',
          lineHeight: '1.2',
          padding: '0 1rem'
        }}>
          Dagelijkse Meal Prep
        </h1>
        
        <p style={{
          fontSize: isMobile ? '0.85rem' : '0.95rem',
          color: 'rgba(255, 255, 255, 0.7)',
          margin: 0,
          padding: '0 1rem'
        }}>
          Optioneel: Voor verse maaltijden
        </p>
      </div>

      {/* Video Container */}
      <div style={{
        position: 'relative',
        marginBottom: isMobile ? '1rem' : '1.5rem'
      }}>
        <div style={{
          position: 'relative',
          width: '100%',
          paddingBottom: '56.25%',
          borderRadius: isMobile ? '12px' : '16px',
          overflow: 'hidden',
          border: '2px solid rgba(16, 185, 129, 0.3)',
          background: '#000'
        }}>
          {!isPlaying ? (
            // Thumbnail + Play Button
            <>
              <img
                src="https://cdn.shopify.com/s/files/1/0862/1237/8954/files/Black_White_Red_Simple_Modern_Elegant_Video_How_To_YouTube_Thumbnail_7.png?v=1760211909"
                alt="Daily Prep Tutorial"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
              
              {/* Play Button */}
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
                  background: 'rgba(16, 185, 129, 0.95)',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 10px 30px rgba(16, 185, 129, 0.5)',
                  transition: 'all 0.3s ease',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent'
                }}
                onMouseEnter={(e) => {
                  if (!isMobile) {
                    e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.1)'
                    e.currentTarget.style.background = '#10b981'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isMobile) {
                    e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)'
                    e.currentTarget.style.background = 'rgba(16, 185, 129, 0.95)'
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
                  marginLeft: isMobile ? '6px' : '8px'
                }} />
              </button>
            </>
          ) : (
            // Video iframe
            <iframe
              src="https://www.youtube.com/embed/DAILY_PREP_VIDEO_ID?autoplay=1&mute=0&controls=1&rel=0&modestbranding=1&playsinline=1"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                border: 'none'
              }}
              title="Daily Prep Tutorial"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          )}
        </div>
        
        {/* Coach Bubble - OVERLAPPING */}
        <div style={{
          position: 'relative',
          marginTop: '-2rem',
          paddingTop: '0.5rem'
        }}>
          <CoachBubble
            message="Ook dagelijkse prep? Perfect voor ontbijt en snacks. Je mag dit overslaan! 🍳"
            variant="default"
          />
        </div>
      </div>

      {/* Portion Selector */}
      <div style={{
        marginBottom: '1.25rem'
      }}>
        <div style={{
          fontSize: isMobile ? '0.875rem' : '0.95rem',
          fontWeight: '600',
          color: 'rgba(255, 255, 255, 0.9)',
          marginBottom: '0.75rem'
        }}>
          📦 Hoeveel porties voorbereiden?
        </div>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
          gap: isMobile ? '0.5rem' : '0.75rem'
        }}>
          {portionOptions.map(option => (
            <button
              key={option.value}
              onClick={() => handlePortionChange(option.value)}
              style={{
                padding: isMobile ? '0.875rem' : '1rem',
                background: dailyPrep.portions === option.value
                  ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%)'
                  : 'rgba(255, 255, 255, 0.05)',
                border: dailyPrep.portions === option.value
                  ? '2px solid rgba(16, 185, 129, 0.5)'
                  : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                textAlign: 'center',
                
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                if (dailyPrep.portions !== option.value) {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.3)'
                }
              }}
              onMouseLeave={(e) => {
                if (dailyPrep.portions !== option.value) {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                }
              }}
            >
              <div style={{
                fontSize: isMobile ? '1.35rem' : '1.5rem',
                fontWeight: '700',
                color: dailyPrep.portions === option.value ? '#10b981' : 'white',
                marginBottom: '0.25rem'
              }}>
                {option.label}
              </div>
              <div style={{
                fontSize: isMobile ? '0.8rem' : '0.875rem',
                color: 'rgba(255, 255, 255, 0.5)'
              }}>
                {option.subtitle}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Meal Selector */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        padding: isMobile ? '1rem' : '1.25rem',
        marginBottom: '1.25rem'
      }}>
        <div style={{
          fontSize: isMobile ? '0.875rem' : '0.95rem',
          fontWeight: '600',
          color: 'rgba(255, 255, 255, 0.9)',
          marginBottom: '0.75rem'
        }}>
          🍽️ Selecteer tot 3 maaltijden (optioneel)
        </div>

        {/* Tab Toggle */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '1rem',
          background: 'rgba(255, 255, 255, 0.05)',
          padding: '0.25rem',
          borderRadius: '8px'
        }}>
          <button
            onClick={() => setActiveTab('week')}
            style={{
              flex: 1,
              padding: isMobile ? '0.625rem' : '0.75rem',
              background: activeTab === 'week'
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                : 'transparent',
              border: 'none',
              borderRadius: '6px',
              color: 'white',
              fontSize: isMobile ? '0.8rem' : '0.875rem',
              fontWeight: activeTab === 'week' ? '600' : '500',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            📋 Uit jouw plan
          </button>
          <button
            onClick={() => setActiveTab('all')}
            style={{
              flex: 1,
              padding: isMobile ? '0.625rem' : '0.75rem',
              background: activeTab === 'all'
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                : 'transparent',
              border: 'none',
              borderRadius: '6px',
              color: 'white',
              fontSize: isMobile ? '0.8rem' : '0.875rem',
              fontWeight: activeTab === 'all' ? '600' : '500',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            🌟 Alle meals
          </button>
        </div>

        {/* Meal Picker Grid */}
        <MealPickerGrid
          meals={displayMeals}
          selectedMealIds={dailyPrep.selectedMeals}
          maxSelection={3}
          onSelect={handleMealSelect}
          onRemove={handleMealRemove}
          filterPresets="quick"
          showSearch={true}
          showFilters={true}
          emptyMessage={
            activeTab === 'week' 
              ? "Geen snelle meals in jouw week plan. Switch naar 'Alle meals'."
              : "Geen snelle maaltijden gevonden"
          }
        />
      </div>

      {/* Summary Stats */}
      {dailyPrep.selectedMeals.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          borderRadius: '10px',
          padding: isMobile ? '0.875rem' : '1rem',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)',
          gap: isMobile ? '0.875rem' : '1rem'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: isMobile ? '1.35rem' : '1.5rem',
              fontWeight: '700',
              color: '#10b981',
              marginBottom: '0.25rem'
            }}>
              {totalPortions}
            </div>
            <div style={{
              fontSize: isMobile ? '0.75rem' : '0.8rem',
              color: 'rgba(255, 255, 255, 0.6)'
            }}>
              Totaal porties
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: isMobile ? '1.35rem' : '1.5rem',
              fontWeight: '700',
              color: '#10b981',
              marginBottom: '0.25rem'
            }}>
              {dailyPrep.selectedMeals.length}
            </div>
            <div style={{
              fontSize: isMobile ? '0.75rem' : '0.8rem',
              color: 'rgba(255, 255, 255, 0.6)'
            }}>
              Maaltijden
            </div>
          </div>

          <div style={{ 
            textAlign: 'center',
            gridColumn: isMobile ? '1 / -1' : 'auto'
          }}>
            <div style={{
              fontSize: isMobile ? '1.35rem' : '1.5rem',
              fontWeight: '700',
              color: '#10b981',
              marginBottom: '0.25rem'
            }}>
              {estimatedTime}
            </div>
            <div style={{
              fontSize: isMobile ? '0.75rem' : '0.8rem',
              color: 'rgba(255, 255, 255, 0.6)'
            }}>
              Kooktijd per keer
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
