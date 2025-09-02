// src/coach/v2/1-client-management/pages/ClientCreateV2.jsx
import { useState, useEffect } from 'react'
import { User, Mail, Phone, Target, Edit2, Trash2, Search, X, Check, AlertCircle } from 'lucide-react'

export default function ClientCreateV2({ db, clients = [], refreshData, isMobile }) {
  // Form State
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
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

  // UI State
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedClient, setSelectedClient] = useState(null)
  const [editMode, setEditMode] = useState(false)
  const [notification, setNotification] = useState({ show: false, type: '', message: '' })

  // Filter clients based on search
  const filteredClients = clients.filter(client =>
    `${client.first_name} ${client.last_name} ${client.email}`.toLowerCase()
      .includes(searchTerm.toLowerCase())
  )

  // Show notification
  const showNotification = (type, message) => {
    setNotification({ show: true, type, message })
    setTimeout(() => setNotification({ show: false, type: '', message: '' }), 3000)
  }

  // Create Client - Using exact DatabaseService methods
  const handleCreateClient = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Get current trainer/coach user
      const currentUser = await db.getCurrentUser()
      if (!currentUser) {
        showNotification('error', 'No trainer logged in')
        setLoading(false)
        return
      }

      // Check for duplicate email
      const existing = await db.getClientByEmail(formData.email)
      if (existing) {
        showNotification('error', 'Email already exists')
        setLoading(false)
        return
      }

      // Clean data for database - matching original ClientManager format
      const clientData = {
        ...formData,
        current_weight: formData.current_weight ? Number(formData.current_weight) : null,
        height: formData.height ? Number(formData.height) : null,
        days_per_week: formData.days_per_week ? Number(formData.days_per_week) : null
      }

      // Use exact method from DatabaseService
      await db.createClient(clientData, currentUser.id)
      showNotification('success', 'Client created successfully!')
      
      // Reset form
      setFormData({
        email: '', password: '', firstName: '', lastName: '',
        phone: '', goal: '', experience: '', current_weight: '',
        height: '', days_per_week: '', meal_preferences: '',
        injuries: '', medical_notes: ''
      })
      setShowCreateForm(false)
      
      // Refresh parent data
      if (refreshData) refreshData()
      
    } catch (error) {
      console.error('Error creating client:', error)
      showNotification('error', 'Failed to create client: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // Update Client
  const handleUpdateClient = async () => {
    setLoading(true)
    
    try {
      const updates = {
        current_weight: formData.current_weight ? Number(formData.current_weight) : null,
        height: formData.height ? Number(formData.height) : null,
        days_per_week: formData.days_per_week ? Number(formData.days_per_week) : null,
        meal_preferences: formData.meal_preferences,
        injuries: formData.injuries,
        medical_notes: formData.medical_notes
      }

      await db.updateClient(selectedClient.id, updates)
      showNotification('success', 'Client updated successfully!')
      
      setEditMode(false)
      setSelectedClient(null)
      
      // Refresh parent data
      if (refreshData) refreshData()
      
    } catch (error) {
      console.error('Error updating client:', error)
      showNotification('error', 'Failed to update client')
    } finally {
      setLoading(false)
    }
  }

  // Delete Client
  const handleDeleteClient = async (clientId) => {
    if (!confirm('Are you sure you want to delete this client?')) return
    
    setLoading(true)
    
    try {
      await db.deleteClient(clientId)
      showNotification('success', 'Client deleted successfully!')
      
      if (selectedClient?.id === clientId) {
        setSelectedClient(null)
      }
      
      // Refresh parent data
      if (refreshData) refreshData()
      
    } catch (error) {
      console.error('Error deleting client:', error)
      showNotification('error', 'Failed to delete client')
    } finally {
      setLoading(false)
    }
  }

  // Open client detail
  const openClientDetail = (client) => {
    setSelectedClient(client)
    setEditMode(false)
    setFormData({
      email: client.email || '',
      password: '',
      firstName: client.first_name || '',
      lastName: client.last_name || '',
      phone: client.phone || '',
      goal: client.goal || '',
      experience: client.experience || '',
      current_weight: client.current_weight || '',
      height: client.height || '',
      days_per_week: client.days_per_week || '',
      meal_preferences: client.meal_preferences || '',
      injuries: client.injuries || '',
      medical_notes: client.medical_notes || ''
    })
  }

  return (
    <div style={{
      padding: isMobile ? '1rem' : '1.5rem',
      maxWidth: '1400px',
      margin: '0 auto'
    }}>
      {/* Header */}
      <div style={{
        background: '#111',
        borderRadius: '16px',
        padding: isMobile ? '1.5rem' : '2rem',
        marginBottom: '1.5rem',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <h1 style={{
          fontSize: isMobile ? '1.5rem' : '2rem',
          fontWeight: 'bold',
          color: '#fff',
          marginBottom: '0.5rem'
        }}>
          Client Management
        </h1>
        <p style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
          Create and manage your clients
        </p>
      </div>

      {/* Notification */}
      {notification.show && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: notification.type === 'success' ? '#10b981' : '#ef4444',
          color: '#fff',
          padding: '1rem 1.5rem',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          animation: 'slideIn 0.3s ease'
        }}>
          {notification.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
          {notification.message}
        </div>
      )}

      {/* Actions Bar */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        marginBottom: '1.5rem',
        flexWrap: 'wrap'
      }}>
        {/* Search */}
        <div style={{
          flex: isMobile ? '1 1 100%' : '1',
          position: 'relative'
        }}>
          <Search style={{
            position: 'absolute',
            left: '1rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'rgba(255, 255, 255, 0.4)'
          }} size={20} />
          <input
            type="text"
            placeholder="Search clients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem 1rem 0.75rem 3rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              color: '#fff',
              fontSize: isMobile ? '0.9rem' : '1rem'
            }}
          />
        </div>

        {/* Create Button */}
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          style={{
            padding: isMobile ? '0.75rem 1.5rem' : '0.875rem 2rem',
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            border: 'none',
            borderRadius: '12px',
            color: '#fff',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            minHeight: '44px',
            touchAction: 'manipulation',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 10px 25px rgba(59, 130, 246, 0.3)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          {showCreateForm ? <X size={20} /> : <User size={20} />}
          {showCreateForm ? 'Cancel' : 'New Client'}
        </button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div style={{
          background: '#111',
          borderRadius: '16px',
          padding: isMobile ? '1.5rem' : '2rem',
          marginBottom: '1.5rem',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)'
        }}>
          <h2 style={{
            fontSize: isMobile ? '1.2rem' : '1.5rem',
            fontWeight: 'bold',
            color: '#fff',
            marginBottom: '1.5rem'
          }}>
            Create New Client
          </h2>

          <form onSubmit={handleCreateClient}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
              gap: '1rem',
              marginBottom: '1rem'
            }}>
              {/* Basic Info */}
              <input
                type="text"
                placeholder="First Name *"
                value={formData.firstName}
                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                required
                style={{
                  padding: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: isMobile ? '0.9rem' : '1rem'
                }}
              />
              <input
                type="text"
                placeholder="Last Name *"
                value={formData.lastName}
                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                required
                style={{
                  padding: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: isMobile ? '0.9rem' : '1rem'
                }}
              />
              <input
                type="email"
                placeholder="Email *"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
                style={{
                  padding: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: isMobile ? '0.9rem' : '1rem'
                }}
              />
              <input
                type="password"
                placeholder="Password *"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required={!editMode}
                minLength={6}
                style={{
                  padding: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: isMobile ? '0.9rem' : '1rem'
                }}
              />
              <input
                type="tel"
                placeholder="Phone"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                style={{
                  padding: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: isMobile ? '0.9rem' : '1rem'
                }}
              />
              <select
                value={formData.goal}
                onChange={(e) => setFormData({...formData, goal: e.target.value})}
                style={{
                  padding: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: isMobile ? '0.9rem' : '1rem'
                }}
              >
                <option value="">Select Goal</option>
                <option value="Weight Loss">Weight Loss</option>
                <option value="Muscle Gain">Muscle Gain</option>
                <option value="Strength">Strength</option>
                <option value="General Fitness">General Fitness</option>
              </select>
            </div>

            {/* Physical Info */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
              gap: '1rem',
              marginBottom: '1rem'
            }}>
              <input
                type="number"
                placeholder="Weight (kg)"
                value={formData.current_weight}
                onChange={(e) => setFormData({...formData, current_weight: e.target.value})}
                style={{
                  padding: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: isMobile ? '0.9rem' : '1rem'
                }}
              />
              <input
                type="number"
                placeholder="Height (cm)"
                value={formData.height}
                onChange={(e) => setFormData({...formData, height: e.target.value})}
                style={{
                  padding: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: isMobile ? '0.9rem' : '1rem'
                }}
              />
              <select
                value={formData.days_per_week}
                onChange={(e) => setFormData({...formData, days_per_week: e.target.value})}
                style={{
                  padding: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: isMobile ? '0.9rem' : '1rem'
                }}
              >
                <option value="">Training Days</option>
                <option value="2">2 days/week</option>
                <option value="3">3 days/week</option>
                <option value="4">4 days/week</option>
                <option value="5">5 days/week</option>
                <option value="6">6 days/week</option>
              </select>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: isMobile ? '0.875rem' : '1rem',
                background: loading 
                  ? 'rgba(59, 130, 246, 0.5)'
                  : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                border: 'none',
                borderRadius: '12px',
                color: '#fff',
                fontWeight: '600',
                fontSize: isMobile ? '0.9rem' : '1rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                minHeight: '44px',
                transition: 'all 0.3s ease'
              }}
            >
              {loading ? 'Creating...' : 'Create Client'}
            </button>
          </form>
        </div>
      )}

      {/* Clients Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(350px, 1fr))',
        gap: '1rem'
      }}>
        {filteredClients.map(client => (
          <div
            key={client.id}
            style={{
              background: '#111',
              borderRadius: '16px',
              padding: isMobile ? '1.25rem' : '1.5rem',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onClick={() => openClientDetail(client)}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
            }}
          >
            {/* Client Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'start',
              marginBottom: '1rem'
            }}>
              <div>
                <h3 style={{
                  fontSize: isMobile ? '1.1rem' : '1.25rem',
                  fontWeight: 'bold',
                  color: '#3b82f6',
                  marginBottom: '0.25rem'
                }}>
                  {client.first_name} {client.last_name}
                </h3>
                <p style={{
                  fontSize: isMobile ? '0.85rem' : '0.9rem',
                  color: 'rgba(255, 255, 255, 0.6)'
                }}>
                  {client.email}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    openClientDetail(client)
                    setEditMode(true)
                  }}
                  style={{
                    padding: '0.5rem',
                    background: 'rgba(59, 130, 246, 0.1)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    borderRadius: '8px',
                    color: '#3b82f6',
                    cursor: 'pointer',
                    minWidth: '36px',
                    minHeight: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteClient(client.id)
                  }}
                  style={{
                    padding: '0.5rem',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '8px',
                    color: '#ef4444',
                    cursor: 'pointer',
                    minWidth: '36px',
                    minHeight: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {/* Client Info */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.5rem',
              fontSize: isMobile ? '0.85rem' : '0.9rem',
              color: 'rgba(255, 255, 255, 0.7)'
            }}>
              {client.phone && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Phone size={14} />
                  {client.phone}
                </div>
              )}
              {client.goal && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Target size={14} />
                  {client.goal}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Client Detail Modal */}
      {selectedClient && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          zIndex: 1000
        }}>
          <div style={{
            background: '#111',
            borderRadius: '20px',
            padding: isMobile ? '1.5rem' : '2rem',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflow: 'auto',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}>
              <h2 style={{
                fontSize: isMobile ? '1.3rem' : '1.5rem',
                fontWeight: 'bold',
                color: '#fff'
              }}>
                {editMode ? 'Edit Client' : 'Client Details'}
              </h2>
              <button
                onClick={() => {
                  setSelectedClient(null)
                  setEditMode(false)
                }}
                style={{
                  padding: '0.5rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  cursor: 'pointer',
                  minWidth: '36px',
                  minHeight: '36px'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            {editMode ? (
              <div>
                {/* Edit Form */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem' }}>
                      Weight (kg)
                    </label>
                    <input
                      type="number"
                      value={formData.current_weight}
                      onChange={(e) => setFormData({...formData, current_weight: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        color: '#fff',
                        marginTop: '0.25rem'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem' }}>
                      Height (cm)
                    </label>
                    <input
                      type="number"
                      value={formData.height}
                      onChange={(e) => setFormData({...formData, height: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        color: '#fff',
                        marginTop: '0.25rem'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem' }}>
                      Meal Preferences
                    </label>
                    <textarea
                      value={formData.meal_preferences}
                      onChange={(e) => setFormData({...formData, meal_preferences: e.target.value})}
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        color: '#fff',
                        marginTop: '0.25rem',
                        resize: 'vertical'
                      }}
                    />
                  </div>
                  <button
                    onClick={handleUpdateClient}
                    disabled={loading}
                    style={{
                      padding: '0.875rem',
                      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                      border: 'none',
                      borderRadius: '12px',
                      color: '#fff',
                      fontWeight: '600',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      minHeight: '44px'
                    }}
                  >
                    {loading ? 'Updating...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {/* View Details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{
                    padding: '1rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '12px'
                  }}>
                    <h3 style={{ color: '#3b82f6', marginBottom: '0.5rem' }}>Contact Info</h3>
                    <p style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      Email: {selectedClient.email}
                    </p>
                    <p style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      Phone: {selectedClient.phone || 'Not provided'}
                    </p>
                  </div>
                  <div style={{
                    padding: '1rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '12px'
                  }}>
                    <h3 style={{ color: '#3b82f6', marginBottom: '0.5rem' }}>Physical Info</h3>
                    <p style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      Weight: {selectedClient.current_weight ? `${selectedClient.current_weight} kg` : 'Not provided'}
                    </p>
                    <p style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      Height: {selectedClient.height ? `${selectedClient.height} cm` : 'Not provided'}
                    </p>
                  </div>
                  <button
                    onClick={() => setEditMode(true)}
                    style={{
                      padding: '0.875rem',
                      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                      border: 'none',
                      borderRadius: '12px',
                      color: '#fff',
                      fontWeight: '600',
                      cursor: 'pointer',
                      minHeight: '44px'
                    }}
                  >
                    Edit Client
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Animations */}
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}
