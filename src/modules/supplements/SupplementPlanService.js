// src/modules/supplements/SupplementPlanService.js

import DatabaseService from '../../services/DatabaseService'

/**
 * SupplementPlanService
 * Extends DatabaseService with supplement-related database operations
 * Handles: Templates, Products (buy links), Client Plans
 */

// ============================================
// SUPPLEMENT TEMPLATES
// ============================================

DatabaseService.getSupplementTemplates = async function() {
  try {
    const { data, error } = await this.supabase
      .from('supplement_templates')
      .select('*')
      .eq('active', true)
      .order('priority_level', { ascending: false })
    
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('❌ Failed to fetch supplement templates:', error)
    return []
  }
}

DatabaseService.getSupplementTemplateById = async function(supplementId) {
  try {
    const { data, error } = await this.supabase
      .from('supplement_templates')
      .select('*')
      .eq('supplement_id', supplementId)
      .eq('active', true)
      .single()
    
    if (error) throw error
    return data
  } catch (error) {
    console.error(`❌ Failed to fetch template ${supplementId}:`, error)
    return null
  }
}

// ============================================
// SUPPLEMENT PRODUCTS (Buy Links)
// ============================================

DatabaseService.getSupplementProducts = async function(category = null) {
  try {
    let query = this.supabase
      .from('supplement_products')
      .select('*')
      .eq('active', true)
      .eq('in_stock', true)
      .order('priority', { ascending: false })
    
    if (category) {
      query = query.eq('category', category)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('❌ Failed to fetch supplement products:', error)
    return []
  }
}

// ============================================
// SUPPLEMENT PLANS (Client Plans)
// ============================================

DatabaseService.getSupplementPlan = async function(clientId) {
  try {
    const { data, error } = await this.supabase
      .from('supplement_plans')
      .select('*')
      .eq('client_id', clientId)
      .eq('status', 'active')
      .single()
    
    if (error) {
      // No active plan found = expected scenario
      if (error.code === 'PGRST116') return null
      throw error
    }
    
    return data
  } catch (error) {
    console.error('❌ Failed to fetch supplement plan:', error)
    return null
  }
}

DatabaseService.getAllSupplementPlans = async function(coachId, status = null) {
  try {
    let query = this.supabase
      .from('supplement_plans')
      .select(`
        *,
        client:clients(
          id, 
          first_name, 
          last_name, 
          email, 
          current_weight, 
          days_per_week
        )
      `)
    
    if (coachId) {
      query = query.eq('coach_id', coachId)
    }
    
    if (status) {
      query = query.eq('status', status)
    }
    
    query = query.order('created_at', { ascending: false })
    
    const { data, error } = await query
    
    if (error) throw error
    
    // Merge first_name + last_name into name for compatibility
    const enrichedData = (data || []).map(plan => ({
      ...plan,
      client: plan.client ? {
        ...plan.client,
        name: `${plan.client.first_name} ${plan.client.last_name}`,
        weight: plan.client.current_weight,
        training_frequency: plan.client.days_per_week
      } : null
    }))
    
    return enrichedData
  } catch (error) {
    console.error('❌ Failed to fetch all supplement plans:', error)
    return []
  }
}

DatabaseService.createSupplementPlan = async function(planData) {
  try {
    const {
      client_id,
      coach_id,
      supplements,
      client_weight,
      training_frequency,
      goal,
      coach_notes,
      status = 'draft'
    } = planData
    
    const { data, error } = await this.supabase
      .from('supplement_plans')
      .insert({
        client_id,
        coach_id,
        supplements,
        client_weight,
        training_frequency,
        goal,
        coach_notes,
        status
      })
      .select()
      .single()
    
    if (error) throw error
    
    console.log('✅ Supplement plan created:', data.id)
    return data
  } catch (error) {
    console.error('❌ Failed to create supplement plan:', error)
    return null
  }
}

DatabaseService.updateSupplementPlan = async function(planId, updates) {
  try {
    const { data, error } = await this.supabase
      .from('supplement_plans')
      .update(updates)
      .eq('id', planId)
      .select()
      .single()
    
    if (error) throw error
    
    console.log('✅ Supplement plan updated:', planId)
    return data
  } catch (error) {
    console.error('❌ Failed to update supplement plan:', error)
    return null
  }
}

DatabaseService.approveSupplementPlan = async function(planId) {
  try {
    const { data, error } = await this.supabase
      .from('supplement_plans')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString()
      })
      .eq('id', planId)
      .select()
      .single()
    
    if (error) throw error
    
    console.log('✅ Supplement plan approved:', planId)
    return data
  } catch (error) {
    console.error('❌ Failed to approve supplement plan:', error)
    return null
  }
}

