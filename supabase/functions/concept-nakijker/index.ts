// supabase/functions/concept-nakijker/index.ts
//
// Kijkt een concept uit de intake na tegen de feedback van de coach (18 nov 2026).
//
// De bouwers (workout-bouwer, maak_intake_voedingsconcept) werken met vaste
// regels en lezen geen vrije tekst. De coach schrijft in de brief wat een
// volgende keer anders moet (tabel concept_feedback). Deze functie legt het
// verse concept naast die open feedback en laat een AI bepalen wat er botst.
// De AI mag alleen een vaste set veilige handelingen kiezen; het toepassen
// gebeurt hier in code, niet door de AI. Wat niet veilig op te lossen is komt
// bovenaan "Zelf nakijken" in de brief.
//
// Body: { client_id, soort: 'workout' | 'voeding', opnieuw?: boolean }
// Toegang: een ingelogde coach van de klant, de testsleutel uit de Vault, of
// (de intake zelf, niet ingelogd) alleen bij een concept van minder dan 15
// minuten oud dat nog niet is nagekeken.
// Sleutels: ANTHROPIC_API_KEY + SUPABASE_SERVICE_ROLE_KEY als secrets.
// deno-lint-ignore-file no-explicit-any
import { createClient, SupabaseClient } from 'npm:@supabase/supabase-js@2'
import Anthropic from 'npm:@anthropic-ai/sdk@1.2.0'

const MODEL = 'claude-opus-5-5'
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-testsleutel',
}
const DAGEN = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const gelijk = (a: unknown, b: unknown) => String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase()
const r1 = (n: number) => Math.round(n * 10) / 10

const SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['acties', 'toegepast', 'niet_opgelost'],
  properties: {
    acties: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false,
        required: ['soort', 'dag', 'doel', 'door', 'waarde', 'ingredient'],
        properties: {
          soort: { type: 'string', enum: ['verwijder', 'vervang', 'sets', 'verplaats', 'voeg_toe', 'ingredient_gram'] },
          dag: { type: 'string', description: "De dagsleutel uit het plan, of 'alle' voor elke dag waar het doel voorkomt." },
          doel: { type: 'string', description: 'Training: exacte naam van de oefening. Voeding: het slot (breakfast, lunch, dinner, snack1...).' },
          door: { type: ['string', 'null'], description: 'Bij vervang en voeg_toe: exacte naam uit de lijst toegestaan.' },
          waarde: { type: ['number', 'null'], description: 'Bij sets: aantal sets. Bij verplaats: nieuwe plek (1 = eerste). Bij ingredient_gram: grammen (0 = weghalen). Bij voeg_toe: aantal sets.' },
          ingredient: { type: ['string', 'null'], description: 'Alleen bij ingredient_gram: exacte naam van het ingrediënt.' },
        },
      },
    },
    toegepast: {
      type: 'array',
      items: { type: 'object', additionalProperties: false, required: ['feedback', 'uitleg'], properties: { feedback: { type: 'string' }, uitleg: { type: 'string' } } },
    },
    niet_opgelost: {
      type: 'array',
      items: { type: 'object', additionalProperties: false, required: ['feedback', 'reden'], properties: { feedback: { type: 'string' }, reden: { type: 'string' } } },
    },
  },
}

