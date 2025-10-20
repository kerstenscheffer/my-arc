// src/modules/workout/components/ExerciseInfoModal.jsx
import { useState } from 'react'
import { X, Info, Target, AlertTriangle, TrendingUp, Dumbbell } from 'lucide-react'

export default function ExerciseInfoModal({ exercise, onClose, db, isMobile }) {
  const [activeTab, setActiveTab] = useState('info')
  
  const tabs = [
    { id: 'info', label: 'Info', icon: Info },
    { id: 'muscles', label: 'Muscles', icon: Target },
    { id: 'tips', label: 'Tips', icon: TrendingUp },
    { id: 'mistakes', label: 'Mistakes', icon: AlertTriangle }
  ]
  
  // Mock data - In production, fetch from database
  const exerciseInfo = {
    description: `${exercise.name} is een fundamentele oefening voor kracht en spieropbouw. Focus op controlled movement en juiste vorm voor maximale resultaten.`,
    
    primaryMuscles: exercise.primairSpieren ? [exercise.primairSpieren] : ['Chest'],
    secondaryMuscles: ['Shoulders', 'Triceps'],
    
    formTips: [
      'Houd je core strak gedurende de hele beweging',
      'Adem in tijdens de eccentrische fase',
      'Adem uit tijdens de concentrische fase',
      'Behoud constante spanning op de spieren',
      'Full range of motion voor maximale muscle activation'
    ],
    
    commonMistakes: [
      'Te snel bewegen - gebruik controlled tempo',
      'Niet volledig uitstrekken - ga voor full ROM',
      'Verkeerde grip breedte - pas aan op comfort',
      'Geen warming-up - altijd eerst opwarmen',
      'Te zwaar gewicht - vorm > gewicht'
    ],
    
    equipment: exercise.equipment || 'Barbell',
    difficulty: 'Intermediate',
    
    variations: [
      'Incline variant voor upper chest',
      'Decline variant voor lower chest',
      'Dumbbell variant voor meer ROM',
      'Close-grip voor triceps focus'
    ]
  }
  
  const getMuscleColor = (isPrimary) => isPrimary ? '#f97316' : '#3b82f6'
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.95)',
      backdropFilter: 'blur(20px)',
      zIndex: 2000,
      display: 'flex',
      flexDirection: 'column',
      animation: 'fadeIn 0.2s ease'
    }}>
      {/* Header */}
      <div style={{
        padding: isMobile ? '1rem' : '1.5rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        background: 'linear-gradient(180deg, rgba(17, 17, 17, 0.98) 0%, rgba(10, 10, 10, 0.98) 100%)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1rem'
        }}>
          <h3 style={{
            fontSize: isMobile ? '1.1rem' : '1.25rem',
            fontWeight: '700',
            color: '#fff',
            margin: 0
          }}>
            {exercise.name}
          </h3>
          
          <button
            onClick={onClose}
            style={{
              width: isMobile ? '36px' : '40px',
              height: isMobile ? '36px' : '40px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <X size={18} color="rgba(255, 255, 255, 0.7)" />
          </button>
        </div>
        
        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}>
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: isMobile ? '0.5rem 0.875rem' : '0.6rem 1rem',
                  background: activeTab === tab.id
                    ? 'linear-gradient(135deg, rgba(249, 115, 22, 0.15) 0%, rgba(249, 115, 22, 0.08) 100%)'
                    : 'rgba(255, 255, 255, 0.03)',
                  border: `1px solid ${activeTab === tab.id ? 'rgba(249, 115, 22, 0.3)' : 'rgba(255, 255, 255, 0.08)'}`,
                  borderRadius: '10px',
                  color: activeTab === tab.id ? '#f97316' : 'rgba(255, 255, 255, 0.6)',
                  fontSize: isMobile ? '0.85rem' : '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  whiteSpace: 'nowrap',
                  flexShrink: 0
                }}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>
      
      {/* Content */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: isMobile ? '1rem' : '1.5rem',
        WebkitOverflowScrolling: 'touch'
      }}>
        {/* Info Tab */}
        {activeTab === 'info' && (
          <div style={{ animation: 'slideIn 0.3s ease' }}>
            {/* Description */}
            <div style={{
              marginBottom: '1.5rem',
              padding: isMobile ? '1rem' : '1.25rem',
              background: 'rgba(17, 17, 17, 0.5)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <p style={{
                fontSize: isMobile ? '0.95rem' : '1rem',
                color: 'rgba(255, 255, 255, 0.8)',
                lineHeight: 1.6,
                margin: 0
              }}>
                {exerciseInfo.description}
              </p>
            </div>
            
            {/* Quick Stats */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
              gap: '1rem',
              marginBottom: '1.5rem'
            }}>
              <StatCard
                label="Equipment"
                value={exerciseInfo.equipment}
                icon={Dumbbell}
                color="#f97316"
                isMobile={isMobile}
              />
              <StatCard
                label="Difficulty"
                value={exerciseInfo.difficulty}
                icon={TrendingUp}
                color="#10b981"
                isMobile={isMobile}
              />
            </div>
            
            {/* Variations */}
            <div>
              <h4 style={{
                fontSize: '0.9rem',
                color: '#f97316',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '0.75rem'
              }}>
                Variaties
              </h4>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}>
                {exerciseInfo.variations.map((variation, idx) => (
                  <div key={idx} style={{
                    padding: '0.75rem',
                    background: 'rgba(249, 115, 22, 0.05)',
                    borderRadius: '10px',
                    border: '1px solid rgba(249, 115, 22, 0.1)',
                    fontSize: isMobile ? '0.85rem' : '0.9rem',
                    color: 'rgba(255, 255, 255, 0.7)'
                  }}>
                    • {variation}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Muscles Tab */}
        {activeTab === 'muscles' && (
          <div style={{ animation: 'slideIn 0.3s ease' }}>
            <div style={{
              marginBottom: '1.5rem'
            }}>
              <h4 style={{
                fontSize: '0.9rem',
                color: '#f97316',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '0.75rem'
              }}>
                Primaire Spieren
              </h4>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.5rem'
              }}>
                {exerciseInfo.primaryMuscles.map((muscle, idx) => (
                  <div key={idx} style={{
                    padding: isMobile ? '0.5rem 1rem' : '0.6rem 1.25rem',
                    background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.15) 0%, rgba(249, 115, 22, 0.08) 100%)',
                    border: '1px solid rgba(249, 115, 22, 0.25)',
                    borderRadius: '20px',
                    fontSize: isMobile ? '0.9rem' : '0.95rem',
                    fontWeight: '600',
                    color: '#f97316'
                  }}>
                    {muscle}
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 style={{
                fontSize: '0.9rem',
                color: '#3b82f6',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '0.75rem'
              }}>
                Secundaire Spieren
              </h4>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.5rem'
              }}>
                {exerciseInfo.secondaryMuscles.map((muscle, idx) => (
                  <div key={idx} style={{
                    padding: isMobile ? '0.5rem 1rem' : '0.6rem 1.25rem',
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.08) 100%)',
                    border: '1px solid rgba(59, 130, 246, 0.25)',
                    borderRadius: '20px',
                    fontSize: isMobile ? '0.9rem' : '0.95rem',
                    fontWeight: '600',
                    color: '#3b82f6'
                  }}>
                    {muscle}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Visual muscle diagram placeholder */}
            <div style={{
              marginTop: '2rem',
              padding: '2rem',
              background: 'rgba(17, 17, 17, 0.5)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              textAlign: 'center'
            }}>
              <Target size={48} color="rgba(249, 115, 22, 0.3)" style={{ marginBottom: '1rem' }} />
              <p style={{
                fontSize: '0.9rem',
                color: 'rgba(255, 255, 255, 0.5)'
              }}>
                Muscle diagram komt binnenkort
              </p>
            </div>
          </div>
        )}
        
        {/* Tips Tab */}
        {activeTab === 'tips' && (
          <div style={{ animation: 'slideIn 0.3s ease' }}>
            <h4 style={{
              fontSize: '0.9rem',
              color: '#10b981',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '1rem'
            }}>
              Form Tips
            </h4>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}>
              {exerciseInfo.formTips.map((tip, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  gap: '0.75rem',
                  padding: isMobile ? '0.875rem' : '1rem',
                  background: 'rgba(16, 185, 129, 0.05)',
                  borderRadius: '12px',
                  border: '1px solid rgba(16, 185, 129, 0.1)'
                }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    color: '#fff'
                  }}>
                    {idx + 1}
                  </div>
                  <p style={{
                    fontSize: isMobile ? '0.9rem' : '0.95rem',
                    color: 'rgba(255, 255, 255, 0.8)',
                    margin: 0,
                    lineHeight: 1.5
                  }}>
                    {tip}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Mistakes Tab */}
        {activeTab === 'mistakes' && (
          <div style={{ animation: 'slideIn 0.3s ease' }}>
            <h4 style={{
              fontSize: '0.9rem',
              color: '#ef4444',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '1rem'
            }}>
              Veelgemaakte Fouten
            </h4>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}>
              {exerciseInfo.commonMistakes.map((mistake, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  gap: '0.75rem',
                  padding: isMobile ? '0.875rem' : '1rem',
                  background: 'rgba(239, 68, 68, 0.05)',
                  borderRadius: '12px',
                  border: '1px solid rgba(239, 68, 68, 0.1)'
                }}>
                  <AlertTriangle 
                    size={20} 
                    color="#ef4444" 
                    style={{ flexShrink: 0, marginTop: '2px' }} 
                  />
                  <p style={{
                    fontSize: isMobile ? '0.9rem' : '0.95rem',
                    color: 'rgba(255, 255, 255, 0.8)',
                    margin: 0,
                    lineHeight: 1.5
                  }}>
                    {mistake}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideIn {
          from { 
            opacity: 0;
            transform: translateX(10px);
          }
          to { 
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        /* Hide scrollbar for tab navigation */
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  )
}

// Stat Card Component
function StatCard({ label, value, icon: Icon, color, isMobile }) {
  return (
    <div style={{
      padding: isMobile ? '0.875rem' : '1rem',
      background: 'rgba(17, 17, 17, 0.5)',
      borderRadius: '12px',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem'
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        borderRadius: '10px',
        background: `linear-gradient(135deg, ${color}20 0%, ${color}10 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Icon size={20} color={color} />
      </div>
      <div>
        <div style={{
          fontSize: '0.75rem',
          color: 'rgba(255, 255, 255, 0.4)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: '0.1rem'
        }}>
          {label}
        </div>
        <div style={{
          fontSize: isMobile ? '0.95rem' : '1rem',
          fontWeight: '700',
          color: 'white'
        }}>
          {value}
        </div>
      </div>
    </div>
  )
}
