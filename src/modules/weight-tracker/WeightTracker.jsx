import React, { useState, useEffect, useCallback } from 'react'
import { Check, AlertCircle, Loader2 } from 'lucide-react'
import WeightTrackerService from './WeightTrackerService'

// Import modular components
import WeightHeader from './components/WeightHeader'
import FridayAlert from './components/FridayAlert'
import WeightProgressRing from './components/WeightProgressRing'
import WeightStatsGrid from './components/WeightStatsGrid'
import WeightHistory from './components/WeightHistory'

export default function WeightTracker({ client, db }) {
  const isMobile = window.innerWidth <= 768
  
  // State
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [weight, setWeight] = useState(70)
  const [history, setHistory] = useState([])
  const [stats, setStats] = useState(null)
  const [fridayData, setFridayData] = useState(null)
  const [todayEntry, setTodayEntry] = useState(null)
  const [message, setMessage] = useState(null)
  
  // Initialize service
  const service = new WeightTrackerService(db)
  
  // Check if today is Friday
  const today = new Date()
  const isFriday = today.getDay() === 5
  const dateString = today.toISOString().split('T')[0]
  
  // Load all data
  const loadData = useCallback(async () => {
    if (!client?.id) return
    
    setLoading(true)
    try {
      const [weightHistory, weightStats, compliance, todayData] = await Promise.all([
        service.getWeightHistory(client.id, 56),
        service.getWeightStats(client.id),
        service.getFridayCompliance(client.id),
        service.getTodayEntry(client.id)
      ])
      
      setHistory(weightHistory || [])
      setStats(weightStats || {})
      setFridayData(compliance || {})
      setTodayEntry(todayData)
      
      // Set initial weight
      if (weightStats?.current) {
        setWeight(weightStats.current)
      } else if (client?.current_weight) {
        setWeight(client.current_weight)
      }
    } catch (error) {
      console.error('Error loading data:', error)
      showMessage('Error loading data', 'error')
    } finally {
      setLoading(false)
    }
  }, [client?.id])
  
  // Initial load
  useEffect(() => {
    loadData()
  }, [loadData])
  
  // Show temporary message
  const showMessage = (text, type = 'success') => {
    setMessage({ text, type })
    setTimeout(() => setMessage(null), 3000)
  }
  
  // Save weight handler
  const handleSave = async () => {
    if (!client?.id || saving) return
    
    setSaving(true)
    try {
      const result = await service.saveWeight(client.id, weight, dateString)
      
      if (result.success) {
        showMessage(
          result.isFriday ? 'Friday weigh-in complete! 🎉' : 'Weight saved!',
          'success'
        )
        await loadData()
      } else {
        showMessage('Failed to save weight', 'error')
      }
    } catch (error) {
      console.error('Save error:', error)
      showMessage('Error saving weight', 'error')
    } finally {
      setSaving(false)
    }
  }
  
  // Progress percentage calculation
  const progressPercent = React.useMemo(() => {
    if (!stats?.current || !client?.goal_weight || !client?.start_weight) return 0
    const total = Math.abs(client.goal_weight - client.start_weight)
    const progress = Math.abs(stats.current - client.start_weight)
    return Math.min(100, Math.max(0, (progress / total) * 100))
  }, [stats?.current, client?.goal_weight, client?.start_weight])
  
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '50vh'
      }}>
        <Loader2 
          size={32} 
          style={{ animation: 'spin 1s linear infinite' }} 
          color="#3b82f6" 
        />
      </div>
    )
  }
  
  return (
    <div style={{ paddingBottom: isMobile ? '100px' : '2rem' }}>
      {/* Message Toast */}
      {message && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: isMobile ? '0.75rem 1.25rem' : '0.875rem 1.5rem',
          background: message.type === 'error' ? '#dc2626' : 
                     'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
          borderRadius: '12px',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          zIndex: 2000,
          fontSize: isMobile ? '0.875rem' : '1rem',
          animation: 'slideDown 0.3s ease',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)'
        }}>
          {message.type === 'error' ? 
            <AlertCircle size={isMobile ? 16 : 20} /> : 
            <Check size={isMobile ? 16 : 20} />
          }
          {message.text}
        </div>
      )}
      
      {/* Header Component */}
      <WeightHeader 
        fridayData={fridayData}
        isMobile={isMobile}
      />
      
      {/* Friday Alert Component */}
      <FridayAlert 
        isFriday={isFriday}
        todayEntry={todayEntry}
        isMobile={isMobile}
      />
      
      {/* Progress Ring Component */}
      <div style={{ marginBottom: '1.5rem' }}>
        <WeightProgressRing 
          weight={weight}
          onWeightChange={setWeight}
          onSave={handleSave}
          saving={saving}
          todayEntry={todayEntry}
          progressPercent={progressPercent}
          isFriday={isFriday}
          isMobile={isMobile}
        />
      </div>
      
      {/* Stats Grid Component */}
      <div style={{ marginBottom: '1.5rem' }}>
        <WeightStatsGrid 
          stats={stats}
          client={client}
          fridayData={fridayData}
          isMobile={isMobile}
        />
      </div>
      
      {/* History Component */}
      <WeightHistory 
        history={history}
        isMobile={isMobile}
        maxItems={14}
      />
      
      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translate(-50%, -20px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
