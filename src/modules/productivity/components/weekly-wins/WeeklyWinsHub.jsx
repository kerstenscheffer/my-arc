// src/modules/productivity/components/weekly-wins/WeeklyWinsHub.jsx
// VERSION 3.0 - Doel-subtasks + kanban flow + rapport sync

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Trophy, Plus, Calendar, Star, CheckCircle, Trash2, FileText, ChevronDown, ChevronUp, Target, Sparkles, X, Check, ArrowRight, Zap, Hammer, Users, Megaphone, Layers } from 'lucide-react'

const ICON_MAP = { Hammer, Users, Megaphone, Layers }
const CatIcon = ({ name, size = 10, color }) => {
  const Icon = ICON_MAP[name]
  return Icon ? <Icon size={size} color={color} /> : null
}

const CATEGORY_CONFIG = {
  werk:       { color: '#3b82f6', label: 'Werk',       emoji: '💼' },
  prive:      { color: '#ec4899', label: 'Privé',      emoji: '🏠' },
  myarc:      { color: '#10b981', label: 'MY ARC',     emoji: '💪' },
  gezondheid: { color: '#8b5cf6', label: 'Gezondheid', emoji: '❤️' },
  algemeen:   { color: '#f59e0b', label: 'Algemeen',   emoji: '⭐' }
}

const GOAL_CATEGORIES = [
  { id: 'building',    label: 'Building',    color: '#3b82f6', icon: 'Hammer' },
  { id: 'coaching',    label: 'Coaching',    color: '#10b981', icon: 'Users' },
  { id: 'advertising', label: 'Advertising', color: '#f59e0b', icon: 'Megaphone' },
  { id: 'overig',      label: 'Overig',      color: '#6b7280', icon: 'Layers' }
]


const genId = () => Math.random().toString(36).slice(2, 9)

