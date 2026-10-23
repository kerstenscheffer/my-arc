// src/pages/mijn-menu/menuRegels.js
// De rekenkern van /mijn-menu, los van de UI zodat hij zonder React te testen is.
//
//   1. Caloriedoel: Mifflin-St Jeor × activiteit. Vet verliezen bij mannen gaat
//      via bereken() van de calorie-calculator (Kerstens regel: −800, nooit
//      onder 1500, eiwit 2 g/kg, vet 1 g/kg). Vrouwen −500 met bodem 1200.
//      Spier opbouwen +250, allebei = onderhoud. (Aannames 23 okt 2026, Kersten
//      stuurt bij.)
//   2. Gerechten: de dagmenu- en wisselgerechten (get_mijn_menu_maaltijden).
//      Elk gerecht bestaat in meerdere calorieniveaus; we nemen per moment de
//      versie die het dichtst bij het doel van dat moment ligt en schalen hem.
//   3. Schalen: alle grammen × factor. Telbare dingen (snee, stuk, plakje,
//      blik) op hele stuks, lepels op halve. Groente en fruit gaan niet
//      omlaag (volume). Het restverschil komt uit de grootste gram-component
//      (rijst, kwark, kip …), zodat het gerecht op zijn doel uitkomt.
import { bereken } from '../calorie-calculator/rekenen'

export const DOELEN = [
  { key: 'vetverlies', label: 'Vet verliezen' },
  { key: 'spiermassa', label: 'Spiermassa opbouwen' },
  { key: 'allebei', label: 'Allebei' },
]
export const GESLACHT = [{ key: 'man', label: 'Man' }, { key: 'vrouw', label: 'Vrouw' }]
export const ACTIVITEIT = [
  { key: 1.2, label: 'Zittend werk, weinig sport' },
  { key: 1.375, label: '1-3× per week trainen' },
  { key: 1.55, label: '3-5× per week trainen' },
  { key: 1.725, label: '6-7× per week trainen' },
  { key: 1.9, label: 'Fysiek werk én trainen' },
]
// Hoeveel afwisseling (23 okt 2026). 'vast' momenten zijn elke dag hetzelfde;
// wisselen op zo'n moment geldt dan voor de hele week.
export const VARIATIE = [
  { key: 'veel', label: 'Elke dag iets anders', vast: [] },
  { key: 'tussen', label: "Vaste basis, 's avonds variatie", vast: ['breakfast', 'lunch', 'snack'] },
  { key: 'weinig', label: 'Elke dag hetzelfde (makkelijkst)', vast: ['breakfast', 'lunch', 'dinner', 'snack'] },
]
export const vasteMomenten = (variatie) => (VARIATIE.find(v => v.key === variatie) || VARIATIE[0]).vast

export const MAALTIJDEN = [
  { key: 3, label: '3 maaltijden', sub: 'ontbijt, lunch, avondeten' },
  { key: 4, label: '4 maaltijden', sub: 'met een tussendoortje' },
]

// Verdeling van de dag, afgeleid van de dagmenu's (ontbijt 446, lunch 560,
// avond 643, snack 346 bij 2000 kcal).
export const MOMENTEN = {
  4: [['breakfast', 0.225], ['lunch', 0.28], ['dinner', 0.32], ['snack', 0.175]],
  3: [['breakfast', 0.27], ['lunch', 0.34], ['dinner', 0.39]],
}
export const MOMENT_NAAM = { breakfast: 'Ontbijt', lunch: 'Lunch', dinner: 'Avondeten', snack: 'Tussendoor' }

// ── Dieet en "lust ik niet" ─────────────────────────────────────────────────
// Op ingrediënt, niet op het allergenenveld van het gerecht: dat is in de
// database niet volledig (een wrap met ei zonder 'eggs').
const heeft = (re) => (i) => re.test(i.naam)
const allergeen = (...a) => (i) => (i.allergenen || []).some(x => a.includes(String(x).toLowerCase()))
export const DIEET = [
  { key: 'vlees', label: 'Geen vlees', past: heeft(/kip|gehakt|kalkoen|rookvlees|runder|ham\b|ham -|biefstuk|vlees/i) },
  { key: 'vis', label: 'Geen vis of schaaldieren', past: (i) => heeft(/zalm|tonijn|kabeljauw|garnalen|vis\b|makreel/i)(i) || allergeen('fish', 'shellfish', 'vis')(i) },
  { key: 'zuivel', label: 'Geen zuivel of lactose', past: (i) => i.categorie === 'dairy' || heeft(/whey|melk|kwark|yoghurt|skyr|kaas|room/i)(i) || allergeen('dairy', 'lactose', 'melk', 'milk', 'whey')(i) },
  // Havermout mag: glutenvrije havermout is gewoon te koop (tip in de PDF).
  { key: 'gluten', label: 'Glutenvrij', past: (i) => heeft(/brood|wrap|cracker|pasta|muesli|granola|couscous|sojasaus/i)(i) || (!/havermout/i.test(i.naam) && allergeen('gluten')(i)) },
  { key: 'ei', label: 'Geen ei', past: heeft(/\bei\b|eieren|egg/i) },
  { key: 'noten', label: 'Geen noten of pinda', past: (i) => heeft(/pinda|noot|noten|muesli|granola/i)(i) || allergeen('nuts', 'peanuts', 'noten')(i) },
]

