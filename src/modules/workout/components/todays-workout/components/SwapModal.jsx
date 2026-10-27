// src/modules/workout/components/todays-workout/components/SwapModal.jsx
import { Plus, ChevronDown } from 'lucide-react'
import { useState, useEffect } from 'react'
import { createPortal } from '../../../../../client/paginaPortal'
import CustomExerciseModal from './CustomExerciseModal'
import ExerciseService from '../../../../../services/ExerciseService'
import WorkoutServiceNew from '../../../services/WorkoutServiceNew'
import { logPlanWijziging } from '../../../services/planWijzigingLog'
import { laadOefeningMedia } from '../../../utils/oefeningFoto'
import Keuze from '../../../../meal-plan/components/Keuze'
import { colors, radius, space, shadow } from '../../../../../ui/tokens'
import {
  KiezerSchil, ZoekVeld, FilterBalk, FilterStreep, OefeningRij, LaadRijen,
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
  // Welke rij staat open (Deze week / Altijd)?
  const [openRij, setOpenRij] = useState(null)
  // De opengetikte vervanger: popt rechts in de cirkel bovenin.
  const [gekozenAlt, setGekozenAlt] = useState(null)
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
          message: `${exercise.name} → ${newExercise.name}`,
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
          message: `${exercise.name} → ${newExercise.name}`,
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
    flex: 1, minHeight: 48, borderRadius: radius.btn, fontFamily: 'inherit',
    fontSize: 15, fontWeight: 800, cursor: swapping ? 'default' : 'pointer',
    touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
    ...(primair
      ? { background: colors.accent, color: colors.onAccent, border: 'none', boxShadow: shadow.glow }
      : { background: 'transparent', color: colors.textPrimary, border: `1px solid ${colors.borderSubtle}` }),
  })

  const kopje = { fontSize: 13, fontWeight: 700, color: colors.textSecondary }
  const sectieKop = {
    padding: `${space[3]}px ${space[4]}px ${space[1]}px`,
    fontSize: 12, fontWeight: 900, letterSpacing: '0.06em', textTransform: 'uppercase',
    color: colors.textSecondary,
  }

  // Eén oefening in de lijst; tik = open, dan Deze week / Altijd.
  const rij = (alt, index) => {
    const sleutel = `${alt._isCustom ? 'custom' : 'db'}-${alt.id || alt.name || index}-${index}`
    const open = openRij === sleutel
    return (
      <div key={sleutel} style={{ background: open ? colors.surfaceHover : 'transparent' }}>
        <OefeningRij
          ex={alt}
          actief={open}
          uit={swapping}
          onClick={() => { setOpenRij(open ? null : sleutel); setGekozenAlt(open ? null : alt) }}
          rechts={<ChevronDown size={20} strokeWidth={2.6} color={open ? colors.textPrimary : colors.textMuted}
            style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />}
        />
        {open && !vaker && (
          <div style={{ display: 'flex', gap: space[2], padding: `0 ${space[4]}px ${space[3]}px` }}>
            <button disabled={swapping} onClick={() => handleSwap(alt)} style={knop(true)}>Deze week</button>
            <button disabled={swapping} onClick={() => handleMakePermanent(alt)} style={knop(false)}>Altijd</button>
          </div>
        )}
        {open && vaker && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: space[2], padding: `0 ${space[4]}px ${space[4]}px` }}>
            <div style={kopje}>Elke keer · {alleDagenLabel}</div>
            <div style={{ display: 'flex', gap: space[2] }}>
              <button disabled={swapping} onClick={() => handleSwap(alt)} style={knop(true)}>Deze week</button>
              <button disabled={swapping} onClick={() => handleMakePermanent(alt)} style={knop(false)}>Altijd</button>
            </div>
            <div style={{ ...kopje, marginTop: space[2] }}>Alleen deze training</div>
            <button disabled={swapping} onClick={() => handleSwap(alt, { alleenDag: true })} style={{ ...knop(false), flex: 'none', width: '100%' }}>{dezeDagLabel}</button>
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      <KiezerSchil
        titel="Wissel oefening"
        onClose={onClose}
        isMobile={isMobile}
        kop={<>
          <WisselCirkels oud={huidig} oudOnder={ondertitel} nieuw={gekozenAlt} />
          <ZoekVeld waarde={searchQuery} zet={setSearchQuery} placeholder="Zoek een vervanger" />
          <FilterBalk>
            <Keuze waarde={selectedMuscle || 'all'} zet={(v) => setSelectedMuscle(v === 'all' ? null : v)} isMobile={isMobile}
              opties={[{ id: 'all', label: 'Alle spieren' }, ...muscleGroups.map(m => ({ id: m, label: spierLabel(m) }))]} />
            <FilterStreep />
            <Keuze waarde={selectedEquipment || 'all'} zet={(v) => setSelectedEquipment(v === 'all' ? null : v)} isMobile={isMobile}
              opties={[{ id: 'all', label: 'Alle materiaal' }, ...equipmentTypes.map(e => ({ id: e, label: materiaalLabel(e) }))]} />
            <FilterStreep />
            <Keuze waarde={soort} zet={zetSoort} isMobile={isMobile} uitlijning="rechts"
              opties={[{ id: 'all', label: 'Alles' }, { id: 'thuis', label: 'Thuis' }, { id: 'compound', label: 'Compound' }, { id: 'isolation', label: 'Isolatie' }]} />
          </FilterBalk>
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

      {showCustomModal && createPortal(
        <CustomExerciseModal onClose={() => setShowCustomModal(false)} onSave={handleCustomCreated} client={client} db={db} schema={schema} />,
        document.body
      )}
    </>
  )
}
