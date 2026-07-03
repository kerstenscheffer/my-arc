// src/modules/productivity/components/WeekGoalsManager.jsx
// CRUD UI for the weekly goals that show up in the WeekGoalsBar overlay.
// Lives inside ProductivityHub. Uses WeekGoalsService for persistence.

import { useEffect, useState } from 'react'
import { Plus, Trash2, Target, Calendar, Pencil, Save, X, Copy, BarChart3 } from 'lucide-react'
import WeekGoalsService from '../WeekGoalsService'
import WeekGoalsStatsModal from './WeekGoalsStatsModal'

// Tells the always-on WeekGoalsBar to reload itself — no hard refresh needed.
const notifyGoalsChanged = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('myarc:weekly-goals-updated'))
  }
}

const GOLD = '#FFD700'

const LEADKANBAN_SOURCES = [
  { key: 'newOutreach',    label: 'Nieuwe outreach (call_leads created)' },
  { key: 'callProposed',   label: 'Calls voorgesteld (sectie)' },
  { key: 'callScheduled',  label: 'Calls ingepland (sectie)' },
  { key: 'sale',           label: 'Sales / closes (sectie)' },
  { key: 'noShow',         label: 'No shows (sectie)' },
]

const blankDraft = () => ({
  label: '',
  target: 10,
  period: 'weekly',
  source: 'manual',
  source_key: '',
})

