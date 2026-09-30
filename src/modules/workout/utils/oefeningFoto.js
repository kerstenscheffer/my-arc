// src/modules/workout/utils/oefeningFoto.js
//
// Welke foto hoort bij een oefening? Eén antwoord voor de hele app.
//
// Dit stond als losse functie in ExerciseCard en werd nu ook nodig in de
// check-in (de kaarten "sterker geworden op"). Twee kopieën van dezelfde
// zoekketen lopen vroeg of laat uit elkaar, en dan heeft een oefening op de
// workout-pagina een andere foto dan in de terugblik.
//
// Volgorde, dezelfde als de kaart altijd al aanhield:
//   1. thumbnail_url op de oefening zelf (door de coach gekozen frame)
//   2. een YouTube-thumbnail afgeleid uit video_url
//   3. custom_exercises.image_url, voor eigen oefeningen van de klant
//   4. de exercises-tabel: thumbnail, YouTube-thumb, image_url
//   5. ExerciseService.getExerciseImage
//   6. een stockfoto op basis van de naam of spiergroep

import ExerciseService from '../../../services/ExerciseService'

// Zelfde regex als de editor, zodat beide kanten dezelfde thumb afleiden.
export const youtubeThumb = (url) => {
  if (!url) return null
  const m = String(url).match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{6,})/)
  return m ? `https://img.youtube.com/vi/${m[1]}/hqdefault.jpg` : null
}

const U = (id) => `https://images.unsplash.com/${id}?w=400&h=400&fit=crop&q=80&crop=center`

export const getFallbackImage = (exercise) => {
  const name = (exercise?.name || '').toLowerCase()
  const muscles = (exercise?.primairSpieren || exercise?.muscleGroup || '').toLowerCase()
  const c = `${name} ${muscles}`
  const heeft = (...w) => w.some(x => c.includes(x))
  if (exercise?.type === 'cardio') return U('photo-1538805060514-97d9cc17730c')
  if (heeft('bench', 'chest', 'push', 'borst', 'fly', 'pec')) return U('photo-1598971457999-ca4ef48a9a71')
  if (heeft('row', 'back', 'pull', 'rug', 'lat', 'deadlift')) return U('photo-1603287681836-b174ce5074c2')
  if (heeft('squat', 'leg', 'lunge', 'been', 'quad', 'hamstring', 'calf', 'kuit')) return U('photo-1567598508481-65985588e295')
  if (heeft('shoulder', 'delt', 'schouder', 'lateral', 'raise', 'overhead')) return U('photo-1541534741688-6078c6bfb5c5')
  if (heeft('bicep', 'tricep', 'curl', 'arm', 'extension', 'hammer')) return U('photo-1583454110551-21f2fa2afe61')
  if (heeft('core', 'ab', 'plank', 'crunch', 'buik')) return U('photo-1544367567-0f2fcb009e0b')
  if (heeft('glute', 'hip thrust', 'bil')) return U('photo-1434682881908-b43d0467b798')
  if (heeft('cardio', 'run', 'bike', 'fiets')) return U('photo-1538805060514-97d9cc17730c')
  return U('photo-1517836357463-d25dfeac3438')
}

/**
 * De foto-URL voor een oefening, via de keten hierboven. Geeft altijd iets
 * terug; in het slechtste geval de stockfoto.
 *
 * @param {object} db         DatabaseService (voor db.supabase)
 * @param {object} exercise   minstens { name }; type/_isCustom voor eigen oefeningen
 * @param {string} [clientId] nodig om custom_exercises te kunnen raadplegen
 */
export async function laadOefeningFoto(db, exercise, clientId = null) {
  const naam = exercise?.name
  if (!naam) return getFallbackImage(exercise)
  try {
    if (exercise.thumbnail_url) return exercise.thumbnail_url
    const eigenThumb = youtubeThumb(exercise.video_url)
    if (eigenThumb) return eigenThumb

    if ((exercise.type === 'custom' || exercise._isCustom) && clientId && db?.supabase) {
      const { data } = await db.supabase
        .from('custom_exercises').select('image_url')
        .eq('client_id', clientId).eq('name', naam).maybeSingle()
      if (data?.image_url) return data.image_url
    }

    if (db?.supabase) {
      const { data: ex } = await db.supabase
        .from('exercises').select('thumbnail_url, video_url, image_url')
        .eq('name', naam).maybeSingle()
      if (ex?.thumbnail_url) return ex.thumbnail_url
      const thumb = youtubeThumb(ex?.video_url)
      if (thumb) return thumb
      if (ex?.image_url) return ex.image_url
    }

    const url = await ExerciseService.getExerciseImage(naam)
    return url || getFallbackImage(exercise)
  } catch {
    return getFallbackImage(exercise)
  }
}
