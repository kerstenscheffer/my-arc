// src/modules/nutrition-progress/NutritionProgressMain.jsx
// 📊 NUTRITION PROGRESS - Main Component met Charts & Insights

import React, { useState, useEffect } from 'react'
import { 
  TrendingUp, Flame, Droplets, Target, Award, Calendar,
  BarChart3, Activity, Heart, Zap, Coffee, ChevronDown,
  ChevronUp, Star, Trophy, Clock, CheckCircle2, ArrowUp,
  ArrowDown, Minus, Eye, Filter, RefreshCw, Sparkles
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'
import nutritionProgressService from './NutritionProgressService'

export default function NutritionProgressMain({ client, db, onNavigate }) {
  const isMobile = window.innerWidth <= 768
  
  // State management
  const [loading, setLoading] = useState(true)
  const [progressData, setProgressData] = useState(null)
  const [activeTimeframe, setActiveTimeframe] = useState(30) // 7, 14, 30, 90 days
  const [activeTab, setActiveTab] = useState('overview') // overview, trends, habits, history
  const [expandedCards, setExpandedCards] = useState({})

  // Load data on mount and when timeframe changes
  useEffect(() => {
    loadProgressData()
  }, [client, activeTimeframe])

  const loadProgressData = async () => {
    if (!client?.id) return
    
    try {
      setLoading(true)
      const data = await nutritionProgressService.getNutritionProgressData(client.id, activeTimeframe)
      setProgressData(data)
    } catch (error) {
      console.error('Error loading nutrition progress:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleCard = (cardId) => {
    setExpandedCards(prev => ({
      ...prev,
      [cardId]: !prev[cardId]
    }))
  }

  // Loading state
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        background: 'linear-gradient(180deg, #0a0f0d 0%, #1a1a1a 100%)',
        borderRadius: '20px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '4px solid rgba(16, 185, 129, 0.2)',
            borderTopColor: 'rgba(16, 185, 129, 0.8)',
            borderRadius: '50%',
            margin: '0 auto 1.5rem',
            animation: 'spin 1s linear infinite'
          }} />
          <div style={{ color: 'rgba(255,255,255,0.6)' }}>
            Loading nutrition insights...
          </div>
        </div>
      </div>
    )
  }

  if (!progressData) {
    return (
      <div style={{
        padding: '2rem',
        textAlign: 'center',
        background: 'linear-gradient(135deg, rgba(5, 150, 105, 0.08) 0%, rgba(16, 185, 129, 0.03) 100%)',
        borderRadius: '20px',
        border: '1px solid rgba(16, 185, 129, 0.1)'
      }}>
        <Sparkles size={48} style={{ color: 'rgba(16, 185, 129, 0.6)', marginBottom: '1rem' }} />
        <h3 style={{ color: '#fff', marginBottom: '0.5rem' }}>No Nutrition Data Yet</h3>
        <p style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
          Start tracking meals to see amazing insights and progress charts!
        </p>
      </div>
    )
  }

  const { dailyData, summary, waterData, streakData, favoriteFoods } = progressData

  return (
    <div style={{
      background: 'linear-gradient(180deg, #0a0f0d 0%, #1a1a1a 100%)',
      borderRadius: '20px',
      padding: isMobile ? '1.5rem' : '2rem',
      minHeight: '600px'
    }}>
      
      {/* Header with timeframe selector */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h2 style={{
            color: '#fff',
            fontSize: isMobile ? '1.5rem' : '2rem',
            fontWeight: '700',
            marginBottom: '0.25rem'
          }}>
            🍎 Nutrition Progress
          </h2>
          <p style={{
            color: 'rgba(255, 255, 255, 0.6)',
            fontSize: isMobile ? '0.85rem' : '0.95rem'
          }}>
            Your complete nutrition journey & insights
          </p>
        </div>
        
        {/* Timeframe Selector */}
        <div style={{
          display: 'flex',
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '12px',
          padding: '4px',
          gap: '2px'
        }}>
          {[7, 14, 30, 90].map(days => (
            <button
              key={days}
              onClick={() => setActiveTimeframe(days)}
              style={{
                padding: isMobile ? '8px 12px' : '10px 16px',
                background: activeTimeframe === days 
                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                  : 'transparent',
                border: 'none',
                borderRadius: '8px',
                color: activeTimeframe === days ? '#fff' : 'rgba(255, 255, 255, 0.6)',
                fontSize: isMobile ? '0.8rem' : '0.9rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                touchAction: 'manipulation'
              }}
            >
              {days}d
            </button>
          ))}
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        gap: isMobile ? '8px' : '12px',
        marginBottom: '1.5rem',
        overflowX: 'auto',
        paddingBottom: '4px'
      }}>
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'trends', label: 'Trends', icon: TrendingUp },
          { id: 'habits', label: 'Habits', icon: Clock },
          { id: 'insights', label: 'Insights', icon: Sparkles }
        ].map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: isMobile ? '10px 16px' : '12px 20px',
                background: activeTab === tab.id 
                  ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.1) 100%)'
                  : 'rgba(0, 0, 0, 0.2)',
                border: activeTab === tab.id 
                  ? '1px solid rgba(16, 185, 129, 0.3)'
                  : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                color: activeTab === tab.id ? '#10b981' : 'rgba(255, 255, 255, 0.7)',
                fontSize: isMobile ? '0.8rem' : '0.9rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                whiteSpace: 'nowrap',
                touchAction: 'manipulation'
              }}
            >
              <Icon size={isMobile ? 16 : 18} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <OverviewTab 
          summary={summary} 
          dailyData={dailyData}
          streakData={streakData}
          isMobile={isMobile}
          expandedCards={expandedCards}
          toggleCard={toggleCard}
        />
      )}

      {activeTab === 'trends' && (
        <TrendsTab 
          dailyData={dailyData}
          waterData={waterData}
          summary={summary}
          isMobile={isMobile}
        />
      )}

      {activeTab === 'habits' && (
        <HabitsTab 
          dailyData={dailyData}
          favoriteFoods={favoriteFoods}
          streakData={streakData}
          isMobile={isMobile}
        />
      )}

      {activeTab === 'insights' && (
        <InsightsTab 
          summary={summary}
          dailyData={dailyData}
          client={client}
          isMobile={isMobile}
        />
      )}
    </div>
  )
}

