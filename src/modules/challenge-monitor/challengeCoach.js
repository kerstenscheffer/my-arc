// src/modules/challenge-monitor/challengeCoach.js
//
// De challenge-stand voor de coach, zonder deelname-rij. Een rij in challenge_assignments
// zet bij de klant de trofee aan, dus hier wordt alleen gelezen.

import { supabase } from '../../lib/supabase'
import { EISEN, waardenUit, haalStand, allesGehaald } from './challengeEisen'
import { prognose } from './challengePrognose'

const CHALLENGE_DAGEN = 42

// De looptijd van de challenge: de eerste 6 weken, ook als het traject daarna verlengd is.
export function challengeVenster(client) {
  if (!client?.coaching_start_date) return null
  const eind = new Date(`${client.coaching_start_date}T12:00:00`)
  eind.setDate(eind.getDate() + CHALLENGE_DAGEN - 1 + (Number(client.coaching_paused_days_total) || 0))
  return { client_id: client.id, start_date: client.coaching_start_date, end_date: eind.toLocaleDateString('sv-SE') }
}

export async function haalEisen(client) {
  const venster = challengeVenster(client)
  if (!venster) return null
  const stand = await haalStand({ supabase }, venster)
  if (!stand) return null
  const w = waardenUit(stand)
  // Calls uit Zoom en je agenda: client_calls wordt niet meer gevuld. Lukt dat niet, dan de oude telling.
  const { data: calls } = await supabase.rpc('get_challenge_calls', {
    p_client_id: venster.client_id, p_start: venster.start_date, p_eind: venster.end_date,
  }).then(res => res, () => ({ data: null }))
  if (calls) {
    w.calls = Math.max(w.calls, Number(calls.gevoerd) || 0)
    stand.calls = w.calls
  }
  const schatting = prognose(w, Object.fromEntries(EISEN.map(e => [e.key, e.nodig])), { start: venster.start_date, eind: venster.end_date })
  return {
    prognose: schatting,
    regels: EISEN.map(e => ({
      schema: schatting.regels[e.key],
      key: e.key, label: e.label, waarde: w[e.key], nodig: e.nodig, gehaald: w[e.key] >= e.nodig, uitleg: e.uitleg, info: e.info,
      ...(e.key === 'calls' && calls ? { gepland: Number(calls.gepland) || 0 } : null),
    })),
    behaald: EISEN.filter(e => w[e.key] >= e.nodig).length,
    totaal: EISEN.length,
    alles: allesGehaald(stand),
    voorbij: venster.end_date < new Date().toLocaleDateString('sv-SE'),
  }
}

// Handmatige keuzes per klant (client_challenge_instelling). Geen rij = alles automatisch.
export async function haalInstellingen(ids = null) {
  let q = supabase.from('client_challenge_instelling').select('client_id, telt_niet_mee, borg_geschikt, reden, sale_id')
  if (ids) q = q.in('client_id', ids)
  const { data, error } = await q.then(r => r, e => ({ error: e }))
  if (error) throw error
  return new Map((data || []).map(r => [r.client_id, r]))
}

export async function zetInstelling(clientId, velden) {
  const { error } = await supabase.from('client_challenge_instelling')
    .upsert({ client_id: clientId, ...velden, updated_at: new Date().toISOString() }, { onConflict: 'client_id' })
    .then(r => r, e => ({ error: e }))
  if (error) throw error
}

// Het oordeel over de borg: handmatig wint, anders de eisen zodra de challenge voorbij is.
export function borgOordeel(eisen, instelling) {
  const handmatig = instelling?.borg_geschikt
  if (handmatig === true) return { tekst: 'Geschikt voor borg terug', geschikt: true, handmatig: true }
  if (handmatig === false) return { tekst: 'Niet geschikt voor borg terug', geschikt: false, handmatig: true }
  if (!eisen?.voorbij) return null
  return eisen.alles
    ? { tekst: 'Geschikt voor borg terug', geschikt: true, handmatig: false }
    : { tekst: 'Niet geschikt voor borg terug', geschikt: false, handmatig: false }
}
