// src/modules/client-journey/components/calls/steps/IntakeStepOutput.jsx
import React, { useState, useEffect } from 'react'

const C = {
  gold: '#FFD700', green: '#10b981', amber: '#f59e0b', blue: '#3b82f6',
  text: '#ffffff', text50: 'rgba(255,255,255,0.5)',
  text25: 'rgba(255,255,255,0.25)', text15: 'rgba(255,255,255,0.15)',
  border: 'rgba(255,255,255,0.06)', borderSub: 'rgba(255,255,255,0.04)',
}

const COACHING_LEVEL_LABELS = {
  A: 'Strict plan (Level A)',
  B: 'Flexibel plan (Level B)',
  C: 'Macro coaching (Level C)',
}

const SCHEMA_LABELS = {
  full_body: 'Full Body', upper_lower: 'Upper/Lower',
  ppl: 'PPL', ppl_4: 'PPL 4-daags', bro_split: 'Bro Split',
}

function buildActions({ cd, result, notes, coachingLevel }) {
  const delivery = notes.plan?.delivery ? notes.plan.delivery.split('\n').filter(Boolean) : []
  const schema = notes.training?.schema
  const actions = []

  // Automatisch gegenereerd vanuit plan
  if (result?.targetCal) {
    actions.push({
      id: 'macro_targets',
      text: `Macro targets instellen: ${result.targetCal} kcal · ${result.prot}g E · ${result.carbs}g K · ${result.fat}g V`,
      done: false,
      auto: true,
    })
  }
  if (schema) {
    actions.push({
      id: 'training_schema',
      text: `${SCHEMA_LABELS[schema] || schema} schema aanmaken`,
      done: false,
      auto: true,
    })
  }
  if (coachingLevel) {
    actions.push({
      id: 'coaching_level',
      text: `Coaching level instellen: ${COACHING_LEVEL_LABELS[coachingLevel] || coachingLevel}`,
      done: false,
      auto: true,
    })
  }
  if (result?.goalWeight && result?.weeksNeeded) {
    actions.push({
      id: 'deadline',
      text: `Deadline instellen: ${result.goalWeight} kg doel in ${result.weeksNeeded} weken`,
      done: false,
      auto: true,
    })
  }

  // Vanuit delivery picker
  delivery.forEach((item, i) => {
    if (!actions.find(a => a.text.toLowerCase().includes(item.toLowerCase().slice(0, 20)))) {
      actions.push({ id: `delivery_${i}`, text: item, done: false, auto: false })
    }
  })

  return actions
}

function buildWhatsApp({ cd, result, notes, coachingLevel }) {
  const naam = cd?.first_name || 'jij'
  const schema = notes.training?.schema ? SCHEMA_LABELS[notes.training.schema] || notes.training.schema : null
  const sessies = cd?.workout_days_per_week
  const delivery = notes.plan?.delivery ? notes.plan.delivery.split('\n').filter(Boolean) : []
  const startdatum = notes.afspraken?.startdatum || 'nader te bepalen'
  const callFreq = notes.afspraken?.call_freq || 'nader te bepalen'

  const goalType = {
    fat_loss: 'Vetverlies', muscle_gain: 'Spieropbouw',
    recomp: 'Body Recomp', general_fitness: 'Fitter worden',
  }[cd?.primary_goal] || 'Jouw doel'

  const lines = [
    `Hey ${naam}! 👋`,
    ``,
    `Gaaf dat we samen aan de slag gaan. Dit is de samenvatting van onze call:`,
    ``,
    result?.targetCal
      ? `🎯 DOEL: ${goalType}${result.kgToLose ? ` — ${result.kgToLose} kg in ${result.weeksNeeded} weken` : ''}`
      : `🎯 DOEL: ${goalType}`,
    result?.targetCal
      ? `📊 PLAN: ${result.targetCal} kcal/dag · ${result.prot}g eiwit · ${result.carbs}g koolh · ${result.fat}g vet`
      : null,
    (schema || sessies)
      ? `💪 TRAINING: ${[schema, sessies ? `${sessies}x/week` : null].filter(Boolean).join(' · ')}`
      : null,
    coachingLevel
      ? `🍽 VOEDING: ${COACHING_LEVEL_LABELS[coachingLevel] || coachingLevel}`
      : null,
    ``,
    delivery.length > 0 ? `WAT IK GA MAKEN:` : null,
    ...delivery.map(d => `✅ ${d}`),
    ``,
    `Startdatum: ${startdatum}`,
    `Volgende call: ${callFreq}`,
    ``,
    `Vragen? App me gewoon. Let's go! 💪`,
    `— Kersten`,
  ].filter(l => l !== null)

  return lines.join('\n')
}

