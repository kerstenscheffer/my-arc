// src/modules/steps/stappenEnergie.js
//
// Hoeveel energie kost het om te lopen? Een schatting uit stappen + gewicht.
//
// Waarom dit bestaat: de klant ziet zijn stappen, maar "8.000 stappen" zegt
// niets over zijn weekbalans. Een getal in calorieën wél — zolang je erbij
// zegt hoe het is opgebouwd en hoe ruw het is. Vandaar dat de aannames en de
// bronnen hier staan en niet verspreid in de UI.
//
// ── Het model ────────────────────────────────────────────────────────────
//
// 1. Stappen → tijd. Bij ongeveer 100 stappen per minuut loop je op matige
//    intensiteit, wat overeenkomt met 3 MET. Dat is de kern van de
//    CADENCE-Adults-studies: 100 stappen/min bleek de drempel voor 3 MET, en
//    elke 10 stappen/min daarboven telt ruwweg voor 1 MET extra.
//
// 2. MET → calorieën. De standaardformule uit de inspanningsfysiologie:
//       kcal/min = MET × 3,5 × gewicht(kg) / 200
//    Die 3,5 is het zuurstofverbruik in rust (ml/kg/min), de 200 rekent
//    zuurstof om naar kilocalorieën.
//
// 3. Netto, niet bruto. Van die 3 MET was 1 MET je rustverbruik: dat had je
//    ook op de bank verbrand. We trekken hem eraf en houden 2 MET over, zodat
//    het getal echt "extra door te lopen" betekent. Dat is ook waarom deze
//    schatting lager uitvalt dan wat een horloge doorgaans toont — die tellen
//    meestal bruto.
//
// Samengevat komt het neer op:  kcal ≈ stappen × gewicht(kg) × 0,00035
// (10.000 stappen bij 80 kg ≈ 280 kcal netto)
//
// ── Wat het niet is ──────────────────────────────────────────────────────
//
// Geen meting. Tempo, ondergrond, hellingen, beenlengte, getraindheid en hoe
// je het gewicht draagt verschuiven de uitkomst makkelijk 20-30%. Wie hard
// wandelt op 130 stappen/min zit eerder op 6 MET dan op 3. Gebruik het voor
// de trend over weken, niet om een dag mee te sluiten.

// Aannames, los benoemd zodat ze in de uitleg getoond kunnen worden.
export const AANNAMES = {
  stappenPerMinuut: 100,   // matige wandelintensiteit
  metWandelen: 3,          // MET bij die cadans
  metRust: 1,              // wat je sowieso al verbrandt
  zuurstofRust: 3.5,       // ml O2 per kg per minuut
}

// kcal per stap per kilo lichaamsgewicht. Één keer uitgerekend zodat de
// formule in de code hetzelfde is als die in de uitleg.
export const KCAL_PER_STAP_PER_KG =
  ((AANNAMES.metWandelen - AANNAMES.metRust) * AANNAMES.zuurstofRust) /
  (200 * AANNAMES.stappenPerMinuut)   // = 0,00035

/**
 * Geschat extra energieverbruik van gelopen stappen.
 *
 * @param {number} stappen
 * @param {number|null} gewichtKg  null als we het gewicht niet kennen
 * @returns {number|null} kcal, afgerond; null zonder gewicht
 */
export function kcalVanStappen(stappen, gewichtKg) {
  const s = Number(stappen)
  const kg = Number(gewichtKg)
  if (!Number.isFinite(s) || s <= 0) return 0
  if (!Number.isFinite(kg) || kg <= 0) return null
  return Math.round(s * kg * KCAL_PER_STAP_PER_KG)
}

/**
 * De bandbreedte eromheen. Niet uit een tabel maar een eerlijke marge: de
 * genoemde studies laten onderling en binnen groepen verschillen van deze
 * orde zien, vooral door tempo en lichaamsbouw.
 */
export const MARGE = 0.25

export function kcalBereik(stappen, gewichtKg) {
  const midden = kcalVanStappen(stappen, gewichtKg)
  if (midden === null) return null
  return {
    midden,
    laag: Math.round(midden * (1 - MARGE)),
    hoog: Math.round(midden * (1 + MARGE)),
  }
}

// Waar het op gebaseerd is. Bewust met vindplaats erbij, zodat iemand die het
// wil nakijken niet hoeft te zoeken.
export const BRONNEN = [
  {
    titel: 'Walking cadence (steps/min) and intensity in 21–40 year olds: CADENCE-adults',
    auteurs: 'Tudor-Locke C, Han H, Aguiar EJ, e.a.',
    waar: 'International Journal of Behavioral Nutrition and Physical Activity, 2019;16:8',
    url: 'https://doi.org/10.1186/s12966-019-0769-6',
    waarvoor: 'Hier komt de 100 stappen per minuut vandaan als drempel voor matige intensiteit (3 MET).',
  },
  {
    titel: 'Walking cadence (steps/min) and intensity in 41 to 60-year-old adults: the CADENCE-adults study',
    auteurs: 'Tudor-Locke C, Ducharme SW, Aguiar EJ, e.a.',
    waar: 'International Journal of Behavioral Nutrition and Physical Activity, 2020;17:137',
    url: 'https://doi.org/10.1186/s12966-020-01045-z',
    waarvoor: 'Laat zien dat diezelfde drempel ook op middelbare leeftijd standhoudt.',
  },
  {
    titel: '2011 Compendium of Physical Activities: a second update of codes and MET values',
    auteurs: 'Ainsworth BE, Haskell WL, Herrmann SD, e.a.',
    waar: 'Medicine & Science in Sports & Exercise, 2011;43(8):1575–1581',
    url: 'https://doi.org/10.1249/MSS.0b013e31821ece12',
    waarvoor: 'De MET-waarden voor wandelen, en de basis onder de omrekening naar calorieën.',
  },
  {
    titel: 'Energy expenditure of walking and running: comparison with prediction equations',
    auteurs: 'Hall C, Figueroa A, Fernhall B, Kanaley JA.',
    waar: 'Medicine & Science in Sports & Exercise, 2004;36(12):2128–2134',
    url: 'https://doi.org/10.1249/01.MSS.0000147584.87788.0E',
    waarvoor: 'Vergelijkt voorspelde met gemeten waarden — en laat zien hoeveel die uit elkaar kunnen lopen.',
  },
]
