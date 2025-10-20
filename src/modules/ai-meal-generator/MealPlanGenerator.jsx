// src/modules/ai-meal-generator/MealPlanGenerator.jsx
// FIXED VERSION - Daily targets now passed to PlanActions

import { useState, useEffect } from 'react'
import { 
  Users, Utensils, Zap, BarChart3, Save,
  AlertCircle, Check, Heart, Ban, Loader
} from 'lucide-react'

// Import all tab components
import ClientSelector from './tabs/ClientSelector'
import MealSelector from './tabs/MealSelector'
import PlanBuilder from './tabs/PlanBuilder'
import PlanAnalyzer from './tabs/PlanAnalyzer'
import PlanActions from './tabs/PlanActions'

export default function MealPlanGenerator({ db, clients = [] }) {
  const isMobile = window.innerWidth <= 768
  
  // ========== CORE STATE ==========
  const [activeTab, setActiveTab] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  
  // ========== CLIENT & TARGETS STATE ==========
  const [selectedClient, setSelectedClient] = useState(null)
  const [clientProfile, setClientProfile] = useState(null)
  const [dailyTargets, setDailyTargets] = useState({
    calories: 2000,
    protein: 150,
    carbs: 200,
    fat: 67
  })
  const [mealsPerDay, setMealsPerDay] = useState(4)
  
  // ========== MEAL SELECTION STATE ==========
  // CHANGE 1: forcedMeals → forcedMealsConfig for frequency control
  const [forcedMealsConfig, setForcedMealsConfig] = useState([])
  // Structure: [{meal: {...}, frequency: 3, allowedTimings: ['lunch', 'dinner'], locked: false}]
  
  const [excludedIngredients, setExcludedIngredients] = useState([])
  const [selectedIngredients, setSelectedIngredients] = useState([])
  const [mealPreferences, setMealPreferences] = useState({
    avoidRepeats: true,
    optimizeShopping: true,
    budgetTier: 'moderate'
  })
  
  // ========== GENERATED PLAN STATE ==========
  const [generatedPlan, setGeneratedPlan] = useState(null)
  const [analyzedData, setAnalyzedData] = useState(null)
  const [planModifications, setPlanModifications] = useState({})
  
  // Tab configuration
  const tabs = [
    { 
      id: 'client', 
      label: 'Client & Macros', 
      icon: Users, 
      color: '#8b5cf6'
    },
    { 
      id: 'meals', 
      label: 'Meal Selection', 
      icon: Utensils, 
      color: '#10b981'
    },
    { 
      id: 'build', 
      label: 'Build Plan', 
      icon: Zap, 
      color: '#f59e0b'
    },
    { 
      id: 'analyze', 
      label: 'Analyze & Edit', 
      icon: BarChart3, 
      color: '#3b82f6'
    },
    { 
      id: 'actions', 
      label: 'Save & Export', 
      icon: Save, 
      color: '#ec4899'
    }
  ]
  
  // Load client profile when selected
  useEffect(() => {
    if (selectedClient?.id) {
      loadClientProfile()
    }
  }, [selectedClient])
  
  const loadClientProfile = async () => {
    if (!selectedClient) return
    
    try {
      setLoading(true)
      setError(null)
      
      // Build profile from client data
      const profile = {
        client_id: selectedClient.id,
        first_name: selectedClient.first_name,
        last_name: selectedClient.last_name,
        gender: selectedClient.gender || 'male',
        age: selectedClient.age || 30,
        height_cm: selectedClient.height || 180,
        current_weight_kg: parseFloat(selectedClient.current_weight) || 75,
        target_weight_kg: parseFloat(selectedClient.target_weight) || 75,
        activity_level: selectedClient.activity_level || 'moderate',
        primary_goal: selectedClient.primary_goal || 'maintain',
        target_calories: selectedClient.target_calories || dailyTargets.calories,
        target_protein_g: selectedClient.target_protein || dailyTargets.protein,
        target_carbs_g: selectedClient.target_carbs || dailyTargets.carbs,
        target_fat_g: selectedClient.target_fat || dailyTargets.fat,
        meals_per_day: mealsPerDay,
        budget_tier: 'moderate',
        meal_prep_preference: 'mixed',
        cooking_skill: selectedClient.cooking_skill || 'intermediate',
        dietary_type: selectedClient.dietary_type || 'omnivore',
        allergies: selectedClient.allergies ? 
          (typeof selectedClient.allergies === 'string' ? 
            selectedClient.allergies.split(',').map(s => s.trim()) : 
            selectedClient.allergies) : [],
        intolerances: selectedClient.intolerances ? 
          (typeof selectedClient.intolerances === 'string' ? 
            selectedClient.intolerances.split(',').map(s => s.trim()) : 
            selectedClient.intolerances) : []
      }
      
      setClientProfile(profile)
      
      // Update targets if client has them
      if (selectedClient.target_calories) {
        setDailyTargets({
          calories: selectedClient.target_calories,
          protein: selectedClient.target_protein || 150,
          carbs: selectedClient.target_carbs || 200,
          fat: selectedClient.target_fat || 67
        })
      }
      
    } catch (error) {
      console.error('Error loading client profile:', error)
      setError('Kon client profiel niet laden')
    } finally {
      setLoading(false)
    }
  }
  
  // Render the active tab component
  const renderTabContent = () => {
    switch(activeTab) {
      case 0:
        return (
          <ClientSelector
            db={db}
            clients={clients}
            selectedClient={selectedClient}
            setSelectedClient={setSelectedClient}
            clientProfile={clientProfile}
            dailyTargets={dailyTargets}
            setDailyTargets={setDailyTargets}
            mealsPerDay={mealsPerDay}
            setMealsPerDay={setMealsPerDay}
            loading={loading}
            isMobile={isMobile}
          />
        )
      
      case 1:
        // CHANGE 2: Updated props for MealSelector - frequency control
        return (
          <MealSelector
            db={db}
            selectedClient={selectedClient}
            clientProfile={clientProfile}
            forcedMealsConfig={forcedMealsConfig}              // Changed from forcedMeals
            setForcedMealsConfig={setForcedMealsConfig}        // Changed from setForcedMeals
            excludedIngredients={excludedIngredients}
            setExcludedIngredients={setExcludedIngredients}
            selectedIngredients={selectedIngredients}
            setSelectedIngredients={setSelectedIngredients}
            mealPreferences={mealPreferences}
            setMealPreferences={setMealPreferences}
            mealsPerDay={mealsPerDay}                          // Added for slot calculations
            isMobile={isMobile}
          />
        )
      
      case 2:
        // CHANGE 3: Updated props for PlanBuilder - frequency control
        return (
          <PlanBuilder
            db={db}
            selectedClient={selectedClient}
            clientProfile={clientProfile}
            dailyTargets={dailyTargets}
            mealsPerDay={mealsPerDay}
            forcedMealsConfig={forcedMealsConfig}              // Changed from forcedMeals
            excludedIngredients={excludedIngredients}
            selectedIngredients={selectedIngredients}
            mealPreferences={mealPreferences}
            setGeneratedPlan={setGeneratedPlan}
            isMobile={isMobile}
          />
        )
      
      case 3:
        return (
          <PlanAnalyzer
            db={db}
            generatedPlan={generatedPlan}
            analyzedData={analyzedData}
            planModifications={planModifications}
            setPlanModifications={setPlanModifications}
            dailyTargets={dailyTargets}
            isMobile={isMobile}
          />
        )
      
      case 4:
        // FIX: Added dailyTargets and mealsPerDay to PlanActions
        return (
          <PlanActions
            db={db}
            selectedClient={selectedClient}
            generatedPlan={generatedPlan}
            planModifications={planModifications}
            dailyTargets={dailyTargets}              // FIXED: Added dailyTargets
            mealsPerDay={mealsPerDay}                // FIXED: Added mealsPerDay
            loading={loading}
            isMobile={isMobile}
          />
        )
      
      default:
        return null
    }
  }
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: isMobile ? '1rem' : '1.5rem',
      padding: isMobile ? '1rem' : '1.5rem',
      maxWidth: '1400px',
      margin: '0 auto'
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
        borderRadius: '16px',
        border: '1px solid rgba(16, 185, 129, 0.2)',
        padding: isMobile ? '1rem' : '1.5rem'
      }}>
        <h1 style={{
          fontSize: isMobile ? '1.5rem' : '2rem',
          fontWeight: '800',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: '0.5rem'
        }}>
          AI Meal Plan Generator
        </h1>
        <p style={{
          fontSize: isMobile ? '0.9rem' : '1rem',
          color: 'rgba(255,255,255,0.7)'
        }}>
          Genereer gepersonaliseerde weekplannen met AI intelligentie
        </p>
      </div>
      
      {/* Tab Navigation */}
      <div style={{
        background: '#111',
        borderRadius: isMobile ? '12px' : '16px',
        border: '1px solid #333',
        padding: isMobile ? '0.5rem' : '0.75rem',
        overflowX: 'auto'
      }}>
        <div style={{
          display: 'flex',
          gap: isMobile ? '0.25rem' : '0.5rem',
          minWidth: 'fit-content'
        }}>
          {tabs.map((tab, index) => {
            const Icon = tab.icon
            const isActive = index === activeTab
            const isCompleted = generatedPlan && index < 3
            const isDisabled = !selectedClient && index > 0
            
            return (
              <button
                key={tab.id}
                onClick={() => !isDisabled && setActiveTab(index)}
                disabled={isDisabled}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: isMobile ? '0.5rem 0.75rem' : '0.75rem 1rem',
                  background: isActive 
                    ? `linear-gradient(135deg, ${tab.color}30 0%, ${tab.color}15 100%)`
                    : isCompleted 
                      ? 'rgba(16, 185, 129, 0.1)'
                      : 'transparent',
                  border: isActive 
                    ? `1px solid ${tab.color}`
                    : '1px solid transparent',
                  borderRadius: '8px',
                  color: isActive 
                    ? tab.color 
                    : isCompleted 
                      ? '#10b981'
                      : isDisabled
                        ? 'rgba(255,255,255,0.3)'
                        : 'rgba(255,255,255,0.6)',
                  fontSize: isMobile ? '0.8rem' : '0.9rem',
                  fontWeight: isActive ? '600' : '400',
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  whiteSpace: 'nowrap',
                  opacity: isDisabled ? 0.5 : 1,
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  minHeight: '44px'
                }}
              >
                <Icon size={isMobile ? 16 : 18} />
                {!isMobile && <span>{tab.label}</span>}
                {isCompleted && !isActive && (
                  <Check size={14} style={{ marginLeft: '0.25rem', color: '#10b981' }} />
                )}
              </button>
            )
          })}
        </div>
      </div>
      
      {/* Status Messages */}
      {error && (
        <div style={{
          padding: isMobile ? '0.75rem' : '1rem',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '12px',
          color: '#ef4444',
          fontSize: isMobile ? '0.875rem' : '0.95rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <AlertCircle size={20} />
          {error}
        </div>
      )}
      
      {success && (
        <div style={{
          padding: isMobile ? '0.75rem' : '1rem',
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '12px',
          color: '#10b981',
          fontSize: isMobile ? '0.875rem' : '0.95rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Check size={20} />
          {success}
        </div>
      )}
      
      {/* Tab Content */}
      <div style={{
        background: '#111',
        borderRadius: isMobile ? '12px' : '16px',
        border: '1px solid #333',
        padding: isMobile ? '1rem' : '1.5rem',
        minHeight: isMobile ? '400px' : '500px'
      }}>
        {loading ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '300px',
            gap: '1rem'
          }}>
            <Loader size={40} style={{ 
              color: '#10b981',
              animation: 'spin 1s linear infinite' 
            }} />
            <p style={{ color: 'rgba(255,255,255,0.6)' }}>Laden...</p>
          </div>
        ) : (
          renderTabContent()
        )}
      </div>
      
      {/* Navigation Buttons */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: '1rem'
      }}>
        <button
          onClick={() => setActiveTab(Math.max(0, activeTab - 1))}
          disabled={activeTab === 0}
          style={{
            padding: isMobile ? '0.75rem 1.5rem' : '1rem 2rem',
            background: activeTab === 0 ? '#222' : 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '10px',
            color: activeTab === 0 ? 'rgba(255,255,255,0.3)' : '#fff',
            fontSize: isMobile ? '0.9rem' : '1rem',
            fontWeight: '600',
            cursor: activeTab === 0 ? 'not-allowed' : 'pointer',
            opacity: activeTab === 0 ? 0.5 : 1,
            minHeight: '44px',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent'
          }}
        >
          Vorige
        </button>
        
        <button
          onClick={() => setActiveTab(Math.min(tabs.length - 1, activeTab + 1))}
          disabled={!selectedClient && activeTab === 0}
          style={{
            padding: isMobile ? '0.75rem 1.5rem' : '1rem 2rem',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            border: 'none',
            borderRadius: '10px',
            color: '#fff',
            fontSize: isMobile ? '0.9rem' : '1rem',
            fontWeight: '600',
            cursor: (!selectedClient && activeTab === 0) ? 'not-allowed' : 'pointer',
            minHeight: '44px',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
            opacity: (!selectedClient && activeTab === 0) ? 0.5 : 1
          }}
        >
          Volgende
        </button>
      </div>
      
      {/* CHANGE 4: Updated Ingredient Status Display with frequency info */}
      {(selectedIngredients.length > 0 || excludedIngredients.length > 0 || forcedMealsConfig.length > 0) && (
        <div style={{
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          padding: '1rem',
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          {selectedIngredients.length > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              background: 'rgba(16, 185, 129, 0.1)',
              borderRadius: '8px',
              fontSize: isMobile ? '0.85rem' : '0.9rem',
              color: '#10b981'
            }}>
              <Heart size={16} fill="#10b981" />
              <span>{selectedIngredients.length} gewenste ingrediënten</span>
            </div>
          )}
          
          {excludedIngredients.length > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              background: 'rgba(239, 68, 68, 0.1)',
              borderRadius: '8px',
              fontSize: isMobile ? '0.85rem' : '0.9rem',
              color: '#ef4444'
            }}>
              <Ban size={16} />
              <span>{excludedIngredients.length} uitgesloten ingrediënten</span>
            </div>
          )}
          
          {forcedMealsConfig.length > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              background: 'rgba(245, 158, 11, 0.1)',
              borderRadius: '8px',
              fontSize: isMobile ? '0.85rem' : '0.9rem',
              color: '#f59e0b'
            }}>
              <Zap size={16} />
              <span>{forcedMealsConfig.length} verplichte maaltijden</span>
              {/* NEW: Show total frequency */}
              <span style={{ 
                fontSize: '0.75rem', 
                opacity: 0.7,
                marginLeft: '0.25rem'
              }}>
                ({forcedMealsConfig.reduce((sum, config) => sum + (config.frequency || 0), 0)} uses)
              </span>
            </div>
          )}
        </div>
      )}
      
      {/* Debug Info - Only in development */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{
          padding: '0.75rem',
          background: 'rgba(139, 92, 246, 0.05)',
          borderRadius: '8px',
          fontSize: '0.75rem',
          color: 'rgba(139, 92, 246, 0.7)',
          fontFamily: 'monospace'
        }}>
          <div>Active Tab: {activeTab} ({tabs[activeTab].id})</div>
          <div>Client: {selectedClient ? `${selectedClient.first_name} ${selectedClient.last_name}` : 'none'}</div>
          <div>Targets: {dailyTargets.calories} kcal | {dailyTargets.protein}g P | {dailyTargets.carbs}g C | {dailyTargets.fat}g F</div>
          <div>Selected: {selectedIngredients.length} | Excluded: {excludedIngredients.length} | Forced: {forcedMealsConfig.length}</div>
          {forcedMealsConfig.length > 0 && (
            <div>Total frequency: {forcedMealsConfig.reduce((sum, c) => sum + (c.frequency || 0), 0)} uses</div>
          )}
        </div>
      )}
      
      {/* CSS for animations */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        /* Ensure smooth scrolling on mobile */
        * {
          -webkit-overflow-scrolling: touch;
        }
        
        /* Prevent text selection on buttons */
        button {
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
        }
      `}</style>
    </div>
  )
}
