import { signOut } from '../lib/supabase'
import SchemaLibrary from './SchemaLibrary'
import { useState, useEffect } from 'react'
import { getCurrentUser } from '../lib/supabase'
import AIGenerator from './AIGenerator'
import Goals from './Goals'

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const handleLogout = async () => {
    try {
      await signOut()
      localStorage.removeItem('isClientMode')
      window.location.href = '/'
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  const loadData = async () => {
    try {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
    } catch (error) {
      console.error('Error loading user:', error)
    }
    setLoading(false)
  }

  const navigationItems = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'clients', label: 'Clients', icon: '👥' },
    { id: 'plans', label: 'Plans', icon: '📋' },
    { id: 'ai-generator', label: 'AI Generator', icon: '🧠' },
    { id: 'schema-library', label: 'Schema Library', icon: '📚' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
    { id: 'goals', label: 'Goals', icon: '🎯' }
  ]

  if (loading) {
    return (
      <div className="myarc-app myarc-flex myarc-items-center myarc-justify-center" style={{minHeight: '100vh'}}>
        <div className="myarc-loading">
          <div className="myarc-spinner"></div>
          <div className="myarc-text-white">Loading...</div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="myarc-app myarc-flex myarc-items-center myarc-justify-center" style={{minHeight: '100vh'}}>
        <div className="myarc-card">
          <h2 className="myarc-card-title">🚫 No user found</h2>
          <p className="myarc-text-gray">Please check your authentication</p>
        </div>
      </div>
    )
  }

  return (
    <div className="myarc-app">
      {/* Header */}
      <header className="myarc-header">
        <div className="myarc-container">
          <div className="myarc-flex myarc-items-center myarc-justify-between">
            {/* Mobile Menu Toggle */}
            <button 
              className="myarc-hamburger mobile-only"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <span></span>
              <span></span>
              <span></span>
            </button>

            <div>
              <h1 className="myarc-logo">MY ARC</h1>
              <p className="myarc-text-gray desktop-only">Personal Trainer Dashboard</p>
            </div>

            <div className="myarc-flex myarc-items-center myarc-gap-md">
              <div className="myarc-status-badge desktop-only">
                <span className="myarc-status-dot"></span>
                <span>Connected</span>
              </div>
              <div className="myarc-user-info desktop-only">
                <div className="myarc-user-email">{user.profile?.email || user.email}</div>
                <div className="myarc-user-role">{user.profile?.role || 'Coach'}</div>
              </div>
              <button 
                onClick={handleLogout}
                className="myarc-btn myarc-btn-secondary myarc-btn-sm"
              >
                <span className="desktop-only">🚪 Logout</span>
                <span className="mobile-only">🚪</span>
              </button>
            </div>
          </div>

          {/* Mobile Menu Dropdown */}
          {mobileMenuOpen && (
            <div className="myarc-mobile-menu">
              <div className="myarc-flex myarc-flex-col myarc-gap-sm">
                {navigationItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id)
                      setMobileMenuOpen(false)
                    }}
                    className={`myarc-nav-item ${activeTab === item.id ? 'active' : ''}`}
                  >
                    {item.icon} {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Desktop Navigation */}
      <div className="myarc-main">
        <div className="myarc-container">
          <nav className="myarc-nav desktop-only">
            {navigationItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`myarc-nav-item ${activeTab === item.id ? 'active' : ''}`}
              >
                {item.icon} {item.label}
              </button>
            ))}
          </nav>

          {/* Tab Content */}
          <div className="dashboard-content">
            {activeTab === 'overview' && <OverviewTab user={user} />}
            {activeTab === 'clients' && <ClientsTab />}
            {activeTab === 'plans' && <PlansTab />}
            {activeTab === 'ai-generator' && <AIGenerator />}
            {activeTab === 'schema-library' && <SchemaLibrary />}
            {activeTab === 'analytics' && <AnalyticsTab />}
            {activeTab === 'goals' && <Goals user={user} />}
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="myarc-mobile-nav mobile-only">
        <div className="myarc-mobile-nav-items">
          {navigationItems.slice(0, 5).map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`myarc-mobile-nav-item ${activeTab === item.id ? 'active' : ''}`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}