const SYSTEEM = `Je kijkt een conceptplan van een fitnesscoach na tegen zijn eigen feedback op eerdere concepten.

Je krijgt: het concept (training of voeding), de open feedbackpunten van de coach, en een lijst "toegestaan" met de enige namen die je als vervanging of toevoeging mag gebruiken.

Werkwijze:
- Loop elk feedbackpunt na. Gaat het concept ertegenin, kies dan de kleinste set acties die het oplost. Gaat het concept er niet tegenin, of gaat het punt over iets wat niet in dit plan zit, doe dan niets en noem het punt nergens.
- Gebruik alleen de acties uit het schema, met exacte namen uit het concept en uit "toegestaan". Verzin geen oefeningen, gerechten of ingrediënten.
- Elke opgeloste botsing komt één keer in "toegepast": het feedbackpunt (kort) en in één zin wat je hebt veranderd, in gewoon Nederlands met concrete namen en getallen.
- Kun je een botsing niet oplossen met deze acties (bijvoorbeeld omdat er geen passende vervanging in "toegestaan" staat, of omdat het de macro's ver van het doel zou trekken), zet het dan in "niet_opgelost" met de reden. De coach lost het dan zelf op.
- Verander niets wat de feedback niet raakt. Geen verbeteringen op eigen initiatief.

Training: 'vervang' en 'verwijder' werken op één oefening op één dag (of dag 'alle'). 'sets' zet het aantal sets. 'verplaats' zet de oefening op een plek in de dag. 'voeg_toe' zet een oefening uit "toegestaan" achteraan de dag.
Voeding: 'vervang' vervangt de maaltijd in een slot door een gerecht uit "toegestaan". 'verwijder' haalt de maaltijd uit het slot. 'ingredient_gram' zet de grammen van één ingrediënt in die maaltijd (0 = weghalen). Houd bij voeding rekening met het kcal- en eiwitdoel: compenseer een grote wijziging zo nodig met een tweede actie. Het vetdoel in "doel_trainingsdag" is een minimum: haal je een vetbron weg of verklein je hem (ei, kaas, olie, noten), zet er dan in dezelfde maaltijd een andere vetbron tegenover of vergroot een bestaande, zodat geen dag onder dat minimum komt. Lukt dat niet met deze acties, zet het punt dan in "niet_opgelost". Een maaltijd met kant_en_klaar: true is een kant-en-klare maaltijd waar de klant zelf om vroeg: die vervang, verwijder of wijzig je niet.`

// ── Training ────────────────────────────────────────────────────────────────
function groepeerOpSpier(oef: any[]) {
  const eerste = new Map<string, number>()
  oef.forEach((o, i) => { const k = String(o.primairSpieren || '?'); if (!eerste.has(k)) eerste.set(k, i) })
  return oef.map((o, i) => ({ o, i })).sort((a, b) => (eerste.get(String(a.o.primairSpieren || '?'))! - eerste.get(String(b.o.primairSpieren || '?'))!) || a.i - b.i).map(x => x.o)
}

async function workoutContext(sb: SupabaseClient, clientId: string) {
  const { data } = await sb.from('workout_schemas').select('id, name, week_structure, generation_options')
    .is('client_id', null).eq('generation_options->>concept_voor', clientId).eq('generation_options->>status', 'concept')
    .order('created_at', { ascending: false }).limit(1)
  const plan = data?.[0]
  if (!plan) return null
  const { data: can } = await sb.from('workout_schemas').select('week_structure').eq('is_canoniek', true)
  const toegestaan = new Map<string, any>()
  for (const t of can || []) for (const d of Object.values(t.week_structure || {}) as any[]) for (const o of d?.exercises || []) {
    if (o?.name && !toegestaan.has(o.name.toLowerCase())) toegestaan.set(o.name.toLowerCase(), o)
  }
  const sleutels = Object.keys(plan.week_structure || {}).sort((a, b) => parseInt(a.replace(/\D/g, '')) - parseInt(b.replace(/\D/g, '')))
  const voorAI = {
    dagen: sleutels.map(k => ({ dag: k, naam: plan.week_structure[k]?.name, oefeningen: (plan.week_structure[k]?.exercises || []).map((o: any) => ({ naam: o.name, spier: o.primairSpieren, sets: o.sets, reps: o.reps })) })),
    toegestaan: [...toegestaan.values()].map(o => ({ naam: o.name, spier: o.primairSpieren })),
  }
  return { plan, opties: plan.generation_options || {}, voorAI, toegestaan, sleutels }
}

