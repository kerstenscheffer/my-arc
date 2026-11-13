// src/modules/manual-workout-builder/volumeSuggesties.js
//
// Suggesties voor volume per spiergroep (10 nov 2026). Leest het plan, de klant
// (trainingsstatus, fase, leeftijd), het herstel en de prestaties, en zegt per
// spier: omhoog, omlaag, houden of let op, met de reden. Getallen en drempels
// staan in volumeRegels.js. Niets gaat vanzelf: `wijzigingen` is wat de knop
// doet als de coach hem indrukt.

import { spierVan } from './spierGroepen'
import { dekkingKoppen, kopVan, kopLabel, ONDERRUG_DIRECT, ONDERRUG_HEUP } from './koppen'
import { minutenVoorOefeningen, MIN_PER_EXTRA_SET } from './trainingsTijd'
import {
  RANGE, MAX_PER_SESSIE, MAX_PER_SESSIE_40PLUS, LEEFTIJD_40PLUS, MIN_FREQUENTIE, FACTOR, ALLEEN_PLAFOND, GEEN_DOEL,
  SYNERGIST_GEWICHT, SYNERGISTEN_OP_NAAM, MAX_SETS_PER_TRAINING, MAX_SETS_PER_TRAINING_40PLUS, ZWAAR, ZWAAR_VANAF_PLEK, TREK, BOVEN_DRUK, HEUP, STIJGING_MIN, DALING_MIN, PLUS_PER_STAP, MAX_STAP, MIN_FRACTIE, LABEL_STATUS, LABEL_FASE,
} from './volumeRegels'

const rond = (v) => Math.round(v * 10) / 10
const sleutel = (naam) => String(naam || '').trim().toLowerCase()

// Synergisten van een oefening als [[spier, gewicht]]: bibliotheek eerst, anders op
// naam. Het gewicht komt uit de naamregel als die er een heeft (been-compounds = 1),
// ook als de spieren uit de bibliotheek komen.
function synergistenVan(ex, secMap, primair) {
  const naam = ex.name || ''
  const regel = SYNERGISTEN_OP_NAAM.find(([re]) => re.test(naam))
  const gewicht = regel?.[2] ?? SYNERGIST_GEWICHT
  const uitBib = secMap?.[sleutel(naam)]
  const ruw = Array.isArray(uitBib) && uitBib.length ? uitBib : (regel?.[1] || [])
  const fijn = (s) => {
    const k = String(s).trim().toLowerCase()
    if (k === 'shoulders' || k === 'delts') return TREK.test(naam) ? 'rear_delts' : BOVEN_DRUK.test(naam) ? 'side_delts' : 'front_delts'
    if (k === 'legs') return HEUP.test(naam) ? 'hamstrings' : 'quads'
    return spierVan({ primairSpieren: k })
  }
  const spieren = [...new Set(ruw.map(fijn))].filter(s => s !== primair && s !== 'onbekend')
  // Volle telling alleen voor de spieren die de regel noemt (billen bij een squat),
  // niet voor wat de bibliotheek er nog bij zet (bv. buik): die blijven half.
  const vol = new Set((regel?.[1] || []).map(fijn))
  return spieren.map(s => [s, vol.has(s) ? gewicht : SYNERGIST_GEWICHT])
}

// Fractionele sets per spier voor een lijst oefeningen: { spier: { frac, direct } }.
export function fractioneleSets(exercises = [], secMap = {}) {
  const t = {}
  const bij = (k, frac, direct) => { const x = t[k] || (t[k] = { frac: 0, direct: 0 }); x.frac += frac; x.direct += direct }
  for (const ex of exercises) {
    if (ex.type === 'cardio') continue
    const sets = Number(ex.sets) || 0
    if (!sets) continue
    const p = spierVan(ex)
    bij(p, sets, sets)
    for (const [s, w] of synergistenVan(ex, secMap, p)) bij(s, sets * w, 0)
  }
  return t
}

