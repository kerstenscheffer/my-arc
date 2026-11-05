// src/modules/challenge-monitor/challengeCoach.js
//
// De challenge-stand voor de coach, zonder deelname-rij. Een rij in challenge_assignments
// zet bij de klant de trofee aan, dus hier wordt alleen gelezen.

import { supabase } from '../../lib/supabase'
import { EISEN, waardenUit, haalStand, allesGehaald } from './challengeEisen'

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
  return {
    regels: EISEN.map(e => ({ key: e.key, label: e.label, waarde: w[e.key], nodig: e.nodig, gehaald: w[e.key] >= e.nodig })),
    behaald: EISEN.filter(e => w[e.key] >= e.nodig).length,
    totaal: EISEN.length,
    alles: allesGehaald(stand),
    voorbij: venster.end_date < new Date().toLocaleDateString('sv-SE'),
  }
}
