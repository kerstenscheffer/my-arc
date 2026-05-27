// src/modules/content-batches/components/EditBatchItemModal.jsx
// Modal to view and edit batch item details
// UPDATED: Blueprint section with steps view, b-roll, AI import

import { useState, useEffect } from 'react'
import {
  X,
  Save,
  MapPin,
  MessageSquare,
  StickyNote,
  Target,
  Tag,
  Film,
  Camera,
  MessageCircle,
  Check,
  Plus,
  Trash2,
  Sparkles,
  AlertCircle,
  Video,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { POST_FORMATS, STORY_GOALS, STORY_TOPICS, BLUEPRINT_STEP_TYPES, BROLL_TYPES } from '../constants'
import TeleprompterModal from '../../output-planning/components/TeleprompterModal'

const GOLD = {
  primary: '#FFD700',
  secondary: '#FFA500',
  border: 'rgba(255, 215, 0, 0.3)',
  background: 'rgba(255, 215, 0, 0.1)',
  glow: 'rgba(255, 215, 0, 0.2)'
}

export default function EditBatchItemModal({
  isOpen,
  onClose,
  onSave,
  batchItem,
  isMobile
}) {
  const [title, setTitle] = useState('')
  const [location, setLocation] = useState('')
  const [caption, setCaption] = useState('')
  const [hook, setHook] = useState('')
  const [script, setScript] = useState('')
  const [notes, setNotes] = useState('')
  const [storyGoal, setStoryGoal] = useState('')
  const [storyTopic, setStoryTopic] = useState('')
  
  // Blueprint state
  const [blueprintSteps, setBlueprintSteps] = useState([])
  const [bRollList, setBRollList] = useState([])
  const [editNotes, setEditNotes] = useState('')
  const [productieChecklist, setProductieChecklist] = useState(null)
  const [showBlueprint, setShowBlueprint] = useState(false)
  const [editingStep, setEditingStep] = useState(null)
  const [showAddStep, setShowAddStep] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [importJson, setImportJson] = useState('')
  const [importError, setImportError] = useState('')
  const [showAddBRoll, setShowAddBRoll] = useState(false)
  const [newBRoll, setNewBRoll] = useState({ type: 'gym', description: '', duration: '3s' })
  
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [showTeleprompter, setShowTeleprompter] = useState(false)
  
  // Load data when batchItem changes
  useEffect(() => {
    if (batchItem) {
      setTitle(batchItem.title || '')
      setLocation(batchItem.location || '')
      setCaption(batchItem.caption || '')
      setHook(batchItem.hook || '')
      setScript(batchItem.script || '')
      setNotes(batchItem.notes || '')
      setStoryGoal(batchItem.story_goal || '')
      setStoryTopic(batchItem.story_topic || '')
      // Blueprint data
      setBlueprintSteps(batchItem.blueprint_steps || [])
      setBRollList(batchItem.b_roll_list || [])
      setEditNotes(batchItem.edit_notes || '')
      setProductieChecklist(batchItem.productie_checklist || null)
      // Auto-open blueprint if it has data
      setShowBlueprint((batchItem.blueprint_steps?.length > 0) || (batchItem.b_roll_list?.length > 0))
    }
  }, [batchItem])
  
  if (!isOpen || !batchItem) return null
  
  // Get format details
  const format = POST_FORMATS[batchItem.post_format || batchItem.batch?.post_format]
  const color = batchItem.content_type === 'story'
    ? format?.storyColor
    : format?.postColor
  const isStory = batchItem.content_type === 'story' || batchItem.batch?.content_type === 'story'
  const hasVideoBlueprint = format?.defaultFields?.includes('blueprint')

  // ============================================
  // STEP FUNCTIONS
  // ============================================

  const addStep = (type) => {
    const newStep = {
      step: blueprintSteps.length + 1,
      type,
      timing: '',
      visual: '',
      say: '',
      completed: false
    }
    setBlueprintSteps([...blueprintSteps, newStep])
    setShowAddStep(false)
    setEditingStep(blueprintSteps.length)
  }

  const updateStep = (stepIndex, field, value) => {
    const updated = [...blueprintSteps]
    updated[stepIndex] = { ...updated[stepIndex], [field]: value }
    setBlueprintSteps(updated)
  }

  const deleteStep = (stepIndex) => {
    const updated = blueprintSteps.filter((_, i) => i !== stepIndex)
    updated.forEach((step, i) => step.step = i + 1)
    setBlueprintSteps(updated)
    setEditingStep(null)
  }

  const toggleStepComplete = (stepIndex) => {
    const updated = [...blueprintSteps]
    updated[stepIndex] = { ...updated[stepIndex], completed: !updated[stepIndex].completed }
    setBlueprintSteps(updated)
  }

  const moveStep = (stepIndex, direction) => {
    if (direction === 'up' && stepIndex === 0) return
    if (direction === 'down' && stepIndex === blueprintSteps.length - 1) return
    const updated = [...blueprintSteps]
    const swapIndex = direction === 'up' ? stepIndex - 1 : stepIndex + 1
    ;[updated[stepIndex], updated[swapIndex]] = [updated[swapIndex], updated[stepIndex]]
    updated.forEach((step, i) => step.step = i + 1)
    setBlueprintSteps(updated)
  }

  // ============================================
  // B-ROLL FUNCTIONS
  // ============================================

  const addBRollItem = () => {
    if (!newBRoll.description.trim()) return
    const item = {
      id: `broll_${Date.now()}`,
      type: newBRoll.type,
      description: newBRoll.description,
      duration: newBRoll.duration,
      completed: false
    }
    setBRollList([...bRollList, item])
    setNewBRoll({ type: 'gym', description: '', duration: '3s' })
    setShowAddBRoll(false)
  }

  const toggleBRoll = (bRollId) => {
    setBRollList(bRollList.map(b =>
      b.id === bRollId ? { ...b, completed: !b.completed } : b
    ))
  }

  const deleteBRoll = (bRollId) => {
    setBRollList(bRollList.filter(b => b.id !== bRollId))
  }

  // ============================================
  // AI IMPORT
  // ============================================

  const handleImport = () => {
    setImportError('')
    try {
      const data = JSON.parse(importJson)
      if (!data.blueprint_steps || !Array.isArray(data.blueprint_steps)) {
        setImportError('Ongeldige JSON: blueprint_steps array ontbreekt')
        return
      }
      if (data.blueprint_steps) setBlueprintSteps(data.blueprint_steps)
      if (data.b_roll_list) setBRollList(data.b_roll_list)
      if (data.edit_notes) setEditNotes(data.edit_notes)
      if (data.productie_checklist) setProductieChecklist(data.productie_checklist)
      setShowImport(false)
      setImportJson('')
    } catch (e) {
      setImportError('Ongeldige JSON format')
    }
  }

  // ============================================
  // SAVE
  // ============================================
  
  const handleSave = async () => {
    if (!title.trim()) {
      setError('Titel is verplicht')
      return
    }
    
    setSaving(true)
    setError(null)
    
    try {
      await onSave(batchItem.id, {
        title: title.trim(),
        location: location.trim() || null,
        caption: caption.trim() || null,
        hook: hook.trim() || null,
        script: script.trim() || null,
        notes: notes.trim() || null,
        story_goal: isStory ? storyGoal : null,
        story_topic: isStory ? storyTopic : null,
        // Blueprint data
        blueprint_steps: blueprintSteps.length > 0 ? blueprintSteps : null,
        b_roll_list: bRollList.length > 0 ? bRollList : null,
        edit_notes: editNotes.trim() || null,
        productie_checklist: productieChecklist || null
      })
      onClose()
    } catch (err) {
      setError('Kon niet opslaan: ' + err.message)
    } finally {
      setSaving(false)
    }
  }
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      padding: isMobile ? '0' : '2rem',
      overflowY: 'auto'
    }}>
      <div style={{
        width: isMobile ? '100%' : '600px',
        maxWidth: '100%',
        height: isMobile ? '100%' : 'auto',
        background: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)',
        border: isMobile ? 'none' : `1px solid ${GOLD.border}`,
        borderRadius: isMobile ? '0' : '16px',
        overflow: 'hidden',
        maxHeight: isMobile ? '100%' : '90vh',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: isMobile ? '1rem' : '1.5rem',
          borderBottom: `1px solid ${GOLD.border}`,
          background: `linear-gradient(135deg, ${GOLD.background} 0%, rgba(0,0,0,0.3) 100%)`
        }}>
          <div style={{ flex: 1 }}>
            <h3 style={{
              margin: 0,
              fontSize: isMobile ? '1.1rem' : '1.25rem',
              fontWeight: '800',
              color: GOLD.primary
            }}>
              ✏️ Edit Item
            </h3>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginTop: '0.5rem'
            }}>
              {format?.icon && <format.icon size={16} color={color} />}
              <span style={{
                fontSize: '0.8rem',
                fontWeight: '700',
                color: color,
                textTransform: 'uppercase'
              }}>
                {format?.label}
                {isStory && ' 📱'}
              </span>
              {blueprintSteps.length > 0 && (
                <span style={{
                  padding: '0.125rem 0.375rem',
                  background: 'rgba(255, 215, 0, 0.1)',
                  border: '1px solid rgba(255, 215, 0, 0.3)',
                  borderRadius: '4px',
                  fontSize: '0.6rem',
                  fontWeight: '700',
                  color: GOLD.primary
                }}>
                  📋 {blueprintSteps.length} stappen
                </span>
              )}
            </div>
          </div>
          
          <button
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: 'rgba(255, 255, 255, 0.6)',
              cursor: 'pointer',
              touchAction: 'manipulation'
            }}
          >
            <X size={18} />
          </button>
        </div>
        
        {/* Content - Scrollable */}
        <div style={{
          flex: 1,
          padding: isMobile ? '1rem' : '1.5rem',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch'
        }}>
          {/* Title */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={fieldLabel()}>Titel *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Bijv: 5 tips voor..."
              style={fieldInput()}
            />
          </div>
          
          {/* Location */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={fieldLabel()}>
              <MapPin size={14} style={{ marginRight: '0.375rem' }} />
              Locatie
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Bijv: Gym, Keuken, Park..."
              style={fieldInput()}
            />
          </div>
          
          {/* Caption */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={fieldLabel()}>
              <MessageSquare size={14} style={{ marginRight: '0.375rem' }} />
              Caption
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Instagram caption..."
              rows={4}
              style={fieldTextarea()}
            />
          </div>
          
          {/* Hook */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={fieldLabel()}>Hook</label>
            <input
              type="text"
              value={hook}
              onChange={(e) => setHook(e.target.value)}
              placeholder="De eerste 3 seconden..."
              style={fieldInput()}
            />
          </div>
          
          {/* Script */}
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <label style={{ ...fieldLabel(), marginBottom: 0 }}>Script / Voice-over</label>
              <button
                type="button"
                onClick={() => setShowTeleprompter(true)}
                disabled={!script.trim()}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                  padding: '0.4rem 0.65rem', minHeight: 36,
                  background: script.trim() ? GOLD.primary : 'rgba(255,255,255,0.05)',
                  color: script.trim() ? '#000' : 'rgba(255,255,255,0.3)',
                  border: 'none', borderRadius: 6,
                  fontSize: '0.72rem', fontWeight: 700,
                  cursor: script.trim() ? 'pointer' : 'not-allowed',
                  touchAction: 'manipulation',
                }}
                title="Teleprompter openen"
              >
                <Video size={13} /> Teleprompter
              </button>
            </div>
            <textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              placeholder="Wat je zegt in de video..."
              rows={4}
              style={fieldTextarea()}
            />
          </div>
          
          {/* Story-specific fields */}
          {isStory && (
            <>
              <div style={{ marginBottom: '1rem' }}>
                <label style={fieldLabel()}>
                  <Target size={14} style={{ marginRight: '0.375rem' }} />
                  Story Doel
                </label>
                <select
                  value={storyGoal}
                  onChange={(e) => setStoryGoal(e.target.value)}
                  style={fieldInput()}
                >
                  <option value="">Geen doel</option>
                  {Object.entries(STORY_GOALS).map(([key, goal]) => (
                    <option key={key} value={key}>{goal.label}</option>
                  ))}
                </select>
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={fieldLabel()}>
                  <Tag size={14} style={{ marginRight: '0.375rem' }} />
                  Story Type
                </label>
                <select
                  value={storyTopic}
                  onChange={(e) => setStoryTopic(e.target.value)}
                  style={fieldInput()}
                >
                  <option value="">Geen type</option>
                  {Object.entries(STORY_TOPICS).map(([key, topic]) => (
                    <option key={key} value={key}>{topic.emoji} {topic.label}</option>
                  ))}
                </select>
              </div>
            </>
          )}
          
          {/* Notes */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={fieldLabel()}>
              <StickyNote size={14} style={{ marginRight: '0.375rem' }} />
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Extra notities..."
              rows={3}
              style={fieldTextarea()}
            />
          </div>

          {/* ============================================ */}
          {/* BLUEPRINT SECTION */}
          {/* ============================================ */}
          <div style={{
            borderTop: '2px solid rgba(255, 215, 0, 0.2)',
            paddingTop: '1rem',
            marginTop: '0.5rem'
          }}>
            {/* Blueprint Toggle */}
            <button
              onClick={() => setShowBlueprint(!showBlueprint)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 1rem',
                background: showBlueprint ? 'rgba(255, 215, 0, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                border: showBlueprint ? `1px solid ${GOLD.border}` : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                cursor: 'pointer',
                touchAction: 'manipulation'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Film size={16} color={GOLD.primary} />
                <span style={{ fontSize: '0.85rem', fontWeight: '700', color: GOLD.primary }}>
                  📋 Video Blueprint
                </span>
                {blueprintSteps.length > 0 && (
                  <span style={{
                    padding: '0.125rem 0.5rem',
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '10px',
                    fontSize: '0.65rem',
                    fontWeight: '700',
                    color: '#10b981'
                  }}>
                    {blueprintSteps.filter(s => s.completed).length}/{blueprintSteps.length}
                  </span>
                )}
              </div>
              <ChevronDown
                size={16}
                color={GOLD.primary}
                style={{
                  transition: 'transform 0.2s ease',
                  transform: showBlueprint ? 'rotate(180deg)' : 'rotate(0deg)'
                }}
              />
            </button>

            {showBlueprint && (
              <div style={{
                marginTop: '0.75rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}>
                {/* AI Import */}
                <button
                  onClick={() => setShowImport(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '0.625rem',
                    background: 'rgba(255, 215, 0, 0.08)',
                    border: `1px dashed ${GOLD.border}`,
                    borderRadius: '8px',
                    color: GOLD.primary,
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  <Sparkles size={14} />
                  AI Script Importeren (JSON)
                </button>

                {/* Steps */}
                {blueprintSteps.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {blueprintSteps.map((step, stepIdx) => {
                      const typeConfig = BLUEPRINT_STEP_TYPES[step.type] || BLUEPRINT_STEP_TYPES.custom
                      const isEditingThis = editingStep === stepIdx

                      return (
                        <div key={stepIdx}>
                          {/* Step Header */}
                          <div
                            onClick={() => setEditingStep(isEditingThis ? null : stepIdx)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              marginBottom: '0.375rem',
                              cursor: 'pointer'
                            }}
                          >
                            <div style={{
                              width: '20px',
                              height: '20px',
                              borderRadius: '4px',
                              background: `${typeConfig.color}30`,
                              border: `1px solid ${typeConfig.color}`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.65rem',
                              fontWeight: '700',
                              color: typeConfig.color,
                              flexShrink: 0
                            }}>
                              {step.step}
                            </div>
                            <span style={{
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              color: step.completed ? '#666' : '#999',
                              textDecoration: step.completed ? 'line-through' : 'none'
                            }}>
                              {typeConfig.label}
                            </span>
                            {step.timing && (
                              <span style={{ fontSize: '0.65rem', color: '#555' }}>{step.timing}</span>
                            )}
                            <div style={{ flex: 1 }} />
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleStepComplete(stepIdx) }}
                              style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '4px',
                                background: step.completed ? '#10b981' : 'transparent',
                                border: step.completed ? 'none' : '2px solid #333',
                                color: step.completed ? '#000' : 'transparent',
                                cursor: 'pointer',
                                flexShrink: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              {step.completed && <Check size={14} strokeWidth={3} />}
                            </button>
                            <ChevronDown
                              size={12}
                              color="#666"
                              style={{
                                transition: 'transform 0.2s ease',
                                transform: isEditingThis ? 'rotate(180deg)' : 'rotate(0deg)'
                              }}
                            />
                          </div>

                          {/* Read mode */}
                          {!isEditingThis && (step.visual || step.say) && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                              {step.visual && (
                                <div style={{
                                  padding: '0.625rem',
                                  background: 'rgba(0, 0, 0, 0.3)',
                                  border: '1px solid #3b82f6',
                                  borderRadius: '6px'
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                                    <Camera size={12} color="#3b82f6" style={{ marginTop: '2px', flexShrink: 0 }} />
                                    <span style={{ fontSize: '0.8rem', color: '#3b82f6', lineHeight: '1.4', fontWeight: '500' }}>
                                      {step.visual}
                                    </span>
                                  </div>
                                </div>
                              )}
                              {step.say && (
                                <div style={{
                                  padding: '0.625rem',
                                  background: 'rgba(0, 0, 0, 0.3)',
                                  border: `1px solid ${GOLD.primary}`,
                                  borderRadius: '6px'
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                                    <MessageCircle size={12} color={GOLD.primary} style={{ marginTop: '2px', flexShrink: 0 }} />
                                    <span style={{ fontSize: '0.85rem', color: '#fff', fontWeight: '600', lineHeight: '1.4' }}>
                                      "{step.say}"
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Edit mode */}
                          {isEditingThis && (
                            <div style={{
                              padding: '0.75rem',
                              background: 'rgba(0, 0, 0, 0.3)',
                              borderRadius: '8px',
                              border: '1px solid rgba(255, 255, 255, 0.1)'
                            }}>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.625rem' }}>
                                <div>
                                  <label style={miniLabel()}>Type</label>
                                  <select
                                    value={step.type}
                                    onChange={(e) => updateStep(stepIdx, 'type', e.target.value)}
                                    style={miniInput()}
                                  >
                                    {Object.entries(BLUEPRINT_STEP_TYPES).map(([key, val]) => (
                                      <option key={key} value={key}>{val.label}</option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label style={miniLabel()}>Timing</label>
                                  <input
                                    type="text"
                                    value={step.timing}
                                    onChange={(e) => updateStep(stepIdx, 'timing', e.target.value)}
                                    placeholder="0-3s"
                                    style={miniInput()}
                                  />
                                </div>
                              </div>
                              <div style={{ marginBottom: '0.625rem' }}>
                                <label style={miniLabel('#3b82f6')}>
                                  <Camera size={10} style={{ marginRight: '0.25rem' }} /> Beeld
                                </label>
                                <textarea
                                  value={step.visual}
                                  onChange={(e) => updateStep(stepIdx, 'visual', e.target.value)}
                                  placeholder="Bijv: Gym, close-up"
                                  rows={2}
                                  style={{ ...miniInput(), resize: 'vertical', lineHeight: '1.4' }}
                                />
                              </div>
                              <div style={{ marginBottom: '0.625rem' }}>
                                <label style={miniLabel(GOLD.primary)}>
                                  <MessageCircle size={10} style={{ marginRight: '0.25rem' }} /> Tekst
                                </label>
                                <textarea
                                  value={step.say}
                                  onChange={(e) => updateStep(stepIdx, 'say', e.target.value)}
                                  placeholder="Wat je zegt..."
                                  rows={3}
                                  style={{ ...miniInput(), resize: 'vertical', lineHeight: '1.4' }}
                                />
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', gap: '0.25rem' }}>
                                  <button onClick={() => moveStep(stepIdx, 'up')} disabled={stepIdx === 0} style={navBtn(stepIdx === 0)}>
                                    <ChevronUp size={12} />
                                  </button>
                                  <button onClick={() => moveStep(stepIdx, 'down')} disabled={stepIdx === blueprintSteps.length - 1} style={navBtn(stepIdx === blueprintSteps.length - 1)}>
                                    <ChevronDown size={12} />
                                  </button>
                                </div>
                                <button
                                  onClick={() => deleteStep(stepIdx)}
                                  style={{
                                    padding: '0.375rem 0.625rem',
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                    borderRadius: '4px',
                                    color: '#ef4444',
                                    fontSize: '0.7rem',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.25rem'
                                  }}
                                >
                                  <Trash2 size={10} /> Verwijder
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Add Step */}
                {showAddStep ? (
                  <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', padding: '0.625rem' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: '600', color: '#666', marginBottom: '0.375rem' }}>Type:</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.25rem' }}>
                      {Object.entries(BLUEPRINT_STEP_TYPES).map(([key, val]) => (
                        <button
                          key={key}
                          onClick={() => addStep(key)}
                          style={{
                            padding: '0.375rem',
                            background: `${val.color}20`,
                            border: `1px solid ${val.color}`,
                            borderRadius: '4px',
                            color: val.color,
                            fontSize: '0.65rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            minHeight: '36px'
                          }}
                        >
                          {val.label}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => setShowAddStep(false)}
                      style={{ width: '100%', marginTop: '0.375rem', padding: '0.375rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: '#666', fontSize: '0.7rem', cursor: 'pointer' }}
                    >
                      Annuleren
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAddStep(true)}
                    style={{
                      width: '100%',
                      padding: '0.625rem',
                      background: 'rgba(0,0,0,0.2)',
                      border: '1px dashed rgba(255,255,255,0.15)',
                      borderRadius: '8px',
                      color: '#666',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <Plus size={14} /> Stap toevoegen
                  </button>
                )}

                {/* B-Roll */}
                <div style={{ borderTop: '1px solid rgba(139,92,246,0.2)', paddingTop: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <Video size={12} color="#8b5cf6" />
                      <span style={{ fontSize: '0.7rem', fontWeight: '700', color: '#8b5cf6', textTransform: 'uppercase' }}>B-Roll</span>
                    </div>
                    {bRollList.length > 0 && (
                      <span style={{ fontSize: '0.65rem', fontWeight: '700', color: bRollList.filter(b => b.completed).length === bRollList.length ? '#10b981' : '#8b5cf6' }}>
                        {bRollList.filter(b => b.completed).length}/{bRollList.length}
                      </span>
                    )}
                  </div>

                  {bRollList.map((br) => {
                    const brType = BROLL_TYPES.find(t => t.id === br.type) || BROLL_TYPES[5]
                    return (
                      <div key={br.id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                        padding: '0.5rem',
                        background: br.completed ? 'rgba(16,185,129,0.1)' : 'rgba(0,0,0,0.2)',
                        border: br.completed ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '6px',
                        marginBottom: '0.375rem'
                      }}>
                        <button onClick={() => toggleBRoll(br.id)} style={{
                          width: '20px', height: '20px', borderRadius: '3px',
                          background: br.completed ? '#10b981' : 'transparent',
                          border: br.completed ? 'none' : '2px solid #333',
                          color: br.completed ? '#000' : 'transparent',
                          cursor: 'pointer', flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          {br.completed && <Check size={12} strokeWidth={3} />}
                        </button>
                        <span style={{ fontSize: '0.7rem' }}>{brType.icon}</span>
                        <span style={{
                          flex: 1, fontSize: '0.75rem',
                          color: br.completed ? '#666' : '#fff',
                          textDecoration: br.completed ? 'line-through' : 'none',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                        }}>{br.description}</span>
                        <span style={{ fontSize: '0.6rem', color: '#555', flexShrink: 0 }}>{br.duration}</span>
                        <button onClick={() => deleteBRoll(br.id)} style={{
                          width: '20px', height: '20px', background: 'rgba(239,68,68,0.1)',
                          border: 'none', borderRadius: '3px', color: '#ef4444',
                          cursor: 'pointer', flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          <Trash2 size={10} />
                        </button>
                      </div>
                    )
                  })}

                  {showAddBRoll ? (
                    <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', padding: '0.625rem' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.25rem', marginBottom: '0.375rem' }}>
                        {BROLL_TYPES.map(type => (
                          <button key={type.id} onClick={() => setNewBRoll(prev => ({ ...prev, type: type.id }))} style={{
                            padding: '0.375rem',
                            background: newBRoll.type === type.id ? `${type.color}30` : `${type.color}10`,
                            border: `1px solid ${newBRoll.type === type.id ? type.color : `${type.color}50`}`,
                            borderRadius: '4px', color: type.color, fontSize: '0.65rem', fontWeight: '600', cursor: 'pointer', minHeight: '32px'
                          }}>{type.icon}</button>
                        ))}
                      </div>
                      <input type="text" value={newBRoll.description} onChange={(e) => setNewBRoll(prev => ({ ...prev, description: e.target.value }))} placeholder="Beschrijving..." style={{ ...miniInput(), marginBottom: '0.375rem' }} />
                      <input type="text" value={newBRoll.duration} onChange={(e) => setNewBRoll(prev => ({ ...prev, duration: e.target.value }))} placeholder="3s" style={{ ...miniInput(), marginBottom: '0.375rem' }} />
                      <div style={{ display: 'flex', gap: '0.375rem' }}>
                        <button onClick={() => { setShowAddBRoll(false); setNewBRoll({ type: 'gym', description: '', duration: '3s' }) }} style={{ flex: 1, padding: '0.375rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: '#666', fontSize: '0.7rem', cursor: 'pointer' }}>Annuleren</button>
                        <button onClick={addBRollItem} disabled={!newBRoll.description.trim()} style={{
                          flex: 1, padding: '0.375rem',
                          background: newBRoll.description.trim() ? '#8b5cf6' : 'rgba(255,255,255,0.05)',
                          border: 'none', borderRadius: '4px',
                          color: newBRoll.description.trim() ? '#fff' : '#666',
                          fontSize: '0.7rem', fontWeight: '600',
                          cursor: newBRoll.description.trim() ? 'pointer' : 'not-allowed'
                        }}>Toevoegen</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setShowAddBRoll(true)} style={{
                      width: '100%', padding: '0.5rem',
                      background: 'rgba(139,92,246,0.08)', border: '1px dashed rgba(139,92,246,0.3)',
                      borderRadius: '6px', color: '#8b5cf6', fontSize: '0.75rem', fontWeight: '600',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem'
                    }}>
                      <Plus size={12} /> B-roll toevoegen
                    </button>
                  )}
                </div>

                {/* Edit Notes */}
                <div>
                  <label style={miniLabel(GOLD.primary)}>
                    <Film size={10} style={{ marginRight: '0.25rem' }} /> Edit instructies
                  </label>
                  <textarea
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="Edit instructies..."
                    rows={2}
                    style={{ ...miniInput(), resize: 'vertical', lineHeight: '1.4' }}
                  />
                </div>
              </div>
            )}
          </div>
          
          {/* Error */}
          {error && (
            <div style={{
              padding: '0.75rem 1rem',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              color: '#ef4444',
              fontSize: '0.85rem',
              marginTop: '1rem'
            }}>
              {error}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div style={{
          display: 'flex',
          gap: '0.75rem',
          padding: isMobile ? '1rem' : '1.5rem',
          borderTop: `1px solid ${GOLD.border}`,
          background: 'rgba(0, 0, 0, 0.3)'
        }}>
          <button
            onClick={onClose}
            disabled={saving}
            style={{
              flex: 1,
              padding: '0.75rem 1.5rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              color: 'rgba(255, 255, 255, 0.7)',
              fontWeight: '600',
              fontSize: '0.95rem',
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.5 : 1,
              touchAction: 'manipulation'
            }}
          >
            Annuleren
          </button>
          
          <button
            onClick={handleSave}
            disabled={saving || !title.trim()}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              background: !title.trim()
                ? 'rgba(255, 255, 255, 0.1)'
                : `linear-gradient(135deg, ${GOLD.primary} 0%, ${GOLD.secondary} 100%)`,
              border: 'none',
              borderRadius: '8px',
              color: !title.trim() ? 'rgba(255, 255, 255, 0.3)' : '#000',
              fontWeight: '700',
              fontSize: '0.95rem',
              cursor: (!title.trim() || saving) ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1,
              touchAction: 'manipulation'
            }}
          >
            {saving ? (
              <>
                <div style={{
                  width: '16px', height: '16px',
                  border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#000',
                  borderRadius: '50%', animation: 'spin 0.8s linear infinite'
                }} />
                Opslaan...
              </>
            ) : (
              <>
                <Save size={18} />
                Opslaan
              </>
            )}
          </button>
        </div>
      </div>

      {/* AI Import Modal */}
      {showImport && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.95)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem', zIndex: 3000
        }}>
          <div style={{
            width: '100%', maxWidth: '500px', background: '#0a0a0a',
            borderRadius: '12px', border: `1px solid ${GOLD.border}`, overflow: 'hidden'
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={16} color={GOLD.primary} />
                <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: '700', color: '#fff' }}>AI Import</h3>
              </div>
              <button onClick={() => { setShowImport(false); setImportJson(''); setImportError('') }} style={{
                width: '32px', height: '32px', background: 'rgba(255,255,255,0.05)',
                border: 'none', borderRadius: '6px', color: '#666', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <X size={16} />
              </button>
            </div>
            <div style={{ padding: '1rem' }}>
              <p style={{ margin: '0 0 0.75rem', fontSize: '0.8rem', color: '#666', lineHeight: '1.5' }}>
                Plak JSON met blueprint_steps, b_roll_list, edit_notes, productie_checklist:
              </p>
              <textarea
                value={importJson}
                onChange={(e) => { setImportJson(e.target.value); setImportError('') }}
                placeholder='{"blueprint_steps": [...]}'
                rows={8}
                style={{
                  width: '100%', padding: '0.75rem', background: '#0f0f0f',
                  border: importError ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '6px', color: '#fff', fontSize: '0.75rem',
                  fontFamily: 'monospace', outline: 'none', resize: 'vertical', lineHeight: '1.5'
                }}
              />
              {importError && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem',
                  padding: '0.5rem', background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px',
                  color: '#ef4444', fontSize: '0.75rem'
                }}>
                  <AlertCircle size={14} /> {importError}
                </div>
              )}
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                <button onClick={() => { setShowImport(false); setImportJson(''); setImportError('') }} style={{
                  flex: 1, padding: '0.75rem', background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px',
                  color: '#666', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer'
                }}>Annuleren</button>
                <button onClick={handleImport} disabled={!importJson.trim()} style={{
                  flex: 1, padding: '0.75rem',
                  background: importJson.trim() ? `linear-gradient(90deg, ${GOLD.primary} 0%, ${GOLD.secondary} 100%)` : 'rgba(255,255,255,0.05)',
                  border: 'none', borderRadius: '6px',
                  color: importJson.trim() ? '#000' : '#666',
                  fontWeight: '700', fontSize: '0.85rem',
                  cursor: importJson.trim() ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                }}>
                  <Sparkles size={16} /> Import
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      <TeleprompterModal
        isOpen={showTeleprompter}
        onClose={() => setShowTeleprompter(false)}
        script={script}
        title={title}
      />
    </div>
  )
}

// ============================================
// STYLE HELPERS
// ============================================

function fieldLabel() {
  return {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '0.5rem',
    fontSize: '0.9rem',
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)'
  }
}

function fieldInput() {
  return {
    width: '100%',
    padding: '0.75rem',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '0.95rem',
    outline: 'none'
  }
}

function fieldTextarea() {
  return {
    width: '100%',
    padding: '0.75rem',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '0.95rem',
    resize: 'vertical',
    fontFamily: 'inherit',
    outline: 'none',
    lineHeight: '1.5'
  }
}

function miniLabel(color = '#666') {
  return {
    display: 'flex',
    alignItems: 'center',
    fontSize: '0.6rem',
    fontWeight: '700',
    color,
    marginBottom: '0.25rem',
    textTransform: 'uppercase',
    letterSpacing: '0.03em'
  }
}

function miniInput() {
  return {
    width: '100%',
    padding: '0.5rem',
    background: 'rgba(0, 0, 0, 0.4)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '4px',
    color: '#fff',
    fontSize: '0.8rem',
    outline: 'none'
  }
}

function navBtn(disabled) {
  return {
    width: '28px',
    height: '28px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: 'none',
    borderRadius: '4px',
    color: disabled ? '#333' : '#666',
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }
}
