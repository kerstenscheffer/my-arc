// src/modules/workout/utils/rustWaarschuwing.js
//
// Waarschuwing als dezelfde spiergroep te dicht op elkaar getraind wordt. Twee
// keer borst op maandag en dinsdag geeft die spieren geen 24 uur herstel; dat
// hoort de weekplanner te laten zien op het moment dat je schuift.
//
// Waarom op spiergroep en niet op de workout: in de echte schema's heet de
// tweede push-dag "Push (Copy)" en heeft die een eigen sleutel (dag5 naast
// dag1). Op naam of sleutel vergelijken ziet dat niet als dezelfde training,
// terwijl het dezelfde borst- en triceps-oefeningen zijn.
//
// De week herhaalt zich, dus zondag en de maandag erna liggen ook naast
// elkaar. Daarom rekenen we rond: het gat tussen de laatste en de eerste dag
// telt mee.
//
//   1 dag ertussen (24 uur)   → rood
//   2 dagen ertussen (48 uur) → oranje
//   meer                      → niets

export const ROOD = 'rood'
export const ORANJE = 'oranje'

// Zelfde vertaling als de koppen in de oefeningenlijst, zodat een klant
// dezelfde woorden ziet. In de schema's staat het veld bijna altijd in het
// Engels, met een restje Nederlands.
const GROEP_NAMEN = {
  borst: 'Chest', rug: 'Back', benen: 'Legs', been: 'Legs',
  schouders: 'Shoulders', schouder: 'Shoulders', buik: 'Abs',
  bicep: 'Biceps', tricep: 'Triceps', billen: 'Glutes', kuiten: 'Calves',
}

export const groepNaam = (ruw) => {
  const v = String(ruw || '').trim()
  if (!v) return ''
  const klein = v.toLowerCase()
  return GROEP_NAMEN[klein] || klein.charAt(0).toUpperCase() + klein.slice(1)
}

// De spiergroepen waar een dag écht om draait. Eén losse triceps-oefening op
// een rugdag maakt het geen tricepsdag; vanaf twee oefeningen telt een groep
// mee. Haalt niets die drempel (korte dag), dan telt de grootste groep.
export function focusGroepen(dagData) {
  const tel = {}
  const oefeningen = Array.isArray(dagData?.exercises) ? dagData.exercises : []
  oefeningen.forEach(ex => {
    if (ex?.type === 'cardio') return
    const g = groepNaam(ex?.primairSpieren || ex?.muscleGroup)
    if (!g) return
    tel[g] = (tel[g] || 0) + 1
  })

  const paren = Object.entries(tel)
  if (paren.length === 0) {
    // Geen oefeningen bekend (activiteit of custom workout): val terug op de
    // naam, dan wordt twee keer "Zwemmen" achter elkaar nog steeds gezien.
    const naam = groepNaam(dagData?.name || dagData?.focus)
    return naam ? [naam] : []
  }

  const boven = paren.filter(([, n]) => n >= 2).map(([g]) => g)
  if (boven.length > 0) return boven
  const max = Math.max(...paren.map(([, n]) => n))
  return paren.filter(([, n]) => n === max).map(([g]) => g)
}

// Kleinste afstand in dagen tussen twee dagen in een week die zich herhaalt.
// Eén voorkomen → null (niets om te vergelijken).
export function kleinsteGat(indexen) {
  const lijst = [...new Set(indexen)].sort((a, b) => a - b)
  if (lijst.length < 2) return null
  let kleinste = Infinity
  for (let i = 1; i < lijst.length; i++) {
    kleinste = Math.min(kleinste, lijst[i] - lijst[i - 1])
  }
  // Rond de week heen: van de laatste dag naar de eerste van de week erna.
  return Math.min(kleinste, (lijst[0] + 7) - lijst[lijst.length - 1])
}

// schedule: { Monday: 'dag1', ... }, weekDays bepaalt de volgorde,
// dagDataVan: (workoutKey) => het dag-object met exercises.
//
// Terug: { perDag: {0:'rood'}, meldingen: [{ niveau, groepen: [...], gat }] }
export function rustWaarschuwingen(schedule, weekDays, dagDataVan = () => null) {
  const perGroep = {}
  weekDays.forEach((dag, i) => {
    const key = schedule?.[dag]
    if (!key) return
    focusGroepen(dagDataVan(key)).forEach(groep => {
      if (!perGroep[groep]) perGroep[groep] = []
      perGroep[groep].push(i)
    })
  })

  const perDag = {}
  // Per niveau één regel met alle betrokken spiergroepen; anders krijg je bij
  // twee push-dagen twee bijna gelijke zinnen (borst én triceps).
  const perNiveau = { [ROOD]: new Set(), [ORANJE]: new Set() }

  Object.entries(perGroep).forEach(([groep, indexen]) => {
    const gat = kleinsteGat(indexen)
    if (gat === null || gat > 2) return
    const niveau = gat === 1 ? ROOD : ORANJE
    // Rood wint van oranje op een dag die in beide zit.
    indexen.forEach(i => { if (perDag[i] !== ROOD) perDag[i] = niveau })
    perNiveau[niveau].add(groep)
  })

  const meldingen = []
  if (perNiveau[ROOD].size > 0) meldingen.push({ niveau: ROOD, gat: 1, groepen: [...perNiveau[ROOD]] })
  if (perNiveau[ORANJE].size > 0) meldingen.push({ niveau: ORANJE, gat: 2, groepen: [...perNiveau[ORANJE]] })
  return { perDag, meldingen }
}

const opsomming = (lijst) => lijst.length <= 1
  ? (lijst[0] || '')
  : `${lijst.slice(0, -1).join(', ')} en ${lijst[lijst.length - 1]}`

export function waarschuwingTekst(melding) {
  if (!melding?.groepen?.length) return ''
  const wat = opsomming(melding.groepen)
  const meervoud = melding.groepen.length > 1
  return melding.gat === 1
    ? `${wat} ${meervoud ? 'staan' : 'staat'} twee dagen achter elkaar. Geen 24 uur herstel.`
    : `${wat} ${meervoud ? 'krijgen' : 'krijgt'} maar 48 uur rust. Aan de krappe kant.`
}

export default rustWaarschuwingen
