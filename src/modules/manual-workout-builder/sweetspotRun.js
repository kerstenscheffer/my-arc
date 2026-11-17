// src/modules/manual-workout-builder/sweetspotRun.js
//
// De wekelijkse ronde van de sweet spot finder (regels in sweetspot.js). Loopt
// alle klanten met een actieve trainingsfase langs en zet per klant vast wat er
// die week bij kwam of af ging (sweetspot_runs).
//
//  • modus 'proef' — alleen rekenen en tonen; geen plan verandert.
//  • modus 'aan'   — de wijzigingen gaan in het actieve plan van de klant.
//                    Eén keer per klant per week (unique client_id + week + modus).
//
// Draait in de browser van de coach, met zijn sessie: bij het openen van de
// CoachHub (sweetspotAutomaat) of met de knop in het plannenscherm. Elke
// planwijziging komt via de bestaande trigger in de planhistorie en is daar
// terug te zetten.

import { sweetspotStap } from './sweetspot'
import { laadVolumeContext, laadHerstel } from './volumeData'
import { cyclusVan, cyclusUitOpslag, STANDAARD_LENGTE } from './cyclus'
import { faseStand } from '../workout/bouwfase/bouwfaseData'

const veilig = (q) => q.then(r => r, (e) => ({ data: null, error: e }))
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
export const weekVan = (d = new Date()) => { const m = new Date(d); m.setDate(m.getDate() - ((m.getDay() + 6) % 7)); return iso(m) }
const kaal = (n) => String(n || '').trim().toLowerCase()
// Intake-keuzes zijn bandbreedtes (30 = "30 tot 45 min"): de bovenkant telt. Leeg = 90.
const BOVEN = { 30: 45, 45: 60, 60: 75, 75: 90, 90: 90 }

export async function leesInstelling(sb) {
  const { data } = await veilig(sb.from('sweetspot_instelling').select('modus').eq('id', 1).maybeSingle())
  return data?.modus || 'proef'
}
export async function zetInstelling(sb, modus) {
  const { error } = await sb.from('sweetspot_instelling').upsert({ id: 1, modus, updated_at: new Date().toISOString() })
  if (error) throw error
}
export async function leesRuns(sb, week = weekVan()) {
  const { data } = await veilig(sb.from('sweetspot_runs').select('id, client_id, schema_id, week, modus, wijzigingen, meldingen, stand, updated_at').eq('week', week))
  return data || []
}

