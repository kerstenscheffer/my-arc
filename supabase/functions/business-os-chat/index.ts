// supabase/functions/business-os-chat/index.ts
//
// De AI-chat onder de reactor in Business OS (30 okt 2026). Kersten geeft hier
// taken uit, bv. "maak 3 reel-scripts over buikvet na je 30e".
//
//   POST { berichten: [{ role: 'user'|'assistant', content }], context?: {...} }
//   → { tekst, acties: [{ soort: 'app_issue', tekst }] }
//
// "Pas aan in de app"-opdrachten gaan via de tool zet_op_app_lijst als open
// rij in app_issues (zelfde lijst als de zijtab in CoachHub); de nacht-AI of
// een "probleem"-sessie bouwt ze. De chat zelf verandert nooit code.
//
// Skills (werkwijzen per soort taak) staan in business_os_skills en worden bij
// elke vraag ingelezen. Kersten maakt/wijzigt ze door erover te praten:
// tools bewaar_skill en verwijder_skill. Zie business-os-skills.sql.
//
// Klanten: zoek_klanten leest (RLS van de coach), stel_slot_voor zet alleen een
// VOORSTEL klaar; de chat toont de namen met een knop en pas Kerstens klik zet
// clients.account_locked_at (zelfde als de slotknop in Coach Inzicht).
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

Het systeem: de MY ARC-app. Kersten werkt in CoachHub (coach-kant: Command met klantkaarten, Coach Inzicht per klant, Leads-bord, Business OS). Klanten gebruiken de klant-app (workout, voeding, tracking). Alles draait op een Supabase-database. Jij hebt alleen toegang via je tools; wat er niet als tool is, kun je niet zelf, dan zet je het op de app-lijst.

Klantaccounts op slot: een account op slot betekent dat de klant in zijn app alleen een pauzescherm ziet; alle data blijft bewaard en ontgrendelen kan altijd. Werkwijze: eerst zoek_klanten, dan de namen met reden laten zien, dan stel_slot_voor. Kersten bevestigt zelf met de knop onder je bericht; zeg dus nooit dat het al gebeurd is.

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

App-wijzigingen: vraagt Kersten iets aan te passen in de MY ARC-app, gebruik de tool zet_op_app_lijst. Beloof nooit dat het al aangepast is.

Skills: hieronder staan Kerstens skills, vaste werkwijzen per soort taak. Past een taak bij een skill, volg die stappen precies. Wil Kersten een nieuwe werkwijze vastleggen of een bestaande aanpassen ("onthoud dit", "maak hier een skill van", "voortaan bij scripts..."), gebruik bewaar_skill met de volledige nieuwe instructies (bij aanpassen: de oude stappen plus de wijziging, onder dezelfde naam). Laat in één zin weten wat je bewaard hebt.

