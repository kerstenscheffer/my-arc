import { useState, useEffect } from 'react'

// ===== SPECIFIC GOALS SYSTEM =====
const SPECIFIC_GOALS = {
  // Strength Specialization
  bench_strength: {
    name: "Bench Press Strength",
    description: "Focus on increasing bench press 1RM",
    priorityExercises: ["Barbell Bench Press", "Pause Barbell Bench Press", "Close-Grip Barbell Bench Press", "Incline Dumbbell Press"],
    volumeBonus: { chest: 4, triceps: 2 },
    repRangeOverride: { compound: [3, 6], isolation: [6, 8] }
  },
  squat_strength: {
    name: "Squat Strength", 
    description: "Focus on increasing squat 1RM",
    priorityExercises: ["High-Bar Back Squat", "Front Squat", "Leg Press", "Bulgarian Split Squat"],
    volumeBonus: { legs: 4 },
    repRangeOverride: { compound: [3, 6], isolation: [6, 8] }
  },
  deadlift_strength: {
    name: "Deadlift Strength",
    description: "Focus on increasing deadlift 1RM", 
    priorityExercises: ["Romanian Deadlift", "Trap Bar Deadlift", "Barbell Bent-Over Row"],
    volumeBonus: { back: 3, legs: 3 },
    repRangeOverride: { compound: [3, 6], isolation: [6, 8] }
  },
  lat_width: {
    name: "Lat Width Development",
    description: "Maximize lat width for V-taper",
    priorityExercises: ["Weighted Pull-Ups", "Lat Pulldown", "Cable Pullovers"],
    volumeBonus: { back: 6 },
    repRangeOverride: { compound: [8, 12], isolation: [12, 15] }
  },
  shoulder_width: {
    name: "Shoulder Width (V-Shape)",
    description: "Build massive lateral delts for shoulder width",
    priorityExercises: ["Cable Lateral Raises", "Lean-Away Cable Lateral Raise", "Machine Lateral Raises"],
    volumeBonus: { shoulders: 8 },
    repRangeOverride: { compound: [8, 12], isolation: [12, 20] }
  },
  tricep_size: {
    name: "Tricep Mass",
    description: "Maximize tricep size for arm development",
    priorityExercises: ["Cable Overhead Triceps Extension", "Incline Skull Crushers", "Crossbody Cable Extension"],
    volumeBonus: { triceps: 6 },
    repRangeOverride: { compound: [8, 12], isolation: [10, 15] }
  },
  bicep_peaks: {
    name: "Bicep Peaks", 
    description: "Build impressive bicep peaks and size",
    priorityExercises: ["Incline Dumbbell Curl", "Bayesian Cable Curl", "Preacher Curls"],
    volumeBonus: { biceps: 6 },
    repRangeOverride: { compound: [8, 12], isolation: [10, 15] }
  }
}

