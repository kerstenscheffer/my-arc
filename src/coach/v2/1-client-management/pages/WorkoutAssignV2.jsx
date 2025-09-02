import { useState, useEffect } from 'react'
import { Search, Calendar, Clock, Users, Dumbbell, ChevronRight, X, Check, AlertCircle } from 'lucide-react'

export default function WorkoutAssignV2({ db, client, workoutSchemas = [], refreshData, isMobile }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSchema, setSelectedSchema] = useState(null)
  const [showPreview, setShowPreview] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [isAssigning, setIsAssigning] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [schemas, setSchemas] = useState([])
  const [loading, setLoading] = useState(true)

  // Load schemas on mount
  useEffect(() => {
    loadSchemas()
    checkCurrentAssignment()
  }, [client])

  // TEMPORARY: Test data for debugging
  const createTestSchemas = () => {
    console.log('🧪 Creating TEST schemas for debugging...')
    return [
      {
        id: 'test-1',
        name: 'Push/Pull/Legs - Beginner',
        description: 'Classic 3-day split for beginners',
        days_per_week: 3,
        experience_level: 'beginner',
        primary_goal: 'hypertrophy',
        week_structure: {
          day1: { name: 'Push Day', focus: 'Chest, Shoulders, Triceps', exercises: [] },
          day2: { name: 'Pull Day', focus: 'Back, Biceps', exercises: [] },
          day3: { name: 'Leg Day', focus: 'Quads, Hamstrings, Glutes', exercises: [] }
        }
      },
      {
        id: 'test-2',
        name: 'Upper/Lower - Intermediate',
        description: '4-day upper/lower split for muscle growth',
        days_per_week: 4,
        experience_level: 'intermediate',
        primary_goal: 'strength',
        week_structure: {
          day1: { name: 'Upper A', focus: 'Chest, Back', exercises: [] },
          day2: { name: 'Lower A', focus: 'Quads, Glutes', exercises: [] },
          day3: { name: 'Upper B', focus: 'Shoulders, Arms', exercises: [] },
          day4: { name: 'Lower B', focus: 'Hamstrings, Calves', exercises: [] }
        }
      },
      {
        id: 'test-3',
        name: 'Full Body - Advanced',
        description: 'High-frequency full body training',
        days_per_week: 5,
        experience_level: 'advanced',
        primary_goal: 'hypertrophy',
        week_structure: {
          day1: { name: 'Full Body A', focus: 'All muscle groups', exercises: [] },
          day2: { name: 'Full Body B', focus: 'All muscle groups', exercises: [] },
          day3: { name: 'Full Body C', focus: 'All muscle groups', exercises: [] },
          day4: { name: 'Full Body D', focus: 'All muscle groups', exercises: [] },
          day5: { name: 'Full Body E', focus: 'All muscle groups', exercises: [] }
        }
      }
    ]
  }

  const loadSchemas = async () => {
    try {
      setLoading(true)
      console.log('🏋️ Loading workout schemas...')
      
      // Try multiple methods to get schemas
      let fetchedSchemas = []
      
      // Method 1: Try with current user ID
      try {
        const user = await db.getCurrentUser()
        console.log('👤 Current user:', user)
        
        if (user && user.id) {
          fetchedSchemas = await db.getWorkoutSchemas(user.id)
          console.log('📊 Method 1 - Schemas with user ID:', fetchedSchemas)
        }
      } catch (error) {
        console.log('Method 1 failed:', error.message)
      }
      
      // Method 2: If no schemas found, try without user ID
      if (!fetchedSchemas || fetchedSchemas.length === 0) {
        try {
          console.log('🔄 Trying without user ID...')
          fetchedSchemas = await db.getWorkoutSchemas()
          console.log('📊 Method 2 - Schemas without user ID:', fetchedSchemas)
        } catch (error) {
          console.log('Method 2 failed:', error.message)
        }
      }
      
      // Method 3: If still no schemas, try getting ALL schemas from database
      if (!fetchedSchemas || fetchedSchemas.length === 0) {
        try {
          console.log('🔄 Trying to get ALL workout schemas...')
          // This might be a different method name in your DatabaseService
          if (db.getAllWorkoutSchemas) {
            fetchedSchemas = await db.getAllWorkoutSchemas()
            console.log('📊 Method 3 - All schemas:', fetchedSchemas)
          }
        } catch (error) {
          console.log('Method 3 failed:', error.message)
        }
      }
      
      // Use fetched schemas if available, otherwise use props
      const availableSchemas = (fetchedSchemas && fetchedSchemas.length > 0) 
        ? fetchedSchemas 
        : (workoutSchemas || [])
      
      // Debug: Log what we're actually setting
      console.log('📌 Final schemas to display:', availableSchemas)
      console.log('📌 Number of schemas:', availableSchemas.length)
      
      // Use test schemas if no real schemas found (TEMPORARY FOR DEBUGGING)
      if (availableSchemas.length === 0) {
        console.warn('⚠️ Using TEST schemas for debugging purposes')
        const testSchemas = createTestSchemas()
        setSchemas(testSchemas)
        setError('⚠️ Using test data - Database connection may have issues')
        console.log('✅ Loaded TEST schemas:', testSchemas)
      } else {
        setSchemas(availableSchemas)
        console.log(`✅ Loaded ${availableSchemas.length} schemas from database`)
      }
    } catch (error) {
      console.error('❌ Error loading schemas:', error)
      setError('Failed to load workout schemas: ' + error.message)
      // Fallback to props if database fails
      setSchemas(workoutSchemas || [])
    } finally {
      setLoading(false)
    }
  }

  // Check if client already has an assigned workout
  const checkCurrentAssignment = async () => {
    if (!client || !client.id) return
    
    try {
      console.log('🔍 Checking current workout assignment for client:', client.id)
      
      // Use getClientWorkoutPlan to check current assignment
      const currentPlan = await db.getClientWorkoutPlan(client.id)
      console.log('📋 Current workout plan:', currentPlan)
      
      if (currentPlan && currentPlan.id) {
        // Pre-select the current schema if it exists
        setSelectedSchema(currentPlan)
      }
    } catch (error) {
      console.log('No current workout plan found:', error.message)
    }
  }

  // Filter schemas based on search
  const filteredSchemas = schemas.filter(schema => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      schema.name?.toLowerCase().includes(search) ||
      schema.description?.toLowerCase().includes(search) ||
      schema.experience_level?.toLowerCase().includes(search) ||
      schema.days_per_week?.toString().includes(search)
    )
  })

  // Handle schema selection
  const handleSelectSchema = (schema) => {
    setSelectedSchema(schema)
    setShowPreview(true)
    setError(null)
  }

  // Assign workout to client
  const handleAssignWorkout = async () => {
    if (!selectedSchema || !client) {
      setError('Please select a schema and client')
      return
    }

    setIsAssigning(true)
    setError(null)

    try {
      console.log('🎯 Assigning workout:', {
        clientId: client.id,
        schemaId: selectedSchema.id,
        schemaName: selectedSchema.name
      })

      // Assign the workout using DatabaseService
      const result = await db.assignWorkoutToClient(client.id, selectedSchema.id)
      console.log('✅ Assignment result:', result)
      
      // Show success
      setSuccess(true)
      setShowConfirmModal(false)
      setShowPreview(false)
      
      // Refresh parent data if function provided
      if (refreshData) {
        await refreshData()
      }

      // Reset after 3 seconds
      setTimeout(() => {
        setSuccess(false)
        setSelectedSchema(null)
      }, 3000)

    } catch (error) {
      console.error('❌ Error assigning workout:', error)
      setError(error.message || 'Failed to assign workout. Please try again.')
    } finally {
      setIsAssigning(false)
    }
  }

  // Get schema statistics
  const getSchemaStats = (schema) => {
    const stats = {
      totalExercises: 0,
      totalSets: 0,
      muscleGroups: new Set()
    }

    // Check both week_structure and weekStructure (different naming conventions)
    const weekData = schema.week_structure || schema.weekStructure
    
    if (weekData) {
      Object.values(weekData).forEach(day => {
        if (day.exercises) {
          stats.totalExercises += day.exercises.length
          day.exercises.forEach(ex => {
            stats.totalSets += parseInt(ex.sets) || 0
            // Check multiple possible field names
            const muscle = ex.primary_muscle || ex.primairSpieren || ex.muscleGroup
            if (muscle) {
              stats.muscleGroups.add(muscle)
            }
          })
        }
      })
    }

    return stats
  }

  // Render week preview
  const renderWeekPreview = () => {
    if (!selectedSchema) return null

    // Check both possible field names
    const weekData = selectedSchema.week_structure || selectedSchema.weekStructure
    
    if (!weekData) {
      return (
        <div style={{
          color: 'rgba(255, 255, 255, 0.5)',
          fontSize: isMobile ? '0.85rem' : '0.9rem',
          textAlign: 'center',
          padding: '2rem'
        }}>
          No week structure available for this schema
        </div>
      )
    }

    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: isMobile ? '0.75rem' : '1rem'
      }}>
        {Object.entries(weekData).map(([dayKey, day], index) => (
          <div key={dayKey} style={{
            background: 'rgba(249, 115, 22, 0.05)',
            border: '1px solid rgba(249, 115, 22, 0.2)',
            borderRadius: '12px',
            padding: isMobile ? '0.75rem' : '1rem',
            transition: 'all 0.3s ease'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.5rem'
            }}>
              <h4 style={{
                color: '#f97316',
                fontSize: isMobile ? '0.9rem' : '1rem',
                fontWeight: '600',
                margin: 0
              }}>
                Day {index + 1}: {day.name || 'Training Day'}
              </h4>
              <span style={{
                color: 'rgba(255, 255, 255, 0.5)',
                fontSize: isMobile ? '0.75rem' : '0.85rem'
              }}>
                {day.exercises?.length || 0} exercises
              </span>
            </div>
            
            {day.focus && (
              <p style={{
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: isMobile ? '0.8rem' : '0.85rem',
                margin: '0.25rem 0'
              }}>
                Focus: {day.focus}
              </p>
            )}

            {day.exercises && day.exercises.length > 0 && (
              <div style={{
                marginTop: '0.5rem',
                paddingTop: '0.5rem',
                borderTop: '1px solid rgba(249, 115, 22, 0.1)'
              }}>
                {day.exercises.slice(0, 3).map((exercise, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontSize: isMobile ? '0.75rem' : '0.8rem',
                    marginBottom: '0.25rem'
                  }}>
                    <span>•</span>
                    <span>{exercise.name}</span>
                    <span style={{ color: 'rgba(249, 115, 22, 0.7)' }}>
                      {exercise.sets}x{exercise.reps}
                    </span>
                  </div>
                ))}
                {day.exercises.length > 3 && (
                  <span style={{
                    color: 'rgba(255, 255, 255, 0.4)',
                    fontSize: isMobile ? '0.7rem' : '0.75rem'
                  }}>
                    +{day.exercises.length - 3} more exercises
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  // Loading state
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '3px solid rgba(249, 115, 22, 0.2)',
          borderTopColor: '#f97316',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    )
  }

  return (
    <div style={{
      padding: isMobile ? '1rem' : '1.5rem',
      background: '#111',
      borderRadius: '16px',
      border: '1px solid #333'
    }}>
      {/* Header */}
      <div style={{
        marginBottom: '1.5rem'
      }}>
        <h3 style={{
          color: '#f97316',
          fontSize: isMobile ? '1.25rem' : '1.5rem',
          fontWeight: '700',
          margin: 0,
          marginBottom: '0.5rem'
        }}>
          Assign Workout Plan
        </h3>
        <p style={{
          color: 'rgba(255, 255, 255, 0.6)',
          fontSize: isMobile ? '0.85rem' : '0.9rem',
          margin: 0
        }}>
          Select a workout schema for {client?.first_name} {client?.last_name}
        </p>
      </div>

      {/* Success Message */}
      {success && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '12px',
          padding: '1rem',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <Check size={20} color="#10b981" />
          <span style={{ color: '#10b981', fontWeight: '500' }}>
            Workout assigned successfully!
          </span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(239, 68, 68, 0.1) 100%)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '12px',
          padding: '1rem',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <AlertCircle size={20} color="#ef4444" />
          <span style={{ color: '#ef4444' }}>{error}</span>
        </div>
      )}

      {/* Search Bar */}
      <div style={{
        position: 'relative',
        marginBottom: '1.5rem'
      }}>
        <Search size={18} style={{
          position: 'absolute',
          left: '1rem',
          top: '50%',
          transform: 'translateY(-50%)',
          color: 'rgba(255, 255, 255, 0.4)'
        }} />
        <input
          type="text"
          placeholder="Search workout schemas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: isMobile ? '0.75rem 1rem 0.75rem 2.5rem' : '1rem 1rem 1rem 3rem',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(249, 115, 22, 0.2)',
            borderRadius: '12px',
            color: '#fff',
            fontSize: isMobile ? '0.9rem' : '1rem',
            outline: 'none',
            transition: 'all 0.3s ease'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = 'rgba(249, 115, 22, 0.5)'
            e.target.style.background = 'rgba(255, 255, 255, 0.08)'
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'rgba(249, 115, 22, 0.2)'
            e.target.style.background = 'rgba(255, 255, 255, 0.05)'
          }}
        />
      </div>

      {/* Schema Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(1, 1fr)' : 'repeat(2, 1fr)',
        gap: isMobile ? '0.75rem' : '1rem',
        maxHeight: '400px',
        overflowY: 'auto',
        padding: '0.25rem',
        marginBottom: '1rem'
      }}>
        {filteredSchemas.length === 0 ? (
          <div style={{
            gridColumn: 'span 2',
            textAlign: 'center',
            padding: '3rem 1rem',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <Dumbbell size={48} style={{ 
              color: 'rgba(249, 115, 22, 0.3)',
              marginBottom: '1rem'
            }} />
            <h4 style={{
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: isMobile ? '1rem' : '1.1rem',
              marginBottom: '0.5rem'
            }}>
              No Workout Schemas Found
            </h4>
            <p style={{
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: isMobile ? '0.85rem' : '0.9rem'
            }}>
              {searchTerm 
                ? `No schemas matching "${searchTerm}"`
                : 'Create workout schemas first in the AI Generator or Templates section'}
            </p>
          </div>
        ) : (
          filteredSchemas.map((schema) => {
            const stats = getSchemaStats(schema)
            const isSelected = selectedSchema?.id === schema.id
            const isCurrent = client.assigned_schema_id === schema.id

            return (
              <div
                key={schema.id}
                onClick={() => handleSelectSchema(schema)}
                style={{
                  background: isSelected 
                    ? 'linear-gradient(135deg, rgba(249, 115, 22, 0.2) 0%, rgba(249, 115, 22, 0.1) 100%)'
                    : 'rgba(255, 255, 255, 0.03)',
                  border: isSelected
                    ? '2px solid #f97316'
                    : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  padding: isMobile ? '0.75rem' : '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  minHeight: '44px'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'rgba(249, 115, 22, 0.05)'
                    e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.3)'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }
                }}
                onTouchStart={(e) => {
                  if (isMobile) {
                    e.currentTarget.style.transform = 'scale(0.98)'
                  }
                }}
                onTouchEnd={(e) => {
                  if (isMobile) {
                    e.currentTarget.style.transform = 'scale(1)'
                  }
                }}
              >
                {/* Currently Assigned Badge */}
                {isCurrent && (
                  <span style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    background: '#10b981',
                    color: '#fff',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: isMobile ? '0.65rem' : '0.7rem',
                    fontWeight: '600'
                  }}>
                    Currently Assigned
                  </span>
                )}

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.5rem'
                }}>
                  <h4 style={{
                    color: isSelected ? '#f97316' : '#fff',
                    fontSize: isMobile ? '0.9rem' : '1rem',
                    fontWeight: '600',
                    margin: 0,
                    paddingRight: isCurrent ? '120px' : '0'
                  }}>
                    {schema.name}
                  </h4>
                  {isSelected && !isCurrent && <Check size={18} color="#f97316" />}
                </div>

                {schema.description && (
                  <p style={{
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontSize: isMobile ? '0.75rem' : '0.8rem',
                    margin: '0.25rem 0 0.5rem 0',
                    lineHeight: '1.4'
                  }}>
                    {schema.description}
                  </p>
                )}

                <div style={{
                  display: 'flex',
                  gap: '1rem',
                  flexWrap: 'wrap'
                }}>
                  {/* Days per week */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    color: 'rgba(255, 255, 255, 0.5)',
                    fontSize: isMobile ? '0.7rem' : '0.75rem'
                  }}>
                    <Calendar size={14} />
                    <span>{schema.days_per_week || '?'} days/week</span>
                  </div>
                  
                  {/* Experience level */}
                  {schema.experience_level && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      color: 'rgba(255, 255, 255, 0.5)',
                      fontSize: isMobile ? '0.7rem' : '0.75rem'
                    }}>
                      <Users size={14} />
                      <span>{schema.experience_level}</span>
                    </div>
                  )}
                  
                  {/* Primary goal */}
                  {schema.primary_goal && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      color: 'rgba(255, 255, 255, 0.5)',
                      fontSize: isMobile ? '0.7rem' : '0.75rem'
                    }}>
                      <Dumbbell size={14} />
                      <span>{schema.primary_goal}</span>
                    </div>
                  )}
                  
                  {/* Total exercises (if week structure exists) */}
                  {stats.totalExercises > 0 && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      color: 'rgba(255, 255, 255, 0.5)',
                      fontSize: isMobile ? '0.7rem' : '0.75rem'
                    }}>
                      <span>{stats.totalExercises} exercises</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Preview Button */}
      {selectedSchema && (
        <button
          onClick={() => setShowPreview(true)}
          style={{
            width: '100%',
            padding: isMobile ? '0.75rem' : '1rem',
            background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
            border: 'none',
            borderRadius: '12px',
            color: '#fff',
            fontSize: isMobile ? '0.95rem' : '1.1rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            minHeight: '44px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(249, 115, 22, 0.4)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = 'none'
          }}
          onTouchStart={(e) => {
            if (isMobile) {
              e.currentTarget.style.transform = 'scale(0.98)'
            }
          }}
          onTouchEnd={(e) => {
            if (isMobile) {
              e.currentTarget.style.transform = 'scale(1)'
            }
          }}
        >
          Preview & Assign
          <ChevronRight size={20} />
        </button>
      )}

      {/* Preview Modal */}
      {showPreview && selectedSchema && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            background: '#1a1a1a',
            borderRadius: '16px',
            border: '2px solid #f97316',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '80vh',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: isMobile ? '1rem' : '1.5rem',
              borderBottom: '1px solid rgba(249, 115, 22, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <h3 style={{
                color: '#f97316',
                fontSize: isMobile ? '1.1rem' : '1.25rem',
                fontWeight: '600',
                margin: 0
              }}>
                {selectedSchema.name}
              </h3>
              <button
                onClick={() => setShowPreview(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.6)',
                  cursor: 'pointer',
                  padding: '0.25rem'
                }}
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{
              padding: isMobile ? '1rem' : '1.5rem',
              overflowY: 'auto',
              flex: 1
            }}>
              {/* Schema Info */}
              <div style={{
                marginBottom: '1.5rem'
              }}>
                <p style={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: isMobile ? '0.85rem' : '0.9rem',
                  lineHeight: '1.5',
                  margin: '0 0 1rem 0'
                }}>
                  {selectedSchema.description}
                </p>
                
                <div style={{
                  display: 'flex',
                  gap: '1.5rem',
                  flexWrap: 'wrap'
                }}>
                  <div>
                    <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.8rem' }}>Days/Week</span>
                    <div style={{ color: '#f97316', fontSize: '1.1rem', fontWeight: '600' }}>
                      {selectedSchema.days_per_week || '?'}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.8rem' }}>Level</span>
                    <div style={{ color: '#f97316', fontSize: '1.1rem', fontWeight: '600' }}>
                      {selectedSchema.experience_level || 'All'}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.8rem' }}>Total Exercises</span>
                    <div style={{ color: '#f97316', fontSize: '1.1rem', fontWeight: '600' }}>
                      {getSchemaStats(selectedSchema).totalExercises}
                    </div>
                  </div>
                </div>
              </div>

              {/* Week Preview */}
              <div>
                <h4 style={{
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: isMobile ? '0.95rem' : '1rem',
                  fontWeight: '600',
                  marginBottom: '1rem'
                }}>
                  Week Structure
                </h4>
                {renderWeekPreview()}
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: isMobile ? '1rem' : '1.5rem',
              borderTop: '1px solid rgba(249, 115, 22, 0.2)',
              display: 'flex',
              gap: '0.75rem'
            }}>
              <button
                onClick={() => setShowPreview(false)}
                style={{
                  flex: 1,
                  padding: isMobile ? '0.75rem' : '1rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: isMobile ? '0.9rem' : '1rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowPreview(false)
                  setShowConfirmModal(true)
                }}
                style={{
                  flex: 1,
                  padding: isMobile ? '0.75rem' : '1rem',
                  background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: isMobile ? '0.9rem' : '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                Assign to Client
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {showConfirmModal && selectedSchema && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            background: '#1a1a1a',
            borderRadius: '16px',
            border: '2px solid #f97316',
            maxWidth: '400px',
            width: '100%',
            padding: isMobile ? '1.5rem' : '2rem'
          }}>
            <h3 style={{
              color: '#f97316',
              fontSize: isMobile ? '1.1rem' : '1.25rem',
              fontWeight: '600',
              marginBottom: '1rem'
            }}>
              Confirm Assignment
            </h3>
            
            <p style={{
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: isMobile ? '0.9rem' : '0.95rem',
              lineHeight: '1.5',
              marginBottom: '1.5rem'
            }}>
              Are you sure you want to assign <strong style={{ color: '#f97316' }}>{selectedSchema.name}</strong> to <strong style={{ color: '#f97316' }}>{client?.first_name} {client?.last_name}</strong>?
            </p>

            <div style={{
              display: 'flex',
              gap: '0.75rem'
            }}>
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={isAssigning}
                style={{
                  flex: 1,
                  padding: isMobile ? '0.75rem' : '1rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: isMobile ? '0.9rem' : '1rem',
                  fontWeight: '500',
                  cursor: isAssigning ? 'not-allowed' : 'pointer',
                  opacity: isAssigning ? 0.5 : 1,
                  transition: 'all 0.3s ease'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAssignWorkout}
                disabled={isAssigning}
                style={{
                  flex: 1,
                  padding: isMobile ? '0.75rem' : '1rem',
                  background: isAssigning 
                    ? 'rgba(249, 115, 22, 0.5)'
                    : 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: isMobile ? '0.9rem' : '1rem',
                  fontWeight: '600',
                  cursor: isAssigning ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                {isAssigning ? (
                  <>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid rgba(255, 255, 255, 0.3)',
                      borderTopColor: '#fff',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    Assigning...
                  </>
                ) : (
                  <>
                    <Check size={18} />
                    Confirm
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Keyframe animations */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
