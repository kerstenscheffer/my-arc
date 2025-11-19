// src/modules/client-meal-base/components/DayTemplatesSection.jsx
// ✅ PREMIUM v2.0 - ULTRA-CLEAN GLASSMORPHIC CARDS
// 🎯 WorkoutPhotoSlider Norm Applied
import { Calendar, Edit2, Trash2, Plus } from 'lucide-react'

export default function DayTemplatesSection({ 
  templates, 
  onCreateTemplate,
  onEditTemplate,
  onDeleteTemplate,
  isMobile 
}) {
  if (templates.length === 0) {
    return (
      <div style={{
        padding: isMobile ? '2rem 1rem' : '3rem 2rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '300px'
      }}>
        {/* Premium Icon Container */}
        <div style={{
          width: isMobile ? '80px' : '100px',
          height: isMobile ? '80px' : '100px',
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(124, 58, 237, 0.08) 100%)',
          borderRadius: isMobile ? '16px' : '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto',
          marginBottom: isMobile ? '1.25rem' : '1.5rem',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 8px 32px rgba(139, 92, 246, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Shine overlay */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '40%',
            background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, transparent 100%)',
            pointerEvents: 'none'
          }} />
          
          <Calendar 
            size={isMobile ? 32 : 40} 
            color="#8b5cf6"
            strokeWidth={2.5}
            style={{ 
              filter: 'drop-shadow(0 0 8px rgba(139, 92, 246, 0.6))',
              position: 'relative',
              zIndex: 1
            }}
          />
        </div>
        
        {/* Text Container */}
        <div style={{
          textAlign: 'center',
          marginBottom: isMobile ? '1.5rem' : '2rem',
          maxWidth: '400px'
        }}>
          <h3 style={{
            fontSize: isMobile ? '1.125rem' : '1.25rem',
            fontWeight: '800',
            color: '#fff',
            marginBottom: '0.5rem',
            letterSpacing: '-0.01em',
            textTransform: 'uppercase',
            textShadow: '0 2px 8px rgba(139, 92, 246, 0.3)'
          }}>
            Nog geen day templates
          </h3>
          
          <p style={{
            fontSize: isMobile ? '0.875rem' : '0.95rem',
            color: 'rgba(255, 255, 255, 0.6)',
            lineHeight: 1.6,
            fontWeight: '500',
            margin: 0
          }}>
            Maak templates voor dagen die vaak terugkomen (bijv. "Zaterdag", "Werkdag")
          </p>
        </div>
        
        {/* Premium Create Button */}
        <button
          onClick={onCreateTemplate}
          style={{
            padding: isMobile ? '0.875rem 1.5rem' : '1rem 2rem',
            background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.8) 0%, rgba(23, 23, 23, 0.6) 100%)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: isMobile ? '12px' : '14px',
            color: '#fff',
            fontSize: isMobile ? '0.875rem' : '0.95rem',
            fontWeight: '800',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: isMobile ? '0.5rem' : '0.625rem',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            minHeight: '44px',
            boxShadow: '0 4px 16px rgba(139, 92, 246, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
            position: 'relative',
            overflow: 'hidden',
            textTransform: 'uppercase',
            letterSpacing: '-0.02em'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(124, 58, 237, 0.08) 100%)'
            e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(139, 92, 246, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(23, 23, 23, 0.8) 0%, rgba(23, 23, 23, 0.6) 100%)'
            e.currentTarget.style.transform = 'translateY(0) scale(1)'
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(139, 92, 246, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
          }}
          onTouchStart={(e) => {
            if (isMobile) e.currentTarget.style.transform = 'scale(0.98)'
          }}
          onTouchEnd={(e) => {
            if (isMobile) e.currentTarget.style.transform = 'scale(1)'
          }}
        >
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
          
          {/* Icon container */}
          <div style={{
            width: isMobile ? '24px' : '28px',
            height: isMobile ? '24px' : '28px',
            borderRadius: '6px',
            background: 'rgba(139, 92, 246, 0.2)',
            border: '1px solid rgba(139, 92, 246, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 12px rgba(139, 92, 246, 0.3)',
            position: 'relative',
            zIndex: 2
          }}>
            <Plus 
              size={isMobile ? 14 : 16} 
              color="#8b5cf6"
              strokeWidth={2.5}
              style={{ filter: 'drop-shadow(0 0 4px rgba(139, 92, 246, 0.6))' }}
            />
          </div>
          
          <span style={{ position: 'relative', zIndex: 2 }}>
            Maak Template
          </span>
        </button>
      </div>
    )
  }
  
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
      gap: isMobile ? '0.75rem' : '1rem'
    }}>
      {templates.map(template => (
        <div
          key={template.id}
          style={{
            background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.8) 0%, rgba(23, 23, 23, 0.6) 100%)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: isMobile ? '12px' : '14px',
            padding: isMobile ? '1rem' : '1.25rem',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 4px 16px rgba(139, 92, 246, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.03)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(139, 92, 246, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
            e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.4)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(139, 92, 246, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.03)'
            e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.3)'
          }}
        >
          {/* Top accent gradient */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: 'linear-gradient(90deg, #8b5cf6 0%, #7c3aed 100%)',
            opacity: 0.8
          }} />
          
          {/* Shine overlay */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '40%',
            background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.04) 0%, transparent 100%)',
            pointerEvents: 'none'
          }} />
          
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: isMobile ? '0.875rem' : '1rem',
            position: 'relative',
            zIndex: 1
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{
                fontSize: isMobile ? '1rem' : '1.125rem',
                fontWeight: '800',
                color: '#fff',
                marginBottom: '0.375rem',
                letterSpacing: '-0.01em',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                textShadow: '0 1px 4px rgba(0, 0, 0, 0.4)'
              }}>
                {template.name}
              </h3>
              
              {/* Calories badge */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: isMobile ? '0.25rem 0.625rem' : '0.3rem 0.75rem',
                background: 'rgba(139, 92, 246, 0.15)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: '8px',
                fontSize: isMobile ? '0.75rem' : '0.8rem',
                color: '#8b5cf6',
                fontWeight: '700',
                backdropFilter: 'blur(8px)',
                boxShadow: '0 0 8px rgba(139, 92, 246, 0.2)'
              }}>
                {template.total_calories} kcal
              </div>
            </div>
            
            {/* Action buttons */}
            <div style={{
              display: 'flex',
              gap: isMobile ? '0.5rem' : '0.625rem',
              marginLeft: isMobile ? '0.5rem' : '0.75rem'
            }}>
              <button
                onClick={() => onEditTemplate(template)}
                style={{
                  width: isMobile ? '36px' : '40px',
                  height: isMobile ? '36px' : '40px',
                  borderRadius: '10px',
                  background: 'rgba(139, 92, 246, 0.15)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  backdropFilter: 'blur(8px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  boxShadow: '0 2px 8px rgba(139, 92, 246, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.03)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(139, 92, 246, 0.25)'
                  e.currentTarget.style.transform = 'scale(1.05)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(139, 92, 246, 0.15)'
                  e.currentTarget.style.transform = 'scale(1)'
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(139, 92, 246, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.03)'
                }}
                onTouchStart={(e) => {
                  if (isMobile) e.currentTarget.style.transform = 'scale(0.95)'
                }}
                onTouchEnd={(e) => {
                  if (isMobile) e.currentTarget.style.transform = 'scale(1)'
                }}
              >
                <Edit2 
                  size={isMobile ? 16 : 18} 
                  color="#8b5cf6"
                  strokeWidth={2.5}
                  style={{ filter: 'drop-shadow(0 0 4px rgba(139, 92, 246, 0.5))' }}
                />
              </button>
              
              <button
                onClick={() => onDeleteTemplate(template.id)}
                style={{
                  width: isMobile ? '36px' : '40px',
                  height: isMobile ? '36px' : '40px',
                  borderRadius: '10px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  backdropFilter: 'blur(8px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  boxShadow: '0 2px 8px rgba(239, 68, 68, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.03)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)'
                  e.currentTarget.style.transform = 'scale(1.05)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'
                  e.currentTarget.style.transform = 'scale(1)'
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(239, 68, 68, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.03)'
                }}
                onTouchStart={(e) => {
                  if (isMobile) e.currentTarget.style.transform = 'scale(0.95)'
                }}
                onTouchEnd={(e) => {
                  if (isMobile) e.currentTarget.style.transform = 'scale(1)'
                }}
              >
                <Trash2 
                  size={isMobile ? 16 : 18} 
                  color="#ef4444"
                  strokeWidth={2.5}
                  style={{ filter: 'drop-shadow(0 0 4px rgba(239, 68, 68, 0.5))' }}
                />
              </button>
            </div>
          </div>
          
          {/* Macros Pills */}
          <div style={{
            display: 'flex',
            gap: isMobile ? '0.5rem' : '0.625rem',
            marginBottom: isMobile ? '0.875rem' : '1rem',
            flexWrap: 'wrap',
            position: 'relative',
            zIndex: 1
          }}>
            <div style={{
              padding: isMobile ? '0.375rem 0.625rem' : '0.4rem 0.75rem',
              background: 'rgba(139, 92, 246, 0.15)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: '8px',
              fontSize: isMobile ? '0.75rem' : '0.8rem',
              color: '#8b5cf6',
              fontWeight: '700',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 0 8px rgba(139, 92, 246, 0.2)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}>
              <span style={{ opacity: 0.7 }}>P</span>
              {Math.round(template.total_protein)}g
            </div>
            
            <div style={{
              padding: isMobile ? '0.375rem 0.625rem' : '0.4rem 0.75rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              fontSize: isMobile ? '0.75rem' : '0.8rem',
              color: 'rgba(255, 255, 255, 0.7)',
              fontWeight: '700',
              backdropFilter: 'blur(8px)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}>
              <span style={{ opacity: 0.7 }}>C</span>
              {Math.round(template.total_carbs)}g
            </div>
            
            <div style={{
              padding: isMobile ? '0.375rem 0.625rem' : '0.4rem 0.75rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              fontSize: isMobile ? '0.75rem' : '0.8rem',
              color: 'rgba(255, 255, 255, 0.7)',
              fontWeight: '700',
              backdropFilter: 'blur(8px)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}>
              <span style={{ opacity: 0.7 }}>F</span>
              {Math.round(template.total_fat)}g
            </div>
          </div>
          
          {/* Meals preview */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: isMobile ? '0.5rem' : '0.625rem',
            fontSize: isMobile ? '0.7rem' : '0.75rem',
            position: 'relative',
            zIndex: 1
          }}>
            {template.meals.breakfast && (
              <span style={{
                padding: '0.25rem 0.5rem',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '6px',
                color: 'rgba(255, 255, 255, 0.5)',
                fontWeight: '600'
              }}>
                🍳 Ontbijt
              </span>
            )}
            {template.meals.lunch && (
              <span style={{
                padding: '0.25rem 0.5rem',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '6px',
                color: 'rgba(255, 255, 255, 0.5)',
                fontWeight: '600'
              }}>
                🥗 Lunch
              </span>
            )}
            {template.meals.dinner && (
              <span style={{
                padding: '0.25rem 0.5rem',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '6px',
                color: 'rgba(255, 255, 255, 0.5)',
                fontWeight: '600'
              }}>
                🍽️ Diner
              </span>
            )}
            {template.meals.snacks?.length > 0 && (
              <span style={{
                padding: '0.25rem 0.5rem',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '6px',
                color: 'rgba(255, 255, 255, 0.5)',
                fontWeight: '600'
              }}>
                🍪 {template.meals.snacks.length} snack(s)
              </span>
            )}
          </div>
        </div>
      ))}
      
      {/* 🔥 PREMIUM ADD NEW BUTTON */}
      <button
        onClick={onCreateTemplate}
        style={{
          padding: isMobile ? '1.5rem' : '2rem',
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(124, 58, 237, 0.04) 100%)',
          border: '2px dashed rgba(139, 92, 246, 0.3)',
          borderRadius: isMobile ? '12px' : '14px',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: isMobile ? '0.625rem' : '0.75rem',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
          minHeight: isMobile ? '140px' : '160px',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 2px 12px rgba(139, 92, 246, 0.1)',
          position: 'relative',
          overflow: 'hidden'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(124, 58, 237, 0.08) 100%)'
          e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.5)'
          e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)'
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(139, 92, 246, 0.2)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(124, 58, 237, 0.04) 100%)'
          e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.3)'
          e.currentTarget.style.transform = 'translateY(0) scale(1)'
          e.currentTarget.style.boxShadow = '0 2px 12px rgba(139, 92, 246, 0.1)'
        }}
        onTouchStart={(e) => {
          if (isMobile) e.currentTarget.style.transform = 'scale(0.98)'
        }}
        onTouchEnd={(e) => {
          if (isMobile) e.currentTarget.style.transform = 'scale(1)'
        }}
      >
        {/* Shine overlay */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '50%',
          background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.03) 0%, transparent 100%)',
          pointerEvents: 'none'
        }} />
        
        {/* Icon container */}
        <div style={{
          width: isMobile ? '48px' : '56px',
          height: isMobile ? '48px' : '56px',
          borderRadius: '12px',
          background: 'rgba(139, 92, 246, 0.15)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 16px rgba(139, 92, 246, 0.3)',
          position: 'relative',
          zIndex: 1
        }}>
          <Plus 
            size={isMobile ? 24 : 28} 
            color="#8b5cf6"
            strokeWidth={2.5}
            style={{ filter: 'drop-shadow(0 0 6px rgba(139, 92, 246, 0.6))' }}
          />
        </div>
        
        <span style={{
          fontSize: isMobile ? '0.875rem' : '0.95rem',
          color: 'rgba(255, 255, 255, 0.7)',
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: '-0.01em',
          position: 'relative',
          zIndex: 1
        }}>
          Nieuwe Template
        </span>
      </button>
    </div>
  )
}
