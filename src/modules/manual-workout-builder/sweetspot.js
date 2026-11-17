// src/modules/manual-workout-builder/sweetspot.js
//
// Sweet spot finder (17 nov 2026, Kersten). Begint pas als de klant zelf laat
// weten dat hij meer kan en wil (vraag na de training). Vanaf dan elke week per
// spiergroep één set erbij zolang de klant herstelt, de training goed voelt en er tijd is, tot de
// bovenkant van de range (intermediair 12-16 sets per week). Remt het herstel
// of zakt de kracht, dan gaat de laatst toegevoegde set er weer af en staat die
// spier vast voor de rest van de fase. Er gaat nooit meer af dan die ene set.
//
// Dit bestand rekent alleen (geen database). Het laden en opslaan staat in
// sweetspotRun.js; de getallen en grenzen komen uit volumeRegels.js en
// volumeSuggesties.js, dezelfde als achter de knoppen in de builder.

import { volumeAdvies, plusEen } from './volumeSuggesties'
import { RANGE, ALLEEN_PLAFOND, GEEN_DOEL } from './volumeRegels'
import { spierLabel, spierVan } from './spierGroepen'

export const MAX_PLUS_PER_WEEK = 3   // sets erbij per klant per week, alle spieren samen
export const SCORE_MIN = 6           // gemiddeld cijfer van de laatste 2 trainingen; daaronder komt er niets bij
// In een cut het volume niet verhogen (regels-volume.md, regel 5). Op true gaat
// de finder ook in een cut door tot de bovenkant van de range.
export const OPBOUWEN_IN_CUT = false
// Deze spieren krijgen als eerste een set erbij (Kersten, 17 nov 2026).
export const VOORRANG = ['chest', 'back']

const sleutel = (n) => String(n || '').trim().toLowerCase()
const komma = (v) => String(Math.round(v * 10) / 10).replace('.', ',')

