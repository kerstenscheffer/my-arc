// src/coach/tabs/client-info/IntakeSummaryModal.jsx
// Read-only viewer voor de 3 delen van de publieke intake (/myintake):
//   1. Persoonlijk  -> velden uit de `clients` tabel (deel 1)
//   2. Voeding      -> voedings-velden uit de `clients` tabel (deel 2)
//   3. Training     -> `user_workout_preferences` tabel (deel 3)
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { BASELINE_VRAGEN } from '../../../modules/public-intake/baselineVragen'
import { X, User, Utensils, Dumbbell, CheckCircle2, Clock, CalendarDays, ExternalLink } from 'lucide-react'
import ClientAgendaView from '../../../modules/client-agenda/ClientAgendaView'

const GREEN = '#10b981'

// ---- waarde-formatters -----------------------------------------------------

const humanize = (v) =>
  String(v)
    .replace(/_/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase())

const MAPS = {
  gender: { male: 'Man', female: 'Vrouw' },
  goal: {
    fat_loss: 'Vetverlies',
    muscle_gain: 'Spieropbouw',
    recomp: 'Recompositie',
    general_fitness: 'Algemene fitness'
  },
  muscle_goal_type: { lean: 'Lean', muscular: 'Gespierd', big: 'Massa', shredded: 'Shredded' },
  goal_timeline: { 3: '3 maanden', 6: '6 maanden', 12: '12 maanden', no_rush: 'Geen haast' },
  activity_level: {
    sedentary: 'Zittend werk',
    lightly_active: 'Licht actief',
    moderately_active: 'Matig actief',
    very_active: 'Zeer actief'
  },
  coaching_style: {
    direct: 'Direct',
    motivating: 'Motiverend',
    data_driven: 'Data-gedreven',
    relaxed: 'Relaxed'
  },
  experience: { beginner: 'Beginner', intermediate: 'Gevorderd', advanced: 'Ervaren' },
  willingness: { starting: 'Wil beginnen', already: 'Traint al', no: 'Traint niet' },
  location: { gym: 'Sportschool', home: 'Thuis', both: 'Beide' },
  yes_no_soms: { yes: 'Ja', sometimes: 'Soms', no: 'Nee', maybe: 'Misschien' },
  split: {
    full_body: 'Full body',
    ppl: 'Push / Pull / Legs',
    upper_lower: 'Upper / Lower',
    bro_split: 'Bro split',
    no_preference: 'Geen voorkeur'
  },
  days: { ma: 'Ma', di: 'Di', wo: 'Wo', do: 'Do', vr: 'Vr', za: 'Za', zo: 'Zo' }
}

const fmtMap = (map) => (v) => map[v] ?? humanize(v)
const fmtBool = (v) => (v ? 'Ja' : 'Nee')
// Eigen weekblokken: "yoga — vrijdag 10:00-11:00", één per regel.
const DAG_VOLUIT = { ma: 'maandag', di: 'dinsdag', wo: 'woensdag', do: 'donderdag', vr: 'vrijdag', za: 'zaterdag', zo: 'zondag' }
const fmtBlokken = (v) => {
  if (!Array.isArray(v) || !v.length) return null
  return v.map(b => `${b.naam} — ${DAG_VOLUIT[b.dag] || b.dag} ${b.start}-${b.eind}`).join('\n')
}
const fmtArr = (map) => (v) =>
  (Array.isArray(v) ? v : [v]).map((x) => (map ? map[x] ?? humanize(x) : humanize(x))).join(', ')
const fmtDate = (v) => {
  try {
    return new Date(v).toLocaleDateString('nl-NL', { day: '2-digit', month: 'long', year: 'numeric' })
  } catch {
    return String(v)
  }
}
const fmtNum = (unit) => (v) => `${v}${unit ? ' ' + unit : ''}`

const isEmpty = (v) =>
  v === null ||
  v === undefined ||
  v === '' ||
  (Array.isArray(v) && v.length === 0) ||
  (typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0)

// ---- voedingsintake (nutrition_preferences) --------------------------------

const N = {
  guidance: { strict: 'Strak schema', flexible: 'Flexibel', free: 'Vrij / losjes' },
  budget: { '30-40': '€30–40 p/w', '40-60': '€40–60 p/w', '60-80': '€60–80 p/w', '80+': '€80+ p/w' },
  cooking: { graag: 'Kookt graag', neutraal: 'Neutraal', niet_graag: 'Kookt niet graag' },
  diet: { geen: 'Geen', vegetarisch: 'Vegetarisch', veganistisch: 'Veganistisch', halal: 'Halal', pescotarisch: 'Pescotarisch' },
  supps: { ja_graag: 'Ja, graag', basics: 'Alleen de basics', liever_niet: 'Liever niet', nee: 'Nee' },
  cheat: { nooit: 'Nooit', '1x_week': '1x per week', weekend: 'In het weekend', als_nodig: 'Als nodig' },
  social: { zelden: 'Zelden', '1x_week': '1x per week', vaker: 'Vaker' },
  jbn: { ja: 'Ja', beetje: 'Een beetje', nee: 'Nee' },
  jsn: { ja: 'Ja', soms: 'Soms', nee: 'Nee' },
  jn: { ja: 'Ja', nee: 'Nee' },
}

