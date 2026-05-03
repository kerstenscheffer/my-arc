// src/modules/meal-plan/components/AIDailyGoals.jsx
// ✅ PREMIUM v5.2 - FIXED: Info & Wissel buttons nu werkend door props fix
// 🎯 LESS GREEN, MORE BLACK, STRATEGIC ACCENTS
import React, { useState } from 'react'
import { 
  Flame, Plus,
  Apple, Wheat, Beef
} from 'lucide-react'
import ViewConsumedMealsButton from './ViewConsumedMealsButton'
import ViewAIDayScheduleButton from './ViewAIDayScheduleButton'

export default function AIDailyGoals({ 
  dailyTotals, 
  waterIntake, 
  todayMood,
  onUpdateWater,
  onLogMood,
  onMealLogged,
  onQuickIntake,
  client,
  db,
  activePlan,
  todayMeals,
  todayProgress,
  onCheckMeal,
  onUncheckMeal,
  onOpenInfo,
  onOpenAlternatives,
  dayTemplates,
  onPlanUpdate,
  onNavigateToDay,
  selectedDay
}) {
  const isMobile = window.innerWidth <= 768
  const [showIntakeModal, setShowIntakeModal] = useState(false)
  
  const caloriesPercent = Math.min(100, Math.round(
    ((dailyTotals?.consumed?.calories || 0) / (dailyTotals?.targets?.calories || 1)) * 100
  ))
  const proteinPercent = Math.min(100, Math.round(
    ((dailyTotals?.consumed?.protein || 0) / (dailyTotals?.targets?.protein || 1)) * 100
  ))
  const carbsPercent = Math.min(100, Math.round(
    ((dailyTotals?.consumed?.carbs || 0) / (dailyTotals?.targets?.carbs || 1)) * 100
  ))
  const fatPercent = Math.min(100, Math.round(
    ((dailyTotals?.consumed?.fat || 0) / (dailyTotals?.targets?.fat || 1)) * 100
  ))
  
  const handleQuickIntake = async (intakeData) => {
    console.log('🍽️ [AIDailyGoals] handleQuickIntake called with:', intakeData)
    try {
      await onQuickIntake(intakeData)
      setShowIntakeModal(false)
      console.log('✅ [AIDailyGoals] Quick Intake saved successfully')
    } catch (error) {
      console.error('❌ [AIDailyGoals] Quick Intake error:', error)
      alert('Opslaan mislukt. Probeer opnieuw.')
    }
  }

  const MacroCard = ({ icon: Icon, value, target, unit, percent, label }) => (
    <div style={{
      background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.8) 0%, rgba(23, 23, 23, 0.6) 100%)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(16, 185, 129, 0.2)',
      borderRadius: isMobile ? '10px' : '12px',
      padding: isMobile ? '0.5rem' : '0.75rem',
      minHeight: '44px',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.03)'
    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '50%',
        background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.04) 0%, transparent 100%)',
        pointerEvents: 'none'
      }} />
      
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: isMobile ? '0.375rem' : '0.5rem',
        marginBottom: isMobile ? '0.375rem' : '0.5rem',
        position: 'relative',
        zIndex: 1
      }}>
        <Icon 
          size={isMobile ? 12 : 14} 
          color="#10b981"
          style={{ 
            filter: 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.6))',
            flexShrink: 0
          }}
        />
        <span style={{
          fontSize: isMobile ? '0.65rem' : '0.75rem',
          color: '#10b981',
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: '0.02em',
          lineHeight: 1
        }}>
          {value}/{target}{unit}
        </span>
      </div>
      
      <div style={{
        height: isMobile ? '4px' : '5px',
        background: 'rgba(0, 0, 0, 0.5)',
        borderRadius: '3px',
        overflow: 'hidden',
        position: 'relative',
        zIndex: 1,
        border: '1px solid rgba(0, 0, 0, 0.3)'
      }}>
        <div style={{
          height: '100%',
          width: `${percent}%`,
          background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
          transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '0 0 10px rgba(16, 185, 129, 0.6)'
        }} />
      </div>
      
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: isMobile ? '0.3rem' : '0.375rem',
        position: 'relative',
        zIndex: 1
      }}>
        <span style={{
          fontSize: isMobile ? '0.6rem' : '0.65rem',
          fontWeight: '600',
          color: 'rgba(255, 255, 255, 0.4)',
          textTransform: 'uppercase',
          letterSpacing: '0.03em'
        }}>
          {label}
        </span>
        <span style={{
          fontSize: isMobile ? '0.65rem' : '0.75rem',
          fontWeight: '800',
          color: '#10b981',
          textShadow: '0 0 8px rgba(16, 185, 129, 0.3)'
        }}>
          {percent}%
        </span>
      </div>
    </div>
  )

  const QuickIntakeModal = ({ isOpen, onClose, onSave, targets, isMobile }) => {
    const [selectedType, setSelectedType] = useState('percentage')
    const [percentage, setPercentage] = useState(100)
    const [exactValues, setExactValues] = useState({
      calories: '',
      protein: '',
      carbs: '',
      fat: ''
    })
    
    const percentageOptions = [
      { label: '100%', value: 100, color: '#10b981' },
      { label: '80%', value: 80, color: '#fbbf24' },
      { label: '60%', value: 60, color: '#f59e0b' },
      { label: '40%', value: 40, color: '#f97316' }
    ]
    
    const handleSave = () => {
      if (selectedType === 'percentage') {
        const intakeData = {
          calories: Math.round((targets?.calories || 0) * (percentage / 100)),
          protein: Math.round((targets?.protein || 0) * (percentage / 100)),
          carbs: Math.round((targets?.carbs || 0) * (percentage / 100)),
          fat: Math.round((targets?.fat || 0) * (percentage / 100))
        }
        onSave(intakeData)
      } else {
        onSave({
          calories: parseInt(exactValues.calories) || 0,
          protein: parseInt(exactValues.protein) || 0,
          carbs: parseInt(exactValues.carbs) || 0,
          fat: parseInt(exactValues.fat) || 0
        })
      }
    }

    if (!isOpen) return null

    return (
      <div onClick={onClose} style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: isMobile ? '1rem' : '1.5rem',
        animation: 'fadeIn 0.3s ease'
      }}>
        <div onClick={(e) => e.stopPropagation()} style={{
          background: '#0a0a0a',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: isMobile ? '16px' : '20px',
          padding: isMobile ? '1.5rem' : '2rem',
          width: '100%',
          maxWidth: '500px',
          boxShadow: '0 20px 60px rgba(16, 185, 129, 0.3)',
          animation: 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '100px',
            background: 'radial-gradient(circle at top, rgba(16, 185, 129, 0.08) 0%, transparent 70%)',
            pointerEvents: 'none'
          }} />
          
          <h3 style={{
            fontSize: isMobile ? '1.25rem' : '1.5rem',
            fontWeight: '800',
            color: '#10b981',
            marginBottom: '1.5rem',
            margin: 0,
            textShadow: '0 0 15px rgba(16, 185, 129, 0.3)',
            letterSpacing: '-0.01em',
            position: 'relative',
            zIndex: 1
          }}>
            Quick Intake Log
          </h3>
          
          <div style={{
            display: 'flex',
            gap: isMobile ? '0.5rem' : '0.75rem',
            marginBottom: isMobile ? '1rem' : '1.5rem',
            position: 'relative',
            zIndex: 1
          }}>
            <button
              onClick={() => setSelectedType('percentage')}
              style={{
                flex: 1,
                padding: isMobile ? '0.75rem' : '0.875rem',
                background: selectedType === 'percentage' 
                  ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(5, 150, 105, 0.15) 100%)'
                  : 'linear-gradient(135deg, rgba(23, 23, 23, 0.8) 0%, rgba(23, 23, 23, 0.6) 100%)',
                backdropFilter: 'blur(12px)',
                border: selectedType === 'percentage'
                  ? '1px solid rgba(16, 185, 129, 0.4)'
                  : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                color: selectedType === 'percentage' ? '#10b981' : 'rgba(255, 255, 255, 0.6)',
                fontWeight: '700',
                fontSize: isMobile ? '0.85rem' : '0.95rem',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                minHeight: '44px',
                boxShadow: selectedType === 'percentage'
                  ? '0 4px 16px rgba(16, 185, 129, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                  : '0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.03)'
              }}
            >
              Percentage
            </button>
            <button
              onClick={() => setSelectedType('exact')}
              style={{
                flex: 1,
                padding: isMobile ? '0.75rem' : '0.875rem',
                background: selectedType === 'exact'
                  ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(5, 150, 105, 0.15) 100%)'
                  : 'linear-gradient(135deg, rgba(23, 23, 23, 0.8) 0%, rgba(23, 23, 23, 0.6) 100%)',
                backdropFilter: 'blur(12px)',
                border: selectedType === 'exact'
                  ? '1px solid rgba(16, 185, 129, 0.4)'
                  : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                color: selectedType === 'exact' ? '#10b981' : 'rgba(255, 255, 255, 0.6)',
                fontWeight: '700',
                fontSize: isMobile ? '0.85rem' : '0.95rem',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                minHeight: '44px',
                boxShadow: selectedType === 'exact'
                  ? '0 4px 16px rgba(16, 185, 129, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                  : '0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.03)'
              }}
            >
              Exacte Waarde
            </button>
          </div>
          
          <div style={{ position: 'relative', zIndex: 1 }}>
            {selectedType === 'percentage' ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: isMobile ? '0.625rem' : '0.75rem'
              }}>
                {percentageOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setPercentage(option.value)}
                    style={{
                      padding: isMobile ? '1rem' : '1.25rem',
                      background: percentage === option.value
                        ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(5, 150, 105, 0.15) 100%)'
                        : 'linear-gradient(135deg, rgba(23, 23, 23, 0.8) 0%, rgba(23, 23, 23, 0.6) 100%)',
                      backdropFilter: 'blur(12px)',
                      border: percentage === option.value
                        ? '1px solid rgba(16, 185, 129, 0.4)'
                        : '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: isMobile ? '12px' : '14px',
                      color: percentage === option.value ? '#10b981' : 'rgba(255, 255, 255, 0.6)',
                      fontSize: isMobile ? '1.25rem' : '1.5rem',
                      fontWeight: '800',
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent',
                      minHeight: '44px',
                      boxShadow: percentage === option.value
                        ? '0 4px 16px rgba(16, 185, 129, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                        : '0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.03)'
                    }}
                    onMouseEnter={(e) => {
                      if (percentage !== option.value) {
                        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.08) 100%)'
                        e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.3)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (percentage !== option.value) {
                        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(23, 23, 23, 0.8) 0%, rgba(23, 23, 23, 0.6) 100%)'
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                      }
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: isMobile ? '0.625rem' : '0.75rem'
              }}>
                {[
                  { key: 'calories', label: 'Calorieën', icon: Flame },
                  { key: 'protein', label: 'Eiwitten (g)', icon: Beef },
                  { key: 'carbs', label: 'Koolhydraten (g)', icon: Wheat },
                  { key: 'fat', label: 'Vetten (g)', icon: Apple }
                ].map(({ key, label, icon: Icon }) => (
                  <div key={key} style={{ position: 'relative' }}>
                    <div style={{
                      position: 'absolute',
                      left: isMobile ? '0.875rem' : '1rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      zIndex: 1,
                      pointerEvents: 'none'
                    }}>
                      <Icon size={isMobile ? 16 : 18} color="#10b981" />
                    </div>
                    <input
                      type="number"
                      placeholder={label}
                      value={exactValues[key]}
                      onChange={(e) => setExactValues({...exactValues, [key]: e.target.value})}
                      style={{
                        width: '100%',
                        padding: isMobile ? '0.875rem 0.875rem 0.875rem 2.75rem' : '1rem 1rem 1rem 3rem',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(16, 185, 129, 0.2)',
                        borderRadius: '12px',
                        color: 'white',
                        fontSize: isMobile ? '0.9rem' : '1rem',
                        fontWeight: '500',
                        outline: 'none',
                        minHeight: '44px',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.4)'
                        e.currentTarget.style.boxShadow = '0 0 15px rgba(16, 185, 129, 0.15)'
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.2)'
                        e.currentTarget.style.boxShadow = 'none'
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div style={{
            display: 'flex',
            gap: isMobile ? '0.75rem' : '1rem',
            marginTop: isMobile ? '1.5rem' : '2rem',
            position: 'relative',
            zIndex: 1
          }}>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: isMobile ? '0.875rem' : '1rem',
                background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.8) 0%, rgba(23, 23, 23, 0.6) 100%)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                color: 'rgba(255, 255, 255, 0.6)',
                fontWeight: '700',
                fontSize: isMobile ? '0.9rem' : '1rem',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                minHeight: '44px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.03)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.08) 100%)'
                e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.3)'
                e.currentTarget.style.color = '#10b981'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(23, 23, 23, 0.8) 0%, rgba(23, 23, 23, 0.6) 100%)'
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              Annuleren
            </button>
            <button
              onClick={handleSave}
              style={{
                flex: 1,
                padding: isMobile ? '0.875rem' : '1rem',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                border: 'none',
                borderRadius: '12px',
                color: 'white',
                fontWeight: '700',
                fontSize: isMobile ? '0.9rem' : '1rem',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                minHeight: '44px',
                boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 8px 30px rgba(16, 185, 129, 0.4)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(16, 185, 129, 0.3)'
              }}
            >
              Opslaan
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ 
      padding: isMobile ? '1rem 1rem 0.75rem' : '1.5rem 1.5rem 1rem'
    }}>
      {/* Header Section - CLEAN BLACK + GREEN BORDER */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.8) 0%, rgba(23, 23, 23, 0.6) 100%)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        borderRadius: isMobile ? '14px' : '16px',
        padding: isMobile ? '1rem' : '1.25rem',
        marginBottom: isMobile ? '1rem' : '1.25rem',
        textAlign: 'center',
        boxShadow: '0 4px 16px rgba(16, 185, 129, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.03)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '50%',
          background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.04) 0%, transparent 100%)',
          pointerEvents: 'none'
        }} />
        
        <h2 style={{
          fontSize: isMobile ? '1.125rem' : '1.375rem',
          fontWeight: '800',
          color: '#10b981',
          margin: 0,
          textShadow: '0 0 15px rgba(16, 185, 129, 0.4)',
          letterSpacing: '-0.01em',
          position: 'relative',
          zIndex: 1
        }}>
          Jouw Macro Doelen Vandaag
        </h2>
      </div>

      {/* Macro Cards Grid - CLEAN BLACK CARDS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: isMobile ? '0.5rem' : '0.75rem',
        marginBottom: isMobile ? '1rem' : '1.25rem'
      }}>
        <MacroCard
          icon={Flame}
          value={Math.round(dailyTotals?.consumed?.calories || 0)}
          target={Math.round(dailyTotals?.targets?.calories || 0)}
          unit=""
          percent={caloriesPercent}
          label="Kcal"
        />
        <MacroCard
          icon={Beef}
          value={Math.round(dailyTotals?.consumed?.protein || 0)}
          target={Math.round(dailyTotals?.targets?.protein || 0)}
          unit="g"
          percent={proteinPercent}
          label="Eiw"
        />
        <MacroCard
          icon={Wheat}
          value={Math.round(dailyTotals?.consumed?.carbs || 0)}
          target={Math.round(dailyTotals?.targets?.carbs || 0)}
          unit="g"
          percent={carbsPercent}
          label="Khl"
        />
        <MacroCard
          icon={Apple}
          value={Math.round(dailyTotals?.consumed?.fat || 0)}
          target={Math.round(dailyTotals?.targets?.fat || 0)}
          unit="g"
          percent={fatPercent}
          label="Vet"
        />
      </div>
      
      {/* ✅ VERTICAL STACK - Buttons onder elkaar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: isMobile ? '0.5rem' : '0.75rem',
        marginBottom: isMobile ? '0.75rem' : '1rem'
      }}>
        <ViewConsumedMealsButton 
          client={client} 
          db={db}
          onMealLogged={onMealLogged}
          onQuickIntake={onQuickIntake}
          targets={dailyTotals?.targets}
        />
        
        <ViewAIDayScheduleButton
          client={client}
          db={db}
          activePlan={activePlan}
          todayMeals={todayMeals}
          todayProgress={todayProgress}
          onCheckMeal={onCheckMeal}
          onUncheckMeal={onUncheckMeal}
          onOpenInfo={onOpenInfo}
          onOpenAlternatives={onOpenAlternatives}
          dayTemplates={dayTemplates || []}
          onPlanUpdate={onPlanUpdate}
          onNavigateToDay={onNavigateToDay}
          selectedDay={selectedDay}
        />
      </div>
      
      {/* Quick Intake Modal */}
      {showIntakeModal && (
        <QuickIntakeModal
          isOpen={showIntakeModal}
          onClose={() => setShowIntakeModal(false)}
          onSave={handleQuickIntake}
          targets={dailyTotals?.targets}
          isMobile={isMobile}
        />
      )}
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
