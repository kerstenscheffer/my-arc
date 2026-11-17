// src/modules/meal-plan/components/MealDaySummaryModal.jsx
//
// Inzicht: hoe ging het eten? Opent via de knop 'Inzicht' in de bovenbalk
// van de maaltijdpagina (en via een tik op de dagregel).
//
// Van boven naar onder:
//   1. De gekozen dag — kcal tegen je doel, met wat er over is of te veel,
//      en eiwit, koolhydraten en vet als dunne witte balken.
//   2. Wat je die dag hebt gelogd — per maaltijd foto, tijd, kcal, eiwit.
//   3. De week van die dag — zeven staven kcal met je doel als lijn, plus
//      het weekgemiddelde en hoeveel dagen je op doel zat. Tik een staaf.
//   4. Maandkalender — stip onder elke dag met logs, reeks dagen op rij.
//      Tik een dag en je ziet hem hierboven, ook buiten deze week.
//
// Vooruit plannen (27 okt 2026): vandaag en latere dagen tonen ook wat er
// gepland staat (zelfde bron als de dagpagina: utils/maaltijdenVoorDag). Tik
// een maaltijd en je staat op die dag met het wisselvenster open; zo zet een
// klant volgende week alvast klaar. Alleen als `activePlan` meekomt.
//
// Datums zijn lokale datums. De vorige versie rekende in UTC, waardoor een
// maaltijd na 22:00 bij de volgende dag telde en de stipjes verschoven.

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from '../../../client/paginaPortal'
import { X, ChevronLeft, ChevronRight, ArrowRight, Flame, CalendarDays, RefreshCw, Info, Pill, ExternalLink } from 'lucide-react'
import { foodImageFallback, resolveFoodImage } from '../foodImageFallback'
import { maaltijdenVoorDag } from '../utils/maaltijdenVoorDag'
import { getOverrides } from '../DayTemplateService'
import { ClientAgendaService } from '../../client-agenda/ClientAgendaService'
import { kcalKleur } from '../utils/kcalKleur'
import { BRONNEN, bronVan } from '../utils/logBron'
import { schrijfIngredientenUit, eenheidKort } from '../utils/ingredientenUitschrijven'
import useZwevendVenster from '../../../components/useZwevendVenster'

const LIJN = 'rgba(255,255,255,0.08)'
const GROEN = '#10b981'
const ORANJE = '#f59e0b'
const ROOD = '#ef4444'

const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const NL_DAY_SHORT = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo']
const NL_MONTHS = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december']

const fmt = (n) => Math.round(n || 0).toLocaleString('nl-NL')
// Lokale datum als sleutel (YYYY-MM-DD), niet via toISOString (= UTC).
const sleutel = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const vanSleutel = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d) }
const maandagVan = (d) => { const m = new Date(d); m.setHours(0, 0, 0, 0); m.setDate(m.getDate() - ((m.getDay() + 6) % 7)); return m }
const plusDagen = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x }

// Hoe ligt de inname tegen het doel? Tot 100 kcal ernaast (nog groen) = op doel.
// Op het verschil in kcal, met een vloeiende overgang: zie utils/kcalKleur.js.

function MacroBalk({ label, waarde, doel, compact = false, eenheid = 'g', kleur = '#fff', onKlik = null, hint = '' }) {
  const pct = doel > 0 ? Math.min(100, (waarde / doel) * 100) : 0
  // Coach Inzicht: label direct boven het getal, dunne balk er strak onder.
  if (compact) return (
    <div onClick={onKlik || undefined} title={onKlik ? hint : undefined} style={{ flex: 1, minWidth: 0, cursor: onKlik ? 'pointer' : 'default' }}>
      <div style={{ fontSize: '0.58rem', fontWeight: 900, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em', lineHeight: 1.1 }}>{label}{onKlik && <ChevronRight size={10} strokeWidth={3} style={{ marginLeft: 3, verticalAlign: '-1px' }} />}</div>
      <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#fff', fontVariantNumeric: 'tabular-nums', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {fmt(waarde)}<span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)' }}>{doel > 0 ? ` / ${fmt(doel)}${eenheid}` : eenheid}</span>
      </div>
      <div style={{ height: 3, marginTop: 3, borderRadius: 2, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: kleur, borderRadius: 2, transition: 'width 0.4s ease' }} />
      </div>
    </div>
  )
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: '0.62rem', fontWeight: 900, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
      <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#fff', fontVariantNumeric: 'tabular-nums', marginTop: 2 }}>
        {fmt(waarde)}<span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)' }}>{doel > 0 ? ` / ${fmt(doel)}g` : 'g'}</span>
      </div>
      <div style={{ height: 4, marginTop: 6, borderRadius: 2, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: '#fff', borderRadius: 2, transition: 'width 0.4s ease' }} />
      </div>
    </div>
  )
}

