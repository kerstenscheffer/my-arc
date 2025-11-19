// src/modules/client-meal-base/components/ApplyTemplateModal.jsx
// ✅ PREMIUM v2.0 - ULTRA-CLEAN GLASSMORPHIC MODAL
// 🎯 WorkoutPhotoSlider Norm Applied
import React, { useState } from 'react'
import { X, CheckCircle, FileCheck } from 'lucide-react'

export default function ApplyTemplateModal({ 
  template, 
  activePlan, 
  db, 
  onClose, 
  onSuccess,
  clientId,
  isMobile 
}) {
  const [selectedDay, setSelectedDay] = useState(null)
  const [applying, setApplying] = useState(false)

  const days = [
    { key: 'monday', label: 'Ma', emoji: '📅', fullName: 'Maandag' },
    { key: 'tuesday', label: 'Di', emoji: '📅', fullName: 'Dinsdag' },
    { key: 'wednesday', label: 'Wo', emoji: '📅', fullName: 'Woensdag' },
    { key: 'thursday', label: 'Do', emoji: '📅', fullName: 'Donderdag' },
    { key: 'friday', label: 'Vr', emoji: '📅', fullName: 'Vrijdag' },
    { key: 'saturday', label: 'Za', emoji: '🎉', fullName: 'Zaterdag' },
    { key: 'sunday', label: 'Zo', emoji: '☀️', fullName: 'Zondag' }
  ]

  const handleApply = async () => {
    if (!selectedDay) {
      alert('⚠️ Selecteer eerst een dag!')
      return
    }

    if (!activePlan) {
      alert('❌ Geen actief meal plan gevonden!')
      return
    }

    setApplying(true)
    try {
      await db.applyDayTemplateToWeek(clientId, activePlan.id, selectedDay, template.id)
      
      const dayInfo = days.find(d => d.key === selectedDay)
      alert(`✅ Template "${template.name}" toegepast op ${dayInfo.fullName}!`)
      
      if (onSuccess) {
        onSuccess(selectedDay)
      }
      onClose()
    } catch (error) {
      console.error('Failed to apply template:', error)
      alert('❌ Toepassen mislukt. Probeer opnieuw.')
    } finally {
      setApplying(false)
    }
  }

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.92)',
        backdropFilter: 'blur(12px)',
        zIndex: 11000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobile ? '1rem' : '2rem',
        animation: 'fadeIn 0.3s ease',
        overflowY: 'auto'
      }}
    >
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: isMobile ? '100%' : '600px',
        background: '#0a0a0a',
        border: '1px solid rgba(139, 92, 246, 0.3)',
        borderRadius: isMobile ? '16px' : '24px',
        boxShadow: '0 25px 80px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(139, 92, 246, 0.2)',
        animation: 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
        maxHeight: '90vh'
      }}>
        {/* Header gradient */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'linear-gradient(90deg, #8b5cf6 0%, #7c3aed 100%)',
          opacity: 0.8
        }} />

        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: isMobile ? '1rem' : '1.5rem',
            right: isMobile ? '1rem' : '1.5rem',
            width: isMobile ? '36px' : '40px',
            height: isMobile ? '36px' : '40px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.8) 0%, rgba(23, 23, 23, 0.6) 100%)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            color: '#8b5cf6',
            fontSize: isMobile ? '1.25rem' : '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            zIndex: 10,
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            boxShadow: '0 4px 16px rgba(139, 92, 246, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.03)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(124, 58, 237, 0.15) 100%)'
            e.currentTarget.style.transform = 'rotate(90deg) scale(1.05)'
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(139, 92, 246, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(23, 23, 23, 0.8) 0%, rgba(23, 23, 23, 0.6) 100%)'
            e.currentTarget.style.transform = 'rotate(0deg) scale(1)'
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(139, 92, 246, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.03)'
          }}
        >
          ×
        </button>

        {/* Content */}
        <div style={{
          padding: isMobile ? '1.5rem 1rem' : '2rem 1.5rem',
          overflowY: 'auto',
          maxHeight: '85vh'
        }}>
          {/* 🔥 PREMIUM HEADER */}
          <div style={{
            marginBottom: isMobile ? '1.5rem' : '2rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: isMobile ? '0.75rem' : '1rem'
          }}>
            {/* Icon container with glow */}
            <div style={{
              width: isMobile ? '56px' : '64px',
              height: isMobile ? '56px' : '64px',
              borderRadius: isMobile ? '14px' : '16px',
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(124, 58, 237, 0.08) 100%)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 0 24px rgba(139, 92, 246, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Shine effect */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '40%',
                background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, transparent 100%)',
                pointerEvents: 'none'
              }} />
              
              <FileCheck 
                size={isMobile ? 24 : 28} 
                color="#8b5cf6"
                strokeWidth={2.5}
                style={{ 
                  filter: 'drop-shadow(0 0 8px rgba(139, 92, 246, 0.6))',
                  position: 'relative',
                  zIndex: 1
                }}
              />
            </div>

            <div style={{ textAlign: 'center' }}>
              <h2 style={{
                fontSize: isMobile ? '1.5rem' : '1.75rem',
                fontWeight: '800',
                color: 'white',
                marginBottom: '0.5rem',
                letterSpacing: '-0.02em',
                textTransform: 'uppercase',
                textShadow: '0 2px 12px rgba(139, 92, 246, 0.4)'
              }}>
                Template Toepassen
              </h2>
              <p style={{
                fontSize: isMobile ? '0.875rem' : '0.95rem',
                color: 'rgba(255, 255, 255, 0.5)',
                lineHeight: 1.5,
                fontWeight: '600',
                margin: 0
              }}>
                Kies op welke dag je deze template wilt toepassen
              </p>
            </div>
          </div>

          {/* 🔥 PREMIUM TEMPLATE INFO CARD */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.8) 0%, rgba(23, 23, 23, 0.6) 100%)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: isMobile ? '12px' : '14px',
            padding: isMobile ? '1rem' : '1.25rem',
            marginBottom: isMobile ? '1.5rem' : '2rem',
            boxShadow: '0 4px 16px rgba(139, 92, 246, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.03)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Top accent */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '2px',
              background: 'linear-gradient(90deg, #8b5cf6 0%, #7c3aed 100%)',
              opacity: 0.6
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
            
            <h3 style={{
              fontSize: isMobile ? '1rem' : '1.125rem',
              fontWeight: '800',
              color: '#fff',
              marginBottom: isMobile ? '0.875rem' : '1rem',
              letterSpacing: '-0.01em',
              position: 'relative',
              zIndex: 1
            }}>
              {template.name}
            </h3>
            
            {/* Totals - Premium Pills */}
            <div style={{
              display: 'flex',
              gap: isMobile ? '0.5rem' : '0.625rem',
              marginBottom: isMobile ? '0.875rem' : '1rem',
              flexWrap: 'wrap',
              position: 'relative',
              zIndex: 1
            }}>
              <div style={{
                padding: isMobile ? '0.375rem 0.75rem' : '0.4rem 0.875rem',
                background: 'rgba(139, 92, 246, 0.15)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: '8px',
                fontSize: isMobile ? '0.8rem' : '0.875rem',
                color: '#8b5cf6',
                fontWeight: '700',
                backdropFilter: 'blur(8px)',
                boxShadow: '0 0 8px rgba(139, 92, 246, 0.2)'
              }}>
                {template.total_calories} kcal
              </div>
              
              <div style={{
                padding: isMobile ? '0.375rem 0.625rem' : '0.4rem 0.75rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                fontSize: isMobile ? '0.8rem' : '0.875rem',
                color: 'rgba(255, 255, 255, 0.7)',
                fontWeight: '700',
                backdropFilter: 'blur(8px)',
                display: 'inline-flex',
                gap: '0.25rem'
              }}>
                <span style={{ opacity: 0.6 }}>P</span>
                {Math.round(template.total_protein)}g
              </div>
              
              <div style={{
                padding: isMobile ? '0.375rem 0.625rem' : '0.4rem 0.75rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                fontSize: isMobile ? '0.8rem' : '0.875rem',
                color: 'rgba(255, 255, 255, 0.7)',
                fontWeight: '700',
                backdropFilter: 'blur(8px)',
                display: 'inline-flex',
                gap: '0.25rem'
              }}>
                <span style={{ opacity: 0.6 }}>C</span>
                {Math.round(template.total_carbs)}g
              </div>
              
              <div style={{
                padding: isMobile ? '0.375rem 0.625rem' : '0.4rem 0.75rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                fontSize: isMobile ? '0.8rem' : '0.875rem',
                color: 'rgba(255, 255, 255, 0.7)',
                fontWeight: '700',
                backdropFilter: 'blur(8px)',
                display: 'inline-flex',
                gap: '0.25rem'
              }}>
                <span style={{ opacity: 0.6 }}>F</span>
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

          {/* Day selector */}
          <div style={{
            marginBottom: isMobile ? '1.5rem' : '2rem'
          }}>
            <h4 style={{
              fontSize: isMobile ? '0.95rem' : '1rem',
              fontWeight: '700',
              color: 'rgba(255, 255, 255, 0.8)',
              marginBottom: '1rem',
              textAlign: 'center',
              letterSpacing: '-0.01em'
            }}>
              Selecteer dag:
            </h4>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: isMobile ? '0.5rem' : '0.625rem'
            }}>
              {days.map(day => {
                const isSelected = selectedDay === day.key
                return (
                  <button
                    key={day.key}
                    onClick={() => setSelectedDay(day.key)}
                    style={{
                      padding: isMobile ? '0.75rem 0.25rem' : '1rem 0.5rem',
                      background: isSelected 
                        ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.25) 0%, rgba(124, 58, 237, 0.15) 100%)'
                        : 'linear-gradient(135deg, rgba(23, 23, 23, 0.8) 0%, rgba(23, 23, 23, 0.6) 100%)',
                      backdropFilter: 'blur(12px)',
                      border: isSelected
                        ? '2px solid rgba(139, 92, 246, 0.5)'
                        : '1px solid rgba(139, 92, 246, 0.2)',
                      borderRadius: isMobile ? '10px' : '12px',
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent',
                      minHeight: '44px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.25rem',
                      boxShadow: isSelected
                        ? '0 4px 16px rgba(139, 92, 246, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                        : '0 2px 8px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.02)',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(124, 58, 237, 0.08) 100%)'
                        e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)'
                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(139, 92, 246, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.04)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(23, 23, 23, 0.8) 0%, rgba(23, 23, 23, 0.6) 100%)'
                        e.currentTarget.style.transform = 'translateY(0) scale(1)'
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.02)'
                      }
                    }}
                    onTouchStart={(e) => {
                      if (isMobile && !isSelected) {
                        e.currentTarget.style.transform = 'scale(0.95)'
                      }
                    }}
                    onTouchEnd={(e) => {
                      if (isMobile && !isSelected) {
                        e.currentTarget.style.transform = 'scale(1)'
                      }
                    }}
                  >
                    {/* Shine overlay for selected */}
                    {isSelected && (
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '40%',
                        background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.06) 0%, transparent 100%)',
                        pointerEvents: 'none'
                      }} />
                    )}
                    
                    <span style={{ 
                      fontSize: isMobile ? '1rem' : '1.25rem',
                      position: 'relative',
                      zIndex: 1
                    }}>
                      {day.emoji}
                    </span>
                    <span style={{
                      fontSize: isMobile ? '0.7rem' : '0.8rem',
                      fontWeight: '700',
                      color: isSelected ? '#8b5cf6' : 'rgba(255, 255, 255, 0.6)',
                      position: 'relative',
                      zIndex: 1,
                      letterSpacing: '-0.01em'
                    }}>
                      {day.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* 🔥 PREMIUM APPLY BUTTON */}
          <button
            onClick={handleApply}
            disabled={!selectedDay || applying}
            style={{
              width: '100%',
              padding: isMobile ? '1rem 1.25rem' : '1.125rem 1.5rem',
              background: (!selectedDay || applying)
                ? 'rgba(139, 92, 246, 0.2)'
                : 'linear-gradient(135deg, rgba(23, 23, 23, 0.8) 0%, rgba(23, 23, 23, 0.6) 100%)',
              backdropFilter: 'blur(12px)',
              border: (!selectedDay || applying)
                ? '1px solid rgba(139, 92, 246, 0.2)'
                : '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: isMobile ? '12px' : '14px',
              color: '#fff',
              fontSize: isMobile ? '0.95rem' : '1rem',
              fontWeight: '800',
              cursor: (!selectedDay || applying) ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: isMobile ? '0.5rem' : '0.625rem',
              opacity: (!selectedDay || applying) ? 0.5 : 1,
              boxShadow: (!selectedDay || applying) 
                ? 'none'
                : '0 4px 16px rgba(139, 92, 246, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.03)',
              position: 'relative',
              overflow: 'hidden',
              textTransform: 'uppercase',
              letterSpacing: '-0.02em'
            }}
            onMouseEnter={(e) => {
              if (selectedDay && !applying) {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(124, 58, 237, 0.08) 100%)'
                e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(139, 92, 246, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
              }
            }}
            onMouseLeave={(e) => {
              if (selectedDay && !applying) {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(23, 23, 23, 0.8) 0%, rgba(23, 23, 23, 0.6) 100%)'
                e.currentTarget.style.transform = 'translateY(0) scale(1)'
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(139, 92, 246, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.03)'
              }
            }}
            onTouchStart={(e) => {
              if (isMobile && selectedDay && !applying) {
                e.currentTarget.style.transform = 'scale(0.98)'
              }
            }}
            onTouchEnd={(e) => {
              if (isMobile && selectedDay && !applying) {
                e.currentTarget.style.transform = 'scale(1)'
              }
            }}
          >
            {/* Shine overlay */}
            {selectedDay && !applying && (
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
            )}

            {applying ? (
              <>
                <div style={{
                  width: '18px',
                  height: '18px',
                  border: '2px solid rgba(139, 92, 246, 0.3)',
                  borderTopColor: '#8b5cf6',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  boxShadow: '0 0 12px rgba(139, 92, 246, 0.4)',
                  position: 'relative',
                  zIndex: 2
                }} />
                <span style={{ position: 'relative', zIndex: 2 }}>
                  Bezig met toepassen...
                </span>
              </>
            ) : (
              <>
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
                  <CheckCircle 
                    size={isMobile ? 14 : 16} 
                    color="#8b5cf6"
                    strokeWidth={2.5}
                    style={{ filter: 'drop-shadow(0 0 4px rgba(139, 92, 246, 0.6))' }}
                  />
                </div>
                <span style={{ position: 'relative', zIndex: 2 }}>
                  Template Toepassen
                </span>
              </>
            )}
          </button>

          {/* Warning message */}
          {!activePlan && (
            <div style={{
              marginTop: '1rem',
              padding: isMobile ? '0.875rem' : '1rem',
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              boxShadow: '0 2px 12px rgba(239, 68, 68, 0.15)'
            }}>
              <span style={{ fontSize: '1.25rem' }}>⚠️</span>
              <p style={{
                fontSize: isMobile ? '0.8rem' : '0.875rem',
                color: 'rgba(239, 68, 68, 0.9)',
                fontWeight: '600',
                margin: 0,
                lineHeight: 1.4
              }}>
                Geen actief meal plan gevonden
              </p>
            </div>
          )}
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
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