// ===== OVERVIEW TAB =====
const OverviewTab = ({ summary, dailyData, streakData, isMobile, expandedCards, toggleCard }) => {
  
  const StatCard = ({ title, value, subtitle, icon: Icon, color = '#10b981', trend = null, expandable = false, cardId = null }) => (
    <div 
      style={{
        background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0.2) 100%)',
        border: '1px solid rgba(16, 185, 129, 0.15)',
        borderRadius: '16px',
        padding: isMobile ? '1.25rem' : '1.5rem',
        cursor: expandable ? 'pointer' : 'default',
        transition: 'all 0.3s ease',
        touchAction: expandable ? 'manipulation' : 'auto'
      }}
      onClick={() => expandable && cardId && toggleCard(cardId)}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Icon size={isMobile ? 20 : 24} style={{ color }} />
          <span style={{
            color: 'rgba(255, 255, 255, 0.8)',
            fontSize: isMobile ? '0.8rem' : '0.9rem',
            fontWeight: '500'
          }}>
            {title}
          </span>
        </div>
        {expandable && <ChevronDown size={16} style={{ color: 'rgba(255, 255, 255, 0.4)' }} />}
        {trend && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {trend > 0 ? <ArrowUp size={14} style={{ color: '#10b981' }} /> : 
             trend < 0 ? <ArrowDown size={14} style={{ color: '#ef4444' }} /> :
             <Minus size={14} style={{ color: 'rgba(255, 255, 255, 0.4)' }} />}
            <span style={{
              fontSize: '0.75rem',
              color: trend > 0 ? '#10b981' : trend < 0 ? '#ef4444' : 'rgba(255, 255, 255, 0.4)'
            }}>
              {Math.abs(trend)}%
            </span>
          </div>
        )}
      </div>
      
      <div style={{
        fontSize: isMobile ? '1.8rem' : '2.2rem',
        fontWeight: '700',
        color: '#fff',
        marginBottom: '0.25rem'
      }}>
        {value}
      </div>
      
      {subtitle && (
        <div style={{
          fontSize: isMobile ? '0.75rem' : '0.8rem',
          color: 'rgba(255, 255, 255, 0.5)'
        }}>
          {subtitle}
        </div>
      )}
    </div>
  )

  return (
    <div>
      {/* Key Metrics Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
        gap: isMobile ? '1rem' : '1.5rem',
        marginBottom: '2rem'
      }}>
        <StatCard
          title="Avg Calories"
          value={summary.avgCalories}
          subtitle={`Target: ${summary.calorieTarget}`}
          icon={Flame}
          color="#f59e0b"
        />
        <StatCard
          title="Avg Protein"
          value={`${summary.avgProtein}g`}
          subtitle={`Target: ${summary.proteinTarget}g`}
          icon={Zap}
          color="#10b981"
        />
        <StatCard
          title="Streak"
          value={streakData.current}
          subtitle={`Best: ${streakData.longest} days`}
          icon={Flame}
          color="#ef4444"
        />
        <StatCard
          title="Adherence"
          value={`${summary.adherenceRate}%`}
          subtitle={`${summary.daysTracked}/${summary.totalDays} days`}
          icon={Target}
          color="#8b5cf6"
        />
      </div>

      {/* Secondary Metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
        gap: isMobile ? '1rem' : '1.5rem',
        marginBottom: '2rem'
      }}>
        <StatCard
          title="Water Intake"
          value={`${summary.avgWater} glasses`}
          subtitle="Average per day"
          icon={Droplets}
          color="#06b6d4"
        />
        <StatCard
          title="Target Hit Rate"
          value={`${summary.targetHitRate}%`}
          subtitle="Within 10% of target"
          icon={Trophy}
          color="#10b981"
        />
        <StatCard
          title="Completion Rate"
          value={`${summary.avgCompletion}%`}
          subtitle="Meals completed"
          icon={CheckCircle2}
          color="#8b5cf6"
        />
      </div>

      {/* Macro Distribution Pie Chart */}
      <MacroDistributionChart 
        protein={summary.avgProtein}
        carbs={summary.avgCarbs}
        fat={summary.avgFat}
        isMobile={isMobile}
      />
    </div>
  )
}

