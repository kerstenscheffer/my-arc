// src/modules/manual-workout-builder/hooks/useExerciseImage.js
// Foto-/video-laadlogica voor een oefening — exact dezelfde ketting als de
// client-workout-kaart (thumbnail_url → YouTube-thumb → custom_exercises →
// exercises-tabel → ExerciseService → keyword-fallback), zodat de builder-
// kaarten dezelfde foto's tonen als de klant ziet.
import { useState, useEffect } from 'react'
import ExerciseService from '../../../services/ExerciseService'
import { fotoKandidaten } from '../../workout/utils/oefeningFoto'

export const getFallbackImage = (exercise) => {
  const name = (exercise?.name || '').toLowerCase()
  const muscles = (exercise?.primairSpieren || exercise?.muscleGroup || exercise?.muscle || '').toLowerCase()
  const combined = `${name} ${muscles}`
  if (combined.includes('bench') || combined.includes('chest') || combined.includes('push') || combined.includes('borst') || combined.includes('fly') || combined.includes('pec')) return 'https://images.unsplash.com/photo-1598971457999-ca4ef48a9a71?w=400&h=400&fit=crop&q=80&crop=center'
  if (combined.includes('row') || combined.includes('back') || combined.includes('pull') || combined.includes('rug') || combined.includes('lat') || combined.includes('deadlift')) return 'https://images.unsplash.com/photo-1603287681836-b174ce5074c2?w=400&h=400&fit=crop&q=80&crop=center'
  if (combined.includes('squat') || combined.includes('leg') || combined.includes('lunge') || combined.includes('been') || combined.includes('quad') || combined.includes('hamstring') || combined.includes('calf') || combined.includes('kuit')) return 'https://images.unsplash.com/photo-1567598508481-65985588e295?w=400&h=400&fit=crop&q=80&crop=center'
  if (combined.includes('shoulder') || combined.includes('delt') || combined.includes('schouder') || combined.includes('lateral') || combined.includes('raise') || combined.includes('overhead')) return 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=400&h=400&fit=crop&q=80&crop=center'
  if (combined.includes('bicep') || combined.includes('tricep') || combined.includes('curl') || combined.includes('arm') || combined.includes('extension') || combined.includes('hammer')) return 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400&h=400&fit=crop&q=80&crop=center'
  if (combined.includes('core') || combined.includes('ab') || combined.includes('plank') || combined.includes('crunch') || combined.includes('buik')) return 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=400&fit=crop&q=80&crop=center'
  if (combined.includes('glute') || combined.includes('hip thrust') || combined.includes('bil')) return 'https://images.unsplash.com/photo-1434682881908-b43d0467b798?w=400&h=400&fit=crop&q=80&crop=center'
  if (combined.includes('cardio') || combined.includes('run') || combined.includes('bike') || combined.includes('fiets')) return 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=400&h=400&fit=crop&q=80&crop=center'
  return 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&h=400&fit=crop&q=80&crop=center'
}

// Alle kandidaten in volgorde, zodat OefeningThumb bij een laadfout
// (i.ibb.co) kan doorschuiven naar de YouTube-thumb of de stockfoto.
export default function useExerciseImage(exercise, db, client) {
  const [imageUrls, setImageUrls] = useState(() => [...fotoKandidaten(exercise), getFallbackImage(exercise)])
  const [loadingImage, setLoadingImage] = useState(true)
  const [hasVideo, setHasVideo] = useState(!!exercise?.video_url)

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      setLoadingImage(true)
      let foundVideo = !!exercise?.video_url
      const lijst = fotoKandidaten(exercise)
      try {
        // Custom oefening → foto uit custom_exercises.
        if ((exercise?.type === 'custom' || exercise?._isCustom) && client?.id && db?.supabase) {
          const { data } = await db.supabase
            .from('custom_exercises').select('image_url')
            .eq('client_id', client.id).eq('name', exercise.name).maybeSingle()
          if (data?.image_url) lijst.push(data.image_url)
        }

        // Standaard oefening → exercises-tabel.
        if (db?.supabase && exercise?.name) {
          const { data: ex } = await db.supabase
            .from('exercises').select('thumbnail_url, video_url, fallback_video_url, image_url')
            .eq('name', exercise.name).maybeSingle()
          if (ex?.video_url || ex?.fallback_video_url) foundVideo = true
          lijst.push(...fotoKandidaten(ex))
        }

        if (!lijst.length) {
          const url = await ExerciseService.getExerciseImage(exercise?.name)
          if (url) lijst.push(url)
        }
      } catch { /* stockfoto hieronder */ }
      lijst.push(getFallbackImage(exercise))
      if (!cancelled) { setImageUrls([...new Set(lijst)]); setHasVideo(foundVideo); setLoadingImage(false) }
    })()

    return () => { cancelled = true }
  }, [exercise?.name, exercise?.thumbnail_url, exercise?.video_url, exercise?.type, client?.id])

  return { imageUrl: imageUrls[0], imageUrls, loadingImage, hasVideo }
}
