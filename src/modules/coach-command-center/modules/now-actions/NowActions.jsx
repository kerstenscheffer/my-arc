// src/modules/coach-command-center/modules/now-actions/NowActions.jsx
// Version 5.0 - With Activity Feed Integration

import { useState, useEffect, useRef, useCallback } from 'react'
import NowActionsService from './NowActionsService'
import ActivityFeed from './ActivityFeed'
import { 
  Shield, Phone, Target, Scale, Utensils, Dumbbell,
  RefreshCw, Settings, ChevronLeft, ChevronRight,
  AlertCircle, Clock, CheckCircle, Filter
} from 'lucide-react'

export default function NowActions({ db, clients, isMobile, onActionComplete }) {
  // Core state
  const [highPriorityActions, setHighPriorityActions] = useState([])
  const [inboxActions, setInboxActions] = useState([])
  const [lowPriorityActions, setLowPriorityActions] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [selectedClient, setSelectedClient] = useState(null)
  const [showSettings, setShowSettings] = useState(false)
  
  // Filter states - PENDING vs ACTIVE
  const [pendingFilters, setPendingFilters] = useState({
    types: {
      calls_urgent: true,
      calls_scheduled: true,
      goals_deadline: true,
      goals_progress: false,
      weight_tracking: true,
      weight_changes: true,
      meals_compliance: true,
      meals_water: true,
      workouts_daily: true,
      workouts_weekly: true,
      celebrations: false
    },
    urgencyRange: {
      min: 0,
      max: 100
    },
    autoRefresh: false,
    refreshInterval: 300
  })
  
  const [activeFilters, setActiveFilters] = useState(pendingFilters)
  const [hasChanges, setHasChanges] = useState(false)
  
  // Category counts
  const [categoryCounts, setCategoryCounts] = useState({
    calls: 0, goals: 0, weight: 0, meals: 0, workouts: 0
  })
  
  // Service
  const serviceRef = useRef(null)
  if (!serviceRef.current) {
    serviceRef.current = new NowActionsService(db)
  }
  const service = serviceRef.current
  
  // Category config
  const categoryConfig = {
    calls: { icon: Phone, color: '#3b82f6' },
    goals: { icon: Target, color: '#8b5cf6' },
    weight: { icon: Scale, color: '#ec4899' },
    meals: { icon: Utensils, color: '#10b981' },
    workouts: { icon: Dumbbell, color: '#f97316' }
  }
  
  // Filter mapping - UI groups to detection types
  const filterMapping = {
    calls_urgent: ['call_urgent', 'call_request'],
    calls_scheduled: ['call', 'call_missing'],
    goals_deadline: ['goal_deadline', 'goal_missing'],
    goals_progress: ['goal_inactive', 'goal_behind'],
    weight_tracking: ['weight_missing', 'weight_overdue'],
    weight_changes: ['weight_rapid', 'weight_plateau', 'weight_wrong', 'weight_near', 'weight_reached'],
    meals_compliance: ['meal_tracking', 'meal_compliance', 'calorie_compliance', 'protein_compliance'],
    meals_water: ['water_intake'],
    workouts_daily: ['workout_missing', 'workout_skipped', 'workout_partial'],
    workouts_weekly: ['workout_inactive', 'workout_compliance', 'workout_setup'],
    celebrations: ['celebration']
  }
  
  // Check if action should be shown based on filters
  const shouldShowAction = (action) => {
    // Check urgency range
    if (action.urgencyScore < activeFilters.urgencyRange.min || 
        action.urgencyScore > activeFilters.urgencyRange.max) {
      return false
    }
    
    // Check type filters
    for (const [groupKey, types] of Object.entries(filterMapping)) {
      if (types.includes(action.type)) {
        return activeFilters.types[groupKey]
      }
    }
    
    // Default to showing if type not in mapping
    return true
  }
  
  // Load actions with filters
  const loadActions = useCallback(async () => {
    try {
      setLoading(true)
      if (!clients || clients.length === 0) {
        setLoading(false)
        return
      }
      
      const targetClients = selectedClient 
        ? clients.filter(c => c.id === selectedClient)
        : clients
      
      const detectedActions = await service.detectAllActions(targetClients, {})
      
      // Apply filters
      const filteredActions = detectedActions.filter(shouldShowAction)
      
      // Count categories
      const counts = { calls: 0, goals: 0, weight: 0, meals: 0, workouts: 0 }
      
      const categorizedActions = filteredActions.map(action => {
        let category = 'other'
        if (action.type?.includes('call')) category = 'calls'
        else if (action.type?.includes('goal')) category = 'goals'
        else if (action.type?.includes('weight')) category = 'weight'
        else if (action.type?.includes('meal') || action.type?.includes('water') || action.type?.includes('calorie') || action.type?.includes('protein')) category = 'meals'
        else if (action.type?.includes('workout')) category = 'workouts'
        
        counts[category] = (counts[category] || 0) + 1
        return { ...action, category }
      })
      
      setCategoryCounts(counts)
      
      // Distribute by urgency
      const high = categorizedActions.filter(a => a.urgencyScore >= 70)
      const medium = categorizedActions.filter(a => a.urgencyScore >= 30 && a.urgencyScore < 70)
      const low = categorizedActions.filter(a => a.urgencyScore < 30)
      
      setHighPriorityActions(high)
      setInboxActions(medium)
      setLowPriorityActions(low)
      setLastRefresh(new Date())
      
    } catch (error) {
      console.error('Load failed:', error)
    } finally {
      setLoading(false)
    }
  }, [clients, selectedClient, activeFilters])
  
  // Initial load
  useEffect(() => {
    loadActions()
  }, [loadActions])
  
  // Auto refresh
  useEffect(() => {
    if (!activeFilters.autoRefresh) return
    const interval = setInterval(() => {
      loadActions()
    }, activeFilters.refreshInterval * 1000)
    return () => clearInterval(interval)
  }, [activeFilters.autoRefresh, activeFilters.refreshInterval, loadActions])
  
  // Track changes
  useEffect(() => {
    setHasChanges(JSON.stringify(pendingFilters) !== JSON.stringify(activeFilters))
  }, [pendingFilters, activeFilters])
  
  // Apply filter changes
  const applyFilters = () => {
    setActiveFilters({...pendingFilters})
    setHasChanges(false)
  }
  
  // Move action between zones
  const moveToZone = (action, fromZone, toZone) => {
    if (fromZone === 'inbox') {
      setInboxActions(prev => prev.filter(a => a.id !== action.id))
    } else if (fromZone === 'high') {
      setHighPriorityActions(prev => prev.filter(a => a.id !== action.id))
    } else if (fromZone === 'low') {
      setLowPriorityActions(prev => prev.filter(a => a.id !== action.id))
    }
    
    if (toZone === 'high') {
      setHighPriorityActions(prev => [action, ...prev])
    } else if (toZone === 'low') {
      setLowPriorityActions(prev => [action, ...prev])
    } else if (toZone === 'inbox') {
      setInboxActions(prev => [action, ...prev])
    }
  }
  
  // Handle action
  const handleAction = async (action, zone) => {
    await service.markActionHandled(action.id)
    
    if (zone === 'high') {
      setHighPriorityActions(prev => prev.filter(a => a.id !== action.id))
    } else if (zone === 'inbox') {
      setInboxActions(prev => prev.filter(a => a.id !== action.id))
    } else if (zone === 'low') {
      setLowPriorityActions(prev => prev.filter(a => a.id !== action.id))
    }
    
    if (onActionComplete) onActionComplete()
  }
  
  if (loading && (!highPriorityActions.length && !inboxActions.length && !lowPriorityActions.length)) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem'
      }}>
        <div style={{
          width: '30px',
          height: '30px',
          border: '3px solid rgba(16, 185, 129, 0.2)',
          borderTopColor: '#10b981',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    )
  }
  
  return (
    <div>
      <div style={{
        background: 'linear-gradient(135deg, rgba(17, 17, 17, 0.95) 0%, rgba(10, 10, 10, 0.95) 100%)',
        borderRadius: '20px',
        padding: isMobile ? '1rem' : '1.25rem',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(20px)'
      }}>
        {/* Compact Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem'
        }}>
          <div>
            <h2 style={{
              fontSize: isMobile ? '1.25rem' : '1.5rem',
              fontWeight: '700',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              margin: 0
            }}>
              Command Center
            </h2>
            <p style={{
              fontSize: '0.7rem',
              color: 'rgba(255, 255, 255, 0.4)',
              marginTop: '0.2rem'
            }}>
              {clients?.length || 0} clients • Last: {lastRefresh.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={loadActions}
              disabled={loading}
              style={{
                padding: '0.4rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '8px',
                color: 'rgba(255, 255, 255, 0.6)',
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={16} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            </button>
            
            <button
              onClick={() => setShowSettings(!showSettings)}
              style={{
                padding: '0.4rem',
                background: showSettings ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${showSettings ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 255, 255, 0.08)'}`,
                borderRadius: '8px',
                color: showSettings ? '#10b981' : 'rgba(255, 255, 255, 0.6)',
                cursor: 'pointer',
                position: 'relative'
              }}
            >
              <Filter size={16} />
              {hasChanges && (
                <div style={{
                  position: 'absolute',
                  top: '-2px',
                  right: '-2px',
                  width: '6px',
                  height: '6px',
                  background: '#f97316',
                  borderRadius: '50%'
                }} />
              )}
            </button>
          </div>
        </div>
        
        {/* Category Bar */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '1rem',
          alignItems: 'center'
        }}>
          {Object.entries(categoryConfig).map(([key, config]) => {
            const Icon = config.icon
            const count = categoryCounts[key] || 0
            return (
              <div
                key={key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  padding: '0.3rem 0.5rem',
                  borderRadius: '8px',
                  border: `1px solid ${count > 0 ? `${config.color}25` : 'rgba(255, 255, 255, 0.05)'}`,
                  background: count > 0 ? `${config.color}08` : 'transparent'
                }}
              >
                <Icon size={12} color={count > 0 ? config.color : 'rgba(255, 255, 255, 0.3)'} />
                <span style={{
                  fontSize: '0.65rem',
                  color: count > 0 ? config.color : 'rgba(255, 255, 255, 0.3)',
                  fontWeight: '600'
                }}>
                  {count}
                </span>
              </div>
            )
          })}
          
          <select
            value={selectedClient || ''}
            onChange={(e) => setSelectedClient(e.target.value || null)}
            style={{
              marginLeft: 'auto',
              padding: '0.3rem 0.6rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              color: 'white',
              fontSize: '0.75rem'
            }}
          >
            <option value="">All Clients</option>
            {clients?.map(client => (
              <option key={client.id} value={client.id}>
                {client.first_name}
              </option>
            ))}
          </select>
        </div>
        
        {/* Advanced Filter Panel */}
        {showSettings && (
          <div style={{
            background: 'rgba(0, 0, 0, 0.4)',
            borderRadius: '12px',
            padding: '1rem',
            marginBottom: '1rem',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            {/* Detection Types */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
              gap: '1rem',
              marginBottom: '1rem'
            }}>
              {/* Calls */}
              <div>
                <h4 style={{
                  fontSize: '0.75rem',
                  color: '#3b82f6',
                  marginBottom: '0.5rem',
                  fontWeight: '600'
                }}>
                  CALLS
                </h4>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={pendingFilters.types.calls_urgent}
                    onChange={(e) => setPendingFilters(prev => ({
                      ...prev,
                      types: { ...prev.types, calls_urgent: e.target.checked }
                    }))}
                  />
                  <span>Urgent (binnen 15 min)</span>
                </label>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={pendingFilters.types.calls_scheduled}
                    onChange={(e) => setPendingFilters(prev => ({
                      ...prev,
                      types: { ...prev.types, calls_scheduled: e.target.checked }
                    }))}
                  />
                  <span>Scheduled calls</span>
                </label>
              </div>
              
              {/* Goals */}
              <div>
                <h4 style={{
                  fontSize: '0.75rem',
                  color: '#8b5cf6',
                  marginBottom: '0.5rem',
                  fontWeight: '600'
                }}>
                  GOALS
                </h4>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={pendingFilters.types.goals_deadline}
                    onChange={(e) => setPendingFilters(prev => ({
                      ...prev,
                      types: { ...prev.types, goals_deadline: e.target.checked }
                    }))}
                  />
                  <span>Deadlines</span>
                </label>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={pendingFilters.types.goals_progress}
                    onChange={(e) => setPendingFilters(prev => ({
                      ...prev,
                      types: { ...prev.types, goals_progress: e.target.checked }
                    }))}
                  />
                  <span>No progress</span>
                </label>
              </div>
              
              {/* Weight */}
              <div>
                <h4 style={{
                  fontSize: '0.75rem',
                  color: '#ec4899',
                  marginBottom: '0.5rem',
                  fontWeight: '600'
                }}>
                  WEIGHT
                </h4>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={pendingFilters.types.weight_tracking}
                    onChange={(e) => setPendingFilters(prev => ({
                      ...prev,
                      types: { ...prev.types, weight_tracking: e.target.checked }
                    }))}
                  />
                  <span>Not tracked (7+ days)</span>
                </label>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={pendingFilters.types.weight_changes}
                    onChange={(e) => setPendingFilters(prev => ({
                      ...prev,
                      types: { ...prev.types, weight_changes: e.target.checked }
                    }))}
                  />
                  <span>Changes & plateau</span>
                </label>
              </div>
              
              {/* Meals */}
              <div>
                <h4 style={{
                  fontSize: '0.75rem',
                  color: '#10b981',
                  marginBottom: '0.5rem',
                  fontWeight: '600'
                }}>
                  MEALS
                </h4>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={pendingFilters.types.meals_compliance}
                    onChange={(e) => setPendingFilters(prev => ({
                      ...prev,
                      types: { ...prev.types, meals_compliance: e.target.checked }
                    }))}
                  />
                  <span>Compliance issues</span>
                </label>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={pendingFilters.types.meals_water}
                    onChange={(e) => setPendingFilters(prev => ({
                      ...prev,
                      types: { ...prev.types, meals_water: e.target.checked }
                    }))}
                  />
                  <span>Water intake</span>
                </label>
              </div>
              
              {/* Workouts */}
              <div>
                <h4 style={{
                  fontSize: '0.75rem',
                  color: '#f97316',
                  marginBottom: '0.5rem',
                  fontWeight: '600'
                }}>
                  WORKOUTS
                </h4>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={pendingFilters.types.workouts_daily}
                    onChange={(e) => setPendingFilters(prev => ({
                      ...prev,
                      types: { ...prev.types, workouts_daily: e.target.checked }
                    }))}
                  />
                  <span>Daily tracking</span>
                </label>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={pendingFilters.types.workouts_weekly}
                    onChange={(e) => setPendingFilters(prev => ({
                      ...prev,
                      types: { ...prev.types, workouts_weekly: e.target.checked }
                    }))}
                  />
                  <span>Weekly compliance</span>
                </label>
              </div>
              
              {/* Other */}
              <div>
                <h4 style={{
                  fontSize: '0.75rem',
                  color: '#fbbf24',
                  marginBottom: '0.5rem',
                  fontWeight: '600'
                }}>
                  OTHER
                </h4>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={pendingFilters.types.celebrations}
                    onChange={(e) => setPendingFilters(prev => ({
                      ...prev,
                      types: { ...prev.types, celebrations: e.target.checked }
                    }))}
                  />
                  <span>Celebrations</span>
                </label>
              </div>
            </div>
            
            {/* Bottom Controls */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: '0.75rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              {/* Auto Refresh */}
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.75rem',
                  color: 'rgba(255, 255, 255, 0.7)'
                }}>
                  <input
                    type="checkbox"
                    checked={pendingFilters.autoRefresh}
                    onChange={(e) => setPendingFilters(prev => ({
                      ...prev,
                      autoRefresh: e.target.checked
                    }))}
                  />
                  Auto refresh
                </label>
                
                <select
                  value={pendingFilters.refreshInterval}
                  onChange={(e) => setPendingFilters(prev => ({
                    ...prev,
                    refreshInterval: Number(e.target.value)
                  }))}
                  style={{
                    padding: '0.25rem 0.5rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '0.7rem'
                  }}
                >
                  <option value="60">1 min</option>
                  <option value="300">5 min</option>
                  <option value="600">10 min</option>
                </select>
              </div>
              
              {/* Update Button */}
              <button
                onClick={applyFilters}
                disabled={!hasChanges}
                style={{
                  padding: '0.5rem 1.5rem',
                  background: hasChanges 
                    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                    : 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid ${hasChanges ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 255, 255, 0.08)'}`,
                  borderRadius: '8px',
                  color: hasChanges ? 'white' : 'rgba(255, 255, 255, 0.3)',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  cursor: hasChanges ? 'pointer' : 'not-allowed',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  transition: 'all 0.2s ease'
                }}
              >
                Update Filters
              </button>
            </div>
          </div>
        )}
        
        {/* 3-Zone System */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '0.75rem'
        }}>
          {/* HIGH PRIORITY */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.04) 0%, rgba(239, 68, 68, 0.02) 100%)',
            borderRadius: '12px',
            border: '1px solid rgba(239, 68, 68, 0.12)',
            padding: '0.75rem',
            minHeight: '400px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              marginBottom: '0.75rem',
              paddingBottom: '0.5rem',
              borderBottom: '1px solid rgba(239, 68, 68, 0.08)'
            }}>
              <AlertCircle size={14} color="#ef4444" />
              <h3 style={{
                fontSize: '0.8rem',
                fontWeight: '600',
                color: '#ef4444',
                margin: 0
              }}>
                High ({highPriorityActions.length})
              </h3>
            </div>
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              overflowY: 'auto',
              maxHeight: '500px'
            }}>
              {highPriorityActions.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  color: 'rgba(255, 255, 255, 0.3)',
                  fontSize: '0.75rem',
                  padding: '2rem 0'
                }}>
                  No urgent items
                </div>
              ) : (
                highPriorityActions.map(action => (
                  <ActionCard
                    key={action.id}
                    action={action}
                    zone="high"
                    onMove={moveToZone}
                    onAction={handleAction}
                    isMobile={isMobile}
                    categoryConfig={categoryConfig}
                  />
                ))
              )}
            </div>
          </div>
          
          {/* INBOX */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.02) 0%, rgba(255, 255, 255, 0.01) 100%)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '0.75rem',
            minHeight: '400px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              marginBottom: '0.75rem',
              paddingBottom: '0.5rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              <Clock size={14} color="rgba(255, 255, 255, 0.6)" />
              <h3 style={{
                fontSize: '0.8rem',
                fontWeight: '600',
                color: 'rgba(255, 255, 255, 0.7)',
                margin: 0
              }}>
                Inbox ({inboxActions.length})
              </h3>
            </div>
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              overflowY: 'auto',
              maxHeight: '500px'
            }}>
              {inboxActions.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  color: 'rgba(255, 255, 255, 0.3)',
                  fontSize: '0.75rem',
                  padding: '2rem 0'
                }}>
                  No new items
                </div>
              ) : (
                inboxActions.map(action => (
                  <ActionCard
                    key={action.id}
                    action={action}
                    zone="inbox"
                    onMove={moveToZone}
                    onAction={handleAction}
                    isMobile={isMobile}
                    categoryConfig={categoryConfig}
                  />
                ))
              )}
            </div>
          </div>
          
          {/* LOW PRIORITY */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.04) 0%, rgba(16, 185, 129, 0.02) 100%)',
            borderRadius: '12px',
            border: '1px solid rgba(16, 185, 129, 0.12)',
            padding: '0.75rem',
            minHeight: '400px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              marginBottom: '0.75rem',
              paddingBottom: '0.5rem',
              borderBottom: '1px solid rgba(16, 185, 129, 0.08)'
            }}>
              <CheckCircle size={14} color="#10b981" />
              <h3 style={{
                fontSize: '0.8rem',
                fontWeight: '600',
                color: '#10b981',
                margin: 0
              }}>
                Low ({lowPriorityActions.length})
              </h3>
            </div>
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              overflowY: 'auto',
              maxHeight: '500px'
            }}>
              {lowPriorityActions.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  color: 'rgba(255, 255, 255, 0.3)',
                  fontSize: '0.75rem',
                  padding: '2rem 0'
                }}>
                  No low priority
                </div>
              ) : (
                lowPriorityActions.map(action => (
                  <ActionCard
                    key={action.id}
                    action={action}
                    zone="low"
                    onMove={moveToZone}
                    onAction={handleAction}
                    isMobile={isMobile}
                    categoryConfig={categoryConfig}
                  />
                ))
              )}
            </div>
          </div>
        </div>
        
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>

      {/* Activity Feed - Full Width Below */}
      <ActivityFeed 
        db={db} 
        clients={clients} 
        isMobile={isMobile}
      />
    </div>
  )
}

