// supabase/functions/editor-chat/index.ts
//
// Tabje 'Editor' in de Business OS-chat (30 okt 2026): Kersten praat hier met
// ChatGPT als video-editor-assistent (knipplannen, titels, ondertitels,
// instructies). Een bestaand gesprek in de ChatGPT-app is niet aanstuurbaar,
// dus dit gaat via de OpenAI API. Alleen tekst terug: ChatGPT kan niet in de
// editor klikken of bestanden op de Mac aanpassen.
//
//   POST { berichten: [{ role: 'user'|'assistant', content }] }
//   → { tekst, opdracht_id, model }  |  { fout: 'geen_sleutel' | 'openai' | ... }
//
// Systeemprompt = de skill 'Editor-basis' in business_os_skills (Kersten past die
// aan zonder codewijziging); geen rij → STANDAARD_BASIS. Model: secret
// OPENAI_MODEL, anders STANDAARD_MODEL. Elke vraag wordt een rij in
// editor_opdrachten (business-os-editor.sql): bezig → klaar / mislukt. Bestaat
// die tabel nog niet, dan werkt de chat gewoon door.
//
// Alleen de teameigenaar (coach_teams.owner_id). Sleutel: OPENAI_API_KEY, anders
// de eerste secret met GPT of OPENAI in de naam (Kersten: 'gpt api key'), zie
// zoekSleutel. Ontbreekt hij: 503 { fout: 'geen_sleutel' } en een rij in
// app_fouten (pagina business-os-editor). Nooit een sleutel in de frontend of de repo.

import { createClient } from 'npm:@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Goedkoop en standaard beschikbaar. Ander model: secret OPENAI_MODEL of hier aanpassen.
const STANDAARD_MODEL = 'gpt-5-mini'
const MAX_BERICHTEN = 30
const MAX_TEKENS = 12000

const STANDAARD_BASIS = 'Je bent de video-editor-assistent van Kersten (MY ARC). Geef knipplannen, titels, ondertitels en korte instructies, in spreektaal Nederlands, kort en direct.'
const BASIS_SKILL = 'Editor-basis'

