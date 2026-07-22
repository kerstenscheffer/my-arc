// src/modules/plan-wizard/PlanSOPWizard.jsx
// SOP / Stappenplan wizard voor plan-creatie per client

import { useState, useEffect, useCallback } from 'react'
import {
  CheckCircle2, Circle, ChevronUp, ChevronDown,
  Plus, Trash2, Edit2, Save, X, User, RotateCcw,
  ClipboardList
} from 'lucide-react'

const DEFAULT_STEPS = [
  {
    id: 's1',
    title: 'Huidige situatie inlezen',
    description: 'Noteer: huidig gewicht, doelgewicht, tijdsframe, activiteitsniveau, slaappatroon. Controleer of alle basisgegevens in de app aanwezig zijn.',
  },
  {
    id: 's2',
    title: 'TDEE + caloriedoel berekenen',
    description: 'Bereken TDEE op basis van gewicht, lengte, leeftijd en activiteitsniveau. Stel caloriedoel in. Let op: tekort > 500 kcal onder TDEE is te agressief — stel een gematigd tekort voor.',
  },
  {
    id: 's3',
    title: 'Doel + aanpak vastleggen',
    description: 'Formuleer de focus: vetverlies, spieropbouw of recompositie. Leg de aanpak vast — bijv. beweging verhogen i.p.v. calorieën verder verlagen.',
  },
  {
    id: 's4',
    title: 'Bewegingsrichtlijnen toevoegen',
    description: 'Adviseer concrete dagelijkse beweging: bijv. 30 min stevig wandelen na training, meer staan/lopen overdag, dagelijkse stappenteller instellen.',
  },
  {
    id: 's5',
    title: "Macro's verdelen",
    description: "Default: 2 g eiwit per kg lichaamsgewicht, 1 g vet per kg lichaamsgewicht. Koolhydraten vullen de rest van de calorieën. Pas aan op basis van voorkeur/doel.",
  },
  {
    id: 's6',
    title: 'Definitief plan invoeren / koppelen',
    description: 'Voer het plan in de app in: koppel maaltijdplan, trainingsschema en belplannen aan de client. Controleer of alles zichtbaar is in het clientdashboard.',
  },
]

