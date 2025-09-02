import useIsMobile from '../../hooks/useIsMobile'
import React, { useState, useEffect } from 'react'
import { 
  Heart, TrendingUp, Apple, Coffee, Award, Info,
  BarChart3, Target, Zap, ChevronRight, Calendar,
  ArrowUp, ArrowDown, Check, AlertCircle, Star,
  Flame, Droplets, Trophy, Activity, Eye, Sparkles,
  TrendingDown, Minus, RefreshCw
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from 'recharts'
import nutritionProgressService from '../nutrition-progress/NutritionProgressService'
import ProgressService from './core/ProgressService'

const THEME = {
  primary: '#10b981',
  gradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.9) 0%, rgba(5, 150, 105, 0.9) 100%)',
  lightGradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.08) 100%)',
  border: 'rgba(16, 185, 129, 0.2)',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444'
}

export default function NutritionModule({ client, db }) {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [nutritionData, setNutritionData] = useState(null)
  const [progressData, setProgressData] = useState(null)
  const [timeRange, setTimeRange] = useState(30)
  const [activeTab, setActiveTab] = useState('overview')
  
  const isMobile = useIsMobile()

  useEffect(() => {
    loadAllNutritionData()
  }, [client?.id, timeRange])

  const loadAllNutritionData = async () => {
    if (!client?.id) return
    
    setLoading(true)
    try {
      // Load both old and new data sources
      const [oldData, newData] = await Promise.all([
        ProgressService.syncWithMealPlan(client.id),
        nutritionProgressService.getNutritionProgressData(client.id, timeRange)
      ])
      
      setNutritionData(oldData)
      setProgressData(newData)
    } catch (error) {
      console.error('Error loading nutrition data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadAllNutritionData()
    setRefreshing(false)
  }

  const renderComplianceRing = (compliance, size = 120) => {
    const strokeWidth = 8
    const radius = (size - strokeWidth) / 2
    const circumference = radius * 2 * Math.PI
    const offset = circumference - (compliance / 100) * circumference
    
    return (
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={THEME.primary}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#fff' }}>
            {compliance}%
          </div>
          <div style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.6)' }}>
            Compliance
          </div>
        </div>
      </div>
    )
  }

  const renderStreakCard = () => {
    const streak = progressData?.streakData?.current || 0
    const longestStreak = progressData?.streakData?.longest || 0
    
    return (
      <div style={{
        background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 127, 0.08) 100%)',
        borderRadius: '16px',
        padding: '1.25rem',
        border: '1px solid rgba(239, 68, 68, 0.2)',
        textAlign: 'center'
      }}>
        <Flame size={32} color="#ef4444" style={{ marginBottom: '0.75rem' }} />
        <div style={{
          fontSize: '2.5rem',
          fontWeight: 'bold',
          color: '#ef4444',
          marginBottom: '0.25rem'
        }}>
          {streak}
        </div>
        <div style={{
          fontSize: '0.85rem',
          color: '#fff',
          marginBottom: '0.5rem'
        }}>
          Huidige Streak
        </div>
        <div style={{
          fontSize: '0.75rem',
          color: 'rgba(255, 255, 255, 0.6)'
        }}>
          Beste: {longestStreak} dagen
        </div>
      </div>
    )
  }

  const renderWaterCard = () => {
    const avgWater = progressData?.summary?.avgWater || 0
    const target = 8 // glasses per day
    const percentage = Math.min(100, (avgWater / target) * 100)
    
    return (
      <div style={{
        background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(14, 165, 233, 0.08) 100%)',
        borderRadius: '16px',
        padding: '1.25rem',
        border: '1px solid rgba(6, 182, 212, 0.2)',
        textAlign: 'center'
      }}>
        <Droplets size={32} color="#06b6d4" style={{ marginBottom: '0.75rem' }} />
        <div style={{
          fontSize: '2.5rem',
          fontWeight: 'bold',
          color: '#06b6d4',
          marginBottom: '0.25rem'
        }}>
          {avgWater}
        </div>
        <div style={{
          fontSize: '0.85rem',
          color: '#fff',
          marginBottom: '0.75rem'
        }}>
          Glazen per dag
        </div>
        
        <div style={{
          height: '6px',
          background: 'rgba(6, 182, 212, 0.2)',
          borderRadius: '3px',
          overflow: 'hidden',
          marginBottom: '0.5rem'
        }}>
          <div style={{
            height: '100%',
            width: `${percentage}%`,
            background: '#06b6d4',
            transition: 'width 0.5s ease'
          }} />
        </div>
        
        <div style={{
          fontSize: '0.75rem',
          color: 'rgba(255, 255, 255, 0.6)'
        }}>
          Doel: {target} glazen ({(target * 0.25).toFixed(1)}L)
        </div>
      </div>
    )
  }

  const renderCalorieTrendChart = () => {
    if (!progressData?.dailyData?.length) return null

    const chartData = progressData.dailyData.slice(-14).map(day => ({
      date: new Date(day.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
      calories: day.calories,
      target: day.targets?.calories || 2000,
      completion: day.completionRate
    }))

    return (
      <div style={{
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '20px',
        padding: '1.5rem',
        border: `1px solid ${THEME.border}`
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem'
        }}>
          <div>
            <h3 style={{
              fontSize: '0.75rem',
              color: THEME.primary,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              fontWeight: '600',
              marginBottom: '0.5rem'
            }}>
              CALORIE TREND (14 DAGEN)
            </h3>
            <div style={{
              fontSize: '1.25rem',
              fontWeight: 'bold',
              color: '#fff'
            }}>
              {progressData.summary.avgCalories} kcal gemiddeld
            </div>
          </div>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            background: 'rgba(16, 185, 129, 0.15)',
            borderRadius: '20px'
          }}>
            <TrendingUp size={16} color={THEME.primary} />
            <span style={{
              fontSize: '0.85rem',
              fontWeight: '600',
              color: THEME.primary
            }}>
              {progressData.summary.targetHitRate}% on target
            </span>
          </div>
        </div>

        <div style={{ height: '200px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="calorieGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={THEME.primary} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={THEME.primary} stopOpacity={0}/>
                </linearGradient>
              </defs>
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
                  border: `1px solid ${THEME.border}`,
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '0.9rem'
                }}
                labelStyle={{ color: 'rgba(255, 255, 255, 0.8)' }}
              />
              <Area
                type="monotone"
                dataKey="calories"
                stroke={THEME.primary}
                strokeWidth={3}
                fill="url(#calorieGradient)"
                dot={{ fill: THEME.primary, strokeWidth: 2, r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="target" 
                stroke="rgba(255, 255, 255, 0.4)" 
                strokeDasharray="5 5"
                strokeWidth={2}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    )
  }

  const renderMacroBalanceChart = () => {
    if (!progressData?.summary) return null

    const macros = [
      { name: 'Protein', value: progressData.summary.avgProtein, color: '#3b82f6' },
      { name: 'Carbs', value: progressData.summary.avgCarbs, color: '#f59e0b' },
      { name: 'Fat', value: progressData.summary.avgFat, color: '#ec4899' }
    ]

    return (
      <div style={{
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '16px',
        padding: '1.5rem'
      }}>
        <h3 style={{
          fontSize: '0.75rem',
          color: 'rgba(255, 255, 255, 0.7)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          fontWeight: '600',
          marginBottom: '1.5rem'
        }}>
          MACRO VERDELING (GEMIDDELD)
        </h3>

        <div style={{ 
          height: '200px', 
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={macros}
                cx="50%"
                cy="50%"
                innerRadius={isMobile ? 40 : 60}
                outerRadius={isMobile ? 80 : 100}
                paddingAngle={5}
                dataKey="value"
              >
                {macros.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  background: 'rgba(0, 0, 0, 0.8)',
                  border: `1px solid ${THEME.border}`,
                  borderRadius: '12px',
                  color: '#fff'
                }}
                formatter={(value, name) => [`${value}g`, name]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '1.5rem',
          marginTop: '1rem'
        }}>
          {macros.map(macro => (
            <div key={macro.name} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: macro.color
              }} />
              <span style={{
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '0.85rem',
                fontWeight: '500'
              }}>
                {macro.name}: {macro.value}g
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderInsightCard = (insight) => {
    const getInsightIcon = () => {
      if (insight.type === 'success') return <Check size={20} color={THEME.success} />
      if (insight.type === 'warning') return <AlertCircle size={20} color={THEME.warning} />
      if (insight.type === 'tip') return <Info size={20} color={THEME.primary} />
      return <Zap size={20} color={THEME.primary} />
    }

    const getInsightColor = () => {
      if (insight.type === 'success') return THEME.success
      if (insight.type === 'warning') return THEME.warning
      return THEME.primary
    }

    return (
      <div style={{
        background: `linear-gradient(135deg, ${getInsightColor()}15 0%, ${getInsightColor()}05 100%)`,
        borderRadius: '16px',
        padding: '1.25rem',
        border: `1px solid ${getInsightColor()}30`,
        display: 'flex',
        gap: '0.75rem',
        alignItems: 'flex-start'
      }}>
        {getInsightIcon()}
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: '1rem',
            color: '#fff',
            fontWeight: '600',
            marginBottom: '0.25rem'
          }}>
            {insight.title}
          </div>
          <div style={{
            fontSize: '0.9rem',
            color: 'rgba(255, 255, 255, 0.8)',
            lineHeight: '1.4'
          }}>
            {insight.message}
          </div>
        </div>
      </div>
    )
  }

  const generateSmartInsights = () => {
    if (!progressData?.summary) return []
    
    const insights = []
    const { summary, streakData } = progressData

    // Adherence insight
    if (summary.adherenceRate >= 80) {
      insights.push({
        title: 'Uitstekende Consistentie!',
        message: `Je hebt ${summary.adherenceRate}% van de dagen getracked. Deze consistentie helpt je doelen te bereiken.`,
        type: 'success'
      })
    } else if (summary.adherenceRate < 50) {
      insights.push({
        title: 'Meer Tracking Nodig',
        message: `Je tracked slechts ${summary.adherenceRate}% van de tijd. Probeer dagelijks je maaltijden te loggen voor betere resultaten.`,
        type: 'warning'
      })
    }

    // Calorie target insight
    if (summary.targetHitRate >= 70) {
      insights.push({
        title: 'Perfecte Calorie Balans',
        message: `Je raakt ${summary.targetHitRate}% van de tijd je calorie target. Dit helpt je doelen te bereiken.`,
        type: 'success'
      })
    } else {
      insights.push({
        title: 'Calorie Target Verbeteren',
        message: `Je raakt maar ${summary.targetHitRate}% van de tijd je target. Probeer meal prep om consistenter te worden.`,
        type: 'tip'
      })
    }

    // Streak insight
    if (streakData?.current >= 7) {
      insights.push({
        title: `${streakData.current} Dagen Streak!`,
        message: 'Je bent bezig met het opbouwen van geweldige gewoontes. Blijf zo doorgaan!',
        type: 'success'
      })
    }

    // Water insight
    if (summary.avgWater < 6) {
      insights.push({
        title: 'Hydratatie Kans',
        message: `Met ${summary.avgWater} glazen per dag kun je meer drinken. Streef naar 8-10 glazen.`,
        type: 'tip'
      })
    }

    return insights.slice(0, 4)
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: `3px solid ${THEME.border}`,
          borderTopColor: THEME.primary,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    )
  }

  if (!nutritionData && !progressData) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '3rem'
      }}>
        <Heart size={48} color={THEME.primary} style={{ marginBottom: '1rem' }} />
        <h3 style={{
          fontSize: '1.2rem',
          color: '#fff',
          marginBottom: '0.5rem'
        }}>
          Geen voedingsdata beschikbaar
        </h3>
        <p style={{
          color: 'rgba(255, 255, 255, 0.6)'
        }}>
          Begin met het loggen van je maaltijden in het Meal Plan
        </p>
      </div>
    )
  }

  // Use comprehensive data if available, fallback to basic data
  const complianceRate = progressData?.summary?.adherenceRate || nutritionData?.insights?.compliance || 0
  const avgCalories = progressData?.summary?.avgCalories || nutritionData?.insights?.averages?.calories || 0
  const goalCalories = progressData?.summary?.calorieTarget || 2000

  return (
    <div>
      {/* Header with refresh button */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.5rem'
      }}>
        <div>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#fff',
            marginBottom: '0.25rem'
          }}>
            Nutrition Progress
          </h2>
          <p style={{
            color: 'rgba(255, 255, 255, 0.6)',
            fontSize: '0.9rem'
          }}>
            Complete analyse van je voedingspatronen
          </p>
        </div>
        
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          style={{
            padding: '0.75rem',
            background: refreshing ? 'rgba(255, 255, 255, 0.05)' : THEME.lightGradient,
            border: `1px solid ${THEME.border}`,
            borderRadius: '12px',
            color: THEME.primary,
            cursor: refreshing ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s ease'
          }}
        >
          <RefreshCw size={16} style={{
            animation: refreshing ? 'spin 1s linear infinite' : 'none'
          }} />
        </button>
      </div>

      {/* Main Stats Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        {/* Compliance Ring */}
        <div style={{
          background: THEME.lightGradient,
          borderRadius: '20px',
          padding: '1.5rem',
          border: `1px solid ${THEME.border}`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {renderComplianceRing(complianceRate)}
          <div style={{
            marginTop: '1rem',
            fontSize: '0.8rem',
            color: 'rgba(255, 255, 255, 0.6)',
            textAlign: 'center'
          }}>
            Laatste {timeRange} dagen
          </div>
        </div>

        {/* Streak Card */}
        {renderStreakCard()}

        {/* Water Card */}
        {renderWaterCard()}

        {/* Average Calories Card */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.08) 100%)',
          borderRadius: '16px',
          padding: '1.25rem',
          border: '1px solid rgba(245, 158, 11, 0.2)',
          textAlign: 'center'
        }}>
          <Flame size={32} color="#f59e0b" style={{ marginBottom: '0.75rem' }} />
          <div style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            color: '#f59e0b',
            marginBottom: '0.25rem'
          }}>
            {avgCalories}
          </div>
          <div style={{
            fontSize: '0.85rem',
            color: '#fff',
            marginBottom: '0.5rem'
          }}>
            Kcal per dag
          </div>
          <div style={{
            fontSize: '0.75rem',
            color: 'rgba(255, 255, 255, 0.6)'
          }}>
            Doel: {goalCalories} kcal
          </div>
        </div>
      </div>

      {/* Time Range Selector */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '1.5rem',
        overflowX: 'auto'
      }}>
        {[7, 14, 30, 60].map(days => (
          <button
            key={days}
            onClick={() => setTimeRange(days)}
            style={{
              padding: '0.5rem 1rem',
              background: timeRange === days ? THEME.gradient : 'rgba(255, 255, 255, 0.05)',
              border: timeRange === days ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              color: '#fff',
              fontSize: '0.85rem',
              fontWeight: timeRange === days ? '600' : 'normal',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.3s ease'
            }}
          >
            {days} dagen
          </button>
        ))}
      </div>

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '1.5rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        paddingBottom: '0.5rem',
        overflowX: 'auto'
      }}>
        {[
          { id: 'overview', label: 'Overzicht', icon: BarChart3 },
          { id: 'trends', label: 'Trends', icon: TrendingUp },
          { id: 'insights', label: 'Inzichten', icon: Sparkles },
          { id: 'macros', label: 'Macros', icon: Activity }
        ].map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1rem',
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === tab.id ? `2px solid ${THEME.primary}` : 'none',
                color: activeTab === tab.id ? THEME.primary : 'rgba(255, 255, 255, 0.6)',
                fontSize: '0.9rem',
                fontWeight: activeTab === tab.id ? '600' : 'normal',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                whiteSpace: 'nowrap'
              }}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
          gap: '1.5rem'
        }}>
          {renderMacroBalanceChart()}
          
          {/* Quick Stats */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '16px',
            padding: '1.5rem'
          }}>
            <h3 style={{
              fontSize: '0.75rem',
              color: 'rgba(255, 255, 255, 0.7)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              fontWeight: '600',
              marginBottom: '1.5rem'
            }}>
              SNELLE STATISTIEKEN
            </h3>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              {[
                { 
                  label: 'Dagen Getracked', 
                  value: progressData?.summary?.daysTracked || 0, 
                  total: progressData?.summary?.totalDays || timeRange,
                  color: THEME.primary,
                  icon: Calendar
                },
                { 
                  label: 'Target Hit Rate', 
                  value: progressData?.summary?.targetHitRate || 0, 
                  unit: '%',
                  color: THEME.success,
                  icon: Target
                },
                { 
                  label: 'Gemiddeld Eiwit', 
                  value: progressData?.summary?.avgProtein || 0, 
                  unit: 'g',
                  color: '#3b82f6',
                  icon: Zap
                }
              ].map(stat => {
                const Icon = stat.icon
                return (
                  <div
                    key={stat.label}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '1rem',
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: '12px',
                      border: `1px solid ${stat.color}20`
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem'
                    }}>
                      <Icon size={20} color={stat.color} />
                      <span style={{
                        fontSize: '0.9rem',
                        color: 'rgba(255, 255, 255, 0.8)'
                      }}>
                        {stat.label}
                      </span>
                    </div>
                    <div style={{
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                      color: '#fff'
                    }}>
                      {stat.value}
                      {stat.total && <span style={{ opacity: 0.6 }}>/{stat.total}</span>}
                      {stat.unit && <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>{stat.unit}</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'trends' && (
        <div>
          {renderCalorieTrendChart()}
        </div>
      )}

      {activeTab === 'insights' && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          {generateSmartInsights().map((insight, index) => (
            <div key={index}>
              {renderInsightCard(insight)}
            </div>
          ))}
          
          {generateSmartInsights().length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '3rem',
              background: 'rgba(0, 0, 0, 0.2)',
              borderRadius: '16px'
            }}>
              <Sparkles size={48} color="rgba(255, 255, 255, 0.3)" style={{ marginBottom: '1rem' }} />
              <div style={{
                fontSize: '1.1rem',
                color: '#fff',
                marginBottom: '0.5rem'
              }}>
                Nog geen inzichten beschikbaar
              </div>
              <div style={{
                color: 'rgba(255, 255, 255, 0.6)'
              }}>
                Log meer maaltijden voor gepersonaliseerde feedback!
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'macros' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '1.5rem'
        }}>
          {renderMacroBalanceChart()}
          
          {/* Macro Targets vs Actual */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '16px',
            padding: '1.5rem'
          }}>
            <h3 style={{
              fontSize: '0.75rem',
              color: 'rgba(255, 255, 255, 0.7)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              fontWeight: '600',
              marginBottom: '1.5rem'
            }}>
              MACRO TARGETS VS WERKELIJK
            </h3>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '1rem'
            }}>
              {[
                { 
                  name: 'Eiwit', 
                  actual: progressData?.summary?.avgProtein || 0,
                  target: progressData?.summary?.proteinTarget || 150,
                  color: '#3b82f6'
                },
                { 
                  name: 'Koolh.', 
                  actual: progressData?.summary?.avgCarbs || 0,
                  target: 200,
                  color: '#f59e0b'
                },
                { 
                  name: 'Vet', 
                  actual: progressData?.summary?.avgFat || 0,
                  target: 67,
                  color: '#ec4899'
                }
              ].map(macro => {
                const percentage = (macro.actual / macro.target) * 100
                
                return (
                  <div
                    key={macro.name}
                    style={{
                      padding: '1.25rem',
                      background: `${macro.color}10`,
                      border: `1px solid ${macro.color}30`,
                      borderRadius: '12px',
                      textAlign: 'center'
                    }}
                  >
                    <div style={{
                      fontSize: '0.75rem',
                      color: 'rgba(255, 255, 255, 0.6)',
                      marginBottom: '0.5rem'
                    }}>
                      {macro.name}
                    </div>
                    
                    <div style={{
                      fontSize: '1.5rem',
                      fontWeight: 'bold',
                      color: macro.color,
                      marginBottom: '0.25rem'
                    }}>
                      {macro.actual}g
                    </div>
                    
                    <div style={{
                      fontSize: '0.8rem',
                      color: 'rgba(255, 255, 255, 0.5)',
                      marginBottom: '0.75rem'
                    }}>
                      Doel: {macro.target}g
                    </div>
                    
                    <div style={{
                      height: '6px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '3px',
                      overflow: 'hidden',
                      marginBottom: '0.5rem'
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${Math.min(100, percentage)}%`,
                        background: macro.color,
                        transition: 'width 0.5s ease'
                      }} />
                    </div>
                    
                    <div style={{
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: percentage > 90 && percentage < 110 ? THEME.success : 
                             percentage < 80 ? THEME.danger : THEME.warning
                    }}>
                      {percentage.toFixed(0)}%
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        div::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        
        div::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 3px;
        }
        
        div::-webkit-scrollbar-thumb {
          background: ${THEME.primary};
          border-radius: 3px;
        }
      `}</style>
    </div>
  )
}
