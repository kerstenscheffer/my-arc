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
//   3. Toepassen (set) alleen op een rustig moment: bij het opstarten van de
//      app, of als hij minstens 10 minuten op de achtergrond stond en er geen
//      training loopt. Nooit midden in het gebruik.
//
// Waarom geen next() meer (11 nov 2026): next() laat de plugin de nieuwe code
// laden zodra de app naar de achtergrond gaat, dus ook bij scherm op slot
// tussen twee sets. Joris (iOS) startte 18:26 een training, om 18:29 kwam de
// bundel binnen en 14 s later herlaadde de app op Home; Martijn Kroes (10 nov)
// idem. De stap 'klaar_bij_herstart' blijft gelogd (= gedownload, gaat aan bij
// de volgende start); 'toegepast' is nieuw.
//
// Terugdraaien: in het coachpaneel (App-versies) een bundel uitzetten. Draait
// iemand die al, dan blijft hij tot er een nieuwere actieve bundel is; een
// echte noodrem is een nieuwe bundel met de goede code uploaden.
//
// Uploaden: `npm run live-update -- "korte notitie"`.
//
// Checksum (31 okt 2026): de plugin (v8) downloadt alleen met de SHA-256 van
// de zip erbij, anders "Checksum required". Die ontbrak, dus geen enkele
// live-update kwam ooit aan; app 1.9 en ouder kunnen daarom pas live-updates
// krijgen na een winkelrelease met deze code. Bundels zonder checksum slaan we over.
//
// Diagnose (27 okt 2026, native 1.9): elke stap gaat naar app_live_update_log
// (welke bundel draait, en of de update stopt bij "geen nieuwe", "native te
// oud", downloaden of next). De live-bundels kwamen nooit aan en we konden
// niet zien waarom. Per start hooguit één rij per soort stap.

import { Capacitor } from '@capacitor/core'
import { nieuwerDan } from './appVersie'

const EIGEN = typeof __BUILD_TIJD__ === 'string' ? __BUILD_TIJD__ : '0'
const ELKE_MS = 10 * 60 * 1000
// Zo lang moet de app op de achtergrond staan voor we een klaarstaande
// bundel toepassen bij terugkomst.
const RUST_MS = 10 * 60 * 1000

// Loopt er een training? De trainingstimer (TodaysWorkoutMain) staat dan aan
// in localStorage onder pumpTimer:<client>:<datum>.
function trainingLoopt() {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (!k || !k.startsWith('pumpTimer:')) continue
      const t = JSON.parse(localStorage.getItem(k) || 'null')
      if (t?.running && t.startedAt && Date.now() - t.startedAt < 4 * 3600 * 1000) return true
    }
  } catch { /* geen opslag: dan niet blokkeren */ }
  return false
}

export async function startLiveUpdate(supabase) {
  if (!Capacitor.isNativePlatform() || !supabase) return
  let native = null
  const gelogd = new Set()
  const log = (stap, detail = null) => {
    if (gelogd.has(stap)) return Promise.resolve()
    gelogd.add(stap)
    return supabase.from('app_live_update_log').insert({
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

  // Een gedownloade bundel die nieuwer is dan de eigen code en nog actief
  // staat, nu laden. set() herlaadt de app meteen; daarna draait er niets meer.
  let toepassen = false
  const pasToe = async (reden) => {
    if (toepassen) return
    toepassen = true
    try {
      const { bundles } = await updater.list()
      const klaar = (bundles || [])
        .filter(b => b?.id && b.version && String(b.version) > EIGEN && (b.status === 'pending' || b.status === 'success'))
        .sort((a, b) => (String(a.version) < String(b.version) ? 1 : -1))
      if (!klaar.length) return
      // Uitgezet in het coachpaneel (terugdraaien)? Dan niet laden. Geen
      // antwoord (offline): ook niet, de volgende start probeert het opnieuw.
      const { data: actief } = await supabase.from('app_live_bundle')
        .select('version').eq('actief', true).in('version', klaar.map(b => String(b.version)))
        .then(r => r, () => ({ data: null }))
      const aan = new Set((actief || []).map(r => String(r.version)))
      const bundel = klaar.find(b => aan.has(String(b.version)))
      if (!bundel) return
      // Rem tegen een herlaad-lus: dezelfde versie hooguit eens per 30 min
      // proberen (zou set() niet aanslaan, dan start de oude code steeds opnieuw).
      const POGING = 'myarc_live_update_poging'
      try {
        const p = JSON.parse(localStorage.getItem(POGING) || 'null')
        if (p?.v === String(bundel.version) && Date.now() - p.t < 30 * 60 * 1000) { log('fout', `al geprobeerd ${bundel.version}`); return }
        localStorage.setItem(POGING, JSON.stringify({ v: String(bundel.version), t: Date.now() }))
      } catch { /* geen opslag */ }
      // Even wachten op de logregel: na set() draait er niets meer.
      await Promise.race([log('toegepast', `${bundel.version} ${reden}`), new Promise(r => setTimeout(r, 1500))])
      await updater.set({ id: bundel.id })
    } catch (e) {
      log('fout', `toepassen: ${e?.message || e}`)
    } finally {
      toepassen = false
    }
  }

  let laatst = 0
  let bezig = false
  const kijk = async () => {
    if (bezig || Date.now() - laatst < ELKE_MS) return
    bezig = true
    laatst = Date.now()
    try {
      const { data: rij } = await supabase.from('app_live_bundle')
        .select('version, url, min_native, checksum')
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
        if (!rij.checksum) { log('geen_checksum', rij.version); return }
        log('download', rij.version)
        bundel = await updater.download({ url: rij.url, version: rij.version, checksum: rij.checksum })
        log('download_ok', rij.version)
      }
      // Geen next(): die laadt de bundel bij elke keer naar de achtergrond
      // (ook scherm op slot). pasToe() doet het bij de volgende start of na
      // 10 min achtergrond.
      log('klaar_bij_herstart', rij.version)
    } catch (e) {
      console.warn('Live update mislukt (volgende keer opnieuw):', e?.message)
      log('fout', e?.message || e)
    } finally {
      bezig = false
    }
  }

  // Opstarten: niemand zit nog midden in iets, dus een klaarstaande bundel
  // mag nu. Anders kijken of er iets nieuws te downloaden is.
  await pasToe('start')
  kijk()

  // Voorgrond/achtergrond. appStateChange is op Android betrouwbaarder dan
  // visibilitychange; beide doen hetzelfde, dubbel tellen kan niet.
  let wegSinds = null
  const opAchtergrond = () => { if (wegSinds == null) wegSinds = Date.now() }
  const opVoorgrond = () => {
    if (wegSinds == null) return
    const weg = Date.now() - wegSinds
    wegSinds = null
    if (weg >= RUST_MS && !trainingLoopt()) pasToe('achtergrond').then(kijk)
    else kijk()
  }
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') opAchtergrond()
    else opVoorgrond()
  })
  try {
    const { App } = await import('@capacitor/app')
    App.addListener('appStateChange', ({ isActive }) => (isActive ? opVoorgrond() : opAchtergrond()))
  } catch { /* alleen visibilitychange */ }
}
