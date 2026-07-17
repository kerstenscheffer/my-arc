// src/modules/public-intake/PublicIntakePage.jsx
import React, { useState, useEffect, useRef } from 'react'
import IntakePhase1 from './components/IntakePhase1'
import IntakePhase3 from './components/IntakePhase3'
import DatabaseService from '../../services/DatabaseService'
import { findClient, updateClient } from '../../lib/publicIntakeApi'

const supabase = DatabaseService.supabase

const isMobileCheck = () => window.innerWidth <= 768

const GOAL_LABELS = {
  fat_loss: 'Vetverlies', muscle_gain: 'Spieropbouw',
  recomp: 'Recomp', general_fitness: 'Fitter worden'
}

// ── Foutmeldingen met uitleg ──────────────────────────────────────────────────

const ERROR_TYPES = {
  EMAIL_NOT_FOUND: {
    title: 'E-mailadres niet gevonden',
    lines: [
      'Gebruik het e-mailadres waarmee je coach je heeft aangemeld.',
      'Let op: geen hoofdletters, geen spaties voor of na het adres.',
      'Voorbeeld: jan.dejong@gmail.com — niet Jan.DeJong@gmail.com',
    ],
    action: 'Controleer je e-mail van je coach en probeer opnieuw.'
  },
  SAVE_FAILED: {
    title: 'Opslaan mislukt',
    lines: [
      'Er ging iets mis bij het opslaan van je gegevens.',
      'Dit komt meestal door een tijdelijk verbindingsprobleem.',
    ],
    action: 'Wacht 10 seconden en probeer opnieuw. Werkt het nog niet? Neem contact op met je coach.'
  },
  NO_EMAIL: {
    title: 'E-mailadres kwijt',
    lines: [
      'We kunnen je e-mailadres niet meer vinden.',
      'Dit kan gebeuren als je de browser hebt gesloten en opnieuw bent begonnen.',
    ],
    action: 'Ga terug naar stap 1 en vul je gegevens opnieuw in.'
  },
  CLIENT_NOT_FOUND: {
    title: 'Account niet gevonden',
    lines: [
      'Er is geen account gevonden voor dit e-mailadres.',
      'Je coach moet eerst een account voor je aanmaken.',
    ],
    action: 'Neem contact op met je coach en vraag of je account al klaarstaat.'
  },
  NETWORK: {
    title: 'Geen verbinding',
    lines: [
      'Het lijkt erop dat je geen internetverbinding hebt.',
    ],
    action: 'Controleer je wifi of mobiele data en probeer opnieuw.'
  },
  UNKNOWN: {
    title: 'Er ging iets mis',
    lines: [
      'Er is een onverwachte fout opgetreden.',
    ],
    action: 'Probeer de pagina te verversen. Blijft het fout gaan? Neem contact op met je coach.'
  }
}

