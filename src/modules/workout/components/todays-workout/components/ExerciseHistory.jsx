// src/modules/workout/components/todays-workout/components/ExerciseHistory.jsx
import { History, TrendingUp, ChevronDown } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function ExerciseHistory({ exerciseName, previousLog, loading, client, db, defaultExpanded = false, forceLoad = false }) {
  const isMobile = window.innerWidth <= 768
  const [expanded, setExpanded] = useState(defaultExpanded)
  const [fullHistory, setFullHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [historyLoaded, setHistoryLoaded] = useState(false)

  useEffect(() => {
    if ((expanded || forceLoad) && !historyLoaded && client?.id && db && exerciseName) {
      loadFullHistory()
    }
  }, [expanded, forceLoad])

  const loadFullHistory = async () => {
    if (!client?.id || !db || !exerciseName) return
    setLoadingHistory(true)
    try {
      const { data, error } = await db.supabase
        .from('workout_progress')
        .select(`sets, created_at, workout_sessions!inner(client_id)`)
        .eq('workout_sessions.client_id', client.id)
        .eq('exercise_name', exerciseName)
        .order('created_at', { ascending: false })
        .limit(20)
      if (error) throw error
      setFullHistory(data || [])
      setHistoryLoaded(true)
    } catch (error) {
      console.error('❌ Error loading full history:', error)
      setFullHistory([])
      setHistoryLoaded(true)
    } finally {
      setLoadingHistory(false)
    }
  }

  const getRelativeTime = (dateString) => {
    if (!dateString) return ''
    const diffDays = Math.floor((new Date() - new Date(dateString)) / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return 'Vandaag'
    if (diffDays === 1) return 'Gisteren'
    if (diffDays < 7) return `${diffDays} dagen geleden`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weken geleden`
    return `${Math.floor(diffDays / 30)} maanden geleden`
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
  }

  const formatSets = (sets) => {
    if (!sets || !Array.isArray(sets)) return 'Geen data'
    return sets.map(s => `${s.weight || 0}kg × ${s.reps || 0}`).join(', ')
  }

  const formatSetsCompact = (sets) => {
    if (!sets || !Array.isArray(sets)) return '-'
    const display = sets.slice(0, 3).map(s => `${s.weight || 0}×${s.reps || 0}`).join('  ')
    return sets.length > 3 ? `${display} +${sets.length - 3}` : display
  }

  const hasImprovement = (sets) => {
    if (!sets || sets.length < 2) return false
    return (sets[sets.length - 1].weight || 0) > (sets[0].weight || 0)
  }

  if (loading) {
    return (
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: isMobile ? '0.65rem 0' : '0.75rem 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '14px', height: '14px', border: '2px solid rgba(255,215,0,0.15)', borderTopColor: '#FFD700', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <span style={{ fontSize: isMobile ? '0.65rem' : '0.7rem', color: 'rgba(255,255,255,0.35)', fontWeight: '600' }}>Laden...</span>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  // forceLoad mode — toon direct de volledige history zonder previousLog nodig
  if (forceLoad) {
    return (
      <div style={{ padding: isMobile ? '0.75rem 1rem' : '0.875rem 1.25rem' }}>
        {loadingHistory && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem 0' }}>
            <div style={{ width: '14px', height: '14px', border: '2px solid rgba(255,215,0,0.15)', borderTopColor: '#FFD700', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', fontWeight: '600' }}>Laden...</span>
          </div>
        )}

        {!loadingHistory && historyLoaded && fullHistory.length === 0 && (
          <div style={{ textAlign: 'center', padding: '1rem 0', fontSize: isMobile ? '0.75rem' : '0.8rem', color: 'rgba(255,255,255,0.25)', fontWeight: '600', fontStyle: 'italic' }}>
            Geen eerdere sessies gevonden
          </div>
        )}

        {!loadingHistory && fullHistory.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr', gap: '0.5rem', paddingBottom: '0.375rem', marginBottom: '0.25rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ fontSize: '0.52rem', color: 'rgba(255,255,255,0.25)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Datum</span>
              <span style={{ fontSize: '0.52rem', color: 'rgba(255,255,255,0.25)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sets</span>
            </div>
            {fullHistory.map((log, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '60px 1fr', gap: '0.5rem', padding: '0.35rem 0', borderBottom: i < fullHistory.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', opacity: Math.max(0.45, 1 - i * 0.08) }}>
                <span style={{ fontSize: isMobile ? '0.65rem' : '0.7rem', color: i === 0 ? 'rgba(255,215,0,0.6)' : 'rgba(255,255,255,0.35)', fontWeight: '700' }}>
                  {formatDate(log.created_at)}
                </span>
                <span style={{ fontSize: isMobile ? '0.7rem' : '0.75rem', color: i === 0 ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.45)', fontWeight: '700', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {formatSetsCompact(log.sets)}
                </span>
              </div>
            ))}
          </div>
        )}
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (!previousLog) {
    return (
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: isMobile ? '0.55rem 0' : '0.65rem 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <History size={isMobile ? 13 : 14} color="rgba(255,255,255,0.2)" />
          <span style={{ fontSize: isMobile ? '0.65rem' : '0.7rem', color: 'rgba(255,255,255,0.3)', fontWeight: '600', fontStyle: 'italic' }}>
            Nog geen eerdere logs
          </span>
        </div>
      </div>
    )
  }

  const improved = hasImprovement(previousLog.sets)

  return (
    <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <div onClick={() => setExpanded(!expanded)} style={{ padding: isMobile ? '0.65rem 0' : '0.75rem 0', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.25rem' }}>
            <History size={isMobile ? 12 : 13} color="rgba(255,215,0,0.5)" />
            <span style={{ fontSize: isMobile ? '0.6rem' : '0.65rem', color: 'rgba(255,215,0,0.5)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>VORIGE LOG</span>
            {improved && <TrendingUp size={isMobile ? 11 : 12} color="rgba(255,215,0,0.5)" />}
          </div>
          <div style={{ fontSize: isMobile ? '0.78rem' : '0.85rem', color: 'rgba(255,255,255,0.8)', fontWeight: '700', fontFamily: 'monospace', lineHeight: 1.4 }}>{formatSets(previousLog.sets)}</div>
          <div style={{ fontSize: isMobile ? '0.58rem' : '0.62rem', color: 'rgba(255,255,255,0.3)', fontWeight: '600', marginTop: '0.1rem' }}>{getRelativeTime(previousLog.created_at)}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.1rem' }}>
          <span style={{ fontSize: isMobile ? '0.5rem' : '0.55rem', color: 'rgba(255,255,255,0.25)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Alles</span>
          <ChevronDown size={isMobile ? 14 : 16} color="rgba(255,255,255,0.2)" style={{ transition: 'transform 0.3s ease', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }} />
        </div>
      </div>

      <div style={{ maxHeight: expanded ? '400px' : '0px', overflow: 'hidden', transition: 'max-height 0.4s cubic-bezier(0.4,0,0.2,1)' }}>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: isMobile ? '0.5rem' : '0.625rem', paddingBottom: isMobile ? '0.5rem' : '0.625rem', maxHeight: '350px', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {loadingHistory && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.75rem 0', gap: '0.5rem' }}>
              <div style={{ width: '14px', height: '14px', border: '2px solid rgba(255,215,0,0.15)', borderTopColor: '#FFD700', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            </div>
          )}
          {!loadingHistory && fullHistory.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '55px 1fr', gap: '0.5rem', paddingBottom: '0.3rem', marginBottom: '0.25rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize: isMobile ? '0.5rem' : '0.55rem', color: 'rgba(255,255,255,0.25)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>DATUM</span>
                <span style={{ fontSize: isMobile ? '0.5rem' : '0.55rem', color: 'rgba(255,255,255,0.25)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>SETS</span>
              </div>
              {fullHistory.map((log, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '55px 1fr', gap: '0.5rem', padding: '0.3rem 0', borderBottom: i < fullHistory.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none', opacity: Math.max(0.45, 1 - i * 0.1) }}>
                  <span style={{ fontSize: isMobile ? '0.62rem' : '0.68rem', color: i === 0 ? 'rgba(255,215,0,0.6)' : 'rgba(255,255,255,0.35)', fontWeight: '700' }}>{formatDate(log.created_at)}</span>
                  <span style={{ fontSize: isMobile ? '0.68rem' : '0.73rem', color: i === 0 ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.45)', fontWeight: '700', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{formatSetsCompact(log.sets)}</span>
                </div>
              ))}
            </div>
          )}
          {!loadingHistory && historyLoaded && fullHistory.length === 0 && (
            <div style={{ textAlign: 'center', padding: '0.75rem 0', fontSize: isMobile ? '0.65rem' : '0.7rem', color: 'rgba(255,255,255,0.3)', fontWeight: '600', fontStyle: 'italic' }}>
              Geen eerdere logs gevonden
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
