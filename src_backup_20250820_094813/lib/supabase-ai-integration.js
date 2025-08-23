// src/lib/supabase-ai-integration.js
import { supabase } from './supabase.js'

/**
 * Save AI-generated workout plan to Supabase plan_library
 * @param {Object} planData - The generated schema from AI
 * @param {string} trainerId - UUID of the trainer creating the plan
 * @returns {Promise<Object>} - Saved plan data
 */
export async function savePlanToLibrary(planData, trainerId) {
  try {
    console.log('💾 Saving AI plan to Supabase...', { 
      name: planData.name, 
      trainerId 
    });

    const { data, error } = await supabase
      .from('plan_library')
      .insert({
        template_name: planData.name,
        template_data: planData, // Complete AI schema as JSONB
        tags: [
          planData.conditions?.goal || 'general',
          'ai_generated',
          `${planData.conditions?.experience || 'unknown'}_level`,
          `${planData.conditions?.daysPerWeek || 'unknown'}_days`
        ],
        created_by: trainerId,
        description: planData.description || `AI-generated ${planData.conditions?.goal} plan`,
        category: 'ai_generated'
      })
      .select()
      .single();
    
    if (error) {
      console.error('❌ Supabase save error:', error);
      throw error;
    }
    
    console.log('✅ Plan saved successfully:', data);
    return data;
    
  } catch (error) {
    console.error('❌ Error saving plan to library:', error);
    throw new Error(`Failed to save plan: ${error.message}`);
  }
}

/**
 * Get current authenticated user
 * @returns {Promise<Object>} - User object with id
 */
export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      throw error;
    }
    
    if (!user) {
      throw new Error('No authenticated user found');
    }
    
    return user;
    
  } catch (error) {
    console.error('❌ Error getting current user:', error);
    throw new Error(`Failed to get user: ${error.message}`);
  }
}

/**
 * Assign a plan from library to a client
 * @param {string} planId - ID of the plan in plan_library
 * @param {string} clientId - UUID of the client
 * @param {string} trainerId - UUID of the trainer
 * @returns {Promise<Object>} - Assignment data
 */
export async function assignPlanToClient(planId, clientId, trainerId) {
  try {
    console.log('📋 Assigning plan to client...', { planId, clientId });

    // First get the plan from library
    const { data: plan, error: planError } = await supabase
      .from('plan_library')
      .select('*')
      .eq('id', planId)
      .single();

    if (planError) {
      throw planError;
    }

    // Create workout_plans entry
    const { data, error } = await supabase
      .from('workout_plans')
      .insert({
        client_id: clientId,
        trainer_id: trainerId,
        plan_name: plan.template_name,
        plan_data: plan.template_data, // Copy the AI schema
        status: 'active',
        assigned_date: new Date().toISOString(),
        source_template_id: planId
      })
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    console.log('✅ Plan assigned successfully:', data);
    return data;
    
  } catch (error) {
    console.error('❌ Error assigning plan to client:', error);
    throw new Error(`Failed to assign plan: ${error.message}`);
  }
}

/**
 * Get all AI-generated plans from library for a trainer
 * @param {string} trainerId - UUID of the trainer
 * @returns {Promise<Array>} - Array of plans
 */
export async function getAIPlansForTrainer(trainerId) {
  try {
    const { data, error } = await supabase
      .from('plan_library')
      .select('*')
      .eq('created_by', trainerId)
      .contains('tags', ['ai_generated'])
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    return data || [];
    
  } catch (error) {
    console.error('❌ Error fetching AI plans:', error);
    throw new Error(`Failed to fetch AI plans: ${error.message}`);
  }
}

/**
 * Update an existing plan in the library
 * @param {string} planId - ID of the plan to update
 * @param {Object} updatedPlanData - Updated plan schema
 * @returns {Promise<Object>} - Updated plan data
 */
export async function updatePlanInLibrary(planId, updatedPlanData) {
  try {
    console.log('🔄 Updating plan in library...', { planId });

    const { data, error } = await supabase
      .from('plan_library')
      .update({
        template_name: updatedPlanData.name,
        template_data: updatedPlanData,
        description: updatedPlanData.description,
        updated_at: new Date().toISOString()
      })
      .eq('id', planId)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    console.log('✅ Plan updated successfully:', data);
    return data;
    
  } catch (error) {
    console.error('❌ Error updating plan:', error);
    throw new Error(`Failed to update plan: ${error.message}`);
  }
}

/**
 * Import exercise ratings from CSV data
 * @param {string} csvData - Raw CSV string
 * @returns {Object} - Parsed exercise ratings
 */
export function parseExerciseRatingsCSV(csvData) {
  try {
    const lines = csvData.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    const exerciseRatings = {};
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      
      if (values.length < 3) continue; // Skip invalid rows
      
      const exerciseName = values[0];
      const metric = values[1];
      const value = parseFloat(values[2]) || 2;
      
      if (!exerciseName || !metric) continue;
      
      if (!exerciseRatings[exerciseName]) {
        exerciseRatings[exerciseName] = {
          strength: 2,
          hypertrophy: 2,
          personal: 2
        };
      }
      
      if (metric.toLowerCase().includes('strength')) {
        exerciseRatings[exerciseName].strength = value;
      } else if (metric.toLowerCase().includes('hypertrophy')) {
        exerciseRatings[exerciseName].hypertrophy = value;
      } else if (metric.toLowerCase().includes('personal')) {
        exerciseRatings[exerciseName].personal = value;
      }
    }
    
    console.log(`✅ Parsed ${Object.keys(exerciseRatings).length} exercise ratings from CSV`);
    return exerciseRatings;
    
  } catch (error) {
    console.error('❌ Error parsing CSV:', error);
    throw new Error(`Failed to parse CSV: ${error.message}`);
  }
}

/**
 * Generate client summary from plan data for easy overview
 * @param {Object} planData - AI generated plan
 * @returns {Object} - Client-friendly summary
 */
export function generateClientSummary(planData) {
  const summary = {
    planName: planData.name,
    goal: planData.conditions?.goal || 'General Fitness',
    daysPerWeek: planData.conditions?.daysPerWeek || 'Unknown',
    estimatedTime: '60-75 minutes per session',
    totalExercises: 0,
    keyFeatures: [],
    weekOverview: {}
  };
  
  // Count exercises and build overview
  if (planData.weekStructure) {
    Object.keys(planData.weekStructure).forEach(dayKey => {
      const day = planData.weekStructure[dayKey];
      summary.totalExercises += day.exercises?.length || 0;
      summary.weekOverview[dayKey] = {
        name: day.name,
        focus: day.focus,
        exerciseCount: day.exercises?.length || 0
      };
    });
  }
  
  // Add key features based on plan content
  if (planData.mode === 'ai_generated') {
    summary.keyFeatures.push('🧠 AI-Generated');
  }
  
  if (planData.volumeAnalysis?.recommendations?.some(r => r.includes('stretch-tension'))) {
    summary.keyFeatures.push('🔥 Stretch-Tension Focus');
  }
  
  if (planData.conditions?.goal === 'hypertrophy') {
    summary.keyFeatures.push('💪 Hypertrophy Optimized');
  }
  
  summary.keyFeatures.push('📈 Progressive Overload');
  summary.keyFeatures.push('⚡ Science-Based');
  
  return summary;
}
