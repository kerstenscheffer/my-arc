// supabase/functions/plan-bouwer/index.ts
//
// Bouwt na de intake automatisch een CONCEPT-voedingsplan. De coach keurt het
// goed in de Plan Analyzer; er gaat nooit iets automatisch naar de klant
// (is_active: false).
//
//   POST { client_id, dry_run?: boolean }
//   dry_run → geeft het plan + rapport terug zonder op te slaan.
//   anders  → 202 direct, bouwt op de achtergrond, slaat op + meldt de coach.
//
// Regels (docs/regels-voeding-rond-training.md, keuzes Kersten 10 nov 2026):
//   - Macro's = coach-berekening op clients (target_*). Eigen targets klant
//     alleen ter info.
//   - Elke dag dezelfde kcal. Op trainingsdagen schuiven koolhydraten naar
//     pre (C = eiwit) en post (C = 2,5x eiwit, grootste van de dag).
//   - Eiwit gelijk verdeeld over alle maaltijden (4-6 per dag).
//   - Maaltijdtijden uit de agenda (weekplanner): opstaan, slapen, training.
//   - Gerechten uit wat de klant zelf opgaf (wat eet je nu + vindt lekker),
//     aantal per maaltijd uit de variatiekeuze (vast 1 / afwisselen 2 /
//     variatie 7). AI kiest gerechten + zoektermen, NIET de grammen of
//     macro's: die komen uit onze eigen database (zoek_ingredienten) en een
//     rekenstap hieronder. Altijd rauwe/ongekookte producten.
//
// Sleutels: ANTHROPIC_API_KEY + SUPABASE_SERVICE_ROLE_KEY als secrets.

import Anthropic from 'npm:@anthropic-ai/sdk@1.2.0'
import { createClient, SupabaseClient } from 'npm:@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const MODEL = 'claude-opus-5-5'
const VERSIE = 'plan-bouwer-1'

const DAGEN = [
  { nl: 'ma', en: 'monday', En: 'Monday' }, { nl: 'di', en: 'tuesday', En: 'Tuesday' },
  { nl: 'wo', en: 'wednesday', En: 'Wednesday' }, { nl: 'do', en: 'thursday', En: 'Thursday' },
  { nl: 'vr', en: 'friday', En: 'Friday' }, { nl: 'za', en: 'saturday', En: 'Saturday' },
  { nl: 'zo', en: 'sunday', En: 'Sunday' },
]