// Kracht per spier uit de logs: 'stijgt' | 'stagneert' | 'daalt' | null (te weinig data).
// Alleen oefeningen die nu in het plan staan (de indexoefeningen).
function trendPerSpier(days, logs = []) {
  const spierVanNaam = {}
  for (const d of days) for (const ex of d.exercises || []) if (ex.type !== 'cardio') spierVanNaam[sleutel(ex.name)] = spierVan(ex)
  const perOef = {}
  for (const r of logs) {
    const k = sleutel(r.naam)
    if (!spierVanNaam[k] || !(r.kracht > 0)) continue
    const d = new Date(`${String(r.datum).slice(0, 10)}T12:00:00`)
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
    const w = d.toISOString().slice(0, 10)
    const o = perOef[k] || (perOef[k] = {})
    o[w] = Math.max(o[w] || 0, r.kracht)
  }
  const telling = {}
  const oef = {} // naam → { soort|null, pct } over de laatste (max) 3 weken
  const pctSpier = {}
  for (const [k, wk] of Object.entries(perOef)) {
    const ws = Object.keys(wk).sort().slice(-3)
    if (ws.length >= 2) {
      const pct = (wk[ws[ws.length - 1]] / wk[ws[0]] - 1) * 100
      oef[k] = { soort: null, pct }
      ;(pctSpier[spierVanNaam[k]] = pctSpier[spierVanNaam[k]] || []).push(pct)
    }
    if (ws.length < 3) continue
    const [a, b, c] = ws.map(w => wk[w])
    const stap1 = b / a - 1, stap2 = c / b - 1
    const soort = stap1 < -DALING_MIN && stap2 < -DALING_MIN ? 'daalt'
      : stap1 < STIJGING_MIN && stap2 < STIJGING_MIN ? 'stagneert' : 'stijgt'
    oef[k].soort = soort
    const s = spierVanNaam[k]
    const x = telling[s] || (telling[s] = { stijgt: 0, stagneert: 0, daalt: 0 })
    x[soort]++
  }
  const uit = {}
  for (const [s, x] of Object.entries(telling)) {
    uit[s] = x.stijgt > 0 ? 'stijgt' : x.daalt > x.stagneert ? 'daalt' : 'stagneert'
  }
  const pct = Object.fromEntries(Object.entries(pctSpier).map(([s, l]) => [s, l.reduce((a, b) => a + b, 0) / l.length]))
  return { perSpier: uit, perOef: oef, pct }
}

// Max harde sets per training voor deze klant.
export function maxSetsPerTraining(ctx = {}) {
  const status = MAX_SETS_PER_TRAINING[ctx.status] ? ctx.status : 'intermediate'
  const m = MAX_SETS_PER_TRAINING[status]
  return Number(ctx.leeftijd) >= LEEFTIJD_40PLUS ? Math.min(m, MAX_SETS_PER_TRAINING_40PLUS) : m
}
// Directe sets van een training (cardio telt niet).
export const setsVanTraining = (exercises = []) => exercises.reduce((n, ex) => n + (ex.type === 'cardio' ? 0 : (Number(ex.sets) || 0)), 0)
// Zware compound die pas laat komt, na lichter werk: { naam, plek } of null.
export function zwaarTeLaat(exercises = []) {
  const lijst = exercises.filter(ex => ex.type !== 'cardio')
  for (let i = ZWAAR_VANAF_PLEK; i < lijst.length; i++) {
    if (ZWAAR.test(lijst[i].name || '') && lijst.slice(0, i).some(ex => !ZWAAR.test(ex.name || ''))) return { naam: lijst[i].name, plek: i + 1 }
  }
  return null
}

