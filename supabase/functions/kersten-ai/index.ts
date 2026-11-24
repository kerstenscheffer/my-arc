// supabase/functions/kersten-ai/index.ts
//
// Kersten AI (24 nov 2026): chat-assistent in de app voor app-gebruikers
// (clients.app_abonnee). Beantwoordt vragen over de app, training en voeding
// en kan de gebruiker naar een pagina in de app sturen.
//
// - Alleen ingelogde app-gebruikers (clients.app_abonnee).
// - Limiet: 20 vragen per dag per account (Nederlandse tijd).
// - Kennis: de vragenboom van de coach (faq_nodes) + nutrition_faq, en de
//   gegevens van de gebruiker zelf (doel, macro's, schema).
// - Geschiedenis komt uit kersten_ai_berichten (server-side), niet van de app,
//   zodat niemand antwoorden van "Kersten" kan verzinnen.
// - Navigeren: tool 'navigeer'. De server voert niets uit; hij geeft de
//   gekozen pagina terug in `acties` en de app opent hem.
//
// Body: { vraag: string }  →  { antwoord, acties: [{ type: 'navigeer', pagina }], over }
// Sleutel: ANTHROPIC_API_KEY (Supabase-secret, bestaat al voor business-os-chat).
import Anthropic from 'npm:@anthropic-ai/sdk@0.136.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...CORS, 'Content-Type': 'application/json' } })

const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! })

const MODEL = 'claude-opus-5-5'
const LIMIET_PER_DAG = 20
const PAGINAS = ['home', 'workout', 'meal', 'tracking', 'boodschappen', 'agenda', 'profile'] as const

const TOOLS: Anthropic.Beta.BetaTool[] = [{
  name: 'navigeer',
  description: 'Open een pagina in de MY ARC app voor de gebruiker. Gebruik dit als de gebruiker iets wil doen of zien dat op een pagina staat, of als je uitlegt waar iets staat. home = dagoverzicht en agenda; workout = trainingsschema en sets loggen; meal = voedingsplan, maaltijden loggen en wisselen; tracking = gewicht, omtrek en voortgangsfoto\'s; boodschappen = boodschappenlijst; agenda = weekagenda; profile = profiel en instellingen.',
  input_schema: {
    type: 'object',
    properties: { pagina: { type: 'string', enum: [...PAGINAS] } },
    required: ['pagina'],
    additionalProperties: false,
  },
  strict: true,
}]

const REGELS = `Je bent Kersten, de coach achter MY ARC. Je zit als assistent in de MY ARC app en helpt gebruikers die de app zelfstandig gebruiken (zonder persoonlijke coaching).

Hoe je praat:
- Nederlands, jij-vorm, als Kersten zelf ("ik").
- Kort en simpel: 1 tot 4 korte zinnen. Gewone woorden, geen vaktaal. Geen opsommingen tenzij echt nodig.
- Vriendelijk en motiverend, nooit belerend.
- Geen markdown-kopjes, geen vet, geen emoji-reeksen.

Wat je doet:
- Vragen over de app beantwoorden en uitleggen waar iets staat. Wil iemand iets doen of zien, open dan de juiste pagina met de tool navigeer en zeg kort wat hij daar moet doen.
- Vragen over training, voeding, afvallen en spieropbouw beantwoorden, passend bij het plan van deze gebruiker (zie de gegevens hieronder).
- Gebruik de antwoorden uit de vragenlijst hieronder waar ze passen; die zijn van Kersten zelf.

Grenzen:
- Geen medisch advies. Bij pijn, blessures, ziekte, zwangerschap, medicijnen of eetproblemen: zeg dat hij dat met een arts of fysiotherapeut moet bespreken.
- Verzin geen functies die de app niet heeft. Weet je iets niet zeker, zeg dat eerlijk.
- Deze gebruiker heeft geen persoonlijke coaching: beloof geen calls, check-ins of persoonlijke berichten van Kersten. Wil hij persoonlijke begeleiding, zeg dan dat dat kan via coaching van MY ARC.
- Pas zelf geen plannen aan; je kunt alleen uitleggen en de juiste pagina openen.
- Blijf bij fitness, voeding en de app. Vragen over iets anders beantwoord je kort niet.`

