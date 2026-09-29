// src/modules/progress/fotoWeergave.js
//
// Een voortgangsfoto tonen in een <img>.
//
// Aanleiding: iPhones slaan foto's op als HEIC. Worden die rechtstreeks
// geüpload, dan komen ze in de opslag terecht met een .jpg-naam maar met
// content-type image/heic. Chrome kan HEIC niet tekenen — je ziet een kapot
// icoontje — terwijl downloaden gewoon werkt, want dan bewaart de browser de
// bytes en opent je Mac ze wél. Precies het verwarrende beeld: "ik kan
// downloaden maar zie geen preview".
//
// Oplossing zonder de bestanden aan te raken: Supabase heeft naast
// /object/public/ ook /render/image/public/, dat door imgproxy gaat. Die leest
// HEIC en geeft JPEG terug. Meteen winst voor de rest ook: deze foto's zijn
// 2,4 MB per stuk en worden in een vakje van 200 pixels getoond.
//
// De originele URL blijft de bron voor downloaden — daar wil je het volle
// bestand, niet een verkleinde JPEG.

const OBJECT = '/storage/v1/object/public/'
const RENDER = '/storage/v1/render/image/public/'

/**
 * @param {string} url  de opgeslagen photo_url
 * @param {object} opties
 * @param {number} [opties.breedte]  gewenste breedte in pixels
 * @param {number} [opties.kwaliteit] 1-100
 * @returns {string} url om in een <img src> te zetten
 */
export function fotoWeergaveUrl(url, { breedte = 600, kwaliteit = 75 } = {}) {
  const s = String(url || '')
  if (!s || !s.includes(OBJECT)) return s          // externe of onbekende bron: laten staan
  const basis = s.replace(OBJECT, RENDER)
  const scheiding = basis.includes('?') ? '&' : '?'
  return `${basis}${scheiding}width=${Math.round(breedte)}&quality=${Math.round(kwaliteit)}&resize=contain`
}
