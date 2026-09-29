// src/modules/workout/components/todays-workout/krachtBand.js
//
// Wat is een goed tempo voor kracht? Bij gewicht staat dat in de fase — daar
// spreek je kilo's per week af. Voor een oefening bestaat die afspraak niet,
// dus staat hier de norm waartegen we meten.
//
// De norm is een percentage van je startgewicht per week, niet een vast aantal
// kilo. Vijf kilo erbij op een bankdrukken van 40 is een ander verhaal dan vijf
// kilo op een deadlift van 180, en een vaste stap zou de ene klant belonen en
// de andere afserveren.
//
// Anders dan bij lichaamsgewicht is er hier geen bovengrens: harder vooruit dan
// afgesproken is puur goed nieuws. De band loopt dus van "dit is het minste wat
// we willen zien" tot het streeftempo, en alles daarboven is beter.
//
// De norm hangt af van de fase uit client_phases — zie NORM_PER_FASE hieronder.
// In een build is 0,75% per week ongeveer waar een klant die serieus traint op
// uitkomt: op 70 kg bankdrukken een halve kilo per week, ruim vijf kilo in drie
// maanden. In een cut ligt de lat op vasthouden, want kracht verliezen hoort
// daar tot op zekere hoogte bij.

// Wat "goed" is hangt af van de fase. Dezelfde daling van een halve kilo is
// slecht nieuws in een build en volstrekt normaal in een cut: in een tekort
// verlies je glycogeen en herstel je trager, en dan zakt je kracht licht
// zonder dat er iets mis is. Eén norm voor beide zou de helft van je klanten
// onterecht rood kleuren.
//
//   cut      — vasthouden is het doel. Lichte daling mag; sterker worden is
//              een bonus en kleurt gewoon groen.
//   build    — hier hoort het omhoog te gaan. Stilstand is het signaal.
//   stabiel  — onderhoud of recomp: kleine winst verwacht, geen sprongen.
//
// Getallen zijn percentages van je startgewicht op die oefening, per week.
export const NORM_PER_FASE = {
  cut:     { streef_pct_week: 0,    minimaal_pct_week: -0.35, label: 'kracht vasthouden' },
  build:   { streef_pct_week: 0.75, minimaal_pct_week: 0.25,  label: 'kracht opbouwen' },
  stabiel: { streef_pct_week: 0.4,  minimaal_pct_week: 0,     label: 'kleine winst' },
}

// Zonder fase gaan we uit van opbouwen: dat is wat iemand die traint wil, en
// het is de norm die hier stond voordat de fase meetelde.
export const KRACHT_NORM = {
  ...NORM_PER_FASE.build,
  // Onder deze absolute stap is een verschil ruis: de meeste stangen gaan met
  // 2,5 kg omhoog en veel machines met 5. Zonder deze bodem zou een band van
  // 0,1 kg breed elke normale week als "buiten de band" bestempelen.
  marge_kg: 1.25,
}

// De norm die bij een fase-rij uit client_phases hoort. `doel` is daar 'cut',
// 'build', 'recomp' of 'onderhoud'.
export function normVoorFase(fase) {
  const doel = String(fase?.doel || '').toLowerCase()
  const basis = doel === 'cut' ? NORM_PER_FASE.cut
    : doel === 'build' ? NORM_PER_FASE.build
    : doel ? NORM_PER_FASE.stabiel
    : NORM_PER_FASE.build
  return { ...KRACHT_NORM, ...basis, faseDoel: doel || null }
}

// Hoe je het oordeel in woorden brengt, per fase. In een cut betekent 'stil'
// iets anders dan in een build: daar zakt hij te hard, hier staat hij stil.
export function oordeelTekst(staat, norm) {
  const cut = norm?.faseDoel === 'cut'
  if (staat === 'goed') return cut ? 'Kracht blijft staan' : 'Op tempo'
  if (staat === 'traag') return cut ? 'Zakt licht — normaal in een cut' : 'Vooruit, maar traag'
  if (staat === 'stil') return cut ? 'Zakt harder dan we willen' : 'Staat stil'
  return null
}

