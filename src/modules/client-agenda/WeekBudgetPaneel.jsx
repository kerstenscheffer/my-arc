// src/modules/client-agenda/WeekBudgetPaneel.jsx
//
// Weekbudget en het tekort dat het plan oplevert, uitklapbaar in de agenda.
//
// De agenda is de plek waar de week van een klant bij elkaar komt, dus daar
// hoort ook de vraag thuis: wat geeft dit plan over zeven dagen, en hoeveel
// zit dat onder of boven zijn verbranding.
//
// Verbranding komt uit clients.tdee en niet uit de agendablokken. Dat is een
// bewuste keuze: er staan nauwelijks trainingsblokken in de agenda en geen
// enkel cardio- of wandelblok, dus optellen vanuit de agenda zou voor bijna
// iedereen een te lage verbranding geven. tdee heeft de activiteit al
// verwerkt via activity_level.

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, ChevronRight, Flame, GripVertical, Minus, Maximize2, X, Plus, Trash2 } from 'lucide-react'
import { balkVak, balkVakActief } from './werkbalkStijl'
import useZwevendVenster from '../../components/useZwevendVenster'
import DagRingen from '../ai-meal-generator/tabs/plan-analyzer/DagRingen'
import CardioService from '../workout/services/CardioService'
import { useModalHost } from '../../coach/ModalHost'
import { maakConfig } from '../weight-tracker/utils/coachingBand'

// Vuistregel: ongeveer 7700 kcal per kilo vetweefsel. Een model, geen wet —
// vandaar dat het scherm er "ongeveer" bij zet.
const KCAL_PER_KILO = 7700

const DAGEN = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const PRE_WORKOUT_SLOT = 'pre_workout'

// Stappenband uit de intake naast het ingestelde activiteitsniveau.
//
// De TDEE wordt NIET opnieuw berekend uit de stappen. Dat getal hangt aan de
// macro-targets en aan alles wat daarop rekent; er stilletjes iets anders van
// maken is precies hoe je een fout krijgt die niemand meer kan plaatsen.
//
// Wat hier wél gebeurt: melden wanneer de twee elkaar tegenspreken. Iemand
// die 10.000+ stappen zet maar als "weinig beweging" staat ingesteld heeft
// vrijwel zeker een te lage verbranding staan — en dat verklaart waarom een
// plan niet doet wat het zou moeten doen.
const STAP_LABEL = {
  '4000_6000': '4.000 – 6.000',
  '6000_8000': '6.000 – 8.000',
  '8000_10000': '8.000 – 10.000',
  '10000_plus': '10.000+',
}

// Beide op dezelfde schaal van 0 (zit vooral) tot 3 (de hele dag in beweging),
// zodat "spreken ze elkaar tegen" een rekensom is en geen tabel vol
// uitzonderingen.
const STAP_NIVEAU  = { '4000_6000': 0, '6000_8000': 1, '8000_10000': 2, '10000_plus': 3 }
const ACTIE_NIVEAU = { sedentary: 0, lightly_active: 1, moderately_active: 2, very_active: 3 }
const ACTIE_LABEL  = {
  sedentary: 'weinig beweging', lightly_active: 'licht actief',
  moderately_active: 'matig actief', very_active: 'heel actief',
}

// ── Aannames voor de wat-als-knop ──────────────────────────────────────
//
// Deze getallen zijn schattingen, en het scherm zegt dat er ook bij. Ze zijn
// bedoeld om richting te geven ("wat gebeurt er ongeveer als hij meer gaat
// lopen"), niet om een plan op te bouwen.
//
// Lopen: ongeveer 1.300 stappen per kilometer, en wandelen kost ruwweg een
// halve kcal per kilo per kilometer. Per duizend stappen komt dat neer op
// 0,385 kcal per kilo lichaamsgewicht. Voor iemand van 90 kg is dat ~35 kcal
// per 1.000 stappen; van 6.000 naar 10.000 stappen is dus ~140 kcal per dag.
const KCAL_PER_1000_STAPPEN_PER_KG = 0.385

// Krachttraining: MET van 4 over een uur. kcal = MET x 3,5 x kg / 200 per
// minuut. Bewust aan de voorzichtige kant — krachttraining zit met rustpauzes
// meestal tussen 3,5 en 6 MET, en te hoog schatten laat het tekort groter
// lijken dan het is. Dat is de gevaarlijke kant om fout te zitten. Het scherm
// toont het getal per sessie, zodat je zelf kunt wegen of het klopt.
const MET_KRACHTTRAINING = 4
const TRAINING_MINUTEN = 60

// Cardio per sport, als MET (hoeveel keer het rustverbruik). Bron: Ainsworth
// e.a., Compendium of Physical Activities (2011 update). kcal per minuut =
// MET × 3,5 × kg / 200 — dus voor 90 kg kost zwemmen (6,0 MET) ~9,5 kcal
// per minuut. Rustige, volhoudbare intensiteit; een klant die hard gaat
// verbrandt meer, maar te hoog schatten laat het tekort groter lijken dan
// het is, en dat is de gevaarlijke kant om fout te zitten.
const CARDIO_SOORTEN = [
  { id: 'Wandelen',     label: 'Wandelen (stevig, 5,5 km/u)',   met: 4.3 },
  { id: 'Fietsen',      label: 'Fietsen (matig, 16–19 km/u)',   met: 6.8 },
  { id: 'Zwemmen',      label: 'Zwemmen (rustige baantjes)',    met: 6.0 },
  { id: 'Hardlopen',    label: 'Hardlopen (rustig, 8 km/u)',    met: 8.3 },
  { id: 'Roeien',       label: 'Roeien (matig)',                met: 7.0 },
  { id: 'Crosstrainer', label: 'Crosstrainer',                  met: 5.0 },
  { id: 'Stairmaster',  label: 'Stairmaster',                   met: 9.0 },
  { id: 'HIIT',         label: 'HIIT',                          met: 8.0 },
]
const kcalPerMinuut = (met, kg) => Math.round(met * 3.5 * kg / 200 * 10) / 10
const GEWICHT_AANNAME = 80

// Middelpunt van elke stappenband, om het verschil tussen twee banden te
// kunnen uitrekenen. 10.000+ krijgt 11.000: de band is open, maar doen alsof
// iemand daar 15.000 loopt maakt de schatting alleen maar wilder.
const STAP_MIDDEN = { '4000_6000': 5000, '6000_8000': 7000, '8000_10000': 9000, '10000_plus': 11000 }

const DAG_KORT = {
  monday: 'Ma', tuesday: 'Di', wednesday: 'Wo', thursday: 'Do',
  friday: 'Vr', saturday: 'Za', sunday: 'Zo',
}

/**
 * Wat levert dit weekplan op, per dag en in totaal?
 *
 * De losse pre-workout maaltijd telt mee op trainingsdagen. Die staat in een
 * eigen kolom en zit dus niet in week_structure — zonder deze stap telt hij
 * nergens mee, ook niet in het dagcijfer.
 *
 * Niet geexporteerd: naast een component een functie exporteren breekt
 * hot-reload. Heeft een ander scherm dit nodig, dan hoort het in een eigen
 * util-bestand.
 */
