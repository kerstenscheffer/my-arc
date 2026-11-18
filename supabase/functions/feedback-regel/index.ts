// supabase/functions/feedback-regel/index.ts
//
// Maakt van een feedbackzin van de coach een heldere, algemene regel
// (18 nov 2026). De coach typt in de brief wat er mis was aan een concept;
// deze functie herschrijft dat tot één regel die voor elk volgend concept
// geldt, en geeft hem terug ter bevestiging. Opslaan doet de app pas nadat de
// coach "Klopt" zegt (tabel concept_feedback); de concept-nakijker past de
// bevestigde regels daarna toe.
//
// Body: { soort: 'workout' | 'voeding', tekst }. Alleen voor een ingelogde coach.
// deno-lint-ignore-file no-explicit-any
import { createClient } from 'npm:@supabase/supabase-js@2'
import Anthropic from 'npm:@anthropic-ai/sdk@1.2.0'

const MODEL = 'claude-opus-5-5'
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
const SCHEMA = {
  type: 'object', additionalProperties: false, required: ['regel', 'twijfel'],
  properties: {
    regel: { type: 'string', description: 'De regel in één of twee zinnen, algemeen geldig, in gewoon Nederlands.' },
    twijfel: { type: ['string', 'null'], description: 'Alleen als de feedback op twee duidelijk verschillende manieren te lezen is: de andere lezing in één zin. Anders null.' },
  },
}
const SYSTEEM = `Een fitnesscoach geeft feedback op een automatisch gemaakt conceptplan (training of voeding) voor een klant. Jij maakt daar één vaste regel van die voor elk volgend concept geldt.

- Schrijf de regel zo dat iemand zonder dit ene plan te kennen hem kan toepassen: noem de situatie (welk soort dag, welk soort klant, welke fase) en wat er dan wel of niet moet gebeuren.
- Maak het algemeen waar de coach duidelijk een principe bedoelt, en houd het specifiek waar hij een specifieke oefening, gerecht of getal noemt. Verzin geen getallen of uitzonderingen die hij niet noemde.
- Feedback zegt vaak wat er fout ging ("X eruit voor Y is onzin"). De regel zegt wat er voortaan moet gebeuren. Kies de lezing die een ervaren coach zou bedoelen; meestal is dat "laat X staan", niet "haal Y weg".
- Eén of twee zinnen, gewoon Nederlands, geen opsomming, geen aanhef.
- Is de feedback op twee duidelijk verschillende manieren te lezen, geef dan de meest waarschijnlijke als regel en de andere in "twijfel". Anders is "twijfel" null.`

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...CORS, 'Content-Type': 'application/json' } })
  try {
    const { soort, tekst } = await req.json()
    const zin = String(tekst || '').trim()
    if (!['workout', 'voeding'].includes(soort) || zin.length < 4) return json({ error: 'soort en tekst zijn nodig' }, 400)
    if (zin.length > 1500) return json({ error: 'tekst is te lang' }, 400)

    // Alleen een coach: de vraag gaat met het token van de gebruiker zelf naar de database.
    const auth = req.headers.get('authorization') || ''
    const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: auth } } })
    const { data: isCoach } = await sb.rpc('rls_is_coach')
    if (!isCoach) return json({ error: 'niet toegestaan' }, 403)

    const ai = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! })
    const basis = {
      model: MODEL,
      max_tokens: 2000,
      output_config: { effort: 'low', format: { type: 'json_schema', schema: SCHEMA } },
      system: SYSTEEM,
      messages: [{ role: 'user', content: `Soort plan: ${soort === 'workout' ? 'training' : 'voeding'}\n\nFeedback van de coach:\n${zin}` }],
    }
    let res: any
    try {
      res = await ai.beta.messages.create({ ...basis, betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' } as any)
    } catch (e) {
      if (!(e instanceof Anthropic.BadRequestError)) throw e
      res = await ai.messages.create(basis as any)
    }
    if (res.stop_reason === 'refusal') throw new Error('AI weigerde het verzoek')
    const uit = (res.content as any[]).find(b => b.type === 'text')?.text
    if (!uit) throw new Error(`Geen antwoord van de AI (stop: ${res.stop_reason})`)
    const { regel, twijfel } = JSON.parse(uit)
    return json({ regel: String(regel || '').trim(), twijfel: twijfel ? String(twijfel).trim() : null })
  } catch (e) {
    console.error('feedback-regel', e)
    return json({ error: String((e as any)?.message || e) }, 500)
  }
})
