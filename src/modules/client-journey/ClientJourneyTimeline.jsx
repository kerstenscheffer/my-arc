// ============================================
// FILE: src/modules/client-journey/ClientJourneyTimeline.jsx
// JOURNEY TIMELINE v6 - Compact: header+nav+actions merged into thin strip
// ============================================
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import ClientJourneyService from './ClientJourneyService'
import { G, TEMPLATES, CALL_FREQ, generateDefaultActions, scalePhases, DAY_LABELS, navBtn } from './journeyConfig'
import HorizontalTimeline from './components/HorizontalTimeline'
import SetupFlow from './components/SetupFlow'
import ActionList from './components/ActionList'
import ActionModal from './components/ActionModal'
import MessageSystem from './components/messages/MessageSystem'
import JourneyMessageService from './JourneyMessageService'
import CallPanel from './components/calls/CallPanel'
import EvaluationModal from './components/EvaluationModal'
import OnboardingSOPFlow from './components/OnboardingSOPFlow'
import { TrendingUp, User, CheckCircle, ChevronLeft, ChevronRight, Plus, X, Phone, MessageCircle } from 'lucide-react'

const CAT_MODALS = {
  call: { label: 'Call', icon: Phone, color: '#3b82f6' },
  bericht: { label: 'Berichten', icon: MessageCircle, color: '#10b981' }
}

