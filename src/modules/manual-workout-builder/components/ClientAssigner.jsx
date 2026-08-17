// src/modules/manual-workout-builder/components/ClientAssigner.jsx
import { useState } from 'react'
import { Users, Check, AlertCircle } from 'lucide-react'

export default function ClientAssigner({ clients, workoutPlan, db, onClose, isMobile, initialClient }) {
  const [selectedClients, setSelectedClients] = useState(initialClient ? [initialClient.id] : [])
  const [assigning, setAssigning] = useState(false)
  // 'selected' = alleen aangevinkte klanten (actief). 'all' = iedereen, in hun
  // bibliotheek (niet auto-actief, behalve klanten die nog géén plan hebben).
  const [mode, setMode] = useState('selected')

  const toggleClient = (clientId) => {
    setSelectedClients(prev =>
      prev.includes(clientId)
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    )
  }

  const assignToClients = async () => {
    const targetClients = mode === 'all' ? clients.map(c => c.id) : selectedClients
    if (targetClients.length === 0) {
      alert(mode === 'all' ? 'Geen klanten gevonden' : 'Selecteer minimaal één client')
      return
    }

    setAssigning(true)
    
    try {
      const weekStructure = {}
      workoutPlan.days.forEach((day, index) => {
        weekStructure[`dag${index + 1}`] = {
          name: day.name,
          focus: day.focus,
          geschatteTijd: day.geschatteTijd,
          exercises: day.exercises.map(ex => ex.type === 'cardio' ? ({
            name: ex.name,
            type: 'cardio',
            duration: ex.duration || '',
            distance: ex.distance || '',
            intensity: ex.intensity || '',
            notes: ex.notes || ''
          }) : ({
            name: ex.name,
            sets: parseInt(ex.sets) || 3,
            reps: ex.reps || '8-12',
            rust: ex.rust || '2 min',
            rpe: ex.rpe || '7-8',
            equipment: ex.equipment || 'dumbbells',
            primairSpieren: ex.primairSpieren || 'chest',
            notes: ex.notes || '',
            type: ex.type || 'compound',
            stretch: ex.stretch || false,
            priority: ex.priority || 1,
            goalPriority: ex.goalPriority || false
          }))
        }
      })
      
      const user = await db.getCurrentUser()
      if (!user) { alert('Je moet ingelogd zijn'); return }

      const baseSchema = {
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

      // Per klant een EIGEN schema-instance (met client_id) → elke klant bouwt een
      // eigen plan-bibliotheek op. Actief zetten: 'selected' = altijd (dat is de
      // normale toewijs-flow); 'all' (iedereen) = alleen in de bibliotheek, behalve
      // klanten die nog géén actief plan hebben (die krijgen 't wél actief).
      let activated = 0
      for (const clientId of targetClients) {
        const clientObj = clients.find(c => c.id === clientId)
        const clientName = clientObj ? `${clientObj.first_name || ''} ${clientObj.last_name || ''}`.trim() : null
        const { data: schema, error: schemaError } = await db.supabase
          .from('workout_schemas')
          .insert({ ...baseSchema, client_id: clientId, client_name: clientName })
          .select().single()
        if (schemaError) throw new Error(`Schema error: ${schemaError.message}`)

        const makeActive = mode === 'selected' || !clientObj?.assigned_schema_id
        if (makeActive) {
          const { error: assignError } = await db.supabase
            .from('clients')
            .update({ assigned_schema_id: schema.id, updated_at: new Date().toISOString() })
            .eq('id', clientId)
          if (assignError) throw new Error(`Toewijzen mislukt: ${assignError.message}`)
          activated++
        }
      }

      alert(mode === 'all'
        ? `✅ Plan in de bibliotheek van ${targetClients.length} klant(en) gezet${activated ? ` — ${activated} kreeg 't meteen als actief plan (had er nog geen)` : ''}.`
        : `✅ Workout toegewezen aan ${targetClients.length} client(s)!`)
      onClose()
      
    } catch (error) {
      console.error('Assignment error:', error)
      alert('❌ Fout bij toewijzen: ' + error.message)
    } finally {
      setAssigning(false)
    }
  }
  
  const clientsWithWorkout = clients.filter(c => c.assigned_schema_id)
  const clientsWithoutWorkout = clients.filter(c => !c.assigned_schema_id)
  
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '1rem' : '2rem' }}>
      <div style={{ background: 'linear-gradient(180deg, #1a1a1a 0%, #0f0f0f 100%)', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.1)', width: '100%', maxWidth: '600px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
        
        {/* Header */}
        <div style={{ padding: isMobile ? '1rem' : '1.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: isMobile ? '1.25rem' : '1.5rem', fontWeight: '700', color: '#fff', margin: 0 }}>Assign to Clients</h2>
            {initialClient && (
              <p style={{ fontSize: '0.75rem', color: '#FFD700', margin: '0.2rem 0 0', fontWeight: '600' }}>
                {initialClient.first_name} {initialClient.last_name} voorgeselecteerd
              </p>
            )}
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(255, 255, 255, 0.5)', fontSize: '1.5rem', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '44px', minHeight: '44px', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>×</button>
        </div>
        
        {/* Doelgroep-toggle: geselecteerde klanten vs iedereen */}
        <div style={{ padding: isMobile ? '0.85rem 1rem 0' : '1rem 1.5rem 0', display: 'flex', gap: '0.5rem' }}>
          {[
            { id: 'selected', label: 'Alleen aan geselecteerde' },
            { id: 'all', label: `Iedereen (${clients.length})` },
          ].map(opt => {
            const active = mode === opt.id
            return (
              <button key={opt.id} onClick={() => setMode(opt.id)}
                style={{ flex: 1, padding: '0.6rem', borderRadius: '10px', cursor: 'pointer', fontSize: isMobile ? '0.75rem' : '0.8rem', fontWeight: 800,
                  background: active ? 'rgba(16,185,129,0.14)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${active ? 'rgba(16,185,129,0.5)' : 'rgba(255,255,255,0.1)'}`,
                  color: active ? '#10b981' : 'rgba(255,255,255,0.55)' }}>{opt.label}</button>
            )
          })}
        </div>
        {mode === 'all' && (
          <div style={{ padding: isMobile ? '0.6rem 1rem 0' : '0.7rem 1.5rem 0', fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
            Dit plan komt in de bibliotheek van <b style={{ color: '#fff' }}>alle {clients.length} klanten</b> — ze kunnen het inzien en zelf activeren via de Wissel-knop. Klanten zónder actief plan krijgen 't meteen actief.
          </div>
        )}

        {/* Client List — alleen bij 'geselecteerde' */}
        {mode === 'selected' && (
        <div style={{ flex: 1, overflow: 'auto', padding: isMobile ? '1rem' : '1.5rem' }}>

          {clientsWithoutWorkout.length > 0 && (
            <>
              <div style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '0.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Zonder Workout ({clientsWithoutWorkout.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                {clientsWithoutWorkout.map(client => (
                  <button key={client.id} onClick={() => toggleClient(client.id)} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: isMobile ? '0.75rem' : '1rem', background: selectedClients.includes(client.id) ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.03)', border: selectedClients.includes(client.id) ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '10px', cursor: 'pointer', minHeight: '44px', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
                    <div style={{ width: '20px', height: '20px', borderRadius: '6px', border: selectedClients.includes(client.id) ? '2px solid #10b981' : '2px solid rgba(255, 255, 255, 0.3)', background: selectedClients.includes(client.id) ? '#10b981' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {selectedClients.includes(client.id) && <Check size={12} color="#000" />}
                    </div>
                    <div style={{ flex: 1, textAlign: 'left' }}>
                      <h4 style={{ color: '#fff', fontSize: isMobile ? '0.9rem' : '1rem', fontWeight: '600', margin: 0 }}>{client.first_name} {client.last_name}</h4>
                      {client.email && <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: isMobile ? '0.75rem' : '0.8rem', margin: 0 }}>{client.email}</p>}
                    </div>
                    {initialClient?.id === client.id && (
                      <span style={{ fontSize: '0.55rem', fontWeight: '700', color: '#FFD700', background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.2)', borderRadius: '4px', padding: '0.1rem 0.35rem' }}>GESELECTEERD</span>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
          
          {clientsWithWorkout.length > 0 && (
            <>
              <div style={{ fontSize: '0.85rem', color: 'rgba(249, 115, 22, 0.8)', marginBottom: '0.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle size={14} /> Hebben al een workout ({clientsWithWorkout.length}) — dit wordt hun nieuwe actieve plan
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {clientsWithWorkout.map(client => (
                  <button key={client.id} onClick={() => toggleClient(client.id)} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: isMobile ? '0.75rem' : '1rem', background: selectedClients.includes(client.id) ? 'rgba(249, 115, 22, 0.1)' : 'rgba(255, 255, 255, 0.02)', border: selectedClients.includes(client.id) ? '1px solid rgba(249, 115, 22, 0.3)' : '1px solid rgba(249, 115, 22, 0.1)', borderRadius: '10px', cursor: 'pointer', minHeight: '44px', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
                    <div style={{ width: '20px', height: '20px', borderRadius: '6px', border: selectedClients.includes(client.id) ? '2px solid #f97316' : '2px solid rgba(249, 115, 22, 0.3)', background: selectedClients.includes(client.id) ? '#f97316' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {selectedClients.includes(client.id) && <Check size={12} color="#000" />}
                    </div>
                    <div style={{ flex: 1, textAlign: 'left' }}>
                      <h4 style={{ color: '#fff', fontSize: isMobile ? '0.9rem' : '1rem', fontWeight: '600', margin: 0 }}>{client.first_name} {client.last_name}</h4>
                      <p style={{ color: 'rgba(249, 115, 22, 0.8)', fontSize: isMobile ? '0.7rem' : '0.75rem', margin: 0 }}>Nieuw plan wordt actief · oude blijft bewaard</p>
                    </div>
                    {initialClient?.id === client.id && (
                      <span style={{ fontSize: '0.55rem', fontWeight: '700', color: '#FFD700', background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.2)', borderRadius: '4px', padding: '0.1rem 0.35rem' }}>GESELECTEERD</span>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        )}

        {/* Footer */}
        <div style={{ padding: isMobile ? '1rem' : '1.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', gap: '0.75rem' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '0.75rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '10px', color: 'rgba(255, 255, 255, 0.7)', fontSize: isMobile ? '0.9rem' : '1rem', fontWeight: '600', cursor: 'pointer', minHeight: '44px', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
            Cancel
          </button>
          {(() => {
            const disabled = assigning || (mode === 'selected' && selectedClients.length === 0)
            return (
              <button onClick={assignToClients} disabled={disabled} style={{ flex: 1, padding: '0.75rem', background: assigning ? 'rgba(255, 255, 255, 0.1)' : disabled ? 'rgba(255, 255, 255, 0.05)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none', borderRadius: '10px', color: '#fff', fontSize: isMobile ? '0.9rem' : '1rem', fontWeight: '600', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, minHeight: '44px', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
                {assigning ? 'Toewijzen...' : (mode === 'all' ? `Toewijzen aan alle ${clients.length}` : `Assign to ${selectedClients.length} Client(s)`)}
              </button>
            )
          })()}
        </div>
        
        {selectedClients.some(id => clientsWithWorkout.find(c => c.id === id)) && (
          <div style={{ padding: '0.75rem 1.5rem', background: 'rgba(249, 115, 22, 0.1)', borderTop: '1px solid rgba(249, 115, 22, 0.2)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={16} color="#f97316" />
            <span style={{ color: 'rgba(249, 115, 22, 0.9)', fontSize: isMobile ? '0.75rem' : '0.8rem' }}>Het nieuwe plan wordt actief; bestaande plannen blijven bewaard en zijn wisselbaar door de klant</span>
          </div>
        )}
      </div>
    </div>
  )
}