export default function IntakeStepOutput({ cd, result, notes, coachingLevel, onBack, onSave, isMobile }) {
  const [actions, setActions] = useState([])
  const [waText, setWaText] = useState('')
  const [copied, setCopied] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setActions(buildActions({ cd, result, notes, coachingLevel }))
    setWaText(buildWhatsApp({ cd, result, notes, coachingLevel }))
  }, [cd, result, notes, coachingLevel])

  const toggleAction = (id) => {
    setActions(prev => prev.map(a => a.id === id ? { ...a, done: !a.done } : a))
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(waText).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  const handleSave = async () => {
    if (onSave) await onSave({ actions, waText })
    setSaved(true)
  }

  const doneCount = actions.filter(a => a.done).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '8px 14px', borderBottom: `1px solid ${C.borderSub}`, display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <span style={{ fontSize: '9px', fontWeight: 700, color: C.green, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Call afgerond
        </span>
        <div style={{ flex: 1, height: '2px', background: C.green, borderRadius: '1px' }} />
        <span style={{ fontSize: '9px', fontWeight: 700, color: doneCount === actions.length && actions.length > 0 ? C.green : C.text25 }}>
          {doneCount}/{actions.length} klaar
        </span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {/* Plan samenvatting */}
        {result?.targetCal && (
          <div style={{ display: 'flex', gap: '0', borderBottom: `1px solid ${C.borderSub}` }}>
            {[
              { label: 'TARGET', value: `${result.targetCal}`, unit: 'kcal', color: C.gold },
              { label: 'EIWIT', value: `${result.prot}`, unit: 'g', color: C.green },
              { label: 'CARBS', value: `${result.carbs}`, unit: 'g', color: C.blue },
              { label: 'VET', value: `${result.fat}`, unit: 'g', color: C.amber },
            ].map((s, i, arr) => (
              <div key={i} style={{
                flex: 1, padding: '8px 10px',
                borderRight: i < arr.length - 1 ? `1px solid ${C.borderSub}` : 'none',
              }}>
                <div style={{ fontSize: '8px', fontWeight: 700, color: C.text25, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>{s.label}</div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: s.color, lineHeight: 1 }}>
                  {s.value}<span style={{ fontSize: '8px', opacity: 0.4, marginLeft: '1px' }}>{s.unit}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Actie-lijst */}
        <div style={{ padding: '8px 14px 4px', borderBottom: `1px solid ${C.borderSub}` }}>
          <div style={{ fontSize: '9px', fontWeight: 700, color: C.text25, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
            Coach actie-lijst
          </div>
          {actions.map(action => (
            <div key={action.id} onClick={() => toggleAction(action.id)} style={{
              display: 'flex', alignItems: 'flex-start', gap: '8px',
              padding: '5px 0', borderBottom: `1px solid rgba(255,255,255,0.03)`,
              cursor: 'pointer',
            }}>
              <div style={{
                width: '14px', height: '14px', borderRadius: '3px', flexShrink: 0, marginTop: '1px',
                background: action.done ? 'rgba(255,215,0,0.15)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${action.done ? 'rgba(255,215,0,0.4)' : 'rgba(255,255,255,0.1)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s',
              }}>
                {action.done && <span style={{ fontSize: '9px', color: C.gold, fontWeight: 800 }}>✓</span>}
              </div>
              <span style={{
                fontSize: '11px', fontWeight: action.done ? 700 : 500,
                color: action.done ? C.text50 : 'rgba(255,255,255,0.45)',
                textDecoration: action.done ? 'line-through' : 'none',
                lineHeight: 1.4,
              }}>{action.text}</span>
            </div>
          ))}
        </div>

        {/* WhatsApp bericht */}
        <div style={{ padding: '8px 14px' }}>
          <div style={{ fontSize: '9px', fontWeight: 700, color: C.text25, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
            WhatsApp bericht
          </div>
          <div style={{ background: 'rgba(37,211,102,0.04)', border: '1px solid rgba(37,211,102,0.15)', borderRadius: '6px', overflow: 'hidden' }}>
            <textarea
              value={waText}
              onChange={e => setWaText(e.target.value)}
              rows={14}
              style={{
                width: '100%', padding: '10px', background: 'transparent',
                border: 'none', color: 'rgba(255,255,255,0.6)',
                fontSize: '10px', lineHeight: 1.7, fontFamily: 'inherit',
                outline: 'none', resize: 'none', boxSizing: 'border-box',
              }}
            />
            <button onClick={handleCopy} style={{
              width: '100%', padding: '8px', background: copied ? 'rgba(37,211,102,0.15)' : 'rgba(37,211,102,0.08)',
              border: 'none', borderTop: '1px solid rgba(37,211,102,0.15)',
              color: '#25d366', fontSize: '10px', fontWeight: 800,
              cursor: 'pointer', letterSpacing: '0.06em', textTransform: 'uppercase',
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              transition: 'all 0.15s',
            }}>
              {copied ? '✓ Gekopieerd!' : 'Kopieer WhatsApp bericht'}
            </button>
          </div>
        </div>

        <div style={{ height: '8px' }} />
      </div>

      {/* Nav */}
      <div style={{ display: 'flex', gap: '6px', padding: '10px 14px', borderTop: `1px solid ${C.borderSub}`, flexShrink: 0 }}>
        <button onClick={onBack} style={{ width: '34px', height: '34px', background: 'transparent', border: `1px solid ${C.border}`, borderRadius: '6px', color: C.text25, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>←</button>
        <button onClick={handleSave} style={{
          flex: 1, height: '34px',
          background: saved ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.08)',
          border: `1px solid rgba(16,185,129,${saved ? '0.4' : '0.2'})`,
          borderRadius: '6px', color: C.green,
          fontSize: '11px', fontWeight: 800,
          cursor: 'pointer', letterSpacing: '0.05em', textTransform: 'uppercase',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          transition: 'all 0.2s',
        }}>
          {saved ? '✓ Opgeslagen' : 'Call opslaan'}
        </button>
      </div>
    </div>
  )
}
