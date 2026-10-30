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
// ELEVEN/ELEVAN erin worden ook gevonden, zie zoekSecret). kiesStemmen() zet
// ELEVENLABS_VOICE_ID voorop als die staat, anders 'Jon - Natural Authority',
// dan Daniel; header x-gino-stem zegt welke. GET ?diag=1 toont de volgorde en
// het ElevenLabs-plan zonder spraak te maken. Ontbreekt de API
// key: 503 { fout: 'geen_sleutel' } en valt stem.js terug op de browserstem.
// Getallen gaan als Engelse woorden naar ElevenLabs (getallen.ts; stem.js doet
// het ook al), de tekst op het scherm blijft Nederlands.
// Nooit een sleutel in de frontend of de repo.

import { createClient } from 'npm:@supabase/supabase-js@2'
import { getallenNaarEngels } from './getallen.ts'

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
// Business OS stil terug op de browserstem). Laatste terugval bij 402.
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

// Stemvolgorde (30 okt 2026): ELEVENLABS_VOICE_ID als die als secret staat
// (Kerstens keuze wint), dan 'Jon - Natural Authority' (eerst Mijn stemmen,
// anders de ElevenLabs-bibliotheek; naam moet 'jon' én 'natural authority'
// bevatten), dan de oude stem (Birdy/Gino uit Mijn stemmen), dan PREMADE_STEM
// (Daniel).
// Jon niet gevonden of 402: regel in app_fouten en door naar de volgende. Nooit
// "de eerste eigen stem": in Kerstens account was dat een vrouwenstem.
// Per instantie gecachet, zodat de lijst niet bij elk verzoek wordt opgehaald.
type Stem = { id: string; naam: string }
type Voice = { name?: string; voice_id?: string }
let stemmen: Stem[] | null = null
let jonOntbreekt = false // 'stem Jon niet gevonden' één keer per instantie loggen
let jonGevonden: string | null = null // voor ?diag=1
const geweigerd = new Set<string>() // stem-id's met 402: rest van deze instantie overslaan

const isJon = (v: Voice) => /jon/i.test(v.name || '')
const isNatural = (v: Voice) => /natural\s*authority/i.test(v.name || '')
const kiesJon = (lijst: Voice[]) => lijst.find((v) => isJon(v) && isNatural(v))

// Jon niet in Mijn stemmen: zoek in de gedeelde bibliotheek. Op het gratis plan
// geeft TTS met zo'n stem 402 → terugval hieronder.
async function zoekInBibliotheek(sleutel: string): Promise<Voice | undefined> {
  const res = await fetch('https://api.elevenlabs.io/v1/shared-voices?page_size=30&search=' + encodeURIComponent('Jon natural authority'), {
    headers: { 'xi-api-key': sleutel },
  }).catch(() => null)
  if (!res?.ok) {
    console.error('ElevenLabs shared-voices', res?.status)
    return undefined
  }
  const { voices = [] } = await res.json().catch(() => ({}))
  const jon = kiesJon((voices as Voice[]).filter((v) => v.voice_id))
  return jon && isNatural(jon) ? { ...jon, name: `${jon.name} (bibliotheek)` } : undefined
}

