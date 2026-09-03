// src/modules/faq/CoachFAQManager.jsx
import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useModalHost } from '../../coach/ModalHost'
import { HelpCircle, Plus, Trash2, Edit2, Save, X, ChevronRight } from 'lucide-react'
import FAQService from './FAQService'

const DEEPLINK_OPTIONS = [
  { value: '',         label: 'Geen' },
  { value: 'home',     label: 'Home' },
  { value: 'workout',  label: 'Workout' },
  { value: 'mealplan', label: 'Maaltijdplan' },
  { value: 'progress', label: 'Progress' },
  { value: 'calls',    label: 'Calls' },
  { value: 'profile',  label: 'Profiel' },
]

const EMPTY_FORM = { parent_id: '', label: '', answer: '', deeplink: '', hint: '', whatsapp: '', icon: 'HelpCircle' }

export default function CoachFAQManager() {
  const modalHost = useModalHost()
  const isMobile = window.innerWidth <= 768
  const [nodes, setNodes]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing]     = useState(null)
  const [form, setForm]           = useState(EMPTY_FORM)
  const [saving, setSaving]       = useState(false)
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    const data = await FAQService.getAllNodes()
    setNodes(data || [])
    setLoading(false)
  }

  const openNew = (parentId = '') => {
    setEditing(null)
    setForm({ ...EMPTY_FORM, parent_id: parentId })
    setShowModal(true)
  }

  const openEdit = (node) => {
    setEditing(node)
    setForm({ parent_id: node.parent_id || '', label: node.label, answer: node.answer || '', deeplink: node.deeplink || '', hint: node.hint || '', whatsapp: node.whatsapp || '', icon: node.icon || 'HelpCircle' })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.label.trim()) return
    setSaving(true)
    if (editing) {
      await FAQService.updateNode(editing.id, form)
    } else {
      await FAQService.createNode({ ...form, parent_id: form.parent_id || null })
    }
    setShowModal(false)
    await load()
    setSaving(false)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Node verwijderen? Alle children worden ook verborgen.')) return
    await FAQService.deleteNode(id)
    await load()
  }

  // Groepeer: roots + children per parent
  const roots    = nodes.filter(n => !n.parent_id)
  const childMap = nodes.reduce((acc, n) => {
    if (n.parent_id) { if (!acc[n.parent_id]) acc[n.parent_id] = []; acc[n.parent_id].push(n) }
    return acc
  }, {})

  // ─── MODAL ─────────────────────────────────────────────────────────────────
  const modal = showModal ? createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center' }}>
      <div style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: isMobile ? '12px 12px 0 0' : '12px', width: isMobile ? '100%' : '500px', maxHeight: isMobile ? '90vh' : '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '0.875rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          <span style={{ flex: 1, color: '#fff', fontWeight: '700', fontSize: '0.9rem' }}>{editing ? 'Node bewerken' : 'Nieuwe node'}</span>
          <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={16} color='rgba(255,255,255,0.4)' /></button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Field label='Parent node (leeg = top-level)'>
            <select value={form.parent_id} onChange={e => setForm(f => ({ ...f, parent_id: e.target.value }))} style={selectStyle}>
              <option value=''>— Top-level categorie —</option>
              {nodes.map(n => <option key={n.id} value={n.id}>{n.label}</option>)}
            </select>
          </Field>
          <Field label='Label (knoptekst) *'>
            <input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} placeholder='bijv. Hoe start ik mijn workout?' style={inputStyle} />
          </Field>
          <Field label='Antwoord (leeg = geen eindknoop)'>
            <textarea value={form.answer} onChange={e => setForm(f => ({ ...f, answer: e.target.value }))} placeholder='Laat leeg als deze node nog children krijgt...' rows={4} style={{ ...inputStyle, resize: 'vertical', minHeight: '72px' }} />
          </Field>
          <Field label='Icon naam (Lucide)'>
            <input value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} placeholder='bijv. Dumbbell, Utensils, Scale...' style={inputStyle} />
          </Field>
          <Field label='Deeplink'>
            <select value={form.deeplink} onChange={e => setForm(f => ({ ...f, deeplink: e.target.value }))} style={selectStyle}>
              {DEEPLINK_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
          <Field label='Hint tekst (op deeplink knop)'>
            <input value={form.hint} onChange={e => setForm(f => ({ ...f, hint: e.target.value }))} placeholder='bijv. Ga naar Workout → Start workout' style={inputStyle} />
          </Field>
          <Field label='WhatsApp prefill'>
            <input value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))} placeholder='bijv. Hoi! Ik heb een vraag over: ' style={inputStyle} />
          </Field>
        </div>
        <div style={{ padding: '0.875rem 1rem', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
          <button onClick={() => setShowModal(false)} style={btnSecondary}>Annuleer</button>
          <button onClick={handleSave} disabled={saving || !form.label.trim()} style={{ ...btnPrimary, opacity: !form.label.trim() ? 0.4 : 1 }}>
            <Save size={13} />{saving ? 'Opslaan...' : 'Opslaan'}
          </button>
        </div>
      </div>
    </div>,
    modalHost
  ) : null

  // ─── RENDER ────────────────────────────────────────────────────────────────
  return (
    <>
      {modal}
      <div style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', padding: isMobile ? '0.625rem 0.75rem' : '0.75rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <HelpCircle size={13} color='#FFD700' style={{ marginRight: '0.375rem' }} />
          <span style={{ flex: 1, color: '#fff', fontWeight: '700', fontSize: '0.9rem' }}>FAQ Beheer</span>
          <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.65rem', marginRight: '0.75rem' }}>{nodes.length} nodes</span>
          <button onClick={() => openNew()} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.625rem', height: 28, background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.25)', borderRadius: '6px', cursor: 'pointer', color: '#FFD700', fontSize: '0.7rem', fontWeight: '700', touchAction: 'manipulation' }}>
            <Plus size={11} /> Nieuwe node
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '1.5rem', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '0.75rem' }}>Laden...</div>
        ) : (
          roots.map((root, ri) => (
            <div key={root.id} style={{ borderBottom: ri < roots.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
              {/* Root node */}
              <div style={{ display: 'flex', alignItems: 'center', padding: isMobile ? '0.625rem 0.75rem' : '0.7rem 1rem', gap: '0.5rem' }}>
                <button onClick={() => setExpandedId(expandedId === root.id ? null : root.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', touchAction: 'manipulation' }}>
                  <ChevronRight size={13} color='rgba(255,215,0,0.5)' style={{ transform: expandedId === root.id ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s ease' }} />
                </button>
                <span style={{ flex: 1, color: '#FFD700', fontSize: '0.82rem', fontWeight: '700' }}>{root.label}</span>
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  <button onClick={() => openNew(root.id)} style={{ ...iconBtn, color: 'rgba(255,215,0,0.5)' }} title='Child toevoegen'><Plus size={12} color='rgba(255,215,0,0.5)' /></button>
                  <button onClick={() => openEdit(root)} style={iconBtn}><Edit2 size={12} color='rgba(255,255,255,0.35)' /></button>
                  <button onClick={() => handleDelete(root.id)} style={iconBtn}><Trash2 size={12} color='rgba(239,68,68,0.5)' /></button>
                </div>
              </div>

              {/* Children */}
              {expandedId === root.id && (childMap[root.id] || []).map(child => (
                <div key={child.id}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', padding: isMobile ? '0.5rem 0.75rem 0.5rem 2rem' : '0.55rem 1rem 0.55rem 2.25rem', gap: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.03)', background: 'rgba(255,255,255,0.01)' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: '#fff', fontSize: '0.775rem', fontWeight: '600', marginBottom: child.answer ? '0.2rem' : 0 }}>{child.label}</div>
                      {child.answer && <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.68rem', lineHeight: 1.4 }}>{child.answer.substring(0, 60)}...</div>}
                      {/* grandchildren count */}
                      {childMap[child.id]?.length > 0 && (
                        <div style={{ color: 'rgba(255,215,0,0.35)', fontSize: '0.6rem', marginTop: '0.15rem' }}>{childMap[child.id].length} sub-vragen</div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '0.2rem', flexShrink: 0 }}>
                      <button onClick={() => openNew(child.id)} style={iconBtn} title='Child toevoegen'><Plus size={11} color='rgba(255,215,0,0.4)' /></button>
                      <button onClick={() => openEdit(child)} style={iconBtn}><Edit2 size={11} color='rgba(255,255,255,0.3)' /></button>
                      <button onClick={() => handleDelete(child.id)} style={iconBtn}><Trash2 size={11} color='rgba(239,68,68,0.45)' /></button>
                    </div>
                  </div>

                  {/* Grandchildren */}
                  {(childMap[child.id] || []).map(gc => (
                    <div key={gc.id} style={{ display: 'flex', alignItems: 'flex-start', padding: isMobile ? '0.4rem 0.75rem 0.4rem 3rem' : '0.45rem 1rem 0.45rem 3.5rem', gap: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.02)', background: 'rgba(255,255,255,0.005)' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.72rem', fontWeight: '600', marginBottom: gc.answer ? '0.15rem' : 0 }}>{gc.label}</div>
                        {gc.answer && <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.65rem', lineHeight: 1.3 }}>{gc.answer.substring(0, 50)}...</div>}
                      </div>
                      <div style={{ display: 'flex', gap: '0.2rem', flexShrink: 0 }}>
                        <button onClick={() => openEdit(gc)} style={iconBtn}><Edit2 size={10} color='rgba(255,255,255,0.25)' /></button>
                        <button onClick={() => handleDelete(gc.id)} style={iconBtn}><Trash2 size={10} color='rgba(239,68,68,0.4)' /></button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <div style={{ fontSize: '0.45rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.2)', marginBottom: '0.3rem' }}>{label}</div>
      {children}
    </div>
  )
}

const inputStyle  = { width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '7px', padding: '0.45rem 0.7rem', color: '#fff', fontSize: '0.8rem', outline: 'none', fontFamily: 'inherit' }
const selectStyle = { ...inputStyle, appearance: 'none', cursor: 'pointer' }
const btnPrimary  = { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem', padding: '0.5rem', minHeight: '36px', background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.3)', borderRadius: '8px', cursor: 'pointer', color: '#FFD700', fontSize: '0.8rem', fontWeight: '700', touchAction: 'manipulation' }
const btnSecondary= { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem', minHeight: '36px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', touchAction: 'manipulation' }
const iconBtn     = { width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '5px', cursor: 'pointer', touchAction: 'manipulation' }
