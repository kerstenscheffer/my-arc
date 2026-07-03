// Test: zoekt voor een paar ingrediëntnamen een foto op Wikipedia (NL/EN) en
// OpenFoodFacts. Print alleen wat'ie zou pakken — geen DB-writes.
const NAMES = ['Aardappelen','Aardappels Gekookt','Aardbeien Jam','Agave Siroop','Amandelmelk','Appelazijn','Banaan','Basilicum','BBQ Saus','Boerenkool','Bosvruchten Mix','Boter','Brie','Brinta']

// Strip kwalificaties die de zoekterm vertroebelen.
const cleanName = (n) => n.replace(/\(.*?\)/g, '').replace(/\b(gekookt|gebakken|droog|vers|rauw|mager|magere|vol|volle|light|naturel|mix)\b/gi, '').replace(/\s+/g, ' ').trim()

const wiki = async (lang, term) => {
  try {
    const url = `https://${lang}.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(term)}&gsrlimit=1&gsrnamespace=0&prop=pageimages&piprop=thumbnail&pithumbsize=500&format=json&origin=*`
    const res = await fetch(url, { headers: { 'User-Agent': 'MyArc/1.0' } })
    if (!res.ok) return null
    const d = await res.json()
    const pages = d.query?.pages
    if (!pages) return null
    const p = Object.values(pages)[0]
    return p?.thumbnail?.source || null
  } catch { return null }
}
const off = async (term) => {
  try {
    const res = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(term)}&search_simple=1&action=process&json=1&page_size=1&fields=product_name,image_front_url`, { headers: { 'User-Agent': 'MyArc/1.0' } })
    if (!res.ok) return null
    const d = await res.json()
    const p = (d.products || [])[0]
    return p?.image_front_url ? `${p.image_front_url}  (${p.product_name || '?'})` : null
  } catch { return null }
}

for (const n of NAMES) {
  const term = cleanName(n)
  const w = await wiki('nl', term) || await wiki('en', term)
  const o = await off(term)
  console.log(`\n${n}  (zoek: "${term}")`)
  console.log(`  wiki: ${w || '—'}`)
  console.log(`  off:  ${o || '—'}`)
}
