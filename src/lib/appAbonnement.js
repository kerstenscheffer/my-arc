// src/lib/appAbonnement.js
//
// App-abonnement via RevenueCat (App Store, later Google Play). 24 nov 2026.
//
// Regels (Kersten, 20 nov 2026):
//   - Alleen in de native app. Op het web bestaat geen betaalmuur.
//   - Bij twijfel binnen: een fout in deze code mag een klant nooit buitensluiten.
//   - RevenueCat kent de gebruiker onder zijn Supabase auth-id, zodat de webhook
//     (supabase/functions/revenuecat-webhook) de koop aan het juiste account hangt.
//
// De sleutel hieronder is de PUBLIEKE SDK-sleutel van RevenueCat; die hoort in de
// app. Geheime sleutels nooit in code.

import { Capacitor } from '@capacitor/core'

const SLEUTEL_IOS = 'appl_SYxWUmjyiYLUoZwLOExEGIrTmty'
const SLEUTEL_ANDROID = 'goog_zMtmOyAtyFhkyXKnSqffCssvlpm'
export const TOEGANG = 'premium'

const OP_ANDROID = Capacitor.getPlatform() === 'android'
export const VOORWAARDEN_URL = OP_ANDROID
  ? 'https://play.google.com/about/play-terms/'
  : 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/'
// Waar je opzegt, voor de tekst onder de knop op de betaalmuur.
export const OPZEG_PLEK = OP_ANDROID ? 'Google Play' : 'je Apple ID'
export const PRIVACY_URL = 'https://www.myarcfitness.com/privacy'

let klaar = null // Promise<Purchases|null>
let ingelogdAls = null

const sleutel = () => {
  const p = Capacitor.getPlatform()
  if (p === 'ios') return SLEUTEL_IOS
  if (p === 'android') return SLEUTEL_ANDROID
  return ''
}

/** Kan dit apparaat een abonnement afsluiten?
 *  Ook de native plugin moet er zijn: oudere app-versies (iOS 2.0, Android
 *  versionCode 8 en eerder) krijgen deze code via de live-update, maar hebben
 *  RevenueCat niet in de app zitten. Zonder deze check zagen zij "Maak je plan"
 *  en een betaalmuur waar niets te kopen viel (25 nov 2026). */
export const abonnementMogelijk = () =>
  Capacitor.isNativePlatform() && !!sleutel() && Capacitor.isPluginAvailable('Purchases')

/** RevenueCat klaarzetten voor dit account. Geeft null als het niet kan. */
export async function startRevenueCat(authUserId) {
  if (!abonnementMogelijk() || !authUserId) return null
  if (!klaar) {
    klaar = import('@revenuecat/purchases-capacitor')
      .then(async ({ Purchases }) => {
        await Purchases.configure({ apiKey: sleutel(), appUserID: authUserId })
        ingelogdAls = authUserId
        return Purchases
      })
      .catch(e => { console.warn('RevenueCat starten mislukt', e?.message); klaar = null; return null })
  }
  const Purchases = await klaar
  if (Purchases && ingelogdAls !== authUserId) {
    try { await Purchases.logIn({ appUserID: authUserId }); ingelogdAls = authUserId }
    catch (e) { console.warn('RevenueCat logIn mislukt', e?.message); return null }
  }
  return Purchases
}

const heeftToegang = (customerInfo) => !!customerInfo?.entitlements?.active?.[TOEGANG]

/** Heeft dit account volgens de store een lopend abonnement? null = onbekend. */
export async function storeToegang(authUserId) {
  const Purchases = await startRevenueCat(authUserId)
  if (!Purchases) return null
  try {
    const { customerInfo } = await Purchases.getCustomerInfo()
    return heeftToegang(customerInfo)
  } catch { return null }
}

const maandenVan = (pkg) => {
  const p = pkg?.product?.subscriptionPeriod || ''
  if (p === 'P1Y' || pkg?.packageType === 'ANNUAL') return 12
  if (p === 'P1M' || pkg?.packageType === 'MONTHLY') return 1
  const m = p.match(/^P(\d+)M$/)
  return m ? Number(m[1]) : null
}

