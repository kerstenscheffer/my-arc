// src/terugknop.js
//
// Android-terugknop (en de terug-swipe). Zonder afhandeling sluit Capacitor
// de hele app zodra er geen browsergeschiedenis is, en die is er niet: de
// app wisselt van scherm zonder de URL te veranderen. Martijn (call 8 okt
// 2026) swipete uit gewoonte terug en stond buiten de app.
//
// Afspraak: de terugknop stuurt het event 'myarc:back'. Wie het afhandelt
// (dashboard naar home, venster dicht) roept preventDefault() aan. Doet
// niemand dat, dan gaat de app naar de achtergrond in plaats van dicht.

import { Capacitor } from '@capacitor/core'

export async function installeerTerugknop() {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') return
  try {
    const { App } = await import('@capacitor/app')
    App.addListener('backButton', () => {
      const ev = new CustomEvent('myarc:back', { cancelable: true })
      window.dispatchEvent(ev)
      if (!ev.defaultPrevented) App.minimizeApp()
    })
  } catch (e) {
    console.warn('terugknop niet geïnstalleerd:', e?.message || e)
  }
}
