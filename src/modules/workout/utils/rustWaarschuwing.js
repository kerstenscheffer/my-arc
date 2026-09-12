// src/modules/workout/utils/rustWaarschuwing.js
//
// Waarschuwing als dezelfde spiergroep te dicht op elkaar getraind wordt.
//
// Op spiergroep en niet op de workout: in de echte schema's heet de tweede
// push-dag "Push (Copy)" en heeft die een eigen sleutel (dag5 naast dag1).
// Op naam vergelijken ziet dat niet als dezelfde training, terwijl het
// dezelfde borst- en triceps-oefeningen zijn.
//
// Op echte datums en niet op de weekdag-volgorde: zondag botst niet met de
// dinsdag ervoor maar met de dinsdag erna. Daarom kijken we naar de week
// ervoor, de getoonde week en de week erna, en rekenen we in dagen tussen
// datums. Alleen paren waarvan de tweede dag nog moet komen tellen mee — een
// training van gisteren verschuif je niet meer.
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

const dagErbij = (datum, n) => {
  const d = new Date(datum)
  d.setDate(d.getDate() + n)
  d.setHours(0, 0, 0, 0)
  return d
}

const kortDatum = (d) => d.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric' })

// weken: { '-1': schedule, '0': schedule, '1': schedule } — de indeling van de
//        week ervoor, de getoonde week en de week erna. Ontbreekt er een, dan
//        telt die week gewoon niet mee.
// maandag: Date, de maandag van de getoonde week.
// vandaag: Date, om te bepalen wat nog te verschuiven valt.
//
// Terug: { perDag: {0..6: 'rood'|'oranje'}, meldingen: [...] }
export function rustWaarschuwingen({ weken, weekDays, dagDataVan = () => null, maandag, vandaag = new Date() }) {
  const vandaagNul = new Date(vandaag)
  vandaagNul.setHours(0, 0, 0, 0)
  const start = new Date(maandag)
  start.setHours(0, 0, 0, 0)

  // Alle trainingsdagen uit de drie weken op een rij, met hun echte datum.
  const perGroep = {}
  ;[-1, 0, 1].forEach(week => {
    const schema = weken?.[String(week)]
    if (!schema) return
    weekDays.forEach((dag, i) => {
      const key = schema[dag]
      if (!key) return
      const pos = week * 7 + i
      focusGroepen(dagDataVan(key)).forEach(groep => {
        if (!perGroep[groep]) perGroep[groep] = []
        perGroep[groep].push({ pos, week, index: i, datum: dagErbij(start, pos) })
      })
    })
  })

  const perDag = {}
  const perNiveau = {
    [ROOD]: { groepen: new Set(), paren: [] },
    [ORANJE]: { groepen: new Set(), paren: [] },
  }

  Object.entries(perGroep).forEach(([groep, dagen]) => {
    const lijst = [...dagen].sort((a, b) => a.pos - b.pos)
    for (let i = 1; i < lijst.length; i++) {
      const eerste = lijst[i - 1]
      const tweede = lijst[i]
      const gat = tweede.pos - eerste.pos
      if (gat < 1 || gat > 2) continue
      // Ligt de tweede training al achter ons, dan valt er niets meer te
      // schuiven en is een waarschuwing alleen maar ruis.
      if (tweede.datum < vandaagNul) continue

      const niveau = gat === 1 ? ROOD : ORANJE
      // Alleen dagen van de getoonde week kunnen gekleurd worden.
      ;[eerste, tweede].forEach(d => {
        if (d.week !== 0) return
        if (perDag[d.index] !== ROOD) perDag[d.index] = niveau
      })
      perNiveau[niveau].groepen.add(groep)
      perNiveau[niveau].paren.push({ eerste, tweede, groep })
    }
  })

  const meldingen = [];
  [ROOD, ORANJE].forEach(niveau => {
    const bak = perNiveau[niveau]
    if (bak.groepen.size === 0) return
    // Eén regel per niveau: bij twee push-dagen zou je anders twee bijna
    // gelijke zinnen krijgen (borst én triceps).
    const paar = bak.paren[0]
    meldingen.push({
      niveau,
      gat: niveau === ROOD ? 1 : 2,
      groepen: [...bak.groepen],
      dagen: paar ? [kortDatum(paar.eerste.datum), kortDatum(paar.tweede.datum)] : [],
      // Staat de tweede training in een andere week, dan kun je die daar
      // verschuiven — daar wijst de tip naar.
      andereWeek: paar ? paar.tweede.week !== paar.eerste.week : false,
    })
  })

  return { perDag, meldingen }
}

const opsomming = (lijst) => lijst.length <= 1
  ? (lijst[0] || '')
  : `${lijst.slice(0, -1).join(', ')} en ${lijst[lijst.length - 1]}`

export function waarschuwingTekst(melding) {
  if (!melding?.groepen?.length) return ''
  const wat = opsomming(melding.groepen)
  const meervoud = melding.groepen.length > 1
  const wanneer = melding.dagen?.length === 2 ? ` (${melding.dagen[0]} en ${melding.dagen[1]})` : ''
  const kern = melding.gat === 1
    ? `${wat}${wanneer} ${meervoud ? 'staan' : 'staat'} twee dagen achter elkaar. Geen 24 uur herstel.`
    : `${wat}${wanneer} ${meervoud ? 'krijgen' : 'krijgt'} maar 48 uur rust. Aan de krappe kant.`
  const tip = melding.andereWeek
    ? ' Blader met de pijlen naar die week om hem te verschuiven.'
    : ' Schuif er een op met de pijltjes.'
  return kern + tip
}

export default rustWaarschuwingen
