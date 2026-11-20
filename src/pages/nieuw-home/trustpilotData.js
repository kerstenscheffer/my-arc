// src/pages/nieuw-home/trustpilotData.js (20 nov 2026)
// Reviews en score uit trustpilot_reviews / trustpilot_stand (zie trustpilot.sql).
// Anoniem lezen via REST; lukt dat niet, dan de vaste lijst.
import { useEffect, useState } from 'react'

const VAST = [
  { id: 'v1', naam: 'Casper', datum: '2026-11-19', highlight: 'Heeft me goed geholpen om gezonde routines op te bouwen', tekst: 'Kersten was een betrokken coach die me goed heeft geholpen om gezonde routines op te bouwen. De app is fijn om alles op een plek te hebben. Ik waardeerde dat Kersten fijne resources had om te delen en open stond voor feedback om de app nog verder te verbeteren.' },
  { id: 'v2', naam: 'Hessel', datum: '2026-02-20', highlight: 'Van 79,8 naar 74,4 kg in 8 weken', tekst: 'Kersten begreep het meteen! Na een week lange 0-meting kreeg ik een uitgebreid plan. Het is vooral de kennis en info die mij aanspreekt waardoor ik nu zonder teveel na te denken stabiel blijf. Als jij je aan het plan houd zal Kersten altijd de volle 100% geven!' },
  { id: 'v3', naam: 'Sassus', datum: '2025-11-05', highlight: 'Na 100 mislukte pogingen is het eindelijk gelukt', tekst: 'Na 100 mislukte pogingen wilde ik mijzelf nog 1 kans geven. Met de energie van Kersten is het mij gelukt om een routine te creëren die ik kan continueren. Niet alleen fysiek maar ook mentaal heeft Kersten mij goed geholpen.' },
]
const VAST_STAND = { trustscore: 4.4, aantal: 11 }

async function laad() {
  const url = import.meta.env.VITE_SUPABASE_URL
  const sleutel = import.meta.env.VITE_SUPABASE_ANON_KEY
  if (!url || !sleutel) throw new Error('geen supabase')
  const kop = { apikey: sleutel, Authorization: `Bearer ${sleutel}` }
  const [r, s] = await Promise.all([
    fetch(`${url}/rest/v1/trustpilot_reviews?select=id,naam,sterren,tekst,highlight,datum&order=datum.desc&limit=20`, { headers: kop }),
    fetch(`${url}/rest/v1/trustpilot_stand?select=trustscore,aantal`, { headers: kop }),
  ])
  if (!r.ok || !s.ok) throw new Error('laden mislukt')
  const reviews = await r.json()
  const stand = (await s.json())[0]
  return { reviews: reviews.length ? reviews : VAST, stand: stand || VAST_STAND }
}

export function useTrustpilot() {
  const [data, setData] = useState({ reviews: VAST, stand: VAST_STAND })
  useEffect(() => {
    let weg = false
    laad().then((d) => { if (!weg) setData(d) }, () => {})
    return () => { weg = true }
  }, [])
  return data
}