// Clean Action Card Component
function ActionCard({ action, zone, onMove, onAction, isMobile, categoryConfig }) {
  const config = categoryConfig[action.category] || categoryConfig.calls
  const Icon = config.icon
  
  return (
    <div style={{
      padding: isMobile ? '0.6rem' : '0.7rem',
      background: 'rgba(255, 255, 255, 0.02)',
      borderRadius: '10px',
      border: '1px solid rgba(255, 255, 255, 0.06)',
      position: 'relative',
      transition: 'all 0.2s ease'
    }}>
      {/* Move Arrows */}
      <div style={{
        position: 'absolute',
        top: '0.4rem',
        right: '0.4rem',
        display: 'flex',
        gap: '0.2rem'
      }}>
        {zone !== 'high' && (
          <button
            onClick={() => onMove(action, zone, 'high')}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '0.1rem',
              color: 'rgba(239, 68, 68, 0.5)'
            }}
          >
            <ChevronLeft size={12} />
          </button>
        )}
        {zone !== 'low' && (
          <button
            onClick={() => onMove(action, zone, 'low')}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '0.1rem',
              color: 'rgba(16, 185, 129, 0.5)'
            }}
          >
            <ChevronRight size={12} />
          </button>
        )}
      </div>
      
      {/* Header with Icon & Name */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
        marginBottom: '0.4rem'
      }}>
        <div style={{
          width: '24px',
          height: '24px',
          borderRadius: '6px',
          background: `${config.color}10`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <Icon size={12} color={config.color} />
        </div>
        
        <span style={{
          fontSize: isMobile ? '0.75rem' : '0.8rem',
          fontWeight: '600',
          color: '#fff'
        }}>
          {action.clientName}
        </span>
        
        <span style={{
          marginLeft: 'auto',
          fontSize: '0.6rem',
          padding: '0.1rem 0.25rem',
          borderRadius: '4px',
          background: `${config.color}15`,
          color: config.color,
          fontWeight: '600'
        }}>
          {action.urgencyScore}
        </span>
      </div>
      
      {/* Message */}
      <div style={{
        fontSize: isMobile ? '0.7rem' : '0.75rem',
        color: 'rgba(255, 255, 255, 0.7)',
        lineHeight: '1.2',
        marginBottom: '0.3rem'
      }}>
        {action.message}
      </div>
      
      {/* Detail */}
      {action.detail && (
        <div style={{
          fontSize: '0.65rem',
          color: 'rgba(255, 255, 255, 0.4)',
          lineHeight: '1.2',
          marginBottom: '0.5rem'
        }}>
          {action.detail}
        </div>
      )}
      
      {/* Action Button */}
      <button
        onClick={() => onAction(action, zone)}
        style={{
          width: '100%',
          padding: '0.4rem',
          background: `${config.color}15`,
          border: `1px solid ${config.color}25`,
          borderRadius: '6px',
          color: config.color,
          fontSize: '0.65rem',
          fontWeight: '600',
          cursor: 'pointer',
          textTransform: 'uppercase',
          letterSpacing: '0.03em'
        }}
      >
        {action.buttonText?.slice(0, 8) || 'DO'}
      </button>
    </div>
  )
}

// Styles
const styles = {
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '0.4rem',
    fontSize: '0.7rem',
    color: 'rgba(255, 255, 255, 0.7)',
    cursor: 'pointer'
  }
}
