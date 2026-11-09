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
  { id: 'nee', label: 'Nee', kleur: '#10b981' },
  { id: 'beetje', label: 'Beetje', kleur: '#f59e0b' },
  { id: 'ja', label: 'Ja', kleur: '#ef4444' },
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
    .select('id, client_id, start_datum, bouw_weken, deload_dagen, actief, notitie, created_at')
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
