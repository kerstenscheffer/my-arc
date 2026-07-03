// Lazy backfill van product-foto's uit Open Food Facts.
// We slaan de image_url op in ai_ingredients zodat we hem maar één keer
// ophalen per product. Items zonder barcode of items die OFF al een keer
// geen foto gaf (gemarkeerd via image_url_checked_at) worden geskipt zodat
// we niet onnodig het netwerk slaan.
//
// Wordt aangeroepen na een log (niet bij render) — dat houdt de UI snel
// en zorgt dat alleen items die de gebruiker écht gebruikt geleidelijk
// een foto krijgen. Items die de gebruiker nooit logt blijven leeg, en
// dat is prima.

const FRESH_DAYS = 90 // niet opnieuw proberen binnen 90 dagen

const wasRecentlyChecked = (iso) => {
  if (!iso) return false
  const ts = new Date(iso).getTime()
  if (Number.isNaN(ts)) return false
  return Date.now() - ts < FRESH_DAYS * 24 * 60 * 60 * 1000
}

export const fetchOffImage = async (barcode) => {
  if (!barcode) return null
  try {
    const controller = new AbortController()
    const t = setTimeout(() => controller.abort(), 5000)
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${barcode}.json?fields=image_url,image_front_url,image_small_url`,
      { headers: { 'User-Agent': 'MyArc - Nutrition App - Version 1.0' }, signal: controller.signal }
    )
    clearTimeout(t)
    if (!res.ok) return null
    const data = await res.json()
    if (data.status !== 1) return null
    const p = data.product || {}
    return p.image_front_url || p.image_url || p.image_small_url || null
  } catch {
    return null
  }
}

// Probeer een image_url te enrichen voor een ingredient row. Niet awaiten;
// het draait fire-and-forget na een log. Haalt de huidige row op om te
// zien of er al een image is of dat we 'm recent al hebben gecheckt — zo
// kunnen callers gewoon (db, ingredientId) doorgeven zonder bookkeeping.
export const enrichIngredientImage = async (db, ingredientId) => {
  if (!db?.supabase || !ingredientId) return
  try {
    const { data: row } = await db.supabase
      .from('ai_ingredients')
      .select('id, barcode, image_url, image_url_checked_at')
      .eq('id', ingredientId)
      .maybeSingle()
    if (!row) return
    if (row.image_url) return                          // al een image
    if (!row.barcode) return                            // geen barcode → niets om op te zoeken
    if (wasRecentlyChecked(row.image_url_checked_at)) return  // al recent geprobeerd

    const url = await fetchOffImage(row.barcode)
    const now = new Date().toISOString()
    const patch = url
      ? { image_url: url, image_url_checked_at: now }
      : { image_url_checked_at: now }
    await db.supabase.from('ai_ingredients').update(patch).eq('id', ingredientId)
  } catch (e) {
    console.warn('enrichIngredientImage: failed', e)
  }
}
