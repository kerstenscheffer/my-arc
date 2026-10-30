// supabase/functions/business-os-chat/index.ts
//
// De AI-chat onder de reactor in Business OS (30 okt 2026). Kersten geeft hier
// taken uit, bv. "maak 3 reel-scripts over buikvet na je 30e".
//
//   POST { berichten: [{ role: 'user'|'assistant', content, afbeelding?: { media_type, data } }], context?: {...} }
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
// Database (business-os-agent.sql): bekijk_schema en lees_database (alleen
// SELECT, read-only transactie, RLS van de coach). stel_wijziging_voor voert
// niets uit: de chat toont tabel/filter/velden/aantal met een Toestaan-knop en
// pas die klik schrijft via supabase-js met Kerstens eigen rechten.
// Schemawijzigingen (kolommen/tabellen) kunnen nooit vanuit de chat.
//
// Code: stel_lokale_opdracht_voor zet een opdracht klaar; Kerstens klik op
// "Uitvoeren op mijn Mac" schrijft hem in business_os_opdrachten en zijn
// lokale PA (scripts/business-os-pa.mjs, npm run pa) voert hem uit met
// Claude Code in zijn workapp-map.
//
// Alleen de teameigenaar (coach_teams.owner_id), anders kan een medewerker of
// klant API-tegoed opmaken. Sleutel: ANTHROPIC_API_KEY als Supabase-secret.

import { createClient } from 'npm:@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Terugval als de lokale PA niet draait (die gebruikt Kerstens abonnement):
// Sonnet, ongeveer vijf keer goedkoper dan Opus en ruim genoeg hiervoor.
const MODEL = 'claude-sonnet-5-5'

