// src/modules/manual-workout-builder/volumeData.js
//
// Laden van alles wat het volume-advies per klant nodig heeft, los van React:
// de builder gebruikt het via de hooks useVolumeContext en useHerstel, de
// sweet spot finder (sweetspotRun.js) roept het rechtstreeks aan.

import { KRACHT_WEKEN_TERUG } from './volumeRegels'
import { ONDER, verfijn } from './spierGroepen'
import { leesActieveFase, faseStand } from '../workout/bouwfase/bouwfaseData'
import { rirDoel } from '../workout/bouwfase/rir'

const e1rm = (s) => (Number(s?.weight) || 0) * (1 + (Number(s?.reps) || 0) / 30)
const leeg = { data: null }

// { status, statusBekend, fase, faseBekend, leeftijd, secMap, logs, rir }
export async function laadVolumeContext(sb, clientId) {
  const { data: c } = await sb.from('clients').select('training_experience, experience, age, date_of_birth, auth_user_id')
    .eq('id', clientId).single().then(r => r, () => leeg)
  const ids = [c?.auth_user_id, clientId].filter(Boolean)
  const van = new Date(); van.setDate(van.getDate() - KRACHT_WEKEN_TERUG * 7)
  const [wp, fases, bib, sessies] = await Promise.all([
    sb.from('user_workout_preferences').select('default_experience_level').in('user_id', ids)
      .order('workout_completed_at', { ascending: false, nullsFirst: false }).limit(1).then(r => r, () => leeg),
    sb.from('client_phases').select('doel, started_on, ended_on').eq('client_id', clientId).is('ended_on', null)
      .order('started_on', { ascending: false }).limit(1).then(r => r, () => leeg),
    sb.from('exercises').select('name, secundair_spieren').not('secundair_spieren', 'is', null).limit(2000).then(r => r, () => leeg),
    sb.from('workout_sessions').select('id, workout_date').eq('client_id', clientId)
      .gte('workout_date', van.toISOString().slice(0, 10)).then(r => r, () => leeg),
  ])
  // RIR-progressie: staat hij aan, dan rekent volumeSuggesties met de regel van Israetel.
  const mesoFase = await leesActieveFase(sb, clientId).then(f => f, () => null)
  const doelRir = rirDoel(mesoFase, faseStand(mesoFase))
  let logs = []
  if (sessies.data?.length) {
    const datum = Object.fromEntries(sessies.data.map(s => [s.id, String(s.workout_date).slice(0, 10)]))
    const { data } = await sb.from('workout_progress').select('session_id, exercise_name, sets')
      .in('session_id', sessies.data.map(s => s.id)).then(r => r, () => leeg)
    logs = (data || []).map(l => ({ naam: l.exercise_name, datum: datum[l.session_id], kracht: Math.max(0, ...(Array.isArray(l.sets) ? l.sets : []).map(e1rm)) }))
      .filter(r => r.naam && r.datum)
  }
  const ervaring = String(c?.training_experience || wp.data?.[0]?.default_experience_level || c?.experience || '').toLowerCase()
  const status = /begin/.test(ervaring) ? 'beginner' : /adv|gevorder/.test(ervaring) ? 'advanced' : /inter|gemiddeld/.test(ervaring) ? 'intermediate' : null
  const doel = fases.data?.[0]?.doel
  const fase = doel === 'cut' ? 'cut' : doel === 'build' ? 'bulk' : 'onderhoud'
  let leeftijd = Number(c?.age) || null
  if (!leeftijd && c?.date_of_birth) leeftijd = Math.floor((Date.now() - new Date(c.date_of_birth).getTime()) / (365.25 * 864e5))
  const secMap = {}
  for (const b of bib.data || []) if (b.name && b.secundair_spieren?.length) secMap[b.name.trim().toLowerCase()] = b.secundair_spieren
  return { status: status || 'intermediate', statusBekend: !!status, fase, faseBekend: !!doel, leeftijd, secMap, logs, rir: doelRir != null ? { doel: doelRir } : null }
}

