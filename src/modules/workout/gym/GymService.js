// src/modules/workout/gym/GymService.js
//
// Waar train je vandaag? Eén klant kan meerdere sportscholen hebben en wisselt
// daartussen tijdens het loggen.
//
// De eenheid hoort bij de sportschool: dezelfde persoon traint hier in kilo's
// en ergens anders op een rek met ponden. In de database staat altijd kilo —
// lb is alleen hoe je het invoert en terugleest. Anders zou dezelfde oefening
// twee betekenissen krijgen en klopt geen enkele grafiek meer.

export const KG_PER_LB = 0.45359237

export const naarKg = (waarde, eenheid) => {
  const n = Number(waarde)
  if (!Number.isFinite(n)) return null
  return eenheid === 'lb' ? Math.round(n * KG_PER_LB * 100) / 100 : n
}

export const vanKg = (kilo, eenheid) => {
  const n = Number(kilo)
  if (!Number.isFinite(n)) return null
  return eenheid === 'lb' ? Math.round((n / KG_PER_LB) * 2) / 2 : n
}

export const eenheidLabel = (eenheid) => (eenheid === 'lb' ? 'lb' : 'kg')

export async function haalGyms(db, clientId) {
  if (!db?.supabase || !clientId) return { gyms: [], actiefId: null }
  const [gymRes, klantRes] = await Promise.all([
    db.supabase.from('client_gyms')
      .select('id, naam, eenheid')
      .eq('client_id', clientId)
      .order('naam', { ascending: true })
      .then(r => r, e => ({ data: [], error: e })),
    db.supabase.from('clients')
      .select('actieve_gym_id')
      .eq('id', clientId)
      .maybeSingle()
      .then(r => r, e => ({ data: null, error: e })),
  ])
  const gyms = gymRes?.data || []
  const opgeslagen = klantRes?.data?.actieve_gym_id || null
  // Is de opgeslagen sportschool verwijderd, dan valt hij terug op de eerste.
  const actiefId = gyms.some(g => g.id === opgeslagen) ? opgeslagen : (gyms[0]?.id || null)
  return { gyms, actiefId }
}

export async function kiesGym(db, clientId, gymId) {
  const { error } = await db.supabase
    .from('clients').update({ actieve_gym_id: gymId }).eq('id', clientId)
  if (error) return { error: error.message }

  // Wissel je halverwege de dag, dan hoort de training van vandaag mee te
  // verhuizen. De sessie wordt bij de eerste set aangemaakt en draagt dan nog
  // de vorige sportschool.
  const nu = new Date()
  const vandaag = `${nu.getFullYear()}-${String(nu.getMonth() + 1).padStart(2, '0')}-${String(nu.getDate()).padStart(2, '0')}`
  await db.supabase.from('workout_sessions')
    .update({ gym_id: gymId })
    .eq('client_id', clientId)
    .eq('workout_date', vandaag)
  return { error: null }
}

export async function bewaarGym(db, { id, clientId, naam, eenheid }) {
  const schoon = String(naam || '').trim()
  if (!schoon) return { error: 'Geef de sportschool een naam.', gym: null }
  const rij = { client_id: clientId, naam: schoon, eenheid: eenheid === 'lb' ? 'lb' : 'kg' }

  // Is dit de eerste? Dan hoort alles wat hij tot nu toe logde hier thuis: hij
  // trainde al ergens, hij had het alleen nog niet opgeschreven. Tellen vóór de
  // insert, anders telt de nieuwe zichzelf mee.
  const eerste = !id && await isEerste(db, clientId)

  const vraag = id
    ? db.supabase.from('client_gyms').update({ ...rij, updated_at: new Date().toISOString() }).eq('id', id).select('id, naam, eenheid').maybeSingle()
    : db.supabase.from('client_gyms').insert(rij).select('id, naam, eenheid').maybeSingle()

  const { data, error } = await vraag
  if (error) {
    // De unique-index op (client_id, naam) is de enige die hier kan botsen.
    const dubbel = error.code === '23505'
    return { error: dubbel ? 'Je hebt al een sportschool met die naam.' : error.message, gym: null }
  }

  let overgenomen = 0
  if (eerste && data?.id) {
    const res = await neemHistorieOver(db, clientId, data.id)
    overgenomen = res.aantal
  }
  return { error: null, gym: data, overgenomen }
}

async function isEerste(db, clientId) {
  const { count, error } = await db.supabase
    .from('client_gyms')
    .select('id', { count: 'exact', head: true })
    .eq('client_id', clientId)
  if (error) return false          // bij twijfel niets overnemen
  return (count || 0) === 0
}

// Alle trainingen die nog nergens bij horen onder deze sportschool hangen, en
// hem meteen als de actieve zetten.
//
// Alleen bij de eerste: heeft iemand er al twee, dan weten we niet waar een
// losse sessie bij hoorde en is stilletjes gokken erger dan niets doen.
export async function neemHistorieOver(db, clientId, gymId) {
  const { data, error } = await db.supabase
    .from('workout_sessions')
    .update({ gym_id: gymId })
    .eq('client_id', clientId)
    .is('gym_id', null)
    .select('id')
  if (error) return { error: error.message, aantal: 0 }
  await db.supabase.from('clients').update({ actieve_gym_id: gymId }).eq('id', clientId)
  return { error: null, aantal: (data || []).length }
}

export async function verwijderGym(db, gymId) {
  const { error } = await db.supabase.from('client_gyms').delete().eq('id', gymId)
  return { error: error?.message || null }
}
