// src/modules/workout/components/week-schedule/WorkoutIndicator.jsx
//
// Toont per workout-dag een edge-to-edge foto-banner + de workout-titel
// daaronder in dik wit. Foto wordt deterministisch gekozen uit een pool zodat
// dezelfde workout-naam altijd dezelfde foto krijgt.

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

// Max aantal karakters in de tile-titel zodat alle cards een vaste grootte
// houden. Langer → afgekapt met ellipsis. CSS text-overflow is een vangnet
// voor edge-cases, maar deze JS-truncatie zorgt voor deterministisch gedrag.
const MAX_LABEL_CHARS = 8

// Exact de titel die de coach in het schema heeft gezet (workoutData.name).
// Geen herformattering — caps blijven caps, "PUSH A" blijft "PUSH A".
const getWorkoutLabel = (workoutData) => {
  const raw = (workoutData?.name || workoutData?.focus || '').trim()
  return raw.length > MAX_LABEL_CHARS ? `${raw.slice(0, MAX_LABEL_CHARS)}…` : raw
}

export default function WorkoutIndicator({ workoutData, isMobile }) {
  const img = getWorkoutImage(workoutData)
  const label = getWorkoutLabel(workoutData)

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Edge-to-edge foto-banner */}
      <div style={{
        width: '100%',
        height: isMobile ? 30 : 36,
        backgroundImage: `url(${img})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        position: 'relative',
        flexShrink: 0,
      }}>
        {/* Subtiele donkere overgang onderaan zodat de titel-grens niet hard
            tegen een lichte foto botst. */}
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: 0,
          height: '50%',
          background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.45) 100%)',
        }} />
      </div>

      {/* Workout-titel — dik gedrukt vel wit */}
      <div style={{
        padding: isMobile ? '6px 4px 0' : '7px 6px 0',
        fontSize: isMobile ? '0.66rem' : '0.72rem',
        fontWeight: 900,
        color: '#fff',
        letterSpacing: '0.02em',
        lineHeight: 1.15,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        textAlign: 'center',
        maxWidth: '100%',
      }}>
        {label}
      </div>
    </div>
  )
}
