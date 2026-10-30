// src/modules/business-os/stem.js
//
// Stem-modus van Business OS (30 okt 2026): de assistent spreekt zijn antwoorden
// hardop uit. Aan/uit via een klik op de reactor-ring, bewaard in localStorage
// ('bos_stem_aan'). Eén gedeelde stand voor ring (BusinessOS) en chat
// (BusinessChat) via useStem().
// Provider-laag: nu alleen 'browser' (window.speechSynthesis). Een provider is
// { beschikbaar(), ontgrendel(), spreek(stukken, onEinde), stop() }. Later kan
// er een provider bij die via een edge function (ElevenLabs / OpenAI TTS) een
// audiobestand ophaalt en afspeelt, zonder dat de UI verandert. Geen sleutels
// in de browser.
// Tekst wordt eerst opgeschoond (markdown, pijltjes, emoji, URL's eruit) en in
// stukken van max ~200 tekens geknipt: Chrome/Safari kappen lange utterances af.

import { useSyncExternalStore } from 'react'

const KEY = 'bos_stem_aan'
const MAX_STUK = 200

// ── Browser-provider ──
const synth = typeof window !== 'undefined' ? window.speechSynthesis : null

let stemCache = null
if (synth) synth.addEventListener?.('voiceschanged', () => { stemCache = null })

// Beste Nederlandse stem: nl-NL boven nl-BE, en Premium/Enhanced/Siri/Google voorop.
function kiesStem() {
  if (stemCache) return stemCache
  const nl = (synth?.getVoices() || []).filter(v => /^nl([-_]|$)/i.test(v.lang))
  if (!nl.length) return null
  const score = (v) => (/premium|enhanced|siri|google/i.test(v.name) ? 2 : 0) + (/^nl[-_]nl/i.test(v.lang) ? 1 : 0)
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
    const klaar = () => { if (mijn === ronde) { lopend = []; onEinde() } }
    lopend = stukken.map((stuk, i) => {
      const u = new window.SpeechSynthesisUtterance(stuk)
      u.lang = stem?.lang || 'nl-NL'
      if (stem) u.voice = stem
      u.rate = 1.05
      u.pitch = 1
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

const provider = browser

// ── Gedeelde stand ──
const leesAan = () => {
  try { return localStorage.getItem(KEY) === '1' } catch { return false }
}
let stand = { aan: leesAan(), spreekt: false }
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
  if (stand.spreekt) zet({ spreekt: false })
}

export function spreek(tekst) {
  if (!beschikbaar()) return
  const stukken = knip(spreekbaar(tekst))
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

// Zinnen samenvoegen tot stukken van max MAX_STUK; te lange zinnen op komma of spatie knippen.
export function knip(tekst) {
  const zinnen = tekst.match(/[^.!?…]+[.!?…]*\s*/g) || []
  const stukken = []
  let huidig = ''
  const neem = (z) => {
    if ((huidig + z).length <= MAX_STUK) { huidig += z; return }
    if (huidig.trim()) stukken.push(huidig.trim())
    huidig = ''
    while (z.length > MAX_STUK) {
      const deel = z.slice(0, MAX_STUK)
      const knipAt = Math.max(deel.lastIndexOf(', '), deel.lastIndexOf(' '))
      const op = knipAt > MAX_STUK / 2 ? knipAt + 1 : MAX_STUK
      stukken.push(z.slice(0, op).trim())
      z = z.slice(op)
    }
    huidig = z
  }
  zinnen.forEach(neem)
  if (huidig.trim()) stukken.push(huidig.trim())
  return stukken.filter(s => /[\p{L}\p{N}]/u.test(s))
}
