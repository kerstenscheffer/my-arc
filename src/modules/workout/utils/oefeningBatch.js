// src/modules/workout/utils/oefeningBatch.js
//
// Elke oefeningkaart vroeg los zijn foto (exercises) en coach-feedback
// (client_exercise_submissions) op: 2–4 queries per oefening, bij elke
// keer openen. Hier worden de vragen die in hetzelfde moment binnenkomen
// gebundeld tot één .in()-query per tabel.
//   - oefeningInfo: blijft bewaard zolang de app open is (verandert zelden).
//   - laatsteFeedback: 60 s bewaard, de coach kan intussen reageren.

const INFO_KOLOMMEN = 'name, thumbnail_url, video_url, fallback_video_url, image_url'

function bundelaar(haalOp) {
  let wacht = null // { sleutels: Set, beloftes: Map }
  return (groep, sleutel) => {
    if (!wacht) {
      const huidig = { groep, sleutels: new Set(), oplossers: new Map() }
      wacht = huidig
      queueMicrotask(async () => {
        if (wacht === huidig) wacht = null
        let uitkomst = new Map()
        try { uitkomst = await haalOp(huidig.groep, [...huidig.sleutels]) } catch { /* leeg: elke kaart valt terug */ }
        huidig.oplossers.forEach((fns, k) => fns.forEach(f => f(uitkomst.get(k) ?? null)))
      })
    }
    // Andere groep (bv. andere klant) in hetzelfde moment: los ophalen.
    if (wacht.groep !== groep) return haalOp(groep, [sleutel]).then(m => m.get(sleutel) ?? null, () => null)
    wacht.sleutels.add(sleutel)
    return new Promise(res => {
      const lijst = wacht.oplossers.get(sleutel) || []
      lijst.push(res)
      wacht.oplossers.set(sleutel, lijst)
    })
  }
}

const infoBundel = bundelaar(async (db, namen) => {
  const { data } = await db.supabase.from('exercises').select(INFO_KOLOMMEN).in('name', namen)
  const m = new Map()
  ;(data || []).forEach(r => { if (!m.has(r.name)) m.set(r.name, r) })
  return m
})
const infoCache = new Map()

export function oefeningInfo(db, naam) {
  if (!naam || !db?.supabase) return Promise.resolve(null)
  if (!infoCache.has(naam)) {
    const p = infoBundel(db, naam)
    infoCache.set(naam, p)
    p.then(r => { if (r == null) infoCache.delete(naam) })
  }
  return infoCache.get(naam)
}

const feedbackBundel = bundelaar(async ({ db, clientId }, namen) => {
  const { data } = await db.supabase
    .from('client_exercise_submissions')
    .select('exercise_name, coach_feedback, status, created_at')
    .eq('client_id', clientId)
    .in('exercise_name', namen)
    .order('created_at', { ascending: false })
  const m = new Map()
  ;(data || []).forEach(r => { if (!m.has(r.exercise_name)) m.set(r.exercise_name, r) })
  return m
})
const feedbackGroepen = new Map() // clientId → groep-object (zelfde referentie voor de bundelaar)
const feedbackCache = new Map() // `${clientId}|${naam}` → { t, p }

export function laatsteFeedback(db, clientId, naam) {
  if (!naam || !clientId || !db?.supabase) return Promise.resolve(null)
  const k = `${clientId}|${naam}`
  const c = feedbackCache.get(k)
  if (c && Date.now() - c.t < 60000) return c.p
  if (!feedbackGroepen.has(clientId) || feedbackGroepen.get(clientId).db !== db) feedbackGroepen.set(clientId, { db, clientId })
  const p = feedbackBundel(feedbackGroepen.get(clientId), naam)
  feedbackCache.set(k, { t: Date.now(), p })
  return p
}