export default function ClientJourneyTimeline({ db, clients, selectedClient, onSelectClient, coachId, isMobile: isMobileProp, onOpenMealPanel, onOpenWorkoutPanel }) {
  const isMobile = isMobileProp !== undefined ? isMobileProp : window.innerWidth <= 768

  const [journey, setJourney] = useState(null)
  const [actions, setActions] = useState([])
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentWeek, setCurrentWeek] = useState(1)
  const [selectedWeek, setSelectedWeek] = useState(null)
  const [selectedDay, setSelectedDay] = useState(null)
  const [zoomLevel, setZoomLevel] = useState('weeks')
  const [viewMode, setViewMode] = useState('3weeks')

  const [showSetup, setShowSetup] = useState(false)
  const [setupStep, setSetupStep] = useState(1)
  const [setupTemplate, setSetupTemplate] = useState('12_weeks')
  const [setupWeeks, setSetupWeeks] = useState(12)
  const [setupCallFreq, setSetupCallFreq] = useState('weekly')
  const [setupActions, setSetupActions] = useState([])

  const [showAddAction, setShowAddAction] = useState(false)
  const [editingAction, setEditingAction] = useState(null)
  const [callNotes, setCallNotes] = useState({})
  const [openModal, setOpenModal] = useState(null)
  const [evalModal, setEvalModal] = useState(null)
  const [weightHistory, setWeightHistory] = useState([])

  const loadJourneyData = useCallback(async () => {
    if (!selectedClient?.id) return
    setLoading(true)
    try {
      const j = await ClientJourneyService.getClientJourney(selectedClient.id)
      setJourney(j)
      if (j) {
        const [a, n] = await Promise.all([
          ClientJourneyService.getJourneyActions(j.id),
          ClientJourneyService.getJourneyNotes(j.id)
        ])
        setActions(a); setNotes(n)
        const cw = ClientJourneyService.getCurrentWeek(j.start_date)
        setCurrentWeek(cw); setSelectedWeek(cw)
      }
    } catch (e) { console.error('Journey load:', e) }
    setLoading(false)
  }, [selectedClient?.id, coachId])

  useEffect(() => { loadJourneyData() }, [loadJourneyData])

  // Reset showSetup when switching clients
  useEffect(() => { setShowSetup(false) }, [selectedClient?.id])

  useEffect(() => {
    if (!db?.supabase || !selectedClient?.id) return
    db.supabase.from('weight_challenge_logs').select('client_id, date, weight, is_friday_weighin')
      .eq('client_id', selectedClient.id).order('date', { ascending: true })
      .then(({ data }) => setWeightHistory(data || []))
      .catch(() => setWeightHistory([]))
  }, [selectedClient?.id, db?.supabase])

  const handleSelectTemplate = (id) => { const t = TEMPLATES[id]; setSetupTemplate(id); setSetupWeeks(t.total_weeks); setSetupCallFreq(t.call_frequency) }
  const handleGoToActions = () => { setSetupActions(generateDefaultActions(setupWeeks, setupCallFreq).map((a, i) => ({ ...a, enabled: true, id: i }))); setSetupStep(3) }
  const handleCreateJourney = async () => {
    if (!selectedClient?.id) return
    try {
      const t = TEMPLATES[setupTemplate]
      await ClientJourneyService.createClientJourney(selectedClient.id, coachId, { total_weeks: setupWeeks, phases: scalePhases(t.phases, t.total_weeks, setupWeeks), default_actions: setupActions.filter(a => a.enabled) })
      setSetupStep(1); setShowSetup(false); await loadJourneyData()
    } catch (e) { console.error('Create journey:', e) }
  }

  const handleToggleAction = async (id, status) => {
    const ns = status === 'completed' ? 'pending' : 'completed'
    await ClientJourneyService.updateJourneyAction(id, { status: ns, completed_at: ns === 'completed' ? new Date().toISOString() : null })
    setActions(prev => prev.map(a => a.id === id ? { ...a, status: ns } : a))
  }
  const handleSaveAction = async (data) => {
    try {
      if (editingAction?.id && typeof editingAction.id === 'string' && editingAction.id.length > 10)
        await ClientJourneyService.updateJourneyAction(editingAction.id, data)
      else
        await ClientJourneyService.createJourneyAction(journey.id, selectedClient.id, coachId, data)
      await loadJourneyData(); setShowAddAction(false); setEditingAction(null)
    } catch (e) { console.error('Save action:', e) }
  }
  const handleDeleteAction = async (id) => { await ClientJourneyService.deleteJourneyAction(id); setActions(prev => prev.filter(a => a.id !== id)) }

  const handlePrev = () => {
    if (zoomLevel === 'days' && selectedDay > 0) setSelectedDay(selectedDay - 1)
    else if (zoomLevel === 'days' && selectedDay === 0) { setZoomLevel('weeks'); setSelectedDay(null) }
    else setSelectedWeek(Math.max(0, selectedWeek - 1))
  }
  const handleNext = () => {
    if (zoomLevel === 'days' && selectedDay < 6) setSelectedDay(selectedDay + 1)
    else if (zoomLevel === 'days' && selectedDay === 6) { setSelectedWeek(Math.min(totalWeeks, selectedWeek + 1)); setSelectedDay(0) }
    else setSelectedWeek(Math.min(totalWeeks, selectedWeek + 1))
  }

  const handleOpenActionModal = (category, column, weekNum) => {
    const w = weekNum || column; setSelectedWeek(w)
    if (viewMode !== 'full') setSelectedDay(typeof column === 'number' && column <= 6 ? column : null)
    setOpenModal({ category, column, weekNum: w })
  }
  const handleOpenEvaluation = (weekNumber) => setEvalModal({ weekNumber })

  const totalWeeks = journey?.total_weeks || 12
  const phases = journey?.phases || []
  const getPhase = (w) => phases.find(p => w >= p.week_start && w <= p.week_end) || null
  const selectedPhase = getPhase(selectedWeek)
  const weekActions = useMemo(() => actions.filter(a => a.week_number === selectedWeek), [actions, selectedWeek])
  const overallProgress = actions.length > 0 ? Math.round((actions.filter(a => a.status === 'completed').length / actions.length) * 100) : 0

  const [messagesByDay, setMessagesByDay] = useState({})
  useEffect(() => {
    if (!db?.supabase || selectedWeek == null) return
    const svc = new JourneyMessageService(db.supabase)
    const wStart = Math.max(1, (selectedWeek || currentWeek) - 1)
    const wEnd = Math.min(totalWeeks, (selectedWeek || currentWeek) + 2)
    const weeks = []; for (let w = wStart; w <= wEnd; w++) weeks.push(w)
    Promise.all(weeks.map(w => svc.getDaysWithMessages(w, totalWeeks).then(byDay => ({ week: w, byDay }))))
      .then(results => { const c = {}; results.forEach(({ week, byDay }) => { Object.entries(byDay).forEach(([day, msgs]) => { c[`${week}:${day}`] = msgs }) }); setMessagesByDay(c) })
      .catch(() => setMessagesByDay({}))
  }, [selectedWeek, currentWeek, totalWeeks, db?.supabase])

  const modalWeek = openModal ? (openModal.weekNum || openModal.column) : null

  // ── Guards ──────────────────────────────────────
  if (!selectedClient) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem', minHeight: '60vh', textAlign: 'center' }}>
      <User size={48} color={G.textDim} /><p style={{ color: G.textMuted, marginTop: '1rem' }}>Selecteer een client</p>
    </div>
  )

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem', minHeight: '60vh' }}>
      <div style={{ width: '40px', height: '40px', border: `3px solid ${G.border}`, borderTop: `3px solid ${G.gold}`, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  // ── Geen journey: SOP flow of SetupFlow ─────────
  if (!journey) {
    if (showSetup) {
      return (
        <SetupFlow
          isMobile={isMobile}
          clientName={selectedClient.first_name}
          step={setupStep}
          template={setupTemplate}
          weeks={setupWeeks}
          callFreq={setupCallFreq}
          setupActions={setupActions}
          onSelectTemplate={handleSelectTemplate}
          onSetWeeks={setSetupWeeks}
          onSetCallFreq={setSetupCallFreq}
          onGoStep2={() => setSetupStep(2)}
          onGoStep3={handleGoToActions}
          onToggleAction={(i) => setSetupActions(p => p.map((a, j) => j === i ? { ...a, enabled: !a.enabled } : a))}
          onCreateJourney={handleCreateJourney}
          onBack={() => {
            if (setupStep <= 1) setShowSetup(false)
            else setSetupStep(Math.max(1, setupStep - 1))
          }}
        />
      )
    }

    return (
      <OnboardingSOPFlow
        db={db}
        selectedClient={selectedClient}
        onStartSetup={() => { setShowSetup(true); setSetupStep(1) }}
        onOpenMealPanel={onOpenMealPanel}
        onOpenWorkoutPanel={onOpenWorkoutPanel}
      />
    )
  }

  // ========== MAIN RENDER — compact ==========
  return (
    <div style={{ background: G.bg }}>

      {/* ═══ COMPACT NAV STRIP ═══ */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: isMobile ? '0.35rem 0.75rem' : '0.35rem 1rem',
        borderBottom: `1px solid ${G.border}`
      }}>
        {/* Left: nav + week info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <button onClick={handlePrev} disabled={selectedWeek <= 0 && zoomLevel === 'weeks'} style={navBtn(isMobile)}><ChevronLeft size={14} /></button>
          <div>
            <span style={{ fontSize: isMobile ? '0.75rem' : '0.8rem', fontWeight: 800, color: G.text }}>
              {selectedWeek === 0 ? 'Onboarding' : `W${selectedWeek}`}
              {selectedWeek === currentWeek && (
                <span style={{ marginLeft: '0.2rem', fontSize: '0.72rem', padding: '0.04rem 0.2rem', borderRadius: '3px', background: `${G.gold}20`, color: G.gold, fontWeight: 700, verticalAlign: 'middle' }}>NU</span>
              )}
            </span>
            <div style={{ fontSize: '0.72rem', color: G.textMuted, lineHeight: 1.2 }}>
              {selectedPhase?.name || ''}{journey.coaching_plan ? ` · ${journey.coaching_plan.deficit_level} · Lv${journey.coaching_plan.coaching_level}` : ''}
            </div>
          </div>
          <button onClick={handleNext} disabled={selectedWeek >= totalWeeks && zoomLevel === 'weeks'} style={navBtn(isMobile)}><ChevronRight size={14} /></button>
        </div>

        {/* Right: actions count + add button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          {weekActions.length > 0 && (
            <span style={{ fontSize: '0.72rem', color: G.textMuted, display: 'flex', alignItems: 'center', gap: '0.1rem' }}>
              <CheckCircle size={8} color={weekActions.every(a => a.status === 'completed') ? G.green : G.textDim} />
              {weekActions.filter(a => a.status === 'completed').length}/{weekActions.length}
            </span>
          )}
          <button onClick={() => { setEditingAction({ week_number: selectedWeek, day_number: selectedDay || 0 }); setShowAddAction(true) }} style={{
            padding: '0.15rem 0.35rem', borderRadius: '4px',
            background: 'transparent', border: `1px solid ${G.gold}20`,
            color: G.gold, fontSize: '0.72rem', fontWeight: 700,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.1rem',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: '22px'
          }}>
            <Plus size={9} /> Actie
          </button>
        </div>
      </div>

      {/* ═══ TIMELINE ═══ */}
      <HorizontalTimeline
        journey={journey} actions={actions} phases={phases} totalWeeks={totalWeeks} currentWeek={currentWeek}
        selectedWeek={selectedWeek} selectedDay={selectedDay} viewMode={viewMode} zoomLevel={zoomLevel}
        onSelectWeek={(w) => { setSelectedWeek(w); setSelectedDay(null) }}
        onSelectDay={setSelectedDay}
        onSetViewMode={setViewMode}
        onOpenActionModal={handleOpenActionModal}
        onOpenEvaluation={handleOpenEvaluation}
        messagesByDay={messagesByDay}
        isMobile={isMobile}
      />

      {/* ═══ CATEGORY MODAL ═══ */}
      {openModal && (
        <CategoryModal
          category={openModal.category} column={openModal.column}
          weekNumber={modalWeek} totalWeeks={totalWeeks}
          zoomLevel={zoomLevel} selectedWeek={selectedWeek}
          client={selectedClient} journey={journey} db={db} isMobile={isMobile}
          onClose={() => setOpenModal(null)}
        />
      )}

      {/* ═══ EVALUATION MODAL ═══ */}
      {evalModal && (
        <EvaluationModal
          isOpen={true}
          onClose={() => setEvalModal(null)}
          weekNumber={evalModal.weekNumber}
          coachingPlan={journey?.coaching_plan}
          weightHistory={weightHistory}
          journey={journey}
          db={db}
          isMobile={isMobile}
          onPlanUpdated={loadJourneyData}
        />
      )}

      {/* ═══ ACTION MODAL ═══ */}
      {showAddAction && (
        <ActionModal
          action={editingAction} weekNumber={selectedWeek} dayNumber={selectedDay}
          isMobile={isMobile} onSave={handleSaveAction}
          onClose={() => { setShowAddAction(false); setEditingAction(null) }}
        />
      )}
    </div>
  )
}


