// src/modules/client-journey/components/calls/IntakeGoalStep4.jsx
// Stap 4: Coaching level + garantie + afspraken + bevestig
// v2 — Also saves coaching_plan to client_journeys + generates real phases
import React, { useState } from 'react'
import { Award, Shield, Clock } from 'lucide-react'
import { C, StatBar, QuestionBlock, NoteField } from './IntakeCallHelpers'

const HERO = 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800&q=80'

const LEVELS = [
  { id: 'A', label: 'Strict Plan', desc: 'Exact volgen, alles loggen, wijzigingen doorgeven', color: C.gold },
  { id: 'B', label: 'Flexibel Plan', desc: 'Mealplan als richtlijn, macro targets halen', color: C.blue },
  { id: 'C', label: 'Macro Coaching', desc: 'Eigen eetpatroon, jij stuurt bij', color: C.green }
]

// Generate coaching phases based on confirmed plan
function generateCoachingPhases(weeksNeeded, totalWeeks) {
  const phases = []
  const end = Math.min(weeksNeeded, totalWeeks)

  // Phase 1: Gewenning (week 1-2)
  phases.push({ week_start: 1, week_end: 2, name: 'Gewenning', color: '#3b82f6', type: 'adaptation' })

  // Phase 2: Eerste resultaten (week 3-4)
  if (end >= 3) {
    phases.push({ week_start: 3, week_end: Math.min(4, end), name: 'Eerste resultaten', color: '#10b981', type: 'early_results' })
  }

  // Phase 3: Doorpakken (week 5 to end-2)
  if (end >= 5) {
    phases.push({ week_start: 5, week_end: Math.max(5, end - 2), name: 'Doorpakken', color: '#f59e0b', type: 'momentum' })
  }

  // Phase 4: Afronding (last 2 weeks)
  if (end >= 7) {
    phases.push({ week_start: Math.max(6, end - 1), week_end: end, name: 'Afronding', color: '#ef4444', type: 'finish' })
  }

  // Fill remaining weeks if totalWeeks > weeksNeeded
  if (totalWeeks > end) {
    phases.push({ week_start: end + 1, week_end: totalWeeks, name: 'Onderhoud', color: '#8b5cf6', type: 'maintenance' })
  }

  return phases
}

// Generate evaluation weeks (every 2 weeks starting from week 2)
function generateEvaluationWeeks(weeksNeeded, totalWeeks) {
  const evals = []
  const end = Math.min(weeksNeeded, totalWeeks)
  for (let w = 2; w <= end; w += 2) {
    evals.push(w)
  }
  return evals
}

