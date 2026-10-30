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
// Systeemprompt ("editor-basis") en model per coach in
// business_os_editor_instellingen (business-os-editor.sql); geen rij → PLACEHOLDER
// en STANDAARD_MODEL (of secret OPENAI_MODEL). Elke vraag wordt een rij in
// business_os_editor_opdrachten: bezig → klaar / mislukt. Bestaan die tabellen
// nog niet, dan werkt de chat gewoon door.
//
// Alleen coaches (get_my_portal_role = coach/both). Sleutel: OPENAI_API_KEY als
// Supabase-secret (andere namen met OPENAI erin worden ook gevonden, zie
// zoekSecret). Ontbreekt hij: 503 { fout: 'geen_sleutel' } en een rij in
// app_fouten (pagina business-os-editor). Nooit een sleutel in de frontend of de repo.

import { createClient } from 'npm:@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Goedkoop en recent. Ander model: kolom model in business_os_editor_instellingen,
// of secret OPENAI_MODEL, of hier aanpassen.
const STANDAARD_MODEL = 'gpt-5-mini'
const MAX_BERICHTEN = 30
const MAX_TEKENS = 12000

const PLACEHOLDER = `[EDITOR-BASIS NOG IN TE VULLEN: Kersten zet hier zijn vaste instellingen voor de video-editor, bv. stijl, formaten, ondertitel-regels, vaste intro/outro. Aanpassen in business_os_editor_instellingen.systeemprompt.]

Je bent de video-editor-assistent van Kersten (MY ARC, online coaching voor drukke werkende mannen van 25-40). Je helpt met knipplannen, titels, hooks, ondertitels en stap-voor-stap instructies voor de editor. Antwoord in het Nederlands, kort en concreet, met lijstjes waar dat helpt. Je kunt niet zelf in de editor klikken of bestanden aanpassen: geef altijd tekst en instructies die Kersten zelf uitvoert.`

// Eerst de vaste naam, anders de eerste secret met OPENAI in de naam (zoals gino-stem).
function zoekSecret(vast: string, soort: RegExp): string | undefined {
  const waarde = Deno.env.get(vast)
  if (waarde) return waarde
  const naam = Object.keys(Deno.env.toObject())
    .filter((n) => /OPENAI|OPEN_AI/i.test(n) && soort.test(n) && n !== vast)
    .sort()[0]
  if (naam) console.log('editor-chat gebruikt secret', naam, 'voor', vast)
  return naam ? Deno.env.get(naam) : undefined
}
const SLEUTEL = zoekSecret('OPENAI_API_KEY', /KEY|TOKEN|SECRET/i)
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

    const meldFout = (melding: string) => sb.from('app_fouten')
      .insert({ user_id: user.id, pagina: 'business-os-editor', melding: melding.slice(0, 1000) })
      .then((r) => { if (r.error) console.error('app_fouten', r.error.message) }, () => {})

    if (!SLEUTEL) {
      await meldFout('geen_sleutel: OPENAI_API_KEY ontbreekt in Supabase Secrets')
      return json({ fout: 'geen_sleutel' }, 503)
    }

    const body = await req.json().catch(() => ({}))
    const berichten = (Array.isArray(body?.berichten) ? body.berichten : [])
      .filter((b: any) => (b?.role === 'user' || b?.role === 'assistant') && typeof b.content === 'string' && b.content.trim())
      .slice(-MAX_BERICHTEN)
      .map((b: any) => ({ role: b.role, content: b.content.slice(0, MAX_TEKENS) }))
    const laatste = berichten[berichten.length - 1]
    if (!laatste || laatste.role !== 'user') return json({ fout: 'geen_tekst' }, 400)

    // Editor-basis + model van deze coach (tabel mag nog ontbreken).
    const { data: inst } = await sb.from('business_os_editor_instellingen')
      .select('systeemprompt, model').eq('coach_id', user.id).maybeSingle()
      .then((r) => r, () => ({ data: null }))
    const systeem = inst?.systeemprompt?.trim() || PLACEHOLDER
    const model = inst?.model?.trim() || MODEL_SECRET || STANDAARD_MODEL

    // Opdracht-rij: bezig tijdens het wachten (tabel mag nog ontbreken).
    const { data: rij } = await sb.from('business_os_editor_opdrachten')
      .insert({ coach_id: user.id, opdracht: laatste.content.slice(0, 4000), status: 'bezig', model })
      .select('id').single()
      .then((r) => r, () => ({ data: null }))
    const opdrachtId = rij?.id || null
    const zetRij = async (velden: Record<string, unknown>) => {
      if (!opdrachtId) return
      await sb.from('business_os_editor_opdrachten').update({ ...velden, klaar_at: new Date().toISOString() })
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
