// src/modules/client-management/modules/AnalyticsModule.jsx
import { useState, useEffect } from 'react'

export default function AnalyticsModule({ client, data, onAction, viewMode, db }) {
  const [timeRange, setTimeRange] = useState('week')
  const [loading, setLoading] = useState(false)
  
  // Calculate analytics from available data
  const analytics = {
    overall_score: data?.overall_score || 0,
    trends: data?.trends || {},
    achievements: data?.achievements || [],
    insights: data?.insights || []
  }
  
  // Calculate progress metrics
  const calculateMetrics = () => {
    const metrics = {
      workout_compliance: analytics.trends.workout_compliance || 0,
      meal_compliance: analytics.trends.meal_compliance || 0,
      weight_change: analytics.trends.weight_change || 0,
      goal_progress: analytics.trends.goal_progress || 0
    }
    
    // Overall health score (average of all metrics)
    const overall = Math.round(
      (metrics.workout_compliance + metrics.meal_compliance + metrics.goal_progress) / 3
    )
    
    return { ...metrics, overall }
  }
  
  const metrics = calculateMetrics()
  
  const getScoreColor = (score) => {
    if (score >= 80) return '#10b981'
    if (score >= 60) return '#3b82f6'
    if (score >= 40) return '#f59e0b'
    return '#ef4444'
  }
  
  const getTrendIcon = (value) => {
    if (value > 0) return '📈'
    if (value < 0) return '📉'
    return '➡️'
  }
  
  const getInsightIcon = (type) => {
    switch(type) {
      case 'success': return '✅'
      case 'warning': return '⚠️'
      case 'tip': return '💡'
      case 'celebration': return '🎉'
      default: return '📊'
    }
  }
  
  // Focus view - detailed analytics
  if (viewMode === 'focus') {
    return (
      <div>
        <div className="myarc-flex myarc-justify-between myarc-items-center" style={{ marginBottom: 'var(--s-3)' }}>
          <h4 style={{ color: '#fff' }}>📊 Analytics & Insights</h4>
          <select
            className="myarc-select myarc-select-sm"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            style={{
              background: 'rgba(0,0,0,0.5)',
              border: '1px solid rgba(59, 130, 246, 0.3)'
            }}
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="all">All Time</option>
          </select>
        </div>
        
        {/* Overall Score Card */}
        <div style={{
          background: `linear-gradient(135deg, ${getScoreColor(metrics.overall)}20, transparent)`,
          borderRadius: '12px',
          padding: 'var(--s-4)',
          marginBottom: 'var(--s-4)',
          textAlign: 'center'
        }}>
          <p style={{ color: 'var(--c-muted)', fontSize: 'var(--text-sm)' }}>Overall Performance</p>
          <p style={{ 
            color: getScoreColor(metrics.overall), 
            fontSize: '3rem', 
            fontWeight: 'bold',
            margin: 'var(--s-2) 0'
          }}>
            {metrics.overall}%
          </p>
          <p style={{ color: 'var(--c-muted)', fontSize: 'var(--text-sm)' }}>
            {metrics.overall >= 80 ? 'Excellent!' : 
             metrics.overall >= 60 ? 'Good Progress' : 
             metrics.overall >= 40 ? 'Room for Improvement' : 'Needs Attention'}
          </p>
        </div>
        
        {/* Metrics Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 'var(--s-3)',
          marginBottom: 'var(--s-4)'
        }}>
          <div style={{
            background: 'rgba(0,0,0,0.3)',
            borderRadius: '8px',
            padding: 'var(--s-3)',
            borderLeft: `4px solid ${getScoreColor(metrics.workout_compliance)}`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ color: 'var(--c-muted)', fontSize: 'var(--text-sm)' }}>Workout</p>
              <span>{getTrendIcon(analytics.trends.workout_trend || 0)}</span>
            </div>
            <p style={{ 
              color: getScoreColor(metrics.workout_compliance),
              fontSize: '1.5rem',
              fontWeight: 'bold'
            }}>
              {metrics.workout_compliance}%
            </p>
            {analytics.trends.workout_trend && (
              <p style={{ 
                color: analytics.trends.workout_trend > 0 ? '#10b981' : '#ef4444',
                fontSize: 'var(--text-xs)'
              }}>
                {analytics.trends.workout_trend > 0 ? '+' : ''}{analytics.trends.workout_trend}% vs last {timeRange}
              </p>
            )}
          </div>
          
          <div style={{
            background: 'rgba(0,0,0,0.3)',
            borderRadius: '8px',
            padding: 'var(--s-3)',
            borderLeft: `4px solid ${getScoreColor(metrics.meal_compliance)}`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ color: 'var(--c-muted)', fontSize: 'var(--text-sm)' }}>Nutrition</p>
              <span>{getTrendIcon(analytics.trends.meal_trend || 0)}</span>
            </div>
            <p style={{ 
              color: getScoreColor(metrics.meal_compliance),
              fontSize: '1.5rem',
              fontWeight: 'bold'
            }}>
              {metrics.meal_compliance}%
            </p>
            {analytics.trends.meal_trend && (
              <p style={{ 
                color: analytics.trends.meal_trend > 0 ? '#10b981' : '#ef4444',
                fontSize: 'var(--text-xs)'
              }}>
                {analytics.trends.meal_trend > 0 ? '+' : ''}{analytics.trends.meal_trend}% vs last {timeRange}
              </p>
            )}
          </div>
          
          <div style={{
            background: 'rgba(0,0,0,0.3)',
            borderRadius: '8px',
            padding: 'var(--s-3)',
            borderLeft: '4px solid #3b82f6'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ color: 'var(--c-muted)', fontSize: 'var(--text-sm)' }}>Weight</p>
              <span>{getTrendIcon(metrics.weight_change)}</span>
            </div>
            <p style={{ 
              color: metrics.weight_change !== 0 ? '#3b82f6' : 'var(--c-muted)',
              fontSize: '1.5rem',
              fontWeight: 'bold'
            }}>
              {metrics.weight_change > 0 ? '+' : ''}{metrics.weight_change || 0} kg
            </p>
            <p style={{ color: 'var(--c-muted)', fontSize: 'var(--text-xs)' }}>
              this {timeRange}
            </p>
          </div>
          
          <div style={{
            background: 'rgba(0,0,0,0.3)',
            borderRadius: '8px',
            padding: 'var(--s-3)',
            borderLeft: `4px solid ${getScoreColor(metrics.goal_progress)}`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ color: 'var(--c-muted)', fontSize: 'var(--text-sm)' }}>Goals</p>
              <span>🎯</span>
            </div>
            <p style={{ 
              color: getScoreColor(metrics.goal_progress),
              fontSize: '1.5rem',
              fontWeight: 'bold'
            }}>
              {metrics.goal_progress}%
            </p>
            <p style={{ color: 'var(--c-muted)', fontSize: 'var(--text-xs)' }}>
              completed
            </p>
          </div>
        </div>
        
        {/* Achievements */}
        {analytics.achievements.length > 0 && (
          <div style={{
            background: 'rgba(0,0,0,0.3)',
            borderRadius: '8px',
            padding: 'var(--s-3)',
            marginBottom: 'var(--s-3)'
          }}>
            <p style={{ color: 'var(--c-muted)', fontSize: 'var(--text-sm)', marginBottom: 'var(--s-2)' }}>
              Recent Achievements
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--s-2)' }}>
              {analytics.achievements.slice(0, 5).map((achievement, idx) => (
                <div key={idx} style={{
                  background: 'rgba(16, 185, 129, 0.2)',
                  border: '1px solid #10b981',
                  borderRadius: '20px',
                  padding: '4px 12px',
                  fontSize: 'var(--text-sm)'
                }}>
                  🏆 {achievement.title}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Insights & Recommendations */}
        <div style={{
          background: 'rgba(0,0,0,0.3)',
          borderRadius: '8px',
          padding: 'var(--s-3)'
        }}>
          <p style={{ color: 'var(--c-muted)', fontSize: 'var(--text-sm)', marginBottom: 'var(--s-2)' }}>
            AI Insights & Recommendations
          </p>
          {analytics.insights.length > 0 ? (
            analytics.insights.slice(0, 3).map((insight, idx) => (
              <div key={idx} style={{
                padding: 'var(--s-2)',
                borderBottom: idx < 2 ? '1px solid var(--c-border)' : 'none'
              }}>
                <p style={{ color: '#fff', fontSize: 'var(--text-sm)' }}>
                  {getInsightIcon(insight.type)} {insight.message}
                </p>
              </div>
            ))
          ) : (
            <div style={{ color: 'var(--c-muted)', fontSize: 'var(--text-sm)' }}>
              <p>💡 {client.first_name} is showing consistent progress</p>
              <p>📈 Consider increasing workout intensity</p>
              <p>🎯 Goal completion rate is improving</p>
            </div>
          )}
        </div>
        
        {/* Action Buttons */}
        <div style={{ marginTop: 'var(--s-3)', display: 'flex', gap: 'var(--s-2)' }}>
          <button
            className="myarc-btn myarc-btn-primary"
            onClick={() => onAction('generateReport', { timeRange })}
            style={{ flex: 1 }}
          >
            Generate Report
          </button>
          <button
            className="myarc-btn myarc-btn-secondary"
            onClick={() => onAction('exportData', {})}
            style={{ flex: 1 }}
          >
            Export Data
          </button>
        </div>
      </div>
    )
  }
  
  // Grid/List view - compact display
  return (
    <div>
      <div style={{
        background: `linear-gradient(135deg, ${getScoreColor(metrics.overall)}20, transparent)`,
        borderRadius: '8px',
        padding: 'var(--s-3)',
        marginBottom: 'var(--s-2)',
        textAlign: 'center'
      }}>
        <p style={{ color: 'var(--c-muted)', fontSize: 'var(--text-sm)' }}>Performance</p>
        <p style={{ 
          color: getScoreColor(metrics.overall),
          fontSize: '1.5rem',
          fontWeight: 'bold'
        }}>
          {metrics.overall}%
        </p>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-around',
          marginTop: 'var(--s-1)',
          fontSize: 'var(--text-xs)',
          color: 'var(--c-muted)'
        }}>
          <span>💪 {metrics.workout_compliance}%</span>
          <span>🍽️ {metrics.meal_compliance}%</span>
        </div>
      </div>
      <button
        className="myarc-btn myarc-btn-sm myarc-btn-primary"
        onClick={() => onAction('viewDetails', {})}
        style={{ width: '100%' }}
      >
        View Analytics
      </button>
    </div>
  )
}
