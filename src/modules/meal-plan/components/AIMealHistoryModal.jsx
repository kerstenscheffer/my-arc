// src/modules/meal-plan/components/AIMealHistoryModal.jsx
import React, { useState, useEffect } from 'react'
import { 
  X, Calendar, TrendingUp, BarChart3, Clock, Flame, Target, 
  Droplets, Award, Download, ChevronLeft, ChevronRight, Info,
  Zap, Activity, PieChart, Filter, Search, Star
} from 'lucide-react'

export default function AIMealHistoryModal({ 
  isOpen, 
  onClose, 
  db,
  clientId,
  service 
}) {
  const isMobile = window.innerWidth <= 768
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('week') // week, month, all
  const [historyData, setHistoryData] = useState([])
  const [stats, setStats] = useState(null)
  const [selectedDay, setSelectedDay] = useState(null)
  
  useEffect(() => {
    if (isOpen) {
      loadHistoryData()
    }
  }, [isOpen, period])
  
  const loadHistoryData = async () => {
    setLoading(true)
    try {
      // Determine date range
      const endDate = new Date()
      const startDate = new Date()
      
      switch(period) {
        case 'week':
          startDate.setDate(startDate.getDate() - 7)
          break
        case 'month':
          startDate.setDate(startDate.getDate() - 30)
          break
        case 'all':
          startDate.setDate(startDate.getDate() - 90) // Max 90 days
          break
      }
      
      // Load meal progress data
      const { data: progressData, error } = await db.supabase
        .from('ai_meal_progress')
        .select('*')
        .eq('client_id', clientId)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
        .order('date', { ascending: false })
      
      if (error) throw error
      
      // Load water tracking (check both tables)
      const waterData = await loadWaterData(startDate, endDate)
      
      // Load mood logs
      const { data: moodData } = await db.supabase
        .from('ai_mood_logs')
        .select('*')
        .eq('client_id', clientId)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
      
      // Process and combine data
      const processedData = processHistoryData(progressData, waterData, moodData)
      setHistoryData(processedData)
      
      // Calculate statistics
      const calculatedStats = calculateStats(processedData)
      setStats(calculatedStats)
      
    } catch (error) {
      console.error('Failed to load history:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const loadWaterData = async (startDate, endDate) => {
    // Try both water tables (known issue)
    const { data: waterTracking } = await db.supabase
      .from('water_tracking')
      .select('*')
      .eq('client_id', clientId)
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0])
    
    const { data: aiWaterTracking } = await db.supabase
      .from('ai_water_tracking')
      .select('*')
      .eq('client_id', clientId)
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0])
    
    // Merge and deduplicate
    const allWater = [...(waterTracking || []), ...(aiWaterTracking || [])]
    const waterByDate = {}
    
    allWater.forEach(entry => {
      const date = entry.date
      if (!waterByDate[date] || entry.milliliters > waterByDate[date].milliliters) {
        waterByDate[date] = entry
      }
    })
    
    return Object.values(waterByDate)
  }
  
  const processHistoryData = (progress, water, mood) => {
    const dataByDate = {}
    
    // Process meal progress
    progress?.forEach(entry => {
      const date = entry.date
      if (!dataByDate[date]) {
        dataByDate[date] = {
          date,
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          mealsConsumed: 0,
          water: 0,
          mood: null,
          consumedMeals: []
        }
      }
      
      dataByDate[date].calories = entry.total_calories || 0
      dataByDate[date].protein = entry.total_protein || 0
      dataByDate[date].carbs = entry.total_carbs || 0
      dataByDate[date].fat = entry.total_fat || 0
      dataByDate[date].mealsConsumed = entry.meals_consumed || 0
      
      // Parse consumed meals JSONB
      if (entry.consumed_meals) {
        const meals = typeof entry.consumed_meals === 'string' 
          ? JSON.parse(entry.consumed_meals) 
          : entry.consumed_meals
        
        Object.entries(meals).forEach(([slot, mealData]) => {
          if (mealData.consumed) {
            dataByDate[date].consumedMeals.push({
              slot,
              name: mealData.meal_name,
              calories: mealData.calories,
              protein: mealData.protein
            })
          }
        })
      }
    })
    
    // Add water data
    water?.forEach(entry => {
      const date = entry.date
      if (dataByDate[date]) {
        dataByDate[date].water = entry.milliliters || (entry.amount_liters * 1000) || 0
      }
    })
    
    // Add mood data
    mood?.forEach(entry => {
      const date = entry.date
      if (dataByDate[date]) {
        dataByDate[date].mood = entry.mood_score
      }
    })
    
    return Object.values(dataByDate).sort((a, b) => 
      new Date(b.date) - new Date(a.date)
    )
  }
  
  const calculateStats = (data) => {
    if (!data || data.length === 0) return null
    
    const totals = data.reduce((acc, day) => ({
      calories: acc.calories + day.calories,
      protein: acc.protein + day.protein,
      carbs: acc.carbs + day.carbs,
      fat: acc.fat + day.fat,
      water: acc.water + day.water,
      daysTracked: acc.daysTracked + (day.mealsConsumed > 0 ? 1 : 0)
    }), { calories: 0, protein: 0, carbs: 0, fat: 0, water: 0, daysTracked: 0 })
    
    const avgCalories = Math.round(totals.calories / totals.daysTracked) || 0
    const avgProtein = Math.round(totals.protein / totals.daysTracked) || 0
    const avgWater = Math.round(totals.water / totals.daysTracked) || 0
    
    // Find best/worst days
    const sortedByCalories = [...data].sort((a, b) => b.calories - a.calories)
    const bestDay = sortedByCalories[0]
    const worstDay = sortedByCalories[sortedByCalories.length - 1]
    
    // Calculate streaks
    let currentStreak = 0
    let maxStreak = 0
    let tempStreak = 0
    
    data.forEach((day, index) => {
      if (day.mealsConsumed > 0) {
        tempStreak++
        if (index === 0) currentStreak = tempStreak
        maxStreak = Math.max(maxStreak, tempStreak)
      } else {
        tempStreak = 0
      }
    })
    
    return {
      avgCalories,
      avgProtein,
      avgWater,
      totalDays: data.length,
      daysTracked: totals.daysTracked,
      compliance: Math.round((totals.daysTracked / data.length) * 100),
      currentStreak,
      maxStreak,
      bestDay,
      worstDay
    }
  }
  
  const exportToCSV = () => {
    const headers = ['Date', 'Calories', 'Protein', 'Carbs', 'Fat', 'Water (ml)', 'Meals', 'Mood']
    const rows = historyData.map(day => [
      day.date,
      day.calories,
      day.protein,
      day.carbs,
      day.fat,
      day.water,
      day.mealsConsumed,
      day.mood || ''
    ])
    
    const csv = [headers, ...rows]
      .map(row => row.join(','))
      .join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `meal-history-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }
  
  if (!isOpen) return null
  
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(20px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: isMobile ? '0.75rem' : '2rem',
      animation: 'fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.98) 0%, rgba(15, 15, 15, 0.98) 100%)',
        backdropFilter: 'blur(30px)',
        borderRadius: isMobile ? '20px' : '28px',
        width: '100%',
        maxWidth: isMobile ? '100%' : '1100px',
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid rgba(16, 185, 129, 0.08)',
        boxShadow: '0 25px 80px rgba(0, 0, 0, 0.6), 0 0 60px rgba(16, 185, 129, 0.1)',
        overflow: 'hidden'
      }}>
        {/* Premium Header */}
        <div style={{
          padding: isMobile ? '1rem' : '1.5rem',
          borderBottom: '1px solid rgba(16, 185, 129, 0.08)',
          background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.05) 0%, transparent 100%)'
        }}>
          {/* Title Row */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem'
          }}>
            <h2 style={{
              fontSize: isMobile ? '1.25rem' : '1.5rem',
              fontWeight: '800',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              letterSpacing: '-0.02em'
            }}>
              <Calendar size={24} color="#10b981" />
              Meal Historie
            </h2>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={exportToCSV}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: 'rgba(16, 185, 129, 0.05)',
                  border: '1px solid rgba(16, 185, 129, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                <Download size={18} color="#10b981" />
              </button>
              <button
                onClick={onClose}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: 'rgba(239, 68, 68, 0.05)',
                  border: '1px solid rgba(239, 68, 68, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                <X size={20} color="#ef4444" />
              </button>
            </div>
          </div>
          
          {/* Period Selector */}
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            marginBottom: '1rem'
          }}>
            {[
              { id: 'week', label: '7 Dagen' },
              { id: 'month', label: '30 Dagen' },
              { id: 'all', label: '90 Dagen' }
            ].map(p => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                style={{
                  flex: 1,
                  padding: isMobile ? '0.75rem' : '0.875rem',
                  background: period === p.id
                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.08) 100%)'
                    : 'rgba(17, 17, 17, 0.5)',
                  border: `1px solid ${period === p.id ? 'rgba(16, 185, 129, 0.25)' : 'rgba(16, 185, 129, 0.08)'}`,
                  borderRadius: '12px',
                  color: period === p.id ? '#10b981' : 'rgba(255, 255, 255, 0.6)',
                  fontSize: isMobile ? '0.875rem' : '0.95rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  minHeight: '44px'
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
          
          {/* Tabs */}
          <div style={{
            display: 'flex',
            gap: '0.5rem'
          }}>
            {[
              { id: 'overview', label: 'Overzicht', icon: BarChart3 },
              { id: 'details', label: 'Details', icon: Calendar },
              { id: 'patterns', label: 'Patronen', icon: TrendingUp }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: 1,
                  padding: isMobile ? '0.75rem' : '0.875rem',
                  background: activeTab === tab.id
                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.08) 100%)'
                    : 'rgba(17, 17, 17, 0.5)',
                  border: `1px solid ${activeTab === tab.id ? 'rgba(16, 185, 129, 0.25)' : 'rgba(16, 185, 129, 0.08)'}`,
                  borderRadius: '12px',
                  color: activeTab === tab.id ? '#10b981' : 'rgba(255, 255, 255, 0.6)',
                  fontSize: isMobile ? '0.875rem' : '0.95rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  minHeight: '44px'
                }}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* Content Area */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: isMobile ? '1rem' : '1.5rem',
          background: 'linear-gradient(180deg, transparent 0%, rgba(16, 185, 129, 0.02) 100%)'
        }}>
          {loading ? (
            <LoadingState />
          ) : (
            <>
              {activeTab === 'overview' && (
                <OverviewTab stats={stats} historyData={historyData} isMobile={isMobile} />
              )}
              {activeTab === 'details' && (
                <DetailsTab historyData={historyData} isMobile={isMobile} />
              )}
              {activeTab === 'patterns' && (
                <PatternsTab historyData={historyData} isMobile={isMobile} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// Overview Tab Component
function OverviewTab({ stats, historyData, isMobile }) {
  if (!stats) return <EmptyState />
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Key Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
        gap: isMobile ? '0.75rem' : '1rem'
      }}>
        <StatCard
          icon={Flame}
          label="Gem. Calorieën"
          value={stats.avgCalories}
          unit="kcal"
          color="#f59e0b"
          isMobile={isMobile}
        />
        <StatCard
          icon={Target}
          label="Gem. Eiwitten"
          value={stats.avgProtein}
          unit="g"
          color="#8b5cf6"
          isMobile={isMobile}
        />
        <StatCard
          icon={Droplets}
          label="Gem. Water"
          value={(stats.avgWater / 1000).toFixed(1)}
          unit="L"
          color="#3b82f6"
          isMobile={isMobile}
        />
        <StatCard
          icon={Award}
          label="Compliance"
          value={stats.compliance}
          unit="%"
          color="#10b981"
          isMobile={isMobile}
        />
      </div>
      
      {/* Streak Info */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(16, 185, 129, 0.04) 100%)',
        borderRadius: '16px',
        padding: isMobile ? '1rem' : '1.25rem',
        border: '1px solid rgba(16, 185, 129, 0.15)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{
              fontSize: isMobile ? '0.7rem' : '0.75rem',
              color: 'rgba(16, 185, 129, 0.6)',
              marginBottom: '0.25rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Huidige Streak
            </div>
            <div style={{
              fontSize: isMobile ? '1.5rem' : '2rem',
              fontWeight: '800',
              color: '#10b981',
              letterSpacing: '-0.02em'
            }}>
              {stats.currentStreak} dagen
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{
              fontSize: isMobile ? '0.7rem' : '0.75rem',
              color: 'rgba(16, 185, 129, 0.6)',
              marginBottom: '0.25rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Beste Streak
            </div>
            <div style={{
              fontSize: isMobile ? '1.25rem' : '1.5rem',
              fontWeight: '700',
              color: 'rgba(16, 185, 129, 0.8)'
            }}>
              {stats.maxStreak} dagen
            </div>
          </div>
        </div>
      </div>
      
      {/* Best/Worst Days */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
        gap: '1rem'
      }}>
        {stats.bestDay && (
          <DayCard
            title="Beste Dag"
            date={stats.bestDay.date}
            calories={stats.bestDay.calories}
            protein={stats.bestDay.protein}
            color="#10b981"
            isMobile={isMobile}
          />
        )}
        {stats.worstDay && (
          <DayCard
            title="Minste Dag"
            date={stats.worstDay.date}
            calories={stats.worstDay.calories}
            protein={stats.worstDay.protein}
            color="#ef4444"
            isMobile={isMobile}
          />
        )}
      </div>
    </div>
  )
}

// Details Tab Component
function DetailsTab({ historyData, isMobile }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
      gap: isMobile ? '0.75rem' : '1rem'
    }}>
      {historyData.map(day => (
        <DayDetailCard key={day.date} day={day} isMobile={isMobile} />
      ))}
    </div>
  )
}

// Patterns Tab Component
function PatternsTab({ historyData, isMobile }) {
  // Calculate eating patterns
  const mealTiming = {}
  const dayPatterns = { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0 }
  
  historyData.forEach(day => {
    day.consumedMeals.forEach(meal => {
      if (!mealTiming[meal.slot]) mealTiming[meal.slot] = 0
      mealTiming[meal.slot]++
    })
    
    const dayOfWeek = new Date(day.date).toLocaleDateString('en', { weekday: 'short' }).toLowerCase()
    if (day.calories > 0) dayPatterns[dayOfWeek]++
  })
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Meal Timing Pattern */}
      <div style={{
        background: 'rgba(17, 17, 17, 0.5)',
        borderRadius: '16px',
        padding: isMobile ? '1rem' : '1.25rem',
        border: '1px solid rgba(16, 185, 129, 0.08)'
      }}>
        <h3 style={{
          fontSize: isMobile ? '1rem' : '1.125rem',
          fontWeight: '700',
          color: '#10b981',
          marginBottom: '1rem'
        }}>
          Maaltijd Timing
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {Object.entries(mealTiming).map(([slot, count]) => (
            <div key={slot} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <div style={{
                width: '80px',
                fontSize: '0.875rem',
                color: 'rgba(255, 255, 255, 0.6)',
                textTransform: 'capitalize'
              }}>
                {slot}
              </div>
              <div style={{
                flex: 1,
                height: '20px',
                background: 'rgba(16, 185, 129, 0.1)',
                borderRadius: '10px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${(count / historyData.length) * 100}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                  borderRadius: '10px',
                  transition: 'width 1s ease'
                }} />
              </div>
              <div style={{
                fontSize: '0.875rem',
                color: '#10b981',
                fontWeight: '600'
              }}>
                {count}x
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Weekly Pattern */}
      <div style={{
        background: 'rgba(17, 17, 17, 0.5)',
        borderRadius: '16px',
        padding: isMobile ? '1rem' : '1.25rem',
        border: '1px solid rgba(16, 185, 129, 0.08)'
      }}>
        <h3 style={{
          fontSize: isMobile ? '1rem' : '1.125rem',
          fontWeight: '700',
          color: '#10b981',
          marginBottom: '1rem'
        }}>
          Week Patroon
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '0.5rem'
        }}>
          {Object.entries(dayPatterns).map(([day, count]) => (
            <div key={day} style={{
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '0.7rem',
                color: 'rgba(255, 255, 255, 0.5)',
                marginBottom: '0.25rem',
                textTransform: 'uppercase'
              }}>
                {day}
              </div>
              <div style={{
                width: '100%',
                aspectRatio: '1',
                background: count > 0 
                  ? `rgba(16, 185, 129, ${0.2 + (count / 4) * 0.8})`
                  : 'rgba(255, 255, 255, 0.05)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: count > 0 ? '#10b981' : 'rgba(255, 255, 255, 0.3)'
              }}>
                {count}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Helper Components
function StatCard({ icon: Icon, label, value, unit, color, isMobile }) {
  return (
    <div style={{
      background: 'rgba(17, 17, 17, 0.5)',
      borderRadius: '14px',
      padding: isMobile ? '0.875rem' : '1rem',
      border: '1px solid rgba(16, 185, 129, 0.08)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '2px',
        background: `linear-gradient(90deg, transparent, ${color}, transparent)`
      }} />
      
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginBottom: '0.5rem'
      }}>
        <Icon size={16} color={color} style={{ opacity: 0.8 }} />
        <div style={{
          fontSize: isMobile ? '0.65rem' : '0.7rem',
          color: 'rgba(255, 255, 255, 0.5)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          {label}
        </div>
      </div>
      
      <div style={{
        fontSize: isMobile ? '1.25rem' : '1.5rem',
        fontWeight: '800',
        color: color,
        display: 'flex',
        alignItems: 'baseline',
        gap: '0.25rem'
      }}>
        {value}
        <span style={{
          fontSize: '0.875rem',
          opacity: 0.7
        }}>
          {unit}
        </span>
      </div>
    </div>
  )
}

function DayCard({ title, date, calories, protein, color, isMobile }) {
  return (
    <div style={{
      background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`,
      borderRadius: '14px',
      padding: isMobile ? '1rem' : '1.25rem',
      border: `1px solid ${color}20`
    }}>
      <div style={{
        fontSize: isMobile ? '0.875rem' : '0.95rem',
        color: color,
        fontWeight: '700',
        marginBottom: '0.5rem'
      }}>
        {title}
      </div>
      <div style={{
        fontSize: '0.75rem',
        color: 'rgba(255, 255, 255, 0.5)',
        marginBottom: '0.75rem'
      }}>
        {new Date(date).toLocaleDateString('nl-NL', { 
          weekday: 'long',
          day: 'numeric',
          month: 'long'
        })}
      </div>
      <div style={{
        display: 'flex',
        gap: '1rem'
      }}>
        <div>
          <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#f59e0b' }}>
            {calories}
          </div>
          <div style={{ fontSize: '0.65rem', color: 'rgba(255, 255, 255, 0.4)' }}>
            kcal
          </div>
        </div>
        <div>
          <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#8b5cf6' }}>
            {protein}g
          </div>
          <div style={{ fontSize: '0.65rem', color: 'rgba(255, 255, 255, 0.4)' }}>
            eiwit
          </div>
        </div>
      </div>
    </div>
  )
}