const DAGEN_TERUG = 7
// Voor "2 trainingen achter elkaar pijn" verder terugkijken: een oefening komt
// vaak maar 1x per week langs.
const PIJN_DAGEN_TERUG = 35
const isoVan = (dagen) => {
  const d = new Date(); d.setDate(d.getDate() - dagen)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// { [spier]: { stand, herstel: [rijen 7 d], oefeningen: [rijen 7 d], pijnReeks: [oefeningnamen] } }
// pijnReeks = oefeningen waarbij de laatste 2 keer dat ze gedaan zijn allebei 'pijn' gaven.
export async function laadHerstel(sb, clientId) {
  const iso = isoVan(DAGEN_TERUG)
  const { data } = await sb.from('training_feedback')
    .select('id, datum, soort, oefening, spiergroep, score, gevoel, opmerking, rir, spierpijn, pomp, werkdruk')
    .eq('client_id', clientId).gte('datum', isoVan(PIJN_DAGEN_TERUG)).in('soort', ['herstel', 'oefening', 'spier'])
    .order('datum', { ascending: false }).order('created_at', { ascending: false })
    .then(r => r, () => ({ data: [] }))
  const uit = {}
  const perOef = {} // spier → oefening → rijen (nieuwste eerst), hele periode
  // Oude app-versies vragen naar 'legs'/'shoulders': geldt voor alle fijne groepen
  // eronder; bij een oefening bepaalt de naam welke (verfijn).
  const rijen = []
  for (const r of data || []) {
    if (!r.spiergroep) continue
    if (!ONDER[r.spiergroep]) { rijen.push(r); continue }
    if (r.soort === 'oefening' && r.oefening) rijen.push({ ...r, spiergroep: verfijn(r.spiergroep, r.oefening) })
    else for (const fijn of ONDER[r.spiergroep]) rijen.push({ ...r, spiergroep: fijn })
  }
  for (const r of rijen) {
    const s = uit[r.spiergroep] || (uit[r.spiergroep] = { herstel: [], oefeningen: [], spier: [], pijnReeks: [] })
    if (r.soort === 'oefening' && r.oefening) {
      const k = r.oefening.trim().toLowerCase()
      ;((perOef[r.spiergroep] = perOef[r.spiergroep] || {})[k] = perOef[r.spiergroep][k] || []).push(r)
    }
    // De laatste twee herstelantwoorden over de hele periode: een spier die 1x per
    // week langskomt heeft binnen 7 dagen maar één antwoord.
    if (r.soort === 'herstel' && (s.herstelReeks = s.herstelReeks || []).length < 2) s.herstelReeks.push(r.gevoel)
    if (r.datum < iso) continue
    // 'spier' = pomp en zwaarte na de laatste oefening van die spiergroep (rir.js).
    if (r.soort === 'herstel') s.herstel.push(r); else if (r.soort === 'spier') s.spier.push(r); else s.oefeningen.push(r)
  }
  for (const [spier, oefs] of Object.entries(perOef)) {
    for (const rijen of Object.values(oefs)) {
      if (rijen.length >= 2 && rijen[0].gevoel === 'pijn' && rijen[1].gevoel === 'pijn') uit[spier].pijnReeks.push(rijen[0].oefening)
    }
  }
  for (const s of Object.values(uit)) {
    const laatste = s.herstel[0]?.gevoel
    // Pijn 2x achter elkaar = rood; één keer pijn = oranje (in de gaten houden).
    const pijnEens = s.oefeningen.some(r => r.gevoel === 'pijn')
    s.tweeKeerNiet = (s.herstelReeks || []).length === 2 && s.herstelReeks.every(g => g === 'ja')
    s.stand = s.pijnReeks.length || laatste === 'ja' ? 'rood' : pijnEens || laatste === 'beetje' ? 'oranje' : laatste === 'nee' ? 'groen' : null
  }
  return uit
}
