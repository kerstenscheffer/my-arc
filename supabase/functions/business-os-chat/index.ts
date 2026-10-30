// supabase/functions/business-os-chat/index.ts
//
// De AI-chat onder de reactor in Business OS (30 okt 2026). Kersten geeft hier
// taken uit, bv. "maak 3 reel-scripts over buikvet na je 30e".
//
//   POST { berichten: [{ role: 'user'|'assistant', content }], context?: {...} }
//   → { tekst }
//
// Alleen coaches (get_my_portal_role = coach/both), anders kan elke ingelogde
// klant API-tegoed opmaken. Sleutel: ANTHROPIC_API_KEY als Supabase-secret.

import { createClient } from 'npm:@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const MODEL = 'claude-opus-5-5'

const SYSTEEM = `Je bent de rechterhand van Kersten, eigenaar van MY ARC: online coaching voor drukke werkende mannen van 25-40 die hun buik kwijt willen. Je zit in zijn Business OS, het scherm met zijn maanddoel, de keten views → leads → reactie → call → sale en de zwakste schakel. Kersten geeft je hier taken die hij uitbesteedt.

Wat je doet:
- Video-scripts (reels, talking head, green screen, slider): per script het format, de hook (letterlijke eerste zin + tekst op scherm), de beats in korte regels, de kernwaarde en de CTA. Een script is hardop uit te spreken in 30-60 seconden.
- Hooks, captions, DM-teksten, magnet-berichten, outreach.
- Meedenken over de cijfers: welke schakel aanpakken en wat hij deze week concreet doet.

Taalregels (altijd):
- Nederlands, spreektaal, kort en direct. Geen essays, geen inleiding, geen samenvatting achteraf.
- Hooks gaan over de KIJKER, nooit "ik sprak een man".
- "Droger worden" / "vet verliezen", nooit "afvallen". Geen jargon.
- Zijn methode heet de 80/20 methode. Vijand: de betweters.
- Geen gedachtestreepjes (— of –). Geen emoji's tenzij gevraagd.
- Kopieer nooit letterlijk van andere coaches: zelfde mechanisme, zijn onderwerp.

Opmaak: platte tekst met korte kopjes en pijltjes (→). Geen markdown-tabellen. Vraag alleen door als de taak echt onduidelijk is; anders lever direct een eerste versie die hij kan aanscherpen.`

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } })

  try {
    const sleutel = Deno.env.get('ANTHROPIC_API_KEY')
    if (!sleutel) return json({ error: 'AI is nog niet ingesteld (ANTHROPIC_API_KEY ontbreekt).' }, 503)

    const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: req.headers.get('Authorization') || '' } },
    })
    const { data: rol } = await sb.rpc('get_my_portal_role')
    if (rol !== 'coach' && rol !== 'both') return json({ error: 'Alleen voor coaches.' }, 403)

    const body = await req.json().catch(() => ({}))
    const berichten = (Array.isArray(body.berichten) ? body.berichten : [])
      .filter((b: any) => (b.role === 'user' || b.role === 'assistant') && typeof b.content === 'string' && b.content.trim())
      .slice(-20)
      .map((b: any) => ({ role: b.role, content: b.content.slice(0, 8000) }))
    // De API wil dat het gesprek met de gebruiker begint en eindigt.
    while (berichten.length && berichten[0].role !== 'user') berichten.shift()
    if (!berichten.length || berichten[berichten.length - 1].role !== 'user') {
      return json({ error: 'Geen vraag meegestuurd' }, 400)
    }

    const context = body.context ? JSON.stringify(body.context).slice(0, 4000) : ''
    const systeem = context
      ? `${SYSTEEM}\n\nCijfers uit Business OS op dit moment (JSON):\n${context}`
      : SYSTEEM

    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': sleutel,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ model: MODEL, max_tokens: 2500, system: systeem, messages: berichten }),
      signal: AbortSignal.timeout(90000),
    })
    const data = await r.json().catch(() => null)
    if (!r.ok) {
      console.error('Anthropic-fout', r.status, JSON.stringify(data))
      return json({ error: 'AI gaf geen antwoord, probeer opnieuw.' }, 502)
    }
    const tekst = (data?.content || []).filter((b: any) => b.type === 'text').map((b: any) => b.text).join('\n').trim()
    return json({ tekst })
  } catch (e) {
    console.error(e)
    return json({ error: 'AI gaf geen antwoord, probeer opnieuw.' }, 500)
  }
})
