// src/modules/nutrition-progress/components/EnhancedHistoryModal.jsx
// 📈 ENHANCED HISTORY MODAL - Complete upgrade van bestaande modal

import React, { useState, useEffect } from 'react'
import { 
  X, Calendar, TrendingUp, Flame, Target, Droplets,
  BarChart3, Clock, CheckCircle2, Activity, Filter,
  ArrowLeft, ArrowRight, Star, Award, Zap, Eye,
  Coffee, Sun, Moon, Apple, ChevronDown, Sparkles
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import nutritionProgressService from '../NutritionProgressService'

export const EnhancedHistoryModal = ({ isOpen, onClose, client, db }) => {
  const isMobile = window.innerWidth <= 768
  
  // State management
  const [loading, setLoading] = useState(true)
  const [historyData, setHistoryData] = useState([])
  const [progressData, setProgressData] = useState(null)
  const [activeView, setActiveView] = useState('timeline') // timeline, analytics, insights
  const [timeframe, setTimeframe] = useState('week') // week, month, all
  const [filterType, setFilterType] = useState('all') // all, breakfast, lunch, dinner, snacks

  // Load data when modal opens
  useEffect(() => {
    if (isOpen && client?.id) {
      loadHistoryData()
    }
  }, [isOpen, client, timeframe])

  const loadHistoryData = async () => {
    if (!client?.id) return
    
    try {
      setLoading(true)
      
      const days = timeframe === 'week' ? 7 : timeframe === 'month' ? 30 : 90
      
      // Get enhanced meal history
      const history = await nutritionProgressService.getMealHistoryEnhanced(client.id, days)
      setHistoryData(history)
      
      // Get progress analytics
      const progress = await nutritionProgressService.getNutritionProgressData(client.id, days)
      setProgressData(progress)
      
    } catch (error) {
      console.error('Error loading history data:', error)
      setHistoryData([])
    } finally {
      setLoading(false)
    }
  }

  const getTimeframeLabel = () => {
    switch(timeframe) {
      case 'week': return 'Last 7 Days'
      case 'month': return 'Last 30 Days'
      case 'all': return 'Last 90 Days'
      default: return 'History'
    }
  }

  const getMealTypeIcon = (type) => {
    if (!type) return Clock
    const typeStr = String(type).toLowerCase()
    if (typeStr.includes('breakfast') || typeStr.includes('ontbijt')) return Coffee
    if (typeStr.includes('lunch')) return Sun
    if (typeStr.includes('dinner') || typeStr.includes('diner')) return Moon
    if (typeStr.includes('snack') || typeStr.includes('tussendoortje')) return Apple
    return Clock
  }

  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.95)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: isMobile ? '1rem' : '2rem',
      backdropFilter: 'blur(10px)'
    }}>
      <div style={{
        background: 'linear-gradient(180deg, #0a0f0d 0%, #1a1a1a 100%)',
        borderRadius: '24px',
        width: '100%',
        maxWidth: isMobile ? '100%' : '900px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid rgba(16, 185, 129, 0.2)',
        overflow: 'hidden'
      }}>
        
        {/* Header */}
        <div style={{
          padding: isMobile ? '1.5rem' : '2rem',
          paddingBottom: isMobile ? '1rem' : '1.5rem',
          borderBottom: '1px solid rgba(16, 185, 129, 0.1)',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(5, 150, 105, 0.02) 100%)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem'
          }}>
            <div>
              <h2 style={{
                color: '#fff',
                fontSize: isMobile ? '1.5rem' : '1.8rem',
                fontWeight: '700',
                marginBottom: '0.25rem'
              }}>
                📊 Nutrition History
              </h2>
              <p style={{
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: isMobile ? '0.85rem' : '0.95rem'
              }}>
                {getTimeframeLabel()} • Complete insights & analytics
              </p>
            </div>
            
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                borderRadius: '50%',
                width: '48px',
                height: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'rgba(255, 255, 255, 0.7)',
                transition: 'all 0.3s ease',
                touchAction: 'manipulation'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'
                e.currentTarget.style.color = '#fff'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)'
              }}
            >
              <X size={24} />
            </button>
          </div>
          
          {/* Controls Row */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap'
          }}>
            {/* View Tabs */}
            <div style={{
              display: 'flex',
              gap: '4px',
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '12px',
              padding: '4px'
            }}>
              {[
                { id: 'timeline', label: 'Timeline', icon: Clock },
                { id: 'analytics', label: 'Analytics', icon: BarChart3 },
                { id: 'insights', label: 'Insights', icon: Sparkles }
              ].map(view => {
                const Icon = view.icon
                return (
                  <button
                    key={view.id}
                    onClick={() => setActiveView(view.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: isMobile ? '8px 12px' : '10px 16px',
                      background: activeView === view.id 
                        ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                        : 'transparent',
                      border: 'none',
                      borderRadius: '8px',
                      color: activeView === view.id ? '#fff' : 'rgba(255, 255, 255, 0.6)',
                      fontSize: isMobile ? '0.8rem' : '0.9rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      touchAction: 'manipulation'
                    }}
                  >
                    <Icon size={16} />
                    {!isMobile && view.label}
                  </button>
                )
              })}
            </div>
            
            {/* Timeframe Selector */}
            <div style={{
              display: 'flex',
              gap: '4px',
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '12px',
              padding: '4px'
            }}>
              {['week', 'month', 'all'].map(period => (
                <button
                  key={period}
                  onClick={() => setTimeframe(period)}
                  style={{
                    padding: isMobile ? '8px 12px' : '10px 16px',
                    background: timeframe === period 
                      ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.3) 0%, rgba(5, 150, 105, 0.2) 100%)'
                      : 'transparent',
                    border: timeframe === period
                      ? '1px solid rgba(16, 185, 129, 0.4)'
                      : '1px solid transparent',
                    borderRadius: '8px',
                    color: timeframe === period
                      ? '#10b981'
                      : 'rgba(255, 255, 255, 0.6)',
                    fontSize: isMobile ? '0.8rem' : '0.9rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    textTransform: 'capitalize',
                    touchAction: 'manipulation'
                  }}
                >
                  {period === 'week' ? '7d' : period === 'month' ? '30d' : '90d'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: isMobile ? '1rem' : '1.5rem'
        }}>
          {loading ? (
            <LoadingState isMobile={isMobile} />
          ) : (
            <>
              {activeView === 'timeline' && (
                <TimelineView 
                  historyData={historyData}
                  filterType={filterType}
                  setFilterType={setFilterType}
                  isMobile={isMobile}
                />
              )}
              
              {activeView === 'analytics' && (
                <AnalyticsView 
                  progressData={progressData}
                  historyData={historyData}
                  isMobile={isMobile}
                />
              )}
              
              {activeView === 'insights' && (
                <InsightsView 
                  progressData={progressData}
                  timeframe={timeframe}
                  isMobile={isMobile}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ===== TIMELINE VIEW =====
const TimelineView = ({ historyData, filterType, setFilterType, isMobile }) => {
  const filteredData = historyData.filter(item => {
    if (filterType === 'all') return true
    return item.meal_type && item.meal_type.toLowerCase().includes(filterType.toLowerCase())
  })

  const groupedByDate = filteredData.reduce((acc, item) => {
    const date = item.date
    if (!acc[date]) acc[date] = []
    acc[date].push(item)
    return acc
  }, {})

  return (
    <div>
      {/* Filter Bar */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '1.5rem',
        overflowX: 'auto',
        paddingBottom: '4px'
      }}>
        {[
          { id: 'all', label: 'All Meals', icon: Clock },
          { id: 'breakfast', label: 'Breakfast', icon: Coffee },
          { id: 'lunch', label: 'Lunch', icon: Sun },
          { id: 'dinner', label: 'Dinner', icon: Moon },
          { id: 'snack', label: 'Snacks', icon: Apple }
        ].map(filter => {
          const Icon = filter.icon
          return (
            <button
              key={filter.id}
              onClick={() => setFilterType(filter.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: isMobile ? '8px 12px' : '10px 16px',
                background: filterType === filter.id 
                  ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.1) 100%)'
                  : 'rgba(0, 0, 0, 0.2)',
                border: filterType === filter.id 
                  ? '1px solid rgba(16, 185, 129, 0.3)'
                  : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                color: filterType === filter.id ? '#10b981' : 'rgba(255, 255, 255, 0.7)',
                fontSize: isMobile ? '0.8rem' : '0.9rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                whiteSpace: 'nowrap',
                touchAction: 'manipulation'
              }}
            >
              <Icon size={16} />
              {!isMobile && filter.label}
            </button>
          )
        })}
      </div>

      {/* Timeline */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {Object.entries(groupedByDate)
          .sort(([a], [b]) => new Date(b) - new Date(a))
          .map(([date, items]) => (
            <DateGroup key={date} date={date} items={items} isMobile={isMobile} />
          ))
        }
        
        {filteredData.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            color: 'rgba(255, 255, 255, 0.5)'
          }}>
            <Clock size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
            <p>No meal data found for the selected timeframe</p>
          </div>
        )}
      </div>
    </div>
  )
}

