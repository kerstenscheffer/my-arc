// src/modules/client-meal-base/components/ApplyTemplateModal.jsx
import { X, Calendar, ArrowRight } from 'lucide-react'
import { useState } from 'react'

export default function ApplyTemplateModal({
  isOpen,
  onClose,
  templates,
  onApply,
  currentDay,
  isMobile
}) {
  // ALL HOOKS BEFORE ANY CONDITIONAL RETURNS
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [selectedDay, setSelectedDay] = useState(currentDay || 'monday')
  
  const daysOfWeek = [
    { key: 'monday', label: 'Maandag' },
    { key: 'tuesday', label: 'Dinsdag' },
    { key: 'wednesday', label: 'Woensdag' },
    { key: 'thursday', label: 'Donderdag' },
    { key: 'friday', label: 'Vrijdag' },
    { key: 'saturday', label: 'Zaterdag' },
    { key: 'sunday', label: 'Zondag' }
  ]
  
  // NOW THE CONDITIONAL RETURN
  if (!isOpen) return null
  
  const handleApply = () => {
    if (!selectedTemplate || !selectedDay) {
      alert('Selecteer een template en dag')
      return
    }
    
    onApply(selectedTemplate, selectedDay)
  }
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(10px)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: isMobile ? '1rem' : '2rem'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '600px',
        maxHeight: '85vh',
        background: 'linear-gradient(180deg, #1a1a1a 0%, #0f0f0f 100%)',
        borderRadius: '20px',
        border: '1px solid rgba(139, 92, 246, 0.3)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: isMobile ? '1.25rem' : '1.5rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <h2 style={{
            fontSize: isMobile ? '1.125rem' : '1.25rem',
            fontWeight: '700',
            color: '#fff',
            margin: 0
          }}>
            📅 Template Toepassen
          </h2>
          
          <button
            onClick={onClose}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            <X size={20} color="#fff" />
          </button>
        </div>
        
        {/* Content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: isMobile ? '1.25rem' : '1.5rem'
        }}>
          {/* Step 1: Select Template */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{
              fontSize: isMobile ? '0.95rem' : '1rem',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.8)',
              marginBottom: '0.75rem'
            }}>
              1. Kies Template
            </h3>
            
            {templates.length === 0 ? (
              <div style={{
                padding: '1.5rem',
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '12px',
                textAlign: 'center',
                color: 'rgba(255, 255, 255, 0.5)',
                fontSize: isMobile ? '0.875rem' : '0.95rem'
              }}>
                Nog geen templates. Maak eerst een template!
              </div>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}>
                {templates.map(template => (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplate(template.id)}
                    style={{
                      padding: isMobile ? '1rem' : '1.25rem',
                      background: selectedTemplate === template.id
                        ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(139, 92, 246, 0.1) 100%)'
                        : 'rgba(255, 255, 255, 0.03)',
                      border: `1px solid ${selectedTemplate === template.id 
                        ? 'rgba(139, 92, 246, 0.4)' 
                        : 'rgba(255, 255, 255, 0.1)'}`,
                      borderRadius: '12px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.3s ease',
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.5rem'
                    }}>
                      <div style={{
                        fontSize: isMobile ? '1rem' : '1.125rem',
                        fontWeight: '600',
                        color: selectedTemplate === template.id ? '#8b5cf6' : '#fff'
                      }}>
                        {template.name}
                      </div>
                      
                      {selectedTemplate === template.id && (
                        <div style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: '#8b5cf6',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <span style={{ fontSize: '14px' }}>✓</span>
                        </div>
                      )}
                    </div>
                    
                    <div style={{
                      display: 'flex',
                      gap: '1rem',
                      fontSize: isMobile ? '0.8rem' : '0.875rem',
                      color: 'rgba(255, 255, 255, 0.6)'
                    }}>
                      <span>{template.total_calories} kcal</span>
                      <span>{Math.round(template.total_protein)}g P</span>
                      <span>{Math.round(template.total_carbs)}g C</span>
                      <span>{Math.round(template.total_fat)}g F</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Step 2: Select Day */}
          <div>
            <h3 style={{
              fontSize: isMobile ? '0.95rem' : '1rem',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.8)',
              marginBottom: '0.75rem'
            }}>
              2. Kies Dag
            </h3>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
              gap: '0.75rem'
            }}>
              {daysOfWeek.map(day => (
                <button
                  key={day.key}
                  onClick={() => setSelectedDay(day.key)}
                  style={{
                    padding: isMobile ? '0.875rem' : '1rem',
                    background: selectedDay === day.key
                      ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%)'
                      : 'rgba(255, 255, 255, 0.03)',
                    border: `1px solid ${selectedDay === day.key 
                      ? 'rgba(16, 185, 129, 0.4)' 
                      : 'rgba(255, 255, 255, 0.1)'}`,
                    borderRadius: '10px',
                    color: selectedDay === day.key ? '#10b981' : 'rgba(255, 255, 255, 0.7)',
                    fontSize: isMobile ? '0.875rem' : '0.95rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent'
                  }}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div style={{
          padding: isMobile ? '1.25rem' : '1.5rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          gap: '1rem'
        }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: isMobile ? '0.75rem' : '0.875rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              color: '#fff',
              fontSize: isMobile ? '0.875rem' : '0.95rem',
              fontWeight: '600',
              cursor: 'pointer',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            Annuleer
          </button>
          
          <button
            onClick={handleApply}
            disabled={!selectedTemplate}
            style={{
              flex: 1,
              padding: isMobile ? '0.75rem' : '0.875rem',
              background: selectedTemplate
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                : 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '10px',
              color: selectedTemplate ? '#fff' : 'rgba(255, 255, 255, 0.3)',
              fontSize: isMobile ? '0.875rem' : '0.95rem',
              fontWeight: '600',
              cursor: selectedTemplate ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            Toepassen
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