function planPerDag(mealPlan) {
  const week = mealPlan?.week_structure
  if (!week) return null

  const preKcal = Number(mealPlan?.pre_workout_meal?.calories) || 0

  const pre = mealPlan?.pre_workout_meal || {}
  const preEiwit = Number(pre.protein) || 0
  const preKoolh = Number(pre.carbs) || 0
  const preVet = Number(pre.fat) || 0

  const dagen = DAGEN.map(dag => {
    const dagplan = week[dag]
    let kcal = Number(dagplan?.totals?.kcal) || 0
    let eiwit = Number(dagplan?.totals?.protein) || 0
    let koolh = Number(dagplan?.totals?.carbs) || 0
    let vet = Number(dagplan?.totals?.fat) || 0
    const training = !!dagplan?.is_training_day
    // Alleen optellen als de dag geen eigen pre-workout slot heeft; anders
    // zit die maaltijd al in het dagtotaal en zou hij dubbel tellen.
    if (training && preKcal && !dagplan?.[PRE_WORKOUT_SLOT]) { kcal += preKcal; eiwit += preEiwit; koolh += preKoolh; vet += preVet }
    return { dag, label: DAG_KORT[dag], kcal: Math.round(kcal), eiwit: Math.round(eiwit), koolh: Math.round(koolh), vet: Math.round(vet), training }
  })

  const gem = (k) => Math.round(dagen.reduce((t, d) => t + d[k], 0) / 7)
  return {
    dagen,
    totaal: dagen.reduce((t, d) => t + d.kcal, 0),
    eiwitGem: gem('eiwit'), koolhGem: gem('koolh'), vetGem: gem('vet'),
  }
}

// Plus/min-knopje met de afwijking ertussen. Toont bewust "+150" en niet de
// nieuwe absolute waarde: je denkt in "wat als er honderdvijftig bij komt",
// en zo is teruggaan naar nul ook meteen duidelijk.
function Stapper({ label, waarde, eenheid, stap, onChange, toelichting, absoluut = false }) {
  const knop = {
    width: 32, height: 32, flexShrink: 0, borderRadius: 8,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(255,255,255,0.06)',
    borderTop: '1px solid rgba(255,255,255,0.15)',
    borderBottom: '1px solid rgba(255,255,255,0.15)',
    borderLeft: '1px solid rgba(255,255,255,0.15)',
    borderRight: '1px solid rgba(255,255,255,0.15)',
    color: '#fff', fontFamily: 'inherit', fontSize: '0.8rem', fontWeight: 900,
    cursor: 'pointer', lineHeight: 1,
  }
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ flex: 1, minWidth: 0, fontSize: '0.72rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)' }}>
          {label}
        </span>
        <button onClick={() => onChange(waarde - stap)} style={knop}>−</button>
        <span style={{
          minWidth: 34, textAlign: 'center',
          fontSize: '0.8rem', fontWeight: 900, fontVariantNumeric: 'tabular-nums',
          color: (!absoluut && waarde === 0) ? 'rgba(255,255,255,0.35)' : '#fff',
        }}>
          {absoluut ? waarde : waarde > 0 ? `+${waarde}` : waarde}
        </span>
        <button onClick={() => onChange(waarde + stap)} style={knop}>+</button>
      </div>
      <div style={{ fontSize: '0.64rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>
        {eenheid}{toelichting ? ` · ${toelichting}` : ''}
      </div>
    </div>
  )
}

const getal = (n) => new Intl.NumberFormat('nl-NL').format(Math.round(n))

