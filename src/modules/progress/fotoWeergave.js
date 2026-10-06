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

// ── Bij het uploaden: iPhone-HEIC naar JPEG ─────────────────────────────
//
// De weergave-url hierboven vangt bestaande HEIC-bestanden op. Beter is om
// nieuwe foto's meteen als JPEG op te slaan: kleiner, en overal te tonen
// zonder omweg. Safari op de iPhone kan HEIC decoderen, Chrome niet. Lukt het
// decoderen niet, dan gaat het originele bestand gewoon door — de weergave-
// url vangt het dan alsnog op.
const HEIC = /heic|heif/i

export async function naarJpeg(file, { maxZijde = 2000, kwaliteit = 0.88 } = {}) {
  if (!file) return file
  const isHeic = HEIC.test(file.type || '') || HEIC.test(file.name || '')
  if (!isHeic) return file
  try {
    let bitmap
    if (typeof createImageBitmap === 'function') {
      bitmap = await createImageBitmap(file)
    } else {
      bitmap = await new Promise((ok, nee) => {
        const img = new Image()
        img.onload = () => ok(img); img.onerror = nee
        img.src = URL.createObjectURL(file)
      })
    }
    const schaal = Math.min(1, maxZijde / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * schaal)
    canvas.height = Math.round(bitmap.height * schaal)
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise((ok) => canvas.toBlob(ok, 'image/jpeg', kwaliteit))
    if (!blob) return file
    const naam = String(file.name || 'foto').replace(/\.(heic|heif)$/i, '') + '.jpg'
    return new File([blob], naam, { type: 'image/jpeg', lastModified: Date.now() })
  } catch (e) {
    console.warn('HEIC omzetten mislukt, origineel geüpload:', e?.message)
    return file
  }
}
