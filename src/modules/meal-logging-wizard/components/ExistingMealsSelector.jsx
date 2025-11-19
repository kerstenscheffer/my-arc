import { useState, useEffect } from 'react'
import { Search, X, Filter } from 'lucide-react'

export default function ExistingMealsSelector({ db, client, customMeals, onMealSelect, onBack }) {
  const [aiMeals, setAiMeals] = useState([])
  const [allMeals, setAllMeals] = useState([])
  const [filteredMeals, setFilteredMeals] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [loading, setLoading] = useState(true)

  const isMobile = window.innerWidth <= 768

  useEffect(() => {
    loadAIMeals()
  }, [])

  useEffect(() => {
    // Combine custom meals and AI meals
    const combined = [...customMeals, ...aiMeals]
    setAllMeals(combined)
    setFilteredMeals(combined)
  }, [customMeals, aiMeals])

  useEffect(() => {
    filterMeals()
  }, [searchTerm, selectedCategory, allMeals])

  const loadAIMeals = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await db.supabase
        .from('ai_meals')
        .select('*')
        .order('name')
      
      if (error) throw error
      
      console.log('✅ [ExistingMealsSelector] AI meals loaded:', data?.length || 0)
      setAiMeals(data || [])
      setLoading(false)
      
    } catch (error) {
      console.error('❌ [ExistingMealsSelector] Error loading AI meals:', error)
      setLoading(false)
    }
  }

  const filterMeals = () => {
    let filtered = [...allMeals]

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(meal => 
        meal.name?.toLowerCase().includes(term)
      )
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(meal => {
        const labels = Array.isArray(meal.labels) ? meal.labels : []
        return labels.includes(selectedCategory)
      })
    }

    setFilteredMeals(filtered)
  }

  const categories = [
    { id: 'all', label: 'Alles' },
    { id: 'high_protein', label: 'Hoog eiwit' },
    { id: 'low_carb', label: 'Laag koolhydraat' },
    { id: 'vegetarian', label: 'Vegetarisch' },
    { id: 'quick', label: 'Snel' }
  ]

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#0a0a0a'
    }}>
      {/* Header */}
      <div style={{
        padding: isMobile ? '1rem' : '1.5rem',
        borderBottom: '1px solid rgba(16, 185, 129, 0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <h2 style={{
          fontSize: isMobile ? '1.2rem' : '1.5rem',
          fontWeight: '700',
          color: '#10b981',
          margin: 0
        }}>
          Kies een gerecht
        </h2>
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            color: '#666',
            cursor: 'pointer',
            padding: '0.5rem',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            minHeight: '44px',
            minWidth: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <X size={isMobile ? 20 : 24} />
        </button>
      </div>

      {/* Search Bar */}
      <div style={{
        padding: isMobile ? '1rem' : '1.5rem',
        borderBottom: '1px solid rgba(16, 185, 129, 0.2)'
      }}>
        <div style={{
          position: 'relative'
        }}>
          <Search
            size={isMobile ? 18 : 20}
            style={{
              position: 'absolute',
              left: isMobile ? '12px' : '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#666'
            }}
          />
          <input
            type="text"
            placeholder="Zoek gerecht..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: isMobile ? '0.75rem 0.75rem 0.75rem 2.5rem' : '0.875rem 1rem 0.875rem 3rem',
              background: '#111',
              border: '1px solid #333',
              borderRadius: isMobile ? '12px' : '16px',
              color: '#fff',
              fontSize: isMobile ? '0.95rem' : '1rem',
              outline: 'none',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '44px'
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#10b981'
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)'
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#333'
              e.currentTarget.style.boxShadow = 'none'
            }}
          />
        </div>
      </div>

      {/* Category Filters */}
      <div style={{
        padding: isMobile ? '0.75rem 1rem' : '1rem 1.5rem',
        borderBottom: '1px solid rgba(16, 185, 129, 0.2)',
        overflowX: 'auto',
        whiteSpace: 'nowrap',
        WebkitOverflowScrolling: 'touch'
      }}>
        <div style={{
          display: 'inline-flex',
          gap: isMobile ? '0.5rem' : '0.75rem'
        }}>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                padding: isMobile ? '0.5rem 1rem' : '0.625rem 1.25rem',
                background: selectedCategory === cat.id ? '#10b981' : '#111',
                color: selectedCategory === cat.id ? '#000' : '#fff',
                border: `1px solid ${selectedCategory === cat.id ? '#10b981' : '#333'}`,
                borderRadius: isMobile ? '10px' : '12px',
                fontSize: isMobile ? '0.875rem' : '0.95rem',
                fontWeight: selectedCategory === cat.id ? '600' : '500',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                minHeight: '44px',
                whiteSpace: 'nowrap'
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
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results Count */}
      <div style={{
        padding: isMobile ? '0.75rem 1rem' : '1rem 1.5rem',
        fontSize: isMobile ? '0.875rem' : '0.95rem',
        color: '#666'
      }}>
        {filteredMeals.length} gerecht{filteredMeals.length !== 1 ? 'en' : ''} gevonden
        {customMeals.length > 0 && (
          <span style={{ color: '#10b981', marginLeft: '0.5rem' }}>
            ({customMeals.length} eigen gerecht{customMeals.length !== 1 ? 'en' : ''})
          </span>
        )}
      </div>

      {/* Meals Grid */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: isMobile ? '0.5rem 1rem 1rem' : '1rem 1.5rem 1.5rem'
      }}>
        {loading ? (
          <div style={{
            textAlign: 'center',
            padding: isMobile ? '2rem 1rem' : '3rem 2rem',
            color: '#666'
          }}>
            Laden...
          </div>
        ) : filteredMeals.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: isMobile ? '2rem 1rem' : '3rem 2rem',
            color: '#666'
          }}>
            <div style={{
              fontSize: isMobile ? '2rem' : '3rem',
              marginBottom: '1rem'
            }}>
              🔍
            </div>
            <div style={{
              fontSize: isMobile ? '1rem' : '1.2rem',
              marginBottom: '0.5rem'
            }}>
              Geen gerechten gevonden
            </div>
            <div style={{
              fontSize: isMobile ? '0.875rem' : '0.95rem'
            }}>
              Probeer een andere zoekopdracht
            </div>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
            gap: isMobile ? '0.75rem' : '1rem'
          }}>
            {filteredMeals.map(meal => (
              <button
                key={meal.id}
                onClick={() => onMealSelect(meal)}
                style={{
                  padding: isMobile ? '1rem' : '1.25rem',
                  background: '#111',
                  border: '1px solid #333',
                  borderRadius: isMobile ? '12px' : '16px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  minHeight: '44px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#10b981'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#333'
                  e.currentTarget.style.transform = 'translateY(0)'
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
                <div style={{
                  fontSize: isMobile ? '0.95rem' : '1.05rem',
                  fontWeight: '600',
                  color: '#fff',
                  marginBottom: isMobile ? '0.5rem' : '0.75rem',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {meal.name}
                </div>
                <div style={{
                  display: 'flex',
                  gap: isMobile ? '0.5rem' : '0.75rem',
                  flexWrap: 'wrap',
                  fontSize: isMobile ? '0.8rem' : '0.875rem',
                  color: '#666'
                }}>
                  <span>{meal.calories || 0} kcal</span>
                  <span style={{ color: '#10b981' }}>{meal.protein || 0}g eiwit</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