const kopje = (tekst, extra = null, compact = false) => (
  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, margin: compact ? '0.8rem 0 0.35rem' : '1.5rem 0 0.75rem' }}>
    <span style={{ fontSize: '0.66rem', fontWeight: 900, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{tekst}</span>
    {extra && <span style={{ marginLeft: 'auto', fontSize: '0.72rem', fontWeight: 800, color: 'rgba(255,255,255,0.55)' }}>{extra}</span>}
  </div>
)

export default function MealDaySummaryModal({
  isOpen, onClose,
  db, clientId,
  selectedDay,        // 'today' | weekday key
  onDayChange,        // (newKey) => void
  onOpenFullHistory,  // () => void
  targets = {},       // { calories, protein, carbs, fat }
  isMobile: propMobile,
  // Coach Inzicht: als zwevend venster naast je werk — te verslepen aan de
  // kop, groter of kleiner aan de hoek, zonder gedimde achtergrond.
  zwevend = false,
  // Coach Inzicht: vast in de kaart Voeding zelf, zonder venster eromheen
  // (17 nov 2026, Kersten: dit scherm werkt goed, dus direct in beeld).
  ingebed = false,
  // Waterdoel in liters (alleen ingebed): de strook rechts in elke dagstaaf.
  waterDoelL = 3,
  // Gecombineerde week in Coach Inzicht: de kaart Training toont de week en
  // kiest de dag; dit onderdeel toont dan alleen de dag zelf en meldt de
  // weekcijfers terug. { gekozen, setGekozen, meldWeek }
  gedeeld = null,
  // Coach Inzicht: klik op de kcal opent Doelen & macro's.
  onDoelen = null,
  // Klik op het waterbalkje (alleen ingebed): de coach opent het venster met het doel.
  onWaterKlik = null,
  // Plan openen (alleen ingebed): knop rechts in de dagenregel, de kaart heeft geen eigen kop meer.
  onPlan = null,
  // Vooruit plannen (alleen op de maaltijdpagina van de klant).
  activePlan = null,
  workoutSchedule = null,
  onOpenDag = null,       // (datum) => naar die dag in het plan
  onWisselMaaltijd = null, // (datum, maaltijd) => die dag + wisselvenster
}) {
  const isMobile = propMobile ?? (typeof window !== 'undefined' && window.innerWidth <= 768)
  const venster = useZwevendVenster({ isMobile, standaard: { w: 540, h: 820 } })

  // De dag waarmee het venster opent: de dag die op de maaltijdpagina openstaat.
  const startDatum = useMemo(() => {
    const vandaag = new Date(); vandaag.setHours(0, 0, 0, 0)
    const idx = selectedDay === 'today' || !selectedDay ? (vandaag.getDay() + 6) % 7 : Math.max(0, DAYS_OF_WEEK.indexOf(selectedDay))
    return plusDagen(maandagVan(vandaag), idx)
  }, [selectedDay])

  const [gekozenEigen, setGekozen] = useState(startDatum)
  const gekozen = gedeeld?.gekozen || gekozenEigen
  const [maand, setMaand] = useState(() => ({ y: startDatum.getFullYear(), m: startDatum.getMonth() }))
  const [perDag, setPerDag] = useState(null) // { 'YYYY-MM-DD': [maaltijden] }

  useEffect(() => { setGekozen(startDatum); setMaand({ y: startDatum.getFullYear(), m: startDatum.getMonth() }) }, [startDatum])

  // Eén keer ophalen voor alles wat in beeld is: de zichtbare maand, de week
  // van de gekozen dag, en 60 dagen terug voor de reeks.
  const bereik = useMemo(() => {
    const vandaag = new Date(); vandaag.setHours(0, 0, 0, 0)
    const kandidaten = [
      new Date(maand.y, maand.m, 1), new Date(maand.y, maand.m + 1, 0),
      maandagVan(gekozen), plusDagen(maandagVan(gekozen), 6),
      plusDagen(vandaag, -60), vandaag,
    ]
    const van = new Date(Math.min(...kandidaten)); const tot = new Date(Math.max(...kandidaten))
    return { van: sleutel(van), tot: sleutel(tot) }
  }, [maand, gekozen])

  useEffect(() => {
    if (!isOpen || !db?.supabase || !clientId) return
    let weg = false
    const van = vanSleutel(bereik.van)
    const tot = plusDagen(vanSleutel(bereik.tot), 1)
    db.supabase.from('consumed_meals')
      .select(ingebed
        ? 'id, meal_name, meal_type, calories, protein, carbs, fat, consumed_at, image_url, amount, per_unit, ingredients, meal_id, notes, source'
        : 'id, meal_name, meal_type, calories, protein, carbs, fat, consumed_at, image_url')
      .eq('client_id', clientId)
      .gte('consumed_at', van.toISOString())
      .lt('consumed_at', tot.toISOString())
      .order('consumed_at', { ascending: true })
      .then(({ data }) => {
        if (weg) return
        const uit = {}
        ;(data || []).forEach(r => {
          if (!r.consumed_at) return
          const k = sleutel(new Date(r.consumed_at))
          ;(uit[k] = uit[k] || []).push(r)
        })
        setPerDag(uit)
      }, () => { if (!weg) setPerDag({}) })
    return () => { weg = true }
  }, [isOpen, db, clientId, bereik, ingebed])

  // Coach Inzicht: welke logs kwamen uit "vooruit gepland" (geplande_maaltijden
  // met gelogd_id)? Die krijgen het label Ingepland.
  const [ingepland, setIngepland] = useState(() => new Set())
  useEffect(() => {
    if (!ingebed || !isOpen || !db?.supabase || !clientId) return
    let weg = false
    db.supabase.from('geplande_maaltijden').select('gelogd_id')
      .eq('client_id', clientId).not('gelogd_id', 'is', null)
      .gte('datum', bereik.van).lte('datum', bereik.tot)
      .then(({ data }) => { if (!weg) setIngepland(new Set((data || []).map(r => r.gelogd_id))) }, () => {})
    return () => { weg = true }
  }, [ingebed, isOpen, db, clientId, bereik])

  // Coach Inzicht: afgevinkte supplementen per dag, in dezelfde lijst als de
  // gelogde maaltijden.
  const [supps, setSupps] = useState({}) // { 'YYYY-MM-DD': [{ naam, tijd }] }
  useEffect(() => {
    if (!ingebed || !isOpen || !db?.supabase || !clientId) return
    let weg = false
    db.supabase.from('supplement_logs')
      .select('id, supplement_id, supplement_name, log_date, taken_at, created_at')
      .eq('client_id', clientId).gte('log_date', bereik.van).lte('log_date', bereik.tot)
      .then(({ data }) => {
        if (weg) return
        const uit = {}
        ;(data || []).forEach(r => {
          const k = String(r.log_date).slice(0, 10)
          ;(uit[k] = uit[k] || []).push({ id: r.id, naam: r.supplement_name || 'Supplement', tijd: r.taken_at || r.created_at || null })
        })
        setSupps(uit)
      }, () => {})
    return () => { weg = true }
  }, [ingebed, isOpen, db, clientId, bereik])

  // Coach Inzicht: een gelogde maaltijd openklappen om te zien wat er precies
  // gegeten is (hoeveelheid, macro's, ingrediënten met gram).
  const [info, setInfo] = useState(null) // { id, ingredienten: null | [], bron }
  // Coach Inzicht: de lijst met gelogde maaltijden in- of uitgeklapt; de keuze
  // blijft bewaard in deze browser.
  const [statInfo, setStatInfo] = useState(null) // welke weekstat zijn uitleg toont
  const [lijstDicht, setLijstDicht] = useState(() => {
    try { return localStorage.getItem('ci_voeding_gelogd_dicht') === '1' } catch { return false }
  })
  const wisselLijst = () => setLijstDicht(d => {
    try { localStorage.setItem('ci_voeding_gelogd_dicht', d ? '0' : '1') } catch { /* privévenster */ }
    return !d
  })
  const openInfo = async (m) => {
    if (info?.id === m.id) { setInfo(null); return }
    setInfo({ id: m.id, ingredienten: null, bron: null })
    let lijst = Array.isArray(m.ingredients) && m.ingredients.length ? m.ingredients : null
    let bron = lijst ? 'log' : null
    if (!lijst && m.meal_id) {
      const r = await db.supabase.from('ai_meals').select('ingredients_list').eq('id', m.meal_id).maybeSingle().then(x => x, () => ({ data: null }))
      if (Array.isArray(r.data?.ingredients_list) && r.data.ingredients_list.length) { lijst = r.data.ingredients_list; bron = 'recept' }
    }
    const uit = lijst ? await schrijfIngredientenUit(db, lijst) : []
    setInfo(nu => (nu?.id === m.id ? { id: m.id, ingredienten: uit, bron: uit.length ? bron : null } : nu))
  }

  // Gepland: per dag van de week van de gekozen dag, vanaf vandaag.
  const [gepland, setGepland] = useState({}) // { 'YYYY-MM-DD': [maaltijden] }
  const [trainingStarts, setTrainingStarts] = useState(null)
  useEffect(() => {
    if (!isOpen || !activePlan || !db?.supabase || !clientId) return
    let weg = false
    new ClientAgendaService(db.supabase).getTrainingStartsPerDag(clientId)
      .then(t => { if (!weg) setTrainingStarts(t || {}) }, () => { if (!weg) setTrainingStarts({}) })
    return () => { weg = true }
  }, [isOpen, activePlan, db, clientId])
  const weekSleutel = sleutel(maandagVan(gekozen))
  useEffect(() => {
    if (!isOpen || !activePlan || !db?.supabase || !clientId || trainingStarts === null) return
    let weg = false
    ;(async () => {
      const maandagD = vanSleutel(weekSleutel)
      const vandaagK = sleutel(new Date())
      const dagen = Array.from({ length: 7 }, (_, i) => plusDagen(maandagD, i)).filter(d => sleutel(d) >= vandaagK)
      if (!dagen.length) return
      const templates = await getOverrides(db.supabase, clientId, sleutel(dagen[0]), sleutel(dagen[dagen.length - 1]))
      const uit = {}
      await Promise.all(dagen.map(async d => {
        const k = sleutel(d)
        const dayKey = DAYS_OF_WEEK[(d.getDay() + 6) % 7]
        try {
          uit[k] = await maaltijdenVoorDag({
            supabase: db.supabase, clientId, activePlan, dagTemplate: templates[k]?.dag || null,
            dayKey, datum: k, workoutSchedule, trainingStart: trainingStarts[dayKey],
          })
        } catch { uit[k] = [] }
      }))
      if (!weg) setGepland(prev => ({ ...prev, ...uit }))
    })()
    return () => { weg = true }
  }, [isOpen, activePlan, workoutSchedule, db, clientId, weekSleutel, trainingStarts])

  // Water per dag van de getoonde week (alleen in Coach Inzicht).
  const [water, setWater] = useState({}) // { 'YYYY-MM-DD': { ml, doel } }
  const [maandPop, setMaandPop] = useState(null) // plek van de maandknop terwijl het venster open is

  // Gecombineerde week: per dag kcal, eiwit en water naar de kaart Training.
  const meldWeek = gedeeld?.meldWeek
  const doelKcalMeld = Number(targets.calories) || 0
  const doelEiwitMeld = Number(targets.protein) || 0
  useEffect(() => {
    if (!meldWeek || perDag === null) return
    const ma = vanSleutel(weekSleutel)
    const tel = (lijst, veld) => (lijst || []).reduce((t, m) => t + (parseFloat(m[veld]) || 0), 0)
    const dagen = {}
    for (let i = 0; i < 7; i++) {
      const k = sleutel(plusDagen(ma, i))
      const lijst = perDag[k] || []
      const wt = water[k] || null
      dagen[k] = {
        kcal: tel(lijst, 'calories'), eiwit: tel(lijst, 'protein'), gelogd: lijst.length > 0,
        planKcal: tel(gepland[k], 'calories'), planEiwit: tel(gepland[k], 'protein'),
        waterMl: wt?.ml || 0, waterDoel: (wt?.doel || 0) > 0 ? wt.doel : Math.round((Number(waterDoelL) || 3) * 1000),
        // Voor het agendaatje in de tegel: de maaltijden op tijd. Gelogd, en
        // voor een dag zonder logs wat er gepland staat.
        items: lijst.length > 0
          ? lijst.map(m => {
            const t = m.consumed_at ? new Date(m.consumed_at) : null
            return { id: m.id, naam: m.meal_name || 'Maaltijd', min: t ? t.getHours() * 60 + t.getMinutes() : null, kcal: Number(m.calories) || 0, gelogd: true, foto: m.image_url || foodImageFallback(m.meal_name || 'Maaltijd', m.meal_type, 80) }
          })
          : (gepland[k] || []).map((m, n) => {
            const naam = m.name || m.meal_name || 'Maaltijd'
            const [u, mi] = String(m.timing || '').split(':').map(Number)
            return { id: `plan-${n}`, naam, min: Number.isFinite(u) ? u * 60 + (mi || 0) : null, kcal: Number(m.calories) || 0, gelogd: false, foto: resolveFoodImage({ ...m, name: naam }, { size: 80 }) }
          }),
      }
    }
    meldWeek({ dagen, doel: { kcal: doelKcalMeld, eiwit: doelEiwitMeld } })
  }, [meldWeek, perDag, gepland, water, weekSleutel, doelKcalMeld, doelEiwitMeld, waterDoelL])
  useEffect(() => {
    if (!ingebed || !isOpen || !db?.supabase || !clientId) return
    let weg = false
    db.supabase.from('ai_water_tracking')
      .select('date, milliliters, target_milliliters')
      .eq('client_id', clientId)
      .gte('date', weekSleutel).lte('date', sleutel(plusDagen(vanSleutel(weekSleutel), 6)))
      .then(({ data }) => {
        if (weg) return
        const uit = {}
        ;(data || []).forEach(r => { uit[String(r.date).slice(0, 10)] = { ml: Number(r.milliliters) || 0, doel: Number(r.target_milliliters) || 0 } })
        setWater(prev => ({ ...prev, ...uit }))
      }, () => {})
    return () => { weg = true }
  }, [ingebed, isOpen, db, clientId, weekSleutel])

  if (!isOpen) return null

  const doel = { kcal: Number(targets.calories) || 0, eiwit: Number(targets.protein) || 0, koolh: Number(targets.carbs) || 0, vet: Number(targets.fat) || 0 }
  const totaal = (lijst) => (lijst || []).reduce((t, m) => ({
    kcal: t.kcal + (Number(m.calories) || 0),
    eiwit: t.eiwit + (parseFloat(m.protein) || 0),
    koolh: t.koolh + (parseFloat(m.carbs) || 0),
    vet: t.vet + (parseFloat(m.fat) || 0),
  }), { kcal: 0, eiwit: 0, koolh: 0, vet: 0 })

  const vandaagSleutel = sleutel(new Date())
  const gekozenSleutel = sleutel(gekozen)
  const maaltijden = perDag?.[gekozenSleutel] || []
  const suppDag = ingebed ? (supps[gekozenSleutel] || []) : []
  const dag = totaal(maaltijden)
  const gekozenGepland = gepland[sleutel(gekozen)] || null
  // Een dag in de toekomst heeft nog geen logs: dan tellen de geplande
  // maaltijden in de grote cijfers.
  const toekomst = sleutel(gekozen) > sleutel(new Date())
  const toonPlan = toekomst && !!gekozenGepland
  const dagCijfers = toonPlan ? totaal(gekozenGepland) : null
  const verschil = doel.kcal ? Math.round(doel.kcal - dag.kcal) : null

  // Week van de gekozen dag.
  const maandag = maandagVan(gekozen)
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = plusDagen(maandag, i); const k = sleutel(d)
    const plan = k > sleutel(new Date()) && gepland[k] ? totaal(gepland[k]).kcal : 0
    return { d, k, kcal: totaal(perDag?.[k]).kcal, eiwit: totaal(perDag?.[k]).eiwit, gelogd: !!perDag?.[k]?.length, plan }
  })
  const gelogdeDagen = week.filter(w => w.gelogd)
  const weekGem = gelogdeDagen.length ? {
    kcal: gelogdeDagen.reduce((t, w) => t + w.kcal, 0) / gelogdeDagen.length,
    eiwit: gelogdeDagen.reduce((t, w) => t + w.eiwit, 0) / gelogdeDagen.length,
  } : null
  const opDoel = doel.kcal ? gelogdeDagen.filter(w => Math.abs(w.kcal - doel.kcal) <= 100).length : 0
  const staafMax = Math.max(doel.kcal * 1.25, ...week.map(w => Math.max(w.kcal, w.plan)), 1)

  // Reeks: dagen op rij met logs, tot en met vandaag (of gisteren als je
  // vandaag nog niets logde).
  let reeks = 0
  if (perDag) {
    let d = new Date(); d.setHours(0, 0, 0, 0)
    if (!perDag[sleutel(d)]?.length) d = plusDagen(d, -1)
    while (perDag[sleutel(d)]?.length) { reeks++; d = plusDagen(d, -1) }
  }

  // Kalender.
  const eerste = new Date(maand.y, maand.m, 1)
  const leeg = (eerste.getDay() + 6) % 7
  const dagenInMaand = new Date(maand.y, maand.m + 1, 0).getDate()
  const cellen = [...Array(leeg).fill(null), ...Array.from({ length: dagenInMaand }, (_, i) => i + 1)]
  while (cellen.length % 7) cellen.push(null)
  const vorigeMaand = () => setMaand(({ y, m }) => (m === 0 ? { y: y - 1, m: 11 } : { y, m: m - 1 }))
  const volgendeMaand = () => setMaand(({ y, m }) => (m === 11 ? { y: y + 1, m: 0 } : { y, m: m + 1 }))

  // Ligt de gekozen dag in de week die op de maaltijdpagina openstaat? Dan
  // kun je er direct naartoe.
  const dezeWeek = maandagVan(new Date())
  const inDezeWeek = gekozen >= dezeWeek && gekozen <= plusDagen(dezeWeek, 6)
  const kies = (d) => { if (gedeeld?.setGekozen) gedeeld.setGekozen(d); else setGekozen(d); if (d.getMonth() !== maand.m || d.getFullYear() !== maand.y) setMaand({ y: d.getFullYear(), m: d.getMonth() }) }

  const pijl = {
    width: 34, height: 34, padding: 0, background: 'transparent', border: 'none', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
    touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
  }
  const dagTitel = gekozenSleutel === vandaagSleutel ? 'Vandaag'
    : gekozenSleutel === sleutel(plusDagen(new Date(), -1)) ? 'Gisteren'
    : gekozen.toLocaleDateString('nl-NL', { weekday: 'long' })

  // Weekcijfers voor Coach Inzicht: gekleurd van rood naar groen, met uitleg.
  const schaal = (t) => {
    const x = Math.max(0, Math.min(1, t))
    const van = x < 0.5 ? [239, 68, 68] : [245, 158, 11]
    const naar = x < 0.5 ? [245, 158, 11] : [16, 185, 129]
    const u = x < 0.5 ? x / 0.5 : (x - 0.5) / 0.5
    return `rgb(${van.map((v, i) => Math.round(v + (naar[i] - v) * u)).join(',')})`
  }
  // Dagen van deze week die al geweest zijn (vandaag telt mee).
  const geweest = week.filter(w => w.k <= vandaagSleutel).length
  const stats = [
    {
      id: 'kcal', label: 'gem. kcal', waarde: weekGem ? fmt(weekGem.kcal) : '–',
      kleur: weekGem && doel.kcal ? kcalKleur(weekGem.kcal, doel.kcal, '#fff') : '#fff',
      uitleg: !doel.kcal ? 'Geen kcal-doel ingesteld.' : !weekGem ? `Doel ${fmt(doel.kcal)} kcal per dag. Deze week nog niets gelogd.`
        : `Doel ${fmt(doel.kcal)} kcal per dag, werkelijk gemiddeld ${fmt(weekGem.kcal)} over ${gelogdeDagen.length} gelogde ${gelogdeDagen.length === 1 ? 'dag' : 'dagen'}: ${weekGem.kcal >= doel.kcal ? `${fmt(weekGem.kcal - doel.kcal)} erboven` : `${fmt(doel.kcal - weekGem.kcal)} eronder`}.`,
    },
    {
      id: 'eiwit', label: 'gem. eiwit', waarde: weekGem ? `${fmt(weekGem.eiwit)}g` : '–',
      // 60% van het doel of minder is rood, het doel halen is groen.
      kleur: weekGem && doel.eiwit ? schaal((weekGem.eiwit / doel.eiwit - 0.6) / 0.4) : '#fff',
      uitleg: !doel.eiwit ? 'Geen eiwitdoel ingesteld.' : !weekGem ? `Doel ${fmt(doel.eiwit)} g per dag. Deze week nog niets gelogd.`
        : `Doel ${fmt(doel.eiwit)} g per dag, werkelijk gemiddeld ${fmt(weekGem.eiwit)} g (${Math.round((weekGem.eiwit / doel.eiwit) * 100)}% van het doel).`,
    },
    {
      id: 'dagen', label: 'dagen gelogd', waarde: `${gelogdeDagen.length}/7`,
      kleur: geweest ? schaal(gelogdeDagen.length / geweest) : '#fff',
      uitleg: geweest ? `Doel: elke dag loggen. ${gelogdeDagen.length} van de ${geweest} ${geweest === 1 ? 'dag' : 'dagen'} die al geweest zijn.` : 'Deze week moet nog beginnen.',
    },
    ...(doel.kcal > 0 ? [{
      id: 'opdoel', label: 'op doel', waarde: `${opDoel}/${gelogdeDagen.length || 0}`,
      kleur: gelogdeDagen.length ? schaal(opDoel / gelogdeDagen.length) : '#fff',
      uitleg: `Op doel = binnen 100 kcal van ${fmt(doel.kcal)}. ${opDoel} van de ${gelogdeDagen.length} gelogde ${gelogdeDagen.length === 1 ? 'dag' : 'dagen'}.`,
    }] : []),
  ]
  const statOpen = ingebed ? stats.find(x => x.id === statInfo) : null

  // De dag zelf (cijfers, gepland, gelogd). Bij de klant bovenaan; in Coach
  // Inzicht onder de weekstrook, omdat je daar de dag kiest.
  const dagCijfersBlok = (
    <>
              {/* ── 1. De dag ── */}
              {/* Coach Inzicht: kcal en de drie macro's op één regel. */}
              {ingebed && (() => {
                const c = toonPlan ? dagCijfers : dag
                return (
                  <div style={{ display: 'flex', gap: 14 }}>
                    <MacroBalk compact label={toonPlan ? 'Kcal gepland' : 'Kcal'} waarde={c.kcal} doel={doel.kcal} eenheid="" kleur={toonPlan ? 'rgba(255,255,255,0.45)' : maaltijden.length ? kcalKleur(dag.kcal, doel.kcal, '#fff') : '#fff'} onKlik={onDoelen} hint="Doelen & macro's aanpassen" />
                    <MacroBalk compact label="Eiwit" waarde={c.eiwit} doel={doel.eiwit} />
                    <MacroBalk compact label="Koolh." waarde={c.koolh} doel={doel.koolh} />
                    <MacroBalk compact label="Vet" waarde={c.vet} doel={doel.vet} />
                    {/* Water van de gekozen dag: gedronken / doel in liters. Klik = doel aanpassen.
                        Vandaag telt het doel van nu; een oude dag houdt het doel van toen. */}
                    {(() => {
                      const wt = water[gekozenSleutel] || null
                      const doelNu = Math.round((Number(waterDoelL) || 3) * 1000)
                      const doelMl = gekozenSleutel < vandaagSleutel && (wt?.doel || 0) > 0 ? wt.doel : doelNu
                      const ml = wt?.ml || 0
                      const l = (x) => (x / 1000).toFixed(1).replace('.', ',').replace(',0', '')
                      return (
                        <button type="button" onClick={onWaterKlik || undefined} disabled={!onWaterKlik} title="Waterdoel aanpassen" aria-label={`Water ${l(ml)} van ${l(doelMl)} liter. Doel aanpassen`}
                          style={{ flex: 1, minWidth: 0, padding: 0, background: 'none', border: 'none', textAlign: 'left', fontFamily: 'inherit', cursor: onWaterKlik ? 'pointer' : 'default' }}>
                          <div style={{ fontSize: '0.58rem', fontWeight: 900, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em', lineHeight: 1.1 }}>Water</div>
                          <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#fff', fontVariantNumeric: 'tabular-nums', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {l(ml)}<span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)' }}> / {l(doelMl)}L</span>
                          </div>
                          <div style={{ height: 3, marginTop: 3, borderRadius: 2, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                            <div style={{ width: `${Math.min(100, (ml / Math.max(1, doelMl)) * 100)}%`, height: '100%', background: '#38bdf8', borderRadius: 2, transition: 'width 0.4s ease' }} />
                          </div>
                        </button>
                      )
                    })()}
                  </div>
                )
              })()}
              {!ingebed && (<>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: isMobile ? '2.2rem' : '2.5rem', fontWeight: 900, color: '#fff', lineHeight: 1, letterSpacing: '-0.04em', fontVariantNumeric: 'tabular-nums' }}>
                    {fmt(toonPlan ? dagCijfers.kcal : dag.kcal)}<span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)', letterSpacing: 0 }}>{doel.kcal ? ` / ${fmt(doel.kcal)} kcal` : ' kcal'}</span>
                  </div>
                  {toonPlan && (
                    <div style={{ marginTop: 6, fontSize: '0.8rem', fontWeight: 800, color: 'rgba(255,255,255,0.55)' }}>Gepland</div>
                  )}
                  {verschil !== null && maaltijden.length > 0 && (
                    <div style={{ marginTop: 6, fontSize: '0.8rem', fontWeight: 800, color: kcalKleur(dag.kcal, doel.kcal) }}>
                      {Math.abs(verschil) <= doel.kcal * 0.1
                        ? 'Op doel'
                        : verschil > 0 ? `Nog ${fmt(verschil)} kcal over` : `${fmt(-verschil)} kcal boven je doel`}
                    </div>
                  )}
                </div>
              </div>
              {doel.kcal > 0 && (
                <div style={{ height: 6, marginTop: 12, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(100, ((toonPlan ? dagCijfers.kcal : dag.kcal) / doel.kcal) * 100)}%`, height: '100%', borderRadius: 3, background: toonPlan ? 'rgba(255,255,255,0.45)' : maaltijden.length ? kcalKleur(dag.kcal, doel.kcal) : 'transparent', transition: 'width 0.4s ease' }} />
                </div>
              )}
              <div style={{ display: 'flex', gap: 14, marginTop: '1.1rem' }}>
                <MacroBalk label="Eiwit" waarde={(toonPlan ? dagCijfers : dag).eiwit} doel={doel.eiwit} />
                <MacroBalk label="Koolh." waarde={(toonPlan ? dagCijfers : dag).koolh} doel={doel.koolh} />
                <MacroBalk label="Vet" waarde={(toonPlan ? dagCijfers : dag).vet} doel={doel.vet} />
              </div>
              </>)}

              {onOpenDag ? (
                <button
                  onClick={() => { onOpenDag(gekozen); onClose?.() }}
                  style={{ marginTop: '1rem', width: '100%', minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'transparent', border: `1px solid rgba(255,255,255,0.2)`, borderRadius: 12, color: '#fff', fontSize: '0.85rem', fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
                >
                  <CalendarDays size={16} strokeWidth={2.6} /> {toekomst ? 'Pas deze dag aan in je plan' : 'Open deze dag in je plan'}
                </button>
              ) : (<>
                {onDayChange && inDezeWeek && gekozenSleutel !== sleutel(startDatum) && (
                <button
                  onClick={() => { onDayChange?.(DAYS_OF_WEEK[(gekozen.getDay() + 6) % 7]); onClose?.() }}
                  style={{ marginTop: '1rem', width: '100%', minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'transparent', border: `1px solid rgba(255,255,255,0.2)`, borderRadius: 12, color: '#fff', fontSize: '0.85rem', fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
                >
                  <CalendarDays size={16} strokeWidth={2.6} /> Open deze dag in je plan
                </button>
              )}

              </>)}
    </>
  )
  const dagGeplandBlok = (
    <>

              {/* ── Gepland (vandaag en later) ── */}
              {gekozenGepland && sleutel(gekozen) >= vandaagSleutel && (<>
                {kopje('Gepland', gekozenGepland.length ? `${gekozenGepland.length} ${gekozenGepland.length === 1 ? 'maaltijd' : 'maaltijden'}` : null, ingebed)}
                {gekozenGepland.length === 0 ? (
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>Voor deze dag staat niets in je plan.</div>
                ) : gekozenGepland.map((m, i) => {
                  const naam = m.name || m.meal_name || 'Maaltijd'
                  return (
                    <button key={`${m.slot}-${i}`} onClick={onWisselMaaltijd ? () => { onWisselMaaltijd(gekozen, m); onClose?.() } : undefined} style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '0.5rem 0',
                      background: 'none', border: 'none', borderTop: i ? `1px solid ${LIJN}` : 'none', textAlign: 'left',
                      fontFamily: 'inherit', cursor: onWisselMaaltijd ? 'pointer' : 'default',
                      touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                    }}>
                      <span style={{ width: 42, height: 42, flexShrink: 0, borderRadius: 10, backgroundImage: `url(${resolveFoodImage({ ...m, name: naam }, { size: 120 })})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: 'rgba(255,255,255,0.05)' }} />
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {m.timeSlot || m.display_label || ''}{m.timing ? ` · ${m.timing}` : ''}
                        </span>
                        <span style={{ display: 'block', fontSize: '0.88rem', fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 1 }}>{naam}</span>
                      </span>
                      <span style={{ flexShrink: 0, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        <span style={{ display: 'block', fontSize: '0.86rem', fontWeight: 900, color: '#fff' }}>{fmt(m.calories)} kcal</span>
                        <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>{fmt(m.protein)}g eiwit</span>
                      </span>
                      {onWisselMaaltijd && <RefreshCw size={15} strokeWidth={2.6} color="rgba(255,255,255,0.5)" style={{ flexShrink: 0 }} />}
                    </button>
                  )
                })}
              </>)}
    </>
  )
  const dagKopBlok = (
    <>

              {/* ── 2. Wat je hebt gelogd ── */}
              {!toekomst && !ingebed && kopje('Gelogd', maaltijden.length ? `${maaltijden.length} ${maaltijden.length === 1 ? 'maaltijd' : 'maaltijden'}` : null)}
              {/* Coach Inzicht: de gelogde maaltijden als stapeltje kaarten dat
                  openklapt, zoals 'gedaan' op de homepagina van de klant. */}
              {ingebed && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '0.7rem 0 0', minHeight: 44 }}>
              {!toekomst && (maaltijden.length > 0 || suppDag.length > 0) ? (
                <button onClick={wisselLijst} aria-expanded={!lijstDicht}
                  aria-label={`${maaltijden.length} gelogd, ${lijstDicht ? 'bekijken' : 'inklappen'}`}
                  style={{ flexShrink: 0, minWidth: 0, display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', background: 'transparent', border: 'none', fontFamily: 'inherit', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
                  <style>{`@keyframes ciDeckUit { from { opacity: 0; transform: translateY(-6px) } to { opacity: 1; transform: translateY(0) } }`}</style>
                  <span style={{ display: 'flex', alignItems: 'center', paddingLeft: 2 }}>
                    {maaltijden.slice(0, 8).map((m, i) => {
                      const rot = ((i * 37) % 9) - 4
                      return (
                        <span key={m.id || i} style={{
                          width: 28, height: 36, marginLeft: i ? -12 : 0, borderRadius: 6, flexShrink: 0,
                          border: '2px solid #0e0e0e', boxShadow: '0 3px 8px rgba(0,0,0,0.5)',
                          background: `url(${m.image_url || foodImageFallback(m.meal_name || 'Maaltijd', m.meal_type, 120)}) center/cover, #1c1c1c`,
                          transform: `rotate(${rot}deg)`, zIndex: i,
                        }} />
                      )
                    })}
                    {suppDag.length > 0 && (
                      <span style={{ width: 28, height: 36, marginLeft: maaltijden.length ? -12 : 0, borderRadius: 6, flexShrink: 0, border: '2px solid #0e0e0e', boxShadow: '0 3px 8px rgba(0,0,0,0.5)', background: '#1c1c1c', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'rotate(3deg)', zIndex: 9 }}>
                        <Pill size={13} strokeWidth={2.6} color={GROEN} />
                      </span>
                    )}
                  </span>
                  <span style={{ fontSize: '0.78rem', fontWeight: 900, color: GROEN, whiteSpace: 'nowrap' }}>
                    {maaltijden.length} gelogd{suppDag.length > 0 ? ` · ${suppDag.length} ${suppDag.length === 1 ? 'supplement' : 'supplementen'}` : ''}
                  </span>
                  <ChevronRight size={15} strokeWidth={3} color="rgba(255,255,255,0.4)" style={{ flexShrink: 0, transform: lijstDicht ? 'none' : 'rotate(90deg)', transition: 'transform 0.2s ease' }} />
                </button>
              ) : (
                <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' }}>{toekomst ? 'Nog niet geweest' : 'Niets gelogd'}</span>
              )}
                {/* Weekcijfers, klein en dicht op elkaar, rechts van het stapeltje. */}
                <span style={{ marginLeft: 'auto', display: 'flex', gap: 12, flexShrink: 0 }}>
                  {stats.map(x => (
                    <button key={x.id} onClick={() => setStatInfo(v => (v === x.id ? null : x.id))} title={x.uitleg}
                      style={{ padding: 0, background: 'none', border: 'none', textAlign: 'right', fontFamily: 'inherit', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
                      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 3, fontSize: '0.84rem', fontWeight: 900, color: x.kleur, fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}>
                        {x.waarde}<Info size={10} strokeWidth={2.6} color={statInfo === x.id ? '#fff' : 'rgba(255,255,255,0.35)'} />
                      </span>
                      <span style={{ display: 'block', fontSize: '0.5rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 1, whiteSpace: 'nowrap' }}>{x.label}</span>
                    </button>
                  ))}
                </span>
              </div>
              )}
              {ingebed && statOpen && <div style={{ marginTop: 2, fontSize: '0.74rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)', lineHeight: 1.4, textAlign: 'right' }}>{statOpen.uitleg}</div>}
    </>
  )
  const dagLijstBlok = (
    <>
              {toekomst || (ingebed && (lijstDicht || maaltijden.length === 0)) ? null : maaltijden.length === 0 ? (
                <div style={{ marginTop: ingebed ? '0.6rem' : 0, fontSize: ingebed ? '0.76rem' : '0.82rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>Op deze dag is niets gelogd.</div>
              ) : maaltijden.map((m, i) => {
                const naam = m.meal_name || 'Maaltijd'
                const foto = m.image_url || foodImageFallback(naam, m.meal_type, 120)
                return (
                  <div key={m.id || i} style={{ borderTop: i ? `1px solid ${LIJN}` : 'none', animation: ingebed ? 'ciDeckUit 0.25s ease' : 'none' }}>
                  <div onClick={ingebed ? () => openInfo(m) : undefined} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.5rem 0', cursor: ingebed ? 'pointer' : 'default' }}>
                    <span style={{ width: 42, height: 42, flexShrink: 0, borderRadius: 10, backgroundImage: `url(${foto})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: 'rgba(255,255,255,0.05)' }} />
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', fontSize: '0.88rem', fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{naam}</span>
                      <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)', marginTop: 1 }}>
                        {new Date(m.consumed_at).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                        {ingebed && (() => {
                          // Waar de log vandaan komt: plan, barcode, zoeken, ingepland…
                          const bron = bronVan(m)
                          const isIngepland = ingepland.has(m.id)
                          const uitPlan = bron === 'plan'
                          if (bron === 'onbekend' && !isIngepland) return null
                          return (
                            <span title={isIngepland ? 'Vooraf ingepland en daarna als gegeten afgevinkt' : BRONNEN[bron]?.uitleg}
                              style={{ marginLeft: 6, fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: uitPlan || isIngepland ? GROEN : 'rgba(255,255,255,0.75)' }}>
                              · {isIngepland ? 'Ingepland' : BRONNEN[bron]?.tekst}
                            </span>
                          )
                        })()}
                      </span>
                    </span>
                    <span style={{ flexShrink: 0, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      <span style={{ display: 'block', fontSize: '0.86rem', fontWeight: 900, color: '#fff' }}>{fmt(m.calories)} kcal</span>
                      <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>{fmt(m.protein)}g eiwit</span>
                    </span>
                    {ingebed && <Info size={16} strokeWidth={2.4} color={info?.id === m.id ? '#fff' : 'rgba(255,255,255,0.45)'} style={{ flexShrink: 0 }} />}
                  </div>
                  {ingebed && info?.id === m.id && (
                    <div style={{ padding: '0 0 0.6rem 52px' }}>
                      <div style={{ fontSize: '0.74rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)', fontVariantNumeric: 'tabular-nums' }}>
                        {Number(m.amount) > 0 && <><b style={{ color: '#fff', fontWeight: 900 }}>{String(Math.round(Number(m.amount) * 10) / 10).replace('.', ',')}{eenheidKort(m.per_unit)}</b> · </>}
                        {fmt(m.protein)} E · {fmt(m.carbs)} K · {fmt(m.fat)} V
                      </div>
                      {info.ingredienten === null ? (
                        <div style={{ marginTop: 6, fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>Laden…</div>
                      ) : info.ingredienten.length === 0 ? (
                        <div style={{ marginTop: 6, fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>
                          {Number(m.amount) > 0 && !/portion|portie/i.test(m.per_unit || '') ? 'Los product, geen ingrediënten.' : 'Van deze maaltijd zijn geen ingrediënten gelogd.'}
                        </div>
                      ) : (
                        <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 3 }}>
                          {info.bron === 'recept' && <div style={{ fontSize: '0.62rem', fontWeight: 900, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Volgens het recept</div>}
                          {info.ingredienten.map((x, n) => (
                            <div key={`${x.name}-${n}`} style={{ display: 'flex', gap: 8, fontSize: '0.76rem', fontWeight: 700, color: 'rgba(255,255,255,0.65)', fontVariantNumeric: 'tabular-nums' }}>
                              <span style={{ flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{x.name}</span>
                              <span style={{ flexShrink: 0, fontWeight: 900, color: '#fff' }}>{fmt(x.amount)}{eenheidKort(x.unit)}</span>
                              <span style={{ flexShrink: 0, width: 62, textAlign: 'right' }}>{fmt(x.calories)} kcal</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {m.notes && <div style={{ marginTop: 6, fontSize: '0.74rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)', fontStyle: 'italic' }}>{m.notes}</div>}
                    </div>
                  )}
                  </div>
                )
              })}

              {/* Afgevinkte supplementen: één rij onder de maaltijden. */}
              {ingebed && !toekomst && !lijstDicht && suppDag.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.5rem 0', borderTop: maaltijden.length ? `1px solid ${LIJN}` : 'none', animation: 'ciDeckUit 0.25s ease' }}>
                  <span style={{ width: 42, height: 42, flexShrink: 0, borderRadius: 10, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Pill size={18} strokeWidth={2.4} color={GROEN} />
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: '0.88rem', fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={suppDag.map(x => x.naam).join(' · ')}>{suppDag.map(x => x.naam).join(' · ')}</span>
                    <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)', marginTop: 1 }}>
                      {suppDag[0].tijd ? new Date(suppDag[0].tijd).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }) : ''}
                      <span style={{ marginLeft: suppDag[0].tijd ? 6 : 0, fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: GROEN }}>{suppDag[0].tijd ? '· ' : ''}Supplementen</span>
                    </span>
                  </span>
                  <span style={{ flexShrink: 0, fontSize: '0.86rem', fontWeight: 900, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>{suppDag.length}×</span>
                </div>
              )}

    </>
  )

  const inhoud = (
    <div
      onClick={zwevend || ingebed ? undefined : onClose}
      style={gedeeld ? {} : ingebed ? { height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 } : zwevend ? { position: 'fixed', inset: 0, zIndex: 2147482000, pointerEvents: 'none' } : {
        position: 'fixed', inset: 0, zIndex: 2147482000,
        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
        display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center',
        padding: isMobile ? 0 : '1.5rem', paddingTop: 'env(safe-area-inset-top)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={gedeeld ? {} : ingebed ? {
          flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden',
        } : zwevend ? {
          ...venster.vensterStijl, zIndex: 2147482000, pointerEvents: 'auto',
          background: '#0a0a0a', border: isMobile ? 'none' : `1px solid ${LIJN}`, borderRadius: isMobile ? 0 : 16,
          boxShadow: '0 12px 28px rgba(0,0,0,0.5), 0 4px 12px rgba(0,0,0,0.35)',
        } : {
          width: '100%', maxWidth: isMobile ? '100%' : 540, maxHeight: isMobile ? '92vh' : '88vh',
          background: '#0a0a0a', border: `1px solid ${LIJN}`, borderRadius: isMobile ? '20px 20px 0 0' : 20,
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}
      >
        {/* Kop: gekozen dag met pijlen, sluiten. Zwevend ook het sleephandvat. */}
        {!ingebed && (
        <div
          {...(zwevend && !ingebed ? venster.sleepHandvat : {})}
          style={ingebed
            ? { display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, padding: isMobile ? '0.5rem 0.6rem 0.2rem 1rem' : '0.4rem 0.8rem 0.1rem 1.25rem' }
            : { display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, padding: isMobile ? '0.9rem 0.75rem 0.8rem 1rem' : '1rem 1rem 0.9rem 1.25rem', borderBottom: `1px solid ${LIJN}`, ...(zwevend ? (venster.sleepHandvat.style || {}) : {}) }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: ingebed ? 'none' : 'block', fontSize: '0.62rem', fontWeight: 900, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Inzicht</div>
            <div style={{ fontSize: isMobile ? '1.1rem' : '1.2rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', textTransform: 'capitalize', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {dagTitel} <span style={{ fontWeight: 800, color: 'rgba(255,255,255,0.55)', textTransform: 'none' }}>· {gekozen.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }).replace(/\.$/, '')}</span>
            </div>
          </div>
          <button onClick={() => kies(plusDagen(gekozen, -1))} aria-label="Vorige dag" style={pijl}><ChevronLeft size={20} strokeWidth={3} /></button>
          <button onClick={() => kies(plusDagen(gekozen, 1))} aria-label="Volgende dag" style={pijl}><ChevronRight size={20} strokeWidth={3} /></button>
          {!ingebed && <button onClick={onClose} aria-label="Sluiten" style={{ ...pijl, width: 38, height: 38, marginLeft: 4, borderRadius: 11, background: 'rgba(255,255,255,0.06)', border: `1px solid ${LIJN}` }}><X size={18} strokeWidth={2.8} /></button>}
        </div>
        )}

        <div style={gedeeld ? {} : { flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: ingebed ? (isMobile ? '0.4rem 1rem 1rem' : '0.4rem 1.25rem 1rem') : isMobile ? '1rem 1rem 1.5rem' : '1.2rem 1.25rem 1.6rem' }}>
          {perDag === null ? (
            <div style={{ padding: '2.5rem 0', textAlign: 'center', fontSize: '0.85rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>Laden…</div>
          ) : (
            <>
              {!ingebed && <>{dagCijfersBlok}{dagGeplandBlok}{dagKopBlok}{dagLijstBlok}</>}

              {/* ── 3. De week ── */}
              {/* Coach Inzicht: geen regel 'Week van …'; de weekpijlen staan
                  links van ma en rechts van zo, met de datum naast de dag. */}
              <div style={{ display: ingebed ? 'none' : 'flex', alignItems: 'center', gap: 4, margin: '1.5rem 0 0.75rem' }}>
                <button onClick={() => kies(plusDagen(gekozen, -7))} aria-label="Vorige week" style={{ ...pijl, width: 28, height: 28, marginLeft: -6 }}><ChevronLeft size={16} strokeWidth={3} /></button>
                <span style={{ fontSize: '0.66rem', fontWeight: 900, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Week van {maandag.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }).replace(/\.$/, '')}
                </span>
                <button onClick={() => kies(plusDagen(gekozen, 7))} aria-label="Volgende week" style={{ ...pijl, width: 28, height: 28 }}><ChevronRight size={16} strokeWidth={3} /></button>
                {doel.kcal > 0 && <span style={{ marginLeft: 'auto', fontSize: '0.72rem', fontWeight: 800, color: 'rgba(255,255,255,0.55)' }}>{opDoel}/{gelogdeDagen.length || 0} op doel</span>}
              </div>
              {/* Coach Inzicht: de dagenstrook boven de tegels, zelfde vorm als bij
                  Training: gekozen dag als witte pil, weekpijlen in het ma- en zo-vak. */}
              <div style={gedeeld ? { position: 'sticky', top: 0, zIndex: 3, background: '#050505', paddingBottom: 6 } : ingebed ? { position: 'sticky', top: '-0.4rem', zIndex: 5, background: '#0e0e0e', margin: `0 ${isMobile ? '-1rem' : '-1.25rem'}`, padding: `0.4rem ${isMobile ? '1rem' : '1.25rem'} 0.5rem`, borderBottom: `1px solid ${LIJN}` } : undefined}>
              {ingebed && !gedeeld && (
                <div style={{ display: 'flex', gap: 6, margin: '0.3rem 0 5px' }}>
                  {week.map((w, i) => {
                    const aan = w.k === gekozenSleutel
                    const wPijl = { ...pijl, width: 18, height: 26, flexShrink: 0, color: aan ? '#000' : '#fff' }
                    return (
                      <div key={w.k} onClick={() => kies(w.d)} style={{
                        flex: 1, minWidth: 0, minHeight: 26, borderRadius: 7, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: aan ? '#fff' : 'transparent', color: aan ? '#000' : 'rgba(255,255,255,0.7)',
                        fontSize: '0.68rem', fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase',
                        whiteSpace: 'nowrap', overflow: 'hidden',
                      }}>
                        {i === 0 && <button onClick={(e) => { e.stopPropagation(); kies(plusDagen(gekozen, -7)) }} aria-label="Vorige week" title="Vorige week" style={wPijl}><ChevronLeft size={16} strokeWidth={3} /></button>}
                        {/* De maand: klein venster met de kalender, in het maandagvak (17 nov 2026). */}
                        {i === 0 && (
                          <button type="button" aria-haspopup="dialog" aria-expanded={!!maandPop} aria-label="Maand kiezen" title={`${NL_MONTHS[maand.m]} ${maand.y}${reeks > 0 ? ` · ${reeks} ${reeks === 1 ? 'dag' : 'dagen'} op rij gelogd` : ''}`}
                            onClick={(e) => { e.stopPropagation(); const r = e.currentTarget.getBoundingClientRect(); setMaandPop(o => (o ? null : { x: r.left, y: r.bottom + 2, boven: r.top })) }}
                            style={{ ...wPijl, width: 20 }}>
                            <CalendarDays size={14} strokeWidth={2.6} />
                          </button>
                        )}
                        <span style={{ flex: i === 0 || i === 6 ? 1 : 'none', minWidth: 0, textAlign: 'center', display: 'inline-flex', justifyContent: 'center', gap: 3 }}>
                          {NL_DAY_SHORT[i]}<span style={{ fontWeight: 800, opacity: aan ? 0.75 : 0.6, letterSpacing: 0 }}>{w.d.getDate()}</span>
                        </span>
                        {/* Plan openen, in het zondagvak. */}
                        {i === 6 && onPlan && (
                          <button type="button" onClick={(e) => { e.stopPropagation(); onPlan() }} aria-label="Plan openen" title="Openen in de Plan Analyzer" style={{ ...wPijl, width: 20 }}>
                            <ExternalLink size={13} strokeWidth={2.6} />
                          </button>
                        )}
                        {i === 6 && <button onClick={(e) => { e.stopPropagation(); kies(plusDagen(gekozen, 7)) }} aria-label="Volgende week" title="Volgende week" style={wPijl}><ChevronRight size={16} strokeWidth={3} /></button>}
                      </div>
                    )
                  })}
                </div>
              )}
              <div style={{ position: 'relative', height: ingebed ? 84 : 120, display: gedeeld ? 'none' : 'flex', alignItems: 'flex-end', gap: 6 }}>
                {doel.kcal > 0 && (
                  <div style={{ position: 'absolute', left: 0, right: 0, bottom: `${(doel.kcal / staafMax) * 100}%`, borderTop: '1px dashed rgba(255,255,255,0.35)', pointerEvents: 'none', zIndex: 1 }} />
                )}
                {ingebed ? week.map((w, i) => {
                  // Coach Inzicht: elke dag een tegel met een donkere foto van
                  // wat er gegeten (of gepland) is; de kcal vult van onderen,
                  // het water staat als strook rechts (zoals stappen bij Training).
                  const aan = w.k === gekozenSleutel
                  const eerste = perDag?.[w.k]?.[0] || null
                  const plan = !eerste && gepland[w.k]?.[0] ? gepland[w.k][0] : null
                  const foto = eerste ? (eerste.image_url || foodImageFallback(eerste.meal_name || 'Maaltijd', eerste.meal_type, 200))
                    : plan ? resolveFoodImage({ ...plan, name: plan.name || plan.meal_name || 'Maaltijd' }, { size: 200 }) : null
                  const kcal = w.gelogd ? w.kcal : w.plan
                  const wt = water[w.k] || null
                  const waterDoel = (wt?.doel || 0) > 0 ? wt.doel : Math.round((Number(waterDoelL) || 3) * 1000)
                  const waterDeel = wt ? Math.min(1, wt.ml / Math.max(1, waterDoel)) : 0
                  const liter = (ml) => (ml / 1000).toFixed(1).replace('.', ',')
                  return (
                    <button key={w.k} onClick={() => kies(w.d)}
                      aria-label={`${NL_DAY_SHORT[i]} ${fmt(w.kcal)} kcal`}
                      title={`${fmt(kcal)} kcal${w.gelogd ? '' : w.plan ? ' gepland' : ''} · water ${liter(wt?.ml || 0)} / ${liter(waterDoel)} L`}
                      style={{
                        position: 'relative', flex: 1, minWidth: 0, height: '100%', padding: 0, overflow: 'hidden', borderRadius: 8,
                        background: 'rgba(255,255,255,0.05)', border: 'none', cursor: 'pointer',
                        outline: aan ? '2px solid #fff' : 'none', outlineOffset: -2,
                        touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                      }}>
                      {/* De foto ís de staaf: hij vult van onderen tot de hoogte
                          van de kcal, donker, met kcal en eiwit er dik overheen. */}
                      {kcal > 0 && (
                        <span style={{
                          position: 'absolute', left: 0, right: 5, bottom: 0, height: `${Math.max(34, Math.min(100, (kcal / staafMax) * 100))}%`,
                          overflow: 'hidden', borderRadius: '6px 0 0 0', background: 'rgba(255,255,255,0.1)', transition: 'height 0.3s ease',
                        }}>
                          {foto && <span style={{ position: 'absolute', inset: 0, backgroundImage: `url(${foto})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: w.gelogd ? 0.4 : 0.2 }} />}
                          <span style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.55) 100%)' }} />
                          {/* Kleur van de kcal tegen het doel: dunne lijn bovenop de staaf. */}
                          {w.gelogd && <span style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 2, background: kcalKleur(w.kcal, doel.kcal, '#fff') }} />}
                          <span style={{ position: 'absolute', left: 2, right: 2, bottom: 4, textAlign: 'center', lineHeight: 1.1, textShadow: '0 1px 6px rgba(0,0,0,0.9)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                            <span style={{ display: 'block', fontSize: '0.78rem', fontWeight: 900, letterSpacing: '-0.02em', color: w.gelogd ? kcalKleur(w.kcal, doel.kcal, '#fff') : 'rgba(255,255,255,0.6)' }}>{fmt(kcal)}</span>
                            {w.gelogd && <span style={{ display: 'block', fontSize: '0.6rem', fontWeight: 900, color: '#fff' }}>E {fmt(w.eiwit)}g</span>}
                          </span>
                        </span>
                      )}
                      {/* Water: strook langs de rechterkant, van onderen gevuld. */}
                      <span style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: 5, background: 'rgba(0,0,0,0.55)' }}>
                        <span style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: `${Math.round(waterDeel * 100)}%`, background: '#38bdf8', transition: 'height 0.3s ease' }} />
                      </span>
                    </button>
                  )
                }) : week.map((w, i) => {
                  const aan = w.k === gekozenSleutel
                  return (
                    <button key={w.k} onClick={() => kies(w.d)} aria-label={`${NL_DAY_SHORT[i]} ${fmt(w.kcal)} kcal`} style={{ flex: 1, height: '100%', padding: 0, background: 'transparent', border: 'none', display: 'flex', alignItems: 'flex-end', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
                      <span style={{
                        // Toekomst: wat er gepland staat, als lichte staaf.
                        width: '100%', height: `${Math.max(w.gelogd || w.plan ? 4 : 2, ((w.gelogd ? w.kcal : w.plan) / staafMax) * 100)}%`, borderRadius: 6,
                        background: w.gelogd ? kcalKleur(w.kcal, doel.kcal) : w.plan ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.08)',
                        opacity: aan ? 1 : 0.55, outline: aan ? '2px solid #fff' : 'none', outlineOffset: 2,
                        transition: 'height 0.3s ease',
                      }} />
                    </button>
                  )
                })}
              </div>
              {/* Coach Inzicht: tot hier staat alles vast (dagen, tegels, cijfers, weekstats);
                  gepland en gelogd scrollen eronderdoor. */}
              {ingebed && <div style={{ marginTop: gedeeld ? 0 : '0.8rem' }}>{dagCijfersBlok}{dagKopBlok}</div>}
              </div>
              {ingebed && <>{dagGeplandBlok}{dagLijstBlok}</>}
              {!ingebed && (
              <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                {week.map((w, i) => (
                  <span key={w.k} style={{ flex: 1, textAlign: 'center', fontSize: '0.62rem', fontWeight: 900, color: w.k === gekozenSleutel ? '#fff' : 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{NL_DAY_SHORT[i]}</span>
                ))}
              </div>
              )}
              {/* Coach Inzicht: de weekcijfers gekleurd van rood (ver van het
                  doel) naar groen (op het doel), met per cijfer een i voor
                  doel tegenover werkelijkheid. */}
              {ingebed ? null : (
              <div style={{ display: 'flex', gap: 18, marginTop: '0.9rem' }}>
                <div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>{weekGem ? fmt(weekGem.kcal) : '–'}</div>
                  <div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>gem. kcal</div>
                </div>
                <div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>{weekGem ? `${fmt(weekGem.eiwit)}g` : '–'}</div>
                  <div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>gem. eiwit</div>
                </div>
                <div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>{gelogdeDagen.length}/7</div>
                  <div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>dagen gelogd</div>
                </div>
              </div>
              )}
              <div style={{ display: ingebed ? 'none' : 'flex', flexWrap: 'wrap', gap: '0.3rem 0.9rem', marginTop: '0.7rem', fontSize: '0.64rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)' }}>
                {/* Kleur = hoeveel kcal ernaast, eronder of erboven. */}
                {[['±50', 50], ['±100', 100], ['±200', 200], ['300+', 300]].map(([tekst, af]) => (
                  <span key={tekst} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: kcalKleur(1000 + af, 1000) }} />{tekst}
                  </span>
                ))}
                <span>kcal ernaast</span>
                {doel.kcal > 0 && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><span style={{ width: 12, borderTop: '1px dashed rgba(255,255,255,0.5)' }} />doel</span>}
                {ingebed && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><span style={{ width: 4, height: 9, borderRadius: 1, background: '#38bdf8' }} />water</span>}
              </div>

              {/* ── 4. Maand ── */}
              {/* Coach Inzicht: de maand zit achter een knop, in een klein venster (17 nov 2026). */}
              {(() => {
                const reeksTekst = reeks > 0 ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#fff' }}><Flame size={13} strokeWidth={2.6} /> {reeks} {reeks === 1 ? 'dag' : 'dagen'} op rij gelogd</span> : null
                const kalender = (
                  <>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                <button onClick={vorigeMaand} aria-label="Vorige maand" style={pijl}><ChevronLeft size={18} strokeWidth={3} /></button>
                <div style={{ flex: 1, textAlign: 'center', fontSize: '0.88rem', fontWeight: 900, color: '#fff', textTransform: 'capitalize' }}>{NL_MONTHS[maand.m]} {maand.y}</div>
                <button onClick={volgendeMaand} aria-label="Volgende maand" style={pijl}><ChevronRight size={18} strokeWidth={3} /></button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
                {NL_DAY_SHORT.map(d => <div key={d} style={{ fontSize: '0.6rem', fontWeight: 900, color: 'rgba(255,255,255,0.35)', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{d}</div>)}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
                {cellen.map((d, i) => {
                  if (!d) return <div key={i} />
                  const datum = new Date(maand.y, maand.m, d); const k = sleutel(datum)
                  const lijst = perDag?.[k]
                  const kc = totaal(lijst).kcal
                  const aan = k === gekozenSleutel
                  const vandaag = k === vandaagSleutel
                  return (
                    <button key={i} onClick={() => { kies(datum); setMaandPop(null) }} style={{
                      aspectRatio: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
                      background: aan ? '#fff' : 'transparent',
                      border: vandaag && !aan ? '1px solid rgba(255,255,255,0.6)' : '1px solid transparent',
                      borderRadius: 9, color: aan ? '#0a0a0a' : '#fff', fontSize: '0.8rem', fontWeight: 800, fontFamily: 'inherit',
                      cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                    }}>
                      {d}
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: lijst?.length ? (aan ? '#0a0a0a' : kcalKleur(kc, doel.kcal)) : 'transparent' }} />
                    </button>
                  )
                })}
              </div>
                  </>
                )
                if (!ingebed) return <>{kopje('Maand', reeksTekst, false)}{kalender}</>
                return (
                  <>
                    {maandPop && createPortal(
                      <>
                        <div onClick={() => setMaandPop(null)} style={{ position: 'fixed', inset: 0, zIndex: 12500 }} />
                        <div role="dialog" aria-label="Maand" style={(() => {
                          const B = 268, H = 326
                          const links = Math.max(8, Math.min(maandPop.x, window.innerWidth - B - 8))
                          // Past hij er niet onder, dan boven de knop.
                          const top = maandPop.y + 6 + H > window.innerHeight ? Math.max(8, maandPop.boven - H - 6) : maandPop.y + 6
                          return { position: 'fixed', left: links, top, width: B, zIndex: 12501, padding: 12, borderRadius: 14, background: '#111', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 16px 48px rgba(0,0,0,0.7)', boxSizing: 'border-box' }
                        })()}>
                          {kalender}
                          {reeksTekst && <div style={{ marginTop: 8, textAlign: 'center', fontSize: '0.72rem', fontWeight: 800 }}>{reeksTekst}</div>}
                        </div>
                      </>, document.body)}
                  </>
                )
              })()}

              {onOpenFullHistory && (
                <button
                  onClick={() => { onOpenFullHistory(); onClose?.() }}
                  style={{ marginTop: '1.5rem', width: '100%', minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
                >
                  Volledige geschiedenis <ArrowRight size={15} strokeWidth={2.6} />
                </button>
              )}
            </>
          )}
        </div>
        {zwevend && venster.formaatHandvat && (
          <div {...venster.formaatHandvat} style={{ position: 'absolute', bottom: 0, right: 0, width: 18, height: 18, cursor: 'se-resize', display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', padding: 3 }}>
            <div style={{ width: 9, height: 9, borderRight: '2px solid rgba(255,255,255,0.25)', borderBottom: '2px solid rgba(255,255,255,0.25)' }} />
          </div>
        )}
      </div>
    </div>
  )
  return ingebed ? inhoud : createPortal(inhoud, document.body)
}
