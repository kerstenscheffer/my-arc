// src/modules/manual-workout-builder/services/WorkoutPDFService.js
import { generateWorkoutPlanHTML } from './WorkoutPDFTemplate'

class WorkoutPDFService {
  constructor(db) {
    this.db = db
  }

  /**
   * Generate PDF from workout plan
   * @param {Object} workoutPlan - The complete workout plan object
   * @param {Object} options - Additional options (clientName, coachName, etc.)
   * @returns {Promise} - PDF generation promise
   */
  async generatePDF(workoutPlan, options = {}) {
    try {
      // Extract options
      const {
        clientName = 'Client',
        coachName = 'Coach',
        startDate = new Date().toLocaleDateString('nl-NL'),
        includeNotes = true
      } = options

      // Validate workout plan
      if (!workoutPlan || !workoutPlan.days || workoutPlan.days.length === 0) {
        throw new Error('No workout days to export')
      }

      // Format week range
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + (workoutPlan.days_per_week * 7))
      const weekRange = `${startDate} - ${endDate.toLocaleDateString('nl-NL')}`

      // Generate HTML
      const html = generateWorkoutPlanHTML(
        workoutPlan,
        clientName,
        coachName,
        weekRange,
        includeNotes
      )

      // Open print dialog
      this.openForPrint(html, workoutPlan.name)

      return { success: true }
    } catch (error) {
      console.error('PDF generation error:', error)
      throw error
    }
  }

  /**
   * Open workout plan for print/PDF
   * @param {string} html - Generated HTML content
   * @param {string} planName - Workout plan name for filename
   */
  openForPrint(html, planName = 'workout-plan') {
    // Try popup window first
    const printWindow = window.open('', '_blank', 'width=900,height=700')
    
    if (printWindow) {
      printWindow.document.write(html)
      printWindow.document.close()
      
      // Set page title for PDF filename
      printWindow.document.title = `${planName.replace(/[^a-z0-9]/gi, '-')}-${new Date().toISOString().split('T')[0]}`
      
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print()
        }, 500)
      }
    } else {
      // Iframe fallback for popup blockers
      const printFrame = document.createElement('iframe')
      printFrame.style.cssText = 'position: fixed; width: 0; height: 0; border: 0;'
      document.body.appendChild(printFrame)
      
      const frameDoc = printFrame.contentDocument || printFrame.contentWindow.document
      frameDoc.open()
      frameDoc.write(html)
      frameDoc.close()
      
      // Set title
      frameDoc.title = `${planName.replace(/[^a-z0-9]/gi, '-')}-${new Date().toISOString().split('T')[0]}`
      
      setTimeout(() => {
        printFrame.contentWindow.focus()
        printFrame.contentWindow.print()
        
        // Cleanup after print
        setTimeout(() => {
          document.body.removeChild(printFrame)
        }, 1000)
      }, 500)
    }
  }

  /**
   * Generate quick preview
   * @param {Object} workoutPlan - Workout plan to preview
   * @returns {string} - Preview HTML
   */
  generatePreview(workoutPlan) {
    const previewHTML = `
      <div style="padding: 20px; background: #0a0a0a; color: #fff; font-family: Arial, sans-serif;">
        <h2 style="color: #10b981; margin-bottom: 1rem;">${workoutPlan.name || 'Workout Plan'}</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
          ${workoutPlan.days.map((day, index) => `
            <div style="background: #1a1a1a; padding: 1rem; border-radius: 8px; border: 1px solid #333;">
              <h3 style="color: #10b981; font-size: 1rem; margin-bottom: 0.5rem;">
                Dag ${index + 1}: ${day.name || 'Training'}
              </h3>
              <p style="color: #888; font-size: 0.875rem;">
                ${day.exercises.length} oefeningen • ${day.geschatteTijd || '60 min'}
              </p>
            </div>
          `).join('')}
        </div>
      </div>
    `
    
    return previewHTML
  }

  /**
   * Calculate workout statistics
   * @param {Object} workoutPlan - Workout plan
   * @returns {Object} - Stats object
   */
  calculateStats(workoutPlan) {
    const stats = {
      totalDays: workoutPlan.days.length,
      totalExercises: 0,
      totalSets: 0,
      totalTime: 0,
      muscleGroups: new Set(),
      equipment: new Set()
    }

    workoutPlan.days.forEach(day => {
      stats.totalExercises += day.exercises.length
      
      day.exercises.forEach(exercise => {
        stats.totalSets += parseInt(exercise.sets) || 3
        
        if (exercise.primairSpieren) {
          stats.muscleGroups.add(exercise.primairSpieren)
        }
        
        if (exercise.equipment) {
          stats.equipment.add(exercise.equipment)
        }
      })
      
      // Parse time (e.g., "60 minutes" -> 60)
      const timeMatch = (day.geschatteTijd || '60 minutes').match(/\d+/)
      if (timeMatch) {
        stats.totalTime += parseInt(timeMatch[0])
      }
    })

    stats.muscleGroups = Array.from(stats.muscleGroups)
    stats.equipment = Array.from(stats.equipment)
    stats.avgTimePerDay = Math.round(stats.totalTime / stats.totalDays)

    return stats
  }

  /**
   * Validate workout plan before export
   * @param {Object} workoutPlan - Workout plan to validate
   * @returns {Object} - Validation result
   */
  validateWorkoutPlan(workoutPlan) {
    const errors = []
    const warnings = []

    if (!workoutPlan.name) {
      errors.push('Workout plan heeft geen naam')
    }

    if (!workoutPlan.days || workoutPlan.days.length === 0) {
      errors.push('Geen trainingsdagen toegevoegd')
    }

    workoutPlan.days.forEach((day, index) => {
      if (!day.name) {
        warnings.push(`Dag ${index + 1} heeft geen naam`)
      }

      if (day.exercises.length === 0) {
        warnings.push(`Dag ${index + 1} heeft geen oefeningen`)
      }

      day.exercises.forEach((exercise, exIndex) => {
        if (!exercise.name) {
          errors.push(`Oefening ${exIndex + 1} op dag ${index + 1} heeft geen naam`)
        }
      })
    })

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Format exercise for display
   * @param {Object} exercise - Exercise object
   * @returns {Object} - Formatted exercise
   */
  formatExercise(exercise) {
    return {
      name: exercise.name || 'Unnamed Exercise',
      sets: exercise.sets || 3,
      reps: exercise.reps || '8-12',
      rust: exercise.rust || '2 min',
      rpe: exercise.rpe || '7-8',
      equipment: this.formatEquipment(exercise.equipment),
      muscle: this.formatMuscle(exercise.primairSpieren),
      notes: exercise.notes || '',
      stretch: exercise.stretch || false,
      priority: exercise.priority || 1,
      goalPriority: exercise.goalPriority || false
    }
  }

  /**
   * Format equipment name
   * @param {string} equipment - Equipment key
   * @returns {string} - Formatted name
   */
  formatEquipment(equipment) {
    const equipmentMap = {
      'barbell': 'Barbell',
      'dumbbells': 'Dumbbells',
      'cable': 'Cable',
      'machine': 'Machine',
      'bodyweight': 'Bodyweight',
      'kettlebell': 'Kettlebell',
      'bands': 'Resistance Bands',
      'other': 'Other'
    }
    
    return equipmentMap[equipment] || equipment || 'Dumbbells'
  }

  /**
   * Format muscle group name
   * @param {string} muscle - Muscle key
   * @returns {string} - Formatted name
   */
  formatMuscle(muscle) {
    const muscleMap = {
      'chest': 'Borst',
      'back': 'Rug',
      'shoulders': 'Schouders',
      'biceps': 'Biceps',
      'triceps': 'Triceps',
      'legs': 'Benen',
      'core': 'Core',
      'glutes': 'Billen',
      'calves': 'Kuiten',
      'full_body': 'Full Body'
    }
    
    return muscleMap[muscle] || muscle || 'Full Body'
  }
}

// Export singleton factory
let serviceInstance = null

export function getWorkoutPDFService(db) {
  if (!serviceInstance) {
    serviceInstance = new WorkoutPDFService(db)
  }
  return serviceInstance
}

export default WorkoutPDFService