// "Wat lust je echt niet?" — de ingrediënten die het vaakst terugkomen, in
// gewone woorden. Elke knop dekt alle varianten (kwark + skyr niet: los).
export const LUST_NIET = [
  { key: 'kwark', label: 'Kwark', re: /kwark/i },
  { key: 'skyr', label: 'Skyr of Griekse yoghurt', re: /skyr|yoghurt/i },
  { key: 'cottage', label: 'Cottage cheese', re: /cottage/i },
  { key: 'havermout', label: 'Havermout', re: /havermout/i },
  { key: 'eieren', label: 'Eieren', re: /eieren/i },
  { key: 'zalm', label: 'Zalm', re: /zalm/i },
  { key: 'tonijn', label: 'Tonijn', re: /tonijn/i },
  { key: 'garnalen', label: 'Garnalen', re: /garnalen/i },
  { key: 'gehakt', label: 'Gehakt', re: /gehakt/i },
  { key: 'avocado', label: 'Avocado', re: /avocado/i },
  { key: 'broccoli', label: 'Broccoli', re: /broccoli/i },
  { key: 'spinazie', label: 'Spinazie', re: /spinazie/i },
  { key: 'paprika', label: 'Paprika', re: /paprika/i },
  { key: 'ui', label: 'Ui', re: /^ui$/i },
  { key: 'bonen', label: 'Bonen', re: /bonen/i },
  { key: 'hummus', label: 'Hummus', re: /hummus/i },
  { key: 'zoete', label: 'Zoete aardappel', re: /zoete aardappel/i },
  { key: 'whey', label: 'Eiwitpoeder', re: /whey/i },
]

// ── Caloriedoel ─────────────────────────────────────────────────────────────

const num = (v) => { const n = parseFloat(String(v ?? '').replace(',', '.')); return isNaN(n) ? null : n }

export function berekenDoel({ geslacht, leeftijd, lengte, gewicht, activiteit, doel }) {
  const a = num(leeftijd), h = num(lengte), w = num(gewicht)
  if (!a || !h || !w || a < 15 || a > 90 || h < 130 || h > 230 || w < 40 || w > 250 || !activiteit) return null
  const vrouw = geslacht === 'vrouw'
  const tdee = Math.round((10 * w + 6.25 * h - 5 * a + (vrouw ? -161 : 5)) * activiteit)

  // Veel vet te verliezen (BMI 30 of hoger, doel vet eraf of allebei): vet op
  // 0,6 g per kilo in plaats van 1, de rest naar koolhydraten (Kersten, 23 okt
  // 2026). We vragen geen vetpercentage, dus de BMI is de graadmeter.
  const bmi = w / ((h / 100) ** 2)
  const veelVet = bmi >= 30 && doel !== 'spiermassa'
  const metVet = (c) => {
    if (!veelVet) return { ...c, vetPerKg: Math.round((c.vet / w) * 10) / 10 }
    const vet = Math.round(w * 0.6)
    return { ...c, vet, kh: Math.max(0, Math.round((c.kcal - c.eiwit * 4 - vet * 9) / 4)), vetPerKg: 0.6, veelVet: true }
  }

  // Man en vet verliezen: precies de calorie-calculator.
  if (!vrouw && doel === 'vetverlies') {
    const r = bereken({ leeftijd: a, lengte: h, gewicht: w, activiteit, vetNu: null, vetDoel: null })
    if (r) return metVet({ tdee: r.tdee, kcal: r.doel, eiwit: r.eiwit, vet: r.vet, kh: r.koolhydraten })
  }

  const bodem = vrouw ? 1200 : 1500
  const kcal = Math.round(Math.max(bodem,
    doel === 'vetverlies' ? tdee - 500 : doel === 'spiermassa' ? tdee + 250 : tdee))
  const eiwit = Math.round(Math.min(w, 120) * 2)
  let vet = Math.round(w * (vrouw ? 0.9 : 1))
  let kh = Math.round((kcal - eiwit * 4 - vet * 9) / 4)
  if (kh < 50) {
    vet = Math.max(Math.round(w * 0.6), Math.floor((kcal - eiwit * 4 - 200) / 9))
    kh = Math.max(0, Math.round((kcal - eiwit * 4 - vet * 9) / 4))
  }
  return metVet({ tdee, kcal, eiwit, vet, kh })
}

