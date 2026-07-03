// src/modules/output-planning/components/VideoBlueprint.jsx

import { useState } from 'react'
import {
  X, Check, Plus, Trash2, Film, Camera, MessageCircle,
  Save, ChevronDown, ChevronUp, Sparkles, AlertCircle,
  Video, FileText
} from 'lucide-react'
import TeleprompterModal from './TeleprompterModal'

const COLORS = {
  gold: '#FFD700',
  goldSecondary: '#D4AF37',
  blue: '#3b82f6',
}

const STEP_TYPES = {
  hook:   { label: 'HOOK',   color: '#ef4444' },
  punt:   { label: 'PUNT',   color: '#f97316' },
  fix:    { label: 'FIX',    color: '#10b981' },
  cta:    { label: 'CTA',    color: '#3b82f6' },
  broll:  { label: 'B-ROLL', color: '#8b5cf6' },
  custom: { label: 'CUSTOM', color: '#6b7280' }
}

const BROLL_TYPES = [
  { id: 'gym',            icon: '💪', color: '#ef4444' },
  { id: 'food',           icon: '🍳', color: '#f97316' },
  { id: 'tracking',       icon: '📱', color: '#3b82f6' },
  { id: 'transformation', icon: '📸', color: '#8b5cf6' },
  { id: 'lifestyle',      icon: '☀️', color: '#10b981' },
  { id: 'custom',         icon: '🎬', color: '#6b7280' }
]

