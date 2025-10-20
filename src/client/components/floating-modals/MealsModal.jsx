// src/client/components/floating-modals/MealsModal.jsx
import { useState, useEffect } from 'react'
import { X, CheckCircle, Plus } from 'lucide-react'

export default function MealsModal({ db, client, onClose, onRefresh }) {
  const isMobile = window.innerWidth <= 768
  
  const [loading, setLoading] = useState(false)
  const [mealsData, setMealsData] = useState({
    breakfast: false,
    lunch: false,
    dinner: false,
    snack: false,
    totalMeals: 0
  })
  
  useEffect(() => {
    loadMealsData()
  }, [client?.id])
  
  async function loadMealsData() {
    const today = new Date().toISOString().split('T')[0]
    
    try {
      const { data } = await db.supabase
        .from('ai_meal_progress')
        .select('consumed_meals, meals_consumed')
        .eq('client_id', client.id)
        .eq('date', today)
        .single()
      
      if (data) {
        const consumed = data.consumed_meals || {}
        setMealsData({
          breakfast: consumed.breakfast?.consumed || false,
          lunch: consumed.lunch?.consumed || false,
          dinner: consumed.dinner?.consumed || false,
          snack: consumed.snack?.consumed || false,
          totalMeals: data.meals_consumed || 0
        })
      }
    } catch (error) {
      console.error('Meals data error:', error)
    }
  }
  
  async function handleMealCheck(mealType) {
    setLoading(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      
      const { data: current } = await db.supabase
        .from('ai_meal_progress')
        .select('consumed_meals')
        .eq('client_id', client.id)
        .eq('date', today)
        .single()
      
      const consumed = current?.consumed_meals || {}
      consumed[mealType] = { consumed: true, timestamp: new Date().toISOString() }
      
      await db.supabase
        .from('ai_meal_progress')
        .upsert({
          client_id: client.id,
          date: today,
          consumed_meals: consumed,
          meals_consumed: Object.keys(consumed).length,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'client_id,date'
        })
      
      await loadMealsData()
      onRefresh()
    } catch (error) {
      console.error('Meal check failed:', error)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div style={{
      position: 'fixed',
      right: 0,
      top: '50%',
      transform: 'translateY(-50%)',
      width: isMobile ? '85vw' : '320px',
      maxWidth: '320px',
      maxHeight: '80vh',
      background: 'rgba(17, 17, 17, 0.95)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderLeft: '0.5px solid rgba(255, 255, 255, 0.08)',
      borderRadius: '16px 0 0 16px',
      boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.3)',
      zIndex: 999,
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: isMobile ? '1.25rem' : '1.5rem',
        borderBottom: '0.5px solid rgba(255, 255, 255, 0.05)',
        background: 'rgba(0, 0, 0, 0.2)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h3 style={{
            margin: 0,
            fontSize: isMobile ? '1rem' : '1.1rem',
            fontWeight: '700',
            color: 'rgba(255, 255, 255, 0.9)',
            marginBottom: '0.25rem'
          }}>
            Meal Tracker
          </h3>
          <p style={{
            margin: 0,
            fontSize: isMobile ? '0.7rem' : '0.75rem',
            color: 'rgba(255, 255, 255, 0.4)'
          }}>
            Quick log je maaltijden
          </p>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: '0.5px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '8px',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <X size={16} color="rgba(255, 255, 255, 0.4)" />
        </button>
      </div>
      
      {/* Content */}
      <div style={{
        padding: isMobile ? '1.25rem' : '1.5rem',
        overflowY: 'auto',
        maxHeight: 'calc(80vh - 100px)'
      }}>
        {/* Progress Bar */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '10px',
          padding: '1rem',
          border: '0.5px solid rgba(255, 255, 255, 0.05)',
          marginBottom: '1.25rem'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '0.75rem'
          }}>
            <span style={{ 
              color: 'rgba(255,255,255,0.6)', 
              fontSize: '0.85rem'
            }}>
              Vandaag's Voortgang
            </span>
            <span style={{ 
              fontSize: '1rem',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.9)'
            }}>
              {mealsData.totalMeals}/4
            </span>
          </div>
          
          <div style={{
            height: '6px',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              width: `${(mealsData.totalMeals / 4) * 100}%`,
              background: mealsData.totalMeals === 4
                ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)'
                : 'linear-gradient(90deg, rgba(249, 115, 22, 0.8) 0%, rgba(249, 115, 22, 0.6) 100%)',
              transition: 'width 0.6s ease'
            }} />
          </div>
        </div>
        
        {/* Meal Buttons */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '0.75rem'
        }}>
          {['breakfast', 'lunch', 'dinner', 'snack'].map(meal => (
            <button
              key={meal}
              onClick={() => !mealsData[meal] && handleMealCheck(meal)}
              disabled={mealsData[meal] || loading}
              style={{
                background: mealsData[meal]
                  ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.08) 100%)'
                  : 'rgba(0, 0, 0, 0.3)',
                border: mealsData[meal]
                  ? '0.5px solid rgba(16, 185, 129, 0.2)'
                  : '0.5px solid rgba(255, 255, 255, 0.05)',
                borderRadius: '10px',
                padding: '1rem',
                color: mealsData[meal] ? '#10b981' : 'rgba(255,255,255,0.7)',
                fontSize: '0.85rem',
                fontWeight: '500',
                cursor: mealsData[meal] ? 'default' : 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.375rem',
                minHeight: '56px',
                opacity: loading ? 0.7 : 1,
                textTransform: 'capitalize'
              }}
            >
              {mealsData[meal] ? (
                <CheckCircle size={18} strokeWidth={2} />
              ) : (
                <Plus size={18} strokeWidth={2} />
              )}
              {meal}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
