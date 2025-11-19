// src/modules/meal-plan/components/ConsumedMealsView.jsx
// 🎯 CONSUMED MEALS VIEWER - Shows logged meals for coach & client
// ✅ PREMIUM GREEN STYLING - Workout-level design
// ✅ FLOATING BOTTOM BUTTONS - Glassmorphic container
// ⚠️ PROPS SYSTEM UNTOUCHED - All callbacks preserved
import React, { useState, useEffect } from 'react'
import { 
  Calendar, Clock, Trash2, ChevronLeft, ChevronRight, Flame, Target, Zap, Droplets, Plus
} from 'lucide-react'
import MealLoggingWizard from '../../meal-logging-wizard/MealLoggingWizard'
import MealLoggingService from '../../meal-logging-wizard/MealLoggingService'

const getTodayIndex = () => {
  const day = new Date().getDay()
  return day === 0 ? 6 : day - 1
}

const truncateMealName = (name, maxLength) => {
  if (!name) return ''
  if (name.length <= maxLength) return name
  return name.substring(0, maxLength) + '...'
}

const formatTime = (timestamp) => {
  if (!timestamp) return '--:--'
  const date = new Date(timestamp)
  return date.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('nl-NL', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  })
}

export default function ConsumedMealsView({
  client,
  db,
  isCoachView = false,
  onMealLogged,
  onQuickIntake,
  targets
}) {
  const isMobile = window.innerWidth <= 768
  
  const [currentDay, setCurrentDay] = useState(getTodayIndex())
  const [consumedMeals, setConsumedMeals] = useState([])
  const [loading, setLoading] = useState(false)
  const [dayTotals, setDayTotals] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 })
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [showLogModal, setShowLogModal] = useState(false)
  const [showQuickIntakeModal, setShowQuickIntakeModal] = useState(false)
  const [mealLoggingService, setMealLoggingService] = useState(null)
  
  const daysOfWeek = [
    { id: 0, name: 'Ma', key: 'monday' },
    { id: 1, name: 'Di', key: 'tuesday' },
    { id: 2, name: 'Wo', key: 'wednesday' },
    { id: 3, name: 'Do', key: 'thursday' },
    { id: 4, name: 'Vr', key: 'friday' },
    { id: 5, name: 'Za', key: 'saturday' },
    { id: 6, name: 'Zo', key: 'sunday' }
  ]

  // Initialize MealLoggingService
  useEffect(() => {
    if (db?.supabase) {
      const loggingService = new MealLoggingService(db.supabase)
      setMealLoggingService(loggingService)
      console.log('✅ [ConsumedMealsView] MealLoggingService initialized')
    }
  }, [db])
  
  const getMealImage = (meal) => {
    if (meal?.image_url) return meal.image_url
    
    const mealType = meal?.meal_type || 'meal'
    const fallbacks = {
      breakfast: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=100&h=100&fit=crop',
      lunch: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=100&h=100&fit=crop',
      dinner: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=100&h=100&fit=crop',
      snack: 'https://images.unsplash.com/photo-1490474504059-bf2db5ab2348?w=100&h=100&fit=crop',
      custom: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&h=100&fit=crop',
      custom_assembled: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&h=100&fit=crop',
      quick_add: 'https://images.unsplash.com/photo-1490474504059-bf2db5ab2348?w=100&h=100&fit=crop'
    }
    
    return fallbacks[mealType] || fallbacks.custom
  }

  // Calculate date for selected day
  useEffect(() => {
    const today = new Date()
    const todayIndex = getTodayIndex()
    const dayDiff = currentDay - todayIndex
    const targetDate = new Date(today)
    targetDate.setDate(today.getDate() + dayDiff)
    setSelectedDate(targetDate)
  }, [currentDay])

  // Load consumed meals for selected date
  useEffect(() => {
    if (client?.id && selectedDate) {
      loadConsumedMeals()
    }
  }, [client?.id, selectedDate])
  
  const loadConsumedMeals = async () => {
    setLoading(true)
    
    try {
      const dateStr = selectedDate.toISOString().split('T')[0]
      
      const { data, error } = await db.supabase
        .from('consumed_meals')
        .select('*')
        .eq('client_id', client.id)
        .gte('consumed_at', `${dateStr}T00:00:00`)
        .lt('consumed_at', `${dateStr}T23:59:59`)
        .order('consumed_at', { ascending: true })
      
      if (error) throw error
      
      const totals = {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0
      }
      
      data?.forEach(meal => {
        totals.calories += meal.calories || 0
        totals.protein += meal.protein || 0
        totals.carbs += meal.carbs || 0
        totals.fat += meal.fat || 0
      })
      
      setConsumedMeals(data || [])
      setDayTotals(totals)
      
    } catch (error) {
      console.error('❌ Error loading consumed meals:', error)
      setConsumedMeals([])
      setDayTotals({ calories: 0, protein: 0, carbs: 0, fat: 0 })
    } finally {
      setLoading(false)
    }
  }
  
  const handleDeleteMeal = async (mealId) => {
    if (!confirm('Weet je zeker dat je deze maaltijd wilt verwijderen?')) return
    
    try {
      const { error } = await db.supabase
        .from('consumed_meals')
        .delete()
        .eq('id', mealId)
      
      if (error) throw error
      
      await loadConsumedMeals()
      
    } catch (error) {
      console.error('❌ Error deleting meal:', error)
      alert('Er ging iets mis bij het verwijderen')
    }
  }
  
  const handlePreviousDay = () => {
    setCurrentDay(prev => prev === 0 ? 6 : prev - 1)
  }
  
  const handleNextDay = () => {
    setCurrentDay(prev => prev === 6 ? 0 : prev + 1)
  }

  const handleMealLogged = async () => {
    console.log('✅ [ConsumedMealsView] Meal logged - refreshing list')
    loadConsumedMeals()
    
    if (onMealLogged) {
      console.log('🔄 [ConsumedMealsView] Calling parent onMealLogged')
      await onMealLogged()
    }
  }

  const handleQuickIntake = async (intakeData) => {
    console.log('🍽️ [ConsumedMealsView] handleQuickIntake called with:', intakeData)
    try {
      await onQuickIntake(intakeData)
      setShowQuickIntakeModal(false)
      await loadConsumedMeals()
      console.log('✅ [ConsumedMealsView] Quick Intake saved successfully')
    } catch (error) {
      console.error('❌ [ConsumedMealsView] Quick Intake error:', error)
      alert('Opslaan mislukt. Probeer opnieuw.')
    }
  }
  
  const isToday = currentDay === getTodayIndex()
  
  return (
    <div style={{
      padding: isMobile ? '0.5rem 0.5rem 0.25rem' : '0.75rem 0.75rem 0.5rem',
      background: '#000',
      minHeight: '100vh'
    }}>
      {/* 🎨 PREMIUM HEADER - GREEN GRADIENT */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '0.625rem'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <div style={{
            width: isMobile ? '28px' : '32px',
            height: isMobile ? '28px' : '32px',
            borderRadius: '8px',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 12px rgba(16, 185, 129, 0.2)'
          }}>
            <Calendar 
              size={isMobile ? 14 : 16} 
              color="#10b981"
              style={{
                filter: 'drop-shadow(0 0 4px rgba(16, 185, 129, 0.6))'
              }}
            />
          </div>
          <div style={{
            fontSize: isMobile ? '1rem' : '1.25rem',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.02em',
            textTransform: 'uppercase'
          }}>
            Gegeten Maaltijden
          </div>
        </div>
      </div>
      
      {/* 🎨 PREMIUM DAY SELECTOR - GLASSMORPHIC */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(16, 185, 129, 0.04) 100%)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(16, 185, 129, 0.2)',
        borderRadius: isMobile ? '14px' : '16px',
        padding: isMobile ? '0.75rem' : '0.875rem',
        marginBottom: '0.75rem',
        boxShadow: '0 4px 16px rgba(16, 185, 129, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.03)'
      }}>
        {/* Date display */}
        <div style={{
          textAlign: 'center',
          marginBottom: '0.625rem',
          fontSize: isMobile ? '0.8rem' : '0.875rem',
          color: 'rgba(255, 255, 255, 0.7)',
          fontWeight: '600',
          textTransform: 'capitalize'
        }}>
          {formatDate(selectedDate)}
        </div>
        
        {/* Days row */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          {/* Previous button */}
          <button
            onClick={handlePreviousDay}
            style={{
              width: isMobile ? '32px' : '36px',
              height: isMobile ? '32px' : '36px',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              boxShadow: '0 0 8px rgba(16, 185, 129, 0.15)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)'
              e.currentTarget.style.boxShadow = '0 0 16px rgba(16, 185, 129, 0.3)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'
              e.currentTarget.style.boxShadow = '0 0 8px rgba(16, 185, 129, 0.15)'
            }}
          >
            <ChevronLeft size={isMobile ? 16 : 18} color="#10b981" />
          </button>
          
          {/* Day pills */}
          <div style={{
            display: 'flex',
            gap: isMobile ? '0.375rem' : '0.5rem',
            flex: 1,
            justifyContent: 'center'
          }}>
            {daysOfWeek.map((day) => (
              <button
                key={day.id}
                onClick={() => setCurrentDay(day.id)}
                style={{
                  flex: 1,
                  maxWidth: isMobile ? '36px' : '44px',
                  height: isMobile ? '36px' : '44px',
                  borderRadius: '10px',
                  background: day.id === currentDay
                    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                    : 'rgba(255, 255, 255, 0.03)',
                  border: day.id === currentDay
                    ? '1px solid rgba(16, 185, 129, 0.4)'
                    : '1px solid rgba(255, 255, 255, 0.08)',
                  color: day.id === currentDay ? 'white' : 'rgba(255, 255, 255, 0.5)',
                  fontSize: isMobile ? '0.75rem' : '0.8rem',
                  fontWeight: day.id === currentDay ? '800' : '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  boxShadow: day.id === currentDay
                    ? '0 0 16px rgba(16, 185, 129, 0.4)'
                    : 'none',
                  textTransform: 'uppercase',
                  letterSpacing: '-0.02em'
                }}
                onMouseEnter={(e) => {
                  if (day.id !== currentDay) {
                    e.currentTarget.style.background = 'rgba(16, 185, 129, 0.15)'
                    e.currentTarget.style.color = '#10b981'
                  }
                }}
                onMouseLeave={(e) => {
                  if (day.id !== currentDay) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
                    e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)'
                  }
                }}
              >
                {day.name}
              </button>
            ))}
          </div>
          
          {/* Next button */}
          <button
            onClick={handleNextDay}
            style={{
              width: isMobile ? '32px' : '36px',
              height: isMobile ? '32px' : '36px',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              boxShadow: '0 0 8px rgba(16, 185, 129, 0.15)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)'
              e.currentTarget.style.boxShadow = '0 0 16px rgba(16, 185, 129, 0.3)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'
              e.currentTarget.style.boxShadow = '0 0 8px rgba(16, 185, 129, 0.15)'
            }}
          >
            <ChevronRight size={isMobile ? 16 : 18} color="#10b981" />
          </button>
        </div>
      </div>

      {/* 🎨 PREMIUM MACRO TOTALS - COMPACT GLASSMORPHIC */}
      {targets && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.8) 0%, rgba(23, 23, 23, 0.6) 100%)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: isMobile ? '12px' : '14px',
          padding: isMobile ? '0.625rem 0.75rem' : '0.75rem 0.875rem',
          marginBottom: '0.75rem',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.03)'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: isMobile ? '0.5rem' : '0.625rem'
          }}>
            <MacroProgress 
              icon={Flame}
              current={dayTotals.calories}
              target={targets.calories}
              label="kcal"
              color="#10b981"
              isMobile={isMobile}
            />
            <MacroProgress 
              icon={Target}
              current={dayTotals.protein}
              target={targets.protein}
              label="P"
              color="#8b5cf6"
              isMobile={isMobile}
            />
            <MacroProgress 
              icon={Zap}
              current={dayTotals.carbs}
              target={targets.carbs}
              label="C"
              color="#ef4444"
              isMobile={isMobile}
            />
            <MacroProgress 
              icon={Droplets}
              current={dayTotals.fat}
              target={targets.fat}
              label="F"
              color="#3b82f6"
              isMobile={isMobile}
            />
          </div>
        </div>
      )}

      {/* 🎨 ACTION BUTTONS - COMPACT */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '0.75rem'
      }}>
        <button
          onClick={() => setShowLogModal(true)}
          style={{
            flex: 1,
            padding: isMobile ? '0.625rem' : '0.75rem',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '10px',
            color: 'white',
            fontWeight: '700',
            fontSize: isMobile ? '0.8rem' : '0.875rem',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            minHeight: '44px',
            boxShadow: '0 0 16px rgba(16, 185, 129, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.375rem',
            textTransform: 'uppercase',
            letterSpacing: '-0.01em'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)'
            e.currentTarget.style.boxShadow = '0 0 24px rgba(16, 185, 129, 0.5)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 0 16px rgba(16, 185, 129, 0.3)'
          }}
        >
          <Plus size={isMobile ? 14 : 16} />
          Maaltijd Loggen
        </button>
        
        <button
          onClick={() => setShowQuickIntakeModal(true)}
          style={{
            flex: 1,
            padding: isMobile ? '0.625rem' : '0.75rem',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '10px',
            color: '#10b981',
            fontWeight: '700',
            fontSize: isMobile ? '0.8rem' : '0.875rem',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            minHeight: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.375rem',
            textTransform: 'uppercase',
            letterSpacing: '-0.01em'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(16, 185, 129, 0.25)'
            e.currentTarget.style.transform = 'translateY(-1px)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(16, 185, 129, 0.15)'
            e.currentTarget.style.transform = 'translateY(0)'
          }}
        >
          <Zap size={isMobile ? 14 : 16} />
          Quick Intake
        </button>
      </div>

      {/* 🎨 MEALS LIST - COMPACT CARDS */}
      {loading ? (
        <div style={{
          textAlign: 'center',
          padding: '2rem',
          color: 'rgba(255, 255, 255, 0.5)',
          fontSize: '0.875rem'
        }}>
          Laden...
        </div>
      ) : consumedMeals.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: isMobile ? '2rem 1rem' : '2.5rem 1.5rem',
          background: 'rgba(16, 185, 129, 0.04)',
          border: '1px solid rgba(16, 185, 129, 0.15)',
          borderRadius: '12px',
          color: 'rgba(255, 255, 255, 0.5)',
          fontSize: isMobile ? '0.875rem' : '0.95rem'
        }}>
          Nog geen maaltijden gelogd voor deze dag
        </div>
      ) : (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: isMobile ? '0.5rem' : '0.625rem'
        }}>
          {consumedMeals.map(meal => (
            <ConsumedMealCard
              key={meal.id}
              meal={meal}
              onDelete={() => handleDeleteMeal(meal.id)}
              isMobile={isMobile}
              getMealImage={getMealImage}
            />
          ))}
        </div>
      )}

      {/* MEAL LOGGING MODAL */}
      {showLogModal && mealLoggingService && (
        <MealLoggingWizard
          db={db}
          client={client}
          onClose={() => setShowLogModal(false)}
          onMealLogged={handleMealLogged}
          mealLoggingService={mealLoggingService}
        />
      )}

      {/* 🎨 PREMIUM QUICK INTAKE MODAL - FLOATING BUTTONS */}
      {showQuickIntakeModal && (
        <QuickIntakeModal
          onClose={() => setShowQuickIntakeModal(false)}
          onSave={handleQuickIntake}
          targets={targets}
          isMobile={isMobile}
        />
      )}
    </div>
  )
}