export default function WeekGoalsManager({ db, coachId, isMobile: propMobile }) {
  const isMobile = propMobile ?? (typeof window !== 'undefined' && window.innerWidth <= 768)
  const [service] = useState(() => new WeekGoalsService(db))
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [draft, setDraft] = useState(blankDraft())
  const [showNew, setShowNew] = useState(false)
  const [showStats, setShowStats] = useState(false)

  const weekStart = WeekGoalsService.weekISO(new Date())

  const load = async () => {
    if (!coachId) return
    setLoading(true)
    try {
      const data = await service.getGoalsForWeek(coachId, weekStart)
      setGoals(data)
    } finally { setLoading(false) }
  }
  useEffect(() => { load() /* eslint-disable-next-line */ }, [coachId, weekStart])

  const startNew = () => { setDraft(blankDraft()); setShowNew(true); setEditingId(null) }
  const startEdit = (g) => {
    setDraft({
      label: g.label, target: g.target,
      period: g.period, source: g.source,
      source_key: g.source_key || '',
    })
    setEditingId(g.id); setShowNew(false)
  }
  const cancelEdit = () => { setShowNew(false); setEditingId(null); setDraft(blankDraft()) }

  const handleSave = async () => {
    if (!draft.label.trim()) return
    const payload = {
      ...draft,
      label: draft.label.trim(),
      target: Number(draft.target) || 1,
      week_start: weekStart,
      source_key: draft.source === 'leadkanban' ? (draft.source_key || 'newOutreach') : null,
    }
    try {
      if (editingId) {
        await service.updateGoal(editingId, payload)
      } else {
        await service.createGoal(coachId, { ...payload, position: goals.length })
      }
      cancelEdit()
      load()
      notifyGoalsChanged()
    } catch (e) {
      alert('Opslaan mislukt — ' + (e?.message || e))
    }
  }

  const handleDelete = async (g) => {
    if (!window.confirm(`Doel "${g.label}" verwijderen?`)) return
    try { await service.deleteGoal(g.id); load(); notifyGoalsChanged() }
    catch (e) { alert('Verwijderen mislukt — ' + (e?.message || e)) }
  }

  const handleDuplicatePrevWeek = async () => {
    const m = new Date(weekStart); m.setDate(m.getDate() - 7)
    const prevStr = WeekGoalsService.weekISO(m)
    if (!window.confirm(`Doelen van vorige week (${prevStr}) overnemen?`)) return
    try {
      await service.duplicateWeek(coachId, prevStr, weekStart)
      load()
      notifyGoalsChanged()
    } catch (e) {
      alert('Overnemen mislukt — ' + (e?.message || e))
    }
  }

  return (
    <div style={{
      background: '#0a0a0a',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 10,
      padding: isMobile ? '0.85rem 0.9rem' : '1rem 1.2rem',
      marginBottom: '1rem',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
        <Target size={15} color={GOLD} />
        <div style={{
          flex: 1, color: '#fff', fontWeight: 800,
          fontSize: isMobile ? '0.9rem' : '1rem',
          letterSpacing: '-0.005em',
        }}>
          Doelen deze week
        </div>
        <div style={{
          fontSize: '0.6rem', fontWeight: 700,
          color: 'rgba(255,255,255,0.4)',
          letterSpacing: '0.06em', textTransform: 'uppercase',
        }}>
          <Calendar size={10} style={{ verticalAlign: '-1px', marginRight: 3 }} />
          Week {weekStart}
        </div>
      </div>

      {/* Add / dup / stats row */}
      {!showNew && !editingId && (
        <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.55rem', flexWrap: 'wrap' }}>
          <button onClick={startNew} style={primaryBtn}>
            <Plus size={13} /> Nieuw doel
          </button>
          <button onClick={handleDuplicatePrevWeek} style={secondaryBtn} title="Doelen uit vorige week kopiëren">
            <Copy size={13} /> Kopieer vorige week
          </button>
          <button onClick={() => setShowStats(true)} style={secondaryBtn} title="Bekijk hoe vorige weken zijn gegaan">
            <BarChart3 size={13} /> Stats vorige weken
          </button>
        </div>
      )}

      {/* Editor */}
      {(showNew || editingId) && (
        <div style={{
          background: 'rgba(255,215,0,0.05)',
          border: '1px solid rgba(255,215,0,0.25)',
          borderRadius: 8,
          padding: '0.7rem',
          marginBottom: '0.6rem',
          display: 'flex', flexDirection: 'column', gap: '0.55rem',
        }}>
          <div>
            <label style={labelStyle}>Label</label>
            <input
              autoFocus
              value={draft.label}
              onChange={(e) => setDraft(d => ({ ...d, label: e.target.value }))}
              placeholder="bv. 100 outreach per dag"
              style={inputStyle}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Target</label>
              <input
                type="number" min="1"
                value={draft.target}
                onChange={(e) => setDraft(d => ({ ...d, target: e.target.value }))}
                style={inputStyle}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Periode</label>
              <select
                value={draft.period}
                onChange={(e) => setDraft(d => ({ ...d, period: e.target.value }))}
                style={inputStyle}
              >
                <option value="weekly">Per week</option>
                <option value="daily">Per dag</option>
              </select>
            </div>
          </div>
          <div>
            <label style={labelStyle}>Bron</label>
            <select
              value={draft.source}
              onChange={(e) => setDraft(d => ({
                ...d,
                source: e.target.value,
                source_key: e.target.value === 'leadkanban' ? (d.source_key || 'newOutreach') : '',
              }))}
              style={inputStyle}
            >
              <option value="manual">Handmatig (+/− knoppen)</option>
              <option value="leadkanban">Lead Kanban (auto-tracking)</option>
            </select>
          </div>
          {draft.source === 'leadkanban' && (
            <div>
              <label style={labelStyle}>Kanban-meting</label>
              <select
                value={draft.source_key}
                onChange={(e) => setDraft(d => ({ ...d, source_key: e.target.value }))}
                style={inputStyle}
              >
                {LEADKANBAN_SOURCES.map(s => (
                  <option key={s.key} value={s.key}>{s.label}</option>
                ))}
              </select>
            </div>
          )}
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button onClick={cancelEdit} style={secondaryBtn}>
              <X size={13} /> Annuleren
            </button>
            <button
              onClick={handleSave}
              style={{ ...primaryBtn, opacity: draft.label.trim() ? 1 : 0.4, cursor: draft.label.trim() ? 'pointer' : 'not-allowed' }}
              disabled={!draft.label.trim()}
            >
              <Save size={13} /> Opslaan
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div style={{ padding: '1rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>
          Laden…
        </div>
      ) : goals.length === 0 ? (
        <div style={{
          padding: '1rem', textAlign: 'center',
          border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 8,
          color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem',
        }}>
          Nog geen doelen voor deze week. Klik <strong>Nieuw doel</strong> om te beginnen.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {goals.map(g => (
            <div key={g.id} style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.55rem 0.65rem',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 8,
              background: 'rgba(255,255,255,0.025)',
            }}>
              <Target size={13} color={GOLD} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  color: '#fff', fontWeight: 700, fontSize: '0.82rem',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {g.label}
                </div>
                <div style={{
                  fontSize: '0.6rem', fontWeight: 700,
                  color: 'rgba(255,255,255,0.4)', marginTop: 1,
                }}>
                  Target {g.target} · {g.period === 'daily' ? 'per dag' : 'per week'} · {g.source === 'leadkanban' ? `auto (${g.source_key})` : 'handmatig'}
                </div>
              </div>
              <button onClick={() => startEdit(g)} style={iconBtnStyle} title="Bewerken">
                <Pencil size={12} />
              </button>
              <button onClick={() => handleDelete(g)} style={{ ...iconBtnStyle, color: 'rgba(239,68,68,0.7)' }} title="Verwijderen">
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {showStats && (
        <WeekGoalsStatsModal
          db={db}
          coachId={coachId}
          isMobile={isMobile}
          onClose={() => setShowStats(false)}
        />
      )}
    </div>
  )
}

const labelStyle = {
  display: 'block',
  fontSize: '0.6rem', fontWeight: 700,
  color: 'rgba(255,255,255,0.5)',
  letterSpacing: '0.05em', textTransform: 'uppercase',
  marginBottom: 4,
}
const inputStyle = {
  width: '100%', boxSizing: 'border-box',
  padding: '0.45rem 0.6rem', minHeight: 38,
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6,
  color: '#fff', fontSize: '0.85rem', fontWeight: 600,
  outline: 'none',
}
const primaryBtn = {
  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
  padding: '0.45rem 0.7rem', minHeight: 38,
  background: GOLD, border: 'none', borderRadius: 6,
  color: '#000', fontSize: '0.78rem', fontWeight: 800,
  cursor: 'pointer', touchAction: 'manipulation',
}
const secondaryBtn = {
  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
  padding: '0.45rem 0.7rem', minHeight: 38,
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 6, color: 'rgba(255,255,255,0.75)',
  fontSize: '0.75rem', fontWeight: 700,
  cursor: 'pointer', touchAction: 'manipulation',
}
const iconBtnStyle = {
  width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'transparent', border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 6, color: 'rgba(255,255,255,0.6)',
  cursor: 'pointer', touchAction: 'manipulation',
}
