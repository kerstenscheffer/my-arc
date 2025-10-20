import { useState, useEffect } from 'react'

// Coach Challenge Assignment Tab Component
export default function ChallengeAssignmentWidget({ db, clients }) {
  const [selectedClients, setSelectedClients] = useState([])
  const [assignedClients, setAssignedClients] = useState([])
  const [loading, setLoading] = useState(false)
  const isMobile = window.innerWidth <= 768

  useEffect(() => {
    loadAssignments()
  }, [])

  async function loadAssignments() {
    try {
      // Get all active challenge assignments
      const { data } = await db.supabase
        .from('challenge_assignments')
        .select('client_id')
        .eq('is_active', true)
      
      setAssignedClients(data?.map(a => a.client_id) || [])
    } catch (error) {
      console.error('Error loading assignments:', error)
    }
  }

  async function assignChallenge(clientId) {
    setLoading(true)
    try {
      // Check if already assigned
      const { data: existing } = await db.supabase
        .from('challenge_assignments')
        .select('id')
        .eq('client_id', clientId)
        .eq('is_active', true)
        .single()

      if (existing) {
        alert('Client already in active challenge!')
        return
      }

      // Get coach's auth user id (not client id)
      const currentUser = await db.getCurrentUser()
      
      // Create new assignment - coach_id should be auth.uid
      const { error } = await db.supabase
        .from('challenge_assignments')
        .insert({
          client_id: clientId,
          coach_id: currentUser.id, // This is the auth.users.id
          challenge_type: '8week',
          start_date: new Date().toISOString().split('T')[0],
          end_date: new Date(Date.now() + 56 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          is_active: true
        })

      if (error) throw error

      // Update local state
      setAssignedClients([...assignedClients, clientId])
      alert('Challenge assigned successfully!')
      
    } catch (error) {
      console.error('Error assigning challenge:', error)
      alert('Error assigning challenge')
    }
    setLoading(false)
  }

  async function removeChallenge(clientId) {
    if (!confirm('Remove client from challenge?')) return
    
    setLoading(true)
    try {
      const { error } = await db.supabase
        .from('challenge_assignments')
        .update({ is_active: false })
        .eq('client_id', clientId)
        .eq('is_active', true)

      if (error) throw error

      // Update local state
      setAssignedClients(assignedClients.filter(id => id !== clientId))
      alert('Challenge removed')
      
    } catch (error) {
      console.error('Error removing challenge:', error)
      alert('Error removing challenge')
    }
    setLoading(false)
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.1) 0%, rgba(220, 38, 38, 0.05) 100%)',
      borderRadius: '16px',
      padding: isMobile ? '1rem' : '1.5rem',
      border: '1px solid rgba(220, 38, 38, 0.2)',
      marginBottom: '1.5rem'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        marginBottom: '1rem'
      }}>
        <span style={{ fontSize: '1.25rem' }}>🏆</span>
        <h3 style={{
          fontSize: isMobile ? '1rem' : '1.1rem',
          fontWeight: '700',
          color: '#fff',
          margin: 0
        }}>
          8-Week Challenge Assignment
        </h3>
      </div>

      {/* Client List */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        maxHeight: '400px',
        overflowY: 'auto'
      }}>
        {clients.map(client => {
          const isAssigned = assignedClients.includes(client.id)
          
          return (
            <div
              key={client.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: isMobile ? '0.75rem' : '1rem',
                background: isAssigned 
                  ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%)'
                  : 'rgba(255, 255, 255, 0.03)',
                borderRadius: '12px',
                border: `1px solid ${isAssigned ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: isAssigned ? '#10b981' : '#6b7280'
                }} />
                <div>
                  <div style={{
                    fontSize: isMobile ? '0.9rem' : '0.95rem',
                    fontWeight: '600',
                    color: '#fff'
                  }}>
                    {client.first_name} {client.last_name}
                  </div>
                  {isAssigned && (
                    <div style={{
                      fontSize: '0.75rem',
                      color: 'rgba(255, 255, 255, 0.6)',
                      marginTop: '0.25rem'
                    }}>
                      Challenge Active
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => isAssigned ? removeChallenge(client.id) : assignChallenge(client.id)}
                disabled={loading}
                style={{
                  padding: isMobile ? '0.5rem 0.75rem' : '0.5rem 1rem',
                  background: isAssigned
                    ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(239, 68, 68, 0.1) 100%)'
                    : 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                  border: `1px solid ${isAssigned ? 'rgba(239, 68, 68, 0.3)' : 'rgba(220, 38, 38, 0.3)'}`,
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: isMobile ? '0.8rem' : '0.85rem',
                  fontWeight: '600',
                  cursor: loading ? 'wait' : 'pointer',
                  opacity: loading ? 0.5 : 1,
                  transition: 'all 0.3s ease',
                  minWidth: isMobile ? '80px' : '100px',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent'
                }}
                onTouchStart={(e) => {
                  if (isMobile && !loading) {
                    e.currentTarget.style.transform = 'scale(0.98)'
                  }
                }}
                onTouchEnd={(e) => {
                  if (isMobile) {
                    e.currentTarget.style.transform = 'scale(1)'
                  }
                }}
              >
                {isAssigned ? 'Remove' : 'Assign'}
              </button>
            </div>
          )
        })}
      </div>

      {/* Quick Stats */}
      <div style={{
        marginTop: '1rem',
        paddingTop: '1rem',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: isMobile ? '0.8rem' : '0.85rem',
        color: 'rgba(255, 255, 255, 0.6)'
      }}>
        <span>Total Clients: {clients.length}</span>
        <span style={{ color: '#10b981' }}>
          In Challenge: {assignedClients.length}
        </span>
      </div>
    </div>
  )
}