// ── Gerechten ───────────────────────────────────────────────────────────────

// Mag dit gerecht, gegeven dieet en "lust niet"?
export function magGerecht(g, { dieet = [], lustNiet = [] }) {
  const regels = DIEET.filter(d => dieet.includes(d.key))
  const niet = LUST_NIET.filter(l => lustNiet.includes(l.key))
  return !g.ingredienten.some(i => regels.some(r => r.past(i)) || niet.some(l => l.re.test(i.naam)))
}

// Per moment de gerechten op naam, elk met al zijn versies (niveaus). Eerst
// de kern (dagmenu- en wisselgerechten). Zijn dat er na de filters minder dan
// een week, dan aanvullen uit de reserve, eiwitrijkste eerst.
export const WEEK_MIN = 7
export function groepeer(maaltijden, filters) {
  const per = {}
  for (const g of maaltijden) {
    if (!magGerecht(g, filters)) continue
    const m = (per[g.moment] ||= { kern: new Map(), reserve: new Map() })
    const map = g.kern ? m.kern : m.reserve
    if (!map.has(g.naam)) map.set(g.naam, [])
    map.get(g.naam).push(g)
  }
  const naarLijst = (map) => [...map.entries()].map(([naam, versies]) => ({ naam, versies }))
  return Object.fromEntries(Object.entries(per).map(([moment, { kern, reserve }]) => {
    const lijst = naarLijst(kern)
    if (lijst.length < WEEK_MIN) {
      const extra = naarLijst(reserve)
        .filter(d => !kern.has(d.naam))
        .sort((a, b) => (b.versies[0].eiwit / b.versies[0].kcal) - (a.versies[0].eiwit / a.versies[0].kcal))
      lijst.push(...extra.slice(0, WEEK_MIN - lijst.length + 5))
    }
    return [moment, lijst]
  }))
}

const TELBAAR = new Set(['snee', 'stuk', 'plakje', 'blik'])
const LEPEL = new Set(['eetlepel', 'schep'])
const VOLUME = new Set(['vegetables', 'fruits'])
const kcalVan = (i) => (i.gram * (Number(i.kcal100) || 0)) / 100
const rond5 = (g) => (g >= 15 ? Math.round(g / 5) * 5 : Math.round(g))

// Eén gerecht naar een doel in kcal: dichtstbijzijnde versie, dan schalen.
export function schaal(dish, doelKcal) {
  const v = dish.versies.reduce((x, y) => (Math.abs(y.kcal - doelKcal) < Math.abs(x.kcal - doelKcal) ? y : x))
  const f = doelKcal / v.kcal
  let ingr = v.ingredienten.map(i => {
    const eenheid = i.eenheid && i.eenheid !== 'gram' && Number(i.gram_per_eenheid) > 0 ? i.eenheid : null
    const gpe = Number(i.gram_per_eenheid) || 0
    let gram = i.gram * (VOLUME.has(i.categorie) ? Math.max(1, f) : f)
    let stuks = null
    if (eenheid && TELBAAR.has(eenheid)) { stuks = Math.max(1, Math.round(gram / gpe)); gram = stuks * gpe }
    else if (eenheid && LEPEL.has(eenheid)) { stuks = Math.max(0.5, Math.round((gram / gpe) * 2) / 2); gram = stuks * gpe }
    else gram = Math.max(1, rond5(gram))
    return { ...i, gram, stuks, eenheid: stuks != null ? eenheid : null }
  })
  // Restverschil uit de grootste gram-component met calorieën (geen groente).
  const nu = ingr.reduce((s, i) => s + kcalVan(i), 0)
  const verschil = doelKcal - nu
  const stuur = ingr.filter(i => i.stuks == null && !VOLUME.has(i.categorie) && Number(i.kcal100) > 40)
    .sort((a, b) => kcalVan(b) - kcalVan(a))[0]
  if (stuur && Math.abs(verschil) > 15) {
    const nieuw = Math.max(stuur.gram * 0.5, stuur.gram + (verschil / Number(stuur.kcal100)) * 100)
    ingr = ingr.map(i => (i === stuur ? { ...i, gram: rond5(nieuw) } : i))
  }
  const som = (k) => Math.round(ingr.reduce((s, i) => s + (i.gram * (Number(i[k]) || 0)) / 100, 0))
  return {
    naam: v.naam, moment: v.moment, foto: v.foto, stappen: v.stappen, minuten: v.minuten, id: v.id,
    ingredienten: ingr, kcal: som('kcal100'), eiwit: som('eiwit100'), kh: som('kh100'), vet: som('vet100'),
  }
}

