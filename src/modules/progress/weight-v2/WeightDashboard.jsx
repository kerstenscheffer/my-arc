import React, { useState, useEffect, useCallback } from 'react'
import { Calendar, TrendingUp, Target, Loader2 } from 'lucide-react'
import ProgressService from '../core/ProgressService'
import QuickInput from './components/QuickInput'
import StatsCards from './components/StatsCards'
import Timeline from './components/Timeline'
import WeightModal from './components/WeightModal'

const THEME = {
  primary: '#3b82f6',
  gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
  light: 'rgba(59, 130, 246, 0.1)',
  border: 'rgba(59, 130, 246, 0.2)',
  success: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b'
}

export default function WeightDashboard({ client, db }) {
  const isMobile = window.innerWidth <= 768
  
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [history, setHistory] = useState([])
  const [timeRange, setTimeRange] = useState(30)
  const [showModal, setShowModal] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  
  const loadData = useCallback(async () => {
    if (!client?.id) return
    
    setLoading(true)
    try {
      const [weightHistory, weightStats] = await Promise.all([
        ProgressService.getWeightHistory(client.id, timeRange),
        ProgressService.getWeightStats(client.id)
      ])
      
      setHistory(weightHistory || [])
      setStats(weightStats || {})
    } catch (error) {
      console.error('Error loading weight data:', error)
    } finally {
      setLoading(false)
    }
  }, [client?.id, timeRange])
  
  useEffect(() => {
    loadData()
  }, [loadData, refreshKey])
  
  const handleSave = async (weight) => {
    try {
      await ProgressService.saveWeight(client.id, {
        weight: parseFloat(weight),
        timeOfDay: 'morning',
        feeling: 'normal'
      })
      setRefreshKey(prev => prev + 1)
      return true
    } catch (error) {
      console.error('Save error:', error)
      return false
    }
  }
  
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '50vh'
      }}>
        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} color={THEME.primary} />
      </div>
    )
  }
  
  return (
    <div style={{ paddingBottom: isMobile ? '80px' : '2rem' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        gap: '0.5rem'
      }}>
        <div>
          <h2 style={{
            fontSize: isMobile ? '1.25rem' : '1.5rem',
            fontWeight: 'bold',
            color: '#fff',
            marginBottom: '0.25rem'
          }}>
            Weight Tracking
          </h2>
          <div style={{
            fontSize: isMobile ? '0.75rem' : '0.85rem',
            color: 'rgba(255,255,255,0.6)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Calendar size={14} />
            {new Date().toLocaleDateString('nl-NL', { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'long' 
            })}
          </div>
        </div>
        
        {stats?.current && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: isMobile ? '0.375rem 0.75rem' : '0.5rem 1rem',
            background: THEME.light,
            borderRadius: '20px',
            fontSize: isMobile ? '0.85rem' : '0.9rem',
            color: THEME.primary,
            fontWeight: '600'
          }}>
            <TrendingUp size={16} />
            {stats.current} kg
          </div>
        )}
      </div>
      
      {/* Quick Input */}
      <QuickInput 
        currentValue={stats?.current || 70}
        onSave={handleSave}
        isMobile={isMobile}
        theme={THEME}
      />
      
      {/* Time Range Selector */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '1.5rem',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch'
      }}>
        {[7, 14, 30, 60, 90].map(days => (
          <button
            key={days}
            onClick={() => setTimeRange(days)}
            style={{
              padding: isMobile ? '0.5rem 0.875rem' : '0.6rem 1.2rem',
              background: timeRange === days ? THEME.gradient : 'rgba(255,255,255,0.05)',
              border: `1px solid ${timeRange === days ? THEME.primary : 'rgba(255,255,255,0.1)'}`,
              borderRadius: '10px',
              color: '#fff',
              fontSize: isMobile ? '0.75rem' : '0.85rem',
              fontWeight: timeRange === days ? '600' : 'normal',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.3s ease'
            }}
          >
            {days}d
          </button>
        ))}
      </div>
      
      {/* Stats Cards */}
      <StatsCards 
        stats={stats}
        client={client}
        isMobile={isMobile}
        theme={THEME}
      />
      
      {/* Timeline */}
      <Timeline 
        history={history}
        isMobile={isMobile}
        theme={THEME}
      />
      
      {/* Floating Action Button */}
      <button
        onClick={() => setShowModal(true)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: THEME.gradient,
          border: 'none',
          boxShadow: '0 8px 24px rgba(59, 130, 246, 0.4)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          fontSize: '1.5rem',
          color: '#fff'
        }}
      >
        +
      </button>
      
      {/* Modal */}
      {showModal && (
        <WeightModal
          onClose={() => setShowModal(false)}
          onSave={async (data) => {
            const success = await ProgressService.saveWeight(client.id, data)
            if (success) {
              setRefreshKey(prev => prev + 1)
              setShowModal(false)
            }
            return success
          }}
          isMobile={isMobile}
          theme={THEME}
        />
      )}
      
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        ::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }
        
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        
        ::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.2);
          border-radius: 2px;
        }
      `}</style>
    </div>
  )
}
