// src/client/components/challenge-banner/RequirementDetailCards.jsx
import { Activity, Utensils, Weight, Camera, Phone, CheckCircle, Clock } from 'lucide-react'

export default function RequirementDetailCards({ isMobile, requirements, challengeData, theme }) {
  
  const requirementCards = [
    { id: 'workouts', icon: Activity, label: 'Workouts', data: requirements.workouts, unit: 'sessions' },
    { id: 'meals', icon: Utensils, label: 'Meal Days', data: requirements.meals, unit: 'dagen' },
    { id: 'weights', icon: Weight, label: 'Weigh-ins', data: requirements.weights, unit: 'vrijdagen' },
    { id: 'photos', icon: Camera, label: 'Photos', data: requirements.photos, unit: 'vrijdag sets' },
    { id: 'calls', icon: Phone, label: 'Calls', data: requirements.calls, unit: 'calls' }
  ]
  
  return (
    <>
      {/* Detailed Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
        gap: isMobile ? '0.75rem' : '1rem'
      }}>
        {requirementCards.map(req => (
          <div key={req.id} style={{
            background: 'rgba(0, 0, 0, 0.5)',
            borderRadius: isMobile ? '12px' : '14px',
            padding: isMobile ? '1rem' : '1.25rem',
            backdropFilter: 'blur(10px)',
            border: req.data.met 
              ? `1px solid ${theme.border}`
              : '1px solid rgba(255, 255, 255, 0.05)',
            boxShadow: req.data.met ? `0 4px 20px ${theme.primary}15` : 'none',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = req.data.met 
              ? `0 8px 30px ${theme.primary}20`
              : '0 4px 20px rgba(0, 0, 0, 0.5)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = req.data.met 
              ? `0 4px 20px ${theme.primary}15`
              : 'none'
          }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.75rem'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <req.icon 
                  size={isMobile ? 18 : 20} 
                  color={req.data.met ? theme.primary : 'rgba(255,255,255,0.5)'} 
                />
                <span style={{
                  fontSize: isMobile ? '0.9rem' : '1rem',
                  fontWeight: '700',
                  color: req.data.met ? theme.primary : 'rgba(255,255,255,0.9)',
                  filter: req.data.met ? `drop-shadow(0 0 8px ${theme.primary}30)` : 'none'
                }}>
                  {req.label}
                </span>
              </div>
              {req.data.met && (
                <CheckCircle 
                  size={16} 
                  color={theme.primary} 
                  strokeWidth={2.5} 
                  style={{
                    filter: `drop-shadow(0 0 8px ${theme.primary}40)`
                  }}
                />
              )}
            </div>
            
            <div style={{
              fontSize: isMobile ? '1.5rem' : '1.75rem',
              fontWeight: '800',
              color: req.data.met ? theme.primary : '#fff',
              marginBottom: '0.25rem',
              lineHeight: 1,
              filter: req.data.met ? `drop-shadow(0 0 12px ${theme.primary}30)` : 'none'
            }}>
              {req.data.current}/{req.data.required}
              <span style={{
                fontSize: isMobile ? '0.7rem' : '0.75rem',
                fontWeight: '500',
                marginLeft: '0.5rem',
                color: 'rgba(255, 215, 0, 0.5)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                {req.unit}
              </span>
            </div>
            
            <div style={{
              height: '6px',
              background: 'rgba(255,255,255,0.08)',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                width: `${req.data.percentage}%`,
                background: req.data.met 
                  ? theme.gradient
                  : 'linear-gradient(90deg, #dc2626 0%, #ef4444 100%)',
                transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
              }} />
            </div>
          </div>
        ))}
      </div>
      
      {/* Time Warning */}
      {challengeData && requirements.daysRemaining <= 14 && requirements.daysRemaining > 0 && (
        <div style={{
          background: 'rgba(249, 115, 22, 0.15)',
          borderRadius: isMobile ? '12px' : '14px',
          padding: isMobile ? '1rem' : '1.25rem',
          border: '1px solid rgba(249, 115, 22, 0.25)',
          marginTop: isMobile ? '1rem' : '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <Clock size={isMobile ? 18 : 20} color="#f97316" />
          <div>
            <div style={{
              fontSize: isMobile ? '0.9rem' : '1rem',
              fontWeight: '600',
              color: '#f97316'
            }}>
              Laatste {requirements.daysRemaining} dagen!
            </div>
            <div style={{
              fontSize: isMobile ? '0.75rem' : '0.8rem',
              color: 'rgba(255, 255, 255, 0.6)'
            }}>
              Focus op de requirements die nog niet voltooid zijn
            </div>
          </div>
        </div>
      )}
    </>
  )
}