// Eenvoudige vaste shuffle: zelfde invoer = zelfde week (op het scherm en in
// de PDF hetzelfde), maar per persoon anders.
function schud(lijst, zaad) {
  let s = 0
  for (const c of String(zaad)) s = (s * 31 + c.charCodeAt(0)) >>> 0
  const uit = [...lijst]
  for (let i = uit.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) >>> 0
    const j = s % (i + 1)
    ;[uit[i], uit[j]] = [uit[j], uit[i]]
  }
  return uit
}

export const DAGEN = ['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag', 'Zondag']

// De week: per moment de gerechten in een vaste maar persoonlijke volgorde,
// dag 1 de eerste, dag 2 de tweede … Pas als er minder dan 7 zijn komt er
// een terug.
// Vaste momenten (variatie 'tussen'/'weinig') krijgen elke dag hetzelfde
// gerecht: het eiwitrijkste, want dat eet je zeven keer.
export function maakWeek(groepen, doel, aantal, zaad, variatie = 'veel') {
  const momenten = MOMENTEN[aantal] || MOMENTEN[4]
  const vast = vasteMomenten(variatie)
  const eiwitrijk = (l) => [...l].sort((a, b) => (b.versies[0].eiwit / b.versies[0].kcal) - (a.versies[0].eiwit / a.versies[0].kcal))
  const volgorde = Object.fromEntries(momenten.map(([m]) => [m, vast.includes(m) ? eiwitrijk(groepen[m] || []) : schud(groepen[m] || [], `${zaad}:${m}`)]))
  return DAGEN.map((dag, d) => ({
    dag,
    maaltijden: momenten.map(([m, deel]) => {
      const lijst = volgorde[m]
      if (!lijst.length) return { moment: m, leeg: true, doelKcal: Math.round(doel.kcal * deel) }
      const keuze = vast.includes(m) ? lijst[0] : lijst[d % lijst.length]
      return { ...schaal(keuze, Math.round(doel.kcal * deel)), doelKcal: Math.round(doel.kcal * deel) }
    }),
  }))
}

// Wisselen: andere gerechten van hetzelfde moment die nog niet op die dag staan.
export function alternatievenVoor(groepen, moment, dag) {
  const opDag = new Set(dag.maaltijden.map(x => x.naam))
  return (groepen[moment] || []).filter(g => !opDag.has(g.naam))
}

// Op een vast moment geldt de wissel voor de hele week.
export function wissel(week, groepen, dagIndex, plek, naam, variatie = 'veel') {
  const moment = week[dagIndex].maaltijden[plek].moment
  const dish = (groepen[moment] || []).find(g => g.naam === naam)
  if (!dish) return week
  const overal = vasteMomenten(variatie).includes(moment)
  return week.map((d, i) => (i !== dagIndex && !overal) ? d : {
    ...d,
    maaltijden: d.maaltijden.map((x, p) => p !== plek ? x : { ...schaal(dish, x.doelKcal), doelKcal: x.doelKcal, gewisseld: true }),
  })
}

export const dagTotaal = (dag) => dag.maaltijden.reduce((t, x) => ({
  kcal: t.kcal + (x.kcal || 0), eiwit: t.eiwit + (x.eiwit || 0), kh: t.kh + (x.kh || 0), vet: t.vet + (x.vet || 0),
}), { kcal: 0, eiwit: 0, kh: 0, vet: 0 })

