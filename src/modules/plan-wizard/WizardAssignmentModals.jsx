// src/modules/plan-wizard/WizardAssignmentModals.jsx
// Lightweight assignment modals specifically for Plan Wizard

import { useState, useEffect } from 'react'
import { X, Sparkles, Phone, Loader, CheckCircle, AlertCircle } from 'lucide-react'

// ============================================
// MEAL PLAN ASSIGNMENT MODAL (Plan Selector & Activator)
// ============================================
export function MealPlanAssignModal({ client, isOpen, onClose, db, isMobile }) {
  const [plans, setPlans] = useState([])
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activating, setActivating] = useState(false)
  const [error, setError] = useState(null)
  const [showCreateOption, setShowCreateOption] = useState(false)

  console.log('🍽️ MealPlanAssignModal rendered:', { client, isOpen, isMobile })

  useEffect(() => {
    if (isOpen) {
      console.log('🔵 MealPlanAssignModal opened for client:', client)
      loadMealPlans()
    }
  }, [isOpen])

  const loadMealPlans = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🍽️ Loading ALL meal plans...')
      console.log('🔍 DB object:', db)
      console.log('🔍 DB.supabase:', db?.supabase)
      
      // Get current user (coach)
      const user = await db.getCurrentUser()
      console.log('👤 Current user (coach):', user)
      
      // Load ALL meal plans from ALL clients of this coach
      // First get all clients of this coach
      const { data: coachClients, error: clientsError } = await db.supabase
        .from('clients')
        .select('id')
        .eq('coach_id', user?.id)
      
      if (clientsError) {
        console.error('❌ Error loading coach clients:', clientsError)
        throw clientsError
      }
      
      const clientIds = coachClients?.map(c => c.id) || []
      console.log('📊 Coach has', clientIds.length, 'clients')
      
      // Load all meal plans for all these clients
      const { data, error: fetchError } = await db.supabase
        .from('client_meal_plans')
        .select(`
          id, 
          template_name, 
          daily_calories, 
          daily_protein, 
          daily_carbs, 
          daily_fat, 
          is_active, 
          ai_generated, 
          created_at,
          client_id,
          week_structure,
          clients!inner(first_name, last_name)
        `)
        .in('client_id', clientIds)
        .order('created_at', { ascending: false })
      
      if (fetchError) {
        console.error('❌ Error loading meal plans:', fetchError)
        throw fetchError
      }
      
      console.log('✅ All meal plans loaded:', data?.length, 'plans')
      setPlans(data || [])
      
      // Pre-select THIS client's active plan if exists
      const clientActivePlan = data?.find(p => p.client_id === client.id && p.is_active)
      if (clientActivePlan) {
        console.log('✅ Found client active plan:', clientActivePlan)
        setSelectedPlan(clientActivePlan)
      }
      
      // If no plans exist, show create option
      if (!data || data.length === 0) {
        console.log('⚠️ No meal plans found')
        setShowCreateOption(true)
      }
    } catch (error) {
      console.error('❌ Failed to load meal plans:', error)
      console.error('❌ Error stack:', error.stack)
      console.error('❌ Error message:', error.message)
      setError('Kon meal plans niet laden: ' + error.message)
    } finally {
      setLoading(false)
      console.log('✅ Loading complete')
    }
  }

  const handleActivate = async () => {
    if (!selectedPlan) {
      console.warn('⚠️ No plan selected')
      return
    }

    try {
      setActivating(true)
      setError(null)

      console.log('🚀 Starting activation...')
      console.log('📋 Selected plan:', selectedPlan)
      console.log('👤 Current client ID:', client.id)
      console.log('📋 Plan original client ID:', selectedPlan.client_id)

      // Check if we're copying from another client
      const isCopyingFromAnotherClient = selectedPlan.client_id !== client.id

      if (isCopyingFromAnotherClient) {
        console.log('📋 Copying plan from another client...')
        
        // Copy the plan to this client
        const { data: copiedPlan, error: copyError } = await db.supabase
          .from('client_meal_plans')
          .insert({
            client_id: client.id,
            template_name: selectedPlan.template_name,
            week_structure: selectedPlan.week_structure,
            daily_calories: selectedPlan.daily_calories,
            daily_protein: selectedPlan.daily_protein,
            daily_carbs: selectedPlan.daily_carbs,
            daily_fat: selectedPlan.daily_fat,
            is_active: true,
            ai_generated: selectedPlan.ai_generated,
            created_at: new Date().toISOString()
          })
          .select()
          .single()
        
        if (copyError) {
          console.error('❌ Copy error:', copyError)
          throw copyError
        }
        console.log('✅ Plan copied to new client:', copiedPlan)
        
        // Deactivate any other plans for this client
        const { error: deactivateError } = await db.supabase
          .from('client_meal_plans')
          .update({ is_active: false })
          .eq('client_id', client.id)
          .neq('id', copiedPlan.id)
        
        if (deactivateError) {
          console.error('⚠️ Deactivate warning:', deactivateError)
        }
      } else {
        console.log('✅ Activating existing plan for same client...')
        
        // Step 1: Deactivate all other plans for this client
        const { error: deactivateError } = await db.supabase
          .from('client_meal_plans')
          .update({ is_active: false })
          .eq('client_id', client.id)
          .neq('id', selectedPlan.id)

        if (deactivateError) {
          console.error('❌ Deactivate error:', deactivateError)
          throw deactivateError
        }
        console.log('✅ Other plans deactivated')

        // Step 2: Activate selected plan
        const { error: activateError } = await db.supabase
          .from('client_meal_plans')
          .update({ 
            is_active: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedPlan.id)

        if (activateError) {
          console.error('❌ Activate error:', activateError)
          throw activateError
        }
        console.log('✅ Plan activated successfully!')
      }

      onClose(true) // Success!
    } catch (error) {
      console.error('❌ Activation failed:', error)
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        clientId: client.id,
        planId: selectedPlan?.id
      })
      setError(error.message || 'Activatie mislukt')
      setActivating(false)
    }
  }

  const handleCreateNew = () => {
    console.log('🚀 Redirecting to AI Meal Generator for client:', client.id)
    // Navigate to AI Meal Generator tab in CoachHub
    window.dispatchEvent(new CustomEvent('navigate-to-ai-meals', { 
      detail: { clientId: client.id } 
    }))
    onClose(false)
  }

  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: isMobile ? '1rem' : '2rem'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%)',
        borderRadius: isMobile ? '16px' : '20px',
        border: '2px solid rgba(16, 185, 129, 0.3)',
        width: '100%',
        maxWidth: '700px',
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: isMobile ? '1.5rem' : '2rem',
          borderBottom: '1px solid rgba(16, 185, 129, 0.2)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '0.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: isMobile ? '48px' : '56px',
                height: isMobile ? '48px' : '56px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: isMobile ? '24px' : '28px'
              }}>
                🍽️
              </div>
              <div>
                <h2 style={{
                  color: '#fff',
                  fontSize: isMobile ? '1.25rem' : '1.5rem',
                  fontWeight: '700',
                  marginBottom: '0.25rem'
                }}>
                  Meal Plan Toewijzen
                </h2>
                <p style={{
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontSize: isMobile ? '0.85rem' : '0.9rem'
                }}>
                  {client.first_name} {client.last_name}
                </p>
              </div>
            </div>
            <button
              onClick={() => onClose(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.5)',
                cursor: 'pointer',
                padding: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: isMobile ? '1.5rem' : '2rem'
        }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <Loader size={32} className="spin" color="#10b981" />
              <p style={{ color: 'rgba(255, 255, 255, 0.6)', marginTop: '1rem' }}>
                Meal plans laden...
              </p>
            </div>
          ) : error ? (
            <div style={{
              padding: '1rem',
              borderRadius: '12px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              color: '#ef4444'
            }}>
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          ) : showCreateOption || plans.length === 0 ? (
            <div style={{
              padding: '2rem',
              textAlign: 'center',
              color: 'rgba(255, 255, 255, 0.6)'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🍽️</div>
              <p style={{ marginBottom: '0.5rem' }}>Geen meal plans gevonden.</p>
              <p style={{ fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                Maak eerst een AI meal plan in de generator.
              </p>
              <button
                onClick={handleCreateNew}
                style={{
                  padding: '0.875rem 1.5rem',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: 'none',
                  color: '#fff',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <Sparkles size={18} />
                Naar AI Generator
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {plans.map(plan => (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan)}
                  style={{
                    padding: isMobile ? '1rem' : '1.25rem',
                    borderRadius: '12px',
                    background: selectedPlan?.id === plan.id
                      ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%)'
                      : 'rgba(255, 255, 255, 0.03)',
                    border: selectedPlan?.id === plan.id
                      ? '2px solid #10b981'
                      : '1px solid rgba(255, 255, 255, 0.1)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedPlan?.id !== plan.id) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedPlan?.id !== plan.id) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
                    }
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '0.75rem'
                  }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{
                        color: '#fff',
                        fontSize: isMobile ? '1rem' : '1.1rem',
                        fontWeight: '600',
                        marginBottom: '0.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        {plan.template_name}
                        {plan.ai_generated && (
                          <span style={{
                            padding: '0.2rem 0.5rem',
                            background: 'rgba(139, 92, 246, 0.2)',
                            borderRadius: '6px',
                            fontSize: '0.7rem',
                            fontWeight: '600',
                            color: '#8b5cf6'
                          }}>
                            AI
                          </span>
                        )}
                      </h3>
                      <p style={{
                        color: 'rgba(255, 255, 255, 0.5)',
                        fontSize: isMobile ? '0.8rem' : '0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        {plan.clients?.first_name && plan.clients?.last_name && (
                          <>
                            <span style={{
                              padding: '0.2rem 0.5rem',
                              background: plan.client_id === client.id 
                                ? 'rgba(16, 185, 129, 0.2)' 
                                : 'rgba(59, 130, 246, 0.1)',
                              borderRadius: '4px',
                              fontSize: '0.7rem',
                              fontWeight: '600',
                              color: plan.client_id === client.id ? '#10b981' : '#3b82f6'
                            }}>
                              {plan.client_id === client.id 
                                ? 'HUN PLAN' 
                                : `${plan.clients.first_name} ${plan.clients.last_name}`}
                            </span>
                            •
                          </>
                        )}
                        {new Date(plan.created_at).toLocaleDateString('nl-NL', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      {plan.is_active && (
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          background: 'rgba(16, 185, 129, 0.2)',
                          borderRadius: '8px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          color: '#10b981'
                        }}>
                          ACTIEF
                        </span>
                      )}
                      {selectedPlan?.id === plan.id && (
                        <CheckCircle size={20} color="#10b981" />
                      )}
                    </div>
                  </div>
                  
                  {/* Macro Summary */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '0.75rem',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    <div>
                      <div style={{ 
                        fontSize: '0.7rem', 
                        color: 'rgba(255, 255, 255, 0.5)',
                        marginBottom: '0.25rem'
                      }}>
                        Calorieën
                      </div>
                      <div style={{ 
                        fontSize: '0.95rem', 
                        fontWeight: '700',
                        color: '#fff'
                      }}>
                        {plan.daily_calories}
                      </div>
                    </div>
                    <div>
                      <div style={{ 
                        fontSize: '0.7rem', 
                        color: 'rgba(255, 255, 255, 0.5)',
                        marginBottom: '0.25rem'
                      }}>
                        Eiwit
                      </div>
                      <div style={{ 
                        fontSize: '0.95rem', 
                        fontWeight: '700',
                        color: '#8b5cf6'
                      }}>
                        {plan.daily_protein}g
                      </div>
                    </div>
                    <div>
                      <div style={{ 
                        fontSize: '0.7rem', 
                        color: 'rgba(255, 255, 255, 0.5)',
                        marginBottom: '0.25rem'
                      }}>
                        Koolh.
                      </div>
                      <div style={{ 
                        fontSize: '0.95rem', 
                        fontWeight: '700',
                        color: '#3b82f6'
                      }}>
                        {plan.daily_carbs}g
                      </div>
                    </div>
                    <div>
                      <div style={{ 
                        fontSize: '0.7rem', 
                        color: 'rgba(255, 255, 255, 0.5)',
                        marginBottom: '0.25rem'
                      }}>
                        Vet
                      </div>
                      <div style={{ 
                        fontSize: '0.95rem', 
                        fontWeight: '700',
                        color: '#10b981'
                      }}>
                        {plan.daily_fat}g
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Create New Button */}
              <button
                onClick={handleCreateNew}
                style={{
                  padding: isMobile ? '1rem' : '1.25rem',
                  borderRadius: '12px',
                  background: 'rgba(139, 92, 246, 0.1)',
                  border: '1px dashed rgba(139, 92, 246, 0.3)',
                  color: '#8b5cf6',
                  fontSize: isMobile ? '0.9rem' : '0.95rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.75rem',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(139, 92, 246, 0.15)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)'
                }}
              >
                <Sparkles size={20} />
                Nieuw AI Plan Maken
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {!loading && !showCreateOption && plans.length > 0 && (
          <div style={{
            padding: isMobile ? '1.5rem' : '2rem',
            borderTop: '1px solid rgba(16, 185, 129, 0.2)',
            display: 'flex',
            gap: '0.75rem'
          }}>
            <button
              onClick={() => onClose(false)}
              style={{
                flex: 1,
                padding: isMobile ? '0.875rem' : '1rem',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#fff',
                fontSize: isMobile ? '0.9rem' : '0.95rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Annuleren
            </button>
            <button
              onClick={handleActivate}
              disabled={!selectedPlan || activating}
              style={{
                flex: 1,
                padding: isMobile ? '0.875rem' : '1rem',
                borderRadius: '12px',
                background: selectedPlan && !activating
                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                  : 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                color: '#fff',
                fontSize: isMobile ? '0.9rem' : '0.95rem',
                fontWeight: '600',
                cursor: selectedPlan && !activating ? 'pointer' : 'not-allowed',
                opacity: selectedPlan && !activating ? 1 : 0.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              {activating ? (
                <>
                  <Loader size={18} className="spin" />
                  {selectedPlan?.client_id === client.id ? 'Activeren...' : 'Kopiëren...'}
                </>
              ) : selectedPlan?.client_id === client.id && selectedPlan?.is_active ? (
                <>
                  <CheckCircle size={18} />
                  Al Actief
                </>
              ) : selectedPlan?.client_id !== client.id ? (
                <>
                  <CheckCircle size={18} />
                  Kopieer & Activeer
                </>
              ) : (
                <>
                  <CheckCircle size={18} />
                  Activeer Plan
                </>
              )}
            </button>
          </div>
        )}
      </div>

      <style>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

// ============================================
// CALL PLAN ASSIGNMENT MODAL (Template Selector)
// ============================================
export function CallPlanAssignModal({ client, isOpen, onClose, db, isMobile }) {
  const [templates, setTemplates] = useState([])
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [loading, setLoading] = useState(true)
  const [assigning, setAssigning] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (isOpen) {
      console.log('🔵 CallPlanAssignModal opened for client:', client)
      loadTemplates()
    }
  }, [isOpen])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('📞 Loading call templates...')
      console.log('🔍 DB object:', db)
      console.log('🔍 DB.supabase:', db?.supabase)
      
      // Import CallPlanningService (it's a singleton instance, not a class!)
      console.log('⚙️ Importing CallPlanningService...')
      const callService = (await import('../call-planning/CallPlanningService')).default
      console.log('✅ CallPlanningService imported (singleton):', callService)
      
      const user = await db.getCurrentUser()
      console.log('👤 Current user:', user)
      
      console.log('📊 Fetching templates for coach:', user?.id)
      const templatesData = await callService.getCoachTemplates(user?.id)
      console.log('✅ Templates loaded:', templatesData)
      
      setTemplates(templatesData || [])
      console.log('✅ Templates state set, count:', templatesData?.length || 0)
    } catch (error) {
      console.error('❌ Failed to load templates:', error)
      console.error('❌ Error stack:', error.stack)
      console.error('❌ Error message:', error.message)
      setError('Kon templates niet laden: ' + error.message)
    } finally {
      setLoading(false)
      console.log('✅ Loading complete')
    }
  }

  const handleAssign = async () => {
    if (!selectedTemplate) {
      console.warn('⚠️ No template selected')
      return
    }

    try {
      setAssigning(true)
      setError(null)

      console.log('🚀 Starting assignment...')
      console.log('📋 Selected template:', selectedTemplate)
      console.log('👤 Client ID:', client.id)

      const callService = (await import('../call-planning/CallPlanningService')).default
      console.log('✅ CallPlanningService imported for assignment (singleton)')
      
      console.log('📞 Calling assignTemplateToClient...')
      await callService.assignTemplateToClient(client.id, selectedTemplate.id)
      console.log('✅ Assignment successful!')
      
      onClose(true) // Success!
    } catch (error) {
      console.error('❌ Assignment failed:', error)
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        clientId: client.id,
        templateId: selectedTemplate?.id
      })
      setError(error.message || 'Assignment mislukt')
      setAssigning(false)
    }
  }

  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: isMobile ? '1rem' : '2rem'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%)',
        borderRadius: isMobile ? '16px' : '20px',
        border: '2px solid rgba(59, 130, 246, 0.3)',
        width: '100%',
        maxWidth: '600px',
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: isMobile ? '1.5rem' : '2rem',
          borderBottom: '1px solid rgba(59, 130, 246, 0.2)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '0.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: isMobile ? '48px' : '56px',
                height: isMobile ? '48px' : '56px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Phone size={isMobile ? 24 : 28} color="#fff" />
              </div>
              <div>
                <h2 style={{
                  color: '#fff',
                  fontSize: isMobile ? '1.25rem' : '1.5rem',
                  fontWeight: '700',
                  marginBottom: '0.25rem'
                }}>
                  Assign Call Plan
                </h2>
                <p style={{
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontSize: isMobile ? '0.85rem' : '0.9rem'
                }}>
                  {client.first_name} {client.last_name}
                </p>
              </div>
            </div>
            <button
              onClick={() => onClose(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.5)',
                cursor: 'pointer',
                padding: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: isMobile ? '1.5rem' : '2rem'
        }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <Loader size={32} className="spin" color="#3b82f6" />
              <p style={{ color: 'rgba(255, 255, 255, 0.6)', marginTop: '1rem' }}>
                Templates laden...
              </p>
            </div>
          ) : error ? (
            <div style={{
              padding: '1rem',
              borderRadius: '12px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              color: '#ef4444'
            }}>
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          ) : templates.length === 0 ? (
            <div style={{
              padding: '2rem',
              textAlign: 'center',
              color: 'rgba(255, 255, 255, 0.6)'
            }}>
              <Phone size={48} color="rgba(255, 255, 255, 0.2)" style={{ marginBottom: '1rem' }} />
              <p>Geen call templates gevonden.</p>
              <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
                Maak eerst een template in Call Planning.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {templates.map(template => (
                <div
                  key={template.id}
                  onClick={() => setSelectedTemplate(template)}
                  style={{
                    padding: isMobile ? '1rem' : '1.25rem',
                    borderRadius: '12px',
                    background: selectedTemplate?.id === template.id
                      ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(59, 130, 246, 0.1) 100%)'
                      : 'rgba(255, 255, 255, 0.03)',
                    border: selectedTemplate?.id === template.id
                      ? '2px solid #3b82f6'
                      : '1px solid rgba(255, 255, 255, 0.1)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedTemplate?.id !== template.id) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedTemplate?.id !== template.id) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
                    }
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '0.5rem'
                  }}>
                    <h3 style={{
                      color: '#fff',
                      fontSize: isMobile ? '1rem' : '1.1rem',
                      fontWeight: '600'
                    }}>
                      {template.template_name}
                    </h3>
                    {selectedTemplate?.id === template.id && (
                      <CheckCircle size={20} color="#3b82f6" />
                    )}
                  </div>
                  {template.description && (
                    <p style={{
                      color: 'rgba(255, 255, 255, 0.6)',
                      fontSize: isMobile ? '0.85rem' : '0.9rem',
                      marginBottom: '0.75rem'
                    }}>
                      {template.description}
                    </p>
                  )}
                  <div style={{
                    display: 'flex',
                    gap: '1rem',
                    fontSize: isMobile ? '0.8rem' : '0.85rem',
                    color: 'rgba(255, 255, 255, 0.5)'
                  }}>
                    <span>📞 {template.total_calls} calls</span>
                    {template.bonus_calls_allowed > 0 && (
                      <span>✨ +{template.bonus_calls_allowed} bonus</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: isMobile ? '1.5rem' : '2rem',
          borderTop: '1px solid rgba(59, 130, 246, 0.2)',
          display: 'flex',
          gap: '0.75rem'
        }}>
          <button
            onClick={() => onClose(false)}
            style={{
              flex: 1,
              padding: isMobile ? '0.875rem' : '1rem',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#fff',
              fontSize: isMobile ? '0.9rem' : '0.95rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Annuleren
          </button>
          <button
            onClick={handleAssign}
            disabled={!selectedTemplate || assigning}
            style={{
              flex: 1,
              padding: isMobile ? '0.875rem' : '1rem',
              borderRadius: '12px',
              background: selectedTemplate && !assigning
                ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                : 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              color: '#fff',
              fontSize: isMobile ? '0.9rem' : '0.95rem',
              fontWeight: '600',
              cursor: selectedTemplate && !assigning ? 'pointer' : 'not-allowed',
              opacity: selectedTemplate && !assigning ? 1 : 0.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            {assigning ? (
              <>
                <Loader size={18} className="spin" />
                Assigning...
              </>
            ) : (
              <>
                <CheckCircle size={18} />
                Assign Template
              </>
            )}
          </button>
        </div>
      </div>

      <style>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default {
  MealPlanAssignModal,
  CallPlanAssignModal
}
