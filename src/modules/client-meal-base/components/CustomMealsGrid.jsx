// src/modules/client-meal-base/components/CustomMealsGrid.jsx
import CustomMealCard from './CustomMealCard'

export default function CustomMealsGrid({ meals, onEdit, onDelete, isMobile }) {
  if (meals.length === 0) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        padding: isMobile ? '2rem 0' : '3rem 0'
      }}>
        <div style={{
          maxWidth: '450px',
          width: '100%',
          textAlign: 'center',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.04) 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          borderRadius: isMobile ? '16px' : '20px',
          padding: isMobile ? '2.5rem 1.5rem' : '3rem 2rem',
          boxShadow: '0 8px 24px rgba(16, 185, 129, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Top gradient overlay */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '50%',
            background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.04) 0%, transparent 100%)',
            pointerEvents: 'none'
          }} />
          
          {/* Premium Icon Container */}
          <div style={{
            width: isMobile ? '80px' : '100px',
            height: isMobile ? '80px' : '100px',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(5, 150, 105, 0.15) 100%)',
            borderRadius: isMobile ? '18px' : '22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
            border: '2px solid rgba(16, 185, 129, 0.35)',
            boxShadow: '0 8px 24px rgba(16, 185, 129, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            position: 'relative',
            zIndex: 1
          }}>
            <span style={{ 
              fontSize: isMobile ? '2.5rem' : '3rem',
              filter: 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3))'
            }}>
              🍽️
            </span>
          </div>
          
          {/* Title */}
          <h3 style={{
            fontSize: isMobile ? '1.25rem' : '1.5rem',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: isMobile ? '0.75rem' : '1rem',
            letterSpacing: '-0.02em',
            position: 'relative',
            zIndex: 1
          }}>
            Nog geen custom meals
          </h3>
          
          {/* Description */}
          <p style={{
            fontSize: isMobile ? '0.9rem' : '1rem',
            color: 'rgba(255, 255, 255, 0.7)',
            lineHeight: 1.6,
            maxWidth: '380px',
            margin: '0 auto',
            fontWeight: '500',
            position: 'relative',
            zIndex: 1
          }}>
            Maak je eerste meal met de <span style={{ 
              color: '#10b981', 
              fontWeight: '700',
              textShadow: '0 0 8px rgba(16, 185, 129, 0.3)'
            }}>+</span> knop rechtsonder. Scan barcodes of voeg handmatig ingrediënten toe!
          </p>
        </div>
      </div>
    )
  }
  
  return (
    <>
      {/* Premium Section Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: isMobile ? '1rem' : '1.25rem',
        padding: isMobile ? '0.875rem 1rem' : '1rem 1.25rem',
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)',
        border: '1px solid rgba(16, 185, 129, 0.2)',
        borderRadius: '12px',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 2px 8px rgba(16, 185, 129, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Top gradient overlay */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '50%',
          background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.04) 0%, transparent 100%)',
          pointerEvents: 'none'
        }} />
        
        {/* Title */}
        <h2 style={{
          fontSize: isMobile ? '1.125rem' : '1.25rem',
          fontWeight: '700',
          color: '#fff',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? '0.5rem' : '0.625rem',
          position: 'relative',
          zIndex: 1
        }}>
          <span style={{
            fontSize: isMobile ? '1.25rem' : '1.5rem',
            filter: 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.4))'
          }}>
            🍳
          </span>
          Mijn Custom Meals
        </h2>
        
        {/* Premium Count Badge */}
        <div style={{
          padding: isMobile ? '0.375rem 0.75rem' : '0.5rem 0.875rem',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(5, 150, 105, 0.15) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.35)',
          borderRadius: '8px',
          fontSize: isMobile ? '0.875rem' : '0.95rem',
          fontWeight: '700',
          color: '#10b981',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 2px 8px rgba(16, 185, 129, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          textShadow: '0 0 8px rgba(16, 185, 129, 0.3)',
          letterSpacing: '0.02em',
          minWidth: isMobile ? '36px' : '42px',
          textAlign: 'center',
          position: 'relative',
          zIndex: 1
        }}>
          {meals.length}
        </div>
      </div>
      
      {/* Premium Grid */}
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
    </>
  )
}
