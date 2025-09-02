// src/modules/progress/workout/components/ProgressWidgetSection.jsx
// TODAY'S PROGRESS WIDGET - Toont dagelijkse voortgang en quick log trigger

import { Clock, Activity, TrendingUp, ChevronRight, Target } from 'lucide-react'
import { THEME } from '../WorkoutLogModule'

export default function ProgressWidgetSection({ 
  todaysWorkout, 
  quickStats, 
  todaysLogs, 
  onOpenQuickModal, 
  isMobile 
}) {
  
  // No workout today and nothing logged
  if (!todaysWorkout && todaysLogs.length === 0) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, rgba(71, 85, 105, 0.08) 0%, rgba(51, 65, 85, 0.04) 100%)',
        borderRadius: '16px',
        padding: isMobile ? '1rem' : '1.25rem',
        border: '1px solid rgba(148, 163, 184, 0.1)',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        backdropFilter: 'blur(10px)',
        marginBottom: '1.5rem',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent'
      }}
      onClick={onOpenQuickModal}
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
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? '0.75rem' : '1rem'
        }}>
          <div style={{
            width: isMobile ? '36px' : '40px',
            height: isMobile ? '36px' : '40px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, rgba(148, 163, 184, 0.4) 0%, rgba(100, 116, 139, 0.6) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Clock size={isMobile ? 16 : 18} color="rgba(255, 255, 255, 0.8)" />
          </div>
          
          <div style={{ flex: 1 }}>
            <h3 style={{
              fontSize: isMobile ? '0.9rem' : '0.95rem',
              fontWeight: '700',
              color: 'rgba(255, 255, 255, 0.9)',
              margin: 0,
              marginBottom: '0.25rem'
            }}>
              Quick Log Workout
            </h3>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              color: 'rgba(148, 163, 184, 0.8)',
              fontWeight: '600',
              fontSize: isMobile ? '0.75rem' : '0.8rem'
            }}>
              <span>Log een vrije training</span>
              <ChevronRight size={12} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginBottom: '1rem',
        paddingLeft: '0.5rem'
      }}>
        <Target size={18} color={THEME.primary} />
        <h3 style={{
          fontSize: '1.1rem',
          fontWeight: '700',
          color: '#fff',
          margin: 0
        }}>
          Today's Progress
        </h3>
      </div>

      {/* Progress indicator for no exercises logged */}
      {todaysLogs.length === 0 && (
        <div style={{
          position: 'relative',
          marginBottom: '0.5rem',
          display: 'flex',
          justifyContent: 'flex-start',
          alignItems: 'center',
          animation: 'pulseGlow 2s infinite'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.15) 0%, rgba(234, 88, 12, 0.1) 100%)',
            borderRadius: '20px',
            padding: '0.5rem 1rem',
            border: '1px solid rgba(249, 115, 22, 0.3)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 8px 25px rgba(249, 115, 22, 0.2)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: '-100%',
              right: 0,
              bottom: 0,
              background: 'linear-gradient(90deg, transparent, rgba(249, 115, 22, 0.1), transparent)',
              animation: 'shimmer 3s infinite'
            }} />
            
            <span style={{
              color: 'rgba(249, 115, 22, 0.9)',
              fontSize: isMobile ? '0.8rem' : '0.85rem',
              fontWeight: '600',
              zIndex: 1
            }}>
              Klik hier om je workout te loggen
            </span>
            
            <div style={{
              color: 'rgba(249, 115, 22, 0.8)',
              fontSize: '1.2rem',
              animation: 'bounce 1.5s infinite',
              zIndex: 1
            }}>
              ↓
            </div>
          </div>
        </div>
      )}

      {/* Main Widget */}
      <div style={{
        background: quickStats.exercisesLogged > 0
          ? 'linear-gradient(135deg, rgba(249, 115, 22, 0.12) 0%, rgba(234, 88, 12, 0.08) 50%, rgba(194, 65, 12, 0.05) 100%)'
          : 'linear-gradient(135deg, rgba(249, 115, 22, 0.08) 0%, rgba(234, 88, 12, 0.04) 100%)',
        borderRadius: '16px',
        padding: isMobile ? '1rem' : '1.25rem',
        border: quickStats.exercisesLogged > 0
          ? '1px solid rgba(249, 115, 22, 0.2)'
          : '1px solid rgba(249, 115, 22, 0.08)',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        boxShadow: quickStats.exercisesLogged > 0
          ? '0 10px 25px rgba(249, 115, 22, 0.15)'
          : '0 8px 20px rgba(0, 0, 0, 0.1)',
        backdropFilter: 'blur(10px)',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        marginBottom: '1rem'
      }}
      onClick={onOpenQuickModal}
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
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: isMobile ? '0.75rem' : '1rem'
        }}>
          <div style={{
            color: 'rgba(148, 163, 184, 0.8)',
            fontSize: isMobile ? '0.65rem' : '0.7rem',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            {quickStats.exercisesLogged > 0 ? 'IN PROGRESS' : 'READY TO START'}
          </div>

          {/* Progress dots */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem'
          }}>
            {Array.from({ length: Math.max(5, quickStats.totalExercises) }, (_, i) => (
              <div
                key={i}
                style={{
                  width: '4px',
                  height: '4px',
                  borderRadius: '50%',
                  background: i < quickStats.exercisesLogged
                    ? 'rgba(249, 115, 22, 0.8)'
                    : 'rgba(148, 163, 184, 0.2)',
                  transition: 'all 0.3s ease'
                }}
              />
            ))}
          </div>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? '0.75rem' : '1rem'
        }}>
          <div style={{
            width: isMobile ? '40px' : '44px',
            height: isMobile ? '40px' : '44px',
            borderRadius: '12px',
            background: quickStats.exercisesLogged > 0
              ? 'linear-gradient(135deg, rgba(249, 115, 22, 0.9) 0%, rgba(234, 88, 12, 0.9) 100%)'
              : 'linear-gradient(135deg, rgba(71, 85, 105, 0.4) 0%, rgba(51, 65, 85, 0.6) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15)',
            position: 'relative',
            flexShrink: 0
          }}>
            <Activity size={isMobile ? 18 : 20} color="#fff" />
            {quickStats.exercisesLogged > 0 && (
              <div style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                width: '8px',
                height: '8px',
                background: 'rgba(16, 185, 129, 0.9)',
                borderRadius: '50%',
                border: '2px solid rgba(15, 23, 42, 0.9)'
              }} />
            )}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              marginBottom: isMobile ? '0.35rem' : '0.5rem'
            }}>
              <h3 style={{
                fontSize: isMobile ? '0.95rem' : '1rem',
                fontWeight: '700',
                color: 'rgba(255, 255, 255, 0.95)',
                margin: 0,
                lineHeight: 1
              }}>
                {todaysWorkout ? todaysWorkout.name : 'Quick Log'}
              </h3>
            </div>

            {quickStats.exercisesLogged > 0 ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: isMobile ? '0.5rem' : '0.75rem',
                flexWrap: 'wrap'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  color: 'rgba(148, 163, 184, 0.9)',
                  fontSize: isMobile ? '0.75rem' : '0.8rem'
                }}>
                  <TrendingUp size={12} />
                  <span>
                    {quickStats.exercisesLogged} oefening{quickStats.exercisesLogged !== 1 ? 'en' : ''} gelogd
                  </span>
                </div>

                {quickStats.lastExercise && (
                  <span style={{
                    padding: isMobile ? '0.1rem 0.35rem' : '0.15rem 0.5rem',
                    background: 'rgba(249, 115, 22, 0.15)',
                    borderRadius: '8px',
                    fontSize: isMobile ? '0.65rem' : '0.7rem',
                    color: 'rgba(251, 191, 36, 0.95)',
                    fontWeight: '600',
                    border: '1px solid rgba(249, 115, 22, 0.2)',
                    maxWidth: '120px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {quickStats.lastExercise.exercise_name}
                  </span>
                )}
              </div>
            ) : (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                color: 'rgba(251, 191, 36, 0.9)',
                fontWeight: '600',
                fontSize: isMobile ? '0.8rem' : '0.85rem'
              }}>
                <span>Klik om te beginnen</span>
                <ChevronRight size={12} style={{ 
                  animation: quickStats.exercisesLogged === 0 ? 'slideRight 1s infinite' : 'none' 
                }} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Today's Logged Exercises */}
      {todaysLogs.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.6) 0%, rgba(30, 41, 59, 0.4) 100%)',
          borderRadius: '16px',
          padding: isMobile ? '1rem' : '1.25rem',
          border: '1px solid rgba(249, 115, 22, 0.1)',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem'
          }}>
            <h4 style={{
              fontSize: isMobile ? '0.9rem' : '1rem',
              color: 'rgba(249, 115, 22, 0.9)',
              fontWeight: '700',
              margin: 0,
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Vandaag Gelogd
            </h4>
            <div style={{
              color: 'rgba(148, 163, 184, 0.6)',
              fontSize: isMobile ? '0.7rem' : '0.75rem',
              fontWeight: '600'
            }}>
              {todaysLogs.length} exercise{todaysLogs.length !== 1 ? 's' : ''}
            </div>
          </div>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}>
            {todaysLogs.slice(0, 3).map((log, idx) => (
              <div
                key={log.id}
                style={{
                  background: 'rgba(15, 23, 42, 0.4)',
                  borderRadius: '12px',
                  padding: isMobile ? '0.75rem' : '1rem',
                  border: '1px solid rgba(249, 115, 22, 0.1)',
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '0.5rem'
                }}>
                  <h5 style={{
                    fontSize: isMobile ? '0.9rem' : '1rem',
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontWeight: '600',
                    margin: 0
                  }}>
                    {log.exercise_name}
                  </h5>
                  <div style={{
                    fontSize: isMobile ? '0.7rem' : '0.75rem',
                    color: 'rgba(148, 163, 184, 0.6)',
                    fontWeight: '500'
                  }}>
                    {new Date(log.created_at).toLocaleTimeString('nl-NL', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
                
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.5rem'
                }}>
                  {(Array.isArray(log.sets) ? log.sets : JSON.parse(log.sets || '[]')).map((set, setIdx) => (
                    <div
                      key={setIdx}
                      style={{
                        background: 'rgba(249, 115, 22, 0.1)',
                        border: '1px solid rgba(249, 115, 22, 0.2)',
                        borderRadius: '8px',
                        padding: '0.25rem 0.5rem',
                        fontSize: isMobile ? '0.75rem' : '0.8rem',
                        color: 'rgba(251, 191, 36, 0.9)',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                    >
                      <span>{set.weight}kg</span>
                      <span style={{ color: 'rgba(148, 163, 184, 0.5)' }}>×</span>
                      <span>{set.reps}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            
            {todaysLogs.length > 3 && (
              <div style={{
                textAlign: 'center',
                color: 'rgba(148, 163, 184, 0.6)',
                fontSize: isMobile ? '0.75rem' : '0.8rem',
                fontStyle: 'italic'
              }}>
                +{todaysLogs.length - 3} meer...
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulseGlow {
          0%, 100% { 
            transform: scale(1);
            filter: brightness(1);
          }
          50% { 
            transform: scale(1.02);
            filter: brightness(1.1);
          }
        }
        
        @keyframes shimmer {
          0% { left: -100%; }
          100% { left: 100%; }
        }
        
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-8px); }
          60% { transform: translateY(-4px); }
        }
        
        @keyframes slideRight {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(3px); }
        }
      `}</style>
    </div>
  )
}