// ===== ENHANCED EXERCISE DATABASE =====
const exerciseDatabase = {
  chest: {
    compound: [
      { name: "Machine Chest Press", equipment: "machine", stretch: true, painFree: true, priority: 1, ratings: { strength: 5, hypertrophy: 5, personal: 5 } },
      { name: "Incline Dumbbell Press", equipment: "dumbbells", stretch: true, painFree: true, priority: 2, ratings: { strength: 8, hypertrophy: 8, personal: 8 } },
      { name: "Barbell Bench Press", equipment: "barbell", stretch: false, painFree: false, priority: 3, ratings: { strength: 10, hypertrophy: 8, personal: 10 } },
      { name: "Weighted Dips", equipment: "bodyweight", stretch: true, painFree: false, priority: 4, ratings: { strength: 9, hypertrophy: 9, personal: 7 } },
      { name: "Low-Incline Barbell Bench Press", equipment: "barbell", stretch: true, painFree: true, priority: 2, ratings: { strength: 9, hypertrophy: 9, personal: 9 } },
      { name: "Flat Dumbbell Bench Press", equipment: "dumbbells", stretch: true, painFree: true, priority: 3, ratings: { strength: 8, hypertrophy: 8, personal: 8 } }
    ],
    isolation: [
      { name: "Incline Cable Flies", equipment: "cables", stretch: true, painFree: true, priority: 1, ratings: { strength: 8, hypertrophy: 10, personal: 8 } },
      { name: "Machine Pec Deck", equipment: "machine", stretch: true, painFree: true, priority: 2, ratings: { strength: 8, hypertrophy: 10, personal: 8 } },
      { name: "Seated Cable Fly", equipment: "cables", stretch: true, painFree: true, priority: 2, ratings: { strength: 10, hypertrophy: 10, personal: 10 } },
      { name: "Low-to-High Cable Fly", equipment: "cables", stretch: true, painFree: true, priority: 2, ratings: { strength: 8, hypertrophy: 10, personal: 10 } },
      { name: "Dumbbell Flies", equipment: "dumbbells", stretch: true, painFree: true, priority: 3, ratings: { strength: 5, hypertrophy: 7, personal: 7 } }
    ]
  },
  back: {
    compound: [
      { name: "Lat Pulldown", equipment: "cables", stretch: true, painFree: true, priority: 1, ratings: { strength: 8, hypertrophy: 9, personal: 9 } },
      { name: "Weighted Pull-Ups", equipment: "bodyweight", stretch: true, painFree: true, priority: 1, ratings: { strength: 10, hypertrophy: 10, personal: 10 } },
      { name: "T-Bar Row (Chest-Supported)", equipment: "machine", stretch: true, painFree: true, priority: 2, ratings: { strength: 8, hypertrophy: 10, personal: 9 } },
      { name: "Cable Row", equipment: "cables", stretch: true, painFree: true, priority: 3, ratings: { strength: 7, hypertrophy: 8, personal: 8 } },
      { name: "Barbell Bent-Over Row", equipment: "barbell", stretch: true, painFree: false, priority: 3, ratings: { strength: 9, hypertrophy: 8, personal: 7 } },
      { name: "Single-Arm Dumbbell Row", equipment: "dumbbells", stretch: true, painFree: true, priority: 4, ratings: { strength: 8, hypertrophy: 8, personal: 8 } }
    ],
    isolation: [
      { name: "Cable Pullovers", equipment: "cables", stretch: true, painFree: true, priority: 1, ratings: { strength: 6, hypertrophy: 9, personal: 9 } },
      { name: "Straight-Arm Pulldown (Rope)", equipment: "cables", stretch: true, painFree: true, priority: 1, ratings: { strength: 5, hypertrophy: 8, personal: 8 } },
      { name: "Face Pulls", equipment: "cables", stretch: false, painFree: true, priority: 3, ratings: { strength: 5, hypertrophy: 7, personal: 7 } },
      { name: "Single-Arm Lat Pulldown", equipment: "cables", stretch: true, painFree: true, priority: 2, ratings: { strength: 7, hypertrophy: 8, personal: 8 } }
    ]
  },
  shoulders: {
    compound: [
      { name: "Machine Shoulder Press", equipment: "machine", stretch: false, painFree: true, priority: 1, ratings: { strength: 8, hypertrophy: 8, personal: 8 } },
      { name: "Dumbbell Shoulder Press", equipment: "dumbbells", stretch: false, painFree: true, priority: 2, ratings: { strength: 8, hypertrophy: 8, personal: 8 } },
      { name: "Overhead Press", equipment: "barbell", stretch: false, painFree: false, priority: 3, ratings: { strength: 9, hypertrophy: 7, personal: 7 } },
      { name: "Seated Barbell Overhead Press", equipment: "barbell", stretch: false, painFree: true, priority: 2, ratings: { strength: 9, hypertrophy: 7, personal: 7 } }
    ],
    isolation: [
      { name: "Cable Lateral Raises", equipment: "cables", stretch: true, painFree: true, priority: 1, ratings: { strength: 8, hypertrophy: 10, personal: 10 } },
      { name: "Lean-Away Cable Lateral Raise", equipment: "cables", stretch: true, painFree: true, priority: 1, ratings: { strength: 5, hypertrophy: 10, personal: 10 } },
      { name: "Machine Lateral Raises", equipment: "machine", stretch: true, painFree: true, priority: 2, ratings: { strength: 5, hypertrophy: 9, personal: 9 } },
      { name: "Dumbbell Lateral Raises", equipment: "dumbbells", stretch: false, painFree: true, priority: 3, ratings: { strength: 5, hypertrophy: 7, personal: 7 } },
      { name: "Lying Incline Lateral Raise", equipment: "dumbbells", stretch: true, painFree: true, priority: 2, ratings: { strength: 5, hypertrophy: 9, personal: 9 } }
    ]
  },
  legs: {
    compound: [
      { name: "Leg Press", equipment: "machine", stretch: true, painFree: true, priority: 1, ratings: { strength: 8, hypertrophy: 9, personal: 9 } },
      { name: "Romanian Deadlift", equipment: "barbell", stretch: true, painFree: true, priority: 2, ratings: { strength: 9, hypertrophy: 10, personal: 10 } },
      { name: "Hip Thrust", equipment: "barbell", stretch: true, painFree: true, priority: 3, ratings: { strength: 8, hypertrophy: 9, personal: 9 } },
      { name: "High-Bar Back Squat", equipment: "barbell", stretch: true, painFree: false, priority: 2, ratings: { strength: 9, hypertrophy: 8, personal: 7 } },
      { name: "Bulgarian Split Squat", equipment: "dumbbells", stretch: true, painFree: true, priority: 4, ratings: { strength: 7, hypertrophy: 8, personal: 8 } },
      { name: "Hack Squat", equipment: "machine", stretch: true, painFree: true, priority: 1, ratings: { strength: 8, hypertrophy: 9, personal: 9 } }
    ],
    isolation: [
      { name: "Leg Extension", equipment: "machine", stretch: true, painFree: true, priority: 1, ratings: { strength: 5, hypertrophy: 9, personal: 9 } },
      { name: "Leg Curl", equipment: "machine", stretch: true, painFree: true, priority: 2, ratings: { strength: 5, hypertrophy: 9, personal: 9 } },
      { name: "Calf Raises", equipment: "machine", stretch: true, painFree: true, priority: 3, ratings: { strength: 6, hypertrophy: 7, personal: 7 } },
      { name: "Single-Leg Leg Extension", equipment: "machine", stretch: true, painFree: true, priority: 1, ratings: { strength: 5, hypertrophy: 8, personal: 8 } }
    ]
  },
  biceps: {
    compound: [],
    isolation: [
      { name: "Incline Dumbbell Curl", equipment: "dumbbells", stretch: true, painFree: true, priority: 1, ratings: { strength: 5, hypertrophy: 10, personal: 10 } },
      { name: "Bayesian Cable Curl", equipment: "cables", stretch: true, painFree: true, priority: 1, ratings: { strength: 5, hypertrophy: 10, personal: 10 } },
      { name: "Cable Bicep Curls", equipment: "cables", stretch: true, painFree: true, priority: 1, ratings: { strength: 5, hypertrophy: 9, personal: 9 } },
      { name: "Preacher Curls", equipment: "dumbbells", stretch: true, painFree: true, priority: 2, ratings: { strength: 6, hypertrophy: 9, personal: 9 } },
      { name: "Hammer Curls", equipment: "dumbbells", stretch: false, painFree: true, priority: 3, ratings: { strength: 6, hypertrophy: 8, personal: 8 } },
      { name: "Barbell Curls", equipment: "barbell", stretch: false, painFree: true, priority: 4, ratings: { strength: 7, hypertrophy: 8, personal: 7 } }
    ]
  },
  triceps: {
    compound: [
      { name: "Close-Grip Bench Press", equipment: "barbell", stretch: false, painFree: false, priority: 2, ratings: { strength: 8, hypertrophy: 6, personal: 6 } },
      { name: "Weighted Dips", equipment: "bodyweight", stretch: true, painFree: false, priority: 1, ratings: { strength: 9, hypertrophy: 9, personal: 7 } }
    ],
    isolation: [
      { name: "Cable Overhead Triceps Extension", equipment: "cables", stretch: true, painFree: true, priority: 1, ratings: { strength: 5, hypertrophy: 10, personal: 10 } },
      { name: "Single-Arm Overhead Cable Extension", equipment: "cables", stretch: true, painFree: true, priority: 1, ratings: { strength: 5, hypertrophy: 9, personal: 9 } },
      { name: "Crossbody Cable Extension", equipment: "cables", stretch: true, painFree: true, priority: 1, ratings: { strength: 5, hypertrophy: 9, personal: 9 } },
      { name: "Incline Skull Crushers", equipment: "barbell", stretch: true, painFree: true, priority: 2, ratings: { strength: 6, hypertrophy: 9, personal: 9 } },
      { name: "Triceps Pushdown", equipment: "cables", stretch: false, painFree: true, priority: 2, ratings: { strength: 6, hypertrophy: 8, personal: 8 } },
      { name: "Dumbbell Overhead Extension", equipment: "dumbbells", stretch: true, painFree: true, priority: 3, ratings: { strength: 5, hypertrophy: 9, personal: 9 } }
    ]
  }
}

