// src/coach/pages/CoachChallengeHub.jsx - UPDATED VERSION
import { useState, useEffect } from 'react'
import { Trophy, ChevronDown, RefreshCw, Users, AlertCircle, Target, Pause, Play } from 'lucide-react'

// IMPORT CHALLENGE MONITOR VIEWS
import ChallengeHomeBanner from '../../client/components/ChallengeHomeBanner'
import ChallengeGoalManager from '../tabs/client-info/ChallengeGoalManager'
import WorkoutProgressView from './challenge-monitor/WorkoutProgressView'
import MealProgressView from './challenge-monitor/MealProgressView'
import WeightProgressView from './challenge-monitor/WeightProgressView'
import PhotoProgressView from './challenge-monitor/PhotoProgressView'
import ChallengeAdjustments from './challenge-monitor/ChallengeAdjustments'

export default function CoachChallengeHub({ db, clients }) {
  const isMobile = window.innerWidth <= 768
  
  // Assignment Widget State
  const [assignedClients, setAssignedClients] = useState([])
  const [assignLoading, setAssignLoading] = useState(false)
  
  // Monitor State
  const [selectedClient, setSelectedClient] = useState(null)
  const [challengeClients, setChallengeClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeView, setActiveView] = useState('overview')
  const [challengeData, setChallengeData] = useState(null)
  const [showAssignment, setShowAssignment] = useState(false)
  
  // PAUSE STATE
  const [pauseLoading, setPauseLoading] = useState(false)

  useEffect(() => {
    loadAssignments()
    loadChallengeClients()
  }, [clients])

  useEffect(() => {
    if (selectedClient) {
      loadClientChallengeData()
      const interval = setInterval(loadClientChallengeData, 30000)
      return () => clearInterval(interval)
    }
  }, [selectedClient])

  // ASSIGNMENT FUNCTIONS
  async function loadAssignments() {
    try {
      const { data } = await db.supabase
        .from('challenge_assignments')
        .select('client_id')
        .eq('is_active', true)
      
      setAssignedClients(data?.map(a => a.client_id) || [])
    } catch (error) {
      console.error('Error loading assignments:', error)
    }
  }

  async function assignChallenge(clientId) {
    setAssignLoading(true)
    try {
      const { data: existing } = await db.supabase
        .from('challenge_assignments')
        .select('id')
        .eq('client_id', clientId)
        .eq('is_active', true)
        .single()

      if (existing) {
        alert('Client already in active challenge!')
        return
      }

      const currentUser = await db.getCurrentUser()
      
      const { error } = await db.supabase
        .from('challenge_assignments')
        .insert({
          client_id: clientId,
          coach_id: currentUser.id,
          challenge_type: '8week',
          start_date: new Date().toISOString().split('T')[0],
          end_date: new Date(Date.now() + 56 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          is_active: true
        })

      if (error) throw error

      setAssignedClients([...assignedClients, clientId])
      loadChallengeClients()
      alert('Challenge assigned successfully!')
      
    } catch (error) {
      console.error('Error assigning challenge:', error)
      alert('Error assigning challenge')
    }
    setAssignLoading(false)
  }

  async function removeChallenge(clientId) {
    if (!confirm('Remove client from challenge?')) return
    
    setAssignLoading(true)
    try {
      const { error } = await db.supabase
        .from('challenge_assignments')
        .update({ is_active: false })
        .eq('client_id', clientId)
        .eq('is_active', true)

      if (error) throw error

      setAssignedClients(assignedClients.filter(id => id !== clientId))
      loadChallengeClients()
      alert('Challenge removed')
      
    } catch (error) {
      console.error('Error removing challenge:', error)
      alert('Error removing challenge')
    }
    setAssignLoading(false)
  }

  // MONITOR FUNCTIONS
  async function loadChallengeClients() {
    try {
      const { data: assignments } = await db.supabase
        .from('challenge_assignments')
        .select('client_id, start_date, end_date, is_paused')
        .eq('is_active', true)
        .eq('challenge_type', '8week')

      if (assignments && assignments.length > 0) {
        const clientIds = assignments.map(a => a.client_id)
        const filteredClients = clients.filter(c => clientIds.includes(c.id))
        
        const clientsWithDates = filteredClients.map(client => {
          const assignment = assignments.find(a => a.client_id === client.id)
          return {
            ...client,
            challengeStart: assignment.start_date,
            challengeEnd: assignment.end_date,
            isPaused: assignment.is_paused
          }
        })
        
        setChallengeClients(clientsWithDates)
        
        if (clientsWithDates.length > 0 && !selectedClient) {
          setSelectedClient(clientsWithDates[0])
        }
      } else {
        setChallengeClients([])
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

  // PAUSE/RESUME FUNCTIONS
  async function handlePauseToggle() {
    if (!challengeData) return
    
    const isPaused = challengeData.is_paused
    
    setPauseLoading(true)
    
    try {
      if (isPaused) {
        // RESUME
        if (!confirm(`Challenge hervatten voor ${selectedClient.first_name}?\n\nDe einddatum wordt automatisch verlengd met het aantal gepauzeerde dagen.`)) {
          setPauseLoading(false)
          return
        }
        await db.resumeChallenge(challengeData.id)
        alert('✅ Challenge hervat!')
      } else {
        // PAUSE
        const reason = prompt(`Waarom pauzeer je de challenge voor ${selectedClient.first_name}?`, 'Client ziek')
        if (!reason) {
          setPauseLoading(false)
          return
        }
        const currentUser = await db.getCurrentUser()
        const coachName = currentUser?.email || 'Coach'
        await db.pauseChallenge(challengeData.id, reason, coachName)
        alert('⏸️ Challenge gepauzeerd')
      }
      
      await loadClientChallengeData()
      await loadChallengeClients()
      
    } catch (error) {
      console.error('Error toggling pause:', error)
      alert('❌ Error: ' + error.message)
    } finally {
      setPauseLoading(false)
    }
  }

  // VIEW TABS
  const viewTabs = [
    { id: 'overview', label: 'Overview', icon: Trophy, color: '#dc2626' },
    { id: 'goals', label: 'Goals', icon: Target, color: '#10b981' },
    { id: 'workouts', label: 'Workouts', icon: '💪', color: '#f97316' },
    { id: 'meals', label: 'Meals', icon: '🍽️', color: '#10b981' },
    { id: 'weight', label: 'Weight', icon: '⚖️', color: '#3b82f6' },
    { id: 'photos', label: 'Photos', icon: '📸', color: '#8b5cf6' },
    { id: 'adjustments', label: 'Adjustments', icon: '⚙️', color: '#ef4444' }
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

  return (
    <div>
      {/* Toggle Assignment Widget Button */}
      <button
        onClick={() => setShowAssignment(!showAssignment)}
        style={{
          width: '100%',
          padding: isMobile ? '1rem' : '1.25rem',
          background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.2) 0%, rgba(220, 38, 38, 0.1) 100%)',
          border: '1px solid rgba(220, 38, 38, 0.3)',
          borderRadius: '12px',
          color: '#fff',
          fontSize: isMobile ? '0.9rem' : '0.95rem',
          fontWeight: '600',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
          transition: 'all 0.3s ease',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span>🏆</span>
          <span>Challenge Assignment ({assignedClients.length}/{clients.length} clients)</span>
        </div>
        <ChevronDown 
          size={20} 
          style={{
            transform: showAssignment ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s ease'
          }}
        />
      </button>

      {/* Assignment Widget (Collapsible) */}
      {showAssignment && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.1) 0%, rgba(220, 38, 38, 0.05) 100%)',
          borderRadius: '16px',
          padding: isMobile ? '1rem' : '1.5rem',
          border: '1px solid rgba(220, 38, 38, 0.2)',
          marginBottom: '1.5rem',
          animation: 'slideDown 0.3s ease'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            maxHeight: '400px',
            overflowY: 'auto'
          }}>
            {clients.map(client => {
              const isAssigned = assignedClients.includes(client.id)
              
              return (
                <div
                  key={client.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: isMobile ? '0.75rem' : '1rem',
                    background: isAssigned 
                      ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%)'
                      : 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '12px',
                    border: `1px solid ${isAssigned ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
                    transition: 'all 0.3s ease'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: isAssigned ? '#10b981' : '#6b7280'
                    }} />
                    <div>
                      <div style={{
                        fontSize: isMobile ? '0.9rem' : '0.95rem',
                        fontWeight: '600',
                        color: '#fff'
                      }}>
                        {client.first_name} {client.last_name}
                      </div>
                      {isAssigned && (
                        <div style={{
                          fontSize: '0.75rem',
                          color: 'rgba(255, 255, 255, 0.6)',
                          marginTop: '0.25rem'
                        }}>
                          Challenge Active
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => isAssigned ? removeChallenge(client.id) : assignChallenge(client.id)}
                    disabled={assignLoading}
                    style={{
                      padding: isMobile ? '0.5rem 0.75rem' : '0.5rem 1rem',
                      background: isAssigned
                        ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(239, 68, 68, 0.1) 100%)'
                        : 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                      border: `1px solid ${isAssigned ? 'rgba(239, 68, 68, 0.3)' : 'rgba(220, 38, 38, 0.3)'}`,
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: isMobile ? '0.8rem' : '0.85rem',
                      fontWeight: '600',
                      cursor: assignLoading ? 'wait' : 'pointer',
                      opacity: assignLoading ? 0.5 : 1,
                      transition: 'all 0.3s ease',
                      minWidth: isMobile ? '80px' : '100px',
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent'
                    }}
                  >
                    {isAssigned ? 'Remove' : 'Assign'}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Monitor Section */}
      {challengeClients.length === 0 ? (
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
            Assign challenges to clients using the assignment widget above
          </p>
        </div>
      ) : (
        <>
          {/* Monitor Header */}
          <div style={{
            background: challengeData?.is_paused 
              ? 'linear-gradient(135deg, rgba(249, 115, 22, 0.1) 0%, rgba(249, 115, 22, 0.05) 100%)'
              : 'linear-gradient(135deg, rgba(220, 38, 38, 0.1) 0%, rgba(220, 38, 38, 0.05) 100%)',
            borderRadius: '16px',
            padding: isMobile ? '1rem' : '1.5rem',
            border: challengeData?.is_paused 
              ? '1px solid rgba(249, 115, 22, 0.3)'
              : '1px solid rgba(220, 38, 38, 0.2)',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              gap: '1rem',
              alignItems: isMobile ? 'stretch' : 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <Trophy size={24} color={challengeData?.is_paused ? '#f97316' : '#dc2626'} />
                <h2 style={{
                  fontSize: isMobile ? '1.1rem' : '1.25rem',
                  fontWeight: '700',
                  color: '#fff',
                  margin: 0
                }}>
                  Challenge Monitor
                  {challengeData?.is_paused && (
                    <span style={{
                      fontSize: '0.75rem',
                      marginLeft: '0.75rem',
                      color: '#f97316',
                      fontWeight: '600'
                    }}>
                      ⏸️ GEPAUZEERD
                    </span>
                  )}
                </h2>
              </div>

              <div style={{
                display: 'flex',
                gap: '0.75rem',
                alignItems: 'center',
                flex: 1,
                maxWidth: isMobile ? '100%' : '500px'
              }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <select
                    value={selectedClient?.id || ''}
                    onChange={(e) => {
                      const client = challengeClients.find(c => c.id === e.target.value)
                      setSelectedClient(client)
                    }}
                    style={{
                      width: '100%',
                      padding: isMobile ? '0.75rem 2.5rem 0.75rem 0.75rem' : '0.875rem 2.5rem 0.875rem 0.875rem',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '10px',
                      color: '#fff',
                      fontSize: isMobile ? '0.9rem' : '0.95rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      appearance: 'none',
                      outline: 'none'
                    }}
                  >
                    {challengeClients.map(client => (
                      <option key={client.id} value={client.id}>
                        {client.first_name} {client.last_name} {client.isPaused ? '⏸️' : ''}
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

                {/* PAUSE/RESUME BUTTON */}
                <button
                  onClick={handlePauseToggle}
                  disabled={pauseLoading}
                  style={{
                    padding: isMobile ? '0.75rem' : '0.75rem 1rem',
                    background: challengeData?.is_paused
                      ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                      : 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                    border: `1px solid ${challengeData?.is_paused ? 'rgba(16, 185, 129, 0.3)' : 'rgba(249, 115, 22, 0.3)'}`,
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: isMobile ? '0.85rem' : '0.9rem',
                    fontWeight: '600',
                    cursor: pauseLoading ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    minHeight: '44px',
                    opacity: pauseLoading ? 0.5 : 1,
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent',
                    transition: 'all 0.3s ease',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {challengeData?.is_paused ? (
                    <>
                      <Play size={16} />
                      {!isMobile && 'Resume'}
                    </>
                  ) : (
                    <>
                      <Pause size={16} />
                      {!isMobile && 'Pause'}
                    </>
                  )}
                </button>

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
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '44px',
                    minHeight: '44px',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent'
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
                {challengeData.is_paused && challengeData.pause_reason && (
                  <>
                    <span>•</span>
                    <span style={{ color: '#f97316' }}>
                      Reden: {challengeData.pause_reason}
                    </span>
                  </>
                )}
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
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  whiteSpace: 'nowrap',
                  minHeight: '44px',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  transition: 'all 0.3s ease'
                }}
              >
                <span style={{ fontSize: '1rem' }}>
                  {typeof tab.icon === 'string' ? tab.icon : <tab.icon size={16} />}
                </span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* RENDER ALLE VIEW COMPONENTS */}
          {selectedClient && (
            <>
              {activeView === 'overview' && (
                <ChallengeHomeBanner 
                  client={selectedClient}
                  db={db}
                  isCoachView={true}
                />
              )}
              
              {activeView === 'goals' && (
                <ChallengeGoalManager 
                  db={db}
                  client={selectedClient}
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
              
              {activeView === 'adjustments' && (
                <ChallengeAdjustments 
                  client={selectedClient}
                  db={db}
                  challengeData={challengeData}
                />
              )}
            </>
          )}
        </>
      )}

      <style>{`
        @keyframes slideDown {
          from { 
            opacity: 0; 
            transform: translateY(-10px);
          }
          to { 
            opacity: 1; 
            transform: translateY(0);
          }
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
