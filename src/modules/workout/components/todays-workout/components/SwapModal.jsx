// src/modules/workout/components/todays-workout/components/SwapModal.jsx
import { Plus, Check, SlidersHorizontal, X } from 'lucide-react'
import BladModal from './BladModal'
import { useState, useEffect } from 'react'
import { createPortal } from '../../../../../client/paginaPortal'
import CustomExerciseModal from './CustomExerciseModal'
import ExerciseService from '../../../../../services/ExerciseService'
import WorkoutServiceNew from '../../../services/WorkoutServiceNew'
import { logPlanWijziging } from '../../../services/planWijzigingLog'
import { laadOefeningMedia } from '../../../utils/oefeningFoto'
import { colors, space } from '../../../../../ui/tokens'
import {
  KiezerSchil, ZoekVeld, OefeningRij, LaadRijen,
  EigenOefeningKnop, WisselCirkels,
} from './OefeningKiezer'
import { spierLabel, materiaalLabel } from '../../../utils/oefeningLabels'
import { coachSuggesties, normNaam } from '../../../utils/coachSwaps'

const fuzzyMatch = (text, query) => {
  if (!text || !query) return false
  text = text.toLowerCase().trim()
  query = query.toLowerCase().trim()
  if (text.includes(query)) return true
  return query.split(/\s+/).every(word => text.includes(word))
}

const DUTCH_SYNONYMS = {
  'schouder': ['shoulder', 'delts', 'delt'],
  'borst': ['chest', 'pec'],
  'rug': ['back', 'lat'],
  'been': ['leg', 'quad', 'hamstring'],
  'bicep': ['biceps', 'arm'],
  'tricep': ['triceps', 'arm'],
  'buik': ['core', 'abs'],
  'zijkant': ['lateral', 'side'],
  'voorkant': ['front'],
  'achterkant': ['rear', 'back'],
  'kabel': ['cable'],
  'dumbbell': ['dumbbells', 'db'],
  'barbell': ['bar', 'bb'],
  'opheffen': ['raise', 'raises'],
  'curl': ['curls'],
  'drukken': ['press'],
  'trekken': ['row', 'pull']
}

const expandQuery = (query) => {
  let expanded = [query]
  Object.keys(DUTCH_SYNONYMS).forEach(dutch => {
    if (query.toLowerCase().includes(dutch)) {
      DUTCH_SYNONYMS[dutch].forEach(english => {
        expanded.push(query.toLowerCase().replace(dutch, english))
      })
    }
  })
  return expanded
}

// Hoe goed vervangt deze oefening de oefening die je wisselt?
//
// De lijst stond eerder in de volgorde waarin de database ze teruggaf: bij
// "chest" kwam Bench Dips vóór Machine Chest Press, terwijl dat laatste
// duidelijk dichter bij een barbell bench press ligt.
//
// De zwaarste signalen eerst: dezelfde spiergroep, daarna hetzelfde soort
// beweging (een row voor een row, een press voor een press). Equipment telt
// licht mee: je wisselt vaak juist omdat een apparaat bezet is, dus hetzelfde
// materiaal is een pluspunt maar geen eis.
//
// movement_pattern, position en grip staan niet bij alle 249 oefeningen
// ingevuld (186, 186 en 143). Een lege waarde levert geen punten op en geen
// aftrek — dan bepalen de andere signalen de volgorde.
const overlap = (a, b) => {
  const lijst = (v) => String(v || '').toLowerCase().split(/[,;/]+/).map(x => x.trim()).filter(Boolean)
  const A = lijst(a), B = new Set(lijst(b))
  return A.filter(x => B.has(x)).length
}

const gelijk = (a, b) => !!a && !!b && String(a).toLowerCase() === String(b).toLowerCase()

// "cable" en "cables" is hetzelfde apparaat, net als dumbbell en dumbbells.
// Beide vormen staan door elkaar in de tabel; zonder dit telt Lat Pulldown
// (cable) niet als match met Lat Pulldown Wide Grip (cables).
const zelfdeEquipment = (a, b) => {
  const norm = (v) => String(v || '').toLowerCase().trim().replace(/s$/, '')
  return !!a && !!b && norm(a) === norm(b)
}

