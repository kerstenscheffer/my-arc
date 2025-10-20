// src/client/components/floating-modals/GoalProgressModal.jsx
import { useState, useEffect } from 'react'
import { X, Target, Save, CheckCircle, TrendingDown } from 'lucide-react'

export default function GoalProgressModal({ db, client, onClose, onRefresh }) {
  const isMobile = window.innerWidth <= 768
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [goalData, setGoalData] = useState(null)
  const [inputValue, setInputValue] = useState('')
  const [success, setSuccess] = useState(false)
  
  useEffect(() => {
    loadGoalData()
  }, [client?.id])
  
  async function loadGoalData() {
    try {
      // Get active challenge
      const { data: challenge } = await db.supabase
        .from('challenge_assignments')
        .select('*')
        .eq('client_id', client.id)
        .eq('is_active', true)
        .single()
      
      if (!challenge) {
        setLoading(false)
        return
      }
      
      // Get primary goal
      const { data: goal } = await db.supabase
        .from('challenge_assignment_goals')
        .select('*')
        .eq('assignment_id', challenge.id)
        .eq('is_primary', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      
      if (goal) {
        // Load LAATSTE waarde (niet alleen vandaag!)
        let latestValue = null
        let latestDate = null
        
        if (goal.goal_type === 'weight') {
          const { data } = await db.supabase
            .from('weight_challenge_logs')
            .select('weight, date')
            .eq('client_id', client.id)
            .order('date', { ascending: false })
            .limit(1)
            .maybeSingle()
          latestValue = data?.weight
          latestDate = data?.date
        } else if (goal.goal_type === 'waist') {
          const { data } = await db.supabase
            .from('waist_challenge_logs')
            .select('waist_cm, date')
            .eq('client_id', client.id)
            .order('date', { ascending: false })
            .limit(1)
            .maybeSingle()
          latestValue = data?.waist_cm
          latestDate = data?.date
        } else if (goal.goal_type === 'body_fat') {
          const { data } = await db.supabase
            .from('body_fat_challenge_logs')
            .select('body_fat_percentage, date')
            .eq('client_id', client.id)
            .order('date', { ascending: false })
            .limit(1)
            .maybeSingle()
          latestValue = data?.body_fat_percentage
          latestDate = data?.date
        }
        
        // Update goal met laatste waarde
        if (latestValue !== null) {
          goal.current_value = latestValue
          goal.last_updated = latestDate
        }
        
        setGoalData(goal)
        
        // Pre-fill vandaag's log als die bestaat
        const today = new Date().toISOString().split('T')[0]
        let todayValue = null
        
        if (goal.goal_type === 'weight') {
          const { data } = await db.supabase
            .from('weight_challenge_logs')
            .select('weight')
            .eq('client_id', client.id)
            .eq('date', today)
            .maybeSingle()
          todayValue = data?.weight
        } else if (goal.goal_type === 'waist') {
          const { data } = await db.supabase
            .from('waist_challenge_logs')
            .select('waist_cm')
            .eq('client_id', client.id)
            .eq('date', today)
            .maybeSingle()
          todayValue = data?.waist_cm
        } else if (goal.goal_type === 'body_fat') {
          const { data } = await db.supabase
            .from('body_fat_challenge_logs')
            .select('body_fat_percentage')
            .eq('client_id', client.id)
            .eq('date', today)
            .maybeSingle()
          todayValue = data?.body_fat_percentage
        }
        
        if (todayValue) {
          setInputValue(todayValue.toString())
        }
      }
      
    } catch (error) {
      console.error('Error loading goal data:', error)
    } finally {
      setLoading(false)
    }
  }
  
  async function handleSave() {
    if (!inputValue || !goalData) return
    
    const value = parseFloat(inputValue)
    if (isNaN(value)) {
      alert('Voer een geldig getal in')
      return
    }
    
    setSaving(true)
    
    try {
      const today = new Date().toISOString().split('T')[0]
      
      // Save to correct table based on goal type
      if (goalData.goal_type === 'weight') {
        await db.supabase
          .from('weight_challenge_logs')
          .upsert({
            client_id: client.id,
            weight: value,
            date: today
          }, {
            onConflict: 'client_id,date'
          })
      } else if (goalData.goal_type === 'waist') {
        await db.supabase
          .from('waist_challenge_logs')
          .upsert({
            client_id: client.id,
            waist_cm: value,
            date: today
          }, {
            onConflict: 'client_id,date'
          })
      } else if (goalData.goal_type === 'body_fat') {
        await db.supabase
          .from('body_fat_challenge_logs')
          .upsert({
            client_id: client.id,
            body_fat_percentage: value,
            date: today
          }, {
            onConflict: 'client_id,date'
          })
      }
      
      // Update current_value in challenge_assignment_goals
      if (goalData.auto_track) {
        await db.supabase
          .from('challenge_assignment_goals')
          .update({ 
            current_value: value,
            updated_at: new Date().toISOString()
          })
          .eq('id', goalData.id)
      }
      
      setSuccess(true)
      onRefresh()
      
      setTimeout(() => {
        onClose()
      }, 1500)
      
    } catch (error) {
      console.error('Error saving goal progress:', error)
      alert('Fout bij opslaan: ' + error.message)
    } finally {
      setSaving(false)
    }
  }
  
  const getUnitLabel = () => {
    if (!goalData) return ''
    switch (goalData.goal_type) {
      case 'weight': return 'kg'
      case 'waist': return 'cm'
      case 'body_fat': return '%'
      default: return ''
    }
  }
  
  const getGoalLabel = () => {
    if (!goalData) return 'Goal Progress'
    switch (goalData.goal_type) {
      case 'weight': return 'Gewicht'
      case 'waist': return 'Buikomtrek'
      case 'body_fat': return 'Vetpercentage'
      default: return 'Goal'
    }
  }
  
  if (loading) {
    return (
      <div style={{
        position: 'fixed',
        right: 0,
        top: '50%',
        transform: 'translateY(-50%)',
        width: isMobile ? '85vw' : '320px',
        maxWidth: '320px',
        background: 'rgba(17, 17, 17, 0.95)',
        backdropFilter: 'blur(16px)',
        borderRadius: '16px 0 0 16px',
        padding: '2rem',
        zIndex: 999,
        textAlign: 'center',
        color: 'rgba(255, 255, 255, 0.6)'
      }}>
        Loading...
      </div>
    )
  }
  
  if (!goalData) {
    return (
      <div style={{
        position: 'fixed',
        right: 0,
        top: '50%',
        transform: 'translateY(-50%)',
        width: isMobile ? '85vw' : '320px',
        maxWidth: '320px',
        background: 'rgba(17, 17, 17, 0.95)',
        backdropFilter: 'blur(16px)',
        borderRadius: '16px 0 0 16px',
        padding: '2rem',
        zIndex: 999
      }}>
        <div style={{
          textAlign: 'center',
          color: 'rgba(255, 255, 255, 0.7)'
        }}>
          <Target size={32} color="rgba(255, 255, 255, 0.4)" style={{ marginBottom: '1rem' }} />
          <p style={{ margin: 0, fontSize: '0.9rem' }}>
            Geen actief challenge goal gevonden
          </p>
          <button
            onClick={onClose}
            style={{
              marginTop: '1rem',
              padding: '0.75rem 1.5rem',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '10px',
              color: '#fff',
              cursor: 'pointer'
            }}
          >
            Sluiten
          </button>
        </div>
      </div>
    )
  }
  
  return (
    <div style={{
      position: 'fixed',
      right: 0,
      top: '50%',
      transform: 'translateY(-50%)',
      width: isMobile ? '85vw' : '320px',
      maxWidth: '320px',
      maxHeight: '80vh',
      background: 'rgba(17, 17, 17, 0.95)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderLeft: '0.5px solid rgba(255, 255, 255, 0.08)',
      borderRadius: '16px 0 0 16px',
      boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.3)',
      zIndex: 999,
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: isMobile ? '1.25rem' : '1.5rem',
        borderBottom: '0.5px solid rgba(255, 255, 255, 0.05)',
        background: 'rgba(0, 0, 0, 0.2)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h3 style={{
            margin: 0,
            fontSize: isMobile ? '1rem' : '1.1rem',
            fontWeight: '700',
            color: 'rgba(255, 255, 255, 0.9)',
            marginBottom: '0.25rem'
          }}>
            Goal Progress
          </h3>
          <p style={{
            margin: 0,
            fontSize: isMobile ? '0.7rem' : '0.75rem',
            color: 'rgba(255, 255, 255, 0.4)'
          }}>
            Log je {getGoalLabel().toLowerCase()}
          </p>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: '0.5px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '8px',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <X size={16} color="rgba(255, 255, 255, 0.4)" />
        </button>
      </div>
      
      {/* Content */}
      <div style={{
        padding: isMobile ? '1.25rem' : '1.5rem',
        overflowY: 'auto',
        maxHeight: 'calc(80vh - 100px)'
      }}>
        {success ? (
          <div style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.08) 100%)',
            borderRadius: '12px',
            padding: '1.5rem',
            textAlign: 'center',
            border: '0.5px solid rgba(16, 185, 129, 0.2)'
          }}>
            <CheckCircle size={36} color="#10b981" style={{ marginBottom: '0.75rem' }} />
            <div style={{ 
              fontSize: '1rem', 
              color: 'rgba(255, 255, 255, 0.9)', 
              fontWeight: '600'
            }}>
              Progress Opgeslagen!
            </div>
          </div>
        ) : (
          <>
            {/* Goal Info Card */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.1) 0%, rgba(220, 38, 38, 0.05) 100%)',
              borderRadius: '12px',
              padding: '1.25rem',
              marginBottom: '1.25rem',
              border: '0.5px solid rgba(220, 38, 38, 0.2)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '0.75rem'
              }}>
                <Target size={20} color="#dc2626" />
                <div style={{
                  fontSize: '1rem',
                  fontWeight: '700',
                  color: '#fff'
                }}>
                  {goalData.goal_name}
                </div>
              </div>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '0.75rem',
                fontSize: '0.75rem'
              }}>
                <div>
                  <div style={{
                    color: 'rgba(255, 255, 255, 0.5)',
                    marginBottom: '0.25rem'
                  }}>
                    Start
                  </div>
                  <div style={{
                    color: '#fff',
                    fontWeight: '600'
                  }}>
                    {goalData.starting_value}{getUnitLabel()}
                  </div>
                </div>
                
                <div>
                  <div style={{
                    color: 'rgba(255, 255, 255, 0.5)',
                    marginBottom: '0.25rem'
                  }}>
                    Nu
                  </div>
                  <div style={{
                    color: '#10b981',
                    fontWeight: '700'
                  }}>
                    {goalData.current_value}{getUnitLabel()}
                  </div>
                  {goalData.last_updated && (
                    <div style={{
                      color: 'rgba(255, 255, 255, 0.4)',
                      fontSize: '0.65rem',
                      marginTop: '0.15rem'
                    }}>
                      {new Date(goalData.last_updated).toLocaleDateString('nl-NL')}
                    </div>
                  )}
                </div>
                
                <div>
                  <div style={{
                    color: 'rgba(255, 255, 255, 0.5)',
                    marginBottom: '0.25rem'
                  }}>
                    Doel
                  </div>
                  <div style={{
                    color: '#fff',
                    fontWeight: '600'
                  }}>
                    {goalData.target_value > 0 ? '+' : ''}{goalData.target_value}{getUnitLabel()}
                  </div>
                </div>
              </div>
              
              {/* "Nog X te gaan" indicator */}
              {goalData.current_value && goalData.target_value && (
                <div style={{
                  marginTop: '0.875rem',
                  paddingTop: '0.875rem',
                  borderTop: '0.5px solid rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}>
                  <TrendingDown size={16} color="#10b981" />
                  <span style={{
                    color: '#10b981',
                    fontWeight: '700',
                    fontSize: '0.85rem'
                  }}>
                    Nog {Math.abs(goalData.current_value - goalData.target_value).toFixed(1)}{getUnitLabel()} te gaan
                  </span>
                </div>
              )}
            </div>
            
            {/* Input Field */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: '600',
                color: 'rgba(255, 255, 255, 0.8)',
                marginBottom: '0.5rem'
              }}>
                Vandaag's {getGoalLabel()}
              </label>
              <div style={{
                position: 'relative'
              }}>
                <input
                  type="number"
                  step="0.1"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={`Bijv. ${goalData.current_value}`}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    paddingRight: '3rem',
                    background: 'rgba(0, 0, 0, 0.5)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    outline: 'none'
                  }}
                />
                <div style={{
                  position: 'absolute',
                  right: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'rgba(255, 255, 255, 0.4)',
                  fontSize: '0.9rem',
                  fontWeight: '600'
                }}>
                  {getUnitLabel()}
                </div>
              </div>
            </div>
            
            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={!inputValue || saving}
              style={{
                width: '100%',
                background: saving || !inputValue
                  ? 'rgba(220, 38, 38, 0.3)'
                  : 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                border: 'none',
                borderRadius: '10px',
                padding: '1rem',
                color: '#fff',
                fontSize: '0.95rem',
                fontWeight: '600',
                cursor: saving || !inputValue ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                opacity: !inputValue ? 0.5 : 1
              }}
            >
              <Save size={18} />
              {saving ? 'Opslaan...' : 'Opslaan'}
            </button>
            
            {goalData.motivation && (
              <div style={{
                marginTop: '1.25rem',
                background: 'rgba(16, 185, 129, 0.1)',
                borderLeft: '3px solid #10b981',
                borderRadius: '8px',
                padding: '0.875rem',
                fontSize: '0.85rem',
                color: 'rgba(255, 255, 255, 0.8)',
                fontStyle: 'italic'
              }}>
                💪 {goalData.motivation}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
