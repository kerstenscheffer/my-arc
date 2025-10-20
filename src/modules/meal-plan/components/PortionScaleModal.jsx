// src/modules/meal-plan/components/PortionScaleModal.jsx
import React, { useState } from 'react'
import { X, Scale } from 'lucide-react'

export default function PortionScaleModal({
  isOpen,
  onClose,
  meal,
  currentScale,
  onScale,
  isMobile
}) {
  const [scale, setScale] = useState(currentScale || 1)
  
  const presetScales = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0]
  
  const calculateScaledMacros = (scaleFactor) => {
    const base = {
      calories: meal.original_calories || meal.calories,
      protein: Math.round((meal.protein / (meal.scale_factor || 1))),
      carbs: Math.round((meal.carbs / (meal.scale_factor || 1))),
      fat: Math.round((meal.fat / (meal.scale_factor || 1)))
    }
    
    return {
      calories: Math.round(base.calories * scaleFactor),
      protein: Math.round(base.protein * scaleFactor),
      carbs: Math.round(base.carbs * scaleFactor),
      fat: Math.round(base.fat * scaleFactor)
    }
  }
  
  const handleScale = () => {
    onScale(scale)
  }
  
  const scaledMacros = calculateScaledMacros(scale)
  
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
        width: isMobile ? '90%' : '450px',
        maxWidth: '90vw',
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
              <Scale size={20} color="#3b82f6" />
            </div>
            <div>
              <h3 style={{
                fontSize: isMobile ? '1.1rem' : '1.25rem',
                fontWeight: '700',
                color: '#fff',
                margin: 0
              }}>
                Portie Aanpassen
              </h3>
              <p style={{
                fontSize: '0.875rem',
                color: 'rgba(255, 255, 255, 0.5)',
                margin: 0
              }}>
                {meal.meal_name}
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
          padding: isMobile ? '1.25rem' : '1.5rem'
        }}>
          {/* Preset Scales */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#fff',
              marginBottom: '0.75rem'
            }}>
              Kies portiegrootte
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '0.75rem'
            }}>
              {presetScales.map(preset => (
                <button
                  key={preset}
                  onClick={() => setScale(preset)}
                  style={{
                    padding: '1rem 0.5rem',
                    background: scale === preset
                      ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.3) 0%, rgba(59, 130, 246, 0.2) 100%)'
                      : 'rgba(255, 255, 255, 0.05)',
                    border: scale === preset
                      ? '2px solid rgba(59, 130, 246, 0.6)'
                      : '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    color: '#fff',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent',
                    minHeight: '44px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onMouseEnter={(e) => {
                    if (scale !== preset) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (scale !== preset) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                    }
                  }}
                >
                  <div style={{
                    fontSize: '1.25rem',
                    fontWeight: '700',
                    marginBottom: '0.25rem'
                  }}>
                    {preset}x
                  </div>
                  <div style={{
                    fontSize: '0.7rem',
                    color: 'rgba(255, 255, 255, 0.5)'
                  }}>
                    {preset === 0.5 ? 'Half' :
                     preset === 0.75 ? '3/4' :
                     preset === 1.0 ? 'Normaal' :
                     preset === 1.25 ? '+25%' :
                     preset === 1.5 ? '+50%' :
                     preset === 2.0 ? 'Dubbel' : ''}
                  </div>
                </button>
              ))}
            </div>
          </div>
          
          {/* Custom Scale Slider */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#fff',
              marginBottom: '0.75rem'
            }}>
              Of kies exact: {Math.round(scale * 100)}%
            </label>
            <input
              type="range"
              min="25"
              max="300"
              step="5"
              value={scale * 100}
              onChange={(e) => setScale(parseFloat(e.target.value) / 100)}
              style={{
                width: '100%',
                height: '8px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.1)',
                cursor: 'pointer',
                WebkitAppearance: 'none',
                appearance: 'none'
              }}
            />
          </div>
          
          {/* Preview Macros */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            borderRadius: '16px',
            padding: isMobile ? '1.25rem' : '1.5rem'
          }}>
            <div style={{
              fontSize: '0.875rem',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.7)',
              marginBottom: '1rem',
              textAlign: 'center'
            }}>
              Nieuwe waarden
            </div>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '1rem'
            }}>
              <div style={{
                background: 'rgba(249, 115, 22, 0.1)',
                border: '1px solid rgba(249, 115, 22, 0.2)',
                borderRadius: '12px',
                padding: '1rem',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: isMobile ? '1.5rem' : '1.75rem',
                  fontWeight: '800',
                  color: '#f97316',
                  marginBottom: '0.25rem'
                }}>
                  {scaledMacros.calories}
                </div>
                <div style={{
                  fontSize: '0.75rem',
                  color: 'rgba(255, 255, 255, 0.5)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  kcal
                </div>
              </div>
              
              <div style={{
                background: 'rgba(139, 92, 246, 0.1)',
                border: '1px solid rgba(139, 92, 246, 0.2)',
                borderRadius: '12px',
                padding: '1rem',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: isMobile ? '1.5rem' : '1.75rem',
                  fontWeight: '800',
                  color: '#8b5cf6',
                  marginBottom: '0.25rem'
                }}>
                  {scaledMacros.protein}g
                </div>
                <div style={{
                  fontSize: '0.75rem',
                  color: 'rgba(255, 255, 255, 0.5)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Eiwit
                </div>
              </div>
              
              <div style={{
                background: 'rgba(234, 179, 8, 0.1)',
                border: '1px solid rgba(234, 179, 8, 0.2)',
                borderRadius: '12px',
                padding: '1rem',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: isMobile ? '1.5rem' : '1.75rem',
                  fontWeight: '800',
                  color: '#eab308',
                  marginBottom: '0.25rem'
                }}>
                  {scaledMacros.carbs}g
                </div>
                <div style={{
                  fontSize: '0.75rem',
                  color: 'rgba(255, 255, 255, 0.5)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Koolh.
                </div>
              </div>
              
              <div style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                borderRadius: '12px',
                padding: '1rem',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: isMobile ? '1.5rem' : '1.75rem',
                  fontWeight: '800',
                  color: '#10b981',
                  marginBottom: '0.25rem'
                }}>
                  {scaledMacros.fat}g
                </div>
                <div style={{
                  fontSize: '0.75rem',
                  color: 'rgba(255, 255, 255, 0.5)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Vet
                </div>
              </div>
            </div>
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
            onClick={handleScale}
            style={{
              flex: 2,
              padding: '0.875rem',
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '12px',
              color: '#fff',
              fontSize: '0.95rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              touchAction: 'manipulation',
              minHeight: '48px',
              boxShadow: '0 8px 25px rgba(59, 130, 246, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 12px 35px rgba(59, 130, 246, 0.4)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.3)'
            }}
          >
            <Scale size={18} />
            Toepassen
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
        
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          cursor: pointer;
          border: 2px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.5);
        }
        
        input[type="range"]::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          cursor: pointer;
          border: 2px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.5);
        }
      `}</style>
    </>
  )
}
