// src/modules/productivity/components/reflections/ReflectionsHub.jsx
// VERSION 2.0 - STYLING GUIDE COMPLIANT + completed tasks history

import { useState, useEffect } from 'react'
import { Lightbulb, Clock, CheckCircle, Star, Calendar, ChevronDown, ChevronUp, Tag, Flag } from 'lucide-react'

const PRIORITY_CONFIG = {
  low:    { color: '#22c55e', label: 'Laag' },
  medium: { color: '#f59e0b', label: 'Med' },
  high:   { color: '#ef4444', label: 'Hoog' }
}

const CATEGORY_CONFIG = {
  werk:       { color: '#3b82f6', label: 'Werk' },
  prive:      { color: '#ec4899', label: 'Privé' },
  myarc:      { color: '#10b981', label: 'MY ARC' },
  gezondheid: { color: '#8b5cf6', label: 'Gezondheid' }
}

const FIELD_CONFIG = [
  { key: 'what_went_well', label: 'Wat ging goed?',      color: '#10b981' },
  { key: 'what_learned',   label: 'Wat geleerd?',        color: '#3b82f6' },
  { key: 'what_different', label: 'Wat anders gedaan?',  color: '#f59e0b' }
]

const renderStars = (rating) => (
  <div style={{ display: 'flex', gap: '2px' }}>
    {[1,2,3,4,5].map(i => (
      <Star key={i} size={11} fill={i <= rating ? '#f59e0b' : 'transparent'} color={i <= rating ? '#f59e0b' : 'rgba(255,255,255,0.15)'} />
    ))}
  </div>
)

