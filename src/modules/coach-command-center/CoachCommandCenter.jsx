// src/modules/coach-command-center/CoachCommandCenter.jsx
// CoachCommandCenter.jsx - v3.5
// + onOpenWorkoutPanel prop toegevoegd voor Workout SOP widget
import React, { useState, useEffect, useRef } from 'react'
import { Search, AlertTriangle, Loader2, ArrowLeft, Video, X, UserPlus } from 'lucide-react'
import CommandCenterService from './CommandCenterService'
import ClientWeightCard from './components/ClientWeightCard'
import ClientJourneyTimeline from '../client-journey/ClientJourneyTimeline'
import CoachVideoFeedback from '../video-feedback/CoachVideoFeedback'
import AddClientModal from './components/AddClientModal'

export default function CoachCommandCenter({ db, onSelectClient, setActiveTab, onNavigatePlan, onNavigateWorkout, onNavigateTab, onOpenMealPanel, onOpenWorkoutPanel }) {
  const isMobile = window.innerWidth <= 768
  const [loading, setLoading] = useState(true)
  const [clientsWithData, setClientsWithData] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('active')
  const [urgencyFilter, setUrgencyFilter] = useState('all')
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, urgent: 0, warning: 0, ok: 0, fridayMissing: 0 })
  const [activeView, setActiveView] = useState('clients')
  const [showAddClient, setShowAddClient] = useState(false)
  const [journeyClient, setJourneyClient] = useState(null)
  const [coachId, setCoachId] = useState(null)
  // Dropdown-stijl: dik wit, geen accentkleur. Vervangt de gekleurde
  // filterpillen die eerder een eigen rij innamen.
  const selectStijl = {
    flex: isMobile ? '1 1 0' : '0 0 auto', minWidth: 0,
    height: 36, padding: '0 0.5rem', borderRadius: 10,
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    color: '#fff', fontSize: '0.85rem', fontWeight: 800, fontFamily: 'inherit',
    cursor: 'pointer', outline: 'none', maxWidth: isMobile ? 'none' : 170,
  }
  const optieStijl = { background: '#0a0a0a', color: '#fff' }

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

  // Progressieve laad-strategie: lijst meteen tonen (zonder data), dan
  // weight + coaching logs + rest in achtergrond. setLoading=false
  // gebeurt zodra clients binnen zijn — niet pas na de 18-maand
  // weight-query voor ALLE klanten (= de oude flessenhals).
  const loadData = async () => {
    setLoading(true)
    try {
      const user = await db.getCurrentUser().catch(() => null)
      if (user) setCoachId(user.id)

      // ── Stap 1: klanten op (snelste query) → lijst tonen ──
      // Demo-persoon (voor voorbeeldplannen in de Analyzer) niet in het
      // coaching-overzicht tonen — het is geen echte klant.
      const clients = (await db.getAllClients()).filter(c => c.email !== 'demo@myarcfitness.internal')
      const clientIds = clients.map(c => c.id)

      const emptyClientShape = (client) => ({
        ...client,
        weightData:        { latest: null, history: [], daysSinceWeighin: null, fridayCount: 0, weightStatus: 'unknown', fridayMissing: false, totalLogs: 0 },
        photoData:         { photos: [], totalCount: 0, progressCount: 0, lastPhotoDate: null, lastPhoto: null },
        workoutData:       { workouts: [], totalWorkouts: 0, completedWorkouts: 0, lastWorkoutDate: null, daysSinceWorkout: null },
        exerciseProgress:  {},
        circumferenceData: { entries: [], latest: null, previous: null },
        mealData:          { plan: null, targets: null, todayMeals: [], todayTotals: { calories: 0, protein: 0, carbs: 0, fat: 0 }, dailyLog: {}, loggingDays: 0, avgCalories: 0 },
        coachingPlan:      null,
        latestCoachingLog: null,
      })

      const phase0 = clients.map(emptyClientShape)
      setClientsWithData(phase0)
      setStats(computeStats(phase0))
      setLoading(false)   // ← lijst is meteen zichtbaar

      // ── Stap 2: weight + coaching logs (kritisch voor urgentie-sortering) ──
      const [dataWithWeight, coachingLogDataEarly] = await Promise.all([
        service.getClientsWeightData(clients),
        db.supabase
          .from('client_coaching_logs')
          .select('id, client_id, status, note, created_at')
          .in('client_id', clientIds)
          .order('created_at', { ascending: false })
          .then(r => {
            const byClient = {}
            r.data?.forEach(log => { if (!byClient[log.client_id]) byClient[log.client_id] = log })
            return byClient
          })
      ])

      const weightByClient = {}
      dataWithWeight.forEach(c => { if (c?.weightData) weightByClient[c.id] = c.weightData })

      setClientsWithData(prev => {
        const merged = prev.map(c => ({
          ...c,
          weightData: weightByClient[c.id] || c.weightData,
          latestCoachingLog: coachingLogDataEarly[c.id] || c.latestCoachingLog,
        }))
        const sorted = service.sortByUrgency(merged)
        setStats(computeStats(sorted))
        return sorted
      })

      // ── Stap 3: rich data (photos, workouts, meals, plan, etc.) ──
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
        const sorted = service.sortByUrgency(updated)
        setStats(computeStats(sorted))
        return sorted
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

  // Klant is definitief verwijderd → kaart uit de lijst en de tellers bijwerken.
  const handleClientDeleted = (clientId) => {
    const weg = clientsWithData.find(c => c.id === clientId)
    setClientsWithData(prev => prev.filter(c => c.id !== clientId))
    if (weg) {
      setStats(prev => ({
        ...prev,
        active:   weg.status === 'active'   ? Math.max(0, prev.active - 1)   : prev.active,
        inactive: weg.status === 'inactive' ? Math.max(0, prev.inactive - 1) : prev.inactive,
      }))
    }
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
  // Push paused / ended coaching clients to the bottom so the coach sees
  // active clients first. Order within each bucket is preserved (stable sort).
  .slice()
  .sort((a, b) => {
    const aw = a.coaching_status === 'ended' ? 2 : a.coaching_status === 'paused' ? 1 : 0
    const bw = b.coaching_status === 'ended' ? 2 : b.coaching_status === 'paused' ? 1 : 0
    return aw - bw
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
      {/* COMPACT HEADER — glass + pills, zelfde stijl als ClientDashboard */}
      <div style={{
        padding: isMobile ? '0.75rem 1rem' : '0.9rem 2rem',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(10,10,10,0.92)',
        backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        // Op een telefoon past dit niet op één regel: twee dropdowns plus een
        // zoekveld plus twee knoppen lopen ruim over 375px heen. Daarom
        // wrappen; de zoekbalk krijgt dan de volle tweede regel.
        display: 'flex', alignItems: 'center', flexWrap: isMobile ? 'wrap' : 'nowrap',
        gap: isMobile ? '0.5rem' : '0.75rem',
      }}>
        {/* Eén regel: filters links, zoek + camera + nieuwe klant rechts.
            Geen titel, geen gekleurde chips, geen bolletjes — de statusfilters
            zaten eerder als losse pillen op een tweede rij en dat kostte hoogte
            zonder iets toe te voegen. */}
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setUrgencyFilter('all') }}
          style={selectStijl}
        >
          <option value="active" style={optieStijl}>Actief · {stats.active}</option>
          <option value="inactive" style={optieStijl}>Inactief · {stats.inactive}</option>
          <option value="all" style={optieStijl}>Alle · {stats.total}</option>
        </select>

        {statusFilter === 'active' && (
          <select
            value={urgencyFilter}
            onChange={e => setUrgencyFilter(e.target.value)}
            style={selectStijl}
          >
            <option value="all" style={optieStijl}>Alle urgenties · {stats.active}</option>
            <option value="urgent" style={optieStijl}>Urgent · {stats.urgent}</option>
            <option value="warning" style={optieStijl}>Aandacht · {stats.warning}</option>
            <option value="ok" style={optieStijl}>Op schema · {stats.ok}</option>
          </select>
        )}

        {!isMobile && <div style={{ flex: 1, minWidth: 8 }} />}
        {/* Regelafbreking op telefoon: zoeken + knoppen op een eigen rij. */}
        {isMobile && <div style={{ flexBasis: '100%', height: 0 }} />}

        {/* Zoeken staat nu inline; dat scheelt een klik en een aparte rij. */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6, minWidth: 0,
          flex: isMobile ? '1 1 0' : '0 1 260px',
          padding: '0 0.6rem', height: 36, borderRadius: 10,
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
        }}>
          <Search size={14} color="rgba(255,255,255,0.45)" style={{ flexShrink: 0 }} />
          <input
            type="text" placeholder="Zoek klant" value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ flex: 1, minWidth: 0, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: '0.85rem', fontWeight: 700, fontFamily: 'inherit' }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} style={{ flexShrink: 0, background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 0, display: 'flex' }}>
              <X size={13} />
            </button>
          )}
        </div>

        <button onClick={() => setActiveView(activeView === 'video' ? 'clients' : 'video')}
          title={activeView === 'video' ? 'Terug naar klanten' : 'Video-feedback'}
          style={{
            flexShrink: 0, width: 36, height: 36, borderRadius: 10, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: activeView === 'video' ? '#fff' : 'rgba(255,255,255,0.05)',
            border: activeView === 'video' ? 'none' : '1px solid rgba(255,255,255,0.1)',
            color: activeView === 'video' ? '#000' : 'rgba(255,255,255,0.7)',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}>
          <Video size={15} strokeWidth={2.4} />
        </button>

        <button onClick={() => setShowAddClient(true)}
          title="Nieuwe klant toevoegen" aria-label="Nieuwe klant toevoegen"
          style={{
            flexShrink: 0, height: 36, padding: isMobile ? '0 0.7rem' : '0 0.9rem',
            borderRadius: 10, background: '#fff', border: 'none', color: '#000',
            fontSize: '0.82rem', fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}>
          <UserPlus size={15} strokeWidth={2.6} />
          {!isMobile && 'Klant'}
        </button>
      </div>


      {activeView === 'video' && <div style={{ padding: isMobile ? '1rem' : '2rem' }}><CoachVideoFeedback db={db} /></div>}

      {activeView === 'clients' && (
        <>
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
                onDeleted={handleClientDeleted}
                showStatusToggle={true}
                onOpenJourney={() => setJourneyClient(client)}
                onNavigatePlan={onNavigatePlan}
                onNavigateWorkout={onNavigateWorkout}
                onNavigateTab={onNavigateTab}
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

      <AddClientModal
        open={showAddClient}
        db={db}
        coachId={coachId}
        isMobile={isMobile}
        onClose={() => setShowAddClient(false)}
        onCreated={() => { loadData() }}
      />
    </div>
  )
}
