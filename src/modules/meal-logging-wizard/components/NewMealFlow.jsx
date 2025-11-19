import { useState } from 'react'
import RouteYFirstScreen from './RouteYFirstScreen'
import ExistingMealsFlow from './ExistingMealsFlow'
import RecentIngredientsView from './RecentIngredientsView'
import IngredientSelector from './IngredientSelector'
import MealAssemblyView from './MealAssemblyView'
import { ShoppingCart, X } from 'lucide-react'

export default function NewMealFlow({ db, client, onMealLogged, onClose }) {
  const [screen, setScreen] = useState('selection')
  const [cart, setCart] = useState([])

  const isMobile = window.innerWidth <= 768

  const handleSelectOption = (optionId) => {
    console.log('✅ [NewMealFlow] Option selected:', optionId)
    
    if (optionId === 'existing-meals') {
      setScreen('existing-meals')
    } else if (optionId === 'recent-ingredients') {
      setScreen('recent-ingredients')
    } else if (optionId === 'search-ingredients') {
      setScreen('search')
    }
  }

  const handleMealAdded = async (meal) => {
    console.log('✅ [NewMealFlow] Meal added to cart:', meal.name)
    
    // Parse ingredients_list
    let ingredientsList = []
    
    if (meal.ingredients_list) {
      if (Array.isArray(meal.ingredients_list)) {
        ingredientsList = meal.ingredients_list
      } else if (typeof meal.ingredients_list === 'string') {
        try {
          const parsed = JSON.parse(meal.ingredients_list)
          ingredientsList = Array.isArray(parsed) ? parsed : []
        } catch (e) {
          console.log('⚠️ [NewMealFlow] Could not parse ingredients_list')
          ingredientsList = []
        }
      }
    }

    console.log('🔍 [NewMealFlow] Parsed ingredients_list:', ingredientsList)

    // Fetch ingredient names from ai_ingredients table
    let ingredients = []
    
    if (ingredientsList.length > 0) {
      try {
        const ingredientIds = ingredientsList
          .map(item => item.ingredient_id)
          .filter(id => id) // Remove nulls
        
        if (ingredientIds.length > 0) {
          const { data: ingredientsData, error } = await db.supabase
            .from('ai_ingredients')
            .select('id, name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g')
            .in('id', ingredientIds)
          
          if (error) {
            console.error('❌ [NewMealFlow] Error fetching ingredients:', error)
          } else {
            console.log('✅ [NewMealFlow] Fetched ingredient names:', ingredientsData?.length || 0)
            
            // Map ingredient data to ingredients_list items
            ingredients = ingredientsList.map(item => {
              const ingredientData = ingredientsData?.find(ing => ing.id === item.ingredient_id)
              
              if (ingredientData) {
                const amount = item.amount || 100
                const ratio = amount / 100
                
                return {
                  id: ingredientData.id,
                  name: ingredientData.name,
                  amount: amount,
                  unit: item.unit || 'gram',
                  calories: Math.round((ingredientData.calories_per_100g || 0) * ratio),
                  protein: Math.round((ingredientData.protein_per_100g || 0) * ratio * 10) / 10,
                  carbs: Math.round((ingredientData.carbs_per_100g || 0) * ratio * 10) / 10,
                  fat: Math.round((ingredientData.fat_per_100g || 0) * ratio * 10) / 10
                }
              } else {
                // Fallback if ingredient not found
                return {
                  id: item.ingredient_id,
                  name: 'Onbekend ingrediënt',
                  amount: item.amount || 100,
                  unit: item.unit || 'gram',
                  calories: 0,
                  protein: 0,
                  carbs: 0,
                  fat: 0
                }
              }
            })
          }
        }
      } catch (error) {
        console.error('❌ [NewMealFlow] Error loading ingredient details:', error)
      }
    }

    console.log('✅ [NewMealFlow] Final ingredients with names:', ingredients)
    
    const cartItem = {
      id: `meal-${meal.id}-${Date.now()}`,
      type: 'meal',
      name: meal.name,
      calories: meal.calories || 0,
      protein: meal.protein || 0,
      carbs: meal.carbs || 0,
      fat: meal.fat || 0,
      ingredients: ingredients,
      portion: 1
    }
    
    setCart(prev => [...prev, cartItem])
  }

  const handleIngredientAdded = (ingredient) => {
    console.log('✅ [NewMealFlow] Ingredient added to cart:', ingredient.name)
    setCart(prev => [...prev, ingredient])
  }

  const handleBackToSelection = () => {
    console.log('🔙 [NewMealFlow] Back to selection')
    setScreen('selection')
  }

  const handleOpenCart = () => {
    console.log('🛒 [NewMealFlow] Opening cart')
    setScreen('assembly')
  }

  const handleBackFromAssembly = () => {
    console.log('🔙 [NewMealFlow] Back from assembly')
    setScreen('selection')
  }

  const handleLogMeal = async (mealData) => {
    console.log('✅ [NewMealFlow] Logging meal:', mealData)
    onMealLogged(mealData)
  }

  // Modal Wrapper Component
  const ModalWrapper = ({ children, onBack, title }) => (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onBack()
      }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: isMobile ? 'flex-end' : 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: isMobile ? '0' : '2rem'
      }}
    >
      <div
        style={{
          background: '#000',
          border: '1px solid #333',
          borderRadius: isMobile ? '24px 24px 0 0' : '24px',
          width: '100%',
          maxWidth: '900px',
          maxHeight: isMobile ? '90vh' : '85vh',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '0 -4px 24px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{
          padding: isMobile ? '1.5rem 1rem' : '1.5rem 2rem',
          borderBottom: '1px solid rgba(16, 185, 129, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0
        }}>
          <h2 style={{
            fontSize: isMobile ? '1.2rem' : '1.5rem',
            fontWeight: '700',
            color: '#10b981',
            margin: 0
          }}>
            {title}
          </h2>
          <button
            onClick={onBack}
            style={{
              background: 'none',
              border: 'none',
              color: '#666',
              cursor: 'pointer',
              padding: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '44px',
              minWidth: '44px',
              transition: 'color 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#666'}
          >
            <X size={isMobile ? 20 : 24} />
          </button>
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden'
        }}>
          {children}
        </div>
      </div>

      {/* Animation */}
      <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )

  // Render current screen
  const renderScreen = () => {
    switch (screen) {
      case 'selection':
        return (
          <RouteYFirstScreen
            onSelectOption={handleSelectOption}
            onClose={onClose}
          />
        )

      case 'existing-meals':
        return (
          <ModalWrapper onBack={handleBackToSelection} title="Bestaande gerechten">
            <ExistingMealsFlow
              db={db}
              client={client}
              onMealAdded={handleMealAdded}
            />
          </ModalWrapper>
        )

      case 'recent-ingredients':
        return (
          <ModalWrapper onBack={handleBackToSelection} title="Recente ingrediënten">
            <RecentIngredientsView
              db={db}
              client={client}
              onIngredientAdded={handleIngredientAdded}
              cart={cart}
            />
          </ModalWrapper>
        )

      case 'search':
        return (
          <ModalWrapper onBack={handleBackToSelection} title="Zoek ingrediënten">
            <IngredientSelector
              db={db}
              client={client}
              onIngredientAdded={handleIngredientAdded}
              cart={cart}
            />
          </ModalWrapper>
        )

      case 'assembly':
        return (
          <ModalWrapper onBack={handleBackFromAssembly} title="Maaltijd samenstellen">
            <MealAssemblyView
              db={db}
              client={client}
              cart={cart}
              setCart={setCart}
              onComplete={handleLogMeal}
            />
          </ModalWrapper>
        )

      default:
        return (
          <RouteYFirstScreen
            onSelectOption={handleSelectOption}
            onClose={onClose}
          />
        )
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      {renderScreen()}

      {/* Floating Cart Button */}
      {screen !== 'assembly' && screen !== 'selection' && cart.length > 0 && (
        <button
          onClick={handleOpenCart}
          style={{
            position: 'fixed',
            bottom: isMobile ? '80px' : '2rem',
            right: isMobile ? '1rem' : '2rem',
            width: isMobile ? '56px' : '64px',
            height: isMobile ? '56px' : '64px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            border: 'none',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4), 0 0 0 4px rgba(16, 185, 129, 0.1)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            zIndex: 10001,
            animation: 'pulse 2s infinite'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1) translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 6px 30px rgba(16, 185, 129, 0.6), 0 0 0 6px rgba(16, 185, 129, 0.15)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1) translateY(0)'
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(16, 185, 129, 0.4), 0 0 0 4px rgba(16, 185, 129, 0.1)'
          }}
          onTouchStart={(e) => {
            if (isMobile) {
              e.currentTarget.style.transform = 'scale(0.95)'
            }
          }}
          onTouchEnd={(e) => {
            if (isMobile) {
              e.currentTarget.style.transform = 'scale(1)'
            }
          }}
        >
          <div style={{ position: 'relative' }}>
            <ShoppingCart size={isMobile ? 24 : 28} color="#000" />
            <div style={{
              position: 'absolute',
              top: '-8px',
              right: '-8px',
              width: isMobile ? '20px' : '24px',
              height: isMobile ? '20px' : '24px',
              background: '#000',
              color: '#10b981',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: isMobile ? '0.7rem' : '0.8rem',
              fontWeight: '700',
              border: '2px solid #10b981'
            }}>
              {cart.length}
            </div>
          </div>
        </button>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 4px 20px rgba(16, 185, 129, 0.4), 0 0 0 4px rgba(16, 185, 129, 0.1);
          }
          50% {
            box-shadow: 0 4px 25px rgba(16, 185, 129, 0.6), 0 0 0 6px rgba(16, 185, 129, 0.2);
          }
        }
      `}</style>
    </div>
  )
}
