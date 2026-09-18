// src/modules/workout/components/todays-workout/components/ExerciseList.jsx
import { useState, useEffect, useRef } from 'react'
import { Plus, RotateCcw } from 'lucide-react'
import ExerciseCard from './ExerciseCard'
import AddExerciseModal from './AddExerciseModal'
import { isExerciseFullyLogged } from '../../../utils/exerciseCompletion'
import WorkoutServiceNew from '../../../services/WorkoutServiceNew'

// De kop boven een blok oefeningen. In de schema's staat het veld bijna altijd
// in het Engels ('chest', 'triceps'), maar er zit ook een handvol Nederlands
// tussen ('Borst', 'Rug') — die zouden anders een eigen kop krijgen naast de
// Engelse. Vandaar deze vertaling. Zonder spiergroep → "Overig", zodat er
// nooit oefeningen buiten de lijst vallen (34 stuks in de huidige schema's).
const GROEP_NAMEN = {
  borst: 'Chest', rug: 'Back', benen: 'Legs', been: 'Legs',
  schouders: 'Shoulders', schouder: 'Shoulders', buik: 'Abs',
  bicep: 'Biceps', tricep: 'Triceps', billen: 'Glutes', kuiten: 'Calves',
}
const groepVan = (ex) => {
  const ruw = String(ex?.primairSpieren || ex?.muscleGroup || '').trim()
  if (!ruw) return 'Overig'
  const klein = ruw.toLowerCase()
  return GROEP_NAMEN[klein] || klein.charAt(0).toUpperCase() + klein.slice(1)
}