Opmaak: platte tekst met korte kopjes en pijltjes (→). Geen markdown-tabellen. Vraag alleen door als de taak echt onduidelijk is; anders lever direct een eerste versie die hij kan aanscherpen.`

const TOOLS = [{
  name: 'zet_op_app_lijst',
  description: 'Zet een wijziging of reparatie voor de MY ARC-app op de ontwikkellijst (app_issues). Alleen gebruiken als Kersten vraagt iets in de app aan te passen.',
  input_schema: {
    type: 'object',
    properties: {
      tekst: { type: 'string', description: 'De opdracht: welk scherm, wat er nu gebeurt, wat het moet worden.' },
    },
    required: ['tekst'],
  },
}, {
  name: 'bewaar_skill',
  description: 'Maak een nieuwe skill of overschrijf een bestaande met dezelfde naam. Alleen als Kersten een werkwijze wil vastleggen of aanpassen.',
  input_schema: {
    type: 'object',
    properties: {
      naam: { type: 'string', description: 'Korte naam, bv. "Reel-script". Gelijk aan een bestaande naam = aanpassen.' },
      wanneer: { type: 'string', description: 'Wanneer deze skill gebruikt wordt, in één zin.' },
      instructies: { type: 'string', description: 'De volledige genummerde stappen en regels.' },
    },
    required: ['naam', 'wanneer', 'instructies'],
  },
}, {
  name: 'zoek_klanten',
  description: 'Lijst van Kerstens klanten met coachingstatus, trajecteinde, slot en laatste training. Gebruik voor vragen over klanten en vóór elk slot-voorstel.',
  input_schema: {
    type: 'object',
    properties: {
      filter: {
        type: 'string',
        enum: ['alle', 'traject_voorbij', 'gestopt', 'gepauzeerd', 'op_slot', 'niet_op_slot'],
        description: 'traject_voorbij = einddatum verstreken en niet op slot; gestopt = coaching_status ended.',
      },
    },
  },
}, {
  name: 'stel_slot_voor',
  description: 'Zet een voorstel klaar om klantaccounts op slot te zetten of te ontgrendelen. Voert NIETS uit: Kersten bevestigt met een knop.',
  input_schema: {
    type: 'object',
    properties: {
      client_ids: { type: 'array', items: { type: 'string' }, description: 'id\'s uit zoek_klanten.' },
      actie: { type: 'string', enum: ['op_slot', 'van_slot'] },
      reden: { type: 'string', description: 'Korte reden, bv. "traject afgelopen".' },
    },
    required: ['client_ids', 'actie', 'reden'],
  },
}, {
  name: 'verwijder_skill',
  description: 'Zet een skill uit. Alleen als Kersten daar expliciet om vraagt.',
  input_schema: {
    type: 'object',
    properties: { naam: { type: 'string' } },
    required: ['naam'],
  },
}]

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
    const { data: { user } } = await sb.auth.getUser()

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

    const { data: skills } = await sb.from('business_os_skills')
      .select('naam, wanneer, instructies').eq('actief', true).order('naam')
    const skillTekst = (skills || []).length
      ? (skills || []).map((k: any) => `### ${k.naam}\nWanneer: ${k.wanneer}\n${k.instructies}`).join('\n\n')
      : '(nog geen skills)'
    const context = body.context ? JSON.stringify(body.context).slice(0, 4000) : ''
    const systeem = `${SYSTEEM}\n\n## Skills\n${skillTekst}`
      + (context ? `\n\nCijfers uit Business OS op dit moment (JSON):\n${context}` : '')

    const vraagAI = async (messages: unknown[]) => {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': sleutel,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ model: MODEL, max_tokens: 2500, system: systeem, tools: TOOLS, messages }),
        signal: AbortSignal.timeout(90000),
      })
      const data = await r.json().catch(() => null)
      if (!r.ok) console.error('Anthropic-fout', r.status, JSON.stringify(data))
      return r.ok ? data : null
    }

    // Klantenlijst (RLS: alleen wat deze coach mag zien), één keer per verzoek.
    let klantCache: any[] | null = null
    const laadKlanten = async () => {
      if (klantCache) return klantCache
      const { data: rijen } = await sb.from('clients')
        .select('id, first_name, last_name, coaching_status, coaching_start_date, coaching_total_weeks, coaching_paused_days_total, account_locked_at, last_workout_date')
        .order('first_name').limit(1000)
      const nu = Date.now()
      klantCache = (rijen || []).map((k: any) => {
        const eind = k.coaching_start_date && k.coaching_total_weeks
          ? new Date(new Date(k.coaching_start_date + 'T00:00:00').getTime() + (k.coaching_total_weeks * 7 + (k.coaching_paused_days_total || 0)) * 864e5)
          : null
        return {
          id: k.id,
          naam: [k.first_name, k.last_name].filter(Boolean).join(' ') || '(geen naam)',
          status: k.coaching_status || 'active',
          traject_eind: eind ? eind.toISOString().slice(0, 10) : null,
          traject_voorbij: !!eind && eind.getTime() < nu && k.coaching_status !== 'paused',
          op_slot: !!k.account_locked_at,
          laatste_training: k.last_workout_date || null,
        }
      })
      return klantCache
    }

    // Tool-lus: maximaal 4 rondes (bv. zoeken → voorstel → antwoord).
    const gesprek: any[] = [...berichten]
    const acties: any[] = []
    let data = await vraagAI(gesprek)
    for (let ronde = 0; data && data.stop_reason === 'tool_use' && ronde < 4; ronde++) {
      const resultaten = []
      for (const blok of data.content.filter((b: any) => b.type === 'tool_use')) {
        let uitkomst = 'Onbekende tool'
        if (blok.name === 'zet_op_app_lijst') {
          const tekst = String(blok.input?.tekst || '').trim().slice(0, 4000)
          const { error } = tekst && user
            ? await sb.from('app_issues').insert({ coach_id: user.id, text: `[Business OS] ${tekst}` })
            : { error: { message: 'lege opdracht' } }
          if (error) { console.error('app_issues', error); uitkomst = 'Mislukt: ' + error.message }
          else { acties.push({ soort: 'app_issue', tekst }); uitkomst = 'Staat op de lijst.' }
        }
        if (blok.name === 'bewaar_skill') {
          const naam = String(blok.input?.naam || '').trim().slice(0, 80)
          const wanneer = String(blok.input?.wanneer || '').trim().slice(0, 500)
          const instructies = String(blok.input?.instructies || '').trim().slice(0, 6000)
          const { error } = naam && wanneer && instructies && user
            ? await sb.from('business_os_skills').upsert(
                { coach_id: user.id, naam, wanneer, instructies, actief: true, updated_at: new Date().toISOString() },
                { onConflict: 'coach_id,naam' })
            : { error: { message: 'naam, wanneer en instructies zijn verplicht' } }
          if (error) { console.error('skill', error); uitkomst = 'Mislukt: ' + error.message }
          else { acties.push({ soort: 'skill', tekst: `Skill bewaard: ${naam}` }); uitkomst = 'Bewaard.' }
        }
        if (blok.name === 'verwijder_skill') {
          const naam = String(blok.input?.naam || '').trim()
          const { data: weg, error } = await sb.from('business_os_skills')
            .update({ actief: false, updated_at: new Date().toISOString() }).eq('naam', naam).select('id')
          if (error || !weg?.length) uitkomst = 'Geen skill met die naam gevonden.'
          else { acties.push({ soort: 'skill', tekst: `Skill uitgezet: ${naam}` }); uitkomst = 'Uitgezet.' }
        }
        if (blok.name === 'zoek_klanten') {
          const filter = blok.input?.filter || 'alle'
          const klanten = await laadKlanten()
          const lijst = klanten.filter((k: any) =>
            filter === 'traject_voorbij' ? k.traject_voorbij && !k.op_slot
            : filter === 'gestopt' ? k.status === 'ended'
            : filter === 'gepauzeerd' ? k.status === 'paused'
            : filter === 'op_slot' ? k.op_slot
            : filter === 'niet_op_slot' ? !k.op_slot
            : true)
          uitkomst = JSON.stringify({ aantal: lijst.length, klanten: lijst.slice(0, 300) })
        }
        if (blok.name === 'stel_slot_voor') {
          const ids = new Set((Array.isArray(blok.input?.client_ids) ? blok.input.client_ids : []).map(String))
          const actie = blok.input?.actie === 'van_slot' ? 'van_slot' : 'op_slot'
          const gekozen = (await laadKlanten()).filter((k: any) => ids.has(k.id))
          if (!gekozen.length) uitkomst = 'Geen geldige klanten in het voorstel.'
          else {
            acties.push({
              soort: 'slot_voorstel', actie, tekst: String(blok.input?.reden || '').slice(0, 200),
              klanten: gekozen.map((k: any) => ({ id: k.id, naam: k.naam })),
            })
            uitkomst = `Voorstel voor ${gekozen.length} klant(en) staat klaar; Kersten moet het met de knop bevestigen. Er is nog niets uitgevoerd.`
          }
        }
        resultaten.push({ type: 'tool_result', tool_use_id: blok.id, content: uitkomst })
      }
      gesprek.push({ role: 'assistant', content: data.content }, { role: 'user', content: resultaten })
      data = await vraagAI(gesprek)
    }
    if (!data) return json({ error: 'AI gaf geen antwoord, probeer opnieuw.' }, 502)
    const tekst = (data.content || []).filter((b: any) => b.type === 'text').map((b: any) => b.text).join('\n').trim()
    return json({ tekst: tekst || (acties.length ? 'Klaar.' : ''), acties })
  } catch (e) {
    console.error(e)
    return json({ error: 'AI gaf geen antwoord, probeer opnieuw.' }, 500)
  }
})
