import useIsMobile from '../../hooks/useIsMobile'
// src/coach/pages/CoachMealPlannerDashboard.jsx
// 🚀 MY ARC COACH MEAL PLANNER - ULTIMATE LAUNCH DAY VERSION!
// Features: Portie scaling, Coach suggestions, Enhanced design, Video/Notes interface

import { useState, useEffect, useMemo } from 'react'
import DatabaseService from '../../services/DatabaseService'
const db = DatabaseService
import {
  getClientPlanWithOverrides,
  assignTemplateToClient,
  createMealPlanTemplate,
  fetchMealsByIds,
  getPlannerMealsPool,
  generateSmartPlanForClient,
  regenerateDay,
  regenerateWeek,
  getClientMealPlans
} from '../../lib/mealplanDatabase'

// 🎯 PORTIE SCALING SYSTEM (same as client)
const PortionCalculator = {
  calculateScaledPortion(meal, targetKcal) {
    if (!meal.kcal || meal.kcal === 0) return { factor: 1, newPortion: meal.default_portion || '1 portie' }
    
    const scaleFactor = Math.max(0.5, Math.min(8.0, targetKcal / meal.kcal))
    const currentPortion = meal.default_portion || '100g'
    const newPortion = this.scalePortionText(currentPortion, scaleFactor)
    
    return {
      factor: scaleFactor,
      newPortion,
      scaledMacros: {
        kcal: Math.round(meal.kcal * scaleFactor),
        protein: Math.round(meal.protein * scaleFactor),
        carbs: Math.round(meal.carbs * scaleFactor),
        fat: Math.round(meal.fat * scaleFactor)
      }
    }
  },

  scalePortionText(portionText, factor) {
    if (!portionText) return `${Math.round(factor * 100)}g`
    
    const patterns = [
      { regex: /(\d+)g/, replacement: (match, amount) => `${Math.round(parseInt(amount) * factor)}g` },
      { regex: /(\d+)\s*ml/, replacement: (match, amount) => `${Math.round(parseInt(amount) * factor)}ml` },
      { regex: /(\d+)\s*stuks?/, replacement: (match, amount) => `${Math.round(parseInt(amount) * factor)} stuks` },
      { regex: /(\d+)\s*portie/, replacement: (match, amount) => `${(parseFloat(amount) * factor).toFixed(1)} portie` }
    ]
    
    for (const pattern of patterns) {
      if (pattern.regex.test(portionText)) {
        return portionText.replace(pattern.regex, pattern.replacement)
      }
    }
    
    return `${(factor).toFixed(1)}x ${portionText}`
  }
}

// Helper functions
function formatDate(d) {
  return d.toLocaleDateString('nl-NL', { weekday: 'short', day: '2-digit', month: '2-digit' })
}

function addDays(date, n) {
  const x = new Date(date)
  x.setDate(x.getDate() + n)
  return x
}

function sumMacros(meals) {
  return meals.reduce((acc, m) => ({
    kcal: acc.kcal + (m?.kcal || 0),
    protein: acc.protein + (m?.protein || 0),
    carbs: acc.carbs + (m?.carbs || 0),
    fat: acc.fat + (m?.fat || 0)
  }), { kcal: 0, protein: 0, carbs: 0, fat: 0 })
}

