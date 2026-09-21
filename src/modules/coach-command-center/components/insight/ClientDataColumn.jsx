// ============================================
// 📁 FILE: src/modules/coach-command-center/components/insight/ClientDataColumn.jsx
// v2.0 — Alle client gegevens BEWERKBAAR + macro editor
// Klik op een waarde → edit → opslaan per veld
// Props: { client, db, isMobile, onClientUpdate }
// ============================================
import React, { useState, useRef } from 'react'
import { User, Save, Edit3, Check, X, Plus, Minus, Flame, RefreshCw } from 'lucide-react'
import { DEFAULT_ACTIVITY } from '../../../macros/macroRules'
import ClientActionsManager from './ClientActionsManager'
import { logClientChanges, pickTrackedFields } from '../../utils/clientChangeLogger'
import EditableRow from './EditableRow'
import {
  C, CARDIO_TYPES, DEFAULT_KCAL_PER_SESSION, DEFAULT_LIFESTYLE, LIFESTYLE_LEVELS,
} from './insightTokens'

// Lifestyle-multipliers: BMR × factor = dagverbruik VOORDAT training/cardio
// erbij komt. Lager dan klassieke Mifflin-factoren omdat die training al
// inbakken. Wij tellen training en cardio expliciet los op.

// 'doelen' stond hier: primair doel, doelgewicht, weektempo en de macro's.
// Dat is verhuisd naar de gewicht-kolom, bij de grafiek waar het besluit valt
// om bij te sturen. Deze tab gaat over wie iemand is, niet over waar hij heen
// moet.
const SECTIONS = ['acties', 'profiel', 'levensstijl', 'gezondheid', 'voeding']
const SECTION_META = {
  acties:      { label: 'Acties',            color: C.gold },
  profiel:     { label: 'Profiel',           color: C.gold },
  levensstijl: { label: 'Levensstijl',       color: C.gold },
  gezondheid:  { label: 'Gezondheid',        color: C.gold },
  voeding:     { label: 'Voeding',           color: C.gold },
}

// ── Editable Row ──
// Primair doel bepaalt welke kant het gewicht op moet, en dus welke kleur een
// verandering krijgt op de client-card, in het gewicht-paneel en bij de klant
// zelf. Dat stond eerder als kale dropdown met de ruwe databasewaarden
// ('cut', 'health', 'performance') zonder dat ergens bleek wat het deed —
// terwijl een bulker met +0,1 kg daardoor rood bleef staan. Nu een vaste
// dropdown met de gevolgen eronder.




// Compacte rij met label + percentage-input voor de BF-calculator.
function BfRow({ label, value, onChange, onBlur, color, isMobile }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '0.35rem 0',
      borderBottom: `1px solid ${C.borderItem}`,
    }}>
      <span style={{
        fontSize: '0.72rem', color: C.text25, fontWeight: 700,
        letterSpacing: '-0.01em',
      }}>
        {label}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <input
          type="number" step="0.5" value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          onClick={(e) => e.target.select()}
          onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur() }}
          style={{
            width: 64, textAlign: 'right',
            background: 'rgba(255,255,255,0.06)',
            border: `1px solid ${color}40`,
            borderRadius: 5, color: '#fff',
            fontSize: '0.75rem', fontWeight: 800,
            padding: '0.22rem 0.4rem',
          }}
        />
        <span style={{ fontSize: '0.72rem', color: C.text50, fontWeight: 700 }}>%</span>
      </div>
    </div>
  )
}


// ── Read-only Row (for computed/non-editable) ──
const ReadRow = ({ label, value, isMobile }) => {
  if (value === null || value === undefined || value === '' || value === '-') return null
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: isMobile ? '0.35rem 0.75rem' : '0.4rem 1rem', borderBottom: `1px solid ${C.borderItem}` }}>
      <span style={{ fontSize: '0.72rem', color: C.text20, letterSpacing: '-0.01em', fontWeight: '700', flexShrink: 0, marginRight: '0.5rem' }}>{label}</span>
      <span style={{ fontSize: isMobile ? '0.65rem' : '0.7rem', fontWeight: '600', color: C.text, textAlign: 'right', wordBreak: 'break-word' }}>{value}</span>
    </div>
  )
}