export default function ReflectionsHub({ productivityService, coachId, isMobile, pendingReflections, onStartReflection }) {
  const [history, setHistory] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => { loadData() }, [productivityService, coachId])

  const loadData = async () => {
    try {
      setLoading(true)
      const [historyData, statsData] = await Promise.all([
        productivityService.getReflectionHistory(coachId, 50),
        productivityService.getReflectionStats(coachId)
      ])
      setHistory(historyData)
      setStats(statsData)
    } catch (error) {
      console.error('❌ Load reflections failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })

  if (loading) {
    return (
      <div style={{ minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '28px', height: '28px', border: '2px solid rgba(139,92,246,0.15)', borderTopColor: '#8b5cf6', borderRadius: '50%', animation: 'rhSpin 0.8s linear infinite' }} />
      </div>
    )
  }

  const visibleHistory = showAll ? history : history.slice(0, 6)

  return (
    <div style={{ transform: 'translateZ(0)' }}>

      {/* ═══ STATS STRIP ═══ */}
      {stats && (
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          {[
            { label: 'TOTAAL',      value: stats.total,                                         color: '#8b5cf6' },
            { label: 'GEM. RATING', value: stats.averageRating ? `${stats.averageRating}★` : '–', color: '#f59e0b' },
            { label: 'VOLTOOID',    value: stats.completed,                                      color: '#10b981' },
            { label: 'OVERGESLAGEN',value: stats.skipped,                                        color: 'rgba(255,255,255,0.2)' }
          ].map((stat, i, arr) => (
            <div key={stat.label} style={{ flex: 1, padding: '0.625rem 0.25rem', textAlign: 'center', borderRight: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
              <div style={{ fontSize: isMobile ? '1rem' : '1.1rem', fontWeight: '800', color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: '0.38rem', fontWeight: '700', color: 'rgba(255,255,255,0.15)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* ═══ WACHTEND OP REFLECTIE ═══ */}
      {pendingReflections.length > 0 && (
        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <div style={{ padding: isMobile ? '0.4rem 0.75rem' : '0.4rem 1rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Clock size={10} color="#8b5cf6" />
            <span style={{ fontSize: '0.5rem', fontWeight: '700', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>WACHTEN ({pendingReflections.length})</span>
          </div>
          {pendingReflections.map(task => {
            const priorityConfig = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium
            const categoryConfig = task.category ? CATEGORY_CONFIG[task.category] : null
            return (
              <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: isMobile ? '0.4rem 0.75rem' : '0.4rem 1rem', borderTop: '1px solid rgba(255,255,255,0.03)', borderLeft: '3px solid rgba(139,92,246,0.4)' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</div>
                  <div style={{ display: 'flex', gap: '0.25rem', marginTop: '2px' }}>
                    <span style={{ padding: '1px 4px', background: `${priorityConfig.color}12`, border: `1px solid ${priorityConfig.color}20`, borderRadius: '3px', fontSize: '0.45rem', fontWeight: '700', color: priorityConfig.color }}>
                      {priorityConfig.label}
                    </span>
                    {categoryConfig && (
                      <span style={{ padding: '1px 4px', background: `${categoryConfig.color}12`, border: `1px solid ${categoryConfig.color}20`, borderRadius: '3px', fontSize: '0.45rem', fontWeight: '600', color: categoryConfig.color }}>
                        {categoryConfig.label}
                      </span>
                    )}
                  </div>
                </div>
                <button onClick={() => onStartReflection(task)}
                  style={{ padding: '0.3rem 0.5rem', background: '#8b5cf6', border: 'none', borderRadius: '5px', color: '#fff', cursor: 'pointer', fontSize: '0.55rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '2px', minHeight: '28px', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', flexShrink: 0 }}>
                  <Lightbulb size={10} /> Reflecteer
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* ═══ GESCHIEDENIS ═══ */}
      <div>
        <div style={{ padding: isMobile ? '0.4rem 0.75rem' : '0.4rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <CheckCircle size={10} color="#10b981" />
          <span style={{ fontSize: '0.5rem', fontWeight: '700', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>GESCHIEDENIS ({history.length})</span>
        </div>

        {history.length === 0 ? (
          <div style={{ padding: '1.5rem 1rem', textAlign: 'center', color: 'rgba(255,255,255,0.15)', fontSize: '0.7rem' }}>
            Nog geen reflecties. Voltooi een task om te beginnen.
          </div>
        ) : (
          <>
            {visibleHistory.map(reflection => {
              const isExpanded = expandedId === reflection.id
              const hasContent = reflection.what_went_well || reflection.what_learned || reflection.what_different
              const taskTitle = reflection.task?.title || 'Task'

              return (
                <div key={reflection.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  {/* Reflection row */}
                  <div
                    onClick={() => hasContent && !reflection.skipped && setExpandedId(isExpanded ? null : reflection.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: isMobile ? '0.45rem 0.75rem' : '0.45rem 1rem', cursor: hasContent && !reflection.skipped ? 'pointer' : 'default', borderLeft: `3px solid ${reflection.skipped ? 'rgba(255,255,255,0.06)' : 'rgba(139,92,246,0.35)'}` }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: '700', color: reflection.skipped ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {taskTitle}
                      </div>
                      <div style={{ fontSize: '0.45rem', color: 'rgba(255,255,255,0.2)', marginTop: '1px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Calendar size={7} /> {formatDate(reflection.created_at)}
                      </div>
                    </div>

                    {reflection.skipped ? (
                      <span style={{ padding: '1px 5px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '3px', fontSize: '0.45rem', color: 'rgba(255,255,255,0.25)', fontWeight: '600' }}>SKIP</span>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexShrink: 0 }}>
                        {renderStars(reflection.rating)}
                        {hasContent && (
                          isExpanded ? <ChevronUp size={10} color="rgba(255,255,255,0.2)" /> : <ChevronDown size={10} color="rgba(255,255,255,0.2)" />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Expanded content */}
                  {isExpanded && !reflection.skipped && (
                    <div style={{ background: 'rgba(255,255,255,0.015)' }}>
                      {FIELD_CONFIG.map(field => reflection[field.key] && (
                        <div key={field.key} style={{ display: 'flex', gap: '0.5rem', padding: isMobile ? '0.35rem 0.75rem 0.35rem 1.25rem' : '0.35rem 1rem 0.35rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
                          <div style={{ width: '2px', background: field.color, borderRadius: '1px', flexShrink: 0, opacity: 0.5 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '0.4rem', fontWeight: '700', color: field.color, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>{field.label}</div>
                            <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.4 }}>{reflection[field.key]}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}

            {history.length > 6 && (
              <button onClick={() => setShowAll(!showAll)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', padding: '0.4rem', background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.2)', fontSize: '0.55rem', fontWeight: '600', minHeight: '32px', touchAction: 'manipulation' }}>
                {showAll ? <><ChevronUp size={11} /> Minder</> : <><ChevronDown size={11} /> Alles tonen ({history.length})</>}
              </button>
            )}
          </>
        )}
      </div>

      <style>{`@keyframes rhSpin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
