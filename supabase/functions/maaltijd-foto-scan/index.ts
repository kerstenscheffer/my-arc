// supabase/functions/maaltijd-foto-scan/index.ts
//
// Foto van een maaltijd → lijst onderdelen met geschatte grammen.
//
//   POST { image: <base64 zonder data:-prefix>, media_type?: 'image/jpeg' }
//   → { gerecht, onderdelen: [{ naam, zoekterm, gram, zekerheid }] }
//
// Alleen herkennen en schatten. De macro's komen NIET van het model: de app
// zoekt elk onderdeel op in onze eigen productendatabase (zoek_ingredienten)
// en de klant controleert de grammen voordat er iets gelogd wordt.
//
// Sleutel: ANTHROPIC_API_KEY als Supabase-secret, nooit in code.
// verify_jwt staat aan: alleen ingelogde gebruikers kunnen scannen.

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const MODEL = 'claude-sonnet-5-5'

const PROMPT = `Je bekijkt een foto van eten voor een Nederlandse fitness-app.
Benoem elk los onderdeel dat je ziet en schat hoeveel gram er ligt.

Regels:
- Eén onderdeel per component (rijst, kipfilet, broccoli, saus). Geen ingrediënten die je niet ziet.
- "zoekterm": een korte, gewone Nederlandse productnaam zoals die in een supermarkt-database staat (bv. "rijst", "kipfilet", "broccoli", "pindasaus", "volkoren brood", "halfvolle melk"). Geen merk, geen bereidingszinnen.
- "gram": het eetbare gewicht zoals het op het bord ligt (gekookte rijst, gebakken vlees). Schat met referenties: een bord is ~26 cm, een eetlepel ~15 g, een sneetje brood ~35 g, een ei ~55 g.
- Dranken in ml als gram.
- "zekerheid": hoog, middel of laag.
- Staat er geen eten op de foto, geef dan een lege lijst.

Geef je antwoord altijd via de tool maaltijd_onderdelen.`

const TOOL = {
  name: 'maaltijd_onderdelen',
  description: 'De herkende onderdelen van de maaltijd op de foto.',
  input_schema: {
    type: 'object',
    properties: {
      gerecht: { type: 'string', description: 'Korte Nederlandse naam van het gerecht, bv. "Rijst met kip en broccoli".' },
      onderdelen: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            naam: { type: 'string', description: 'Wat je ziet, in het Nederlands.' },
            zoekterm: { type: 'string' },
            gram: { type: 'number' },
            zekerheid: { type: 'string', enum: ['hoog', 'middel', 'laag'] },
          },
          required: ['naam', 'zoekterm', 'gram', 'zekerheid'],
        },
      },
    },
    required: ['gerecht', 'onderdelen'],
  },
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } })

  try {
    const sleutel = Deno.env.get('ANTHROPIC_API_KEY')
    if (!sleutel) return json({ error: 'Foto-scanner is nog niet ingesteld (ANTHROPIC_API_KEY ontbreekt).' }, 503)

    const body = await req.json().catch(() => ({}))
    const image = String(body.image || '')
    const mediaType = ['image/jpeg', 'image/png', 'image/webp'].includes(body.media_type) ? body.media_type : 'image/jpeg'
    if (!image) return json({ error: 'Geen foto meegestuurd' }, 400)
    // ~5 MB base64 is de grens van de API; de app verkleint vooraf naar ~1024 px.
    if (image.length > 6_500_000) return json({ error: 'Foto is te groot' }, 413)

    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': sleutel,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        tools: [TOOL],
        // Een vaste tool afdwingen kan dit model niet; 'auto' plus de
        // instructie in de prompt, en hieronder een terugval op JSON in tekst.
        tool_choice: { type: 'auto' },
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: image } },
            { type: 'text', text: PROMPT },
          ],
        }],
      }),
      signal: AbortSignal.timeout(45000),
    })
    const data = await r.json().catch(() => null)
    if (!r.ok) {
      console.error('Anthropic-fout', r.status, JSON.stringify(data))
      return json({ error: 'Herkennen mislukt, probeer opnieuw.' }, 502)
    }
    const blok = (data?.content || []).find((b: any) => b.type === 'tool_use')
    let uit = blok?.input || null
    if (!uit) {
      const tekst = (data?.content || []).filter((b: any) => b.type === 'text').map((b: any) => b.text).join('\n')
      const m = tekst.match(/\{[\s\S]*\}/)
      try { uit = m ? JSON.parse(m[0]) : {} } catch { uit = {} }
    }
    const onderdelen = (Array.isArray(uit.onderdelen) ? uit.onderdelen : [])
      .map((o: any) => ({
        naam: String(o.naam || '').trim(),
        zoekterm: String(o.zoekterm || o.naam || '').trim(),
        gram: Math.max(1, Math.round(Number(o.gram) || 0)),
        zekerheid: ['hoog', 'middel', 'laag'].includes(o.zekerheid) ? o.zekerheid : 'middel',
      }))
      .filter((o: any) => o.zoekterm)
      .slice(0, 12)
    return json({ gerecht: String(uit.gerecht || '').trim(), onderdelen })
  } catch (e) {
    console.error(e)
    return json({ error: 'Herkennen mislukt, probeer opnieuw.' }, 500)
  }
})
