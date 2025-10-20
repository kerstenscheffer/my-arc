// src/modules/workout/components/todays-workout/components/ExerciseLogModal.jsx
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Plus, Dumbbell, CheckCircle } from 'lucide-react'

// QuickSetInputRow Component
function QuickSetInputRow({ 
  setNumber, 
  weight, 
  reps, 
  completed, 
  onWeightChange, 
  onRepsChange, 
  onComplete,
  isMobile 
}) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '32px 1fr 1fr 36px',
      gap: isMobile ? '0.4rem' : '0.5rem',
      alignItems: 'center',
      padding: isMobile ? '0.5rem' : '0.625rem',
      background: completed 
        ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.08) 100%)' 
        : 'rgba(23, 23, 23, 0.6)',
      border: `1px solid ${completed ? 'rgba(16, 185, 129, 0.3)' : 'rgba(249, 115, 22, 0.1)'}`,
      borderRadius: '8px',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      backdropFilter: 'blur(10px)',
      minHeight: '44px',
      boxShadow: completed ? '0 0 15px rgba(16, 185, 129, 0.15)' : 'none'
    }}>
      <div style={{
        width: isMobile ? '28px' : '32px',
        height: isMobile ? '28px' : '32px',
        borderRadius: '6px',
        background: completed 
          ? 'rgba(16, 185, 129, 0.2)'
          : 'rgba(249, 115, 22, 0.2)',
        border: `1px solid ${completed ? 'rgba(16, 185, 129, 0.3)' : 'rgba(249, 115, 22, 0.3)'}`,
        color: completed ? '#10b981' : '#f97316',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: isMobile ? '0.75rem' : '0.8rem',
        fontWeight: '800',
        boxShadow: completed 
          ? '0 0 12px rgba(16, 185, 129, 0.3)'
          : '0 0 12px rgba(249, 115, 22, 0.3)'
      }}>
        {setNumber}
      </div>
      
      <div style={{
        background: 'rgba(23, 23, 23, 0.6)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(249, 115, 22, 0.1)',
        borderRadius: '6px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        textAlign: 'center',
        minHeight: '44px',
        overflow: 'hidden'
      }}>
        <input
          type="text"
          inputMode="decimal"
          value={weight}
          onChange={(e) => {
            const val = e.target.value
            if (val === '') {
              onWeightChange('')
            } else {
              const num = parseFloat(val)
              if (!isNaN(num)) {
                onWeightChange(num)
              }
            }
          }}
          onFocus={(e) => {
            if (e.target.value === '0' || e.target.value === '20') {
              e.target.select()
            }
          }}
          style={{
            width: '100%',
            padding: isMobile ? '0.35rem' : '0.4rem',
            background: 'transparent',
            border: 'none',
            color: '#f97316',
            fontSize: isMobile ? '0.95rem' : '1rem',
            fontWeight: '800',
            textAlign: 'center',
            outline: 'none',
            letterSpacing: '-0.02em'
          }}
        />
        <div style={{
          fontSize: isMobile ? '0.55rem' : '0.6rem',
          color: 'rgba(255, 255, 255, 0.5)',
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          padding: '0 0.2rem 0.2rem'
        }}>
          KG
        </div>
      </div>
      
      <div style={{
        background: 'rgba(23, 23, 23, 0.6)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(249, 115, 22, 0.1)',
        borderRadius: '6px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        textAlign: 'center',
        minHeight: '44px',
        overflow: 'hidden'
      }}>
        <input
          type="text"
          inputMode="numeric"
          value={reps}
          onChange={(e) => {
            const val = e.target.value
            if (val === '') {
              onRepsChange('')
            } else {
              const num = parseInt(val)
              if (!isNaN(num)) {
                onRepsChange(num)
              }
            }
          }}
          onFocus={(e) => {
            e.target.select()
          }}
          style={{
            width: '100%',
            padding: isMobile ? '0.35rem' : '0.4rem',
            background: 'transparent',
            border: 'none',
            color: '#f97316',
            fontSize: isMobile ? '0.95rem' : '1rem',
            fontWeight: '800',
            textAlign: 'center',
            outline: 'none',
            letterSpacing: '-0.02em'
          }}
        />
        <div style={{
          fontSize: isMobile ? '0.55rem' : '0.6rem',
          color: 'rgba(255, 255, 255, 0.5)',
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          padding: '0 0.2rem 0.2rem'
        }}>
          REPS
        </div>
      </div>
      
      <button
        onClick={onComplete}
        style={{
          width: isMobile ? '32px' : '36px',
          height: isMobile ? '32px' : '36px',
          minHeight: isMobile ? '32px' : '36px',
          borderRadius: '8px',
          background: completed 
            ? 'rgba(16, 185, 129, 0.2)'
            : 'rgba(249, 115, 22, 0.1)',
          border: `1px solid ${completed ? 'rgba(16, 185, 129, 0.3)' : 'rgba(249, 115, 22, 0.2)'}`,
          color: completed ? '#10b981' : '#f97316',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
          boxShadow: completed ? '0 0 15px rgba(16, 185, 129, 0.3)' : 'none'
        }}
        onMouseEnter={(e) => {
          if (!isMobile) {
            e.currentTarget.style.transform = 'scale(1.1)'
          }
        }}
        onMouseLeave={(e) => {
          if (!isMobile) {
            e.currentTarget.style.transform = 'scale(1)'
          }
        }}
      >
        <CheckCircle 
          size={isMobile ? 14 : 16} 
          style={{
            filter: completed 
              ? 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.6))'
              : 'none'
          }}
        />
      </button>
    </div>
  )
}

