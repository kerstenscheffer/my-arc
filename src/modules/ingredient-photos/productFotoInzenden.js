// src/modules/ingredient-photos/productFotoInzenden.js
//
// Klant fotografeert de voorkant van een gescand product zonder echte foto
// (18 nov 2026, Kersten). De foto gaat naar de opslag (bucket meal-photos) en
// komt als inzending in product_foto_inzendingen. Voor iedereen geldt hij pas
// als de coach hem goedkeurt (keur_productfoto); de klant zelf ziet hem meteen,
// via localStorage (eigenProductFoto in foodImageFallback.js).
// SQL: productfotos-merk-en-klant.sql

const EIGEN_SLEUTEL = 'myarc:eigen-productfotos'   // { [ingredientId|barcode]: url }
const GEVRAAGD_SLEUTEL = 'myarc:productfoto-gevraagd' // { [ingredientId]: ms }
const OPNIEUW_NA_MS = 30 * 24 * 60 * 60 * 1000       // Overslaan = een maand niet meer vragen

const lees = (k) => { try { return JSON.parse(localStorage.getItem(k)) || {} } catch { return {} } }
const schrijf = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch { /* privémodus */ } }

// Heeft dit product een echte foto? Een merkvoorbeeld telt niet: daar willen
// we juist een echte foto voor.
export const heeftEchteFoto = (rij) => !!rij?.image_url && rij?.image_source !== 'merk_voorbeeld'

export const magFotoVragen = (ingredientId) => {
  if (!ingredientId) return false
  if (eigenProductFoto({ id: ingredientId })) return false
  const t = lees(GEVRAAGD_SLEUTEL)[ingredientId]
  return !t || Date.now() - t > OPNIEUW_NA_MS
}
export const markeerGevraagd = (ingredientId) => {
  const m = lees(GEVRAAGD_SLEUTEL)
  m[ingredientId] = Date.now()
  schrijf(GEVRAAGD_SLEUTEL, m)
}

// De eigen, nog niet gekeurde foto van deze klant voor dit product, of null.
// resolveFoodImage roept dit bij elke kaart aan: de lijst één keer lezen.
let eigenCache = null
export const eigenProductFoto = (item) => {
  if (!item) return null
  const m = eigenCache || (eigenCache = lees(EIGEN_SLEUTEL))
  return m[item?.id] || m[item?.ingredient_id] || (item?.barcode && m[item.barcode]) || null
}

// Kleiner maken vóór het uploaden: een telefoonfoto is 3-12 MB, dit wordt
// ~100 KB. Langste zijde 900 px, JPEG.
const verklein = (bestand) => new Promise((ok, fout) => {
  const url = URL.createObjectURL(bestand)
  const img = new Image()
  img.onload = () => {
    const schaal = Math.min(1, 900 / Math.max(img.width, img.height))
    const c = document.createElement('canvas')
    c.width = Math.round(img.width * schaal)
    c.height = Math.round(img.height * schaal)
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
    URL.revokeObjectURL(url)
    c.toBlob(b => (b ? ok(b) : fout(new Error('verkleinen mislukt'))), 'image/jpeg', 0.82)
  }
  img.onerror = () => { URL.revokeObjectURL(url); fout(new Error('foto niet te lezen')) }
  img.src = url
})

// Uploaden + inzending. Geeft de publieke URL terug (of gooit).
export async function stuurProductFotoIn(supabase, { ingredientId, barcode, bestand }) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('niet ingelogd')
  const blob = await verklein(bestand)
  const pad = `productfotos/${user.id}/${ingredientId}-${Date.now()}.jpg`
  const { error: upFout } = await supabase.storage.from('meal-photos').upload(pad, blob, { contentType: 'image/jpeg', upsert: false })
  if (upFout) throw upFout
  const url = supabase.storage.from('meal-photos').getPublicUrl(pad).data.publicUrl
  // Een query-builder is geen Promise: geen .catch(), wel de fout uitlezen.
  const { error } = await supabase.from('product_foto_inzendingen').insert({ ingredient_id: ingredientId, barcode: barcode || null, foto_url: url })
  if (error) throw error
  const m = lees(EIGEN_SLEUTEL)
  m[ingredientId] = url
  if (barcode) m[barcode] = url
  schrijf(EIGEN_SLEUTEL, m)
  eigenCache = m
  return url
}
