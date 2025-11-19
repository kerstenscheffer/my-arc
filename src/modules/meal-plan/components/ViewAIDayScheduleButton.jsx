// src/modules/meal-plan/components/ViewAIDayScheduleButton.jsx
// ✅ PREMIUM v7.0 - PURPLE THEME 💜
// 🎯 WorkoutPhotoSlider Norm Applied - Full Glassmorphic
import React, { useState, useEffect } from 'react'
import { Calendar, UserCog, FileText } from 'lucide-react'
import AIDaySchedule from './AIDaySchedule'
import MealSetupWizard from './wizard/MealSetupWizard'
import DayTemplatesSectionWrapper from '../../client-meal-base/components/DayTemplatesSectionWrapper'

export default function ViewAIDayScheduleButton({ 
  client, 
  db,
  activePlan,
  todayMeals,
  todayProgress,
  onCheckMeal,
  onUncheckMeal,
  onOpenInfo,
  onOpenAlternatives,
  dayTemplates = [],
  onPlanUpdate,
  onNavigateToDay,
  selectedDay: parentSelectedDay
}) {
  const isMobile = window.innerWidth <= 768
  const [showModal, setShowModal] = useState(false)
  const [showPlanWizard, setShowPlanWizard] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [selectedDay, setSelectedDay] = useState(null)

  useEffect(() => {
    if (parentSelectedDay && parentSelectedDay !== 'today' && parentSelectedDay !== null) {
      console.log('🚀 [ViewAIDayScheduleButton] Parent changed selectedDay to:', parentSelectedDay)
      setSelectedDay(parentSelectedDay)
      setShowModal(true)
      console.log('✅ [ViewAIDayScheduleButton] Modal auto-opened with day:', parentSelectedDay)
    }
  }, [parentSelectedDay])

  const handleTemplateApplied = (appliedDay) => {
    console.log('🎯 [ViewAIDayScheduleButton] Template applied to day:', appliedDay)
    setShowTemplates(false)
    setSelectedDay(appliedDay)
    console.log('✅ [ViewAIDayScheduleButton] Modal will show:', appliedDay)
    setShowModal(true)
    if (onNavigateToDay) {
      onNavigateToDay(appliedDay)
    }
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? '0.625rem' : '0.75rem',
          padding: isMobile ? '0.875rem' : '1rem',
          width: '100%',
          
          // Background & Border - PURPLE THEME 💜
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(124, 58, 237, 0.08) 100%)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          borderRadius: isMobile ? '12px' : '14px',
          
          // Effects
          backdropFilter: 'blur(12px)',
          boxShadow: '0 4px 16px rgba(139, 92, 246, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
          
          // Interaction
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
          minHeight: '44px',
          position: 'relative',
          overflow: 'hidden'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'
          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(139, 92, 246, 0.25) 0%, rgba(124, 58, 237, 0.15) 100%)'
          e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.5)'
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(139, 92, 246, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0) scale(1)'
          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(124, 58, 237, 0.08) 100%)'
          e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.3)'
          e.currentTarget.style.boxShadow = '0 4px 16px rgba(139, 92, 246, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
        }}
        onTouchStart={(e) => {
          if (isMobile) e.currentTarget.style.transform = 'scale(0.98)'
        }}
        onTouchEnd={(e) => {
          if (isMobile) e.currentTarget.style.transform = 'scale(1)'
        }}
      >
        {/* Top shine overlay - PREMIUM */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '40%',
          background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, transparent 100%)',
          pointerEvents: 'none',
          zIndex: 1
        }} />

        {/* Top accent line - PURPLE */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, #8b5cf6 0%, #7c3aed 100%)',
          opacity: 0.6,
          zIndex: 2
        }} />

        {/* Icon container - PURPLE GLOW 💜 */}
        <div style={{
          width: isMobile ? '40px' : '44px',
          height: isMobile ? '40px' : '44px',
          borderRadius: isMobile ? '10px' : '12px',
          background: 'rgba(139, 92, 246, 0.2)',
          border: '1px solid rgba(139, 92, 246, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 0 16px rgba(139, 92, 246, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          flexShrink: 0,
          position: 'relative',
          zIndex: 2
        }}>
          <Calendar 
            size={isMobile ? 18 : 20} 
            color="#8b5cf6"
            strokeWidth={2.5}
            style={{ filter: 'drop-shadow(0 0 8px rgba(139, 92, 246, 0.8))' }}
          />
        </div>

        {/* Text content - PURPLE ACCENT */}
        <div style={{
          flex: 1,
          textAlign: 'left',
          position: 'relative',
          zIndex: 2,
          minWidth: 0
        }}>
          <div style={{
            fontSize: isMobile ? '0.875rem' : '0.95rem',
            fontWeight: '800',
            color: '#8b5cf6',
            marginBottom: '0.1rem',
            letterSpacing: '-0.01em',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            textShadow: '0 0 12px rgba(139, 92, 246, 0.4)'
          }}>
            Week Planning
          </div>
          <div style={{
            fontSize: isMobile ? '0.65rem' : '0.7rem',
            color: 'rgba(255, 255, 255, 0.6)',
            fontWeight: '600',
            lineHeight: 1.3,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            Volledig weekschema
          </div>
        </div>

        {/* Arrow - PURPLE */}
        <div style={{
          color: '#8b5cf6',
          fontSize: isMobile ? '1rem' : '1.125rem',
          fontWeight: '700',
          position: 'relative',
          zIndex: 2,
          transition: 'transform 0.3s ease',
          flexShrink: 0,
          textShadow: '0 0 8px rgba(139, 92, 246, 0.6)'
        }}>
          →
        </div>
      </button>

      {showModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false)
          }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.9)',
            backdropFilter: 'blur(12px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: isMobile ? '0' : '2rem',
            animation: 'fadeIn 0.3s ease'
          }}
        >
          <div style={{
            position: 'relative',
            width: '100%',
            height: isMobile ? '100vh' : 'auto',
            maxWidth: isMobile ? '100%' : '1400px',
            maxHeight: isMobile ? '100vh' : '95vh',
            background: '#0a0a0a',
            border: isMobile ? 'none' : '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: isMobile ? '0' : '24px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '3px',
              background: 'linear-gradient(90deg, #8b5cf6 0%, #7c3aed 100%)'
            }} />

            <button
              onClick={() => setShowModal(false)}
              style={{
                position: 'absolute',
                top: isMobile ? '1rem' : '1.5rem',
                right: isMobile ? '1rem' : '1.5rem',
                width: isMobile ? '36px' : '40px',
                height: isMobile ? '36px' : '40px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.8) 0%, rgba(23, 23, 23, 0.6) 100%)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(139, 92, 246, 0.4)',
                color: '#8b5cf6',
                fontSize: isMobile ? '1.25rem' : '1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 10,
                boxShadow: '0 4px 16px rgba(139, 92, 246, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.03)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(139, 92, 246, 0.25) 0%, rgba(124, 58, 237, 0.15) 100%)'
                e.currentTarget.style.transform = 'scale(1.05)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(23, 23, 23, 0.8) 0%, rgba(23, 23, 23, 0.6) 100%)'
                e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              ×
            </button>

            <div style={{
              overflowY: 'auto',
              flex: 1,
              padding: isMobile ? '1rem' : '1.5rem'
            }}>
              <AIDaySchedule
                activePlan={activePlan}
                todayMeals={todayMeals}
                todayProgress={todayProgress}
                selectedDay={selectedDay}
                onDayChange={setSelectedDay}
                onCheckMeal={onCheckMeal}
                onUncheckMeal={onUncheckMeal}
                onOpenInfo={onOpenInfo}
                onOpenAlternatives={onOpenAlternatives}
                dayTemplates={dayTemplates}
                db={db}
              />
            </div>

            {/* 🔥 PREMIUM FLOATING BUTTONS CONTAINER */}
            <div style={{
              borderTop: '1px solid rgba(139, 92, 246, 0.15)',
              padding: isMobile ? '0.75rem' : '1rem',
              background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.85) 100%)',
              backdropFilter: 'blur(16px)',
              display: 'flex',
              gap: isMobile ? '0.625rem' : '0.75rem',
              boxShadow: '0 -4px 24px rgba(0, 0, 0, 0.5)'
            }}>
              {/* 🔥 BUTTON 1: PLAN WEEK MET COACH - GREEN */}
              <button
                onClick={() => setShowPlanWizard(true)}
                style={{
                  flex: 1,
                  padding: isMobile ? '0.875rem 1rem' : '1rem 1.25rem',
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.08) 100%)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: isMobile ? '12px' : '14px',
                  cursor: 'pointer',
                  minHeight: '44px',
                  boxShadow: '0 4px 16px rgba(16, 185, 129, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: isMobile ? '0.5rem' : '0.625rem'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(5, 150, 105, 0.15) 100%)'
                  e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(16, 185, 129, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.08) 100%)'
                  e.currentTarget.style.transform = 'translateY(0) scale(1)'
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(16, 185, 129, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                }}
                onTouchStart={(e) => {
                  if (isMobile) e.currentTarget.style.transform = 'scale(0.98)'
                }}
                onTouchEnd={(e) => {
                  if (isMobile) e.currentTarget.style.transform = 'scale(1)'
                }}
              >
                {/* Top shine effect */}
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

                {/* Icon container with green glow */}
                <div style={{
                  width: isMobile ? '28px' : '32px',
                  height: isMobile ? '28px' : '32px',
                  borderRadius: '8px',
                  background: 'rgba(16, 185, 129, 0.2)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 0 12px rgba(16, 185, 129, 0.3)',
                  position: 'relative',
                  zIndex: 2
                }}>
                  <UserCog 
                    size={isMobile ? 14 : 16} 
                    color="#10b981"
                    strokeWidth={2.5}
                    style={{ filter: 'drop-shadow(0 0 4px rgba(16, 185, 129, 0.6))' }}
                  />
                </div>

                {/* Text container */}
                <span style={{
                  color: 'white',
                  fontSize: isMobile ? '0.875rem' : '0.95rem',
                  fontWeight: '800',
                  letterSpacing: '-0.02em',
                  textTransform: 'uppercase',
                  textShadow: '0 2px 8px rgba(0, 0, 0, 0.6)',
                  lineHeight: 1.2,
                  position: 'relative',
                  zIndex: 2
                }}>
                  Plan week met coach
                </span>
              </button>

              {/* 🔥 BUTTON 2: GEBRUIK TEMPLATE - PURPLE */}
              <button
                onClick={() => setShowTemplates(true)}
                style={{
                  flex: 1,
                  padding: isMobile ? '0.875rem 1rem' : '1rem 1.25rem',
                  background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(124, 58, 237, 0.08) 100%)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  borderRadius: isMobile ? '12px' : '14px',
                  cursor: 'pointer',
                  minHeight: '44px',
                  boxShadow: '0 4px 16px rgba(139, 92, 246, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: isMobile ? '0.5rem' : '0.625rem'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(139, 92, 246, 0.25) 0%, rgba(124, 58, 237, 0.15) 100%)'
                  e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(139, 92, 246, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(124, 58, 237, 0.08) 100%)'
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
                {/* Top shine effect */}
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

                {/* Icon container with purple glow */}
                <div style={{
                  width: isMobile ? '28px' : '32px',
                  height: isMobile ? '28px' : '32px',
                  borderRadius: '8px',
                  background: 'rgba(139, 92, 246, 0.2)',
                  border: '1px solid rgba(139, 92, 246, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 0 12px rgba(139, 92, 246, 0.3)',
                  position: 'relative',
                  zIndex: 2
                }}>
                  <FileText 
                    size={isMobile ? 14 : 16} 
                    color="#8b5cf6"
                    strokeWidth={2.5}
                    style={{ filter: 'drop-shadow(0 0 4px rgba(139, 92, 246, 0.6))' }}
                  />
                </div>

                {/* Text container */}
                <span style={{
                  color: 'white',
                  fontSize: isMobile ? '0.875rem' : '0.95rem',
                  fontWeight: '800',
                  letterSpacing: '-0.02em',
                  textTransform: 'uppercase',
                  textShadow: '0 2px 8px rgba(0, 0, 0, 0.6)',
                  lineHeight: 1.2,
                  position: 'relative',
                  zIndex: 2
                }}>
                  Gebruik template
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {showPlanWizard && (
        <MealSetupWizard
          isOpen={showPlanWizard}
          onClose={() => setShowPlanWizard(false)}
          onComplete={() => {
            setShowPlanWizard(false)
            setShowModal(false)
            if (onPlanUpdate) {
              onPlanUpdate()
            }
          }}
          client={client}
          db={db}
          isMobile={isMobile}
        />
      )}

      {showTemplates && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowTemplates(false)
          }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.9)',
            backdropFilter: 'blur(12px)',
            zIndex: 10000,
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
            maxWidth: isMobile ? '100%' : '1400px',
            maxHeight: '95vh',
            background: '#0a0a0a',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: isMobile ? '16px' : '24px',
            overflow: 'hidden'
          }}>
            <button
              onClick={() => setShowTemplates(false)}
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
                zIndex: 10,
                boxShadow: '0 4px 16px rgba(139, 92, 246, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.03)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(124, 58, 237, 0.08) 100%)'
                e.currentTarget.style.transform = 'scale(1.05)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(23, 23, 23, 0.8) 0%, rgba(23, 23, 23, 0.6) 100%)'
                e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              ×
            </button>

            <div style={{
              overflowY: 'auto',
              maxHeight: '95vh',
              padding: isMobile ? '1rem' : '1.5rem'
            }}>
              <DayTemplatesSectionWrapper 
                db={db}
                clientId={client?.id}
                activePlan={activePlan}
                onPlanUpdate={onPlanUpdate}
                onNavigateToDay={handleTemplateApplied}
              />
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </>
  )
}