// Faalt de lijst: { status } (→ 502 elevenlabs, niet geen_sleutel: stem.js leest
// dat als "sleutel ontbreekt").
async function kiesStemmen(sleutel: string): Promise<Stem[] | { status: number }> {
  if (stemmen) return stemmen
  const res = await fetch('https://api.elevenlabs.io/v1/voices', { headers: { 'xi-api-key': sleutel } })
  if (!res.ok) {
    console.error('ElevenLabs voices', res.status, (await res.text().catch(() => '')).slice(0, 300))
    return { status: res.status }
  }
  const { voices = [] } = await res.json().catch(() => ({}))
  const lijst = (voices as Voice[]).filter((v) => v.voice_id)
  const jon = kiesJon(lijst) || await zoekInBibliotheek(sleutel)
  jonGevonden = jon ? `${jon.name} (${jon.voice_id})` : null
  const secret = VOICE_ID ? { voice_id: VOICE_ID, name: 'ELEVENLABS_VOICE_ID' } : undefined
  // De stem van vóór Jon (Birdy, anders een Gino-stem) blijft terugval.
  const oud = lijst.find((v) => /birdy/i.test(v.name || '')) || lijst.find((v) => /gino/i.test(v.name || ''))
  jonOntbreekt = !jon
  stemmen = [secret, jon, oud]
    .filter((v): v is { name?: string; voice_id: string } => !!v?.voice_id)
    .map((v) => ({ id: v.voice_id, naam: v.name || v.voice_id }))
    .filter((v, i, a) => v.id !== PREMADE_STEM.id && a.findIndex((w) => w.id === v.id) === i)
  stemmen.push(PREMADE_STEM)
  console.log('gino-stem volgorde', stemmen.map((v) => `${v.naam} (${v.id})`).join(' → '))
  return stemmen
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } })

  try {
    // GET ?diag=1: welke stem gekozen wordt + ElevenLabs-plan, zonder spraak
    // (kost geen tegoed, geeft geen sleutels terug). Om te testen zonder login.
    if (req.method === 'GET' && new URL(req.url).searchParams.get('diag') === '1') {
      if (!SLEUTEL) return json({ sleutel: false, secret_voice_id: !!VOICE_ID })
      const volgorde = await kiesStemmen(SLEUTEL)
      const abo = await fetch('https://api.elevenlabs.io/v1/user/subscription', { headers: { 'xi-api-key': SLEUTEL } })
        .then((r) => (r.ok ? r.json() : { status: r.status }), () => null)
      return json({
        sleutel: true,
        secret_voice_id: VOICE_ID || null,
        jon: jonGevonden,
        volgorde,
        model: MODEL,
        plan: abo?.tier ?? abo,
      })
    }
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
    const volgorde = await kiesStemmen(sleutel)
    if (!Array.isArray(volgorde)) return json({ fout: 'elevenlabs', status: volgorde.status }, 502)
    const logFout = (melding: string) => sb.from('app_fouten')
      .insert({ user_id: user.id, pagina: 'business-os-stem', melding: melding.slice(0, 1000) })
      .then((r) => { if (r.error) console.error('app_fouten', r.error.message) }, () => {})

    const body = await req.json().catch(() => ({}))
    const invoer = typeof body?.tekst === 'string' ? body.tekst.trim() : ''
    if (!invoer) return json({ fout: 'geen_tekst' }, 400)
    if (invoer.length > MAX_TEKENS) return json({ fout: 'te_lang', max: MAX_TEKENS }, 413)
    // Engelse woorden worden langer; past het niet meer, dan de oorspronkelijke tekst.
    const engels = getallenNaarEngels(invoer)
    const tekst = engels.length <= MAX_TEKENS ? engels : invoer

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
    if (jonOntbreekt) {
      jonOntbreekt = false
      console.error('gino-stem: stem Jon niet gevonden in Mijn stemmen')
      await logFout(`stem Jon - Natural Authority niet gevonden (Mijn stemmen + bibliotheek) → ${volgorde[0].naam}`)
    }
    const kandidaten = volgorde.filter((v) => v === PREMADE_STEM || !geweigerd.has(v.id))
    let gebruikt = kandidaten[0]
    let res = await tts(gebruikt.id)
    // 402 = plan staat de stem niet toe; 404 = bibliotheekstem niet bruikbaar zonder toevoegen.
    for (let i = 1; (res.status === 402 || res.status === 404) && i < kandidaten.length; i++) {
      const detail = (await res.text().catch(() => '')).slice(0, 200)
      console.error('ElevenLabs', res.status, 'voor', gebruikt.naam, detail, '→', kandidaten[i].naam)
      const reden = res.status === 402 ? 'gratis ElevenLabs-plan staat deze (bibliotheek)stem niet toe' : 'stem niet gevonden'
      await logFout(`ElevenLabs ${res.status} (${reden}) voor ${gebruikt.naam} (${gebruikt.id}) → ${kandidaten[i].naam}: ${detail}`)
      geweigerd.add(gebruikt.id)
      gebruikt = kandidaten[i]
      res = await tts(gebruikt.id)
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
