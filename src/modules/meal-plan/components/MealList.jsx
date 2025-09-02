import useIsMobile from '../../../hooks/useIsMobile'
// src/modules/meal-plan/components/MealList.jsx
// VERVANG JE HELE BESTAND HIERMEE - ALLES IN 1 FILE
import React, { useEffect } from 'react'
import { 
  Utensils, Star, RefreshCw, CheckCircle2, 
  Flame, Dumbbell, Zap, Droplets, PlusCircle
} from 'lucide-react'

// Image service direct in dit bestand - geen aparte file nodig
const getMealImage = (mealName) => {
  if (!mealName) return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=200&fit=crop';
  
  // Direct mapping voor specifieke meals met vaste Unsplash foto IDs
  // VOEG HIER JE EIGEN MEALS TOE MET CORRECTE FOTO'S
  const directMappings = {
    // Smoothies & Bowls
    'gainer smoothie bowl': 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=200&h=200&fit=crop',
    'smoothie bowl': 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=200&h=200&fit=crop',
    'protein shake': 'https://images.unsplash.com/photo-1502767089025-6572583495f9?w=200&h=200&fit=crop',
    'fruit smoothie': 'https://images.unsplash.com/photo-1638176066666-ffb2f013c7dd?w=200&h=200&fit=crop',
    
    // Chicken gerechten
    'chicken burrito bowl': 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=200&h=200&fit=crop',
    'kip teriyaki': 'https://images.unsplash.com/photo-1609183480237-ccbb2d7c5772?w=200&h=200&fit=crop',
    'gegrilde kip': 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=200&h=200&fit=crop',
    'kip salade': 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=200&h=200&fit=crop',
    
    // Vis gerechten  
    'zalm uit de oven': 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=200&h=200&fit=crop',
    'gebakken zalm': 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=200&h=200&fit=crop',
    'tonijn salade': 'https://images.unsplash.com/photo-1604909052868-89fee5f10878?w=200&h=200&fit=crop',
    
    // Ontbijt
    'overnight oats': 'https://images.unsplash.com/photo-1517673400267-0251440c45dc?w=200&h=200&fit=crop',
    'havermout': 'https://images.unsplash.com/photo-1517673400267-0251440c45dc?w=200&h=200&fit=crop',
    'griekse yoghurt': 'https://images.unsplash.com/photo-1488477304112-4944851de03d?w=200&h=200&fit=crop',
    'yoghurt met fruit': 'https://images.unsplash.com/photo-1488477304112-4944851de03d?w=200&h=200&fit=crop',
    'scrambled eggs': 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=200&h=200&fit=crop',
    'omelet': 'https://images.unsplash.com/photo-1510693206972-df098062cb71?w=200&h=200&fit=crop',
    'protein pancakes': 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=200&h=200&fit=crop',
    
    // Pasta & Rijst
    'pasta bolognese': 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=200&h=200&fit=crop',
    'pasta carbonara': 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=200&h=200&fit=crop',
    'rijst bowl': 'https://images.unsplash.com/photo-1516714435131-44d6b64dc6a2?w=200&h=200&fit=crop',
    'quinoa bowl': 'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?w=200&h=200&fit=crop',
    
    // Brood & Wraps
    'avocado toast': 'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=200&h=200&fit=crop',
    'tosti': 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=200&h=200&fit=crop',
    'wrap': 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=200&h=200&fit=crop',
    'sandwich': 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=200&h=200&fit=crop',
    
    // Salades
    'caesar salade': 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=200&h=200&fit=crop',
    'groene salade': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200&h=200&fit=crop',
  };
  
  // Check voor directe match
  const lowerName = mealName.toLowerCase();
  if (directMappings[lowerName]) {
    return directMappings[lowerName];
  }
  
  // Zoek op keywords in de naam voor betere matches
  const keywordMappings = {
    'smoothie': 'https://images.unsplash.com/photo-1502767089025-6572583495f9?w=200&h=200&fit=crop',
    'shake': 'https://images.unsplash.com/photo-1502767089025-6572583495f9?w=200&h=200&fit=crop',
    'bowl': 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=200&h=200&fit=crop',
    'kip': 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=200&h=200&fit=crop',
    'chicken': 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=200&h=200&fit=crop',
    'zalm': 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=200&h=200&fit=crop',
    'salmon': 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=200&h=200&fit=crop',
    'tonijn': 'https://images.unsplash.com/photo-1604909052868-89fee5f10878?w=200&h=200&fit=crop',
    'tuna': 'https://images.unsplash.com/photo-1604909052868-89fee5f10878?w=200&h=200&fit=crop',
    'yoghurt': 'https://images.unsplash.com/photo-1488477304112-4944851de03d?w=200&h=200&fit=crop',
    'yogurt': 'https://images.unsplash.com/photo-1488477304112-4944851de03d?w=200&h=200&fit=crop',
    'oats': 'https://images.unsplash.com/photo-1517673400267-0251440c45dc?w=200&h=200&fit=crop',
    'haver': 'https://images.unsplash.com/photo-1517673400267-0251440c45dc?w=200&h=200&fit=crop',
    'pasta': 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=200&h=200&fit=crop',
    'rijst': 'https://images.unsplash.com/photo-1516714435131-44d6b64dc6a2?w=200&h=200&fit=crop',
    'rice': 'https://images.unsplash.com/photo-1516714435131-44d6b64dc6a2?w=200&h=200&fit=crop',
    'salade': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200&h=200&fit=crop',
    'salad': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200&h=200&fit=crop',
    'wrap': 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=200&h=200&fit=crop',
    'burrito': 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=200&h=200&fit=crop',
    'sandwich': 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=200&h=200&fit=crop',
    'toast': 'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=200&h=200&fit=crop',
    'pancake': 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=200&h=200&fit=crop',
    'ei': 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=200&h=200&fit=crop',
    'egg': 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=200&h=200&fit=crop',
  };
  
  // Check voor keywords
  for (const [keyword, url] of Object.entries(keywordMappings)) {
    if (lowerName.includes(keyword)) {
      return url;
    }
  }
  
  // Laatste fallback - generieke healthy food foto
  return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=200&fit=crop';
};