// Pill-style aan/uit-toggle voor boolean velden in de insight-kolom.
// Slaat direct op via onChange — value is `true | false | null | undefined`,
// undefined wordt behandeld als defaultValue.
const ToggleRow = ({ label, value, defaultValue = true, onChange, isMobile, hint }) => {
  const current = value === null || value === undefined ? defaultValue : !!value
  return (
    <div style={{ padding: isMobile ? '0.45rem 0.75rem' : '0.5rem 1rem', borderBottom: `1px solid ${C.borderItem}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ fontSize: '0.72rem', color: C.text20, letterSpacing: '-0.01em', fontWeight: '700' }}>{label}</span>
        <button
          onClick={() => onChange?.(!current)}
          style={{
            position: 'relative', width: 36, height: 20, borderRadius: 999,
            background: current ? '#10b981' : 'rgba(255,255,255,0.12)',
            border: `1px solid ${current ? '#10b981' : 'rgba(255,255,255,0.2)'}`,
            cursor: 'pointer', padding: 0, flexShrink: 0,
            transition: 'background 0.15s ease, border-color 0.15s ease',
          }}
          aria-pressed={current}
        >
          <span style={{
            position: 'absolute', top: 1, left: current ? 17 : 1,
            width: 16, height: 16, borderRadius: '50%', background: '#fff',
            boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
            transition: 'left 0.15s ease',
          }} />
        </button>
      </div>
      {hint && (
        <div style={{ marginTop: 3, fontSize: '0.72rem', color: C.text25, fontStyle: 'italic', lineHeight: 1.4 }}>{hint}</div>
      )}
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
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: C.text20, letterSpacing: '-0.01em', width: unit === 'kcal' ? '4rem' : '3.5rem', flexShrink: 0 }}>{label}</span>
          <div style={{ flex: 1 }} />
          {isAuto ? (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.2rem' }}>
              <span style={{ fontSize: isMobile ? '1rem' : '1.15rem', fontWeight: 800, color, lineHeight: 1 }}>{value}</span>
              <span style={{ fontSize: '0.72rem', color: C.text25 }}>{unit}</span>
              <span style={{ fontSize: '0.72rem', color: C.text15, marginLeft: '0.15rem' }}>Auto</span>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <button onClick={() => setValue(clamp(value - step))} style={{ width: isMobile ? '28px' : '30px', height: isMobile ? '28px' : '30px', borderRadius: '6px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, color: C.text50, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', flexShrink: 0 }}><Minus size={10} /></button>
              {typing ? (
                <input autoFocus type="number" value={draft} onChange={e => setDraft(e.target.value)} onBlur={commitTyping} onKeyDown={e => { if (e.key === 'Enter') commitTyping(); if (e.key === 'Escape') { setTyping(false); setDraft('') } }} style={{ width: unit === 'kcal' ? '56px' : '44px', padding: '0.1rem 0.25rem', background: 'rgba(255,255,255,0.07)', border: `1px solid ${color}60`, borderRadius: '4px', color: '#fff', fontSize: isMobile ? '0.9rem' : '1rem', fontWeight: 800, textAlign: 'center', outline: 'none' }} />
              ) : (
                <div onClick={() => { setTyping(true); setDraft(String(value)) }} style={{ minWidth: unit === 'kcal' ? '52px' : '40px', textAlign: 'center', cursor: 'text', padding: '0.1rem 0.2rem', borderRadius: '4px', border: '1px solid transparent', transition: 'border 0.15s' }} onMouseEnter={e => e.currentTarget.style.border = `1px solid ${color}30`} onMouseLeave={e => e.currentTarget.style.border = '1px solid transparent'}>
                  <span style={{ fontSize: isMobile ? '1rem' : '1.15rem', fontWeight: 800, color, lineHeight: 1 }}>{value}</span>
                  <span style={{ fontSize: '0.72rem', color: C.text25, marginLeft: '0.1rem' }}>{unit}</span>
                </div>
              )}
              <button onClick={() => setValue(clamp(value + step))} style={{ width: isMobile ? '28px' : '30px', height: isMobile ? '28px' : '30px', borderRadius: '6px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, color: C.text50, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', flexShrink: 0 }}><Plus size={10} /></button>
            </div>
          )}
          {!isAuto && kcalPer > 0 && <span style={{ fontSize: '0.72rem', color: C.text15, width: '2.5rem', textAlign: 'right', flexShrink: 0 }}>{Math.round(macroKcal)} kcal</span>}
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
      <SwipeInput label="Eiwit" value={protein} setValue={setProtein} min={50} max={400} step={5} kcalPer={4} color={C.gold} />
      <SwipeInput label="Vet" value={fat} setValue={setFat} min={20} max={200} step={2} kcalPer={9} color={C.gold} />
      <SwipeInput label="Koolhydr." value={carbs} setValue={() => {}} min={0} max={600} step={5} kcalPer={4} color={C.gold} isAuto />
      <div style={{ padding: isMobile ? '0.35rem 0.75rem' : '0.4rem 1rem', borderBottom: `1px solid ${C.borderSub}`, display: 'flex', alignItems: 'center', gap: '0.5rem', background: Math.abs(kcalDiff) > 50 ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.06)' }}>
        <span style={{ fontSize: '0.72rem', color: C.text20, letterSpacing: '-0.01em' }}>Totaal</span>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: Math.abs(kcalDiff) > 50 ? C.red : C.green }}>{totalKcal} kcal</span>
        {Math.abs(kcalDiff) > 0 && <span style={{ fontSize: '0.72rem', color: Math.abs(kcalDiff) > 50 ? C.red : C.text25, fontWeight: 700 }}>{kcalDiff > 0 ? '+' : ''}{kcalDiff} vs target</span>}
      </div>
    </div>
  )
}

// ════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════
export default function ClientDataColumn({ client, db, isMobile, onClientUpdate }) {
  const [activeSection, setActiveSection] = useState('profiel')
  // Tijdlijn, urgentie, motivatie en obstakels komen uit de intake en worden
  // hier zelden aangepast; ze stonden wel permanent onder de macro's.
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
      const before = pickTrackedFields(client)
      const { error } = await db.supabase
        .from('clients')
        .update({ [field]: value })
        .eq('id', client.id)
      if (error) { console.error('❌ Field save error:', error); return }
      onClientUpdate?.({ [field]: value })
      await logClientChanges({ db, clientId: client.id, before, after: { [field]: value }, source: 'data_column_field' })
    } catch (e) { console.error('❌ Save error:', e) }
  }

  // ── Save macros ──
  const handleSaveMacros = async () => {
    const macros = macroRef.current
    if (!db?.supabase || !client.id || !macros || saving) return
    setSaving(true)
    try {
      const payload = {
        target_calories: macros.kcal,
        target_protein: macros.protein,
        target_carbs: macros.carbs,
        target_fat: macros.fat,
        manual_macro_targets: true,
      }
      const before = pickTrackedFields(client)
      const { error } = await db.supabase
        .from('clients')
        .update(payload)
        .eq('id', client.id)
      if (error) { console.error('❌ Macro save error:', error); return }
      onClientUpdate?.({ target_calories: macros.kcal, target_protein: macros.protein, target_carbs: macros.carbs, target_fat: macros.fat })
      await logClientChanges({ db, clientId: client.id, before, after: payload, source: 'save_macros' })
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
      case 'acties': return (
        <ClientActionsManager client={client} db={db} isMobile={isMobile} />
      )
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
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(249,115,22,0.4)', letterSpacing: '-0.01em' }}>Training Voorkeuren</span>
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
        <ToggleRow
          label="Meal plan zichtbaar"
          value={client.meal_plan_visible}
          defaultValue={true}
          onChange={(v) => handleFieldSave('meal_plan_visible', v)}
          isMobile={isMobile}
          hint={client.meal_plan_visible === false ? 'Geplande maaltijd-slots zijn verborgen. Food-logging blijft werken (free-mode).' : null}
        />
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
        <User size={16} color={activeMeta.color} />
        <span style={{ fontSize: isMobile ? '0.82rem' : '0.9rem', fontWeight: 900, color: activeMeta.color, letterSpacing: '-0.01em' }}>{activeMeta.label}</span>
      </div>

      <div style={{ display: 'flex', overflowX: 'auto', flexShrink: 0, borderBottom: `1px solid ${C.border}`, scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {SECTIONS.map(sec => {
          const isActive = sec === activeSection
          const meta = SECTION_META[sec]
          return (
            <button key={sec} onClick={() => setActiveSection(sec)} style={{ flexShrink: 0, padding: isMobile ? '0.45rem 0.6rem' : '0.5rem 0.75rem', background: 'transparent', border: 'none', borderBottom: isActive ? `2px solid ${meta.color}` : '2px solid transparent', color: isActive ? meta.color : C.text50, fontSize: isMobile ? '0.62rem' : '0.66rem', fontWeight: isActive ? '800' : '600', cursor: 'pointer', whiteSpace: 'nowrap', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', transition: 'all 0.15s ease' }}>{meta.label}</button>
          )
        })}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {/* SectionContent als functie-aanroep, niet als component: zo houden de
            panelen hun interne state (een halve bewerking bijvoorbeeld) tussen
            renders. */}
        {SectionContent()}
        <div style={{ height: '1rem' }} />
      </div>
    </div>
  )
}
