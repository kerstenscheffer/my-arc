// src/modules/meal-logging-wizard/components/QuickAddFlow.jsx
import React, { useState, useEffect } from 'react'
import { Search, Scan, Plus, X, Flame, Target, Zap, Droplets, Check } from 'lucide-react'
import BarcodeScanner from '../../client-meal-builder/components/BarcodeScanner'
import OpenFoodFactsService from '../../client-meal-builder/OpenFoodFactsService'

/**
 * MY ARC - QUICK ADD FLOW
 * Direct ingredient logging - scan/search → pick amount → log
 * No cart, no meal name, just quick logging
 */
export default function QuickAddFlow({ 
  client, 
  db, 
  mealLoggingService,
  onMealLogged,
  onClose 
}) {
  const isMobile = window.innerWidth <= 768

  // Services
  const [offService] = useState(() => new OpenFoodFactsService())

  // Search state
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [loading, setLoading] = useState(false)

  // Scanner state
  const [showScanner, setShowScanner] = useState(false)

  // Amount picker state
  const [amountPickerOpen, setAmountPickerOpen] = useState(false)
  const [selectedIngredient, setSelectedIngredient] = useState(null)
  const [amount, setAmount] = useState(100)

  // Feedback state
  const [feedbackStatus, setFeedbackStatus] = useState(null) // 'loading', 'success'
  const [feedbackIngredient, setFeedbackIngredient] = useState('')

  // Load initial ingredients
  useEffect(() => {
    loadDefaultIngredients()
  }, [])

  // Load default popular ingredients
  const loadDefaultIngredients = async () => {
    try {
      const { data, error } = await db.supabase
        .from('ai_ingredients')
        .select('*')
        .order('name', { ascending: true })
        .limit(20)
      
      if (error) throw error
      setSearchResults(data || [])
    } catch (error) {
      console.error('❌ Failed to load ingredients:', error)
    }
  }

  // Search ingredients
  const handleSearch = async (value) => {
    setSearchTerm(value)

    if (!value || value.length < 2) {
      loadDefaultIngredients()
      return
    }

    setLoading(true)
    try {
      // Search internal database first
      const { data, error } = await db.supabase
        .from('ai_ingredients')
        .select('*')
        .or(`name.ilike.%${value}%,name_en.ilike.%${value}%`)
        .order('name', { ascending: true })
        .limit(30)
      
      if (error) throw error
      setSearchResults(data || [])
    } catch (error) {
      console.error('❌ Search error:', error)
      setSearchResults([])
    } finally {
      setLoading(false)
    }
  }

  // Barcode scanned
  const handleBarcodeScanned = async (barcode) => {
    console.log('📊 Barcode scanned:', barcode)
    setShowScanner(false)
    setLoading(true)

    try {
      // Lookup in OpenFoodFacts
      const product = await offService.getProductByBarcode(barcode)
      
      if (!product) {
        alert('Product niet gevonden in database')
        setLoading(false)
        return
      }

      console.log('✅ Product found:', product.name)
      
      // Open amount picker with external product
      setSelectedIngredient({
        ...product,
        source: 'external',
        isExternal: true
      })
      setAmount(100)
      setAmountPickerOpen(true)
      
    } catch (error) {
      console.error('❌ Barcode lookup error:', error)
      alert('Fout bij ophalen product')
    } finally {
      setLoading(false)
    }
  }

  // Ingredient clicked
  const handleIngredientClick = (ingredient) => {
    setSelectedIngredient(ingredient)
    setAmount(ingredient.default_portion_gram || 100)
    setAmountPickerOpen(true)
  }

  // Log ingredient
  const handleLogIngredient = async () => {
    if (!selectedIngredient || !amount) return

    const ingredient = selectedIngredient
    const grams = parseFloat(amount)

    // Calculate scaled macros
    const factor = grams / 100
    const calories = Math.round((ingredient.calories_per_100g || 0) * factor)
    const protein = Math.round((ingredient.protein_per_100g || 0) * factor)
    const carbs = Math.round((ingredient.carbs_per_100g || 0) * factor)
    const fat = Math.round((ingredient.fat_per_100g || 0) * factor)

    console.log('🎯 Logging ingredient:', {
      name: ingredient.name,
      amount: grams,
      calories,
      protein,
      carbs,
      fat
    })

    // Close amount picker
    setAmountPickerOpen(false)

    // Show loading feedback
    setFeedbackStatus('loading')
    setFeedbackIngredient(`${ingredient.name} (${grams}g)`)

    try {
      // Log to consumed_meals
      await mealLoggingService.logConsumedMeal(client.id, {
        meal_name: `${ingredient.name} (${grams}g)`,
        meal_type: 'ingredient',
        calories: calories,
        protein: protein,
        carbs: carbs,
        fat: fat,
        ingredients: [{
          ingredient_id: ingredient.id || null,
          ingredient_name: ingredient.name,
          amount: grams,
          unit: 'gram'
        }],
        source: ingredient.isExternal ? 'openfoodfacts' : 'quick_add_flow'
      })

      console.log('✅ Ingredient logged successfully')

      // Show success
      setFeedbackStatus('success')

      // Auto-close feedback after 800ms and stay in flow
      setTimeout(() => {
        setFeedbackStatus(null)
        setFeedbackIngredient('')
        setSelectedIngredient(null)
        setAmount(100)
        
        // Call parent callback
        if (onMealLogged) {
          onMealLogged()
        }
      }, 800)

    } catch (error) {
      console.error('❌ Failed to log ingredient:', error)
      alert('Fout bij opslaan')
      setFeedbackStatus(null)
    }
  }

  return (
    <>
      {/* Main Modal */}
      <div
        onClick={(e) => {
          if (e.target === e.currentTarget && !feedbackStatus) onClose()
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
            <div>
              <h2 style={{
                fontSize: isMobile ? '1.2rem' : '1.5rem',
                fontWeight: '700',
                color: '#10b981',
                margin: 0
              }}>
                Snel Toevoegen
              </h2>
              <p style={{
                fontSize: isMobile ? '0.8rem' : '0.9rem',
                color: 'rgba(255, 255, 255, 0.5)',
                margin: '0.25rem 0 0'
              }}>
                Scan of zoek ingrediënt → Log direct
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={feedbackStatus === 'loading'}
              style={{
                background: 'none',
                border: 'none',
                color: '#666',
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
                fontSize: isMobile ? '1.5rem' : '1.75rem',
                opacity: feedbackStatus === 'loading' ? 0.3 : 1
              }}
              onMouseEnter={(e) => {
                if (feedbackStatus !== 'loading') e.currentTarget.style.color = '#fff'
              }}
              onMouseLeave={(e) => e.currentTarget.style.color = '#666'}
            >
              ×
            </button>
          </div>

          {/* Content */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: isMobile ? '1rem' : '1.5rem 2rem',
            position: 'relative'
          }}>
            {/* Search Bar + Scanner Button */}
            <div style={{
              display: 'flex',
              gap: '0.75rem',
              marginBottom: '1.5rem'
            }}>
              {/* Search Input */}
              <div style={{
                flex: 1,
                position: 'relative'
              }}>
                <Search 
                  size={isMobile ? 18 : 20} 
                  color="rgba(255, 255, 255, 0.4)"
                  style={{
                    position: 'absolute',
                    left: isMobile ? '0.875rem' : '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none'
                  }}
                />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Zoek ingredient..."
                  style={{
                    width: '100%',
                    height: isMobile ? '48px' : '52px',
                    background: 'rgba(17, 17, 17, 0.8)',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: isMobile ? '0.95rem' : '1rem',
                    padding: `0 ${isMobile ? '1rem' : '1.25rem'} 0 ${isMobile ? '2.75rem' : '3rem'}`,
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'rgba(16, 185, 129, 0.5)'
                    e.target.style.background = 'rgba(17, 17, 17, 0.95)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(16, 185, 129, 0.2)'
                    e.target.style.background = 'rgba(17, 17, 17, 0.8)'
                  }}
                />
              </div>

              {/* Scanner Button */}
              <button
                onClick={() => setShowScanner(true)}
                style={{
                  width: isMobile ? '48px' : '52px',
                  height: isMobile ? '48px' : '52px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: 'none',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  flexShrink: 0
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)'
                }}
                onTouchStart={(e) => {
                  if (isMobile) e.currentTarget.style.transform = 'scale(0.95)'
                }}
                onTouchEnd={(e) => {
                  if (isMobile) e.currentTarget.style.transform = 'scale(1)'
                }}
              >
                <Scan size={isMobile ? 20 : 22} color="#fff" />
              </button>
            </div>

            {/* Loading Indicator */}
            {loading && (
              <div style={{
                textAlign: 'center',
                padding: '2rem',
                color: 'rgba(255, 255, 255, 0.5)'
              }}>
                Zoeken...
              </div>
            )}

            {/* Search Results */}
            {!loading && searchResults.length > 0 && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
                gap: isMobile ? '0.75rem' : '1rem'
              }}>
                {searchResults.map((ingredient) => (
                  <div
                    key={ingredient.id}
                    style={{
                      background: 'rgba(17, 17, 17, 0.5)',
                      border: '1px solid rgba(16, 185, 129, 0.15)',
                      borderRadius: '12px',
                      padding: isMobile ? '0.875rem' : '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: isMobile ? '0.75rem' : '1rem',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {/* Info */}
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
                        {ingredient.name}
                      </div>
                      <div style={{
                        fontSize: isMobile ? '0.75rem' : '0.8rem',
                        color: 'rgba(255, 255, 255, 0.5)',
                        display: 'flex',
                        gap: '0.75rem',
                        flexWrap: 'wrap'
                      }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Flame size={12} color="#f59e0b" />
                          {ingredient.calories_per_100g || 0}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Target size={12} color="#8b5cf6" />
                          {ingredient.protein_per_100g || 0}g
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Zap size={12} color="#ef4444" />
                          {ingredient.carbs_per_100g || 0}g
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Droplets size={12} color="#3b82f6" />
                          {ingredient.fat_per_100g || 0}g
                        </span>
                      </div>
                    </div>

                    {/* Add Button */}
                    <button
                      onClick={() => handleIngredientClick(ingredient)}
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 4px 8px rgba(16, 185, 129, 0.2)',
                        touchAction: 'manipulation',
                        WebkitTapHighlightColor: 'transparent',
                        flexShrink: 0
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.05)'
                        e.currentTarget.style.boxShadow = '0 6px 12px rgba(16, 185, 129, 0.3)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)'
                        e.currentTarget.style.boxShadow = '0 4px 8px rgba(16, 185, 129, 0.2)'
                      }}
                      onTouchStart={(e) => {
                        if (isMobile) e.currentTarget.style.transform = 'scale(0.95)'
                      }}
                      onTouchEnd={(e) => {
                        if (isMobile) e.currentTarget.style.transform = 'scale(1)'
                      }}
                    >
                      <Plus size={20} color="#fff" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* No Results */}
            {!loading && searchTerm && searchResults.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '3rem 1rem',
                color: 'rgba(255, 255, 255, 0.5)'
              }}>
                <p style={{ fontSize: isMobile ? '1rem' : '1.1rem', marginBottom: '0.5rem' }}>
                  Geen ingrediënten gevonden
                </p>
                <p style={{ fontSize: isMobile ? '0.85rem' : '0.9rem' }}>
                  Probeer de barcode scanner
                </p>
              </div>
            )}

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
                zIndex: 100,
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
                      Opslaan...
                    </div>
                    {feedbackIngredient && (
                      <div style={{
                        fontSize: isMobile ? '0.95rem' : '1.05rem',
                        color: 'rgba(255, 255, 255, 0.6)',
                        fontWeight: '500'
                      }}>
                        {feedbackIngredient}
                      </div>
                    )}
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
                      <Check size={isMobile ? 40 : 50} color="#000" strokeWidth={3} />
                    </div>
                    <div style={{
                      fontSize: isMobile ? '1.25rem' : '1.5rem',
                      fontWeight: '700',
                      color: '#10b981',
                      textAlign: 'center',
                      animation: 'fadeIn 0.3s ease 0.1s backwards'
                    }}>
                      Gelogd!
                    </div>
                    {feedbackIngredient && (
                      <div style={{
                        fontSize: isMobile ? '0.95rem' : '1.05rem',
                        color: 'rgba(255, 255, 255, 0.6)',
                        fontWeight: '500'
                      }}>
                        {feedbackIngredient}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Amount Picker Modal */}
      {amountPickerOpen && selectedIngredient && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setAmountPickerOpen(false)
          }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.9)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10001,
            padding: isMobile ? '1rem' : '2rem',
            animation: 'fadeIn 0.2s ease'
          }}
        >
          <div
            style={{
              background: '#111',
              border: '2px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '20px',
              padding: isMobile ? '1.5rem' : '2rem',
              width: '100%',
              maxWidth: '400px',
              animation: 'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
          >
            {/* Title */}
            <h3 style={{
              fontSize: isMobile ? '1.25rem' : '1.5rem',
              fontWeight: '700',
              color: '#10b981',
              marginBottom: '0.5rem',
              textAlign: 'center'
            }}>
              Hoeveel gram?
            </h3>

            {/* Ingredient Name */}
            <p style={{
              fontSize: isMobile ? '0.95rem' : '1.05rem',
              color: 'rgba(255, 255, 255, 0.7)',
              marginBottom: '1.5rem',
              textAlign: 'center'
            }}>
              {selectedIngredient.name}
            </p>

            {/* Amount Input */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.5)',
              border: '2px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '12px',
              padding: '1rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                onFocus={(e) => e.target.select()}
                autoFocus
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#fff',
                  fontSize: isMobile ? '2rem' : '2.5rem',
                  fontWeight: '700',
                  textAlign: 'center',
                  width: '120px',
                  outline: 'none'
                }}
              />
              <span style={{
                fontSize: isMobile ? '1.25rem' : '1.5rem',
                color: 'rgba(255, 255, 255, 0.5)',
                fontWeight: '600'
              }}>
                gram
              </span>
            </div>

            {/* Calculated Macros */}
            <div style={{
              background: 'rgba(16, 185, 129, 0.05)',
              border: '1px solid rgba(16, 185, 129, 0.15)',
              borderRadius: '12px',
              padding: '1rem',
              marginBottom: '1.5rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '0.75rem'
            }}>
              {[
                { icon: Flame, label: 'kcal', value: Math.round((selectedIngredient.calories_per_100g || 0) * amount / 100), color: '#f59e0b' },
                { icon: Target, label: 'Eiwit', value: Math.round((selectedIngredient.protein_per_100g || 0) * amount / 100), color: '#8b5cf6', unit: 'g' },
                { icon: Zap, label: 'Koolh.', value: Math.round((selectedIngredient.carbs_per_100g || 0) * amount / 100), color: '#ef4444', unit: 'g' },
                { icon: Droplets, label: 'Vet', value: Math.round((selectedIngredient.fat_per_100g || 0) * amount / 100), color: '#3b82f6', unit: 'g' }
              ].map((macro, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <macro.icon size={16} color={macro.color} />
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '0.75rem',
                      color: 'rgba(255, 255, 255, 0.5)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      {macro.label}
                    </div>
                    <div style={{
                      fontSize: '1rem',
                      fontWeight: '700',
                      color: macro.color
                    }}>
                      {macro.value}{macro.unit || ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Buttons */}
            <div style={{
              display: 'flex',
              gap: '0.75rem'
            }}>
              <button
                onClick={() => setAmountPickerOpen(false)}
                style={{
                  flex: 1,
                  height: '48px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent'
                }}
              >
                Annuleer
              </button>
              <button
                onClick={handleLogIngredient}
                disabled={!amount || amount <= 0}
                style={{
                  flex: 2,
                  height: '48px',
                  background: amount && amount > 0 
                    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                    : 'rgba(16, 185, 129, 0.2)',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '1rem',
                  fontWeight: '700',
                  cursor: amount && amount > 0 ? 'pointer' : 'not-allowed',
                  opacity: amount && amount > 0 ? 1 : 0.5,
                  transition: 'all 0.3s ease',
                  boxShadow: amount && amount > 0 ? '0 6px 16px rgba(16, 185, 129, 0.3)' : 'none',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent'
                }}
                onMouseEnter={(e) => {
                  if (amount && amount > 0) {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(16, 185, 129, 0.4)'
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = amount && amount > 0 ? '0 6px 16px rgba(16, 185, 129, 0.3)' : 'none'
                }}
              >
                Log Ingredient
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Barcode Scanner */}
      {showScanner && (
        <BarcodeScanner
          onScan={handleBarcodeScanned}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* Animations */}
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

        @keyframes scaleIn {
          from {
            transform: scale(0.8);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </>
  )
}
