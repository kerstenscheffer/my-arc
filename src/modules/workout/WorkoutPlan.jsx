// src/modules/workout/WorkoutPlan.jsx
import useIsMobile from '../../hooks/useIsMobile'
import KrachtBlad from './components/KrachtBlad'
import { useState, useEffect, useRef } from 'react'
import { Clock, ChevronLeft, ChevronRight, ChevronDown, RefreshCw, TrendingUp, History } from 'lucide-react'
import PlanSwitchModal from './components/PlanSwitchModal'

import WeekSchedule from './components/WeekSchedule'
import TodaysWorkoutMain from './components/todays-workout/TodaysWorkoutMain'
import WorkoutChallengeSidebar from '../../client/components/WorkoutChallengeSidebar'
import BelangrijkeVideo from '../../client/components/BelangrijkeVideo'
import CardioLogVanger from './components/CardioLogVanger'
import HistorieBlad from './components/HistorieBlad'
import BladModal from './components/todays-workout/components/BladModal'
import FadeOnScroll from '../../components/FadeOnScroll'
import PlanningWizard from './components/planning/PlanningWizard'

import useWorkoutSchedule from './hooks/useWorkoutSchedule'
import useWorkoutProgress from './hooks/useWorkoutProgress'
import WorkoutService from '../../services/WorkoutService'

// Zonder toegewezen plan toonde de pagina een leeg kaartje ('workout.noplan')
// en zag de klant zijn cardio en stappen niet, en kon hij ook geen training
// kiezen. Nu is 'geen plan' gewoon een lege week: alles werkt, en via de
// wisselknop of 'Training toevoegen' zet hij zelf iets neer (8 okt 2026).
const LEEG_SCHEMA = { id: null, name: 'Nog geen plan', week_structure: {} }

