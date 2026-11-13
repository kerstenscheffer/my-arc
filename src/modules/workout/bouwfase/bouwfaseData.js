// src/modules/workout/bouwfase/bouwfaseData.js
//
// Bouwfase-tracking (9 nov 2026, Kersten). Een bouwfase van 6-7 weken waarin je
// week op week sterker probeert te worden, daarna een deload van 3 dagen. De
// coach zet hem per klant aan (training_fases). Zolang hij aan staat vraagt de
// app na elke oefening hoe zwaar het voelde, bij de eerste oefening van een
// spiergroep of je die nog voelt van vorige workout, en na de workout een
// cijfer met toelichting (training_feedback). Zie bouwfase.sql.

import { spierVan, spierLabel } from '../../manual-workout-builder/spierGroepen'

export const GEVOEL = [
  { id: 'goed', label: 'Goed' },
  { id: 'techniek', label: 'Techniek brak' },
  { id: 'pijn', label: 'Pijntje' },
]
export const HERSTEL = [
  // id = voelt hij nog? (nee = hersteld); blijft zo staan voor de indicator.
  { id: 'nee', label: 'Goed', kleur: '#10b981' },
  { id: 'beetje', label: 'Matig', kleur: '#f59e0b' },
  { id: 'ja', label: 'Niet', kleur: '#ef4444' },
]

export const vandaagIso = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Spiergroep van een oefening als sleutel ('chest') en als woord in een zin
// ("Voel je je borst nog…"). Onbekend: null, dan vragen we niets.
export function spiergroepVan(ex) {
  const k = spierVan(ex || {})
  return k === 'onbekend' ? null : k
}
export const spierWoord = (k) => String(spierLabel(k) || '').toLowerCase()

export async function leesActieveFase(sb, clientId) {
  if (!sb || !clientId) return null
  const { data } = await sb.from('training_fases')
    .select('id, client_id, start_datum, bouw_weken, deload_dagen, actief, notitie, reflectie, created_at, schema_id, nummer, deload_schema_id, deload_gestart_op, afgerond_op, deload_reden, macros_voor_deload')
    .eq('client_id', clientId).eq('actief', true)
    .order('start_datum', { ascending: false }).limit(1)
    .then(r => r, () => ({ data: null }))
  return data?.[0] || null
}

// Waar staat de klant: { soort: 'bouw' | 'deload' | 'klaar' | 'nog_niet', week, weken, dag, dagen }.
export function faseStand(fase, datum = vandaagIso()) {
  if (!fase?.start_datum) return null
  const start = new Date(`${String(fase.start_datum).slice(0, 10)}T12:00:00`)
  const nu = new Date(`${datum}T12:00:00`)
  const dagNr = Math.round((nu - start) / 86400000) // 0 = startdag
  const weken = Number(fase.bouw_weken) || 7
  const deload = Number(fase.deload_dagen) || 0
  if (dagNr < 0) return { soort: 'nog_niet', week: 0, weken, dag: 0, dagen: deload }
  // Mesocyclus nieuwe stijl (nummer gevuld, zie mesocyclus.sql): de deload loopt
  // pas als hij gestart is (nachtrun of knop van de coach), niet op de datum.
  if (fase.nummer != null) {
    if (fase.afgerond_op) return { soort: 'klaar', week: weken, weken, dag: 0, dagen: deload, meso: fase.nummer }
    if (fase.deload_gestart_op) {
      const d0 = new Date(`${String(fase.deload_gestart_op).slice(0, 10)}T12:00:00`)
      const dag = Math.min(Math.max(1, deload), Math.max(1, Math.round((nu - d0) / 86400000) + 1))
      return { soort: 'deload', week: weken, weken, dag, dagen: deload, meso: fase.nummer }
    }
    return { soort: 'bouw', week: Math.min(weken, Math.floor(dagNr / 7) + 1), weken, dag: dagNr, dagen: deload, meso: fase.nummer }
  }
  if (dagNr < weken * 7) return { soort: 'bouw', week: Math.floor(dagNr / 7) + 1, weken, dag: dagNr, dagen: deload }
  if (dagNr < weken * 7 + deload) return { soort: 'deload', week: weken, weken, dag: dagNr - weken * 7 + 1, dagen: deload }
  return { soort: 'klaar', week: weken, weken, dag: 0, dagen: deload }
}

