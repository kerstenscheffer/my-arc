// src/modules/workout/utils/oefeningFoto.js
//
// Welke foto hoort bij een oefening? Eén antwoord voor de hele app.
//
// Dit stond als losse functie in ExerciseCard en werd nu ook nodig in de
// check-in (de kaarten "sterker geworden op"). Twee kopieën van dezelfde
// zoekketen lopen vroeg of laat uit elkaar, en dan heeft een oefening op de
// workout-pagina een andere foto dan in de terugblik.
//
// Volgorde per rij (okt 2026 omgedraaid):
//   1. image_url (github raw van free-exercise-db, laadt betrouwbaar)
//   2. thumbnail_url (door de coach gekozen frame)
//   3. een YouTube-thumbnail uit video_url, daarna uit fallback_video_url
// Daarna custom_exercises, ExerciseService en als laatste een stockfoto.
//
// i.ibb.co / imgbb.com doen nooit meer mee: die host geeft een 503 terug mét
// een blauw PNG-plaatje ("service unavailable"). De browser toont dat gewoon,
// onError vuurt niet, dus doorschuiven werkt niet — weglaten is de enige weg.

import ExerciseService from '../../../services/ExerciseService'

export const isKapotteFotoHost = (url) => /(^|[/.])(ibb\.co|imgbb\.com)([/:?]|$)/i.test(String(url || ''))
const bruikbaar = (url) => !!url && !isKapotteFotoHost(url)

// Zelfde regex als de editor, zodat beide kanten dezelfde thumb afleiden.
export const youtubeId = (url) => {
  if (!url) return null
  const m = String(url).match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{6,})/)
  return m ? m[1] : null
}

export const youtubeThumb = (url) => {
  const id = youtubeId(url)
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null
}

// Reserve-thumbnails voor OefeningThumb: hqdefault bestaat altijd, mqdefault
// als tweede kans bij een haperende CDN-node.
export const youtubeThumbs = (url) => {
  const id = youtubeId(url)
  return id ? [`https://i.ytimg.com/vi/${id}/hqdefault.jpg`, `https://i.ytimg.com/vi/${id}/mqdefault.jpg`] : []
}

// Alle foto-kandidaten uit één of meer rijen, in de vaste volgorde. Voor
// OefeningThumb: valt de eerste weg, dan toont hij de volgende.
export const fotoKandidaten = (...rijen) => {
  const uit = []
  for (const r of rijen) {
    if (!r) continue
    uit.push(r.image_url, r.thumbnail_url, youtubeThumb(r.video_url), youtubeThumb(r.fallback_video_url))
  }
  return [...new Set(uit.filter(bruikbaar))]
}

// Filter voor losse url-lijsten (bijv. de bronnen van OefeningThumb).
export const bruikbareFotos = (lijst) => [...new Set((lijst || []).filter(bruikbaar))]

// Neutraal halter-vlak als allerlaatste laag, voor plekken die de foto als
// background-image tonen (daar bestaat geen onError).
const HALTER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#151515"/><g fill="none" stroke="rgba(255,255,255,0.45)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" transform="translate(32 32) scale(1.5)"><path d="M17.596 12.768a2 2 0 1 0 2.829-2.829l-1.768-1.767a2 2 0 0 0 2.828-2.829l-2.828-2.828a2 2 0 0 0-2.829 2.828l-1.767-1.768a2 2 0 1 0-2.829 2.829z"/><path d="m2.5 21.5 1.4-1.4"/><path d="m20.1 3.9 1.4-1.4"/><path d="M5.343 21.485a2 2 0 1 0 2.829-2.828l1.767 1.768a2 2 0 1 0 2.829-2.829l-6.364-6.364a2 2 0 1 0-2.829 2.829l1.768 1.767a2 2 0 0 0-2.828 2.829z"/><path d="m9.6 14.4 4.8-4.8"/></g></svg>`
export const HALTER_PLACEHOLDER = `data:image/svg+xml,${encodeURIComponent(HALTER_SVG)}`

// CSS background-image met alle kandidaten als lagen: laadt de bovenste niet,
// dan schijnt de volgende erdoor, met het halter-vlak als bodem.
export const fotoAchtergrond = (urls) =>
  [...bruikbareFotos(urls), HALTER_PLACEHOLDER].map(u => `url("${String(u).replace(/"/g, '%22')}")`).join(', ')

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
    const eigen = fotoKandidaten(exercise)[0]
    if (eigen) return eigen

    if ((exercise.type === 'custom' || exercise._isCustom) && clientId && db?.supabase) {
      const { data } = await db.supabase
        .from('custom_exercises').select('image_url, thumbnail_url')
        .eq('client_id', clientId).eq('name', naam).maybeSingle()
      const custom = fotoKandidaten(data)[0]
      if (custom) return custom
    }

    if (db?.supabase) {
      const { data: ex } = await db.supabase
        .from('exercises').select('thumbnail_url, video_url, image_url, fallback_video_url')
        .eq('name', naam).maybeSingle()
      const uitTabel = fotoKandidaten(ex)[0]
      if (uitTabel) return uitTabel
    }

    const url = await ExerciseService.getExerciseImage(naam)
    return bruikbaar(url) ? url : getFallbackImage(exercise)
  } catch {
    return getFallbackImage(exercise)
  }
}

// Synchrone variant voor lijsten: de foto uit een exercises-rij die de
// media-kolommen al bij zich heeft. Zelfde volgorde als hierboven, met als
// laatste de YouTube-thumb van de externe uitlegvideo (fallback_video_url):
// die staat bij 212 van de 219 oefeningen en is altijd de juiste oefening,
// in tegenstelling tot de stockfoto per spiergroep.
export const fotoUitRij = (ex) => fotoKandidaten(ex)[0] || null

// Media van alle actieve oefeningen in één query, één keer per sessie.
// Het wissel- en toevoegvenster vroegen eerder per oefening de foto op
// (219 losse verzoeken achter elkaar).
let mediaBelofte = null
export function laadOefeningMedia(db) {
  if (!db?.supabase) return Promise.resolve(new Map())
  if (!mediaBelofte) {
    mediaBelofte = db.supabase
      .from('exercises')
      .select('name, thumbnail_url, video_url, fallback_video_url, image_url')
      .eq('is_active', true)
      .then(
        ({ data, error }) => {
          if (error) { mediaBelofte = null; return new Map() }
          return new Map((data || []).map(r => [r.name, r]))
        },
        () => { mediaBelofte = null; return new Map() }
      )
  }
  return mediaBelofte
}
