// src/modules/client-meal-base/components/CustomMealCard.jsx
import { Info, Edit2, Trash2 } from 'lucide-react'
import { useState } from 'react'

export default function CustomMealCard({ meal, onEdit, onDelete, isMobile }) {
  const [showActions, setShowActions] = useState(false)
  
  return (
    <div 
      style={{
        background: 'linear-gradient(135deg, rgba(17, 17, 17, 0.8) 0%, rgba(10, 10, 10, 0.8) 100%)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(16, 185, 129, 0.15)',
        borderRadius: '12px',
        padding: isMobile ? '0.875rem' : '1rem',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        position: 'relative',
        overflow: 'hidden'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.3)'
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(16, 185, 129, 0.15)'
        setShowActions(true)
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.15)'
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'none'
        setShowActions(false)
      }}
    >
      {/* Gradient Accent */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)'
      }} />
      
      {/* Meal Name */}
      <div style={{
        fontSize: isMobile ? '0.95rem' : '1rem',
        fontWeight: '600',
        color: '#fff',
        marginBottom: '0.5rem',
        lineHeight: 1.3,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical'
      }}>
        {meal.name}
      </div>
      
      {/* Macros */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.25rem',
        marginBottom: '0.75rem'
      }}>
        <div style={{
          fontSize: isMobile ? '0.875rem' : '0.95rem',
          fontWeight: '700',
          color: '#10b981'
        }}>
          {meal.calories} kcal
        </div>
        
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          fontSize: isMobile ? '0.75rem' : '0.8rem',
          color: 'rgba(255, 255, 255, 0.7)'
        }}>
          <span>{Math.round(meal.protein)}g P</span>
          <span>•</span>
          <span>{Math.round(meal.carbs)}g C</span>
          <span>•</span>
          <span>{Math.round(meal.fat)}g F</span>
        </div>
      </div>
      
      {/* Ingredients Count */}
      <div style={{
        fontSize: isMobile ? '0.7rem' : '0.75rem',
        color: 'rgba(255, 255, 255, 0.5)',
        marginBottom: '0.75rem',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        fontWeight: '500'
      }}>
        {meal.ingredients_list?.length || 0} ingrediënten
      </div>
      
      {/* Action Buttons */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        opacity: showActions || isMobile ? 1 : 0,
        transition: 'opacity 0.3s ease'
      }}>
        <button
          onClick={(e) => {
            e.stopPropagation()
            alert('Info modal komt binnenkort!')
          }}
          style={{
            flex: 1,
            padding: '0.5rem',
            background: 'rgba(59, 130, 246, 0.2)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '8px',
            color: '#3b82f6',
            fontSize: isMobile ? '0.75rem' : '0.8rem',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.25rem',
            transition: 'all 0.3s ease',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            minHeight: '44px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(59, 130, 246, 0.3)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)'
          }}
        >
          <Info size={14} />
          Info
        </button>
        
        <button
          onClick={(e) => {
            e.stopPropagation()
            onEdit()
          }}
          style={{
            flex: 1,
            padding: '0.5rem',
            background: 'rgba(16, 185, 129, 0.2)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '8px',
            color: '#10b981',
            fontSize: isMobile ? '0.75rem' : '0.8rem',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.25rem',
            transition: 'all 0.3s ease',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            minHeight: '44px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(16, 185, 129, 0.3)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)'
          }}
        >
          <Edit2 size={14} />
          Edit
        </button>
        
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          style={{
            flex: 1,
            padding: '0.5rem',
            background: 'rgba(239, 68, 68, 0.2)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            color: '#ef4444',
            fontSize: isMobile ? '0.75rem' : '0.8rem',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.25rem',
            transition: 'all 0.3s ease',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            minHeight: '44px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'
          }}
        >
          <Trash2 size={14} />
          Del
        </button>
      </div>
    </div>
  )
}
