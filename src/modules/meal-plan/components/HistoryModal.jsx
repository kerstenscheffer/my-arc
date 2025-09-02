// src/modules/meal-plan/components/HistoryModal.jsx
// 📊 Complete History Modal met statistieken en visualisaties

import React, { useState, useEffect } from 'react'
import { 
  X, Calendar, TrendingUp, Droplets, 
  BarChart3, PieChart, Activity, Award,
  ChevronLeft, ChevronRight, Check
} from 'lucide-react'

export default function HistoryModal({ 
  isOpen, 
  onClose, 
  historyData = [], 
  targets = {},
  db,
  clientId 
}) {
  const [viewMode, setViewMode] = useState('week') // 'week', 'month', 'stats'
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [weekData, setWeekData] = useState([])
  const [monthData, setMonthData] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)
  
  // Load data when modal opens
  useEffect(() => {
    if (isOpen && db && clientId) {
      loadHistoryData()
    }
  }, [isOpen, viewMode, selectedDate])
  
  const loadHistoryData = async () => {
    setLoading(true)
    try {
      if (viewMode === 'week') {
        // Get week data
        const startDate = new Date(selectedDate)
        startDate.setDate(startDate.getDate() - startDate.getDay())
        const endDate = new Date(startDate)
        endDate.setDate(endDate.getDate() + 6)
        
        const data = await db.getMealProgressRange(
          clientId,
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0]
        )
        
        // Also get water data
        const waterData = await db.getWaterIntakeRange(
          clientId,
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0]
        )
        
        // Combine data
        const combinedData = data.map(day => {
          const water = waterData.find(w => w.date === day.date)
          return {
            ...day,
            water: water?.amount_liters || 0
          }
        })
        
        setWeekData(combinedData)
      } else if (viewMode === 'month') {
        // Get month data
        const startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
        const endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0)
        
        const data = await db.getMealProgressRange(
          clientId,
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0]
        )
        
        setMonthData(data)
      } else if (viewMode === 'stats') {
        // Calculate statistics
        calculateStats()
      }
    } catch (error) {
      console.error('Error loading history:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const calculateStats = () => {
    const last30Days = historyData.slice(0, 30)
    
    if (last30Days.length === 0) {
      setStats(null)
      return
    }
    
    // Calculate averages
    const totals = last30Days.reduce((acc, day) => ({
      calories: acc.calories + (day.calories || 0),
      protein: acc.protein + (day.protein || 0),
      carbs: acc.carbs + (day.carbs || 0),
      fat: acc.fat + (day.fat || 0),
      days: acc.days + 1
    }), { calories: 0, protein: 0, carbs: 0, fat: 0, days: 0 })
    
    const averages = {
      calories: Math.round(totals.calories / totals.days),
      protein: Math.round(totals.protein / totals.days),
      carbs: Math.round(totals.carbs / totals.days),
      fat: Math.round(totals.fat / totals.days)
    }
    
    // Calculate streaks
    let currentStreak = 0
    let bestStreak = 0
    let tempStreak = 0
    
    const today = new Date().toISOString().split('T')[0]
    const sortedDays = [...last30Days].sort((a, b) => 
      new Date(b.date) - new Date(a.date)
    )
    
    sortedDays.forEach((day, idx) => {
      if (day.calories > 0) {
        if (idx === 0 && day.date === today) {
          currentStreak = 1
          tempStreak = 1
        } else if (idx > 0) {
          const prevDate = new Date(sortedDays[idx - 1].date)
          const currDate = new Date(day.date)
          const diffDays = Math.round((prevDate - currDate) / (1000 * 60 * 60 * 24))
          
          if (diffDays === 1) {
            tempStreak++
            if (idx === 0 || sortedDays[0].date === today) {
              currentStreak = tempStreak
            }
          } else {
            bestStreak = Math.max(bestStreak, tempStreak)
            tempStreak = 1
          }
        }
      }
    })
    
    bestStreak = Math.max(bestStreak, tempStreak)
    
    // Calculate compliance
    const daysWithTarget = last30Days.filter(day => 
      day.calories >= targets.kcal * 0.9 && 
      day.calories <= targets.kcal * 1.1
    ).length
    
    const compliance = Math.round((daysWithTarget / last30Days.length) * 100)
    
    setStats({
      averages,
      currentStreak,
      bestStreak,
      compliance,
      totalDays: totals.days
    })
  }
  
  const getDayData = (date) => {
    const dateStr = date.toISOString().split('T')[0]
    return weekData.find(d => d.date === dateStr) || monthData.find(d => d.date === dateStr)
  }
  
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('nl-NL', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    })
  }
  
  const getProgressColor = (value, target) => {
    const percentage = (value / target) * 100
    if (percentage < 80) return '#ef4444'
    if (percentage < 95) return '#f59e0b'
    if (percentage <= 105) return '#10b981'
    return '#f59e0b'
  }
  
  if (!isOpen) return null
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 10000,
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center',
      background: 'rgba(0, 0, 0, 0.7)',
      animation: 'fadeIn 0.2s ease'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '500px',
        height: '85vh',
        background: 'linear-gradient(180deg, #1a1a1a 0%, #0a0f0d 100%)',
        borderTopLeftRadius: '24px',
        borderTopRightRadius: '24px',
        display: 'flex',
        flexDirection: 'column',
        animation: 'slideUp 0.3s ease'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          position: 'relative'
        }}>
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '1.5rem',
              right: '1.5rem',
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={18} style={{ color: '#fff' }} />
          </button>
          
          <h2 style={{
            color: '#fff',
            fontSize: '1.5rem',
            fontWeight: 'bold',
            marginBottom: '0.5rem'
          }}>
            Geschiedenis
          </h2>
          
          {/* View Mode Tabs */}
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            marginTop: '1rem'
          }}>
            {['week', 'month', 'stats'].map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                style={{
                  padding: '0.5rem 1rem',
                  background: viewMode === mode 
                    ? 'rgba(16, 185, 129, 0.2)' 
                    : 'rgba(255, 255, 255, 0.05)',
                  border: viewMode === mode
                    ? '1px solid rgba(16, 185, 129, 0.5)'
                    : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: viewMode === mode
                    ? '#10b981'
                    : 'rgba(255, 255, 255, 0.6)',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  textTransform: 'capitalize'
                }}
              >
                {mode === 'week' ? 'Week' : mode === 'month' ? 'Maand' : 'Stats'}
              </button>
            ))}
          </div>
        </div>
        
        {/* Content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1rem'
        }}>
          {loading ? (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '200px'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                border: '3px solid rgba(16, 185, 129, 0.2)',
                borderTopColor: '#10b981',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
            </div>
          ) : (
            <>
              {/* Week View */}
              {viewMode === 'week' && (
                <WeekView
                  weekData={weekData}
                  targets={targets}
                  selectedDate={selectedDate}
                  onDateChange={setSelectedDate}
                />
              )}
              
              {/* Month View */}
              {viewMode === 'month' && (
                <MonthView
                  monthData={monthData}
                  targets={targets}
                  selectedDate={selectedDate}
                  onDateChange={setSelectedDate}
                />
              )}
              
              {/* Stats View */}
              {viewMode === 'stats' && (
                <StatsView
                  stats={stats}
                  targets={targets}
                />
              )}
            </>
          )}
        </div>
      </div>
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

