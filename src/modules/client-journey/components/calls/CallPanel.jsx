// ============================================
// FILE: src/modules/client-journey/components/calls/CallPanel.jsx
// Shows when clicking a blue call circle on timeline
// Week 1 → IntakeCallPanel | Week 2+ → Regular CallPanel
// ============================================
import React, { useState, useEffect, useCallback } from 'react'
import { CheckCircle, Circle, ChevronDown, ChevronRight, Save, Scale, Dumbbell, Utensils, FileText, TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react'
import IntakeCallPanel from './IntakeCallPanel'
import JourneyCallService from '../../JourneyCallService'

const G = {
  blue: '#3b82f6', green: '#10b981', gold: '#d4a853', red: '#ef4444',
  text: '#fff', textMuted: 'rgba(255,255,255,0.6)', textDim: 'rgba(255,255,255,0.3)',
  card: 'rgba(23,23,23,0.8)', border: 'rgba(59,130,246,0.2)', borderActive: 'rgba(59,130,246,0.4)',
}

const CAT_COLORS = {
  voeding: '#10b981', training: '#3b82f6', lifestyle: '#8b5cf6',
  mindset: '#d4a853', progressie: '#ec4899', app: '#06b6d4'
}

export default function CallPanel({ db, client, journey, weekNumber, totalWeeks, isMobile }) {
  // Week 1 = Intake Call (dedicated panel)
  if (weekNumber <= 1) {
    return <IntakeCallPanel db={db} client={client} journey={journey} weekNumber={weekNumber} totalWeeks={totalWeeks} isMobile={isMobile} />
  }

  return <RegularCallPanel db={db} client={client} journey={journey} weekNumber={weekNumber} totalWeeks={totalWeeks} isMobile={isMobile} />
}

function RegularCallPanel({ db, client, journey, weekNumber, totalWeeks, isMobile }) {
  const [callData, setCallData] = useState(null)
  const [template, setTemplate] = useState(null)
  const [prevCall, setPrevCall] = useState(null)
  const [preCallData, setPreCallData] = useState({})
  const [loading, setLoading] = useState(true)
  const [callNotes, setCallNotes] = useState('')
  const [prepNotes, setPrepNotes] = useState('')
  const [topicsCovered, setTopicsCovered] = useState([])
  const [expandedSection, setExpandedSection] = useState('checks')
  const [saving, setSaving] = useState(false)

  const svc = db?.supabase ? new JourneyCallService(db.supabase) : null

  const loadData = useCallback(async () => {
    if (!svc || !journey?.id) { setLoading(false); return }
    setLoading(true)
    try {
      // Get or create call for this week
      const call = await svc.getOrCreateClientCall(journey.id, client.id, journey.coach_id, weekNumber, totalWeeks)
      if (call) {
        setCallData(call)
        setCallNotes(call.call_notes || '')
        setPrepNotes(call.prep_notes || '')
        setTopicsCovered(call.topics_covered || [])
      }

      // Get template
      const tmpl = call?.template_id
        ? await svc.getTemplateForCallNumber(call.call_number)
        : await svc.getTemplateForWeek(weekNumber)
      setTemplate(tmpl)

      // Get previous call
      const prev = await svc.getPreviousCall(journey.id, weekNumber)
      setPrevCall(prev)

      // Get pre-call data
      const checks = await svc.getPreCallData(client.id, weekNumber, journey.start_date)
      setPreCallData(checks)
    } catch (e) {
      console.error('CallPanel load:', e)
    }
    setLoading(false)
  }, [journey?.id, client?.id, weekNumber])

  useEffect(() => { loadData() }, [loadData])

  // Auto-save notes with debounce
  useEffect(() => {
    if (!callData?.id || !svc) return
    const timer = setTimeout(async () => {
      setSaving(true)
      await svc.updateCallNotes(callData.id, { call_notes: callNotes, prep_notes: prepNotes })
      setSaving(false)
    }, 1000)
    return () => clearTimeout(timer)
  }, [callNotes, prepNotes])

  const handleToggleTopic = async (topicId) => {
    if (!callData?.id || !svc) return
    const updated = topicsCovered.includes(topicId)
      ? topicsCovered.filter(t => t !== topicId)
      : [...topicsCovered, topicId]
    setTopicsCovered(updated)
    await svc.updateCallNotes(callData.id, { topics_covered: updated })
  }

  const handleComplete = async () => {
    if (!callData?.id || !svc) return
    await svc.completeCall(callData.id, callNotes?.slice(0, 200), [])
    setCallData(prev => ({ ...prev, status: 'completed' }))
  }

  if (loading) return (
    <div style={{ padding: '1.5rem', textAlign: 'center' }}>
      <div style={{ width: '24px', height: '24px', border: `2px solid ${G.border}`, borderTop: `2px solid ${G.blue}`, borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  const topics = template?.topics || []
  const isCompleted = callData?.status === 'completed'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>

      {/* CALL HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
        <div>
          <p style={{ fontSize: '0.85rem', fontWeight: '700', color: G.text, margin: 0 }}>
            {template?.title || `Call Week ${weekNumber}`}
          </p>
          <p style={{ fontSize: '0.6rem', color: G.textMuted, margin: '0.1rem 0 0' }}>
            {template?.description || 'Wekelijkse coaching call'}
          </p>
        </div>
        {isCompleted ? (
          <span style={{ fontSize: '0.55rem', padding: '0.15rem 0.45rem', borderRadius: '6px', background: `${G.green}15`, color: G.green, fontWeight: '700' }}>AFGEROND</span>
        ) : (
          <button onClick={handleComplete} style={{
            padding: '0.3rem 0.6rem', borderRadius: '8px',
            background: `${G.green}12`, border: `1px solid ${G.green}30`,
            color: G.green, fontSize: '0.65rem', fontWeight: '600',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
          }}>
            <CheckCircle size={12} /> Afronden
          </button>
        )}
      </div>

      {/* PRE-CALL CHECKS */}
      <Section title="Pre-call check" icon={AlertCircle} color={G.gold}
        expanded={expandedSection === 'checks'} onToggle={() => setExpandedSection(expandedSection === 'checks' ? null : 'checks')} isMobile={isMobile}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          {/* Weight */}
          {preCallData.weight && (
            <CheckItem icon={Scale} label="Gewicht trend"
              value={preCallData.weight.change ? `${preCallData.weight.change > 0 ? '+' : ''}${preCallData.weight.change} kg` : 'Geen data'}
              sub={`${preCallData.weight.current || '?'} kg · ${preCallData.weight.entries} wegingen`}
              color={preCallData.weight.trend === 'down' ? G.green : preCallData.weight.trend === 'up' ? G.gold : G.textMuted}
              trendIcon={preCallData.weight.trend === 'down' ? TrendingDown : preCallData.weight.trend === 'up' ? TrendingUp : Minus}
            />
          )}
          {/* Workouts */}
          {preCallData.workouts && (
            <CheckItem icon={Dumbbell} label="Workouts"
              value={`${preCallData.workouts.completedThisWeek}/${preCallData.workouts.target}`}
              sub="deze week voltooid"
              color={preCallData.workouts.completedThisWeek >= preCallData.workouts.target ? G.green : preCallData.workouts.completedThisWeek > 0 ? G.gold : G.red}
            />
          )}
          {/* Meals */}
          {preCallData.meals && (
            <CheckItem icon={Utensils} label="Voeding tracking"
              value={`${preCallData.meals.daysTracked}/${preCallData.meals.target} dagen`}
              sub="bijgehouden"
              color={preCallData.meals.daysTracked >= 5 ? G.green : preCallData.meals.daysTracked >= 3 ? G.gold : G.red}
            />
          )}
          {!preCallData.weight && !preCallData.workouts && !preCallData.meals && (
            <p style={{ fontSize: '0.7rem', color: G.textDim, fontStyle: 'italic' }}>Geen data beschikbaar</p>
          )}
        </div>
      </Section>

      {/* TOPICS */}
      <Section title={`Onderwerpen (${topicsCovered.length}/${topics.length})`} icon={FileText} color={G.blue}
        expanded={expandedSection === 'topics'} onToggle={() => setExpandedSection(expandedSection === 'topics' ? null : 'topics')} isMobile={isMobile}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {topics.map(topic => {
            const covered = topicsCovered.includes(topic.id)
            const catColor = CAT_COLORS[topic.category] || G.blue
            return (
              <div key={topic.id} onClick={() => handleToggleTopic(topic.id)} style={{
                padding: '0.5rem 0.6rem', borderRadius: '8px',
                background: covered ? `${G.green}06` : 'rgba(255,255,255,0.02)',
                border: `1px solid ${covered ? `${G.green}25` : 'rgba(255,255,255,0.04)'}`,
                display: 'flex', alignItems: 'flex-start', gap: '0.4rem',
                cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                opacity: covered ? 0.7 : 1, transition: 'all 0.2s ease'
              }}>
                {covered ? <CheckCircle size={14} color={G.green} style={{ flexShrink: 0, marginTop: '0.05rem' }} />
                  : <Circle size={14} color={G.textDim} style={{ flexShrink: 0, marginTop: '0.05rem' }} />}
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '0.75rem', fontWeight: '600', color: covered ? G.textMuted : G.text, margin: 0, textDecoration: covered ? 'line-through' : 'none' }}>
                    {topic.title}
                  </p>
                  <p style={{ fontSize: '0.6rem', color: G.textDim, margin: '0.1rem 0 0' }}>{topic.description}</p>
                </div>
                <span style={{ fontSize: '0.45rem', padding: '0.08rem 0.25rem', borderRadius: '4px', background: `${catColor}12`, color: catColor, fontWeight: '700', textTransform: 'uppercase', flexShrink: 0 }}>
                  {topic.category}
                </span>
              </div>
            )
          })}
          {topics.length === 0 && (
            <p style={{ fontSize: '0.7rem', color: G.textDim, fontStyle: 'italic' }}>Geen onderwerpen voor deze call</p>
          )}
        </div>
      </Section>

      {/* PREVIOUS CALL NOTES */}
      {prevCall && (prevCall.call_notes || prevCall.summary) && (
        <Section title={`Vorige call (Week ${prevCall.week_number})`} icon={FileText} color="rgba(255,255,255,0.4)"
          expanded={expandedSection === 'prev'} onToggle={() => setExpandedSection(expandedSection === 'prev' ? null : 'prev')} isMobile={isMobile}>
          <div style={{
            padding: '0.5rem', borderRadius: '8px', background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.04)', whiteSpace: 'pre-wrap',
            fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5
          }}>
            {prevCall.summary || prevCall.call_notes || 'Geen notities'}
          </div>
          {prevCall.action_items && prevCall.action_items.length > 0 && (
            <div style={{ marginTop: '0.3rem' }}>
              <p style={{ fontSize: '0.55rem', color: G.gold, fontWeight: '700', margin: '0 0 0.2rem', textTransform: 'uppercase' }}>Actiepunten</p>
              {prevCall.action_items.map((item, i) => (
                <p key={i} style={{ fontSize: '0.7rem', color: item.completed ? G.green : G.textMuted, margin: '0.1rem 0', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  {item.completed ? <CheckCircle size={10} color={G.green} /> : <Circle size={10} color={G.textDim} />}
                  <span style={{ textDecoration: item.completed ? 'line-through' : 'none' }}>{item.text}</span>
                </p>
              ))}
            </div>
          )}
        </Section>
      )}

      {/* NEW NOTES */}
      <Section title="Notities" icon={FileText} color={G.blue}
        expanded={expandedSection === 'notes'} onToggle={() => setExpandedSection(expandedSection === 'notes' ? null : 'notes')} isMobile={isMobile}
        badge={saving ? 'Opslaan...' : callNotes ? 'Opgeslagen' : null}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {/* Prep notes */}
          <div>
            <p style={{ fontSize: '0.55rem', color: G.gold, fontWeight: '700', margin: '0 0 0.2rem', textTransform: 'uppercase' }}>Voorbereiding</p>
            <textarea value={prepNotes} onChange={e => setPrepNotes(e.target.value)} placeholder="Wat wil je bespreken? Observaties, zorgen..."
              style={textArea(isMobile)} rows={2} />
          </div>
          {/* Call notes */}
          <div>
            <p style={{ fontSize: '0.55rem', color: G.blue, fontWeight: '700', margin: '0 0 0.2rem', textTransform: 'uppercase' }}>Call notities</p>
            <textarea value={callNotes} onChange={e => setCallNotes(e.target.value)} placeholder="Notities tijdens/na de call..."
              style={textArea(isMobile)} rows={4} />
          </div>
        </div>
      </Section>
    </div>
  )
}

// ============================================
// SUB-COMPONENTS
// ============================================

function Section({ title, icon: Icon, color, expanded, onToggle, children, badge, isMobile }) {
  return (
    <div style={{
      borderRadius: '10px', background: 'rgba(255,255,255,0.02)',
      border: `1px solid ${expanded ? `${color}25` : 'rgba(255,255,255,0.04)'}`,
      overflow: 'hidden', transition: 'border-color 0.2s ease'
    }}>
      <div onClick={onToggle} style={{
        padding: isMobile ? '0.5rem 0.6rem' : '0.55rem 0.75rem',
        display: 'flex', alignItems: 'center', gap: '0.4rem',
        cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
      }}>
        <Icon size={13} color={color} />
        <span style={{ fontSize: '0.7rem', fontWeight: '700', color: G.text, flex: 1 }}>{title}</span>
        {badge && <span style={{ fontSize: '0.5rem', color: G.textDim }}>{badge}</span>}
        {expanded ? <ChevronDown size={12} color={G.textDim} /> : <ChevronRight size={12} color={G.textDim} />}
      </div>
      {expanded && (
        <div style={{ padding: isMobile ? '0 0.6rem 0.6rem' : '0 0.75rem 0.75rem' }}>
          {children}
        </div>
      )}
    </div>
  )
}

function CheckItem({ icon: Icon, label, value, sub, color, trendIcon: TrendIcon }) {
  return (
    <div style={{
      padding: '0.4rem 0.5rem', borderRadius: '8px',
      background: `${color}06`, border: `1px solid ${color}15`,
      display: 'flex', alignItems: 'center', gap: '0.5rem'
    }}>
      <Icon size={14} color={color} style={{ flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: '0.65rem', color: G.textMuted, margin: 0 }}>{label}</p>
      </div>
      <div style={{ textAlign: 'right' }}>
        <p style={{ fontSize: '0.8rem', fontWeight: '700', color, margin: 0, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
          {TrendIcon && <TrendIcon size={12} />} {value}
        </p>
        {sub && <p style={{ fontSize: '0.5rem', color: G.textDim, margin: 0 }}>{sub}</p>}
      </div>
    </div>
  )
}

const textArea = (m) => ({
  width: '100%', padding: '0.5rem', borderRadius: '8px',
  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
  color: '#fff', fontSize: m ? '0.75rem' : '0.8rem', resize: 'vertical',
  fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
  lineHeight: 1.5, minHeight: '40px'
})