export default function PlanSOPWizard({ db, clients }) {
  const isMobile = window.innerWidth <= 768

  const [selectedClientId, setSelectedClientId] = useState('')
  const [steps, setSteps] = useState(DEFAULT_STEPS)
  const [completedSteps, setCompletedSteps] = useState([])
  const [isEditing, setIsEditing] = useState(false)
  const [editingStepId, setEditingStepId] = useState(null)
  const [editBuffer, setEditBuffer] = useState({ title: '', description: '' })
  const [newStepBuffer, setNewStepBuffer] = useState({ title: '', description: '' })
  const [showAddForm, setShowAddForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')

  const supabase = db?.supabase

  // ── Load template from DB on mount ──────────────────────────────────
  useEffect(() => {
    if (!supabase) return
    loadTemplate()
  }, [supabase])

  // ── Load client progress when client changes ─────────────────────────
  useEffect(() => {
    if (!supabase || !selectedClientId) {
      setCompletedSteps([])
      return
    }
    loadProgress(selectedClientId)
  }, [supabase, selectedClientId])

  async function getCoachId() {
    const user = await db.getCurrentUser()
    return user?.id
  }

  async function loadTemplate() {
    try {
      const coachId = await getCoachId()
      if (!coachId) return
      const { data } = await supabase
        .from('coach_sop_templates')
        .select('steps')
        .eq('coach_id', coachId)
        .maybeSingle()
      if (data?.steps?.length) setSteps(data.steps)
    } catch (e) {
      console.error('SOP template load error:', e)
    }
  }

  async function saveTemplate(stepsToSave) {
    try {
      const coachId = await getCoachId()
      if (!coachId) return
      await supabase
        .from('coach_sop_templates')
        .upsert({ coach_id: coachId, steps: stepsToSave, updated_at: new Date().toISOString() }, { onConflict: 'coach_id' })
    } catch (e) {
      console.error('SOP template save error:', e)
    }
  }

  async function loadProgress(clientId) {
    try {
      const coachId = await getCoachId()
      if (!coachId) return
      const { data } = await supabase
        .from('client_sop_progress')
        .select('completed_steps')
        .eq('client_id', clientId)
        .eq('coach_id', coachId)
        .maybeSingle()
      setCompletedSteps(data?.completed_steps || [])
    } catch (e) {
      console.error('SOP progress load error:', e)
    }
  }

  async function saveProgress(clientId, completed) {
    try {
      const coachId = await getCoachId()
      if (!coachId) return
      await supabase
        .from('client_sop_progress')
        .upsert(
          { client_id: clientId, coach_id: coachId, completed_steps: completed, updated_at: new Date().toISOString() },
          { onConflict: 'client_id,coach_id' }
        )
    } catch (e) {
      console.error('SOP progress save error:', e)
    }
  }

  // ── Step toggle ──────────────────────────────────────────────────────
  async function toggleStep(stepId) {
    if (!selectedClientId) return
    const next = completedSteps.includes(stepId)
      ? completedSteps.filter(id => id !== stepId)
      : [...completedSteps, stepId]
    setCompletedSteps(next)
    await saveProgress(selectedClientId, next)
  }

  // ── Reset client progress ────────────────────────────────────────────
  async function resetProgress() {
    if (!selectedClientId) return
    setCompletedSteps([])
    await saveProgress(selectedClientId, [])
  }

  // ── Edit template ────────────────────────────────────────────────────
  function startEditStep(step) {
    setEditingStepId(step.id)
    setEditBuffer({ title: step.title, description: step.description })
  }

  async function saveEditStep() {
    const next = steps.map(s =>
      s.id === editingStepId ? { ...s, title: editBuffer.title, description: editBuffer.description } : s
    )
    setSteps(next)
    setEditingStepId(null)
    await saveTemplate(next)
    flashSaved()
  }

  async function deleteStep(stepId) {
    const next = steps.filter(s => s.id !== stepId)
    setSteps(next)
    await saveTemplate(next)
    flashSaved()
  }

  async function moveStep(stepId, direction) {
    const idx = steps.findIndex(s => s.id === stepId)
    if (direction === 'up' && idx === 0) return
    if (direction === 'down' && idx === steps.length - 1) return
    const next = [...steps]
    const swap = direction === 'up' ? idx - 1 : idx + 1
    ;[next[idx], next[swap]] = [next[swap], next[idx]]
    setSteps(next)
    await saveTemplate(next)
    flashSaved()
  }

  async function addStep() {
    if (!newStepBuffer.title.trim()) return
    const next = [...steps, {
      id: `s${Date.now()}`,
      title: newStepBuffer.title.trim(),
      description: newStepBuffer.description.trim(),
    }]
    setSteps(next)
    setNewStepBuffer({ title: '', description: '' })
    setShowAddForm(false)
    await saveTemplate(next)
    flashSaved()
  }

  async function resetToDefaults() {
    setSteps(DEFAULT_STEPS)
    await saveTemplate(DEFAULT_STEPS)
    flashSaved()
  }

  function flashSaved() {
    setSavedMsg('Opgeslagen ✓')
    setTimeout(() => setSavedMsg(''), 2000)
  }

  // ── Derived state ────────────────────────────────────────────────────
  const progress = selectedClientId
    ? Math.round((completedSteps.length / steps.length) * 100)
    : 0

  const selectedClient = clients.find(c => c.id === selectedClientId)

  // ── Styles ───────────────────────────────────────────────────────────
  const card = {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,215,0,0.12)',
    borderRadius: '12px',
    padding: isMobile ? '1rem' : '1.25rem',
    marginBottom: '0.75rem',
  }

  const gold = '#FFD700'
  const goldDim = 'rgba(255,215,0,0.15)'
  const textMuted = 'rgba(255,255,255,0.5)'
  const textPrimary = 'rgba(255,255,255,0.9)'

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #0a0a0a 0%, #171717 100%)',
      padding: isMobile ? '1rem' : '2rem',
      color: textPrimary,
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <ClipboardList size={22} color={gold} />
              <h1 style={{ fontSize: isMobile ? '1.4rem' : '1.8rem', fontWeight: '800', color: gold, margin: 0 }}>
                SOP Stappenplan
              </h1>
            </div>
            <p style={{ fontSize: '0.85rem', color: textMuted, margin: 0 }}>
              Vaste werkwijze voor het opstellen van een clientplan
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {savedMsg && (
              <span style={{ fontSize: '0.8rem', color: '#10b981' }}>{savedMsg}</span>
            )}
            <button
              onClick={() => { setIsEditing(!isEditing); setEditingStepId(null); setShowAddForm(false) }}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: '8px',
                border: `1px solid ${isEditing ? gold : 'rgba(255,255,255,0.15)'}`,
                background: isEditing ? goldDim : 'transparent',
                color: isEditing ? gold : textMuted,
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '0.35rem',
              }}
            >
              {isEditing ? <><X size={14} /> Klaar</> : <><Edit2 size={14} /> Bewerk SOP</>}
            </button>
          </div>
        </div>

        {/* Client selector */}
        <div style={{ ...card, display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <User size={16} color={gold} />
          <select
            value={selectedClientId}
            onChange={e => setSelectedClientId(e.target.value)}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: textPrimary,
              padding: '0.45rem 0.75rem',
              fontSize: '0.85rem',
              flex: 1,
              minWidth: '180px',
            }}
          >
            <option value="">— Selecteer client —</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.name || c.email}</option>
            ))}
          </select>

          {selectedClientId && (
            <>
              {/* Progress bar */}
              <div style={{ flex: 2, minWidth: '120px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: textMuted, marginBottom: '3px' }}>
                  <span>{completedSteps.length}/{steps.length} stappen</span>
                  <span style={{ color: progress === 100 ? '#10b981' : textMuted }}>{progress}%</span>
                </div>
                <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${progress}%`,
                    background: progress === 100
                      ? 'linear-gradient(90deg, #10b981, #059669)'
                      : `linear-gradient(90deg, ${gold}, #f59e0b)`,
                    borderRadius: '3px',
                    transition: 'width 0.3s ease',
                  }} />
                </div>
              </div>

              <button
                onClick={resetProgress}
                title="Reset voortgang"
                style={{
                  padding: '0.35rem 0.6rem',
                  borderRadius: '6px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'transparent',
                  color: textMuted,
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '0.25rem',
                  fontSize: '0.75rem',
                }}
              >
                <RotateCcw size={13} /> Reset
              </button>
            </>
          )}
        </div>

        {/* No client selected hint */}
        {!selectedClientId && (
          <p style={{ textAlign: 'center', color: textMuted, fontSize: '0.85rem', margin: '0.5rem 0 1rem' }}>
            Selecteer een client om voortgang bij te houden. Je kunt de SOP ook gebruiken als checklist zonder client.
          </p>
        )}

        {/* Steps */}
        <div>
          {steps.map((step, idx) => {
            const done = completedSteps.includes(step.id)
            const isEditingThis = editingStepId === step.id

            return (
              <div
                key={step.id}
                style={{
                  ...card,
                  borderColor: done ? 'rgba(16,185,129,0.3)' : 'rgba(255,215,0,0.12)',
                  opacity: done && !isEditing ? 0.75 : 1,
                  transition: 'all 0.2s ease',
                }}
              >
                {isEditingThis ? (
                  /* ── Edit mode for this step ── */
                  <div>
                    <input
                      value={editBuffer.title}
                      onChange={e => setEditBuffer(b => ({ ...b, title: e.target.value }))}
                      placeholder="Stap titel"
                      style={{
                        width: '100%', boxSizing: 'border-box',
                        background: 'rgba(255,255,255,0.06)',
                        border: `1px solid ${gold}`,
                        borderRadius: '6px',
                        color: textPrimary,
                        padding: '0.45rem 0.65rem',
                        fontSize: '0.9rem',
                        marginBottom: '0.5rem',
                      }}
                    />
                    <textarea
                      value={editBuffer.description}
                      onChange={e => setEditBuffer(b => ({ ...b, description: e.target.value }))}
                      placeholder="Omschrijving (optioneel)"
                      rows={3}
                      style={{
                        width: '100%', boxSizing: 'border-box',
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: '6px',
                        color: textPrimary,
                        padding: '0.45rem 0.65rem',
                        fontSize: '0.85rem',
                        resize: 'vertical',
                        fontFamily: 'inherit',
                        marginBottom: '0.5rem',
                      }}
                    />
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={saveEditStep} style={btnPrimary(gold)}>
                        <Save size={13} /> Opslaan
                      </button>
                      <button onClick={() => setEditingStepId(null)} style={btnGhost()}>
                        <X size={13} /> Annuleer
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ── Normal view ── */
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleStep(step.id)}
                      disabled={!selectedClientId}
                      title={selectedClientId ? (done ? 'Markeer als niet gedaan' : 'Markeer als gedaan') : 'Selecteer eerst een client'}
                      style={{
                        background: 'none', border: 'none', cursor: selectedClientId ? 'pointer' : 'default',
                        padding: 0, flexShrink: 0, marginTop: '1px',
                        opacity: selectedClientId ? 1 : 0.4,
                      }}
                    >
                      {done
                        ? <CheckCircle2 size={22} color="#10b981" />
                        : <Circle size={22} color={gold} />}
                    </button>

                    {/* Content */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                        <span style={{
                          fontSize: '0.7rem', fontWeight: '700',
                          color: done ? '#10b981' : gold,
                          background: done ? 'rgba(16,185,129,0.1)' : goldDim,
                          borderRadius: '4px',
                          padding: '1px 6px',
                        }}>
                          STAP {idx + 1}
                        </span>
                        <span style={{
                          fontSize: isMobile ? '0.9rem' : '0.95rem',
                          fontWeight: '600',
                          color: done ? 'rgba(255,255,255,0.5)' : textPrimary,
                          textDecoration: done ? 'line-through' : 'none',
                        }}>
                          {step.title}
                        </span>
                      </div>
                      {step.description && (
                        <p style={{
                          fontSize: '0.82rem',
                          color: done ? 'rgba(255,255,255,0.3)' : textMuted,
                          margin: 0,
                          lineHeight: '1.5',
                        }}>
                          {step.description}
                        </p>
                      )}
                    </div>

                    {/* Edit controls */}
                    {isEditing && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flexShrink: 0 }}>
                        <button onClick={() => moveStep(step.id, 'up')} disabled={idx === 0} style={btnIcon(idx === 0)}>
                          <ChevronUp size={14} />
                        </button>
                        <button onClick={() => moveStep(step.id, 'down')} disabled={idx === steps.length - 1} style={btnIcon(idx === steps.length - 1)}>
                          <ChevronDown size={14} />
                        </button>
                        <button onClick={() => startEditStep(step)} style={btnIcon(false, gold)}>
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => deleteStep(step.id)} disabled={steps.length <= 1} style={btnIcon(steps.length <= 1, '#ef4444')}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Edit controls: add step + reset */}
        {isEditing && (
          <div style={{ marginTop: '0.5rem' }}>
            {showAddForm ? (
              <div style={{ ...card }}>
                <p style={{ fontSize: '0.8rem', color: gold, marginBottom: '0.5rem', fontWeight: '600' }}>Nieuwe stap toevoegen</p>
                <input
                  value={newStepBuffer.title}
                  onChange={e => setNewStepBuffer(b => ({ ...b, title: e.target.value }))}
                  placeholder="Stap titel *"
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: 'rgba(255,255,255,0.06)',
                    border: `1px solid ${gold}`,
                    borderRadius: '6px',
                    color: textPrimary,
                    padding: '0.45rem 0.65rem',
                    fontSize: '0.85rem',
                    marginBottom: '0.5rem',
                  }}
                />
                <textarea
                  value={newStepBuffer.description}
                  onChange={e => setNewStepBuffer(b => ({ ...b, description: e.target.value }))}
                  placeholder="Omschrijving (optioneel)"
                  rows={2}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '6px',
                    color: textPrimary,
                    padding: '0.45rem 0.65rem',
                    fontSize: '0.85rem',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    marginBottom: '0.5rem',
                  }}
                />
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={addStep} style={btnPrimary(gold)}>
                    <Plus size={13} /> Toevoegen
                  </button>
                  <button onClick={() => { setShowAddForm(false); setNewStepBuffer({ title: '', description: '' }) }} style={btnGhost()}>
                    <X size={13} /> Annuleer
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button onClick={() => setShowAddForm(true)} style={btnPrimary(gold)}>
                  <Plus size={14} /> Stap toevoegen
                </button>
                <button onClick={resetToDefaults} style={btnGhost()}>
                  <RotateCcw size={14} /> Terug naar standaard
                </button>
              </div>
            )}
          </div>
        )}

        {/* All done banner */}
        {selectedClientId && completedSteps.length === steps.length && steps.length > 0 && (
          <div style={{
            marginTop: '1rem',
            padding: '1rem',
            borderRadius: '12px',
            background: 'rgba(16,185,129,0.1)',
            border: '1px solid rgba(16,185,129,0.3)',
            textAlign: 'center',
          }}>
            <CheckCircle2 size={28} color="#10b981" style={{ marginBottom: '0.5rem' }} />
            <p style={{ color: '#10b981', fontWeight: '700', margin: '0 0 0.25rem' }}>
              SOP volledig doorlopen 🎉
            </p>
            <p style={{ color: textMuted, fontSize: '0.82rem', margin: 0 }}>
              {selectedClient?.name || 'Client'} — alle stappen afgevinkt. Plan klaar!
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Button style helpers ──────────────────────────────────────────────
function btnPrimary(color) {
  return {
    padding: '0.4rem 0.8rem',
    borderRadius: '7px',
    border: `1px solid ${color}`,
    background: `${color}22`,
    color,
    fontSize: '0.8rem',
    cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: '0.3rem',
    fontWeight: '600',
  }
}

function btnGhost() {
  return {
    padding: '0.4rem 0.8rem',
    borderRadius: '7px',
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'transparent',
    color: 'rgba(255,255,255,0.5)',
    fontSize: '0.8rem',
    cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: '0.3rem',
  }
}

function btnIcon(disabled, color = 'rgba(255,255,255,0.4)') {
  return {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '5px',
    color: disabled ? 'rgba(255,255,255,0.15)' : color,
    cursor: disabled ? 'not-allowed' : 'pointer',
    padding: '0.25rem',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: '26px', height: '26px',
  }
}
