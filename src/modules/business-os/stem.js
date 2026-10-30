// src/modules/business-os/stem.js
//
// Stem-modus van Business OS (30 okt 2026): de assistent spreekt zijn antwoorden
// hardop uit. Aan/uit via een klik op de reactor-ring, bewaard in localStorage
// ('bos_stem_aan'). Eén gedeelde stand voor ring (BusinessOS) en chat
// (BusinessChat) via useStem().
// Provider-laag: een provider is { beschikbaar(), ontgrendel(), spreek(stukken,
// onEinde), stop() }, met optioneel knip(tekst) voor een eigen stukgrootte.
// - 'elevenlabs' (alleen bij keuze 'betaald'): natuurlijke mannenstem via de edge function
//   gino-stem (ElevenLabs, sleutel alleen als Supabase-secret). Stukken op
//   zinsgrenzen (eerste zin los zodat hij snel begint, daarna ~500 tekens),
//   stuk n+1 wordt opgehaald terwijl stuk n speelt. Faalt de functie (fout,
//   503 geen_sleutel, > 8 s): rest van dít antwoord via de browserstem; het
//   volgende antwoord probeert ElevenLabs opnieuw.
// - 'browser': window.speechSynthesis (Xander/Maarten/Arnaud).
// Keuze (30 okt 2026): schakelaar onder de bol, 'gratis' (standaard, alleen de
// browserstem; gino-stem wordt dan nooit aangeroepen, ook de sleutelcheck niet)
// of 'betaald' (ElevenLabs). Bewaard in localStorage ('bos_stem_soort'). Valt
// ElevenLabs uit, dan blijft de keuze staan, praat dát antwoord verder via de
// browserstem en zet hij stand.teruggevallen (tijdstempel) voor de UI.
// Wisselen van stand wist die vlag meteen.
// Tekst wordt eerst opgeschoond (markdown, pijltjes, emoji, URL's eruit) en
// voor de browser in stukken van max ~200 tekens geknipt: Chrome/Safari kappen
// lange utterances af.

import { useSyncExternalStore } from 'react'
import { supabase } from '../../lib/supabase'

const KEY = 'bos_stem_aan'
const SOORT_KEY = 'bos_stem_soort'
const MAX_STUK = 200

// ── Browser-provider ──
const synth = typeof window !== 'undefined' ? window.speechSynthesis : null

let stemCache = null
if (synth) synth.addEventListener?.('voiceschanged', () => { stemCache = null })

// Gino is een man: bekende mannelijke Nederlandse stemmen op naam voorop,
// bekende vrouwenstemmen achteraan. Pas deze lijsten aan om de stem te wisselen.
const VOORKEUR_STEMMEN = ['Xander', 'Maarten', 'Arnaud']
const MANNELIJK = /\b(male|man)\b|mannelijk/i
const VROUWELIJKE_STEMMEN = ['Claire', 'Ellen', 'Colette', 'Fenna', 'Ana', 'Flo', 'Sandy', 'Shelley', 'Grandma']

const heeftNaam = (v, namen) => namen.some(n => new RegExp(`\\b${n}\\b`, 'i').test(v.name))
const isMannelijk = (v) => !!v && (heeftNaam(v, VOORKEUR_STEMMEN) || (MANNELIJK.test(v.name) && !/female|vrouw/i.test(v.name)))

// Volgorde: mannelijk + premium/enhanced > mannelijk > rest (nl-NL boven nl-BE,
// Premium/Enhanced/Siri/Google voorop). Geen mannenstem: dan gewoon de beste nl-stem.
function kiesStem() {
  if (stemCache) return stemCache
  const nl = (synth?.getVoices() || []).filter(v => /^nl([-_]|$)/i.test(v.lang))
  if (!nl.length) return null
  const score = (v) =>
    (isMannelijk(v) ? 10 : 0)
    + (heeftNaam(v, VROUWELIJKE_STEMMEN) || /female|vrouw/i.test(v.name) ? -5 : 0)
    + (/premium|enhanced|siri|google/i.test(v.name) ? 2 : 0)
    + (/^nl[-_]nl/i.test(v.lang) ? 1 : 0)
  stemCache = [...nl].sort((a, b) => score(b) - score(a))[0]
  return stemCache
}

