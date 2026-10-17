// src/modules/client-checkin/doelen.js
//
// De weekdoelen die een klant zelf stelt in zijn check-in, en hoe je ze naast
// de werkelijkheid legt.
//
// Vier van de vijf soorten zijn meetbaar uit de app: trainen, wegen, voeding
// bijhouden en stappen (client_step_logs). Voor die vier kan het formulier zelf al invullen of het
// doel gehaald is, en hoeft de klant alleen te bevestigen. Het vijfde soort is
// vrije tekst ("om 23:00 in bed") — daar kan alleen de klant zelf iets over
// zeggen.
//
// Eén bestand voor alle drie de schermen: het invulformulier, de coachweergave
// en het blok op het dashboard van de klant. Anders krijgt de klant te horen
// dat hij 3 van de 4 trainingen deed terwijl de coach 2 ziet staan.

export const DOEL_TYPES = [
  {
    key: 'trainen', label: 'Trainen', eenheid: 'keer',
    standaard: 3, max: 14,
    // Uit week_cijfers zoals weekCijfers.js die oplevert.
    meet: (c) => c?.trainingen?.gedaan ?? null,
    zin: (n) => `${n}× trainen`,
    meetTekst: (m, doel) => `${m} van ${doel.doel_getal}× getraind`,
  },
  {
    key: 'wegen', label: 'Wegen', eenheid: 'dagen',
    standaard: 5, max: 7,
    meet: (c) => c?.wegingen?.gedaan ?? null,
    zin: (n) => `${n} dagen wegen`,
    meetTekst: (m, doel) => `${m} van ${doel.doel_getal} dagen gewogen`,
  },
  {
    key: 'voeding', label: 'Voeding bijhouden', eenheid: 'dagen',
    standaard: 5, max: 7,
    meet: (c) => c?.voeding?.dagen ?? null,
    zin: (n) => `${n} dagen voeding bijhouden`,
    meetTekst: (m, doel) => `${m} van ${doel.doel_getal} dagen bijgehouden`,
  },
  {
    key: 'stappen', label: 'Stappen', eenheid: 'per dag',
    standaard: 8000, max: 30000, stap: 500,
    // Hoeveel dagen het stappendoel gehaald is, uit client_step_logs. Zonder
    // een enkele stappenrij in de week weten we het niet (null), en dat is
    // iets anders dan nul dagen gehaald.
    meet: (c, doel) => {
      const dagen = c?.stappen?.dagen
      if (!Array.isArray(dagen) || !dagen.some(d => d.steps > 0)) return null
      return dagen.filter(d => d.steps >= Number(doel?.doel_getal || 0)).length
    },
    // Het voorstel gaat over dagen, niet over het stappengetal zelf.
    voorstelDoel: () => 7,
    meetTekst: (m, _doel, c) => {
      const gem = c?.stappen?.gemiddelde
      return `${m} van 7 dagen gehaald${gem ? ` · gem. ${gem.toLocaleString('nl-NL')}` : ''}`
    },
    zin: (n) => `${Number(n).toLocaleString('nl-NL')} stappen per dag`,
  },
  {
    key: 'eigen', label: 'Eigen doel', eenheid: null,
    standaard: null, max: null,
    meet: () => null,
    zin: (_n, tekst) => tekst || 'Eigen doel',
  },
]

export const typeVan = (key) => DOEL_TYPES.find(t => t.key === key) || null

// Hoe een doel in één regel leest. Gebruikt op alle drie de schermen.
export function doelTekst(doel) {
  if (!doel) return ''
  const t = typeVan(doel.type)
  if (!t) return doel.tekst || ''
  return t.zin(doel.doel_getal, doel.tekst)
}

// Wat de app ervan gemeten heeft, of null als dit doel niet te meten is.
export function meetDoel(doel, weekCijfers) {
  const t = typeVan(doel?.type)
  if (!t || !weekCijfers) return null
  const n = t.meet(weekCijfers, doel)
  return Number.isFinite(n) ? n : null
}

// Wat de klant en de coach naast het doel lezen: "4 van 5 dagen gewogen" in
// plaats van een kaal getal.
export function meetTekst(doel, gemeten, weekCijfers) {
  const t = typeVan(doel?.type)
  if (gemeten == null || !t?.meetTekst) return null
  return t.meetTekst(gemeten, doel, weekCijfers)
}

// Oudere check-ins hebben alleen het getal bewaard.
export const gemetenRegel = (d) =>
  d?.gemeten_tekst || (d?.gemeten != null ? `gemeten ${d.gemeten}` : null)

// Het voorstel dat het formulier klaarzet. De klant mag het altijd omzetten:
// "ik was ziek" is een goede reden waar geen teller iets van weet.
//
// Deels vanaf de helft: drie van de vier trainingen is geen mislukking, één van
// de vier wel.
export function voorstelBehaald(doel, gemeten) {
  if (gemeten == null || !doel?.doel_getal) return null
  const nodig = typeVan(doel.type)?.voorstelDoel?.(doel) ?? doel.doel_getal
  if (gemeten >= nodig) return 'ja'
  if (gemeten >= nodig / 2) return 'deels'
  return 'nee'
}

export const BEHAALD_OPTIES = [
  { key: 'ja', label: 'Ja', kleur: '#10b981' },
  { key: 'deels', label: 'Deels', kleur: '#f59e0b' },
  { key: 'nee', label: 'Nee', kleur: '#ef4444' },
]

export const kleurVoorBehaald = (b) =>
  BEHAALD_OPTIES.find(o => o.key === b)?.kleur || 'rgba(255,255,255,0.3)'

// Hoeveel doelen staan er groen? Voor het regeltje "2/3" in het coachoverzicht.
// 'deels' telt als half, naar beneden afgerond in de teller maar wel zichtbaar
// in de opsomming — een halve training bestaat niet.
export function scoreVanDoelen(doelen) {
  const lijst = Array.isArray(doelen) ? doelen : []
  if (lijst.length === 0) return null
  const gehaald = lijst.filter(d => d.behaald === 'ja').length
  const deels = lijst.filter(d => d.behaald === 'deels').length
  return { gehaald, deels, totaal: lijst.length }
}

// De doelen van de vorige check-in klaarzetten voor de terugkoppeling: kopie
// maken, meten wat de app weet, en een voorstel invullen.
export function bereidTerugkoppelingVoor(vorigeDoelen, weekCijfers) {
  return (Array.isArray(vorigeDoelen) ? vorigeDoelen : []).map(d => {
    const gemeten = meetDoel(d, weekCijfers)
    return {
      ...d,
      gemeten,
      gemeten_tekst: meetTekst(d, gemeten, weekCijfers),
      behaald: voorstelBehaald(d, gemeten),
    }
  })
}

// Een leeg doel van een bepaald type, met een zinnig startgetal.
export function leegDoel(typeKey = 'trainen') {
  const t = typeVan(typeKey)
  return { type: typeKey, doel_getal: t?.standaard ?? null, tekst: '' }
}
