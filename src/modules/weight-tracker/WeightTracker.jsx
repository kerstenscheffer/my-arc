// src/modules/weight-tracker/WeightTracker.jsx
// v3.0 AINextMeal DNA — flush container, components stack with borderBottom dividers
// Props IDENTIEK: { client, db }

import React, { useState, useEffect, useCallback } from 'react'
import { Check, AlertCircle, Loader2 } from 'lucide-react'
import WeightTrackerService from './WeightTrackerService'

import WeightHeader from './components/WeightHeader'
import FridayAlert from './components/FridayAlert'
import WeightProgressRing from './components/WeightProgressRing'
import WeightStatsGrid from './components/WeightStatsGrid'
import WeightHistory from './components/WeightHistory'

export default function WeightTracker({ client, db }) {
  const isMobile = window.innerWidth <= 768
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [weight, setWeight] = useState(70)
  const [history, setHistory] = useState([])
  const [stats, setStats] = useState(null)
  const [fridayData, setFridayData] = useState(null)
  const [todayEntry, setTodayEntry] = useState(null)
  const [coachingPlan, setCoachingPlan] = useState(null)
  const [message, setMessage] = useState(null)
  
  const service = new WeightTrackerService(db)
  const today = new Date()
  const isFriday = today.getDay() === 5
  const dateString = today.toISOString().split('T')[0]
  
  const loadData = useCallback(async () => {
    if (!client?.id) return
    setLoading(true)
    try {
      const [h, s, c, t, plan] = await Promise.all([
        service.getWeightHistory(client.id, 56),
        service.getWeightStats(client.id),
        service.getFridayCompliance(client.id),
        service.getTodayEntry(client.id),
        service.getCoachingPlan(client.id),
      ])
      setHistory(h || []); setStats(s || {}); setFridayData(c || {}); setTodayEntry(t); setCoachingPlan(plan)
      if (s?.current) setWeight(s.current)
      else if (client?.current_weight) setWeight(client.current_weight)
    } catch (e) {
      console.error('Error loading data:', e)
      showMessage('Fout bij laden', 'error')
    } finally { setLoading(false) }
  }, [client?.id])
  
  useEffect(() => { loadData() }, [loadData])
  
  const showMessage = (text, type = 'success') => {
    setMessage({ text, type }); setTimeout(() => setMessage(null), 3000)
  }
  
  const handleSave = async () => {
    if (!client?.id || saving) return
    setSaving(true)
    try {
      const result = await service.saveWeight(client.id, weight, dateString)
      if (result.success) {
        showMessage(result.isFriday ? 'Vrijdag weging opgeslagen!' : 'Gewicht opgeslagen!')
        await loadData()
      } else showMessage('Opslaan mislukt', 'error')
    } catch (e) { showMessage('Fout bij opslaan', 'error') }
    finally { setSaving(false) }
  }
  
  const progressPercent = React.useMemo(() => {
    if (!stats?.current || !client?.target_weight) return 0
    const cur = parseFloat(stats.current), tar = parseFloat(client.target_weight)
    const start = client?.start_weight ? parseFloat(client.start_weight) : cur
    if (start === cur) return 0
    return Math.min(100, Math.max(0, (Math.abs(cur - start) / Math.abs(tar - start)) * 100))
  }, [stats?.current, client?.target_weight, client?.start_weight])
  
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} color="#FFD700" />
      </div>
    )
  }
  
  return (
    <div style={{ paddingBottom: isMobile ? '100px' : '2rem' }}>
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
          {message.type === 'error' ? <AlertCircle size={13} /> : <Check size={13} />}
          {message.text}
        </div>
      )}
      
      {/* All components stack flush — dividers handled by each component */}
      <WeightHeader fridayData={fridayData} isMobile={isMobile} />
      <FridayAlert isFriday={isFriday} todayEntry={todayEntry} isMobile={isMobile} />
      <WeightProgressRing 
        weight={weight} onWeightChange={setWeight} onSave={handleSave}
        saving={saving} todayEntry={todayEntry} progressPercent={progressPercent}
        isFriday={isFriday} isMobile={isMobile}
        targetWeight={parseFloat(client?.target_weight) || 75}
      />
      <WeightStatsGrid stats={stats} client={client} fridayData={fridayData} history={history} isMobile={isMobile} coachingPlan={coachingPlan} />
      <WeightHistory history={history} isMobile={isMobile} maxItems={14} />
      
      <style>{`
        @keyframes slideDown { from { opacity:0; transform:translate(-50%,-20px); } to { opacity:1; transform:translate(-50%,0); } }
        @keyframes spin { to { transform:rotate(360deg); } }
      `}</style>
    </div>
  )
}
