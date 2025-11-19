import React, { useState, useEffect } from 'react'
import { Search, ShoppingCart, Barcode, ArrowLeft, X, Plus, Check } from 'lucide-react'

/**
 * IngredientSelector - Search and select ingredients from ai_ingredients table
 * Supports text search and barcode scanning
 */
export default function IngredientSelector({
  db,
  cart,
  onIngredientAdded,
  onViewCart,
  onBack,
  onClose
}) {
  const isMobile = window.innerWidth <= 768
  
  // State
  const [searchQuery, setSearchQuery] = useState('')
  const [ingredients, setIngredients] = useState([])
  const [filteredIngredients, setFilteredIngredients] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false)
  
  const categories = [
    { id: 'all', label: 'Alles', emoji: '🍽️' },
    { id: 'protein', label: 'Eiwit', emoji: '🥩' },
    { id: 'carbs', label: 'Koolhydraten', emoji: '🍞' },
    { id: 'vegetables', label: 'Groente', emoji: '🥦' },
    { id: 'fats', label: 'Vetten', emoji: '🥑' },
    { id: 'dairy', label: 'Zuivel', emoji: '🥛' },
    { id: 'fruits', label: 'Fruit', emoji: '🍎' }
  ]
  
  useEffect(() => {
    console.log('🎯 [IngredientSelector] Mounted')
    loadIngredients()
  }, [])
  
  useEffect(() => {
    filterIngredients()
  }, [searchQuery, selectedCategory, ingredients])
  
  // Load all ingredients from database
  const loadIngredients = async () => {
    console.log('🔍 [IngredientSelector] Loading ingredients...')
    setIsLoading(true)
    
    try {
      const { data, error } = await db.supabase
        .from('ai_ingredients')
        .select('*')
        .order('name', { ascending: true })
        .limit(200)
      
      if (error) throw error
      
      console.log('✅ [IngredientSelector] Loaded:', data?.length || 0, 'ingredients')
      setIngredients(data || [])
    } catch (error) {
      console.error('❌ [IngredientSelector] Error loading ingredients:', error)
      setIngredients([])
    } finally {
      setIsLoading(false)
    }
  }
  
  // Filter ingredients based on search and category
  const filterIngredients = () => {
    let filtered = [...ingredients]
    
    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(ing => 
        ing.category?.toLowerCase() === selectedCategory
      )
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(ing =>
        ing.name?.toLowerCase().includes(query) ||
        ing.name_en?.toLowerCase().includes(query)
      )
    }
    
    setFilteredIngredients(filtered)
  }
  
  // Add ingredient to cart
  const handleAddIngredient = (ingredient) => {
    console.log('✅ [IngredientSelector] Added:', ingredient.name)
    
    // Create cart item from ingredient
    const cartItem = {
      id: `ing-${ingredient.id}-${Date.now()}`,
      type: 'ingredient',
      name: ingredient.name,
      amount: ingredient.default_portion_gram || 100,
      unit: 'g',
      calories: ingredient.calories_per_100g || 0,
      protein: ingredient.protein_per_100g || 0,
      carbs: ingredient.carbs_per_100g || 0,
      fat: ingredient.fat_per_100g || 0,
      fiber: ingredient.fiber_per_100g || 0,
      allergens: ingredient.allergens || []
    }
    
    onIngredientAdded(cartItem)
  }
  
  // Check if ingredient is already in cart
  const isInCart = (ingredientId) => {
    return cart.some(item => 
      item.type === 'ingredient' && item.id.includes(ingredientId)
    )
  }
  
  // Barcode scan handler (basic implementation)
  const handleBarcodeSearch = async (barcode) => {
    console.log('🔍 [IngredientSelector] Barcode search:', barcode)
    
    try {
      const { data, error } = await db.supabase
        .from('ai_ingredients')
        .select('*')
        .eq('barcode', barcode)
        .single()
      
      if (error) throw error
      
      if (data) {
        console.log('✅ [IngredientSelector] Found ingredient by barcode:', data.name)
        handleAddIngredient(data)
        setShowBarcodeScanner(false)
      } else {
        alert('Geen ingredient gevonden met deze barcode')
      }
    } catch (error) {
      console.error('❌ [IngredientSelector] Barcode search error:', error)
      alert('Barcode niet gevonden in database')
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
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.02) 100%)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem'
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
                  transition: 'all 0.2s ease',
                  minWidth: '44px',
                  minHeight: '44px'
                }}
              >
                <ArrowLeft size={20} />
              </button>
              
              <div>
                <div style={{
                  fontSize: isMobile ? '1.25rem' : '1.5rem',
                  fontWeight: '700',
                  color: '#fff'
                }}>
                  Zoek Ingrediënten
                </div>
                <div style={{
                  fontSize: isMobile ? '0.8rem' : '0.875rem',
                  color: 'rgba(255, 255, 255, 0.5)',
                  fontWeight: '500'
                }}>
                  {filteredIngredients.length} resultaten
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {/* Cart Badge */}
              <button
                onClick={onViewCart}
                style={{
                  position: 'relative',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '10px',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  color: '#10b981',
                  transition: 'all 0.2s ease',
                  minWidth: '44px',
                  minHeight: '44px'
                }}
              >
                <ShoppingCart size={20} />
                {cart.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    background: '#10b981',
                    color: '#000',
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.7rem',
                    fontWeight: '700',
                    border: '2px solid #0a0a0a'
                  }}>
                    {cart.length}
                  </div>
                )}
              </button>
              
              {/* Close Button */}
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
                  transition: 'all 0.2s ease',
                  minWidth: '44px',
                  minHeight: '44px'
                }}
              >
                <X size={20} />
              </button>
            </div>
          </div>
          
          {/* Search Bar */}
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            marginBottom: '1rem'
          }}>
            <div style={{
              flex: 1,
              position: 'relative'
            }}>
              <Search
                size={18}
                style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'rgba(255, 255, 255, 0.4)',
                  pointerEvents: 'none'
                }}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Zoek ingrediënten..."
                style={{
                  width: '100%',
                  padding: isMobile ? '0.875rem 1rem 0.875rem 2.75rem' : '1rem 1.25rem 1rem 3rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: isMobile ? '0.95rem' : '1rem',
                  fontWeight: '500',
                  outline: 'none',
                  transition: 'all 0.2s ease',
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
            
            {/* Barcode Button */}
            <button
              onClick={() => setShowBarcodeScanner(true)}
              style={{
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '12px',
                padding: isMobile ? '0.875rem' : '1rem',
                cursor: 'pointer',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                minWidth: '44px',
                minHeight: '44px'
              }}
            >
              <Barcode size={20} />
            </button>
          </div>
          
          {/* Category Filters */}
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  padding: isMobile ? '0.5rem 0.875rem' : '0.625rem 1rem',
                  background: selectedCategory === cat.id
                    ? 'rgba(16, 185, 129, 0.2)'
                    : 'rgba(255, 255, 255, 0.05)',
                  border: selectedCategory === cat.id
                    ? '1px solid rgba(16, 185, 129, 0.4)'
                    : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  color: selectedCategory === cat.id ? '#10b981' : 'rgba(255, 255, 255, 0.7)',
                  fontSize: isMobile ? '0.8rem' : '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  transition: 'all 0.2s ease',
                  minHeight: '44px'
                }}
              >
                <span>{cat.emoji}</span>
                {cat.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* Results Grid */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: isMobile ? '1rem' : '1.5rem 2rem',
          WebkitOverflowScrolling: 'touch'
        }}>
          {isLoading ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '3rem',
              color: 'rgba(255, 255, 255, 0.5)'
            }}>
              <div style={{
                fontSize: isMobile ? '0.95rem' : '1.05rem',
                fontWeight: '600'
              }}>
                Laden...
              </div>
            </div>
          ) : filteredIngredients.length === 0 ? (
            <div style={{
              padding: '3rem 1rem',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: isMobile ? '2.5rem' : '3rem',
                marginBottom: '1rem'
              }}>
                🔍
              </div>
              <div style={{
                fontSize: isMobile ? '1.05rem' : '1.15rem',
                fontWeight: '600',
                color: 'rgba(255, 255, 255, 0.8)',
                marginBottom: '0.5rem'
              }}>
                Geen ingrediënten gevonden
              </div>
              <div style={{
                fontSize: isMobile ? '0.875rem' : '0.95rem',
                color: 'rgba(255, 255, 255, 0.5)',
                fontWeight: '500'
              }}>
                Probeer een andere zoekterm of categorie
              </div>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
              gap: '0.75rem'
            }}>
              {filteredIngredients.map(ingredient => {
                const inCart = isInCart(ingredient.id)
                
                return (
                  <div
                    key={ingredient.id}
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: inCart 
                        ? '1px solid rgba(16, 185, 129, 0.4)'
                        : '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px',
                      padding: isMobile ? '0.875rem' : '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.75rem',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: isMobile ? '0.95rem' : '1.05rem',
                        fontWeight: '600',
                        color: '#fff',
                        marginBottom: '0.25rem'
                      }}>
                        {ingredient.name}
                      </div>
                      <div style={{
                        fontSize: isMobile ? '0.75rem' : '0.8rem',
                        color: 'rgba(255, 255, 255, 0.5)',
                        fontWeight: '500'
                      }}>
                        {Math.round(ingredient.calories_per_100g || 0)} kcal • {' '}
                        {Math.round((ingredient.protein_per_100g || 0) * 10) / 10}g eiwit
                        {' '} per 100g
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleAddIngredient(ingredient)}
                      disabled={inCart}
                      style={{
                        background: inCart
                          ? 'rgba(16, 185, 129, 0.2)'
                          : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        border: 'none',
                        borderRadius: '10px',
                        width: '40px',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: inCart ? 'default' : 'pointer',
                        touchAction: 'manipulation',
                        WebkitTapHighlightColor: 'transparent',
                        color: '#fff',
                        transition: 'all 0.2s ease',
                        minWidth: '44px',
                        minHeight: '44px',
                        flexShrink: 0
                      }}
                      onMouseEnter={(e) => {
                        if (!inCart) {
                          e.currentTarget.style.transform = 'scale(1.05)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)'
                      }}
                    >
                      {inCart ? <Check size={18} /> : <Plus size={18} />}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
        
        {/* Barcode Scanner Modal */}
        {showBarcodeScanner && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '1rem'
          }}>
            <div style={{
              background: '#0a0a0a',
              borderRadius: '20px',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              padding: isMobile ? '1.5rem' : '2rem',
              maxWidth: '400px',
              width: '100%',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: isMobile ? '2rem' : '2.5rem',
                marginBottom: '1rem'
              }}>
                <Barcode size={isMobile ? 48 : 64} color="#10b981" />
              </div>
              
              <div style={{
                fontSize: isMobile ? '1.15rem' : '1.25rem',
                fontWeight: '700',
                color: '#fff',
                marginBottom: '0.5rem'
              }}>
                Barcode Scanner
              </div>
              
              <div style={{
                fontSize: isMobile ? '0.875rem' : '0.95rem',
                color: 'rgba(255, 255, 255, 0.6)',
                marginBottom: '1.5rem',
                fontWeight: '500'
              }}>
                Scan de barcode van je product
              </div>
              
              {/* Basic barcode input - can be enhanced with actual camera scanner */}
              <input
                type="text"
                placeholder="Voer barcode in..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleBarcodeSearch(e.target.value)
                  }
                }}
                style={{
                  width: '100%',
                  padding: '1rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '1rem',
                  textAlign: 'center',
                  marginBottom: '1rem',
                  outline: 'none'
                }}
              />
              
              <button
                onClick={() => setShowBarcodeScanner(false)}
                style={{
                  width: '100%',
                  padding: '1rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  minHeight: '44px'
                }}
              >
                Annuleren
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