// Woorden die niets over de oefening zeggen; die mogen geen match opleveren.
const LOZE_WOORDEN = new Set(['the', 'and', 'with', 'op', 'de', 'het', 'een', 'grip', 'arm', 'single', 'two', 'wide', 'close', 'narrow'])

// Hoeveel woorden delen twee oefeningnamen? Dit vangt op wat de kolommen
// missen: bij 63 van de 249 oefeningen is movement_pattern leeg, en dan zou
// "Lat Pulldown" niet herkennen dat "Lat Pulldown (Wide Grip)" familie is.
const naamOverlap = (a, b) => {
  const woorden = (v) => new Set(String(v || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(w => w.length > 2 && !LOZE_WOORDEN.has(w)))
  const A = woorden(a), B = woorden(b)
  let n = 0
  A.forEach(w => { if (B.has(w)) n += 1 })
  return n
}

const scoreVoor = (alt, basis) => {
  if (!basis) return 0
  let score = 0
  if (gelijk(alt.primair_spieren, basis.primair_spieren)) score += 50
  else if (overlap(alt.primair_spieren, basis.secundair_spieren) > 0) score += 12
  score += Math.min(2, overlap(alt.secundair_spieren, basis.secundair_spieren)) * 8
  if (gelijk(alt.movement_pattern, basis.movement_pattern)) score += 25
  if (gelijk(alt.type, basis.type)) score += 15
  if (zelfdeEquipment(alt.equipment, basis.equipment)) score += 6
  if (gelijk(alt.position, basis.position)) score += 5
  if (gelijk(alt.grip, basis.grip)) score += 5
  if (gelijk(alt.difficulty, basis.difficulty)) score += 4
  // Namen die woorden delen: "Lat Pulldown (Wide Grip)" hoort bij "Lat
  // Pulldown". Maximaal drie woorden, anders wint een lange naam op ruis.
  score += Math.min(3, naamOverlap(alt.name, basis.name)) * 9
  // Zelf toegevoegde oefeningen bovenaan bij gelijke stand: die heeft de klant
  // niet voor niets aangemaakt.
  if (alt._isCustom) score += 8
  return score
}

// Hoe goed past de zoekterm op de naam? Een oefening die ermee begint hoort
// boven eentje waar het ergens in het midden in staat.
const zoekScore = (naam, zoek) => {
  const n = String(naam || '').toLowerCase()
  const q = String(zoek || '').toLowerCase().trim()
  if (!q) return 0
  if (n === q) return 100
  if (n.startsWith(q)) return 60
  if (n.includes(q)) return 30
  return 0
}

const DAG_NL = { monday: 'maandag', tuesday: 'dinsdag', wednesday: 'woensdag', thursday: 'donderdag', friday: 'vrijdag', saturday: 'zaterdag', sunday: 'zondag' }
const DAG_KORT = { monday: 'ma', tuesday: 'di', wednesday: 'wo', thursday: 'do', friday: 'vr', saturday: 'za', sunday: 'zo' }
const DAG_VOLGORDE = Object.keys(DAG_NL)

export default function SwapModal({ exercise, exerciseIndex, workoutDayKey, weekdag, dagenMetTraining = [], schema, onClose, onSwapComplete, db, client }) {
  const isMobile = window.innerWidth <= 768
  // Staat deze training vaker in de week (Push op ma én do), dan kan de
  // wissel voor alle keren gelden of alleen voor deze dag.
  const dag = weekdag ? String(weekdag).toLowerCase() : null
  const vaker = !!dag && dagenMetTraining.length > 1 && dagenMetTraining.includes(dag)
  const vandaag = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
  const dezeDagLabel = dag === vandaag ? 'Alleen vandaag' : `Alleen ${DAG_NL[dag] || 'deze dag'}`
  const alleDagenLabel = [...dagenMetTraining].sort((a, b) => DAG_VOLGORDE.indexOf(a) - DAG_VOLGORDE.indexOf(b)).map(d => DAG_KORT[d]).join(' + ')
  const [allExercises, setAllExercises] = useState([])
  const [filteredAlternatives, setFilteredAlternatives] = useState([])
  const [basis, setBasis] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [swapping, setSwapping] = useState(false)
  const [showCustomModal, setShowCustomModal] = useState(false)
  const [selectedMuscle, setSelectedMuscle] = useState(exercise.primairSpieren || null)
  const [selectedEquipment, setSelectedEquipment] = useState(null)
  const [homeOnlyFilter, setHomeOnlyFilter] = useState(false)
  const [selectedType, setSelectedType] = useState(null)
  // De opengetikte vervanger: popt rechts in de cirkel bovenin.
  const [gekozenAlt, setGekozenAlt] = useState(null)
  const [filterOpen, setFilterOpen] = useState(false)

  // Dezelfde oefening in een ándere training van het plan (Pull op di én za
  // als twee losse dagen). Bij de maaltijden kies je ook op welke dagen een
  // wissel geldt; hier op welke trainingen. Standaard allemaal (27 okt 2026).
  const doelNaam = normNaam(exercise._originalName || exercise.name)
  const [andereTrainingen] = useState(() => {
    const rooster = client?.workout_schedule || {}
    const weekdagenVan = (dk) => Object.entries(rooster)
      .filter(([, v]) => v === dk)
      .map(([d]) => String(d).toLowerCase())
      .sort((a, b) => DAG_VOLGORDE.indexOf(a) - DAG_VOLGORDE.indexOf(b))
      .map(d => DAG_KORT[d]).filter(Boolean)
    return Object.entries(schema?.week_structure || {})
      .filter(([dk]) => dk !== workoutDayKey)
      .map(([dk, dagPlan]) => {
        const i = (dagPlan?.exercises || []).findIndex(e => normNaam(e?.name) === doelNaam)
        if (i < 0) return null
        return { dk, i, ex: dagPlan.exercises[i], naam: String(dagPlan?.name || dk).trim(), dagen: weekdagenVan(dk) }
      })
      .filter(Boolean)
      .sort((a, b) => a.dk.localeCompare(b.dk))
  })
  const [ookIn, setOokIn] = useState(() => new Set(andereTrainingen.map(a => a.dk)))
  const ookDoelen = andereTrainingen.filter(a => ookIn.has(a.dk))
  const wisselOok = (dk) => setOokIn(prev => { const n = new Set(prev); if (n.has(dk)) n.delete(dk); else n.add(dk); return n })
  const [media, setMedia] = useState(() => new Map())

  useEffect(() => {
    loadAllExercises()
  }, [])

  const loadAllExercises = async () => {
    setLoading(true)
    try {
      const [dbExercisesKaal, customResult, mediaMap] = await Promise.all([
        ExerciseService.getAllExercises(),
        client?.id
          ? db.supabase.from('custom_exercises').select('*').eq('client_id', client.id).order('created_at', { ascending: false })
          : Promise.resolve({ data: [] }),
        laadOefeningMedia(db),
      ])
      // Foto- en videovelden erbij: de lijst toont de echte foto, en bij een
      // wissel krijgt de nieuwe oefening meteen zijn eigen video mee.
      const dbExercises = (dbExercisesKaal || []).map(ex => ({ ...ex, ...(mediaMap.get(ex.name) || {}) }))
      setMedia(mediaMap)
      const customExercises = (customResult?.data || []).map(c => ({
        id: c.id, name: c.name,
        primair_spieren: c.primair_spieren || c.muscle_group || null,
        equipment: c.equipment || null, type: 'custom',
        image_url: c.image_url || null, home_friendly: false, gym_friendly: true, _isCustom: true
      }))
      const seen = new Set(customExercises.map(c => c.name.toLowerCase()))
      const deduped = (dbExercises || []).filter(ex => !seen.has(ex.name.toLowerCase()))
      const all = [...customExercises, ...deduped]
      setAllExercises(all)
      // De rij van de oefening die je wisselt: die heeft movement_pattern,
      // grip en position, en het schema niet. Zonder die rij zou de score
      // alleen op spiergroep en type kunnen leunen.
      const eigen = (dbExercises || []).find(ex => ex.name === exercise.name) || {
        primair_spieren: exercise.primairSpieren || null,
        equipment: exercise.equipment || null,
        type: exercise.type || null,
      }
      setBasis(eigen)
      setFilteredAlternatives(all.filter(ex => ex.primair_spieren === (exercise.primairSpieren || null)))
    } catch (error) {
      console.error('❌ Error loading exercises:', error)
      setAllExercises([])
    } finally { setLoading(false) }
  }

  useEffect(() => {
    let filtered = [...allExercises]
    if (selectedMuscle) filtered = filtered.filter(ex => ex.primair_spieren === selectedMuscle)
    if (selectedEquipment) filtered = filtered.filter(ex => ex.equipment === selectedEquipment)
    if (homeOnlyFilter) filtered = filtered.filter(ex => ex.home_friendly === true)
    if (selectedType) filtered = filtered.filter(ex => ex.type === selectedType)
    if (searchQuery.trim()) {
      const queries = expandQuery(searchQuery)
      filtered = filtered.filter(alt => {
        if (queries.some(q => fuzzyMatch(alt.name, q))) return true
        if (alt.tags?.some(tag => queries.some(q => fuzzyMatch(tag, q)))) return true
        if (alt.search_terms?.some(term => queries.some(q => fuzzyMatch(term, q)))) return true
        if (queries.some(q => fuzzyMatch(alt.equipment, q))) return true
        if (queries.some(q => fuzzyMatch(alt.primair_spieren, q))) return true
        return false
      })
    }
    filtered = filtered.filter(ex => ex.name !== exercise.name)

    // Best passend bovenaan. Zoek je iets, dan weegt de naam het zwaarst —
    // wie "row" typt wil rows zien, niet wat toevallig het beste alternatief is.
    const q = searchQuery.trim()
    filtered = filtered
      .map(ex => ({ ex, s: scoreVoor(ex, basis) + zoekScore(ex.name, q) * 2 }))
      .sort((a, b) => b.s - a.s || String(a.ex.name).localeCompare(String(b.ex.name)))
      .map(x => x.ex)

    setFilteredAlternatives(filtered)
  }, [searchQuery, allExercises, selectedMuscle, selectedEquipment, homeOnlyFilter, selectedType, basis])

  // Coach-suggesties: de twee, drie beste vervangers vanuit bodybuilding
  // (zie utils/coachSwaps.js), bovenaan de lijst. Bij zoeken niet: dan wil je
  // vinden wat je typt.
  const suggesties = searchQuery.trim() ? [] : coachSuggesties(exercise._originalName || exercise.name, allExercises)
    .filter(ex => normNaam(ex.name) !== normNaam(exercise.name))
  const suggestieNamen = new Set(suggesties.map(ex => normNaam(ex.name)))
  const rest = filteredAlternatives.filter(ex => !suggestieNamen.has(normNaam(ex.name)))

  const muscleGroups = [...new Set(allExercises.map(ex => ex.primair_spieren).filter(Boolean))].sort()
  const equipmentTypes = [...new Set(allExercises.filter(ex => !ex._isCustom).map(ex => ex.equipment).filter(Boolean))].sort()
  // Thuis en compound/isolatie in één keuzemenu: ze stonden achter een
  // aparte filterknop met een eigen paneel.
  const soort = homeOnlyFilter ? 'thuis' : (selectedType || 'all')
  const zetSoort = (v) => {
    setHomeOnlyFilter(v === 'thuis')
    setSelectedType(v === 'compound' || v === 'isolation' ? v : null)
  }

  // De nieuwe oefening op de plek van `basis` (sets, reps en rust blijven van
  // die plek; media komen van de nieuwe oefening).
  const bouwVervanger = (basis, newExercise) => ({
    ...basis,
    name: newExercise.name,
    equipment: newExercise.equipment || basis.equipment,
    primairSpieren: basis.primairSpieren,
    video_url: newExercise.video_url || null,
    thumbnail_url: newExercise.thumbnail_url || null,
    fallback_video_url: newExercise.fallback_video_url || null,
    image_url: newExercise.image_url || null,
  })
  const ookTekst = ookDoelen.length ? ` (ook in ${ookDoelen.map(a => a.naam).join(', ')})` : ''

  // alleenDag: de wissel geldt alleen voor deze weekdag, niet voor de andere
  // keren dat deze training in de week staat.
  const handleSwap = async (newExercise, { alleenDag = false } = {}) => {
    if (!schema?.id || !workoutDayKey || swapping) return
    setSwapping(true)
    try {
      const updatedExercise = {
        ...exercise,
        name: newExercise.name,
        equipment: newExercise.equipment || exercise.equipment,
        primairSpieren: exercise.primairSpieren,
        // Media van de oude oefening gaan niet mee: met ...exercise bleef
        // video_url van de oude staan en speelde de nieuwe oefening het oude
        // filmpje (call Martijn, 8 okt 2026). Leeg laten = het log-scherm en
        // de kaart zoeken op de nieuwe naam in exercises.
        video_url: newExercise.video_url || null,
        thumbnail_url: newExercise.thumbnail_url || null,
        fallback_video_url: newExercise.fallback_video_url || null,
        image_url: newExercise.image_url || null,
        _isWeeklyOverride: true,
        _originalName: exercise.name
      }
      // Geen dag-vlag van de oude oefening laten meeliften: die bepaalt
      // waar de override landt.
      delete updatedExercise._alleenDag
      if (alleenDag && dag) updatedExercise._alleenDag = dag

      // Voor alle keren: eerst dag-wissels van deze oefening weg, anders
      // wint die op zijn eigen dag nog van de nieuwe keuze.
      if (!alleenDag && vaker) {
        await WorkoutServiceNew.removeWeeklyOverride(client.id, schema.id, workoutDayKey, exerciseIndex, db, { alleDagen: true })
      }
      // Sla op als weekly override — NIET in het schema
      await WorkoutServiceNew.saveWeeklyOverride(
        client.id, schema.id, workoutDayKey, exerciseIndex, updatedExercise, db
      )
      // Ook in de andere gekozen trainingen (niet bij "alleen deze dag").
      if (!alleenDag) {
        for (const a of ookDoelen) {
          await WorkoutServiceNew.removeWeeklyOverride(client.id, schema.id, a.dk, a.i, db, { alleDagen: true })
          await WorkoutServiceNew.saveWeeklyOverride(client.id, schema.id, a.dk, a.i,
            { ...bouwVervanger(a.ex, newExercise), _isWeeklyOverride: true, _originalName: a.ex.name }, db)
        }
      }
      logPlanWijziging(db, { client, schema, dayKey: workoutDayKey, soort: alleenDag ? 'wissel_dag' : 'wissel_week', oefening: newExercise.name, was: exercise._originalName || exercise.name })

      const coachId = client?.coach_id || client?.trainer_id
      if (coachId) {
        const clientName = [client?.first_name, client?.last_name].filter(Boolean).join(' ') || 'Klant'
        db.supabase.from('coach_notifications').insert({
          coach_id: coachId,
          client_id: client.id,
          type: 'workout',
          priority: 'low',
          title: alleenDag ? `${clientName} heeft een oefening gewisseld voor ${DAG_NL[dag] || 'één dag'}` : `${clientName} heeft een oefening gewisseld`,
          message: `${exercise.name} → ${newExercise.name}${alleenDag ? '' : ookTekst}`,
          read_status: false,
        }).then(r => r, err => console.error('❌ Swap notification failed:', err))
      }

      if (navigator.vibrate) navigator.vibrate(50)
      onSwapComplete({ reloadSchema: true, newExercise: updatedExercise })
      onClose()
    } catch (error) {
      console.error('❌ Swap failed:', error)
      alert('Kon oefening niet wisselen. Probeer opnieuw.')
      setSwapping(false)
    }
  }

  const handleMakePermanent = async (newExercise) => {
    if (!schema?.id || !workoutDayKey || swapping) return
    // Een standaardplan van de coach is gedeeld; een permanente wissel zou
    // voor iedereen gelden. Dan wordt het een weekwissel voor deze klant.
    if (schema?.is_template) {
      alert('Dit is een standaardtraining van je coach. De wissel geldt voor deze week.')
      return handleSwap(newExercise)
    }
    setSwapping(true)
    try {
      const updatedExercise = {
        ...exercise,
        name: newExercise.name,
        equipment: newExercise.equipment || exercise.equipment,
        primairSpieren: exercise.primairSpieren,
        // Media van de oude oefening gaan niet mee: met ...exercise bleef
        // video_url van de oude staan en speelde de nieuwe oefening het oude
        // filmpje (call Martijn, 8 okt 2026). Leeg laten = het log-scherm en
        // de kaart zoeken op de nieuwe naam in exercises.
        video_url: newExercise.video_url || null,
        thumbnail_url: newExercise.thumbnail_url || null,
        fallback_video_url: newExercise.fallback_video_url || null,
        image_url: newExercise.image_url || null,
        // Het origineel blijft bekend: de coach ziet in het inzicht bij de
        // oefening "was: X", ook na een permanente wissel.
        _originalName: exercise._originalName || exercise.name,
        _swappedAt: new Date().toISOString(),
        _doorKlant: true,
      }
      delete updatedExercise._alleenDag
      delete updatedExercise._isWeeklyOverride
      // Schrijf permanent naar schema
      await db.updateExerciseInSchema(schema.id, workoutDayKey, exerciseIndex, updatedExercise)
      // Verwijder de weekly overrides van deze oefening, ook die voor één dag
      await WorkoutServiceNew.removeWeeklyOverride(client.id, schema.id, workoutDayKey, exerciseIndex, db, { alleDagen: true })
      // Ook in de andere gekozen trainingen. Na elkaar: updateExerciseInSchema
      // leest en schrijft telkens het hele schema.
      for (const a of ookDoelen) {
        await db.updateExerciseInSchema(schema.id, a.dk, a.i, {
          ...bouwVervanger(a.ex, newExercise),
          _originalName: a.ex._originalName || a.ex.name,
          _swappedAt: new Date().toISOString(),
          _doorKlant: true,
        })
        await WorkoutServiceNew.removeWeeklyOverride(client.id, schema.id, a.dk, a.i, db, { alleDagen: true })
      }
      logPlanWijziging(db, { client, schema, dayKey: workoutDayKey, soort: 'wissel_permanent', oefening: newExercise.name, was: exercise.name })

      const coachId = client?.coach_id || client?.trainer_id
      if (coachId) {
        const clientName = [client?.first_name, client?.last_name].filter(Boolean).join(' ') || 'Klant'
        db.supabase.from('coach_notifications').insert({
          coach_id: coachId,
          client_id: client.id,
          type: 'workout',
          priority: 'low',
          title: `${clientName} heeft een oefening permanent gewisseld`,
          message: `${exercise.name} → ${newExercise.name}${ookTekst}`,
          read_status: false,
        }).then(r => r, err => console.error('❌ Permanent swap notification failed:', err))
      }

      if (navigator.vibrate) navigator.vibrate(50)
      onSwapComplete({ reloadSchema: true, newExercise: updatedExercise })
      onClose()
    } catch (error) {
      console.error('❌ Permanent swap failed:', error)
      alert('Kon oefening niet permanent wisselen. Probeer opnieuw.')
      setSwapping(false)
    }
  }

  const handleCustomCreated = (customExercise) => {
    setShowCustomModal(false)
    if (customExercise._addedToDay) {
      onSwapComplete({ reloadSchema: true })
      onClose()
    } else {
      handleSwap(customExercise)
    }
  }

  const huidig = { ...(media.get(exercise.name) || {}), ...exercise, primair_spieren: exercise.primairSpieren }
  const ondertitel = [
    exercise.sets && `${exercise.sets} sets`,
    exercise.reps && `${exercise.reps} reps`,
    exercise._isWeeklyOverride && exercise._originalName && `origineel ${exercise._originalName}`,
  ].filter(Boolean).join(' · ')

  const resetAlles = () => {
    setSearchQuery(''); setSelectedMuscle(exercise.primairSpieren || null)
    setSelectedEquipment(null); setHomeOnlyFilter(false); setSelectedType(null)
  }

  const knop = (primair) => ({
    flex: 1, minHeight: 46, borderRadius: 12, fontFamily: 'inherit',
    fontSize: 15, fontWeight: 900, cursor: swapping ? 'default' : 'pointer',
    touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
    // Wit en zwart, zoals het maaltijd-wisselvenster (geen goud meer).
    ...(primair
      ? { background: '#fff', color: '#0a0a0a', border: 'none' }
      : { background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }),
  })

  const kopje = { fontSize: 13, fontWeight: 700, color: colors.textSecondary }
  const sectieKop = {
    padding: `${space[3]}px ${space[4]}px ${space[1]}px`,
    fontSize: 11, fontWeight: 900, letterSpacing: '0.06em', textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.75)',
  }

  // Eén oefening in de lijst. Tik = kiezen: hij popt rechts in de cirkel en
  // de knoppen staan daaronder (zoals bij maaltijden wisselen).
  const rij = (alt, index) => {
    const sleutel = `${alt._isCustom ? 'custom' : 'db'}-${alt.id || alt.name || index}-${index}`
    const aan = gekozenAlt && normNaam(gekozenAlt.name) === normNaam(alt.name)
    return (
      <OefeningRij
        key={sleutel}
        ex={alt}
        actief={aan}
        uit={swapping}
        onClick={() => setGekozenAlt(aan ? null : alt)}
        rechts={aan ? (
          <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#fff', color: '#0a0a0a', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Check size={15} strokeWidth={3.2} />
          </div>
        ) : null}
      />
    )
  }

  // Wat er anders staat dan standaard (materiaal, soort), als chips.
  const afwijkingen = [
    selectedEquipment && { id: 'mat', label: materiaalLabel(selectedEquipment), terug: () => setSelectedEquipment(null) },
    soort !== 'all' && { id: 'soort', label: { thuis: 'Thuis', compound: 'Compound', isolation: 'Isolatie' }[soort], terug: () => zetSoort('all') },
  ].filter(Boolean)
  const pil = (aan) => ({
    flexShrink: 0, height: 32, padding: '0 0.8rem', borderRadius: 999, border: 'none',
    background: aan ? '#fff' : 'transparent', color: aan ? '#0a0a0a' : 'rgba(255,255,255,0.55)',
    fontSize: 13, fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer', whiteSpace: 'nowrap',
    touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
  })
  const blokPil = (aan) => ({ ...pil(aan), height: 34, background: aan ? '#fff' : 'rgba(255,255,255,0.06)', color: aan ? '#0a0a0a' : 'rgba(255,255,255,0.75)' })

  return (
    <>
      <KiezerSchil
        titel="Wissel oefening"
        onClose={onClose}
        isMobile={isMobile}
        kop={<>
          <WisselCirkels oud={huidig} oudOnder={ondertitel} nieuw={gekozenAlt} />
          {/* Gekozen: meteen de knoppen, waar je toch al kijkt. */}
          {gekozenAlt && (
            <div key={gekozenAlt.name} style={{ display: 'flex', flexDirection: 'column', gap: space[2], animation: 'okPopIn 0.3s ease both' }}>
              {vaker && <div style={{ ...kopje, textAlign: 'center' }}>Elke keer · {alleDagenLabel}</div>}
              <div style={{ display: 'flex', gap: space[2] }}>
                <button disabled={swapping} onClick={() => handleSwap(gekozenAlt)} style={knop(true)}>Deze week</button>
                <button disabled={swapping} onClick={() => handleMakePermanent(gekozenAlt)} style={knop(false)}>Altijd</button>
              </div>
              {/* Ook in andere trainingen met deze oefening: aan/uit per training. */}
              {andereTrainingen.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.55)' }}>Ook in</span>
                  {andereTrainingen.map(a => {
                    const aan = ookIn.has(a.dk)
                    return (
                      <button key={a.dk} onClick={() => wisselOok(a.dk)} style={{
                        display: 'flex', alignItems: 'center', gap: 5, height: 30, padding: '0 0.75rem', borderRadius: 999,
                        background: aan ? '#fff' : 'transparent', color: aan ? '#0a0a0a' : 'rgba(255,255,255,0.6)',
                        border: aan ? 'none' : '1px solid rgba(255,255,255,0.25)',
                        fontSize: 12, fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer',
                        touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                      }}>
                        {aan && <Check size={13} strokeWidth={3.2} />}
                        {a.naam}{a.dagen.length ? ` · ${a.dagen.join(' + ')}` : ''}
                      </button>
                    )
                  })}
                </div>
              )}
              {vaker && (
                <button disabled={swapping} onClick={() => handleSwap(gekozenAlt, { alleenDag: true })} style={{
                  background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 800,
                  fontFamily: 'inherit', cursor: 'pointer', padding: '2px 0', textDecoration: 'underline', textUnderlineOffset: 3,
                }}>{dezeDagLabel}</button>
              )}
            </div>
          )}
          <ZoekVeld waarde={searchQuery} zet={setSearchQuery} placeholder="Zoek een vervanger" />
          {/* Spiergroep als pilletjes (de gekozen wit) en één filterknop. */}
          <div style={{ display: 'flex', alignItems: 'center', margin: `0 -${space[4]}px` }}>
            <div style={{ flex: 1, minWidth: 0, display: 'flex', gap: 2, overflowX: 'auto', scrollbarWidth: 'none', paddingLeft: space[4] }}>
              <button onClick={() => setSelectedMuscle(null)} style={pil(!selectedMuscle)}>Alles</button>
              {muscleGroups.map(m => (
                <button key={m} onClick={() => setSelectedMuscle(m)} style={pil(selectedMuscle === m)}>{spierLabel(m)}</button>
              ))}
            </div>
            <button onClick={() => setFilterOpen(true)} aria-label="Filter" style={{
              position: 'relative', flexShrink: 0, width: 44, height: 36, padding: 0, marginRight: space[2], marginLeft: 4,
              background: 'none', border: 'none', color: '#fff', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            }}>
              <SlidersHorizontal size={19} strokeWidth={2.6} />
              {afwijkingen.length > 0 && (
                <span style={{
                  position: 'absolute', top: 2, right: 6, minWidth: 16, height: 16, borderRadius: 8, padding: '0 4px',
                  background: '#fff', color: '#0a0a0a', fontSize: 10, fontWeight: 900,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box',
                }}>{afwijkingen.length}</span>
              )}
            </button>
          </div>
          {afwijkingen.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {afwijkingen.map(x => (
                <button key={x.id} onClick={x.terug} style={{
                  display: 'flex', alignItems: 'center', gap: 5, height: 28, padding: '0 0.55rem 0 0.75rem',
                  borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff',
                  fontSize: 12, fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer',
                }}>{x.label} <X size={13} strokeWidth={3} /></button>
              ))}
            </div>
          )}
        </>}
      >
        {loading ? <LaadRijen /> : (<>
          {suggesties.length > 0 && (<>
            <div style={sectieKop}>Coach suggesties</div>
            {suggesties.map((alt, i) => rij(alt, `coach-${i}`))}
            <div style={{ ...sectieKop, paddingTop: space[4] }}>Alle oefeningen</div>
          </>)}
          {rest.length === 0 && suggesties.length === 0 ? (
            <div style={{ padding: `${space[8]}px ${space[4]}px 0`, textAlign: 'center' }}>
              <div style={{ fontSize: 15, color: colors.textMuted, marginBottom: space[3] }}>
                Geen vervanger gevonden met deze filters.
              </div>
              <button onClick={resetAlles} style={{ ...knop(false), flex: 'none', padding: `0 ${space[6]}px` }}>
                Filters wissen
              </button>
            </div>
          ) : rest.map((alt, index) => rij(alt, index))}
        </>)}
        {!loading && (
          <EigenOefeningKnop onClick={() => setShowCustomModal(true)} icoon={<Plus size={18} strokeWidth={2.6} />} />
        )}
      </KiezerSchil>

      <BladModal open={filterOpen} titel="Filter" onClose={() => setFilterOpen(false)} zIndex={10600}>
        <div style={{ ...sectieKop, padding: '0 0 8px', color: 'rgba(255,255,255,0.4)' }}>Materiaal</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 18 }}>
          <button onClick={() => setSelectedEquipment(null)} style={blokPil(!selectedEquipment)}>Alles</button>
          {equipmentTypes.map(e => (
            <button key={e} onClick={() => setSelectedEquipment(e)} style={blokPil(selectedEquipment === e)}>{materiaalLabel(e)}</button>
          ))}
        </div>
        <div style={{ ...sectieKop, padding: '0 0 8px', color: 'rgba(255,255,255,0.4)' }}>Soort</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
          {[{ id: 'all', label: 'Alles' }, { id: 'thuis', label: 'Thuis' }, { id: 'compound', label: 'Compound' }, { id: 'isolation', label: 'Isolatie' }].map(o => (
            <button key={o.id} onClick={() => zetSoort(o.id)} style={blokPil(soort === o.id)}>{o.label}</button>
          ))}
        </div>
        <button onClick={() => setFilterOpen(false)} style={{ ...knop(true), width: '100%', minHeight: 50 }}>
          Toon {rest.length + suggesties.length} oefeningen
        </button>
      </BladModal>

      {showCustomModal && createPortal(
        <CustomExerciseModal onClose={() => setShowCustomModal(false)} onSave={handleCustomCreated} client={client} db={db} schema={schema} />,
        document.body
      )}
    </>
  )
}
