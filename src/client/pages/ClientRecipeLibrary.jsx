// src/client/pages/ClientRecipeLibrary.jsx
import React, { useState, useEffect } from 'react'
import { 
  Search, Filter, Heart, Clock, Flame, Target, 
  ChefHat, Euro, X, ChevronDown, Sparkles,
  BookOpen, Award, Coffee, Sun, Moon, Cookie,
  Beef, Salad, Timer, DollarSign, Check
} from 'lucide-react'
import AIMealInfoModal from '../../modules/meal-plan/components/AIMealInfoModal'

export default function ClientRecipeLibrary({ client, db, onNavigate }) {
  const isMobile = window.innerWidth <= 768
  const [recipes, setRecipes] = useState([])
  const [filteredRecipes, setFilteredRecipes] = useState([])
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFilters, setSelectedFilters] = useState([])
  const [selectedRecipe, setSelectedRecipe] = useState(null)
  const [showInfoModal, setShowInfoModal] = useState(false)
  const [openDropdown, setOpenDropdown] = useState(null)
  const [activeTab, setActiveTab] = useState('all')

  // Filter Dropdowns Configuration
  const filterDropdowns = {
    timing: {
      label: 'Maaltijd Type',
      icon: Clock,
      color: '#10b981',
      filters: [
        { id: 'breakfast', label: 'Ontbijt', color: '#f59e0b' },
        { id: 'lunch', label: 'Lunch', color: '#3b82f6' },
        { id: 'dinner', label: 'Diner', color: '#8b5cf6' },
        { id: 'snack', label: 'Snack', color: '#ec4899' }
      ]
    },
    goals: {
      label: 'Voedingsdoel',
      icon: Target,
      color: '#8b5cf6',
      filters: [
        { id: 'high_protein', label: '30g+ Eiwit', color: '#8b5cf6' },
        { id: 'low_cal', label: '<400 kcal', color: '#ef4444' },
        { id: 'high_cal', label: '600+ kcal', color: '#10b981' },
        { id: 'balanced', label: 'Gebalanceerd', color: '#06b6d4' }
      ]
    },
    practical: {
      label: 'Praktisch',
      icon: Timer,
      color: '#fbbf24',
      filters: [
        { id: 'quick', label: 'Snel (<20 min)', color: '#fbbf24' },
        { id: 'meal_prep', label: 'Meal Prep', color: '#10b981' },
        { id: 'easy', label: 'Makkelijk', color: '#22c55e' },
        { id: 'budget', label: 'Budget', color: '#84cc16' }
      ]
    },
    dietary: {
      label: 'Dieet',
      icon: Salad,
      color: '#22c55e',
      filters: [
        { id: 'vegetarian', label: 'Vegetarisch', color: '#22c55e' },
        { id: 'vegan', label: 'Vegan', color: '#16a34a' },
        { id: 'clean', label: 'Clean', color: '#06b6d4' }
      ]
    }
  }

  // Tabs Configuration
  const tabs = [
    { id: 'all', label: 'Alle', icon: BookOpen, count: 0 },
    { id: 'favorites', label: 'Favorieten', icon: Heart, count: 0 },
    { id: 'recent', label: 'Recent', icon: Clock, count: 0 }
  ]

  // Load data on mount
  useEffect(() => {
    loadRecipes()
    loadFavorites()
  }, [])

  // Filter recipes when search or filters change
  useEffect(() => {
    filterRecipes()
  }, [searchTerm, selectedFilters, recipes, activeTab, favorites])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.dropdown-container')) {
        setOpenDropdown(null)
      }
    }
    
    if (openDropdown) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [openDropdown])

  const loadRecipes = async () => {
    try {
      setLoading(true)
      const { data, error } = await db.supabase
        .from('ai_meals')
        .select('*')
        .order('name', { ascending: true })
      
      if (error) throw error
      setRecipes(data || [])
    } catch (error) {
      console.error('Failed to load recipes:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadFavorites = async () => {
    try {
      const { data, error } = await db.supabase
        .from('ai_meal_favorites')
        .select('meal_id')
        .eq('client_id', client.id)
      
      if (error) throw error
      setFavorites(data?.map(f => f.meal_id) || [])
    } catch (error) {
      console.error('Failed to load favorites:', error)
    }
  }

  const filterRecipes = () => {
    let filtered = [...recipes]

    // Tab filtering
    if (activeTab === 'favorites') {
      filtered = filtered.filter(recipe => favorites.includes(recipe.id))
    } else if (activeTab === 'recent') {
      // TODO: Implement recent view tracking
      filtered = filtered.slice(0, 20)
    }

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(recipe => 
        recipe.name?.toLowerCase().includes(search) ||
        recipe.name_en?.toLowerCase().includes(search)
      )
    }

    // Apply selected filters
    if (selectedFilters.length > 0) {
      filtered = filtered.filter(recipe => {
        const mealLabels = recipe.labels || []
        const mealTiming = recipe.timing || []
        
        return selectedFilters.some(filter => {
          // Timing filters
          if (['breakfast', 'lunch', 'dinner', 'snack'].includes(filter)) {
            return mealTiming.includes(filter)
          }
          // Goal filters
          if (filter === 'high_protein') return recipe.protein >= 30
          if (filter === 'low_cal') return recipe.calories <= 400
          if (filter === 'high_cal') return recipe.calories >= 600
          if (filter === 'balanced') return mealLabels.includes('balanced')
          // Practical filters
          if (filter === 'quick') return (recipe.prep_time_min || 0) + (recipe.cook_time_min || 0) <= 20
          if (filter === 'meal_prep') return mealLabels.includes('meal_prep')
          if (filter === 'easy') return recipe.difficulty === 'etm'
          if (filter === 'budget') return recipe.cost_tier === 'budget'
          // Dietary filters
          if (filter === 'vegetarian') return mealLabels.includes('vegetarian')
          if (filter === 'vegan') return mealLabels.includes('vegan')
          if (filter === 'clean') return mealLabels.includes('clean')
          
          return false
        })
      })
    }

    setFilteredRecipes(filtered)
  }

  const toggleFilter = (filterId) => {
    setSelectedFilters(prev => 
      prev.includes(filterId)
        ? prev.filter(f => f !== filterId)
        : [...prev, filterId]
    )
  }

  const clearFilters = () => {
    setSelectedFilters([])
    setOpenDropdown(null)
  }

  const toggleFavorite = async (recipe, e) => {
    e.stopPropagation()
    
    try {
      const isFavorite = favorites.includes(recipe.id)
      
      if (isFavorite) {
        await db.supabase
          .from('ai_meal_favorites')
          .delete()
          .eq('client_id', client.id)
          .eq('meal_id', recipe.id)
        
        setFavorites(prev => prev.filter(id => id !== recipe.id))
      } else {
        await db.supabase
          .from('ai_meal_favorites')
          .insert({
            client_id: client.id,
            meal_id: recipe.id,
            meal_name: recipe.name,
            category: recipe.timing?.[0] || 'meal',
            calories: recipe.calories,
            protein: recipe.protein,
            added_at: new Date().toISOString()
          })
        
        setFavorites(prev => [...prev, recipe.id])
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
    }
  }

  const openRecipeDetail = (recipe) => {
    setSelectedRecipe(recipe)
    setShowInfoModal(true)
  }

  const getRecipeImage = (recipe) => {
    if (recipe.image_url) return recipe.image_url
    
    const mealType = recipe.timing?.[0] || 'meal'
    const defaults = {
      breakfast: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400&h=300&fit=crop',
      lunch: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=300&fit=crop',
      dinner: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop',
      snack: 'https://images.unsplash.com/photo-1490474504059-bf2db5ab2348?w=400&h=300&fit=crop',
      meal: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop'
    }
    return defaults[mealType] || defaults.meal
  }

  // Update tab counts
  tabs[0].count = recipes.length
  tabs[1].count = favorites.length
  tabs[2].count = Math.min(recipes.length, 20)

  if (loading) {
    return (
      <div style={{
        minHeight: '50vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '3px solid rgba(16, 185, 129, 0.2)',
            borderTopColor: '#10b981',
            borderRadius: '50%',
            margin: '0 auto 1rem',
            animation: 'spin 1s linear infinite'
          }} />
          <div style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
            Recepten laden...
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
      {/* Premium Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.98) 0%, rgba(15, 15, 15, 0.98) 100%)',
        backdropFilter: 'blur(30px)',
        borderRadius: isMobile ? '20px' : '24px',
        padding: isMobile ? '1.25rem' : '1.5rem',
        marginBottom: '1.25rem',
        border: '1px solid rgba(16, 185, 129, 0.08)',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(16, 185, 129, 0.05)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.625rem',
          marginBottom: '0.25rem'
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.08) 100%)',
            backdropFilter: 'blur(10px)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(16, 185, 129, 0.2)'
          }}>
            <ChefHat size={20} color="#10b981" />
          </div>
          <h1 style={{
            fontSize: isMobile ? '1.375rem' : '1.75rem',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            letterSpacing: '-0.02em',
            margin: 0
          }}>
            Recepten Bibliotheek
          </h1>
        </div>
        <p style={{
          fontSize: isMobile ? '0.875rem' : '0.95rem',
          color: 'rgba(255, 255, 255, 0.5)',
          margin: 0,
          paddingLeft: '46px'
        }}>
          {filteredRecipes.length} van {recipes.length} recepten
        </p>
      </div>

      {/* Premium Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '1rem'
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              padding: isMobile ? '0.75rem' : '0.875rem',
              background: activeTab === tab.id
                ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.08) 100%)'
                : 'rgba(17, 17, 17, 0.5)',
              backdropFilter: 'blur(10px)',
              border: `1px solid ${activeTab === tab.id ? 'rgba(16, 185, 129, 0.25)' : 'rgba(16, 185, 129, 0.08)'}`,
              borderRadius: '12px',
              color: activeTab === tab.id ? '#10b981' : 'rgba(255, 255, 255, 0.6)',
              fontSize: isMobile ? '0.875rem' : '0.95rem',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '44px'
            }}
          >
            <tab.icon size={18} />
            <span>{tab.label}</span>
            <span style={{
              fontSize: '0.75rem',
              padding: '0.125rem 0.375rem',
              background: activeTab === tab.id ? '#10b981' : 'rgba(255, 255, 255, 0.1)',
              borderRadius: '6px',
              fontWeight: '600'
            }}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div style={{
        position: 'relative',
        marginBottom: '1rem'
      }}>
        <Search
          size={18}
          style={{
            position: 'absolute',
            left: '1rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'rgba(16, 185, 129, 0.4)'
          }}
        />
        <input
          type="text"
          placeholder="Zoek recepten..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: isMobile ? '0.875rem 3rem' : '1rem 3rem',
            background: 'rgba(17, 17, 17, 0.5)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(16, 185, 129, 0.08)',
            borderRadius: '12px',
            color: 'white',
            fontSize: isMobile ? '0.95rem' : '1rem',
            outline: 'none',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            minHeight: '44px'
          }}
          onFocus={(e) => {
            e.currentTarget.style.border = '1px solid rgba(16, 185, 129, 0.25)'
            e.currentTarget.style.background = 'rgba(16, 185, 129, 0.05)'
          }}
          onBlur={(e) => {
            e.currentTarget.style.border = '1px solid rgba(16, 185, 129, 0.08)'
            e.currentTarget.style.background = 'rgba(17, 17, 17, 0.5)'
          }}
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            style={{
              position: 'absolute',
              right: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <X size={16} color="white" />
          </button>
        )}
      </div>

      {/* Filter Dropdowns */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        alignItems: 'center',
        flexWrap: 'wrap',
        marginBottom: '1.25rem'
      }}>
        {Object.entries(filterDropdowns).map(([key, dropdown]) => {
          const Icon = dropdown.icon
          const activeFilters = selectedFilters.filter(f => 
            dropdown.filters.some(df => df.id === f)
          )
          
          return (
            <div key={key} className="dropdown-container" style={{ position: 'relative' }}>
              <button
                onClick={() => setOpenDropdown(openDropdown === key ? null : key)}
                style={{
                  padding: isMobile ? '0.5rem 0.75rem' : '0.625rem 0.875rem',
                  background: activeFilters.length > 0
                    ? `linear-gradient(135deg, ${dropdown.color}20 0%, ${dropdown.color}10 100%)`
                    : 'rgba(17, 17, 17, 0.5)',
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${activeFilters.length > 0 ? dropdown.color + '30' : 'rgba(16, 185, 129, 0.08)'}`,
                  borderRadius: '10px',
                  color: activeFilters.length > 0 ? dropdown.color : 'rgba(255, 255, 255, 0.7)',
                  fontSize: isMobile ? '0.825rem' : '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  minHeight: '38px'
                }}
              >
                <Icon size={16} />
                <span>{dropdown.label}</span>
                {activeFilters.length > 0 && (
                  <span style={{
                    padding: '0.125rem 0.375rem',
                    background: dropdown.color,
                    borderRadius: '4px',
                    fontSize: '0.7rem',
                    color: 'white',
                    fontWeight: '700'
                  }}>
                    {activeFilters.length}
                  </span>
                )}
                <ChevronDown 
                  size={14} 
                  style={{
                    transform: openDropdown === key ? 'rotate(180deg)' : 'rotate(0)',
                    transition: 'transform 0.3s ease'
                  }}
                />
              </button>
              
              {/* Dropdown Menu */}
              {openDropdown === key && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: '0.375rem',
                  background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.98) 0%, rgba(20, 20, 20, 0.98) 100%)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(16, 185, 129, 0.15)',
                  borderRadius: '12px',
                  padding: '0.5rem',
                  minWidth: '200px',
                  maxWidth: '250px',
                  zIndex: 10,
                  boxShadow: '0 15px 40px rgba(0, 0, 0, 0.4), 0 0 20px rgba(16, 185, 129, 0.1)',
                  animation: 'slideDown 0.2s ease'
                }}>
                  {dropdown.filters.map(filter => {
                    const isActive = selectedFilters.includes(filter.id)
                    
                    return (
                      <button
                        key={filter.id}
                        onClick={() => toggleFilter(filter.id)}
                        style={{
                          width: '100%',
                          padding: '0.625rem 0.875rem',
                          background: isActive
                            ? `linear-gradient(135deg, ${filter.color}25 0%, ${filter.color}15 100%)`
                            : 'transparent',
                          border: 'none',
                          borderRadius: '8px',
                          color: isActive ? filter.color : 'rgba(255, 255, 255, 0.7)',
                          fontSize: '0.875rem',
                          fontWeight: isActive ? '700' : '500',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          textAlign: 'left',
                          marginBottom: '0.25rem'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = isActive
                            ? `linear-gradient(135deg, ${filter.color}30 0%, ${filter.color}20 100%)`
                            : 'rgba(16, 185, 129, 0.05)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = isActive
                            ? `linear-gradient(135deg, ${filter.color}25 0%, ${filter.color}15 100%)`
                            : 'transparent'
                        }}
                      >
                        <span>{filter.label}</span>
                        {isActive && <Check size={16} />}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
        
        {/* Clear Filters */}
        {selectedFilters.length > 0 && (
          <button
            onClick={clearFilters}
            style={{
              padding: isMobile ? '0.5rem 0.75rem' : '0.625rem 0.875rem',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '10px',
              color: '#ef4444',
              fontSize: isMobile ? '0.825rem' : '0.9rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              minHeight: '38px'
            }}
          >
            Clear ({selectedFilters.length})
          </button>
        )}
      </div>

      {/* Recipe Grid - 2 Column Mobile, 3 Desktop */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
        gap: isMobile ? '0.75rem' : '1rem'
      }}>
        {filteredRecipes.map(recipe => (
          <RecipeCard
            key={recipe.id}
            recipe={recipe}
            isFavorite={favorites.includes(recipe.id)}
            onToggleFavorite={toggleFavorite}
            onClick={() => openRecipeDetail(recipe)}
            isMobile={isMobile}
          />
        ))}
      </div>

      {/* Empty State */}
      {filteredRecipes.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          background: 'rgba(17, 17, 17, 0.5)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          border: '1px solid rgba(16, 185, 129, 0.08)',
          marginTop: '2rem'
        }}>
          <BookOpen size={48} color="rgba(255, 255, 255, 0.1)" style={{ marginBottom: '1rem' }} />
          <h3 style={{
            fontSize: '1.125rem',
            fontWeight: '600',
            color: 'rgba(255, 255, 255, 0.7)',
            marginBottom: '0.5rem'
          }}>
            Geen recepten gevonden
          </h3>
          <p style={{
            fontSize: '0.875rem',
            color: 'rgba(255, 255, 255, 0.4)'
          }}>
            Probeer andere filters of zoektermen
          </p>
        </div>
      )}

      {/* Back Button */}
      {onNavigate && (
        <button
          onClick={() => onNavigate('mealplan')}
          style={{
            position: 'fixed',
            bottom: isMobile ? '90px' : '2rem',
            left: isMobile ? '1rem' : '2rem',
            padding: '0.75rem 1.25rem',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%)',
            backdropFilter: 'blur(20px)',
            borderRadius: '12px',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#10b981',
            fontSize: '0.9rem',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 10px 30px rgba(16, 185, 129, 0.2)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            zIndex: 100
          }}
        >
          ← Terug
        </button>
      )}

      {/* Recipe Detail Modal */}
      {showInfoModal && selectedRecipe && (
        <AIMealInfoModal
          isOpen={showInfoModal}
          onClose={() => {
            setShowInfoModal(false)
            setSelectedRecipe(null)
          }}
          meal={selectedRecipe}
          db={db}
        />
      )}

      {/* Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.9; }
        }
      `}</style>
    </div>
  )
}

// Compact Recipe Card Component - Optimized for 2/3 column grid
function RecipeCard({ recipe, isFavorite, onToggleFavorite, onClick, isMobile }) {
  const [isHovered, setIsHovered] = useState(false)
  
  const getMealImage = () => {
    if (recipe.image_url) return recipe.image_url
    
    const mealType = recipe.timing?.[0] || 'meal'
    const fallbacks = {
      breakfast: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400&h=300&fit=crop',
      lunch: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=300&fit=crop',
      dinner: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop',
      snack: 'https://images.unsplash.com/photo-1490474504059-bf2db5ab2348?w=400&h=300&fit=crop',
      meal: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop'
    }
    return fallbacks[mealType] || fallbacks.meal
  }
  
  const getDifficultyColor = (difficulty) => {
    switch(difficulty) {
      case 'etm': return '#10b981'
      case 'medium': return '#f59e0b'
      case 'htm': return '#ef4444'
      default: return '#6b7280'
    }
  }
  
  const getDifficultyLabel = (difficulty) => {
    switch(difficulty) {
      case 'etm': return 'Makkelijk'
      case 'medium': return 'Gemiddeld'
      case 'htm': return 'Moeilijk'
      default: return difficulty
    }
  }
  
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: 'rgba(17, 17, 17, 0.5)',
        backdropFilter: 'blur(10px)',
        borderRadius: '16px',
        overflow: 'hidden',
        border: '1px solid rgba(16, 185, 129, 0.08)',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isHovered ? 'translateY(-4px) scale(1.02)' : 'translateY(0) scale(1)',
        boxShadow: isHovered
          ? '0 20px 40px rgba(16, 185, 129, 0.15)'
          : '0 4px 16px rgba(16, 185, 129, 0.05)',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent'
      }}
      onTouchStart={(e) => {
        if (isMobile) {
          e.currentTarget.style.transform = 'scale(0.98)'
        }
      }}
      onTouchEnd={(e) => {
        if (isMobile) {
          e.currentTarget.style.transform = 'scale(1)'
        }
      }}
    >
      {/* Image Section */}
      <div style={{
        height: isMobile ? '120px' : '140px',
        background: `linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.7) 100%), url(${getMealImage()}) center/cover`,
        position: 'relative'
      }}>
        {/* Favorite Button */}
        <button
          onClick={(e) => onToggleFavorite(recipe, e)}
          style={{
            position: 'absolute',
            top: '0.5rem',
            right: '0.5rem',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
        >
          <Heart 
            size={16} 
            color={isFavorite ? '#ef4444' : 'white'}
            fill={isFavorite ? '#ef4444' : 'none'}
          />
        </button>
        
        {/* Difficulty Badge */}
        {recipe.difficulty && (
          <div style={{
            position: 'absolute',
            bottom: '0.5rem',
            left: '0.5rem',
            padding: '0.25rem 0.5rem',
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(10px)',
            borderRadius: '6px',
            border: `1px solid ${getDifficultyColor(recipe.difficulty)}40`,
            fontSize: '0.65rem',
            fontWeight: '700',
            color: getDifficultyColor(recipe.difficulty),
            textTransform: 'uppercase',
            letterSpacing: '0.03em'
          }}>
            {getDifficultyLabel(recipe.difficulty)}
          </div>
        )}
      </div>
      
      {/* Content */}
      <div style={{
        padding: isMobile ? '0.75rem' : '0.875rem'
      }}>
        {/* Name */}
        <h4 style={{
          fontSize: isMobile ? '0.9rem' : '0.95rem',
          fontWeight: '700',
          color: 'white',
          marginBottom: '0.5rem',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          letterSpacing: '-0.02em'
        }}>
          {recipe.name}
        </h4>
        
        {/* Compact Macros */}
        <div style={{
          display: 'flex',
          gap: '0.75rem',
          marginBottom: '0.5rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem'
          }}>
            <Flame size={12} color="#f59e0b" />
            <span style={{
              fontSize: isMobile ? '0.8rem' : '0.85rem',
              fontWeight: '600',
              color: '#f59e0b'
            }}>
              {Math.round(recipe.calories)}
            </span>
          </div>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem'
          }}>
            <Target size={12} color="#8b5cf6" />
            <span style={{
              fontSize: isMobile ? '0.8rem' : '0.85rem',
              fontWeight: '600',
              color: '#8b5cf6'
            }}>
              {Math.round(recipe.protein)}g
            </span>
          </div>
        </div>
        
        {/* Bottom Row - Time & Cost */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '0.5rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem'
          }}>
            <Clock size={11} color="rgba(255, 255, 255, 0.4)" />
            <span style={{
              fontSize: '0.7rem',
              color: 'rgba(255, 255, 255, 0.5)'
            }}>
              {(recipe.prep_time_min || 0) + (recipe.cook_time_min || 0)} min
            </span>
          </div>
          
          {recipe.cost_tier && (
            <span style={{
              fontSize: '0.7rem',
              color: 'rgba(255, 255, 255, 0.5)',
              fontWeight: '600'
            }}>
              {recipe.cost_tier === 'budget' ? '€' : recipe.cost_tier === 'moderate' ? '€€' : '€€€'}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