// Hoe zwaar was die set eigenlijk? Elke set wordt omgerekend naar het gewicht
// dat je bij acht herhalingen zou halen (een "8RM"), zodat sets met
// verschillende herhalingen vergelijkbaar worden.
//
// Via Epley: 1RM ≈ gewicht × (1 + reps / 30), en dan terug naar acht reps.
//
// Waarom niet gewoon het zwaarste gewicht: dan zie je vooruitgang alleen als er
// een schijf bij gaat. Ga je van 70 kg × 8 naar 70 kg × 11, dan ben je sterker
// geworden en bleef de lijn vlak.
//
// Boven de twaalf herhalingen wordt de schatting onbetrouwbaar — daar meet je
// eerder conditie dan kracht — dus daarboven rekenen we alsof het er twaalf
// waren. Een set van dertig telt dus niet als een 1RM van het dubbele.
export const MAX_REPS_VOOR_SCHATTING = 12

// Op hoeveel herhalingen we de schatting uitdrukken. Acht, niet één: dat is het
// bereik waarin je klanten daadwerkelijk trainen, dus het getal op de grafiek
// is direct te vergelijken met wat er op de stang ligt. Een 1RM is een getal
// dat bijna niemand ooit tilt.
export const REFERENTIE_REPS = 8

// Eerst naar een 1RM (Epley), dan terug naar het referentie-aantal. De
// tussenstap staat er omdat elke set eerst op één noemer moet voordat je ze
// kunt vergelijken.
export function geschatRM(gewicht, reps, doelReps = REFERENTIE_REPS) {
  const g = Number(gewicht) || 0
  const r = Math.min(Math.max(Number(reps) || 1, 1), MAX_REPS_VOOR_SCHATTING)
  if (!g) return 0
  const eenRM = g * (1 + r / 30)
  return Math.round((eenRM / (1 + doelReps / 30)) * 10) / 10
}

// Blijft bestaan voor wie de kale 1RM wil.
export function geschat1RM(gewicht, reps) {
  return geschatRM(gewicht, reps, 1)
}

const dagInMs = 24 * 60 * 60 * 1000

// Hoeveel weken zit er tussen twee logdatums? Als kommagetal, want je traint
// niet op vaste dagen.
export function wekenTussen(vanIso, totIso) {
  const van = new Date(`${String(vanIso).slice(0, 10)}T00:00:00`).getTime()
  const tot = new Date(`${String(totIso).slice(0, 10)}T00:00:00`).getTime()
  if (!Number.isFinite(van) || !Number.isFinite(tot)) return 0
  return Math.max(0, (tot - van) / (dagInMs * 7))
}

// De twee lijnen op een gegeven moment: waar je minimaal hoort te zitten en
// waar we op mikken.
export function lijnenOpWeek(weken, startGewicht, norm = KRACHT_NORM) {
  const streef = startGewicht * (1 + (norm.streef_pct_week / 100) * weken)
  const minimaal = startGewicht * (1 + (norm.minimaal_pct_week / 100) * weken)
  // Niet afkappen op het startgewicht: in een cut ligt de ondergrens er
  // bewust onder, want daar is een lichte daling de verwachting.
  return {
    doel: Math.round(streef * 10) / 10,
    minimaal: Math.round(minimaal * 10) / 10,
  }
}

// Hoe staat dit punt ervoor? Eén van 'goed' | 'traag' | 'stil'.
//
//   goed  — op of boven het streeftempo
//   traag — vooruit, maar minder dan afgesproken
//   stil  — onder de ondergrens: niet vooruit, of achteruit
//
// De marge in kilo's vangt de stapgrootte van het materiaal op: net onder de
// lijn met dezelfde stang is geen ander verhaal dan net erboven.
export function beoordeel(gewicht, lijnen, norm = KRACHT_NORM) {
  if (!Number.isFinite(gewicht) || !lijnen) return null
  if (gewicht >= lijnen.doel - norm.marge_kg) return 'goed'
  if (gewicht >= lijnen.minimaal - norm.marge_kg) return 'traag'
  return 'stil'
}

export const KLEUR_VOOR = {
  goed: '#10b981',
  traag: '#f59e0b',
  stil: '#ef4444',
}

