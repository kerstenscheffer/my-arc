// src/modules/meal-plan/utils/kcalKleur.js
//
// Kleur voor een dag tegen het kcal-doel, op het verschil in kcal (eronder of
// erboven telt hetzelfde). Kersten, 13 okt 2026:
//
//   ≤ 50 kcal ernaast   groen
//     100               lichter groen
//     200               donker oranje
//   ≥ 300               rood
//
// Ertussen loopt de kleur geleidelijk, net als de weektegels in de
// gewichtsectie (tempoKleurVanDoel): hoe dichter bij het doel, hoe groener.

const STOPS = [
  { kcal: 50,  rgb: [16, 185, 129] },  // groen
  { kcal: 100, rgb: [110, 231, 160] }, // lichter groen
  { kcal: 200, rgb: [234, 115, 22] },  // donker oranje
  { kcal: 300, rgb: [239, 68, 68] },   // rood
]

const meng = (a, b, t) => a.map((x, i) => Math.round(x + (b[i] - x) * t))

export function kcalKleur(waarde, doel, neutraal = 'rgba(255,255,255,0.35)') {
  if (!doel || !waarde) return neutraal
  const af = Math.abs(waarde - doel)
  if (af <= STOPS[0].kcal) return `rgb(${STOPS[0].rgb.join(',')})`
  for (let i = 1; i < STOPS.length; i++) {
    if (af <= STOPS[i].kcal) {
      const t = (af - STOPS[i - 1].kcal) / (STOPS[i].kcal - STOPS[i - 1].kcal)
      return `rgb(${meng(STOPS[i - 1].rgb, STOPS[i].rgb, t).join(',')})`
    }
  }
  return `rgb(${STOPS[STOPS.length - 1].rgb.join(',')})`
}
