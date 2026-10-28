// src/modules/steps/telefoonStappen.js
//
// Stappen uit Apple Health (iOS) of Health Connect (Android), via
// capacitor-health.
//
// Twee dingen die dit bestand bewust regelt:
//
// 1. De vraag komt bij het openen van de app, één keer. HealthKit toont zijn
//    scherm alleen de eerste keer dat je om een gegevenssoort vraagt; daarna
//    keert requestHealthPermissions meteen terug zonder iets te tonen. We
//    houden zelf bij dat we het gevraagd hebben, zodat een 'nee' ook een nee
//    blijft en we niet elke sessie opnieuw beginnen. Wie toen nee zei kan het
//    later alsnog aanzetten met de knop in de stappen-modal.
// 2. HealthKit vertelt niet of je leesrechten hebt — dat is zelf privacygevoelig
//    ("deze app weet dat je geen hartslag deelt"). checkHealthPermissions geeft
//    op iOS dus niets bruikbaars terug. We onthouden de koppeling daarom zelf in
//    localStorage en lezen gewoon: geen toestemming = nul stappen, en dan blijft
//    staan wat de klant zelf invulde.
//
// Nog te doen buiten de code om (eenmalig, in Xcode):
//   · HealthKit-capability aanzetten op de App-target — en HealthKit aanvinken
//     voor de App ID in het Apple Developer-portaal, anders faalt het signen.
//   · testen op een écht toestel; de simulator heeft geen stappen.
// De twee Info.plist-teksten staan er al in.

import { Health } from 'capacitor-health'

const ONTHOUD_SLEUTEL = 'myarc_stappen_health_gekoppeld'
const GEVRAAGD_SLEUTEL = 'myarc_stappen_health_gevraagd'

// Draaien we in de app-schil of in een browser?
export const isNative = () => {
  try {
    return !!window?.Capacitor?.isNativePlatform?.()
  } catch {
    return false
  }
}

// Is er een health-bron op dit toestel? Op Android is dit false als Health
// Connect niet geïnstalleerd is.
export async function heeftTelefoonBron() {
  if (!isNative()) return false
  try {
    const { available } = await Health.isHealthAvailable()
    return !!available
  } catch (e) {
    console.warn('Health niet beschikbaar:', e?.message || e)
    return false
  }
}

// Heeft de klant de koppeling eerder aangezet? Zie de uitleg hierboven: dit is
// onze eigen administratie, niet die van HealthKit.
export const isGekoppeld = () => {
  try {
    return localStorage.getItem(ONTHOUD_SLEUTEL) === 'ja'
  } catch {
    return false
  }
}

const onthoud = (ja) => {
  try {
    if (ja) localStorage.setItem(ONTHOUD_SLEUTEL, 'ja')
    else localStorage.removeItem(ONTHOUD_SLEUTEL)
  } catch { /* private mode: dan vraagt hij het de volgende keer opnieuw */ }
}

// De koppeling aanzetten. Geeft het aantal stappen van vandaag terug als het
// lukte, en null als er geen bron is of de klant nee zegt.
export async function koppel() {
  if (!(await heeftTelefoonBron())) return null
  try {
    await Health.requestHealthPermissions({ permissions: ['READ_STEPS'] })
  } catch (e) {
    console.warn('Toestemming voor stappen geweigerd:', e?.message || e)
    return null
  }
  // Of de klant ja zei weten we niet zeker (zie boven), dus we proberen te
  // lezen. Komt daar een getal uit, dan staat de koppeling.
  const n = await stappenVanVandaag()
  onthoud(n != null)
  return n
}

export const ontkoppel = () => onthoud(false)

// Hebben we het ooit gevraagd? Zonder dit zou een klant die nee zei bij elke
// start opnieuw een (lege) ronde langs HealthKit maken.
const alGevraagd = () => {
  try { return localStorage.getItem(GEVRAAGD_SLEUTEL) === 'ja' } catch { return false }
}
const noteerGevraagd = () => {
  try { localStorage.setItem(GEVRAAGD_SLEUTEL, 'ja') } catch { /* private mode */ }
}