/** Het aanbod uit RevenueCat, klaar voor het scherm. */
export async function haalAanbod(authUserId) {
  const Purchases = await startRevenueCat(authUserId)
  if (!Purchases) return []
  const offerings = await Purchases.getOfferings()
  const pakketten = offerings?.current?.availablePackages || []
  let proefKan = {}
  try {
    const ids = pakketten.map(p => p.product.identifier)
    const r = await Purchases.checkTrialOrIntroductoryPriceEligibility({ productIdentifiers: ids })
    // 1 = komt niet in aanmerking; alle andere standen tonen we de proef (Apple toont de echte voorwaarden).
    for (const id of ids) proefKan[id] = r?.[id]?.status !== 1
  } catch { proefKan = {} }
  return pakketten
    .map(pkg => {
      const intro = pkg.product.introPrice
      const proef = !!intro && Number(intro.price) === 0 && proefKan[pkg.product.identifier] !== false
      const maanden = maandenVan(pkg)
      return {
        id: pkg.identifier,
        pkg,
        maanden,
        prijs: pkg.product.priceString,
        prijsGetal: Number(pkg.product.price),
        perMaand: pkg.product.pricePerMonthString || null,
        valuta: pkg.product.currencyCode,
        proef,
        proefDuur: proef ? (intro.periodUnit === 'MONTH' && intro.periodNumberOfUnits === 1 ? '1 maand' : `${intro.periodNumberOfUnits} ${intro.periodUnit === 'DAY' ? 'dagen' : intro.periodUnit === 'WEEK' ? 'weken' : 'maanden'}`) : null,
      }
    })
    .sort((a, b) => (b.maanden || 0) - (a.maanden || 0))
}

/** Koop een pakket. Geeft { ok, geannuleerd, fout }. */
export async function koop(authUserId, pkg) {
  const Purchases = await startRevenueCat(authUserId)
  if (!Purchases) return { ok: false, fout: 'Kopen lukt niet op dit apparaat.' }
  try {
    const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg })
    return heeftToegang(customerInfo) ? { ok: true } : { ok: false, fout: 'Dat lukte niet. Tik op Herstel aankopen.' }
  } catch (e) {
    if (e?.userCancelled || e?.code === '1' || e?.code === 1) return { ok: false, geannuleerd: true }
    return { ok: false, fout: e?.message || 'Dat lukte niet. Probeer het nog eens.' }
  }
}

/** Eerdere aankopen terughalen (verplicht voor Apple). */
export async function herstel(authUserId) {
  const Purchases = await startRevenueCat(authUserId)
  if (!Purchases) return { ok: false, fout: 'Herstellen lukt niet op dit apparaat.' }
  try {
    const { customerInfo } = await Purchases.restorePurchases()
    return heeftToegang(customerInfo) ? { ok: true } : { ok: false, fout: 'Geen abonnement gevonden.' }
  } catch (e) {
    return { ok: false, fout: e?.message || 'Herstellen mislukt.' }
  }
}

/**
 * Mag dit account de app in? Combineert de database (mijn_app_toegang) met de
 * store. Bij twijfel binnen.
 *   { toegang: true|false, reden, proefGebruikt }
 */
export async function bepaalAppToegang(supabase, authUserId) {
  const { data, error } = await supabase.rpc('mijn_app_toegang').then(r => r, e => ({ data: null, error: e }))
  if (error || !data || typeof data !== 'object') return { toegang: true, reden: 'onbekend' }
  if (data.toegang) return { toegang: true, reden: data.reden }
  // Database zegt nee: misschien is de webhook nog niet binnen. Vraag de store.
  const store = await storeToegang(authUserId)
  if (store) return { toegang: true, reden: 'abonnement_store' }
  return { toegang: false, reden: data.reden, proefGebruikt: !!data.proef_gebruikt }
}