// Eén klant doorrekenen. Geeft null als hij deze week niet meedoet (met de reden).
async function rekenKlant(sb, klant, fase) {
  if (!klant.assigned_schema_id) return { overslaan: 'geen actief plan' }
  if (faseStand(fase)?.soort !== 'bouw') return { overslaan: 'niet in de bouwweken (deload of fase klaar)' }
  const { data: schema } = await veilig(sb.from('workout_schemas').select('id, name, week_structure, cyclus, deload_van').eq('id', klant.assigned_schema_id).single())
  if (!schema?.week_structure) return { overslaan: 'plan niet gevonden' }
  if (schema.deload_van) return { overslaan: 'deload-schema actief' }

  const days = Object.entries(schema.week_structure)
    .sort((a, b) => parseInt(a[0].replace('dag', ''), 10) - parseInt(b[0].replace('dag', ''), 10))
    .map(([key, d]) => ({ id: key, name: d?.name || key, exercises: (d?.exercises || []).map((ex, i) => ({ ...ex, id: `${key}:${i}` })) }))
  // De week zoals de klant hem traint: zijn rooster bepaalt welke trainingen
  // meetellen en of er een twee keer in zit (zelfde regel als de builder).
  const eigen = new Map(days.map(d => [d.id, d.id]))
  const cyc = cyclusVan({ days, cyclus: cyclusUitOpslag(schema.cyclus, eigen) }, { rooster: klant.workout_schedule, actief: true, schemaId: schema.id, keyNaarId: eigen })
  const weekSlots = cyc.ingepland ? cyc.slots.slice(0, cyc.ingepland) : cyc.slots
  const los = cyc.los || []
  const weekDagen = cyc.bron === 'rooster'
    ? weekSlots.filter(id => id != null).map(id => days.find(d => d.id === id)).filter(Boolean)
    : days.filter(d => !los.includes(d.id))
  if (!weekDagen.length) return { overslaan: 'geen trainingen in de week' }

  const twee = new Date(); twee.setDate(twee.getDate() - 14)
  const ids = [klant.auth_user_id, klant.id].filter(Boolean)
  const [ctx, herstel, wp, fb, sessies, standRijen] = await Promise.all([
    laadVolumeContext(sb, klant.id),
    laadHerstel(sb, klant.id),
    veilig(sb.from('user_workout_preferences').select('default_time_per_session').in('user_id', ids).order('workout_completed_at', { ascending: false, nullsFirst: false }).limit(1)),
    veilig(sb.from('training_feedback').select('datum, score, duur').eq('client_id', klant.id).eq('soort', 'workout').gte('datum', iso(twee)).order('datum', { ascending: false })),
    veilig(sb.from('workout_sessions').select('workout_date, day_display_name').eq('client_id', klant.id).gte('workout_date', iso(twee))),
    veilig(sb.from('sweetspot_stand').select('spier, vast, laatste_plus').eq('client_id', klant.id).eq('schema_id', schema.id)),
  ])
  const keuze = Number(wp.data?.[0]?.default_time_per_session) || Number(klant.minutes_per_session) || 0
  const budget = BOVEN[keuze] || keuze || 90
  // "Te lang" hoort bij de training van die datum; onbekend welke = nergens iets erbij.
  const lang = new Set()
  for (const r of (fb.data || []).filter(x => x.duur === 'lang')) {
    const namen = (sessies.data || []).filter(s => String(s.workout_date).slice(0, 10) === String(r.datum).slice(0, 10)).map(s => kaal(s.day_display_name))
    const raak = days.filter(d => namen.includes(kaal(d.name)))
    for (const d of (raak.length ? raak : days)) lang.add(d.id)
  }
  const scores = (fb.data || []).map(r => Number(r.score)).filter(n => n > 0)
  // De klant zet de finder zelf aan: zijn laatste antwoord op de lengtevraag was "ik kan en wil meer".
  const wilMeer = (fb.data || []).find(r => r.duur)?.duur === 'kort'
  const stand = Object.fromEntries((standRijen.data || []).map(r => [r.spier, r]))
  const uit = sweetspotStap({ days: weekDagen, ctx, herstel, budget, factor: STANDAARD_LENGTE / (cyc.lengte || STANDAARD_LENGTE), stand, lang, scores, wilMeer })
  return { schema, uit, context: { status: ctx.status, statusBekend: ctx.statusBekend, fase: ctx.fase, budget, wilMeer } }
}

