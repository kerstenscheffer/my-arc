// src/modules/workout/components/week-schedule/DayCard.jsx
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
  
  // Determine colors based on state
  const getColors = () => {
    if (isCompleted) {
      return {
        bg: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(5, 150, 105, 0.06) 100%)',
        border: 'rgba(16, 185, 129, 0.25)',
        shadow: '0 4px 12px rgba(16, 185, 129, 0.15)'
      }
    }
    if (isToday) {
      return {
        bg: 'linear-gradient(135deg, rgba(249, 115, 22, 0.15) 0%, rgba(234, 88, 12, 0.08) 100%)',
        border: 'rgba(249, 115, 22, 0.3)',
        shadow: '0 4px 16px rgba(249, 115, 22, 0.2)'
      }
    }
    if (isCardio) {
      return {
        bg: 'linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(220, 38, 38, 0.06) 100%)',
        border: 'rgba(239, 68, 68, 0.25)',
        shadow: 'none'
      }
    }
    if (isSwimming) {
      return {
        bg: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(37, 99, 235, 0.06) 100%)',
        border: 'rgba(59, 130, 246, 0.25)',
        shadow: 'none'
      }
    }
    if (isCustom) {
      return {
        bg: 'linear-gradient(135deg, rgba(168, 85, 247, 0.12) 0%, rgba(147, 51, 234, 0.06) 100%)',
        border: 'rgba(168, 85, 247, 0.25)',
        shadow: 'none'
      }
    }
    if (workoutData) {
      return {
        bg: 'linear-gradient(135deg, rgba(249, 115, 22, 0.1) 0%, rgba(234, 88, 12, 0.05) 100%)',
        border: 'rgba(249, 115, 22, 0.2)',
        shadow: 'none'
      }
    }
    if (isSelected) {
      return {
        bg: 'linear-gradient(135deg, rgba(249, 115, 22, 0.1) 0%, rgba(234, 88, 12, 0.05) 100%)',
        border: 'rgba(249, 115, 22, 0.3)',
        shadow: 'none'
      }
    }
    return {
      bg: 'linear-gradient(135deg, rgba(23, 23, 23, 0.6) 0%, rgba(10, 10, 10, 0.5) 100%)',
      border: 'rgba(255, 255, 255, 0.05)',
      shadow: 'none'
    }
  }
  
  const colors = getColors()
  
  return (
    <div 
      onClick={onClick}
      onMouseEnter={() => setShowSwapButton(true)}
      onMouseLeave={() => setShowSwapButton(false)}
      style={{
        padding: isMobile ? '0.625rem 0.375rem' : '0.875rem 0.5rem',
        minHeight: isMobile ? '80px' : '100px',
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        borderRadius: isMobile ? '10px' : '12px',
        cursor: swapMode || workoutData || isActivity ? 'pointer' : 'default',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        position: 'relative',
        transform: isSelected && swapMode ? 'scale(0.95)' : 'scale(1)',
        boxShadow: colors.shadow,
        backdropFilter: 'blur(10px)',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent'
      }}
    >
      {/* Top accent line */}
      {(isToday || isCompleted) && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: isCompleted 
            ? 'linear-gradient(90deg, transparent 0%, #10b981 50%, transparent 100%)'
            : 'linear-gradient(90deg, transparent 0%, #f97316 50%, transparent 100%)',
          opacity: 0.6
        }} />
      )}
      
      {/* Completed badge */}
      {isCompleted && (
        <div style={{
          position: 'absolute',
          top: isMobile ? '0.3rem' : '0.4rem',
          right: isMobile ? '0.3rem' : '0.4rem',
          width: isMobile ? '16px' : '18px',
          height: isMobile ? '16px' : '18px',
          borderRadius: '6px',
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 8px rgba(16, 185, 129, 0.3)'
        }}>
          <CheckCircle size={isMobile ? 10 : 11} color="#10b981" />
        </div>
      )}
      
      {/* Swap button */}
      {(workoutData || isActivity) && showSwapButton && !localSwapMode && !isMobile && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onSwapClick()
          }}
          style={{
            position: 'absolute',
            top: '0.4rem',
            left: '0.4rem',
            width: '20px',
            height: '20px',
            borderRadius: '6px',
            background: 'rgba(249, 115, 22, 0.15)',
            border: '1px solid rgba(249, 115, 22, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            zIndex: 10,
            backdropFilter: 'blur(8px)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(249, 115, 22, 0.25)'
            e.currentTarget.style.transform = 'scale(1.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(249, 115, 22, 0.15)'
            e.currentTarget.style.transform = 'scale(1)'
          }}
        >
          <ArrowLeftRight size={10} color="#f97316" />
        </button>
      )}
      
      {/* Day label */}
      <div style={{
        fontSize: isMobile ? '0.65rem' : '0.7rem',
        fontWeight: isToday ? '800' : '600',
        marginBottom: isMobile ? '0.375rem' : '0.5rem',
        color: isToday ? '#f97316' : 
               isCompleted ? '#10b981' :
               isCardio ? '#ef4444' :
               isSwimming ? '#3b82f6' :
               isCustom ? '#a855f7' :
               workoutData ? 'rgba(249, 115, 22, 0.8)' : 
               'rgba(255,255,255,0.3)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
      }}>
        {isMobile ? weekDaysDutch[dayIndex] : weekDaysShort[dayIndex]}
      </div>
      
      {/* Workout content */}
      {workoutData ? (
        isCustom ? (
          <CustomWorkoutIndicator workout={workoutData} isMobile={isMobile} />
        ) : (
          <WorkoutIndicator workoutData={workoutData} isMobile={isMobile} />
        )
      ) : isCardio ? (
        <ActivityIndicator icon={Heart} color="#ef4444" label="Cardio" isMobile={isMobile} />
      ) : isSwimming ? (
        <ActivityIndicator icon={Waves} color="#3b82f6" label="Zwem" isMobile={isMobile} />
      ) : (
        <RestIndicator swapMode={swapMode} isMobile={isMobile} />
      )}
    </div>
  )
}

