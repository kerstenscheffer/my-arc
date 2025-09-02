// src/modules/client-management/modules/BonusesModule.jsx
// Bonuses Module voor MY ARC Client Management
// Gebruikt DatabaseService bonus methods

import { useState, useEffect } from 'react'

const BonusesModule = ({ client, data, onAction, viewMode, db }) => {
  const [bonuses, setBonuses] = useState([])
  const [loading, setLoading] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  
  // Predefined bonus templates
  const availableBonuses = [
    {
      id: 'bonus-workout-1',
      title: '🔥 30-Day Challenge',
      category: 'workout',
      value: '€97',
      description: 'Intensive 30-day transformation program'
    },
    {
      id: 'bonus-nutrition-1',
      title: '🥗 Recipe Book',
      category: 'nutrition',
      value: '€47',
      description: '100+ healthy recipes with macros'
    },
    {
      id: 'bonus-mindset-1',
      title: '🧠 Mental Training',
      category: 'mindset',
      value: '€67',
      description: 'Build unbreakable mental strength'
    },
    {
      id: 'bonus-recovery-1',
      title: '🧘 Yoga Program',
      category: 'recovery',
      value: '€57',
      description: 'Complete flexibility & recovery program'
    }
  ]

  useEffect(() => {
    if (client?.id && db) {
      loadBonuses()
    }
  }, [client])

  const loadBonuses = async () => {
    if (!client?.id || !db) return
    setLoading(true)
    
    try {
      const clientBonuses = await db.getClientBonuses(client.id)
      setBonuses(clientBonuses || [])
      
      // Update parent data
      if (onAction) {
        onAction('updateData', {
          bonuses: {
            assigned: clientBonuses || [],
            totalValue: calculateTotalValue(clientBonuses)
          }
        })
      }
    } catch (error) {
      console.error('Error loading bonuses:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateTotalValue = (bonusList) => {
    return bonusList.reduce((sum, bonus) => {
      const template = availableBonuses.find(t => t.id === bonus.bonus_id)
      const value = parseInt(template?.value?.replace('€', '') || 0)
      return sum + value
    }, 0)
  }

  const assignBonus = async (bonusId) => {
    try {
      await db.assignBonus(client.id, bonusId)
      
      // Send notification
      const bonus = availableBonuses.find(b => b.id === bonusId)
      await db.createNotification({
        client_id: client.id,
        type: 'bonus',
        priority: 'normal',
        title: '🎁 New Bonus Unlocked!',
        message: `You've received: ${bonus.title}`,
        action_type: 'bonus',
        action_target: bonusId,
        action_label: 'View Bonus'
      })
      
      await loadBonuses()
      setShowAssignModal(false)
      
      if (onAction) {
        onAction('bonusAssigned', { bonusId, bonus })
      }
    } catch (error) {
      console.error('Error assigning bonus:', error)
    }
  }

  // Compact view for dashboard
  if (viewMode === 'compact') {
    const bonusData = data?.bonuses || {}
    const assignedCount = bonusData.assigned?.length || 0
    const totalValue = bonusData.totalValue || 0
    
    return (
      <div style={{
        background: 'linear-gradient(135deg, #1e293b, #334155)',
        borderRadius: '12px',
        padding: '16px'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '12px'
        }}>
          <h4 style={{ color: '#10b981', margin: 0 }}>Bonuses</h4>
          <button
            onClick={() => onAction && onAction('viewDetails', {})}
            style={{
              padding: '4px 8px',
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Manage
          </button>
        </div>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px'
        }}>
          <div style={{
            background: 'rgba(0,0,0,0.3)',
            padding: '12px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '4px' }}>🎁</div>
            <div style={{ color: '#10b981', fontSize: '20px', fontWeight: 'bold' }}>
              {assignedCount}
            </div>
            <div style={{ color: '#9ca3af', fontSize: '11px' }}>Bonuses</div>
          </div>
          
          <div style={{
            background: 'rgba(0,0,0,0.3)',
            padding: '12px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '4px' }}>💰</div>
            <div style={{ color: '#f59e0b', fontSize: '20px', fontWeight: 'bold' }}>
              €{totalValue}
            </div>
            <div style={{ color: '#9ca3af', fontSize: '11px' }}>Total Value</div>
          </div>
        </div>
        
        {assignedCount === 0 && (
          <button
            onClick={() => setShowAssignModal(true)}
            style={{
              width: '100%',
              padding: '8px',
              background: '#374151',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              marginTop: '12px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            + Assign First Bonus
          </button>
        )}
      </div>
    )
  }

  // Focus view for detailed management
  if (viewMode === 'focus') {
    return (
      <div>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <h4 style={{ color: '#10b981', margin: 0 }}>Bonus Management</h4>
          <button
            onClick={() => setShowAssignModal(true)}
            style={{
              padding: '8px 16px',
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            + Assign Bonus
          </button>
        </div>

        {/* Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px',
          marginBottom: '20px'
        }}>
          <div style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '2px solid #10b981',
            borderRadius: '12px',
            padding: '20px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '8px' }}>🎁</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#10b981' }}>
              {bonuses.length}
            </div>
            <div style={{ color: '#9ca3af' }}>Assigned Bonuses</div>
          </div>
          
          <div style={{
            background: 'rgba(245, 158, 11, 0.1)',
            border: '2px solid #f59e0b',
            borderRadius: '12px',
            padding: '20px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '8px' }}>💰</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#f59e0b' }}>
              €{calculateTotalValue(bonuses)}
            </div>
            <div style={{ color: '#9ca3af' }}>Total Value</div>
          </div>
        </div>

        {/* Assigned Bonuses List */}
        <div>
          <h5 style={{ color: '#d1d5db', marginBottom: '12px' }}>
            Assigned Bonuses
          </h5>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#9ca3af' }}>
              Loading...
            </div>
          ) : bonuses.length === 0 ? (
            <div style={{
              background: 'rgba(0,0,0,0.3)',
              padding: '32px',
              borderRadius: '8px',
              textAlign: 'center',
              color: '#9ca3af'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎁</div>
              <p>No bonuses assigned yet</p>
              <p style={{ fontSize: '12px', marginTop: '8px' }}>
                Reward your client with valuable bonus content!
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {bonuses.map(bonus => {
                const template = availableBonuses.find(t => t.id === bonus.bonus_id)
                if (!template) return null
                
                return (
                  <div
                    key={bonus.id}
                    style={{
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      padding: '16px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ fontSize: '32px' }}>{template.title.split(' ')[0]}</div>
                      <div>
                        <div style={{ color: '#f3f4f6', fontWeight: 'bold' }}>
                          {template.title}
                        </div>
                        <div style={{ color: '#9ca3af', fontSize: '12px' }}>
                          {template.description}
                        </div>
                        <div style={{ 
                          color: '#10b981', 
                          fontSize: '12px', 
                          marginTop: '4px' 
                        }}>
                          Assigned: {new Date(bonus.assigned_at).toLocaleDateString('nl-NL')}
                        </div>
                      </div>
                    </div>
                    <div style={{
                      background: '#10b981',
                      color: 'white',
                      padding: '4px 12px',
                      borderRadius: '4px',
                      fontWeight: 'bold'
                    }}>
                      {template.value}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Assign Modal */}
        {showAssignModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: '#0f172a',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
              }}>
                <h3 style={{ color: '#f3f4f6', margin: 0 }}>Assign Bonus</h3>
                <button
                  onClick={() => setShowAssignModal(false)}
                  style={{
                    background: '#374151',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    cursor: 'pointer'
                  }}
                >
                  ✕ Close
                </button>
              </div>
              
              <div style={{ display: 'grid', gap: '12px' }}>
                {availableBonuses
                  .filter(b => !bonuses.some(assigned => assigned.bonus_id === b.id))
                  .map(bonus => (
                    <div
                      key={bonus.id}
                      style={{
                        background: '#1e293b',
                        borderRadius: '8px',
                        padding: '16px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                        border: '2px solid transparent',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.border = '2px solid #10b981'}
                      onMouseLeave={e => e.currentTarget.style.border = '2px solid transparent'}
                      onClick={() => assignBonus(bonus.id)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ fontSize: '32px' }}>
                          {bonus.title.split(' ')[0]}
                        </div>
                        <div>
                          <div style={{ color: '#f3f4f6', fontWeight: 'bold' }}>
                            {bonus.title}
                          </div>
                          <div style={{ color: '#9ca3af', fontSize: '12px' }}>
                            {bonus.description}
                          </div>
                        </div>
                      </div>
                      <div style={{
                        background: '#10b981',
                        color: 'white',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        fontWeight: 'bold'
                      }}>
                        {bonus.value}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Default list view
  return (
    <div style={{
      background: '#1e293b',
      borderRadius: '8px',
      padding: '16px'
    }}>
      <h4 style={{ color: '#10b981', marginBottom: '12px' }}>Bonuses</h4>
      
      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
        <div>
          <span style={{ color: '#9ca3af' }}>Assigned: </span>
          <span style={{ color: '#10b981', fontWeight: 'bold' }}>
            {bonuses.length} bonuses
          </span>
        </div>
        <div>
          <span style={{ color: '#9ca3af' }}>Total Value: </span>
          <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>
            €{calculateTotalValue(bonuses)}
          </span>
        </div>
      </div>
      
      <button
        onClick={() => setShowAssignModal(true)}
        style={{
          padding: '8px 16px',
          background: '#10b981',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          width: '100%'
        }}
      >
        + Assign New Bonus
      </button>
    </div>
  )
}

export default BonusesModule
