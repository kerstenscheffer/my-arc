// src/modules/meal-plan/utils/portieSchaal.js
//
// Wisselopties met dezelfde macro's (18 nov 2026, Kersten): bovenaan het
// wisselscherm staan gerechten die naar de maaltijd van de klant zijn
// geschaald, in hele porties. Nooit 2,5 ei of 500 g kip. Is een gerecht te
// mager, dan komt er een gewone vetbron bij (noten of een scheutje olie).
//
// De portieregels zijn dezelfde als in de edge function intake-maaltijden
// (supabase/functions/intake-maaltijden/index.ts). Pas je hier iets aan, doe
// het daar ook.

// [patroon, stap in gram, minimum, maximum, gewicht per stuk]. stap 0 = per
// stuk: min en max zijn dan stuks. De eerste regel die past wint.
const PORTIE = [
  [/rucola|\bsla\b|veldsla|ijsbergsla|spinazie|kruiden|koffie|espresso/, 10, 10, 60],
  [/\b(ei|eieren)\b|gekookt ei|gebakken ei|ei \(heel\)/, 0, 1, 5, 60],
  [/wrap|tortilla|pita|bagel|broodje|pistolet|bolletje/, 0, 1, 2, 60],
  [/cracker|beschuit|rijstwafel|knäckebröd|knackebrod|maiswafel|linzenwafel/, 0, 1, 5, 10],
  [/brood|boterham/, 35, 35, 140],
  [/whey|eiwitpoeder|proteinepoeder|proteïnepoeder|protein isolate|caseine|caseïne/, 15, 15, 45],
  [/kwark|skyr|yoghurt|cottage|hüttenkäse|huttenkase/, 50, 100, 500],
  [/melk|sojadrink|haverdrink|amandeldrink|karnemelk/, 50, 100, 400],
  [/havermout|muesli|cruesli|granola|cornflakes|brinta|gepofte/, 10, 20, 100],
  [/rijst|pasta|spaghetti|macaroni|penne|couscous|quinoa|noodles|\bmie\b|bulgur/, 10, 40, 125],
  [/aardappel|krieltjes|zoete aardappel/, 50, 100, 400],
  [/beleg|vleeswaren|achterham|\bham\b|rookvlees|rosbief|filet americain|plakken|plakjes/, 15, 15, 90],
  [/kip|kalkoen|rund|gehakt|biefstuk|zalm|tonijn|kabeljauw|\bvis\b|garnalen|tofu|tempeh|varkens/, 25, 75, 250],
  [/kaas|mozzarella|feta/, 10, 10, 60],
  [/\bolie\b|olijfolie|boter|margarine|halvarine/, 5, 5, 15],
  [/honing|jam|siroop|pindakaas|notenpasta|hummus|chocopasta|hagelslag|suiker/, 5, 5, 30],
  [/noten|amandel|walnoot|walnoten|pinda|cashew|chia|lijnzaad|zaden|pitten|kokos/, 5, 5, 30],
  [/banaan|appel|peer|sinaasappel|kiwi|mandarijn|perzik/, 0, 1, 2, 120],
  [/bosvruchten|bessen|aardbei|frambo|druiven|mango|ananas|fruit/, 25, 50, 200],
  [/avocado/, 25, 25, 100],
  [/broccoli|sperziebonen|bloemkool|courgette|paprika|wortel|tomaat|komkommer|groente|champignon|boontjes|spruit|prei|\bui\b/, 50, 50, 300],
]
const PER_STUK = /stuk|snee|plak|schep|wrap/