function ActivityIndicator({ icon: Icon, color, label, isMobile }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: isMobile ? '0.25rem' : '0.3rem'
    }}>
      <div style={{
        width: isMobile ? '28px' : '32px',
        height: isMobile ? '28px' : '32px',
        borderRadius: '8px',
        background: `${color}15`,
        border: `1px solid ${color}30`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: `0 0 10px ${color}20`
      }}>
        <Icon size={isMobile ? 13 : 15} color={color} />
      </div>
      <div style={{
        fontSize: isMobile ? '0.55rem' : '0.6rem',
        color: color,
        lineHeight: 1.2,
        fontWeight: '600',
        opacity: 0.9
      }}>
        {label}
      </div>
    </div>
  )
}

function RestIndicator({ swapMode, isMobile }) {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      gap: isMobile ? '0.25rem' : '0.3rem' 
    }}>
      {swapMode ? (
        <>
          <div style={{ 
            width: isMobile ? '28px' : '32px', 
            height: isMobile ? '28px' : '32px', 
            borderRadius: '8px', 
            background: 'rgba(249, 115, 22, 0.08)', 
            border: '1px dashed rgba(249, 115, 22, 0.25)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            backdropFilter: 'blur(4px)'
          }}>
            <Plus size={isMobile ? 14 : 16} color="rgba(249, 115, 22, 0.5)" />
          </div>
          <div style={{ 
            fontSize: isMobile ? '0.55rem' : '0.6rem', 
            color: 'rgba(249, 115, 22, 0.5)',
            fontWeight: '600'
          }}>
            Voeg toe
          </div>
        </>
      ) : (
        <>
          <div style={{ 
            width: isMobile ? '28px' : '32px', 
            height: isMobile ? '28px' : '32px', 
            borderRadius: '8px', 
            background: 'rgba(255, 255, 255, 0.03)', 
            border: '1px solid rgba(255, 255, 255, 0.05)',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            <Moon size={isMobile ? 13 : 15} color="rgba(255,255,255,0.2)" />
          </div>
          <div style={{ 
            fontSize: isMobile ? '0.55rem' : '0.6rem', 
            color: 'rgba(255,255,255,0.25)',
            fontWeight: '600'
          }}>
            Rust
          </div>
        </>
      )}
    </div>
  )
}