// days: de trainingen van de week (een training die twee keer in de week staat
//       komt er twee keer in voor), elk { id, name, exercises: [{ id, name, sets, … }] }.
// stand: { [spier]: { vast, laatste_plus: { dayId, naam, naar } } } uit sweetspot_stand.
// lang: Set dag-ids waar de klant de training te lang vond. scores: laatste cijfers (nieuwste eerst).
// wilMeer: het laatste antwoord van de klant na een training was "ik kan en wil meer".
//          Zonder dat komt er nooit iets bij; de rem werkt altijd.
// Geeft { wijzigingen: [{ spier, dayId, exId, naam, dagNaam, van, naar, reden }], meldingen: [tekst],
//         stand: { [spier]: { frac, doel: [lo, hi], uitkomst, vast } }, nieuweStand: { [spier]: {...} } }.
export function sweetspotStap({ days = [], ctx = {}, herstel = {}, budget = 90, factor = 1, stand = {}, lang = new Set(), scores = [], wilMeer = false }) {
  const status = RANGE[ctx.status] ? ctx.status : 'intermediate'
  const [lo, hi] = RANGE[status].bulk
  const advies = volumeAdvies({ days, ctx, herstel, budget, factor })
  // Werkkopie: elke set die erbij komt telt mee voor de volgende keuze.
  const kopie = new Map()
  const werk = days.map(d => {
    if (!kopie.has(d.id)) kopie.set(d.id, { ...d, exercises: (d.exercises || []).map(ex => ({ ...ex })) })
    return kopie.get(d.id)
  })
  const uit = { wijzigingen: [], meldingen: [], stand: {}, nieuweStand: {} }
  const cut = ctx.fase === 'cut' && !OPBOUWEN_IN_CUT
  const gemScore = scores.length ? scores.slice(0, 2).reduce((n, x) => n + x, 0) / Math.min(2, scores.length) : null
  const voeltSlecht = gemScore != null && gemScore < SCORE_MIN
  if (wilMeer && cut) uit.meldingen.push('Wil meer doen, maar zit in een cut: daar komt geen volume bij.')
  if (wilMeer && voeltSlecht) uit.meldingen.push(`De laatste trainingen voelden niet goed (gemiddeld ${komma(gemScore)}): er komt niets bij.`)
  if (lang.size) uit.meldingen.push('Training te lang gevonden: op die dag komt er niets bij.')

  const kandidaten = []
  for (const [spier, a] of Object.entries(advies)) {
    if (GEEN_DOEL.has(spier) || ALLEEN_PLAFOND.has(spier) || !(a.frac > 0)) continue
    const s = stand[spier] || {}
    const hv = herstel[spier]?.herstel?.[0]?.gevoel || null // 'nee' = hersteld, 'beetje', 'ja' = niet hersteld
    const pijn = [...(herstel[spier]?.pijnReeks || []), ...(herstel[spier]?.oefeningen || []).filter(r => r.gevoel === 'pijn').map(r => r.oefening)]
    const rij = { frac: a.frac, doel: [lo, hi], vast: !!s.vast, uitkomst: 'houden' }
    uit.stand[spier] = rij

    // Rem: niet hersteld, of kracht zakt twee weken (in een cut zegt dat niets over het volume).
    if (hv === 'ja' || (a.trend === 'daalt' && ctx.fase !== 'cut')) {
      const lp = s.laatste_plus
      const dag = lp ? kopie.get(lp.dayId) : null
      const ex = dag?.exercises.find(e => sleutel(e.name) === sleutel(lp.naam) && Number(e.sets) === Number(lp.naar) && Number(e.sets) > 1)
      const waarom = hv === 'ja' ? 'niet hersteld' : 'kracht zakt 2 weken'
      if (ex && !s.vast) {
        const van = Number(ex.sets)
        ex.sets = van - 1
        uit.wijzigingen.push({ spier, dayId: dag.id, exId: ex.id, naam: ex.name, dagNaam: dag.name, van, naar: van - 1, reden: `${waarom}: laatste set eraf` })
        uit.meldingen.push(`${spierLabel(spier)}: ${waarom}. De laatst toegevoegde set is eraf en deze spier staat vast.`)
        rij.uitkomst = 'terug'
      } else {
        if (!s.vast) uit.meldingen.push(`${spierLabel(spier)}: ${waarom}. Er komt niets meer bij; kijk of dit volume klopt.`)
        rij.uitkomst = 'rem'
      }
      rij.vast = true
      uit.nieuweStand[spier] = { vast: true, laatste_plus: null }
      continue
    }
    if (s.vast) { rij.uitkomst = 'vast'; continue }
    if (!wilMeer) { rij.uitkomst = 'klant vroeg niet om meer'; continue }
    if (cut || voeltSlecht) continue
    if (a.frac + 1 > hi) { rij.uitkomst = 'bovengrens'; continue }
    if (herstel[spier]?.pijnReeks?.length) { rij.uitkomst = 'pijn'; uit.meldingen.push(`${spierLabel(spier)}: 2 keer achter elkaar pijn bij een oefening. Eerst de oefening wisselen.`); continue }
    // Erbij: hersteld gemeld, of nog onder de ondergrens zonder tegenbericht.
    if (hv === 'nee' || (hv == null && a.frac < lo)) kandidaten.push({ spier, a, pijn, tekort: lo - a.frac })
    else rij.uitkomst = hv === 'beetje' ? 'matig hersteld' : 'geen herstelantwoord'
  }

  // Borst en rug eerst; daarna het grootste tekort, dan de spier met de minste sets.
  const rang = (k) => (VOORRANG.includes(k.spier) ? 0 : 1)
  kandidaten.sort((x, y) => rang(x) - rang(y) || y.tekort - x.tekort || x.a.frac - y.a.frac)
  for (const k of kandidaten) {
    if (uit.wijzigingen.filter(w => w.naar > w.van).length >= MAX_PLUS_PER_WEEK) { uit.stand[k.spier].uitkomst = 'volgende week'; continue }
    const w = plusEen({ days: werk, ctx, spier: k.spier, budget, pijn: k.pijn, geenPlus: lang })
    if (!w) {
      const eigen = werk.some(d => d.exercises.some(ex => ex.type !== 'cardio' && spierVan(ex) === k.spier))
      uit.stand[k.spier].uitkomst = eigen ? 'geen tijd of ruimte' : 'geen eigen oefening'
      if (k.tekort > 0) uit.meldingen.push(`${spierLabel(k.spier)}: ${komma(k.a.frac)} sets, onder de ${lo}, maar ${eigen ? 'geen training met tijd of ruimte over' : 'geen eigen oefening in het plan'}.`)
      continue
    }
    const dag = kopie.get(w.dayId)
    const ex = dag.exercises.find(e => e.id === w.exId)
    ex.sets = w.van + 1
    const reden = k.a.frac < lo ? `onder de ${lo} sets` : 'hersteld en training voelt goed'
    uit.wijzigingen.push({ spier: k.spier, dayId: w.dayId, exId: w.exId, naam: w.naam, dagNaam: w.dagNaam, van: w.van, naar: w.van + 1, reden })
    uit.stand[k.spier].uitkomst = 'erbij'
    uit.nieuweStand[k.spier] = { vast: false, laatste_plus: { dayId: w.dayId, naam: w.naam, naar: w.van + 1 } }
  }
  return uit
}
