import { useState, useEffect } from 'react'

// ===== COMPLETE MEAL PLAN GENERATOR MET VERBETERDE FEATURES =====
export const MealPlanGenerator = ({ client, isOpen, onClose, db }) => {
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [templates, setTemplates] = useState([])
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [allMeals, setAllMeals] = useState([])
  
  // Meal selection states
  const [forcedMealIds, setForcedMealIds] = useState([]) // MOET in het plan
  const [preferredMealIds, setPreferredMealIds] = useState([]) // Voorkeur boven andere meals
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all') // all, breakfast, lunch, dinner, snack
  
  // Coach suggestions
  const [coachSuggestions, setCoachSuggestions] = useState({
    title: '',
    video_url: '',
    notes: ''
  })
  
  // Plan settings
  const [planSettings, setPlanSettings] = useState({
    calories: 2000,
    protein: 150,
    carbs: 200,
    fat: 67,
    mealsPerDay: 3,
    varietyLevel: 'moderate'
  })
  
  // Preferences
  const [preferences, setPreferences] = useState({
    dietary_type: 'regular',
    allergies: [],
    dislikes: [],
    prep_time: 'moderate',
    cooking_skill: 'intermediate',
    primary_goal: 'maintenance',
    activity_level: 'moderate',
    workout_time: 'morning',
    biggest_meal: 'lunch',
    budget: 'moderate'
  })
  
  // Generated plan
  const [generatedPlan, setGeneratedPlan] = useState(null)
  const [weekStructure, setWeekStructure] = useState([])
  const [editingMeal, setEditingMeal] = useState(null) // Voor meal swapping
  
  useEffect(() => {
    if (isOpen) {
      loadInitialData()
    }
  }, [isOpen])
  
  const loadInitialData = async () => {
    try {
      if (client) {
        setCoachSuggestions(prev => ({
          ...prev,
          title: `Meal Plan - ${client.first_name} ${client.last_name}`
        }))
        
        if (client.nutrition_info) {
          setPreferences(prev => ({
            ...prev,
            ...client.nutrition_info
          }))
        }
        
        const calculatedMacros = calculateMacros(client)
        setPlanSettings(prev => ({
          ...prev,
          ...calculatedMacros
        }))
        
        const existingPlan = await db.getClientMealPlan(client.id)
        if (existingPlan) {
          if (existingPlan.targets) {
            setPlanSettings(prev => ({
              ...prev,
              calories: existingPlan.targets.kcal || 2000,
              protein: existingPlan.targets.protein || 150,
              carbs: existingPlan.targets.carbs || 200,
              fat: existingPlan.targets.fat || 67
            }))
          }
        }
      }
      
      const templatesData = await db.getMealPlanTemplates()
      setTemplates(templatesData || [])
      
      const mealsData = await db.getAllMeals()
      setAllMeals(mealsData || [])
      
    } catch (error) {
      console.error('Failed to load initial data:', error)
    }
  }
  
  const calculateMacros = (clientData) => {
    let bmr = 0
    const weight = clientData.current_weight || 70
    const height = clientData.height || 170
    const age = clientData.age || 30
    const gender = clientData.gender || 'male'
    
    if (gender === 'male') {
      bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age)
    } else {
      bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age)
    }
    
    const activityMultipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      very_active: 1.725,
      extremely_active: 1.9
    }
    
    const tdee = bmr * (activityMultipliers[preferences.activity_level] || 1.55)
    
    let calories = tdee
    if (preferences.primary_goal === 'weight_loss') {
      calories = tdee - 500
    } else if (preferences.primary_goal === 'muscle_gain') {
      calories = tdee + 300
    }
    
    let proteinRatio, carbRatio, fatRatio
    
    switch(preferences.primary_goal) {
      case 'muscle_gain':
        proteinRatio = 0.30
        carbRatio = 0.45
        fatRatio = 0.25
        break
      case 'weight_loss':
        proteinRatio = 0.35
        carbRatio = 0.35
        fatRatio = 0.30
        break
      default:
        proteinRatio = 0.30
        carbRatio = 0.40
        fatRatio = 0.30
    }
    
    return {
      calories: Math.round(calories),
      protein: Math.round((calories * proteinRatio) / 4),
      carbs: Math.round((calories * carbRatio) / 4),
      fat: Math.round((calories * fatRatio) / 9)
    }
  }
  
  const filterMealsByPreferences = () => {
    return allMeals.filter(meal => {
      if (preferences.allergies.length > 0) {
        const mealIngredients = (meal.tags || []).join(' ').toLowerCase()
        for (const allergy of preferences.allergies) {
          if (mealIngredients.includes(allergy.toLowerCase())) {
            return false
          }
        }
      }
      
      if (preferences.dislikes.length > 0) {
        const mealName = meal.name.toLowerCase()
        for (const dislike of preferences.dislikes) {
          if (mealName.includes(dislike.toLowerCase())) {
            return false
          }
        }
      }
      
      if (preferences.dietary_type !== 'regular') {
        const tags = meal.tags || []
        if (preferences.dietary_type === 'vegetarian' && tags.includes('meat')) return false
        if (preferences.dietary_type === 'vegan' && (tags.includes('meat') || tags.includes('dairy'))) return false
        if (preferences.dietary_type === 'keto' && meal.carbs > 10) return false
      }
      
      return true
    })
  }
  
  const getMealType = (meal) => {
    const name = meal.name?.toLowerCase() || ''
    const mealType = meal.meal_type?.toLowerCase() || ''
    const tags = (meal.tags || []).join(' ').toLowerCase()
    
    if (name.includes('breakfast') || mealType.includes('breakfast') || tags.includes('breakfast')) {
      return 'breakfast'
    }
    if (name.includes('lunch') || mealType.includes('lunch') || tags.includes('lunch')) {
      return 'lunch'
    }
    if (name.includes('dinner') || mealType.includes('dinner') || tags.includes('dinner')) {
      return 'dinner'
    }
    if (name.includes('snack') || mealType.includes('snack') || tags.includes('snack')) {
      return 'snack'
    }
    return 'other'
  }
  
  const generateWeekStructure = () => {
    const structure = []
    const mealsPerDay = planSettings.mealsPerDay
    const suitableMeals = filterMealsByPreferences()
    
    // Categorize meals
    const forcedMeals = suitableMeals.filter(m => forcedMealIds.includes(m.id))
    const preferredMeals = suitableMeals.filter(m => preferredMealIds.includes(m.id) && !forcedMealIds.includes(m.id))
    const otherMeals = suitableMeals.filter(m => !forcedMealIds.includes(m.id) && !preferredMealIds.includes(m.id))
    
    let mealDistribution = []
    if (mealsPerDay === 3) {
      mealDistribution = [0.25, 0.40, 0.35]
    } else if (mealsPerDay === 4) {
      mealDistribution = [0.25, 0.35, 0.25, 0.15]
    } else if (mealsPerDay === 5) {
      mealDistribution = [0.20, 0.15, 0.30, 0.20, 0.15]
    } else {
      mealDistribution = [0.20, 0.15, 0.25, 0.15, 0.20, 0.05]
    }
    
    if (preferences.biggest_meal === 'breakfast' && mealsPerDay >= 3) {
      mealDistribution[0] += 0.10
      mealDistribution[2] -= 0.10
    } else if (preferences.biggest_meal === 'dinner' && mealsPerDay >= 3) {
      mealDistribution[2] += 0.10
      mealDistribution[0] -= 0.10
    }
    
    const mealSlotNames = ['Breakfast', 'Snack 1', 'Lunch', 'Snack 2', 'Dinner', 'Snack 3']
    const mealSlots = mealsPerDay === 3 ? [0, 2, 4] :
                     mealsPerDay === 4 ? [0, 2, 4, 3] :
                     mealsPerDay === 5 ? [0, 1, 2, 4, 3] :
                     [0, 1, 2, 3, 4, 5]
    
    // Track meal usage to ensure forced meals are used
    const forcedMealUsage = {}
    forcedMeals.forEach(m => forcedMealUsage[m.id] = 0)
    const minUsagePerMeal = Math.ceil(7 * mealsPerDay / Math.max(forcedMeals.length, 1))
    
    for (let day = 1; day <= 7; day++) {
      const dayMeals = []
      
      mealSlots.forEach((slotIndex, idx) => {
        const targetCals = Math.round(planSettings.calories * mealDistribution[idx])
        const targetProtein = Math.round(planSettings.protein * mealDistribution[idx])
        const targetCarbs = Math.round(planSettings.carbs * mealDistribution[idx])
        const targetFat = Math.round(planSettings.fat * mealDistribution[idx])
        
        let selectedMeal = null
        const slotType = mealSlotNames[slotIndex].toLowerCase().split(' ')[0]
        
        // First: Check if we need to use a forced meal
        if (forcedMeals.length > 0) {
          const availableForcedMeals = forcedMeals.filter(m => {
            const mealType = getMealType(m)
            return (mealType === slotType || mealType === 'other') && 
                   forcedMealUsage[m.id] < minUsagePerMeal
          })
          
          if (availableForcedMeals.length > 0) {
            // Pick the forced meal with lowest usage
            selectedMeal = availableForcedMeals.reduce((prev, curr) => 
              forcedMealUsage[curr.id] < forcedMealUsage[prev.id] ? curr : prev
            )
            forcedMealUsage[selectedMeal.id]++
          }
        }
        
        // Second: If no forced meal, prefer preferred meals (70% chance)
        if (!selectedMeal && preferredMeals.length > 0 && Math.random() < 0.7) {
          const availablePreferred = preferredMeals.filter(m => {
            const mealType = getMealType(m)
            return mealType === slotType || mealType === 'other'
          })
          
          if (availablePreferred.length > 0) {
            // Find best macro match
            const scoredMeals = availablePreferred.map(m => {
              const calScore = Math.abs(1 - ((m.calories || m.kcal || 0) / targetCals))
              return { meal: m, score: calScore }
            }).sort((a, b) => a.score - b.score)
            
            selectedMeal = scoredMeals[0]?.meal
          }
        }
        
        // Third: Use other suitable meals
        if (!selectedMeal) {
          const availableMeals = otherMeals.filter(m => {
            const mealType = getMealType(m)
            return mealType === slotType || mealType === 'other'
          })
          
          if (availableMeals.length > 0) {
            const scoredMeals = availableMeals.map(m => {
              const calScore = Math.abs(1 - ((m.calories || m.kcal || 0) / targetCals))
              const protScore = Math.abs(1 - ((m.protein || 0) / targetProtein))
              const carbScore = Math.abs(1 - ((m.carbs || 0) / targetCarbs))
              const fatScore = Math.abs(1 - ((m.fat || 0) / targetFat))
              return {
                meal: m,
                score: calScore + protScore + carbScore + fatScore
              }
            }).sort((a, b) => a.score - b.score)
            
            const topMatches = scoredMeals.slice(0, 5)
            selectedMeal = topMatches[Math.floor(Math.random() * topMatches.length)]?.meal
          }
        }
        
        dayMeals.push({
          slot: mealSlotNames[slotIndex],
          meal_id: selectedMeal?.id || null,
          meal_name: selectedMeal?.name || 'To be selected',
          meal_data: selectedMeal || null,
          targetKcal: targetCals,
          targetProtein: targetProtein,
          targetCarbs: targetCarbs,
          targetFat: targetFat,
          isForced: forcedMealIds.includes(selectedMeal?.id),
          isPreferred: preferredMealIds.includes(selectedMeal?.id)
        })
      })
      
      structure.push({
        day: `Day ${day}`,
        dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day - 1],
        meals: dayMeals,
        totalCalories: planSettings.calories,
        notes: ''
      })
    }
    
    return structure
  }
  
  const handleSwapMeal = (dayIndex, mealIndex, newMeal) => {
    const newStructure = [...weekStructure]
    const meal = newStructure[dayIndex].meals[mealIndex]
    
    meal.meal_id = newMeal.id
    meal.meal_name = newMeal.name
    meal.meal_data = newMeal
    meal.isForced = forcedMealIds.includes(newMeal.id)
    meal.isPreferred = preferredMealIds.includes(newMeal.id)
    
    setWeekStructure(newStructure)
    setEditingMeal(null)
    
    // Update generated plan
    if (generatedPlan) {
      setGeneratedPlan({
        ...generatedPlan,
        week_structure: newStructure
      })
    }
  }
  
  const handleGeneratePlan = () => {
    setLoading(true)
    try {
      const structure = generateWeekStructure()
      setWeekStructure(structure)
      
      const plan = {
        title: coachSuggestions.title || `Meal Plan - ${client.first_name}`,
        template_id: selectedTemplate?.id || null,
        targets: {
          kcal: planSettings.calories,
          protein: planSettings.protein,
          carbs: planSettings.carbs,
          fat: planSettings.fat
        },
        week_structure: structure,
        coach_notes: coachSuggestions.notes || '',
        coach_video_url: coachSuggestions.video_url || null
      }
      
      setGeneratedPlan(plan)
      setStep(5)
    } catch (error) {
      console.error('Failed to generate plan:', error)
      alert('❌ Failed to generate meal plan')
    } finally {
      setLoading(false)
    }
  }
  
  const handleSavePlan = async () => {
    if (!generatedPlan || !weekStructure || weekStructure.length === 0) {
      alert('❌ No plan to save!')
      return
    }
    
    setLoading(true)
    try {
      console.log('💾 Saving meal plan with structure...')
      console.log('Week structure to save:', weekStructure)
      
      // Get existing plan if it exists
      const existingPlan = await db.getClientMealPlan(client.id)
      
      // Prepare plan data - ensure week_structure is included
      const planToSave = {
        title: generatedPlan.title || `Meal Plan - ${client.first_name} ${client.last_name}`,
        targets: {
          kcal: planSettings.calories,
          protein: planSettings.protein,
          carbs: planSettings.carbs,
          fat: planSettings.fat
        },
        week_structure: weekStructure, // Use the actual weekStructure state
        coach_notes: generatedPlan.coach_notes || coachSuggestions.notes || '',
        coach_video_url: generatedPlan.coach_video_url || coachSuggestions.video_url || null,
        updated_at: new Date().toISOString()
      }
      
      // If template was selected, include it
      if (selectedTemplate?.id) {
        planToSave.template_id = selectedTemplate.id
      }
      
      // If existing plan, add its ID for update
      if (existingPlan?.id) {
        planToSave.id = existingPlan.id
        console.log('Updating existing plan:', existingPlan.id)
      } else {
        console.log('Creating new plan')
      }
      
      // Save via DatabaseService
      const savedPlan = await db.saveMealPlan(client.id, planToSave)
      
      console.log('✅ Plan saved successfully:', savedPlan)
      
      // Verify the save
      if (!savedPlan.week_structure || savedPlan.week_structure.length === 0) {
        console.error('❌ Week structure not saved properly!')
        alert('⚠️ Plan saved but week structure might be missing. Please check.')
      }
      
      // Save forced and preferred meal IDs in client's nutrition_info
      if (db.updateClient && (forcedMealIds.length > 0 || preferredMealIds.length > 0)) {
        const nutritionInfo = {
          ...preferences,
          forced_meal_ids: forcedMealIds,
          preferred_meal_ids: preferredMealIds
        }
        
        await db.updateClient(client.id, {
          nutrition_info: nutritionInfo
        })
        
        console.log('✅ Preferences saved to client')
      }
      
      alert('✅ Meal plan created successfully!')
      onClose(true)
    } catch (error) {
      console.error('Failed to save plan:', error)
      alert('❌ Failed to save: ' + error.message)
    } finally {
      setLoading(false)
    }
  }
  
  const getFilteredMeals = () => {
    let filtered = allMeals
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(meal => 
        meal.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        meal.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }
    
    // Filter by meal type
    if (filterType !== 'all') {
      filtered = filtered.filter(meal => getMealType(meal) === filterType)
    }
    
    return filtered
  }
  
  if (!isOpen) return null
  
  const renderStep = () => {
    switch(step) {
      case 1: // Coach Info & Plan Settings
        return (
          <div>
            <h3 style={{ color: '#fff', marginBottom: 'var(--s-4)' }}>
              Step 1: Coach Information & Plan Settings
            </h3>
            
            <div style={{
              background: 'rgba(16, 185, 129, 0.1)',
              borderRadius: '12px',
              padding: 'var(--s-4)',
              marginBottom: 'var(--s-4)'
            }}>
              <h4 style={{ color: '#10b981', marginBottom: 'var(--s-3)' }}>
                Coach Suggestions
              </h4>
              
              <div style={{ marginBottom: 'var(--s-3)' }}>
                <label style={{ color: 'var(--c-muted)', fontSize: 'var(--text-sm)', display: 'block', marginBottom: '8px' }}>
                  Plan Title
                </label>
                <input
                  type="text"
                  value={coachSuggestions.title}
                  onChange={(e) => setCoachSuggestions({...coachSuggestions, title: e.target.value})}
                  placeholder="e.g., Summer Shred Plan"
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: 'rgba(0,0,0,0.5)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
              </div>
              
              <div style={{ marginBottom: 'var(--s-3)' }}>
                <label style={{ color: 'var(--c-muted)', fontSize: 'var(--text-sm)', display: 'block', marginBottom: '8px' }}>
                  Coach Video URL (optional)
                </label>
                <input
                  type="url"
                  value={coachSuggestions.video_url}
                  onChange={(e) => setCoachSuggestions({...coachSuggestions, video_url: e.target.value})}
                  placeholder="https://youtube.com/..."
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: 'rgba(0,0,0,0.5)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
              </div>
              
              <div>
                <label style={{ color: 'var(--c-muted)', fontSize: 'var(--text-sm)', display: 'block', marginBottom: '8px' }}>
                  Coach Notes
                </label>
                <textarea
                  value={coachSuggestions.notes}
                  onChange={(e) => setCoachSuggestions({...coachSuggestions, notes: e.target.value})}
                  placeholder="Special instructions, motivational message, tips..."
                  rows="4"
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: 'rgba(0,0,0,0.5)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '8px',
                    color: '#fff',
                    resize: 'vertical'
                  }}
                />
              </div>
            </div>
            
            <div style={{
              background: 'rgba(0,0,0,0.3)',
              borderRadius: '12px',
              padding: 'var(--s-4)'
            }}>
              <h4 style={{ color: '#fff', marginBottom: 'var(--s-3)' }}>
                Daily Macro Targets
              </h4>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                gap: 'var(--s-2)'
              }}>
                <div>
                  <label style={{ color: 'var(--c-muted)', fontSize: 'var(--text-xs)', display: 'block', marginBottom: '4px' }}>
                    Calories
                  </label>
                  <input
                    type="number"
                    value={planSettings.calories}
                    onChange={(e) => setPlanSettings({...planSettings, calories: parseInt(e.target.value) || 0})}
                    style={{
                      width: '100%',
                      padding: '8px',
                      background: 'rgba(0,0,0,0.5)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      borderRadius: '6px',
                      color: '#fff'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ color: 'var(--c-muted)', fontSize: 'var(--text-xs)', display: 'block', marginBottom: '4px' }}>
                    Protein (g)
                  </label>
                  <input
                    type="number"
                    value={planSettings.protein}
                    onChange={(e) => setPlanSettings({...planSettings, protein: parseInt(e.target.value) || 0})}
                    style={{
                      width: '100%',
                      padding: '8px',
                      background: 'rgba(0,0,0,0.5)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      borderRadius: '6px',
                      color: '#fff'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ color: 'var(--c-muted)', fontSize: 'var(--text-xs)', display: 'block', marginBottom: '4px' }}>
                    Carbs (g)
                  </label>
                  <input
                    type="number"
                    value={planSettings.carbs}
                    onChange={(e) => setPlanSettings({...planSettings, carbs: parseInt(e.target.value) || 0})}
                    style={{
                      width: '100%',
                      padding: '8px',
                      background: 'rgba(0,0,0,0.5)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      borderRadius: '6px',
                      color: '#fff'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ color: 'var(--c-muted)', fontSize: 'var(--text-xs)', display: 'block', marginBottom: '4px' }}>
                    Fat (g)
                  </label>
                  <input
                    type="number"
                    value={planSettings.fat}
                    onChange={(e) => setPlanSettings({...planSettings, fat: parseInt(e.target.value) || 0})}
                    style={{
                      width: '100%',
                      padding: '8px',
                      background: 'rgba(0,0,0,0.5)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      borderRadius: '6px',
                      color: '#fff'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ color: 'var(--c-muted)', fontSize: 'var(--text-xs)', display: 'block', marginBottom: '4px' }}>
                    Meals/Day
                  </label>
                  <select
                    value={planSettings.mealsPerDay}
                    onChange={(e) => setPlanSettings({...planSettings, mealsPerDay: parseInt(e.target.value)})}
                    style={{
                      width: '100%',
                      padding: '8px',
                      background: 'rgba(0,0,0,0.5)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      borderRadius: '6px',
                      color: '#fff'
                    }}
                  >
                    <option value={3}>3</option>
                    <option value={4}>4</option>
                    <option value={5}>5</option>
                    <option value={6}>6</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )
        
      case 2: // Preferences
        return (
          <div>
            <h3 style={{ color: '#fff', marginBottom: 'var(--s-4)' }}>
              Step 2: Dietary Preferences
            </h3>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: 'var(--s-3)'
            }}>
              <div>
                <label style={{ color: 'var(--c-muted)', fontSize: 'var(--text-sm)', display: 'block', marginBottom: '8px' }}>
                  Dietary Type
                </label>
                <select
                  value={preferences.dietary_type}
                  onChange={(e) => setPreferences({...preferences, dietary_type: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: 'rgba(0,0,0,0.5)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                >
                  <option value="regular">Regular</option>
                  <option value="vegetarian">Vegetarian</option>
                  <option value="vegan">Vegan</option>
                  <option value="pescatarian">Pescatarian</option>
                  <option value="keto">Keto</option>
                  <option value="paleo">Paleo</option>
                </select>
              </div>
              
              <div>
                <label style={{ color: 'var(--c-muted)', fontSize: 'var(--text-sm)', display: 'block', marginBottom: '8px' }}>
                  Primary Goal
                </label>
                <select
                  value={preferences.primary_goal}
                  onChange={(e) => {
                    setPreferences({...preferences, primary_goal: e.target.value})
                    const newMacros = calculateMacros(client)
                    setPlanSettings(prev => ({...prev, ...newMacros}))
                  }}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: 'rgba(0,0,0,0.5)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                >
                  <option value="weight_loss">Weight Loss</option>
                  <option value="muscle_gain">Muscle Gain</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="performance">Performance</option>
                </select>
              </div>
              
              <div>
                <label style={{ color: 'var(--c-muted)', fontSize: 'var(--text-sm)', display: 'block', marginBottom: '8px' }}>
                  Variety Level
                </label>
                <select
                  value={planSettings.varietyLevel}
                  onChange={(e) => setPlanSettings({...planSettings, varietyLevel: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: 'rgba(0,0,0,0.5)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                >
                  <option value="low">Low (More repeats, easier prep)</option>
                  <option value="moderate">Moderate (Balanced)</option>
                  <option value="high">High (Maximum variety)</option>
                </select>
              </div>
            </div>
            
            <div style={{
              marginTop: 'var(--s-4)',
              padding: 'var(--s-3)',
              background: 'rgba(0,0,0,0.3)',
              borderRadius: '12px'
            }}>
              <h4 style={{ color: '#fff', marginBottom: 'var(--s-3)' }}>
                Restrictions & Preferences
              </h4>
              
              <div style={{ marginBottom: 'var(--s-3)' }}>
                <label style={{ color: 'var(--c-muted)', fontSize: 'var(--text-sm)', display: 'block', marginBottom: '8px' }}>
                  Allergies (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g., nuts, dairy, gluten"
                  value={preferences.allergies.join(', ')}
                  onChange={(e) => setPreferences({
                    ...preferences, 
                    allergies: e.target.value.split(',').map(a => a.trim()).filter(a => a)
                  })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: 'rgba(0,0,0,0.5)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
              </div>
              
              <div>
                <label style={{ color: 'var(--c-muted)', fontSize: 'var(--text-sm)', display: 'block', marginBottom: '8px' }}>
                  Dislikes (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g., broccoli, fish, mushrooms"
                  value={preferences.dislikes.join(', ')}
                  onChange={(e) => setPreferences({
                    ...preferences, 
                    dislikes: e.target.value.split(',').map(d => d.trim()).filter(d => d)
                  })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: 'rgba(0,0,0,0.5)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
              </div>
            </div>
          </div>
        )
        
      case 3: // Meal Selection with Search and Filter
        return (
          <div>
            <h3 style={{ color: '#fff', marginBottom: 'var(--s-4)' }}>
              Step 3: Select Meals
            </h3>
            
            <div style={{ marginBottom: 'var(--s-3)', padding: 'var(--s-3)', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <p style={{ color: '#fff', margin: '0 0 8px 0', fontSize: 'var(--text-sm)' }}>
                <strong style={{ color: 'rgb(239, 68, 68)' }}>Forced Meals:</strong> Deze maaltijden MOETEN in het plan komen
              </p>
              <p style={{ color: '#fff', margin: 0, fontSize: 'var(--text-sm)' }}>
                <strong style={{ color: 'rgb(251, 191, 36)' }}>Preferred Meals:</strong> Deze hebben voorkeur boven andere maaltijden
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: 'var(--s-2)', marginBottom: 'var(--s-3)' }}>
              <input
                type="text"
                placeholder="Search meals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: 'rgba(0,0,0,0.5)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                style={{
                  padding: '10px',
                  background: 'rgba(0,0,0,0.5)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              >
                <option value="all">All Types</option>
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="snack">Snacks</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div style={{ marginBottom: 'var(--s-3)', padding: 'var(--s-2)', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px' }}>
              <span style={{ color: 'rgb(239, 68, 68)', marginRight: '16px' }}>
                {forcedMealIds.length} forced meals
              </span>
              <span style={{ color: 'rgb(251, 191, 36)' }}>
                {preferredMealIds.length} preferred meals
              </span>
            </div>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: 'var(--s-2)',
              maxHeight: '400px',
              overflowY: 'auto',
              padding: 'var(--s-2)',
              background: 'rgba(0,0,0,0.3)',
              borderRadius: '12px'
            }}>
              {getFilteredMeals().map(meal => {
                const isForced = forcedMealIds.includes(meal.id)
                const isPreferred = preferredMealIds.includes(meal.id)
                
                return (
                  <div
                    key={meal.id}
                    style={{
                      padding: 'var(--s-3)',
                      background: isForced 
                        ? 'rgba(239, 68, 68, 0.1)'
                        : isPreferred
                        ? 'rgba(251, 191, 36, 0.1)'
                        : 'rgba(0,0,0,0.5)',
                      border: isForced
                        ? '2px solid rgb(239, 68, 68)'
                        : isPreferred
                        ? '2px solid rgb(251, 191, 36)'
                        : '2px solid transparent',
                      borderRadius: '8px',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <h5 style={{ color: '#fff', fontSize: '0.9rem', margin: 0 }}>
                        {meal.name}
                      </h5>
                      <span style={{ 
                        color: 'var(--c-muted)', 
                        fontSize: '11px',
                        padding: '2px 6px',
                        background: 'rgba(0,0,0,0.3)',
                        borderRadius: '4px'
                      }}>
                        {getMealType(meal)}
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '8px', fontSize: '0.75rem', color: 'var(--c-muted)', marginBottom: '8px' }}>
                      <span>{meal.calories || meal.kcal || 0} kcal</span>
                      <span style={{ color: 'rgb(59, 130, 246)' }}>{meal.protein || 0}g P</span>
                      <span style={{ color: 'rgb(251, 191, 36)' }}>{meal.carbs || 0}g C</span>
                      <span style={{ color: 'rgb(239, 68, 68)' }}>{meal.fat || 0}g F</span>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        onClick={() => {
                          if (isForced) {
                            setForcedMealIds(prev => prev.filter(id => id !== meal.id))
                          } else {
                            setForcedMealIds(prev => [...prev, meal.id])
                            setPreferredMealIds(prev => prev.filter(id => id !== meal.id))
                          }
                        }}
                        style={{
                          flex: 1,
                          padding: '4px 8px',
                          background: isForced ? 'rgb(239, 68, 68)' : 'rgba(239, 68, 68, 0.2)',
                          border: '1px solid rgb(239, 68, 68)',
                          borderRadius: '4px',
                          color: isForced ? '#000' : 'rgb(239, 68, 68)',
                          cursor: 'pointer',
                          fontSize: '11px',
                          fontWeight: 'bold'
                        }}
                      >
                        {isForced ? 'FORCED' : 'SET FORCED'}
                      </button>
                      <button
                        onClick={() => {
                          if (isPreferred) {
                            setPreferredMealIds(prev => prev.filter(id => id !== meal.id))
                          } else {
                            setPreferredMealIds(prev => [...prev, meal.id])
                            setForcedMealIds(prev => prev.filter(id => id !== meal.id))
                          }
                        }}
                        style={{
                          flex: 1,
                          padding: '4px 8px',
                          background: isPreferred ? 'rgb(251, 191, 36)' : 'rgba(251, 191, 36, 0.2)',
                          border: '1px solid rgb(251, 191, 36)',
                          borderRadius: '4px',
                          color: isPreferred ? '#000' : 'rgb(251, 191, 36)',
                          cursor: 'pointer',
                          fontSize: '11px',
                          fontWeight: 'bold'
                        }}
                      >
                        {isPreferred ? 'PREFERRED' : 'SET PREFERRED'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
        
      case 4: // Template Selection
        return (
          <div>
            <h3 style={{ color: '#fff', marginBottom: 'var(--s-4)' }}>
              Step 4: Use Template? (Optional)
            </h3>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 'var(--s-2)',
              maxHeight: '400px',
              overflowY: 'auto'
            }}>
              <div
                onClick={() => setSelectedTemplate(null)}
                style={{
                  background: !selectedTemplate ? 'rgba(16, 185, 129, 0.2)' : 'rgba(0,0,0,0.3)',
                  border: `2px solid ${!selectedTemplate ? '#10b981' : 'transparent'}`,
                  borderRadius: '12px',
                  padding: 'var(--s-3)',
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                <h4 style={{ color: '#fff' }}>Custom Plan</h4>
                <p style={{ color: 'var(--c-muted)', fontSize: 'var(--text-sm)' }}>
                  Generate new structure
                </p>
              </div>
              
              {templates.slice(0, 11).map(template => {
                const isSelected = selectedTemplate?.id === template.id
                
                return (
                  <div
                    key={template.id}
                    onClick={() => setSelectedTemplate(template)}
                    style={{
                      background: isSelected ? 'rgba(16, 185, 129, 0.2)' : 'rgba(0,0,0,0.3)',
                      border: `2px solid ${isSelected ? '#10b981' : 'transparent'}`,
                      borderRadius: '12px',
                      padding: 'var(--s-3)',
                      cursor: 'pointer'
                    }}
                  >
                    <h4 style={{ color: '#fff', marginBottom: '8px', fontSize: '0.9rem' }}>
                      {template.name || template.title}
                    </h4>
                    <p style={{ color: 'var(--c-muted)', fontSize: 'var(--text-xs)' }}>
                      {template.description || 'Template'}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        )
        
      case 5: // Review with Meal Swapping
        return (
          <div>
            <h3 style={{ color: '#fff', marginBottom: 'var(--s-4)' }}>
              Step 5: Review & Edit Plan
            </h3>
            
            {editingMeal && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.9)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10000
              }}>
                <div style={{
                  background: '#1a1a1a',
                  borderRadius: '12px',
                  padding: '20px',
                  width: '90%',
                  maxWidth: '600px',
                  maxHeight: '80vh',
                  overflow: 'auto'
                }}>
                  <h4 style={{ color: '#fff', marginBottom: '16px' }}>
                    Replace: {editingMeal.meal.meal_name}
                  </h4>
                  
                  <input
                    type="text"
                    placeholder="Search replacement..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: 'rgba(0,0,0,0.5)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      borderRadius: '8px',
                      color: '#fff',
                      marginBottom: '16px'
                    }}
                  />
                  
                  <div style={{ display: 'grid', gap: '8px', maxHeight: '400px', overflowY: 'auto' }}>
                    {getFilteredMeals().map(meal => (
                      <div
                        key={meal.id}
                        onClick={() => handleSwapMeal(editingMeal.dayIndex, editingMeal.mealIndex, meal)}
                        style={{
                          padding: '12px',
                          background: 'rgba(0,0,0,0.5)',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.5)'}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: '#fff' }}>{meal.name}</span>
                          <div style={{ display: 'flex', gap: '8px', fontSize: '12px', color: 'var(--c-muted)' }}>
                            <span>{meal.calories || meal.kcal || 0} kcal</span>
                            <span>{meal.protein || 0}g P</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <button
                    onClick={() => {
                      setEditingMeal(null)
                      setSearchTerm('')
                    }}
                    style={{
                      marginTop: '16px',
                      padding: '10px 20px',
                      background: 'rgba(239, 68, 68, 0.2)',
                      border: '1px solid rgb(239, 68, 68)',
                      borderRadius: '8px',
                      color: 'rgb(239, 68, 68)',
                      cursor: 'pointer',
                      width: '100%'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            
            <div style={{
              background: 'rgba(0,0,0,0.3)',
              borderRadius: '12px',
              padding: 'var(--s-4)',
              marginBottom: 'var(--s-4)'
            }}>
              <h4 style={{ color: '#10b981', marginBottom: 'var(--s-3)' }}>
                Plan Summary
              </h4>
              
              <div style={{ display: 'flex', gap: 'var(--s-3)', flexWrap: 'wrap' }}>
                <span style={{
                  background: 'rgba(16, 185, 129, 0.2)',
                  color: '#10b981',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: 'var(--text-sm)'
                }}>
                  {planSettings.calories} kcal
                </span>
                <span style={{
                  background: 'rgba(59, 130, 246, 0.2)',
                  color: '#3b82f6',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: 'var(--text-sm)'
                }}>
                  {planSettings.protein}g protein
                </span>
                <span style={{
                  background: 'rgba(245, 158, 11, 0.2)',
                  color: '#f59e0b',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: 'var(--text-sm)'
                }}>
                  {planSettings.carbs}g carbs
                </span>
                <span style={{
                  background: 'rgba(139, 92, 246, 0.2)',
                  color: '#8b5cf6',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: 'var(--text-sm)'
                }}>
                  {planSettings.fat}g fat
                </span>
              </div>
            </div>
            
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {weekStructure.map((day, dayIndex) => (
                <div key={dayIndex} style={{ marginBottom: 'var(--s-3)', padding: 'var(--s-3)', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                  <h5 style={{ color: 'var(--primary)', marginBottom: '12px' }}>{day.dayName}</h5>
                  <div style={{ display: 'grid', gap: '8px' }}>
                    {day.meals.map((meal, mealIndex) => (
                      <div 
                        key={mealIndex} 
                        style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '8px 12px',
                          background: meal.isForced 
                            ? 'rgba(239, 68, 68, 0.1)' 
                            : meal.isPreferred 
                            ? 'rgba(251, 191, 36, 0.1)' 
                            : 'rgba(0,0,0,0.3)',
                          borderRadius: '6px',
                          border: meal.isForced 
                            ? '1px solid rgba(239, 68, 68, 0.3)'
                            : meal.isPreferred
                            ? '1px solid rgba(251, 191, 36, 0.3)'
                            : 'none'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ color: 'var(--c-muted)', fontSize: '12px', minWidth: '80px' }}>
                            {meal.slot}
                          </span>
                          <span style={{ color: '#fff', fontSize: '14px' }}>
                            {meal.meal_name}
                          </span>
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ color: 'var(--c-muted)', fontSize: '12px' }}>
                            {meal.targetKcal} kcal
                          </span>
                          <button
                            onClick={() => {
                              setEditingMeal({ dayIndex, mealIndex, meal })
                              setSearchTerm('')
                            }}
                            style={{
                              padding: '4px 8px',
                              background: 'rgba(16, 185, 129, 0.2)',
                              border: '1px solid rgba(16, 185, 129, 0.5)',
                              borderRadius: '4px',
                              color: 'var(--primary)',
                              cursor: 'pointer',
                              fontSize: '11px'
                            }}
                          >
                            SWAP
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
    }
  }
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%)',
        borderRadius: '16px',
        border: '2px solid rgba(16, 185, 129, 0.3)',
        width: '90%',
        maxWidth: '900px',
        maxHeight: '85vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{
          padding: 'var(--s-5)',
          borderBottom: '1px solid rgba(16, 185, 129, 0.2)',
          background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.1) 0%, transparent)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ 
                color: '#fff', 
                fontSize: '1.5rem',
                marginBottom: '8px'
              }}>
                Generate Meal Plan
              </h2>
              <p style={{ color: 'var(--c-muted)' }}>
                {client.first_name} {client.last_name}
              </p>
            </div>
            <button
              onClick={() => onClose(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#fff',
                fontSize: '1.5rem',
                cursor: 'pointer'
              }}
            >
              X
            </button>
          </div>
          
          <div style={{
            display: 'flex',
            gap: 'var(--s-2)',
            marginTop: 'var(--s-3)'
          }}>
            {[1, 2, 3, 4, 5].map(s => (
              <div
                key={s}
                style={{
                  flex: 1,
                  height: '4px',
                  background: s <= step ? '#10b981' : 'rgba(16, 185, 129, 0.2)',
                  borderRadius: '2px',
                  transition: 'background 0.3s ease'
                }}
              />
            ))}
          </div>
        </div>
        
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: 'var(--s-5)'
        }}>
          {renderStep()}
        </div>
        
        <div style={{
          padding: 'var(--s-5)',
          borderTop: '1px solid rgba(16, 185, 129, 0.2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <button
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
            style={{
              background: 'transparent',
              border: '1px solid var(--c-border)',
              color: step === 1 ? 'var(--c-muted)' : '#fff',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: step === 1 ? 'not-allowed' : 'pointer',
              opacity: step === 1 ? 0.5 : 1
            }}
          >
            Previous
          </button>
          
          <p style={{ color: 'var(--c-muted)', fontSize: 'var(--text-sm)' }}>
            Step {step} of 5
          </p>
          
          <button
            onClick={() => {
              if (step < 4) {
                setStep(step + 1)
              } else if (step === 4) {
                handleGeneratePlan()
              } else if (step === 5) {
                handleSavePlan()
              }
            }}
            disabled={loading}
            style={{
              background: 'linear-gradient(135deg, #10b981, #059669)',
              border: 'none',
              color: '#fff',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            {loading ? 'Processing...' : 
             step === 4 ? 'Generate Plan' :
             step === 5 ? 'Save Plan' : 
             'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default MealPlanGenerator
