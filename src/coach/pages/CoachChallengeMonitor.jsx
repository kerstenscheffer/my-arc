// src/coach/pages/CoachChallengeMonitor.jsx
import { useState, useEffect } from 'react'
import { Trophy, ChevronDown, RefreshCw, Users, AlertCircle } from 'lucide-react'
import ChallengeHomeBanner from '../../client/components/ChallengeHomeBanner'
import WorkoutProgressView from './challenge-monitor/WorkoutProgressView'
import MealProgressView from './challenge-monitor/MealProgressView'
import WeightProgressView from './challenge-monitor/WeightProgressView'
import PhotoProgressView from './challenge-monitor/PhotoProgressView'

export default function CoachChallengeMonitor({ db, clients }) {
  const isMobile = window.innerWidth <= 768
  const [selectedClient, setSelectedClient] = useState(null)
  const [challengeClients, setChallengeClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeView, setActiveView] = useState('overview') // overview, workouts, meals, weight, photos
  const [challengeData, setChallengeData] = useState(null)

  useEffect(() => {
    loadChallengeClients()
  }, [clients])

  useEffect(() => {
    if (selectedClient) {
      loadClientChallengeData()
      const interval = setInterval(loadClientChallengeData, 30000) // Refresh every 30s
      return () => clearInterval(interval)
    }
  }, [selectedClient])

  async function loadChallengeClients() {
    try {
      // Get all active challenge assignments
      const { data: assignments } = await db.supabase
        .from('challenge_assignments')
        .select('client_id, start_date, end_date')
        .eq('is_active', true)
        .eq('challenge_type', '8week')

      if (assignments && assignments.length > 0) {
        // Filter clients who have active challenges
        const clientIds = assignments.map(a => a.client_id)
        const filteredClients = clients.filter(c => clientIds.includes(c.id))
        
        // Add challenge dates to clients
        const clientsWithDates = filteredClients.map(client => {
          const assignment = assignments.find(a => a.client_id === client.id)
          return {
            ...client,
            challengeStart: assignment.start_date,
            challengeEnd: assignment.end_date
          }
        })
        
        setChallengeClients(clientsWithDates)
        
        // Auto-select first client
        if (clientsWithDates.length > 0 && !selectedClient) {
          setSelectedClient(clientsWithDates[0])
        }
      }
    } catch (error) {
      console.error('Error loading challenge clients:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadClientChallengeData() {
    if (!selectedClient) return
    
    try {
      // Get challenge assignment details
      const { data: assignment } = await db.supabase
        .from('challenge_assignments')
        .select('*')
        .eq('client_id', selectedClient.id)
        .eq('is_active', true)
        .single()

      if (assignment) {
        const startDate = new Date(assignment.start_date)
        const today = new Date()
        const daysSinceStart = Math.floor((today - startDate) / (1000 * 60 * 60 * 24))
        const currentWeek = Math.min(8, Math.floor(daysSinceStart / 7) + 1)
        
        setChallengeData({
          ...assignment,
          currentWeek,
          dayNumber: daysSinceStart + 1,
          totalDays: 56
        })
      }
    } catch (error) {
      console.error('Error loading challenge data:', error)
    }
  }

  async function handleRefresh() {
    setRefreshing(true)
    await loadClientChallengeData()
    setTimeout(() => setRefreshing(false), 500)
  }

  const viewTabs = [
    { id: 'overview', label: 'Overview', icon: Trophy, color: '#dc2626' },
    { id: 'workouts', label: 'Workouts', icon: '💪', color: '#f97316' },
    { id: 'meals', label: 'Meals', icon: '🍽️', color: '#10b981' },
    { id: 'weight', label: 'Weight', icon: '⚖️', color: '#3b82f6' },
    { id: 'photos', label: 'Photos', icon: '📸', color: '#8b5cf6' }
  ]

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px',
        color: 'rgba(255, 255, 255, 0.6)'
      }}>
        Loading challenge data...
      </div>
    )
  }

  if (challengeClients.length === 0) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.1) 0%, rgba(220, 38, 38, 0.05) 100%)',
        borderRadius: '16px',
        padding: isMobile ? '1.5rem' : '2rem',
        border: '1px solid rgba(220, 38, 38, 0.2)',
        textAlign: 'center'
      }}>
        <AlertCircle size={48} color="#dc2626" style={{ marginBottom: '1rem' }} />
        <h3 style={{
          fontSize: isMobile ? '1.1rem' : '1.25rem',
          fontWeight: '700',
          color: '#fff',
          marginBottom: '0.5rem'
        }}>
          No Active Challenges
        </h3>
        <p style={{
          color: 'rgba(255, 255, 255, 0.6)',
          fontSize: isMobile ? '0.9rem' : '0.95rem'
        }}>
          Assign challenges to clients using the Challenge Assignment widget
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Header with Client Selector */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.1) 0%, rgba(220, 38, 38, 0.05) 100%)',
        borderRadius: '16px',
        padding: isMobile ? '1rem' : '1.5rem',
        border: '1px solid rgba(220, 38, 38, 0.2)',
        marginBottom: '1.5rem'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: '1rem',
          alignItems: isMobile ? 'stretch' : 'center',
          justifyContent: 'space-between'
        }}>
          {/* Title */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <Trophy size={24} color="#dc2626" />
            <h2 style={{
              fontSize: isMobile ? '1.1rem' : '1.25rem',
              fontWeight: '700',
              color: '#fff',
              margin: 0
            }}>
              8-Week Challenge Monitor
            </h2>
          </div>

          {/* Client Selector */}
          <div style={{
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'center',
            flex: 1,
            maxWidth: isMobile ? '100%' : '400px'
          }}>
            <div style={{
              position: 'relative',
              flex: 1
            }}>
              <select
                value={selectedClient?.id || ''}
                onChange={(e) => {
                  const client = challengeClients.find(c => c.id === e.target.value)
                  setSelectedClient(client)
                }}
                style={{
                  width: '100%',
                  padding: isMobile ? '0.75rem' : '0.875rem',
                  paddingRight: '2.5rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: isMobile ? '0.9rem' : '0.95rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  appearance: 'none',
                  outline: 'none',
                  transition: 'all 0.3s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgba(220, 38, 38, 0.5)'
                  e.target.style.background = 'rgba(255, 255, 255, 0.08)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                  e.target.style.background = 'rgba(255, 255, 255, 0.05)'
                }}
              >
                {challengeClients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.first_name} {client.last_name}
                  </option>
                ))}
              </select>
              <ChevronDown 
                size={20} 
                color="rgba(255, 255, 255, 0.5)"
                style={{
                  position: 'absolute',
                  right: '0.875rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none'
                }}
              />
            </div>

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              style={{
                padding: '0.75rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                color: '#fff',
                cursor: refreshing ? 'wait' : 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '44px',
                minHeight: '44px',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                if (!refreshing) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
              }}
            >
              <RefreshCw 
                size={18} 
                color="rgba(255, 255, 255, 0.7)"
                style={{
                  animation: refreshing ? 'spin 1s linear infinite' : 'none'
                }}
              />
            </button>
          </div>
        </div>

        {/* Challenge Info */}
        {selectedClient && challengeData && (
          <div style={{
            display: 'flex',
            gap: '1rem',
            marginTop: '1rem',
            paddingTop: '1rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            fontSize: isMobile ? '0.8rem' : '0.85rem',
            color: 'rgba(255, 255, 255, 0.6)',
            flexWrap: 'wrap'
          }}>
            <span>Week {challengeData.currentWeek}/8</span>
            <span>•</span>
            <span>Day {challengeData.dayNumber}/56</span>
            <span>•</span>
            <span>Started: {new Date(challengeData.start_date).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      {/* View Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '1.5rem',
        overflowX: 'auto',
        paddingBottom: '0.5rem'
      }}>
        {viewTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id)}
            style={{
              padding: isMobile ? '0.75rem 1rem' : '0.875rem 1.25rem',
              background: activeView === tab.id
                ? `linear-gradient(135deg, ${tab.color} 0%, ${tab.color}dd 100%)`
                : 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${activeView === tab.id ? tab.color : 'rgba(255, 255, 255, 0.1)'}`,
              borderRadius: '10px',
              color: '#fff',
              fontSize: isMobile ? '0.85rem' : '0.9rem',
              fontWeight: activeView === tab.id ? '600' : '500',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              whiteSpace: 'nowrap',
              minHeight: '44px',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
            onTouchStart={(e) => {
              if (isMobile && activeView !== tab.id) {
                e.currentTarget.style.transform = 'scale(0.98)'
              }
            }}
            onTouchEnd={(e) => {
              if (isMobile) {
                e.currentTarget.style.transform = 'scale(1)'
              }
            }}
          >
            <span style={{ fontSize: '1rem' }}>
              {typeof tab.icon === 'string' ? tab.icon : <tab.icon size={16} />}
            </span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Views */}
      {selectedClient && (
        <>
          {activeView === 'overview' && (
            <ChallengeHomeBanner 
              client={selectedClient}
              db={db}
              isCoachView={true}
            />
          )}
          
          {activeView === 'workouts' && (
            <WorkoutProgressView 
              client={selectedClient}
              db={db}
              challengeData={challengeData}
            />
          )}
          
          {activeView === 'meals' && (
            <MealProgressView 
              client={selectedClient}
              db={db}
              challengeData={challengeData}
            />
          )}
          
          {activeView === 'weight' && (
            <WeightProgressView 
              client={selectedClient}
              db={db}
              challengeData={challengeData}
            />
          )}
          
          {activeView === 'photos' && (
            <PhotoProgressView 
              client={selectedClient}
              db={db}
              challengeData={challengeData}
            />
          )}
        </>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