// Bij het openen van de app: de eerste keer vraagt dit toestemming, daarna
// leest het alleen nog. Geeft het aantal stappen van vandaag terug, of null.
export async function stappenBijOpstart() {
  if (!(await heeftTelefoonBron())) return null
  if (!alGevraagd()) {
    noteerGevraagd()
    return koppel()
  }
  if (!isGekoppeld()) return null
  return stappenVanVandaag()
}

// ── Dubbeltelling op Android ──
//
// Health Connect telt de stappen van álle apps die erin schrijven bij elkaar
// en ontdubbelt alleen waar die elkaar in de tijd overlappen. Schrijven
// Samsung Health (horloge + telefoon) en bijv. Google Fit allebei stappen, dan
// komt het totaal ruim hoger uit dan wat de klant in Samsung Health ziet
// (Elijah, 27 okt 2026: 24.804 bij ons, ±15.000 in Samsung Health). De plugin
// waarschuwt hier zelf voor bij queryRecords.
//
// Daarom op Android: per app uitlezen en één bron aanhouden. Samsung Health
// als die er is (dat is wat de klant zelf bekijkt), anders de app met de
// meeste stappen. Nooit optellen.
const SAMSUNG_HEALTH = 'com.sec.android.app.shealth'
const p2 = (n) => String(n).padStart(2, '0')
const isoVan = (ruw) => {
  const d = ruw ? new Date(ruw) : null
  if (!d || isNaN(d.getTime())) return null
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`
}

// Emmers van queryAggregated optellen per kalenderdag. De plugin geeft per
// emmer een begin-datum; die kan als string of als tijdstempel binnenkomen.
const perKalenderdag = (rijen) => {
  const perDag = new Map()
  ;(rijen || []).forEach(r => {
    const iso = isoVan(r?.startDate || r?.date || r?.start || null)
    if (!iso) return
    perDag.set(iso, (perDag.get(iso) || 0) + (Number(r?.value) || 0))
  })
  return perDag
}

// { iso: { pakket: stappen } } voor elke app die stappen schreef, of null
// als het niet nodig is (één bron, iOS) of niet lukt (oude app zonder
// queryRecords). Null = gewoon het totaal gebruiken zoals voorheen.
async function stappenPerApp(startIso, eindIso) {
  if (platform() !== 'android') return null
  try {
    const { records } = await Health.queryRecords({ startDate: startIso, endDate: eindIso, dataType: 'steps' })
    const apps = [...new Set((records || []).map(r => r?.sourceBundleId).filter(Boolean))]
    if (apps.length < 2) return null
    const uit = {}
    for (const app of apps) {
      const res = await Health.queryAggregated({
        startDate: startIso, endDate: eindIso, dataType: 'steps', bucket: 'day', dataOrigins: [app],
      })
      perKalenderdag(res?.aggregatedData).forEach((n, iso) => {
        if (!uit[iso]) uit[iso] = {}
        uit[iso][app] = Math.round(n)
      })
    }
    return uit
  } catch (e) {
    console.warn('Stappen per app lezen mislukt, totaal gebruikt:', e?.message || e)
    return null
  }
}

// Eén getal uit de stappen per app: Samsung Health als die iets heeft, anders
// de app met de meeste.
const kiesBron = (perApp) => {
  if (perApp?.[SAMSUNG_HEALTH] > 0) return perApp[SAMSUNG_HEALTH]
  const waarden = Object.values(perApp || {}).filter(n => n > 0)
  return waarden.length ? Math.max(...waarden) : null
}

// De laatste n dagen als lijst van { iso, steps, bronnen }, oudste eerst.
// Null als we het niet kunnen weten. `bronnen` is alleen gevuld op Android
// met meer dan één app: { per_app, totaal_health_connect } — zo is achteraf
// te zien waarom ons getal afwijkt van het opgetelde totaal.
//
// Waarom dit er is: de app las alleen vandaag. Opende een klant de app twee
// dagen niet, dan stonden die dagen bij de coach op nul terwijl zijn telefoon
// ze gewoon had — ze werden nooit meer opgehaald. HealthKit bewaart die
// historie wel, dus halen we bij het opstarten een week terug op.
export async function stappenPerDag(dagenTerug = 7) {
  if (!(await heeftTelefoonBron())) return null
  const start = new Date()
  start.setDate(start.getDate() - (dagenTerug - 1))
  start.setHours(0, 0, 0, 0)
  const eind = new Date()
  try {
    const res = await Health.queryAggregated({
      startDate: start.toISOString(),
      endDate: eind.toISOString(),
      dataType: 'steps',
      bucket: 'day',
    })
    const totaal = perKalenderdag(res?.aggregatedData)
    const perApp = await stappenPerApp(start.toISOString(), eind.toISOString())
    const dagen = new Set([...totaal.keys(), ...Object.keys(perApp || {})])
    return [...dagen]
      .map(iso => {
        const som = Math.round(totaal.get(iso) || 0)
        const gekozen = perApp?.[iso] ? kiesBron(perApp[iso]) : null
        return {
          iso,
          steps: gekozen ?? som,
          bronnen: perApp?.[iso] ? { per_app: perApp[iso], totaal_health_connect: som } : null,
        }
      })
      .sort((a, b) => a.iso.localeCompare(b.iso))
  } catch (e) {
    console.warn('Stappen-historie lezen mislukt:', e?.message || e)
    return null
  }
}

// Vandaag als { steps, bronnen }, of null als we het niet kunnen weten. De
// bronnen van de laatste lezing blijven bewaard voor stappenSync, dat alleen
// het getal terugkrijgt.
let bronnenVandaag = null
export const laatsteBronnenVandaag = () => bronnenVandaag

export async function vandaagMetBronnen() {
  const dagen = await stappenPerDag(1)
  if (dagen == null) return null
  const vandaag = isoVan(new Date())
  const rij = dagen.find(d => d.iso === vandaag)
  bronnenVandaag = rij?.bronnen || null
  return rij ? { steps: rij.steps, bronnen: rij.bronnen } : { steps: 0, bronnen: null }
}

// Het aantal stappen van vandaag, of null als we het niet kunnen weten.
export async function stappenVanVandaag() {
  const v = await vandaagMetBronnen()
  return v == null ? null : v.steps
}

// ── Waarom komen er wel of geen stappen binnen? ──
//
// De coach ziet bij een klant zonder stappen anders alleen een lege balk, en
// weet niet of de klant nee zei, de app in de browser gebruikt, of een oude
// app heeft zonder stappenkoppeling. De app meldt het daarom zelf (zie
// meldStappenStatus in stappenSync.js).
//
//   web       — geopend in de browser, daar is geen Health
//   oude_app  — native app van vóór de Health-plugin; live updates brengen
//               geen native code mee, alleen een store-update helpt
//   geen_bron — Android zonder Health Connect
//   geweigerd — toestemming gevraagd, geen koppeling
//   geen_data — gekoppeld maar een hele week nul stappen; op iOS is dat
//               meestal een stille weigering (HealthKit zegt het niet)
//   gekoppeld — er komen stappen binnen
export const platform = () => {
  try { return window?.Capacitor?.getPlatform?.() || 'web' } catch { return 'web' }
}

export async function stappenStatus() {
  if (!isNative()) return 'web'
  try {
    const { available } = await Health.isHealthAvailable()
    if (!available) return 'geen_bron'
  } catch (e) {
    const tekst = String(e?.message || e || '').toLowerCase()
    return tekst.includes('not implemented') || tekst.includes('unimplemented') ? 'oude_app' : 'geen_bron'
  }
  if (!isGekoppeld()) return 'geweigerd'
  const dagen = await stappenPerDag(7)
  if (dagen == null) return 'geweigerd'
  return dagen.some(d => d.steps > 0) ? 'gekoppeld' : 'geen_data'
}

// Opnieuw vragen, ook als we het eerder al eens vroegen. Op Android verschijnt
// het toestemmingsscherm dan opnieuw; iOS toont het maar één keer per app en
// geeft daarna stil terug, dan helpt alleen de instellingen openen.
export async function vraagOpnieuw() {
  try { localStorage.removeItem(GEVRAAGD_SLEUTEL) } catch { /* private mode */ }
  noteerGevraagd()
  return koppel()
}

// De plek waar de klant het zelf aan kan zetten.
export async function openStappenInstellingen() {
  try {
    if (platform() === 'ios') await Health.openAppleHealthSettings()
    else await Health.openHealthConnectSettings()
    return true
  } catch (e) {
    console.warn('Instellingen openen mislukt:', e?.message || e)
    return false
  }
}
