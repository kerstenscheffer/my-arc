// supabase/functions/zoek-verrijking/index.ts
//
// Wekelijkse aanvuller van de zoeker (18 nov 2026). Draait vanzelf via pg_cron
// (supabase/zoek-verrijking.sql), niemand hoeft iets na te lopen.
//
// Wat klanten zochten en niet vonden (zoek_verrijking_kandidaten) gaat naar
// het model. Dat zegt per term wat het is:
//   synoniem → andere naam voor iets wat we al hebben ("snert" = erwtensoep)
//   gerecht  → een recept dat we nog niet hebben, met ingrediënten en grammen
//   product  → een los product dat ontbreekt (voegen we NIET toe: dan zou het
//              model voedingswaarden moeten verzinnen)
//   onzin    → tikwerk, merknaam, geen eten
//
// Het model levert nooit voedingswaarden. Een gerecht komt er alleen in als
// ELK ingrediënt in onze eigen productenlijst gevonden wordt (basisproduct,
// rauw gewogen); de macro's zijn de optelsom daarvan. Lukt één ingrediënt
// niet, of valt de som buiten redelijke grenzen, dan slaan we het over.
//
// Toegang: alleen met de testsleutel uit de Vault (zelfde als plan-bouwer).
// Body: { dry_run?: true, max?: number }.
// Sleutel: ANTHROPIC_API_KEY als Supabase-secret, nooit in code.
// deno-lint-ignore-file no-explicit-any
import { createClient, SupabaseClient } from 'npm:@supabase/supabase-js@2'
import Anthropic from 'npm:@anthropic-ai/sdk'
import { z } from 'npm:zod'
import { zodOutputFormat } from 'npm:@anthropic-ai/sdk/helpers/zod'

const MODEL = 'claude-opus-5-5'
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-testsleutel',
}

const Uitkomst = z.object({
  uitkomsten: z.array(z.object({
    term: z.string(),
    soort: z.enum(['synoniem', 'gerecht', 'product', 'onzin']),
    // Bij synoniem: de gewone Nederlandse naam waar we op moeten zoeken. Anders leeg.
    synoniem_van: z.string(),
    // Bij gerecht gevuld; anders naam leeg en lege lijsten.
    gerecht: z.object({
      naam: z.string(),
      moment: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
      ingredienten: z.array(z.object({ zoek: z.string(), gram: z.number() })),
      stappen: z.array(z.string()),
      bereidtijd_min: z.number(),
    }),
  })),
})

const PROMPT = (termen: { term: string; gat: string }[]) => `Je helpt de voedingsdatabase van een Nederlandse fitness-coachingapp aan te vullen.
Klanten zochten onderstaande termen en vonden niets. Zeg per term wat het is.

Soorten:
- "synoniem": alleen bij gat "product". Een andere naam, spelling of tikfout voor een gewoon product dat een Nederlandse voedingsdatabase vrijwel zeker heeft. Vul synoniem_van met de gewone naam in kleine letters (bv. "snert" → "erwtensoep").
- "gerecht": alleen bij gat "gerecht". Een gerecht dat je thuis maakt uit meerdere ingrediënten (bv. kip tandoori met rijst). Ook als de term een tikfout of een algemene naam is: maak dan de bekendste variant ("stampot" → Stamppot boerenkool met rookworst). Vul gerecht.
- "product": één los product of kant-en-klaar artikel (bv. kroket, friet, bosui, cappuccino). Niets invullen.
- "onzin": half getypt woord waar je niet zeker van bent, merknaam zonder product, of geen eten. Bij twijfel: onzin.

Regels voor een gerecht:
- Eén portie voor één persoon, passend bij iemand die let op zijn voeding: hoofdmaaltijd 450 tot 700 kcal met minstens 30 gram eiwit; snack 150 tot 350 kcal.
- 3 tot 8 ingrediënten. "zoek" is een eenvoudige, algemene productnaam zoals die in een supermarkt-database staat, zonder merk en zonder bereiding: "kipfilet", "aardappelen", "boerenkool", "rookworst", "zilvervliesrijst", "olijfolie", "magere kwark".
- "gram" is het rauwe, ongekookte gewicht voor die ene portie. Vloeistoffen ook in gram.
- Geen water, zout, peper of losse kruiden als ingrediënt; noem die alleen in de stappen.
- "naam": korte Nederlandse naam met hoofdletter, zoals op een menukaart ("Stamppot boerenkool met rookworst").
- "stappen": 3 tot 5 korte zinnen in het Nederlands.
- Geef nooit voedingswaarden; die rekenen wij zelf uit.

Geef voor elke term precies één uitkomst terug, met de term letterlijk overgenomen.

Termen (gat tussen haakjes):
${termen.map(t => `- ${t.term} (${t.gat})`).join('\n')}`