// Vat het gekozen eetpatroon per maaltijd samen tot één leesbare regel
// (sub-items + zelf-getypte items + vrije tekst).
const mealSummary = (w, meal) => {
  if (!w || typeof w !== 'object') return undefined
  const asArr = (x) => Array.isArray(x) ? x : (x && typeof x === 'object' ? Object.values(x) : [])
  const parts = [
    ...asArr(w[`${meal}_subs`]),
    ...asArr(w[`${meal}_custom`]).flat(),
    ...asArr(w[`${meal}_text`]),
  ].map((s) => humanize(String(s || '').replace(/_/g, ' ').trim())).filter(Boolean)
  const uniq = [...new Set(parts)]
  return uniq.length ? uniq.join(', ') : undefined
}

// nutrition_preferences (geneste JSONB) → platte keys voor de renderer.
// Alleen niet-lege waarden, zodat ze de clients-kolommen niet per ongeluk wissen.
function flattenNp(np) {
  if (!np) return {}
  const out = {}
  const put = (k, v) => { if (!isEmpty(v)) out[k] = v }
  const gl = np.guidance_level || {}, lc = np.life_context || {}, al = np.allergens || {}
  const ms = np.meal_schedule || {}, pi = np.practical_info || {}
  const sp = np.supplement_preferences || {}, cm = np.cheat_meals || {}, w = np.wishes || {}
  put('intake_guidance_level', gl.guidance_level)
  put('intake_num_meals', ms.num_meals)
  put('intake_weekly_budget', lc.weekly_budget)
  put('intake_cooking_preference', lc.cooking_preference)
  put('intake_diet_preference', al.diet_preference)
  put('intake_allergens_full', al.selected_allergens)
  put('intake_allergens_limited', al.intolerances)
  put('intake_allergens_custom', al.custom_allergens)
  put('intake_niet_lekker', w.niet_lekker)
  put('intake_niet_lekker_overig', w.niet_lekker_overig)
  put('intake_absoluut_niet', w.absoluut_niet)
  put('intake_wat_werkte', w.wat_werkte)
  put('intake_wat_werkte_toelichting', w.wat_werkte_toelichting)
  put('intake_macros_kennis', pi.macros_kennis)
  put('intake_calorieen_geteld', pi.calorieen_geteld)
  put('intake_plan_gevolgd', pi.plan_gevolgd)
  put('intake_supps', sp.openness)
  put('intake_supps_huidige', sp.huidige)
  put('intake_wat_werkt_goed', np.wat_werkt_goed)
  put('intake_eerder_geprobeerd', (np.current_habits || {}).eerder_geprobeerd)
  put('intake_voeding_screenshots', np.voeding_screenshots)
  put('intake_cheat', cm.frequency)
  put('intake_sociaal', cm.social_frequency)
  put('intake_ontbijt', mealSummary(w, 'ontbijt'))
  put('intake_lunch', mealSummary(w, 'lunch'))
  put('intake_diner', mealSummary(w, 'diner'))
  put('tdee', np.tdee)
  put('target_calories', np.calorie_target)
  put('intake_surplus', np.surplus)
  return out
}

// ---- veld-definities per deel ---------------------------------------------


