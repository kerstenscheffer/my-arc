// src/modules/progress/ProgressMain.jsx
import React, { useState, useEffect } from 'react'
import { Loader2, Scale, AlertTriangle } from 'lucide-react'

// Photo Module
import ProgressPhotos from '../progress-photos/ProgressPhotos'

// Weight Module Components
import WeightTrackerService from '../weight-tracker/WeightTrackerService'
import WeightProgressRing from '../weight-tracker/components/WeightProgressRing'
import WeightStatsGrid from '../weight-tracker/components/WeightStatsGrid'
import WeightHistory from '../weight-tracker/components/WeightHistory'

// Challenge Sidebar
import ProgressChallengeSidebar from '../../client/components/ProgressChallengeSidebar'

// Challenge Hook
import { useChallenge } from '../../hooks/useChallenge'

export default function ProgressMain({ db, client }) {
  // Services
  const [weightService] = useState(() => new WeightTrackerService(db))
  
  // Challenge detection
  const { isInChallenge, challengeData } = useChallenge(db, client?.id)
  
  // State for weight data
  const [weight, setWeight] = useState(70.0)
  const [weightStats, setWeightStats] = useState(null)
  const [fridayData, setFridayData] = useState(null)
  const [weightHistory, setWeightHistory] = useState([])
  const [todayEntry, setTodayEntry] = useState(null)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState(null)
  
  // Photo stats
  const [photoCount, setPhotoCount] = useState(0)
  
  const isMobile = window.innerWidth <= 768
  const today = new Date()
  const isFriday = today.getDay() === 5
  const dateString = today.toISOString().split('T')[0]

  // Load all data
  useEffect(() => {
    if (client?.id) {
      loadAllData()
    }
  }, [client?.id])

  const loadAllData = async () => {
    if (!client?.id) return
    
    setLoading(true)
    try {
      // Load all data in parallel
      const [stats, friday, history, today, photos] = await Promise.all([
        weightService.getWeightStats(client.id),
        weightService.getFridayCompliance(client.id),
        weightService.getWeightHistory(client.id, 56),
        weightService.getTodayEntry(client.id),
        getPhotoCount(client.id)
      ])
      
      // Update states with loaded data
      setWeightStats(stats || {})
      setFridayData(friday || {})
      setWeightHistory(history || [])
      setTodayEntry(today)
      setPhotoCount(photos)
      
      // Set initial weight from stats or client data
      if (stats?.current) {
        setWeight(stats.current)
      } else if (client?.current_weight) {
        setWeight(client.current_weight)
      }
    } catch (error) {
      console.error('Error loading data:', error)
      showMessage('Fout bij laden van data', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Get photo count
  const getPhotoCount = async (clientId) => {
    try {
      const { data } = await db.supabase
        .from('ch8_progress_photos')
        .select('id')
        .eq('client_id', clientId)
      
      return data?.length || 0
    } catch (error) {
      console.error('Error getting photo count:', error)
      return 0
    }
  }

  // Show temporary message
  const showMessage = (text, type = 'success') => {
    setMessage({ text, type })
    setTimeout(() => setMessage(null), 3000)
  }

  // Save weight handler
  const handleSaveWeight = async () => {
    if (!client?.id || saving) return
    
    setSaving(true)
    try {
      const result = await weightService.saveWeight(client.id, weight, dateString)
      
      if (result.success) {
        showMessage(
          result.isFriday ? 'Vrijdag weging voltooid! 🎉' : 'Gewicht opgeslagen!',
          'success'
        )
        await loadAllData()
      } else {
        showMessage('Gewicht opslaan mislukt', 'error')
      }
    } catch (error) {
      console.error('Save error:', error)
      showMessage('Fout bij opslaan gewicht', 'error')
    } finally {
      setSaving(false)
    }
  }

  // Calculate progress percentage
  const progressPercent = React.useMemo(() => {
    if (!weightStats?.current || !client?.goal_weight || !client?.start_weight) return 0
    const total = Math.abs(client.goal_weight - client.start_weight)
    const progress = Math.abs(weightStats.current - client.start_weight)
    return Math.min(100, Math.max(0, (progress / total) * 100))
  }, [weightStats?.current, client?.goal_weight, client?.start_weight])

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
          style={{ 
            animation: 'spin 1s linear infinite',
            filter: 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.6))'
          }} 
          color="#10b981" 
        />
      </div>
    )
  }

  return (
    <div style={{ paddingBottom: isMobile ? '100px' : '2rem' }}>
      {/* Progress Challenge Sidebar */}
      <ProgressChallengeSidebar
        client={client}
        db={db}
        challengeData={challengeData}
        weightStats={weightStats}
        fridayData={fridayData}
        photoCount={photoCount}
      />

      {/* Message Toast */}
      {message && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: isMobile ? '0.75rem 1.25rem' : '0.875rem 1.5rem',
          background: message.type === 'error' 
            ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.95) 0%, rgba(220, 38, 38, 0.9) 100%)' 
            : 'linear-gradient(135deg, rgba(16, 185, 129, 0.95) 0%, rgba(5, 150, 105, 0.9) 100%)',
          backdropFilter: 'blur(10px)',
          borderRadius: '12px',
          border: message.type === 'error'
            ? '1px solid rgba(239, 68, 68, 0.3)'
            : '1px solid rgba(16, 185, 129, 0.3)',
          color: '#fff',
          fontSize: isMobile ? '0.875rem' : '1rem',
          fontWeight: '600',
          animation: 'slideDown 0.3s ease',
          boxShadow: message.type === 'error'
            ? '0 8px 24px rgba(239, 68, 68, 0.3)'
            : '0 8px 24px rgba(16, 185, 129, 0.3)',
          zIndex: 2000
        }}>
          {message.text}
        </div>
      )}

      {/* Weight Section */}
      <div style={{ marginBottom: '2rem' }}>
        {/* Friday Alert - Emerald Styling */}
        {isFriday && !todayEntry && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.08) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '12px',
            padding: isMobile ? '0.75rem' : '1rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
            animation: 'pulse 2s infinite',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 4px 20px rgba(16, 185, 129, 0.15)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Top glow */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '2px',
              background: 'linear-gradient(90deg, transparent 0%, #10b981 50%, transparent 100%)',
              opacity: 0.6
            }} />

            <Scale
              size={isMobile ? 18 : 20}
              color="#10b981"
              style={{ 
                flexShrink: 0, 
                marginTop: '2px',
                filter: 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.6))'
              }}
            />
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: isMobile ? '0.875rem' : '1rem',
                fontWeight: '700',
                color: '#10b981',
                marginBottom: '0.25rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Vrijdag Weegmoment Vereist!
              </div>
              <div style={{
                fontSize: isMobile ? '0.7rem' : '0.75rem',
                color: 'rgba(16, 185, 129, 0.8)',
                lineHeight: '1.4'
              }}>
                Voltooi je wekelijkse weging voor de 8-weken challenge
              </div>
              {isInChallenge && (
                <div style={{
                  marginTop: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem',
                  background: 'rgba(16, 185, 129, 0.1)',
                  borderRadius: '8px',
                  border: '1px solid rgba(16, 185, 129, 0.2)'
                }}>
                  <AlertTriangle 
                    size={14} 
                    color="#10b981"
                    style={{ filter: 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.5))' }}
                  />
                  <span style={{
                    fontSize: isMobile ? '0.65rem' : '0.7rem',
                    color: '#10b981',
                    fontWeight: '600'
                  }}>
                    Gemiste vrijdag wegingen beïnvloeden je challenge compliance
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Weight Input Ring */}
        <div style={{ marginBottom: '1.5rem' }}>
          <WeightProgressRing
            weight={weight}
            onWeightChange={setWeight}
            onSave={handleSaveWeight}
            saving={saving}
            todayEntry={todayEntry}
            progressPercent={progressPercent}
            isFriday={isFriday}
            isMobile={isMobile}
          />
        </div>

        {/* Weight Stats Grid */}
        <div style={{ marginBottom: '1.5rem' }}>
          <WeightStatsGrid
            stats={weightStats}
            client={client}
            fridayData={fridayData}
            history={weightHistory}
            isMobile={isMobile}
          />
        </div>

        {/* Weight History */}
        <WeightHistory
          history={weightHistory}
          isMobile={isMobile}
          maxItems={14}
        />
      </div>

      {/* Elegant Divider */}
      <div style={{
        height: '1px',
        background: 'linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.3), transparent)',
        margin: '2rem 0',
        boxShadow: '0 0 10px rgba(16, 185, 129, 0.2)'
      }} />

      {/* Photos Section */}
      <div>
        <ProgressPhotos db={db} client={client} />
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
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
        
        @keyframes pulse {
          0%, 100% { 
            opacity: 1;
            transform: scale(1);
          }
          50% { 
            opacity: 0.95;
            transform: scale(0.995);
          }
        }
      `}</style>
    </div>
  )
}
