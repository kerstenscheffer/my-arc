// src/modules/ai-meal-generator/tabs/PlanBuilder.jsx
// FIXED VERSION - Works with forcedMealsConfig frequency control

import { useState, useEffect } from 'react'
import { Calendar, Brain, ToggleLeft, ToggleRight, Grid3x3, Target, CheckCircle, Zap, Hash } from 'lucide-react'
import ConfigurationOverview from './plan-builder/ConfigurationOverview'
import GenerationControls from './plan-builder/GenerationControls'
import WeekPlanDisplay from './plan-builder/WeekPlanDisplay'
import PlanStatistics from './plan-builder/PlanStatistics'
import { CompleteDynamicOptimizer } from '../CompleteDynamicOptimizer'

export default function PlanBuilder({
  db,
  selectedClient,
  clientProfile,
  dailyTargets,
  mealsPerDay,
  forcedMealsConfig,         // NOW USING CONFIG FORMAT
  excludedIngredients,
  selectedIngredients,
  mealPreferences,
  setGeneratedPlan,
  isMobile
}) {
  // States
  const [activeDay, setActiveDay] = useState(0)
  const [generating, setGenerating] = useState(false)
  const [generationStats, setGenerationStats] = useState(null)
  const [currentPlan, setCurrentPlan] = useState(null)
  const [planStats, setPlanStats] = useState(null)
  const [aiService, setAiService] = useState(null)
  const [dynamicOptimizer, setDynamicOptimizer] = useState(null)
  
  // Enhanced toggle states
  const [forcedMealsOnly, setForcedMealsOnly] = useState(false)
  const [fillAllSlots, setFillAllSlots] = useState(true)
  const [enableMacroOptimization, setEnableMacroOptimization] = useState(true)
  const [fillMode, setFillMode] = useState('smart_repeat')
  
  // Calculate total slots dynamically
  const totalSlots = 7 * mealsPerDay
  
  // Extract meals from config for compatibility
  const forcedMeals = forcedMealsConfig ? forcedMealsConfig.map(config => config.meal) : []
  
  // Calculate total frequency
  const totalFrequency = forcedMealsConfig ? 
    forcedMealsConfig.reduce((sum, config) => sum + config.frequency, 0) : 0
  
  // Initialize Complete Dynamic Services
  useEffect(() => {
    const initServices = async () => {
      try {
        const aiSvc = await db.getAIMealPlanningService()
        setAiService(aiSvc)
        
        // Initialize Complete Dynamic Optimizer
        const optimizer = new CompleteDynamicOptimizer(db, aiSvc)
        setDynamicOptimizer(optimizer)
        
        console.log(`✅ Dynamic services initialized for ${mealsPerDay} meals/day (${totalSlots} slots)`)
        console.log(`📊 Forced meals: ${forcedMealsConfig?.length || 0} meals with total frequency ${totalFrequency}`)
      } catch (error) {
        console.error('Failed to initialize services:', error)
        if (db.supabase) {
          const { getAIMealPlanningService } = await import('../AIMealPlanningService')
          const aiSvc = getAIMealPlanningService(db.supabase)
          setAiService(aiSvc)
          
          const optimizer = new CompleteDynamicOptimizer(db, aiSvc)
          setDynamicOptimizer(optimizer)
        }
      }
    }
    
    if (selectedClient && db && mealsPerDay) {
      initServices()
    }
  }, [selectedClient, db, mealsPerDay])
  
  // Calculate dynamic meal usage based on frequency config
  const calculateDynamicMealUsage = () => {
    if (!forcedMealsConfig || forcedMealsConfig.length === 0) return {}
    
    const usage = {}
    forcedMealsConfig.forEach(config => {
      usage[config.meal.id] = config.frequency
    })
    
    return usage
  }
  
  // COMPLETE DYNAMIC PLAN GENERATION WITH FREQUENCY CONTROL
  const handleGeneratePlan = async () => {
    if (!aiService || !dynamicOptimizer) {
      console.error('Services not initialized')
      return
    }
    
    setGenerating(true)
    setGenerationStats({
      step: `Initialiseren ${mealsPerDay} maaltijden/dag met frequency control...`,
      progress: 0
    })
    
    try {
      let generatedPlan
      let allMeals = []
      
      console.log(`🎯 TARGET: ${totalSlots} total slots (${mealsPerDay} meals × 7 days)`)
      console.log(`📊 FREQUENCY: ${totalFrequency}/${totalSlots} slots toegewezen via frequency control`)
      
      // PHASE 1: CREATE DYNAMIC BASE STRUCTURE
      setGenerationStats({
        step: `Dynamische week structuur maken (${totalSlots} slots)...`,
        progress: 5
      })
      
      // Create dynamic week structure based on meals per day
      let weekPlan = []
      for (let day = 0; day < 7; day++) {
        const dayStructure = {
          breakfast: null,
          lunch: null,
          dinner: null,
          totals: { kcal: 0, protein: 0, carbs: 0, fat: 0 },
          accuracy: { total: 100, calories: 100, protein: 100 }
        }
        
        // Add dynamic slots based on meals per day
        if (mealsPerDay > 3) {
          const extraMeals = mealsPerDay - 3
          for (let i = 0; i < extraMeals; i++) {
            dayStructure[`snack${i + 1}`] = null
          }
        }
        
        weekPlan.push(dayStructure)
      }
      
      // PHASE 2: BASE PLAN GENERATION
      if (forcedMealsOnly && forcedMealsConfig && forcedMealsConfig.length > 0) {
        console.log(`🔒 FORCED MEALS ONLY MODE - Using frequency control`)
        
        setGenerationStats({
          step: `Frequency-based placement: ${totalFrequency}/${totalSlots} slots...`,
          progress: 15
        })
        
        // FREQUENCY-BASED DISTRIBUTION
        if (fillAllSlots || totalFrequency > 0) {
          // Create meal pool based on frequencies
          const mealPool = []
          forcedMealsConfig.forEach(config => {
            for (let i = 0; i < config.frequency; i++) {
              mealPool.push({
                ...config.meal,
                allowedTimings: config.allowedTimings,
                locked: config.locked,
                forced: true,
                fromFrequency: true
              })
            }
          })
          
          console.log(`📊 Meal pool created: ${mealPool.length} meals from frequency settings`)
          
          // If pool doesn't fill all slots, add more intelligently
          if (mealPool.length < totalSlots && fillAllSlots) {
            console.log(`⚡ Auto-filling ${totalSlots - mealPool.length} remaining slots...`)
            
            // Calculate how many more of each meal we need
            const remainingSlots = totalSlots - mealPool.length
            const mealsCount = forcedMealsConfig.length
            const baseExtra = Math.floor(remainingSlots / mealsCount)
            const leftover = remainingSlots % mealsCount
            
            forcedMealsConfig.forEach((config, index) => {
              const extraCount = baseExtra + (index < leftover ? 1 : 0)
              for (let i = 0; i < extraCount; i++) {
                mealPool.push({
                  ...config.meal,
                  allowedTimings: config.allowedTimings,
                  locked: config.locked,
                  forced: true,
                  autoFilled: true
                })
              }
            })
          }
          
          // Smart distribution across week with timing respect
          weekPlan = await dynamicOptimizer.distributeWithFrequencyControl(
            weekPlan,
            mealPool,
            {
              mealsPerDay: mealsPerDay,
              respectTiming: true,
              balanceDistribution: true,
              dailyTargets: dailyTargets, // PASS TARGETS FOR AUTO-SCALING
              onProgress: (progressInfo) => {
                setGenerationStats({
                  step: progressInfo.step,
                  progress: 15 + (progressInfo.progress * 0.35)
                })
              }
            }
          )
          
          dynamicOptimizer.updateAllDayTotals(weekPlan)
          
          // CRITICAL: Normalize snacks structure
          dynamicOptimizer.normalizeSnacksStructure(weekPlan, mealsPerDay)
        }
        
        generatedPlan = {
          weekPlan: weekPlan,
          dailyTargets: dailyTargets,
          stats: {
            averageAccuracy: 85,
            varietyScore: 100,
            complianceScore: 100,
            mealVariety: new Set(forcedMeals.map(m => m.id)),
            weekComplete: dynamicOptimizer.countEmptySlotsDynamic(weekPlan, mealsPerDay).total === 0,
            totalSlots: totalSlots,
            mealsPerDay: mealsPerDay,
            frequencyUsed: totalFrequency,
            forcedMealsCount: forcedMealsConfig.length
          },
          aiAnalysis: {
            averageScore: 0,
            message: `Frequency control: ${totalFrequency}/${totalSlots} slots via configuration`
          },
          forcedMealsOnlyMode: true,
          dynamicMode: true,
          mealsPerDay: mealsPerDay,
          frequencyControlled: true
        }
        
        // Load meals for optimization if needed
        if (enableMacroOptimization) {
          setGenerationStats({
            step: 'AI meals laden voor optimalisatie...',
            progress: 50
          })
          allMeals = await aiService.loadAIMeals()
        }
        
      } else {
        console.log(`🤖 AI MODE ACTIVE - ${totalSlots} slots with frequency hints`)
        
        setGenerationStats({
          step: 'AI profiel configureren...',
          progress: 10
        })
        
        const aiProfile = await aiService.ensureClientProfile(selectedClient)
        
        const updatedProfile = {
          ...aiProfile,
          target_calories: dailyTargets.calories,
          target_protein_g: dailyTargets.protein,
          target_carbs_g: dailyTargets.carbs,
          target_fat_g: dailyTargets.fat,
          meals_per_day: mealsPerDay,
          budget_tier: mealPreferences.budgetTier || 'moderate',
          allergies: excludedIngredients
            .filter(ing => ing.reason === 'allergie')
            .map(ing => ing.name || ing.id),
          excluded_ingredients: excludedIngredients.map(ing => ({
            id: ing.id,
            name: ing.name || ing.label || ing.id
          })),
          selected_ingredients: selectedIngredients.map(ing => ({
            id: ing.id,
            name: ing.name || ing.label || ing.id
          })),
          // Pass frequency hints to AI
          forcedMealsWithFrequency: forcedMealsConfig || []
        }
        
        setGenerationStats({
          step: 'AI meals database laden...',
          progress: 20
        })
        
        allMeals = await aiService.loadAIMeals()
        console.log(`Loaded ${allMeals.length} meals for AI analysis`)
        
        setGenerationStats({
          step: 'AI scoring met frequency hints...',
          progress: 30
        })
        
        // Score meals with frequency boost for forced meals
        const scoredMeals = aiService.scoreAllMeals(
          allMeals, 
          updatedProfile, 
          updatedProfile.excluded_ingredients,
          updatedProfile.selected_ingredients
        ).map(meal => {
          // Boost score for forced meals based on frequency
          const forcedConfig = forcedMealsConfig?.find(config => config.meal.id === meal.id)
          if (forcedConfig) {
            meal.aiScore = Math.max(meal.aiScore, 80) + (forcedConfig.frequency * 2)
            meal.frequencyHint = forcedConfig.frequency
          }
          return meal
        })
        
        const eligibleMeals = scoredMeals.filter(m => m.aiScore >= 0)
        console.log(`${eligibleMeals.length} meals passed AI scoring (with frequency boosts)`)
        
        setGenerationStats({
          step: `AI weekplan genereren met frequency hints...`,
          progress: 40
        })
        
        generatedPlan = await aiService.generateWeekPlan(updatedProfile, {
          days: 7,
          variationLevel: mealPreferences.avoidRepeats ? 'high' : 'medium',
          avoidDuplicates: mealPreferences.avoidRepeats,
          respectPortionLimits: true,
          forcedMeals: forcedMeals,
          forcedMealsConfig: forcedMealsConfig, // Pass full config to AI
          excludedIngredients: updatedProfile.excluded_ingredients,
          selectedIngredients: updatedProfile.selected_ingredients
        })
        
        // Mark forced meals in the plan
        if (forcedMealsConfig && forcedMealsConfig.length > 0) {
          generatedPlan.weekPlan.forEach(day => {
            Object.keys(day).forEach(slot => {
              if (slot !== 'totals' && slot !== 'accuracy' && day[slot]) {
                const config = forcedMealsConfig.find(c => c.meal.id === day[slot].id)
                if (config) {
                  day[slot].forced = true
                  day[slot].frequency = config.frequency
                }
              }
            })
          })
        }
        
        // ENSURE AI PLAN IS COMPLETE
        setGenerationStats({
          step: `Controleren op lege slots (target: ${totalSlots})...`,
          progress: 45
        })
        
        const emptySlots = dynamicOptimizer.countEmptySlotsDynamic(generatedPlan.weekPlan, mealsPerDay)
        if (emptySlots.total > 0) {
          console.log(`⚠️ AI plan has ${emptySlots.total}/${totalSlots} empty slots, filling...`)
          
          generatedPlan.weekPlan = await dynamicOptimizer.fillCompleteWeek(
            generatedPlan.weekPlan,
            forcedMeals,
            eligibleMeals,
            {
              mealsPerDay: mealsPerDay,
              fillMode: forcedMeals.length > 0 ? 'mixed' : 'ai_fill',
              respectTiming: true,
              onProgress: (progressInfo) => {
                setGenerationStats({
                  step: `Lege slots vullen: ${progressInfo.step}`,
                  progress: 45 + (progressInfo.progress * 0.05)
                })
              }
            }
          )
        }
        
        generatedPlan.mealsPerDay = mealsPerDay
        generatedPlan.stats.totalSlots = totalSlots
        generatedPlan.stats.frequencyUsed = totalFrequency
      }
      
      // PHASE 3: DYNAMIC MACRO OPTIMIZATION
      if (enableMacroOptimization && dynamicOptimizer) {
        setGenerationStats({
          step: `Dynamic macro optimization (${totalSlots} slots)...`,
          progress: 60
        })
        
        console.log(`🎯 Starting dynamic macro optimization for ${totalSlots} slots...`)
        
        // Filter available meals for optimization
        const availableForOptimization = allMeals.filter(meal => {
          // Don't swap locked meals
          const config = forcedMealsConfig?.find(c => c.meal.id === meal.id)
          return !config?.locked
        })
        
        const optimizationResult = await dynamicOptimizer.optimizeFilledWeek(
          generatedPlan.weekPlan,
          dailyTargets,
          availableForOptimization,
          {
            tolerance: 0.05,
            maxIterations: 15,
            respectForcedMeals: true,
            respectFrequency: forcedMealsConfig, // Pass frequency config
            fillEmptySlots: true,
            mealsPerDay: mealsPerDay,
            onProgress: (progressInfo) => {
              setGenerationStats({
                step: progressInfo.step,
                progress: 60 + (progressInfo.progress * 0.25)
              })
            }
          }
        )
        
        // Update plan with optimized version
        generatedPlan.weekPlan = optimizationResult.optimizedPlan
        generatedPlan.stats.dynamicOptimizationStats = optimizationResult.stats
        generatedPlan.optimizationLog = optimizationResult.log
        
        console.log('✅ Dynamic optimization complete:', optimizationResult.stats)
        
        setGenerationStats({
          step: `Optimalisatie voltooid! ${optimizationResult.stats.filledSlots}/${optimizationResult.stats.totalSlots} slots gevuld`,
          progress: 85,
          optimized: true,
          weekComplete: optimizationResult.stats.weekComplete,
          filledSlots: optimizationResult.stats.filledSlots,
          totalSlots: optimizationResult.stats.totalSlots
        })
      }
      
      // PHASE 4: FINALIZATION
      setGenerationStats({
        step: 'Boodschappenlijst genereren...',
        progress: 90
      })
      
      const shoppingList = aiService.generateShoppingList(generatedPlan.weekPlan)
      
      setGenerationStats({
        step: 'Plan finaliseren...',
        progress: 95
      })
      
      // Final validation with frequency check
      const finalEmptySlots = dynamicOptimizer.countEmptySlotsDynamic(generatedPlan.weekPlan, mealsPerDay)
      const isWeekComplete = finalEmptySlots.total === 0
      const filledSlots = totalSlots - finalEmptySlots.total
      
      // Validate frequency compliance
      const frequencyCompliance = dynamicOptimizer.validateFrequencyCompliance(
        generatedPlan.weekPlan,
        forcedMealsConfig
      )
      
      console.log(`📊 Final validation: ${isWeekComplete ? 'COMPLETE' : 'INCOMPLETE'} week`)
      console.log(`📊 Filled: ${filledSlots}/${totalSlots} slots`)
      console.log(`📊 Frequency compliance: ${frequencyCompliance.compliant ? 'YES' : 'NO'}`)
      
      setCurrentPlan(generatedPlan)
      setPlanStats({
        ...generatedPlan.stats,
        shoppingList,
        selectedIngredientsUsed: selectedIngredients.length,
        excludedIngredientsAvoided: excludedIngredients.length,
        forcedMealsUsed: forcedMealsConfig?.length || 0,
        mode: forcedMealsOnly ? 'forced-only' : 'ai-enhanced',
        macroOptimized: enableMacroOptimization,
        weekComplete: isWeekComplete,
        filledSlots: filledSlots,
        totalSlots: totalSlots,
        mealsPerDay: mealsPerDay,
        frequencyCompliance: frequencyCompliance,
        dynamicOptimizationStats: generatedPlan.stats?.dynamicOptimizationStats
      })
      
      if (setGeneratedPlan) {
        setGeneratedPlan(generatedPlan)
      }
      
      setGenerationStats({
        step: isWeekComplete 
          ? `Voltooid! Complete week: ${filledSlots}/${totalSlots} slots (Frequency: ${frequencyCompliance.compliant ? '✓' : '✗'})`
          : `Voltooid! ${filledSlots}/${totalSlots} slots gevuld`,
        progress: 100,
        success: true,
        weekComplete: isWeekComplete,
        optimized: enableMacroOptimization,
        filledSlots: filledSlots,
        totalSlots: totalSlots,
        frequencyCompliant: frequencyCompliance.compliant
      })
      
    } catch (error) {
      console.error('Error in dynamic generation:', error)
      setGenerationStats({
        step: `Fout: ${error.message}`,
        progress: 0,
        error: true
      })
    } finally {
      setTimeout(() => {
        setGenerating(false)
        if (generationStats?.success) {
          setGenerationStats(null)
        }
      }, 3500)
    }
  }
  
  if (!selectedClient) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '3rem',
        color: 'rgba(255,255,255,0.5)'
      }}>
        <Calendar size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
        <p>Selecteer eerst een client en stel voorkeuren in</p>
      </div>
    )
  }
  
  const mealUsagePreview = calculateDynamicMealUsage()
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: isMobile ? '1rem' : '1.5rem'
    }}>
      {/* Header */}
      <div>
        <h2 style={{
          fontSize: isMobile ? '1.25rem' : '1.5rem',
          fontWeight: '700',
          color: '#fff',
          marginBottom: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Zap size={24} style={{ color: '#10b981' }} />
          Dynamic Frequency Generator
        </h2>
        <p style={{
          fontSize: isMobile ? '0.875rem' : '0.95rem',
          color: 'rgba(255,255,255,0.6)'
        }}>
          {mealsPerDay} maaltijden/dag • {totalSlots} slots • Frequency: {totalFrequency}/{totalSlots} configured
        </p>
      </div>
      
      {/* DYNAMIC SLOT OVERVIEW */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)',
        borderRadius: '12px',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        padding: isMobile ? '1rem' : '1.25rem'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.75rem'
        }}>
          <div>
            <h3 style={{
              fontSize: isMobile ? '0.95rem' : '1.05rem',
              fontWeight: '600',
              color: '#3b82f6',
              marginBottom: '0.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Hash size={20} />
              Frequency Control Status
            </h3>
            <p style={{
              fontSize: isMobile ? '0.8rem' : '0.85rem',
              color: 'rgba(255,255,255,0.6)'
            }}>
              {forcedMealsConfig && forcedMealsConfig.length > 0
                ? `${forcedMealsConfig.length} meals configured → ${totalFrequency} slots assigned`
                : 'No frequency configuration - AI will fill all slots'
              }
            </p>
          </div>
          
          <div style={{
            padding: '0.5rem 0.75rem',
            background: totalFrequency === totalSlots 
              ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
              : totalFrequency > totalSlots
              ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
              : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            borderRadius: '10px',
            fontSize: isMobile ? '0.8rem' : '0.9rem',
            fontWeight: '700',
            color: '#fff'
          }}>
            {totalFrequency}/{totalSlots}
          </div>
        </div>
        
        {/* Frequency breakdown per meal */}
        {forcedMealsConfig && forcedMealsConfig.length > 0 && (
          <div style={{
            marginTop: '1rem',
            paddingTop: '1rem',
            borderTop: '1px solid rgba(59, 130, 246, 0.2)'
          }}>
            <h4 style={{
              fontSize: '0.85rem',
              fontWeight: '600',
              color: '#3b82f6',
              marginBottom: '0.75rem'
            }}>
              Meal Frequency Distribution:
            </h4>
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
              gap: '0.5rem'
            }}>
              {forcedMealsConfig.map(config => (
                <div key={config.meal.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.5rem 0.75rem',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: '8px',
                  border: '1px solid rgba(16, 185, 129, 0.1)'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      color: 'rgba(255,255,255,0.9)', 
                      fontSize: '0.85rem',
                      fontWeight: '500'
                    }}>
                      {config.meal.name.length > 25 
                        ? config.meal.name.substring(0, 25) + '...' 
                        : config.meal.name}
                    </div>
                    <div style={{ 
                      color: 'rgba(255,255,255,0.5)', 
                      fontSize: '0.7rem',
                      marginTop: '2px'
                    }}>
                      {config.allowedTimings?.join(', ') || 'All timings'}
                      {config.locked && ' • 🔒 Locked'}
                    </div>
                  </div>
                  <div style={{
                    padding: '0.25rem 0.5rem',
                    background: config.frequency > mealsPerDay 
                      ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                      : 'rgba(59, 130, 246, 0.2)',
                    borderRadius: '6px',
                    fontSize: '0.9rem',
                    fontWeight: '700',
                    color: '#fff',
                    minWidth: '35px',
                    textAlign: 'center'
                  }}>
                    {config.frequency}×
                  </div>
                </div>
              ))}
            </div>
            
            {/* Frequency status message */}
            <div style={{
              marginTop: '0.75rem',
              padding: '0.5rem 0.75rem',
              background: totalFrequency === totalSlots
                ? 'rgba(16, 185, 129, 0.1)'
                : totalFrequency > totalSlots
                ? 'rgba(239, 68, 68, 0.1)'
                : 'rgba(59, 130, 246, 0.1)',
              borderRadius: '6px',
              fontSize: '0.75rem',
              color: totalFrequency === totalSlots
                ? '#10b981'
                : totalFrequency > totalSlots
                ? '#ef4444'
                : '#3b82f6'
            }}>
              {totalFrequency === totalSlots
                ? '✓ Perfect match - all slots will be filled exactly'
                : totalFrequency > totalSlots
                ? `⚠️ Over-configured by ${totalFrequency - totalSlots} slots - will distribute best possible`
                : `${totalSlots - totalFrequency} slots remaining for AI to fill or auto-repeat`
              }
            </div>
          </div>
        )}
        
        {/* Slot breakdown */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          gap: '0.5rem',
          fontSize: '0.8rem',
          marginTop: '1rem'
        }}>
          <div style={{
            padding: '0.5rem',
            background: 'rgba(16, 185, 129, 0.1)',
            borderRadius: '6px',
            textAlign: 'center'
          }}>
            <div style={{ color: '#10b981', fontWeight: '600' }}>Breakfast</div>
            <div style={{ color: 'rgba(255,255,255,0.6)' }}>7 slots</div>
          </div>
          <div style={{
            padding: '0.5rem',
            background: 'rgba(245, 158, 11, 0.1)',
            borderRadius: '6px',
            textAlign: 'center'
          }}>
            <div style={{ color: '#f59e0b', fontWeight: '600' }}>Lunch</div>
            <div style={{ color: 'rgba(255,255,255,0.6)' }}>7 slots</div>
          </div>
          <div style={{
            padding: '0.5rem',
            background: 'rgba(239, 68, 68, 0.1)',
            borderRadius: '6px',
            textAlign: 'center'
          }}>
            <div style={{ color: '#ef4444', fontWeight: '600' }}>Dinner</div>
            <div style={{ color: 'rgba(255,255,255,0.6)' }}>7 slots</div>
          </div>
          {mealsPerDay > 3 && (
            <div style={{
              padding: '0.5rem',
              background: 'rgba(139, 92, 246, 0.1)',
              borderRadius: '6px',
              textAlign: 'center'
            }}>
              <div style={{ color: '#8b5cf6', fontWeight: '600' }}>Snacks</div>
              <div style={{ color: 'rgba(255,255,255,0.6)' }}>{(mealsPerDay - 3) * 7} slots</div>
            </div>
          )}
        </div>
      </div>
      
      {/* ENHANCED CONTROLS SECTION */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
        borderRadius: '12px',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        padding: isMobile ? '1rem' : '1.25rem'
      }}>
        {/* Complete Week Toggle */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1rem'
        }}>
          <div>
            <h3 style={{
              fontSize: isMobile ? '0.95rem' : '1.05rem',
              fontWeight: '600',
              color: '#10b981',
              marginBottom: '0.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Grid3x3 size={20} />
              Complete Week Filling
            </h3>
            <p style={{
              fontSize: isMobile ? '0.8rem' : '0.85rem',
              color: 'rgba(255,255,255,0.6)'
            }}>
              {fillAllSlots 
                ? `Zorgt ervoor dat ALLE ${totalSlots} slots worden gevuld`
                : 'Basic placement - kan lege slots hebben'
              }
            </p>
          </div>
          
          <button
            onClick={() => setFillAllSlots(!fillAllSlots)}
            style={{
              padding: '0.5rem 1rem',
              background: fillAllSlots 
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                : 'rgba(255,255,255,0.1)',
              border: '1px solid ' + (fillAllSlots ? '#10b981' : 'rgba(255,255,255,0.2)'),
              borderRadius: '10px',
              color: '#fff',
              fontSize: isMobile ? '0.85rem' : '0.9rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              minHeight: '44px',
              touchAction: 'manipulation',
              transition: 'all 0.3s ease'
            }}
          >
            {fillAllSlots ? <CheckCircle size={20} /> : <Grid3x3 size={20} />}
            {fillAllSlots ? 'ACTIEF' : 'UIT'}
          </button>
        </div>
        
        {/* Macro Optimization Toggle */}
        <div style={{
          borderTop: '1px solid rgba(16, 185, 129, 0.2)',
          paddingTop: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <h4 style={{
              fontSize: isMobile ? '0.9rem' : '0.95rem',
              fontWeight: '600',
              color: '#10b981',
              marginBottom: '0.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Target size={18} />
              Dynamic Macro Optimization
            </h4>
            <p style={{
              fontSize: isMobile ? '0.75rem' : '0.8rem',
              color: 'rgba(255,255,255,0.6)'
            }}>
              {enableMacroOptimization 
                ? `Portion scaling + intelligent swaps voor ${totalSlots} slots`
                : 'Basis plan zonder macro fine-tuning'
              }
            </p>
          </div>
          
          <button
            onClick={() => setEnableMacroOptimization(!enableMacroOptimization)}
            style={{
              padding: '0.4rem 0.8rem',
              background: enableMacroOptimization 
                ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
                : 'rgba(255,255,255,0.1)',
              border: '1px solid ' + (enableMacroOptimization ? '#8b5cf6' : 'rgba(255,255,255,0.2)'),
              borderRadius: '8px',
              color: '#fff',
              fontSize: isMobile ? '0.8rem' : '0.85rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              minHeight: '36px',
              touchAction: 'manipulation',
              transition: 'all 0.3s ease'
            }}
          >
            {enableMacroOptimization ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
            {enableMacroOptimization ? 'AAN' : 'UIT'}
          </button>
        </div>
      </div>
      
      {/* FORCED MEALS CONTROLS */}
      {forcedMealsConfig && forcedMealsConfig.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)',
          borderRadius: '12px',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          padding: isMobile ? '1rem' : '1.25rem'
        }}>
          {/* Forced Only Toggle */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <h3 style={{
                fontSize: isMobile ? '0.95rem' : '1.05rem',
                fontWeight: '600',
                color: '#f59e0b',
                marginBottom: '0.25rem'
              }}>
                Forced Meals Only Mode
              </h3>
              <p style={{
                fontSize: isMobile ? '0.8rem' : '0.85rem',
                color: 'rgba(255,255,255,0.6)'
              }}>
                {forcedMealsOnly 
                  ? `Gebruik ALLEEN de ${forcedMealsConfig.length} geconfigureerde maaltijden`
                  : `AI vult aan naast je ${forcedMealsConfig.length} verplichte maaltijden`
                }
              </p>
            </div>
            
            <button
              onClick={() => setForcedMealsOnly(!forcedMealsOnly)}
              style={{
                padding: '0.5rem 1rem',
                background: forcedMealsOnly 
                  ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                  : 'rgba(255,255,255,0.1)',
                border: '1px solid ' + (forcedMealsOnly ? '#f59e0b' : 'rgba(255,255,255,0.2)'),
                borderRadius: '10px',
                color: '#fff',
                fontSize: isMobile ? '0.85rem' : '0.9rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                minHeight: '44px',
                touchAction: 'manipulation',
                transition: 'all 0.3s ease'
              }}
            >
              {forcedMealsOnly ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
              {forcedMealsOnly ? 'AAN' : 'UIT'}
            </button>
          </div>
        </div>
      )}
      
      {/* Configuration Overview */}
      <ConfigurationOverview
        selectedClient={selectedClient}
        clientProfile={clientProfile}
        dailyTargets={dailyTargets}
        mealsPerDay={mealsPerDay}
        mealPreferences={mealPreferences}
        forcedMeals={forcedMeals}
        selectedIngredients={selectedIngredients}
        excludedIngredients={excludedIngredients}
        isMobile={isMobile}
      />
      
      {/* Generation Controls */}
      <GenerationControls
        generating={generating}
        generationStats={generationStats}
        aiService={aiService}
        dynamicOptimizer={dynamicOptimizer}
        currentPlan={currentPlan}
        handleGeneratePlan={handleGeneratePlan}
        enableMacroOptimization={enableMacroOptimization}
        fillAllSlots={fillAllSlots}
        totalSlots={totalSlots}
        mealsPerDay={mealsPerDay}
        isMobile={isMobile}
      />
      
      {/* Plan Statistics */}
      {currentPlan && (
        <PlanStatistics
          currentPlan={currentPlan}
          planStats={planStats}
          totalSlots={totalSlots}
          mealsPerDay={mealsPerDay}
          isMobile={isMobile}
        />
      )}
      
      {/* Week Plan Display */}
      {currentPlan && (
        <WeekPlanDisplay
          currentPlan={currentPlan}
          activeDay={activeDay}
          setActiveDay={setActiveDay}
          dailyTargets={dailyTargets}
          mealsPerDay={mealsPerDay}
          totalSlots={totalSlots}
          handleGeneratePlan={handleGeneratePlan}
          generating={generating}
          isMobile={isMobile}
        />
      )}
      
      {/* Enhanced Info Box */}
      <div style={{
        padding: '1rem',
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(139, 92, 246, 0.02) 100%)',
        borderRadius: '12px',
        border: '1px solid rgba(139, 92, 246, 0.2)'
      }}>
        <div style={{
          display: 'flex',
          gap: '0.75rem'
        }}>
          <Zap size={20} style={{ color: '#8b5cf6', flexShrink: 0, marginTop: '0.1rem' }} />
          <div style={{ fontSize: isMobile ? '0.85rem' : '0.9rem', color: 'rgba(255,255,255,0.7)' }}>
            <strong>Frequency Control System:</strong> 
            Stel exact in hoe vaak elke maaltijd voorkomt in je week. 
            Met {mealsPerDay} maaltijden/dag heb je {totalSlots} slots te verdelen.
            {forcedMealsConfig && forcedMealsConfig.length > 0 && 
              ` Je hebt ${totalFrequency} slots geconfigureerd via frequency control.`
            }
          </div>
        </div>
      </div>
    </div>
  )
}
