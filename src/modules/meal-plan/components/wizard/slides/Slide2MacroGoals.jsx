// src/modules/meal-plan/components/wizard/slides/Slide2MacroGoals.jsx
// Slide 2: Macro Doelen Display

import CoachBubble from '../shared/CoachBubble'
import { Activity, Zap, Wheat, Droplet } from 'lucide-react'

export default function Slide2MacroGoals({ client }) {
  const isMobile = window.innerWidth <= 768
  
  // Extract macro targets from client
  const calories = client?.target_calories || 2200
  const protein = client?.target_protein || 165
  const carbs = client?.target_carbs || 250
  const fat = client?.target_fat || 70
  
  const primaryGoal = client?.primary_goal || 'maintain'
  const currentWeight = client?.current_weight || 80
  const targetWeight = client?.target_weight || 75
  
  // Goal-specific coach messages
  const coachMessages = {
    fat_loss: `Op basis van je huidige gewicht (${currentWeight}kg) en doel (${targetWeight}kg) heb ik deze macro's berekend. Met een calorie deficit ga je gezond afvallen terwijl je spiermassa behoudt.`,
    muscle_gain: `Met ${calories} calorieën en ${protein}g eiwit per dag creëer je een optimale omgeving voor spiergroei. Je zit in een calorie surplus met genoeg bouwstoffen voor massa!`,
    maintain: `Deze macro's zorgen ervoor dat je je huidige gewicht behoudt terwijl je fit en gezond blijft. Perfect voor onderhoud van je resultaten.`,
    strength: `Met deze macro verdeling heb je genoeg energie voor krachtige trainingen en voldoende eiwit voor herstel en kracht opbouw.`
  }
  
  const coachMessage = coachMessages[primaryGoal] || coachMessages.maintain
  
  // Macro cards data
  const macroCards = [
    {
      label: 'Calorieën',
      value: calories,
      unit: 'kcal',
      color: '#f97316',
      gradient: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
      icon: Activity,
      description: 'Dagelijkse energie'
    },
    {
      label: 'Eiwitten',
      value: protein,
      unit: 'gram',
      color: '#8b5cf6',
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
      icon: Zap,
      description: 'Spiergroei & herstel'
    },
    {
      label: 'Koolhydraten',
      value: carbs,
      unit: 'gram',
      color: '#3b82f6',
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      icon: Wheat,
      description: 'Energie & prestatie'
    },
    {
      label: 'Vetten',
      value: fat,
      unit: 'gram',
      color: '#10b981',
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      icon: Droplet,
      description: 'Hormonen & verzadiging'
    }
  ]
  
  return (
    <div style={{
      width: '100%',
      padding: isMobile ? '1rem 0' : '1.5rem 0'
    }}>
      {/* Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: isMobile ? '1.5rem' : '2rem'
      }}>
        <div style={{
          fontSize: isMobile ? '2.5rem' : '3rem',
          marginBottom: isMobile ? '0.75rem' : '1rem'
        }}>
          🎯
        </div>
        
        <h1 style={{
          fontSize: isMobile ? '1.5rem' : '2rem',
          fontWeight: '900',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          margin: '0 0 0.5rem 0',
          letterSpacing: '-0.02em'
        }}>
          Jouw Macro Doelen
        </h1>
        
        <p style={{
          fontSize: isMobile ? '0.9rem' : '1rem',
          color: 'rgba(255, 255, 255, 0.7)',
          margin: 0,
          fontWeight: '500'
        }}>
          Deze targets helpen jou {primaryGoal === 'fat_loss' ? 'afvallen' : primaryGoal === 'muscle_gain' ? 'massa opbouwen' : 'je doelen bereiken'}
        </p>
      </div>
      
      {/* Coach Message */}
      <CoachBubble 
        message={coachMessage}
        variant="info"
      />
      
      {/* Macro Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
        gap: isMobile ? '0.875rem' : '1rem',
        marginBottom: isMobile ? '2rem' : '2.5rem'
      }}>
        {macroCards.map((macro, index) => {
          const Icon = macro.icon
          
          return (
            <div
              key={index}
              style={{
                position: 'relative',
                padding: isMobile ? '1.25rem 1rem' : '1.5rem 1.25rem',
                background: 'rgba(17, 17, 17, 0.6)',
                backdropFilter: 'blur(20px)',
                border: `1px solid ${macro.color}20`,
                borderRadius: isMobile ? '16px' : '18px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                overflow: 'hidden',
                
                // Hardware acceleration
                transform: 'translateZ(0)'
              }}
              onMouseEnter={(e) => {
                if (!isMobile) {
                  e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)'
                  e.currentTarget.style.boxShadow = `0 12px 30px ${macro.color}40`
                  e.currentTarget.style.borderColor = `${macro.color}40`
                }
              }}
              onMouseLeave={(e) => {
                if (!isMobile) {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)'
                  e.currentTarget.style.boxShadow = 'none'
                  e.currentTarget.style.borderColor = `${macro.color}20`
                }
              }}
            >
              {/* Background gradient blob */}
              <div style={{
                position: 'absolute',
                top: '-50%',
                right: '-50%',
                width: '150%',
                height: '150%',
                background: `radial-gradient(circle, ${macro.color}15 0%, transparent 60%)`,
                pointerEvents: 'none'
              }} />
              
              {/* Icon */}
              <div style={{
                marginBottom: isMobile ? '0.75rem' : '1rem',
                display: 'flex',
                justifyContent: 'center'
              }}>
                <div style={{
                  width: isMobile ? '40px' : '48px',
                  height: isMobile ? '40px' : '48px',
                  borderRadius: '50%',
                  background: macro.gradient,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 4px 15px ${macro.color}40`
                }}>
                  <Icon size={isMobile ? 20 : 24} color="#fff" />
                </div>
              </div>
              
              {/* Value */}
              <div style={{
                textAlign: 'center',
                marginBottom: isMobile ? '0.5rem' : '0.625rem'
              }}>
                <div style={{
                  fontSize: isMobile ? '1.75rem' : '2.25rem',
                  fontWeight: '900',
                  color: macro.color,
                  lineHeight: 1,
                  letterSpacing: '-0.02em'
                }}>
                  {macro.value}
                </div>
                <div style={{
                  fontSize: isMobile ? '0.7rem' : '0.75rem',
                  color: 'rgba(255, 255, 255, 0.4)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontWeight: '700',
                  marginTop: '0.25rem'
                }}>
                  {macro.unit}
                </div>
              </div>
              
              {/* Label */}
              <div style={{
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: isMobile ? '0.85rem' : '0.9rem',
                  fontWeight: '700',
                  color: '#fff',
                  marginBottom: '0.25rem'
                }}>
                  {macro.label}
                </div>
                <div style={{
                  fontSize: isMobile ? '0.7rem' : '0.75rem',
                  color: 'rgba(255, 255, 255, 0.5)',
                  lineHeight: '1.3'
                }}>
                  {macro.description}
                </div>
              </div>
            </div>
          )
        })}
      </div>
      
      {/* Info Box */}
      <div style={{
        padding: isMobile ? '1.25rem' : '1.5rem',
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
        border: '1px solid rgba(16, 185, 129, 0.2)',
        borderRadius: isMobile ? '14px' : '16px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: isMobile ? '0.875rem' : '1rem'
      }}>
        <div style={{
          fontSize: isMobile ? '1.5rem' : '1.75rem',
          flexShrink: 0
        }}>
          💡
        </div>
        <div>
          <h3 style={{
            fontSize: isMobile ? '0.95rem' : '1.05rem',
            fontWeight: '700',
            color: '#10b981',
            margin: '0 0 0.5rem 0'
          }}>
            Belangrijk om te weten
          </h3>
          <p style={{
            fontSize: isMobile ? '0.85rem' : '0.9rem',
            color: 'rgba(255, 255, 255, 0.8)',
            margin: 0,
            lineHeight: '1.6'
          }}>
            Deze macro's zijn een startpunt. We gaan nu samen kijken naar <strong style={{ color: '#10b981' }}>hoe</strong> je 
            deze targets het beste kunt halen door de juiste maaltijd structuur en ingrediënten te kiezen.
          </p>
        </div>
      </div>
    </div>
  )
}
