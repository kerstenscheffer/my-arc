// vite-api-dev.js
//
// Laat de serverless functies uit /api ook op localhost draaien.
//
// In productie serveert Vercel alles in /api als functie. Vite doet dat niet,
// dus elke fetch naar /api/... geeft daar een kale 404 — wat lijkt op "de
// functie is stuk" terwijl er niets mis is. Dat heeft al meermaals tot
// verkeerde diagnoses geleid (de voedingsintake die "kapot" leek, de
// profielfoto-upload).
//
// Deze plugin hangt in de dev-server een middleware die /api/<naam> naar
// api/<naam>.js stuurt en de default export aanroept met een req/res die
// zich gedraagt zoals de functie verwacht: req.query, req.body al geparsed,
// en res.status().json(). Alleen in dev; aan de productie-build verandert
// niets.
//
// Env-vars komen uit .env.local zodat de functie dezelfde keys ziet als op
// Vercel. Zonder service key gedraagt hij zich hier hetzelfde als daar:
// een nette foutmelding in plaats van een stille mislukking.

import fs from 'node:fs'
import path from 'node:path'

const laadEnv = (wortel) => {
  for (const naam of ['.env.local', '.env']) {
    const pad = path.join(wortel, naam)
    if (!fs.existsSync(pad)) continue
    for (const regel of fs.readFileSync(pad, 'utf8').split('\n')) {
      const i = regel.indexOf('=')
      if (i < 1 || regel.trim().startsWith('#')) continue
      const sleutel = regel.slice(0, i).trim()
      if (!(sleutel in process.env)) process.env[sleutel] = regel.slice(i + 1).trim()
    }
  }
}

const leesBody = (req) => new Promise((klaar) => {
  const stukken = []
  req.on('data', (c) => stukken.push(c))
  req.on('end', () => {
    const ruw = Buffer.concat(stukken).toString('utf8')
    if (!ruw) return klaar({})
    try { klaar(JSON.parse(ruw)) } catch { klaar(ruw) }
  })
})

export default function apiDev() {
  return {
    name: 'myarc-api-dev',
    apply: 'serve',
    configureServer(server) {
      const wortel = server.config.root
      laadEnv(wortel)

      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) return next()

        const url = new URL(req.url, 'http://localhost')
        const naam = url.pathname.slice('/api/'.length).replace(/[^a-zA-Z0-9_-]/g, '')
        const bestand = path.join(wortel, 'api', `${naam}.js`)
        if (!naam || !fs.existsSync(bestand)) return next()

        try {
          // Cache omzeilen zodat een wijziging in de functie meteen meetelt,
          // net als bij de rest van de dev-server.
          const mod = await import(`${bestand}?t=${Date.now()}`)
          const handler = mod.default
          if (typeof handler !== 'function') return next()

          req.query = Object.fromEntries(url.searchParams)
          if (req.method !== 'GET' && req.method !== 'HEAD') req.body = await leesBody(req)

          // Vercel's res-vorm nabouwen. Alleen wat de functies gebruiken.
          res.status = (code) => { res.statusCode = code; return res }
          res.json = (data) => {
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(data))
            return res
          }
          res.send = (data) => { res.end(typeof data === 'string' ? data : JSON.stringify(data)); return res }

          await handler(req, res)
          if (!res.writableEnded) res.end()
        } catch (e) {
          console.error(`[api-dev] ${naam} faalde:`, e)
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: e.message, bron: 'vite-api-dev' }))
        }
      })
    },
  }
}
