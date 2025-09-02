import useIsMobile from '../../../hooks/useIsMobile'
// src/modules/workout/components/SwapMode.jsx
import { ArrowLeftRight, Flame, Target, Activity, AlertCircle } from 'lucide-react'

export default function SwapMode({ 
  schema, 
  swapMode, 
  setSwapMode, 
  selectedWorkout, 
  setSelectedWorkout,
  weeklyStats 
}) {
  const isMobile = useIsMobile()
  const workoutDays = schema?.week_structure ? Object.keys(schema.week_structure) : []
  
  // Get current week number
  const getWeekNumber = (date) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
  }
  
  const weekNumber = getWeekNumber(new Date())
  
  return (
    <>
      {/* Header Card */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.9) 0%, rgba(10, 10, 10, 0.9) 100%)',
        borderRadius: '20px',
        padding: isMobile ? '1rem' : '1.75rem',
        border: '1px solid rgba(249, 115, 22, 0.1)',
        marginBottom: '1rem',
        backdropFilter: 'blur(20px)',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
      }}>
        {/* Background gradient effect */}
        <div style={{
          position: 'absolute',
          top: '-50%',
          right: '-30%',
          width: '150%',
          height: '150%',
          background: 'radial-gradient(circle, rgba(249, 115, 22, 0.05) 0%, transparent 60%)',
          pointerEvents: 'none'
        }} />
        
        <div style={{
          position: 'relative',
          zIndex: 1
        }}>
          {/* Title and swap button */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: isMobile ? '0.75rem' : '1rem',
            gap: '0.75rem'
          }}>
            <div style={{ flex: 1 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.3rem'
              }}>
                <div style={{
                  width: '3px',
                  height: isMobile ? '18px' : '24px',
                  background: 'linear-gradient(180deg, #f97316 0%, #ea580c 100%)',
                  borderRadius: '3px'
                }} />
                <h2 style={{
                  fontSize: isMobile ? '1.1rem' : '1.6rem',
                  background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontWeight: '800',
                  margin: 0,
                  lineHeight: 1.2
                }}>
                  {schema.name && schema.name.length > 20 && isMobile 
                    ? schema.name.substring(0, 20) + '...' 
                    : schema.name}
                </h2>
              </div>
              <p style={{
                fontSize: isMobile ? '0.75rem' : '0.85rem',
                color: 'rgba(255,255,255,0.4)',
                margin: 0
              }}>
                Persoonlijk schema
              </p>
            </div>
            
            {!swapMode && (
              <button
                onClick={() => setSwapMode(true)}
                style={{
                  background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                  border: 'none',
                  borderRadius: isMobile ? '10px' : '12px',
                  padding: isMobile ? '0.5rem 0.75rem' : '0.6rem 1rem',
                  cursor: 'pointer',
                  color: '#fff',
                  fontSize: isMobile ? '0.75rem' : '0.85rem',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  boxShadow: '0 8px 20px rgba(249, 115, 22, 0.25)',
                  transition: 'all 0.3s ease',
                  flexShrink: 0,
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 12px 25px rgba(249, 115, 22, 0.35)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(249, 115, 22, 0.25)'
                }}
              >
                <ArrowLeftRight size={14} />
                Wissel
              </button>
            )}
          </div>
          
          {/* Stats grid - ALTIJD 3 naast elkaar */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: isMobile ? '0.5rem' : '1rem'
          }}>
            <StatBadge
              icon={Flame}
              value={`${workoutDays.length}x`}
              label="per week"
              color="#f97316"
              isMobile={isMobile}
            />
            <StatBadge
              icon={Target}
              value={`Week ${weekNumber}`}
              label="current"
              color="#10b981"
              isMobile={isMobile}
            />
            <StatBadge
              icon={Activity}
              value={weeklyStats?.completedCount || 0}
              label="voltooid"
              color="#3b82f6"
              isMobile={isMobile}
            />
          </div>
        </div>
      </div>
      
      {/* Swap Mode Instructions */}
      {swapMode && (
        <SwapInstructions 
          selectedWorkout={selectedWorkout}
          schema={schema}
          onCancel={() => {
            setSwapMode(false)
            setSelectedWorkout(null)
          }}
          isMobile={isMobile}
        />
      )}
    </>
  )
}

function StatBadge({ icon: Icon, value, label, color, isMobile }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: isMobile ? 'column' : 'row',
      gap: isMobile ? '0.25rem' : '0.5rem',
      padding: isMobile ? '0.6rem 0.4rem' : '0.5rem 0.75rem',
      background: `linear-gradient(135deg, ${color}15 0%, ${color}08 100%)`,
      borderRadius: '10px',
      border: `1px solid ${color}20`,
      textAlign: 'center',
      minHeight: isMobile ? '60px' : 'auto'
    }}>
      <Icon size={isMobile ? 14 : 16} color={color} />
      <div>
        <div style={{
          fontSize: isMobile ? '0.8rem' : '0.9rem',
          fontWeight: '700',
          color: color
        }}>
          {value}
        </div>
        <div style={{
          fontSize: isMobile ? '0.6rem' : '0.65rem',
          color: 'rgba(255,255,255,0.4)',
          marginTop: '-2px'
        }}>
          {label}
        </div>
      </div>
    </div>
  )
}

function SwapInstructions({ selectedWorkout, schema, onCancel, isMobile }) {
  return (
    <div style={{ 
      paddingLeft: '1rem',
      paddingRight: '1rem',
      marginBottom: '1rem'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.1) 0%, rgba(234, 88, 12, 0.05) 100%)',
        border: '1px solid rgba(249, 115, 22, 0.2)',
        padding: isMobile ? '0.75rem' : '1rem',
        borderRadius: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backdropFilter: 'blur(10px)',
        gap: '0.75rem'
      }}>
        <div style={{ 
          flex: 1,
          display: 'flex',
          alignItems: 'flex-start',
          gap: isMobile ? '0.5rem' : '0.75rem'
        }}>
          <AlertCircle size={isMobile ? 18 : 20} color="#f97316" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <p style={{
              fontSize: isMobile ? '0.75rem' : '0.85rem',
              color: '#f97316',
              margin: 0,
              fontWeight: '700',
              marginBottom: '0.25rem'
            }}>
              {selectedWorkout 
                ? `Klik op een dag om "${schema.week_structure[selectedWorkout]?.name}" te plaatsen`
                : 'Selecteer eerst een workout om te verplaatsen'}
            </p>
            <p style={{
              fontSize: isMobile ? '0.65rem' : '0.7rem',
              color: 'rgba(255,255,255,0.4)',
              margin: 0
            }}>
              Of klik op een lege dag voor snelle toewijzing
            </p>
          </div>
        </div>
        <button
          onClick={onCancel}
          style={{
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.1) 100%)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '10px',
            padding: isMobile ? '0.4rem 0.6rem' : '0.5rem 0.75rem',
            cursor: 'pointer',
            color: '#ef4444',
            fontSize: isMobile ? '0.7rem' : '0.8rem',
            fontWeight: '700',
            transition: 'all 0.2s ease',
            flexShrink: 0
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.3) 0%, rgba(220, 38, 38, 0.15) 100%)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.1) 100%)'
          }}
        >
          Annuleer
        </button>
      </div>
    </div>
  )
}
