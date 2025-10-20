// src/modules/meal-plan/components/AIFavoritesModal.jsx
import React, { useState, useEffect } from 'react'
import { 
  X, Heart, Clock, Flame, Target, Star,
  TrendingUp, Sparkles, ChevronRight, Filter,
  Award, Zap, Timer, Calendar, BarChart3,
  Coffee, Sun, Moon, AlertCircle, Check
} from 'lucide-react'

export default function AIFavoritesModal({ 
  isOpen, 
  onClose,
  onSelectMeal,
  currentMeal,
  db,
  service,
  client
}) {
  const isMobile = window.innerWidth <= 768
  const [activeTab, setActiveTab] = useState('smart')
  const [favorites, setFavorites] = useState([])
  const [meals, setMeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedMeal, setSelectedMeal] = useState(null)
  const [viewMode, setViewMode] = useState('grid')
  const [clientId, setClientId] = useState(null)
  const [debugInfo, setDebugInfo] = useState({})
  
  // Get current time-based recommendation
  const getCurrentMealType = () => {
    const hour = new Date().getHours()
    if (hour < 10) return 'breakfast'
    if (hour < 14) return 'lunch'
    if (hour < 17) return 'snack'
    if (hour < 21) return 'dinner'
    return 'snack'
  }
  
  const currentMealType = getCurrentMealType()
  
  // Tab configuration
  const tabs = [
    { id: 'smart', label: 'Smart', icon: Sparkles, color: '#10b981' },
    { id: 'all', label: 'Alle', icon: Heart, color: '#ef4444' },
    { id: 'stats', label: 'Stats', icon: BarChart3, color: '#8b5cf6' }
  ]
  
  // FIXED: Get clientId with proper database methods
  useEffect(() => {
    const getClientId = async () => {
      console.log('🔍 [AIFavoritesModal] Starting client ID detection...')
      
      // Method 1: Check passed client prop
      if (client?.id) {
        console.log('✅ [AIFavoritesModal] Client ID from prop:', client.id)
        setClientId(client.id)
        setDebugInfo(prev => ({ ...prev, clientSource: 'prop', clientId: client.id }))
        return
      }
      
      // Method 2: Get from auth user via DatabaseService
      try {
        console.log('🔍 [AIFavoritesModal] Attempting to get auth user...')
        const authUser = await db.getCurrentUser()
        console.log('📧 [AIFavoritesModal] Auth user:', authUser)
        
        if (authUser?.email) {
          console.log('🔍 [AIFavoritesModal] Looking up client by email:', authUser.email)
          const clientData = await db.getClientByEmail(authUser.email)
          
          if (clientData?.id) {
            console.log('✅ [AIFavoritesModal] Client found:', clientData.id)
            setClientId(clientData.id)
            setDebugInfo(prev => ({ 
              ...prev, 
              clientSource: 'email-lookup', 
              clientId: clientData.id,
              email: authUser.email 
            }))
          } else {
            console.error('❌ [AIFavoritesModal] No client found for email:', authUser.email)
            setDebugInfo(prev => ({ ...prev, error: 'No client for email' }))
          }
        } else {
          console.error('❌ [AIFavoritesModal] No auth user email found')
          setDebugInfo(prev => ({ ...prev, error: 'No auth user' }))
        }
      } catch (error) {
        console.error('❌ [AIFavoritesModal] Failed to get client ID:', error)
        setDebugInfo(prev => ({ ...prev, error: error.message }))
      }
    }
    
    getClientId()
  }, [client, db])
  
  // Load favorites when modal opens AND clientId is available
  useEffect(() => {
    if (isOpen && clientId) {
      console.log('🚀 [AIFavoritesModal] Loading favorites for client:', clientId)
      loadFavorites()
    } else if (isOpen && !clientId) {
      console.warn('⚠️ [AIFavoritesModal] Modal open but no clientId yet')
      setLoading(false)
    }
  }, [isOpen, clientId])
  
  const loadFavorites = async () => {
    if (!clientId) {
      console.error('❌ [AIFavoritesModal] Cannot load favorites - no clientId')
      setLoading(false)
      return
    }
    
    setLoading(true)
    try {
      console.log('📦 [AIFavoritesModal] Starting favorites load for:', clientId)
      
      // Method 1: Try service first if available
      let favData = null
      let mealData = null
      
      if (service?.getAIFavorites) {
        console.log('🔧 [AIFavoritesModal] Using service method...')
        favData = await service.getAIFavorites(clientId)
        console.log('📊 [AIFavoritesModal] Service returned favorites:', favData?.length || 0)
      } else {
        console.log('🔧 [AIFavoritesModal] Service not available, using direct DB query...')
        
        // Direct database query
        const { data, error } = await db.supabase
          .from('ai_meal_favorites')
          .select('*')
          .eq('client_id', clientId)
          .order('times_selected', { ascending: false })
        
        if (error) {
          console.error('❌ [AIFavoritesModal] Database error:', error)
          throw error
        }
        
        favData = data
        console.log('📊 [AIFavoritesModal] Direct DB returned favorites:', favData?.length || 0)
      }
      
      setFavorites(favData || [])
      setDebugInfo(prev => ({ ...prev, favoritesCount: favData?.length || 0 }))
      
      // Load meal details if we have favorites
      if (favData && favData.length > 0) {
        console.log('🍽️ [AIFavoritesModal] Loading meal details for favorites...')
        const mealIds = favData.map(f => f.meal_id).filter(Boolean)
        console.log('🔍 [AIFavoritesModal] Meal IDs to fetch:', mealIds)
        
        if (mealIds.length > 0) {
          // Check both ai_meals and ai_custom_meals tables
          const [aiMealsResult, customMealsResult] = await Promise.all([
            db.supabase
              .from('ai_meals')
              .select('*')
              .in('id', mealIds),
            db.supabase
              .from('ai_custom_meals')
              .select('*')
              .in('id', mealIds)
          ])
          
          const aiMeals = aiMealsResult.data || []
          const customMeals = customMealsResult.data || []
          
          console.log('📊 [AIFavoritesModal] Found AI meals:', aiMeals.length)
          console.log('📊 [AIFavoritesModal] Found custom meals:', customMeals.length)
          
          // Combine both sources
          mealData = [...aiMeals, ...customMeals]
          console.log('✅ [AIFavoritesModal] Total meals loaded:', mealData.length)
          
          setMeals(mealData)
          setDebugInfo(prev => ({ 
            ...prev, 
            mealsCount: mealData.length,
            aiMealsCount: aiMeals.length,
            customMealsCount: customMeals.length 
          }))
        }
      } else {
        console.log('📭 [AIFavoritesModal] No favorites found for client')
        setMeals([])
      }
      
    } catch (error) {
      console.error('❌ [AIFavoritesModal] Failed to load favorites:', error)
      setFavorites([])
      setMeals([])
      setDebugInfo(prev => ({ ...prev, loadError: error.message }))
    } finally {
      setLoading(false)
      console.log('✅ [AIFavoritesModal] Load complete')
    }
  }
  
  const removeFavorite = async (mealId) => {
    if (!clientId) {
      console.error('❌ [AIFavoritesModal] Cannot remove favorite - no clientId')
      return
    }
    
    console.log('🗑️ [AIFavoritesModal] Removing favorite:', mealId)
    
    try {
      if (service?.toggleAIFavorite) {
        console.log('🔧 [AIFavoritesModal] Using service to toggle favorite...')
        const meal = meals.find(m => m.id === mealId)
        if (meal) {
          await service.toggleAIFavorite(clientId, mealId, meal)
        }
      } else {
        console.log('🔧 [AIFavoritesModal] Using direct DB to remove favorite...')
        const { error } = await db.supabase
          .from('ai_meal_favorites')
          .delete()
          .eq('client_id', clientId)
          .eq('meal_id', mealId)
        
        if (error) throw error
      }
      
      // Update local state
      setFavorites(prev => prev.filter(f => f.meal_id !== mealId))
      setMeals(prev => prev.filter(m => m.id !== mealId))
      
      console.log('✅ [AIFavoritesModal] Favorite removed:', mealId)
    } catch (error) {
      console.error('❌ [AIFavoritesModal] Failed to remove favorite:', error)
    }
  }
  
  const handleSelectMeal = (meal) => {
    console.log('🍽️ [AIFavoritesModal] Meal selected:', meal.id, meal.name)
    setSelectedMeal(meal)
  }
  
  const confirmSelection = () => {
    if (selectedMeal && onSelectMeal) {
      console.log('✅ [AIFavoritesModal] Confirming selection:', selectedMeal.id)
      onSelectMeal(selectedMeal.id)
      onClose()
    } else {
      console.warn('⚠️ [AIFavoritesModal] Cannot confirm - missing meal or handler')
    }
  }
  
  // Smart categorization
  const getSmartCategories = () => {
    console.log('🧠 [AIFavoritesModal] Calculating smart categories...')
    
    const topUsed = favorites
      .filter(f => f.times_selected > 0)
      .sort((a, b) => b.times_selected - a.times_selected)
      .slice(0, 3)
    
    const neverTried = favorites.filter(f => !f.times_selected || f.times_selected === 0)
    
    const oldFavorites = favorites.filter(f => {
      if (!f.last_selected) return true
      const daysSince = Math.floor((new Date() - new Date(f.last_selected)) / (1000 * 60 * 60 * 24))
      return daysSince > 14
    })
    
    const timeRelevant = meals.filter(meal => {
      const timing = meal.timing || []
      return timing.includes(currentMealType)
    })
    
    console.log('📊 [AIFavoritesModal] Categories:', {
      topUsed: topUsed.length,
      neverTried: neverTried.length,
      oldFavorites: oldFavorites.length,
      timeRelevant: timeRelevant.length
    })
    
    return {
      topUsed,
      neverTried,
      oldFavorites,
      timeRelevant
    }
  }
  
  const smartCategories = getSmartCategories()
  
  // Calculate stats
  const calculateStats = () => {
    const totalSelections = favorites.reduce((sum, f) => sum + (f.times_selected || 0), 0)
    const avgCalories = meals.reduce((sum, m) => sum + (m.calories || 0), 0) / (meals.length || 1)
    const avgProtein = meals.reduce((sum, m) => sum + (m.protein || 0), 0) / (meals.length || 1)
    
    const categoryCount = {}
    favorites.forEach(f => {
      const cat = f.category || 'other'
      categoryCount[cat] = (categoryCount[cat] || 0) + 1
    })
    
    const topCategory = Object.entries(categoryCount).sort((a, b) => b[1] - a[1])[0]
    
    return {
      totalFavorites: favorites.length,
      totalSelections,
      avgCalories: Math.round(avgCalories),
      avgProtein: Math.round(avgProtein),
      topCategory
    }
  }
  
  const stats = calculateStats()
  
  if (!isOpen) return null
  
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
      padding: isMobile ? '0.75rem' : '2rem',
      animation: 'fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.98) 0%, rgba(15, 15, 15, 0.98) 100%)',
        backdropFilter: 'blur(30px)',
        borderRadius: isMobile ? '20px' : '28px',
        width: '100%',
        maxWidth: isMobile ? '100%' : '900px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid rgba(16, 185, 129, 0.1)',
        boxShadow: '0 25px 80px rgba(0, 0, 0, 0.5), 0 0 60px rgba(16, 185, 129, 0.05)',
        overflow: 'hidden'
      }}>
        
        {/* Premium Header */}
        <div style={{
          padding: isMobile ? '1rem' : '1.5rem',
          borderBottom: '1px solid rgba(16, 185, 129, 0.08)',
          background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.03) 0%, transparent 100%)'
        }}>
          {/* Title Row */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.625rem'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.08) 100%)',
                backdropFilter: 'blur(10px)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(239, 68, 68, 0.2)'
              }}>
                <Heart size={22} color="#ef4444" fill="#ef4444" />
              </div>
              <div>
                <h2 style={{
                  fontSize: isMobile ? '1.25rem' : '1.5rem',
                  fontWeight: '800',
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  letterSpacing: '-0.02em',
                  margin: 0
                }}>
                  Jouw Favorieten
                </h2>
                <p style={{
                  fontSize: isMobile ? '0.75rem' : '0.825rem',
                  color: 'rgba(255, 255, 255, 0.5)',
                  margin: 0
                }}>
                  {favorites.length} meals • {stats.totalSelections}x gebruikt
                </p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'
                e.currentTarget.style.transform = 'scale(1.05)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              <X size={20} color="white" />
            </button>
          </div>
          
          {/* Time-based suggestion - Only show if we have time-relevant meals */}
          {smartCategories.timeRelevant.length > 0 && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.08) 0%, rgba(251, 191, 36, 0.03) 100%)',
              borderRadius: '12px',
              padding: isMobile ? '0.75rem' : '0.875rem',
              border: '1px solid rgba(251, 191, 36, 0.15)',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              {currentMealType === 'breakfast' && <Coffee size={18} color="#fbbf24" />}
              {currentMealType === 'lunch' && <Sun size={18} color="#fbbf24" />}
              {currentMealType === 'dinner' && <Moon size={18} color="#fbbf24" />}
              {currentMealType === 'snack' && <Clock size={18} color="#fbbf24" />}
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: isMobile ? '0.825rem' : '0.9rem',
                  fontWeight: '600',
                  color: '#fbbf24',
                  marginBottom: '0.125rem'
                }}>
                  Perfect voor nu: {currentMealType === 'breakfast' ? 'Ontbijt' : currentMealType === 'lunch' ? 'Lunch' : currentMealType === 'dinner' ? 'Diner' : 'Snack'}
                </div>
                <div style={{
                  fontSize: isMobile ? '0.7rem' : '0.75rem',
                  color: 'rgba(251, 191, 36, 0.7)'
                }}>
                  {smartCategories.timeRelevant.length} favorieten passen bij dit moment
                </div>
              </div>
            </div>
          )}
          
          {/* Premium Tabs */}
          <div style={{
            display: 'flex',
            gap: '0.5rem'
          }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: 1,
                  padding: isMobile ? '0.75rem' : '0.875rem',
                  background: activeTab === tab.id
                    ? `linear-gradient(135deg, ${tab.color}15 0%, ${tab.color}08 100%)`
                    : 'rgba(17, 17, 17, 0.5)',
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${activeTab === tab.id ? tab.color + '25' : 'rgba(255, 255, 255, 0.08)'}`,
                  borderRadius: '12px',
                  color: activeTab === tab.id ? tab.color : 'rgba(255, 255, 255, 0.6)',
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
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* Content Area */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: isMobile ? '0.75rem' : '1rem'
        }}>
          {loading ? (
            <LoadingState />
          ) : !clientId ? (  // FIXED: Check clientId, not localClientId
            <ErrorState message="Geen client ID gevonden. Log opnieuw in." />
          ) : favorites.length === 0 ? (
            <EmptyState onClose={onClose} />
          ) : (
            <>
              {/* Smart Tab */}
              {activeTab === 'smart' && (
                <SmartTab
                  categories={smartCategories}
                  meals={meals}
                  favorites={favorites}
                  selectedMeal={selectedMeal}
                  onSelectMeal={handleSelectMeal}
                  onRemoveFavorite={removeFavorite}
                  isMobile={isMobile}
                />
              )}
              
              {/* All Tab */}
              {activeTab === 'all' && (
                <AllTab
                  meals={meals}
                  favorites={favorites}
                  selectedMeal={selectedMeal}
                  onSelectMeal={handleSelectMeal}
                  onRemoveFavorite={removeFavorite}
                  viewMode={viewMode}
                  setViewMode={setViewMode}
                  isMobile={isMobile}
                />
              )}
              
              {/* Stats Tab */}
              {activeTab === 'stats' && (
                <StatsTab
                  stats={stats}
                  favorites={favorites}
                  meals={meals}
                  isMobile={isMobile}
                />
              )}
            </>
          )}
        </div>
        
        {/* Footer with selection - Only show if meal is selected AND we have a handler */}
        {selectedMeal && onSelectMeal && !loading && favorites.length > 0 && (
          <div style={{
            padding: isMobile ? '1rem' : '1.25rem',
            borderTop: '1px solid rgba(16, 185, 129, 0.08)',
            background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.03) 0%, transparent 100%)',
            display: 'flex',
            gap: '1rem'
          }}>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: isMobile ? '0.875rem' : '1rem',
                background: 'rgba(17, 17, 17, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: isMobile ? '0.9rem' : '0.95rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                minHeight: '44px',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              Annuleren
            </button>
            <button
              onClick={confirmSelection}
              style={{
                flex: 2,
                padding: isMobile ? '0.875rem' : '1rem',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: '12px',
                color: 'white',
                fontSize: isMobile ? '0.9rem' : '0.95rem',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 8px 32px rgba(16, 185, 129, 0.3)',
                minHeight: '44px',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
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
      
      {/* Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

// Helper Components
function ErrorState({ message }) {
  const isMobile = window.innerWidth <= 768
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '3rem 1rem',
      textAlign: 'center'
    }}>
      <div style={{
        width: '80px',
        height: '80px',
        background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%)',
        borderRadius: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '1.5rem',
        border: '1px solid rgba(239, 68, 68, 0.15)'
      }}>
        <AlertCircle size={36} color="#ef4444" />
      </div>
      
      <h3 style={{
        fontSize: isMobile ? '1.125rem' : '1.25rem',
        fontWeight: '700',
        color: '#ef4444',
        marginBottom: '0.5rem'
      }}>
        Er ging iets mis
      </h3>
      
      <p style={{
        fontSize: isMobile ? '0.875rem' : '0.95rem',
        color: 'rgba(255, 255, 255, 0.5)',
        maxWidth: '300px',
        lineHeight: 1.5
      }}>
        {message}
      </p>
    </div>
  )
}

function EmptyState({ onClose }) {
  const isMobile = window.innerWidth <= 768
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '3rem 1rem',
      textAlign: 'center'
    }}>
      <div style={{
        width: '80px',
        height: '80px',
        background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%)',
        borderRadius: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '1.5rem',
        border: '1px solid rgba(239, 68, 68, 0.15)'
      }}>
        <Heart size={36} color="#ef4444" />
      </div>
      
      <h3 style={{
        fontSize: isMobile ? '1.125rem' : '1.25rem',
        fontWeight: '700',
        color: 'white',
        marginBottom: '0.5rem'
      }}>
        Nog geen favorieten
      </h3>
      
      <p style={{
        fontSize: isMobile ? '0.875rem' : '0.95rem',
        color: 'rgba(255, 255, 255, 0.5)',
        marginBottom: '2rem',
        maxWidth: '300px',
        lineHeight: 1.5
      }}>
        Begin met het toevoegen van favoriete maaltijden door op het hartje te klikken in je meal plan
      </p>
      
      <button
        onClick={onClose}
        style={{
          padding: isMobile ? '0.875rem 2rem' : '1rem 2.5rem',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          borderRadius: '12px',
          color: 'white',
          fontSize: isMobile ? '0.95rem' : '1rem',
          fontWeight: '700',
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '0 8px 32px rgba(16, 185, 129, 0.3)',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent'
        }}
      >
        Sluiten
      </button>
    </div>
  )
}

function SmartTab({ categories, meals, favorites, selectedMeal, onSelectMeal, onRemoveFavorite, isMobile }) {
  return (
    <div style={{ animation: 'slideUp 0.3s ease' }}>
      {/* Top Used Section */}
      {categories.topUsed.length > 0 && (
        <CategorySection
          title="Jouw Top 3"
          icon={TrendingUp}
          color="#10b981"
          description="Meest gekozen favorieten"
          items={categories.topUsed}
          meals={meals}
          selectedMeal={selectedMeal}
          onSelectMeal={onSelectMeal}
          onRemoveFavorite={onRemoveFavorite}
          isMobile={isMobile}
          showUsageCount={true}
        />
      )}
      
      {/* Time Relevant */}
      {categories.timeRelevant.length > 0 && (
        <CategorySection
          title="Perfect voor nu"
          icon={Clock}
          color="#fbbf24"
          description="Matches huidige tijd"
          items={categories.timeRelevant.slice(0, 4).map(meal => 
            favorites.find(f => f.meal_id === meal.id) || { meal_id: meal.id, meal_name: meal.name }
          )}
          meals={meals}
          selectedMeal={selectedMeal}
          onSelectMeal={onSelectMeal}
          onRemoveFavorite={onRemoveFavorite}
          isMobile={isMobile}
        />
      )}
      
      {/* Never Tried */}
      {categories.neverTried.length > 0 && (
        <CategorySection
          title="Nog niet geprobeerd"
          icon={Sparkles}
          color="#8b5cf6"
          description="Tijd voor iets nieuws?"
          items={categories.neverTried.slice(0, 4)}
          meals={meals}
          selectedMeal={selectedMeal}
          onSelectMeal={onSelectMeal}
          onRemoveFavorite={onRemoveFavorite}
          isMobile={isMobile}
          badge="NEW"
        />
      )}
      
      {/* Old Favorites */}
      {categories.oldFavorites.length > 0 && (
        <CategorySection
          title="Lang niet gehad"
          icon={Calendar}
          color="#ef4444"
          description="14+ dagen geleden"
          items={categories.oldFavorites.slice(0, 4)}
          meals={meals}
          selectedMeal={selectedMeal}
          onSelectMeal={onSelectMeal}
          onRemoveFavorite={onRemoveFavorite}
          isMobile={isMobile}
        />
      )}
    </div>
  )
}

function AllTab({ meals, favorites, selectedMeal, onSelectMeal, onRemoveFavorite, viewMode, setViewMode, isMobile }) {
  return (
    <div>
      {/* View Mode Toggle */}
      <div style={{
        display: 'flex',
        justifyContent: 'flex-end',
        marginBottom: '1rem'
      }}>
        <div style={{
          display: 'flex',
          gap: '0.25rem',
          background: 'rgba(17, 17, 17, 0.5)',
          padding: '0.25rem',
          borderRadius: '10px',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <button
            onClick={() => setViewMode('grid')}
            style={{
              padding: '0.5rem 0.875rem',
              background: viewMode === 'grid' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
              border: 'none',
              borderRadius: '8px',
              color: viewMode === 'grid' ? '#10b981' : 'rgba(255, 255, 255, 0.5)',
              fontSize: '0.825rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Grid
          </button>
          <button
            onClick={() => setViewMode('list')}
            style={{
              padding: '0.5rem 0.875rem',
              background: viewMode === 'list' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
              border: 'none',
              borderRadius: '8px',
              color: viewMode === 'list' ? '#10b981' : 'rgba(255, 255, 255, 0.5)',
              fontSize: '0.825rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            List
          </button>
        </div>
      </div>
      
      {/* Meals Display */}
      {viewMode === 'grid' ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: isMobile ? '0.75rem' : '1rem'
        }}>
          {meals.map(meal => {
            const favoriteData = favorites.find(f => f.meal_id === meal.id)
            return (
              <MealCard
                key={meal.id}
                meal={meal}
                favoriteData={favoriteData}
                isSelected={selectedMeal?.id === meal.id}
                onSelect={() => onSelectMeal(meal)}
                onRemove={() => onRemoveFavorite(meal.id)}
                isMobile={isMobile}
              />
            )
          })}
        </div>
      ) : (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}>
          {meals.map(meal => {
            const favoriteData = favorites.find(f => f.meal_id === meal.id)
            return (
              <MealListItem
                key={meal.id}
                meal={meal}
                favoriteData={favoriteData}
                isSelected={selectedMeal?.id === meal.id}
                onSelect={() => onSelectMeal(meal)}
                onRemove={() => onRemoveFavorite(meal.id)}
                isMobile={isMobile}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

// All other helper components remain the same
function CategorySection({ title, icon: Icon, color, description, items, meals, selectedMeal, onSelectMeal, onRemoveFavorite, isMobile, showUsageCount, badge }) {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.625rem',
        marginBottom: '0.875rem'
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          background: `linear-gradient(135deg, ${color}20 0%, ${color}10 100%)`,
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: `1px solid ${color}30`
        }}>
          <Icon size={18} color={color} />
        </div>
        <div>
          <h3 style={{
            fontSize: isMobile ? '0.95rem' : '1.05rem',
            fontWeight: '700',
            color: 'white',
            margin: 0
          }}>
            {title}
          </h3>
          <p style={{
            fontSize: isMobile ? '0.7rem' : '0.75rem',
            color: 'rgba(255, 255, 255, 0.4)',
            margin: 0
          }}>
            {description}
          </p>
        </div>
      </div>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: isMobile ? '0.625rem' : '0.75rem'
      }}>
        {items.map(item => {
          const meal = meals.find(m => m.id === item.meal_id)
          if (!meal) return null
          
          return (
            <CompactMealCard
              key={meal.id}
              meal={meal}
              favoriteData={item}
              isSelected={selectedMeal?.id === meal.id}
              onSelect={() => onSelectMeal(meal)}
              onRemove={() => onRemoveFavorite(meal.id)}
              showUsageCount={showUsageCount}
              badge={badge}
              isMobile={isMobile}
            />
          )
        })}
      </div>
    </div>
  )
}

function CompactMealCard({ meal, favoriteData, isSelected, onSelect, onRemove, showUsageCount, badge, isMobile }) {
  return (
    <div
      onClick={onSelect}
      style={{
        background: isSelected
          ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(16, 185, 129, 0.04) 100%)'
          : 'rgba(17, 17, 17, 0.5)',
        backdropFilter: 'blur(10px)',
        borderRadius: '14px',
        padding: isMobile ? '0.875rem' : '1rem',
        border: isSelected
          ? '2px solid rgba(16, 185, 129, 0.25)'
          : '1px solid rgba(255, 255, 255, 0.08)',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent'
      }}
    >
      {badge && (
        <div style={{
          position: 'absolute',
          top: '-8px',
          right: '8px',
          background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
          padding: '0.25rem 0.5rem',
          borderRadius: '6px',
          fontSize: '0.65rem',
          fontWeight: '700',
          color: 'white'
        }}>
          {badge}
        </div>
      )}
      
      {isSelected && (
        <div style={{
          position: 'absolute',
          top: '0.5rem',
          right: '0.5rem',
          width: '24px',
          height: '24px',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Check size={14} color="white" strokeWidth={3} />
        </div>
      )}
      
      <h4 style={{
        fontSize: isMobile ? '0.875rem' : '0.95rem',
        fontWeight: '600',
        color: isSelected ? '#10b981' : 'white',
        marginBottom: '0.5rem',
        paddingRight: isSelected ? '2rem' : 0
      }}>
        {meal.name}
      </h4>
      
      <div style={{
        display: 'flex',
        gap: '0.625rem',
        marginBottom: '0.375rem'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem'
        }}>
          <Flame size={12} color="#f59e0b" />
          <span style={{
            fontSize: '0.75rem',
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
            fontSize: '0.75rem',
            fontWeight: '600',
            color: '#8b5cf6'
          }}>
            {Math.round(meal.protein)}g
          </span>
        </div>
      </div>
      
      {showUsageCount && favoriteData?.times_selected > 0 && (
        <div style={{
          fontSize: '0.7rem',
          color: 'rgba(16, 185, 129, 0.7)',
          fontWeight: '600'
        }}>
          {favoriteData.times_selected}x gebruikt
        </div>
      )}
    </div>
  )
}

function MealCard({ meal, favoriteData, isSelected, onSelect, onRemove, isMobile }) {
  const getMealImage = () => {
    if (meal.image_url) return meal.image_url
    const type = meal.timing?.[0] || 'meal'
    const fallbacks = {
      breakfast: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400&h=250&fit=crop',
      lunch: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=250&fit=crop',
      dinner: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=250&fit=crop',
      snack: 'https://images.unsplash.com/photo-1490474504059-bf2db5ab2348?w=400&h=250&fit=crop',
      meal: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=250&fit=crop'
    }
    return fallbacks[type] || fallbacks.meal
  }
  
  return (
    <div
      onClick={onSelect}
      style={{
        background: isSelected
          ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(16, 185, 129, 0.04) 100%)'
          : 'rgba(17, 17, 17, 0.5)',
        backdropFilter: 'blur(10px)',
        borderRadius: '16px',
        overflow: 'hidden',
        border: isSelected
          ? '2px solid rgba(16, 185, 129, 0.25)'
          : '1px solid rgba(255, 255, 255, 0.08)',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative'
      }}
    >
      <div style={{
        height: isMobile ? '100px' : '120px',
        background: `linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.7) 100%), url(${getMealImage()}) center/cover`,
        position: 'relative'
      }}>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          style={{
            position: 'absolute',
            top: '0.5rem',
            right: '0.5rem',
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <X size={14} color="white" />
        </button>
        
        {favoriteData?.times_selected > 0 && (
          <div style={{
            position: 'absolute',
            bottom: '0.5rem',
            left: '0.5rem',
            background: 'rgba(16, 185, 129, 0.9)',
            padding: '0.25rem 0.5rem',
            borderRadius: '6px',
            fontSize: '0.7rem',
            fontWeight: '700',
            color: 'white'
          }}>
            {favoriteData.times_selected}x
          </div>
        )}
      </div>
      
      <div style={{
        padding: isMobile ? '0.75rem' : '0.875rem'
      }}>
        <h4 style={{
          fontSize: isMobile ? '0.875rem' : '0.95rem',
          fontWeight: '700',
          color: isSelected ? '#10b981' : 'white',
          marginBottom: '0.375rem'
        }}>
          {meal.name}
        </h4>
        
        <div style={{
          display: 'flex',
          gap: '0.75rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem'
          }}>
            <Flame size={12} color="#f59e0b" />
            <span style={{
              fontSize: '0.75rem',
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
              fontSize: '0.75rem',
              fontWeight: '600',
              color: '#8b5cf6'
            }}>
              {Math.round(meal.protein)}g
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function MealListItem({ meal, favoriteData, isSelected, onSelect, onRemove, isMobile }) {
  return (
    <div
      onClick={onSelect}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        padding: isMobile ? '0.875rem' : '1rem',
        background: isSelected
          ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(16, 185, 129, 0.04) 100%)'
          : 'rgba(17, 17, 17, 0.5)',
        borderRadius: '12px',
        border: isSelected
          ? '2px solid rgba(16, 185, 129, 0.25)'
          : '1px solid rgba(255, 255, 255, 0.08)',
        cursor: 'pointer',
        transition: 'all 0.2s ease'
      }}
    >
      <div style={{ flex: 1 }}>
        <h4 style={{
          fontSize: isMobile ? '0.9rem' : '0.95rem',
          fontWeight: '600',
          color: isSelected ? '#10b981' : 'white',
          marginBottom: '0.25rem'
        }}>
          {meal.name}
        </h4>
        <div style={{
          display: 'flex',
          gap: '1rem',
          fontSize: '0.75rem'
        }}>
          <span style={{ color: '#f59e0b' }}>
            {Math.round(meal.calories)} kcal
          </span>
          <span style={{ color: '#8b5cf6' }}>
            {Math.round(meal.protein)}g eiwit
          </span>
          <span style={{ color: '#ef4444' }}>
            {Math.round(meal.carbs)}g carbs
          </span>
          <span style={{ color: '#3b82f6' }}>
            {Math.round(meal.fat)}g fat
          </span>
        </div>
      </div>
      
      {favoriteData?.times_selected > 0 && (
        <div style={{
          padding: '0.375rem 0.625rem',
          background: 'rgba(16, 185, 129, 0.15)',
          borderRadius: '8px',
          fontSize: '0.75rem',
          fontWeight: '600',
          color: '#10b981'
        }}>
          {favoriteData.times_selected}x
        </div>
      )}
      
      <button
        onClick={(e) => {
          e.stopPropagation()
          onRemove()
        }}
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer'
        }}
      >
        <X size={16} color="#ef4444" />
      </button>
    </div>
  )
}

function StatsTab({ stats, favorites, meals, isMobile }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem'
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '0.75rem'
      }}>
        <StatCard
          label="Totaal Favorieten"
          value={stats.totalFavorites}
          icon={Heart}
          color="#ef4444"
        />
        <StatCard
          label="Keer Gebruikt"
          value={stats.totalSelections}
          icon={TrendingUp}
          color="#10b981"
        />
        <StatCard
          label="Gem. Calorieën"
          value={`${stats.avgCalories} kcal`}
          icon={Flame}
          color="#f59e0b"
        />
        <StatCard
          label="Gem. Eiwit"
          value={`${stats.avgProtein}g`}
          icon={Target}
          color="#8b5cf6"
        />
      </div>
      
      {stats.topCategory && (
        <div style={{
          background: 'rgba(17, 17, 17, 0.5)',
          borderRadius: '14px',
          padding: isMobile ? '1rem' : '1.25rem',
          border: '1px solid rgba(16, 185, 129, 0.08)'
        }}>
          <h4 style={{
            fontSize: isMobile ? '0.9rem' : '1rem',
            fontWeight: '600',
            color: 'rgba(255, 255, 255, 0.7)',
            marginBottom: '0.5rem'
          }}>
            Favoriete Categorie
          </h4>
          <div style={{
            fontSize: isMobile ? '1.25rem' : '1.5rem',
            fontWeight: '700',
            color: '#10b981',
            textTransform: 'capitalize'
          }}>
            {stats.topCategory[0]} ({stats.topCategory[1]} meals)
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div style={{
      background: 'rgba(17, 17, 17, 0.5)',
      borderRadius: '12px',
      padding: '1rem',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.375rem'
      }}>
        <Icon size={16} color={color} style={{ opacity: 0.7 }} />
        <span style={{
          fontSize: '0.75rem',
          color: 'rgba(255, 255, 255, 0.5)',
          fontWeight: '500'
        }}>
          {label}
        </span>
      </div>
      <div style={{
        fontSize: '1.25rem',
        fontWeight: '700',
        color: color
      }}>
        {value}
      </div>
    </div>
  )
}

function LoadingState() {
  return (
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
  )
}
