// src/modules/content-batches/components/BatchItemsBuilder.jsx
// Step 2: Fill in details for each item in the batch
// UPDATED: Inline Blueprint editor per item (stappen, b-roll, AI import)

import { useState } from 'react'
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Camera,
  MessageCircle,
  Check,
  Sparkles,
  X,
  AlertCircle,
  Video,
  Film
} from 'lucide-react'
import { STORY_GOALS, STORY_TOPICS, shouldShowField, BLUEPRINT_STEP_TYPES, BROLL_TYPES } from '../constants'
import { GOLD } from '../../output-planning/components/week-planning/constants'

export default function BatchItemsBuilder({
  format,
  contentType,
  items,
  onItemsChange,
  isMobile = false
}) {
  const [expandedCard, setExpandedCard] = useState(0)
  const [blueprintOpen, setBlueprintOpen] = useState({}) // { itemIndex: true/false }
  const [showAddStep, setShowAddStep] = useState({}) // { itemIndex: true/false }
  const [editingStep, setEditingStep] = useState({}) // { itemIndex: stepIndex }
  const [showImport, setShowImport] = useState(null) // itemIndex or null
  const [importJson, setImportJson] = useState('')
  const [importError, setImportError] = useState('')
  const [showAddBRoll, setShowAddBRoll] = useState({}) // { itemIndex: true/false }
  const [newBRoll, setNewBRoll] = useState({ type: 'gym', description: '', duration: '3s' })

  const showBlueprint = shouldShowField(format?.id, 'blueprint')

  const updateItem = (index, field, value) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    onItemsChange(newItems)
  }

  const toggleCard = (index) => {
    setExpandedCard(expandedCard === index ? -1 : index)
  }

  const toggleBlueprint = (index) => {
    setBlueprintOpen(prev => ({ ...prev, [index]: !prev[index] }))
  }

  // ============================================
  // BLUEPRINT STEP FUNCTIONS
  // ============================================

  const getSteps = (index) => items[index]?.blueprintSteps || []
  const getBRoll = (index) => items[index]?.bRollList || []

  const addStep = (itemIndex, type) => {
    const currentSteps = getSteps(itemIndex)
    const newStep = {
      step: currentSteps.length + 1,
      type,
      timing: '',
      visual: '',
      say: '',
      completed: false
    }
    updateItem(itemIndex, 'blueprintSteps', [...currentSteps, newStep])
    setShowAddStep(prev => ({ ...prev, [itemIndex]: false }))
    setEditingStep(prev => ({ ...prev, [itemIndex]: currentSteps.length }))
  }

  const updateStep = (itemIndex, stepIndex, field, value) => {
    const currentSteps = [...getSteps(itemIndex)]
    currentSteps[stepIndex] = { ...currentSteps[stepIndex], [field]: value }
    updateItem(itemIndex, 'blueprintSteps', currentSteps)
  }

  const deleteStep = (itemIndex, stepIndex) => {
    const currentSteps = getSteps(itemIndex).filter((_, i) => i !== stepIndex)
    currentSteps.forEach((step, i) => step.step = i + 1)
    updateItem(itemIndex, 'blueprintSteps', currentSteps)
    setEditingStep(prev => ({ ...prev, [itemIndex]: null }))
  }

  const toggleStepComplete = (itemIndex, stepIndex) => {
    const currentSteps = [...getSteps(itemIndex)]
    currentSteps[stepIndex] = { ...currentSteps[stepIndex], completed: !currentSteps[stepIndex].completed }
    updateItem(itemIndex, 'blueprintSteps', currentSteps)
  }

  const moveStep = (itemIndex, stepIndex, direction) => {
    const currentSteps = [...getSteps(itemIndex)]
    if (direction === 'up' && stepIndex === 0) return
    if (direction === 'down' && stepIndex === currentSteps.length - 1) return
    const swapIndex = direction === 'up' ? stepIndex - 1 : stepIndex + 1
    ;[currentSteps[stepIndex], currentSteps[swapIndex]] = [currentSteps[swapIndex], currentSteps[stepIndex]]
    currentSteps.forEach((step, i) => step.step = i + 1)
    updateItem(itemIndex, 'blueprintSteps', currentSteps)
  }

  // ============================================
  // B-ROLL FUNCTIONS
  // ============================================

  const addBRollItem = (itemIndex) => {
    if (!newBRoll.description.trim()) return
    const currentBRoll = getBRoll(itemIndex)
    const bRollItem = {
      id: `broll_${Date.now()}`,
      type: newBRoll.type,
      description: newBRoll.description,
      duration: newBRoll.duration,
      completed: false
    }
    updateItem(itemIndex, 'bRollList', [...currentBRoll, bRollItem])
    setNewBRoll({ type: 'gym', description: '', duration: '3s' })
    setShowAddBRoll(prev => ({ ...prev, [itemIndex]: false }))
  }

  const toggleBRoll = (itemIndex, bRollId) => {
    const updated = getBRoll(itemIndex).map(b =>
      b.id === bRollId ? { ...b, completed: !b.completed } : b
    )
    updateItem(itemIndex, 'bRollList', updated)
  }

  const deleteBRoll = (itemIndex, bRollId) => {
    updateItem(itemIndex, 'bRollList', getBRoll(itemIndex).filter(b => b.id !== bRollId))
  }

  // ============================================
  // AI IMPORT
  // ============================================

  const handleImport = (itemIndex) => {
    setImportError('')
    try {
      const data = JSON.parse(importJson)
      if (!data.blueprint_steps || !Array.isArray(data.blueprint_steps)) {
        setImportError('Ongeldige JSON: blueprint_steps array ontbreekt')
        return
      }
      if (data.blueprint_steps) updateItem(itemIndex, 'blueprintSteps', data.blueprint_steps)
      if (data.b_roll_list) updateItem(itemIndex, 'bRollList', data.b_roll_list)
      if (data.edit_notes) updateItem(itemIndex, 'editNotes', data.edit_notes)
      if (data.productie_checklist) updateItem(itemIndex, 'productieChecklist', data.productie_checklist)

      setShowImport(null)
      setImportJson('')
    } catch (e) {
      setImportError('Ongeldige JSON format')
    }
  }

  // ============================================
  // RENDER
  // ============================================

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem'
    }}>
      {/* Header */}
      <div>
        <h3 style={{
          margin: '0 0 0.5rem',
          fontSize: isMobile ? '1rem' : '1.125rem',
          fontWeight: '700',
          color: '#fff'
        }}>
          Vul {items.length} Items In
        </h3>
        <p style={{
          margin: 0,
          fontSize: '0.85rem',
          color: 'rgba(255, 255, 255, 0.5)'
        }}>
          {format.label} - {contentType === 'story' ? 'Stories' : 'Posts'}
          {showBlueprint && ' • Blueprint beschikbaar'}
        </p>
      </div>

      {/* Progress Bar */}
      <div style={{
        padding: '1rem',
        background: 'rgba(0, 0, 0, 0.3)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '8px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '0.5rem',
          fontSize: '0.8rem',
          color: 'rgba(255, 255, 255, 0.7)'
        }}>
          <span>Voortgang</span>
          <span>
            {items.filter(i => i.title?.trim()).length} / {items.length} compleet
          </span>
        </div>
        <div style={{
          width: '100%',
          height: '8px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '4px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${(items.filter(i => i.title?.trim()).length / items.length) * 100}%`,
            height: '100%',
            background: `linear-gradient(90deg, ${GOLD.primary} 0%, ${GOLD.secondary} 100%)`,
            transition: 'width 0.3s ease'
          }} />
        </div>
      </div>

      {/* Item Cards */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem'
      }}>
        {items.map((item, index) => {
          const isExpanded = expandedCard === index
          const isComplete = item.title?.trim()
          const isBlueprintOpen = blueprintOpen[index]
          const steps = getSteps(index)
          const bRoll = getBRoll(index)
          const hasBlueprint = steps.length > 0 || bRoll.length > 0

          return (
            <div
              key={index}
              style={{
                background: isComplete
                  ? 'rgba(16, 185, 129, 0.1)'
                  : 'rgba(255, 255, 255, 0.03)',
                border: isComplete
                  ? '1px solid rgba(16, 185, 129, 0.3)'
                  : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                overflow: 'hidden'
              }}
            >
              {/* Card Header */}
              <div
                onClick={() => toggleCard(index)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: isMobile ? '1rem' : '1.25rem',
                  cursor: 'pointer',
                  touchAction: 'manipulation'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                  {/* Number badge */}
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: isComplete
                      ? 'rgba(16, 185, 129, 0.2)'
                      : 'rgba(255, 255, 255, 0.1)',
                    border: isComplete
                      ? '1px solid rgba(16, 185, 129, 0.4)'
                      : '1px solid rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.9rem',
                    fontWeight: '700',
                    color: isComplete ? '#10b981' : 'rgba(255, 255, 255, 0.6)',
                    flexShrink: 0
                  }}>
                    {isComplete ? '✓' : index + 1}
                  </div>

                  {/* Title preview */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <span style={{
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        color: isComplete ? '#10b981' : 'rgba(255, 255, 255, 0.7)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {item.title || `Item ${index + 1}`}
                      </span>
                      {/* Blueprint indicator */}
                      {hasBlueprint && (
                        <span style={{
                          padding: '0.125rem 0.375rem',
                          background: 'rgba(255, 215, 0, 0.1)',
                          border: '1px solid rgba(255, 215, 0, 0.3)',
                          borderRadius: '4px',
                          fontSize: '0.6rem',
                          fontWeight: '700',
                          color: GOLD.primary,
                          flexShrink: 0
                        }}>
                          📋 {steps.length}
                        </span>
                      )}
                    </div>
                    {item.location && (
                      <div style={{
                        fontSize: '0.75rem',
                        color: 'rgba(255, 255, 255, 0.4)',
                        marginTop: '0.25rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        📁 {item.location}
                      </div>
                    )}
                  </div>
                </div>

                {isExpanded ? (
                  <ChevronUp size={20} color="rgba(255, 255, 255, 0.5)" />
                ) : (
                  <ChevronDown size={20} color="rgba(255, 255, 255, 0.5)" />
                )}
              </div>

              {/* Card Content - Expandable */}
              {isExpanded && (
                <div style={{
                  padding: isMobile ? '0 1rem 1rem' : '0 1.25rem 1.25rem',
                  borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    paddingTop: '1rem'
                  }}>
                    {/* Title */}
                    <div>
                      <label style={labelStyle(GOLD.primary, true)}>Titel *</label>
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => updateItem(index, 'title', e.target.value)}
                        placeholder="Bijv: Anabolic Window Mythe"
                        style={inputStyle()}
                      />
                    </div>

                    {/* Location */}
                    {shouldShowField(format.id, 'location') && (
                      <div>
                        <label style={labelStyle()}>Locatie / Opslag</label>
                        <input
                          type="text"
                          value={item.location}
                          onChange={(e) => updateItem(index, 'location', e.target.value)}
                          placeholder="Bijv: Dropbox/InfoSliders/Week3"
                          style={inputStyle()}
                        />
                      </div>
                    )}

                    {/* Caption */}
                    {shouldShowField(format.id, 'caption') && (
                      <div>
                        <label style={labelStyle()}>Caption</label>
                        <textarea
                          value={item.caption}
                          onChange={(e) => updateItem(index, 'caption', e.target.value)}
                          placeholder="Caption voor deze post..."
                          rows={3}
                          style={textareaStyle()}
                        />
                      </div>
                    )}

                    {/* Hook */}
                    {shouldShowField(format.id, 'hook') && (
                      <div>
                        <label style={labelStyle()}>Hook (eerste 3 seconden)</label>
                        <input
                          type="text"
                          value={item.hook}
                          onChange={(e) => updateItem(index, 'hook', e.target.value)}
                          placeholder="Pakkende openingszin..."
                          style={inputStyle()}
                        />
                      </div>
                    )}

                    {/* Script */}
                    {shouldShowField(format.id, 'script') && (
                      <div>
                        <label style={labelStyle()}>Script</label>
                        <textarea
                          value={item.script}
                          onChange={(e) => updateItem(index, 'script', e.target.value)}
                          placeholder="Volledige script voor video..."
                          rows={4}
                          style={textareaStyle()}
                        />
                      </div>
                    )}

                    {/* Story-specific fields */}
                    {contentType === 'story' && (
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                        gap: '1rem',
                        padding: '1rem',
                        background: 'rgba(236, 72, 153, 0.1)',
                        border: '1px solid rgba(236, 72, 153, 0.3)',
                        borderRadius: '8px'
                      }}>
                        <div>
                          <label style={labelStyle('#ec4899')}>📱 Story Doel</label>
                          <select
                            value={item.storyGoal || 'autoriteit'}
                            onChange={(e) => updateItem(index, 'storyGoal', e.target.value)}
                            style={selectStyle('#ec4899')}
                          >
                            {Object.entries(STORY_GOALS).map(([key, goal]) => (
                              <option key={key} value={key}>{goal.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label style={labelStyle('#ec4899')}>💡 Story Onderwerp</label>
                          <select
                            value={item.storyTopic || 'progressie'}
                            onChange={(e) => updateItem(index, 'storyTopic', e.target.value)}
                            style={selectStyle('#ec4899')}
                          >
                            {Object.entries(STORY_TOPICS).map(([key, topic]) => (
                              <option key={key} value={key}>{topic.emoji} {topic.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    <div>
                      <label style={labelStyle()}>Extra Notities</label>
                      <textarea
                        value={item.notes}
                        onChange={(e) => updateItem(index, 'notes', e.target.value)}
                        placeholder="Eventuele extra aantekeningen..."
                        rows={2}
                        style={textareaStyle()}
                      />
                    </div>

                    {/* ============================================ */}
                    {/* BLUEPRINT SECTION */}
                    {/* ============================================ */}
                    {showBlueprint && (
                      <div style={{
                        borderTop: '2px solid rgba(255, 215, 0, 0.2)',
                        paddingTop: '1rem'
                      }}>
                        {/* Blueprint Toggle Header */}
                        <button
                          onClick={() => toggleBlueprint(index)}
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.75rem 1rem',
                            background: isBlueprintOpen
                              ? 'rgba(255, 215, 0, 0.1)'
                              : 'rgba(255, 255, 255, 0.03)',
                            border: isBlueprintOpen
                              ? `1px solid ${GOLD.border}`
                              : '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            touchAction: 'manipulation'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Film size={16} color={GOLD.primary} />
                            <span style={{
                              fontSize: '0.85rem',
                              fontWeight: '700',
                              color: GOLD.primary
                            }}>
                              📋 Video Blueprint
                            </span>
                            {steps.length > 0 && (
                              <span style={{
                                padding: '0.125rem 0.5rem',
                                background: 'rgba(16, 185, 129, 0.15)',
                                border: '1px solid rgba(16, 185, 129, 0.3)',
                                borderRadius: '10px',
                                fontSize: '0.7rem',
                                fontWeight: '700',
                                color: '#10b981'
                              }}>
                                {steps.filter(s => s.completed).length}/{steps.length}
                              </span>
                            )}
                          </div>
                          <ChevronDown
                            size={16}
                            color={GOLD.primary}
                            style={{
                              transition: 'transform 0.2s ease',
                              transform: isBlueprintOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                            }}
                          />
                        </button>

                        {/* Blueprint Content */}
                        {isBlueprintOpen && (
                          <div style={{
                            marginTop: '0.75rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.75rem'
                          }}>
                            {/* AI Import Button */}
                            <button
                              onClick={() => setShowImport(index)}
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
                                cursor: 'pointer',
                                touchAction: 'manipulation'
                              }}
                            >
                              <Sparkles size={14} />
                              AI Script Importeren (JSON)
                            </button>

                            {/* Steps List */}
                            {steps.length > 0 && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {steps.map((step, stepIdx) => {
                                  const typeConfig = BLUEPRINT_STEP_TYPES[step.type] || BLUEPRINT_STEP_TYPES.custom
                                  const isEditingThis = editingStep[index] === stepIdx

                                  return (
                                    <div key={stepIdx}>
                                      {/* Step Header */}
                                      <div
                                        onClick={() => setEditingStep(prev => ({
                                          ...prev,
                                          [index]: isEditingThis ? null : stepIdx
                                        }))}
                                        style={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '0.5rem',
                                          marginBottom: '0.375rem',
                                          cursor: 'pointer'
                                        }}
                                      >
                                        {/* Type badge */}
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

                                        {/* Checkbox */}
                                        <button
                                          onClick={(e) => { e.stopPropagation(); toggleStepComplete(index, stepIdx) }}
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

                                      {/* Step Content (read mode) */}
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

                                      {/* Step Edit Mode */}
                                      {isEditingThis && (
                                        <div style={{
                                          padding: '0.75rem',
                                          background: 'rgba(0, 0, 0, 0.3)',
                                          borderRadius: '8px',
                                          border: '1px solid rgba(255, 255, 255, 0.1)'
                                        }}>
                                          {/* Type & Timing */}
                                          <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: '1fr 1fr',
                                            gap: '0.5rem',
                                            marginBottom: '0.625rem'
                                          }}>
                                            <div>
                                              <label style={miniLabel()}>Type</label>
                                              <select
                                                value={step.type}
                                                onChange={(e) => updateStep(index, stepIdx, 'type', e.target.value)}
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
                                                onChange={(e) => updateStep(index, stepIdx, 'timing', e.target.value)}
                                                placeholder="0-3s"
                                                style={miniInput()}
                                              />
                                            </div>
                                          </div>

                                          {/* Beeld */}
                                          <div style={{ marginBottom: '0.625rem' }}>
                                            <label style={miniLabel('#3b82f6')}>
                                              <Camera size={10} style={{ marginRight: '0.25rem' }} />
                                              Beeld
                                            </label>
                                            <textarea
                                              value={step.visual}
                                              onChange={(e) => updateStep(index, stepIdx, 'visual', e.target.value)}
                                              placeholder="Bijv: Gym, close-up, direct in camera"
                                              rows={2}
                                              style={{ ...miniInput(), resize: 'vertical', lineHeight: '1.4' }}
                                            />
                                          </div>

                                          {/* Tekst */}
                                          <div style={{ marginBottom: '0.625rem' }}>
                                            <label style={miniLabel(GOLD.primary)}>
                                              <MessageCircle size={10} style={{ marginRight: '0.25rem' }} />
                                              Tekst
                                            </label>
                                            <textarea
                                              value={step.say}
                                              onChange={(e) => updateStep(index, stepIdx, 'say', e.target.value)}
                                              placeholder="Wat je zegt..."
                                              rows={3}
                                              style={{ ...miniInput(), resize: 'vertical', lineHeight: '1.4' }}
                                            />
                                          </div>

                                          {/* Step Actions */}
                                          <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            gap: '0.5rem'
                                          }}>
                                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                                              <button
                                                onClick={() => moveStep(index, stepIdx, 'up')}
                                                disabled={stepIdx === 0}
                                                style={miniButton(stepIdx === 0)}
                                              >
                                                <ChevronUp size={12} />
                                              </button>
                                              <button
                                                onClick={() => moveStep(index, stepIdx, 'down')}
                                                disabled={stepIdx === steps.length - 1}
                                                style={miniButton(stepIdx === steps.length - 1)}
                                              >
                                                <ChevronDown size={12} />
                                              </button>
                                            </div>
                                            <button
                                              onClick={() => deleteStep(index, stepIdx)}
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
                                              <Trash2 size={10} />
                                              Verwijder
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
                            {showAddStep[index] ? (
                              <div style={{
                                background: 'rgba(0, 0, 0, 0.3)',
                                borderRadius: '8px',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                padding: '0.625rem'
                              }}>
                                <div style={{
                                  fontSize: '0.7rem',
                                  fontWeight: '600',
                                  color: '#666',
                                  marginBottom: '0.375rem'
                                }}>Type:</div>
                                <div style={{
                                  display: 'grid',
                                  gridTemplateColumns: 'repeat(3, 1fr)',
                                  gap: '0.25rem'
                                }}>
                                  {Object.entries(BLUEPRINT_STEP_TYPES).map(([key, val]) => (
                                    <button
                                      key={key}
                                      onClick={() => addStep(index, key)}
                                      style={{
                                        padding: '0.375rem',
                                        background: `${val.color}20`,
                                        border: `1px solid ${val.color}`,
                                        borderRadius: '4px',
                                        color: val.color,
                                        fontSize: '0.65rem',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        minHeight: '36px',
                                        touchAction: 'manipulation'
                                      }}
                                    >
                                      {val.label}
                                    </button>
                                  ))}
                                </div>
                                <button
                                  onClick={() => setShowAddStep(prev => ({ ...prev, [index]: false }))}
                                  style={{
                                    width: '100%',
                                    marginTop: '0.375rem',
                                    padding: '0.375rem',
                                    background: 'transparent',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '4px',
                                    color: '#666',
                                    fontSize: '0.7rem',
                                    cursor: 'pointer'
                                  }}
                                >
                                  Annuleren
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setShowAddStep(prev => ({ ...prev, [index]: true }))}
                                style={{
                                  width: '100%',
                                  padding: '0.625rem',
                                  background: 'rgba(0, 0, 0, 0.2)',
                                  border: '1px dashed rgba(255, 255, 255, 0.15)',
                                  borderRadius: '8px',
                                  color: '#666',
                                  fontSize: '0.8rem',
                                  fontWeight: '500',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '0.5rem',
                                  touchAction: 'manipulation'
                                }}
                              >
                                <Plus size={14} />
                                Stap toevoegen
                              </button>
                            )}

                            {/* B-ROLL Section */}
                            <div style={{
                              borderTop: '1px solid rgba(139, 92, 246, 0.2)',
                              paddingTop: '0.75rem'
                            }}>
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginBottom: '0.5rem'
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                  <Video size={12} color="#8b5cf6" />
                                  <span style={{
                                    fontSize: '0.7rem',
                                    fontWeight: '700',
                                    color: '#8b5cf6',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em'
                                  }}>
                                    B-Roll
                                  </span>
                                </div>
                                {bRoll.length > 0 && (
                                  <span style={{
                                    fontSize: '0.65rem',
                                    fontWeight: '700',
                                    color: bRoll.filter(b => b.completed).length === bRoll.length ? '#10b981' : '#8b5cf6'
                                  }}>
                                    {bRoll.filter(b => b.completed).length}/{bRoll.length}
                                  </span>
                                )}
                              </div>

                              {/* B-Roll Items */}
                              {bRoll.length > 0 && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', marginBottom: '0.5rem' }}>
                                  {bRoll.map((br) => {
                                    const brType = BROLL_TYPES.find(t => t.id === br.type) || BROLL_TYPES[5]
                                    return (
                                      <div key={br.id} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.375rem',
                                        padding: '0.5rem',
                                        background: br.completed ? 'rgba(16, 185, 129, 0.1)' : 'rgba(0, 0, 0, 0.2)',
                                        border: br.completed ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)',
                                        borderRadius: '6px'
                                      }}>
                                        <button
                                          onClick={() => toggleBRoll(index, br.id)}
                                          style={{
                                            width: '20px',
                                            height: '20px',
                                            borderRadius: '3px',
                                            background: br.completed ? '#10b981' : 'transparent',
                                            border: br.completed ? 'none' : '2px solid #333',
                                            color: br.completed ? '#000' : 'transparent',
                                            cursor: 'pointer',
                                            flexShrink: 0,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                          }}
                                        >
                                          {br.completed && <Check size={12} strokeWidth={3} />}
                                        </button>
                                        <span style={{ fontSize: '0.7rem' }}>{brType.icon}</span>
                                        <span style={{
                                          flex: 1,
                                          fontSize: '0.75rem',
                                          color: br.completed ? '#666' : '#fff',
                                          textDecoration: br.completed ? 'line-through' : 'none',
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                          whiteSpace: 'nowrap'
                                        }}>
                                          {br.description}
                                        </span>
                                        <span style={{ fontSize: '0.6rem', color: '#555', flexShrink: 0 }}>{br.duration}</span>
                                        <button
                                          onClick={() => deleteBRoll(index, br.id)}
                                          style={{
                                            width: '20px',
                                            height: '20px',
                                            background: 'rgba(239, 68, 68, 0.1)',
                                            border: 'none',
                                            borderRadius: '3px',
                                            color: '#ef4444',
                                            cursor: 'pointer',
                                            flexShrink: 0,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                          }}
                                        >
                                          <Trash2 size={10} />
                                        </button>
                                      </div>
                                    )
                                  })}
                                </div>
                              )}

                              {/* Add B-Roll */}
                              {showAddBRoll[index] ? (
                                <div style={{
                                  background: 'rgba(0, 0, 0, 0.3)',
                                  borderRadius: '8px',
                                  border: '1px solid rgba(255, 255, 255, 0.1)',
                                  padding: '0.625rem'
                                }}>
                                  <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(3, 1fr)',
                                    gap: '0.25rem',
                                    marginBottom: '0.375rem'
                                  }}>
                                    {BROLL_TYPES.map(type => (
                                      <button
                                        key={type.id}
                                        onClick={() => setNewBRoll(prev => ({ ...prev, type: type.id }))}
                                        style={{
                                          padding: '0.375rem',
                                          background: newBRoll.type === type.id ? `${type.color}30` : `${type.color}10`,
                                          border: `1px solid ${newBRoll.type === type.id ? type.color : `${type.color}50`}`,
                                          borderRadius: '4px',
                                          color: type.color,
                                          fontSize: '0.65rem',
                                          fontWeight: '600',
                                          cursor: 'pointer',
                                          minHeight: '32px'
                                        }}
                                      >
                                        {type.icon}
                                      </button>
                                    ))}
                                  </div>
                                  <input
                                    type="text"
                                    value={newBRoll.description}
                                    onChange={(e) => setNewBRoll(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Beschrijving..."
                                    style={{ ...miniInput(), marginBottom: '0.375rem' }}
                                  />
                                  <input
                                    type="text"
                                    value={newBRoll.duration}
                                    onChange={(e) => setNewBRoll(prev => ({ ...prev, duration: e.target.value }))}
                                    placeholder="3s"
                                    style={{ ...miniInput(), marginBottom: '0.375rem' }}
                                  />
                                  <div style={{ display: 'flex', gap: '0.375rem' }}>
                                    <button
                                      onClick={() => {
                                        setShowAddBRoll(prev => ({ ...prev, [index]: false }))
                                        setNewBRoll({ type: 'gym', description: '', duration: '3s' })
                                      }}
                                      style={{
                                        flex: 1,
                                        padding: '0.375rem',
                                        background: 'transparent',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '4px',
                                        color: '#666',
                                        fontSize: '0.7rem',
                                        cursor: 'pointer'
                                      }}
                                    >
                                      Annuleren
                                    </button>
                                    <button
                                      onClick={() => addBRollItem(index)}
                                      disabled={!newBRoll.description.trim()}
                                      style={{
                                        flex: 1,
                                        padding: '0.375rem',
                                        background: newBRoll.description.trim() ? '#8b5cf6' : 'rgba(255, 255, 255, 0.05)',
                                        border: 'none',
                                        borderRadius: '4px',
                                        color: newBRoll.description.trim() ? '#fff' : '#666',
                                        fontSize: '0.7rem',
                                        fontWeight: '600',
                                        cursor: newBRoll.description.trim() ? 'pointer' : 'not-allowed'
                                      }}
                                    >
                                      Toevoegen
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setShowAddBRoll(prev => ({ ...prev, [index]: true }))}
                                  style={{
                                    width: '100%',
                                    padding: '0.5rem',
                                    background: 'rgba(139, 92, 246, 0.08)',
                                    border: '1px dashed rgba(139, 92, 246, 0.3)',
                                    borderRadius: '6px',
                                    color: '#8b5cf6',
                                    fontSize: '0.75rem',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.375rem',
                                    touchAction: 'manipulation'
                                  }}
                                >
                                  <Plus size={12} />
                                  B-roll toevoegen
                                </button>
                              )}
                            </div>

                            {/* Edit Notes */}
                            <div>
                              <label style={miniLabel(GOLD.primary)}>
                                <Film size={10} style={{ marginRight: '0.25rem' }} />
                                Edit instructies
                              </label>
                              <textarea
                                value={item.editNotes || ''}
                                onChange={(e) => updateItem(index, 'editNotes', e.target.value)}
                                placeholder="Edit instructies voor deze video..."
                                rows={2}
                                style={{ ...miniInput(), resize: 'vertical', lineHeight: '1.4' }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Quick Fill Helper */}
      <div style={{
        padding: '1rem',
        background: `${GOLD.background}`,
        border: `1px solid ${GOLD.border}`,
        borderRadius: '8px',
        fontSize: '0.8rem',
        color: 'rgba(255, 255, 255, 0.7)',
        lineHeight: '1.5'
      }}>
        <div style={{
          fontWeight: '700',
          color: GOLD.primary,
          marginBottom: '0.5rem'
        }}>
          💡 Tip: Vul snel in
        </div>
        <div>
          • Gebruik TAB om tussen velden te springen<br />
          • Caption kun je ook later nog toevoegen<br />
          {showBlueprint && '• Klik "📋 Video Blueprint" om stappen toe te voegen\n'}
          {showBlueprint && '• Gebruik AI Import voor automatische script opbouw'}
        </div>
      </div>

      {/* ============================================ */}
      {/* AI IMPORT MODAL */}
      {/* ============================================ */}
      {showImport !== null && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.95)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          zIndex: 2000
        }}>
          <div style={{
            width: '100%',
            maxWidth: '500px',
            background: '#0a0a0a',
            borderRadius: '12px',
            border: `1px solid ${GOLD.border}`,
            overflow: 'hidden'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={16} color={GOLD.primary} />
                <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: '700', color: '#fff' }}>
                  AI Import — Item {showImport + 1}
                </h3>
              </div>
              <button
                onClick={() => { setShowImport(null); setImportJson(''); setImportError('') }}
                style={{
                  width: '32px',
                  height: '32px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#666',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: '1rem' }}>
              <p style={{
                margin: '0 0 0.75rem',
                fontSize: '0.8rem',
                color: '#666',
                lineHeight: '1.5'
              }}>
                Plak JSON met blueprint_steps, b_roll_list, edit_notes, productie_checklist:
              </p>

              <textarea
                value={importJson}
                onChange={(e) => { setImportJson(e.target.value); setImportError('') }}
                placeholder='{"blueprint_steps": [...], "b_roll_list": [...]}'
                rows={8}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#0f0f0f',
                  border: importError ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '0.75rem',
                  fontFamily: 'monospace',
                  outline: 'none',
                  resize: 'vertical',
                  lineHeight: '1.5'
                }}
              />

              {importError && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginTop: '0.5rem',
                  padding: '0.5rem',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '6px',
                  color: '#ef4444',
                  fontSize: '0.75rem'
                }}>
                  <AlertCircle size={14} />
                  {importError}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  onClick={() => { setShowImport(null); setImportJson(''); setImportError('') }}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '6px',
                    color: '#666',
                    fontWeight: '600',
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  Annuleren
                </button>
                <button
                  onClick={() => handleImport(showImport)}
                  disabled={!importJson.trim()}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: importJson.trim()
                      ? `linear-gradient(90deg, ${GOLD.primary} 0%, ${GOLD.secondary} 100%)`
                      : 'rgba(255, 255, 255, 0.05)',
                    border: 'none',
                    borderRadius: '6px',
                    color: importJson.trim() ? '#000' : '#666',
                    fontWeight: '700',
                    fontSize: '0.85rem',
                    cursor: importJson.trim() ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <Sparkles size={16} />
                  Import
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================
// STYLE HELPERS
// ============================================

function labelStyle(color = 'rgba(255, 255, 255, 0.7)', isRequired = false) {
  return {
    display: 'block',
    fontSize: '0.75rem',
    fontWeight: isRequired ? '700' : '600',
    color,
    marginBottom: '0.5rem',
    textTransform: isRequired ? 'uppercase' : 'none'
  }
}

function inputStyle() {
  return {
    width: '100%',
    padding: '0.75rem',
    background: 'rgba(0, 0, 0, 0.4)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '0.9rem',
    outline: 'none'
  }
}

function textareaStyle() {
  return {
    width: '100%',
    padding: '0.75rem',
    background: 'rgba(0, 0, 0, 0.4)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '0.9rem',
    outline: 'none',
    resize: 'vertical',
    lineHeight: '1.5'
  }
}

function selectStyle(borderColor = 'rgba(255, 255, 255, 0.2)') {
  return {
    width: '100%',
    padding: '0.75rem',
    background: 'rgba(0, 0, 0, 0.6)',
    border: `1px solid ${borderColor}40`,
    borderRadius: '8px',
    color: '#fff',
    fontSize: '0.9rem',
    outline: 'none'
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

function miniButton(disabled) {
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
