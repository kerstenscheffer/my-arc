// src/modules/content-batches/components/BatchModal.jsx
// Main modal for creating content batches
// Multi-step wizard: Format → Items → Planning
// UPDATED: Blueprint data (blueprintSteps, bRollList, editNotes, productieChecklist) flows through

import { useState } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import BatchFormatSelector from './BatchFormatSelector'
import DynamicItemsBuilder from './DynamicItemsBuilder'
import BatchPlanningOptions from './BatchPlanningOptions'
import { GOLD } from '../../output-planning/components/week-planning/constants'

export default function BatchModal({
  isOpen,
  onClose,
  onSave,
  db,
  isMobile = false
}) {
  // Wizard steps
  const [currentStep, setCurrentStep] = useState(1) // 1=Format, 2=Items, 3=Planning
  
  // Batch data
  const [selectedFormat, setSelectedFormat] = useState(null)
  const [contentType, setContentType] = useState('post') // 'post' or 'story'
  const [batchName, setBatchName] = useState('')
  const [itemCount, setItemCount] = useState(7)
  const [items, setItems] = useState([])
  const [planningType, setPlanningType] = useState('ready')
  const [recurringPattern, setRecurringPattern] = useState(null)
  const [manualDates, setManualDates] = useState([])
  
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  if (!isOpen) return null

  // Step navigation
  const canGoNext = () => {
    if (currentStep === 1) return selectedFormat !== null
    if (currentStep === 2) return items.length === itemCount && items.every(i => i.title?.trim())
    if (currentStep === 3) return true
    return false
  }

  const handleNext = () => {
    if (currentStep === 1) {
      // Initialize items array when moving to step 2
      // UPDATED: Include blueprint fields
      const newItems = Array.from({ length: itemCount }, (_, i) => ({
        itemNumber: i + 1,
        title: '',
        // Waarden van de custom-format-velden komen hierin ({veld_key: waarde}).
        fieldValues: {},
        storyGoal: contentType === 'story' ? 'autoriteit' : null,
        storyTopic: contentType === 'story' ? 'progressie' : null,
      }))
      setItems(newItems)
    }
    setCurrentStep(prev => Math.min(prev + 1, 3))
  }

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)

    try {
      // UPDATED: Include blueprint data per item
      const batchData = {
        batchName: batchName || `${selectedFormat.name || 'Format'} batch`,
        postFormat: selectedFormat.name || null,   // leesbaar label (legacy kolom)
        formatId: selectedFormat.id,                // koppeling naar het custom format
        contentType,
        totalItems: itemCount,
        planningType,
        recurringPattern,
        items: items.map((item, index) => ({
          ...item,
          plannedDate: planningType === 'manual' ? manualDates[index] : null,
          fieldValues: item.fieldValues || {},
        }))
      }

      await onSave(batchData)
      
      // Reset and close
      resetModal()
      onClose()
    } catch (err) {
      console.error('Failed to save batch:', err)
      setError('Kon batch niet opslaan: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const resetModal = () => {
    setCurrentStep(1)
    setSelectedFormat(null)
    setContentType('post')
    setBatchName('')
    setItemCount(7)
    setItems([])
    setPlanningType('ready')
    setRecurringPattern(null)
    setManualDates([])
    setError(null)
  }

  const handleClose = () => {
    if (confirm('Weet je zeker dat je wilt sluiten? Alle wijzigingen gaan verloren.')) {
      resetModal()
      onClose()
    }
  }

  // Step indicator
  const steps = [
    { number: 1, label: 'Format' },
    { number: 2, label: 'Items' },
    { number: 3, label: 'Planning' }
  ]

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
      zIndex: 1000,
      padding: isMobile ? '1rem' : '2rem'
    }}>
      {/* Modal Container */}
      <div style={{
        width: isMobile ? '100%' : '90%',
        maxWidth: '1200px',
        height: isMobile ? '100%' : 'auto',
        maxHeight: isMobile ? '100%' : '90vh',
        background: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)',
        border: `1px solid ${GOLD.border}`,
        borderRadius: isMobile ? '0' : '16px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
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
          <div>
            <h2 style={{
              margin: 0,
              fontSize: isMobile ? '1.25rem' : '1.5rem',
              fontWeight: '800',
              color: GOLD.primary
            }}>
              📦 Batch Maken
            </h2>
            <p style={{
              margin: '0.25rem 0 0',
              fontSize: isMobile ? '0.8rem' : '0.85rem',
              color: 'rgba(255, 255, 255, 0.5)'
            }}>
              {selectedFormat ? (selectedFormat.name || 'Format') : 'Kies een format'}
            </p>
          </div>

          <button
            onClick={handleClose}
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
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Step Indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          padding: '1rem',
          background: 'rgba(0, 0, 0, 0.3)',
          borderBottom: `1px solid ${GOLD.border}`
        }}>
          {steps.map((step, idx) => (
            <div key={step.number} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {/* Step circle */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.25rem'
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: currentStep === step.number 
                    ? `linear-gradient(135deg, ${GOLD.primary} 0%, ${GOLD.secondary} 100%)`
                    : currentStep > step.number
                      ? 'rgba(16, 185, 129, 0.3)'
                      : 'rgba(255, 255, 255, 0.1)',
                  border: currentStep === step.number 
                    ? `2px solid ${GOLD.primary}`
                    : '1px solid rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: currentStep === step.number ? '#000' : '#fff',
                  fontWeight: '700',
                  fontSize: '0.85rem'
                }}>
                  {currentStep > step.number ? '✓' : step.number}
                </div>
                <span style={{
                  fontSize: '0.7rem',
                  color: currentStep === step.number ? GOLD.primary : 'rgba(255, 255, 255, 0.4)',
                  fontWeight: currentStep === step.number ? '700' : '500'
                }}>
                  {step.label}
                </span>
              </div>
              
              {/* Connector */}
              {idx < steps.length - 1 && (
                <div style={{
                  width: isMobile ? '40px' : '80px',
                  height: '2px',
                  background: currentStep > step.number 
                    ? GOLD.primary
                    : 'rgba(255, 255, 255, 0.1)',
                  marginTop: '-1.5rem'
                }} />
              )}
            </div>
          ))}
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: isMobile ? '1rem' : '2rem'
        }}>
          {/* Step 1: Format Selection */}
          {currentStep === 1 && (
            <BatchFormatSelector
              selectedFormat={selectedFormat}
              contentType={contentType}
              batchName={batchName}
              itemCount={itemCount}
              onFormatSelect={setSelectedFormat}
              onContentTypeChange={setContentType}
              onBatchNameChange={setBatchName}
              onItemCountChange={setItemCount}
              isMobile={isMobile}
            />
          )}

          {/* Step 2: Items Builder */}
          {currentStep === 2 && (
            <BatchItemsBuilder
              format={selectedFormat}
              contentType={contentType}
              items={items}
              onItemsChange={setItems}
              isMobile={isMobile}
            />
          )}

          {/* Step 3: Planning Options */}
          {currentStep === 3 && (
            <BatchPlanningOptions
              planningType={planningType}
              recurringPattern={recurringPattern}
              manualDates={manualDates}
              itemCount={itemCount}
              onPlanningTypeChange={setPlanningType}
              onRecurringPatternChange={setRecurringPattern}
              onManualDatesChange={setManualDates}
              isMobile={isMobile}
            />
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div style={{
            padding: '1rem',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            margin: '0 1rem 1rem',
            color: '#ef4444',
            fontSize: '0.85rem'
          }}>
            {error}
          </div>
        )}

        {/* Footer / Navigation */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: isMobile ? '1rem' : '1.5rem',
          borderTop: `1px solid ${GOLD.border}`,
          background: 'rgba(0, 0, 0, 0.3)'
        }}>
          {/* Back button */}
          <button
            onClick={handleBack}
            disabled={currentStep === 1}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.25rem',
              background: currentStep === 1 ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              color: currentStep === 1 ? 'rgba(255, 255, 255, 0.3)' : '#fff',
              fontWeight: '600',
              fontSize: '0.9rem',
              cursor: currentStep === 1 ? 'not-allowed' : 'pointer',
              opacity: currentStep === 1 ? 0.5 : 1
            }}
          >
            <ChevronLeft size={18} />
            {!isMobile && 'Terug'}
          </button>

          {/* Next / Save button */}
          {currentStep < 3 ? (
            <button
              onClick={handleNext}
              disabled={!canGoNext()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.25rem',
                background: canGoNext() 
                  ? `linear-gradient(135deg, ${GOLD.primary} 0%, ${GOLD.secondary} 100%)`
                  : 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                borderRadius: '8px',
                color: canGoNext() ? '#000' : 'rgba(255, 255, 255, 0.3)',
                fontWeight: '700',
                fontSize: '0.9rem',
                cursor: canGoNext() ? 'pointer' : 'not-allowed'
              }}
            >
              {!isMobile && 'Volgende'}
              <ChevronRight size={18} />
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                background: saving 
                  ? 'rgba(255, 255, 255, 0.1)'
                  : `linear-gradient(135deg, ${GOLD.primary} 0%, ${GOLD.secondary} 100%)`,
                border: 'none',
                borderRadius: '8px',
                color: saving ? 'rgba(255, 255, 255, 0.5)' : '#000',
                fontWeight: '700',
                fontSize: '0.9rem',
                cursor: saving ? 'wait' : 'pointer'
              }}
            >
              {saving ? 'Opslaan...' : '✅ Batch Opslaan'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