// ── tijd ─────────────────────────────────────────────────────────────────────
const naarMin = (t: string | null | undefined, standaard: number) => {
  if (!t) return standaard
  const m = String(t).match(/^(\d{1,2}):(\d{2})/)
  return m ? Number(m[1]) * 60 + Number(m[2]) : standaard
}
const naarTijd = (min: number) => {
  const m = ((Math.round(min / 5) * 5) % 1440 + 1440) % 1440
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

// ── types ────────────────────────────────────────────────────────────────────
type Rol = 'eiwit' | 'koolhydraat' | 'vet' | 'vast'
type Moment = 'ontbijt' | 'lunch' | 'diner' | 'snack' | 'pre_workout' | 'post_workout'
type Macro = { p: number; c: number; f: number }
type Maaltijd = {
  slot: string; moment: Moment; tijd: number
  rol: 'pre' | 'post' | 'normaal'
  doel?: Macro
}
type Ingr = {
  id: string; naam: string; rol: Rol; g0: number
  p: number; c: number; f: number; kcal: number   // per gram
  stuk?: number                                     // gram per stuk (eieren e.d.)
}

// ── 1. Dagindeling uit de agenda ─────────────────────────────────────────────
function dagIndeling(dagNl: string, opts: {
  ws: any; trainingsdag: boolean; trainStartStd: number; trainDuur: number; momenten: Set<string>; minMaaltijden?: number
}) {
  const blokken: any[] = Array.isArray(opts.ws?.[dagNl]) ? opts.ws[dagNl] : []
  const slaap = blokken.find(b => b?.type === 'slaap')
  const wakker = naarMin(slaap?.end, 7 * 60)
  const bed = naarMin(slaap?.start, 23 * 60)
  const bedAbs = bed <= wakker ? bed + 1440 : bed

  const train = blokken.find(b => b?.type === 'training')
  const tStart = opts.trainingsdag ? naarMin(train?.start, opts.trainStartStd) : null
  const tEind = tStart != null ? (train?.end ? naarMin(train.end, tStart + opts.trainDuur) : tStart + opts.trainDuur) : null

  // Standaard maaltijden op gewone tijden, binnen wakker-zijn.
  const m: Maaltijd[] = []
  const zet = (slot: string, moment: Moment, tijd: number) => {
    const t = Math.min(Math.max(tijd, wakker + 30), bedAbs - 60)
    m.push({ slot, moment, tijd: t, rol: 'normaal' })
  }
  if (opts.momenten.has('ontbijt')) zet('breakfast', 'ontbijt', wakker + 30)
  if (opts.momenten.has('lunch')) zet('lunch', 'lunch', 12 * 60 + 30)
  if (opts.momenten.has('snack')) zet('snack1', 'snack', 15 * 60 + 30)
  if (opts.momenten.has('diner')) zet('dinner', 'diner', 18 * 60 + 30)
  // Minstens 4 eiwitmaaltijden: avondsnack erbij als het past.
  if (m.length < 4 && opts.momenten.has('snack') && bedAbs - 90 > 20 * 60) zet('snack2', 'snack', 21 * 60)
  if (m.length < 4) zet('snack2', 'snack', Math.min(21 * 60, bedAbs - 90))
  // Veel eiwit (hoge doelen): extra eiwitmomenten zodat een maaltijd niet
  // boven ~45 g eiwit uitkomt (geen 500 g kwark in één keer). Alleen waar
  // het past: binnen wakker-zijn en minstens 2 uur van andere maaltijden.
  const extra = [10 * 60 + 30, 21 * 60, 17 * 60]
  for (const t of extra) {
    if (m.length >= (opts.minMaaltijden || 4) || !opts.momenten.has('snack')) break
    const vrijSlot = ['snack2', 'snack3', 'snack4'].find(s => !m.some(x => x.slot === s))
    if (!vrijSlot || t < wakker + 120 || t > bedAbs - 60) continue
    if (m.some(x => Math.abs(x.tijd - t) < 120)) continue
    zet(vrijSlot, 'snack', t)
  }

  if (tStart != null && tEind != null) {
    // Pre: een gewone maaltijd 0-3 uur voor de training wordt de pre-workout.
    // Anders een losse pre-workout 90 min vooraf, mits je dan al wakker bent.
    const preTijd = Math.max(tStart - 90, wakker + 15)
    const kandidaat = m.filter(x => x.tijd < tStart && x.tijd >= tStart - 180).sort((a, b) => b.tijd - a.tijd)[0]
    if (kandidaat) { kandidaat.rol = 'pre'; kandidaat.tijd = preTijd }
    else if (tStart - 75 >= wakker + 15) m.push({ slot: 'pre_workout', moment: 'pre_workout', tijd: preTijd, rol: 'pre' })

    // Maaltijden die midden in de training vallen schuiven naar erna.
    const postTijd = tEind + 30
    for (const x of m) if (x.rol === 'normaal' && x.tijd >= tStart && x.tijd < postTijd) x.tijd = postTijd
    // Post: eerste maaltijd binnen 75 min na de training, anders een losse.
    const na = m.filter(x => x.rol === 'normaal' && x.tijd >= postTijd).sort((a, b) => a.tijd - b.tijd)
    if (na[0] && na[0].tijd <= tEind + 75) { na[0].rol = 'post'; na[0].tijd = postTijd }
    else if (postTijd < bedAbs - 60) {
      const vrij = ['snack3', 'snack4', 'snack5', 'snack6', 'snack2'].find(s => !m.some(x => x.slot === s))!
      m.push({ slot: vrij, moment: 'post_workout', tijd: postTijd, rol: 'post' })
    }
    // Volgende maaltijd minstens 2,5 uur na de post (post-post), als het past.
    const post = m.find(x => x.rol === 'post')
    if (post) {
      const volgende = m.filter(x => x !== post && x.tijd > post.tijd).sort((a, b) => a.tijd - b.tijd)[0]
      if (volgende && volgende.tijd - post.tijd < 150) volgende.tijd = Math.min(post.tijd + 150, bedAbs - 60)
    }
  }
  m.sort((a, b) => a.tijd - b.tijd)
  return { maaltijden: m.slice(0, 6), wakker, bed, tStart, tEind }
}

// ── 2. Macro's per maaltijd ──────────────────────────────────────────────────
function verdeelMacros(m: Maaltijd[], dag: Macro) {
  const n = m.length
  const P = dag.p / n
  const pre = m.find(x => x.rol === 'pre'), post = m.find(x => x.rol === 'post')
  let preC = pre ? P : 0, postC = post ? 2.5 * P : 0
  const preF = pre ? 0.35 * P : 0, postF = post ? 0.3 * P : 0
  const rest = m.filter(x => x.rol === 'normaal')
  const minC = 0.5 * P
  // Genoeg koolhydraten overlaten voor de andere maaltijden.
  const over = () => (dag.c - preC - postC) / Math.max(rest.length, 1)
  if (rest.length && over() < minC) postC = Math.max(1.5 * P, dag.c - preC - minC * rest.length)
  if (rest.length && over() < minC) preC = Math.max(0.7 * P, dag.c - postC - minC * rest.length)
  const restC = rest.length ? Math.max(0, over()) : 0
  const restF = rest.length ? Math.max(0, (dag.f - preF - postF) / rest.length) : 0
  for (const x of m) {
    x.doel = x.rol === 'pre' ? { p: P, c: preC, f: preF }
      : x.rol === 'post' ? { p: P, c: postC, f: postF }
      : { p: P, c: restC, f: restF }
  }
  // Geen rest-maaltijden (alles pre/post): koolhydraten/vet in verhouding passend maken.
  if (!rest.length) {
    const sc = dag.c / m.reduce((s, x) => s + x.doel!.c, 0) || 1
    const sf = dag.f / m.reduce((s, x) => s + x.doel!.f, 0) || 1
    for (const x of m) { x.doel!.c *= sc; x.doel!.f *= sf }
  }
}

// ── 3. Grammen rekenen (begrensde kleinste kwadraten) ────────────────────────
// Fout in kcal-eenheden (eiwit en koolh x4, vet x9) zodat elke macro eerlijk
// meeweegt, plus een klein duwtje terug naar de AI-portie zodat een gerecht
// herkenbaar blijft (geen 400 g muesli met 10 g kwark).
function rekenGrammen(ingr: Ingr[], doel: Macro) {
  const vast = ingr.filter(i => i.rol === 'vast')
  const vrij = ingr.filter(i => i.rol !== 'vast')
  const basis = vast.reduce((s, i) => ({ p: s.p + i.p * i.g0, c: s.c + i.c * i.g0, f: s.f + i.f * i.g0 }), { p: 0, c: 0, f: 0 })
  const T = { p: doel.p - basis.p, c: doel.c - basis.c, f: doel.f - basis.f }
  const g = vrij.map(i => i.g0)
  // Ondergrens: een koolhydraatbron onder ~40% van een normale portie wordt
  // een raar bord (11 g rijst); vet mag klein (olie).
  const lo = vrij.map(i => Math.max(i.rol === 'vet' ? 2 : 5, (i.rol === 'koolhydraat' ? 0.4 : 0.2) * i.g0))
  // Bovengrens: hooguit 2,5x een normale portie, en een harde grens per rol
  // (geen 1 liter amandeldrink of 500 g tofu in één maaltijd).
  const MAX = { eiwit: 350, koolhydraat: 250, vet: 40, vast: 9999 } as Record<Rol, number>
  const hi = vrij.map(i => Math.max(i.g0, Math.min(2.5 * i.g0, MAX[i.rol])))
  // Coördinaat-afdaling met exacte stap per ingrediënt: snel en stabiel,
  // ook als een ingrediënt maar een paar gram is (olie).
  // Eiwit telt het zwaarst (regels: eiwit per maaltijd is de basis), dan vet, dan koolh.
  const w = { p: 64, c: 16, f: 81 }
  const lam = 0.5   // trek naar de AI-portie, in kcal²-eenheden per (relatieve afwijking)²
  for (let ronde = 0; ronde < 400; ronde++) {
    for (let k = 0; k < vrij.length; k++) {
      const i = vrij[k]
      let P = 0, C = 0, F = 0
      vrij.forEach((j, m) => { if (m !== k) { P += j.p * g[m]; C += j.c * g[m]; F += j.f * g[m] } })
      const rP = T.p - P, rC = T.c - C, rF = T.f - F
      const r2 = lam / (i.g0 * i.g0)
      const teller = w.p * i.p * rP + w.c * i.c * rC + w.f * i.f * rF + r2 * i.g0
      const noemer = w.p * i.p * i.p + w.c * i.c * i.c + w.f * i.f * i.f + r2
      g[k] = Math.min(hi[k], Math.max(lo[k], teller / noemer))
    }
  }
  const uit = [...vast.map(i => ({ i, g: i.g0 })), ...vrij.map((i, k) => ({ i, g: g[k] }))].map(({ i, g }) => {
    // Afronden: stuks hele stuks, kleine hoeveelheden op 1 g, rest op 5 g.
    let gr = i.stuk ? Math.max(1, Math.round(g / i.stuk)) * i.stuk : g < 25 ? Math.round(g) : Math.round(g / 5) * 5
    gr = Math.max(gr, 1)
    return { i, g: gr }
  })
  const tot = uit.reduce((s, { i, g }) => ({
    kcal: s.kcal + i.kcal * g, p: s.p + i.p * g, c: s.c + i.c * g, f: s.f + i.f * g,
  }), { kcal: 0, p: 0, c: 0, f: 0 })
  return { regels: uit, tot }
}

// ── 4. Ingrediënten opzoeken in onze eigen database ──────────────────────────
const NIET_RAUW = ['gekookt', 'gebakken', 'gegrild', 'gestoomd', 'gefrituurd']
// Dieet en allergieën hard bewaken: de zoekfunctie kent die niet (bv.
// "plantaardig eiwitpoeder" gaf whey terug), en een allergie mag nooit
// alleen van de AI afhangen. Zoeken op stukjes woord, zodat samenstellingen
// als "rundergehakt" of "kipfilet" ook gevangen worden.
const VLEES = /(kip|kalkoen|rund|gehakt|varken|\bham\b|hamlap|\bspek|bacon|worst|salami|vlees|biefstuk|lams|eend|gelatine|chorizo|carpaccio)/i
const VARKEN = /(varken|\bham\b|hamlap|\bspek|bacon|salami|chorizo|worst|gelatine)/i
const VIS = /(zalm|tonijn|kabeljauw|\bvis\b|vissticks|makreel|haring|sardine|ansjovis|pangasius|tilapia|forel|koolvis)/i
const SCHAAL = /(garnal|kreeft|mossel|krab|scampi|inktvis|oester)/i
const ZUIVEL = /(melk|(?<!pinda)kaas|kwark|yoghurt|skyr|boter|room|whey|caseïne|caseine|hüttenkäse|huttenkase|mozzarella|feta|ricotta)/i
const EI = /(\bei\b|eieren|\beiwit\b(?!poeder)|omelet|roerei)/i
const PLANTAARDIG = /(soja|plantaardig|vegan|haver|amandel|kokos|erwt|rijstdrink|tofu|tempeh|lactosevrij)/i
const ALLERGEEN: Record<string, RegExp> = {
  lactose: ZUIVEL, ei: EI, vis: VIS, schaaldieren: SCHAAL,
  gluten: /(brood|\bpasta|tarwe|wrap|couscous|muesli|havermout|spelt|rogge|bulgur|noedel|crackers|beschuit|cracker|ontbijtkoek|croissant)/i,
  noten: /(amandel|walnoot|walnoten|cashew|hazelno|pecan|pistache|macadamia|\bnoten\b|notenpasta|paranoot)/i,
  pinda: /pinda/i,
  soja: /(soja|tofu|tempeh|edamame)/i,
}
type Klant = { dieet: string; allergenen: string[] }
function pastBijKlant(naam: string, k: Klant) {
  const d = String(k.dieet || '').toLowerCase()
  if (d === 'vegetarisch' && (VLEES.test(naam) || VIS.test(naam) || SCHAAL.test(naam))) return false
  if (d === 'pescotarisch' && VLEES.test(naam)) return false
  if (d === 'halal' && VARKEN.test(naam)) return false
  if (d === 'veganistisch' && (VLEES.test(naam) || VIS.test(naam) || SCHAAL.test(naam) || /honing/i.test(naam) ||
      ((ZUIVEL.test(naam) || EI.test(naam)) && !PLANTAARDIG.test(naam)))) return false
  for (const a of k.allergenen) {
    const re = ALLERGEEN[a]
    if (!re || !re.test(naam)) continue
    // "glutenvrij", "lactosevrij" e.d. mogen wel
    if (new RegExp(`${a}vrij|${a === 'lactose' ? 'lactosevrij' : a + 'vrij'}`, 'i').test(naam)) continue
    if (a === 'lactose' && PLANTAARDIG.test(naam)) continue
    return false
  }
  return true
}

async function zoekIngredient(sb: SupabaseClient, term: string, rol: Rol, clientId: string, cache: Map<string, any>, klant: Klant) {
  const sleutel = `${term.toLowerCase()}|${rol}`
  if (cache.has(sleutel)) return cache.get(sleutel)
  const { data } = await sb.rpc('zoek_ingredienten', { p_q: term, p_client: clientId, p_limit: 12 })
  let rijen: any[] = (data || []).filter((r: any) => Number(r.calories_per_100g) > 0 || /water|thee|koffie/i.test(r.name))
  // Altijd rauw/ongekookt wegen (Kersten): bereide varianten alleen als er niets anders is.
  const rauw = rijen.filter(r => !NIET_RAUW.includes(String(r.bereiding || '').toLowerCase()))
  if (rauw.length) rijen = rauw
  rijen = rijen.filter(r => pastBijKlant(r.name, klant))
  // Eigen coach-producten eerst, dan de zoekscore.
  rijen.sort((a, b) => (b.source === 'coach' ? 1 : 0) - (a.source === 'coach' ? 1 : 0) || Number(b.score) - Number(a.score))
  const r = rijen[0] || null
  cache.set(sleutel, r)
  return r
}

// ── 5. AI: gerechten kiezen uit wat de klant opgaf ───────────────────────────
const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['momenten', 'opmerkingen'],
  properties: {
    opmerkingen: { type: 'string' },
    momenten: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false, required: ['moment', 'gerechten'],
        properties: {
          moment: { type: 'string', enum: ['ontbijt', 'lunch', 'diner', 'snack', 'pre_workout', 'post_workout'] },
          gerechten: {
            type: 'array',
            items: {
              type: 'object', additionalProperties: false, required: ['naam', 'bron', 'ingredienten'],
              properties: {
                naam: { type: 'string' },
                bron: { type: 'string', enum: ['eet_nu', 'vindt_lekker', 'aanvulling'] },
                ingredienten: {
                  type: 'array',
                  items: {
                    type: 'object', additionalProperties: false, required: ['zoekterm', 'rol', 'gram'],
                    properties: {
                      zoekterm: { type: 'string' },
                      rol: { type: 'string', enum: ['eiwit', 'koolhydraat', 'vet', 'vast'] },
                      gram: { type: 'number' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
}

const SYSTEEM = `Je stelt gerechten samen voor een voedingsplan van een Nederlandse online fitnesscoach (MY ARC).
Je kiest gerechten en ingrediënten; de grammen en macro's rekent ons systeem daarna zelf uit met onze eigen productendatabase.

Regels:
- Bouw elk gerecht op wat de klant zelf opgaf: eerst wat hij nu eet ("eet_nu"), dan wat hij lekker vindt ("vindt_lekker"). Alleen als dat te weinig is mag je aanvullen met een gewoon Nederlands gerecht in dezelfde lijn ("aanvulling").
- Geef per moment precies het gevraagde aantal verschillende gerechten.
- Elk gerecht heeft minstens één eiwitbron (rol "eiwit") en één koolhydraatbron (rol "koolhydraat"), zodat we het kunnen schalen naar de macro's. Een vetbron (rol "vet") mag, bv. olijfolie of notenpasta. Groente, kruiden, sauzen en kleine vaste dingen krijgen rol "vast".
- Pre-workout: licht verteerbaar, weinig vet en vezels, koolhydraten ongeveer gelijk aan eiwit (bv. kwark met banaan, rijstwafels met kipfilet).
- Post-workout: veel koolhydraten (2 tot 3x het eiwit), snel verteerbaar mag, weinig vet.
- "zoekterm": een korte gewone Nederlandse productnaam zoals in een supermarkt-database, zonder merk en zonder bereiding (bv. "kipfilet", "rijst", "havermout", "magere kwark", "banaan", "olijfolie", "volkoren brood"). Vlees, vis, rijst en pasta wegen we altijd rauw/ongekookt.
- "gram": een normale portie als startpunt (wordt daarna geschaald).
- Houd je strikt aan allergieën, dieet en wat de klant niet lekker vindt.
- "opmerkingen": max 3 korte zinnen voor de coach (bv. wat je hebt aangevuld en waarom). Nederlands, geen gedachtestreepjes.`

// ── 6. Week opbouwen (puur: geen database, makkelijk lokaal te testen) ──────
type Gerecht = { naam: string; bron: string; ingr: Ingr[]; mist: string[] }
type Dag = { nl: string; en: string; idx: number; training: boolean; maaltijden: Maaltijd[] }
export function bouwWeek(dagen: Dag[], gerechten: Record<string, Gerecht[]>, dag: Macro) {
  const ICON: Record<string, string> = { pre: '🏋️', post: '💪' }
  const FUNCTIE: Record<string, string> = { pre: 'PRE-WORKOUT', post: 'POST-WORKOUT HERSTEL' }
  const week: Record<string, any> = {}
  const afwijkingen: string[] = []
  for (const d of dagen) {
    const dagObj: any = { is_training_day: d.training }
    const tot = { kcal: 0, protein: 0, carbs: 0, fat: 0 }
    const gekozen = d.maaltijden.map(m => {
      const lijst = gerechten[m.moment] || []
      return lijst.length ? { m, gerecht: lijst[d.idx % lijst.length] } : null
    })
    d.maaltijden.forEach((m, k) => { if (!gekozen[k]) afwijkingen.push(`${d.nl}: geen gerecht voor ${m.moment}`) })
    // Dagbalans: wat de dag te veel of te weinig heeft, verdelen over alle
    // maaltijden (naar verhouding van hun doel) en opnieuw rekenen. Een paar
    // rondes, want gerechten hebben ondergrenzen (een wrap, een appel).
    const doelen = gekozen.map(x => x ? { ...x.m.doel! } : null)
    let berekend = gekozen.map((x, k) => x ? rekenGrammen(x.gerecht.ingr, doelen[k]!) : null)
    for (let ronde = 0; ronde < 10; ronde++) {
      const som = berekend.reduce<Macro>((s, b) => b ? { p: s.p + b.tot.p, c: s.c + b.tot.c, f: s.f + b.tot.f } : s, { p: 0, c: 0, f: 0 })
      const fout = { p: dag.p - som.p, c: dag.c - som.c, f: dag.f - som.f }
      if (Math.abs(fout.p) < 3 && Math.abs(fout.c) < 5 && Math.abs(fout.f) < 2) break
      const somDoel = doelen.reduce<Macro>((s, t) => t ? { p: s.p + t.p, c: s.c + t.c, f: s.f + t.f } : s, { p: 0, c: 0, f: 0 })
      // Carb timing beschermen: een teveel aan koolhydraten gaat vooral van de
      // gewone maaltijden af, een tekort gaat vooral naar de post-workout. Zo
      // blijft de post-workout de grootste koolhydraatmaaltijd van de dag.
      const rolVan = (k: number) => gekozen[k]?.m.rol
      const cGewicht = doelen.map((t, k) => {
        if (!t) return 0
        // Dagtotaal gaat voor: pre/post schuiven ook mee, maar half zo hard.
        if (fout.c < 0) return rolVan(k) === 'normaal' ? t.c : 0.5 * t.c
        return rolVan(k) === 'post' ? 3 * t.c : t.c
      })
      let cSom = cGewicht.reduce((s, x) => s + x, 0)
      if (!cSom) { doelen.forEach((t, k) => { cGewicht[k] = t ? t.c : 0 }); cSom = cGewicht.reduce((s, x) => s + x, 0) }
      doelen.forEach((t, k) => {
        if (!t) return
        t.p = Math.max(5, t.p + fout.p * (t.p / (somDoel.p || 1)))
        t.c = Math.max(3, t.c + fout.c * (cGewicht[k] / (cSom || 1)))
        t.f = Math.max(1, t.f + fout.f * (t.f / (somDoel.f || 1)))
      })
      berekend = gekozen.map((x, k) => x ? rekenGrammen(x.gerecht.ingr, doelen[k]!) : null)
    }
    for (let k = 0; k < gekozen.length; k++) {
      const x = gekozen[k]; if (!x) continue
      const { m, gerecht } = x
      const { regels, tot: t } = berekend[k]!
      dagObj[m.slot] = {
        name: gerecht.naam,
        timing: naarTijd(m.tijd),
        function: FUNCTIE[m.rol] || '',
        icon: ICON[m.rol] || undefined,
        calories: Math.round(t.kcal), protein: Math.round(t.p), carbs: Math.round(t.c), fat: Math.round(t.f),
        ingredients_list: regels.map(({ i, g }) => ({ ingredient_id: i.id, name: i.naam, amount: g, unit: 'g' })),
        bron: gerecht.bron,
      }
      tot.kcal += t.kcal; tot.protein += t.p; tot.carbs += t.c; tot.fat += t.f
    }
    dagObj.totals = { kcal: Math.round(tot.kcal), protein: Math.round(tot.protein), carbs: Math.round(tot.carbs), fat: Math.round(tot.fat) }
    week[d.en] = dagObj
    const doelKcal = dag.p * 4 + dag.c * 4 + dag.f * 9
    if (Math.abs(tot.kcal - doelKcal) / doelKcal > 0.03) afwijkingen.push(`${d.nl}: ${Math.round(tot.kcal)} kcal i.p.v. ${Math.round(doelKcal)}`)
    if (Math.abs(tot.protein - dag.p) > 8) afwijkingen.push(`${d.nl}: ${Math.round(tot.protein)} g eiwit i.p.v. ${dag.p}`)
    // Carb timing: post-workout hoort duidelijk de meeste koolhydraten te
    // hebben. Lukt dat niet met de eigen gerechten (vaste stuks zoals een
    // wrap of appel), dan melden we het: de coach kiest wat er schuift.
    const postK = gekozen.findIndex(x => x?.m.rol === 'post')
    if (postK >= 0) {
      const postC = berekend[postK]!.tot.c
      const maxAnder = Math.max(0, ...berekend.map((b, k) => (k === postK || !b || gekozen[k]?.m.rol !== 'normaal') ? 0 : b.tot.c))
      if (postC < 1.3 * maxAnder) afwijkingen.push(`${d.nl}: post-workout heeft ${Math.round(postC)} g koolh., niet duidelijk meer dan de andere maaltijden (max ${Math.round(maxAnder)} g). Gerechten met vaste stuks laten weinig ruimte.`)
    }
  }
  return { week, afwijkingen }
}

// ── Hoofdlogica ──────────────────────────────────────────────────────────────
async function bouwPlan(sb: SupabaseClient, clientId: string, vasteKeuze?: any) {
  const { data: c, error: ce } = await sb.from('clients')
    .select('id, first_name, auth_user_id, coach_id, trainer_id, current_weight, target_calories, target_protein, target_carbs, target_fat, training_time, preferred_training_days, workout_schedule, work_schedule, allergies, hated_foods')
    .eq('id', clientId).single()
  if (ce || !c) throw new Error('Klant niet gevonden')
  const dag: Macro = { p: Number(c.target_protein), c: Number(c.target_carbs), f: Number(c.target_fat) }
  if (!dag.p || !dag.f || c.target_carbs == null) throw new Error('Klant heeft nog geen macro-doelen (target_protein/carbs/fat)')
  if (dag.c < 0) throw new Error(`Macro-doelen kloppen niet: ${dag.c} g koolhydraten (negatief). Controleer gewicht/lengte en de macro's van de klant.`)

  const { data: np } = await sb.from('nutrition_preferences').select('*').eq('client_id', clientId).maybeSingle()
  const ids = [c.auth_user_id, c.id].filter(Boolean)
  const { data: uwpRijen } = await sb.from('user_workout_preferences').select('default_time_per_session, user_id').in('user_id', ids)
  const trainDuur = Number(uwpRijen?.[0]?.default_time_per_session) || 60

  const wishes = np?.wishes || {}, ch = np?.current_habits || {}, pi = np?.practical_info || {}
  const variatie: Record<string, string> = pi.variatie_per_maaltijd || {}
  const aantalVoor = (mom: string) => ({ vast: 1, afwisselen: 2, variatie: 7 } as any)[variatie[mom]] || 1
  const overgeslagen = (mom: string) => (wishes[`${mom}_categories`] || []).some((x: string) => String(x).startsWith('skip_'))
  const momenten = new Set(['ontbijt', 'lunch', 'diner', 'snack'].filter(m => !overgeslagen(m)))

  // Trainingsdagen: actief schema (workout_schedule) wint, anders intake-voorkeur.
  const wsDagen = Object.keys(c.workout_schedule || {})
  const trainingsdagen = new Set<string>(wsDagen.length
    ? DAGEN.filter(d => wsDagen.includes(d.En)).map(d => d.nl)
    : (c.preferred_training_days || []))
  const trainStartStd = naarMin(c.training_time, 18 * 60)
  // 4 tot 6 eiwitmaaltijden, zo dat er per maaltijd niet meer dan ~45 g eiwit in zit.
  const minMaaltijden = Math.min(6, Math.max(4, Math.ceil(dag.p / 45)))

  // Dagindeling + macro's per maaltijd
  const dagen = DAGEN.map((d, idx) => {
    const ind = dagIndeling(d.nl, { ws: c.work_schedule, trainingsdag: trainingsdagen.has(d.nl), trainStartStd, trainDuur, momenten, minMaaltijden })
    verdeelMacros(ind.maaltijden, dag)
    return { ...d, idx, training: trainingsdagen.has(d.nl), ...ind }
  })

  // Welke gerecht-lijsten zijn nodig?
  const nodig = new Set<string>()
  dagen.forEach(d => d.maaltijden.forEach(m => nodig.add(m.moment)))
  const aantal: Record<string, number> = {}
  nodig.forEach(m => { aantal[m] = ['pre_workout', 'post_workout'].includes(m) ? 1 : aantalVoor(m) })

  // Gemiddeld macro-doel per moment, als context voor de AI.
  const gem: Record<string, Macro> = {}
  nodig.forEach(mom => {
    const xs = dagen.flatMap(d => d.maaltijden.filter(m => m.moment === mom))
    gem[mom] = { p: Math.round(xs.reduce((s, x) => s + x.doel!.p, 0) / xs.length), c: Math.round(xs.reduce((s, x) => s + x.doel!.c, 0) / xs.length), f: Math.round(xs.reduce((s, x) => s + x.doel!.f, 0) / xs.length) }
  })
  const keerPost: Record<string, number> = {}
  dagen.forEach(d => d.maaltijden.forEach(m => { if (m.rol !== 'normaal') keerPost[`${m.moment}:${m.rol}`] = (keerPost[`${m.moment}:${m.rol}`] || 0) + 1 }))

  const lekker = (mom: string) => {
    const subs = (wishes[`${mom}_subs`] || []).map((s: string) => s.includes('_custom_') ? s.split('_custom_')[1] : s.replace(/_/g, ' '))
    const teksten = Object.values(wishes[`${mom}_text`] || {})
    return [...subs, ...teksten].filter(Boolean)
  }
  const intake = {
    klant: c.first_name,
    momenten: [...nodig].map(mom => ({
      moment: mom,
      aantal_gerechten: aantal[mom],
      macro_doel_per_portie_ongeveer: gem[mom],
      soms_pre_of_post_workout: Object.keys(keerPost).filter(k => k.startsWith(mom + ':')).map(k => `${k.split(':')[1]} op ${keerPost[k]} dag(en)`),
      eet_nu: ch[mom === 'pre_workout' || mom === 'post_workout' ? 'snack' : mom] || null,
      werkt_goed: ch.per_moment?.[mom]?.werkt_goed || null,
      vindt_lekker: lekker(mom === 'pre_workout' || mom === 'post_workout' ? 'snack' : mom),
    })),
    extra_snacks_nu: ch.extras || [],
    niet_lekker: [...(wishes.niet_lekker || []), wishes.niet_lekker_overig].filter(Boolean),
    allergieen: np?.allergens || null,
    dieet: np?.allergens?.diet_preference || 'geen',
    vermijdt_ook: [c.hated_foods, c.allergies].filter(Boolean),
  }

  // Proefruns kunnen een eerdere AI-keuze meegeven, zodat alleen de
  // rekenstappen opnieuw draaien (geen nieuwe AI-kosten bij bijschaven).
  let keuze: any, usage: any = null
  if (vasteKeuze) keuze = vasteKeuze
  else {
  const ai = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! })
  const res = await ai.messages.create({
    model: MODEL,
    max_tokens: 16000,
    output_config: { effort: 'medium', format: { type: 'json_schema', schema: SCHEMA } } as any,
    system: SYSTEEM,
    messages: [{ role: 'user', content: `Intake van de klant (JSON):\n${JSON.stringify(intake, null, 1)}\n\nStel de gerechten samen.` }],
  } as any)
  if (res.stop_reason === 'refusal') throw new Error('AI weigerde het verzoek')
  const tekst = (res.content as any[]).find(b => b.type === 'text')?.text
  if (!tekst) throw new Error(`Geen antwoord van de AI (stop: ${res.stop_reason})`)
  keuze = JSON.parse(tekst)
  usage = res.usage
  }

  // Ingrediënten opzoeken (met harde dieet- en allergiecontrole)
  const al = np?.allergens || {}
  const klant: Klant = {
    dieet: al.diet_preference || 'geen',
    allergenen: [...(al.selected_allergens || []), ...(al.intolerances || [])].map((x: any) => String(x).toLowerCase()),
  }
  const cache = new Map<string, any>()
  const gerechten: Record<string, { naam: string; bron: string; ingr: Ingr[]; mist: string[] }[]> = {}
  for (const mom of keuze.momenten || []) {
    gerechten[mom.moment] = []
    for (const g of mom.gerechten || []) {
      const ingr: Ingr[] = [], mist: string[] = []
      for (const i of g.ingredienten || []) {
        const r = await zoekIngredient(sb, i.zoekterm, i.rol, clientId, cache, klant)
        if (!r) { mist.push(i.zoekterm); continue }
        ingr.push({
          id: r.id, naam: r.name, rol: i.rol, g0: Math.max(1, Number(i.gram) || 50),
          p: Number(r.protein_per_100g) / 100, c: Number(r.carbs_per_100g) / 100, f: Number(r.fat_per_100g) / 100,
          kcal: Number(r.calories_per_100g) / 100,
          stuk: String(r.eenheid || '').startsWith('stuk') && Number(r.gram_per_eenheid) > 0 ? Number(r.gram_per_eenheid) : undefined,
        })
      }
      gerechten[mom.moment].push({ naam: g.naam, bron: g.bron, ingr, mist })
    }
  }

  const { week, afwijkingen } = bouwWeek(dagen, gerechten, dag)
  // Te weinig koolhydraten om met normale maaltijden te halen (groente, brood
  // en fruit hebben altijd wat). Bovenaan melden: dit is een macro-keuze.
  if (dag.c < 80) afwijkingen.unshift(`Macro-doel heeft maar ${dag.c} g koolhydraten bij ${dag.p} g eiwit. Met gewone maaltijden is dat nauwelijks te halen; controleer de macro's (berekening: eiwit ${Math.round(dag.p / Math.max(1, Number(c.current_weight) || 1) * 10) / 10} g/kg, vet ${Math.round(dag.f / Math.max(1, Number(c.current_weight) || 1) * 10) / 10} g/kg).`)

  const ontbrekend = Object.values(gerechten).flat().flatMap(g => g.mist)
  const rapport = {
    versie: VERSIE,
    opmerkingen_ai: keuze.opmerkingen,
    afwijkingen,
    niet_gevonden_ingredienten: [...new Set(ontbrekend)],
    trainingsdagen: [...trainingsdagen],
    dagindeling: dagen.map(d => ({ dag: d.nl, training: d.tStart != null ? `${naarTijd(d.tStart)}-${naarTijd(d.tEind!)}` : null, maaltijden: d.maaltijden.map(m => `${naarTijd(m.tijd)} ${m.slot}${m.rol !== 'normaal' ? ` (${m.rol})` : ''}`) })),
    tokens: usage,
    ai_keuze: keuze,
  }
  return { client: c, dag, week, rapport }
}

async function slaOp(sb: SupabaseClient, r: Awaited<ReturnType<typeof bouwPlan>>) {
  const datum = new Date().toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
  const { data: plan, error } = await sb.from('client_meal_plans').insert({
    client_id: r.client.id,
    template_name: `Concept na intake (${datum})`,
    week_structure: r.week,
    daily_calories: Math.round(r.dag.p * 4 + r.dag.c * 4 + r.dag.f * 9),
    daily_protein: Math.round(r.dag.p), daily_carbs: Math.round(r.dag.c), daily_fat: Math.round(r.dag.f),
    is_active: false,               // let op: kolom staat standaard op true
    ai_generated: true,
    ai_version: VERSIE,
    created_via: 'plan-bouwer',
    generation_settings: r.rapport,
    stats: { afwijkingen: r.rapport.afwijkingen.length },
  }).select('id').single()
  if (error) throw error
  await sb.rpc('create_intake_notification', {
    p_client_id: r.client.id, p_type: 'plan_ready', p_priority: 'high',
    p_title: `Conceptplan klaar: ${String(r.client.first_name || '').trim()}`,
    p_message: r.rapport.afwijkingen.length
      ? `Automatisch gebouwd na de intake. ${r.rapport.afwijkingen.length} punt(en) om na te kijken.`
      : 'Automatisch gebouwd na de intake. Klaar om na te kijken in de Plan Analyzer.',
    p_action_type: 'review_plan', p_action_data: { client_id: r.client.id, plan_id: plan.id },
  }).then(x => x, () => null)
  return plan.id
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...CORS, 'Content-Type': 'application/json' } })
  try {
    const { client_id, dry_run, keuze } = await req.json()
    if (!client_id) return json({ error: 'client_id ontbreekt' }, 400)
    const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    // Wie mag dit aanroepen? Een ingelogde coach altijd. Zonder login (de
    // intake zelf) alleen vlak na een afgeronde voedingsintake en niet
    // vaker dan eens per 30 min, zodat niemand dit kan blijven afvuren.
    const jwt = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '')
    const { data: gebruiker } = jwt ? await sb.auth.getUser(jwt) : { data: null as any }
    // Testsleutel staat alleen in de Vault (plan_bouwer_testsleutel); proefruns
    // worden vanuit de database zelf aangeroepen via pg_net.
    const testsleutel = req.headers.get('x-testsleutel')
    const isTest = !!testsleutel && !!(await sb.rpc('plan_bouwer_test_ok', { p_sleutel: testsleutel })).data
    const isCoach = isTest || (!!gebruiker?.user && !!(await sb.from('clients').select('id').eq('id', client_id)
      .or(`coach_id.eq.${gebruiker.user.id},trainer_id.eq.${gebruiker.user.id}`).maybeSingle()).data)
    if (!isCoach) {
      if (dry_run) return json({ error: 'dry_run alleen voor de coach' }, 403)
      const { data: np } = await sb.from('nutrition_preferences').select('completed, updated_at').eq('client_id', client_id).maybeSingle()
      const vers = np?.completed && Date.now() - new Date(np.updated_at).getTime() < 3 * 3600_000
      const { data: recent } = await sb.from('client_meal_plans').select('id').eq('client_id', client_id)
        .eq('created_via', 'plan-bouwer').gte('created_at', new Date(Date.now() - 30 * 60_000).toISOString()).limit(1)
      if (!vers || recent?.length) return json({ error: 'niet toegestaan' }, 403)
    }

    if (dry_run) {
      const r = await bouwPlan(sb, client_id, keuze)
      return json({ week: r.week, rapport: r.rapport })
    }
    // Op de achtergrond: de intake hoeft hier niet op te wachten.
    const klus = bouwPlan(sb, client_id).then(r => slaOp(sb, r)).catch(e => console.error('plan-bouwer', client_id, e?.message || e))
    // @ts-ignore EdgeRuntime bestaat in Supabase Edge Functions
    if (typeof EdgeRuntime !== 'undefined') EdgeRuntime.waitUntil(klus)
    else await klus
    return json({ ok: true, bezig: true }, 202)
  } catch (e) {
    return json({ error: String((e as Error)?.message || e) }, 500)
  }
})