// getVoices() is bij het laden vaak nog leeg: wacht op voiceschanged (max 1 s).
function stemmenKlaar() {
  if (!synth || synth.getVoices().length) return Promise.resolve()
  return new Promise(ok => {
    const klaar = () => { synth.removeEventListener?.('voiceschanged', klaar); clearTimeout(t); ok() }
    const t = setTimeout(klaar, 1000)
    synth.addEventListener?.('voiceschanged', klaar)
  })
}

let ronde = 0
let lopend = [] // referenties vasthouden: Chrome ruimt utterances anders op en vuurt dan geen onend

const browser = {
  beschikbaar: () => !!synth && typeof window.SpeechSynthesisUtterance !== 'undefined',
  // iOS/Safari spreekt pas na een gebruikersactie: een stille utterance in de klik ontgrendelt.
  ontgrendel() {
    const u = new window.SpeechSynthesisUtterance(' ')
    u.volume = 0
    synth.speak(u)
  },
  async spreek(stukken, onEinde) {
    const mijn = ++ronde
    synth.cancel()
    await stemmenKlaar()
    if (mijn !== ronde) return
    const stem = kiesStem()
    // Mannenstem iets lager; valt hij terug op een vrouwenstem, dan nog wat dieper.
    const pitch = isMannelijk(stem) ? 0.95 : 0.85
    const klaar = () => { if (mijn === ronde) { lopend = []; onEinde() } }
    lopend = stukken.map((stuk, i) => {
      const u = new window.SpeechSynthesisUtterance(stuk)
      u.lang = stem?.lang || 'nl-NL'
      if (stem) u.voice = stem
      u.rate = 1.05
      u.pitch = pitch
      if (i === stukken.length - 1) u.onend = klaar
      u.onerror = klaar
      return u
    })
    lopend.forEach(u => synth.speak(u))
  },
  stop() {
    ronde++
    lopend = []
    synth?.cancel()
  },
}

