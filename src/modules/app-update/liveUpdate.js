// src/modules/app-update/liveUpdate.js
//
// Live updates (15 okt 2026): nieuwe webcode bereikt de native app zonder
// App Store-release. Zelf gehost met @capgo/capacitor-updater in handmatige
// stand; er gaat niets naar Capgo.
//
// Zo werkt het:
//   1. Bij elke start meldt de app "ik draai goed" (notifyAppReady). Doet een
//      nieuwe bundel dat niet binnen 15 s (crasht hij bij het opstarten), dan
//      zet de plugin vanzelf de vorige terug.
//   2. De app kijkt in app_live_bundle naar de nieuwste actieve bundel. Is die
//      nieuwer dan de eigen code (__BUILD_TIJD__) en past de native schil
//      (min_native), dan downloadt hij hem op de achtergrond.
//   3. next(): de nieuwe code gaat pas aan als de klant de app wegklikt of
//      opnieuw opent. Nooit midden in het gebruik.
//
// Terugdraaien: in het coachpaneel (App-versies) een bundel uitzetten. Draait
// iemand die al, dan blijft hij tot er een nieuwere actieve bundel is; een
// echte noodrem is een nieuwe bundel met de goede code uploaden.
//
// Uploaden: `npm run live-update -- "korte notitie"`.

import { Capacitor } from '@capacitor/core'
import { nieuwerDan } from './appVersie'

const EIGEN = typeof __BUILD_TIJD__ === 'string' ? __BUILD_TIJD__ : '0'
const ELKE_MS = 10 * 60 * 1000

export async function startLiveUpdate(supabase) {
  if (!Capacitor.isNativePlatform() || !supabase) return
  let updater
  try {
    ;({ CapacitorUpdater: updater } = await import('@capgo/capacitor-updater'))
    await updater.notifyAppReady()
  } catch (e) {
    console.warn('Live update niet beschikbaar:', e?.message)
    return
  }

  let laatst = 0
  let bezig = false
  const kijk = async () => {
    if (bezig || Date.now() - laatst < ELKE_MS) return
    bezig = true
    laatst = Date.now()
    try {
      const { data: rij } = await supabase.from('app_live_bundle')
        .select('version, url, min_native')
        .eq('actief', true)
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle()
        .then(r => r, () => ({ data: null }))
      if (!rij || !(String(rij.version) > EIGEN)) return
      const { native } = await updater.current()
      if (rij.min_native && nieuwerDan(rij.min_native, native)) return
      const { bundles } = await updater.list()
      let bundel = (bundles || []).find(b => b.version === rij.version && b.status !== 'error')
      if (!bundel) bundel = await updater.download({ url: rij.url, version: rij.version })
      await updater.next({ id: bundel.id })
    } catch (e) {
      console.warn('Live update mislukt (volgende keer opnieuw):', e?.message)
    } finally {
      bezig = false
    }
  }

  kijk()
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') kijk()
  })
}
