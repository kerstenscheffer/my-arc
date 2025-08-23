// src/coach/pages/CoachProgressDashboard.jsx  
// MY ARC Coach Progress Dashboard - Complete Client Progress Monitoring
import { useState, useEffect } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import { getTrainerClients } from '../../lib/supabase'
import { 
  getCoachClientProgress,
  getProgressStats,
  updateCoachSuggestion,
  getExerciseProgress,
  calculateMaxWeight,
  formatSets,
  getSuggestionText,
  getTodayDate,
  getWeekDates
} from '../../lib/progressDatabase'

export default function CoachProgressDashboard({ user }) {
  const { t, language } = useLanguage()
  const isMobile = window.innerWidth <= 768
  
  // State management
  const [clients, setClients] = useState([])
  const [selectedClient, setSelectedClient] = useState(null)
  const [clientProgress, setClientProgress] = useState([])
  const [progressStats, setProgressStats] = useState({})
  const [selectedExercise, setSelectedExercise] = useState('')
  const [exerciseHistory, setExerciseHistory] = useState([])
  const [showSuggestionModal, setShowSuggestionModal] = useState(false)
  const [selectedProgressEntry, setSelectedProgressEntry] = useState(null)
  const [suggestionForm, setSuggestionForm] = useState({
    type: 'maintain_weight',
    customText: ''
  })
  const [timeFilter, setTimeFilter] = useState(7) // 7 days default
  const [loading, setLoading] = useState(true)

  // Load initial data
  useEffect(() => {
    if (user?.id) {
      loadClients()
      loadStats()
    }
  }, [user])

  // Load client progress when client changes
  useEffect(() => {
    if (selectedClient && user?.id) {
      loadClientProgress()
    }
  }, [selectedClient, timeFilter, user])

  // Load exercise history when exercise selected
  useEffect(() => {
    if (selectedClient && selectedExercise) {
      loadExerciseHistory()
    }
  }, [selectedClient, selectedExercise])

  const loadClients = async () => {
    try {
      const clientList = await getTrainerClients(user.id)
      setClients(clientList)
      if (clientList.length > 0 && !selectedClient) {
        setSelectedClient(clientList[0])
      }
    } catch (error) {
      console.error('Error loading clients:', error)
    }
  }

  const loadStats = async () => {
    try {
      const stats = await getProgressStats(user.id, 30)
      setProgressStats(stats)
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const loadClientProgress = async () => {
    try {
      setLoading(true)
      const progress = await getCoachClientProgress(user.id, selectedClient.id, timeFilter)
      setClientProgress(progress)
    } catch (error) {
      console.error('Error loading client progress:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadExerciseHistory = async () => {
    try {
      const history = await getExerciseProgress(selectedClient.id, selectedExercise, 20)
      setExerciseHistory(history)
    } catch (error) {
      console.error('Error loading exercise history:', error)
    }
  }

  const openSuggestionModal = (progressEntry) => {
    setSelectedProgressEntry(progressEntry)
    setSuggestionForm({
      type: progressEntry.coach_suggestion || 'maintain_weight',
      customText: progressEntry.coach_suggestion === 'custom' ? progressEntry.coach_suggestion : ''
    })
    setShowSuggestionModal(true)
  }

  const closeSuggestionModal = () => {
    setShowSuggestionModal(false)
    setSelectedProgressEntry(null)
    setSuggestionForm({ type: 'maintain_weight', customText: '' })
  }

  const saveSuggestion = async () => {
    try {
      const suggestion = suggestionForm.type === 'custom' 
        ? suggestionForm.customText 
        : suggestionForm.type

      await updateCoachSuggestion(
        selectedProgressEntry.id, 
        suggestionForm.type,
        suggestionForm.customText
      )

      // Refresh client progress
      await loadClientProgress()
      closeSuggestionModal()
      
    } catch (error) {
      console.error('Error saving suggestion:', error)
      alert('Fout bij opslaan suggestie')
    }
  }

  // Get unique exercises for selected client
  const getClientExercises = () => {
    const exercises = [...new Set(clientProgress.map(p => p.exercise_name))].sort()
    return exercises
  }

  // Group progress by date
  const getProgressByDate = () => {
    const grouped = {}
    clientProgress.forEach(entry => {
      if (!grouped[entry.date]) {
        grouped[entry.date] = []
      }
      grouped[entry.date].push(entry)
    })
    return grouped
  }

  // Get chart data for exercise
  const getExerciseChartData = () => {
    if (!exerciseHistory.length) return []
    
    return calculateMaxWeight(exerciseHistory)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-10) // Last 10 workouts
  }

  if (loading && selectedClient) {
    return (
      <div className="myarc-animate-in" style={{ textAlign: 'center', padding: '2rem' }}>
        <div className="myarc-spinner" style={{ margin: '0 auto' }}></div>
        <p style={{ color: 'var(--c-muted)', marginTop: '1rem' }}>
          Client progress laden...
        </p>
      </div>
    )
  }

  return (
    <div className="myarc-animate-in">
      {/* Header */}
      <div style={{
        padding: isMobile ? '0.5rem' : '1rem',
        background: 'linear-gradient(135deg, #064e3b 0%, #0a5c42 100%)',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        marginBottom: '1rem'
      }}>
        <h2 style={{
          color: '#fff',
          fontSize: isMobile ? '1.25rem' : '1.5rem',
          fontWeight: 'bold',
          marginBottom: '0.25rem'
        }}>
          📊 Coach Progress Dashboard
        </h2>
        <p style={{
          color: 'rgba(255,255,255,0.8)',
          fontSize: '0.875rem'
        }}>
          Monitor client voortgang en geef suggesties
        </p>
      </div>

      {/* Statistics Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{
          padding: '1rem',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '2rem',
            color: '#10b981',
            fontWeight: 'bold',
            marginBottom: '0.5rem'
          }}>
            {progressStats.totalWorkouts || 0}
          </div>
          <div style={{
            color: '#fff',
            fontSize: '0.875rem',
            fontWeight: '600'
          }}>
            Total Workouts (30d)
          </div>
        </div>

        <div style={{
          padding: '1rem',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '2rem',
            color: '#10b981',
            fontWeight: 'bold',
            marginBottom: '0.5rem'
          }}>
            {progressStats.uniqueClients || 0}
          </div>
          <div style={{
            color: '#fff',
            fontSize: '0.875rem',
            fontWeight: '600'
          }}>
            Actieve Clients
          </div>
        </div>

        <div style={{
          padding: '1rem',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '2rem',
            color: '#10b981',
            fontWeight: 'bold',
            marginBottom: '0.5rem'
          }}>
            {progressStats.lastWeekWorkouts || 0}
          </div>
          <div style={{
            color: '#fff',
            fontSize: '0.875rem',
            fontWeight: '600'
          }}>
            Deze Week
          </div>
        </div>
      </div>

      {/* Client Selector */}
      <div style={{
        padding: '1rem',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        marginBottom: '1rem'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: '1rem',
          alignItems: isMobile ? 'stretch' : 'center'
        }}>
          <div style={{ flex: 1 }}>
            <label style={{
              display: 'block',
              color: '#fff',
              fontSize: '0.875rem',
              fontWeight: '600',
              marginBottom: '0.5rem'
            }}>
              👤 Selecteer Client
            </label>
            <select
              value={selectedClient?.id || ''}
              onChange={(e) => {
                const client = clients.find(c => c.id === e.target.value)
                setSelectedClient(client)
                setSelectedExercise('')
              }}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: '#2a2a2a',
                border: '1px solid #10b98133',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '0.875rem'
              }}
            >
              <option value="">Kies client...</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.first_name} {client.last_name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label style={{
              display: 'block',
              color: '#fff',
              fontSize: '0.875rem',
              fontWeight: '600',
              marginBottom: '0.5rem'
            }}>
              ⏰ Periode
            </label>
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(parseInt(e.target.value))}
              style={{
                padding: '0.75rem',
                background: '#2a2a2a',
                border: '1px solid #10b98133',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '0.875rem'
              }}
            >
              <option value={7}>Laatste 7 dagen</option>
              <option value={14}>Laatste 2 weken</option>
              <option value={30}>Laatste 30 dagen</option>
            </select>
          </div>
        </div>
      </div>

      {selectedClient && (
        <>
          {/* Exercise Selector & Chart */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            {/* Exercise Selector */}
            <div style={{
              padding: '1rem',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <label style={{
                display: 'block',
                color: '#fff',
                fontSize: '0.875rem',
                fontWeight: '600',
                marginBottom: '0.5rem'
              }}>
                🏋️ Oefening Progress
              </label>
              <select
                value={selectedExercise}
                onChange={(e) => setSelectedExercise(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#2a2a2a',
                  border: '1px solid #10b98133',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '0.875rem'
                }}
              >
                <option value="">Selecteer oefening...</option>
                {getClientExercises().map(exercise => (
                  <option key={exercise} value={exercise}>
                    {exercise}
                  </option>
                ))}
              </select>
            </div>

            {/* Simple Progress Chart */}
            {selectedExercise && exerciseHistory.length > 0 && (
              <div style={{
                padding: '1rem',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <h4 style={{
                  color: '#fff',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  marginBottom: '1rem'
                }}>
                  📈 {selectedExercise} Progress
                </h4>
                
                {/* Simple text-based chart */}
                <div style={{ height: '120px', overflowY: 'auto' }}>
                  {getExerciseChartData().slice(-5).map((point, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.5rem 0',
                      borderBottom: '1px solid rgba(255,255,255,0.1)'
                    }}>
                      <span style={{
                        color: '#10b981',
                        fontSize: '0.75rem'
                      }}>
                        {new Date(point.date).toLocaleDateString('nl-NL')}
                      </span>
                      <span style={{
                        color: '#fff',
                        fontSize: '0.875rem',
                        fontWeight: '600'
                      }}>
                        {point.maxWeight}kg
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Recent Progress */}
          <div style={{
            padding: '1rem',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{
              color: '#fff',
              fontSize: '1.1rem',
              fontWeight: '600',
              marginBottom: '1rem'
            }}>
              📋 Recent Progress - {selectedClient.first_name} {selectedClient.last_name}
            </h3>

            {clientProgress.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '2rem',
                color: 'rgba(255,255,255,0.6)'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</div>
                <p>Geen workouts gevonden in de geselecteerde periode</p>
              </div>
            ) : (
              <div>
                {Object.entries(getProgressByDate())
                  .sort(([a], [b]) => new Date(b) - new Date(a))
                  .map(([date, dayProgress]) => (
                    <div key={date} style={{
                      marginBottom: '1.5rem',
                      padding: '1rem',
                      background: 'rgba(255,255,255,0.03)',
                      borderRadius: '8px'
                    }}>
                      <div style={{
                        color: '#10b981',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        marginBottom: '0.75rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span>
                          📅 {new Date(date).toLocaleDateString('nl-NL', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </span>
                        <span style={{ color: 'rgba(255,255,255,0.6)' }}>
                          {dayProgress.length} workout{dayProgress.length !== 1 ? 's' : ''}
                        </span>
                      </div>

                      {dayProgress.map((workout, idx) => (
                        <div key={idx} style={{
                          background: 'rgba(255,255,255,0.05)',
                          padding: '1rem',
                          borderRadius: '6px',
                          marginBottom: '0.75rem',
                          border: '1px solid rgba(255,255,255,0.1)'
                        }}>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            marginBottom: '0.5rem'
                          }}>
                            <div>
                              <h4 style={{
                                color: '#fff',
                                fontSize: '1rem',
                                fontWeight: '600',
                                marginBottom: '0.25rem'
                              }}>
                                {workout.exercise_name}
                              </h4>
                              <div style={{
                                color: 'rgba(255,255,255,0.8)',
                                fontSize: '0.875rem'
                              }}>
                                {formatSets(workout.sets)}
                              </div>
                            </div>
                            
                            <button
                              onClick={() => openSuggestionModal(workout)}
                              style={{
                                padding: '0.5rem 1rem',
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                border: 'none',
                                borderRadius: '6px',
                                color: '#fff',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                cursor: 'pointer'
                              }}
                            >
                              💡 Suggestie
                            </button>
                          </div>

                          {workout.notes && (
                            <div style={{
                              color: 'rgba(255,255,255,0.7)',
                              fontSize: '0.875rem',
                              fontStyle: 'italic',
                              marginBottom: '0.5rem'
                            }}>
                              💭 "{workout.notes}"
                            </div>
                          )}

                          {workout.coach_suggestion && (
                            <div style={{
                              background: 'rgba(16, 185, 129, 0.1)',
                              padding: '0.5rem',
                              borderRadius: '4px',
                              borderLeft: '3px solid #10b981'
                            }}>
                              <div style={{
                                color: '#10b981',
                                fontSize: '0.75rem',
                                fontWeight: '600'
                              }}>
                                Coach Suggestie:
                              </div>
                              <div style={{
                                color: 'rgba(255,255,255,0.9)',
                                fontSize: '0.875rem'
                              }}>
                                {getSuggestionText(workout.coach_suggestion, language)}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Suggestion Modal */}
      {showSuggestionModal && selectedProgressEntry && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            background: '#1a1a1a',
            borderRadius: '12px',
            padding: '1.5rem',
            maxWidth: '400px',
            width: '100%'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}>
              <h3 style={{
                color: '#fff',
                fontSize: '1.25rem',
                fontWeight: '600'
              }}>
                💡 Coach Suggestie
              </h3>
              <button
                onClick={closeSuggestionModal}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#fff',
                  fontSize: '1.5rem',
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            </div>

            <div style={{
              background: 'rgba(255,255,255,0.05)',
              padding: '1rem',
              borderRadius: '6px',
              marginBottom: '1rem'
            }}>
              <div style={{
                color: '#10b981',
                fontSize: '0.875rem',
                fontWeight: '600',
                marginBottom: '0.5rem'
              }}>
                {selectedProgressEntry.exercise_name}
              </div>
              <div style={{
                color: 'rgba(255,255,255,0.8)',
                fontSize: '0.875rem'
              }}>
                {formatSets(selectedProgressEntry.sets)}
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{
                display: 'block',
                color: '#fff',
                fontSize: '0.875rem',
                fontWeight: '600',
                marginBottom: '0.5rem'
              }}>
                Suggestie Type
              </label>
              <select
                value={suggestionForm.type}
                onChange={(e) => setSuggestionForm(prev => ({ 
                  ...prev, 
                  type: e.target.value 
                }))}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#2a2a2a',
                  border: '1px solid #10b98133',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '0.875rem'
                }}
              >
                <option value="increase_weight">💪 Zwaarder pakken</option>
                <option value="maintain_weight">✅ Gewicht aanhouden</option>
                <option value="decrease_weight">📉 Lichter pakken</option>
                <option value="custom">✏️ Eigen tekst</option>
              </select>
            </div>

            {suggestionForm.type === 'custom' && (
              <div style={{ marginBottom: '1rem' }}>
                <label style={{
                  display: 'block',
                  color: '#fff',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  marginBottom: '0.5rem'
                }}>
                  Eigen Suggestie
                </label>
                <textarea
                  value={suggestionForm.customText}
                  onChange={(e) => setSuggestionForm(prev => ({ 
                    ...prev, 
                    customText: e.target.value 
                  }))}
                  placeholder="Schrijf je eigen suggestie..."
                  rows="3"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: '#2a2a2a',
                    border: '1px solid #10b98133',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '0.875rem',
                    resize: 'vertical'
                  }}
                />
              </div>
            )}

            <div style={{
              display: 'flex',
              gap: '0.75rem',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={closeSuggestionModal}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'transparent',
                  border: '1px solid #6b7280',
                  color: '#6b7280',
                  borderRadius: '6px',
                  fontSize: '0.875rem'
                }}
              >
                Annuleren
              </button>
              <button
                onClick={saveSuggestion}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: 'none',
                  color: '#fff',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontWeight: '600'
                }}
              >
                💾 Opslaan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