// ── ElevenLabs-provider (via edge function gino-stem) ──
const STEM_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gino-stem`
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY
const MAX_EL = 500
const TIJDSLIMIET_EL = 8000

// 0,1 s stilte als wav: afgespeeld in de klik ontgrendelt het audio-element in Safari.
function stilteWav() {
  const n = 800
  const b = new Uint8Array(44 + n)
  const v = new DataView(b.buffer)
  const tekst = (o, s) => [...s].forEach((c, i) => { b[o + i] = c.charCodeAt(0) })
  tekst(0, 'RIFF'); v.setUint32(4, 36 + n, true); tekst(8, 'WAVEfmt ')
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true)
  v.setUint32(24, 8000, true); v.setUint32(28, 8000, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true)
  tekst(36, 'data'); v.setUint32(40, n, true)
  b.fill(128, 44)
  return 'data:audio/wav;base64,' + btoa(String.fromCharCode(...b))
}

let audio = null
const speler = () => (audio ||= new Audio())
let elRonde = 0
let elAfbreker = null
let elUrls = []

const ruimOp = () => {
  elAfbreker?.abort()
  elAfbreker = null
  elUrls.forEach(u => URL.revokeObjectURL(u))
  elUrls = []
}

async function haalAudio(tekst, signal) {
  const { data } = await supabase.auth.getSession()
  const token = data?.session?.access_token
  if (!token) throw new Error('geen sessie')
  const res = await fetch(STEM_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, apikey: ANON, 'Content-Type': 'application/json' },
    body: JSON.stringify({ tekst }),
    signal,
  })
  if (!res.ok) throw new Error(`gino-stem ${res.status} ${await res.text().catch(() => '')}`)
  const stem = res.headers.get('x-gino-stem')
  if (stem) console.info('[stem] ElevenLabs:', decodeURIComponent(stem))
  const url = URL.createObjectURL(await res.blob())
  elUrls.push(url)
  return url
}

// Ophalen met tijdslimiet; bij te laat breekt hij de hele ronde af (terugval volgt).
function haalMetLimiet(tekst, afbreker) {
  let t
  const limiet = new Promise((_, nee) => {
    t = setTimeout(() => { afbreker.abort(); nee(new Error('gino-stem te traag (> 8 s)')) }, TIJDSLIMIET_EL)
  })
  return Promise.race([haalAudio(tekst, afbreker.signal), limiet]).finally(() => clearTimeout(t))
}

// Speelt één stuk af; resolve bij einde, reject bij afspeelfout.
function speel(url, mijn) {
  const a = speler()
  return new Promise((ja, nee) => {
    const klaar = (fout) => { a.onended = a.onerror = null; fout ? nee(fout) : ja() }
    a.onended = () => klaar()
    a.onerror = () => klaar(new Error('afspelen mislukt'))
    a.src = url
    a.play().catch(e => { if (mijn === elRonde) klaar(e) })
  })
}

const elevenlabs = {
  beschikbaar: () => typeof window !== 'undefined' && typeof window.Audio !== 'undefined',
  ontgrendel() {
    const a = speler()
    a.src = stilteWav()
    a.play().catch(() => {})
    if (browser.beschikbaar()) browser.ontgrendel()
  },
  // Eerste stuk = eerste zin (snelle start), de rest in stukken van ~500 tekens.
  knip(tekst) {
    const [eerste, ...rest] = knip(tekst, MAX_EL)
    if (!eerste) return []
    const zin = eerste.match(/^.+?[.!?…](\s|$)/)?.[0].trim()
    return zin && zin.length < eerste.length
      ? [zin, eerste.slice(zin.length).trim(), ...rest]
      : [eerste, ...rest]
  },
  async spreek(stukken, onEinde) {
    const mijn = ++elRonde
    ruimOp()
    const afbreker = new AbortController()
    elAfbreker = afbreker
    const actueel = () => mijn === elRonde
    let i = 0
    try {
      let volgende = haalMetLimiet(stukken[0], afbreker)
      for (; i < stukken.length; i++) {
        const url = await volgende
        if (!actueel()) return
        // Prefetch: het volgende stuk ophalen terwijl dit stuk speelt.
        if (i + 1 < stukken.length) {
          volgende = haalMetLimiet(stukken[i + 1], afbreker)
          volgende.catch(() => {}) // fout komt pas bij await; geen 'unhandled rejection' tussendoor
        }
        await speel(url, mijn)
        if (!actueel()) return
      }
      ruimOp()
      onEinde()
    } catch (e) {
      if (!actueel()) return
      ruimOp()
      // Alleen dit antwoord terugvallen; het volgende antwoord probeert ElevenLabs opnieuw
      // (30 okt 2026: één fout hield de hele sessie op de Mac-stem, ook na het zetten van de sleutel).
      console.warn('[stem] ElevenLabs werkt niet, terug naar browserstem:', e?.message || e)
      // De keuze blijft 'betaald'; teruggevallen laat de UI de terugval tonen.
      zet({ teruggevallen: Date.now() })
      const rest = knip(stukken.slice(i).join(' '))
      if (rest.length && browser.beschikbaar()) browser.spreek(rest, onEinde)
      else onEinde()
    }
  },
  stop() {
    elRonde++
    ruimOp()
    if (audio) { audio.onended = audio.onerror = null; audio.pause() }
    browser.stop()
  },
}

// Staan de ElevenLabs-sleutels in Supabase? Lege POST: de function kijkt naar de
// sleutels vóór de tekst, dus 503 geen_sleutel = ontbreken, 400 geen_tekst = ok.
// Kost geen tegoed. Bij twijfel (geen sessie, netwerk) false.
export async function sleutelOntbreekt() {
  if (stand.soort !== 'betaald') return false
  try {
    const { data } = await supabase.auth.getSession()
    const token = data?.session?.access_token
    if (!token) return false
    const res = await fetch(STEM_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, apikey: ANON, 'Content-Type': 'application/json' },
      body: '{}',
    })
    if (res.status !== 503) return false
    const j = await res.json().catch(() => ({}))
    return j?.fout === 'geen_sleutel'
  } catch {
    return false
  }
}

// ElevenLabs alleen bij keuze 'betaald' (en als Audio bestaat); anders de browserstem.
const provider = {
  kies: () => (stand.soort === 'betaald' && elevenlabs.beschikbaar() ? elevenlabs : browser),
  beschikbaar: () => elevenlabs.beschikbaar() || browser.beschikbaar(),
  ontgrendel: () => provider.kies().ontgrendel(),
  knip: (tekst) => (provider.kies().knip || knip)(tekst),
  spreek: (stukken, onEinde) => provider.kies().spreek(stukken, onEinde),
  // Beide stoppen: na een terugval praat de browserstem namens ElevenLabs.
  stop: () => { elevenlabs.stop(); browser.stop() },
}

// ── Gedeelde stand ──
const leesAan = () => {
  try { return localStorage.getItem(KEY) === '1' } catch { return false }
}
const leesSoort = () => {
  try { return localStorage.getItem(SOORT_KEY) === 'betaald' ? 'betaald' : 'gratis' } catch { return 'gratis' }
}
let stand = { aan: leesAan(), spreekt: false, soort: leesSoort(), teruggevallen: null }
const luisteraars = new Set()
const zet = (veld) => {
  stand = { ...stand, ...veld }
  luisteraars.forEach(f => f())
}
const abonneer = (f) => { luisteraars.add(f); return () => luisteraars.delete(f) }

export const beschikbaar = () => provider.beschikbaar()
export const isBezig = () => stand.spreekt
export const isAan = () => stand.aan

export function zetAan(aan) {
  try { localStorage.setItem(KEY, aan ? '1' : '0') } catch { /* privé-venster */ }
  if (!aan) stop()
  zet({ aan })
}

// 'gratis' | 'betaald'. Geldt direct en wist een eerdere ElevenLabs-fout.
// Stopt zelf niet; de schakelaar roept eerst stop() aan.
export function zetSoort(soort) {
  const s = soort === 'betaald' ? 'betaald' : 'gratis'
  try { localStorage.setItem(SOORT_KEY, s) } catch { /* privé-venster */ }
  if (s === stand.soort) return
  zet({ soort: s, teruggevallen: null })
}

export function ontgrendel() {
  if (beschikbaar()) provider.ontgrendel()
}

export function stop() {
  if (!beschikbaar()) return
  provider.stop()
  if (stand.spreekt) zet({ spreekt: false })
}

export function spreek(tekst) {
  if (!beschikbaar()) return
  const stukken = provider.knip(spreekbaar(tekst))
  if (!stukken.length) return
  zet({ spreekt: true })
  provider.spreek(stukken, () => zet({ spreekt: false }))
}

export function useStem() {
  return useSyncExternalStore(abonneer, () => stand, () => stand)
}

// ── Tekst voor spraak ──
const PIJL = /[→←↑↓⇒⇐➜➔➡]|->|=>|<-/g

export function spreekbaar(tekst) {
  return (tekst || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/https?:\/\/\S+|www\.\S+/g, ' ')
    .replace(/[\p{Extended_Pictographic}️‍]/gu, '')
    .split('\n')
    .map(r => r
      .replace(/^\s*(#{1,6}\s*|[-*•+]\s+|\d+[.)]\s+|>\s*)/, '')
      .replace(new RegExp(`^\\s*(${PIJL.source})\\s*`), '')
      .replace(PIJL, ', ')
      .replace(/\*\*|__|[*`#|]/g, '')
      .replace(/_/g, ' ')
      .replace(/\s+/g, ' ')
      .trim())
    .filter(Boolean)
    // Elke regel (ook een kort kopje of opsommingspunt) als losse zin: een pauze.
    .map(r => /[.!?:;…]$/.test(r) ? r : r + '.')
    .join(' ')
    .replace(/\s+([,.!?;:])/g, '$1')
    .replace(/([,.!?;:])[,]+/g, '$1')
    .trim()
}

// Zinnen samenvoegen tot stukken van max `max` tekens; te lange zinnen op komma of spatie knippen.
export function knip(tekst, max = MAX_STUK) {
  const zinnen = tekst.match(/[^.!?…]+[.!?…]*\s*/g) || []
  const stukken = []
  let huidig = ''
  const neem = (z) => {
    if ((huidig + z).length <= max) { huidig += z; return }
    if (huidig.trim()) stukken.push(huidig.trim())
    huidig = ''
    while (z.length > max) {
      const deel = z.slice(0, max)
      const knipAt = Math.max(deel.lastIndexOf(', '), deel.lastIndexOf(' '))
      const op = knipAt > max / 2 ? knipAt + 1 : max
      stukken.push(z.slice(0, op).trim())
      z = z.slice(op)
    }
    huidig = z
  }
  zinnen.forEach(neem)
  if (huidig.trim()) stukken.push(huidig.trim())
  return stukken.filter(s => /[\p{L}\p{N}]/u.test(s))
}
