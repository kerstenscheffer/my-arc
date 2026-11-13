// src/modules/workout/bouwfase/mesocyclus.js
//
// Mesocyclus, deload en gemeten TDEE (13 nov 2026). Bouwt verder op de
// bouwfase (training_fases); het zware werk zit in de database
// (mesocyclus.sql), zodat de nachtrun en de knoppen hetzelfde doen.
//
// Een fase met `nummer` is een mesocyclus nieuwe stijl: de deload wisselt het
// plan en (in een cut) de macro's. Een fase zonder nummer is een oude bouwfase.

const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const dag = (s) => new Date(`${String(s).slice(0, 10)}T12:00:00`)
const dagenTussen = (a, b) => Math.round((dag(b) - dag(a)) / 86400000)
const plusDagen = (s, n) => { const d = dag(s); d.setDate(d.getDate() + n); return iso(d) }

export const KCAL_PER_KG = 7700
// Een logdag telt pas als hij minstens dit deel van het kcal-doel haalt:
// een halve dag loggen zou de TDEE omlaag trekken.
export const VOLLEDIG_VANAF = 0.6
export const MIN_WEGINGEN = 8
export const MIN_LOGDAGEN = 10

// Helling van een rechte lijn door (x, y): kg per dag.
function helling(punten) {
  const n = punten.length
  const gx = punten.reduce((t, p) => t + p.x, 0) / n
  const gy = punten.reduce((t, p) => t + p.y, 0) / n
  let boven = 0, onder = 0
  for (const p of punten) { boven += (p.x - gx) * (p.y - gy); onder += (p.x - gx) ** 2 }
  return onder ? boven / onder : 0
}

// Dagen waarop de klant in een deload zat: die tellen niet mee voor de TDEE
// (minder training, vaak andere kcal).
function deloadDagen(fases) {
  const uit = new Set()
  for (const f of fases || []) {
    const start = f.deload_gestart_op || (f.nummer == null && f.start_datum ? plusDagen(f.start_datum, (Number(f.bouw_weken) || 0) * 7) : null)
    if (!start) continue
    for (let i = 0; i < (Number(f.deload_dagen) || 0); i++) uit.add(plusDagen(start, i))
  }
  return uit
}

// Gemeten TDEE = gemiddelde inname − (gewichtstrend in kg per dag × 7.700).
// Geeft altijd een object terug; zonder genoeg data is tdee_gemeten null.
export async function berekenGemetenTdee(db, clientId, { dagen = 21 } = {}) {
  const tot = iso(new Date())
  const van = plusDagen(tot, -(dagen - 1))
  const sb = db.supabase
  const [klant, gewichten, kcal, fases] = await Promise.all([
    sb.from('clients').select('tdee, target_calories').eq('id', clientId).maybeSingle().then(r => r, () => ({ data: null })),
    sb.from('weight_challenge_logs').select('date, weight').eq('client_id', clientId).gte('date', van).lte('date', tot).order('date').then(r => r, () => ({ data: [] })),
    sb.rpc('kcal_per_dag', { p_client: clientId, p_van: van, p_tot: tot }).then(r => r, () => ({ data: [] })),
    sb.from('training_fases').select('nummer, start_datum, bouw_weken, deload_dagen, deload_gestart_op').eq('client_id', clientId).then(r => r, () => ({ data: [] })),
  ])
  const formule = Number(klant.data?.tdee) || null
  const doel = Number(klant.data?.target_calories) || 0
  const deload = deloadDagen(fases.data)

  const wegingen = (gewichten.data || [])
    .filter(w => Number(w.weight) > 0 && !deload.has(String(w.date).slice(0, 10)))
    .map(w => ({ x: dagenTussen(van, w.date), y: Number(w.weight) }))
  // Zonder kcal-doel is "volledig" niet te bepalen: dan telt elke dag met minstens 1.000 kcal.
  const drempel = doel ? doel * VOLLEDIG_VANAF : 1000
  const vol = (kcal.data || []).filter(d => Number(d.kcal) >= drempel && !deload.has(String(d.dag).slice(0, 10)))

  const basis = { tdee_gemeten: null, tdee_formule: formule, verschil: null, weegdagen: wegingen.length, logdagen: vol.length, van, tot }
  if (wegingen.length < MIN_WEGINGEN || vol.length < MIN_LOGDAGEN) return { ...basis, betrouwbaarheid: 'te weinig data' }

  const kgPerDag = helling(wegingen)
  const inname = vol.reduce((t, d) => t + Number(d.kcal), 0) / vol.length
  const gemeten = Math.round((inname - kgPerDag * KCAL_PER_KG) / 10) * 10
  return {
    ...basis,
    tdee_gemeten: gemeten,
    verschil: formule ? gemeten - formule : null,
    betrouwbaarheid: vol.length >= 14 && wegingen.length >= 12 ? 'hoog' : 'middel',
    inname: Math.round(inname),
    kg_per_week: Math.round(kgPerDag * 7 * 100) / 100,
  }
}