function DayDetailCard({ day, isMobile }) {
  return (
    <div style={{
      background: 'rgba(17, 17, 17, 0.5)',
      borderRadius: '14px',
      padding: isMobile ? '0.875rem' : '1rem',
      border: '1px solid rgba(16, 185, 129, 0.08)'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '0.75rem'
      }}>
        <div style={{
          fontSize: isMobile ? '0.875rem' : '0.95rem',
          fontWeight: '700',
          color: 'white'
        }}>
          {new Date(day.date).toLocaleDateString('nl-NL', {
            weekday: 'short',
            day: 'numeric',
            month: 'short'
          })}
        </div>
        {day.mood && (
          <div style={{
            fontSize: '1.25rem'
          }}>
            {['😔', '😐', '😊', '😄', '🤩'][day.mood - 1]}
          </div>
        )}
      </div>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '0.5rem',
        marginBottom: '0.75rem'
      }}>
        <MiniStat label="kcal" value={day.calories} color="#f59e0b" />
        <MiniStat label="P" value={`${day.protein}g`} color="#8b5cf6" />
        <MiniStat label="C" value={`${day.carbs}g`} color="#ef4444" />
        <MiniStat label="F" value={`${day.fat}g`} color="#3b82f6" />
      </div>
      
      {day.consumedMeals.length > 0 && (
        <div style={{
          fontSize: '0.75rem',
          color: 'rgba(255, 255, 255, 0.5)'
        }}>
          {day.consumedMeals.map(meal => meal.name).join(', ')}
        </div>
      )}
    </div>
  )
}

function MiniStat({ label, value, color }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        fontSize: '0.6rem',
        color: 'rgba(255, 255, 255, 0.4)',
        marginBottom: '0.125rem',
        textTransform: 'uppercase'
      }}>
        {label}
      </div>
      <div style={{
        fontSize: '0.875rem',
        fontWeight: '700',
        color: color
      }}>
        {value}
      </div>
    </div>
  )
}

function LoadingState() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '300px'
    }}>
      <div style={{
        width: '48px',
        height: '48px',
        border: '3px solid rgba(16, 185, 129, 0.15)',
        borderTopColor: '#10b981',
        borderRadius: '50%',
        animation: 'spin 1s cubic-bezier(0.4, 0, 0.2, 1) infinite'
      }} />
    </div>
  )
}

function EmptyState() {
  return (
    <div style={{
      textAlign: 'center',
      padding: '3rem',
      color: 'rgba(255, 255, 255, 0.5)'
    }}>
      <Calendar size={48} style={{ marginBottom: '1rem', opacity: 0.2 }} />
      <p style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>
        Geen historie gevonden
      </p>
      <p style={{ fontSize: '0.875rem', opacity: 0.7 }}>
        Begin met het loggen van maaltijden om je historie te zien
      </p>
    </div>
  )
}