// ===== VOLUME GUIDELINES =====
const volumeGuidelines = {
  beginner: {
    chest: { min: 8, max: 10 }, back: { min: 8, max: 10 }, shoulders: { min: 8, max: 10 },
    legs: { min: 8, max: 10 }, biceps: { min: 8, max: 10 }, triceps: { min: 8, max: 10 }
  },
  intermediate: {
    chest: { min: 10, max: 14 }, back: { min: 10, max: 14 }, shoulders: { min: 12, max: 16 },
    legs: { min: 12, max: 16 }, biceps: { min: 10, max: 14 }, triceps: { min: 10, max: 14 }
  },
  advanced: {
    chest: { min: 12, max: 16 }, back: { min: 12, max: 16 }, shoulders: { min: 14, max: 18 },
    legs: { min: 14, max: 18 }, biceps: { min: 12, max: 16 }, triceps: { min: 12, max: 16 }
  }
}

// ===== SPLIT TEMPLATES =====
const splitTemplates = {
  3: [
    { name: "Push/Pull/Legs", type: "ppl", days: ["Push", "Pull", "Legs"] },
    { name: "Full Body", type: "full_body", days: ["Full Body A", "Full Body B", "Full Body C"] },
    { name: "Upper/Lower + Full", type: "upper_lower", days: ["Upper", "Lower", "Full Body"] }
  ],
  4: [
    { name: "Upper/Lower", type: "upper_lower", days: ["Upper A", "Lower A", "Upper B", "Lower B"] },
    { name: "Arnold Split", type: "arnold", days: ["Chest/Back", "Shoulders/Arms", "Legs", "Chest/Back"] },
    { name: "Push/Pull/Legs + Upper", type: "ppl", days: ["Push", "Pull", "Legs", "Upper"] }
  ],
  5: [
    { name: "Push/Pull/Legs + Upper/Lower", type: "ppl", days: ["Push", "Pull", "Legs", "Upper", "Lower"] },
    { name: "Bro Split", type: "bro", days: ["Chest", "Back", "Shoulders", "Arms", "Legs"] }
  ],
  6: [
    { name: "Push/Pull/Legs x2", type: "ppl_x2", days: ["Push A", "Pull A", "Legs A", "Push B", "Pull B", "Legs B"] },
    { name: "Arnold Split x2", type: "arnold", days: ["Chest/Back", "Shoulders/Arms", "Legs", "Chest/Back", "Shoulders/Arms", "Legs"] }
  ]
}

// ===== AI SCHEMA GENERATOR CLASS =====
class AISchemaGenerator {
  constructor() {
    this.exerciseDatabase = exerciseDatabase
    this.volumeGuidelines = volumeGuidelines
    this.splitTemplates = splitTemplates
    this.specificGoals = SPECIFIC_GOALS
  }

  generateSchema(clientData, options = {}) {
    console.log('🧠 AI generating schema for:', clientData)
    console.log('🎯 Specific goal:', clientData.specificGoal || 'None')
    
    const split = this.determineSplit(clientData)
    const weekStructure = this.generateWeekStructure(clientData, split, options)
    const volumeAnalysis = this.calculateVolumeDistribution(clientData, weekStructure)

    let schemaName = `AI Generated - ${clientData.primaryGoal} ${clientData.experience} ${clientData.daysPerWeek}-Day`
    if (clientData.specificGoal && this.specificGoals[clientData.specificGoal]) {
      const goalName = this.specificGoals[clientData.specificGoal].name
      schemaName += ` + ${goalName}`
    }

    return {
      name: schemaName,
      description: `AI-generated schema optimized for ${clientData.primaryGoal} goals with personal ratings`,
      conditions: {
        goal: clientData.primaryGoal,
        experience: clientData.experience,
        daysPerWeek: clientData.daysPerWeek,
        equipment: clientData.equipment,
        specificGoal: clientData.specificGoal || null
      },
      splitOverview: {
        schema: split.name,
        type: split.type,
        description: `AI-optimized ${split.name} for ${clientData.primaryGoal} development`
      },
      weekStructure: weekStructure,
      volumeAnalysis: volumeAnalysis,
      specificGoal: clientData.specificGoal ? this.specificGoals[clientData.specificGoal] : null,
      mode: 'ai_generated',
      generated: true
    }
  }

  determineSplit(clientData) {
    const templates = this.splitTemplates[clientData.daysPerWeek]
    if (!templates || templates.length === 0) {
      return { name: "Custom", type: "custom", days: Array(clientData.daysPerWeek).fill("Training Day") }
    }

    // Goal-based selection
    if (clientData.primaryGoal === 'strength' && clientData.daysPerWeek <= 4) {
      return templates.find(t => t.type === 'upper_lower') || templates[0]
    }
    
    if (clientData.primaryGoal === 'v_shape' && clientData.daysPerWeek >= 5) {
      return templates.find(t => t.type === 'ppl' || t.type === 'ppl_x2') || templates[0]
    }

    if (clientData.primaryGoal === 'hypertrophy' && clientData.daysPerWeek >= 4) {
      return templates.find(t => t.type === 'ppl' || t.type === 'arnold') || templates[0]
    }

    return templates[0]
  }

