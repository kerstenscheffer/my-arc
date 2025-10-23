
// ========================================
// 📁 src/modules/workout/components/week-schedule/WorkoutIndicator.jsx
// ========================================
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
      gap: '0.25rem' 
    }}>
      <div style={{ 
        width: isMobile ? '32px' : '36px', 
        height: isMobile ? '32px' : '36px', 
        borderRadius: '10px', 
        background: `url(${workoutImage}) center/cover`, 
        border: '2px solid rgba(249, 115, 22, 0.2)', 
        position: 'relative', 
        overflow: 'hidden' 
      }} />
      <div style={{ 
        fontSize: isMobile ? '0.55rem' : '0.65rem', 
        color: 'rgba(255,255,255,0.6)', 
        lineHeight: 1.2, 
        maxWidth: isMobile ? '45px' : '60px', 
        overflow: 'hidden', 
        textOverflow: 'ellipsis', 
        whiteSpace: 'nowrap' 
      }}>
        {workoutData.focus?.split(',')[0] || ''}
      </div>
    </div>
  )
}