export default function CoachMealPlannerDashboard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // State
  const [clients, setClients] = useState([])
  const [selectedClient, setSelectedClient] = useState(null)
  const [clientPlan, setClientPlan] = useState(null)
  const [weekStructure, setWeekStructure] = useState([])
  const [mealsMap, setMealsMap] = useState({})
  const [activeWeek, setActiveWeek] = useState(0)
  const [availableMeals, setAvailableMeals] = useState([])
  
  // Modals
  const [showGenerator, setShowGenerator] = useState(false)
  const [showPreferences, setShowPreferences] = useState(false)
  const [showCoachNotes, setShowCoachNotes] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [clientPreferences, setClientPreferences] = useState({
    preferred_meal_ids: []
  })
  
  // 💬 COACH SUGGESTIONS STATE
  const [coachSuggestions, setCoachSuggestions] = useState({
    video_url: '',
    notes: '',
    title: ''
  })
  
  // Generator settings
  const [planSettings, setPlanSettings] = useState({
    calories: 2000,
    protein: 150,
    carbs: 200,
    fat: 67,
    mealsPerDay: 4,
    preferences: [],
    allergies: []
  })

  // Mobile check
  const isMobile = useIsMobile()

  // Load all available meals on mount
  useEffect(() => {
    async function loadMeals() {
      try {
        const { data, error } = await supabase
          .from('meals')
          .select('*')
          .order('category', { ascending: true })
          .order('name', { ascending: true })
        
        if (error) throw error
        setAvailableMeals(data || [])
        console.log(`✅ Loaded ${data?.length || 0} meals for preferences`)
      } catch (e) {
        console.error('Error loading meals:', e)
      }
    }
    loadMeals()
  }, [])

  // Load clients
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        console.log('🚀 Loading clients from database...')
        
        const { data: clientsData, error: clientError } = await supabase
          .from('clients')
          .select('*')
          .order('created_at', { ascending: false })
        
        if (clientError) {
          console.error('Database error:', clientError)
          const { data: allClients, error: retryError } = await supabase
            .from('clients')
            .select('id, first_name, last_name, email, goals, status, meal_preferences')
          
          if (retryError) {
            throw retryError
          } else {
            console.log(`✅ Found ${allClients?.length || 0} clients (retry)`)
            if (mounted) setClients(allClients || [])
          }
        } else {
          console.log(`✅ Found ${clientsData?.length || 0} clients`)
          if (mounted) setClients(clientsData || [])
        }
        
      } catch (e) {
        console.error('Load error:', e)
        if (mounted) {
          setError(`Kon clients niet laden: ${e.message}`)
        }
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    
    return () => { mounted = false }
  }, [])

  // Load client plan when selected
  useEffect(() => {
    if (!selectedClient) {
      setClientPlan(null)
      setWeekStructure([])
      setMealsMap({})
      setClientPreferences({ preferred_meal_ids: [] })
      setCoachSuggestions({ video_url: '', notes: '', title: '' })
      return
    }
    
    // Load client preferences
    let prefs = { preferred_meal_ids: [] }
    
    if (selectedClient.meal_preferences) {
      if (typeof selectedClient.meal_preferences === 'string') {
        console.log(`📄 Client ${selectedClient.first_name} has OLD TEXT preferences - converting to new format`)
        prefs = { 
          preferred_meal_ids: [],
          legacy_text: selectedClient.meal_preferences 
        }
      } else if (selectedClient.meal_preferences.preferred_meal_ids) {
        prefs = selectedClient.meal_preferences
        console.log(`📊 Client ${selectedClient.first_name} has NEW JSON preferences: ${prefs.preferred_meal_ids.length} items`)
      } else {
        prefs = { preferred_meal_ids: [] }
      }
    }
    
    setClientPreferences(prefs)
    console.log(`🍽️ Loaded preferences for ${selectedClient.first_name}:`, prefs)
    
    let mounted = true
    ;(async () => {
      try {
        console.log('📋 Loading plan for client:', selectedClient.id)
        
        const { plan, mergedWeekStructure } = await getClientPlanWithOverrides(selectedClient.id)
        if (!mounted) return
        
        setClientPlan(plan)
        
        // 💬 Load coach suggestions from plan
        if (plan) {
          setCoachSuggestions({
            video_url: plan.coach_video_url || '',
            notes: plan.coach_notes || '',
            title: plan.title || `Meal Plan - ${selectedClient.first_name}`
          })
        }
        
        // Pad to 28 days
        const padded = [...(mergedWeekStructure || [])]
        while (padded.length < 28) {
          padded.push({ day: `Day ${padded.length + 1}`, meals: [] })
        }
        setWeekStructure(padded)
        
        // Load meals
        const mealIds = padded.flatMap(d => 
          (d?.meals || []).map(m => m.meal_id).filter(Boolean)
        )
        const uniqueIds = [...new Set(mealIds)]
        
        if (uniqueIds.length) {
          const meals = await fetchMealsByIds(uniqueIds)
          const map = Object.fromEntries(meals.map(m => [m.id, m]))
          if (mounted) setMealsMap(map)
        }
        
        // Set plan settings based on client data
        if (plan) {
          setPlanSettings(prev => ({
            ...prev,
            calories: plan.targets?.kcal || 2000,
            protein: plan.targets?.protein || 150,
            carbs: plan.targets?.carbs || 200,
            fat: plan.targets?.fat || 67
          }))
        }
      } catch (e) {
        console.error('Load plan error:', e)
      }
    })()
    
    return () => { mounted = false }
  }, [selectedClient])

  // 💬 SAVE COACH SUGGESTIONS
  const saveCoachSuggestions = async () => {
    if (!clientPlan) {
      alert('Geen meal plan gevonden om bij te werken!')
      return
    }
    
    try {
      console.log('💾 Saving coach suggestions for plan:', clientPlan.id)
      
      const { error } = await supabase
        .from('client_meal_plans')
        .update({
          coach_video_url: coachSuggestions.video_url || null,
          coach_notes: coachSuggestions.notes || null,
          title: coachSuggestions.title || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', clientPlan.id)
      
      if (error) throw error
      
      // Update local state
      setClientPlan(prev => ({
        ...prev,
        coach_video_url: coachSuggestions.video_url,
        coach_notes: coachSuggestions.notes,
        title: coachSuggestions.title,
        updated_at: new Date().toISOString()
      }))
      
      alert('✅ Coach suggesties opgeslagen!')
      setShowCoachNotes(false)
    } catch (e) {
      console.error('Save coach suggestions error:', e)
      alert('❌ Opslaan mislukt: ' + e.message)
    }
  }

  // Generate smart plan with preferences
  async function handleGenerateSmartPlan() {
    if (!selectedClient) {
      alert('Selecteer eerst een client!')
      return
    }
    
    // Create plan if doesn't exist
    if (!clientPlan) {
      await handleCreateNewPlan()
      return
    }
    
    setGenerating(true)
    try {
      console.log('🚀 Starting smart plan generation with preferences:', clientPreferences)
      
      const result = await generateSmartPlanForClient({
        client_id: selectedClient.id,
        plan_id: clientPlan.id,
        start_date: clientPlan.start_date || new Date().toISOString().slice(0, 10),
        dailyKcalTarget: planSettings.calories,
        dailyMacroTargets: {
          protein: planSettings.protein,
          carbs: planSettings.carbs,
          fat: planSettings.fat
        },
        mealsPerDay: planSettings.mealsPerDay,
        preferences: clientPreferences,
        allergies: planSettings.allergies
      })
      
      // Update local state
      setWeekStructure(result.weekStructure)
      
      // Load nieuwe meals
      const mealIds = result.weekStructure.flatMap(d => 
        d.meals.map(m => m.meal_id).filter(Boolean)
      )
      const uniqueIds = [...new Set(mealIds)]
      if (uniqueIds.length) {
        const meals = await fetchMealsByIds(uniqueIds)
        const map = Object.fromEntries(meals.map(m => [m.id, m]))
        setMealsMap(map)
      }
      
      setShowGenerator(false)
      
      const prefCount = clientPreferences.preferred_meal_ids?.length || 0
      alert(`✅ Smart plan gegenereerd! ${result.diagnostics.totalMealsPlanned} maaltijden gepland met ${result.diagnostics.uniqueMealsUsed} unieke recepten. ${prefCount > 0 ? `Met focus op ${prefCount} favoriete maaltijden!` : ''}`)
    } catch (e) {
      console.error('Generate error:', e)
      alert('❌ Genereren mislukt: ' + e.message)
    } finally {
      setGenerating(false)
    }
  }

  // Create new plan for client
  async function handleCreateNewPlan() {
    if (!selectedClient) return
    
    try {
      const template = await createMealPlanTemplate({
        title: `Meal Plan - ${selectedClient.first_name} ${selectedClient.last_name}`,
        description: `Gegenereerd op ${new Date().toLocaleDateString()}`,
        targets: {
          kcal: planSettings.calories,
          protein: planSettings.protein,
          carbs: planSettings.carbs,
          fat: planSettings.fat
        },
        week_structure: []
      })
      
      const plan = await assignTemplateToClient({
        template_id: template.id,
        client_id: selectedClient.id,
        start_date: new Date().toISOString().slice(0, 10)
      })
      
      setClientPlan(plan)
      alert('✅ Nieuw meal plan aangemaakt! Klik nogmaals op Generate om het te vullen.')
      
      setTimeout(() => {
        handleGenerateSmartPlan()
      }, 500)
      
    } catch (e) {
      console.error('Create plan error:', e)
      alert('❌ Plan aanmaken mislukt: ' + e.message)
    }
  }

  // Regenerate day
  async function handleRegenerateDay(dayIndex) {
    if (!selectedClient || !clientPlan) return
    
    try {
      const result = await regenerateDay({
        client_id: selectedClient.id,
        plan_id: clientPlan.id,
        day_index: dayIndex,
        currentStructure: weekStructure,
        dailyKcalTarget: planSettings.calories,
        mealsPerDay: planSettings.mealsPerDay
      })
      
      const updated = [...weekStructure]
      updated[dayIndex] = result.day
      setWeekStructure(updated)
      
      const mealIds = result.day.meals.map(m => m.meal_id).filter(Boolean)
      if (mealIds.length) {
        const meals = await fetchMealsByIds(mealIds)
        meals.forEach(m => {
          setMealsMap(prev => ({ ...prev, [m.id]: m }))
        })
      }
      
      alert(`✅ Dag ${dayIndex + 1} opnieuw gegenereerd!`)
    } catch (e) {
      console.error('Regenerate day error:', e)
      alert('❌ Regenereren mislukt: ' + e.message)
    }
  }

  // Views
  const weeks = useMemo(() => {
    const out = []
    for (let w = 0; w < 4; w++) {
      out.push(weekStructure.slice(w * 7, (w + 1) * 7))
    }
    return out
  }, [weekStructure])

  const currentWeek = weeks[activeWeek] || []
  const startDate = clientPlan?.start_date ? new Date(clientPlan.start_date) : new Date()
  const weekStart = addDays(startDate, activeWeek * 7)

  // 🎯 Calculate daily targets for progress tracking
  const dailyTargets = useMemo(() => ({
    kcal: planSettings.calories,
    protein: planSettings.protein,
    carbs: planSettings.carbs,
    fat: planSettings.fat
  }), [planSettings])

  if (loading) {
    return (
      <div style={{padding: isMobile ? '1rem' : '2rem'}}>
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          background: 'linear-gradient(135deg, #064e3b 0%, #0a5c42 100%)',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{fontSize: '4rem', marginBottom: '1rem'}}>⏳</div>
          <h3 style={{color: '#fff', fontSize: '2rem'}}>
            Clients laden...
          </h3>
        </div>
      </div>
    )
  }

  return (
    <div style={{padding: isMobile ? '0.5rem' : '1rem'}}>
      {/* Header */}
      <div style={{ 
        marginBottom: '2rem', 
        background: 'linear-gradient(135deg, #064e3b 0%, #0a5c42 100%)',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        <div style={{padding: '2rem'}}>
          <h1 style={{ color: '#fff', fontSize: '2.5rem', margin: 0, fontWeight: 'bold' }}>
            ⚡ MY ARC Meal Planner PRO
          </h1>
          <p style={{ color: '#d1fae5', marginTop: '0.5rem', fontSize: '1.1rem' }}>
            Coach Dashboard - Beheer meal plans voor je clients met slimme portie-aanpassing
          </p>
        </div>
      </div>

      {error && (
        <div style={{
          padding: '1rem',
          background: '#dc2626',
          borderRadius: '8px',
          color: '#fff',
          marginBottom: '1rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          {error}
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '350px 1fr',
        gap: '2rem'
      }}>
        {/* Sidebar - Client Selector */}
        <aside>
          <div style={{
            background: '#1a1a1a',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '1rem',
              background: 'linear-gradient(135deg, #064e3b 0%, #0a5c42 100%)',
              borderBottom: '1px solid #10b98133'
            }}>
              <h3 style={{color: '#fff', margin: 0, fontWeight: 'bold'}}>
                👥 Clients ({clients.length})
              </h3>
            </div>
            <div style={{padding: '1rem'}}>
              {clients.length > 0 ? (
                <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                  {clients.map(client => (
                    <div
                      key={client.id}
                      onClick={() => setSelectedClient(client)}
                      style={{
                        padding: '0.75rem',
                        marginBottom: '0.5rem',
                        cursor: 'pointer',
                        borderRadius: '8px',
                        border: '1px solid #10b98133',
                        background: selectedClient?.id === client.id 
                          ? 'linear-gradient(135deg, #064e3b 0%, #0a5c42 100%)' 
                          : '#2a2a2a',
                        color: selectedClient?.id === client.id ? '#fff' : '#ccc',
                        transition: 'all 0.2s',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                      }}
                    >
                      <div style={{ fontWeight: 600, fontSize: '1rem' }}>
                        {client.first_name} {client.last_name}
                      </div>
                      <div style={{ 
                        opacity: 0.8,
                        marginTop: '0.25rem',
                        fontSize: '0.875rem'
                      }}>
                        {client.email}
                      </div>
                      {client.goals && (
                        <div style={{ opacity: 0.7, fontSize: '0.75rem', marginTop: '0.25rem' }}>
                          Doel: {client.goals}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{textAlign: 'center', padding: '2rem'}}>
                  <p style={{color: '#999'}}>Geen clients gevonden</p>
                  <p style={{fontSize: '0.875rem', color: '#666', marginTop: '0.5rem'}}>
                    Voeg eerst clients toe via Client Manager
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Client Stats & Settings */}
          {selectedClient && (
            <div style={{
              background: '#1a1a1a',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              marginTop: '1rem',
              overflow: 'hidden'
            }}>
              <div style={{
                padding: '1rem',
                background: 'linear-gradient(135deg, #064e3b 0%, #0a5c42 100%)',
                borderBottom: '1px solid #10b98133'
              }}>
                <h4 style={{color: '#fff', margin: 0, fontWeight: 'bold'}}>
                  📊 Plan Settings
                </h4>
              </div>
              <div style={{padding: '1rem'}}>
                <div style={{fontSize: '0.875rem', marginBottom: '0.5rem', color: '#ccc'}}>
                  <strong style={{color: '#10b981'}}>Calorieën:</strong> {planSettings.calories} kcal
                </div>
                <div style={{fontSize: '0.875rem', marginBottom: '0.5rem', color: '#ccc'}}>
                  <strong style={{color: '#10b981'}}>Eiwit:</strong> {planSettings.protein}g
                </div>
                <div style={{fontSize: '0.875rem', marginBottom: '0.5rem', color: '#ccc'}}>
                  <strong style={{color: '#10b981'}}>Koolhydraten:</strong> {planSettings.carbs}g
                </div>
                <div style={{fontSize: '0.875rem', marginBottom: '0.5rem', color: '#ccc'}}>
                  <strong style={{color: '#10b981'}}>Vet:</strong> {planSettings.fat}g
                </div>
                <div style={{fontSize: '0.875rem', color: '#ccc'}}>
                  <strong style={{color: '#10b981'}}>Maaltijden/dag:</strong> {planSettings.mealsPerDay}
                </div>
                
                {/* PREFERENCES STATUS */}
                {selectedClient.meal_preferences && (
                  <div style={{
                    marginTop: '1rem',
                    padding: '0.75rem',
                    background: typeof selectedClient.meal_preferences === 'string' 
                      ? 'rgba(251, 191, 36, 0.1)'
                      : 'rgba(16, 185, 129, 0.1)',
                    borderRadius: '8px',
                    border: `1px solid ${typeof selectedClient.meal_preferences === 'string' ? '#fbbf24' : '#10b981'}33`
                  }}>
                    {typeof selectedClient.meal_preferences === 'string' ? (
                      <div>
                        <div style={{ color: '#fbbf24', fontWeight: 600, fontSize: '0.875rem' }}>
                          ⚠️ Legacy preferences gevonden
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#999', marginTop: '0.25rem' }}>
                          Klik "Edit Preferences" om over te stappen
                        </div>
                      </div>
                    ) : (
                      <div style={{ color: '#10b981', fontWeight: 600, fontSize: '0.875rem' }}>
                        ✅ {selectedClient.meal_preferences.preferred_meal_ids?.length || 0} voorkeuren ingesteld
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </aside>

        {/* Main Content */}
        <main>
          {!selectedClient ? (
            <div style={{
              background: '#1a1a1a',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              padding: '3rem',
              textAlign: 'center'
            }}>
              <h3 style={{color: '#fff', marginBottom: '1rem', fontSize: '1.5rem'}}>
                👈 Selecteer een client
              </h3>
              <p style={{color: '#999', fontSize: '1rem'}}>
                Kies een client uit de lijst om hun meal plan te beheren
              </p>
            </div>
          ) : (
            <>
              {/* Action Buttons */}
              <div style={{
                background: '#1a1a1a',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                padding: '1.5rem',
                marginBottom: '1rem'
              }}>
                <div style={{
                  display: 'flex',
                  gap: '1rem',
                  flexWrap: 'wrap',
                  alignItems: 'center'
                }}>
                  <button 
                    onClick={() => setShowGenerator(true)}
                    style={{
                      padding: '0.75rem 1.5rem',
                      border: '1px solid #10b981',
                      borderRadius: '8px',
                      background: '#10b981',
                      color: '#000',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: 'bold',
                      transition: 'all 0.3s',
                      boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)'
                    }}
                  >
                    ⚡ Generate Smart Plan
                  </button>
                  <button 
                    onClick={() => setShowPreferences(true)}
                    style={{
                      padding: '0.75rem 1.5rem',
                      border: '1px solid #10b981',
                      borderRadius: '8px',
                      background: 'transparent',
                      color: '#10b981',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: 'bold',
                      transition: 'all 0.3s',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}
                  >
                    🍽️ Edit Preferences 
                    {typeof selectedClient.meal_preferences === 'string' 
                      ? ' (Upgrade)'
                      : ` (${clientPreferences.preferred_meal_ids?.length || 0})`
                    }
                  </button>
                  <button 
                    onClick={() => setShowCoachNotes(true)}
                    style={{
                      padding: '0.75rem 1.5rem',
                      border: '1px solid #fbbf24',
                      borderRadius: '8px',
                      background: 'transparent',
                      color: '#fbbf24',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: 'bold',
                      transition: 'all 0.3s',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}
                  >
                    💬 Coach Suggesties
                  </button>
                  {!clientPlan && (
                    <span style={{ 
                      fontSize: '0.875rem', 
                      color: '#999',
                      alignSelf: 'center' 
                    }}>
                      (Maakt automatisch een nieuw plan aan)
                    </span>
                  )}
                </div>
              </div>

              {clientPlan && (
                <>
                  {/* Week Tabs */}
                  <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    marginBottom: '1rem',
                    flexWrap: 'wrap'
                  }}>
                    {[0, 1, 2, 3].map(w => (
                      <button
                        key={w}
                        onClick={() => setActiveWeek(w)}
                        style={{
                          padding: '0.75rem 1.5rem',
                          border: activeWeek === w ? '2px solid #10b981' : '1px solid #10b98133',
                          borderRadius: '8px',
                          background: activeWeek === w ? '#10b981' : '#1a1a1a',
                          color: activeWeek === w ? '#000' : '#fff',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          fontWeight: 'bold',
                          transition: 'all 0.3s',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                        }}
                      >
                        Week {w + 1}
                      </button>
                    ))}
                  </div>

                  {/* Week Grid with Enhanced Design */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '1rem'
                  }}>
                    {currentWeek.map((day, i) => {
                      const dayIndex = activeWeek * 7 + i
                      const date = addDays(weekStart, i)
                      
                      // Calculate meals with portion scaling
                      const meals = (day?.meals || []).map(m => {
                        const meal = mealsMap[m.meal_id]
                        if (!meal) return null
                        
                        // Apply portion scaling if target exists
                        if (m.target_kcal && meal.kcal) {
                          const scaled = PortionCalculator.calculateScaledPortion(meal, m.target_kcal)
                          return { 
                            ...meal, 
                            ...scaled.scaledMacros, 
                            portion: scaled.newPortion, 
                            isScaled: true,
                            originalKcal: meal.kcal
                          }
                        }
                        
                        return meal
                      }).filter(Boolean)
                      
                      const totals = sumMacros(meals)
                      const isToday = date.toDateString() === new Date().toDateString()
                      
                      // Progress calculation
                      const kcalProgress = Math.min(100, (totals.kcal / dailyTargets.kcal) * 100)
                      
                      return (
                        <div key={i} style={{
                          background: '#1a1a1a',
                          borderRadius: '8px',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                          border: isToday ? '2px solid #10b981' : '1px solid #10b98133',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            padding: '1rem',
                            background: 'linear-gradient(135deg, #064e3b 0%, #0a5c42 100%)',
                            borderBottom: '1px solid #10b98133'
                          }}>
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}>
                              <div>
                                <div style={{color: '#fff', fontWeight: 'bold', fontSize: '1rem'}}>
                                  {formatDate(date)}
                                  {isToday && <span style={{marginLeft: '0.5rem'}}>📍</span>}
                                </div>
                                <div style={{color: '#d1fae5', fontSize: '0.875rem'}}>
                                  {meals.length} maaltijden
                                </div>
                              </div>
                              <button
                                onClick={() => handleRegenerateDay(dayIndex)}
                                style={{
                                  padding: '0.5rem 0.75rem',
                                  border: '1px solid rgba(255,255,255,0.3)',
                                  borderRadius: '6px',
                                  background: 'rgba(255,255,255,0.1)',
                                  color: '#fff',
                                  cursor: 'pointer',
                                  fontSize: '0.75rem',
                                  fontWeight: 'bold'
                                }}
                              >
                                🔄 Regenereer
                              </button>
                            </div>
                          </div>
                          
                          <div style={{padding: '1rem'}}>
                            {meals.length === 0 ? (
                              <div style={{
                                textAlign: 'center',
                                color: '#999',
                                padding: '2rem'
                              }}>
                                <p>Geen maaltijden</p>
                              </div>
                            ) : (
                              <>
                                {meals.slice(0, 4).map((m, idx) => (
                                  <div key={idx} style={{ 
                                    borderBottom: '1px solid #10b98133',
                                    paddingBottom: '0.75rem',
                                    marginBottom: '0.75rem'
                                  }}>
                                    <div style={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'flex-start'
                                    }}>
                                      <div style={{flex: 1}}>
                                        <div style={{
                                          color: '#fff',
                                          fontWeight: 'bold',
                                          fontSize: '0.875rem'
                                        }}>
                                          {m.name}
                                          {m.isScaled && (
                                            <span style={{
                                              color: '#fbbf24',
                                              fontSize: '0.75rem',
                                              marginLeft: '0.5rem'
                                            }}>
                                              📏 {m.portion}
                                            </span>
                                          )}
                                        </div>
                                        <div style={{
                                          color: m.isScaled ? '#fbbf24' : '#999',
                                          fontSize: '0.75rem',
                                          marginTop: '0.25rem'
                                        }}>
                                          {m.kcal} kcal | P{m.protein}g C{m.carbs}g F{m.fat}g
                                          {m.isScaled && (
                                            <span style={{color: '#666', fontSize: '0.7rem'}}>
                                              <br/>Origineel: {m.originalKcal} kcal
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                                {meals.length > 4 && (
                                  <div style={{
                                    fontSize: '0.75rem',
                                    color: '#999',
                                    textAlign: 'center'
                                  }}>
                                    +{meals.length - 4} meer...
                                  </div>
                                )}
                              </>
                            )}
                            
                            {/* Daily Progress */}
                            <div style={{
                              borderTop: '1px solid #10b98133',
                              paddingTop: '0.75rem',
                              marginTop: '0.75rem'
                            }}>
                              <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '0.5rem'
                              }}>
                                <div style={{fontSize: '0.875rem', fontWeight: 'bold', color: '#fff'}}>
                                  Totaal: {totals.kcal} kcal
                                </div>
                                <div style={{fontSize: '0.75rem', color: '#999'}}>
                                  {Math.round(kcalProgress)}% van doel
                                </div>
                              </div>
                              
                              {/* Progress bar */}
                              <div style={{
                                width: '100%',
                                height: '6px',
                                background: 'rgba(255,255,255,0.1)',
                                borderRadius: '3px',
                                overflow: 'hidden',
                                marginBottom: '0.5rem'
                              }}>
                                <div style={{
                                  width: `${kcalProgress}%`,
                                  height: '100%',
                                  background: kcalProgress >= 90 ? '#10b981' : kcalProgress >= 70 ? '#fbbf24' : '#ef4444',
                                  transition: 'width 0.3s'
                                }} />
                              </div>
                              
                              <div style={{fontSize: '0.75rem', color: '#999'}}>
                                P{totals.protein}g C{totals.carbs}g F{totals.fat}g
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </>
          )}
        </main>
      </div>

      {/* Generator Modal */}
      {showGenerator && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            background: '#1a1a1a',
            borderRadius: '8px',
            maxWidth: '600px',
            width: '100%',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
          }}>
            <div style={{
              padding: '1.5rem',
              background: 'linear-gradient(135deg, #064e3b 0%, #0a5c42 100%)',
              borderTopLeftRadius: '8px',
              borderTopRightRadius: '8px'
            }}>
              <h3 style={{ color: '#fff', margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>
                ⚡ Smart Plan Generator
              </h3>
            </div>
            <div style={{padding: '1.5rem'}}>
              <div style={{marginBottom: '1.5rem'}}>
                <h4 style={{color: '#10b981', marginBottom: '1rem'}}>Dagelijkse Targets</h4>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem'
                }}>
                  <div>
                    <label style={{fontSize: '0.875rem', color: '#999', display: 'block', marginBottom: '0.5rem'}}>
                      Calorieën
                    </label>
                    <input
                      type="number"
                      value={planSettings.calories}
                      onChange={(e) => setPlanSettings(prev => ({
                        ...prev,
                        calories: parseInt(e.target.value) || 0
                      }))}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #10b98133',
                        borderRadius: '8px',
                        background: '#2a2a2a',
                        color: '#fff',
                        fontSize: '1rem'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{fontSize: '0.875rem', color: '#999', display: 'block', marginBottom: '0.5rem'}}>
                      Eiwit (g)
                    </label>
                    <input
                      type="number"
                      value={planSettings.protein}
                      onChange={(e) => setPlanSettings(prev => ({
                        ...prev,
                        protein: parseInt(e.target.value) || 0
                      }))}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #10b98133',
                        borderRadius: '8px',
                        background: '#2a2a2a',
                        color: '#fff',
                        fontSize: '1rem'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{fontSize: '0.875rem', color: '#999', display: 'block', marginBottom: '0.5rem'}}>
                      Koolhydraten (g)
                    </label>
                    <input
                      type="number"
                      value={planSettings.carbs}
                      onChange={(e) => setPlanSettings(prev => ({
                        ...prev,
                        carbs: parseInt(e.target.value) || 0
                      }))}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #10b98133',
                        borderRadius: '8px',
                        background: '#2a2a2a',
                        color: '#fff',
                        fontSize: '1rem'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{fontSize: '0.875rem', color: '#999', display: 'block', marginBottom: '0.5rem'}}>
                      Vet (g)
                    </label>
                    <input
                      type="number"
                      value={planSettings.fat}
                      onChange={(e) => setPlanSettings(prev => ({
                        ...prev,
                        fat: parseInt(e.target.value) || 0
                      }))}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #10b98133',
                        borderRadius: '8px',
                        background: '#2a2a2a',
                        color: '#fff',
                        fontSize: '1rem'
                      }}
                    />
                  </div>
                </div>
              </div>

              <div style={{marginBottom: '1.5rem'}}>
                <label style={{fontSize: '0.875rem', color: '#999', display: 'block', marginBottom: '0.5rem'}}>
                  Maaltijden per dag
                </label>
                <select
                  value={planSettings.mealsPerDay}
                  onChange={(e) => setPlanSettings(prev => ({
                    ...prev,
                    mealsPerDay: parseInt(e.target.value)
                  }))}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #10b98133',
                    borderRadius: '8px',
                    background: '#2a2a2a',
                    color: '#fff',
                    fontSize: '1rem'
                  }}
                >
                  <option value="3">3 maaltijden</option>
                  <option value="4">4 maaltijden</option>
                  <option value="5">5 maaltijden</option>
                  <option value="6">6 maaltijden</option>
                </select>
              </div>

              <div style={{
                display: 'flex',
                gap: '1rem',
                justifyContent: 'flex-end'
              }}>
                <button
                  onClick={() => setShowGenerator(false)}
                  disabled={generating}
                  style={{
                    padding: '0.75rem 1.5rem',
                    border: '1px solid #555',
                    borderRadius: '8px',
                    background: 'transparent',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                  }}
                >
                  Annuleer
                </button>
                <button
                  onClick={handleGenerateSmartPlan}
                  disabled={generating}
                  style={{
                    padding: '0.75rem 1.5rem',
                    border: '1px solid #10b981',
                    borderRadius: '8px',
                    background: generating ? '#555' : '#10b981',
                    color: generating ? '#999' : '#000',
                    cursor: generating ? 'not-allowed' : 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: 'bold'
                  }}
                >
                  {generating ? '⏳ Genereren...' : '⚡ Genereer 4 Weken'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 💬 COACH SUGGESTIONS MODAL */}
      {showCoachNotes && selectedClient && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            background: '#1a1a1a',
            borderRadius: '8px',
            maxWidth: '700px',
            width: '100%',
            maxHeight: '85vh',
            overflowY: 'auto',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
          }}>
            <div style={{
              padding: '1.5rem',
              background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
              borderTopLeftRadius: '8px',
              borderTopRightRadius: '8px'
            }}>
              <h3 style={{ color: '#000', margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>
                💬 Coach Suggesties - {selectedClient.first_name} {selectedClient.last_name}
              </h3>
              <p style={{ color: '#000', marginTop: '0.5rem', fontSize: '0.875rem', opacity: 0.8 }}>
                Voeg video uitleg en persoonlijke notities toe voor je client
              </p>
            </div>
            
            <div style={{padding: '1.5rem'}}>
              <div style={{marginBottom: '1.5rem'}}>
                <label style={{
                  fontSize: '0.875rem',
                  color: '#10b981',
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: 'bold'
                }}>
                  📋 Plan Titel
                </label>
                <input
                  type="text"
                  value={coachSuggestions.title}
                  onChange={(e) => setCoachSuggestions(prev => ({
                    ...prev,
                    title: e.target.value
                  }))}
                  placeholder={`Meal Plan - ${selectedClient.first_name}`}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #10b98133',
                    borderRadius: '8px',
                    background: '#2a2a2a',
                    color: '#fff',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div style={{marginBottom: '1.5rem'}}>
                <label style={{
                  fontSize: '0.875rem',
                  color: '#10b981',
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: 'bold'
                }}>
                  🎥 Video URL (optioneel)
                </label>
                <input
                  type="url"
                  value={coachSuggestions.video_url}
                  onChange={(e) => setCoachSuggestions(prev => ({
                    ...prev,
                    video_url: e.target.value
                  }))}
                  placeholder="https://cdn.coverr.co/videos/..."
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #10b98133',
                    borderRadius: '8px',
                    background: '#2a2a2a',
                    color: '#fff',
                    fontSize: '1rem'
                  }}
                />
                <p style={{fontSize: '0.75rem', color: '#666', marginTop: '0.5rem'}}>
                  Voeg een persoonlijke video toe om je meal plan uit te leggen
                </p>
              </div>

              <div style={{marginBottom: '1.5rem'}}>
                <label style={{
                  fontSize: '0.875rem',
                  color: '#10b981',
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: 'bold'
                }}>
                  📝 Coach Notities
                </label>
                <textarea
                  value={coachSuggestions.notes}
                  onChange={(e) => setCoachSuggestions(prev => ({
                    ...prev,
                    notes: e.target.value
                  }))}
                  placeholder={`Hoi ${selectedClient.first_name}! 

Dit meal plan is speciaal voor jou samengesteld. Hier zijn een paar belangrijke punten:

• Je hoeft niet strict dit te eten - flexibiliteit is belangrijk!
• Probeer onder de ${planSettings.calories} kcal per dag te blijven
• Focus vooral op je eiwit inname (${planSettings.protein}g per dag)
• Voel je vrij om maaltijden aan te passen aan je smaak

Succes! 💪`}
                  rows="8"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #10b98133',
                    borderRadius: '8px',
                    background: '#2a2a2a',
                    color: '#fff',
                    fontSize: '1rem',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    minHeight: '200px'
                  }}
                />
                <p style={{fontSize: '0.75rem', color: '#666', marginTop: '0.5rem'}}>
                  Deze notities worden prominent getoond in het client dashboard
                </p>
              </div>

              {/* Preview */}
              {coachSuggestions.notes && (
                <div style={{
                  marginBottom: '1.5rem',
                  padding: '1rem',
                  background: 'rgba(16, 185, 129, 0.1)',
                  borderRadius: '8px',
                  border: '1px solid #10b98133'
                }}>
                  <div style={{
                    fontSize: '0.875rem',
                    color: '#10b981',
                    fontWeight: 'bold',
                    marginBottom: '0.5rem'
                  }}>
                    👀 Preview - Hoe client het ziet:
                  </div>
                  <div style={{
                    fontSize: '0.875rem',
                    color: '#ccc',
                    lineHeight: 1.5,
                    whiteSpace: 'pre-wrap'
                  }}>
                    {coachSuggestions.notes}
                  </div>
                </div>
              )}

              <div style={{
                display: 'flex',
                gap: '1rem',
                justifyContent: 'flex-end'
              }}>
                <button
                  onClick={() => setShowCoachNotes(false)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    border: '1px solid #555',
                    borderRadius: '8px',
                    background: 'transparent',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                  }}
                >
                  Annuleer
                </button>
                <button
                  onClick={saveCoachSuggestions}
                  style={{
                    padding: '0.75rem 1.5rem',
                    border: '1px solid #fbbf24',
                    borderRadius: '8px',
                    background: '#fbbf24',
                    color: '#000',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: 'bold'
                  }}
                >
                  💾 Opslaan & Versturen naar Client
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preferences Modal - Enhanced (keeping existing functionality) */}
      {showPreferences && selectedClient && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            background: '#1a1a1a',
            borderRadius: '8px',
            maxWidth: '900px',
            width: '100%',
            maxHeight: '85vh',
            overflowY: 'auto',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
          }}>
            <div style={{
              padding: '1.5rem',
              background: 'linear-gradient(135deg, #064e3b 0%, #0a5c42 100%)',
              borderTopLeftRadius: '8px',
              borderTopRightRadius: '8px'
            }}>
              <h3 style={{ color: '#fff', margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>
                🍽️ Selecteer Favoriete Maaltijden - {selectedClient.first_name} {selectedClient.last_name}
              </h3>
              <p style={{ color: '#d1fae5', marginTop: '0.5rem', fontSize: '0.875rem' }}>
                Selecteer de maaltijden die {selectedClient.first_name} lekker vindt voor prioriteit in meal plans
              </p>
            </div>
            
            <div style={{padding: '1.5rem'}}>
              {/* Enhanced sections for each meal category */}
              {['breakfast', 'lunch', 'dinner', 'snack'].map(category => (
                <div key={category} style={{marginBottom: '2rem'}}>
                  <h4 style={{
                    color: '#10b981',
                    marginBottom: '1rem',
                    fontSize: '1.1rem',
                    fontWeight: 'bold'
                  }}>
                    {category === 'breakfast' && '🌅 Ontbijt'}
                    {category === 'lunch' && '☀️ Lunch'}
                    {category === 'dinner' && '🌙 Diner'}
                    {category === 'snack' && '🍎 Snacks'}
                    {' '}({availableMeals.filter(meal => meal.category === category).length} opties)
                  </h4>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: '0.75rem'
                  }}>
                    {availableMeals
                      .filter(meal => meal.category === category)
                      .map(meal => (
                        <label
                          key={meal.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '1rem',
                            border: '1px solid #10b98133',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            background: clientPreferences.preferred_meal_ids?.includes(meal.id) 
                              ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)' 
                              : '#2a2a2a',
                            transition: 'all 0.2s',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={clientPreferences.preferred_meal_ids?.includes(meal.id) || false}
                            onChange={(e) => {
                              const ids = clientPreferences.preferred_meal_ids || []
                              if (e.target.checked) {
                                setClientPreferences(prev => ({
                                  ...prev,
                                  preferred_meal_ids: [...ids, meal.id]
                                }))
                              } else {
                                setClientPreferences(prev => ({
                                  ...prev,
                                  preferred_meal_ids: ids.filter(id => id !== meal.id)
                                }))
                              }
                            }}
                            style={{ 
                              marginRight: '1rem',
                              transform: 'scale(1.2)'
                            }}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ 
                              fontWeight: 600, 
                              color: clientPreferences.preferred_meal_ids?.includes(meal.id) ? '#10b981' : '#fff',
                              fontSize: '0.9rem'
                            }}>
                              {meal.name}
                            </div>
                            <div style={{
                              fontSize: '0.8rem',
                              color: '#999',
                              marginTop: '0.25rem'
                            }}>
                              {meal.kcal} kcal | P{meal.protein}g C{meal.carbs}g F{meal.fat}g
                            </div>
                            {meal.default_portion && (
                              <div style={{
                                fontSize: '0.75rem',
                                color: '#666',
                                marginTop: '0.25rem'
                              }}>
                                📏 {meal.default_portion}
                              </div>
                            )}
                          </div>
                        </label>
                      ))}
                  </div>
                </div>
              ))}

              {/* Selected count */}
              <div style={{
                padding: '1rem',
                background: 'rgba(16, 185, 129, 0.1)',
                borderRadius: '8px',
                marginBottom: '1.5rem',
                border: '1px solid #10b98133'
              }}>
                <strong style={{color: '#10b981'}}>
                  ✅ {clientPreferences.preferred_meal_ids?.length || 0} maaltijden geselecteerd
                </strong>
                <p style={{fontSize: '0.875rem', marginTop: '0.5rem', color: '#ccc'}}>
                  Deze maaltijden krijgen 500 punt bonus bij het genereren van meal plans!
                </p>
              </div>

              <div style={{
                display: 'flex',
                gap: '1rem',
                justifyContent: 'flex-end'
              }}>
                <button
                  onClick={() => setShowPreferences(false)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    border: '1px solid #555',
                    borderRadius: '8px',
                    background: 'transparent',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                  }}
                >
                  Annuleer
                </button>
                <button
                  onClick={async () => {
                    try {
                      console.log('💾 Saving preferences for client:', selectedClient.id)
                      
                      const cleanPreferences = {
                        preferred_meal_ids: clientPreferences.preferred_meal_ids || []
                      }
                      
                      const { error } = await supabase
                        .from('clients')
                        .update({ meal_preferences: cleanPreferences })
                        .eq('id', selectedClient.id)
                      
                      if (error) throw error
                      
                      setSelectedClient(prev => ({
                        ...prev,
                        meal_preferences: cleanPreferences
                      }))
                      
                      setClients(prev => prev.map(client => 
                        client.id === selectedClient.id 
                          ? { ...client, meal_preferences: cleanPreferences }
                          : client
                      ))
                      
                      const wasLegacy = clientPreferences.legacy_text ? true : false
                      const message = wasLegacy 
                        ? `🎉 ${cleanPreferences.preferred_meal_ids.length} nieuwe voorkeuren opgeslagen! ${selectedClient.first_name} is overgezet naar het nieuwe preference systeem.`
                        : `✅ ${cleanPreferences.preferred_meal_ids.length} voorkeuren opgeslagen voor ${selectedClient.first_name}!`
                      
                      alert(message)
                      setShowPreferences(false)
                    } catch (e) {
                      console.error('❌ Save failed:', e)
                      alert('❌ Opslaan mislukt: ' + e.message)
                    }
                  }}
                  style={{
                    padding: '0.75rem 1.5rem',
                    border: '1px solid #10b981',
                    borderRadius: '8px',
                    background: '#10b981',
                    color: '#000',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: 'bold'
                  }}
                >
                  💾 Opslaan ({clientPreferences.preferred_meal_ids?.length || 0} maaltijden)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
