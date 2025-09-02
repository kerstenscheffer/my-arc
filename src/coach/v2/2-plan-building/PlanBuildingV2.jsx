// src/coach/v2/2-plan-building/PlanBuildingV2.jsx
// HOOFDPAGINA 2: PLAN BUILDING
// Router voor alle builder functies

import { useState } from 'react'

// Import bestaande builders (mapping) - CORRECTE PATHS
import AIGenerator from '../../../components/AIGenerator'
import CoachMealPlannerDashboard from '../../pages/CoachMealPlannerDashboard'
import ChallengeBuilder from '../../../modules/challenges/ChallengeBuilder'
import CoachVideoTab from '../../../modules/videos/CoachVideoTab'

// Icons
import { 
  Dumbbell, 
  Utensils, 
  Phone, 
  Trophy, 
  Video,
  Plus,
  Save,
  FileText
} from 'lucide-react'

export default function PlanBuildingV2({ 
  db, 
  clients,
  workoutSchemas,
  mealTemplates,
  challenges,
  isMobile,
  refreshData 
}) {
  const [activeBuilder, setActiveBuilder] = useState('workout')
  
  // Builder configuratie met mapping naar bestaande modules
  const builders = [
    {
      id: 'workout',
      label: 'Workout Builder',
      icon: Dumbbell,
      color: '#f97316',
      description: 'Maak workout schema\'s en trainingsplannen',
      component: AIGenerator // Bestaande
    },
    {
      id: 'meal',
      label: 'Meal Planner',
      icon: Utensils,
      color: '#10b981',
      description: 'Ontwerp meal plans en recepten',
      component: CoachMealPlannerDashboard // Bestaande (107KB - later splitsen)
    },
    {
      id: 'call',
      label: 'Call Templates',
      icon: Phone,
      color: '#8b5cf6',
      description: 'Maak call planning templates',
      component: null // CallBuilderV2 (nieuw te maken van CallPlanningComponents)
    },
    {
      id: 'challenge',
      label: 'Challenge Creator',
      icon: Trophy,
      color: '#f59e0b',
      description: 'Ontwerp 30-dagen challenges',
      component: ChallengeBuilder // Bestaande
    },
    {
      id: 'video',
      label: 'Video Library',
      icon: Video,
      color: '#ec4899',
      description: 'Beheer instructie video\'s',
      component: CoachVideoTab // Bestaande
    }
  ]
  
  const currentBuilder = builders.find(b => b.id === activeBuilder)
  
  return (
    <div>
      {/* Builder Navigation */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        marginBottom: '2rem',
        overflowX: 'auto',
        paddingBottom: '0.5rem'
      }}>
        {builders.map(builder => (
          <button
            key={builder.id}
            onClick={() => setActiveBuilder(builder.id)}
            style={{
              minWidth: isMobile ? '140px' : '180px',
              padding: isMobile ? '1rem' : '1.25rem',
              background: activeBuilder === builder.id
                ? `linear-gradient(135deg, ${builder.color}20 0%, ${builder.color}10 100%)`
                : 'rgba(17, 17, 17, 0.5)',
              backdropFilter: 'blur(10px)',
              border: activeBuilder === builder.id
                ? `2px solid ${builder.color}`
                : '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.5rem'
            }}
            onMouseEnter={(e) => {
              if (activeBuilder !== builder.id) {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = `0 10px 30px ${builder.color}20`
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: activeBuilder === builder.id
                ? builder.color
                : 'rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <builder.icon size={20} color="#fff" />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                color: activeBuilder === builder.id ? builder.color : '#fff',
                fontSize: isMobile ? '0.9rem' : '0.95rem',
                fontWeight: '600'
              }}>
                {builder.label}
              </div>
              {!isMobile && (
                <div style={{
                  color: 'rgba(255, 255, 255, 0.5)',
                  fontSize: '0.75rem',
                  marginTop: '0.25rem'
                }}>
                  {builder.description}
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
      
      {/* Stats Bar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          padding: '1rem',
          background: 'rgba(249, 115, 22, 0.1)',
          borderRadius: '12px',
          border: '1px solid rgba(249, 115, 22, 0.2)'
        }}>
          <div style={{ color: '#f97316', fontSize: '1.5rem', fontWeight: '700' }}>
            {workoutSchemas?.length || 0}
          </div>
          <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.85rem' }}>
            Workout Schemas
          </div>
        </div>
        
        <div style={{
          padding: '1rem',
          background: 'rgba(16, 185, 129, 0.1)',
          borderRadius: '12px',
          border: '1px solid rgba(16, 185, 129, 0.2)'
        }}>
          <div style={{ color: '#10b981', fontSize: '1.5rem', fontWeight: '700' }}>
            {mealTemplates?.length || 0}
          </div>
          <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.85rem' }}>
            Meal Templates
          </div>
        </div>
        
        <div style={{
          padding: '1rem',
          background: 'rgba(245, 158, 11, 0.1)',
          borderRadius: '12px',
          border: '1px solid rgba(245, 158, 11, 0.2)'
        }}>
          <div style={{ color: '#f59e0b', fontSize: '1.5rem', fontWeight: '700' }}>
            {challenges?.length || 0}
          </div>
          <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.85rem' }}>
            Challenges
          </div>
        </div>
        
        <div style={{
          padding: '1rem',
          background: 'rgba(59, 130, 246, 0.1)',
          borderRadius: '12px',
          border: '1px solid rgba(59, 130, 246, 0.2)'
        }}>
          <div style={{ color: '#3b82f6', fontSize: '1.5rem', fontWeight: '700' }}>
            {clients?.length || 0}
          </div>
          <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.85rem' }}>
            Active Clients
          </div>
        </div>
      </div>
      
      {/* Builder Content Area */}
      <div style={{
        background: 'rgba(17, 17, 17, 0.5)',
        backdropFilter: 'blur(10px)',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: isMobile ? '1rem' : '2rem',
        minHeight: '500px'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <h2 style={{
            color: currentBuilder.color,
            fontSize: isMobile ? '1.25rem' : '1.5rem',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <currentBuilder.icon size={24} />
            {currentBuilder.label}
          </h2>
          
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button style={{
              padding: '0.5rem 1rem',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <FileText size={16} />
              Templates
            </button>
            <button style={{
              padding: '0.5rem 1rem',
              background: `linear-gradient(135deg, ${currentBuilder.color} 0%, ${currentBuilder.color}dd 100%)`,
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '0.9rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Plus size={16} />
              Nieuw
            </button>
          </div>
        </div>
        
        {/* Render Builder Component */}
        {activeBuilder === 'workout' && (
          <AIGenerator db={db} mode="builder" />
        )}
        
        {activeBuilder === 'meal' && (
          <CoachMealPlannerDashboard />
        )}
        
        {activeBuilder === 'call' && (
          <div style={{ color: 'rgba(255, 255, 255, 0.6)', textAlign: 'center', padding: '3rem' }}>
            <Phone size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
            <p>Call Template Builder komt hier</p>
            <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
              (Te bouwen vanuit CallPlanningComponents)
            </p>
          </div>
        )}
        
        {activeBuilder === 'challenge' && (
          <ChallengeBuilder
            db={db}
            onSave={(challenge) => {
              console.log('Challenge created:', challenge)
              refreshData()
            }}
          />
        )}
        
        {activeBuilder === 'video' && (
          <CoachVideoTab
            clients={clients}
            db={db}
          />
        )}
      </div>
    </div>
  )
}
