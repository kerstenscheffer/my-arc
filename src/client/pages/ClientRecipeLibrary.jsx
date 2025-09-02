import useIsMobile from '../../hooks/useIsMobile'
// src/client/pages/ClientRecipeLibrary.jsx
// MY ARC CLIENT RECIPE LIBRARY - Complete recepten bibliotheek

import { useState, useEffect } from 'react'
import DatabaseService from '../../services/DatabaseService'
const db = DatabaseService
import { useLanguage } from '../../contexts/LanguageContext'

// Icon URLs
const iconUrls = {
  library: "https://kajabi-storefronts-production.kajabi-cdn.com/kajabi-storefronts-production/file-uploads/themes/2161970645/settings_images/73c0ff-a73-afe-2e0f-71f1c4cf73_6.png",
  search: "https://kajabi-storefronts-production.kajabi-cdn.com/kajabi-storefronts-production/file-uploads/themes/2161970645/settings_images/b83b4d-cd-c11c-bbc3-72d4e7af7c_11.png",
  favorite: "https://kajabi-storefronts-production.kajabi-cdn.com/kajabi-storefronts-production/file-uploads/themes/2161970645/settings_images/b3c326-4f5-e7ca-42ff-e70f80ceffe5_8.png"
}

const macroIcons = {
  kcal: "https://kajabi-storefronts-production.kajabi-cdn.com/kajabi-storefronts-production/file-uploads/themes/2161970645/settings_images/2eab52d-0a25-d6dd-bce2-53cd3818ad1c_5.png",
  protein: "https://kajabi-storefronts-production.kajabi-cdn.com/kajabi-storefronts-production/file-uploads/themes/2161970645/settings_images/c3de8d-cfd4-ace0-1162-03011e83a13_2.png",
  carbs: "https://kajabi-storefronts-production.kajabi-cdn.com/kajabi-storefronts-production/file-uploads/themes/2161970645/settings_images/f4e6b36-8f2-6eea-706e-83e768daddd2_3.png",
  fat: "https://kajabi-storefronts-production.kajabi-cdn.com/kajabi-storefronts-production/file-uploads/themes/2161970645/settings_images/ed8d5f8-1a5c-e7dd-f1b-b6ec3afd6ef1_4.png"
}

const mealTypeIcons = {
  breakfast: "https://kajabi-storefronts-production.kajabi-cdn.com/kajabi-storefronts-production/file-uploads/themes/2161970645/settings_images/3eb5c2a-b1e-75e3-a5b2-c8bda3e55502_7.png",
  lunch: "https://kajabi-storefronts-production.kajabi-cdn.com/kajabi-storefronts-production/file-uploads/themes/2161970645/settings_images/73c0ff-a73-afe-2e0f-71f1c4cf73_6.png",
  dinner: "https://kajabi-storefronts-production.kajabi-cdn.com/kajabi-storefronts-production/file-uploads/themes/2161970645/settings_images/db878-b47a-d2dc-d6a8-c383a825e2b_1.png",
  snack: "https://kajabi-storefronts-production.kajabi-cdn.com/kajabi-storefronts-production/file-uploads/themes/2161970645/settings_images/2eab52d-0a25-d6dd-bce2-53cd3818ad1c_5.png"
}

function getMealTypeIcon(type) {
  switch(type?.toLowerCase()) {
    case 'breakfast': 
    case 'ontbijt': return mealTypeIcons.breakfast
    case 'lunch': return mealTypeIcons.lunch
    case 'dinner':
    case 'diner': return mealTypeIcons.dinner
    case 'snack':
    case 'tussendoortje': return mealTypeIcons.snack
    default: return macroIcons.kcal
  }
}

