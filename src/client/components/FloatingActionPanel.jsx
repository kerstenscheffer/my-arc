// src/client/components/FloatingActionPanel.jsx
import { useState, useEffect, useRef } from 'react'
import { Activity, Utensils, TrendingUp, Target } from 'lucide-react'
import WorkoutModal from './floating-modals/WorkoutModal'
import MealsModal from './floating-modals/MealsModal'
import DailyModal from './floating-modals/DailyModal'
import GoalProgressModal from './floating-modals/GoalProgressModal'

export default function FloatingActionPanel({ db, client, onNavigate }) {
  const isMobile = window.innerWidth <= 768
  
  const [activeWidget, setActiveWidget] = useState(null)
  const [badges, setBadges] = useState({
    workout: 0,
    meals: 0,
    daily: false,
    goal: false
  })
  const panelRef = useRef(null)
  
  // Load badges
  useEffect(() => {
    if (client?.id) {
      loadBadges()
      const interval = setInterval(loadBadges, 60000)
      return () => clearInterval(interval)
    }
  }, [client?.id])
  
  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setActiveWidget(null)
      }
    }
    
    if (activeWidget) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside)
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [activeWidget])
  
  // Prevent body scroll when open
  useEffect(() => {
    if (activeWidget && isMobile) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'auto'
    }
  }, [activeWidget, isMobile])
  
  async function loadBadges() {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      // Workout badge
      const { data: workout } = await db.supabase
        .from('workout_completions')
        .select('completed')
        .eq('client_id', client.id)
        .eq('workout_date', today)
        .single()
      
      // Meals badge
      const { data: meals } = await db.supabase
        .from('ai_meal_progress')
        .select('consumed_meals')
        .eq('client_id', client.id)
        .eq('date', today)
        .single()
      
      const consumed = meals?.consumed_meals || {}
      const uncheckedMeals = [
        !consumed.breakfast?.consumed,
        !consumed.lunch?.consumed,
        !consumed.dinner?.consumed,
        !consumed.snack?.consumed
      ].filter(Boolean).length
      
      // Daily badge
      const dayOfWeek = new Date().getDay()
      const isPhotoDay = [1, 3, 5].includes(dayOfWeek)
      const isWeightDay = [2, 4, 6].includes(dayOfWeek)
      let dailyCompleted = false
      
      if (isPhotoDay) {
        const { data } = await db.supabase
          .from('progress_photos')
          .select('id')
          .eq('client_id', client.id)
          .eq('date', today)
          .limit(1)
        dailyCompleted = data && data.length > 0
      } else if (isWeightDay) {
        const { data } = await db.supabase
          .from('weight_challenge_logs')
          .select('weight')
          .eq('client_id', client.id)
          .eq('date', today)
          .single()
        dailyCompleted = !!data
      }
      
      // Goal badge - check if logged today
      const { data: goalLog } = await db.supabase
        .from('weight_challenge_logs')
        .select('id')
        .eq('client_id', client.id)
        .eq('date', today)
        .limit(1)
      
      setBadges({
        workout: !workout?.completed,
        meals: uncheckedMeals,
        daily: !dailyCompleted,
        goal: !goalLog || goalLog.length === 0
      })
      
    } catch (error) {
      console.error('Error loading badges:', error)
    }
  }
  
  const widgets = [
    {
      id: 'workout',
      icon: Activity,
      color: '#f97316',
      label: 'Workout'
    },
    {
      id: 'meals',
      icon: Utensils,
      color: '#10b981',
      label: 'Meals'
    },
    {
      id: 'daily',
      icon: TrendingUp,
      color: '#3b82f6',
      label: 'Check-in'
    },
    {
      id: 'goal',
      icon: Target,
      color: '#dc2626',
      label: 'Goal'
    }
  ]
  
  return (
    <>
      {/* 4 Floating Buttons */}
      {widgets.map((widget, index) => (
        <button
          key={widget.id}
          onClick={() => setActiveWidget(activeWidget === widget.id ? null : widget.id)}
          style={{
            position: 'fixed',
            right: 0,
            top: `${120 + (index * 56)}px`,
            width: isMobile ? '44px' : '48px',
            height: isMobile ? '44px' : '48px',
            borderRadius: '50%',
            background: activeWidget === widget.id 
              ? `linear-gradient(135deg, ${widget.color}20 0%, ${widget.color}10 100%)`
              : 'rgba(17, 17, 17, 0.7)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: activeWidget === widget.id 
              ? `0.5px solid ${widget.color}40`
              : '0.5px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            zIndex: 998,
            boxShadow: activeWidget === widget.id 
              ? `0 4px 12px ${widget.color}20`
              : '0 2px 8px rgba(0, 0, 0, 0.2)',
            transform: `translateX(${isMobile ? '8px' : '10px'})`,
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent'
          }}
          onMouseEnter={(e) => {
            if (!isMobile && activeWidget !== widget.id) {
              e.currentTarget.style.transform = 'translateX(6px)'
              e.currentTarget.style.background = 'rgba(17, 17, 17, 0.85)'
              e.currentTarget.style.borderColor = `${widget.color}30`
            }
          }}
          onMouseLeave={(e) => {
            if (!isMobile && activeWidget !== widget.id) {
              e.currentTarget.style.transform = 'translateX(10px)'
              e.currentTarget.style.background = 'rgba(17, 17, 17, 0.7)'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'
            }
          }}
        >
          <widget.icon 
            size={isMobile ? 18 : 20} 
            color={activeWidget === widget.id ? widget.color : 'rgba(255, 255, 255, 0.6)'}
            strokeWidth={2}
          />
          
          {/* Badge */}
          {badges[widget.id] > 0 && (
            <div style={{
              position: 'absolute',
              top: '-2px',
              left: '-2px',
              background: '#ef4444',
              color: '#fff',
              borderRadius: '50%',
              width: '14px',
              height: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.6rem',
              fontWeight: '700',
              border: '1.5px solid rgba(0, 0, 0, 0.3)',
              boxShadow: '0 1px 4px rgba(239, 68, 68, 0.5)'
            }}>
              {typeof badges[widget.id] === 'number' && badges[widget.id] < 10 ? badges[widget.id] : '•'}
            </div>
          )}
        </button>
      ))}
      
      {/* Render Active Modal */}
      <div ref={panelRef}>
        {activeWidget === 'workout' && (
          <WorkoutModal
            db={db}
            client={client}
            onClose={() => setActiveWidget(null)}
            onRefresh={loadBadges}
          />
        )}
        
        {activeWidget === 'meals' && (
          <MealsModal
            db={db}
            client={client}
            onClose={() => setActiveWidget(null)}
            onRefresh={loadBadges}
          />
        )}
        
        {activeWidget === 'daily' && (
          <DailyModal
            db={db}
            client={client}
            onNavigate={onNavigate}
            onClose={() => setActiveWidget(null)}
            onRefresh={loadBadges}
          />
        )}
        
        {activeWidget === 'goal' && (
          <GoalProgressModal
            db={db}
            client={client}
            onClose={() => setActiveWidget(null)}
            onRefresh={loadBadges}
          />
        )}
      </div>
    </>
  )
}
