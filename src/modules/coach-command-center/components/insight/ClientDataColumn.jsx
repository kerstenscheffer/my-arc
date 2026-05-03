// ============================================
// 📁 FILE: src/modules/coach-command-center/components/insight/ClientDataColumn.jsx
// v2.0 — Alle client gegevens BEWERKBAAR + macro editor
// Klik op een waarde → edit → opslaan per veld
// Props: { client, db, isMobile, onClientUpdate }
// ============================================
import React, { useState, useRef } from 'react'
import { User, Save, Edit3, Check, X, Plus, Minus, Flame } from 'lucide-react'

const C = {
  gold: '#FFD700', green: '#10b981', red: '#ef4444', amber: '#f59e0b',
  orange: '#f97316', purple: '#a855f7',
  text: '#fff', text50: 'rgba(255,255,255,0.5)', text25: 'rgba(255,255,255,0.25)',
  text20: 'rgba(255,255,255,0.2)', text15: 'rgba(255,255,255,0.15)',
  border: 'rgba(255,255,255,0.06)', borderSub: 'rgba(255,255,255,0.04)', borderItem: 'rgba(255,255,255,0.03)',
  goldBg10: 'rgba(255,215,0,0.08)',
}

const SECTIONS = ['profiel', 'doelen', 'macros', 'levensstijl', 'gezondheid', 'voeding']
const SECTION_META = {
  profiel:     { label: 'Profiel',       color: C.gold },
  doelen:      { label: 'Doelen',        color: C.orange },
  macros:      { label: 'Macro Targets', color: C.green },
  levensstijl: { label: 'Levensstijl',  color: '#3b82f6' },
  gezondheid:  { label: 'Gezondheid',    color: C.red },
  voeding:     { label: 'Voeding',       color: C.purple },
}

// ── Editable Row ──
function EditableRow({ label, value, field, type = 'text', options, suffix, isMobile, onSave }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const display = value === null || value === undefined || value === '' ? null : String(value)

  const startEdit = () => {
    setDraft(display || '')
    setEditing(true)
  }

  const cancel = () => { setEditing(false); setDraft('') }

  const save = async () => {
    setSaving(true)
    let parsed = draft.trim()
    if (type === 'number') parsed = parsed === '' ? null : parseFloat(parsed) || null
    else if (type === 'integer') parsed = parsed === '' ? null : parseInt(parsed, 10) || null
    else if (parsed === '') parsed = null
    await onSave(field, parsed)
    setSaving(false)
    setEditing(false)
  }

  if (editing) {
    return (
      <div style={{ padding: isMobile ? '0.35rem 0.75rem' : '0.4rem 1rem', borderBottom: `1px solid ${C.borderItem}`, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
        <span style={{ fontSize: '0.5rem', color: C.text20, textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: '700', flexShrink: 0, minWidth: isMobile ? '55px' : '65px' }}>{label}</span>
        {options ? (
          <select value={draft} onChange={e => setDraft(e.target.value)} autoFocus style={{
            flex: 1, padding: '0.25rem 0.3rem', background: 'rgba(255,255,255,0.06)',
            border: `1px solid ${C.gold}40`, borderRadius: '4px', color: '#fff',
            fontSize: isMobile ? '0.65rem' : '0.7rem', outline: 'none', fontFamily: 'inherit'
          }}>
            <option value="" style={{ background: '#111' }}>—</option>
            {options.map(o => <option key={o} value={o} style={{ background: '#111' }}>{o}</option>)}
          </select>
        ) : (
          <input
            autoFocus type={type === 'number' || type === 'integer' ? 'number' : 'text'}
            value={draft} onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel() }}
            style={{
              flex: 1, padding: '0.25rem 0.3rem', background: 'rgba(255,255,255,0.06)',
              border: `1px solid ${C.gold}40`, borderRadius: '4px', color: '#fff',
              fontSize: isMobile ? '0.65rem' : '0.7rem', fontWeight: '600', outline: 'none', fontFamily: 'inherit',
              minWidth: 0
            }}
          />
        )}
        <button onClick={save} disabled={saving} style={{ width: '24px', height: '24px', borderRadius: '4px', background: 'rgba(16,185,129,0.15)', border: `1px solid rgba(16,185,129,0.3)`, color: C.green, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
          <Check size={10} />
        </button>
        <button onClick={cancel} style={{ width: '24px', height: '24px', borderRadius: '4px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, color: C.text50, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
          <X size={10} />
        </button>
      </div>
    )
  }

  return (
    <div onClick={startEdit} style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      padding: isMobile ? '0.35rem 0.75rem' : '0.4rem 1rem',
      borderBottom: `1px solid ${C.borderItem}`,
      cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
      transition: 'background 0.1s ease'
    }}
    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,215,0,0.02)'}
    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
      <span style={{ fontSize: '0.5rem', color: C.text20, textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: '700', flexShrink: 0, marginRight: '0.5rem', paddingTop: '0.05rem' }}>{label}</span>
      <span style={{ fontSize: isMobile ? '0.65rem' : '0.7rem', fontWeight: '600', color: display ? C.text : C.text15, textAlign: 'right', wordBreak: 'break-word' }}>
        {display ? `${display}${suffix || ''}` : '—'}
      </span>
    </div>
  )
}

// ── Read-only Row (for computed/non-editable) ──
const ReadRow = ({ label, value, isMobile }) => {
  if (value === null || value === undefined || value === '' || value === '-') return null
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: isMobile ? '0.35rem 0.75rem' : '0.4rem 1rem', borderBottom: `1px solid ${C.borderItem}` }}>
      <span style={{ fontSize: '0.5rem', color: C.text20, textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: '700', flexShrink: 0, marginRight: '0.5rem' }}>{label}</span>
      <span style={{ fontSize: isMobile ? '0.65rem' : '0.7rem', fontWeight: '600', color: C.text, textAlign: 'right', wordBreak: 'break-word' }}>{value}</span>
    </div>
  )
}