const plat = (t: string) => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim()
const slug = (t: string) => plat(t).replace(/ /g, '_').slice(0, 60)
const NIET_RAUW = ['gekookt', 'gebakken']

// Eén ingrediënt opzoeken in onze eigen lijst: alleen een basisproduct (geen
// barcode), niet gekookt of gebakken, en de naam moet het woord bevatten.
async function vindIngredient(sb: SupabaseClient, zoek: string) {
  const { data } = await sb.rpc('zoek_ingredienten', { p_q: zoek, p_client: null, p_limit: 12 })
  const woord = plat(zoek).split(' ').sort((a, b) => b.length - a.length)[0] || ''
  const kern = woord.slice(0, Math.max(4, woord.length - 2))
  const rij = (data || []).find((r: any) =>
    !r.barcode && !NIET_RAUW.includes(String(r.bereiding || '').toLowerCase())
    && plat(r.name).includes(kern) && Number(r.calories_per_100g) >= 0)
  if (!rij) return null
  // Vezels staan niet in de zoekuitkomst.
  const { data: vol } = await sb.from('ai_ingredients')
    .select('id, name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g')
    .eq('id', rij.id).maybeSingle()
  return vol || null
}

async function bouwGerecht(sb: SupabaseClient, g: any) {
  const naam = String(g?.naam || '').trim()
  const lijst = Array.isArray(g?.ingredienten) ? g.ingredienten : []
  if (!naam || lijst.length < 3 || lijst.length > 8) return { fout: 'geen bruikbaar recept' }
  const { data: dubbel } = await sb.from('ai_meals').select('id').ilike('name', naam).limit(1)
  if (dubbel?.length) return { fout: 'bestaat al onder deze naam' }

  const regels: any[] = []
  const som = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
  for (const ing of lijst) {
    const gram = Math.round(Number(ing?.gram) || 0)
    if (gram < 3 || gram > 600) return { fout: `hoeveelheid klopt niet: ${ing?.zoek} ${ing?.gram} g` }
    const p = await vindIngredient(sb, String(ing?.zoek || ''))
    if (!p) return { fout: `ingrediënt niet in onze lijst: ${ing?.zoek}` }
    if (regels.some(r => r.ingredient_id === p.id)) continue
    const f = gram / 100
    som.calories += (Number(p.calories_per_100g) || 0) * f
    som.protein += (Number(p.protein_per_100g) || 0) * f
    som.carbs += (Number(p.carbs_per_100g) || 0) * f
    som.fat += (Number(p.fat_per_100g) || 0) * f
    som.fiber += (Number(p.fiber_per_100g) || 0) * f
    regels.push({ unit: 'gram', amount: gram, display: p.name, ingredient_id: p.id })
  }
  if (regels.length < 3) return { fout: 'te weinig ingrediënten over' }
  const snack = g.moment === 'snack'
  const [min, max] = snack ? [100, 450] : [300, 900]
  if (som.calories < min || som.calories > max) return { fout: `optelsom buiten de grenzen: ${Math.round(som.calories)} kcal` }
  if (!snack && som.protein < 20) return { fout: `te weinig eiwit: ${Math.round(som.protein)} g` }
  // Zelfde som langs de macro's: 4/4/9 kcal per gram mag niet ver van de calorieën liggen.
  const uitMacros = som.protein * 4 + som.carbs * 4 + som.fat * 9
  if (Math.abs(uitMacros - som.calories) > som.calories * 0.25) return { fout: 'calorieën en macro\'s spreken elkaar tegen' }

  const r1 = (x: number) => Math.round(x * 10) / 10
  return {
    rij: {
      name: naam,
      calories: Math.round(som.calories), protein: r1(som.protein), carbs: r1(som.carbs), fat: r1(som.fat), fiber: r1(som.fiber),
      labels: ['bron:zoekverrijking'],
      timing: [g.moment],
      ingredients_list: regels,
      preparation_steps: (Array.isArray(g.stappen) ? g.stappen : []).map((s: any) => String(s).trim()).filter(Boolean).slice(0, 6),
      cook_time_min: Math.max(0, Math.min(180, Math.round(Number(g.bereidtijd_min) || 0))),
      serving_size: 1,
      meal_type: 'solid',
      internal_name: `zoekverrijking_${slug(naam)}`,
      needs_review: false,
    },
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...CORS, 'Content-Type': 'application/json' } })
  try {
    const body = await req.json().catch(() => ({}))
    const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const testsleutel = req.headers.get('x-testsleutel')
    const mag = !!testsleutel && !!(await sb.rpc('plan_bouwer_test_ok', { p_sleutel: testsleutel })).data
    if (!mag) return json({ error: 'niet toegestaan' }, 403)
    if (!Deno.env.get('ANTHROPIC_API_KEY')) return json({ error: 'ANTHROPIC_API_KEY ontbreekt' }, 503)

    const max = Math.max(1, Math.min(20, Number(body.max) || 12))
    const { data: kandidaten, error: kFout } = await sb.rpc('zoek_verrijking_kandidaten', { p_max: max })
    if (kFout) throw kFout
    if (!kandidaten?.length) return json({ ok: true, behandeld: 0 })

    const client = new Anthropic()
    const antwoord = await client.messages.parse({
      model: MODEL,
      max_tokens: 16000,
      output_config: { effort: 'medium', format: zodOutputFormat(Uitkomst) },
      messages: [{ role: 'user', content: PROMPT(kandidaten) }],
    })
    if (antwoord.stop_reason === 'refusal' || !antwoord.parsed_output) {
      console.error('zoek-verrijking: geen bruikbaar antwoord', antwoord.stop_reason)
      return json({ error: 'geen bruikbaar antwoord van het model', stop_reason: antwoord.stop_reason }, 502)
    }
    const perTerm = new Map(antwoord.parsed_output.uitkomsten.map(u => [plat(u.term), u]))

    const verslag: any[] = []
    for (const k of kandidaten as any[]) {
      const u = perTerm.get(plat(k.term))
      let uitkomst = 'overgeslagen'
      let detail: any = { soort: u?.soort || null }
      if (!u) {
        detail.reden = 'geen uitkomst van het model'
      } else if (u.soort === 'onzin') {
        uitkomst = 'onzin'
      } else if (u.soort === 'product') {
        uitkomst = 'product_ontbreekt'
      } else if (u.soort === 'synoniem') {
        const naar = plat(u.synoniem_van)
        // Alleen koppelen als onze zoeker op de gewone naam echt iets vindt.
        const { data: treffers } = naar && naar !== plat(k.term)
          ? await sb.rpc('zoek_ingredienten', { p_q: naar, p_client: null, p_limit: 3 }) : { data: [] as any[] }
        const raak = (treffers || []).some((r: any) => plat(r.name).includes(naar.split(' ')[0]))
        detail.naar = naar
        if (!raak) detail.reden = 'de gewone naam vindt bij ons ook niets'
        else {
          uitkomst = 'synoniem'
          if (!body.dry_run) {
            const { error } = await sb.from('zoek_synoniemen').insert({ van: k.term, naar })
            if (error) { uitkomst = 'overgeslagen'; detail.reden = error.message }
          }
        }
      } else if (u.soort === 'gerecht') {
        if (k.gat !== 'gerecht') detail.reden = 'gerecht bij een productzoekopdracht'
        else {
          const b = await bouwGerecht(sb, u.gerecht)
          if (b.fout) detail.reden = b.fout
          else {
            uitkomst = 'maaltijd'
            detail = { ...detail, naam: b.rij!.name, calories: b.rij!.calories, protein: b.rij!.protein, ingredienten: b.rij!.ingredients_list.map((r: any) => `${r.amount} g ${r.display}`) }
            if (!body.dry_run) {
              const { data, error } = await sb.from('ai_meals').insert(b.rij).select('id').single()
              if (error) { uitkomst = 'overgeslagen'; detail.reden = error.message }
              else detail.meal_id = data.id
            }
          }
        }
      }
      verslag.push({ term: k.term, gat: k.gat, uitkomst, detail })
      if (!body.dry_run) {
        await sb.from('zoek_verrijking').upsert({ term: k.term, gat: k.gat, keer: k.keer, klanten: k.klanten, uitkomst, detail })
          .then((x: any) => x, () => null)
      }
    }
    return json({ ok: true, dry_run: !!body.dry_run, behandeld: verslag.length, verslag })
  } catch (e) {
    console.error('zoek-verrijking', (e as Error)?.message || e)
    return json({ error: String((e as Error)?.message || e) }, 500)
  }
})
