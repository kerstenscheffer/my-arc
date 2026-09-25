// src/modules/meal-plan/DayTemplateService.js
//
// Dagtemplates: één dag eten die je kunt bewaren en op een andere dag zetten.
//
// De templates zelf maakt de coach in de Plan Analyzer; ze staan in
// meal_plan_templates met plan_type='single_day' en de vorm
// `week_structure = { day: { breakfast: {...}, lunch: {...}, … } }`.
//
// Dit bestand regelt de twee dingen die daar omheen zaten:
//   1. welke templates een klant te zien krijgt (client_day_templates)
//   2. wat er gebeurt als hij er een kiest — voor altijd of voor deze week
//
// "Altijd" schrijft in het weekplan zelf (client_meal_plans.week_structure),
// want dat is cyclisch per weekdag. "Deze week" schrijft een rij per datum in
// client_day_overrides; die wint voor die ene dag en verdwijnt vanzelf uit
// beeld zodra de dag voorbij is.

import { SJABLOON_DAG } from '../../lib/mealTemplateTypes'

export const DAG_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
export const DAG_LABELS = ['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag', 'Zondag']

// De lokale kalenderdatum, niet de UTC-datum. toISOString() rekent eerst om
// naar UTC en schuift in de zomer een dag terug.
export const lokaleDatum = (d) => {
  const x = d instanceof Date ? d : new Date(d)
  const p = (n) => String(n).padStart(2, '0')
  return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}`
}

// Maandag = 0, zoals de dag-navigatie in het klantscherm.
export const dagIndexVan = (d) => {
  const x = d instanceof Date ? d : new Date(d)
  return (x.getDay() + 6) % 7
}

// De maaltijden uit een template, in de vorm die het weekplan gebruikt.
export const slotsVanTemplate = (template) => {
  const ws = template?.week_structure || {}
  const dag = ws.day || ws.dag || ws
  const slots = {}
  Object.entries(dag || {}).forEach(([slot, meal]) => {
    if (!meal || slot === 'totals' || slot === 'is_training_day') return
    slots[slot] = meal
  })
  return slots
}

// Eén dag zoals het weekplan hem opslaat. De trainingsdag-vlag van de doeldag
// blijft staan: of je die dag traint hangt aan het schema van de klant, niet
// aan de maaltijden die je erop zet.
export const dagVanTemplate = (template, bestaandeDag = null) => ({
  ...slotsVanTemplate(template),
  totals: {
    kcal: Math.round(template?.daily_calories || 0),
    protein: Math.round(template?.daily_protein || 0),
    carbs: Math.round(template?.daily_carbs || 0),
    fat: Math.round(template?.daily_fat || 0),
  },
  is_training_day: bestaandeDag?.is_training_day ?? false,
})

// ── Coach: welke templates hangen aan deze klant ───────────────────────────

export async function getCoachDagTemplates(supabase, coachId) {
  let q = supabase
    .from('meal_plan_templates')
    .select('id, name, template_name, emoji, daily_calories, daily_protein, daily_carbs, daily_fat, meals_per_day, week_structure, created_at')
    .eq('plan_type', SJABLOON_DAG)
    .order('created_at', { ascending: false })
  if (coachId) q = q.eq('coach_id', coachId)
  const { data, error } = await q
  if (error) { console.warn('Dagtemplates laden mislukt:', error.message); return [] }
  return data || []
}

export async function getGekoppeldeIds(supabase, clientId) {
  if (!clientId) return new Set()
  const { data, error } = await supabase
    .from('client_day_templates')
    .select('template_id')
    .eq('client_id', clientId)
  if (error) { console.warn('Koppelingen laden mislukt:', error.message); return new Set() }
  return new Set((data || []).map(r => r.template_id))
}

export async function koppelTemplate(supabase, { clientId, templateId, coachId }) {
  const { error } = await supabase
    .from('client_day_templates')
    .upsert({ client_id: clientId, template_id: templateId, coach_id: coachId || null }, { onConflict: 'client_id,template_id' })
  return { error }
}

export async function ontkoppelTemplate(supabase, { clientId, templateId }) {
  const { error } = await supabase
    .from('client_day_templates')
    .delete()
    .eq('client_id', clientId)
    .eq('template_id', templateId)
  return { error }
}

// ── Klant: zijn eigen lijst ────────────────────────────────────────────────

// De dagmenu's bestaan in drie maten. Welke hoort bij deze klant? De
// dichtstbijzijnde: tot 2250 kcal het 2000-menu, daarboven 2500, en vanaf
// 2750 het 3000-menu. Zo hoeft niemand iets toe te wijzen — wie 2200 als doel
// heeft ziet vanzelf de 2000-dagen.
export const DAGMENU_NIVEAUS = [2000, 2500, 3000]

export const niveauVoorDoel = (doelKcal) => {
  const doel = Number(doelKcal)
  if (!Number.isFinite(doel) || doel <= 0) return null
  return DAGMENU_NIVEAUS.reduce((beste, niveau) => (
    Math.abs(niveau - doel) < Math.abs(beste - doel) ? niveau : beste
  ), DAGMENU_NIVEAUS[0])
}

// Hoort een dagtemplate bij dit niveau? De dagen schommelen rond hun doel
// (1971–2019 voor het 2000-menu), dus we kijken of het dichtstbijzijnde
// niveau van die dag hetzelfde is.
const templateNiveau = (t) => niveauVoorDoel(t?.daily_calories)

export async function getKlantDagTemplates(supabase, clientId) {
  if (!clientId) return []

  const [{ data: gekoppeld, error }, { data: klant }] = await Promise.all([
    supabase
      .from('client_day_templates')
      .select('template_id, meal_plan_templates(id, name, template_name, emoji, daily_calories, daily_protein, daily_carbs, daily_fat, meals_per_day, week_structure)')
      .eq('client_id', clientId)
      .order('created_at', { ascending: true }),
    supabase.from('clients').select('target_calories').eq('id', clientId).maybeSingle(),
  ])
  if (error) console.warn('Dagtemplates van klant laden mislukt:', error.message)

  const lijst = (gekoppeld || [])
    .map(r => r.meal_plan_templates)
    .filter(Boolean)
    .map(t => ({ ...t, bron: BRON_COACH }))

  // Daarbovenop: de dagmenu's die bij zijn caloriedoel passen. Die hoeft de
  // coach niet toe te wijzen — verandert het doel, dan verschuift de lijst mee.
  const niveau = niveauVoorDoel(klant?.target_calories)
  if (niveau) {
    const { data: auto } = await supabase
      .from('meal_plan_templates')
      .select('id, name, template_name, emoji, daily_calories, daily_protein, daily_carbs, daily_fat, meals_per_day, week_structure')
      .eq('plan_type', SJABLOON_DAG)
      .gte('daily_calories', niveau - 250)
      .lte('daily_calories', niveau + 250)
      .order('name', { ascending: true })
    ;(auto || []).forEach(t => {
      if (templateNiveau(t) !== niveau) return
      if (lijst.some(x => x.id === t.id)) return
      lijst.push({ ...t, bron: BRON_COACH })
    })
  }

  return lijst
}

// ── Eigen dagen van de klant ───────────────────────────────────────────────
//
// Een dag die de klant zelf bewaart. Zelfde vorm als een coach-dag, maar in
// zijn eigen tabel: hij mag hem weggooien en de coach hoeft er niet over te
// struikelen. `bron` markeert waar hij vandaan komt, zodat de lijst het
// onderscheid kan tonen.

export const BRON_COACH = 'coach'
export const BRON_KLANT = 'klant'

export async function getEigenDagen(supabase, clientId) {
  if (!clientId) return []
  const { data, error } = await supabase
    .from('client_saved_days')
    .select('id, naam, dag, daily_calories, daily_protein, daily_carbs, daily_fat, created_at')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
  if (error) { console.warn('Eigen dagen laden mislukt:', error.message); return [] }
  // Zelfde vorm als een template, zodat de rest van dit bestand geen verschil
  // hoeft te kennen tussen een coach-dag en een eigen dag.
  return (data || []).map(r => ({
    id: r.id,
    name: r.naam,
    template_name: r.naam,
    week_structure: { day: r.dag },
    daily_calories: r.daily_calories,
    daily_protein: r.daily_protein,
    daily_carbs: r.daily_carbs,
    daily_fat: r.daily_fat,
    meals_per_day: Object.keys(r.dag || {}).filter(k => k !== 'totals' && k !== 'is_training_day').length,
    bron: BRON_KLANT,
  }))
}

// De dag zoals hij nu op het scherm staat bewaren. `maaltijden` is de lijst
// die de dagweergave toont: per maaltijd een slot en de maaltijd zelf.
export async function bewaarEigenDag(supabase, { clientId, naam, maaltijden, bronTemplateId = null }) {
  try {
    const dag = {}
    let kcal = 0, eiwit = 0, kh = 0, vet = 0
    ;(maaltijden || []).forEach(m => {
      const slot = m?.slot || m?.meal?.slot
      const maaltijd = m?.meal || m
      if (!slot || !maaltijd) return
      dag[slot] = maaltijd
      kcal += Number(maaltijd.calories) || 0
      eiwit += Number(maaltijd.protein) || 0
      kh += Number(maaltijd.carbs) || 0
      vet += Number(maaltijd.fat) || 0
    })
    if (!Object.keys(dag).length) return { error: 'Deze dag heeft geen maaltijden' }

    const { error } = await supabase.from('client_saved_days').insert({
      client_id: clientId,
      naam: String(naam || '').trim().slice(0, 80) || 'Mijn dag',
      dag,
      daily_calories: Math.round(kcal),
      daily_protein: Math.round(eiwit),
      daily_carbs: Math.round(kh),
      daily_fat: Math.round(vet),
      bron_template_id: bronTemplateId,
    })
    if (error) throw error
    return { ok: true }
  } catch (e) {
    console.error('bewaarEigenDag mislukt:', e)
    return { error: e.message || 'Opslaan mislukt' }
  }
}

export async function verwijderEigenDag(supabase, { clientId, id }) {
  const { error } = await supabase
    .from('client_saved_days').delete().eq('id', id).eq('client_id', clientId)
  return { error }
}

// ── Herkennen welke dag je voor je hebt ────────────────────────────────────
//
// Geen vlaggetje in de database maar een vergelijking van de inhoud: welke
// maaltijd staat op welk slot. Wissel je er één, dan klopt de handtekening
// niet meer en heet de dag weer naamloos — precies wat je wilt, want het is
// die dag dan ook niet meer.
export const handtekeningVanDag = (dagOfMaaltijden) => {
  const paren = []
  if (Array.isArray(dagOfMaaltijden)) {
    dagOfMaaltijden.forEach(m => {
      const slot = m?.slot || m?.meal?.slot
      const maaltijd = m?.meal || m
      const id = maaltijd?.meal_id || maaltijd?.id || maaltijd?.name
      if (slot && id) paren.push(`${slot}:${id}`)
    })
  } else {
    Object.entries(dagOfMaaltijden || {}).forEach(([slot, maaltijd]) => {
      if (slot === 'totals' || slot === 'is_training_day' || !maaltijd) return
      const id = maaltijd?.meal_id || maaltijd?.id || maaltijd?.name
      if (id) paren.push(`${slot}:${id}`)
    })
  }
  return paren.sort().join('|')
}

// Hoort deze dag bij een bewaarde dag? Geeft die dag terug, anders null.
export const vindDag = (maaltijden, dagen) => {
  const nu = handtekeningVanDag(maaltijden)
  if (!nu) return null
  return (dagen || []).find(d => handtekeningVanDag(slotsVanTemplate(d)) === nu) || null
}

// Tijdelijke dagen in een venster, als map datum → rij.
export async function getOverrides(supabase, clientId, vanDatum, totDatum) {
  if (!clientId) return {}
  const { data, error } = await supabase
    .from('client_day_overrides')
    .select('datum, dag, template_id, template_naam')
    .eq('client_id', clientId)
    .gte('datum', vanDatum)
    .lte('datum', totDatum)
  if (error) { console.warn('Dag-overrides laden mislukt:', error.message); return {} }
  const map = {}
  ;(data || []).forEach(r => { map[String(r.datum).slice(0, 10)] = r })
  return map
}

// ── Toepassen ──────────────────────────────────────────────────────────────

// Voor altijd: de dag in het weekplan vervangen. Eventuele tijdelijke dagen op
// diezelfde weekdag halen we weg, anders zou de klant zijn eigen keuze niet
// terugzien ("ik heb het toch op altijd gezet?").
export async function zetDagAltijd(supabase, { clientId, planId, dagIndex, template }) {
  try {
    if (!planId) return { error: 'Geen actief plan' }
    const dagKey = DAG_KEYS[dagIndex]
    const { data: plan, error: leesFout } = await supabase
      .from('client_meal_plans')
      .select('id, week_structure')
      .eq('id', planId)
      .maybeSingle()
    if (leesFout) throw leesFout

    const week = { ...(plan?.week_structure || {}) }
    week[dagKey] = dagVanTemplate(template, week[dagKey])

    const { error } = await supabase
      .from('client_meal_plans')
      .update({ week_structure: week, updated_at: new Date().toISOString() })
      .eq('id', planId)
    if (error) throw error

    // Tijdelijke dagen op dezelfde weekdag opruimen, vanaf vandaag.
    const vandaag = lokaleDatum(new Date())
    const { data: rijen } = await supabase
      .from('client_day_overrides')
      .select('id, datum')
      .eq('client_id', clientId)
      .gte('datum', vandaag)
    const teWissen = (rijen || []).filter(r => dagIndexVan(`${String(r.datum).slice(0, 10)}T00:00:00`) === dagIndex)
    if (teWissen.length) {
      await supabase.from('client_day_overrides').delete().in('id', teWissen.map(r => r.id))
    }
    return { ok: true }
  } catch (e) {
    console.error('zetDagAltijd mislukt:', e)
    return { error: e.message || 'Opslaan mislukt' }
  }
}

// Alleen deze week: één rij per datum. Het weekplan blijft ongemoeid, dus
// volgende week staat het oude eten er weer.
export async function zetDagDezeWeek(supabase, { clientId, planId, datums, template }) {
  try {
    const rijen = (datums || []).map(d => ({
      client_id: clientId,
      plan_id: planId || null,
      datum: d,
      dag: dagVanTemplate(template),
      template_id: template?.id || null,
      template_naam: template?.name || template?.template_name || null,
    }))
    if (!rijen.length) return { error: 'Geen dag gekozen' }
    const { error } = await supabase
      .from('client_day_overrides')
      .upsert(rijen, { onConflict: 'client_id,datum' })
    if (error) throw error
    return { ok: true }
  } catch (e) {
    console.error('zetDagDezeWeek mislukt:', e)
    return { error: e.message || 'Opslaan mislukt' }
  }
}

// Tijdelijke dag weer weghalen.
export async function wisOverride(supabase, { clientId, datum }) {
  const { error } = await supabase
    .from('client_day_overrides')
    .delete()
    .eq('client_id', clientId)
    .eq('datum', datum)
  return { error }
}
