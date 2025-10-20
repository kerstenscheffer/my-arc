// src/modules/meal-plan/components/AIMealInfoModal.jsx
import React, { useState, useEffect } from 'react'
import { 
  X, Info, ChefHat, Euro, Lightbulb,
  Clock, Flame, Target, Zap, Droplets,
  Package, AlertCircle, CheckCircle, Users,
  Gauge, Coins, Sparkles
} from 'lucide-react'

export default function AIMealInfoModal({ 
  isOpen, 
  onClose, 
  meal,
  db 
}) {
  const isMobile = window.innerWidth <= 768
  const [activeTab, setActiveTab] = useState('info')
  const [ingredients, setIngredients] = useState([])
  const [loading, setLoading] = useState(false)
  
  // Get meal image
  const getMealImage = () => {
    if (meal?.image_url) return meal.image_url
    
    // Fallback images based on meal type
    const mealType = meal?.meal_type || meal?.timing?.[0] || 'meal'
    const fallbacks = {
      breakfast: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800&h=400&fit=crop',
      lunch: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&h=400&fit=crop',
      dinner: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=400&fit=crop',
      snack: 'https://images.unsplash.com/photo-1490474504059-bf2db5ab2348?w=800&h=400&fit=crop',
      meal: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=400&fit=crop'
    }
    
    return fallbacks[mealType] || fallbacks.meal
  }
  
  // Load ingredients when modal opens
  useEffect(() => {
    if (isOpen && meal?.ingredients_list) {
      loadIngredients()
    }
  }, [isOpen, meal])
  
  const loadIngredients = async () => {
    setLoading(true)
    try {
      // Get ingredient IDs from meal
      const ingredientIds = meal.ingredients_list
        .filter(item => item.ingredient_id)
        .map(item => item.ingredient_id)
      
      if (ingredientIds.length > 0) {
        // Fetch ingredient details
        const { data } = await db.supabase
          .from('ai_ingredients')
          .select('*')
          .in('id', ingredientIds)
        
        // Map with amounts
        const mappedIngredients = meal.ingredients_list.map(item => {
          const ingredient = data?.find(ing => ing.id === item.ingredient_id)
          return {
            ...ingredient,
            amount: item.amount,
            unit: item.unit || 'gram'
          }
        }).filter(Boolean)
        
        setIngredients(mappedIngredients)
      }
    } catch (error) {
      console.error('Failed to load ingredients:', error)
    } finally {
      setLoading(false)
    }
  }
  
  // Calculate nutritional values for ingredients
  const calculateIngredientMacros = (ingredient) => {
    if (!ingredient) return { calories: 0, protein: 0, carbs: 0, fat: 0 }
    
    const factor = ingredient.amount / 100 // Convert to per 100g
    return {
      calories: Math.round((ingredient.calories_per_100g || 0) * factor),
      protein: Math.round((ingredient.protein_per_100g || 0) * factor * 10) / 10,
      carbs: Math.round((ingredient.carbs_per_100g || 0) * factor * 10) / 10,
      fat: Math.round((ingredient.fat_per_100g || 0) * factor * 10) / 10
    }
  }
  
  // Tabs configuration
  const tabs = [
    { id: 'info', label: 'Info', icon: Info },
    { id: 'recipe', label: 'Recept', icon: ChefHat },
    { id: 'price', label: 'Prijzen', icon: Euro },
    { id: 'tips', label: 'Tips', icon: Lightbulb }
  ]
  
  if (!isOpen || !meal) return null
  
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.9)',
      backdropFilter: 'blur(20px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: isMobile ? '1rem' : '2rem',
      animation: 'fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.98) 0%, rgba(15, 15, 15, 0.98) 100%)',
        backdropFilter: 'blur(30px)',
        borderRadius: isMobile ? '20px' : '28px',
        width: '100%',
        maxWidth: isMobile ? '100%' : '700px',
        maxHeight: '85vh',
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid rgba(16, 185, 129, 0.15)',
        boxShadow: '0 25px 80px rgba(0, 0, 0, 0.5), 0 0 60px rgba(16, 185, 129, 0.05)',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* Gradient overlay for depth */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '50%',
          background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.03) 0%, transparent 100%)',
          pointerEvents: 'none'
        }} />
        
        {/* Header with Image */}
        <div style={{
          borderBottom: '1px solid rgba(16, 185, 129, 0.08)',
          background: 'rgba(0, 0, 0, 0.4)',
          position: 'relative'
        }}>
          {/* Meal Image */}
          <div style={{
            width: '100%',
            height: isMobile ? '150px' : '180px',
            background: `linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.8) 100%), url(${getMealImage()}) center/cover`,
            position: 'relative'
          }}>
            {/* Close button - absolute positioned */}
            <button
              onClick={onClose}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 68, 68, 0.3)'
                e.currentTarget.style.borderColor = 'rgba(255, 68, 68, 0.5)'
                e.currentTarget.style.transform = 'scale(1.05)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.5)'
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              <X size={20} color="white" />
            </button>
            
            {/* Meal name overlay */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: isMobile ? '1rem' : '1.25rem',
              background: 'linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.9) 100%)'
            }}>
              <h2 style={{
                fontSize: isMobile ? '1.25rem' : '1.5rem',
                fontWeight: '700',
                color: 'white',
                margin: 0,
                textShadow: '0 2px 10px rgba(0, 0, 0, 0.5)'
              }}>
                {meal.name || meal.meal_name}
              </h2>
            </div>
          </div>
          
          {/* Content below image */}
          <div style={{
            padding: isMobile ? '1rem' : '1.25rem',
            paddingTop: isMobile ? '1.25rem' : '1.5rem'
          }}>
            {/* Macro Summary - No boxes, just values */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem'
            }}>
              {/* Calories - Hero */}
              <div style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: '0.25rem'
              }}>
                <Flame 
                  size={isMobile ? 18 : 20} 
                  color="#f59e0b" 
                  style={{ opacity: 0.9 }} 
                />
                <span style={{
                  fontSize: isMobile ? '1.75rem' : '2rem',
                  fontWeight: '800',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #dc2626 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  lineHeight: 1,
                  letterSpacing: '-0.02em'
                }}>
                  {Math.round(meal.calories)}
                </span>
                <span style={{
                  fontSize: isMobile ? '0.65rem' : '0.7rem',
                  color: 'rgba(245, 158, 11, 0.5)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontWeight: '600',
                  alignSelf: 'center'
                }}>
                  kcal
                </span>
              </div>

              {/* Other Macros */}
              <div style={{
                display: 'flex',
                gap: isMobile ? '1.25rem' : '1.5rem',
                alignItems: 'center'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  <Target size={isMobile ? 16 : 18} color="#8b5cf6" style={{ opacity: 0.7 }} />
                  <div>
                    <span style={{
                      fontSize: isMobile ? '1.125rem' : '1.25rem',
                      fontWeight: '700',
                      color: '#8b5cf6'
                    }}>
                      {Math.round(meal.protein)}g
                    </span>
                    <div style={{
                      fontSize: '0.6rem',
                      color: 'rgba(139, 92, 246, 0.5)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      fontWeight: '600',
                      marginTop: '-0.125rem'
                    }}>
                      Eiwit
                    </div>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  <Zap size={isMobile ? 16 : 18} color="#ef4444" style={{ opacity: 0.7 }} />
                  <div>
                    <span style={{
                      fontSize: isMobile ? '1.125rem' : '1.25rem',
                      fontWeight: '700',
                      color: '#ef4444'
                    }}>
                      {Math.round(meal.carbs)}g
                    </span>
                    <div style={{
                      fontSize: '0.6rem',
                      color: 'rgba(239, 68, 68, 0.5)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      fontWeight: '600',
                      marginTop: '-0.125rem'
                    }}>
                      Carbs
                    </div>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  <Droplets size={isMobile ? 16 : 18} color="#3b82f6" style={{ opacity: 0.7 }} />
                  <div>
                    <span style={{
                      fontSize: isMobile ? '1.125rem' : '1.25rem',
                      fontWeight: '700',
                      color: '#3b82f6'
                    }}>
                      {Math.round(meal.fat)}g
                    </span>
                    <div style={{
                      fontSize: '0.6rem',
                      color: 'rgba(59, 130, 246, 0.5)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      fontWeight: '600',
                      marginTop: '-0.125rem'
                    }}>
                      Vet
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Tabs - Premium Style */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${tabs.length}, 1fr)`,
              gap: '0.5rem'
            }}>
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: isMobile ? '0.625rem' : '0.75rem',
                    background: activeTab === tab.id
                      ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.08) 100%)'
                      : 'rgba(255, 255, 255, 0.03)',
                    border: `1px solid ${activeTab === tab.id ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 255, 255, 0.08)'}`,
                    borderRadius: '10px',
                    color: activeTab === tab.id ? '#10b981' : 'rgba(255, 255, 255, 0.6)',
                    fontSize: isMobile ? '0.85rem' : '0.95rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.375rem',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent',
                    boxShadow: activeTab === tab.id 
                      ? '0 4px 15px rgba(16, 185, 129, 0.15), inset 0 1px 0 rgba(16, 185, 129, 0.1)' 
                      : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== tab.id) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'
                      e.currentTarget.style.transform = 'translateY(-1px)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== tab.id) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
                      e.currentTarget.style.transform = 'translateY(0)'
                    }
                  }}
                >
                  <tab.icon size={16} />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: isMobile ? '1.25rem' : '1.5rem',
          position: 'relative'
        }}>
          {/* Info Tab */}
          {activeTab === 'info' && (
            <InfoTab 
              meal={meal} 
              ingredients={ingredients} 
              loading={loading}
              calculateIngredientMacros={calculateIngredientMacros}
              isMobile={isMobile}
            />
          )}
          
          {/* Recipe Tab */}
          {activeTab === 'recipe' && (
            <RecipeTab 
              meal={meal}
              isMobile={isMobile}
            />
          )}
          
          {/* Price Tab */}
          {activeTab === 'price' && (
            <PriceTab 
              meal={meal}
              ingredients={ingredients}
              isMobile={isMobile}
            />
          )}
          
          {/* Tips Tab */}
          {activeTab === 'tips' && (
            <TipsTab 
              meal={meal}
              isMobile={isMobile}
            />
          )}
        </div>
      </div>
      
      {/* Animations */}
      <style>{`
        @keyframes fadeIn {
          from { 
            opacity: 0;
            transform: scale(0.95);
          }
          to { 
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  )
}

// Info Tab Component - Premium Style
function InfoTab({ meal, ingredients, loading, calculateIngredientMacros, isMobile }) {
  return (
    <div>
      {/* Meal Details */}
      <div style={{
        background: 'rgba(17, 17, 17, 0.5)',
        backdropFilter: 'blur(10px)',
        borderRadius: '14px',
        padding: isMobile ? '1rem' : '1.25rem',
        marginBottom: '1.25rem',
        border: '1px solid rgba(16, 185, 129, 0.08)',
        boxShadow: '0 4px 16px rgba(16, 185, 129, 0.05)'
      }}>
        <h3 style={{
          fontSize: isMobile ? '1rem' : '1.125rem',
          fontWeight: '600',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: '0.875rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Info size={18} color="#10b981" />
          Maaltijd Details
        </h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
          gap: '0.875rem'
        }}>
          <DetailItem label="Bereidingstijd" value={`${meal.prep_time_min || 10} min`} icon={Clock} />
          <DetailItem label="Kooktijd" value={`${meal.cook_time_min || 15} min`} icon={Clock} />
          <DetailItem label="Moeilijkheid" value={meal.difficulty || 'Medium'} icon={Gauge} />
          <DetailItem label="Kosten niveau" value={meal.cost_tier || 'Moderate'} icon={Coins} />
        </div>
        
        {meal.serving_size && (
          <div style={{
            marginTop: '0.875rem',
            padding: '0.625rem',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
            borderRadius: '10px',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Users size={16} color="#10b981" />
            <span style={{
              fontSize: '0.875rem',
              color: '#10b981',
              fontWeight: '500'
            }}>
              Portie grootte: {meal.serving_size} persoon
            </span>
          </div>
        )}
      </div>
      
      {/* Ingredients */}
      <div style={{
        background: 'rgba(17, 17, 17, 0.5)',
        backdropFilter: 'blur(10px)',
        borderRadius: '14px',
        padding: isMobile ? '1rem' : '1.25rem',
        border: '1px solid rgba(16, 185, 129, 0.08)',
        boxShadow: '0 4px 16px rgba(16, 185, 129, 0.05)'
      }}>
        <h3 style={{
          fontSize: isMobile ? '1rem' : '1.125rem',
          fontWeight: '600',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: '0.875rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Package size={18} color="#10b981" />
          Ingrediënten
        </h3>
        
        {loading ? (
          <div style={{
            color: 'rgba(255, 255, 255, 0.5)',
            textAlign: 'center',
            padding: '2rem'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '3px solid rgba(16, 185, 129, 0.2)',
              borderTopColor: '#10b981',
              borderRadius: '50%',
              margin: '0 auto',
              animation: 'spin 1s linear infinite'
            }} />
          </div>
        ) : ingredients.length > 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}>
            {ingredients.map((ingredient, idx) => {
              const macros = calculateIngredientMacros(ingredient)
              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: '10px',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(16, 185, 129, 0.03)'
                    e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.1)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: isMobile ? '0.9rem' : '0.95rem',
                      fontWeight: '500',
                      color: 'white',
                      marginBottom: '0.25rem'
                    }}>
                      {ingredient.name || 'Ingredient'}
                    </div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: 'rgba(255, 255, 255, 0.4)',
                      display: 'flex',
                      gap: '0.75rem'
                    }}>
                      <span style={{ color: '#f59e0b' }}>{macros.calories} kcal</span>
                      <span style={{ color: '#8b5cf6' }}>{macros.protein}g eiwit</span>
                    </div>
                  </div>
                  <div style={{
                    padding: '0.375rem 0.75rem',
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.08) 100%)',
                    borderRadius: '8px',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#10b981'
                  }}>
                    {ingredient.amount} {ingredient.unit}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div style={{
            color: 'rgba(255, 255, 255, 0.5)',
            textAlign: 'center',
            padding: '2rem'
          }}>
            Geen ingrediënten beschikbaar
          </div>
        )}
        
        {/* Allergens */}
        {meal.allergens && meal.allergens.length > 0 && (
          <div style={{
            marginTop: '1rem',
            padding: '0.875rem',
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%)',
            borderRadius: '10px',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.625rem'
          }}>
            <AlertCircle size={18} color="#ef4444" style={{ flexShrink: 0, marginTop: '0.125rem' }} />
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: '0.8rem',
                color: '#ef4444',
                fontWeight: '600',
                marginBottom: '0.375rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Allergenen
              </div>
              <div style={{
                fontSize: '0.9rem',
                color: 'rgba(255, 255, 255, 0.8)',
                lineHeight: 1.4
              }}>
                {meal.allergens.join(', ')}
              </div>
            </div>
          </div>
        )}
        
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  )
}

// Recipe Tab Component - Premium Style
function RecipeTab({ meal, isMobile }) {
  return (
    <div>
      <div style={{
        background: 'rgba(17, 17, 17, 0.5)',
        backdropFilter: 'blur(10px)',
        borderRadius: '14px',
        padding: isMobile ? '1rem' : '1.25rem',
        border: '1px solid rgba(16, 185, 129, 0.08)',
        boxShadow: '0 4px 16px rgba(16, 185, 129, 0.05)'
      }}>
        <h3 style={{
          fontSize: isMobile ? '1rem' : '1.125rem',
          fontWeight: '600',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <ChefHat size={18} color="#10b981" />
          Bereidingswijze
        </h3>
        
        {meal.preparation_steps && meal.preparation_steps.length > 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.875rem'
          }}>
            {meal.preparation_steps.map((step, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  gap: '0.875rem',
                  padding: '0.875rem',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(16, 185, 129, 0.03)'
                  e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)'
                }}
              >
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  fontSize: '0.875rem',
                  fontWeight: '700',
                  color: '#10b981'
                }}>
                  {idx + 1}
                </div>
                <p style={{
                  fontSize: isMobile ? '0.9rem' : '0.95rem',
                  color: 'rgba(255, 255, 255, 0.85)',
                  lineHeight: 1.6,
                  margin: 0,
                  paddingTop: '0.25rem'
                }}>
                  {step}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}>
            <ChefHat size={48} color="rgba(255, 255, 255, 0.1)" style={{ marginBottom: '1rem' }} />
            <p style={{
              fontSize: isMobile ? '0.9rem' : '0.95rem',
              color: 'rgba(255, 255, 255, 0.4)'
            }}>
              Geen recept beschikbaar voor deze maaltijd
            </p>
          </div>
        )}
        
        {/* Cooking Tips */}
        {meal.cooking_tips && (
          <div style={{
            marginTop: '1.25rem',
            padding: '0.875rem',
            background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(251, 191, 36, 0.05) 100%)',
            borderRadius: '10px',
            border: '1px solid rgba(251, 191, 36, 0.2)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.5rem'
            }}>
              <Sparkles size={16} color="#fbbf24" />
              <span style={{
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#fbbf24',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Pro Tip
              </span>
            </div>
            <p style={{
              fontSize: '0.9rem',
              color: 'rgba(255, 255, 255, 0.8)',
              margin: 0,
              lineHeight: 1.5
            }}>
              {meal.cooking_tips}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// Price Tab Component - Premium Style
function PriceTab({ meal, ingredients, isMobile }) {
  const totalCost = meal.total_cost || 0
  const costPerIngredient = ingredients.map(ing => ({
    name: ing.name,
    cost: ing.price_per_unit ? (ing.amount / 1000) * ing.price_per_unit : 0
  }))
  
  return (
    <div>
      <div style={{
        background: 'rgba(17, 17, 17, 0.5)',
        backdropFilter: 'blur(10px)',
        borderRadius: '14px',
        padding: isMobile ? '1rem' : '1.25rem',
        border: '1px solid rgba(16, 185, 129, 0.08)',
        boxShadow: '0 4px 16px rgba(16, 185, 129, 0.05)'
      }}>
        <h3 style={{
          fontSize: isMobile ? '1rem' : '1.125rem',
          fontWeight: '600',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Euro size={18} color="#10b981" />
          Kosten Overzicht
        </h3>
        
        {/* Total Cost - Hero */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.08) 100%)',
          borderRadius: '12px',
          padding: '1.25rem',
          marginBottom: '1.25rem',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          textAlign: 'center',
          boxShadow: '0 8px 24px rgba(16, 185, 129, 0.15), inset 0 1px 0 rgba(16, 185, 129, 0.05)'
        }}>
          <div style={{
            fontSize: '0.8rem',
            color: 'rgba(255, 255, 255, 0.5)',
            marginBottom: '0.375rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontWeight: '600'
          }}>
            Totale kosten
          </div>
          <div style={{
            fontSize: isMobile ? '2rem' : '2.25rem',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            letterSpacing: '-0.02em'
          }}>
            €{totalCost.toFixed(2)}
          </div>
        </div>
        
        {/* Cost per ingredient */}
        {costPerIngredient.length > 0 && (
          <>
            <h4 style={{
              fontSize: '0.95rem',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.7)',
              marginBottom: '0.625rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Package size={16} style={{ opacity: 0.5 }} />
              Kosten per ingrediënt
            </h4>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.375rem'
            }}>
              {costPerIngredient.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.625rem 0.75rem',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(16, 185, 129, 0.03)'
                    e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.1)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)'
                  }}
                >
                  <span style={{
                    fontSize: '0.875rem',
                    color: 'rgba(255, 255, 255, 0.7)'
                  }}>
                    {item.name}
                  </span>
                  <span style={{
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: item.cost > 2 ? '#ef4444' : item.cost > 1 ? '#fbbf24' : '#10b981'
                  }}>
                    €{item.cost.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
        
        {/* Cost tier badge */}
        <div style={{
          marginTop: '1rem',
          padding: '0.75rem',
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: '10px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span style={{
            fontSize: '0.875rem',
            color: 'rgba(255, 255, 255, 0.5)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem'
          }}>
            <Coins size={16} style={{ opacity: 0.5 }} />
            Prijscategorie
          </span>
          <span style={{
            padding: '0.375rem 0.75rem',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.08) 100%)',
            borderRadius: '8px',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            fontSize: '0.875rem',
            fontWeight: '600',
            color: '#10b981'
          }}>
            {meal.cost_tier === 'budget' ? '€' : meal.cost_tier === 'moderate' ? '€€' : '€€€'}
            {' '}{meal.cost_tier || 'Moderate'}
          </span>
        </div>
      </div>
    </div>
  )
}

// Tips Tab Component - Premium Style
function TipsTab({ meal, isMobile }) {
  const tips = meal.tips ? [meal.tips] : []
  
  // Add default tips
  const defaultTips = [
    { text: 'Bereid ingrediënten van tevoren voor om tijd te besparen', icon: Clock },
    { text: 'Bewaar restjes in een luchtdichte container tot 3 dagen', icon: Package },
    { text: 'Voeg verse kruiden toe voor extra smaak', icon: Sparkles }
  ]
  
  const allTips = [...tips.map(t => ({ text: t, icon: CheckCircle })), ...defaultTips]
  
  return (
    <div>
      <div style={{
        background: 'rgba(17, 17, 17, 0.5)',
        backdropFilter: 'blur(10px)',
        borderRadius: '14px',
        padding: isMobile ? '1rem' : '1.25rem',
        border: '1px solid rgba(16, 185, 129, 0.08)',
        boxShadow: '0 4px 16px rgba(16, 185, 129, 0.05)'
      }}>
        <h3 style={{
          fontSize: isMobile ? '1rem' : '1.125rem',
          fontWeight: '600',
          background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Lightbulb size={18} color="#fbbf24" />
          Tips & Advies
        </h3>
        
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>
          {allTips.map((tip, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                gap: '0.875rem',
                padding: '0.875rem',
                background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.06) 0%, rgba(251, 191, 36, 0.02) 100%)',
                borderRadius: '10px',
                border: '1px solid rgba(251, 191, 36, 0.12)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(251, 191, 36, 0.08) 0%, rgba(251, 191, 36, 0.04) 100%)'
                e.currentTarget.style.borderColor = 'rgba(251, 191, 36, 0.2)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(251, 191, 36, 0.06) 0%, rgba(251, 191, 36, 0.02) 100%)'
                e.currentTarget.style.borderColor = 'rgba(251, 191, 36, 0.12)'
              }}
            >
              <tip.icon 
                size={20} 
                color="#fbbf24"
                style={{ flexShrink: 0, marginTop: '0.125rem' }}
              />
              <p style={{
                fontSize: isMobile ? '0.9rem' : '0.95rem',
                color: 'rgba(255, 255, 255, 0.85)',
                lineHeight: 1.5,
                margin: 0
              }}>
                {tip.text}
              </p>
            </div>
          ))}
        </div>
        
        {/* Labels as tips */}
        {meal.labels && meal.labels.length > 0 && (
          <div style={{
            marginTop: '1.25rem',
            padding: '0.875rem',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(16, 185, 129, 0.04) 100%)',
            borderRadius: '10px',
            border: '1px solid rgba(16, 185, 129, 0.15)'
          }}>
            <div style={{
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#10b981',
              marginBottom: '0.625rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem'
            }}>
              <Sparkles size={16} />
              Eigenschappen
            </div>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.5rem'
            }}>
              {meal.labels.map((label, idx) => (
                <span
                  key={idx}
                  style={{
                    padding: '0.375rem 0.75rem',
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.08) 100%)',
                    borderRadius: '8px',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: '#10b981',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.2)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Helper Component - DetailItem
function DetailItem({ label, value, icon: Icon }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '0.5rem 0.625rem',
      background: 'rgba(255, 255, 255, 0.02)',
      borderRadius: '8px',
      border: '1px solid rgba(255, 255, 255, 0.05)'
    }}>
      <span style={{
        fontSize: '0.875rem',
        color: 'rgba(255, 255, 255, 0.5)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.375rem'
      }}>
        {Icon && <Icon size={14} style={{ opacity: 0.5 }} />}
        {label}
      </span>
      <span style={{
        fontSize: '0.875rem',
        fontWeight: '600',
        color: 'rgba(255, 255, 255, 0.9)'
      }}>
        {value}
      </span>
    </div>
  )
}
