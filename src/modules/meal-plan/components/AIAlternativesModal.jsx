// src/modules/meal-plan/components/AIAlternativesModal.jsx
import React, { useState, useEffect, useRef } from 'react'
import { 
  X, Search, Star, Clock, Flame, Target, 
  Filter, Check, TrendingUp, Sparkles, Zap,
  DollarSign, Leaf, Timer, ChefHat, Award,
  Wheat, Milk, TrendingDown, Scale, ChevronDown
} from 'lucide-react'

export default function AIAlternativesModal({ 
  isOpen, 
  onClose, 
  currentMeal, 
  onSelectMeal,
  db,
  service
}) {
  const isMobile = window.innerWidth <= 768
  const [activeTab, setActiveTab] = useState('recommended')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFilters, setSelectedFilters] = useState([])
  const [alternatives, setAlternatives] = useState([])
  const [favorites, setFavorites] = useState([])
  const [allMeals, setAllMeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedMeal, setSelectedMeal] = useState(null)
  const [openDropdown, setOpenDropdown] = useState(null)
  
  // Filter Categories organized by dropdown
  const filterDropdowns = {
    timing: {
      label: 'Tijdstip',
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
      label: 'Doelen',
      icon: Target,
      color: '#8b5cf6',
      filters: [
        { id: 'bulk', label: 'Bulk (600+ kcal)', color: '#10b981' },
        { id: 'cut', label: 'Cut (<400 kcal)', color: '#ef4444' },
        { id: 'high-protein', label: '30g+ Eiwit', color: '#8b5cf6' },
        { id: 'low-carb', label: 'Low Carb (<20g)', color: '#f97316' },
        { id: 'balanced', label: 'Balanced', color: '#06b6d4' }
      ]
    },
    practical: {
      label: 'Praktisch',
      icon: ChefHat,
      color: '#fbbf24',
      filters: [
        { id: 'quick', label: 'Quick (<15 min)', color: '#fbbf24' },
        { id: 'meal-prep', label: 'Meal Prep', color: '#10b981' },
        { id: 'no-cook', label: 'No Cook', color: '#a855f7' },
        { id: 'budget', label: 'Budget (<€5)', color: '#84cc16' }
      ]
    },
    dietary: {
      label: 'Dieet',
      icon: Leaf,
      color: '#22c55e',
      filters: [
        { id: 'vegetarian', label: 'Vegetarisch', color: '#22c55e' },
        { id: 'vegan', label: 'Vegan', color: '#16a34a' },
        { id: 'gluten-free', label: 'Glutenvrij', color: '#fbbf24' },
        { id: 'dairy-free', label: 'Zuivelvrij', color: '#60a5fa' }
      ]
    }
  }
  
  // Load data when modal opens
  useEffect(() => {
    if (isOpen && currentMeal) {
      loadAlternatives()
    }
  }, [isOpen, currentMeal])
  
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
  
  const loadAlternatives = async () => {
    setLoading(true)
    try {
      const smartAlternatives = await service.getSmartAlternatives(
        currentMeal,
        currentMeal.slot || currentMeal.timeSlot
      )
      
      const clientId = await db.getCurrentUser().then(u => u.id)
      const favs = await service.getAIFavorites(clientId)
      
      const { data: meals } = await db.supabase
        .from('ai_meals')
        .select('*')
        .limit(200)
      
      setAlternatives(smartAlternatives)
      setFavorites(favs)
      setAllMeals(meals || [])
    } catch (error) {
      console.error('Failed to load alternatives:', error)
    } finally {
      setLoading(false)
    }
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
  
  const getFilteredMeals = () => {
    let meals = []
    
    if (activeTab === 'recommended') {
      meals = alternatives
    } else if (activeTab === 'favorites') {
      meals = favorites
        .map(fav => allMeals.find(m => m.id === fav.meal_id))
        .filter(Boolean)
    } else {
      meals = allMeals
    }
    
    if (searchTerm) {
      meals = meals.filter(meal => 
        meal.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        meal.name_en?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    if (selectedFilters.length > 0) {
      meals = meals.filter(meal => {
        const mealLabels = meal.labels || []
        const mealTiming = meal.timing || []
        
        return selectedFilters.some(filter => {
          if (['breakfast', 'lunch', 'dinner', 'snack'].includes(filter)) {
            return mealTiming.includes(filter)
          }
          if (filter === 'high-protein') return meal.protein >= 30
          if (filter === 'low-carb') return meal.carbs <= 20
          if (filter === 'bulk') return meal.calories >= 600
          if (filter === 'cut') return meal.calories <= 400
          if (filter === 'quick') return (meal.prep_time_min || 0) <= 15
          if (filter === 'budget') return meal.cost_tier === 'budget' || meal.total_cost <= 5
          return mealLabels.includes(filter)
        })
      })
    }
    
    return meals
  }
  
  const filteredMeals = getFilteredMeals()
  
  const getMatchScore = (meal) => {
    if (!currentMeal?.labels) return 0
    const mealLabels = meal.labels || []
    const currentLabels = currentMeal.labels || []
    const matches = mealLabels.filter(l => currentLabels.includes(l)).length
    return Math.round((matches / Math.max(currentLabels.length, 1)) * 100)
  }
  
  if (!isOpen) return null
  
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(20px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: isMobile ? '0.75rem' : '2rem',
      animation: 'fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.98) 0%, rgba(15, 15, 15, 0.98) 100%)',
        backdropFilter: 'blur(30px)',
        borderRadius: isMobile ? '20px' : '28px',
        width: '100%',
        maxWidth: isMobile ? '100%' : '1000px',
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid rgba(16, 185, 129, 0.08)',
        boxShadow: '0 25px 80px rgba(0, 0, 0, 0.6), 0 0 60px rgba(16, 185, 129, 0.1)',
        overflow: 'hidden'
      }}>
        {/* Premium Header */}
        <div style={{
          padding: isMobile ? '1rem' : '1.5rem',
          borderBottom: '1px solid rgba(16, 185, 129, 0.08)',
          background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.05) 0%, transparent 100%)'
        }}>
          {/* Title Row */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem'
          }}>
            <h2 style={{
              fontSize: isMobile ? '1.25rem' : '1.5rem',
              fontWeight: '800',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              letterSpacing: '-0.02em'
            }}>
              <Sparkles size={24} color="#10b981" />
              Kies Alternatief
            </h2>
            <button
              onClick={onClose}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'rgba(16, 185, 129, 0.05)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(16, 185, 129, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(16, 185, 129, 0.15)'
                e.currentTarget.style.transform = 'scale(1.05)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(16, 185, 129, 0.05)'
                e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              <X size={20} color="#10b981" />
            </button>
          </div>
          
          {/* Current Meal Info */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(16, 185, 129, 0.04) 100%)',
            backdropFilter: 'blur(20px)',
            borderRadius: '14px',
            padding: isMobile ? '0.75rem' : '1rem',
            border: '1px solid rgba(16, 185, 129, 0.15)',
            boxShadow: '0 8px 32px rgba(16, 185, 129, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.03)',
            marginBottom: '1rem'
          }}>
            <div style={{
              fontSize: isMobile ? '0.6rem' : '0.65rem',
              color: 'rgba(16, 185, 129, 0.5)',
              marginBottom: '0.25rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              fontWeight: '700'
            }}>
              Huidige Maaltijd
            </div>
            <div style={{
              fontSize: isMobile ? '1rem' : '1.125rem',
              fontWeight: '700',
              color: '#10b981',
              letterSpacing: '-0.02em'
            }}>
              {currentMeal?.name || currentMeal?.meal_name}
            </div>
            <div style={{
              display: 'flex',
              gap: '1rem',
              marginTop: '0.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Flame size={14} color="#f59e0b" style={{ opacity: 0.7 }} />
                <span style={{ fontSize: '0.875rem', color: '#f59e0b', fontWeight: '600' }}>
                  {currentMeal?.calories || currentMeal?.kcal} kcal
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Target size={14} color="#8b5cf6" style={{ opacity: 0.7 }} />
                <span style={{ fontSize: '0.875rem', color: '#8b5cf6', fontWeight: '600' }}>
                  {currentMeal?.protein}g
                </span>
              </div>
            </div>
          </div>
          
          {/* Premium Tabs */}
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            marginBottom: '1rem'
          }}>
            {[
              { id: 'recommended', label: 'Aanbevolen', icon: Award, count: alternatives.length },
              { id: 'favorites', label: 'Favorieten', icon: Star, count: favorites.length },
              { id: 'all', label: 'Alle', icon: Filter, count: allMeals.length }
            ].map(tab => (
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
              placeholder="Zoek maaltijden..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: isMobile ? '0.875rem 1rem 0.875rem 3rem' : '1rem 1rem 1rem 3rem',
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
          </div>
          
          {/* Filter Dropdowns */}
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'center',
            flexWrap: 'wrap'
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
                    onMouseEnter={(e) => {
                      if (activeFilters.length === 0) {
                        e.currentTarget.style.background = 'rgba(16, 185, 129, 0.05)'
                        e.currentTarget.style.border = '1px solid rgba(16, 185, 129, 0.15)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (activeFilters.length === 0) {
                        e.currentTarget.style.background = 'rgba(17, 17, 17, 0.5)'
                        e.currentTarget.style.border = '1px solid rgba(16, 185, 129, 0.08)'
                      }
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
            
            {/* Clear Filters Button */}
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
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'
                }}
              >
                Clear ({selectedFilters.length})
              </button>
            )}
          </div>
        </div>
        
        {/* Meals Grid - 2 Column Layout */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: isMobile ? '0.75rem' : '1.5rem',
          background: 'linear-gradient(180deg, transparent 0%, rgba(16, 185, 129, 0.02) 100%)'
        }}>
          {loading ? (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '200px'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                border: '3px solid rgba(16, 185, 129, 0.15)',
                borderTopColor: '#10b981',
                borderRadius: '50%',
                animation: 'spin 1s cubic-bezier(0.4, 0, 0.2, 1) infinite'
              }} />
            </div>
          ) : filteredMeals.length > 0 ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: isMobile ? '0.75rem' : '1rem'
            }}>
              {filteredMeals.map(meal => (
                <MealCard
                  key={meal.id}
                  meal={meal}
                  isSelected={selectedMeal?.id === meal.id}
                  matchScore={activeTab === 'recommended' ? getMatchScore(meal) : null}
                  onSelect={() => setSelectedMeal(meal)}
                  isMobile={isMobile}
                />
              ))}
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '3rem',
              color: 'rgba(255, 255, 255, 0.5)'
            }}>
              <Search size={48} style={{ marginBottom: '1rem', opacity: 0.2 }} />
              <p style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>Geen maaltijden gevonden</p>
              <p style={{ fontSize: '0.875rem', opacity: 0.7 }}>Probeer andere filters of zoektermen</p>
            </div>
          )}
        </div>
        
        {/* Premium Footer */}
        {selectedMeal && (
          <div style={{
            padding: isMobile ? '1rem' : '1.25rem',
            borderTop: '1px solid rgba(16, 185, 129, 0.08)',
            background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.05) 0%, transparent 100%)',
            backdropFilter: 'blur(20px)',
            display: 'flex',
            gap: '1rem'
          }}>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: isMobile ? '0.875rem' : '1rem',
                background: 'rgba(17, 17, 17, 0.5)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(16, 185, 129, 0.08)',
                borderRadius: '12px',
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: isMobile ? '0.95rem' : '1.05rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                minHeight: '44px',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              Annuleren
            </button>
            <button
              onClick={() => onSelectMeal(selectedMeal.id)}
              style={{
                flex: 2,
                padding: isMobile ? '0.875rem' : '1rem',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: '12px',
                color: 'white',
                fontSize: isMobile ? '0.95rem' : '1.05rem',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 8px 32px rgba(16, 185, 129, 0.3)',
                minHeight: '44px',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                letterSpacing: '-0.01em'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 12px 40px rgba(16, 185, 129, 0.4)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(16, 185, 129, 0.3)'
              }}
            >
              Selecteer {selectedMeal.name}
            </button>
          </div>
        )}
      </div>
      
      {/* Premium Animations */}
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
        
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        @keyframes pulse {
          0%, 100% { 
            transform: scale(1);
            opacity: 1;
          }
          50% { 
            transform: scale(1.1);
            opacity: 0.8;
          }
        }
      `}</style>
    </div>
  )
}

// Premium Meal Card Component - Optimized for 2-column grid
function MealCard({ meal, isSelected, matchScore, onSelect, isMobile }) {
  const [isHovered, setIsHovered] = useState(false)
  
  const getMealImage = () => {
    if (meal.image_url) return meal.image_url
    
    const fallbacks = {
      breakfast: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400&h=300&fit=crop',
      lunch: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=300&fit=crop',
      dinner: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop',
      snack: 'https://images.unsplash.com/photo-1490474504059-bf2db5ab2348?w=400&h=300&fit=crop'
    }
    
    const type = meal.timing?.[0] || meal.meal_type || 'lunch'
    return fallbacks[type] || fallbacks.lunch
  }
  
  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: isSelected
          ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(16, 185, 129, 0.04) 100%)'
          : 'rgba(17, 17, 17, 0.5)',
        backdropFilter: 'blur(10px)',
        borderRadius: '16px',
        overflow: 'hidden',
        border: isSelected
          ? '2px solid rgba(16, 185, 129, 0.25)'
          : '1px solid rgba(16, 185, 129, 0.08)',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isHovered ? 'translateY(-4px) scale(1.02)' : 'translateY(0) scale(1)',
        boxShadow: isSelected
          ? '0 20px 40px rgba(16, 185, 129, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.03)'
          : isHovered
            ? '0 15px 35px rgba(0, 0, 0, 0.3)'
            : '0 4px 16px rgba(16, 185, 129, 0.05)',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent'
      }}
    >
      {/* Image Section - Optimized for 2-column */}
      <div style={{
        height: isMobile ? '120px' : '140px',
        background: `linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.7) 100%), url(${getMealImage()}) center/cover`,
        position: 'relative'
      }}>
        {/* Match Score Badge */}
        {matchScore !== null && matchScore > 0 && (
          <div style={{
            position: 'absolute',
            top: '0.5rem',
            right: '0.5rem',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.9) 0%, rgba(5, 150, 105, 0.9) 100%)',
            backdropFilter: 'blur(10px)',
            borderRadius: '8px',
            padding: '0.25rem 0.5rem',
            fontSize: isMobile ? '0.7rem' : '0.75rem',
            fontWeight: '700',
            color: 'white',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
          }}>
            {matchScore}%
          </div>
        )}
        
        {/* Selected Check */}
        {isSelected && (
          <div style={{
            position: 'absolute',
            top: '0.5rem',
            left: '0.5rem',
            width: '28px',
            height: '28px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 6px 16px rgba(16, 185, 129, 0.4)',
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.2, 1) infinite'
          }}>
            <Check size={16} color="white" strokeWidth={3} />
          </div>
        )}
      </div>
      
      {/* Content Section - Compact for 2-column */}
      <div style={{
        padding: isMobile ? '0.75rem' : '0.875rem'
      }}>
        {/* Meal Name */}
        <h4 style={{
          fontSize: isMobile ? '0.9rem' : '1rem',
          fontWeight: '700',
          color: isSelected ? '#10b981' : 'white',
          marginBottom: '0.5rem',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          letterSpacing: '-0.02em'
        }}>
          {meal.name}
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
              {Math.round(meal.calories)}
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
              {Math.round(meal.protein)}g
            </span>
          </div>
        </div>
        
        {/* Compact Labels - Max 2 */}
        {meal.labels && meal.labels.length > 0 && (
          <div style={{
            display: 'flex',
            gap: '0.25rem',
            flexWrap: 'wrap'
          }}>
            {meal.labels.slice(0, 2).map((label, idx) => (
              <span
                key={idx}
                style={{
                  fontSize: '0.6rem',
                  padding: '0.2rem 0.4rem',
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(16, 185, 129, 0.06) 100%)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  borderRadius: '4px',
                  color: '#10b981',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '0.03em'
                }}
              >
                {label}
              </span>
            ))}
            {meal.labels.length > 2 && (
              <span style={{
                fontSize: '0.6rem',
                padding: '0.2rem 0.4rem',
                color: 'rgba(16, 185, 129, 0.5)',
                fontWeight: '600'
              }}>
                +{meal.labels.length - 2}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