// ============================================
// CATEGORY MODAL
// ============================================
function CategoryModal({ category, column, weekNumber, totalWeeks, zoomLevel, selectedWeek, client, journey, db, isMobile, onClose }) {
  const config = CAT_MODALS[category]
  if (!config) return null
  const Icon = config.icon

  return (
    <div onClick={onClose} style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center',
      zIndex: 9999, padding: isMobile ? 0 : category === 'call' ? 0 : '1rem'
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#0a0a0a', border: `1px solid ${config.color}30`,
        borderRadius: isMobile ? '20px 20px 0 0' : category === 'call' ? '0' : '20px',
        width: isMobile ? '100%' : category === 'call' ? '100vw' : '560px',
        maxWidth: category === 'call' ? '100vw' : '560px',
        height: category === 'call' ? '100vh' : undefined,
        maxHeight: isMobile ? '85vh' : category === 'call' ? '100vh' : '80vh',
        overflow: 'auto', position: 'relative',
        boxShadow: `0 0 40px ${config.color}15`
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '80px', background: `linear-gradient(180deg, ${config.color}08 0%, transparent 100%)`, pointerEvents: 'none', borderRadius: isMobile ? '20px 20px 0 0' : '20px 20px 0 0' }} />

        <div style={{ padding: isMobile ? '1rem 1rem 0.75rem' : '1.25rem 1.5rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: isMobile ? '36px' : '40px', height: isMobile ? '36px' : '40px',
              borderRadius: '50%', background: `${config.color}15`,
              border: `1.5px solid ${config.color}40`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 0 12px ${config.color}20`
            }}>
              <Icon size={isMobile ? 16 : 18} color={config.color} />
            </div>
            <div>
              <h3 style={{ color: '#fff', fontSize: isMobile ? '1rem' : '1.1rem', fontWeight: '700', margin: 0 }}>{config.label}</h3>
              <p style={{ color: config.color, fontSize: '0.72rem', fontWeight: '600', margin: '0.1rem 0 0', letterSpacing: '-0.01em' }}>
                {column != null && column <= 6 ? `${DAY_LABELS[column]} — Week ${weekNumber}` : `Week ${weekNumber}`}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{
            width: '32px', height: '32px', borderRadius: '10px',
            background: 'rgba(255,255,255,0.05)', border: `1px solid ${G.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
          }}>
            <X size={16} color={G.textMuted} />
          </button>
        </div>

        <div style={{ padding: isMobile ? '0 1rem 1.5rem' : '0 1.5rem 1.5rem' }}>
          {category === 'call' && <CallPanel db={db} client={client} journey={journey} weekNumber={weekNumber} totalWeeks={totalWeeks} isMobile={isMobile} />}
          {category === 'bericht' && <MessageSystem db={db} client={client} journey={journey} weekNumber={weekNumber} dayNumber={column != null && column <= 6 ? column : null} totalWeeks={totalWeeks} isMobile={isMobile} />}
        </div>
      </div>
    </div>
  )
}
