// src/modules/workout/components/AlternativeExercises.jsx
import { useState, useEffect, useRef, useMemo } from 'react'
import { X, Activity, Dumbbell } from 'lucide-react'
import ExerciseSearchBar from './alternative-exercises/ExerciseSearchBar'
import ExerciseList from './alternative-exercises/ExerciseList'

/**
 * ALTERNATIVE EXERCISES MODAL
 * 
 * Complete rewrite with:
 * - Search by exercise name
 * - Muscle group dropdown (ALL + specific)
 * - Equipment filters
 * - Difficulty filters
 * - Cross-muscle searching
 * - Mobile swipe-to-close
 * - Premium glassmorphic design
 */

export default function AlternativeExercises({ exercise, onSelect, onClose, db }) {
  // State
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMuscle, setSelectedMuscle] = useState('all')
  const [alternatives, setAlternatives] = useState([])
  const [allExercises, setAllExercises] = useState([]) // Cache all exercises
  const [loading, setLoading] = useState(true)
  
  // Mobile detection & refs
  const isMobile = window.innerWidth <= 768
  const modalRef = useRef(null)
  const startY = useRef(0)
  const currentY = useRef(0)
  
  // Load exercises ONCE on mount
  useEffect(() => {
    loadAllExercises()
  }, [])
  
  // Filter client-side when filters change
  useEffect(() => {
    if (allExercises.length > 0) {
      applyFilters()
    }
  }, [selectedMuscle, allExercises])
  
  /**
   * LOAD ALL EXERCISES (once on mount)
   */
  const loadAllExercises = async () => {
    setLoading(true)
    
    try {
      console.log('🔍 Loading ALL exercises from database (once)...')
      
      // Get all exercises from database
      let exercises = []
      
      // PRIMARY METHOD: getAllExercisesForSwap (proven to work)
      if (db?.getAllExercisesForSwap) {
        exercises = await db.getAllExercisesForSwap()
      }
      // FALLBACK: getAlternativeExercises
      else if (db?.getAlternativeExercises && exercise?.primairSpieren) {
        exercises = await db.getAlternativeExercises(exercise.primairSpieren, exercise.name)
      }
      // LAST RESORT: Hardcoded
      else {
        exercises = getHardcodedExercises()
      }
      
      console.log(`✅ Loaded ${exercises.length} exercises`)
      
      // Calculate similarity scores ONCE
      const withScores = exercises.map(ex => ({
        ...ex,
        similarity: calculateSimilarity(ex, exercise)
      }))
      
      setAllExercises(withScores)
      
    } catch (error) {
      console.error('❌ Error loading exercises:', error)
      setAllExercises([])
    } finally {
      setLoading(false)
    }
  }
  
  /**
   * APPLY FILTERS (client-side, fast!)
   */
  const applyFilters = () => {
    let filtered = [...allExercises]
    
    console.log(`🔍 Applying filters to ${filtered.length} exercises`)
    
    // Filter by muscle group
    if (selectedMuscle !== 'all') {
      const before = filtered.length
      filtered = filtered.filter(ex => {
        const muscle = (
          ex.muscle || 
          ex.muscleGroup || 
          ex.primairSpieren || 
          ''
        ).toLowerCase()
        const target = selectedMuscle.toLowerCase()
        
        if (muscle === target) return true
        if (target === 'arms' && (muscle.includes('tricep') || muscle.includes('bicep'))) return true
        
        return false
      })
      console.log(`  🔍 Muscle "${selectedMuscle}": ${before} → ${filtered.length}`)
    }
    
    // Sort by similarity
    filtered.sort((a, b) => (b.similarity || 0) - (a.similarity || 0))
    
    console.log(`✅ Filtered result: ${filtered.length} exercises`)
    setAlternatives(filtered)
  }
  
  /**
   * CALCULATE SIMILARITY
   * Scores exercises based on similarity to current exercise
   */
  const calculateSimilarity = (candidate, current) => {
    let score = 0
    
    // Same muscle group = +30 points
    if (candidate.muscleGroup === current.muscleGroup || 
        candidate.primairSpieren === current.primairSpieren) {
      score += 30
    }
    
    // Same equipment = +20 points
    if (candidate.equipment === current.equipment) {
      score += 20
    }
    
    // Same difficulty = +15 points
    if (candidate.difficulty === current.difficulty) {
      score += 15
    }
    
    // Same type (compound/isolation) = +10 points
    if (candidate.type === current.type) {
      score += 10
    }
    
    // Exclude exact same exercise
    if (candidate.name === current.name) {
      return 0
    }
    
    return score
  }
  
  /**
   * FILTER BY SEARCH TERM (Memoized for performance)
   * Client-side search on name
   */
  const filteredAlternatives = useMemo(() => {
    if (!searchTerm.trim()) return alternatives
    
    const query = searchTerm.toLowerCase()
    return alternatives.filter(ex =>
      ex.name?.toLowerCase().includes(query)
    )
  }, [alternatives, searchTerm])
  
  /**
   * HANDLE SELECT EXERCISE
   */
  const handleSelectExercise = (selectedExercise) => {
    console.log('✅ Exercise selected:', selectedExercise.name)
    onSelect(exercise, selectedExercise)
    onClose()
  }
  
  /**
   * SWIPE TO CLOSE - Touch Handlers
   */
  const handleTouchStart = (e) => {
    if (!isMobile) return
    startY.current = e.touches[0].clientY
  }
  
  const handleTouchMove = (e) => {
    if (!isMobile || !modalRef.current) return
    currentY.current = e.touches[0].clientY
    const deltaY = currentY.current - startY.current
    
    if (deltaY > 0) {
      modalRef.current.style.transform = `translateY(${deltaY}px)`
      modalRef.current.style.opacity = 1 - (deltaY / 300)
    }
  }
  
  const handleTouchEnd = () => {
    if (!isMobile || !modalRef.current) return
    const deltaY = currentY.current - startY.current
    
    if (deltaY > 100) {
      onClose()
    } else {
      modalRef.current.style.transform = 'translateY(0)'
      modalRef.current.style.opacity = 1
    }
  }
  
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.95)',
        backdropFilter: 'blur(20px)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'flex-end',
        animation: 'fadeIn 0.2s ease'
      }}
      onClick={onClose}
    >
      <div
        ref={modalRef}
        style={{
          width: '100%',
          maxHeight: isMobile ? '92vh' : '85vh',
          background: 'linear-gradient(180deg, #171717 0%, #0a0a0a 100%)',
          borderRadius: isMobile ? '24px 24px 0 0' : '24px',
          padding: isMobile ? '1rem 0.875rem' : '1.25rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 -10px 40px rgba(249, 115, 22, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(249, 115, 22, 0.2)',
          borderBottom: 'none',
          animation: 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Shine overlay */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '40%',
          background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.04) 0%, transparent 100%)',
          pointerEvents: 'none',
          zIndex: 1
        }} />
        
        {/* Handle Bar */}
        {isMobile && (
          <div style={{
            width: '48px',
            height: '5px',
            background: 'rgba(249, 115, 22, 0.3)',
            borderRadius: '3px',
            margin: '0 auto 1.25rem',
            cursor: 'grab',
            boxShadow: '0 0 8px rgba(249, 115, 22, 0.2)'
          }} />
        )}
        
        {/* COMPACT HEADER */}
        <div style={{
          paddingBottom: isMobile ? '0.75rem' : '0.875rem',
          marginBottom: isMobile ? '0.75rem' : '0.875rem',
          borderBottom: '1px solid rgba(249, 115, 22, 0.15)',
          position: 'relative',
          zIndex: 2
        }}>
          {/* Title + Close in one row */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.625rem'
          }}>
            <h3 style={{
              fontSize: isMobile ? '0.95rem' : '1.05rem',
              fontWeight: '800',
              color: '#fff',
              margin: 0,
              textTransform: 'uppercase',
              letterSpacing: '0.03em'
            }}>
              Kies Alternatieve Oefening
            </h3>
            
            <button
              onClick={onClose}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                padding: 0
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'
                e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
              }}
            >
              <X size={16} color="rgba(255, 255, 255, 0.7)" strokeWidth={2.5} />
            </button>
          </div>
          
          {/* Current exercise - compact inline */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 0.75rem',
            background: 'rgba(249, 115, 22, 0.08)',
            border: '1px solid rgba(249, 115, 22, 0.2)',
            borderRadius: '8px'
          }}>
            <Activity 
              size={14} 
              color="#f97316"
              strokeWidth={2.5}
            />
            <span style={{
              fontSize: isMobile ? '0.7rem' : '0.75rem',
              color: 'rgba(255, 255, 255, 0.5)',
              fontWeight: '600'
            }}>
              Huidig:
            </span>
            <span style={{
              fontSize: isMobile ? '0.8rem' : '0.85rem',
              color: '#f97316',
              fontWeight: '700',
              flex: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {exercise.name}
            </span>
          </div>
        </div>
        
        {/* Search Bar - compact */}
        <div style={{
          marginBottom: isMobile ? '0.625rem' : '0.75rem',
          position: 'relative',
          zIndex: 2
        }}>
          <ExerciseSearchBar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            selectedMuscle={selectedMuscle}
            onMuscleChange={setSelectedMuscle}
            isMobile={isMobile}
          />
        </div>
        
        {/* Exercise List */}
        <ExerciseList
          exercises={filteredAlternatives}
          onSelectExercise={handleSelectExercise}
          loading={loading}
          isMobile={isMobile}
        />
      </div>
      
      {/* Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        
        /* Hide scrollbar */
        *::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  )
}

/**
 * HARDCODED EXERCISE DATABASE
 * Fallback if database doesn't have exercises
 */
function getHardcodedExercises() {
  return [
    // CHEST
    { name: 'Barbell Bench Press', muscleGroup: 'chest', equipment: 'barbell', difficulty: 'intermediate', type: 'compound' },
    { name: 'Dumbbell Bench Press', muscleGroup: 'chest', equipment: 'dumbbell', difficulty: 'intermediate', type: 'compound' },
    { name: 'Incline Barbell Press', muscleGroup: 'chest', equipment: 'barbell', difficulty: 'intermediate', type: 'compound' },
    { name: 'Incline Dumbbell Press', muscleGroup: 'chest', equipment: 'dumbbell', difficulty: 'intermediate', type: 'compound' },
    { name: 'Cable Chest Fly', muscleGroup: 'chest', equipment: 'cable', difficulty: 'beginner', type: 'isolation' },
    { name: 'Dumbbell Fly', muscleGroup: 'chest', equipment: 'dumbbell', difficulty: 'beginner', type: 'isolation' },
    { name: 'Push-ups', muscleGroup: 'chest', equipment: 'bodyweight', difficulty: 'beginner', type: 'compound' },
    
    // BACK
    { name: 'Barbell Row', muscleGroup: 'back', equipment: 'barbell', difficulty: 'intermediate', type: 'compound' },
    { name: 'Dumbbell Row', muscleGroup: 'back', equipment: 'dumbbell', difficulty: 'intermediate', type: 'compound' },
    { name: 'Lat Pulldown', muscleGroup: 'back', equipment: 'cable', difficulty: 'beginner', type: 'compound' },
    { name: 'Pull-ups', muscleGroup: 'back', equipment: 'bodyweight', difficulty: 'advanced', type: 'compound' },
    { name: 'Seated Cable Row', muscleGroup: 'back', equipment: 'cable', difficulty: 'beginner', type: 'compound' },
    { name: 'Deadlift', muscleGroup: 'back', equipment: 'barbell', difficulty: 'advanced', type: 'compound' },
    
    // SHOULDERS
    { name: 'Overhead Press', muscleGroup: 'shoulders', equipment: 'barbell', difficulty: 'intermediate', type: 'compound' },
    { name: 'Dumbbell Shoulder Press', muscleGroup: 'shoulders', equipment: 'dumbbell', difficulty: 'intermediate', type: 'compound' },
    { name: 'Lateral Raises', muscleGroup: 'shoulders', equipment: 'dumbbell', difficulty: 'beginner', type: 'isolation' },
    { name: 'Front Raises', muscleGroup: 'shoulders', equipment: 'dumbbell', difficulty: 'beginner', type: 'isolation' },
    { name: 'Face Pulls', muscleGroup: 'shoulders', equipment: 'cable', difficulty: 'beginner', type: 'isolation' },
    
    // ARMS - TRICEPS
    { name: 'Close-Grip Bench Press', muscleGroup: 'triceps', equipment: 'barbell', difficulty: 'intermediate', type: 'compound' },
    { name: 'Tricep Dips', muscleGroup: 'triceps', equipment: 'bodyweight', difficulty: 'intermediate', type: 'compound' },
    { name: 'Overhead Tricep Extension', muscleGroup: 'triceps', equipment: 'dumbbell', difficulty: 'beginner', type: 'isolation' },
    { name: 'Tricep Pushdown', muscleGroup: 'triceps', equipment: 'cable', difficulty: 'beginner', type: 'isolation' },
    { name: 'Skull Crushers', muscleGroup: 'triceps', equipment: 'barbell', difficulty: 'intermediate', type: 'isolation' },
    
    // ARMS - BICEPS
    { name: 'Barbell Curl', muscleGroup: 'biceps', equipment: 'barbell', difficulty: 'beginner', type: 'isolation' },
    { name: 'Dumbbell Curl', muscleGroup: 'biceps', equipment: 'dumbbell', difficulty: 'beginner', type: 'isolation' },
    { name: 'Hammer Curl', muscleGroup: 'biceps', equipment: 'dumbbell', difficulty: 'beginner', type: 'isolation' },
    { name: 'Cable Curl', muscleGroup: 'biceps', equipment: 'cable', difficulty: 'beginner', type: 'isolation' },
    { name: 'Preacher Curl', muscleGroup: 'biceps', equipment: 'dumbbell', difficulty: 'intermediate', type: 'isolation' },
    
    // LEGS
    { name: 'Barbell Squat', muscleGroup: 'legs', equipment: 'barbell', difficulty: 'intermediate', type: 'compound' },
    { name: 'Front Squat', muscleGroup: 'legs', equipment: 'barbell', difficulty: 'advanced', type: 'compound' },
    { name: 'Leg Press', muscleGroup: 'legs', equipment: 'machine', difficulty: 'beginner', type: 'compound' },
    { name: 'Romanian Deadlift', muscleGroup: 'legs', equipment: 'barbell', difficulty: 'intermediate', type: 'compound' },
    { name: 'Leg Extension', muscleGroup: 'legs', equipment: 'machine', difficulty: 'beginner', type: 'isolation' },
    { name: 'Leg Curl', muscleGroup: 'legs', equipment: 'machine', difficulty: 'beginner', type: 'isolation' },
    { name: 'Bulgarian Split Squat', muscleGroup: 'legs', equipment: 'dumbbell', difficulty: 'intermediate', type: 'compound' },
    
    // ABS
    { name: 'Plank', muscleGroup: 'abs', equipment: 'bodyweight', difficulty: 'beginner', type: 'compound' },
    { name: 'Crunches', muscleGroup: 'abs', equipment: 'bodyweight', difficulty: 'beginner', type: 'isolation' },
    { name: 'Cable Crunch', muscleGroup: 'abs', equipment: 'cable', difficulty: 'intermediate', type: 'isolation' },
    { name: 'Hanging Leg Raise', muscleGroup: 'abs', equipment: 'bodyweight', difficulty: 'advanced', type: 'isolation' },
    { name: 'Russian Twists', muscleGroup: 'abs', equipment: 'bodyweight', difficulty: 'beginner', type: 'isolation' }
  ]
}
