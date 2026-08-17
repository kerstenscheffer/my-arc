// src/modules/manual-workout-builder/components/TemplateManager.jsx
import { useState } from 'react'
import { FileText, Clock, Archive, ArchiveRestore, Trash2 } from 'lucide-react'

export function TemplateManager({ templates, onLoad, onClose, isMobile, db, onChange }) {
  const [showArchived, setShowArchived] = useState(false)
  const [busy, setBusy] = useState(null)

  const setArchived = async (tpl, archived, e) => {
    e.stopPropagation()
    if (busy) return
    setBusy(tpl.id)
    try {
      await db.supabase.from('workout_schemas').update({ is_archived: archived, updated_at: new Date().toISOString() }).eq('id', tpl.id)
      onChange && await onChange()
    } catch (err) { console.error(err); alert('Archiveren mislukt.') } finally { setBusy(null) }
  }
  const remove = async (tpl, e) => {
    e.stopPropagation()
    if (busy) return
    if (!confirm(`Template "${tpl.name}" definitief verwijderen?`)) return
    setBusy(tpl.id)
    try {
      await db.supabase.from('workout_schemas').delete().eq('id', tpl.id).eq('is_template', true)
      onChange && await onChange()
    } catch (err) { console.error(err); alert('Verwijderen mislukt.') } finally { setBusy(null) }
  }

  const list = (templates || []).filter(t => showArchived ? t.is_archived : !t.is_archived)
  const archivedCount = (templates || []).filter(t => t.is_archived).length

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
            {showArchived ? 'Gearchiveerd' : 'Workout Templates'}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => setShowArchived(v => !v)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '0.35rem 0.6rem', borderRadius: 8, background: showArchived ? 'rgba(255,215,0,0.14)' : 'rgba(255,255,255,0.05)', border: `1px solid ${showArchived ? 'rgba(255,215,0,0.4)' : 'rgba(255,255,255,0.12)'}`, color: showArchived ? '#FFD700' : 'rgba(255,255,255,0.6)', fontSize: '0.68rem', fontWeight: 800, cursor: 'pointer' }}
            >
              <Archive size={13} /> {showArchived ? 'Actief' : `Archief${archivedCount ? ` (${archivedCount})` : ''}`}
            </button>
            <button
              onClick={onClose}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(255, 255, 255, 0.5)', fontSize: '1.5rem' }}
            >
              ×
            </button>
          </div>
        </div>
        
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: isMobile ? '1rem' : '1.5rem'
        }}>
          {list.length === 0 ? (
            <div style={{
              textAlign: 'center',
              color: 'rgba(255, 255, 255, 0.5)',
              padding: '3rem'
            }}>
              {showArchived ? 'Geen gearchiveerde templates' : 'Nog geen templates opgeslagen'}
            </div>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}>
              {list.map(template => (
                <div key={template.id} style={{
                  display: 'flex', alignItems: 'stretch',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px', overflow: 'hidden',
                }}>
                  {/* Klikbaar naam-gebied → laadt de template in de builder */}
                  <button
                    onClick={() => onLoad(template)}
                    style={{
                      flex: 1, minWidth: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem',
                      background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left',
                      padding: isMobile ? '0.75rem' : '1rem',
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <h4 style={{ color: '#fff', fontSize: isMobile ? '0.9rem' : '1rem', fontWeight: '600', margin: '0 0 0.25rem 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {template.name}
                      </h4>
                      <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: isMobile ? '0.8rem' : '0.85rem', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {template.description || 'Geen beschrijving'}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'rgba(255, 255, 255, 0.4)', fontSize: isMobile ? '0.75rem' : '0.8rem', flexShrink: 0 }}>
                      <Clock size={14} />
                      {template.days_per_week} dagen
                    </div>
                  </button>

                  {/* Archiveer/herstel + verwijder */}
                  <div style={{ display: 'flex', flexDirection: 'column', flexShrink: 0, borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
                    <button onClick={(e) => setArchived(template, !template.is_archived, e)} disabled={busy === template.id}
                      title={template.is_archived ? 'Terug uit archief' : 'Archiveren'}
                      style={{ flex: 1, width: 42, background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.55)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: busy === template.id ? 0.4 : 1 }}>
                      {template.is_archived ? <ArchiveRestore size={16} /> : <Archive size={16} />}
                    </button>
                    <button onClick={(e) => remove(template, e)} disabled={busy === template.id}
                      title="Definitief verwijderen"
                      style={{ flex: 1, width: 42, background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: busy === template.id ? 0.4 : 1 }}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
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
