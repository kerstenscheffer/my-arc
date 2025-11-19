// src/modules/meal-plan/components/PlanWithCoachSection.jsx
import React, { useState } from 'react'
import { Sparkles } from 'lucide-react'
import MealLibrarySection from './MealLibrarySection'
import MealLoggingWizard from '../../meal-logging-wizard/MealLoggingWizard'
import LogMealButton from '../../meal-logging-wizard/components/LogMealButton'

export default function PlanWithCoachSection({ 
  onOpenWizard, 
  client, 
  db, 
  mealLoggingService,
  onMealCreated, 
  onMealLogged,
  isMobile 
}) {
  // State voor meal logging wizard
  const [showMealLogging, setShowMealLogging] = useState(false)
  
  const handleMealLogged = () => {
    console.log('✅ [PlanWithCoachSection] Meal logged, closing wizard')
    setShowMealLogging(false)
    
    // Call parent callback
    if (onMealLogged) {
      onMealLogged()
    }
  }
  
  return (
    <div style={{
      padding: isMobile ? '0 1rem 1rem' : '0 1.5rem 1.5rem'
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
        gap: isMobile ? '0.75rem' : '1rem'
      }}>
        
        {/* 1. Plan Week Button */}
        <button
          onClick={onOpenWizard}
          style={{
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(124, 58, 237, 0.08) 100%)',
            borderRadius: isMobile ? '14px' : '16px',
            padding: isMobile ? '1rem' : '1.25rem',
            border: '1px solid rgba(139, 92, 246, 0.25)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '0.75rem' : '1rem',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            minHeight: '44px',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 24px rgba(139, 92, 246, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(124, 58, 237, 0.12) 100%)'
            e.currentTarget.style.boxShadow = '0 12px 32px rgba(139, 92, 246, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(124, 58, 237, 0.08) 100%)'
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(139, 92, 246, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
          }}
          onTouchStart={(e) => {
            if (isMobile) {
              e.currentTarget.style.transform = 'scale(0.98)'
            }
          }}
          onTouchEnd={(e) => {
            if (isMobile) {
              e.currentTarget.style.transform = 'scale(1)'
            }
          }}
        >
          {/* Gradient glow effect */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '50%',
            background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.06) 0%, transparent 100%)',
            pointerEvents: 'none'
          }} />
          
          {/* Icon container */}
          <div style={{
            width: isMobile ? '44px' : '52px',
            height: isMobile ? '44px' : '52px',
            borderRadius: isMobile ? '12px' : '14px',
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.25) 0%, rgba(124, 58, 237, 0.15) 100%)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 4px 12px rgba(139, 92, 246, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            flexShrink: 0
          }}>
            <Sparkles 
              size={isMobile ? 22 : 26} 
              color="#a78bfa"
              style={{
                filter: 'drop-shadow(0 0 8px rgba(167, 139, 250, 0.6))'
              }}
            />
          </div>
          
          {/* Text content */}
          <div style={{
            flex: 1,
            textAlign: 'left'
          }}>
            <div style={{
              fontSize: isMobile ? '1rem' : '1.15rem',
              fontWeight: '800',
              color: '#a78bfa',
              marginBottom: '0.15rem',
              letterSpacing: '-0.01em'
            }}>
              Plan Week met Coach
            </div>
            <div style={{
              fontSize: isMobile ? '0.7rem' : '0.75rem',
              color: 'rgba(255, 255, 255, 0.5)',
              fontWeight: '500',
              lineHeight: 1.4
            }}>
              Bouw jouw perfecte weekplan in 5 stappen
            </div>
          </div>
        </button>

        {/* 2. Meal Library Section */}
        <MealLibrarySection 
          client={client}
          db={db}
          onMealCreated={onMealCreated}
        />

        {/* 3. Log Meal Button - Opens wizard */}
        {mealLoggingService && (
          <LogMealButton 
            onClick={() => setShowMealLogging(true)}
            isMobile={isMobile}
          />
        )}
      </div>

      {/* Meal Logging Wizard Modal - Renders outside grid */}
      {showMealLogging && mealLoggingService && (
        <MealLoggingWizard
          client={client}
          db={db}
          mealLoggingService={mealLoggingService}
          onMealLogged={handleMealLogged}
          onClose={() => setShowMealLogging(false)}
        />
      )}
    </div>
  )
}