// ===== WEEK VIEW COMPONENT =====
function WeekView({ weekData, targets, selectedDate, onDateChange }) {
  const days = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo']
  const startOfWeek = new Date(selectedDate)
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1)
  
  return (
    <div>
      {/* Week Navigation */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem',
        padding: '0.75rem',
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '12px'
      }}>
        <button
          onClick={() => {
            const newDate = new Date(selectedDate)
            newDate.setDate(newDate.getDate() - 7)
            onDateChange(newDate)
          }}
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            borderRadius: '8px',
            padding: '0.5rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <ChevronLeft size={20} style={{ color: '#fff' }} />
        </button>
        
        <span style={{
          color: '#fff',
          fontWeight: '600'
        }}>
          Week {Math.ceil((startOfWeek.getDate()) / 7)} - {
            startOfWeek.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' })
          }
        </span>
        
        <button
          onClick={() => {
            const newDate = new Date(selectedDate)
            newDate.setDate(newDate.getDate() + 7)
            onDateChange(newDate)
          }}
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            borderRadius: '8px',
            padding: '0.5rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <ChevronRight size={20} style={{ color: '#fff' }} />
        </button>
      </div>
      
      {/* Days Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '0.5rem',
        marginBottom: '1.5rem'
      }}>
        {days.map((day, idx) => {
          const dayDate = new Date(startOfWeek)
          dayDate.setDate(startOfWeek.getDate() + idx)
          const dayData = weekData.find(d => 
            d.date === dayDate.toISOString().split('T')[0]
          )
          const isToday = dayDate.toDateString() === new Date().toDateString()
          const hasData = dayData && dayData.calories > 0
          
          return (
            <div
              key={idx}
              style={{
                background: isToday 
                  ? 'rgba(16, 185, 129, 0.1)'
                  : hasData 
                  ? 'rgba(16, 185, 129, 0.05)' 
                  : 'rgba(0, 0, 0, 0.3)',
                border: isToday
                  ? '1px solid rgba(16, 185, 129, 0.5)'
                  : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '0.75rem',
                textAlign: 'center',
                position: 'relative'
              }}
            >
              <div style={{
                fontSize: '0.7rem',
                color: 'rgba(255, 255, 255, 0.5)',
                marginBottom: '0.25rem'
              }}>
                {day}
              </div>
              <div style={{
                fontSize: '1rem',
                color: '#fff',
                fontWeight: '600',
                marginBottom: '0.5rem'
              }}>
                {dayDate.getDate()}
              </div>
              
              {hasData && (
                <>
                  <div style={{
                    fontSize: '0.85rem',
                    color: '#10b981',
                    fontWeight: '600'
                  }}>
                    {dayData.calories}
                  </div>
                  <div style={{
                    fontSize: '0.65rem',
                    color: 'rgba(255, 255, 255, 0.4)'
                  }}>
                    kcal
                  </div>
                  
                  {/* Completion indicator */}
                  <div style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    width: '16px',
                    height: '16px',
                    background: 'rgba(16, 185, 129, 0.2)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Check size={10} style={{ color: '#10b981' }} />
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
      
      {/* Weekly Summary */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '12px',
        padding: '1rem',
        marginBottom: '1rem'
      }}>
        <h3 style={{
          color: '#fff',
          fontSize: '1rem',
          fontWeight: '600',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <BarChart3 size={18} style={{ color: '#10b981' }} />
          Week Overzicht
        </h3>
        
        {weekData.length > 0 ? (
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {/* Calories */}
            <MacroBar
              label="Calorieën"
              value={weekData.reduce((sum, d) => sum + (d.calories || 0), 0) / weekData.length}
              target={targets.kcal}
              unit="kcal"
              color="#10b981"
            />
            
            {/* Protein */}
            <MacroBar
              label="Eiwitten"
              value={weekData.reduce((sum, d) => sum + (d.protein || 0), 0) / weekData.length}
              target={targets.protein}
              unit="g"
              color="#3b82f6"
            />
            
            {/* Carbs */}
            <MacroBar
              label="Koolhydraten"
              value={weekData.reduce((sum, d) => sum + (d.carbs || 0), 0) / weekData.length}
              target={targets.carbs}
              unit="g"
              color="#f59e0b"
            />
            
            {/* Fat */}
            <MacroBar
              label="Vetten"
              value={weekData.reduce((sum, d) => sum + (d.fat || 0), 0) / weekData.length}
              target={targets.fat}
              unit="g"
              color="#ec4899"
            />
            
            {/* Water */}
            <MacroBar
              label="Water"
              value={weekData.reduce((sum, d) => sum + (d.water || 0), 0) / weekData.length}
              target={2.0}
              unit="L"
              color="#06b6d4"
              icon={<Droplets size={14} />}
            />
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            color: 'rgba(255, 255, 255, 0.4)',
            padding: '2rem'
          }}>
            Geen data voor deze week
          </div>
        )}
      </div>
    </div>
  )
}

