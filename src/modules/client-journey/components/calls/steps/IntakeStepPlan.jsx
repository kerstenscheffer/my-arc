// src/modules/client-journey/components/calls/steps/IntakeStepPlan.jsx
// v2 — Simpel en direct. Doelgewicht aanpasbaar, rest pre-filled, één bevestig knop.
import React, { useState, useEffect } from 'react'
import { ChevronRight, AlertTriangle } from 'lucide-react'

const C = {
  gold: '#FFD700', green: '#10b981', blue: '#3b82f6', amber: '#f59e0b', red: '#ef4444',
  text: '#ffffff',
  text50: 'rgba(255,255,255,0.5)',
  text25: 'rgba(255,255,255,0.25)',
  text15: 'rgba(255,255,255,0.15)',
  border: 'rgba(255,255,255,0.08)',
  borderSub: 'rgba(255,255,255,0.04)',
}

const GOAL_LABELS = {
  fat_loss: 'Vetverlies', muscle_gain: 'Spieropbouw',
  recomp: 'Body Recomp', general_fitness: 'Fitter worden',
}

const PRESET_DATA = {
  mild:       { label: 'Mild',      pct: '10–15%', desc: '~0.3 kg/week', color: C.green },
  moderate:   { label: 'Moderate',  pct: '15–25%', desc: '~0.5 kg/week', color: C.gold },
  aggressive: { label: 'Agressief', pct: '25–35%', desc: '~0.8 kg/week', color: C.red },
}

const CHEAT_FROM_NP = {
  nooit:     0,
  '1x_week': 1,
  '2x_week': 2,
  weekend:   1,
  als_nodig: 0,
}

function Row({ label, children, border = true }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 20px',
      borderBottom: border ? `1px solid ${C.borderSub}` : 'none',
      gap: '16px',
    }}>
      <span style={{ fontSize: '12px', fontWeight: 600, color: C.text50, flexShrink: 0 }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>{children}</div>
    </div>
  )
}

function ToggleGroup({ options, value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: '4px' }}>
      {options.map(opt => {
        const active = value === opt.id
        return (
          <button key={opt.id} onClick={() => onChange(opt.id)} style={{
            padding: '5px 12px', borderRadius: '6px',
            background: active ? `${opt.color || C.gold}12` : 'transparent',
            border: `1px solid ${active ? `${opt.color || C.gold}40` : C.border}`,
            color: active ? (opt.color || C.gold) : C.text25,
            fontSize: '12px', fontWeight: active ? 700 : 500,
            cursor: 'pointer', touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent', transition: 'all 0.12s',
            whiteSpace: 'nowrap',
          }}>
            {opt.label}
            {opt.sub && <span style={{ fontSize: '10px', opacity: 0.6, marginLeft: '4px' }}>{opt.sub}</span>}
          </button>
        )
      })}
    </div>
  )
}

function NumberInput({ value, onChange, unit, min, max }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
      <input
        type="number"
        value={value || ''}
        onChange={e => onChange(parseFloat(e.target.value) || 0)}
        min={min} max={max}
        style={{
          width: '64px', padding: '4px 0', textAlign: 'right',
          background: 'transparent', border: 'none',
          borderBottom: `1px solid ${C.gold}`,
          color: C.gold, fontSize: '18px', fontWeight: 800,
          outline: 'none', fontFamily: 'inherit',
        }}
      />
      <span style={{ fontSize: '11px', color: C.text25 }}>{unit}</span>
    </div>
  )
}

