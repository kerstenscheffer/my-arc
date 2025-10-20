// src/modules/manual-workout-builder/components/TemplateManager.jsx
import { FileText, Clock } from 'lucide-react'

export function TemplateManager({ templates, onLoad, onClose, isMobile }) {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(10px)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: isMobile ? '1rem' : '2rem'
    }}>
      <div style={{
        background: 'linear-gradient(180deg, #1a1a1a 0%, #0f0f0f 100%)',
        borderRadius: '20px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        width: '100%',
        maxWidth: '600px',
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{
          padding: isMobile ? '1rem' : '1.5rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{
            fontSize: isMobile ? '1.25rem' : '1.5rem',
            fontWeight: '700',
            color: '#fff',
            margin: 0
          }}>
            Workout Templates
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: '1.5rem'
            }}
          >
            ×
          </button>
        </div>
        
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: isMobile ? '1rem' : '1.5rem'
        }}>
          {templates.length === 0 ? (
            <div style={{
              textAlign: 'center',
              color: 'rgba(255, 255, 255, 0.5)',
              padding: '3rem'
            }}>
              Nog geen templates opgeslagen
            </div>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}>
              {templates.map(template => (
                <button
                  key={template.id}
                  onClick={() => onLoad(template)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    padding: isMobile ? '0.75rem' : '1rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)'
                    e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.3)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start'
                  }}>
                    <div>
                      <h4 style={{
                        color: '#fff',
                        fontSize: isMobile ? '0.9rem' : '1rem',
                        fontWeight: '600',
                        margin: '0 0 0.25rem 0'
                      }}>
                        {template.name}
                      </h4>
                      <p style={{
                        color: 'rgba(255, 255, 255, 0.5)',
                        fontSize: isMobile ? '0.8rem' : '0.85rem',
                        margin: 0
                      }}>
                        {template.description || 'Geen beschrijving'}
                      </p>
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      color: 'rgba(255, 255, 255, 0.4)',
                      fontSize: isMobile ? '0.75rem' : '0.8rem'
                    }}>
                      <Clock size={14} />
                      {template.days_per_week} dagen
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// src/modules/manual-workout-builder/components/ClientAssigner.jsx
import { useState } from 'react'
import { Users, Check } from 'lucide-react'

export function ClientAssigner({ clients, workoutPlan, db, onClose, isMobile }) {
  const [selectedClients, setSelectedClients] = useState([])
  const [assigning, setAssigning] = useState(false)
  
  const toggleClient = (clientId) => {
    setSelectedClients(prev => 
      prev.includes(clientId)
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    )
  }
  
  const assignToClients = async () => {
    if (selectedClients.length === 0) {
      alert('Selecteer minimaal één client')
      return
    }
    
    setAssigning(true)
    
    try {
      // Convert to week_structure format
      const weekStructure = {}
      workoutPlan.days.forEach((day, index) => {
        weekStructure[`dag${index + 1}`] = {
          name: day.name,
          focus: day.focus,
          geschatteTijd: day.geschatteTijd,
          exercises: day.exercises.map(ex => ({
            name: ex.name,
            sets: ex.sets,
            reps: ex.reps,
            rust: ex.rust,
            rpe: ex.rpe,
            equipment: ex.equipment,
            primairSpieren: ex.primairSpieren,
            notes: ex.notes
          }))
        }
      })
      
      // Create schema
      const user = await db.getCurrentUser()
      const { data: schema, error: schemaError } = await db.supabase
        .from('workout_schemas')
        .insert({
          name: workoutPlan.name || 'Custom Workout',
          description: workoutPlan.description,
          user_id: user.id,
          days_per_week: workoutPlan.days.length,
          week_structure: weekStructure,
          is_ai_generated: false,
          is_template: false,
          created_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (schemaError) throw schemaError
      
      // Assign to each client
      for (const clientId of selectedClients) {
        await db.assignWorkoutToClient(clientId, schema.id)
      }
      
      alert(`✅ Workout toegewezen aan ${selectedClients.length} client(s)!`)
      onClose()
      
    } catch (error) {
      console.error('Assignment error:', error)
      alert('❌ Fout bij toewijzen: ' + error.message)
    } finally {
      setAssigning(false)
    }
  }
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(10px)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: isMobile ? '1rem' : '2rem'
    }}>
      <div style={{
        background: 'linear-gradient(180deg, #1a1a1a 0%, #0f0f0f 100%)',
        borderRadius: '20px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        width: '100%',
        maxWidth: '600px',
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{
          padding: isMobile ? '1rem' : '1.5rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{
            fontSize: isMobile ? '1.25rem' : '1.5rem',
            fontWeight: '700',
            color: '#fff',
            margin: 0
          }}>
            Assign to Clients
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: '1.5rem'
            }}
          >
            ×
          </button>
        </div>
        
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: isMobile ? '1rem' : '1.5rem'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}>
            {clients.map(client => (
              <button
                key={client.id}
                onClick={() => toggleClient(client.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: isMobile ? '0.75rem' : '1rem',
                  background: selectedClients.includes(client.id)
                    ? 'rgba(16, 185, 129, 0.1)'
                    : 'rgba(255, 255, 255, 0.03)',
                  border: selectedClients.includes(client.id)
                    ? '1px solid rgba(16, 185, 129, 0.3)'
                    : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '6px',
                  border: selectedClients.includes(client.id)
                    ? '2px solid #10b981'
                    : '2px solid rgba(255, 255, 255, 0.3)',
                  background: selectedClients.includes(client.id)
                    ? '#10b981'
                    : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {selectedClients.includes(client.id) && (
                    <Check size={12} color="#000" />
                  )}
                </div>
                
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <h4 style={{
                    color: '#fff',
                    fontSize: isMobile ? '0.9rem' : '1rem',
                    fontWeight: '600',
                    margin: 0
                  }}>
                    {client.first_name} {client.last_name}
                  </h4>
                  {client.email && (
                    <p style={{
                      color: 'rgba(255, 255, 255, 0.5)',
                      fontSize: isMobile ? '0.75rem' : '0.8rem',
                      margin: 0
                    }}>
                      {client.email}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
        
        <div style={{
          padding: isMobile ? '1rem' : '1.5rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          gap: '0.75rem'
        }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '0.75rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: isMobile ? '0.9rem' : '1rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          
          <button
            onClick={assignToClients}
            disabled={assigning || selectedClients.length === 0}
            style={{
              flex: 1,
              padding: '0.75rem',
              background: assigning
                ? 'rgba(255, 255, 255, 0.1)'
                : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: 'none',
              borderRadius: '10px',
              color: '#fff',
              fontSize: isMobile ? '0.9rem' : '1rem',
              fontWeight: '600',
              cursor: assigning ? 'not-allowed' : 'pointer',
              opacity: selectedClients.length === 0 ? 0.5 : 1
            }}
          >
            {assigning ? 'Toewijzen...' : `Assign to ${selectedClients.length} Client(s)`}
          </button>
        </div>
      </div>
    </div>
  )
}

// Export both
export default TemplateManager