  generateWeekStructure(clientData, split, options) {
    const weekStructure = {}
    
    split.days.forEach((dayName, index) => {
      const dayKey = `dag${index + 1}`
      weekStructure[dayKey] = this.generateDayStructure(dayName, clientData, index, options)
    })

    return weekStructure
  }

  generateDayStructure(dayName, clientData, dayIndex, options = {}) {
    const muscleGroups = this.determineMuscleGroups(dayName, clientData.primaryGoal)
    const exercises = this.selectExercises(muscleGroups, clientData, options)
    
    return {
      name: dayName.toUpperCase(),
      focus: muscleGroups.join(', '),
      geschatteTijd: `${clientData.timePerSession || 75} minutes`,
      exercises: exercises
    }
  }

  determineMuscleGroups(dayName, goal) {
    const dayNameLower = dayName.toLowerCase()
    
    if (dayNameLower.includes('push')) {
      return ['chest', 'shoulders', 'triceps']
    } else if (dayNameLower.includes('pull')) {
      return ['back', 'biceps']
    } else if (dayNameLower.includes('legs') || dayNameLower.includes('lower')) {
      return ['legs']
    } else if (dayNameLower.includes('upper')) {
      return ['chest', 'back', 'shoulders', 'biceps', 'triceps']
    } else if (dayNameLower.includes('chest')) {
      return ['chest']
    } else if (dayNameLower.includes('back')) {
      return ['back']
    } else if (dayNameLower.includes('shoulders')) {
      return ['shoulders']
    } else if (dayNameLower.includes('arms')) {
      return ['biceps', 'triceps']
    } else if (dayNameLower.includes('full body')) {
      return ['chest', 'back', 'legs', 'shoulders']
    } else {
      return ['chest', 'back', 'legs', 'shoulders']
    }
  }

  selectExercises(muscleGroups, clientData, options = {}) {
    const exercises = []
    const usedExerciseNames = new Set()
    const availableEquipment = clientData.equipment
    const goal = clientData.primaryGoal
    const specificGoal = clientData.specificGoal ? this.specificGoals[clientData.specificGoal] : null
    
    // Get priority exercises for specific goal
    const priorityExercises = specificGoal ? specificGoal.priorityExercises : []
    console.log(`🎯 Priority exercises for ${specificGoal?.name || 'No specific goal'}:`, priorityExercises)
    
    muscleGroups.forEach(muscleGroup => {
      let dbCategory = muscleGroup
      if (['quads', 'hamstrings', 'glutes', 'calves'].includes(muscleGroup)) {
        dbCategory = 'legs'
      }
      
      const muscleExercises = this.exerciseDatabase[dbCategory]
      if (!muscleExercises) return
      
      const availableCompounds = muscleExercises.compound.filter(ex => 
        (availableEquipment.length === 0 || availableEquipment.some(eq => ex.equipment.includes(eq) || eq === 'full_gym')) &&
        !usedExerciseNames.has(ex.name)
      )
      
      const availableIsolations = muscleExercises.isolation.filter(ex => 
        (availableEquipment.length === 0 || availableEquipment.some(eq => ex.equipment.includes(eq) || eq === 'full_gym')) &&
        !usedExerciseNames.has(ex.name)
      )
      
      // Sort by specific goal priority first, then by score
      const sortByGoalPriority = (a, b) => {
        const aIsGoalPriority = priorityExercises.includes(a.name) ? 1000 : 0
        const bIsGoalPriority = priorityExercises.includes(b.name) ? 1000 : 0
        
        const scoreA = this.calculateExerciseScore(a, goal, 'compound') + aIsGoalPriority
        const scoreB = this.calculateExerciseScore(b, goal, 'compound') + bIsGoalPriority
        return scoreB - scoreA
      }
      
      availableCompounds.sort(sortByGoalPriority)
      availableIsolations.sort(sortByGoalPriority)
      
      // Exercise selection based on goal and specific priorities
      if (goal === 'hypertrophy' || goal === 'v_shape') {
        // Prioritize stretch-tension isolation exercises
        const topIsolations = availableIsolations.filter(ex => ex.stretch === true)
        if (topIsolations.length > 0) {
          const exercise = this.formatExercise(topIsolations[0], clientData, 'isolation', muscleGroup, specificGoal)
          exercises.push(exercise)
          usedExerciseNames.add(exercise.name)
        }
        
        // Add best compound
        if (availableCompounds.length > 0) {
          const exercise = this.formatExercise(availableCompounds[0], clientData, 'compound', muscleGroup, specificGoal)
          exercises.push(exercise)
          usedExerciseNames.add(exercise.name)
        }
        
        // Extra exercises for specific goal muscle groups
        const hasGoalBonus = specificGoal && specificGoal.volumeBonus && specificGoal.volumeBonus[muscleGroup]
        if (hasGoalBonus || (clientData.experience === 'advanced' && topIsolations.length > 1)) {
          const exercise = this.formatExercise(topIsolations[1] || availableIsolations[0], clientData, 'isolation', muscleGroup, specificGoal)
          if (exercise && !usedExerciseNames.has(exercise.name)) {
            exercises.push(exercise)
            usedExerciseNames.add(exercise.name)
          }
        }
      } else {
        // Strength: compounds first
        if (availableCompounds.length > 0) {
          const exercise = this.formatExercise(availableCompounds[0], clientData, 'compound', muscleGroup, specificGoal)
          exercises.push(exercise)
          usedExerciseNames.add(exercise.name)
        }
        
        if (availableIsolations.length > 0 && clientData.experience !== 'beginner') {
          const exercise = this.formatExercise(availableIsolations[0], clientData, 'isolation', muscleGroup, specificGoal)
          exercises.push(exercise)
          usedExerciseNames.add(exercise.name)
        }
        
        // Extra volume for strength specific goals
        const hasGoalBonus = specificGoal && specificGoal.volumeBonus && specificGoal.volumeBonus[muscleGroup]
        if (hasGoalBonus && availableCompounds.length > 1) {
          const exercise = this.formatExercise(availableCompounds[1], clientData, 'compound', muscleGroup, specificGoal)
          if (exercise && !usedExerciseNames.has(exercise.name)) {
            exercises.push(exercise)
            usedExerciseNames.add(exercise.name)
          }
        }
      }
    })

    return exercises.slice(0, 8) // Allow more exercises for specific goals
  }

