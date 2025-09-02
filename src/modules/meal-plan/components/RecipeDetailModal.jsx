import useIsMobile from '../../../hooks/useIsMobile'
import React, { useState, useEffect } from 'react'
import { X, Clock, ChefHat, Users, Flame, Info, Plus, Minus, Check } from 'lucide-react'

export default function RecipeDetailModal({ meal, isOpen, onClose, onSave }) {
  const isMobile = useIsMobile()
  const [servings, setServings] = useState(1)
  const [activeTab, setActiveTab] = useState('overview')
  const [checkedSteps, setCheckedSteps] = useState({})
  
  if (!isOpen || !meal) return null

  // Mock recipe data - later from database
  const recipeData = {
    prepTime: meal.prep_time || 15,
    cookTime: meal.cook_time || 25,
    difficulty: meal.difficulty || 'Medium',
    servings: meal.servings || 2,
    ingredients: meal.ingredients || [
      { name: 'Kipfilet', amount: 200, unit: 'gram', calories: 330, protein: 62 },
      { name: 'Rijst', amount: 75, unit: 'gram', calories: 270, carbs: 60 },
      { name: 'Broccoli', amount: 150, unit: 'gram', calories: 51, carbs: 10 },
      { name: 'Olijfolie', amount: 10, unit: 'ml', calories: 88, fat: 10 },
      { name: 'Knoflook', amount: 2, unit: 'tenen', calories: 9 },
      { name: 'Sojasaus', amount: 15, unit: 'ml', calories: 8 }
    ],
    steps: meal.recipe_steps || [
      'Kook de rijst volgens de aanwijzingen op de verpakking',
      'Snijd de kipfilet in blokjes en kruid met peper en zout',
      'Verhit olijfolie in een pan op middelhoog vuur',
      'Bak de kip in 6-8 minuten goudbruin en gaar',
      'Stoom de broccoli 5 minuten tot beetgaar',
      'Pers de knoflook en voeg toe aan de kip',
      'Voeg sojasaus toe en roerbak nog 2 minuten',
      'Serveer de kip met rijst en broccoli'
    ],
    tips: meal.tips || [
      'Gebruik basmati rijst voor de beste smaak',
      'Marineer de kip 30 min van tevoren voor extra smaak',
      'Voeg chili toe voor een pittige variant'
    ]
  }

  const adjustedMacros = {
    kcal: Math.round(meal.kcal * servings),
    protein: Math.round(meal.protein * servings),
    carbs: Math.round(meal.carbs * servings),
    fat: Math.round(meal.fat * servings)
  }

  const toggleStep = (index) => {
    setCheckedSteps(prev => ({
      ...prev,
      [index]: !prev[index]
    }))
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(10px)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: isMobile ? '1rem' : '2rem',
      overflowY: 'auto'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%)',
        borderRadius: isMobile ? '20px' : '24px',
        width: '100%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflowY: 'auto',
        border: '1px solid #047857',
        boxShadow: '0 20px 60px rgba(4, 120, 87, 0.3)'
      }}>
        {/* Header */}
        <div style={{
          padding: isMobile ? '1.25rem' : '1.5rem',
          borderBottom: '1px solid rgba(4, 120, 87, 0.3)',
          background: 'linear-gradient(135deg, #047857 0%, #065f46 100%)',
          borderRadius: '24px 24px 0 0'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start'
          }}>
            <div style={{ flex: 1 }}>
              <h2 style={{
                margin: 0,
                fontSize: isMobile ? '1.4rem' : '1.75rem',
                fontWeight: '700',
                color: 'white',
                marginBottom: '0.5rem'
              }}>
                {meal.name}
              </h2>
              <div style={{
                display: 'flex',
                gap: '1rem',
                flexWrap: 'wrap',
                marginTop: '0.75rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Clock size={16} />
                  <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.9)' }}>
                    {recipeData.prepTime + recipeData.cookTime} min
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <ChefHat size={16} />
                  <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.9)' }}>
                    {recipeData.difficulty}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Users size={16} />
                  <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.9)' }}>
                    {recipeData.servings} porties
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                borderRadius: '12px',
                padding: '0.5rem',
                cursor: 'pointer',
                color: 'white'
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          padding: '1rem 1rem 0',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          {['overview', 'ingredients', 'recipe', 'tips'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '0.75rem 1rem',
                background: activeTab === tab 
                  ? 'linear-gradient(135deg, #047857 0%, #065f46 100%)'
                  : 'transparent',
                border: 'none',
                borderRadius: '12px 12px 0 0',
                color: activeTab === tab ? 'white' : '#888',
                cursor: 'pointer',
                fontSize: isMobile ? '0.9rem' : '1rem',
                fontWeight: activeTab === tab ? '600' : '400',
                textTransform: 'capitalize',
                transition: 'all 0.3s ease'
              }}
            >
              {tab === 'overview' ? 'Overzicht' :
               tab === 'ingredients' ? 'Ingrediënten' :
               tab === 'recipe' ? 'Recept' : 'Tips'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ padding: isMobile ? '1.25rem' : '1.5rem' }}>
          {activeTab === 'overview' && (
            <div>
              {/* Portion Adjuster */}
              <div style={{
                background: 'rgba(4, 120, 87, 0.1)',
                borderRadius: '16px',
                padding: '1rem',
                marginBottom: '1.5rem',
                border: '1px solid rgba(4, 120, 87, 0.3)'
              }}>
                <div style={{ 
                  fontSize: '0.9rem',
                  color: '#888',
                  marginBottom: '0.75rem',
                  fontWeight: '600'
                }}>
                  AANTAL PORTIES
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '1.5rem'
                }}>
                  <button
                    onClick={() => setServings(Math.max(0.5, servings - 0.5))}
                    style={{
                      background: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '10px',
                      width: '36px',
                      height: '36px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      color: 'white'
                    }}
                  >
                    <Minus size={18} />
                  </button>
                  <div style={{
                    fontSize: '2rem',
                    fontWeight: '700',
                    color: '#10b981',
                    minWidth: '60px',
                    textAlign: 'center'
                  }}>
                    {servings}
                  </div>
                  <button
                    onClick={() => setServings(Math.min(4, servings + 0.5))}
                    style={{
                      background: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '10px',
                      width: '36px',
                      height: '36px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      color: 'white'
                    }}
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>

              {/* Adjusted Macros */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '0.75rem',
                marginBottom: '1.5rem'
              }}>
                {Object.entries(adjustedMacros).map(([key, value]) => (
                  <div key={key} style={{
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '12px',
                    padding: '1rem',
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}>
                    <div style={{
                      fontSize: '0.8rem',
                      color: '#888',
                      marginBottom: '0.25rem',
                      textTransform: 'uppercase'
                    }}>
                      {key === 'kcal' ? 'Calorieën' :
                       key === 'protein' ? 'Eiwitten' :
                       key === 'carbs' ? 'Koolhydraten' : 'Vetten'}
                    </div>
                    <div style={{
                      fontSize: '1.5rem',
                      fontWeight: '700',
                      color: key === 'kcal' ? '#fbbf24' :
                             key === 'protein' ? '#60a5fa' :
                             key === 'carbs' ? '#f87171' : '#c084fc'
                    }}>
                      {value}{key !== 'kcal' && 'g'}
                    </div>
                  </div>
                ))}
              </div>

              {/* Image placeholder */}
              <div style={{
                background: 'rgba(4, 120, 87, 0.1)',
                borderRadius: '16px',
                height: '200px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(4, 120, 87, 0.3)'
              }}>
                {meal.image_url ? (
                  <img 
                    src={meal.image_url} 
                    alt={meal.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      borderRadius: '16px'
                    }}
                  />
                ) : (
                  <div style={{ textAlign: 'center', color: '#666' }}>
                    <Flame size={48} style={{ marginBottom: '0.5rem' }} />
                    <div>Geen afbeelding beschikbaar</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'ingredients' && (
            <div>
              {recipeData.ingredients.map((ingredient, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem',
                  background: idx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
                  borderRadius: '8px',
                  marginBottom: '0.25rem'
                }}>
                  <div>
                    <div style={{ 
                      fontWeight: '600',
                      color: 'white',
                      marginBottom: '0.25rem'
                    }}>
                      {ingredient.name}
                    </div>
                    <div style={{ 
                      fontSize: '0.9rem',
                      color: '#10b981'
                    }}>
                      {Math.round(ingredient.amount * servings)} {ingredient.unit}
                    </div>
                  </div>
                  <div style={{ 
                    fontSize: '0.85rem',
                    color: '#888',
                    textAlign: 'right'
                  }}>
                    {ingredient.calories && (
                      <div>{Math.round(ingredient.calories * servings)} kcal</div>
                    )}
                    {ingredient.protein && (
                      <div style={{ color: '#60a5fa' }}>{Math.round(ingredient.protein * servings)}g eiwit</div>
                    )}
                    {ingredient.carbs && (
                      <div style={{ color: '#f87171' }}>{Math.round(ingredient.carbs * servings)}g carbs</div>
                    )}
                    {ingredient.fat && (
                      <div style={{ color: '#c084fc' }}>{Math.round(ingredient.fat * servings)}g vet</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'recipe' && (
            <div>
              {recipeData.steps.map((step, idx) => (
                <div 
                  key={idx}
                  onClick={() => toggleStep(idx)}
                  style={{
                    display: 'flex',
                    gap: '1rem',
                    marginBottom: '1rem',
                    padding: '1rem',
                    background: checkedSteps[idx] 
                      ? 'rgba(4, 120, 87, 0.1)' 
                      : 'rgba(255,255,255,0.02)',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    border: `1px solid ${checkedSteps[idx] ? 'rgba(4, 120, 87, 0.3)' : 'rgba(255,255,255,0.05)'}`,
                    transition: 'all 0.3s ease'
                  }}
                >
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: checkedSteps[idx] 
                      ? 'linear-gradient(135deg, #047857, #065f46)'
                      : 'rgba(255,255,255,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '2px'
                  }}>
                    {checkedSteps[idx] ? (
                      <Check size={16} color="white" />
                    ) : (
                      <span style={{ 
                        fontSize: '0.85rem',
                        color: 'white',
                        fontWeight: '600'
                      }}>
                        {idx + 1}
                      </span>
                    )}
                  </div>
                  <div style={{
                    flex: 1,
                    color: checkedSteps[idx] ? '#888' : 'white',
                    textDecoration: checkedSteps[idx] ? 'line-through' : 'none',
                    lineHeight: 1.6
                  }}>
                    {step}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'tips' && (
            <div>
              {recipeData.tips.map((tip, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  gap: '0.75rem',
                  marginBottom: '1rem',
                  padding: '1rem',
                  background: 'rgba(4, 120, 87, 0.05)',
                  borderRadius: '12px',
                  border: '1px solid rgba(4, 120, 87, 0.2)'
                }}>
                  <Info size={20} style={{ color: '#10b981', flexShrink: 0, marginTop: '2px' }} />
                  <div style={{ color: 'white', lineHeight: 1.6 }}>
                    {tip}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div style={{
          padding: '1rem 1.5rem 1.5rem',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          gap: '0.75rem'
        }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '0.875rem',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '12px',
              color: 'white',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Sluiten
          </button>
          {onSave && (
            <button
              onClick={() => onSave(adjustedMacros)}
              style={{
                flex: 1,
                padding: '0.875rem',
                background: 'linear-gradient(135deg, #047857, #065f46)',
                border: 'none',
                borderRadius: '12px',
                color: 'white',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Toepassen
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