// Eerst OPENAI_API_KEY, anders de eerste secret met GPT of OPENAI in de naam
// (hoofdletterongevoelig; namen met KEY eerst, OPENAI_MODEL telt niet mee).
function zoekSleutel(): string | undefined {
  const vast = Deno.env.get('OPENAI_API_KEY')
  if (vast) return vast
  const namen = Object.keys(Deno.env.toObject())
    .filter((n) => /GPT|OPENAI|OPEN_AI/i.test(n) && !/MODEL/i.test(n) && Deno.env.get(n))
    .sort((a, b) => Number(!/KEY/i.test(a)) - Number(!/KEY/i.test(b)) || a.localeCompare(b))
  if (namen[0]) console.log('editor-chat gebruikt secret', namen[0])
  return namen[0] ? Deno.env.get(namen[0]) : undefined
}
const SLEUTEL = zoekSleutel()
const MODEL_SECRET = Deno.env.get('OPENAI_MODEL')
if (!SLEUTEL) console.error('editor-chat: geen OpenAI-secret gevonden')

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } })
  // Gezet zodra de opdracht-rij bestaat, zodat een onverwachte fout hem op mislukt zet.
  let rijMislukt: ((fout: string) => Promise<void>) | null = null

  try {
    if (req.method !== 'POST') return json({ fout: 'alleen_post' }, 405)
    if (!req.headers.get('Authorization')) return json({ fout: 'geen_login' }, 401)

    const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: req.headers.get('Authorization') || '' } },
    })
    const { data: { user } } = await sb.auth.getUser()
    if (!user) return json({ fout: 'geen_login' }, 401)
    const { data: rol } = await sb.rpc('get_my_portal_role')
    if (rol !== 'coach' && rol !== 'both') return json({ fout: 'alleen_coach' }, 403)
    // Alleen de teameigenaar (coach_teams.owner_id = Kersten). Medewerkers zoals
    // Marcel krijgen 403 voordat er een betaalde API-aanroep gaat.
    const { data: eigenTeam } = await sb.from('coach_teams').select('id').eq('owner_id', user.id).limit(1)
    if (!eigenTeam?.length) return json({ fout: 'alleen_eigenaar' }, 403)

    const meldFout = (melding: string) => sb.from('app_fouten')
      .insert({ user_id: user.id, pagina: 'business-os-editor', melding: melding.slice(0, 1000) })
      .then((r) => { if (r.error) console.error('app_fouten', r.error.message) }, () => {})

    if (!SLEUTEL) {
      await meldFout('geen_sleutel: geen OPENAI_API_KEY of secret met GPT/OPENAI in de naam in Supabase Secrets')
      return json({ fout: 'geen_sleutel' }, 503)
    }

    const body = await req.json().catch(() => ({}))
    const berichten = (Array.isArray(body?.berichten) ? body.berichten : [])
      .filter((b: any) => (b?.role === 'user' || b?.role === 'assistant') && typeof b.content === 'string' && b.content.trim())
      .slice(-MAX_BERICHTEN)
      .map((b: any) => ({ role: b.role, content: b.content.slice(0, MAX_TEKENS) }))
    const laatste = berichten[berichten.length - 1]
    if (!laatste || laatste.role !== 'user') return json({ fout: 'geen_tekst' }, 400)

    // Editor-basis van deze coach (skill-rij; ontbreekt → standaardbasis).
    const { data: basis } = await sb.from('business_os_skills')
      .select('instructies').eq('coach_id', user.id).eq('naam', BASIS_SKILL).maybeSingle()
      .then((r) => r, () => ({ data: null }))
    const systeem = basis?.instructies?.trim() || STANDAARD_BASIS
    const model = MODEL_SECRET || STANDAARD_MODEL

    // Opdracht-rij: bezig tijdens het wachten (tabel mag nog ontbreken).
    const { data: rij } = await sb.from('editor_opdrachten')
      .insert({ coach_id: user.id, opdracht: laatste.content.slice(0, 4000), status: 'bezig', model })
      .select('id').single()
      .then((r) => r, () => ({ data: null }))
    const opdrachtId = rij?.id || null
    const zetRij = async (velden: Record<string, unknown>) => {
      if (!opdrachtId) return
      await sb.from('editor_opdrachten').update({ ...velden, klaar_at: new Date().toISOString() })
        .eq('id', opdrachtId).then(() => {}, () => {})
    }
    rijMislukt = (fout) => zetRij({ status: 'mislukt', fout })

    // Redeneermodellen (gpt-5*, o*) kennen reasoning_effort; andere modellen weigeren het veld.
    const redeneert = /^(gpt-5|o\d)/i.test(model)
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${SLEUTEL}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [{ role: redeneert ? 'developer' : 'system', content: systeem }, ...berichten],
        max_completion_tokens: 4000,
        ...(redeneert ? { reasoning_effort: 'low' } : {}),
      }),
    })
    const data = await res.json().catch(() => ({}))
    const tekst = data?.choices?.[0]?.message?.content?.trim()
    if (!res.ok || !tekst) {
      const detail = data?.error?.message || `status ${res.status}`
      console.error('OpenAI', res.status, String(detail).slice(0, 500))
      await zetRij({ status: 'mislukt', fout: String(detail).slice(0, 1000) })
      await meldFout(`openai ${res.status}: ${detail}`)
      return json({ fout: res.status === 401 ? 'sleutel_ongeldig' : 'openai', status: res.status, detail: String(detail).slice(0, 300), opdracht_id: opdrachtId }, 502)
    }
    await zetRij({ status: 'klaar', antwoord: tekst })
    return json({ tekst, opdracht_id: opdrachtId, model })
  } catch (e) {
    console.error('editor-chat', e)
    await rijMislukt?.(String((e as Error)?.message || e).slice(0, 1000))
    return json({ fout: 'intern' }, 500)
  }
})