// ─── FULLSCREEN SCRIPT VIEW ──────────────────────────────────────────────────
function ScriptFullscreen({ steps, onClose }) {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: '#000',
      zIndex: 2000,
      overflow: 'auto',
      WebkitOverflowScrolling: 'touch',
    }}>
      {/* Sluit knop */}
      <button
        onClick={onClose}
        style={{
          position: 'fixed',
          top: '1.25rem',
          right: '1.25rem',
          width: '34px',
          height: '34px',
          background: 'rgba(255,255,255,0.07)',
          border: 'none',
          borderRadius: '50%',
          color: 'rgba(255,255,255,0.35)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2100,
        }}
      >
        <X size={15} />
      </button>

      <div style={{
        padding: '4rem 1.75rem 6rem',
        maxWidth: '520px',
        margin: '0 auto',
      }}>
        {steps.map((step, index) => {
          const tc = STEP_TYPES[step.type] || STEP_TYPES.custom
          const isLast = index === steps.length - 1

          return (
            <div key={index} style={{ marginBottom: isLast ? 0 : '3.5rem' }}>
              {/* Type label */}
              <div style={{
                fontSize: '0.58rem',
                fontWeight: '700',
                color: tc.color,
                opacity: 0.45,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                marginBottom: '0.625rem',
              }}>
                {step.step} · {tc.label}{step.timing ? `  ${step.timing}` : ''}
              </div>

              {/* Beeld — italic, erg dimmed */}
              {step.visual && (
                <div style={{
                  fontSize: '0.78rem',
                  color: 'rgba(255,255,255,0.18)',
                  fontStyle: 'italic',
                  lineHeight: '1.5',
                  marginBottom: '0.75rem',
                }}>
                  {step.visual}
                </div>
              )}

              {/* Script tekst */}
              {step.say
                ? <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: '500', color: '#fff', lineHeight: '1.8', letterSpacing: '-0.01em' }}>{step.say}</p>
                : <p style={{ margin: 0, color: 'rgba(255,255,255,0.12)', fontSize: '1rem', fontStyle: 'italic' }}>—</p>
              }
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function VideoBlueprint({ item, onClose, onSave, db, isMobile: propIsMobile }) {
  const isMobile = propIsMobile ?? window.innerWidth <= 768

  const [scriptOpen, setScriptOpen]       = useState(false)
  const [teleprompterOpen, setTeleprompterOpen] = useState(false)
  const [editNotes, setEditNotes]         = useState(item?.edit_notes || '')
  const [steps, setSteps]                 = useState(item?.blueprint_steps || [])
  const [bRollList, setBRollList]         = useState(item?.b_roll_list || [])
  const [saving, setSaving]               = useState(false)
  const [showAddStep, setShowAddStep]     = useState(false)
  const [editingStep, setEditingStep]     = useState(null)
  const [showEditNotes, setShowEditNotes] = useState(false)
  const [showImport, setShowImport]       = useState(false)
  const [importJson, setImportJson]       = useState('')
  const [importError, setImportError]     = useState('')
  const [showAddBRoll, setShowAddBRoll]   = useState(false)
  const [newBRoll, setNewBRoll]           = useState({ type: 'gym', description: '', duration: '3s' })
  const [showChecklist, setShowChecklist] = useState(true)

  const completedSteps = steps.filter(s => s.completed).length
  const totalSteps     = steps.length
  const progress       = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0
  const completedBRoll = bRollList.filter(b => b.completed).length
  const totalBRoll     = bRollList.length
  const totalWords     = steps.reduce((sum, s) => sum + (s.say ? s.say.split(/\s+/).length : 0), 0)
  const wordColor      = totalWords <= 150 ? '#10b981' : totalWords <= 200 ? '#f97316' : '#ef4444'

  const handleImport = () => {
    setImportError('')
    try {
      const data = JSON.parse(importJson)
      if (!data.blueprint_steps || !Array.isArray(data.blueprint_steps)) { setImportError('Ongeldige JSON: blueprint_steps array ontbreekt'); return }
      if (data.edit_notes)          setEditNotes(data.edit_notes)
      if (data.blueprint_steps)     setSteps(data.blueprint_steps)
      if (data.b_roll_list)         setBRollList(data.b_roll_list)
      if (data.productie_checklist) item.productie_checklist = data.productie_checklist
      setShowImport(false); setImportJson('')
    } catch { setImportError('Ongeldige JSON format') }
  }

  const toggleStep  = async (i) => { const s = [...steps]; s[i].completed = !s[i].completed; setSteps(s); await saveBlueprint(s, bRollList) }
  const addStep     = (type) => { const s = [...steps, { step: steps.length + 1, type, timing: '', visual: '', say: '', completed: false }]; setSteps(s); setShowAddStep(false); setEditingStep(steps.length) }
  const updateStep  = (i, field, val) => { const s = [...steps]; s[i][field] = val; setSteps(s) }
  const deleteStep  = (i) => { const s = steps.filter((_, x) => x !== i); s.forEach((x, n) => x.step = n + 1); setSteps(s); setEditingStep(null) }
  const moveStep    = (i, dir) => {
    if (dir === 'up' && i === 0) return
    if (dir === 'down' && i === steps.length - 1) return
    const s = [...steps]; const j = dir === 'up' ? i - 1 : i + 1
    ;[s[i], s[j]] = [s[j], s[i]]; s.forEach((x, n) => x.step = n + 1); setSteps(s)
  }
  const addBRollItem = async () => {
    if (!newBRoll.description.trim()) return
    const it = { id: `broll_${Date.now()}`, ...newBRoll, completed: false }
    const l = [...bRollList, it]; setBRollList(l)
    setNewBRoll({ type: 'gym', description: '', duration: '3s' }); setShowAddBRoll(false)
    await saveBlueprint(steps, l)
  }
  const toggleBRoll = async (id) => { const l = bRollList.map(b => b.id === id ? { ...b, completed: !b.completed } : b); setBRollList(l); await saveBlueprint(steps, l) }
  const deleteBRoll = async (id) => { const l = bRollList.filter(b => b.id !== id); setBRollList(l); await saveBlueprint(steps, l) }

  const saveBlueprint = async (stepsToSave = steps, bRollToSave = bRollList) => {
    setSaving(true)
    try {
      await db.supabase.from('content_items').update({
        edit_notes: editNotes, blueprint_steps: stepsToSave, b_roll_list: bRollToSave,
        productie_checklist: item.productie_checklist || null, updated_at: new Date().toISOString()
      }).eq('id', item.id)
      if (onSave) onSave({ ...item, edit_notes: editNotes, blueprint_steps: stepsToSave, b_roll_list: bRollToSave, productie_checklist: item.productie_checklist })
    } catch (e) { console.error('Save failed:', e) } finally { setSaving(false) }
  }

  const handleSaveAndClose = async () => { await saveBlueprint(); onClose() }

  return (
    <>
      {scriptOpen && <ScriptFullscreen steps={steps} onClose={() => setScriptOpen(false)} />}

      <TeleprompterModal
        isOpen={teleprompterOpen}
        onClose={() => setTeleprompterOpen(false)}
        script={item?.script}
        title={item?.title}
      />


      <div style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 1000, overflow: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div style={{ minHeight: '100%', maxWidth: '600px', margin: '0 auto', background: '#0a0a0a' }}>

          {/* Gold line */}
          <div style={{ position: 'sticky', top: 0, height: '2px', background: `linear-gradient(90deg, ${COLORS.gold}, ${COLORS.goldSecondary})`, zIndex: 20 }} />

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', position: 'sticky', top: '2px', background: '#0a0a0a', borderBottom: '1px solid #1a1a1a', zIndex: 15 }}>
            <div style={{ flex: 1 }}>
              <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: '#fff', marginBottom: '0.25rem' }}>{item?.title || 'Video Blueprint'}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.7rem', color: '#666' }}>
                <Film size={12} /><span>{item?.type || 'Video'}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => setScriptOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0 0.875rem', height: '40px', background: '#fff', border: 'none', borderRadius: '8px', color: '#000', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}>
                <FileText size={14} />{!isMobile && 'Script'}
              </button>
              <button
                onClick={() => setTeleprompterOpen(true)}
                disabled={!item?.script?.trim()}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.375rem',
                  padding: '0 0.875rem', height: '40px',
                  background: item?.script?.trim() ? COLORS.gold : 'rgba(255,255,255,0.05)',
                  border: 'none', borderRadius: '8px',
                  color: item?.script?.trim() ? '#000' : 'rgba(255,255,255,0.3)',
                  fontSize: '0.75rem', fontWeight: '700',
                  cursor: item?.script?.trim() ? 'pointer' : 'not-allowed',
                }}
                title={item?.script?.trim() ? 'Teleprompter openen' : 'Vul eerst een script in'}
              >
                <Video size={14} />{!isMobile && 'Teleprompter'}
              </button>
              <button onClick={() => setShowImport(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 0.75rem', height: '40px', background: 'rgba(255,215,0,0.1)', border: `1px solid rgba(255,215,0,0.3)`, borderRadius: '8px', color: COLORS.gold, fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer', gap: '0.375rem' }}>
                <Sparkles size={14} />{!isMobile && 'AI'}
              </button>
              <button onClick={onClose} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', background: '#1a1a1a', border: 'none', borderRadius: '8px', color: '#666', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Progress */}
          <div style={{ padding: '1rem', background: '#0a0a0a', borderBottom: '1px solid #1a1a1a' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#666' }}>Voortgang</span>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.7rem', color: wordColor, fontWeight: '700' }}>{totalWords}w</span>
                <span style={{ fontSize: '0.85rem', fontWeight: '700', color: progress === 100 ? '#10b981' : COLORS.gold }}>{completedSteps}/{totalSteps}</span>
              </div>
            </div>
            <div style={{ height: '6px', background: '#1a1a1a', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: progress === 100 ? '#10b981' : `linear-gradient(90deg, ${COLORS.gold}, ${COLORS.goldSecondary})`, borderRadius: '3px', transition: 'width 0.3s ease' }} />
            </div>
          </div>

          {/* Hook */}
          {item?.hook && (
            <div style={{ margin: '1rem', padding: '1rem', background: '#0f0f0f', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Sparkles size={12} color="#ef4444" />
                <span style={{ fontSize: '0.65rem', fontWeight: '700', color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Hook</span>
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: '600', color: '#fff', lineHeight: '1.4' }}>"{item.hook}"</div>
            </div>
          )}

          {/* Script — de tekst die je in het Script-vak hebt getypt, gewoon
              zichtbaar (i.p.v. alleen achter de teleprompter). */}
          {item?.script && (
            <div style={{ margin: '1rem', padding: '1rem', background: '#0f0f0f', border: '1px solid rgba(255,215,0,0.25)', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
                <FileText size={12} color={COLORS.gold} />
                <span style={{ fontSize: '0.65rem', fontWeight: '700', color: COLORS.gold, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Script</span>
              </div>
              <div style={{ fontSize: '0.9rem', color: '#fff', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{item.script}</div>
            </div>
          )}

          {/* Productie Checklist */}
          {item?.productie_checklist && (
            <div style={{ margin: '1rem', background: '#0f0f0f', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '8px', overflow: 'hidden' }}>
              <button onClick={() => setShowChecklist(!showChecklist)} style={{ width: '100%', padding: '0.875rem 1rem', background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', color: COLORS.blue }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Film size={14} color={COLORS.blue} />
                  <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Productie Checklist</span>
                </div>
                <ChevronDown size={14} style={{ transition: 'transform 0.2s ease', transform: showChecklist ? 'rotate(180deg)' : 'rotate(0deg)' }} />
              </button>
              {showChecklist && (
                <div style={{ padding: '0 1rem 1rem', borderTop: '1px solid #1a1a1a' }}>
                  {[['locaties','📍 Locaties'],['props','🎬 Props'],['setups','📷 Camera Setups'],['b_roll_shots','🎥 B-roll Shots']].map(([key, lbl]) => {
                    const arr = item.productie_checklist[key]; if (!arr?.length) return null
                    return (
                      <div key={key} style={{ marginTop: '0.75rem' }}>
                        <div style={{ fontSize: '0.65rem', fontWeight: '700', color: '#666', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>{lbl}</div>
                        {arr.map((v, i) => <div key={i} style={{ padding: '0.5rem', background: '#0a0a0a', borderRadius: '4px', marginBottom: '0.375rem', fontSize: '0.8rem', color: '#fff' }}>• {v}</div>)}
                      </div>
                    )
                  })}
                  {item.productie_checklist.extra && (
                    <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'rgba(255,215,0,0.05)', border: '1px solid rgba(255,215,0,0.2)', borderRadius: '6px' }}>
                      <div style={{ fontSize: '0.65rem', fontWeight: '700', color: COLORS.gold, textTransform: 'uppercase', marginBottom: '0.375rem', letterSpacing: '0.05em' }}>💡 Extra</div>
                      <div style={{ fontSize: '0.8rem', color: '#fff', lineHeight: '1.4' }}>{item.productie_checklist.extra}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Steps */}
          <div style={{ padding: '0 1rem 1rem' }}>
            <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '0.75rem', fontWeight: '700', color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Stappen</h3>
            {steps.length === 0 ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', background: '#0f0f0f', borderRadius: '8px' }}>
                <AlertCircle size={28} color="#333" style={{ marginBottom: '0.5rem' }} />
                <div style={{ fontSize: '0.8rem', color: '#666' }}>Geen stappen</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {steps.map((step, index) => {
                  const tc = STEP_TYPES[step.type] || STEP_TYPES.custom
                  const isEditing = editingStep === index
                  return (
                    <div key={index}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', cursor: 'pointer' }} onClick={() => setEditingStep(isEditing ? null : index)}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                          <div style={{ width: '20px', height: '20px', borderRadius: '4px', background: `${tc.color}30`, border: `1px solid ${tc.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: '700', color: tc.color }}>{step.step}</div>
                          <span style={{ fontSize: '0.75rem', fontWeight: '600', color: step.completed ? '#666' : '#999', textDecoration: step.completed ? 'line-through' : 'none' }}>{tc.label}</span>
                          {step.timing && <span style={{ fontSize: '0.65rem', color: '#555' }}>{step.timing}</span>}
                        </div>
                        <div style={{ flex: 1 }} />
                        <button onClick={(e) => { e.stopPropagation(); toggleStep(index) }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '6px', background: step.completed ? '#10b981' : 'transparent', border: step.completed ? 'none' : '2px solid #333', color: step.completed ? '#000' : 'transparent', cursor: 'pointer', flexShrink: 0 }}>
                          {step.completed && <Check size={16} strokeWidth={3} />}
                        </button>
                        <ChevronDown size={14} color="#666" style={{ transition: 'transform 0.2s ease', transform: isEditing ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                      </div>
                      {!isEditing && (step.visual || step.say) && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {step.visual && (
                            <div style={{ padding: '0.75rem', background: '#0a0a0a', border: `1px solid ${COLORS.blue}`, borderRadius: '6px' }}>
                              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                                <Camera size={14} color={COLORS.blue} style={{ marginTop: '2px', flexShrink: 0 }} />
                                <span style={{ fontSize: '0.9rem', color: COLORS.blue, lineHeight: '1.4', fontWeight: '500' }}>{step.visual}</span>
                              </div>
                            </div>
                          )}
                          {step.say && (
                            <div style={{ padding: '0.75rem', background: '#0a0a0a', border: `1px solid ${COLORS.gold}`, borderRadius: '6px' }}>
                              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                                <MessageCircle size={14} color={COLORS.gold} style={{ marginTop: '2px', flexShrink: 0 }} />
                                <span style={{ fontSize: '1rem', color: '#fff', fontWeight: '600', lineHeight: '1.4' }}>"{step.say}"</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      {isEditing && (
                        <div style={{ padding: '0.75rem', background: '#0f0f0f', borderRadius: '8px', border: '1px solid #1a1a1a' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: '600', color: '#666', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Type</label>
                              <select value={step.type} onChange={(e) => updateStep(index, 'type', e.target.value)} style={{ width: '100%', padding: '0.5rem', background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '6px', color: '#fff', fontSize: '0.8rem', outline: 'none' }}>
                                {Object.entries(STEP_TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                              </select>
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: '600', color: '#666', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Timing</label>
                              <input type="text" value={step.timing} onChange={(e) => updateStep(index, 'timing', e.target.value)} placeholder="0-3s" style={{ width: '100%', padding: '0.5rem', background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '6px', color: '#fff', fontSize: '0.8rem', outline: 'none' }} />
                            </div>
                          </div>
                          <div style={{ marginBottom: '0.75rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.65rem', fontWeight: '700', color: COLORS.blue, marginBottom: '0.375rem', textTransform: 'uppercase' }}><Camera size={10} />Beeld</label>
                            <textarea value={step.visual} onChange={(e) => updateStep(index, 'visual', e.target.value)} placeholder="Bijv: Gym, close-up, direct in camera" rows={2} style={{ width: '100%', padding: '0.625rem', background: '#0a0a0a', border: `1px solid ${COLORS.blue}`, borderRadius: '6px', color: COLORS.blue, fontSize: '0.9rem', outline: 'none', resize: 'vertical', lineHeight: '1.4', fontWeight: '500' }} />
                          </div>
                          <div style={{ marginBottom: '0.75rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.65rem', fontWeight: '700', color: COLORS.gold, marginBottom: '0.375rem', textTransform: 'uppercase' }}><MessageCircle size={10} />Tekst</label>
                            <textarea value={step.say} onChange={(e) => updateStep(index, 'say', e.target.value)} placeholder="Wat je zegt..." rows={3} style={{ width: '100%', padding: '0.625rem', background: '#0a0a0a', border: `1px solid ${COLORS.gold}`, borderRadius: '6px', color: '#fff', fontSize: '1rem', outline: 'none', resize: 'vertical', lineHeight: '1.4', fontWeight: '600' }} />
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', gap: '0.375rem' }}>
                              <button onClick={() => moveStep(index, 'up')} disabled={index === 0} style={{ width: '32px', height: '32px', background: '#1a1a1a', border: 'none', borderRadius: '6px', color: index === 0 ? '#333' : '#666', cursor: index === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChevronUp size={14} /></button>
                              <button onClick={() => moveStep(index, 'down')} disabled={index === steps.length - 1} style={{ width: '32px', height: '32px', background: '#1a1a1a', border: 'none', borderRadius: '6px', color: index === steps.length - 1 ? '#333' : '#666', cursor: index === steps.length - 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChevronDown size={14} /></button>
                            </div>
                            <button onClick={() => deleteStep(index)} style={{ padding: '0.5rem 0.75rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px', color: '#ef4444', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.375rem' }}><Trash2 size={12} />Verwijder</button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
            <div style={{ marginTop: '1rem' }}>
              {showAddStep ? (
                <div style={{ background: '#0f0f0f', borderRadius: '8px', border: '1px solid #1a1a1a', padding: '0.75rem' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: '600', color: '#666', marginBottom: '0.5rem' }}>Type:</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.375rem' }}>
                    {Object.entries(STEP_TYPES).map(([k, v]) => <button key={k} onClick={() => addStep(k)} style={{ padding: '0.5rem', background: `${v.color}20`, border: `1px solid ${v.color}`, borderRadius: '6px', color: v.color, fontSize: '0.7rem', fontWeight: '600', cursor: 'pointer', minHeight: '40px' }}>{v.label}</button>)}
                  </div>
                  <button onClick={() => setShowAddStep(false)} style={{ width: '100%', marginTop: '0.5rem', padding: '0.5rem', background: 'transparent', border: '1px solid #1a1a1a', borderRadius: '6px', color: '#666', fontSize: '0.7rem', cursor: 'pointer' }}>Annuleren</button>
                </div>
              ) : (
                <button onClick={() => setShowAddStep(true)} style={{ width: '100%', padding: '0.75rem', background: '#0f0f0f', border: '1px dashed #333', borderRadius: '8px', color: '#666', fontSize: '0.8rem', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <Plus size={16} />Stap toevoegen
                </button>
              )}
            </div>
          </div>

          {/* B-ROLL */}
          <div style={{ padding: '1rem', borderTop: '2px solid rgba(139,92,246,0.2)', background: '#0a0a0a' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Video size={14} color="#8b5cf6" />
                <h3 style={{ margin: 0, fontSize: '0.75rem', fontWeight: '700', color: '#8b5cf6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>B-Roll</h3>
              </div>
              {totalBRoll > 0 && <span style={{ fontSize: '0.7rem', fontWeight: '700', color: completedBRoll === totalBRoll ? '#10b981' : '#8b5cf6' }}>{completedBRoll}/{totalBRoll}</span>}
            </div>
            {bRollList.length === 0 ? (
              <div style={{ padding: '1.5rem 1rem', textAlign: 'center', background: '#0f0f0f', borderRadius: '8px', marginBottom: '0.75rem' }}>
                <Video size={24} color="#333" style={{ marginBottom: '0.5rem' }} />
                <div style={{ fontSize: '0.75rem', color: '#666' }}>Geen b-roll clips</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.75rem' }}>
                {bRollList.map((broll) => {
                  const tc = BROLL_TYPES.find(t => t.id === broll.type) || BROLL_TYPES[5]
                  return (
                    <div key={broll.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem', background: broll.completed ? 'rgba(16,185,129,0.1)' : '#0f0f0f', border: broll.completed ? '1px solid rgba(16,185,129,0.3)' : '1px solid #1a1a1a', borderRadius: '6px' }}>
                      <button onClick={() => toggleBRoll(broll.id)} style={{ width: '24px', height: '24px', borderRadius: '4px', background: broll.completed ? '#10b981' : 'transparent', border: broll.completed ? 'none' : '2px solid #333', color: broll.completed ? '#000' : 'transparent', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {broll.completed && <Check size={14} strokeWidth={3} />}
                      </button>
                      <div style={{ padding: '0.25rem 0.5rem', background: `${tc.color}20`, border: `1px solid ${tc.color}`, borderRadius: '4px', fontSize: '0.65rem', color: tc.color, flexShrink: 0 }}>{tc.icon}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: '600', color: broll.completed ? '#666' : '#fff', textDecoration: broll.completed ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{broll.description}</div>
                        <div style={{ fontSize: '0.65rem', color: '#666' }}>{broll.duration}</div>
                      </div>
                      <button onClick={() => deleteBRoll(broll.id)} style={{ width: '24px', height: '24px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '4px', color: '#ef4444', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={12} /></button>
                    </div>
                  )
                })}
              </div>
            )}
            {showAddBRoll ? (
              <div style={{ background: '#0f0f0f', borderRadius: '8px', border: '1px solid #1a1a1a', padding: '0.75rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.375rem', marginBottom: '0.5rem' }}>
                  {BROLL_TYPES.map(t => <button key={t.id} onClick={() => setNewBRoll({ ...newBRoll, type: t.id })} style={{ padding: '0.5rem', background: newBRoll.type === t.id ? `${t.color}30` : `${t.color}10`, border: `1px solid ${newBRoll.type === t.id ? t.color : `${t.color}50`}`, borderRadius: '6px', color: t.color, fontSize: '0.65rem', cursor: 'pointer', minHeight: '36px' }}>{t.icon}</button>)}
                </div>
                <input type="text" value={newBRoll.description} onChange={(e) => setNewBRoll({ ...newBRoll, description: e.target.value })} placeholder="Beschrijving..." style={{ width: '100%', padding: '0.625rem', background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '6px', color: '#fff', fontSize: '0.8rem', outline: 'none', marginBottom: '0.5rem' }} />
                <input type="text" value={newBRoll.duration} onChange={(e) => setNewBRoll({ ...newBRoll, duration: e.target.value })} placeholder="3s" style={{ width: '100%', padding: '0.625rem', background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '6px', color: '#fff', fontSize: '0.8rem', outline: 'none', marginBottom: '0.5rem' }} />
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => { setShowAddBRoll(false); setNewBRoll({ type: 'gym', description: '', duration: '3s' }) }} style={{ flex: 1, padding: '0.5rem', background: 'transparent', border: '1px solid #1a1a1a', borderRadius: '6px', color: '#666', fontSize: '0.75rem', cursor: 'pointer' }}>Annuleren</button>
                  <button onClick={addBRollItem} disabled={!newBRoll.description.trim()} style={{ flex: 1, padding: '0.5rem', background: newBRoll.description.trim() ? '#8b5cf6' : '#1a1a1a', border: 'none', borderRadius: '6px', color: newBRoll.description.trim() ? '#fff' : '#666', fontSize: '0.75rem', fontWeight: '600', cursor: newBRoll.description.trim() ? 'pointer' : 'not-allowed' }}>Toevoegen</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowAddBRoll(true)} style={{ width: '100%', padding: '0.75rem', background: 'rgba(139,92,246,0.1)', border: '1px dashed rgba(139,92,246,0.3)', borderRadius: '6px', color: '#8b5cf6', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <Plus size={16} />B-roll toevoegen
              </button>
            )}
          </div>

          {/* Edit Notes */}
          <div style={{ padding: '0 1rem 1rem' }}>
            <button onClick={() => setShowEditNotes(!showEditNotes)} style={{ width: '100%', padding: '0.75rem', background: '#0f0f0f', border: '1px solid #1a1a1a', borderRadius: '6px', color: '#666', fontSize: '0.8rem', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Film size={14} />Edit instructies
                {editNotes && <span style={{ padding: '0.125rem 0.375rem', background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.3)', borderRadius: '3px', fontSize: '0.6rem', color: COLORS.gold }}>✓</span>}
              </div>
              <ChevronDown size={14} style={{ transition: 'transform 0.2s ease', transform: showEditNotes ? 'rotate(180deg)' : 'rotate(0deg)' }} />
            </button>
            {showEditNotes && <textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} placeholder="Edit instructies..." rows={3} style={{ width: '100%', marginTop: '0.5rem', padding: '0.75rem', background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '6px', color: '#fff', fontSize: '0.85rem', outline: 'none', resize: 'vertical', lineHeight: '1.5' }} />}
          </div>

          {/* Import Modal */}
          {showImport && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 1100 }}>
              <div style={{ width: '100%', maxWidth: '500px', background: '#0a0a0a', borderRadius: '12px', border: '1px solid #1a1a1a', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid #1a1a1a' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Sparkles size={16} color={COLORS.gold} /><h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: '700', color: '#fff' }}>AI Import</h3></div>
                  <button onClick={() => { setShowImport(false); setImportJson(''); setImportError('') }} style={{ width: '32px', height: '32px', background: '#1a1a1a', border: 'none', borderRadius: '6px', color: '#666', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
                </div>
                <div style={{ padding: '1rem' }}>
                  <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.8rem', color: '#666', lineHeight: '1.5' }}>Plak JSON:</p>
                  <textarea value={importJson} onChange={(e) => { setImportJson(e.target.value); setImportError('') }} placeholder='{"blueprint_steps": [...]}' rows={8} style={{ width: '100%', padding: '0.75rem', background: '#0f0f0f', border: importError ? '1px solid #ef4444' : '1px solid #1a1a1a', borderRadius: '6px', color: '#fff', fontSize: '0.75rem', fontFamily: 'monospace', outline: 'none', resize: 'vertical', lineHeight: '1.5' }} />
                  {importError && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', padding: '0.625rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px', color: '#ef4444', fontSize: '0.75rem' }}><AlertCircle size={14} />{importError}</div>}
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                    <button onClick={() => { setShowImport(false); setImportJson(''); setImportError('') }} style={{ flex: 1, padding: '0.75rem', background: '#1a1a1a', border: 'none', borderRadius: '6px', color: '#666', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer' }}>Annuleren</button>
                    <button onClick={handleImport} disabled={!importJson.trim()} style={{ flex: 1, padding: '0.75rem', background: importJson.trim() ? `linear-gradient(90deg, ${COLORS.gold}, ${COLORS.goldSecondary})` : '#1a1a1a', border: 'none', borderRadius: '6px', color: importJson.trim() ? '#000' : '#666', fontWeight: '700', fontSize: '0.85rem', cursor: importJson.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                      <Sparkles size={16} />Import
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bottom */}
          <div style={{ padding: '1rem', borderTop: '1px solid #1a1a1a', position: 'sticky', bottom: 0, background: '#0a0a0a' }}>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={onClose} style={{ flex: 1, padding: '0.875rem', background: '#1a1a1a', border: 'none', borderRadius: '8px', color: '#666', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer' }}>Sluiten</button>
              <button onClick={handleSaveAndClose} disabled={saving} style={{ flex: 1, padding: '0.875rem', background: `linear-gradient(90deg, ${COLORS.gold}, ${COLORS.goldSecondary})`, border: 'none', borderRadius: '8px', color: '#000', fontWeight: '700', fontSize: '0.9rem', cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <Save size={16} />{saving ? 'Opslaan...' : 'Opslaan'}
              </button>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