// modus: 'proef' | 'aan'. opVoortgang(i, n) voor de knop. Geeft de rijen van deze ronde.
export async function sweetspotRun(sb, { modus = 'proef', opVoortgang = null } = {}) {
  const week = weekVan()
  const { data: fases, error } = await veilig(sb.from('training_fases').select('id, client_id, start_datum, bouw_weken, deload_dagen, nummer, deload_gestart_op, afgerond_op').eq('actief', true))
  if (error) throw error
  const perKlant = new Map((fases || []).map(f => [f.client_id, f]))
  if (!perKlant.size) return []
  const { data: klanten } = await veilig(sb.from('clients').select('id, first_name, last_name, assigned_schema_id, workout_schedule, minutes_per_session, auth_user_id').in('id', [...perKlant.keys()]))
  const gedaan = new Set((await leesRuns(sb, week)).filter(r => r.modus === 'aan').map(r => r.client_id))
  const rijen = []
  let i = 0
  for (const klant of klanten || []) {
    opVoortgang?.(++i, klanten.length)
    // Echt: één keer per klant per week. Eerst de rij claimen, dan pas het plan
    // aanraken; een tweede tabblad loopt dan op de unieke sleutel vast.
    if (modus === 'aan') {
      if (gedaan.has(klant.id)) continue
      const { error: bezet } = await veilig(sb.from('sweetspot_runs').insert({ client_id: klant.id, week, modus: 'aan' }))
      if (bezet) continue
    }
    let r
    try { r = await rekenKlant(sb, klant, perKlant.get(klant.id)) } catch (e) { r = { overslaan: `fout: ${e?.message || e}` } }
    const rij = {
      client_id: klant.id, schema_id: r.schema?.id || klant.assigned_schema_id || null, week, modus,
      wijzigingen: r.uit?.wijzigingen || [],
      meldingen: r.overslaan ? [`Overgeslagen: ${r.overslaan}.`] : (r.uit?.meldingen || []),
      stand: r.uit ? { ...r.context, spieren: r.uit.stand } : null,
      updated_at: new Date().toISOString(),
    }
    if (modus === 'aan' && r.uit?.wijzigingen.length) {
      // Vers ophalen en alleen de sets van de geraakte oefeningen zetten: wat de
      // coach of klant intussen veranderde blijft staan.
      const { data: vers } = await veilig(sb.from('workout_schemas').select('week_structure').eq('id', r.schema.id).single())
      const ws = vers?.week_structure ? JSON.parse(JSON.stringify(vers.week_structure)) : null
      const gelukt = []
      for (const w of r.uit.wijzigingen) {
        const idx = Number(String(w.exId).split(':')[1])
        const ex = ws?.[w.dayId]?.exercises?.[idx]
        if (!ex || kaal(ex.name) !== kaal(w.naam) || (Number(ex.sets) || 2) !== w.van) continue
        ex.sets = w.naar
        gelukt.push(w)
      }
      if (gelukt.length) {
        const { error: fout } = await veilig(sb.from('workout_schemas').update({ week_structure: ws, updated_at: new Date().toISOString() }).eq('id', r.schema.id))
        if (fout) { rij.meldingen = [...rij.meldingen, `Opslaan mislukt: ${fout.message || fout}`]; rij.wijzigingen = [] }
        else {
          rij.wijzigingen = gelukt
          const raak = new Set(gelukt.map(w => w.spier))
          const standRijen = Object.entries(r.uit.nieuweStand).filter(([spier, s]) => raak.has(spier) || s.vast)
            .map(([spier, s]) => ({ client_id: klant.id, schema_id: r.schema.id, spier, vast: !!s.vast, vast_op: s.vast ? iso(new Date()) : null, laatste_plus: s.laatste_plus || null, updated_at: new Date().toISOString() }))
          if (standRijen.length) await veilig(sb.from('sweetspot_stand').upsert(standRijen))
        }
      } else rij.wijzigingen = []
    } else if (modus === 'aan' && r.uit) {
      // Geen planwijziging, maar een rem kan een spier wel vastzetten.
      const vast = Object.entries(r.uit.nieuweStand).filter(([, s]) => s.vast)
        .map(([spier]) => ({ client_id: klant.id, schema_id: r.schema.id, spier, vast: true, vast_op: iso(new Date()), laatste_plus: null, updated_at: new Date().toISOString() }))
      if (vast.length) await veilig(sb.from('sweetspot_stand').upsert(vast))
    }
    await veilig(sb.from('sweetspot_runs').upsert(rij, { onConflict: 'client_id,week,modus' }))
    rijen.push({ ...rij, naam: `${klant.first_name || ''} ${klant.last_name || ''}`.trim() })
  }
  return rijen
}

// Bij het openen van de CoachHub: staat de finder aan en is er deze week nog
// niet gedraaid, dan nu. Eén poging per browsersessie.
export async function sweetspotAutomaat(sb) {
  try {
    if (!sb || sessionStorage.getItem('sweetspot_week') === weekVan()) return
    sessionStorage.setItem('sweetspot_week', weekVan())
    if ((await leesInstelling(sb)) !== 'aan') return
    await sweetspotRun(sb, { modus: 'aan' })
  } catch (e) { console.error('sweetspot:', e) }
}