function pasWorkoutToe(ctx: any, acties: any[]) {
  const ws = structuredClone(ctx.plan.week_structure)
  const gedaan: string[] = [], mislukt: string[] = []
  for (const a of acties) {
    const dagen = a.dag === 'alle' ? ctx.sleutels : [a.dag]
    let raak = false
    for (const k of dagen) {
      const dag = ws[k]; if (!dag?.exercises) continue
      const i = dag.exercises.findIndex((o: any) => gelijk(o.name, a.doel))
      let hier = false
      if (a.soort === 'voeg_toe') {
        const nieuw = ctx.toegestaan.get(String(a.door || '').toLowerCase())
        if (!nieuw || dag.exercises.some((o: any) => gelijk(o.name, nieuw.name))) continue
        dag.exercises.push({ ...nieuw, sets: Number(a.waarde) > 0 ? Math.round(a.waarde) : nieuw.sets }); hier = true
      } else if (i === -1) continue
      else if (a.soort === 'verwijder') { dag.exercises.splice(i, 1); hier = true }
      else if (a.soort === 'vervang') {
        const nieuw = ctx.toegestaan.get(String(a.door || '').toLowerCase())
        if (!nieuw) continue
        dag.exercises[i] = { ...nieuw, sets: dag.exercises[i].sets }; hier = true
      } else if (a.soort === 'sets') {
        const n = Math.round(Number(a.waarde)); if (!(n >= 1 && n <= 8)) continue
        dag.exercises[i] = { ...dag.exercises[i], sets: n }; hier = true
      } else if (a.soort === 'verplaats') {
        const naar = Math.max(0, Math.min(dag.exercises.length - 1, Math.round(Number(a.waarde)) - 1))
        const [o] = dag.exercises.splice(i, 1); dag.exercises.splice(naar, 0, o); hier = true
      }
      // Vaste regel: dezelfde spiergroep staat achter elkaar.
      if (hier && a.soort !== 'verplaats') dag.exercises = groepeerOpSpier(dag.exercises)
      if (hier) raak = true
    }
    ;(raak ? gedaan : mislukt).push(`${a.soort} ${a.doel}${a.door ? ` → ${a.door}` : ''}`)
  }
  return { week_structure: ws, gedaan, mislukt }
}

// ── Voeding ─────────────────────────────────────────────────────────────────
async function voedingContext(sb: SupabaseClient, clientId: string) {
  const { data } = await sb.from('client_meal_plans').select('id, template_name, template_id, week_structure, pre_workout_meal, generation_settings, daily_calories')
    .eq('client_id', clientId).eq('is_active', false).eq('generation_settings->>status', 'concept')
    .order('created_at', { ascending: false }).limit(1)
  const plan = data?.[0]
  if (!plan) return null
  // Toegestane gerechten: dezelfde trede en doelgroep in de canonieke plannen,
  // zodat de porties al bij het kcal-niveau passen.
  const basis = String(plan.generation_settings?.basisplan || '')
  const voorvoegsel = basis.split(' | ').slice(0, 2).join(' | ')
  const { data: can } = await sb.from('meal_plan_templates').select('name, week_structure').eq('is_canoniek', true).like('name', `${voorvoegsel} |%`)
  const toegestaan = new Map<string, any>()
  for (const t of can || []) for (const d of Object.values(t.week_structure || {}) as any[]) for (const [slot, m] of Object.entries(d || {}) as any[]) {
    if (m && typeof m === 'object' && m.name && slot !== 'totals' && !toegestaan.has(m.name.toLowerCase())) toegestaan.set(m.name.toLowerCase(), m)
  }
  const ids = new Set<string>()
  const alleMeals = (ws: any) => Object.values(ws || {}).flatMap((d: any) => Object.entries(d || {}).filter(([s, m]: any) => s !== 'totals' && m && typeof m === 'object' && m.name).map(([, m]: any) => m))
  for (const m of [...alleMeals(plan.week_structure), ...toegestaan.values()]) for (const i of m.ingredients_list || []) if (i.ingredient_id) ids.add(i.ingredient_id)
  const { data: ingr } = await sb.from('ai_ingredients').select('id, name').in('id', [...ids])
  const naamVan = new Map((ingr || []).map((i: any) => [i.id, i.name]))
  // kant_en_klaar: een maaltijd van de partner (Prep My Meal) waar de klant in de intake om vroeg.
  const kort = (m: any) => ({ naam: m.name, kcal: Math.round(m.calories || 0), eiwit: Math.round(m.protein || 0), koolh: Math.round(m.carbs || 0), vet: Math.round(m.fat || 0), ...(m.partner ? { kant_en_klaar: true } : {}), ingredienten: (m.ingredients_list || []).map((i: any) => ({ naam: naamVan.get(i.ingredient_id) || i.name || '?', gram: i.amount })) })
  const mv = plan.generation_settings?.macro_voorstel || {}
  const voorAI = {
    doel_trainingsdag: { kcal: mv.target_calories, eiwit: mv.target_protein, koolh: mv.target_carbs, vet: mv.target_fat },
    pre_workout: plan.pre_workout_meal?.name || null,
    dagen: DAGEN.filter(k => plan.week_structure?.[k]).map(k => ({ dag: k, maaltijden: Object.entries(plan.week_structure[k]).filter(([s, m]: any) => s !== 'totals' && m && typeof m === 'object' && m.name).map(([s, m]: any) => ({ slot: s, ...kort(m) })) })),
    toegestaan: [...toegestaan.values()].map(kort),
  }
  return { plan, opties: plan.generation_settings || {}, voorAI, toegestaan, naamVan }
}

