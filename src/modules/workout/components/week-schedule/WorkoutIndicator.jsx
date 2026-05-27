// src/modules/workout/components/week-schedule/WorkoutIndicator.jsx
// Toont per workout-dag een unieke foto + de naam van de workout-dag (niet
// de spiergroep). Foto wordt deterministisch gekozen uit een pool zodat
// dezelfde workout-naam altijd dezelfde foto krijgt, maar verschillende
// dagen verschillende foto's.

// Pool van workout-foto's. Allemaal gevalideerd in eerdere versies; geen
// duplicates onderling. Volgorde maakt niet uit — hash bepaalt mapping.
const WORKOUT_IMAGE_POOL = [
  'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=200&h=200&fit=crop&q=60',
  'https://images.unsplash.com/photo-1603287681836-b174ce5074c2?w=200&h=200&fit=crop&q=60',
  'https://images.unsplash.com/photo-1434682881908-b43d0467b798?w=200&h=200&fit=crop&q=60',
  'https://images.unsplash.com/photo-1581009137042-c552e485697a?w=200&h=200&fit=crop&q=60',
  'https://images.unsplash.com/photo-1583500178450-e59e4309b57d?w=200&h=200&fit=crop&q=60',
  'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200&h=200&fit=crop&q=60',
  'https://images.unsplash.com/photo-1517963628607-235ccdd5476c?w=200&h=200&fit=crop&q=60',
]

// Stable string hash → integer. Same input always picks the same image.
const hashString = (str) => {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h) + str.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}

const getWorkoutImage = (workoutData) => {
  if (workoutData?.image_url) return workoutData.image_url
  const key = (workoutData?.name || workoutData?.focus || 'workout')
    .toLowerCase().trim()
  if (!key) return WORKOUT_IMAGE_POOL[0]
  return WORKOUT_IMAGE_POOL[hashString(key) % WORKOUT_IMAGE_POOL.length]
}

// Exact de titel die de coach in het schema heeft gezet (workoutData.name).
// Geen herformattering — caps blijven caps, "PUSH A" blijft "PUSH A".
const getWorkoutLabel = (workoutData) => {
  return (workoutData?.name || workoutData?.focus || '').trim()
}

export default function WorkoutIndicator({ workoutData, isMobile }) {
  const img = getWorkoutImage(workoutData)
  const label = getWorkoutLabel(workoutData)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: isMobile ? '0.275rem' : '0.325rem', width: '100%' }}>
      <div style={{ width: isMobile ? '38px' : '44px', height: isMobile ? '44px' : '52px', borderRadius: '3px', background: `url(${img}) center/cover`, border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%', background: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.5) 100%)' }} />
      </div>
      <div style={{ fontSize: isMobile ? '0.5rem' : '0.55rem', color: 'rgba(255,255,255,0.55)', fontWeight: '700', maxWidth: isMobile ? '44px' : '50px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textTransform: 'capitalize', lineHeight: 1 }}>
        {label}
      </div>
    </div>
  )
}