export default function MealList({
  meals,
  checkedMeals,
  favorites,
  onToggleMeal,
  onSwapMeal,
  onToggleFavorite,
  onViewDetails,
  onAddCustomMeal
}) {
  const isMobile = useIsMobile()
  
  return (
    <div style={{
      background: 'rgba(0, 0, 0, 0.4)',
      backdropFilter: 'blur(10px)',
      borderRadius: '20px',
      padding: '1rem',
      border: '1px solid rgba(16, 185, 129, 0.15)',
      marginBottom: '1.5rem'
    }}>
      <h3 style={{
        color: '#fff',
        fontSize: '1.1rem',
        fontWeight: 'bold',
        marginBottom: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <Utensils size={20} style={{ color: 'rgba(16, 185, 129, 0.7)' }} />
        Vandaag's Maaltijden
      </h3>
      
      {meals.length > 0 ? (
        meals.map((meal, idx) => (
          <MealCard
            key={`meal-${meal.id || idx}-${idx}`}
            meal={meal}
            isEaten={checkedMeals[idx]}
            isFavorite={favorites.includes(meal.id)}
            onToggle={() => onToggleMeal(idx)}
            onSwap={() => onSwapMeal(meal)}
            onFavorite={() => onToggleFavorite(meal.id)}
            onViewDetails={() => onViewDetails(meal)}
            timeSlot={meal.timeSlot}
          />
        ))
      ) : (
        <div style={{
          textAlign: 'center',
          padding: '2rem',
          color: 'rgba(255, 255, 255, 0.4)'
        }}>
          Geen maaltijden gepland voor vandaag.
          Vraag je coach om een meal plan voor je te maken!
        </div>
      )}
      
      <button
        onClick={onAddCustomMeal}
        style={{
          width: '100%',
          padding: '0.875rem',
          marginTop: '1rem',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          borderRadius: '12px',
          color: 'rgba(16, 185, 129, 0.9)',
          fontWeight: '600',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          transition: 'all 0.2s ease'
        }}
      >
        <PlusCircle size={18} />
        Voeg Eigen Maaltijd Toe
      </button>
    </div>
  )
}

function MealCard({ meal, isEaten, isFavorite, onToggle, onSwap, onFavorite, onViewDetails, timeSlot }) {
  const [imageError, setImageError] = React.useState(false);
  
  // Gebruik database URL of genereer automatisch
  const imageUrl = meal.image_url || getMealImage(meal.name);
  
  // Debug log
  React.useEffect(() => {
    console.log(`🖼️ Loading image for ${meal.name}: ${imageUrl}`);
  }, [meal.name, imageUrl]);
  
  return (
    <div
      style={{
        background: isEaten
          ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(16, 185, 129, 0.03) 100%)'
          : 'rgba(0, 0, 0, 0.3)',
        border: isEaten
          ? '1px solid rgba(16, 185, 129, 0.25)'
          : '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        padding: '0.875rem',
        marginBottom: '0.75rem',
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        position: 'relative'
      }}
      onClick={onToggle}
    >
      <button
        onClick={(e) => {
          e.stopPropagation()
          onFavorite()
        }}
        style={{
          position: 'absolute',
          top: '0.5rem',
          right: '0.5rem',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: '0.25rem',
          zIndex: 10
        }}
      >
        <Star 
          size={18} 
          style={{ 
            color: isFavorite ? '#f59e0b' : 'rgba(255,255,255,0.2)',
            fill: isFavorite ? '#f59e0b' : 'none',
            transition: 'all 0.3s ease'
          }} 
        />
      </button>
      
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem'
      }}>
        <div 
          onClick={(e) => {
            e.stopPropagation()
            onViewDetails()
          }}
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            border: isEaten 
              ? '2px solid rgba(16, 185, 129, 0.5)'
              : '2px solid rgba(255, 255, 255, 0.1)',
            position: 'relative',
            flexShrink: 0,
            overflow: 'hidden',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {/* Meal image */}
          {!imageError ? (
            <img
              src={imageUrl}
              alt={meal.name}
              onError={() => {
                console.log(`❌ Failed to load image for ${meal.name}`);
                setImageError(true);
              }}
              style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
          ) : (
            <Utensils size={20} style={{ color: 'rgba(16, 185, 129, 0.3)' }} />
          )}
          
          {isEaten && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.8) 0%, rgba(5, 150, 105, 0.8) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2
            }}>
              <CheckCircle2 size={24} style={{ color: '#fff' }} />
            </div>
          )}
        </div>
        
        <div style={{ flex: 1 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.25rem'
          }}>
            <span style={{
              color: 'rgba(16, 185, 129, 0.6)',
              fontSize: '0.7rem',
              fontWeight: '600',
              textTransform: 'uppercase'
            }}>
              {timeSlot}
            </span>
            
            <button
              onClick={(e) => {
                e.stopPropagation()
                onSwap()
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'rgba(16, 185, 129, 0.5)',
                cursor: 'pointer',
                padding: '0.25rem',
                transition: 'all 0.2s ease'
              }}
            >
              <RefreshCw size={14} />
            </button>
          </div>
          
          <div 
            onClick={(e) => {
              e.stopPropagation()
              onViewDetails()
            }}
            style={{
              color: '#fff',
              fontSize: '0.95rem',
              fontWeight: '600',
              marginBottom: '0.5rem',
              cursor: 'pointer',
              textDecoration: isEaten ? 'line-through' : 'none',
              opacity: isEaten ? 0.7 : 1
            }}
          >
            {meal.name}
          </div>
          
          <div style={{
            display: 'flex',
            gap: '0.75rem',
            fontSize: '0.75rem',
            color: 'rgba(255,255,255,0.5)'
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              <Flame size={11} style={{ color: 'rgba(16, 185, 129, 0.6)' }} />
              {meal.calories || meal.kcal || 0}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              <Dumbbell size={11} style={{ color: 'rgba(5, 150, 105, 0.6)' }} />
              {meal.protein || 0}g
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              <Zap size={11} style={{ color: 'rgba(4, 120, 87, 0.6)' }} />
              {meal.carbs || 0}g
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              <Droplets size={11} style={{ color: 'rgba(16, 185, 129, 0.5)' }} />
              {meal.fat || 0}g
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