async function pasVoedingToe(sb: SupabaseClient, ctx: any, acties: any[]) {
  const ws = structuredClone(ctx.plan.week_structure)
  const gedaan: string[] = [], mislukt: string[] = []
  const herreken = new Set<string>()
  for (const a of acties) {
    const dagen = a.dag === 'alle' ? DAGEN.filter(k => ws[k]) : [a.dag]
    let raak = false
    for (const k of dagen) {
      const dag = ws[k]; const m = dag?.[a.doel]
      if (!dag || !m || typeof m !== 'object') continue
      // Kant-en-klare maaltijd waar de klant om vroeg: die blijft staan.
      if (m.partner) continue
      if (a.soort === 'verwijder') { delete dag[a.doel]; raak = true }
      else if (a.soort === 'vervang') {
        const nieuw = ctx.toegestaan.get(String(a.door || '').toLowerCase())
        if (!nieuw) continue
        dag[a.doel] = { ...nieuw, slot: a.doel, timing: m.timing, display_label: m.display_label }; raak = true
      } else if (a.soort === 'ingredient_gram') {
        const g = Number(a.waarde); if (!(g >= 0 && g <= 1500)) continue
        const lijst = [...(m.ingredients_list || [])]
        const i = lijst.findIndex((x: any) => gelijk(ctx.naamVan.get(x.ingredient_id) || x.name, a.ingredient))
        if (i === -1) continue
        if (g === 0) lijst.splice(i, 1); else lijst[i] = { ...lijst[i], amount: Math.round(g) }
        dag[a.doel] = { ...m, ingredients_list: lijst }; herreken.add(`${k}|${a.doel}`); raak = true
      }
    }
    ;(raak ? gedaan : mislukt).push(`${a.soort} ${a.doel}${a.ingredient ? ` ${a.ingredient}` : ''}${a.door ? ` → ${a.door}` : ''}`)
  }
  // Macro's van gewijzigde maaltijden opnieuw uitrekenen (zelfde functie als de database gebruikt).
  for (const sleutel of herreken) {
    const [k, slot] = sleutel.split('|'); const m = ws[k]?.[slot]; if (!m) continue
    const { data } = await sb.rpc('compute_meal_macros', { p_ingredients: m.ingredients_list })
    const x = Array.isArray(data) ? data[0] : data
    if (x) ws[k][slot] = { ...m, calories: Math.round(x.calories), protein: r1(Number(x.protein)), carbs: r1(Number(x.carbs)), fat: r1(Number(x.fat)), fiber: r1(Number(x.fiber)) }
  }
  // Dagtotalen en weekgemiddelde.
  let tk = 0, te = 0, tkh = 0, tv = 0, n = 0
  for (const k of DAGEN) {
    const dag = ws[k]; if (!dag) continue
    const ms = Object.entries(dag).filter(([s, m]: any) => s !== 'totals' && m && typeof m === 'object' && m.name).map(([, m]: any) => m)
    const som = (f: string) => ms.reduce((s: number, m: any) => s + (Number(m[f]) || 0), 0)
    dag.totals = { kcal: Math.round(som('calories')), protein: r1(som('protein')), carbs: r1(som('carbs')), fat: r1(som('fat')) }
    tk += dag.totals.kcal; te += dag.totals.protein; tkh += dag.totals.carbs; tv += dag.totals.fat; n++
  }
  const gem = n ? { daily_calories: Math.round(tk / n), daily_protein: Math.round(te / n), daily_carbs: Math.round(tkh / n), daily_fat: Math.round(tv / n) } : {}
  return { week_structure: ws, gem, gedaan, mislukt }
}

