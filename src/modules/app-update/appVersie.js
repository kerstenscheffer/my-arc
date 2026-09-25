// src/modules/app-update/appVersie.js
//
// Welke versie draait hier, en staat er een nieuwere in de App Store?
//
// De versie van deze bundel komt uit het Xcode-project zelf: vite.config.js
// leest MARKETING_VERSION uit project.pbxproj bij het bouwen. Eén bron, dus de
// app kan niet beweren 1.3 te zijn terwijl hij als 1.2 in de store staat.
//
// De nieuwste versie vragen we aan Apple. Dat is met opzet geen waarde in onze
// eigen database: dan zou er een updatemelding kunnen staan voor een build die
// nog in review ligt en die niemand kan installeren. Apple weet als enige
// wanneer een versie echt beschikbaar is — en jij hoeft niets bij te werken.

import { Capacitor } from '@capacitor/core'

export const APP_VERSIE = typeof __APP_VERSIE__ === 'string' ? __APP_VERSIE__ : '0'

export const APP_STORE_URL = 'https://apps.apple.com/nl/app/my-arc/id6764539959'

const LOOKUP = 'https://itunes.apple.com/lookup?bundleId=com.myarcfitness.app&country=nl'
const CACHE_SLEUTEL = 'myarc_store_versie'
const CACHE_UREN = 6

// Alleen iOS: de Play Store heeft geen publieke lijst met versienummers, dus
// daar zou deze balk niets te melden hebben.
export const isIosApp = () =>
  Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios'

// "1.10" is nieuwer dan "1.9" — per getal vergelijken, niet als tekst.
export function nieuwerDan(a, b) {
  const va = String(a || '0').split('.').map(n => parseInt(n, 10) || 0)
  const vb = String(b || '0').split('.').map(n => parseInt(n, 10) || 0)
  for (let i = 0; i < Math.max(va.length, vb.length); i++) {
    const x = va[i] || 0
    const y = vb[i] || 0
    if (x !== y) return x > y
  }
  return false
}

export async function haalStoreVersie() {
  try {
    const rauw = localStorage.getItem(CACHE_SLEUTEL)
    if (rauw) {
      const c = JSON.parse(rauw)
      if (c?.versie && Date.now() - c.tijd < CACHE_UREN * 3600e3) return c.versie
    }
  } catch { /* geen cache beschikbaar is geen probleem */ }

  try {
    // ?t= omzeilt Apple's CDN-cache, die een verse release soms een tijd lang
    // nog niet terugmeldt.
    const res = await fetch(`${LOOKUP}&t=${Date.now()}`)
    const json = await res.json()
    const versie = json?.results?.[0]?.version
    if (!versie) return null
    try {
      localStorage.setItem(CACHE_SLEUTEL, JSON.stringify({ versie, tijd: Date.now() }))
    } catch { /* private mode: dan vragen we het gewoon opnieuw */ }
    return versie
  } catch {
    return null   // geen internet, geen melding
  }
}
