// api/unsplash.js
//
// Proxy naar de Unsplash API voor de ingrediënt-fotokiezer in de coach-hub.
//
// Waarom een serverless functie en niet direct uit de browser: de access key
// mag niet in de frontend-bundle belanden. Een `VITE_`-variabele wordt letterlijk
// in de gebouwde JS gezet en is dan voor iedere bezoeker te lezen.
//
// Twee acties, bewust in één bestand: Vercel Hobby staat 12 serverless functies
// toe en er waren er al 10 in gebruik.
//
//   ?action=search&q=<term>   → zoekresultaten mét fotograaf-gegevens
//   ?action=download&loc=<url> → verplichte download-melding aan Unsplash
//   ?diag=1                    → staat de key goed in deze omgeving?
//
// De Unsplash API-richtlijnen die hier in zitten:
//   1. Hotlinken: we geven de URL's uit `photo.urls` door en slaan de foto
//      nooit zelf op. Alleen die URL onthouden we.
//   2. Attributie: fotograafnaam + profiellink, met utm-parameters, gaan mee in
//      elk resultaat zodat de app ze kan tonen en opslaan.
//   3. Download-melding: zodra de coach een foto daadwerkelijk kiest, moet
//      `photo.links.download_location` aangeroepen worden. Dat is geen echte
//      download maar de teller waarmee Unsplash fotografen hun statistieken geeft.

const APP_NAME = 'my_arc'
const UTM = `utm_source=${APP_NAME}&utm_medium=referral`

// Alle links terug naar Unsplash moeten de utm-parameters hebben.
const metUtm = (url) => {
  if (!url) return null
  return url.includes('?') ? `${url}&${UTM}` : `${url}?${UTM}`
}

const key = () =>
  process.env.UNSPLASH_ACCESS_KEY || process.env.VITE_UNSPLASH_ACCESS_KEY || null

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')

  const accessKey = key()

  // Diagnose zonder de key zelf te verklappen — alleen of hij er is en hoe
  // lang hij is. Een access key van Unsplash is 43 tekens; wijkt dat af, dan
  // is de omgevingsvariabele verminkt (dat is hier eerder gebeurd).
  if (req.query?.diag) {
    return res.status(200).json({
      heeft_key: !!accessKey,
      key_lengte: accessKey ? accessKey.length : 0,
      verwachte_lengte: 43,
      app_naam: APP_NAME,
    })
  }

  if (!accessKey) {
    return res.status(500).json({
      error: 'UNSPLASH_ACCESS_KEY ontbreekt in deze omgeving',
      hint: 'Zet hem in Vercel bij Settings → Environment Variables en in .env.local voor lokaal werk.',
    })
  }

  const auth = { Authorization: `Client-ID ${accessKey}`, 'Accept-Version': 'v1' }
  const action = req.query?.action || 'search'

  try {
    // ── Download-melding ──────────────────────────────────────────────────
    // Verplicht op het moment dat een foto gekozen wordt. We geven alleen het
    // pad door dat Unsplash zelf in `download_location` heeft gezet, zodat dit
    // geen open doorgeefluik naar willekeurige adressen is.
    if (action === 'download') {
      const loc = req.query?.loc
      if (!loc || !/^https:\/\/api\.unsplash\.com\//.test(loc)) {
        return res.status(400).json({ error: 'Ongeldige download_location' })
      }
      const r = await fetch(loc, { headers: auth })
      // Mislukt de melding, dan is dat geen reden om de coach te blokkeren;
      // de foto is al gekozen. We melden het wel terug.
      return res.status(200).json({ gemeld: r.ok, status: r.status })
    }

    // ── Zoeken ────────────────────────────────────────────────────────────
    if (action === 'search') {
      const q = String(req.query?.q || '').trim()
      if (!q) return res.status(400).json({ error: 'Geen zoekterm' })

      const perPage = Math.min(Number(req.query?.per_page) || 9, 24)
      const url = new URL('https://api.unsplash.com/search/photos')
      url.searchParams.set('query', q)
      url.searchParams.set('per_page', String(perPage))
      // Eten is bijna altijd liggend gefotografeerd; staande stockfoto's
      // vullen de vierkante thumbnails slecht.
      url.searchParams.set('orientation', 'landscape')
      url.searchParams.set('content_filter', 'high')

      const r = await fetch(url, { headers: auth })
      if (!r.ok) {
        const tekst = await r.text().catch(() => '')
        return res.status(r.status).json({
          error: 'Unsplash gaf een fout',
          status: r.status,
          // 403 bij Unsplash betekent bijna altijd: uurlimiet bereikt.
          hint: r.status === 403 ? 'Waarschijnlijk de uurlimiet bereikt (50/uur in demo-modus).' : undefined,
          detail: tekst.slice(0, 300),
        })
      }

      const d = await r.json()
      const fotos = (d.results || []).map(p => ({
        id: p.id,
        // Hotlinks rechtstreeks uit photo.urls, zoals de richtlijn eist.
        thumb: p.urls?.small || null,
        full: p.urls?.regular || null,
        alt: p.alt_description || p.description || null,
        author: p.user?.name || 'Onbekend',
        authorUrl: metUtm(p.user?.links?.html),
        // Dit pad roepen we aan zodra de coach deze foto kiest.
        downloadLocation: p.links?.download_location || null,
      })).filter(f => f.thumb && f.full)

      return res.status(200).json({ totaal: d.total ?? fotos.length, fotos })
    }

    return res.status(400).json({ error: `Onbekende actie: ${action}` })
  } catch (e) {
    console.error('unsplash proxy faalde:', e)
    return res.status(500).json({ error: e?.message || 'Onbekende fout' })
  }
}