// ===== MONTH VIEW COMPONENT =====
function MonthView({ monthData, targets, selectedDate, onDateChange }) {
  const daysInMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate()
  const firstDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1).getDay()
  const offset = firstDay === 0 ? 6 : firstDay - 1
  
  return (
    <div>
      {/* Month Navigation */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem',
        padding: '0.75rem',
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '12px'
      }}>
        <button
          onClick={() => {
            const newDate = new Date(selectedDate)
            newDate.setMonth(newDate.getMonth() - 1)
            onDateChange(newDate)
          }}
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            borderRadius: '8px',
            padding: '0.5rem',
            cursor: 'pointer'
          }}
        >
          <ChevronLeft size={20} style={{ color: '#fff' }} />
        </button>
        
        <span style={{
          color: '#fff',
          fontWeight: '600',
          fontSize: '1.1rem'
        }}>
          {selectedDate.toLocaleDateString('nl-NL', { 
            month: 'long', 
            year: 'numeric' 
          })}
        </span>
        
        <button
          onClick={() => {
            const newDate = new Date(selectedDate)
            newDate.setMonth(newDate.getMonth() + 1)
            onDateChange(newDate)
          }}
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            borderRadius: '8px',
            padding: '0.5rem',
            cursor: 'pointer'
          }}
        >
          <ChevronRight size={20} style={{ color: '#fff' }} />
        </button>
      </div>
      
      {/* Calendar Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '4px',
        marginBottom: '1.5rem'
      }}>
        {/* Day headers */}
        {['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'].map(day => (
          <div
            key={day}
            style={{
              textAlign: 'center',
              fontSize: '0.7rem',
              color: 'rgba(255, 255, 255, 0.4)',
              padding: '0.25rem'
            }}
          >
            {day}
          </div>
        ))}
        
        {/* Empty cells for offset */}
        {Array.from({ length: offset }).map((_, idx) => (
          <div key={`empty-${idx}`} />
        ))}
        
        {/* Days */}
        {Array.from({ length: daysInMonth }).map((_, idx) => {
          const day = idx + 1
          const date = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day)
          const dateStr = date.toISOString().split('T')[0]
          const dayData = monthData.find(d => d.date === dateStr)
          const isToday = date.toDateString() === new Date().toDateString()
          const hasData = dayData && dayData.calories > 0
          
          return (
            <div
              key={day}
              style={{
                aspectRatio: '1',
                background: isToday
                  ? 'rgba(16, 185, 129, 0.1)'
                  : hasData
                  ? 'rgba(16, 185, 129, 0.05)'
                  : 'rgba(0, 0, 0, 0.2)',
                border: isToday
                  ? '1px solid rgba(16, 185, 129, 0.5)'
                  : hasData
                  ? '1px solid rgba(16, 185, 129, 0.2)'
                  : '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: '6px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                fontSize: '0.8rem',
                color: hasData ? '#fff' : 'rgba(255, 255, 255, 0.3)'
              }}
            >
              <div style={{ fontWeight: isToday ? '600' : '400' }}>
                {day}
              </div>
              {hasData && (
                <div style={{
                  position: 'absolute',
                  bottom: '2px',
                  width: '4px',
                  height: '4px',
                  background: '#10b981',
                  borderRadius: '50%'
                }} />
              )}
            </div>
          )
        })}
      </div>
      
      {/* Month Summary */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '12px',
        padding: '1rem'
      }}>
        <h3 style={{
          color: '#fff',
          fontSize: '1rem',
          fontWeight: '600',
          marginBottom: '0.75rem'
        }}>
          Maand Statistieken
        </h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.75rem'
        }}>
          <StatCard
            label="Dagen Gelogd"
            value={monthData.filter(d => d.calories > 0).length}
            unit="dagen"
            color="#10b981"
          />
          <StatCard
            label="Gem. Calorieën"
            value={Math.round(
              monthData.reduce((sum, d) => sum + (d.calories || 0), 0) / 
              (monthData.filter(d => d.calories > 0).length || 1)
            )}
            unit="kcal"
            color="#3b82f6"
          />
          <StatCard
            label="Gem. Eiwitten"
            value={Math.round(
              monthData.reduce((sum, d) => sum + (d.protein || 0), 0) / 
              (monthData.filter(d => d.protein > 0).length || 1)
            )}
            unit="g"
            color="#f59e0b"
          />
          <StatCard
            label="Compliantie"
            value={Math.round(
              (monthData.filter(d => 
                d.calories >= targets.kcal * 0.9 && 
                d.calories <= targets.kcal * 1.1
              ).length / (monthData.filter(d => d.calories > 0).length || 1)) * 100
            )}
            unit="%"
            color="#ec4899"
          />
        </div>
      </div>
    </div>
  )
}