const DateGroup = ({ date, items, isMobile }) => {
  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    if (date.toDateString() === today.toDateString()) return 'Today'
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
    
    return date.toLocaleDateString('en', { 
      weekday: 'long', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const dayTotals = items.reduce((acc, item) => ({
    calories: acc.calories + (item.calories || 0),
    protein: acc.protein + (item.protein || 0),
    water: Math.max(acc.water, item.water || 0) // Take max water for the day
  }), { calories: 0, protein: 0, water: 0 })

  return (
    <div style={{
      background: 'rgba(0, 0, 0, 0.3)',
      borderRadius: '16px',
      overflow: 'hidden',
      border: '1px solid rgba(16, 185, 129, 0.1)'
    }}>
      {/* Date Header */}
      <div style={{
        padding: isMobile ? '1rem' : '1.25rem',
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.04) 100%)',
        borderBottom: '1px solid rgba(16, 185, 129, 0.1)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <h4 style={{
              color: '#fff',
              fontSize: isMobile ? '1rem' : '1.1rem',
              fontWeight: '600',
              marginBottom: '0.25rem'
            }}>
              {formatDate(date)}
            </h4>
            <div style={{
              display: 'flex',
              gap: '1rem',
              fontSize: '0.8rem',
              color: 'rgba(255, 255, 255, 0.6)'
            }}>
              <span>🔥 {dayTotals.calories} kcal</span>
              <span>⚡ {dayTotals.protein}g protein</span>
              <span>💧 {dayTotals.water} glasses</span>
            </div>
          </div>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: '#10b981',
            fontSize: '0.9rem',
            fontWeight: '600'
          }}>
            <CheckCircle2 size={16} />
            {items.length} meals
          </div>
        </div>
      </div>
      
      {/* Meals List */}
      <div style={{ padding: isMobile ? '1rem' : '1.25rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {items.map((item, idx) => {
            const Icon = getMealTypeIcon(item.meal_type)
            
            return (
              <div key={idx} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.875rem',
                background: 'rgba(0, 0, 0, 0.2)',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                transition: 'all 0.3s ease'
              }}>
                <Icon size={20} style={{ 
                  color: getIconColor(item.meal_type),
                  flexShrink: 0 
                }} />
                
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '0.25rem'
                  }}>
                    <h5 style={{
                      color: '#fff',
                      fontWeight: '600',
                      fontSize: '0.95rem',
                      margin: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {item.meal_name || 'Daily Summary'}
                    </h5>
                    
                    <div style={{
                      color: '#10b981',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      flexShrink: 0,
                      marginLeft: '0.5rem'
                    }}>
                      {item.calories || 0} kcal
                    </div>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    gap: '0.75rem',
                    fontSize: '0.75rem',
                    color: 'rgba(255, 255, 255, 0.5)'
                  }}>
                    <span>{item.protein || 0}g protein</span>
                    <span>{item.carbs || 0}g carbs</span>
                    <span>{item.fat || 0}g fat</span>
                    {item.created_at && (
                      <span>
                        {new Date(item.created_at).toLocaleTimeString('en', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ===== ANALYTICS VIEW =====
const AnalyticsView = ({ progressData, historyData, isMobile }) => {
  if (!progressData || !progressData.dailyData.length) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '3rem',
        color: 'rgba(255, 255, 255, 0.5)'
      }}>
        <BarChart3 size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
        <p>Not enough data for analytics</p>
      </div>
    )
  }

  const { dailyData, summary, streakData } = progressData

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
        gap: '1rem'
      }}>
        <SummaryCard
          title="Avg Calories"
          value={summary.avgCalories}
          subtitle={`/${summary.calorieTarget}`}
          icon={Flame}
          color="#f59e0b"
          isMobile={isMobile}
        />
        <SummaryCard
          title="Streak"
          value={streakData.current}
          subtitle={`best: ${streakData.longest}`}
          icon={Award}
          color="#ef4444"
          isMobile={isMobile}
        />
        <SummaryCard
          title="Adherence"
          value={`${summary.adherenceRate}%`}
          subtitle={`${summary.daysTracked} days`}
          icon={Target}
          color="#10b981"
          isMobile={isMobile}
        />
        <SummaryCard
          title="Water"
          value={`${summary.avgWater}`}
          subtitle="glasses/day"
          icon={Droplets}
          color="#06b6d4"
          isMobile={isMobile}
        />
      </div>

      {/* Calorie Trend Chart */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.2)',
        borderRadius: '16px',
        padding: isMobile ? '1rem' : '1.5rem',
        border: '1px solid rgba(16, 185, 129, 0.15)'
      }}>
        <h3 style={{
          color: '#fff',
          fontSize: isMobile ? '1.1rem' : '1.3rem',
          marginBottom: '1rem'
        }}>
          Calorie Trend
        </h3>
        
        <div style={{ height: isMobile ? '250px' : '300px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyData.map(d => ({
              date: new Date(d.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
              calories: d.calories,
              target: d.targets.calories
            }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
              <XAxis 
                dataKey="date" 
                stroke="rgba(255, 255, 255, 0.6)" 
                fontSize={isMobile ? 10 : 12}
                tick={{ fill: 'rgba(255, 255, 255, 0.6)' }}
              />
              <YAxis 
                stroke="rgba(255, 255, 255, 0.6)" 
                fontSize={isMobile ? 10 : 12}
                tick={{ fill: 'rgba(255, 255, 255, 0.6)' }}
              />
              <Tooltip 
                contentStyle={{
                  background: 'rgba(0, 0, 0, 0.9)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '0.9rem'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="calories" 
                stroke="#f59e0b" 
                strokeWidth={3}
                dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="target" 
                stroke="rgba(255, 255, 255, 0.4)" 
                strokeDasharray="5 5"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

// ===== INSIGHTS VIEW =====
const InsightsView = ({ progressData, timeframe, isMobile }) => {
  const insights = generateHistoryInsights(progressData, timeframe)
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {insights.map((insight, idx) => (
        <div key={idx} style={{
          background: `linear-gradient(135deg, ${insight.color}15 0%, ${insight.color}05 100%)`,
          border: `1px solid ${insight.color}30`,
          borderRadius: '16px',
          padding: isMobile ? '1.25rem' : '1.5rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '0.75rem'
          }}>
            <insight.icon size={24} style={{ color: insight.color }} />
            <h3 style={{
              color: '#fff',
              fontSize: isMobile ? '1rem' : '1.1rem',
              fontWeight: '600'
            }}>
              {insight.title}
            </h3>
          </div>
          <p style={{
            color: 'rgba(255, 255, 255, 0.8)',
            lineHeight: '1.5',
            fontSize: isMobile ? '0.9rem' : '1rem'
          }}>
            {insight.message}
          </p>
        </div>
      ))}
    </div>
  )
}

// ===== HELPER COMPONENTS =====
const LoadingState = ({ isMobile }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '300px'
  }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{
        width: isMobile ? '40px' : '50px',
        height: isMobile ? '40px' : '50px',
        border: '4px solid rgba(16, 185, 129, 0.2)',
        borderTopColor: 'rgba(16, 185, 129, 0.8)',
        borderRadius: '50%',
        margin: '0 auto 1rem',
        animation: 'spin 1s linear infinite'
      }} />
      <div style={{ color: 'rgba(255,255,255,0.6)' }}>
        Loading history data...
      </div>
    </div>
  </div>
)

const SummaryCard = ({ title, value, subtitle, icon: Icon, color, isMobile }) => (
  <div style={{
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '12px',
    padding: isMobile ? '1rem' : '1.25rem',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    textAlign: 'center'
  }}>
    <Icon size={isMobile ? 20 : 24} style={{ color, marginBottom: '0.5rem' }} />
    <div style={{
      color: '#fff',
      fontSize: isMobile ? '1.5rem' : '1.8rem',
      fontWeight: '700',
      marginBottom: '0.25rem'
    }}>
      {value}
    </div>
    <div style={{
      color: 'rgba(255, 255, 255, 0.6)',
      fontSize: isMobile ? '0.75rem' : '0.8rem'
    }}>
      {title}
    </div>
    {subtitle && (
      <div style={{
        color: 'rgba(255, 255, 255, 0.4)',
        fontSize: '0.7rem'
      }}>
        {subtitle}
      </div>
    )}
  </div>
)

// ===== HELPER FUNCTIONS =====
const getMealTypeIcon = (type) => {
  if (!type) return Clock
  const typeStr = String(type).toLowerCase()
  if (typeStr.includes('breakfast') || typeStr.includes('ontbijt')) return Coffee
  if (typeStr.includes('lunch')) return Sun  
  if (typeStr.includes('dinner') || typeStr.includes('diner')) return Moon
  if (typeStr.includes('snack') || typeStr.includes('tussendoortje')) return Apple
  return Clock
}

const getIconColor = (type) => {
  if (!type) return 'rgba(255, 255, 255, 0.6)'
  const typeStr = String(type).toLowerCase()
  if (typeStr.includes('breakfast') || typeStr.includes('ontbijt')) return '#f59e0b'
  if (typeStr.includes('lunch')) return '#10b981'
  if (typeStr.includes('dinner') || typeStr.includes('diner')) return '#8b5cf6'
  if (typeStr.includes('snack') || typeStr.includes('tussendoortje')) return '#06b6d4'
  return 'rgba(255, 255, 255, 0.6)'
}

const generateHistoryInsights = (progressData, timeframe) => {
  if (!progressData) return []
  
  const { summary, dailyData, streakData } = progressData
  const insights = []
  
  const timeLabel = timeframe === 'week' ? '7 days' : timeframe === 'month' ? '30 days' : '90 days'
  
  if (summary.adherenceRate >= 80) {
    insights.push({
      title: 'Excellent Consistency!',
      message: `You've been tracking ${summary.adherenceRate}% of days over the last ${timeLabel}. This consistency is key to reaching your goals!`,
      icon: Award,
      color: '#10b981'
    })
  }
  
  if (streakData.current >= 5) {
    insights.push({
      title: `${streakData.current} Day Streak!`,
      message: `You're on fire! Your current streak shows you're building lasting healthy habits.`,
      icon: Flame,
      color: '#ef4444'
    })
  }
  
  if (summary.targetHitRate >= 70) {
    insights.push({
      title: 'Great Target Accuracy',
      message: `You hit your calorie target ${summary.targetHitRate}% of the time. This balance will help optimize your results.`,
      icon: Target,
      color: '#10b981'
    })
  } else if (summary.targetHitRate < 40) {
    insights.push({
      title: 'Room for Improvement',
      message: `Your target hit rate is ${summary.targetHitRate}%. Try meal prepping to stay more consistent with your nutrition goals.`,
      icon: TrendingUp,
      color: '#f59e0b'
    })
  }
  
  return insights.slice(0, 3)
}
