// src/modules/steps/telefoonStappen.js
//
// De stappen van de telefoon zelf ophalen — als dat kan.
//
// Vandaag kan het niet: er zit geen health-plugin in de app. Dit bestand is de
// plek waar die straks landt, zodat de rest van de stappenteller nu al werkt en
// er later niets aan de UI hoeft te veranderen: is er een bron, dan vult hij de
// dag automatisch; is die er niet, dan tikt de klant zijn stand zelf in.
//
// Wat er nog moet gebeuren voor automatisch tellen op iOS:
//   1. een health-plugin installeren (HealthKit) en `npx cap sync ios`
//   2. in Xcode de HealthKit-capability aanzetten voor de App-target
//   3. NSHealthShareUsageDescription in Info.plist ("om je stappen te tonen…")
//   4. testen op een écht toestel — de simulator heeft geen stappen
// Android leest hetzelfde via Health Connect.
//
// Zolang stap 1 niet gebeurd is, geeft alles hier netjes null terug.

// Draaien we in de app-schil of in een browser?
export const isNative = () => {
  try {
    return !!window?.Capacitor?.isNativePlatform?.()
  } catch {
    return false
  }
}

// De plugin-namen waar de bekende health-plugins zich onder registreren. We
// zoeken op naam in plaats van te importeren, zodat een ontbrekende plugin geen
// build-fout is maar gewoon "geen bron".
const KANDIDATEN = ['Health', 'HealthKit', 'CapacitorHealthkit', 'HealthConnect']

const plugin = () => {
  if (!isNative()) return null
  const p = window?.Capacitor?.Plugins || {}
  for (const naam of KANDIDATEN) {
    if (p[naam]) return { naam, api: p[naam] }
  }
  return null
}

export const heeftTelefoonBron = () => !!plugin()

// Toestemming vragen. Geeft false als er geen bron is, of als de klant nee zegt.
export async function vraagToestemming() {
  const p = plugin()
  if (!p) return false
  try {
    const fn = p.api.requestAuthorization || p.api.requestPermissions || p.api.requestHealthPermissions
    if (!fn) return false
    await fn.call(p.api, { read: ['steps'], all: [], write: [] })
    return true
  } catch (e) {
    console.warn('Stappen-toestemming geweigerd of niet beschikbaar:', e?.message || e)
    return false
  }
}

// Het aantal stappen van vandaag, of null als we het niet kunnen weten.
// De plugins verschillen in hun antwoordvorm; we pakken het eerste getal dat
// een dagtotaal kan zijn en rekenen nergens op.
export async function stappenVanVandaag() {
  const p = plugin()
  if (!p) return null
  const start = new Date(); start.setHours(0, 0, 0, 0)
  const eind = new Date()
  try {
    const fn = p.api.queryAggregated || p.api.querySampleType || p.api.queryHKitSampleType || p.api.query
    if (!fn) return null
    const res = await fn.call(p.api, {
      startDate: start.toISOString(),
      endDate: eind.toISOString(),
      dataType: 'steps',
      sampleName: 'stepCount',
      bucket: 'day',
      limit: 0,
    })
    const getal = pakGetal(res)
    return Number.isFinite(getal) ? Math.round(getal) : null
  } catch (e) {
    console.warn('Stappen van de telefoon lezen mislukt:', e?.message || e)
    return null
  }
}

// Zoekt in het antwoord naar het dagtotaal. Bewust ruim: de ene plugin geeft
// { value }, de andere { resultData: [{ value }] } of een lijst samples.
function pakGetal(res) {
  if (res == null) return NaN
  if (typeof res === 'number') return res
  if (Array.isArray(res)) return res.reduce((s, r) => s + (Number(r?.value ?? r?.count ?? 0) || 0), 0)
  if (typeof res === 'object') {
    if (Number.isFinite(Number(res.value))) return Number(res.value)
    for (const sleutel of ['resultData', 'data', 'samples', 'result']) {
      if (res[sleutel] != null) return pakGetal(res[sleutel])
    }
  }
  return NaN
}