// Regel voor één ingrediënt. `orig` = de hoeveelheid in het recept: de portie
// blijft tussen 40% en 250% daarvan, zodat het gerecht herkenbaar blijft.
// Kleine smaakmakers zonder eigen regel staan vast (null).
export function portieRegel(ing, orig) {
  const naam = String(ing?.name || '').toLowerCase()
  // Groente (onder 40 kcal per 100 g) doet niets voor de macro's: die blijft zoals in het recept.
  if (Number(ing?.calories_per_100g) > 0 && Number(ing.calories_per_100g) < 40) return null
  const stuk = Number(ing?.gram_per_eenheid) > 0 && PER_STUK.test(String(ing?.eenheid || '')) ? Number(ing.gram_per_eenheid) : 0
  let regel = null
  for (const [re, stap, min, max, stukStandaard] of PORTIE) {
    if (!re.test(naam)) continue
    if (stap === 0) { const g = stuk || stukStandaard || 50; regel = { stap: g, min: min * g, max: max * g } } else regel = { stap, min, max }
    break
  }
  if (!regel) {
    if (stuk) regel = { stap: stuk, min: stuk, max: stuk * 4 }
    else if (orig <= 15) return null
    else regel = { stap: 10, min: 10, max: 300 }
  }
  if (orig > 0) {
    const laag = Math.max(regel.min, Math.floor((orig * 0.4) / regel.stap) * regel.stap)
    const hoog = Math.min(regel.max, Math.ceil((orig * 2.5) / regel.stap) * regel.stap)
    regel = { stap: regel.stap, min: Math.min(laag, hoog), max: Math.max(laag, hoog) }
  }
  return regel
}

const macros = (rijen) => {
  const som = (veld) => rijen.reduce((s, r) => s + (Number(r.ing[veld]) || 0) * r.gram / 100, 0)
  return { kcal: som('calories_per_100g'), eiwit: som('protein_per_100g'), koolh: som('carbs_per_100g'), vet: som('fat_per_100g') }
}

// Afstand tot het doel: 0 = exact. kcal en eiwit wegen het zwaarst.
const afstand = (m, doel) => {
  const dk = (m.kcal - doel.kcal) / Math.max(doel.kcal, 1)
  const dp = (m.eiwit - doel.eiwit) / Math.max(doel.eiwit, 10)
  const dv = (m.vet - doel.vet) / Math.max(doel.vet, 10)
  const dc = (m.koolh - doel.koolh) / Math.max(doel.koolh, 20)
  return dk * dk * 1.5 + dp * dp + dv * dv * 0.5 + dc * dc * 0.3
}

// Kleine stappen vanaf het recept: één ingrediënt een portie op of af, of twee
// tegen elkaar in, zolang het dichter bij het doel komt.
function schaal(rijen, doel) {
  const vrij = rijen.map((r, i) => (r.regel ? i : -1)).filter(i => i >= 0)
  const zet = (i, d) => {
    const r = rijen[i], g = r.gram + d * r.regel.stap
    if (g < r.regel.min - 0.01 || g > r.regel.max + 0.01) return false
    r.gram = g; return true
  }
  let beste = afstand(macros(rijen), doel)
  for (let ronde = 0; ronde < 120; ronde++) {
    let zetBeste = null, score = beste
    for (const i of vrij) for (const d of [1, -1]) {
      if (!zet(i, d)) continue
      let f = afstand(macros(rijen), doel)
      if (f < score - 1e-9) { score = f; zetBeste = [[i, d]] }
      for (const j of vrij) if (j !== i) for (const e of [1, -1]) {
        if (!zet(j, e)) continue
        f = afstand(macros(rijen), doel)
        if (f < score - 1e-9) { score = f; zetBeste = [[i, d], [j, e]] }
        zet(j, -e)
      }
      zet(i, -d)
    }
    if (!zetBeste) break
    zetBeste.forEach(([i, d]) => zet(i, d)); beste = score
  }
  return macros(rijen)
}

const r1 = (n) => Math.round(n * 10) / 10

