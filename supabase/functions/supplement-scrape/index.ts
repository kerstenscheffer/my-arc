// supabase/functions/supplement-scrape/index.ts
//
// Supplementproducten van webwinkels ophalen voor de catalogus
// (supplement_products). Alleen voor coaches.
//
//   { action: 'parse', url }            → één productpagina uitlezen
//   { action: 'zoek', query, max? }     → zoeken op Bol en Etos, top-resultaten uitgelezen
//   { action: 'controleer', ids? }      → bestaande producten opnieuw uitlezen:
//                                         prijs, foto en of de link nog leeft
//
// Uitlezen gaat via schema.org JSON-LD (Product) met Open Graph als terugval.
// Dat is wat winkels zelf voor Google publiceren, dus het is stabieler dan
// de opmaak van de pagina. Albert Heijn, Kruidvat en Decathlon blokkeren
// automatische verzoeken (403); die links kun je wel plakken, maar ze
// worden dan als 'geblokkeerd' gemarkeerd in plaats van als dood.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const UA = {
  'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36',
  'accept': 'text/html,application/xhtml+xml',
  'accept-language': 'nl-NL,nl;q=0.9,en;q=0.8',
}

const WINKELS: Record<string, string> = {
  'bol.com': 'Bol', 'etos.nl': 'Etos', 'bulk.com': 'Bulk', 'myprotein.nl': 'MyProtein', 'myprotein.com': 'MyProtein',
  'zumub.com': 'Zumub', 'kruidvat.nl': 'Kruidvat', 'ah.nl': 'Albert Heijn', 'decathlon.nl': 'Decathlon',
  'hollandandbarrett.nl': 'Holland & Barrett', 'bodyandfit.com': 'Body & Fit', 'xxlnutrition.com': 'XXL Nutrition',
  'vitakruid.nl': 'Vitakruid', 'trekpleister.nl': 'Trekpleister', 'jumbo.com': 'Jumbo',
}
const winkelVan = (url: string) => {
  try {
    const h = new URL(url).hostname.replace(/^www\./, '')
    const k = Object.keys(WINKELS).find(d => h === d || h.endsWith('.' + d))
    return k ? WINKELS[k] : h
  } catch { return null }
}

const ontsnap = (s: string | null | undefined) => s == null ? s : String(s)
  .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim()

function zoekProduct(n: any): any {
  if (!n || typeof n !== 'object') return null
  if (Array.isArray(n)) { for (const x of n) { const f = zoekProduct(x); if (f) return f } return null }
  const t = [].concat(n['@type'] || []).map(String)
  if (t.some(x => /^(Product|ProductGroup)$/i.test(x))) return n
  for (const k of ['@graph', 'mainEntity']) { const f = zoekProduct(n[k]); if (f) return f }
  return null
}

async function parse(url: string) {
  let r: Response
  try {
    r = await fetch(url, { headers: UA, redirect: 'follow', signal: AbortSignal.timeout(20000) })
  } catch (e) {
    return { url, status: 0, link_status: 'dood', fout: String((e as Error)?.message || e) }
  }
  const out: Record<string, any> = { url: r.url || url, status: r.status, store: winkelVan(r.url || url) }
  if (r.status === 403 || r.status === 429) { out.link_status = 'geblokkeerd'; return out }
  if (r.status >= 400) { out.link_status = 'dood'; return out }
  const html = await r.text()
  const meta = (k: string) => {
    const a = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${k}["'][^>]+content=["']([^"']+)`, 'i'))
      || html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${k}["']`, 'i'))
    return a ? ontsnap(a[1]) : null
  }
  let p: any = null
  for (const m of html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try { p = zoekProduct(JSON.parse(m[1].trim())); if (p) break } catch { /* kapotte JSON-LD overslaan */ }
  }
  if (p) {
    const variant = p.hasVariant ? [].concat(p.hasVariant)[0] as any : null
    const o: any = [].concat(p.offers || variant?.offers || [])[0] || {}
    const spec = o.priceSpecification ? [].concat(o.priceSpecification)[0] as any : null
    const prijs = o.price ?? o.lowPrice ?? spec?.price
    let img: any = [].concat(p.image || variant?.image || [])[0]
    if (img && typeof img === 'object') img = img.url || img.contentUrl
    out.product_name = ontsnap(p.name)
    out.brand = ontsnap(typeof p.brand === 'string' ? p.brand : p.brand?.name)
    out.image_url = img || null
    out.price = prijs != null && prijs !== '' ? Number(String(prijs).replace(',', '.')) : null
    out.in_stock = o.availability ? !/OutOfStock|SoldOut|Discontinued/i.test(String(o.availability)) : null
  }
  out.product_name ||= meta('og:title')
  out.image_url ||= meta('og:image')
  if (out.price == null) {
    const pm = meta('product:price:amount') || meta('og:price:amount')
    if (pm) out.price = Number(pm.replace(',', '.'))
  }
  if (out.price != null && !Number.isFinite(out.price)) out.price = null
  out.link_status = out.product_name ? 'ok' : 'onbekend'
  return out
}