// ctx: { status, fase, leeftijd, secMap, logs }
// herstel: uit useHerstel ({ spier: { stand: 'groen'|'oranje'|'rood' } })
// budget: max minuten per training
// factor: 7 / cycluslengte (sets per cyclus → per week). rust: { spier: kleinste aantal
// rustdagen tussen twee trainingen van die spier } (cyclus.js).
export function volumeAdvies({ days = [], ctx = {}, herstel = {}, budget = 90, factor = 1, rust = {} }) {
  const status = RANGE[ctx.status] ? ctx.status : 'intermediate'
  const fase = ['bulk', 'onderhoud', 'cut'].includes(ctx.fase) ? ctx.fase : 'onderhoud'
  const plus40 = Number(ctx.leeftijd) >= LEEFTIJD_40PLUS
  const maxSessie = plus40 ? Math.min(MAX_PER_SESSIE[status], MAX_PER_SESSIE_40PLUS) : MAX_PER_SESSIE[status]
  const secMap = ctx.secMap || {}
  const maxTraining = maxSetsPerTraining({ ...ctx, status })
  const { perSpier: trend, perOef: trendOef, pct: krachtPct } = trendPerSpier(days, ctx.logs)

  const perDag = days.map(d => ({ dag: d, sets: fractioneleSets(d.exercises || [], secMap), min: minutenVoorOefeningen(d.exercises || []), totaal: setsVanTraining(d.exercises || []) }))
  const week = fractioneleSets(days.flatMap(d => d.exercises || []), secMap)
  const uit = {}

  for (const [spier, perCyclus] of Object.entries(week)) {
    // Per week: een cyclus van 9 dagen telt voor 7/9.
    const frac = perCyclus.frac * factor
    const direct = Math.round(perCyclus.direct * factor * 10) / 10
    const freq = Math.round(perDag.filter(p => (p.sets[spier]?.frac || 0) > 0).length * factor * 10) / 10
    const hoogsteSessie = Math.max(0, ...perDag.map(p => p.sets[spier]?.frac || 0))
    const [lo, hi, startW] = RANGE[status][fase]
    const f = FACTOR[spier] || 1
    const range = GEEN_DOEL.has(spier) ? null : [ALLEEN_PLAFOND.has(spier) ? 0 : rond(lo * f), rond(hi * f)]
    // Een blok begint aan de onderkant: in een build mag je op de startwaarde zitten.
    const vloer = range ? (ALLEEN_PLAFOND.has(spier) ? 0 : rond((startW ?? lo) * f)) : 0
    const h = herstel[spier]?.stand || null
    const t = trend[spier] || null
    const a = { spier, frac: rond(frac), direct, freq, hoogsteSessie: rond(hoogsteSessie), maxSessie, range, herstel: h, trend: t, oordeel: 'houden', tekst: '', redenen: [], actie: null }

    const redenTrend = t === 'stijgt' ? 'kracht stijgt' : t === 'stagneert' ? 'kracht staat 2 weken stil' : t === 'daalt' ? 'kracht daalt 2 weken' : null
    // Reden uit de herstelvraag zelf, niet uit de stip (die telt pijn ook mee).
    const hv = herstel[spier]?.herstel?.[0]?.gevoel
    const redenHerstel = hv === 'nee' ? 'goed hersteld' : hv === 'beetje' ? 'matig hersteld' : null
    if (redenHerstel) a.redenen.push(redenHerstel)
    if (redenTrend) a.redenen.push(redenTrend)

    // Pijntje bij een oefening ligt meestal aan die oefening (vooral borst), niet aan
    // het volume. Pas bij 2 trainingen achter elkaar pijn: wisselen, sets blijven
    // staan. Eén keer: alleen in de gaten houden (Kersten, 10 nov 2026).
    // Alleen echt niet hersteld (herstel 'ja') blijft een reden voor minder sets.
    const pijnReeks = (herstel[spier]?.pijnReeks || []).map(sleutel)
    const pijnEens = [...new Set((herstel[spier]?.oefeningen || []).filter(r => r.gevoel === 'pijn').map(r => r.oefening))].filter(n => !pijnReeks.includes(sleutel(n)))
    const pijnInPlan = days.flatMap(d => (d.exercises || []).filter(ex => pijnReeks.includes(sleutel(ex.name))).map(ex => ({ d, ex })))
    const nietHersteld = herstel[spier]?.herstel?.[0]?.gevoel === 'ja'
    a.redenen = a.redenen.filter(r => r !== 'niet hersteld of pijntje')
    if (nietHersteld) a.redenen.unshift('niet hersteld')
    if (pijnEens.length) a.redenen.push(`1x pijntje bij ${pijnEens.join(', ')}: in de gaten houden`)

    if (pijnReeks.length && !nietHersteld) {
      a.oordeel = 'let op'
      a.redenen.unshift('2 trainingen achter elkaar pijn')
      if (pijnInPlan.length) {
        a.tekst = `2x achter elkaar pijn bij ${pijnInPlan[0].ex.name}: wissel die oefening, sets blijven gelijk.`
        a.actie = { soort: 'wissel' }
        a.wissel = pijnInPlan.map(({ d, ex }) => ({ dayId: d.id, exId: ex.id, naam: ex.name, dagNaam: d.name }))
      } else {
        a.tekst = 'Pijntje gemeld bij een oefening die niet meer in het plan staat.'
      }
    } else if (!range) {
      a.oordeel = 'geen'
      a.tekst = 'Geen weekdoel voor deze spiergroep.'
    } else if (nietHersteld || (t === 'daalt' && fase !== 'cut')) {
      a.oordeel = 'omlaag'
      a.tekst = 'Te veel: deze week 1/3 minder sets voor deze spier.'
      a.actie = { soort: 'min', aantal: Math.max(1, Math.round(direct * MIN_FRACTIE)) }
    } else if (t === 'daalt' && fase === 'cut') {
      a.oordeel = 'let op'
      a.tekst = frac <= range[1]
        ? 'Kracht daalt in de cut terwijl het volume al laag staat: eerder calorieën, eiwit of slaap dan te weinig sets.'
        : 'Kracht daalt in de cut: volume terug naar de range.'
      if (frac > range[1]) a.actie = { soort: 'min', aantal: Math.min(MAX_STAP, Math.max(1, Math.ceil(frac - range[1]))) }
    } else if (frac < vloer) {
      const tekort = Math.ceil(vloer - frac)
      const stap = Math.min(MAX_STAP, tekort)
      a.oordeel = 'omhoog'
      a.tekst = tekort > stap
        ? `Onder de ondergrens van ${String(vloer).replace('.', ',')} sets: +${stap} deze week, daarna verder opbouwen.`
        : `Onder de ondergrens van ${String(vloer).replace('.', ',')} sets: +${stap}.`
      a.actie = { soort: 'plus', aantal: stap }
    } else if (frac > range[1]) {
      a.oordeel = 'omlaag'
      a.tekst = fase === 'cut' ? `Boven de ${range[1]} sets: in een cut presteert minder volume even goed.` : `Boven de bovengrens van ${range[1]} sets.`
      a.actie = { soort: 'min', aantal: Math.min(MAX_STAP, Math.max(1, Math.ceil(frac - range[1]))) }
    } else if (fase === 'cut') {
      a.tekst = 'Binnen de range. In een cut het volume niet verhogen; gewichten vasthouden.'
    } else if (h === 'groen' && t === 'stagneert') {
      if (frac + PLUS_PER_STAP <= range[1]) {
        a.oordeel = 'omhoog'
        a.tekst = 'Herstel schoon en kracht staat stil: +1 set.'
        a.actie = { soort: 'plus', aantal: PLUS_PER_STAP }
      } else {
        a.oordeel = 'let op'
        a.tekst = 'Op de bovengrens en kracht staat stil: denk aan een deload of een extra sessie.'
      }
    } else if (t === 'stijgt') {
      a.tekst = 'Binnen de range en kracht stijgt: zo laten.'
    } else {
      a.tekst = 'Binnen de range.'
    }

    // Frequentie en per-sessie plafond: altijd melden, los van het oordeel.
    if (range && frac > 0 && freq < MIN_FREQUENTIE) a.redenen.push(`maar ${String(freq).replace('.', ',')}x per week (minimaal ${MIN_FREQUENTIE}x)`)
    if (rust[spier] === 0) a.redenen.push('2 dagen achter elkaar getraind, geen rustdag ertussen')
    if (range && hoogsteSessie > maxSessie) a.redenen.push(`${rond(hoogsteSessie)} sets in één training (max ${maxSessie})`)

    // Wat de knop doet.
    if (a.actie?.soort === 'plus') a.wijzigingen = plusPlan(perDag, spier, a.actie.aantal, maxSessie, budget, new Set([...pijnReeks, ...pijnEens.map(sleutel)]), maxTraining)
    if (a.actie?.soort === 'min') a.wijzigingen = minPlan(days, spier, a.actie.aantal)
    if (a.actie && a.actie.soort !== 'wissel' && !a.wijzigingen?.length) {
      if (a.actie.soort === 'plus') {
        const eigen = days.some(d => (d.exercises || []).some(ex => ex.type !== 'cardio' && spierVan(ex) === spier))
        const vol = perDag.some(p => p.totaal + 1 > maxTraining && (p.sets[spier]?.frac || 0) > 0)
        a.tekst += !eigen ? ' Er staat geen eigen oefening voor deze spier in het plan: voeg er een toe.'
          : vol ? ` Geen ruimte: de trainingen zitten vol (max ${maxTraining} sets per training). Extra training of deload.`
            : ' Geen training met tijd of ruimte over.'
      }
      a.actie = null
    }
    a.context = `${LABEL_STATUS[status]} · ${LABEL_FASE[fase]}${plus40 ? ' · 40+' : ''}`
    a.bronnen = bronnenVan(days, spier, secMap)
    a.krachtPct = krachtPct[spier] ?? null
    // Per oefening: kracht laatste weken en de laatste feedback van de klant.
    const fbRijen = herstel[spier]?.oefeningen || []
    for (const b of a.bronnen) {
      b.kracht = trendOef[sleutel(b.naam)] || null
      b.feedback = fbRijen.find(r => sleutel(r.oefening) === sleutel(b.naam)) || null
    }
    // Koppen: directe oefeningen plus compounds die volledig meetellen (hack squat
    // voor billen), die laatste als deze spier gelezen.
    const volle = days.flatMap(d => d.exercises || []).filter(ex => ex.type !== 'cardio').flatMap(ex => {
      const p = spierVan(ex)
      // Onderrug: direct werk en heup-strekkers tellen voor de kop, ook als ze bij
      // hamstrings/billen horen. Alleen dekking; de rug-sets veranderen niet.
      if (spier === 'back' && (ONDERRUG_DIRECT.test(ex.name || '') || ONDERRUG_HEUP.test(ex.name || ''))) return [{ ...ex, primairSpieren: 'back', kop: 'onderrug' }]
      if (p === spier) return [ex]
      return synergistenVan(ex, secMap, p).some(([s, w]) => s === spier && w >= 1) ? [{ ...ex, primairSpieren: spier, kop: null }] : []
    })
    a.koppen = dekkingKoppen(volle, spier)
    uit[spier] = a
  }
  return uit
}