// ── Macro Editor (unchanged from v1) ──
function MacroEditor({ initKcal, initProtein, initCarbs, initFat, isMobile, onRef }) {
  const [kcal, setKcal] = useState(initKcal || 2000)
  const [protein, setProtein] = useState(initProtein || 150)
  const [fat, setFat] = useState(initFat || 70)
  const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4))
  const totalKcal = protein * 4 + carbs * 4 + fat * 9
  const kcalDiff = totalKcal - kcal
  if (onRef) onRef({ kcal, protein, carbs, fat })

  const SwipeInput = ({ label, value, setValue, min, max, step, kcalPer, color, unit = 'g', isAuto = false }) => {
    const [typing, setTyping] = useState(false)
    const [draft, setDraft] = useState('')
    const swipeStartX = useRef(null)
    const swipeStartVal = useRef(null)
    const macroKcal = value * kcalPer
    const barMax = unit === 'kcal' ? 5000 : (kcalPer === 9 ? 200 : 400)
    const barPct = Math.min(100, (value / barMax) * 100)
    const clamp = (v) => Math.max(min, Math.min(max, v))

    const onBarTouchStart = (e) => { swipeStartX.current = e.touches[0].clientX; swipeStartVal.current = value }
    const onBarTouchMove = (e) => { e.preventDefault(); if (swipeStartX.current === null) return; const dx = e.touches[0].clientX - swipeStartX.current; setValue(clamp(swipeStartVal.current + Math.round(dx / 8) * step)) }
    const onBarTouchEnd = () => { swipeStartX.current = null }
    const onBarMouseDown = (e) => {
      swipeStartX.current = e.clientX; swipeStartVal.current = value
      const onMove = (ev) => { const dx = ev.clientX - swipeStartX.current; setValue(clamp(swipeStartVal.current + Math.round(dx / 8) * step)) }
      const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); swipeStartX.current = null }
      document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp)
    }
    const commitTyping = () => { const n = parseInt(draft, 10); if (!isNaN(n)) setValue(clamp(n)); setTyping(false); setDraft('') }

    return (
      <div style={{ padding: isMobile ? '0.5rem 0.75rem' : '0.625rem 1rem', borderBottom: `1px solid ${C.borderSub}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
          <span style={{ fontSize: '0.4rem', fontWeight: 700, color: C.text20, textTransform: 'uppercase', letterSpacing: '0.06em', width: unit === 'kcal' ? '4rem' : '3.5rem', flexShrink: 0 }}>{label}</span>
          <div style={{ flex: 1 }} />
          {isAuto ? (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.2rem' }}>
              <span style={{ fontSize: isMobile ? '1rem' : '1.15rem', fontWeight: 800, color, lineHeight: 1 }}>{value}</span>
              <span style={{ fontSize: '0.4rem', color: C.text25 }}>{unit}</span>
              <span style={{ fontSize: '0.35rem', color: C.text15, marginLeft: '0.15rem' }}>AUTO</span>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <button onClick={() => setValue(clamp(value - step))} style={{ width: isMobile ? '28px' : '30px', height: isMobile ? '28px' : '30px', borderRadius: '6px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, color: C.text50, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', flexShrink: 0 }}><Minus size={10} /></button>
              {typing ? (
                <input autoFocus type="number" value={draft} onChange={e => setDraft(e.target.value)} onBlur={commitTyping} onKeyDown={e => { if (e.key === 'Enter') commitTyping(); if (e.key === 'Escape') { setTyping(false); setDraft('') } }} style={{ width: unit === 'kcal' ? '56px' : '44px', padding: '0.1rem 0.25rem', background: 'rgba(255,255,255,0.07)', border: `1px solid ${color}60`, borderRadius: '4px', color: '#fff', fontSize: isMobile ? '0.9rem' : '1rem', fontWeight: 800, textAlign: 'center', outline: 'none' }} />
              ) : (
                <div onClick={() => { setTyping(true); setDraft(String(value)) }} style={{ minWidth: unit === 'kcal' ? '52px' : '40px', textAlign: 'center', cursor: 'text', padding: '0.1rem 0.2rem', borderRadius: '4px', border: '1px solid transparent', transition: 'border 0.15s' }} onMouseEnter={e => e.currentTarget.style.border = `1px solid ${color}30`} onMouseLeave={e => e.currentTarget.style.border = '1px solid transparent'}>
                  <span style={{ fontSize: isMobile ? '1rem' : '1.15rem', fontWeight: 800, color, lineHeight: 1 }}>{value}</span>
                  <span style={{ fontSize: '0.4rem', color: C.text25, marginLeft: '0.1rem' }}>{unit}</span>
                </div>
              )}
              <button onClick={() => setValue(clamp(value + step))} style={{ width: isMobile ? '28px' : '30px', height: isMobile ? '28px' : '30px', borderRadius: '6px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, color: C.text50, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', flexShrink: 0 }}><Plus size={10} /></button>
            </div>
          )}
          {!isAuto && kcalPer > 0 && <span style={{ fontSize: '0.4rem', color: C.text15, width: '2.5rem', textAlign: 'right', flexShrink: 0 }}>{Math.round(macroKcal)} kcal</span>}
        </div>
        <div onTouchStart={!isAuto ? onBarTouchStart : undefined} onTouchMove={!isAuto ? onBarTouchMove : undefined} onTouchEnd={!isAuto ? onBarTouchEnd : undefined} onMouseDown={!isAuto ? onBarMouseDown : undefined} style={{ height: '6px', background: 'rgba(0,0,0,0.5)', borderRadius: '3px', overflow: 'hidden', cursor: isAuto ? 'default' : 'ew-resize', touchAction: isAuto ? 'auto' : 'none', userSelect: 'none' }}>
          <div style={{ height: '100%', width: `${barPct}%`, background: color, borderRadius: '3px', opacity: isAuto ? 0.5 : 1, transition: swipeStartX.current !== null ? 'none' : 'width 0.15s ease' }} />
        </div>
      </div>
    )
  }

  return (
    <div>
      <SwipeInput label="Kcal Target" value={kcal} setValue={setKcal} min={1000} max={5000} step={50} kcalPer={1} color={C.gold} unit="kcal" />
      <SwipeInput label="Eiwit" value={protein} setValue={setProtein} min={50} max={400} step={5} kcalPer={4} color={C.orange} />
      <SwipeInput label="Vet" value={fat} setValue={setFat} min={20} max={200} step={2} kcalPer={9} color={C.amber} />
      <SwipeInput label="Koolhydr." value={carbs} setValue={() => {}} min={0} max={600} step={5} kcalPer={4} color={C.green} isAuto />
      <div style={{ padding: isMobile ? '0.35rem 0.75rem' : '0.4rem 1rem', borderBottom: `1px solid ${C.borderSub}`, display: 'flex', alignItems: 'center', gap: '0.5rem', background: Math.abs(kcalDiff) > 50 ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.06)' }}>
        <span style={{ fontSize: '0.4rem', color: C.text20, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Totaal</span>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: '0.6rem', fontWeight: 800, color: Math.abs(kcalDiff) > 50 ? C.red : C.green }}>{totalKcal} kcal</span>
        {Math.abs(kcalDiff) > 0 && <span style={{ fontSize: '0.4rem', color: Math.abs(kcalDiff) > 50 ? C.red : C.text25, fontWeight: 700 }}>{kcalDiff > 0 ? '+' : ''}{kcalDiff} vs target</span>}
      </div>
    </div>
  )
}

// ════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════
export default function ClientDataColumn({ client, db, isMobile, onClientUpdate }) {
  const [activeSection, setActiveSection] = useState('profiel')
  const [editingMacros, setEditingMacros] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const macroRef = useRef(null)

  const curKcal    = client.target_calories ?? 2000
  const curProtein = client.target_protein  ?? 150
  const curCarbs   = client.target_carbs    ?? 200
  const curFat     = client.target_fat      ?? 70

  // ── Save single field to Supabase ──
  const handleFieldSave = async (field, value) => {
    if (!db?.supabase || !client.id) return
    try {
      const { error } = await db.supabase
        .from('clients')
        .update({ [field]: value })
        .eq('id', client.id)
      if (error) { console.error('❌ Field save error:', error); return }
      onClientUpdate?.({ [field]: value })
    } catch (e) { console.error('❌ Save error:', e) }
  }

  // ── Save macros ──
  const handleSaveMacros = async () => {
    const macros = macroRef.current
    if (!db?.supabase || !client.id || !macros || saving) return
    setSaving(true)
    try {
      const { error } = await db.supabase
        .from('clients')
        .update({ target_calories: macros.kcal, target_protein: macros.protein, target_carbs: macros.carbs, target_fat: macros.fat, manual_macro_targets: true })
        .eq('id', client.id)
      if (error) { console.error('❌ Macro save error:', error); return }
      onClientUpdate?.({ target_calories: macros.kcal, target_protein: macros.protein, target_carbs: macros.carbs, target_fat: macros.fat })
      setSaved(true)
      setTimeout(() => { setSaved(false); setEditingMacros(false); macroRef.current = null }, 1200)
    } catch (e) { console.error('❌ Macro save:', e) }
    setSaving(false)
  }

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' }) : null
  const fmtArr = (v) => { if (!v) return null; if (Array.isArray(v)) return v.join(', ') || null; if (typeof v === 'string') { try { const p = JSON.parse(v); return Array.isArray(p) ? p.join(', ') || null : v } catch { return v } } return String(v) }

  const wp = client.workout_preferences || client.workoutPreferences || {}
  const np = client.nutrition_preferences || client.nutritionPreferences || {}
  const npGuidance = np.guidance_level?.guidance_level || np.guidance_level || null
  const npAllergens = np.allergens?.selected_allergens || []
  const npDiet = np.allergens?.diet_preference || null
  const npMeals = np.meal_schedule?.num_meals || null
  const npBudget = np.life_context?.weekly_budget || client.budget_per_week || null
  const npCooking = np.life_context?.cooking_preference || client.cooking_time || null
  const npCheat = np.cheat_meals?.frequency || null
  const npSupplements = np.supplement_preferences?.current_supplements || null

  const E = ({ label, value, field, type, options, suffix }) => (
    <EditableRow label={label} value={value} field={field} type={type} options={options} suffix={suffix} isMobile={isMobile} onSave={handleFieldSave} />
  )

  const SectionContent = () => {
    switch (activeSection) {
      case 'profiel': return (<>
        <E label="Voornaam"     value={client.first_name}     field="first_name" />
        <E label="Achternaam"   value={client.last_name}      field="last_name" />
        <E label="Email"        value={client.email}          field="email" />
        <E label="Telefoon"     value={client.phone}          field="phone" />
        <E label="Geslacht"     value={client.gender}         field="gender" options={['male', 'female', 'other']} />
        <E label="Geboortedatum" value={client.date_of_birth ? client.date_of_birth.split('T')[0] : null} field="date_of_birth" />
        <E label="Lengte"       value={client.height}         field="height" type="number" suffix=" cm" />
        <E label="Huidig gew."  value={client.current_weight ? parseFloat(client.current_weight).toFixed(1) : null} field="current_weight" type="number" suffix=" kg" />
        <E label="Startgewicht" value={client.start_weight ? parseFloat(client.start_weight).toFixed(1) : null} field="start_weight" type="number" suffix=" kg" />
        <E label="Lichaamsvet"  value={client.current_body_fat} field="current_body_fat" type="number" suffix="%" />
        <E label="Spiermassa"   value={client.muscle_mass}    field="muscle_mass" type="number" suffix=" kg" />
        <E label="Status"       value={client.status}         field="status" options={['active', 'inactive', 'paused']} />
      </>)

      case 'doelen': return (<>
        <E label="Primair doel" value={client.primary_goal}   field="primary_goal" options={['cut', 'bulk', 'maintain', 'recomp', 'health', 'performance']} />
        <E label="Doelgewicht"  value={client.target_weight ? parseFloat(client.target_weight).toFixed(1) : null} field="target_weight" type="number" suffix=" kg" />
        <E label="Doel vet %"   value={client.target_body_fat} field="target_body_fat" type="number" suffix="%" />
        <E label="Tijdlijn"     value={client.goal_timeline}  field="goal_timeline" />
        <E label="Deadline"     value={client.goal_deadline ? client.goal_deadline.split('T')[0] : null} field="goal_deadline" />
        <E label="Urgentie"     value={client.goal_urgency}   field="goal_urgency" options={['low', 'moderate', 'high', 'extreme']} />
        <E label="Wk afval"     value={client.weekly_weight_goal} field="weekly_weight_goal" type="number" suffix=" kg/wk" />
        <E label="Motivatie"    value={client.motivation}     field="motivation" />
        <E label="Obstakels"    value={client.biggest_obstacle} field="biggest_obstacle" />
        <ReadRow isMobile={isMobile} label="TDEE" value={client.tdee ? `${client.tdee} kcal` : null} />
        <E label="Surplus"      value={client.surplus}        field="surplus" type="integer" suffix=" kcal" />
      </>)

      case 'macros': return (
        <div>
          <div style={{ padding: isMobile ? '0.5rem 0.75rem' : '0.625rem 1rem', borderBottom: `1px solid ${C.borderSub}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Flame size={12} color={C.green} />
              <span style={{ fontSize: '0.5rem', fontWeight: 700, color: saved ? C.green : C.text20, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {saved ? '✓ Opgeslagen' : 'Dagelijkse targets'}
              </span>
            </div>
            {!editingMacros ? (
              <button onClick={() => setEditingMacros(true)} style={{ padding: '0.25rem 0.5rem', background: C.goldBg10, border: `1px solid rgba(255,215,0,0.2)`, borderRadius: '6px', color: C.gold, fontSize: '0.5rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: '28px' }}>
                <Edit3 size={10} /> Aanpassen
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                <button onClick={() => { setEditingMacros(false); macroRef.current = null }} style={{ padding: '0.25rem 0.4rem', background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, borderRadius: '6px', color: C.text50, fontSize: '0.5rem', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: '28px' }}><X size={10} /></button>
                <button onClick={handleSaveMacros} disabled={!editingMacros || saving} style={{ padding: '0.25rem 0.5rem', background: saved ? C.green : editingMacros ? 'linear-gradient(135deg, #FFD700 0%, #D4AF37 100%)' : 'rgba(255,255,255,0.03)', border: 'none', borderRadius: '6px', color: saved || editingMacros ? '#000' : C.text25, fontSize: '0.5rem', fontWeight: 800, cursor: editingMacros ? 'pointer' : 'default', display: 'flex', alignItems: 'center', gap: '0.2rem', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: '28px', transition: 'all 0.2s ease' }}>
                  {saved ? <><Check size={10} /> OK</> : saving ? '...' : <><Save size={10} /> Opslaan</>}
                </button>
              </div>
            )}
          </div>
          {!editingMacros ? (
            <>
              {[{ label: 'KCAL', val: curKcal, unit: 'kcal', color: C.gold }, { label: 'EIWIT', val: curProtein, unit: 'g', color: C.orange }, { label: 'KOOLH', val: curCarbs, unit: 'g', color: C.green }, { label: 'VET', val: curFat, unit: 'g', color: C.amber }].map(({ label, val, unit, color }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', padding: isMobile ? '0.5rem 0.75rem' : '0.625rem 1rem', borderBottom: `1px solid ${C.borderSub}` }}>
                  <span style={{ fontSize: '0.4rem', fontWeight: 700, color: C.text20, textTransform: 'uppercase', letterSpacing: '0.06em', width: '3rem' }}>{label}</span>
                  <div style={{ flex: 1 }} />
                  {val ? (
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.15rem' }}>
                      <span style={{ fontSize: isMobile ? '1.1rem' : '1.3rem', fontWeight: 800, color, lineHeight: 1 }}>{val}</span>
                      <span style={{ fontSize: '0.4rem', color: C.text25 }}>{unit}</span>
                    </div>
                  ) : <span style={{ fontSize: '0.65rem', color: C.text15 }}>—</span>}
                </div>
              ))}
              {client.tdee && <div style={{ padding: isMobile ? '0.4rem 0.75rem' : '0.5rem 1rem' }}><span style={{ fontSize: '0.45rem', color: C.text15 }}>TDEE referentie: {client.tdee} kcal/dag</span></div>}
            </>
          ) : (
            <MacroEditor initKcal={curKcal} initProtein={curProtein} initCarbs={curCarbs} initFat={curFat} isMobile={isMobile} onRef={(vals) => { macroRef.current = vals }} />
          )}
        </div>
      )

      case 'levensstijl': return (<>
        <E label="Activiteit"   value={client.activity_level} field="activity_level" options={['sedentary', 'light', 'moderate', 'active', 'very_active']} />
        <E label="Slaap"        value={client.sleep_hours}    field="sleep_hours" type="number" suffix="u/nacht" />
        <E label="Stress"       value={client.stress_level}   field="stress_level" options={['low', 'moderate', 'high', 'very_high']} />
        <E label="Beroep"       value={client.job_type}       field="job_type" />
        <ReadRow isMobile={isMobile} label="Kooktijd" value={npCooking} />
        <ReadRow isMobile={isMobile} label="Coach stijl" value={client.coaching_style_pref} />
        <ReadRow isMobile={isMobile} label="Verwachting" value={client.coaching_expectations} />
        {Object.keys(wp).length > 0 && <>
          <div style={{ padding: isMobile ? '0.35rem 0.75rem' : '0.4rem 1rem', borderBottom: `1px solid ${C.borderSub}`, borderTop: `1px solid ${C.borderSub}`, marginTop: '0.25rem' }}>
            <span style={{ fontSize: '0.42rem', fontWeight: 700, color: 'rgba(249,115,22,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Training Voorkeuren</span>
          </div>
          <ReadRow isMobile={isMobile} label="Niveau"      value={wp.default_experience_level} />
          <ReadRow isMobile={isMobile} label="Dagen/wk"    value={wp.default_days_per_week} />
          <ReadRow isMobile={isMobile} label="Tijd/sessie"  value={wp.default_time_per_session ? `${wp.default_time_per_session} min` : null} />
          <ReadRow isMobile={isMobile} label="Locatie"      value={wp.training_location} />
          <ReadRow isMobile={isMobile} label="Gym"          value={wp.gym_name} />
          <ReadRow isMobile={isMobile} label="Equipment"    value={fmtArr(wp.default_equipment)} />
          <ReadRow isMobile={isMobile} label="Split"        value={wp.split_preferences?.preferred} />
          <ReadRow isMobile={isMobile} label="Focus"        value={wp.split_preferences?.focus} />
          <ReadRow isMobile={isMobile} label="Cardio"       value={wp.cardio_interest} />
          <ReadRow isMobile={isMobile} label="Cardio freq"  value={wp.cardio_frequency ? `${wp.cardio_frequency}x/wk` : null} />
        </>}
      </>)

      case 'gezondheid': return (<>
        <E label="Aandoeningen" value={client.medical_conditions} field="medical_conditions" />
        <E label="Medicatie"    value={client.medications}        field="medications" />
        <E label="Blessures"    value={client.injuries || wp.injuries} field="injuries" />
        <ReadRow isMobile={isMobile} label="Vermijden" value={wp.avoided_exercises} />
        <ReadRow isMobile={isMobile} label="Beperkingen" value={wp.other_limitations} />
        <E label="Supplementen" value={client.supplements || npSupplements} field="supplements" />
      </>)

      case 'voeding': return (<>
        <E label="Dieetvorm"    value={client.dietary_type || npDiet} field="dietary_type" options={['omnivore', 'vegetarian', 'vegan', 'pescatarian', 'keto', 'paleo', 'halal']} />
        <ReadRow isMobile={isMobile} label="Begeleiding" value={npGuidance} />
        <ReadRow isMobile={isMobile} label="Maaltijden" value={npMeals} />
        <ReadRow isMobile={isMobile} label="Budget/wk" value={npBudget ? `€${npBudget}` : null} />
        <E label="Allergieën"   value={fmtArr(client.allergies || npAllergens)} field="allergies" />
        <E label="Intol."       value={fmtArr(client.intolerances)} field="intolerances" />
        <E label="Lekker"       value={client.loved_foods}    field="loved_foods" />
        <E label="Niet lekker"  value={client.hated_foods}    field="hated_foods" />
        <E label="Keukens"      value={fmtArr(client.favorite_cuisines)} field="favorite_cuisines" />
        <ReadRow isMobile={isMobile} label="Cheat meals" value={npCheat} />
        <E label="Kookskill"    value={client.cooking_skill}  field="cooking_skill" options={['beginner', 'intermediate', 'advanced']} />
        <E label="Water doel"   value={client.water_intake_target} field="water_intake_target" type="number" suffix="L" />
      </>)

      default: return null
    }
  }

  const activeMeta = SECTION_META[activeSection]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ padding: isMobile ? '0.625rem 0.75rem' : '0.75rem 1rem', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
        <User size={14} color={activeMeta.color} />
        <span style={{ fontSize: '0.7rem', fontWeight: '700', color: activeMeta.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{activeMeta.label}</span>
      </div>

      <div style={{ display: 'flex', overflowX: 'auto', flexShrink: 0, borderBottom: `1px solid ${C.border}`, scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {SECTIONS.map(sec => {
          const isActive = sec === activeSection
          const meta = SECTION_META[sec]
          return (
            <button key={sec} onClick={() => setActiveSection(sec)} style={{ flexShrink: 0, padding: isMobile ? '0.4rem 0.5rem' : '0.45rem 0.65rem', background: 'transparent', border: 'none', borderBottom: isActive ? `2px solid ${meta.color}` : '2px solid transparent', color: isActive ? meta.color : C.text25, fontSize: isMobile ? '0.48rem' : '0.52rem', fontWeight: isActive ? '700' : '500', cursor: 'pointer', whiteSpace: 'nowrap', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', transition: 'all 0.15s ease' }}>{meta.label}</button>
          )
        })}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <SectionContent />
        <div style={{ height: '1rem' }} />
      </div>
    </div>
  )
}
