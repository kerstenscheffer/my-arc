// src/modules/client-meal-builder/components/SearchSection.jsx
import { Search, Scan, Plus } from 'lucide-react'

const CATEGORY_IMAGES = {
  carbs: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=80&h=80&fit=crop',
  protein: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=80&h=80&fit=crop',
  dairy: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=80&h=80&fit=crop',
  fruits: 'https://images.unsplash.com/photo-1490474504059-bf2db5ab2348?w=80&h=80&fit=crop',
  fruit: 'https://images.unsplash.com/photo-1490474504059-bf2db5ab2348?w=80&h=80&fit=crop',
  vegetables: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=80&h=80&fit=crop',
  vegetable: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=80&h=80&fit=crop',
  fats: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=80&h=80&fit=crop',
  condiments: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=80&h=80&fit=crop',
  other: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=80&h=80&fit=crop',
}

function getIngredientImage(ingredient) {
  if (ingredient?.image_url) return ingredient.image_url
  return CATEGORY_IMAGES[ingredient?.category] || CATEGORY_IMAGES.other
}

export default function SearchSection({
  searchTerm,
  searchResults,
  isMobile,
  onSearch,
  onAddIngredient,
  onOpenScanner
}) {
  return (
    <div style={{
      background: 'rgba(0, 0, 0, 0.6)',
      border: '1px solid rgba(16, 185, 129, 0.2)',
      borderRadius: '0',
      padding: isMobile ? '1.25rem' : '1.5rem',
      marginBottom: '1.5rem',
      boxShadow: '0 10px 30px rgba(16, 185, 129, 0.1)'
    }}>
      <div style={{
        display: 'flex',
        gap: '0.75rem',
        marginBottom: searchResults.length > 0 ? '1rem' : '0'
      }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search 
            size={20} 
            color="rgba(16, 185, 129, 0.5)"
            style={{
              position: 'absolute',
              left: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none'
            }}
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Zoek ingrediënt..."
            style={{
              width: '100%',
              height: '48px',
              background: 'rgba(0, 0, 0, 0.8)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '0',
              color: '#fff',
              fontSize: isMobile ? '1rem' : '1.05rem',
              padding: '0 1rem 0 3rem',
              outline: 'none'
            }}
          />
        </div>
        
        <button
          onClick={onOpenScanner}
          style={{
            width: '48px',
            height: '48px',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <Scan size={22} color="#10b981" />
        </button>
      </div>
      
      {searchResults.length > 0 && (
        <div style={{
          maxHeight: '300px',
          overflow: 'auto',
          background: 'rgba(0, 0, 0, 0.5)',
          border: '1px solid rgba(16, 185, 129, 0.15)',
          borderRadius: '0'
        }}>
          {searchResults.map(ingredient => (
            <button
              key={ingredient.id}
              onClick={() => onAddIngredient(ingredient)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                background: 'transparent',
                border: 'none',
                borderBottom: '1px solid rgba(16, 185, 129, 0.1)',
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}
            >
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                background: `url(${getIngredientImage(ingredient)}) center/cover`,
                flexShrink: 0,
                border: '1px solid rgba(16, 185, 129, 0.2)'
              }} />
              <div style={{ flex: 1 }}>
                <div style={{
                  color: '#fff',
                  fontSize: '1rem',
                  fontWeight: '600',
                  marginBottom: '0.2rem'
                }}>
                  {ingredient.name}
                </div>
                <div style={{
                  color: 'rgba(255, 255, 255, 0.5)',
                  fontSize: '0.85rem'
                }}>
                  {ingredient.category} • {Math.round(ingredient.calories_per_100g)} kcal/100g
                </div>
              </div>
              <Plus size={20} color="#10b981" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
