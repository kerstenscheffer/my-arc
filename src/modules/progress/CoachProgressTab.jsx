// src/modules/progress/CoachProgressTab.jsx
// MY ARC Coach Progress Tab - For integration in CoachHub.jsx
// Features: Client overview, Progress tracking, Feedback system

import { useState, useEffect, useCallback, useMemo } from 'react'
import ProgressService from './ProgressService'
import DatabaseService from '../../services/DatabaseService'

// Progress Overview Card
const ClientProgressCard = ({ client, onSelectClient }) => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [client])

  const loadStats = async () => {
    try {
      const progressStats = await ProgressService.getProgressStats(client.id)
      setStats(progressStats)
      setLoading(false)
    } catch (error) {
      console.error('Error loading client stats:', error)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{
        background: 'rgba(26, 26, 26, 0.6)',
        borderRadius: '8px',
        padding: '1rem',
        border: '1px solid #10b98133'
      }}>
        <div style={{ color: '#9ca3af' }}>Loading...</div>
      </div>
    )
  }

  return (
    <div
      onClick={() => onSelectClient(client)}
      style={{
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(16, 185, 129, 0.02) 100%)',
        borderRadius: '8px',
        padding: '1rem',
        border: '1px solid #10b98133',
        cursor: 'pointer',
        transition: 'all 0.2s'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.borderColor = '#10b981'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.borderColor = '#10b98133'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.75rem' }}>
        <div>
          <h4 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '0.25rem' }}>
            {client.first_name} {client.last_name}
          </h4>
          <p style={{ color: '#9ca3af', fontSize: '0.75rem' }}>
            {client.email}
          </p>
        </div>
        {stats?.lastWorkout && (
          <span style={{
            background: '#10b981',
            color: '#000',
            padding: '0.25rem 0.5rem',
            borderRadius: '4px',
            fontSize: '0.7rem',
            fontWeight: 'bold'
          }}>
            Active
          </span>
        )}
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
        <div style={{
          background: 'rgba(0,0,0,0.3)',
          borderRadius: '4px',
          padding: '0.5rem',
          textAlign: 'center'
        }}>
          <div style={{ color: '#10b981', fontSize: '1.2rem', fontWeight: 'bold' }}>
            {stats?.totalWorkouts || 0}
          </div>
          <div style={{ color: '#9ca3af', fontSize: '0.65rem' }}>
            Workouts
          </div>
        </div>
        
        <div style={{
          background: 'rgba(0,0,0,0.3)',
          borderRadius: '4px',
          padding: '0.5rem',
          textAlign: 'center'
        }}>
          <div style={{ color: '#f59e0b', fontSize: '1.2rem', fontWeight: 'bold' }}>
            {stats?.currentWeight || '?'}kg
          </div>
          <div style={{ color: '#9ca3af', fontSize: '0.65rem' }}>
            Weight
          </div>
        </div>
        
        <div style={{
          background: 'rgba(0,0,0,0.3)',
          borderRadius: '4px',
          padding: '0.5rem',
          textAlign: 'center'
        }}>
          <div style={{ color: '#3b82f6', fontSize: '1.2rem', fontWeight: 'bold' }}>
            {stats?.weeklyTarget || 4}
          </div>
          <div style={{ color: '#9ca3af', fontSize: '0.65rem' }}>
            Weekly Goal
          </div>
        </div>
      </div>
      
      {stats?.lastWorkout && (
        <div style={{
          marginTop: '0.75rem',
          paddingTop: '0.75rem',
          borderTop: '1px solid rgba(16, 185, 129, 0.1)'
        }}>
          <p style={{ color: '#9ca3af', fontSize: '0.75rem' }}>
            Last workout: {new Date(stats.lastWorkout).toLocaleDateString()}
          </p>
        </div>
      )}
    </div>
  )
}

