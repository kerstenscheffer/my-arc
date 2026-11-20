// src/startPagina.js
//
// Wat hoort er op '/'? Sinds 20 nov 2026 krijgt een bezoeker van de gewone
// website daar de homepage (pages/NieuwHome.jsx). De iOS/Android-app, de
// geïnstalleerde web-app, ingelogde gebruikers en alle app-links houden wat
// ze hadden: inlogscherm of portaal. Het inlogscherm zelf staat altijd op
// /client-login.
import { Capacitor } from '@capacitor/core'

export const INLOG_PAD = '/client-login'

function isNativeApp() {
  try { return Capacitor.isNativePlatform() } catch { return false }
}

// Op het beginscherm gezet (iOS: navigator.standalone, de rest: display-mode).
function isGeinstalleerdeWebApp() {
  try {
    return window.matchMedia?.('(display-mode: standalone)').matches === true || window.navigator.standalone === true
  } catch { return false }
}

export function isGewoneWebsite() {
  return !isNativeApp() && !isGeinstalleerdeWebApp()
}

// Parameters waarmee Supabase terugkomt na een maillink of inlog (wachtwoord
// herstellen, bevestigen, fout). In de hash staan ze ook, maar elke hash telt
// al als app-link: CoachHub-tabs en /#business-os:content=...
const AUTH_PARAMS = ['access_token', 'refresh_token', 'code', 'token', 'token_hash', 'type', 'error', 'error_code', 'error_description']

export function urlZonderHashEnAuth(loc = window.location) {
  try {
    if ((loc.hash || '').replace('#', '') !== '') return false
    const vraag = new URLSearchParams(loc.search || '')
    return !AUTH_PARAMS.some((p) => vraag.has(p))
  } catch { return false }
}

// Vastgelegd bij het inlezen van de app-code: supabase-js haalt de
// auth-parameters daarna zelf uit de adresbalk, en dan lijkt de URL schoon.
// Dit zegt alleen "mag hier een homepage"; of er iemand is ingelogd of een
// sessie op het toestel staat, bepaalt App.jsx na het laadscherm.
export const HOMEPAGE_BIJ_START = isGewoneWebsite() && urlZonderHashEnAuth()

// Waar "naar inloggen" heen gaat (uitloggen, account verwijderd, wachtwoord
// hersteld). Op de website /client-login, anders komt een klant op de
// verkooppagina uit. In de app en de geïnstalleerde web-app blijft dat '/',
// precies zoals het was.
export function inlogPad() {
  return isGewoneWebsite() ? INLOG_PAD : '/'
}
