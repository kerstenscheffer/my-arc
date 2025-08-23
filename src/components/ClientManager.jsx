// src/components/ClientManager.jsx
// MY ARC Client Management - RESTYLED MET THEME.CSS
// Kersten - 15 Augustus 2025

import { useState, useEffect } from 'react'
import DatabaseService from '../services/DatabaseService'
const db = DatabaseService

export default function ClientManager() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const [currentUser, setCurrentUser] = useState(null)
  const [schemas, setSchemas] = useState([])
  const [showSchemaModal, setShowSchemaModal] = useState(false)
  const [selectedClient, setSelectedClient] = useState(null)
  
  // Client Detail Modal State
  const [showClientDetail, setShowClientDetail] = useState(false)
  const [clientDetailData, setClientDetailData] = useState(null)
  const [activeDetailTab, setActiveDetailTab] = useState('info')

  // Client Edit Mode - UITGEBREID MET GOALS
  const [editingClient, setEditingClient] = useState(null)
  const [editFormData, setEditFormData] = useState({})
  const [savingClient, setSavingClient] = useState(false)

  // Goals Management State - NIEUW
  const [clientGoals, setClientGoals] = useState([])
  const [showAddGoal, setShowAddGoal] = useState(false)
  const [editingGoal, setEditingGoal] = useState(null)
  const [goalForm, setGoalForm] = useState({
    title: '',
    description: '',
    target_date: '',
    priority: 'medium',
    status: 'active'
  })

  // Add Client Form Data - UITGEBREID MET CORRECTE KOLOM NAMEN
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    goal: '',
    experience: '',
    current_weight: '', // CORRECTE KOLOM NAAM
    height: '',
    days_per_week: '', // CORRECTE KOLOM NAAM
    meal_preferences: '',
    injuries: '', // NIEUWE KOLOM
    medical_notes: '' // NIEUWE KOLOM
  })

  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768

  useEffect(() => {
    initializeData()
  }, [])

  const initializeData = async () => {
    try {
      // Get current user (trainer)
      const user = await db.getCurrentUser()
      setCurrentUser(user)
      
      if (user) {
        // Load clients en schemas parallel
        await Promise.all([
          loadClients(user.id),
          loadSchemas()
        ])
      }
    } catch (error) {
      console.error('Error initializing data:', error)
      setError('Failed to initialize client data')
    }
  }

  // Database Functions - ORIGINELE IMPLEMENTATIE + PROPER ERROR HANDLING
  async function loadClients(trainerId) {
    if (!trainerId) return
    
    setLoading(true)
    try {
      // Import the function from supabase
      const { getTrainerClients } = await import('../lib/supabase')
      const clientsData = await getTrainerClients(trainerId)
      
      console.log('✅ Loaded clients:', clientsData)
      setClients(clientsData || [])

    } catch (error) {
      console.error('❌ Error loading clients:', error)
      setError('Failed to load clients: ' + error.message)
      setClients([]) // Fallback to empty array
    } finally {
      setLoading(false)
    }
  }

  async function loadSchemas() {
    try {
      const { getAllSchemas } = await import('../lib/supabase')
      const schemasData = await getAllSchemas()
      setSchemas(schemasData || [])
      console.log('✅ Loaded schemas:', schemasData?.length || 0)
    } catch (error) {
      console.error('❌ Error loading schemas:', error)
      setSchemas([]) // Fallback to empty array
    }
  }

  async function handleAddClient(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      if (!currentUser) {
        throw new Error('No trainer logged in')
      }

      // Clean form data - convert empty strings to null voor numerieke velden
      const cleanedFormData = {
        ...formData,
        current_weight: formData.current_weight === '' ? null : Number(formData.current_weight) || null,
        height: formData.height === '' ? null : Number(formData.height) || null,
        days_per_week: formData.days_per_week === '' ? null : Number(formData.days_per_week) || null
      }

      console.log('🔥 Adding new client to database:', cleanedFormData)
      
      const { createClientAccount } = await import('../lib/supabase')      
      const result = await db.createClient(cleanedFormData, currentUser.id)      
      console.log('✅ Client created:', result)
      setSuccess(`Client ${formData.firstName} ${formData.lastName} added successfully!`)
      
      // Reload clients list
      await loadClients(currentUser.id)
      
      // Reset form - UITGEBREID MET CORRECTE KOLOM NAMEN
      setFormData({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        phone: '',
        goal: '',
        experience: '',
        current_weight: '',
        height: '',
        days_per_week: '',
        meal_preferences: '',
        injuries: '',
        medical_notes: ''
      })
      setShowAddForm(false)

    } catch (error) {
      console.error('Error adding client:', error)
      setError('Failed to add client: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // NIEUWE FUNCTIE: Update Client Info - FIXED MET NULL CONVERSIE
  async function handleUpdateClient(clientId, updates) {
    setSavingClient(true)
    setError('')
    
    try {
      // Convert empty strings to null voor numerieke velden
      const cleanedUpdates = {
        ...updates,
        current_weight: updates.current_weight === '' ? null : Number(updates.current_weight) || null,
        height: updates.height === '' ? null : Number(updates.height) || null,
        days_per_week: updates.days_per_week === '' ? null : Number(updates.days_per_week) || null
      }
      
      console.log('🔄 Original updates:', updates)
      console.log('🧹 Cleaned updates:', cleanedUpdates)
      
      // Import en call updateClientInfo functie
      const { updateClientInfo } = await import('../lib/supabase')
      const updatedClient = await updateClientInfo(clientId, cleanedUpdates)
      
      console.log('✅ Client updated:', updatedClient)
      
      // Update local state - CLIENTS LIJST
      setClients(prev => prev.map(c => 
        c.id === clientId ? { ...c, ...cleanedUpdates } : c
      ))
      
      // Update detail modal - CLIENT DETAIL DATA
      if (clientDetailData?.id === clientId) {
        const newDetailData = { ...clientDetailData, ...cleanedUpdates }
        setClientDetailData(newDetailData)
      }
      
      setSuccess('✅ Client information updated successfully!')
      setEditingClient(null) // STOP EDIT MODE
      
      // Success message wegmaken na 3 seconden
      setTimeout(() => setSuccess(''), 3000)
      
    } catch (error) {
      console.error('❌ Error updating client:', error)
      setError('Failed to update client: ' + error.message)
      setTimeout(() => setError(''), 5000)
    } finally {
      setSavingClient(false)
    }
  }

  async function handleAssignSchema(schemaId) {
    setLoading(true)
    try {
      const { assignSchemaToClient } = await import('../lib/supabase')
      await assignSchemaToClient(selectedClient.id, schemaId)
      
      console.log(`✅ Schema ${schemaId} assigned to client ${selectedClient.id}`)
      
      // Update clients list - ZOWEL LOKAAL ALS DETAIL
      setClients(prev => prev.map(client => 
        client.id === selectedClient.id 
          ? { ...client, assigned_schema_id: schemaId }
          : client
      ))
      
      // Update client detail data if modal is open
      if (clientDetailData?.id === selectedClient.id) {
        setClientDetailData(prev => ({ 
          ...prev, 
          assigned_schema_id: schemaId 
        }))
      }
      
      setSuccess(`✅ Schema assigned to ${selectedClient.first_name}!`)
      setShowSchemaModal(false)
      setSelectedClient(null)
      
      // Success message wegmaken na 3 seconden
      setTimeout(() => setSuccess(''), 3000)
      
      // REFRESH clients om verse data te krijgen
      if (currentUser) {
        await loadClients(currentUser.id)
      }
    } catch (error) {
      console.error('❌ Error assigning schema:', error)
      setError('Error assigning schema: ' + error.message)
      setTimeout(() => setError(''), 5000)
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteClient(clientId) {
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

  function handleFormChange(e) {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  function openClientDetail(client) {
    setClientDetailData(client)
    setShowClientDetail(true)
    setActiveDetailTab('info')
    setEditingClient(null) // Reset edit mode
    setEditFormData({
      current_weight: client.current_weight || '', // CORRECTE KOLOM NAAM
      height: client.height || '',
      days_per_week: client.days_per_week || '', // CORRECTE KOLOM NAAM
      meal_preferences: client.meal_preferences || '',
      injuries: client.injuries || '', // NIEUWE KOLOM
      medical_notes: client.medical_notes || '' // NIEUWE KOLOM
    })
  }

  function startEditingClient(client) {
    setEditingClient(client.id)
    setEditFormData({
      current_weight: client.current_weight || '',
      height: client.height || '',
      days_per_week: client.days_per_week || '',
      meal_preferences: client.meal_preferences || '',
      injuries: client.injuries || '',
      medical_notes: client.medical_notes || ''
    })
  }

  function handleEditFormChange(field, value) {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const activeClients = clients.filter(c => c.status === 'active').length

  return (
    <div className="myarc-app myarc-animate-in">
      {/* Header - MY ARC STYLE */}
      <div className="myarc-card myarc-mb-lg">
        <div className="myarc-card-header">
          <h1 className="myarc-card-title">👥 Client Management</h1>
          <p className="myarc-card-subtitle">
            Manage your MY ARC clients and assign workout plans
          </p>
        </div>
      </div>

      {/* Success/Error Messages - MY ARC STYLE */}
      {error && (
        <div className="myarc-alert myarc-alert-error myarc-mb-lg">
          ❌ {error}
        </div>
      )}

      {success && (
        <div className="myarc-alert myarc-alert-success myarc-mb-lg">
          ✅ {success}
        </div>
      )}

      {/* Stats Grid - MY ARC STYLE */}
      <div className="myarc-grid myarc-grid-4 myarc-mb-xl">
        <div className="myarc-card myarc-p-lg" style={{textAlign: 'center'}}>
          <div className="myarc-text-green" style={{fontSize: 'var(--text-2xl)', fontWeight: 'bold'}}>
            {clients.length}
          </div>
          <div className="myarc-text-gray">Total Clients</div>
        </div>
        <div className="myarc-card myarc-p-lg" style={{textAlign: 'center'}}>
          <div className="myarc-text-green" style={{fontSize: 'var(--text-2xl)', fontWeight: 'bold'}}>
            {activeClients}
          </div>
          <div className="myarc-text-gray">Active Clients</div>
        </div>
        <div className="myarc-card myarc-p-lg" style={{textAlign: 'center'}}>
          <div className="myarc-text-green" style={{fontSize: 'var(--text-2xl)', fontWeight: 'bold'}}>
            {clients.filter(c => c.last_workout).length}
          </div>
          <div className="myarc-text-gray">Training</div>
        </div>
        <div className="myarc-card myarc-p-lg" style={{textAlign: 'center'}}>
          <div className="myarc-text-green" style={{fontSize: 'var(--text-2xl)', fontWeight: 'bold'}}>
            {clients.filter(c => c.assigned_schema_id).length}
          </div>
          <div className="myarc-text-gray">With Plans</div>
        </div>
      </div>

      {/* Action Buttons - MY ARC STYLE */}
      <div className="myarc-flex myarc-gap-md myarc-mb-xl">
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className={`myarc-btn ${showAddForm ? 'myarc-btn-secondary' : 'myarc-btn-primary'}`}
          disabled={!currentUser}
        >
          {showAddForm ? '❌ Cancel' : '➕ Add Client'}
        </button>
        <button 
          onClick={() => currentUser && loadClients(currentUser.id)}
          disabled={loading || !currentUser}
          className="myarc-btn myarc-btn-outline"
        >
          {loading ? '🔄 Loading...' : '🔄 Refresh'}
        </button>
      </div>

      {/* Add Client Form - MY ARC STYLE */}
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
                <label className="myarc-label">First Name *</label>
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
                <label className="myarc-label">Last Name *</label>
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
                <label className="myarc-label">Email Address *</label>
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
                <label className="myarc-label">Phone Number</label>
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
                <label className="myarc-label">Primary Goal *</label>
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
                <label className="myarc-label">Experience Level *</label>
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

            {/* Physical Information - CORRECTE KOLOM NAMEN */}
            <div className="myarc-grid myarc-grid-3 myarc-gap-md">
              <div>
                <label className="myarc-label">Weight (kg)</label>
                <input
                  type="number"
                  name="current_weight"
                  value={formData.current_weight}
                  onChange={handleFormChange}
                  className="myarc-input"
                  placeholder="70"
                />
              </div>
              <div>
                <label className="myarc-label">Height (cm)</label>
                <input
                  type="number"
                  name="height"
                  value={formData.height}
                  onChange={handleFormChange}
                  className="myarc-input"
                  placeholder="175"
                />
              </div>
              <div>
                <label className="myarc-label">Training Days/Week</label>
                <select
                  name="days_per_week"
                  value={formData.days_per_week}
                  onChange={handleFormChange}
                  className="myarc-input"
                >
                  <option value="">Select days</option>
                  <option value="2">2 days</option>
                  <option value="3">3 days</option>
                  <option value="4">4 days</option>
                  <option value="5">5 days</option>
                  <option value="6">6 days</option>
                  <option value="7">7 days</option>
                </select>
              </div>
            </div>

            {/* Medical Information - CORRECTE KOLOM NAMEN */}
            <div>
              <label className="myarc-label">Injuries & Physical Limitations</label>
              <textarea
                name="injuries"
                value={formData.injuries}
                onChange={handleFormChange}
                rows="2"
                className="myarc-textarea"
                placeholder="Any injuries, physical limitations, or movement restrictions..."
              />
            </div>

            {/* Nutrition Information - GEUPDATE */}
            <div className="myarc-grid myarc-grid-2 myarc-gap-md">
              <div>
                <label className="myarc-label">Meal Preferences</label>
                <textarea
                  name="meal_preferences"
                  value={formData.meal_preferences}
                  onChange={handleFormChange}
                  rows="3"
                  className="myarc-textarea"
                  placeholder="Dietary preferences, favorite foods, cooking habits..."
                />
              </div>
              <div>
                <label className="myarc-label">Medical Notes</label>
                <textarea
                  name="medical_notes"
                  value={formData.medical_notes}
                  onChange={handleFormChange}
                  rows="3"
                  className="myarc-textarea"
                  placeholder="Medical conditions, medications, doctor restrictions..."
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="myarc-label">Temporary Password *</label>
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
              <p className="myarc-text-gray myarc-text-sm myarc-mt-sm">
                ⚠️ Client will receive login credentials and should change password on first login
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !currentUser}
              className="myarc-btn myarc-btn-primary myarc-btn-lg"
            >
              {loading ? (
                <span className="myarc-flex myarc-items-center myarc-gap-sm">
                  <div className="myarc-spinner"></div>
                  Creating Client Account...
                </span>
              ) : (
                '🚀 Create Client Account in Supabase'
              )}
            </button>
          </form>
        </div>
      )}

      {/* Clients List - MY ARC STYLE */}
      <div className="myarc-card">
        <div className="myarc-card-header">
          <h3 className="myarc-card-title">📋 Your Clients ({clients.length})</h3>
          <p className="myarc-card-subtitle">
            {clients.length > 0 
              ? `Managing ${clients.length} client${clients.length !== 1 ? 's' : ''} from database`
              : 'No clients in database yet'
            }
          </p>
        </div>

        {clients.length === 0 && !loading && (
          <div className="myarc-empty-state">
            <div className="myarc-empty-icon">🗃️</div>
            <h4 className="myarc-empty-title">No clients yet</h4>
            <p className="myarc-empty-subtitle">
              {currentUser 
                ? 'Add your first client to get started!' 
                : 'Please log in to manage clients'
              }
            </p>  
            {currentUser && (
              <button 
                onClick={() => setShowAddForm(true)}
                className="myarc-btn myarc-btn-primary"
              >
                ➕ Add First Client
              </button>
            )}
          </div>
        )}

        {clients.length > 0 && (
          <div className="myarc-grid myarc-grid-2 myarc-gap-md">
            {clients.map((client) => (
              <div 
                key={client.id} 
                className="myarc-client-card"
                onClick={() => openClientDetail(client)}
              >
                {/* Header met naam en status */}
                <div className="myarc-flex myarc-items-start myarc-justify-between myarc-mb-sm">
                  <div style={{flex: 1}}>
                    <div className="myarc-flex myarc-items-center myarc-gap-sm myarc-mb-xs">
                      <h4 className="myarc-text-green" style={{fontWeight: 'bold', fontSize: 'var(--text-lg)', margin: 0}}>
                        {client.first_name} {client.last_name}
                      </h4>
                    </div>
                    <p className="myarc-text-gray myarc-mb-sm" style={{fontSize: 'var(--text-sm)', margin: 0}}>
                      📧 {client.email}
                    </p>
                  </div>
                  <div className="myarc-flex myarc-gap-xs">
                    <span className={`myarc-badge ${
                      client.status === 'active' ? 'myarc-badge-success' : 'myarc-badge-warning'
                    }`}>
                      {client.status === 'active' ? '✅' : '⏸️'}
                    </span>
                    {client.assigned_schema_id && (
                      <span className="myarc-badge myarc-badge-success">📋</span>
                    )}
                  </div>
                </div>
                
                {/* Client Info Grid */}
                <div className="myarc-grid myarc-grid-2 myarc-gap-sm myarc-mb-md">
                  <div className="myarc-text-gray myarc-text-sm">
                    <strong>Level:</strong> {client.experience || 'Not specified'}
                  </div>
                  <div className="myarc-text-gray myarc-text-sm">
                    <strong>Goal:</strong> {client.goal || 'Not specified'}
                  </div>
                  <div className="myarc-text-gray myarc-text-sm">
                    <strong>Phone:</strong> {client.phone || 'Not provided'}
                  </div>
                  <div className="myarc-text-gray myarc-text-sm">
                    <strong>Last workout:</strong> {client.last_workout ? new Date(client.last_workout).toLocaleDateString() : 'Never'}
                  </div>
                </div>
                
                {/* Action Buttons - GEFIXTE LAYOUT */}
                <div className="myarc-flex myarc-gap-sm myarc-mt-md" style={{borderTop: '1px solid var(--c-border)', paddingTop: 'var(--s-3)'}}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedClient(client)
                      setShowSchemaModal(true)
                    }}
                    className="myarc-btn myarc-btn-primary myarc-btn-sm"
                    style={{flex: 1}}
                  >
                    📋 {client.assigned_schema_id ? 'Change' : 'Assign'} Schema
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteClient(client.id)
                    }}
                    disabled={loading}
                    className="myarc-btn myarc-btn-outline myarc-btn-sm"
                    style={{flex: 0, minWidth: '100px'}}
                  >
                    🗑️ Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Schema Assignment Modal - VERHOOGDE Z-INDEX BOVEN CLIENT DETAIL */}
      {showSchemaModal && selectedClient && (
        <div className="myarc-modal" style={{zIndex: 3000}}> {/* HOGER DAN CLIENT DETAIL (2000) */}
          <div className="myarc-modal-content" style={{maxWidth: '600px'}}>
            <div className="myarc-modal-header">
              <h3 className="myarc-card-title">📋 Assign Plans to {selectedClient.first_name}</h3>
              <button
                onClick={() => {
                  setShowSchemaModal(false)
                  setSelectedClient(null)
                }}
                className="myarc-btn myarc-btn-ghost"
              >
                ✕
              </button>
            </div>

            {/* UITGEBREIDE ASSIGNMENT OPTIONS */}
            <div className="myarc-flex myarc-flex-col myarc-gap-lg">
              <div>
                <h4 className="myarc-text-green myarc-mb-md">💪 Workout Schema</h4>
                <div className="myarc-flex myarc-flex-col myarc-gap-sm" style={{maxHeight: '300px', overflow: 'auto'}}>
                  {schemas.map(schema => (
                    <div 
                      key={schema.id}
                      onClick={() => handleAssignSchema(schema.id)}
                      className={`myarc-schema-option ${selectedClient.assigned_schema_id === schema.id ? 'active' : ''}`}
                    >
                      <div className="myarc-flex myarc-justify-between myarc-items-center">
                        <div>
                          <h5 className="myarc-text-white">{schema.name}</h5>
                          <p className="myarc-text-gray myarc-text-sm">{schema.description}</p>
                          <div className="myarc-text-gray myarc-text-xs">
                            {schema.primary_goal} • {schema.days_per_week} days • {schema.split_name}
                          </div>
                        </div>
                        {selectedClient.assigned_schema_id === schema.id && (
                          <span className="myarc-badge myarc-badge-success">✅ Assigned</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="myarc-text-green myarc-mb-md">🍽️ Meal Plan (Coming Soon)</h4>
                <div className="myarc-empty-state myarc-empty-state-sm">
                  <p className="myarc-text-gray">Meal plan assignment will be available soon</p>
                </div>
              </div>

              <div>
                <h4 className="myarc-text-green myarc-mb-md">🎁 Bonus Content (Coming Soon)</h4>
                <div className="myarc-empty-state myarc-empty-state-sm">
                  <p className="myarc-text-gray">Bonus schemas and content assignment will be available soon</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Client Detail Modal - MY ARC STYLE */}
      {showClientDetail && clientDetailData && (
        <div className="myarc-modal" style={{zIndex: 2000}}> {/* LAGER DAN SCHEMA MODAL (3000) */}
          <div className="myarc-modal-content myarc-modal-lg">
            {/* Header */}
            <div className="myarc-modal-header">
              <div>
                <h2 className="myarc-card-title">
                  {clientDetailData.first_name} {clientDetailData.last_name}
                </h2>
                <p className="myarc-text-gray">{clientDetailData.email}</p>
              </div>
              <button
                onClick={() => setShowClientDetail(false)}
                className="myarc-btn myarc-btn-ghost"
              >
                ✕
              </button>
            </div>

            {/* Tabs - UITGEBREID MET PLANS */}
            <div className="myarc-tabs">
              {['info', 'plans', 'nutrition', 'progress'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveDetailTab(tab)}
                  className={`myarc-tab ${activeDetailTab === tab ? 'active' : ''}`}
                >
                  {tab === 'info' && '👤 Info'}
                  {tab === 'plans' && '📋 Assigned Plans'}
                  {tab === 'nutrition' && '🍎 Nutrition'}
                  {tab === 'progress' && '📈 Progress'}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="myarc-modal-body">
              {activeDetailTab === 'info' && (
                <div>
                  <div className="myarc-flex myarc-justify-between myarc-items-center myarc-mb-lg">
                    <h3 className="myarc-card-title">📋 Client Information</h3>
                    {editingClient !== clientDetailData.id ? (
                      <button
                        onClick={() => startEditingClient(clientDetailData)}
                        className="myarc-btn myarc-btn-primary"
                      >
                        ✏️ Edit Info
                      </button>
                    ) : (
                      <div className="myarc-flex myarc-gap-sm">
                        <button
                          onClick={() => handleUpdateClient(clientDetailData.id, editFormData)}
                          disabled={savingClient}
                          className="myarc-btn myarc-btn-primary"
                        >
                          {savingClient ? 'Saving...' : '💾 Save'}
                        </button>
                        <button
                          onClick={() => {
                            setEditingClient(null)
                            // Reset form data to original values - CORRECTE KOLOM NAMEN
                            setEditFormData({
                              current_weight: clientDetailData.current_weight || '',
                              height: clientDetailData.height || '',
                              days_per_week: clientDetailData.days_per_week || '',
                              meal_preferences: clientDetailData.meal_preferences || '',
                              injuries: clientDetailData.injuries || '',
                              medical_notes: clientDetailData.medical_notes || ''
                            })
                          }}
                          className="myarc-btn myarc-btn-outline"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="myarc-grid myarc-grid-2 myarc-gap-lg">
                    {/* Basic Info */}
                    <div className="myarc-info-section">
                      <h4 className="myarc-text-green myarc-mb-md">📋 Basic Information</h4>
                      <div className="myarc-info-grid">
                        <div className="myarc-info-item">
                          <strong>Email:</strong> {clientDetailData.email}
                        </div>
                        <div className="myarc-info-item">
                          <strong>Phone:</strong> {clientDetailData.phone || 'Not provided'}
                        </div>
                        <div className="myarc-info-item">
                          <strong>Goal:</strong> {clientDetailData.goal || 'Not specified'}
                        </div>
                        <div className="myarc-info-item">
                          <strong>Experience:</strong> {clientDetailData.experience || 'Not specified'}
                        </div>
                        <div className="myarc-info-item">
                          <strong>Status:</strong> {clientDetailData.status === 'active' ? '✅ Active' : '⏸️ Inactive'}
                        </div>
                      </div>
                    </div>

                    {/* Physical Info - EDITABLE */}
                    <div className="myarc-info-section">
                      <h4 className="myarc-text-green myarc-mb-md">📏 Physical Information</h4>
                      <div className="myarc-info-grid">
                        <div className="myarc-info-item">
                          <strong>Weight (kg):</strong>
                          {editingClient === clientDetailData.id ? (
                            <input
                              type="number"
                              value={editFormData.current_weight}
                              onChange={(e) => handleEditFormChange('current_weight', e.target.value)}
                              className="myarc-input myarc-input-sm myarc-mt-sm"
                              placeholder="Enter weight in kg"
                            />
                          ) : (
                            <span className="myarc-text-gray">
                              {clientDetailData.current_weight ? `${clientDetailData.current_weight} kg` : 'Not provided'}
                            </span>
                          )}
                        </div>
                        <div className="myarc-info-item">
                          <strong>Height (cm):</strong>
                          {editingClient === clientDetailData.id ? (
                            <input
                              type="number"
                              value={editFormData.height}
                              onChange={(e) => handleEditFormChange('height', e.target.value)}
                              className="myarc-input myarc-input-sm myarc-mt-sm"
                              placeholder="Enter height in cm"
                            />
                          ) : (
                            <span className="myarc-text-gray">
                              {clientDetailData.height ? `${clientDetailData.height} cm` : 'Not provided'}
                            </span>
                          )}
                        </div>
                        <div className="myarc-info-item">
                          <strong>Training Days/Week:</strong>
                          {editingClient === clientDetailData.id ? (
                            <select
                              value={editFormData.days_per_week}
                              onChange={(e) => handleEditFormChange('days_per_week', e.target.value)}
                              className="myarc-input myarc-input-sm myarc-mt-sm"
                            >
                              <option value="">Select days</option>
                              <option value="2">2 days</option>
                              <option value="3">3 days</option>
                              <option value="4">4 days</option>
                              <option value="5">5 days</option>
                              <option value="6">6 days</option>
                              <option value="7">7 days</option>
                            </select>
                          ) : (
                            <span className="myarc-text-gray">
                              {clientDetailData.days_per_week ? `${clientDetailData.days_per_week} days` : 'Not specified'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Medical & Preferences - EDITABLE */}
                    <div className="myarc-info-section" style={{gridColumn: '1 / -1'}}>
                      <h4 className="myarc-text-green myarc-mb-md">🏥 Medical & Health Information</h4>
                      <div className="myarc-grid myarc-grid-2 myarc-gap-md">
                        <div className="myarc-info-item">
                          <strong>Injuries & Physical Limitations:</strong>
                          {editingClient === clientDetailData.id ? (
                            <textarea
                              value={editFormData.injuries}
                              onChange={(e) => handleEditFormChange('injuries', e.target.value)}
                              rows="3"
                              className="myarc-textarea myarc-mt-sm"
                              placeholder="Any injuries, physical limitations, or movement restrictions..."
                            />
                          ) : (
                            <div className="myarc-text-gray myarc-mt-sm">
                              {clientDetailData.injuries || 'None reported'}
                            </div>
                          )}
                        </div>
                        <div className="myarc-info-item">
                          <strong>Medical Notes:</strong>
                          {editingClient === clientDetailData.id ? (
                            <textarea
                              value={editFormData.medical_notes}
                              onChange={(e) => handleEditFormChange('medical_notes', e.target.value)}
                              rows="3"
                              className="myarc-textarea myarc-mt-sm"
                              placeholder="Medical conditions, medications, doctor restrictions..."
                            />
                          ) : (
                            <div className="myarc-text-gray myarc-mt-sm">
                              {clientDetailData.medical_notes || 'None reported'}
                            </div>
                          )}
                        </div>
                      </div>

                      <h4 className="myarc-text-green myarc-mb-md myarc-mt-lg">🍽️ Meal Preferences</h4>
                      <div className="myarc-info-item">
                        <strong>Dietary Preferences:</strong>
                        {editingClient === clientDetailData.id ? (
                          <textarea
                            value={editFormData.meal_preferences}
                            onChange={(e) => handleEditFormChange('meal_preferences', e.target.value)}
                            rows="4"
                            className="myarc-textarea myarc-mt-sm"
                            placeholder="Favorite foods, cooking preferences, meal timing, dietary goals..."
                          />
                        ) : (
                          <div className="myarc-text-gray myarc-mt-sm">
                            {clientDetailData.meal_preferences || 'No preferences specified. Consider asking about dietary goals, favorite cuisines, and eating schedule.'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeDetailTab === 'plans' && (
                <div>
                  <div className="myarc-flex myarc-justify-between myarc-items-center myarc-mb-lg">
                    <h3 className="myarc-card-title">📋 Assigned Plans</h3>
                    <button
                      onClick={() => {
                        setSelectedClient(clientDetailData)
                        setShowSchemaModal(true)
                      }}
                      className="myarc-btn myarc-btn-primary"
                    >
                      ➕ Assign New Plan
                    </button>
                  </div>

                  {/* Workout Schema Section */}
                  <div className="myarc-mb-xl">
                    <h4 className="myarc-text-green myarc-mb-md">💪 Workout Schema</h4>
                    
                    {clientDetailData.assigned_schema_id ? (
                      (() => {
                        const assignedSchema = schemas.find(s => s.id === clientDetailData.assigned_schema_id)
                        if (assignedSchema) {
                          return (
                            <div className="myarc-schema-card myarc-schema-card-assigned">
                              <div className="myarc-flex myarc-justify-between myarc-items-start myarc-mb-md">
                                <div>
                                  <h5 className="myarc-text-green" style={{fontSize: 'var(--text-lg)', fontWeight: 'bold'}}>
                                    ✅ {assignedSchema.name}
                                  </h5>
                                  <p className="myarc-text-gray">{assignedSchema.description}</p>
                                </div>
                                <button
                                  onClick={() => {
                                    setSelectedClient(clientDetailData)
                                    setShowSchemaModal(true)
                                  }}
                                  className="myarc-btn myarc-btn-outline myarc-btn-sm"
                                >
                                  Change
                                </button>
                              </div>
                              
                              <div className="myarc-grid myarc-grid-3 myarc-gap-md myarc-mb-md">
                                <div className="myarc-stat-card">
                                  <div className="myarc-text-gray myarc-text-sm">Goal</div>
                                  <div className="myarc-text-green" style={{fontWeight: 'bold'}}>
                                    {assignedSchema.primary_goal}
                                  </div>
                                </div>
                                <div className="myarc-stat-card">
                                  <div className="myarc-text-gray myarc-text-sm">Days/Week</div>
                                  <div className="myarc-text-green" style={{fontWeight: 'bold'}}>
                                    {assignedSchema.days_per_week}
                                  </div>
                                </div>
                                <div className="myarc-stat-card">
                                  <div className="myarc-text-gray myarc-text-sm">Split Type</div>
                                  <div className="myarc-text-green" style={{fontWeight: 'bold'}}>
                                    {assignedSchema.split_name}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="myarc-flex myarc-gap-sm">
                                <span className="myarc-badge myarc-badge-success">Assigned ✅</span>
                                <span className="myarc-badge myarc-badge-info">
                                  {assignedSchema.difficulty || 'Intermediate'}
                                </span>
                              </div>
                            </div>
                          )
                        } else {
                          return (
                            <div className="myarc-alert myarc-alert-warning">
                              ⚠️ Schema ID found but schema not loaded. Try refreshing the page.
                            </div>
                          )
                        }
                      })()
                    ) : (
                      <div className="myarc-empty-state">
                        <div className="myarc-empty-icon">📋</div>
                        <h5 className="myarc-empty-title">No workout schema assigned</h5>
                        <p className="myarc-empty-subtitle">
                          Assign a workout schema to get {clientDetailData.first_name} started with their training.
                        </p>
                        <button
                          onClick={() => {
                            setSelectedClient(clientDetailData)
                            setShowSchemaModal(true)
                          }}
                          className="myarc-btn myarc-btn-primary"
                        >
                          📋 Assign Workout Schema
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Meal Plan Section */}
                  <div className="myarc-mb-xl">
                    <h4 className="myarc-text-green myarc-mb-md">🍽️ Meal Plan</h4>
                    <div className="myarc-empty-state">
                      <div className="myarc-empty-icon">🍽️</div>
                      <h5 className="myarc-empty-title">Meal plan assignment coming soon</h5>
                      <p className="myarc-empty-subtitle">
                        Custom meal planning and nutrition tracking will be available here.
                      </p>
                    </div>
                  </div>

                  {/* Bonus Content Section */}
                  <div>
                    <h4 className="myarc-text-green myarc-mb-md">🎁 Bonus Content</h4>
                    <div className="myarc-empty-state">
                      <div className="myarc-empty-icon">🎁</div>
                      <h5 className="myarc-empty-title">Bonus content assignment coming soon</h5>
                      <p className="myarc-empty-subtitle">
                        Extra workouts, educational content, and bonus features will be available here.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeDetailTab === 'nutrition' && (
                <div>
                  <h3 className="myarc-card-title myarc-mb-lg">🍎 Nutrition Profile</h3>
                  
                  <div className="myarc-grid myarc-grid-2 myarc-gap-lg myarc-mb-xl">
                    <div className="myarc-info-section">
                      <h4 className="myarc-text-green myarc-mb-md">Meal Preferences</h4>
                      <p className="myarc-text-gray">
                        {clientDetailData.meal_preferences || 'No specific preferences provided. Consider asking about dietary goals, favorite cuisines, and eating schedule.'}
                      </p>
                    </div>

                    <div className="myarc-info-section">
                      <h4 className="myarc-text-green myarc-mb-md">Injuries & Medical Notes</h4>
                      <p className="myarc-text-gray">
                        <strong>Injuries:</strong> {clientDetailData.injuries || 'None reported'}
                      </p>
                      <p className="myarc-text-gray myarc-mt-sm">
                        <strong>Medical Notes:</strong> {clientDetailData.medical_notes || 'None reported'}
                      </p>
                    </div>
                  </div>

                  <div className="myarc-alert myarc-alert-info myarc-mb-lg">
                    <h4 className="myarc-text-green myarc-mb-sm">💡 Meal Plan Assignment</h4>
                    <p className="myarc-text-gray myarc-text-sm">
                      Create custom meal plans based on this client's goals and preferences. Consider their fitness level and workout schedule when planning nutrition.
                    </p>
                  </div>

                  <button className="myarc-btn myarc-btn-primary myarc-btn-lg">
                    🍽️ Create Meal Plan for {clientDetailData.first_name}
                  </button>
                </div>
              )}

              {activeDetailTab === 'progress' && (
                <div>
                  <h3 className="myarc-card-title myarc-mb-lg">📈 Progress Tracking</h3>
                  
                  <div className="myarc-empty-state">
                    <div className="myarc-empty-icon">📊</div>
                    <h4 className="myarc-empty-title">Progress tracking coming soon</h4>
                    <p className="myarc-empty-subtitle">
                      Weight tracking, measurements, workout logs, and photo progress will be available here.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
