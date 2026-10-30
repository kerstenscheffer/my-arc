// supabase/functions/gino-stem/index.ts
//
// Gino's stem in Business OS (30 okt 2026): zet een stuk tekst om in spraak via
// ElevenLabs, zodat de browser geen robotstem meer hoeft te gebruiken.
//
//   POST { tekst }  (max 1000 tekens)  → audio/mpeg
//
// Alleen coaches (get_my_portal_role = coach/both), anders kan elke ingelogde
// klant ElevenLabs-tegoed opmaken. Sleutels als Supabase-secrets:
// ELEVENLABS_API_KEY en (optioneel) ELEVENLABS_VOICE_ID (andere namen met
// ELEVEN/ELEVAN erin worden ook gevonden, zie zoekSecret). Zonder voice-id kiest
// kiesStem() 'Jon - Natural Authority' (anders een Gino-stem, anders Daniel);
// header x-gino-stem zegt welke. Ontbreekt de API key: 503 { fout: 'geen_sleutel' } en valt stem.js terug op de browserstem.
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

// Premade stem (Daniel, mannelijk, rustig): werkt ook op het gratis plan.
// Library-stemmen geven daar 402 paid_plan_required (30 okt 2026: daardoor viel
// Business OS stil terug op de browserstem). Bij 402 schakelt hij hierop over.
const PREMADE_STEM = { id: 'onwK4e9ZLuTAKqWW03F9', naam: 'Daniel (premade)' }

// De secret staat niet altijd onder de standaardnaam (30 okt 2026: Kersten zette
// hem onder een eigen naam → 503 geen_sleutel). Eerst de vaste naam, anders de
// eerste secret met ELEVEN/ELEVAN/XI_ in de naam. Alleen de naam wordt gelogd.
function zoekSecret(vast: string, soort: RegExp): string | undefined {
  const waarde = Deno.env.get(vast)
  if (waarde) return waarde
  const naam = Object.keys(Deno.env.toObject())
    .filter((n) => /ELEVEN|ELEVAN|^XI_/i.test(n) && soort.test(n) && n !== vast)
    .sort()[0]
  if (naam) console.log('gino-stem gebruikt secret', naam, 'voor', vast)
  return naam ? Deno.env.get(naam) : undefined
}
const SLEUTEL = zoekSecret('ELEVENLABS_API_KEY', /^(?!.*(VOICE|STEM))/i)
const VOICE_ID = zoekSecret('ELEVENLABS_VOICE_ID', /VOICE|STEM/i)
if (!SLEUTEL) console.error('gino-stem: geen ElevenLabs-secret gevonden')

// Zonder voice-id: 'Jon - Natural Authority' uit het eigen ElevenLabs-account,
// anders een stem met 'Gino' in de naam, anders PREMADE_STEM (Daniel). Per instantie
// gecachet, zodat de lijst niet bij elk verzoek wordt opgehaald.
let gekozenStem: { id: string; naam: string } | null = null
let alleenPremade = false // na een 402: rest van deze instantie meteen PREMADE_STEM

// Faalt de lijst: { status } (→ 502 elevenlabs, niet geen_sleutel: stem.js leest
// dat als "sleutel ontbreekt").
async function kiesStem(sleutel: string): Promise<{ id: string; naam: string } | { status: number }> {
  if (alleenPremade) return PREMADE_STEM
  if (VOICE_ID) return { id: VOICE_ID, naam: 'ELEVENLABS_VOICE_ID' }
  if (gekozenStem) return gekozenStem
  const res = await fetch('https://api.elevenlabs.io/v1/voices', { headers: { 'xi-api-key': sleutel } })
  if (!res.ok) {
    console.error('ElevenLabs voices', res.status, (await res.text().catch(() => '')).slice(0, 300))
    return { status: res.status }
  }
  const { voices = [] } = await res.json().catch(() => ({}))
  // Nooit "de eerste eigen stem": in Kerstens account was dat een vrouwenstem.
  const zoek = (re: RegExp) => voices.find((v: { name?: string; voice_id?: string }) => v.voice_id && re.test(v.name || ''))
  const stem = zoek(/jon.*natural/i) || zoek(/gino/i)
  gekozenStem = stem ? { id: stem.voice_id, naam: stem.name } : PREMADE_STEM
  console.log('gino-stem kiest', gekozenStem.naam, gekozenStem.id, stem ? '' : '(geen Jon- of Gino-stem gevonden)')
  return gekozenStem
}

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

    const sleutel = SLEUTEL
    if (!sleutel) return json({ fout: 'geen_sleutel' }, 503)
    const stem = await kiesStem(sleutel)
    if (!('id' in stem)) return json({ fout: 'elevenlabs', status: stem.status }, 502)

    const body = await req.json().catch(() => ({}))
    const tekst = typeof body?.tekst === 'string' ? body.tekst.trim() : ''
    if (!tekst) return json({ fout: 'geen_tekst' }, 400)
    if (tekst.length > MAX_TEKENS) return json({ fout: 'te_lang', max: MAX_TEKENS }, 413)

    const tts = (stemId: string) => fetch(
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
    let gebruikt = stem
    let res = await tts(stem.id)
    if (res.status === 402 && stem.id !== PREMADE_STEM.id) {
      console.error('ElevenLabs 402 voor', stem.naam, (await res.text().catch(() => '')).slice(0, 200), '→', PREMADE_STEM.naam)
      alleenPremade = true
      gebruikt = PREMADE_STEM
      res = await tts(PREMADE_STEM.id)
    }
    if (!res.ok || !res.body) {
      const detail = await res.text().catch(() => '')
      console.error('ElevenLabs', res.status, detail.slice(0, 500))
      return json({ fout: 'elevenlabs', status: res.status }, 502)
    }
    return new Response(res.body, {
      headers: {
        ...CORS,
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-store',
        'x-gino-stem': encodeURIComponent(gebruikt.naam),
        'Access-Control-Expose-Headers': 'x-gino-stem',
      },
    })
  } catch (e) {
    console.error('gino-stem', e)
    return json({ fout: 'intern' }, 500)
  }
})
