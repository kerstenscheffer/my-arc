// src/modules/workout/WorkoutPlan.jsx
import useIsMobile from '../../hooks/useIsMobile'
import ProgressChartsWidget from "../progress/ProgressChartsWidget"
import { useState, useEffect, useRef } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import { Calendar, Pencil, Clock } from 'lucide-react'
import ClientPlanEditor from './components/ClientPlanEditor'

import WeekSchedule from './components/WeekSchedule'
import TodaysWorkoutMain from './components/todays-workout/TodaysWorkoutMain'
import LogModal from './components/todays-workout/LogModal'
import WorkoutChallengeSidebar from '../../client/components/WorkoutChallengeSidebar'
import WorkoutProgressToast from './components/WorkoutProgressToast'
import WorkoutHistory from '../progress/WorkoutHistory'
import PlanningWizard from './components/planning/PlanningWizard'
import { X } from 'lucide-react'

import useWorkoutSchedule from './hooks/useWorkoutSchedule'
import useWorkoutProgress from './hooks/useWorkoutProgress'
import PageVideoWidget from '../videos/PageVideoWidget'
import WorkoutService from '../../services/WorkoutService'

export default function WorkoutPlan({ client, schema, db }) {
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
  const [showLogModal, setShowLogModal] = useState(false)
  const [selectedWorkoutData, setSelectedWorkoutData] = useState(null)
  const [selectedDayLogs, setSelectedDayLogs] = useState([])

  const {
    weekSchedule, setWeekSchedule,
    swapMode, setSwapMode,
    selectedWorkout, setSelectedWorkout,
    handleDaySwap, quickAssignWorkout
  } = useWorkoutSchedule(schema, client?.id, db)

  const { completedWorkouts, markWorkoutComplete, weeklyStats, loadWeeklyProgress } = useWorkoutProgress(client?.id, db)

  const [showWizard, setShowWizard] = useState(false)
  const [showPlanEditor, setShowPlanEditor] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)

  const currentDate = new Date()
  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const todayIndex = (currentDate.getDay() + 6) % 7

  useEffect(() => {
    if (client?.id) loadWeeklyProgress()
  }, [client?.id])

  useEffect(() => {
    if (schema) setLocalSchema(schema)
  }, [schema?.id])

  const handleDayClick = async (day, workoutKey) => {
    if (!workoutKey) return
    try {
      let workoutData = null
      if (workoutKey.startsWith('custom_')) {
        const customId = workoutKey.replace('custom_', '')
        const customWorkout = await workoutService.getCustomWorkoutById(customId)
        if (customWorkout) {
          workoutData = { name: customWorkout.name, focus: getCustomWorkoutTypeLabel(customWorkout.type), geschatteTijd: `${customWorkout.duration} min`, exercises: [], workoutKey, dayKey: workoutKey, dayName: day, isCustom: true, customData: customWorkout }
        }
      } else if (['swimming', 'cardio', 'hiking', 'cycling', 'running'].includes(workoutKey)) {
        const labels = { swimming: 'Zwemmen', cardio: 'Cardio', hiking: 'Wandelen', cycling: 'Fietsen', running: 'Hardlopen' }
        workoutData = { name: labels[workoutKey], focus: 'Cardio', geschatteTijd: '60 min', exercises: [], workoutKey, dayKey: workoutKey, dayName: day, isActivity: true }
      } else if (localSchema?.week_structure?.[workoutKey]) {
        workoutData = { ...localSchema.week_structure[workoutKey], workoutKey, dayKey: workoutKey, dayName: day, isCustom: false }
      }
      if (workoutData) {
        setSelectedWorkoutData(workoutData)
        await loadDayLogs(day)
        setShowLogModal(true)
      }
    } catch (error) { console.error('❌ Error loading workout for day:', error) }
  }

  const loadDayLogs = async (dayName) => {
    if (!client?.id || !db) return
    try {
      const dayIndex = weekDays.indexOf(dayName)
      const targetDate = new Date()
      const currentDayIndex = (targetDate.getDay() + 6) % 7
      targetDate.setDate(targetDate.getDate() + (dayIndex - currentDayIndex))
      const dateString = targetDate.toISOString().split('T')[0]
      const { data: sessions } = await db.supabase.from('workout_sessions').select('id').eq('client_id', client.id).eq('workout_date', dateString)
      if (!sessions?.length) { setSelectedDayLogs([]); return }
      const { data: progress } = await db.supabase.from('workout_progress').select('*').in('session_id', sessions.map(s => s.id)).order('created_at', { ascending: false })
      setSelectedDayLogs(progress || [])
    } catch { setSelectedDayLogs([]) }
  }

  const getCustomWorkoutTypeLabel = (type) => ({ cardio: 'Cardio', cycling: 'Fietsen', running: 'Hardlopen', swimming: 'Zwemmen', hiking: 'Wandelen', yoga: 'Yoga', sports: 'Sport', custom: 'Custom' }[type] || type)

  const handleCloseLogModal = () => { setShowLogModal(false); setSelectedWorkoutData(null); setSelectedDayLogs([]) }

  const handleLogsUpdate = async (options) => {
    await loadWeeklyProgress()
    if (selectedWorkoutData?.dayName) await loadDayLogs(selectedWorkoutData.dayName)
    if (options?.workoutCompleted) handleWorkoutCompleted()
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
      <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #0a0f0d 0%, #1a1a1a 100%)', padding: '1rem' }}>
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
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #0a0a0a 0%, #171717 100%)', paddingBottom: isMobile ? '5rem' : '2rem', position: 'relative' }}>

      {/* ── Page header strip: title left, Plan + Geschiedenis right ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.5rem',
        padding: isMobile ? '0.625rem 1rem 0.75rem' : '0.75rem 1.5rem 0.875rem',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        <div style={{
          fontSize: isMobile ? '0.95rem' : '1.05rem',
          fontWeight: '800',
          color: '#fff',
          letterSpacing: '-0.01em',
        }}>
          Mijn workout
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          onClick={() => setShowPlanEditor(true)}
          aria-label="Plan bewerken"
          style={{
            display: 'flex', alignItems: 'center', gap: '0.375rem',
            padding: '0.45rem 0.75rem',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '8px',
            color: 'rgba(255,255,255,0.55)',
            fontSize: isMobile ? '0.7rem' : '0.75rem',
            fontWeight: '600',
            cursor: 'pointer',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            minHeight: '34px',
          }}
        >
          <Pencil size={13} strokeWidth={2.2} />
          Plan
        </button>
        <button
          onClick={() => setShowHistoryModal(true)}
          aria-label="Geschiedenis"
          style={{
            display: 'flex', alignItems: 'center', gap: '0.375rem',
            padding: '0.45rem 0.75rem',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '8px',
            color: 'rgba(255,255,255,0.55)',
            fontSize: isMobile ? '0.7rem' : '0.75rem',
            fontWeight: '600',
            cursor: 'pointer',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            minHeight: '34px',
          }}
        >
          <Clock size={13} strokeWidth={2.2} />
          Geschiedenis
        </button>
        </div>
      </div>

      <TodaysWorkoutMain
        client={client}
        schema={localSchema}
        db={db}
        workoutService={workoutService}
        onWorkoutCompleted={handleWorkoutCompleted}
        onSchemaUpdate={(updatedSchema) => setLocalSchema(updatedSchema)}
        scheduleReloadKey={scheduleReloadKey}
      />

      {/* TodaysLogToast removed — same heaviest-lift info already lives in
          TodaysWorkoutCard. WorkoutProgressToast stays for the 30-day
          PR/stagnation insights that aren't visible elsewhere. */}
      <WorkoutProgressToast client={client} db={db} onViewChart={handleToastViewChart} />
      <WorkoutChallengeSidebar client={client} db={db} key={challengeRefreshKey} />

      <div style={{ paddingTop: isMobile ? '1rem' : '1.5rem', paddingLeft: isMobile ? '1rem' : '1.5rem', paddingRight: isMobile ? '1rem' : '1.5rem', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
        <PageVideoWidget client={client} db={db} pageContext="workout" title="Workout Technique Videos" compact={true} />
      </div>

      <div id="week-schedule">
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
          // ✅ Trigger TodaysWorkoutMain reload na elke schedule wijziging
          setScheduleReloadKey(prev => prev + 1)
        }}
        onOpenWizard={() => setShowWizard(true)}
      />
      </div>

      {/* WorkoutHistory inline section + WorkoutPhotoSlider removed —
          history now lives behind the Geschiedenis-icon (modal below).
          Photo slider was generic Unsplash decoration with no data. */}

      <div ref={chartsRef} style={{ padding: isMobile ? '0 1rem' : '0 1.5rem', marginTop: '1rem' }}>
        <ProgressChartsWidget ref={chartWidgetRef} db={db} clientId={client?.id} />
      </div>

      {showWizard && (
        <PlanningWizard schema={localSchema} clientId={client?.id} db={db} workoutService={workoutService} onClose={() => setShowWizard(false)} onComplete={handleWizardComplete} />
      )}

      {showPlanEditor && (
        <ClientPlanEditor
          schema={localSchema}
          client={client}
          db={db}
          weekSchedule={weekSchedule}
          onClose={() => setShowPlanEditor(false)}
          onSchemaSaved={(schemaId, newStructure, newWeekSchedule) => {
            setLocalSchema(prev => ({ ...prev, id: schemaId, week_structure: newStructure, is_client_edited: true }))
            if (newWeekSchedule) setWeekSchedule(newWeekSchedule)
            setScheduleReloadKey(prev => prev + 1)
          }}
        />
      )}

      {showLogModal && selectedWorkoutData && (
        <LogModal workout={selectedWorkoutData} todaysLogs={selectedDayLogs} onClose={handleCloseLogModal} onLogsUpdate={handleLogsUpdate} client={client} schema={localSchema} db={db} />
      )}

      {showHistoryModal && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setShowHistoryModal(false) }}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
            padding: isMobile ? '0' : '2rem',
          }}
        >
          <div style={{
            width: '100%', maxWidth: '900px',
            height: isMobile ? '100%' : 'calc(100vh - 4rem)',
            background: '#0a0a0a',
            border: isMobile ? 'none' : '1px solid rgba(255,255,255,0.08)',
            borderRadius: isMobile ? '0' : '16px',
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: isMobile ? '0.875rem 1rem' : '1rem 1.5rem',
              paddingTop: `calc(env(safe-area-inset-top, 0) + ${isMobile ? '0.875rem' : '1rem'})`,
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              flexShrink: 0,
            }}>
              <div style={{
                fontSize: isMobile ? '1rem' : '1.1rem',
                fontWeight: '800', color: '#fff', letterSpacing: '-0.01em',
              }}>
                Workout geschiedenis
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                aria-label="Sluiten"
                style={{
                  width: '36px', height: '36px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '8px',
                  color: 'rgba(255,255,255,0.6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', touchAction: 'manipulation',
                }}
              >
                <X size={16} />
              </button>
            </div>
            <div style={{
              flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch',
              padding: isMobile ? '0.875rem 1rem 1.5rem' : '1rem 1.5rem 2rem',
            }}>
              <WorkoutHistory db={db} clientId={client?.id} onBack={null} />
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        * { -webkit-tap-highlight-color: transparent; }
        *::-webkit-scrollbar { width: 6px; height: 6px; }
        *::-webkit-scrollbar-track { background: rgba(255,255,255,0.03); }
        *::-webkit-scrollbar-thumb { background: rgba(16,185,129,0.3); border-radius: 3px; }
        html { scroll-behavior: smooth; }
      `}</style>
    </div>
  )
}
