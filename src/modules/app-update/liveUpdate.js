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
//
// Diagnose (27 okt 2026, native 1.9): elke stap gaat naar app_live_update_log
// (welke bundel draait, en of de update stopt bij "geen nieuwe", "native te
// oud", downloaden of next). De live-bundels kwamen nooit aan en we konden
// niet zien waarom. Per start hooguit één rij per soort stap.

import { Capacitor } from '@capacitor/core'
import { nieuwerDan } from './appVersie'

const EIGEN = typeof __BUILD_TIJD__ === 'string' ? __BUILD_TIJD__ : '0'
const ELKE_MS = 10 * 60 * 1000

export async function startLiveUpdate(supabase) {
  if (!Capacitor.isNativePlatform() || !supabase) return
  let native = null
  const gelogd = new Set()
  const log = (stap, detail = null) => {
    if (gelogd.has(stap)) return
    gelogd.add(stap)
    supabase.from('app_live_update_log').insert({
      platform: Capacitor.getPlatform(), native_versie: native, bundel: EIGEN,
      stap, detail: detail == null ? null : String(detail).slice(0, 500),
    }).then(r => r, () => {})
  }

  let updater
  try {
    ;({ CapacitorUpdater: updater } = await import('@capgo/capacitor-updater'))
    await updater.notifyAppReady()
    try { native = (await updater.current())?.native || null } catch { /* alleen voor de log */ }
    log('start')
  } catch (e) {
    console.warn('Live update niet beschikbaar:', e?.message)
    log('geen_updater', e?.message)
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
      if (!rij) { log('geen_rij'); return }
      if (!(String(rij.version) > EIGEN)) { log('al_nieuwste', rij.version); return }
      const { native: nu } = await updater.current()
      native = nu || native
      if (rij.min_native && nieuwerDan(rij.min_native, native)) { log('native_te_oud', `${native} < ${rij.min_native}`); return }
      const { bundles } = await updater.list()
      let bundel = (bundles || []).find(b => b.version === rij.version && b.status !== 'error')
      if (!bundel) {
        log('download', rij.version)
        bundel = await updater.download({ url: rij.url, version: rij.version })
        log('download_ok', rij.version)
      }
      await updater.next({ id: bundel.id })
      log('klaar_bij_herstart', rij.version)
    } catch (e) {
      console.warn('Live update mislukt (volgende keer opnieuw):', e?.message)
      log('fout', e?.message || e)
    } finally {
      bezig = false
    }
  }

  kijk()
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') kijk()
  })
}
