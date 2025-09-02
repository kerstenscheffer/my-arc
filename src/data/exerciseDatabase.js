// src/data/exerciseDatabase.js
// Centrale exercise database voor de hele MY ARC app

const EXERCISE_DATABASE = {
  chest: [
    // Compound
    'Bench Press', 'Barbell Bench Press', 'Flat Dumbbell Bench Press', 
    'Incline Bench Press', 'Incline Dumbbell Press', 'Low-Incline Barbell Bench Press',
    'Decline Bench Press', 'Machine Chest Press', 'Weighted Dips', 'Dips',
    'Push-ups', 'Wide Grip Push-ups', 'Diamond Push-ups', 
    // Isolation
    'Chest Fly', 'Dumbbell Flies', 'Incline Cable Flies', 'Cable Fly', 
    'Seated Cable Fly', 'Low-to-High Cable Fly', 'Cable Crossover',
    'Machine Pec Deck', 'Pec Deck', 'Chest Press', 
    'Decline Dumbbell Press', 'Landmine Press'
  ],
  back: [
    // Compound
    'Pull-ups', 'Weighted Pull-Ups', 'Chin-ups', 'Lat Pulldown', 
    'Single-Arm Lat Pulldown', 'Wide Grip Pulldown', 'Close Grip Pulldown',
    'Rows', 'Barbell Row', 'Barbell Bent-Over Row', 'T-Bar Row', 
    'T-Bar Row (Chest-Supported)', 'Cable Row', 'Seated Row', 
    'Single-Arm Dumbbell Row', 'Dumbbell Row', 'Pendlay Row',
    'Deadlifts', 'Romanian Deadlifts', 'Romanian Deadlift', 'Stiff Leg Deadlifts',
    'Rack Pulls', 'Shrugs', 
    // Isolation
    'Cable Pullovers', 'Straight-Arm Pulldown (Rope)', 'Face Pulls', 
    'Reverse Fly', 'Back Extension', 'Good Mornings', 'Hyperextensions'
  ],
  shoulders: [
    // Compound
    'Shoulder Press', 'Machine Shoulder Press', 'Dumbbell Shoulder Press',
    'Military Press', 'Overhead Press', 'Overhead Press (Barbell)',
    'Seated Barbell Overhead Press', 'Arnold Press',
    // Isolation
    'Lateral Raises', 'Cable Lateral Raises', 'Lean-Away Cable Lateral Raise',
    'Machine Lateral Raises', 'Dumbbell Lateral Raises', 'Lying Incline Lateral Raise',
    'Side Lateral Raises', 'Front Raises', 'Rear Delt Fly', 'Rear Delt Raises',
    'Upright Row', 'Cable Lateral Raise', 'Bradford Press', 'Cuban Press',
    'Bus Drivers', 'Band Pull-aparts', 'Handstand Push-ups'
  ],
  arms: [
    // Biceps (Isolation)
    'Bicep Curls', 'Barbell Curls', 'Dumbbell Curls', 'Incline Dumbbell Curl',
    'Bayesian Cable Curl', 'Cable Bicep Curls', 'Cable Curls',
    'Hammer Curls', 'Preacher Curls', 'Concentration Curls', 'Spider Curls',
    'Drag Curls', '21s', 'EZ Bar Curls', 'Incline Curls', 'Cable Hammer Curls',
    
    // Triceps (Compound & Isolation)
    'Close-Grip Bench Press', 'Close Grip Bench', 'Weighted Dips',
    'Tricep Extensions', 'Cable Overhead Triceps Extension', 
    'Single-Arm Overhead Cable Extension', 'Overhead Extension',
    'Overhead Tricep Extension', 'Dumbbell Overhead Extension',
    'Crossbody Cable Extension', 'Incline Skull Crushers', 'Skull Crushers',
    'Triceps Pushdown', 'Cable Pushdown', 'Rope Pushdown',
    'Tricep Dips', 'Diamond Push-ups', 'Tricep Kickbacks',
    'JM Press', 'French Press', 'Lying Tricep Extension'
  ],
  legs: [
    // Compound
    'Squats', 'High-Bar Back Squat', 'Back Squats', 'Front Squats', 
    'Goblet Squats', 'Box Squats', 'Bulgarian Split Squat', 'Bulgarian Split Squats',
    'Split Squats', 'Hack Squat', 'Leg Press', 
    'Romanian Deadlifts', 'Romanian Deadlift', 'Hip Thrust',
    'Lunges', 'Walking Lunges', 'Reverse Lunges', 'Step-ups',
    'Box Jumps', 'Jump Squats', 'Pistol Squats', 'Wall Sits',
    
    // Isolation
    'Leg Extensions', 'Leg Extension', 'Single-Leg Leg Extension',
    'Leg Curls', 'Leg Curl', 'Lying Leg Curls', 'Seated Leg Curls', 
    'Nordic Curls', 'Good Mornings', 'Stiff Leg Deadlifts',
    
    // Calves
    'Calf Raises', 'Standing Calf Raises', 'Seated Calf Raises', 
    'Donkey Calf Raises', 'Single Leg Calf Raises'
  ],
  core: [
    'Planks', 'Side Planks', 'Crunches', 'Sit-ups', 'Russian Twists',
    'Leg Raises', 'Hanging Leg Raises', 'Knee Raises', 'Mountain Climbers',
    'Ab Wheel', 'Ab Rollouts', 'Dead Bug', 'Bird Dog', 'Pallof Press',
    'Wood Choppers', 'Cable Crunches', 'Hollow Body Hold', 'V-ups',
    'Flutter Kicks', 'Bicycle Crunches', 'Dragon Flags', 'Toe Touches',
    'Reverse Crunches', 'Oblique Crunches'
  ]
};