// Sets erbij: telkens op de oefening met de minste sets, op een dag waar tijd en
// het per-sessie plafond het toelaten. Liefst een dag die de spier nog niet traint
// als hij onder de minimale frequentie zit; dat lukt alleen als er daar een oefening
// van die spier staat, dus anders de laagste.
function plusPlan(perDag, spier, aantal, maxSessie, budget, pijn = new Set(), maxTraining = Infinity) {
  const stand = perDag.map(p => ({ dag: p.dag, min: p.min, totaal: p.totaal, frac: p.sets[spier]?.frac || 0, oefs: (p.dag.exercises || []).map((ex, plek) => ({ ex, plek, sets: Number(ex.sets) || 2, van: Number(ex.sets) || 2 })) }))
  const wijz = []
  for (let i = 0; i < aantal; i++) {
    let beste = null
    for (const d of stand) {
      if (d.min + MIN_PER_EXTRA_SET > budget || d.frac + 1 > maxSessie || d.totaal + 1 > maxTraining) continue
      for (const o of d.oefs) {
        if (o.ex.type === 'cardio' || o.ex.power || spierVan(o.ex) !== spier || pijn.has(sleutel(o.ex.name))) continue // geen set erbij op een oefening met pijn, en niet op power
        // Minste sets eerst; gelijk: liefst vooraan in de training (output is daar hoger),
        // dan de dag waar deze spier het minst krijgt.
        if (!beste || o.sets < beste.o.sets || (o.sets === beste.o.sets && (o.plek < beste.o.plek || (o.plek === beste.o.plek && d.frac < beste.d.frac)))) beste = { d, o }
      }
    }
    if (!beste) break
    beste.o.sets++; beste.d.frac++; beste.d.min += MIN_PER_EXTRA_SET; beste.d.totaal++
    wijz.push({ dayId: beste.d.dag.id, exId: beste.o.ex.id, naam: beste.o.ex.name, dagNaam: beste.d.dag.name, van: beste.o.van, delta: 1 })
  }
  return samenvoegen(wijz)
}

