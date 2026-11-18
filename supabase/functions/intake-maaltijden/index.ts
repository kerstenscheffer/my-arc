// supabase/functions/intake-maaltijden/index.ts
//
// Eigen maaltijden van de klant in het conceptvoedingsplan (18 nov 2026).
// Hoe meer van wat iemand al eet in het plan staat, hoe persoonlijker het
// voelt en hoe makkelijker hij het oppakt (Kersten).
//
// Stappen:
//   1. Een AI leest per moment wat de klant in de intake schreef en haalt er
//      concrete maaltijden uit. Alleen specifiek én goed (kwark met muesli en
//      honing, overnight oats met whey), of een uitdrukkelijke wens ("ik wil
//      echt mijn cappuccino"). Vaag of matig (brood met pindakaas) blijft weg.
//   2. De ingrediënten worden gekoppeld aan ai_ingredients (zoek_ingredienten
//      levert kandidaten, de AI kiest).
//   3. De CODE schaalt, niet de AI: elk ingrediënt heeft een stapgrootte en een
//      maximum (eieren per stuk, brood per snee, whey per halve schep), en het
//      doel is de kcal en het eiwit van de maaltijd die hij vervangt.
//   4. De maaltijd komt als eigen maaltijd van de klant (ai_custom_meals) in
//      het concept, op de dagen waar het vervangen gerecht stond. De brief
//      zegt wat er is overgenomen en wat niet, met de reden.
//
// Body: { client_id, opnieuw? }. Toegang zoals concept-nakijker: coach van de
// klant, de testsleutel uit de Vault, of anoniem binnen 15 minuten na het
// maken van het concept (de intake-keten), één keer.
// deno-lint-ignore-file no-explicit-any
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2'
import Anthropic from 'npm:@anthropic-ai/sdk@1.2.0'

const MODEL = 'claude-opus-5-5'
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-testsleutel',
}
const DAGEN = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const r1 = (n: number) => Math.round(n * 10) / 10
const MOMENT_SLOT: Record<string, string> = { ontbijt: 'breakfast', lunch: 'lunch', diner: 'dinner' }
const MOMENT_NL: Record<string, string> = { ontbijt: 'Ontbijt', lunch: 'Lunch', diner: 'Diner', snack: 'Snack', extra: 'Extra' }
const BRON = 'uit_intake'
// Marges: kcal van de maaltijd binnen 10% van wat hij vervangt; eiwit hooguit
// 5 g minder, of de dag haalt het eiwitdoel van de klant nog (95%).
const KCAL_MARGE = 0.10, EIWIT_MARGE = 5, DAG_EIWIT = 0.95

