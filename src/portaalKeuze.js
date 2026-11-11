// src/portaalKeuze.js
//
// Welk portaal krijgt een ingelogde gebruiker? Het coachportaal alleen als de
// server dat expliciet zegt. Op 3 nov 2026 kwam klant Martijn Kroes in CoachHub
// terecht: bij het opstarten bereikte de rolcheck de server niet, en "geen
// antwoord" werd "coach". Twijfel mag dus nooit coach opleveren.
//
//   rol         antwoord van get_my_portal_role, of null als dat niet lukte
//   klantLaatst stond deze telefoon de vorige keer op het klantportaal?
//               (zegt weinig: de login zet dit voor iedereen op true)
//   keuze       localStorage portalChoice (alleen bij dubbelrol)
//   bekend      laatste rol die de server voor dit toestel bevestigde
//               ('klant' | 'coach', localStorage ROL_SLEUTEL; 11 nov 2026)
//
// Uitkomst: 'coach' | 'klant' | 'onbekend' (nog een keer proberen).
export const ROL_SLEUTEL = 'myarc_portaal_rol'

export function kiesPortaal({ rol, klantLaatst = false, keuze = null, bekend = null }) {
  if (rol === 'coach') return 'coach'
  // Dubbelrol (alleen Marcel/Horstink, 11 nov 2026): coach, tenzij hij zelf klant koos.
  if (rol === 'both') return keuze === 'client' ? 'klant' : 'coach'
  // 'none': account zonder klant- of coachgegevens. Het klantportaal meldt dat netjes.
  if (rol === 'client' || rol === 'none') return 'klant'
  // Geen antwoord van de server. Bekende klant → klantportaal; bekende coach →
  // opnieuw proberen (nooit gokken op coach, en een coach hoort niet in het
  // klantportaal met "account niet gevonden").
  if (bekend === 'klant' || keuze === 'client') return 'klant'
  if (bekend === 'coach') return 'onbekend'
  return klantLaatst ? 'klant' : 'onbekend'
}

// Staat er een sessie op dit toestel? Dan is "geen gebruiker" na een herstart
// een verbindingsprobleem en geen uitlog: supabase-js haalt de sleutel zelf weg
// als de sessie echt ongeldig is.
export function heeftOpgeslagenSessie() {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (!k || !/^sb-.+-auth-token$/.test(k)) continue
      const s = JSON.parse(localStorage.getItem(k) || 'null')
      if (s?.refresh_token || s?.currentSession?.refresh_token) return true
    }
  } catch { /* geen opslag */ }
  return false
}
