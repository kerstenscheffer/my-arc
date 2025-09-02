// src/modules/nutrition-progress/components/NutritionCharts.jsx
// 📊 SPECIALIZED CHART COMPONENTS

import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Area, AreaChart } from 'recharts'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

// ===== CALORIE TREND CHART =====
export const CalorieTrendChart = ({ data, target, isMobile = false }) => {
  const chartData = data.map(day => ({
    date: new Date(day.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
    calories: day.calories,
    target: target,
    completion: day.completionRate
  }))

  // Calculate trend
  const recentAvg = data.slice(-7).reduce((acc, d) => acc + d.calories, 0) / 7
  const previousAvg = data.slice(-14, -7).reduce((acc, d) => acc + d.calories, 0) / 7
  const trend = previousAvg > 0 ? ((recentAvg - previousAvg) / previousAvg) * 100 : 0

  return (
    <div style={{
      background: 'rgba(0, 0, 0, 0.2)',
      borderRadius: '16px',
      padding: isMobile ? '1rem' : '1.5rem',
      border: '1px solid rgba(16, 185, 129, 0.15)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1rem'
      }}>
        <h3 style={{
          color: '#fff',
          fontSize: isMobile ? '1.1rem' : '1.3rem',
          margin: 0
        }}>
          Calorie Trend
        </h3>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 0.75rem',
          background: trend > 0 ? 'rgba(16, 185, 129, 0.1)' : trend < 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255, 255, 255, 0.05)',
          borderRadius: '8px'
        }}>
          {trend > 0 ? <TrendingUp size={16} style={{ color: '#10b981' }} /> :
           trend < 0 ? <TrendingDown size={16} style={{ color: '#ef4444' }} /> :
           <Minus size={16} style={{ color: 'rgba(255, 255, 255, 0.4)' }} />}
          <span style={{
            color: trend > 0 ? '#10b981' : trend < 0 ? '#ef4444' : 'rgba(255, 255, 255, 0.4)',
            fontSize: '0.9rem',
            fontWeight: '600'
          }}>
            {trend > 0 ? '+' : ''}{Math.round(trend)}%
          </span>
        </div>
      </div>
      
      <div style={{ height: isMobile ? '250px' : '300px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="calorieGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
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
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: '12px',
                color: '#fff',
                fontSize: '0.9rem'
              }}
              labelStyle={{ color: 'rgba(255, 255, 255, 0.8)' }}
            />
            <Area
              type="monotone"
              dataKey="calories"
              stroke="#f59e0b"
              strokeWidth={3}
              fill="url(#calorieGradient)"
              dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#f59e0b', strokeWidth: 2 }}
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

