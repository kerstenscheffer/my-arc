// src/modules/meal-plan/components/GenerateWeekModal.jsx
import React, { useState, useEffect } from 'react'
import { X, Zap, AlertCircle } from 'lucide-react'

export default function GenerateWeekModal({
  isOpen,
  onClose,
  onGenerate,
  client,
  activePlan,
  db,
  isMobile
}) {
  const [preferences, setPreferences] = useState({
    mealsPerDay: 4,
    varietyLevel: 'medium',
    prioritizeProtein: true,
    avoidRepetition: true
  })
  
  const [customMealsCount, setCustomMealsCount] = useState(0)
  const [loading, setLoading] = useState(false)
  
  useEffect(() => {
    if (isOpen && client?.id) {
      checkCustomMeals()
    }
  }, [isOpen, client])
  
  const checkCustomMeals = async () => {
    try {
      const meals = await db.getClientCustomMeals(client.id)
      console.log('✅ Found custom meals:', meals?.length)
      setCustomMealsCount(meals?.length || 0)
    } catch (error) {
      console.error('Failed to check custom meals:', error)
      setCustomMealsCount(0)
    }
  }
  
  const handleGenerate = async () => {
    if (customMealsCount === 0) {
      alert('Je hebt nog geen custom meals! Maak eerst minimaal 5 maaltijden aan.')
      return
    }
    
    if (customMealsCount < 5) {
      if (!confirm(`Je hebt maar ${customMealsCount} meals. Voor beste resultaten adviseren we minimaal 5 meals. Toch doorgaan?`)) {
        return
      }
    }
    
    setLoading(true)
    
    try {
      await onGenerate(preferences)
    } catch (error) {
      console.error('Generate failed:', error)
    } finally {
      setLoading(false)
    }
  }
  
  if (!isOpen) return null
  
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          zIndex: 9998,
          animation: 'fadeIn 0.2s ease'
        }}
      />
      
      {/* Modal */}
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: isMobile ? '90%' : '500px',
        maxWidth: '90vw',
        maxHeight: '90vh',
        background: 'linear-gradient(135deg, rgba(17, 17, 17, 0.98) 0%, rgba(10, 10, 10, 0.98) 100%)',
        backdropFilter: 'blur(20px)',
        borderRadius: isMobile ? '20px' : '24px',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
        zIndex: 9999,
        overflow: 'hidden',
        animation: 'slideUp 0.3s ease'
      }}>
        {/* Header */}
        <div style={{
          padding: isMobile ? '1.25rem' : '1.5rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(59, 130, 246, 0.1) 100%)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Zap size={20} color="#3b82f6" />
            </div>
            <div>
              <h3 style={{
                fontSize: isMobile ? '1.25rem' : '1.5rem',
                fontWeight: '700',
                color: '#fff',
                margin: 0
              }}>
                Genereer Week Plan
              </h3>
              <p style={{
                fontSize: '0.875rem',
                color: 'rgba(255, 255, 255, 0.5)',
                margin: 0
              }}>
                AI maakt je perfecte week
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            <X size={18} color="rgba(255, 255, 255, 0.7)" />
          </button>
        </div>
        
        {/* Content */}
        <div style={{
          padding: isMobile ? '1.25rem' : '1.5rem',
          maxHeight: 'calc(90vh - 180px)',
          overflowY: 'auto'
        }}>
          {/* Custom Meals Check */}
          <div style={{
            background: customMealsCount === 0
              ? 'rgba(239, 68, 68, 0.1)'
              : customMealsCount < 5
              ? 'rgba(251, 191, 36, 0.1)'
              : 'rgba(16, 185, 129, 0.1)',
            border: customMealsCount === 0
              ? '1px solid rgba(239, 68, 68, 0.3)'
              : customMealsCount < 5
              ? '1px solid rgba(251, 191, 36, 0.3)'
              : '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '12px',
            padding: '1rem',
            marginBottom: '1.5rem',
            display: 'flex',
            gap: '0.75rem'
          }}>
            <AlertCircle 
              size={20} 
              color={
                customMealsCount === 0 ? '#ef4444' :
                customMealsCount < 5 ? '#fbbf24' :
                '#10b981'
              }
              style={{ flexShrink: 0, marginTop: '0.125rem' }}
            />
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#fff',
                marginBottom: '0.25rem'
              }}>
                {customMealsCount === 0 ? 'Geen custom meals' :
                 customMealsCount < 5 ? 'Te weinig meals' :
                 `${customMealsCount} meals beschikbaar`}
              </div>
              <div style={{
                fontSize: '0.8rem',
                color: 'rgba(255, 255, 255, 0.6)',
                lineHeight: 1.5
              }}>
                {customMealsCount === 0 ? 'Maak eerst minimaal 5 custom meals om AI te kunnen gebruiken.' :
                 customMealsCount < 5 ? `Maak nog ${5 - customMealsCount} meals voor beste resultaten.` :
                 'Genoeg meals voor een gevarieerde week!'}
              </div>
            </div>
          </div>
          
          {/* Meals Per Day */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#fff',
              marginBottom: '0.75rem'
            }}>
              Maaltijden per dag
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '0.75rem'
            }}>
              {[3, 4, 5].map(num => (
                <button
                  key={num}
                  onClick={() => setPreferences(prev => ({ ...prev, mealsPerDay: num }))}
                  style={{
                    padding: '1rem',
                    background: preferences.mealsPerDay === num
                      ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(59, 130, 246, 0.1) 100%)'
                      : 'rgba(255, 255, 255, 0.05)',
                    border: preferences.mealsPerDay === num
                      ? '2px solid rgba(59, 130, 246, 0.5)'
                      : '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '1.25rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent',
                    minHeight: '44px'
                  }}
                  onMouseEnter={(e) => {
                    if (preferences.mealsPerDay !== num) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (preferences.mealsPerDay !== num) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                    }
                  }}
                >
                  {num}
                </button>
              ))}
            </div>
            <p style={{
              fontSize: '0.75rem',
              color: 'rgba(255, 255, 255, 0.5)',
              marginTop: '0.5rem',
              margin: 0
            }}>
              {preferences.mealsPerDay === 3 && 'Ontbijt, Lunch, Diner'}
              {preferences.mealsPerDay === 4 && 'Ontbijt, Lunch, Diner + 1 Snack'}
              {preferences.mealsPerDay === 5 && 'Ontbijt, Lunch, Diner + 2 Snacks'}
            </p>
          </div>
          
          {/* Variety Level */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#fff',
              marginBottom: '0.75rem'
            }}>
              Variatie niveau
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '0.75rem'
            }}>
              {[
                { value: 'low', label: 'Laag', desc: 'Herhaling OK' },
                { value: 'medium', label: 'Gemiddeld', desc: 'Balanced' },
                { value: 'high', label: 'Hoog', desc: 'Max variatie' }
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => setPreferences(prev => ({ ...prev, varietyLevel: option.value }))}
                  style={{
                    padding: '0.875rem 0.75rem',
                    background: preferences.varietyLevel === option.value
                      ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(59, 130, 246, 0.1) 100%)'
                      : 'rgba(255, 255, 255, 0.05)',
                    border: preferences.varietyLevel === option.value
                      ? '2px solid rgba(59, 130, 246, 0.5)'
                      : '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    color: '#fff',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent',
                    textAlign: 'center',
                    minHeight: '44px'
                  }}
                >
                  <div style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                    {option.label}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.5)' }}>
                    {option.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>
          
          {/* Toggles */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              cursor: 'pointer',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}>
              <div>
                <div style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#fff',
                  marginBottom: '0.25rem'
                }}>
                  Prioriteer eiwit
                </div>
                <div style={{
                  fontSize: '0.75rem',
                  color: 'rgba(255, 255, 255, 0.5)'
                }}>
                  Focus op protein targets
                </div>
              </div>
              <input
                type="checkbox"
                checked={preferences.prioritizeProtein}
                onChange={(e) => setPreferences(prev => ({ ...prev, prioritizeProtein: e.target.checked }))}
                style={{
                  width: '44px',
                  height: '24px',
                  cursor: 'pointer'
                }}
              />
            </label>
            
            <label style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              cursor: 'pointer',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}>
              <div>
                <div style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#fff',
                  marginBottom: '0.25rem'
                }}>
                  Vermijd herhaling
                </div>
                <div style={{
                  fontSize: '0.75rem',
                  color: 'rgba(255, 255, 255, 0.5)'
                }}>
                  Zelfde meal max 2x per week
                </div>
              </div>
              <input
                type="checkbox"
                checked={preferences.avoidRepetition}
                onChange={(e) => setPreferences(prev => ({ ...prev, avoidRepetition: e.target.checked }))}
                style={{
                  width: '44px',
                  height: '24px',
                  cursor: 'pointer'
                }}
              />
            </label>
          </div>
        </div>
        
        {/* Footer */}
        <div style={{
          padding: isMobile ? '1.25rem' : '1.5rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          gap: '0.75rem'
        }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '0.875rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '0.95rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              touchAction: 'manipulation',
              minHeight: '48px'
            }}
          >
            Annuleer
          </button>
          
          <button
            onClick={handleGenerate}
            disabled={loading || customMealsCount === 0}
            style={{
              flex: 2,
              padding: '0.875rem',
              background: loading || customMealsCount === 0
                ? 'rgba(59, 130, 246, 0.3)'
                : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '12px',
              color: '#fff',
              fontSize: '0.95rem',
              fontWeight: '600',
              cursor: loading || customMealsCount === 0 ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              touchAction: 'manipulation',
              minHeight: '48px',
              boxShadow: loading || customMealsCount === 0 ? 'none' : '0 8px 25px rgba(59, 130, 246, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            <Zap size={18} />
            {loading ? 'Bezig met genereren...' : 'Genereer Week'}
          </button>
        </div>
      </div>
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translate(-50%, -45%);
          }
          to { 
            opacity: 1;
            transform: translate(-50%, -50%);
          }
        }
      `}</style>
    </>
  )
}
