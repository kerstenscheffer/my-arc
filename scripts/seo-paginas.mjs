// scripts/seo-paginas.mjs (21 nov 2026): maakt de statische SEO-pagina's in public/ uit seo-paginas.json.
// Draai: node scripts/seo-paginas.mjs . (vercel.json heeft per pagina een rewrite, sitemap.xml een regel)
import fs from 'node:fs'
const repo = process.argv[2]
const SITE = 'https://www.myarcfitness.com'
const PAGINAS = JSON.parse(fs.readFileSync(new URL('./seo-paginas.json', import.meta.url)))
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')
const strip = (s) => s.replace(/<[^>]+>/g, '')
for (const p of PAGINAS) {
  const url = `${SITE}/${p.slug}`
  const ld = [
    { '@context': 'https://schema.org', '@type': 'Service', name: p.dienst, serviceType: 'Online fitness coaching', areaServed: 'NL', availableChannel: { '@type': 'ServiceChannel', serviceUrl: url }, provider: { '@type': 'Organization', name: 'MY ARC Coaching', url: SITE + '/', founder: { '@type': 'Person', name: 'Kersten Scheffer' } }, audience: { '@type': 'PeopleAudience', suggestedGender: 'male', suggestedMinAge: 25, suggestedMaxAge: 55 } },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: p.faq.map(([v, a]) => ({ '@type': 'Question', name: v, acceptedAnswer: { '@type': 'Answer', text: strip(a) } })) },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'MY ARC Coaching', item: SITE + '/' }, { '@type': 'ListItem', position: 2, name: p.kruimel, item: url }] },
  ]
  const verder = PAGINAS.filter((x) => x.slug !== p.slug).map((x) => `<a href="/${x.slug}">${x.kruimel}</a>`).join('\n          ')
  const html = `<!doctype html>
<html lang="nl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(p.titel)}</title>
  <meta name="description" content="${esc(p.omschrijving)}" />
  <link rel="canonical" href="${url}" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="MY ARC Coaching" />
  <meta property="og:title" content="${esc(p.titel)}" />
  <meta property="og:description" content="${esc(p.omschrijving)}" />
  <meta property="og:url" content="${url}" />
  <meta property="og:image" content="${SITE}/og-image.jpg" />
  <meta property="og:locale" content="nl_NL" />
  <meta name="twitter:card" content="summary_large_image" />
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;800;900&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/seo/seo.css" />
  <script type="application/ld+json">${JSON.stringify(ld)}</script>
</head>
<body>
  <!-- Gegenereerd uit scripts/seo-paginas.json, gemaakt met scripts/seo-paginas.mjs (21 nov 2026). Statisch, zodat Google de tekst zonder JavaScript leest. -->
  <header class="kop">
    <div class="bak">
      <a class="logo" href="/"><img src="/ma-logo-header.png" alt="" width="44" height="22" />MY ARC <span>COACHING</span></a>
      <a class="kop-knop" href="/6weekchallenge">Challenge</a>
    </div>
  </header>
  <main>
    <article class="bak">
      <p class="oog">${p.oog}</p>
      <h1>${p.h1}</h1>
      <a class="score" href="https://nl.trustpilot.com/review/myarcfitness.com" target="_blank" rel="noopener"><i>★★★★★</i> 4,4 / 5 op Trustpilot</a>
      ${p.body}
      <h2>Veelgestelde vragen</h2>
      ${p.faq.map(([v, a]) => `<details><summary>${v}</summary><p>${a}</p></details>`).join('\n      ')}
      <div class="blok">
        <h2>Klaar om te starten?</h2>
        <p>In de 6 weken challenge betaal je 297 euro borg. Haal je de vier acties, dan krijg je die borg terug. Je kunt dus alleen winnen.</p>
        <a class="knop" href="/6weekchallenge">Bekijk de challenge</a>
      </div>
      <h2>Lees verder</h2>
      <nav class="verder">
          <a href="/">MY ARC Coaching home</a>
          ${verder}
          <a href="/mijn-menu">Gratis voedingsschema tool</a>
          <a href="/mijn-split">Gratis trainingsschema</a>
      </nav>
    </article>
  </main>
  <footer class="voet">
    <div class="bak">
      <nav>
        <a href="/">Home</a>
        <a href="/online-coaching">Online coaching</a>
        <a href="/online-coaching-afvallen">Online coaching afvallen</a>
        <a href="/online-coaching-voeding">Online coaching voeding</a>
        <a href="/6weekchallenge">6 weken challenge</a>
        <a href="/privacy">Privacy</a>
      </nav>
      <div>© MY ARC Coaching · KvK 92854486</div>
    </div>
  </footer>
</body>
</html>
`
  fs.writeFileSync(`${repo}/public/${p.slug}.html`, html)
  console.log('✓', p.slug, Math.round(strip(p.body).split(/\s+/).length), 'woorden body')
}
