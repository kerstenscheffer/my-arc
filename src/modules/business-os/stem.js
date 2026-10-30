// src/modules/business-os/stem.js
//
// Stem-modus van Business OS (30 okt 2026): de assistent spreekt zijn antwoorden
// hardop uit. Aan/uit via een klik op de reactor-ring, bewaard in localStorage
// ('bos_stem_aan'). Eén gedeelde stand voor ring (BusinessOS) en chat
// (BusinessChat) via useStem().
// Provider-laag: een provider is { beschikbaar(), ontgrendel(), spreek(stukken,
// onEinde), stop() }, met optioneel knip(tekst) voor een eigen stukgrootte.
// - 'elevenlabs' (altijd eerste keus): natuurlijke mannenstem via de edge function
//   gino-stem (ElevenLabs, sleutel alleen als Supabase-secret). Stukken op
//   zinsgrenzen (eerste zin los zodat hij snel begint, daarna ~500 tekens),
//   stuk n+1 wordt opgehaald terwijl stuk n speelt. Faalt de functie (fout,
//   503 geen_sleutel, te traag): rest van dít antwoord via de browserstem; het
//   volgende antwoord probeert ElevenLabs opnieuw.
// - 'browser': window.speechSynthesis (Xander/Maarten/Arnaud), alleen als
//   noodterugval of als de browser geen Audio heeft.
// Sinds 30 okt (avond) geen stemschakelaar meer: de oude localStorage-waarde
// 'bos_stem_soort' wordt genegeerd. Valt ElevenLabs uit, dan zet hij
// stand.teruggevallen (tijdstempel; de bol gloeit kort oranjerood), logt de
// fout in de console én in app_fouten (pagina 'business-os-stem', melding
// 'terugval Mac-stem [foutcode] …', élke terugval, zie meldTerugval).
// Korte gesproken versie (30 okt 2026, avond): getypt staat alles, de stem zegt
// alleen de kern. spreek() en herhaal() krijgen altijd de volledige tekst (niet
// de ingekorte robot-regel) en maken er via spreekTekst() 1-3 complete zinnen
// van (max ~250 tekens, nooit midden in een zin, nooit '...'). Eén functie voor
// voorlezen én herhaalknop, dus ze zeggen hetzelfde; de cache staat op die korte
// tekst. Scheelt ook ElevenLabs-tekens (gratis plan: 10.000 per maand).
// Tekst wordt eerst opgeschoond (markdown, pijltjes, emoji, URL's eruit) en
// voor de browser in stukken van max ~200 tekens geknipt: Chrome/Safari kappen
// lange utterances af.
// Herhalen (30 okt 2026): de audio van het laatste antwoord (spreek(tekst,
// { bewaar: true })) blijft als object-URL's in het geheugen staan, zodat
// herhaal() hem opnieuw afspeelt zonder nieuwe gino-stem-aanroep (ElevenLabs-
// tekens). Nog niets bewaard (stem stond uit)? Dan haalt herhaal() hem één keer op.

import { useSyncExternalStore } from 'react'
import { supabase } from '../../lib/supabase'
import { APP_VERSIE } from '../app-update/appVersie'
import { getallenNaarEngels } from './getallenNaarEngels'

const KEY = 'bos_stem_aan'

