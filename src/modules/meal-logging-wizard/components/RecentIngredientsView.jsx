import { useState, useEffect } from 'react'
import { Clock, Plus } from 'lucide-react'

export default function RecentIngredientsView({ db, client, onIngredientAdd, cart }) {
  const [recentIngredients, setRecentIngredients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const isMobile = window.innerWidth <= 768

  useEffect(() => {
    if (client?.id && db) {
      loadRecentIngredients()
    }
  }, [client?.id, db])

  const loadRecentIngredients = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔍 [RecentIngredientsView] Loading recent ingredients for client:', client.id)
      
      // Query consumed_meals for last 30 days
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      const { data, error } = await db.supabase
        .from('consumed_meals')
        .select('ingredients, consumed_at')
        .eq('client_id', client.id)
        .gte('consumed_at', thirtyDaysAgo.toISOString())
        .order('consumed_at', { ascending: false })
        .limit(50)
      
      if (error) throw error
      
      console.log('✅ [RecentIngredientsView] Consumed meals loaded:', data?.length || 0)
      
      // Extract unique ingredients
      const ingredientMap = new Map()
      
      if (data && data.length > 0) {
        data.forEach(meal => {
          if (meal.ingredients && Array.isArray(meal.ingredients)) {
            meal.ingredients.forEach(ing => {
              // Use ingredient name or id as key
              const key = ing.id || ing.name
              if (key && !ingredientMap.has(key)) {
                ingredientMap.set(key, {
                  id: ing.id || `ingredient-${ing.name}`,
                  name: ing.name,
                  amount: ing.amount || 100,
                  unit: ing.unit || 'g',
                  calories: ing.calories || 0,
                  protein: ing.protein || 0,
                  carbs: ing.carbs || 0,
                  fat: ing.fat || 0,
                  lastUsed: meal.consumed_at
                })
              }
            })
          }
        })
      }
      
      const uniqueIngredients = Array.from(ingredientMap.values())
        .sort((a, b) => new Date(b.lastUsed) - new Date(a.lastUsed))
        .slice(0, 20)
      
      console.log('✅ [RecentIngredientsView] Unique ingredients extracted:', uniqueIngredients.length)
      setRecentIngredients(uniqueIngredients)
      setLoading(false)
      
    } catch (err) {
      console.error('❌ [RecentIngredientsView] Error loading recent ingredients:', err)
      setError('Kon recente ingrediënten niet laden')
      setLoading(false)
    }
  }

  const handleAddIngredient = (ingredient) => {
    // Check if already in cart
    const alreadyInCart = cart.some(item => 
      item.type === 'ingredient' && item.name === ingredient.name
    )

    if (alreadyInCart) {
      console.log('⚠️ [RecentIngredientsView] Ingredient already in cart:', ingredient.name)
      return
    }

    const cartItem = {
      id: `ingredient-${ingredient.id}-${Date.now()}`,
      type: 'ingredient',
      name: ingredient.name,
      amount: ingredient.amount,
      unit: ingredient.unit,
      calories: ingredient.calories,
      protein: ingredient.protein,
      carbs: ingredient.carbs,
      fat: ingredient.fat,
      portion: 1
    }

    console.log('✅ [RecentIngredientsView] Adding ingredient to cart:', ingredient.name)
    onIngredientAdd(cartItem)
  }

  const getTimeSinceUsed = (lastUsed) => {
    const now = new Date()
    const used = new Date(lastUsed)
    const diffDays = Math.floor((now - used) / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Vandaag'
    if (diffDays === 1) return 'Gisteren'
    if (diffDays < 7) return `${diffDays} dagen geleden`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weken geleden`
    return 'Meer dan een maand geleden'
  }

  if (loading) {
    return (
      <div style={{
        padding: isMobile ? '2rem 1rem' : '3rem 2rem',
        textAlign: 'center',
        color: '#10b981'
      }}>
        <div style={{
          fontSize: isMobile ? '1.2rem' : '1.5rem',
          marginBottom: '1rem'
        }}>
          Laden...
        </div>
        <div style={{
          fontSize: isMobile ? '0.9rem' : '1rem',
          color: '#666'
        }}>
          Recente ingrediënten ophalen
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        padding: isMobile ? '2rem 1rem' : '3rem 2rem',
        textAlign: 'center'
      }}>
        <div style={{
          fontSize: isMobile ? '1.2rem' : '1.5rem',
          color: '#ef4444',
          marginBottom: '1rem'
        }}>
          ⚠️ Fout
        </div>
        <div style={{
          fontSize: isMobile ? '0.9rem' : '1rem',
          color: '#999'
        }}>
          {error}
        </div>
      </div>
    )
  }

  if (recentIngredients.length === 0) {
    return (
      <div style={{
        padding: isMobile ? '2rem 1rem' : '3rem 2rem',
        textAlign: 'center'
      }}>
        <div style={{
          fontSize: isMobile ? '2rem' : '3rem',
          marginBottom: '1rem'
        }}>
          🍽️
        </div>
        <div style={{
          fontSize: isMobile ? '1rem' : '1.2rem',
          color: '#fff',
          marginBottom: '0.5rem'
        }}>
          Geen recente ingrediënten
        </div>
        <div style={{
          fontSize: isMobile ? '0.875rem' : '0.95rem',
          color: '#666'
        }}>
          Log eerst een maaltijd om hier je favoriete ingrediënten terug te zien
        </div>
      </div>
    )
  }

  return (
    <div style={{
      padding: isMobile ? '1rem' : '1.5rem'
    }}>
      {/* Header */}
      <div style={{
        marginBottom: isMobile ? '1rem' : '1.5rem'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? '0.5rem' : '0.75rem',
          marginBottom: '0.5rem'
        }}>
          <Clock size={isMobile ? 18 : 20} color="#10b981" />
          <h3 style={{
            fontSize: isMobile ? '1rem' : '1.2rem',
            fontWeight: '600',
            color: '#fff',
            margin: 0
          }}>
            Recent gebruikt
          </h3>
        </div>
        <p style={{
          fontSize: isMobile ? '0.875rem' : '0.95rem',
          color: '#666',
          margin: 0
        }}>
          {recentIngredients.length} ingrediënt{recentIngredients.length !== 1 ? 'en' : ''} uit de afgelopen 30 dagen
        </p>
      </div>

      {/* Horizontal Scroll Container */}
      <div style={{
        overflowX: 'auto',
        overflowY: 'hidden',
        WebkitOverflowScrolling: 'touch',
        marginLeft: isMobile ? '-1rem' : '-1.5rem',
        marginRight: isMobile ? '-1rem' : '-1.5rem',
        paddingLeft: isMobile ? '1rem' : '1.5rem',
        paddingRight: isMobile ? '1rem' : '1.5rem',
        paddingBottom: '1rem'
      }}>
        <div style={{
          display: 'flex',
          gap: isMobile ? '0.75rem' : '1rem',
          paddingBottom: '0.5rem'
        }}>
          {recentIngredients.map((ingredient) => {
            const inCart = cart.some(item => 
              item.type === 'ingredient' && item.name === ingredient.name
            )

            return (
              <div
                key={ingredient.id}
                style={{
                  minWidth: isMobile ? '200px' : '250px',
                  maxWidth: isMobile ? '200px' : '250px',
                  padding: isMobile ? '1rem' : '1.25rem',
                  background: inCart ? 'rgba(16, 185, 129, 0.1)' : '#111',
                  border: `1px solid ${inCart ? '#10b981' : '#333'}`,
                  borderRadius: isMobile ? '12px' : '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: isMobile ? '0.75rem' : '1rem',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                {/* Ingredient Name */}
                <div style={{
                  fontSize: isMobile ? '0.95rem' : '1.05rem',
                  fontWeight: '600',
                  color: '#fff',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {ingredient.name}
                </div>

                {/* Amount */}
                <div style={{
                  fontSize: isMobile ? '0.875rem' : '0.95rem',
                  color: '#10b981'
                }}>
                  {ingredient.amount}{ingredient.unit}
                </div>

                {/* Macros */}
                <div style={{
                  display: 'flex',
                  gap: isMobile ? '0.5rem' : '0.75rem',
                  flexWrap: 'wrap',
                  fontSize: isMobile ? '0.8rem' : '0.875rem',
                  color: '#666'
                }}>
                  <span>{ingredient.calories} kcal</span>
                  <span>{ingredient.protein}g E</span>
                  <span>{ingredient.carbs}g K</span>
                  <span>{ingredient.fat}g V</span>
                </div>

                {/* Last Used */}
                <div style={{
                  fontSize: isMobile ? '0.75rem' : '0.8rem',
                  color: '#555',
                  fontStyle: 'italic'
                }}>
                  {getTimeSinceUsed(ingredient.lastUsed)}
                </div>

                {/* Add Button */}
                <button
                  onClick={() => handleAddIngredient(ingredient)}
                  disabled={inCart}
                  style={{
                    padding: isMobile ? '0.625rem' : '0.75rem',
                    background: inCart ? '#333' : '#10b981',
                    color: inCart ? '#666' : '#000',
                    border: 'none',
                    borderRadius: isMobile ? '10px' : '12px',
                    fontSize: isMobile ? '0.875rem' : '0.95rem',
                    fontWeight: '600',
                    cursor: inCart ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent',
                    minHeight: '44px',
                    opacity: inCart ? 0.5 : 1
                  }}
                  onTouchStart={(e) => {
                    if (isMobile && !inCart) {
                      e.currentTarget.style.transform = 'scale(0.98)'
                    }
                  }}
                  onTouchEnd={(e) => {
                    if (isMobile && !inCart) {
                      e.currentTarget.style.transform = 'scale(1)'
                    }
                  }}
                >
                  <Plus size={isMobile ? 16 : 18} />
                  {inCart ? 'In mandje' : 'Toevoegen'}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Scroll Hint */}
      {recentIngredients.length > 2 && (
        <div style={{
          textAlign: 'center',
          marginTop: '0.5rem',
          fontSize: isMobile ? '0.75rem' : '0.8rem',
          color: '#555'
        }}>
          ← Swipe voor meer ingrediënten →
        </div>
      )}
    </div>
  )
}
