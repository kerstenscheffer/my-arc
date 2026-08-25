// src/pages/calorie-calculator/rekenen.js
// De hele rekenkern van de calorie-calculator, los van de UI — zo kan zowel het
// stappenscherm als de preview 'm gebruiken, en is de logica in je eentje te
// testen zonder React.
//
// Rekenwijze:
//   BMR  : Mifflin-St Jeor (mannen) = 10·kg + 6,25·cm − 5·leeftijd + 5
//   TDEE : BMR × activiteitsfactor
//   Doel : TDEE − 800 kcal
// Macro's volgens Kerstens regel (afgestemd op 15-25% vet):
//   eiwit 2 g/kg, vet 1 g/kg, koolhydraten vullen de rest aan.
//
// Vier grenzen, elk met een uitleg-regel in de UI:
//   1. Nooit onder 1500 kcal — bij lichtere of inactieve mannen zou een tekort
//      van 800 daar zo onder duiken.
//   2. Eiwit + vet-bodem (0,6 g/kg) vormen samen een calorie-bodem. Ligt
//      TDEE − 800 daaronder, dan gaat het doel omhoog; anders zouden de macro's
//      optellen tot méér dan het doel dat erboven staat.
//   3. Koolhydraten zakken bij zware mannen richting nul. Vet schaalt dan terug
//      tot de bodem zodat er ruimte blijft voor koolhydraten rond de training.
//   4. Boven 25% vet rekenen we het eiwit op het STREEFGEWICHT. 2 g/kg op 130 kg
//      is onnodig veel en duwt alle koolhydraten eruit; spiermassa hangt aan je
//      vetvrije massa, niet aan het vet eromheen.

export const KCAL_ONDERGRENS = 1500
export const TEKORT = 800
const KCAL_PER_KG_VET = 7700

export const ACTIVITEIT = [
  { key: 1.2,   label: 'Zittend werk', sub: 'Weinig tot geen training' },
  { key: 1.375, label: 'Licht actief',  sub: '1-3× per week trainen' },
  { key: 1.55,  label: 'Matig actief',  sub: '3-5× per week trainen' },
  { key: 1.725, label: 'Zeer actief',   sub: '6-7× per week trainen' },
  { key: 1.9,   label: 'Zwaar werk',    sub: 'Fysiek werk én training' },
]

export const getal = (v) => {
  const n = parseFloat(String(v).replace(',', '.'))
  return isNaN(n) ? null : n
}

export const kg = (n) => Number(n).toFixed(1).replace('.', ',')

export function bereken({ leeftijd, lengte, gewicht, activiteit, vetNu, vetDoel }) {
  const a = getal(leeftijd), h = getal(lengte), w = getal(gewicht)
  if (!a || !h || !w || a < 15 || a > 90 || h < 130 || h > 230 || w < 40 || w > 250) return null

  const tdee = Math.round((10 * w + 6.25 * h - 5 * a + 5) * activiteit)

  // Vetvrije massa blijft gelijk; alleen het vet eromheen verdwijnt.
  const vetvrij = vetNu != null ? w * (1 - vetNu / 100) : null
  const doelTeHoog = vetDoel != null && vetNu != null && vetDoel >= vetNu
  const streefgewicht = (vetvrij != null && vetDoel != null && !doelTeHoog)
    ? vetvrij / (1 - vetDoel / 100) : null
  const teVerliezen = streefgewicht != null ? Math.max(0, w - streefgewicht) : null

  const hoogVet = vetNu != null && vetNu > 25
  const eiwitBasis = (hoogVet && streefgewicht != null) ? streefgewicht : w
  const eiwit = Math.round(eiwitBasis * 2)

  const vetBodem = Math.round(w * 0.6)
  const macroBodem = eiwit * 4 + vetBodem * 9

  const ruw = tdee - TEKORT
  const doel = Math.max(KCAL_ONDERGRENS, macroBodem, ruw)
  const afgetopt = ruw < KCAL_ONDERGRENS
  const bodemGehaald = ruw < macroBodem && macroBodem >= KCAL_ONDERGRENS
  const echtTekort = tdee - doel

  let vetGram = Math.round(w * 1)
  let koolhydraten = Math.round((doel - eiwit * 4 - vetGram * 9) / 4)
  let vetVerlaagd = false
  if (koolhydraten < 50) {
    const ruimte = doel - eiwit * 4 - 50 * 4
    const nieuwVet = Math.max(vetBodem, Math.floor(ruimte / 9))
    if (nieuwVet < vetGram) { vetGram = nieuwVet; vetVerlaagd = true }
    koolhydraten = Math.max(0, Math.round((doel - eiwit * 4 - vetGram * 9) / 4))
  }

  const perWeek = (echtTekort * 7) / KCAL_PER_KG_VET
  const wekenNodig = (teVerliezen != null && perWeek > 0) ? Math.ceil(teVerliezen / perWeek) : null

  return {
    tdee, doel, echtTekort, tekortWeek: echtTekort * 7, afgetopt, bodemGehaald,
    eiwit, vet: vetGram, koolhydraten, vetVerlaagd,
    perWeek, in16Weken: perWeek * 16,
    vetNu, vetDoel, streefgewicht, teVerliezen, wekenNodig, hoogVet, doelTeHoog,
  }
}

// De zin onder "Mijn caloriedoel": waaróm is dit jouw getal? Als we het
// streefbeeld kennen, is de einddatum het sterkste antwoord; anders het tempo.
export function doelZin(r) {
  if (!r) return ''
  if (r.streefgewicht != null && r.wekenNodig != null) {
    return `om binnen ${r.wekenNodig} weken op ${kg(r.streefgewicht)} kg te komen`
  }
  return `om ${kg(r.perWeek)} kg per week te verliezen`
}
