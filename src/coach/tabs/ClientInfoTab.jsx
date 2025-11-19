// src/coach/tabs/ClientInfoTab.jsx - RLS FIX VERSION
import { useState, useEffect } from 'react'
import { User, Weight, Target, Activity, Heart, Brain, FileText, Ruler, Plus, X, Save, AlertCircle, Shield, Trash2 } from 'lucide-react'

// Import sub-tabs
import BasicInfoTab from './client-info/BasicInfoTab'
import PhysicalInfoTab from './client-info/PhysicalInfoTab'
import GoalsInfoTab from './client-info/GoalsInfoTab'
import LifestyleInfoTab from './client-info/LifestyleInfoTab'
import HealthInfoTab from './client-info/HealthInfoTab'
import NutritionInfoTab from './client-info/NutritionInfoTab'
import NotesInfoTab from './client-info/NotesInfoTab'
import MeasurementsTab from './client-info/MeasurementsTab'

export default function ClientInfoTab({ db, isMobile }) {
  const [activeSection, setActiveSection] = useState('basic')
  const [selectedClient, setSelectedClient] = useState(null)
  const [clients, setClients] = useState([])
  const [loadingClients, setLoadingClients] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showAddClient, setShowAddClient] = useState(false)
  const [addClientLoading, setAddClientLoading] = useState(false)
  const [showDiagnostics, setShowDiagnostics] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [newClientData, setNewClientData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    currentWeight: '',
    targetWeight: '',
    height: ''
  })

  // Tab configuration
  const sections = [
    { id: 'basic', label: 'Basic', icon: User, component: BasicInfoTab },
    { id: 'physical', label: 'Physical', icon: Weight, component: PhysicalInfoTab },
    { id: 'goals', label: 'Goals', icon: Target, component: GoalsInfoTab },
    { id: 'lifestyle', label: 'Lifestyle', icon: Activity, component: LifestyleInfoTab },
    { id: 'health', label: 'Health', icon: Heart, component: HealthInfoTab },
    { id: 'nutrition', label: 'Nutrition', icon: Brain, component: NutritionInfoTab },
    { id: 'measurements', label: 'Measurements', icon: Ruler, component: MeasurementsTab },
    { id: 'notes', label: 'Notes', icon: FileText, component: NotesInfoTab }
  ]
  
  // Load clients on mount
  useEffect(() => {
    loadClients()
    checkRLSPolicies() // Check RLS on mount
  }, [])
  
  const loadClients = async () => {
    setLoadingClients(true)
    try {
      // Clear cache to ensure fresh data
      db.clearCache('clients')
      
      const clientsData = await db.getClients()
      console.log('📋 Loaded clients:', clientsData?.length || 0)
      setClients(clientsData || [])
      
      // Auto-select first client if available
      if (clientsData && clientsData.length > 0 && !selectedClient) {
        setSelectedClient(clientsData[0])
      }
    } catch (error) {
      console.error('Error loading clients:', error)
      setClients([])
    } finally {
      setLoadingClients(false)
    }
  }

  // NEW: RLS Policy Checker
  const checkRLSPolicies = async () => {
    try {
      console.log('🔍 Checking RLS policies...')
      
      // Get current user
      const currentUser = await db.getCurrentUser()
      console.log('Current coach:', currentUser?.email, 'ID:', currentUser?.id)
      
      // Test direct query
      const { data: testClients, error: testError } = await db.supabase
        .from('clients')
        .select('id, email, trainer_id, coach_id')
        .limit(5)
      
      if (testError) {
        console.error('❌ RLS Test failed:', testError)
        return false
      }
      
      console.log('✅ RLS Test passed. Found clients:', testClients?.length)
      testClients?.forEach(c => {
        console.log(`- ${c.email}: trainer_id=${c.trainer_id}, coach_id=${c.coach_id}`)
      })
      
      return true
    } catch (error) {
      console.error('❌ RLS Check error:', error)
      return false
    }
  }

  // 🗑️ DELETE CLIENT HANDLER
  const handleDeleteClient = async () => {
    if (!selectedClient) return
    
    try {
      setDeleteLoading(true)
      console.log('🗑️ Deleting client:', selectedClient.id)
      
      // Store client info for next selection
      const clientToDelete = selectedClient
      const currentIndex = clients.findIndex(c => c.id === clientToDelete.id)
      const nextClientEmail = clients[currentIndex + 1]?.email || clients[currentIndex - 1]?.email
      
      // Clear caches before delete
      db.clearCache('clients')
      db.clearCache(`client_${clientToDelete.id}`)
      
      // Call DatabaseService deleteClient method
      await db.deleteClient(clientToDelete.id)
      
      console.log('✅ Client deleted successfully')
      
      // Clear cache again after delete
      db.clearCache('clients')
      
      // Close confirmation dialog
      setShowDeleteConfirm(false)
      
      // 🎯 INSTANT UI UPDATE: Filter client from state
      console.log('🎯 Updating UI state...')
      const updatedClients = clients.filter(c => c.id !== clientToDelete.id)
      setClients(updatedClients)
      console.log('✅ Clients updated:', updatedClients.length)
      
      // Select next client from filtered list
      if (updatedClients.length > 0) {
        const nextClient = updatedClients.find(c => c.email === nextClientEmail) || updatedClients[0]
        setSelectedClient(nextClient)
        console.log('✅ Selected next client:', nextClient.email)
      } else {
        setSelectedClient(null)
        console.log('📋 No clients remaining')
      }
      
      alert(`✅ ${clientToDelete.first_name} ${clientToDelete.last_name} has been removed from your system`)
      
    } catch (error) {
      console.error('❌ Delete client failed:', error)
      alert(`❌ Failed to delete client: ${error.message}`)
    } finally {
      setDeleteLoading(false)
    }
  }

  // ENHANCED: Add Client with proper trainer_id/coach_id
  const handleAddClient = async () => {
    try {
      setAddClientLoading(true)
      
      // Validation
      if (!newClientData.firstName || !newClientData.lastName || !newClientData.email || !newClientData.password) {
        alert('❌ Please fill in all required fields')
        return
      }

      // Password validation
      if (newClientData.password.length < 6) {
        alert('❌ Password must be at least 6 characters')
        return
      }

      // Get current coach user FIRST
      const currentUser = await db.getCurrentUser()
      if (!currentUser?.id) {
        alert('❌ Coach user not found. Please refresh and try again.')
        return
      }
      console.log('🔐 Current coach ID:', currentUser.id)

      // Check if email already exists in clients table
      const existingClient = await db.getClientByEmail(newClientData.email)
      if (existingClient) {
        alert('❌ A client with this email already exists in your client list')
        return
      }

      // Try to create auth user
      const { data: authData, error: authError } = await db.supabase.auth.signUp({
        email: newClientData.email,
        password: newClientData.password,
        options: {
          emailRedirectTo: undefined,
          data: {
            full_name: `${newClientData.firstName} ${newClientData.lastName}`,
            role: 'client' // Mark as client role
          }
        }
      })
      
      if (authError) {
        // Handle specific error cases
        if (authError.message.includes('already registered')) {
          const confirmLink = confirm(
            '⚠️ This email already has an account. Do you want to link it to your client list?\n\n' +
            'Click OK to add them as your client (they can use their existing password).\n' +
            'Click Cancel to use a different email.'
          )
          
          if (confirmLink) {
            // Try to find existing user's ID via admin API or create without auth_user_id
            await createClientRecord(null, currentUser.id)
            return
          } else {
            return
          }
        }
        
        throw authError
      }

      // Create client record with new auth user
      await createClientRecord(authData.user?.id, currentUser.id)
      
    } catch (error) {
      console.error('Error adding client:', error)
      alert(`❌ Error: ${error.message}`)
    } finally {
      setAddClientLoading(false)
    }
  }

  // ENHANCED: Helper function with explicit trainer_id
  const createClientRecord = async (authUserId, coachId) => {
    try {
      console.log('📝 Creating client record with:', {
        authUserId,
        coachId,
        email: newClientData.email
      })

      // Build client data with BOTH trainer_id and coach_id
      const clientData = {
        first_name: newClientData.firstName,
        last_name: newClientData.lastName,
        email: newClientData.email,
        phone: newClientData.phone || null,
        current_weight: newClientData.currentWeight ? parseFloat(newClientData.currentWeight) : null,
        target_weight: newClientData.targetWeight ? parseFloat(newClientData.targetWeight) : null,
        height: newClientData.height ? parseInt(newClientData.height) : null,
        auth_user_id: authUserId,
        trainer_id: coachId, // Explicit trainer_id
        coach_id: coachId,   // Also set coach_id for compatibility
        // subscription_status removed - doesn't exist in table
        created_at: new Date().toISOString()
      }
      
      // Direct insert with explicit fields
      const { data: newClient, error: insertError } = await db.supabase
        .from('clients')
        .insert(clientData)
        .select()
        .single()
      
      if (insertError) {
        console.error('❌ Insert error:', insertError)
        throw insertError
      }
      
      if (!newClient) {
        throw new Error('Failed to create client record')
      }
      
      console.log('✅ Client created successfully:', newClient)
      
      // Verify the client can be read back
      const { data: verifyClient, error: verifyError } = await db.supabase
        .from('clients')
        .select('*')
        .eq('id', newClient.id)
        .single()
      
      if (verifyError) {
        console.warn('⚠️ Created but cannot read back - RLS issue:', verifyError)
      } else {
        console.log('✅ Verify read successful:', verifyClient?.email)
      }
      
      // Success! Reload clients
      await loadClients()
      
      // Reset form
      setNewClientData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        phone: '',
        currentWeight: '',
        targetWeight: '',
        height: ''
      })
      setShowAddClient(false)
      
      // Show success message
      if (authUserId) {
        alert(
          `✅ Client added successfully!\n\n` +
          `Email: ${newClientData.email}\n` +
          `Password: ${newClientData.password}\n\n` +
          `The client can now login with these credentials.\n\n` +
          `⚠️ If login fails, check RLS policies in Supabase.`
        )
      } else {
        alert(`✅ Client linked successfully!\n\n${newClientData.firstName} can login with their existing password.`)
      }
      
    } catch (error) {
      console.error('Error creating client record:', error)
      throw error
    }
  }

  // NEW: Run RLS Diagnostics
  const runDiagnostics = async () => {
    const results = []
    
    try {
      // 1. Check current user
      const user = await db.getCurrentUser()
      results.push(`✅ Current user: ${user?.email} (ID: ${user?.id})`)
      
      // 2. Check clients table access
      const { data: clients, error: clientError } = await db.supabase
        .from('clients')
        .select('id, email, trainer_id, coach_id')
        .limit(3)
      
      if (clientError) {
        results.push(`❌ Clients table: ${clientError.message}`)
      } else {
        results.push(`✅ Clients table: Can read ${clients?.length || 0} records`)
        clients?.forEach(c => {
          const isYours = c.trainer_id === user?.id || c.coach_id === user?.id
          results.push(`  - ${c.email}: ${isYours ? '✅ Yours' : '❌ Not yours'}`)
        })
      }
      
      // 3. Test insert capability
      const testData = {
        first_name: 'TEST',
        last_name: 'DELETE',
        email: `test-${Date.now()}@test.com`,
        trainer_id: user?.id,
        coach_id: user?.id
      }
      
      const { error: insertError } = await db.supabase
        .from('clients')
        .insert(testData)
      
      if (insertError) {
        results.push(`❌ Insert test: ${insertError.message}`)
      } else {
        results.push(`✅ Insert test: Can create new clients`)
        // Clean up test
        await db.supabase
          .from('clients')
          .delete()
          .eq('email', testData.email)
      }
      
    } catch (error) {
      results.push(`❌ Diagnostic error: ${error.message}`)
    }
    
    alert('🔍 RLS DIAGNOSTICS:\n\n' + results.join('\n'))
  }

  const handleClientChange = (clientId) => {
    const client = clients.find(c => c.id === clientId)
    setSelectedClient(client)
    setIsEditing(false)
  }
  
  const handleSave = async () => {
    setSaving(true)
    // Save will be handled by the active tab component
    setSaving(false)
  }
  
  const handleRefresh = async () => {
    await loadClients()
    if (selectedClient) {
      const updatedClient = clients.find(c => c.id === selectedClient.id)
      setSelectedClient(updatedClient)
    }
  }
  
  // Get current tab component
  const currentSection = sections.find(s => s.id === activeSection)
  const TabComponent = currentSection?.component
  
  // Loading state
  if (loadingClients) {
    return (
      <div style={{
        padding: isMobile ? '1rem' : '2rem',
        textAlign: 'center'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid rgba(16, 185, 129, 0.2)',
          borderTopColor: '#10b981',
          borderRadius: '50%',
          margin: '0 auto',
          animation: 'spin 1s linear infinite'
        }} />
        <p style={{
          marginTop: '1rem',
          color: 'rgba(255, 255, 255, 0.5)'
        }}>
          Loading clients...
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }
  
  // Empty state - no clients
  if (!loadingClients && clients.length === 0) {
    return (
      <div style={{
        padding: isMobile ? '1rem' : '2rem',
        textAlign: 'center'
      }}>
        <div style={{
          padding: '3rem',
          background: 'rgba(16, 185, 129, 0.05)',
          borderRadius: '16px',
          border: '1px solid rgba(16, 185, 129, 0.1)'
        }}>
          <User size={48} color="#10b981" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: '#fff',
            marginBottom: '0.5rem'
          }}>
            No Clients Yet
          </h3>
          <p style={{
            color: 'rgba(255, 255, 255, 0.5)',
            fontSize: '0.9rem',
            marginBottom: '1.5rem'
          }}>
            Create your first client to get started
          </p>
          <div style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={() => setShowAddClient(true)}
              style={{
                padding: isMobile ? '0.75rem 1.5rem' : '0.875rem 2rem',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                border: 'none',
                borderRadius: '10px',
                color: '#fff',
                fontSize: isMobile ? '0.9rem' : '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                transition: 'all 0.3s ease'
              }}
            >
              <Plus size={18} />
              Add First Client
            </button>
            
            <button
              onClick={runDiagnostics}
              style={{
                padding: isMobile ? '0.75rem 1.5rem' : '0.875rem 2rem',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '10px',
                color: '#ef4444',
                fontSize: isMobile ? '0.9rem' : '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              <Shield size={18} />
              Run RLS Diagnostics
            </button>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div style={{
      padding: isMobile ? '1rem' : '2rem',
      maxWidth: '1400px',
      margin: '0 auto'
    }}>
      {/* Client Selector Header */}
      <div style={{
        marginBottom: '1.5rem',
        padding: isMobile ? '1rem' : '1.25rem',
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(16, 185, 129, 0.02) 100%)',
        borderRadius: '16px',
        border: '1px solid rgba(16, 185, 129, 0.1)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: isMobile ? 'wrap' : 'nowrap'
        }}>
          <div style={{ flex: 1 }}>
            <label style={{
              display: 'block',
              fontSize: isMobile ? '0.8rem' : '0.85rem',
              color: 'rgba(255, 255, 255, 0.6)',
              marginBottom: '0.5rem',
              fontWeight: '500'
            }}>
              Select Client
            </label>
            <select
              value={selectedClient?.id || ''}
              onChange={(e) => handleClientChange(e.target.value)}
              disabled={loadingClients}
              style={{
                width: '100%',
                padding: isMobile ? '0.75rem' : '0.875rem',
                background: 'rgba(0, 0, 0, 0.5)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: isMobile ? '0.95rem' : '1rem',
                fontWeight: '500',
                cursor: 'pointer',
                outline: 'none',
                transition: 'all 0.2s ease',
                minHeight: '44px',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#10b981'
                e.target.style.boxShadow = '0 0 0 2px rgba(16, 185, 129, 0.1)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(16, 185, 129, 0.3)'
                e.target.style.boxShadow = 'none'
              }}
            >
              <option value="" disabled>Choose a client...</option>
              {clients.map(c => (
                <option key={c.id} value={c.id} style={{ background: '#111' }}>
                  {c.first_name} {c.last_name} - {c.email}
                  {c.current_weight && ` (${c.current_weight}kg)`}
                </option>
              ))}
            </select>
          </div>
          
          {selectedClient && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <div style={{
                padding: '0.75rem',
                background: 'rgba(16, 185, 129, 0.1)',
                borderRadius: '12px',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                textAlign: 'center',
                minWidth: isMobile ? '80px' : '100px'
              }}>
                <div style={{
                  fontSize: isMobile ? '1.25rem' : '1.5rem',
                  fontWeight: 'bold',
                  color: '#10b981'
                }}>
                  {selectedClient.profile_completion || 0}%
                </div>
                <div style={{
                  fontSize: isMobile ? '0.7rem' : '0.75rem',
                  color: 'rgba(255, 255, 255, 0.5)'
                }}>
                  Complete
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          marginTop: '1rem'
        }}>
          <button
            onClick={() => setShowAddClient(true)}
            style={{
              flex: 1,
              padding: isMobile ? '0.75rem 1rem' : '0.875rem 1.25rem',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              border: 'none',
              borderRadius: '10px',
              color: '#fff',
              fontSize: isMobile ? '0.85rem' : '0.9rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              minHeight: '44px',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              transition: 'all 0.3s ease',
              transform: 'translateZ(0)'
            }}
            onTouchStart={(e) => {
              if (isMobile) {
                e.currentTarget.style.transform = 'scale(0.98)'
              }
            }}
            onTouchEnd={(e) => {
              if (isMobile) {
                e.currentTarget.style.transform = 'scale(1)'
              }
            }}
          >
            <Plus size={18} />
            Add New Client
          </button>
          
          {/* 🗑️ DELETE CLIENT BUTTON */}
          {selectedClient && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={deleteLoading}
              style={{
                flex: 1,
                padding: isMobile ? '0.75rem 1rem' : '0.875rem 1.25rem',
                background: deleteLoading 
                  ? 'rgba(239, 68, 68, 0.3)' 
                  : 'linear-gradient(135deg, #ef4444, #dc2626)',
                border: 'none',
                borderRadius: '10px',
                color: '#fff',
                fontSize: isMobile ? '0.85rem' : '0.9rem',
                fontWeight: '600',
                cursor: deleteLoading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                minHeight: '44px',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                transition: 'all 0.3s ease',
                transform: 'translateZ(0)',
                opacity: deleteLoading ? 0.7 : 1
              }}
              onTouchStart={(e) => {
                if (isMobile && !deleteLoading) {
                  e.currentTarget.style.transform = 'scale(0.98)'
                }
              }}
              onTouchEnd={(e) => {
                if (isMobile && !deleteLoading) {
                  e.currentTarget.style.transform = 'scale(1)'
                }
              }}
            >
              <Trash2 size={16} />
              {deleteLoading ? 'Deleting...' : 'Delete'}
            </button>
          )}
          
          <button
            onClick={runDiagnostics}
            style={{
              padding: isMobile ? '0.75rem' : '0.875rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: isMobile ? '0.85rem' : '0.9rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              minHeight: '44px',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
            title="Check database permissions"
          >
            <Shield size={16} />
            {!isMobile && 'RLS Check'}
          </button>
        </div>
      </div>
      
      {/* Tab Navigation */}
      {selectedClient && (
        <div style={{
          display: 'flex',
          gap: '0.25rem',
          marginBottom: '1.5rem',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          paddingBottom: '0.5rem'
        }}>
          {sections.map(section => {
            const Icon = section.icon
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                style={{
                  padding: isMobile ? '0.5rem 0.75rem' : '0.6rem 1rem',
                  background: activeSection === section.id
                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%)'
                    : 'rgba(255, 255, 255, 0.02)',
                  border: `1px solid ${activeSection === section.id ? '#10b981' : 'rgba(255, 255, 255, 0.1)'}`,
                  borderRadius: '8px',
                  color: activeSection === section.id ? '#10b981' : 'rgba(255, 255, 255, 0.6)',
                  fontSize: isMobile ? '0.75rem' : '0.85rem',
                  fontWeight: activeSection === section.id ? '600' : '400',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  minHeight: '44px',
                  transform: 'translateZ(0)'
                }}
                onTouchStart={(e) => {
                  if (isMobile && activeSection !== section.id) {
                    e.currentTarget.style.transform = 'scale(0.98)'
                  }
                }}
                onTouchEnd={(e) => {
                  if (isMobile) {
                    e.currentTarget.style.transform = 'scale(1)'
                  }
                }}
              >
                <Icon size={isMobile ? 14 : 16} />
                {!isMobile && section.label}
              </button>
            )
          })}
        </div>
      )}
      
      {/* Tab Content */}
      {selectedClient && TabComponent && (
        <div style={{
          animation: 'fadeIn 0.3s ease'
        }}>
          <TabComponent
            db={db}
            client={selectedClient}
            isEditing={isEditing}
            setIsEditing={setIsEditing}
            saving={saving}
            setSaving={setSaving}
            onRefresh={handleRefresh}
            isMobile={isMobile}
          />
        </div>
      )}
      
      {/* Add Client Modal */}
      {showAddClient && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: '#111',
            borderRadius: '16px',
            padding: isMobile ? '1.5rem' : '2rem',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            border: '1px solid rgba(16, 185, 129, 0.2)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}>
              <h3 style={{ 
                color: '#fff', 
                fontSize: isMobile ? '1.1rem' : '1.25rem',
                fontWeight: '600'
              }}>
                Add New Client
              </h3>
              <button
                onClick={() => setShowAddClient(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.5)',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent'
                }}
              >
                <X size={24} />
              </button>
            </div>
            
            {/* Form fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                gap: '1rem'
              }}>
                <input
                  placeholder="First Name *"
                  value={newClientData.firstName}
                  onChange={(e) => setNewClientData({...newClientData, firstName: e.target.value})}
                  style={{
                    padding: isMobile ? '0.75rem' : '0.875rem',
                    background: 'rgba(0, 0, 0, 0.5)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: isMobile ? '0.95rem' : '1rem',
                    minHeight: '44px'
                  }}
                />
                <input
                  placeholder="Last Name *"
                  value={newClientData.lastName}
                  onChange={(e) => setNewClientData({...newClientData, lastName: e.target.value})}
                  style={{
                    padding: isMobile ? '0.75rem' : '0.875rem',
                    background: 'rgba(0, 0, 0, 0.5)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: isMobile ? '0.95rem' : '1rem',
                    minHeight: '44px'
                  }}
                />
              </div>
              
              <input
                placeholder="Email *"
                type="email"
                value={newClientData.email}
                onChange={(e) => setNewClientData({...newClientData, email: e.target.value})}
                style={{
                  padding: isMobile ? '0.75rem' : '0.875rem',
                  background: 'rgba(0, 0, 0, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: isMobile ? '0.95rem' : '1rem',
                  minHeight: '44px'
                }}
              />
              
              <input
                placeholder="Password * (min 6 characters)"
                type="password"
                value={newClientData.password}
                onChange={(e) => setNewClientData({...newClientData, password: e.target.value})}
                style={{
                  padding: isMobile ? '0.75rem' : '0.875rem',
                  background: 'rgba(0, 0, 0, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: isMobile ? '0.95rem' : '1rem',
                  minHeight: '44px'
                }}
              />
              
              <input
                placeholder="Phone"
                type="tel"
                value={newClientData.phone}
                onChange={(e) => setNewClientData({...newClientData, phone: e.target.value})}
                style={{
                  padding: isMobile ? '0.75rem' : '0.875rem',
                  background: 'rgba(0, 0, 0, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: isMobile ? '0.95rem' : '1rem',
                  minHeight: '44px'
                }}
              />
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr',
                gap: '1rem'
              }}>
                <input
                  placeholder="Height (cm)"
                  type="number"
                  value={newClientData.height}
                  onChange={(e) => setNewClientData({...newClientData, height: e.target.value})}
                  style={{
                    padding: isMobile ? '0.75rem' : '0.875rem',
                    background: 'rgba(0, 0, 0, 0.5)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: isMobile ? '0.95rem' : '1rem',
                    minHeight: '44px'
                  }}
                />
                <input
                  placeholder="Current Weight (kg)"
                  type="number"
                  step="0.1"
                  value={newClientData.currentWeight}
                  onChange={(e) => setNewClientData({...newClientData, currentWeight: e.target.value})}
                  style={{
                    padding: isMobile ? '0.75rem' : '0.875rem',
                    background: 'rgba(0, 0, 0, 0.5)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: isMobile ? '0.95rem' : '1rem',
                    minHeight: '44px'
                  }}
                />
                <input
                  placeholder="Target Weight (kg)"
                  type="number"
                  step="0.1"
                  value={newClientData.targetWeight}
                  onChange={(e) => setNewClientData({...newClientData, targetWeight: e.target.value})}
                  style={{
                    padding: isMobile ? '0.75rem' : '0.875rem',
                    background: 'rgba(0, 0, 0, 0.5)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: isMobile ? '0.95rem' : '1rem',
                    minHeight: '44px'
                  }}
                />
              </div>
              
              {/* Warning box */}
              <div style={{
                padding: '1rem',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '8px'
              }}>
                <div style={{
                  display: 'flex',
                  gap: '0.5rem',
                  alignItems: 'flex-start'
                }}>
                  <AlertCircle size={16} color="#ef4444" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <div>
                    <p style={{
                      color: '#ef4444',
                      fontSize: isMobile ? '0.8rem' : '0.85rem',
                      margin: '0 0 0.5rem 0',
                      fontWeight: '600'
                    }}>
                      RLS Policy Issue Detected
                    </p>
                    <p style={{
                      color: 'rgba(255, 255, 255, 0.6)',
                      fontSize: isMobile ? '0.75rem' : '0.8rem',
                      margin: 0,
                      lineHeight: '1.4'
                    }}>
                      After creating the client, if they cannot login, you need to update the RLS policies in Supabase. 
                      Make sure the clients table allows users to read their own records where auth.uid() = auth_user_id.
                    </p>
                  </div>
                </div>
              </div>
              
              <button
                onClick={handleAddClient}
                disabled={addClientLoading}
                style={{
                  padding: isMobile ? '0.875rem' : '1rem',
                  background: addClientLoading 
                    ? 'rgba(16, 185, 129, 0.5)' 
                    : 'linear-gradient(135deg, #10b981, #059669)',
                  border: 'none',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: isMobile ? '0.95rem' : '1rem',
                  fontWeight: '600',
                  cursor: addClientLoading ? 'not-allowed' : 'pointer',
                  opacity: addClientLoading ? 0.7 : 1,
                  minHeight: '44px',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  transition: 'all 0.3s ease'
                }}
              >
                {addClientLoading ? 'Creating Client...' : 'Create Client'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 🗑️ DELETE CONFIRMATION MODAL */}
      {showDeleteConfirm && selectedClient && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem',
          animation: 'fadeIn 0.2s ease'
        }}>
          <div style={{
            background: '#111',
            borderRadius: '16px',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            maxWidth: '500px',
            width: '100%',
            padding: isMobile ? '1.5rem' : '2rem',
            animation: 'fadeIn 0.3s ease',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)'
          }}>
            {/* Warning Icon */}
            <div style={{
              width: isMobile ? '60px' : '70px',
              height: isMobile ? '60px' : '70px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '2px solid rgba(239, 68, 68, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem'
            }}>
              <AlertCircle size={isMobile ? 32 : 40} color="#ef4444" />
            </div>

            <h2 style={{
              fontSize: isMobile ? '1.25rem' : '1.5rem',
              fontWeight: 'bold',
              color: '#fff',
              textAlign: 'center',
              marginBottom: '0.75rem'
            }}>
              Delete Client?
            </h2>

            <p style={{
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: isMobile ? '0.9rem' : '0.95rem',
              textAlign: 'center',
              lineHeight: '1.6',
              marginBottom: '1.5rem'
            }}>
              Are you sure you want to remove{' '}
              <strong style={{ color: '#10b981' }}>
                {selectedClient.first_name} {selectedClient.last_name}
              </strong>{' '}
              from your system?
              <br /><br />
              <strong style={{ color: '#ef4444' }}>This action cannot be undone.</strong>
              <br />
              All data associated with this client will be permanently deleted.
            </p>

            <div style={{
              display: 'flex',
              gap: '0.75rem',
              marginTop: '2rem'
            }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleteLoading}
                style={{
                  flex: 1,
                  padding: isMobile ? '0.875rem' : '1rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: isMobile ? '0.9rem' : '0.95rem',
                  fontWeight: '600',
                  cursor: deleteLoading ? 'not-allowed' : 'pointer',
                  minHeight: '44px',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  transition: 'all 0.3s ease',
                  opacity: deleteLoading ? 0.5 : 1
                }}
                onTouchStart={(e) => {
                  if (isMobile && !deleteLoading) {
                    e.currentTarget.style.transform = 'scale(0.98)'
                  }
                }}
                onTouchEnd={(e) => {
                  if (isMobile && !deleteLoading) {
                    e.currentTarget.style.transform = 'scale(1)'
                  }
                }}
              >
                Cancel
              </button>

              <button
                onClick={handleDeleteClient}
                disabled={deleteLoading}
                style={{
                  flex: 1,
                  padding: isMobile ? '0.875rem' : '1rem',
                  background: deleteLoading 
                    ? 'rgba(239, 68, 68, 0.5)' 
                    : 'linear-gradient(135deg, #ef4444, #dc2626)',
                  border: 'none',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: isMobile ? '0.9rem' : '0.95rem',
                  fontWeight: '600',
                  cursor: deleteLoading ? 'not-allowed' : 'pointer',
                  minHeight: '44px',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  transition: 'all 0.3s ease',
                  opacity: deleteLoading ? 0.7 : 1
                }}
                onTouchStart={(e) => {
                  if (isMobile && !deleteLoading) {
                    e.currentTarget.style.transform = 'scale(0.98)'
                  }
                }}
                onTouchEnd={(e) => {
                  if (isMobile && !deleteLoading) {
                    e.currentTarget.style.transform = 'scale(1)'
                  }
                }}
              >
                {deleteLoading ? 'Deleting...' : 'Yes, Delete Client'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
