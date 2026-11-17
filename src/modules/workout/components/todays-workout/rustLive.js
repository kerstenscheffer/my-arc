// src/modules/workout/components/todays-workout/rustLive.js
//
// De lopende rustklok op het vergrendelscherm (17 nov 2026, Kersten).
// iOS: Live Activity (ook in de Dynamic Island). Android: vaste stille melding
// met een klok die zelf aftelt. Beide tellen native door met het scherm uit;
// hier geven we alleen de eindtijd door als die verandert (start, pauze,
// +15/−15, opnieuw, stop).
//
// Native plugin 'RustTimer': ios/App/App/RustTimerPlugin.swift en
// android/.../RustTimerPlugin.java. Zit pas in de build vanaf app 2.0; oudere
// builds en de website slaan dit stil over.

import { Capacitor, registerPlugin } from '@capacitor/core'

let plugin = null // null = nog niet gekeken, false = niet beschikbaar
const native = () => {
  if (plugin === null) {
    try {
      plugin = Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('RustTimer')
        ? registerPlugin('RustTimer')
        : false
    } catch {
      plugin = false
    }
  }
  return plugin || null
}

const mmss = (sec) => `${Math.floor(sec / 60)}:${String(Math.max(0, sec) % 60).padStart(2, '0')}`

// `haal` geeft de lopende klok of null, `abonneer` meldt elke wijziging.
export const koppelRustLive = (haal, abonneer) => {
  const p = native()
  if (!p) return
  let vorige = null
  let wacht = null
  const stuur = () => {
    wacht = null
    const k = haal()
    // Alleen wat op het vergrendelscherm zichtbaar is; 'klaar' en dergelijke
    // veranderen daar niets aan.
    const sleutel = k ? `${k.oefening}|${k.pauzeOver != null ? `p${k.pauzeOver}` : k.eind}` : ''
    if (sleutel === vorige) return
    vorige = sleutel
    if (!k) { p.stop().catch(() => {}); return }
    const pauze = k.pauzeOver != null
    p.toon({
      eind: pauze ? Date.now() + k.pauzeOver * 1000 : k.eind,
      oefening: k.oefening || '',
      pauze,
      pauzeTekst: pauze ? mmss(k.pauzeOver) : '',
    }).catch(() => {})
  }
  // Slepen over de klok verzet hem tientallen keren per seconde: even wachten.
  abonneer(() => { if (!wacht) wacht = setTimeout(stuur, 300) })
  // Bij het openen: een achtergebleven klok van een vorige sessie opruimen, of
  // een lopende (uit localStorage) weer tonen.
  stuur()
}
