// ============================================
// MY ARC CALL PLANNING SYSTEM - V2.0
// Complete Rewrite - Clean & Functional
// ============================================

import React, { useState, useEffect } from 'react'
import CallPlanningService from './CallPlanningService'

// ============================================
// MAIN COACH COMPONENT
// ============================================
export function CallPlanningTab({ db, clients: propsClients, currentUser }) {
  const [view, setView] = useState('dashboard')
  const [templates, setTemplates] = useState([])
  const [plans, setPlans] = useState([])
  const [requests, setRequests] = useState([])
  const [clients, setClients] = useState(propsClients || [])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(null)
  const [selectedItem, setSelectedItem] = useState(null)

  useEffect(() => {
    loadAllData()
  }, [])

  const loadAllData = async () => {
    setLoading(true)
    try {
      // Als geen clients via props, laad ze hier
      let clientsData = propsClients
      if (!clientsData || clientsData.length === 0) {
        console.log('📋 Loading clients directly in CallPlanningTab')
        // Probeer via db als beschikbaar
        if (db && db.getClients) {
          clientsData = await db.getClients()
        } else {
          // Anders direct via Supabase
          const { createClient } = await import('@supabase/supabase-js')
          const supabase = createClient(
            import.meta.env.VITE_SUPABASE_URL,
            import.meta.env.VITE_SUPABASE_ANON_KEY
          )
          const { data } = await supabase
            .from('clients')
            .select('*')
            .order('full_name')
          clientsData = data || []
        }
        setClients(clientsData)
        console.log('✅ Clients loaded:', clientsData?.length || 0)
      }

      const [templatesData, plansData, requestsData] = await Promise.all([
        CallPlanningService.getCoachTemplates(),
        CallPlanningService.getCoachPlans(),
        CallPlanningService.getPendingRequests()
      ])
      setTemplates(templatesData || [])
      setPlans(plansData || [])
      setRequests(requestsData || [])
    } catch (error) {
      console.error('Error loading data:', error)
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '400px',
        color: '#10b981'
      }}>
        <div>Loading call planning...</div>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px' }}>
      {/* Header */}
      <div style={{
        marginBottom: '30px',
        borderBottom: '2px solid #10b981',
        paddingBottom: '20px'
      }}>
        <h1 style={{ color: '#10b981', marginBottom: '10px' }}>
          📞 Call Planning System
        </h1>
        
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <TabButton 
            active={view === 'dashboard'} 
            onClick={() => setView('dashboard')}
          >
            📊 Dashboard
          </TabButton>
          <TabButton 
            active={view === 'templates'} 
            onClick={() => setView('templates')}
          >
            📋 Templates ({templates.length})
          </TabButton>
          <TabButton 
            active={view === 'assignments'} 
            onClick={() => setView('assignments')}
          >
            👥 Toewijzingen
          </TabButton>
          <TabButton 
            active={view === 'requests'} 
            onClick={() => setView('requests')}
          >
            🔔 Aanvragen ({requests.length})
          </TabButton>
        </div>
      </div>

      {/* Content Area */}
      <div style={{ minHeight: '500px' }}>
        {view === 'dashboard' && (
          <DashboardView 
            templates={templates}
            plans={plans}
            requests={requests}
          />
        )}
        
        {view === 'templates' && (
          <TemplatesView 
            templates={templates}
            onRefresh={loadAllData}
            onEdit={(template) => {
              setSelectedItem(template)
              setShowModal('editTemplate')
            }}
            onCreate={() => setShowModal('createTemplate')}
          />
        )}
        
        {view === 'assignments' && (
          <AssignmentsView
            clients={clients}
            templates={templates}
            plans={plans}
            onRefresh={loadAllData}
          />
        )}
        
        {view === 'requests' && (
          <RequestsView
            requests={requests}
            onRefresh={loadAllData}
          />
        )}
      </div>

      {/* Modals */}
      {showModal === 'createTemplate' && (
        <CreateTemplateModal
          onClose={() => setShowModal(null)}
          onSave={() => {
            loadAllData()
            setShowModal(null)
          }}
        />
      )}
      
      {showModal === 'editTemplate' && selectedItem && (
        <CreateTemplateModal
          template={selectedItem}
          onClose={() => {
            setShowModal(null)
            setSelectedItem(null)
          }}
          onSave={() => {
            loadAllData()
            setShowModal(null)
            setSelectedItem(null)
          }}
        />
      )}
    </div>
  )
}

