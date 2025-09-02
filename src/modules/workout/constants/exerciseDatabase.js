// src/modules/workout/constants/exerciseDatabase.js
// ENHANCED VERSION - Met equipment, difficulty & smart matching

const EXERCISE_DATABASE = {
  chest: {
    compound: [
      { name: "Machine Chest Press", equipment: "machine", difficulty: "beginner", targetArea: "mid-chest" },
      { name: "Incline Dumbbell Press", equipment: "dumbbell", difficulty: "intermediate", targetArea: "upper-chest" },
      { name: "Barbell Bench Press", equipment: "barbell", difficulty: "intermediate", targetArea: "mid-chest" },
      { name: "Weighted Dips", equipment: "bodyweight", difficulty: "advanced", targetArea: "lower-chest" },
      { name: "Low-Incline Barbell Bench Press", equipment: "barbell", difficulty: "intermediate", targetArea: "upper-chest" },
      { name: "Flat Dumbbell Bench Press", equipment: "dumbbell", difficulty: "beginner", targetArea: "mid-chest" },
      { name: "Decline Bench Press", equipment: "barbell", difficulty: "advanced", targetArea: "lower-chest" },
      { name: "Close-Grip Bench Press", equipment: "barbell", difficulty: "intermediate", targetArea: "triceps-chest" },
      { name: "Push-Ups", equipment: "bodyweight", difficulty: "beginner", targetArea: "mid-chest" },
      { name: "Diamond Push-Ups", equipment: "bodyweight", difficulty: "intermediate", targetArea: "triceps-chest" },
      { name: "Wide-Grip Push-Ups", equipment: "bodyweight", difficulty: "beginner", targetArea: "outer-chest" },
      { name: "Incline Push-Ups", equipment: "bodyweight", difficulty: "beginner", targetArea: "lower-chest" },
      { name: "Decline Push-Ups", equipment: "bodyweight", difficulty: "intermediate", targetArea: "upper-chest" },
      { name: "Smith Machine Bench Press", equipment: "machine", difficulty: "beginner", targetArea: "mid-chest" },
      { name: "Chest Press (Hammer Strength)", equipment: "machine", difficulty: "beginner", targetArea: "mid-chest" }
    ],
    isolation: [
      { name: "Incline Cable Flies", equipment: "cable", difficulty: "intermediate", targetArea: "upper-chest" },
      { name: "Machine Pec Deck", equipment: "machine", difficulty: "beginner", targetArea: "mid-chest" },
      { name: "Seated Cable Fly", equipment: "cable", difficulty: "intermediate", targetArea: "mid-chest" },
      { name: "Low-to-High Cable Fly", equipment: "cable", difficulty: "intermediate", targetArea: "upper-chest" },
      { name: "High-to-Low Cable Fly", equipment: "cable", difficulty: "intermediate", targetArea: "lower-chest" },
      { name: "Dumbbell Flies", equipment: "dumbbell", difficulty: "intermediate", targetArea: "mid-chest" },
      { name: "Incline Dumbbell Flies", equipment: "dumbbell", difficulty: "intermediate", targetArea: "upper-chest" },
      { name: "Cable Crossover", equipment: "cable", difficulty: "advanced", targetArea: "mid-chest" },
      { name: "Svend Press", equipment: "plate", difficulty: "beginner", targetArea: "inner-chest" }
    ]
  },
  
  back: {
    compound: [
      { name: "Lat Pulldown", equipment: "cable", difficulty: "beginner", targetArea: "lats" },
      { name: "Wide-Grip Lat Pulldown", equipment: "cable", difficulty: "beginner", targetArea: "outer-lats" },
      { name: "Close-Grip Lat Pulldown", equipment: "cable", difficulty: "beginner", targetArea: "lower-lats" },
      { name: "Weighted Pull-Ups", equipment: "bodyweight", difficulty: "advanced", targetArea: "lats" },
      { name: "Pull-Ups", equipment: "bodyweight", difficulty: "intermediate", targetArea: "lats" },
      { name: "Chin-Ups", equipment: "bodyweight", difficulty: "intermediate", targetArea: "biceps-lats" },
      { name: "T-Bar Row (Chest-Supported)", equipment: "barbell", difficulty: "intermediate", targetArea: "mid-back" },
      { name: "Cable Row", equipment: "cable", difficulty: "beginner", targetArea: "mid-back" },
      { name: "Barbell Bent-Over Row", equipment: "barbell", difficulty: "intermediate", targetArea: "mid-back" },
      { name: "Single-Arm Dumbbell Row", equipment: "dumbbell", difficulty: "beginner", targetArea: "lats" },
      { name: "Pendlay Row", equipment: "barbell", difficulty: "advanced", targetArea: "mid-back" },
      { name: "Rack Pulls", equipment: "barbell", difficulty: "intermediate", targetArea: "traps" },
      { name: "Deadlifts", equipment: "barbell", difficulty: "advanced", targetArea: "entire-back" },
      { name: "Machine Row", equipment: "machine", difficulty: "beginner", targetArea: "mid-back" },
      { name: "Inverted Row", equipment: "bodyweight", difficulty: "beginner", targetArea: "mid-back" }
    ],
    isolation: [
      { name: "Cable Pullovers", equipment: "cable", difficulty: "intermediate", targetArea: "lats" },
      { name: "Dumbbell Pullovers", equipment: "dumbbell", difficulty: "intermediate", targetArea: "lats" },
      { name: "Straight-Arm Pulldown (Rope)", equipment: "cable", difficulty: "beginner", targetArea: "lats" },
      { name: "Straight-Arm Pulldown (Bar)", equipment: "cable", difficulty: "beginner", targetArea: "lats" },
      { name: "Face Pulls", equipment: "cable", difficulty: "beginner", targetArea: "rear-delts" },
      { name: "Single-Arm Lat Pulldown", equipment: "cable", difficulty: "intermediate", targetArea: "lats" },
      { name: "Reverse Flies", equipment: "dumbbell", difficulty: "beginner", targetArea: "rear-delts" },
      { name: "Cable Reverse Flies", equipment: "cable", difficulty: "beginner", targetArea: "rear-delts" },
      { name: "Shrugs", equipment: "dumbbell", difficulty: "beginner", targetArea: "traps" },
      { name: "Barbell Shrugs", equipment: "barbell", difficulty: "beginner", targetArea: "traps" },
      { name: "Cable Shrugs", equipment: "cable", difficulty: "beginner", targetArea: "traps" }
    ]
  },
  
  legs: {
    compound: [
      { name: "Leg Press", equipment: "machine", difficulty: "beginner", targetArea: "quads" },
      { name: "Romanian Deadlift", equipment: "barbell", difficulty: "intermediate", targetArea: "hamstrings" },
      { name: "Dumbbell Romanian Deadlift", equipment: "dumbbell", difficulty: "beginner", targetArea: "hamstrings" },
      { name: "Hip Thrust", equipment: "barbell", difficulty: "intermediate", targetArea: "glutes" },
      { name: "High-Bar Back Squat", equipment: "barbell", difficulty: "advanced", targetArea: "quads" },
      { name: "Low-Bar Back Squat", equipment: "barbell", difficulty: "advanced", targetArea: "glutes" },
      { name: "Bulgarian Split Squat", equipment: "dumbbell", difficulty: "intermediate", targetArea: "quads" },
      { name: "Hack Squat", equipment: "machine", difficulty: "intermediate", targetArea: "quads" },
      { name: "Front Squat", equipment: "barbell", difficulty: "advanced", targetArea: "quads" },
      { name: "Goblet Squat", equipment: "dumbbell", difficulty: "beginner", targetArea: "quads" },
      { name: "Walking Lunges", equipment: "dumbbell", difficulty: "intermediate", targetArea: "quads" },
      { name: "Reverse Lunges", equipment: "dumbbell", difficulty: "beginner", targetArea: "quads" },
      { name: "Step-Ups", equipment: "dumbbell", difficulty: "beginner", targetArea: "quads" },
      { name: "Box Squat", equipment: "barbell", difficulty: "intermediate", targetArea: "quads" },
      { name: "Pistol Squat", equipment: "bodyweight", difficulty: "advanced", targetArea: "quads" },
      { name: "Leg Press (Single Leg)", equipment: "machine", difficulty: "intermediate", targetArea: "quads" }
    ],
    isolation: [
      { name: "Leg Extension", equipment: "machine", difficulty: "beginner", targetArea: "quads" },
      { name: "Leg Curl", equipment: "machine", difficulty: "beginner", targetArea: "hamstrings" },
      { name: "Lying Leg Curl", equipment: "machine", difficulty: "beginner", targetArea: "hamstrings" },
      { name: "Seated Leg Curl", equipment: "machine", difficulty: "beginner", targetArea: "hamstrings" },
      { name: "Calf Raises", equipment: "machine", difficulty: "beginner", targetArea: "calves" },
      { name: "Standing Calf Raises", equipment: "machine", difficulty: "beginner", targetArea: "calves" },
      { name: "Seated Calf Raises", equipment: "machine", difficulty: "beginner", targetArea: "calves" },
      { name: "Single-Leg Leg Extension", equipment: "machine", difficulty: "intermediate", targetArea: "quads" },
      { name: "Nordic Curls", equipment: "bodyweight", difficulty: "advanced", targetArea: "hamstrings" },
      { name: "Glute Kickbacks", equipment: "cable", difficulty: "beginner", targetArea: "glutes" },
      { name: "Leg Abduction Machine", equipment: "machine", difficulty: "beginner", targetArea: "glutes" },
      { name: "Leg Adduction Machine", equipment: "machine", difficulty: "beginner", targetArea: "inner-thigh" }
    ]
  },
  
  shoulders: {
    compound: [
      { name: "Machine Shoulder Press", equipment: "machine", difficulty: "beginner", targetArea: "front-delts" },
      { name: "Dumbbell Shoulder Press", equipment: "dumbbell", difficulty: "intermediate", targetArea: "front-delts" },
      { name: "Overhead Press", equipment: "barbell", difficulty: "intermediate", targetArea: "front-delts" },
      { name: "Military Press", equipment: "barbell", difficulty: "intermediate", targetArea: "front-delts" },
      { name: "Push Press", equipment: "barbell", difficulty: "advanced", targetArea: "front-delts" },
      { name: "Seated Barbell Overhead Press", equipment: "barbell", difficulty: "intermediate", targetArea: "front-delts" },
      { name: "Arnold Press", equipment: "dumbbell", difficulty: "intermediate", targetArea: "all-delts" },
      { name: "Pike Push-Ups", equipment: "bodyweight", difficulty: "intermediate", targetArea: "front-delts" },
      { name: "Handstand Push-Ups", equipment: "bodyweight", difficulty: "advanced", targetArea: "front-delts" },
      { name: "Smith Machine Shoulder Press", equipment: "machine", difficulty: "beginner", targetArea: "front-delts" }
    ],
    isolation: [
      { name: "Cable Lateral Raises", equipment: "cable", difficulty: "beginner", targetArea: "side-delts" },
      { name: "Lean-Away Cable Lateral Raise", equipment: "cable", difficulty: "intermediate", targetArea: "side-delts" },
      { name: "Machine Lateral Raises", equipment: "machine", difficulty: "beginner", targetArea: "side-delts" },
      { name: "Dumbbell Lateral Raises", equipment: "dumbbell", difficulty: "beginner", targetArea: "side-delts" },
      { name: "Lying Incline Lateral Raise", equipment: "dumbbell", difficulty: "intermediate", targetArea: "side-delts" },
      { name: "Front Raises", equipment: "dumbbell", difficulty: "beginner", targetArea: "front-delts" },
      { name: "Cable Front Raises", equipment: "cable", difficulty: "beginner", targetArea: "front-delts" },
      { name: "Plate Front Raises", equipment: "plate", difficulty: "beginner", targetArea: "front-delts" },
      { name: "Rear Delt Flies", equipment: "dumbbell", difficulty: "beginner", targetArea: "rear-delts" },
      { name: "Cable Rear Delt Flies", equipment: "cable", difficulty: "beginner", targetArea: "rear-delts" },
      { name: "Machine Rear Delt Flies", equipment: "machine", difficulty: "beginner", targetArea: "rear-delts" }
    ]
  },
  
  biceps: {
    isolation: [
      { name: "Incline Dumbbell Curl", equipment: "dumbbell", difficulty: "intermediate", targetArea: "long-head" },
      { name: "Bayesian Cable Curl", equipment: "cable", difficulty: "intermediate", targetArea: "long-head" },
      { name: "Cable Bicep Curls", equipment: "cable", difficulty: "beginner", targetArea: "biceps" },
      { name: "Preacher Curls", equipment: "barbell", difficulty: "intermediate", targetArea: "short-head" },
      { name: "EZ-Bar Preacher Curls", equipment: "barbell", difficulty: "intermediate", targetArea: "short-head" },
      { name: "Hammer Curls", equipment: "dumbbell", difficulty: "beginner", targetArea: "brachialis" },
      { name: "Cable Hammer Curls", equipment: "cable", difficulty: "beginner", targetArea: "brachialis" },
      { name: "Barbell Curls", equipment: "barbell", difficulty: "beginner", targetArea: "biceps" },
      { name: "EZ-Bar Curls", equipment: "barbell", difficulty: "beginner", targetArea: "biceps" },
      { name: "Concentration Curls", equipment: "dumbbell", difficulty: "intermediate", targetArea: "peak" },
      { name: "Spider Curls", equipment: "barbell", difficulty: "advanced", targetArea: "short-head" },
      { name: "21s", equipment: "barbell", difficulty: "intermediate", targetArea: "biceps" },
      { name: "Drag Curls", equipment: "barbell", difficulty: "intermediate", targetArea: "long-head" },
      { name: "Machine Bicep Curls", equipment: "machine", difficulty: "beginner", targetArea: "biceps" },
      { name: "Chin-Ups (Bicep Focus)", equipment: "bodyweight", difficulty: "intermediate", targetArea: "biceps" }
    ]
  },
  
  triceps: {
    compound: [
      { name: "Close-Grip Bench Press", equipment: "barbell", difficulty: "intermediate", targetArea: "all-heads" },
      { name: "Weighted Dips", equipment: "bodyweight", difficulty: "advanced", targetArea: "all-heads" },
      { name: "Dips", equipment: "bodyweight", difficulty: "intermediate", targetArea: "all-heads" },
      { name: "Diamond Push-Ups", equipment: "bodyweight", difficulty: "intermediate", targetArea: "all-heads" },
      { name: "Close-Grip Push-Ups", equipment: "bodyweight", difficulty: "beginner", targetArea: "all-heads" }
    ],
    isolation: [
      { name: "Cable Overhead Triceps Extension", equipment: "cable", difficulty: "intermediate", targetArea: "long-head" },
      { name: "Single-Arm Overhead Cable Extension", equipment: "cable", difficulty: "intermediate", targetArea: "long-head" },
      { name: "Crossbody Cable Extension", equipment: "cable", difficulty: "intermediate", targetArea: "lateral-head" },
      { name: "Incline Skull Crushers", equipment: "barbell", difficulty: "intermediate", targetArea: "long-head" },
      { name: "Flat Skull Crushers", equipment: "barbell", difficulty: "intermediate", targetArea: "all-heads" },
      { name: "Triceps Pushdown", equipment: "cable", difficulty: "beginner", targetArea: "lateral-head" },
      { name: "Rope Pushdown", equipment: "cable", difficulty: "beginner", targetArea: "lateral-head" },
      { name: "V-Bar Pushdown", equipment: "cable", difficulty: "beginner", targetArea: "lateral-head" },
      { name: "Dumbbell Overhead Extension", equipment: "dumbbell", difficulty: "beginner", targetArea: "long-head" },
      { name: "Kickbacks", equipment: "dumbbell", difficulty: "beginner", targetArea: "lateral-head" },
      { name: "Cable Kickbacks", equipment: "cable", difficulty: "beginner", targetArea: "lateral-head" }
    ]
  },
  
  abs: {
    compound: [
      { name: "Hanging Leg Raises", equipment: "bodyweight", difficulty: "advanced", targetArea: "lower-abs" },
      { name: "Hanging Knee Raises", equipment: "bodyweight", difficulty: "intermediate", targetArea: "lower-abs" },
      { name: "Ab Wheel Rollout", equipment: "ab-wheel", difficulty: "advanced", targetArea: "entire-core" },
      { name: "Dragon Flags", equipment: "bodyweight", difficulty: "advanced", targetArea: "entire-core" },
      { name: "L-Sit", equipment: "bodyweight", difficulty: "advanced", targetArea: "entire-core" }
    ],
    isolation: [
      { name: "Cable Crunches", equipment: "cable", difficulty: "intermediate", targetArea: "upper-abs" },
      { name: "Machine Crunches", equipment: "machine", difficulty: "beginner", targetArea: "upper-abs" },
      { name: "Plank", equipment: "bodyweight", difficulty: "beginner", targetArea: "entire-core" },
      { name: "Side Plank", equipment: "bodyweight", difficulty: "intermediate", targetArea: "obliques" },
      { name: "Russian Twists", equipment: "bodyweight", difficulty: "intermediate", targetArea: "obliques" },
      { name: "Bicycle Crunches", equipment: "bodyweight", difficulty: "beginner", targetArea: "obliques" },
      { name: "Dead Bug", equipment: "bodyweight", difficulty: "beginner", targetArea: "entire-core" },
      { name: "Bird Dog", equipment: "bodyweight", difficulty: "beginner", targetArea: "lower-back" },
      { name: "Mountain Climbers", equipment: "bodyweight", difficulty: "beginner", targetArea: "entire-core" },
      { name: "Cable Woodchoppers", equipment: "cable", difficulty: "intermediate", targetArea: "obliques" },
      { name: "Leg Raises", equipment: "bodyweight", difficulty: "intermediate", targetArea: "lower-abs" }
    ]
  },
  
  glutes: {
    compound: [
      { name: "Hip Thrust", equipment: "barbell", difficulty: "intermediate", targetArea: "glutes" },
      { name: "Barbell Glute Bridge", equipment: "barbell", difficulty: "beginner", targetArea: "glutes" },
      { name: "Single-Leg Hip Thrust", equipment: "bodyweight", difficulty: "intermediate", targetArea: "glutes" },
      { name: "Romanian Deadlift", equipment: "barbell", difficulty: "intermediate", targetArea: "glutes-hamstrings" },
      { name: "Sumo Deadlift", equipment: "barbell", difficulty: "intermediate", targetArea: "glutes" },
      { name: "Good Mornings", equipment: "barbell", difficulty: "intermediate", targetArea: "glutes-hamstrings" }
    ],
    isolation: [
      { name: "Cable Pull-Through", equipment: "cable", difficulty: "beginner", targetArea: "glutes" },
      { name: "Glute Kickbacks", equipment: "cable", difficulty: "beginner", targetArea: "glutes" },
      { name: "Machine Glute Kickbacks", equipment: "machine", difficulty: "beginner", targetArea: "glutes" },
      { name: "Clamshells", equipment: "band", difficulty: "beginner", targetArea: "glute-medius" },
      { name: "Fire Hydrants", equipment: "bodyweight", difficulty: "beginner", targetArea: "glute-medius" },
      { name: "Donkey Kicks", equipment: "bodyweight", difficulty: "beginner", targetArea: "glutes" },
      { name: "Cable Hip Abduction", equipment: "cable", difficulty: "beginner", targetArea: "glute-medius" },
      { name: "Banded Side Steps", equipment: "band", difficulty: "beginner", targetArea: "glute-medius" }
    ]
  }
}

