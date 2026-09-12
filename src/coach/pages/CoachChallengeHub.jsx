// src/coach/pages/CoachChallengeHub.jsx - WITH ACTIVITY TAB + BANNER REFRESH FIX
import { useState, useEffect } from 'react'
import { Trophy, ChevronDown, RefreshCw, Users, Target, Pause, Play } from 'lucide-react'

// IMPORT CHALLENGE MONITOR VIEWS
import ChallengeBanner from '../../modules/challenge-monitor/ChallengeBanner'
import { SOORTEN } from '../../modules/challenge-monitor/challengeEisen'
import ChallengeGoalManager from '../tabs/client-info/ChallengeGoalManager'
import WorkoutProgressView from './challenge-monitor/WorkoutProgressView'
import MealProgressView from './challenge-monitor/MealProgressView'
import WeightProgressView from './challenge-monitor/WeightProgressView'
import PhotoProgressView from './challenge-monitor/PhotoProgressView'
import ChallengeAdjustments from './challenge-monitor/ChallengeAdjustments'
import LastActivityView from './challenge-monitor/LastActivityView'
import ChallengeDeelnemers from '../../modules/challenge-monitor/ChallengeDeelnemers'

export default function CoachChallengeHub({ db, clients }) {
  const isMobile = window.innerWidth <= 768
  
  // Assignment Widget State
  const [assignedClients, setAssignedClients] = useState([])
  const [assignLoading, setAssignLoading] = useState(false)
  // Soort en startdatum stonden hard op '8week' en vandaag. De 6-weken
  // 80/20-challenge was daarmee niet toe te wijzen, en een challenge die
  // maandag begint moest je achteraf in de database rechtzetten.
  // Terugkoppeling in het scherm zelf. alert() bevriest het tabblad tot
  // iemand klikt; bij een lijst waar je meerdere mensen achter elkaar
  // toewijst is dat een klik per persoon voor niets.
  const [melding, setMelding] = useState(null)
  const [soort, setSoort] = useState(SOORTEN[0].key)
  const [startDatum, setStartDatum] = useState(() => new Date().toISOString().split('T')[0])
  
  // Monitor State
  const [selectedClient, setSelectedClient] = useState(null)
  const [challengeClients, setChallengeClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeView, setActiveView] = useState('overview')
  const [challengeData, setChallengeData] = useState(null)
  const [showAssignment, setShowAssignment] = useState(false)
  
  // PAUSE STATE
  const [pauseLoading, setPauseLoading] = useState(false)
  
  // 🔥 FIX 1: Banner refresh key
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    loadAssignments()
    loadChallengeClients()
  }, [clients])

  useEffect(() => {
    if (selectedClient) {
      loadClientChallengeData()
      const interval = setInterval(loadClientChallengeData, 30000)
      return () => clearInterval(interval)
    }
  }, [selectedClient])

  // ASSIGNMENT FUNCTIONS
  async function loadAssignments() {
    try {
      const { data } = await db.supabase
        .from('challenge_assignments')
        .select('client_id')
        .eq('is_active', true)
      
      setAssignedClients(data?.map(a => a.client_id) || [])
    } catch (error) {
      console.error('Error loading assignments:', error)
    }
  }

  async function assignChallenge(clientId) {
    setMelding(null)
    setAssignLoading(true)
    try {
      const { data: existing } = await db.supabase
        .from('challenge_assignments')
        .select('id')
        .eq('client_id', clientId)
        .eq('is_active', true)
        .maybeSingle()

      if (existing) {
        setMelding({ soort: 'fout', tekst: 'Die klant doet al mee aan een lopende challenge.' })
        return
      }

      const currentUser = await db.getCurrentUser()
      const gekozen = SOORTEN.find(s => s.key === soort) || SOORTEN[0]

      // Einddatum uit de looptijd. Op middernacht lokaal rekenen: met een
      // tijdstip erin verschuift de datum bij het omzetten naar ISO.
      const eind = new Date(`${startDatum}T00:00:00`)
      eind.setDate(eind.getDate() + gekozen.dagen - 1)

      const { error } = await db.supabase
        .from('challenge_assignments')
        .insert({
          client_id: clientId,
          coach_id: currentUser.id,
          challenge_type: gekozen.key,
          start_date: startDatum,
          end_date: `${eind.getFullYear()}-${String(eind.getMonth() + 1).padStart(2, '0')}-${String(eind.getDate()).padStart(2, '0')}`,
          is_active: true
        })

      if (error) throw error

      setAssignedClients([...assignedClients, clientId])
      loadChallengeClients()
      setMelding({ soort: 'goed', tekst: 'Toegewezen.' })
      
    } catch (error) {
      console.error('Error assigning challenge:', error)
      setMelding({ soort: 'fout', tekst: `Toewijzen mislukt — ${error.message}` })
    }
    setAssignLoading(false)
  }

  async function removeChallenge(clientId) {
    if (!confirm('Remove client from challenge?')) return
    
    setAssignLoading(true)
    try {
      // .select() erbij en tellen wat er terugkomt: PostgREST geeft een update
      // die door RLS wordt tegengehouden terug als 204 zonder fout. Zonder
      // deze controle meldt het scherm "removed" terwijl er niets gebeurde.
      const { data: gewijzigd, error } = await db.supabase
        .from('challenge_assignments')
        .update({ is_active: false })
        .eq('client_id', clientId)
        .eq('is_active', true)
        .select('id')

      if (error) throw error
      if (!gewijzigd || gewijzigd.length === 0) {
        setMelding({ soort: 'fout', tekst: 'Niet verwijderd — er is niets aangepast. Waarschijnlijk staat de deelname al uit, of mag je hem niet wijzigen.' })
        return
      }

      setAssignedClients(assignedClients.filter(id => id !== clientId))
      loadChallengeClients()
      setMelding({ soort: 'goed', tekst: 'Deelname beëindigd.' })
      
    } catch (error) {
      console.error('Error removing challenge:', error)
      setMelding({ soort: 'fout', tekst: `Verwijderen mislukt — ${error.message}` })
    }
    setAssignLoading(false)
  }

  // MONITOR FUNCTIONS
  async function loadChallengeClients() {
    try {
      // Geen filter op challenge_type meer: die stond hard op '8week' en liet
      // daarmee de 6-weken 80/20-challenge onzichtbaar. Wel dezelfde naloop
      // van twee weken als het deelnemersoverzicht, zodat beide lijsten over
      // dezelfde mensen gaan.
      const grens = new Date()
      grens.setDate(grens.getDate() - 14)

      const { data: assignments } = await db.supabase
        .from('challenge_assignments')
        .select('client_id, start_date, end_date, is_paused, clients(id, first_name, last_name, email)')
        .eq('is_active', true)
        .gte('end_date', grens.toISOString().slice(0, 10))

      if (assignments && assignments.length > 0) {
        // De naam uit de deelname zelf halen en alleen terugvallen op de
        // clients-prop. Die prop is de lijst van de ingelogde coach; stond een
        // deelnemer daar niet in, dan verdween hij hier stilzwijgend.
        const clientsWithDates = assignments.map(assignment => {
          const uitProp = clients?.find(c => c.id === assignment.client_id)
          const basis = uitProp || assignment.clients
          if (!basis) return null
          return {
            ...basis,
            id: assignment.client_id,
            challengeStart: assignment.start_date,
            challengeEnd: assignment.end_date,
            isPaused: assignment.is_paused
          }
        }).filter(Boolean)
        
        setChallengeClients(clientsWithDates)
        
        if (clientsWithDates.length > 0 && !selectedClient) {
          setSelectedClient(clientsWithDates[0])
        }
      } else {
        setChallengeClients([])
      }
    } catch (error) {
      console.error('Error loading challenge clients:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadClientChallengeData() {
    if (!selectedClient) return
    
    try {
      const { data: assignment } = await db.supabase
        .from('challenge_assignments')
        .select('*')
        .eq('client_id', selectedClient.id)
        .eq('is_active', true)
        .single()

      if (assignment) {
        const startDate = new Date(assignment.start_date)
        const today = new Date()
        const daysSinceStart = Math.floor((today - startDate) / (1000 * 60 * 60 * 24))
        const currentWeek = Math.min(8, Math.floor(daysSinceStart / 7) + 1)
        
        setChallengeData({
          ...assignment,
          currentWeek,
          dayNumber: daysSinceStart + 1,
          totalDays: 56
        })
        
        // 🔥 FIX 2: Force banner refresh when challenge data updates
        setRefreshKey(prev => prev + 1)
        console.log('🔄 Challenge data refreshed, banner will update')
      }
    } catch (error) {
      console.error('Error loading challenge data:', error)
    }
  }

  async function handleRefresh() {
    setRefreshing(true)
    await loadClientChallengeData()
    setTimeout(() => setRefreshing(false), 500)
  }

  // PAUSE/RESUME FUNCTIONS
  async function handlePauseToggle() {
    if (!challengeData) return
    
    const isPaused = challengeData.is_paused
    
    setPauseLoading(true)
    
    try {
      if (isPaused) {
        // RESUME
        if (!confirm(`Challenge hervatten voor ${selectedClient.first_name}?\n\nDe einddatum wordt automatisch verlengd met het aantal gepauzeerde dagen.`)) {
          setPauseLoading(false)
          return
        }
        await db.resumeChallenge(challengeData.id)
        alert('✅ Challenge hervat!')
      } else {
        // PAUSE
        const reason = prompt(`Waarom pauzeer je de challenge voor ${selectedClient.first_name}?`, 'Client ziek')
        if (!reason) {
          setPauseLoading(false)
          return
        }
        const currentUser = await db.getCurrentUser()
        const coachName = currentUser?.email || 'Coach'
        await db.pauseChallenge(challengeData.id, reason, coachName)
        alert('⏸️ Challenge gepauzeerd')
      }
      
      await loadClientChallengeData()
      await loadChallengeClients()
      
    } catch (error) {
      console.error('Error toggling pause:', error)
      alert('❌ Error: ' + error.message)
    } finally {
      setPauseLoading(false)
    }
  }

  // VIEW TABS - MET ACTIVITY TOEGEVOEGD
  const viewTabs = [
    { id: 'overview', label: 'Overview', icon: '📊', color: '#3b82f6' },
    { id: 'goals', label: 'Goals', icon: Target, color: '#10b981' },
    { id: 'workouts', label: 'Workouts', icon: '💪', color: '#f97316' },
    { id: 'meals', label: 'Meals', icon: '🍽️', color: '#10b981' },
    { id: 'weight', label: 'Weight', icon: '⚖️', color: '#a855f7' },
    { id: 'photos', label: 'Photos', icon: '📸', color: '#ec4899' },
    { id: 'activity', label: 'Activity', icon: '⏱️', color: '#06b6d4' },
    { id: 'adjustments', label: 'Adjust', icon: '⚙️', color: '#ef4444' }
  ]

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px',
        color: 'rgba(255, 255, 255, 0.6)'
      }}>
        Loading challenge data...
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      padding: isMobile ? '1rem' : '2rem'
    }}>
      {/* Assignment Widget Toggle */}
      <button
        onClick={() => setShowAssignment(!showAssignment)}
        style={{
          marginBottom: '1.5rem',
          padding: isMobile ? '0.875rem 1.25rem' : '1rem 1.5rem',
          background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
          border: '1px solid rgba(220, 38, 38, 0.3)',
          borderRadius: '12px',
          color: '#fff',
          fontSize: isMobile ? '0.9rem' : '1rem',
          fontWeight: '600',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          minHeight: '44px',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
          transition: 'all 0.3s ease',
          boxShadow: '0 4px 15px rgba(220, 38, 38, 0.3)'
        }}
      >
        <Trophy size={20} />
        <span>Assign Challenge to Client</span>
        <ChevronDown 
          size={18} 
          style={{
            marginLeft: 'auto',
            transform: showAssignment ? 'rotate(180deg)' : 'rotate(0)',
            transition: 'transform 0.3s ease'
          }}
        />
      </button>

      {/* Assignment Widget */}
      {showAssignment && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.1) 0%, rgba(153, 27, 27, 0.05) 100%)',
          border: '1px solid rgba(220, 38, 38, 0.2)',
          borderRadius: '16px',
          padding: isMobile ? '1.25rem' : '1.5rem',
          marginBottom: '2rem',
          animation: 'slideDown 0.3s ease'
        }}>
          <h3 style={{
            fontSize: isMobile ? '1rem' : '1.1rem',
            fontWeight: '700',
            color: '#fff',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Users size={20} color="#dc2626" />
            Available Clients
          </h3>

          {melding && (
            <div style={{
              marginBottom: '1rem', padding: '0.65rem 0.85rem', borderRadius: 10,
              fontSize: '0.85rem', fontWeight: 700,
              background: melding.soort === 'goed' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
              border: `1px solid ${melding.soort === 'goed' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
              color: melding.soort === 'goed' ? '#10b981' : '#ef4444',
            }}>
              {melding.tekst}
            </div>
          )}

          {/* Wat je toewijst, vóór de knoppen: de looptijd verschilt per soort
              en de einddatum volgt eruit. */}
          <div style={{
            display: 'flex', gap: '0.75rem', flexWrap: 'wrap',
            marginBottom: '1.25rem', alignItems: 'flex-end'
          }}>
            <label style={{ flex: isMobile ? '1 1 100%' : '1 1 240px' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)', marginBottom: 5 }}>
                Challenge
              </div>
              <select
                value={soort}
                onChange={(e) => setSoort(e.target.value)}
                style={{
                  width: '100%', padding: '0.65rem 0.8rem', minHeight: 42,
                  background: 'rgba(17,17,17,0.6)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 10, color: '#fff', fontSize: '0.88rem', fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {SOORTEN.map(s => (
                  <option key={s.key} value={s.key}>{s.naam} · {s.dagen} dagen</option>
                ))}
              </select>
            </label>
            <label style={{ flex: isMobile ? '1 1 100%' : '0 0 190px' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)', marginBottom: 5 }}>
                Startdatum
              </div>
              <input
                type="date"
                value={startDatum}
                onChange={(e) => setStartDatum(e.target.value)}
                style={{
                  width: '100%', padding: '0.65rem 0.8rem', minHeight: 42,
                  background: 'rgba(17,17,17,0.6)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 10, color: '#fff', fontSize: '0.88rem', fontWeight: 600
                }}
              />
            </label>
          </div>

          {clients.length === 0 ? (
            <p style={{
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: '0.9rem',
              textAlign: 'center',
              padding: '2rem'
            }}>
              No clients available
            </p>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '1rem'
            }}>
              {clients.map(client => {
                const isAssigned = assignedClients.includes(client.id)
                
                return (
                  <div
                    key={client.id}
                    style={{
                      background: 'rgba(17, 17, 17, 0.5)',
                      border: `1px solid ${isAssigned ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
                      borderRadius: '12px',
                      padding: '1rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '1rem'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '0.95rem',
                        fontWeight: '600',
                        color: '#fff',
                        marginBottom: '0.25rem'
                      }}>
                        {client.first_name} {client.last_name}
                      </div>
                      <div style={{
                        fontSize: '0.8rem',
                        color: 'rgba(255, 255, 255, 0.5)'
                      }}>
                        {client.email}
                      </div>
                    </div>

                    {isAssigned ? (
                      <button
                        onClick={() => removeChallenge(client.id)}
                        disabled={assignLoading}
                        style={{
                          padding: '0.5rem 1rem',
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          borderRadius: '8px',
                          color: '#ef4444',
                          fontSize: '0.85rem',
                          fontWeight: '500',
                          cursor: assignLoading ? 'wait' : 'pointer',
                          minHeight: '36px',
                          touchAction: 'manipulation',
                          WebkitTapHighlightColor: 'transparent',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        Remove
                      </button>
                    ) : (
                      <button
                        onClick={() => assignChallenge(client.id)}
                        disabled={assignLoading}
                        style={{
                          padding: '0.5rem 1rem',
                          background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                          border: '1px solid rgba(220, 38, 38, 0.3)',
                          borderRadius: '8px',
                          color: '#fff',
                          fontSize: '0.85rem',
                          fontWeight: '500',
                          cursor: assignLoading ? 'wait' : 'pointer',
                          minHeight: '36px',
                          touchAction: 'manipulation',
                          WebkitTapHighlightColor: 'transparent',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        Assign
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Deelnemersoverzicht — staat vóór de "geen actieve challenge"-gate en
          buiten de klantkiezer. Die gate kijkt naar challenge_type '8week' én
          naar de klanten die in de huidige lijst staan; het overzicht laadt
          zijn eigen deelnemers en moet ook te zien zijn als die gate dichtslaat.
          Anders is de tab onbereikbaar precies wanneer je 'm nodig hebt. */}
      <ChallengeDeelnemers
        db={db}
        isMobile={isMobile}
        onSelectClient={(clientId) => {
          const k = challengeClients.find(c => c.id === clientId)
          if (k) { setSelectedClient(k); setActiveView('overview') }
        }}
      />

      {/* Challenge Monitor. Bij nul deelnemers hier niets tonen: het
          deelnemersoverzicht hierboven zegt al dat er niemand meedoet, en
          twee lege meldingen onder elkaar leest als een storing. */}
      {challengeClients.length === 0 ? null : (
        <>
          {/* Client Selector + Controls */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.1) 0%, rgba(153, 27, 27, 0.05) 100%)',
            border: '1px solid rgba(220, 38, 38, 0.2)',
            borderRadius: '16px',
            padding: isMobile ? '1.25rem' : '1.5rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              display: 'flex',
              gap: isMobile ? '0.75rem' : '1rem',
              alignItems: 'center',
              flexWrap: 'wrap'
            }}>
              <div style={{ position: 'relative', flex: isMobile ? '1 1 100%' : '1' }}>
                <select
                  value={selectedClient?.id || ''}
                  onChange={(e) => {
                    const client = challengeClients.find(c => c.id === e.target.value)
                    setSelectedClient(client)
                  }}
                  style={{
                    width: '100%',
                    padding: isMobile ? '0.875rem 2.5rem 0.875rem 1rem' : '1rem 2.5rem 1rem 1.25rem',
                    background: 'rgba(17, 17, 17, 0.5)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: isMobile ? '0.9rem' : '1rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    appearance: 'none',
                    minHeight: '44px',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent'
                  }}
                >
                  {challengeClients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.first_name} {client.last_name}
                      {client.isPaused ? ' (Paused)' : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown 
                  size={20} 
                  color="rgba(255, 255, 255, 0.5)"
                  style={{
                    position: 'absolute',
                    right: '0.875rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none'
                  }}
                />
              </div>

              {/* PAUSE/RESUME BUTTON */}
              <button
                onClick={handlePauseToggle}
                disabled={pauseLoading}
                style={{
                  padding: isMobile ? '0.75rem' : '0.75rem 1rem',
                  background: challengeData?.is_paused
                    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                    : 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                  border: `1px solid ${challengeData?.is_paused ? 'rgba(16, 185, 129, 0.3)' : 'rgba(249, 115, 22, 0.3)'}`,
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: isMobile ? '0.85rem' : '0.9rem',
                  fontWeight: '600',
                  cursor: pauseLoading ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  minHeight: '44px',
                  opacity: pauseLoading ? 0.5 : 1,
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  transition: 'all 0.3s ease',
                  whiteSpace: 'nowrap'
                }}
              >
                {challengeData?.is_paused ? (
                  <>
                    <Play size={16} />
                    {!isMobile && 'Resume'}
                  </>
                ) : (
                  <>
                    <Pause size={16} />
                    {!isMobile && 'Pause'}
                  </>
                )}
              </button>

              <button
                onClick={handleRefresh}
                disabled={refreshing}
                style={{
                  padding: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  color: '#fff',
                  cursor: refreshing ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '44px',
                  minHeight: '44px',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent'
                }}
              >
                <RefreshCw 
                  size={18} 
                  color="rgba(255, 255, 255, 0.7)"
                  style={{
                    animation: refreshing ? 'spin 1s linear infinite' : 'none'
                  }}
                />
              </button>
            </div>

            {selectedClient && challengeData && (
              <div style={{
                display: 'flex',
                gap: '1rem',
                marginTop: '1rem',
                paddingTop: '1rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                fontSize: isMobile ? '0.8rem' : '0.85rem',
                color: 'rgba(255, 255, 255, 0.6)',
                flexWrap: 'wrap'
              }}>
                <span>Week {challengeData.currentWeek}/8</span>
                <span>•</span>
                <span>Day {challengeData.dayNumber}/56</span>
                <span>•</span>
                <span>Started: {new Date(challengeData.start_date).toLocaleDateString()}</span>
                {challengeData.is_paused && challengeData.pause_reason && (
                  <>
                    <span>•</span>
                    <span style={{ color: '#f97316' }}>
                      Reden: {challengeData.pause_reason}
                    </span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* View Tabs */}
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            marginBottom: '1.5rem',
            overflowX: 'auto',
            paddingBottom: '0.5rem'
          }}>
            {viewTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id)}
                style={{
                  padding: isMobile ? '0.75rem 1rem' : '0.875rem 1.25rem',
                  background: activeView === tab.id
                    ? `linear-gradient(135deg, ${tab.color} 0%, ${tab.color}dd 100%)`
                    : 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid ${activeView === tab.id ? tab.color : 'rgba(255, 255, 255, 0.1)'}`,
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: isMobile ? '0.85rem' : '0.9rem',
                  fontWeight: activeView === tab.id ? '600' : '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  whiteSpace: 'nowrap',
                  minHeight: '44px',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  transition: 'all 0.3s ease'
                }}
              >
                <span style={{ fontSize: '1rem' }}>
                  {typeof tab.icon === 'string' ? tab.icon : <tab.icon size={16} />}
                </span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* RENDER ALLE VIEW COMPONENTS */}
          {selectedClient && (
            <>
              {activeView === 'overview' && (
                <ChallengeBanner
                  client={selectedClient}
                  db={db}
                  isCoachView={true}
                  refreshKey={refreshKey}
                />
              )}
              
              {activeView === 'goals' && (
                <ChallengeGoalManager 
                  db={db}
                  client={selectedClient}
                />
              )}
              
              {activeView === 'workouts' && (
                <WorkoutProgressView 
                  client={selectedClient}
                  db={db}
                  challengeData={challengeData}
                />
              )}
              
              {activeView === 'meals' && (
                <MealProgressView 
                  client={selectedClient}
                  db={db}
                  challengeData={challengeData}
                />
              )}
              
              {activeView === 'weight' && (
                <WeightProgressView 
                  client={selectedClient}
                  db={db}
                  challengeData={challengeData}
                />
              )}
              
              {activeView === 'photos' && (
                <PhotoProgressView 
                  client={selectedClient}
                  db={db}
                  challengeData={challengeData}
                />
              )}
              
              {activeView === 'activity' && (
                <LastActivityView 
                  client={selectedClient}
                  db={db}
                  challengeData={challengeData}
                />
              )}
              
              {activeView === 'adjustments' && (
                <ChallengeAdjustments 
                  client={selectedClient}
                  db={db}
                  challengeData={challengeData}
                  onDataUpdate={loadClientChallengeData}  // 🔥 FIX 4: Callback to refresh
                />
              )}
            </>
          )}
        </>
      )}

      <style>{`
        @keyframes slideDown {
          from { 
            opacity: 0; 
            transform: translateY(-10px);
          }
          to { 
            opacity: 1; 
            transform: translateY(0);
          }
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
