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
//
// De afspraken zelf — wanneer stuur je bij, en waarmee — staan in
// docs/coaching-band.md. Dat document is de bron; deze code volgt het. Wijzigt
// de regel, wijzig daar eerst.

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

// Een getal uit de database dat ook leeg mag zijn. Number('') en Number(null)
// geven allebei 0, en dat is hier een heel ander antwoord dan "niet ingevuld".
const losGetal = (v) => {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
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

    // Zelf ingestelde grenzen winnen — ook van de rem. Bij de ene klant wil je
    // scherper sturen dan bij de andere, en soms bewust sneller dan de
    // standaard toelaat. Wie dat invult weet wat hij doet; de app hoort dat
    // niet stilletjes terug te draaien.
    // Number(null) is 0, niet NaN. Daardoor las een leeg tempo_min_kg als een
    // ingestelde ondergrens van 0 kg/week, en gold elke daling — ook 0,04 kg op
    // een afspraak van 0,5 — als op koers. Vandaar een parser die "niet
    // ingevuld" en "expres nul" uit elkaar houdt.
    const eigenMin = losGetal(fase.tempo_min_kg)
    const eigenMax = losGetal(fase.tempo_max_kg)
    const handmatig = (eigenMin !== null && eigenMin > 0) || (eigenMax !== null && eigenMax > 0)

    return {
      ...STANDAARD, richting, kwetsbaar, handmatig,
      tempoKg,
      traagKg: (eigenMin !== null && eigenMin >= 0)
        ? eigenMin
        : Math.max(0, tempoKg * STANDAARD.traag_factor - STANDAARD.marge_kg),
      snelKg: (eigenMax !== null && eigenMax > 0) ? eigenMax : snelKg,
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
// Het tempo van deze week zelf: hoeveel de trend opschoof ten opzichte van de
// week ervoor, afgemeten tegen dezelfde grenzen per week.
//
// Dit is iets anders dan waar de trend stáát. Loopt iemand in week 1 een kilo
// te hard uit, dan ligt zijn trend daarna wekenlang boven de band terwijl hij
// intussen keurig op tempo zit. Dat gaf "te snel · 2 weken op rij" bij een week
// van +0,23 — een advies om te minderen terwijl er niets te minderen viel.
//
// Regel sindsdien: het tempo bepaalt of je bijstuurt, de stand bepaalt of je
// de lijn moet bijstellen.
export function tempoOordeel(verschil, config) {
  if (verschil == null || config.richting === 'stabiel') return null
  const teken = config.richting === 'aankomen' ? 1 : -1
  const gemeten = verschil * teken          // vooruitgang in de goede richting
  if (gemeten < config.traagKg) return 'TE_LANGZAAM'
  if (gemeten > config.snelKg) return 'TE_SNEL'
  return 'OP_KOERS'
}

export function weekBeoordelingen(reeks, startGewicht, startDatum, config) {
  const perWeek = new Map()
  reeks.forEach(r => {
    const n = weekVan(r.datum, startDatum)
    perWeek.set(n, r)  // laatste van die week wint
  })
  const weken = [...perWeek.keys()].sort((a, b) => a - b)
  let vorige = null
  let buiten = 0
  let vorigeTrend = null
  return weken.map(n => {
    const r = perWeek.get(n)
    // Waar de trend staat ten opzichte van de band. Dit tekent de grafiek.
    const stand = beoordeel(r.trend, r.metingen, weekFractie(r.datum, startDatum, config.venster_dagen), startGewicht, config)

    // Verschil met de vorige week, op de trend. Dit is het getal waar de coach
    // op stuurt: "week 37 +0,9, week 38 +0,9".
    const verschil = (Number.isFinite(r.trend) && Number.isFinite(vorigeTrend))
      ? Math.round((r.trend - vorigeTrend) * 100) / 100
      : null
    if (Number.isFinite(r.trend)) vorigeTrend = r.trend

    // Het oordeel dat in de tabel staat en de teller voedt, gaat over het
    // tempo. Kunnen we dat niet bepalen (eerste week, te weinig metingen), dan
    // valt hij terug op de stand.
    const tempo = (r.metingen >= config.min_metingen) ? tempoOordeel(verschil, config) : null
    const status = tempo || stand.status
    const afwijkend = status === 'TE_SNEL' || status === 'TE_LANGZAAM'

    if (afwijkend) {
      buiten = (status === vorige) ? buiten + 1 : 1
      vorige = status
    } else if (status === 'OP_KOERS') {
      // Terug op tempo: de teller mag weer op nul.
      buiten = 0
      vorige = null
    }
    // Een week zonder genoeg metingen (of de eerste week) zegt niets. Die zet
    // de teller niet terug op nul — anders wist één week slecht wegen een
    // probleem uit dat er gewoon nog is — maar telt ook niet mee als tweede
    // week. Hij wordt overgeslagen.

    // Hoeveel de trend van de plan-lijn af zit. Niet het oordeel, wel het
    // verhaal erachter.
    const vanPlan = (Number.isFinite(r.trend) && stand.lijnen)
      ? Math.round((r.trend - stand.lijnen.doel) * 10) / 10
      : null

    return { week: n, ...r, ...stand, status, stand: stand.status, verschil, vanPlan, wekenBuiten: afwijkend ? buiten : 0 }
  })
}

// Tempo en stand kunnen los van elkaar kloppen. Gaat het tempo goed terwijl de
// trend buiten de band ligt, dan is "op koers, niets veranderen" misleidend: hij
// gaat goed, maar staat niet waar hij zou staan. Deze functie zegt of dat
// speelt, en welke kant op.
//
// Onder de 0,3 kg laten we het lopen: dat is ruis in een 7-daags gemiddelde,
// geen achterstand.
export function standAfwijking(laatste) {
  if (!laatste || laatste.status !== 'OP_KOERS') return null
  if (laatste.stand !== 'TE_LANGZAAM' && laatste.stand !== 'TE_SNEL') return null
  if (!Number.isFinite(laatste.vanPlan) || Math.abs(laatste.vanPlan) < 0.3) return null
  return {
    kg: Math.round(Math.abs(laatste.vanPlan) * 10) / 10,
    boven: laatste.vanPlan > 0,
    // Achterlopen op de afspraak (te langzaam) of juist voorlopen (te snel).
    achter: laatste.stand === 'TE_LANGZAAM',
  }
}

// De status zoals hij bovenaan het oordeel hoort te staan. Zegt het tempo
// "op koers" terwijl de stand achterloopt, dan is dat geen groen vinkje.
export function weergaveStatus(laatste) {
  const afw = standAfwijking(laatste)
  if (!afw) return laatste?.status
  return afw.achter ? 'ACHTER_OP_PLAN' : 'VOOR_OP_PLAN'
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
    // Het tempo klopt. Maar staat hij ondertussen naast de lijn, dan is er wel
    // degelijk een besluit te nemen: inlopen of de lijn verleggen.
    const afw = standAfwijking(laatste)
    if (!afw) return { toon: 'goed', tekst: 'Op koers. Niets veranderen.' }
    const waar = `${afw.kg} kg ${afw.boven ? 'boven' : 'onder'} de plan-lijn`
    if (afw.achter) {
      return {
        toon: 'kijk',
        tekst: `Tempo klopt, maar hij staat ${waar}. Op dit tempo loopt hij dat niet in: kies bewust — tijdelijk scherper sturen, of de lijn verleggen naar waar hij nu staat.`,
      }
    }
    return {
      toon: 'goed',
      tekst: `Tempo klopt en hij loopt voor op schema (${waar}). Niets veranderen.`,
    }
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
  // `kcal` is de stap die we voorstellen, in kcal per dag, met het teken erin.
  // Het midden van de bandbreedte uit de richtlijn: daar begin je mee, en na
  // twee weken meten weet je of het genoeg was.
  if (laatste.status === 'TE_SNEL') {
    return aankomen
      ? { toon: 'let_op', kcal: -150, tekst: 'Twee weken te snel aangekomen. Dit wordt vooral vet: 100-200 kcal eraf, of meer stappen — niet allebei.' }
      : {
        toon: 'let_op', kcal: 200,
        tekst: config.kwetsbaar
          ? 'Twee weken te snel, en deze klant is lean of ouder: 150-250 kcal erbij, en check de eiwitinname.'
          : 'Twee weken te snel. 150-250 kcal erbij om spierverlies te voorkomen.',
      }
  }
  // TE_LANGZAAM
  return aankomen
    ? { toon: 'let_op', kcal: 200, tekst: 'Twee weken te langzaam aangekomen. Check of hij zijn calorieën haalt; zo ja, 150-250 kcal erbij.' }
    : { toon: 'let_op', kcal: -150, tekst: 'Twee weken te langzaam. Check eerst de trouw (logt hij echt alles?); klopt dat, dan 100-200 kcal eraf óf meer stappen — niet allebei.' }
}

// Van weektempo naar dagelijks tekort of surplus.
//
// Een kilo lichaamsvet is ruwweg 7700 kcal, dus een kilo per week is 1100 kcal
// per dag. Bij een build klopt die som maar half — je bouwt ook spier en dat
// kost minder — maar als startpunt voor het gesprek is hij bruikbaar, en de
// coach past hem toch aan.
export const kcalPerWeektempo = (kgPerWeek) => {
  const n = Number(kgPerWeek)
  if (!Number.isFinite(n) || n === 0) return 0
  return Math.round((n * 7700 / 7) / 25) * 25
}

export const STATUS_TEKST = {
  OP_KOERS: 'Op koers',
  ACHTER_OP_PLAN: 'Achter op plan',
  VOOR_OP_PLAN: 'Voor op plan',
  TE_VROEG: 'Net begonnen',
  TE_SNEL: 'Te snel',
  TE_LANGZAAM: 'Te langzaam',
  ONVOLDOENDE_DATA: 'Te weinig metingen',
  GEEN_DATA: 'Nog geen data',
}

// Het gemeten tempo in kilo's per week: de helling van een rechte lijn door de
// metingen van de afgelopen twee weken.
//
// Waarom een helling en geen "deze week min vorige week": dat verschil kantelt
// compleet door één uitschieter, en in de eerste dagen van een week vergelijk
// je één ochtend met een volle week. Een helling gebruikt alles wat er ligt en
// trekt zich van een losse gekke dag weinig aan.
export function tempoPerWeek(history, dagenTerug = 14) {
  const grens = new Date()
  grens.setDate(grens.getDate() - dagenTerug)
  const punten = (history || [])
    .map(e => ({ t: new Date(`${String(e?.date || '').slice(0, 10)}T00:00:00`).getTime(), w: parseFloat(e?.weight) }))
    .filter(p => Number.isFinite(p.w) && Number.isFinite(p.t) && p.t >= grens.getTime())
    .sort((a, b) => a.t - b.t)
  if (punten.length < 3) return null

  const eerste = punten[0].t
  const x = punten.map(p => (p.t - eerste) / (7 * dagInMs))   // in weken
  const y = punten.map(p => p.w)
  const n = x.length
  const gemX = x.reduce((s, v) => s + v, 0) / n
  const gemY = y.reduce((s, v) => s + v, 0) / n
  let teller = 0, noemer = 0
  for (let i = 0; i < n; i++) {
    teller += (x[i] - gemX) * (y[i] - gemY)
    noemer += (x[i] - gemX) ** 2
  }
  if (noemer === 0) return null
  return { kgPerWeek: Math.round((teller / noemer) * 100) / 100, metingen: n }
}

// Hoe ver zit de trend buiten de band, gemeten in bandbreedtes? 0 = keurig
// binnen, 1 = een hele bandbreedte ernaast. Dat is de maat voor de kleur van de
// lijn: dezelfde 0,4 kg betekent iets anders bij een cut van 1 kg per week dan
// bij een build van 0,25.
export function ernstVan(trend, lijnen) {
  if (!Number.isFinite(trend) || !lijnen) return null
  const hoog = Math.max(lijnen.traag, lijnen.snel)
  const laag = Math.min(lijnen.traag, lijnen.snel)
  const buiten = trend > hoog ? trend - hoog : (trend < laag ? laag - trend : 0)
  if (buiten === 0) return 0
  const breedte = Math.max(0.2, hoog - laag)
  return Math.min(1, buiten / breedte)
}

// Groen binnen de band, daarbuiten oplopend van oranje naar rood.
export function kleurVoorErnst(ernst) {
  if (ernst == null) return 'rgba(255,255,255,0.75)'
  if (ernst <= 0) return '#10b981'
  const van = [245, 158, 11]   // amber
  const naar = [239, 68, 68]   // rood
  const m = van.map((v, i) => Math.round(v + (naar[i] - v) * ernst))
  return `rgb(${m[0]}, ${m[1]}, ${m[2]})`
}

export const STATUS_KLEUR = {
  OP_KOERS: '#10b981',
  ACHTER_OP_PLAN: '#f59e0b',
  VOOR_OP_PLAN: '#10b981',
  TE_VROEG: 'rgba(255,255,255,0.35)',
  TE_SNEL: '#f59e0b',
  TE_LANGZAAM: '#f59e0b',
  ONVOLDOENDE_DATA: 'rgba(255,255,255,0.35)',
  GEEN_DATA: 'rgba(255,255,255,0.35)',
}