export function faseTekst(stand) {
  if (!stand) return ''
  if (stand.soort === 'bouw') return `Bouwfase · week ${stand.week} van ${stand.weken}`
  if (stand.soort === 'deload') return `Deload · dag ${stand.dag} van ${stand.dagen}`
  if (stand.soort === 'nog_niet') return 'Bouwfase start binnenkort'
  return 'Bouwfase klaar · tijd voor reflectie en een nieuw schema'
}

// Feedback van één dag: { oefening: {naam: rij}, herstel: {spier: rij}, workout: rij|null }
export async function leesFeedbackVanDag(sb, clientId, datum = vandaagIso()) {
  const leeg = { oefening: {}, herstel: {}, workout: null }
  if (!sb || !clientId) return leeg
  const { data } = await sb.from('training_feedback')
    .select('id, soort, oefening, spiergroep, score, gevoel, opmerking, datum')
    .eq('client_id', clientId).eq('datum', datum)
    .then(r => r, () => ({ data: [] }))
  for (const r of data || []) {
    if (r.soort === 'oefening' && r.oefening) leeg.oefening[r.oefening.toLowerCase()] = r
    else if (r.soort === 'herstel' && r.spiergroep) leeg.herstel[r.spiergroep] = r
    else if (r.soort === 'workout') leeg.workout = r
  }
  return leeg
}

// Eén rij per (klant, dag, soort, oefening/spiergroep): opnieuw invullen werkt
// hem bij. `sleutel` is een generated kolom en gaat dus nooit mee.
export async function bewaarFeedback(sb, rij) {
  const { data, error } = await sb.from('training_feedback')
    .upsert({ datum: vandaagIso(), ...rij, updated_at: new Date().toISOString() }, { onConflict: 'client_id,datum,sleutel' })
    .select('id, soort, oefening, spiergroep, score, gevoel, opmerking, datum').single()
  if (error) throw error
  window.dispatchEvent(new CustomEvent('myarc:training-feedback'))
  return data
}

export const magReflecteren = (stand) => stand?.soort === 'deload' || stand?.soort === 'klaar'

// Beste set van een oefening op één dag (geschatte 1RM, zodat 60×12 en 70×8 vergelijkbaar zijn).
const kracht = (s) => (Number(s?.weight) || 0) * (1 + (Number(s?.reps) || 0) / 30)
const besteSet = (sets) => (Array.isArray(sets) ? sets : []).reduce((b, s) => (kracht(s) > kracht(b) ? s : b), null)

// Per oefening de eerste en de laatste training binnen de fase. Oefeningen die
// maar één keer gelogd zijn laten we weg: daar valt niets te vergelijken.
export async function faseProgressie(sb, fase) {
  if (!sb || !fase?.client_id || !fase?.start_datum) return []
  const eind = new Date(`${String(fase.start_datum).slice(0, 10)}T12:00:00`)
  eind.setDate(eind.getDate() + (Number(fase.bouw_weken) || 7) * 7 + (Number(fase.deload_dagen) || 0))
  const { data: sessies } = await sb.from('workout_sessions').select('id, workout_date')
    .eq('client_id', fase.client_id).gte('workout_date', String(fase.start_datum).slice(0, 10))
    .lte('workout_date', eind.toISOString().slice(0, 10)).then(r => r, () => ({ data: [] }))
  if (!sessies?.length) return []
  const datumVan = Object.fromEntries(sessies.map(s => [s.id, String(s.workout_date).slice(0, 10)]))
  const { data: logs } = await sb.from('workout_progress').select('session_id, exercise_name, sets')
    .in('session_id', sessies.map(s => s.id)).then(r => r, () => ({ data: [] }))
  const perOef = {}
  for (const l of logs || []) {
    const set = besteSet(l.sets)
    if (!set || !kracht(set)) continue
    const k = String(l.exercise_name || '').toLowerCase()
    ;(perOef[k] = perOef[k] || { naam: l.exercise_name, rijen: [] }).rijen.push({ datum: datumVan[l.session_id], set })
  }
  return Object.values(perOef).filter(o => o.rijen.length > 1).map(o => {
    const r = [...o.rijen].sort((a, b) => a.datum.localeCompare(b.datum))
    const eerste = r[0].set, laatste = r[r.length - 1].set
    const verschil = Math.round(((kracht(laatste) - kracht(eerste)) / kracht(eerste)) * 100)
    return { naam: o.naam, eerste, laatste, verschil }
  }).sort((a, b) => b.verschil - a.verschil)
}

export async function bewaarReflectie(sb, faseId, reflectie) {
  const { error } = await sb.rpc('bewaar_fase_reflectie', { p_fase_id: faseId, p_reflectie: reflectie })
  if (error) throw error
}
