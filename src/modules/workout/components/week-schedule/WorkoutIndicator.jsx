// src/modules/workout/components/week-schedule/WorkoutIndicator.jsx
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

export default function WorkoutIndicator({ workoutData, isMobile }) {
  const workoutImage = getWorkoutImage(workoutData)
  
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
        background: `url(${workoutImage}) center/cover`, 
        border: '1px solid rgba(249, 115, 22, 0.25)', 
        position: 'relative', 
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
      }} />
      <div style={{ 
        fontSize: isMobile ? '0.55rem' : '0.6rem', 
        color: 'rgba(255,255,255,0.6)', 
        lineHeight: 1.2, 
        maxWidth: isMobile ? '45px' : '55px', 
        overflow: 'hidden', 
        textOverflow: 'ellipsis', 
        whiteSpace: 'nowrap',
        fontWeight: '600'
      }}>
        {workoutData.focus?.split(',')[0] || ''}
      </div>
    </div>
  )
}