// Macro Display Component
function MacroDisplay({ macros, size = 'normal' }) {
  if (size === 'compact') {
    return (
      <span style={{ fontSize: '0.75rem', color: '#10b981' }}>
        {macros.kcal}kcal • E{macros.protein}g • K{macros.carbs}g • V{macros.fat}g
      </span>
    )
  }
  
  return (
    <div style={{ 
      display: 'flex', 
      gap: '1rem', 
      fontSize: size === 'large' ? '1rem' : '0.875rem',
      flexWrap: 'wrap',
      alignItems: 'center'
    }}>
      <span style={{ color: '#10b981', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
        <img src={macroIcons.kcal} alt="" style={{ width: '16px', height: '16px' }} />
        {macros.kcal} kcal
      </span>
      <span style={{ color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
        <img src={macroIcons.protein} alt="" style={{ width: '16px', height: '16px' }} />
        {macros.protein}g
      </span>
      <span style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
        <img src={macroIcons.carbs} alt="" style={{ width: '16px', height: '16px' }} />
        {macros.carbs}g
      </span>
      <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
        <img src={macroIcons.fat} alt="" style={{ width: '16px', height: '16px' }} />
        {macros.fat}g
      </span>
    </div>
  )
}

export default function ClientRecipeLibrary({ client, onNavigate }) {
  const { t } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [meals, setMeals] = useState([])
  const [filteredMeals, setFilteredMeals] = useState([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [selectedMeal, setSelectedMeal] = useState(null)
  const [favorites, setFavorites] = useState([])
  
  const isMobile = useIsMobile()

  useEffect(() => {
    loadMeals()
    loadFavorites()
  }, [])

  useEffect(() => {
    filterMeals()
  }, [meals, search, category, favorites])

  const loadMeals = async () => {
    try {
      const { data, error } = await supabase
        .from('meals')
        .select('*')
        .order('name')
      
      if (error) throw error
      setMeals(data || [])
    } catch (error) {
      console.error('Error loading meals:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadFavorites = () => {
    const saved = localStorage.getItem(`favorites_${client?.id || 'default'}`)
    if (saved) {
      setFavorites(JSON.parse(saved))
    }
  }

  const toggleFavorite = (mealId) => {
    const newFavorites = favorites.includes(mealId)
      ? favorites.filter(id => id !== mealId)
      : [...favorites, mealId]
    
    setFavorites(newFavorites)
    localStorage.setItem(`favorites_${client?.id || 'default'}`, JSON.stringify(newFavorites))
  }

  const filterMeals = () => {
    let filtered = meals

    // Category filter
    if (category !== 'all') {
      if (category === 'favorites') {
        filtered = filtered.filter(meal => favorites.includes(meal.id))
      } else {
        filtered = filtered.filter(meal => meal.category === category)
      }
    }

    // Search filter
    if (search) {
      filtered = filtered.filter(meal => 
        meal.name.toLowerCase().includes(search.toLowerCase()) ||
        (meal.ingredients && meal.ingredients.toLowerCase().includes(search.toLowerCase()))
      )
    }

    setFilteredMeals(filtered)
  }

  if (loading) {
    return (
      <div style={{
        padding: '2rem',
        textAlign: 'center',
        background: 'linear-gradient(135deg, #064e3b 0%, #0a5c42 100%)',
        borderRadius: '12px',
        margin: '1rem'
      }}>
        <h3 style={{ color: '#fff', fontSize: '1.5rem' }}>
          Recepten laden...
        </h3>
      </div>
    )
  }

  return (
    <div style={{ padding: isMobile ? '0.5rem' : '1rem' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #064e3b 0%, #0a5c42 100%)',
        borderRadius: '12px',
        padding: '1.5rem',
        marginBottom: '1.5rem',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '1rem'
        }}>
          <img src={iconUrls.library} alt="" style={{ width: '40px', height: '40px' }} />
          <div>
            <h1 style={{ color: '#fff', fontSize: '1.8rem', marginBottom: '0.25rem' }}>
              Gerechten Bibliotheek
            </h1>
            <p style={{ color: '#d1fae5', fontSize: '0.9rem' }}>
              {meals.length} recepten beschikbaar
            </p>
          </div>
        </div>

        {/* Search and Filter */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          flexWrap: 'wrap'
        }}>
          <input
            type="text"
            placeholder="Zoek recepten..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: '1 1 200px',
              padding: '0.75rem',
              background: '#0b1510',
              border: '1px solid #10b98133',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '0.9rem'
            }}
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{
              padding: '0.75rem',
              background: '#0b1510',
              border: '1px solid #10b98133',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '0.9rem',
              cursor: 'pointer'
            }}
          >
            <option value="all">Alle Categorieën</option>
            <option value="favorites">⭐ Favorieten</option>
            <option value="breakfast">Ontbijt</option>
            <option value="lunch">Lunch</option>
            <option value="dinner">Diner</option>
            <option value="snack">Snacks</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '0.75rem',
        marginBottom: '1.5rem'
      }}>
        {[
          { label: 'Totaal', value: meals.length, color: '#10b981' },
          { label: 'Favorieten', value: favorites.length, color: '#f59e0b' },
          { label: 'Ontbijt', value: meals.filter(m => m.category === 'breakfast').length, color: '#3b82f6' },
          { label: 'Gezocht', value: filteredMeals.length, color: '#ef4444' }
        ].map((stat, i) => (
          <div key={i} style={{
            background: '#1a1a1a',
            borderRadius: '8px',
            padding: '1rem',
            textAlign: 'center',
            border: '1px solid #10b98133'
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: stat.color }}>
              {stat.value}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Meals Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '1rem'
      }}>
        {filteredMeals.map(meal => (
          <div
            key={meal.id}
            style={{
              background: '#1a1a1a',
              borderRadius: '12px',
              overflow: 'hidden',
              border: favorites.includes(meal.id) ? '2px solid #f59e0b' : '1px solid #10b98133',
              transition: 'all 0.3s',
              cursor: 'pointer'
            }}
            onClick={() => setSelectedMeal(meal)}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            {/* Meal Header */}
            <div style={{
              padding: '1rem',
              background: 'linear-gradient(135deg, #064e3b 0%, #0a5c42 100%)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <img src={getMealTypeIcon(meal.category)} alt="" style={{ width: '24px', height: '24px' }} />
                <h3 style={{ color: '#fff', fontSize: '1rem', margin: 0 }}>
                  {meal.name}
                </h3>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  toggleFavorite(meal.id)
                }}
                style={{
                  background: favorites.includes(meal.id) ? '#f59e0b' : 'transparent',
                  border: `2px solid ${favorites.includes(meal.id) ? '#f59e0b' : '#10b98133'}`,
                  borderRadius: '6px',
                  padding: '0.25rem 0.5rem',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                ⭐
              </button>
            </div>

            {/* Meal Content */}
            <div style={{ padding: '1rem' }}>
              <MacroDisplay macros={meal} size="compact" />
              
              {meal.default_portion && (
                <div style={{
                  marginTop: '0.5rem',
                  fontSize: '0.875rem',
                  color: '#9ca3af'
                }}>
                  Portie: {meal.default_portion}
                </div>
              )}
              
              {meal.ingredients && (
                <div style={{
                  marginTop: '0.75rem',
                  fontSize: '0.875rem',
                  color: '#fff',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {meal.ingredients}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredMeals.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          background: '#1a1a1a',
          borderRadius: '12px',
          border: '1px solid #10b98133'
        }}>
          <h3 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '0.5rem' }}>
            Geen recepten gevonden
          </h3>
          <p style={{ color: '#9ca3af' }}>
            Probeer een andere zoekterm of categorie
          </p>
        </div>
      )}

      {/* Detail Modal */}
      {selectedMeal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }} onClick={() => setSelectedMeal(null)}>
          <div style={{
            background: '#1a1a1a',
            borderRadius: '12px',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '85vh',
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{
              padding: '1.5rem',
              background: 'linear-gradient(135deg, #064e3b 0%, #0a5c42 100%)',
              borderBottom: '1px solid #10b98133',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ color: '#fff', margin: 0, fontSize: '1.3rem' }}>
                {selectedMeal.name}
              </h3>
              <button
                onClick={() => setSelectedMeal(null)}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#fff',
                  padding: '0.5rem 1rem',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>
            
            <div style={{ padding: '1.5rem', overflowY: 'auto', maxHeight: 'calc(85vh - 100px)' }}>
              {/* Macros */}
              <div style={{
                background: '#2a2a2a',
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '1.5rem'
              }}>
                <div style={{ color: '#10b981', fontWeight: 'bold', marginBottom: '0.75rem' }}>
                  Voedingswaarden
                </div>
                <MacroDisplay macros={selectedMeal} size="large" />
              </div>
              
              {/* Portie */}
              {selectedMeal.default_portion && (
                <div style={{
                  background: '#2a2a2a',
                  borderRadius: '8px',
                  padding: '1rem',
                  marginBottom: '1.5rem'
                }}>
                  <div style={{ color: '#10b981', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                    Standaard Portie
                  </div>
                  <div style={{ color: '#fff' }}>
                    {selectedMeal.default_portion}
                  </div>
                </div>
              )}
              
              {/* Ingrediënten */}
              {selectedMeal.ingredients && (
                <div style={{
                  background: '#2a2a2a',
                  borderRadius: '8px',
                  padding: '1rem',
                  marginBottom: '1.5rem'
                }}>
                  <div style={{ color: '#10b981', fontWeight: 'bold', marginBottom: '0.75rem' }}>
                    Ingrediënten
                  </div>
                  <div style={{ color: '#fff', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                    {selectedMeal.ingredients}
                  </div>
                </div>
              )}
              
              {/* Instructions */}
              {selectedMeal.instructions && (
                <div style={{
                  background: '#2a2a2a',
                  borderRadius: '8px',
                  padding: '1rem'
                }}>
                  <div style={{ color: '#10b981', fontWeight: 'bold', marginBottom: '0.75rem' }}>
                    Bereidingswijze
                  </div>
                  <div style={{ color: '#fff', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                    {selectedMeal.instructions}
                  </div>
                </div>
              )}
              
              {/* Actions */}
              <div style={{
                display: 'flex',
                gap: '1rem',
                marginTop: '1.5rem'
              }}>
                <button
                  onClick={() => {
                    toggleFavorite(selectedMeal.id)
                  }}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: favorites.includes(selectedMeal.id) ? '#f59e0b' : 'transparent',
                    border: `2px solid ${favorites.includes(selectedMeal.id) ? '#f59e0b' : '#10b981'}`,
                    borderRadius: '8px',
                    color: favorites.includes(selectedMeal.id) ? '#fff' : '#10b981',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: 'bold'
                  }}
                >
                  {favorites.includes(selectedMeal.id) ? 'Favoriet ⭐' : 'Toevoegen aan Favorieten'}
                </button>
                
                <button
                  onClick={() => {
                    setSelectedMeal(null)
                    if (onNavigate) onNavigate('mealplan')
                  }}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: '#10b981',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: 'bold'
                  }}
                >
                  Terug naar Meal Plan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
