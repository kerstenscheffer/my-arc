// src/modules/productivity/components/kanban/AddTaskModal.jsx
// VERSION 2.0 - Styling guide compliant + stappen toevoegen bij aanmaken

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Calendar, Flag, Tag, FileText, Clock, Plus, Circle, Trash2, Timer } from 'lucide-react'

const genId = () => Math.random().toString(36).slice(2, 9)

export default function AddTaskModal({ isMobile, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    category: '',
    deadline: '',
    needs_reflection: true,
    estimated_minutes: ''
  })
  const [steps, setSteps] = useState([])
  const [newStepText, setNewStepText] = useState('')
  const [titleError, setTitleError] = useState(false)

  const handleAddStep = () => {
    const text = newStepText.trim()
    if (!text) return
    setSteps(prev => [...prev, { id: genId(), text, done: false }])
    setNewStepText('')
  }

  const handleDeleteStep = (id) => setSteps(prev => prev.filter(s => s.id !== id))

  const handleSubmit = () => {
    if (!formData.title.trim()) { setTitleError(true); return }
    onSubmit({ ...formData, steps })
  }

  return createPortal(
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', zIndex: 10000, padding: isMobile ? '0' : '1.5rem' }}
    >
      <div style={{
        background: '#0a0a0a',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: isMobile ? '12px 12px 0 0' : '12px',
        width: '100%',
        maxWidth: isMobile ? '100%' : '480px',
        maxHeight: isMobile ? '92vh' : '85vh',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden'
      }}>

        {/* ═══ HEADER ═══ */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: isMobile ? '0.75rem 1rem' : '0.75rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
            <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#fff' }}>Nieuwe Task</span>
          </div>
          <button onClick={onClose} style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', touchAction: 'manipulation' }}>
            <X size={13} />
          </button>
        </div>

        {/* ═══ FORM ═══ */}
        <div style={{ overflowY: 'auto', flex: 1 }}>

          {/* Titel */}
          <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ fontSize: '0.45rem', fontWeight: '700', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>TITEL *</div>
            <input
              autoFocus
              type="text"
              value={formData.title}
              onChange={(e) => { setFormData({ ...formData, title: e.target.value }); setTitleError(false) }}
              placeholder="Wat moet je doen?"
              style={{ width: '100%', padding: '0.4rem 0', background: 'transparent', border: 'none', borderBottom: `1px solid ${titleError ? '#ef4444' : 'rgba(255,255,255,0.1)'}`, outline: 'none', color: '#fff', fontSize: '0.9rem', fontWeight: '700' }}
            />
            {titleError && <p style={{ margin: '0.3rem 0 0 0', color: '#ef4444', fontSize: '0.6rem' }}>Titel is verplicht</p>}
          </div>

          {/* Beschrijving */}
          <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ fontSize: '0.45rem', fontWeight: '700', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>BESCHRIJVING</div>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Extra details (optioneel)"
              rows={2}
              style={{ width: '100%', padding: 0, background: 'transparent', border: 'none', outline: 'none', color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', resize: 'none', lineHeight: 1.5 }}
            />
          </div>

          {/* Prioriteit + Categorie */}
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ flex: 1, padding: '0.625rem 1rem', borderRight: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ fontSize: '0.45rem', fontWeight: '700', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '3px' }}><Flag size={8} /> PRIORITEIT</div>
              <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer' }}>
                <option value="low">🟢 Laag</option>
                <option value="medium">🟡 Medium</option>
                <option value="high">🔴 Hoog</option>
              </select>
            </div>
            <div style={{ flex: 1, padding: '0.625rem 1rem' }}>
              <div style={{ fontSize: '0.45rem', fontWeight: '700', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '3px' }}><Tag size={8} /> CATEGORIE</div>
              <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer' }}>
                <option value="">Geen</option>
                <option value="werk">💼 Werk</option>
                <option value="prive">🏠 Privé</option>
                <option value="myarc">💪 MY ARC</option>
                <option value="gezondheid">❤️ Gezondheid</option>
              </select>
            </div>
          </div>

          {/* Deadline */}
          <div style={{ padding: '0.625rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ fontSize: '0.45rem', fontWeight: '700', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '3px' }}><Calendar size={8} /> DEADLINE</div>
            <input type="date" value={formData.deadline} onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              style={{ background: 'transparent', border: 'none', outline: 'none', color: formData.deadline ? '#fff' : 'rgba(255,255,255,0.3)', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer' }} />
          </div>

          {/* ═══ STAPPEN ═══ */}
          <div style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            {/* Stappen header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.625rem 1rem', borderBottom: steps.length > 0 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
              <div style={{ fontSize: '0.45rem', fontWeight: '700', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Circle size={8} /> STAPPEN
                {steps.length > 0 && <span style={{ color: '#10b981', marginLeft: '4px' }}>{steps.length}</span>}
              </div>
            </div>

            {/* Stappen lijst */}
            {steps.map((step, i) => (
              <div key={step.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                <div style={{ width: '16px', height: '16px', border: '1.5px solid rgba(255,255,255,0.12)', borderRadius: '3px', flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: '0.45rem', fontWeight: '700', color: 'rgba(255,255,255,0.2)', minWidth: '20px' }}>#{i + 1}</span>
                <span style={{ flex: 10, fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.3 }}>{step.text}</span>
                <button onClick={() => handleDeleteStep(step.id)}
                  style={{ padding: '2px', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.15)', cursor: 'pointer', touchAction: 'manipulation', flexShrink: 0 }}>
                  <Trash2 size={10} />
                </button>
              </div>
            ))}

            {/* Geschatte tijd */}
          <div style={{ padding: '0.625rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ fontSize: '0.45rem', fontWeight: '700', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '3px' }}><Timer size={8} /> GESCHATTE TIJD</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              {[15, 25, 30, 45, 60].map(p => (
                <button key={p} onClick={() => setFormData({ ...formData, estimated_minutes: p })}
                  style={{ padding: '0.2rem 0.4rem', background: formData.estimated_minutes === p ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${formData.estimated_minutes === p ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.06)'}`, borderRadius: '4px', color: formData.estimated_minutes === p ? '#10b981' : 'rgba(255,255,255,0.3)', fontSize: '0.6rem', fontWeight: '700', cursor: 'pointer', touchAction: 'manipulation', minHeight: '26px' }}>
                  {p}m
                </button>
              ))}
              <input type="number" min="1" max="480" placeholder="Eigen" value={formData.estimated_minutes || ''}
                onChange={(e) => setFormData({ ...formData, estimated_minutes: e.target.value ? parseInt(e.target.value) : '' })}
                style={{ width: '52px', padding: '0.2rem 0.375rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '4px', color: '#fff', fontSize: '0.7rem', outline: 'none', minHeight: '26px' }}
              />
            </div>
          </div>

          {/* Stap invoer */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 1rem' }}>
              <div style={{ width: '16px', height: '16px', border: '1.5px dashed rgba(255,255,255,0.1)', borderRadius: '3px', flexShrink: 0 }} />
              <input
                type="text"
                value={newStepText}
                onChange={(e) => setNewStepText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddStep() } }}
                placeholder="Stap toevoegen... (Enter)"
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: '0.75rem', padding: '0.2rem 0' }}
              />
              {newStepText.trim() && (
                <button onClick={handleAddStep}
                  style={{ padding: '2px 6px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '3px', color: '#10b981', fontSize: '0.5rem', fontWeight: '700', cursor: 'pointer', touchAction: 'manipulation', minHeight: '20px' }}>
                  <Plus size={9} />
                </button>
              )}
            </div>
          </div>

          {/* Reflectie toggle */}
          <div style={{ padding: '0.625rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.4rem 0.5rem', background: formData.needs_reflection ? 'rgba(139,92,246,0.08)' : 'transparent', border: `1px solid ${formData.needs_reflection ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.06)'}`, borderRadius: '6px' }}>
              <input type="checkbox" checked={formData.needs_reflection} onChange={(e) => setFormData({ ...formData, needs_reflection: e.target.checked })} style={{ accentColor: '#8b5cf6' }} />
              <Clock size={10} color={formData.needs_reflection ? '#8b5cf6' : 'rgba(255,255,255,0.3)'} />
              <span style={{ color: formData.needs_reflection ? '#a78bfa' : 'rgba(255,255,255,0.4)', fontSize: '0.7rem', fontWeight: '600' }}>
                Reflectie na voltooien
              </span>
            </label>
          </div>
        </div>

        {/* ═══ FOOTER ACTIONS ═══ */}
        <div style={{ display: 'flex', gap: '0.5rem', padding: '0.75rem 1rem', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          <button onClick={onClose}
            style={{ flex: 1, padding: '0.6rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer', minHeight: '40px', touchAction: 'manipulation' }}>
            Annuleer
          </button>
          <button onClick={handleSubmit}
            style={{ flex: 2, padding: '0.6rem', background: '#10b981', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer', minHeight: '40px', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}>
            <Plus size={13} />
            Task Toevoegen{steps.length > 0 ? ` + ${steps.length} stap${steps.length > 1 ? 'pen' : ''}` : ''}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