// Sets eraf: telkens van de oefening met de meeste sets, nooit onder 1.
function minPlan(days, spier, aantal) {
  const oefs = days.flatMap(d => (d.exercises || []).filter(ex => ex.type !== 'cardio' && spierVan(ex) === spier)
    .map(ex => ({ d, ex, sets: Number(ex.sets) || 2, van: Number(ex.sets) || 2 })))
  const wijz = []
  for (let i = 0; i < aantal; i++) {
    const o = oefs.filter(x => x.sets > 1).sort((a, b) => b.sets - a.sets)[0]
    if (!o) break
    o.sets--
    wijz.push({ dayId: o.d.id, exId: o.ex.id, naam: o.ex.name, dagNaam: o.d.name, van: o.van, delta: -1 })
  }
  return samenvoegen(wijz)
}

// Welke oefeningen tellen mee voor deze spier: per oefening (zelfde naam samen) de
// sets, het gewicht (1 = direct, 0,5 = via compound) en op welke dagen.
function bronnenVan(days, spier, secMap) {
  const m = new Map()
  for (const d of days) {
    for (const ex of d.exercises || []) {
      if (ex.type === 'cardio') continue
      const sets = Number(ex.sets) || 0
      if (!sets) continue
      const p = spierVan(ex)
      const w = p === spier ? 1 : (synergistenVan(ex, secMap, p).find(([s]) => s === spier)?.[1] || 0)
      if (!w) continue
      const k = sleutel(ex.name)
      const x = m.get(k) || { naam: ex.name, sets: 0, gewicht: w, dagen: [], items: [], kop: p === spier ? kopLabel(spier, kopVan(ex)) : null }
      x.sets += sets
      x.items.push({ dayId: d.id, exId: ex.id, dagNaam: d.name, sets })
      if (d.name && !x.dagen.includes(d.name)) x.dagen.push(d.name)
      m.set(k, x)
    }
  }
  return [...m.values()].sort((a, b) => b.gewicht - a.gewicht || b.sets * b.gewicht - a.sets * a.gewicht)
}

function samenvoegen(wijz) {
  const m = new Map()
  for (const w of wijz) {
    const k = `${w.dayId}|${w.exId}`
    if (m.has(k)) m.get(k).delta += w.delta; else m.set(k, { ...w })
  }
  return [...m.values()]
}
