// src/modules/workout/components/todays-workout/components/ExerciseList.jsx
import { useState, useEffect, useRef } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import ExerciseCard from './ExerciseCard'
import AddExerciseModal from './AddExerciseModal'
import { isExerciseFullyLogged } from '../../../utils/exerciseCompletion'

export default function ExerciseList({
  exercises, todaysLogs, onLogsUpdate,
  client, schema, db, workoutDayKey
}) {
  const isMobile = window.innerWidth <= 768
  const [visibleExercises, setVisibleExercises] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [localExercises, setLocalExercises] = useState(exercises || [])
  const [deletingIndex, setDeletingIndex] = useState(null)
  const [swipedIndex, setSwipedIndex] = useState(null)

  useEffect(() => {
    localExercises.forEach((_, index) => {
      setTimeout(() => setVisibleExercises(prev => [...prev, index]), index * 120)
    })
  }, [localExercises])

  // Sync on content (not just reference) — needed because after a permanent
  // swap the parent reloads the schema but may pass an exercises array whose
  // reference equality doesn't fire React's useEffect, leaving the list
  // stale until a hard refresh.
  const exercisesSignature = (exercises || [])
    .map(e => `${e.name}|${e._pendingPermanent ? 1 : 0}|${e._isWeeklyOverride ? 1 : 0}|${e.image_url || ''}`)
    .join(',')
  useEffect(() => { setLocalExercises(exercises || []) }, [exercisesSignature])

  // Een oefening geldt pas als "gelogd" (doorgestreept) als álle geplande sets
  // gedaan zijn — niet al na de eerste set.

  const saveExercises = async (updatedExercises) => {
    if (!client?.id || !db || !workoutDayKey || !schema?.id) return
    const updatedStructure = {
      ...schema.week_structure,
      [workoutDayKey]: { ...schema.week_structure[workoutDayKey], exercises: updatedExercises }
    }
    const { error } = await db.supabase
      .from('workout_schemas')
      .update({ week_structure: updatedStructure, updated_at: new Date().toISOString() })
      .eq('id', schema.id)
    if (error) throw error
  }

  const handleAddExercise = async (newExercise) => {
    try {
      const updatedExercises = [...localExercises, newExercise]
      setLocalExercises(updatedExercises)
      if (!newExercise._addedToDay) {
        await saveExercises(updatedExercises)
      }
      if (navigator.vibrate) navigator.vibrate([50, 100, 50])
      setShowAddModal(false)
      if (onLogsUpdate) onLogsUpdate({ reloadSchema: true })
    } catch (error) {
      console.error('❌ Add exercise failed:', error)
      alert('Kon oefening niet toevoegen.')
      setLocalExercises(exercises || [])
    }
  }

  const handleDelete = async (index) => {
    try {
      setDeletingIndex(index)
      const updatedExercises = localExercises.filter((_, i) => i !== index)
      setLocalExercises(updatedExercises)
      setSwipedIndex(null)
      await saveExercises(updatedExercises)
      if (navigator.vibrate) navigator.vibrate([30, 60, 30])
      if (onLogsUpdate) onLogsUpdate({ reloadSchema: true })
    } catch (error) {
      console.error('❌ Delete failed:', error)
      setLocalExercises(exercises || [])
    } finally {
      setDeletingIndex(null)
    }
  }

  const handleMakePermanent = async (index) => {
    try {
      const updatedExercises = localExercises.map((ex, i) =>
        i === index ? { ...ex, _pendingPermanent: false } : ex
      )
      await saveExercises(updatedExercises)
      setLocalExercises(updatedExercises)
      if (onLogsUpdate) onLogsUpdate({ reloadSchema: true })
    } catch (e) {
      console.error('❌ Make permanent failed:', e)
    }
  }

  const emptyState = !localExercises || localExercises.length === 0

  return (
    <>
      {emptyState ? (
        <div style={{ padding: isMobile ? '2rem 1rem' : '3rem 1rem', textAlign: 'center' }}>
          <div style={{ background: 'rgba(23,23,23,0.6)', border: '1px solid rgba(255,215,0,0.1)', borderRadius: '12px', padding: isMobile ? '1.5rem' : '2rem', marginBottom: isMobile ? '1.25rem' : '1.5rem' }}>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: isMobile ? '0.85rem' : '0.9rem', fontWeight: '600', margin: 0 }}>
              Nog geen oefeningen in deze workout
            </p>
          </div>
          <button onClick={() => setShowAddModal(true)} style={{ padding: isMobile ? '0.75rem 1.5rem' : '0.875rem 2rem', background: 'linear-gradient(135deg, rgba(255,215,0,0.2) 0%, rgba(255,165,0,0.12) 100%)', border: '1px solid rgba(255,215,0,0.3)', borderRadius: '10px', color: '#FFD700', fontSize: isMobile ? '0.8rem' : '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', minHeight: '44px', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
            <Plus size={isMobile ? 16 : 18} strokeWidth={2.5} />
            Voeg Eerste Oefening Toe
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {localExercises.map((exercise, index) => (
            <SwipeableRow
              key={`${exercise.name}-${index}`}
              index={index}
              swipedIndex={swipedIndex}
              onSwipeOpen={() => setSwipedIndex(index)}
              onSwipeClose={() => setSwipedIndex(null)}
              onDelete={() => handleDelete(index)}
              deleting={deletingIndex === index}
              isMobile={isMobile}
            >
              <ExerciseCard
                exercise={exercise}
                index={index}
                totalExercises={localExercises.length}
                isLogged={isExerciseFullyLogged(exercise, todaysLogs)}
                previousLog={null}
                onLogsUpdate={onLogsUpdate}
                client={client}
                schema={schema}
                db={db}
                workoutDayKey={workoutDayKey}
                visible={visibleExercises.includes(index)}
                delay={index * 120}
                onMakePermanent={() => handleMakePermanent(index)}
              />
            </SwipeableRow>
          ))}

          {/* Inline "Voeg Oefening Toe" knop weggehaald — vervangen door floating FAB hieronder */}
        </div>
      )}

      {/* Floating FAB — zelfde stijl als MealLogFAB op de meal-pagina.
          Alleen zichtbaar wanneer de exercise-list rendert (= dropdown open). */}
      <button
        onClick={() => setShowAddModal(true)}
        aria-label="Oefening toevoegen"
        style={{
          position: 'fixed',
          left: isMobile ? 18 : 28,
          bottom: `calc(env(safe-area-inset-bottom, 0px) + ${isMobile ? 24 : 28}px)`,
          zIndex: 90,
          width: isMobile ? 76 : 84,
          height: isMobile ? 76 : 84,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #FFD700 0%, #D4AF37 100%)',
          border: 'none',
          color: '#0a0a0a',
          cursor: 'pointer',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
          boxShadow: '0 14px 36px rgba(255,215,0,0.32), 0 4px 12px rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: 0,
          transition: 'transform 0.18s ease',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)' }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
      >
        <Plus size={isMobile ? 30 : 34} strokeWidth={3} />
        <span style={{
          fontSize: '0.56rem', fontWeight: 900,
          letterSpacing: '0.06em', textTransform: 'uppercase',
          marginTop: -2, lineHeight: 1,
        }}>
          Oefening
        </span>
      </button>

      {showAddModal && (
        <AddExerciseModal
          onClose={() => setShowAddModal(false)}
          onSave={handleAddExercise}
          client={client}
          db={db}
          schema={schema}
          workoutDayKey={workoutDayKey}
        />
      )}
    </>
  )
}

function SwipeableRow({ children, index, swipedIndex, onSwipeOpen, onSwipeClose, onDelete, deleting, isMobile }) {
  const startX = useRef(null)
  const currentX = useRef(0)
  const rowRef = useRef(null)
  const DELETE_THRESHOLD = 80
  const isOpen = swipedIndex === index

  const handleTouchStart = (e) => {
    startX.current = e.touches[0].clientX
    currentX.current = 0
  }

  const handleTouchMove = (e) => {
    if (startX.current === null) return
    const diff = startX.current - e.touches[0].clientX
    if (diff < 0) return
    currentX.current = Math.min(diff, DELETE_THRESHOLD + 20)
    if (rowRef.current) {
      rowRef.current.style.transform = `translateX(-${currentX.current}px)`
      rowRef.current.style.transition = 'none'
    }
  }

  const handleTouchEnd = () => {
    if (startX.current === null) return
    if (rowRef.current) rowRef.current.style.transition = 'transform 0.25s ease'
    if (currentX.current >= DELETE_THRESHOLD) {
      onSwipeOpen()
      if (rowRef.current) rowRef.current.style.transform = `translateX(-${DELETE_THRESHOLD}px)`
    } else {
      onSwipeClose()
      if (rowRef.current) rowRef.current.style.transform = 'translateX(0)'
    }
    startX.current = null
  }

  useEffect(() => {
    if (!isOpen && rowRef.current) {
      rowRef.current.style.transition = 'transform 0.25s ease'
      rowRef.current.style.transform = 'translateX(0)'
    }
  }, [isOpen])

  return (
    <div style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Delete zone — alleen zichtbaar tijdens swipe (anders steekt de rode tint
          uit langs de afgeronde card-randen). */}
      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: `${DELETE_THRESHOLD}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isOpen ? 'rgba(239,68,68,0.12)' : 'transparent', borderLeft: isOpen ? '1px solid rgba(239,68,68,0.2)' : 'none', transition: 'background 0.2s ease' }}>
        <button onClick={onDelete} disabled={deleting} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem', background: 'transparent', border: 'none', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', padding: '0.5rem' }}>
          {deleting ? (
            <div style={{ width: '18px', height: '18px', border: '2px solid rgba(239,68,68,0.3)', borderTopColor: '#ef4444', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          ) : (
            <Trash2 size={18} color="#ef4444" strokeWidth={2} />
          )}
          <span style={{ fontSize: '0.55rem', color: '#ef4444', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Verwijder</span>
        </button>
      </div>

      {/* Content */}
      <div ref={rowRef} style={{ position: 'relative', zIndex: 1, background: '#0a0a0a', transform: 'translateX(0)', transition: 'transform 0.25s ease', userSelect: 'none' }}
        onTouchStart={isMobile ? handleTouchStart : undefined}
        onTouchMove={isMobile ? handleTouchMove : undefined}
        onTouchEnd={isMobile ? handleTouchEnd : undefined}
        onClick={() => { if (isOpen) onSwipeClose() }}>
        {children}
      </div>
    </div>
  )
}
