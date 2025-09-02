import useIsMobile from '../../../hooks/useIsMobile'
// src/modules/workout/components/TodayWorkout.jsx
import { Play, Flame, Clock, Target, ChevronRight, Zap } from 'lucide-react'

export default function TodayWorkout({ workout, onStart, client, db }) {
  const isMobile = useIsMobile()
  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const todayIndex = (new Date().getDay() + 6) % 7
  
  return (
    <>
      <div style={{ 
        paddingLeft: '1rem',
        paddingRight: '1rem',
        marginBottom: '1.5rem'
      }}>
        <div 
          onClick={onStart}
          style={{
            background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
            borderRadius: '18px',
            padding: '1.25rem',
            cursor: 'pointer',
            boxShadow: '0 15px 35px rgba(249, 115, 22, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)'
            e.currentTarget.style.boxShadow = '0 20px 45px rgba(249, 115, 22, 0.35)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)'
            e.currentTarget.style.boxShadow = '0 15px 35px rgba(249, 115, 22, 0.25)'
          }}
        >
          {/* Background pattern */}
          <div style={{
            position: 'absolute',
            top: '-50%',
            right: '-20%',
            width: '200%',
            height: '200%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 40%)',
            pointerEvents: 'none'
          }} />
          
          {/* Content */}
          <div style={{ 
            flex: 1,
            position: 'relative',
            zIndex: 1
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.5rem'
            }}>
              <Zap size={16} color="#fff" fill="#fff" />
              <p style={{
                fontSize: '0.75rem',
                color: 'rgba(255,255,255,0.9)',
                margin: 0,
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Vandaag's Workout
              </p>
            </div>
            <h3 style={{
              fontSize: '1.3rem',
              color: '#fff',
              margin: '0 0 0.5rem 0',
              fontWeight: '800',
              lineHeight: 1.2
            }}>
              {workout.name}
            </h3>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              flexWrap: 'wrap'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.8rem',
                color: 'rgba(255,255,255,0.8)'
              }}>
                <Target size={14} />
                {workout.focus}
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.8rem',
                color: 'rgba(255,255,255,0.8)'
              }}>
                <Clock size={14} />
                ~45 min
              </div>
            </div>
          </div>
          
          {/* Play button */}
          <div style={{
            width: '56px',
            height: '56px',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.15) 100%)',
            backdropFilter: 'blur(10px)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            zIndex: 1
          }}>
            <Play size={22} color="#fff" fill="#fff" style={{ marginLeft: '2px' }} />
          </div>
        </div>
        
        {/* Quick stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '0.75rem',
          marginTop: '1rem'
        }}>
          <QuickStat
            label="Oefeningen"
            value={workout.exercises?.length || 0}
            color="#f97316"
          />
          <QuickStat
            label="Sets Totaal"
            value={workout.exercises?.reduce((acc, ex) => acc + (parseInt(ex.sets) || 0), 0) || 0}
            color="#10b981"
          />
          <QuickStat
            label="Focus"
            value={workout.focus?.split(',').length || 1}
            suffix="spieren"
            color="#3b82f6"
          />
        </div>
      </div>
    </>
  )
}

function QuickStat({ label, value, suffix, color }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.9) 0%, rgba(10, 10, 10, 0.9) 100%)',
      borderRadius: '12px',
      padding: '0.75rem',
      border: `1px solid ${color}15`,
      textAlign: 'center'
    }}>
      <div style={{
        fontSize: '1.3rem',
        fontWeight: '800',
        background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        marginBottom: '0.15rem'
      }}>
        {value}
      </div>
      <div style={{
        fontSize: '0.65rem',
        color: 'rgba(255,255,255,0.4)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
      }}>
        {label}
      </div>
      {suffix && (
        <div style={{
          fontSize: '0.6rem',
          color: 'rgba(255,255,255,0.3)',
          marginTop: '0.1rem'
        }}>
          {suffix}
        </div>
      )}
    </div>
  )
}
