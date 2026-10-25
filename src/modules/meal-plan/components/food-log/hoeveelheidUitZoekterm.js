// src/modules/meal-plan/components/food-log/hoeveelheidUitZoekterm.js
//
// Typen zoals je praat: "2 eieren", "150g kip", "glas melk", "halve avocado",
// "kwark 250 gram". Haalt de hoeveelheid uit de zoekterm; de zoeker zoekt op
// de rest en de portie-kiezer opent meteen op die hoeveelheid.
//
// Geeft { term, hoeveelheid } terug. hoeveelheid is null als er niets
// herkend is, anders { aantal, eenheid } met eenheid:
//   'g' | 'ml'      → aantal is gram / ml
//   'snee' | 'kop' | 'glas' | … → aantal keer die natuurlijke portie
//   null            → aantal keer de standaardportie ("2 eieren")

const GETALWOORD = {
  een: 1, één: 1, twee: 2, drie: 3, vier: 4, vijf: 5, zes: 6, zeven: 7, acht: 8,
  negen: 9, tien: 10, half: 0.5, halve: 0.5, anderhalf: 1.5, anderhalve: 1.5,
}

// Spreektaal → eenheid. Volgorde telt: langste vorm eerst.
const EENHEDEN = [
  [/^(gram|gr|g)$/, 'g'],
  [/^(kilo|kg)$/, 'kg'],
  [/^(ml|milliliter)$/, 'ml'],
  [/^(liter|l)$/, 'l'],
  [/^(cl)$/, 'cl'],
  [/^(sneetjes?|sneeen|sneeën|snee|boterhammen|boterham)$/, 'snee'],
  [/^(plakjes?|plakken|plak)$/, 'plak'],
  [/^(kopjes?|koppen|kop)$/, 'kop'],
  [/^(glazen|glaasjes?|glas)$/, 'glas'],
  [/^(mokken|mok)$/, 'mok'],
  [/^(eetlepels?|el)$/, 'eetlepel'],
  [/^(theelepels?|tl)$/, 'theelepel'],
  [/^(scheppen|schepjes?|schep|scoops?)$/, 'schep'],
  [/^(handjes?|handen|hand)$/, 'hand'],
  [/^(porties?)$/, 'portie'],
  [/^(blikjes?|blikken|blik)$/, 'blik'],
  [/^(stuks?|stukjes?)$/, null],
  [/^x$/, null],
]

const leesGetal = (w) => {
  if (!w) return null
  if (GETALWOORD[w] != null) return GETALWOORD[w]
  if (w === '½') return 0.5
  const m = w.match(/^(\d+(?:[.,]\d+)?)(½)?$/)
  if (!m) return null
  return parseFloat(m[1].replace(',', '.')) + (m[2] ? 0.5 : 0)
}

const leesEenheid = (w) => {
  for (const [re, e] of EENHEDEN) if (re.test(w)) return { eenheid: e }
  return null
}

// Naar wat de kiezer kent: kg/l/cl worden gram/ml. Een kaal getal van 20
// of meer is gram ("kipfilet 120"); daaronder een aantal ("2 eieren").
const normaal = (aantal, eenheid) => {
  if (eenheid === null && aantal >= 20) return { aantal, eenheid: 'g' }
  if (eenheid === 'kg') return { aantal: aantal * 1000, eenheid: 'g' }
  if (eenheid === 'l') return { aantal: aantal * 1000, eenheid: 'ml' }
  if (eenheid === 'cl') return { aantal: aantal * 10, eenheid: 'ml' }
  return { aantal, eenheid }
}

export function hoeveelheidUitZoekterm(invoer) {
  const ruw = String(invoer || '').trim()
  // "150g" / "2x" / "x2" los van het woord ernaast.
  const woorden = ruw.toLowerCase()
    // Alleen bij een echte eenheid: "7up" blijft "7up".
    .replace(/(\d)(gram|gr|g|kg|ml|cl|l|x)\b/g, '$1 $2')
    .replace(/\bx(\d)/g, 'x $1')
    .split(/\s+/).filter(Boolean)
  if (woorden.length < 2) return { term: ruw, hoeveelheid: null }

  // Vooraan: [getal] [eenheid] [van] product, of [eenheid] product ("glas melk").
  let aantal = leesGetal(woorden[0])
  let i = aantal != null ? 1 : 0
  let eenheid
  const e = woorden[i] != null ? leesEenheid(woorden[i]) : null
  if (e && woorden.length > i + 1) { eenheid = e.eenheid; i += 1 }
  if (aantal == null && eenheid === undefined) {
    // Achteraan: product [getal] [eenheid] ("kwark 250 gram", "ei 2x").
    const n = woorden.length
    const eAchter = leesEenheid(woorden[n - 1])
    const gAchter = leesGetal(woorden[n - (eAchter ? 2 : 1)])
    if (gAchter != null && n - (eAchter ? 2 : 1) >= 1) {
      const rest = woorden.slice(0, n - (eAchter ? 2 : 1))
      const h = normaal(gAchter, eAchter ? eAchter.eenheid : null)
      return { term: rest.join(' '), hoeveelheid: h }
    }
    return { term: ruw, hoeveelheid: null }
  }
  if (woorden[i] === 'van' && woorden.length > i + 1) i += 1
  if (['de', 'het'].includes(woorden[i]) && woorden.length > i + 1) i += 1
  const rest = woorden.slice(i)
  if (!rest.length || rest.join(' ').length < 2) return { term: ruw, hoeveelheid: null }
  if (aantal == null) aantal = 1
  if (eenheid === undefined) eenheid = null
  if (!(aantal > 0) || aantal > 5000) return { term: ruw, hoeveelheid: null }
  return { term: rest.join(' '), hoeveelheid: normaal(aantal, eenheid) }
}