export default function IntakeStepPlan({ cd, np, wp, db, result, planState, updatePlan, notes, updateNotes, onComplete, onBack, isMobile }) {

  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')

  // targetWeight: uit planState (persistent), init vanuit cd als nog leeg
  const targetWeight = planState.targetWeight || parseFloat(cd?.target_weight || cd?.goal_weight) || null

  // Pre-fill cardio vanuit training notities of wp
  const cardioFromTraining = notes?.training?.cardio_sessies
    ? parseInt(notes.training.cardio_sessies)
    : wp?.cardio_interest === 'yes' && wp?.cardio_frequency
      ? parseInt(wp.cardio_frequency)
      : 0

  // Pre-fill cheat vanuit voeding / np
  const cheatFromNp = CHEAT_FROM_NP[np?.cheat_meals?.frequency] ?? 0

  // Init planState met pre-fills als nog leeg
  useEffect(() => {
    const updates = {}
    if (!planState.deficitPreset) updates.deficitPreset = result?.recPreset || 'moderate'
    if (planState.cardioSessions === 0 && cardioFromTraining > 0) updates.cardioSessions = cardioFromTraining
    if (planState.cheatDays === 0 && cheatFromNp > 0) updates.cheatDays = cheatFromNp
    if (!planState.targetWeight && cd?.target_weight) updates.targetWeight = parseFloat(cd.target_weight)
    if (Object.keys(updates).length > 0) updatePlan(updates)
  }, [])

  // Auto-save naar DB bij mode of targetWeight wijziging
  const saveToDb = async (updates = {}) => {
    console.log('💾 IntakeStepPlan saveToDb:', { updates, cdId: cd?.id, hasDb: !!db?.supabase })
    if (!db?.supabase || !cd?.id) {
      console.warn('⚠️ saveToDb: geen db of cd.id', { db: !!db?.supabase, cdId: cd?.id })
      return
    }
    setSaving(true)
    try {
      const goalMap = { cut: 'fat_loss', bulk: 'muscle_gain', recomp: 'recomp' }
      const payload = {}

      if (updates.mode) {
        payload.primary_goal = goalMap[updates.mode] || cd.primary_goal
        console.log('💾 Auto-save modus:', updates.mode, '→', payload.primary_goal)
      }
      if (updates.targetWeight) {
        payload.target_weight = updates.targetWeight
        payload.goal_weight = updates.targetWeight
        console.log('💾 Auto-save doelgewicht:', updates.targetWeight)
      }

      if (Object.keys(payload).length > 0) {
        const { error } = await db.supabase
          .from('clients')
          .update(payload)
          .eq('id', cd.id)
        if (error) console.error('❌ Auto-save plan:', error.message)
        else {
          setSavedMsg('Opgeslagen')
          setTimeout(() => setSavedMsg(''), 2000)
        }
      }
    } catch (e) {
      console.error('❌ Auto-save plan:', e)
    }
    setSaving(false)
  }

  const handleModeChange = (newMode) => {
    updatePlan({ mode: newMode, deficitPreset: null })
    saveToDb({ mode: newMode })
  }

  const handleTargetWeightChange = (val) => {
    updatePlan({ targetWeight: val })
    clearTimeout(window._twTimer)
    window._twTimer = setTimeout(() => saveToDb({ targetWeight: val }), 1000)
  }

  const isBeginner = wp?.default_experience_level === 'beginner'

  const kgDiff = targetWeight && cd?.current_weight
    ? Math.abs(targetWeight - parseFloat(cd.current_weight)).toFixed(1)
    : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Header */}
      <div style={{ padding: '8px 20px', borderBottom: `1px solid ${C.borderSub}`, display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <span style={{ fontSize: '9px', fontWeight: 700, color: C.text25, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Stap 4 · Plan</span>
        <div style={{ flex: 1, height: '2px', background: 'rgba(255,255,255,0.06)', borderRadius: '1px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: '100%', background: C.gold }} />
        </div>
        {saving && <span style={{ fontSize: '9px', color: C.text25 }}>Opslaan...</span>}
        {savedMsg && <span style={{ fontSize: '9px', color: C.green, fontWeight: 700 }}>✓ {savedMsg}</span>}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div style={{ maxWidth: '560px', margin: '0 auto' }}>

          {/* Modus — cut / bulk / recomp */}
          <Row label="Aanpak">
            <ToggleGroup
              value={planState.mode || result?.mode}
              onChange={handleModeChange}
              options={[
                { id: 'cut',    label: 'Cut',    color: C.red },
                { id: 'recomp', label: 'Recomp', color: C.green },
                { id: 'bulk',   label: 'Bulk',   color: C.blue },
              ]}
            />
          </Row>

          {/* Doel type */}
          <Row label="Type">
            <span style={{ fontSize: '13px', fontWeight: 700, color: C.text50 }}>
              {GOAL_LABELS[cd?.primary_goal] || cd?.primary_goal || '—'}
              {result?.mode && result.mode !== ({ fat_loss: 'cut', muscle_gain: 'bulk', recomp: 'recomp', general_fitness: 'cut' }[cd?.primary_goal]) && (
                <span style={{ fontSize: '10px', color: C.amber, marginLeft: '8px' }}>gewijzigd</span>
              )}
            </span>
          </Row>

          {/* Huidig gewicht */}
          <Row label="Huidig gewicht">
            <span style={{ fontSize: '18px', fontWeight: 800, color: C.text }}>
              {cd?.current_weight} <span style={{ fontSize: '11px', color: C.text25, fontWeight: 400 }}>kg</span>
            </span>
          </Row>

          {/* Doel gewicht — aanpasbaar, auto-save */}
          <Row label="Doel gewicht">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <NumberInput
                value={targetWeight}
                onChange={handleTargetWeightChange}
                unit="kg"
                min={30} max={200}
              />
              {kgDiff && (
                <span style={{ fontSize: '11px', color: parseFloat(kgDiff) < 0 ? C.red : C.green, fontWeight: 600 }}>
                  {targetWeight < parseFloat(cd?.current_weight) ? '−' : '+'}{Math.abs(parseFloat(kgDiff))} kg
                </span>
              )}
            </div>
          </Row>

          {/* TDEE */}
          <Row label="TDEE (onderhoud)">
            <span style={{ fontSize: '18px', fontWeight: 800, color: C.text50 }}>
              {result?.tdee || cd?.tdee || '—'} <span style={{ fontSize: '11px', color: C.text25, fontWeight: 400 }}>kcal</span>
            </span>
          </Row>

          {/* Divider */}
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '4px 0' }} />

          {/* Tempo */}
          <Row label="Tempo">
            <ToggleGroup
              value={planState.deficitPreset || result?.recPreset}
              onChange={v => updatePlan({ deficitPreset: v, manualCal: '' })}
              options={Object.entries(PRESET_DATA).map(([id, p]) => ({
                id, label: p.label, sub: p.desc, color: p.color
              }))}
            />
          </Row>

          {/* Beginner warning */}
          {isBeginner && (planState.deficitPreset || result?.recPreset) === 'aggressive' && (
            <div style={{ margin: '0 20px 4px', padding: '6px 10px', background: 'rgba(239,68,68,0.05)', border: `1px solid rgba(239,68,68,0.2)`, borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertTriangle size={12} color={C.red} />
              <span style={{ fontSize: '11px', color: C.red, fontWeight: 600 }}>Beginner + agressief = hoog dropout risico</span>
            </div>
          )}

          {/* Cardio */}
          <Row label="Cardio/week">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ToggleGroup
                value={planState.cardioSessions}
                onChange={v => updatePlan({ cardioSessions: v })}
                options={[0, 1, 2, 3, 4, 5].map(v => ({ id: v, label: v === 0 ? '—' : `${v}x`, color: C.green }))}
              />
              {planState.cardioSessions > 0 && (
                <span style={{ fontSize: '10px', color: C.green, fontWeight: 700 }}>
                  +{result?.cardioDaily || 0} kcal/dag
                </span>
              )}
            </div>
          </Row>

          {/* Cheat days */}
          <Row label="Cheat days/week">
            <ToggleGroup
              value={planState.cheatDays}
              onChange={v => updatePlan({ cheatDays: v })}
              options={[0, 1, 2].map(v => ({ id: v, label: v === 0 ? 'Geen' : `${v}x`, color: C.amber }))}
            />
          </Row>

          {/* Handmatig kcal */}
          <Row label="Handmatig kcal" border={false}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <input
                type="number"
                value={planState.manualCal}
                onChange={e => updatePlan({ manualCal: e.target.value })}
                placeholder={String(result?.targetCal || '—')}
                style={{
                  width: '80px', padding: '4px 0', textAlign: 'right',
                  background: 'transparent', border: 'none',
                  borderBottom: `1px solid ${planState.manualCal ? C.gold : C.border}`,
                  color: planState.manualCal ? C.gold : C.text25,
                  fontSize: '14px', fontWeight: 700, outline: 'none', fontFamily: 'inherit',
                }}
              />
              <span style={{ fontSize: '11px', color: C.text25 }}>kcal</span>
              {planState.manualCal && (
                <button onClick={() => updatePlan({ manualCal: '' })} style={{
                  background: 'transparent', border: 'none', color: C.text25,
                  fontSize: '16px', cursor: 'pointer', padding: '0 2px', lineHeight: 1,
                }}>×</button>
              )}
            </div>
          </Row>

          {/* Divider */}
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '4px 0' }} />

          {/* RESULTAAT — live */}
          <div style={{
            margin: '12px 20px',
            padding: '16px 20px',
            background: 'rgba(255,215,0,0.04)',
            border: `1px solid rgba(255,215,0,0.15)`,
            borderLeft: `3px solid ${C.gold}`,
            borderRadius: '0 8px 8px 0',
          }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '32px', fontWeight: 800, color: C.gold, lineHeight: 1 }}>
                {result?.targetCal || '—'}
              </span>
              <span style={{ fontSize: '12px', color: C.text25 }}>kcal/dag</span>
            </div>
            <div style={{ display: 'flex', gap: '16px', marginBottom: '8px' }}>
              <MacroStat label="Eiwit" value={result?.prot} unit="g" color={C.green} />
              <MacroStat label="Koolh" value={result?.carbs} unit="g" color={C.blue} />
              <MacroStat label="Vet" value={result?.fat} unit="g" color={C.amber} />
            </div>
            <div style={{ fontSize: '11px', color: C.text25, lineHeight: 1.6 }}>
              {result?.weeklyLoss !== undefined && result.weeklyLoss !== 0 && (
                <span style={{ color: result.isCut ? C.red : C.green }}>
                  {result.isCut ? '−' : '+'}{Math.abs(result.weeklyLoss)} kg/week
                </span>
              )}
              {result?.weeklyLoss !== undefined && result.weeklyLoss !== 0 && ' · '}
              {result?.goalWeight && targetWeight && result.weeksNeeded > 0 && (
                <span>{result.goalWeight} kg in <strong style={{ color: C.text50 }}>{result?.weeksNeeded} weken</strong></span>
              )}
              {(!result?.weeksNeeded || result.weeksNeeded === 0) && targetWeight === parseFloat(cd?.current_weight) && (
                <span style={{ color: C.green }}>Onderhoud — recomp</span>
              )}
            </div>
          </div>

          {/* Delivery — wat ga ik maken */}
          <div style={{ padding: '8px 20px 16px' }}>
            <div style={{ fontSize: '9px', fontWeight: 700, color: C.text25, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
              Wat ga ik maken
            </div>
            {[
              result?.isCut ? 'Voedingsschema op maat (cut)' : result?.isRecomp ? 'Voedingsschema op maat (recomp)' : 'Voedingsschema op maat (bulk)',
              `Macro targets instellen: ${result?.targetCal || '—'} kcal`,
              notes?.training?.schema ? `${({ full_body: 'Full Body', upper_lower: 'Upper/Lower', ppl: 'PPL', ppl_4: 'PPL 4-daags', bro_split: 'Bro Split' }[notes.training.schema] || notes.training.schema)} schema aanmaken` : null,
            ].filter(Boolean).map((item, i) => (
              <div key={i} style={{ fontSize: '12px', color: C.text50, padding: '3px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: C.green, fontWeight: 700 }}>✓</span> {item}
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* Nav */}
      <div style={{ borderTop: `1px solid ${C.borderSub}`, padding: '10px 20px', flexShrink: 0 }}>
        <div style={{ maxWidth: '560px', margin: '0 auto', display: 'flex', gap: '8px' }}>
          <button onClick={onBack} style={{
            width: '44px', height: '44px', background: 'transparent',
            border: `1px solid ${C.border}`, borderRadius: '8px',
            color: C.text25, cursor: 'pointer', fontSize: '16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', flexShrink: 0,
          }}>←</button>
          <button onClick={onComplete} style={{
            flex: 1, height: '44px',
            background: 'rgba(255,215,0,0.08)',
            border: `1px solid rgba(255,215,0,0.3)`,
            borderRadius: '8px', color: C.gold,
            fontSize: '12px', fontWeight: 800,
            cursor: 'pointer', letterSpacing: '0.06em', textTransform: 'uppercase',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
          }}>
            Plan bevestigd → Afspraken <ChevronRight size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}

function MacroStat({ label, value, unit, color }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
      <span style={{ fontSize: '8px', fontWeight: 700, color: C.text25, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      <span style={{ fontSize: '16px', fontWeight: 800, color }}>
        {value || '—'}<span style={{ fontSize: '10px', fontWeight: 400, color: C.text25, marginLeft: '2px' }}>{unit}</span>
      </span>
    </div>
  )
}
