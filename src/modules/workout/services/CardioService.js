// src/modules/workout/services/CardioService.js
//
// Cardio staat los van het krachtschema. De coach zet per klant vast wát er
// aan cardio moet gebeuren (client_cardio_plan), de klant logt wat hij deed
// (cardio_logs). Beide kanten praten via dit bestand met de database, zodat
// de weekgrens en het koppelen van log aan plan maar op één plek staan.

// Maandag als start van de week (NL-conventie), als YYYY-MM-DD in lokale tijd.
// Niet via toISOString: die zet 's avonds de datum een dag terug.
export function weekStartISO(datum = new Date()) {
  const d = new Date(datum)
  const dag = (d.getDay() + 6) % 7 // 0 = maandag
  d.setDate(d.getDate() - dag)
  d.setHours(0, 0, 0, 0)
  const j = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const da = String(d.getDate()).padStart(2, '0')
  return `${j}-${m}-${da}`
}

// Soort cardio normaliseren voor het koppelen van een log aan een plan-regel.
// "Wandelen " en "wandelen" zijn hetzelfde; hoofdletters en spaties zijn hier
// geen betekenis.
export const normaliseerSoort = (v) => String(v || '').trim().toLowerCase()

const CardioService = {
  async getPlan(clientId, db) {
    if (!clientId || !db?.supabase) return []
    const { data, error } = await db.supabase
      .from('client_cardio_plan')
      .select('*')
      .eq('client_id', clientId)
      .eq('active', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })
    if (error) { console.error('❌ getPlan cardio:', error); return [] }
    return data || []
  },

  async savePlanItem(item, db) {
    if (!item?.client_id || !item?.cardio_type || !db?.supabase) return null
    const rij = {
      client_id: item.client_id,
      cardio_type: String(item.cardio_type).trim(),
      times_per_week: Number(item.times_per_week) || 1,
      duration_minutes: item.duration_minutes ? parseInt(item.duration_minutes, 10) : null,
      distance_km: item.distance_km ? parseFloat(item.distance_km) : null,
      steps: item.steps ? parseInt(item.steps, 10) : null,
      intensity: item.intensity?.trim() || null,
      notes: item.notes?.trim() || null,
      sort_order: Number(item.sort_order) || 0,
      updated_at: new Date().toISOString(),
    }
    const query = item.id
      ? db.supabase.from('client_cardio_plan').update(rij).eq('id', item.id).select().single()
      : db.supabase.from('client_cardio_plan').insert(rij).select().single()
    const { data, error } = await query
    if (error) { console.error('❌ savePlanItem cardio:', error); return null }
    return data
  },

  // Weghalen is een vlag, geen delete: gelogde sessies blijven bestaan en
  // zouden anders naar een regel wijzen die er niet meer is.
  async deactivatePlanItem(id, db) {
    if (!id || !db?.supabase) return false
    const { error } = await db.supabase
      .from('client_cardio_plan')
      .update({ active: false, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) { console.error('❌ deactivatePlanItem cardio:', error); return false }
    return true
  },

  async getLogs(clientId, vanafDatum, db) {
    if (!clientId || !db?.supabase) return []
    const { data, error } = await db.supabase
      .from('cardio_logs')
      .select('*')
      .eq('client_id', clientId)
      .gte('logged_date', vanafDatum)
      .order('logged_date', { ascending: false })
      .order('created_at', { ascending: false })
    if (error) { console.error('❌ getLogs cardio:', error); return [] }
    return data || []
  },

  async addLog(log, db) {
    if (!log?.client_id || !log?.cardio_type || !db?.supabase) return null
    const { data, error } = await db.supabase.from('cardio_logs').insert([{
      client_id: log.client_id,
      cardio_type: String(log.cardio_type).trim(),
      duration_minutes: log.duration_minutes ? parseInt(log.duration_minutes, 10) : null,
      distance_km: log.distance_km ? parseFloat(log.distance_km) : null,
      steps: log.steps ? parseInt(log.steps, 10) : null,
      notes: log.notes?.trim() || null,
    }]).select().single()
    if (error) { console.error('❌ addLog cardio:', error); throw error }
    return data
  },

  async deleteLog(id, db) {
    if (!id || !db?.supabase) return false
    const { error } = await db.supabase.from('cardio_logs').delete().eq('id', id)
    if (error) { console.error('❌ deleteLog cardio:', error); return false }
    return true
  },

  // Hoeveel sessies van deze soort staan er deze week? Op soort gematcht en
  // niet op een verwijzing, want de klant kan ook los loggen — dan telt die
  // sessie gewoon mee voor de bijbehorende plan-regel.
  telVoorPlan(plan, logs) {
    const soort = normaliseerSoort(plan?.cardio_type)
    return (logs || []).filter(l => normaliseerSoort(l.cardio_type) === soort).length
  },
}

export default CardioService