// Waar staat de mesocyclus? Pure functie.
export function getMesoStatus(fase, vandaag = iso(new Date())) {
  if (!fase?.start_datum) return null
  const totaalWeken = Number(fase.bouw_weken) || 4
  const deloadStart = fase.deload_gestart_op || plusDagen(fase.start_datum, totaalWeken * 7)
  const eindDatum = plusDagen(deloadStart, Number(fase.deload_dagen) || 0)
  const dagNr = dagenTussen(fase.start_datum, vandaag)
  // Nieuwe stijl: deload loopt pas als hij gestart is. Oude stijl: op datum.
  const isDeload = fase.nummer != null
    ? !!fase.deload_gestart_op && !fase.afgerond_op
    : vandaag >= deloadStart && vandaag < eindDatum
  return {
    week: Math.min(totaalWeken, Math.max(1, Math.floor(dagNr / 7) + 1)),
    totaalWeken, isDeload, deloadStart, eindDatum,
    dagenTotDeload: isDeload ? 0 : Math.max(0, dagenTussen(vandaag, deloadStart)),
    deloadDag: isDeload ? Math.min(Number(fase.deload_dagen) || 1, dagenTussen(deloadStart, vandaag) + 1) : null,
    deloadTeLaat: fase.nummer != null && !fase.deload_gestart_op && vandaag >= deloadStart,
  }
}

const rpc = async (db, naam, args) => {
  const { data, error } = await db.supabase.rpc(naam, args)
  if (error) return { error: error.message }
  if (typeof data === 'string' && data !== 'ok') return { error: data }
  return { data, error: null }
}

export const startMesocyclus = (db, clientId, { schemaId, startDatum, bouwWeken = 4, deloadDagen = 7 }) =>
  rpc(db, 'start_mesocyclus', { p_client: clientId, p_schema: schemaId, p_start: startDatum, p_bouw: bouwWeken, p_deload: deloadDagen })

// Maakt of ververst het deload-schema (halve sets en reps) uit het plan dat nu loopt.
export const maakDeloadSchema = (db, faseId) => rpc(db, 'maak_deload_schema', { p_fase: faseId })

// Deload starten. In een cut gaan de kcal naar onderhoud: de gemeten TDEE als
// die betrouwbaar is, anders clients.tdee. `reden`: 'gepland' | 'eerder: prestatie' | 'eerder: herstel'.
export async function startDeload(db, fase, { reden = 'gepland' } = {}) {
  let kcal = null
  const { data: cut } = await db.supabase.from('client_phases').select('doel')
    .eq('client_id', fase.client_id).is('ended_on', null).order('started_on', { ascending: false }).limit(1)
    .then(r => r, () => ({ data: [] }))
  if (String(cut?.[0]?.doel || '').toLowerCase() === 'cut') {
    const t = await berekenGemetenTdee(db, fase.client_id).catch(() => null)
    kcal = t?.betrouwbaarheid === 'hoog' ? t.tdee_gemeten : (t?.tdee_formule || null)
  }
  const res = await rpc(db, 'start_deload', { p_fase: fase.id, p_kcal: kcal ? Math.round(kcal) : null, p_reden: reden })
  return { ...res, kcal }
}