export default function IntakeGoalStep4({ cd, db, result, isMobile, coachingLevel, setCoachingLevel, confirmed, setConfirmed, qNotes, updateQ, actions, onActionsChange, onBack }) {
  const [confirming, setConfirming] = useState(false)

  const handleConfirm = async () => {
    if (!db?.supabase || !cd?.id) return
    setConfirming(true)
    try {
      const deadline = new Date()
      deadline.setDate(deadline.getDate() + (result.weeksNeeded * 7))

      // 1. Save targets to clients table (existing behavior)
      await db.supabase.from('clients').update({
        target_calories: result.targetCal,
        target_protein: result.prot,
        target_carbs: result.carbs,
        target_fat: result.fat,
        manual_macro_targets: true,
        target_weight: result.goalWeight,
        goal_weight: result.goalWeight,
        tdee: result.tdee,
        surplus: result.isCut ? -result.actualDeficit : result.actualDeficit,
        weekly_weight_goal: result.weeklyLoss,
        goal_deadline: deadline.toISOString().split('T')[0],
        coaching_style_pref: coachingLevel || cd.coaching_style_pref
      }).eq('id', cd.id)

      // 2. Save coaching plan + updated phases to client_journeys
      const { data: journey } = await db.supabase
        .from('client_journeys')
        .select('id, total_weeks')
        .eq('client_id', cd.id)
        .eq('is_active', true)
        .single()

      if (journey) {
        const totalWeeks = journey.total_weeks || 12
        const coachingPlan = {
          confirmed_at: new Date().toISOString(),
          deficit_level: result.activePreset,
          deficit_pct: result.deficitPct,
          target_cal: result.targetCal,
          tdee: result.tdee,
          actual_deficit: result.actualDeficit,
          macros: { protein: result.prot, carbs: result.carbs, fat: result.fat },
          cardio_sessions: result.cardioDaily > 0 ? Math.round(result.cardioDaily * 7 / 200) : 0,
          cheat_days: result.cheatExtra > 0 ? Math.round(result.cheatExtra / 500) : 0,
          coaching_level: coachingLevel,
          start_weight: result.startWeight,
          goal_weight: result.goalWeight,
          kg_to_lose: result.kgToLose,
          weekly_loss: result.weeklyLoss,
          weeks_needed: result.weeksNeeded,
          is_cut: result.isCut,
          evaluation_interval: 2,
          evaluation_weeks: generateEvaluationWeeks(result.weeksNeeded, totalWeeks),
          adjustments: [] // history of changes: [{week, type, from, to, reason, date}]
        }

        const newPhases = generateCoachingPhases(result.weeksNeeded, totalWeeks)

        await db.supabase
          .from('client_journeys')
          .update({
            coaching_plan: coachingPlan,
            phases: newPhases
          })
          .eq('id', journey.id)
      }

      setConfirmed(true)
    } catch (e) { console.error('Save goal:', e) }
    setConfirming(false)
  }

  return (
    <div>
      {/* Hero */}
      <div style={{ position: 'relative', height: '100px', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${HERO})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #0a0a0a 0%, rgba(0,0,0,0.3) 50%, transparent 100%)' }} />
        <div style={{ position: 'absolute', bottom: '0.5rem', left: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Award size={16} color={C.gold} />
          <span style={{ fontSize: isMobile ? '0.9rem' : '1rem', fontWeight: 800, color: C.text }}>Bevestig & afspraken</span>
        </div>
      </div>

      {/* Plan samenvatting */}
      <div style={{ borderBottom: `1px solid ${C.goldBorder}`, borderLeft: `3px solid ${C.gold}`, background: C.goldBg }}>
        <StatBar isMobile={isMobile} stats={[
          { label: 'TARGET', value: result.targetCal, unit: 'kcal', color: C.gold },
          { label: 'EIWIT', value: result.prot, unit: 'g', color: C.blue },
          { label: 'CARBS', value: result.carbs, unit: 'g' },
          { label: 'VET', value: result.fat, unit: 'g' }
        ]} />
        <StatBar isMobile={isMobile} stats={[
          { label: 'PER WEEK', value: result.weeklyLoss, unit: 'kg', color: C.gold },
          { label: 'DUUR', value: result.weeksNeeded, unit: 'weken' },
          { label: 'EIND', value: result.goalWeight, unit: 'kg', color: C.gold }
        ]} />
      </div>

      {/* Coaching level */}
      <div style={{ padding: isMobile ? '0.625rem 0.75rem' : '0.75rem 1rem', borderBottom: `1px solid ${C.borderSub}` }}>
        <div style={{ fontSize: isMobile ? '0.9rem' : '1rem', fontWeight: 800, color: C.text, marginBottom: '0.15rem' }}>Hoe gaan we het plan volgen?</div>
        <div style={{ fontSize: '0.5rem', color: C.text25, marginBottom: '0.4rem' }}>Kies samen met de client het coaching level</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          {LEVELS.map(lv => {
            const active = coachingLevel === lv.id
            return (
              <button key={lv.id} onClick={() => setCoachingLevel(lv.id)} style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: isMobile ? '0.5rem 0.625rem' : '0.625rem 0.75rem',
                background: active ? `${lv.color}08` : '#111',
                border: active ? `2px solid ${lv.color}` : `1px solid ${C.border}`,
                borderRadius: 0, cursor: 'pointer', textAlign: 'left', width: '100%',
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
              }}>
                <div style={{
                  width: '24px', height: '24px', borderRadius: '6px',
                  background: active ? `${lv.color}15` : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${active ? lv.color : C.borderSub}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.6rem', fontWeight: 800, color: active ? lv.color : C.text25, flexShrink: 0
                }}>{lv.id}</div>
                <div>
                  <div style={{ fontSize: isMobile ? '0.75rem' : '0.85rem', fontWeight: active ? 800 : 600, color: active ? lv.color : C.text50 }}>{lv.label}</div>
                  <div style={{ fontSize: '0.5rem', color: C.text25 }}>{lv.desc}</div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Garantie */}
      <div style={{ padding: isMobile ? '0.625rem 0.75rem' : '0.75rem 1rem', borderBottom: `1px solid ${C.borderSub}`, borderLeft: `3px solid ${C.green}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.25rem' }}>
          <Shield size={14} color={C.green} />
          <span style={{ fontSize: '0.4rem', fontWeight: 700, color: C.green, textTransform: 'uppercase', letterSpacing: '0.06em' }}>DE GARANTIE</span>
        </div>
        <div style={{ fontSize: isMobile ? '0.75rem' : '0.85rem', color: C.text50, lineHeight: 1.7, fontStyle: 'italic' }}>
          "Als jij 80% compliant bent — {cd.workout_days_per_week || 4}x trainen, macro's loggen, wegen, calls doen — dan garandeer ik
          <span style={{ color: C.gold, fontWeight: 800, fontStyle: 'normal' }}> {result.kgToLose} kg {result.isCut ? 'vetverlies' : 'spiergroei'} in {result.weeksNeeded} weken</span>.
          Haal je het niet? Geld terug of we werken door."
        </div>
      </div>

      <QuestionBlock q="Begrijpt de client de voorwaarden?" value={qNotes.guarantee_understood} onChange={v => updateQ('guarantee_understood', v)} isMobile={isMobile} />

      {/* Verwachtingen */}
      <div style={{ padding: isMobile ? '0.625rem 0.75rem' : '0.75rem 1rem', borderBottom: `1px solid ${C.borderSub}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.25rem' }}>
          <Clock size={14} color={C.gold} />
          <span style={{ fontSize: '0.4rem', fontWeight: 700, color: C.gold, textTransform: 'uppercase', letterSpacing: '0.06em' }}>BENOEM DEZE VERWACHTINGEN</span>
        </div>
        {[
          '"Het hoeft niet perfect — 80% is genoeg"',
          '"De eerste 2 weken zijn gewenning, stres niet"',
          '"Gewicht fluctueert dagelijks — kijk naar weekgemiddelden"',
          '"Ik ben er voor je als het even niet lukt"',
          '"Ziek/vakantie? We pauzeren en pakken weer op"'
        ].map((s, i) => (
          <div key={i} style={{ fontSize: isMobile ? '0.75rem' : '0.85rem', color: C.text25, padding: '0.1rem 0' }}>{s}</div>
        ))}
      </div>

      {/* Afspraken */}
      <QuestionBlock q="Call frequentie en dag/tijd?" value={qNotes.call_freq} onChange={v => updateQ('call_freq', v)} isMobile={isMobile} />
      <QuestionBlock q="Startdatum?" value={qNotes.start_date} onChange={v => updateQ('start_date', v)} isMobile={isMobile} />
      <QuestionBlock q="WhatsApp afspraken?" value={qNotes.whatsapp_freq} onChange={v => updateQ('whatsapp_freq', v)} isMobile={isMobile} />

      <NoteField label="EXTRA NOTITIES" value={qNotes.goal_notes} onChange={v => updateQ('goal_notes', v)} isMobile={isMobile} />
      <NoteField label="ACTIES (verschijnen onderaan)" value={actions} onChange={onActionsChange} color={C.gold} placeholder="Bijv: PPL schema toewijzen, 3200kcal plan, boodschappenlijst..." isMobile={isMobile} />

      {/* BEVESTIG */}
      <div style={{ padding: isMobile ? '0.75rem' : '1rem' }}>
        {confirmed ? (
          <div style={{ padding: '0.75rem', textAlign: 'center', background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <div style={{ fontSize: isMobile ? '0.85rem' : '0.95rem', fontWeight: 800, color: C.green, marginBottom: '0.2rem' }}>✓ DOEL BEVESTIGD & OPGESLAGEN</div>
            <div style={{ fontSize: '0.5rem', color: C.text25 }}>
              {result.targetCal} kcal · {result.prot}g E · {result.carbs}g K · {result.fat}g V · Level {coachingLevel || '—'} · {result.goalWeight} kg in {result.weeksNeeded} wkn
            </div>
            <div style={{ fontSize: '0.4rem', color: C.text15, marginTop: '0.15rem' }}>
              Coaching plan opgeslagen · Evaluaties elke 2 weken · Phases bijgewerkt
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={onBack} style={{
              padding: '0.5rem 1rem', background: 'transparent', border: `1px solid ${C.border}`,
              borderRadius: 0, color: C.text25, fontSize: '0.65rem', fontWeight: 700,
              cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: '36px'
            }}>← TERUG</button>
            <button onClick={handleConfirm} disabled={confirming} style={{
              flex: 1, padding: '0.75rem',
              background: `linear-gradient(90deg, ${C.gold}, ${C.darkGold})`,
              border: 'none', borderRadius: 0, color: '#000',
              fontSize: isMobile ? '0.85rem' : '0.95rem', fontWeight: 800,
              cursor: confirming ? 'wait' : 'pointer',
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              opacity: confirming ? 0.6 : 1, minHeight: '48px'
            }}>
              {confirming ? 'Opslaan...' : '✓ BEVESTIG ALLES & OPSLAAN'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