export default function WeeklyWinsHub({ productivityService, coachId, isMobile, sections = [] }) {
  const [wins, setWins] = useState([])
  const [reports, setReports] = useState([])
  const [completedTasks, setCompletedTasks] = useState([])
  const [weekGoals, setWeekGoals] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [showAddWin, setShowAddWin] = useState(false)
  const [newWinText, setNewWinText] = useState('')
  const [newWinCategory, setNewWinCategory] = useState('algemeen')
  const [currentWeekReport, setCurrentWeekReport] = useState(null)
  const [showPreviousReports, setShowPreviousReports] = useState(false)
  const [addingGoal, setAddingGoal] = useState(false)
  const [newGoalText, setNewGoalText] = useState('')
  const [newGoalCategory, setNewGoalCategory] = useState('building')
  const [activeSection, setActiveSection] = useState('goals')
  // Expanded goal (voor subtasks)
  const [expandedGoalId, setExpandedGoalId] = useState(null)
  // Subtask toevoegen state per goal
  const [addingSubtaskFor, setAddingSubtaskFor] = useState(null)
  const [newSubtaskText, setNewSubtaskText] = useState('')
  // Kanban picker state
  const [kanbanPickerFor, setKanbanPickerFor] = useState(null) // { goalId, subtaskId }
  const [kanbanSections, setKanbanSections] = useState([])

  const weekStart = productivityService.getWeekStart()
  const weekEnd = productivityService.getWeekEnd()

  useEffect(() => { loadData() }, [productivityService, coachId])

  // Sync kanban sections
  useEffect(() => { setKanbanSections(sections) }, [sections])

  const loadData = async () => {
    try {
      setLoading(true)
      const [winsData, reportsData, completedData, goalsData] = await Promise.all([
        productivityService.getWeeklyWins(coachId, weekStart),
        productivityService.getWeekReports(coachId, 10),
        productivityService.getCompletedTasks(coachId, weekStart, weekEnd),
        productivityService.getWeekGoals(coachId, weekStart)
      ])
      setWins(winsData)
      setReports(reportsData)
      setCompletedTasks(completedData)
      setWeekGoals(goalsData)
    } catch (error) {
      console.error('❌ Load weekly wins failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatWeekRange = (start, end) => {
    const s = new Date(start)
    const e = new Date(end)
    return `${s.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })} – ${e.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}`
  }

  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })

  // ── SAVE GOALS HELPER ───────────────────────────────────────────────────────
  const saveGoals = async (updated) => {
    setWeekGoals(updated)
    await productivityService.saveWeekGoals(coachId, weekStart, updated)
  }

  // ── WEEK GOALS ──────────────────────────────────────────────────────────────
  const handleAddGoal = async () => {
    const text = newGoalText.trim()
    if (!text) return
    const updated = [...weekGoals, { id: genId(), text, done: false, subtasks: [], category: newGoalCategory }]
    setNewGoalText('')
    setAddingGoal(false)
    await saveGoals(updated)
  }

  const handleToggleGoal = async (goalId) => {
    const updated = weekGoals.map(g => g.id === goalId ? { ...g, done: !g.done } : g)
    await saveGoals(updated)
  }

  const handleDeleteGoal = async (goalId) => {
    const updated = weekGoals.filter(g => g.id !== goalId)
    await saveGoals(updated)
  }

  const handleChangeGoalCategory = async (goalId, newCategory) => {
    const updated = weekGoals.map(g => g.id === goalId ? { ...g, category: newCategory } : g)
    await saveGoals(updated)
  }

  // ── SUBTASKS ─────────────────────────────────────────────────────────────────
  const handleAddSubtask = async (goalId) => {
    const text = newSubtaskText.trim()
    if (!text) return
    const updated = weekGoals.map(g => g.id === goalId
      ? { ...g, subtasks: [...(g.subtasks || []), { id: genId(), text, done: false, taskId: null }] }
      : g
    )
    setNewSubtaskText('')
    setAddingSubtaskFor(null)
    await saveGoals(updated)
  }

  const handleToggleSubtask = async (goalId, subtaskId) => {
    const updated = weekGoals.map(g => g.id === goalId
      ? { ...g, subtasks: (g.subtasks || []).map(s => s.id === subtaskId ? { ...s, done: !s.done } : s) }
      : g
    )
    // Auto-check goal if all subtasks done
    const goal = updated.find(g => g.id === goalId)
    if (goal && goal.subtasks.length > 0 && goal.subtasks.every(s => s.done)) {
      updated.forEach(g => { if (g.id === goalId) g.done = true })
    }
    await saveGoals(updated)
  }

  const handleDeleteSubtask = async (goalId, subtaskId) => {
    const updated = weekGoals.map(g => g.id === goalId
      ? { ...g, subtasks: (g.subtasks || []).filter(s => s.id !== subtaskId) }
      : g
    )
    await saveGoals(updated)
  }

  // ── KANBAN FLOW ──────────────────────────────────────────────────────────────
  const handleSendToKanban = async (goalId, subtaskId, sectionId) => {
    setKanbanPickerFor(null)
    const goal = weekGoals.find(g => g.id === goalId)
    const subtask = (goal?.subtasks || []).find(s => s.id === subtaskId)
    if (!subtask) return

    try {
      // Maak echte productivity task aan
      const newTask = await productivityService.createTask(coachId, {
        title: subtask.text,
        sectionId: sectionId === 'unassigned' ? null : sectionId,
        priority: 'medium',
        position: 0,
        description: '🎯 ' + goal.text,
        goal_id: `${goalId}::${subtaskId}`
      })

      // Sla taskId op in subtask
      const updated = weekGoals.map(g => g.id === goalId
        ? { ...g, subtasks: (g.subtasks || []).map(s => s.id === subtaskId ? { ...s, taskId: newTask.id } : s) }
        : g
      )
      await saveGoals(updated)
    } catch (error) {
      console.error('❌ Send to kanban failed:', error)
    }
  }

  // Check completed tasks tegen subtasks — sync done status
  useEffect(() => {
    if (completedTasks.length === 0 || weekGoals.length === 0) return
    const completedIds = new Set(completedTasks.map(t => t.id))
    let changed = false
    const updated = weekGoals.map(g => {
      const newSubtasks = (g.subtasks || []).map(s => {
        if (s.taskId && completedIds.has(s.taskId) && !s.done) {
          changed = true
          return { ...s, done: true }
        }
        return s
      })
      const allDone = newSubtasks.length > 0 && newSubtasks.every(s => s.done)
      return { ...g, subtasks: newSubtasks, done: allDone ? true : g.done }
    })
    if (changed) saveGoals(updated)
  }, [completedTasks])

  // ── WINS ─────────────────────────────────────────────────────────────────────
  const handleAddWin = async () => {
    if (!newWinText.trim()) return
    try {
      const win = await productivityService.addWeeklyWin(coachId, newWinText.trim(), newWinCategory)
      setWins(prev => [...prev, win])
      setNewWinText(''); setNewWinCategory('algemeen'); setShowAddWin(false)
    } catch (error) { console.error('❌ Add win failed:', error) }
  }

  const handleDeleteWin = async (winId) => {
    try {
      await productivityService.deleteWeeklyWin(winId)
      setWins(prev => prev.filter(w => w.id !== winId))
    } catch (error) { console.error('❌ Delete win failed:', error) }
  }

  // ── RAPPORT ──────────────────────────────────────────────────────────────────
  const handleGenerateReport = async () => {
    try {
      setGenerating(true)
      const report = await productivityService.generateWeekReport(coachId, weekStart)
      setCurrentWeekReport(report)
      setReports(prev => [report, ...prev.filter(r => r.id !== report.id)])
      setActiveSection('report')
    } catch (error) {
      console.error('❌ Generate report failed:', error)
    } finally { setGenerating(false) }
  }

  // Berekeningen
  const goalsDone = weekGoals.filter(g => g.done).length
  const goalsProgress = weekGoals.length > 0 ? Math.round((goalsDone / weekGoals.length) * 100) : 0

  // ── LOADING ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '28px', height: '28px', border: '2px solid rgba(245,158,11,0.15)', borderTopColor: '#f59e0b', borderRadius: '50%', animation: 'wwSpin 0.8s linear infinite' }} />
      </div>
    )
  }

  const SECTIONS_TABS = [
    { id: 'goals',   label: 'Doelen',   color: '#10b981', count: `${goalsDone}/${weekGoals.length}` },
    { id: 'wins',    label: 'Wins',     color: '#f59e0b', count: wins.length || null },
    { id: 'history', label: 'Voltooid', color: '#3b82f6', count: completedTasks.length || null },
    { id: 'report',  label: 'Rapport',  color: '#8b5cf6', count: null }
  ]

  return (
    <div style={{ transform: 'translateZ(0)' }}>

      {/* ═══ WEEK HEADER ═══ */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: isMobile ? '0.625rem 0.75rem' : '0.625rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <Calendar size={12} color="#f59e0b" />
          <span style={{ fontSize: '0.7rem', fontWeight: '700', color: '#f59e0b' }}>{formatWeekRange(weekStart, weekEnd)}</span>
        </div>
        <button onClick={handleGenerateReport} disabled={generating}
          style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '5px', color: '#a78bfa', fontSize: '0.55rem', fontWeight: '700', cursor: generating ? 'not-allowed' : 'pointer', minHeight: '26px', touchAction: 'manipulation' }}>
          <Sparkles size={9} /> {generating ? 'Genereren...' : 'Rapport'}
        </button>
      </div>

      {/* ═══ SECTION TABS ═══ */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        {SECTIONS_TABS.map(s => (
          <button key={s.id} onClick={() => setActiveSection(s.id)}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.2rem', padding: '0.4rem 0.25rem', background: 'transparent', border: 'none', borderBottom: activeSection === s.id ? `2px solid ${s.color}` : '2px solid transparent', color: activeSection === s.id ? s.color : 'rgba(255,255,255,0.2)', fontSize: isMobile ? '0.55rem' : '0.6rem', fontWeight: activeSection === s.id ? '700' : '500', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: '34px', whiteSpace: 'nowrap' }}>
            {s.label}
            {s.count !== null && s.count !== undefined && (
              <span style={{ fontSize: '0.45rem', fontWeight: '800', opacity: 0.7 }}>({s.count})</span>
            )}
          </button>
        ))}
      </div>

      {/* ═══ SECTION: WEEKDOELEN ═══ */}
      {activeSection === 'goals' && (
        <div>
          {/* Progress bar */}
          {weekGoals.length > 0 && (
            <div style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ flex: 1, height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${goalsProgress}%`, background: goalsProgress === 100 ? '#10b981' : '#f59e0b', borderRadius: '2px', transition: 'width 0.3s ease' }} />
              </div>
              <span style={{ fontSize: '0.5rem', fontWeight: '800', color: goalsProgress === 100 ? '#10b981' : 'rgba(255,255,255,0.3)', minWidth: '28px' }}>{goalsDone}/{weekGoals.length}</span>
            </div>
          )}

          {weekGoals.length === 0 && !addingGoal && (
            <div style={{ padding: '1.5rem 1rem', textAlign: 'center', color: 'rgba(255,255,255,0.15)', fontSize: '0.7rem' }}>Nog geen doelen voor deze week</div>
          )}

          {/* Doelen gegroepeerd per categorie */}
          {GOAL_CATEGORIES.map(cat => {
            const catGoals = weekGoals.filter(g => (g.category || 'overig') === cat.id)
            if (catGoals.length === 0 && addingGoal && newGoalCategory !== cat.id) return null
            const catDone = catGoals.filter(g => g.done).length

            return (
              <div key={cat.id}>
                {/* Categorie header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: isMobile ? '0.35rem 0.75rem' : '0.35rem 1rem', borderBottom: `1px solid ${cat.color}15`, background: `${cat.color}05` }}>
                  <CatIcon name={cat.icon} size={11} color={cat.color} />
                  <span style={{ fontSize: '0.5rem', fontWeight: '800', color: cat.color, textTransform: 'uppercase', letterSpacing: '0.06em', flex: 1 }}>{cat.label}</span>
                  {catGoals.length > 0 && (
                    <span style={{ fontSize: '0.45rem', fontWeight: '700', color: catDone === catGoals.length ? '#10b981' : 'rgba(255,255,255,0.2)' }}>{catDone}/{catGoals.length}</span>
                  )}
                </div>

                {/* Goals in deze categorie */}
                {catGoals.map((goal) => {
                  const subtasks = goal.subtasks || []
                  const subtasksDone = subtasks.filter(s => s.done).length
                  const isExpanded = expandedGoalId === goal.id
                  const hasKanban = subtasks.some(s => s.taskId)

                  return (
                    <div key={goal.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: isMobile ? '0.45rem 0.75rem' : '0.45rem 1rem', borderLeft: `3px solid ${cat.color}40` }}>
                        <button onClick={() => handleToggleGoal(goal.id)}
                          style={{ width: '20px', height: '20px', minWidth: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: goal.done ? 'rgba(16,185,129,0.1)' : 'transparent', border: goal.done ? '1.5px solid rgba(16,185,129,0.4)' : `1.5px solid ${cat.color}40`, borderRadius: '4px', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', flexShrink: 0 }}>
                          {goal.done && <Check size={11} color="#10b981" strokeWidth={2.5} />}
                        </button>

                        <button onClick={() => setExpandedGoalId(isExpanded ? null : goal.id)}
                          style={{ flex: 1, background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0, touchAction: 'manipulation' }}>
                          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: goal.done ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.85)', textDecoration: goal.done ? 'line-through' : 'none', lineHeight: 1.2 }}>{goal.text}</div>
                          {subtasks.length > 0 && (
                            <div style={{ fontSize: '0.45rem', fontWeight: '700', color: subtasksDone === subtasks.length ? '#10b981' : 'rgba(255,255,255,0.25)', marginTop: '2px' }}>
                              {subtasksDone}/{subtasks.length} taken {hasKanban && <span style={{ color: '#f59e0b' }}>· in kanban</span>}
                            </div>
                          )}
                        </button>

                        {subtasks.length > 0 && (
                          <div style={{ width: '26px', height: '26px', borderRadius: '50%', border: `2px solid ${subtasksDone === subtasks.length ? '#10b981' : cat.color + '30'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <span style={{ fontSize: '0.4rem', fontWeight: '800', color: subtasksDone === subtasks.length ? '#10b981' : 'rgba(255,255,255,0.3)' }}>
                              {Math.round((subtasksDone / subtasks.length) * 100)}%
                            </span>
                          </div>
                        )}

                        <button onClick={() => setExpandedGoalId(isExpanded ? null : goal.id)}
                          style={{ padding: '2px', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.2)', cursor: 'pointer', touchAction: 'manipulation', flexShrink: 0 }}>
                          {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </button>
                        {/* Categorie switcher */}
                        <select
                          value={goal.category || 'overig'}
                          onChange={(e) => { e.stopPropagation(); handleChangeGoalCategory(goal.id, e.target.value) }}
                          onClick={(e) => e.stopPropagation()}
                          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px', color: 'rgba(255,255,255,0.3)', fontSize: '0.5rem', padding: '1px 2px', cursor: 'pointer', outline: 'none', maxWidth: '70px', touchAction: 'manipulation' }}
                        >
                          {GOAL_CATEGORIES.map(c => (
                            <option key={c.id} value={c.id}>{c.label}</option>
                          ))}
                        </select>

                        <button onClick={() => handleDeleteGoal(goal.id)}
                          style={{ padding: '2px', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.08)', cursor: 'pointer', touchAction: 'manipulation', flexShrink: 0 }}>
                          <X size={10} />
                        </button>
                      </div>

                      {/* SUBTASKS PANEL */}
                      {isExpanded && (
                        <div style={{ background: 'rgba(255,255,255,0.015)', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
                          {subtasks.map((sub) => {
                            const inKanban = !!sub.taskId
                            return (
                              <div key={sub.id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: isMobile ? '0.35rem 0.75rem 0.35rem 1.25rem' : '0.35rem 1rem 0.35rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.025)', opacity: sub.done ? 0.5 : 1 }}>
                                <button onClick={() => handleToggleSubtask(goal.id, sub.id)}
                                  style={{ width: '16px', height: '16px', minWidth: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: sub.done ? 'rgba(16,185,129,0.1)' : 'transparent', border: sub.done ? '1.5px solid rgba(16,185,129,0.35)' : '1.5px solid rgba(255,255,255,0.12)', borderRadius: '3px', cursor: 'pointer', touchAction: 'manipulation', flexShrink: 0 }}>
                                  {sub.done && <Check size={9} color="#10b981" strokeWidth={2.5} />}
                                </button>
                                <span style={{ flex: 1, fontSize: '0.68rem', color: sub.done ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.7)', textDecoration: sub.done ? 'line-through' : 'none', lineHeight: 1.3 }}>{sub.text}</span>
                                {inKanban ? (
                                  <span style={{ display: 'flex', alignItems: 'center', gap: '2px', padding: '1px 5px', background: sub.done ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)', border: `1px solid ${sub.done ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'}`, borderRadius: '3px', fontSize: '0.4rem', fontWeight: '700', color: sub.done ? '#10b981' : '#f59e0b', flexShrink: 0 }}>
                                    {sub.done ? <><Check size={7} /> KLAAR</> : <><Zap size={7} /> IN KANBAN</>}
                                  </span>
                                ) : (
                                  <button onClick={() => setKanbanPickerFor({ goalId: goal.id, subtaskId: sub.id })}
                                    style={{ display: 'flex', alignItems: 'center', gap: '2px', padding: '1px 5px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '3px', fontSize: '0.4rem', fontWeight: '700', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', touchAction: 'manipulation', flexShrink: 0, minHeight: '18px' }}>
                                    <ArrowRight size={7} /> Kanban
                                  </button>
                                )}
                                <button onClick={() => handleDeleteSubtask(goal.id, sub.id)}
                                  style={{ padding: '2px', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.08)', cursor: 'pointer', touchAction: 'manipulation', flexShrink: 0 }}>
                                  <X size={9} />
                                </button>
                              </div>
                            )
                          })}
                          {addingSubtaskFor === goal.id ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: isMobile ? '0.35rem 0.75rem 0.35rem 1.25rem' : '0.35rem 1rem 0.35rem 1.5rem' }}>
                              <div style={{ width: '16px', height: '16px', border: '1.5px dashed rgba(255,255,255,0.1)', borderRadius: '3px', flexShrink: 0 }} />
                              <input autoFocus type="text" value={newSubtaskText}
                                onChange={(e) => setNewSubtaskText(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleAddSubtask(goal.id); if (e.key === 'Escape') { setAddingSubtaskFor(null); setNewSubtaskText('') } }}
                                placeholder="Taak omschrijven..."
                                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: '0.68rem', padding: 0 }} />
                              <button onClick={() => handleAddSubtask(goal.id)}
                                style={{ padding: '2px 5px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '3px', color: '#10b981', fontSize: '0.45rem', fontWeight: '700', cursor: 'pointer', minHeight: '18px', touchAction: 'manipulation' }}>OK</button>
                              <button onClick={() => { setAddingSubtaskFor(null); setNewSubtaskText('') }}
                                style={{ padding: '2px', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.2)', cursor: 'pointer' }}><X size={9} /></button>
                            </div>
                          ) : (
                            <button onClick={() => { setAddingSubtaskFor(goal.id); setNewSubtaskText('') }}
                              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.25rem', padding: isMobile ? '0.3rem 0.75rem 0.3rem 1.25rem' : '0.3rem 1rem 0.3rem 1.5rem', background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.2)', fontSize: '0.55rem', fontWeight: '600', touchAction: 'manipulation', minHeight: '28px' }}>
                              <Plus size={9} /> Taak toevoegen
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}

                {/* Doel toevoegen in deze categorie */}
                {addingGoal && newGoalCategory === cat.id ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', padding: isMobile ? '0.5rem 0.75rem' : '0.5rem 1rem', borderTop: '1px solid rgba(255,255,255,0.03)', borderLeft: `3px solid ${cat.color}40` }}>
                    <input autoFocus type="text" value={newGoalText}
                      onChange={(e) => setNewGoalText(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleAddGoal(); if (e.key === 'Escape') { setAddingGoal(false); setNewGoalText('') } }}
                      placeholder={`${cat.label} doel omschrijven...`}
                      style={{ flex: 1, background: 'transparent', border: 'none', borderBottom: `1px solid ${cat.color}30`, outline: 'none', color: '#fff', fontSize: '0.75rem', padding: '0.2rem 0' }} />
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button onClick={handleAddGoal}
                        style={{ padding: '2px 8px', background: `${cat.color}15`, border: `1px solid ${cat.color}30`, borderRadius: '3px', color: cat.color, fontSize: '0.5rem', fontWeight: '700', cursor: 'pointer', minHeight: '22px', touchAction: 'manipulation' }}>Toevoegen</button>
                      <button onClick={() => { setAddingGoal(false); setNewGoalText('') }}
                        style={{ padding: '2px 6px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '3px', color: 'rgba(255,255,255,0.3)', fontSize: '0.5rem', cursor: 'pointer', minHeight: '22px', touchAction: 'manipulation' }}>Annuleer</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => { setAddingGoal(true); setNewGoalCategory(cat.id) }}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.25rem', padding: isMobile ? '0.3rem 0.75rem' : '0.3rem 1rem', background: 'transparent', border: 'none', cursor: 'pointer', color: `${cat.color}50`, fontSize: '0.55rem', fontWeight: '600', touchAction: 'manipulation', minHeight: '28px' }}>
                    <Plus size={9} /> {cat.label} doel
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

            {activeSection === 'wins' && (
        <div>
          {wins.length === 0 && !showAddWin && (
            <div style={{ padding: '1.5rem 1rem', textAlign: 'center', color: 'rgba(255,255,255,0.15)', fontSize: '0.7rem' }}>Nog geen wins deze week</div>
          )}
          {wins.map(win => {
            const config = CATEGORY_CONFIG[win.category] || CATEGORY_CONFIG.algemeen
            return (
              <div key={win.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: isMobile ? '0.45rem 0.75rem' : '0.45rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                <span style={{ fontSize: '0.9rem', flexShrink: 0 }}>{config.emoji}</span>
                <span style={{ flex: 1, fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)', lineHeight: 1.3 }}>{win.win_text}</span>
                <span style={{ padding: '1px 4px', background: `${config.color}12`, border: `1px solid ${config.color}20`, borderRadius: '3px', fontSize: '0.45rem', fontWeight: '600', color: config.color, flexShrink: 0 }}>{config.label}</span>
                <button onClick={() => handleDeleteWin(win.id)}
                  style={{ padding: '2px', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.1)', cursor: 'pointer', touchAction: 'manipulation', flexShrink: 0 }}><Trash2 size={10} /></button>
              </div>
            )
          })}
          {showAddWin ? (
            <div style={{ padding: isMobile ? '0.625rem 0.75rem' : '0.625rem 1rem', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
              <textarea value={newWinText} onChange={(e) => setNewWinText(e.target.value)} placeholder="Wat was je win?" rows={2}
                style={{ width: '100%', padding: '0.4rem 0.5rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: '#fff', fontSize: '0.75rem', resize: 'none', outline: 'none', marginBottom: '0.375rem' }} />
              <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', marginBottom: '0.375rem' }}>
                {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                  <button key={key} onClick={() => setNewWinCategory(key)}
                    style={{ padding: '2px 6px', background: newWinCategory === key ? `${config.color}15` : 'transparent', border: `1px solid ${newWinCategory === key ? config.color + '40' : 'rgba(255,255,255,0.08)'}`, borderRadius: '4px', color: newWinCategory === key ? config.color : 'rgba(255,255,255,0.3)', fontSize: '0.55rem', fontWeight: '600', cursor: 'pointer', touchAction: 'manipulation' }}>
                    {config.emoji} {config.label}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '0.375rem' }}>
                <button onClick={() => { setShowAddWin(false); setNewWinText('') }}
                  style={{ flex: 1, padding: '0.4rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '5px', color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem', cursor: 'pointer', minHeight: '30px', touchAction: 'manipulation' }}>Annuleer</button>
                <button onClick={handleAddWin} disabled={!newWinText.trim()}
                  style={{ flex: 2, padding: '0.4rem', background: newWinText.trim() ? '#f59e0b' : 'rgba(245,158,11,0.2)', border: 'none', borderRadius: '5px', color: '#fff', fontSize: '0.7rem', fontWeight: '700', cursor: newWinText.trim() ? 'pointer' : 'not-allowed', minHeight: '30px', touchAction: 'manipulation' }}>Toevoegen</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowAddWin(true)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.3rem', padding: isMobile ? '0.4rem 0.75rem' : '0.4rem 1rem', background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.2)', fontSize: '0.6rem', fontWeight: '600', touchAction: 'manipulation', minHeight: '32px' }}>
              <Plus size={10} /> Win toevoegen
            </button>
          )}
        </div>
      )}

      {/* ═══ SECTION: VOLTOOID ═══ */}
      {activeSection === 'history' && (
        <div>
          {completedTasks.length === 0 ? (
            <div style={{ padding: '1.5rem 1rem', textAlign: 'center', color: 'rgba(255,255,255,0.15)', fontSize: '0.7rem' }}>Nog geen voltooide tasks deze week</div>
          ) : completedTasks.map(task => {
            const priorityColor = task.priority === 'high' ? '#ef4444' : task.priority === 'low' ? '#22c55e' : '#f59e0b'
            const steps = Array.isArray(task.steps) ? task.steps : []
            return (
              <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: isMobile ? '0.45rem 0.75rem' : '0.45rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.03)', borderLeft: `3px solid ${priorityColor}25` }}>
                <CheckCircle size={12} color="#10b981" style={{ flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'rgba(255,255,255,0.7)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</div>
                  {steps.length > 0 && <div style={{ fontSize: '0.45rem', color: 'rgba(255,255,255,0.2)' }}>{steps.filter(s => s.done).length}/{steps.length} stappen</div>}
                </div>
                <span style={{ fontSize: '0.45rem', color: 'rgba(255,255,255,0.2)', flexShrink: 0 }}>{formatDate(task.completed_at)}</span>
              </div>
            )
          })}
        </div>
      )}

      {/* ═══ SECTION: RAPPORT ═══ */}
      {activeSection === 'report' && (
        <div>
          {!currentWeekReport && reports.length === 0 ? (
            <div style={{ padding: '1.5rem 1rem', textAlign: 'center' }}>
              <div style={{ color: 'rgba(255,255,255,0.15)', fontSize: '0.7rem', marginBottom: '0.75rem' }}>Nog geen rapport gegenereerd</div>
              <button onClick={handleGenerateReport} disabled={generating}
                style={{ padding: '0.5rem 0.875rem', background: '#8b5cf6', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '0.7rem', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', minHeight: '32px', touchAction: 'manipulation' }}>
                <Sparkles size={11} /> Rapport genereren
              </button>
            </div>
          ) : (() => {
            const r = currentWeekReport || reports[0]
            const d = r?.report_data || {}
            return (
              <div>
                {/* Stats strip */}
                <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  {[
                    { label: 'VOLTOOID',    value: d.summary?.totalCompleted ?? 0,                                              color: '#10b981' },
                    { label: 'GEM. RATING', value: d.summary?.averageRating ? `${d.summary.averageRating}★` : '–',              color: '#f59e0b' },
                    { label: 'DOELEN',      value: `${goalsDone}/${weekGoals.length}`,                                          color: '#3b82f6' },
                    { label: 'WINS',        value: d.summary?.manualWinsCount ?? 0,                                             color: '#8b5cf6' }
                  ].map((stat, i, arr) => (
                    <div key={stat.label} style={{ flex: 1, padding: '0.625rem 0.25rem', textAlign: 'center', borderRight: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                      <div style={{ fontSize: isMobile ? '1rem' : '1.1rem', fontWeight: '800', color: stat.color }}>{stat.value}</div>
                      <div style={{ fontSize: '0.38rem', fontWeight: '700', color: 'rgba(255,255,255,0.15)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</div>
                    </div>
                  ))}
                </div>

                {/* Doelen + subtasks */}
                {weekGoals.length > 0 && (
                  <div style={{ padding: isMobile ? '0.5rem 0.75rem' : '0.5rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ fontSize: '0.45rem', fontWeight: '700', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <Target size={8} /> WEEKDOELEN
                    </div>
                    {weekGoals.map(g => {
                      const subs = g.subtasks || []
                      const subsDone = subs.filter(s => s.done).length
                      return (
                        <div key={g.id} style={{ marginBottom: '0.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.2rem' }}>
                            {g.done ? <CheckCircle size={11} color="#10b981" /> : <div style={{ width: '11px', height: '11px', border: '1.5px solid rgba(255,255,255,0.15)', borderRadius: '3px' }} />}
                            <span style={{ fontSize: '0.68rem', fontWeight: '700', color: g.done ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.8)', textDecoration: g.done ? 'line-through' : 'none' }}>{g.text}</span>
                            {subs.length > 0 && <span style={{ fontSize: '0.45rem', color: 'rgba(255,255,255,0.2)', marginLeft: 'auto' }}>{subsDone}/{subs.length}</span>}
                          </div>
                          {subs.length > 0 && (
                            <div style={{ paddingLeft: '1rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              {subs.map(s => (
                                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                  {s.done ? <Check size={9} color="#10b981" /> : <div style={{ width: '9px', height: '9px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '2px' }} />}
                                  <span style={{ fontSize: '0.6rem', color: s.done ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.55)', textDecoration: s.done ? 'line-through' : 'none' }}>{s.text}</span>
                                  {s.taskId && <span style={{ fontSize: '0.38rem', color: s.done ? '#10b981' : '#f59e0b', marginLeft: '2px' }}>{s.done ? '✓' : '⚡'}</span>}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                    <div style={{ marginTop: '0.375rem', fontSize: '0.5rem', fontWeight: '700', color: goalsProgress === 100 ? '#10b981' : '#f59e0b' }}>
                      {goalsDone}/{weekGoals.length} doelen behaald ({goalsProgress}%)
                    </div>
                  </div>
                )}

                {/* Voltooide tasks */}
                {d.completedTasks?.length > 0 && (
                  <div style={{ padding: isMobile ? '0.5rem 0.75rem' : '0.5rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ fontSize: '0.45rem', fontWeight: '700', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <CheckCircle size={8} color="#10b981" /> VOLTOOIDE TASKS
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                      {d.completedTasks.map((t, i) => (
                        <span key={i} style={{ padding: '1px 6px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '3px', color: '#10b981', fontSize: '0.55rem' }}>{t.title}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Eerdere rapporten */}
                {reports.length > 1 && (
                  <div>
                    <button onClick={() => setShowPreviousReports(!showPreviousReports)}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: isMobile ? '0.4rem 0.75rem' : '0.4rem 1rem', background: 'transparent', border: 'none', borderTop: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer', color: 'rgba(255,255,255,0.25)', fontSize: '0.55rem', fontWeight: '600', minHeight: '32px', touchAction: 'manipulation' }}>
                      <span>Eerdere rapporten ({reports.length - 1})</span>
                      {showPreviousReports ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                    </button>
                    {showPreviousReports && reports.slice(1).map(rep => (
                      <div key={rep.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: isMobile ? '0.4rem 0.75rem' : '0.4rem 1rem', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
                        <div>
                          <div style={{ fontSize: '0.65rem', fontWeight: '600', color: 'rgba(255,255,255,0.5)' }}>{formatWeekRange(rep.week_start, rep.week_end)}</div>
                          <div style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.2)' }}>{rep.report_data?.summary?.totalCompleted ?? 0} tasks</div>
                        </div>
                        <FileText size={11} color="rgba(255,255,255,0.15)" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })()}
        </div>
      )}

      {/* ═══ KANBAN SECTION PICKER (portal) ═══ */}
      {kanbanPickerFor && createPortal(
        <div onClick={() => setKanbanPickerFor(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '1.5rem' }}>
          <div onClick={(e) => e.stopPropagation()}
            style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', width: '100%', maxWidth: '320px', overflow: 'hidden' }}>
            <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#fff' }}>Naar welke sectie?</span>
              <button onClick={() => setKanbanPickerFor(null)}
                style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '5px', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>
                <X size={12} />
              </button>
            </div>
            {(kanbanSections.filter(s => s.id !== 'unassigned').length === 0) && (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '0.7rem' }}>Geen secties gevonden</div>
            )}
            {kanbanSections.filter(s => s.id !== 'unassigned').map(section => (
              <button key={section.id}
                onClick={() => handleSendToKanban(kanbanPickerFor.goalId, kanbanPickerFor.subtaskId, section.id)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.03)', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
                onMouseEnter={(e) => e.currentTarget.style.background = `${section.color}10`}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: section.color, flexShrink: 0 }} />
                <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'rgba(255,255,255,0.7)' }}>{section.title}</span>
                <span style={{ marginLeft: 'auto', fontSize: '0.5rem', color: 'rgba(255,255,255,0.2)' }}>{section.tasks?.length || 0} taken</span>
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}

      <style>{`@keyframes wwSpin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
