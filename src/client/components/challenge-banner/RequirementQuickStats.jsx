// src/client/components/challenge-banner/RequirementQuickStats.jsx
import { Activity, Utensils, Weight, Camera, Phone, CheckCircle } from 'lucide-react'

export default function RequirementQuickStats({ isMobile, requirements, expanded, theme }) {
  
  const requirementCards = [
    { id: 'workouts', icon: Activity, label: 'Workouts', data: requirements.workouts, unit: 'sessions' },
    { id: 'meals', icon: Utensils, label: 'Meal Days', data: requirements.meals, unit: 'dagen' },
    { id: 'weights', icon: Weight, label: 'Weigh-ins', data: requirements.weights, unit: 'vrijdagen' },
    { id: 'photos', icon: Camera, label: 'Photos', data: requirements.photos, unit: 'vrijdag sets' },
    { id: 'calls', icon: Phone, label: 'Calls', data: requirements.calls, unit: 'calls' }
  ]
  
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(5, 1fr)',
      gap: isMobile ? '0.5rem' : '0.75rem',
      marginBottom: expanded ? (isMobile ? '1.25rem' : '1.5rem') : 0
    }}>
      {requirementCards.map(req => (
        <div 
          key={req.id}
          style={{
            background: 'rgba(0, 0, 0, 0.5)',
            borderRadius: isMobile ? '10px' : '12px',
            padding: isMobile ? '0.75rem 0.5rem' : '1rem 0.75rem',
            backdropFilter: 'blur(10px)',
            border: req.data.met 
              ? `1px solid ${theme.border}`
              : '1px solid rgba(255, 255, 255, 0.05)',
            textAlign: 'center',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            cursor: 'default',
            minHeight: '44px',
            touchAction: 'manipulation',
            boxShadow: req.data.met ? `0 4px 20px ${theme.primary}15` : 'none'
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
          {req.data.met ? (
            <CheckCircle 
              size={isMobile ? 16 : 18} 
              color={theme.primary} 
              style={{ 
                marginBottom: '0.375rem',
                filter: `drop-shadow(0 0 8px ${theme.primary}40)`
              }} 
            />
          ) : (
            <req.icon 
              size={isMobile ? 16 : 18} 
              color="rgba(255, 255, 255, 0.5)" 
              style={{ marginBottom: '0.375rem' }} 
            />
          )}
          <div style={{
            fontSize: isMobile ? '0.8rem' : '0.9rem',
            fontWeight: '700',
            color: req.data.met ? theme.primary : '#fff',
            marginBottom: '0.25rem',
            lineHeight: 1,
            filter: req.data.met ? `drop-shadow(0 0 8px ${theme.primary}30)` : 'none'
          }}>
            {req.data.current}/{req.data.required}
          </div>
          <div style={{
            height: '3px',
            background: 'rgba(255,255,255,0.08)',
            borderRadius: '2px',
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
  )
}
