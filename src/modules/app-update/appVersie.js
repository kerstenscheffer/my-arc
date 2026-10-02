// src/modules/app-update/appVersie.js
//
// Welke versie draait hier, en staat er een nieuwere in de winkel? En: mag
// deze versie nog gebruikt worden, of moet de klant eerst updaten?
//
// De versie van deze bundel komt uit de native projecten zelf: vite.config.js
// leest MARKETING_VERSION uit het Xcode-project en versionName uit
// build.gradle. Eén bron per platform, dus de app kan niet beweren 1.3 te zijn
// terwijl hij als 1.2 in de store staat.
//
// Nieuwste versie:
//   iOS      → aan Apple gevraagd (itunes lookup). Apple weet als enige wanneer
//              een versie echt te downloaden is; een build in review telt niet.
//   Android  → uit app_release.latest_version. Google heeft daar geen publieke
//              lijst voor, dus die zet de coach zelf (paneel "App-versies").
//
// Verplicht updaten: app_release.min_version per platform. Draait de klant
// iets ouders, dan blokkeert de app tot hij geüpdatet heeft.

import { Capacitor } from '@capacitor/core'

const IOS_VERSIE = typeof __APP_VERSIE__ === 'string' ? __APP_VERSIE__ : '0'
const ANDROID_VERSIE = typeof __APP_VERSIE_ANDROID__ === 'string' ? __APP_VERSIE_ANDROID__ : '0'

export const platform = () => (Capacitor.isNativePlatform() ? Capacitor.getPlatform() : 'web')
export const isNativeApp = () => Capacitor.isNativePlatform()
export const isIosApp = () => platform() === 'ios'

export const APP_VERSIE = platform() === 'android' ? ANDROID_VERSIE : IOS_VERSIE

export const APP_STORE_URL = 'https://apps.apple.com/nl/app/my-arc/id6764539959'
export const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.myarcfitness.app'
export const storeUrlVoor = (p) => (p === 'android' ? PLAY_STORE_URL : APP_STORE_URL)

const LOOKUP = 'https://itunes.apple.com/lookup?bundleId=com.myarcfitness.app&country=nl'
const CACHE_SLEUTEL = 'myarc_store_versie'
const CACHE_UREN = 6

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

// De rij uit app_release voor dit platform. Null als er niets staat of de
// database niet bereikbaar is; dan geen melding.
export async function haalRelease(supabase, p = platform()) {
  if (!supabase || p === 'web') return null
  const { data } = await supabase
    .from('app_release')
    .select('platform, latest_version, min_version, store_url, bericht')
    .eq('platform', p)
    .maybeSingle()
    .then(r => r, () => ({ data: null }))
  return data || null
}

/**
 * Wat moet de app doen met zijn versie?
 *   { verplicht: true,  nieuwe, storeUrl, bericht }  → blokkeren tot update
 *   { verplicht: false, nieuwe, storeUrl }            → zachte balk
 *   null                                              → niets te melden
 */
export async function beoordeelVersie(supabase) {
  const p = platform()
  if (p === 'web') return null
  const release = await haalRelease(supabase, p)
  const storeUrl = release?.store_url || storeUrlVoor(p)

  // Verplicht: onder de minimumversie.
  if (release?.min_version && nieuwerDan(release.min_version, APP_VERSIE)) {
    const nieuwe = release.latest_version && nieuwerDan(release.latest_version, release.min_version)
      ? release.latest_version : release.min_version
    return { verplicht: true, nieuwe, storeUrl, bericht: release.bericht || null }
  }

  // Zacht: er staat iets nieuwers klaar.
  let nieuwe = null
  if (p === 'ios') nieuwe = (await haalStoreVersie()) || release?.latest_version || null
  else nieuwe = release?.latest_version || null
  if (!nieuwe || !nieuwerDan(nieuwe, APP_VERSIE)) return null
  return { verplicht: false, nieuwe, storeUrl, bericht: null }
}
