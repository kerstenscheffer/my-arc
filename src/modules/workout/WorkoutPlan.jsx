// src/modules/workout/WorkoutPlan.jsx
import useIsMobile from '../../hooks/useIsMobile'
import ClientWorkoutChart from './components/ClientWorkoutChart'
import { useState, useEffect, useRef } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import { Calendar, Clock, ChevronLeft, ChevronRight, ChevronDown, RefreshCw } from 'lucide-react'
import PlanSwitchModal from './components/PlanSwitchModal'

import WeekSchedule from './components/WeekSchedule'
import TodaysWorkoutMain from './components/todays-workout/TodaysWorkoutMain'
import WorkoutChallengeSidebar from '../../client/components/WorkoutChallengeSidebar'
import WorkoutProgressToast from './components/WorkoutProgressToast'
import CardioLogSection from './components/CardioLogSection'
import WorkoutHistory from '../progress/WorkoutHistory'
import FadeOnScroll from '../../components/FadeOnScroll'
import PlanningWizard from './components/planning/PlanningWizard'

import useWorkoutSchedule from './hooks/useWorkoutSchedule'
import useWorkoutProgress from './hooks/useWorkoutProgress'
import WorkoutService from '../../services/WorkoutService'

export default function WorkoutPlan({ client, schema, db, onFocusChange }) {
  const { t } = useLanguage()
  const isMobile = useIsMobile()
  const chartsRef = useRef(null)
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

  const handleToastViewChart = () => {
    if (chartsRef.current) {
      const pos = chartsRef.current.getBoundingClientRect().top + window.pageYOffset
      window.scrollTo({ top: pos - (isMobile ? 100 : 150), behavior: 'smooth' })
    }
  }

  const handleWizardComplete = (newSchedule) => { setWeekSchedule(newSchedule); setShowWizard(false) }
  const handleWorkoutCompleted = () => { setChallengeRefreshKey(prev => prev + 1) }

  if (!schema) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 100%)', padding: '1rem' }}>
        <div style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center', padding: '2rem', background: 'linear-gradient(135deg, rgba(139,92,246,0.1) 0%, rgba(59,130,246,0.05) 100%)', backdropFilter: 'blur(20px)', borderRadius: '20px', border: '1px solid rgba(139,92,246,0.2)' }}>
          <Calendar size={48} color="#8b5cf6" style={{ marginBottom: '1.5rem' }} />
          <h3 style={{ fontSize: '1.5rem', background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '1rem', fontWeight: 'bold' }}>
            {t('workout.noplan') || 'No Workout Plan Yet'}
          </h3>
          <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
            {t('workout.waitingForTrainer') || 'Your trainer will assign a workout plan soon!'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', paddingBottom: isMobile ? '5rem' : '2rem', position: 'relative' }}>

      {showPlanSwitch && (
        <PlanSwitchModal
          client={client} db={db} isMobile={isMobile}
          onClose={() => setShowPlanSwitch(false)}
          onActivated={() => { setShowPlanSwitch(false); window.location.reload() }}
        />
      )}


      {/* Jouw week planning — direct onder de plan-balk. */}
      {!workoutOpen && <FadeOnScroll><div id="week-schedule" style={{ marginTop: isMobile ? '0.75rem' : '1rem' }}>
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
        />
      </div></FadeOnScroll>}

      {/* Grote titel boven de today's-workout foto, met veel zwarte ruimte erboven. */}
      {!workoutOpen && (
        <div style={{ padding: isMobile ? '6rem 1rem 1.25rem' : '9rem 2rem 1.75rem', textAlign: 'center' }}>
          <div style={{ fontSize: isMobile ? '1.7rem' : '2.6rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.05, whiteSpace: 'nowrap' }}>
            Vandaags workout
          </div>
        </div>
      )}

      <div id="todays-workout-anchor">
        <TodaysWorkoutMain
          client={client}
          schema={localSchema}
          db={db}
          workoutService={workoutService}
          onWorkoutCompleted={handleWorkoutCompleted}
          onSchemaUpdate={(updatedSchema) => setLocalSchema(updatedSchema)}
          scheduleReloadKey={scheduleReloadKey}
          onOpenPlanner={() => setShowWizard(true)}
          selectedDay={selectedDayKey}
          expanded={workoutOpen}
          onExpandedChange={setWorkoutOpen}
        />
      </div>

      {/* TodaysLogToast removed — same heaviest-lift info already lives in
          TodaysWorkoutCard. WorkoutProgressToast stays for the 30-day
          PR/stagnation insights that aren't visible elsewhere. */}
      {!workoutOpen && (
        <FadeOnScroll>
          <div style={{ marginTop: isMobile ? '2.5rem' : '3rem' }}>
            <WorkoutProgressToast client={client} db={db} onViewChart={handleToastViewChart} />
          </div>
        </FadeOnScroll>
      )}
      {!workoutOpen && (
        <FadeOnScroll>
          <div style={{ marginTop: isMobile ? '2rem' : '2.5rem' }}>
            <WorkoutChallengeSidebar client={client} db={db} key={challengeRefreshKey} />
          </div>
        </FadeOnScroll>
      )}

      {/* PageVideoWidget gemigreerd naar centrale WidgetSidebar in ClientDashboard. */}

      {/* ── Geschiedenis-balk — inline dropdown tussen workout-dropdown en
            week-planning. Zelfde stijl als de koolh/vet-balk op de meal-pagina
            (zwarte bg, subtiele border, rounded 10). Klik = inline expand. */}
      {!workoutOpen && (
        <FadeOnScroll>
        <div style={{
          padding: isMobile ? '2.5rem 1rem 0.25rem' : '3rem 1.25rem 0.375rem',
        }}>
          <div style={{
            background: '#171717',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 10,
            overflow: 'hidden',
            transition: 'border-color 0.2s ease',
          }}>
            <button
              onClick={() => setHistoryOpen(p => !p)}
              aria-expanded={historyOpen}
              aria-label="Workout-geschiedenis"
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                padding: isMobile ? '0.55rem 0.85rem' : '0.65rem 1.05rem',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                cursor: 'pointer',
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              }}
            >
              <span style={{
                display: 'flex', alignItems: 'center', gap: 8,
                fontSize: isMobile ? '0.62rem' : '0.7rem',
                fontWeight: 800, color: '#FFD700',
                textTransform: 'uppercase', letterSpacing: '0.1em',
              }}>
                <Clock size={isMobile ? 12 : 14} strokeWidth={2.4} />
                Geschiedenis
              </span>
              <ChevronDown
                size={isMobile ? 16 : 18}
                strokeWidth={2.4}
                style={{
                  color: 'rgba(255,255,255,0.55)',
                  transform: historyOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease',
                }}
              />
            </button>

            {historyOpen && (
              <div style={{
                borderTop: '1px solid rgba(255,255,255,0.06)',
                maxHeight: isMobile ? '60vh' : '55vh',
                overflowY: 'auto',
                WebkitOverflowScrolling: 'touch',
              }}>
                <WorkoutHistory db={db} clientId={client?.id} onBack={null} />
              </div>
            )}
          </div>
        </div>
        </FadeOnScroll>
      )}


      {!workoutOpen && <FadeOnScroll>
        <CardioLogSection client={client} db={db} isMobile={isMobile} />
      </FadeOnScroll>}

      {/* WorkoutHistory inline section + WorkoutPhotoSlider removed —
          history now lives behind de Geschiedenis-icon (modal below).
          Photo slider was generic Unsplash decoration with no data. */}

      {!workoutOpen && <FadeOnScroll><div ref={chartsRef} style={{
        padding: isMobile ? '0 1rem' : '0 1.5rem',
        marginTop: isMobile ? '3rem' : '3.5rem',
      }}>
        <ClientWorkoutChart db={db} client={client} />
      </div></FadeOnScroll>}

      {/* Bottom "Mijn workout / Plan / Geschiedenis"-strip verwijderd —
          Geschiedenis zit nu in de inline dropdown-bar boven WeekSchedule,
          Plan in de ClientPlanEditor die alleen nog via andere paden zou
          openen (geen meer in deze view). */}

      {showWizard && (
        <PlanningWizard schema={localSchema} clientId={client?.id} db={db} workoutService={workoutService} onClose={() => setShowWizard(false)} onComplete={handleWizardComplete} />
      )}

      {/* showPlanEditor + showHistoryModal modals weggehaald — geen entrypoints
          meer, Geschiedenis zit inline boven WeekSchedule. */}

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
