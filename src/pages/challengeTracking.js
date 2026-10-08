// src/pages/challengeTracking.js
//
// Meting voor de challenge-pagina's (/challenge en /challenge/start), voor
// de Meta-advertenties. Schrijft gebeurtenissen naar challenge_events met
// de utm's van de advertentie, zodat het coachscherm "Ads" per hook kan
// optellen: bezoeken, tijd op de pagina, video, knop, formulier, leads en
// geplande calls.
//
// Sessie en utm's staan in sessionStorage: wie van /challenge naar
// /challenge/start gaat (of het formulier in het blad opent) houdt dezelfde
// sessie en dezelfde advertentie-herkomst.
//
// Link-conventie voor Meta (vul in bij "URL-parameters" van de advertentie):
//   utm_source=meta&utm_medium=paid&utm_campaign={{campaign.name}}&utm_content={{ad.name}}
// utm_content is de hook; daar draait het scherm om.

import db from '../services/DatabaseService'

const SESSIE_SLEUTEL = 'myarc_challenge_sessie'
const UTM_SLEUTEL = 'myarc_challenge_utm'
const UTM_VELDEN = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid']

const lees = (sleutel) => { try { return sessionStorage.getItem(sleutel) } catch { return null } }
const schrijf = (sleutel, waarde) => { try { sessionStorage.setItem(sleutel, waarde) } catch { /* privémodus */ } }

export function sessieId() {
  let id = lees(SESSIE_SLEUTEL)
  if (!id) {
    id = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `s_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
    schrijf(SESSIE_SLEUTEL, id)
  }
  return id
}

// Utm's uit de URL; staan ze er niet, dan die van eerder in deze sessie.
export function herkomst() {
  let uitUrl = {}
  try {
    const q = new URLSearchParams(window.location.search)
    UTM_VELDEN.forEach(k => { const v = q.get(k); if (v) uitUrl[k] = v })
  } catch { /* leeg */ }
  if (Object.keys(uitUrl).length) {
    const bewaard = { ...uitUrl, referrer: document.referrer || '' }
    schrijf(UTM_SLEUTEL, JSON.stringify(bewaard))
    return bewaard
  }
  try { const b = lees(UTM_SLEUTEL); if (b) return JSON.parse(b) } catch { /* leeg */ }
  return { referrer: document.referrer || '' }
}

const isMobiel = () => { try { return window.innerWidth <= 768 } catch { return null } }

// Eén gebeurtenis wegschrijven. Faalt stil: meten mag de pagina nooit breken.
export function meet(event, extra = {}) {
  try {
    const h = herkomst()
    const rij = {
      session_id: sessieId(), event,
      pad: window.location.pathname,
      utm_source: h.utm_source || null, utm_medium: h.utm_medium || null,
      utm_campaign: h.utm_campaign || null, utm_content: h.utm_content || null,
      utm_term: h.utm_term || null, fbclid: h.fbclid || null,
      referrer: h.referrer || null,
      is_mobile: isMobiel(), user_agent: (navigator.userAgent || '').slice(0, 200),
      ...extra,
    }
    db.supabase.from('challenge_events').insert(rij).then(() => {}, () => {})
  } catch { /* leeg */ }
}

// Meta Pixel (staat in index.html). Alleen aanroepen als hij er is.
export function pixel(naam, data) {
  try { if (typeof window.fbq === 'function') window.fbq('track', naam, data || {}) } catch { /* leeg */ }
}

// Tijd op de pagina: elke 15 s een tussenstand en bij het verlaten de
// eindstand, met keepalive zodat het verzoek het sluiten van het tabblad
// overleeft. Het scherm neemt per sessie de hoogste waarde.
export function volgTijdOpPagina() {
  const start = Date.now()
  let laatst = 0
  const seconden = () => Math.round((Date.now() - start) / 1000)
  const stuur = (keepalive = false) => {
    const s = seconden()
    if (s <= laatst) return
    laatst = s
    if (!keepalive) { meet('tijd', { seconden: s }); return }
    try {
      const h = herkomst()
      const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/challenge_events`
      const key = import.meta.env.VITE_SUPABASE_ANON_KEY
      fetch(url, {
        method: 'POST', keepalive: true,
        headers: { 'Content-Type': 'application/json', apikey: key, Authorization: `Bearer ${key}`, Prefer: 'return=minimal' },
        body: JSON.stringify({
          session_id: sessieId(), event: 'tijd', seconden: s, pad: window.location.pathname,
          utm_source: h.utm_source || null, utm_medium: h.utm_medium || null,
          utm_campaign: h.utm_campaign || null, utm_content: h.utm_content || null,
          fbclid: h.fbclid || null, is_mobile: isMobiel(),
        }),
      }).catch(() => {})
    } catch { /* leeg */ }
  }
  const timer = setInterval(() => stuur(false), 15000)
  const weg = () => stuur(true)
  const zicht = () => { if (document.visibilityState === 'hidden') stuur(true) }
  window.addEventListener('pagehide', weg)
  document.addEventListener('visibilitychange', zicht)
  return () => {
    clearInterval(timer)
    window.removeEventListener('pagehide', weg)
    document.removeEventListener('visibilitychange', zicht)
    stuur(true)
  }
}