// ── Portieregels ────────────────────────────────────────────────────────────
// [patroon, stap in gram, minimum, maximum]. stap 0 = per stuk: het gewicht van
// één stuk komt uit ai_ingredients (gram_per_eenheid), min/max zijn dan stuks.
// De eerste regel die past wint; volgorde is dus van specifiek naar algemeen.
const PORTIE: [RegExp, number, number, number, number?][] = [
  [/rucola|\bsla\b|veldsla|ijsbergsla|spinazie|kruiden|koffie|espresso/, 10, 10, 60],
  [/\b(ei|eieren)\b|gekookt ei|gebakken ei|ei \(heel\)/, 0, 1, 5, 60],
  [/wrap|tortilla|pita|bagel|broodje|pistolet|bolletje/, 0, 1, 2, 60],
  [/cracker|beschuit|rijstwafel|knäckebröd|knackebrod|maiswafel|linzenwafel/, 0, 1, 5, 10],
  [/brood|boterham/, 35, 35, 140],
  [/whey|eiwitpoeder|proteinepoeder|proteïnepoeder|protein isolate|caseine|caseïne/, 15, 15, 45],
  [/kwark|skyr|yoghurt|cottage|hüttenkäse|huttenkase/, 50, 100, 500],
  [/melk|sojadrink|haverdrink|amandeldrink|karnemelk/, 50, 100, 400],
  [/havermout|muesli|cruesli|granola|cornflakes|brinta|gepofte/, 10, 20, 100],
  [/rijst|pasta|spaghetti|macaroni|penne|couscous|quinoa|noodles|\bmie\b|bulgur/, 10, 40, 125],
  [/aardappel|krieltjes|zoete aardappel/, 50, 100, 400],
  [/kipfilet \(beleg|vleeswaren|achterham|\bham\b|rookvlees|rosbief|filet americain|kalkoenfilet \(beleg/, 15, 15, 90],
  [/kip|kalkoen|rund|gehakt|biefstuk|zalm|tonijn|kabeljauw|\bvis\b|garnalen|tofu|tempeh|varkens/, 25, 75, 250],
  [/kaas|mozzarella|feta/, 10, 10, 60],
  [/honing|jam|siroop|pindakaas|notenpasta|hummus|\bolie\b|olijfolie|boter|margarine|chocopasta|hagelslag|suiker/, 5, 5, 30],
  [/noten|amandel|walnoot|walnoten|pinda|cashew|chia|lijnzaad|zaden|pitten|kokos/, 5, 5, 30],
  [/banaan|appel|peer|sinaasappel|kiwi|mandarijn|perzik/, 0, 1, 2, 120],
  [/bosvruchten|bessen|aardbei|frambo|druiven|mango|ananas|fruit/, 25, 50, 200],
  [/avocado/, 25, 25, 100],
]
type Regel = { stap: number; min: number; max: number }
function portieRegel(ing: any): Regel {
  const naam = String(ing.name || '').toLowerCase()
  const stuk = Number(ing.gram_per_eenheid) > 0 && /stuk|snee|plak|schep|wrap/.test(String(ing.eenheid || '')) ? Number(ing.gram_per_eenheid) : 0
  for (const [re, stap, min, max, stukStandaard] of PORTIE) {
    if (!re.test(naam)) continue
    if (stap === 0) { const g = stuk || stukStandaard || 50; return { stap: g, min: min * g, max: max * g } }
    return { stap, min, max }
  }
  if (ing.rol === 'groente') return { stap: 50, min: 50, max: 300 }
  if (stuk) return { stap: stuk, min: stuk, max: stuk * 4 }
  return { stap: 10, min: 10, max: 300 }
}

const macrosVan = (rijen: any[]) => {
  const som = (veld: string) => rijen.reduce((s, r) => s + (Number(r.ing[veld]) || 0) * r.gram / 100, 0)
  return { kcal: som('calories_per_100g'), eiwit: som('protein_per_100g'), koolh: som('carbs_per_100g'), vet: som('fat_per_100g') }
}

// Zoekt hele porties die zo dicht mogelijk bij het doel komen. Kleine stappen
// vanaf de hoeveelheden die de klant ongeveer noemde: één ingrediënt een stap
// op of af, of twee tegen elkaar in, zolang het beter wordt.
function schaal(rijen: any[], doelKcal: number, doelEiwit: number) {
  const fout = () => {
    const m = macrosVan(rijen)
    const dk = (m.kcal - doelKcal) / doelKcal
    const dp = (m.eiwit - doelEiwit) / Math.max(doelEiwit, 1)
    // Te weinig eiwit telt zwaarder dan te veel; ver van de start afwijken een beetje.
    const afstand = rijen.reduce((s, r) => s + Math.abs(r.gram - r.start) / Math.max(r.start, 1), 0) / rijen.length
    return dk * dk + (dp < 0 ? dp * dp * 1.5 : dp * dp * 0.4) + afstand * 0.002
  }
  const vrij = rijen.map((r, i) => (r.vast ? -1 : i)).filter(i => i >= 0)
  const zet = (i: number, d: number) => {
    const r = rijen[i], g = r.gram + d * r.regel.stap
    if (g < r.regel.min - 0.01 || g > r.regel.max + 0.01) return false
    r.gram = g; return true
  }
  let beste = fout()
  for (let ronde = 0; ronde < 300; ronde++) {
    let stap: null | (() => void) = null, score = beste
    const probeer = (doe: () => boolean, terug: () => void, weer: () => void) => {
      if (!doe()) return
      const f = fout(); terug()
      if (f < score - 1e-9) { score = f; stap = weer }
    }
    for (const i of vrij) for (const d of [1, -1]) {
      probeer(() => zet(i, d), () => { zet(i, -d) }, () => { zet(i, d) })
      for (const j of vrij) if (j !== i) for (const e of [1, -1]) {
        probeer(() => { if (!zet(i, d)) return false; if (!zet(j, e)) { zet(i, -d); return false } return true },
          () => { zet(j, -e); zet(i, -d) }, () => { zet(i, d); zet(j, e) })
      }
    }
    if (!stap) break
    ;(stap as () => void)(); beste = score
  }
  return macrosVan(rijen)
}

const hoeveel = (r: any) => {
  const e = String(r.ing.eenheid || ''), g = Number(r.ing.gram_per_eenheid) || 0
  if (g > 0 && /stuk|snee|plak|schep|wrap/.test(e) && Math.abs(r.gram / g - Math.round(r.gram / g * 2) / 2) < 0.02) {
    const n = Math.round(r.gram / g * 2) / 2
    return `${String(n).replace('.', ',')} ${e === 'stuk' && n !== 1 ? 'stuks' : e}`
  }
  if (/brood|boterham/.test(String(r.ing.name || '').toLowerCase()) && r.gram % 35 === 0) return `${r.gram / 35} ${r.gram === 35 ? 'snee' : 'sneetjes'}`
  return `${Math.round(r.gram)} g`
}

// ── AI ──────────────────────────────────────────────────────────────────────
async function vraag(systeem: string, inhoud: string, schema: any, effort: string) {
  const ai = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! })
  const basis = { model: MODEL, max_tokens: 6000, output_config: { effort, format: { type: 'json_schema', schema } }, system: systeem, messages: [{ role: 'user', content: inhoud }] }
  let res: any
  try {
    res = await ai.beta.messages.create({ ...basis, betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' } as any)
  } catch (e) {
    if (!(e instanceof Anthropic.BadRequestError)) throw e
    res = await ai.messages.create(basis as any)
  }
  if (res.stop_reason === 'refusal') throw new Error('AI weigerde het verzoek')
  const tekst = (res.content as any[]).find(b => b.type === 'text')?.text
  if (!tekst) throw new Error(`Geen antwoord van de AI (stop: ${res.stop_reason})`)
  return { uit: JSON.parse(tekst), usage: res.usage }
}

const SCHEMA_LEES = {
  type: 'object', additionalProperties: false, required: ['maaltijden', 'niet_overgenomen'],
  properties: {
    maaltijden: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false, required: ['moment', 'naam', 'soort', 'citaat', 'ingredienten', 'bereiding'],
        properties: {
          moment: { type: 'string', enum: ['ontbijt', 'lunch', 'diner', 'snack', 'extra'] },
          naam: { type: 'string', description: 'Korte gerechtnaam, zoals "Kwark met muesli en honing".' },
          soort: { type: 'string', enum: ['eigen_goed', 'uitdrukkelijke_wens'] },
          citaat: { type: 'string', description: 'De woorden van de klant waar dit op gebaseerd is.' },
          ingredienten: {
            type: 'array',
            items: {
              type: 'object', additionalProperties: false, required: ['naam', 'zoek', 'rol', 'gram', 'toegevoegd', 'was'],
              properties: {
                naam: { type: 'string' },
                zoek: { type: 'string', description: 'Eén of twee kale zoekwoorden voor de ingrediëntenlijst, zoals "magere kwark", "havermout", "whey".' },
                rol: { type: 'string', enum: ['eiwit', 'koolhydraat', 'vet', 'groente', 'fruit', 'smaak'] },
                gram: { type: 'number', description: 'Normale portie in gram (rauw gewogen) als startpunt.' },
                toegevoegd: { type: 'boolean', description: 'true als de klant dit niet noemde en jij het toevoegt om aan eiwit te komen.' },
                was: { type: ['string', 'null'], description: 'Alleen als je wat de klant noemde vervangt door een betere variant of invult wat hij algemeen liet: wat de klant schreef ("wit brood", "kaas", "vlees"). Anders null.' },
              },
            },
          },
          bereiding: { type: 'array', items: { type: 'string' }, description: 'Twee of drie korte stappen.' },
        },
      },
    },
    niet_overgenomen: {
      type: 'array',
      items: { type: 'object', additionalProperties: false, required: ['moment', 'reden'], properties: { moment: { type: 'string' }, reden: { type: 'string' } } },
    },
  },
}
const SYSTEEM_LEES = `Een fitnesscoach zet na de intake een conceptvoedingsplan klaar. Jij leest wat de klant schreef over wat hij nu eet en haalt daar maaltijden uit die in het plan kunnen, zodat het plan persoonlijk voelt.

Per moment (ontbijt, lunch, diner, snack) hooguit één maaltijd, en alleen als hij aan één van deze twee voldoet:

1. eigen_goed: de klant beschrijft een concrete maaltijd met herkenbare ingrediënten, en het is een goede basis: er zit een eiwitbron in of die past er logisch bij, en met normale porties is hij naar een macrodoel te schalen. Voorbeelden: "magere kwark, chiazaad, muesli en beetje honing", "overnight oats met whey, melk en honing", "wrap met cottage cheese, kip, rucola en ei", "rijst met kip en groente".
2. uitdrukkelijke_wens: de klant zegt met nadruk dat hij iets wil houden ("ik wil echt mijn broodje pindakaas", "mijn cappuccino in de ochtend lever ik niet in"). Dan nemen we het over, ook als het geen ideale maaltijd is. Iets kleins dat geen maaltijd vervangt (een cappuccino) krijgt moment "extra".

Niet overnemen, met een korte reden in niet_overgenomen:
- Vaag of wisselend: "wisselend", "pasta of rijst", een rij opties zonder één duidelijke maaltijd, "wat de pot schaft".
- Matige keuzes zonder uitdrukkelijke wens: brood met pindakaas, kaas of chocopasta, koekjes, chips, afhaal, pizza. Die zijn lastig in een plan te plaatsen.
- Alles wat botst met wat de klant niet lust of niet mag.
De aangevinkte standaardopties achter de eigen tekst (losse trefwoorden als "Brood met kaas, Pindakaas, Kwark met fruit") zijn geen beschrijving van een maaltijd; lees ze alleen als voorkeur. Noemt de klant in zijn eigen tekst een tweede optie die wel goed is ("soms kwark met muesli"), dan mag je die nemen.

Een herkenbare maaltijd die net niet goed genoeg is, neem je wél over in een betere versie. De klant moet zijn eigen maaltijd erin herkennen. Voorbeeld: "3 eitjes op wit brood met kaas en tomaat" wordt volkoren brood met ei, 30+ kaas, kipfilet en tomaat. Dat is iets anders dan brood met alleen pindakaas of chocopasta: daar blijft na verbeteren niets van de maaltijd over, dus die neem je niet over.
Ook een algemeen genoemde maaltijd met een duidelijke vorm neem je over, en je vult hem in met gewone keuzes: "aardappelen, groente en vlees" wordt aardappelen met kipfilet of mager rundvlees en een gewone groente (broccoli, sperziebonen), tenzij de klant zelf iets specifieks noemt of iets niet lust. Een rij verschillende gerechten ("pasta of rijst, soms pizza") blijft vaag.

Ingrediënten:
- Neem wat de klant noemt, in de betere variant waar die bestaat: wit brood wordt volkoren, volvette kaas wordt 30+, volle zuivel wordt mager of halfvol, vet vlees wordt mager, frisdrank en sauzen laat je weg. Zet dan in "was" wat de klant schreef. Vul je iets algemeens in ("vlees" wordt kipfilet), zet dan ook in "was" wat hij schreef.
- Voeg hooguit één eiwitbron toe (toegevoegd: true) als de maaltijd anders duidelijk te weinig eiwit heeft voor zijn moment: whey of magere kwark bij zuivel en havermout, kipfilet of ei bij brood, wrap en salade. Bij een uitdrukkelijke wens verander je niets en voeg je niets toe.
- Hooguit zes ingrediënten. Smaakmakers in een vaste kleine hoeveelheid krijgen rol "smaak" (honing, kaneel, saus); die worden niet geschaald.
- Hoeveelheden rauw gewogen, als normale portie. Het exacte schalen doet het systeem daarna.
- Gebruik gewone productnamen zonder merk.

Lever liever minder maaltijden dan een twijfelachtige. Schrijf gewoon Nederlands.`

