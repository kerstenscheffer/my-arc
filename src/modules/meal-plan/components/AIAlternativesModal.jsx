// src/modules/meal-plan/components/AIAlternativesModal.jsx
// 🎯 v2.0 - Clean swap modal with smart suggestions & compare
// Props IDENTIEK: { isOpen, onClose, currentMeal, onSelectMeal, db, service }
import React, { useState, useEffect } from 'react'
import { X, Search, Check, ArrowUp, ArrowDown, Minus, Star, Flame, Beef } from 'lucide-react'

export default function AIAlternativesModal({ 
  isOpen, 
  onClose, 
  currentMeal, 
  onSelectMeal,
  db,
  service
}) {
  const isMobile = window.innerWidth <= 768
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilter, setActiveFilter] = useState('smart')
  const [alternatives, setAlternatives] = useState([])
  const [favorites, setFavorites] = useState([])
  const [allMeals, setAllMeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedMeal, setSelectedMeal] = useState(null)

  const filters = [
    { id: 'smart', label: 'Beste match' },
    { id: 'similar-cal', label: 'Zelfde kcal' },
    { id: 'more-protein', label: 'Meer eiwit' },
    { id: 'less-cal', label: 'Minder kcal' },
    { id: 'favorites', label: 'Favorieten' },
    { id: 'all', label: 'Alles' }
  ]

  useEffect(() => {
    if (isOpen && currentMeal) {
      loadAlternatives()
    }
    return () => {
      setSelectedMeal(null)
      setSearchTerm('')
      setActiveFilter('smart')
    }
  }, [isOpen, currentMeal])

  const loadAlternatives = async () => {
    setLoading(true)
    try {
      const smartAlts = await service.getSmartAlternatives(
        currentMeal,
        currentMeal.slot || currentMeal.timeSlot
      )
      
      let favs = []
      try {
        const clientId = await db.getCurrentUser().then(u => u.id)
        favs = await service.getAIFavorites(clientId)
      } catch (e) { /* no favs */ }
      
      const { data: meals } = await db.supabase
        .from('ai_meals')
        .select('*')
        .limit(200)

      setAlternatives(smartAlts || [])
      setFavorites(favs || [])
      setAllMeals(meals || [])
    } catch (error) {
      console.error('Failed to load alternatives:', error)
    } finally {
      setLoading(false)
    }
  }

  const getFilteredMeals = () => {
    let meals = []
    const currentCal = currentMeal?.calories || 0
    const currentProt = currentMeal?.protein || 0

    switch (activeFilter) {
      case 'smart':
        meals = alternatives
        break
      case 'similar-cal':
        meals = [...allMeals]
          .filter(m => m.id !== currentMeal?.id && m.calories > 0)
          .sort((a, b) => Math.abs(a.calories - currentCal) - Math.abs(b.calories - currentCal))
          .slice(0, 30)
        break
      case 'more-protein':
        meals = [...allMeals]
          .filter(m => m.id !== currentMeal?.id && m.protein > currentProt)
          .sort((a, b) => b.protein - a.protein)
          .slice(0, 30)
        break
      case 'less-cal':
        meals = [...allMeals]
          .filter(m => m.id !== currentMeal?.id && m.calories > 0 && m.calories < currentCal)
          .sort((a, b) => b.calories - a.calories)
          .slice(0, 30)
        break
      case 'favorites':
        meals = favorites
          .map(fav => allMeals.find(m => m.id === fav.meal_id))
          .filter(Boolean)
        break
      case 'all':
        meals = allMeals.filter(m => m.id !== currentMeal?.id)
        break
      default:
        meals = alternatives
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      meals = meals.filter(m =>
        m.name?.toLowerCase().includes(term) ||
        m.name_en?.toLowerCase().includes(term)
      )
    }

    return meals
  }

  const getDiff = (newVal, oldVal) => {
    const diff = Math.round((newVal || 0) - (oldVal || 0))
    if (diff > 0) return { text: `+${diff}`, color: '#10b981', Icon: ArrowUp }
    if (diff < 0) return { text: `${diff}`, color: '#ef4444', Icon: ArrowDown }
    return { text: '0', color: 'rgba(255,255,255,0.3)', Icon: Minus }
  }

  const filteredMeals = getFilteredMeals()

  if (!isOpen) return null

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.9)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 10500,
        animation: 'altFadeIn 0.2s ease'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          maxWidth: isMobile ? '100%' : '600px',
          width: '100%',
          margin: '0 auto',
          background: '#0a0a0a',
          overflow: 'hidden'
        }}
      >
        {/* ── Header ── */}
        <div style={{
          padding: isMobile ? '0.75rem 1rem' : '1rem 1.5rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          flexShrink: 0
        }}>
          {/* Title row */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.75rem'
          }}>
            <div>
              <div style={{
                fontSize: isMobile ? '0.5rem' : '0.55rem',
                fontWeight: '700',
                color: 'rgba(255, 255, 255, 0.25)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '0.15rem'
              }}>
                Wissel maaltijd
              </div>
              <div style={{
                fontSize: isMobile ? '1rem' : '1.15rem',
                fontWeight: '800',
                color: '#fff',
                letterSpacing: '-0.02em'
              }}>
                {currentMeal?.name || currentMeal?.meal_name || 'Maaltijd'}
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                width: '36px',
                height: '36px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '10px',
                color: 'rgba(255, 255, 255, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Current meal macros */}
          <div style={{
            display: 'flex',
            gap: isMobile ? '1rem' : '1.5rem',
            marginBottom: '0.75rem'
          }}>
            {[
              { val: currentMeal?.calories, label: 'kcal' },
              { val: currentMeal?.protein, label: 'eiwit' },
              { val: currentMeal?.carbs, label: 'koolh' },
              { val: currentMeal?.fat, label: 'vet' }
            ].filter(m => m.val > 0).map(m => (
              <div key={m.label}>
                <span style={{
                  fontSize: isMobile ? '0.85rem' : '0.95rem',
                  fontWeight: '800',
                  color: '#fff'
                }}>
                  {Math.round(m.val)}
                </span>
                <span style={{
                  fontSize: isMobile ? '0.5rem' : '0.55rem',
                  fontWeight: '600',
                  color: 'rgba(255, 255, 255, 0.25)',
                  marginLeft: '0.15rem',
                  textTransform: 'uppercase'
                }}>
                  {m.label}
                </span>
              </div>
            ))}
          </div>

          {/* Search */}
          <div style={{ position: 'relative', marginBottom: '0.625rem' }}>
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'rgba(255, 255, 255, 0.2)'
              }}
            />
            <input
              type="text"
              placeholder="Zoek maaltijd..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.6rem 0.75rem 0.6rem 2.25rem',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '10px',
                color: 'white',
                fontSize: isMobile ? '0.8rem' : '0.85rem',
                outline: 'none',
                minHeight: '40px',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)'}
              onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)'}
            />
          </div>

          {/* Filter chips — horizontal scroll */}
          <div style={{
            display: 'flex',
            gap: '0.3rem',
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            paddingBottom: '0.25rem'
          }}>
            {filters.map(f => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id)}
                style={{
                  padding: '0.35rem 0.625rem',
                  background: activeFilter === f.id ? '#10b981' : 'transparent',
                  border: activeFilter === f.id
                    ? '1px solid rgba(16, 185, 129, 0.5)'
                    : '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '20px',
                  color: activeFilter === f.id ? '#fff' : 'rgba(255, 255, 255, 0.4)',
                  fontSize: isMobile ? '0.65rem' : '0.7rem',
                  fontWeight: activeFilter === f.id ? '800' : '600',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  transition: 'all 0.15s ease',
                  minHeight: '30px'
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Meal List ── */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch'
        }}>
          {loading ? (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              padding: '3rem',
              color: 'rgba(255, 255, 255, 0.2)'
            }}>
              <div style={{
                width: '32px', height: '32px',
                border: '2px solid rgba(255, 255, 255, 0.06)',
                borderTopColor: 'rgba(255, 255, 255, 0.3)',
                borderRadius: '50%',
                animation: 'altSpin 0.8s linear infinite'
              }} />
            </div>
          ) : filteredMeals.length > 0 ? (
            filteredMeals.map((meal, idx) => (
              <SwapMealRow
                key={meal.id || idx}
                meal={meal}
                currentMeal={currentMeal}
                isSelected={selectedMeal?.id === meal.id}
                onSelect={() => setSelectedMeal(selectedMeal?.id === meal.id ? null : meal)}
                isMobile={isMobile}
                getDiff={getDiff}
              />
            ))
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '3rem 1rem',
              color: 'rgba(255, 255, 255, 0.25)'
            }}>
              <div style={{ fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                Geen resultaten
              </div>
              <div style={{ fontSize: '0.7rem' }}>
                Probeer een ander filter of zoekterm
              </div>
            </div>
          )}
        </div>

        {/* ── Footer — compare & confirm ── */}
        {selectedMeal && (
          <div style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            flexShrink: 0
          }}>
            {/* Compare bar */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: isMobile ? '1rem' : '1.5rem',
              padding: '0.5rem 1rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.04)'
            }}>
              {[
                { label: 'kcal', diff: getDiff(selectedMeal.calories, currentMeal?.calories) },
                { label: 'eiwit', diff: getDiff(selectedMeal.protein, currentMeal?.protein) },
                { label: 'koolh', diff: getDiff(selectedMeal.carbs, currentMeal?.carbs) },
                { label: 'vet', diff: getDiff(selectedMeal.fat, currentMeal?.fat) }
              ].map(item => {
                const DiffIcon = item.diff.Icon
                return (
                  <div key={item.label} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.2rem'
                  }}>
                    <DiffIcon size={10} color={item.diff.color} />
                    <span style={{
                      fontSize: isMobile ? '0.65rem' : '0.7rem',
                      fontWeight: '800',
                      color: item.diff.color
                    }}>
                      {item.diff.text}
                    </span>
                    <span style={{
                      fontSize: isMobile ? '0.5rem' : '0.55rem',
                      fontWeight: '600',
                      color: 'rgba(255, 255, 255, 0.2)',
                      textTransform: 'uppercase'
                    }}>
                      {item.label}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex' }}>
              <button
                onClick={onClose}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  borderRight: '1px solid rgba(255, 255, 255, 0.04)',
                  borderRadius: 0,
                  padding: isMobile ? '0.75rem' : '0.875rem',
                  color: 'rgba(255, 255, 255, 0.4)',
                  fontSize: isMobile ? '0.75rem' : '0.8rem',
                  fontWeight: '700',
                  cursor: 'pointer',
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
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: 'none',
                  borderRadius: 0,
                  padding: isMobile ? '0.75rem' : '0.875rem',
                  color: '#10b981',
                  fontSize: isMobile ? '0.75rem' : '0.8rem',
                  fontWeight: '800',
                  cursor: 'pointer',
                  minHeight: '44px',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.35rem'
                }}
              >
                <Check size={15} strokeWidth={2.5} />
                Wissel hiermee
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes altFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes altSpin {
          to { transform: rotate(360deg); }
        }
        div::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  )
}

