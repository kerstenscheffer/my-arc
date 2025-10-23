// src/modules/workout/components/week-schedule/WorkoutListCard.jsx
import { CheckCircle, ArrowLeftRight, ChevronRight, Clock, Target } from 'lucide-react'

// Muscle group images
const muscleGroupImages = {
  chest: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400&h=300&fit=crop',
  back: 'https://images.unsplash.com/photo-1603287681836-b174ce5074c2?w=400&h=300&fit=crop',
  legs: 'https://images.unsplash.com/photo-1434682881908-b43d0467b798?w=400&h=300&fit=crop',
  shoulders: 'https://images.unsplash.com/photo-1581009137042-c552e485697a?w=400&h=300&fit=crop',
  arms: 'https://images.unsplash.com/photo-1583500178450-e59e4309b57d?w=400&h=300&fit=crop',
  core: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
  triceps: 'https://images.unsplash.com/photo-1583500178450-e59e4309b57d?w=400&h=300&fit=crop',
  biceps: 'https://images.unsplash.com/photo-1583500178450-e59e4309b57d?w=400&h=300&fit=crop',
  fallback: 'https://images.unsplash.com/photo-1517963628607-235ccdd5476c?w=400&h=300&fit=crop'
}

const getWorkoutImage = (workoutData) => {
  if (!workoutData || !workoutData.focus) return muscleGroupImages.fallback
  
  const focusParts = workoutData.focus.toLowerCase().split(',').map(s => s.trim())
  const primaryMuscle = focusParts[0]
  
  return muscleGroupImages[primaryMuscle] || muscleGroupImages.fallback
}

// Custom workout emoji mapping
const getCustomWorkoutEmoji = (type) => {
  const emojis = {
    cardio: '❤️',
    cycling: '🚴',
    running: '🏃',
    swimming: '🏊',
    hiking: '🥾',
    yoga: '🧘',
    sports: '⚽',
    custom: '💪'
  }
  return emojis[type] || '💪'
}

// Activity emoji mapping (for standard activities)
const getActivityEmoji = (type) => {
  const emojis = {
    swimming: '🏊',
    cardio: '❤️',
    running: '🏃',
    cycling: '🚴',
    hiking: '🥾'
  }
  return emojis[type] || '💪'
}

// Activity colors
const getActivityColor = (type, border = false) => {
  const colors = {
    swimming: border ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)',
    cardio: border ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)',
    running: border ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.2)',
    cycling: border ? 'rgba(249, 115, 22, 0.3)' : 'rgba(249, 115, 22, 0.2)',
    hiking: border ? 'rgba(34, 197, 94, 0.3)' : 'rgba(34, 197, 94, 0.2)'
  }
  return colors[type] || (border ? 'rgba(249, 115, 22, 0.3)' : 'rgba(249, 115, 22, 0.2)')
}

