// src/modules/meal-plan/components/wizard/pickers/MealGrid.jsx
// Reusable meal grid component met popular indicator

export default function MealGrid({
  meals,
  selectedMeals,
  onSelect,
  maxSelection,
  searchTerm,
  isMobile
}) {
  // Filter meals based on search
  const filteredMeals = meals.filter(meal =>
    meal.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Check if meal is selected
  const isSelected = (meal) => {
    return selectedMeals.some(
      selected => (selected.id || selected) === meal.id
    )
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
      gap: isMobile ? '0.625rem' : '0.875rem'
    }}>
      {filteredMeals.map(meal => {
        const selected = isSelected(meal)
        const atMaxSelection = selectedMeals.length >= maxSelection && !selected

        return (
          <button
            key={meal.id}
            onClick={() => !atMaxSelection && onSelect(meal)}
            disabled={atMaxSelection}
            style={{
              padding: isMobile ? '0.875rem' : '1rem',
              background: selected 
                ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.2) 100%)'
                : 'rgba(17, 17, 17, 0.6)',
              border: selected 
                ? '2px solid #10b981' 
                : '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: isMobile ? '10px' : '12px',
              cursor: atMaxSelection ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              opacity: atMaxSelection ? 0.5 : 1,
              position: 'relative',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              textAlign: 'left'
            }}
            onMouseEnter={(e) => {
              if (!isMobile && !atMaxSelection) {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.borderColor = selected ? '#10b981' : 'rgba(16, 185, 129, 0.4)'
              }
            }}
            onMouseLeave={(e) => {
              if (!isMobile) {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.borderColor = selected ? '#10b981' : 'rgba(255, 255, 255, 0.1)'
              }
            }}
            onTouchStart={(e) => {
              if (isMobile && !atMaxSelection) {
                e.currentTarget.style.transform = 'scale(0.98)'
              }
            }}
            onTouchEnd={(e) => {
              if (isMobile) {
                e.currentTarget.style.transform = 'scale(1)'
              }
            }}
          >
            {/* Popular Badge */}
            {meal.isPopular && (
              <div style={{
                position: 'absolute',
                top: isMobile ? '0.5rem' : '0.625rem',
                right: isMobile ? '0.5rem' : '0.625rem',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#000',
                fontSize: isMobile ? '0.65rem' : '0.7rem',
                fontWeight: '800',
                padding: isMobile ? '0.25rem 0.5rem' : '0.3rem 0.55rem',
                borderRadius: isMobile ? '6px' : '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                TOP
              </div>
            )}

            {/* Meal Name */}
            <div style={{
              fontSize: isMobile ? '0.875rem' : '0.95rem',
              fontWeight: '700',
              color: '#fff',
              marginBottom: '0.375rem',
              lineHeight: '1.3',
              paddingRight: meal.isPopular ? '2.5rem' : '0'
            }}>
              {meal.name}
            </div>

            {/* Macros */}
            <div style={{
              display: 'flex',
              gap: isMobile ? '0.375rem' : '0.5rem',
              fontSize: isMobile ? '0.7rem' : '0.75rem',
              color: 'rgba(255, 255, 255, 0.6)',
              marginTop: '0.25rem'
            }}>
              <span>🥩 {meal.protein}g</span>
              <span>🍚 {meal.carbs}g</span>
              <span>🥑 {meal.fats}g</span>
            </div>

            {/* Selected Indicator */}
            {selected && (
              <div style={{
                position: 'absolute',
                top: isMobile ? '0.5rem' : '0.625rem',
                left: isMobile ? '0.5rem' : '0.625rem',
                width: isMobile ? '20px' : '24px',
                height: isMobile ? '20px' : '24px',
                background: '#10b981',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: isMobile ? '0.7rem' : '0.8rem'
              }}>
                ✓
              </div>
            )}
          </button>
        )
      })}

      {filteredMeals.length === 0 && (
        <div style={{
          gridColumn: '1 / -1',
          textAlign: 'center',
          padding: isMobile ? '2rem 1rem' : '3rem',
          color: 'rgba(255, 255, 255, 0.5)',
          fontSize: isMobile ? '0.9rem' : '0.95rem'
        }}>
          Geen meal preps gevonden voor "{searchTerm}"
        </div>
      )}
    </div>
  )
}
