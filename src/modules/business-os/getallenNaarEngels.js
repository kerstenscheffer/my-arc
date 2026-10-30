// src/modules/business-os/getallenNaarEngels.js
//
// Gino-stem (30 okt 2026): ElevenLabs spreekt Nederlandse cijfers slecht uit
// ('€4.663', '47%', '1,4M', '28 okt'). Vlak vóór de gino-stem-aanroep (stem.js,
// haalAudio) zetten we alle getallen om naar Engelse woorden. Alleen de tekst
// voor de stem; scherm en gesprek blijven ongewijzigd.
// Nederlandse notatie: punt = duizendtallen (4.663), komma = decimalen (1,4).
// Een punt met 1-2 cijfers erachter (1.5) lezen we als decimaal.
//
//   '€4.663'  → 'four thousand six hundred sixty-three euros'
//   '47%'     → 'forty-seven percent'
//   '1,4M'    → 'one point four million'
//   '12,9K'   → 'twelve point nine thousand'
//   '28 okt'  → 'October twenty-eighth'
//   '14:30'   → 'fourteen thirty'

const EEN = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen']
const TIEN = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety']
const GROEP = ['', ' thousand', ' million', ' billion', ' trillion']

function onderDuizend(n) {
  const h = Math.floor(n / 100)
  const r = n % 100
  const delen = []
  if (h) delen.push(`${EEN[h]} hundred`)
  if (r) delen.push(r < 20 ? EEN[r] : TIEN[Math.floor(r / 10)] + (r % 10 ? `-${EEN[r % 10]}` : ''))
  return delen.join(' ')
}

// Geheel getal (als cijferstring) → Engelse woorden. Te groot: cijfer voor cijfer.
export function getalInWoorden(cijfers) {
  const s = String(cijfers).replace(/^0+(?=\d)/, '')
  if (s.length > 15) return cijfersLos(s)
  let n = Number(s)
  if (n === 0) return 'zero'
  const delen = []
  for (let g = 0; n > 0; g++, n = Math.floor(n / 1000)) {
    const stuk = n % 1000
    if (stuk) delen.unshift(onderDuizend(stuk) + GROEP[g])
  }
  return delen.join(' ')
}

const cijfersLos = (s) => [...s].map(c => EEN[Number(c)]).join(' ')

const ORDINAAL = { one: 'first', two: 'second', three: 'third', five: 'fifth', eight: 'eighth', nine: 'ninth', twelve: 'twelfth' }
function rangtelwoord(n) {
  return getalInWoorden(n).replace(/[a-z]+$/, w => ORDINAAL[w] || (w.endsWith('y') ? w.slice(0, -1) + 'ieth' : w + 'th'))
}

// '4.663' + ',5' → 'four thousand … point five'
function getal(heel, dec) {
  const woorden = getalInWoorden(heel.replace(/\./g, ''))
  return dec ? `${woorden} point ${cijfersLos(dec)}` : woorden
}

const MAANDEN = [
  ['januari|jan', 'January'], ['februari|feb', 'February'], ['maart|mrt', 'March'], ['april|apr', 'April'],
  ['mei', 'May'], ['juni|jun', 'June'], ['juli|jul', 'July'], ['augustus|aug', 'August'],
  ['september|sept|sep', 'September'], ['oktober|okt', 'October'], ['november|nov', 'November'], ['december|dec', 'December'],
]
const MAAND_RE = new RegExp(`\\b(\\d{1,2})\\s+(${MAANDEN.map(m => m[0]).join('|')})\\b`, 'gi')
const maandNaam = (w) => MAANDEN.find(m => new RegExp(`^(${m[0]})$`, 'i').test(w))[1]

// Getal: duizendtallen met punt (4.663 / 1.000.000) of gewoon (321), met
// optioneel decimalen na komma, of na een punt met 1-2 cijfers (1.5).
const GETAL = String.raw`(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d+)|\.(\d{1,2})(?!\d))?`
const GROOT = { k: 'thousand', K: 'thousand', duizend: 'thousand', M: 'million', mln: 'million', miljoen: 'million', mld: 'billion', miljard: 'billion' }
const BEDRAG_RE = new RegExp(
  String.raw`(€\s?)?(?<![\p{L}\d.,])${GETAL}` +
  String.raw`(?:([kKM])(?![\p{L}\d])|\s?(mln|miljoen|mld|miljard|duizend)\b)?` +
  String.raw`(\s?(?:%|procent\b))?` +
  String.raw`(\s?(?:euro|EUR)\b)?`,
  'gu',
)

export function getallenNaarEngels(tekst) {
  if (!tekst || !/\d/.test(tekst)) return tekst || ''
  return tekst
    // Datums: '28 okt' → 'October twenty-eighth'
    .replace(MAAND_RE, (_, dag, maand) => `${maandNaam(maand)} ${rangtelwoord(dag)}`)
    // Tijden: '14:30' → 'fourteen thirty', '9:00' → 'nine o'clock', '9:05' → 'nine oh five'
    .replace(/\b(\d{1,2}):(\d{2})\b/g, (_, u, m) =>
      `${getalInWoorden(u)} ${m === '00' ? "o'clock" : m[0] === '0' ? `oh ${EEN[Number(m[1])]}` : getalInWoorden(m)}`)
    // Bereik: '3-5' → '3 to 5'
    .replace(/(\d)\s?[–-]\s?(?=[€\d])/g, '$1 to ')
    .replace(BEDRAG_RE, (_, euroVoor, heel, decKomma, decPunt, groot, grootWoord, procent, euroNa) => {
      const dec = decKomma ?? decPunt
      const schaal = GROOT[groot || grootWoord]
      const euro = euroVoor || euroNa
      let uit
      if (euro && !schaal && dec && dec.length === 2) {
        // Bedrag met centen: '€4,50' → 'four euros and fifty cents'
        const centen = getalInWoorden(dec)
        const hele = heel.replace(/\./g, '')
        uit = Number(hele) ? `${getalInWoorden(hele)} euros and ${centen} cents` : `${centen} cents`
      } else {
        uit = getal(heel, dec) + (schaal ? ` ${schaal}` : '')
        if (procent) uit += ' percent'
        if (euro) uit += uit === 'one' ? ' euro' : ' euros'
      }
      return uit
    })
    // '+12 percent' → 'plus twelve percent'
    .replace(/(^|\s)\+(?=[a-z])/g, '$1plus ')
}