export default function ExerciseLogModal({ 
  db,
  client,
  exercise,
  onClose, 
  isMobile = window.innerWidth <= 768
}) {
  const [quickSets, setQuickSets] = useState([])
  const [savingQuick, setSavingQuick] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  useEffect(() => {
    if (exercise) {
      const targetSets = parseInt(exercise.sets) || 3
      const repsData = exercise.reps || exercise.rep_range || '10'
      const targetReps = typeof repsData === 'string' ? parseInt(repsData.split('-')[0]) : parseInt(repsData) || 10
      
      const newSets = Array(targetSets).fill().map(() => ({
        weight: 20,
        reps: targetReps,
        completed: false
      }))
      
      setQuickSets(newSets)
    }
  }, [exercise])

  const addQuickSet = () => {
    setQuickSets([...quickSets, { 
      weight: quickSets[quickSets.length - 1]?.weight || 20, 
      reps: quickSets[quickSets.length - 1]?.reps || 10, 
      completed: false 
    }])
  }

  const updateQuickSet = (index, field, value) => {
    const newSets = [...quickSets]
    newSets[index][field] = value
    setQuickSets(newSets)
  }

  const completeQuickSet = (index) => {
    const newSets = [...quickSets]
    newSets[index].completed = !newSets[index].completed
    setQuickSets(newSets)
  }

  const saveQuickLog = async () => {
    const exerciseName = exercise.name
    
    if (!exerciseName) {
      alert('Geen oefening geselecteerd')
      return
    }
    
    const completedSets = quickSets.filter(s => s.completed)
    if (completedSets.length === 0) {
      alert('Voltooi minimaal 1 set')
      return
    }
    
    setSavingQuick(true)
    
    try {
      const setsData = completedSets.map(set => ({
        weight: set.weight,
        reps: set.reps
      }))
      
      if (db.saveQuickWorkoutLog) {
        await db.saveQuickWorkoutLog(
          client?.id || client,
          exerciseName,
          setsData,
          `Quick log - ${new Date().toLocaleDateString()}`
        )
      } else if (db.saveWorkoutProgress) {
        await db.saveWorkoutProgress({
          client_id: client?.id || client,
          exercise_name: exerciseName,
          sets: setsData,
          date: new Date().toISOString().split('T')[0],
          notes: `Quick log - ${new Date().toLocaleDateString()}`
        })
      }
      
      setSaveSuccess(true)
      
      if (navigator.vibrate) navigator.vibrate([50, 100, 50])
      
      setTimeout(() => {
        onClose()
      }, 1000)
      
    } catch (error) {
      console.error('❌ Save failed:', error)
      alert('Opslaan mislukt: ' + error.message)
      setSaveSuccess(false)
    } finally {
      setSavingQuick(false)
    }
  }

  const modalContent = (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.95)',
      backdropFilter: 'blur(20px)',
      zIndex: 10000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: isMobile ? '0.75rem' : '1.5rem',
      animation: 'fadeIn 0.3s ease'
    }}
    onClick={onClose}
    >
      <div 
        style={{
          background: 'linear-gradient(135deg, rgba(17, 17, 17, 0.98) 0%, rgba(10, 10, 10, 0.98) 100%)',
          borderRadius: isMobile ? '14px' : '18px',
          padding: 0,
          width: isMobile ? '95vw' : '500px',
          maxHeight: isMobile ? '75vh' : '70vh',
          boxShadow: '0 20px 60px rgba(249, 115, 22, 0.25)',
          border: '1px solid rgba(249, 115, 22, 0.25)',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          backdropFilter: 'blur(20px)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, transparent 0%, #f97316 50%, transparent 100%)',
          opacity: 0.6
        }} />
        
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: isMobile ? '0.875rem 1rem' : '1rem 1.25rem',
          borderBottom: '1px solid rgba(249, 115, 22, 0.1)',
          flexShrink: 0
        }}>
          <div style={{ flex: 1, minWidth: 0, paddingRight: '1rem' }}>
            <h2 style={{
              fontSize: isMobile ? '1rem' : '1.1rem',
              color: '#fff',
              fontWeight: '800',
              margin: 0,
              marginBottom: '0.2rem',
              letterSpacing: '-0.02em',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {exercise.name}
            </h2>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: isMobile ? '0.65rem' : '0.7rem',
              color: 'rgba(255, 255, 255, 0.5)',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              <span>{exercise.sets} SETS</span>
              <span>•</span>
              <span>{exercise.reps} REPS</span>
              {exercise.rust && (
                <>
                  <span>•</span>
                  <span>{exercise.rust}S RUST</span>
                </>
              )}
            </div>
          </div>
          
          <button
            onClick={onClose}
            style={{
              width: '44px',
              height: '44px',
              minHeight: '44px',
              flexShrink: 0,
              borderRadius: '10px',
              background: 'rgba(23, 23, 23, 0.6)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(249, 115, 22, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              color: '#f97316',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            <X size={isMobile ? 18 : 20} strokeWidth={2.5} />
          </button>
        </div>

        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          
          <div style={{
            flex: 1,
            padding: isMobile ? '0.875rem 1rem' : '1rem 1.25rem',
            overflowY: 'auto'
          }}>

            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.5rem'
              }}>
                <label style={{
                  color: 'rgba(255, 255, 255, 0.5)',
                  fontSize: isMobile ? '0.55rem' : '0.6rem',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  LOG SETS
                </label>
                
                <button
                  onClick={addQuickSet}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    padding: isMobile ? '0.4rem 0.625rem' : '0.5rem 0.75rem',
                    background: 'rgba(249, 115, 22, 0.1)',
                    border: '1px solid rgba(249, 115, 22, 0.2)',
                    borderRadius: '8px',
                    color: '#f97316',
                    fontSize: isMobile ? '0.65rem' : '0.7rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    minHeight: '44px'
                  }}
                >
                  <Plus size={isMobile ? 13 : 14} />
                  SET
                </button>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '0.5rem' : '0.625rem' }}>
                {quickSets.map((set, index) => (
                  <QuickSetInputRow
                    key={index}
                    setNumber={index + 1}
                    weight={set.weight}
                    reps={set.reps}
                    completed={set.completed}
                    onWeightChange={(value) => updateQuickSet(index, 'weight', value)}
                    onRepsChange={(value) => updateQuickSet(index, 'reps', value)}
                    onComplete={() => completeQuickSet(index)}
                    isMobile={isMobile}
                  />
                ))}
              </div>
            </div>
          </div>

          <div style={{
            padding: isMobile ? '0.75rem 1rem' : '1rem 1.25rem',
            borderTop: '1px solid rgba(249, 115, 22, 0.1)',
            flexShrink: 0
          }}>
            <button
              onClick={saveQuickLog}
              disabled={savingQuick}
              style={{
                width: '100%',
                padding: isMobile ? '0.75rem' : '0.875rem',
                background: saveSuccess 
                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                  : savingQuick
                    ? 'rgba(107, 114, 128, 0.3)'
                    : 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                border: 'none',
                borderRadius: '10px',
                color: savingQuick ? 'rgba(255, 255, 255, 0.5)' : '#000',
                fontSize: isMobile ? '0.85rem' : '0.9rem',
                fontWeight: '700',
                cursor: savingQuick ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: saveSuccess 
                  ? '0 10px 25px rgba(16, 185, 129, 0.3)'
                  : savingQuick
                    ? 'none'
                    : '0 8px 20px rgba(249, 115, 22, 0.35)',
                transform: savingQuick ? 'scale(0.98)' : 'scale(1)',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                minHeight: '44px'
              }}
            >
              {saveSuccess ? (
                <>
                  <CheckCircle size={isMobile ? 16 : 18} />
                  Opgeslagen!
                </>
              ) : savingQuick ? (
                <>
                  <div style={{
                    width: isMobile ? '16px' : '18px',
                    height: isMobile ? '16px' : '18px',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    borderTopColor: '#fff',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  Opslaan...
                </>
              ) : (
                <>
                  <Dumbbell size={isMobile ? 16 : 18} />
                  Opslaan
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )

  return createPortal(modalContent, document.body)
}
