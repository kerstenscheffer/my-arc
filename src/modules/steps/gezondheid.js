// src/modules/steps/gezondheid.js
//
// Slaap, rusthartslag en HRV uit Apple Health (iOS) of Health Connect
// (Android), naast de stappen (10 nov 2026). Zo komt een Garmin, Apple Watch,
// Oura of Samsung-horloge binnen zonder eigen koppeling per merk: de klant laat
// zijn horloge-app naar Apple Health / Health Connect schrijven en wij lezen
// daar.
//
// Alleen met de nieuwe plugin (@capgo/capacitor-health); een oude app-schil
// heeft alleen stappen en slaat dit stil over.
//
// Opslag:
//   · client_gezondheid_dagen: alles per dag (slaapfases, rust-HR, HRV).
//   · sleep_logs (bron 'telefoon'): uren, bedtijd en opstaan, zodat alles wat
//     daar al op leest (Coach Inzicht, dag-agenda, slaapknop) het meteen toont.
//     Een nacht die de klant zelf logde blijft van de klant.

import { Health } from '@capgo/capacitor-health'
import { welkePlugin, isGekoppeld, platform } from './telefoonStappen'

const p2 = (n) => String(n).padStart(2, '0')
const lokaalIso = (d) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`
const hhmm = (d) => `${p2(d.getHours())}:${p2(d.getMinutes())}`

const SLAAP = new Set(['asleep', 'light', 'deep', 'rem'])

// Bij welke dag hoort een slaapstuk? De dag waarop je wakker wordt. Een stuk
// dat om 23:30 eindigt hoort al bij de nacht naar morgen, daarom 6 uur erbij.
const nachtVan = (eind) => lokaalIso(new Date(eind.getTime() + 6 * 3600000))

// Slaapstukken per bron per nacht. iOS geeft elk stuk als eigen sample (met
// één stage), Android geeft een sessie met (soms) stages erin.
function slaapPerNacht(samples) {
  const perNacht = new Map() // iso -> Map(bron -> telling)
  for (const s of samples || []) {
    const bron = s?.sourceId || s?.sourceName || 'onbekend'
    const stukken = Array.isArray(s?.stages) && s.stages.length
      ? s.stages
      : [{ stage: s?.sleepState || 'asleep', startDate: s?.startDate, endDate: s?.endDate, durationMinutes: s?.value }]
    for (const st of stukken) {
      const start = new Date(st?.startDate)
      const eind = new Date(st?.endDate)
      if (isNaN(start) || isNaN(eind)) continue
      const min = Number(st?.durationMinutes) || Math.max(0, (eind - start) / 60000)
      const iso = nachtVan(eind)
      if (!perNacht.has(iso)) perNacht.set(iso, new Map())
      const perBron = perNacht.get(iso)
      if (!perBron.has(bron)) perBron.set(bron, { slaap: 0, diep: 0, rem: 0, licht: 0, wakker: 0, van: null, tot: null })
      const t = perBron.get(bron)
      const fase = st?.stage
      if (fase === 'awake') t.wakker += min
      if (!SLAAP.has(fase)) continue
      t.slaap += min
      if (fase === 'deep') t.diep += min
      if (fase === 'rem') t.rem += min
      if (fase === 'light') t.licht += min
      if (!t.van || start < t.van) t.van = start
      if (!t.tot || eind > t.tot) t.tot = eind
    }
  }
  // Per nacht één bron: die met de meeste slaap. Nooit optellen: Garmin én
  // Apple Watch schrijven allebei dezelfde nacht.
  const uit = new Map()
  perNacht.forEach((perBron, iso) => {
    let beste = null
    let besteBron = null
    const bronnen = {}
    perBron.forEach((t, bron) => {
      bronnen[bron] = Math.round(t.slaap)
      if (t.slaap > 0 && (!beste || t.slaap > beste.slaap)) { beste = t; besteBron = bron }
    })
    if (beste) uit.set(iso, { ...beste, bron: besteBron, bronnen })
  })
  return uit
}

// Gemiddelde per kalenderdag van een meetwaarde (rust-HR, HRV).
function gemiddeldPerDag(samples) {
  const som = new Map()
  for (const s of samples || []) {
    const d = new Date(s?.startDate)
    const v = Number(s?.value)
    if (isNaN(d) || !Number.isFinite(v) || v <= 0) continue
    const iso = lokaalIso(d)
    const t = som.get(iso) || { som: 0, n: 0 }
    t.som += v; t.n += 1
    som.set(iso, t)
  }
  const uit = new Map()
  som.forEach((t, iso) => uit.set(iso, Math.round((t.som / t.n) * 10) / 10))
  return uit
}

const lees = (dataType, startDate, endDate, limit) =>
  Health.readSamples({ dataType, startDate, endDate, limit })
    .then(r => r?.samples || [], e => { console.warn(`${dataType} lezen mislukt:`, e?.message || e); return [] })

// De laatste n dagen, per dag { iso, slaap…, rust_hartslag, hrv }. Null als dit
// toestel het niet kan (web, oude app, niet gekoppeld).
export async function gezondheidPerDag(dagenTerug = 7) {
  if (welkePlugin() !== 'nieuw' || !isGekoppeld()) return null
  // Een dag eerder beginnen: de nacht naar de eerste dag begint de avond ervoor.
  const start = new Date()
  start.setDate(start.getDate() - dagenTerug)
  start.setHours(12, 0, 0, 0)
  const eind = new Date()
  const [slaap, rust, hrv] = await Promise.all([
    lees('sleep', start.toISOString(), eind.toISOString(), 5000),
    lees('restingHeartRate', start.toISOString(), eind.toISOString(), 1000),
    lees('heartRateVariability', start.toISOString(), eind.toISOString(), 2000),
  ])
  const nachten = slaapPerNacht(slaap)
  const rustPerDag = gemiddeldPerDag(rust)
  const hrvPerDag = gemiddeldPerDag(hrv)

  const eerste = new Date(); eerste.setDate(eerste.getDate() - (dagenTerug - 1))
  const eersteIso = lokaalIso(eerste)
  const dagen = new Set([...nachten.keys(), ...rustPerDag.keys(), ...hrvPerDag.keys()])
  return [...dagen]
    .filter(iso => iso >= eersteIso && iso <= lokaalIso(new Date()))
    .sort()
    .map(iso => {
      const n = nachten.get(iso)
      return {
        iso,
        slaap_minuten: n ? Math.round(n.slaap) : null,
        slaap_diep: n ? Math.round(n.diep) : null,
        slaap_rem: n ? Math.round(n.rem) : null,
        slaap_licht: n ? Math.round(n.licht) : null,
        slaap_wakker: n ? Math.round(n.wakker) : null,
        bedtijd: n?.van || null,
        opstaan: n?.tot || null,
        bron: n?.bron || null,
        bronnen: n?.bronnen || null,
        rust_hartslag: rustPerDag.get(iso) ?? null,
        hrv: hrvPerDag.get(iso) ?? null,
      }
    })
}

// Niet vaker dan dit opnieuw lezen, hoe vaak je ook wisselt.
const RUST_MS = 30 * 60 * 1000
let laatste = 0

// Lezen en wegschrijven. Draait naast syncStappen; faalt stil.
export async function syncGezondheid(db, clientId, { bijOpstart = false } = {}) {
  if (!db?.supabase || !clientId) return null
  if (welkePlugin() !== 'nieuw') return null
  const nu = Date.now()
  if (!bijOpstart && nu - laatste < RUST_MS) return null
  laatste = nu
  try {
    const dagen = await gezondheidPerDag(7)
    if (!dagen?.length) return null

    const rijen = dagen.map(d => ({
      client_id: clientId,
      datum: d.iso,
      slaap_minuten: d.slaap_minuten,
      slaap_diep: d.slaap_diep,
      slaap_rem: d.slaap_rem,
      slaap_licht: d.slaap_licht,
      slaap_wakker: d.slaap_wakker,
      bedtijd: d.bedtijd ? d.bedtijd.toISOString() : null,
      opstaan: d.opstaan ? d.opstaan.toISOString() : null,
      rust_hartslag: d.rust_hartslag,
      hrv: d.hrv,
      bron: d.bron,
      bronnen: d.bronnen,
      platform: platform(),
      updated_at: new Date().toISOString(),
    }))
    const { error } = await db.supabase.from('client_gezondheid_dagen').upsert(rijen, { onConflict: 'client_id,datum' })
    if (error) throw error

    await vulSlaapLogs(db, clientId, dagen.filter(d => d.slaap_minuten >= 60))
    return dagen
  } catch (e) {
    console.warn('Gezondheid synchroniseren mislukt:', e?.message || e)
    return null
  }
}

// Uren, bedtijd en opstaan in sleep_logs. Alleen nieuwe rijen, of rijen die we
// zelf schreven en die de klant nog niet bewaarde. Kwaliteit en struggles vult
// de klant.
async function vulSlaapLogs(db, clientId, nachten) {
  if (!nachten.length) return
  const { data: bestaand, error } = await db.supabase.from('sleep_logs')
    .select('id, log_date, bron, hours_slept, quality')
    .eq('client_id', clientId)
    .in('log_date', nachten.map(n => n.iso))
  if (error) { console.warn('Slaaplogs lezen mislukt:', error.message); return }
  const perDag = new Map((bestaand || []).map(r => [String(r.log_date).slice(0, 10), r]))

  for (const n of nachten) {
    const rij = perDag.get(n.iso)
    const velden = {
      hours_slept: Math.round((n.slaap_minuten / 60) * 10) / 10,
      bedtime: n.bedtijd ? hhmm(n.bedtijd) : null,
      wake_time: n.opstaan ? hhmm(n.opstaan) : null,
    }
    if (!rij) {
      await db.supabase.from('sleep_logs')
        .insert({ client_id: clientId, log_date: n.iso, bron: 'telefoon', ...velden })
        .then(r => r, () => null)
    } else if (rij.bron === 'telefoon' && rij.quality == null && Number(rij.hours_slept) !== velden.hours_slept) {
      // quality == null: de klant heeft de nacht nog niet zelf geopend en
      // bewaard. Daarna is hij van de klant, ook als die de uren aanpaste.
      await db.supabase.from('sleep_logs').update(velden).eq('id', rij.id).then(r => r, () => null)
    }
  }
}