const SYSTEEM = `Je bent Gino, de rechterhand van Kersten, eigenaar van MY ARC: online coaching voor drukke werkende mannen van 25-40 die hun buik kwijt willen. Je zit in zijn Business OS, het scherm met zijn maanddoel, de keten views → leads → reactie → call → sale en de zwakste schakel. Kersten geeft je hier taken die hij uitbesteedt.

Het systeem: de MY ARC-app. Kersten werkt in CoachHub (coach-kant: Command met klantkaarten, Coach Inzicht per klant, Leads-bord, Business OS). Klanten gebruiken de klant-app (workout, voeding, tracking). Alles draait op een Supabase-database. Jij hebt alleen toegang via je tools; wat er niet als tool is, kun je niet zelf, dan zet je het op de app-lijst.

Klantaccounts op slot: een account op slot betekent dat de klant in zijn app alleen een pauzescherm ziet; alle data blijft bewaard en ontgrendelen kan altijd. Werkwijze: eerst zoek_klanten, dan de namen met reden laten zien, dan stel_slot_voor. Kersten bevestigt zelf met de knop onder je bericht; zeg dus nooit dat het al gebeurd is.

Database: je kunt de hele database lezen met bekijk_schema (welke tabellen en kolommen er zijn) en lees_database (een SELECT-vraag). Begin bij de App-kaart-skill; ken je een tabel niet, kijk eerst het schema na in plaats van kolomnamen te gokken. Geef antwoorden in gewone taal, niet als ruwe JSON.
Iets aanpassen in de data (een veld wijzigen, rijen toevoegen): gebruik stel_wijziging_voor. Dat is toestemming vragen: Kersten ziet precies wat er verandert en klikt Toestaan. Zeg nooit dat het al gedaan is. Verwijderen van rijen en het schema veranderen (kolommen, tabellen) kan niet; zet dat op de app-lijst.

Zelf leren: je bouwt je eigen skills op. Gebruik bewaar_skill met geleerd: true, zonder het te vragen, wanneer:
- je een taak hebt afgerond waarvoor nog geen skill bestond en die vaker kan terugkomen: leg de werkwijze vast die werkte;
- Kersten je corrigeert of een voorkeur uitspreekt ("nee, korter", "altijd zo", "dat bedoel ik niet"): werk de betreffende skill bij;
- je iets nieuws ontdekt over de database of de app (wat een tabel of kolom betekent, welke query werkt): voeg het toe aan de skill App-kaart.
Bij bijwerken: altijd de volledige skill (oude stappen plus de verbetering) onder dezelfde naam. Klein en concreet, geen herhaling van deze algemene regels.

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

App-wijzigingen (code, schermen, functies): gebruik standaard stel_lokale_opdracht_voor. Kersten klikt dan op "Uitvoeren op mijn Mac" en Claude Code past het direct aan in zijn lokale code. Schrijf de opdracht volledig en zelfstandig: welk scherm, wat er nu gebeurt, wat het moet worden, en wat je al weet uit de database of het gesprek. Die Claude Code ziet dit gesprek niet. Zegt Kersten "voor later" of "zet op de lijst", gebruik dan zet_op_app_lijst. Beloof nooit dat het al aangepast is; het resultaat verschijnt onder je bericht. Eerdere opdrachten en hun resultaat staan in de tabel business_os_opdrachten.

Skills: hieronder staan Kerstens skills, vaste werkwijzen per soort taak. Past een taak bij een skill, volg die stappen precies. Wil Kersten een nieuwe werkwijze vastleggen of een bestaande aanpassen ("onthoud dit", "maak hier een skill van", "voortaan bij scripts..."), gebruik bewaar_skill met de volledige nieuwe instructies (bij aanpassen: de oude stappen plus de wijziging, onder dezelfde naam). Laat in één zin weten wat je bewaard hebt.

Wachten op Kersten: heb je iets van Kersten nodig voordat je verder kunt en is het geen ander voorstel (een sleutel in Supabase Secrets zetten, iets downloaden of installeren, een screenshot sturen, een vraag beantwoorden), gebruik dan altijd wacht_op_jou met een korte taak. Anders ziet hij niet dat je op hem wacht.

Screenshots: Kersten kan een screenshot meesturen (van de app, een DM, cijfers). Lees wat erop staat en gebruik het; vraag niet om het over te typen.

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
  description: 'Maak een nieuwe skill of overschrijf een bestaande met dezelfde naam: op verzoek van Kersten, of uit jezelf (geleerd: true) volgens de regels voor zelf leren.',
  input_schema: {
    type: 'object',
    properties: {
      naam: { type: 'string', description: 'Korte naam, bv. "Reel-script". Gelijk aan een bestaande naam = aanpassen.' },
      wanneer: { type: 'string', description: 'Wanneer deze skill gebruikt wordt, in één zin.' },
      instructies: { type: 'string', description: 'De volledige genummerde stappen en regels.' },
      geleerd: { type: 'boolean', description: 'true als je dit uit jezelf vastlegt (zelf leren), niet op verzoek.' },
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
  name: 'bekijk_schema',
  description: 'Zonder tabel: alle tabellen met aantal rijen. Met tabel: de kolommen en types van die tabel.',
  input_schema: {
    type: 'object',
    properties: { tabel: { type: 'string' } },
  },
}, {
  name: 'lees_database',
  description: 'Voer één SELECT-vraag (PostgreSQL) uit op de database, met Kerstens rechten. Maximaal 200 rijen terug; gebruik count/sum/group by voor totalen.',
  input_schema: {
    type: 'object',
    properties: { sql: { type: 'string', description: 'Eén SELECT- of WITH-vraag, zonder puntkomma.' } },
    required: ['sql'],
  },
}, {
  name: 'stel_wijziging_voor',
  description: 'Vraag toestemming om data aan te passen. Voert NIETS uit: Kersten ziet tabel, filter, velden en aantal rijen en klikt Toestaan.',
  input_schema: {
    type: 'object',
    properties: {
      tabel: { type: 'string' },
      actie: { type: 'string', enum: ['update', 'insert'] },
      filters: {
        type: 'array',
        description: 'Bij update verplicht: welke rijen. Bv. [{ kolom: "id", op: "eq", waarde: "..." }].',
        items: {
          type: 'object',
          properties: {
            kolom: { type: 'string' },
            op: { type: 'string', enum: ['eq', 'neq', 'in', 'is', 'lt', 'lte', 'gt', 'gte', 'ilike'] },
            waarde: { description: 'Bij in: een lijst. Bij is: null, true of false.' },
          },
          required: ['kolom', 'op', 'waarde'],
        },
      },
      velden: { type: 'object', description: 'Bij update: kolom → nieuwe waarde.' },
      rijen: { type: 'array', items: { type: 'object' }, description: 'Bij insert: de nieuwe rijen (max 50).' },
      uitleg: { type: 'string', description: 'In één zin wat er verandert en waarom.' },
    },
    required: ['tabel', 'actie', 'uitleg'],
  },
}, {
  name: 'stel_lokale_opdracht_voor',
  description: 'Zet een code-opdracht klaar voor Claude Code op Kerstens Mac. Voert NIETS uit: Kersten klikt "Uitvoeren op mijn Mac".',
  input_schema: {
    type: 'object',
    properties: {
      opdracht: { type: 'string', description: 'Volledige, zelfstandige opdracht: scherm, huidig gedrag, gewenst gedrag, bekende details.' },
    },
    required: ['opdracht'],
  },
}, {
  name: 'wacht_op_jou',
  description: 'Laat Kersten zien dat je op hem wacht voor iets dat geen ander voorstel is (sleutel instellen, iets downloaden, screenshot sturen, vraag beantwoorden). Verschijnt boven de chatbalk met een Gedaan-knop.',
  input_schema: {
    type: 'object',
    properties: {
      tekst: { type: 'string', description: 'Korte taak voor Kersten, max ~80 tekens, bv. "Zet ELEVENLABS_API_KEY in Supabase Secrets".' },
    },
    required: ['tekst'],
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
    if (!user) return json({ error: 'Niet ingelogd.' }, 401)
    // Alleen de teameigenaar (coach_teams.owner_id = Kersten). Medewerkers zoals
    // Marcel krijgen 403 voordat er een betaalde API-aanroep gaat.
    const { data: eigenTeam } = await sb.from('coach_teams').select('id').eq('owner_id', user.id).limit(1)
    if (!eigenTeam?.length) return json({ fout: 'alleen_eigenaar', error: 'Alleen voor de eigenaar.' }, 403)

    const body = await req.json().catch(() => ({}))
    // Een gebruikersbericht mag een screenshot hebben: { afbeelding: { media_type,
    // data (base64) } }. Die gaat als image-blok + text-blok naar Anthropic.
    // Berichten met alleen tekst (de oude vorm) blijven een gewone string.
    const BEELD_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    const geldigBeeld = (b: any) => b.role === 'user' && b.afbeelding
      && BEELD_TYPES.includes(b.afbeelding.media_type)
      && typeof b.afbeelding.data === 'string' && b.afbeelding.data.length > 0
      && b.afbeelding.data.length < 7_000_000 && /^[A-Za-z0-9+/]+=*$/.test(b.afbeelding.data)
    const tekstVan = (b: any) => typeof b.content === 'string' ? b.content.slice(0, 8000) : ''
    let beelden = 0
    const berichten = (Array.isArray(body.berichten) ? body.berichten : [])
      .filter((b: any) => (b.role === 'user' || b.role === 'assistant') && (tekstVan(b).trim() || geldigBeeld(b)))
      .slice(-20)
      .reverse()
      .map((b: any) => {
        // Maximaal 3 screenshots (de nieuwste); oudere gaan als tekst door.
        if (!geldigBeeld(b) || beelden++ >= 3) return { role: b.role, content: tekstVan(b).trim() ? tekstVan(b) : '[screenshot]' }
        const tekst = tekstVan(b).trim()
        return {
          role: b.role,
          content: [
            { type: 'image', source: { type: 'base64', media_type: b.afbeelding.media_type, data: b.afbeelding.data } },
            ...(tekst ? [{ type: 'text', text: tekst }] : []),
          ],
        }
      })
      .reverse()
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
        body: JSON.stringify({ model: MODEL, max_tokens: 4000, system: systeem, tools: TOOLS, messages }),
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

    // Voorstel voor een datawijziging: controleren en het aantal rijen tellen
    // (met Kerstens RLS), uitvoeren doet pas de Toestaan-knop in de chat.
    const pasFilters = (q: any, filters: any[]) => {
      for (const f of filters) {
        if (f.op === 'in') q = q.in(f.kolom, Array.isArray(f.waarde) ? f.waarde : [f.waarde])
        else if (f.op === 'is') q = q.is(f.kolom, f.waarde)
        else q = q[f.op](f.kolom, f.waarde)
      }
      return q
    }
    const OPS = ['eq', 'neq', 'in', 'is', 'lt', 'lte', 'gt', 'gte', 'ilike']
    const wijzigingVoorstel = async (inp: any, acties: any[]) => {
      const tabel = String(inp.tabel || '')
      if (!/^[a-z_][a-z0-9_]*$/.test(tabel)) return 'Ongeldige tabelnaam.'
      const filters = (Array.isArray(inp.filters) ? inp.filters : [])
        .filter((f: any) => f && /^[a-z_][a-z0-9_]*$/.test(String(f.kolom)) && OPS.includes(f.op))
      const uitleg = String(inp.uitleg || '').slice(0, 300)
      if (inp.actie === 'insert') {
        const rijen = (Array.isArray(inp.rijen) ? inp.rijen : []).filter((r: any) => r && typeof r === 'object').slice(0, 50)
        if (!rijen.length) return 'Geen rijen om toe te voegen.'
        acties.push({ soort: 'wijziging_voorstel', actie: 'insert', tabel, rijen, uitleg, aantal: rijen.length })
        return `Voorstel staat klaar (${rijen.length} nieuwe rij(en) in ${tabel}). Kersten moet op Toestaan klikken; er is nog niets uitgevoerd.`
      }
      const velden = inp.velden && typeof inp.velden === 'object' ? inp.velden : null
      if (!velden || !Object.keys(velden).length) return 'Geen velden om te wijzigen.'
      if (!filters.length) return 'Een update zonder filter mag niet: geef aan welke rijen.'
      const { data: voorbeeld, count, error } = await pasFilters(
        sb.from(tabel).select('*', { count: 'exact' }).limit(3), filters)
      if (error) return 'Controle mislukt: ' + error.message
      if (!count) return 'Er vallen geen rijen onder dit filter (of Kersten mag ze niet zien).'
      if (count > 500) return `Te veel rijen (${count}); maak het filter specifieker of splits het op.`
      acties.push({ soort: 'wijziging_voorstel', actie: 'update', tabel, filters, velden, uitleg, aantal: count })
      return `Voorstel staat klaar: ${count} rij(en) in ${tabel}. Voorbeeld huidige waarden: ${JSON.stringify(voorbeeld).slice(0, 2000)}. Kersten moet op Toestaan klikken; er is nog niets uitgevoerd.`
    }

    // Tool-lus: maximaal 8 rondes (schema → lezen → voorstel → antwoord).
    const gesprek: any[] = [...berichten]
    const acties: any[] = []
    let data = await vraagAI(gesprek)
    for (let ronde = 0; data && data.stop_reason === 'tool_use' && ronde < 8; ronde++) {
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
          const instructies = String(blok.input?.instructies || '').trim().slice(0, 12000)
          const { error } = naam && wanneer && instructies && user
            ? await sb.from('business_os_skills').upsert(
                { coach_id: user.id, naam, wanneer, instructies, actief: true, updated_at: new Date().toISOString() },
                { onConflict: 'coach_id,naam' })
            : { error: { message: 'naam, wanneer en instructies zijn verplicht' } }
          if (error) { console.error('skill', error); uitkomst = 'Mislukt: ' + error.message }
          else {
            acties.push({ soort: 'skill', tekst: blok.input?.geleerd ? `Geleerd: ${naam}` : `Skill bewaard: ${naam}` })
            uitkomst = 'Bewaard.'
          }
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
        if (blok.name === 'bekijk_schema') {
          const { data: rijen, error } = await sb.rpc('business_os_schema', { p_tabel: blok.input?.tabel || null })
          uitkomst = error ? 'Mislukt: ' + error.message : JSON.stringify(rijen).slice(0, 30000)
        }
        if (blok.name === 'lees_database') {
          const { data: rijen, error } = await sb.rpc('business_os_lees', { p_sql: String(blok.input?.sql || '') })
          uitkomst = error ? 'Fout: ' + error.message : JSON.stringify(rijen).slice(0, 30000)
        }
        if (blok.name === 'stel_wijziging_voor') {
          uitkomst = await wijzigingVoorstel(blok.input || {}, acties)
        }
        if (blok.name === 'stel_lokale_opdracht_voor') {
          const opdracht = String(blok.input?.opdracht || '').trim().slice(0, 8000)
          if (!opdracht) uitkomst = 'Lege opdracht.'
          else {
            acties.push({ soort: 'pa_voorstel', tekst: opdracht })
            uitkomst = 'Opdracht staat klaar; Kersten moet op "Uitvoeren op mijn Mac" klikken. Er is nog niets uitgevoerd.'
          }
        }
        if (blok.name === 'wacht_op_jou') {
          const tekst = String(blok.input?.tekst || '').replace(/\s+/g, ' ').trim().slice(0, 120)
          if (!tekst) uitkomst = 'Lege tekst.'
          else {
            acties.push({ soort: 'wacht_op_jou', tekst })
            uitkomst = 'Staat boven de chatbalk; Kersten klikt Gedaan als het klaar is.'
          }
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
