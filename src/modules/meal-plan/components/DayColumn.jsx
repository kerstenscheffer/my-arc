// src/modules/meal-plan/components/DayColumn.jsx
import React, { useState } from 'react'
import { Copy, MoreVertical, Check } from 'lucide-react'
import MealSlot from './MealSlot'

export default function DayColumn({
  day,
  dayData,
  activePlan,
  client,
  db,
  expandedView,
  onMealUpdate,
  onCopyDay,
  onScalePortion,
  onDragStart,
  onDrop,
  onDragEnd,
  isDragging,
  dragSource,
  targets // ← NEW: Receive targets
}) {
  const isMobile = window.innerWidth <= 768
  
  const [showCopyMenu, setShowCopyMenu] = useState(false)
  const [selectedDays, setSelectedDays] = useState([])
  
  const slots = ['breakfast', 'lunch', 'dinner', 'snacks']
  
  const allDays = [
    { key: 'monday', label: 'Ma' },
    { key: 'tuesday', label: 'Di' },
    { key: 'wednesday', label: 'Wo' },
    { key: 'thursday', label: 'Do' },
    { key: 'friday', label: 'Vr' },
    { key: 'saturday', label: 'Za' },
    { key: 'sunday', label: 'Zo' }
  ]
  
  const handleCopyDay = () => {
    if (selectedDays.length === 0) {
      alert('Selecteer eerst dagen om naartoe te kopiëren')
      return
    }
    
    onCopyDay(day.key, selectedDays)
    setShowCopyMenu(false)
    setSelectedDays([])
  }
  
  const toggleDaySelection = (dayKey) => {
    if (selectedDays.includes(dayKey)) {
      setSelectedDays(selectedDays.filter(d => d !== dayKey))
    } else {
      setSelectedDays([...selectedDays, dayKey])
    }
  }
  
  // Calculate day progress - USE CORRECT TARGETS
  const defaultTargets = {
    calories: 2200,
    protein: 165
  }
  
  const actualTargets = targets || defaultTargets
  
  const totals = dayData.totals || { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  const calorieProgress = Math.round((totals.kcal / actualTargets.calories) * 100)
  const proteinProgress = Math.round((totals.protein / actualTargets.protein) * 100)
  
  return (
    <div style={{
      minWidth: isMobile ? '100%' : expandedView ? '320px' : '280px',
      maxWidth: isMobile ? '100%' : expandedView ? '320px' : '280px',
      background: 'linear-gradient(135deg, rgba(17, 17, 17, 0.8) 0%, rgba(10, 10, 10, 0.8) 100%)',
      backdropFilter: 'blur(20px)',
      borderRadius: isMobile ? '16px' : '20px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      padding: isMobile ? '1rem' : '1.25rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem',
      position: 'relative',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
      transition: 'all 0.3s ease'
    }}>
      {/* Day Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: '0.75rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div>
          <h3 style={{
            fontSize: isMobile ? '1.1rem' : '1.25rem',
            fontWeight: '700',
            color: '#fff',
            margin: 0,
            marginBottom: '0.25rem'
          }}>
            {isMobile ? day.label : day.fullLabel}
          </h3>
          <div style={{
            fontSize: '0.75rem',
            color: 'rgba(255, 255, 255, 0.5)'
          }}>
            {totals.kcal > 0 ? `${totals.kcal} kcal • ${totals.protein}g P` : 'Nog niet gepland'}
          </div>
        </div>
        
        {/* Copy Button */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowCopyMenu(!showCopyMenu)}
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
              transition: 'all 0.3s ease',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
            }}
          >
            <Copy size={16} color="rgba(255, 255, 255, 0.7)" />
          </button>
          
          {/* Copy Menu */}
          {showCopyMenu && (
            <>
              <div
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 998
                }}
                onClick={() => setShowCopyMenu(false)}
              />
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '0.5rem',
                background: 'rgba(17, 17, 17, 0.98)',
                backdropFilter: 'blur(20px)',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                padding: '1rem',
                minWidth: '200px',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
                zIndex: 999
              }}>
                <div style={{
                  fontSize: '0.75rem',
                  color: 'rgba(255, 255, 255, 0.5)',
                  marginBottom: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Kopieer naar:
                </div>
                
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  marginBottom: '0.75rem'
                }}>
                  {allDays
                    .filter(d => d.key !== day.key)
                    .map(d => (
                      <button
                        key={d.key}
                        onClick={() => toggleDaySelection(d.key)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.5rem 0.75rem',
                          background: selectedDays.includes(d.key)
                            ? 'rgba(59, 130, 246, 0.2)'
                            : 'rgba(255, 255, 255, 0.05)',
                          border: selectedDays.includes(d.key)
                            ? '1px solid rgba(59, 130, 246, 0.5)'
                            : '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '8px',
                          color: '#fff',
                          fontSize: '0.875rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          touchAction: 'manipulation'
                        }}
                      >
                        <span>{d.label}</span>
                        {selectedDays.includes(d.key) && (
                          <Check size={14} color="#3b82f6" />
                        )}
                      </button>
                    ))}
                </div>
                
                <button
                  onClick={handleCopyDay}
                  disabled={selectedDays.length === 0}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: selectedDays.length > 0
                      ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                      : 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    borderRadius: '8px',
                    color: selectedDays.length > 0 ? '#fff' : 'rgba(255, 255, 255, 0.3)',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: selectedDays.length > 0 ? 'pointer' : 'not-allowed',
                    transition: 'all 0.3s ease',
                    touchAction: 'manipulation'
                  }}
                >
                  Kopieer ({selectedDays.length})
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Progress Bars */}
      {totals.kcal > 0 && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          paddingBottom: '0.75rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          {/* Calories */}
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.25rem'
            }}>
              <span style={{
                fontSize: '0.75rem',
                color: 'rgba(255, 255, 255, 0.5)'
              }}>
                Calorieën
              </span>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: '600',
                color: calorieProgress >= 90 ? '#10b981' : '#f97316'
              }}>
                {calorieProgress}%
              </span>
            </div>
            <div style={{
              height: '4px',
              background: 'rgba(0, 0, 0, 0.5)',
              borderRadius: '10px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${Math.min(calorieProgress, 100)}%`,
                height: '100%',
                background: calorieProgress >= 90
                  ? 'linear-gradient(90deg, #10b981 0%, #34d399 100%)'
                  : 'linear-gradient(90deg, #f97316 0%, #fb923c 100%)',
                transition: 'width 0.5s ease'
              }} />
            </div>
          </div>
          
          {/* Protein */}
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.25rem'
            }}>
              <span style={{
                fontSize: '0.75rem',
                color: 'rgba(255, 255, 255, 0.5)'
              }}>
                Eiwit
              </span>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: '600',
                color: proteinProgress >= 90 ? '#10b981' : '#8b5cf6'
              }}>
                {proteinProgress}%
              </span>
            </div>
            <div style={{
              height: '4px',
              background: 'rgba(0, 0, 0, 0.5)',
              borderRadius: '10px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${Math.min(proteinProgress, 100)}%`,
                height: '100%',
                background: proteinProgress >= 90
                  ? 'linear-gradient(90deg, #10b981 0%, #34d399 100%)'
                  : 'linear-gradient(90deg, #8b5cf6 0%, #a78bfa 100%)',
                transition: 'width 0.5s ease'
              }} />
            </div>
          </div>
        </div>
      )}
      
      {/* Meal Slots */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        flex: 1
      }}>
        {slots.map(slot => {
          const slotData = dayData[slot]
          
          return (
            <MealSlot
              key={slot}
              slot={slot}
              slotData={slotData}
              day={day.key}
              client={client}
              db={db}
              expandedView={expandedView}
              onMealUpdate={onMealUpdate}
              onScalePortion={onScalePortion}
              onDragStart={onDragStart}
              onDrop={onDrop}
              onDragEnd={onDragEnd}
              isDragging={isDragging}
              isSource={dragSource?.day === day.key && dragSource?.slot === slot}
            />
          )
        })}
      </div>
    </div>
  )
}
