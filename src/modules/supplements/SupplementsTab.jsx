// src/modules/supplements/SupplementsTab.jsx
// ✅ COACH VIEW - Supplements overview tab for CoachHub
// ✅ Shows all clients with supplement plan status
// ✅ Generate, Edit, Approve actions

import React, { useState, useEffect } from 'react'
import DatabaseService from '../../services/DatabaseService'
import SupplementPlanEditor from './SupplementPlanEditor'

export default function SupplementsTab({ coach, clients, db }) {
  const isMobile = window.innerWidth <= 768
  
  const [loading, setLoading] = useState(true)
  const [supplementPlans, setSupplementPlans] = useState([])
  const [selectedClient, setSelectedClient] = useState(null)
  const [showEditor, setShowEditor] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  
  useEffect(() => {
    if (coach?.id) {
      loadSupplementPlans()
    }
  }, [coach])
  
  const loadSupplementPlans = async () => {
    setLoading(true)
    
    try {
      // Fetch all supplement plans for this coach
      const plans = await DatabaseService.getAllSupplementPlans(coach.id)
      
      // Create a map of client_id -> plan
      const planMap = {}
      plans.forEach(plan => {
        planMap[plan.client_id] = plan
      })
      
      // Merge with clients data
      const enrichedClients = clients.map(client => ({
        ...client,
        supplementPlan: planMap[client.id] || null
      }))
      
      setSupplementPlans(enrichedClients)
      console.log('✅ Supplement plans loaded:', enrichedClients)
      
    } catch (error) {
      console.error('❌ Failed to load supplement plans:', error)
      setSupplementPlans(clients.map(c => ({ ...c, supplementPlan: null })))
    } finally {
      setLoading(false)
    }
  }
  
  const handleGeneratePlan = async (client) => {
    try {
      console.log('🔧 Generating supplement plan for:', client.name)
      
      // Generate template
      const supplements = await DatabaseService.generateSupplementPlanFromTemplate(
        client.weight || 75,
        client.training_frequency || 5,
        'bulk'
      )
      
      // Create draft plan
      const newPlan = await DatabaseService.createSupplementPlan({
        client_id: client.id,
        coach_id: coach.id,
        supplements: supplements,
        client_weight: client.weight,
        training_frequency: client.training_frequency,
        goal: 'bulk',
        status: 'draft'
      })
      
      if (newPlan) {
        console.log('✅ Plan generated:', newPlan.id)
        await loadSupplementPlans()
        
        // Open editor
        setSelectedClient(client)
        setShowEditor(true)
      }
      
    } catch (error) {
      console.error('❌ Failed to generate plan:', error)
      alert('Er ging iets mis bij het genereren van het plan')
    }
  }
  
  const handleEditPlan = (client) => {
    setSelectedClient(client)
    setShowEditor(true)
  }
  
  const handleActivatePlan = async (client, planId) => {
    if (!confirm(`Plan activeren voor ${client.name}? Client kan dit dan zien.`)) {
      return
    }
    
    try {
      await DatabaseService.activateSupplementPlan(planId, client.id)
      console.log('✅ Plan activated for:', client.name)
      await loadSupplementPlans()
      alert(`✅ Supplement plan geactiveerd voor ${client.name}`)
    } catch (error) {
      console.error('❌ Failed to activate plan:', error)
      alert('Er ging iets mis bij het activeren')
    }
  }
  
  const handleDeletePlan = async (client, planId) => {
    if (!confirm(`Plan verwijderen voor ${client.name}?`)) {
      return
    }
    
    try {
      await DatabaseService.deleteSupplementPlan(planId)
      console.log('✅ Plan deleted for:', client.name)
      await loadSupplementPlans()
    } catch (error) {
      console.error('❌ Failed to delete plan:', error)
      alert('Er ging iets mis bij het verwijderen')
    }
  }
  
  const handleEditorClose = async (saved) => {
    setShowEditor(false)
    setSelectedClient(null)
    if (saved) {
      await loadSupplementPlans()
    }
  }
  
  // Filter clients
  const filteredClients = supplementPlans.filter(client => {
    if (!searchQuery) return true
    return client.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           client.email?.toLowerCase().includes(searchQuery.toLowerCase())
  })
  
  // Group by status
  const activeClients = filteredClients.filter(c => c.supplementPlan?.status === 'active')
  const draftClients = filteredClients.filter(c => c.supplementPlan?.status === 'draft' || c.supplementPlan?.status === 'approved')
  const noPlans = filteredClients.filter(c => !c.supplementPlan)
  
  return (
    <div style={{
      padding: isMobile ? '1rem' : '2rem',
      maxWidth: '1400px',
      margin: '0 auto'
    }}>
      
      {/* HEADER */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{
          color: '#9333ea',
          fontSize: isMobile ? '1.75rem' : '2.25rem',
          fontWeight: 700,
          marginBottom: '0.5rem',
          letterSpacing: '-0.02em'
        }}>
          💊 Supplement Planning
        </h1>
        
        <p style={{
          color: '#888888',
          fontSize: isMobile ? '0.95rem' : '1.05rem',
          marginBottom: '1.5rem'
        }}>
          Beheer supplement plannen voor je clients
        </p>
        
        {/* SEARCH */}
        <input
          type="text"
          placeholder="🔍 Zoek client..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            maxWidth: '400px',
            padding: '0.875rem 1rem',
            background: '#0a0a0a',
            border: '1px solid #1a1a1a',
            borderRadius: '12px',
            color: '#ffffff',
            fontSize: '0.95rem',
            outline: 'none',
            transition: 'all 0.2s ease'
          }}
          onFocus={(e) => e.target.style.borderColor = '#9333ea'}
          onBlur={(e) => e.target.style.borderColor = '#1a1a1a'}
        />
      </div>
      
      {/* STATS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          padding: '1.5rem',
          background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.1) 0%, rgba(10, 10, 10, 0) 100%)',
          border: '1px solid rgba(147, 51, 234, 0.3)',
          borderRadius: '16px'
        }}>
          <div style={{
            color: '#888888',
            fontSize: '0.875rem',
            marginBottom: '0.5rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Active Plans
          </div>
          <div style={{
            color: '#9333ea',
            fontSize: '2rem',
            fontWeight: 700
          }}>
            {activeClients.length}
          </div>
        </div>
        
        <div style={{
          padding: '1.5rem',
          background: '#0a0a0a',
          border: '1px solid #1a1a1a',
          borderRadius: '16px'
        }}>
          <div style={{
            color: '#888888',
            fontSize: '0.875rem',
            marginBottom: '0.5rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Draft Plans
          </div>
          <div style={{
            color: '#a855f7',
            fontSize: '2rem',
            fontWeight: 700
          }}>
            {draftClients.length}
          </div>
        </div>
        
        <div style={{
          padding: '1.5rem',
          background: '#0a0a0a',
          border: '1px solid #1a1a1a',
          borderRadius: '16px'
        }}>
          <div style={{
            color: '#888888',
            fontSize: '0.875rem',
            marginBottom: '0.5rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            No Plan
          </div>
          <div style={{
            color: '#ffffff',
            fontSize: '2rem',
            fontWeight: 700
          }}>
            {noPlans.length}
          </div>
        </div>
      </div>
      
      {/* LOADING */}
      {loading && (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          color: '#888888'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid rgba(147, 51, 234, 0.2)',
            borderTop: '4px solid #9333ea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }} />
        </div>
      )}
      
      {/* CLIENTS LIST */}
      {!loading && (
        <>
          {/* ACTIVE PLANS */}
          {activeClients.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{
                color: '#ffffff',
                fontSize: '1.25rem',
                fontWeight: 600,
                marginBottom: '1rem'
              }}>
                ✅ Active Plans ({activeClients.length})
              </h3>
              
              <div style={{
                display: 'grid',
                gap: '1rem'
              }}>
                {activeClients.map(client => (
                  <ClientCard
                    key={client.id}
                    client={client}
                    onEdit={() => handleEditPlan(client)}
                    onDelete={() => handleDeletePlan(client, client.supplementPlan.id)}
                    isMobile={isMobile}
                  />
                ))}
              </div>
            </div>
          )}
          
          {/* DRAFT PLANS */}
          {draftClients.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{
                color: '#ffffff',
                fontSize: '1.25rem',
                fontWeight: 600,
                marginBottom: '1rem'
              }}>
                📝 Draft Plans ({draftClients.length})
              </h3>
              
              <div style={{
                display: 'grid',
                gap: '1rem'
              }}>
                {draftClients.map(client => (
                  <ClientCard
                    key={client.id}
                    client={client}
                    onEdit={() => handleEditPlan(client)}
                    onActivate={() => handleActivatePlan(client, client.supplementPlan.id)}
                    onDelete={() => handleDeletePlan(client, client.supplementPlan.id)}
                    isMobile={isMobile}
                  />
                ))}
              </div>
            </div>
          )}
          
          {/* NO PLANS */}
          {noPlans.length > 0 && (
            <div>
              <h3 style={{
                color: '#ffffff',
                fontSize: '1.25rem',
                fontWeight: 600,
                marginBottom: '1rem'
              }}>
                ⚪ No Plan ({noPlans.length})
              </h3>
              
              <div style={{
                display: 'grid',
                gap: '1rem'
              }}>
                {noPlans.map(client => (
                  <ClientCard
                    key={client.id}
                    client={client}
                    onGenerate={() => handleGeneratePlan(client)}
                    isMobile={isMobile}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
      
      {/* EDITOR MODAL */}
      {showEditor && selectedClient && (
        <SupplementPlanEditor
          client={selectedClient}
          coach={coach}
          db={db}
          isOpen={showEditor}
          onClose={handleEditorClose}
        />
      )}
      
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

// ============================================
// CLIENT CARD COMPONENT
// ============================================

function ClientCard({ client, onGenerate, onEdit, onActivate, onDelete, isMobile }) {
  const plan = client.supplementPlan
  const hasPlan = !!plan
  const isActive = plan?.status === 'active'
  const isDraft = plan?.status === 'draft' || plan?.status === 'approved'
  
  const totalCost = plan?.supplements?.reduce((sum, s) => sum + (s.cost_per_month || 0), 0) || 0
  const suppCount = plan?.supplements?.length || 0
  
  return (
    <div style={{
      padding: isMobile ? '1rem' : '1.5rem',
      background: '#0a0a0a',
      border: `1px solid ${isActive ? 'rgba(147, 51, 234, 0.3)' : '#1a1a1a'}`,
      borderLeft: isActive ? '3px solid #9333ea' : '1px solid #1a1a1a',
      borderRadius: '16px',
      transition: 'all 0.2s ease'
    }}>
      
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: '1rem',
        marginBottom: hasPlan ? '1rem' : 0
      }}>
        
        {/* CLIENT INFO */}
        <div style={{ flex: 1 }}>
          <div style={{
            color: '#ffffff',
            fontSize: isMobile ? '1.05rem' : '1.125rem',
            fontWeight: 600,
            marginBottom: '0.25rem'
          }}>
            {client.name}
          </div>
          
          <div style={{
            color: '#888888',
            fontSize: '0.875rem',
            marginBottom: '0.5rem'
          }}>
            {client.email}
          </div>
          
          {/* CLIENT STATS */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            fontSize: '0.875rem',
            color: '#888888'
          }}>
            {client.weight && (
              <span>⚖️ {client.weight}kg</span>
            )}
            {client.training_frequency && (
              <span>🏋️ {client.training_frequency}x/week</span>
            )}
          </div>
        </div>
        
        {/* STATUS BADGE */}
        <div style={{
          padding: '0.375rem 0.875rem',
          background: isActive 
            ? 'rgba(147, 51, 234, 0.15)' 
            : isDraft
            ? 'rgba(168, 85, 247, 0.15)'
            : 'rgba(136, 136, 136, 0.15)',
          color: isActive ? '#9333ea' : isDraft ? '#a855f7' : '#888888',
          borderRadius: '8px',
          fontSize: '0.75rem',
          fontWeight: 600,
          textTransform: 'uppercase',
          whiteSpace: 'nowrap'
        }}>
          {isActive ? '✅ Active' : isDraft ? '📝 Draft' : '⚪ No Plan'}
        </div>
      </div>
      
      {/* PLAN INFO */}
      {hasPlan && (
        <div style={{
          display: 'flex',
          gap: '1.5rem',
          padding: '1rem',
          background: 'rgba(147, 51, 234, 0.05)',
          borderRadius: '12px',
          marginBottom: '1rem'
        }}>
          <div>
            <div style={{
              color: '#888888',
              fontSize: '0.75rem',
              marginBottom: '0.25rem'
            }}>
              Supplements
            </div>
            <div style={{
              color: '#9333ea',
              fontSize: '1.125rem',
              fontWeight: 700
            }}>
              {suppCount}
            </div>
          </div>
          
          <div>
            <div style={{
              color: '#888888',
              fontSize: '0.75rem',
              marginBottom: '0.25rem'
            }}>
              Kosten/maand
            </div>
            <div style={{
              color: '#9333ea',
              fontSize: '1.125rem',
              fontWeight: 700
            }}>
              €{totalCost.toFixed(0)}
            </div>
          </div>
          
          {plan.approved_at && (
            <div>
              <div style={{
                color: '#888888',
                fontSize: '0.75rem',
                marginBottom: '0.25rem'
              }}>
                Approved
              </div>
              <div style={{
                color: '#10b981',
                fontSize: '0.875rem',
                fontWeight: 600
              }}>
                {new Date(plan.approved_at).toLocaleDateString('nl-NL')}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* ACTIONS */}
      <div style={{
        display: 'flex',
        gap: '0.75rem',
        flexWrap: 'wrap'
      }}>
        
        {!hasPlan && onGenerate && (
          <button
            onClick={onGenerate}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #7e22ce 0%, #9333ea 100%)',
              border: 'none',
              borderRadius: '10px',
              color: '#ffffff',
              fontSize: '0.95rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              minHeight: '44px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(147, 51, 234, 0.3)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            ⚡ Generate Plan
          </button>
        )}
        
        {hasPlan && onEdit && (
          <button
            onClick={onEdit}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#9333ea',
              border: 'none',
              borderRadius: '10px',
              color: '#ffffff',
              fontSize: '0.95rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              minHeight: '44px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#a855f7'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#9333ea'
            }}
          >
            ✏️ Edit
          </button>
        )}
        
        {hasPlan && isDraft && onActivate && (
          <button
            onClick={onActivate}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#10b981',
              border: 'none',
              borderRadius: '10px',
              color: '#ffffff',
              fontSize: '0.95rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              minHeight: '44px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#059669'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#10b981'
            }}
          >
            ✅ Activate
          </button>
        )}
        
        {hasPlan && onDelete && (
          <button
            onClick={onDelete}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'transparent',
              border: '1px solid #1a1a1a',
              borderRadius: '10px',
              color: '#888888',
              fontSize: '0.95rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              minHeight: '44px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#ef4444'
              e.currentTarget.style.color = '#ef4444'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#1a1a1a'
              e.currentTarget.style.color = '#888888'
            }}
          >
            🗑️ Delete
          </button>
        )}
      </div>
    </div>
  )
}