  calculateExerciseScore(exercise, goal, type) {
    const ratings = exercise.ratings || { strength: 5, hypertrophy: 5, personal: 5 }
    let baseScore = 0
    
    if (goal === 'hypertrophy' || goal === 'v_shape') {
      baseScore = (ratings.hypertrophy || 5) * (ratings.personal || 5)
      if (exercise.stretch === true) baseScore *= 1.5
      if (exercise.painFree === true) baseScore *= 1.2
    } else if (goal === 'strength') {
      baseScore = (ratings.strength || 5) * (ratings.personal || 5)
      if (exercise.overload === 'excellent') baseScore *= 1.3
    }
    
    const priorityBonus = (6 - (exercise.priority || 5)) * 0.1
    return baseScore + priorityBonus
  }

  formatExercise(exercise, clientData, type, originalMuscleGroup, specificGoal = null) {
    const goal = clientData.primaryGoal
    let repRanges = goal === 'strength' ? 
      { compound: [3, 6], isolation: [6, 8] } : 
      { compound: [6, 10], isolation: [8, 12] }
    
    // Override rep ranges for specific goals
    if (specificGoal && specificGoal.repRangeOverride) {
      repRanges = specificGoal.repRangeOverride
    }
    
    let sets = 3
    if (clientData.experience === 'beginner') {
      sets = type === 'compound' ? 3 : 2
    } else if (clientData.experience === 'intermediate') {
      sets = type === 'compound' ? 3 : 3
    } else {
      sets = type === 'compound' ? 4 : 3
    }
    
    // Extra sets for priority exercises
    const isPriorityExercise = specificGoal && specificGoal.priorityExercises.includes(exercise.name)
    if (isPriorityExercise) {
      sets += 1 // Extra set for goal-specific exercises
      console.log(`🎯 Added bonus set to priority exercise: ${exercise.name}`)
    }
    
    const reps = type === 'compound' ? 
      `${repRanges.compound[0]}-${repRanges.compound[1]}` : 
      `${repRanges.isolation[0]}-${repRanges.isolation[1]}`
    
    const restTime = type === 'compound' ? '2-3 min' : '60-90s'
    const rpe = goal === 'strength' ? '8-9' : '9-10'
    
    let notes = ""
    if (goal === 'hypertrophy' || goal === 'v_shape') {
      if (exercise.stretch) {
        notes = "🔥 Focus on stretch position"
      }
      if (rpe === '9-10') {
        notes += notes ? " • Train to failure" : "Train to failure"
      }
    }

    if (isPriorityExercise) {
      const goalNote = `🎯 ${specificGoal.name} priority`
      notes = notes ? `${goalNote} • ${notes}` : goalNote
    }

    return {
      name: exercise.name,
      sets: sets,
      reps: reps,
      rust: restTime,
      rpe: rpe,
      equipment: exercise.equipment,
      primairSpieren: originalMuscleGroup || exercise.primary,
      type: type,
      stretch: exercise.stretch || false,
      priority: exercise.priority || 999,
      goalPriority: isPriorityExercise,
      notes: notes
    }
  }

  calculateVolumeDistribution(clientData, weekStructure) {
    const volumeCount = {}
    const guidelines = this.volumeGuidelines[clientData.experience]
    const specificGoal = clientData.specificGoal ? this.specificGoals[clientData.specificGoal] : null
    
    Object.values(weekStructure).forEach(day => {
      if (day.exercises) {
        day.exercises.forEach(exercise => {
          const muscle = exercise.primairSpieren
          if (!volumeCount[muscle]) volumeCount[muscle] = 0
          volumeCount[muscle] += exercise.sets
        })
      }
    })

    const volumeAnalysis = {
      weeklyVolume: volumeCount,
      guidelines: guidelines,
      warnings: [],
      recommendations: [],
      specificGoal: specificGoal
    }

    Object.keys(volumeCount).forEach(muscle => {
      const currentSets = volumeCount[muscle]
      let guideline = guidelines[muscle]
      
      // Adjust guidelines for specific goal bonuses
      if (specificGoal && specificGoal.volumeBonus && specificGoal.volumeBonus[muscle]) {
        const bonus = specificGoal.volumeBonus[muscle]
        guideline = {
          min: guideline.min + Math.floor(bonus / 2),
          max: guideline.max + bonus
        }
        console.log(`🎯 ${muscle} volume boosted for ${specificGoal.name}: +${bonus} sets`)
      }
      
      if (guideline) {
        if (currentSets < guideline.min) {
          volumeAnalysis.warnings.push(`${muscle}: ${currentSets} sets (below minimum ${guideline.min})`)
        } else if (currentSets > guideline.max) {
          volumeAnalysis.warnings.push(`${muscle}: ${currentSets} sets (above maximum ${guideline.max})`)
        }
      }
    })

    if (clientData.primaryGoal === 'hypertrophy' || clientData.primaryGoal === 'v_shape') {
      volumeAnalysis.recommendations.push("🎯 Train to failure (RPE 9-10)")
      volumeAnalysis.recommendations.push("🔥 Focus on stretch-tension exercises")
      volumeAnalysis.recommendations.push("⬇️ Controlled negative, explosive positive")
      volumeAnalysis.recommendations.push("💪 Using your personal exercise ratings")
    }

    if (specificGoal) {
      volumeAnalysis.recommendations.push(`🎯 ${specificGoal.name} specialization applied`)
      volumeAnalysis.recommendations.push(`📈 Priority exercises: ${specificGoal.priorityExercises.slice(0, 3).join(', ')}`)
    }

    return volumeAnalysis
  }
}

// ===== TOAST NOTIFICATION SYSTEM =====
function showToast(message, type = 'success') {
  // Create toast element
  const toast = document.createElement('div')
  toast.className = `fixed top-4 right-4 px-4 py-2 rounded-lg font-semibold z-50 transform translate-x-full transition-transform duration-300 ${
    type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
  }`
  toast.textContent = message
  document.body.appendChild(toast)
  
  // Show toast
  setTimeout(() => {
    toast.classList.remove('translate-x-full')
  }, 100)
  
  // Hide toast after 3 seconds
  setTimeout(() => {
    toast.classList.add('translate-x-full')
    setTimeout(() => {
      if (document.body.contains(toast)) {
        document.body.removeChild(toast)
      }
    }, 300)
  }, 3000)
}

