// src/modules/client-meal-base/components/CustomMealsGrid.jsx
import CustomMealCard from './CustomMealCard'

export default function CustomMealsGrid({ meals, onEdit, onDelete, isMobile }) {
  if (meals.length === 0) {
    return (
      <div style={{
        padding: isMobile ? '2rem 1rem' : '3rem 1.5rem',
        textAlign: 'center'
      }}>
        <div style={{
          width: isMobile ? '80px' : '100px',
          height: isMobile ? '80px' : '100px',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%)',
          borderRadius: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem',
          border: '1px solid rgba(16, 185, 129, 0.3)'
        }}>
          <span style={{ fontSize: isMobile ? '2.5rem' : '3rem' }}>🍽️</span>
        </div>
        
        <h3 style={{
          fontSize: isMobile ? '1.25rem' : '1.5rem',
          fontWeight: '700',
          color: '#fff',
          marginBottom: '0.75rem'
        }}>
          Nog geen custom meals
        </h3>
        
        <p style={{
          fontSize: isMobile ? '0.95rem' : '1rem',
          color: 'rgba(255, 255, 255, 0.6)',
          lineHeight: 1.5,
          maxWidth: '400px',
          margin: '0 auto'
        }}>
          Maak je eerste meal met de + knop rechtsonder. Scan barcodes of voeg handmatig ingrediënten toe!
        </p>
      </div>
    )
  }
  
  return (
    <div style={{
      padding: isMobile ? '0 1rem 2rem' : '0 1.5rem 2rem'
    }}>
      {/* Section Title */}
      <h2 style={{
        fontSize: isMobile ? '1.125rem' : '1.25rem',
        fontWeight: '700',
        color: '#fff',
        marginBottom: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        🍳 Mijn Custom Meals
        <span style={{
          fontSize: isMobile ? '0.75rem' : '0.8rem',
          fontWeight: '500',
          color: 'rgba(255, 255, 255, 0.5)',
          background: 'rgba(16, 185, 129, 0.2)',
          padding: '0.25rem 0.5rem',
          borderRadius: '6px'
        }}>
          {meals.length}
        </span>
      </h2>
      
      {/* Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
        gap: isMobile ? '0.75rem' : '1rem'
      }}>
        {meals.map(meal => (
          <CustomMealCard
            key={meal.id}
            meal={meal}
            onEdit={() => onEdit(meal)}
            onDelete={() => onDelete(meal.id)}
            isMobile={isMobile}
          />
        ))}
      </div>
    </div>
  )
}
