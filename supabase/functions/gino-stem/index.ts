// supabase/functions/gino-stem/index.ts
//
// Gino's stem in Business OS (30 okt 2026): zet een stuk tekst om in spraak via
// ElevenLabs, zodat de browser geen robotstem meer hoeft te gebruiken.
//
//   POST { tekst }  (max 1000 tekens)  → audio/mpeg
//
// Alleen coaches (get_my_portal_role = coach/both), anders kan elke ingelogde
// klant ElevenLabs-tegoed opmaken. Sleutels als Supabase-secrets:
// ELEVENLABS_API_KEY en ELEVENLABS_VOICE_ID. Ontbreekt er één: 503
// { fout: 'geen_sleutel' } en valt stem.js terug op de browserstem.
// Nooit een sleutel in de frontend of de repo.

import { createClient } from 'npm:@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const MODEL = 'eleven_multilingual_v2'
// language_code wordt alleen door deze modellen geaccepteerd; multilingual_v2
// herkent de taal zelf en weigert het veld.
const MET_TAALCODE = ['eleven_turbo_v2_5', 'eleven_flash_v2_5']
const MAX_TEKENS = 1000

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } })

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

    const sleutel = Deno.env.get('ELEVENLABS_API_KEY')
    const stemId = Deno.env.get('ELEVENLABS_VOICE_ID')
    if (!sleutel || !stemId) return json({ fout: 'geen_sleutel' }, 503)

    const body = await req.json().catch(() => ({}))
    const tekst = typeof body?.tekst === 'string' ? body.tekst.trim() : ''
    if (!tekst) return json({ fout: 'geen_tekst' }, 400)
    if (tekst.length > MAX_TEKENS) return json({ fout: 'te_lang', max: MAX_TEKENS }, 413)

    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(stemId)}?output_format=mp3_44100_128`,
      {
        method: 'POST',
        headers: { 'xi-api-key': sleutel, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
        body: JSON.stringify({
          text: tekst,
          model_id: MODEL,
          ...(MET_TAALCODE.includes(MODEL) ? { language_code: 'nl' } : {}),
          voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0.2, use_speaker_boost: true },
        }),
      },
    )
    if (!res.ok || !res.body) {
      const detail = await res.text().catch(() => '')
      console.error('ElevenLabs', res.status, detail.slice(0, 500))
      return json({ fout: 'elevenlabs', status: res.status }, 502)
    }
    return new Response(res.body, {
      headers: { ...CORS, 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store' },
    })
  } catch (e) {
    console.error('gino-stem', e)
    return json({ fout: 'intern' }, 500)
  }
})