export default function WorkoutPlan({ client, schema: schemaProp, db, onFocusChange, onClientUpdate }) {
  const schema = schemaProp || LEEG_SCHEMA
  const isMobile = useIsMobile()
  const chartWidgetRef = useRef(null)

  const [workoutService] = useState(() => new WorkoutService(db.supabase))
  const [localSchema, setLocalSchema] = useState(schema)

  // ✅ scheduleReloadKey — stijgt elke keer dat het weekschedule verandert
  // TodaysWorkoutMain luistert hierop en herlaadt zijn workout
  const [scheduleReloadKey, setScheduleReloadKey] = useState(0)

  const [challengeRefreshKey, setChallengeRefreshKey] = useState(0)
  // showLogModal / selectedWorkoutData / selectedDayLogs verwijderd —
  // de standalone LogModal die vroeger door week-day-click werd geopend is
  // vervangen door de inline-dropdown van TodaysWorkoutMain.

  const {
    weekSchedule, setWeekSchedule,
    swapMode, setSwapMode,
    selectedWorkout, setSelectedWorkout,
    handleDaySwap, quickAssignWorkout
  } = useWorkoutSchedule(schema, client?.id, db)

  const { completedWorkouts, markWorkoutComplete, weeklyStats, loadWeeklyProgress } = useWorkoutProgress(client?.id, db)

  const [showWizard, setShowWizard] = useState(false)
  // showPlanEditor + showHistoryModal modals zijn verwijderd — Geschiedenis
  // zit nu in de inline dropdown-bar boven WeekSchedule, en Plan had geen
  // entrypoint meer na het schrappen van de bottom-strip.
  // Inline-dropdown voor workout-geschiedenis tussen de TodaysWorkout-card
  // en de week-planning sectie. Zelfde black-bar stijl als de koolh/vet-balk
  // op de meal-pagina (SubtleCarbsFatBar).
  const [historyOpen, setHistoryOpen] = useState(false)
  const [krachtOpen, setKrachtOpen] = useState(false)
  // Focus-mode: TodaysWorkoutMain meldt via callback wanneer de dropdown
  // open is. Dan verbergen we week-schedule, chart en bottom-strip — én via
  // onFocusChange (door-bubbled naar ClientDashboard) ook de bottom-nav.
  const [workoutOpen, setWorkoutOpen] = useState(false)
  useEffect(() => { if (onFocusChange) onFocusChange(workoutOpen) }, [workoutOpen, onFocusChange])
  // Plan-wissel: modal met alle door de coach toegewezen plannen.
  const [showPlanSwitch, setShowPlanSwitch] = useState(false)
  const [weekOffset, setWeekOffset] = useState(0)

  const currentDate = new Date()
  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const todayIndex = (currentDate.getDay() + 6) % 7

  // Dag-navigatie bovenaan de pagina — selecteerde dag bepaalt welke workout
  // TodaysWorkoutMain laadt.
  const DAYS_NL = ['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag', 'Zondag']
  const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  const [selectedDayIdx, setSelectedDayIdx] = useState(todayIndex)
  const selectedDayKey = DAY_KEYS[selectedDayIdx]
  const selectedDayName = DAYS_NL[selectedDayIdx]
  const isToday = selectedDayIdx === todayIndex
  const relativeLabel = selectedDayIdx === todayIndex
    ? 'Vandaag'
    : selectedDayIdx === todayIndex - 1 ? 'Gisteren'
    : selectedDayIdx === todayIndex + 1 ? 'Morgen'
    : null
  // Trainingsdag-detectie: workoutKey in weekSchedule voor de geselecteerde dag.
  const selectedWorkoutKey = weekSchedule?.[weekDays[selectedDayIdx]] || null
  const isTrainingDay = !!selectedWorkoutKey
  const selectedDate = (() => {
    const d = new Date()
    d.setDate(d.getDate() + (selectedDayIdx - todayIndex))
    return d
  })()
  const dateLabel = selectedDate.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' })

  useEffect(() => {
    if (client?.id) loadWeeklyProgress()
  }, [client?.id])

  useEffect(() => {
    if (schema) setLocalSchema(schema)
  }, [schema?.id])

  // Klik op een week-day-card: selecteer die dag, open de inline-dropdown
  // van TodaysWorkoutMain en scroll erheen. Geen aparte modal meer — de
  // data-flow gaat via TodaysWorkoutMain's `selectedDay` prop die zelf de
  // juiste workout laadt (custom, activity of schema-dag).
  const handleDayClick = (day, workoutKey) => {
    if (!workoutKey) return
    const dayIdx = weekDays.indexOf(day)
    if (dayIdx >= 0) setSelectedDayIdx(dayIdx)
    setWorkoutOpen(true)
    // Scroll naar TodaysWorkoutMain zodat de net-geopende dropdown direct
    // in beeld is. Kleine timeout zodat React eerst kan rerenderen.
    setTimeout(() => {
      const el = document.getElementById('todays-workout-anchor')
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 80)
  }

  // Het compliment verwijst naar de grafiek; die zit nu in een blad in plaats
  // van ergens onderaan de pagina, dus openen we dat blad.

  const handleWizardComplete = (newSchedule) => { setWeekSchedule(newSchedule); setShowWizard(false) }
  const handleWorkoutCompleted = () => { setChallengeRefreshKey(prev => prev + 1) }


  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', paddingBottom: isMobile ? '5rem' : '2rem', position: 'relative' }}>

      {showPlanSwitch && (
        <PlanSwitchModal
          client={client} db={db} isMobile={isMobile}
          onClose={() => setShowPlanSwitch(false)}
          // Geen harde refresh meer: het dashboard laadt klant en schema
          // opnieuw, en de pagina volgt de nieuwe props (useWorkoutSchedule
          // en TodaysWorkoutMain herladen op schema-wissel).
          onActivated={async () => {
            setShowPlanSwitch(false)
            if (onClientUpdate) { try { await onClientUpdate() } catch { window.location.reload() } }
            else window.location.reload()
          }}
        />
      )}


      {/* Bovenbalk zoals op de maaltijdpagina: twee knoppen zonder kader aan
          weerszijden, boven de foto. Kracht en Historie stonden als twee
          blokken onder de workout van vandaag; hier kosten ze geen ruimte en
          zie je sneller de weekplanning en cardio. */}
      {!workoutOpen && (() => {
        const lijn = 'rgba(255,255,255,0.12)'
        const knop = (kant) => ({
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          padding: isMobile ? '0 0.9rem' : '0 1.2rem',
          background: 'transparent', border: 'none',
          [kant === 'links' ? 'borderRight' : 'borderLeft']: `1px solid ${lijn}`,
          color: '#fff', fontSize: isMobile ? '0.82rem' : '0.88rem', fontWeight: 900,
          letterSpacing: '-0.015em', fontFamily: 'inherit', cursor: 'pointer', whiteSpace: 'nowrap',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
        })
        return (
          <div style={{
            display: 'flex', alignItems: 'stretch',
            height: isMobile ? 40 : 48,
            paddingTop: isMobile ? 'env(safe-area-inset-top, 0px)' : 0,
            boxSizing: 'content-box', background: '#0a0a0a', borderBottom: `1px solid ${lijn}`,
          }}>
            <button onClick={() => setKrachtOpen(true)} title="Krachtoverzicht" style={knop('links')}>
              <TrendingUp size={16} strokeWidth={2.8} /> Kracht
            </button>
            <div style={{ flex: 1 }} />
            <button onClick={() => setHistoryOpen(true)} title="Historie" style={knop('rechts')}>
              <History size={16} strokeWidth={2.8} /> Historie
            </button>
          </div>
        )
      })()}

      <div id="todays-workout-anchor">
        <TodaysWorkoutMain
          client={client}
          schema={localSchema}
          db={db}
          workoutService={workoutService}
          onWorkoutCompleted={handleWorkoutCompleted}
          onSchemaUpdate={(updatedSchema) => setLocalSchema(updatedSchema)}
          scheduleReloadKey={scheduleReloadKey}
          selectedDay={selectedDayKey}
          expanded={workoutOpen}
          onExpandedChange={setWorkoutOpen}
        />
      </div>


      {/* Belangrijke video van de coach, onder de workout van vandaag. Niet
          erboven: je opent deze pagina om te trainen, en het eerste wat je ziet
          hoort de training van vandaag te zijn. Verdwijnt zodra je hem hebt
          afgespeeld of afgevinkt, en staat weg zolang je in een workout zit. */}
      {!workoutOpen && (
        <div style={{ marginTop: isMobile ? '1.75rem' : '2.25rem' }}>
          <BelangrijkeVideo client={client} pagina="workout" isMobile={isMobile} />
        </div>
      )}

      {/* Jouw week planning — onder de workout van vandaag. Die staat bovenaan:
          negen van de tien keer open je deze pagina om vandaag te trainen,
          niet om de week te herschikken. */}
      {!workoutOpen && <FadeOnScroll><div id="week-schedule" style={{ marginTop: isMobile ? '3.5rem' : '4.25rem' }}>
        <WeekSchedule
          weekSchedule={weekSchedule}
          schema={localSchema}
          swapMode={swapMode}
          selectedWorkout={selectedWorkout}
          completedWorkouts={completedWorkouts}
          todayIndex={todayIndex}
          onDayClick={handleDayClick}
          clientId={client?.id}
          db={db}
          workoutService={workoutService}
          onScheduleUpdate={(newSchedule) => {
            setWeekSchedule(newSchedule)
            setScheduleReloadKey(prev => prev + 1)
          }}
          onOpenWizard={() => setShowWizard(true)}
          onSwitchPlan={() => setShowPlanSwitch(true)}
          weekOffset={weekOffset}
          onWeekOffsetChange={setWeekOffset}
          client={client}
        />
      </div></FadeOnScroll>}

      {/* De complimenten-melding (WorkoutProgressToast, "Sterke moves") is
          weg: voegde niets toe en stond in de weg (8 okt 2026). */}
      {/* Tik op een cardiotegel in het weekrooster → logblad. */}
      <CardioLogVanger client={client} db={db} isMobile={isMobile} />
      {!workoutOpen && (
        <FadeOnScroll>
          <div style={{ marginTop: isMobile ? '2rem' : '2.5rem' }}>
            <WorkoutChallengeSidebar client={client} db={db} key={challengeRefreshKey} />
          </div>
        </FadeOnScroll>
      )}

      {/* PageVideoWidget gemigreerd naar centrale WidgetSidebar in ClientDashboard. */}

      {/* Cardio staat nu tussen de zeven dagen en de weekbalk (zie
          WeekSchedule → tussenBlok), niet meer los onderaan de pagina. */}

      {/* WorkoutHistory inline section + WorkoutPhotoSlider removed —
          history now lives behind de Geschiedenis-icon (modal below).
          Photo slider was generic Unsplash decoration with no data. */}

      {/* Bottom "Mijn workout / Plan / Geschiedenis"-strip verwijderd —
          Geschiedenis zit nu in de inline dropdown-bar boven WeekSchedule,
          Plan in de ClientPlanEditor die alleen nog via andere paden zou
          openen (geen meer in deze view). */}

      {showWizard && (
        <PlanningWizard schema={localSchema} clientId={client?.id} db={db} workoutService={workoutService} onClose={() => setShowWizard(false)} onComplete={handleWizardComplete} />
      )}

      {/* Krachtoverzicht en geschiedenis in hetzelfde blad als de historie in
          het log-scherm, zodat die drie zich hetzelfde gedragen. */}
      <BladModal open={krachtOpen} titel="Kracht" onClose={() => setKrachtOpen(false)}>
        <KrachtBlad db={db} client={client} isMobile={isMobile} />
      </BladModal>
      <BladModal open={historyOpen} titel="Historie" onClose={() => setHistoryOpen(false)}>
        <HistorieBlad db={db} clientId={client?.id} client={client} isMobile={isMobile} />
      </BladModal>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        * { -webkit-tap-highlight-color: transparent; }
        *::-webkit-scrollbar { width: 6px; height: 6px; }
        *::-webkit-scrollbar-track { background: rgba(255,255,255,0.03); }
        *::-webkit-scrollbar-thumb { background: rgba(255,215,0,0.3); border-radius: 3px; }
        html { scroll-behavior: smooth; }
      `}</style>
    </div>
  )
}

// Knop naar een overzicht-blad. Twee gelijke helften, dik wit, zoals de rest
// van de pagina.
function OverzichtKnop({ icon, label, onClick, isMobile }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, minWidth: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        padding: isMobile ? '0.65rem' : '0.75rem',
        background: 'transparent',
        border: '1.5px solid rgba(255,255,255,0.22)',
        borderRadius: 12,
        color: '#fff',
        fontSize: isMobile ? '0.82rem' : '0.9rem', fontWeight: 900,
        letterSpacing: '-0.015em', fontFamily: 'inherit',
        cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
      }}
    >
      {icon}
      {label}
    </button>
  )
}
