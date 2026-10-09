// src/modules/coach-command-center/CoachCommandCenter.jsx
// CoachCommandCenter.jsx - v3.5
// + onOpenWorkoutPanel prop toegevoegd voor Workout SOP widget
import React, { useState, useEffect, useRef, useCallback } from 'react'
import Keuze from '../meal-plan/components/Keuze'
import { Search, AlertTriangle, Loader2, ArrowLeft, Video, X, UserPlus, Eye, EyeOff } from 'lucide-react'
import CommandCenterService from './CommandCenterService'
import ClientWeightCard from './components/ClientWeightCard'
import ClientJourneyTimeline from '../client-journey/ClientJourneyTimeline'
import CoachVideoFeedback from '../video-feedback/CoachVideoFeedback'
import AddClientModal from './components/AddClientModal'
import { naloopGrens } from '../challenge-monitor/challengeEisen'
import { PRIVE, zetPrivacy, herstelPrivacy } from './utils/privacyModus'

export default function CoachCommandCenter({ db, onSelectClient, setActiveTab, onNavigatePlan, onNavigateWorkout, onNavigateTab, onOpenMealPanel, onOpenWorkoutPanel }) {
  const isMobile = window.innerWidth <= 768
  // Laatste volledige stand van de vorige keer (sessionStorage): daarmee
  // staat de lijst meteen, in de goede volgorde en op de goede hoogte, en
  // worden de cijfers daarna stil ververst. Zonder snapshot (eerste keer in
  // deze browsersessie) een skelet van kaarten met dezelfde maat, tot de
  // urgentie-sortering er is. Zo verspringt er niets tijdens het laden
  // (Kersten, 9 okt 2026: "visueel moet het zijn alsof er niks gebeurt").
  const SNAPSHOT_SLEUTEL = 'myarc:command-snapshot'
  const snapshot = (() => {
    try { const r = sessionStorage.getItem(SNAPSHOT_SLEUTEL); return r ? JSON.parse(r) : null } catch { return null }
  })()
  const [loading, setLoading] = useState(!snapshot)
  const [clientsWithData, setClientsWithData] = useState(snapshot?.clients || [])
  // 'skelet' = nog geen gesorteerde lijst; 'klaar' = echte kaarten.
  const [kaartFase, setKaartFase] = useState(snapshot ? 'klaar' : 'skelet')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('active')
  const [urgencyFilter, setUrgencyFilter] = useState('all')
  // Challenge-deelnemers. Aparte lijst in plaats van een veld op de klant:
  // een deelname loopt van datum tot datum en zegt niets over de klant zelf.
  const [challengeIds, setChallengeIds] = useState(() => new Set())
  const [challengeFilter, setChallengeFilter] = useState('all')
  const [stats, setStats] = useState(snapshot?.stats || { total: 0, active: 0, inactive: 0, urgent: 0, warning: 0, ok: 0, fridayMissing: 0 })
  const [activeView, setActiveView] = useState('clients')
  const [showAddClient, setShowAddClient] = useState(false)
  const [journeyClient, setJourneyClient] = useState(null)
  const [coachId, setCoachId] = useState(null)
  // Namen en foto's verbergen om je scherm te kunnen delen. De stand van de
  // vorige keer komt terug, zie privacyModus.js.
  const [prive, setPrive] = useState(false)
  useEffect(() => { setPrive(herstelPrivacy()) }, [])
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

  // Wie doet er mee aan een lopende challenge. Eén kleine query, los van de
  // zware klantenlaadbeurt, zodat de lijst er niet op hoeft te wachten.
  useEffect(() => {
    let afgebroken = false
    db.supabase
      .from('challenge_assignments')
      .select('client_id')
      .eq('is_active', true)
      .gte('end_date', naloopGrens())
      .then(
        r => { if (!afgebroken) setChallengeIds(new Set((r.data || []).map(a => a.client_id))) },
        e => console.error('Challenge-deelnemers laden mislukt:', e)
      )
    return () => { afgebroken = true }
  }, [])

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
  // De check-in-kolom in het inzichtpaneel meldt dat hij ze heeft ingezien.
  // Dan hoort het bolletje meteen weg, zonder de hele lijst opnieuw te laden.
  useEffect(() => {
    const opGezien = (e) => {
      const id = e?.detail?.clientId
      if (!id) return
      setClientsWithData(prev => prev.map(c => (c.id === id ? { ...c, openCheckin: null } : c)))
    }
    window.addEventListener('myarc:checkin-gezien', opGezien)
    return () => window.removeEventListener('myarc:checkin-gezien', opGezien)
  }, [])

  const loadData = async () => {
    // Met snapshot: niets leegmaken, geen spinner; alles komt stil in de plaats.
    const stil = clientsWithData.length > 0
    if (!stil) setLoading(true)
    try {
      const user = await db.getCurrentUser().catch(() => null)
      if (user) setCoachId(user.id)

      // ── Stap 1: klanten op (snelste query) → lijst tonen ──
      // Demo-persoon (voor voorbeeldplannen in de Analyzer) niet in het
      // coaching-overzicht tonen — het is geen echte klant.
      let clients = (await db.getAllClients()).filter(c => c.email !== 'demo@myarcfitness.internal')
      // Leeg terwijl er net nog klanten stonden: bijna altijd een sessie die
      // even niet te lezen was. Eén keer opnieuw na een korte pauze.
      if (clients.length === 0 && clientsWithData.length > 0) {
        await new Promise(r => setTimeout(r, 800))
        clients = (await db.getAllClients()).filter(c => c.email !== 'demo@myarcfitness.internal')
        if (clients.length === 0) { console.warn('⚠️ Klantenlijst leeg na nieuwe poging; oude lijst blijft staan'); setLoading(false); return }
      }
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
      if (!stil) {
        // Lege kaarten tonen zou de hoogte en de volgorde nog laten
        // verspringen; de lijst staat er, maar als skelet tot stap 2.
        setClientsWithData(phase0)
        setStats(computeStats(phase0))
        setLoading(false)
      } else {
        // Nieuwe of verdwenen klanten alvast meenemen, bestaande kaarten
        // houden hun data uit de snapshot tot de verse er is.
        setClientsWithData(prev => {
          const oud = new Map(prev.map(c => [c.id, c]))
          return phase0.map(c => oud.get(c.id) ? { ...oud.get(c.id), ...clients.find(x => x.id === c.id) } : c)
        })
      }

      // ── Stap 2: weight + coaching logs (kritisch voor urgentie-sortering) ──
      const [dataWithWeight, coachingLogDataEarly, openCheckins] = await Promise.all([
        service.getClientsWeightData(clients, coachId),
        db.supabase
          .from('client_coaching_logs')
          .select('id, client_id, status, note, created_at')
          .in('client_id', clientIds)
          .order('created_at', { ascending: false })
          .then(r => {
            const byClient = {}
            r.data?.forEach(log => { if (!byClient[log.client_id]) byClient[log.client_id] = log })
            return byClient
          }),
        // Check-ins die nog op je liggen te wachten. Eén query voor de hele
        // lijst in plaats van één per kaart: bij zeventig klanten is dat het
        // verschil tussen één verzoek en zeventig.
        //
        // 'submitted' = ingediend en nog niet nagekeken. Zodra jij hem in het
        // check-in-scherm afhandelt gaat hij naar 'reviewed' en verdwijnt het
        // bolletje. 'draft' telt niet mee: die heeft de klant nooit verstuurd.
        db.supabase
          .from('client_checkins')
          .select('client_id, checkin_date')
          .in('client_id', clientIds)
          .eq('status', 'submitted')
          .is('coach_gezien_at', null)
          .order('checkin_date', { ascending: false })
          .then(r => {
            const perKlant = {}
            r.data?.forEach(row => {
              const huidig = perKlant[row.client_id]
              // `oudste` voedt de kleur van het bolletje: hoe lang ligt de
              // langst wachtende check-in er al? De nieuwste zegt daar niets
              // over -- iemand die vorige week en deze week inleverde heeft
              // een probleem van vorige week.
              if (!huidig) perKlant[row.client_id] = { aantal: 1, laatste: row.checkin_date, oudste: row.checkin_date }
              else {
                huidig.aantal += 1
                if (row.checkin_date < huidig.oudste) huidig.oudste = row.checkin_date
              }
            })
            return perKlant
          }, (e) => { console.warn('open check-ins laden mislukt:', e?.message); return {} })
      ])

      // Let op: de service geeft per klant zowel weightData als fase terug.
      // Beide moeten hier mee. Werd alleen weightData overgenomen, dan
      // bleef client.fase leeg en rekende de kaart "sinds start" vanaf de
      // allereerste meting ooit — bij een klant die net een build is
      // ingegaan las dat als -8,6 kg in plaats van -0,1 kg over deze fase.
      const weightByClient = {}
      const faseByClient = {}
      const dagCheckByClient = {}
      dataWithWeight.forEach(c => {
        if (c?.weightData) weightByClient[c.id] = c.weightData
        if (c?.fase) faseByClient[c.id] = c.fase
        if (c?.dagCheck) dagCheckByClient[c.id] = c.dagCheck
      })

      setClientsWithData(prev => {
        const merged = prev.map(c => ({
          ...c,
          weightData: weightByClient[c.id] || c.weightData,
          fase: faseByClient[c.id] || c.fase || null,
          dagCheck: dagCheckByClient[c.id] || c.dagCheck || null,
          openCheckin: openCheckins[c.id] || null,
          latestCoachingLog: coachingLogDataEarly[c.id] || c.latestCoachingLog,
        }))
        // Stil (snapshot): in de plaats, nog niet opnieuw sorteren; dat doen
        // we één keer aan het eind, zodat kaarten niet twee keer verspringen.
        const sorted = stil ? merged : service.sortByUrgency(merged)
        setStats(computeStats(sorted))
        return sorted
      })
      setKaartFase('klaar')

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
        // Volledige stand bewaren voor de volgende keer in deze sessie.
        try { sessionStorage.setItem(SNAPSHOT_SLEUTEL, JSON.stringify({ clients: sorted, stats: computeStats(sorted), t: Date.now() })) } catch { /* te groot of geen storage */ }
        return sorted
      })

    } catch (error) { console.error('❌ Error loading:', error); setLoading(false); setKaartFase('klaar') }
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

  // Hoeveel van je actieve klanten heb je vandaag afgevinkt?
  //
  // Bewust over álle actieve klanten en niet over wat het filter toont: de
  // vraag is "hoever ben ik vandaag", en dat antwoord hoort niet te
  // veranderen omdat je even op Urgent filtert.
  // Een kaart die wordt afgevinkt geeft zijn nieuwe stand door, zodat de
  // teller in de kop meteen meebeweegt in plaats van pas na een herlaadbeurt.
  const verwerkDagCheck = useCallback((clientId, dagen) => {
    setClientsWithData(prev => prev.map(c =>
      c.id === clientId ? { ...c, dagCheck: { ...(c.dagCheck || {}), dagen } } : c
    ))
  }, [])

  const vandaagStr = new Date().toLocaleDateString('sv-SE')
  const actieveKlanten = clientsWithData.filter(c => c.status === 'active')
  const gehadVandaag = actieveKlanten.filter(c => c.dagCheck?.dagen?.includes(vandaagStr)).length
  const nogTeGaan = actieveKlanten.length - gehadVandaag

  const filteredClients = clientsWithData.filter(client => {
    if (statusFilter !== 'all' && client.status !== statusFilter) return false
    if (challengeFilter === 'challenge' && !challengeIds.has(client.id)) return false
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
          <span className={PRIVE} style={{ color: '#fff', fontSize: '0.85rem', fontWeight: '600' }}>{journeyClient.first_name} {journeyClient.last_name}</span>
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
        {/* Filters als keuzemenu's (losse tekst met pijltje, lijntje
            ertussen), zelfde taal als de kopbalk van de Workout Builder en
            het wisselvenster op de voedingspagina. Geen systeem-selects. */}
        <div style={{ display: 'flex', alignItems: 'center', minWidth: 0, flex: isMobile ? '1 1 100%' : '0 0 auto', padding: '0 0.3rem', height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <Keuze vast waarde={statusFilter} zet={(v) => { setStatusFilter(v); setUrgencyFilter('all') }} isMobile={isMobile}
            opties={[{ id: 'active', label: `Actief · ${stats.active}` }, { id: 'inactive', label: `Inactief · ${stats.inactive}` }, { id: 'all', label: `Alle · ${stats.total}` }]} />
          {statusFilter === 'active' && (<>
            <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.15)', flexShrink: 0 }} />
            <Keuze vast waarde={urgencyFilter} zet={setUrgencyFilter} isMobile={isMobile}
              opties={[{ id: 'all', label: `Alle urgenties · ${stats.active}` }, { id: 'urgent', label: `Urgent · ${stats.urgent}` }, { id: 'warning', label: `Aandacht · ${stats.warning}` }, { id: 'ok', label: `Op schema · ${stats.ok}` }]} />
          </>)}
          {challengeIds.size > 0 && (<>
            <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.15)', flexShrink: 0 }} />
            <Keuze vast waarde={challengeFilter} zet={setChallengeFilter} isMobile={isMobile} uitlijning="rechts"
              opties={[{ id: 'all', label: 'Iedereen' }, { id: 'challenge', label: `Challenge · ${challengeIds.size}` }]} />
          </>)}
        </div>

        {!isMobile && <div style={{ flex: 1, minWidth: 8 }} />}
        {/* Regelafbreking op telefoon: zoeken + knoppen op een eigen rij. */}
        {isMobile && <div style={{ flexBasis: '100%', height: 0 }} />}

        {/* Zoeken staat nu inline; dat scheelt een klik en een aparte rij. */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6, minWidth: 0,
          flex: isMobile ? '1 1 0' : '0 1 240px',
          padding: '0 0.75rem', height: 36, borderRadius: 999,
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
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

        {/* Scherm delen: namen en foto's eruit, cijfers erin. Het oog dicht
            betekent dat er nu iets verborgen is. */}
        <button onClick={() => { const nieuw = !prive; setPrive(nieuw); zetPrivacy(nieuw) }}
          title={prive ? 'Namen en foto\'s weer tonen' : "Namen en foto's verbergen (scherm delen)"}
          aria-label="Namen en foto's verbergen"
          style={{
            flexShrink: 0, width: 36, height: 36, borderRadius: 10, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: prive ? '#fff' : 'rgba(255,255,255,0.05)',
            border: prive ? 'none' : '1px solid rgba(255,255,255,0.1)',
            color: prive ? '#000' : 'rgba(255,255,255,0.7)',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}>
          {prive ? <EyeOff size={15} strokeWidth={2.4} /> : <Eye size={15} strokeWidth={2.4} />}
        </button>

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

        {/* Hoever ben ik vandaag: hoeveel klanten heb ik afgevinkt.
            De ring loopt vol naarmate je de lijst afwerkt; het getal eronder
            zegt hoeveel er nog te gaan zijn. Alleen een percentage zou
            verbergen of het om twee of om twintig klanten gaat. */}
        {actieveKlanten.length > 0 && (
          <div
            title={`${gehadVandaag} van ${actieveKlanten.length} klanten vandaag afgevinkt · nog ${nogTeGaan} te gaan`}
            style={{
              flexShrink: 0, position: 'relative',
              width: 56, height: 56,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <svg width="56" height="56" viewBox="0 0 56 56" style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}>
              <circle cx="28" cy="28" r="24" fill="none"
                stroke="rgba(255,255,255,0.09)" strokeWidth="4" />
              <circle cx="28" cy="28" r="24" fill="none"
                stroke={nogTeGaan === 0 ? '#10b981' : '#FFD700'} strokeWidth="4" strokeLinecap="round"
                // De omtrek is 2πr; het niet-getekende deel is wat er nog te
                // gaan is. Bij nul afgevinkt blijft de ring dus leeg.
                strokeDasharray={2 * Math.PI * 24}
                strokeDashoffset={2 * Math.PI * 24 * (1 - gehadVandaag / actieveKlanten.length)}
                style={{ transition: 'stroke-dashoffset 0.3s ease' }} />
            </svg>
            {/* Het aantal groot, het totaal klein eronder. In één maat naast
                elkaar ("13/13") wordt het bij twee cijfers te vol om in een
                oogopslag te lezen. */}
            <span style={{
              position: 'relative', display: 'flex', flexDirection: 'column',
              alignItems: 'center', lineHeight: 1,
              color: nogTeGaan === 0 ? '#10b981' : '#fff',
              fontVariantNumeric: 'tabular-nums',
            }}>
              <span style={{ fontSize: '1rem', fontWeight: 900 }}>{gehadVandaag}</span>
              <span style={{
                fontSize: '0.58rem', fontWeight: 800,
                color: nogTeGaan === 0 ? 'rgba(16,185,129,0.7)' : 'rgba(255,255,255,0.4)',
              }}>/{actieveKlanten.length}</span>
            </span>
          </div>
        )}
      </div>


      {activeView === 'video' && <div style={{ padding: isMobile ? '1rem' : '2rem' }}><CoachVideoFeedback db={db} /></div>}

      {activeView === 'clients' && (
        <>
          {stats.fridayMissing > 0 && new Date().getDay() === 5 && (
            <div style={{ padding: isMobile ? '0.35rem 1rem' : '0.4rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: isMobile ? '0.7rem' : '0.74rem', fontWeight: 800, color: '#f59e0b' }}>
              <AlertTriangle size={14} /> Vrijdag! {stats.fridayMissing} client(s) nog niet gewogen
            </div>
          )}

          {(statusFilter !== 'active' || urgencyFilter !== 'all' || challengeFilter !== 'all' || searchQuery) && (
            <div style={{ padding: isMobile ? '0.375rem 1rem' : '0.375rem 2rem', fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
              {filteredClients.length} van {stats.total}{searchQuery && ` · "${searchQuery}"`}
            </div>
          )}

          {/* CLIENT CARDS — als skelet tot de urgentie-sortering er is, dan
              één keer in met een korte fade. Zelfde hoogte als de echte kaart. */}
          <div style={{ padding: isMobile ? '0.75rem' : '1rem 2rem', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(330px, 1fr))', gap: isMobile ? '0.625rem' : '0.875rem', animation: kaartFase === 'klaar' ? 'ccKaartIn 0.28s ease' : 'none' }}>
            <style>{'@keyframes ccKaartIn { from { opacity: 0.35; } to { opacity: 1; } } @keyframes ccSkelet { 0% { opacity: 0.55; } 50% { opacity: 0.85; } 100% { opacity: 0.55; } }'}</style>
            {kaartFase === 'skelet' && filteredClients.map(client => (
              <div key={client.id} style={{ height: isMobile ? 70 : 74, borderRadius: isMobile ? 12 : 14, background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.08)', borderLeft: '3px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'stretch', overflow: 'hidden', animation: 'ccSkelet 1.4s ease-in-out infinite' }}>
                <div style={{ width: isMobile ? 56 : 64, background: 'rgba(255,255,255,0.06)' }} />
                <div style={{ flex: 1, padding: '0.7rem 0.8rem', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ width: '42%', height: 14, borderRadius: 6, background: 'rgba(255,255,255,0.1)' }} />
                    <div style={{ width: 64, height: 18, borderRadius: 6, background: 'rgba(255,255,255,0.12)' }} />
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    {[52, 52, 52].map((w, i) => <div key={i} style={{ width: w, height: 22, borderRadius: 6, background: 'rgba(255,255,255,0.07)' }} />)}
                  </div>
                </div>
              </div>
            ))}
            {kaartFase === 'klaar' && filteredClients.map(client => (
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
                onDagCheckChange={verwerkDagCheck}
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
