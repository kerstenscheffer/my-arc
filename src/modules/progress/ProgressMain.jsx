// src/modules/progress/ProgressMain.jsx
// v6.2 - overflow hidden fix

import React, { useState, useEffect } from 'react'
import { Loader2, Scale, Camera } from 'lucide-react'

import ProgressPhotos from '../progress-photos/ProgressPhotos'
import WeightTrackerService from '../weight-tracker/WeightTrackerService'
import WeightProgressRing from '../weight-tracker/components/WeightProgressRing'
import WeightStatsGrid from '../weight-tracker/components/WeightStatsGrid'
import WeightHistory from '../weight-tracker/components/WeightHistory'
import CircumferenceMeasurements from '../weight-tracker/components/CircumferenceMeasurements'
import RecentProgressPhotos from './components/RecentProgressPhotos'
import ProgressChallengeSidebar from '../../client/components/ProgressChallengeSidebar'
import PageVideoWidget from '../videos/PageVideoWidget'
import { useChallenge } from '../../hooks/useChallenge'

export default function ProgressMain({ db, client }) {
  const [weightService] = useState(() => new WeightTrackerService(db))
  const { isInChallenge, challengeData } = useChallenge(db, client?.id)
  const [activeTab, setActiveTab] = useState('weight')
  const [weight, setWeight] = useState(70.0)
  const [weightStats, setWeightStats] = useState(null)
  const [fridayData, setFridayData] = useState(null)
  const [weightHistory, setWeightHistory] = useState([])
  const [todayEntry, setTodayEntry] = useState(null)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState(null)
  const [photoCount, setPhotoCount] = useState(0)
  const [recentPhotos, setRecentPhotos] = useState([])
  const [todayData, setTodayData] = useState({})
  
  const isMobile = window.innerWidth <= 768
  const today = new Date()
  const isFriday = today.getDay() === 5
  const dateString = today.toISOString().split('T')[0]

  useEffect(() => { if (client?.id) loadAllData() }, [client?.id])

  const loadAllData = async () => {
    if (!client?.id) return
    setLoading(true)
    try {
      const [stats, friday, history, entry, photos, recent] = await Promise.all([
        weightService.getWeightStats(client.id),
        weightService.getFridayCompliance(client.id),
        weightService.getWeightHistory(client.id, 56),
        weightService.getTodayEntry(client.id),
        getPhotoCount(client.id),
        getRecentPhotos(client.id)
      ])
      setWeightStats(stats || {}); setFridayData(friday || {}); setWeightHistory(history || [])
      setTodayEntry(entry); setPhotoCount(photos); setRecentPhotos(recent || [])
      const tp = recent.filter(p => p.photo_date === dateString)
      const counts = { progress: 0, meal: 0, workout: 0, victory: 0, total: 0 }
      tp.forEach(p => { const c = p.metadata?.category || 'progress'; counts[c] = (counts[c]||0)+1; counts.total++ })
      setTodayData({ photos: tp, counts })
      if (stats?.current) setWeight(stats.current)
      else if (client?.current_weight) setWeight(client.current_weight)
    } catch (e) { console.error('Error:', e); showMessage('Fout bij laden', 'error') }
    finally { setLoading(false) }
  }

  const getPhotoCount = async (id) => {
    try { const { data } = await db.supabase.from('ch8_progress_photos').select('id').eq('client_id', id); return data?.length || 0 }
    catch { return 0 }
  }

  const getRecentPhotos = async (id) => {
    try { const { data } = await db.supabase.from('ch8_progress_photos').select('*').eq('client_id', id).order('created_at', { ascending: false }).limit(20); return data || [] }
    catch { return [] }
  }

  const handlePhotoUpload = async (file, photoType) => {
    try {
      const PSS = (await import('../progress-photos/ProgressPhotosService')).default
      const svc = new PSS(db)
      const metadata = {}
      if (photoType === 'progress') {
        const sub = prompt('Is dit een FRONT of SIDE foto?', 'front')?.toLowerCase()
        if (!['front','side'].includes(sub)) { showMessage('Kies front of side', 'error'); return }
        metadata.subtype = sub
      }
      await svc.uploadPhoto(client.id, file, photoType, metadata)
      showMessage({ progress:'Progressie foto geupload!', meal:'Maaltijd foto vastgelegd!', workout:'Workout vastgelegd!', victory:'Overwinning opgeslagen!' }[photoType] || 'Foto geupload!')
      await loadAllData()
    } catch { showMessage('Upload mislukt', 'error') }
  }

  const handleSaveWeight = async () => {
    if (!weight || weight <= 0 || weight > 300) { showMessage('Geldig gewicht (1-300 kg)', 'error'); return }
    setSaving(true)
    try { await weightService.saveWeight(client.id, weight, dateString); showMessage('Gewicht opgeslagen!'); await loadAllData() }
    catch { showMessage('Fout bij opslaan', 'error') }
    finally { setSaving(false) }
  }

  const showMessage = (text, type = 'success') => { setMessage({ text, type }); setTimeout(() => setMessage(null), 3000) }

  const progressPercent = weightStats?.current && client?.target_weight
    ? Math.round((weightStats.current / parseFloat(client.target_weight)) * 100) : 0

  if (loading) {
    return (
      <div style={{ minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={24} color="#FFD700" style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', position: 'relative', overflow: 'hidden' }}>
      {isInChallenge && challengeData && <ProgressChallengeSidebar challengeData={challengeData} isMobile={isMobile} />}

      {/* Toast */}
      {message && (
        <div style={{
          position: 'fixed', top: isMobile ? '12px' : '20px',
          left: '50%', transform: 'translateX(-50%)',
          padding: isMobile ? '0.5rem 0.875rem' : '0.625rem 1rem',
          background: message.type === 'error'
            ? 'linear-gradient(135deg, rgba(220,38,38,0.92) 0%, rgba(153,27,27,0.92) 100%)'
            : 'linear-gradient(135deg, rgba(16,185,129,0.92) 0%, rgba(5,150,105,0.92) 100%)',
          backdropFilter: 'blur(12px)', borderRadius: '8px',
          border: message.type === 'error' ? '1px solid rgba(220,38,38,0.3)' : '1px solid rgba(16,185,129,0.3)',
          color: '#fff', display: 'flex', alignItems: 'center', gap: '0.35rem',
          zIndex: 2000, fontSize: isMobile ? '0.75rem' : '0.8rem', fontWeight: '700',
          animation: 'slideDown 0.3s ease', boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
        }}>
          {message.text}
        </div>
      )}

      {/* ═══ ZONE 1: FRIDAY ALERT ═══ */}
      {isFriday && !todayEntry && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: isMobile ? '0.5rem' : '0.625rem',
          padding: isMobile ? '0.4rem 1rem' : '0.5rem 1.5rem',
          background: 'rgba(139, 92, 246, 0.06)',
          borderBottom: '1px solid rgba(139, 92, 246, 0.1)'
        }}>
          <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#8b5cf6', animation: 'pulse 2s infinite', flexShrink: 0 }} />
          <span style={{ fontSize: isMobile ? '0.6rem' : '0.65rem', fontWeight: '700', color: '#8b5cf6', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            Vrijdag weegmoment vereist
          </span>
        </div>
      )}

      {/* ═══ ZONE 2: HERO — Ring + Picker + Save ═══ */}
      <WeightProgressRing
        weight={weight} onWeightChange={setWeight} onSave={handleSaveWeight}
        saving={saving} todayEntry={todayEntry} progressPercent={progressPercent}
        isFriday={isFriday} isMobile={isMobile}
        targetWeight={parseFloat(client?.target_weight) || 75}
      />

      {/* ═══ ZONE 3: TAB BAR ═══ */}
      <div style={{
        display: 'flex', background: '#000',
        borderTop: '4px solid rgba(255,255,255,0.02)',
        borderBottom: '1px solid rgba(255,255,255,0.06)'
      }}>
        <button onClick={() => setActiveTab('weight')} style={{
          flex: 1, background: 'transparent', border: 'none',
          borderBottom: activeTab === 'weight' ? '2px solid #FFD700' : '2px solid transparent',
          borderRight: '1px solid rgba(255,255,255,0.04)', borderRadius: 0,
          padding: isMobile ? '0.5rem 0' : '0.6rem 0',
          color: activeTab === 'weight' ? '#FFD700' : 'rgba(255,255,255,0.3)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: '36px',
          fontSize: isMobile ? '0.6rem' : '0.65rem',
          fontWeight: activeTab === 'weight' ? '700' : '600',
          textTransform: 'uppercase', letterSpacing: '0.05em'
        }}>
          <Scale size={isMobile ? 12 : 13} />
          Gewicht
          {todayEntry && <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#10b981' }} />}
        </button>

        <button onClick={() => setActiveTab('photos')} style={{
          flex: 1, background: 'transparent', border: 'none',
          borderBottom: activeTab === 'photos' ? '2px solid #FFD700' : '2px solid transparent',
          borderRadius: 0, padding: isMobile ? '0.5rem 0' : '0.6rem 0',
          color: activeTab === 'photos' ? '#FFD700' : 'rgba(255,255,255,0.3)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: '36px',
          fontSize: isMobile ? '0.6rem' : '0.65rem',
          fontWeight: activeTab === 'photos' ? '700' : '600',
          textTransform: 'uppercase', letterSpacing: '0.05em'
        }}>
          <Camera size={isMobile ? 12 : 13} />
          Foto's
          {photoCount > 0 && <span style={{ fontSize: '0.5rem', fontWeight: '700', color: 'rgba(255,215,0,0.4)' }}>{photoCount}</span>}
        </button>
      </div>

      {/* ═══ ZONE 4: CONTENT ═══ */}
      {activeTab === 'weight' && (
        <>
          <WeightHistory history={weightHistory} isMobile={isMobile} maxItems={14} />
          <WeightStatsGrid stats={weightStats} client={client} fridayData={fridayData} history={weightHistory} isMobile={isMobile} />
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
            <CircumferenceMeasurements weightService={weightService} clientId={client?.id} isMobile={isMobile} onSave={loadAllData} />
          </div>
        </>
      )}

      {activeTab === 'photos' && (
        <>
          <RecentProgressPhotos photos={recentPhotos} onUpload={handlePhotoUpload} todayData={todayData} isFriday={isFriday} isMobile={isMobile} />
          <ProgressPhotos db={db} client={client} />
        </>
      )}

      <PageVideoWidget client={client} db={db} pageContext="tracking" />

      <style>{`
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes slideDown { from { opacity:0; transform:translate(-50%,-20px); } to { opacity:1; transform:translate(-50%,0); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
      `}</style>
    </div>
  )
}