// ============================================
// DASHBOARD VIEW - UPDATED WITH CALL ACTIVITIES
// ============================================
function DashboardView({ templates, plans, requests }) {
  const [upcomingCalls, setUpcomingCalls] = useState([])
  const [recentCalls, setRecentCalls] = useState([])
  
  useEffect(() => {
    processCallData()
  }, [plans])

  const processCallData = () => {
    const now = new Date()
    const allCalls = []
    
    // Collect all calls from all plans
    plans.forEach(plan => {
      if (plan.client_calls) {
        plan.client_calls.forEach(call => {
          allCalls.push({
            ...call,
            client_name: plan.clients?.name || plan.clients?.full_name || `Client ${plan.client_id?.substring(0, 8)}`,
            template_name: plan.call_templates?.template_name || 'Call Plan'
          })
        })
      }
    })

    // Filter upcoming scheduled calls
    const upcoming = allCalls
      .filter(call => call.status === 'scheduled' && new Date(call.scheduled_date) > now)
      .sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date))
      .slice(0, 5) // Next 5 calls

    // Filter recently completed calls
    const recent = allCalls
      .filter(call => call.status === 'completed' && call.completed_date)
      .sort((a, b) => new Date(b.completed_date) - new Date(a.completed_date))
      .slice(0, 5) // Last 5 completed

    setUpcomingCalls(upcoming)
    setRecentCalls(recent)
  }

  const stats = {
    totalTemplates: templates.length,
    activePlans: plans.filter(p => p.status === 'active').length,
    completedCalls: plans.reduce((sum, p) => 
      sum + (p.client_calls?.filter(c => c.status === 'completed').length || 0), 0
    ),
    pendingRequests: requests.length,
    scheduledCalls: plans.reduce((sum, p) => 
      sum + (p.client_calls?.filter(c => c.status === 'scheduled').length || 0), 0
    ),
    totalClients: [...new Set(plans.map(p => p.client_id))].length
  }

  // Get today's calls
  const todaysCalls = upcomingCalls.filter(call => {
    const callDate = new Date(call.scheduled_date)
    const today = new Date()
    return callDate.toDateString() === today.toDateString()
  })

  return (
    <div>
      <h2 style={{ color: 'white', marginBottom: '20px' }}>Dashboard Overview</h2>
      
      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        <StatCard
          title="Templates"
          value={stats.totalTemplates}
          color="#10b981"
        />
        <StatCard
          title="Actieve Plannen"
          value={stats.activePlans}
          color="#3b82f6"
        />
        <StatCard
          title="Clients met Plan"
          value={stats.totalClients}
          color="#8b5cf6"
        />
        <StatCard
          title="Geplande Calls"
          value={stats.scheduledCalls}
          color="#f59e0b"
        />
        <StatCard
          title="Voltooide Calls"
          value={stats.completedCalls}
          color="#6b7280"
        />
        <StatCard
          title="Open Aanvragen"
          value={stats.pendingRequests}
          color="#ef4444"
          highlight={stats.pendingRequests > 0}
        />
      </div>

      {/* Today's Calls Alert */}
      {todaysCalls.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '30px',
          color: 'white'
        }}>
          <h3 style={{ marginBottom: '15px' }}>🔔 Vandaag's Calls ({todaysCalls.length})</h3>
          {todaysCalls.map(call => (
            <div key={call.id} style={{
              background: 'rgba(255,255,255,0.1)',
              padding: '10px',
              borderRadius: '6px',
              marginBottom: '10px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>
                <strong>{new Date(call.scheduled_date).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}</strong>
                {' - '}
                {call.client_name}
              </span>
              <span style={{ fontSize: '14px', opacity: 0.9 }}>
                {call.call_title}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Activity Sections in Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '20px'
      }}>
        {/* Upcoming Calls */}
        <div style={{
          background: '#1a1a1a',
          padding: '20px',
          borderRadius: '8px'
        }}>
          <h3 style={{ color: '#10b981', marginBottom: '15px' }}>
            📅 Komende Calls
          </h3>
          {upcomingCalls.length === 0 ? (
            <p style={{ color: '#666' }}>Geen geplande calls</p>
          ) : (
            upcomingCalls.map(call => (
              <div key={call.id} style={{
                padding: '12px',
                borderBottom: '1px solid #333',
                display: 'flex',
                flexDirection: 'column',
                gap: '5px'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ color: 'white', fontWeight: 'bold' }}>
                    {call.client_name}
                  </span>
                  <span style={{ 
                    color: '#10b981', 
                    fontSize: '14px',
                    background: 'rgba(16, 185, 129, 0.1)',
                    padding: '2px 8px',
                    borderRadius: '4px'
                  }}>
                    {new Date(call.scheduled_date).toLocaleDateString('nl-NL')}
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ color: '#999', fontSize: '14px' }}>
                    {call.call_title}
                  </span>
                  <span style={{ color: '#666', fontSize: '12px' }}>
                    {new Date(call.scheduled_date).toLocaleTimeString('nl-NL', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                </div>
                {call.zoom_link && (
                  <a href={call.zoom_link} 
                     target="_blank" 
                     rel="noopener noreferrer"
                     style={{ 
                       color: '#3b82f6', 
                       fontSize: '12px',
                       textDecoration: 'none'
                     }}>
                    🔗 Zoom Link
                  </a>
                )}
              </div>
            ))
          )}
        </div>

        {/* Recent Activity */}
        <div style={{
          background: '#1a1a1a',
          padding: '20px',
          borderRadius: '8px'
        }}>
          <h3 style={{ color: '#10b981', marginBottom: '15px' }}>
            ✅ Recent Voltooide Calls
          </h3>
          {recentCalls.length === 0 ? (
            <p style={{ color: '#666' }}>Nog geen voltooide calls</p>
          ) : (
            recentCalls.map(call => (
              <div key={call.id} style={{
                padding: '12px',
                borderBottom: '1px solid #333',
                display: 'flex',
                flexDirection: 'column',
                gap: '5px'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ color: 'white', fontWeight: 'bold' }}>
                    {call.client_name}
                  </span>
                  <span style={{ 
                    color: '#6b7280', 
                    fontSize: '14px'
                  }}>
                    {new Date(call.completed_date).toLocaleDateString('nl-NL')}
                  </span>
                </div>
                <span style={{ color: '#999', fontSize: '14px' }}>
                  {call.call_title}
                </span>
                {call.coach_notes && (
                  <span style={{ 
                    color: '#666', 
                    fontSize: '12px',
                    fontStyle: 'italic'
                  }}>
                    "{call.coach_notes}"
                  </span>
                )}
              </div>
            ))
          )}
        </div>

        {/* Pending Requests */}
        <div style={{
          background: '#1a1a1a',
          padding: '20px',
          borderRadius: '8px'
        }}>
          <h3 style={{ color: '#ef4444', marginBottom: '15px' }}>
            🔔 Openstaande Aanvragen
          </h3>
          {requests.length === 0 ? (
            <p style={{ color: '#666' }}>Geen openstaande aanvragen</p>
          ) : (
            requests.slice(0, 5).map(request => (
              <div key={request.id} style={{
                padding: '12px',
                borderBottom: '1px solid #333',
                display: 'flex',
                flexDirection: 'column',
                gap: '5px'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ color: 'white', fontWeight: 'bold' }}>
                    {request.clients?.full_name || request.clients?.name}
                  </span>
                  <span style={{
                    background: request.urgency === 'urgent' ? '#ef4444' : '#f59e0b',
                    color: 'white',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}>
                    {request.urgency}
                  </span>
                </div>
                <span style={{ color: '#999', fontSize: '14px' }}>
                  {request.reason}
                </span>
                <span style={{ color: '#666', fontSize: '12px' }}>
                  {new Date(request.created_at).toLocaleDateString('nl-NL')}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Recent Plans */}
        <div style={{
          background: '#1a1a1a',
          padding: '20px',
          borderRadius: '8px'
        }}>
          <h3 style={{ color: '#10b981', marginBottom: '15px' }}>
            📋 Recent Toegewezen Plannen
          </h3>
          {plans.slice(0, 5).map(plan => (
            <div key={plan.id} style={{
              padding: '12px',
              borderBottom: '1px solid #333',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ color: 'white' }}>
                {plan.clients?.name || plan.clients?.full_name || `Client ${plan.client_id?.substring(0, 8)}`}
              </span>
              <span style={{ color: '#999', fontSize: '14px' }}>
                {plan.call_templates?.template_name || 'Call Plan'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ============================================
// TEMPLATES VIEW
// ============================================
function TemplatesView({ templates, onRefresh, onCreate, onEdit }) {
  // Standaard 6-Call Transformatie Template
  const createStandardTemplate = async () => {
    const standardTemplate = {
      template_name: '6 Calls Transformatie Programma',
      description: 'Complete begeleiding van intake tot eindresultaat - MY ARC standaard programma',
      total_calls: 6,
      bonus_calls_allowed: 2,
      items: [
        {
          call_title: 'Kennismaking + Doelstelling',
          client_subject: 'We gaan kennismaken, je doelen bespreken en kijken wat jij wilt bereiken met MY ARC',
          coach_subject: 'Basisgegevens noteren, Client hub invullen, Doelen: wat wil bereiken/waarom/gevoel/motivatie, Workout info: ervaring/voorkeuren/frequentie, Meal plan info: dieet ervaring/wensen/budget, Accountability bespreken, Uitleg programma + app + systeem',
          calendly_link: '',
          week_number: 1
        },
        {
          call_title: 'Persoonlijk Plan Call 1',
          client_subject: 'Je persoonlijke workout en nutrition plan bespreken en doelen vaststellen',
          coach_subject: 'Persoonlijk doelen systeem presenteren, Workout plan pitchen (wat/hoe/waarom/planning/ondersteuning), Maaltijden plan uitleggen + app demo, Volgende call inplannen, Implementatie bespreken',
          calendly_link: '',
          week_number: 2
        },
        {
          call_title: 'Persoonlijk Plan Call 2',
          client_subject: 'Reflectie op eerste weken, mindset coaching en implementatie strategieën',
          coach_subject: 'Reflecteren op afgelopen tijd (feedback/aanpassingen), Mindset lessen (consistentie tips + motivatie), Implementatie tricks bespreken, Nieuwe afspraken maken, Progressie call inplannen',
          calendly_link: '',
          week_number: 4
        },
        {
          call_title: 'Halfway Progressie Call',
          client_subject: 'Tussentijdse evaluatie van je voortgang en eventuele aanpassingen',
          coach_subject: 'Progressie bespreken (metrics/data/doelen check), Nieuwe doelen/aanpak bijstellen indien nodig, Mindset en overtuigingen evalueren, Feedback implementeren, Final sprint call inplannen',
          calendly_link: '',
          week_number: 6
        },
        {
          call_title: 'Final Sprint',
          client_subject: 'De laatste push naar je doel met aangepast plan voor maximaal resultaat',
          coach_subject: 'Final sprint plan maken/bijstellen, Motiveren voor extra inzet, Reflecteren op geleerde lessen, Implementatie nieuw plan, Hit the goal call inplannen',
          calendly_link: '',
          week_number: 10
        },
        {
          call_title: 'Final Call - Goal Achieved',
          client_subject: 'Eindresultaat bespreken, vieren wat je bereikt hebt en vervolgstappen',
          coach_subject: 'Doel behaald bespreken, Reflecteren op traject (geleerd/leuk/niet leuk), Hit the goal cadeau, Hoe nu verder (abonnement/nieuw traject), Nieuwe service afsluiten',
          calendly_link: '',
          week_number: 12
        }
      ]
    }

    try {
      await CallPlanningService.createTemplate(standardTemplate)
      alert('Standaard 6-Call Template aangemaakt!')
      onRefresh()
    } catch (error) {
      alert('Error: ' + error.message)
    }
  }

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h2 style={{ color: 'white' }}>Call Templates</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={createStandardTemplate}
            style={{
              background: '#8b5cf6',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            ⚡ Quick: 6-Call Standaard
          </button>
          <button
            onClick={onCreate}
            style={{
              background: '#10b981',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            ➕ Nieuw Template
          </button>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '20px'
      }}>
        {templates.map(template => (
          <TemplateCard
            key={template.id}
            template={template}
            onEdit={() => onEdit(template)}
            onDelete={async () => {
              if (confirm('Weet je zeker dat je dit template wilt verwijderen?')) {
                await CallPlanningService.deleteTemplate(template.id)
                onRefresh()
              }
            }}
          />
        ))}
      </div>

      {templates.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '60px',
          color: '#666'
        }}>
          <p>Nog geen templates aangemaakt</p>
          <p>Klik op "Nieuw Template" om te beginnen</p>
        </div>
      )}
    </div>
  )
}

// ============================================
// ASSIGNMENTS VIEW - UPDATED WITH NAMES
// ============================================
function AssignmentsView({ clients = [], templates = [], plans = [], onRefresh }) {
  const [selectedClient, setSelectedClient] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [assigning, setAssigning] = useState(false)
  const [showCallManager, setShowCallManager] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(null)

  const handleAssign = async () => {
    if (!selectedClient || !selectedTemplate) {
      alert('Selecteer een client en template')
      return
    }

    setAssigning(true)
    try {
      await CallPlanningService.assignTemplateToClient(selectedClient, selectedTemplate)
      alert('Template succesvol toegewezen!')
      setSelectedClient('')
      setSelectedTemplate('')
      onRefresh()
    } catch (error) {
      alert('Error: ' + error.message)
    }
    setAssigning(false)
  }

  // Group plans by client - with null check
  const clientPlans = {}
  if (plans && Array.isArray(plans)) {
    plans.forEach(plan => {
      if (!clientPlans[plan.client_id]) {
        clientPlans[plan.client_id] = []
      }
      clientPlans[plan.client_id].push(plan)
    })
  }

  // Get client name helper - UPDATED for various field names
  const getClientName = (plan) => {
    // First check if plan has clients data
    if (plan.clients) {
      return plan.clients.full_name || 
             plan.clients.name || 
             plan.clients.first_name || 
             plan.clients.last_name ||
             plan.clients.email || 
             `Client ${plan.client_id?.substring(0, 8)}`
    }
    
    // Try to find client in clients array
    const client = clients.find(c => c.id === plan.client_id)
    if (client) {
      return client.full_name || 
             client.name || 
             client.first_name || 
             client.last_name ||
             client.email || 
             `Client ${plan.client_id?.substring(0, 8)}`
    }
    
    // Fallback
    return `Client ${plan.client_id?.substring(0, 8)}`
  }

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h2 style={{ color: 'white' }}>Template Toewijzen</h2>
        {plans.length > 0 && (
          <button
            onClick={() => setShowCallManager(!showCallManager)}
            style={{
              background: '#8b5cf6',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            📅 {showCallManager ? 'Terug naar Toewijzingen' : 'Beheer Calls'}
          </button>
        )}
      </div>

      {!showCallManager ? (
        <>
          {/* Assignment Form */}
          <div style={{
            background: '#1a1a1a',
            padding: '30px',
            borderRadius: '8px',
            marginBottom: '30px'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr auto',
              gap: '15px',
              alignItems: 'end'
            }}>
              <div>
                <label style={{ color: '#999', display: 'block', marginBottom: '5px' }}>
                  Selecteer Client
                </label>
                <select
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: '#0f0f0f',
                    color: 'white',
                    border: '1px solid #333',
                    borderRadius: '4px'
                  }}
                >
                  <option value="">-- Kies een client --</option>
                  {clients && clients.length > 0 ? (
                    clients.map(client => (
                      <option key={client.id} value={client.id}>
                        {client.full_name || client.name || client.email || `Client ${client.id?.substring(0, 8)}`}
                        {clientPlans[client.id] && ` (heeft al ${clientPlans[client.id].length} plan)`}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>Geen clients beschikbaar</option>
                  )}
                </select>
              </div>

              <div>
                <label style={{ color: '#999', display: 'block', marginBottom: '5px' }}>
                  Selecteer Template
                </label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: '#0f0f0f',
                    color: 'white',
                    border: '1px solid #333',
                    borderRadius: '4px'
                  }}
                >
                  <option value="">-- Kies een template --</option>
                  {templates && templates.length > 0 ? (
                    templates.map(template => (
                      <option key={template.id} value={template.id}>
                        {template.template_name} ({template.total_calls} calls)
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>Geen templates beschikbaar</option>
                  )}
                </select>
              </div>

              <button
                onClick={handleAssign}
                disabled={assigning || !selectedClient || !selectedTemplate}
                style={{
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  padding: '10px 30px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  opacity: assigning || !selectedClient || !selectedTemplate ? 0.5 : 1
                }}
              >
                {assigning ? 'Bezig...' : 'Toewijzen'}
              </button>
            </div>

            {/* Help text */}
            {(!clients || clients.length === 0) && (
              <p style={{ color: '#ef4444', marginTop: '15px' }}>
                ⚠️ Geen clients gevonden. Zorg eerst dat je clients hebt aangemaakt.
              </p>
            )}
            {(!templates || templates.length === 0) && (
              <p style={{ color: '#ef4444', marginTop: '15px' }}>
                ⚠️ Geen templates gevonden. Maak eerst een template aan.
              </p>
            )}
          </div>

          {/* Active Plans */}
          <h3 style={{ color: 'white', marginBottom: '15px' }}>
            Actieve Call Plannen
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '15px'
          }}>
            {plans && plans.length > 0 ? (
              plans.filter(p => p.status === 'active').map(plan => (
                <PlanCard 
                  key={plan.id} 
                  plan={plan} 
                  clientName={getClientName(plan)}
                  onManage={() => {
                    setSelectedPlan(plan)
                    setShowCallManager(true)
                  }}
                />
              ))
            ) : (
              <div style={{
                gridColumn: '1 / -1',
                textAlign: 'center',
                padding: '40px',
                background: '#1a1a1a',
                borderRadius: '8px',
                color: '#666'
              }}>
                <p>Nog geen actieve call plannen</p>
                <p style={{ fontSize: '14px', marginTop: '10px' }}>
                  Wijs een template toe aan een client om te beginnen
                </p>
              </div>
            )}
          </div>
        </>
      ) : (
        <CallManagementView 
          plans={plans}
          clients={clients}
          selectedPlan={selectedPlan}
          onRefresh={onRefresh}
          onBack={() => {
            setShowCallManager(false)
            setSelectedPlan(null)
          }}
        />
      )}
    </div>
  )
}

// ============================================
// NEW: CALL MANAGEMENT VIEW FOR COACHES
// ============================================
function CallManagementView({ plans = [], clients = [], selectedPlan, onRefresh, onBack }) {
  const [loading, setLoading] = useState(false)
  const [calls, setCalls] = useState([])
  const [filter, setFilter] = useState('all') // all, scheduled, pending, completed

  useEffect(() => {
    loadCallsForAllPlans()
  }, [plans])

  const loadCallsForAllPlans = async () => {
    setLoading(true)
    try {
      const allCalls = []
      
      for (const plan of plans) {
        if (plan.client_calls && plan.client_calls.length > 0) {
          const clientName = getClientName(plan)
          
          plan.client_calls.forEach(call => {
            allCalls.push({
              ...call,
              plan_id: plan.id,
              client_id: plan.client_id,
              client_name: clientName,
              template_name: plan.call_templates?.template_name || plan.template_name
            })
          })
        }
      }
      
      // Sort by date (scheduled first, then by call number)
      allCalls.sort((a, b) => {
        if (a.scheduled_date && b.scheduled_date) {
          return new Date(a.scheduled_date) - new Date(b.scheduled_date)
        }
        if (a.scheduled_date) return -1
        if (b.scheduled_date) return 1
        return a.call_number - b.call_number
      })
      
      setCalls(allCalls)
    } catch (error) {
      console.error('Error loading calls:', error)
    }
    setLoading(false)
  }

  const getClientName = (plan) => {
    const client = clients.find(c => c.id === plan.client_id)
    if (client) return client.name || client.full_name || client.email
    return plan.clients?.name || plan.clients?.full_name || `Client ${plan.client_id?.substring(0, 8)}`
  }

  const handleCompleteCall = async (call) => {
    if (!confirm(`Wil je deze call als voltooid markeren?\n\nClient: ${call.client_name}\nCall: ${call.call_title}`)) {
      return
    }

    try {
      const notes = prompt('Voeg notities toe (optioneel):')
      await CallPlanningService.completeCall(call.id, notes || 'Call voltooid door coach')
      alert('Call gemarkeerd als voltooid!')
      onRefresh()
      loadCallsForAllPlans()
    } catch (error) {
      alert('Error: ' + error.message)
    }
  }

  const handleCancelCall = async (call) => {
    if (!confirm(`Wil je deze call annuleren?\n\nClient: ${call.client_name}\nCall: ${call.call_title}`)) {
      return
    }

    try {
      const reason = prompt('Reden voor annulering:')
      if (reason) {
        await CallPlanningService.cancelCall(call.id, reason)
        alert('Call geannuleerd')
        onRefresh()
        loadCallsForAllPlans()
      }
    } catch (error) {
      alert('Error: ' + error.message)
    }
  }

  const filteredCalls = calls.filter(call => {
    if (filter === 'all') return true
    if (filter === 'scheduled') return call.status === 'scheduled'
    if (filter === 'pending') return call.status === 'available'
    if (filter === 'completed') return call.status === 'completed'
    return true
  })

  if (loading) {
    return <div style={{ color: 'white', textAlign: 'center', padding: '40px' }}>Loading calls...</div>
  }

  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h2 style={{ color: 'white' }}>📅 Call Management</h2>
        <button
          onClick={onBack}
          style={{
            background: '#333',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          ← Terug
        </button>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        {['all', 'scheduled', 'pending', 'completed'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '8px 16px',
              background: filter === f ? '#10b981' : '#333',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              textTransform: 'capitalize'
            }}
          >
            {f === 'all' && 'Alle Calls'}
            {f === 'scheduled' && '📅 Gepland'}
            {f === 'pending' && '⏳ Beschikbaar'}
            {f === 'completed' && '✅ Voltooid'}
            {' '}({filteredCalls.filter(c => f === 'all' || c.status === f).length})
          </button>
        ))}
      </div>

      {/* Calls List */}
      <div style={{ display: 'grid', gap: '15px' }}>
        {filteredCalls.length === 0 ? (
          <div style={{
            background: '#1a1a1a',
            padding: '40px',
            borderRadius: '8px',
            textAlign: 'center',
            color: '#666'
          }}>
            Geen calls gevonden
          </div>
        ) : (
          filteredCalls.map(call => (
            <CallManagementCard
              key={call.id}
              call={call}
              onComplete={() => handleCompleteCall(call)}
              onCancel={() => handleCancelCall(call)}
            />
          ))
        )}
      </div>

      {/* Upcoming Calls Summary */}
      <div style={{
        marginTop: '30px',
        background: '#1a1a1a',
        padding: '20px',
        borderRadius: '8px'
      }}>
        <h3 style={{ color: '#10b981', marginBottom: '15px' }}>
          📅 Komende Calls Deze Week
        </h3>
        {filteredCalls
          .filter(c => {
            if (!c.scheduled_date) return false
            const callDate = new Date(c.scheduled_date)
            const now = new Date()
            const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
            return callDate >= now && callDate <= weekFromNow
          })
          .map(call => (
            <div key={call.id} style={{
              padding: '10px',
              borderBottom: '1px solid #333',
              display: 'flex',
              justifyContent: 'space-between'
            }}>
              <span style={{ color: 'white' }}>
                {new Date(call.scheduled_date).toLocaleDateString('nl-NL')} - {call.client_name}
              </span>
              <span style={{ color: '#999', fontSize: '14px' }}>
                {call.call_title}
              </span>
            </div>
          ))}
      </div>
    </div>
  )
}

// ============================================
// CALL MANAGEMENT CARD
// ============================================
function CallManagementCard({ call, onComplete, onCancel }) {
  const statusColors = {
    scheduled: '#3b82f6',
    available: '#f59e0b',
    completed: '#6b7280',
    locked: '#666',
    cancelled: '#ef4444'
  }

  return (
    <div style={{
      background: '#1a1a1a',
      padding: '20px',
      borderRadius: '8px',
      borderLeft: `4px solid ${statusColors[call.status] || '#333'}`,
      display: 'grid',
      gridTemplateColumns: '1fr auto',
      gap: '20px',
      alignItems: 'center'
    }}>
      <div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'start',
          marginBottom: '10px'
        }}>
          <h4 style={{ color: 'white', margin: 0 }}>
            {call.client_name}
          </h4>
          <span style={{
            background: statusColors[call.status] || '#333',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            textTransform: 'capitalize'
          }}>
            {call.status}
          </span>
        </div>
        
        <p style={{ color: '#999', marginBottom: '5px' }}>
          Call #{call.call_number}: {call.call_title}
        </p>
        
        {call.scheduled_date && (
          <p style={{ color: '#10b981', fontSize: '14px' }}>
            📅 {new Date(call.scheduled_date).toLocaleString('nl-NL')}
          </p>
        )}
        
        {call.calendly_link && (
          <a 
            href={call.calendly_link}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#3b82f6',
              fontSize: '14px',
              textDecoration: 'none'
            }}
          >
            🔗 Calendly Link
          </a>
        )}
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        {call.status === 'scheduled' && (
          <>
            <button
              onClick={onComplete}
              style={{
                padding: '8px 16px',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
              title="Markeer als voltooid"
            >
              ✅
            </button>
            <button
              onClick={onCancel}
              style={{
                padding: '8px 16px',
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
              title="Annuleer call"
            >
              ❌
            </button>
          </>
        )}
        
        {call.status === 'available' && (
          <button
            onClick={onComplete}
            style={{
              padding: '8px 16px',
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
            title="Markeer als voltooid (zonder planning)"
          >
            Direct Voltooien
          </button>
        )}
      </div>
    </div>
  )
}

// ============================================
// REQUESTS VIEW
// ============================================
function RequestsView({ requests, onRefresh }) {
  const [processing, setProcessing] = useState(null)

  const handleApprove = async (request) => {
    setProcessing(request.id)
    try {
      await CallPlanningService.approveRequest(request.id, 'Goedgekeurd door coach')
      onRefresh()
    } catch (error) {
      alert('Error: ' + error.message)
    }
    setProcessing(null)
  }

  const handleReject = async (request) => {
    const reason = prompt('Reden voor afwijzing:')
    if (!reason) return

    setProcessing(request.id)
    try {
      await CallPlanningService.rejectRequest(request.id, reason)
      onRefresh()
    } catch (error) {
      alert('Error: ' + error.message)
    }
    setProcessing(null)
  }

  return (
    <div>
      <h2 style={{ color: 'white', marginBottom: '20px' }}>
        Call Aanvragen ({requests.length})
      </h2>

      {requests.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px',
          color: '#666'
        }}>
          <p>Geen openstaande aanvragen</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gap: '15px'
        }}>
          {requests.map(request => (
            <RequestCard
              key={request.id}
              request={request}
              onApprove={() => handleApprove(request)}
              onReject={() => handleReject(request)}
              processing={processing === request.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================
// CREATE/EDIT TEMPLATE MODAL
// ============================================
function CreateTemplateModal({ template = null, onClose, onSave }) {
  const [name, setName] = useState(template?.template_name || '')
  const [description, setDescription] = useState(template?.description || '')
  const [totalCalls, setTotalCalls] = useState(template?.total_calls || 6)
  const [bonusCalls, setBonusCalls] = useState(template?.bonus_calls_allowed || 2)
  const [calls, setCalls] = useState([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    // Initialize calls
    const initialCalls = []
    for (let i = 0; i < totalCalls; i++) {
      initialCalls.push({
        number: i + 1,
        title: template?.call_template_items?.[i]?.call_title || '',
        clientSubject: template?.call_template_items?.[i]?.client_subject || '',
        coachSubject: template?.call_template_items?.[i]?.coach_subject || '',
        calendlyLink: template?.call_template_items?.[i]?.calendly_link || '',
        week: template?.call_template_items?.[i]?.week_number || i + 1
      })
    }
    setCalls(initialCalls)
  }, [totalCalls, template])

  const updateCall = (index, field, value) => {
    const newCalls = [...calls]
    newCalls[index][field] = value
    setCalls(newCalls)
  }

  const handleSave = async () => {
    if (!name) {
      alert('Template naam is verplicht')
      return
    }

    setSaving(true)
    try {
      const templateData = {
        template_name: name,
        description,
        total_calls: totalCalls,
        bonus_calls_allowed: bonusCalls,
        items: calls.map(call => ({
          call_title: call.title,
          client_subject: call.clientSubject,
          coach_subject: call.coachSubject,
          calendly_link: call.calendlyLink,
          week_number: call.week
        }))
      }

      if (template) {
        await CallPlanningService.updateTemplate(template.id, templateData)
      } else {
        await CallPlanningService.createTemplate(templateData)
      }
      
      onSave()
    } catch (error) {
      alert('Error: ' + error.message)
    }
    setSaving(false)
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.8)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: '#0f0f0f',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '900px',
        maxHeight: '90vh',
        overflow: 'auto',
        border: '2px solid #10b981'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #333',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ color: '#10b981', margin: 0 }}>
            {template ? 'Template Bewerken' : 'Nieuw Call Template'}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#999',
              fontSize: '24px',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px' }}>
          {/* Basic Info */}
          <div style={{ marginBottom: '30px' }}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ color: '#999', display: 'block', marginBottom: '5px' }}>
                Template Naam *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Bijv: 6 Calls Transformatie Programma"
                style={{
                  width: '100%',
                  padding: '10px',
                  background: '#1a1a1a',
                  color: 'white',
                  border: '1px solid #333',
                  borderRadius: '4px'
                }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ color: '#999', display: 'block', marginBottom: '5px' }}>
                Beschrijving
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Korte beschrijving van het programma"
                rows="3"
                style={{
                  width: '100%',
                  padding: '10px',
                  background: '#1a1a1a',
                  color: 'white',
                  border: '1px solid #333',
                  borderRadius: '4px'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label style={{ color: '#999', display: 'block', marginBottom: '5px' }}>
                  Aantal Calls
                </label>
                <input
                  type="number"
                  value={totalCalls}
                  onChange={(e) => setTotalCalls(parseInt(e.target.value) || 1)}
                  min="1"
                  max="12"
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: '#1a1a1a',
                    color: 'white',
                    border: '1px solid #333',
                    borderRadius: '4px'
                  }}
                />
              </div>
              <div>
                <label style={{ color: '#999', display: 'block', marginBottom: '5px' }}>
                  Bonus Calls Toegestaan
                </label>
                <input
                  type="number"
                  value={bonusCalls}
                  onChange={(e) => setBonusCalls(parseInt(e.target.value) || 0)}
                  min="0"
                  max="10"
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: '#1a1a1a',
                    color: 'white',
                    border: '1px solid #333',
                    borderRadius: '4px'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Calls Configuration */}
          <div>
            <h3 style={{ color: '#10b981', marginBottom: '15px' }}>
              Call Details
            </h3>
            
            <div style={{ display: 'grid', gap: '15px' }}>
              {calls.map((call, index) => (
                <div
                  key={index}
                  style={{
                    background: '#1a1a1a',
                    padding: '15px',
                    borderRadius: '8px',
                    border: '1px solid #333'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '10px'
                  }}>
                    <span style={{
                      color: '#10b981',
                      fontWeight: 'bold',
                      fontSize: '16px'
                    }}>
                      Call #{call.number}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span style={{ color: '#999' }}>Week:</span>
                      <input
                        type="number"
                        value={call.week}
                        onChange={(e) => updateCall(index, 'week', parseInt(e.target.value) || 1)}
                        min="1"
                        style={{
                          width: '50px',
                          padding: '5px',
                          background: '#0f0f0f',
                          color: 'white',
                          border: '1px solid #333',
                          borderRadius: '4px'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gap: '10px' }}>
                    <input
                      type="text"
                      placeholder="Call Titel"
                      value={call.title}
                      onChange={(e) => updateCall(index, 'title', e.target.value)}
                      style={{
                        padding: '8px',
                        background: '#0f0f0f',
                        color: 'white',
                        border: '1px solid #333',
                        borderRadius: '4px'
                      }}
                    />
                    
                    <textarea
                      placeholder="Onderwerp voor Client"
                      value={call.clientSubject}
                      onChange={(e) => updateCall(index, 'clientSubject', e.target.value)}
                      rows="2"
                      style={{
                        padding: '8px',
                        background: '#0f0f0f',
                        color: 'white',
                        border: '1px solid #333',
                        borderRadius: '4px'
                      }}
                    />
                    
                    <textarea
                      placeholder="Coach Notities (intern)"
                      value={call.coachSubject}
                      onChange={(e) => updateCall(index, 'coachSubject', e.target.value)}
                      rows="2"
                      style={{
                        padding: '8px',
                        background: '#0f0f0f',
                        color: 'white',
                        border: '1px solid #333',
                        borderRadius: '4px'
                      }}
                    />
                    
                    <input
                      type="text"
                      placeholder="Calendly Link (optioneel)"
                      value={call.calendlyLink}
                      onChange={(e) => updateCall(index, 'calendlyLink', e.target.value)}
                      style={{
                        padding: '8px',
                        background: '#0f0f0f',
                        color: 'white',
                        border: '1px solid #333',
                        borderRadius: '4px'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '20px',
          borderTop: '1px solid #333',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '10px'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              background: '#333',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Annuleren
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !name}
            style={{
              padding: '10px 20px',
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              opacity: saving || !name ? 0.5 : 1
            }}
          >
            {saving ? 'Opslaan...' : 'Template Opslaan'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// CLIENT COMPONENTS
// ============================================
export function ClientCallTimeline({ db, clientInfo }) {
  const [plans, setPlans] = useState([])
  const [activePlan, setActivePlan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showRequestModal, setShowRequestModal] = useState(false)

  useEffect(() => {
    loadClientPlans()
  }, [clientInfo])

  const loadClientPlans = async () => {
    setLoading(true)
    try {
      // Try multiple ways to get the client ID
      let clientId = clientInfo?.id
      
      // If no clientInfo, try to get current user as client
      if (!clientId) {
        console.log('No clientInfo provided, trying to get current user as client')
        
        // Get current user
        const { createClient } = await import('@supabase/supabase-js')
        const supabase = createClient(
          import.meta.env.VITE_SUPABASE_URL,
          import.meta.env.VITE_SUPABASE_ANON_KEY
        )
        
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          // Check if user ID is directly the client ID
          clientId = user.id
          console.log('Using user ID as client ID:', clientId)
        }
      }
      
      if (!clientId) {
        console.log('Still no client ID found')
        setLoading(false)
        return
      }

      const plansData = await CallPlanningService.getClientPlans(clientId)
      console.log('Plans loaded for client:', plansData)
      
      setPlans(plansData || [])
      const active = plansData?.find(p => p.status === 'active')
      setActivePlan(active)
      
      if (active) {
        console.log('Active plan found:', active)
      } else {
        console.log('No active plan found')
      }
    } catch (error) {
      console.error('Error loading plans:', error)
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '400px',
        color: '#10b981'
      }}>
        <div>Loading calls...</div>
      </div>
    )
  }

  if (!activePlan) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '60px',
        color: '#666'
      }}>
        <h2 style={{ color: 'white', marginBottom: '20px' }}>
          Geen actief call programma
        </h2>
        <p>Je coach zal binnenkort een call programma voor je klaarzetten.</p>
      </div>
    )
  }

  const bonusCallsRemaining = (activePlan.call_templates?.bonus_calls_allowed || 0) - 
                               (activePlan.bonus_calls_used || 0)

  return (
    <div style={{ padding: '20px' }}>
      {/* Header */}
      <div style={{
        marginBottom: '30px',
        borderBottom: '2px solid #10b981',
        paddingBottom: '20px'
      }}>
        <h1 style={{ color: '#10b981', marginBottom: '10px' }}>
          🗓️ Mijn Coaching Calls
        </h1>
        <p style={{ color: '#999' }}>
          {activePlan.call_templates?.template_name}
        </p>
        {bonusCallsRemaining > 0 && (
          <p style={{ color: '#10b981', fontSize: '14px' }}>
            {bonusCallsRemaining} bonus call(s) beschikbaar
          </p>
        )}
      </div>

      {/* Timeline */}
      <div style={{ marginBottom: '30px' }}>
        {activePlan.client_calls?.sort((a, b) => a.call_number - b.call_number).map(call => (
          <CallTimelineItem
            key={call.id}
            call={call}
            onSchedule={() => loadClientPlans()}
          />
        ))}
      </div>

      {/* Request Bonus Call */}
      {bonusCallsRemaining > 0 && (
        <div style={{
          background: '#1a1a1a',
          padding: '30px',
          borderRadius: '8px',
          border: '2px dashed #10b981',
          textAlign: 'center'
        }}>
          <h3 style={{ color: 'white', marginBottom: '10px' }}>
            Extra Call Nodig?
          </h3>
          <p style={{ color: '#999', marginBottom: '20px' }}>
            Je hebt nog {bonusCallsRemaining} bonus call(s) beschikbaar
          </p>
          <button
            onClick={() => setShowRequestModal(true)}
            style={{
              background: '#10b981',
              color: 'white',
              border: 'none',
              padding: '10px 30px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            📞 Vraag Call Aan
          </button>
        </div>
      )}

      {/* Request Modal */}
      {showRequestModal && (
        <RequestCallModal
          clientId={clientInfo.id}
          planId={activePlan.id}
          onClose={() => setShowRequestModal(false)}
          onSubmit={() => {
            setShowRequestModal(false)
            loadClientPlans()
          }}
        />
      )}
    </div>
  )
}

// ============================================
// HELPER COMPONENTS
// ============================================

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '10px 20px',
        background: active ? '#10b981' : 'transparent',
        color: active ? 'white' : '#999',
        border: active ? 'none' : '1px solid #333',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '14px',
        transition: 'all 0.2s'
      }}
    >
      {children}
    </button>
  )
}

function StatCard({ title, value, color, highlight }) {
  return (
    <div style={{
      background: highlight ? color + '20' : '#1a1a1a',
      padding: '20px',
      borderRadius: '8px',
      border: highlight ? `2px solid ${color}` : '1px solid #333',
      textAlign: 'center'
    }}>
      <div style={{
        fontSize: '32px',
        fontWeight: 'bold',
        color: color,
        marginBottom: '5px'
      }}>
        {value}
      </div>
      <div style={{
        color: '#999',
        fontSize: '14px'
      }}>
        {title}
      </div>
    </div>
  )
}

function TemplateCard({ template, onEdit, onDelete }) {
  return (
    <div style={{
      background: '#1a1a1a',
      padding: '20px',
      borderRadius: '8px',
      border: '1px solid #333'
    }}>
      <h3 style={{ color: 'white', marginBottom: '10px' }}>
        {template.template_name}
      </h3>
      <p style={{ color: '#999', fontSize: '14px', marginBottom: '15px' }}>
        {template.description || 'Geen beschrijving'}
      </p>
      <div style={{
        display: 'flex',
        gap: '15px',
        marginBottom: '15px',
        color: '#666',
        fontSize: '14px'
      }}>
        <span>📞 {template.total_calls} calls</span>
        <span>🎁 {template.bonus_calls_allowed} bonus</span>
      </div>
      <div style={{
        display: 'flex',
        gap: '10px'
      }}>
        <button
          onClick={onEdit}
          style={{
            flex: 1,
            padding: '8px',
            background: '#333',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Bewerken
        </button>
        <button
          onClick={onDelete}
          style={{
            padding: '8px',
            background: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          🗑️
        </button>
      </div>
    </div>
  )
}

function PlanCard({ plan, clientName, onManage }) {
  // Calculate progress safely
  const totalCalls = plan.call_templates?.total_calls || plan.total_calls || 6
  const completedCalls = plan.client_calls?.filter(c => c.status === 'completed').length || 0
  const scheduledCalls = plan.client_calls?.filter(c => c.status === 'scheduled').length || 0
  const progress = totalCalls > 0 ? (completedCalls / totalCalls) * 100 : 0

  return (
    <div style={{
      background: '#1a1a1a',
      padding: '20px',
      borderRadius: '8px',
      border: '1px solid #333',
      position: 'relative'
    }}>
      <h4 style={{ color: 'white', marginBottom: '10px' }}>
        {clientName || `Client ${plan.client_id?.substring(0, 8)}`}
      </h4>
      <p style={{ color: '#999', fontSize: '14px', marginBottom: '15px' }}>
        {plan.call_templates?.template_name || plan.template_name || 'Call Plan'}
      </p>
      
      {/* Progress Bar */}
      <div style={{
        background: '#333',
        height: '8px',
        borderRadius: '4px',
        overflow: 'hidden',
        marginBottom: '10px'
      }}>
        <div style={{
          width: `${progress}%`,
          height: '100%',
          background: '#10b981',
          transition: 'width 0.3s'
        }} />
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
        <p style={{ color: '#666', fontSize: '12px' }}>
          {completedCalls} / {totalCalls} voltooid
        </p>
        {scheduledCalls > 0 && (
          <p style={{ color: '#3b82f6', fontSize: '12px' }}>
            📅 {scheduledCalls} gepland
          </p>
        )}
      </div>
      
      <p style={{ 
        color: plan.status === 'active' ? '#10b981' : '#666', 
        fontSize: '12px',
        marginBottom: '15px'
      }}>
        Status: {plan.status || 'active'}
      </p>

      {onManage && (
        <button
          onClick={onManage}
          style={{
            width: '100%',
            padding: '8px',
            background: '#333',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          📅 Beheer Calls
        </button>
      )}
    </div>
  )
}

function RequestCard({ request, onApprove, onReject, processing }) {
  return (
    <div style={{
      background: '#1a1a1a',
      padding: '20px',
      borderRadius: '8px',
      border: '1px solid #ef4444'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'start',
        marginBottom: '15px'
      }}>
        <h4 style={{ color: 'white' }}>
          {request.clients?.full_name}
        </h4>
        <span style={{
          background: request.urgency === 'urgent' ? '#ef4444' : '#f59e0b',
          color: 'white',
          padding: '2px 8px',
          borderRadius: '4px',
          fontSize: '12px'
        }}>
          {request.urgency}
        </span>
      </div>
      
      <p style={{ color: '#999', marginBottom: '10px' }}>
        <strong>Reden:</strong> {request.reason}
      </p>
      
      {request.requested_date && (
        <p style={{ color: '#666', fontSize: '14px', marginBottom: '15px' }}>
          Voorkeur: {request.requested_date} {request.requested_time || ''}
        </p>
      )}
      
      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={onApprove}
          disabled={processing}
          style={{
            flex: 1,
            padding: '8px',
            background: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            opacity: processing ? 0.5 : 1
          }}
        >
          Goedkeuren
        </button>
        <button
          onClick={onReject}
          disabled={processing}
          style={{
            flex: 1,
            padding: '8px',
            background: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            opacity: processing ? 0.5 : 1
          }}
        >
          Afwijzen
        </button>
      </div>
    </div>
  )
}

function CallTimelineItem({ call, onSchedule }) {
  const [scheduling, setScheduling] = useState(false)
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [notes, setNotes] = useState('')

  const handleSchedule = async () => {
    if (!date || !time) {
      alert('Selecteer datum en tijd')
      return
    }
    
    setScheduling(true)
    try {
      await CallPlanningService.scheduleCall(call.id, `${date}T${time}:00`, notes)
      onSchedule()
    } catch (error) {
      alert('Error: ' + error.message)
    }
    setScheduling(false)
  }

  const statusConfig = {
    locked: { icon: '🔒', color: '#666', label: 'Nog niet beschikbaar' },
    available: { icon: '👉', color: '#10b981', label: 'Beschikbaar om te plannen' },
    scheduled: { icon: '📅', color: '#3b82f6', label: 'Ingepland' },
    completed: { icon: '✅', color: '#6b7280', label: 'Voltooid' }
  }

  const config = statusConfig[call.status] || statusConfig.locked

  return (
    <div style={{
      display: 'flex',
      gap: '20px',
      padding: '20px',
      background: call.status === 'available' ? '#1a1a1a' : '#0f0f0f',
      borderRadius: '8px',
      borderLeft: `4px solid ${config.color}`,
      marginBottom: '15px',
      opacity: call.status === 'completed' ? 0.7 : 1
    }}>
      <div style={{
        fontSize: '24px',
        width: '40px',
        textAlign: 'center'
      }}>
        {config.icon}
      </div>
      
      <div style={{ flex: 1 }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '10px'
        }}>
          <h3 style={{ color: 'white', margin: 0 }}>
            Call #{call.call_number}: {call.call_title}
          </h3>
          <span style={{
            color: config.color,
            fontSize: '12px'
          }}>
            {config.label}
          </span>
        </div>

        {call.status === 'available' && (
          <div style={{
            background: '#0f0f0f',
            padding: '15px',
            borderRadius: '6px',
            marginTop: '15px'
          }}>
            <h4 style={{ color: '#10b981', marginBottom: '10px' }}>
              Plan deze call
            </h4>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '10px',
              marginBottom: '10px'
            }}>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                style={{
                  padding: '8px',
                  background: '#1a1a1a',
                  color: 'white',
                  border: '1px solid #333',
                  borderRadius: '4px'
                }}
              />
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                style={{
                  padding: '8px',
                  background: '#1a1a1a',
                  color: 'white',
                  border: '1px solid #333',
                  borderRadius: '4px'
                }}
              />
            </div>
            <textarea
              placeholder="Optionele notities..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows="2"
              style={{
                width: '100%',
                padding: '8px',
                background: '#1a1a1a',
                color: 'white',
                border: '1px solid #333',
                borderRadius: '4px',
                marginBottom: '10px'
              }}
            />
            <button
              onClick={handleSchedule}
              disabled={scheduling}
              style={{
                width: '100%',
                padding: '10px',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                opacity: scheduling ? 0.5 : 1
              }}
            >
              {scheduling ? 'Bezig...' : '📅 Plan Deze Call'}
            </button>
          </div>
        )}

        {call.status === 'scheduled' && call.scheduled_date && (
          <p style={{ color: '#3b82f6', marginTop: '10px' }}>
            Ingepland voor: {new Date(call.scheduled_date).toLocaleString('nl-NL')}
          </p>
        )}

        {call.status === 'completed' && call.completed_date && (
          <p style={{ color: '#666', marginTop: '10px' }}>
            Voltooid op: {new Date(call.completed_date).toLocaleDateString('nl-NL')}
          </p>
        )}

        {call.status === 'locked' && (
          <p style={{ color: '#666', marginTop: '10px', fontSize: '14px' }}>
            Deze call wordt beschikbaar na voltooiing van de vorige call.
          </p>
        )}
      </div>
    </div>
  )
}

function RequestCallModal({ clientId, planId, onClose, onSubmit }) {
  const [reason, setReason] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [urgency, setUrgency] = useState('normal')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!reason) {
      alert('Geef een reden op')
      return
    }

    setSubmitting(true)
    try {
      await CallPlanningService.submitCallRequest(clientId, planId, {
        reason,
        requested_date: date,
        requested_time: time,
        urgency
      })
      alert('Aanvraag verstuurd!')
      onSubmit()
    } catch (error) {
      alert('Error: ' + error.message)
    }
    setSubmitting(false)
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.8)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: '#0f0f0f',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '500px',
        border: '2px solid #10b981'
      }}>
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #333'
        }}>
          <h2 style={{ color: '#10b981', margin: 0 }}>
            Extra Call Aanvragen
          </h2>
        </div>

        <div style={{ padding: '20px' }}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ color: '#999', display: 'block', marginBottom: '5px' }}>
              Reden voor aanvraag *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Bijv: Extra uitleg nodig over workout schema"
              rows="3"
              style={{
                width: '100%',
                padding: '10px',
                background: '#1a1a1a',
                color: 'white',
                border: '1px solid #333',
                borderRadius: '4px'
              }}
            />
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '15px',
            marginBottom: '15px'
          }}>
            <div>
              <label style={{ color: '#999', display: 'block', marginBottom: '5px' }}>
                Voorkeur datum
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: '#1a1a1a',
                  color: 'white',
                  border: '1px solid #333',
                  borderRadius: '4px'
                }}
              />
            </div>
            <div>
              <label style={{ color: '#999', display: 'block', marginBottom: '5px' }}>
                Voorkeur tijd
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: '#1a1a1a',
                  color: 'white',
                  border: '1px solid #333',
                  borderRadius: '4px'
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ color: '#999', display: 'block', marginBottom: '5px' }}>
              Urgentie
            </label>
            <select
              value={urgency}
              onChange={(e) => setUrgency(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                background: '#1a1a1a',
                color: 'white',
                border: '1px solid #333',
                borderRadius: '4px'
              }}
            >
              <option value="low">Laag - Kan wachten</option>
              <option value="normal">Normaal - Deze week</option>
              <option value="high">Hoog - Binnen 2 dagen</option>
              <option value="urgent">Urgent - Vandaag/morgen</option>
            </select>
          </div>
        </div>

        <div style={{
          padding: '20px',
          borderTop: '1px solid #333',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '10px'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              background: '#333',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Annuleren
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !reason}
            style={{
              padding: '10px 20px',
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              opacity: submitting || !reason ? 0.5 : 1
            }}
          >
            {submitting ? 'Versturen...' : 'Verstuur Aanvraag'}
          </button>
        </div>
      </div>
    </div>
  )
}
