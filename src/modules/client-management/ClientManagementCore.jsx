import useIsMobile from '../../hooks/useIsMobile'
// src/modules/client-management/ClientManagementCore.jsx
// ===== IMPORTS - Client Management Core =====

// React Hooks
import { useState, useEffect, useCallback, useMemo } from 'react'



// Assignment Modals
import {
  WorkoutSchemaAssignmentModal,
  BulkActionsModal
} from './AssignmentModals'

// Meal Plan Generator (nieuwe implementatie)
import { MealPlanGenerator } from './MealPlanGenerator'

// Progress & Export Components
import {
  ProgressCharts,
  ExportManager
} from './ProgressChartsExport'

// Client Management Modules - GEBRUIK DEZE IMPORTS
import AccountabilityModule from './modules/AccountabilityModule'
import AnalyticsModule from './modules/AnalyticsModule'
import BonusesModule from './modules/BonusesModule'
import CommunicationModule from './modules/CommunicationModule'
import ContentModule from './modules/ContentModule'
import GoalsModule from './modules/GoalsModule'
import MealTrackingModule from './modules/MealTrackingModule'
import ProgressModule from './modules/ProgressModule'
import WorkoutModule from './modules/WorkoutModule'
import CoachNotificationTab from '../notifications/CoachNotificationTab';

// Services (indien nodig)
import DatabaseService from '../../services/DatabaseService'

// ===== MODULE REGISTRY =====
class ModuleRegistry {
  constructor() {
    this.modules = new Map()
    this.dataCache = new Map()
  }

  register(moduleConfig) {
    if (!moduleConfig.id || !moduleConfig.component) {
      console.error('Module must have id and component')
      return
    }
    
    this.modules.set(moduleConfig.id, {
      ...moduleConfig,
      enabled: moduleConfig.enabled !== false
    })
  }

  getActiveModules() {
    return Array.from(this.modules.values())
      .filter(m => m.enabled)
      .sort((a, b) => (a.priority || 999) - (b.priority || 999))
  }

