// src/modules/progress/ProgressMain.jsx
import React, { useState, useEffect, useRef } from 'react'
import { Loader2, Scale, AlertTriangle } from 'lucide-react'

// Photo Module
import ProgressPhotos from '../progress-photos/ProgressPhotos'

// Weight Module Components
import WeightTrackerService from '../weight-tracker/WeightTrackerService'
import WeightProgressRing from '../weight-tracker/components/WeightProgressRing'
import WeightStatsGrid from '../weight-tracker/components/WeightStatsGrid'
import WeightHistory from '../weight-tracker/components/WeightHistory'

// Banner Components
import GeneralProgressBanner from '../progress-photos/components/GeneralProgressBanner'
import ChallengeProgressBanner from '../progress-photos/components/ChallengeProgressBanner'

// Challenge Hook
import { useChallenge } from '../../hooks/useChallenge'

// Theme for Friday alert
const FRIDAY_THEME = {
  primary: '#8b5cf6',
  light: '#a78bfa',
  background: 'rgba(139, 92, 246, 0.1)',
  border: 'rgba(139, 92, 246, 0.3)'
}

export default function ProgressMain({ db, client }) {
  // Services
  const [weightService] = useState(() => new WeightTrackerService(db))
  
  // Challenge detection
  const { isInChallenge, challengeData } = useChallenge(db, client?.id)
  
  // Refs for scrolling
  const photosRef = useRef(null)
  const weightRef = useRef(null)
  
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

  // Scroll handlers
  const scrollToPhotos = () => {
    photosRef.current?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    })
  }

  const scrollToWeight = () => {
    weightRef.current?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    })
  }

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
          background: message.type === 'error' 
            ? '#dc2626' 
            : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          borderRadius: '12px',
          color: '#fff',
          fontSize: isMobile ? '0.875rem' : '1rem',
          animation: 'slideDown 0.3s ease',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
          zIndex: 2000
        }}>
          {message.text}
        </div>
      )}

      {/* Conditional Banner - Challenge or General */}
      {isInChallenge ? (
        <ChallengeProgressBanner
          challengeData={challengeData}
          weightStats={weightStats}
          fridayData={fridayData}
          photoCount={photoCount}
          client={client}
          onScrollToPhotos={scrollToPhotos}
          onScrollToWeight={scrollToWeight}
          isMobile={isMobile}
        />
      ) : (
        <GeneralProgressBanner
          weightStats={weightStats}
          photoCount={photoCount}
          client={client}
          onScrollToPhotos={scrollToPhotos}
          onScrollToWeight={scrollToWeight}
          isMobile={isMobile}
        />
      )}

      {/* Photos Section */}
      <div ref={photosRef} style={{ marginBottom: '2rem' }}>
        <h2 style={{
          fontSize: isMobile ? '1.25rem' : '1.5rem',
          fontWeight: '600',
          color: 'white',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          📸 Voortgangsfoto's
        </h2>
        <ProgressPhotos db={db} client={client} />
      </div>

      {/* Elegant Divider */}
      <div style={{
        height: '1px',
        background: 'linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.3), transparent)',
        margin: '2rem 0'
      }} />

      {/* Weight Section */}
      <div ref={weightRef}>
        <h2 style={{
          fontSize: isMobile ? '1.25rem' : '1.5rem',
          fontWeight: '600',
          color: 'white',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          ⚖️ Gewicht Bijhouden
        </h2>

        {/* Friday Alert - Inline Implementation */}
        {isFriday && !todayEntry && (
          <div style={{
            background: `linear-gradient(135deg, ${FRIDAY_THEME.background} 0%, rgba(139, 92, 246, 0.05) 100%)`,
            border: `1px solid ${FRIDAY_THEME.border}`,
            borderRadius: '12px',
            padding: isMobile ? '0.75rem' : '1rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
            animation: 'pulse 2s infinite'
          }}>
            <Scale
              size={isMobile ? 18 : 20}
              color={FRIDAY_THEME.primary}
              style={{ flexShrink: 0, marginTop: '2px' }}
            />
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: isMobile ? '0.875rem' : '1rem',
                fontWeight: '600',
                color: FRIDAY_THEME.primary,
                marginBottom: '0.25rem'
              }}>
                Vrijdag Weegmoment Vereist!
              </div>
              <div style={{
                fontSize: isMobile ? '0.7rem' : '0.75rem',
                color: FRIDAY_THEME.light,
                opacity: 0.8,
                lineHeight: '1.4'
              }}>
                Voltooi je wekelijkse weging voor de 8-weken challenge
              </div>
              {isInChallenge && (
                <div style={{
                  marginTop: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <AlertTriangle size={14} color={FRIDAY_THEME.primary} />
                  <span style={{
                    fontSize: isMobile ? '0.65rem' : '0.7rem',
                    color: FRIDAY_THEME.primary,
                    fontWeight: '500'
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
            opacity: 0.9;
            transform: scale(0.98);
          }
        }
      `}</style>
    </div>
  )
}
