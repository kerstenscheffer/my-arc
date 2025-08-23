// src/modules/client-management/modules/ProgressModule.jsx
// Progress tracking module - Volledig operationeel met prachtige visualisaties

import { useState, useEffect } from 'react'

export default function ProgressModule({ client, data, onAction, viewMode, db }) {
  const [selectedMetric, setSelectedMetric] = useState('weight')
  const [showAddProgress, setShowAddProgress] = useState(false)
  const [showPhotoUpload, setShowPhotoUpload] = useState(false)
  const [progressForm, setProgressForm] = useState({
    weight: '',
    body_fat: '',
    muscle_mass: '',
    waist: '',
    chest: '',
    arms: '',
    notes: ''
  })
  const [saving, setSaving] = useState(false)
  
  // Calculate trends with better logic
  const calculateTrend = (metric, days = 7) => {
    if (!data || !data.measurements || data.measurements.length < 2) return null
    
    const recent = data.measurements
      .filter(m => m[metric])
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, days + 1)
    
    if (recent.length < 2) return null
    
    const first = recent[recent.length - 1][metric]
    const last = recent[0][metric]
    const change = last - first
    const percentChange = (change / first) * 100
    
    return {
      value: change,
      percent: percentChange,
      trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
      isGood: metric === 'weight' ? change < 0 : metric === 'body_fat' ? change < 0 : change > 0
    }
  }
  
  const handleAddProgress = async () => {
    if (!progressForm.weight && !progressForm.body_fat && !progressForm.muscle_mass) {
      alert('⚠️ Please enter at least one measurement')
      return
    }
    
    setSaving(true)
    try {
      // Save to database
      await db.saveProgress({
        client_id: client.id,
        ...progressForm,
        date: new Date().toISOString()
      })
      
      // Reset form
      setProgressForm({
        weight: '',
        body_fat: '',
        muscle_mass: '',
        waist: '',
        chest: '',
        arms: '',
        notes: ''
      })
      setShowAddProgress(false)
      
      // Refresh data
      await onAction('refresh', {})
      alert('✅ Progress saved successfully!')
    } catch (error) {
      alert(`❌ Error: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }
  
  // Get latest measurements
  const latest = data?.measurements?.[0] || {}
  const previous = data?.measurements?.[1] || {}
  const weightTrend = calculateTrend('weight')
  const fatTrend = calculateTrend('body_fat')
  const muscleTrend = calculateTrend('muscle_mass')
  
  // Calculate days since last check-in
  const daysSinceLastCheckIn = latest.date 
    ? Math.floor((new Date() - new Date(latest.date)) / (1000 * 60 * 60 * 24))
    : null
  
  // Focus mode - detailed view
  if (viewMode === 'focus') {
    return (
      <div>
        {/* Alert if no recent check-in */}
        {daysSinceLastCheckIn > 7 && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(245, 158, 11, 0.1) 100%)',
            border: '1px solid #f59e0b',
            borderRadius: '8px',
            padding: 'var(--s-3)',
            marginBottom: 'var(--s-3)'
          }}>
            <p style={{ color: '#f59e0b', fontWeight: 'bold' }}>
              ⚠️ No check-in for {daysSinceLastCheckIn} days
            </p>
            <p style={{ color: 'var(--c-muted)', fontSize: 'var(--text-sm)' }}>
              Request a progress update from {client.first_name}
            </p>
          </div>
        )}
        
        {/* Progress Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 'var(--s-3)',
          marginBottom: 'var(--s-4)'
        }}>
          <StatCard
            title="Weight"
            value={latest.weight || '-'}
            previousValue={previous.weight}
            unit="kg"
            trend={weightTrend}
            onClick={() => setSelectedMetric('weight')}
            selected={selectedMetric === 'weight'}
            gradient="linear-gradient(135deg, #10b981, #059669)"
          />
          <StatCard
            title="Body Fat"
            value={latest.body_fat || '-'}
            previousValue={previous.body_fat}
            unit="%"
            trend={fatTrend}
            onClick={() => setSelectedMetric('body_fat')}
            selected={selectedMetric === 'body_fat'}
            gradient="linear-gradient(135deg, #f59e0b, #d97706)"
          />
          <StatCard
            title="Muscle Mass"
            value={latest.muscle_mass || '-'}
            previousValue={previous.muscle_mass}
            unit="kg"
            trend={muscleTrend}
            onClick={() => setSelectedMetric('muscle_mass')}
            selected={selectedMetric === 'muscle_mass'}
            gradient="linear-gradient(135deg, #3b82f6, #2563eb)"
          />
          <StatCard
            title="Last Check"
            value={daysSinceLastCheckIn !== null ? 
              (daysSinceLastCheckIn === 0 ? 'Today' : 
               daysSinceLastCheckIn === 1 ? 'Yesterday' : 
               `${daysSinceLastCheckIn}d ago`) : 'Never'}
            unit=""
            onClick={() => setSelectedMetric('checkin')}
            selected={selectedMetric === 'checkin'}
            gradient="linear-gradient(135deg, #8b5cf6, #7c3aed)"
          />
        </div>
        
        {/* Progress Chart */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.3) 100%)',
          borderRadius: '12px',
          padding: 'var(--s-4)',
          marginBottom: 'var(--s-4)',
          border: '1px solid rgba(16, 185, 129, 0.1)'
        }}>
          <h4 style={{ color: '#fff', marginBottom: 'var(--s-3)' }}>
            {selectedMetric === 'weight' ? 'Weight Progress' :
             selectedMetric === 'body_fat' ? 'Body Fat Progress' :
             selectedMetric === 'muscle_mass' ? 'Muscle Mass Progress' :
             'Check-in History'}
          </h4>
          <ProgressChart
            data={data?.measurements || []}
            metric={selectedMetric}
          />
        </div>
        
        {/* Measurements Section */}
        <div style={{
          background: 'rgba(0,0,0,0.3)',
          borderRadius: '12px',
          padding: 'var(--s-3)',
          marginBottom: 'var(--s-3)'
        }}>
          <h4 style={{ color: '#fff', marginBottom: 'var(--s-2)' }}>Body Measurements</h4>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 'var(--s-3)'
          }}>
            <MeasurementItem label="Waist" value={latest.waist} unit="cm" />
            <MeasurementItem label="Chest" value={latest.chest} unit="cm" />
            <MeasurementItem label="Arms" value={latest.arms} unit="cm" />
          </div>
        </div>
        
        {/* Action Buttons */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 'var(--s-2)',
          marginBottom: 'var(--s-3)'
        }}>
          <button
            className="myarc-btn myarc-btn-primary"
            onClick={() => setShowAddProgress(!showAddProgress)}
            style={{
              background: 'linear-gradient(135deg, #10b981, #059669)',
              border: 'none'
            }}
          >
            {showAddProgress ? '✕ Cancel' : '➕ Add Progress'}
          </button>
          <button
            className="myarc-btn myarc-btn-secondary"
            onClick={() => setShowPhotoUpload(!showPhotoUpload)}
            style={{
              background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
              border: 'none',
              color: '#fff'
            }}
          >
            📸 Progress Photo
          </button>
        </div>
        
        {/* Add Progress Form */}
        {showAddProgress && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
            border: '2px solid #10b981',
            borderRadius: '12px',
            padding: 'var(--s-4)',
            marginBottom: 'var(--s-3)',
            animation: 'slideIn 0.3s ease'
          }}>
            <h4 style={{ color: '#10b981', marginBottom: 'var(--s-3)' }}>New Progress Entry</h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--s-3)' }}>
              <div>
                <label style={{ color: 'var(--c-muted)', fontSize: 'var(--text-sm)' }}>Weight (kg)</label>
                <input
                  className="myarc-input"
                  type="number"
                  step="0.1"
                  value={progressForm.weight}
                  onChange={(e) => setProgressForm({...progressForm, weight: e.target.value})}
                  style={{ background: 'rgba(0,0,0,0.3)' }}
                />
              </div>
              
              <div>
                <label style={{ color: 'var(--c-muted)', fontSize: 'var(--text-sm)' }}>Body Fat (%)</label>
                <input
                  className="myarc-input"
                  type="number"
                  step="0.1"
                  value={progressForm.body_fat}
                  onChange={(e) => setProgressForm({...progressForm, body_fat: e.target.value})}
                  style={{ background: 'rgba(0,0,0,0.3)' }}
                />
              </div>
              
              <div>
                <label style={{ color: 'var(--c-muted)', fontSize: 'var(--text-sm)' }}>Muscle Mass (kg)</label>
                <input
                  className="myarc-input"
                  type="number"
                  step="0.1"
                  value={progressForm.muscle_mass}
                  onChange={(e) => setProgressForm({...progressForm, muscle_mass: e.target.value})}
                  style={{ background: 'rgba(0,0,0,0.3)' }}
                />
              </div>
              
              <div>
                <label style={{ color: 'var(--c-muted)', fontSize: 'var(--text-sm)' }}>Waist (cm)</label>
                <input
                  className="myarc-input"
                  type="number"
                  step="0.1"
                  value={progressForm.waist}
                  onChange={(e) => setProgressForm({...progressForm, waist: e.target.value})}
                  style={{ background: 'rgba(0,0,0,0.3)' }}
                />
              </div>
            </div>
            
            <div style={{ marginTop: 'var(--s-3)' }}>
              <label style={{ color: 'var(--c-muted)', fontSize: 'var(--text-sm)' }}>Notes</label>
              <textarea
                className="myarc-input"
                rows="3"
                value={progressForm.notes}
                onChange={(e) => setProgressForm({...progressForm, notes: e.target.value})}
                placeholder="How is the client feeling? Any observations?"
                style={{ background: 'rgba(0,0,0,0.3)' }}
              />
            </div>
            
            <div className="myarc-flex myarc-gap-sm" style={{ marginTop: 'var(--s-3)' }}>
              <button
                className="myarc-btn myarc-btn-primary"
                onClick={handleAddProgress}
                disabled={saving}
                style={{ flex: 1 }}
              >
                {saving ? 'Saving...' : '💾 Save Progress'}
              </button>
              <button
                className="myarc-btn myarc-btn-ghost"
                onClick={() => setShowAddProgress(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        
        {/* Photo Upload Section */}
        {showPhotoUpload && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)',
            border: '2px solid #8b5cf6',
            borderRadius: '12px',
            padding: 'var(--s-4)',
            marginBottom: 'var(--s-3)',
            textAlign: 'center'
          }}>
            <p style={{ color: '#8b5cf6', fontSize: '3rem', marginBottom: 'var(--s-2)' }}>📸</p>
            <p style={{ color: '#fff', marginBottom: 'var(--s-3)' }}>Progress Photo Upload</p>
            <p style={{ color: 'var(--c-muted)', fontSize: 'var(--text-sm)' }}>
              This feature is coming soon! For now, ask {client.first_name} to send photos via WhatsApp.
            </p>
          </div>
        )}
      </div>
    )
  }
  
  // Compact view for grid mode
  return (
    <div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 'var(--s-2)',
        marginBottom: 'var(--s-3)'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, transparent)',
          borderRadius: '8px',
          padding: 'var(--s-2)',
          textAlign: 'center'
        }}>
          <p style={{ color: 'var(--c-muted)', fontSize: 'var(--text-xs)' }}>Weight</p>
          <p style={{ color: '#fff', fontSize: '1.3rem', fontWeight: 'bold' }}>
            {latest.weight || '-'} kg
          </p>
          {weightTrend && (
            <TrendIndicator trend={weightTrend} compact />
          )}
        </div>
        
        <div style={{
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, transparent)',
          borderRadius: '8px',
          padding: 'var(--s-2)',
          textAlign: 'center'
        }}>
          <p style={{ color: 'var(--c-muted)', fontSize: 'var(--text-xs)' }}>Body Fat</p>
          <p style={{ color: '#fff', fontSize: '1.3rem', fontWeight: 'bold' }}>
            {latest.body_fat || '-'} %
          </p>
          {fatTrend && (
            <TrendIndicator trend={fatTrend} compact />
          )}
        </div>
      </div>
      
      <div style={{
        padding: 'var(--s-2)',
        background: 'rgba(0,0,0,0.3)',
        borderRadius: '8px',
        marginBottom: 'var(--s-2)',
        textAlign: 'center'
      }}>
        <p style={{ color: 'var(--c-muted)', fontSize: 'var(--text-sm)' }}>
          Last: {latest.date ? formatDate(latest.date) : 'Never'}
        </p>
      </div>
      
      <button
        className="myarc-btn myarc-btn-sm myarc-btn-primary"
        onClick={() => onAction('requestProgress', {})}
        style={{ 
          width: '100%',
          background: 'linear-gradient(135deg, #10b981, #059669)',
          border: 'none'
        }}
      >
        Request Update
      </button>
    </div>
  )
}

// Helper Components
function StatCard({ title, value, previousValue, unit, trend, onClick, selected, gradient }) {
  const hasChange = previousValue && value !== previousValue
  
  return (
    <div
      onClick={onClick}
      style={{
        background: selected ? gradient : 'rgba(0,0,0,0.3)',
        borderRadius: '12px',
        padding: 'var(--s-3)',
        cursor: 'pointer',
        border: `2px solid ${selected ? 'rgba(255,255,255,0.2)' : 'transparent'}`,
        transition: 'all 0.3s ease',
        position: 'relative',
        overflow: 'hidden'
      }}
      onMouseEnter={(e) => {
        if (!selected) {
          e.currentTarget.style.transform = 'scale(1.05)'
          e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'
        }
      }}
      onMouseLeave={(e) => {
        if (!selected) {
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.background = 'rgba(0,0,0,0.3)'
        }
      }}
    >
      {selected && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: 'rgba(255,255,255,0.5)',
          animation: 'shimmer 2s infinite'
        }} />
      )}
      
      <p style={{ 
        color: selected ? 'rgba(255,255,255,0.9)' : 'var(--c-muted)', 
        fontSize: 'var(--text-sm)', 
        marginBottom: 'var(--s-1)' 
      }}>
        {title}
      </p>
      <p style={{ 
        color: selected ? '#fff' : '#fff', 
        fontSize: '1.8rem', 
        fontWeight: 'bold',
        lineHeight: 1
      }}>
        {value}
        {unit && <span style={{ fontSize: '1rem', marginLeft: '4px' }}>{unit}</span>}
      </p>
      {trend && <TrendIndicator trend={trend} />}
      {hasChange && !trend && (
        <p style={{ 
          color: 'var(--c-muted)', 
          fontSize: 'var(--text-xs)', 
          marginTop: 'var(--s-1)' 
        }}>
          was {previousValue}{unit}
        </p>
      )}
    </div>
  )
}

function MeasurementItem({ label, value, unit }) {
  return (
    <div style={{
      textAlign: 'center',
      padding: 'var(--s-2)',
      background: 'rgba(0,0,0,0.3)',
      borderRadius: '8px'
    }}>
      <p style={{ color: 'var(--c-muted)', fontSize: 'var(--text-xs)' }}>{label}</p>
      <p style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 'bold' }}>
        {value || '-'} {value && unit}
      </p>
    </div>
  )
}

function TrendIndicator({ trend, compact = false }) {
  const color = trend.isGood ? '#10b981' : trend.trend === 'stable' ? '#6b7280' : '#ef4444'
  const arrow = trend.trend === 'up' ? '↑' : trend.trend === 'down' ? '↓' : '→'
  
  if (compact) {
    return (
      <span style={{ color, fontSize: 'var(--text-xs)' }}>
        {arrow} {Math.abs(trend.value).toFixed(1)}
      </span>
    )
  }
  
  return (
    <div style={{ marginTop: 'var(--s-1)' }}>
      <span style={{ color, fontSize: 'var(--text-sm)', fontWeight: 'bold' }}>
        {arrow} {Math.abs(trend.value).toFixed(1)} ({Math.abs(trend.percent).toFixed(1)}%)
      </span>
    </div>
  )
}

function ProgressChart({ data, metric }) {
  if (metric === 'checkin') {
    // Show check-in frequency
    const last30Days = []
    const today = new Date()
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      const hasCheckIn = data.some(d => 
        d.date && d.date.startsWith(dateStr)
      )
      
      last30Days.push({
        date: dateStr,
        hasCheckIn
      })
    }
    
    return (
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(10, 1fr)',
        gap: '4px',
        padding: 'var(--s-2)'
      }}>
        {last30Days.map((day, idx) => (
          <div
            key={idx}
            style={{
              aspectRatio: '1',
              background: day.hasCheckIn 
                ? 'linear-gradient(135deg, #10b981, #059669)'
                : 'rgba(0,0,0,0.3)',
              borderRadius: '4px',
              border: '1px solid rgba(16, 185, 129, 0.2)'
            }}
            title={day.date}
          />
        ))}
      </div>
    )
  }
  
  // Regular metric chart
  const maxValue = Math.max(...data.map(d => d[metric] || 0))
  const minValue = Math.min(...data.map(d => d[metric] || 0))
  const range = maxValue - minValue || 1
  
  const recentData = data.slice(0, 10).reverse()
  
  return (
    <div style={{ height: '200px', position: 'relative' }}>
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        height: '100%',
        gap: '8px',
        padding: '0 var(--s-2)'
      }}>
        {recentData.map((entry, idx) => {
          const value = entry[metric] || 0
          const height = ((value - minValue) / range) * 100
          const isLast = idx === recentData.length - 1
          
          return (
            <div
              key={idx}
              style={{
                flex: 1,
                background: isLast 
                  ? 'linear-gradient(180deg, #10b981, #059669)'
                  : 'linear-gradient(180deg, rgba(16, 185, 129, 0.5), rgba(16, 185, 129, 0.3))',
                height: `${Math.max(height, 5)}%`,
                minHeight: '8px',
                borderRadius: '8px 8px 0 0',
                position: 'relative',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              title={`${formatDate(entry.date)}: ${value}`}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(180deg, #10b981, #059669)'
                e.currentTarget.style.transform = 'scaleY(1.1)'
              }}
              onMouseLeave={(e) => {
                if (!isLast) {
                  e.currentTarget.style.background = 'linear-gradient(180deg, rgba(16, 185, 129, 0.5), rgba(16, 185, 129, 0.3))'
                }
                e.currentTarget.style.transform = 'scaleY(1)'
              }}
            >
              {isLast && (
                <div style={{
                  position: 'absolute',
                  top: '-25px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: '#10b981',
                  color: '#fff',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  fontSize: 'var(--text-xs)',
                  whiteSpace: 'nowrap',
                  fontWeight: 'bold'
                }}>
                  {value}
                </div>
              )}
            </div>
          )
        })}
      </div>
      
      {/* Y-axis labels */}
      <div style={{
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: '30px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        fontSize: 'var(--text-xs)',
        color: 'var(--c-muted)'
      }}>
        <span>{maxValue.toFixed(1)}</span>
        <span>{minValue.toFixed(1)}</span>
      </div>
    </div>
  )
}

function formatDate(dateString) {
  const date = new Date(dateString)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  
  if (date.toDateString() === today.toDateString()) return 'Today'
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
  
  return date.toLocaleDateString('nl-NL', { 
    day: 'numeric', 
    month: 'short' 
  })
}