// ===== STATS VIEW COMPONENT =====
function StatsView({ stats, targets }) {
  if (!stats) {
    return (
      <div style={{
        textAlign: 'center',
        color: 'rgba(255, 255, 255, 0.4)',
        padding: '3rem'
      }}>
        <PieChart size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
        <div>Geen statistieken beschikbaar</div>
      </div>
    )
  }
  
  return (
    <div>
      {/* Streaks */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '12px',
          padding: '1rem',
          textAlign: 'center'
        }}>
          <Activity size={24} style={{ color: '#10b981', marginBottom: '0.5rem' }} />
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>
            {stats.currentStreak}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.5)' }}>
            Huidige Streak
          </div>
        </div>
        
        <div style={{
          background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(251, 191, 36, 0.05) 100%)',
          border: '1px solid rgba(251, 191, 36, 0.3)',
          borderRadius: '12px',
          padding: '1rem',
          textAlign: 'center'
        }}>
          <Award size={24} style={{ color: '#fbbf24', marginBottom: '0.5rem' }} />
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fbbf24' }}>
            {stats.bestStreak}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.5)' }}>
            Beste Streak
          </div>
        </div>
      </div>
      
      {/* 30-Day Averages */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '12px',
        padding: '1rem',
        marginBottom: '1.5rem'
      }}>
        <h3 style={{
          color: '#fff',
          fontSize: '1rem',
          fontWeight: '600',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <TrendingUp size={18} style={{ color: '#10b981' }} />
          30-Dagen Gemiddelden
        </h3>
        
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          <MacroBar
            label="Calorieën"
            value={stats.averages.calories}
            target={targets.kcal}
            unit="kcal"
            color="#10b981"
          />
          <MacroBar
            label="Eiwitten"
            value={stats.averages.protein}
            target={targets.protein}
            unit="g"
            color="#3b82f6"
          />
          <MacroBar
            label="Koolhydraten"
            value={stats.averages.carbs}
            target={targets.carbs}
            unit="g"
            color="#f59e0b"
          />
          <MacroBar
            label="Vetten"
            value={stats.averages.fat}
            target={targets.fat}
            unit="g"
            color="#ec4899"
          />
        </div>
      </div>
      
      {/* Compliance Score */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        borderRadius: '12px',
        padding: '1.5rem',
        textAlign: 'center'
      }}>
        <div style={{
          fontSize: '3rem',
          fontWeight: 'bold',
          color: '#3b82f6',
          marginBottom: '0.5rem'
        }}>
          {stats.compliance}%
        </div>
        <div style={{
          fontSize: '1rem',
          color: '#fff',
          marginBottom: '0.25rem'
        }}>
          Compliantie Score
        </div>
        <div style={{
          fontSize: '0.75rem',
          color: 'rgba(255, 255, 255, 0.5)'
        }}>
          Gebaseerd op {stats.totalDays} dagen
        </div>
      </div>
    </div>
  )
}

