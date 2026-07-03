// ============================================
// 📁 FILE: src/modules/coach-command-center/components/insight/ClientDataColumn.jsx
// v2.0 — Alle client gegevens BEWERKBAAR + macro editor
// Klik op een waarde → edit → opslaan per veld
// Props: { client, db, isMobile, onClientUpdate }
// ============================================
import React, { useState, useRef } from 'react'
import { User, Save, Edit3, Check, X, Plus, Minus, Flame, RefreshCw } from 'lucide-react'
import { applyMacroRules, calcTDEE, calcBMR, surplusRuleFor, normalizeGoal, DEFAULT_ACTIVITY } from '../../../macros/macroRules'
import ClientActionsManager from './ClientActionsManager'
import { logClientChanges, pickTrackedFields } from '../../utils/clientChangeLogger'

// Lifestyle-multipliers: BMR × factor = dagverbruik VOORDAT training/cardio
// erbij komt. Lager dan klassieke Mifflin-factoren omdat die training al
// inbakken. Wij tellen training en cardio expliciet los op.
const LIFESTYLE_LEVELS = {
  sedentary:   { label: 'Zittend (kantoor, auto)',         factor: 1.20 },
  light:       { label: 'Licht (wandelen, soms staan)',    factor: 1.30 },
  moderate:    { label: 'Matig (veel lopen of staand)',    factor: 1.40 },
  active:      { label: 'Actief (fysiek werk)',            factor: 1.50 },
  very_active: { label: 'Zeer actief (zwaar fysiek werk)', factor: 1.60 },
}
const DEFAULT_LIFESTYLE = 'sedentary'

// Standaard kcal-verbruik per krachttraining (45-60 min). Aanpasbaar per
// klant zodat een langere/zwaardere sessie hoger kan staan.
const DEFAULT_KCAL_PER_SESSION = 350

// Cardio-types — kcal/min voor ~85 kg persoon op zone-2 intensiteit
// (steady state, gesprek-tempo). MET-waardes als referentie:
//   wandelen ~4 · crosstrainer ~5 · fietsen ~6,5 · zwemmen/roeien ~6 ·
//   hardlopen easy ~7. Hoge-intensiteit varianten apart erbij.
const CARDIO_TYPES = {
  walking_fast: { label: 'Wandelen (stevig)',         kcalPerMin: 6    },
  elliptical:   { label: 'Crosstrainer',              kcalPerMin: 7.5  },
  cycling_easy: { label: 'Fietsen (rustig-matig)',    kcalPerMin: 10   },
  cycling_hard: { label: 'Fietsen (intensief)',       kcalPerMin: 12.5 },
  swimming:     { label: 'Zwemmen (rustige baantjes)',kcalPerMin: 9    },
  rowing:       { label: 'Roeien (matig)',            kcalPerMin: 9    },
  running:      { label: 'Hardlopen (easy/joggen)',   kcalPerMin: 10.5 },
  running_hard: { label: 'Hardlopen (snel)',          kcalPerMin: 13.5 },
  stairmaster:  { label: 'Stairmaster',               kcalPerMin: 11   },
  hiit:         { label: 'HIIT',                      kcalPerMin: 14   },
  spinning:     { label: 'Spinning (intensief)',      kcalPerMin: 12   },
}

const C = {
  gold: '#FFD700', green: '#10b981', red: '#ef4444', amber: '#f59e0b',
  orange: '#f97316', purple: '#a855f7',
  text: '#fff', text50: 'rgba(255,255,255,0.5)', text25: 'rgba(255,255,255,0.25)',
  text20: 'rgba(255,255,255,0.2)', text15: 'rgba(255,255,255,0.15)',
  border: 'rgba(255,255,255,0.06)', borderSub: 'rgba(255,255,255,0.04)', borderItem: 'rgba(255,255,255,0.03)',
  goldBg10: 'rgba(255,215,0,0.08)',
}