// ===== MACRO BALANCE CHART =====
export const MacroBalanceChart = ({ data, isMobile = false }) => {
  const chartData = data.slice(-14).map(day => ({
    date: new Date(day.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
    protein: day.protein,
    carbs: day.carbs,
    fat: day.fat
  }))

  return (
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
        Macro Balance (14 Days)
      </h3>
      
      <div style={{ height: isMobile ? '250px' : '300px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
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
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '12px',
                color: '#fff',
                fontSize: '0.9rem'
              }}
              labelStyle={{ color: 'rgba(255, 255, 255, 0.8)' }}
              formatter={(value, name) => [`${value}g`, name.charAt(0).toUpperCase() + name.slice(1)]}
            />
            <Line 
              type="monotone" 
              dataKey="protein" 
              stroke="#10b981" 
              strokeWidth={3}
              dot={{ fill: '#10b981', strokeWidth: 2, r: 3 }}
              activeDot={{ r: 5 }}
            />
            <Line 
              type="monotone" 
              dataKey="carbs" 
              stroke="#f59e0b" 
              strokeWidth={3}
              dot={{ fill: '#f59e0b', strokeWidth: 2, r: 3 }}
              activeDot={{ r: 5 }}
            />
            <Line 
              type="monotone" 
              dataKey="fat" 
              stroke="#ef4444" 
              strokeWidth={3}
              dot={{ fill: '#ef4444', strokeWidth: 2, r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {/* Legend */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: isMobile ? '1rem' : '1.5rem',
        marginTop: '1rem'
      }}>
        {[
          { label: 'Protein', color: '#10b981' },
          { label: 'Carbs', color: '#f59e0b' },
          { label: 'Fat', color: '#ef4444' }
        ].map(item => (
          <div key={item.label} style={{
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
              fontSize: isMobile ? '0.8rem' : '0.9rem',
              fontWeight: '500'
            }}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ===== WATER INTAKE CHART =====
export const WaterIntakeChart = ({ data, isMobile = false }) => {
  const chartData = data.slice(-14).map(day => ({
    date: new Date(day.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
    water: day.water,
    target: 8,
    liters: (day.water * 0.25).toFixed(1)
  }))

  const avgWater = chartData.reduce((acc, day) => acc + day.water, 0) / chartData.length

  return (
    <div style={{
      background: 'rgba(0, 0, 0, 0.2)',
      borderRadius: '16px',
      padding: isMobile ? '1rem' : '1.5rem',
      border: '1px solid rgba(6, 182, 212, 0.15)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1rem'
      }}>
        <h3 style={{
          color: '#fff',
          fontSize: isMobile ? '1.1rem' : '1.3rem',
          margin: 0
        }}>
          Water Intake
        </h3>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: avgWater >= 8 ? '#10b981' : avgWater >= 6 ? '#f59e0b' : '#ef4444',
          fontSize: '0.9rem',
          fontWeight: '600'
        }}>
          <span>{Math.round(avgWater)}</span>
          <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>avg/day</span>
        </div>
      </div>
      
      <div style={{ height: isMobile ? '250px' : '300px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barCategoryGap="20%">
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
              domain={[0, 12]}
            />
            <Tooltip 
              contentStyle={{
                background: 'rgba(0, 0, 0, 0.9)',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                borderRadius: '12px',
                color: '#fff',
                fontSize: '0.9rem'
              }}
              labelStyle={{ color: 'rgba(255, 255, 255, 0.8)' }}
              formatter={(value, name, props) => [
                `${value} glasses (${props.payload.liters}L)`, 
                'Water'
              ]}
            />
            <Bar 
              dataKey="water" 
              fill="#06b6d4" 
              radius={[4, 4, 0, 0]}
              background={{ fill: 'rgba(6, 182, 212, 0.1)', radius: [4, 4, 0, 0] }}
            />
            <Line 
              type="monotone" 
              dataKey="target" 
              stroke="rgba(6, 182, 212, 0.5)" 
              strokeDasharray="5 5"
              strokeWidth={2}
              dot={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div style={{
        marginTop: '1rem',
        padding: '0.75rem',
        background: 'rgba(6, 182, 212, 0.1)',
        borderRadius: '8px',
        textAlign: 'center'
      }}>
        <span style={{
          color: '#06b6d4',
          fontSize: '0.9rem',
          fontWeight: '600'
        }}>
          💧 Target: 8 glasses (2L) per day
        </span>
      </div>
    </div>
  )
}

// ===== STREAK VISUALIZATION =====
export const StreakVisualization = ({ currentStreak, longestStreak, dailyData, isMobile = false }) => {
  const streakDays = Math.min(currentStreak, 30) // Show max 30 days
  
  const generateStreakData = () => {
    const data = []
    for (let i = streakDays - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      
      // Find if this day had good completion (mock logic)
      const dayEntry = dailyData.find(d => 
        new Date(d.date).toDateString() === date.toDateString()
      )
      
      data.push({
        date: date.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
        completed: dayEntry ? dayEntry.completionRate >= 80 : false,
        completionRate: dayEntry ? dayEntry.completionRate : 0
      })
    }
    return data
  }

  const streakData = generateStreakData()

  return (
    <div style={{
      background: 'rgba(0, 0, 0, 0.2)',
      borderRadius: '16px',
      padding: isMobile ? '1rem' : '1.5rem',
      border: '1px solid rgba(239, 68, 68, 0.15)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1rem'
      }}>
        <h3 style={{
          color: '#fff',
          fontSize: isMobile ? '1.1rem' : '1.3rem',
          margin: 0
        }}>
          Current Streak
        </h3>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <div style={{
            padding: '0.5rem 0.75rem',
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem'
          }}>
            <span style={{
              color: '#fff',
              fontSize: '1.2rem',
              fontWeight: '700'
            }}>
              {currentStreak}
            </span>
            <span style={{
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '0.8rem'
            }}>
              days
            </span>
          </div>
        </div>
      </div>
      
      {/* Streak visualization dots */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '4px',
        marginBottom: '1rem'
      }}>
        {streakData.map((day, idx) => (
          <div
            key={idx}
            style={{
              width: isMobile ? '24px' : '28px',
              height: isMobile ? '24px' : '28px',
              borderRadius: '50%',
              background: day.completed 
                ? `linear-gradient(135deg, #ef4444 0%, #dc2626 100%)`
                : 'rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.7rem',
              color: day.completed ? '#fff' : 'rgba(255, 255, 255, 0.4)',
              fontWeight: '600',
              border: day.completed ? '2px solid #fca5a5' : '1px solid rgba(255, 255, 255, 0.2)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            title={`${day.date}: ${Math.round(day.completionRate)}% completion`}
          >
            {day.completed ? '🔥' : '·'}
          </div>
        ))}
      </div>
      
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '0.75rem',
        background: 'rgba(239, 68, 68, 0.1)',
        borderRadius: '8px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            color: '#ef4444',
            fontSize: '1.1rem',
            fontWeight: '700'
          }}>
            {currentStreak}
          </div>
          <div style={{
            color: 'rgba(255, 255, 255, 0.6)',
            fontSize: '0.8rem'
          }}>
            Current
          </div>
        </div>
        
        <div style={{
          width: '1px',
          background: 'rgba(255, 255, 255, 0.1)'
        }} />
        
        <div style={{ textAlign: 'center' }}>
          <div style={{
            color: '#ef4444',
            fontSize: '1.1rem',
            fontWeight: '700'
          }}>
            {longestStreak}
          </div>
          <div style={{
            color: 'rgba(255, 255, 255, 0.6)',
            fontSize: '0.8rem'
          }}>
            Best Ever
          </div>
        </div>
      </div>
    </div>
  )
}