DatabaseService.activateSupplementPlan = async function(planId, clientId) {
  try {
    // First, deactivate any existing active plan for this client
    await this.supabase
      .from('supplement_plans')
      .update({ status: 'archived' })
      .eq('client_id', clientId)
      .eq('status', 'active')
    
    // Then activate the new plan
    const { data, error } = await this.supabase
      .from('supplement_plans')
      .update({ 
        status: 'active',
        approved_at: new Date().toISOString()
      })
      .eq('id', planId)
      .select()
      .single()
    
    if (error) throw error
    
    console.log('✅ Supplement plan activated:', planId)
    return data
  } catch (error) {
    console.error('❌ Failed to activate supplement plan:', error)
    return null
  }
}

DatabaseService.deleteSupplementPlan = async function(planId) {
  try {
    const { error } = await this.supabase
      .from('supplement_plans')
      .delete()
      .eq('id', planId)
    
    if (error) throw error
    
    console.log('✅ Supplement plan deleted:', planId)
    return true
  } catch (error) {
    console.error('❌ Failed to delete supplement plan:', error)
    return false
  }
}

// ============================================
// TEMPLATE GENERATOR (Auto-generate based on client stats)
// ============================================

DatabaseService.generateSupplementPlanFromTemplate = async function(
  clientWeight, 
  trainingFreq, 
  goal = 'bulk'
) {
  try {
    // Fetch all templates
    const templates = await this.getSupplementTemplates()
    
    if (!templates || templates.length === 0) {
      console.error('❌ No supplement templates found')
      return []
    }
    
    // Build supplement plan based on priority
    const supplements = []
    
    // ESSENTIAL (always include)
    const creatine = templates.find(t => t.supplement_id === 'creatine')
    if (creatine) {
      supplements.push(await this.enrichSupplementWithProducts(creatine))
    }
    
    // RECOMMENDED (include for all goals)
    const recommended = templates.filter(t => t.priority_level === 'recommended')
    for (const template of recommended) {
      supplements.push(await this.enrichSupplementWithProducts(template))
    }
    
    // OPTIONAL (conditionally include)
    // Add Whey if high training frequency (5+ days/week)
    if (trainingFreq >= 5) {
      const whey = templates.find(t => t.supplement_id === 'whey')
      if (whey) {
        supplements.push({
          ...await this.enrichSupplementWithProducts(whey),
          custom_notes: 'Aanbevolen vanwege 5+ trainingen/week voor gemakkelijkere eiwit intake'
        })
      }
    }
    
    // Add Casein for bulk goal (optional convenience)
    if (goal === 'bulk') {
      const casein = templates.find(t => t.supplement_id === 'casein')
      if (casein) {
        supplements.push({
          ...await this.enrichSupplementWithProducts(casein),
          custom_notes: 'Optioneel - alternatief voor cottage cheese voor bed'
        })
      }
    }
    
    return supplements
    
  } catch (error) {
    console.error('❌ Failed to generate supplement plan:', error)
    return []
  }
}

// Helper: Enrich template with product buy links
DatabaseService.enrichSupplementWithProducts = async function(template) {
  try {
    // Fetch products for this category
    const products = await this.getSupplementProducts(template.supplement_id)
    
    // Extract product IDs (top 3 by priority)
    const productIds = products.slice(0, 3).map(p => p.id)
    
    return {
      template_id: template.supplement_id,
      name: template.name,
      emoji: template.emoji,
      category: template.category,
      dosage: template.dosage,
      timing: template.timing,
      priority_level: template.priority_level,
      benefits: template.benefits,
      instructions: template.instructions,
      cost_per_month: template.cost_per_month,
      safety_notes: template.safety_notes,
      product_ids: productIds, // Links to supplement_products
      products: products.slice(0, 3), // Include full product data for display
      custom_notes: null
    }
  } catch (error) {
    console.error('❌ Failed to enrich supplement with products:', error)
    return template
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

DatabaseService.calculateTotalSupplementCost = function(supplements) {
  if (!supplements || supplements.length === 0) return 0
  
  return supplements.reduce((total, supp) => {
    return total + (supp.cost_per_month || 0)
  }, 0)
}

DatabaseService.groupSupplementsByTiming = function(supplements) {
  const grouped = {
    morning: [],
    afternoon: [],
    evening: [],
    before_bed: [],
    flexible: []
  }
  
  supplements.forEach(supp => {
    const timeOfDay = supp.timing?.time_of_day || 'flexible'
    if (grouped[timeOfDay]) {
      grouped[timeOfDay].push(supp)
    } else {
      grouped.flexible.push(supp)
    }
  })
  
  return grouped
}

DatabaseService.getSupplementsByPriority = function(supplements, priorityLevel) {
  return supplements.filter(s => s.priority_level === priorityLevel)
}

// Export (not needed since we're extending DatabaseService directly)
export default DatabaseService