// Elke terugval naar de Mac-stem in app_fouten (pagina 'business-os-stem'),
// met de foutcode vooraan. Bewust niet via meldFout: die meldt dezelfde fout
// maar één keer per sessie, waardoor een herhaalde 503 onzichtbaar bleef
// (30 okt 2026). Hooguit 30 per sessie, zodat een lus de tabel niet vult.
let terugvallenGemeld = 0
function meldTerugval(e) {
  if (++terugvallenGemeld > 30) return
  const code = e?.code || 'onbekend'
  supabase.from('app_fouten').insert({
    pagina: 'business-os-stem',
    melding: `terugval Mac-stem [${code}] ${String(e?.message || e || '').slice(0, 900)}`,
    stack: String(e?.stack || '').slice(0, 4000),
    versie: APP_VERSIE || null,
    user_agent: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 300) : null,
  }).then(r => r, () => {})
}
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
// Tot de audio binnen is. Eén stuk is max ~500 tekens; multilingual_v2 plus een
// koude start van de edge function haalt 8 s daar niet altijd.
const TIJDSLIMIET_EL = 15000

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
// Audio van de laatste paar bewaarde teksten (chatantwoord, robot-regel,
// opdrachtresultaat): tekst → { urls[i] per stuk }. Oudste valt eruit.
const MAX_BEWAARD = 4
const bewaard = new Map()
const bewaarVoor = (tekst) => {
  if (bewaard.has(tekst)) return bewaard.get(tekst)
  const nieuw = { urls: [] }
  bewaard.set(tekst, nieuw)
  if (bewaard.size > MAX_BEWAARD) {
    const [oudste, oud] = bewaard.entries().next().value
    oud.urls.forEach(u => u && URL.revokeObjectURL(u))
    bewaard.delete(oudste)
  }
  return nieuw
}

const ruimOp = () => {
  elAfbreker?.abort()
  elAfbreker = null
  elUrls.forEach(u => URL.revokeObjectURL(u))
  elUrls = []
}

// Fout met een korte code voor app_fouten (bijv. '503 geen_sleutel', 'afspelen NotAllowedError').
const stemFout = (code, detail = '') => Object.assign(new Error(`gino-stem ${code}${detail ? ` ${detail}` : ''}`), { code })

// Getallen naar Engelse woorden (getallenNaarEngels.js), alleen voor ElevenLabs:
// de browser-terugval en het scherm houden de Nederlandse tekst. Wordt het te
// lang voor gino-stem (max 1000 tekens), dan de oorspronkelijke tekst.
const MAX_GINO_STEM = 1000
function voorStem(tekst) {
  const engels = getallenNaarEngels(tekst)
  return engels.length <= MAX_GINO_STEM ? engels : tekst
}

async function haalAudio(tekst, signal) {
  const { data } = await supabase.auth.getSession()
  const token = data?.session?.access_token
  if (!token) throw stemFout('geen_sessie')
  const res = await fetch(STEM_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, apikey: ANON, 'Content-Type': 'application/json' },
    body: JSON.stringify({ tekst: voorStem(tekst) }),
    signal,
  }).catch(e => { throw stemFout('netwerk', e?.message) })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    let fout = ''
    try { const j = JSON.parse(body); fout = [j.fout, j.status].filter(Boolean).join(' ') } catch { /* geen json */ }
    throw stemFout(`${res.status}${fout ? ` ${fout}` : ''}`, fout ? '' : body.slice(0, 200))
  }
  const stem = res.headers.get('x-gino-stem')
  if (stem) console.info('[stem] ElevenLabs:', decodeURIComponent(stem))
  return URL.createObjectURL(await res.blob())
}

// Ophalen met tijdslimiet; bij te laat breekt hij de hele ronde af (terugval volgt).
function haalMetLimiet(tekst, afbreker) {
  let t
  const limiet = new Promise((_, nee) => {
    t = setTimeout(() => { afbreker.abort(); nee(stemFout('te_traag', `(> ${TIJDSLIMIET_EL / 1000} s)`)) }, TIJDSLIMIET_EL)
  })
  return Promise.race([haalAudio(tekst, afbreker.signal), limiet]).finally(() => clearTimeout(t))
}