// 'macros' is samengevoegd met 'doelen' — alles wat met richting +
// macros te maken heeft staat nu in één paneel.
const SECTIONS = ['acties', 'profiel', 'doelen', 'levensstijl', 'gezondheid', 'voeding']
const SECTION_META = {
  acties:      { label: 'Acties',            color: C.gold },
  profiel:     { label: 'Profiel',           color: C.gold },
  doelen:      { label: 'Doelen & Macro\'s', color: C.gold },
  levensstijl: { label: 'Levensstijl',       color: C.gold },
  gezondheid:  { label: 'Gezondheid',        color: C.gold },
  voeding:     { label: 'Voeding',           color: C.gold },
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
      <div style={{ padding: isMobile ? '0.5rem 0.85rem' : '0.55rem 1rem', borderBottom: `1px solid ${C.borderItem}`, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <span style={{ fontSize: isMobile ? '0.62rem' : '0.66rem', color: C.text50, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '800', flexShrink: 0, minWidth: isMobile ? '60px' : '70px' }}>{label}</span>
        {options ? (
          <select value={draft} onChange={e => setDraft(e.target.value)} autoFocus style={{
            flex: 1, padding: '0.25rem 0.3rem', background: 'rgba(255,255,255,0.06)',
            border: `1px solid ${C.gold}40`, borderRadius: '4px', color: '#fff',
            fontSize: isMobile ? '0.82rem' : '0.88rem', outline: 'none', fontFamily: 'inherit'
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
              fontSize: isMobile ? '0.82rem' : '0.88rem', fontWeight: '700', outline: 'none', fontFamily: 'inherit',
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
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: isMobile ? '0.55rem 0.85rem' : '0.6rem 1rem',
      borderBottom: `1px solid ${C.borderItem}`,
      cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
      transition: 'background 0.1s ease', gap: '0.75rem',
    }}
    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,215,0,0.03)'}
    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
      <span style={{ fontSize: isMobile ? '0.62rem' : '0.66rem', color: C.text50, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '800', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: isMobile ? '0.92rem' : '1rem', fontWeight: '800', color: display ? C.text : C.text15, textAlign: 'right', wordBreak: 'break-word', letterSpacing: '-0.01em' }}>
        {display ? `${display}${suffix || ''}` : '—'}
      </span>
    </div>
  )
}

// ── Macro Rules Block ──
// Twee blokken in één paneel:
//   1. Onderhoud — Mifflin BMR × activity + optionele training/cardio/log
//      correctie. "Bereken & opslaan onderhoud" → schrijft clients.tdee +
//      maintenance_settings.
//   2. Macro's — gebruikt OPGESLAGEN tdee + tekort om de macro-targets
//      volgens macroRules te berekenen. "Bereken & opslaan macro's" →
//      schrijft target_calories/protein/carbs/fat.
// De projectie onderaan rekent met de ACTIEF opgeslagen surplus (niet de
// rule-default), zodat coach precies ziet waar de huidige instellingen
// op uitkomen.
// ── Body Fat Target Calculator ──
// Berekent streefgewicht uit huidig+gewenst bodyfat%. Aanname: vetvrije
// massa blijft gelijk (klopt grofweg bij eiwit + krachttraining). De
// uitkomst is een richtpunt — huidig BF% is altijd een schatting, dus
// de output stuurt het traject, niet exact eindstation.
function BodyFatTargetCalculator({ client, db, onClientUpdate, isMobile }) {
  const [liveWeight, setLiveWeight] = useState(null)
  const [currentBfDraft, setCurrentBfDraft] = useState(null)
  const [targetBfDraft, setTargetBfDraft] = useState(null)
  const [busy, setBusy] = useState(false)
  const [expanded, setExpanded] = useState(
    !Number.isFinite(parseFloat(client?.target_body_fat))
  )

  React.useEffect(() => {
    if (!db?.supabase || !client?.id) return
    let cancelled = false
    db.supabase
      .from('weight_challenge_logs')
      .select('weight')
      .eq('client_id', client.id)
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled && data?.weight != null) setLiveWeight(parseFloat(data.weight))
      })
    return () => { cancelled = true }
  }, [db, client?.id])

  const effectiveWeight = liveWeight ?? parseFloat(client?.current_weight) ?? parseFloat(client?.start_weight)

  // Intake-flow slaat soms twee aangrenzende BF-kaarten op (tussenin
  // geklikt). De effectieve waarde is dan het gemiddelde — zelfde
  // logica als IntakePhase1.jsx (effectiveBf). Toon dat zo voor de
  // coach, met een hint waar het vandaan komt.
  const intakeBf1 = parseFloat(client?.current_body_fat)
  const intakeBf2 = parseFloat(client?.current_body_fat_2)
  const intakeAvgBf = (Number.isFinite(intakeBf1) && Number.isFinite(intakeBf2))
    ? Math.round((intakeBf1 + intakeBf2) / 2)
    : (Number.isFinite(intakeBf1) ? intakeBf1 : null)
  const hasIntakeRange = Number.isFinite(intakeBf1) && Number.isFinite(intakeBf2)

  const curBf = currentBfDraft != null && currentBfDraft !== ''
    ? parseFloat(currentBfDraft)
    : intakeAvgBf
  const tarBf = targetBfDraft != null && targetBfDraft !== ''
    ? parseFloat(targetBfDraft)
    : parseFloat(client?.target_body_fat)

  const hasAll = Number.isFinite(effectiveWeight)
              && Number.isFinite(curBf) && curBf > 0 && curBf < 100
              && Number.isFinite(tarBf) && tarBf > 0 && tarBf < 100
  const leanMass = hasAll ? effectiveWeight * (1 - curBf / 100) : null
  const targetWeight = hasAll ? leanMass / (1 - tarBf / 100) : null
  const targetWeightRounded = targetWeight != null ? Math.round(targetWeight * 10) / 10 : null

  const saveField = async (field, val) => {
    if (!db?.supabase || !client?.id) return
    try {
      const before = pickTrackedFields(client)
      await db.supabase.from('clients').update({ [field]: val }).eq('id', client.id)
      onClientUpdate?.({ [field]: val })
      await logClientChanges({ db, clientId: client.id, before, after: { [field]: val }, source: 'data_column_bf' })
    } catch (e) { console.error('saveField', e) }
  }

  const applyToTargetWeight = async () => {
    if (busy || targetWeightRounded == null) return
    setBusy(true)
    try {
      const payload = {
        target_weight: targetWeightRounded,
        goal_weight: targetWeightRounded,
        // ook BF-waardes wegschrijven als coach ze net heeft aangepast
        ...(currentBfDraft != null ? { current_body_fat: parseFloat(currentBfDraft) || null } : {}),
        ...(targetBfDraft != null ? { target_body_fat: parseFloat(targetBfDraft) || null } : {}),
      }
      const before = pickTrackedFields(client)
      await db.supabase.from('clients').update(payload).eq('id', client.id)
      onClientUpdate?.(payload)
      await logClientChanges({ db, clientId: client.id, before, after: payload, source: 'apply_target_weight' })
      setCurrentBfDraft(null); setTargetBfDraft(null)
    } catch (e) { console.error('applyToTargetWeight', e) }
    setBusy(false)
  }

  // Inklap-header
  return (
    <div style={{
      background: 'rgba(255,215,0,0.03)',
      borderTop: `1px solid ${C.border}`,
      borderBottom: `1px solid ${C.border}`,
      marginBottom: 2,
    }}>
      <button
        onClick={() => setExpanded(v => !v)}
        style={{
          width: '100%',
          padding: isMobile ? '0.55rem 0.75rem' : '0.65rem 1rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(255,215,0,0.05)',
          border: 'none', cursor: 'pointer', color: 'inherit',
        }}
      >
        <span style={{
          fontSize: isMobile ? '0.64rem' : '0.68rem', color: C.gold, fontWeight: 900,
          textTransform: 'uppercase', letterSpacing: '0.06em',
        }}>
          Streefgewicht uit bodyfat
        </span>
        <span style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          {!expanded && targetWeightRounded != null && (
            <span style={{
              fontSize: '0.85rem', fontWeight: 900, color: C.gold,
              letterSpacing: '-0.02em',
            }}>
              {targetWeightRounded} kg
            </span>
          )}
          <span style={{ fontSize: '0.55rem', color: C.text50, fontWeight: 700, letterSpacing: '0.05em' }}>
            {expanded ? 'Inklappen ▴' : 'Bewerken ▾'}
          </span>
        </span>
      </button>

      {expanded && (
        <div style={{ padding: isMobile ? '0.5rem 0.75rem 0.6rem' : '0.6rem 1rem 0.7rem' }}>
          {/* Huidig gewicht — read-only */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
            padding: '0.35rem 0',
            borderBottom: `1px solid ${C.borderItem}`,
            marginBottom: 6,
          }}>
            <span style={{ fontSize: '0.55rem', color: C.text25, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Huidig gewicht
            </span>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff' }}>
              {Number.isFinite(effectiveWeight) ? `${effectiveWeight.toFixed(1)} kg` : '—'}
            </span>
          </div>

          {/* Huidig BF% — editable, default uit intake */}
          <BfRow
            label="Huidig bodyfat"
            value={currentBfDraft ?? (intakeAvgBf ?? '')}
            onChange={setCurrentBfDraft}
            onBlur={() => {
              if (currentBfDraft != null && currentBfDraft !== '') {
                saveField('current_body_fat', parseFloat(currentBfDraft) || null)
              }
            }}
            color={C.gold}
            isMobile={isMobile}
          />

          {/* Hint als intake een range gaf (tussen 2 kaarten) */}
          {hasIntakeRange && currentBfDraft == null && (
            <div style={{
              fontSize: '0.5rem', color: C.text25, fontStyle: 'italic',
              padding: '0.2rem 0 0.35rem', letterSpacing: '0.02em',
            }}>
              uit intake: tussen {Math.min(intakeBf1, intakeBf2)}% en {Math.max(intakeBf1, intakeBf2)}% → ~{intakeAvgBf}%
            </div>
          )}

          {/* Doel BF% — editable */}
          <BfRow
            label="Doel bodyfat"
            value={targetBfDraft ?? (client?.target_body_fat ?? '')}
            onChange={setTargetBfDraft}
            onBlur={() => {
              if (targetBfDraft != null && targetBfDraft !== '') {
                saveField('target_body_fat', parseFloat(targetBfDraft) || null)
              }
            }}
            color={C.gold}
            isMobile={isMobile}
          />

          {/* Berekend resultaat */}
          <div style={{
            marginTop: 8,
            padding: '0.55rem 0.65rem',
            background: 'rgba(255,215,0,0.06)',
            border: '1px solid rgba(255,215,0,0.2)',
            borderRadius: 8,
          }}>
            <div style={{
              fontSize: '0.5rem', fontWeight: 800, color: C.gold,
              textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5,
            }}>
              Berekend
            </div>

            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
              fontSize: '0.62rem', color: C.text50, fontWeight: 600,
              marginBottom: 4,
            }}>
              <span>Vetvrije massa</span>
              <span style={{ color: C.text, fontWeight: 700 }}>
                {leanMass != null ? `${leanMass.toFixed(1)} kg` : '—'}
              </span>
            </div>

            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
              marginTop: 2, marginBottom: 8,
            }}>
              <span style={{
                fontSize: '0.55rem', color: C.gold, fontWeight: 800,
                textTransform: 'uppercase', letterSpacing: '0.05em',
              }}>
                Streefgewicht
              </span>
              <span style={{
                fontSize: '1.1rem', fontWeight: 900, color: C.gold,
                letterSpacing: '-0.02em',
              }}>
                {targetWeightRounded != null ? `${targetWeightRounded} kg` : '—'}
              </span>
            </div>

            <button
              onClick={applyToTargetWeight}
              disabled={busy || targetWeightRounded == null}
              style={{
                width: '100%',
                padding: '0.5rem',
                background: targetWeightRounded != null
                  ? 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)'
                  : 'rgba(255,255,255,0.04)',
                border: 'none', borderRadius: 6,
                color: targetWeightRounded != null ? '#fff' : C.text25,
                fontSize: '0.62rem', fontWeight: 800,
                cursor: busy || targetWeightRounded == null ? 'default' : 'pointer',
                textTransform: 'uppercase', letterSpacing: '0.04em',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              }}
            >
              {busy
                ? 'Bezig…'
                : (
                  <>
                    <Check size={11} strokeWidth={3} />
                    Toepassen als doelgewicht
                  </>
                )}
            </button>
          </div>

          <div style={{
            marginTop: 7, fontSize: '0.52rem',
            color: C.text25, fontStyle: 'italic', lineHeight: 1.45,
          }}>
            Aanname: vetvrije massa blijft gelijk (geldt bij eiwit 2g/kg + krachttraining).
            Huidig bodyfat is een schatting — behandel uitkomst als richtpunt, niet exact eindstation.
          </div>
        </div>
      )}
    </div>
  )
}

// Compacte rij met label + percentage-input voor de BF-calculator.
function BfRow({ label, value, onChange, onBlur, color, isMobile }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '0.35rem 0',
      borderBottom: `1px solid ${C.borderItem}`,
    }}>
      <span style={{
        fontSize: '0.55rem', color: C.text25, fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.05em',
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
        <span style={{ fontSize: '0.65rem', color: C.text50, fontWeight: 700 }}>%</span>
      </div>
    </div>
  )
}

