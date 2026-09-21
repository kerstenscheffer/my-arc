// src/modules/coach-command-center/components/insight/MacroRulesBlock.jsx
//
// Onderhoud, tekort of surplus, en de macro-targets die daaruit volgen. Plus de
// projectie: waar kom je uit als dit tempo doorzet.
//
// Stond midden in ClientDataColumn.jsx (ruim tweeduizend regels). Hier staat
// hij apart omdat hij op twee plekken thuishoort: in de gegevens-tab, en in de
// gewicht-kolom waar het besluit valt om bij te sturen. Eén component, geen
// twee schermen die allebei dezelfde velden schrijven.
//
// Gedrag is bij het verhuizen ongewijzigd gebleven.

import React, { useState, useRef } from 'react'
import { Check, X, Plus, RefreshCw, Save } from 'lucide-react'
import {
  applyMacroRules, computeMacros, calcBMR, surplusRuleFor, normalizeGoal,
} from '../../../macros/macroRules'
import { logClientChanges, pickTrackedFields } from '../../utils/clientChangeLogger'
import {
  C, CARDIO_TYPES, DEFAULT_KCAL_PER_SESSION, DEFAULT_LIFESTYLE, LIFESTYLE_LEVELS,
} from './insightTokens'

export default function MacroRulesBlock({ client, db, onClientUpdate, isMobile }) {
  const [busy, setBusy] = useState(null) // 'tdee' | 'macros' | null
  const [surplusDraft, setSurplusDraft] = useState(null)
  const [editingS, setEditingS] = useState(false)
  // Preview-state: berekende macros worden hier opgeslagen totdat de coach
  // ze expliciet bevestigt.
  const [pendingMacros, setPendingMacros] = useState(null)
  // Handmatig bijgestelde macro's. null = toon gewoon wat er op de klant staat.
  // Handmatige doel-kcal invoer: coach kan de berekende doel-kcal overschrijven,
  // waarna de macro's uit die kcal worden herberekend.
  const [editingKcal, setEditingKcal] = useState(false)
  // Inklapbare details — default ingeklapt zodra er iets is opgeslagen,
  // zodat coach één rustige samenvatting ziet ipv alle inputs.
  const [showTdeeDetail, setShowTdeeDetail] = useState(
    !Number.isFinite(parseFloat(client?.tdee))
  )
  const [tdeeOpslaan, setTdeeOpslaan] = useState(false)
  // Pas automatisch opslaan nadat de coach zélf iets heeft aangeraakt. Bij het
  // laden zet een effect namelijk `trainingDays` op de waarde uit het
  // workout-schema; zonder deze rem zou het openen van een klantkaart al een
  // schrijfactie en een logboekregel opleveren.
  const aangeraakt = useRef(false)
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
  // Het doel rekent met het onderhoud dat hierboven op het scherm staat, niet
  // met de waarde die ooit is opgeslagen. Die twee lopen uiteen zodra het
  // gewicht verandert: de BMR rekent mee, clients.tdee blijft staan tot iemand
  // een schuifje aanraakt. Dat gaf sommen als "2468 − 400 = 2594", waarin geen
  // van de drie getallen bij elkaar hoorde. Alleen als er niets te berekenen
  // valt (geen lengte, leeftijd of log) valt hij terug op de opgeslagen waarde.
  const tdeeForDoel = computedTdee ?? savedTdee
  const targetCal = tdeeForDoel != null ? tdeeForDoel + liveSurplus : null
  // Wijkt de opgeslagen waarde af, dan hoort de coach dat te kunnen zien.
  const tdeeWijktAf = savedTdee != null && computedTdee != null && savedTdee !== computedTdee

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

  // De TDEE wordt automatisch bewaard zodra de coach een factor aanpast; er
  // is geen knop meer voor. Zie het effect verderop voor het wanneer.
  const bewaarTdee = async () => {
    if (!db?.supabase || !client?.id || computedTdee == null) return
    setTdeeOpslaan(true)
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
    setTdeeOpslaan(false)
  }

  // Macro-bereken: NIET direct opslaan. Stop het resultaat in
  // `pendingMacros` zodat het naast de huidige waarden geprevieuwd kan
  // worden. Coach bevestigt expliciet via een aparte knop.
  // ── Automatisch opslaan van de TDEE ──────────────────────────────────
  // Wacht 800ms na de laatste wijziging, zodat typen in een getalveld niet
  // per toetsaanslag schrijft. Slaat alleen aan als de coach zelf iets heeft
  // aangeraakt (zie `aangeraakt`) én de uitkomst echt afwijkt van wat er staat.
  React.useEffect(() => {
    if (!aangeraakt.current) return
    if (computedTdee == null) return
    const t = setTimeout(() => { bewaarTdee() }, 800)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [computedTdee, lifestyleLevel, trainingDays, kcalPerSession, includeTraining,
      cardioActivities, includeCardio, includeLog, includeManual, manualTdee])

  const handleComputeMacros = () => {
    if (busy) return
    // Zelfde bron als de som op het scherm: anders bevestigt de coach macro's
    // die niet horen bij het doel dat hij ziet staan.
    const tdee = tdeeForDoel
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

  // Handmatige doel-kcal: coach typt zelf een kcal-doel in de "Doel kcal"-regel.
  // We berekenen de macro's uit die kcal (eiwit/vet op gewicht, koolhydraten
  // vullen de rest) en zetten ze in de pending-preview zodat de coach ze — net
  // als bij de gewone berekening — kan controleren en bevestigen.
  const applyManualKcal = (raw) => {
    const kcal = parseInt(raw)
    if (!Number.isFinite(kcal) || kcal <= 0) return
    if (kcal === targetCal) return // niks veranderd
    const m = computeMacros({ weight: effectiveWeight, tdee: kcal, surplus: 0 })
    if (!m) {
      alert('Kan macro\'s niet berekenen — geen gewicht bekend. Vul eerst het gewicht in bij Profiel.')
      return
    }
    // Afgeleid surplus/tekort t.o.v. de bekende TDEE (puur informatief).
    const impliedSurplus = tdeeForDoel != null ? kcal - tdeeForDoel : liveSurplus
    setPendingMacros({
      surplus: impliedSurplus,
      target_calories: kcal,
      target_protein: m.protein,
      target_carbs: m.carbs,
      target_fat: m.fat,
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

  // Het handmatig bijstellen van de vier macro's zat hier (met koolhydraten als
  // sluitpost en een vertraagde opslag). Dat doet MacroRingen nu, boven dit
  // paneel: zelfde rekenregel, maar met een wiel en één opslaan-knop in plaats
  // van vier velden die vanzelf wegschrijven.

  // ── Render helpers ────────────────────────────────────────────────────
  const row = (label, val, color = C.text) => (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: isMobile ? '0.35rem 0.75rem' : '0.4rem 1rem',
      borderBottom: `1px solid ${C.borderItem}`,
    }}>
      <span style={{ fontSize: '0.72rem', color: C.text20, letterSpacing: '-0.01em', fontWeight: 700 }}>{label}</span>
      <span style={{ fontSize: isMobile ? '0.65rem' : '0.7rem', fontWeight: 700, color }}>{val}</span>
    </div>
  )

  // Kaart-rij per factor. Twee regels:
  //   • bovenste regel: checkbox + naam | kcal-bijdrage (groot, gold/groen)
  //   • onderste regel: detail (input + suffix, of statushint)
  // Dit is fors leesbaarder dan alles op één smalle regel proppen.
  const factorCard = ({ label, checked, onCheck, detail, kcalText, kcalColor, dimmed, disabled, missingHint }) => (
    <div style={{
      padding: isMobile ? '0.5rem 0.75rem' : '0.55rem 1rem',
      borderTop: `1px solid ${C.borderItem}`,
      opacity: disabled ? 0.5 : 1,
    }}>
      {/* Alles op één regel: vinkje, naam, instelling, uitkomst. De instelling
          stond eerder als tweede regel eronder ingesprongen — dat is een halve
          extra regel per factor, vijf keer. Op telefoon zakt de instelling
          alsnog naar een eigen regel, want daar past het niet naast elkaar. */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <input
          type="checkbox" checked={checked} disabled={disabled}
          onChange={(e) => onCheck(e.target.checked)}
          style={{
            width: 15, height: 15, accentColor: '#fff',
            cursor: disabled ? 'not-allowed' : 'pointer', flexShrink: 0,
          }}
        />
        <span style={{
          flexShrink: 0,
          fontSize: '0.85rem', color: '#fff',
          fontWeight: 900, letterSpacing: '-0.01em',
        }}>
          {label}
        </span>

        {(detail || missingHint) && (
          <span style={{
            order: isMobile ? 4 : 0,
            flex: isMobile ? '1 1 100%' : '1 1 auto',
            minWidth: 0,
            marginLeft: isMobile ? 25 : 0,
            display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap',
            fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)',
          }}>
            {missingHint ? (
              <span style={{ color: '#f59e0b' }}>{missingHint}</span>
            ) : detail}
          </span>
        )}

        <span style={{
          marginLeft: 'auto', flexShrink: 0,
          fontSize: '0.92rem', fontWeight: 900,
          color: dimmed ? 'rgba(255,255,255,0.35)' : (kcalColor || '#fff'),
          letterSpacing: '-0.01em', whiteSpace: 'nowrap',
        }}>
          {kcalText}
        </span>
      </div>
    </div>
  )

  // Compacte ingebouwde select voor enum-keuzes (zoals lifestyle level).
  const inlineSelect = (val, onChange, options) => (
    <select
      value={val}
      onChange={(e) => onChange(e.target.value)}
      style={{
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: 6, color: '#fff',
        fontSize: '0.78rem', fontWeight: 800, fontFamily: 'inherit',
        padding: '0.2rem 0.35rem',
        cursor: 'pointer',
        maxWidth: 150,
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
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 6, color: '#fff',
          fontSize: '0.8rem', fontWeight: 800, fontFamily: 'inherit',
          padding: '0.22rem 0.4rem',
        }}
      />
      {suffix && (
        <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>
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
    <div
      // Elke aanraking binnen dit blok — vinkje, dropdown, invoerveld — geeft
      // de automatische opslag vrij. Eén plek in plaats van een vlag in alle
      // acht de setters.
      onPointerDownCapture={() => { aangeraakt.current = true }}
      onKeyDownCapture={() => { aangeraakt.current = true }}
      style={{
      background: 'rgba(255,255,255,0.025)',
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
          background: 'none',
          border: 'none', cursor: 'pointer',
          color: 'inherit', fontFamily: 'inherit',
        }}
      >
        <span style={{ fontSize: '0.95rem', color: '#fff', letterSpacing: '-0.02em', fontWeight: 900 }}>
          Onderhoud <span style={{ color: 'rgba(255,255,255,0.45)' }}>· {goal}</span>
        </span>
        <span style={{
          display: 'flex', alignItems: 'baseline', gap: 8,
        }}>
          {!showTdeeDetail && (
            <span style={{
              fontSize: '1.05rem', fontWeight: 900, color: '#fff',
              letterSpacing: '-0.02em',
            }}>
              {savedTdee != null ? `${savedTdee} kcal` : '—'}
            </span>
          )}
          <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', fontWeight: 800 }}>
            {showTdeeDetail ? 'Inklappen ▴' : 'Bewerken ▾'}
          </span>
        </span>
      </button>

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
              <span style={{ color: 'rgba(255,255,255,0.3)' }}>×</span>
              {inlineInput(kcalPerSession, (v) => setKcalPerSession(parseInt(v) || 0), 'kcal/sessie', 52)}
              {hasPlan && (
                synced ? (
                  <span style={{ fontSize: '0.78rem', color: C.green, fontWeight: 800 }}>
                    uit plan
                  </span>
                ) : (
                  <button
                    onClick={() => setTrainingDays(planTrainingDays)}
                    style={{
                      fontSize: '0.78rem', color: C.amber, fontWeight: 800,
                      background: 'none', border: 'none', padding: 0,
                      fontFamily: 'inherit', cursor: 'pointer',
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
        padding: isMobile ? '0.5rem 0.75rem' : '0.55rem 1rem',
        borderTop: `1px solid ${C.borderItem}`,
        opacity: !includeCardio ? 0.6 : 1,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input
            type="checkbox" checked={includeCardio}
            onChange={(e) => setIncludeCardio(e.target.checked)}
            style={{ width: 15, height: 15, accentColor: '#fff', cursor: 'pointer', flexShrink: 0 }}
          />
          <span style={{ flex: 1, fontSize: '0.85rem', color: '#fff', fontWeight: 900, letterSpacing: '-0.01em' }}>
            Cardio
          </span>
          <span style={{
            fontSize: '0.8rem', fontWeight: 800,
            color: includeCardio ? C.green : 'rgba(255,255,255,0.35)',
          }}>
            {includeCardio ? `+${cardioExtra} kcal` : '—'}
          </span>
        </div>

        {/* Activiteiten-lijst */}
        {cardioActivities.length > 0 && (
          <div style={{ marginTop: 6, marginLeft: 25, display: 'flex', flexDirection: 'column', gap: 6 }}>
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
                /* Type, duur, frequentie, uitkomst en verwijderen op één regel.
                   Zat als kaartje met rand in twee regels — vijf keer zoveel
                   hoogte als de informatie rechtvaardigt. */
                <div key={idx} style={{
                  display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap',
                  fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)',
                }}>
                  <select
                    value={act.type}
                    onChange={(e) => update({ type: e.target.value })}
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: 6,
                      color: '#fff', fontWeight: 800, fontFamily: 'inherit',
                      fontSize: '0.78rem',
                      cursor: 'pointer', minWidth: 0, maxWidth: 130,
                      padding: '0.22rem 0.35rem',
                    }}
                  >
                    {Object.entries(CARDIO_TYPES).map(([value, { label }]) => (
                      <option key={value} value={value} style={{ background: '#0a0a0a' }}>{label}</option>
                    ))}
                  </select>

                  {inlineInput(min, (v) => update({ min: parseInt(v) || 0 }), 'min', 46)}
                  <span style={{ color: 'rgba(255,255,255,0.3)' }}>×</span>
                  {inlineInput(sessions, (v) => update({ sessions: parseInt(v) || 0 }), '/wk', 40)}

                  <span style={{
                    marginLeft: 'auto', flexShrink: 0,
                    fontSize: '0.82rem', color: C.green, fontWeight: 900,
                    whiteSpace: 'nowrap',
                  }}>
                    {kcalPerWeek} kcal
                  </span>
                  <button
                    onClick={remove}
                    title="Verwijder"
                    style={{
                      flexShrink: 0, width: 22, height: 22, padding: 0,
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      background: 'none', border: 'none',
                      color: 'rgba(255,255,255,0.4)', cursor: 'pointer',
                    }}
                  >
                    <X size={13} />
                  </button>
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
            marginTop: 8, marginLeft: 25,
            display: 'flex', alignItems: 'center', gap: 5,
            padding: 0,
            background: 'none', border: 'none',
            color: '#fff', fontFamily: 'inherit',
            fontSize: '0.82rem', fontWeight: 900,
            cursor: 'pointer', minHeight: 26,
          }}
        >
          <Plus size={11} strokeWidth={3} />
          Cardio toevoegen
        </button>

        {/* Totaal preview onder de lijst */}
        {includeCardio && cardioKcalPerWeek > 0 && (
          <div style={{
            marginTop: 7, marginLeft: 25,
            fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)',
          }}>
            {cardioKcalPerWeek} kcal/wk · ÷ 7 = {cardioExtra} kcal/dag
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
            <span style={{ color: 'rgba(255,255,255,0.3)' }}>·</span>
            <span>Ø {logEstimate.avgKcal} kcal/d</span>
            <span style={{ color: 'rgba(255,255,255,0.3)' }}>·</span>
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
            <span style={{ color: includeManual ? C.amber : 'rgba(255,255,255,0.5)', fontWeight: 700 }}>
              {includeManual ? 'wint van alles' : 'gebruik als je TDEE al kent'}
            </span>
          </>
        ),
        kcalText: includeManual && manualTdee > 0 ? `= ${manualTdee} kcal` : '—',
        kcalColor: C.amber,
        dimmed: !includeManual,
      })}

      {/* ── De hele rekensom op één regel ──────────────────────────────
          Dit waren vier blokken onder elkaar: de berekende TDEE, een regel
          met de opgeslagen waarde, een uitklapkop "Macro's", en daarin nog
          eens twee regels voor het tekort en het doel. Terwijl het één som
          is: onderhoud plus of min het tekort geeft het doel. */}
      <div style={{
        padding: isMobile ? '0.7rem 0.75rem' : '0.8rem 1rem',
        borderTop: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.01em' }}>
          Onderhoud
        </span>
        <span
          title={tdeeOpslaan
            ? 'Opslaan…'
            : tdeeWijktAf
              ? `Berekend uit de onderdelen hierboven. Opgeslagen staat nog ${savedTdee} kcal; die wordt bijgewerkt zodra je hierboven iets aanpast.`
              : savedTdee != null ? `Opgeslagen: ${savedTdee} kcal` : 'Nog niet opgeslagen'}
          style={{
            fontSize: '1.15rem', fontWeight: 900, letterSpacing: '-0.02em',
            color: computedTdee != null ? '#fff' : 'rgba(255,255,255,0.35)',
            opacity: tdeeOpslaan ? 0.5 : 1, transition: 'opacity 0.2s ease',
          }}>
          {computedTdee != null ? computedTdee : '—'}
        </span>

        {/* Tekort of surplus — klik om te wijzigen. */}
        {editingS ? (
          <input
            autoFocus type="number"
            value={surplusDraft ?? (client?.surplus ?? '')}
            onChange={(e) => setSurplusDraft(e.target.value)}
            onBlur={() => {
              // Geen clamping: wat de coach intypt wordt bewaard, ook buiten
              // de aanbevolen range. Die staat alleen als hint in de tooltip.
              if (surplusDraft != null && surplusDraft !== '') {
                const val = parseInt(surplusDraft) || 0
                saveField('surplus', val)
                setSurplusDraft(String(val))
              }
              setEditingS(false)
            }}
            onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur() }}
            style={{
              width: 80, textAlign: 'center',
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 6, color: '#fff', fontSize: '1.05rem', fontWeight: 900,
              fontFamily: 'inherit', padding: '0.1rem 0.3rem',
            }}
          />
        ) : (
          <span
            onClick={() => setEditingS(true)}
            title={`Tekort / surplus — aanbevolen ${rule.min === rule.max ? '0' : `${rule.min} t/m ${rule.max}`}`}
            style={{
              fontSize: '1.15rem', fontWeight: 900, cursor: 'pointer', letterSpacing: '-0.02em',
              color: liveSurplus < 0 ? C.red : liveSurplus > 0 ? C.green : 'rgba(255,255,255,0.5)',
            }}>
            {liveSurplus > 0 ? '+' : liveSurplus < 0 ? '−' : '±'}{Math.abs(liveSurplus)}
          </span>
        )}

        <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)' }}>=</span>

        {/* Doel kcal — klik om zelf een waarde te zetten. */}
        {editingKcal ? (
          <input
            type="number" autoFocus
            defaultValue={targetCal ?? ''}
            onClick={(e) => e.target.select()}
            onBlur={(e) => { setEditingKcal(false); applyManualKcal(e.target.value) }}
            onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur() }}
            style={{
              width: 95, textAlign: 'center',
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 6, color: '#fff', fontSize: '1.05rem', fontWeight: 900,
              fontFamily: 'inherit', padding: '0.1rem 0.3rem',
            }}
          />
        ) : (
          <span
            onClick={() => setEditingKcal(true)}
            title="Klik om zelf een doel-kcal in te voeren"
            style={{
              fontSize: '1.3rem', fontWeight: 900, color: '#fff',
              letterSpacing: '-0.02em', cursor: 'pointer',
            }}>
            {targetCal != null ? targetCal : '—'}
          </span>
        )}
        <span style={{ fontSize: '0.85rem', fontWeight: 900, color: 'rgba(255,255,255,0.5)', letterSpacing: '-0.01em' }}>
          doel kcal
        </span>
      </div>


      {/* Zelfde volgorde als bij onderhoud: eerst instellen, dan pas de knop.
          Stond boven het tekort-veld, dus je stelde iets in en moest terug
          omhoog om het te laten doorrekenen. */}
      <div style={{ padding: isMobile ? '0.5rem 0.75rem 0.7rem' : '0.6rem 1rem 0.8rem' }}>
        <button
          onClick={handleComputeMacros}
          disabled={busy != null}
          style={{
            width: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '0.55rem 0.9rem',
            background: '#fff', border: 'none', borderRadius: 8,
            color: '#0a0a0a',
            fontSize: '0.85rem', fontWeight: 900, fontFamily: 'inherit',
            cursor: busy ? 'wait' : 'pointer', minHeight: 38,
            opacity: busy != null ? 0.6 : 1,
          }}
        >
          <RefreshCw size={14} strokeWidth={2.6} />
          {busy === 'macros' ? 'Bezig…' : "Bereken macro's"}
        </button>
      </div>

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
            background: 'rgba(255,255,255,0.07)',
          }}>
            <div style={{
              fontSize: '0.72rem', color: C.gold, fontWeight: 800,
              letterSpacing: '-0.01em',
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
                      fontSize: '0.72rem', color: C.text25, fontWeight: 700,
                      letterSpacing: '-0.01em',
                    }}>{m.label}</div>
                    <div style={{
                      fontSize: '0.72rem', color: C.text25, fontWeight: 600,
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
                        fontSize: '0.72rem',
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
              fontSize: '0.72rem',
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
                  fontSize: '0.72rem', fontWeight: 700,
                  cursor: busy ? 'wait' : 'pointer',
                  letterSpacing: '-0.01em',
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
                  background: 'linear-gradient(135deg, #fff 0%, #D4AF37 100%)',
                  border: 'none',
                  borderRadius: 6,
                  color: '#000',
                  fontSize: '0.72rem', fontWeight: 800,
                  cursor: busy ? 'wait' : 'pointer',
                  letterSpacing: '-0.01em',
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

      {/* Hier stonden vier invulvakken met kcal, eiwit, koolhydraten en vet.
          Die staan nu als ringen boven dit paneel (MacroRingen), met een wiel
          en één opslaan-knop. Twee plekken die dezelfde vier velden schrijven
          is vragen om een klant die op twee verschillende macro's zit. */}

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
  // Zonder doelgewicht en einddatum valt er niets te projecteren. Dan stond
  // hier een kop met drie streepjes en de regel 'vul gewicht, doelgewicht en
  // deadline in' — een half paneel dat alleen maar ruimte kost in een kolom
  // waar je juist snel wil kunnen kijken.
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
  // Valt er niets te projecteren, dan ook geen paneel. Zie de uitleg boven.
  if (!hasAll) return null

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
        fontSize: '0.72rem', color: C.gold,
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
          fontSize: '0.72rem', color: C.text25, fontStyle: 'italic',
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
              fontSize: '0.72rem', color: C.text25, fontWeight: 700,
              letterSpacing: '-0.01em',
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
                fontSize: '0.72rem', color: C.text50, fontWeight: 600,
              }}>
                eind {fmtDate(deadline)}
              </span>
              {deltaToGoal != null && deltaToGoal !== 0 && (
                <span style={{
                  marginLeft: 'auto',
                  fontSize: '0.72rem', fontWeight: 700, color: trackColor,
                }}>
                  {deltaToGoal > 0 ? `${deltaToGoal} kg boven doel` : `${Math.abs(deltaToGoal)} kg onder doel`}
                </span>
              )}
              {deltaToGoal === 0 && (
                <span style={{
                  marginLeft: 'auto',
                  fontSize: '0.72rem', fontWeight: 800, color: C.green,
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
                fontSize: '0.72rem', color: C.text25, fontWeight: 700,
                letterSpacing: '-0.01em',
              }}>
                Voor exact doel
              </span>
              <span style={{
                marginLeft: 'auto',
                fontSize: '0.75rem', fontWeight: 800,
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