// Speelt één stuk af; resolve bij einde, reject bij afspeelfout.
function speel(url, mijn) {
  const a = speler()
  return new Promise((ja, nee) => {
    const klaar = (fout) => { a.onended = a.onerror = null; fout ? nee(fout) : ja() }
    a.onended = () => klaar()
    a.onerror = () => klaar(stemFout('afspelen', `mediafout ${a.error?.code || ''}`.trim()))
    a.src = url
    a.play().catch(e => { if (mijn === elRonde) klaar(stemFout(`afspelen ${e?.name || 'fout'}`, e?.message)) })
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
  async spreek(stukken, onEinde, bewaarTekst) {
    const mijn = ++elRonde
    ruimOp()
    const afbreker = new AbortController()
    elAfbreker = afbreker
    const actueel = () => mijn === elRonde
    // Bewaren: al opgehaalde stukken hergebruiken, nieuwe in de cache zetten.
    // Zonder bewaren: tijdelijk, ruimOp gooit ze weg.
    const cache = bewaarTekst ? bewaarVoor(bewaarTekst) : null
    const haal = (n) => {
      if (cache?.urls[n]) return Promise.resolve(cache.urls[n])
      return haalMetLimiet(stukken[n], afbreker).then(url => {
        if (cache && bewaard.get(bewaarTekst) === cache) cache.urls[n] = url
        else elUrls.push(url)
        return url
      })
    }
    let i = 0
    try {
      let volgende = haal(0)
      for (; i < stukken.length; i++) {
        const url = await volgende
        if (!actueel()) return
        // Prefetch: het volgende stuk ophalen terwijl dit stuk speelt.
        if (i + 1 < stukken.length) {
          volgende = haal(i + 1)
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
      console.error('[stem] ElevenLabs werkt niet, terug naar browserstem:', e?.message || e)
      meldTerugval(e)
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

// ElevenLabs altijd (als Audio bestaat); anders de browserstem.
const provider = {
  kies: () => (elevenlabs.beschikbaar() ? elevenlabs : browser),
  beschikbaar: () => elevenlabs.beschikbaar() || browser.beschikbaar(),
  ontgrendel: () => provider.kies().ontgrendel(),
  knip: (tekst) => (provider.kies().knip || knip)(tekst),
  spreek: (stukken, onEinde, bewaarTekst) => {
    // Zonder Audio-element kan gino-stem niet spelen: ook die terugval loggen.
    if (!elevenlabs.beschikbaar()) {
      meldTerugval(stemFout('geen_audio', 'browser heeft geen Audio-element'))
      zet({ teruggevallen: Date.now() })
    }
    return provider.kies().spreek(stukken, onEinde, bewaarTekst)
  },
  // Beide stoppen: na een terugval praat de browserstem namens ElevenLabs.
  stop: () => { elevenlabs.stop(); browser.stop() },
}

// ── Gedeelde stand ──
const leesAan = () => {
  try { return localStorage.getItem(KEY) === '1' } catch { return false }
}
// bron: wie er nu praat (bv. 'terugblik-<tabje>'), zodat die knop weet dat hij 'stop' is.
let stand = { aan: leesAan(), spreekt: false, teruggevallen: null, bron: null }
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

export function ontgrendel() {
  if (beschikbaar()) provider.ontgrendel()
}

export function stop() {
  if (!beschikbaar()) return
  provider.stop()
  if (stand.spreekt) zet({ spreekt: false, bron: null })
}

// tekst = de volledige tekst; uitgesproken wordt alleen spreekTekst(tekst),
// plus eventueel de vraag (toestemmingsvraag) erachter.
// bewaar: audio van dit antwoord bewaren voor herhaal().
// heel: de hele tekst uitspreken (alleen opgeschoond), niet de korte versie.
export function spreek(tekst, { bewaar = false, vraag = null, heel = false, bron = null } = {}) {
  if (!beschikbaar()) return
  const schoon = heel ? spreekbaar(tekst) : [spreekTekst(tekst), spreekTekst(vraag)].filter(Boolean).join(' ')
  const stukken = provider.knip(schoon)
  if (!stukken.length) return
  zet({ spreekt: true, bron })
  provider.spreek(stukken, () => zet({ spreekt: false, bron: null }), bewaar ? schoon : null)
}

// Herhaalknop: speelt het antwoord opnieuw af, ook als de stem uit staat.
// Uit de cache als die er is; anders één keer ophalen en bewaren. Aanroepen
// vanuit de klik (ontgrendelt Safari).
export function herhaal(tekst, vraag = null) {
  if (!beschikbaar()) return
  stop()
  provider.ontgrendel()
  spreek(tekst, { bewaar: true, vraag })
}

// Terugblik onderaan een gesprek: de hele tekst voorlezen, ook als de stem uit
// staat, audio bewaard (tweede klik op dezelfde terugblik kost geen tekens).
// Aanroepen vanuit de klik (ontgrendelt Safari).
export function leesVoor(tekst, bron) {
  if (!beschikbaar()) return
  stop()
  provider.ontgrendel()
  spreek(tekst, { bewaar: true, heel: true, bron })
}

export function useStem() {
  return useSyncExternalStore(abonneer, () => stand, () => stand)
}

// ── Tekst voor spraak ──
const PIJL = /[→←↑↓⇒⇐➜➔➡]|->|=>|<-/g

export function spreekbaar(tekst) {
  return (tekst || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/https?:\/\/\S+|www\.\S+/g, ' ')
    .replace(/^\s*([-*_=]\s*){3,}$/gm, '')
    .replace(/~~/g, '')
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

// Korte gesproken versie van een volledige tekst: opmaak eruit, kopjes en
// opsommingen (-, *, •, 1., pijltjes, tabelrijen) overgeslagen zolang er gewone
// zinnen zijn, dan de eerste 1-3 zinnen tot max ~250 tekens. Knipt alleen op een
// zinseinde (. ! ?). Is de eerste zin zelf te lang: tot ~400 tekens heel, anders
// op de laatste komma of woordgrens, afgesloten met een punt. Nooit '...'.
const MAX_SPREEK = 250
const MAX_EERSTE_ZIN = 400
const IS_LIJST = new RegExp(`^\\s*([-*•+]\\s+|\\d+[.)]\\s+|(${PIJL.source})|\\|)`)
const IS_KOPJE = /^\s*#{1,6}\s/

export function spreekTekst(volledig, max = MAX_SPREEK) {
  const regels = (volledig || '').replace(/```[\s\S]*?```/g, ' ').split('\n')
  const volgende = (i) => regels.slice(i + 1).find(r => r.trim()) || ''
  // Gewone tekst: geen kopje, geen lijst, en geen aankondiging ("Dit deed ik:")
  // van een lijst die we toch overslaan.
  const proza = regels.filter((r, i) => r.trim() && !IS_KOPJE.test(r) && !IS_LIJST.test(r)
    && !(/:\s*$/.test(r) && IS_LIJST.test(volgende(i))))
  let schoon = spreekbaar(proza.join('\n')) || spreekbaar(volledig)
  schoon = schoon.replace(/\.{2,}|…/g, '.').replace(/([.!?])[.]+/g, '$1').trim()
  if (!/[\p{L}\p{N}]/u.test(schoon)) return ''
  const zinnen = (schoon.match(/.+?(?:[.!?]+(?=\s|$)|$)/g) || []).map(z => z.trim()).filter(Boolean)
  let uit = zinnen[0]
  if (uit.length > MAX_EERSTE_ZIN) {
    const deel = uit.slice(0, max)
    const komma = deel.lastIndexOf(', ')
    const op = komma > max / 3 ? komma : deel.lastIndexOf(' ')
    uit = deel.slice(0, op > 0 ? op : max).replace(/[\s,;:–-]+$/, '')
  }
  for (const z of zinnen.slice(1, 3)) {
    if ((uit + ' ' + z).length > max) break
    uit += ' ' + z
  }
  // Altijd afsluiten op een zinseinde (ook als de laatste zin op : of ; eindigde).
  return uit.replace(/[\s,;:–-]+$/, '').replace(/([^.!?])$/, '$1.')
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
