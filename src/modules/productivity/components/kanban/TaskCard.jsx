// src/modules/productivity/components/kanban/TaskCard.jsx
// VERSION 4.0 - Ultra compact. Titel prominent. Alles else verborgen tenzij expanded.

import { useState } from 'react'
import { Star, Play, CheckCircle, ChevronDown, ChevronUp, Edit2, Trash2, Calendar, Flag, Timer, Save, X, Plus, Circle, Clock, FileText, Zap, Check, ArrowRight } from 'lucide-react'

const PRIORITY_CONFIG = {
  low:    { color: '#22c55e', label: 'LAAG' },
  medium: { color: '#f59e0b', label: 'MED' },
  high:   { color: '#ef4444', label: 'HOOG' }
}

const CATEGORY_CONFIG = {
  werk:       { color: '#3b82f6', label: 'Werk' },
  prive:      { color: '#ec4899', label: 'Privé' },
  myarc:      { color: '#10b981', label: 'MY ARC' },
  gezondheid: { color: '#8b5cf6', label: 'Gezondheid' }
}

const genId = () => Math.random().toString(36).slice(2, 9)

const formatDeadline = (dateStr) => {
  if (!dateStr) return null
  const date = new Date(dateStr)
  const today = new Date()
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1)
  if (date.toDateString() === today.toDateString()) return 'Vandaag'
  if (date.toDateString() === tomorrow.toDateString()) return 'Morgen'
  return date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
}

