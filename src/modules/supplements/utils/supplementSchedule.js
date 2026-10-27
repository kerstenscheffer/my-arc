// src/modules/supplements/utils/supplementSchedule.js
//
// Supplementen omzetten naar momenten op de dag.
//
// Een supplement in supplement_plans.supplements draagt zijn tijd op drie
// manieren, van hard naar zacht:
//   1. timing.specific_time   "07:00"      → gewoon die tijd
//   2. timing.meal_reference  "breakfast"  → het tijdstip van díe maaltijd,
//                                            zodat het meeschuift als de coach
//                                            de maaltijd verzet
//   3. timing.time_of_day     "morning"    → grove terugval
// Staat er niets bruikbaars ("flexible"), dan krijgt het supplement géén
// tijdstip. Dat is een eerlijke uitkomst: het hoort dan niet op de tijdlijn,
// maar wel in de dagenlijst onder "Flexibel".
//
// Gebruikt door de Plan Analyzer (dagweergave) en de agenda (weekweergave),
// zodat beide dezelfde momenten tonen.

export const TIJD_VAN_DAG_TERUGVAL = {
  morning: 8 * 60,
  afternoon: 13 * 60,
  evening: 19 * 60,
  night: 22 * 60,
  before_bed: 22 * 60,
}

export const MOMENT_LABEL = {
  morning: 'Ochtend',
  afternoon: 'Middag',
  evening: 'Avond',
  night: 'Avond',
  before_bed: 'Voor het slapen',
  flexible: 'Flexibel',
}

export const DAG_SLEUTELS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
export const DAG_KORT = { monday: 'Ma', tuesday: 'Di', wednesday: 'Wo', thursday: 'Do', friday: 'Vr', saturday: 'Za', sunday: 'Zo' }

/**
 * Op welke dagen geldt dit supplement?
 *
 * Ontbreekt `days`, dan geldt het elke dag. Dat is bewust: alle bestaande
 * plannen hebben het veld niet en die zijn dagelijks bedoeld. Een leeg
 * array betekent wél "geen enkele dag" — dat is een expliciete keuze van
 * de coach, geen ontbrekende data.
 */
export const dagenVanSupplement = (supp) => {
  const d = supp?.days
  if (!Array.isArray(d)) return DAG_SLEUTELS
  return d.filter(x => DAG_SLEUTELS.includes(x))
}

export const geldtOpDag = (supp, dagSleutel) => {
  if (!dagSleutel) return true
  if (!Array.isArray(supp?.days)) return true
  return supp.days.includes(dagSleutel)
}

const parseKlok = (str) => {
  const m = /^(\d{1,2}):(\d{2})/.exec(String(str || ''))
  if (!m) return null
  const min = parseInt(m[1], 10) * 60 + parseInt(m[2], 10)
  return min >= 0 && min < 24 * 60 ? min : null
}

export const minutenNaarKlok = (min) =>
  `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`

/**
 * Laadt het actieve supplementenplan van een klant.
 * Geeft een lege lijst terug als er niets is — nooit null, zodat de
 * aanroepers geen extra check nodig hebben.
 */
export async function laadSupplementen(supabase, clientId) {
  if (!supabase || !clientId) return []
  // Bewust geen maybeSingle(): er staat geen unieke sleutel op
  // (client_id, status), dus twee actieve plannen zijn mogelijk. maybeSingle
  // gooit daar een fout op en dan zouden álle supplementen verdwijnen. Nu
  // wint gewoon het laatst bijgewerkte plan.
  const { data, error } = await supabase
    .from('supplement_plans')
    .select('id, supplements, status, updated_at')
    .eq('client_id', clientId)
    .eq('status', 'active')
    .order('updated_at', { ascending: false })
    .limit(1)
  if (error) { console.warn('laadSupplementen', error.message); return [] }
  const lijst = data?.[0]?.supplements
  return Array.isArray(lijst) ? lijst : []
}

/** "5 gram", "2-3 softgels", "2 tabletten" — leeg als er niets staat. */
export const doseringTekst = (supp) => {
  const d = supp?.dosage
  if (!d || typeof d !== 'object') return ''
  const hoeveel = d.amount != null ? String(d.amount) : ''
  return [hoeveel, d.unit || ''].filter(Boolean).join(' ').trim()
}

// Supplementen waarvan de dosering per product verschilt. Bij pre-workout
// zit er per merk iets heel anders in een schep, dus een vaste "1 scoop"
// klopt vaak niet. De klant ziet daar geen dosering; het etiket geldt.
// Bij creatine (5 gram) is er weinig variatie, die blijft staan.
const WISSELENDE_DOSERING = /pre[\s_-]?workout/i