// De hele reeks doorrekenen tegen één norm. Het startpunt is de eerste log —
// dat is waar deze klant met deze oefening begon.
export function metBand(punten, norm = KRACHT_NORM) {
  if (!punten?.length) return []
  const start = punten[0]
  return punten.map(p => {
    const weken = wekenTussen(start.datum, p.datum)
    const l = lijnenOpWeek(weken, start.gewicht, norm)
    return {
      ...p,
      doel: l.doel,
      band: [Math.min(l.minimaal, l.doel), Math.max(l.minimaal, l.doel)],
      oordeel: beoordeel(p.gewicht, l, norm),
      norm,
    }
  })
}

// ── Met de fase-geschiedenis erbij ──────────────────────────────────────────
//
// Een klant die maanden in een cut zat en nu bouwt, hoort geen doellijn te
// krijgen die vanaf dag één stijgt. Tijdens de cut loopt de lijn vlak — kracht
// vasthouden was toen het doel — en vanaf de dag dat de build begint klimt hij.
//
// Belangrijk is dat de lijn dóórloopt op de overgang: de build begint op de
// hoogte waar de cut-lijn eindigde, niet opnieuw op het gewicht van je eerste
// log ooit. Anders springt de doellijn op de faseovergang en klopt het oordeel
// daarna nergens meer op.
export function metBandFases(punten, fases) {
  if (!punten?.length) return []
  const lijst = (fases || [])
    .filter(f => f?.started_on)
    .map(f => ({ doel: f.doel, start: String(f.started_on).slice(0, 10) }))
    .sort((a, b) => a.start.localeCompare(b.start))

  if (!lijst.length) return metBand(punten, KRACHT_NORM)

  // Welke fase gold er op een datum? De laatste die toen al begonnen was.
  const faseOp = (dag) => {
    let gevonden = null
    for (const f of lijst) { if (f.start <= dag) gevonden = f; else break }
    return gevonden
  }

  // De ankers waar elk segment op begint: de eerste log, plus elke fasestart
  // die daarna valt.
  const eersteDag = String(punten[0].datum).slice(0, 10)
  const grenzen = [eersteDag, ...lijst.map(f => f.start).filter(d => d > eersteDag)]

  // Per segment het startniveau van de doellijn en van de ondergrens. Het
  // eerste segment begint op de eerste log; elk volgend segment pakt de stand
  // van de vorige lijn op dat moment op.
  const segmenten = []
  let ankerDoel = punten[0].gewicht
  let ankerMin = punten[0].gewicht
  for (let i = 0; i < grenzen.length; i++) {
    const van = grenzen[i]
    const tot = grenzen[i + 1] || null
    const norm = normVoorFase(faseOp(van))
    segmenten.push({ van, tot, norm, ankerDoel, ankerMin })
    if (tot) {
      const weken = wekenTussen(van, tot)
      ankerDoel = ankerDoel * (1 + (norm.streef_pct_week / 100) * weken)
      ankerMin = ankerMin * (1 + (norm.minimaal_pct_week / 100) * weken)
    }
  }

  const segmentVoor = (dag) => {
    let gevonden = segmenten[0]
    for (const seg of segmenten) { if (seg.van <= dag) gevonden = seg; else break }
    return gevonden
  }

  return punten.map(p => {
    const dag = String(p.datum).slice(0, 10)
    const seg = segmentVoor(dag)
    const weken = wekenTussen(seg.van, dag)
    const doel = Math.round(seg.ankerDoel * (1 + (seg.norm.streef_pct_week / 100) * weken) * 10) / 10
    const minimaal = Math.round(seg.ankerMin * (1 + (seg.norm.minimaal_pct_week / 100) * weken) * 10) / 10
    const lijnen = { doel, minimaal }
    return {
      ...p,
      doel,
      band: [Math.min(minimaal, doel), Math.max(minimaal, doel)],
      oordeel: beoordeel(p.gewicht, lijnen, seg.norm),
      norm: seg.norm,
    }
  })
}

// De fases die in beeld komen, in volgorde, voor het regeltje onder de
// grafiek: "cut tot 4 sep · build daarna".
export function faseSamenvatting(punten, fases) {
  const gebruikt = []
  for (const p of metBandFases(punten, fases)) {
    const doel = p.norm?.faseDoel || null
    if (!gebruikt.length || gebruikt[gebruikt.length - 1].doel !== doel) {
      gebruikt.push({ doel, vanaf: p.datum })
    }
  }
  return gebruikt
}
