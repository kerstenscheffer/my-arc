// src/client/pages/ClientWorkoutPlan.jsx
// UPDATED VERSION - Clean modular import

import WorkoutPlan from '../../modules/workout/WorkoutPlan'

/**
 * ClientWorkoutPlan - Clean wrapper component
 * 
 * This component now simply imports and uses the modular WorkoutPlan
 * All logic has been moved to the /modules/workout folder
 */
export default function ClientWorkoutPlan({ client, schema, db }) {
  return <WorkoutPlan client={client} schema={schema} db={db} />
}

/**
 * Module Structure Overview:
 * 
 * /src/modules/workout/
 * ├── WorkoutService.js           # Database & business logic
 * ├── WorkoutPlan.jsx            # Main container component
 * ├── components/
 * │   ├── WeekSchedule.jsx       # Week overview with days
 * │   ├── WorkoutDetails.jsx     # Workout day detail modal
 * │   ├── SwapMode.jsx           # Swap/ruil functionaliteit
 * │   ├── AlternativeExercises.jsx # Alternative exercises modal
 * │   ├── TodayWorkout.jsx       # Today's workout card
 * │   └── WorkoutPicker.jsx      # Workout picker modal
 * ├── hooks/
 * │   ├── useWorkoutSchedule.js  # Schedule state management
 * │   └── useWorkoutProgress.js  # Progress tracking
 * ├── constants/
 * │   └── exerciseDatabase.js    # Exercise database
 * └── utils/
 *     └── workoutHelpers.js      # Helper functions
 * 
 * Benefits of this structure:
 * - ✅ Easy to maintain and extend
 * - ✅ Clear separation of concerns
 * - ✅ Reusable components
 * - ✅ Testable business logic
 * - ✅ Database operations centralized
 * - ✅ State management via custom hooks
 * - ✅ No direct Supabase imports in components
 * - ✅ All props properly passed down
 */