// Detailed Progress View
const ClientDetailedProgress = ({ client, onBack }) => {
  const [workoutHistory, setWorkoutHistory] = useState([])
  const [weightHistory, setWeightHistory] = useState([])
  const [selectedWorkout, setSelectedWorkout] = useState(null)
  const [feedbackInput, setFeedbackInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('workouts')

  useEffect(() => {
    loadClientData()
  }, [client])

  const loadClientData = async () => {
    try {
      setLoading(true)
      
      // Get last 30 days of data
      const endDate = new Date().toISOString().split('T')[0]
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      
      const [completions, weights] = await Promise.all([
        ProgressService.getWorkoutCompletions(client.id, { from: startDate, to: endDate }),
        ProgressService.getWeightHistory(client.id, 30)
      ])
      
      // Get detailed workout data for each completion
      const detailedWorkouts = await Promise.all(
        completions.map(async (completion) => {
          const dayProgress = await ProgressService.getClientProgressByDate(client.id, completion.workout_date)
          return {
            date: completion.workout_date,
            exercises: dayProgress
          }
        })
      )
      
      setWorkoutHistory(detailedWorkouts)
      setWeightHistory(weights)
      setLoading(false)
    } catch (error) {
      console.error('Error loading client data:', error)
      setLoading(false)
    }
  }

  const addFeedback = async (progressId) => {
    if (!feedbackInput.trim()) return
    
    try {
      await ProgressService.addCoachFeedback(progressId, feedbackInput)
      setFeedbackInput('')
      setSelectedWorkout(null)
      alert('✅ Feedback toegevoegd!')
      loadClientData()
    } catch (error) {
      console.error('Error adding feedback:', error)
      alert('❌ Fout bij toevoegen feedback')
    }
  }

  const getWeightProgress = () => {
    if (weightHistory.length < 2) return null
    
    const current = weightHistory[0].weight
    const previous = weightHistory[weightHistory.length - 1].weight
    const change = current - previous
    
    return {
      current,
      change: change.toFixed(1),
      trend: change < 0 ? 'down' : change > 0 ? 'up' : 'stable'
    }
  }

  const weightProgress = getWeightProgress()

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
        <p style={{ color: '#9ca3af' }}>Loading client progress...</p>
      </div>
    )
  }

  return (
    <div>
      {/* Header with Back Button */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <button
          onClick={onBack}
          style={{
            background: '#064e3b',
            border: 'none',
            borderRadius: '6px',
            color: '#10b981',
            padding: '0.5rem 1rem',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          ← Back
        </button>
        <div>
          <h2 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '0.25rem' }}>
            {client.first_name} {client.last_name}'s Progress
          </h2>
          <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
            {client.email}
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
          borderRadius: '8px',
          padding: '1rem',
          border: '1px solid #10b98133'
        }}>
          <div style={{ color: '#10b981', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
            Total Workouts
          </div>
          <div style={{ color: '#fff', fontSize: '2rem', fontWeight: 'bold' }}>
            {workoutHistory.length}
          </div>
          <div style={{ color: '#9ca3af', fontSize: '0.75rem' }}>
            Last 30 days
          </div>
        </div>

        {weightProgress && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)',
            borderRadius: '8px',
            padding: '1rem',
            border: '1px solid #f59e0b33'
          }}>
            <div style={{ color: '#f59e0b', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              Current Weight
            </div>
            <div style={{ color: '#fff', fontSize: '2rem', fontWeight: 'bold' }}>
              {weightProgress.current}kg
            </div>
            <div style={{ 
              color: weightProgress.trend === 'down' ? '#10b981' : weightProgress.trend === 'up' ? '#ef4444' : '#9ca3af',
              fontSize: '0.75rem' 
            }}>
              {weightProgress.trend === 'down' ? '↓' : weightProgress.trend === 'up' ? '↑' : '→'} {Math.abs(weightProgress.change)}kg
            </div>
          </div>
        )}

        <div style={{
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)',
          borderRadius: '8px',
          padding: '1rem',
          border: '1px solid #3b82f633'
        }}>
          <div style={{ color: '#3b82f6', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
            Avg Rating
          </div>
          <div style={{ color: '#fff', fontSize: '2rem', fontWeight: 'bold' }}>
            {(() => {
              const ratings = workoutHistory.flatMap(w => 
                w.exercises.map(e => e.rating).filter(r => r)
              )
              return ratings.length > 0 
                ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
                : 'N/A'
            })()}
          </div>
          <div style={{ color: '#9ca3af', fontSize: '0.75rem' }}>
            Workout difficulty
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '1.5rem',
        borderBottom: '1px solid #333',
        paddingBottom: '0'
      }}>
        <button
          onClick={() => setActiveTab('workouts')}
          style={{
            background: 'transparent',
            border: 'none',
            color: activeTab === 'workouts' ? '#10b981' : '#9ca3af',
            padding: '0.75rem 1.5rem',
            cursor: 'pointer',
            fontWeight: 'bold',
            borderBottom: activeTab === 'workouts' ? '2px solid #10b981' : '2px solid transparent',
            marginBottom: '-2px'
          }}
        >
          Workout History
        </button>
        <button
          onClick={() => setActiveTab('weight')}
          style={{
            background: 'transparent',
            border: 'none',
            color: activeTab === 'weight' ? '#10b981' : '#9ca3af',
            padding: '0.75rem 1.5rem',
            cursor: 'pointer',
            fontWeight: 'bold',
            borderBottom: activeTab === 'weight' ? '2px solid #10b981' : '2px solid transparent',
            marginBottom: '-2px'
          }}
        >
          Weight Progress
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'workouts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {workoutHistory.map((workout, index) => (
            <div key={index} style={{
              background: 'rgba(26, 26, 26, 0.6)',
              borderRadius: '8px',
              padding: '1rem',
              border: '1px solid #10b98133'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.75rem'
              }}>
                <h4 style={{ color: '#fff', fontSize: '1rem' }}>
                  {new Date(workout.date).toLocaleDateString('nl-NL', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </h4>
                <span style={{
                  background: '#10b981',
                  color: '#000',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: 'bold'
                }}>
                  {workout.exercises.length} exercises
                </span>
              </div>
              
              {workout.exercises.map((exercise, exIndex) => (
                <div key={exIndex} style={{
                  background: 'rgba(0,0,0,0.3)',
                  borderRadius: '6px',
                  padding: '0.75rem',
                  marginBottom: '0.5rem'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'start'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: '#10b981', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                        {exercise.exercise_name}
                      </div>
                      <div style={{ color: '#9ca3af', fontSize: '0.85rem' }}>
                        {ProgressService.formatSets(exercise.sets)}
                        {exercise.rating && ` • Rating: ${exercise.rating}/10`}
                      </div>
                      {exercise.notes && (
                        <div style={{ color: '#fff', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                          Note: {exercise.notes}
                        </div>
                      )}
                      {exercise.coach_suggestion && (
                        <div style={{
                          marginTop: '0.5rem',
                          padding: '0.5rem',
                          background: 'rgba(59, 130, 246, 0.1)',
                          borderRadius: '4px',
                          border: '1px solid #3b82f633'
                        }}>
                          <div style={{ color: '#3b82f6', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                            Coach Feedback
                          </div>
                          <div style={{ color: '#fff', fontSize: '0.8rem' }}>
                            {exercise.coach_suggestion}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {!exercise.coach_suggestion && (
                      <button
                        onClick={() => setSelectedWorkout(exercise.id)}
                        style={{
                          background: '#064e3b',
                          border: 'none',
                          borderRadius: '4px',
                          color: '#10b981',
                          padding: '0.25rem 0.5rem',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          marginLeft: '1rem'
                        }}
                      >
                        + Feedback
                      </button>
                    )}
                  </div>
                  
                  {selectedWorkout === exercise.id && (
                    <div style={{
                      marginTop: '0.75rem',
                      padding: '0.75rem',
                      background: 'rgba(16, 185, 129, 0.05)',
                      borderRadius: '4px',
                      border: '1px solid #10b98133'
                    }}>
                      <textarea
                        value={feedbackInput}
                        onChange={(e) => setFeedbackInput(e.target.value)}
                        placeholder="Type your feedback here..."
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          background: '#0a0a0a',
                          border: '1px solid #333',
                          borderRadius: '4px',
                          color: '#fff',
                          fontSize: '0.875rem',
                          resize: 'vertical',
                          minHeight: '60px'
                        }}
                      />
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <button
                          onClick={() => addFeedback(exercise.id)}
                          style={{
                            flex: 1,
                            padding: '0.5rem',
                            background: '#10b981',
                            border: 'none',
                            borderRadius: '4px',
                            color: '#000',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                          }}
                        >
                          Send Feedback
                        </button>
                        <button
                          onClick={() => {
                            setSelectedWorkout(null)
                            setFeedbackInput('')
                          }}
                          style={{
                            padding: '0.5rem 1rem',
                            background: '#333',
                            border: 'none',
                            borderRadius: '4px',
                            color: '#fff',
                            cursor: 'pointer'
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
          
          {workoutHistory.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '3rem',
              background: 'rgba(26, 26, 26, 0.6)',
              borderRadius: '8px',
              border: '1px solid #10b98133'
            }}>
              <p style={{ color: '#9ca3af' }}>
                No workouts logged yet
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'weight' && (
        <div>
          <div style={{
            background: 'rgba(26, 26, 26, 0.6)',
            borderRadius: '8px',
            padding: '1rem',
            border: '1px solid #10b98133'
          }}>
            <h4 style={{ color: '#fff', fontSize: '1rem', marginBottom: '1rem' }}>
              Weight History (Last 30 days)
            </h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {weightHistory.map((entry, index) => (
                <div key={index} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem',
                  background: 'rgba(0,0,0,0.3)',
                  borderRadius: '4px'
                }}>
                  <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
                    {new Date(entry.date).toLocaleDateString()}
                  </span>
                  <span style={{ color: '#fff', fontWeight: 'bold' }}>
                    {entry.weight}kg
                  </span>
                  {index > 0 && (
                    <span style={{
                      color: entry.weight < weightHistory[index - 1].weight ? '#10b981' : 
                             entry.weight > weightHistory[index - 1].weight ? '#ef4444' : '#9ca3af',
                      fontSize: '0.75rem'
                    }}>
                      {entry.weight < weightHistory[index - 1].weight ? '↓' : 
                       entry.weight > weightHistory[index - 1].weight ? '↑' : '→'}
                      {Math.abs(entry.weight - weightHistory[index - 1].weight).toFixed(1)}kg
                    </span>
                  )}
                </div>
              ))}
            </div>
            
            {weightHistory.length === 0 && (
              <p style={{ color: '#9ca3af', textAlign: 'center', padding: '2rem' }}>
                No weight entries yet
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Main Component
export default function CoachProgressTab({ selectedClient: initialClient }) {
  const [clients, setClients] = useState([])
  const [selectedClient, setSelectedClient] = useState(initialClient || null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('recent') // recent, name, progress

  useEffect(() => {
    loadClients()
  }, [])

  const loadClients = async () => {
    try {
      setLoading(true)
      const user = await DatabaseService.getCurrentUser()
      const clientList = await DatabaseService.getClients(user.id)
      setClients(clientList)
      setLoading(false)
    } catch (error) {
      console.error('Error loading clients:', error)
      setLoading(false)
    }
  }

  const filteredClients = useMemo(() => {
    let filtered = clients
    
    if (searchTerm) {
      filtered = filtered.filter(client => 
        `${client.first_name} ${client.last_name} ${client.email}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      )
    }
    
    // Sort clients
    if (sortBy === 'name') {
      filtered.sort((a, b) => 
        `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`)
      )
    } else if (sortBy === 'recent') {
      filtered.sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      )
    }
    
    return filtered
  }, [clients, searchTerm, sortBy])

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
        <p style={{ color: '#9ca3af' }}>Loading progress data...</p>
      </div>
    )
  }

  if (selectedClient) {
    return (
      <ClientDetailedProgress 
        client={selectedClient} 
        onBack={() => setSelectedClient(null)}
      />
    )
  }

  return (
    <div>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #064e3b 0%, #0a5c42 100%)',
        borderRadius: '8px',
        padding: '1.5rem',
        marginBottom: '2rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '0.5rem' }}>
          📈 Client Progress Management
        </h2>
        <p style={{ color: '#d1fae5' }}>
          Track progress, provide feedback, monitor goals
        </p>
      </div>

      {/* Search and Filters */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        marginBottom: '2rem',
        flexWrap: 'wrap'
      }}>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search clients..."
          style={{
            flex: 1,
            minWidth: '200px',
            padding: '0.75rem',
            background: 'rgba(26, 26, 26, 0.6)',
            border: '1px solid #10b98133',
            borderRadius: '6px',
            color: '#fff',
            fontSize: '0.875rem'
          }}
        />
        
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={{
            padding: '0.75rem',
            background: 'rgba(26, 26, 26, 0.6)',
            border: '1px solid #10b98133',
            borderRadius: '6px',
            color: '#fff',
            fontSize: '0.875rem'
          }}
        >
          <option value="recent">Most Recent</option>
          <option value="name">By Name</option>
          <option value="progress">Most Active</option>
        </select>
      </div>

      {/* Client Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '1rem'
      }}>
        {filteredClients.map(client => (
          <ClientProgressCard
            key={client.id}
            client={client}
            onSelectClient={setSelectedClient}
          />
        ))}
      </div>

      {filteredClients.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          background: 'rgba(26, 26, 26, 0.6)',
          borderRadius: '8px',
          border: '1px solid #10b98133'
        }}>
          <p style={{ color: '#9ca3af', fontSize: '1.1rem' }}>
            {searchTerm ? 'No clients found matching your search' : 'No clients yet'}
          </p>
        </div>
      )}
    </div>
  )
}

// Integration instructions for CoachHub.jsx:
/*
In CoachHub.jsx, add this import at the top:
import CoachProgressTab from '../../modules/progress/CoachProgressTab'

Then in the tabs section, add:
{activeDetailTab === 'progress' && (
  <CoachProgressTab selectedClient={selectedClient} />
)}

And add the tab button:
<button 
  onClick={() => setActiveDetailTab('progress')}
  className={activeDetailTab === 'progress' ? 'active' : ''}
>
  📈 Progress
</button>
*/
