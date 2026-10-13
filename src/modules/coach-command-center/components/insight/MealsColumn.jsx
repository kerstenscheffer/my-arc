// src/modules/coach-command-center/components/insight/MealsColumn.jsx
// Voeding drill-down: Days → Meal detail
// Props: { client, mealData, isMobile, onNavigatePlan, onClose, db, coachId, onGeneratePlan }
//
// 13 okt 2026: de dagen komen niet meer uit mealData (dat zijn er maar 7, voor
// alle klanten tegelijk opgehaald) maar uit een eigen query per klant, met
// "Oudere dagen" om verder terug te kijken. Elke log toont zijn bron (Plan,
// Wissel, Barcode, Eigen maaltijd…) en het Inzicht-scherm van de klant opent
// hier ook.

import React, { useEffect, useMemo, useState } from 'react'
import {
  UtensilsCrossed, ChevronRight, ArrowLeft, Zap, BarChart3, Droplet, Info,
  ClipboardCheck, Repeat, Pencil, Database, ScanBarcode, Search, ChefHat, Keyboard, History, CalendarDays,
} from 'lucide-react'
import MealDaySummaryModal from '../../../meal-plan/components/MealDaySummaryModal'
import { BRONNEN, bronVan, wisselsPerDag } from '../../../meal-plan/utils/logBron'
import { kcalKleur } from '../../../meal-plan/utils/kcalKleur'
import { colors, radius } from '../../../../ui/tokens'
import GeneratePlanModal from './GeneratePlanModal'
import MealCard from '../../../meal-plan/components/day-schedule/MealCard'
import BladModal from '../../../workout/components/todays-workout/components/BladModal'
import { foodImageFallback } from '../../../meal-plan/foodImageFallback'
import { schrijfIngredientenUit, eenheidKort as eenheid } from '../../../meal-plan/utils/ingredientenUitschrijven'
import ClientDocumentsSection from './ClientDocumentsSection'
import SupplementTrouw from './SupplementTrouw'