export default function TaskCard({
  task, sectionColor, isMobile,
  onDragStart, onEdit, onDelete, onComplete, onStart, isActive,
  // Dag-schedule drag
  onDragStartForDay
}) {
  const [expanded, setExpanded] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [newStepText, setNewStepText] = useState('')
  const [addingStep, setAddingStep] = useState(false)

  const [editData, setEditData] = useState({
    title: task.title || '',
    description: task.description || '',
    priority: task.priority || 'medium',
    category: task.category || '',
    deadline: task.deadline || '',
    needs_reflection: task.needs_reflection !== false,
    estimated_minutes: task.estimated_minutes || '',
    is_this_week: task.is_this_week || false
  })

  const steps = Array.isArray(task.steps) ? task.steps : []
  const doneCount = steps.filter(s => s.done).length
  const isOverdue = task.deadline && new Date(task.deadline) < new Date()
  const isThisWeek = task.is_this_week || false
  const priorityConfig = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium

  const handleSaveEdit = async () => {
    if (!editData.title.trim()) return
    await onEdit(editData)
    setIsEditing(false)
  }

  const handleToggleStep = async (stepId) => {
    const updated = steps.map(s => s.id === stepId ? { ...s, done: !s.done } : s)
    await onEdit({ steps: updated })
  }

  const handleAddStep = async () => {
    const text = newStepText.trim()
    if (!text) return
    const updated = [...steps, { id: genId(), text, done: false }]
    setNewStepText(''); setAddingStep(false)
    await onEdit({ steps: updated })
  }

  const handleDeleteStep = async (stepId) => {
    await onEdit({ steps: steps.filter(s => s.id !== stepId) })
  }

  const handleToggleWeek = async (e) => {
    e.stopPropagation()
    await onEdit({ is_this_week: !isThisWeek })
  }

  const handleToggleInProgress = async (e) => {
    e.stopPropagation()
    await onEdit({ is_in_progress: !task.is_in_progress })
  }

  // Drag — voor kanban reorder
  const handleDragStart = (e) => {
    if (onDragStartForDay) {
      // Zet task data voor dag-drop
      e.dataTransfer.setData('task', JSON.stringify({ ...task, _sectionColor: sectionColor }))
    }
    if (onDragStart) onDragStart(e)
  }

  // ── EDIT MODE ──────────────────────────────────────────────────────────────
  if (isEditing) {
    return (
      <div style={{ background: '#0a0a0a', border: `1px solid ${sectionColor}40`, borderRadius: '8px', overflow: 'hidden' }}>
        <div style={{ padding: '0.4rem 0.625rem', borderBottom: `1px solid ${sectionColor}25`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.5rem', fontWeight: '700', color: sectionColor, textTransform: 'uppercase', letterSpacing: '0.06em' }}>BEWERKEN</span>
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            <button onClick={handleSaveEdit} style={{ padding: '0.25rem 0.4rem', background: `${sectionColor}15`, border: `1px solid ${sectionColor}30`, borderRadius: '4px', color: sectionColor, fontSize: '0.55rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px', minHeight: '24px', touchAction: 'manipulation' }}><Save size={9} /> Opslaan</button>
            <button onClick={() => setIsEditing(false)} style={{ padding: '0.25rem 0.4rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px', color: 'rgba(255,255,255,0.4)', fontSize: '0.55rem', cursor: 'pointer', minHeight: '24px', touchAction: 'manipulation' }}>Annuleer</button>
          </div>
        </div>
        <div style={{ padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          <input type="text" placeholder="Titel *" value={editData.title} onChange={(e) => setEditData({ ...editData, title: e.target.value })}
            style={{ width: '100%', padding: '0.35rem 0.5rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '5px', color: '#fff', fontSize: '0.8rem', fontWeight: '700', outline: 'none', minHeight: '30px' }} />
          <textarea placeholder="Beschrijving" value={editData.description} rows={2} onChange={(e) => setEditData({ ...editData, description: e.target.value })}
            style={{ width: '100%', padding: '0.35rem 0.5rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '5px', color: '#fff', fontSize: '0.75rem', resize: 'none', outline: 'none' }} />
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            <select value={editData.priority} onChange={(e) => setEditData({ ...editData, priority: e.target.value })}
              style={{ flex: 1, padding: '0.3rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '5px', color: '#fff', fontSize: '0.7rem', outline: 'none', minHeight: '28px' }}>
              <option value="low">🟢 Laag</option><option value="medium">🟡 Med</option><option value="high">🔴 Hoog</option>
            </select>
            <select value={editData.category} onChange={(e) => setEditData({ ...editData, category: e.target.value })}
              style={{ flex: 1, padding: '0.3rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '5px', color: '#fff', fontSize: '0.7rem', outline: 'none', minHeight: '28px' }}>
              <option value="">Geen</option><option value="werk">💼 Werk</option><option value="prive">🏠 Privé</option><option value="myarc">💪 MY ARC</option><option value="gezondheid">❤️ Gezondheid</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Calendar size={10} color="rgba(255,255,255,0.3)" />
              <input type="date" value={editData.deadline} onChange={(e) => setEditData({ ...editData, deadline: e.target.value })}
                style={{ flex: 1, padding: '0.3rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '5px', color: '#fff', fontSize: '0.7rem', outline: 'none', minHeight: '28px' }} />
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Timer size={10} color="rgba(255,255,255,0.3)" />
              <input type="number" min="1" max="480" placeholder="Min" value={editData.estimated_minutes}
                onChange={(e) => setEditData({ ...editData, estimated_minutes: e.target.value ? parseInt(e.target.value) : '' })}
                style={{ flex: 1, padding: '0.3rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '5px', color: '#fff', fontSize: '0.7rem', outline: 'none', minHeight: '28px' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer', padding: '0.25rem 0.4rem', background: editData.is_this_week ? 'rgba(255,215,0,0.08)' : 'transparent', border: `1px solid ${editData.is_this_week ? 'rgba(255,215,0,0.2)' : 'rgba(255,255,255,0.06)'}`, borderRadius: '5px' }}>
              <input type="checkbox" checked={editData.is_this_week} onChange={(e) => setEditData({ ...editData, is_this_week: e.target.checked })} style={{ accentColor: '#FFD700' }} />
              <span style={{ color: editData.is_this_week ? '#FFD700' : 'rgba(255,255,255,0.4)', fontSize: '0.6rem' }}>⭐ Deze week</span>
            </label>
            <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer', padding: '0.25rem 0.4rem', background: editData.needs_reflection ? 'rgba(139,92,246,0.08)' : 'transparent', border: `1px solid ${editData.needs_reflection ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.06)'}`, borderRadius: '5px' }}>
              <input type="checkbox" checked={editData.needs_reflection} onChange={(e) => setEditData({ ...editData, needs_reflection: e.target.checked })} style={{ accentColor: '#8b5cf6' }} />
              <span style={{ color: editData.needs_reflection ? '#a78bfa' : 'rgba(255,255,255,0.4)', fontSize: '0.6rem' }}>Reflectie</span>
            </label>
          </div>
        </div>
      </div>
    )
  }

  // ── COMPACT CARD ──────────────────────────────────────────────────────────
  return (
    <div
      draggable
      onDragStart={handleDragStart}
      style={{
        background: '#0a0a0a',
        border: isThisWeek
          ? '1px solid rgba(255,215,0,0.2)'
          : isOverdue
            ? '1px solid rgba(239,68,68,0.15)'
            : '1px solid rgba(255,255,255,0.05)',
        borderLeft: `3px solid ${isThisWeek ? '#FFD700' : isOverdue ? '#ef4444' : sectionColor}`,
        borderRadius: '8px',
        overflow: 'hidden',
        cursor: 'grab',
        transform: 'translateZ(0)',
        opacity: task.is_in_progress ? 1 : 1
      }}
    >
      {/* ═══ HOOFD ROW — altijd zichtbaar ═══ */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.375rem',
        padding: '0.4rem 0.5rem',
        minHeight: '36px'
      }}>
        {/* Titel — prominent, altijd volledig zichtbaar */}
        <span
          onClick={() => setExpanded(!expanded)}
          style={{
            flex: 1,
            fontSize: '0.78rem',
            fontWeight: '700',
            color: task.is_in_progress ? '#f59e0b' : '#fff',
            lineHeight: 1.3,
            cursor: 'pointer',
            // Geen truncate — titel altijd volledig
            wordBreak: 'break-word'
          }}
        >
          {task.title}
        </span>

        {/* Week ster */}
        <button
          onClick={handleToggleWeek}
          style={{ padding: '2px', background: 'transparent', border: 'none', cursor: 'pointer', touchAction: 'manipulation', flexShrink: 0 }}
        >
          <Star
            size={12}
            color={isThisWeek ? '#FFD700' : 'rgba(255,255,255,0.1)'}
            fill={isThisWeek ? '#FFD700' : 'transparent'}
          />
        </button>

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          style={{ padding: '2px', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.15)', cursor: 'pointer', touchAction: 'manipulation', flexShrink: 0 }}
        >
          {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
        </button>
      </div>

      {/* ═══ STAPPEN PROGRESS — alleen als er stappen zijn, altijd zichtbaar ═══ */}
      {steps.length > 0 && (
        <div style={{ padding: '0 0.5rem 0.3rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <div style={{ flex: 1, height: '2px', background: 'rgba(255,255,255,0.06)', borderRadius: '1px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.round((doneCount / steps.length) * 100)}%`, background: doneCount === steps.length ? '#10b981' : sectionColor, borderRadius: '1px', transition: 'width 0.3s ease' }} />
          </div>
          <span style={{ fontSize: '0.4rem', fontWeight: '700', color: 'rgba(255,255,255,0.2)' }}>{doneCount}/{steps.length}</span>
        </div>
      )}

      {/* ═══ EXPANDED DETAIL ═══ */}
      {expanded && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>

          {/* Meta badges */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.2rem', padding: '0.35rem 0.5rem', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
            {task.priority && (
              <span style={{ padding: '1px 4px', background: `${priorityConfig.color}10`, border: `1px solid ${priorityConfig.color}20`, borderRadius: '3px', fontSize: '0.42rem', fontWeight: '700', color: priorityConfig.color }}>
                {priorityConfig.label}
              </span>
            )}
            {task.category && CATEGORY_CONFIG[task.category] && (
              <span style={{ padding: '1px 4px', background: `${CATEGORY_CONFIG[task.category].color}10`, border: `1px solid ${CATEGORY_CONFIG[task.category].color}20`, borderRadius: '3px', fontSize: '0.42rem', fontWeight: '600', color: CATEGORY_CONFIG[task.category].color }}>
                {CATEGORY_CONFIG[task.category].label}
              </span>
            )}
            {task.deadline && (
              <span style={{ padding: '1px 4px', background: isOverdue ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.04)', border: `1px solid ${isOverdue ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.08)'}`, borderRadius: '3px', fontSize: '0.42rem', fontWeight: '600', color: isOverdue ? '#ef4444' : 'rgba(255,255,255,0.35)' }}>
                {formatDeadline(task.deadline)}
              </span>
            )}
            {task.estimated_minutes && (
              <span style={{ padding: '1px 4px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '3px', fontSize: '0.42rem', fontWeight: '600', color: 'rgba(255,255,255,0.25)' }}>
                {task.estimated_minutes}m
              </span>
            )}
            {task.is_in_progress && (
              <span style={{ padding: '1px 4px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '3px', fontSize: '0.42rem', fontWeight: '700', color: '#f59e0b' }}>BEZIG</span>
            )}
            {task.goal_id && (
              <span style={{ padding: '1px 4px', background: 'rgba(255,215,0,0.06)', border: '1px solid rgba(255,215,0,0.15)', borderRadius: '3px', fontSize: '0.42rem', fontWeight: '700', color: '#FFD700' }}>🎯 DOEL</span>
            )}
          </div>

          {/* Beschrijving */}
          {task.description && (
            <div style={{ padding: '0.3rem 0.5rem', borderBottom: '1px solid rgba(255,255,255,0.03)', display: 'flex', gap: '0.3rem' }}>
              <FileText size={9} color="rgba(255,255,255,0.15)" style={{ flexShrink: 0, marginTop: '1px' }} />
              <p style={{ margin: 0, fontSize: '0.6rem', color: 'rgba(255,255,255,0.35)', lineHeight: 1.4 }}>{task.description}</p>
            </div>
          )}

          {/* Stappen */}
          {steps.length > 0 && (
            <div style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
              {steps.map(step => (
                <div key={step.id} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.25rem 0.5rem', borderBottom: '1px solid rgba(255,255,255,0.02)', opacity: step.done ? 0.45 : 1 }}>
                  <button onClick={(e) => { e.stopPropagation(); handleToggleStep(step.id) }}
                    style={{ width: '14px', height: '14px', minWidth: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: step.done ? 'rgba(16,185,129,0.1)' : 'transparent', border: step.done ? '1.5px solid rgba(16,185,129,0.4)' : '1.5px solid rgba(255,255,255,0.12)', borderRadius: '3px', cursor: 'pointer', touchAction: 'manipulation', flexShrink: 0, padding: 0 }}>
                    {step.done && <Check size={8} color="#10b981" strokeWidth={2.5} />}
                  </button>
                  <span style={{ flex: 1, fontSize: '0.62rem', color: step.done ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.65)', textDecoration: step.done ? 'line-through' : 'none', lineHeight: 1.3 }}>{step.text}</span>
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteStep(step.id) }}
                    style={{ padding: '1px', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.08)', cursor: 'pointer', flexShrink: 0 }}><X size={8} /></button>
                </div>
              ))}
              {addingStep ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.25rem 0.5rem' }}>
                  <div style={{ width: '14px', height: '14px', border: '1.5px dashed rgba(255,255,255,0.1)', borderRadius: '3px', flexShrink: 0 }} />
                  <input autoFocus type="text" value={newStepText} onChange={(e) => setNewStepText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddStep(); if (e.key === 'Escape') { setAddingStep(false); setNewStepText('') } }}
                    placeholder="Stap..." style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: '0.62rem', padding: 0 }} />
                  <button onClick={handleAddStep} style={{ padding: '1px 4px', background: `${sectionColor}15`, border: `1px solid ${sectionColor}30`, borderRadius: '3px', color: sectionColor, fontSize: '0.45rem', fontWeight: '700', cursor: 'pointer', minHeight: '16px', touchAction: 'manipulation' }}>OK</button>
                  <button onClick={() => { setAddingStep(false); setNewStepText('') }} style={{ padding: '1px', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.2)', cursor: 'pointer' }}><X size={8} /></button>
                </div>
              ) : (
                <button onClick={(e) => { e.stopPropagation(); setAddingStep(true) }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.2rem', padding: '0.2rem 0.5rem', background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.15)', fontSize: '0.5rem', fontWeight: '600', minHeight: '22px', touchAction: 'manipulation' }}>
                  <Plus size={8} /> Stap
                </button>
              )}
            </div>
          )}

          {!steps.length && (
            <button onClick={(e) => { e.stopPropagation(); setAddingStep(true) }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.2rem', padding: '0.2rem 0.5rem', background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.03)', cursor: 'pointer', color: 'rgba(255,255,255,0.12)', fontSize: '0.5rem', fontWeight: '600', minHeight: '24px', touchAction: 'manipulation' }}>
              <Plus size={8} /> Stap toevoegen
            </button>
          )}

          {/* Actie bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.3rem 0.5rem' }}>
            {/* Bezig toggle */}
            <button onClick={handleToggleInProgress}
              style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: task.is_in_progress ? 'rgba(245,158,11,0.12)' : 'transparent', border: task.is_in_progress ? '1px solid rgba(245,158,11,0.3)' : '1px solid rgba(255,255,255,0.06)', borderRadius: '5px', color: task.is_in_progress ? '#f59e0b' : 'rgba(255,255,255,0.2)', cursor: 'pointer', touchAction: 'manipulation', flexShrink: 0, padding: 0 }}>
              <Zap size={10} />
            </button>

            {/* Start timer */}
            {onStart && (
              <button onClick={(e) => { e.stopPropagation(); onStart() }}
                style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isActive ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${isActive ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.08)'}`, borderRadius: '5px', color: isActive ? '#10b981' : 'rgba(255,255,255,0.3)', cursor: 'pointer', touchAction: 'manipulation', flexShrink: 0, padding: 0 }}>
                <Play size={10} />
              </button>
            )}

            {/* Complete */}
            <button onClick={(e) => { e.stopPropagation(); onComplete() }}
              style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '5px', color: '#10b981', cursor: 'pointer', touchAction: 'manipulation', flexShrink: 0, padding: 0 }}>
              <CheckCircle size={10} />
            </button>

            <div style={{ flex: 1 }} />

            {/* Edit */}
            <button onClick={(e) => { e.stopPropagation(); setIsEditing(true) }}
              style={{ padding: '3px', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.18)', cursor: 'pointer', touchAction: 'manipulation' }}>
              <Edit2 size={10} />
            </button>
            {/* Delete */}
            <button onClick={(e) => { e.stopPropagation(); onDelete() }}
              style={{ padding: '3px', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.1)', cursor: 'pointer', touchAction: 'manipulation' }}>
              <Trash2 size={10} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