// ===== TRENDS TAB =====
const TrendsTab = ({ dailyData, waterData, summary, isMobile }) => {
  const [chartType, setChartType] = useState('calories') // calories, macros, water, completion

  const chartData = dailyData.map(day => ({
    date: new Date(day.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
    calories: day.calories,
    protein: day.protein,
    carbs: day.carbs,
    fat: day.fat,
    water: day.water,
    completion: day.completionRate,
    target: summary.calorieTarget
  }))

  return (
    <div>
      {/* Chart Type Selector */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '1.5rem',
        overflowX: 'auto',
        paddingBottom: '4px'
      }}>
        {[
          { id: 'calories', label: 'Calories', color: '#f59e0b' },
          { id: 'macros', label: 'Macros', color: '#10b981' },
          { id: 'water', label: 'Water', color: '#06b6d4' },
          { id: 'completion', label: 'Completion', color: '#8b5cf6' }
        ].map(type => (
          <button
            key={type.id}
            onClick={() => setChartType(type.id)}
            style={{
              padding: isMobile ? '8px 16px' : '10px 20px',
              background: chartType === type.id 
                ? `linear-gradient(135deg, ${type.color}20 0%, ${type.color}10 100%)`
                : 'rgba(0, 0, 0, 0.2)',
              border: chartType === type.id 
                ? `1px solid ${type.color}50`
                : '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              color: chartType === type.id ? type.color : 'rgba(255, 255, 255, 0.7)',
              fontSize: isMobile ? '0.8rem' : '0.9rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              whiteSpace: 'nowrap',
              touchAction: 'manipulation'
            }}
          >
            {type.label}
          </button>
        ))}
      </div>

      {/* Chart Container */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.2)',
        borderRadius: '16px',
        padding: isMobile ? '1rem' : '1.5rem',
        height: isMobile ? '300px' : '400px'
      }}>
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'calories' && (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
              <XAxis dataKey="date" stroke="rgba(255, 255, 255, 0.6)" fontSize={12} />
              <YAxis stroke="rgba(255, 255, 255, 0.6)" fontSize={12} />
              <Tooltip 
                contentStyle={{
                  background: 'rgba(0, 0, 0, 0.8)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Line type="monotone" dataKey="calories" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="target" stroke="rgba(255, 255, 255, 0.3)" strokeDasharray="5 5" />
            </LineChart>
          )}
          
          {chartType === 'macros' && (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
              <XAxis dataKey="date" stroke="rgba(255, 255, 255, 0.6)" fontSize={12} />
              <YAxis stroke="rgba(255, 255, 255, 0.6)" fontSize={12} />
              <Tooltip 
                contentStyle={{
                  background: 'rgba(0, 0, 0, 0.8)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Line type="monotone" dataKey="protein" stroke="#10b981" strokeWidth={2} />
              <Line type="monotone" dataKey="carbs" stroke="#f59e0b" strokeWidth={2} />
              <Line type="monotone" dataKey="fat" stroke="#ef4444" strokeWidth={2} />
            </LineChart>
          )}

          {chartType === 'water' && (
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
              <XAxis dataKey="date" stroke="rgba(255, 255, 255, 0.6)" fontSize={12} />
              <YAxis stroke="rgba(255, 255, 255, 0.6)" fontSize={12} />
              <Tooltip 
                contentStyle={{
                  background: 'rgba(0, 0, 0, 0.8)',
                  border: '1px solid rgba(6, 182, 212, 0.3)',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Bar dataKey="water" fill="#06b6d4" radius={[4, 4, 0, 0]} />
            </BarChart>
          )}

          {chartType === 'completion' && (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
              <XAxis dataKey="date" stroke="rgba(255, 255, 255, 0.6)" fontSize={12} />
              <YAxis stroke="rgba(255, 255, 255, 0.6)" fontSize={12} domain={[0, 100]} />
              <Tooltip 
                contentStyle={{
                  background: 'rgba(0, 0, 0, 0.8)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  borderRadius: '8px',
                  color: '#fff'
                }}
                formatter={(value) => [`${value}%`, 'Completion']}
              />
              <Line type="monotone" dataKey="completion" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ===== HABITS TAB =====
const HabitsTab = ({ dailyData, favoriteFoods, streakData, isMobile }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
    
    {/* Favorite Foods */}
    <div style={{
      background: 'rgba(0, 0, 0, 0.2)',
      borderRadius: '16px',
      padding: isMobile ? '1.25rem' : '1.5rem',
      border: '1px solid rgba(16, 185, 129, 0.15)'
    }}>
      <h3 style={{
        color: '#fff',
        fontSize: isMobile ? '1.1rem' : '1.3rem',
        marginBottom: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <Star style={{ color: '#f59e0b' }} size={20} />
        Favorite Foods
      </h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {favoriteFoods.map((food, idx) => (
          <div key={idx} style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.75rem',
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <span style={{ color: '#fff', fontWeight: '500' }}>{food.name}</span>
            <span style={{ 
              color: '#10b981', 
              fontSize: '0.9rem',
              fontWeight: '600' 
            }}>
              {food.frequency}x
            </span>
          </div>
        ))}
      </div>
    </div>

    {/* Weekly Heatmap would go here */}
    <WeeklyHeatmap dailyData={dailyData} isMobile={isMobile} />
  </div>
)

// ===== INSIGHTS TAB =====
const InsightsTab = ({ summary, dailyData, client, isMobile }) => {
  const insights = generateInsights(summary, dailyData)
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {insights.map((insight, idx) => (
        <div key={idx} style={{
          background: `linear-gradient(135deg, ${insight.color}20 0%, ${insight.color}05 100%)`,
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
          {insight.action && (
            <button style={{
              marginTop: '1rem',
              padding: '8px 16px',
              background: `${insight.color}20`,
              border: `1px solid ${insight.color}50`,
              borderRadius: '8px',
              color: insight.color,
              fontSize: '0.9rem',
              fontWeight: '600',
              cursor: 'pointer',
              touchAction: 'manipulation'
            }}>
              {insight.action}
            </button>
          )}
        </div>
      ))}
    </div>
  )
}

// ===== HELPER COMPONENTS =====
const MacroDistributionChart = ({ protein, carbs, fat, isMobile }) => {
  const total = protein * 4 + carbs * 4 + fat * 9 // Calculate calories from macros
  const data = [
    { name: 'Protein', value: Math.round((protein * 4 / total) * 100), color: '#10b981' },
    { name: 'Carbs', value: Math.round((carbs * 4 / total) * 100), color: '#f59e0b' },
    { name: 'Fat', value: Math.round((fat * 9 / total) * 100), color: '#ef4444' }
  ]

  return (
    <div style={{
      background: 'rgba(0, 0, 0, 0.2)',
      borderRadius: '16px',
      padding: isMobile ? '1.25rem' : '1.5rem',
      border: '1px solid rgba(16, 185, 129, 0.15)'
    }}>
      <h3 style={{
        color: '#fff',
        fontSize: isMobile ? '1.1rem' : '1.3rem',
        marginBottom: '1rem',
        textAlign: 'center'
      }}>
        Macro Distribution
      </h3>
      
      <div style={{ height: isMobile ? '200px' : '250px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={isMobile ? 40 : 60}
              outerRadius={isMobile ? 80 : 100}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{
                background: 'rgba(0, 0, 0, 0.8)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '8px',
                color: '#fff'
              }}
              formatter={(value) => [`${value}%`, 'Percentage']}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '1rem',
        marginTop: '1rem'
      }}>
        {data.map(item => (
          <div key={item.name} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: item.color
            }} />
            <span style={{
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '0.8rem'
            }}>
              {item.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

const WeeklyHeatmap = ({ dailyData, isMobile }) => {
  // Create a 7-day heatmap showing completion rates
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  
  const getIntensity = (completionRate) => {
    if (completionRate >= 80) return '#10b981'
    if (completionRate >= 60) return '#f59e0b'  
    if (completionRate >= 40) return '#ef4444'
    return 'rgba(255, 255, 255, 0.1)'
  }

  return (
    <div style={{
      background: 'rgba(0, 0, 0, 0.2)',
      borderRadius: '16px',
      padding: isMobile ? '1.25rem' : '1.5rem',
      border: '1px solid rgba(16, 185, 129, 0.15)'
    }}>
      <h3 style={{
        color: '#fff',
        fontSize: isMobile ? '1.1rem' : '1.3rem',
        marginBottom: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <Calendar style={{ color: '#10b981' }} size={20} />
        Weekly Pattern
      </h3>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '8px'
      }}>
        {weekDays.map((day, idx) => {
          // Find average completion for this day of week
          const dayData = dailyData.filter(d => new Date(d.date).getDay() === (idx + 1) % 7)
          const avgCompletion = dayData.length 
            ? dayData.reduce((acc, d) => acc + d.completionRate, 0) / dayData.length 
            : 0
          
          return (
            <div key={day} style={{ textAlign: 'center' }}>
              <div style={{
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: '0.7rem',
                marginBottom: '4px'
              }}>
                {day}
              </div>
              <div style={{
                width: '100%',
                height: isMobile ? '40px' : '50px',
                background: getIntensity(avgCompletion),
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: '0.8rem',
                fontWeight: '600'
              }}>
                {Math.round(avgCompletion)}%
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ===== HELPER FUNCTIONS =====
const generateInsights = (summary, dailyData) => {
  const insights = []
  
  // Calorie consistency insight
  if (summary.targetHitRate >= 80) {
    insights.push({
      title: 'Great Calorie Consistency!',
      message: `You hit your calorie target ${summary.targetHitRate}% of the time. This consistency will help you reach your goals faster.`,
      icon: Target,
      color: '#10b981',
      action: 'Keep it up!'
    })
  } else if (summary.targetHitRate < 50) {
    insights.push({
      title: 'Calorie Target Needs Attention',
      message: `You're hitting your calorie target only ${summary.targetHitRate}% of the time. Try meal prepping to stay more consistent.`,
      icon: AlertCircle,
      color: '#ef4444',
      action: 'Plan Better'
    })
  }

  // Protein insight
  if (summary.avgProtein >= summary.proteinTarget * 0.8) {
    insights.push({
      title: 'Protein Power!',
      message: `Excellent protein intake at ${summary.avgProtein}g daily. This supports muscle maintenance and recovery.`,
      icon: Zap,
      color: '#10b981'
    })
  }

  // Streak insight
  if (summary.streakData?.current >= 7) {
    insights.push({
      title: 'Amazing Streak!',
      message: `${summary.streakData.current} days in a row! You're building sustainable habits that will last.`,
      icon: Flame,
      color: '#f59e0b'
    })
  }

  // Water insight
  if (summary.avgWater < 6) {
    insights.push({
      title: 'Hydration Opportunity',
      message: `At ${summary.avgWater} glasses daily, you could benefit from more water. Aim for 8-10 glasses per day.`,
      icon: Droplets,
      color: '#06b6d4',
      action: 'Drink More'
    })
  }

  return insights.slice(0, 4) // Max 4 insights
}