const SCHEMA_KIES = {
  type: 'object', additionalProperties: false, required: ['keuzes'],
  properties: {
    keuzes: {
      type: 'array',
      items: { type: 'object', additionalProperties: false, required: ['nr', 'id'], properties: { nr: { type: 'integer' }, id: { type: ['string', 'null'] } } },
    },
  },
}
const SYSTEEM_KIES = `Je koppelt ingrediënten van een maaltijd aan producten uit een ingrediëntenlijst. Per ingrediënt krijg je kandidaten. Kies het id van de kandidaat die het gewone product het best weergeeft, of null als er geen goede tussen zit.

- Kies het kale basisproduct zonder merk waar dat kan (bron "coach" gaat voor), niet een samengesteld product of een smaakvariant die de klant niet noemde.
- Rauw of ongekookt gaat voor gekookt of bereid (rijst, pasta, havermout, kip worden rauw gewogen).
- De voedingswaarden moeten bij het product passen: whey heeft rond 380 kcal en 75 g eiwit per 100 g, magere kwark rond 55 kcal en 9 g eiwit. Een kandidaat met onmogelijke waarden kies je niet.
- Bij twijfel tussen twee goede: de eerste in de lijst.`

async function kandidaten(sb: SupabaseClient, zoek: string) {
  const { data } = await sb.rpc('zoek_ingredienten', { p_q: zoek, p_client: null, p_limit: 8 })
  return (data || []).filter((k: any) => Number(k.calories_per_100g) > 0)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...CORS, 'Content-Type': 'application/json' } })
  try {
    // proef: { ontbijt, lunch, diner, snack } met eigen tekst. Rekent alles door tegen het concept van de klant, maar schrijft niets weg (alleen coach of testsleutel).
    const { client_id, opnieuw, proef } = await req.json()
    if (!client_id) return json({ error: 'client_id is nodig' }, 400)
    const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    const jwt = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '')
    const { data: gebruiker } = jwt ? await sb.auth.getUser(jwt).then((x: any) => x, () => ({ data: null })) : { data: null as any }
    const uid = gebruiker?.user?.id
    const testsleutel = req.headers.get('x-testsleutel')
    const isTest = !!testsleutel && !!(await sb.rpc('plan_bouwer_test_ok', { p_sleutel: testsleutel })).data
    const isCoach = isTest || (!!uid && !!(await sb.from('clients').select('id').eq('id', client_id).or(`coach_id.eq.${uid},trainer_id.eq.${uid}`).maybeSingle()).data)

    const { data: plannen } = await sb.from('client_meal_plans').select('id, template_name, week_structure, generation_settings')
      .eq('client_id', client_id).eq('is_active', false).eq('generation_settings->>status', 'concept')
      .order('created_at', { ascending: false }).limit(1)
    const plan = plannen?.[0]
    if (!plan) return json({ ok: true, overgeslagen: 'geen concept gevonden' })
    const gs = plan.generation_settings || {}
    const al = gs.eigen_maaltijden
    if (!isCoach) {
      const gemaakt = new Date(gs.brief?.gemaakt || 0).getTime()
      if (al || !(Date.now() - gemaakt < 15 * 60_000)) return json({ error: 'niet toegestaan' }, 403)
    }
    const ws = structuredClone(plan.week_structure || {})
    const dagen = DAGEN.filter(k => ws[k] && typeof ws[k] === 'object')
    const maaltijdenVan = (dag: any) => Object.entries(dag).filter(([s, m]: any) => s !== 'totals' && m && typeof m === 'object' && m.name) as [string, any][]
    const heeftEigen = dagen.some(k => maaltijdenVan(ws[k]).some(([, m]) => m.bron === BRON))
    const droog = !!proef && typeof proef === 'object' && isCoach
    if (!droog && al && (!opnieuw || heeftEigen)) return json({ ok: true, overgeslagen: heeftEigen ? 'eigen maaltijden staan er al in; maak het concept eerst opnieuw' : 'al verwerkt', eigen_maaltijden: al })

    const { data: np } = await sb.from('nutrition_preferences').select('current_habits, wishes, wat_werkt_goed, allergens')
      .eq('client_id', client_id).order('updated_at', { ascending: false, nullsFirst: false }).limit(1).maybeSingle()
    const ch = np?.current_habits || {}
    const teksten: Record<string, string> = {}
    for (const m of ['ontbijt', 'lunch', 'diner', 'snack']) {
      const t = [ch[m], ch.per_moment?.[m]?.werkt_goed ? `(werkt goed omdat: ${ch.per_moment[m].werkt_goed})` : ''].filter(Boolean).join(' ').trim()
      if (t) teksten[m] = t.slice(0, 900)
    }
    if (droog) { for (const m of Object.keys(teksten)) delete teksten[m]; for (const m of ['ontbijt', 'lunch', 'diner', 'snack']) if (proef[m]) teksten[m] = String(proef[m]).slice(0, 900) }
    const klaar = async (eigen: any, extraBrief: { keuzes?: string[]; nakijken?: string[] } = {}, wsNieuw: any = null, gem: any = {}) => {
      if (droog) return
      const brief = { ...(gs.brief || {}) }
      brief.keuzes = [...(extraBrief.keuzes || []), ...(brief.keuzes || [])]
      // De standaardregel "nog niet aangepast op wat de klant eet" klopt niet meer zodra er iets is overgenomen.
      const oud = (brief.nakijken || []).filter((t: string) => !(Number(eigen?.overgenomen) > 0 && /nog niet aangepast op wat de klant nu eet/i.test(String(t))))
      brief.nakijken = [...(extraBrief.nakijken || []), ...oud]
      const { error } = await sb.from('client_meal_plans').update({
        ...(wsNieuw ? { week_structure: wsNieuw, ...gem } : {}),
        generation_settings: { ...gs, brief, eigen_maaltijden: eigen }, updated_at: new Date().toISOString(),
      }).eq('id', plan.id)
      if (error) throw error
    }
    if (!Object.keys(teksten).length) {
      await klaar({ op: new Date().toISOString(), overgenomen: 0, reden: 'niets ingevuld' })
      return json({ ok: true, overgenomen: 0, reden: 'de klant vulde niet in wat hij nu eet' })
    }

    // Per moment: welk gerecht staat er nu, op welke dagen, met welke macro's.
    const slotVoor = (moment: string) => {
      if (MOMENT_SLOT[moment]) return MOMENT_SLOT[moment]
      // Snack: het grootste snackmoment; de banaan van 94 kcal is geen maaltijd om te vervangen.
      const kans: Record<string, number> = {}
      for (const k of dagen) for (const [s, m] of maaltijdenVan(ws[k])) if (/snack/.test(s)) kans[s] = Math.max(kans[s] || 0, Number(m.calories) || 0)
      const beste = Object.entries(kans).sort((a, b) => b[1] - a[1])[0]
      return beste && beste[1] >= 150 ? beste[0] : null
    }
    const doelVoor = (slot: string) => {
      const telling = new Map<string, { m: any; dagen: string[] }>()
      for (const k of dagen) { const m = ws[k][slot]; if (m?.name) { const r = telling.get(m.name) || { m, dagen: [] }; r.dagen.push(k); telling.set(m.name, r) } }
      return [...telling.values()].sort((a, b) => b.dagen.length - a.dagen.length)[0] || null
    }
    const planVoorAI: Record<string, any> = {}
    for (const m of ['ontbijt', 'lunch', 'diner', 'snack']) {
      const slot = slotVoor(m); const d = slot ? doelVoor(slot) : null
      planVoorAI[m] = d ? { staat_nu: d.m.name, kcal: Math.round(d.m.calories), eiwit: Math.round(d.m.protein) } : 'geen moment in dit plan'
    }
    const w = np?.wishes || {}, a = np?.allergens || {}
    const nietLusten = [w.absoluut_niet, ...(Array.isArray(w.niet_lekker) ? w.niet_lekker : []), w.niet_lekker_overig, a.selected_allergens, a.custom_allergens, a.intolerances, a.diet_preference]
      .flat().filter(Boolean).map(String).join(', ').slice(0, 500)

    const lees = await vraag(SYSTEEM_LEES,
      `Wat de klant nu eet, per moment (eigen tekst, daarachter soms aangevinkte standaardopties):\n${JSON.stringify(teksten, null, 1)}\n\nLust of mag hij niet: ${nietLusten || 'niets opgegeven'}\n\nWat er nu in het concept staat per moment (de eigen maaltijd wordt naar deze kcal en eiwit geschaald):\n${JSON.stringify(planVoorAI, null, 1)}`,
      SCHEMA_LEES, 'medium')
    const gelezen: any[] = (lees.uit.maaltijden || []).slice(0, 5)
    const nietOver: string[] = (lees.uit.niet_overgenomen || []).map((x: any) => `${MOMENT_NL[x.moment] || x.moment}: ${x.reden}`)

    // Ingrediënten koppelen.
    const vlak: any[] = []
    for (const [mi, m] of gelezen.entries()) for (const [ii, ing] of (m.ingredienten || []).slice(0, 6).entries()) vlak.push({ nr: vlak.length, mi, ii, ing, kand: [] as any[] })
    await Promise.all(vlak.map(async v => { v.kand = await kandidaten(sb, v.ing.zoek || v.ing.naam) }))
    let kiesUsage: any = null
    if (vlak.some(v => v.kand.length)) {
      const kies = await vraag(SYSTEEM_KIES, JSON.stringify(vlak.map(v => ({
        nr: v.nr, maaltijd: gelezen[v.mi].naam, ingredient: v.ing.naam,
        kandidaten: v.kand.map((k: any) => ({ id: k.id, naam: k.name, merk: k.brand || null, bron: k.source, bereiding: k.bereiding || null, kcal: Number(k.calories_per_100g), eiwit: Number(k.protein_per_100g), koolh: Number(k.carbs_per_100g), vet: Number(k.fat_per_100g) })),
      }))), SCHEMA_KIES, 'low')
      kiesUsage = kies.usage
      for (const k of kies.uit.keuzes || []) { const v = vlak[k.nr]; if (v && k.id) v.gekozen = v.kand.find((x: any) => x.id === k.id) || null }
    }

    const mv = gs.macro_voorstel || {}
    const keuzes: string[] = [], nakijken: string[] = [], geplaatst: any[] = []
    // Eerdere eigen maaltijden uit een vorig concept niet meer tonen.
    if (!droog) await sb.from('ai_custom_meals').update({ is_active: false }).eq('client_id', client_id).eq('personal_notes', BRON)

    for (const [mi, m] of gelezen.entries()) {
      const label = MOMENT_NL[m.moment] || m.moment
      const delen = vlak.filter(v => v.mi === mi)
      const mist = delen.filter(v => !v.gekozen).map(v => v.ing.naam)
      if (!delen.length || mist.length) { nakijken.push(`${label}: "${m.naam}" uit de intake niet overgenomen; niet in de ingrediëntenlijst gevonden: ${mist.join(', ') || 'geen ingrediënten'}.`); continue }
      const rijen = delen.map(v => {
        const ing = { ...v.gekozen, rol: v.ing.rol }
        const regel = portieRegel(ing)
        const vast = v.ing.rol === 'smaak' || m.moment === 'extra'
        const start = vast ? Math.max(1, Math.round(Number(v.ing.gram) || regel.min))
          : Math.min(regel.max, Math.max(regel.min, Math.round((Number(v.ing.gram) || regel.min) / regel.stap) * regel.stap))
        return { ing, regel, vast, start, gram: start, toegevoegd: !!v.ing.toegevoegd, was: v.ing.was ? String(v.ing.was).trim() : null, naam: v.gekozen.name }
      })

      let slot: string | null = null, doel: any = null, opDagen: string[] = dagen
      if (m.moment !== 'extra') {
        slot = slotVoor(m.moment); doel = slot ? doelVoor(slot) : null
        if (!slot || !doel) { nakijken.push(`${label}: "${m.naam}" uit de intake niet overgenomen; dit plan heeft daar geen moment voor.`); continue }
        if (geplaatst.some(g => g.slot === slot)) continue
        opDagen = doel.dagen
      }
      const mac = doel ? schaal(rijen, Number(doel.m.calories), Number(doel.m.protein)) : macrosVan(rijen)

      const wens = m.soort === 'uitdrukkelijke_wens'
      if (doel) {
        const K = Number(doel.m.calories), P = Number(doel.m.protein)
        const kcalOk = Math.abs(mac.kcal - K) <= K * KCAL_MARGE
        const dagEiwit = Math.min(...opDagen.map(k => maaltijdenVan(ws[k]).reduce((s, [sl, x]) => s + (sl === slot ? mac.eiwit : Number(x.protein) || 0), 0)))
        const eiwitOk = mac.eiwit >= P - EIWIT_MARGE || (Number(mv.target_protein) > 0 && dagEiwit >= Number(mv.target_protein) * DAG_EIWIT)
        if (!wens && (!kcalOk || !eiwitOk)) {
          nakijken.push(`${label}: "${m.naam}" uit de intake niet overgenomen. Met normale porties komt hij op ${Math.round(mac.kcal)} kcal en ${Math.round(mac.eiwit)} g eiwit; nodig is ${Math.round(K)} kcal en ${Math.round(P)} g eiwit.`)
          continue
        }
        if (wens && (!kcalOk || !eiwitOk)) nakijken.push(`${label}: "${m.naam}" staat erin omdat de klant dit uitdrukkelijk wil, maar komt op ${Math.round(mac.kcal)} kcal en ${Math.round(mac.eiwit)} g eiwit waar ${Math.round(K)} kcal en ${Math.round(P)} g eiwit stond.`)
      }

      const lijst = rijen.map(r => ({
        id: r.ing.id, ingredient_id: r.ing.id, name: r.ing.name, brand: r.ing.brand || null, unit: 'gram', amount: Math.round(r.gram),
        calories: Math.round(r.ing.calories_per_100g * r.gram / 100), protein: r1(r.ing.protein_per_100g * r.gram / 100),
        carbs: r1(r.ing.carbs_per_100g * r.gram / 100), fat: r1(r.ing.fat_per_100g * r.gram / 100),
      }))
      const foto = [...rijen].sort((x, y) => y.ing.calories_per_100g * y.gram - x.ing.calories_per_100g * x.gram).map(r => r.ing.image_url).find(Boolean) || null
      const sectie = m.moment === 'extra' ? 'snack' : m.moment
      const { data: nieuw, error: ce } = droog ? { data: { id: crypto.randomUUID() }, error: null } : await sb.from('ai_custom_meals').insert({
        client_id, name: m.naam, calories: Math.round(mac.kcal), protein: r1(mac.eiwit), carbs: r1(mac.koolh), fat: r1(mac.vet),
        ingredients_list: lijst, preparation_steps: (m.bereiding || []).slice(0, 4), serving_size: 1, is_active: true,
        image_url: foto, section: sectie, personal_notes: BRON,
      }).select('id').single()
      if (ce) throw ce

      let extraSlot = slot
      if (!extraSlot) extraSlot = ['snack2', 'snack3', 'snack4'].find(s => dagen.every(k => !ws[k][s])) || 'snack4'
      for (const k of opDagen) {
        const oud = slot ? ws[k][slot] : null
        ws[k][extraSlot] = {
          id: nieuw.id, meal_id: nieuw.id, name: m.naam, meal_name: m.naam, slot: extraSlot,
          timing: oud?.timing || (m.moment === 'extra' ? '10:00' : null), display_label: oud?.display_label || label,
          calories: Math.round(mac.kcal), protein: r1(mac.eiwit), carbs: r1(mac.koolh), fat: r1(mac.vet),
          ingredients_list: lijst, preparation_steps: (m.bereiding || []).slice(0, 4), image_url: foto,
          serving_size: 1, scalable: true, is_custom: true, bron: BRON, labels: [BRON], vervangt: oud?.name || null,
        }
      }
      const porties = rijen.map(r => `${hoeveel(r)} ${r.naam.toLowerCase()}`).join(', ')
      const erbij = rijen.filter(r => r.toegevoegd).map(r => r.naam.toLowerCase())
      const beter = rijen.filter(r => r.was && !r.toegevoegd).map(r => `${r.was} werd ${r.naam.toLowerCase()}`)
      const waar = opDagen.length === dagen.length ? 'elke dag' : `${opDagen.length} dagen`
      keuzes.push(`${label} uit de intake${wens ? ' (uitdrukkelijke wens)' : ''}: ${m.naam}, ${waar}${doel ? `, in plaats van ${doel.m.name}` : ''}. ${porties}: ${Math.round(mac.kcal)} kcal, ${Math.round(mac.eiwit)} g eiwit${doel ? ` (was ${Math.round(doel.m.calories)} kcal, ${Math.round(doel.m.protein)} g)` : ''}.${erbij.length ? ` Toegevoegd voor het eiwit: ${erbij.join(', ')}.` : ''}${beter.length ? ` Aangepast: ${beter.join(', ')}.` : ''} De klant schreef: "${String(m.citaat).slice(0, 140)}".`)
      if (m.moment === 'extra') nakijken.push(`Extra uit de intake toegevoegd: ${m.naam} (${Math.round(mac.kcal)} kcal per dag). Dat komt bovenop het plan; haal het ergens anders weg als het dagtotaal te hoog wordt.`)
      geplaatst.push({ slot: extraSlot, moment: m.moment, naam: m.naam, kcal: Math.round(mac.kcal), eiwit: Math.round(mac.eiwit), dagen: opDagen.length, id: nieuw.id })
    }
    if (nietOver.length) keuzes.push(`Niet uit de intake overgenomen: ${nietOver.join(' · ')}`)

    // Dagtotalen en weekgemiddelde.
    let tk = 0, te = 0, tkh = 0, tv = 0, n = 0
    for (const k of dagen) {
      const ms = maaltijdenVan(ws[k]).map(([, x]) => x)
      const som = (f: string) => ms.reduce((s: number, x: any) => s + (Number(x[f]) || 0), 0)
      ws[k].totals = { kcal: Math.round(som('calories')), protein: r1(som('protein')), carbs: r1(som('carbs')), fat: r1(som('fat')) }
      tk += ws[k].totals.kcal; te += ws[k].totals.protein; tkh += ws[k].totals.carbs; tv += ws[k].totals.fat; n++
    }
    const gem = n ? { daily_calories: Math.round(tk / n), daily_protein: Math.round(te / n), daily_carbs: Math.round(tkh / n), daily_fat: Math.round(tv / n) } : {}
    await klaar({ op: new Date().toISOString(), overgenomen: geplaatst.length, maaltijden: geplaatst }, { keuzes, nakijken }, geplaatst.length ? ws : null, geplaatst.length ? gem : {})

    return json(isCoach ? { ok: true, ...(droog ? { proef: true } : {}), overgenomen: geplaatst, keuzes, nakijken, gelezen: gelezen.map(m => ({ moment: m.moment, naam: m.naam, soort: m.soort })), usage: [lees.usage, kiesUsage] } : { ok: true, overgenomen: geplaatst.length })
  } catch (e) {
    console.error('intake-maaltijden', e)
    return json({ error: String((e as any)?.message || e) }, 500)
  }
})
