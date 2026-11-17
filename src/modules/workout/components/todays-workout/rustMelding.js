// src/modules/workout/components/todays-workout/rustMelding.js
//
// Rust voorbij terwijl de app op de achtergrond staat of het scherm op slot is
// (12 nov 2026, belofte Wesley). Dan draait er geen JavaScript en klinkt de bel
// uit rustKlok.js dus niet. Daarom plannen we op het moment dat de app uit
// beeld gaat een LOKALE melding op de eindtijd van de klok, met het standaard
// meldingsgeluid. Komt de app terug in beeld, dan gaat die melding er weer af
// en neemt de bel in de app het over (anders klinkt het dubbel).
//
// Lokaal op het toestel zelf, nooit via de server: er gaat niets naar de klant
// toe. Werkt alleen als de native plugin LocalNotifications in de app-build zit
// (@capacitor/local-notifications). Oudere builds en de website slaan dit stil
// over; de bel in de app blijft daar gewoon werken.

import { Capacitor, registerPlugin } from '@capacitor/core'

const MELDING_ID = 7301 // vast: er loopt maar één rustklok tegelijk
// Eigen kanaal met de boksbel als geluid. Android laat het geluid van een
// bestaand kanaal niet meer wijzigen, dus een nieuw id (het oude 'rusttimer'
// had het standaardgeluid). Bestand: android/app/src/main/res/raw/rustbel.wav
// en ios/App/App/rustbel.wav (17 nov 2026). Ontbreekt het in een oudere build,
// dan valt het toestel terug op het standaard meldingsgeluid.
const KANAAL = 'rusttimer_bel'
const GELUID = 'rustbel.wav'

let plugin = null // null = nog niet gekeken, false = niet beschikbaar
const meldingen = () => {
  if (plugin === null) {
    try {
      plugin = Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('LocalNotifications')
        ? registerPlugin('LocalNotifications')
        : false
    } catch {
      plugin = false
    }
  }
  return plugin || null
}

let mag = false
let gevraagd = false
let haalKlok = () => null

const maakKanaal = (p) => {
  // Android: eigen kanaal met hoge prioriteit, zodat hij geluid maakt en
  // bovenin verschijnt. iOS kent geen kanalen.
  if (Capacitor.getPlatform() !== 'android') return
  p.createChannel({
    id: KANAAL, name: 'Rusttimer', description: 'Rust voorbij tussen twee sets',
    importance: 4, visibility: 1, vibration: true, sound: GELUID,
  }).catch(() => {})
}

const zetToestemming = (r) => {
  mag = r?.display === 'granted'
  if (mag) maakKanaal(meldingen())
}

// Bij de start-tik van de klok: één keer per app-sessie toestemming vragen als
// die nog niet beslist is. Heeft de klant meldingen al toegestaan (push), dan
// komt er geen vraag.
export const vraagRustMeldingToestemming = () => {
  const p = meldingen()
  if (!p || gevraagd || mag) return
  gevraagd = true
  p.checkPermissions()
    .then(r => (r?.display === 'prompt' || r?.display === 'prompt-with-rationale') ? p.requestPermissions() : r)
    .then(zetToestemming, () => {})
}

const annuleer = () => {
  const p = meldingen()
  if (!p) return
  p.cancel({ notifications: [{ id: MELDING_ID }] }).catch(() => {})
}

const plan = () => {
  const p = meldingen()
  const k = haalKlok()
  if (!p || !mag || !k || k.pauzeOver != null || k.klaar) return
  // Bijna op nul: dan klinkt de bel nog in de app of is het al voorbij.
  if (k.eind - Date.now() < 1500) return
  p.schedule({
    notifications: [{
      id: MELDING_ID,
      title: 'Rust voorbij',
      body: k.oefening ? `Volgende set: ${k.oefening}` : 'Tijd voor je volgende set',
      schedule: { at: new Date(k.eind), allowWhileIdle: true },
      ...(Capacitor.getPlatform() === 'android' ? { channelId: KANAAL } : {}),
      autoCancel: true,
      sound: GELUID, // iOS; Android pakt het geluid van het kanaal
    }],
  }).catch(() => {})
}

// `haal` geeft de lopende klok, of null als er geen is of het geluid uit staat.
export const koppelRustMelding = (haal) => {
  haalKlok = haal
  const p = meldingen()
  if (!p || typeof document === 'undefined') return
  // Na een herstart van de app: kijken zonder te vragen.
  p.checkPermissions().then(zetToestemming, () => {})
  // Scherm op slot telt ook als uit beeld: dat is in de gym het gewone geval.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') plan()
    else annuleer()
  })
}
