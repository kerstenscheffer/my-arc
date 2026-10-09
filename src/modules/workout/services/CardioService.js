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
      intensity: log.intensity || null,
      calories: Number.isFinite(Number(log.calories)) && Number(log.calories) > 0 ? Math.round(Number(log.calories)) : null,
      calories_source: log.calories_source || null,
      ...(log.logged_date ? { logged_date: log.logged_date } : {}),
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

  // ── Cardio inplannen als agendablokken ────────────────────────────────
  // Zelfde opslag voor klant (Training toevoegen) en coach (Workout Builder):
  // client_agenda_blocks, type 'custom', label 'Cardio · <soort>'.
  //   standaard -> week_start null (elke week) + regel in client_cardio_plan
  //   eenmalig  -> week_start = maandag van die week
  maandagIso(d = new Date()) {
    const m = new Date(d); m.setDate(m.getDate() - ((m.getDay() + 6) % 7)); m.setHours(12, 0, 0, 0)
    return `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}-${String(m.getDate()).padStart(2, '0')}`
  },

  // Extra (coach, 9 okt 2026): tijdPerDag {monday:'07:30'} overschrijft `tijd`
  // per dag; intensiteit ('rustig'|'gemiddeld'|'pittig'|'vol_gas'), afstandKm
  // en notitie komen als sublabel op het blok (zichtbaar bij de klant) en bij
  // 'standaard' ook in client_cardio_plan.
  async planBlokken({ clientId, soort, duur, tijd, dagen, bereik, weekSleutel, notitie, tijdPerDag = null, intensiteit = null, afstandKm = null }, db) {
    if (!db?.supabase || !clientId || !soort || !Array.isArray(dagen) || dagen.length === 0) throw new Error('onvolledig')
    const label = `Cardio · ${soort}`
    const tijdStr = (min) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}:00`
    const minutenVan = (t) => { const [h, m] = String(t || '18:00').split(':').map(Number); return (h || 0) * 60 + (m || 0) }
    const INTENS = { rustig: 'Rustig', gemiddeld: 'Gemiddeld', pittig: 'Pittig', vol_gas: 'Vol gas' }
    const sublabel = [INTENS[intensiteit] || null, afstandKm ? `${String(afstandKm).replace('.', ',')} km` : null, notitie || null].filter(Boolean).join(' · ').slice(0, 120) || null
    const week = weekSleutel || this.maandagIso()
    const rijen = dagen.map(d => {
      const dag = String(d).toLowerCase()
      const startMin = minutenVan(tijdPerDag?.[dag] || tijdPerDag?.[d] || tijd)
      const eindMin = Math.min(24 * 60, startMin + (Number(duur) || 30))
      return {
        client_id: clientId, day: dag, type: 'custom', label, sublabel,
        start_time: tijdStr(startMin), end_time: tijdStr(eindMin), color: '#06b6d4',
        week_start: bereik === 'eenmalig' ? week : null, updated_at: new Date().toISOString(),
      }
    })
    const { error } = await db.supabase.from('client_agenda_blocks').insert(rijen)
    if (error) throw error
    if (bereik === 'standaard') {
      const plan = await this.getPlan(clientId, db)
      const bestaand = plan.find(p => normaliseerSoort(p.cardio_type) === normaliseerSoort(soort))
      const { data: vaste } = await db.supabase.from('client_agenda_blocks').select('id')
        .eq('client_id', clientId).eq('type', 'custom').eq('label', label).is('week_start', null)
        .then(r => r, () => ({ data: null }))
      await this.savePlanItem({
        id: bestaand?.id || null, client_id: clientId, cardio_type: soort,
        times_per_week: (vaste || []).length || dagen.length, duration_minutes: duur,
        intensity: intensiteit || bestaand?.intensity || null, distance_km: afstandKm || bestaand?.distance_km || null,
        notes: notitie ?? bestaand?.notes ?? null, sort_order: bestaand?.sort_order || 0,
      }, db)
    }
    try { window.dispatchEvent(new CustomEvent('myarc:cardio-changed')) } catch { /* geen window */ }
    return rijen.length
  },

  // Alle cardioblokken van een klant: vaste (elke week) en eenmalige vanaf
  // de opgegeven maandag.
  async getBlokken(clientId, db, vanafMaandagIso = null) {
    if (!db?.supabase || !clientId) return []
    let q = db.supabase.from('client_agenda_blocks').select('id, day, label, sublabel, start_time, end_time, week_start, skip_weeks')
      .eq('client_id', clientId).eq('type', 'custom').ilike('label', 'Cardio ·%')
    if (vanafMaandagIso) q = q.or(`week_start.is.null,week_start.gte.${vanafMaandagIso}`)
    const { data, error } = await q
    if (error) { console.error('❌ getBlokken cardio:', error); return [] }
    return (data || []).map(b => ({
      ...b, soort: String(b.label).replace(/^Cardio\s*·\s*/, ''), tijd: String(b.start_time || '').slice(0, 5),
      duur: (() => { const [h, m] = String(b.start_time || '').split(':').map(Number); const [eh, em] = String(b.end_time || '').split(':').map(Number); return Number.isFinite(h) && Number.isFinite(eh) ? Math.max(0, (eh * 60 + em) - (h * 60 + m)) : null })(),
    }))
  },

  // Alle vaste blokken van één sport weg (bij bewerken: oud eruit, nieuw erin).
  async verwijderVasteBlokken(clientId, soort, db) {
    if (!db?.supabase || !clientId || !soort) return false
    const { error } = await db.supabase.from('client_agenda_blocks').delete()
      .eq('client_id', clientId).eq('type', 'custom').eq('label', `Cardio · ${soort}`).is('week_start', null)
    if (error) { console.error('❌ verwijderVasteBlokken cardio:', error); return false }
    return true
  },

  // Blok weg; bij een vast blok telt het cardioplan opnieuw.
  async verwijderBlok(clientId, blok, db) {
    if (!db?.supabase || !blok?.id) return false
    const { error } = await db.supabase.from('client_agenda_blocks').delete().eq('id', blok.id)
    if (error) { console.error('❌ verwijderBlok cardio:', error); return false }
    if (!blok.week_start) {
      const label = blok.label || `Cardio · ${blok.soort}`
      const { data: vaste } = await db.supabase.from('client_agenda_blocks').select('id')
        .eq('client_id', clientId).eq('type', 'custom').eq('label', label).is('week_start', null)
        .then(r => r, () => ({ data: [] }))
      const plan = await this.getPlan(clientId, db)
      const item = plan.find(p => normaliseerSoort(p.cardio_type) === normaliseerSoort(blok.soort))
      if (item) {
        if ((vaste || []).length === 0) await this.deactivatePlanItem(item.id, db)
        else await this.savePlanItem({ ...item, times_per_week: vaste.length }, db)
      }
    }
    try { window.dispatchEvent(new CustomEvent('myarc:cardio-changed')) } catch { /* geen window */ }
    return true
  },
}

export default CardioService
