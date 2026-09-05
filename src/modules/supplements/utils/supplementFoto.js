// src/modules/supplements/utils/supplementFoto.js
//
// Een foto bij een supplement, gekozen op naam en anders op categorie.
//
// Waarom niet één plaatje voor alles: een rij identieke pillenpotjes leest
// als behang. Poeder ziet er anders uit dan capsules, en dat helpt de klant
// het juiste blik te pakken.
//
// De URL's zijn Unsplash, dezelfde bron die de intake al gebruikt, en alle
// zes zijn gecontroleerd op HTTP 200. Vrij te gebruiken zonder naamsvermelding.
// Vaste breedte in de URL: we vragen precies de maat die we tonen, niet een
// foto van 2000 pixels die de browser terugschaalt.

const FOTO = {
  poeder:   'photo-1593095948071-474c5cc2989d',  // schepje wit poeder
  capsules: 'photo-1664956618021-73c47736845e',  // capsules uit een potje
  tabletten:'photo-1631549916768-4119b2e5f926',  // stapeltje tabletten
  olie:     'photo-1624362772755-4d5843e67047',  // bruine/gele softgels
  vitamine: 'photo-1707129785947-ddc627a8bab9',  // citrus + capsules
  overig:   'photo-1592323818181-f9b967ff537c',  // losse tablet
}

const url = (id, maat) =>
  `https://images.unsplash.com/${id}?w=${maat}&h=${maat}&fit=crop&q=80`

// Op naam eerst: dat is preciezer dan de categorie. "Creatine" en "Whey"
// zijn poeders ongeacht hoe ze zijn ingedeeld.
const OP_NAAM = [
  [/creatin|whey|casein|eiwitpoeder|proteine|protein/i, 'poeder'],
  [/omega|visolie|fish\s*oil|krill/i,                   'olie'],
  [/vitamine|vitamin|multi/i,                           'vitamine'],
  [/magnesium|zink|zinc|ijzer|iron|calcium|kalium/i,    'tabletten'],
]

const OP_CATEGORIE = {
  performance: 'poeder',
  recovery:    'poeder',
  health:      'vitamine',
  hormones:    'capsules',
  convenience: 'capsules',
}

/**
 * @param {object} supp  supplement uit supplement_plans.supplements
 * @param {number} maat  gevraagde pixelmaat (vierkant)
 * @returns {string} URL van een passende foto
 */
export function supplementFoto(supp, maat = 160) {
  const naam = String(supp?.name || '')
  for (const [patroon, soort] of OP_NAAM) {
    if (patroon.test(naam)) return url(FOTO[soort], maat)
  }
  const soort = OP_CATEGORIE[supp?.category] || 'overig'
  return url(FOTO[soort], maat)
}