// Vragenboom → leesbare tekst (label > sublabel: antwoord [pagina]).
async function kennis(): Promise<string> {
  const [{ data: nodes }, { data: voeding }] = await Promise.all([
    sb.from('faq_nodes').select('id, parent_id, label, answer, deeplink, sort_order, is_active').eq('is_active', true),
    sb.from('nutrition_faq').select('vraag, antwoord, volgorde').order('volgorde'),
  ])
  const perOuder = new Map<string | null, any[]>()
  for (const n of nodes || []) {
    const k = n.parent_id ?? null
    if (!perOuder.has(k)) perOuder.set(k, [])
    perOuder.get(k)!.push(n)
  }
  for (const lijst of perOuder.values()) lijst.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || String(a.label).localeCompare(String(b.label)))
  const regels: string[] = []
  const loop = (ouder: string | null, pad: string[]) => {
    for (const n of perOuder.get(ouder) || []) {
      const p = [...pad, n.label]
      if (n.answer) regels.push(`- ${p.join(' > ')}: ${String(n.answer).trim()}${n.deeplink ? ` [pagina: ${n.deeplink}]` : ''}`)
      loop(n.id, p)
    }
  }
  loop(null, [])
  for (const v of voeding || []) regels.push(`- Voeding > ${v.vraag}: ${String(v.antwoord || '').trim()}`)
  return `Vragenlijst van Kersten (pagina-namen: mealplan = meal, progress = tracking; calls bestaat niet voor deze gebruiker):\n${regels.join('\n')}`
}

