// src/coach/v2/3-tracking/TrackingV2.jsx
// HOOFDPAGINA 3: TRACKING & ANALYTICS
// Router voor alle tracking functies

import { useState } from 'react'

// Import bestaande tracking modules - CORRECTE PATHS
import WorkoutLogModule from '../../../modules/progress/workout/WorkoutLogModule'
import CoachProgressTab from '../../../modules/progress/CoachProgressTab'

// Icons voor tracking
import { 
  Activity,
  Coffee,
  PhoneCall,
  PlayCircle,
  Target,
  TrendingUp,
  Calendar,
  BarChart2
} from 'lucide-react'

export default function TrackingV2({ 
  db, 
  clients,
  selectedClient,
  setSelectedClient,
  isMobile,
  refreshData 
}) {
  const [activeTracking, setActiveTracking] = useState('workout')
  
  // Tracking configuratie
  const trackingTypes = [
    {
      id: 'workout',
      label: 'Workout Logs',
      icon: Activity,
      color: '#f97316',
      description: 'Workout completion en progress data',
      hasData: true
    },
    {
      id: 'meal',
      label: 'Nutrition',
      icon: Coffee,
      color: '#10b981',
      description: 'Meal logs, water intake, macro tracking',
      hasData: false // Nog te bouwen
    },
    {
      id: 'calls',
      label: 'Call History',
      icon: PhoneCall,
      color: '#8b5cf6',
      description: 'Gesprekken overzicht en notities',
      hasData: false // Nog te bouwen
    },
    {
      id: 'videos',
      label: 'Video Analytics',
      icon: PlayCircle,
      color: '#ec4899',
      description: 'Video views en engagement',
      hasData: false // Nog te bouwen
    },
    {
      id: 'challenges',
      label: 'Challenge Progress',
      icon: Target,
      color: '#f59e0b',
      description: 'Challenge milestones en scores',
      hasData: true
    }
  ]
  
  const currentTracking = trackingTypes.find(t => t.id === activeTracking)
  
  // Client selector voor tracking
  const ClientSelectorMini = () => (
    <div style={{
      marginBottom: '1.5rem',
      padding: '1rem',
      background: 'rgba(255, 255, 255, 0.05)',
      borderRadius: '12px',
      border: '1px solid rgba(255, 255, 255, 0.1)'
    }}>
      <label style={{
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: '0.85rem',
        display: 'block',
        marginBottom: '0.5rem'
      }}>
        Bekijk data voor:
      </label>
      <select
        value={selectedClient?.id || ''}
        onChange={(e) => {
          const client = clients.find(c => c.id === e.target.value)
          setSelectedClient(client)
        }}
        style={{
          width: '100%',
          padding: '0.75rem',
          background: 'rgba(17, 17, 17, 0.8)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '8px',
          color: '#fff',
          fontSize: '0.95rem'
        }}
      >
        <option value="">Alle clients</option>
        {clients.map(client => (
          <option key={client.id} value={client.id}>
            {client.first_name} {client.last_name}
          </option>
        ))}
      </select>
    </div>
  )
  
  return (
    <div>
      {/* Tracking Type Navigation */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(5, 1fr)',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        {trackingTypes.map(type => (
          <button
            key={type.id}
            onClick={() => setActiveTracking(type.id)}
            style={{
              padding: '1rem',
              background: activeTracking === type.id
                ? `linear-gradient(135deg, ${type.color}20 0%, ${type.color}10 100%)`
                : 'rgba(17, 17, 17, 0.5)',
              backdropFilter: 'blur(10px)',
              border: activeTracking === type.id
                ? `2px solid ${type.color}`
                : '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative'
            }}
            onMouseEnter={(e) => {
              if (activeTracking !== type.id) {
                e.currentTarget.style.transform = 'translateY(-2px)'
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <type.icon 
                size={24} 
                color={activeTracking === type.id ? type.color : 'rgba(255, 255, 255, 0.7)'} 
              />
              <span style={{
                color: activeTracking === type.id ? type.color : '#fff',
                fontSize: isMobile ? '0.85rem' : '0.9rem',
                fontWeight: activeTracking === type.id ? '600' : '500'
              }}>
                {type.label}
              </span>
            </div>
            
            {!type.hasData && (
              <div style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                padding: '2px 6px',
                background: 'rgba(245, 158, 11, 0.2)',
                borderRadius: '4px',
                fontSize: '0.7rem',
                color: '#f59e0b'
              }}>
                Soon
              </div>
            )}
          </button>
        ))}
      </div>
      
      {/* Quick Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          padding: '1rem',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
          borderRadius: '12px',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <TrendingUp size={24} color="#10b981" />
          <div>
            <div style={{ color: '#10b981', fontSize: '1.25rem', fontWeight: '700' }}>
              87%
            </div>
            <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.75rem' }}>
              Avg Compliance
            </div>
          </div>
        </div>
        
        <div style={{
          padding: '1rem',
          background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.1) 0%, rgba(249, 115, 22, 0.05) 100%)',
          borderRadius: '12px',
          border: '1px solid rgba(249, 115, 22, 0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <Activity size={24} color="#f97316" />
          <div>
            <div style={{ color: '#f97316', fontSize: '1.25rem', fontWeight: '700' }}>
              324
            </div>
            <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.75rem' }}>
              Workouts Logged
            </div>
          </div>
        </div>
        
        <div style={{
          padding: '1rem',
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)',
          borderRadius: '12px',
          border: '1px solid rgba(139, 92, 246, 0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <Calendar size={24} color="#8b5cf6" />
          <div>
            <div style={{ color: '#8b5cf6', fontSize: '1.25rem', fontWeight: '700' }}>
              28
            </div>
            <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.75rem' }}>
              Calls This Month
            </div>
          </div>
        </div>
        
        <div style={{
          padding: '1rem',
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)',
          borderRadius: '12px',
          border: '1px solid rgba(245, 158, 11, 0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <Target size={24} color="#f59e0b" />
          <div>
            <div style={{ color: '#f59e0b', fontSize: '1.25rem', fontWeight: '700' }}>
              12
            </div>
            <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.75rem' }}>
              Active Challenges
            </div>
          </div>
        </div>
      </div>
      
      {/* Tracking Content Area */}
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
          marginBottom: '1.5rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <h2 style={{
            color: currentTracking.color,
            fontSize: isMobile ? '1.25rem' : '1.5rem',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <currentTracking.icon size={24} />
            {currentTracking.label}
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
              <Calendar size={16} />
              Period
            </button>
            <button style={{
              padding: '0.5rem 1rem',
              background: `linear-gradient(135deg, ${currentTracking.color} 0%, ${currentTracking.color}dd 100%)`,
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
              <BarChart2 size={16} />
              Export
            </button>
          </div>
        </div>
        
        {/* Client Selector */}
        <ClientSelectorMini />
        
        {/* Render Tracking Component */}
        {activeTracking === 'workout' && (
          selectedClient ? (
            <WorkoutLogModule 
              client={selectedClient} 
              db={db} 
            />
          ) : (
            <CoachProgressTab db={db} />
          )
        )}
        
        {activeTracking === 'meal' && (
          <div style={{
            padding: '3rem',
            textAlign: 'center',
            color: 'rgba(255, 255, 255, 0.6)'
          }}>
            <Coffee size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
            <h3 style={{ color: '#fff', marginBottom: '0.5rem' }}>
              Nutrition Tracking Module
            </h3>
            <p>Meal logs, water intake en macro tracking komen hier</p>
            <p style={{ fontSize: '0.85rem', marginTop: '1rem', opacity: 0.7 }}>
              Folder: src/coach/v2/3-tracking/pages/MealTrackingV2.jsx
            </p>
          </div>
        )}
        
        {activeTracking === 'calls' && (
          <div style={{
            padding: '3rem',
            textAlign: 'center',
            color: 'rgba(255, 255, 255, 0.6)'
          }}>
            <PhoneCall size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
            <h3 style={{ color: '#fff', marginBottom: '0.5rem' }}>
              Call History & Analytics
            </h3>
            <p>Gesprekken overzicht en notities komen hier</p>
            <p style={{ fontSize: '0.85rem', marginTop: '1rem', opacity: 0.7 }}>
              Folder: src/coach/v2/3-tracking/pages/CallTrackingV2.jsx
            </p>
          </div>
        )}
        
        {activeTracking === 'videos' && (
          <div style={{
            padding: '3rem',
            textAlign: 'center',
            color: 'rgba(255, 255, 255, 0.6)'
          }}>
            <PlayCircle size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
            <h3 style={{ color: '#fff', marginBottom: '0.5rem' }}>
              Video Analytics Dashboard
            </h3>
            <p>Video views, engagement en completion rates komen hier</p>
            <p style={{ fontSize: '0.85rem', marginTop: '1rem', opacity: 0.7 }}>
              Folder: src/coach/v2/3-tracking/pages/VideoTrackingV2.jsx
            </p>
          </div>
        )}
        
        {activeTracking === 'challenges' && (
          selectedClient ? (
            <div>
              <h3 style={{ color: '#fff', marginBottom: '1rem' }}>
                Challenge Progress voor {selectedClient.first_name}
              </h3>
              {/* Challenge tracking component hier */}
              <p style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                Challenge progress tracking komt hier
              </p>
            </div>
          ) : (
            <div>
              <h3 style={{ color: '#fff', marginBottom: '1rem' }}>
                All Challenges Overview
              </h3>
              <CoachProgressTab db={db} />
            </div>
          )
        )}
      </div>
    </div>
  )
}