/** Dosering zoals de klant hem ziet: leeg bij supplementen uit WISSELENDE_DOSERING. */
export const klantDoseringTekst = (supp) => {
  const sleutel = [supp?.template_id, supp?.supplement_id, supp?.name].filter(Boolean).join(' ')
  if (WISSELENDE_DOSERING.test(sleutel)) return ''
  return doseringTekst(supp)
}

/**
 * Het tijdstip van één supplement in minuten sinds middernacht, of null.
 * @param {object} supp
 * @param {object} maaltijdTijden  { breakfast: 450, dinner: 1140, … } — optioneel
 */
export const momentVanSupplement = (supp, maaltijdTijden = null) => {
  const t = supp?.timing
  if (!t || typeof t !== 'object') return null

  const exact = parseKlok(t.specific_time)
  if (exact != null) return exact

  const ref = t.meal_reference
  if (ref && maaltijdTijden && Number.isFinite(maaltijdTijden[ref])) return maaltijdTijden[ref]

  const grof = TIJD_VAN_DAG_TERUGVAL[t.time_of_day]
  return Number.isFinite(grof) ? grof : null
}

/**
 * Groepeert supplementen op moment. Drie pillen om 07:00 horen één regel te
 * zijn, geen drie — anders staat de tijdlijn vol met losse blokjes die
 * hetzelfde zeggen.
 *
 * @returns {Array<{minuten:number|null, label:string, items:Array}>}
 *          gesorteerd op tijd; het flexibele blok (minuten=null) staat achteraan.
 */
export const groepeerPerMoment = (supplementen, maaltijdTijden = null) => {
  const perMoment = new Map()
  ;(supplementen || []).forEach(s => {
    const min = momentVanSupplement(s, maaltijdTijden)
    const sleutel = min == null ? 'flex' : min
    if (!perMoment.has(sleutel)) perMoment.set(sleutel, [])
    perMoment.get(sleutel).push(s)
  })

  const uit = []
  perMoment.forEach((items, sleutel) => {
    if (sleutel === 'flex') {
      uit.push({ minuten: null, label: MOMENT_LABEL.flexible, items })
    } else {
      uit.push({ minuten: sleutel, label: minutenNaarKlok(sleutel), items })
    }
  })
  return uit.sort((a, b) => {
    if (a.minuten == null) return 1
    if (b.minuten == null) return -1
    return a.minuten - b.minuten
  })
}

// ── Eigen supplementen van de klant (27 okt 2026) ──
// Staan in hetzelfde actieve plan als die van de coach, met `door_klant`.
// Zo leest alles wat supplementen toont (tijdlijn, agenda, oude app-versies)
// ze zonder aanpassing mee. Geen actief plan? Dan maken we er een.
async function actiefPlan(supabase, clientId) {
  const { data, error } = await supabase
    .from('supplement_plans').select('id, supplements')
    .eq('client_id', clientId).eq('status', 'active')
    .order('updated_at', { ascending: false }).limit(1)
  if (error) throw error
  return data?.[0] || null
}

export async function voegEigenSupplementToe(supabase, clientId, { naam, hoeveelheid, tijd, dagen }) {
  const delen = String(hoeveelheid || '').trim().match(/^([\d.,-]+)\s*(.*)$/)
  const supp = {
    template_id: `eigen_${Date.now()}`,
    name: String(naam || '').trim(),
    emoji: '💊',
    dosage: delen ? { amount: delen[1].replace(',', '.'), unit: delen[2] || '' } : { amount: null, unit: String(hoeveelheid || '').trim() },
    timing: { specific_time: tijd || null, meal_reference: null, time_of_day: null },
    days: Array.isArray(dagen) && dagen.length ? dagen : DAG_SLEUTELS,
    category: 'eigen',
    door_klant: true,
  }
  const plan = await actiefPlan(supabase, clientId)
  if (plan) {
    const lijst = Array.isArray(plan.supplements) ? plan.supplements : []
    const { error } = await supabase.from('supplement_plans')
      .update({ supplements: [...lijst, supp], updated_at: new Date().toISOString() }).eq('id', plan.id)
    if (error) throw error
  } else {
    const { error } = await supabase.from('supplement_plans')
      .insert({ client_id: clientId, status: 'active', supplements: [supp] })
    if (error) throw error
  }
  return supp
}

export async function verwijderEigenSupplement(supabase, clientId, templateId) {
  const plan = await actiefPlan(supabase, clientId)
  if (!plan) return
  const lijst = (Array.isArray(plan.supplements) ? plan.supplements : [])
    .filter(s => !(s.door_klant && s.template_id === templateId))
  const { error } = await supabase.from('supplement_plans')
    .update({ supplements: lijst, updated_at: new Date().toISOString() }).eq('id', plan.id)
  if (error) throw error
}
