// src/funnel/90days/components/Calculator.jsx

import { useState, useMemo } from 'react'
import { GOLD, pp, goldGloss, goldButtonBg, shimmerOverlay } from '../colors'
import IntakeService from '../../../intake/IntakeService'

const G = ({ children }) => (
  <span style={{ ...goldGloss, fontWeight: 800 }}>{children}</span>
)

export default function Calculator({ isMobile }) {
  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState(1)

  // Input state
  const [weight, setWeight] = useState('')
  const [height, setHeight] = useState('')
  const [age, setAge] = useState('')
  const [activity, setActivity] = useState(null)
  const [gymDays, setGymDays] = useState(null)
  const [currentDiet, setCurrentDiet] = useState(null)
  const [goalKg, setGoalKg] = useState(10)

  // Interactive adjustments (post-result)
  const [extraSport, setExtraSport] = useState(0) // 0, 1, 2, 3 extra sessions
  const [useRefeeds, setUseRefeeds] = useState(false)
  const [showAllWeeks, setShowAllWeeks] = useState(false)

  // Lead capture
  const [email, setEmail] = useState('')
  const [showEmail, setShowEmail] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const canNext1 = weight && height && age
  const canNext2 = activity !== null && gymDays !== null
  const canNext3 = currentDiet !== null

  // ── CALCULATION (reactive to adjustments) ──
  const result = useMemo(() => {
    const w = parseFloat(weight)
    const h = parseFloat(height)
    const a = parseInt(age)
    if (!w || !h || !a || !activity || !submitted) return null

    const bmr = (10 * w) + (6.25 * h) - (5 * a) + 5
    const baseMultipliers = { sedentary: 1.2, light: 1.3, moderate: 1.45, active: 1.6 }
    const gymBonus = { '0': 0, '1-2': 0.05, '3-4': 0.1, '5+': 0.15 }
    const multiplier = (baseMultipliers[activity] || 1.3) + (gymBonus[gymDays] || 0)

    // Extra sport adds ~150 kcal per extra session per week (spread daily)
    const extraDailyBurn = Math.round((extraSport * 150) / 7 * extraSport)
    const tdee = Math.round(bmr * multiplier) + extraDailyBurn

    // Refeed: 4 weeks deficit, 1 week maintenance → effective deficit is 80% of normal
    const totalDays = useRefeeds ? 112 : 90 // 90 days + ~3 refeed weeks
    const effectiveDeficitDays = useRefeeds ? 90 : 90 // still 90 deficit days total
    const totalCalDeficit = goalKg * 7700
    const dailyDeficit = Math.round(totalCalDeficit / effectiveDeficitDays)
    const clampedDeficit = Math.min(dailyDeficit, 750)
    const targetCal = Math.max(Math.round(tdee - clampedDeficit), 1400)
    const maintenanceCal = tdee

    // Macros: 2g protein/kg, min 100g carbs, rest from fat (min 0.8g/kg)
    const proteinG = Math.round(w * 2)
    const proteinCal = proteinG * 4
    const minCarbG = 100
    const minFatG = Math.round(w * 0.8)

    let carbG, fatG
    const remaining = targetCal - proteinCal
    const idealFatG = Math.round(w * 1.1)
    const idealCarbG = Math.round((remaining - idealFatG * 9) / 4)

    if (idealCarbG >= minCarbG) {
      carbG = idealCarbG
      fatG = idealFatG
    } else {
      carbG = minCarbG
      fatG = Math.max(Math.round((remaining - minCarbG * 4) / 9), minFatG)
    }

    const weeklyLoss = parseFloat(((clampedDeficit * 7) / 7700).toFixed(2))
    const projected = Math.min(Math.round(weeklyLoss * (effectiveDeficitDays / 7)), goalKg)

    // Timeline
    const timeline = []
    let currentW = w
    const totalWeeks = useRefeeds ? 16 : 13
    let deficitWeekCount = 0

    for (let week = 1; week <= totalWeeks; week++) {
      const isRefeedWeek = useRefeeds && (week % 5 === 0) // every 5th week is refeed
      if (!isRefeedWeek) {
        currentW = Math.round((currentW - weeklyLoss) * 10) / 10
        deficitWeekCount++
      }
      timeline.push({
        week,
        kcal: isRefeedWeek ? maintenanceCal : targetCal,
        weight: currentW,
        lost: Math.round((w - currentW) * 10) / 10,
        isRefeed: isRefeedWeek,
      })
      if (deficitWeekCount >= 13) break
    }

    return {
      tdee, maintenanceCal, target: targetCal,
      deficit: clampedDeficit,
      deficitPercent: Math.round((clampedDeficit / tdee) * 100),
      weeklyLoss: weeklyLoss.toFixed(1),
      projected, proteinG, carbG, fatG,
      proteinPerMeal: Math.round(proteinG / 4),
      goalWeight: Math.round(w - projected),
      timeline, totalWeeks,
      extraCalFromSport: extraDailyBurn,
    }
  }, [weight, height, age, activity, gymDays, goalKg, extraSport, useRefeeds, submitted])

  const triggerCalculate = () => {
    setShowEmail(true)
  }

  const handleSubmit = async () => {
    if (!email || !email.includes('@')) return
    setSubmitted(true)

    const r = { target: '...berekend na submit' }
    const answers = {
      goal: `Vetverlies: ${goalKg}kg in 90 dagen`,
      age_range: `${age} jaar`,
      goal_description: `Gewicht: ${weight}kg | Lengte: ${height}cm | Leeftijd: ${age} | Activiteit: ${activity} | Gym: ${gymDays}x/week | Huidig eten: ${currentDiet} | Doel: -${goalKg}kg`,
      obstacle: `Huidige situatie: ${currentDiet}`,
      urgency: 'Calculator ingevuld',
    }
    const contact = { name: email.split('@')[0], email, phone: null }

    try {
      await IntakeService.submitIntake(answers, contact)
      console.log('✅ Lead saved:', email)
    } catch (err) {
      console.error('Lead save error:', err)
    }
  }

  // ── STYLES ──
  const inputStyle = {
    width: '100%', padding: isMobile ? '0.75rem' : '0.85rem',
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '10px', color: '#fff', fontFamily: pp,
    fontSize: isMobile ? '0.9rem' : '0.95rem', fontWeight: 600,
    outline: 'none', WebkitAppearance: 'none', textAlign: 'center',
  }
  const labelStyle = {
    fontFamily: pp, fontSize: isMobile ? '0.6rem' : '0.65rem',
    fontWeight: 700, color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase', letterSpacing: '0.06em',
    marginBottom: '0.3rem', display: 'block',
  }
  const optBtn = (sel) => ({
    width: '100%', padding: isMobile ? '0.75rem' : '0.85rem',
    background: sel ? 'rgba(255,186,9,0.1)' : 'rgba(255,255,255,0.03)',
    border: sel ? '1.5px solid rgba(255,186,9,0.3)' : '1px solid rgba(255,255,255,0.06)',
    borderRadius: '10px', color: sel ? '#fff' : 'rgba(255,255,255,0.4)',
    fontFamily: pp, fontSize: isMobile ? '0.75rem' : '0.8rem',
    fontWeight: sel ? 700 : 500, cursor: 'pointer', textAlign: 'left',
    display: 'flex', alignItems: 'center', gap: '0.6rem',
    touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
    transition: 'all 0.2s ease',
  })
  const goldBtn = (enabled, onClick, label) => (
    <button onClick={() => enabled && onClick()} style={{
      width: '100%', padding: isMobile ? '0.85rem' : '0.95rem',
      background: enabled ? goldButtonBg : 'rgba(255,255,255,0.05)',
      border: 'none', borderRadius: '10px',
      color: enabled ? '#000' : 'rgba(255,255,255,0.2)',
      fontFamily: pp, fontSize: isMobile ? '0.8rem' : '0.85rem',
      fontWeight: 800, cursor: enabled ? 'pointer' : 'default',
      touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
      marginTop: '0.5rem', position: 'relative', overflow: 'hidden',
    }}>
      {enabled && <div style={shimmerOverlay} />}
      <span style={{ position: 'relative', zIndex: 1 }}>{label}</span>
    </button>
  )
  const backLink = (toStep) => (
    <button onClick={() => setStep(toStep)} style={{
      background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)',
      fontFamily: pp, fontSize: '0.6rem', cursor: 'pointer', padding: '0.25rem', marginTop: '0.25rem',
    }}>Terug</button>
  )

  const sectionLabel = (text) => (
    <div style={{
      fontFamily: pp, fontSize: isMobile ? '0.55rem' : '0.6rem',
      fontWeight: 700, color: 'rgba(255,255,255,0.3)',
      textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem',
    }}>{text}</div>
  )

  const totalSteps = 4

  // ══════════════════════════
  // CLOSED STATE
  // ══════════════════════════
  if (!isOpen) {
    return (
      <section style={{
        maxWidth: '720px', margin: '0 auto',
        padding: isMobile ? '2rem 1rem' : '2.5rem 2rem',
        borderTop: '1px solid rgba(255,186,9,0.08)', textAlign: 'center',
      }}>
        <h2 style={{
          fontFamily: pp, fontSize: isMobile ? '1.1rem' : '1.35rem',
          fontWeight: 900, color: '#fff', lineHeight: 1.25,
          marginBottom: isMobile ? '0.3rem' : '0.4rem',
        }}>
          <G>Vetverlies Calculator</G>
        </h2>
        <p style={{
          fontFamily: pp, fontSize: isMobile ? '0.7rem' : '0.77rem',
          fontWeight: 400, color: 'rgba(255,255,255,0.3)',
          marginBottom: isMobile ? '1rem' : '1.25rem',
        }}>
          Bereken precies hoeveel je moet eten om 5-15 kilo te verliezen in 90 dagen
        </p>
        <button onClick={() => setIsOpen(true)} style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          gap: '0.5rem', fontFamily: pp, fontSize: isMobile ? '0.85rem' : '0.95rem',
          fontWeight: 900, color: '#000', background: goldButtonBg,
          borderRadius: '14px', padding: isMobile ? '1rem 2rem' : '1.1rem 2.5rem',
          position: 'relative', overflow: 'hidden',
          boxShadow: '0 4px 15px rgba(255,186,9,0.2)',
          border: 'none', cursor: 'pointer',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
        }}>
          <div style={shimmerOverlay} />
          <span style={{ position: 'relative', zIndex: 1 }}>Bereken Mijn 90-Dagen Plan</span>
        </button>
      </section>
    )
  }

  // ══════════════════════════
  // OPEN STATE
  // ══════════════════════════
  return (
    <section style={{
      maxWidth: '720px', margin: '0 auto',
      padding: isMobile ? '2rem 1rem' : '2.5rem 2rem',
      borderTop: '1px solid rgba(255,186,9,0.08)', textAlign: 'center',
    }}>
      <h2 style={{
        fontFamily: pp, fontSize: isMobile ? '1.05rem' : '1.25rem',
        fontWeight: 900, color: '#fff', marginBottom: isMobile ? '0.25rem' : '0.3rem',
      }}><G>Vetverlies Calculator</G></h2>
      <p style={{
        fontFamily: pp, fontSize: isMobile ? '0.6rem' : '0.65rem',
        fontWeight: 400, color: 'rgba(255,255,255,0.25)',
        marginBottom: isMobile ? '1rem' : '1.25rem',
      }}>Jouw persoonlijke 90-dagen plan</p>

      {/* Progress */}
      {!submitted && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.4rem', marginBottom: isMobile ? '1.25rem' : '1.5rem' }}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} style={{
              width: step >= i + 1 ? '20px' : '6px', height: '6px', borderRadius: '3px',
              background: step >= i + 1 ? GOLD : 'rgba(255,255,255,0.1)', transition: 'all 0.3s ease',
            }} />
          ))}
        </div>
      )}

      <div style={{ maxWidth: '380px', margin: '0 auto' }}>

        {/* ══ STEP 1 ══ */}
        {step === 1 && !submitted && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
            <div style={{ fontFamily: pp, fontSize: isMobile ? '0.8rem' : '0.88rem', fontWeight: 700, color: '#fff', marginBottom: '0.25rem' }}>Vertel me over jezelf</div>
            <div><label style={labelStyle}>Gewicht (kg)</label><input type="number" placeholder="85" value={weight} onChange={e => setWeight(e.target.value)} style={inputStyle} inputMode="decimal" /></div>
            <div><label style={labelStyle}>Lengte (cm)</label><input type="number" placeholder="182" value={height} onChange={e => setHeight(e.target.value)} style={inputStyle} inputMode="decimal" /></div>
            <div><label style={labelStyle}>Leeftijd</label><input type="number" placeholder="26" value={age} onChange={e => setAge(e.target.value)} style={inputStyle} inputMode="numeric" /></div>
            {goldBtn(canNext1, () => setStep(2), 'Volgende')}
          </div>
        )}

        {/* ══ STEP 2 ══ */}
        {step === 2 && !submitted && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <div style={{ fontFamily: pp, fontSize: isMobile ? '0.8rem' : '0.88rem', fontWeight: 700, color: '#fff', marginBottom: '0.15rem' }}>Hoe ziet je dag eruit?</div>
            <label style={labelStyle}>Dagelijkse activiteit</label>
            {[
              { v: 'sedentary', l: 'Zittend werk, weinig beweging' },
              { v: 'light', l: 'Af en toe wandelen, soms staan' },
              { v: 'moderate', l: 'Redelijk actief, veel lopen' },
              { v: 'active', l: 'Fysiek werk, altijd in beweging' },
            ].map(o => (
              <button key={o.v} onClick={() => setActivity(o.v)} style={optBtn(activity === o.v)}>{o.l}</button>
            ))}
            <div style={{ marginTop: '0.5rem' }}>
              <label style={labelStyle}>Hoe vaak sport je per week?</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem' }}>
                {['0', '1-2', '3-4', '5+'].map(v => (
                  <button key={v} onClick={() => setGymDays(v)} style={{
                    padding: isMobile ? '0.65rem' : '0.75rem',
                    background: gymDays === v ? 'rgba(255,186,9,0.12)' : 'rgba(255,255,255,0.03)',
                    border: gymDays === v ? '1px solid rgba(255,186,9,0.3)' : '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '8px', color: gymDays === v ? GOLD : 'rgba(255,255,255,0.4)',
                    fontFamily: pp, fontSize: isMobile ? '0.72rem' : '0.78rem',
                    fontWeight: gymDays === v ? 700 : 500, cursor: 'pointer', textAlign: 'center',
                    touchAction: 'manipulation', transition: 'all 0.2s ease',
                  }}>{v}x</button>
                ))}
              </div>
            </div>
            {goldBtn(canNext2, () => setStep(3), 'Volgende')}
            {backLink(1)}
          </div>
        )}

        {/* ══ STEP 3 ══ */}
        {step === 3 && !submitted && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <div style={{ fontFamily: pp, fontSize: isMobile ? '0.8rem' : '0.88rem', fontWeight: 700, color: '#fff', marginBottom: '0.15rem' }}>Hoe eet je op dit moment?</div>
            {[
              { v: 'no_tracking', l: 'Ik let niet echt op wat ik eet' },
              { v: 'trying', l: 'Ik probeer gezond te eten, maar geen structuur' },
              { v: 'some_tracking', l: 'Ik track soms mijn calorieen' },
              { v: 'consistent', l: 'Ik track consistent en eet gestructureerd' },
            ].map(o => (
              <button key={o.v} onClick={() => setCurrentDiet(o.v)} style={optBtn(currentDiet === o.v)}>{o.l}</button>
            ))}
            {goldBtn(canNext3, () => setStep(4), 'Volgende')}
            {backLink(2)}
          </div>
        )}

        {/* ══ STEP 4 ══ */}
        {step === 4 && !showEmail && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
            <div style={{ fontFamily: pp, fontSize: isMobile ? '0.8rem' : '0.88rem', fontWeight: 700, color: '#fff', marginBottom: '0.25rem' }}>Hoeveel kilo wil je verliezen?</div>
            <div style={{ textAlign: 'center', marginBottom: '0.25rem' }}>
              <div className="ss-gold-gloss" style={{ fontFamily: pp, fontSize: isMobile ? '2.5rem' : '3rem', fontWeight: 900, lineHeight: 1 }}>{goalKg} kg</div>
              <div style={{ fontFamily: pp, fontSize: isMobile ? '0.55rem' : '0.6rem', fontWeight: 500, color: 'rgba(255,255,255,0.25)', marginTop: '0.2rem' }}>in 90 dagen</div>
            </div>
            <input type="range" min="5" max="15" value={goalKg} onChange={e => setGoalKg(parseInt(e.target.value))} style={{
              width: '100%', height: '4px', appearance: 'none', WebkitAppearance: 'none',
              background: `linear-gradient(to right, ${GOLD} 0%, ${GOLD} ${((goalKg - 5) / 10) * 100}%, rgba(255,255,255,0.1) ${((goalKg - 5) / 10) * 100}%, rgba(255,255,255,0.1) 100%)`,
              borderRadius: '2px', outline: 'none', cursor: 'pointer',
            }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: pp, fontSize: '0.5rem', fontWeight: 600, color: 'rgba(255,255,255,0.2)' }}>
              <span>5 kg</span><span>15 kg</span>
            </div>
            {goldBtn(true, triggerCalculate, 'Bereken Mijn Plan')}
            {backLink(3)}
          </div>
        )}

        {/* ══ EMAIL GATE ══ */}
        {showEmail && !submitted && (
          <div style={{ padding: isMobile ? '1.25rem' : '1.5rem', background: 'rgba(255,186,9,0.03)', border: '1px solid rgba(255,186,9,0.12)', borderRadius: '14px' }}>
            <div style={{ fontFamily: pp, fontSize: isMobile ? '0.95rem' : '1.05rem', fontWeight: 800, color: '#fff', marginBottom: '0.2rem' }}>Jouw plan is klaar</div>
            <p style={{ fontFamily: pp, fontSize: isMobile ? '0.62rem' : '0.68rem', fontWeight: 400, color: 'rgba(255,255,255,0.3)', marginBottom: '0.75rem' }}>Vul je email in om je plan te bekijken</p>
            <input type="email" placeholder="jouw@email.nl" value={email} onChange={e => setEmail(e.target.value)} style={{ ...inputStyle, marginBottom: '0.5rem' }} inputMode="email" />
            {goldBtn(email.includes('@'), handleSubmit, 'Toon Mijn Plan')}
          </div>
        )}

        {/* ══════════════════════════════════
            RESULTS — INTERACTIVE
            ══════════════════════════════════ */}
        {submitted && result && (
          <div style={{ textAlign: 'left' }}>

            <div style={{ fontFamily: pp, fontSize: isMobile ? '0.95rem' : '1.1rem', fontWeight: 900, color: '#fff', textAlign: 'center', marginBottom: isMobile ? '1.5rem' : '1.75rem' }}>
              Jouw 90-Dagen Plan
            </div>

            {/* ── Daily intake ── */}
            {sectionLabel('Jouw dagelijkse intake')}
            <p style={{ fontFamily: pp, fontSize: isMobile ? '0.75rem' : '0.82rem', fontWeight: 400, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
              Je verbrandt ~<span style={{ color: '#fff', fontWeight: 700 }}>{result.tdee} kcal</span> per dag.
              Om {goalKg} kg te verliezen eet je <span style={{ color: '#fff', fontWeight: 700 }}>{result.target} kcal per dag</span> — {result.deficit} kcal onder je verbranding.
              {useRefeeds && <> Elke 5e week eet je <span style={{ color: '#fff', fontWeight: 700 }}>{result.maintenanceCal} kcal</span> (refeed week).</>}
            </p>

            {/* ── Macros ── */}
            {sectionLabel("Macro's per dag")}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0', marginBottom: '1.25rem' }}>
              {[
                { label: 'Eiwit', value: `${result.proteinG}g`, sub: `~${result.proteinPerMeal}g per maaltijd` },
                { label: 'Koolhydraten', value: `${result.carbG}g` },
                { label: 'Vet', value: `${result.fatG}g` },
              ].map((m, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '0.5rem 0', borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                }}>
                  <div>
                    <span style={{ fontFamily: pp, fontSize: isMobile ? '0.75rem' : '0.82rem', fontWeight: 500, color: 'rgba(255,255,255,0.5)' }}>{m.label}</span>
                    {m.sub && <span style={{ fontFamily: pp, fontSize: '0.55rem', color: 'rgba(255,255,255,0.2)', marginLeft: '0.5rem' }}>{m.sub}</span>}
                  </div>
                  <span style={{ fontFamily: pp, fontSize: isMobile ? '0.85rem' : '0.92rem', fontWeight: 800, color: '#fff' }}>{m.value}</span>
                </div>
              ))}
            </div>

            {/* ══ INTERACTIVE ADJUSTMENTS ══ */}
            {sectionLabel('Pas je plan aan')}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>

              {/* Extra sport */}
              <div>
                <div style={{ fontFamily: pp, fontSize: isMobile ? '0.7rem' : '0.75rem', fontWeight: 600, color: '#fff', marginBottom: '0.35rem' }}>
                  Wat als je meer gaat bewegen?
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.35rem' }}>
                  {[
                    { v: 0, l: 'Geen extra' },
                    { v: 1, l: '+1x/week' },
                    { v: 2, l: '+2x/week' },
                    { v: 3, l: '+3x/week' },
                  ].map(o => (
                    <button key={o.v} onClick={() => setExtraSport(o.v)} style={{
                      padding: isMobile ? '0.55rem 0.25rem' : '0.6rem 0.3rem',
                      background: extraSport === o.v ? 'rgba(255,186,9,0.1)' : 'rgba(255,255,255,0.03)',
                      border: extraSport === o.v ? '1px solid rgba(255,186,9,0.25)' : '1px solid rgba(255,255,255,0.06)',
                      borderRadius: '8px', color: extraSport === o.v ? GOLD : 'rgba(255,255,255,0.35)',
                      fontFamily: pp, fontSize: isMobile ? '0.6rem' : '0.65rem', fontWeight: extraSport === o.v ? 700 : 500,
                      cursor: 'pointer', textAlign: 'center', touchAction: 'manipulation', transition: 'all 0.2s ease',
                    }}>{o.l}</button>
                  ))}
                </div>
                {extraSport > 0 && (
                  <div style={{ fontFamily: pp, fontSize: isMobile ? '0.6rem' : '0.65rem', fontWeight: 500, color: GOLD, marginTop: '0.3rem' }}>
                    Je kunt ~{result.extraCalFromSport} kcal meer eten per dag voor hetzelfde resultaat
                  </div>
                )}
              </div>

              {/* Refeed toggle */}
              <div>
                <button onClick={() => setUseRefeeds(!useRefeeds)} style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: isMobile ? '0.7rem' : '0.8rem',
                  background: useRefeeds ? 'rgba(255,186,9,0.08)' : 'rgba(255,255,255,0.03)',
                  border: useRefeeds ? '1px solid rgba(255,186,9,0.2)' : '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '10px', cursor: 'pointer', touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent', transition: 'all 0.2s ease',
                }}>
                  <div>
                    <div style={{ fontFamily: pp, fontSize: isMobile ? '0.7rem' : '0.75rem', fontWeight: 600, color: '#fff', textAlign: 'left' }}>Refeed weken inplannen</div>
                    <div style={{ fontFamily: pp, fontSize: isMobile ? '0.55rem' : '0.6rem', fontWeight: 400, color: 'rgba(255,255,255,0.3)', textAlign: 'left' }}>Elke 5e week op maintenance — makkelijker vol te houden</div>
                  </div>
                  <div style={{
                    width: '36px', height: '20px', borderRadius: '10px',
                    background: useRefeeds ? GOLD : 'rgba(255,255,255,0.1)',
                    position: 'relative', transition: 'background 0.2s ease', flexShrink: 0,
                  }}>
                    <div style={{
                      width: '16px', height: '16px', borderRadius: '50%',
                      background: '#fff', position: 'absolute', top: '2px',
                      left: useRefeeds ? '18px' : '2px', transition: 'left 0.2s ease',
                    }} />
                  </div>
                </button>
              </div>

              {/* Goal adjustment */}
              <div>
                <div style={{ fontFamily: pp, fontSize: isMobile ? '0.7rem' : '0.75rem', fontWeight: 600, color: '#fff', marginBottom: '0.3rem' }}>
                  Doel aanpassen: <span style={{ color: GOLD }}>{goalKg} kg</span>
                </div>
                <input type="range" min="5" max="15" value={goalKg} onChange={e => setGoalKg(parseInt(e.target.value))} style={{
                  width: '100%', height: '4px', appearance: 'none', WebkitAppearance: 'none',
                  background: `linear-gradient(to right, ${GOLD} 0%, ${GOLD} ${((goalKg - 5) / 10) * 100}%, rgba(255,255,255,0.1) ${((goalKg - 5) / 10) * 100}%, rgba(255,255,255,0.1) 100%)`,
                  borderRadius: '2px', outline: 'none', cursor: 'pointer',
                }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: pp, fontSize: '0.48rem', fontWeight: 600, color: 'rgba(255,255,255,0.15)' }}>
                  <span>5 kg — meer eten</span><span>15 kg — sneller resultaat</span>
                </div>
              </div>
            </div>

            {/* ── Timeline ── */}
            {sectionLabel('Jouw tijdlijn')}

            {/* Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '0.6fr 1fr 0.8fr 0.8fr', gap: '0.25rem', padding: '0.4rem 0', borderBottom: '1px solid rgba(255,186,9,0.15)' }}>
              {['Week', 'Kcal/dag', 'Gewicht', 'Verloren'].map(h => (
                <div key={h} style={{ fontFamily: pp, fontSize: isMobile ? '0.5rem' : '0.55rem', fontWeight: 700, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</div>
              ))}
            </div>

            {/* Rows — show 4 highlights or all */}
            {(showAllWeeks ? result.timeline : result.timeline.filter(r => [1, 4, 8, 12].includes(r.week) || r.isRefeed)).map((row, i) => (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '0.6fr 1fr 0.8fr 0.8fr', gap: '0.25rem',
                padding: '0.35rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)',
                background: row.isRefeed ? 'rgba(255,186,9,0.04)' : 'transparent',
              }}>
                <div style={{ fontFamily: pp, fontSize: isMobile ? '0.65rem' : '0.7rem', fontWeight: 600, color: row.isRefeed ? GOLD : 'rgba(255,255,255,0.5)' }}>
                  {row.week}{row.isRefeed ? '*' : ''}
                </div>
                <div style={{ fontFamily: pp, fontSize: isMobile ? '0.65rem' : '0.7rem', fontWeight: 600, color: row.isRefeed ? GOLD : 'rgba(255,255,255,0.4)' }}>
                  {row.kcal}{row.isRefeed ? ' (refeed)' : ''}
                </div>
                <div style={{ fontFamily: pp, fontSize: isMobile ? '0.65rem' : '0.7rem', fontWeight: 700, color: '#fff' }}>{row.weight} kg</div>
                <div style={{ fontFamily: pp, fontSize: isMobile ? '0.65rem' : '0.7rem', fontWeight: 600, color: GOLD }}>-{row.lost} kg</div>
              </div>
            ))}

            {/* Toggle all weeks */}
            <button onClick={() => setShowAllWeeks(!showAllWeeks)} style={{
              background: 'none', border: 'none', fontFamily: pp,
              fontSize: isMobile ? '0.6rem' : '0.65rem', fontWeight: 600,
              color: GOLD, cursor: 'pointer', padding: '0.5rem 0',
              touchAction: 'manipulation',
            }}>
              {showAllWeeks ? 'Toon minder' : `Bekijk alle ${result.timeline.length} weken`}
            </button>

            {/* Refeed legend */}
            {useRefeeds && (
              <div style={{ fontFamily: pp, fontSize: '0.5rem', fontWeight: 500, color: 'rgba(255,255,255,0.2)', marginBottom: '0.75rem' }}>
                * = refeed week (je eet op maintenance, geen vetverlies maar makkelijker vol te houden)
              </div>
            )}

            {/* ── Summary ── */}
            <div style={{
              padding: '0.85rem', background: 'rgba(255,186,9,0.04)', borderRadius: '10px',
              border: '1px solid rgba(255,186,9,0.1)', textAlign: 'center',
              marginTop: '0.5rem', marginBottom: '1rem',
            }}>
              <div style={{ fontFamily: pp, fontSize: isMobile ? '0.85rem' : '0.95rem', fontWeight: 400, color: 'rgba(255,255,255,0.5)' }}>
                Van <span style={{ color: '#fff', fontWeight: 800 }}>{weight} kg</span> naar
                <span className="ss-gold-gloss" style={{ fontWeight: 900, fontSize: '115%' }}> ~{result.goalWeight} kg</span>
              </div>
              <div style={{ fontFamily: pp, fontSize: isMobile ? '0.55rem' : '0.6rem', fontWeight: 500, color: 'rgba(255,255,255,0.2)', marginTop: '0.15rem' }}>
                ~{result.weeklyLoss} kg per week
                {useRefeeds && ` · ${result.totalWeeks} weken totaal (incl. refeeds)`}
              </div>
            </div>

            {/* ── Download / Copy ── */}
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
              {/* PDF Download */}
              <button onClick={() => {
                // Generate a styled HTML page and trigger print/save as PDF
                const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800;900&display=swap" rel="stylesheet">
<title>Mijn 90-Dagen Vetverlies Plan — MY ARC</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#000;color:#fff;font-family:'Poppins',sans-serif;padding:2rem 1.5rem}
h1{font-size:1.4rem;font-weight:900;margin-bottom:0.3rem}
h2{font-size:0.9rem;font-weight:700;color:#ffba09;text-transform:uppercase;letter-spacing:0.08em;margin:1.5rem 0 0.5rem}
.gold{color:#ffba09}
.sub{font-size:0.75rem;color:rgba(255,255,255,0.4);margin-bottom:1.5rem}
.row{display:flex;justify-content:space-between;padding:0.4rem 0;border-bottom:1px solid rgba(255,255,255,0.06);font-size:0.8rem}
.row .label{color:rgba(255,255,255,0.5)}
.row .value{font-weight:700;color:#fff}
table{width:100%;border-collapse:collapse;margin-top:0.5rem}
th{text-align:left;font-size:0.6rem;font-weight:700;color:#ffba09;text-transform:uppercase;letter-spacing:0.05em;padding:0.4rem 0;border-bottom:1px solid rgba(255,186,9,0.2)}
td{font-size:0.75rem;padding:0.35rem 0;border-bottom:1px solid rgba(255,255,255,0.04);color:rgba(255,255,255,0.5)}
td.w{font-weight:700;color:#fff}
td.g{color:#ffba09;font-weight:600}
tr.refeed{background:rgba(255,186,9,0.05)}
.summary{text-align:center;padding:1rem;background:rgba(255,186,9,0.04);border:1px solid rgba(255,186,9,0.1);border-radius:10px;margin-top:1rem}
.summary .big{font-size:1.1rem;font-weight:900}
.summary .sm{font-size:0.65rem;color:rgba(255,255,255,0.25);margin-top:0.15rem}
.footer{text-align:center;margin-top:2rem;font-size:0.55rem;color:rgba(255,255,255,0.15)}
@media print{body{padding:1rem}}
</style></head><body>
<h1>Jouw 90-Dagen Plan</h1>
<p class="sub">Gegenereerd door MY ARC Vetverlies Calculator</p>

<h2>Dagelijkse intake</h2>
<div class="row"><span class="label">Verbranding (TDEE)</span><span class="value">${result.tdee} kcal</span></div>
<div class="row"><span class="label">Target voor vetverlies</span><span class="value gold">${result.target} kcal</span></div>
<div class="row"><span class="label">Deficit per dag</span><span class="value">${result.deficit} kcal (${result.deficitPercent}%)</span></div>

<h2>Macro's per dag</h2>
<div class="row"><span class="label">Eiwit</span><span class="value">${result.proteinG}g</span></div>
<div class="row"><span class="label">Koolhydraten</span><span class="value">${result.carbG}g</span></div>
<div class="row"><span class="label">Vet</span><span class="value">${result.fatG}g</span></div>

<h2>Tijdlijn — week voor week</h2>
<table>
<tr><th>Week</th><th>Kcal/dag</th><th>Gewicht</th><th>Verloren</th></tr>
${result.timeline.map(r => `<tr${r.isRefeed ? ' class="refeed"' : ''}><td>${r.week}${r.isRefeed ? '*' : ''}</td><td>${r.kcal}${r.isRefeed ? ' (refeed)' : ''}</td><td class="w">${r.weight} kg</td><td class="g">-${r.lost} kg</td></tr>`).join('')}
</table>
${useRefeeds ? '<p style="font-size:0.55rem;color:rgba(255,255,255,0.2);margin-top:0.4rem">* = refeed week (maintenance intake)</p>' : ''}

<div class="summary">
<div class="big">Van <span style="color:#fff">${weight} kg</span> naar <span class="gold">~${result.goalWeight} kg</span></div>
<div class="sm">~${result.weeklyLoss} kg per week${useRefeeds ? ' (incl. refeed weken)' : ''}</div>
</div>

<div class="footer">MY ARC — Vetverlies Calculator<br>Dit plan is een indicatie. Voor persoonlijke begeleiding: kerstenscheffer op Instagram.</div>
</body></html>`

                const blob = new Blob([html], { type: 'text/html' })
                const url = URL.createObjectURL(blob)
                const win = window.open(url, '_blank')
                if (win) {
                  win.onload = () => {
                    setTimeout(() => win.print(), 500)
                  }
                }
              }} style={{
                fontFamily: pp, fontSize: isMobile ? '0.73rem' : '0.78rem', fontWeight: 800, color: '#000',
                background: goldButtonBg,
                borderRadius: '10px', padding: '0.7rem 1.5rem', cursor: 'pointer',
                touchAction: 'manipulation', display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                position: 'relative', overflow: 'hidden', border: 'none',
              }}>
                <div style={shimmerOverlay} />
                <span style={{ position: 'relative', zIndex: 1 }}>Download Mijn Plan (PDF)</span>
              </button>

              {/* Copy as text */}
              <button onClick={() => {
                const lines = result.timeline.map(r =>
                  `Week ${r.week}: ${r.kcal} kcal${r.isRefeed ? ' (refeed)' : ''} → ${r.weight} kg (-${r.lost} kg)`
                )
                const text = `JOUW 90-DAGEN VETVERLIES PLAN\n\nDagelijks: ${result.target} kcal\nEiwit: ${result.proteinG}g | Koolh: ${result.carbG}g | Vet: ${result.fatG}g\n\n${lines.join('\n')}\n\nVan ${weight} kg naar ~${result.goalWeight} kg`
                navigator.clipboard?.writeText(text).then(() => alert('Plan gekopieerd!')).catch(() => {})
              }} style={{
                fontFamily: pp, fontSize: isMobile ? '0.6rem' : '0.65rem', fontWeight: 600, color: 'rgba(255,255,255,0.3)',
                background: 'none', border: 'none', cursor: 'pointer',
                touchAction: 'manipulation', padding: '0.25rem',
              }}>
                Of kopieer als tekst
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 20px; height: 20px;
          border-radius: 50%;
          background: ${GOLD};
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(255,186,9,0.3);
        }
      `}</style>
    </section>
  )
}
