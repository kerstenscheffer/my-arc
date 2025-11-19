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
  
  // Feedback state
  const [feedbackStatus, setFeedbackStatus] = useState(null) // 'loading', 'success', 'error'
  
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
    
    setFeedbackStatus('loading')
    
    try {
      // Build final meal data
      const finalMealData = {
        meal_name: mealName.trim(),
        calories: totals.calories,
        protein: totals.protein,
        carbs: totals.carbs,
        fat: totals.fat,
        ingredients: cart.flatMap(item => {
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
      
      // Show success
      setFeedbackStatus('success')
      
      // Auto-close after 1.5 seconds
      setTimeout(() => {
        setFeedbackStatus(null)
        // Parent will handle close
      }, 1500)
      
    } catch (error) {
      console.error('❌ [MealAssemblyView] Error completing meal:', error)
      setFeedbackStatus('error')
    }
  }
  
  // Handle feedback close
  const handleFeedbackClose = () => {
    setFeedbackStatus(null)
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
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
        position: 'relative'
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
              disabled={feedbackStatus === 'loading'}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: feedbackStatus === 'loading' ? 'not-allowed' : 'pointer',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                color: 'rgba(255, 255, 255, 0.7)',
                transition: 'all 0.2s ease',
                opacity: feedbackStatus === 'loading' ? 0.5 : 1
              }}
              onMouseEnter={(e) => {
                if (feedbackStatus !== 'loading') {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                  e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.3)'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
              }}
            >
              <ChevronLeft size={20} />
            </button>
            
            <h2 style={{
              fontSize: isMobile ? '1.2rem' : '1.4rem',
              fontWeight: '700',
              color: '#10b981',
              margin: 0
            }}>
              Samenvoegen
            </h2>
          </div>
          
          <button
            onClick={onClose}
            disabled={feedbackStatus === 'loading'}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.5)',
              cursor: feedbackStatus === 'loading' ? 'not-allowed' : 'pointer',
              padding: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '44px',
              minWidth: '44px',
              transition: 'color 0.2s ease',
              opacity: feedbackStatus === 'loading' ? 0.5 : 1
            }}
            onMouseEnter={(e) => {
              if (feedbackStatus !== 'loading') {
                e.currentTarget.style.color = '#fff'
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)'
            }}
          >
            <X size={24} />
          </button>
        </div>
        
        {/* Content - Scrollable */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: isMobile ? '1.5rem 1rem' : '2rem',
          WebkitOverflowScrolling: 'touch'
        }}>
          {/* Meal Name Input */}
          <div style={{ marginBottom: isMobile ? '1.5rem' : '2rem' }}>
            <label style={{
              display: 'block',
              fontSize: isMobile ? '0.85rem' : '0.9rem',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.7)',
              marginBottom: '0.5rem',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Naam Maaltijd
            </label>
            <input
              type="text"
              value={mealName}
              onChange={(e) => setMealName(e.target.value)}
              placeholder="Geef je maaltijd een naam..."
              disabled={feedbackStatus === 'loading'}
              style={{
                width: '100%',
                padding: isMobile ? '0.875rem 1rem' : '1rem 1.25rem',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                color: '#fff',
                fontSize: isMobile ? '0.95rem' : '1.05rem',
                fontWeight: '500',
                outline: 'none',
                transition: 'all 0.2s ease',
                opacity: feedbackStatus === 'loading' ? 0.5 : 1
              }}
              onFocus={(e) => {
                if (feedbackStatus !== 'loading') {
                  e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.4)'
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                }
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
              }}
            />
          </div>
          
          {/* Cart Items */}
          <div style={{ marginBottom: isMobile ? '1.5rem' : '2rem' }}>
            <div style={{
              fontSize: isMobile ? '0.85rem' : '0.9rem',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.7)',
              marginBottom: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Items ({cart.length})
            </div>
            
            {cart.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: isMobile ? '3rem 1rem' : '4rem 2rem',
                color: 'rgba(255, 255, 255, 0.4)'
              }}>
                <div style={{
                  fontSize: isMobile ? '3rem' : '4rem',
                  marginBottom: '1rem'
                }}>
                  🍽️
                </div>
                <div style={{
                  fontSize: isMobile ? '1rem' : '1.1rem',
                  fontWeight: '600',
                  marginBottom: '0.5rem'
                }}>
                  Je mandje is leeg
                </div>
                <div style={{
                  fontSize: isMobile ? '0.85rem' : '0.9rem'
                }}>
                  Voeg ingrediënten of gerechten toe
                </div>
              </div>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}>
                {cart.map((item) => {
                  const currentValue = item.type === 'meal' 
                    ? (editingAmounts[item.id] ?? item.portion ?? 1)
                    : (editingAmounts[item.id] ?? item.amount ?? 100)
                  
                  const displayCalories = item.type === 'meal'
                    ? Math.round((item.calories || 0) * currentValue)
                    : Math.round((item.calories || 0) * (currentValue / 100))
                  
                  return (
                    <div
                      key={item.id}
                      style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '14px',
                        padding: isMobile ? '1rem' : '1.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {/* Item Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: isMobile ? '0.95rem' : '1.05rem',
                          fontWeight: '600',
                          color: '#fff',
                          marginBottom: '0.25rem',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {item.name}
                        </div>
                        <div style={{
                          fontSize: isMobile ? '0.75rem' : '0.8rem',
                          color: 'rgba(255, 255, 255, 0.5)',
                          fontWeight: '500'
                        }}>
                          {displayCalories} kcal
                          {item.type === 'meal' && ' • Gerecht'}
                        </div>
                      </div>
                      
                      {/* Amount/Portion Controls */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        flexShrink: 0
                      }}>
                        <button
                          onClick={() => handleAmountChange(item.id, item.type === 'meal' ? -0.25 : -10)}
                          disabled={feedbackStatus === 'loading'}
                          style={{
                            width: '32px',
                            height: '32px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '8px',
                            color: '#fff',
                            cursor: feedbackStatus === 'loading' ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            touchAction: 'manipulation',
                            WebkitTapHighlightColor: 'transparent',
                            transition: 'all 0.2s ease',
                            opacity: feedbackStatus === 'loading' ? 0.5 : 1
                          }}
                          onMouseEnter={(e) => {
                            if (feedbackStatus !== 'loading') {
                              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                          }}
                        >
                          <Minus size={14} />
                        </button>
                        
                        <div style={{
                          fontSize: isMobile ? '0.85rem' : '0.9rem',
                          color: '#10b981',
                          fontWeight: '700',
                          minWidth: item.type === 'meal' ? '45px' : '55px',
                          textAlign: 'center'
                        }}>
                          {item.type === 'meal'
                            ? `${currentValue}x`
                            : `${currentValue}g`
                          }
                        </div>
                        
                        <button
                          onClick={() => handleAmountChange(item.id, item.type === 'meal' ? 0.25 : 10)}
                          disabled={feedbackStatus === 'loading'}
                          style={{
                            width: '32px',
                            height: '32px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '8px',
                            color: '#fff',
                            cursor: feedbackStatus === 'loading' ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            touchAction: 'manipulation',
                            WebkitTapHighlightColor: 'transparent',
                            transition: 'all 0.2s ease',
                            opacity: feedbackStatus === 'loading' ? 0.5 : 1
                          }}
                          onMouseEnter={(e) => {
                            if (feedbackStatus !== 'loading') {
                              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                          }}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      
                      {/* Remove Button */}
                      <button
                        onClick={() => handleRemove(item.id)}
                        disabled={feedbackStatus === 'loading'}
                        style={{
                          width: '36px',
                          height: '36px',
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          borderRadius: '8px',
                          color: '#ef4444',
                          cursor: feedbackStatus === 'loading' ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          touchAction: 'manipulation',
                          WebkitTapHighlightColor: 'transparent',
                          flexShrink: 0,
                          transition: 'all 0.2s ease',
                          opacity: feedbackStatus === 'loading' ? 0.5 : 1
                        }}
                        onMouseEnter={(e) => {
                          if (feedbackStatus !== 'loading') {
                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'
                        }}
                      >
                        <Trash2 size={16} />
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
            disabled={feedbackStatus === 'loading'}
            style={{
              flex: 1,
              padding: isMobile ? '1rem' : '1.125rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: isMobile ? '0.95rem' : '1.05rem',
              fontWeight: '600',
              cursor: feedbackStatus === 'loading' ? 'not-allowed' : 'pointer',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s ease',
              minHeight: '44px',
              opacity: feedbackStatus === 'loading' ? 0.5 : 1
            }}
            onMouseEnter={(e) => {
              if (feedbackStatus !== 'loading') {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
              }
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
            disabled={feedbackStatus === 'loading' || cart.length === 0 || !mealName.trim()}
            style={{
              flex: 2,
              padding: isMobile ? '1rem' : '1.125rem',
              background: (feedbackStatus === 'loading' || cart.length === 0 || !mealName.trim())
                ? 'rgba(16, 185, 129, 0.3)'
                : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: 'none',
              borderRadius: '12px',
              color: '#fff',
              fontSize: isMobile ? '0.95rem' : '1.05rem',
              fontWeight: '700',
              cursor: (feedbackStatus === 'loading' || cart.length === 0 || !mealName.trim()) ? 'not-allowed' : 'pointer',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
              minHeight: '44px',
              opacity: (feedbackStatus === 'loading' || cart.length === 0 || !mealName.trim()) ? 0.5 : 1
            }}
            onMouseEnter={(e) => {
              if (!feedbackStatus && cart.length > 0 && mealName.trim()) {
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
            {feedbackStatus === 'loading' ? 'Bezig met opslaan...' : 'Log Maaltijd'}
          </button>
        </div>

        {/* Feedback Overlay */}
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
            zIndex: 10001,
            animation: 'fadeIn 0.2s ease'
          }}>
            {/* Loading Spinner */}
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
                <div style={{
                  fontSize: isMobile ? '0.95rem' : '1.05rem',
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontWeight: '500'
                }}>
                  {mealName}
                </div>
              </>
            )}

            {/* Success Checkmark */}
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
                <div style={{
                  fontSize: isMobile ? '0.95rem' : '1.05rem',
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontWeight: '500'
                }}>
                  {mealName}
                </div>
              </>
            )}

            {/* Error State */}
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
                  onClick={handleFeedbackClose}
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

      {/* Animations */}
      <style>{`
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
}
