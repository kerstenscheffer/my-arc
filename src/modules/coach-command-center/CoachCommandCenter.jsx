// src/modules/coach-command-center/CoachCommandCenter.jsx
// CoachCommandCenter.jsx - v3.5
// + onOpenWorkoutPanel prop toegevoegd voor Workout SOP widget
import React, { useState, useEffect, useRef } from 'react'
import { Search, Users, AlertTriangle, Loader2, ArrowLeft, Video, X } from 'lucide-react'
import CommandCenterService from './CommandCenterService'
import ClientWeightCard from './components/ClientWeightCard'
import ClientJourneyTimeline from '../client-journey/ClientJourneyTimeline'
import CoachVideoFeedback from '../video-feedback/CoachVideoFeedback'

export default function CoachCommandCenter({ db, onSelectClient, setActiveTab, onNavigatePlan, onNavigateWorkout, onOpenMealPanel, onOpenWorkoutPanel }) {
  console.log('🏋️ CoachCommandCenter render — onOpenMealPanel:', typeof onOpenMealPanel, '— onOpenWorkoutPanel:', typeof onOpenWorkoutPanel)
  const isMobile = window.innerWidth <= 768
  const [loading, setLoading] = useState(true)
  const [clientsWithData, setClientsWithData] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState('active')
  const [urgencyFilter, setUrgencyFilter] = useState('all')
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, urgent: 0, warning: 0, ok: 0, fridayMissing: 0 })
  const [activeView, setActiveView] = useState('clients')
  const [journeyClient, setJourneyClient] = useState(null)
  const [coachId, setCoachId] = useState(null)
  const serviceRef = useRef(new CommandCenterService(db))
  const service = serviceRef.current

  useEffect(() => { loadData() }, [])

  const computeStats = (sorted) => {
    const activeClients = sorted.filter(c => c.status === 'active')
    return {
      total: sorted.length,
      active: activeClients.length,
      inactive: sorted.filter(c => c.status === 'inactive').length,
      urgent: activeClients.filter(c => { const s = c.weightData?.weightStatus; return s === 'never' || s === 'overdue' || c.weightData?.fridayMissing }).length,
      warning: activeClients.filter(c => c.weightData?.weightStatus === 'warning').length,
      ok: activeClients.filter(c => { const s = c.weightData?.weightStatus; return s === 'today' || s === 'recent' }).length,
      fridayMissing: activeClients.filter(c => c.weightData?.fridayMissing).length
    }
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const user = await db.getCurrentUser().catch(() => null)
      if (user) setCoachId(user.id)

      const [clients, coachingLogDataEarly] = await Promise.all([
        db.getAllClients(),
        db.supabase
          .from('client_coaching_logs')
          .select('id, client_id, status, note, created_at')
          .order('created_at', { ascending: false })
          .then(r => {
            const byClient = {}
            r.data?.forEach(log => { if (!byClient[log.client_id]) byClient[log.client_id] = log })
            return byClient
          })
      ])
      const clientIds = clients.map(c => c.id)

      const dataWithWeight = await service.getClientsWeightData(clients)

      const phase1 = dataWithWeight.map(client => ({
        ...client,
        photoData:         { photos: [], totalCount: 0, progressCount: 0, lastPhotoDate: null, lastPhoto: null },
        workoutData:       { workouts: [], totalWorkouts: 0, completedWorkouts: 0, lastWorkoutDate: null, daysSinceWorkout: null },
        exerciseProgress:  {},
        circumferenceData: { entries: [], latest: null, previous: null },
        mealData:          { plan: null, targets: null, todayMeals: [], todayTotals: { calories: 0, protein: 0, carbs: 0, fat: 0 }, dailyLog: {}, loggingDays: 0, avgCalories: 0 },
        coachingPlan:      null,
        latestCoachingLog: coachingLogDataEarly[client.id] || null
      }))

      const sorted1 = service.sortByUrgency(phase1)
      setClientsWithData(sorted1)
      setStats(computeStats(sorted1))
      setLoading(false)

      const [photoData, workoutData, mealData, coachingPlanData, exerciseProgress, circumferenceData] = await Promise.all([
        service.getClientsPhotoData(clientIds),
        service.getClientsWorkoutData(clientIds),
        service.getClientsMealData(clientIds),
        service.getClientsCoachingPlan(clientIds),
        service.getClientsExerciseProgress(clientIds),
        service.getClientsCircumference(clientIds)
      ])

      setClientsWithData(prev => {
        const updated = prev.map(client => ({
          ...client,
          photoData:        photoData[client.id]        || client.photoData,
          workoutData:      workoutData[client.id]      || client.workoutData,
          mealData:         mealData[client.id]         || client.mealData,
          coachingPlan:     coachingPlanData[client.id] || null,
          exerciseProgress: exerciseProgress[client.id] || {},
          circumferenceData: circumferenceData[client.id] || { entries: [], latest: null, previous: null }
        }))
        setStats(computeStats(service.sortByUrgency(updated)))
        return service.sortByUrgency(updated)
      })

    } catch (error) { console.error('❌ Error loading:', error); setLoading(false) }
  }

  const handleToggleStatus = async (clientId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
    try {
      await db.updateClientStatus(clientId, newStatus)
      setClientsWithData(prev => prev.map(c => c.id === clientId ? { ...c, status: newStatus } : c))
      setStats(prev => ({ ...prev, active: newStatus === 'active' ? prev.active + 1 : prev.active - 1, inactive: newStatus === 'inactive' ? prev.inactive + 1 : prev.inactive - 1 }))
    } catch (error) { console.error('❌ Toggle failed:', error); alert('Kon status niet wijzigen') }
  }

  const filteredClients = clientsWithData.filter(client => {
    if (statusFilter !== 'all' && client.status !== statusFilter) return false
    if (searchQuery && !`${client.first_name} ${client.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())) return false
    if (urgencyFilter !== 'all' && client.status === 'active') {
      const ws = client.weightData?.weightStatus || 'unknown'
      const fm = client.weightData?.fridayMissing
      switch (urgencyFilter) {
        case 'urgent':  return ws === 'never' || ws === 'overdue' || fm
        case 'warning': return ws === 'warning'
        case 'ok':      return ws === 'today' || ws === 'recent'
        default:        return true
      }
    }
    return true
  })

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '0.75rem' }}>
        <Loader2 size={28} color="#FFD700" style={{ animation: 'ccSpin 1s linear infinite' }} />
        <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'rgba(255,215,0,0.6)' }}>Loading...</span>
        <style>{`@keyframes ccSpin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (journeyClient) {
    return (
      <div style={{ paddingBottom: isMobile ? '100px' : '2rem' }}>
        <div style={{ padding: isMobile ? '0.625rem 1rem' : '0.75rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => setJourneyClient(null)} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.4rem 0.75rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: '0.8rem' }}>
            <ArrowLeft size={14} /> Terug
          </button>
          <span style={{ color: '#fff', fontSize: '0.85rem', fontWeight: '600' }}>{journeyClient.first_name} {journeyClient.last_name}</span>
        </div>
        <ClientJourneyTimeline
          db={db}
          clients={clientsWithData}
          selectedClient={journeyClient}
          onSelectClient={setJourneyClient}
          coachId={coachId}
          isMobile={isMobile}
          onOpenMealPanel={onOpenMealPanel}
          onOpenWorkoutPanel={onOpenWorkoutPanel}
        />
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: isMobile ? '100px' : '2rem' }}>
      {/* COMPACT HEADER */}
      <div style={{ padding: isMobile ? '0.75rem 1rem' : '1rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: isMobile ? '0.5rem' : '0.75rem' }}>
        <h1 style={{ fontSize: isMobile ? '1.1rem' : '1.35rem', fontWeight: '800', color: '#FFD700', margin: 0, letterSpacing: '-0.02em', whiteSpace: 'nowrap', flexShrink: 0 }}>⚡ Command</h1>
        <span style={{ fontSize: '0.6rem', fontWeight: '700', color: 'rgba(255,215,0,0.5)', whiteSpace: 'nowrap', flexShrink: 0 }}>{stats.active}/{stats.total}</span>
        <div style={{ flex: 1 }} />
        <button onClick={() => setActiveView('clients')} style={{ padding: isMobile ? '0.35rem 0.625rem' : '0.4rem 0.75rem', background: activeView === 'clients' ? 'rgba(255,215,0,0.12)' : 'transparent', border: activeView === 'clients' ? '1px solid rgba(255,215,0,0.25)' : '1px solid transparent', borderRadius: '6px', color: activeView === 'clients' ? '#FFD700' : 'rgba(255,255,255,0.35)', fontSize: isMobile ? '0.7rem' : '0.75rem', fontWeight: '600', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', display: 'flex', alignItems: 'center', gap: '0.25rem', minHeight: '32px' }}><Users size={13} /> Clients</button>
        <button onClick={() => setActiveView('video')} style={{ padding: isMobile ? '0.35rem 0.5rem' : '0.4rem 0.625rem', background: activeView === 'video' ? 'rgba(255,215,0,0.12)' : 'transparent', border: activeView === 'video' ? '1px solid rgba(255,215,0,0.25)' : '1px solid transparent', borderRadius: '6px', color: activeView === 'video' ? '#FFD700' : 'rgba(255,255,255,0.25)', fontSize: isMobile ? '0.7rem' : '0.75rem', fontWeight: '600', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', display: 'flex', alignItems: 'center', gap: '0.25rem', minHeight: '32px' }}><Video size={13} /></button>
        <button onClick={() => { setSearchOpen(!searchOpen); if (searchOpen) setSearchQuery('') }} style={{ width: '32px', height: '32px', borderRadius: '6px', background: searchOpen ? 'rgba(255,215,0,0.12)' : 'transparent', border: searchOpen ? '1px solid rgba(255,215,0,0.25)' : '1px solid rgba(255,255,255,0.08)', color: searchOpen ? '#FFD700' : 'rgba(255,255,255,0.35)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', flexShrink: 0 }}>{searchOpen ? <X size={14} /> : <Search size={14} />}</button>
      </div>

      {searchOpen && (
        <div style={{ padding: isMobile ? '0.5rem 1rem' : '0.5rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <input type="text" placeholder="Zoek client..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} autoFocus style={{ width: '100%', padding: '0.5rem 0.75rem', background: 'rgba(255,215,0,0.04)', border: '1px solid rgba(255,215,0,0.12)', borderRadius: '8px', color: '#fff', fontSize: '0.85rem', outline: 'none' }} />
        </div>
      )}

      {activeView === 'video' && <div style={{ padding: isMobile ? '1rem' : '2rem' }}><CoachVideoFeedback db={db} /></div>}

      {activeView === 'clients' && (
        <>
          {/* FILTER BAR */}
          <div style={{ padding: isMobile ? '0.5rem 1rem' : '0.625rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', gap: isMobile ? '0.25rem' : '0.375rem', overflowX: 'auto', WebkitOverflowScrolling: 'touch', alignItems: 'center' }}>
            {[{ id: 'active', label: 'Actief', count: stats.active, color: '#10b981' }, { id: 'inactive', label: 'Inactief', count: stats.inactive, color: '#6b7280' }, { id: 'all', label: 'Alle', count: stats.total, color: '#FFD700' }].map(btn => (
              <button key={btn.id} onClick={() => { setStatusFilter(btn.id); setUrgencyFilter('all') }} style={{ padding: isMobile ? '0.3rem 0.5rem' : '0.35rem 0.625rem', background: statusFilter === btn.id ? `${btn.color}18` : 'transparent', border: statusFilter === btn.id ? `1px solid ${btn.color}40` : '1px solid transparent', borderRadius: '6px', color: statusFilter === btn.id ? btn.color : 'rgba(255,255,255,0.35)', fontSize: isMobile ? '0.65rem' : '0.7rem', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', display: 'flex', alignItems: 'center', gap: '0.2rem', minHeight: '28px' }}>
                {btn.label}<span style={{ fontSize: '0.55rem', fontWeight: '700', opacity: statusFilter === btn.id ? 1 : 0.5 }}>{btn.count}</span>
              </button>
            ))}
            <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.08)', margin: '0 0.125rem', flexShrink: 0 }} />
            {statusFilter === 'active' && [{ id: 'all', label: 'Alle', count: stats.active, color: '#FFD700' }, { id: 'urgent', label: '🔴', count: stats.urgent, color: '#ef4444' }, { id: 'warning', label: '🟡', count: stats.warning, color: '#f59e0b' }, { id: 'ok', label: '🟢', count: stats.ok, color: '#10b981' }].map(btn => (
              <button key={btn.id} onClick={() => setUrgencyFilter(btn.id)} style={{ padding: isMobile ? '0.3rem 0.4rem' : '0.35rem 0.5rem', background: urgencyFilter === btn.id ? `${btn.color}15` : 'transparent', border: urgencyFilter === btn.id ? `1px solid ${btn.color}35` : '1px solid transparent', borderRadius: '6px', color: urgencyFilter === btn.id ? btn.color : 'rgba(255,255,255,0.3)', fontSize: isMobile ? '0.65rem' : '0.7rem', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', display: 'flex', alignItems: 'center', gap: '0.15rem', minHeight: '28px' }}>
                {btn.label}<span style={{ fontSize: '0.55rem', opacity: 0.6 }}>{btn.count}</span>
              </button>
            ))}
          </div>

          {stats.fridayMissing > 0 && new Date().getDay() === 5 && (
            <div style={{ padding: isMobile ? '0.4rem 1rem' : '0.5rem 2rem', background: 'rgba(255,215,0,0.06)', borderBottom: '1px solid rgba(255,215,0,0.15)', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: isMobile ? '0.7rem' : '0.75rem', fontWeight: '600', color: '#FFD700' }}>
              <AlertTriangle size={14} /> Vrijdag! {stats.fridayMissing} client(s) nog niet gewogen
            </div>
          )}

          {(statusFilter !== 'active' || urgencyFilter !== 'all' || searchQuery) && (
            <div style={{ padding: isMobile ? '0.375rem 1rem' : '0.375rem 2rem', fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
              {filteredClients.length} van {stats.total}{searchQuery && ` · "${searchQuery}"`}
            </div>
          )}

          {/* CLIENT CARDS */}
          <div style={{ padding: isMobile ? '0.75rem' : '1rem 2rem', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(400px, 1fr))', gap: isMobile ? '0.625rem' : '0.875rem' }}>
            {filteredClients.map(client => (
              <ClientWeightCard
                key={client.id}
                client={client}
                isMobile={isMobile}
                onToggleStatus={handleToggleStatus}
                showStatusToggle={true}
                onOpenJourney={() => setJourneyClient(client)}
                onNavigatePlan={onNavigatePlan}
                onNavigateWorkout={onNavigateWorkout}
                db={db}
                coachId={coachId}
                onOpenMealPanel={onOpenMealPanel}
                onOpenWorkoutPanel={onOpenWorkoutPanel}
              />
            ))}
          </div>

          {filteredClients.length === 0 && (
            <div style={{ padding: isMobile ? '3rem 1.5rem' : '4rem 2rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem', opacity: 0.3 }}>{statusFilter === 'inactive' ? '👤' : '🔍'}</div>
              <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'rgba(255,255,255,0.5)', marginBottom: '0.25rem' }}>{searchQuery ? `Geen resultaten voor "${searchQuery}"` : 'Geen clients in deze categorie'}</h3>
              {(searchQuery || urgencyFilter !== 'all') && (
                <button onClick={() => { setSearchQuery(''); setUrgencyFilter('all') }} style={{ marginTop: '0.75rem', padding: '0.5rem 1.25rem', background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.25)', borderRadius: '8px', color: '#FFD700', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>Reset filters</button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