const vandaagStartNL = () => {
  // Begin van de dag in Nederlandse tijd, als ISO-tijdstip.
  const nu = new Date()
  const nl = new Date(nu.toLocaleString('en-US', { timeZone: 'Europe/Amsterdam' }))
  const verschil = nu.getTime() - nl.getTime()
  nl.setHours(0, 0, 0, 0)
  return new Date(nl.getTime() + verschil).toISOString()
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return json({ fout: 'methode' }, 405)

  // Wie vraagt er?
  const jwt = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '')
  const { data: wie } = jwt ? await sb.auth.getUser(jwt).then((x) => x, () => ({ data: null as any })) : { data: null as any }
  const user = wie?.user
  if (!user) return json({ fout: 'niet ingelogd' }, 401)

  let vraag = ''
  try { vraag = String((await req.json())?.vraag || '').trim().slice(0, 1000) } catch { /* lege body */ }
  if (!vraag) return json({ fout: 'geen vraag' }, 400)

  const { data: klant } = await sb.from('clients')
    .select('id, first_name, gender, age, height, current_weight, goal_weight, primary_goal, target_calories, target_protein, target_carbs, target_fat, assigned_schema_id, app_abonnee')
    .eq('auth_user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle()
  // Alleen app-gebruikers. (Coachingklanten hebben Kersten zelf.)
  if (!klant?.app_abonnee) return json({ fout: 'alleen voor app-gebruikers' }, 403)

  // Limiet per dag.
  const { count } = await sb.from('kersten_ai_berichten').select('id', { count: 'exact', head: true })
    .eq('auth_user_id', user.id).eq('rol', 'vraag').gte('created_at', vandaagStartNL())
  const gebruikt = count || 0
  if (gebruikt >= LIMIET_PER_DAG) {
    return json({ antwoord: 'Je hebt vandaag al 20 vragen gesteld. Morgen kun je weer verder. Tot dan!', acties: [], over: 0 })
  }

  // Schema-naam erbij, voor context.
  let schemaNaam: string | null = null
  if (klant.assigned_schema_id) {
    const { data: s } = await sb.from('workout_schemas').select('name, days_per_week').eq('id', klant.assigned_schema_id).maybeSingle()
    schemaNaam = s ? `${s.name}${s.days_per_week ? ` (${s.days_per_week} dagen per week)` : ''}` : null
  }
  const gegevens = [
    `Gegevens van deze gebruiker (vandaag ${new Date().toLocaleDateString('nl-NL', { timeZone: 'Europe/Amsterdam', weekday: 'long', day: 'numeric', month: 'long' })}):`,
    `- Naam: ${klant.first_name || 'onbekend'}`,
    `- Doel: ${klant.primary_goal || 'onbekend'}`,
    `- Geslacht: ${klant.gender || 'onbekend'}, leeftijd: ${klant.age ?? 'onbekend'}, lengte: ${klant.height ?? '?'} cm`,
    `- Gewicht nu: ${klant.current_weight ?? '?'} kg, streefgewicht: ${klant.goal_weight ?? '?'} kg`,
    `- Dagdoel (trainingsdag): ${klant.target_calories ?? '?'} kcal, eiwit ${klant.target_protein ?? '?'} g, koolhydraten ${klant.target_carbs ?? '?'} g, vet ${klant.target_fat ?? '?'} g`,
    `- Trainingsschema: ${schemaNaam || 'nog geen'}`,
  ].join('\n')

  // Laatste 10 berichten van de afgelopen 24 uur als geschiedenis.
  const { data: eerder } = await sb.from('kersten_ai_berichten').select('rol, tekst')
    .eq('auth_user_id', user.id).gte('created_at', new Date(Date.now() - 24 * 3600_000).toISOString())
    .order('created_at', { ascending: false }).limit(10)
  const geschiedenis: Anthropic.Beta.BetaMessageParam[] = []
  for (const b of (eerder || []).reverse()) {
    const rol = b.rol === 'vraag' ? 'user' : 'assistant'
    if (!geschiedenis.length && rol === 'assistant') continue // moet met user beginnen
    geschiedenis.push({ role: rol, content: b.tekst })
  }
  const messages: Anthropic.Beta.BetaMessageParam[] = [...geschiedenis, { role: 'user', content: vraag }]

  await sb.from('kersten_ai_berichten').insert({ auth_user_id: user.id, client_id: klant.id, rol: 'vraag', tekst: vraag })

  // Vast deel (regels + vragenlijst) wordt gecachet; de gegevens van de gebruiker staan erna.
  const system: Anthropic.Beta.BetaTextBlockParam[] = [
    { type: 'text', text: `${REGELS}\n\n${await kennis()}`, cache_control: { type: 'ephemeral' } },
    { type: 'text', text: gegevens },
  ]

  const acties: { type: 'navigeer'; pagina: string }[] = []
  let antwoord = ''
  const gebruik: unknown[] = []
  try {
    for (let ronde = 0; ronde < 3; ronde++) {
      const r = await anthropic.beta.messages.create({
        model: MODEL,
        max_tokens: 2000,
        output_config: { effort: 'low' },
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        system,
        tools: TOOLS,
        messages,
      } as any)
      gebruik.push(r.usage)
      if (r.stop_reason === 'refusal') { antwoord = 'Daar kan ik je niet mee helpen. Stel gerust een andere vraag over je training, je eten of de app.'; break }
      const tekst = r.content.filter((b: any) => b.type === 'text').map((b: any) => b.text).join('\n').trim()
      if (tekst) antwoord = tekst
      const gebruiken = r.content.filter((b: any) => b.type === 'tool_use') as Anthropic.Beta.BetaToolUseBlock[]
      if (r.stop_reason !== 'tool_use' || !gebruiken.length) break
      messages.push({ role: 'assistant', content: r.content as any })
      const resultaten: Anthropic.Beta.BetaToolResultBlockParam[] = []
      for (const t of gebruiken) {
        const pagina = String((t.input as any)?.pagina || '')
        if (t.name === 'navigeer' && (PAGINAS as readonly string[]).includes(pagina)) {
          if (!acties.some(a => a.pagina === pagina)) acties.push({ type: 'navigeer', pagina })
          resultaten.push({ type: 'tool_result', tool_use_id: t.id, content: `De pagina ${pagina} wordt geopend zodra je antwoord klaar is. Zeg kort wat hij daar doet.` })
        } else {
          resultaten.push({ type: 'tool_result', tool_use_id: t.id, content: 'Onbekende pagina.', is_error: true })
        }
      }
      messages.push({ role: 'user', content: resultaten })
    }
  } catch (e) {
    console.error('kersten-ai: model mislukt', (e as any)?.status, (e as any)?.message?.slice?.(0, 200))
    return json({ antwoord: 'Er ging even iets mis. Probeer het zo nog eens.', acties: [], over: LIMIET_PER_DAG - gebruikt - 1 }, 200)
  }
  if (!antwoord) antwoord = acties.length ? 'Ik heb de pagina voor je geopend.' : 'Kun je je vraag iets anders stellen?'

  await sb.from('kersten_ai_berichten').insert({ auth_user_id: user.id, client_id: klant.id, rol: 'antwoord', tekst: antwoord, acties, gebruik })
  return json({ antwoord, acties, over: LIMIET_PER_DAG - gebruikt - 1 })
})