export default function ExerciseList({
  exercises, todaysLogs, onLogsUpdate,
  client, schema, db, workoutDayKey
}) {
  const isMobile = window.innerWidth <= 768
  const [visibleExercises, setVisibleExercises] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [localExercises, setLocalExercises] = useState(exercises || [])
  // Slepen op de telefoon: kaart ingedrukt houden, dan verschuiven. `sleep`
  // beschrijft wat er onder je vinger zit; is hij null, dan gebeurt er niets
  // bijzonders en werkt swipen-om-te-verwijderen gewoon.
  const [sleep, setSleep] = useState(null)
  const sleepRef = useRef(null)
  const drukTimer = useRef(null)
  const startPunt = useRef(null)
  // Na het loslaten komt er nog een klik achteraan; die zou de oefening
  // openen terwijl je alleen wilde verslepen.
  const netGesleept = useRef(false)
  const [terugzetBezig, setTerugzetBezig] = useState(false)

  useEffect(() => {
    localExercises.forEach((_, index) => {
      setTimeout(() => setVisibleExercises(prev => [...prev, index]), index * 120)
    })
  }, [localExercises])

  // Sync on content (not just reference) — needed because after a permanent
  // swap the parent reloads the schema but may pass an exercises array whose
  // reference equality doesn't fire React's useEffect, leaving the list
  // stale until a hard refresh.
  const exercisesSignature = (exercises || [])
    // `sets` hoort in deze vingerafdruk: past een klant het aantal sets aan,
    // dan verandert de naam niet en zou de lijst anders op het oude aantal
    // blijven staan tot een harde verversing — en daarmee ook op de oude
    // voltooid-status, want die rekent met het geplande aantal.
    .map(e => `${e.name}|${e.sets}|${e._pendingPermanent ? 1 : 0}|${e._isWeeklyOverride ? 1 : 0}|${e._overgeslagen ? 1 : 0}|${e.image_url || ''}`)
    .join(',')
  useEffect(() => { setLocalExercises(exercises || []) }, [exercisesSignature])

  // Een oefening geldt pas als "gelogd" (doorgestreept) als álle geplande sets
  // gedaan zijn — niet al na de eerste set.

  const saveExercises = async (updatedExercises) => {
    if (!client?.id || !db || !workoutDayKey || !schema?.id) return
    const updatedStructure = {
      ...schema.week_structure,
      [workoutDayKey]: { ...schema.week_structure[workoutDayKey], exercises: updatedExercises }
    }
    const { error } = await db.supabase
      .from('workout_schemas')
      .update({ week_structure: updatedStructure, updated_at: new Date().toISOString() })
      .eq('id', schema.id)
    if (error) throw error
  }

  const handleAddExercise = async (newExercise) => {
    try {
      const updatedExercises = [...localExercises, newExercise]
      setLocalExercises(updatedExercises)
      if (!newExercise._addedToDay) {
        await saveExercises(updatedExercises)
      }
      if (navigator.vibrate) navigator.vibrate([50, 100, 50])
      setShowAddModal(false)
      if (onLogsUpdate) onLogsUpdate({ reloadSchema: true })
    } catch (error) {
      console.error('❌ Add exercise failed:', error)
      alert('Kon oefening niet toevoegen.')
      setLocalExercises(exercises || [])
    }
  }

  const handleDelete = async (index) => {
    try {
      const updatedExercises = localExercises.filter((_, i) => i !== index)
      setLocalExercises(updatedExercises)
      await saveExercises(updatedExercises)
      // Week-overrides hangen aan de index; alles achter de verwijderde
      // oefening schuift een plek op.
      if (client?.id && schema?.id && workoutDayKey) {
        await WorkoutServiceNew.verschuifOverridesNaVerwijderen(client.id, schema.id, workoutDayKey, index, db)
      }
      if (navigator.vibrate) navigator.vibrate([30, 60, 30])
      if (onLogsUpdate) onLogsUpdate({ reloadSchema: true })
    } catch (error) {
      console.error('❌ Delete failed:', error)
      setLocalExercises(exercises || [])
    }
  }

  // Prullenbak op de card. 'permanent' haalt de oefening uit het schema van de
  // coach; 'week' zet er een week-override overheen met een overgeslagen-vlag,
  // zodat de oefening op zijn plek blijft staan (de overrides zijn
  // index-gebonden) maar nergens meer meetelt.
  const handleVerwijder = async (index, modus) => {
    if (modus === 'permanent') return handleDelete(index)
    if (!client?.id || !schema?.id || !workoutDayKey) throw new Error('geen schema')
    const bron = localExercises[index]
    const bewaard = await WorkoutServiceNew.saveWeeklyOverride(
      client.id, schema.id, workoutDayKey, index, { ...bron, _overgeslagen: true }, db
    )
    if (!bewaard) throw new Error('niet opgeslagen')
    setLocalExercises(prev => prev.map((ex, i) => i === index ? { ...ex, _overgeslagen: true } : ex))
    if (onLogsUpdate) onLogsUpdate({ reloadSchema: true })
  }

  const overgeslagen = localExercises.filter(ex => ex?._overgeslagen).length

  const zetTerug = async () => {
    if (!client?.id || !schema?.id || !workoutDayKey || terugzetBezig) return
    setTerugzetBezig(true)
    try {
      for (let i = 0; i < localExercises.length; i++) {
        if (!localExercises[i]?._overgeslagen) continue
        // Was het alleen een overslaan-override, dan kan die hele rij weg.
        // Stond er ook een wissel of ander aantal sets in, dan blijft dat
        // staan zonder de vlag.
        const ex = localExercises[i]
        if (ex._isWeeklyOverride && (ex._originalName || ex._setsAangepast)) {
          const rest = { ...ex }
          delete rest._overgeslagen
          await WorkoutServiceNew.saveWeeklyOverride(client.id, schema.id, workoutDayKey, i, rest, db)
        } else {
          await WorkoutServiceNew.removeWeeklyOverride(client.id, schema.id, workoutDayKey, i, db)
        }
      }
      setLocalExercises(prev => prev.map(ex => { const k = { ...ex }; delete k._overgeslagen; return k }))
      if (onLogsUpdate) onLogsUpdate({ reloadSchema: true })
    } catch (e) {
      console.error('❌ Terugzetten mislukt:', e)
    } finally { setTerugzetBezig(false) }
  }

  const handleMakePermanent = async (index) => {
    try {
      const updatedExercises = localExercises.map((ex, i) =>
        i === index ? { ...ex, _pendingPermanent: false } : ex
      )
      await saveExercises(updatedExercises)
      setLocalExercises(updatedExercises)
      if (onLogsUpdate) onLogsUpdate({ reloadSchema: true })
    } catch (e) {
      console.error('❌ Make permanent failed:', e)
    }
  }

  // Verplaatsen: de lijst gaat mee, het schema wordt opgeslagen en de
  // week-overrides verhuizen mee. Die hangen aan de index, dus zonder dat
  // laatste zou de aangepaste set van oefening 2 ineens bij oefening 3 staan.
  const handleVerplaats = async (vanIndex, naarIndex) => {
    if (vanIndex === naarIndex) return
    const orde = localExercises.map((_, i) => i)
    const [verhuisd] = orde.splice(vanIndex, 1)
    orde.splice(naarIndex, 0, verhuisd)
    const nieuweLijst = orde.map(i => localExercises[i])
    const vorige = localExercises

    setLocalExercises(nieuweLijst)
    try {
      await saveExercises(nieuweLijst)
      if (client?.id && schema?.id && workoutDayKey) {
        await WorkoutServiceNew.hernummerOverridesNaVerplaatsen(client.id, schema.id, workoutDayKey, orde, db)
      }
      if (navigator.vibrate) navigator.vibrate(20)
      if (onLogsUpdate) onLogsUpdate({ reloadSchema: true })
    } catch (error) {
      console.error('❌ Volgorde opslaan mislukt:', error)
      setLocalExercises(vorige)
    }
  }

  // Ingedrukt houden start het slepen. Beweeg je meteen, dan wilde je scrollen
  // of swipen en gaat het niet door.
  const startDruk = (e, groepNaam, posInGroep, aantalInGroep, element) => {
    if (!isMobile) return
    const t = e.touches?.[0]
    if (!t) return
    startPunt.current = { x: t.clientX, y: t.clientY }
    if (drukTimer.current) clearTimeout(drukTimer.current)
    drukTimer.current = setTimeout(() => {
      const hoogte = element?.getBoundingClientRect?.().height || 96
      const staat = { groep: groepNaam, van: posInGroep, naar: posInGroep, aantal: aantalInGroep, hoogte, dy: 0 }
      sleepRef.current = staat
      setSleep(staat)
      if (navigator.vibrate) navigator.vibrate(30)
    }, 350)
  }

  const beweeg = (e) => {
    const t = e.touches?.[0]
    if (!t) return
    if (!sleepRef.current) {
      // Nog niet aan het slepen: te veel beweging betekent scrollen of swipen.
      const s0 = startPunt.current
      if (s0 && (Math.abs(t.clientX - s0.x) > 8 || Math.abs(t.clientY - s0.y) > 8)) {
        if (drukTimer.current) { clearTimeout(drukTimer.current); drukTimer.current = null }
      }
      return
    }
    const staat = sleepRef.current
    const dy = t.clientY - (startPunt.current?.y ?? t.clientY)
    const sprongen = Math.round(dy / staat.hoogte)
    const naar = Math.max(0, Math.min(staat.aantal - 1, staat.van + sprongen))
    const nieuweStaat = { ...staat, dy, naar }
    sleepRef.current = nieuweStaat
    setSleep(nieuweStaat)
  }

  const laatLos = (groep) => {
    if (drukTimer.current) { clearTimeout(drukTimer.current); drukTimer.current = null }
    const staat = sleepRef.current
    sleepRef.current = null
    startPunt.current = null
    if (!staat) return
    setSleep(null)
    netGesleept.current = true
    setTimeout(() => { netGesleept.current = false }, 300)
    if (staat.naar !== staat.van) {
      const vanIndex = groep.items[staat.van].index
      const naarIndex = groep.items[staat.naar].index
      handleVerplaats(vanIndex, naarIndex)
    }
  }

  // Groeperen op spiergroep, in de vololgorde waarin de coach ze plande. De
  // oorspronkelijke index gaat mee: alle schrijfacties (wisselen, sets,
  // overslaan) hangen daaraan, dus die mag niet verschuiven door het
  // hergroeperen.
  const groepen = []
  localExercises.forEach((ex, index) => {
    if (ex?._overgeslagen) return
    const naam = groepVan(ex)
    let groep = groepen.find(g => g.naam === naam)
    if (!groep) { groep = { naam, items: [] }; groepen.push(groep) }
    groep.items.push({ ex, index })
  })

  const emptyState = !localExercises || localExercises.length === 0

  return (
    <>
      {emptyState ? (
        <div style={{ padding: isMobile ? '2rem 1rem' : '3rem 1rem', textAlign: 'center' }}>
          <div style={{ background: 'rgba(23,23,23,0.6)', border: '1px solid rgba(255,215,0,0.1)', borderRadius: '12px', padding: isMobile ? '1.5rem' : '2rem', marginBottom: isMobile ? '1.25rem' : '1.5rem' }}>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: isMobile ? '0.85rem' : '0.9rem', fontWeight: '600', margin: 0 }}>
              Nog geen oefeningen in deze workout
            </p>
          </div>
          <button onClick={() => setShowAddModal(true)} style={{ padding: isMobile ? '0.75rem 1.5rem' : '0.875rem 2rem', background: 'linear-gradient(135deg, rgba(255,215,0,0.2) 0%, rgba(255,165,0,0.12) 100%)', border: '1px solid rgba(255,215,0,0.3)', borderRadius: '10px', color: '#FFD700', fontSize: isMobile ? '0.8rem' : '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', minHeight: '44px', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
            <Plus size={isMobile ? 16 : 18} strokeWidth={2.5} />
            Voeg Eerste Oefening Toe
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {groepen.map(groep => (
            <div key={groep.naam}>
              <div style={{
                margin: isMobile ? '0.7rem 0.9rem 0.35rem' : '0.85rem 1.25rem 0.4rem',
                display: 'flex', alignItems: 'baseline', gap: 7,
              }}>
                <span style={{
                  fontSize: isMobile ? '1rem' : '1.1rem', fontWeight: 900, color: '#fff',
                  letterSpacing: '-0.02em',
                }}>{groep.naam}</span>
                <span style={{
                  fontSize: isMobile ? '0.62rem' : '0.66rem', fontWeight: 800,
                  color: 'rgba(255,255,255,0.3)',
                }}>{groep.items.length}</span>
              </div>
              {groep.items.map(({ ex: exercise, index }, posInGroep) => {
                // Verschuiving tijdens het slepen: de opgepakte kaart volgt je
                // vinger, de kaarten ertussen schuiven een plek op zodat je ziet
                // waar hij terechtkomt.
                const sleeptHier = sleep?.groep === groep.naam
                const isOpgepakt = sleeptHier && sleep.van === posInGroep
                let verschuif = 0
                if (sleeptHier && !isOpgepakt) {
                  if (sleep.van < sleep.naar && posInGroep > sleep.van && posInGroep <= sleep.naar) verschuif = -sleep.hoogte
                  if (sleep.van > sleep.naar && posInGroep < sleep.van && posInGroep >= sleep.naar) verschuif = sleep.hoogte
                }
                return (
            <div
              key={`${exercise.name}-${index}`}
              onTouchStart={(e) => startDruk(e, groep.naam, posInGroep, groep.items.length, e.currentTarget)}
              onTouchMove={beweeg}
              onTouchEnd={() => laatLos(groep)}
              onTouchCancel={() => laatLos(groep)}
              onClickCapture={(e) => { if (netGesleept.current) { e.preventDefault(); e.stopPropagation() } }}
              style={{
                position: 'relative',
                zIndex: isOpgepakt ? 5 : 1,
                transform: isOpgepakt ? `translateY(${sleep.dy}px) scale(1.02)` : `translateY(${verschuif}px)`,
                transition: isOpgepakt ? 'none' : 'transform 0.18s ease',
                boxShadow: isOpgepakt ? '0 14px 30px rgba(0,0,0,0.55)' : 'none',
                opacity: isOpgepakt ? 0.96 : 1,
                // Tijdens het slepen mag de pagina niet meescrollen.
                touchAction: sleeptHier ? 'none' : 'auto',
              }}
            >
              <ExerciseCard
                exercise={exercise}
                index={index}
                totalExercises={localExercises.length}
                isLogged={isExerciseFullyLogged(exercise, todaysLogs)}
                previousLog={null}
                onLogsUpdate={onLogsUpdate}
                client={client}
                schema={schema}
                db={db}
                workoutDayKey={workoutDayKey}
                visible={visibleExercises.includes(index)}
                delay={index * 120}
                onMakePermanent={() => handleMakePermanent(index)}
                onVerwijder={(modus) => handleVerwijder(index, modus)}
              />
            </div>
                )
              })}
            </div>
          ))}

          {/* Deze week overgeslagen — met één tik terug te halen, anders is
              de oefening tot maandag onvindbaar. */}
          {overgeslagen > 0 && (
            <button onClick={zetTerug} disabled={terugzetBezig}
              style={{
                margin: isMobile ? '0.3rem 0.9rem 0' : '0.35rem 1.25rem 0',
                padding: '0.55rem 0.75rem',
                background: 'transparent', border: '1px dashed rgba(255,255,255,0.18)',
                borderRadius: 10, color: 'rgba(255,255,255,0.6)',
                fontSize: isMobile ? '0.66rem' : '0.7rem', fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                cursor: terugzetBezig ? 'wait' : 'pointer',
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              }}>
              <RotateCcw size={12} strokeWidth={2.6} />
              {overgeslagen} deze week overgeslagen. Terugzetten
            </button>
          )}
        </div>
      )}

      {/* Floating FAB — zelfde stijl als MealLogFAB op de meal-pagina.
          Alleen zichtbaar wanneer de exercise-list rendert (= dropdown open). */}
      <button
        onClick={() => setShowAddModal(true)}
        aria-label="Oefening toevoegen"
        style={{
          position: 'fixed',
          left: isMobile ? 18 : 28,
          bottom: `calc(env(safe-area-inset-bottom, 0px) + ${isMobile ? 24 : 28}px)`,
          zIndex: 90,
          width: isMobile ? 76 : 84,
          height: isMobile ? 76 : 84,
          borderRadius: '50%',
          background: '#fff',
          border: 'none',
          color: '#0a0a0a',
          cursor: 'pointer',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
          boxShadow: '0 14px 36px rgba(0,0,0,0.5), 0 4px 12px rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: 0,
          transition: 'transform 0.18s ease',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)' }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
      >
        <Plus size={isMobile ? 30 : 34} strokeWidth={3} />
        <span style={{
          fontSize: '0.56rem', fontWeight: 900,
          letterSpacing: '0.06em', textTransform: 'uppercase',
          marginTop: -2, lineHeight: 1,
        }}>
          Oefening
        </span>
      </button>

      {showAddModal && (
        <AddExerciseModal
          onClose={() => setShowAddModal(false)}
          onSave={handleAddExercise}
          client={client}
          db={db}
          schema={schema}
          workoutDayKey={workoutDayKey}
        />
      )}
    </>
  )
}

