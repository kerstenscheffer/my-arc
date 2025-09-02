import React, { useState, useEffect } from 'react'

const AssignChallenge = ({ db }) => {
  const isMobile = window.innerWidth <= 768
  
  const [clients, setClients] = useState([])
  const [challenges, setChallenges] = useState([])
  const [selectedClient, setSelectedClient] = useState(null)
  const [selectedChallenge, setSelectedChallenge] = useState(null)
  const [loading, setLoading] = useState(false)
  const [assignments, setAssignments] = useState([])
  
  useEffect(() => {
    loadData()
  }, [])
  
  const loadData = async () => {
    try {
      // Load clients
      const clientsData = await db.getClients()
      setClients(clientsData || [])
      
      // Load challenges
      const { data: challengesData } = await db.supabase
        .from('challenges')
        .select('*')
        .order('created_at', { ascending: false })
      setChallenges(challengesData || [])
      
      // Load existing assignments
      const { data: assignmentsData } = await db.supabase
        .from('client_challenges')
        .select(`
          *,
          challenges(title, category),
          clients(name)
        `)
        .order('created_at', { ascending: false })
      setAssignments(assignmentsData || [])
    } catch (error) {
      console.error('Load data failed:', error)
    }
  }
  
  const handleAssign = async () => {
    if (!selectedClient || !selectedChallenge) {
      alert('Selecteer zowel een client als een challenge')
      return
    }
    
    setLoading(true)
    try {
      // Check if already assigned
      const existing = assignments.find(
        a => a.client_id === selectedClient && a.challenge_id === selectedChallenge
      )
      
      if (existing) {
        alert('Deze challenge is al toegewezen aan deze client!')
        return
      }
      
      // Get current user
      const { data: { user } } = await db.supabase.auth.getUser()
      
      // Assign challenge
      await db.assignChallengeToClient(
        selectedChallenge,
        selectedClient,
        user?.id || null
      )
      
      alert('Challenge succesvol toegewezen!')
      
      // Reload assignments
      await loadData()
      
      // Reset selections
      setSelectedClient(null)
      setSelectedChallenge(null)
    } catch (error) {
      console.error('Assignment failed:', error)
      alert('Toewijzing mislukt: ' + error.message)
    } finally {
      setLoading(false)
    }
  }
  
  const removeAssignment = async (assignmentId) => {
    if (!confirm('Weet je zeker dat je deze toewijzing wilt verwijderen?')) return
    
    try {
      const { error } = await db.supabase
        .from('client_challenges')
        .delete()
        .eq('id', assignmentId)
      
      if (error) throw error
      
      alert('Toewijzing verwijderd')
      await loadData()
    } catch (error) {
      console.error('Remove assignment failed:', error)
      alert('Verwijderen mislukt')
    }
  }
  
  // Category colors
  const categoryColors = {
    herstel: '#60a5fa',
    mindset: '#ef4444',
    workout: '#f59e0b',
    voeding: '#10b981',
    structuur: '#8b5cf6',
    running: '#ec4899',
    strength: '#14b8a6'
  }
  
  return (
    <div style={{
      background: '#0a0a0a',
      borderRadius: isMobile ? '12px' : '16px',
      padding: isMobile ? '1rem' : '1.5rem',
      border: '1px solid #333',
      maxWidth: '1200px',
      margin: '0 auto',
      minHeight: isMobile ? '400px' : '500px'
    }}>
      {/* Header */}
      <div style={{
        marginBottom: '2rem',
        textAlign: 'center'
      }}>
        <h2 style={{
          fontSize: isMobile ? '1.5rem' : '2rem',
          fontWeight: 'bold',
          background: 'linear-gradient(135deg, #10b981, #059669)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '0.5rem'
        }}>
          🎯 Challenge Toewijzen
        </h2>
        <p style={{
          color: 'rgba(255,255,255,0.7)',
          fontSize: isMobile ? '0.875rem' : '1rem'
        }}>
          Wijs challenges toe aan je clients
        </p>
      </div>
      
      {/* Assignment Form */}
      <div style={{
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '12px',
        padding: isMobile ? '1rem' : '1.5rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr auto',
          gap: '1rem',
          alignItems: 'end'
        }}>
          {/* Client Selector */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: 'rgba(255,255,255,0.8)',
              fontSize: '0.875rem'
            }}>
              Selecteer Client
            </label>
            <select
              value={selectedClient || ''}
              onChange={(e) => setSelectedClient(e.target.value)}
              style={{
                width: '100%',
                padding: isMobile ? '0.875rem' : '1rem',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: isMobile ? '1rem' : '1.125rem',
                cursor: 'pointer'
              }}
            >
              <option value="">Kies een client...</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* Challenge Selector */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: 'rgba(255,255,255,0.8)',
              fontSize: '0.875rem'
            }}>
              Selecteer Challenge
            </label>
            <select
              value={selectedChallenge || ''}
              onChange={(e) => setSelectedChallenge(e.target.value)}
              style={{
                width: '100%',
                padding: isMobile ? '0.875rem' : '1rem',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: isMobile ? '1rem' : '1.125rem',
                cursor: 'pointer'
              }}
            >
              <option value="">Kies een challenge...</option>
              {challenges.map(challenge => (
                <option key={challenge.id} value={challenge.id}>
                  {challenge.title} ({challenge.category})
                </option>
              ))}
            </select>
          </div>
          
          {/* Assign Button */}
          <button
            onClick={handleAssign}
            disabled={!selectedClient || !selectedChallenge || loading}
            style={{
              padding: isMobile ? '0.875rem 1.5rem' : '1rem 2rem',
              background: (!selectedClient || !selectedChallenge || loading)
                ? 'rgba(16, 185, 129, 0.3)'
                : 'linear-gradient(135deg, #10b981, #059669)',
              border: 'none',
              borderRadius: '8px',
              color: (!selectedClient || !selectedChallenge || loading) 
                ? 'rgba(255,255,255,0.5)' 
                : '#000',
              fontSize: isMobile ? '1rem' : '1.125rem',
              fontWeight: 'bold',
              cursor: (!selectedClient || !selectedChallenge || loading) 
                ? 'not-allowed' 
                : 'pointer',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '44px',
              transition: 'all 0.3s ease'
            }}
            onTouchStart={(e) => {
              if (isMobile && selectedClient && selectedChallenge && !loading) {
                e.currentTarget.style.transform = 'scale(0.98)'
              }
            }}
            onTouchEnd={(e) => {
              if (isMobile) {
                e.currentTarget.style.transform = 'scale(1)'
              }
            }}
          >
            {loading ? 'Toewijzen...' : 'Toewijzen'}
          </button>
        </div>
      </div>
      
      {/* Current Assignments */}
      <div>
        <h3 style={{
          color: '#fff',
          fontSize: isMobile ? '1.25rem' : '1.5rem',
          marginBottom: '1rem'
        }}>
          📋 Huidige Toewijzingen ({assignments.length})
        </h3>
        
        {assignments.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            color: 'rgba(255,255,255,0.5)',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '12px'
          }}>
            Nog geen challenges toegewezen
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1rem'
          }}>
            {assignments.map(assignment => (
              <div
                key={assignment.id}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: '12px',
                  padding: '1rem',
                  border: '1px solid rgba(255,255,255,0.1)',
                  position: 'relative'
                }}
              >
                {/* Category Badge */}
                <div style={{
                  position: 'absolute',
                  top: '0.5rem',
                  right: '0.5rem',
                  padding: '0.25rem 0.75rem',
                  background: categoryColors[assignment.challenges?.category] || '#666',
                  borderRadius: '20px',
                  fontSize: '0.75rem',
                  color: '#000',
                  fontWeight: 'bold'
                }}>
                  {assignment.challenges?.category || 'unknown'}
                </div>
                
                <h4 style={{
                  color: '#10b981',
                  marginBottom: '0.5rem',
                  fontSize: isMobile ? '1rem' : '1.125rem',
                  paddingRight: '100px'
                }}>
                  {assignment.challenges?.title || 'Unknown Challenge'}
                </h4>
                
                <div style={{
                  color: 'rgba(255,255,255,0.8)',
                  fontSize: '0.875rem',
                  marginBottom: '0.5rem'
                }}>
                  👤 {assignment.clients?.name || 'Unknown Client'}
                </div>
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '1rem'
                }}>
                  <div style={{
                    fontSize: '0.875rem',
                    color: 'rgba(255,255,255,0.6)'
                  }}>
                    Week {assignment.current_week || 1} • {assignment.status}
                  </div>
                  
                  <button
                    onClick={() => removeAssignment(assignment.id)}
                    style={{
                      padding: '0.5rem',
                      background: 'rgba(239, 68, 68, 0.2)',
                      border: '1px solid #ef4444',
                      borderRadius: '6px',
                      color: '#ef4444',
                      fontSize: '0.75rem',
                      cursor: 'pointer'
                    }}
                  >
                    Verwijder
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default AssignChallenge
