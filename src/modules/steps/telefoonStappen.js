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

// Het aantal stappen van vandaag, of null als we het niet kunnen weten.
export async function stappenVanVandaag() {
  if (!(await heeftTelefoonBron())) return null
  const start = new Date(); start.setHours(0, 0, 0, 0)
  const eind = new Date()
  try {
    const res = await Health.queryAggregated({
      // iOS wil fractionele seconden in de datum; toISOString levert die.
      startDate: start.toISOString(),
      endDate: eind.toISOString(),
      dataType: 'steps',
      bucket: 'day',
    })
    const rijen = res?.aggregatedData || []
    if (!rijen.length) return 0
    // Eén emmer van één dag, maar over de dagrand (of bij tijdzonegedoe) kan
    // het er meer zijn; optellen is dan het juiste antwoord.
    const totaal = rijen.reduce((s, r) => s + (Number(r?.value) || 0), 0)
    return Math.round(totaal)
  } catch (e) {
    console.warn('Stappen lezen mislukt:', e?.message || e)
    return null
  }
}