// Het waterblok: wat de klant drinkt, en het doel dat jij daarvoor zet.
// Losse component zodat de kolom zelf niet nog meer state krijgt.
function WaterDoel({ client, db, isMobile }) {
  const [liters, setLiters] = useState(
    Number(client?.water_intake_target) > 0 ? Number(client.water_intake_target) : 3
  )
  const [bezig, setBezig] = useState(false)
  const [bewaard, setBewaard] = useState(false)
  // De laatste zeven dagen, oudste eerst. Zonder rij voor een dag heeft hij
  // die dag niets gelogd — dat is ook informatie.
  const [dagen, setDagen] = useState([])

  useEffect(() => {
    if (!db?.supabase || !client?.id) return
    let weg = false
    ;(async () => {
      const vanaf = new Date(); vanaf.setDate(vanaf.getDate() - 6)
      const vanafIso = vanaf.toISOString().split('T')[0]
      const { data, error } = await db.supabase
        .from('ai_water_tracking')
        .select('date, milliliters, target_milliliters')
        .eq('client_id', client.id)
        .gte('date', vanafIso)
        .order('date', { ascending: true })
      if (weg || error) return
      const perDag = new Map((data || []).map(r => [String(r.date).slice(0, 10), r]))
      const lijst = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i)
        const iso = d.toISOString().split('T')[0]
        const rij = perDag.get(iso)
        lijst.push({
          iso,
          dag: d.toLocaleDateString('nl-NL', { weekday: 'short' }).slice(0, 2),
          ml: Number(rij?.milliliters) || 0,
          doel: Number(rij?.target_milliliters) || null,
        })
      }
      setDagen(lijst)
    })()
    return () => { weg = true }
  }, [db, client?.id])

  const zet = async (nieuw) => {
    const waarde = Math.max(0.5, Math.min(8, Math.round(nieuw * 10) / 10))
    setLiters(waarde)
    if (!db?.supabase || !client?.id) return
    setBezig(true)
    try {
      const { error } = await db.supabase
        .from('clients').update({ water_intake_target: waarde }).eq('id', client.id)
      if (error) throw error
      setBewaard(true)
      setTimeout(() => setBewaard(false), 1400)
    } catch (e) {
      console.error('Waterdoel opslaan mislukt:', e)
    } finally {
      setBezig(false)
    }
  }

  const doelMl = liters * 1000
  const vandaag = dagen[dagen.length - 1]
  const gelogdeDagen = dagen.filter(d => d.ml > 0).length

  return (
    <div style={{
      padding: isMobile ? '0.5rem 0.75rem' : '0.6rem 1rem',
      borderBottom: '1px solid rgba(255,255,255,0.04)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <Droplet size={13} color="#3b82f6" style={{ flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.55)' }}>
            Water · doel per dag
          </div>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#fff', marginTop: 1 }}>
            {vandaag ? `Vandaag ${(vandaag.ml / 1000).toFixed(1)}L` : 'Vandaag nog niets'}
            <span style={{ color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>
              {' · '}{gelogdeDagen}/7 dagen gelogd
            </span>
          </div>
          {bewaard && (
            <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#10b981', marginTop: 1 }}>Doel bewaard</div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, opacity: bezig ? 0.5 : 1 }}>
          <button onClick={() => zet(liters - 0.5)} aria-label="Minder" style={waterKnop}>−</button>
          <span style={{
            minWidth: 44, textAlign: 'center',
            fontSize: '0.85rem', fontWeight: 900, color: '#fff', fontVariantNumeric: 'tabular-nums',
          }}>
            {liters.toFixed(1)}L
          </span>
          <button onClick={() => zet(liters + 0.5)} aria-label="Meer" style={waterKnop}>+</button>
        </div>
      </div>

      {/* Zeven staafjes: hoe vol de dag was ten opzichte van zijn doel. Een
          lege dag blijft leeg staan, want niet loggen is ook een antwoord. */}
      {dagen.length > 0 && (
        <div style={{ display: 'flex', gap: 3, marginTop: '0.5rem', alignItems: 'flex-end' }}>
          {dagen.map((d, i) => {
            const doel = d.doel || doelMl
            const pct = doel > 0 ? Math.min(100, (d.ml / doel) * 100) : 0
            const vol = pct >= 100
            return (
              <div key={d.iso} style={{ flex: 1, textAlign: 'center' }}>
                <div
                  title={`${d.iso}: ${(d.ml / 1000).toFixed(1)} van ${(doel / 1000).toFixed(1)} liter`}
                  style={{
                    height: 26, borderRadius: 4, overflow: 'hidden',
                    background: 'rgba(255,255,255,0.05)',
                    display: 'flex', alignItems: 'flex-end',
                  }}
                >
                  <div style={{
                    width: '100%', height: `${pct}%`,
                    background: vol ? '#3b82f6' : 'rgba(59,130,246,0.55)',
                  }} />
                </div>
                <div style={{
                  marginTop: 2, fontSize: '0.6rem', fontWeight: 800,
                  color: i === dagen.length - 1 ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.28)',
                  textTransform: 'uppercase',
                }}>
                  {d.dag}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const waterKnop = {
  width: 26, height: 26, padding: 0, borderRadius: 7,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
  color: '#fff', fontSize: '0.9rem', fontWeight: 900, lineHeight: 1,
  cursor: 'pointer', fontFamily: 'inherit',
  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
}

const formatDate = (d) => { if (!d) return '-'; const dt = d.length === 10 ? vanSleutel(d) : new Date(d); return dt.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: dt.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined }) }

const tijdVan = (iso) => {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

// Lokale datum als sleutel. De oude kolom knipte de UTC-datum af, waardoor
// een maaltijd na 22:00 bij de volgende dag telde.
const sleutelVan = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const vanSleutel = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d) }
const dagenTerug = (n) => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - n); return d }
const maandagVan = (s) => { const d = vanSleutel(s); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return sleutelVan(d) }
const STAP_DAGEN = 30

const BRON_ICOON = {
  plan: ClipboardCheck, wissel: Repeat, aangepast: Pencil, database: Database, barcode: ScanBarcode,
  extern: Search, eigen: ChefHat, zelf: Keyboard, opnieuw: History, bewerkt: Pencil, onbekend: UtensilsCrossed,
}
// Wat jij klaarzette (plan, wissel, aanpassing) in groen (Kersten: geen goud
// in deze sectie, accent = groen); wat de klant zelf
// vond of bedacht neutraal. Zo zie je in één oogopslag hoeveel er uit het
// plan komt.
const uitPlan = (bron) => bron === 'plan' || bron === 'wissel' || bron === 'aangepast'

function BronPill({ bron }) {
  const Icoon = BRON_ICOON[bron] || UtensilsCrossed
  const goud = uitPlan(bron)
  return (
    <span title={BRONNEN[bron]?.uitleg} style={{
      display: 'inline-flex', alignItems: 'center', gap: 4, height: 18, padding: '0 7px',
      borderRadius: radius.pill,
      border: `1px solid ${goud ? 'rgba(34,197,94,0.5)' : 'rgba(255,255,255,0.18)'}`,
      color: goud ? colors.success : 'rgba(255,255,255,0.75)',
      fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em',
      whiteSpace: 'nowrap',
    }}>
      <Icoon size={10} strokeWidth={2.8} /> {BRONNEN[bron]?.tekst || 'Gelogd'}
    </span>
  )
}

// Eén dag uit consumed_meals-rijen opbouwen, in de vorm die de detailweergave kent.
function bouwDagen(rijen, wissels) {
  const uit = {}
  rijen.forEach(m => {
    const dag = sleutelVan(new Date(m.consumed_at))
    if (!uit[dag]) uit[dag] = { calories: 0, protein: 0, carbs: 0, fat: 0, count: 0, meals: [] }
    const d = uit[dag]
    d.calories += m.calories || 0
    d.protein += parseFloat(m.protein) || 0
    d.carbs += parseFloat(m.carbs) || 0
    d.fat += parseFloat(m.fat) || 0
    d.count++
    d.meals.push({
      id: m.id, name: m.meal_name || 'Onbekend', type: m.meal_type || 'other',
      calories: m.calories || 0, protein: parseFloat(m.protein) || 0, carbs: parseFloat(m.carbs) || 0, fat: parseFloat(m.fat) || 0,
      time: m.consumed_at, meal_id: m.meal_id || null, source: m.source || null,
      bron: bronVan(m, wissels[dag]),
      ingredients: Array.isArray(m.ingredients) ? m.ingredients : [],
      image_url: m.image_url || null, amount: m.amount != null ? Number(m.amount) : null, per_unit: m.per_unit || null,
      notes: m.notes || null,
    })
  })
  Object.values(uit).forEach(d => d.meals.sort((a, b) => new Date(a.time) - new Date(b.time)))
  return uit
}

const secundaireKnop = {
  minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  padding: '0 14px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', borderRadius: radius.btn,
  color: '#fff', fontSize: '0.8rem', fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer',
  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
}
const kopje = { fontSize: '0.95rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.015em' }

export default function MealsColumn({ client, mealData, isMobile, onNavigatePlan, onClose, db, coachId, onGeneratePlan }) {
  const [view, setView] = useState('days')
  const [selectedDay, setSelectedDay] = useState(null)
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [statsOpen, setStatsOpen] = useState(false)
  // Gelogde maaltijd waarvan het info-blad open staat, plus zijn ingrediënten.
  const [infoMeal, setInfoMeal] = useState(null)
  const [infoIngredienten, setInfoIngredienten] = useState(null)

  // ── Geschiedenis van deze klant ──
  // Tot het eerste antwoord binnen is, tonen we de 7 dagen die er al waren.
  const [dailyLog, setDailyLog] = useState(() => mealData?.dailyLog || {})
  const [vanaf, setVanaf] = useState(() => dagenTerug(STAP_DAGEN))
  const [eersteLog, setEersteLog] = useState(undefined) // undefined = onbekend, null = nooit gelogd
  const [laden, setLaden] = useState(false)

  useEffect(() => {
    if (!db?.supabase || !client?.id) return
    db.supabase.from('consumed_meals').select('consumed_at').eq('client_id', client.id)
      .order('consumed_at', { ascending: true }).limit(1)
      .then(({ data }) => setEersteLog(data?.[0]?.consumed_at || null), () => setEersteLog(null))
  }, [db, client?.id])

  useEffect(() => {
    if (!db?.supabase || !client?.id) return
    let weg = false
    setLaden(true)
    const vanafIso = vanaf.toISOString()
    Promise.all([
      db.supabase.from('consumed_meals')
        .select('id, consumed_at, calories, protein, carbs, fat, meal_type, meal_name, meal_id, source, ingredients, image_url, amount, per_unit, notes')
        .eq('client_id', client.id).gte('consumed_at', vanafIso)
        .order('consumed_at', { ascending: false })
        .then(r => r, () => ({ data: null })),
      // Welke planmaaltijden waren die dag gewisseld of aangepast?
      db.supabase.from('ai_meal_progress').select('date, consumed_meals')
        .eq('client_id', client.id).gte('date', sleutelVan(vanaf))
        .then(r => r, () => ({ data: [] })),
    ]).then(([logs, progress]) => {
      if (weg) return
      if (logs.data) setDailyLog(bouwDagen(logs.data, wisselsPerDag(progress.data)))
      setLaden(false)
    })
    return () => { weg = true }
  }, [db, client?.id, vanaf])

  const meerTerug = eersteLog && new Date(eersteLog) < vanaf
  const laadOuder = () => setVanaf(v => { const d = new Date(v); d.setDate(d.getDate() - STAP_DAGEN); return d })

  // Wat zat erin, en wat heeft de klant veranderd? Een log vanuit de agenda
  // kreeg tot 13 okt geen ingrediënten mee. Dan vallen we terug op de
  // aangepaste versie van die dag (ai_meal_progress.edited_meal) en anders op
  // het recept zelf. Het recept is ook de maat voor de aanpassingen.
  const [infoBron, setInfoBron] = useState(null)     // 'log' | 'aangepast' | 'recept'
  const [infoVerschil, setInfoVerschil] = useState(null) // [{ soort, name, van, naar, unit }]
  const openInfo = async (meal) => {
    setInfoMeal(meal)
    setInfoIngredienten(null); setInfoBron(null); setInfoVerschil(null)
    let recept = null, aangepast = null
    if (meal.meal_id && db?.supabase) {
      const dag = sleutelVan(new Date(meal.time))
      const [r, p] = await Promise.all([
        db.supabase.from('ai_meals').select('ingredients_list').eq('id', meal.meal_id).maybeSingle().then(x => x, () => ({ data: null })),
        db.supabase.from('ai_meal_progress').select('consumed_meals').eq('client_id', client.id).eq('date', dag).maybeSingle().then(x => x, () => ({ data: null })),
      ])
      recept = Array.isArray(r.data?.ingredients_list) && r.data.ingredients_list.length ? r.data.ingredients_list : null
      const slot = Object.values(p.data?.consumed_meals || {}).find(v => v?.meal_id === meal.meal_id && Array.isArray(v?.edited_meal?.ingredients_list))
      aangepast = slot?.edited_meal?.ingredients_list?.length ? slot.edited_meal.ingredients_list : null
    }
    const gelogd = meal.ingredients?.length ? meal.ingredients : null
    const gebruikt = gelogd || aangepast || recept || []
    const [uit, receptUit] = await Promise.all([
      schrijfIngredientenUit(db, gebruikt),
      recept && gebruikt !== recept ? schrijfIngredientenUit(db, recept) : Promise.resolve(null),
    ])
    setInfoIngredienten(uit)
    setInfoBron(gelogd ? 'log' : aangepast ? 'aangepast' : recept ? 'recept' : null)
    if (receptUit) {
      const sleutel = (x) => String(x.name || '').trim().toLowerCase()
      const nu = new Map(uit.map(x => [sleutel(x), x]))
      const was = new Map(receptUit.map(x => [sleutel(x), x]))
      const verschil = []
      receptUit.forEach(o => {
        const n = nu.get(sleutel(o))
        if (!n) verschil.push({ soort: 'weg', name: o.name, van: o.amount, unit: o.unit })
        else if (Math.round(n.amount) !== Math.round(o.amount)) verschil.push({ soort: 'anders', name: o.name, van: o.amount, naar: n.amount, unit: n.unit })
      })
      uit.forEach(n => { if (!was.has(sleutel(n))) verschil.push({ soort: 'erbij', name: n.name, naar: n.amount, unit: n.unit }) })
      setInfoVerschil(verschil)
    }
  }
  const sluitInfo = () => { setInfoMeal(null); setInfoIngredienten(null); setInfoBron(null); setInfoVerschil(null) }

  // De doelen van de klant zelf (clients.target_*), dezelfde als de macroringen
  // in de gewichtsectie. Eerst stonden hier de daily_*-getallen van het nieuwste
  // plan voorop; die lopen achter zodra je de ringen bijstelt, en dan kleurde
  // een dag die net goed zat als "boven het doel". Vers opgehalen, want de
  // client-prop kan van vóór de laatste aanpassing zijn.
  const [klantDoel, setKlantDoel] = useState(null)
  useEffect(() => {
    if (!db?.supabase || !client?.id) return
    let weg = false
    const lees = () => db.supabase.from('clients')
      .select('target_calories, target_protein, target_carbs, target_fat').eq('id', client.id).maybeSingle()
      .then(({ data }) => { if (!weg && data) setKlantDoel(data) }, () => {})
    lees()
    // Stel je de ringen bij terwijl dit openstaat, dan volgt dit meteen.
    const bijgewerkt = (e) => { if (e?.detail?.clientId === client.id) lees() }
    window.addEventListener('myarc:macros-gewijzigd', bijgewerkt)
    return () => { weg = true; window.removeEventListener('myarc:macros-gewijzigd', bijgewerkt) }
  }, [db, client?.id])
  const doelBron = klantDoel || client
  const targets = Number(doelBron?.target_calories) > 0 ? {
    calories: Math.round(Number(doelBron.target_calories) || 0), protein: Math.round(Number(doelBron.target_protein) || 0),
    carbs: Math.round(Number(doelBron.target_carbs) || 0), fat: Math.round(Number(doelBron.target_fat) || 0),
  } : (mealData.targets || null)
  const vandaagSleutel = sleutelVan(new Date())
  const days = useMemo(() => Object.keys(dailyLog).sort((a, b) => (a < b ? 1 : -1)), [dailyLog])

  const pct = (val, target) => target > 0 ? Math.min(100, Math.round((val / target) * 100)) : 0
  // Binnen 10% van het doel is op doel (groen = behaald); verder eraf blijft wit.
  const opDoel = (val, target) => target > 0 && Math.abs(val - target) / target <= 0.1
  const mealTypeLabel = { breakfast: 'Ontbijt', lunch: 'Lunch', dinner: 'Diner', snack: 'Snack', pre_workout: 'Pre-workout', quick_add: 'Snel toegevoegd', custom_meal: 'Eigen maaltijd', custom: 'Overig', other: 'Overig' }

  const MacroBar = ({ items }) => (
    <div style={{ display: 'flex', gap: 8, padding: isMobile ? '0.4rem 0.9rem 0.85rem' : '0.45rem 1.1rem 0.95rem' }}>
      {items.map((m) => {
        const p = pct(m.val, m.target)
        const goed = opDoel(m.val, m.target)
        return (
          <div key={m.label} style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
              <span style={{ fontSize: isMobile ? '0.95rem' : '1.05rem', fontWeight: 900, color: goed ? colors.success : '#fff', letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>{m.val}</span>
              <span style={{ fontSize: '0.66rem', fontWeight: 800, color: colors.textMuted, fontVariantNumeric: 'tabular-nums' }}>/{m.target}</span>
            </div>
            <div style={{ fontSize: '0.62rem', fontWeight: 900, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>{m.label}</div>
            <div style={{ height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2, marginTop: 6, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${p}%`, background: goed ? colors.success : 'rgba(255,255,255,0.7)', borderRadius: 2 }} />
            </div>
          </div>
        )
      })}
    </div>
  )

  // ── DAY DETAIL ──
  if (view === 'detail' && selectedDay) {
    const dayData = dailyLog[selectedDay]
    if (!dayData) { setView('days'); return null }
    const dayMeals = dayData.meals || []
    const grouped = {}
    dayMeals.forEach(m => { const t = m.type || 'other'; if (!grouped[t]) grouped[t] = []; grouped[t].push(m) })
    const mealOrder = ['breakfast', 'lunch', 'pre_workout', 'dinner', 'snack', 'quick_add', 'custom_meal', 'custom', 'other']
    const sortedTypes = Object.keys(grouped).sort((a, b) => mealOrder.indexOf(a) - mealOrder.indexOf(b))

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        <div style={{ padding: isMobile ? '0.5rem 0.75rem' : '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button onClick={() => { setView('days'); setSelectedDay(null) }} aria-label="Terug" style={{ width: 44, height: 44, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: 0, touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}><ArrowLeft size={18} strokeWidth={2.6} /></button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={kopje}>{vanSleutel(selectedDay).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
            <div style={{ fontSize: '0.74rem', fontWeight: 700, color: colors.textSecondary }}>{dayData.count} {dayData.count === 1 ? 'maaltijd' : 'maaltijden'} gelogd</div>
          </div>
        </div>
        {targets && <MacroBar items={[
          { label: 'KCAL', val: Math.round(dayData.calories), target: targets.calories },
          { label: 'EIWIT', val: Math.round(dayData.protein), target: targets.protein },
          { label: 'CARBS', val: Math.round(dayData.carbs), target: targets.carbs },
          { label: 'VET', val: Math.round(dayData.fat), target: targets.fat }
        ]} />}
        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', paddingTop: '0.5rem' }}>
          {sortedTypes.map(type => (
            <div key={type} style={{ marginBottom: '0.5rem' }}>
              {/* Sectiekop: bold wit, sentence case. Geen gekleurde stip; het
                  moment staat ook al op de foto van elke kaart. */}
              <div style={{ padding: isMobile ? '0.25rem 0.9rem 0.4rem' : '0.3rem 1.25rem 0.5rem', fontSize: '0.86rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.015em' }}>
                {mealTypeLabel[type] || type}
              </div>
              {grouped[type].map((meal, mIdx) => (
                <MealCard
                  key={meal.id || mIdx}
                  meal={{
                    name: meal.name, image_url: meal.image_url,
                    slot: type,
                    calories: meal.calories, protein: meal.protein, carbs: meal.carbs, fat: meal.fat,
                  }}
                  momentLabel={mealTypeLabel[type] || type}
                  tijdLabel={tijdVan(meal.time)}
                  label={<BronPill bron={meal.bron || bronVan(meal)} />}
                  // Een los product zonder ingrediënten: de hoeveelheid is wat je wilt weten.
                  ondertitel={(!meal.ingredients?.length && meal.amount > 0) ? `${Math.round(meal.amount * 10) / 10}${eenheid(meal.per_unit)}` : null}
                  isMobile={isMobile}
                  compact
                  acties={[]}
                  onTik={() => openInfo(meal)}
                  rechts={
                    <button
                      onClick={(e) => { e.stopPropagation(); openInfo(meal) }}
                      title="Ingrediënten bekijken" aria-label="Ingrediënten bekijken"
                      style={{
                        width: 36, height: 36, padding: 0, borderRadius: 10,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                        color: '#fff', cursor: 'pointer',
                        touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                      }}
                    >
                      <Info size={15} strokeWidth={2.4} />
                    </button>
                  }
                />
              ))}
            </div>
          ))}
        </div>

        {/* Wat zat erin? Zelfde blad als in het wisselvenster van de klant. */}
        <BladModal open={!!infoMeal} titel={infoMeal?.name || 'Maaltijd'} onClose={sluitInfo} zIndex={10600}>
          {infoMeal && (
            <>
              <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: '0.75rem' }}>
                {[tijdVan(infoMeal.time), formatDate(selectedDay)].filter(Boolean).join(' · ')}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.9rem' }}>
                <BronPill bron={infoMeal.bron || bronVan(infoMeal)} />
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: colors.textSecondary }}>{BRONNEN[infoMeal.bron || bronVan(infoMeal)]?.uitleg}</span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                {[
                  { label: 'kcal', waarde: Math.round(infoMeal.calories || 0) },
                  { label: 'eiwit', waarde: `${Math.round(infoMeal.protein || 0)}g` },
                  { label: 'koolh', waarde: `${Math.round(infoMeal.carbs || 0)}g` },
                  { label: 'vet', waarde: `${Math.round(infoMeal.fat || 0)}g` },
                ].map(x => (
                  <div key={x.label} style={{ flex: 1, minWidth: 0, textAlign: 'center', padding: '0.5rem 0.25rem', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10 }}>
                    <div style={{ fontSize: '1rem', fontWeight: 900, color: '#fff', lineHeight: 1.1 }}>{x.waarde}</div>
                    <div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>{x.label}</div>
                  </div>
                ))}
              </div>

              {infoMeal.notes && (
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: '0.9rem', lineHeight: 1.4 }}>
                  {infoMeal.notes}
                </div>
              )}

              {/* Wat de klant veranderde ten opzichte van het recept. */}
              {infoVerschil?.length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.62rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
                    Aanpassingen t.o.v. het recept
                  </div>
                  {infoVerschil.map((v, i) => (
                    <div key={`${v.name}-${i}`} style={{ display: 'flex', alignItems: 'baseline', gap: 8, padding: '0.4rem 0', borderBottom: i < infoVerschil.length - 1 ? `1px solid ${colors.borderSubtle}` : 'none' }}>
                      <span style={{ width: 44, flexShrink: 0, fontSize: '0.62rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.06em', color: v.soort === 'erbij' ? colors.success : v.soort === 'weg' ? colors.danger : 'rgba(255,255,255,0.6)' }}>
                        {v.soort === 'erbij' ? 'Erbij' : v.soort === 'weg' ? 'Weg' : 'Anders'}
                      </span>
                      <span style={{ flex: 1, minWidth: 0, fontSize: '0.84rem', fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.name}</span>
                      <span style={{ flexShrink: 0, fontSize: '0.8rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)', fontVariantNumeric: 'tabular-nums' }}>
                        {v.soort === 'anders'
                          ? `${Math.round(v.van)} → ${Math.round(v.naar)}${eenheid(v.unit)}`
                          : v.soort === 'weg' ? `${Math.round(v.van)}${eenheid(v.unit)}` : `${Math.round(v.naar)}${eenheid(v.unit)}`}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ fontSize: '0.62rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
                Ingrediënten{infoBron === 'aangepast' ? ' · aangepaste versie van die dag' : infoBron === 'recept' ? ' · volgens het recept' : ''}
              </div>
              {infoIngredienten === null ? (
                <div style={{ padding: '1rem 0', color: 'rgba(255,255,255,0.3)', fontSize: '0.78rem' }}>Laden…</div>
              ) : infoIngredienten.length === 0 ? (
                <div style={{ padding: '0.5rem 0 1rem', color: 'rgba(255,255,255,0.35)', fontSize: '0.78rem', fontWeight: 700 }}>
                  {infoMeal.amount > 0
                    ? `Los product: ${Math.round(infoMeal.amount * 10) / 10}${eenheid(infoMeal.per_unit)}.`
                    : 'Van deze maaltijd zijn geen ingrediënten gelogd.'}
                </div>
              ) : (
                <div style={{ margin: '0 -1.25rem 1rem' }}>
                  {infoIngredienten.map((ing, i) => (
                    <MealCard
                      key={`${ing.name}-${i}`}
                      meal={{
                        name: ing.name,
                        image_url: foodImageFallback(ing.name, null, 200),
                        calories: ing.calories, protein: ing.protein, carbs: ing.carbs, fat: ing.fat,
                      }}
                      momentLabel=""
                      rechts={`${ing.amount}${eenheid(ing.unit)}`}
                      isMobile={isMobile}
                      acties={[]}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </BladModal>
      </div>
    )
  }

  // ── DAYS LIST ──
  // Dagen per week groeperen: bij een lange geschiedenis zie je zo waar je bent.
  const weken = []
  days.forEach(dag => {
    const wk = maandagVan(dag)
    if (!weken.length || weken[weken.length - 1].wk !== wk) weken.push({ wk, dagen: [] })
    weken[weken.length - 1].dagen.push(dag)
  })
  const dezeWeek = maandagVan(vandaagSleutel)
  const weekNaam = (wk) => {
    if (wk === dezeWeek) return 'Deze week'
    const vorige = vanSleutel(dezeWeek); vorige.setDate(vorige.getDate() - 7)
    if (wk === sleutelVan(vorige)) return 'Vorige week'
    const ma = vanSleutel(wk); const zo = new Date(ma); zo.setDate(zo.getDate() + 6)
    return `${ma.getDate()} ${ma.toLocaleDateString('nl-NL', { month: 'short' })} – ${zo.getDate()} ${zo.toLocaleDateString('nl-NL', { month: 'short' })}`
  }
  const pad = isMobile ? '0 0.9rem' : '0 1.1rem'

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: '1.5rem' }}>
          {/* Eén regel: welk plan actief is, met Plan Analyzer, Genereer en
              het Inzicht-scherm van de klant. Geen kaart eromheen. */}
          <div style={{ padding: isMobile ? '0.6rem 0.9rem' : '0.7rem 1.1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.92rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.015em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {mealData.plan ? (mealData.plan.name || 'Voedingsplan') : 'Nog geen plan'}
              </div>
              <div style={{ fontSize: '0.66rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: mealData.plan?.isActive ? colors.success : colors.textMuted, marginTop: 1 }}>
                {mealData.plan ? (mealData.plan.isActive ? 'Actief' : 'Concept') : 'Voedingsplan'}
                {laden && <span style={{ color: colors.textMuted, textTransform: 'none', letterSpacing: 0, fontWeight: 700 }}> · laden…</span>}
              </div>
            </div>
            {onNavigatePlan && (
              <button
                onClick={() => { onNavigatePlan(client.id, mealData.plan?.id || null); onClose() }}
                title="Plan Analyzer" aria-label="Plan Analyzer"
                style={{ ...secundaireKnop, padding: 0, width: 44, border: '1px solid rgba(34,197,94,0.6)', color: colors.success }}
              >
                <BarChart3 size={17} strokeWidth={2.6} />
              </button>
            )}
            {onNavigatePlan && db && (
              <button onClick={() => setShowGenerateModal(true)} title="Automatisch plan genereren" aria-label="Plan genereren" style={{ ...secundaireKnop, padding: 0, width: 44 }}>
                <Zap size={17} strokeWidth={2.6} />
              </button>
            )}
            <button onClick={() => setStatsOpen(true)} style={secundaireKnop} title="Maand- en dagoverzicht, zoals de klant het ziet">
              <CalendarDays size={15} strokeWidth={2.6} /> Inzicht
            </button>
          </div>

          {/* Waterdoel — in liters op de klant (clients.water_intake_target). De
              fles op de maaltijdpagina rekent daarmee; 3 liter is de standaard
              als je niets invult. */}
          <WaterDoel client={client} db={db} isMobile={isMobile} />

          {days.length === 0 && !laden ? (
            <div style={{ padding: pad, fontSize: '0.8rem', fontWeight: 700, color: colors.textMuted, lineHeight: 1.45 }}>
              {eersteLog === null
                ? 'Deze klant heeft nog niets gelogd. Zodra er een maaltijd binnenkomt, zie je hem hier met zijn bron.'
                : `In de laatste ${Math.round((Date.now() - vanaf.getTime()) / 86400000)} dagen niets gelogd.`}
            </div>
          ) : weken.map(({ wk, dagen }) => {
            const gem = Math.round(dagen.reduce((t, d) => t + dailyLog[d].calories, 0) / dagen.length)
            return (
              <div key={wk} style={{ marginTop: '0.6rem' }}>
                <div style={{ padding: pad, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: '0.66rem', fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{weekNaam(wk)}</span>
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, color: colors.textMuted, fontVariantNumeric: 'tabular-nums' }}>{dagen.length} {dagen.length === 1 ? 'dag' : 'dagen'} · gem. {gem.toLocaleString('nl-NL')} kcal</span>
                </div>
                {dagen.map(dag => {
                  const d = dailyLog[dag]
                  const kcal = Math.round(d.calories)
                  const kleur = targets ? kcalKleur(kcal, targets.calories, '#fff') : '#fff'
                  // Hoeveel uit het plan, en wat de klant zelf deed, als
                  // icoontjes met aantallen: de mix van de dag in één regel.
                  const mix = {}
                  d.meals.forEach(m => { const b = m.bron || bronVan(m); mix[b] = (mix[b] || 0) + 1 })
                  const mixLijst = Object.entries(mix).sort((a, b) => (uitPlan(b[0]) - uitPlan(a[0])) || (b[1] - a[1]))
                  const datum = vanSleutel(dag)
                  return (
                    <button key={dag} onClick={() => { setSelectedDay(dag); setView('detail') }} style={{
                      display: 'block', width: '100%', margin: 0,
                      padding: isMobile ? '0.7rem 0.9rem' : '0.75rem 1.1rem',
                      textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
                      background: dag === vandaagSleutel ? 'rgba(34,197,94,0.06)' : colors.surface,
                      border: 'none', borderBottom: `1px solid ${colors.borderSubtle}`,
                      borderLeft: `3px solid ${dag === vandaagSleutel ? colors.success : 'transparent'}`,
                      touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 38, flexShrink: 0, textAlign: 'center' }}>
                          <div style={{ fontSize: '0.62rem', fontWeight: 900, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{datum.toLocaleDateString('nl-NL', { weekday: 'short' }).slice(0, 2)}</div>
                          <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#fff', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>{datum.getDate()}</div>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                            <span style={{ fontSize: '0.95rem', fontWeight: 900, color: kleur, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>{kcal.toLocaleString('nl-NL')}</span>
                            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: colors.textMuted }}>{targets ? `/ ${Math.round(targets.calories).toLocaleString('nl-NL')} kcal` : 'kcal'}</span>
                            <span style={{ marginLeft: 'auto', fontSize: '0.72rem', fontWeight: 800, color: colors.textSecondary, fontVariantNumeric: 'tabular-nums' }}>E {Math.round(d.protein)}g</span>
                          </div>
                          {targets?.calories > 0 && (
                            <div style={{ height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2, marginTop: 5, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${pct(kcal, targets.calories)}%`, background: kleur, borderRadius: 2 }} />
                            </div>
                          )}
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 10px', marginTop: 6 }}>
                            {mixLijst.map(([b, n]) => {
                              const Icoon = BRON_ICOON[b] || UtensilsCrossed
                              return (
                                <span key={b} title={BRONNEN[b]?.tekst} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: '0.68rem', fontWeight: 800, color: uitPlan(b) ? colors.success : colors.textSecondary }}>
                                  <Icoon size={11} strokeWidth={2.6} /> {n} {BRONNEN[b]?.tekst.toLowerCase()}
                                </span>
                              )
                            })}
                          </div>
                        </div>
                        <ChevronRight size={16} color="rgba(255,255,255,0.3)" style={{ flexShrink: 0 }} />
                      </div>
                    </button>
                  )
                })}
              </div>
            )
          })}

          {/* Verder terug kijken. Zonder eerdere logs staat er waar het begon. */}
          {days.length > 0 && (
            <div style={{ padding: pad, marginTop: '0.75rem' }}>
              {meerTerug ? (
                <button onClick={laadOuder} disabled={laden} style={{ ...secundaireKnop, width: '100%', opacity: laden ? 0.5 : 1 }}>
                  <History size={15} strokeWidth={2.6} /> {laden ? 'Laden…' : `Nog ${STAP_DAGEN} dagen terug`}
                </button>
              ) : eersteLog ? (
                <div style={{ textAlign: 'center', fontSize: '0.74rem', fontWeight: 700, color: colors.textMuted }}>
                  Eerste log op {formatDate(eersteLog)}
                </div>
              ) : null}
            </div>
          )}

          {/* Supplementen horen bij voeding, dus hier en niet in een eigen
              kolom. Toont zichzelf niet als er geen supplementplan is. */}
          {db && client?.id && (
            <div style={{ marginTop: '1.5rem' }}>
              <SupplementTrouw db={db} client={client} isMobile={isMobile} />
            </div>
          )}

          {/* ── DOCUMENTEN SECTIE ── */}
          {db && client?.id && (
            <ClientDocumentsSection
              db={db}
              clientId={client.id}
              coachId={coachId}
              isMobile={isMobile}
              isClientView={false}
            />
          )}
        </div>
      </div>

      {/* Het Inzicht-scherm van de klant: dag, week en maand. */}
      {statsOpen && (
        <MealDaySummaryModal
          isOpen={statsOpen}
          onClose={() => setStatsOpen(false)}
          db={db}
          clientId={client.id}
          selectedDay="today"
          targets={targets || { calories: 0, protein: 0, carbs: 0, fat: 0 }}
          isMobile={isMobile}
          zwevend
        />
      )}

      {showGenerateModal && (
        <GeneratePlanModal
          client={client}
          db={db}
          coachId={coachId}
          isMobile={isMobile}
          onClose={() => setShowGenerateModal(false)}
          onSuccess={(newPlanId) => {
            setShowGenerateModal(false)
            if (onGeneratePlan) onGeneratePlan(newPlanId)
            else if (onNavigatePlan) { onNavigatePlan(client.id, newPlanId); onClose() }
          }}
        />
      )}
    </>
  )
}