export const eindDeload = (db, faseId) => rpc(db, 'eind_deload', { p_fase: faseId })

// Gemeten TDEE overnemen als de TDEE van de klant (zelfde velden als het fasepaneel).
export async function neemTdeeOver(db, clientId, tdee) {
  const { data: c } = await db.supabase.from('clients').select('maintenance_settings').eq('id', clientId).maybeSingle()
    .then(r => r, () => ({ data: null }))
  const { error } = await db.supabase.from('clients').update({
    tdee: Math.round(tdee),
    maintenance_settings: { ...(c?.maintenance_settings || {}), include_manual: true, manual_tdee: Math.round(tdee) },
  }).eq('id', clientId)
  return { error: error?.message || null }
}

const kracht = (s) => (Number(s?.weight) || 0) * (1 + (Number(s?.reps) || 0) / 30)
const beste = (sets) => (Array.isArray(sets) ? sets : []).reduce((m, s) => Math.max(m, kracht(s)), 0)

// Alleen een suggestie voor de coach: redenen om de deload (eerder) te starten.
// [{ soort: 'gepland' | 'prestatie' | 'herstel', tekst, reden }]
export async function checkDeloadSignalen(db, clientId, fase = null) {
  const sb = db.supabase
  const uit = []
  const status = fase ? getMesoStatus(fase) : null
  if (status && !status.isDeload && (status.deloadTeLaat || (fase.nummer != null && status.dagenTotDeload === 0))) {
    uit.push({ soort: 'gepland', reden: 'gepland', tekst: `Deload week bereikt (na ${status.totaalWeken} bouwweken)` })
  }
  const sinds = plusDagen(iso(new Date()), -28)
  const [sessies, herstel] = await Promise.all([
    sb.from('workout_sessions').select('id, workout_date').eq('client_id', clientId).gte('workout_date', sinds).order('workout_date').then(r => r, () => ({ data: [] })),
    sb.from('training_feedback').select('gevoel, score, spiergroep, datum').eq('client_id', clientId).eq('soort', 'herstel').gte('datum', plusDagen(iso(new Date()), -7)).then(r => r, () => ({ data: [] })),
  ])
  if (sessies.data?.length) {
    const datum = new Map(sessies.data.map(s => [s.id, s.workout_date]))
    const { data: rijen } = await sb.from('workout_progress').select('session_id, exercise_name, sets').in('session_id', sessies.data.map(s => s.id))
      .then(r => r, () => ({ data: [] }))
    const per = new Map()
    for (const r of rijen || []) {
      const k = beste(r.sets); const d = datum.get(r.session_id)
      if (!k || !d || (r.sets || []).some(s => s?.snelheid)) continue // power-sets zijn expres licht
      const lijst = per.get(r.exercise_name) || []
      const zelfdeDag = lijst.find(x => x.d === d)
      if (zelfdeDag) zelfdeDag.k = Math.max(zelfdeDag.k, k); else lijst.push({ d, k })
      per.set(r.exercise_name, lijst)
    }
    // Twee keer op rij minder dan de keer ervoor.
    const gezakt = [...per.entries()].filter(([, l]) => {
      const s = l.sort((a, b) => (a.d < b.d ? -1 : 1)).slice(-3)
      return s.length === 3 && s[1].k < s[0].k && s[2].k < s[1].k
    }).map(([naam]) => naam)
    if (gezakt.length) uit.push({ soort: 'prestatie', reden: 'eerder: prestatie', tekst: `Twee sessies op rij minder op ${gezakt.slice(0, 3).join(', ')}${gezakt.length > 3 ? ` en ${gezakt.length - 3} andere` : ''}` })
  }
  const slecht = (herstel.data || []).filter(h => h.gevoel === 'ja' || (h.score != null && Number(h.score) <= 4))
  if (slecht.length >= 3) uit.push({ soort: 'herstel', reden: 'eerder: herstel', tekst: `${slecht.length} keer niet hersteld in de laatste 7 dagen` })
  return uit
}