// Hoeveelheid zoals je hem leest: "2 sneetjes", "1 el", "150 g".
const MEERVOUD = { snee: 'sneetjes', stuk: 'stuks', plakje: 'plakjes', blik: 'blikjes', eetlepel: 'el', schep: 'scheppen' }
const ENKEL = { snee: 'sneetje', stuk: 'stuk', plakje: 'plakje', blik: 'blikje', eetlepel: 'el', schep: 'schep' }
export function hoeveel(i) {
  if (i.stuks != null && i.eenheid) {
    const n = String(i.stuks).replace('.', ',')
    return `${n} ${i.stuks === 1 ? ENKEL[i.eenheid] : MEERVOUD[i.eenheid] || i.eenheid}`
  }
  return `${Math.round(i.gram)} g`
}

// Boodschappenlijst voor de hele week: per ingrediënt opgeteld, per afdeling.
const AFDELING = { protein: 'Vlees, vis en eiwit', dairy: 'Zuivel', carbs: 'Brood, granen en aardappel', vegetables: 'Groente', fruits: 'Fruit', fats: 'Vetten en noten', condiments: 'Overig', other: 'Overig' }
export function boodschappen(week) {
  const map = new Map()
  for (const d of week) for (const m of d.maaltijden) for (const i of (m.ingredienten || [])) {
    const k = i.naam
    const o = map.get(k) || { naam: i.naam, afdeling: AFDELING[i.categorie] || 'Overig', gram: 0, stuks: 0, eenheid: i.eenheid }
    o.gram += i.gram
    if (i.stuks != null && i.eenheid) o.stuks += i.stuks
    map.set(k, o)
  }
  const groepen = {}
  for (const o of map.values()) (groepen[o.afdeling] ||= []).push(o)
  return Object.entries(groepen).map(([afdeling, items]) => ({ afdeling, items: items.sort((a, b) => b.gram - a.gram) }))
    .sort((a, b) => Object.values(AFDELING).indexOf(a.afdeling) - Object.values(AFDELING).indexOf(b.afdeling))
}

// ── Wat je mag verwachten ───────────────────────────────────────────────────
// Verbranding (TDEE) tegenover wat je eet, per dag en per week, en wat dat
// ongeveer aan vet (of gewicht) doet. Zelfde vuistregel als de calorie-
// calculator: 7.700 kcal ≈ 1 kg vet. Bij spier opbouwen gaat het om gewicht
// (spier en een beetje vet), bij allebei blijft het gewicht ongeveer gelijk.
const KCAL_PER_KG = 7700
export const kgTekst = (n) => (Math.round(n * 10) / 10).toFixed(1).replace('.', ',')
export function verwachting(cijfers, doel) {
  if (!cijfers) return null
  const perDag = cijfers.kcal - cijfers.tdee            // negatief = tekort
  const perWeek = perDag * 7
  const kgPerWeek = Math.abs(perWeek) / KCAL_PER_KG
  const soort = perDag < -50 ? 'tekort' : perDag > 50 ? 'overschot' : 'onderhoud'
  const zin = soort === 'tekort'
    ? `Rond ${kgTekst(kgPerWeek)} kg vet per week, ongeveer ${kgTekst(kgPerWeek * 8)} kg in 8 weken.`
    : soort === 'overschot'
      ? `Rond ${kgTekst(kgPerWeek)} kg erbij per week, vooral spier als je zwaar traint.`
      : 'Je gewicht blijft ongeveer gelijk: vet eraf en spier erbij gaat tegelijk.'
  return { tdee: cijfers.tdee, eet: cijfers.kcal, perDag, perWeek, kgPerWeek, kgIn8: kgPerWeek * 8, soort, zin, doel }
}

// Kleuren per macro, zelfde als de ringen in de app (client/components/MacroBoxes).
export const MACRO = {
  kcal: { label: 'Kcal', kleur: '#10b981', rgb: [16, 185, 129] },
  kh: { label: 'Koolh.', kleur: '#ec4899', rgb: [236, 72, 153] },
  eiwit: { label: 'Eiwit', kleur: '#3b82f6', rgb: [59, 130, 246] },
  vet: { label: 'Vet', kleur: '#f59e0b', rgb: [245, 158, 11] },
}
// Welk deel van de calorieën uit een macro komt (eiwit/kh 4 kcal per gram, vet 9).
export const aandeel = (c) => {
  const k = { eiwit: c.eiwit * 4, kh: c.kh * 4, vet: c.vet * 9 }
  const tot = k.eiwit + k.kh + k.vet || 1
  return { eiwit: k.eiwit / tot, kh: k.kh / tot, vet: k.vet / tot }
}
