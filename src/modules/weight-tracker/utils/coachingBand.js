// src/modules/weight-tracker/utils/coachingBand.js
//
// De coaching-band: tussen welke twee lijnen hoort het gewicht van een klant te
// blijven, en wat zegt het als hij eruit loopt.
//
// Alles draait om het 7-daags gemiddelde. Een losse weging zegt niets — water,
// zout, glycogeen en darminhoud maken zomaar twee kilo verschil tussen twee
// ochtenden. Daarom rekent dit bestand nergens met een dagmeting; het oordeel
// gaat altijd over de trend.
//
// De band loopt vanaf het startgewicht met een percentage per week:
//   traagste toegestane tempo  → de grens die zegt "dit gaat te langzaam"
//   snelste toegestane tempo   → de grens die zegt "dit gaat te snel"
// Bij afvallen ligt de traagste lijn dus bóven de doellijn en de snelste
// eronder. In de app noemen we ze daarom niet boven/onder maar te langzaam en
// te snel — "onder de band" leest als achterlopen terwijl het juist te hard
// gaat.
//
// Dit bestand doet geen database en geen UI: pure rekenkunde, zodat de
// coach-grafiek en (later) de klant-grafiek niet uit elkaar kunnen lopen.

export const STANDAARD = {
  streeftempo_pct: 0.6,   // gewenst tempo, % van startgewicht per week
  traagste_pct: 0.25,     // langzamer dan dit = te langzaam
  snelste_pct: 1.0,       // sneller dan dit = te snel
  snelste_pct_lean_of_ouder: 0.75,
  // De band is een marge om het afgesproken weektempo van de fase. Haal je de
  // helft, dan is dat een normale week; ga je bijna twee keer zo hard, dan
  // niet meer. De vaste kilo erbij vangt de ruis die ook in een 7-daags
  // gemiddelde blijft zitten — zonder dat wordt een build van 0,25 kg/week
  // een band waar je onmogelijk in kunt blijven.
  traag_factor: 0.5,
  snel_factor: 1.75,
  marge_kg: 0.1,
  venster_dagen: 7,
  min_metingen: 5,        // minder metingen in het venster = geen oordeel
  weken_voor_ingrijpen: 2,
  sprong_kg: 1.5,         // onverklaarde week-op-week sprong
  recomp_marge_pct: 0.4,
}