export default function WeekBudgetPaneel({ db, clientId, mealPlan, isMobile, onPlanCardio }) {
  const [open, setOpen] = useState(false)
  // Alle secties dicht; je opent wat je nodig hebt.
  const [secties, setSecties] = useState({})
  const zetSectie = (k) => setSecties(prev => ({ ...prev, [k]: !prev[k] }))
  // Zwevend venster, net als de intake-modal: verslepen aan de kop, groter
  // maken aan de hoek, inklappen tot de balk. Zo zet je het naast de agenda
  // terwijl je maaltijden verschuift en ziet het tempo live meebewegen.
  const modalHost = useModalHost()
  const {
    ingeklapt, setIngeklapt, herstel, vensterStijl, sleepHandvat, formaatHandvat,
  } = useZwevendVenster({ isMobile, standaard: { w: 360, h: 700 } })
  const [tdee, setTdee] = useState(undefined)   // undefined = nog laden
  // Actieve fase (client_phases): doel en streeftempo. null = geen fase.
  const [fase, setFase] = useState(undefined)

  // Wat-als. Alle drie de knoppen zijn afwijkingen van de huidige situatie,
  // niet absolute waarden — zo blijft "terug naar nu" simpelweg alles op nul.
  const [simTdee, setSimTdee] = useState(0)          // kcal per dag erbij of eraf
  const [simTrainingen, setSimTrainingen] = useState(0) // sessies per week erbij
  const [simStappen, setSimStappen] = useState(null)    // andere band, of null
  // Cardio als regels: sport, keer per week, minuten per keer. Zo past het
  // één-op-één op client_cardio_plan bij Opslaan.
  const [simCardio, setSimCardio] = useState([])        // [{ id?, soort, keer, minuten }]
  // Wat er in het cardioplan van de klant staat bij laden: de basis waar de
  // afwijking tegen wordt gerekend, en de maat voor 'is er iets gewijzigd'.
  const [cardioBasis, setCardioBasis] = useState(undefined)   // undefined = nog laden
  const [cardioVerwijderd, setCardioVerwijderd] = useState([])
  const [cardioBezig, setCardioBezig] = useState(false)
  // Schema's om mee door te rekenen en eventueel actief te zetten: eigen
  // plannen van de klant plus de standaardplannen van de coach.
  const [plannen, setPlannen] = useState([])
  const [simPlan, setSimPlan] = useState('')
  const [planBezig, setPlanBezig] = useState(false)
  const [trainingNuOverride, setTrainingNuOverride] = useState(null)
  // Laatste bekende gewicht als de klantkaart er geen heeft: nodig voor
  // training en cardio (kcal hangt aan kg). undefined = nog laden.
  const [gewichtLog, setGewichtLog] = useState(undefined)

  // Pas ophalen als je het paneel opent. De agenda laadt al genoeg bij het
  // openen van de pagina; dit hoeft daar niet bij.
  useEffect(() => {
    if (!open || tdee !== undefined || !db?.supabase || !clientId) return
    let leeft = true
    db.supabase
      .from('clients')
      .select('tdee, target_calories, target_protein, target_carbs, target_fat, primary_goal, first_name, last_name, daily_steps, activity_level, current_weight, body_fat_percentage, age, workout_schedule, assigned_schema_id')
      .eq('id', clientId)
      .maybeSingle()
      .then(({ data }) => { if (leeft) setTdee(data || null) },
            (e) => { console.warn('tdee laden mislukt:', e); if (leeft) setTdee(null) })
    return () => { leeft = false }
  }, [open, tdee, db, clientId])

  useEffect(() => {
    if (!open || gewichtLog !== undefined || !db?.supabase || !clientId) return
    let leeft = true
    ;(async () => {
      try {
        // De dagelijkse wegingen uit de app staan in weight_challenge_logs;
        // de andere twee tabellen zijn oudere invoerpaden. Eerste treffer wint.
        let w = null
        for (const tabel of ['weight_challenge_logs', 'weight_tracking', 'weight_logs']) {
          const { data } = await db.supabase.from(tabel).select('weight, date').eq('client_id', clientId).order('date', { ascending: false }).limit(1)
            .then(r => r, () => ({ data: null }))
          w = Number(data?.[0]?.weight) || null
          if (w) break
        }
        if (leeft) setGewichtLog(w)
      } catch (e) { console.warn('gewicht laden mislukt:', e?.message); if (leeft) setGewichtLog(null) }
    })()
    return () => { leeft = false }
  }, [open, gewichtLog, db, clientId])

  // Cardioplan van de klant en de schema's om mee te spelen.
  useEffect(() => {
    if (!open || cardioBasis !== undefined || !db?.supabase || !clientId) return
    let leeft = true
    ;(async () => {
      try {
        const rijen = await CardioService.getPlan(clientId, db)
        const lijst = (rijen || []).map(r => ({
          id: r.id,
          soort: CARDIO_SOORTEN.some(x => x.id === r.cardio_type) ? r.cardio_type : (CARDIO_SOORTEN.find(x => x.id.toLowerCase() === String(r.cardio_type || '').toLowerCase())?.id || 'Wandelen'),
          keer: Number(r.times_per_week) || 1,
          minuten: Number(r.duration_minutes) || 30,
        }))
        if (!leeft) return
        setSimCardio(lijst)
        setCardioBasis(lijst)
        setCardioVerwijderd([])
      } catch (e) { console.warn('cardioplan laden mislukt:', e?.message); if (leeft) setCardioBasis([]) }
    })()
    return () => { leeft = false }
  }, [open, cardioBasis, db, clientId])

  // Eigen effect: zat dit achter de cardio-lading, dan herstartte het effect
  // zodra het cardioplan binnen was en kwamen de plannen nooit aan.
  const [plannenGeladen, setPlannenGeladen] = useState(false)
  useEffect(() => {
    if (!open || plannenGeladen || !db?.supabase || !clientId) return
    let leeft = true
    ;(async () => {
      try {
        const [eigen, std] = await Promise.all([
          db.getClientWorkoutPlans ? db.getClientWorkoutPlans(clientId) : Promise.resolve({ plans: [] }),
          db.supabase.from('workout_schemas')
            .select('id, name, days_per_week, week_structure')
            .eq('is_template', true).eq('is_public', true)
            .or('is_archived.is.null,is_archived.eq.false')
            .order('days_per_week', { ascending: true }).order('name', { ascending: true })
            .then(r => r, () => ({ data: [] })),
        ])
        if (!leeft) return
        const dagen = (p) => Number(p.days_per_week) || Object.keys(p.week_structure || {}).length || 0
        setPlannen([
          ...(eigen?.plans || []).map(p => ({ id: p.id, naam: p.name, dagen: dagen(p), eigen: true, actief: !!p.isActive })),
          ...(std?.data || []).map(p => ({ id: p.id, naam: p.name, dagen: dagen(p), eigen: false, actief: false })),
        ])
        setPlannenGeladen(true)
      } catch (e) { console.warn('plannen laden mislukt:', e?.message); if (leeft) setPlannenGeladen(true) }
    })()
    return () => { leeft = false }
  }, [open, plannenGeladen, db, clientId])

  // Apart effect: zat dit bij de TDEE in één effect, dan startte dat effect
  // opnieuw zodra de TDEE binnen was en gooide de cleanup het nog lopende
  // fase-antwoord weg. Gevolg: 'geen fase' terwijl er wel een was.
  useEffect(() => {
    if (!open || fase !== undefined || !db?.supabase || !clientId) return
    let leeft = true
    // Nieuwste fase is de actieve, net als in het fase-paneel.
    db.supabase
      .from('client_phases')
      .select('*')
      .eq('client_id', clientId)
      .order('started_on', { ascending: false })
      .limit(1)
      .then(({ data }) => { if (leeft) setFase(data?.[0] || null) },
            (e) => { console.warn('fase laden mislukt:', e); if (leeft) setFase(null) })
    return () => { leeft = false }
  }, [open, fase, db, clientId])

  const perDag = planPerDag(mealPlan)
  const planWeek = perDag ? perDag.totaal : null

  // ── Wat-als: afwijkingen op de verbranding ──
  // Alles hieronder rekent met de effectieve TDEE, zodat het hele venster
  // meebeweegt: Verbrandt, Mag eten, het overschot en het tempo. Geen apart
  // uitkomstvak; 'Terug naar nu' zet alles op nul.
  // Gewicht: klantkaart, anders laatste weging, anders startgewicht van de
  // fase, anders een aanname van 80 kg (en dat staat er dan bij).
  const gewichtBron = Number(tdee?.current_weight) ? 'klantkaart'
    : Number(gewichtLog) ? 'laatste weging'
    : Number(fase?.start_gewicht) ? 'start van de fase'
    : 'aanname'
  const gewicht = Number(tdee?.current_weight) || Number(gewichtLog) || Number(fase?.start_gewicht) || GEWICHT_AANNAME
  const kcalPerTraining = Math.round(MET_KRACHTTRAINING * 3.5 * gewicht / 200 * TRAINING_MINUTEN)
  const kcalPer1000Stappen = Math.round(KCAL_PER_1000_STAPPEN_PER_KG * gewicht)
  const cardioWeek = (rijen) => (rijen || []).reduce((t, r) => {
    const soort = CARDIO_SOORTEN.find(x => x.id === r.soort) || CARDIO_SOORTEN[0]
    return t + kcalPerMinuut(soort.met, gewicht) * (Number(r.minuten) || 0) * (Number(r.keer) || 0)
  }, 0)
  const cardioKcalWeek = cardioWeek(simCardio)
  // Gepland cardio telt mee in de verbranding van nu: dat is wat de klant
  // volgens zijn plan doet, bovenop de TDEE die uit het activiteitsniveau komt.
  const cardioBasisKcalWeek = cardioWeek(cardioBasis || [])
  const cardioGewijzigd = cardioBasis !== undefined && (
    cardioVerwijderd.length > 0 ||
    JSON.stringify(simCardio.map(r => [r.id || null, r.soort, Number(r.keer), Number(r.minuten)])) !==
    JSON.stringify((cardioBasis || []).map(r => [r.id || null, r.soort, Number(r.keer), Number(r.minuten)]))
  )
  // Trainingen nu: de dagen in het weekrooster van de klant.
  const trainingNu = trainingNuOverride ?? Object.values(tdee?.workout_schedule || {}).filter(Boolean).length
  const gekozenPlan = plannen.find(p => p.id === simPlan) || null
  const trainingDelta = simTrainingen + (gekozenPlan ? gekozenPlan.dagen - trainingNu : 0)

  const huidigeBand = tdee?.daily_steps || null
  const stapVerschilPerDag = (() => {
    if (!simStappen || !huidigeBand || !kcalPer1000Stappen) return 0
    const verschil = (STAP_MIDDEN[simStappen] ?? 0) - (STAP_MIDDEN[huidigeBand] ?? 0)
    return Math.round((verschil / 1000) * kcalPer1000Stappen)
  })()
  const extraPerDag = Math.round(
    simTdee
    + stapVerschilPerDag
    + (kcalPerTraining * trainingDelta) / 7
    + (cardioKcalWeek - cardioBasisKcalWeek) / 7
  )
  // Actief zodra er iets is ingesteld, ook als het blok dichtgeklapt is:
  // je klapt het dicht om de tabel en de balken erboven te bekijken, en dan
  // moet het effect juist blijven staan.
  const simActief = extraPerDag !== 0
  const simTerug = () => { setSimTdee(0); setSimTrainingen(0); setSimCardio(cardioBasis || []); setCardioVerwijderd([]); setSimStappen(null); setSimPlan('') }

  // Cardio-regels naar het cardioplan van de klant (workout-pagina, kop
  // Cardio): bestaande regels bijwerken, weggehaalde op inactief, nieuwe
  // erbij. Daarna de agenda in plaatsmodus voor een nieuwe regel.
  const cardioOpslaan = async () => {
    if (!clientId || cardioBezig || !cardioGewijzigd) return
    setCardioBezig(true)
    try {
      for (const id of cardioVerwijderd) await CardioService.deactivatePlanItem(id, db)
      const nieuw = []
      const bewaard = []
      for (const [i, r] of simCardio.entries()) {
        const soort = CARDIO_SOORTEN.find(x => x.id === r.soort) || CARDIO_SOORTEN[0]
        const rij = await CardioService.savePlanItem({
          id: r.id || undefined,
          client_id: clientId, cardio_type: soort.id,
          times_per_week: Math.max(1, Number(r.keer) || 1),
          duration_minutes: Math.max(5, Number(r.minuten) || 30),
          intensity: 'rustig', sort_order: i,
          notes: `± ${Math.round(kcalPerMinuut(soort.met, gewicht) * (Number(r.minuten) || 0))} kcal per keer`,
        }, db)
        const metId = { ...r, id: rij?.id || r.id }
        bewaard.push(metId)
        if (!r.id) nieuw.push(metId)
      }
      setSimCardio(bewaard)
      setCardioBasis(bewaard)
      setCardioVerwijderd([])
      if (nieuw.length > 0) onPlanCardio?.({ label: `Cardio · ${nieuw[0].soort}`, duur: Math.max(5, Number(nieuw[0].minuten) || 30) })
    } catch (e) {
      console.error('cardio opslaan mislukt:', e)
      alert('Cardio opslaan mislukt: ' + (e?.message || 'onbekende fout'))
    } finally { setCardioBezig(false) }
  }

  // Gekozen schema actief zetten voor de klant. Eigen plan: gewoon wisselen.
  // Standaardplan: eigen kopie onder de klant (zoals de toewijzing in de
  // builder), dan actief; de trigger vult de weekindeling.
  const planActiveren = async () => {
    if (!gekozenPlan || !clientId || planBezig) return
    setPlanBezig(true)
    try {
      if (gekozenPlan.eigen) {
        const res = await db.setActiveWorkoutPlan(clientId, gekozenPlan.id)
        if (!res?.success) throw new Error(res?.error || 'Activeren mislukt')
      } else {
        const { data: t, error: leesFout } = await db.supabase.from('workout_schemas').select('*').eq('id', gekozenPlan.id).single()
        if (leesFout || !t) throw (leesFout || new Error('Sjabloon niet gevonden'))
        const naam = [tdee?.first_name, tdee?.last_name].filter(Boolean).join(' ') || null
        const kopie = {
          user_id: t.user_id, name: t.name, description: t.description, primary_goal: t.primary_goal, specific_goal: t.specific_goal,
          experience_level: t.experience_level, days_per_week: t.days_per_week, time_per_session: t.time_per_session,
          equipment: t.equipment, split_type: t.split_type, split_name: t.split_name, week_structure: t.week_structure,
          volume_analysis: t.volume_analysis, specific_goal_data: t.specific_goal_data,
          is_ai_generated: false, is_public: false, is_template: false, is_client_edited: false,
          original_schema_id: t.id, client_id: clientId, client_name: naam, is_archived: false,
        }
        const { data: nieuw, error: insFout } = await db.supabase.from('workout_schemas').insert(kopie).select('id').single()
        if (insFout || !nieuw?.id) throw (insFout || new Error('Kopie maken mislukt'))
        const { error: updFout } = await db.supabase.from('clients').update({ assigned_schema_id: nieuw.id, updated_at: new Date().toISOString() }).eq('id', clientId)
        if (updFout) throw updFout
      }
      setTrainingNuOverride(gekozenPlan.dagen)
      setSimPlan('')
      setPlannen(prev => prev.map(p => ({ ...p, actief: p.id === gekozenPlan.id })))
      if (navigator.vibrate) navigator.vibrate([20, 40, 20])
    } catch (e) {
      console.error('plan activeren mislukt:', e)
      alert('Schema activeren mislukt: ' + (e?.message || 'onbekende fout'))
    } finally { setPlanBezig(false) }
  }
  const tdeeNu = tdee?.tdee ? Number(tdee.tdee) : null
  // 'Nu' = TDEE plus het geplande cardio; daar komt het wat-als bovenop.
  const tdeeBasis = tdeeNu != null ? tdeeNu + Math.round(cardioBasisKcalWeek / 7) : null
  const tdeeEff = tdeeBasis != null ? tdeeBasis + (simActief ? extraPerDag : 0) : null

  const verbranding = tdeeEff != null ? tdeeEff * 7 : null
  const tekort = (planWeek != null && verbranding != null) ? verbranding - planWeek : null
  const kilos = tekort != null ? tekort / KCAL_PER_KILO : null

  // ── Doel en streeftempo uit de fase ──
  // maakConfig is dezelfde rekenaar als de gewichtsgrafiek: richting
  // (afvallen/aankomen/stabiel), weektempo en de band traag–snel.
  const config = (tdee && fase !== undefined) ? maakConfig(tdee, fase) : null
  const richting = config?.richting || null
  const teken = richting === 'afvallen' ? -1 : richting === 'aankomen' ? 1 : 0
  const streefKg = config ? teken * (config.tempoKg || 0) : null          // negatief = afvallen
  const planKg = kilos != null ? -kilos : null                              // negatief = afvallen
  // Tekort dat bij het streeftempo hoort (positief = minder eten dan verbranden).
  const streefTekortWeek = streefKg != null ? -streefKg * KCAL_PER_KILO : null
  const streefPlanWeek = (verbranding != null && streefTekortWeek != null) ? verbranding - streefTekortWeek : null
  const dagDoelKcal = streefPlanWeek != null ? Math.round(streefPlanWeek / 7) : null
  // Afwijking van het plan ten opzichte van het streefplan: positief = te veel.
  const afwijkingWeek = (planWeek != null && streefPlanWeek != null) ? planWeek - streefPlanWeek : null
  // Op tempo: binnen de band traag–snel, in de goede richting.
  const opTempo = (() => {
    if (planKg == null || !config) return null
    if (richting === 'stabiel') return Math.abs(planKg) <= 0.15
    const inRichting = teken === Math.sign(planKg) || planKg === 0
    const abs = Math.abs(planKg)
    return inRichting && abs >= (config.traagKg || 0) && abs <= (config.snelKg || Infinity)
  })()
  const doelLabel = richting === 'afvallen' ? 'Cut' : richting === 'aankomen' ? 'Build' : richting === 'stabiel' ? 'Onderhoud' : null
  const kgTekst = (n) => `${n < 0 ? '−' : n > 0 ? '+' : ''}${Math.abs(n).toFixed(2)} kg`

  const rand = 'rgba(255,255,255,0.1)'
  const regel = (label, waarde, toelichting, kleur = '#fff') => (
    <div style={{
      display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
      gap: 10, padding: '0.5rem 0', borderBottom: `1px solid rgba(255,255,255,0.05)`,
    }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'rgba(255,255,255,0.8)' }}>{label}</div>
        {toelichting && (
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>{toelichting}</div>
        )}
      </div>
      <div style={{ fontSize: '0.95rem', fontWeight: 900, color: kleur, whiteSpace: 'nowrap', flexShrink: 0 }}>
        {waarde}
      </div>
    </div>
  )

  return (
    // Inline in de werkbalk, met de cijfers als uitklap eronder. Als blok
    // over de volle breedte kostte dit een hele regel; nu is het een knop
    // naast de rest en zweeft het paneel over het rooster heen.
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <button onClick={() => setOpen(o => !o)} title="Weekbudget en tekort"
        style={(open ? balkVakActief : balkVak)(isMobile, {
          cursor: 'pointer',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
        })}>
        <Flame size={12} style={{ color: open ? '#b8860b' : '#FFD700' }} />
        {planWeek != null ? `${getal(planWeek)} kcal` : 'Weekbudget'}
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
      </button>

      {open && createPortal(
        <div style={{
          ...vensterStijl,
          background: '#0a0a0a',
          borderRadius: isMobile ? 0 : 14,
          border: isMobile ? 'none' : `1px solid ${rand}`,
          boxShadow: isMobile ? 'none' : '0 12px 48px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.04)',
        }}>
          {/* Kop; op desktop tevens het handvat om te verslepen. */}
          <div
            {...sleepHandvat}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
              padding: isMobile ? 'calc(0.6rem + env(safe-area-inset-top, 0px)) 0.8rem 0.6rem' : '0.55rem 0.75rem',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              ...(sleepHandvat.style || {}),
            }}
          >
            {!isMobile && <GripVertical size={13} color="rgba(255,255,255,0.25)" style={{ flexShrink: 0 }} />}
            <Flame size={14} color="#fff" style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0, fontSize: '0.9rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.015em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Weekbudget{tdee?.first_name ? ` · ${tdee.first_name}` : ''}
            </div>
            {!isMobile && (
              <button onClick={() => setIngeklapt(v => !v)} title={ingeklapt ? 'Uitklappen' : 'Inklappen'} aria-label={ingeklapt ? 'Uitklappen' : 'Inklappen'} style={kopKnop}>
                <Minus size={13} />
              </button>
            )}
            {!isMobile && (
              <button onClick={herstel} title="Terug naar het midden" aria-label="Terug naar het midden" style={kopKnop}>
                <Maximize2 size={13} />
              </button>
            )}
            <button onClick={() => setOpen(false)} title="Sluiten" aria-label="Sluiten" style={kopKnop}>
              <X size={13} />
            </button>
          </div>

          {/* Zolang 'Wat als' iets doet: een regel bovenin, waar je ook kijkt. */}
          {!ingeklapt && simActief && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexShrink: 0,
              padding: '0.4rem 0.8rem', background: 'rgba(34,197,94,0.12)', borderBottom: '1px solid rgba(34,197,94,0.3)',
            }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#22c55e' }}>
                Wat als: verbranding {extraPerDag > 0 ? '+' : '−'}{getal(Math.abs(extraPerDag))} kcal per dag
              </span>
              <button onClick={simTerug} style={{
                flexShrink: 0, minHeight: 28, padding: '0 0.6rem', borderRadius: 8,
                background: 'transparent', border: '1px solid rgba(34,197,94,0.5)',
                color: '#22c55e', fontFamily: 'inherit', fontSize: '0.68rem', fontWeight: 900, cursor: 'pointer',
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              }}>
                Terug naar nu
              </button>
            </div>
          )}

          {!ingeklapt && (
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '0.25rem 0.8rem 0.8rem' }}>
          {planWeek == null ? (
            <div style={{ padding: '0.6rem 0', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
              Geen actief weekplan voor deze klant.
            </div>
          ) : (
            <>
              <Sectie
                titel="Doel"
                open={!!secties.doel} onToggle={() => zetSectie('doel')}
                samenvatting={config && doelLabel ? `${doelLabel} · ${richting === 'stabiel' ? '0 kg' : kgTekst(streefKg)} per week` : 'geen fase'}
              >
              {/* Doel en streeftempo. Dit is waar je op stuurt; de rest van
                  het paneel vergelijkt het plan hiermee. */}
              {fase !== undefined && tdee !== undefined && (
                <div style={{ padding: '0.5rem 0 0.6rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  {config && doelLabel ? (
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: 900, color: '#fff' }}>
                        {doelLabel}
                      </div>
                      <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 900, color: '#fff' }}>
                          {richting === 'stabiel' ? '0 kg' : kgTekst(streefKg)}
                        </span>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}> per week</span>
                        {richting !== 'stabiel' && (config.traagKg || config.snelKg) ? (
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>
                            {' '}· {config.traagKg.toFixed(2)}–{config.snelKg.toFixed(2)}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)', lineHeight: 1.4 }}>
                      Geen fase ingesteld. Zet in het fase-paneel een doel en weektempo, dan vergelijkt dit paneel het plan daarmee.
                      {tdee?.target_calories ? ` Target op de klant: ${getal(tdee.target_calories)} kcal.` : ''}
                    </div>
                  )}
                </div>
              )}

              {/* De drie getallen waar het om draait, per dag: wat hij
                  verbrandt, wat het plan geeft, en wat hij mag eten om op
                  het streeftempo te zitten (als de TDEE klopt). */}
              {tdee !== undefined && (
                <div style={{ display: 'flex', gap: 6, padding: '0.5rem 0 0.2rem' }}>
                  {[
                    { label: 'Verbrandt', sub: simActief ? `wat als · nu ${getal(tdeeBasis)}` : (cardioBasisKcalWeek > 0 ? 'TDEE + cardio per dag' : 'TDEE per dag'), waarde: tdeeEff != null ? getal(tdeeEff) : '?', kleur: simActief ? '#22c55e' : '#fff' },
                    { label: 'Plan geeft', sub: 'per dag', waarde: getal(planWeek / 7), kleur: '#fff' },
                    {
                      label: 'Mag eten', sub: 'voor streeftempo',
                      waarde: dagDoelKcal != null ? getal(dagDoelKcal) : '?',
                      kleur: dagDoelKcal != null ? (opTempo ? '#22c55e' : '#fff') : 'rgba(255,255,255,0.4)',
                    },
                  ].map(x => (
                    <div key={x.label} style={{ flex: 1, minWidth: 0, textAlign: 'center', padding: '0.15rem 0' }}>
                      <div style={{ fontSize: '1.05rem', fontWeight: 900, color: x.kleur, lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>{x.waarde}</div>
                      <div style={{ fontSize: '0.66rem', fontWeight: 800, color: 'rgba(255,255,255,0.75)', marginTop: 3, whiteSpace: 'nowrap' }}>{x.label}</div>
                      <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' }}>{x.sub}</div>
                    </div>
                  ))}
                </div>
              )}
              {/* Eén korte regel onder de tegels: het verschil per dag, en
                  alleen als het nodig is een tweede over de target. */}
              {dagDoelKcal != null && planWeek != null && (() => {
                const v = Math.round(planWeek / 7 - dagDoelKcal)
                const targetWijkt = tdee?.target_calories && Math.abs(tdee.target_calories - dagDoelKcal) > 100
                return (
                  <div style={{ padding: '0.4rem 0 0', fontSize: '0.72rem', fontWeight: 800, lineHeight: 1.4 }}>
                    <span style={{ color: Math.abs(v) <= 50 ? '#22c55e' : v > 0 ? '#f59e0b' : '#fff' }}>
                      {Math.abs(v) <= 50 ? 'Plan zit op wat hij mag eten.' : v > 0 ? `${getal(v)} kcal per dag te veel.` : `${getal(-v)} kcal per dag ruimte.`}
                    </span>
                    {targetWijkt && (
                      <span style={{ color: 'rgba(255,255,255,0.45)' }}>
                        {' '}Target klant {getal(tdee.target_calories)}, tempo vraagt {getal(dagDoelKcal)}.
                      </span>
                    )}
                  </div>
                )
              })()}

              {tdee === undefined && regel('Verbranding', '…', 'laden')}

              {tdee !== undefined && verbranding == null && regel(
                'Verbranding', 'onbekend',
                'geen TDEE ingevuld bij deze klant', 'rgba(255,255,255,0.4)'
              )}

              {verbranding != null && (<>
                  {tdee?.daily_steps && (() => {
                    const stapN = STAP_NIVEAU[tdee.daily_steps]
                    const actieN = ACTIE_NIVEAU[tdee.activity_level]
                    // Pas melden bij een écht verschil. Eén stap ernaast is
                    // ruis; twee of meer betekent dat er iets niet klopt.
                    const botst = stapN != null && actieN != null && Math.abs(stapN - actieN) >= 2
                    const teLaag = botst && stapN > actieN
                    return (
                      <div style={{ padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
                          <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'rgba(255,255,255,0.75)' }}>
                            Stappen per dag
                          </div>
                          <div style={{ fontSize: '0.95rem', fontWeight: 900, whiteSpace: 'nowrap', color: botst ? '#f59e0b' : '#fff' }}>
                            {STAP_LABEL[tdee.daily_steps] || tdee.daily_steps}
                          </div>
                        </div>
                        <div style={{ fontSize: '0.62rem', fontWeight: 600, color: 'rgba(255,255,255,0.3)' }}>
                          {tdee.activity_level
                            ? `staat ingesteld als ${ACTIE_LABEL[tdee.activity_level] || tdee.activity_level}`
                            : 'geen activiteitsniveau ingesteld'}
                        </div>
                        {botst && (
                          <div style={{ marginTop: 3, fontSize: '0.62rem', fontWeight: 800, color: '#f59e0b', lineHeight: 1.35 }}>
                            Die twee spreken elkaar tegen. De verbranding hierboven is
                            {teLaag ? ' waarschijnlijk te laag' : ' waarschijnlijk te hoog'} — controleer
                            het activiteitsniveau voordat je op dit tekort stuurt.
                          </div>
                        )}
                      </div>
                    )
                  })()}
                  {/* Tekort (cut) of overschot (build): wat het doeltempo
                      vraagt, en wat het plan nu geeft met het tempo dat daar
                      bij hoort. Het woord volgt de richting van de fase. */}
              </>)}
              </Sectie>

              <Sectie
                titel="Plan geeft"
                open={!!secties.plan} onToggle={() => zetSectie('plan')}
                samenvatting={`${getal(planWeek / 7)} kcal per dag · ${perDag.eiwitGem} g eiwit`}
              >
                <div style={{ margin: '0 -0.5rem' }}>
                  <DagRingen
                    totalen={{ calories: planWeek / 7, protein: perDag.eiwitGem, carbs: perDag.koolhGem, fat: perDag.vetGem }}
                    targets={{ calories: tdee?.target_calories, protein: tdee?.target_protein, carbs: tdee?.target_carbs, fat: tdee?.target_fat }}
                    isMobile
                  />
                </div>
              </Sectie>

              {verbranding != null && (
                <Sectie
                  titel={tekort >= 0 ? 'Tekort' : 'Overschot'}
                  open={!!secties.tekort} onToggle={() => zetSectie('tekort')}
                  samenvatting={`${getal(Math.abs(tekort))} kcal per week · ${kgTekst(planKg)}`}
                  kleur={opTempo === true ? '#22c55e' : opTempo === false ? '#f59e0b' : null}
                >
                  {/* Tabel: links wat het is (doeltempo, dit plan), boven de
                      periode (dag, week, maand), in elk vak de kcal en de kilo's
                      die dat oplevert. Het woord volgt het getal: een plan dat
                      meer geeft dan de verbranding heeft een overschot, ook
                      in een cut. */}
                  {(() => {
                    const rijen = [
                      streefTekortWeek != null
                        ? { label: `${streefTekortWeek >= 0 ? 'Tekort' : 'Overschot'} voor doeltempo`, week: streefTekortWeek, kleur: '#fff' }
                        : { label: 'Doeltempo', leeg: 'geen fase ingesteld' },
                      {
                        label: `${tekort >= 0 ? 'Tekort' : 'Overschot'} in dit plan`,
                        week: tekort,
                        kleur: opTempo === true ? '#22c55e' : opTempo === false ? '#f59e0b' : '#fff',
                      },
                    ]
                    const kolommen = [
                      { label: 'Dag', factor: 1 / 7 },
                      { label: 'Week', factor: 1 },
                      { label: 'Maand', factor: 52 / 12 },
                    ]
                    const cel = { padding: '0.4rem 0.3rem', textAlign: 'right', whiteSpace: 'nowrap', verticalAlign: 'top' }
                    return (
                      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '0.4rem' }}>
                        <thead>
                          <tr>
                            <th style={{ ...cel, textAlign: 'left', fontSize: '0.64rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', paddingLeft: 0 }}></th>
                            {kolommen.map(k => (
                              <th key={k.label} style={{ ...cel, fontSize: '0.64rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k.label}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {rijen.map(r => (
                            <tr key={r.label} style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                              <td style={{ ...cel, textAlign: 'left', paddingLeft: 0, fontSize: '0.74rem', fontWeight: 800, color: 'rgba(255,255,255,0.8)', whiteSpace: 'normal' }}>
                                {r.label}
                              </td>
                              {r.leeg ? (
                                <td colSpan={3} style={{ ...cel, fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>{r.leeg}</td>
                              ) : kolommen.map(k => {
                                const kcal = r.week * k.factor
                                const kg = -kcal / KCAL_PER_KILO   // tekort = kilo's eraf
                                return (
                                  <td key={k.label} style={cel}>
                                    <div style={{ fontSize: '0.8rem', fontWeight: 900, color: r.kleur, fontVariantNumeric: 'tabular-nums' }}>{getal(Math.abs(kcal))}</div>
                                    <div style={{ fontSize: '0.64rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)', fontVariantNumeric: 'tabular-nums' }}>{kgTekst(kg)}</div>
                                  </td>
                                )
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )
                  })()}
                  {afwijkingWeek != null && (
                    <div style={{ padding: '0.5rem 0 0', fontSize: '0.78rem', fontWeight: 800, lineHeight: 1.4, color: opTempo ? '#22c55e' : '#fff' }}>
                      {opTempo
                        ? 'Op tempo. Dit plan zit binnen de band.'
                        : Math.abs(afwijkingWeek) < 100
                          ? 'Vrijwel op het doeltempo.'
                          : afwijkingWeek > 0
                            ? `${getal(afwijkingWeek)} kcal per week te veel voor het doeltempo · ${getal(afwijkingWeek / 7)} per dag eraf`
                            : `${getal(-afwijkingWeek)} kcal per week te weinig voor het doeltempo · ${getal(-afwijkingWeek / 7)} per dag erbij`}
                    </div>
                  )}
                  <div style={{ fontSize: '0.66rem', fontWeight: 600, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>
                    Schatting op 7700 kcal per kilo. Wat de weegschaal doet blijft leidend.
                  </div>

                </Sectie>
              )}

              <Sectie
                titel="Per dag"
                open={!!secties.perdag} onToggle={() => zetSectie('perdag')}
                samenvatting={dagDoelKcal != null ? `doel ${getal(dagDoelKcal)} kcal per dag` : (tdeeEff ? `verbranding ${getal(tdeeEff)} per dag` : null)}
              >
                  {(() => {
                  // Staafjes en de TDEE-lijn delen dezelfde schaal, anders
                  // zegt "erboven of eronder" niets. De schaal loopt daarom
                  // tot de hoogste van beide.
                  const dagTdee = tdeeEff || null
                  const hoogste = Math.max(...perDag.dagen.map(x => x.kcal), dagTdee || 0, dagDoelKcal || 0, 1)
                  // Ruim hoog: het verschil tussen "vult het blok" en
                  // "blijft eronder" is de hele boodschap, en op 44px zag je
                  // dat nauwelijks.
                  const H = 78

                  return (
                    <>
                      {/* Per dag een grijs blok met stippelrand: dat is de
                          verbranding van die dag. De staaf ervoor is wat het
                          plan geeft. Loopt de staaf tot de bovenrand, dan eet
                          hij op onderhoud; blijft hij eronder, dan is dat het
                          tekort van die dag. */}
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: H }}>
                        {perDag.dagen.map(d => {
                          const hoogte = Math.max(3, Math.round((d.kcal / hoogste) * H))
                          const tdeeHoogte = dagTdee ? Math.round((dagTdee / hoogste) * H) : null
                          const boven = dagTdee != null && d.kcal > dagTdee
                          return (
                            <div key={d.dag}
                              title={`${d.label}: ${getal(d.kcal)} kcal${dagTdee ? ` van ${getal(dagTdee)}` : ''}${d.training ? ' · trainingsdag' : ''}`}
                              style={{ flex: 1, minWidth: 0, position: 'relative', height: '100%' }}>
                              {tdeeHoogte != null && (
                                <div style={{
                                  position: 'absolute', left: 0, right: 0, bottom: 0,
                                  height: tdeeHoogte,
                                  background: 'rgba(255,255,255,0.05)',
                                  borderTop: '1px dashed rgba(255,255,255,0.35)',
                                  borderBottom: '1px dashed rgba(255,255,255,0.12)',
                                  borderLeft: '1px dashed rgba(255,255,255,0.18)',
                                  borderRight: '1px dashed rgba(255,255,255,0.18)',
                                  boxSizing: 'border-box',
                                }} />
                              )}
                              {/* Even breed als het blok erachter: zo lees je
                                  het als een gevuld vak, niet als een doosje
                                  in een doosje. Wat er boven de vulling aan
                                  stippelrand overblijft, is het tekort. */}
                              <div style={{
                                position: 'absolute', left: 0, right: 0, bottom: 0,
                                height: hoogte,
                                background: d.training ? 'rgba(255,255,255,0.85)' : (boven ? '#f59e0b' : 'rgba(255,255,255,0.5)'),
                              }} />
                              {/* Doellijn: zoveel mag de dag geven om op het
                                  streeftempo te zitten. */}
                              {dagDoelKcal != null && (
                                <div style={{
                                  position: 'absolute', left: 0, right: 0,
                                  bottom: Math.round((dagDoelKcal / hoogste) * H),
                                  borderTop: '2px solid #22c55e', pointerEvents: 'none',
                                }} />
                              )}
                            </div>
                          )
                        })}
                      </div>

                      <div style={{ display: 'flex', gap: 3, marginTop: 4 }}>
                        {perDag.dagen.map(d => {
                          // Verschil met het doel per dag als er een fase is, anders met de verbranding.
                          const ijk = dagDoelKcal ?? dagTdee
                          const verschil = ijk != null ? d.kcal - ijk : null
                          return (
                            <div key={d.dag} style={{ flex: 1, minWidth: 0, textAlign: 'center' }}>
                              <div style={{ fontSize: '0.64rem', fontWeight: 800, color: 'rgba(255,255,255,0.6)' }}>
                                {d.label}
                              </div>
                              <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>
                                {d.kcal >= 1000 ? `${(d.kcal / 1000).toFixed(1)}k` : d.kcal}
                              </div>
                              {verschil != null && (
                                <div style={{
                                  fontSize: '0.62rem', fontWeight: 800,
                                  color: Math.abs(verschil) <= 100 ? '#22c55e' : verschil < 0 ? 'rgba(255,255,255,0.6)' : '#f59e0b',
                                }}>
                                  {verschil <= 0 ? '−' : '+'}{Math.abs(verschil) >= 1000
                                    ? `${(Math.abs(verschil) / 1000).toFixed(1)}k`
                                    : Math.abs(verschil)}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>

                      {dagTdee != null && (
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 5, marginTop: 6,
                          fontSize: '0.66rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)',
                        }}>
                          <span style={{
                            width: 12, height: 9,
                            background: 'rgba(255,255,255,0.05)',
                            borderTop: '1px dashed rgba(255,255,255,0.35)',
                            borderBottom: '1px dashed rgba(255,255,255,0.12)',
                            borderLeft: '1px dashed rgba(255,255,255,0.18)',
                            borderRight: '1px dashed rgba(255,255,255,0.18)',
                            boxSizing: 'border-box', flexShrink: 0,
                          }} />
                          Verbranding {getal(dagTdee)} kcal per dag
                          {dagDoelKcal != null && (
                            <>
                              <span style={{ width: 12, borderTop: '2px solid #22c55e', flexShrink: 0, marginLeft: 6 }} />
                              doel {getal(dagDoelKcal)}
                            </>
                          )}
                        </div>
                      )}
                    </>
                  )
                })()}
              </Sectie>

              {verbranding != null && (
                <Sectie
                  titel="Wat als"
                  open={!!secties.watals} onToggle={() => zetSectie('watals')}
                  samenvatting={simActief ? `verbranding ${extraPerDag > 0 ? '+' : '−'}${getal(Math.abs(extraPerDag))} kcal per dag` : 'TDEE, training, stappen, cardio'}
                  kleur={simActief ? '#22c55e' : null}
                >
                    <div style={{ marginTop: '0.6rem', display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <Stapper
                        label="TDEE"
                        waarde={simTdee}
                        eenheid="kcal per dag"
                        stap={50}
                        onChange={setSimTdee}
                        toelichting={`nu ${getal(tdeeNu)}`}
                      />
                      <Stapper
                        label="Trainingen"
                        waarde={simTrainingen}
                        eenheid="per week"
                        stap={1}
                        onChange={(v) => setSimTrainingen(Math.max(-7, v))}
                        toelichting={`nu ${trainingNu} per week · ± ${kcalPerTraining} kcal per uur krachttraining`}
                      />
                      {/* Ander schema: eigen plannen van de klant en de
                          standaardplannen, op aantal dagen. Kiezen rekent
                          door; de knop zet het ook echt actief. */}
                      {plannen.length > 0 && (
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ flex: 1, minWidth: 0, fontSize: '0.72rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)' }}>Schema</span>
                            <select value={simPlan} onChange={e => setSimPlan(e.target.value)} style={{ ...selectStijl, flex: '0 1 60%' }}>
                              <option value="" style={{ background: '#1a1a1a' }}>huidig · {trainingNu} dagen</option>
                              {plannen.some(p => p.eigen) && (
                                <optgroup label="Eigen plannen" style={{ background: '#1a1a1a' }}>
                                  {plannen.filter(p => p.eigen).map(p => (
                                    <option key={p.id} value={p.id} style={{ background: '#1a1a1a' }}>{p.dagen}× · {p.naam}{p.actief ? ' (actief)' : ''}</option>
                                  ))}
                                </optgroup>
                              )}
                              {plannen.some(p => !p.eigen) && (
                                <optgroup label="Standaardplannen" style={{ background: '#1a1a1a' }}>
                                  {plannen.filter(p => !p.eigen).map(p => (
                                    <option key={p.id} value={p.id} style={{ background: '#1a1a1a' }}>{p.dagen}× · {p.naam}</option>
                                  ))}
                                </optgroup>
                              )}
                            </select>
                          </div>
                          {gekozenPlan && (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 6 }}>
                              <span style={{ fontSize: '0.66rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)' }}>
                                {gekozenPlan.dagen} dagen: {gekozenPlan.dagen - trainingNu >= 0 ? '+' : ''}{gekozenPlan.dagen - trainingNu} training per week
                              </span>
                              {!gekozenPlan.actief && (
                                <button onClick={planActiveren} disabled={planBezig} style={{
                                  flexShrink: 0, minHeight: 32, padding: '0 0.7rem', borderRadius: 8,
                                  background: '#fff', border: 'none', color: '#0a0a0a',
                                  fontFamily: 'inherit', fontSize: '0.72rem', fontWeight: 900, cursor: planBezig ? 'wait' : 'pointer',
                                  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                                }}>
                                  {planBezig ? 'Bezig…' : 'Activeer voor klant'}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Cardio: per regel een sport, keer per week en minuten.
                          kcal uit de MET van de sport en het gewicht. */}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)' }}>Cardio</span>
                          <button
                            onClick={() => setSimCardio(r => [...r, { soort: 'Wandelen', keer: 3, minuten: 30 }])}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, minHeight: 32, padding: '0 0.6rem', borderRadius: 8, background: 'transparent', border: '1px solid rgba(255,255,255,0.25)', color: '#fff', fontFamily: 'inherit', fontSize: '0.7rem', fontWeight: 900, cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
                          >
                            <Plus size={12} strokeWidth={3} /> Cardio
                          </button>
                        </div>
                        {simCardio.map((r, i) => {
                          const soort = CARDIO_SOORTEN.find(x => x.id === r.soort) || CARDIO_SOORTEN[0]
                          const perMin = kcalPerMinuut(soort.met, gewicht)
                          const perKeer = Math.round(perMin * (Number(r.minuten) || 0))
                          const perWeek = perKeer * (Number(r.keer) || 0)
                          const zet = (veld, v) => setSimCardio(rows => rows.map((x, j) => j === i ? { ...x, [veld]: v } : x))
                          return (
                            <div key={i} style={{ padding: '0.45rem 0', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <select value={r.soort} onChange={e => zet('soort', e.target.value)} style={selectStijl}>
                                  {CARDIO_SOORTEN.map(x => <option key={x.id} value={x.id} style={{ background: '#1a1a1a' }}>{x.label}</option>)}
                                </select>
                                <button onClick={() => { if (r.id) setCardioVerwijderd(v => [...v, r.id]); setSimCardio(rows => rows.filter((_, j) => j !== i)) }} aria-label="Regel weghalen" style={{ ...kopKnop, width: 32, height: 32 }}>
                                  <Trash2 size={13} />
                                </button>
                              </div>
                              <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <Stapper absoluut label="Keer" waarde={Number(r.keer) || 0} eenheid="per week" stap={1} onChange={(v) => zet('keer', Math.max(0, v))} />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <Stapper absoluut label="Minuten" waarde={Number(r.minuten) || 0} eenheid="per keer" stap={5} onChange={(v) => zet('minuten', Math.max(0, v))} />
                                </div>
                              </div>
                              <div style={{ fontSize: '0.66rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>
                                {r.id ? <span style={{ color: '#22c55e' }}>in plan · </span> : <span style={{ color: '#fff' }}>nieuw · </span>}
                                ± {perMin} kcal per minuut bij {Math.round(gewicht)} kg · {perKeer} per keer · <span style={{ color: '#fff' }}>{getal(perWeek)} kcal per week</span>
                              </div>
                            </div>
                          )
                        })}
                        {(cardioGewijzigd || cardioBezig) && (
                          <button
                            onClick={cardioOpslaan}
                            disabled={cardioBezig}
                            style={{
                              width: '100%', minHeight: 40, marginTop: 6, borderRadius: 10,
                              background: '#fff', border: 'none', color: '#0a0a0a',
                              fontFamily: 'inherit', fontSize: '0.78rem', fontWeight: 900, cursor: cardioBezig ? 'wait' : 'pointer',
                              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                            }}
                          >
                            {cardioBezig ? 'Opslaan…' : cardioVerwijderd.length > 0 && simCardio.every(r => r.id) ? 'Wijzigingen opslaan in cardioplan' : 'Opslaan in cardioplan en inplannen'}
                          </button>
                        )}
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ flex: 1, minWidth: 0, fontSize: '0.72rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)' }}>Stappen</span>
                          <select
                            value={simStappen || ''}
                            onChange={e => setSimStappen(e.target.value || null)}
                            style={{
                              minHeight: 32, padding: '0 0.5rem',
                              background: 'rgba(255,255,255,0.05)',
                              border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8,
                              color: '#fff', fontSize: '0.74rem', fontWeight: 800,
                              fontFamily: 'inherit', outline: 'none', cursor: 'pointer',
                            }}
                          >
                            <option value="" style={{ background: '#1a1a1a' }}>
                              {huidigeBand ? `nu ${STAP_LABEL[huidigeBand]}` : 'niet bekend'}
                            </option>
                            {Object.keys(STAP_MIDDEN).map(b => (
                              <option key={b} value={b} style={{ background: '#1a1a1a' }}>{STAP_LABEL[b]}</option>
                            ))}
                          </select>
                        </div>
                        <div style={{ fontSize: '0.64rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                          {!huidigeBand
                            ? 'Geen stappen uit de intake; dan valt er niets te vergelijken.'
                            : stapVerschilPerDag !== 0
                              ? `${stapVerschilPerDag > 0 ? '+' : '−'}${Math.abs(stapVerschilPerDag)} kcal per dag`
                              : `± ${kcalPer1000Stappen} kcal per 1.000 stappen`}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        <span style={{ fontSize: '0.64rem', fontWeight: 600, color: gewichtBron === 'aanname' ? '#f59e0b' : 'rgba(255,255,255,0.35)', lineHeight: 1.35 }}>
                          Gerekend met {Math.round(gewicht)} kg ({gewichtBron}). Gepland cardio telt mee in de verbranding. Schattingen; wijzigt niets behalve bij Opslaan en Activeer.
                        </span>
                        {simActief && (
                          <button
                            onClick={simTerug}
                            style={{
                              flexShrink: 0, minHeight: 32, padding: '0 0.7rem', borderRadius: 8,
                              background: 'transparent', border: '1px solid rgba(255,255,255,0.25)',
                              color: '#fff', fontFamily: 'inherit', fontSize: '0.72rem', fontWeight: 900, cursor: 'pointer',
                              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                            }}
                          >
                            Terug naar nu
                          </button>
                        )}
                      </div>
                    </div>

                </Sectie>
              )}
            </>
          )}
          </div>
          )}

          {/* Hoekje rechtsonder om het venster groter te maken. */}
          {formaatHandvat && !ingeklapt && (
            <div
              {...formaatHandvat}
              style={{
                position: 'absolute', bottom: 0, right: 0,
                width: 16, height: 16, cursor: 'se-resize',
                display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', padding: 3,
              }}
            >
              <div style={{ width: 8, height: 8, borderRight: '2px solid rgba(255,255,255,0.2)', borderBottom: '2px solid rgba(255,255,255,0.2)' }} />
            </div>
          )}
        </div>,
        modalHost || document.body
      )}
    </div>
  )
}

// Eén sectie van het venster: kop met wit label (zwarte tekst) als
// dropdown, rechts een korte samenvatting en het pijltje. Dicht = alleen de kop.
function Sectie({ titel, samenvatting, kleur, open, onToggle, children }) {
  return (
    <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
      <button
        onClick={onToggle}
        aria-expanded={open}
        style={{
          width: '100%', minHeight: 44, display: 'flex', alignItems: 'center', gap: 10,
          padding: '0.35rem 0', background: 'none', border: 'none',
          fontFamily: 'inherit', cursor: 'pointer', textAlign: 'left',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
        }}
      >
        <span style={{
          flexShrink: 0, fontSize: '0.64rem', fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase',
          color: '#000', background: '#fff', borderRadius: 6, padding: '3px 8px',
        }}>
          {titel}
        </span>
        <span style={{ flex: 1, minWidth: 0, fontSize: '0.72rem', fontWeight: 700, color: kleur || 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'right' }}>
          {samenvatting || ''}
        </span>
        <ChevronDown size={14} color="rgba(255,255,255,0.5)" style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
      </button>
      {open && <div style={{ paddingBottom: '0.6rem' }}>{children}</div>}
    </div>
  )
}

const selectStijl = {
  flex: 1, minWidth: 0, minHeight: 32, padding: '0 0.5rem',
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8,
  color: '#fff', fontSize: '0.74rem', fontWeight: 800, fontFamily: 'inherit', outline: 'none', cursor: 'pointer',
}

const kopKnop = {
  width: 30, height: 30, flexShrink: 0, padding: 0,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
  color: 'rgba(255,255,255,0.75)', cursor: 'pointer', fontFamily: 'inherit',
  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
}