function ErrorHelper({ type, isMobile, onDismiss, onRetry }) {
  const err = ERROR_TYPES[type] || ERROR_TYPES.UNKNOWN
  return (
    <div style={{
      margin: isMobile ? '0.75rem 1rem' : '0.75rem 1.25rem',
      background: 'rgba(220,38,38,0.04)',
      border: '1px solid rgba(220,38,38,0.15)',
      borderLeft: '3px solid #dc2626',
      borderRadius: '0 8px 8px 0',
      overflow: 'hidden'
    }}>
      {/* Titel */}
      <div style={{
        padding: isMobile ? '0.6rem 0.75rem 0.4rem' : '0.65rem 0.85rem 0.4rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: '0.48rem', fontWeight: 900, color: '#dc2626', lineHeight: 1 }}>!</span>
          </div>
          <span style={{ fontSize: isMobile ? '0.72rem' : '0.75rem', fontWeight: 800, color: '#dc2626' }}>
            {err.title}
          </span>
        </div>
        {onDismiss && (
          <button onClick={onDismiss} style={{ background: 'transparent', border: 'none', color: 'rgba(220,38,38,0.4)', fontSize: '0.75rem', cursor: 'pointer', padding: '0', lineHeight: 1, fontFamily: 'inherit', touchAction: 'manipulation' }}>✕</button>
        )}
      </div>

      {/* Uitleg */}
      <div style={{ padding: isMobile ? '0 0.75rem 0.5rem' : '0 0.85rem 0.5rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
        {err.lines.map((line, i) => (
          <div key={i} style={{ display: 'flex', gap: '0.4rem', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.45rem', color: 'rgba(220,38,38,0.5)', marginTop: '0.15rem', flexShrink: 0 }}>→</span>
            <span style={{ fontSize: isMobile ? '0.65rem' : '0.68rem', color: 'rgba(255,255,255,0.45)', fontWeight: 500, lineHeight: 1.5 }}>{line}</span>
          </div>
        ))}
      </div>

      {/* Actie */}
      <div style={{
        padding: isMobile ? '0.4rem 0.75rem 0.6rem' : '0.4rem 0.85rem 0.65rem',
        borderTop: '1px solid rgba(220,38,38,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem'
      }}>
        <span style={{ fontSize: isMobile ? '0.6rem' : '0.62rem', color: 'rgba(255,255,255,0.25)', fontWeight: 500, lineHeight: 1.5, flex: 1 }}>
          {err.action}
        </span>
        {onRetry && (
          <button onClick={onRetry} style={{
            padding: '0.3rem 0.75rem', flexShrink: 0,
            background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)',
            borderRadius: '6px', color: '#dc2626',
            fontSize: '0.6rem', fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
          }}>
            Opnieuw proberen
          </button>
        )}
      </div>
    </div>
  )
}

// ── Fout detectie helper ──────────────────────────────────────────────────────

function detectErrorType(e) {
  if (!e) return 'UNKNOWN'
  const msg = (e.message || e.toString()).toLowerCase()
  if (msg.includes('fetch') || msg.includes('network') || msg.includes('offline')) return 'NETWORK'
  return 'UNKNOWN'
}

// ── Motivatie reminder strip ──────────────────────────────────────────────────

function MotivationReminder({ personalData, isMobile }) {
  if (!personalData?.primary_goal && !personalData?.motivation) return null
  return (
    <div style={{
      borderBottom: '1px solid rgba(255,215,0,0.06)',
      padding: isMobile ? '0.6rem 1rem' : '0.7rem 1.25rem',
      display: 'flex', gap: '0.75rem', alignItems: 'flex-start'
    }}>
      <div style={{ width: '2px', background: 'rgba(255,215,0,0.35)', borderRadius: '2px', alignSelf: 'stretch', flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        {personalData.primary_goal && (
          <div style={{ fontSize: '0.42rem', fontWeight: 800, color: 'rgba(255,215,0,0.5)', letterSpacing: '0.08em', marginBottom: '0.15rem' }}>
            {GOAL_LABELS[personalData.primary_goal] || personalData.primary_goal}
            {personalData.target_weight ? ` · ${personalData.target_weight} kg` : ''}
          </div>
        )}
        {personalData.motivation ? (
          <div style={{ fontSize: isMobile ? '0.62rem' : '0.65rem', color: 'rgba(255,255,255,0.35)', fontWeight: 500, lineHeight: 1.5, fontStyle: 'italic', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            "{personalData.motivation}"
          </div>
        ) : personalData.first_name ? (
          <div style={{ fontSize: isMobile ? '0.62rem' : '0.65rem', color: 'rgba(255,255,255,0.25)', fontWeight: 500 }}>
            Goed bezig, {personalData.first_name}.
          </div>
        ) : null}
      </div>
    </div>
  )
}

// ── Training-antwoorden → user_workout_preferences payload ───────────────────
// Zet elk veld om naar het TYPE dat de kolom verwacht. Dit fixt de stille
// upsert-fout: bv. `avoided_exercises` is een TEXT-kolom maar het formulier
// leverde een array → de hele upsert faalde zonder error-check, waardoor alle
// training-data verloren ging.
function buildWorkoutPrefs(data = {}, personalData = {}) {
  const toInt = (v) => { const n = parseInt(v, 10); return Number.isFinite(n) ? n : null }
  const toText = (v) => {
    if (v == null) return null
    if (Array.isArray(v)) { const s = v.filter(Boolean).join(', '); return s || null }
    const s = String(v).trim(); return s || null
  }
  const toArr = (v) => Array.isArray(v) ? v.filter(Boolean) : (v ? [v] : [])

  // avoided_exercises kan een array (pills, evt. al samengevoegd) of los tekst
  // veld zijn → altijd platslaan tot één tekst.
  const avoidedParts = Array.isArray(data.avoided_exercises)
    ? data.avoided_exercises
    : [
        ...(Array.isArray(data.avoided_exercises_pills) ? data.avoided_exercises_pills : []),
        ...(data.avoided_exercises ? [data.avoided_exercises] : []),
      ]

  return {
    default_experience_level: toText(data.experience_level),
    default_days_per_week: toInt(data.days_per_week ?? personalData?.preferred_training_days?.length),
    default_time_per_session: toInt(data.time_per_session),
    default_equipment: toArr(data.equipment),              // text[]
    default_primary_goal: toText(personalData?.primary_goal),
    training_time: (data.training_time || personalData?.training_time || null) || null, // time HH:MM
    split_preferences: { preferred: data.split_preference || null, focus: data.training_focus || null }, // jsonb
    emphasize_stretch: data.emphasize_stretch ?? false,
    prioritize_compounds: data.prioritize_compounds ?? false,
    cardio_interest: toText(data.cardio_interest),
    cardio_types: toArr(data.cardio_types),                // jsonb array
    cardio_frequency: toInt(data.cardio_frequency),
    cardio_duration: toInt(data.cardio_duration),
    gym_name: toText(data.gym_name),
    injuries: toText(data.injuries),
    avoided_exercises: toText(avoidedParts),                // TEXT — was de crash
    other_limitations: toText(data.other_limitations),
    does_cardio: toText(data.does_cardio),
    training_location: toText(data.training_location),
    training_willingness: toText(data.training_willingness),
    no_training_reason: toText(data.no_training_reason),
  }
}

// ── Hoofd component ───────────────────────────────────────────────────────────

export default function PublicIntakePage() {
  const [isMobile, setIsMobile] = useState(isMobileCheck())

  const initialPhase = (() => {
    try {
      const p = parseInt(new URLSearchParams(window.location.search).get('phase'))
      return p >= 0 && p <= 4 ? p : 0
    } catch { return 0 }
  })()

  const [phase, setPhase] = useState(initialPhase)
  const [personalData, setPersonalData] = useState({})
  const [workoutData, setWorkoutData] = useState({})
  const [saving, setSaving]     = useState(false)
  const [errorType, setErrorType] = useState(null)
  const [intakeId, setIntakeId]   = useState(null)

  useEffect(() => {
    const h = () => setIsMobile(isMobileCheck())
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])

  // ── Auto-save ──
  useEffect(() => {
    if (!personalData?.email || phase !== 1) return
    const t = setTimeout(async () => {
      try {
        const existing = await findClient(personalData.email)
        if (!existing) return
        const age = personalData.date_of_birth ? Math.floor((Date.now() - new Date(personalData.date_of_birth)) / 31557600000) : personalData.age || null
        await updateClient(existing.id, {
          first_name: personalData.first_name || null, last_name: personalData.last_name || null,
          phone: personalData.phone || null, gender: personalData.gender || null,
          date_of_birth: personalData.date_of_birth || null, age,
          height: personalData.height ? parseInt(personalData.height) : null,
          current_weight: personalData.current_weight ? parseFloat(personalData.current_weight) : null,
          target_weight: personalData.target_weight ? parseFloat(personalData.target_weight) : null,
          primary_goal: personalData.primary_goal || null,
          motivation: personalData.motivation || null,
          activity_level: personalData.activity_level || null,
          sleep_hours: personalData.sleep_hours ? parseFloat(personalData.sleep_hours) : null,
          stress_level: personalData.stress_level ? parseFloat(personalData.stress_level) : null,
          coaching_style_pref: personalData.coaching_style_pref || null,
          biggest_obstacle: personalData.biggest_obstacle || null,
          coaching_expectations: personalData.coaching_expectations || null,
          wat_werkte_eerder: personalData.wat_werkte_eerder || null,
          waarom_gestopt: personalData.waarom_gestopt || null,
        })
      } catch(e) { console.error('Auto-save failed:', e) }
    }, 800)
    return () => clearTimeout(t)
  }, [personalData, phase])

  // ══════════ DIRECT OPSLAAN + HERVATTEN VIA EMAIL ══════════
  // Elk antwoord wordt meteen bewaard (lokaal + server-concept per email), zodat
  // niemand z'n antwoorden kwijtraakt als 'ie halverwege stopt. Bij terugkomst +
  // email-invoer worden de eerdere antwoorden hersteld.
  const DRAFT_LS_KEY = 'myarc_intake_draft'
  const resumedRef = useRef(new Set())
  const [draftRestored, setDraftRestored] = useState(false)

  // 1) Herstel direct van dit apparaat (localStorage) bij binnenkomst.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_LS_KEY)
      if (!raw) return
      const d = JSON.parse(raw)
      if (d.personalData && Object.keys(d.personalData).length) setPersonalData(d.personalData)
      if (d.workoutData && Object.keys(d.workoutData).length) setWorkoutData(d.workoutData)
      const urlPhase = new URLSearchParams(window.location.search).get('phase')
      if (!urlPhase && typeof d.phase === 'number' && d.phase > 0) { setPhase(d.phase); setDraftRestored(true) }
    } catch {}
  }, [])

  // 2) Sla elke wijziging DIRECT op — lokaal (instant) + server-concept (per email, debounced).
  useEffect(() => {
    const hasAny = Object.keys(personalData || {}).length || Object.keys(workoutData || {}).length
    if (!hasAny) return
    try { localStorage.setItem(DRAFT_LS_KEY, JSON.stringify({ personalData, workoutData, phase })) } catch {}
    const email = (personalData?.email || '').trim().toLowerCase()
    if (!email.includes('@')) return
    const t = setTimeout(() => {
      supabase.rpc('save_intake_draft', { p_email: email, p_data: { personalData, workoutData }, p_phase: phase })
        .then(({ error }) => { if (error) console.warn('Draft opslaan mislukt:', error) })
    }, 700)
    return () => clearTimeout(t)
  }, [personalData, workoutData, phase])

  // 3) Hervat via email: zodra een geldig email herkend wordt, haal server-concept op
  //    en vul lege velden aan (overschrijft niet wat de bezoeker nu typt).
  useEffect(() => {
    const email = (personalData?.email || '').trim().toLowerCase()
    if (!email.includes('@') || resumedRef.current.has(email)) return
    resumedRef.current.add(email)
    supabase.rpc('get_intake_draft', { p_email: email }).then(({ data, error }) => {
      if (error || !Array.isArray(data) || !data.length) return
      const row = data[0]
      const srvP = row?.data?.personalData || {}
      const srvW = row?.data?.workoutData || {}
      if (!Object.keys(srvP).length && !Object.keys(srvW).length) return
      setPersonalData(prev => ({ ...srvP, ...prev }))
      setWorkoutData(prev => ({ ...srvW, ...prev }))
      if (typeof row.phase === 'number' && row.phase > phase) setPhase(row.phase)
      setDraftRestored(true)
    })
  }, [personalData?.email])

  // Herstel-melding automatisch verbergen na een paar seconden.
  useEffect(() => {
    if (!draftRestored) return
    const t = setTimeout(() => setDraftRestored(false), 6000)
    return () => clearTimeout(t)
  }, [draftRestored])

  // ── Phase 1 complete ──
  const handlePhase1Complete = async (data) => {
    setPersonalData(data)
    setSaving(true)
    setErrorType(null)
    console.log('🚀 handlePhase1Complete gestart voor:', data.email)
    console.log('📦 Data ontvangen:', {
      first_name: data.first_name,
      email: data.email,
      primary_goal: data.primary_goal,
      motivation: data.motivation,
      activity_level: data.activity_level,
      cooking_time: data.cooking_time,
      preferred_training_days: data.preferred_training_days,
      coaching_style_pref: data.coaching_style_pref,
      coaching_expectations: data.coaching_expectations,
      tdee: data.tdee,
      target_calories: data.target_calories,
    })
    try {
      let existingClient = null
      try {
        existingClient = await findClient(data.email)
      } catch (lookupError) { console.error('❌ Lookup error:', lookupError); setErrorType('SAVE_FAILED'); setSaving(false); return }
      if (!existingClient) { console.warn('⚠️ Email niet gevonden:', data.email); setErrorType('EMAIL_NOT_FOUND'); setSaving(false); return }

      const clientId = existingClient.id
      console.log('✅ Client gevonden, id:', clientId, '— nu opslaan...')

      let updateError = null
      try { await updateClient(clientId, {
        first_name: data.first_name, last_name: data.last_name,
        phone: data.phone, gender: data.gender,
        date_of_birth: data.date_of_birth || null, age: data.age || null,
        height: data.height ? parseInt(data.height) : null,
        current_weight: data.current_weight ? parseFloat(data.current_weight) : null,
        start_weight: data.current_weight ? parseFloat(data.current_weight) : null,
        target_weight: data.target_weight ? parseFloat(data.target_weight) : null,
        goal_weight: data.target_weight ? parseFloat(data.target_weight) : null,
        primary_goal: data.primary_goal || null, goal: data.primary_goal || null,
        goal_urgency: data.goal_urgency ? String(data.goal_urgency) : null,
        goal_deadline: data.goal_deadline_date || null,
        goal_timeline: data.goal_timeline || null,
        motivation: data.motivation || null,
        current_body_fat: data.current_body_fat ? parseFloat(data.current_body_fat) : null,
        current_body_fat_2: data.current_body_fat_2 ? parseFloat(data.current_body_fat_2) : null,
        target_body_fat: data.target_body_fat ? parseFloat(data.target_body_fat) : null,
        activity_level: data.activity_level || null,
        work_schedule: data.week_schedule || null,
        cooking_time: data.cooking_time ? ({ minimal: 20, low: 30, moderate: 60, high: 90 }[data.cooking_time] || null) : null,
        preferred_training_days: data.preferred_training_days || null,
        sleep_hours: data.sleep_hours ? parseFloat(data.sleep_hours) : null,
        stress_level: data.stress_level ? String(data.stress_level) : null,
        medical_conditions: data.medical_conditions || null,
        coaching_style_pref: data.coaching_style_pref || null,
        previous_coaching: data.previous_coaching || null,
        biggest_obstacle: data.biggest_obstacle || null,
        coaching_expectations: data.coaching_expectations || null,
        coaching_goals_extra: data.coaching_goals_extra || null,
        wat_werkte_eerder: data.wat_werkte_eerder || null,
        waarom_gestopt: data.waarom_gestopt || null,
        muscle_goal_type: data.muscle_goal_type || null,
        muscle_focus_tags: data.muscle_focus_tags || null,
        lichaam_omschrijving: data.lichaam_omschrijving || null,
        fitness_doel_tags: data.fitness_doel_tags || null,
        has_weight_goal: data.has_weight_goal ?? null,
        coaching_goal_tags: data.coaching_goal_tags || null,
        tdee: data.tdee || null, target_calories: data.target_calories || null,
        calorie_target: data.target_calories || null,
        target_protein: data.target_protein || null,
        target_carbs: data.target_carbs || null, target_fat: data.target_fat || null,
        intake_completed: true, intake_completed_at: new Date().toISOString()
      }) } catch (e) { updateError = e }

      if (updateError) {
        console.error('❌ Update mislukt:', updateError)
        setErrorType('SAVE_FAILED'); setSaving(false); return
      }

      // training_time direct opslaan in user_workout_preferences (niet-blokkerend)
      if (data.training_time) {
        const userId = existingClient.auth_user_id || clientId
        try {
          await supabase.from('user_workout_preferences').upsert({
            user_id: userId,
            training_time: data.training_time,
            default_days_per_week: data.preferred_training_days?.length || null,
          }, { onConflict: 'user_id' })
          console.log('✅ training_time opgeslagen:', data.training_time)
        } catch (e) {
          console.warn('⚠️ training_time opslaan mislukt (niet-blokkerend):', e)
        }
      }

      console.log('✅ Opgeslagen! Naar phase 2...')
      setIntakeId(clientId)
      setPhase(2)
    } catch(e) { console.error('❌ Save exception:', e); setErrorType(detectErrorType(e) === 'NETWORK' ? 'NETWORK' : 'SAVE_FAILED') }
    setSaving(false)
  }

  // ── Training opslaan (gedeeld: autosave + afronden) ──
  // Schrijft naar user_workout_preferences (rijke data) ÉN spiegelt de kern
  // naar clients (waar de coach-modal 'm ook uit kan lezen). CHECKT nu de
  // upsert-error, zodat een mislukking niet meer stil verdwijnt.
  const persistWorkout = async (dataArg, { completed = false } = {}) => {
    const email = personalData.email || (() => { try { return localStorage.getItem('myarc_intake_email') } catch { return null } })()
    if (!email) return { ok: false, reason: 'NO_EMAIL' }
    const client = await findClient(email)
    if (!client) return { ok: false, reason: 'CLIENT_NOT_FOUND' }

    const prefs = buildWorkoutPrefs(dataArg, personalData)
    const payload = { user_id: client.auth_user_id || client.id, ...prefs }
    if (completed) { payload.workout_completed = true; payload.workout_completed_at = new Date().toISOString() }

    const { error } = await supabase
      .from('user_workout_preferences')
      .upsert(payload, { onConflict: 'user_id' })
    if (error) { console.error('❌ user_workout_preferences upsert:', error); return { ok: false, reason: 'SAVE_FAILED', error } }

    // Spiegel de kernvelden naar clients (fallback-bron voor de coach-modal).
    try {
      await updateClient(client.id, {
        training_experience: prefs.default_experience_level,
        workout_days_per_week: prefs.default_days_per_week,
        training_days: prefs.default_days_per_week,
        training_time: prefs.training_time,
        gym_name: prefs.gym_name,
        injuries: prefs.injuries,
      })
    } catch (e) { console.warn('clients spiegel-write mislukt (niet-blokkerend):', e?.message) }

    return { ok: true }
  }

  // Directe autosave van fase 3: elk training-antwoord wordt meteen bewaard
  // (debounced), niet pas bij afronden. Zo raakt niemand z'n antwoorden kwijt.
  useEffect(() => {
    if (phase !== 3) return
    const email = (personalData?.email || '').trim()
    if (!email.includes('@')) return
    if (!Object.keys(workoutData || {}).length) return
    const t = setTimeout(() => { persistWorkout(workoutData, { completed: false }) }, 900)
    return () => clearTimeout(t)
  }, [workoutData, phase])

  // ── Phase 3 complete ──
  const handlePhase3Complete = async (data) => {
    setWorkoutData(data)
    setSaving(true)
    setErrorType(null)
    try {
      const res = await persistWorkout(data, { completed: true })
      if (!res.ok) {
        setErrorType(res.reason === 'NO_EMAIL' ? 'NO_EMAIL'
          : res.reason === 'CLIENT_NOT_FOUND' ? 'CLIENT_NOT_FOUND'
          : (res.error && detectErrorType(res.error) === 'NETWORK') ? 'NETWORK'
          : 'SAVE_FAILED')
        setSaving(false); return
      }
      setPhase(4)
      try { localStorage.removeItem('myarc_intake_email') } catch {}
    } catch(e) { console.error('Save workout failed:', e); setErrorType(detectErrorType(e) === 'NETWORK' ? 'NETWORK' : 'SAVE_FAILED') }
    setSaving(false)
  }

  const phases = [
    { id: 'video',     label: 'INTRO' },
    { id: 'personal',  label: 'GEGEVENS' },
    { id: 'nutrition', label: 'VOEDING' },
    { id: 'workout',   label: 'TRAINING' },
    { id: 'done',      label: 'KLAAR' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#000' }}>

      {/* Herstel-melding: eerdere antwoorden teruggezet. */}
      {draftRestored && (
        <div style={{
          position: 'fixed', top: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 9999,
          display: 'flex', alignItems: 'center', gap: '0.5rem', maxWidth: '92vw',
          background: '#10b981', color: '#fff', padding: '0.55rem 0.9rem', borderRadius: 10,
          fontSize: '0.8rem', fontWeight: 700, boxShadow: '0 6px 20px rgba(0,0,0,0.4)',
        }}>
          <span>✓ Je eerdere antwoorden zijn hersteld — je gaat verder waar je gebleven was.</span>
          <button onClick={() => setDraftRestored(false)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 900, fontSize: '1rem', lineHeight: 1, flexShrink: 0 }}>×</button>
        </div>
      )}

      {/* ── Header ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: '#000', borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: isMobile ? '0.7rem 1rem' : '0.8rem 1.5rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ fontSize: isMobile ? '0.75rem' : '0.8rem', fontWeight: 900, color: '#FFD700', letterSpacing: '0.12em' }}>MY ARC</div>
        <div style={{ fontSize: '0.48rem', fontWeight: 700, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Intake Formulier</div>
      </div>

      {/* ── Tabs ── */}
      <div style={{
        position: 'sticky', top: isMobile ? '41px' : '49px', zIndex: 40,
        background: '#000', borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex'
      }}>
        {phases.map((p, i) => {
          const isActive    = phase === i
          const isCompleted = phase > i
          return (
            <div key={p.id} style={{
              flex: 1, padding: isMobile ? '0.55rem 0' : '0.6rem 0',
              textAlign: 'center', position: 'relative',
              cursor: 'default'
            }}>
              <div style={{
                fontSize: isMobile ? '0.42rem' : '0.45rem',
                fontWeight: isActive ? 800 : 600,
                color: isActive ? '#FFD700' : isCompleted ? 'rgba(255,215,0,0.4)' : 'rgba(255,255,255,0.18)',
                textTransform: 'uppercase', letterSpacing: '0.07em',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.2rem'
              }}>
                {isCompleted && <span style={{ fontSize: '0.4rem' }}>✓</span>}
                {p.label}
              </div>
              {isActive && (
                <div style={{
                  position: 'absolute', bottom: 0, left: '15%', right: '15%',
                  height: '2px', background: 'linear-gradient(90deg, #FFD700, #FFA500)',
                  borderRadius: '1px 1px 0 0'
                }} />
              )}
            </div>
          )
        })}
      </div>

      {/* ── Phase 0: Intro + video ── */}
      {phase === 0 && (
        <div style={{ maxWidth: '520px', margin: '0 auto', padding: isMobile ? '2rem 1rem 3rem' : '3rem 1.25rem 4rem' }}>

          {/* Titel */}
          <div style={{ marginBottom: isMobile ? '1.5rem' : '2rem' }}>
            <div style={{ fontSize: isMobile ? '1.4rem' : '1.6rem', fontWeight: 900, color: '#fff', lineHeight: 1.15, marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
              Welkom bij MY ARC
            </div>
            <div style={{ fontSize: isMobile ? '0.7rem' : '0.75rem', color: 'rgba(255,255,255,0.35)', fontWeight: 500, lineHeight: 1.6 }}>
              Bekijk dit korte filmpje voordat je begint. Daarna vul je het formulier in zodat we het perfecte plan voor je kunnen maken.
            </div>
          </div>

          {/* Video block — YouTube embed */}
          <div style={{
            aspectRatio: '16/9',
            background: '#000',
            border: '1px solid rgba(255,255,255,0.06)',
            marginBottom: isMobile ? '1.25rem' : '1.5rem',
            position: 'relative', overflow: 'hidden',
          }}>
            {/* Gouden top-accent over de iframe */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '2px', zIndex: 2,
              background: 'linear-gradient(90deg, #FFD700, rgba(255,165,0,0.3), transparent)',
              pointerEvents: 'none',
            }} />
            <iframe
              src="https://www.youtube.com/embed/zVLeOFluGMM?rel=0&modestbranding=1&playsinline=1"
              title="MY ARC intake intro"
              loading="lazy"
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              style={{
                position: 'absolute', inset: 0,
                width: '100%', height: '100%', border: 0,
              }}
            />
          </div>

          {/* Beginnen knop */}
          <button onClick={() => setPhase(1)} style={{
            width: '100%', padding: isMobile ? '0.9rem' : '0.95rem',
            background: 'linear-gradient(90deg, #FFD700, #FFA500)',
            border: 'none', borderRadius: '0',
            color: '#000', fontSize: isMobile ? '0.8rem' : '0.85rem',
            fontWeight: 800, letterSpacing: '0.04em',
            cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
          }}
            onTouchStart={e => e.currentTarget.style.opacity = '0.85'}
            onTouchEnd={e => e.currentTarget.style.opacity = '1'}
          >
            BEGINNEN →
          </button>
        </div>
      )}

      {/* ── Phase 1: Persoonlijke gegevens ── */}
      {phase === 1 && (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <IntakePhase1 data={personalData} onChange={setPersonalData} onComplete={handlePhase1Complete} isMobile={isMobile} />
          {saving && (
            <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '12px', height: '12px', border: '2px solid rgba(255,215,0,0.15)', borderTopColor: '#FFD700', borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
              <span style={{ fontSize: '0.6rem', color: 'rgba(255,215,0,0.6)', fontWeight: 700 }}>Opslaan...</span>
            </div>
          )}
          {errorType && (
            <ErrorHelper type={errorType} isMobile={isMobile} onDismiss={() => setErrorType(null)} onRetry={errorType === 'SAVE_FAILED' || errorType === 'NETWORK' ? () => { setErrorType(null) } : null} />
          )}
        </div>
      )}

      {/* ── Phase 2: Tussenstap voeding ── */}
      {phase === 2 && (
        <div style={{ maxWidth: '520px', margin: '0 auto', padding: isMobile ? '2rem 1rem 3rem' : '3rem 1.25rem 4rem' }}>
          <MotivationReminder personalData={personalData} isMobile={isMobile} />

          <div style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: '0.55rem', color: '#10b981' }}>✓</span>
              </div>
              <div style={{ fontSize: isMobile ? '0.9rem' : '0.95rem', fontWeight: 800, color: '#10b981' }}>Gegevens opgeslagen</div>
            </div>
            <div style={{ fontSize: isMobile ? '0.65rem' : '0.68rem', color: 'rgba(255,255,255,0.3)', lineHeight: 1.6, paddingLeft: '1.6rem' }}>
              Nu gaan we je voedingsvoorkeuren doorlopen. Dit duurt ongeveer 3 minuten.
            </div>
          </div>

          <button onClick={() => {
            try { localStorage.setItem('myarc_intake_email', personalData.email) } catch {}
            window.location.href = '/nutritionintake'
          }} style={{
            width: '100%', padding: isMobile ? '0.9rem' : '0.95rem',
            background: 'linear-gradient(90deg, #FFD700, #FFA500)',
            border: 'none', borderRadius: '0',
            color: '#000', fontSize: isMobile ? '0.8rem' : '0.85rem',
            fontWeight: 800, letterSpacing: '0.04em',
            cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            marginBottom: '0.5rem'
          }}>
            VOEDINGSVOORKEUREN →
          </button>

          <button onClick={() => setPhase(3)} style={{
            width: '100%', padding: '0.55rem',
            background: 'transparent', border: '1px solid rgba(255,255,255,0.06)',
            color: 'rgba(255,255,255,0.25)', fontSize: '0.58rem', fontWeight: 600,
            cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            fontFamily: 'inherit'
          }}>
            Voeding al ingevuld? Ga naar training →
          </button>
        </div>
      )}

      {/* ── Phase 3: Training ── */}
      {phase === 3 && (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <MotivationReminder personalData={personalData} isMobile={isMobile} />
          <IntakePhase3 data={workoutData} onChange={setWorkoutData} onComplete={handlePhase3Complete} clientEmail={personalData.email} personalData={personalData} isMobile={isMobile} />

          {saving && (
            <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '12px', height: '12px', border: '2px solid rgba(255,215,0,0.15)', borderTopColor: '#FFD700', borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
              <span style={{ fontSize: '0.6rem', color: 'rgba(255,215,0,0.6)', fontWeight: 700 }}>Opslaan...</span>
            </div>
          )}
          {errorType && (
            <ErrorHelper type={errorType} isMobile={isMobile} onDismiss={() => setErrorType(null)} onRetry={errorType === 'SAVE_FAILED' || errorType === 'NETWORK' ? () => setErrorType(null) : null} />
          )}
        </div>
      )}

      {/* ── Phase 4: Klaar ── */}
      {phase === 4 && (
        <div style={{ maxWidth: '520px', margin: '0 auto', padding: isMobile ? '3rem 1rem 4rem' : '4rem 1.25rem 5rem', textAlign: 'center' }}>

          {/* Check */}
          <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
            <span style={{ fontSize: '1.2rem', color: '#FFD700' }}>✓</span>
          </div>

          <div style={{ fontSize: isMobile ? '1.4rem' : '1.6rem', fontWeight: 900, color: '#FFD700', letterSpacing: '-0.02em', marginBottom: '0.4rem' }}>
            Alles ingevuld{personalData.first_name ? `, ${personalData.first_name}` : ''}!
          </div>
          <div style={{ fontSize: isMobile ? '0.68rem' : '0.72rem', color: 'rgba(255,255,255,0.35)', lineHeight: 1.6, marginBottom: '2rem' }}>
            Je coach heeft nu alle informatie om jouw persoonlijke plan te maken.
          </div>

          {/* Missie kaart */}
          {(personalData.primary_goal || personalData.motivation) && (
            <div style={{ background: 'rgba(255,215,0,0.02)', border: '1px solid rgba(255,215,0,0.08)', marginBottom: '1.5rem', textAlign: 'left', overflow: 'hidden' }}>
              <div style={{ padding: '0.5rem 0.85rem', borderBottom: '1px solid rgba(255,215,0,0.06)' }}>
                <div style={{ fontSize: '0.4rem', fontWeight: 800, color: 'rgba(255,215,0,0.4)', letterSpacing: '0.1em' }}>JOUW MISSIE</div>
              </div>
              {personalData.primary_goal && (
                <div style={{ padding: '0.65rem 0.85rem', borderBottom: personalData.motivation ? '1px solid rgba(255,255,255,0.04)' : 'none', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.4rem', color: 'rgba(255,255,255,0.2)', fontWeight: 600, marginBottom: '0.15rem' }}>DOEL</div>
                    <div style={{ fontSize: isMobile ? '0.85rem' : '0.9rem', fontWeight: 800, color: '#FFD700' }}>
                      {GOAL_LABELS[personalData.primary_goal] || personalData.primary_goal}
                    </div>
                  </div>
                  {personalData.target_weight && (
                    <>
                      <div style={{ width: '1px', height: '28px', background: 'rgba(255,255,255,0.06)' }} />
                      <div>
                        <div style={{ fontSize: '0.4rem', color: 'rgba(255,255,255,0.2)', fontWeight: 600, marginBottom: '0.15rem' }}>STREEF</div>
                        <div style={{ fontSize: isMobile ? '0.85rem' : '0.9rem', fontWeight: 800, color: '#FFD700' }}>{personalData.target_weight} kg</div>
                      </div>
                    </>
                  )}
                </div>
              )}
              {personalData.motivation && (
                <div style={{ padding: '0.6rem 0.85rem' }}>
                  <div style={{ fontSize: '0.4rem', color: 'rgba(255,255,255,0.2)', fontWeight: 600, marginBottom: '0.2rem' }}>MOTIVATIE</div>
                  <div style={{ fontSize: isMobile ? '0.65rem' : '0.68rem', color: 'rgba(255,255,255,0.4)', fontStyle: 'italic', lineHeight: 1.5 }}>"{personalData.motivation}"</div>
                </div>
              )}
            </div>
          )}

          {/* Wat nu */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.45rem', fontWeight: 700, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.35rem' }}>WAT NU?</div>
            <div style={{ fontSize: isMobile ? '0.68rem' : '0.72rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
              Je coach neemt contact met je op om de intake call in te plannen.
            </div>
          </div>

          <div style={{ fontSize: '0.42rem', color: 'rgba(255,255,255,0.15)', fontWeight: 700, letterSpacing: '0.1em' }}>
            MY ARC — TRANSFORM YOUR LIFE
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