export default function WorkoutListCard({ 
  day, 
  workout, 
  isCustom, 
  isToday, 
  isCompleted, 
  isSelected, 
  onClick, 
  onSwapClick, 
  localSwapMode, 
  isMobile 
}) {
  const isActivity = workout?.isActivity || false
  const workoutImage = (isCustom || isActivity) ? null : getWorkoutImage(workout)
  const emoji = isCustom ? getCustomWorkoutEmoji(workout.type) : 
                isActivity ? getActivityEmoji(workout.type) : null
  
  return (
    <div 
      onClick={onClick} 
      style={{
        padding: isMobile ? '1rem' : '1.25rem',
        background: isToday 
          ? 'linear-gradient(135deg, rgba(249, 115, 22, 0.08) 0%, rgba(234, 88, 12, 0.04) 100%)'
          : isCompleted
            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(5, 150, 105, 0.02) 100%)'
            : 'linear-gradient(135deg, rgba(23, 23, 23, 0.9) 0%, rgba(10, 10, 10, 0.9) 100%)',
        border: `1px solid ${
          isSelected 
            ? 'rgba(249, 115, 22, 0.3)' 
            : isToday 
              ? 'rgba(249, 115, 22, 0.2)' 
              : isCompleted 
                ? 'rgba(16, 185, 129, 0.15)' 
                : isCustom
                  ? 'rgba(168, 85, 247, 0.1)'
                  : 'rgba(249, 115, 22, 0.1)'
        }`,
        borderRadius: '14px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'hidden',
        backdropFilter: 'blur(10px)',
        minHeight: '44px',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent'
      }}
    >
      {/* Today indicator line */}
      {isToday && (
        <div style={{ 
          position: 'absolute', 
          left: 0, 
          top: 0, 
          bottom: 0, 
          width: '3px', 
          background: 'linear-gradient(180deg, #f97316 0%, #ea580c 100%)', 
          boxShadow: '2px 0 8px rgba(249, 115, 22, 0.3)' 
        }} />
      )}
      
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '0.75rem', 
        paddingLeft: isToday || isCompleted ? '0.5rem' : 0 
      }}>
        {/* Workout thumbnail */}
        <div style={{ 
          width: isMobile ? '42px' : '48px', 
          height: isMobile ? '42px' : '48px', 
          borderRadius: '12px', 
          background: (isCustom || isActivity)
            ? isActivity 
              ? getActivityColor(workout.type)
              : 'rgba(168, 85, 247, 0.2)'
            : `url(${workoutImage}) center/cover`, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          flexShrink: 0, 
          position: 'relative', 
          overflow: 'hidden',
          fontSize: '1.5rem',
          border: (isCustom || isActivity)
            ? isActivity
              ? `2px solid ${getActivityColor(workout.type, true)}`
              : '2px solid rgba(168, 85, 247, 0.3)'
            : 'none'
        }}>
          {(isCustom || isActivity) ? emoji : null}
          {isCompleted && !(isCustom || isActivity) && (
            <div style={{ 
              position: 'absolute', 
              inset: 0, 
              background: 'rgba(16, 185, 129, 0.8)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <CheckCircle size={isMobile ? 20 : 22} color="white" strokeWidth={2.5} />
            </div>
          )}
        </div>
        
        {/* Workout info */}
        <div style={{ flex: 1 }}>
          {/* Day label */}
          <div style={{ 
            fontSize: isMobile ? '0.7rem' : '0.75rem', 
            color: isToday ? '#f97316' : isCompleted ? '#10b981' : 'rgba(255,255,255,0.5)', 
            marginBottom: '0.2rem', 
            fontWeight: '700', 
            textTransform: 'uppercase', 
            letterSpacing: '0.05em', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem' 
          }}>
            {day}
            {isToday && (
              <span style={{ 
                fontSize: '0.65rem', 
                background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)', 
                padding: '0.15rem 0.4rem', 
                borderRadius: '6px', 
                fontWeight: '800', 
                color: 'white' 
              }}>
                VANDAAG
              </span>
            )}
            {isCustom && (
              <span style={{ 
                fontSize: '0.65rem', 
                background: 'rgba(168, 85, 247, 0.15)', 
                padding: '0.15rem 0.4rem', 
                borderRadius: '6px', 
                fontWeight: '700', 
                color: '#a855f7',
                border: '1px solid rgba(168, 85, 247, 0.2)'
              }}>
                CUSTOM
              </span>
            )}
          </div>
          
          {/* Workout name */}
          <div style={{ 
            fontSize: isMobile ? '0.95rem' : '1rem', 
            color: '#fff', 
            fontWeight: '700', 
            marginBottom: '0.3rem' 
          }}>
            {workout.name}
          </div>
          
          {/* Workout details */}
          <div style={{ 
            fontSize: isMobile ? '0.7rem' : '0.75rem', 
            color: 'rgba(255,255,255,0.4)', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.75rem' 
          }}>
            {isCustom ? (
              <>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Clock size={12} color="#a855f7" />
                  {workout.duration} min
                </span>
                {workout.description && (
                  <span style={{ color: 'rgba(168, 85, 247, 0.6)' }}>
                    {workout.description.substring(0, 20)}...
                  </span>
                )}
              </>
            ) : (
              <>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Target size={12} />
                  {workout.focus}
                </span>
                {workout.geschatteTijd && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Clock size={12} />
                    {workout.geschatteTijd}
                  </span>
                )}
              </>
            )}
          </div>
        </div>
        
        {/* Swap button */}
        {!localSwapMode && (
          <button 
            onClick={(e) => { 
              e.stopPropagation()
              onSwapClick() 
            }} 
            style={{ 
              width: '32px', 
              height: '32px', 
              borderRadius: '8px', 
              background: isCustom 
                ? 'rgba(168, 85, 247, 0.08)'
                : 'rgba(249, 115, 22, 0.08)', 
              border: isCustom
                ? '1px solid rgba(168, 85, 247, 0.15)'
                : '1px solid rgba(249, 115, 22, 0.15)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              cursor: 'pointer', 
              transition: 'all 0.2s ease', 
              marginRight: '0.5rem' 
            }}
          >
            <ArrowLeftRight 
              size={14} 
              color={isCustom ? '#a855f7' : '#f97316'} 
            />
          </button>
        )}
      </div>
      
      {/* Chevron */}
      <ChevronRight 
        size={18} 
        color={
          isToday 
            ? 'rgba(249, 115, 22, 0.5)' 
            : isCompleted 
              ? 'rgba(16, 185, 129, 0.5)' 
              : isCustom
                ? 'rgba(168, 85, 247, 0.3)'
                : 'rgba(249, 115, 22, 0.3)'
        } 
      />
    </div>
  )
}
