// Two-step picker: client kiest eerst een dag-template uit z'n bibliotheek,
// dan de dag in de week waar 'ie geplaatst moet worden. Vervangt het
// bestaande ApplyTemplateModal-flow in AIDaySchedule die alleen werkte
// als de template al geselecteerd was.

import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, ChevronRight, Check, Calendar, Utensils } from 'lucide-react'

const DAYS = [
  { key: 'monday',    label: 'Maandag' },
  { key: 'tuesday',   label: 'Dinsdag' },
  { key: 'wednesday', label: 'Woensdag' },
  { key: 'thursday',  label: 'Donderdag' },
  { key: 'friday',    label: 'Vrijdag' },
  { key: 'saturday',  label: 'Zaterdag' },
  { key: 'sunday',    label: 'Zondag' },
]

export default function DayTemplatePickerModal({
  isOpen, onClose,
  dayTemplates = [],
  clientId,
  activePlan,
  currentDayKey,
  db,
  onSuccess,
  isMobile,
}) {
  const [step, setStep] = useState(1) // 1=pick template, 2=pick day
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [selectedDay, setSelectedDay] = useState(currentDayKey || null)
  const [applying, setApplying] = useState(false)
  const [error, setError] = useState(null)

  if (!isOpen) return null

  const handleApply = async () => {
    if (!selectedTemplate || !selectedDay || !activePlan?.id) return
    setApplying(true); setError(null)
    try {
      await db.applyDayTemplateToWeek(clientId, activePlan.id, selectedDay, selectedTemplate.id)
      if (onSuccess) onSuccess(selectedDay)
      onClose()
    } catch (e) {
      console.error('applyDayTemplate failed:', e)
      setError(e?.message || 'Toepassen mislukt')
    } finally {
      setApplying(false)
    }
  }

  return createPortal(
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.85)',
        zIndex: 11000,
        display: 'flex',
        alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center',
        padding: isMobile ? 0 : '1.5rem',
      }}
    >
      <div style={{
        width: '100%', maxWidth: isMobile ? '100%' : 520,
        maxHeight: isMobile ? '92vh' : '85vh',
        background: '#0a0a0a',
        border: '1px solid rgba(255,215,0,0.25)',
        borderRadius: isMobile ? '14px 14px 0 0' : 14,
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '0.875rem 1rem',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Utensils size={15} color="#FFD700" />
            <span style={{ color: '#fff', fontWeight: 800, fontSize: '0.9rem' }}>
              {step === 1 ? 'Kies een dag-template' : 'Op welke dag toepassen?'}
            </span>
          </div>
          <button onClick={onClose} style={{
            width: 32, height: 32,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8, color: 'rgba(255,255,255,0.4)',
            cursor: 'pointer', touchAction: 'manipulation',
          }}>
            <X size={14} />
          </button>
        </div>

        {/* Step indicator */}
        <div style={{
          display: 'flex', gap: 0,
          background: 'rgba(255,255,255,0.02)',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
        }}>
          {['Template kiezen', 'Dag kiezen'].map((label, i) => {
            const idx = i + 1
            const active = idx === step
            const done = idx < step
            return (
              <div key={label} style={{
                flex: 1, padding: '0.5rem 0.8rem',
                textAlign: 'center',
                color: active ? '#FFD700' : done ? 'rgba(16,185,129,0.6)' : 'rgba(255,255,255,0.3)',
                fontSize: '0.62rem', fontWeight: 800,
                textTransform: 'uppercase', letterSpacing: '0.04em',
                borderBottom: active ? '2px solid #FFD700' : '2px solid transparent',
              }}>
                {done ? '✓ ' : `${idx}. `}{label}
              </div>
            )
          })}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem' }}>
          {step === 1 && (
            <>
              {dayTemplates.length === 0 && (
                <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>
                  Er zijn nog geen dag-templates beschikbaar.
                </div>
              )}
              {dayTemplates.map(tpl => {
                const isSel = selectedTemplate?.id === tpl.id
                return (
                  <button
                    key={tpl.id}
                    onClick={() => { setSelectedTemplate(tpl); setStep(2) }}
                    style={{
                      width: '100%', marginBottom: '0.4rem',
                      padding: '0.7rem 0.85rem',
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      background: isSel ? 'rgba(255,215,0,0.08)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${isSel ? 'rgba(255,215,0,0.35)' : 'rgba(255,255,255,0.06)'}`,
                      borderRadius: 8,
                      cursor: 'pointer', touchAction: 'manipulation',
                      textAlign: 'left',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: '#fff', fontWeight: 800, fontSize: '0.85rem', marginBottom: 2 }}>
                        {tpl.name || 'Naamloos'}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>
                        {Math.round(tpl.total_calories || 0)} kcal
                        {tpl.total_protein != null && ` · ${Math.round(tpl.total_protein)}g E`}
                        {tpl.total_carbs != null && ` · ${Math.round(tpl.total_carbs)}g K`}
                        {tpl.total_fat != null && ` · ${Math.round(tpl.total_fat)}g V`}
                      </div>
                    </div>
                    <ChevronRight size={14} color="rgba(255,215,0,0.5)" />
                  </button>
                )
              })}
            </>
          )}

          {step === 2 && (
            <>
              <div style={{
                padding: '0.55rem 0.7rem',
                background: 'rgba(255,215,0,0.05)',
                border: '1px solid rgba(255,215,0,0.2)',
                borderRadius: 7,
                marginBottom: '0.6rem',
                fontSize: '0.72rem',
                color: 'rgba(255,255,255,0.7)',
              }}>
                <span style={{ color: '#FFD700', fontWeight: 800 }}>{selectedTemplate?.name}</span> wordt toegepast op de gekozen dag.
              </div>
              {DAYS.map(d => {
                const isSel = selectedDay === d.key
                return (
                  <button
                    key={d.key}
                    onClick={() => setSelectedDay(d.key)}
                    style={{
                      width: '100%', marginBottom: 3,
                      padding: '0.7rem 0.85rem',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      background: isSel ? 'rgba(255,215,0,0.1)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${isSel ? 'rgba(255,215,0,0.4)' : 'rgba(255,255,255,0.06)'}`,
                      borderRadius: 7,
                      cursor: 'pointer', touchAction: 'manipulation',
                      color: isSel ? '#FFD700' : '#fff',
                      fontSize: '0.85rem', fontWeight: isSel ? 800 : 600,
                      textAlign: 'left',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Calendar size={12} color={isSel ? '#FFD700' : 'rgba(255,255,255,0.3)'} />
                      {d.label}
                    </span>
                    {isSel && <Check size={14} color="#FFD700" strokeWidth={3} />}
                  </button>
                )
              })}
              {error && (
                <div style={{ padding: '0.55rem 0.7rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 6, color: '#fca5a5', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                  {error}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '0.7rem 1rem',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', gap: '0.5rem', flexShrink: 0,
        }}>
          {step === 2 && (
            <button
              onClick={() => setStep(1)}
              style={{
                flex: 1, padding: '0.6rem',
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                color: 'rgba(255,255,255,0.5)',
                fontSize: '0.78rem', fontWeight: 700,
                cursor: 'pointer', minHeight: 42,
              }}
            >
              ← Terug
            </button>
          )}
          {step === 2 && (
            <button
              onClick={handleApply}
              disabled={!selectedDay || applying}
              style={{
                flex: 2, padding: '0.6rem',
                background: selectedDay ? '#FFD700' : 'rgba(255,255,255,0.04)',
                border: 'none',
                borderRadius: 8,
                color: selectedDay ? '#000' : 'rgba(255,255,255,0.3)',
                fontSize: '0.82rem', fontWeight: 800,
                cursor: selectedDay && !applying ? 'pointer' : 'default',
                minHeight: 42,
                opacity: applying ? 0.6 : 1,
              }}
            >
              {applying ? 'Toepassen…' : `Toepassen op ${DAYS.find(d => d.key === selectedDay)?.label || 'dag'}`}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
