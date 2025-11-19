import React, { useState, useEffect } from 'react'
import MealLoggingService from './MealLoggingService'

// Route Modals
import SelectRouteModal from './components/SelectRouteModal'
import ExistingMealsFlow from './components/ExistingMealsFlow'
import NewMealFlow from './components/NewMealFlow'
import QuickAddFlow from './components/QuickAddFlow'

/**
 * MY ARC - MEAL LOGGING WIZARD (DEBUG VERSION)
 * Main orchestrator for meal logging system
 */
export default function MealLoggingWizard({
  client,
  db,
  mealLoggingService: externalService,
  onMealLogged,
  onClose
}) {
  const isMobile = window.innerWidth <= 768

  // Service
  const [mealLoggingService, setMealLoggingService] = useState(externalService || null)

  // Flow state
  const [currentFlow, setCurrentFlow] = useState('route-selection')

  console.log('🔄 [MealLoggingWizard] RENDER - currentFlow:', currentFlow)
  
  // Feedback state
  const [feedbackStatus, setFeedbackStatus] = useState(null)
  const [feedbackMealName, setFeedbackMealName] = useState('')

  useEffect(() => {
    console.log('🎯 [MealLoggingWizard] Mounted with props:', {
      hasClient: !!client,
      hasDb: !!db,
      hasService: !!mealLoggingService,
      clientId: client?.id
    })

    if (!mealLoggingService && db?.supabase) {
      const service = new MealLoggingService(db.supabase)
      setMealLoggingService(service)
      console.log('✅ [MealLoggingWizard] Service initialized')
    }
  }, [db, client])

  // Route selection handler
  const handleRouteSelection = (route) => {
    console.log('🎯 [MealLoggingWizard] Route selected:', route)
    
    if (route === 'existing-meals') {
      console.log('→ Setting currentFlow to: route-x')
      setCurrentFlow('route-x')
    } else if (route === 'new-meal') {
      console.log('→ Setting currentFlow to: route-y')
      setCurrentFlow('route-y')
    } else if (route === 'quick-add') {
      console.log('→ Setting currentFlow to: route-z')
      setCurrentFlow('route-z')
    }
  }

  // Meal selected from Route X
  const handleExistingMealAdded = async (cartItem) => {
    console.log('✅ [MealLoggingWizard] Existing meal added:', cartItem.name)
    
    setFeedbackStatus('loading')
    setFeedbackMealName(cartItem.name)
    
    try {
      await mealLoggingService.logConsumedMeal(client.id, {
        meal_id: cartItem.meal_id || null,
        meal_name: cartItem.name,
        meal_type: cartItem.type || 'custom',
        calories: cartItem.calories || 0,
        protein: cartItem.protein || 0,
        carbs: cartItem.carbs || 0,
        fat: cartItem.fat || 0,
        ingredients: cartItem.ingredients_list || [],
        source: 'existing_meal_flow'
      })

      console.log('✅ [MealLoggingWizard] Meal logged successfully')
      
      setFeedbackStatus('success')
      
      setTimeout(() => {
        setFeedbackStatus(null)
        if (onMealLogged) onMealLogged()
        if (onClose) onClose()
      }, 1500)
      
    } catch (error) {
      console.error('❌ [MealLoggingWizard] Error logging meal:', error)
      setFeedbackStatus('error')
    }
  }

  // Meal assembled from Route Y
  const handleNewMealAssembled = async (mealData) => {
    console.log('✅ [MealLoggingWizard] New meal assembled:', mealData)
    
    try {
      await mealLoggingService.logConsumedMeal(client.id, {
        meal_name: mealData.meal_name || 'Custom Maaltijd',
        meal_type: 'custom_assembled',
        calories: mealData.calories,
        protein: mealData.protein,
        carbs: mealData.carbs,
        fat: mealData.fat,
        ingredients: mealData.ingredients || [],
        source: 'new_meal_flow'
      })

      console.log('✅ [MealLoggingWizard] Meal logged successfully')
      
      if (onMealLogged) onMealLogged()
      if (onClose) onClose()
    } catch (error) {
      console.error('❌ [MealLoggingWizard] Error logging meal:', error)
      alert('Er ging iets mis bij het loggen van de maaltijd')
    }
  }

  // Quick Add flow - logged callback
  const handleQuickAddLogged = () => {
    console.log('✅ [MealLoggingWizard] Quick add logged')
    if (onMealLogged) onMealLogged()
  }

  // Back to route selection
  const handleBackToSelection = () => {
    console.log('🔙 [MealLoggingWizard] Back to route selection')
    setCurrentFlow('route-selection')
  }

  // Handle feedback completion
  const handleFeedbackComplete = () => {
    setFeedbackStatus(null)
    
    if (feedbackStatus === 'success') {
      if (onMealLogged) onMealLogged()
      if (onClose) onClose()
    }
  }

  // Modal wrapper for Route X
  const RouteXModal = () => (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && !feedbackStatus) handleBackToSelection()
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
            Mijn gerechten
          </h2>
          <button
            onClick={handleBackToSelection}
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
              transition: 'color 0.2s ease',
              fontSize: isMobile ? '1.5rem' : '1.75rem'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#666'}
          >
            ×
          </button>
        </div>

        <div style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          position: 'relative'
        }}>
          <ExistingMealsFlow
            db={db}
            client={client}
            onMealAdded={handleExistingMealAdded}
            onBack={handleBackToSelection}
          />

          {feedbackStatus && (
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.95)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1.5rem',
              zIndex: 100,
              animation: 'fadeIn 0.2s ease'
            }}>
              {feedbackStatus === 'loading' && (
                <>
                  <div style={{
                    width: isMobile ? '64px' : '80px',
                    height: isMobile ? '64px' : '80px',
                    position: 'relative'
                  }}>
                    <div style={{
                      width: '100%',
                      height: '100%',
                      border: '4px solid rgba(16, 185, 129, 0.2)',
                      borderTop: '4px solid #10b981',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                  </div>
                  <div style={{
                    fontSize: isMobile ? '1.2rem' : '1.4rem',
                    fontWeight: '700',
                    color: '#10b981',
                    textAlign: 'center'
                  }}>
                    Maaltijd wordt opgeslagen...
                  </div>
                  {feedbackMealName && (
                    <div style={{
                      fontSize: isMobile ? '0.95rem' : '1.05rem',
                      color: 'rgba(255, 255, 255, 0.6)',
                      fontWeight: '500'
                    }}>
                      {feedbackMealName}
                    </div>
                  )}
                </>
              )}

              {feedbackStatus === 'success' && (
                <>
                  <div style={{
                    width: isMobile ? '80px' : '100px',
                    height: isMobile ? '80px' : '100px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    animation: 'successPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    boxShadow: '0 0 40px rgba(16, 185, 129, 0.5)'
                  }}>
                    <svg
                      width={isMobile ? '40' : '50'}
                      height={isMobile ? '40' : '50'}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#000"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <div style={{
                    fontSize: isMobile ? '1.25rem' : '1.5rem',
                    fontWeight: '700',
                    color: '#10b981',
                    textAlign: 'center',
                    animation: 'fadeIn 0.3s ease 0.1s backwards'
                  }}>
                    Maaltijd gelogd!
                  </div>
                  {feedbackMealName && (
                    <div style={{
                      fontSize: isMobile ? '0.95rem' : '1.05rem',
                      color: 'rgba(255, 255, 255, 0.6)',
                      fontWeight: '500'
                    }}>
                      {feedbackMealName}
                    </div>
                  )}
                </>
              )}

              {feedbackStatus === 'error' && (
                <>
                  <div style={{
                    width: isMobile ? '80px' : '100px',
                    height: isMobile ? '80px' : '100px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    animation: 'successPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
                  }}>
                    <svg
                      width={isMobile ? '40' : '50'}
                      height={isMobile ? '40' : '50'}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#fff"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </div>
                  <div style={{
                    fontSize: isMobile ? '1.25rem' : '1.5rem',
                    fontWeight: '700',
                    color: '#ef4444',
                    textAlign: 'center'
                  }}>
                    Er ging iets mis
                  </div>
                  <button
                    onClick={handleFeedbackComplete}
                    style={{
                      marginTop: '0.5rem',
                      padding: isMobile ? '0.875rem 2rem' : '1rem 2.5rem',
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: isMobile ? '0.95rem' : '1.05rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent',
                      minHeight: '44px'
                    }}
                  >
                    Sluiten
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

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

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes successPop {
          0% { 
            transform: scale(0);
            opacity: 0;
          }
          50% { 
            transform: scale(1.1);
          }
          100% { 
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )

  console.log('🎨 About to render, currentFlow:', currentFlow)

  // Render current flow
  return (
    <>
      {console.log('🔍 Checking route-selection:', currentFlow === 'route-selection')}
      {currentFlow === 'route-selection' && (
        <SelectRouteModal
          onSelectRoute={handleRouteSelection}
          onClose={onClose}
        />
      )}

      {console.log('🔍 Checking route-x:', currentFlow === 'route-x')}
      {currentFlow === 'route-x' && <RouteXModal />}

      {console.log('🔍 Checking route-y:', currentFlow === 'route-y')}
      {currentFlow === 'route-y' && (
        <NewMealFlow
          db={db}
          client={client}
          mealLoggingService={mealLoggingService}
          onMealLogged={handleNewMealAssembled}
          onClose={handleBackToSelection}
        />
      )}

      {console.log('🔍 Checking route-z:', currentFlow === 'route-z')}
      {console.log('🔍 route-z condition result:', currentFlow === 'route-z')}
      {currentFlow === 'route-z' && console.log('✨ RENDERING QUICK ADD FLOW')}
      {currentFlow === 'route-z' && (
        <QuickAddFlow
          db={db}
          client={client}
          mealLoggingService={mealLoggingService}
          onMealLogged={handleQuickAddLogged}
          onClose={handleBackToSelection}
        />
      )}
    </>
  )
}