// Overview Tab Component
function OverviewTab({ user }) {
  const stats = [
    { label: 'Active Clients', value: '12', icon: '👥', color: 'green' },
    { label: 'Workout Plans', value: '28', icon: '📋', color: 'blue' },
    { label: 'AI Generated', value: '8', icon: '🧠', color: 'purple' },
    { label: 'This Month', value: '156', icon: '📈', color: 'yellow' }
  ]

  const recentActivities = [
    { icon: '✅', badge: 'New', title: 'Sarah completed "Push Day A"', time: '2 hours ago' },
    { icon: '🧠', badge: 'AI', title: 'Generated hypertrophy plan for Mike', time: '4 hours ago' },
    { icon: '🔄', badge: 'Update', title: 'Emma requested plan modification', time: '1 day ago' }
  ]

  return (
    <div className="myarc-animate-in">
      <div className="myarc-flex myarc-items-center myarc-justify-between myarc-mb-xl">
        <h2 className="myarc-card-title">Dashboard Overview</h2>
        <button className="myarc-btn myarc-btn-primary">
          ➕ New Client
        </button>
      </div>

      {/* Stats Grid */}
      <div className="myarc-grid myarc-grid-4 myarc-mb-xl">
        {stats.map((stat, index) => (
          <div key={index} className="myarc-card" style={{textAlign: 'center'}}>
            <div style={{fontSize: '2rem', marginBottom: '0.5rem'}}>{stat.icon}</div>
            <div className="myarc-text-green" style={{fontSize: '1.8rem', fontWeight: 'bold'}}>
              {stat.value}
            </div>
            <div className="myarc-text-gray">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="myarc-card">
        <div className="myarc-card-header">
          <h3 className="myarc-card-title">Recent Activity</h3>
          <p className="myarc-card-subtitle">Latest updates from your clients</p>
        </div>
        
        <div className="myarc-flex myarc-flex-col myarc-gap-lg">
          {recentActivities.map((activity, index) => (
            <div key={index} className="myarc-flex myarc-items-center myarc-gap-md" style={{
              padding: '1rem',
              background: 'rgba(17, 17, 17, 0.5)',
              borderRadius: '8px',
              border: '1px solid rgba(16, 185, 129, 0.2)'
            }}>
              <div style={{fontSize: '1.5rem'}}>{activity.icon}</div>
              <div style={{flex: 1}}>
                <div className="myarc-text-white">{activity.title}</div>
                <div className="myarc-text-gray" style={{fontSize: '0.875rem'}}>{activity.time}</div>
              </div>
              <span className={`myarc-badge myarc-badge-${
                activity.badge === 'New' ? 'success' : 
                activity.badge === 'AI' ? 'info' : 'warning'
              }`}>
                {activity.badge}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Enhanced Clients Tab Component - WITH REAL SUPABASE
function ClientsTab() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const [currentUser, setCurrentUser] = useState(null)
  const [schemas, setSchemas] = useState([])
  const [showSchemaModal, setShowSchemaModal] = useState(false)
  const [selectedClient, setSelectedClient] = useState(null)

  // Form data for new client
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    goal: '',
    experience: ''
  })

  // Load current user and clients on component mount
  useEffect(() => {
    initializeData()
  }, [])

  const initializeData = async () => {
    try {
      // Get current user (trainer)
      const user = await getCurrentUser()
      setCurrentUser(user)
      
      if (user) {
        await loadClients(user.id)
        await loadSchemas()
      }
    } catch (error) {
      console.error('Error initializing data:', error)
      setError('Failed to initialize client data')
    }
  }

  const loadClients = async (trainerId) => {
    if (!trainerId) return
    
    setLoading(true)
    try {
      // Import the new function
      const { getTrainerClients } = await import('../lib/supabase')
      const clientsData = await getTrainerClients(trainerId)
      
      console.log('✅ Loaded clients:', clientsData)
      setClients(clientsData)

    } catch (error) {
      console.error('Error loading clients:', error)
      setError('Failed to load clients: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const loadSchemas = async () => {
    try {
      const { getAllSchemas } = await import('../lib/supabase')
      const schemasData = await getAllSchemas()
      setSchemas(schemasData)
      console.log('✅ Loaded schemas:', schemasData.length)
    } catch (error) {
      console.error('❌ Error loading schemas:', error)
    }
  }

  const handleAssignSchema = async (schemaId) => {
    try {
      const { assignSchemaToClient } = await import('../lib/supabase')
      await assignSchemaToClient(selectedClient.id, schemaId)
      
      setClients(prev => prev.map(client => 
        client.id === selectedClient.id 
          ? { ...client, assigned_schema_id: schemaId }
          : client
      ))
      
      setShowSchemaModal(false)
      setSelectedClient(null)
      setSuccess(`Schema assigned to ${selectedClient.first_name}!`)
      
      // Reload clients to get fresh data
      if (currentUser) {
        await loadClients(currentUser.id)
      }
    } catch (error) {
      console.error('❌ Error assigning schema:', error)
      setError('Error assigning schema')
    }
  }

  const handleFormChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleAddClient = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      if (!currentUser) {
        throw new Error('No trainer logged in')
      }

      console.log('🔥 Adding new client to database:', formData)
      
      const { createClientAccount } = await import('../lib/supabase')      
      const result = await createClientAccount(formData, currentUser.id)      
      console.log('✅ Client created:', result)
      setSuccess(`Client ${formData.firstName} ${formData.lastName} added successfully!`)
      
      // Reload clients list
      await loadClients(currentUser.id)
      
      // Reset form
      setFormData({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        phone: '',
        goal: '',
        experience: ''
      })
      setShowAddForm(false)

    } catch (error) {
      console.error('Error adding client:', error)
      setError('Failed to add client: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClient = async (clientId) => {
    if (!confirm('Are you sure you want to remove this client?')) return

    try {
      setLoading(true)
      
      const { removeClient } = await import('../lib/supabase')
      
      await removeClient(clientId)
      setSuccess('Client removed successfully!')
      
      // Reload clients list
      if (currentUser) {
        await loadClients(currentUser.id)
      }

    } catch (error) {
      console.error('Error removing client:', error)
      setError('Failed to remove client: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="myarc-animate-in">
      {/* Success/Error Messages */}
      {error && (
        <div className="myarc-card myarc-mb-lg" style={{borderColor: '#ef4444', backgroundColor: '#7f1d1d20'}}>
          <p className="text-red-400">❌ {error}</p>
          <button 
            onClick={() => setError('')}
            className="myarc-btn myarc-btn-sm myarc-mt-sm"
            style={{fontSize: 'var(--text-xs)'}}
          >
            Dismiss
          </button>
        </div>
      )}

      {success && (
        <div className="myarc-card myarc-mb-lg" style={{borderColor: '#10b981', backgroundColor: '#06402520'}}>
          <p className="text-green-400">✅ {success}</p>
          <button 
            onClick={() => setSuccess('')}
            className="myarc-btn myarc-btn-sm myarc-mt-sm"
            style={{fontSize: 'var(--text-xs)'}}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header */}
      <div className="myarc-flex myarc-items-center myarc-justify-between myarc-mb-xl">
        <div>
          <h2 className="myarc-card-title">👥 Client Management</h2>
          <p className="myarc-card-subtitle">
            Manage your personal training clients
            {currentUser && (
              <span className="myarc-text-gray myarc-ml-sm">
                • Trainer: {currentUser.profile?.email}
              </span>
            )}
          </p>
        </div>
        <div className="myarc-flex myarc-gap-md">
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="myarc-btn myarc-btn-primary"
            disabled={!currentUser}
          >
            {showAddForm ? '❌ Cancel' : '➕ Add Client'}
          </button>
          <button 
            onClick={() => currentUser && loadClients(currentUser.id)}
            disabled={loading || !currentUser}
            className="myarc-btn myarc-btn-secondary"
          >
            {loading ? '🔄 Loading...' : '🔄 Refresh'}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="myarc-grid myarc-grid-4 myarc-mb-xl">
        <div className="myarc-card myarc-p-lg" style={{textAlign: 'center'}}>
          <div style={{fontSize: 'var(--text-2xl)', marginBottom: 'var(--s-3)'}}>👥</div>
          <div className="myarc-text-green" style={{fontSize: 'var(--text-xl)', fontWeight: 'bold'}}>
            {clients.length}
          </div>
          <div className="myarc-text-gray">Total Clients</div>
        </div>
        <div className="myarc-card myarc-p-lg" style={{textAlign: 'center'}}>
          <div style={{fontSize: 'var(--text-2xl)', marginBottom: 'var(--s-3)'}}>✅</div>
          <div className="myarc-text-green" style={{fontSize: 'var(--text-xl)', fontWeight: 'bold'}}>
            {clients.filter(c => c.status === 'active').length}
          </div>
          <div className="myarc-text-gray">Active Clients</div>
        </div>
        <div className="myarc-card myarc-p-lg" style={{textAlign: 'center'}}>
          <div style={{fontSize: 'var(--text-2xl)', marginBottom: 'var(--s-3)'}}>🏋️</div>
          <div className="myarc-text-green" style={{fontSize: 'var(--text-xl)', fontWeight: 'bold'}}>
            {clients.filter(c => c.last_workout).length}
          </div>
          <div className="myarc-text-gray">Training</div>
        </div>
        <div className="myarc-card myarc-p-lg" style={{textAlign: 'center'}}>
          <div style={{fontSize: 'var(--text-2xl)', marginBottom: 'var(--s-3)'}}>📋</div>
          <div className="myarc-text-green" style={{fontSize: 'var(--text-xl)', fontWeight: 'bold'}}>
            {clients.filter(c => c.assigned_schema_id).length}
          </div>
          <div className="myarc-text-gray">With Plans</div>
        </div>
      </div>

      {/* Add Client Form */}
      {showAddForm && (
        <div className="myarc-card myarc-mb-xl">
          <div className="myarc-card-header">
            <h3 className="myarc-card-title">➕ Add New Client</h3>
            <p className="myarc-card-subtitle">Create a new client account with login credentials</p>
          </div>

          <form onSubmit={handleAddClient} className="myarc-flex myarc-flex-col myarc-gap-lg">
            {/* Name Fields */}
            <div className="myarc-grid myarc-grid-2 myarc-gap-md">
              <div>
                <label className="block myarc-text-gray myarc-mb-sm" style={{fontSize: 'var(--text-sm)'}}>
                  First Name *
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleFormChange}
                  required
                  className="myarc-input"
                  placeholder="Enter first name"
                />
              </div>
              <div>
                <label className="block myarc-text-gray myarc-mb-sm" style={{fontSize: 'var(--text-sm)'}}>
                  Last Name *
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleFormChange}
                  required
                  className="myarc-input"
                  placeholder="Enter last name"
                />
              </div>
            </div>

            {/* Contact Info */}
            <div className="myarc-grid myarc-grid-2 myarc-gap-md">
              <div>
                <label className="block myarc-text-gray myarc-mb-sm" style={{fontSize: 'var(--text-sm)'}}>
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  required
                  className="myarc-input"
                  placeholder="Enter email address"
                />
              </div>
              <div>
                <label className="block myarc-text-gray myarc-mb-sm" style={{fontSize: 'var(--text-sm)'}}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleFormChange}
                  className="myarc-input"
                  placeholder="+31 6 1234 5678"
                />
              </div>
            </div>

            {/* Goals & Experience */}
            <div className="myarc-grid myarc-grid-2 myarc-gap-md">
              <div>
                <label className="block myarc-text-gray myarc-mb-sm" style={{fontSize: 'var(--text-sm)'}}>
                  Primary Goal *
                </label>
                <select
                  name="goal"
                  value={formData.goal}
                  onChange={handleFormChange}
                  required
                  className="myarc-input"
                >
                  <option value="">Select goal</option>
                  <option value="Weight Loss">Weight Loss</option>
                  <option value="Muscle Gain">Muscle Gain</option>
                  <option value="Strength">Strength</option>
                  <option value="General Fitness">General Fitness</option>
                  <option value="Athletic Performance">Athletic Performance</option>
                </select>
              </div>
              <div>
                <label className="block myarc-text-gray myarc-mb-sm" style={{fontSize: 'var(--text-sm)'}}>
                  Experience Level *
                </label>
                <select
                  name="experience"
                  value={formData.experience}
                  onChange={handleFormChange}
                  required
                  className="myarc-input"
                >
                  <option value="">Select experience</option>
                  <option value="Beginner">Beginner (0-18 months)</option>
                  <option value="Intermediate">Intermediate (1.5-3 years)</option>
                  <option value="Advanced">Advanced (3+ years)</option>
                </select>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block myarc-text-gray myarc-mb-sm" style={{fontSize: 'var(--text-sm)'}}>
                Temporary Password *
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleFormChange}
                required
                className="myarc-input"
                placeholder="Enter temporary password (min 6 characters)"
                minLength={6}
              />
              <p className="myarc-text-gray" style={{fontSize: 'var(--text-xs)', marginTop: 'var(--s-1)'}}>
                ⚠️ Client will receive login credentials and should change password on first login
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !currentUser}
              className="myarc-btn myarc-btn-primary"
            >
              {loading ? (
                <>
                  <div className="myarc-spinner"></div>
                  Creating Client Account...
                </>
              ) : (
                '🚀 Create Client Account in Supabase'
              )}
            </button>
          </form>
        </div>
      )}

      {/* Clients List */}
      <div className="myarc-card">
        <div className="myarc-card-header">
          <h3 className="myarc-card-title">📋 All Clients</h3>
          <p className="myarc-card-subtitle">
            {clients.length > 0 
              ? `Managing ${clients.length} client${clients.length !== 1 ? 's' : ''} from database`
              : 'No clients in database yet'
            }
          </p>
        </div>

        {clients.length === 0 && !loading && (
          <div style={{textAlign: 'center'}}>
            <div style={{fontSize: 'var(--text-2xl)', marginBottom: 'var(--s-6)'}}>🗃️</div>
            <p className="myarc-text-gray myarc-mb-lg">
              {currentUser 
                ? 'No clients in database yet. Add your first client to get started!' 
                : 'Please log in to manage clients'
              }
            </p>  
            {currentUser && (
              <button 
                onClick={() => setShowAddForm(true)}
                className="myarc-btn myarc-btn-primary"
              >
                ➕ Add First Client to Database
              </button>
            )}
          </div>
        )}

        {clients.length > 0 && (
          <div className="myarc-flex myarc-flex-col myarc-gap-md">
            {clients.map((client) => (
              <div 
                key={client.id} 
                className="myarc-p-md" 
                style={{
                  background: 'var(--c-bg-dark)', 
                  border: '1px solid var(--c-border)',
                  borderRadius: 'var(--radius)'
                }}
              >
                <div className="myarc-flex myarc-items-start myarc-justify-between myarc-mb-sm">
                  <div style={{flex: 1}}>
                    <div className="myarc-flex myarc-items-center myarc-gap-md myarc-mb-sm">
                      <div className="myarc-text-green" style={{fontWeight: 'bold'}}>
                        {client.first_name} {client.last_name}
                      </div>
                      <span className={`myarc-badge ${
                        client.status === 'active' ? 'myarc-badge-success' : 'myarc-badge-warning'
                      }`}>
                        {client.status === 'active' ? '✅' : '⏸️'} {client.status}
                      </span>
                      <span className="myarc-badge myarc-badge-info">
                        🗃️ Database
                      </span>
                      {client.assigned_schema_id && (
                        <span className="myarc-badge myarc-badge-success">
                          📋 Has Schema
                        </span>
                      )}
                    </div>
                    
                    <div className="myarc-grid myarc-grid-2 myarc-gap-md myarc-text-gray" style={{fontSize: 'var(--text-sm)'}}>
                      <div>📧 {client.email}</div>
                      <div>📱 {client.phone || 'No phone'}</div>
                      <div>🎯 Goal: {client.goal}</div>
                      <div>📈 {client.experience}</div>
                      <div>🏋️ Last workout: {client.last_workout ? new Date(client.last_workout).toLocaleDateString() : 'Never'}</div>
                      <div>📋 Plan: {client.assigned_schema_id ? '✅ Assigned' : '❌ Not assigned'}</div>
                    </div>
                    
                    <div className="myarc-text-gray myarc-mt-sm" style={{fontSize: 'var(--text-xs)'}}>
                      Created: {new Date(client.created_at).toLocaleDateString()} • 
                      ID: {client.id}
                    </div>
                  </div>
                  
                  <div className="myarc-flex myarc-gap-sm">
                    <button className="myarc-btn myarc-btn-secondary myarc-btn-sm">
                      📝 Edit
                    </button>

                    <button 
                      onClick={() => {
                        setSelectedClient(client)
                        setShowSchemaModal(true)
                      }}
                      className="myarc-btn myarc-btn-secondary myarc-btn-sm"
                    >
                      📋 {client.assigned_schema_id ? 'Change' : 'Assign'} Schema
                    </button>

                    <button className="myarc-btn myarc-btn-secondary myarc-btn-sm">
                      📊 Progress
                    </button>
                    <button 
                      onClick={() => handleDeleteClient(client.id)}
                      className="myarc-btn myarc-btn-secondary myarc-btn-sm text-red-400"
                      disabled={loading}
                    >
                      🗑️ Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Schema Assignment Modal */}
        {showSchemaModal && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <div className="myarc-card" style={{maxWidth: '600px', width: '90%'}}>
              <div className="myarc-flex myarc-items-center myarc-justify-between myarc-mb-lg">
                <h3 className="myarc-card-title">
                  📋 Assign Schema to {selectedClient?.first_name}
                </h3>
                <button 
                  onClick={() => setShowSchemaModal(false)}
                  className="myarc-text-muted hover:myarc-text-white"
                >
                  ✕
                </button>
              </div>
              
              <div className="myarc-flex myarc-flex-col myarc-gap-md">
                {schemas.map(schema => (
                  <div 
                    key={schema.id}
                    onClick={() => handleAssignSchema(schema.id)}
                    className="myarc-p-md myarc-card cursor-pointer hover:myarc-bg-card"
                    style={{background: 'var(--c-bg-dark)'}}
                  >
                    <div className="myarc-text-green font-semibold">{schema.name}</div>
                    <div className="myarc-text-muted text-sm">{schema.description}</div>
                    <div className="myarc-text-muted text-xs myarc-mt-sm">
                      {schema.primary_goal} • {schema.days_per_week} days • {schema.split_name}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Plans Tab Component
function PlansTab() {
  return (
    <div className="myarc-card myarc-animate-in">
      <div className="myarc-card-header">
        <h2 className="myarc-card-title">📋 Workout Plans</h2>
        <p className="myarc-card-subtitle">Your workout plan library</p>
      </div>
      <div style={{textAlign: 'center'}}>
        <div style={{fontSize: 'var(--text-2xl)', marginBottom: 'var(--s-6)'}}>📚</div>
        <p className="myarc-text-gray myarc-mb-lg">Plan library coming soon...</p>
        <button className="myarc-btn myarc-btn-secondary">
          🧠 Generate with AI
        </button>
      </div>
    </div>
  )
}

// Analytics Tab Component
function AnalyticsTab() {
  return (
    <div className="myarc-card myarc-animate-in">
      <div className="myarc-card-header">
        <h2 className="myarc-card-title">📈 Analytics</h2>
        <p className="myarc-card-subtitle">Track your coaching performance</p>
      </div>
      <div style={{textAlign: 'center'}}>
        <div style={{fontSize: 'var(--text-2xl)', marginBottom: 'var(--s-6)'}}>📊</div>
        <p className="myarc-text-gray myarc-mb-lg">Analytics dashboard coming soon...</p>
        <p className="myarc-text-gray" style={{fontSize: 'var(--text-sm)'}}>Track client progress, plan effectiveness, and business metrics</p>
      </div>
    </div>
  )
}