// Equipment categories
const EQUIPMENT_TYPES = {
  'bodyweight': 'Geen equipment',
  'dumbbell': 'Dumbbells',
  'barbell': 'Barbell',
  'cable': 'Cable station',
  'machine': 'Machine',
  'band': 'Weerstandsband',
  'plate': 'Weight plate',
  'ab-wheel': 'Ab wheel'
}

// Difficulty levels
const DIFFICULTY_LEVELS = {
  'beginner': { label: 'Beginner', color: '#10b981' },
  'intermediate': { label: 'Gevorderd', color: '#f97316' },
  'advanced': { label: 'Expert', color: '#dc2626' }
}

// Helper functions
export const getMuscleGroups = () => Object.keys(EXERCISE_DATABASE)

export const getExercisesForMuscle = (muscle, filters = {}) => {
  const muscleData = EXERCISE_DATABASE[muscle.toLowerCase()]
  if (!muscleData) return []
  
  let exercises = []
  
  // Get by type
  if (filters.type === 'compound' && muscleData.compound) {
    exercises = [...muscleData.compound]
  } else if (filters.type === 'isolation' && muscleData.isolation) {
    exercises = [...muscleData.isolation]
  } else {
    if (muscleData.compound) exercises.push(...muscleData.compound)
    if (muscleData.isolation) exercises.push(...muscleData.isolation)
  }
  
  // Filter by equipment
  if (filters.equipment) {
    exercises = exercises.filter(ex => ex.equipment === filters.equipment)
  }
  
  // Filter by difficulty
  if (filters.difficulty) {
    exercises = exercises.filter(ex => ex.difficulty === filters.difficulty)
  }
  
  // Filter by target area
  if (filters.targetArea) {
    exercises = exercises.filter(ex => ex.targetArea === filters.targetArea)
  }
  
  return exercises
}