// ── Single meal row in the list ──
function SwapMealRow({ meal, currentMeal, isSelected, onSelect, isMobile, getDiff }) {
  const getMealImage = () => {
    if (meal.image_url) return meal.image_url
    const fallbacks = {
      breakfast: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=200&h=200&fit=crop&q=80',
      lunch: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=200&h=200&fit=crop&q=80',
      dinner: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=200&h=200&fit=crop&q=80',
      snack: 'https://images.unsplash.com/photo-1490474504059-bf2db5ab2348?w=200&h=200&fit=crop&q=80'
    }
    const type = meal.timing?.[0] || 'lunch'
    return fallbacks[type] || fallbacks.lunch
  }

  const calDiff = getDiff(meal.calories, currentMeal?.calories)
  const protDiff = getDiff(meal.protein, currentMeal?.protein)

  return (
    <div
      onClick={onSelect}
      style={{
        display: 'flex',
        alignItems: 'center',
        borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
        background: isSelected ? 'rgba(16, 185, 129, 0.06)' : 'transparent',
        cursor: 'pointer',
        transition: 'background 0.15s ease',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent'
      }}
    >
      {/* Photo */}
      <div style={{
        width: isMobile ? '56px' : '64px',
        height: isMobile ? '56px' : '64px',
        flexShrink: 0,
        background: `url(${getMealImage()}) center/cover`,
        position: 'relative'
      }}>
        {isSelected && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(16, 185, 129, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Check size={20} color="white" strokeWidth={3} />
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{
        flex: 1,
        minWidth: 0,
        width: 0,
        padding: isMobile ? '0.5rem 0.625rem' : '0.625rem 0.75rem',
        overflow: 'hidden'
      }}>
        {/* Name */}
        <div style={{
          fontSize: isMobile ? '0.8rem' : '0.85rem',
          fontWeight: '700',
          color: isSelected ? '#fff' : 'rgba(255, 255, 255, 0.85)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          letterSpacing: '-0.01em',
          marginBottom: '0.2rem'
        }}>
          {meal.name}
        </div>

        {/* Macros + diff indicators */}
        <div style={{
          display: 'flex',
          gap: isMobile ? '0.625rem' : '0.75rem',
          alignItems: 'center'
        }}>
          {/* Calories */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.1rem' }}>
            <span style={{
              fontSize: isMobile ? '0.7rem' : '0.75rem',
              fontWeight: '800',
              color: 'rgba(255, 255, 255, 0.5)'
            }}>
              {Math.round(meal.calories)}
            </span>
            <span style={{
              fontSize: '0.45rem',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.2)',
              textTransform: 'uppercase'
            }}>
              kcal
            </span>
          </div>

          {/* Protein */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.1rem' }}>
            <span style={{
              fontSize: isMobile ? '0.7rem' : '0.75rem',
              fontWeight: '800',
              color: 'rgba(255, 255, 255, 0.5)'
            }}>
              {Math.round(meal.protein)}
            </span>
            <span style={{
              fontSize: '0.45rem',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.2)',
              textTransform: 'uppercase'
            }}>
              eiwit
            </span>
          </div>

          {/* Diff badges */}
          <div style={{
            display: 'flex',
            gap: '0.3rem',
            marginLeft: 'auto'
          }}>
            <DiffBadge diff={calDiff} label="kcal" isMobile={isMobile} />
            <DiffBadge diff={protDiff} label="E" isMobile={isMobile} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Tiny diff badge ──
function DiffBadge({ diff, label, isMobile }) {
  const DiffIcon = diff.Icon
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.1rem',
      padding: '0.15rem 0.3rem',
      background: `${diff.color}10`,
      borderRadius: '4px',
      flexShrink: 0
    }}>
      <DiffIcon size={8} color={diff.color} />
      <span style={{
        fontSize: isMobile ? '0.5rem' : '0.55rem',
        fontWeight: '800',
        color: diff.color
      }}>
        {diff.text}
      </span>
    </div>
  )
}
