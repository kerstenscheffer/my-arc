import React, { useState, useMemo, useEffect } from 'react'
import { Trash2, Plus, Check, ArrowLeft, X, ChevronLeft, Minus } from 'lucide-react'

/**
 * MealAssemblyView - Final meal assembly screen
 * Shows cart items, allows portion/amount adjustment, calculates totals, logs meal
 */
export default function MealAssemblyView({
  cart,
  setCart,
  onComplete,
  onBack,
  onClose
}) {
  const isMobile = window.innerWidth <= 768
  
  // State
  const [mealName, setMealName] = useState('')
  const [editingAmounts, setEditingAmounts] = useState({}) // Track edited amounts/portions
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  useEffect(() => {
    console.log('🎯 [MealAssemblyView] Mounted with cart:', cart.length, 'items')
    console.log('🔍 [MealAssemblyView] Cart contents:', cart)
    
    // Generate default meal name
    const now = new Date()
    const timeString = now.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
    setMealName(`Maaltijd ${timeString}`)
  }, [])
  
  // Calculate totals (recalculates when cart or amounts change)
  const totals = useMemo(() => {
    let calories = 0, protein = 0, carbs = 0, fat = 0
    
    cart.forEach(item => {
      if (item.type === 'meal') {
        // Multiply by portion
        const portion = editingAmounts[item.id] ?? item.portion ?? 1
        calories += (item.calories || 0) * portion
        protein += (item.protein || 0) * portion
        carbs += (item.carbs || 0) * portion
        fat += (item.fat || 0) * portion
      } else {
        // Use amount (per 100g)
        const amount = editingAmounts[item.id] ?? item.amount ?? 100
        const ratio = amount / 100
        calories += (item.calories || 0) * ratio
        protein += (item.protein || 0) * ratio
        carbs += (item.carbs || 0) * ratio
        fat += (item.fat || 0) * ratio
      }
    })
    
    const result = {
      calories: Math.round(calories),
      protein: Math.round(protein * 10) / 10,
      carbs: Math.round(carbs * 10) / 10,
      fat: Math.round(fat * 10) / 10
    }
    
    console.log('📊 [MealAssemblyView] Totals calculated:', result)
    return result
  }, [cart, editingAmounts])
  
  // Remove item from cart
  const handleRemove = (itemId) => {
    console.log('🗑️ [MealAssemblyView] Item removed:', itemId)
    setCart(cart.filter(item => item.id !== itemId))
    
    // Clean up editing amounts
    const newAmounts = { ...editingAmounts }
    delete newAmounts[itemId]
    setEditingAmounts(newAmounts)
  }
  
  // Update amount/portion
  const handleAmountChange = (itemId, delta) => {
    const item = cart.find(i => i.id === itemId)
    if (!item) return
    
    if (item.type === 'meal') {
      // Portion adjustment (0.25 increments, min 0.25)
      const currentPortion = editingAmounts[itemId] ?? item.portion ?? 1
      const newPortion = Math.max(0.25, currentPortion + delta)
      setEditingAmounts(prev => ({
        ...prev,
        [itemId]: newPortion
      }))
      console.log('🔍 [MealAssemblyView] Portion changed:', itemId, newPortion)
    } else {
      // Amount adjustment (10g increments, min 10g)
      const currentAmount = editingAmounts[itemId] ?? item.amount ?? 100
      const newAmount = Math.max(10, currentAmount + delta)
      setEditingAmounts(prev => ({
        ...prev,
        [itemId]: newAmount
      }))
      console.log('🔍 [MealAssemblyView] Amount changed:', itemId, newAmount)
    }
  }
  
  // Complete meal
  const handleComplete = async () => {
    if (!mealName.trim()) {
      alert('Geef je maaltijd een naam')
      return
    }
    
    if (cart.length === 0) {
      alert('Voeg minstens 1 item toe aan je maaltijd')
      return
    }
    
    setIsSubmitting(true)
    
    try {
      // Build final meal data
      const finalMealData = {
        meal_name: mealName.trim(),
        calories: totals.calories,
        protein: totals.protein,
        carbs: totals.carbs,
        fat: totals.fat,
        ingredients: cart.map(item => {
          if (item.type === 'meal') {
            // Flatten meal ingredients with portion multiplier
            const portion = editingAmounts[item.id] ?? item.portion ?? 1
            return (item.ingredients || []).map(ing => ({
              name: ing.name,
              amount: (ing.amount || 0) * portion,
              unit: ing.unit || 'g',
              calories: (ing.calories || 0) * portion,
              protein: (ing.protein || 0) * portion,
              carbs: (ing.carbs || 0) * portion,
              fat: (ing.fat || 0) * portion
            }))
          } else {
            // Direct ingredient
            const amount = editingAmounts[item.id] ?? item.amount ?? 100
            const ratio = amount / 100
            return {
              name: item.name,
              amount: amount,
              unit: item.unit || 'g',
              calories: (item.calories || 0) * ratio,
              protein: (item.protein || 0) * ratio,
              carbs: (item.carbs || 0) * ratio,
              fat: (item.fat || 0) * ratio
            }
          }
        }).flat()
      }
      
      console.log('✅ [MealAssemblyView] Meal complete:', finalMealData)
      await onComplete(finalMealData)
    } catch (error) {
      console.error('❌ [MealAssemblyView] Error completing meal:', error)
      alert('Er ging iets mis bij het opslaan')
      setIsSubmitting(false)
    }
  }
  
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: isMobile ? '0' : '1rem',
      touchAction: 'manipulation'
    }}>
      <div style={{
        background: '#0a0a0a',
        borderRadius: isMobile ? '0' : '20px',
        border: isMobile ? 'none' : '1px solid rgba(16, 185, 129, 0.2)',
        width: isMobile ? '100%' : '90%',
        maxWidth: '900px',
        height: isMobile ? '100%' : 'auto',
        maxHeight: isMobile ? '100%' : '90vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
      }}>
        {/* Header */}
        <div style={{
          padding: isMobile ? '1.25rem 1rem' : '1.5rem 2rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.02) 100%)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={onBack}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                color: 'rgba(255, 255, 255, 0.7)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.3)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
              }}
            >
              <ChevronLeft size={20} />
            </button>
            
            <div>
              <div style={{
                fontSize: isMobile ? '1.25rem' : '1.5rem',
                fontWeight: '700',
                color: '#fff',
                marginBottom: '0.15rem'
              }}>
                Maaltijd Samenstellen
              </div>
              <div style={{
                fontSize: isMobile ? '0.8rem' : '0.875rem',
                color: 'rgba(255, 255, 255, 0.5)',
                fontWeight: '500'
              }}>
                {cart.length} {cart.length === 1 ? 'item' : 'items'}
              </div>
            </div>
          </div>
          
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              color: 'rgba(255, 255, 255, 0.6)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
              e.currentTarget.style.color = '#fff'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)'
            }}
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Scrollable Content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: isMobile ? '1rem' : '1.5rem 2rem',
          WebkitOverflowScrolling: 'touch'
        }}>
          {/* Meal Name Input */}
          <div style={{ marginBottom: isMobile ? '1.5rem' : '2rem' }}>
            <label style={{
              display: 'block',
              fontSize: isMobile ? '0.875rem' : '0.95rem',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.7)',
              marginBottom: '0.5rem'
            }}>
              Maaltijd Naam
            </label>
            <input
              type="text"
              value={mealName}
              onChange={(e) => setMealName(e.target.value)}
              placeholder="Bijv. Lunch, Ontbijt, Snack..."
              style={{
                width: '100%',
                padding: isMobile ? '0.875rem 1rem' : '1rem 1.25rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                color: '#fff',
                fontSize: isMobile ? '1rem' : '1.05rem',
                fontWeight: '500',
                outline: 'none',
                transition: 'all 0.2s ease',
                touchAction: 'manipulation',
                minHeight: '44px'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.5)'
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
              }}
            />
          </div>
          
          {/* Cart Items */}
          <div style={{ marginBottom: isMobile ? '1.5rem' : '2rem' }}>
            <div style={{
              fontSize: isMobile ? '0.875rem' : '0.95rem',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.7)',
              marginBottom: '0.75rem'
            }}>
              Items ({cart.length})
            </div>
            
            {cart.length === 0 ? (
              <div style={{
                padding: '3rem 1rem',
                textAlign: 'center',
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '12px',
                border: '1px dashed rgba(255, 255, 255, 0.1)'
              }}>
                <div style={{
                  fontSize: isMobile ? '2rem' : '2.5rem',
                  marginBottom: '0.5rem'
                }}>
                  🍽️
                </div>
                <div style={{
                  fontSize: isMobile ? '0.95rem' : '1.05rem',
                  color: 'rgba(255, 255, 255, 0.5)',
                  fontWeight: '500'
                }}>
                  Geen items in je maaltijd
                </div>
              </div>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}>
                {cart.map(item => {
                  const currentValue = item.type === 'meal' 
                    ? (editingAmounts[item.id] ?? item.portion ?? 1)
                    : (editingAmounts[item.id] ?? item.amount ?? 100)
                  
                  return (
                    <div
                      key={item.id}
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '12px',
                        padding: isMobile ? '0.875rem' : '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem'
                      }}
                    >
                      {/* Item Info */}
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: isMobile ? '0.95rem' : '1.05rem',
                          fontWeight: '600',
                          color: '#fff',
                          marginBottom: '0.25rem'
                        }}>
                          {item.name}
                        </div>
                        <div style={{
                          fontSize: isMobile ? '0.75rem' : '0.8rem',
                          color: 'rgba(255, 255, 255, 0.5)',
                          fontWeight: '500'
                        }}>
                          {item.type === 'meal' 
                            ? `${Math.round((item.calories || 0) * currentValue)} kcal • ${Math.round((item.protein || 0) * currentValue * 10) / 10}g eiwit`
                            : `${Math.round((item.calories || 0) * currentValue / 100)} kcal • ${Math.round((item.protein || 0) * currentValue / 100 * 10) / 10}g eiwit`
                          }
                        </div>
                      </div>
                      
                      {/* Amount Controls */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        background: 'rgba(0, 0, 0, 0.3)',
                        borderRadius: '10px',
                        padding: '0.25rem'
                      }}>
                        <button
                          onClick={() => handleAmountChange(item.id, item.type === 'meal' ? -0.25 : -10)}
                          style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: 'none',
                            borderRadius: '8px',
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            touchAction: 'manipulation',
                            WebkitTapHighlightColor: 'transparent',
                            color: '#fff',
                            minWidth: '44px',
                            minHeight: '44px'
                          }}
                        >
                          <Minus size={16} />
                        </button>
                        
                        <div style={{
                          minWidth: '60px',
                          textAlign: 'center',
                          fontSize: isMobile ? '0.875rem' : '0.95rem',
                          fontWeight: '600',
                          color: '#10b981'
                        }}>
                          {item.type === 'meal' 
                            ? `${currentValue}x`
                            : `${currentValue}g`
                          }
                        </div>
                        
                        <button
                          onClick={() => handleAmountChange(item.id, item.type === 'meal' ? 0.25 : 10)}
                          style={{
                            background: 'rgba(16, 185, 129, 0.2)',
                            border: 'none',
                            borderRadius: '8px',
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            touchAction: 'manipulation',
                            WebkitTapHighlightColor: 'transparent',
                            color: '#10b981',
                            minWidth: '44px',
                            minHeight: '44px'
                          }}
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                      
                      {/* Remove Button */}
                      <button
                        onClick={() => handleRemove(item.id)}
                        style={{
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.2)',
                          borderRadius: '10px',
                          width: '40px',
                          height: '40px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          touchAction: 'manipulation',
                          WebkitTapHighlightColor: 'transparent',
                          color: '#ef4444',
                          transition: 'all 0.2s ease',
                          minWidth: '44px',
                          minHeight: '44px'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'
                          e.currentTarget.style.transform = 'scale(1.05)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'
                          e.currentTarget.style.transform = 'scale(1)'
                        }}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
          
          {/* Macro Totals */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: '16px',
            padding: isMobile ? '1.25rem' : '1.5rem',
            marginBottom: isMobile ? '1.5rem' : '2rem'
          }}>
            <div style={{
              fontSize: isMobile ? '0.95rem' : '1.05rem',
              fontWeight: '700',
              color: '#10b981',
              marginBottom: '1rem',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Totale Macros
            </div>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '0.75rem'
            }}>
              {/* Calories */}
              <div style={{
                background: 'rgba(0, 0, 0, 0.2)',
                borderRadius: '12px',
                padding: isMobile ? '0.875rem' : '1rem',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: isMobile ? '1.75rem' : '2rem',
                  fontWeight: '700',
                  color: '#10b981',
                  marginBottom: '0.15rem'
                }}>
                  {totals.calories}
                </div>
                <div style={{
                  fontSize: isMobile ? '0.75rem' : '0.8rem',
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  kcal
                </div>
              </div>
              
              {/* Protein */}
              <div style={{
                background: 'rgba(0, 0, 0, 0.2)',
                borderRadius: '12px',
                padding: isMobile ? '0.875rem' : '1rem',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: isMobile ? '1.75rem' : '2rem',
                  fontWeight: '700',
                  color: '#8b5cf6',
                  marginBottom: '0.15rem'
                }}>
                  {totals.protein}
                </div>
                <div style={{
                  fontSize: isMobile ? '0.75rem' : '0.8rem',
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Eiwit (g)
                </div>
              </div>
              
              {/* Carbs */}
              <div style={{
                background: 'rgba(0, 0, 0, 0.2)',
                borderRadius: '12px',
                padding: isMobile ? '0.875rem' : '1rem',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: isMobile ? '1.75rem' : '2rem',
                  fontWeight: '700',
                  color: '#f59e0b',
                  marginBottom: '0.15rem'
                }}>
                  {totals.carbs}
                </div>
                <div style={{
                  fontSize: isMobile ? '0.75rem' : '0.8rem',
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Kool (g)
                </div>
              </div>
              
              {/* Fat */}
              <div style={{
                background: 'rgba(0, 0, 0, 0.2)',
                borderRadius: '12px',
                padding: isMobile ? '0.875rem' : '1rem',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: isMobile ? '1.75rem' : '2rem',
                  fontWeight: '700',
                  color: '#ec4899',
                  marginBottom: '0.15rem'
                }}>
                  {totals.fat}
                </div>
                <div style={{
                  fontSize: isMobile ? '0.75rem' : '0.8rem',
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Vet (g)
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer Actions */}
        <div style={{
          padding: isMobile ? '1rem' : '1.5rem 2rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          background: 'rgba(0, 0, 0, 0.3)',
          display: 'flex',
          gap: '0.75rem'
        }}>
          {/* Add More Button */}
          <button
            onClick={onBack}
            style={{
              flex: 1,
              padding: isMobile ? '1rem' : '1.125rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: isMobile ? '0.95rem' : '1.05rem',
              fontWeight: '600',
              cursor: 'pointer',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s ease',
              minHeight: '44px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
            }}
          >
            <Plus size={18} />
            Toevoegen
          </button>
          
          {/* Log Meal Button */}
          <button
            onClick={handleComplete}
            disabled={isSubmitting || cart.length === 0 || !mealName.trim()}
            style={{
              flex: 2,
              padding: isMobile ? '1rem' : '1.125rem',
              background: (isSubmitting || cart.length === 0 || !mealName.trim())
                ? 'rgba(16, 185, 129, 0.3)'
                : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: 'none',
              borderRadius: '12px',
              color: '#fff',
              fontSize: isMobile ? '0.95rem' : '1.05rem',
              fontWeight: '700',
              cursor: (isSubmitting || cart.length === 0 || !mealName.trim()) ? 'not-allowed' : 'pointer',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
              minHeight: '44px',
              opacity: (isSubmitting || cart.length === 0 || !mealName.trim()) ? 0.5 : 1
            }}
            onMouseEnter={(e) => {
              if (!isSubmitting && cart.length > 0 && mealName.trim()) {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.4)'
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)'
            }}
          >
            <Check size={18} />
            {isSubmitting ? 'Bezig...' : 'Log Maaltijd'}
          </button>
        </div>
      </div>
    </div>
  )
}