// Hoeveel tegelijk ophalen: genoeg voor snelheid, niet zoveel dat een
// winkel ons als aanval ziet.
async function inPartijen<T, R>(lijst: T[], n: number, f: (x: T) => Promise<R>) {
  const uit: R[] = []
  for (let i = 0; i < lijst.length; i += n) uit.push(...await Promise.all(lijst.slice(i, i + n).map(f)))
  return uit
}

async function zoek(query: string, max = 6) {
  const q = encodeURIComponent(query)
  const bronnen: [string, RegExp, string][] = [
    [`https://www.bol.com/nl/nl/s/?searchtext=${q}`, /href="(\/nl\/nl\/p\/[^"#?]+\/\d+\/)/g, 'https://www.bol.com'],
    [`https://www.etos.nl/search/?q=${q}`, /href="(\/producten\/[^"#?]+\.html)"/g, 'https://www.etos.nl'],
  ]
  const woorden = query.toLowerCase().split(/\s+/).filter(w => w.length > 2)
  const links: string[] = []
  for (const [url, re, basis] of bronnen) {
    try {
      const r = await fetch(url, { headers: UA, redirect: 'follow', signal: AbortSignal.timeout(20000) })
      const h = await r.text()
      const gevonden = [...new Set([...h.matchAll(re)].map(m => basis + m[1]))]
        // Zoekpagina's tonen ook advertenties en "anderen bekeken ook";
        // alleen links waarin een zoekwoord voorkomt.
        .filter(l => woorden.length === 0 || woorden.some(w => decodeURIComponent(l).toLowerCase().includes(w)))
      links.push(...gevonden.slice(0, max))
    } catch { /* winkel niet bereikbaar: de andere gaat gewoon door */ }
  }
  const res = await inPartijen(links, 4, parse)
  return res.filter(x => x.link_status === 'ok')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } })
  try {
    // De service-sleutel mag ook (geplande prijscheck). verify_jwt staat aan,
    // dus de handtekening is al gecontroleerd voordat we hier de rol lezen.
    const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '')
    let rolUitToken = ''
    try {
      const deel = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
      rolUitToken = JSON.parse(atob(deel + '='.repeat((4 - deel.length % 4) % 4))).role || ''
    } catch { /* geen geldig token */ }
    const isService = rolUitToken === 'service_role'
    const sb = isService
      ? createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
      : createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
          global: { headers: { Authorization: req.headers.get('Authorization') || '' } },
        })
    if (!isService) {
      const { data: rol } = await sb.rpc('get_my_portal_role')
      if (!['coach', 'both'].includes(String(rol))) return json({ error: 'Alleen voor coaches' }, 403)
    }

    const body = await req.json().catch(() => ({}))
    if (body.action === 'parse') {
      if (!/^https?:\/\//i.test(String(body.url || ''))) return json({ error: 'Geen geldige link' }, 400)
      return json({ product: await parse(body.url) })
    }
    if (body.action === 'zoek') {
      const query = String(body.query || '').trim()
      if (!query) return json({ error: 'Geen zoekterm' }, 400)
      return json({ resultaten: await zoek(query, Math.min(Number(body.max) || 6, 10)) })
    }
    if (body.action === 'controleer') {
      let q = sb.from('supplement_products').select('id, url')
      if (Array.isArray(body.ids) && body.ids.length) q = q.in('id', body.ids)
      const { data: rijen, error } = await q
      if (error) throw error
      const uit = await inPartijen(rijen || [], 4, async (rij: any) => {
        const p = await parse(rij.url)
        const upd: Record<string, any> = { link_status: p.link_status, last_checked_at: new Date().toISOString(), updated_at: new Date().toISOString() }
        if (p.link_status === 'ok') {
          if (p.price != null) upd.price = p.price
          if (p.image_url) upd.image_url = p.image_url
          if (p.in_stock != null) upd.in_stock = p.in_stock
        }
        const { error: e } = await sb.from('supplement_products').update(upd).eq('id', rij.id)
        return { id: rij.id, link_status: p.link_status, fout: e?.message }
      })
      return json({ gecontroleerd: uit })
    }
    return json({ error: 'Onbekende actie' }, 400)
  } catch (e) {
    return json({ error: String((e as Error)?.message || e) }, 500)
  }
})
