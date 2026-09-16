// src/modules/workout/utils/exerciseMeta.js
//
// Spiergroep en materiaal komen uit de exercises-tabel, niet uit de kopie in
// het schema.
//
// Een oefening staat op drie plekken: exercises (de bron), de kopie in
// workout_schemas.week_structure en nog een kopie in
// client_exercise_overrides.exercise_data zodra een klant zijn sets aanpast.
// Corrigeer je de bron, dan blijven die kopieën staan zoals ze waren, en toont
// de app een oefening onder de verkeerde kop. Dat gebeurde op 14-09 met "Cable
// Overhead Triceps Extension": in exercises al triceps, in de schema's nog
// shoulders.
//
// Daarom: bij het laden van het schema de meta uit de tabel eroverheen leggen.
// Sets, reps, rust en notities blijven van het schema en de override, want dat
// is wat de coach voor deze klant heeft bepaald. Alleen wat een eigenschap van
// de oefening zelf is komt uit de bron.
//
// Staat een naam niet in exercises (eigen oefening van een klant, 41 van de
// 665 in de huidige schema's), dan blijft de kopie staan. Beter een oude
// spiergroep dan geen.

// Eén keer per sessie laden: een schema heeft tien oefeningen en die zouden
// anders tien losse queries worden.
let cache = null
let bezig = null

// `bron` mag een DatabaseService zijn of een supabase-client: de aanroepers
// hebben nu eens het een en dan weer het ander bij de hand.
export async function laadExerciseMeta(bron) {
  if (cache) return cache
  if (bezig) return bezig
  const sb = bron?.supabase || bron
  bezig = (async () => {
    try {
      if (!sb?.from) throw new Error('geen supabase-client')
      const { data, error } = await sb
        .from('exercises')
        .select('name, primair_spieren, equipment, type, video_url, fallback_video_url')
      if (error) throw error
      const map = new Map()
      for (const r of data || []) {
        const sleutel = String(r.name || '').trim().toLowerCase()
        if (sleutel) map.set(sleutel, r)
      }
      cache = map
      return map
    } catch (e) {
      // Niet cachen bij een fout: de volgende poging moet het opnieuw proberen.
      console.error('Oefening-meta laden mislukt:', e)
      return new Map()
    } finally {
      bezig = null
    }
  })()
  return bezig
}

// Voor het geval de coach een oefening aanpast en de app open houdt.
export function wisExerciseMetaCache() { cache = null }

// Legt de meta uit de bron over één oefening heen. Video's vullen we alleen
// aan als ze ontbreken: heeft de coach er zelf een bij gezet, dan blijft die.
export function verrijkOefening(ex, meta) {
  if (!ex || !meta) return ex
  const bron = meta.get(String(ex.name || '').trim().toLowerCase())
  if (!bron) return ex
  return {
    ...ex,
    primairSpieren: bron.primair_spieren || ex.primairSpieren,
    equipment: bron.equipment || ex.equipment,
    type: bron.type || ex.type,
    video_url: ex.video_url || bron.video_url,
    fallback_video_url: ex.fallback_video_url || bron.fallback_video_url,
  }
}

// Dezelfde behandeling voor een hele week_structure. De vorm blijft gelijk:
// per dag een object met een exercises-array, en dagen die daar niet aan
// voldoen laten we met rust.
export function verrijkWeekStructure(weekStructure, meta) {
  if (!weekStructure || !meta || meta.size === 0) return weekStructure
  const uit = {}
  for (const [dagkey, dag] of Object.entries(weekStructure)) {
    if (dag && Array.isArray(dag.exercises)) {
      uit[dagkey] = { ...dag, exercises: dag.exercises.map(ex => verrijkOefening(ex, meta)) }
    } else {
      uit[dagkey] = dag
    }
  }
  return uit
}
