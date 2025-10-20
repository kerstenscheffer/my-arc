// src/modules/client-meal-base/components/DayTemplatesSection.jsx
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
        padding: isMobile ? '2rem 1rem' : '2rem',
        textAlign: 'center'
      }}>
        <div style={{
          width: isMobile ? '60px' : '80px',
          height: isMobile ? '60px' : '80px',
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(139, 92, 246, 0.1) 100%)',
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1rem',
          border: '1px solid rgba(139, 92, 246, 0.3)'
        }}>
          <Calendar size={isMobile ? 28 : 36} color="#8b5cf6" />
        </div>
        
        <h3 style={{
          fontSize: isMobile ? '1rem' : '1.125rem',
          fontWeight: '600',
          color: '#fff',
          marginBottom: '0.5rem'
        }}>
          Nog geen day templates
        </h3>
        
        <p style={{
          fontSize: isMobile ? '0.875rem' : '0.95rem',
          color: 'rgba(255, 255, 255, 0.6)',
          marginBottom: '1.5rem',
          lineHeight: 1.5
        }}>
          Maak templates voor dagen die vaak terugkomen (bijv. "Zaterdag", "Werkdag")
        </p>
        
        <button
          onClick={onCreateTemplate}
          style={{
            padding: isMobile ? '0.75rem 1.5rem' : '0.875rem 2rem',
            background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
            border: 'none',
            borderRadius: '12px',
            color: '#fff',
            fontSize: isMobile ? '0.875rem' : '0.95rem',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.3s ease',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            minHeight: '44px'
          }}
        >
          <Plus size={18} />
          Maak Template
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
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(139, 92, 246, 0.05) 100%)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(139, 92, 246, 0.2)',
            borderRadius: '12px',
            padding: isMobile ? '1rem' : '1.25rem',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Gradient accent */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: 'linear-gradient(90deg, #8b5cf6 0%, #7c3aed 100%)'
          }} />
          
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: '0.75rem'
          }}>
            <div style={{ flex: 1 }}>
              <h3 style={{
                fontSize: isMobile ? '1rem' : '1.125rem',
                fontWeight: '600',
                color: '#fff',
                marginBottom: '0.25rem'
              }}>
                {template.name}
              </h3>
              <div style={{
                fontSize: isMobile ? '0.8rem' : '0.875rem',
                color: 'rgba(255, 255, 255, 0.6)'
              }}>
                {template.total_calories} kcal totaal
              </div>
            </div>
            
            {/* Action buttons */}
            <div style={{
              display: 'flex',
              gap: '0.5rem'
            }}>
              <button
                onClick={() => onEditTemplate(template)}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'rgba(139, 92, 246, 0.2)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent'
                }}
              >
                <Edit2 size={16} color="#8b5cf6" />
              </button>
              
              <button
                onClick={() => onDeleteTemplate(template.id)}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent'
                }}
              >
                <Trash2 size={16} color="#ef4444" />
              </button>
            </div>
          </div>
          
          {/* Macros */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            marginBottom: '0.75rem',
            fontSize: isMobile ? '0.8rem' : '0.875rem'
          }}>
            <span style={{ color: '#8b5cf6', fontWeight: '600' }}>
              {Math.round(template.total_protein)}g P
            </span>
            <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              {Math.round(template.total_carbs)}g C
            </span>
            <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              {Math.round(template.total_fat)}g F
            </span>
          </div>
          
          {/* Meals preview */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem',
            fontSize: isMobile ? '0.7rem' : '0.75rem',
            color: 'rgba(255, 255, 255, 0.5)'
          }}>
            {template.meals.breakfast && <span>🍳 Ontbijt</span>}
            {template.meals.lunch && <span>🥗 Lunch</span>}
            {template.meals.dinner && <span>🍽️ Diner</span>}
            {template.meals.snacks?.length > 0 && (
              <span>🍪 {template.meals.snacks.length} snack(s)</span>
            )}
          </div>
        </div>
      ))}
      
      {/* Add new button */}
      <button
        onClick={onCreateTemplate}
        style={{
          padding: isMobile ? '1.5rem' : '2rem',
          background: 'rgba(139, 92, 246, 0.1)',
          border: '2px dashed rgba(139, 92, 246, 0.3)',
          borderRadius: '12px',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          transition: 'all 0.3s ease',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
          minHeight: isMobile ? '120px' : '140px'
        }}
      >
        <Plus size={isMobile ? 28 : 32} color="#8b5cf6" />
        <span style={{
          fontSize: isMobile ? '0.875rem' : '0.95rem',
          color: 'rgba(255, 255, 255, 0.7)',
          fontWeight: '500'
        }}>
          Nieuwe Template
        </span>
      </button>
    </div>
  )
}
