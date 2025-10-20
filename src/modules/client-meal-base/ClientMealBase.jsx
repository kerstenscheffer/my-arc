// src/modules/client-meal-base/ClientMealBase.jsx
import { useState, useEffect } from 'react'
import MealBaseHeader from './components/MealBaseHeader'
import StandardFoodsSection from './components/StandardFoodsSection'
import CustomMealsGrid from './components/CustomMealsGrid'
import FloatingAddButton from './components/FloatingAddButton'
import SelectMealModal from './components/SelectMealModal'
import ClientMealBuilder from '../client-meal-builder/ClientMealBuilder'

export default function ClientMealBase({ client, db, onNavigate }) {
  const isMobile = window.innerWidth <= 768
  
  // State
  const [loading, setLoading] = useState(true)
  const [customMeals, setCustomMeals] = useState([])
  const [standardFoods, setStandardFoods] = useState({
    protein: [null, null, null],
    carbs: [null, null, null],
    meal_prep: [null, null, null]
  })
  const [searchQuery, setSearchQuery] = useState('')
  
  // Modal states
  const [showBuilder, setShowBuilder] = useState(false)
  const [showSelectModal, setShowSelectModal] = useState(false)
  const [selectModalConfig, setSelectModalConfig] = useState(null)
  const [editingMeal, setEditingMeal] = useState(null)
  
  // Load data
  useEffect(() => {
    if (client?.id) {
      loadData()
    }
  }, [client])
  
  const loadData = async () => {
    setLoading(true)
    try {
      const [meals, standards] = await Promise.all([
        db.getClientCustomMeals(client.id),
        db.getClientStandardFoods(client.id)
      ])
      
      setCustomMeals(meals)
      setStandardFoods(standards)
      
      console.log('✅ Meal Base loaded:', {
        customMeals: meals.length,
        standardFoods: {
          protein: standards.protein.filter(Boolean).length,
          carbs: standards.carbs.filter(Boolean).length,
          meal_prep: standards.meal_prep.filter(Boolean).length
        }
      })
    } catch (error) {
      console.error('❌ Load meal base failed:', error)
    } finally {
      setLoading(false)
    }
  }
  
  // Handlers
  const handleSetStandardFood = (category, slotNumber) => {
    setSelectModalConfig({ category, slotNumber })
    setShowSelectModal(true)
  }
  
  const handleSelectMealForSlot = async (mealId) => {
    try {
      await db.setStandardFood(
        client.id,
        selectModalConfig.category,
        selectModalConfig.slotNumber,
        mealId
      )
      setShowSelectModal(false)
      setSelectModalConfig(null)
      await loadData()
    } catch (error) {
      console.error('Failed to set standard food:', error)
      alert('Kon niet opslaan: ' + error.message)
    }
  }
  
  const handleRemoveStandardFood = async (category, slotNumber) => {
    if (!confirm('Weet je zeker dat je deze standaard meal wilt verwijderen?')) return
    
    try {
      await db.removeStandardFood(client.id, category, slotNumber)
      await loadData()
    } catch (error) {
      console.error('Failed to remove standard food:', error)
      alert('Kon niet verwijderen: ' + error.message)
    }
  }
  
  const handleDeleteCustomMeal = async (mealId) => {
    if (!confirm('Weet je zeker dat je deze meal wilt verwijderen?')) return
    
    try {
      await db.deleteCustomMeal(client.id, mealId)
      await loadData()
    } catch (error) {
      console.error('Failed to delete meal:', error)
      alert('Kon niet verwijderen: ' + error.message)
    }
  }
  
  const handleEditMeal = (meal) => {
    setEditingMeal(meal)
    setShowBuilder(true)
  }
  
  const handleMealCreated = async () => {
    setShowBuilder(false)
    setEditingMeal(null)
    await loadData()
  }
  
  // Filter meals by search
  const filteredMeals = customMeals.filter(meal =>
    meal.name.toLowerCase().includes(searchQuery.toLowerCase())
  )
  
  // Loading state
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #0a0a0a 0%, #171717 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          width: '60px',
          height: '60px',
          border: '3px solid rgba(16, 185, 129, 0.2)',
          borderTopColor: '#10b981',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }
  
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #0a0a0a 0%, #171717 100%)',
      paddingBottom: isMobile ? '6rem' : '2rem'
    }}>
      {/* Header with stats and search */}
      <MealBaseHeader
        customMealsCount={customMeals.length}
        standardFoodsCount={
          standardFoods.protein.filter(Boolean).length +
          standardFoods.carbs.filter(Boolean).length +
          standardFoods.meal_prep.filter(Boolean).length
        }
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isMobile={isMobile}
      />
      
      {/* Standard Foods Section */}
      <StandardFoodsSection
        standardFoods={standardFoods}
        onSetFood={handleSetStandardFood}
        onRemoveFood={handleRemoveStandardFood}
        isMobile={isMobile}
      />
      
      {/* Custom Meals Grid */}
      <CustomMealsGrid
        meals={filteredMeals}
        onEdit={handleEditMeal}
        onDelete={handleDeleteCustomMeal}
        isMobile={isMobile}
      />
      
      {/* Floating Add Button */}
      <FloatingAddButton
        onClick={() => setShowBuilder(true)}
        isMobile={isMobile}
      />
      
      {/* Select Meal Modal */}
      {showSelectModal && (
        <SelectMealModal
          isOpen={showSelectModal}
          onClose={() => {
            setShowSelectModal(false)
            setSelectModalConfig(null)
          }}
          meals={customMeals}
          onSelectMeal={handleSelectMealForSlot}
          category={selectModalConfig?.category}
          slotNumber={selectModalConfig?.slotNumber}
          isMobile={isMobile}
        />
      )}
      
      {/* Meal Builder Modal */}
      {showBuilder && (
        <ClientMealBuilder
          client={client}
          db={db}
          onClose={() => {
            setShowBuilder(false)
            setEditingMeal(null)
          }}
          onMealCreated={handleMealCreated}
          editingMeal={editingMeal}
        />
      )}
    </div>
  )
}