// ── AI ──────────────────────────────────────────────────────────────────────
async function vraagAI(soort: string, voorAI: any, feedback: string[]) {
  const ai = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! })
  const basis = {
    model: MODEL,
    max_tokens: 8000,
    output_config: { effort: 'medium', format: { type: 'json_schema', schema: SCHEMA } },
    system: SYSTEEM,
    messages: [{ role: 'user', content: `Soort plan: ${soort === 'workout' ? 'training' : 'voeding'}\n\nOpen feedback van de coach:\n${feedback.map((f, i) => `${i + 1}. ${f}`).join('\n')}\n\nHet concept en de lijst toegestaan (JSON):\n${JSON.stringify(voorAI)}\n\nKijk het concept na.` }],
  }
  let res: any
  try {
    // Met server-side fallback: bij een weigering neemt een ander model het over.
    res = await ai.beta.messages.create({ ...basis, betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' } as any)
  } catch (e) {
    if (!(e instanceof Anthropic.BadRequestError)) throw e
    // Deze SDK- of accountversie kent de fallback niet: dan zonder.
    res = await ai.messages.create(basis as any)
  }
  if (res.stop_reason === 'refusal') throw new Error('AI weigerde het verzoek')
  const tekst = (res.content as any[]).find(b => b.type === 'text')?.text
  if (!tekst) throw new Error(`Geen antwoord van de AI (stop: ${res.stop_reason})`)
  return { uit: JSON.parse(tekst), usage: res.usage, model: res.model }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...CORS, 'Content-Type': 'application/json' } })
  try {
    const { client_id, soort, opnieuw } = await req.json()
    if (!client_id || !['workout', 'voeding'].includes(soort)) return json({ error: 'client_id en soort (workout of voeding) zijn nodig' }, 400)
    const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    const jwt = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '')
    const { data: gebruiker } = jwt ? await sb.auth.getUser(jwt).then((x: any) => x, () => ({ data: null })) : { data: null as any }
    const uid = gebruiker?.user?.id
    const testsleutel = req.headers.get('x-testsleutel')
    const isTest = !!testsleutel && !!(await sb.rpc('plan_bouwer_test_ok', { p_sleutel: testsleutel })).data
    const isCoach = isTest || (!!uid && !!(await sb.from('clients').select('id').eq('id', client_id).or(`coach_id.eq.${uid},trainer_id.eq.${uid}`).maybeSingle()).data)

    const ctx: any = soort === 'workout' ? await workoutContext(sb, client_id) : await voedingContext(sb, client_id)
    if (!ctx) return json({ ok: true, overgeslagen: 'geen concept gevonden' })
    const al = ctx.opties.nagekeken
    if (!isCoach) {
      const gemaakt = new Date(ctx.opties.brief?.gemaakt || 0).getTime()
      if (al || !(Date.now() - gemaakt < 15 * 60_000)) return json({ error: 'niet toegestaan' }, 403)
    }
    if (al && !opnieuw) return json({ ok: true, overgeslagen: 'al nagekeken', nagekeken: al })

    const { data: fb } = await sb.from('concept_feedback').select('tekst').eq('soort', soort).is('verwerkt_at', null).order('created_at', { ascending: true }).limit(40)
    const feedback = (fb || []).map((f: any) => String(f.tekst || '').trim()).filter(Boolean)
    const tabel = soort === 'workout' ? 'workout_schemas' : 'client_meal_plans'
    const kolom = soort === 'workout' ? 'generation_options' : 'generation_settings'
    if (!feedback.length) {
      await sb.from(tabel).update({ [kolom]: { ...ctx.opties, nagekeken: { op: new Date().toISOString(), feedback: 0, acties: 0 } } }).eq('id', ctx.plan.id)
      return json({ ok: true, feedback: 0 })
    }

    const { uit, usage, model } = await vraagAI(soort, ctx.voorAI, feedback)
    const acties = Array.isArray(uit.acties) ? uit.acties.slice(0, 40) : []
    const res: any = soort === 'workout' ? pasWorkoutToe(ctx, acties) : await pasVoedingToe(sb, ctx, acties)

    const brief = { ...(ctx.opties.brief || {}) }
    const toegepast = res.gedaan.length ? (uit.toegepast || []) : []
    brief.keuzes = [...(brief.keuzes || []), ...toegepast.map((t: any) => `Aangepast door eerdere feedback ("${String(t.feedback).slice(0, 90)}"): ${t.uitleg}`)]
    // Vetminimum (0,7 g per kg): na de aanpassingen per dag controleren.
    const vetMin = soort === 'voeding' ? Number(ctx.opties.macro_voorstel?.target_fat) || 0 : 0
    const vetLaag = vetMin > 0 ? DAGEN.filter(k => res.week_structure?.[k]?.totals && Number(res.week_structure[k].totals.fat) < vetMin * 0.95) : []
    brief.nakijken = [
      ...(vetLaag.length ? [`Vet onder het minimum op ${vetLaag.length} ${vetLaag.length === 1 ? 'dag' : 'dagen'}: laagste dag ${Math.round(Math.min(...vetLaag.map(k => Number(res.week_structure[k].totals.fat))))} g, minimum ${Math.round(vetMin)} g.`] : []),
      ...(uit.niet_opgelost || []).map((t: any) => `Feedback niet automatisch opgelost ("${String(t.feedback).slice(0, 90)}"): ${t.reden}`),
      ...(res.mislukt.length ? [`De nakijker wilde iets aanpassen dat niet kon: ${res.mislukt.join('; ')}.`] : []),
      ...(brief.nakijken || []).filter((t: string) => !/^Vet onder het minimum/.test(String(t))),
    ]
    const opties = { ...ctx.opties, brief, nagekeken: { op: new Date().toISOString(), feedback: feedback.length, acties: res.gedaan.length, model } }
    const { error } = await sb.from(tabel).update({ week_structure: res.week_structure, ...(res.gem || {}), [kolom]: opties, updated_at: new Date().toISOString() }).eq('id', ctx.plan.id)
    if (error) throw error

    return json(isCoach ? { ok: true, feedback: feedback.length, gedaan: res.gedaan, mislukt: res.mislukt, toegepast, niet_opgelost: uit.niet_opgelost || [], usage } : { ok: true })
  } catch (e) {
    console.error('concept-nakijker', e)
    return json({ error: String((e as any)?.message || e) }, 500)
  }
})