export const searchExercises = (query, filters = {}) => {
  const results = []
  const searchTerm = query.toLowerCase()
  
  Object.entries(EXERCISE_DATABASE).forEach(([muscle, exercises]) => {
    const checkExercise = (ex, type) => {
      const nameMatch = ex.name.toLowerCase().includes(searchTerm)
      const equipmentMatch = !filters.equipment || ex.equipment === filters.equipment
      const difficultyMatch = !filters.difficulty || ex.difficulty === filters.difficulty
      
      if (nameMatch && equipmentMatch && difficultyMatch) {
        results.push({ ...ex, muscle, type })
      }
    }
    
    if (exercises.compound) {
      exercises.compound.forEach(ex => checkExercise(ex, 'compound'))
    }
    if (exercises.isolation) {
      exercises.isolation.forEach(ex => checkExercise(ex, 'isolation'))
    }
  })
  
  return results
}

// Get similar exercises based on equipment and target
export const getSimilarExercises = (exercise, muscleGroup) => {
  const allExercises = getExercisesForMuscle(muscleGroup)
  
  // Score each exercise by similarity
  const scored = allExercises.map(ex => {
    let score = 0
    
    // Same equipment = +3 points
    if (ex.equipment === exercise.equipment) score += 3
    
    // Same difficulty = +2 points
    if (ex.difficulty === exercise.difficulty) score += 2
    
    // Same target area = +2 points
    if (ex.targetArea === exercise.targetArea) score += 2
    
    // Same type (compound/isolation) = +1 point
    if (ex.type === exercise.type) score += 1
    
    return { ...ex, score }
  })
  
  // Sort by score and return top matches
  return scored
    .filter(ex => ex.name !== exercise.name) // Exclude current exercise
    .sort((a, b) => b.score - a.score)
    .slice(0, 10) // Return top 10 matches
}

export { EQUIPMENT_TYPES, DIFFICULTY_LEVELS }
export default EXERCISE_DATABASE