// Maakt van de kandidaten de best passende wisselopties voor `huidig`.
//   kandidaten: ai_meals met ingredients_list [{ ingredient_id, amount }]
//   ingredienten: Map id -> ai_ingredients-rij (per 100 g, eenheid)
//   vetbron: { noten, olie } ai_ingredients-rijen, of null
//   voorkeur: Set met id's van gerechten die de coach of het systeem aanraadt
export function maakWisselOpties({ huidig, kandidaten, ingredienten, vetbron = {}, voorkeur = new Set(), moment = 'snack', aantal = 10 }) {
  const doel = { kcal: Number(huidig?.calories) || 0, eiwit: Number(huidig?.protein) || 0, koolh: Number(huidig?.carbs) || 0, vet: Number(huidig?.fat) || 0 }
  if (doel.kcal < 80) return []
  const uit = []
  for (const meal of kandidaten) {
    const lijst = Array.isArray(meal?.ingredients_list) ? meal.ingredients_list : []
    if (lijst.length < 2 || lijst.length > 9) continue
    const rijen = []
    for (const x of lijst) {
      const ing = ingredienten.get(x?.ingredient_id)
      const gram = Number(x?.amount) || 0
      if (!ing || !(gram > 0)) { rijen.length = 0; break }
      const regel = portieRegel(ing, gram)
      // Start op het recept, afgerond op een hele portie.
      const start = regel ? Math.min(regel.max, Math.max(regel.min, Math.round(gram / regel.stap) * regel.stap)) : gram
      rijen.push({ ing, regel, gram: start })
    }
    if (!rijen.length) continue
    let m = schaal(rijen, doel)
    let erbij = null
    // Te mager voor deze maaltijd? Dan een gewone vetbron erbij: noten bij
    // ontbijt en snack, een scheutje olie bij een warme maaltijd. Niet op brood.
    if (m.vet < doel.vet - 4) {
      const opBrood = rijen.some(r => /brood|boterham|wrap|tortilla|cracker|beschuit|bagel|pistolet/.test(String(r.ing.name || '').toLowerCase()))
      const bron = opBrood ? null : ['breakfast', 'snack', 'avondsnack', 'pre_workout', 'post_workout'].includes(moment) ? vetbron.noten : vetbron.olie
      if (bron && !rijen.some(r => r.ing.id === bron.id)) {
        const proef = rijen.map(r => ({ ...r }))
        proef.push({ ing: bron, regel: { stap: 5, min: 5, max: bron === vetbron.olie ? 15 : 20 }, gram: 5, erbij: true })
        const m2 = schaal(proef, doel)
        if (afstand(m2, doel) < afstand(m, doel)) { rijen.length = 0; proef.forEach(r => rijen.push(r)); m = m2; erbij = bron.name }
      }
    }
    const dk = Math.abs(m.kcal - doel.kcal), dp = Math.abs(m.eiwit - doel.eiwit), dv = Math.abs(m.vet - doel.vet)
    // Alleen wat echt dichtbij komt: kcal binnen 8% (of 30 kcal), eiwit binnen 6 g, vet binnen 7 g.
    if (dk > Math.max(30, doel.kcal * 0.08) || dp > 6 || dv > 7) continue
    const score = afstand(m, doel) + (voorkeur.has(meal.id) ? 0 : 0.004)
    uit.push({
      score,
      meal: {
        ...meal,
        name: erbij ? `${meal.name} met ${String(erbij).toLowerCase()}` : meal.name,
        calories: Math.round(m.kcal), protein: r1(m.eiwit), carbs: r1(m.koolh), fat: r1(m.vet),
        ingredients_list: rijen.map(r => ({
          ingredient_id: r.ing.id, name: r.ing.name, amount: Math.round(r.gram), unit: 'gram',
          calories: Math.round((Number(r.ing.calories_per_100g) || 0) * r.gram / 100),
          protein: r1((Number(r.ing.protein_per_100g) || 0) * r.gram / 100),
          carbs: r1((Number(r.ing.carbs_per_100g) || 0) * r.gram / 100),
          fat: r1((Number(r.ing.fat_per_100g) || 0) * r.gram / 100),
        })),
        // Zo gaat de geschaalde versie het plan in (kiesWissel in AIMealDashboard).
        _aangepast: true, _zelfdeMacros: true,
      },
    })
  }
  // Eén versie per gerecht (dezelfde naam bestaat in meerdere kcal-niveaus).
  const perNaam = new Map()
  for (const x of uit.sort((a, b) => a.score - b.score)) {
    const sleutel = String(x.meal.name || '').toLowerCase().replace(/\s+/g, ' ').trim()
    if (!perNaam.has(sleutel)) perNaam.set(sleutel, x.meal)
  }
  return [...perNaam.values()].slice(0, aantal)
}
