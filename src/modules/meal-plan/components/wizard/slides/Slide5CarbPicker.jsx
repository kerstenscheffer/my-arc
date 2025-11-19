// src/modules/meal-plan/components/wizard/slides/Slide5CarbPicker.jsx
// ULTRA COMPACT - Wheat icon, exact priority matching, compact design, image support

import { useState, useEffect } from 'react'
import { Wheat } from 'lucide-react'
import CoachBubble from '../shared/CoachBubble'
import IngredientGrid from '../pickers/IngredientGrid'

// TOP PRIORITY CARBS - EXACT MATCHES ONLY, in correct priority order
const TOP_CARBS = [
  'Havermout',
  'Basmati Rijst',
  'Bruine Rijst',
  'Volkoren Pasta',
  'Pasta',
  'Aardappel',
  'Zoete Aardappel',
  'Quinoa',
  'Volkoren Brood',
  'Couscous Volkoren',
  'Wrap',
  'Crackers'
]

export default function Slide5CarbPicker({ 
  wizardData, 
  onUpdate, 
  db,
  isMobile 
}) {
  const [carbs, setCarbs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isPlaying, setIsPlaying] = useState(false)
  const videoId = 'BfNXovwbfgc'

  useEffect(() => {
    loadCarbs()
  }, [])

  const loadCarbs = async () => {
    try {
      console.log('🍚 Loading carbs from database...')
      
      const { data, error } = await db.supabase
        .from('ai_ingredients')
        .select('*')
        .gte('carbs_per_100g', 20)
        .order('carbs_per_100g', { ascending: false })

      if (error) throw error

      // Filter carb-focused (carbs > protein ratio)
      const carbFocused = data.filter(item => {
        const carbRatio = item.carbs_per_100g / Math.max(item.protein_per_100g || 1, 1)
        return carbRatio > 1.5
      })

      // Sort: TOP_CARBS first (by exact index position), then by carbs content
      const sortedData = carbFocused.sort((a, b) => {
        const aIndex = TOP_CARBS.indexOf(a.name)
        const bIndex = TOP_CARBS.indexOf(b.name)
        
        const aIsTop = aIndex !== -1
        const bIsTop = bIndex !== -1
        
        // Both are top priority → sort by their index in TOP_CARBS
        if (aIsTop && bIsTop) {
          return aIndex - bIndex
        }
        
        // Only a is top → a comes first
        if (aIsTop && !bIsTop) return -1
        
        // Only b is top → b comes first
        if (!aIsTop && bIsTop) return 1
        
        // Neither is top → sort by carbs content
        return b.carbs_per_100g - a.carbs_per_100g
      })

      const enrichedData = sortedData.map(item => ({
        ...item,
        isPopular: TOP_CARBS.includes(item.name)
      }))

      console.log(`✅ Loaded ${enrichedData.length} carbs (${enrichedData.filter(c => c.isPopular).length} top priority)`)
      setCarbs(enrichedData)
    } catch (error) {
      console.error('❌ Load carbs failed:', error)
      setCarbs([])
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = (ingredient) => {
    const currentSelected = wizardData.selectedCarbs || []
    const ingredientId = ingredient.id || ingredient
    
    const isSelected = currentSelected.some(
      selected => (selected.id || selected) === ingredientId
    )

    let newSelection
    if (isSelected) {
      newSelection = currentSelected.filter(
        selected => (selected.id || selected) !== ingredientId
      )
      console.log(`➖ Removed carb: ${ingredient.name || ingredientId}`)
    } else {
      if (currentSelected.length >= 3) {
        console.log('⚠️ Max 3 carbs allowed')
        return
      }
      
      const carbObject = {
        id: ingredient.id,
        name: ingredient.name,
        category: ingredient.category || 'carbs',
        carbs_per_100g: ingredient.carbs_per_100g
      }
      
      newSelection = [...currentSelected, carbObject]
      console.log(`➕ Added carb:`, carbObject)
    }

    onUpdate('selectedCarbs', newSelection)
  }

  if (loading) {
    return (
      <div style={{
        padding: isMobile ? '2rem 1rem' : '3rem 1.5rem',
        textAlign: 'center'
      }}>
        <div style={{ 
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1rem',
          animation: 'spin 1s linear infinite'
        }}>
          <Wheat size={isMobile ? 40 : 48} color="#f59e0b" />
        </div>
        <div style={{ 
          color: 'rgba(255, 255, 255, 0.7)',
          fontSize: isMobile ? '0.95rem' : '1.05rem',
          fontWeight: '600'
        }}>
          Koolhydraten laden...
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div style={{
      width: '100%',
      padding: '0'
    }}>
      {/* Header - COMPACT */}
      <div style={{
        textAlign: 'center',
        marginBottom: isMobile ? '1rem' : '1.25rem',
        padding: isMobile ? '0 0.75rem' : '0 1rem'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: isMobile ? '48px' : '56px',
          height: isMobile ? '48px' : '56px',
          borderRadius: '12px',
          background: 'rgba(245, 158, 11, 0.15)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          marginBottom: '0.75rem',
          boxShadow: '0 0 16px rgba(245, 158, 11, 0.3)'
        }}>
          <Wheat 
            size={isMobile ? 24 : 28} 
            color="#f59e0b"
            strokeWidth={2.5}
            style={{ filter: 'drop-shadow(0 0 6px rgba(245, 158, 11, 0.6))' }}
          />
        </div>
        
        <h1 style={{
          fontSize: isMobile ? '1.375rem' : '1.75rem',
          fontWeight: '900',
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          margin: '0 0 0.5rem 0',
          lineHeight: '1.2',
          letterSpacing: '-0.02em'
        }}>
          Kies 3 favoriete koolhydraten
        </h1>
        
        <p style={{
          fontSize: isMobile ? '0.85rem' : '0.95rem',
          color: 'rgba(255, 255, 255, 0.7)',
          margin: 0,
          fontWeight: '500'
        }}>
          Voor energie en herstel
        </p>
      </div>

      {/* Video Container - Orange Glassmorphic */}
      <div style={{
        position: 'relative',
        marginBottom: isMobile ? '1.25rem' : '1.5rem',
        padding: isMobile ? '0 0.5rem' : '0'
      }}>
        <div style={{
          position: 'relative',
          width: '100%',
          paddingBottom: '56.25%',
          borderRadius: isMobile ? '12px' : '14px',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.8) 0%, rgba(23, 23, 23, 0.6) 100%)',
          backdropFilter: 'blur(12px)',
          border: '2px solid rgba(245, 158, 11, 0.3)',
          boxShadow: '0 6px 24px rgba(245, 158, 11, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
        }}>
          {/* Top accent line */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)',
            opacity: 0.6,
            zIndex: 2
          }} />
          
          {/* Shine overlay */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '40%',
            background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.06) 0%, transparent 100%)',
            pointerEvents: 'none',
            zIndex: 1
          }} />
          
          {!isPlaying ? (
            <>
              <img
                src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
                alt="Carb Picker Tutorial"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
                onError={(e) => {
                  e.target.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
                }}
              />
              
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.3)'
              }} />
              
              <button
                onClick={() => setIsPlaying(true)}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: isMobile ? '64px' : '80px',
                  height: isMobile ? '64px' : '80px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  border: '3px solid rgba(255, 255, 255, 0.2)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 32px rgba(245, 158, 11, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  zIndex: 3
                }}
                onMouseEnter={(e) => {
                  if (!isMobile) {
                    e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.1)'
                    e.currentTarget.style.boxShadow = '0 12px 40px rgba(245, 158, 11, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isMobile) {
                    e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)'
                    e.currentTarget.style.boxShadow = '0 8px 32px rgba(245, 158, 11, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                  }
                }}
                onTouchStart={(e) => {
                  if (isMobile) {
                    e.currentTarget.style.transform = 'translate(-50%, -50%) scale(0.95)'
                  }
                }}
                onTouchEnd={(e) => {
                  if (isMobile) {
                    e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)'
                  }
                }}
              >
                <div style={{
                  width: 0,
                  height: 0,
                  borderLeft: isMobile ? '20px solid #000' : '26px solid #000',
                  borderTop: isMobile ? '12px solid transparent' : '16px solid transparent',
                  borderBottom: isMobile ? '12px solid transparent' : '16px solid transparent',
                  marginLeft: isMobile ? '5px' : '6px',
                  filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))'
                }} />
              </button>
            </>
          ) : (
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                border: 'none'
              }}
              title="Carb Picker Tutorial"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          )}
        </div>
        
        {/* Coach Bubble BELOW video */}
        <div style={{
          position: 'relative',
          marginTop: isMobile ? '-1.25rem' : '-1.5rem',
          paddingTop: '0.5rem',
          zIndex: 4
        }}>
          <CoachBubble 
            message="Kies koolhydraten die je energie geven. Deze krijgen prioriteit in je plan!"
            variant="default"
          />
        </div>
      </div>

      {/* Selection Counter - COMPACT */}
      <div style={{
        position: 'relative',
        padding: isMobile ? '0.75rem 1rem' : '0.875rem 1.25rem',
        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.08) 100%)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(245, 158, 11, 0.3)',
        borderRadius: isMobile ? '10px' : '12px',
        marginBottom: isMobile ? '0.875rem' : '1rem',
        margin: isMobile ? '0 0.5rem 0.875rem' : '0 0 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 4px 16px rgba(245, 158, 11, 0.15)',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)',
          opacity: 0.6
        }} />
        
        <div style={{
          position: 'relative',
          zIndex: 1,
          fontSize: isMobile ? '0.875rem' : '0.95rem',
          color: '#fff',
          fontWeight: '700',
          letterSpacing: '-0.01em'
        }}>
          Geselecteerd
        </div>
        <div style={{
          position: 'relative',
          zIndex: 1,
          fontSize: isMobile ? '1.375rem' : '1.5rem',
          fontWeight: '900',
          color: wizardData.selectedCarbs?.length === 3 ? '#10b981' : '#f59e0b',
          letterSpacing: '-0.02em',
          filter: wizardData.selectedCarbs?.length === 3 
            ? 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.6))'
            : 'drop-shadow(0 0 6px rgba(245, 158, 11, 0.6))'
        }}>
          {wizardData.selectedCarbs?.length || 0}/3
        </div>
      </div>

      {/* Search Bar - COMPACT */}
      <div style={{
        marginBottom: isMobile ? '0.875rem' : '1rem',
        padding: isMobile ? '0 0.5rem' : '0'
      }}>
        <input
          type="text"
          placeholder="🔍 Zoek koolhydraten..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: isMobile ? '0.75rem 1rem' : '0.875rem 1.125rem',
            background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.8) 0%, rgba(23, 23, 23, 0.6) 100%)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(245, 158, 11, 0.2)',
            borderRadius: isMobile ? '10px' : '12px',
            color: '#fff',
            fontSize: isMobile ? '0.875rem' : '0.95rem',
            fontWeight: '500',
            outline: 'none',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 2px 8px rgba(245, 158, 11, 0.1)',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent'
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.5)'
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(23, 23, 23, 0.95) 0%, rgba(23, 23, 23, 0.8) 100%)'
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(245, 158, 11, 0.25)'
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.2)'
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(23, 23, 23, 0.8) 0%, rgba(23, 23, 23, 0.6) 100%)'
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(245, 158, 11, 0.1)'
          }}
        />
      </div>

      {/* Ingredient Grid */}
      <div style={{
        padding: isMobile ? '0 0.5rem' : '0'
      }}>
        <IngredientGrid
          ingredients={carbs}
          selectedIngredients={wizardData.selectedCarbs || []}
          onSelect={handleToggle}
          maxSelection={3}
          searchTerm={searchTerm}
          isMobile={isMobile}
        />
      </div>
    </div>
  )
}