  cacheData(key, data) {
    this.dataCache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  getCachedData(key, maxAge = 60000) {
    const cached = this.dataCache.get(key)
    if (!cached) return null
    
    if (Date.now() - cached.timestamp > maxAge) {
      this.dataCache.delete(key)
      return null
    }
    
    return cached.data
  }
}

const registry = new ModuleRegistry()

// Register all modules - GEBRUIK DE GEÏMPORTEERDE COMPONENTEN
registry.register({
  id: 'progress',
  name: 'Voortgang',
  icon: '📈',
  component: ProgressModule, // Gebruikt de import
  dataSource: async (db, clientId) => {
    try {
      const data = await db.getClientProgress(clientId)
      return data || { measurements: [] }
    } catch (error) {
      console.error('Progress module error:', error)
      return { measurements: [] }
    }
  },
  priority: 1
})

registry.register({
  id: 'meals',
  name: 'Meal Plans',
  icon: '🍽️',
  component: MealTrackingModule, // Gebruikt de import
  dataSource: async (db, clientId) => {
    try {
      const [compliance, plan] = await Promise.all([
        db.getMealCompliance(clientId, 30),
        db.getClientMealPlan(clientId)
      ])
      return { compliance, plan }
    } catch (error) {
      console.error('Meals module error:', error)
      return { 
        compliance: {
          average: 0,
          kcal_compliance: 0,
          protein_compliance: 0,
          current_streak: 0
        }, 
        plan: null 
      }
    }
  },
  priority: 2
})

registry.register({
  id: 'workouts',
  name: 'Training',
  icon: '💪',
  component: WorkoutModule, // Gebruikt de import
  dataSource: async (db, clientId) => {
    try {
      const data = await db.getClientWorkoutData(clientId)
      return data || { current_schema: null, progress: [], compliance: 0 }
    } catch (error) {
      console.error('Workouts module error:', error)
      return { current_schema: null, progress: [], compliance: 0 }
    }
  },
  priority: 3
})

registry.register({
  id: 'goals',
  name: 'Doelen',
  icon: '🎯',
  component: GoalsModule, // Gebruikt de import
  dataSource: async (db, clientId) => {
    try {
      const data = await db.getClientGoals(clientId)
      return Array.isArray(data) ? data : []
    } catch (error) {
      console.error('Goals module error:', error)
      return []
    }
  },
  priority: 4
})

registry.register({
  id: 'notifications',
  name: 'Meldingen',
  icon: '🔔',
  component: CoachNotificationTab,
  dataSource: async (db, clientId) => {
    try {
      const data = await db.notifications?.getNotificationHistory(clientId, 20)
      return data || []
    } catch (error) {
      console.error('Notifications module error:', error)
      return []
    }
  },
  priority: 4.5
})


registry.register({
  id: 'communication',
  name: 'Berichten',
  icon: '💬',
  component: CommunicationModule, // Gebruikt de import
  dataSource: async (db, clientId) => {
    try {
      const data = await db.getClientMessages(clientId)
      return Array.isArray(data) ? data : []
    } catch (error) {
      console.error('Communication module error:', error)
      return []
    }
  },
  priority: 5
})

// Optioneel: Register andere modules als ze beschikbaar zijn
// registry.register({
//   id: 'accountability',
//   name: 'Accountability',
//   icon: '✅',
//   component: AccountabilityModule,
//   dataSource: async (db, clientId) => {
//     // Implementeer data source
//     return {}
//   },
//   priority: 6
// })

// registry.register({
//   id: 'analytics',
//   name: 'Analytics',
//   icon: '📊',
//   component: AnalyticsModule,
//   dataSource: async (db, clientId) => {
//     // Implementeer data source
//     return {}
//   },
//   priority: 7
// })

// registry.register({
//   id: 'bonuses',
//   name: 'Bonuses',
//   icon: '🎁',
//   component: BonusesModule,
//   dataSource: async (db, clientId) => {
//     // Implementeer data source
//     return {}
//   },
//   priority: 8
// })

// registry.register({
//   id: 'content',
//   name: 'Content',
//   icon: '📚',
//   component: ContentModule,
//   dataSource: async (db, clientId) => {
//     // Implementeer data source
//     return {}
//   },
//   priority: 9
// })

// ===== MAIN COMPONENT =====
export default function ClientManagementCore({ db }) {
  const [loading, setLoading] = useState(true)
  const [clients, setClients] = useState([])
  const [selectedClient, setSelectedClient] = useState(null)
  const [activeModules, setActiveModules] = useState([])
  const [moduleData, setModuleData] = useState({})
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [viewMode, setViewMode] = useState('grid')
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  
  // State voor modals en features
  const [showWorkoutModal, setShowWorkoutModal] = useState(false)
  const [showMealModal, setShowMealModal] = useState(false)
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [showCharts, setShowCharts] = useState(false)
  const [showExport, setShowExport] = useState(false)
  
  const isMobile = useIsMobile()

  useEffect(() => {
    loadInitialData()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      setRefreshTrigger(prev => prev + 1)
    }, 30000)
    
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (selectedClient) {
      loadClientData(selectedClient.id)
    }
  }, [selectedClient, refreshTrigger])

  const loadInitialData = async () => {
    setLoading(true)
    try {
      const user = await db.getCurrentUser()
      const clientsData = await db.getClients(user?.id)
      setClients(clientsData || [])
      setActiveModules(registry.getActiveModules())
      
      if (clientsData && clientsData.length > 0 && !selectedClient) {
        setSelectedClient(clientsData[0])
      }
    } catch (error) {
      console.error('Failed to load initial data:', error)
      setClients([])
    } finally {
      setLoading(false)
    }
  }

  const loadClientData = async (clientId) => {
    const modules = registry.getActiveModules()
    const newModuleData = {}
    
    for (const module of modules) {
      try {
        if (module.dataSource) {
          const cached = registry.getCachedData(`${module.id}_${clientId}`)
          if (cached) {
            newModuleData[module.id] = cached
          } else {
            const data = await module.dataSource(db, clientId)
            newModuleData[module.id] = data
            registry.cacheData(`${module.id}_${clientId}`, data)
          }
        }
      } catch (error) {
        console.error(`Failed to load ${module.id} data:`, error)
        newModuleData[module.id] = null
      }
    }
    
    setModuleData(newModuleData)
  }

  const filteredClients = useMemo(() => {
    let filtered = clients || []
    
    if (searchQuery) {
      filtered = filtered.filter(client => {
        const search = searchQuery.toLowerCase()
        return (
          client.first_name?.toLowerCase().includes(search) ||
          client.last_name?.toLowerCase().includes(search) ||
          client.email?.toLowerCase().includes(search)
        )
      })
    }
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(client => {
        if (filterStatus === 'active') return client.status === 'active'
        if (filterStatus === 'inactive') return client.status !== 'active'
        if (filterStatus === 'new') {
          const created = new Date(client.created_at)
          const weekAgo = new Date()
          weekAgo.setDate(weekAgo.getDate() - 7)
          return created > weekAgo
        }
        return true
      })
    }
    
    return filtered
  }, [clients, searchQuery, filterStatus])

  const handleModuleAction = async (moduleId, action, params) => {
    try {
      console.log(`Action: ${moduleId}.${action}`, params)

      switch(action) {
        case 'sendMessage':
          if (params.message && selectedClient) {
            await db.sendNotification(selectedClient.id, 'coach_message', params.message)
            alert('✅ Message sent!')
            setRefreshTrigger(prev => prev + 1)
          }
          break

        case 'saveProgress':
          if (params && selectedClient) {
            await db.saveProgress(params)
            alert('✅ Progress saved!')
            setRefreshTrigger(prev => prev + 1)
          }
          break
        
        case 'addGoal':
          if (params && selectedClient) {
            await db.saveGoal(params)
            alert('✅ Goal added!')
            setRefreshTrigger(prev => prev + 1)
          }
          break
        
        case 'updateGoalStatus':
          if (params.goalId) {
            await db.updateGoalStatus(params.goalId, params.status)
            alert('✅ Goal updated!')
            setRefreshTrigger(prev => prev + 1)
          }
          break

        case 'assignWorkout':
          setShowWorkoutModal(true)
          break
          
        case 'assignMealPlan':
        case 'manageMeals':
        case 'viewMealPlan':
          setShowMealModal(true)
          break
        
        case 'viewProgress':
          setShowCharts(!showCharts) // Toggle charts on/off
          break
        
        case 'viewAllGoals':
          // Hier kun je een goals modal openen of navigeren
          console.log('View all goals for client:', selectedClient?.id)
          break
        
        case 'openChat':
          // Hier kun je een chat modal openen
          console.log('Open chat for client:', selectedClient?.id)
          break
        
        case 'assignContent':
          if (params.url) {
            console.log('Assign content:', params.url)
            alert('📹 Content assignment coming soon!')
          }
          break
        
        case 'viewDetails':
          // Voor analytics module
          console.log('View analytics details')
          break
          
        default:
          console.log('Unknown action:', action)
      }
    } catch (error) {
      console.error(`Module action failed:`, error)
      alert(`❌ Action failed: ${error.message}`)
    }
  }

  const getClientHealth = (client) => {
    const mealCompliance = moduleData.meals?.compliance?.average || 0
    const workoutCompliance = moduleData.workouts?.compliance || 0
    const hasGoals = moduleData.goals?.length > 0 ? 50 : 0
    
    const healthScore = Math.round((mealCompliance + workoutCompliance + hasGoals) / 3)
    
    return {
      score: Math.min(100, Math.max(0, healthScore)),
      status: healthScore >= 80 ? 'excellent' : 
              healthScore >= 60 ? 'good' : 
              healthScore >= 40 ? 'fair' : 'poor'
    }
  }

  const renderClientSelector = () => (
    <div className="myarc-card" style={{ 
      marginBottom: 'var(--s-6)',
      background: 'linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%)',
      border: '1px solid rgba(16, 185, 129, 0.2)'
    }}>
      <div className="myarc-card-header" style={{
        background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.1) 0%, transparent)',
        borderBottom: '1px solid rgba(16, 185, 129, 0.2)'
      }}>
        <h3 className="myarc-card-title" style={{ color: '#10b981' }}>
          👥 Clients ({filteredClients.length})
        </h3>
        
        <div className="myarc-flex myarc-gap-sm">
          {['grid', 'list', 'focus'].map(mode => (
            <button 
              key={mode}
              className={`myarc-btn ${viewMode === mode ? 'myarc-btn-primary' : 'myarc-btn-ghost'}`}
              onClick={() => setViewMode(mode)}
              style={{
                padding: '8px 12px',
                fontSize: '0.9rem'
              }}
            >
              {mode === 'grid' ? '⊞' : mode === 'list' ? '☰' : '◉'}
            </button>
          ))}
        </div>
      </div>
      
      <div style={{ padding: 'var(--s-4)' }}>
        <div className="myarc-flex myarc-gap-md" style={{ marginBottom: 'var(--s-4)' }}>
          <input
            className="myarc-input"
            type="text"
            placeholder="🔍 Zoek client..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ 
              flex: 1,
              background: 'rgba(0,0,0,0.5)',
              border: '1px solid rgba(16, 185, 129, 0.3)'
            }}
          />
          
          <select
            className="myarc-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              background: 'rgba(0,0,0,0.5)',
              border: '1px solid rgba(16, 185, 129, 0.3)'
            }}
          >
            <option value="all">Alle</option>
            <option value="active">Actief</option>
            <option value="new">Nieuw</option>
          </select>
        </div>
        
        <div style={{
          display: viewMode === 'grid' ? 'grid' : 'flex',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(250px, 1fr))',
          flexDirection: 'column',
          gap: 'var(--s-3)',
          maxHeight: '500px',
          overflowY: 'auto',
          paddingRight: '8px'
        }}>
          {filteredClients.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: 'var(--s-6)',
              color: 'var(--c-muted)'
            }}>
              <p style={{ fontSize: '3rem', marginBottom: 'var(--s-3)' }}>🔍</p>
              <p>Geen clients gevonden</p>
            </div>
          ) : (
            filteredClients.map(client => {
              const isSelected = selectedClient?.id === client.id
              const clientHealth = selectedClient?.id === client.id ? getClientHealth(client) : null
              
              return (
                <div
                  key={client.id}
                  onClick={() => setSelectedClient(client)}
                  style={{
                    padding: 'var(--s-3)',
                    background: isSelected 
                      ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%)'
                      : 'rgba(0,0,0,0.3)',
                    borderRadius: '12px',
                    border: `2px solid ${isSelected ? '#10b981' : 'transparent'}`,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <div className="myarc-flex myarc-justify-between myarc-items-center">
                    <div>
                      <p style={{ 
                        color: '#fff', 
                        fontWeight: '600',
                        fontSize: '1.1rem',
                        marginBottom: '4px'
                      }}>
                        {client.first_name} {client.last_name}
                      </p>
                      <p style={{ 
                        color: 'var(--c-muted)', 
                        fontSize: 'var(--text-sm)' 
                      }}>
                        {client.email}
                      </p>
                    </div>
                    
                    <div style={{ textAlign: 'center' }}>
                      {isSelected && clientHealth && (
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: `conic-gradient(
                            #10b981 ${clientHealth.score * 3.6}deg,
                            #374151 0deg
                          )`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: '#0f0f0f',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            fontSize: '0.8rem',
                            fontWeight: 'bold'
                          }}>
                            {clientHealth.score}
                          </div>
                        </div>
                      )}
                      {!isSelected && (
                        <div 
                          style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            background: client.status === 'active' ? '#10b981' : '#6b7280'
                          }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )

  const renderModuleGrid = () => {
    if (!selectedClient) {
      return (
        <div className="myarc-card" style={{ 
          textAlign: 'center', 
          padding: 'var(--s-8)',
          background: 'linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%)',
          border: '1px solid rgba(16, 185, 129, 0.2)'
        }}>
          <p style={{ fontSize: '4rem', marginBottom: 'var(--s-3)' }}>👈</p>
          <h3 style={{ color: 'var(--c-muted)' }}>Selecteer een client om te beginnen</h3>
        </div>
      )
    }
    
    const health = getClientHealth(selectedClient)
    
    return (
      <div className="myarc-card" style={{
        background: 'linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%)',
        border: '1px solid rgba(16, 185, 129, 0.2)'
      }}>
        <div className="myarc-card-header" style={{
          background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.1) 0%, transparent)',
          borderBottom: '1px solid rgba(16, 185, 129, 0.2)',
          padding: 'var(--s-5)'
        }}>
          <div className="myarc-flex myarc-justify-between myarc-items-center">
            <div>
              <h2 className="myarc-card-title" style={{
                fontSize: '1.8rem',
                background: 'linear-gradient(90deg, #10b981, #3b82f6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: '8px'
              }}>
                {selectedClient.first_name} {selectedClient.last_name}
              </h2>
              <p style={{ color: 'var(--c-muted)' }}>{selectedClient.email}</p>
              {selectedClient.goal && (
                <span style={{
                  display: 'inline-block',
                  marginTop: '8px',
                  background: 'rgba(16, 185, 129, 0.2)',
                  color: '#10b981',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: 'var(--text-sm)'
                }}>
                  🎯 {selectedClient.goal}
                </span>
              )}
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: `conic-gradient(
                  ${health.status === 'excellent' ? '#10b981' :
                    health.status === 'good' ? '#3b82f6' :
                    health.status === 'fair' ? '#f59e0b' : '#ef4444'} ${health.score * 3.6}deg,
                  #374151 0deg
                )`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{
                  width: '70px',
                  height: '70px',
                  borderRadius: '50%',
                  background: '#0f0f0f',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <span style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 'bold' }}>
                    {health.score}%
                  </span>
                  <span style={{ color: 'var(--c-muted)', fontSize: '0.7rem' }}>
                    Health
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="myarc-flex myarc-gap-sm" style={{ marginTop: 'var(--s-4)' }}>
            <button
              className="myarc-btn myarc-btn-sm"
              onClick={() => handleModuleAction('communication', 'sendMessage', { 
                message: 'Hi! How are you doing today?' 
              })}
              style={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
                border: 'none',
                color: '#fff'
              }}
            >
              📨 Quick Message
            </button>
            <button
              className="myarc-btn myarc-btn-sm myarc-btn-ghost"
              onClick={() => setRefreshTrigger(prev => prev + 1)}
            >
              🔄 Refresh
            </button>
            <button
              className="myarc-btn myarc-btn-sm myarc-btn-ghost"
              onClick={() => setShowBulkModal(true)}
            >
              ⚡ Bulk Actions
            </button>
            <button
              className="myarc-btn myarc-btn-sm myarc-btn-ghost"
              onClick={() => setShowExport(!showExport)}
            >
              📊 Export
            </button>
          </div>
        </div>
        
        <div style={{
          padding: 'var(--s-5)',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 
            viewMode === 'focus' ? '1fr' : 
            'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 'var(--s-4)'
        }}>
          {activeModules.map((module, idx) => {
            const ModuleComponent = module.component
            
            return (
              <div
                key={module.id}
                className="myarc-module-card"
                style={{
                  background: 'linear-gradient(135deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.3) 100%)',
                  borderRadius: '16px',
                  padding: 'var(--s-4)',
                  border: '1px solid rgba(16, 185, 129, 0.1)',
                  minHeight: viewMode === 'focus' ? '400px' : '220px',
                  transition: 'all 0.3s ease'
                }}
              >
                <div className="myarc-flex myarc-justify-between myarc-items-center" style={{ marginBottom: 'var(--s-3)' }}>
                  <h3 style={{ 
                    color: '#fff', 
                    fontSize: '1.1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--s-2)'
                  }}>
                    <span style={{ fontSize: '1.5rem' }}>{module.icon}</span>
                    {module.name}
                  </h3>
                </div>
                
                <ModuleComponent
                  client={selectedClient}
                  data={moduleData[module.id]}
                  onAction={(action, params) => handleModuleAction(module.id, action, params)}
                  viewMode={viewMode}
                  db={db}
                />
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{ 
        padding: 'var(--s-8)', 
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px'
      }}>
        <div style={{
          width: '60px',
          height: '60px',
          border: '4px solid rgba(16, 185, 129, 0.2)',
          borderTopColor: '#10b981',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: 'var(--s-4)'
        }} />
        <h2 style={{ color: '#fff' }}>Loading Client Management System...</h2>
      </div>
    )
  }

  return (
    <div className="myarc-client-management">
      <style>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '380px 1fr',
        gap: 'var(--s-6)'
      }}>
        {renderClientSelector()}
        {renderModuleGrid()}
      </div>
   
      {/* Workout Assignment Modal */}
      {showWorkoutModal && selectedClient && (
        <WorkoutSchemaAssignmentModal
          client={selectedClient}
          isOpen={showWorkoutModal}
          onClose={(success) => {
            setShowWorkoutModal(false)
            if (success) {
              loadClientData(selectedClient.id)
            }
          }}
          db={db}
        />
      )}
      
      {/* Meal Plan Generator Modal */}
      {showMealModal && selectedClient && (
        <MealPlanGenerator
          client={selectedClient}
          isOpen={showMealModal}
          onClose={(success) => {
            setShowMealModal(false)
            if (success) {
              loadClientData(selectedClient.id)
            }
          }}
          db={db}
        />
      )}
      
      {/* Bulk Actions Modal */}
      {showBulkModal && (
        <BulkActionsModal
          clients={filteredClients}
          isOpen={showBulkModal}
          onClose={(success) => {
            setShowBulkModal(false)
            if (success) {
              loadInitialData()
            }
          }}
          db={db}
        />
      )}
      
      {/* Progress Charts - Dit is geen modal maar een sectie */}
      {showCharts && selectedClient && (
        <div style={{ 
          marginTop: 'var(--s-6)',
          animation: 'slideIn 0.5s ease'
        }}>
          <ProgressCharts client={selectedClient} db={db} />
        </div>
      )}
      
      {/* Export Manager - Ook een sectie, geen modal */}
      {showExport && (
        <div style={{ 
          marginTop: 'var(--s-6)',
          animation: 'slideIn 0.5s ease'
        }}>
          <ExportManager clients={filteredClients} db={db} />
        </div>
      )}
    </div>
  )
}
