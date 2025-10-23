// ========================================
// 📁 src/modules/workout/components/week-schedule/DayCard.jsx
// ========================================
import { useState } from 'react'
import { CheckCircle, ArrowLeftRight, Moon, Plus, Heart, Waves } from 'lucide-react'
import CustomWorkoutIndicator from './CustomWorkoutIndicator'
import WorkoutIndicator from './WorkoutIndicator'

export default function DayCard({
  day,
  dayIndex,
  workoutKey,
  workoutData,
  isToday,
  isCompleted,
  isSelected,
  swapMode,
  isMobile,
  weekDaysShort,
  weekDaysDutch,
  onClick,
  onSwapClick,
  localSwapMode
}) {
  const [showSwapButton, setShowSwapButton] = useState(false)
  
  const isCardio = workoutKey === 'cardio'
  const isSwimming = workoutKey === 'swimming'
  const isActivity = isCardio || isSwimming
  const isCustom = workoutKey?.startsWith('custom_')
  
  return (
    <div 
      onClick={onClick}
      onMouseEnter={() => setShowSwapButton(true)}
      onMouseLeave={() => setShowSwapButton(false)}
      style={{
        padding: isMobile ? '0.75rem 0.4rem' : '1rem',
        minHeight: isMobile ? '90px' : '120px',
        background: workoutData || isActivity
          ? `linear-gradient(135deg, ${
              isToday ? 'rgba(249, 115, 22, 0.15)' : 
              isCompleted ? 'rgba(16, 185, 129, 0.1)' : 
              isCardio ? 'rgba(239, 68, 68, 0.1)' :
              isSwimming ? 'rgba(59, 130, 246, 0.1)' :
              isCustom ? 'rgba(168, 85, 247, 0.1)' :
              'rgba(249, 115, 22, 0.05)'
            } 0%, ${
              isToday ? 'rgba(234, 88, 12, 0.08)' : 
              isCompleted ? 'rgba(5, 150, 105, 0.05)' : 
              isCardio ? 'rgba(239, 68, 68, 0.05)' :
              isSwimming ? 'rgba(59, 130, 246, 0.05)' :
              isCustom ? 'rgba(168, 85, 247, 0.05)' :
              'rgba(234, 88, 12, 0.02)'
            } 100%)`
          : isSelected 
            ? 'linear-gradient(135deg, rgba(249, 115, 22, 0.08) 0%, rgba(234, 88, 12, 0.04) 100%)'
            : 'linear-gradient(135deg, rgba(23, 23, 23, 0.6) 0%, rgba(10, 10, 10, 0.6) 100%)',
        border: `1px solid ${
          isSelected ? 'rgba(249, 115, 22, 0.3)' :
          isToday ? 'rgba(249, 115, 22, 0.25)' : 
          isCardio ? 'rgba(239, 68, 68, 0.2)' :
          isSwimming ? 'rgba(59, 130, 246, 0.2)' :
          isCustom ? 'rgba(168, 85, 247, 0.2)' :
          workoutData ? 'rgba(249, 115, 22, 0.1)' : 
          'rgba(255, 255, 255, 0.03)'
        }`,
        borderRadius: '14px',
        cursor: swapMode || workoutData || isActivity ? 'pointer' : 'default',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        position: 'relative',
        transform: isSelected && swapMode ? 'scale(0.95)' : 'scale(1)',
        boxShadow: isToday ? '0 8px 20px rgba(249, 115, 22, 0.15)' : 'none',
        backdropFilter: 'blur(10px)',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent'
      }}
    >
      {isCompleted && (
        <CheckCircle 
          size={14} 
          color="#10b981" 
          style={{ 
            position: 'absolute',
            top: '0.35rem',
            right: '0.35rem'
          }} 
        />
      )}
      
      {(workoutData || isActivity) && showSwapButton && !localSwapMode && !isMobile && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onSwapClick()
          }}
          style={{
            position: 'absolute',
            top: '0.35rem',
            left: '0.35rem',
            width: '24px',
            height: '24px',
            borderRadius: '6px',
            background: 'rgba(249, 115, 22, 0.1)',
            border: '1px solid rgba(249, 115, 22, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            zIndex: 10
          }}
        >
          <ArrowLeftRight size={12} color="#f97316" />
        </button>
      )}
      
      <div style={{
        fontSize: isMobile ? '0.65rem' : '0.75rem',
        fontWeight: isToday ? '800' : '600',
        marginBottom: '0.35rem',
        color: isToday ? '#f97316' : 
               isCardio ? '#ef4444' :
               isSwimming ? '#3b82f6' :
               isCustom ? '#a855f7' :
               workoutData ? 'rgba(249, 115, 22, 0.8)' : 
               'rgba(255,255,255,0.3)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
      }}>
        {isMobile ? weekDaysDutch[dayIndex] : weekDaysShort[dayIndex]}
        {isToday && (
          <div style={{
            width: '4px',
            height: '4px',
            borderRadius: '50%',
            background: '#f97316',
            margin: '0.2rem auto 0',
            boxShadow: '0 0 8px rgba(249, 115, 22, 0.6)',
            animation: 'pulse 2s infinite'
          }} />
        )}
      </div>
      
      {workoutData ? (
        isCustom ? (
          <CustomWorkoutIndicator workout={workoutData} isMobile={isMobile} />
        ) : (
          <WorkoutIndicator workoutData={workoutData} isMobile={isMobile} />
        )
      ) : isCardio ? (
        <ActivityIndicator icon={Heart} color="#ef4444" label="Cardio" isMobile={isMobile} />
      ) : isSwimming ? (
        <ActivityIndicator icon={Waves} color="#3b82f6" label="Zwemmen" isMobile={isMobile} />
      ) : (
        <RestIndicator swapMode={swapMode} isMobile={isMobile} />
      )}
      
      <style>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(249, 115, 22, 0.7); }
          70% { box-shadow: 0 0 0 8px rgba(249, 115, 22, 0); }
          100% { box-shadow: 0 0 0 0 rgba(249, 115, 22, 0); }
        }
      `}</style>
    </div>
  )
}

function ActivityIndicator({ icon: Icon, color, label, isMobile }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '0.25rem'
    }}>
      <div style={{
        width: isMobile ? '32px' : '36px',
        height: isMobile ? '32px' : '36px',
        borderRadius: '10px',
        background: `${color}20`,
        border: `2px solid ${color}40`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Icon size={isMobile ? 14 : 16} color={color} />
      </div>
      <div style={{
        fontSize: isMobile ? '0.55rem' : '0.65rem',
        color: `${color}cc`,
        lineHeight: 1.2,
        fontWeight: '600'
      }}>
        {label}
      </div>
    </div>
  )
}

function RestIndicator({ swapMode, isMobile }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
      {swapMode ? (
        <>
          <div style={{ 
            width: isMobile ? '32px' : '36px', 
            height: isMobile ? '32px' : '36px', 
            borderRadius: '10px', 
            background: 'rgba(255, 255, 255, 0.03)', 
            border: '1px dashed rgba(249, 115, 22, 0.2)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            <Plus size={isMobile ? 16 : 20} color="rgba(249, 115, 22, 0.4)" />
          </div>
          <div style={{ fontSize: isMobile ? '0.55rem' : '0.65rem', color: 'rgba(249, 115, 22, 0.4)' }}>
            Voeg toe
          </div>
        </>
      ) : (
        <>
          <div style={{ 
            width: isMobile ? '32px' : '36px', 
            height: isMobile ? '32px' : '36px', 
            borderRadius: '10px', 
            background: 'rgba(255, 255, 255, 0.02)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            <Moon size={isMobile ? 14 : 16} color="rgba(255,255,255,0.2)" />
          </div>
          <div style={{ 
            fontSize: isMobile ? '0.55rem' : '0.65rem', 
            color: 'rgba(255,255,255,0.2)', 
            marginTop: '0.15rem' 
          }}>
            Rust
          </div>
        </>
      )}
    </div>
  )
}