// ── Nulmeting ───────────────────────────────────────────────────────────────
// Eén rij per meetmoment, vijf schalen naast elkaar. Zo leg je de intake en
// een hermeting letterlijk onder elkaar en zie je in één oogopslag wat er is
// veranderd. Verschil t.o.v. de vorige meting staat erachter.
function Nulmeting({ metingen, isMobile }) {
  if (!metingen?.length) return null
  const datum = (d) => new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })
  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <div style={{
        fontSize: '0.62rem', fontWeight: 900, color: 'rgba(255,255,255,0.35)',
        textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.6rem',
      }}>
        Nulmeting
      </div>

      {metingen.map((m, i) => {
        const vorige = metingen[i + 1]
        return (
          <div key={m.id} style={{
            marginBottom: '0.7rem', padding: isMobile ? '0.7rem' : '0.8rem 0.9rem',
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: '0.6rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 900, color: '#fff' }}>{datum(m.measured_at)}</span>
              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)' }}>
                {m.bron === 'hermeting' ? 'hermeting' : 'bij de intake'}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${isMobile ? 3 : 5}, 1fr)`, gap: 6 }}>
              {BASELINE_VRAGEN.map(v => {
                const w = m[v.veld]
                const delta = vorige && w != null && vorige[v.veld] != null ? w - vorige[v.veld] : null
                return (
                  <div key={v.veld} style={{ textAlign: 'center', padding: '0.5rem 0.2rem', background: 'rgba(255,255,255,0.03)' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: w == null ? 'rgba(255,255,255,0.2)' : '#fff', lineHeight: 1 }}>
                      {w ?? '—'}
                    </div>
                    {delta != null && delta !== 0 && (
                      <div style={{ fontSize: '0.6rem', fontWeight: 800, marginTop: 2, color: delta > 0 ? '#10b981' : '#ef4444' }}>
                        {delta > 0 ? `+${delta}` : delta}
                      </div>
                    )}
                    <div style={{ fontSize: '0.55rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)', marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {v.kort}
                    </div>
                  </div>
                )
              })}
            </div>

            {m.toelichting && (
              <div style={{ marginTop: '0.6rem', fontSize: '0.82rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.55, fontStyle: 'italic' }}>
                "{m.toelichting}"
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Screenshots uit een voedingsapp ─────────────────────────────────────────
// Klein in de lijst, klik voor volledig scherm: de getallen op zo'n screenshot
// zijn op 80 pixels onleesbaar.
function Screenshots({ urls, isMobile }) {
  const [groot, setGroot] = useState(null)
  if (!urls?.length) return null
  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <div style={{
        fontSize: '0.62rem', fontWeight: 900, color: 'rgba(255,255,255,0.35)',
        textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.6rem',
      }}>
        Screenshots voedingsapp
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {urls.map((u, i) => (
          <button key={i} onClick={() => setGroot(u)} style={{ padding: 0, border: '1px solid rgba(255,255,255,0.15)', background: 'none', cursor: 'zoom-in', lineHeight: 0 }}>
            <img src={u} alt={`screenshot ${i + 1}`} style={{ width: isMobile ? 84 : 104, height: isMobile ? 84 : 104, objectFit: 'cover', display: 'block' }} />
          </button>
        ))}
      </div>
      {groot && createPortal(
        <div onClick={() => setGroot(null)} style={{
          position: 'fixed', inset: 0, zIndex: 2147483600,
          background: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1.5rem', cursor: 'zoom-out',
        }}>
          <img src={groot} alt="screenshot" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
        </div>,
        document.body
      )}
    </div>
  )
}

const PART1_SECTIONS = [
  {
    title: 'Basis',
    fields: [
      { key: 'first_name', label: 'Voornaam' },
      { key: 'last_name', label: 'Achternaam' },
      { key: 'email', label: 'E-mail' },
      { key: 'phone', label: 'Telefoon' },
      { key: 'gender', label: 'Geslacht', fmt: fmtMap(MAPS.gender) },
      { key: 'date_of_birth', label: 'Geboortedatum', fmt: fmtDate },
      { key: 'age', label: 'Leeftijd', fmt: fmtNum('jaar') }
    ]
  },
  {
    title: 'Lichaam',
    fields: [
      { key: 'height', label: 'Lengte', fmt: fmtNum('cm') },
      { key: 'current_weight', label: 'Huidig gewicht', fmt: fmtNum('kg') },
      { key: 'current_body_fat', label: 'Huidig vetpercentage', fmt: fmtNum('%') },
      { key: 'current_body_fat_2', label: 'Vetpercentage (2e)', fmt: fmtNum('%') }
    ]
  },
  {
    title: 'Doel',
    fields: [
      { key: 'primary_goal', label: 'Hoofddoel', fmt: fmtMap(MAPS.goal) },
      { key: 'target_weight', label: 'Streefgewicht', fmt: fmtNum('kg') },
      { key: 'has_weight_goal', label: 'Gewichtsdoel', fmt: fmtBool },
      { key: 'target_body_fat', label: 'Streef-vetpercentage', fmt: fmtNum('%') },
      { key: 'muscle_goal_type', label: 'Spierdoel', fmt: fmtMap(MAPS.muscle_goal_type) },
      { key: 'lichaam_omschrijving', label: 'Gewenst lichaam' },
      { key: 'quick_win_2weeks', label: 'Klein succes in 2 weken' },
      { key: 'motivation_verbatim', label: 'Waarom — eigen woorden' },
      { key: 'fitness_doel_tags', label: 'Fitnessdoelen', fmt: fmtArr() },
      { key: 'goal_timeline', label: 'Tijdlijn', fmt: fmtMap(MAPS.goal_timeline) },
      { key: 'goal_deadline', label: 'Deadline', fmt: fmtDate },
      { key: 'goal_urgency', label: 'Urgentie', fmt: fmtNum('/ 10') },
      { key: 'motivation', label: 'Motivatie' }
    ]
  },
  {
    title: 'Levensstijl',
    fields: [
      { key: 'activity_level', label: 'Activiteitsniveau', fmt: fmtMap(MAPS.activity_level) },
      { key: 'preferred_training_days', label: 'Trainingsdagen', fmt: fmtArr(MAPS.days) },
      { key: 'training_time', label: 'Trainingstijd' },
      { key: 'sleep_hours', label: 'Slaap', fmt: fmtNum('uur') },
      { key: 'cooking_time', label: 'Kooktijd', fmt: fmtNum('min') },
      { key: 'stress_level', label: 'Stressniveau', fmt: fmtNum('/ 10') }
    ]
  },
  {
    title: 'Gezondheid',
    fields: [{ key: 'medical_conditions', label: 'Medische aandoeningen' }]
  },
  {
    title: 'Coaching',
    fields: [
      { key: 'previous_coaching', label: 'Eerdere coaching' },
      { key: 'wat_werkte_eerder', label: 'Wat werkte eerder' },
      { key: 'waarom_gestopt', label: 'Waarom gestopt' },
      { key: 'biggest_obstacle', label: 'Grootste obstakel' },
      { key: 'coaching_style_pref', label: 'Coachingsstijl', fmt: fmtMap(MAPS.coaching_style) },
      { key: 'coaching_expectations', label: 'Verwachtingen' },
      { key: 'coaching_goal_tags', label: 'Coachingdoelen', fmt: fmtArr() },
      { key: 'coaching_goals_extra', label: 'Extra doelen' }
    ]
  },
  {
    // Alles wat de klant zelf heeft getypt, bij elkaar. Dit lees je als eerste
    // en het staat anders verspreid over vijf secties.
    title: 'In eigen woorden',
    fields: [
      { key: 'intake_slotwoord', label: 'Slotwoord' },
      { key: 'agenda_toelichting', label: 'Toelichting op de week' },
      { key: 'eigen_blokken', label: 'Eigen vaste blokken', fmt: fmtBlokken },
      { key: 'supplementen_nu', label: 'Slikt nu' }
    ]
  }
]

const PART2_SECTIONS = [
  {
    title: 'Begeleiding & praktisch',
    fields: [
      { key: 'intake_guidance_level', label: 'Begeleidingsstijl', fmt: fmtMap(N.guidance) },
      { key: 'intake_num_meals', label: 'Maaltijden per dag', fmt: fmtNum() },
      { key: 'intake_weekly_budget', label: 'Weekbudget boodschappen', fmt: fmtMap(N.budget) },
      { key: 'intake_cooking_preference', label: 'Kookvoorkeur', fmt: fmtMap(N.cooking) }
    ]
  },
  {
    title: 'Kennis & ervaring',
    fields: [
      { key: 'intake_macros_kennis', label: "Kent macro's", fmt: fmtMap(N.jbn) },
      { key: 'intake_calorieen_geteld', label: 'Ooit calorieën geteld', fmt: fmtMap(N.jsn) },
      { key: 'intake_plan_gevolgd', label: 'Eerder voedingsplan gevolgd', fmt: fmtMap(N.jn) }
    ]
  },
  {
    title: 'Restricties & allergieën',
    fields: [
      { key: 'intake_diet_preference', label: 'Dieet', fmt: fmtMap(N.diet) },
      { key: 'intake_allergens_full', label: 'Volledig vermijden', fmt: fmtArr() },
      { key: 'intake_allergens_limited', label: 'Beperkt (intolerantie)', fmt: fmtArr() },
      { key: 'intake_allergens_custom', label: 'Overige allergieën' },
      { key: 'intake_niet_lekker', label: 'Vindt niet lekker', fmt: fmtArr() },
      { key: 'intake_niet_lekker_overig', label: 'Niet lekker — overig' },
      { key: 'intake_absoluut_niet', label: 'Absoluut niet', fmt: fmtArr() }
    ]
  },
  {
    title: 'Eetpatroon',
    fields: [
      { key: 'intake_ontbijt', label: 'Ontbijt' },
      { key: 'intake_lunch', label: 'Lunch' },
      { key: 'intake_diner', label: 'Diner' },
      { key: 'intake_wat_werkte', label: 'Eerder een goede periode', fmt: fmtMap(N.jbn) },
      { key: 'intake_wat_werkte_toelichting', label: 'Toelichting' }
    ]
  },
  {
    title: 'Supplementen & sociaal',
    fields: [
      { key: 'intake_supps', label: 'Supplementen', fmt: fmtMap(N.supps) },
      { key: 'intake_supps_huidige', label: 'Slikt nu' },
      { key: 'intake_wat_werkt_goed', label: 'Werkt goed volgens klant' },
      { key: 'intake_eerder_geprobeerd', label: 'Al geprobeerd' },
      { key: 'intake_cheat', label: 'Cheat meals', fmt: fmtMap(N.cheat) },
      { key: 'intake_sociaal', label: 'Buiten de deur eten', fmt: fmtMap(N.social) }
    ]
  },
  {
    title: 'Voedingsvoorkeuren',
    fields: [
      { key: 'meals_per_day', label: 'Maaltijden per dag' },
      { key: 'loved_foods', label: 'Favoriete voeding' },
      { key: 'hated_foods', label: 'Vermijdt liever' },
      { key: 'allergies', label: 'Allergieën' },
      { key: 'cooking_skill', label: 'Kookvaardigheid', fmt: (v) => humanize(v) },
      { key: 'variety_preference', label: 'Variatie-voorkeur', fmt: (v) => humanize(v) }
    ]
  },
  {
    title: 'Berekende doelen',
    fields: [
      { key: 'tdee', label: 'TDEE', fmt: fmtNum('kcal') },
      { key: 'target_calories', label: 'Streefcalorieën', fmt: fmtNum('kcal') },
      { key: 'intake_surplus', label: 'Surplus / tekort', fmt: fmtNum('kcal') },
      { key: 'target_protein', label: 'Eiwit', fmt: fmtNum('g') },
      { key: 'target_carbs', label: 'Koolhydraten', fmt: fmtNum('g') },
      { key: 'target_fat', label: 'Vetten', fmt: fmtNum('g') }
    ]
  }
]

const PART3_SECTIONS = [
  {
    title: 'Ervaring',
    fields: [
      { key: 'training_willingness', label: 'Trainingsbereidheid', fmt: fmtMap(MAPS.willingness) },
      { key: 'no_training_reason', label: 'Reden geen training' },
      { key: 'default_experience_level', label: 'Ervaringsniveau', fmt: fmtMap(MAPS.experience) }
    ]
  },
  {
    title: 'Praktisch',
    fields: [
      { key: 'default_days_per_week', label: 'Dagen per week', fmt: fmtNum('x') },
      { key: 'default_time_per_session', label: 'Tijd per sessie', fmt: fmtNum('min') },
      { key: 'training_location', label: 'Locatie', fmt: fmtMap(MAPS.location) },
      { key: 'gym_name', label: 'Sportschool' },
      { key: 'default_equipment', label: 'Materiaal', fmt: fmtArr() },
      { key: 'training_time', label: 'Trainingstijd' }
    ]
  },
  {
    title: 'Focus',
    fields: [
      { key: '_split_pref', label: 'Split-voorkeur', fmt: fmtMap(MAPS.split) },
      { key: '_split_focus', label: 'Focus', fmt: fmtArr() },
      { key: 'emphasize_stretch', label: 'Nadruk op stretch', fmt: fmtBool },
      { key: 'prioritize_compounds', label: 'Compound-prioriteit', fmt: fmtBool }
    ]
  },
  {
    title: 'Cardio',
    fields: [
      { key: 'does_cardio', label: 'Doet cardio', fmt: fmtMap(MAPS.yes_no_soms) },
      { key: 'cardio_interest', label: 'Interesse in cardio', fmt: fmtMap(MAPS.yes_no_soms) },
      { key: 'cardio_types', label: 'Type cardio', fmt: fmtArr() },
      { key: 'cardio_frequency', label: 'Frequentie', fmt: fmtNum('x / week') },
      { key: 'cardio_duration', label: 'Duur', fmt: fmtNum('min') }
    ]
  },
  {
    title: 'Beperkingen',
    fields: [
      { key: 'injuries', label: 'Blessures' },
      { key: 'avoided_exercises', label: 'Vermijdt oefeningen' },
      { key: 'other_limitations', label: 'Overige beperkingen' }
    ]
  }
]


// ---- vraagteksten ----------------------------------------------------------
// Letterlijk overgenomen uit de intake zelf (src/modules/public-intake/
// components/phase1 en phase3, de <Q>-elementen). Zo leest de coach dezelfde
// vraag als de klant beantwoordde. Staat een veld hier niet in, dan wordt het
// label als vraag getoond.
const VRAGEN = {
  first_name: 'Wat is je voornaam?',
  last_name: 'En je achternaam?',
  email: 'Wat is je e-mailadres?',
  phone: 'En je telefoonnummer?',
  gender: 'Wat is je geslacht?',
  date_of_birth: 'Wanneer ben je geboren?',
  height: 'Hoe lang ben je?',
  current_weight: 'Wat weeg je nu?',
  current_body_fat: 'Op welk lichaam lijk je het meest?',
  current_body_fat_2: 'Zat je ertussenin? (tweede keuze)',
  primary_goal: 'Wat is je hoofddoel?',
  target_weight: 'Wat is je streefgewicht?',
  has_weight_goal: 'Heb je een gewichtsdoel?',
  target_body_fat: 'Tot welk lichaam wil je?',
  muscle_goal_type: 'Wat voor lichaam wil je opbouwen?',
  lichaam_omschrijving: 'Omschrijf jouw ideale lichaam',
  fitness_doel_tags: 'Wat betekent fitter worden voor jou?',
  goal_timeline: 'Wanneer wil je dit bereiken?',
  goal_urgency: 'Hoe belangrijk is dit doel voor je?',
  motivation: 'Waarom wil je dit bereiken?',
  activity_level: 'Hoe actief ben je op dit moment?',
  cooking_time: 'Hoeveel tijd wil je kwijt aan koken?',
  stress_level: 'Hoeveel stress heb je op dit moment?',
  medical_conditions: 'Heb je medische aandoeningen?',
  previous_coaching: 'Heb je eerder coaching of een dieet gevolgd?',
  wat_werkte_eerder: 'Wat werkte er eerder wél voor jou?',
  waarom_gestopt: 'Waarom stopte je precies?',
  biggest_obstacle: 'Wat is je grootste obstakel?',
  coaching_style_pref: 'Welke coaching stijl past bij jou?',
  coaching_expectations: 'Wat verwacht je van de coaching?',
  coaching_goal_tags: 'Wat wil je halen uit dit traject, naast fysiek resultaat?',
  training_willingness: 'Wil je gaan trainen?',
  no_training_reason: 'Wat houdt je tegen?',
  default_experience_level: 'Hoe lang train je al?',
  default_time_per_session: 'Hoe lang zou je kunnen trainen per sessie?',
  training_location: 'Waar train je?',
  current_training: 'Hoe ziet je huidige training eruit?',
  injuries: 'Heb je blessures of pijn die je training beperken?',
  avoid_exercises: 'Zijn er oefeningen die je wil vermijden?',
  cardio_current: 'Doe je op dit moment al aan cardio?',
  cardio_wants: 'Wil je cardio opnemen in je schema?',
  cardio_type: 'Welke cardio doe je het liefst?',
  cardio_frequency: 'Hoe vaak per week wil je cardio doen?',
  cardio_duration: 'Hoe lang per cardiosessie?',
  preferred_training_days: 'Welke dagen wil je trainen?',
  training_time: 'Hoe laat train je meestal?',
  sleep_hours: 'Hoeveel slaap je per nacht?',
  default_days_per_week: 'Hoeveel dagen per week wil je trainen?',
}


// ---- weekindeling in tekst ------------------------------------------------
// clients.work_schedule bevat per dag wat de klant in de weekbouwer heeft
// aangeklikt: [{ start, end, type }] met type 'kantoor' | 'slaap' | 'training'
// | 'horeca' | 'fysiek' | … Het agenda-plaatje toont dat visueel; hieronder
// staat wát er is ingevuld, in woorden. Beide hebben nut: het plaatje voor de
// verhoudingen, de tekst om te zien welk antwoord erachter zit.
const DAG_NL = { ma: 'Maandag', di: 'Dinsdag', wo: 'Woensdag', do: 'Donderdag', vr: 'Vrijdag', za: 'Zaterdag', zo: 'Zondag' }
const DAG_ORDE = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo']
const TYPE_NL = {
  kantoor: 'Kantoor of thuis', fysiek: 'Fysiek werk', horeca: 'Horeca',
  winkel: 'Winkel', anders: 'Werk', werk: 'Werk',
  slaap: 'Slaap', training: 'Training',
}

function WeekInTekst({ client, isMobile }) {
  const ws = client?.work_schedule
  const heeftWeek = ws && typeof ws === 'object' && Object.keys(ws).length > 0

  const losseAntwoorden = [
    { vraag: 'Wat voor werk doe je?', antwoord: client?.job_type || null },
    { vraag: 'Hoeveel slaap je per nacht?', antwoord: client?.sleep_hours ? `${client.sleep_hours} uur` : null },
    { vraag: 'Hoe laat train je meestal?', antwoord: client?.training_time ? String(client.training_time).slice(0, 5) : null },
    {
      vraag: 'Op welke dagen wil of kan je trainen?',
      antwoord: Array.isArray(client?.preferred_training_days) && client.preferred_training_days.length
        ? client.preferred_training_days.map(d => DAG_NL[d] || d).join(', ')
        : null,
    },
  ]

  return (
    <div style={{ marginTop: '1rem' }}>
      <div style={{
        fontSize: '0.72rem', fontWeight: 900, letterSpacing: '0.08em',
        textTransform: 'uppercase', color: GREEN, marginBottom: '0.6rem',
      }}>
        Wat is ingevuld
      </div>

      <div style={{
        display: 'flex', flexDirection: 'column', gap: 1,
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.06)',
        overflow: 'hidden',
      }}>
        {losseAntwoorden.map(r => (
          <div key={r.vraag} style={{ display: 'flex', flexDirection: 'column', gap: 3, padding: '0.7rem 0.9rem', background: '#111' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>{r.vraag}</span>
            <span style={{
              fontSize: '0.92rem', fontWeight: r.antwoord ? 800 : 600,
              color: r.antwoord ? '#fff' : 'rgba(255,255,255,0.3)',
              fontStyle: r.antwoord ? 'normal' : 'italic',
            }}>
              <span style={{ color: 'rgba(255,255,255,0.35)', fontWeight: 700 }}>Antwoord: </span>
              {r.antwoord || 'niet ingevuld'}
            </span>
          </div>
        ))}

        {DAG_ORDE.filter(d => heeftWeek && Array.isArray(ws[d]) && ws[d].length).map(d => {
          // Dubbele regels komen voor in de opgeslagen data (dezelfde baan
          // twee keer weggeschreven); ontdubbelen op tijd+type.
          const gezien = new Set()
          const items = ws[d].filter(it => {
            const k = `${it.type}|${it.start}|${it.end}`
            if (gezien.has(k)) return false
            gezien.add(k); return true
          })
          return (
            <div key={d} style={{ display: 'flex', flexDirection: 'column', gap: 3, padding: '0.7rem 0.9rem', background: '#111' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>
                Hoe ziet {DAG_NL[d].toLowerCase()} eruit?
              </span>
              <span style={{ fontSize: isMobile ? '0.88rem' : '0.92rem', fontWeight: 800, color: '#fff', lineHeight: 1.5 }}>
                <span style={{ color: 'rgba(255,255,255,0.35)', fontWeight: 700 }}>Antwoord: </span>
                {items.map((it, i) => (
                  <span key={i}>
                    {i > 0 && <span style={{ color: 'rgba(255,255,255,0.3)' }}> · </span>}
                    {TYPE_NL[it.type] || it.type} {it.start}–{it.end}
                  </span>
                ))}
              </span>
            </div>
          )
        })}

        {!heeftWeek && (
          <div style={{ padding: '0.7rem 0.9rem', background: '#111', fontSize: '0.85rem', fontWeight: 600, fontStyle: 'italic', color: 'rgba(255,255,255,0.3)' }}>
            Weekindeling niet ingevuld — werk, slaap en training zijn niet doorgegeven.
          </div>
        )}
      </div>
    </div>
  )
}

// ---- render helpers --------------------------------------------------------

function renderSections(sections, data, toonLeeg = true) {
  const rendered = sections
    .map((section) => {
      const rows = section.fields
        .map((f) => {
          const raw = data?.[f.key]
          const leeg = isEmpty(raw)
          const value = leeg ? null : (f.fmt ? f.fmt(raw) : String(raw))
          // Onbeantwoorde vragen blijven staan: de coach wil zien wát er
          // gevraagd is, ook als de klant het heeft overgeslagen.
          if ((leeg || isEmpty(value)) && !toonLeeg) return null
          return {
            label: f.label,
            vraag: VRAGEN[f.key] || f.label,
            value: (leeg || isEmpty(value)) ? null : value,
          }
        })
        .filter(Boolean)
      return rows.length ? { title: section.title, rows } : null
    })
    .filter(Boolean)

  if (!rendered.length) {
    return (
      <div
        style={{
          padding: '2rem 1rem',
          textAlign: 'center',
          color: 'rgba(255,255,255,0.4)',
          fontSize: '0.9rem'
        }}
      >
        Dit deel van de intake is nog niet ingevuld.
      </div>
    )
  }

  return rendered.map((section) => (
    <div key={section.title} style={{ marginBottom: '1.5rem' }}>
      <div
        style={{
          fontSize: '0.7rem',
          fontWeight: '700',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: GREEN,
          marginBottom: '0.6rem'
        }}
      >
        {section.title}
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '1px',
          background: 'rgba(255,255,255,0.06)',
          borderRadius: '10px',
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.06)'
        }}
      >
        {/* Vraag boven, antwoord eronder. Stond eerder als label links en
            waarde rechts uitgelijnd; bij lange antwoorden werd dat een smalle
            koker tegen de rechterrand. Zo leest het als het gesprek dat het is. */}
        {section.rows.map((row) => (
          <div
            key={row.label}
            style={{
              display: 'flex', flexDirection: 'column', gap: 3,
              padding: '0.7rem 0.9rem',
              background: '#111'
            }}
          >
            <span
              style={{
                fontSize: '0.82rem',
                fontWeight: 700,
                color: 'rgba(255,255,255,0.5)',
                lineHeight: 1.35,
              }}
            >
              {row.vraag}
            </span>
            <span
              style={{
                fontSize: '0.92rem',
                color: row.value ? '#fff' : 'rgba(255,255,255,0.3)',
                fontWeight: row.value ? 800 : 600,
                fontStyle: row.value ? 'normal' : 'italic',
                wordBreak: 'break-word',
                whiteSpace: 'pre-wrap',
                letterSpacing: '-0.01em',
              }}
            >
              <span style={{ color: 'rgba(255,255,255,0.35)', fontWeight: 700 }}>Antwoord: </span>
              {row.value || 'niet ingevuld'}
            </span>
          </div>
        ))}
      </div>
    </div>
  ))
}

// ---- component -------------------------------------------------------------

// `onNavigate(bestemming, client)` wordt door CoachHub ingevuld: die zet de
// klant als geselecteerd en springt naar het juiste tabblad. Zonder die prop
// verschijnen de knoppen niet — dan is er geen plek om heen te springen.
export default function IntakeSummaryModal({ db, client, isMobile, onClose, onNavigate }) {
  const [activeTab, setActiveTab] = useState('part1')
  const [training, setTraining] = useState(null)
  const [clientTraining, setClientTraining] = useState(null)
  const [loadingTraining, setLoadingTraining] = useState(true)
  const [np, setNp] = useState(null)
  const [loadingNp, setLoadingNp] = useState(true)
  // Meetmomenten: nieuwste eerst, zodat een hermeting bovenaan staat en de
  // intake-nulmeting eronder — precies zoals je ze wil vergelijken.
  const [metingen, setMetingen] = useState([])
  useEffect(() => {
    if (!client?.id || !db?.supabase) return
    let weg = false
    db.supabase
      .from('client_baselines')
      .select('*')
      .eq('client_id', client.id)
      .order('measured_at', { ascending: false })
      .then(({ data, error }) => {
        if (weg) return
        if (error) { console.warn('[IntakeSummaryModal] nulmeting laden mislukt:', error.message); return }
        setMetingen(data || [])
      }, (e) => console.warn('[IntakeSummaryModal] nulmeting laden mislukt:', e?.message))
    return () => { weg = true }
  }, [client?.id, db])


  useEffect(() => {
    let cancelled = false
    const loadTraining = async () => {
      setLoadingTraining(true)
      try {
        if (!client?.id || !db?.supabase) {
          if (!cancelled) setTraining(null)
          return
        }
        // user_workout_preferences.user_id = auth_user_id. Het klantobject
        // bevat auth_user_id niet altijd (bv. vanuit het Command Center), en
        // sommige intakes schrijven de training-antwoorden alleen naar de
        // clients-kolommen. Daarom halen we die rij hier op: voor auth_user_id
        // én als fallback-bron voor de training-velden.
        const { data: c } = await db.supabase
          .from('clients')
          .select('auth_user_id, training_experience, training_days, workout_days_per_week, preferred_training_days, training_time, training_info')
          .eq('id', client.id).single()
        if (!cancelled) setClientTraining(c || null)
        const authUserId = client?.auth_user_id || c?.auth_user_id || null
        const ids = [authUserId, client.id].filter(Boolean)
        const { data, error } = ids.length ? await db.supabase
          .from('user_workout_preferences')
          .select('*')
          .in('user_id', ids)
          .order('workout_completed_at', { ascending: false, nullsFirst: false })
          .limit(1) : { data: null, error: null }
        if (error) throw error
        if (!cancelled) setTraining(data?.[0] || null)
      } catch (e) {
        console.error('[IntakeSummaryModal] training load failed:', e)
        if (!cancelled) setTraining(null)
      } finally {
        if (!cancelled) setLoadingTraining(false)
      }
    }
    loadTraining()
    return () => {
      cancelled = true
    }
  }, [client?.id, client?.auth_user_id, db])

  // Rijke voedingsintake uit nutrition_preferences (de /nutritionintake-form).
  // De Voeding-tab toonde voorheen alleen wat verouderde clients-kolommen; deze
  // rij bevat de volledige antwoorden (geneste JSONB).
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoadingNp(true)
      try {
        if (!client?.id || !db?.supabase) { if (!cancelled) setNp(null); return }
        const { data } = await db.supabase
          .from('nutrition_preferences')
          .select('*')
          .eq('client_id', client.id)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        if (!cancelled) setNp(data || null)
      } catch (e) {
        console.error('[IntakeSummaryModal] nutrition_preferences load failed:', e)
        if (!cancelled) setNp(null)
      } finally {
        if (!cancelled) setLoadingNp(false)
      }
    })()
    return () => { cancelled = true }
  }, [client?.id, db])

  // Fallback vanuit de clients-kolommen → op de uwp-veldnamen die de renderer
  // gebruikt. Sommige intakes vullen alleen deze kolommen (geen uwp-rij), dan
  // zou de Training-tab anders leeg blijven.
  const clientFallback = clientTraining
    ? {
        default_experience_level: clientTraining.training_experience || undefined,
        default_days_per_week: clientTraining.training_days ?? clientTraining.workout_days_per_week ?? undefined,
        training_time: clientTraining.training_time || undefined,
        other_limitations: clientTraining.training_info || undefined,
      }
    : {}

  // Merge: uwp-waarden winnen, clients-kolommen vullen de gaten. Zo werkt de
  // Training-tab of de data nu in user_workout_preferences of op clients staat.
  const merged = { ...clientFallback, ...(training || {}) }
  const hasTrainingData = Object.values(merged).some(v => v !== undefined && v !== null && v !== '')
  const trainingData = hasTrainingData
    ? {
        ...merged,
        _split_pref: training?.split_preferences?.preferred,
        _split_focus: training?.split_preferences?.focus
      }
    : null

  const tabs = [
    { id: 'part1', label: 'Persoonlijk', icon: User, done: client?.intake_completed },
    { id: 'part2', label: 'Voeding', icon: Utensils, done: np?.completed || client?.intake_completed },
    { id: 'part3', label: 'Training', icon: Dumbbell, done: training?.workout_completed || (hasTrainingData && client?.intake_completed) },
    // Het eindplaatje: werk, slaap, training en maaltijden in één week.
    // Dit is waar de losse antwoorden op uitkomen, dus het hoort hier.
    { id: 'agenda', label: 'Agenda', icon: CalendarDays, done: false }
  ]

  const fullName = [client?.first_name, client?.last_name].filter(Boolean).join(' ') || 'Client'

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        // Boven de CoachInsight-modal (zIndex 10000) zodat 'ie ook vanuit het
        // Command Center vóór de insight-modal opent, niet erachter.
        zIndex: 10600,
        padding: isMobile ? '0' : '1rem',
        animation: 'fadeIn 0.2s ease'
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#0d0d0d',
          borderRadius: isMobile ? '0' : '16px',
          border: '1px solid rgba(16,185,129,0.25)',
          width: '100%',
          maxWidth: '560px',
          height: isMobile ? '100%' : 'auto',
          maxHeight: isMobile ? '100%' : '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          animation: 'fadeIn 0.3s ease'
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.1rem 1.25rem',
            borderBottom: '1px solid rgba(255,255,255,0.08)'
          }}
        >
          <div>
            <div style={{ fontSize: '1.05rem', fontWeight: '700', color: '#fff' }}>Intake</div>
            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>{fullName}</div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: '#fff',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '0.4rem',
            padding: '0.75rem 1.25rem 0',
            borderBottom: '1px solid rgba(255,255,255,0.08)'
          }}
        >
          {tabs.map((tab) => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  padding: '0.6rem 0.4rem',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: active ? `2px solid ${GREEN}` : '2px solid transparent',
                  color: active ? GREEN : 'rgba(255,255,255,0.55)',
                  fontSize: isMobile ? '0.78rem' : '0.85rem',
                  fontWeight: active ? '700' : '500',
                  cursor: 'pointer',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent'
                }}
              >
                <Icon size={16} />
                {tab.label}
                {tab.done && <CheckCircle2 size={13} color={GREEN} />}
              </button>
            )
          })}
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.25rem',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {/* Doorsteek naar het gereedschap dat bij dit tabblad hoort. Je
              leest de intake meestal om er iets mee te doen; zo hoef je niet
              eerst het modal te sluiten en de klant opnieuw op te zoeken. */}
          {onNavigate && (() => {
            const doel = {
              part1:  { naar: 'command',        tekst: 'Open in Coach Command' },
              part2:  { naar: 'ai-meals',       tekst: 'Open in Plan Analyzer' },
              part3:  { naar: 'workout-builder', tekst: 'Open in Workout Builder' },
              agenda: { naar: 'client-agenda',  tekst: 'Open in Agenda' },
            }[activeTab]
            if (!doel) return null
            return (
              <button
                onClick={() => { onNavigate(doel.naar, client); onClose?.() }}
                style={{
                  width: '100%', marginBottom: '0.85rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                  padding: '0.6rem', border: 'none', borderRadius: 0,
                  background: '#fff', color: '#0a0a0a',
                  fontSize: '0.85rem', fontWeight: 900, fontFamily: 'inherit',
                  cursor: 'pointer',
                  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                }}
              >
                <ExternalLink size={14} strokeWidth={2.6} /> {doel.tekst}
              </button>
            )
          })()}

          {activeTab === 'agenda' && (
            <div style={{ margin: '-0.5rem -0.25rem' }}>
              <ClientAgendaView
                client={client}
                db={db}
                isMobile={isMobile}
                viewerRole="coach"
              />
              <WeekInTekst client={client} isMobile={isMobile} />
            </div>
          )}
          {activeTab === 'part1' && (
            <>
              <Nulmeting metingen={metingen} isMobile={isMobile} />
              {renderSections(PART1_SECTIONS, client)}
            </>
          )}
          {activeTab === 'part2' &&
            (loadingNp ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '2rem',
                  color: 'rgba(255,255,255,0.5)',
                  fontSize: '0.9rem'
                }}
              >
                <Clock size={16} /> Voeding laden…
              </div>
            ) : (
              <>
                <Screenshots urls={np?.voeding_screenshots} isMobile={isMobile} />
                {renderSections(PART2_SECTIONS, { ...client, ...flattenNp(np) })}
              </>
            ))}
          {activeTab === 'part3' &&
            (loadingTraining ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '2rem',
                  color: 'rgba(255,255,255,0.5)',
                  fontSize: '0.9rem'
                }}
              >
                <Clock size={16} /> Training laden…
              </div>
            ) : (
              renderSections(PART3_SECTIONS, trainingData)
            ))}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
