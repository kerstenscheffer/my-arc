// src/modules/client-meal-base/components/SelectMealModal.jsx
// ⭐ PORTAL VERSION - Renders outside parent modal DOM tree

import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useModalHost } from '../../../coach/ModalHost'
import { X, UtensilsCrossed } from 'lucide-react'

export default function SelectMealModal({ 
  isOpen, 
  onClose, 
  meals, 
  onSelectMeal, 
  category, 
  slotNumber,
  isMobile 
}) {
  console.log('🎨 [SelectMealModal] Rendering with Portal')
  console.log('📋 [SelectMealModal] Props:', { isOpen, mealsCount: meals?.length, category, slotNumber })

  useEffect(() => {
  const modalHost = useModalHost()
    if (isOpen) {
      console.log('✅ [SelectMealModal] Modal opened via Portal')
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
      
      return () => {
        console.log('🚪 [SelectMealModal] Modal closed, restoring scroll')
        document.body.style.overflow = ''
      }
    }
  }, [isOpen])

  if (!isOpen) {
    console.log('⏸️ [SelectMealModal] Not rendering (isOpen=false)')
    return null
  }

  console.log('✅ [SelectMealModal] Creating Portal to render modal')

  const categoryEmojis = {
    protein: '🥩',
    carbs: '🍚',
    meal_prep: '🥘'
  }

  const categoryLabels = {
    protein: 'Proteïne',
    carbs: 'Koolhydraten',
    meal_prep: 'Meal Prep'
  }

  const modalContent = (
    <>
      {/* Backdrop - HIGHEST Z-INDEX */}
      <div
        onClick={(e) => {
          console.log('🖱️ [SelectMealModal] Backdrop clicked')
          e.stopPropagation()
          onClose()
        }}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 9999, // ⬆️ MAXIMUM z-index to be above EVERYTHING
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: isMobile ? '0' : '1rem',
          animation: 'fadeInPortal 0.2s ease',
          isolation: 'isolate'
        }}
      >
        {/* Modal Content */}
        <div
          onClick={(e) => {
            console.log('🛑 [SelectMealModal] Content clicked, stopping propagation')
            e.stopPropagation()
          }}
          style={{
            position: 'relative',
            background: 'linear-gradient(180deg, #0a0a0a 0%, #111 100%)',
            borderRadius: isMobile ? '24px 24px 0 0' : '20px',
            width: '100%',
            maxWidth: isMobile ? '100%' : '500px',
            maxHeight: isMobile ? '80vh' : '70vh',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            boxShadow: '0 30px 80px rgba(0, 0, 0, 0.8)',
            display: 'flex',
            flexDirection: 'column',
            animation: isMobile ? 'slideUpPortal 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'scaleInPortal 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            zIndex: 10000, // ⬆️ Even higher than backdrop
            isolation: 'isolate'
          }}
        >
          {/* Header */}
          <div style={{
            padding: isMobile ? '1.25rem 1rem 1rem' : '1.5rem 1.25rem 1.25rem',
            borderBottom: '1px solid rgba(16, 185, 129, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(16, 185, 129, 0.05)'
          }}>
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.25rem'
              }}>
                <span style={{ fontSize: '1.5rem' }}>
                  {categoryEmojis[category] || '🍽️'}
                </span>
                <h3 style={{
                  fontSize: isMobile ? '1.125rem' : '1.25rem',
                  fontWeight: '700',
                  color: '#fff',
                  margin: 0
                }}>
                  Kies {categoryLabels[category]}
                </h3>
              </div>
              <p style={{
                fontSize: isMobile ? '0.75rem' : '0.8rem',
                color: 'rgba(255, 255, 255, 0.5)',
                margin: 0
              }}>
                Slot {slotNumber} • Selecteer uit je custom meals
              </p>
            </div>
            
            <button
              onClick={(e) => {
                console.log('❌ [SelectMealModal] Close button clicked')
                e.stopPropagation()
                onClose()
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'
                e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
              }}
            >
              <X size={18} style={{ color: 'rgba(255, 255, 255, 0.7)' }} />
            </button>
          </div>
          
          {/* Meals List */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: isMobile ? '1rem' : '1.25rem',
            WebkitOverflowScrolling: 'touch'
          }}>
            {!meals || meals.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '3rem 1rem',
                color: 'rgba(255, 255, 255, 0.5)'
              }}>
                <UtensilsCrossed 
                  size={48} 
                  style={{ 
                    color: 'rgba(16, 185, 129, 0.3)',
                    marginBottom: '1rem'
                  }} 
                />
                <p style={{
                  fontSize: isMobile ? '0.9rem' : '1rem',
                  margin: 0
                }}>
                  Nog geen custom meals aangemaakt
                </p>
                <p style={{
                  fontSize: isMobile ? '0.8rem' : '0.875rem',
                  color: 'rgba(255, 255, 255, 0.4)',
                  marginTop: '0.5rem'
                }}>
                  Maak eerst een meal aan via "Nieuwe Meal Maken"
                </p>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr',
                gap: '0.75rem'
              }}>
                {meals.map((meal) => (
                  <button
                    key={meal.id}
                    onClick={(e) => {
                      console.log('✅ [SelectMealModal] Meal selected:', meal.name, meal.id)
                      e.stopPropagation()
                      onSelectMeal(meal.id)
                    }}
                    style={{
                      padding: isMobile ? '1rem' : '1.125rem',
                      background: 'rgba(16, 185, 129, 0.08)',
                      border: '1px solid rgba(16, 185, 129, 0.2)',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      textAlign: 'left',
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(16, 185, 129, 0.15)'
                      e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.4)'
                      e.currentTarget.style.transform = 'translateX(4px)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(16, 185, 129, 0.08)'
                      e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.2)'
                      e.currentTarget.style.transform = 'translateX(0)'
                    }}
                  >
                    <div style={{
                      fontSize: isMobile ? '0.95rem' : '1rem',
                      fontWeight: '600',
                      color: '#fff',
                      marginBottom: '0.5rem'
                    }}>
                      {meal.name}
                    </div>
                    
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '0.5rem',
                      fontSize: isMobile ? '0.75rem' : '0.8rem',
                      color: 'rgba(255, 255, 255, 0.6)'
                    }}>
                      <span>🔥 {meal.calories || 0} kcal</span>
                      <span>💪 {meal.protein || 0}g</span>
                      <span>🍚 {meal.carbs || 0}g</span>
                      <span>🥑 {meal.fat || 0}g</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Animations */}
      <style>{`
        @keyframes fadeInPortal {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUpPortal {
          from { 
            opacity: 0;
            transform: translateY(100%);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes scaleInPortal {
          from { 
            opacity: 0;
            transform: scale(0.9);
          }
          to { 
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </>
  )

  // 🌟 RENDER VIA PORTAL - Mounts directly to document.body
  // This ensures the modal is COMPLETELY independent from parent modals
  console.log('🚀 [SelectMealModal] Rendering via createPortal to document.body')
  return createPortal(modalContent, modalHost)
}