/**
 * Haalt exercises op uit de database en combineert met lokale exercise lijst
 * @param {Object} db - DatabaseService instance
 * @param {String} userId - User ID om workout plans op te halen
 * @returns {Promise<Array>} Array van exercise objecten met id, name, muscle_group
 */
export async function loadExercisesFromDatabase(db, userId) {
  const exerciseMap = new Map();
  
  try {
    // Haal exercises uit workout_plans
    if (db && userId) {
      const { data: workoutPlans } = await db.supabase
        .from('workout_plans')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active');
      
      if (workoutPlans && workoutPlans.length > 0) {
        workoutPlans.forEach(plan => {
          if (plan.plan_data && plan.plan_data.weekStructure) {
            Object.values(plan.plan_data.weekStructure).forEach(day => {
              if (day.exercises && Array.isArray(day.exercises)) {
                day.exercises.forEach(exercise => {
                  const exerciseId = exercise.name.toLowerCase().replace(/\s+/g, '-');
                  if (!exerciseMap.has(exerciseId)) {
                    exerciseMap.set(exerciseId, {
                      id: exerciseId,
                      name: exercise.name,
                      muscle_group: getMuscleGroup(exercise.name)
                    });
                  }
                });
              }
            });
          }
        });
      }
    }
  } catch (error) {
    console.error('Error loading exercises from database:', error);
  }
  
  // Voeg alle lokale exercises toe
  Object.entries(EXERCISE_DATABASE).forEach(([group, exercises]) => {
    exercises.forEach(name => {
      const exerciseId = name.toLowerCase().replace(/\s+/g, '-');
      if (!exerciseMap.has(exerciseId)) {
        exerciseMap.set(exerciseId, {
          id: exerciseId,
          name: name,
          muscle_group: group
        });
      }
    });
  });
  
  // Return als gesorteerde array
  return Array.from(exerciseMap.values()).sort((a, b) => 
    a.name.localeCompare(b.name)
  );
}

/**
 * Bepaalt muscle group voor een exercise naam
 * @param {String} exerciseName - Naam van de exercise
 * @returns {String} Muscle group naam
 */
export function getMuscleGroup(exerciseName) {
  if (!exerciseName) return 'general';
  
  const name = exerciseName.toLowerCase().trim();
  
  // Check exact match eerst
  for (const [group, exercises] of Object.entries(EXERCISE_DATABASE)) {
    if (exercises.some(ex => ex.toLowerCase() === name)) {
      return group;
    }
  }
  
  // Keyword-based detection
  if (name.includes('chest') || name.includes('bench') || name.includes('fly') || 
      name.includes('pec') || name.includes('push-up')) {
    return 'chest';
  }
  if (name.includes('back') || name.includes('row') || name.includes('pull') || 
      name.includes('lat') || name.includes('dead')) {
    return 'back';
  }
  if (name.includes('shoulder') || name.includes('delt') || name.includes('raise') || 
      name.includes('military') || name.includes('overhead')) {
    return 'shoulders';
  }
  if (name.includes('bicep') || name.includes('curl') || name.includes('hammer')) {
    return 'arms';
  }
  if (name.includes('tricep') || name.includes('extension') || name.includes('pushdown') || 
      name.includes('skull')) {
    return 'arms';
  }
  if (name.includes('squat') || name.includes('leg') || name.includes('lunge') || 
      name.includes('calf') || name.includes('quad') || name.includes('hamstring')) {
    return 'legs';
  }
  if (name.includes('ab') || name.includes('core') || name.includes('plank') || 
      name.includes('crunch') || name.includes('twist')) {
    return 'core';
  }
  
  return 'general';
}

/**
 * Krijg alle exercises als flat array
 * @returns {Array} Array van alle exercises met muscle group
 */
export function getAllExercises() {
  const allExercises = [];
  
  Object.entries(EXERCISE_DATABASE).forEach(([group, exercises]) => {
    exercises.forEach(name => {
      allExercises.push({
        id: name.toLowerCase().replace(/\s+/g, '-'),
        name: name,
        muscle_group: group
      });
    });
  });
  
  return allExercises.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Krijg exercises voor specifieke muscle group
 * @param {String} muscleGroup - Naam van de muscle group
 * @returns {Array} Array van exercises voor die muscle group
 */
export function getExercisesByMuscleGroup(muscleGroup) {
  const exercises = EXERCISE_DATABASE[muscleGroup] || [];
  return exercises.map(name => ({
    id: name.toLowerCase().replace(/\s+/g, '-'),
    name: name,
    muscle_group: muscleGroup
  }));
}

/**
 * Zoek exercises op naam
 * @param {String} searchTerm - Zoekterm
 * @returns {Array} Gefilterde exercises
 */
export function searchExercises(searchTerm) {
  if (!searchTerm) return getAllExercises();
  
  const term = searchTerm.toLowerCase();
  return getAllExercises().filter(exercise => 
    exercise.name.toLowerCase().includes(term)
  );
}

// Export alles
export default {
  EXERCISE_DATABASE,
  loadExercisesFromDatabase,
  getMuscleGroup,
  getAllExercises,
  getExercisesByMuscleGroup,
  searchExercises
};
