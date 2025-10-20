// src/coach/tabs/client-info/ChallengeGoalManager.jsx
import { useState, useEffect } from 'react'
import { Target, TrendingDown, Calendar, MessageSquare, Save, Edit2, Trash2 } from 'lucide-react'

export default function ChallengeGoalManager({ db, client }) {
  const isMobile = window.innerWidth <= 768
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [challengeData, setChallengeData] = useState(null)
  const [existingGoal, setExistingGoal] = useState(null)
  const [editing, setEditing] = useState(false)
  
  const [formData, setFormData] = useState({
    goal_name: '',
    goal_type: 'weight',
    target_value: '',
    deadline: '',
    motivation: '',
    auto_track: true
  })
  
  useEffect(() => {
    if (client?.id) {
      loadData()
    }
  }, [client?.id])
  
  async function loadData() {
    try {
      setLoading(true)
      
      // 1. Check if client has active challenge
      const { data: challenge } = await db.supabase
        .from('challenge_assignments')
        .select('*')
        .eq('client_id', client.id)
        .eq('is_active', true)
        .single()
      
      if (!challenge) {
        setChallengeData(null)
        setLoading(false)
        return
      }
      
      setChallengeData(challenge)
      
      // 2. Load existing goal if any (NEWEST primary goal)
      const { data: goal } = await db.supabase
        .from('challenge_assignment_goals')
        .select('*')
        .eq('assignment_id', challenge.id)
        .eq('is_primary', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      
      if (goal) {
        setExistingGoal(goal)
        setFormData({
          goal_name: goal.goal_name,
          goal_type: goal.goal_type,
          target_value: goal.target_value.toString(),
          deadline: goal.deadline || '',
          motivation: goal.motivation || '',
          auto_track: goal.auto_track !== false
        })
      }
      
    } catch (error) {
      console.error('Error loading challenge goal data:', error)
    } finally {
      setLoading(false)
    }
  }
  
  async function handleSave() {
    if (!formData.goal_name || !formData.target_value) {
      alert('Vul minimaal een naam en target waarde in')
      return
    }
    
    setSaving(true)
    
    try {
      // Get starting value from weight_challenge_logs (most recent by date)
      const { data: latestWeight } = await db.supabase
        .from('weight_challenge_logs')
        .select('weight')
        .eq('client_id', client.id)
        .order('date', { ascending: false })
        .limit(1)
        .maybeSingle()
      
      const startingValue = latestWeight?.weight || parseFloat(client.current_weight) || 0
      
      const goalData = {
        assignment_id: challengeData.id,
        goal_type: formData.goal_type,
        goal_name: formData.goal_name,
        target_value: parseFloat(formData.target_value),
        starting_value: startingValue,
        current_value: startingValue,
        measurement_unit: formData.goal_type === 'weight' ? 'kg' : 'cm',
        is_primary: true, // ✅ ALTIJD TRUE voor nieuwe/updated goal
        auto_track: formData.auto_track,
        deadline: formData.deadline || null,
        motivation: formData.motivation || null,
        updated_at: new Date().toISOString()
      }
      
      // ✅ STAP 1: ZET ALLE ANDERE GOALS OP FALSE!
      const { error: deprimError } = await db.supabase
        .from('challenge_assignment_goals')
        .update({ is_primary: false })
        .eq('assignment_id', challengeData.id)
        .neq('id', existingGoal?.id || '00000000-0000-0000-0000-000000000000')
      
      if (deprimError) {
        console.warn('Could not deprimary other goals:', deprimError)
        // Continue anyway - niet kritiek
      }
      
      // ✅ STAP 2: SAVE/UPDATE DEZE GOAL ALS PRIMARY
      if (existingGoal?.id) {
        // Update existing
        const { error } = await db.supabase
          .from('challenge_assignment_goals')
          .update(goalData)
          .eq('id', existingGoal.id)
        
        if (error) throw error
      } else {
        // Create new
        goalData.created_at = new Date().toISOString()
        
        const { error } = await db.supabase
          .from('challenge_assignment_goals')
          .insert(goalData)
        
        if (error) throw error
      }
      
      alert('✅ Challenge goal opgeslagen!')
      setEditing(false)
      loadData()
      
    } catch (error) {
      console.error('Error saving challenge goal:', error)
      alert('❌ Fout bij opslaan: ' + error.message)
    } finally {
      setSaving(false)
    }
  }
  
  async function handleDelete() {
    if (!existingGoal?.id) return
    
    if (!confirm('Weet je zeker dat je dit goal wilt verwijderen?')) return
    
    setSaving(true)
    
    try {
      const { error } = await db.supabase
        .from('challenge_assignment_goals')
        .delete()
        .eq('id', existingGoal.id)
      
      if (error) throw error
      
      alert('✅ Goal verwijderd!')
      setExistingGoal(null)
      setFormData({
        goal_name: '',
        goal_type: 'weight',
        target_value: '',
        deadline: '',
        motivation: '',
        auto_track: true
      })
      
    } catch (error) {
      console.error('Error deleting goal:', error)
      alert('❌ Fout bij verwijderen: ' + error.message)
    } finally {
      setSaving(false)
    }
  }
  
  if (loading) {
    return (
      <div style={{
        padding: isMobile ? '1rem' : '1.5rem',
        textAlign: 'center',
        color: 'rgba(255, 255, 255, 0.5)'
      }}>
        Loading...
      </div>
    )
  }
  
  if (!challengeData) {
    return (
      <div style={{
        background: 'rgba(239, 68, 68, 0.1)',
        borderRadius: '12px',
        padding: isMobile ? '1rem' : '1.25rem',
        border: '1px solid rgba(239, 68, 68, 0.3)'
      }}>
        <p style={{
          color: 'rgba(255, 255, 255, 0.7)',
          fontSize: isMobile ? '0.85rem' : '0.9rem',
          margin: 0
        }}>
          ⚠️ Client heeft geen actieve challenge. Assign eerst een challenge om een goal in te stellen.
        </p>
      </div>
    )
  }
  
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
      borderRadius: '16px',
      padding: isMobile ? '1.25rem' : '1.75rem',
      border: '1px solid rgba(16, 185, 129, 0.2)',
      marginBottom: '1.5rem'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.25rem'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(16, 185, 129, 0.3)'
          }}>
            <Target size={22} color="#10b981" />
          </div>
          
          <div>
            <h3 style={{
              fontSize: isMobile ? '1rem' : '1.15rem',
              fontWeight: '700',
              color: '#10b981',
              margin: 0
            }}>
              Challenge Goal
            </h3>
            <p style={{
              fontSize: isMobile ? '0.75rem' : '0.8rem',
              color: 'rgba(255, 255, 255, 0.5)',
              margin: 0
            }}>
              Personal goal voor deze challenge
            </p>
          </div>
        </div>
        
        {!editing && existingGoal && (
          <button
            onClick={() => setEditing(true)}
            style={{
              padding: isMobile ? '0.5rem 1rem' : '0.6rem 1.25rem',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: 'none',
              borderRadius: '10px',
              color: '#fff',
              fontSize: isMobile ? '0.85rem' : '0.9rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.3s ease',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '44px'
            }}
          >
            <Edit2 size={16} />
            Bewerk
          </button>
        )}
      </div>
      
      {/* Display Mode */}
      {!editing && existingGoal && (
        <div style={{
          background: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(10px)',
          borderRadius: '12px',
          padding: isMobile ? '1rem' : '1.25rem',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <h4 style={{
            fontSize: isMobile ? '1.1rem' : '1.3rem',
            fontWeight: '700',
            color: '#fff',
            margin: 0,
            marginBottom: '0.75rem'
          }}>
            {existingGoal.goal_name}
          </h4>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
            gap: '0.75rem',
            marginBottom: '0.75rem'
          }}>
            <div>
              <span style={{
                fontSize: '0.75rem',
                color: 'rgba(255, 255, 255, 0.5)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Type
              </span>
              <div style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: '#fff',
                marginTop: '0.25rem',
                textTransform: 'capitalize'
              }}>
                {existingGoal.goal_type}
              </div>
            </div>
            
            <div>
              <span style={{
                fontSize: '0.75rem',
                color: 'rgba(255, 255, 255, 0.5)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Target
              </span>
              <div style={{
                fontSize: '1.1rem',
                fontWeight: '700',
                color: '#10b981',
                marginTop: '0.25rem'
              }}>
                {existingGoal.target_value > 0 ? '+' : ''}{existingGoal.target_value} {existingGoal.measurement_unit}
              </div>
            </div>
            
            {existingGoal.deadline && (
              <div>
                <span style={{
                  fontSize: '0.75rem',
                  color: 'rgba(255, 255, 255, 0.5)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Deadline
                </span>
                <div style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: '#fff',
                  marginTop: '0.25rem'
                }}>
                  {new Date(existingGoal.deadline).toLocaleDateString('nl-NL')}
                </div>
              </div>
            )}
            
            <div>
              <span style={{
                fontSize: '0.75rem',
                color: 'rgba(255, 255, 255, 0.5)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Auto-track
              </span>
              <div style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: existingGoal.auto_track ? '#10b981' : 'rgba(255, 255, 255, 0.5)',
                marginTop: '0.25rem'
              }}>
                {existingGoal.auto_track ? '✅ Ja' : '❌ Nee'}
              </div>
            </div>
          </div>
          
          {existingGoal.motivation && (
            <div style={{
              background: 'rgba(16, 185, 129, 0.1)',
              borderLeft: '3px solid #10b981',
              borderRadius: '8px',
              padding: isMobile ? '0.75rem' : '1rem',
              marginTop: '0.75rem'
            }}>
              <div style={{
                fontSize: '0.75rem',
                color: 'rgba(16, 185, 129, 0.8)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '0.5rem'
              }}>
                Motivatie
              </div>
              <p style={{
                fontSize: '0.9rem',
                color: 'rgba(255, 255, 255, 0.9)',
                margin: 0,
                lineHeight: 1.5,
                fontStyle: 'italic'
              }}>
                "{existingGoal.motivation}"
              </p>
            </div>
          )}
        </div>
      )}
      
      {/* Edit/Create Mode */}
      {(editing || !existingGoal) && (
        <div style={{
          background: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(10px)',
          borderRadius: '12px',
          padding: isMobile ? '1rem' : '1.25rem',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          {/* Goal Name */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.85rem',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.8)',
              marginBottom: '0.5rem'
            }}>
              Goal Naam *
            </label>
            <input
              type="text"
              value={formData.goal_name}
              onChange={(e) => setFormData({ ...formData, goal_name: e.target.value })}
              placeholder="bijv. 10kg afvallen"
              style={{
                width: '100%',
                padding: isMobile ? '0.75rem' : '0.875rem',
                background: 'rgba(0, 0, 0, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '10px',
                color: '#fff',
                fontSize: isMobile ? '0.9rem' : '1rem',
                outline: 'none'
              }}
            />
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
            gap: '1rem',
            marginBottom: '1rem'
          }}>
            {/* Goal Type */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: '600',
                color: 'rgba(255, 255, 255, 0.8)',
                marginBottom: '0.5rem'
              }}>
                Type *
              </label>
              <select
                value={formData.goal_type}
                onChange={(e) => setFormData({ ...formData, goal_type: e.target.value })}
                style={{
                  width: '100%',
                  padding: isMobile ? '0.75rem' : '0.875rem',
                  background: 'rgba(0, 0, 0, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: isMobile ? '0.9rem' : '1rem',
                  outline: 'none'
                }}
              >
                <option value="weight">Weight (kg)</option>
                <option value="waist">Waist (cm)</option>
                <option value="body_fat">Body Fat (%)</option>
              </select>
            </div>
            
            {/* Target Value */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: '600',
                color: 'rgba(255, 255, 255, 0.8)',
                marginBottom: '0.5rem'
              }}>
                Target Value *
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.target_value}
                onChange={(e) => setFormData({ ...formData, target_value: e.target.value })}
                placeholder="-10"
                style={{
                  width: '100%',
                  padding: isMobile ? '0.75rem' : '0.875rem',
                  background: 'rgba(0, 0, 0, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: isMobile ? '0.9rem' : '1rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>
          
          {/* Deadline */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.85rem',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.8)',
              marginBottom: '0.5rem'
            }}>
              <Calendar size={16} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
              Deadline
            </label>
            <input
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              style={{
                width: '100%',
                padding: isMobile ? '0.75rem' : '0.875rem',
                background: 'rgba(0, 0, 0, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '10px',
                color: '#fff',
                fontSize: isMobile ? '0.9rem' : '1rem',
                outline: 'none'
              }}
            />
          </div>
          
          {/* Motivation */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.85rem',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.8)',
              marginBottom: '0.5rem'
            }}>
              <MessageSquare size={16} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
              Motivatie Bericht
            </label>
            <textarea
              value={formData.motivation}
              onChange={(e) => setFormData({ ...formData, motivation: e.target.value })}
              placeholder="Motiverende tekst die de client ziet..."
              rows={3}
              style={{
                width: '100%',
                padding: isMobile ? '0.75rem' : '0.875rem',
                background: 'rgba(0, 0, 0, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '10px',
                color: '#fff',
                fontSize: isMobile ? '0.9rem' : '1rem',
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
            />
          </div>
          
          {/* Auto-track */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={formData.auto_track}
                onChange={(e) => setFormData({ ...formData, auto_track: e.target.checked })}
                style={{
                  width: '18px',
                  height: '18px',
                  cursor: 'pointer'
                }}
              />
              <span style={{
                fontSize: '0.85rem',
                color: 'rgba(255, 255, 255, 0.8)'
              }}>
                Auto-sync met weight challenge logs
              </span>
            </label>
          </div>
          
          {/* Buttons */}
          <div style={{
            display: 'flex',
            gap: '0.75rem',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => {
                  setEditing(false)
                  if (existingGoal) {
                    setFormData({
                      goal_name: existingGoal.goal_name,
                      goal_type: existingGoal.goal_type,
                      target_value: existingGoal.target_value.toString(),
                      deadline: existingGoal.deadline || '',
                      motivation: existingGoal.motivation || '',
                      auto_track: existingGoal.auto_track !== false
                    })
                  }
                }}
                disabled={saving}
                style={{
                  padding: isMobile ? '0.6rem 1.25rem' : '0.7rem 1.5rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: isMobile ? '0.85rem' : '0.9rem',
                  fontWeight: '600',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.5 : 1,
                  minHeight: '44px'
                }}
              >
                Annuleer
              </button>
              
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  padding: isMobile ? '0.6rem 1.25rem' : '0.7rem 1.5rem',
                  background: saving 
                    ? 'rgba(16, 185, 129, 0.5)' 
                    : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: 'none',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: isMobile ? '0.85rem' : '0.9rem',
                  fontWeight: '600',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  minHeight: '44px'
                }}
              >
                <Save size={18} />
                {saving ? 'Opslaan...' : 'Opslaan'}
              </button>
            </div>
            
            {existingGoal && (
              <button
                onClick={handleDelete}
                disabled={saving}
                style={{
                  padding: isMobile ? '0.6rem 1.25rem' : '0.7rem 1.5rem',
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  border: 'none',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: isMobile ? '0.85rem' : '0.9rem',
                  fontWeight: '600',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  minHeight: '44px'
                }}
              >
                <Trash2 size={18} />
                Verwijder
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