// 🎨 PREMIUM QUICK INTAKE MODAL - PERCENTAGE + EXACT MODE + FLOATING BUTTONS
const QuickIntakeModal = ({ onClose, onSave, targets, isMobile }) => {
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
    { label: '75%', value: 75, color: '#3b82f6' },
    { label: '50%', value: 50, color: '#f59e0b' },
    { label: '25%', value: 25, color: '#ef4444' }
  ]

  const handleSave = () => {
    if (selectedType === 'percentage') {
      const intakeData = {
        type: 'percentage',
        percentage: percentage,
        calories: Math.round((targets?.calories || 0) * (percentage / 100)),
        protein: Math.round((targets?.protein || 0) * (percentage / 100)),
        carbs: Math.round((targets?.carbs || 0) * (percentage / 100)),
        fat: Math.round((targets?.fat || 0) * (percentage / 100))
      }
      onSave(intakeData)
    } else {
      const cals = parseFloat(exactValues.calories) || 0
      if (cals === 0) {
        alert('Calorieën zijn verplicht')
        return
      }
      onSave({
        type: 'exact',
        calories: cals,
        protein: parseFloat(exactValues.protein) || 0,
        carbs: parseFloat(exactValues.carbs) || 0,
        fat: parseFloat(exactValues.fat) || 0
      })
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: isMobile ? '1rem' : '1.5rem'
    }}>
      {/* Modal container */}
      <div style={{
        background: '#111',
        border: '1px solid rgba(16, 185, 129, 0.25)',
        borderRadius: isMobile ? '16px' : '20px',
        width: '100%',
        maxWidth: '480px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(16, 185, 129, 0.2)',
        overflow: 'hidden'
      }}>
        {/* Scrollable content area */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: isMobile ? '1.25rem' : '1.5rem',
          paddingBottom: isMobile ? '6rem' : '6.5rem' // More space for percentage grid + buttons
        }}>
          {/* Header */}
          <div style={{
            marginBottom: '0.875rem'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.375rem'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 12px rgba(16, 185, 129, 0.2)'
              }}>
                <Zap 
                  size={16} 
                  color="#10b981"
                  fill="#10b981"
                  style={{ filter: 'drop-shadow(0 0 4px rgba(16, 185, 129, 0.6))' }}
                />
              </div>
              <h3 style={{
                fontSize: isMobile ? '1.125rem' : '1.25rem',
                fontWeight: '800',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.02em',
                textTransform: 'uppercase',
                margin: 0
              }}>
                Quick Intake
              </h3>
            </div>
            <p style={{
              fontSize: isMobile ? '0.8rem' : '0.875rem',
              color: 'rgba(255, 255, 255, 0.6)',
              fontWeight: '500',
              margin: 0
            }}>
              Log snel je voedingsinname
            </p>
          </div>

          {/* 🎯 MODE TOGGLE - Percentage vs Exact */}
          <div style={{
            display: 'flex',
            gap: '0.625rem',
            marginBottom: '1rem'
          }}>
            <button
              onClick={() => setSelectedType('percentage')}
              style={{
                flex: 1,
                padding: isMobile ? '0.625rem' : '0.75rem',
                background: selectedType === 'percentage'
                  ? 'rgba(16, 185, 129, 0.2)'
                  : 'rgba(255, 255, 255, 0.05)',
                border: selectedType === 'percentage'
                  ? '1px solid rgba(16, 185, 129, 0.4)'
                  : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                color: selectedType === 'percentage' ? '#10b981' : 'rgba(255, 255, 255, 0.5)',
                fontWeight: '700',
                fontSize: isMobile ? '0.8rem' : '0.875rem',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                minHeight: '44px',
                textTransform: 'uppercase',
                letterSpacing: '-0.01em',
                boxShadow: selectedType === 'percentage'
                  ? '0 0 16px rgba(16, 185, 129, 0.3)'
                  : 'none'
              }}
              onMouseEnter={(e) => {
                if (selectedType !== 'percentage') {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
                }
              }}
              onMouseLeave={(e) => {
                if (selectedType !== 'percentage') {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                }
              }}
            >
              Percentage
            </button>
            <button
              onClick={() => setSelectedType('exact')}
              style={{
                flex: 1,
                padding: isMobile ? '0.625rem' : '0.75rem',
                background: selectedType === 'exact'
                  ? 'rgba(16, 185, 129, 0.2)'
                  : 'rgba(255, 255, 255, 0.05)',
                border: selectedType === 'exact'
                  ? '1px solid rgba(16, 185, 129, 0.4)'
                  : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                color: selectedType === 'exact' ? '#10b981' : 'rgba(255, 255, 255, 0.5)',
                fontWeight: '700',
                fontSize: isMobile ? '0.8rem' : '0.875rem',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                minHeight: '44px',
                textTransform: 'uppercase',
                letterSpacing: '-0.01em',
                boxShadow: selectedType === 'exact'
                  ? '0 0 16px rgba(16, 185, 129, 0.3)'
                  : 'none'
              }}
              onMouseEnter={(e) => {
                if (selectedType !== 'exact') {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
                }
              }}
              onMouseLeave={(e) => {
                if (selectedType !== 'exact') {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                }
              }}
            >
              Exacte Waardes
            </button>
          </div>

          {/* 🎯 PERCENTAGE MODE - Grid of percentage buttons */}
          {selectedType === 'percentage' ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: isMobile ? '0.625rem' : '0.75rem'
            }}>
              {percentageOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => setPercentage(option.value)}
                  style={{
                    padding: isMobile ? '1.25rem 0.875rem' : '1.5rem 1rem',
                    background: percentage === option.value
                      ? `linear-gradient(135deg, ${option.color}20 0%, ${option.color}10 100%)`
                      : 'rgba(255, 255, 255, 0.03)',
                    backdropFilter: percentage === option.value ? 'blur(12px)' : 'none',
                    border: percentage === option.value
                      ? `2px solid ${option.color}60`
                      : '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    textAlign: 'center',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent',
                    minHeight: '44px',
                    boxShadow: percentage === option.value
                      ? `0 8px 24px ${option.color}30, inset 0 1px 0 rgba(255, 255, 255, 0.05)`
                      : 'none',
                    transform: percentage === option.value ? 'scale(1.02)' : 'scale(1)'
                  }}
                  onMouseEnter={(e) => {
                    if (percentage !== option.value) {
                      e.currentTarget.style.background = `${option.color}15`
                      e.currentTarget.style.transform = 'scale(1.01)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (percentage !== option.value) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
                      e.currentTarget.style.transform = 'scale(1)'
                    }
                  }}
                >
                  <div style={{
                    fontSize: isMobile ? '1.75rem' : '2rem',
                    fontWeight: '800',
                    color: percentage === option.value ? option.color : 'rgba(255, 255, 255, 0.5)',
                    marginBottom: '0.375rem',
                    textShadow: percentage === option.value
                      ? `0 0 20px ${option.color}60`
                      : 'none',
                    letterSpacing: '-0.02em'
                  }}>
                    {option.label}
                  </div>
                  {targets && (
                    <div style={{
                      fontSize: isMobile ? '0.7rem' : '0.75rem',
                      color: percentage === option.value 
                        ? `${option.color}cc`
                        : 'rgba(255, 255, 255, 0.4)',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      letterSpacing: '0.03em'
                    }}>
                      {Math.round((targets.calories || 0) * (option.value / 100))} kcal
                    </div>
                  )}
                </button>
              ))}
            </div>
          ) : (
            /* 🎯 EXACT MODE - Input fields */
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}>
              <QuickIntakeField
                icon={Flame}
                label="Calorieën"
                value={exactValues.calories}
                onChange={(val) => setExactValues(prev => ({ ...prev, calories: val }))}
                color="#10b981"
                required
                isMobile={isMobile}
              />
              <QuickIntakeField
                icon={Target}
                label="Protein (g)"
                value={exactValues.protein}
                onChange={(val) => setExactValues(prev => ({ ...prev, protein: val }))}
                color="#8b5cf6"
                isMobile={isMobile}
              />
              <QuickIntakeField
                icon={Zap}
                label="Koolhydraten (g)"
                value={exactValues.carbs}
                onChange={(val) => setExactValues(prev => ({ ...prev, carbs: val }))}
                color="#ef4444"
                isMobile={isMobile}
              />
              <QuickIntakeField
                icon={Droplets}
                label="Vetten (g)"
                value={exactValues.fat}
                onChange={(val) => setExactValues(prev => ({ ...prev, fat: val }))}
                color="#3b82f6"
                isMobile={isMobile}
              />
            </div>
          )}
        </div>

        {/* 🎯 FLOATING BOTTOM BUTTONS - GLASSMORPHIC CONTAINER */}
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: isMobile ? '1rem' : 'auto',
          right: isMobile ? '1rem' : 'auto',
          width: isMobile ? 'calc(100% - 2rem)' : '448px',
          maxWidth: '448px',
          background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.95) 0%, rgba(23, 23, 23, 0.9) 100%)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(16, 185, 129, 0.2)',
          borderRadius: isMobile ? '16px 16px 0 0' : '20px 20px 0 0',
          padding: isMobile ? '0.875rem 1rem 1rem' : '1rem 1.25rem 1.25rem',
          boxShadow: '0 -8px 32px rgba(16, 185, 129, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
          zIndex: 10000
        }}>
          {/* Top accent glow */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: 'linear-gradient(90deg, transparent 0%, #10b981 50%, transparent 100%)',
            opacity: 0.6
          }} />

          <div style={{
            display: 'flex',
            gap: '0.625rem'
          }}>
            {/* Cancel button */}
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: isMobile ? '0.75rem' : '0.875rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '10px',
                color: 'rgba(255, 255, 255, 0.6)',
                fontWeight: '700',
                fontSize: isMobile ? '0.85rem' : '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                minHeight: '44px',
                textTransform: 'uppercase',
                letterSpacing: '-0.01em'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)'
                e.currentTarget.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              Annuleren
            </button>

            {/* Save button - GREEN GLOW */}
            <button
              onClick={handleSave}
              style={{
                flex: 1,
                padding: isMobile ? '0.75rem' : '0.875rem',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                borderRadius: '10px',
                color: 'white',
                fontWeight: '800',
                fontSize: isMobile ? '0.85rem' : '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                minHeight: '44px',
                boxShadow: '0 0 20px rgba(16, 185, 129, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                textTransform: 'uppercase',
                letterSpacing: '-0.01em'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 0 32px rgba(16, 185, 129, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 0 20px rgba(16, 185, 129, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              Opslaan
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Input field component
const QuickIntakeField = ({ icon: Icon, label, value, onChange, color, required, isMobile }) => (
  <div style={{
    background: 'rgba(255, 255, 255, 0.03)',
    border: `1px solid ${color}33`,
    borderRadius: '10px',
    padding: isMobile ? '0.75rem' : '0.875rem',
    transition: 'all 0.3s ease'
  }}>
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      marginBottom: '0.5rem'
    }}>
      <Icon size={14} color={color} />
      <label style={{
        fontSize: '0.75rem',
        color: color,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: '0.03em'
      }}>
        {label} {required && '*'}
      </label>
    </div>
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="0"
      style={{
        width: '100%',
        background: 'rgba(0, 0, 0, 0.4)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '8px',
        padding: isMobile ? '0.625rem 0.75rem' : '0.75rem 0.875rem',
        color: 'white',
        fontSize: isMobile ? '0.95rem' : '1rem',
        fontWeight: '600',
        outline: 'none',
        transition: 'all 0.3s ease'
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = color
        e.currentTarget.style.boxShadow = `0 0 12px ${color}40`
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    />
  </div>
)

// 🎨 PREMIUM CONSUMED MEAL CARD - COMPACT GREEN
const ConsumedMealCard = ({ 
  meal, 
  onDelete, 
  isMobile, 
  getMealImage
}) => {
  const [isHovered, setIsHovered] = useState(false)
  
  const getMealTypeLabel = (type) => {
    const labels = {
      breakfast: 'Ontbijt',
      lunch: 'Lunch',
      dinner: 'Diner',
      snack: 'Snack',
      custom: 'Custom Maaltijd',
      custom_assembled: 'Samengesteld',
      quick_add: 'Quick Add',
      existing_meal_flow: 'Bestaande Maaltijd',
      new_meal_flow: 'Nieuwe Maaltijd'
    }
    return labels[type] || 'Maaltijd'
  }
  
  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(16, 185, 129, 0.04) 100%)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(16, 185, 129, 0.2)',
        borderRadius: '10px',
        padding: isMobile ? '0.75rem' : '0.875rem',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        boxShadow: isHovered 
          ? '0 4px 20px rgba(16, 185, 129, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.05)' 
          : '0 2px 8px rgba(16, 185, 129, 0.08)',
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)'
      }}
    >
      <div style={{
        display: 'flex',
        gap: isMobile ? '0.75rem' : '0.875rem',
        alignItems: 'flex-start'
      }}>
        {/* Image with green border */}
        <div style={{
          width: isMobile ? '48px' : '56px',
          height: isMobile ? '48px' : '56px',
          borderRadius: '8px',
          background: `url(${getMealImage(meal)}) center/cover`,
          border: '2px solid rgba(16, 185, 129, 0.3)',
          flexShrink: 0,
          boxShadow: '0 0 12px rgba(16, 185, 129, 0.2)'
        }} />
        
        <div style={{ 
          flex: 1, 
          minWidth: 0,
          overflow: 'hidden'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '0.375rem',
            minWidth: 0
          }}>
            <div style={{ 
              flex: 1, 
              minWidth: 0,
              overflow: 'hidden'
            }}>
              <div style={{
                fontSize: '0.65rem',
                color: 'rgba(16, 185, 129, 0.7)',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '0.125rem'
              }}>
                {getMealTypeLabel(meal.meal_type || meal.source)}
              </div>
              <div style={{
                fontSize: isMobile ? '0.9rem' : '1rem',
                fontWeight: '700',
                color: 'white',
                lineHeight: 1.2,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {truncateMealName(meal.meal_name, isMobile ? 18 : 28)}
              </div>
            </div>
            
            {/* Time badge - green */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              padding: '0.25rem 0.375rem',
              background: 'rgba(16, 185, 129, 0.15)',
              borderRadius: '6px',
              fontSize: '0.65rem',
              color: '#10b981',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              flexShrink: 0,
              marginLeft: '0.5rem',
              fontWeight: '700',
              boxShadow: '0 0 8px rgba(16, 185, 129, 0.15)'
            }}>
              <Clock size={10} />
              {formatTime(meal.consumed_at)}
            </div>
          </div>
          
          {/* Macro badges */}
          <div style={{
            display: 'flex',
            gap: isMobile ? '0.5rem' : '0.625rem',
            marginBottom: onDelete ? '0.5rem' : 0
          }}>
            <MacroBadge icon={Flame} value={meal.calories} label="kcal" color="#10b981" isMobile={isMobile} />
            <MacroBadge icon={Target} value={meal.protein} label="P" color="#8b5cf6" isMobile={isMobile} />
            <MacroBadge icon={Zap} value={meal.carbs} label="C" color="#ef4444" isMobile={isMobile} />
            <MacroBadge icon={Droplets} value={meal.fat} label="F" color="#3b82f6" isMobile={isMobile} />
          </div>
          
          {/* Delete button */}
          {onDelete && (
            <button
              onClick={onDelete}
              style={{
                marginTop: '0.5rem',
                padding: '0.375rem 0.75rem',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '6px',
                color: '#ef4444',
                fontSize: '0.7rem',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                textTransform: 'uppercase',
                letterSpacing: '0.02em'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'
                e.currentTarget.style.transform = 'translateX(2px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'
                e.currentTarget.style.transform = 'translateX(0)'
              }}
            >
              <Trash2 size={11} />
              Verwijder
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// Macro badge component
const MacroBadge = ({ icon: Icon, value, label, color, isMobile }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    padding: isMobile ? '0.25rem 0.375rem' : '0.25rem 0.5rem',
    background: 'rgba(0, 0, 0, 0.4)',
    borderRadius: '6px',
    border: `1px solid ${color}33`,
    fontSize: isMobile ? '0.7rem' : '0.75rem'
  }}>
    <Icon size={isMobile ? 10 : 11} color={color} />
    <span style={{
      fontWeight: '700',
      color: color
    }}>
      {Math.round(value || 0)}
    </span>
    <span style={{
      color: `${color}99`,
      fontSize: '0.65rem',
      fontWeight: '600'
    }}>
      {label}
    </span>
  </div>
)

// Macro progress component
const MacroProgress = ({ icon: Icon, current, target, label, color, isMobile }) => {
  const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '0.375rem'
    }}>
      <div style={{
        width: isMobile ? '28px' : '32px',
        height: isMobile ? '28px' : '32px',
        borderRadius: '8px',
        background: `${color}15`,
        border: `1px solid ${color}40`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: `0 0 8px ${color}20`
      }}>
        <Icon size={isMobile ? 13 : 15} color={color} />
      </div>
      
      <div style={{
        fontSize: isMobile ? '0.75rem' : '0.8rem',
        fontWeight: '800',
        color: 'white',
        textAlign: 'center',
        lineHeight: 1
      }}>
        {Math.round(current)}
      </div>
      
      <div style={{
        fontSize: '0.65rem',
        color: `${color}cc`,
        fontWeight: '600',
        textTransform: 'uppercase'
      }}>
        {label}
      </div>
      
      {/* Progress bar */}
      <div style={{
        width: '100%',
        height: '3px',
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '2px',
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${percentage}%`,
          height: '100%',
          background: `linear-gradient(90deg, ${color} 0%, ${color}dd 100%)`,
          borderRadius: '2px',
          transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: `0 0 8px ${color}60`
        }} />
      </div>
    </div>
  )
}