// ===== MAIN COMPONENT =====
export default function AIGenerator() {
  // Form state
  const [clientName, setClientName] = useState('')
  const [primaryGoal, setPrimaryGoal] = useState('')
  const [specificGoal, setSpecificGoal] = useState('')
  const [experience, setExperience] = useState('')
  const [daysPerWeek, setDaysPerWeek] = useState('')
  const [timePerSession, setTimePerSession] = useState('75')
  const [equipment, setEquipment] = useState(['full_gym'])
  
  // Generation options
  const [emphasizeStretch, setEmphasizeStretch] = useState(true)
  const [includeWeakpoint, setIncludeWeakpoint] = useState(false)
  const [prioritizeCompounds, setPrioritizeCompounds] = useState(true)
  const [addIntensityMethods, setAddIntensityMethods] = useState(false)
  const [usePersonalRatings, setUsePersonalRatings] = useState(true)
  const [generationType, setGenerationType] = useState('smart')

  // Generation state
  const [currentSchema, setCurrentSchema] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentMode, setCurrentMode] = useState('generate') // 'generate' | 'edit'

  // AI Generator instance
  const [aiGenerator] = useState(() => new AISchemaGenerator())

  const equipmentOptions = [
    { value: 'full_gym', label: 'Full Gym' },
    { value: 'dumbbells', label: 'Dumbbells Only' },
    { value: 'barbell', label: 'Barbell Setup' },
    { value: 'home_minimal', label: 'Minimal Home' }
  ]

  const handleEquipmentChange = (equipmentType) => {
    setEquipment(prev => 
      prev.includes(equipmentType)
        ? prev.filter(e => e !== equipmentType)
        : [...prev, equipmentType]
    )
  }

  const generateAISchema = async () => {
    if (!primaryGoal || !experience || !daysPerWeek) {
      showToast('Please fill in all required fields', 'error')
      return
    }

    setIsGenerating(true)
    
    try {
      const clientData = {
        name: clientName || 'Client',
        primaryGoal,
        specificGoal: specificGoal || null,
        experience,
        daysPerWeek: parseInt(daysPerWeek),
        timePerSession: parseInt(timePerSession) || 75,
        equipment,
        limitations: []
      }

      const options = {
        emphasizeStretch,
        includeWeakpoint,
        prioritizeCompounds,
        addIntensityMethods,
        usePersonalRatings,
        generationType
      }

      console.log('🧠 Generating AI schema with options:', options)
      
      // Simulate AI thinking time
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const generatedSchema = aiGenerator.generateSchema(clientData, options)
      setCurrentSchema(generatedSchema)
      setCurrentMode('edit')
      
      let message = '🧠 AI Schema generated successfully!'
      if (specificGoal && SPECIFIC_GOALS[specificGoal]) {
        message = `🧠 AI Schema with ${SPECIFIC_GOALS[specificGoal].name} focus generated!`
      }
      
      showToast(message)
      
    } catch (error) {
      console.error('Error generating schema:', error)
      showToast('Error generating schema. Please try again.', 'error')
    } finally {
      setIsGenerating(false)
    }
  }

  const exportSchema = (format) => {
    if (!currentSchema) return

    const dataStr = JSON.stringify(currentSchema, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${currentSchema.name.replace(/\s+/g, '_')}.json`
    link.click()
    URL.revokeObjectURL(url)
    
    showToast(`📄 Exported as ${format.toUpperCase()}`)
  }

  if (currentMode === 'edit' && currentSchema) {
    return <SchemaEditor schema={currentSchema} onBack={() => setCurrentMode('generate')} />
  }

  return (
    <div className="ai-generator">
      <div className="workapp-card">
        <div className="workapp-card-header">
          <h2 className="workapp-card-title">🧠 AI Workout Generator</h2>
          <p className="workapp-card-subtitle">Generate personalized workout plans using AI and exercise science</p>
        </div>

        {/* Client Information */}
        <div className="workapp-mb-lg">
          <h3 className="text-lg font-bold workapp-text-primary workapp-mb-lg">Client Information</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            <div>
              <label className="block workapp-text-primary font-medium mb-1">Client Name</label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Enter client name"
                style={{ 
                  background: 'var(--bg-tertiary)', 
                  border: '1px solid var(--border-green)', 
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-sm)',
                  color: 'var(--text-primary)',
                  width: '100%'
                }}
              />
            </div>

            <div>
              <label className="block workapp-text-primary font-medium mb-1">Primary Goal *</label>
              <select
                value={primaryGoal}
                onChange={(e) => {
                  setPrimaryGoal(e.target.value)
                  setSpecificGoal('') // Reset specific goal when primary changes
                }}
                style={{ 
                  background: 'var(--bg-tertiary)', 
                  border: '1px solid var(--border-green)', 
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-sm)',
                  color: 'var(--text-primary)',
                  width: '100%'
                }}
              >
                <option value="">Select goal...</option>
                <option value="strength">💪 Strength</option>
                <option value="hypertrophy">🏋️ Hypertrophy (Muscle Growth)</option>
                <option value="v_shape">📐 V-Shape</option>
              </select>
            </div>

            <div>
              <label className="block workapp-text-primary font-medium mb-1">Specific Goal Focus</label>
              <select
                value={specificGoal}
                onChange={(e) => setSpecificGoal(e.target.value)}
                style={{ 
                  background: 'var(--bg-tertiary)', 
                  border: '1px solid var(--border-green)', 
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-sm)',
                  color: 'var(--text-primary)',
                  width: '100%'
                }}
              >
                <option value="">No specific focus</option>
                <optgroup label="🏋️ Strength Specialization">
                  <option value="bench_strength">Bench Press Strength</option>
                  <option value="squat_strength">Squat Strength</option>
                  <option value="deadlift_strength">Deadlift Strength</option>
                </optgroup>
                <optgroup label="🔥 Hypertrophy Specialization">
                  <option value="lat_width">Lat Width Development</option>
                  <option value="shoulder_width">Shoulder Width (V-Shape)</option>
                  <option value="tricep_size">Tricep Mass</option>
                  <option value="bicep_peaks">Bicep Peaks</option>
                </optgroup>
              </select>
            </div>

            <div>
              <label className="block workapp-text-primary font-medium mb-1">Experience Level *</label>
              <select
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                style={{ 
                  background: 'var(--bg-tertiary)', 
                  border: '1px solid var(--border-green)', 
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-sm)',
                  color: 'var(--text-primary)',
                  width: '100%'
                }}
              >
                <option value="">Select level...</option>
                <option value="beginner">🌱 Beginner (0-1 years)</option>
                <option value="intermediate">📈 Intermediate (1-3 years)</option>
                <option value="advanced">🏆 Advanced (3+ years)</option>
              </select>
            </div>

            <div>
              <label className="block workapp-text-primary font-medium mb-1">Days per Week *</label>
              <select
                value={daysPerWeek}
                onChange={(e) => setDaysPerWeek(e.target.value)}
                style={{ 
                  background: 'var(--bg-tertiary)', 
                  border: '1px solid var(--border-green)', 
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-sm)',
                  color: 'var(--text-primary)',
                  width: '100%'
                }}
              >
                <option value="">Select days...</option>
                <option value="3">3 Days</option>
                <option value="4">4 Days</option>
                <option value="5">5 Days</option>
                <option value="6">6 Days</option>
              </select>
            </div>

            <div>
              <label className="block workapp-text-primary font-medium mb-1">Session Duration (minutes)</label>
              <input
                type="number"
                value={timePerSession}
                onChange={(e) => setTimePerSession(e.target.value)}
                placeholder="75"
                min="30"
                max="180"
                style={{ 
                  background: 'var(--bg-tertiary)', 
                  border: '1px solid var(--border-green)', 
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-sm)',
                  color: 'var(--text-primary)',
                  width: '100%'
                }}
              />
            </div>
          </div>

          {/* Specific Goal Display */}
          {specificGoal && SPECIFIC_GOALS[specificGoal] && (
            <div style={{ 
              background: 'var(--accent-green-soft)', 
              border: '1px solid var(--accent-green)', 
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-md)',
              marginTop: 'var(--space-lg)'
            }}>
              <div className="font-medium workapp-text-accent workapp-mb-lg">🎯 Goal Combination:</div>
              <div className="workapp-text-primary text-sm">
                {primaryGoal.charAt(0).toUpperCase() + primaryGoal.slice(1)} + {SPECIFIC_GOALS[specificGoal].name}
              </div>
              <div className="workapp-text-muted text-xs workapp-mt-lg">
                Priority exercises: {SPECIFIC_GOALS[specificGoal].priorityExercises.slice(0, 3).join(', ')}
              </div>
            </div>
          )}
        </div>

        {/* Equipment Selection */}
        <div className="workapp-mb-lg">
          <h3 className="text-lg font-bold workapp-text-primary workapp-mb-lg">Available Equipment</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem' }}>
            {equipmentOptions.map(eq => (
              <label key={eq.value} className="workapp-flex workapp-items-center workapp-gap-md cursor-pointer p-2 rounded" 
                style={{ background: equipment.includes(eq.value) ? 'var(--accent-green-soft)' : 'transparent' }}>
                <input
                  type="checkbox"
                  checked={equipment.includes(eq.value)}
                  onChange={() => handleEquipmentChange(eq.value)}
                  className="w-4 h-4"
                  style={{ accentColor: 'var(--accent-green)' }}
                />
                <span className="workapp-text-primary">{eq.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* AI Generation Options */}
        <div className="workapp-mb-lg">
          <h3 className="text-lg font-bold workapp-text-primary workapp-mb-lg">AI Generation Options</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '0.5rem' }}>
            <label className="workapp-flex workapp-items-center workapp-gap-md cursor-pointer p-2 rounded">
              <input
                type="checkbox"
                checked={usePersonalRatings}
                onChange={(e) => setUsePersonalRatings(e.target.checked)}
                style={{ accentColor: 'var(--accent-green)' }}
              />
              <span className="workapp-text-primary">Use Personal Exercise Ratings</span>
            </label>

            <label className="workapp-flex workapp-items-center workapp-gap-md cursor-pointer p-2 rounded">
              <input
                type="checkbox"
                checked={prioritizeCompounds}
                onChange={(e) => setPrioritizeCompounds(e.target.checked)}
                style={{ accentColor: 'var(--accent-green)' }}
              />
              <span className="workapp-text-primary">Prioritize Compound Movements</span>
            </label>

            <label className="workapp-flex workapp-items-center workapp-gap-md cursor-pointer p-2 rounded">
              <input
                type="checkbox"
                checked={emphasizeStretch}
                onChange={(e) => setEmphasizeStretch(e.target.checked)}
                style={{ accentColor: 'var(--accent-green)' }}
              />
              <span className="workapp-text-primary">Emphasize Stretch-Tension</span>
            </label>

            <label className="workapp-flex workapp-items-center workapp-gap-md cursor-pointer p-2 rounded">
              <input
                type="checkbox"
                checked={addIntensityMethods}
                onChange={(e) => setAddIntensityMethods(e.target.checked)}
                style={{ accentColor: 'var(--accent-green)' }}
              />
              <span className="workapp-text-primary">Add Intensity Methods</span>
            </label>
          </div>
        </div>

        {/* Generate Button */}
        <div className="text-center">
          <button
            onClick={generateAISchema}
            disabled={isGenerating || !primaryGoal || !experience || !daysPerWeek}
            className="workapp-btn workapp-btn-primary text-lg px-8 py-3"
            style={{ 
              opacity: isGenerating || !primaryGoal || !experience || !daysPerWeek ? 0.5 : 1,
              cursor: isGenerating || !primaryGoal || !experience || !daysPerWeek ? 'not-allowed' : 'pointer'
            }}
          >
            {isGenerating ? (
              <>
                <div className="workapp-spinner" style={{ marginRight: '8px' }}></div>
                🧠 Generating AI Plan...
              </>
            ) : (
              '⚡ Generate AI Workout Plan'
            )}
          </button>
          
          {(!primaryGoal || !experience || !daysPerWeek) && (
            <p className="workapp-text-muted text-sm workapp-mt-lg">Please fill in all required fields (*) to generate</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ===== SCHEMA EDITOR COMPONENT =====
function SchemaEditor({ schema, onBack }) {
  return (
    <div className="workapp-card">
      <div className="workapp-card-header">
        <div className="workapp-flex workapp-items-center workapp-justify-between">
          <div>
            <h2 className="workapp-card-title">✏️ Edit Workout Plan</h2>
            <p className="workapp-card-subtitle">{schema.name}</p>
          </div>
          <button onClick={onBack} className="workapp-btn workapp-btn-secondary">
            ← Back to Generator
          </button>
        </div>
      </div>

      {/* Specific Goal Info */}
      {schema.specificGoal && (
        <div style={{ 
          background: 'var(--accent-green-soft)', 
          border: '1px solid var(--accent-green)', 
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-md)',
          marginBottom: 'var(--space-lg)'
        }}>
          <div className="font-medium workapp-text-accent workapp-mb-lg">
            🎯 {schema.specificGoal.name}
          </div>
          <div className="workapp-text-primary text-sm workapp-mb-lg">
            {schema.specificGoal.description}
          </div>
          <div className="workapp-text-muted text-xs">
            Priority exercises: {schema.specificGoal.priorityExercises.slice(0, 5).join(', ')}
          </div>
        </div>
      )}

      {/* Workout Days */}
      <div className="space-y-4">
        {schema.weekStructure && Object.entries(schema.weekStructure).map(([dayKey, day], dayIndex) => (
          <div key={dayIndex} className="workapp-card" style={{ background: 'var(--bg-tertiary)' }}>
            <h3 className="text-lg font-bold workapp-text-accent workapp-mb-lg">{day.name}</h3>
            <div className="workapp-text-muted text-sm workapp-mb-lg">
              Focus: {day.focus} • Duration: {day.geschatteTijd}
            </div>
            
            {day.exercises && day.exercises.map((exercise, exIndex) => (
              <div key={exIndex} className="workapp-flex workapp-items-center workapp-justify-between p-3 mb-2 rounded" 
                style={{ 
                  background: 'var(--bg-secondary)', 
                  border: `1px solid ${exercise.goalPriority ? 'var(--accent-green)' : 'var(--border-green)'}`,
                  boxShadow: exercise.goalPriority ? 'var(--shadow-green)' : 'none'
                }}>
                <div className="flex-1">
                  <div className="workapp-text-primary font-medium">
                    {exercise.goalPriority && '🎯 '}
                    {exercise.stretch && '🔥 '}
                    {exercise.name}
                  </div>
                  <div className="workapp-text-muted text-sm">
                    {exercise.sets} sets × {exercise.reps} reps @ RPE {exercise.rpe}
                  </div>
                  <div className="workapp-text-muted text-xs">
                    Rest: {exercise.rust} • Equipment: {exercise.equipment}
                  </div>
                  {exercise.notes && (
                    <div className="workapp-text-accent text-xs workapp-mt-lg">{exercise.notes}</div>
                  )}
                </div>
                <div className="workapp-flex workapp-gap-md workapp-items-center">
                  <span className="workapp-badge workapp-badge-info">{exercise.type}</span>
                  {exercise.goalPriority && (
                    <span className="workapp-badge workapp-badge-warning">⭐ Goal Priority</span>
                  )}
                  {exercise.stretch && (
                    <span className="workapp-badge workapp-badge-success">🔥 Stretch</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Volume Analysis */}
      {schema.volumeAnalysis && (
        <div className="workapp-card workapp-mt-lg" style={{ background: 'var(--bg-tertiary)' }}>
          <h3 className="text-lg font-bold workapp-text-accent workapp-mb-lg">📊 Volume Analysis</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
            {Object.entries(schema.volumeAnalysis.weeklyVolume).map(([muscle, sets]) => {
              const guideline = schema.volumeAnalysis.guidelines[muscle]
              let colorClass = 'workapp-text-accent'
              if (guideline) {
                if (sets < guideline.min) colorClass = 'text-red-400'
                else if (sets > guideline.max) colorClass = 'text-yellow-400'
              }
              
              return (
                <div key={muscle} className="text-center">
                  <div className="text-sm workapp-text-muted capitalize">{muscle}</div>
                  <div className={`text-lg font-bold ${colorClass}`}>{sets} sets</div>
                  {guideline && (
                    <div className="text-xs workapp-text-muted">Target: {guideline.min}-{guideline.max}</div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Warnings */}
          {schema.volumeAnalysis.warnings.length > 0 && (
            <div className="workapp-mt-lg">
              <h4 className="font-medium text-yellow-400 mb-2">⚠️ Volume Warnings:</h4>
              <ul className="text-sm workapp-text-muted">
                {schema.volumeAnalysis.warnings.map((warning, index) => (
                  <li key={index}>• {warning}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {schema.volumeAnalysis.recommendations.length > 0 && (
            <div className="workapp-mt-lg">
              <h4 className="font-medium workapp-text-accent mb-2">💡 Recommendations:</h4>
              <ul className="text-sm workapp-text-muted">
                {schema.volumeAnalysis.recommendations.map((rec, index) => (
                  <li key={index}>• {rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="workapp-flex workapp-gap-md workapp-mt-lg">
        <button className="workapp-btn workapp-btn-primary">
          💾 Save to Library
        </button>
        <button 
          onClick={() => {
            const dataStr = JSON.stringify(schema, null, 2)
            const dataBlob = new Blob([dataStr], { type: 'application/json' })
            const url = URL.createObjectURL(dataBlob)
            const link = document.createElement('a')
            link.href = url
            link.download = `${schema.name.replace(/\s+/g, '_')}.json`
            link.click()
            URL.revokeObjectURL(url)
            showToast('📄 Schema exported as JSON!')
          }}
          className="workapp-btn workapp-btn-secondary"
        >
          📄 Export JSON
        </button>
      </div>
    </div>
  )
}
