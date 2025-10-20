// src/modules/manual-workout-builder/components/ClientAssigner.jsx
import { useState } from 'react'
import { Users, Check, AlertCircle } from 'lucide-react'

export default function ClientAssigner({ clients, workoutPlan, db, onClose, isMobile }) {
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
      // Convert to EXACT database format: dag1, dag2, etc.
      const weekStructure = {}
      workoutPlan.days.forEach((day, index) => {
        weekStructure[`dag${index + 1}`] = {
          name: day.name,
          focus: day.focus,
          geschatteTijd: day.geschatteTijd,
          exercises: day.exercises.map(ex => ({
            name: ex.name,
            sets: parseInt(ex.sets) || 3,
            reps: ex.reps || '8-12',
            rust: ex.rust || '2 min',
            rpe: ex.rpe || '7-8',
            equipment: ex.equipment || 'dumbbells',
            primairSpieren: ex.primairSpieren || 'chest',
            notes: ex.notes || '',
            // Optional fields from AI workouts
            type: ex.type || 'compound',
            stretch: ex.stretch || false,
            priority: ex.priority || 1,
            goalPriority: ex.goalPriority || false
          }))
        }
      })
      
      // Get current user
      const user = await db.getCurrentUser()
      if (!user) {
        alert('Je moet ingelogd zijn')
        return
      }
      
      // Create workout schema with all required fields
      const schemaData = {
        name: workoutPlan.name || 'Custom Workout',
        description: workoutPlan.description || '',
        user_id: user.id,
        primary_goal: workoutPlan.primary_goal || 'muscle_gain',
        experience_level: workoutPlan.experience_level || 'intermediate',
        split_type: workoutPlan.split_type || 'custom',
        days_per_week: workoutPlan.days.length,
        time_per_session: 60,
        week_structure: weekStructure,
        equipment: workoutPlan.equipment || [],
        is_ai_generated: false,
        is_template: false,
        is_public: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      // Create the schema
      const { data: schema, error: schemaError } = await db.supabase
        .from('workout_schemas')
        .insert(schemaData)
        .select()
        .single()
      
      if (schemaError) {
        console.error('Schema creation error:', schemaError)
        throw new Error(`Schema error: ${schemaError.message}`)
      }
      
      // Assign to each client by updating assigned_schema_id
      const updatePromises = selectedClients.map(clientId => 
        db.supabase
          .from('clients')
          .update({ 
            assigned_schema_id: schema.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', clientId)
      )
      
      const results = await Promise.all(updatePromises)
      
      // Check for errors
      const errors = results.filter(r => r.error)
      if (errors.length > 0) {
        console.error('Assignment errors:', errors)
        throw new Error(`Failed to assign to ${errors.length} client(s)`)
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
  
  // Group clients by assigned status
  const clientsWithWorkout = clients.filter(c => c.assigned_schema_id)
  const clientsWithoutWorkout = clients.filter(c => !c.assigned_schema_id)
  
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
        {/* Header */}
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
              fontSize: '1.5rem',
              padding: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '44px',
              minHeight: '44px',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            ×
          </button>
        </div>
        
        {/* Client List */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: isMobile ? '1rem' : '1.5rem'
        }}>
          {/* Clients without workout */}
          {clientsWithoutWorkout.length > 0 && (
            <>
              <div style={{
                fontSize: '0.85rem',
                color: 'rgba(255, 255, 255, 0.5)',
                marginBottom: '0.75rem',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Zonder Workout ({clientsWithoutWorkout.length})
              </div>
              
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                marginBottom: '1.5rem'
              }}>
                {clientsWithoutWorkout.map(client => (
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
                      transition: 'all 0.3s ease',
                      minHeight: '44px',
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent'
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
                      justifyContent: 'center',
                      flexShrink: 0
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
            </>
          )}
          
          {/* Clients with workout - Warning */}
          {clientsWithWorkout.length > 0 && (
            <>
              <div style={{
                fontSize: '0.85rem',
                color: 'rgba(249, 115, 22, 0.8)',
                marginBottom: '0.75rem',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <AlertCircle size={14} />
                Hebben al een workout ({clientsWithWorkout.length})
              </div>
              
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}>
                {clientsWithWorkout.map(client => (
                  <button
                    key={client.id}
                    onClick={() => toggleClient(client.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: isMobile ? '0.75rem' : '1rem',
                      background: selectedClients.includes(client.id)
                        ? 'rgba(249, 115, 22, 0.1)'
                        : 'rgba(255, 255, 255, 0.02)',
                      border: selectedClients.includes(client.id)
                        ? '1px solid rgba(249, 115, 22, 0.3)'
                        : '1px solid rgba(249, 115, 22, 0.1)',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      position: 'relative',
                      minHeight: '44px',
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent'
                    }}
                  >
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '6px',
                      border: selectedClients.includes(client.id)
                        ? '2px solid #f97316'
                        : '2px solid rgba(249, 115, 22, 0.3)',
                      background: selectedClients.includes(client.id)
                        ? '#f97316'
                        : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
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
                      <p style={{
                        color: 'rgba(249, 115, 22, 0.8)',
                        fontSize: isMobile ? '0.7rem' : '0.75rem',
                        margin: 0
                      }}>
                        ⚠️ Wordt overschreven
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        
        {/* Footer */}
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
              cursor: 'pointer',
              minHeight: '44px',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
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
                : selectedClients.length === 0
                ? 'rgba(255, 255, 255, 0.05)'
                : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: 'none',
              borderRadius: '10px',
              color: '#fff',
              fontSize: isMobile ? '0.9rem' : '1rem',
              fontWeight: '600',
              cursor: assigning || selectedClients.length === 0 ? 'not-allowed' : 'pointer',
              opacity: selectedClients.length === 0 ? 0.5 : 1,
              minHeight: '44px',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              transition: 'all 0.3s ease'
            }}
          >
            {assigning ? 'Toewijzen...' : `Assign to ${selectedClients.length} Client(s)`}
          </button>
        </div>
        
        {/* Warning message */}
        {selectedClients.some(id => clientsWithWorkout.find(c => c.id === id)) && (
          <div style={{
            padding: '0.75rem 1.5rem',
            background: 'rgba(249, 115, 22, 0.1)',
            borderTop: '1px solid rgba(249, 115, 22, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <AlertCircle size={16} color="#f97316" />
            <span style={{
              color: 'rgba(249, 115, 22, 0.9)',
              fontSize: isMobile ? '0.75rem' : '0.8rem'
            }}>
              Let op: Bestaande workouts worden overschreven
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
