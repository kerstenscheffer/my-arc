// src/modules/manual-workout-builder/koppen.js
//
// Koppen / delen per spiergroep (10 nov 2026, Kerstens indeling). Geen setdoel:
// het onderzoek zegt hier niets over. Alleen dekking: hoeveel directe sets per kop,
// en een seintje als een kop 0 sets heeft.
//
// De kop komt uit de oefeningnaam (eerste patroon dat past, anders de standaard).
// In het bewerkvenster kan de coach hem per oefening vastzetten: ex.kop.
// Standaard null = de oefening raakt de koppen gelijk (bv. een gewone curl).

import { spierVan } from './spierGroepen'

// spier → { koppen: [[sleutel, label, patroon|null]], standaard: sleutel|null }
export const KOPPEN = {
  chest: {
    koppen: [['boven', 'Bovenborst', /incline|low.?to.?high|upper|landmine press|reverse.?grip bench/i], ['midden', 'Midden', null]],
    standaard: 'midden',
  },
  back: {
    koppen: [['lats', 'Lats', /pulldown|pull.?up|chin.?up|pullover|straight.?arm|\blat\b/i], ['bovenrug', 'Bovenrug', null]],
    standaard: 'bovenrug',
  },
  triceps: {
    koppen: [['lang', 'Lange kop', /overhead|skull|french|katana|behind.?the.?head|jm press/i], ['lateraal', 'Laterale kop', null]],
    standaard: 'lateraal',
  },
  biceps: {
    koppen: [
      ['brachialis', 'Brachialis', /hammer|reverse.?curl|cross.?body|rope curl/i],
      ['lang', 'Lange kop', /incline|bayesian|drag|behind/i],
      ['kort', 'Korte kop', /preacher|spider|concentration|scott/i],
    ],
    standaard: null,
  },
  quads: {
    koppen: [['rectus', 'Rectus femoris', /extension|sissy|reverse nordic/i], ['vasti', 'Vasti', null]],
    standaard: 'vasti',
  },
  hamstrings: {
    koppen: [['knie', 'Knie-buigers', /curl|nordic/i], ['heup', 'Heup-strekkers', null]],
    standaard: 'heup',
  },
  glutes: {
    koppen: [['medius', 'Gluteus medius', /abduct|side.?lying|lateral walk|clam|frog|monster walk/i], ['max', 'Gluteus max', null]],
    standaard: 'max',
  },
}

export const kopLabel = (spier, kop) => KOPPEN[spier]?.koppen.find(([k]) => k === kop)?.[1] || null

// Kop van een oefening binnen zijn eigen (directe) spiergroep, of null.
export function kopVan(ex) {
  const spier = spierVan(ex)
  const def = KOPPEN[spier]
  if (!def) return null
  if (ex.kop && def.koppen.some(([k]) => k === ex.kop)) return ex.kop
  const naam = ex.name || ''
  for (const [k, , re] of def.koppen) if (re && re.test(naam)) return k
  return def.standaard
}

// Directe sets per kop voor één spier over een lijst oefeningen:
// [{ kop, label, sets }] in de volgorde van KOPPEN, plus 'algemeen' als die er is.
export function dekkingKoppen(exercises, spier) {
  const def = KOPPEN[spier]
  if (!def) return []
  const t = {}
  let algemeen = 0
  for (const ex of exercises) {
    if (ex.type === 'cardio' || spierVan(ex) !== spier) continue
    const sets = Number(ex.sets) || 0
    const k = kopVan(ex)
    if (k) t[k] = (t[k] || 0) + sets; else algemeen += sets
  }
  const uit = def.koppen.map(([k, label]) => ({ kop: k, label, sets: t[k] || 0 }))
  if (algemeen) uit.push({ kop: null, label: 'Beide koppen', sets: algemeen })
  return uit
}