// ===== HELPER COMPONENTS =====
function MacroBar({ label, value, target, unit, color, icon }) {
  const percentage = Math.min(100, (value / target) * 100)
  
  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '0.25rem'
      }}>
        <span style={{
          fontSize: '0.75rem',
          color: 'rgba(255, 255, 255, 0.5)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem'
        }}>
          {icon}
          {label}
        </span>
        <span style={{
          fontSize: '0.75rem',
          color: color,
          fontWeight: '600'
        }}>
          {Math.round(value)} / {target} {unit}
        </span>
      </div>
      <div style={{
        height: '6px',
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '3px',
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${percentage}%`,
          height: '100%',
          background: color,
          borderRadius: '3px',
          transition: 'width 0.3s ease'
        }} />
      </div>
    </div>
  )
}

function StatCard({ label, value, unit, color }) {
  return (
    <div style={{
      background: 'rgba(0, 0, 0, 0.2)',
      borderRadius: '8px',
      padding: '0.75rem',
      textAlign: 'center'
    }}>
      <div style={{
        fontSize: '1.25rem',
        fontWeight: 'bold',
        color: color,
        marginBottom: '0.25rem'
      }}>
        {value}
        <span style={{
          fontSize: '0.75rem',
          marginLeft: '0.25rem',
          opacity: 0.8
        }}>
          {unit}
        </span>
      </div>
      <div style={{
        fontSize: '0.7rem',
        color: 'rgba(255, 255, 255, 0.5)'
      }}>
        {label}
      </div>
    </div>
  )
}
