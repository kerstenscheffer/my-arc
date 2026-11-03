// src/portaalKeuze.js
//
// Welk portaal krijgt een ingelogde gebruiker? Het coachportaal alleen als de
// server dat expliciet zegt. Op 3 nov 2026 kwam klant Martijn Kroes in CoachHub
// terecht: bij het opstarten bereikte de rolcheck de server niet, en "geen
// antwoord" werd "coach". Twijfel mag dus nooit coach opleveren.
//
//   rol        antwoord van get_my_portal_role, of null als dat niet lukte
//   klantLaatst stond deze telefoon de vorige keer op het klantportaal?
//   keuze      localStorage portalChoice (alleen bij dubbelrol)
//
// Uitkomst: 'coach' | 'klant' | 'onbekend' (nog een keer proberen).
export function kiesPortaal({ rol, klantLaatst = false, keuze = null }) {
  if (rol === 'coach') return 'coach'
  if (rol === 'both') return keuze === 'client' ? 'klant' : 'coach'
  // 'none': account zonder klant- of coachgegevens. Het klantportaal meldt dat netjes.
  if (rol === 'client' || rol === 'none') return 'klant'
  return klantLaatst ? 'klant' : 'onbekend'
}