const dagInMs = 24 * 60 * 60 * 1000
const iso = (d) => {
  const x = new Date(d)
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`
}

// Welke kant gaat het op, en met welke marges?
//
// De fase is de baas. Daar staat wat er is afgesproken: cut of build, hoeveel
// kilo per week, vanaf welk gewicht en vanaf wanneer (client_phases). Een
// eindgewicht stuurt niets — op de weegschaal zie je niet of +8 kg spier of vet
// is, alleen het tempo zegt dat. Het doelgewicht is hoogstens een horizon.
//
// Zonder fase vallen we terug op wat er van de klant bekend is, met de
// standaardpercentages. Dat is de oude situatie en blijft werken.
export function maakConfig(client, fase = null, overrides = {}) {
  const vetPct = Number(client?.body_fat_percentage) || null
  const leeftijd = Number(client?.age) || null
  const kwetsbaar = (vetPct != null && vetPct < 12) || (leeftijd != null && leeftijd > 45)

  if (fase?.doel) {
    const richting = fase.doel === 'cut' ? 'afvallen'
      : fase.doel === 'build' ? 'aankomen'
      : 'stabiel'
    const tempoKg = Math.abs(Number(fase.week_doel_kg) || 0)
    const startGewicht = Number(fase.start_gewicht) || null

    if (richting === 'stabiel' || tempoKg === 0) {
      return {
        ...STANDAARD, richting: 'stabiel', kwetsbaar,
        tempoKg: 0, traagKg: 0, snelKg: 0,
        faseLabel: fase.doel, doelGewicht: Number(fase.doel_gewicht) || null,
        ...overrides,
      }
    }

    let snelKg = tempoKg * STANDAARD.snel_factor + STANDAARD.marge_kg
    // Veiligheidsrem op een cut: hoe hoog het afgesproken tempo ook staat,
    // sneller dan 1% van het lichaamsgewicht per week (0,75% bij lean of
    // ouder) kost spiermassa.
    if (richting === 'afvallen' && startGewicht) {
      const rem = startGewicht * ((kwetsbaar ? STANDAARD.snelste_pct_lean_of_ouder : STANDAARD.snelste_pct) / 100)
      snelKg = Math.min(snelKg, rem)
    }
    return {
      ...STANDAARD, richting, kwetsbaar,
      tempoKg,
      traagKg: Math.max(0, tempoKg * STANDAARD.traag_factor - STANDAARD.marge_kg),
      snelKg,
      faseLabel: fase.doel,
      doelGewicht: Number(fase.doel_gewicht) || null,
      ...overrides,
    }
  }

  // ── Geen fase: afleiden uit start- en doelgewicht ──
  const start = Number(client?.start_weight) || null
  const doel = Number(client?.target_weight) || null
  let richting = 'afvallen'
  if (start && doel) {
    const verschil = doel - start
    if (Math.abs(verschil) < start * 0.01) richting = 'stabiel'
    else if (verschil > 0) richting = 'aankomen'
  }
  const basis = richting === 'aankomen'
    ? { streeftempo_pct: 0.35, traagste_pct: 0.1, snelste_pct: 0.5 }
    : { streeftempo_pct: STANDAARD.streeftempo_pct, traagste_pct: STANDAARD.traagste_pct, snelste_pct: STANDAARD.snelste_pct }
  if (kwetsbaar && richting === 'afvallen') basis.snelste_pct = STANDAARD.snelste_pct_lean_of_ouder

  const basisGewicht = start || 80
  return {
    ...STANDAARD, ...basis, richting, kwetsbaar,
    tempoKg: richting === 'stabiel' ? 0 : basisGewicht * basis.streeftempo_pct / 100,
    traagKg: richting === 'stabiel' ? 0 : basisGewicht * basis.traagste_pct / 100,
    snelKg: richting === 'stabiel' ? 0 : basisGewicht * basis.snelste_pct / 100,
    doelGewicht: doel,
    ...overrides,
  }
}

// Het 7-daags gemiddelde per dag waarop gewogen is, chronologisch.
// history: [{ date, weight }] in willekeurige volgorde.
export function trendReeks(history, vensterDagen = STANDAARD.venster_dagen) {
  const perDag = new Map()
  ;(history || []).forEach(e => {
    const w = parseFloat(e?.weight)
    if (!Number.isFinite(w) || !e?.date) return
    // Eén meting per dag; bij meer houden we de laatste aan.
    perDag.set(String(e.date).slice(0, 10), w)
  })
  const dagen = [...perDag.keys()].sort()
  return dagen.map(dag => {
    const eind = new Date(`${dag}T00:00:00`).getTime()
    const begin = eind - (vensterDagen - 1) * dagInMs
    const inVenster = dagen
      .filter(d => {
        const t = new Date(`${d}T00:00:00`).getTime()
        return t >= begin && t <= eind
      })
      .map(d => perDag.get(d))
    const som = inVenster.reduce((s, v) => s + v, 0)
    return {
      datum: dag,
      meting: perDag.get(dag),
      trend: inVenster.length ? Math.round((som / inVenster.length) * 100) / 100 : null,
      metingen: inVenster.length,
    }
  })
}

// Het startpunt van de band. Het opgegeven startgewicht klopt vaak niet met de
// eerste echte weging; dan is die eerste weektrend eerlijker (punt 7 van de
// richtlijn). Zit er wel een opgegeven gewicht én ligt dat dicht bij de eerste
// trend, dan houden we het opgegeven getal aan.
export function bepaalStart(client, reeks) {
  const eerste = reeks?.[0]
  const opgegeven = Number(client?.start_weight) || null
  const datumUitClient = client?.coaching_start_date || null

  const startDatum = datumUitClient || eerste?.datum || iso(new Date())
  if (!eerste) return { startGewicht: opgegeven, startDatum, herijkt: false }

  // De eerste trend met genoeg metingen; anders de eerste meting.
  const betrouwbaar = reeks.find(r => r.metingen >= 3) || eerste
  if (!opgegeven) return { startGewicht: betrouwbaar.trend ?? betrouwbaar.meting, startDatum, herijkt: true }
  const afwijking = Math.abs(opgegeven - (betrouwbaar.trend ?? betrouwbaar.meting))
  if (afwijking > 2) {
    return { startGewicht: betrouwbaar.trend ?? betrouwbaar.meting, startDatum, herijkt: true }
  }
  return { startGewicht: opgegeven, startDatum, herijkt: false }
}

// Hele weken sinds de start — alleen om een oordeel een weeknummer te geven.
export const weekVan = (datum, startDatum) =>
  Math.max(0, Math.floor((new Date(`${String(datum).slice(0, 10)}T00:00:00`) - new Date(`${String(startDatum).slice(0, 10)}T00:00:00`)) / (7 * dagInMs)))

// Waar de band op dít moment loopt, in weken met cijfers achter de komma.
//
// Twee dingen die hier makkelijk misgaan en allebei dezelfde kant op vallen:
//
// 1. Afronden naar hele weken. Op dag 13 heb je bijna twee weken vooruitgang,
//    maar "week 1" rekent met één. Dan lijkt iedereen te snel af te vallen.
// 2. Het 7-daags gemiddelde loopt achter: het is het gemiddelde van de
//    afgelopen week, dus het hoort bij het midden van dat venster, niet bij
//    vandaag. Vergelijk je het met de band van vandaag, dan lijkt iedereen te
//    langzaam.
//
// Daarom: de band uitrekenen op het midden van het trendvenster.
export function weekFractie(datum, startDatum, vensterDagen = STANDAARD.venster_dagen) {
  const midden = new Date(`${String(datum).slice(0, 10)}T00:00:00`).getTime() - ((vensterDagen - 1) / 2) * dagInMs
  const start = new Date(`${String(startDatum).slice(0, 10)}T00:00:00`).getTime()
  return Math.max(0, (midden - start) / (7 * dagInMs))
}

// De drie lijnen op week n (n mag decimalen hebben). `traag` en `snel` zijn de
// grenzen; welke van de twee bovenaan ligt hangt af van de richting.
export function lijnenOpWeek(n, startGewicht, config) {
  if (!Number.isFinite(startGewicht)) return null
  if (config.richting === 'stabiel') {
    const marge = startGewicht * (config.recomp_marge_pct / 100)
    return { doel: startGewicht, traag: startGewicht + marge, snel: startGewicht - marge }
  }
  const teken = config.richting === 'aankomen' ? 1 : -1
  return {
    doel: startGewicht + config.tempoKg * n * teken,
    traag: startGewicht + config.traagKg * n * teken,
    snel: startGewicht + config.snelKg * n * teken,
  }
}

// Het oordeel op één moment.
export function beoordeel(trendWaarde, metingen, n, startGewicht, config) {
  if (!Number.isFinite(trendWaarde) || !Number.isFinite(startGewicht)) {
    return { status: 'GEEN_DATA' }
  }
  if (metingen < config.min_metingen) return { status: 'ONVOLDOENDE_DATA', metingen }
  // In de eerste week is de band nog vrijwel een streep: er is per definitie
  // bijna geen verandering toegestaan, dus elke afwijking van een ons valt
  // erbuiten. Dat is geen oordeel maar een rekenartefact.
  if (n < 1) return { status: 'TE_VROEG', lijnen: lijnenOpWeek(n, startGewicht, config) }
  const l = lijnenOpWeek(n, startGewicht, config)
  if (!l) return { status: 'GEEN_DATA' }
  const hoog = Math.max(l.traag, l.snel)
  const laag = Math.min(l.traag, l.snel)
  if (trendWaarde > hoog) return { status: config.richting === 'aankomen' ? 'TE_SNEL' : 'TE_LANGZAAM', lijnen: l }
  if (trendWaarde < laag) return { status: config.richting === 'aankomen' ? 'TE_LANGZAAM' : 'TE_SNEL', lijnen: l }
  return { status: 'OP_KOERS', lijnen: l }
}

// Per week één oordeel (de laatste trendwaarde van die week), plus hoeveel
// weken achter elkaar dezelfde afwijking al speelt. Die teller is het hele
// punt van de ruisfilter: één week ernaast is observeren, twee weken is
// ingrijpen.
export function weekBeoordelingen(reeks, startGewicht, startDatum, config) {
  const perWeek = new Map()
  reeks.forEach(r => {
    const n = weekVan(r.datum, startDatum)
    perWeek.set(n, r)  // laatste van die week wint
  })
  const weken = [...perWeek.keys()].sort((a, b) => a - b)
  let vorige = null
  let buiten = 0
  return weken.map(n => {
    const r = perWeek.get(n)
    const oordeel = beoordeel(r.trend, r.metingen, weekFractie(r.datum, startDatum, config.venster_dagen), startGewicht, config)
    const afwijkend = oordeel.status === 'TE_SNEL' || oordeel.status === 'TE_LANGZAAM'
    if (!afwijkend) buiten = 0
    else buiten = (oordeel.status === vorige) ? buiten + 1 : 1
    vorige = afwijkend ? oordeel.status : null
    return { week: n, ...r, ...oordeel, wekenBuiten: afwijkend ? buiten : 0 }
  })
}

// Wat je met dit oordeel doet. Bewust alleen een voorstel: kcal aanpassen blijft
// een besluit van de coach.
export function advies(laatste, config) {
  if (!laatste) return null
  const ingrijpen = laatste.wekenBuiten >= config.weken_voor_ingrijpen
  const aankomen = config.richting === 'aankomen'

  if (laatste.status === 'TE_VROEG') {
    return { toon: 'wacht', tekst: 'Eerste week van de fase — nog te vroeg voor een oordeel.' }
  }
  if (laatste.status === 'ONVOLDOENDE_DATA') {
    return { toon: 'wacht', tekst: `Maar ${laatste.metingen} van de 7 dagen gewogen — te weinig voor een oordeel.` }
  }
  if (laatste.status === 'OP_KOERS') {
    return { toon: 'goed', tekst: 'Op koers. Niets veranderen.' }
  }
  if (config.richting === 'stabiel') {
    return laatste.status === 'OP_KOERS'
      ? { toon: 'goed', tekst: 'Blijft stabiel — dat is de bedoeling. Stuur op kracht, omvang en foto\'s.' }
      : { toon: 'kijk', tekst: 'Loopt uit de behoudstrook. Bij recomp zegt de weegschaal weinig; kijk naar kracht en omvang.' }
  }
  if (!ingrijpen) {
    return { toon: 'kijk', tekst: `Eén week ${laatste.status === 'TE_SNEL' ? 'te snel' : 'te langzaam'}. Nog even aankijken.` }
  }

  // Welke kant je bijstuurt hangt af van de richting, niet van de status. Te
  // snel afvallen kost spiermassa (dus eten erbij); te snel aankomen is vooral
  // vet (dus eten eraf). Dat zijn tegengestelde adviezen bij dezelfde status.
  if (laatste.status === 'TE_SNEL') {
    return aankomen
      ? { toon: 'let_op', tekst: 'Twee weken te snel aangekomen. Dit wordt vooral vet: 100-200 kcal eraf, of meer stappen — niet allebei.' }
      : {
        toon: 'let_op',
        tekst: config.kwetsbaar
          ? 'Twee weken te snel, en deze klant is lean of ouder: 150-250 kcal erbij, en check de eiwitinname.'
          : 'Twee weken te snel. 150-250 kcal erbij om spierverlies te voorkomen.',
      }
  }
  // TE_LANGZAAM
  return aankomen
    ? { toon: 'let_op', tekst: 'Twee weken te langzaam aangekomen. Check of hij zijn calorieën haalt; zo ja, 150-250 kcal erbij.' }
    : { toon: 'let_op', tekst: 'Twee weken te langzaam. Check eerst de trouw (logt hij echt alles?); klopt dat, dan 100-200 kcal eraf óf meer stappen — niet allebei.' }
}

export const STATUS_TEKST = {
  OP_KOERS: 'Op koers',
  TE_VROEG: 'Net begonnen',
  TE_SNEL: 'Te snel',
  TE_LANGZAAM: 'Te langzaam',
  ONVOLDOENDE_DATA: 'Te weinig metingen',
  GEEN_DATA: 'Nog geen data',
}

export const STATUS_KLEUR = {
  OP_KOERS: '#10b981',
  TE_VROEG: 'rgba(255,255,255,0.35)',
  TE_SNEL: '#f59e0b',
  TE_LANGZAAM: '#f59e0b',
  ONVOLDOENDE_DATA: 'rgba(255,255,255,0.35)',
  GEEN_DATA: 'rgba(255,255,255,0.35)',
}
