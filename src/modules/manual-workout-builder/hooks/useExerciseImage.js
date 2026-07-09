// src/modules/manual-workout-builder/hooks/useExerciseImage.js
// Foto-/video-laadlogica voor een oefening — exact dezelfde ketting als de
// client-workout-kaart (thumbnail_url → YouTube-thumb → custom_exercises →
// exercises-tabel → ExerciseService → keyword-fallback), zodat de builder-
// kaarten dezelfde foto's tonen als de klant ziet.
import { useState, useEffect } from 'react'
import ExerciseService from '../../../services/ExerciseService'

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

const deriveYoutubeThumb = (url) => {
  if (!url) return null
  const m = String(url).match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{6,})/)
  if (!m) return null
  return `https://img.youtube.com/vi/${m[1]}/hqdefault.jpg`
}

export default function useExerciseImage(exercise, db, client) {
  const [imageUrl, setImageUrl] = useState(getFallbackImage(exercise))
  const [loadingImage, setLoadingImage] = useState(true)
  const [hasVideo, setHasVideo] = useState(!!exercise?.video_url)

  useEffect(() => {
    let cancelled = false
    const set = (url, video) => { if (!cancelled) { setImageUrl(url); setHasVideo(video); setLoadingImage(false) } }

    ;(async () => {
      setLoadingImage(true)
      let foundVideo = !!exercise?.video_url
      try {
        if (exercise?.thumbnail_url) return set(exercise.thumbnail_url, foundVideo)

        const ytFromEx = deriveYoutubeThumb(exercise?.video_url)
        if (ytFromEx) return set(ytFromEx, true)

        // Custom oefening → foto uit custom_exercises.
        if ((exercise?.type === 'custom' || exercise?._isCustom) && client?.id && db?.supabase) {
          const { data } = await db.supabase
            .from('custom_exercises').select('image_url')
            .eq('client_id', client.id).eq('name', exercise.name).maybeSingle()
          if (data?.image_url) return set(data.image_url, foundVideo)
        }

        // Standaard oefening → exercises-tabel.
        if (db?.supabase && exercise?.name) {
          const { data: ex } = await db.supabase
            .from('exercises').select('thumbnail_url, video_url, fallback_video_url, image_url')
            .eq('name', exercise.name).maybeSingle()
          if (ex?.video_url || ex?.fallback_video_url) foundVideo = true
          if (ex?.thumbnail_url) return set(ex.thumbnail_url, foundVideo)
          const yt = deriveYoutubeThumb(ex?.video_url)
          if (yt) return set(yt, foundVideo)
          if (ex?.image_url) return set(ex.image_url, foundVideo)
        }

        const url = await ExerciseService.getExerciseImage(exercise?.name)
        set(url || getFallbackImage(exercise), foundVideo)
      } catch {
        set(getFallbackImage(exercise), foundVideo)
      }
    })()

    return () => { cancelled = true }
  }, [exercise?.name, exercise?.thumbnail_url, exercise?.video_url, exercise?.type, client?.id])

  return { imageUrl, loadingImage, hasVideo }
}