function MacroRulesBlock({ client, db, onClientUpdate, isMobile }) {
  const [busy, setBusy] = useState(null) // 'tdee' | 'macros' | null
  const [surplusDraft, setSurplusDraft] = useState(null)
  const [editingS, setEditingS] = useState(false)
  // Preview-state: berekende macros worden hier opgeslagen totdat de coach
  // ze expliciet bevestigt.
  const [pendingMacros, setPendingMacros] = useState(null)
  // Inklapbare details — default ingeklapt zodra er iets is opgeslagen,
  // zodat coach één rustige samenvatting ziet ipv alle inputs.
  const [showTdeeDetail, setShowTdeeDetail] = useState(
    !Number.isFinite(parseFloat(client?.tdee))
  )
  const [showMacroDetail, setShowMacroDetail] = useState(
    !Number.isFinite(parseFloat(client?.target_calories))
  )
  const [liveWeight, setLiveWeight] = useState(null)
  // {realTdee, days, avgKcal, deltaKg} | null
  const [logEstimate, setLogEstimate] = useState(null)
  // Trainingsdagen volgens het workout_schema waar de klant aan gekoppeld
  // is — canoniek. Past de coach het plan aan (3 → 5 dagen), dan
  // reflecteert de maintenance-bereken dat automatisch.
  const [planTrainingDays, setPlanTrainingDays] = useState(null)

  // Maintenance settings — geladen uit client.maintenance_settings,
  // bewerkt via lokale state, opgeslagen bij "Bereken & opslaan TDEE".
  const savedSettings = client?.maintenance_settings || {}
  const wp = client?.workout_preferences || client?.workoutPreferences || {}
  // Lifestyle: prefer saved, fallback to client.activity_level uit intake,
  // anders sedentary als veilige default.
  const [lifestyleLevel, setLifestyleLevel] = useState(() => {
    const saved = savedSettings.lifestyle_level
    if (saved && LIFESTYLE_LEVELS[saved]) return saved
    const intake = client?.activity_level
    if (intake && LIFESTYLE_LEVELS[intake]) return intake
    return DEFAULT_LIFESTYLE
  })
  const [trainingDays, setTrainingDays] = useState(
    parseInt(savedSettings.training_days) || parseInt(wp.default_days_per_week) || 3
  )
  const [kcalPerSession, setKcalPerSession] = useState(
    parseInt(savedSettings.kcal_per_session) || DEFAULT_KCAL_PER_SESSION
  )
  const [includeTraining, setIncludeTraining] = useState(
    savedSettings.include_training !== false  // default ON
  )
  // Cardio-activiteiten: lijst van objecten { type, min, sessions }.
  // Backward-compat: oude saves hadden alleen cardio_kcal_per_week
  // — die zetten we om in 1 generiek "running 30min × N sessies" item.
  const [cardioActivities, setCardioActivities] = useState(() => {
    if (Array.isArray(savedSettings.cardio_activities)) {
      return savedSettings.cardio_activities
    }
    const oldKcal = parseInt(savedSettings.cardio_kcal_per_week) || 0
    if (oldKcal > 0) {
      // ~12 kcal/min running → minutes total = oldKcal/12
      const totalMin = Math.round(oldKcal / 12)
      const sessions = 3
      const minPerSession = Math.max(15, Math.round(totalMin / sessions))
      return [{ type: 'running', min: minPerSession, sessions }]
    }
    return []
  })
  const [includeCardio, setIncludeCardio] = useState(savedSettings.include_cardio === true)
  const [includeLog, setIncludeLog] = useState(savedSettings.include_log === true)
  // Handmatige override — wint van alles als aangevinkt + waarde gezet.
  const [includeManual, setIncludeManual] = useState(savedSettings.include_manual === true)
  const [manualTdee, setManualTdee] = useState(parseInt(savedSettings.manual_tdee) || 2500)

  const lifestyleFactor = LIFESTYLE_LEVELS[lifestyleLevel]?.factor || 1.2

  // ── Fetch trainingsdagen uit het workout_schema ───────────────────────
  React.useEffect(() => {
    if (!db?.supabase || !client?.assigned_schema_id) {
      setPlanTrainingDays(null)
      return
    }
    let cancelled = false
    db.supabase
      .from('workout_schemas')
      .select('days_per_week')
      .eq('id', client.assigned_schema_id)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled && data?.days_per_week != null) {
          const n = parseInt(data.days_per_week) || null
          setPlanTrainingDays(n)
          // Sync de input naar de plan-waarde, tenzij de coach al een
          // andere waarde manueel had opgeslagen.
          if (n && !savedSettings.training_days) {
            setTrainingDays(n)
          }
        }
      })
    return () => { cancelled = true }
  }, [db, client?.assigned_schema_id])

  // ── Fetch live weight + log-derived TDEE estimate ─────────────────────
  React.useEffect(() => {
    if (!db?.supabase || !client?.id) return
    let cancelled = false

    db.supabase
      .from('weight_challenge_logs')
      .select('weight')
      .eq('client_id', client.id)
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled && data?.weight != null) setLiveWeight(parseFloat(data.weight))
      })

    ;(async () => {
      const since = new Date(); since.setDate(since.getDate() - 14)
      const sinceIso = since.toISOString().split('T')[0]

      const { data: meals } = await db.supabase
        .from('consumed_meals')
        .select('calories, consumed_at')
        .eq('client_id', client.id)
        .gte('consumed_at', sinceIso + 'T00:00:00')

      const { data: weights } = await db.supabase
        .from('weight_challenge_logs')
        .select('weight, date')
        .eq('client_id', client.id)
        .gte('date', sinceIso)
        .order('date', { ascending: true })

      if (cancelled) return
      if (!meals?.length || !weights || weights.length < 2) return

      const dailyKcal = {}
      for (const m of meals) {
        const day = (m.consumed_at || '').split('T')[0]
        if (!day) continue
        dailyKcal[day] = (dailyKcal[day] || 0) + (m.calories || 0)
      }
      const validDays = Object.keys(dailyKcal).length
      if (validDays < 5) return // te weinig data → geen schatting tonen

      const avgKcal = Object.values(dailyKcal).reduce((s, v) => s + v, 0) / validDays
      const firstW = parseFloat(weights[0].weight)
      const lastW = parseFloat(weights[weights.length - 1].weight)
      const deltaKg = lastW - firstW
      const daysSpan = Math.max(
        1,
        (new Date(weights[weights.length - 1].date) - new Date(weights[0].date)) / 86400000
      )
      // Real TDEE = wat hij at − energie die in lichaam ging zitten.
      // Negatief delta (afval) → real TDEE > consumed.
      const realTdee = Math.round(avgKcal - (deltaKg * 7700) / daysSpan)
      if (!cancelled) {
        setLogEstimate({
          realTdee,
          days: validDays,
          avgKcal: Math.round(avgKcal),
          deltaKg: Math.round(deltaKg * 10) / 10,
        })
      }
    })()

    return () => { cancelled = true }
  }, [db, client?.id])

  const goal = normalizeGoal(client?.primary_goal)
  const rule = surplusRuleFor(goal)
  const effectiveWeight = liveWeight ?? client?.current_weight ?? client?.start_weight

  // Leeftijd: leid af uit date_of_birth als er geen aparte age-kolom is.
  // Voorheen werd BMR null omdat `client.age` ontbreekt op de tabel.
  const effectiveAge = (() => {
    if (Number.isFinite(parseFloat(client?.age))) return parseFloat(client.age)
    if (!client?.date_of_birth) return null
    const dob = new Date(client.date_of_birth)
    if (isNaN(dob)) return null
    const ms = Date.now() - dob.getTime()
    return Math.floor(ms / (365.25 * 86400000))
  })()

  // BMR (Mifflin) — nul tot er gewicht/lengte/leeftijd/geslacht is.
  const bmr = calcBMR({
    weight: effectiveWeight,
    height: client?.height,
    age: effectiveAge,
    gender: client?.gender,
  })

  // Berekende componenten — alleen wat aangevinkt staat telt mee.
  const bmrBase = bmr != null ? Math.round(bmr * lifestyleFactor) : null
  const trainingExtra = includeTraining && trainingDays > 0 && kcalPerSession > 0
    ? Math.round((trainingDays * kcalPerSession) / 7)
    : 0
  // Cardio: som alle items op (min × sessies × kcal/min), deel door 7
  // voor de dagelijkse TDEE-bijdrage.
  const cardioKcalPerWeek = cardioActivities.reduce((sum, act) => {
    const cfg = CARDIO_TYPES[act.type]
    if (!cfg) return sum
    return sum + (parseInt(act.min) || 0) * (parseInt(act.sessions) || 0) * cfg.kcalPerMin
  }, 0)
  const cardioExtra = includeCardio ? Math.round(cardioKcalPerWeek / 7) : 0
  // Log-correctie = wat de log-derived TDEE zegt extra/minder is dan
  // de BMR+training+cardio combinatie. Compenseert systeemfouten.
  const baseWithoutLog = (bmrBase || 0) + trainingExtra + cardioExtra
  const logCorrection = includeLog && logEstimate?.realTdee
    ? logEstimate.realTdee - baseWithoutLog
    : 0
  // TDEE = basale stofwisseling × leefstijl + training + cardio + log-correctie.
  // Training en cardio zijn een AANVULLING op een echte basis (BMR of
  // log-derived). Ze mogen NIET zelf de TDEE worden — 150 kcal is geen
  // dagverbruik. Volgorde van bronnen:
  //   • Handmatige override aangevinkt → wint van alles
  //   • BMR aanwezig                   → volledige formule
  //   • Geen BMR maar log              → log-derived TDEE als basis
  //   • Geen van beide                 → null (knop legt uit wat te doen)
  const computedTdee = (() => {
    if (includeManual && Number.isFinite(parseInt(manualTdee)) && parseInt(manualTdee) > 0) {
      return parseInt(manualTdee)
    }
    if (bmr != null) return baseWithoutLog + logCorrection
    if (includeLog && logEstimate?.realTdee) {
      // Log geeft de echte TDEE op basis van wat is gegeten en aangekomen.
      // Training/cardio zitten al verwerkt in die meting — niet extra optellen.
      return logEstimate.realTdee
    }
    return null
  })()

  // Opgeslagen waardes — voor de projectie + macro-bereken.
  const savedTdee = Number.isFinite(parseFloat(client?.tdee)) ? parseFloat(client.tdee) : null
  const savedSurplus = Number.isFinite(parseFloat(client?.surplus)) ? parseFloat(client.surplus) : 0
  const liveSurplus = surplusDraft != null
    ? (parseInt(surplusDraft) || 0)
    : savedSurplus
  const tdeeForDoel = savedTdee ?? computedTdee
  const targetCal = tdeeForDoel != null ? tdeeForDoel + liveSurplus : null

  // ── Save handlers ─────────────────────────────────────────────────────
  const saveField = async (field, val) => {
    if (!db?.supabase || !client?.id) return
    try {
      const before = pickTrackedFields(client)
      await db.supabase.from('clients').update({ [field]: val }).eq('id', client.id)
      onClientUpdate?.({ [field]: val })
      await logClientChanges({ db, clientId: client.id, before, after: { [field]: val }, source: 'data_column_macros' })
    } catch (e) { console.error('saveField', e) }
  }

  const handleSaveTdee = async () => {
    if (busy || !db?.supabase || !client?.id) return
    if (computedTdee == null) {
      alert(
        'Geen TDEE-waarde te berekenen.\n\nKies één van deze opties:\n\n' +
        '1. Vink "Handmatige TDEE" aan en typ de waarde\n' +
        '2. Vul lengte / geboortedatum / geslacht in bij Profiel\n' +
        '3. Vink "Eet-/weeg-log" aan (vereist ≥5 dagen logs)'
      )
      return
    }
    setBusy('tdee')
    try {
      const settings = {
        lifestyle_level: lifestyleLevel,
        training_days: trainingDays,
        kcal_per_session: parseInt(kcalPerSession) || DEFAULT_KCAL_PER_SESSION,
        include_training: includeTraining,
        cardio_activities: cardioActivities,
        include_cardio: includeCardio,
        include_log: includeLog,
        include_manual: includeManual,
        manual_tdee: parseInt(manualTdee) || null,
      }
      const payload = { tdee: computedTdee, maintenance_settings: settings }
      const before = pickTrackedFields(client)
      await db.supabase.from('clients').update(payload).eq('id', client.id)
      onClientUpdate?.(payload)
      await logClientChanges({ db, clientId: client.id, before, after: payload, source: 'save_tdee' })
    } catch (e) { console.error('save tdee', e) }
    setBusy(null)
  }

  // Macro-bereken: NIET direct opslaan. Stop het resultaat in
  // `pendingMacros` zodat het naast de huidige waarden geprevieuwd kan
  // worden. Coach bevestigt expliciet via een aparte knop.
  const handleComputeMacros = () => {
    if (busy) return
    const tdee = savedTdee ?? computedTdee
    if (tdee == null) {
      alert('Kan macro\'s niet berekenen — geen TDEE bekend. Klik eerst "Bereken TDEE".')
      return
    }
    const out = applyMacroRules(client, {
      weight: effectiveWeight, tdee, surplus: liveSurplus,
    })
    if (!out) {
      alert('Macro-berekening mislukt. Controleer of gewicht en doel bekend zijn.')
      return
    }
    setPendingMacros({
      surplus: out.surplus,
      target_calories: out.target_calories,
      target_protein: out.target_protein,
      target_carbs: out.target_carbs,
      target_fat: out.target_fat,
    })
  }

  // Bevestig de geprevieuwde macros → schrijf naar clients.
  const handleConfirmMacros = async () => {
    if (busy || !pendingMacros || !db?.supabase || !client?.id) return
    setBusy('macros')
    try {
      const payload = { ...pendingMacros, manual_macro_targets: true }
      const before = pickTrackedFields(client)
      await db.supabase.from('clients').update(payload).eq('id', client.id)
      onClientUpdate?.(payload)
      await logClientChanges({ db, clientId: client.id, before, after: payload, source: 'confirm_macros' })
      setPendingMacros(null)
      setSurplusDraft(null); setEditingS(false)
    } catch (e) { console.error('confirm macros', e) }
    setBusy(null)
  }

  // ── Render helpers ────────────────────────────────────────────────────
  const row = (label, val, color = C.text) => (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: isMobile ? '0.35rem 0.75rem' : '0.4rem 1rem',
      borderBottom: `1px solid ${C.borderItem}`,
    }}>
      <span style={{ fontSize: '0.5rem', color: C.text20, textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>{label}</span>
      <span style={{ fontSize: isMobile ? '0.65rem' : '0.7rem', fontWeight: 700, color }}>{val}</span>
    </div>
  )

  // Kaart-rij per factor. Twee regels:
  //   • bovenste regel: checkbox + naam | kcal-bijdrage (groot, gold/groen)
  //   • onderste regel: detail (input + suffix, of statushint)
  // Dit is fors leesbaarder dan alles op één smalle regel proppen.
  const factorCard = ({ label, checked, onCheck, detail, kcalText, kcalColor, dimmed, disabled, missingHint }) => (
    <div style={{
      padding: isMobile ? '0.45rem 0.75rem 0.55rem' : '0.55rem 1rem 0.65rem',
      borderTop: `1px solid ${C.borderItem}`,
      opacity: disabled ? 0.55 : 1,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <input
          type="checkbox" checked={checked} disabled={disabled}
          onChange={(e) => onCheck(e.target.checked)}
          style={{
            width: 14, height: 14, accentColor: C.gold,
            cursor: disabled ? 'not-allowed' : 'pointer', flexShrink: 0,
          }}
        />
        <span style={{
          flex: 1,
          fontSize: '0.7rem', color: '#fff',
          fontWeight: 700, letterSpacing: '-0.005em',
        }}>
          {label}
        </span>
        <span style={{
          fontSize: '0.8rem', fontWeight: 800,
          color: dimmed ? C.text25 : (kcalColor || C.gold),
        }}>
          {kcalText}
        </span>
      </div>
      {(detail || missingHint) && (
        <div style={{
          marginTop: 5, marginLeft: 22,
          display: 'flex', alignItems: 'center', gap: 6,
          fontSize: '0.6rem', color: C.text50,
        }}>
          {missingHint ? (
            <span style={{ color: '#f59e0b', fontStyle: 'italic' }}>{missingHint}</span>
          ) : detail}
        </div>
      )}
    </div>
  )

  // Compacte ingebouwde select voor enum-keuzes (zoals lifestyle level).
  const inlineSelect = (val, onChange, options) => (
    <select
      value={val}
      onChange={(e) => onChange(e.target.value)}
      style={{
        background: 'rgba(255,255,255,0.06)',
        border: `1px solid ${C.gold}40`,
        borderRadius: 5, color: '#fff',
        fontSize: '0.6rem', fontWeight: 700,
        padding: '0.18rem 0.3rem',
        cursor: 'pointer',
        maxWidth: 130,
      }}
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value} style={{ background: '#0a0a0a', color: '#fff' }}>
          {opt.label}
        </option>
      ))}
    </select>
  )

  // Compacte ingebouwde input met label-suffix. Reikt rechts uit zodat
  // de bovenste rij niet uitloopt op de smalle data-kolom.
  const inlineInput = (val, onChange, suffix, w = 56, step) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <input
        type="number" value={val}
        step={step}
        onChange={(e) => onChange(e.target.value)}
        onClick={(e) => e.target.select()}
        style={{
          width: w, textAlign: 'right',
          background: 'rgba(255,255,255,0.06)',
          border: `1px solid ${C.gold}40`,
          borderRadius: 5, color: '#fff',
          fontSize: '0.68rem', fontWeight: 700,
          padding: '0.2rem 0.4rem',
        }}
      />
      {suffix && (
        <span style={{ fontSize: '0.58rem', color: C.text50, fontWeight: 600 }}>
          {suffix}
        </span>
      )}
    </span>
  )

  // Welke profiel-velden ontbreken? Voor de BMR-rij hint geven.
  const missing = []
  if (!Number.isFinite(parseFloat(effectiveWeight))) missing.push('gewicht')
  if (!Number.isFinite(parseFloat(client?.height))) missing.push('lengte')
  if (!Number.isFinite(effectiveAge)) missing.push('geboortedatum')
  if (!client?.gender) missing.push('geslacht')
  const bmrMissing = missing.length > 0 ? `Vul ${missing.join(' / ')} in bij Profiel om BMR te berekenen.` : null

  return (
    <div style={{
      background: 'rgba(255,215,0,0.025)',
      borderTop: `1px solid ${C.border}`,
      borderBottom: `1px solid ${C.border}`,
      marginBottom: 2,
    }}>
      {/* ════════════════════ BLOK 1 — ONDERHOUD ════════════════════
          Inklapbare header: dichtgeklapt zie je alleen de opgeslagen TDEE
          + modus, open zie je alle factoren + Bereken-knop. */}
      <button
        onClick={() => setShowTdeeDetail(v => !v)}
        style={{
          width: '100%',
          padding: isMobile ? '0.55rem 0.75rem' : '0.65rem 1rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(255,215,0,0.06)',
          border: 'none', cursor: 'pointer',
          color: 'inherit',
        }}
      >
        <span style={{ fontSize: isMobile ? '0.64rem' : '0.68rem', color: C.gold, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 900 }}>
          Onderhoud · modus {goal}
        </span>
        <span style={{
          display: 'flex', alignItems: 'baseline', gap: 8,
        }}>
          {!showTdeeDetail && (
            <span style={{
              fontSize: '0.95rem', fontWeight: 900, color: C.gold,
              letterSpacing: '-0.02em',
            }}>
              {savedTdee != null ? `${savedTdee} kcal` : '—'}
            </span>
          )}
          <span style={{ fontSize: '0.55rem', color: C.text50, fontWeight: 700, letterSpacing: '0.05em' }}>
            {showTdeeDetail ? 'Inklappen ▴' : 'Bewerken ▾'}
          </span>
        </span>
      </button>

      {showTdeeDetail && (
        <div style={{
          padding: isMobile ? '0 0.75rem 0.4rem' : '0 1rem 0.45rem',
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
          background: 'rgba(255,215,0,0.04)',
        }}>
          <button
            onClick={handleSaveTdee}
            disabled={busy != null}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '0.35rem 0.7rem',
              background: 'rgba(255,215,0,0.14)',
              border: `1px solid rgba(255,215,0,0.4)`,
              borderRadius: 5,
              color: C.gold,
              fontSize: '0.6rem', fontWeight: 800,
              cursor: busy ? 'wait' : 'pointer', minHeight: 28,
              letterSpacing: '0.04em', textTransform: 'uppercase',
            }}
          >
            <RefreshCw size={11} />
            {busy === 'tdee' ? 'Bezig…' : 'Bereken & opslaan TDEE'}
          </button>
        </div>
      )}

      {showTdeeDetail && <>

      {/* BMR + Lifestyle — basis: dagverbruik zonder training/cardio */}
      {factorCard({
        label: 'BMR × leefstijl',
        checked: true,
        onCheck: () => {},
        disabled: bmr == null,
        missingHint: bmrMissing,
        detail: bmr != null ? (
          <>
            <span>{bmr} kcal × </span>
            {inlineSelect(lifestyleLevel, setLifestyleLevel,
              Object.entries(LIFESTYLE_LEVELS).map(([value, { label, factor }]) => ({
                value, label: `${label.split(' (')[0]} (×${factor})`,
              }))
            )}
          </>
        ) : null,
        kcalText: bmrBase != null ? `${bmrBase} kcal` : '—',
        kcalColor: C.gold,
        dimmed: bmrBase == null,
      })}

      {/* Training — dagen × kcal per sessie ÷ 7
          Trainingsdagen syncen met het workout_schema: badge "uit plan"
          wanneer waarde matched, "aangepast" met sync-knop wanneer niet. */}
      {(() => {
        const synced = planTrainingDays != null && planTrainingDays === trainingDays
        const hasPlan = planTrainingDays != null
        return factorCard({
          label: 'Training',
          checked: includeTraining,
          onCheck: setIncludeTraining,
          detail: (
            <>
              {inlineInput(trainingDays, (v) => setTrainingDays(parseInt(v) || 0), 'd/wk', 38)}
              <span style={{ color: C.text25 }}>×</span>
              {inlineInput(kcalPerSession, (v) => setKcalPerSession(parseInt(v) || 0), 'kcal/sessie', 52)}
              {hasPlan && (
                synced ? (
                  <span style={{
                    fontSize: '0.5rem', color: C.green, fontWeight: 700,
                    background: 'rgba(16,185,129,0.1)',
                    border: '1px solid rgba(16,185,129,0.25)',
                    padding: '1px 5px', borderRadius: 4,
                    textTransform: 'uppercase', letterSpacing: '0.04em',
                  }}>
                    uit plan
                  </span>
                ) : (
                  <button
                    onClick={() => setTrainingDays(planTrainingDays)}
                    style={{
                      fontSize: '0.5rem', color: C.amber, fontWeight: 700,
                      background: 'rgba(245,158,11,0.08)',
                      border: '1px solid rgba(245,158,11,0.3)',
                      padding: '1px 5px', borderRadius: 4,
                      textTransform: 'uppercase', letterSpacing: '0.04em',
                      cursor: 'pointer',
                    }}
                    title={`Plan staat op ${planTrainingDays} d/wk — klik om te syncen`}
                  >
                    Sync ↻ {planTrainingDays}
                  </button>
                )
              )}
            </>
          ),
          kcalText: includeTraining ? `+${trainingExtra} kcal` : '—',
          kcalColor: C.green,
          dimmed: !includeTraining,
        })
      })()}

      {/* Cardio — lijst van activiteiten, elk met type/min/sessies */}
      <div style={{
        padding: isMobile ? '0.45rem 0.75rem 0.55rem' : '0.55rem 1rem 0.65rem',
        borderTop: `1px solid ${C.borderItem}`,
        opacity: !includeCardio ? 0.6 : 1,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="checkbox" checked={includeCardio}
            onChange={(e) => setIncludeCardio(e.target.checked)}
            style={{ width: 14, height: 14, accentColor: C.gold, cursor: 'pointer', flexShrink: 0 }}
          />
          <span style={{ flex: 1, fontSize: '0.7rem', color: '#fff', fontWeight: 700 }}>
            Cardio
          </span>
          <span style={{
            fontSize: '0.8rem', fontWeight: 800,
            color: includeCardio ? C.green : C.text25,
          }}>
            {includeCardio ? `+${cardioExtra} kcal` : '—'}
          </span>
        </div>

        {/* Activiteiten-lijst */}
        {cardioActivities.length > 0 && (
          <div style={{ marginTop: 7, marginLeft: 22, display: 'flex', flexDirection: 'column', gap: 5 }}>
            {cardioActivities.map((act, idx) => {
              const cfg = CARDIO_TYPES[act.type] || CARDIO_TYPES.running
              const min = parseInt(act.min) || 0
              const sessions = parseInt(act.sessions) || 0
              const kcalPerWeek = min * sessions * cfg.kcalPerMin
              const update = (patch) => {
                setCardioActivities(arr => arr.map((a, i) => i === idx ? { ...a, ...patch } : a))
              }
              const remove = () => {
                setCardioActivities(arr => arr.filter((_, i) => i !== idx))
              }
              return (
                <div key={idx} style={{
                  padding: '0.5rem 0.6rem',
                  background: 'rgba(255,255,255,0.03)',
                  border: `1px solid ${C.borderItem}`,
                  borderRadius: 8,
                }}>
                  {/* Bovenste regel: type-keuze + delete + kcal */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <select
                      value={act.type}
                      onChange={(e) => update({ type: e.target.value })}
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: `1px solid ${C.gold}30`,
                        borderRadius: 5,
                        color: '#fff', fontWeight: 700,
                        fontSize: '0.78rem',
                        cursor: 'pointer', flex: 1, minWidth: 0,
                        padding: '0.35rem 0.5rem',
                      }}
                    >
                      {Object.entries(CARDIO_TYPES).map(([value, { label }]) => (
                        <option key={value} value={value} style={{ background: '#0a0a0a' }}>{label}</option>
                      ))}
                    </select>
                    <span style={{
                      fontSize: '0.72rem', color: C.green, fontWeight: 800,
                      minWidth: 64, textAlign: 'right',
                    }}>
                      {kcalPerWeek} kcal
                    </span>
                    <button
                      onClick={remove}
                      style={{
                        width: 22, height: 22, padding: 0,
                        background: 'rgba(255,255,255,0.04)',
                        border: `1px solid ${C.borderItem}`,
                        borderRadius: 4,
                        color: C.text50, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}
                      title="Verwijderen"
                    >
                      <X size={13} />
                    </button>
                  </div>
                  {/* Onderste regel: min + sessies, ruimere inputs */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    fontSize: '0.7rem', color: C.text50, fontWeight: 600,
                  }}>
                    <input
                      type="number" value={min}
                      onChange={(e) => update({ min: parseInt(e.target.value) || 0 })}
                      onClick={(e) => e.target.select()}
                      style={{
                        width: 52, textAlign: 'center',
                        background: 'rgba(255,255,255,0.06)',
                        border: `1px solid ${C.gold}30`, borderRadius: 5,
                        color: '#fff', fontSize: '0.85rem', fontWeight: 800,
                        padding: '0.3rem 0.4rem',
                      }}
                    />
                    <span>min/sessie</span>
                    <span style={{ color: C.text25 }}>×</span>
                    <input
                      type="number" value={sessions}
                      onChange={(e) => update({ sessions: parseInt(e.target.value) || 0 })}
                      onClick={(e) => e.target.select()}
                      style={{
                        width: 44, textAlign: 'center',
                        background: 'rgba(255,255,255,0.06)',
                        border: `1px solid ${C.gold}30`, borderRadius: 5,
                        color: '#fff', fontSize: '0.85rem', fontWeight: 800,
                        padding: '0.3rem 0.4rem',
                      }}
                    />
                    <span>/wk</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Toevoegen-knop */}
        <button
          onClick={() => {
            setCardioActivities(arr => [...arr, { type: 'running', min: 30, sessions: 3 }])
            if (!includeCardio) setIncludeCardio(true)
          }}
          style={{
            marginTop: 7, marginLeft: 22,
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '0.3rem 0.55rem',
            background: 'rgba(16,185,129,0.08)',
            border: `1px dashed rgba(16,185,129,0.35)`,
            borderRadius: 6,
            color: C.green,
            fontSize: '0.6rem', fontWeight: 700,
            cursor: 'pointer', minHeight: 26,
            letterSpacing: '0.02em',
          }}
        >
          <Plus size={11} strokeWidth={3} />
          Cardio toevoegen
        </button>

        {/* Totaal preview onder de lijst */}
        {includeCardio && cardioKcalPerWeek > 0 && (
          <div style={{
            marginTop: 7, marginLeft: 22,
            fontSize: '0.55rem', color: C.text25,
          }}>
            Totaal: {cardioKcalPerWeek} kcal/wk · ÷ 7 = {cardioExtra} kcal/dag
          </div>
        )}
      </div>

      {/* Log derivation */}
      {factorCard({
        label: 'Eet-/weeg-log (14d)',
        checked: includeLog,
        onCheck: setIncludeLog,
        disabled: !logEstimate,
        detail: logEstimate ? (
          <>
            <span>{logEstimate.days}d data</span>
            <span style={{ color: C.text25 }}>·</span>
            <span>Ø {logEstimate.avgKcal} kcal/d</span>
            <span style={{ color: C.text25 }}>·</span>
            <span>Δ {logEstimate.deltaKg > 0 ? '+' : ''}{logEstimate.deltaKg} kg</span>
          </>
        ) : null,
        missingHint: !logEstimate ? 'Min. 5 dagen aan eet-logs nodig om te schatten.' : null,
        kcalText: includeLog && logEstimate
          ? (logCorrection >= 0 ? `+${logCorrection} kcal` : `${logCorrection} kcal`)
          : '—',
        kcalColor: logCorrection < 0 ? C.red : C.green,
        dimmed: !includeLog,
      })}

      {/* Handmatige override — wint van alle factoren als aangevinkt */}
      {factorCard({
        label: 'Handmatige TDEE',
        checked: includeManual,
        onCheck: setIncludeManual,
        detail: (
          <>
            {inlineInput(manualTdee, (v) => setManualTdee(parseInt(v) || 0), 'kcal', 70)}
            <span style={{ color: C.amber, fontStyle: 'italic' }}>
              {includeManual ? 'wint van alles' : 'gebruik als je TDEE al kent'}
            </span>
          </>
        ),
        kcalText: includeManual && manualTdee > 0 ? `= ${manualTdee} kcal` : '—',
        kcalColor: C.amber,
        dimmed: !includeManual,
      })}

      {/* Berekende TDEE — totaal als heldere afsluiter */}
      <div style={{
        padding: isMobile ? '0.6rem 0.75rem 0.65rem' : '0.7rem 1rem 0.75rem',
        borderTop: `1px solid ${C.border}`,
        background: 'rgba(255,215,0,0.06)',
        display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
      }}>
        <span style={{
          fontSize: '0.55rem', color: C.gold, fontWeight: 800,
          textTransform: 'uppercase', letterSpacing: '0.06em',
        }}>
          Berekende TDEE
        </span>
        <span style={{
          fontSize: isMobile ? '1rem' : '1.15rem', fontWeight: 900,
          color: computedTdee != null ? C.gold : C.text25,
          letterSpacing: '-0.02em',
        }}>
          {computedTdee != null ? `${computedTdee} kcal` : '—'}
        </span>
      </div>
      {savedTdee != null && (
        <div style={{
          padding: isMobile ? '0.3rem 0.75rem 0.5rem' : '0.35rem 1rem 0.55rem',
          fontSize: '0.55rem', color: C.text50,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span style={{ color: C.text25 }}>Opgeslagen:</span>
          <span style={{ color: C.text, fontWeight: 700 }}>{savedTdee} kcal</span>
          {savedTdee !== computedTdee && computedTdee != null && (
            <span style={{ color: C.amber, fontStyle: 'italic', marginLeft: 'auto' }}>
              ≠ berekend
            </span>
          )}
        </div>
      )}

      </>}

      {/* ════════════════════ BLOK 2 — MACRO'S ════════════════════
          Inklapbaar net als Onderhoud. Dicht: alleen opgeslagen kcal/macros
          + Bewerken-toggle. Open: surplus-editor + Bereken-knop. */}
      <button
        onClick={() => setShowMacroDetail(v => !v)}
        style={{
          width: '100%',
          padding: isMobile ? '0.55rem 0.75rem' : '0.65rem 1rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(255,215,0,0.06)',
          border: 'none', borderTop: `1px solid ${C.border}`,
          cursor: 'pointer', color: 'inherit',
        }}
      >
        <span style={{ fontSize: isMobile ? '0.64rem' : '0.68rem', color: C.gold, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 900 }}>
          Macro's
        </span>
        <span style={{
          display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap',
          justifyContent: 'flex-end',
        }}>
          {!showMacroDetail && (
            <span style={{
              fontSize: '0.62rem', color: C.text50, fontWeight: 700,
              display: 'flex', gap: 6, alignItems: 'baseline',
            }}>
              <span style={{ color: C.gold, fontWeight: 900, fontSize: '0.95rem' }}>
                {client?.target_calories ? `${client.target_calories}` : '—'}
              </span>
              <span style={{ color: C.gold, fontWeight: 700, fontSize: '0.55rem' }}>kcal</span>
              {client?.target_protein != null && <span style={{ color: C.orange }}>{Math.round(client.target_protein)}E</span>}
              {client?.target_carbs   != null && <span style={{ color: C.green }}>{Math.round(client.target_carbs)}K</span>}
              {client?.target_fat     != null && <span style={{ color: C.amber }}>{Math.round(client.target_fat)}V</span>}
            </span>
          )}
          <span style={{ fontSize: '0.55rem', color: C.text50, fontWeight: 700, letterSpacing: '0.05em' }}>
            {showMacroDetail ? 'Inklappen ▴' : 'Bewerken ▾'}
          </span>
        </span>
      </button>

      {showMacroDetail && (
        <div style={{
          padding: isMobile ? '0 0.75rem 0.4rem' : '0 1rem 0.45rem',
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
          background: 'rgba(255,215,0,0.04)',
        }}>
          <button
            onClick={handleComputeMacros}
            disabled={busy != null}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '0.35rem 0.7rem',
              background: 'rgba(255,215,0,0.14)',
              border: `1px solid rgba(255,215,0,0.4)`,
              borderRadius: 5,
              color: C.gold,
              fontSize: '0.6rem', fontWeight: 800,
              cursor: busy ? 'wait' : 'pointer', minHeight: 28,
              letterSpacing: '0.04em', textTransform: 'uppercase',
            }}
          >
            <RefreshCw size={11} />
            {busy === 'macros' ? 'Bezig…' : 'Bereken voorbeeld'}
          </button>
        </div>
      )}

      {showMacroDetail && <>

      {/* Surplus / Deficit — editable binnen het regel-bereik */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: isMobile ? '0.35rem 0.75rem' : '0.4rem 1rem',
        borderTop: `1px solid ${C.borderItem}`,
      }}>
        <span style={{ fontSize: '0.5rem', color: C.text20, textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>
          Tekort / surplus
          <span style={{ marginLeft: 4, color: C.text15, textTransform: 'none', letterSpacing: 0 }}>
            (aanbevolen {rule.min === rule.max ? '0' : `${rule.min} t/m ${rule.max}`})
          </span>
        </span>
        {editingS ? (
          <input
            autoFocus type="number"
            value={surplusDraft ?? (client?.surplus ?? '')}
            onChange={(e) => setSurplusDraft(e.target.value)}
            onBlur={() => {
              // Geen clamping meer — wat de coach intypt wordt bewaard,
              // zelfs als het buiten de "aanbevolen" range valt. De range
              // staat ernaast als hint maar is niet bindend.
              if (surplusDraft != null && surplusDraft !== '') {
                const val = parseInt(surplusDraft) || 0
                saveField('surplus', val)
                setSurplusDraft(String(val))
              }
              setEditingS(false)
            }}
            onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur() }}
            style={{
              width: 80, textAlign: 'right',
              background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.gold}40`,
              borderRadius: 4, color: C.text, fontSize: '0.7rem', fontWeight: 700,
              padding: '0.15rem 0.35rem',
            }}
          />
        ) : (
          <span
            onClick={() => setEditingS(true)}
            style={{
              fontSize: isMobile ? '0.65rem' : '0.7rem', fontWeight: 700,
              color: liveSurplus < 0 ? C.red : liveSurplus > 0 ? C.green : C.text50,
              cursor: 'pointer',
            }}
          >
            {liveSurplus > 0 ? '+' : ''}{liveSurplus} kcal
            {client?.surplus == null && (
              <span style={{ marginLeft: 4, fontSize: '0.5rem', color: C.text25, fontWeight: 600 }}>niet ingesteld</span>
            )}
          </span>
        )}
      </div>

      {/* Berekend doel-kcal (read-only preview) */}
      {row('Doel kcal', targetCal != null ? `${targetCal} kcal` : '—', C.gold)}

      </>}

      {/* ── Pending macros preview — coach kan controleren én bewerken ── */}
      {pendingMacros && (() => {
        // Bewerkings-helper: zet één macro-veld in pendingMacros.
        const setMacro = (field, val) => {
          const num = parseInt(val) || 0
          setPendingMacros(prev => ({ ...prev, [field]: num }))
        }
        // Validatie: kloppen de macro-kcal nog met target_calories?
        const macroKcal = (pendingMacros.target_protein * 4)
                       + (pendingMacros.target_carbs   * 4)
                       + (pendingMacros.target_fat     * 9)
        const kcalDelta = macroKcal - pendingMacros.target_calories
        const kcalMatch = Math.abs(kcalDelta) <= 15
        return (
          <div style={{
            padding: isMobile ? '0.65rem 0.75rem 0.7rem' : '0.75rem 1rem 0.8rem',
            borderTop: `1px solid ${C.border}`,
            background: 'rgba(255,215,0,0.07)',
          }}>
            <div style={{
              fontSize: '0.5rem', color: C.gold, fontWeight: 800,
              textTransform: 'uppercase', letterSpacing: '0.06em',
              marginBottom: 8,
            }}>
              ▸ Voorbeeld — klik op een waarde om aan te passen
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 8 }}>
              {[
                { label: 'Kcal',  field: 'target_calories', cur: client?.target_calories, color: C.gold, unit: '' },
                { label: 'Eiwit', field: 'target_protein',  cur: client?.target_protein,  color: C.gold, unit: 'g' },
                { label: 'Koolh', field: 'target_carbs',    cur: client?.target_carbs,    color: C.gold, unit: 'g' },
                { label: 'Vet',   field: 'target_fat',      cur: client?.target_fat,      color: C.gold, unit: 'g' },
              ].map(m => {
                const next = pendingMacros[m.field]
                const delta = (m.cur != null) ? Math.round(next - m.cur) : null
                return (
                  <div key={m.label} style={{
                    padding: '0.5rem 0.35rem',
                    background: 'rgba(0,0,0,0.4)',
                    border: `1px solid ${C.borderItem}`,
                    borderRadius: 7, textAlign: 'center',
                  }}>
                    <div style={{
                      fontSize: '0.45rem', color: C.text25, fontWeight: 700,
                      textTransform: 'uppercase', letterSpacing: '0.05em',
                    }}>{m.label}</div>
                    <div style={{
                      fontSize: '0.5rem', color: C.text25, fontWeight: 600,
                      marginTop: 2, textDecoration: 'line-through',
                      height: 11,
                    }}>
                      {m.cur != null ? `${Math.round(m.cur)}${m.unit}` : ''}
                    </div>
                    <input
                      type="number" value={next}
                      onChange={(e) => setMacro(m.field, e.target.value)}
                      onClick={(e) => e.target.select()}
                      style={{
                        width: '100%',
                        background: 'rgba(255,255,255,0.05)',
                        border: `1px solid ${m.color}30`,
                        borderRadius: 5, textAlign: 'center',
                        color: m.color,
                        fontSize: isMobile ? '0.85rem' : '0.95rem',
                        fontWeight: 800,
                        padding: '0.18rem 0.2rem',
                        marginTop: 3,
                      }}
                    />
                    {delta != null && delta !== 0 && (
                      <div style={{
                        fontSize: '0.48rem',
                        color: delta > 0 ? C.green : C.red,
                        fontWeight: 700, marginTop: 2,
                      }}>
                        {delta > 0 ? '+' : ''}{delta}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Validatie-regel: kloppen de macro-kcal nog met target_calories? */}
            <div style={{
              padding: '0.35rem 0.5rem',
              background: kcalMatch ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.1)',
              border: `1px solid ${kcalMatch ? 'rgba(16,185,129,0.25)' : 'rgba(245,158,11,0.3)'}`,
              borderRadius: 6,
              marginBottom: 10,
              fontSize: '0.55rem',
              color: kcalMatch ? C.green : C.amber,
              fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              {kcalMatch ? '✓' : '⚠'}
              <span>Macro-kcal: {macroKcal} kcal</span>
              <span style={{ color: C.text25, fontWeight: 600 }}>
                ({kcalDelta > 0 ? '+' : ''}{kcalDelta} t.o.v. doel kcal)
              </span>
            </div>

            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={() => setPendingMacros(null)}
                disabled={busy != null}
                style={{
                  flex: 1,
                  padding: '0.45rem',
                  background: 'transparent',
                  border: `1px solid ${C.border}`,
                  borderRadius: 6,
                  color: C.text50,
                  fontSize: '0.6rem', fontWeight: 700,
                  cursor: busy ? 'wait' : 'pointer',
                  textTransform: 'uppercase', letterSpacing: '0.04em',
                }}
              >
                Annuleren
              </button>
              <button
                onClick={handleConfirmMacros}
                disabled={busy != null}
                style={{
                  flex: 2,
                  padding: '0.45rem',
                  background: 'linear-gradient(135deg, #FFD700 0%, #D4AF37 100%)',
                  border: 'none',
                  borderRadius: 6,
                  color: '#000',
                  fontSize: '0.62rem', fontWeight: 800,
                  cursor: busy ? 'wait' : 'pointer',
                  textTransform: 'uppercase', letterSpacing: '0.04em',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                }}
              >
                <Check size={11} strokeWidth={3} />
                {busy === 'macros' ? 'Opslaan…' : 'Bevestig & opslaan'}
              </button>
            </div>
          </div>
        )
      })()}

      {/* ── Ingestelde macro-targets (huidige opgeslagen waarden) ── */}
      <div style={{
        margin: isMobile ? '0.5rem 0.75rem 0.4rem' : '0.6rem 1rem 0.45rem',
        padding: isMobile ? '0.75rem 0.85rem' : '0.85rem 1rem',
        background: 'rgba(255,215,0,0.04)',
        border: '1px solid rgba(255,215,0,0.2)',
        borderRadius: 14,
      }}>
        <div style={{
          fontSize: isMobile ? '0.7rem' : '0.75rem', color: C.gold, textTransform: 'uppercase',
          letterSpacing: '0.06em', fontWeight: 900, marginBottom: 10,
        }}>
          🎯 Doelen & Macro's
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { label: 'Kcal',  val: client?.target_calories, color: C.gold, unit: '' },
            { label: 'Eiwit', val: client?.target_protein,  color: C.gold, unit: 'g' },
            { label: 'Koolh', val: client?.target_carbs,    color: C.gold, unit: 'g' },
            { label: 'Vet',   val: client?.target_fat,      color: C.gold, unit: 'g' },
          ].map(m => (
            <div key={m.label} style={{
              flex: 1, padding: isMobile ? '0.55rem 0.35rem' : '0.65rem 0.4rem',
              background: 'rgba(0,0,0,0.3)',
              border: `1px solid ${m.color}33`,
              borderRadius: 10, textAlign: 'center',
            }}>
              <div style={{
                fontSize: isMobile ? '0.62rem' : '0.66rem', color: 'rgba(255,255,255,0.65)', fontWeight: 800,
                textTransform: 'uppercase', letterSpacing: '0.05em',
              }}>{m.label}</div>
              <div style={{
                fontSize: isMobile ? '1.35rem' : '1.5rem',
                fontWeight: 900, color: m.color, marginTop: 4, lineHeight: 1, letterSpacing: '-0.02em',
              }}>
                {m.val ? Math.round(m.val) : '—'}
                {m.val && m.unit ? <span style={{ fontSize: '0.55em', fontWeight: 700, opacity: 0.6, marginLeft: 1 }}>{m.unit}</span> : null}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Projectie: waar je uitkomt met huidige instellingen ──
          Gebruikt expliciet het OPGESLAGEN tekort, niet het rule-default
          of een edit-draft. Zo zie je de richting waar de klant écht op
          afstevent met de actief gezette instelling. */}
      <ProjectionPanel
        client={client}
        currentWeight={effectiveWeight}
        liveSurplus={savedSurplus}
        isMobile={isMobile}
      />
    </div>
  )
}

// ── Projectie-paneel ──
// Maakt het traject-eind expliciet zichtbaar: met huidig tekort
// eindig je op X kg; vergelijk dat met je target_weight; wat nodig is
// voor exacte doel-hit.
function ProjectionPanel({ client, currentWeight, liveSurplus, isMobile }) {
  const w = parseFloat(currentWeight)
  const targetW = parseFloat(client?.target_weight)

  // Einddatum-bron-prioriteit: goal_deadline > target_date > coaching-periode.
  let deadlineStr = client?.goal_deadline || client?.target_date
  if (!deadlineStr && client?.coaching_start_date && client?.coaching_total_weeks) {
    const ms = new Date(client.coaching_start_date + 'T00:00:00').getTime()
    const weeks = parseInt(client.coaching_total_weeks, 10) || 0
    const pausedDays = parseInt(client.coaching_paused_days_total, 10) || 0
    deadlineStr = new Date(ms + (weeks * 7 + pausedDays) * 86400000).toISOString().split('T')[0]
  }
  const deadline = deadlineStr ? new Date(deadlineStr) : null
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const daysLeft = deadline ? Math.max(0, Math.round((deadline - today) / 86400000)) : null

  const hasAll = Number.isFinite(w) && Number.isFinite(targetW) && daysLeft != null

  // Eind-gewicht met huidig surplus.
  // surplus < 0 = cut → end weight < current
  const projectedEndW = hasAll
    ? Math.round((w + (liveSurplus * daysLeft) / 7700) * 10) / 10
    : null
  const deltaToGoal = projectedEndW != null
    ? Math.round((projectedEndW - targetW) * 10) / 10
    : null

  // Nodig dagelijks tekort/surplus om EXACT op target_weight te eindigen.
  const neededSurplus = hasAll && daysLeft > 0
    ? Math.round(((targetW - w) * 7700) / daysLeft)
    : null

  const kgToGo = hasAll ? Math.round((targetW - w) * 10) / 10 : null

  const fmtDate = (d) => d ? d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }) : '—'

  // Kleur-feedback: hoe ver eind-gewicht van target_weight ligt.
  const trackColor = deltaToGoal == null ? C.text50
    : Math.abs(deltaToGoal) <= 0.5 ? C.green
    : Math.abs(deltaToGoal) <= 1.5 ? C.amber
    : C.red

  return (
    <div style={{
      padding: isMobile ? '0.6rem 0.75rem 0.7rem' : '0.7rem 1rem 0.85rem',
      borderTop: `1px solid ${C.borderItem}`,
      background: 'rgba(255,255,255,0.015)',
    }}>
      <div style={{
        fontSize: '0.5rem', color: C.gold, textTransform: 'uppercase',
        letterSpacing: '0.06em', fontWeight: 800, marginBottom: 8,
      }}>
        Projectie eind traject
      </div>

      {/* Huidig → doel summary */}
      <div style={{
        display: 'flex', alignItems: 'baseline', gap: 6,
        fontSize: isMobile ? '0.65rem' : '0.7rem',
        color: C.text50, fontWeight: 600, marginBottom: 8,
      }}>
        <span style={{ color: C.text }}>{w ? w.toFixed(1) : '—'} kg</span>
        <span>→</span>
        <span style={{ color: C.gold, fontWeight: 800 }}>{targetW ? targetW.toFixed(1) : '—'} kg</span>
        {kgToGo != null && (
          <span style={{ color: C.text25 }}>
            ({kgToGo > 0 ? '+' : ''}{kgToGo} kg)
          </span>
        )}
        <span style={{ marginLeft: 'auto', color: C.text25 }}>
          tot {fmtDate(deadline)} · {daysLeft != null ? `${daysLeft}d` : '—'}
        </span>
      </div>

      {!hasAll ? (
        <div style={{
          fontSize: '0.6rem', color: C.text25, fontStyle: 'italic',
          padding: '0.4rem 0',
        }}>
          Vul gewicht, doelgewicht en deadline om de projectie te zien.
        </div>
      ) : (
        <>
          {/* Met huidig tekort eindig je op X */}
          <div style={{
            padding: '0.5rem 0.6rem',
            background: 'rgba(255,255,255,0.025)',
            borderRadius: 7,
            marginBottom: 6,
          }}>
            <div style={{
              fontSize: '0.5rem', color: C.text25, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.05em',
              marginBottom: 3,
            }}>
              Met huidig tekort ({liveSurplus > 0 ? '+' : ''}{liveSurplus} kcal)
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{
                fontSize: isMobile ? '1.05rem' : '1.2rem', fontWeight: 800,
                color: trackColor, lineHeight: 1,
              }}>
                {projectedEndW} kg
              </span>
              <span style={{
                fontSize: '0.6rem', color: C.text50, fontWeight: 600,
              }}>
                eind {fmtDate(deadline)}
              </span>
              {deltaToGoal != null && deltaToGoal !== 0 && (
                <span style={{
                  marginLeft: 'auto',
                  fontSize: '0.62rem', fontWeight: 700, color: trackColor,
                }}>
                  {deltaToGoal > 0 ? `${deltaToGoal} kg boven doel` : `${Math.abs(deltaToGoal)} kg onder doel`}
                </span>
              )}
              {deltaToGoal === 0 && (
                <span style={{
                  marginLeft: 'auto',
                  fontSize: '0.62rem', fontWeight: 800, color: C.green,
                }}>op doel</span>
              )}
            </div>
          </div>

          {/* Wat is nodig voor exact doel? */}
          {neededSurplus != null && (
            <div style={{
              padding: '0.45rem 0.6rem',
              background: 'rgba(255,255,255,0.025)',
              borderRadius: 7,
              display: 'flex', alignItems: 'baseline', gap: 6,
            }}>
              <span style={{
                fontSize: '0.5rem', color: C.text25, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.05em',
              }}>
                Voor exact doel
              </span>
              <span style={{
                marginLeft: 'auto',
                fontSize: '0.72rem', fontWeight: 800,
                color: neededSurplus < 0 ? C.red : neededSurplus > 0 ? C.green : C.text,
              }}>
                {neededSurplus > 0 ? '+' : ''}{neededSurplus} kcal/dag
              </span>
            </div>
          )}
        </>
      )}
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

// Pill-style aan/uit-toggle voor boolean velden in de insight-kolom.
// Slaat direct op via onChange — value is `true | false | null | undefined`,
// undefined wordt behandeld als defaultValue.
const ToggleRow = ({ label, value, defaultValue = true, onChange, isMobile, hint }) => {
  const current = value === null || value === undefined ? defaultValue : !!value
  return (
    <div style={{ padding: isMobile ? '0.45rem 0.75rem' : '0.5rem 1rem', borderBottom: `1px solid ${C.borderItem}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ fontSize: '0.5rem', color: C.text20, textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: '700' }}>{label}</span>
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
        <div style={{ marginTop: 3, fontSize: '0.52rem', color: C.text25, fontStyle: 'italic', lineHeight: 1.4 }}>{hint}</div>
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
      <SwipeInput label="Eiwit" value={protein} setValue={setProtein} min={50} max={400} step={5} kcalPer={4} color={C.gold} />
      <SwipeInput label="Vet" value={fat} setValue={setFat} min={20} max={200} step={2} kcalPer={9} color={C.gold} />
      <SwipeInput label="Koolhydr." value={carbs} setValue={() => {}} min={0} max={600} step={5} kcalPer={4} color={C.gold} isAuto />
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

      case 'doelen': return (<>
        {/* Primair doel staat bovenaan zodat het MacroRulesBlock-paneel
            er meteen op kan reageren (de modus stuurt de regels). */}
        <E label="Primair doel" value={client.primary_goal}   field="primary_goal" options={['cut', 'bulk', 'maintain', 'recomp', 'health', 'performance']} />
        <E label="Doelgewicht"  value={client.target_weight ? parseFloat(client.target_weight).toFixed(1) : null} field="target_weight" type="number" suffix=" kg" />
        <E label="Deadline"     value={client.goal_deadline ? client.goal_deadline.split('T')[0] : null} field="goal_deadline" />

        {/* Streefgewicht-rekenaar via huidig/doel bodyfat%. Aanname: vetvrije
            massa blijft gelijk. Coach kan resultaat met één klik in
            target_weight zetten — dat voedt vervolgens MacroRulesBlock. */}
        <BodyFatTargetCalculator client={client} db={db} onClientUpdate={onClientUpdate} isMobile={isMobile} />

        {/* Het hart van de doelen-tab: maintenance, tekort, macro-targets
            en projectie naar het traject-einde. Voorheen apart in 'macros'. */}
        <MacroRulesBlock client={client} db={db} onClientUpdate={onClientUpdate} isMobile={isMobile} />

        {/* Overige doel-velden, verder naar onderen — minder vaak nodig. */}
        <E label="Doel vet %"   value={client.target_body_fat} field="target_body_fat" type="number" suffix="%" />
        <E label="Tijdlijn"     value={client.goal_timeline}  field="goal_timeline" />
        <E label="Urgentie"     value={client.goal_urgency}   field="goal_urgency" options={['low', 'moderate', 'high', 'extreme']} />
        <E label="Wk afval"     value={client.weekly_weight_goal} field="weekly_weight_goal" type="number" suffix=" kg/wk" />
        <E label="Motivatie"    value={client.motivation}     field="motivation" />
        <E label="Obstakels"    value={client.biggest_obstacle} field="biggest_obstacle" />
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
        <span style={{ fontSize: isMobile ? '0.82rem' : '0.9rem', fontWeight: 900, color: activeMeta.color, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{activeMeta.label}</span>
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
        {/* SectionContent als functie-aanroep, niet als component: zo krijgt
            MacroRulesBlock een stabiele plek in de tree en behoudt z'n
            interne state (zoals een lopende deficit-edit) tussen renders. */}
        {SectionContent()}
        <div style={{ height: '1rem' }} />
      </div>
    </div>
  )
}
